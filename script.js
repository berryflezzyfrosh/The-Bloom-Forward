/* ============================================================
   THE BLOOM FORWARD — Main JavaScript
   Vanilla JS only. Handles nav, animations, sliders, forms,
   gallery lightbox, donation UI, FAQ, and counters.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Helpers ---------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  /* ---------- Navbar scroll state ---------- */
  const navbar = $('#navbar');
  const updateNav = () => {
    if (!navbar) return;
    if (window.scrollY > 40) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  updateNav();
  on(window, 'scroll', updateNav, { passive: true });

  /* ---------- Mobile nav toggle ---------- */
  const hamburger = $('#hamburger');
  on(hamburger, 'click', () => {
    const open = hamburger.classList.toggle('open');
    document.body.classList.toggle('nav-mobile-open', open);
    hamburger.setAttribute('aria-expanded', String(open));
  });
  $$('.nav-link').forEach((link) => {
    on(link, 'click', () => {
      if (document.body.classList.contains('nav-mobile-open')) {
        hamburger.classList.remove('open');
        document.body.classList.remove('nav-mobile-open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  /* ---------- Scroll-to-top button ---------- */
  const scrollTopBtn = $('#scrollTop');
  const updateScrollTop = () => {
    if (!scrollTopBtn) return;
    if (window.scrollY > 600) scrollTopBtn.classList.add('visible');
    else scrollTopBtn.classList.remove('visible');
  };
  updateScrollTop();
  on(window, 'scroll', updateScrollTop, { passive: true });
  on(scrollTopBtn, 'click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Intersection-based reveal animations ---------- */
  const revealEls = $$('.fade-up, .fade-in, .slide-right');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  /* ---------- Progress bar fill on view ---------- */
  const progressFills = $$('.progress-fill[data-width]');
  if ('IntersectionObserver' in window && progressFills.length) {
    const pio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const w = entry.target.getAttribute('data-width');
          entry.target.style.width = w + '%';
          pio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    progressFills.forEach((el) => pio.observe(el));
  } else {
    progressFills.forEach((el) => {
      el.style.width = el.getAttribute('data-width') + '%';
    });
  }

  /* ---------- Animated counters ---------- */
  const counters = $$('.stat-number[data-count]');
  const formatNumber = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'K';
    return String(n);
  };
  const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-count'), 10);
    const prefix = el.getAttribute('data-prefix') || '';
    const duration = 1800;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.textContent = prefix + formatNumber(value);
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = prefix + formatNumber(target);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window && counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach((el) => {
      const t = parseInt(el.getAttribute('data-count'), 10);
      const p = el.getAttribute('data-prefix') || '';
      el.textContent = p + formatNumber(t);
    });
  }

  /* ---------- Testimonials slider ---------- */
  const track = $('#testimonialsTrack');
  if (track) {
    const slides = $$('.testimonial-card', track);
    const dotsWrap = $('#sliderDots');
    const prevBtn = $('#sliderPrev');
    const nextBtn = $('#sliderNext');
    let current = 0;
    const total = slides.length;
    if (dotsWrap) {
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
        on(dot, 'click', () => go(i));
        dotsWrap.appendChild(dot);
      });
    }
    const dots = $$('.slider-dot', dotsWrap);
    const go = (i) => {
      current = (i + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, idx) => d.classList.toggle('active', idx === current));
    };
    on(prevBtn, 'click', () => go(current - 1));
    on(nextBtn, 'click', () => go(current + 1));
    let timer = setInterval(() => go(current + 1), 6000);
    const slider = $('#testimonialsSlider');
    on(slider, 'mouseenter', () => clearInterval(timer));
    on(slider, 'mouseleave', () => {
      timer = setInterval(() => go(current + 1), 6000);
    });
  }

  /* ---------- Home: donation widget amount buttons ---------- */
  const daBtns = $$('.da-btn');
  if (daBtns.length) {
    const customWrap = $('#customInput');
    daBtns.forEach((btn) => {
      on(btn, 'click', () => {
        daBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.classList.contains('custom-btn') && customWrap) {
          customWrap.style.display = 'block';
        } else if (customWrap) {
          customWrap.style.display = 'none';
        }
      });
    });
  }

  /* ---------- Home: video modal ---------- */
  const playBtn = $('#playBtn');
  const videoModal = $('#videoModal');
  if (playBtn && videoModal) {
    const vmClose = $('#vmClose');
    const vmOverlay = $('#vmOverlay');
    const openModal = () => { videoModal.style.display = 'flex'; document.body.style.overflow = 'hidden'; };
    const closeModal = () => { videoModal.style.display = 'none'; document.body.style.overflow = ''; };
    on(playBtn, 'click', openModal);
    on(vmClose, 'click', closeModal);
    on(vmOverlay, 'click', closeModal);
    on(document, 'keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }

  /* ============================================================
     FORM SUBMISSION — all forms send to edge function
     ============================================================ */
  const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL)
    ? import.meta.env.VITE_SUPABASE_URL
    : '';
  const FORM_ENDPOINT = SUPABASE_URL
    ? `${SUPABASE_URL}/functions/v1/send-form-email`
    : '/functions/v1/send-form-email';

  async function submitForm(formType, formData, msgEl, successText) {
    if (msgEl) {
      msgEl.textContent = 'Sending...';
      msgEl.style.color = 'var(--gray-500)';
      msgEl.style.display = 'block';
    }
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType, formData }),
      });
      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Submission failed');
      }
      if (msgEl) {
        msgEl.textContent = result.warning
          ? 'Your submission was received. Email delivery is being configured.'
          : successText;
        msgEl.style.color = 'var(--success)';
        msgEl.style.display = 'block';
      }
      return true;
    } catch (err) {
      if (msgEl) {
        msgEl.textContent = 'Sorry, something went wrong. Please try again or email us directly.';
        msgEl.style.color = 'var(--error)';
        msgEl.style.display = 'block';
      }
      return false;
    }
  }

  function getHoneypot(form) {
    const hp = form.querySelector('input[name="_hp"]');
    return hp ? hp.value : '';
  }

  /* ---------- Newsletter form ---------- */
  $$('#newsletterForm').forEach((form) => {
    on(form, 'submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const msg = form.querySelector('.newsletter-msg') || $('#newsletterMsg');
      if (!input || !input.value || !/\S+@\S+\.\S+/.test(input.value)) {
        if (msg) {
          msg.textContent = 'Please enter a valid email address.';
          msg.style.color = 'var(--error)';
          msg.style.display = 'block';
        }
        return;
      }
      const sent = await submitForm('newsletter', { email: input.value, _hp: getHoneypot(form) }, msg, 'Thank you for subscribing! Check your inbox to confirm.');
      if (sent) form.reset();
    });
  });

  /* ---------- Programs page: tab switching ---------- */
  const progTabs = $$('.prog-tab');
  progTabs.forEach((tab) => {
    on(tab, 'click', () => {
      const target = tab.getAttribute('data-tab');
      progTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      $$('.prog-panel').forEach((p) => p.classList.remove('active'));
      const panel = $('#panel-' + target);
      if (panel) panel.classList.add('active');
    });
  });

  /* ---------- Donate page: amount selection ---------- */
  const daAmounts = $$('.da-amount');
  if (daAmounts.length) {
    const customWrap = $('#customAmountWrap');
    const customInput = $('#customAmount');
    const amountLabel = $('#donateAmountLabel');
    const typeLabel = $('#donateTypeLabel');
    const updateLabel = () => {
      const active = $('.da-amount.active');
      if (!active || !amountLabel) return;
      const amt = active.getAttribute('data-amount');
      if (amt === 'custom' && customInput && customInput.value) {
        amountLabel.textContent = '$' + customInput.value;
      } else if (amt !== 'custom') {
        amountLabel.textContent = '$' + amt;
      } else {
        amountLabel.textContent = '';
      }
    };
    daAmounts.forEach((btn) => {
      on(btn, 'click', () => {
        daAmounts.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const amt = btn.getAttribute('data-amount');
        if (amt === 'custom' && customWrap) {
          customWrap.style.display = 'block';
        } else if (customWrap) {
          customWrap.style.display = 'none';
        }
        updateLabel();
      });
    });
    on(customInput, 'input', updateLabel);

    const dtypeBtns = $$('.dtype-btn');
    dtypeBtns.forEach((btn) => {
      on(btn, 'click', () => {
        dtypeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (typeLabel) {
          typeLabel.textContent = btn.getAttribute('data-type') === 'monthly' ? '/month' : 'Once';
        }
      });
    });

    const payMethods = $$('.pay-method');
    const cardFields = $('#cardFields');
    payMethods.forEach((pm) => {
      on(pm, 'click', () => {
        payMethods.forEach((p) => p.classList.remove('active'));
        pm.classList.add('active');
        const radio = pm.querySelector('input');
        if (radio) radio.checked = true;
        if (cardFields) cardFields.style.display = radio && radio.value === 'card' ? 'block' : 'none';
      });
    });

    const donateSubmit = $('#donateSubmit');
    const donateMsg = $('#donateMsg');
    on(donateSubmit, 'click', async () => {
      const name = $('#dName');
      const email = $('#dEmail');
      if (!name || !name.value || !email || !email.value) {
        if (donateMsg) {
          donateMsg.textContent = 'Please fill in your name and email.';
          donateMsg.style.color = 'var(--error)';
          donateMsg.style.display = 'block';
        }
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email.value)) {
        if (donateMsg) {
          donateMsg.textContent = 'Please enter a valid email address.';
          donateMsg.style.color = 'var(--error)';
          donateMsg.style.display = 'block';
        }
        return;
      }
      const selectedAmount = $('.da-amount.active');
      let amount = '0';
      if (selectedAmount) {
        const amt = selectedAmount.getAttribute('data-amount');
        if (amt === 'custom') {
          const ci = $('#customAmount');
          amount = ci && ci.value ? ci.value : '0';
        } else {
          amount = amt;
        }
      }
      const programSelect = $('#dProgram');
      const dtypeBtn = $('.dtype-btn.active');
      const payRadio = document.querySelector('input[name="pay"]:checked');
      const formData = {
        dName: name.value,
        dEmail: email.value,
        dAmount: amount,
        dType: dtypeBtn && dtypeBtn.getAttribute('data-type') === 'monthly' ? 'Monthly' : 'One-Time',
        dProgram: programSelect ? programSelect.value : 'Where Most Needed',
        dPaymentMethod: payRadio ? payRadio.value : 'card',
        _hp: (document.querySelector('.donate-card input[name="_hp"]') || {}).value || '',
      };
      const sent = await submitForm('donation', formData, donateMsg, 'Thank you for your generosity! Your donation details have been received. We will contact you shortly.');
      if (sent) {
        const form = name.closest('form');
        if (form) form.reset();
      }
    });

    const cardNum = $('#cardNum');
    on(cardNum, 'input', () => {
      let v = cardNum.value.replace(/\D/g, '').slice(0, 16);
      v = v.replace(/(.{4})/g, '$1 ').trim();
      cardNum.value = v;
    });
    const cardExp = $('#cardExp');
    on(cardExp, 'input', () => {
      let v = cardExp.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
      cardExp.value = v;
    });
  }

  /* ---------- Volunteer form ---------- */
  const volunteerForm = $('#volunteerForm');
  if (volunteerForm) {
    on(volunteerForm, 'submit', async (e) => {
      e.preventDefault();
      const name = $('#vName');
      const email = $('#vEmail');
      const country = $('#vCountry');
      const msg = $('#volunteerMsg');
      if (!name.value || !email.value || !country.value) {
        if (msg) {
          msg.textContent = 'Please fill in all required fields.';
          msg.style.color = 'var(--error)';
          msg.style.display = 'block';
        }
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email.value)) {
        if (msg) {
          msg.textContent = 'Please enter a valid email address.';
          msg.style.color = 'var(--error)';
          msg.style.display = 'block';
        }
        return;
      }
      const formData = {
        vName: name.value,
        vEmail: email.value,
        vPhone: ($('#vPhone') || {}).value || '',
        vCountry: country.value,
        vProgram: ($('#vProgram') || {}).value || '',
        vAvailability: ($('#vAvailability') || {}).value || '',
        vSkills: ($('#vSkills') || {}).value || '',
        _hp: getHoneypot(volunteerForm),
      };
      const sent = await submitForm('volunteer', formData, msg, 'Thank you for applying to volunteer! Our coordinator will contact you within 5 business days.');
      if (sent) volunteerForm.reset();
    });
  }

  /* ---------- Contact form ---------- */
  const contactForm = $('#contactForm');
  if (contactForm) {
    on(contactForm, 'submit', async (e) => {
      e.preventDefault();
      const name = $('#cName');
      const email = $('#cEmail');
      const message = $('#cMessage');
      const msg = $('#contactMsg');
      if (!name.value || !email.value || !message.value) {
        if (msg) {
          msg.textContent = 'Please fill in all required fields.';
          msg.style.color = 'var(--error)';
          msg.style.display = 'block';
        }
        return;
      }
      if (!/\S+@\S+\.\S+/.test(email.value)) {
        if (msg) {
          msg.textContent = 'Please enter a valid email address.';
          msg.style.color = 'var(--error)';
          msg.style.display = 'block';
        }
        return;
      }
      const formData = {
        cName: name.value,
        cEmail: email.value,
        cPhone: ($('#cPhone') || {}).value || '',
        cSubject: ($('#cSubject') || {}).value || '',
        cMessage: message.value,
        _hp: getHoneypot(contactForm),
      };
      const sent = await submitForm('contact', formData, msg, "Thank you for reaching out! We'll respond within 48 hours.");
      if (sent) contactForm.reset();
    });
  }

  /* ---------- Gallery: filtering ---------- */
  const gfBtns = $$('.gf-btn');
  const galleryItems = $$('.gallery-item');
  gfBtns.forEach((btn) => {
    on(btn, 'click', () => {
      const filter = btn.getAttribute('data-filter');
      gfBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      galleryItems.forEach((item) => {
        const cat = item.getAttribute('data-cat');
        item.classList.toggle('hidden', filter !== 'all' && cat !== filter);
      });
    });
  });

  /* ---------- Gallery: lightbox ---------- */
  const lightbox = $('#lightbox');
  if (galleryItems.length && lightbox) {
    const lbImage = $('#lbImage');
    const lbCaption = $('#lbCaption');
    const lbClose = $('#lbClose');
    const lbOverlay = $('#lbOverlay');
    const lbPrev = $('#lbPrev');
    const lbNext = $('#lbNext');
    const lbCounter = $('#lbCounter');
    let currentIdx = 0;
    const visibleItems = () => galleryItems.filter((i) => !i.classList.contains('hidden'));

    const updateLb = (item) => {
      const img = item.querySelector('img');
      lbImage.src = img.src;
      lbImage.alt = img.alt;
      const tag = item.querySelector('.gi-tag');
      lbCaption.textContent = tag ? tag.textContent + ' — ' + img.alt : img.alt;
      if (lbCounter) {
        lbCounter.textContent = (currentIdx + 1) + ' / ' + visibleItems().length;
      }
    };
    const openLB = (idx) => {
      const items = visibleItems();
      currentIdx = idx;
      updateLb(items[idx]);
      lightbox.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    };
    const closeLB = () => {
      lightbox.style.display = 'none';
      document.body.style.overflow = '';
    };
    const navLB = (dir) => {
      const items = visibleItems();
      currentIdx = (currentIdx + dir + items.length) % items.length;
      updateLb(items[currentIdx]);
    };

    galleryItems.forEach((item) => {
      on(item, 'click', () => openLB(visibleItems().indexOf(item)));
    });
    on(lbClose, 'click', closeLB);
    on(lbOverlay, 'click', closeLB);
    on(lbPrev, 'click', () => navLB(-1));
    on(lbNext, 'click', () => navLB(1));
    on(document, 'keydown', (e) => {
      if (lightbox.style.display !== 'flex') return;
      if (e.key === 'Escape') closeLB();
      if (e.key === 'ArrowLeft') navLB(-1);
      if (e.key === 'ArrowRight') navLB(1);
    });
  }

  /* ---------- Blog: filtering ---------- */
  const bfBtns = $$('.bf-btn');
  const blogCards = $$('.blog-card');
  bfBtns.forEach((btn) => {
    on(btn, 'click', () => {
      const filter = btn.getAttribute('data-filter');
      bfBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      blogCards.forEach((card) => {
        const cat = card.getAttribute('data-cat');
        card.classList.toggle('hidden', filter !== 'all' && cat !== filter);
      });
    });
  });

  /* ---------- Blog: load more ---------- */
  const loadMoreBtn = $('#loadMoreBtn');
  on(loadMoreBtn, 'click', () => {
    loadMoreBtn.textContent = 'All articles loaded';
    loadMoreBtn.disabled = true;
    loadMoreBtn.style.opacity = '0.6';
  });

  /* ---------- FAQ accordion ---------- */
  const faqItems = $$('.faq-item');
  faqItems.forEach((item) => {
    const q = item.querySelector('.faq-q');
    on(q, 'click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach((i) => {
        i.classList.remove('open');
        const qq = i.querySelector('.faq-q');
        if (qq) qq.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------- Events page: tab switching ---------- */
  const evTabs = $$('.ev-tab');
  evTabs.forEach((tab) => {
    on(tab, 'click', () => {
      const target = tab.getAttribute('data-tab');
      evTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      $$('.ev-panel').forEach((p) => p.classList.remove('active'));
      const panel = $('#panel-' + target);
      if (panel) panel.classList.add('active');
    });
  });

  /* ---------- Testimonials page: filter ---------- */
  const tfBtns = $$('.tf-btn');
  const testiCards = $$('.testi-card');
  tfBtns.forEach((btn) => {
    on(btn, 'click', () => {
      const filter = btn.getAttribute('data-filter');
      tfBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      testiCards.forEach((card) => {
        const cat = card.getAttribute('data-cat');
        card.classList.toggle('hidden', filter !== 'all' && cat !== filter);
      });
    });
  });

  /* ---------- FAQ page: category switching ---------- */
  const faqCatBtns = $$('.faq-cat-btn');
  faqCatBtns.forEach((btn) => {
    on(btn, 'click', () => {
      const cat = btn.getAttribute('data-cat');
      faqCatBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      $$('.faq-group').forEach((g) => g.classList.remove('active'));
      const group = document.querySelector('.faq-group[data-group="' + cat + '"]');
      if (group) group.classList.add('active');
    });
  });

  /* ---------- Smooth anchor scrolling ---------- */
  $$('a[href^="#"]:not([href="#"])').forEach((a) => {
    on(a, 'click', (e) => {
      const id = a.getAttribute('href');
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

})();
