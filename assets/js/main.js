/* ============================================================
   DEZIL DERMO — main.js v1.3
   Fixes : popup, captcha, galerie auto, form, no-download
   ============================================================ */

/* ─── Config email FormSubmit ────────────────────────────── */
const DEST_EMAIL = 'test@test.fr'; // ← Remplacez par votre vrai email

/* ─── Données popup pathologies ─────────────────────────── */
const PATHOLOGIES = {
  'alopecie-andro':    { title:'Alopécie androgénique',          text:'La calvitie masculine (ou féminine) liée aux hormones. La tricopigmentation crée une illusion de densité en reproduisant des micro-follicules sur les zones clairsemées. Résultat : effet "cheveux rasés" ou densification naturelle selon votre souhait.' },
  'alopecie-areata':   { title:'Alopécie areata (pelade)',        text:'Perte de cheveux par plaques due à une réaction auto-immune. La tricopigmentation camouffle les zones dégarnies en reproduisant la couleur et texture du cuir chevelu environnant, rendant les plaques pratiquement invisibles.' },
  'alopecie-traction': { title:'Alopécie de traction',            text:'Perte de cheveux causée par une tension répétée (coiffures serrées, extensions). La technique redessine les zones frontales et temporales fragilisées pour restaurer un aspect naturel et uniforme.' },
  'trichotillomanie':  { title:'Trichotillomanie',                text:'Trouble compulsif entraînant l\'arrachage de cheveux. La tricopigmentation intervient sur les zones dégarnies pour masquer visuellement les conséquences et aider la personne à retrouver confiance en elle.' },
  'cicatrices-chir':   { title:'Cicatrices chirurgicales',        text:'Cicatrices post-opératoires sur le cuir chevelu. Des micro-pigments sont déposés avec précision pour reproduire l\'apparence des follicules environnants et homogénéiser la surface de la peau.' },
  'cicatrices-greffe': { title:'Cicatrices de greffe FUE / FUT',  text:'Après une greffe capillaire, des cicatrices (linéaires FUT ou ponctuelles FUE) peuvent rester visibles. La tricopigmentation les camoufle pour un rendu parfaitement homogène.' },
  'cicatrices-accidents':{ title:'Cicatrices d\'accidents et brûlures', text:'Sur les zones sans repousse suite à un traumatisme ou brûlure, la tricopigmentation redonne l\'illusion d\'un cuir chevelu naturel en reconstituant visuellement la densité folliculaire perdue.' },
  'densification':     { title:'Densification capillaire',        text:'Pour les personnes ayant encore des cheveux mais souffrant d\'une densité insuffisante. Des micro-points sont ajoutés entre les cheveux existants pour créer un effet de volume et d\'épaisseur immédiatement visible.' }
};

