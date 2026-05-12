/* ============================================================
   DEZIL DERMO — main.js v1.4
   ============================================================ */

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

/* ── Formulaire — fetch() vers php/send.php (backend PHP) ── */
function initForm() {
  const form       = document.getElementById('resaForm');
  const successMsg = document.getElementById('formSuccess');
  const submitBtn  = document.getElementById('submitBtn');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    /* Vérif captcha */
    const captcha = document.getElementById('captchaNative');
    if (!captcha || !captcha.checked) return;

    /* Vérif champs requis */
    const required = form.querySelectorAll('[required]');
    let valid = true;
    required.forEach(el => {
      if (!el.value.trim()) { el.style.borderColor = '#e53e3e'; valid = false; }
      else el.style.borderColor = '';
    });
    if (!valid) {
      showFormError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    /* Désactiver le bouton pendant l'envoi */
    submitBtn.disabled  = true;
    submitBtn.innerHTML = '<span style="opacity:.65">Envoi en cours…</span>';

    try {
      const formData = new FormData(form);
      const res  = await fetch('php/send.php', { method: 'POST', body: formData });
      const json = await res.json();

      if (json.success) {
        form.style.display = 'none';
        successMsg.classList.add('visible');
      } else {
        showFormError(json.message || 'Une erreur est survenue. Veuillez réessayer.');
        resetSubmit();
      }
    } catch (err) {
      showFormError('Erreur réseau. Vérifiez votre connexion et réessayez.');
      resetSubmit();
    }
  });

  function resetSubmit() {
    submitBtn.disabled  = false;
    submitBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Envoyer ma demande`;
  }

  function showFormError(msg) {
    let errEl = document.getElementById('formError');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.id = 'formError';
      errEl.style.cssText = 'color:#e53e3e;font-size:.82rem;margin-bottom:12px;padding:10px 14px;background:rgba(229,62,62,.08);border:1px solid rgba(229,62,62,.3);border-radius:4px';
      submitBtn.before(errEl);
    }
    errEl.textContent = msg;
  }
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


/* ── Upload photos ───────────────────────────────────────── */
function initUpload() {
  const zone      = document.getElementById('uploadZone');
  const input     = document.getElementById('photoInput');
  const previews  = document.getElementById('uploadPreviews');
  const info      = document.getElementById('uploadInfo');
  if (!zone || !input) return;

  const MAX_FILES = 3;
  const MAX_SIZE  = 5 * 1024 * 1024; // 5 Mo
  const ACCEPTED  = ['image/jpeg', 'image/png', 'image/webp'];
  let selectedFiles = [];   // DataTransfer pour gérer la liste

  /* ── Affiche / met à jour les previews ── */
  function renderPreviews() {
    previews.innerHTML = '';
    zone.classList.toggle('has-files', selectedFiles.length > 0);
    info.textContent = '';
    info.className = 'upload-info';

    selectedFiles.forEach((file, idx) => {
      const item = document.createElement('div');
      item.className = 'preview-item';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      img.addEventListener('contextmenu', e => e.preventDefault());
      img.addEventListener('dragstart',   e => e.preventDefault());
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preview-remove';
      btn.innerHTML = '✕';
      btn.setAttribute('aria-label', 'Supprimer ' + file.name);
      btn.addEventListener('click', e => {
        e.stopPropagation();
        selectedFiles.splice(idx, 1);
        syncInput();
        renderPreviews();
      });
      item.appendChild(img);
      item.appendChild(btn);
      previews.appendChild(item);
    });

    /* Bouton "+" si moins de MAX_FILES */
    if (selectedFiles.length < MAX_FILES) {
      const addBtn = document.createElement('div');
      addBtn.className = 'preview-add';
      addBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Ajouter</span>`;
      addBtn.addEventListener('click', e => { e.stopPropagation(); input.click(); });
      previews.appendChild(addBtn);
    }

    if (selectedFiles.length > 0) {
      info.textContent = selectedFiles.length + ' photo' + (selectedFiles.length > 1 ? 's' : '') + ' sélectionnée' + (selectedFiles.length > 1 ? 's' : '');
      info.className = 'upload-info ok';
    }
  }

  /* ── Synchronise l'input file avec selectedFiles ── */
  function syncInput() {
    const dt = new DataTransfer();
    selectedFiles.forEach(f => dt.items.add(f));
    input.files = dt.files;
  }

  /* ── Valide et ajoute des fichiers ── */
  function addFiles(files) {
    let errors = [];
    Array.from(files).forEach(file => {
      if (!ACCEPTED.includes(file.type)) {
        errors.push(file.name + ' : format non supporté');
        return;
      }
      if (file.size > MAX_SIZE) {
        errors.push(file.name + ' : dépasse 5 Mo');
        return;
      }
      if (selectedFiles.length >= MAX_FILES) {
        errors.push('Maximum ' + MAX_FILES + ' photos atteint');
        return;
      }
      // Éviter les doublons par nom + taille
      const exists = selectedFiles.some(f => f.name === file.name && f.size === file.size);
      if (!exists) selectedFiles.push(file);
    });

    if (errors.length) {
      info.textContent = errors[0];
      info.className = 'upload-info error';
    }
    syncInput();
    renderPreviews();
  }

  /* ── Événements ── */
  input.addEventListener('change', () => {
    if (input.files.length) addFiles(input.files);
    // Reset input pour permettre re-sélection du même fichier
    input.value = '';
  });

  /* Drag & Drop */
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });
}

/* ═══════════════ BOOT ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  /* Récupérer le token anti-bot dès le chargement de la page */
  fetch('php/token.php')
    .then(r => r.json())
    .then(data => {
      const el = document.getElementById('formToken');
      if (el) el.value = data.token || '';
    })
    .catch(() => {}); // silencieux si PHP non dispo (GitHub Pages)

  initLoader();
  initNavbar();
  initFadeUp();
  initCounters();
  initPopups();
  initCaptcha();
  initForm();
  buildGallery();
  initNoDrag();
  initUpload();
});
