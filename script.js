/* GrachtBlauw — tiny JS for scroll feel + booking mail */
(() => {
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Scroll progress (requestAnimationFrame throttled) ---
  const bar = document.getElementById('progressBar');
  let ticking = false;

  function updateProgress() {
    ticking = false;
    if (!bar) return;
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
    const p = scrollHeight > 0 ? (scrollTop / scrollHeight) : 0;
    bar.style.width = `${Math.min(100, Math.max(0, p * 100))}%`;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateProgress);
    }
  }, { passive: true });
  updateProgress();

  // --- Header behavior: hide on scroll down, show on scroll up ---
  const header = document.querySelector('.site-header');
  let lastScrollY = window.scrollY || 0;

  function updateHeaderVisibility() {
    if (!header) return;
    const currentY = window.scrollY || 0;
    const scrollingDown = currentY > lastScrollY;
    const pastHero = currentY > 120;
    const keepOpen = document.body.classList.contains('nav-open');

    header.classList.toggle('site-header--hidden', scrollingDown && pastHero && !keepOpen);
    lastScrollY = currentY;
  }

  window.addEventListener('scroll', () => {
    updateHeaderVisibility();
  }, { passive: true });

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
    if (!open) updateHeaderVisibility();
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