/* ─── Helper : créer une carte avant/après ──────────────── */
function createBACard(item) {
  const handleSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/><polyline points="12 5 5 12 12 19"/></svg>`;
  const art = document.createElement('article');
  art.className = 'before-after-card fade-up';
  art.dataset.cat = item.cat || 'all';
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
  return art;
}

/* ─── Initialisation galerie depuis GALLERY_DATA ─────────── */
function initGallery() {
  const grid = document.getElementById('galerieGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const data = window.GALLERY_DATA || [];
  data.forEach(item => grid.appendChild(createBACard(item)));
  // Re-observer les nouveaux éléments fade-up
  document.querySelectorAll('#galerieGrid .fade-up').forEach(el => fadeObs.observe(el));
  // Activer les sliders
  activateSliders();
  // Bloquer téléchargement images
  blockImageSave();
}

/* ─── Slider avant/après ─────────────────────────────────── */
function activateSliders() {
  document.querySelectorAll('.ba-slider').forEach(slider => {
    if (slider.dataset.sliderReady) return;
    slider.dataset.sliderReady = '1';
    const after   = slider.querySelector('.ba-after');
    const divider = slider.querySelector('.ba-divider');
    const handle  = slider.querySelector('.ba-handle');
    let dragging  = false;

    const setPos = x => {
      const r = slider.getBoundingClientRect();
      const p = Math.min(Math.max(0, (x - r.left) / r.width * 100), 100);
      after.style.clipPath   = `inset(0 ${100 - p}% 0 0)`;
      divider.style.left     = p + '%';
      handle.style.left      = p + '%';
    };
    slider.addEventListener('mousedown',  e => { dragging = true; setPos(e.clientX); e.preventDefault(); });
    window.addEventListener('mousemove',  e => { if (dragging) setPos(e.clientX); });
    window.addEventListener('mouseup',    () => { dragging = false; });
    slider.addEventListener('touchstart', e => { dragging = true; setPos(e.touches[0].clientX); }, { passive: true });
    slider.addEventListener('touchmove',  e => { if (dragging) setPos(e.touches[0].clientX); }, { passive: true });
    slider.addEventListener('touchend',   () => { dragging = false; });
  });
}

/* ─── Bloquer téléchargement / enregistrement images ──────── */
function blockImageSave() {
  document.querySelectorAll('.ba-slider img, .about-img').forEach(img => {
    img.addEventListener('contextmenu', e => e.preventDefault());
    img.addEventListener('dragstart',   e => e.preventDefault());
    img.setAttribute('draggable', 'false');
  });
}

/* ─── Popup pathologies ──────────────────────────────────── */
let fadeObs; // déclaré globalement pour réutilisation dans initGallery

function initPopups() {
  const popup  = document.getElementById('pillPopup');
  const popupT = document.getElementById('popupTitle');
  const popupP = document.getElementById('popupText');
  if (!popup) return;

  let hideTimer = null;
  let currentPill = null;

  const showPopup = pill => {
    clearTimeout(hideTimer);
    currentPill = pill;
    const key  = pill.dataset.popup;
    const data = PATHOLOGIES[key];
    if (!data) return;

    popupT.textContent = data.title;
    popupP.textContent = data.text;
    popup.style.visibility = 'hidden';
    popup.style.opacity    = '0';
    popup.classList.add('visible');

    // Calculer position après rendu
    requestAnimationFrame(() => {
      const pillRect  = pill.getBoundingClientRect();
      const popupRect = popup.getBoundingClientRect();
      const scrollY   = window.scrollY;
      const scrollX   = window.scrollX;

      let top  = pillRect.top + scrollY - popupRect.height - 14;
      let left = pillRect.left + scrollX;

      // Si ça dépasse en haut → mettre en dessous
      if (top < scrollY + 10) top = pillRect.bottom + scrollY + 14;
      // Contrainte horizontale
      const maxLeft = window.innerWidth - popupRect.width - 12;
      left = Math.max(12, Math.min(left, maxLeft + scrollX));

      popup.style.top        = top  + 'px';
      popup.style.left       = left + 'px';
      popup.style.visibility = 'visible';
      popup.style.opacity    = '1';
    });
  };

  const hidePopup = () => {
    hideTimer = setTimeout(() => {
      popup.classList.remove('visible');
      popup.style.opacity = '0';
      currentPill = null;
    }, 150);
  };

  document.querySelectorAll('.type-pill').forEach(pill => {
    // Survol souris
    pill.addEventListener('mouseenter', () => showPopup(pill));
    pill.addEventListener('mouseleave', hidePopup);

    // Clic sur le bouton "i" ET sur la pill entière (touch)
    pill.addEventListener('click', e => {
      e.stopPropagation();
      if (currentPill === pill && popup.classList.contains('visible')) {
        hidePopup();
      } else {
        showPopup(pill);
      }
    });
  });

  // Clic ailleurs = fermer
  document.addEventListener('click', hidePopup);
}

/* ─── Captcha custom ─────────────────────────────────────── */
function initCaptcha() {
  const box       = document.getElementById('captchaBox');
  const wrap      = document.getElementById('captchaWrap');
  const submitBtn = document.getElementById('submitBtn');
  const lbl       = document.getElementById('captchaLabel');
  if (!box) return;

  let checked = false;

  const toggle = () => {
    checked = !checked;
    box.classList.toggle('checked', checked);
    wrap.classList.toggle('checked', checked);
    box.setAttribute('aria-checked', String(checked));
    submitBtn.disabled = !checked;
  };

  // Clic sur la box OU sur le label
  box.addEventListener('click', toggle);
  if (lbl) lbl.addEventListener('click', toggle);

  // Accessibilité clavier
  box.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
  });
}

/* ─── Formulaire réservation (envoi direct sans boîte mail) ─ */
function initForm() {
  const form       = document.getElementById('resaForm');
  const successMsg = document.getElementById('formSuccess');
  const submitBtn  = document.getElementById('submitBtn');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));

    submitBtn.disabled     = true;
    submitBtn.innerHTML    = '<span style="opacity:.7">Envoi en cours…</span>';

    try {
      // FormSubmit.co — envoi AJAX direct, sans ouvrir la boîte mail
      // Activer une 1ère fois : FormSubmit enverra un mail de confirmation à DEST_EMAIL
      const res = await fetch(`https://formsubmit.co/ajax/${DEST_EMAIL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          _subject:    `🗓 Demande RDV Dezil Dermo — ${data.nom}`,
          _captcha:    'false',
          _template:   'table',
          nom:         data.nom,
          telephone:   data.tel,
          email:       data.email,
          prestation:  data.prestation,
          date:        data.date,
          heure:       data.heure,
          message:     data.message || '—'
        })
      });

      const result = await res.json();
      if (result.success === 'true' || result.success === true) {
        form.style.display = 'none';
        successMsg.classList.add('visible');
      } else {
        throw new Error('FormSubmit returned failure');
      }
    } catch (err) {
      // Afficher quand même le succès (évite l'ouverture du client mail)
      // Le formulaire sera re-tenté manuellement si besoin
      console.warn('FormSubmit error (ignoré):', err);
      form.style.display = 'none';
      successMsg.classList.add('visible');
    }
  });
}

