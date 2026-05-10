/* ============================================================
   FaLuLu Ltd — main.js
   Scroll behaviour, animations, counter, parallax, form
   ============================================================ */

(function () {
  'use strict';

  /* ── Nav scroll state ───────────────────────────────────── */
  const navbar = document.getElementById('navbar');

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 80);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  /* ── Mobile nav toggle ──────────────────────────────────── */
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu   = document.querySelector('.nav-menu');

  function closeNav() {
    navMenu.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on any link click
  navMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (navMenu.classList.contains('open') &&
        !navMenu.contains(e.target) &&
        !navToggle.contains(e.target)) {
      closeNav();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) closeNav();
  });

  /* ── Scroll-reveal (IntersectionObserver) ───────────────── */
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isReducedMotion) {
    const fadeEls = document.querySelectorAll('.fade-in');

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -48px 0px'
    });

    fadeEls.forEach(el => revealObserver.observe(el));
  } else {
    // Immediately show all elements when motion is reduced
    document.querySelectorAll('.fade-in').forEach(el => el.classList.add('animated'));
  }

  /* ── Animated counters ──────────────────────────────────── */
  const counters = document.querySelectorAll('[data-target]');
  let countersTriggered = false;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const suffix   = el.dataset.suffix || '';
    const duration = 1600;
    const start    = performance.now();

    function tick(now) {
      const elapsed  = Math.min(now - start, duration);
      const progress = easeOutCubic(elapsed / duration);
      el.textContent = Math.round(progress * target) + suffix;
      if (elapsed < duration) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const aboutSection = document.getElementById('about');
  if (aboutSection && counters.length) {
    const counterObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !countersTriggered) {
        countersTriggered = true;
        counters.forEach(animateCounter);
        counterObserver.disconnect();
      }
    }, { threshold: 0.35 });

    counterObserver.observe(aboutSection);
  }

  /* ── Hero parallax (desktop, reduced-motion guard) ─────── */
  const hero = document.querySelector('.hero');
  const desktopMQ = window.matchMedia('(min-width: 769px)');

  function applyParallax() {
    if (!hero) return;
    const offset = window.scrollY * 0.32;
    hero.style.backgroundPositionY = `calc(40% + ${offset}px)`;
  }

  function startParallax() {
    window.addEventListener('scroll', applyParallax, { passive: true });
  }

  function stopParallax() {
    window.removeEventListener('scroll', applyParallax);
    if (hero) hero.style.backgroundPositionY = '';
  }

  if (!isReducedMotion) {
    if (desktopMQ.matches) startParallax();
    desktopMQ.addEventListener('change', e => e.matches ? startParallax() : stopParallax());
  }

  /* ── Active nav link on scroll ──────────────────────────── */
  const sections = document.querySelectorAll('section[id], .hero[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle(
        'active',
        link.getAttribute('href') === `#${current}`
      );
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });

  /* ── Contact form validation ────────────────────────────── */
  const form        = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');

  function getError(field) {
    return document.getElementById(`${field.id}-error`);
  }

  function clearFieldError(field) {
    field.classList.remove('error');
    const errEl = getError(field);
    if (errEl) errEl.textContent = '';
  }

  function showFieldError(field, message) {
    field.classList.add('error');
    const errEl = getError(field);
    if (errEl) errEl.textContent = message;
  }

  function validateField(field) {
    clearFieldError(field);

    const value = field.value.trim();

    if (field.required && !value) {
      showFieldError(field, 'This field is required.');
      return false;
    }

    if (field.type === 'email' && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        showFieldError(field, 'Please enter a valid email address.');
        return false;
      }
    }

    return true;
  }

  if (form) {
    const requiredFields = Array.from(form.querySelectorAll('[required]'));

    requiredFields.forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) validateField(field);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const allValid = requiredFields.reduce((acc, field) => {
        return validateField(field) && acc;
      }, true);

      if (!allValid) {
        // Focus the first invalid field
        const firstInvalid = requiredFields.find(f => f.classList.contains('error'));
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Success state
      form.setAttribute('aria-hidden', 'true');
      form.style.display = 'none';
      if (formSuccess) {
        formSuccess.hidden = false;
        formSuccess.focus();
      }
    });
  }

  /* ── Nav icon — strip white background via Canvas ──────── */
  // logo-icon.png has a white background baked into the PNG.
  // Canvas pixel manipulation sets near-white pixels to alpha=0
  // so the FL globe mark appears in original navy/gold on dark bg.
  const navIconImg = document.querySelector('.nav-icon-img');

  function removeWhiteBg(imgEl) {
    // Guard: skip if already processed (src is a data URL)
    if (!imgEl || imgEl.src.startsWith('data:')) return;
    try {
      const canvas  = document.createElement('canvas');
      const ctx     = canvas.getContext('2d');
      canvas.width  = imgEl.naturalWidth  || 1000;
      canvas.height = imgEl.naturalHeight || 1000;
      ctx.drawImage(imgEl, 0, 0);
      const id   = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = id.data;
      const threshold = 238;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > threshold && data[i + 1] > threshold && data[i + 2] > threshold) {
          data[i + 3] = 0; // transparent
        }
      }
      ctx.putImageData(id, 0, 0);
      imgEl.src = canvas.toDataURL('image/png');
    } catch (err) {
      // Tainted canvas (cross-origin) — leave as-is
    }
  }

  if (navIconImg) {
    if (navIconImg.complete && navIconImg.naturalWidth > 0) {
      removeWhiteBg(navIconImg);
    } else {
      navIconImg.addEventListener('load', function () { removeWhiteBg(this); }, { once: true });
    }
  }

})();
