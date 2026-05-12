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

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const allValid = requiredFields.reduce((acc, field) => {
        return validateField(field) && acc;
      }, true);

      if (!allValid) {
        const firstInvalid = requiredFields.find(f => f.classList.contains('error'));
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const submitBtn = form.querySelector('.btn-submit');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<span>Sending...</span><i class="fa-solid fa-circle-notch fa-spin"></i>';
      submitBtn.disabled = true;

      const formData = new FormData(form);

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();

        if (data.success) {
          form.setAttribute('aria-hidden', 'true');
          form.style.display = 'none';
          if (formSuccess) {
            formSuccess.hidden = false;
            formSuccess.focus();
          }
        } else {
          alert('Something went wrong. Please try again.');
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }
      } catch (error) {
        alert('Failed to send message. Please check your connection and try again.');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // Canvas white background stripping removed as images are now natively transparent PNGs.
})();
