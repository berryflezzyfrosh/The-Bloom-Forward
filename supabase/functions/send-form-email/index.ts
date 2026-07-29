import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RECIPIENT_EMAIL = "berryflezzyfrosh@gmail.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function escapeHtml(text: string): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmailHtml(formType: string, data: Record<string, unknown>): string {
  const rows = Object.entries(data)
    .filter(([key]) => key !== "_hp")
    .map(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase())
        .replace(/_/g, " ");
      const displayValue =
        typeof value === "string" || typeof value === "number"
          ? escapeHtml(value)
          : escapeHtml(JSON.stringify(value));
      return `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#0f766e;width:40%;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#334155;vertical-align:top">${displayValue}</td></tr>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>New ${escapeHtml(formType)} submission</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:24px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
        <tr><td style="background:#0d4a4a;padding:24px 32px">
          <h1 style="margin:0;color:#ffffff;font-size:22px">New ${escapeHtml(formType)} Submission</h1>
          <p style="margin:4px 0 0;color:#99d6d6;font-size:13px">The Bloom Forward — Website Form</p>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
            ${rows}
          </table>
        </td></tr>
        <tr><td style="padding:16px 32px 24px">
          <p style="margin:0;color:#64748b;font-size:12px">This email was sent from the contact form on The Bloom Forward website.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildEmailText(formType: string, data: Record<string, unknown>): string {
  const lines = Object.entries(data)
    .filter(([key]) => key !== "_hp")
    .map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, " $1").replace(/_/g, " ");
      const val = typeof value === "string" || typeof value === "number" ? value : JSON.stringify(value);
      return `${label}: ${val}`;
    })
    .join("\n");
  return `New ${formType} submission from The Bloom Forward website:\n\n${lines}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { formType, formData } = body;

    if (!formType || !formData || typeof formData !== "object") {
      return new Response(
        JSON.stringify({ error: "Missing formType or formData" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Honeypot check — if _hp field is filled, it's a bot
    if (formData._hp) {
      return new Response(
        JSON.stringify({ success: true, message: "Submission received" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic validation
    const requiredFields: Record<string, string[]> = {
      contact: ["cName", "cEmail", "cMessage"],
      volunteer: ["vName", "vEmail", "vCountry"],
      donation: ["dName", "dEmail"],
      newsletter: ["email"],
    };

    const required = requiredFields[formType] || [];
    for (const field of required) {
      if (!formData[field] || String(formData[field]).trim() === "") {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Email validation
    const emailField = formData.cEmail || formData.vEmail || formData.dEmail || formData.email;
    if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(emailField))) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const submitterName = formData.cName || formData.vName || formData.dName || "Newsletter Subscriber";
    const submitterEmail = emailField || "";

    const { error: dbError } = await supabase
      .from("form_submissions")
      .insert({
        form_type: formType,
        submitter_name: String(submitterName),
        submitter_email: String(submitterEmail),
        payload: formData,
      });

    if (dbError) {
      console.error("Database error:", dbError.message);
    }

    // Send email via Resend
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Your submission was received. (Email delivery is being configured.)",
          warning: "Email service not yet configured",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = buildEmailHtml(formType, formData);
    const emailText = buildEmailText(formType, formData);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Bloom Forward <onboarding@resend.dev>",
        to: RECIPIENT_EMAIL,
        subject: `New ${formType} submission — ${submitterName}`,
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error("Resend API error:", errText);
      return new Response(
        JSON.stringify({ error: "Failed to send email. Please try again later." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Your submission was sent successfully!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
