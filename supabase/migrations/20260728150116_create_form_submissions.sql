/*
# Create form_submissions table

1. New Tables
- `form_submissions`
  - `id` (uuid, primary key)
  - `form_type` (text, not null) — which form was submitted: contact, volunteer, donation, newsletter
  - `submitter_name` (text)
  - `submitter_email` (text)
  - `payload` (jsonb, not null) — full form data as JSON
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `form_submissions`.
- Allow anon + authenticated INSERT only (public can submit forms, cannot read).
- No SELECT/UPDATE/DELETE for anon (only service role can read, used by edge function).

3. Notes
- This is a no-auth public form submission table.
- The edge function reads from this table using the service role key.
- Email sending is handled by the edge function, not the database.
*/

CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL,
  submitter_name text,
  submitter_email text,
  payload jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_form_submissions" ON form_submissions;
CREATE POLICY "anon_insert_form_submissions"
ON form_submissions FOR INSERT
TO anon, authenticated
WITH CHECK (true);
