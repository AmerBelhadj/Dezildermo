/* ============================================================
   DEZIL DERMO — main.js v1.2
   ============================================================ */

/* ─── Données popup pathologies ──────────────────────────── */
const PATHOLOGIES = {
  'alopecie-andro': {
    title: 'Alopécie androgénique',
    text: 'La calvitie masculine (ou féminine) liée aux hormones. La tricopigmentation crée une illusion de densité en reproduisant des micro-follicules sur les zones clairsemées ou dégarnies. Résultat : effet "cheveux rasés" ou densification naturelle selon votre souhait.'
  },
  'alopecie-areata': {
    title: 'Alopécie areata (pelade)',
    text: 'Perte de cheveux par plaques due à une réaction auto-immune. La tricopigmentation camouffle les zones dégarnies en reproduisant la couleur et la texture du cuir chevelu environnant, rendant les plaques pratiquement invisibles.'
  },
  'alopecie-traction': {
    title: 'Alopécie de traction',
    text: 'Perte de cheveux causée par une tension répétée (coiffures serrées, extensions). La technique vient redessiner les zones frontales et temporales fragilisées pour restaurer un aspect naturel et uniforme.'
  },
  'trichotillomanie': {
    title: 'Trichotillomanie',
    text: 'Trouble compulsif entraînant l\'arrachage de cheveux. La tricopigmentation intervient sur les zones dégarnies pour masquer visuellement les conséquences et aider la personne à retrouver confiance en elle.'
  },
  'cicatrices-chir': {
    title: 'Cicatrices chirurgicales',
    text: 'Cicatrices post-opératoires sur le cuir chevelu. Des micro-pigments sont déposés avec précision pour reproduire l\'apparence des follicules environnants et homogénéiser la surface de la peau.'
  },
  'cicatrices-greffe': {
    title: 'Cicatrices de greffe FUE / FUT',
    text: 'Après une greffe capillaire, des cicatrices (linéaires FUT ou ponctuelles FUE) peuvent rester visibles. La tricopigmentation les camoufle en pigmentant les zones concernées pour un rendu parfaitement homogène.'
  },
  'cicatrices-accidents': {
    title: 'Cicatrices d\'accidents et brûlures',
    text: 'Sur les zones sans repousse suite à un traumatisme, brûlure ou accident, la tricopigmentation redonne l\'illusion d\'un cuir chevelu naturel en reconstituant visuellement la densité folliculaire perdue.'
  },
  'densification': {
    title: 'Densification capillaire',
    text: 'Pour les personnes ayant encore des cheveux mais souffrant d\'une densité insuffisante. Des micro-points sont ajoutés entre les cheveux existants pour créer un effet de volume et d\'épaisseur immédiatement visible.'
  }
};

