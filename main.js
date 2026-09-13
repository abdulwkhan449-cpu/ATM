/* =========================================================
   ATM FRANCHISE — MAIN SCRIPT
   Handles: mobile nav, dropdown, sticky header, scroll reveal,
            lead form validation & submission, footer year
   ========================================================= */

(function () {
  'use strict';

  /* ---------- Utilities ---------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================
     1. STICKY HEADER — shadow on scroll
     ========================================================= */
  const header = $('#siteHeader');

  if (header) {
    const onScroll = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* =========================================================
     2. MOBILE NAVIGATION
     ========================================================= */
  const navToggle  = $('#navToggle');
  const mainNav    = $('#mainNav');
  const navOverlay = $('#navOverlay');

  const closeNav = () => {
    if (!mainNav || !navToggle) return;
    mainNav.classList.remove('is-open');
    navToggle.classList.remove('is-active');
    navToggle.setAttribute('aria-expanded', 'false');
    if (navOverlay) navOverlay.hidden = true;
    document.body.style.overflow = '';
  };

  const openNav = () => {
    if (!mainNav || !navToggle) return;
    mainNav.classList.add('is-open');
    navToggle.classList.add('is-active');
    navToggle.setAttribute('aria-expanded', 'true');
    if (navOverlay) navOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
  };

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      mainNav.classList.contains('is-open') ? closeNav() : openNav();
    });
  }

  if (navOverlay) navOverlay.addEventListener('click', closeNav);

  // Close nav when a link inside it is clicked
  if (mainNav) {
    $$('a', mainNav).forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 900) closeNav();
      });
    });
  }

  // Close nav with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNav();
      closeDropdowns();
    }
  });

  // Reset nav state on resize to desktop
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 900) closeNav();
    }, 150);
  });

  /* =========================================================
     3. DROPDOWN MENUS
     ========================================================= */
  const dropdownParents = $$('.has-dropdown');

  function closeDropdowns(except) {
    dropdownParents.forEach((parent) => {
      if (parent === except) return;
      parent.classList.remove('is-open');
      const btn = $('.nav-drop-toggle', parent);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  dropdownParents.forEach((parent) => {
    const toggle = $('.nav-drop-toggle', parent);
    if (!toggle) return;

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !parent.classList.contains('is-open');
      closeDropdowns(parent);
      parent.classList.toggle('is-open', willOpen);
      toggle.setAttribute('aria-expanded', String(willOpen));
    });

    // Desktop hover behaviour
    if (window.matchMedia('(hover: hover)').matches) {
      let hoverTimer;
      parent.addEventListener('mouseenter', () => {
        if (window.innerWidth <= 900) return;
        clearTimeout(hoverTimer);
        closeDropdowns(parent);
        parent.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      });
      parent.addEventListener('mouseleave', () => {
        if (window.innerWidth <= 900) return;
        hoverTimer = setTimeout(() => {
          parent.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
        }, 180);
      });
    }
  });

  // Click outside closes dropdowns
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.has-dropdown')) closeDropdowns();
  });

  /* =========================================================
     4. SMOOTH SCROLL for in-page anchors
     ========================================================= */
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (!id || id === '#' || id.length < 2) return;

      const target = document.getElementById(id.slice(1));
      if (!target) return;

      e.preventDefault();

      const headerOffset = header ? header.offsetHeight + 16 : 0;
      const top =
        target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });

      // Move focus for accessibility
      target.setAttribute('tabindex', '-1');
      setTimeout(() => target.focus({ preventScroll: true }), 320);
    });
  });

  /* =========================================================
     5. SCROLL REVEAL
     ========================================================= */
  const revealEls = $$('.reveal');

  if (revealEls.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    } else {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
      );

      revealEls.forEach((el) => observer.observe(el));
    }
  }

  /* =========================================================
     6. LEAD FORM — validation & submission
     ========================================================= */
  const form = $('#leadForm');

  if (form) {
    const successBox = $('#formSuccess');

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const PHONE_RE = /^[\d\s()+\-.]{7,20}$/;

    const validators = {
      firstName: (v) => (v.trim() ? '' : 'Please enter your first name.'),
      lastName:  (v) => (v.trim() ? '' : 'Please enter your last name.'),
      phone: (v) => {
        if (!v.trim()) return 'Please enter your phone number.';
        if (!PHONE_RE.test(v.trim())) return 'Please enter a valid phone number.';
        return '';
      },
      email: (v) => {
        if (!v.trim()) return 'Please enter your email address.';
        if (!EMAIL_RE.test(v.trim())) return 'Please enter a valid email address.';
        return '';
      },
      interest: (v) => (v ? '' : 'Please select a business opportunity.'),
      timeline: (v) => (v ? '' : 'Please select a timeline.'),
    };

    const setError = (name, message) => {
      const field = form.elements[name];
      if (!field) return;
      const fieldWrap = field.closest('.field');
      const errorEl = $(`[data-error-for="${name}"]`, form);

      if (message) {
        fieldWrap?.classList.add('has-error');
        field.setAttribute('aria-invalid', 'true');
        if (errorEl) errorEl.textContent = message;
      } else {
        fieldWrap?.classList.remove('has-error');
        field.removeAttribute('aria-invalid');
        if (errorEl) errorEl.textContent = '';
      }
    };

    const validateField = (name) => {
      const validate = validators[name];
      if (!validate) return true;
      const field = form.elements[name];
      const message = validate(field.value);
      setError(name, message);
      return !message;
    };

    // Live validation on blur + on input once touched
    Object.keys(validators).forEach((name) => {
      const field = form.elements[name];
      if (!field) return;

      field.addEventListener('blur', () => validateField(name));

      const liveEvent = field.tagName === 'SELECT' ? 'change' : 'input';
      field.addEventListener(liveEvent, () => {
        if (field.closest('.field')?.classList.contains('has-error')) {
          validateField(name);
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let firstInvalid = null;
      let allValid = true;

      Object.keys(validators).forEach((name) => {
        const ok = validateField(name);
        if (!ok && !firstInvalid) firstInvalid = form.elements[name];
        allValid = allValid && ok;
      });

      if (!allValid) {
        firstInvalid?.focus();
        return;
      }

      // ---- Simulated submission ----
      const submitBtn = $('button[type="submit"]', form);
      const originalLabel = submitBtn ? submitBtn.textContent : '';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      /*
        ---------------------------------------------------------
        Replace this setTimeout with a real fetch() to your
        backend endpoint, e.g.:

        fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.fromEntries(new FormData(form)))
        })
        .then(res => { if (!res.ok) throw new Error('Request failed'); ... })
        .catch(() => { ... });
        ---------------------------------------------------------
      */
      setTimeout(() => {
        const data = Object.fromEntries(new FormData(form));
        console.log('[ATM Franchise] Lead submitted:', data);

        form.reset();

        // Clear any lingering error states
        $$('.field', form).forEach((f) => f.classList.remove('has-error'));
        $$('.field-error', form).forEach((el) => (el.textContent = ''));

        if (successBox) {
          successBox.hidden = false;
          successBox.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'center',
          });

          // Auto-hide the success message after a while
          setTimeout(() => {
            successBox.hidden = true;
          }, 9000);
        }

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      }, 850);
    });
  }

  /* =========================================================
     7. FOOTER — dynamic year
     ========================================================= */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

})();