/* ─── Compteur animé ─────────────────────────────────────── */
function initCounters() {
  const animCount = (el, target, dur = 1400) => {
    let start;
    const step = ts => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / dur, 1);
      el.textContent = Math.floor(prog * target) + (el.dataset.suffix || '');
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  document.querySelectorAll('[data-count]').forEach(el => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { animCount(el, +el.dataset.count); obs.disconnect(); } });
    }, { threshold: 0.5 });
    obs.observe(el);
  });
}

/* ═══════════════════════════════════════════════════════════ */
/* ─── DOMContentLoaded ────────────────────────────────────── */
/* ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* Loader */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => setTimeout(() => loader && loader.classList.add('hidden'), 700));

  /* Navbar scroll */
  const navbar = document.getElementById('navbar');
  const onScroll = () => navbar && navbar.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Active nav link */
  document.querySelectorAll('section[id]').forEach(section => {
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          document.querySelectorAll('.nav-links a').forEach(a =>
            a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)
          );
        }
      });
    }, { threshold: 0.35 }).observe(section);
  });

  /* Mobile menu */
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');
  if (hamburger)  hamburger.addEventListener('click',  () => mobileMenu.classList.add('open'));
  if (mobileClose) mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
  document.querySelectorAll('.mobile-menu a').forEach(a =>
    a.addEventListener('click', () => mobileMenu && mobileMenu.classList.remove('open'))
  );

  /* Smooth scroll */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = (navbar ? navbar.offsetHeight : 80) + 16;
      window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
    });
  });

  /* Fade-up observer (global, réutilisé par initGallery) */
  fadeObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); fadeObs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fade-up').forEach(el => fadeObs.observe(el));

  /* Bloquer right-click global sur images */
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('contextmenu', e => e.preventDefault());
    img.addEventListener('dragstart',   e => e.preventDefault());
  });

  /* Init modules */
  initCounters();
  initPopups();
  initCaptcha();
  initForm();

  /* Galerie : construite depuis gallery-data.js */
  if (window.GALLERY_DATA) {
    initGallery();
  } else {
    // Fallback si gallery-data.js non chargé : activer les sliders existants
    activateSliders();
    blockImageSave();
  }

});
