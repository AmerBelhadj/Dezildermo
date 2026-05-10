/* ============================================================
   DEZIL DERMO — JavaScript principal
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Loader ──────────────────────────────────────────────────
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hidden'), 900);
  });

  // ── Navbar scroll ───────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ── Active nav link ─────────────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
        });
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => observer.observe(s));

  // ── Mobile menu ─────────────────────────────────────────────
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');

  hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
  mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });

  // ── Fade-up on scroll ───────────────────────────────────────
  const fadeEls = document.querySelectorAll('.fade-up');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        fadeObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  fadeEls.forEach(el => fadeObserver.observe(el));

  // ── Before / After slider ───────────────────────────────────
  document.querySelectorAll('.ba-slider').forEach(slider => {
    const after    = slider.querySelector('.ba-after');
    const divider  = slider.querySelector('.ba-divider');
    const handle   = slider.querySelector('.ba-handle');
    let isDragging = false;

    const setPos = (pos) => {
      const rect = slider.getBoundingClientRect();
      const pct  = Math.min(Math.max(0, (pos - rect.left) / rect.width * 100), 100);
      after.style.clipPath    = `inset(0 ${100 - pct}% 0 0)`;
      divider.style.left      = pct + '%';
      handle.style.left       = pct + '%';
    };

    // Mouse
    slider.addEventListener('mousedown', e => { isDragging = true; setPos(e.clientX); });
    window.addEventListener('mousemove', e => { if (isDragging) setPos(e.clientX); });
    window.addEventListener('mouseup',   () => { isDragging = false; });

    // Touch
    slider.addEventListener('touchstart', e => { isDragging = true; setPos(e.touches[0].clientX); }, { passive: true });
    slider.addEventListener('touchmove',  e => { if (isDragging) setPos(e.touches[0].clientX); }, { passive: true });
    slider.addEventListener('touchend',   () => { isDragging = false; });
  });

  // ── Réservation form submit ──────────────────────────────────
  const form = document.getElementById('resaForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const body = `Nom: ${data.nom}%0ATéléphone: ${data.tel}%0AEmail: ${data.email}%0APrestation: ${data.prestation}%0ADate souhaitée: ${data.date}%0AMessage: ${data.message || ''}`;
      window.location.href = `mailto:contact@dezildermo.fr?subject=Demande de réservation — ${data.nom}&body=${body}`;
    });
  }

  // ── Smooth scroll for CTA ────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = navbar.offsetHeight + 16;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    });
  });

  // ── Galerie filter (si des catégories) ──────────────────────
  document.querySelectorAll('.galerie-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.galerie-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      document.querySelectorAll('.before-after-card').forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.cat === cat) ? 'block' : 'none';
      });
    });
  });

  // ── Counter animation ────────────────────────────────────────
  const animateCounter = (el, target, duration = 1500) => {
    let start = 0;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      el.textContent = Math.floor(progress * target) + (el.dataset.suffix || '');
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const counters = document.querySelectorAll('[data-count]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target, parseInt(e.target.dataset.count));
        counterObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObserver.observe(el));

});
