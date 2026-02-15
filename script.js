/* GrachtBlauw — tiny JS for scroll feel + booking mail */
(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Scroll progress + hero anim (requestAnimationFrame throttled) ---
  const bar = document.getElementById('progressBar');
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.hero.hero--blue') || document.querySelector('.hero');

  // Hero canal scene: boat follows the “grachtlijn” while you scroll
  const canalPath = document.getElementById('canalPath');
  const canalGlow = document.getElementById('canalPathGlow');
  const heroBoat = document.getElementById('heroBoat');
  const ringsGroup = document.getElementById('ringsGroup');
  const sceneLayer = document.getElementById('sceneLayer');

  let canalLen = 0;
  function clampVal(n, a, b){ return Math.max(a, Math.min(b, n)); }

  function setupCanalScene() {
    if (!canalPath) return;
    try {
      canalLen = canalPath.getTotalLength();
      // Prepare draw animation (dash)
      canalPath.style.strokeDasharray = `${canalLen}`;
      canalPath.style.strokeDashoffset = `${canalLen}`;
      if (canalGlow) {
        canalGlow.style.strokeDasharray = `${canalLen}`;
        canalGlow.style.strokeDashoffset = `${canalLen}`;
      }
    } catch (_) {
      canalLen = 0;
    }
  }

  function updateHeroScene() {
    if (prefersReduced) return;
    if (!hero || !canalPath || !heroBoat || !canalLen) return;

    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const start = hero.offsetTop;
    const h = hero.offsetHeight || 1;

    // 0..1 while you scroll past the hero
    const p = clampVal((y - start) / h, 0, 1);

    // Keep boat within path edges a bit (so it doesn't clip at the ends)
    const t = 0.03 + p * 0.94;
    const d = t * canalLen;

    const pt = canalPath.getPointAtLength(d);
    const pt2 = canalPath.getPointAtLength(Math.min(canalLen, d + 1));
    const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * (180 / Math.PI);

    heroBoat.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${ang})`);

    const dash = (1 - p) * canalLen;
    canalPath.style.strokeDashoffset = `${dash}`;
    if (canalGlow) canalGlow.style.strokeDashoffset = `${dash}`;

    // Subtle movement for the whole scene + rings
    if (sceneLayer) sceneLayer.setAttribute('transform', `translate(0 ${(-p * 10).toFixed(2)})`);
    if (ringsGroup) ringsGroup.setAttribute('transform', `rotate(${(p * 14).toFixed(2)} 500 300)`);
  }

  function updateHeaderTheme() {
    if (!header || !hero) return;
    const heroBottom = hero.offsetTop + hero.offsetHeight;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const onHero = y < (heroBottom - 120);
    header.classList.toggle('site-header--on-hero', onHero);
  }

  let ticking = false;

  function updateScrollFrame() {
    ticking = false;

    // progress bar
    if (bar) {
      const doc = document.documentElement;
      const scrollTop = doc.scrollTop || document.body.scrollTop;
      const scrollHeight = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
      const p = scrollHeight > 0 ? (scrollTop / scrollHeight) : 0;
      bar.style.width = `${Math.min(100, Math.max(0, p * 100))}%`;
    }

    updateHeroScene();
    updateHeaderTheme();
  }

  setupCanalScene();
  window.addEventListener('resize', () => {
    setupCanalScene();
    updateScrollFrame();
  }, { passive: true });

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateScrollFrame);
    }
  }, { passive: true });

  // initial paint
  updateScrollFrame();


// --- Reveal on scroll ---
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  revealEls.forEach(el => io.observe(el));

  // --- Mobile nav ---
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('mobileNav');

  function setNav(open) {
    if (!toggle || !mobileNav) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-open', open);
    mobileNav.hidden = !open;
  }

  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      setNav(!open);
    });

    mobileNav.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.tagName === 'A') setNav(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) setNav(false);
    }, { passive: true });
  }

  // --- Toast ---
  const toast = document.getElementById('toast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2400);
  }

  // --- Booking: generate a clean mail ---
  // CHANGE THIS:
  const BOOKING_EMAIL = 'boeken@jouwdomein.nl';

  const form = document.getElementById('bookingForm');
  const copyBtn = document.getElementById('copyBtn');

  function collectFormData() {
    if (!form) return null;
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    // Safety: trim strings
    for (const k of Object.keys(data)) {
      if (typeof data[k] === 'string') data[k] = data[k].trim();
    }
    return data;
  }

  function formatRequest(data) {
    const lines = [
      'Boekingsaanvraag — GrachtBlauw',
      '--------------------------------',
      `Naam: ${data.naam || ''}`,
      `Bedrijf: ${data.bedrijf || '-'}`,
      `E-mail: ${data.email || ''}`,
      `Telefoon: ${data.telefoon || '-'}`,
      '',
      `Datum: ${data.datum || ''}`,
      `Starttijd: ${data.start || ''}`,
      `Duur: ${data.duur || ''}`,
      `Aantal gasten: ${data.gasten || ''}`,
      `Boot: ${data.boot || ''}`,
      `WC nodig: ${data.wc || ''}`,
      '',
      'Wensen:',
      data.wensen ? data.wensen : '-',
      '',
      '— Verstuurd via de website'
    ];
    return lines.join('\n');
  }

  function openMailto(data) {
    const subject = `Boekingsaanvraag ${data.datum || ''} — ${data.boot || 'Botenverhuur Amsterdam'}`.trim();
    const body = formatRequest(data);
    const mailto = `mailto:${encodeURIComponent(BOOKING_EMAIL)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = collectFormData();
      if (!data) return;

      // Basic sanity
      if (!data.naam || !data.email || !data.datum || !data.start || !data.duur || !data.gasten || !data.boot) {
        showToast('Vul de verplichte velden in.');
        return;
      }

      showToast('Mail-app openen…');
      openMailto(data);
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const data = collectFormData();
      if (!data) return;
      const txt = formatRequest(data);
      const ok = await copyText(txt);
      showToast(ok ? 'Aanvraag gekopieerd.' : 'Kopiëren lukt niet op dit device.');
    });
  }

  // --- Rings: stroke draws with scroll ---
  if (!prefersReduced) {
    const ringsSvg = document.querySelector('.rings');
    const rings = Array.from(document.querySelectorAll('.ring'));
    const dash = rings.map(r => ({
      el: r,
      total: parseFloat(getComputedStyle(r).strokeDasharray) || 1000
    }));

    function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

    function updateRings() {
      if (!ringsSvg || dash.length === 0) return;

      const rect = ringsSvg.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;

      // Progress: 0 when far below viewport, 1 when nicely in view
      const start = vh * 0.85;
      const end = vh * 0.15;
      const p = clamp((start - rect.top) / (start - end), 0, 1);

      for (const d of dash) {
        d.el.style.strokeDashoffset = (1 - p) * d.total;
      }
    }

    updateRings();

    let ringTick = false;
    window.addEventListener('scroll', () => {
      if (ringTick) return;
      ringTick = true;
      requestAnimationFrame(() => {
        ringTick = false;
        updateRings();
      });
    }, { passive: true });
    window.addEventListener('resize', updateRings, { passive: true });
  } else {
    // If reduced motion, reveal all quickly.
    document.querySelectorAll('.ring').forEach(r => r.style.strokeDashoffset = '0');
  }

  // --- Year ---
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