document.addEventListener('DOMContentLoaded', () => {

  /* ── Loader ── */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => setTimeout(() => loader.classList.add('hidden'), 800));

  /* ── Navbar scroll ── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 40), { passive: true });
  navbar.classList.toggle('scrolled', window.scrollY > 40);

  /* ── Active nav ── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting)
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { threshold: 0.35 }).observe && sections.forEach(s =>
    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting)
          navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { threshold: 0.35 }).observe(s)
  );

  /* ── Mobile menu ── */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileClose = document.getElementById('mobileClose');
  hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
  mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.classList.remove('open')));

  /* ── Fade-up ── */
  const fadeObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); fadeObs.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => fadeObs.observe(el));

  /* ── Smooth scroll ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: t.offsetTop - navbar.offsetHeight - 16, behavior: 'smooth' });
    });
  });

  /* ── Before / After slider ── */
  document.querySelectorAll('.ba-slider').forEach(slider => {
    const after   = slider.querySelector('.ba-after');
    const divider = slider.querySelector('.ba-divider');
    const handle  = slider.querySelector('.ba-handle');
    let dragging = false;
    const setPos = (x) => {
      const r = slider.getBoundingClientRect();
      const p = Math.min(Math.max(0, (x - r.left) / r.width * 100), 100);
      after.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
      divider.style.left = p + '%';
      handle.style.left  = p + '%';
    };
    slider.addEventListener('mousedown',  e => { dragging = true; setPos(e.clientX); });
    window.addEventListener('mousemove',  e => { if (dragging) setPos(e.clientX); });
    window.addEventListener('mouseup',    () => { dragging = false; });
    slider.addEventListener('touchstart', e => { dragging = true; setPos(e.touches[0].clientX); }, { passive: true });
    slider.addEventListener('touchmove',  e => { if (dragging) setPos(e.touches[0].clientX); }, { passive: true });
    slider.addEventListener('touchend',   () => { dragging = false; });
  });

  /* ── Counter animation ── */
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
  new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { animCount(e.target, +e.target.dataset.count); }
    });
  }, { threshold: 0.5 }).observe && document.querySelectorAll('[data-count]').forEach(el =>
    new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { animCount(e.target, +e.target.dataset.count); } });
    }, { threshold: 0.5 }).observe(el)
  );

  /* ── Popups pathologies ── */
  const popup  = document.getElementById('pillPopup');
  const popupT = document.getElementById('popupTitle');
  const popupP = document.getElementById('popupText');
  let hideTimer;

  const showPopup = (pill) => {
    clearTimeout(hideTimer);
    const key  = pill.dataset.popup;
    const data = PATHOLOGIES[key];
    if (!data) return;
    popupT.textContent = data.title;
    popupP.textContent = data.text;

    const rect = pill.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    let top  = rect.top + scrollY - popup.offsetHeight - 12;
    let left = rect.left;

    // Si ça dépasse vers le haut, afficher en dessous
    if (top < scrollY + 8) top = rect.bottom + scrollY + 12;

    // Contraindre horizontalement
    const maxLeft = window.innerWidth - 300;
    left = Math.min(Math.max(8, left), maxLeft);

    popup.style.top  = top + 'px';
    popup.style.left = left + 'px';
    popup.classList.add('visible');
  };

  const hidePopup = () => {
    hideTimer = setTimeout(() => popup.classList.remove('visible'), 180);
  };

  document.querySelectorAll('.type-pill').forEach(pill => {
    pill.addEventListener('mouseenter', () => showPopup(pill));
    pill.addEventListener('mouseleave', hidePopup);
    pill.addEventListener('focus',      () => showPopup(pill));
    pill.addEventListener('blur',       hidePopup);
    // touch
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popup.classList.contains('visible') && popup.dataset.current === pill.dataset.popup) {
        hidePopup();
      } else {
        popup.dataset.current = pill.dataset.popup;
        showPopup(pill);
      }
    });
  });
  document.addEventListener('click', hidePopup);

  /* ── Captcha custom ── */
  const captchaBox  = document.getElementById('captchaBox');
  const captchaWrap = document.getElementById('captchaWrap');
  const submitBtn   = document.getElementById('submitBtn');
  let captchaOk = false;

  window.toggleCaptcha = function() {
    captchaOk = !captchaOk;
    captchaBox.classList.toggle('checked', captchaOk);
    captchaWrap.classList.toggle('checked', captchaOk);
    captchaBox.setAttribute('aria-checked', captchaOk);
    submitBtn.disabled = !captchaOk;
  };

  captchaBox.addEventListener('click', () => window.toggleCaptcha());
  captchaBox.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); window.toggleCaptcha(); } });

  /* ── Formulaire réservation (envoi direct) ── */
  const form       = document.getElementById('resaForm');
  const successMsg = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!captchaOk) return;

      const data = Object.fromEntries(new FormData(form));

      // Envoi via FormSubmit (service gratuit sans backend)
      // ▸ Remplacez l'email ci-dessous par votre email réel
      const DEST_EMAIL = 'profiltest.1979@gmail.com';
      const endpoint   = `https://formsubmit.co/ajax/${DEST_EMAIL}`;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span style="opacity:.6">Envoi en cours…</span>';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: `Demande RDV Dezil Dermo — ${data.nom}`,
            _captcha: 'false',
            nom: data.nom,
            telephone: data.tel,
            email: data.email,
            prestation: data.prestation,
            date: data.date,
            heure: data.heure,
            message: data.message || '—'
          })
        });
        // Afficher succès dans tous les cas (évite les erreurs CORS en local)
        form.style.display = 'none';
        successMsg.classList.add('visible');
      } catch (err) {
        // Fallback mailto si fetch échoue (ex: test en local sans serveur)
        const body = `Nom: ${data.nom}%0ATél: ${data.tel}%0AEmail: ${data.email}%0APrestation: ${data.prestation}%0ADate: ${data.date} à ${data.heure}%0AMessage: ${data.message || ''}`;
        window.location.href = `mailto:${DEST_EMAIL}?subject=Demande RDV — ${data.nom}&body=${body}`;
      }
    });
  }

});
