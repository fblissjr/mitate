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
  const DUR = 21.3, FRAMES = 639, BEATS = 8;   // bear-and-bees, the hero scene: 21.3s at 30fps
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

  /* ---------- live thumbnails ---------- */
  // A thumbnail is the scene itself, not a recording of it. The still paints
  // first (and is the whole experience with JS off, under reduced motion, or on
  // a device we decide not to push); a real iframe mounts over it as it comes
  // into view and is REMOVED when it leaves, so the number of live WebGL
  // contexts tracks what is actually on screen rather than how many films exist.
  //
  // Why not a video: after brotli a scene is smaller than its own mp4, and the
  // lightbox opens the very same URL, so watching a thumbnail then opening it
  // costs nothing the second time. The measured table lives in the skill's
  // references/delivery.md — deliberately not restated here, so there is one
  // copy to keep true.
  // Three tiers, matched to what a device can actually afford:
  //   live   — the scene itself in an iframe (a GPU context each)
  //   loop   — the animated AVIF, decoded in software, no GPU context. This is
  //            the phone tier: at 720px on a ~390px-wide screen the AVIF is
  //            oversampled rather than upscaled, so the quality objection that
  //            drove it off the desktop gallery does not apply here, and a phone
  //            shows one or two at a time so the decode cost stays small.
  //   still  — reduced motion, Save-Data, 2G, or no JS.
  const conn = navigator.connection || {};
  const cheapNetwork = conn.saveData
    || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g';
  const motionOK = !reduceMotion && !cheapNetwork;
  const liveOK = motionOK
    && (navigator.hardwareConcurrency || 2) >= 8
    && !window.matchMedia('(pointer: coarse)').matches;

  const mountLive = (img) => {
    if (img.dataset.live || !img.dataset.scene) return;
    img.dataset.live = '1';
    const f = document.createElement('iframe');
    f.className = 'live-frame';
    f.setAttribute('aria-hidden', 'true');
    f.setAttribute('tabindex', '-1');
    f.setAttribute('title', '');
    f.addEventListener('load', () => f.classList.add('on'));
    // ?nocap: a scene's caption scales WITH the frame (measured: ~32% of frame
    // width at every size), which keeps composition faithful but puts the text
    // at ~5.7px in a phone-sized box and ~10px in a gallery card — illegible
    // either way. The films are authored to read without captions (that is what
    // the nocap pass in method.md checks), so a thumbnail shows the geometry and
    // the lightbox, at full size, shows the captions.
    f.src = img.dataset.scene + '?nocap';
    img.parentNode.appendChild(f);
  };

  const unmountLive = (img) => {
    if (!img.dataset.live) return;
    delete img.dataset.live;
    // removing the element is what releases the GPU context; hiding it would not
    const f = img.parentNode.querySelector('.live-frame');
    if (f) f.remove();
  };

  // The loop tier swaps the still for its animated AVIF and back, so at most the
  // handful on screen are ever decoding.
  const loopSrc = (img) => (img.dataset.still || img.src).replace(/-still\.jpg$/, '.avif');
  const startLoop = (img) => {
    if (img.dataset.looping) return;
    if (!img.dataset.still) img.dataset.still = img.getAttribute('src');
    img.dataset.looping = '1';
    img.src = loopSrc(img);
  };
  const stopLoop = (img) => {
    if (!img.dataset.looping) return;
    delete img.dataset.looping;
    img.src = img.dataset.still;
  };

  if (motionOK && 'IntersectionObserver' in window) {
    const enter = liveOK ? mountLive : startLoop;
    const leave = liveOK ? unmountLive : stopLoop;
    const lio = new IntersectionObserver((entries) => {
      entries.forEach(e => e.isIntersecting ? enter(e.target) : leave(e.target));
    }, { rootMargin: '120px' });
    document.querySelectorAll('.poster-still[data-scene]').forEach(el => lio.observe(el));
  }

  /* ---------- gearbox bible toggle (workshop <-> neon) ---------- */
  // Both bibles are the same scene one line apart, so the toggle swaps the still
  // and the scene URL together, then restores whichever tier was already running:
  // a mounted live frame is torn down and remounted on the other bible, a running
  // AVIF loop is re-pointed at the other bible's loop. If neither is active the
  // next scroll-in picks up whatever is current. The still is the HTML default,
  // so no-JS and reduced motion stay correct without loading anything extra.
  const gearboxScreen = document.getElementById('gearboxScreen');
  const gearboxStill = document.getElementById('gearboxStill');
  if (gearboxScreen && gearboxStill) {
    const BIBLES = {
      workshop: { still: 'posters/gearbox-still.jpg',      scene: 'films/gearbox.html',      film: 'gearbox' },
      neon:     { still: 'posters/gearbox-neon-still.jpg', scene: 'films/gearbox-neon.html', film: 'gearbox-neon' },
    };
    const setBible = (bible) => {
      const b = BIBLES[bible] || BIBLES.workshop;
      const wasLive = !!gearboxStill.dataset.live;
      const wasLooping = !!gearboxStill.dataset.looping;
      if (wasLive) unmountLive(gearboxStill);   // swap the scene, then bring it back on the new bible
      if (wasLooping) stopLoop(gearboxStill);   // ...same for the AVIF tier, so dataset.still stays true
      gearboxStill.src = b.still;
      gearboxStill.dataset.still = b.still;
      gearboxStill.dataset.scene = b.scene;
      if (wasLooping) startLoop(gearboxStill);
      if (wasLive) mountLive(gearboxStill);
      gearboxScreen.setAttribute('data-film', b.film);
      document.querySelectorAll('.bible-btn').forEach(x => {
        const on = x.getAttribute('data-bible') === bible;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', String(on));
      });
    };
    document.querySelectorAll('.bible-btn').forEach(b =>
      b.addEventListener('click', () => setBible(b.getAttribute('data-bible'))));
    setBible('workshop'); // establishes the default bible; the scene mounts when it scrolls into view
  }
})();
