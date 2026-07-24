/* mitate showcase — interactions */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav solid-on-scroll ---------- */
  const nav = document.getElementById('nav');
  const onScroll = () => nav.setAttribute('data-solid', String(window.scrollY > 12));
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- reveal on enter ---------- */
  // Content is visible by default (CSS). The observer only adds the entrance
  // animation as elements approach the viewport; if it never runs, nothing is
  // hidden. Under reduced motion we simply skip the entrance entirely.
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }

  /* ---------- live hero instrument: a self-consistent f(t) → frame readout ---------- */
  const DUR = 16.5, FRAMES = 512, BEATS = 5;
  const elFrame = document.getElementById('frameCount');
  const elT = document.getElementById('tVal');
  const elBeat = document.getElementById('beatVal');
  const elMarker = document.getElementById('marker');
  const pad = (n, w) => String(n).padStart(w, '0');

  function paint(t) {
    const frac = t / DUR;
    const frame = Math.min(Math.round(frac * FRAMES), FRAMES - 1);
    const beat = Math.min(BEATS, Math.floor(frac * BEATS) + 1);
    if (elFrame) elFrame.textContent = pad(frame, 5);
    if (elT) elT.textContent = t.toFixed(3) + 's';
    if (elBeat) elBeat.textContent = beat + ' / ' + BEATS;
    if (elMarker) elMarker.style.left = (frac * 100).toFixed(2) + '%';
  }

  if (reduceMotion) {
    paint(13.541); // representative frame, static
  } else {
    let start = null, raf = null;
    const tick = (ts) => {
      if (start === null) start = ts;
      const t = ((ts - start) / 1000) % DUR;
      paint(t);
      raf = requestAnimationFrame(tick);
    };
    // pause the readout when the hero is offscreen (save cycles)
    const inst = document.querySelector('.instrument');
    if (inst && 'IntersectionObserver' in window) {
      const io2 = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting && raf === null) { start = null; raf = requestAnimationFrame(tick); }
          else if (!e.isIntersecting && raf !== null) { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0.05 });
      io2.observe(inst);
    } else {
      raf = requestAnimationFrame(tick);
    }
  }

  /* ---------- film lightbox ---------- */
  const FILMS = {
    'gearbox':       { title: 'Gearbox · five-beat mechanism',        meta: 'workshop bible · 16.5s',    src: 'films/gearbox.html' },
    'gearbox-neon':  { title: 'Gearbox · neon bible',                 meta: 'neon bible · 16.5s',        src: 'films/gearbox-neon.html' },
    'bear-and-bees': { title: 'Bear & Bees · silent comedy short',    meta: 'locked camera · 21.3s',     src: 'films/bear-and-bees.html' },
    'menagerie':     { title: 'Menagerie · character-scaffold demo',  meta: 'one skeleton · three gaits',src: 'films/menagerie.html' },
    'materials':     { title: 'Materials · cel · SSS · glass',        meta: 'transparency ordering case',src: 'films/materials.html' },
    'noise-chart':   { title: 'Noise Chart · primitive isolation',    meta: '8 cells · 1 drift control', src: 'films/noise-chart.html' },
  };

  const lb = document.getElementById('lightbox');
  const lbStage = document.getElementById('lbStage');
  const lbTitle = document.getElementById('lbTitle');
  const lbMeta = document.getElementById('lbMeta');
  const lbLoading = document.getElementById('lbLoading');
  const lbClose = document.getElementById('lbClose');
  let lastFocus = null;
  let teardownTimer = null;

  function openFilm(key, trigger) {
    const film = FILMS[key];
    if (!film) return;
    if (teardownTimer) { clearTimeout(teardownTimer); teardownTimer = null; }
    lastFocus = trigger || null;
    lbTitle.textContent = film.title;
    lbMeta.textContent = film.meta;
    lbLoading.style.display = '';
    // fresh iframe each open so the scene boots clean; removed on close so no film keeps running
    const old = lbStage.querySelector('iframe');
    if (old) old.remove();
    const frame = document.createElement('iframe');
    frame.setAttribute('title', film.title);
    frame.setAttribute('loading', 'eager');
    frame.setAttribute('allow', 'autoplay; fullscreen');
    frame.addEventListener('load', () => { lbLoading.style.display = 'none'; });
    frame.src = film.src;
    lbStage.appendChild(frame);
    lb.setAttribute('data-open', 'true');
    document.body.style.overflow = 'hidden';
    lbClose.focus();
    document.addEventListener('keydown', onKey);
  }

  function closeFilm() {
    lb.setAttribute('data-open', 'false');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    // tear down THIS iframe (captured now) so a quick reopen can't delete the new one
    const frame = lbStage.querySelector('iframe');
    teardownTimer = window.setTimeout(() => {
      if (frame && frame.parentNode) frame.remove();
      teardownTimer = null;
    }, 380);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function onKey(e) {
    if (e.key === 'Escape') { closeFilm(); return; }
    if (e.key !== 'Tab') return;
    // keep focus inside the dialog while it is open
    const f = lb.querySelectorAll('button:not([disabled]), a[href], iframe');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  document.querySelectorAll('[data-film]').forEach(btn => {
    btn.addEventListener('click', () => openFilm(btn.getAttribute('data-film'), btn));
  });
  lbClose.addEventListener('click', closeFilm);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeFilm(); });

  /* ---------- gearbox bible toggle (workshop <-> neon) ---------- */
  // The gallery gearbox poster is a plain <img> managed here so the animated
  // AVIF swaps reliably on toggle (a <picture> won't re-select on the fly).
  // The static still is the HTML default, so no-JS / reduced-motion stays correct.
  const gearboxScreen = document.getElementById('gearboxScreen');
  const gearboxImg = document.getElementById('gearboxImg');
  if (gearboxScreen && gearboxImg) {
    const setBible = (bible) => {
      const neon = bible === 'neon';
      gearboxImg.src = reduceMotion
        ? (neon ? 'posters/gearbox-neon-still.jpg' : 'posters/gearbox-still.jpg')
        : (neon ? 'posters/gearbox-neon.avif' : 'posters/gearbox.avif');
      gearboxScreen.setAttribute('data-film', neon ? 'gearbox-neon' : 'gearbox');
      document.querySelectorAll('.bible-btn').forEach(x => {
        const on = x.getAttribute('data-bible') === bible;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', String(on));
      });
    };
    document.querySelectorAll('.bible-btn').forEach(b =>
      b.addEventListener('click', () => setBible(b.getAttribute('data-bible'))));
    setBible('workshop'); // upgrade the static default to the animated loop for motion users
  }
})();
