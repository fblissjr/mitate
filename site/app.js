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

  /* ---------- hero instrument: the readout DRIVES the scene ---------- */
  // The numbers beside the frame used to be a simulation running alongside a
  // picture. They are not any more: this mounts the real scene, calls
  // stopPlayback() so the scene is not also advancing itself, and then feeds one
  // `t` to BOTH window.seekTo() and the readout every frame. The value you read
  // is the value that rendered — identical by construction, which is the whole
  // thesis stated in the one place a visitor actually looks.
  //
  // gearbox is the hero because it is the cheapest to warm: 1.1s to sceneReady
  // against 18-20s for the character films, measured in WebKit. A hero that
  // takes twenty seconds to start is not a hero.
  const DUR = 16.5, FRAMES = 512, BEATS = 5;
  const elFrame = document.getElementById('frameCount');
  const elT = document.getElementById('tVal');
  const elBeat = document.getElementById('beatVal');
  const elMarker = document.getElementById('marker');
  const heroScreen = document.getElementById('heroScreen');
  const heroStill = document.getElementById('heroStill');
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

  // The instrument only animates when it is animating something REAL. A live
  // hero needs a scene mounted and driven; where we will not mount one — reduced
  // motion, or a coarse-pointer device where an offscreen-composited iframe was
  // measured never reaching sceneReady — the readout holds one representative
  // frame instead. A counter ticking beside a frozen picture is the incoherence
  // this whole instrument exists to disprove.
  const heroLive = !reduceMotion
    && !window.matchMedia('(pointer: coarse)').matches
    && heroScreen && heroStill;

  paint(heroLive ? 0 : 13.541);

  if (heroLive) {
    const frame = document.createElement('iframe');
    frame.className = 'hero-frame';
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('tabindex', '-1');
    frame.setAttribute('title', '');
    frame.src = 'films/gearbox.html?nocap';

    let win = null, raf = null, start = null;
    const tick = (ts) => {
      if (start === null) start = ts;
      const t = ((ts - start) / 1000) % DUR;
      try { if (win && win.seekTo) win.seekTo(t); } catch (e) {}
      paint(t);
      raf = requestAnimationFrame(tick);
    };

    frame.addEventListener('load', () => {
      let tries = 0;
      const settle = () => {
        if (!frame.isConnected) return;
        let ready = false;
        try { ready = frame.contentWindow && frame.contentWindow.sceneReady === true; } catch (e) {}
        if (ready) {
          win = frame.contentWindow;
          try { if (win.stopPlayback) win.stopPlayback(); } catch (e) {}  // we drive it now
          frame.classList.add('on');
          if (raf === null) raf = requestAnimationFrame(tick);
        } else if (++tries < 900) setTimeout(settle, 100);
      };
      settle();
    });
    heroScreen.appendChild(frame);

    // stop feeding it when it is off screen; the contract makes this free
    const inst = document.querySelector('.instrument');
    if (inst && 'IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting && win && raf === null) { start = null; raf = requestAnimationFrame(tick); }
          else if (!e.isIntersecting && raf !== null) { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0.05 }).observe(inst);
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
    // One scene at a time, loaded on demand, and nothing shown until it is
    // actually watchable. `load` fires while the canvas is still blank —
    // pre-warm is 1.1s for gearbox and 18-20s for the character films — so the
    // loading state waits for sceneReady instead of lying about it.
    const frame = document.createElement('iframe');
    frame.setAttribute('title', film.title);
    frame.setAttribute('loading', 'eager');
    frame.setAttribute('allow', 'autoplay; fullscreen');
    frame.addEventListener('load', () => {
      let tries = 0;
      const settle = () => {
        if (!frame.isConnected) return;
        let ready = false;
        try { ready = frame.contentWindow && frame.contentWindow.sceneReady === true; } catch (e) { ready = true; }
        if (ready || ++tries >= 900) {          // 90s ceiling, then show it regardless
          lbLoading.style.display = 'none';
          frame.classList.add('on');
        } else setTimeout(settle, 100);
      };
      settle();
    });
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
  // Both bibles are the same scene one line apart, so the toggle swaps the still
  // and which film the two actions point at.
  const gearboxScreen = document.getElementById('gearboxScreen');
  const gearboxStill = document.getElementById('gearboxStill');
  if (gearboxScreen && gearboxStill) {
    const BIBLES = {
      workshop: { still: 'posters/gearbox-still.jpg',      film: 'gearbox' },
      neon:     { still: 'posters/gearbox-neon-still.jpg', film: 'gearbox-neon' },
    };
    const setBible = (bible) => {
      const b = BIBLES[bible] || BIBLES.workshop;
      gearboxStill.src = b.still;
      gearboxScreen.setAttribute('data-film', b.film);
      const tab = gearboxScreen.closest('.film') && gearboxScreen.closest('.film').querySelector('.film-actions a');
      if (tab) tab.href = 'films/' + b.film + '.html';
      document.querySelectorAll('.bible-btn').forEach(x => {
        const on = x.getAttribute('data-bible') === bible;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', String(on));
      });
    };
    document.querySelectorAll('.bible-btn').forEach(b =>
      b.addEventListener('click', () => setBible(b.getAttribute('data-bible'))));
    setBible('workshop');
  }
})();
