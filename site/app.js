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
  //
  // The margin must be POSITIVE: the animation's from-state is opacity 0, and
  // content is visible before the class lands, so adding `.in` to an element
  // already inside the viewport makes it visibly vanish and re-enter — seen as
  // flashing under iOS momentum scroll with the old -6% margin. Firing ~15%
  // below the fold means the from-state is only ever applied off screen.
  //
  // No entrance at all on coarse-pointer devices: a momentum flick outruns any
  // margin (measured — center-screen content caught at 0.27-0.38 opacity), so
  // on touch the animation can only ever be seen as flashing. Same shape as
  // the hero's gate: decoration that cannot be honest on a platform is not
  // shown there.
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (!reduceMotion && !coarse && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px 15% 0px', threshold: 0 });
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
  // against 4-5s for the character films, measured in WebKit. A hero that
  // takes twenty seconds to start is not a hero.
  // These are gearbox's OWN numbers, not chosen ones: 16.5s of beats
  // (2.5/3.2/3.6/3.4/3.8, accumulating to BEAT_STARTS) shot at the pipeline's
  // 30 fps is 495 frames. An instrument about honest readouts cannot display
  // a frame count or fps that no artifact of the pipeline has.
  const DUR = 16.5, FPS = 30, FRAMES = 495;
  const BEAT_STARTS = [0, 2.5, 5.7, 9.3, 12.7];
  const elFrame = document.getElementById('frameCount');
  const elT = document.getElementById('tVal');
  const elBeat = document.getElementById('beatVal');
  const elMarker = document.getElementById('marker');
  const heroScreen = document.getElementById('heroScreen');
  const heroStill = document.getElementById('heroStill');
  const pad = (n, w) => String(n).padStart(w, '0');

  let ariaN = 0;
  function paint(t) {
    const frac = t / DUR;
    const frame = Math.min(Math.floor(t * FPS), FRAMES - 1);
    // the slider's accessible value must track the render like everything else
    // (review finding: it froze at 0 during autoplay). Throttled to ~2/s so
    // assistive tech is informed, not flooded.
    if (ariaN++ % 30 === 0) {
      const trackEl = document.querySelector('.inst-axis .track');
      if (trackEl) { trackEl.setAttribute('aria-valuenow', t.toFixed(2)); trackEl.setAttribute('aria-valuetext', t.toFixed(2) + ' seconds'); }
    }
    // the scene's real beat boundaries — gearbox's beats are unequal, so an
    // equal five-way split would disagree with what is rendering
    let beat = 1;
    for (let i = BEAT_STARTS.length - 1; i >= 0; i--) { if (t >= BEAT_STARTS[i]) { beat = i + 1; break; } }
    if (elFrame) elFrame.textContent = pad(frame, 5);
    if (elT) elT.textContent = t.toFixed(3) + 's';
    if (elBeat) elBeat.textContent = beat + ' / ' + BEAT_STARTS.length;
    if (elMarker) elMarker.style.left = (frac * 100).toFixed(2) + '%';
  }

  // The instrument only animates when it is animating something REAL, and the
  // axis is an INPUT: dragging the track sets t, and the same t feeds seekTo
  // and the readout — scrubbing is the thesis made tactile. Desktop mounts the
  // scene on load and plays; a drag pauses the clock and resumes from where
  // you let go. On coarse pointers nothing mounts until the first touch of the
  // track (a moving readout beside a still is the incoherence this instrument
  // exists to disprove); while the scene warms, the axis says so and the
  // numbers hold. Under reduced motion scrubbed frames render — they are
  // user-driven, not autoplay — but nothing ever plays by itself.
  const track = document.querySelector('.inst-axis .track');
  const axisMid = document.querySelector('.inst-axis .axis-label span:nth-child(2)');
  const axisMidText = axisMid ? axisMid.textContent : '';
  const btnPlay = document.getElementById('tPlay');
  const btnBack = document.getElementById('tBack');
  const btnFwd = document.getElementById('tFwd');
  const setPlayUI = (on) => { if (btnPlay) { btnPlay.classList.toggle('playing', on); btnPlay.setAttribute('aria-pressed', String(on)); } };
  const autoPlayHero = !reduceMotion && !coarse && heroScreen && heroStill;

  // 7.2 is the t the poster still was rendered at (verified against a fresh
  // render of the scene) — until the scene is live, the readout must describe
  // the frame it sits beside.
  let win = null, raf = null, start = null, mounted = false;
  // Driving the scene has exactly one home, because this host is the one
  // configuration where a dead film looks alive to every instrument: we replace
  // the scene's own rAF loop (stopPlayback below), so smoke's live-playback
  // check — which loads standalone — never exercises this path, and the
  // shipped-frame check runs under ?record=1 and never sees it either. Two
  // copies of `try { seekTo } catch {}` swallowing silently meant a scene
  // throwing on every seek kept a perfectly healthy-looking scrubber. Warn once
  // and keep going: the page must not die because a film did, but nobody should
  // have to guess why the canvas stopped.
  let seekWarned = false;
  const drive = (t) => {
    if (!win || !win.seekTo) return;
    try { win.seekTo(t); }
    catch (e) {
      if (!seekWarned) { seekWarned = true; console.warn('scene seekTo threw — the film is not rendering: ' + e.message); }
    }
  };
  // wantPlay is USER INTENT, the one flag every auto-resume path consults:
  // true on autoplay-eligible load or an explicit play; false on an explicit
  // pause. Scroll-out/in, focus blur and drag-release resume ONLY if it holds
  // — an explicit pause must survive all of them (review finding).
  let dragging = false, pendingT = null, wantPlay = autoPlayHero, heroWasPlaying = false;
  let lastT = autoPlayHero ? 0 : 7.2;
  paint(lastT);

  const tick = (ts) => {
    if (start === null) start = ts;
    const t = ((ts - start) / 1000) % DUR;
    lastT = t;
    drive(t);
    paint(t);
    raf = requestAnimationFrame(tick);
  };
  const stop = () => { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } setPlayUI(false); };
  const play = (fromT) => {
    if (raf !== null || !win) return;
    start = performance.now() - (fromT || 0) * 1000;
    raf = requestAnimationFrame(tick);
    setPlayUI(true);
  };
  const showT = (t) => {
    lastT = t;
    drive(t);
    paint(t);
    if (track) { track.setAttribute('aria-valuenow', t.toFixed(2)); track.setAttribute('aria-valuetext', t.toFixed(2) + ' seconds'); }
  };

  const onReady = () => {
    if (axisMid) axisMid.textContent = axisMidText;
    const t0 = pendingT !== null ? pendingT : lastT;
    pendingT = null;
    if (dragging) { showT(t0); return; }
    // wantPlay is false under reduced motion unless the user pressed play —
    // an explicit press is a media control they operated, not autoplay
    if (!wantPlay) { showT(t0); return; }
    play(t0);
  };

  function mountHero() {
    if (mounted || !heroScreen || !heroStill) return;
    mounted = true;
    const frame = document.createElement('iframe');
    frame.className = 'hero-frame';
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('tabindex', '-1');
    frame.setAttribute('title', '');
    // captions ON: beat 2 is a close-up whose caption is what makes it read as
    // a close-up rather than a cropped frame — measured confusion, not taste.
    // ~10.8px at this width sits at the legibility floor; the film's own words
    // beat no words.
    frame.src = 'films/gearbox.html?v=2';
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
          onReady();
        } else if (++tries < 900) setTimeout(settle, 100);
      };
      settle();
    });
    heroScreen.appendChild(frame);
  }

  if (autoPlayHero) mountHero();

  if (track && heroScreen && heroStill) {
    const tFromEvent = (ev) => {
      const r = track.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      return frac * DUR;
    };
    track.addEventListener('pointerdown', (ev) => {
      ev.preventDefault();
      try { track.setPointerCapture(ev.pointerId); } catch (e) {}
      dragging = true;
      stop();
      const t = tFromEvent(ev);
      if (win) showT(t);
      else {
        pendingT = t;
        if (!reduceMotion) wantPlay = true;   // touching the track is engagement
        if (axisMid) axisMid.textContent = 'loading the scene…';
        mountHero();
      }
    });
    track.addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      const t = tFromEvent(ev);
      if (win) showT(t); else pendingT = t;
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      if (win && wantPlay) play(lastT);
    };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('keydown', (ev) => {
      if (!win) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); mountHero(); } return; }
      const step = ev.shiftKey ? 1 / FPS : 0.5;
      let t = null;
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') t = Math.max(0, lastT - step);
      else if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') t = Math.min(DUR, lastT + step);
      else if (ev.key === 'Home') t = 0;
      else if (ev.key === 'End') t = DUR;
      else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); if (raf === null) { wantPlay = true; play(lastT); } else { wantPlay = false; stop(); } return; }
      if (t !== null) { ev.preventDefault(); stop(); showT(t); }
    });
    // a keyboard scrub parks the film; leaving the control lets it run again —
    // unless the user explicitly paused
    track.addEventListener('blur', () => { if (win && raf === null && !dragging && wantPlay) play(lastT); });

    // transport: play/pause and ±3s — the same t plumbing the scrubber uses.
    // On an unmounted hero (coarse pointer), any transport press mounts first,
    // holding the requested t until the scene is real.
    const ensureMounted = (t) => {
      if (win) return true;
      pendingT = t;
      if (axisMid) axisMid.textContent = 'loading the scene…';
      mountHero();
      return false;
    };
    if (btnPlay) btnPlay.addEventListener('click', () => {
      if (raf !== null) { wantPlay = false; stop(); return; }
      wantPlay = true;
      if (ensureMounted(lastT)) play(lastT);
    });
    const skip = (d) => {
      const base = pendingT !== null ? pendingT : lastT;
      const t = Math.min(DUR, Math.max(0, base + d));
      if (!ensureMounted(t)) return;
      const wasPlaying = raf !== null;
      stop();
      showT(t);
      if (wasPlaying) play(t);
    };
    if (btnBack) btnBack.addEventListener('click', () => skip(-3));
    if (btnFwd) btnFwd.addEventListener('click', () => skip(3));
  }

  // stop feeding it when it is off screen; the contract makes this free
  const inst = document.querySelector('.instrument');
  if (inst && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { if (win && raf === null && !dragging && wantPlay) play(lastT); }
        else stop();
      });
    }, { threshold: 0.05 }).observe(inst);
  }

  /* ---------- film lightbox ---------- */
  const FILMS = {
    'gearbox':       { title: 'Gearbox · five-beat mechanism',        meta: 'workshop bible · 16.5s',    src: 'films/gearbox.html?v=2' },
    'gearbox-neon':  { title: 'Gearbox · neon bible',                 meta: 'neon bible · 16.5s',        src: 'films/gearbox-neon.html?v=2' },
    'bear-and-bees': { title: 'Bear & Bees · silent comedy short',    meta: 'locked camera · 21.3s',     src: 'films/bear-and-bees.html?v=2' },
    'menagerie':     { title: 'Menagerie · character-scaffold demo',  meta: 'one skeleton · three gaits',src: 'films/menagerie.html?v=2' },
    'materials':     { title: 'Materials · cel · SSS · glass',        meta: 'transparency ordering case',src: 'films/materials.html?v=2' },
    'noise-chart':   { title: 'Noise Chart · primitive isolation',    meta: '8 cells · 1 drift control', src: 'films/noise-chart.html?v=2' },
    'crash':         { title: 'Market Crash · mechanics of a cascade',meta: '10 beats · 37.0s',          src: 'films/crash.html?v=2' },
    'strider-intro': { title: 'Strider · a boss intro',              meta: '7 beats · 20.4s',           src: 'films/strider-intro.html' },
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
    // pause the hero while the overlay is up: its IntersectionObserver cannot
    // see an overlay, so without this two live scenes render at once — the
    // incoherence this page exists to refute (review finding)
    heroWasPlaying = raf !== null;
    stop();
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
    // pre-warm is 1.1s for gearbox and 4-5s for the character films — so the
    // loading state waits for sceneReady instead of lying about it.
    const frame = document.createElement('iframe');
    frame.setAttribute('title', film.title);
    frame.setAttribute('loading', 'eager');
    frame.setAttribute('allow', 'autoplay; fullscreen');
    // Reveal the film IMMEDIATELY rather than gating on sceneReady. Every scene
    // boots to its own title card ("compiling shaders — a few seconds on first
    // open") which exists precisely so a booting film never reads as blank —
    // and hiding the iframe until ready threw that away, making a slow boot and
    // a dead scene pixel-identical. Measured in Safari with the hero still
    // live: menagerie took 11.1s to reach sceneReady against gearbox's 1.2s in
    // the hero, ~9x, scaling with scene weight. Under the old gate that is 11
    // seconds of flat dark panel with no signal of any kind.
    frame.classList.add('on');
    frame.addEventListener('load', () => {
      let tries = 0;
      const settle = () => {
        if (!frame.isConnected) return;
        let ready = false;
        // A THROWN probe is not readiness. This used to `catch (e) { ready =
        // true }`, so any cross-origin or teardown error was indistinguishable
        // from a booted scene — and with no logging anywhere on this path, a
        // total failure produced an empty console. That is why "nothing in the
        // console" was never evidence the scene was fine.
        try { ready = frame.contentWindow && frame.contentWindow.sceneReady === true; }
        catch (e) { console.warn('lightbox: cannot read sceneReady — ' + e.message); }
        if (ready) { lbLoading.style.display = 'none'; return; }
        if (++tries >= 200) {                   // 20s, was 90s
          lbLoading.style.display = 'none';
          console.warn('lightbox: ' + film.title + ' did not reach sceneReady in 20s. '
            + 'The film is shown regardless; if it is blank the scene is still '
            + 'compiling or has failed to boot. Opening it full size in its own '
            + 'tab gives it the whole browser budget.');
          return;
        }
        setTimeout(settle, 100);
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
    if (heroWasPlaying && wantPlay && win && raf === null && !dragging) play(lastT);
    heroWasPlaying = false;
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

  // On a phone the lightbox is the WRONG container, measured rather than assumed:
  // the same scene reaches sceneReady in 5-6s as a top-level document and takes
  // over 20s inside the lightbox iframe on iOS 26. Safari gives an iframe a much
  // smaller budget — the same effect that left an offscreen iframe never ready at
  // all in mobile WebKit. So a coarse-pointer tap opens the film directly; the
  // lightbox stays where it is fast and keeps you in the gallery.
  const preferTab = window.matchMedia('(pointer: coarse)').matches;
  // say what the tap actually does on this device
  if (preferTab) document.querySelectorAll('.open .lbl')
    .forEach(el => { el.textContent = 'open full size'; });
  document.querySelectorAll('[data-film]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-film');
      if (preferTab) {
        const film = FILMS[key];
        if (film) { window.open(film.src, '_blank', 'noopener'); return; }
      }
      openFilm(key, btn);
    });
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
      if (tab) tab.href = 'films/' + b.film + '.html?v=2';
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
