/* ============================================================
   DEZIL DERMO — main.js v1.4
   ============================================================ */

const DEST_EMAIL = 'profiltest.1979@gmail.com';

/* ── Slider avant/après ──────────────────────────────────── */
function activateSliders() {
  document.querySelectorAll('.ba-slider').forEach(slider => {
    if (slider.dataset.ready) return;
    slider.dataset.ready = '1';
    const after   = slider.querySelector('.ba-after');
    const divider = slider.querySelector('.ba-divider');
    const handle  = slider.querySelector('.ba-handle');
    let drag = false;
    const setPos = x => {
      const r = slider.getBoundingClientRect();
      const p = Math.min(Math.max(0, (x - r.left) / r.width * 100), 100);
      if (after)   after.style.clipPath = `inset(0 ${100-p}% 0 0)`;
      if (divider) divider.style.left   = p + '%';
      if (handle)  handle.style.left    = p + '%';
    };
    slider.addEventListener('mousedown',  e => { drag=true; setPos(e.clientX); e.preventDefault(); });
    window.addEventListener('mousemove',  e => { if(drag) setPos(e.clientX); });
    window.addEventListener('mouseup',    () => { drag=false; });
    slider.addEventListener('touchstart', e => { drag=true; setPos(e.touches[0].clientX); },{passive:true});
    slider.addEventListener('touchmove',  e => { if(drag) setPos(e.touches[0].clientX); },{passive:true});
    slider.addEventListener('touchend',   () => { drag=false; });
  });
}

/* ── Galerie dynamique depuis GALLERY_DATA ───────────────── */
function buildGallery() {
  const grid = document.getElementById('galerieGrid');
  const data = window.GALLERY_DATA;
  if (!grid || !data || !data.length) return;
  grid.innerHTML = '';
  const handleSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/><polyline points="12 5 5 12 12 19"/></svg>`;
  data.forEach(item => {
    const art = document.createElement('article');
    art.className = 'before-after-card';
    art.setAttribute('data-cat', item.cat || 'all');
    art.innerHTML = `
      <div class="ba-slider">
        <div class="ba-before">
          <img src="${item.before}" alt="Avant — ${item.title}" loading="lazy" draggable="false"
               onerror="this.parentElement.innerHTML='<div class=\\'img-placeholder\\'><span>AVANT</span></div>'"/>
        </div>
        <div class="ba-after">
          <img src="${item.after}" alt="Après — ${item.title}" loading="lazy" draggable="false"
               onerror="this.parentElement.innerHTML='<div class=\\'img-placeholder\\'><span>APRÈS</span></div>'"/>
        </div>
        <div class="ba-divider"></div>
        <div class="ba-handle">${handleSVG}</div>
        <div class="ba-labels"><span>Avant</span><span>Après</span></div>
      </div>
      <div class="ba-info">
        <h3 class="ba-title">${item.title}</h3>
        <p class="ba-desc">${item.desc}</p>
      </div>`;
    grid.appendChild(art);
  });
  activateSliders();
  /* Bloquer clic-droit sur images galerie */
  grid.querySelectorAll('img').forEach(img => {
    img.addEventListener('contextmenu', e => e.preventDefault());
    img.addEventListener('dragstart',   e => e.preventDefault());
  });
}

/* ── Popups pathologies — CSS-first + JS toggle mobile ──── */
function initPopups() {
  /* Sur mobile il n'y a pas de hover → toggle class au clic */
  document.querySelectorAll('.type-pill').forEach(pill => {
    pill.addEventListener('click', e => {
      e.stopPropagation();
      const wasOpen = pill.classList.contains('popup-open');
      document.querySelectorAll('.type-pill.popup-open').forEach(p => p.classList.remove('popup-open'));
      if (!wasOpen) pill.classList.add('popup-open');
    });
  });
  document.addEventListener('click', () =>
    document.querySelectorAll('.type-pill.popup-open').forEach(p => p.classList.remove('popup-open'))
  );
}

/* ── Captcha — checkbox native ───────────────────────────── */
function initCaptcha() {
  const native    = document.getElementById('captchaNative');
  const submitBtn = document.getElementById('submitBtn');
  if (!native || !submitBtn) return;
  native.addEventListener('change', () => {
    submitBtn.disabled = !native.checked;
    document.getElementById('captchaWrap').classList.toggle('checked', native.checked);
  });
}

/* ── Formulaire — HTML POST natif vers FormSubmit ────────── */
function initForm() {
  /* Le formulaire utilise action="https://formsubmit.co/DEST_EMAIL" method="POST"
     posé directement dans le HTML → zéro JS requis pour l'envoi.
     Ce code gère juste la validation côté client. */
  const form = document.getElementById('resaForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    const native = document.getElementById('captchaNative');
    if (native && !native.checked) { e.preventDefault(); return; }
    /* Laisser le POST natif se faire — pas de fetch, pas de mailto */
  });
}

/* ── Compteur animé ──────────────────────────────────────── */
function initCounters() {
  document.querySelectorAll('[data-count]').forEach(el => {
    const obs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      const dur    = 1400;
      let start;
      const step = ts => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        el.textContent = Math.floor(p * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.5 });
    obs.observe(el);
  });
}

/* ── Animations fade-up ──────────────────────────────────── */
function initFadeUp() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.06 });
  document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
}

/* ── Navbar ──────────────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const tick = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', tick, { passive: true });
  tick();

  document.querySelectorAll('section[id]').forEach(s => {
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting)
        document.querySelectorAll('.nav-links a').forEach(a =>
          a.classList.toggle('active', a.getAttribute('href') === '#' + s.id)
        );
    }, { threshold: 0.35 }).observe(s);
  });

  const hamburger   = document.getElementById('hamburger');
  const mobileMenu  = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');
  hamburger  && hamburger.addEventListener('click',  () => mobileMenu.classList.add('open'));
  mobileClose && mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
  document.querySelectorAll('.mobile-menu a').forEach(a =>
    a.addEventListener('click', () => mobileMenu.classList.remove('open'))
  );

  /* Smooth scroll */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: t.offsetTop - navbar.offsetHeight - 12, behavior: 'smooth' });
    });
  });
}

/* ── Loader ──────────────────────────────────────────────── */
function initLoader() {
  const loader = document.getElementById('loader');
  if (!loader) return;
  window.addEventListener('load', () => setTimeout(() => loader.classList.add('hidden'), 600));
}

/* ── Bloquer clic-droit global sur images ────────────────── */
function initNoDrag() {
  document.addEventListener('contextmenu', e => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });
  document.addEventListener('dragstart', e => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });
}

/* ═══════════════ BOOT ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initNavbar();
  initFadeUp();
  initCounters();
  initPopups();
  initCaptcha();
  initForm();
  buildGallery();
  initNoDrag();
});
