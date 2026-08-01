#!/usr/bin/env bun
// Smoke test for the scene contract. Every bug this catches was invisible in
// source and obvious on the first render: a renamed three API that evaluates to
// undefined instead of throwing, a bundler that splices a script tag into the
// library, a vendored bundle whose top-level identifiers collide with scene
// variables. Reading the code finds none of them; rendering one frame finds all
// three.
//
//   bun run smoke.js                 -> checks every *.html in cwd (skips .bundled)
//   bun run smoke.js <scene.html>... -> checks the named scenes
//   bun run smoke.js --parity-fix --from <canonical.html> [scene.html...]
//                                    -> WRITES: propagates every fenced block
//                                       from the NAMED source into the other
//                                       carriers. The source is never inferred,
//                                       a malformed source or target refuses the
//                                       whole run, and nothing is written until
//                                       every file has validated. Read the diff
//                                       before committing: this is propagation,
//                                       not review.
//   bun run smoke.js --parity-only [scene.html...]
//                                    -> marker parity + template integrity ONLY.
//                                       No browser, ~0.2s. For a pre-commit, CI's
//                                       cheap stage, or a quick check after
//                                       editing a KERNEL/SOLVER block in one
//                                       scene. Callers should invoke THIS rather
//                                       than reimplement the check; see
//                                       references/instruments.md.
//
// Checks per scene (one artifact — the source/bundled pair collapsed):
//   1. the page loads with zero console/page errors (incl. deprecation warnings)
//   2. seekTo, DURATION, stopPlayback, sceneReady all exist (the contract only —
//      the renderer is deliberately not asserted, so any backend can pass)
//   3. seekTo(t) is deterministic: the same t twice gives byte-identical pixels
//   4. seekTo renders something — not a blank canvas
//   5. the film PLAYS — the rAF loop drives seekTo with a rising t on a load
//      WITHOUT ?record=1, which is the only path a human viewer ever takes and
//      the only one nothing else in this pipeline executes
//
// Advisory checks (print `warn` lines, never fail the build or touch the exit
// code) — these are judgment calls bracketed on a handful of scenes, and a
// scene author may legitimately overrule them; a lint that blocks a release
// on a taste call just gets bypassed:
//   6. caption reading speed, when window.BEATS is present
//   7. caption overflow against the nowrap caption pill, when window.BEATS is present
//   8. exposure — overexposed clipping and underexposed crushing. NOTE: its
//      >=99%-near-black branch is a HARD fail, not advisory; framing invariance
//      (also a hard fail) runs inside the same block. Neither is purely advisory.
//
// Requires: bun, playwright-core, a Chromium (see shoot.js resolution order) —
// EXCEPT under --parity-only, which is pure string work over files and has to
// run in a clone that has installed nothing. That is why playwright-core and
// backend.js load lazily below instead of at module scope: a top-level require
// killed the cheap pre-commit mode on a dependency it never uses.
// Exits non-zero on any failure, so it can gate a release.
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const os = require('os');
// Browser resolution, backend flag policy, the settle idiom, and the aspect
// shapes are shared with shoot.js via backend.js — the gate must check the
// exact configuration the recorder ships, and the inline copies this file
// used to carry had already drifted (the launch-args copy lost the
// ANGLE_BACKEND allow-list).
// Assigned by loadBrowserDeps(), called only after the --parity-only early
// exit. backend.js requires playwright-core itself, so deferring one means
// deferring both.
let chromium, chromiumPath, angleArgs, settle, seekSynced, aspectShapes;
function loadBrowserDeps() {
  ({ chromium } = require('playwright-core'));
  ({ chromiumPath, angleArgs, settle, seekSynced, aspectShapes } =
    require(path.join(__dirname, 'backend.js')));
}

const CONTRACT = ['seekTo', 'DURATION', 'stopPlayback', 'sceneReady'];
// Read behind fallbacks rather than asserted, so a scene authored before one of
// these existed still runs. The fallback is deliberate; its SILENCE was not.
// SHOTS joins this list only for 3D scenes — a 2D scene has no shot list by
// design, so an unconditional check would warn on every one of them.
const SOFT_CONTRACT = ['BEATS', 'FRAME', 'FLASHES', 'CAPFADE'];
const VIEWPORT = { width: 640, height: 360 };
const sha256 = buf => crypto.createHash('sha256').update(buf).digest('hex');

/* ---------- THE one way to read scene pixels in-page ------------------------
   Renders at `ts` and hands the canvas to `reader` inside a SINGLE evaluate —
   one JS task. This is structural, not stylistic: the node stack clears the
   drawing buffer after compositing, so a read in a LATER task intermittently
   sees zeros (or a stale canvas mid-resize). Three checks independently
   reinvented this race before the helper existed — exposure ("crushed 100%"
   on a known-good scene), the framing grid (MAD 84 on a correct scene), and a
   canvas-change prototype (all-zero hashes read as "deterministic"). A new
   pixel check goes through sampleAt or it is wrong by default.
   `reader` is a plain function (stringified into the page); extra args are
   JSON-encoded and passed after the canvas. */
function sampleAt(page, ts, reader, ...args) {
  const argSrc = args.map(a => JSON.stringify(a)).join(', ');
  return page.evaluate(`(() => {
    window.seekTo(${ts});
    const canvas = document.querySelector('canvas');
    return (${reader.toString()})(canvas${argSrc ? ', ' + argSrc : ''});
  })()`);
}

// Reader for the framing-invariance check: map the design-frame rect out of
// the canvas into a fixed 32x18 luma grid.
function framingReader(canvas, AR) {
  const W = window.innerWidth, H = window.innerHeight;
  const fw = Math.min(W, H * AR), fh = fw / AR;
  const fx = (W - fw) / 2, fy = (H - fh) / 2;
  const GX = 32, GY = 18, out = [];
  const sx = canvas.width / W, sy = canvas.height / H;
  const tmp = document.createElement('canvas');
  tmp.width = GX; tmp.height = GY;
  const g = tmp.getContext('2d');
  g.drawImage(canvas, fx * sx, fy * sy, fw * sx, fh * sy, 0, 0, GX, GY);
  const d = g.getImageData(0, 0, GX, GY).data;
  for (let i = 0; i < d.length; i += 4) out.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
  return out;
}

// Reader for the exposure check: downscaled luma percentiles + tail fractions.
function exposureReader(canvas, w, CLIP, CRUSH) {
  const h = Math.max(1, Math.round(canvas.height / canvas.width * w) || Math.round(innerHeight / innerWidth * w));
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const ctx = off.getContext('2d');
  ctx.drawImage(canvas, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const lumas = [];
  let clipped = 0, crushed = 0;
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    lumas.push(luma);
    if (luma > CLIP) clipped++;
    if (luma < CRUSH) crushed++;
  }
  lumas.sort((x, y) => x - y);
  const pct = p => lumas[Math.floor(p * (lumas.length - 1))];
  return { clipped: clipped / lumas.length, crushed: crushed / lumas.length,
           p05: pct(0.05), p95: pct(0.95) };
}

// capFade fallback for scenes predating the window.CAPFADE contract export.
// (Current templates export the resolved value; probing CONFIG from here was
// scene-internals parsing, the exact pattern the FLASHES export exists to end.)
const CAP_FADE_DEFAULT = 0.35;
// Caption reading speed: chars/sec above which a viewer can't actually read the
// line in the time it's fully legible. Observed, not derived — 27 cps was
// watched and read comfortably, 37 was watched and did not. Warn at 30: inside
// the unresolved gap, biased toward the confirmed-good end. This was briefly 25,
// which flags a density directly observed to read fine — a lint should not fire
// on the one value we have positive evidence for.
const CPS_WARN_THRESHOLD = 30;
// #cap is white-space:nowrap (scene.template.html), so it never wraps — it
// just extends past the viewport with no visible error. Warn before it
// actually reaches the edge, not exactly at it.
const CAP_OVERFLOW_FRACTION = 0.92;
// (A SHIP_VIEWPORT constant lived here, asserting the caption had to be
// measured at 1920x1080 rather than at VIEWPORT. That claim stopped being true
// when the template moved the caption to frame-relative sizing, and the resize
// it existed for was removed — see the incident record at the caption-overflow
// check. The constant outlived its claim by one release and contradicted the
// live reasoning; found by a no-undef/no-unused lint pass, not by reading.)
// Mean-absolute-luma tolerance for the framing-invariance check. Bracketed:
// a correctly containing scene scores <3; the pre-fix cropping templates
// scored 20-60. 8 sits in the gap, nearer the confirmed-good end.
const FRAMING_INVARIANCE_MAD = 8;

// Exposure thresholds — PROVISIONAL. Bracketed on a handful of scenes only;
// re-bracket as more scenes are checked. Named here so that re-bracketing is
// a one-line edit instead of a hunt through the check.
const EXPOSURE_LUMA_CLIP = 250;          // luma above this counts as clipped-to-white
const EXPOSURE_LUMA_CRUSH = 8;           // luma below this counts as crushed-to-black
const EXPOSURE_CLIPPED_THRESHOLD = 0.06; // warn if worst-case clipped fraction exceeds this
const EXPOSURE_CRUSHED_THRESHOLD = 0.35; // warn if worst-case crushed fraction exceeds this
// Warn if worst-case (p95 - p05) falls below this. BOUNDED ON ONE SIDE ONLY:
// the shipped diagrammatic example measures 22.9 and is deliberately minimal and
// legible, so the line has to sit below that. There is no confirmed-BAD
// observation anywhere, so this is a floor for "nearly blank", not a considered
// judgement about what reads. It was 40, which fired on that known-good example
// — a threshold with no observation beneath it is a guess wearing a number.
//
// INSTRUMENT ARTIFACT, THEN A REAL OBSERVATION. This check once reported 0.0
// on the flat Canvas2D template and, separately, "crushed 100%" on the
// known-good pale 3D template — NEITHER was an observation; both were one
// sampling race (the canvas read mid-resize or mid-clear), fixed structurally
// below. With sampling settled, the measurement was redone honestly: the
// Canvas2D placeholder measures ABOVE this floor, and the predecessor skill's committed
// 2D film measures 0.0 at its flattest sample
// while every frame is legible on review — a KNOWN-GOOD scene genuinely below
// the floor. So the metric is style-conditional the way the wash rule was
// palette-conditional: it can flag a nearly-blank 3D render; it cannot judge
// flat paper-and-ink design. Advisory wording reflects that. Catastrophic
// blankness on any backend stays covered by the PNG-size check.
const EXPOSURE_DYNRANGE_THRESHOLD = 18;
const EXPOSURE_SAMPLE_WIDTH = 320;       // downscale width for the offscreen luma sample
const SAMPLE_FRACTIONS = [0.25, 0.5, 0.8]; // fractions of DURATION to sample and take the worst of
// Shipped-frame spread floor, taken as MAX over the sample plan on a
// caption-stripped page — "the film's RICHEST stripped frame". Distinct from
// EXPOSURE_DYNRANGE_THRESHOLD above, which takes the MIN (flattest frame, a
// style-conditional advisory). A film whose BEST frame is flat is not a
// register; it is a backend shipping nothing. Bracketed: a half-dead
// SwiftShader-WebGPU configuration measured 1.7; the healthy 3D template
// 161.3; the flat paper-register 2D template 120.9. Two orders of magnitude
// of gap; 12 sits an order of magnitude under healthy. HARD FAIL.
const SHIPPED_SPREAD_FLOOR = 12;


/* ---------- the sampling layer ----------------------------------------------
   Every check in this file used to hand-roll its own sampling, which is why the
   SAME defect kept appearing independently: the determinism check, the blank
   check, the contact sheet and (until it was re-bracketed) the framing lint each
   picked their own point and then reported about the whole film.

   The proof that this matters, measured on one scene with three controls: a
   provably non-deterministic scene reported `all scenes pass, 0 warnings`,
   because `t = Math.min(1, dur/3)` is the CONSTANT 1.0s for any film over 3s —
   inside the title card the workflow tells you to write first — and t=1.0 was
   the only timestamp in that film where the scene was clean.

   So sampling becomes shared infrastructure rather than a habit. A check states
   a plan, gets points that respect what the harness already knows (duration,
   beats, flash windows), and REPORTS WHICH POINTS IT USED — a green result
   should be auditable, not authoritative.

   avoid:'flash' matters more than it looks: CONFIG.flashes peaks at beat edges,
   so any fixed fraction lands inside the white-out on exactly the beats that
   bracket a world cut — the highest-risk moments in a two-world film. */
function samplePlan(dur, flashes, n = 3) {
  // Interior points only: t=0 and t=DURATION are edges, and t=0 is a title card
  // in essentially every scene this skill produces -- which is how the old
  // single-sample check came to look at the one moment a broken scene was clean.
  //
  // Flash avoidance is done against MERGED intervals, not one flash at a time.
  // The first version walked the flash list mutating t in place, so a sample
  // nudged clear of one flash could land inside the next: measured, two flashes
  // 0.4s apart (an ordinary cut-in/cut-out pair) put a sample at 95% white --
  // reintroducing the exact failure the sampler exists to prevent. It also made
  // the plan depend on the order the author happened to list CONFIG.flashes.
  // Each flash reports its OWN half-width now (CONFIG.flashWidth / per-flash w),
  // so avoidance is calibrated against the real interval rather than a constant
  // that silently went stale the moment flashes became parameterised.
  const PAD = 0.05;
  const lo = 0.05, hi = Math.max(lo, dur - 0.05);
  const iv = (flashes || []).map(f => {
    const c = typeof f === 'number' ? f : f.t;
    const w = (typeof f === 'number' ? 0.25 : (f.w === undefined ? 0.25 : f.w)) + PAD;
    return [c - w, c + w];
  }).sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [a, b] of iv) {
    const last = merged[merged.length - 1];
    if (last && a <= last[1]) last[1] = Math.max(last[1], b); else merged.push([a, b]);
  }
  const clear = t => {                   // nearest point outside EVERY interval
    for (let pass = 0; pass < merged.length + 1; pass++) {
      const hit = merged.find(([a, b]) => t > a && t < b);
      if (!hit) break;
      const left = hit[0] - 0.05, right = hit[1] + 0.05;
      t = (t - hit[0] <= hit[1] - t && left >= lo) ? left : right;
    }
    return Math.min(Math.max(t, lo), hi);
  };
  const out = [];
  for (let i = 1; i <= n; i++) out.push(Number(clear(dur * (i / (n + 1))).toFixed(4)));
  return out;
}

// Flash midpoints come from the contract (window.FLASHES), not from parsing
// scene internals. CONFIG is a const in a classic script and never reaches
// window, so the first version of this read undefined and avoided nothing —
// which is how a legitimate film failed the blank check inside its own world-cut
// flash.
async function flashTimes(page) {
  try { return (await page.evaluate('window.FLASHES')) || []; } catch (e) { return []; }
}

// --- The checks, one function each. -----------------------------------------
//
// Extracted from checkScene, which was 594 lines of them sharing four mutable
// arrays (R4.1). Each takes the same `ctx` and reports by pushing to
// ctx.fails/ctx.warnings, because that IS the existing contract between these
// blocks — rewriting it into return values would have changed what the outer
// catch sees, and this extraction's gate is byte-unchanged verdicts.
//
// THE ERROR SEMANTICS ARE NOT UNIFORM AND MUST NOT BE MADE SO. Six of these
// carry their own try/catch and degrade to a warning; the determinism trio
// deliberately does not, so a throw there reaches checkScene's outer catch,
// becomes a FAIL, and abandons the remaining checks. That asymmetry is the
// design — an advisory check crashing must never flip the exit code, and a
// determinism check crashing must. The restructure plan described all of these
// as already having "its own try/catch and its own name"; three of them do not,
// and extracting them as if they did would have quietly converted three hard
// fails into warnings while every verdict on the shipped corpus stayed green.
//
// ORDER IS LOAD-BEARING, so they are driven from an array rather than called
// ad hoc: caption overflow mutates #cap directly and must run after determinism
// has captured its frames, and several checks resize the viewport and restore it
// for whatever runs next. See each check's own comment.

// CHECK: caption reading speed. A caption is only fully legible between its
// fade-in and fade-out, so the readable window is (dur - 2*capFade), not the
// whole beat. Flags a beat where the caption is too long to actually read
// before it fades — see CPS_WARN_THRESHOLD above for where the number comes
// from. Deliberately does not restate it: this comment said 25 for the whole
// life of the 30 it was pointing at.
async function checkCaptionSpeed(ctx) {
  const { page, beats, warnings } = ctx;
  try {
    if (!beats) {
      warnings.push('caption reading speed: skipped, window.BEATS not present');
    } else {
      // From the contract (window.CAPFADE), not from probing scene internals —
      // same rule as FLASHES: when a tool is tempted to parse scene state, the
      // contract is missing an export. The constant covers legacy scenes.
      const capFade = await page.evaluate('window.CAPFADE');
      const fade = typeof capFade === 'number' ? capFade : CAP_FADE_DEFAULT;
      for (const b of beats) {
        if (!b.cap) continue;
        const effectiveWindow = Math.max(b.dur - 2 * fade, 0.01);
        const cps = b.cap.length / effectiveWindow;
        if (cps > CPS_WARN_THRESHOLD) {
          warnings.push(`caption reading speed: beat "${b.name}" at ${cps.toFixed(1)} cps — "${b.cap}"`);
        }
      }
    }
  } catch (e) {
    warnings.push('caption reading speed: check errored — ' + e.message.split('\n')[0]);
  }
}
checkCaptionSpeed.requires = ['page', 'beats', 'warnings'];

// CHECK: caption overflow. #cap is white-space:nowrap, so an over-long
// caption doesn't wrap — it silently extends past the viewport with no
// error anywhere, just a clipped pill. This mutates #cap.textContent
// directly (bypassing seekTo), so it MUST run after the determinism check
// above, and MUST call seekTo() again afterward to put the caption back to
// whatever the scene itself renders at t — otherwise this would leave the
// page in a synthetic state that a later check reads.
async function checkCaptionOverflow(ctx) {
  const { page, beats, warnings, t } = ctx;
  try {
    if (!beats) {
      warnings.push('caption overflow: skipped, window.BEATS not present');
    } else {
      // Measure at the SHIPPING viewport, not this file's small check viewport.
      // The caption is sized in fixed CSS px (30px in the template), so the
      // pill occupies ~3x the frame width at 640 that it does at 1920 — the
      // first run of this check measured at 640 and reported the shipped
      // template as overflowing, which is a measurement artifact, not a
      // finding. Anything comparing an element against the frame has to be
      // measured at the size the frame is actually rendered.
      // NO resize. This used to jump to a 1920x1080 shipping viewport (a
      // SHIP_VIEWPORT constant, since removed) on the theory that the
      // caption is fixed CSS px, so a ratio measured at 640 would not hold at
      // 1920. That stopped being true: the template sizes it
      // `calc(var(--fw)*.015625)`, i.e. frame-relative, and the pill/frame
      // ratio measures 1.219 at 640 and 1.217 at 1920 — scale-invariant, so
      // the resize bought nothing. It also cost everything: resizing WITHOUT
      // settling reads a pill still laid out at the old size against a frame
      // computed at the new one, under-measuring by ~3x, and a caption
      // overflowing by 32% produced no warning at all. The framing block's own
      // comment states the rule this broke — any check that changes viewport
      // must re-settle before it measures. Measuring at VIEWPORT is now
      // equivalent and cannot go stale.
      for (const b of beats) {
        if (!b.cap) continue;
        const { width, frameW } = await page.evaluate(`(() => {
          const el = document.getElementById('cap');
          el.textContent = ${JSON.stringify(b.cap)};
          const ar = (window.FRAME && window.FRAME.aspect) || 16/9;
          const frameW = Math.min(window.innerWidth, window.innerHeight * ar);
          return { width: el.offsetWidth, innerWidth: window.innerWidth, frameW };
        })()`);
        // Measure against the FRAME, not the raw viewport. Overlays are sized
        // as a fraction of the frame, so the frame is the only basis on which
        // this number means the same thing at every window shape.
        const limit = frameW * CAP_OVERFLOW_FRACTION;
        if (width > limit) {
          warnings.push(`caption overflow: beat "${b.name}" measured ${width}px wide against a ${frameW.toFixed(0)}px frame (limit ${limit.toFixed(0)}px)`);
        }
      }
      await page.setViewportSize(VIEWPORT);
      await page.evaluate(`window.seekTo(${t})`); // restore — see comment above
    }
  } catch (e) {
    try { await page.setViewportSize(VIEWPORT); } catch (e2) {}
    warnings.push('caption overflow: check errored — ' + e.message.split('\n')[0]);
    try { await page.evaluate(`window.seekTo(${t})`); } catch (e2) {}
  }
}
checkCaptionOverflow.requires = ['page', 'beats', 'warnings', 't'];

// CHECK: framing is invariant across window shapes.
//
// This is the guard for a whole bug CLASS, not one bug. Every other check in
// this file samples ONE window shape, and so did every other tool: shoot.js
// pinned 1920x1080, build.js opens no browser at all. A defect that only
// appears at a different aspect was therefore invisible to the entire test
// surface BY CONSTRUCTION -- which is exactly how both backends shipped a
// silent horizontal crop that only a human resizing a window ever saw.
//
// The invariant: the scene composes against FRAME.aspect and CONTAINS it, so
// the contents of the design frame must not depend on the window shape. We
// read the frame rect out of the canvas at three aspects, reduce each to a
// coarse luma grid, and compare. Cheap, because seekTo is pure.
//
// Tolerance, not equality: resampling a different pixel count into the same
// grid is never bit-exact. Bracketed on the real defect -- the pre-fix
// templates score 20-60 mean absolute difference here, a correct scene
// scores under 3.
async function checkFramingInvariance(ctx) {
  const { page, dur, t, fails, warnings } = ctx;
  try {
    const ar = (await page.evaluate('window.FRAME && window.FRAME.aspect')) || 16 / 9;
    // Through sampleAt — render and grid-read in one task (see the helper).
    const grid = (ts) => sampleAt(page, ts, framingReader, ar);
    // Three of the four shared shapes; each shape costs a resize+settle.
    const shapes = aspectShapes(ar).filter(sh => sh.tag !== 'square');
    // Sample several points across the film and take the WORST. The first cut
    // of this check sampled one t, landed on a near-blank title card, scored
    // ~0 on a template known to crop, and reported all-clear -- a green
    // control that never ran. A blank frame is invariant under every window
    // shape precisely because it contains nothing.
    const mad = (a, b) => a.reduce((s2, v, i) => s2 + Math.abs(v - b[i]), 0) / a.length;
    // Outer loop over SHAPES, inner over sample times: one resize+settle per
    // shape (3 total) instead of one per shape per time (9). seekTo is pure,
    // so grids taken at the same ts under different shapes are comparable
    // regardless of visit order.
    const grids = {};                       // grids[tag][frac-index]
    for (const sh of shapes) {
      await page.setViewportSize({ width: sh.w, height: sh.h });
      // Wait for the scene's own resize handler to land before sampling.
      // Without this the grid is read off a STALE canvas and the numbers are
      // nonsense in both directions -- the first run of this check scored a
      // correctly-fixed template WORSE than a known-broken one. Same class as
      // the smoke.js sampling race already recorded in the plan's postmortem;
      // any check that changes viewport must re-settle before it measures.
      await settle(page);
      grids[sh.tag] = [];
      for (const frac of SAMPLE_FRACTIONS) grids[sh.tag].push(await grid(dur * frac));
    }
    const worst = { narrow: 0, wide: 0 };
    for (const tag of ['narrow', 'wide']) {
      for (let i = 0; i < SAMPLE_FRACTIONS.length; i++) {
        worst[tag] = Math.max(worst[tag], mad(grids.design[i], grids[tag][i]));
      }
    }
    for (const tag of ['narrow', 'wide']) {
      if (worst[tag] > FRAMING_INVARIANCE_MAD) {
        fails.push(`framing not aspect-invariant: the design frame's contents change at the ${tag} window shape (worst mean abs luma diff ${worst[tag].toFixed(1)} > ${FRAMING_INVARIANCE_MAD}). The scene is cropping or reflowing instead of containing FRAME.aspect.`);
      }
    }
    await page.setViewportSize(VIEWPORT);
    await page.evaluate(`window.seekTo(${t})`);
  } catch (e) {
    try { await page.setViewportSize(VIEWPORT); await page.evaluate(`window.seekTo(${t})`); } catch (e2) {}
    warnings.push('framing invariance: check errored — ' + e.message.split('\n')[0]);
  }
}
checkFramingInvariance.requires = ['page', 'dur', 't', 'fails', 'warnings'];

// CHECK: exposure, both tails. This template's renderer uses ACES tone
// mapping (scene.template.html), which blows out pale materials — but a
// dark-palette scene fails the opposite way, coming out crushed and muddy.
// Checking only for overexposure would fire the wrong way on half of all
// scenes. Sampled at three points across the film and aggregated by worst
// case, since a scene can be fine at one timestamp and clip or crush at
// another. Measured in-page with an offscreen 2D canvas (drawImage +
// getImageData) rather than pulling in an image-decoding dependency — see
// the file header. Does not depend on window.BEATS: #c is part of the base
// contract, not the beats extension.
async function checkExposure(ctx) {
  const { page, dur, t, fails, warnings } = ctx;
  try {
    // The overflow check above restored the viewport, and the scene's resize
    // handler runs from the event loop — so without settling, the sample
    // below races it and reads whichever canvas size happens to be current.
    // Observed as run-to-run flips of the dynamic-range warning on the same
    // scene: the ink fraction of a flat frame sits near the p05 percentile
    // and moves with raster size. Wait for the buffer to match the viewport;
    // scenes without a resize handler just eat the short timeout.
    await page.waitForFunction(`(() => { const c = document.querySelector('canvas'); return !c || c.width === window.innerWidth; })()`,
      { timeout: 2000 }).catch(() => {});
    const times = SAMPLE_FRACTIONS.map(f => f * dur);
    let worstClipped = 0, worstCrushed = 0, worstSpread = Infinity;
    for (const et of times) {
      // Through sampleAt — render and sample in one task (see the helper;
      // the interleaved-resize race this prevents was observed live as
      // "crushed 100%" on a known-good pale scene, 0-for-3 on reruns).
      const stats = await sampleAt(page, et, exposureReader,
        EXPOSURE_SAMPLE_WIDTH, EXPOSURE_LUMA_CLIP, EXPOSURE_LUMA_CRUSH);
      worstClipped = Math.max(worstClipped, stats.clipped);
      worstCrushed = Math.max(worstCrushed, stats.crushed);
      worstSpread = Math.min(worstSpread, stats.p95 - stats.p05);
    }
    await page.evaluate(`window.seekTo(${t})`); // restore after sampling across the film

    if (worstClipped > EXPOSURE_CLIPPED_THRESHOLD) {
      warnings.push(`exposure [provisional threshold]: washed out — ${(worstClipped * 100).toFixed(1)}% of pixels clipped to white — lower the exposure (STYLE.exposure in current templates) and desaturate/darken pale materials`);
    }
    // A near-total black frame is not a register, it is a broken render.
    // Bandaid by nature -- one threshold promoted from warn to fail -- but the
    // class it closes is real: a 342-frame all-black film reported
    // `all scenes pass` because the caption pill kept the frame from being
    // technically EMPTY, so the blank check never fired and this one only
    // whispered. >=99% near-black is never a design choice.
    if (worstCrushed >= 0.99) {
      fails.push(`render is ${(worstCrushed * 100).toFixed(1)}% near-black — this is a broken render, `
               + `not a dark register (check the GL backend and the post chain)`);
    } else if (worstCrushed > EXPOSURE_CRUSHED_THRESHOLD) {
      warnings.push(`exposure [provisional threshold]: crushed — ${(worstCrushed * 100).toFixed(1)}% of pixels near black — raise exposure or add a fill/rim light`);
    }
    if (worstSpread < EXPOSURE_DYNRANGE_THRESHOLD) {
      warnings.push(`exposure [provisional threshold]: low dynamic range — the frame is nearly flat, ${worstSpread.toFixed(1)} points between p05 and p95 (a deliberately flat design can legitimately read low here — judge by looking; see the threshold note)`);
    }
  } catch (e) {
    warnings.push('exposure: check errored — ' + e.message.split('\n')[0]);
    try { await page.evaluate(`window.seekTo(${t})`); } catch (e2) {}
  }
}
checkExposure.requires = ['page', 'dur', 't', 'fails', 'warnings'];

// CHECK (hard, FIRST — while the browser is cold): the SHIPPED frame both
// changes across the film and contains an image. A half-dead backend can
// pass every other check: SwiftShader-WebGPU was measured rendering real
// frames into the drawing buffer while the COMPOSITOR — the layer
// screenshots and the shipped MP4 capture — showed the flat clear color at
// every t. The clear color was not near-black (near-black check silent),
// the caption kept the PNG-size check happy, and a flat frame is perfectly
// deterministic. Worse, the failure is warmth-dependent: the same adapter
// renders on a page opened after the GPU process has been working, which
// is why this check runs FIRST, on a fresh caption-stripped page
// (?strip=text — captions change per beat and would mask a dead canvas),
// at the recorder's own cadence. Two conditions, both fatal:
//   - every sampled t ships the identical image (film never moves), or
//   - the RICHEST sampled frame has luma spread below SHIPPED_SPREAD_FLOOR
//     (film ships a flat wash; see the bracket at the constant).
// Scenes without strip support keep their captions and lose power on the
// first condition rather than gaining false positives.
async function checkShippedFrame(ctx) {
  const { browser, file, fails, noise, classify } = ctx;
  try {
    const p2 = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
    // Same listeners as `page` — and literally the same `classify`, not a
    // second copy of it. Without them this load was an error blind spot: a
    // defect that manifests ONLY under ?strip=text went green here while the
    // identical defect on the live load went red.
    p2.on('pageerror', e => noise.push('page error: ' + e.message));
    p2.on('console', classify);
    try {
      await p2.goto('file://' + path.resolve(file) + '?record=1&strip=text');
      await p2.waitForFunction('window.sceneReady === true', { timeout: 20000 });
      await p2.evaluate('window.stopPlayback()');
      const dur2 = await p2.evaluate('window.DURATION');
      const fl2 = await p2.evaluate('window.FLASHES').catch(() => []) || [];
      const PLAN2 = samplePlan(dur2, fl2, 4);
      const sigs = []; let maxSpread = 0;
      for (const ts of PLAN2) {
        // seekSynced: this is the COLDEST page in the suite — loaded fresh,
        // before the GPU process is warm — which is where the capture race was
        // worst, and this check's verdict is a comparison of signatures.
        await seekSynced(p2, ts);
        await settle(p2);
        const png = await p2.screenshot();
        sigs.push(sha256(png));
        // Spread of the SHIPPED image: decode the screenshot back inside the
        // page (createImageBitmap) — no image dependency in this file, and
        // it measures the exact bytes the recorder would write to disk. The
        // PNG travels as an evaluate ARGUMENT, not spliced into the source
        // string — same bytes measured, without making the browser parse a
        // megabyte-scale JS literal per sample.
        const spread = await p2.evaluate(async ({ b64, w }) => {
          const bmp = await createImageBitmap(await (await fetch('data:image/png;base64,' + b64)).blob());
          const o = document.createElement('canvas');
          o.width = w; o.height = Math.round(w * bmp.height / bmp.width);
          const g = o.getContext('2d'); g.drawImage(bmp, 0, 0, o.width, o.height);
          const d = g.getImageData(0, 0, o.width, o.height).data, L = [];
          for (let i = 0; i < d.length; i += 4) L.push(0.2126*d[i] + 0.7152*d[i+1] + 0.0722*d[i+2]);
          L.sort((a, b) => a - b);
          return L[Math.floor(.95 * (L.length - 1))] - L[Math.floor(.05 * (L.length - 1))];
        }, { b64: png.toString('base64'), w: EXPOSURE_SAMPLE_WIDTH });
        maxSpread = Math.max(maxSpread, spread);
      }
      if (new Set(sigs).size === 1) {
        fails.push(`shipped frame is pixel-identical at every sampled t (${PLAN2.join(', ')}, captions `
                 + `stripped) — the compositor is not receiving the render (check WEBGPU/ANGLE_BACKEND) `
                 + `or the scene genuinely never moves`);
      } else if (maxSpread < SHIPPED_SPREAD_FLOOR) {
        fails.push(`shipped frames are a flat wash at every sampled t (max luma spread `
                 + `${maxSpread.toFixed(1)} < ${SHIPPED_SPREAD_FLOOR}, captions stripped) — the render `
                 + `backend is compositing the clear color, not the scene (check WEBGPU/ANGLE_BACKEND)`);
      }
    } finally {
      await p2.close();
    }
  } catch (e) {
    fails.push('shipped-frame check errored — ' + e.message.split('\n')[0]);
  }
}
checkShippedFrame.requires = ['browser', 'file', 'fails', 'noise', 'classify'];

// CHECK (hard): the film actually PLAYS. Every other check in this file --
// and every page load in shoot.js -- opens the scene with `?record=1`, and
// all three templates gate their rAF loop on the ABSENCE of that flag
// (`if(!location.search.includes('record'))requestAnimationFrame(loop)`).
// So the code path every human viewer gets was executed by nothing in this
// suite. A scene whose loop dies on its first frame ships perfect recorded
// frames and sits motionless for every person who opens it -- measured
// exactly that way once, on a film that had passed this gate green on both
// backends. The recorder cannot see it by construction, so the gate has to.
//
// Observed at the MECHANISM, not at the pixels: the loop's whole job is to
// call seekTo with a rising t, so wrap seekTo once the scene is ready and
// count the calls. A pixel diff would have to guess how far a given film
// moves in 200ms and would false-positive on a held title card -- the same
// "one frame answers no question about motion" trap the strip exists for.
// Counting cannot.
//
// This is the ONE load in this file without `?record=1`, which is the whole
// point of it. It runs AFTER the cold shipped-frame check so that check
// keeps the cold browser it needs, and on `page` rather than a third tab so
// a throw inside the loop lands in the same console/page-error listener
// that already reports it.
async function checkLivePlayback(ctx) {
  const { page, file, fails, warnings } = ctx;
  try {
    await page.goto('file://' + path.resolve(file));
    await page.waitForFunction('window.sceneReady === true', { timeout: 20000 });
    await page.evaluate(`(() => {
      window.__ticks = [];
      const inner = window.seekTo;
      // Count AFTER the inner call returns, never before: a seekTo that throws
      // on every call would otherwise register a tick per attempt and inflate
      // its way past the count arm while rendering nothing.
      window.seekTo = function (t) { const r = inner.apply(this, arguments); window.__ticks.push(t); return r; };
    })()`);
    // 3 frames is ~50ms at 60fps and ~200ms on the software path at this
    // viewport, so 5s of headroom means a timeout here is a dead loop rather
    // than a slow one. Two DISTINCT t values is the real assertion: a loop
    // that runs but recomputes the same t (a clock that never starts) is as
    // frozen as one that never ran, and the call count alone would pass it.
    await page.waitForFunction('window.__ticks.length >= 3', { timeout: 5000 }).catch(() => {});
    const ticks = await page.evaluate('window.__ticks');
    // ZERO is the only hard fail, and the asymmetry is deliberate. A dead
    // chain drives seekTo exactly 0 times no matter how long you wait, so it
    // is distinguishable from slow WITHOUT calibrating a wall clock. A count
    // of 1-2 is genuinely ambiguous -- a loop that ran once and died looks
    // identical, in a 5s window, to a healthy film on a contended box under
    // software GL -- and failing that ambiguity would make a correct scene
    // red for being slow. The 5s budget was bracketed on ONE machine at this
    // viewport; treating it as a universal threshold is the
    // measured-on-one-machine error this suite exists to catch.
    if (ticks.length === 0) {
      fails.push(`live playback stalled -- the scene reached sceneReady but its rAF loop drove `
               + `seekTo 0 times in 5s. Every RECORDED frame can still be perfect: `
               + `the recorder loads ?record=1, which skips this path entirely`);
    } else if (ticks.length < 3) {
      warnings.push(`live playback [ambiguous]: only ${ticks.length} seekTo call(s) in 5s. Either the `
               + `loop ran and died, or this machine is slow enough that 3 frames did not fit. `
               + `Re-run; a dead chain stays at 0 and a slow one climbs`);
    } else if (new Set(ticks).size < 2) {
      fails.push(`live playback is frozen -- the loop runs but every seekTo received the same t `
               + `(${ticks[0]}), so the film holds one frame forever`);
    }
    await page.evaluate('window.stopPlayback()').catch(() => {});
  } catch (e) {
    fails.push('live-playback check errored -- ' + e.message.split('\n')[0]);
  }
}
checkLivePlayback.requires = ['page', 'file', 'fails', 'warnings'];

// The two hard checks that precede the ?record=1 load. Ordered, and the order is
// the one they ran in inline: the shipped-frame check needs the COLD browser --
// its failure is warmth-dependent, see its own comment -- so live playback,
// which navigates `page`, runs after it and never before.
const PRE_RECORD_CHECKS = [
  checkShippedFrame,
  checkLivePlayback,
];

// The order these run in is the order they ran in when they were inline, and it
// is not arbitrary — caption overflow leaves the page at VIEWPORT and seeks back
// to t, which is the state framing invariance and exposure both assume on entry.
// Reordering this array is a behaviour change, not a formatting one.
const ADVISORY_CHECKS = [
  checkCaptionSpeed,
  checkCaptionOverflow,
  checkFramingInvariance,
  checkExposure,
];

/* ---------- The check driver, and the two things it will not run ------------
   Both assertions below run at MODULE LOAD, before argv is even read, so a
   mis-declared or mis-ordered list stops every invocation of this file
   including --parity-only. That is deliberate: neither condition is a property
   of a scene, so there is no scene whose verdict should absorb it.

   ORDER IS ASSERTED, NOT DERIVED, and the derivation was designed, measured and
   refuted rather than merely rejected. The idea was a requires/provides table
   feeding a topological sort. Measured 2026-08-01: none of these checks writes
   to `ctx` at all, so `provides` is empty for every one of them, the sort has
   ZERO edges, and every permutation is equally valid under the scheme while
   exactly one is correct — strictly worse than the array it would replace. Nor
   would adding edges revive it: the constraints that actually order this file
   are page state, not ctx keys — browser coldness, viewport at entry, whether
   #cap was mutated directly — so a sort obeying every edge still admits orders
   that are wrong for those reasons. Do not retry it.

   So the order is a tripwire, and each row carries the constraint that puts its
   function at that index. A reorder then has to argue with a reason instead of
   with a list. */
const CHECK_ORDER = [
  ['PRE_RECORD_CHECKS', PRE_RECORD_CHECKS, [
    ['checkShippedFrame', 'needs the COLD browser — its failure is warmth-dependent'],
    ['checkLivePlayback', 'navigates `page` and warms the GPU process; never before the cold check'],
  ]],
  ['ADVISORY_CHECKS', ADVISORY_CHECKS, [
    ['checkCaptionSpeed',      'reads beats only, touches no page state'],
    ['checkCaptionOverflow',   'mutates #cap.textContent directly, so it must follow the frame capture; restores VIEWPORT and seeks back to t'],
    ['checkFramingInvariance', 'assumes VIEWPORT and t on entry — exactly the state overflow leaves behind'],
    ['checkExposure',          'assumes VIEWPORT and t on entry, and waits for the canvas to match the viewport framing restored'],
  ]],
];

// The read set every driven check declares is CROSS-CHECKED against the pattern
// it destructures, because `requires` sitting beside that pattern is two copies
// of one fact and this repo's organizing finding is that nothing checks such
// copies agree. Derivation is the CONTROL here, not the source: it is too weak
// to BE the declaration — a check reading `ctx.foo` outside its pattern is
// invisible to both copies, so both can still be wrong together — but it is
// strong enough to catch a hand-edited pattern drifting from its list, which is
// the failure that actually happens. Smaller hole than the one it closes, stated
// rather than papered over.
//
// WHAT IT READS IS NOT THE FILE. `Function.prototype.toString()` under Bun
// returns a RE-PRINT of the parsed AST, not the original text — pinned by an
// arm of bracket-driver.js, 2026-08-01: `const p = ctx.page, d = ctx.dur;` comes back as
// `const { page: p, dur: d } = ctx;`, a destructuring pattern that was never
// typed. That is engine-specific (node returns source verbatim) and it cuts the
// useful way: the guard compares against the binding the check actually
// performs, so an equivalent spelling passes instead of false-reding. It also
// means the first mutant written to prove this arm red — sequential `const`s
// instead of a pattern — came back GREEN, because Bun normalised the mutation
// into the very shape being looked for. The arm is reachable; that mutant was
// not a mutation. `ctx.page` used inline with no bindings at all, or a pattern
// destructured from `ctx.inner`, both go red.
const CTX_DESTRUCTURE = /const\s*\{([^}]*)\}\s*=\s*ctx\s*;/;
for (const [listName, list, expected] of CHECK_ORDER) {
  const actual = list.map(f => f.name);
  const want = expected.map(([n]) => n);
  if (actual.join(', ') !== want.join(', ')) {
    throw new Error(`${listName} is out of order: expected [${want.join(', ')}], found `
                  + `[${actual.join(', ')}]. The order is load-bearing — see CHECK_ORDER for `
                  + `the constraint each position encodes.`);
  }
  for (const check of list) {
    if (!Array.isArray(check.requires) || !check.requires.length) {
      throw new Error(`${check.name}: no ctx requirements declared. Every check in a driven `
                    + `list must set \`${check.name}.requires\` — an undeclared check is one `
                    + `the driver validates nothing about, which is the coverage this adds.`);
    }
    const m = CTX_DESTRUCTURE.exec(check.toString());
    if (!m) {
      throw new Error(`${check.name}: no \`const { ... } = ctx;\` pattern found, so its declared `
                    + `requires cannot be cross-checked. Destructure ctx once at the top, or `
                    + `this guard is silently covering nothing.`);
    }
    const read = m[1].split(',').map(s => s.trim()).filter(Boolean);
    const odd = read.filter(n => !/^[A-Za-z_$][\w$]*$/.test(n));
    if (odd.length) {
      throw new Error(`${check.name}: ctx destructuring uses renames or defaults (${odd.join(', ')}), `
                    + `which this cross-check cannot read. Use plain names.`);
    }
    const declared = [...check.requires].sort().join(', ');
    if (declared !== [...read].sort().join(', ')) {
      throw new Error(`${check.name}: declared requires [${declared}] does not match the keys it `
                    + `destructures from ctx [${[...read].sort().join(', ')}].`);
    }
  }
}

// ONE place, not per check. A check that validated its own ctx would be a check
// that can be added WITHOUT validating it, which is the same silent-coverage-loss
// shape the declaration guard above closes one level up.
//
// PRESENCE (`in`), never definedness. `beats` is legitimately `undefined` on a
// scene that exports no window.BEATS, and both caption checks handle that
// themselves with an explicit `skipped, window.BEATS not present` warning — so
// validating definedness would fail such a scene outright. Every one of the nine
// scenes in today's corpus exports BEATS, which means the two readings are
// indistinguishable here and the wrong one would have shipped green.
//
// A throw lands in checkScene's outer catch and fails the scene loudly. That is
// the point: it can only fire on a smoke.js bug, and the alternative is what
// bracket-driver.js's header records, measured 2026-08-01 by moving the setup
// assignment after this loop — one correct scene drew a hard `render is 100.0%
// near-black` (dur undefined → t NaN), while framing invariance went silently
// all-clear, because every window shape sampled at NaN is identical and a check
// comparing a frame to itself cannot fail. Confidently wrong on one arm and
// quietly powerless on the other, from one missing key.
async function runChecks(checks, ctx) {
  for (const check of checks) {
    const missing = check.requires.filter(k => !(k in ctx));
    if (missing.length) {
      throw new Error(`${check.name} ran before ctx carried ${missing.join(', ')} — this is a `
                    + `smoke.js ordering bug, not a scene defect`);
    }
    await check(ctx);
  }
}

async function checkScene(browser, file) {
  const fails = [];
  const warnings = [];
  const noise = [];
  // Messages the noise filters suppressed. Surfaced as an advisory at the end so
  // a defect cloaked behind a driver prefix is visible; see DRIVER_NOISE below.
  const dropped = [];
  // three's WebGL2-fallback announcement, held for classification against
  // window.BACKEND after the page has booted; see the FALLBACK_NOTICE comment.
  const fallbackNotices = [];
  let backend = null;
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  page.on('pageerror', e => noise.push('page error: ' + e.message));
  // Driver performance chatter from the software GL path (our own readPixels
  // provokes it) is not a correctness signal. Everything else stays: three
  // announces silently-changed behaviour via console warnings, which is exactly
  // what this test exists to catch.
  // The WebGPURenderer fallback notice is informative, not a defect: with no
  // WebGPU adapter (the default headless case) the renderer announces it is
  // running under WebGL2 and proceeds correctly — measured, the fallback
  // renders the same composition. Real deprecation warnings still fail.
  // "No available adapters." is the WebGPU probe finding nothing before the
  // renderer announces its WebGL2 fallback — the two lines arrive together and
  // both are informative, not defects.
  // Anchored at the start, which narrows these filters but does NOT close the
  // cloak: the noise strings are themselves prefixes, so
  // console.error('GL Driver Message: <a real defect>') still matches and is
  // still dropped. Two closes were tried and rejected. Filtering on the
  // message's ORIGIN fails because three.js is inlined in every scene, so
  // three's own legitimate "WebGPU is not available" carries the scene's URL and
  // would stop being suppressed. Requiring a bounded tail is unmaintainable
  // against driver text nobody controls.
  // So the cloak stays open and is made LOUD instead: every dropped message is
  // reported as an advisory. Silent dropping was the real defect — a suppressed
  // error nobody can see is indistinguishable from no error.
  //
  // THIS REACHED A RELEASE. Until 0.16.16 both patterns were one anchored
  // regex that matched NEITHER message it most needed to, because the anchor
  // sat where a PREFIX arrives: Chromium emits "[.WebGL-0x7f…]GL Driver
  // Message (…)" and three emits "THREE.WebGPURenderer: WebGPU is not
  // available, …". Only "No available adapters." ever matched. Consequence:
  // every 3D scene FAILED on the default WebGL2 path — the whole shipped
  // corpus, on the one path CLAUDE.md advertises as CI-safe. It stayed
  // invisible because there is no CI and development runs WEBGPU=metal, where
  // neither message is emitted at all. The lesson is not about regex: an
  // allow-list is a claim about text nobody controls, so it belongs behind a
  // bracket that runs on the path it is written for — bracket-noise.js.
  const DRIVER_NOISE = /^\s*(?:\[[^\]]{0,64}\]\s*)?(GL Driver Message|GPU stall|Automatic fallback to software WebGL)/i;
  // three's fallback announcement is classified STRUCTURALLY below, against
  // window.BACKEND, rather than dropped here — because whether it is a defect
  // depends on state this filter cannot see. On the fallback path it is
  // expected and informative; from a scene reporting BACKEND='webgpu' it is a
  // self-contradiction, which the old text-only filter could not catch. The
  // THREE. prefix is three's own and is optional because it is not ours to pin.
  const FALLBACK_NOTICE = /^\s*(?:THREE\.)?(WebGPURenderer: WebGPU is not available|No available adapters)/i;
  // ONE classifier, attached to every page this scene opens. It was two copies
  // of the same body until 0.16.16, and they drifted the moment one was edited:
  // the cold shipped-frame page below still referenced the old binding. Two
  // copies of a filter is the same bug shape as two copies of a fence.
  const classify = m => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    const text = m.text();
    if (DRIVER_NOISE.test(text)) { dropped.push(text); return; }
    if (FALLBACK_NOTICE.test(text)) { fallbackNotices.push(text); return; }
    noise.push(`console ${m.type()}: ${text}`);
  };
  page.on('console', classify);
  // ONE ctx for the whole scene, built here and extended by the setup block below
  // (dur, t, beats). The pre-record checks need browser/file/classify; the
  // advisory ones need dur/t. Building it once means a check reads whatever the
  // checks before it established, which is exactly the coupling that was implicit
  // in the shared locals this function used to carry.
  const ctx = { browser, file, page, fails, warnings, noise, classify };

  try {
    // The two hard checks that run BEFORE the scene is opened with ?record=1.
    // Order is load-bearing: the shipped-frame check must have the COLD browser
    // (its failure is warmth-dependent -- see its own comment), so live playback,
    // which reloads the page, runs after it and never before.
    await runChecks(PRE_RECORD_CHECKS, ctx);

    await page.goto('file://' + path.resolve(file) + '?record=1');
    // Order matters and is a compromise, not an ideal. `sceneReady` MUST be
    // waited on first — it is assigned at the end of the async boot, so a check
    // before the wait reads a document where it legitimately does not exist yet
    // (measured: doing that failed every 3D example with `missing contract:
    // sceneReady`). So sceneReady stays shadowed by its own wait, and that is
    // unavoidable: a scene that never sets it produces a 20s timeout rather
    // than this message.
    // What IS recoverable is the other two. This check now runs BEFORE
    // stopPlayback() is called, so a missing `stopPlayback` prints the intended
    // `missing contract:` line instead of a raw TypeError. `seekTo` is consumed
    // earlier still by the live-playback wrapper, on a different document.
    await page.waitForFunction('window.sceneReady === true', { timeout: 20000 });
    const missing = await page.evaluate(
      `(${JSON.stringify(CONTRACT)}).filter(k => window[k] === undefined)`);
    // Which backend actually rendered (3D scenes export it; 2D scenes have none).
    // Printed on the result line: a green run should say what it verified.
    backend = await page.evaluate('window.BACKEND || null');
    if (missing.length) fails.push('missing contract: ' + missing.join(', '));
    // Absent soft names degrade checks instead of failing them: a renamed
    // FLASHES leaves the sample plan unable to avoid flashes, and the
    // blank-frame check then fires on a perfectly clean film. Say which are
    // gone rather than making the reader infer it from a weaker result.
    const softNames = SOFT_CONTRACT.concat(backend ? ['SHOTS'] : []);
    const soft = await page.evaluate(
      `(${JSON.stringify(softNames)}).filter(k => window[k] === undefined)`);
    if (soft.length) warnings.push('degraded — absent, read via fallback: ' + soft.join(', '));
    await page.evaluate('window.stopPlayback()');
    // Deliberately NOT asserting window.THREE. The contract is the product here;
    // three.js is one backend. Any scene exposing these four globals — a 2D
    // canvas, an SVG/CSS timeline, a D3 diagram — gets frame-exact MP4s from the
    // same pipeline, and this check must not lock that out.

    const dur = await page.evaluate('window.DURATION');
    const flashes = await flashTimes(page);
    // ALL-quantified over a plan, not a spot check at one arbitrary second.
    const PLAN = samplePlan(dur, flashes, 4);
    // Sample INSIDE shot transitions too: scenes exporting window.SHOTS get up
    // to two blend-window midpoints appended, because fixed fractions of
    // DURATION were measured missing every blend window on a shipped film —
    // a transition-confined determinism bug would have passed every check.
    try {
      const shots = await page.evaluate('window.SHOTS');
      if (Array.isArray(shots)) {
        for (const sh of shots.filter(x => x && x.cutEnd > x.t).slice(0, 2)) {
          const m = Number(((sh.t + sh.cutEnd) / 2).toFixed(4));
          if (m > 0.05 && m < dur - 0.05 && !PLAN.includes(m)) PLAN.push(m);
        }
      }
    } catch (e) {}
    const t = PLAN[0];

    // Determinism: same t twice must be byte-identical, at EVERY sampled point.
    // Catches accumulated state, Math.random(), and wall-clock leaking into the
    // scene — each of which silently desyncs the MP4 from the HTML loop.
    // Quantified ALL: one clean timestamp proves nothing, and a scene whose
    // title card is static is clean at exactly the moment the old check looked.
    // settle (backend.js) between seekTo and screenshot is LOAD-BEARING here:
    // the capture race it closes was measured as a flaky determinism FAIL whose
    // in-page canvas pixels were byte-identical — a capture race reported as a
    // scene bug, which is the one thing this check must never do.
    let shots = [];
    for (const ts of PLAN) {
      // seekSynced, not a bare seek: this arm reported a capture race as a scene
      // defect on a slow GL stack (40%/30%/20% on three cells; 0 of 200 once the
      // seek and a readback shared a task). backend.js owns the why.
      await seekSynced(page, ts);
      await settle(page);
      const x = await page.screenshot();
      await seekSynced(page, dur);                         // move away...
      await seekSynced(page, ts);                          // ...and back
      await settle(page);
      const y = await page.screenshot();
      shots.push(x);
      if (sha256(x) !== sha256(y)) {
        fails.push(`seekTo(${ts}) not deterministic — scene carries state across frames `
                 + `(checked ${PLAN.join(', ')})`);
        break;
      }
    }

    // ACROSS a page reload, not just within one session. The loop above proves
    // seekTo is pure *inside* a load; it says nothing about a scene that seeds
    // Math.random() ONCE at init. Such a scene is perfectly self-consistent per
    // session and produced three different films over three loads, measured —
    // while smoke reported `all scenes pass`. That is the prime directive
    // broken (the HTML a viewer loads and the MP4 the recorder shoots are
    // different films) and the whole suite was blind to it. One reload, one
    // sampled t: the cheapest possible cover for a load-time-nondeterminism
    // class that no in-session check can reach.
    if (!fails.length && shots.length) {
      await page.goto('file://' + path.resolve(file) + '?record=1');
      await page.waitForFunction('window.sceneReady === true', { timeout: 20000 });
      await page.evaluate('window.stopPlayback()');
      // seekSynced, and here the SYMMETRY is the point: shots[0] below is
      // captured through seekSynced, so a bare seek on this side would diff a
      // race-hardened capture against a race-vulnerable one and manufacture the
      // spurious "differs ACROSS a page reload" this check exists to rule out.
      // Shipped that way briefly in 0.16.28's first draft; caught in review.
      await seekSynced(page, PLAN[0]);
      await settle(page);
      const reloaded = await page.screenshot();
      if (sha256(reloaded) !== sha256(shots[0])) {
        fails.push(`seekTo(${PLAN[0]}) differs ACROSS a page reload — the scene is `
                 + `deterministic within a session but not between them, so the live `
                 + `HTML and the recorded MP4 are different films. Usual cause: a seeded `
                 + `or unseeded random drawn once at load rather than derived from t`);
      }
    }

    // BACKSTOP ONLY — the shipped-frame spread check strictly dominates this
    // one, and an audit found no mutation that fires here without firing there
    // first (including a fully black render, where this stayed silent because
    // the caption pill kept the PNG above the floor). It earns its place for
    // exactly one case: a scene with no ?strip=text support, where the
    // shipped-frame check keeps its captions and loses power. Do not read a
    // green here as blankness coverage.
    // Measured on the screenshot rather than the canvas, so this works
    // for any backend (WebGL, 2D canvas, SVG/CSS, plain DOM). PNG compresses a
    // uniform frame to almost nothing: at 640x360 a flat fill lands around 1-3KB,
    // while anything with real content is far larger. A heuristic, but it catches
    // the failure that matters — a pipeline happily shooting 600 empty frames.
    // Threshold scales with the viewport instead of being a magic constant: a
    // uniform PNG costs roughly a byte per 40 pixels, so anything below that is
    // flat fill. Hardcoding 6000 silently mis-calibrated the moment VIEWPORT
    // changed, which is exactly the kind of coupling nobody notices.
    const blankFloor = Math.round((VIEWPORT.width * VIEWPORT.height) / 40);
    // ALL-quantified: the old single sample failed a legitimate film on a 1.6%
    // margin at one arbitrary second, and passed a broken one by 9 bytes.
    for (let i = 0; i < shots.length; i++) {
      if (shots[i].length < blankFloor) {
        fails.push(`frame looks blank at t=${PLAN[i]} (${shots[i].length} bytes compressed, floor ${blankFloor})`);
        break;
      }
    }

    // --- MOSTLY advisory below: caption speed and caption overflow only warn.
    // Framing invariance and the >=99% near-black branch of exposure are HARD
    // fails and push to `fails` (see their own comments). An earlier version of
    // this header said "never fail the build", contradicting code 130 lines
    // down. What IS true for all four: each is wrapped so an unexpected error
    // becomes a warning, never a FAIL. -----------------------------------
    //
    // The four bodies now live at module scope (R4.1), which is the point of
    // the extraction: a bracket can drive one of them against a page it set up
    // itself, instead of rebuilding this whole function to reach one check.
    // `beats` is read HERE and not inside them, unguarded, exactly as before —
    // a scene whose window.BEATS getter throws still reaches the outer catch
    // and fails, rather than being downgraded to four separate warnings.
    Object.assign(ctx, { dur, t, beats: await page.evaluate('window.BEATS') });
    // Driven from an array because the ORDER is load-bearing, not incidental:
    // caption overflow mutates #cap and must follow the determinism capture,
    // and three of the four resize the viewport and restore it for the next.
    // Through runChecks, so the keys assigned one line above are asserted rather
    // than assumed; bracket-driver.js is what says that guard still fires.
    await runChecks(ADVISORY_CHECKS, ctx);
  } catch (e) {
    fails.push(e.message.split('\n')[0]);
  }
  await page.close();
  // Dedupe: this scene is loaded more than once, so a boot-time console error
  // repeats per load, and a per-frame warn inside seekTo (the nodeFrame guard,
  // say) emits once per rendered frame while the live-playback loop runs. One
  // diagnostic should read as one line, not as a flood.
  // Classify three's fallback announcement now that window.BACKEND is known —
  // it could not be classified when it arrived, because the console handler is
  // registered long before the scene boots. Expected when the scene reports it
  // fell back (or is 2D and reports nothing); a contradiction when the scene
  // claims the hardware path anyway.
  if (fallbackNotices.length) {
    if (backend === 'webgpu') {
      noise.push(`console warning: the renderer announced a WebGL2 fallback while the scene `
               + `reports BACKEND='webgpu' — one of the two is wrong. `
               + fallbackNotices[0].slice(0, 90));
    } else {
      dropped.push(...fallbackNotices);
    }
  }
  if (dropped.length) {
    const uniq = [...new Set(dropped)];
    warnings.push(`suppressed ${dropped.length} console message(s) as driver noise or an `
                + `expected backend-fallback notice — READ THEM: the driver filter matches a `
                + `prefix, so it cannot tell a cloaked defect from real noise. `
                + uniq.slice(0, 4).map(t => t.slice(0, 90)).join(' | ')
                + (uniq.length > 4 ? ` (+${uniq.length - 4} more)` : ''));
  }
  return { fails: fails.concat([...new Set(noise)]), warnings, backend };
}

(async () => {
  const argv = process.argv.slice(2);
  // --parity-only: the static half of this gate (marker parity + template
  // integrity) with NO browser launch. It exists so a fast caller -- an editor
  // hook, a pre-commit, CI's cheap stage -- can check the properties that are
  // pure string work without paying a multi-minute Chromium run. Critically it
  // is the SAME code, not a reimplementation: a second copy in another language
  // is the two-copies-drift failure this very check exists to prevent, and a
  // bash re-implementation of it had already diverged from this one on its
  // first day (it dropped a file with a mangled START marker silently).
  const parityOnly = argv.includes('--parity-only');
  // --parity-fix takes a VALUE flag, so the scene list can no longer be built
  // by filtering one string out of argv — `--from a.html` would leave `a.html`
  // in the list and the canonical would be treated as a scene to scan.
  const parityFix = argv.includes('--parity-fix');
  let fixFrom = null, sawFrom = false;
  let scenes = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--parity-only' || a === '--parity-fix') continue;
    if (a === '--from') { sawFrom = true; fixFrom = argv[++i] ?? null; continue; }
    scenes.push(a);
  }

  // TWO FLAG-COMBINATION REFUSALS, both from the 2026-07-31 review and both
  // reproduced against live fixtures. Refusals rather than best-effort handling
  // because each failure mode is SILENT — it exits 0 and reports success.
  //
  //   * --parity-only + --parity-fix: `parityOnly` was computed and then never
  //     consulted, so --parity-fix silently won. --parity-only is the read-only
  //     contract that static.yml and the INSTALLED pre-commit hook run; a
  //     read-only contract an adjacent flag can turn into a writer is not one.
  //   * --from without --parity-fix: the value was consumed regardless, eating
  //     the NEXT FILENAME out of a read-only scan. Reproduced: two genuinely
  //     drifted files scanned as one and reported green. Silently scanning one
  //     file fewer than asked is the same class as the mangled-marker episode —
  //     the check goes quiet and the exit code says everything is fine.
  const refuseArgs = msg => { console.error(`smoke: ${msg}`); process.exit(1); };
  if (parityOnly && parityFix) {
    refuseArgs('--parity-only and --parity-fix are mutually exclusive. --parity-only is the '
             + 'read-only half that CI and the pre-commit hook run and it must never write; '
             + 'run the fix as its own deliberate invocation.');
  }
  if (sawFrom && !parityFix) {
    refuseArgs(`--from is only meaningful with --parity-fix. Consuming it here would swallow `
             + `${JSON.stringify(fixFrom)} out of the scene list and scan one file fewer than `
             + `you asked for, reporting green for the file it never read.`);
  }

  if (!scenes.length) {
    scenes = fs.readdirSync(process.cwd())
      // `.smoke-*` are this script's own scratch copies. Excluded explicitly:
      // one left behind by an interrupted run would otherwise be adopted as a
      // real scene on the next run -- joining the parity set and being rendered.
      .filter(f => f.endsWith('.html') && !f.endsWith('.bundled.html')
                   && !path.basename(f).startsWith('.smoke-'));
  }
  if (!scenes.length) { console.error('no scenes to check'); process.exit(1); }

  // --parity-fix --from <canonical>: the WRITE half of parity. --parity-only
  // reports that the copies disagree; this makes them agree, from a source you
  // NAME. 4,611 lines are held byte-identical by hand across the carriers, and
  // hand-propagation is the tax that measurement made visible.
  //
  // TWO NON-NEGOTIABLES, both bracketed in bracket-parity.js:
  //
  //   * THE SOURCE IS NAMED, NEVER INFERRED. There is no majority vote and no
  //     "most common block wins". A majority is precisely how a block that
  //     drifted into three files rewrites the two that were still right — the
  //     tool would launder a regression into every carrier and report success.
  //     No --from, no write.
  //   * A MALFORMED SOURCE IS REFUSED, and so is a malformed target. `-START`
  //     without a well-formed block is the mangled-marker shape that already
  //     made this check go quiet once (see the parity section below); reading a
  //     block out of one, or writing a good block into one, would corrupt a
  //     file that is already broken in a way nothing else reports.
  //
  // AND ONE PROPERTY THAT OUTRANKS BOTH: every file and every fence is
  // validated BEFORE the first byte is written. A refusal that has already
  // rewritten three of eight carriers leaves the corpus in a state no check
  // describes and no author expects — worse than either finishing or declining
  // cleanly. That is why this collects `writes` and applies them at the end.
  if (parityFix) {
    const FENCES = ['CONTRACT', 'KERNEL', 'SOLVER', 'RIG', 'DRIVER', 'CHARACTER', 'HTML'];
    const reFor = name => name === 'HTML'
      ? new RegExp(`<!-- ==== ${name}-START ==== -->[\\s\\S]*?<!-- ==== ${name}-END ==== -->`)
      : new RegExp(`\\/\\* ==== ${name}-START ====[\\s\\S]*?\\/\\* ==== ${name}-END ==== \\*\\/`);
    const refuse = msg => { console.error(`parity-fix: ${msg}`); process.exit(1); };

    if (!fixFrom) {
      refuse('need --from <canonical.html>. The source is named, never inferred — there is no '
           + 'majority vote here, because a block that drifted into three carriers would '
           + 'otherwise rewrite the two that were correct, and report success doing it.');
    }
    let srcText = null;
    try { srcText = fs.readFileSync(fixFrom, 'utf8'); }
    catch (e) { refuse(`cannot read source ${fixFrom} — ${e.code || e.message}`); }

    const blocks = new Map();
    for (const name of FENCES) {
      const RE = reFor(name);
      if (srcText.includes(`${name}-START`) && !RE.test(srcText)) {
        refuse(`source ${fixFrom} has ${name}-START but no well-formed ${name} block — refusing to `
             + `propagate from a malformed source. Repair BOTH markers there first; a mangled END `
             + `reads identically to a missing one here.`);
      }
      const m = srcText.match(RE);
      if (m) blocks.set(name, m[0]);
    }
    if (!blocks.size) refuse(`source ${fixFrom} carries no fenced block — nothing to propagate`);

    const targets = scenes.filter(f => path.resolve(f) !== path.resolve(fixFrom));
    const writes = [];
    for (const f of targets) {
      let txt = null;
      try { txt = fs.readFileSync(f, 'utf8'); }
      catch (e) { refuse(`cannot read ${f} — ${e.code || e.message}`); }

      // VALIDATE OVER ALL SEVEN FENCES, not over `blocks`. Iterating the fences
      // the SOURCE happens to carry is how a target broken in a fence the source
      // lacks got written anyway, exit 0 — and it is not hypothetical: propagating
      // from scene2d.template.html, which carries 2 of 7, validated two fences
      // while writing to all nine carriers. The guard's subject is the TARGET's
      // integrity, so the target's own markers decide what gets inspected.
      for (const name of FENCES) {
        const RE = reFor(name);
        if (txt.includes(`${name}-START`) && !RE.test(txt)) {
          refuse(`${f} has ${name}-START but no well-formed ${name} block — refusing the WHOLE run `
               + `rather than rewriting some carriers and not others. Nothing has been written.`);
        }
      }

      // WRITABILITY IS PART OF VALIDATION. It was not, and that was the gap
      // between the comment above and the code: readability and well-formedness
      // were checked, then the write loop threw on the first read-only target
      // and left every carrier before it rewritten. Reproduced with chmod 444.
      try { fs.accessSync(f, fs.constants.W_OK); }
      catch (e) {
        refuse(`cannot write ${f} — ${e.code || e.message}. Every target is checked for `
             + `writability BEFORE the first byte is written, because a write that dies `
             + `part-way leaves the corpus half-propagated and nothing reports that state.`);
      }

      let next = txt;
      for (const [name, block] of blocks) {
        const RE = reFor(name);
        // A file that does not carry this fence is LEFT ALONE, never given one:
        // removing your markers is how a scene legitimately leaves the parity
        // set, and re-adding them would drag it back in without being asked.
        // Function replacement, not a string: `$&` and `$1` inside a fenced
        // block would otherwise be read as replacement patterns and silently
        // mangle the very bytes this exists to keep identical.
        if (RE.test(next)) next = next.replace(RE, () => block);
      }
      if (next !== txt) writes.push([f, next]);
    }

    // Nothing above this line has written anything.
    //
    // accessSync answers a permission question and nothing else, so a full disk
    // or a lock can still throw here. That residue is NOT bracketed: bracket-parity.js
    // has an arm for the permission case above and NO arm reaches this catch, so
    // read it as depth, not as a control. What it buys is that a partial write is LOUD:
    // the run names the carriers that landed instead of dying on a stack trace
    // and leaving the reader to guess how far it got.
    const landed = [];
    try {
      for (const [f, next] of writes) { fs.writeFileSync(f, next); landed.push(f); }
    } catch (e) {
      console.error(`parity-fix: PARTIAL WRITE — ${e.code || e.message}. `
        + `${landed.length} of ${writes.length} carrier(s) were already rewritten:`);
      for (const f of landed) console.error('       ' + f);
      console.error('The corpus is half-propagated. Run --parity-only and repair before committing.');
      process.exit(1);
    }
    if (writes.length) {
      console.log(`parity-fix: propagated ${blocks.size} fence(s) from ${fixFrom} into ${writes.length} file(s):`);
      for (const [f] of writes) console.log('       ' + f);
      console.log('re-run --parity-only to confirm, and read the diff before committing — this '
                + 'command is propagation, not review.');
    } else {
      console.log(`parity-fix: nothing to do — every carrier scanned already matches ${fixFrom}`);
    }
    process.exit(0);
  }

  // VENDOR_CACHE: the three bundle is built at most ONCE per run. The embed
  // happens per-scene inside ensureVendor during the bundle step below, and
  // without the cache each template scene paid its own full `bun build
  // --minify` of three (~1-2s) for a byte-identical product. Per-run and
  // deleted at the end of the run, so staleness cannot outlive it.
  const vendorCache = path.join(os.tmpdir(), `.smoke-vendor-${process.pid}.js`);

  // Kernel parity: templates carry a marked shared-kit block that must stay
  // byte-identical across files — the two-copies-drift rule, enforced the way
  // this repo family always enforces it: mirrored copies plus a check that
  // fails on drift. Only applies when 2+ checked files carry markers, so
  // scenes predating the kernel (or ones that legitimately diverged and
  // removed their markers) never fail. A HARD FAIL, not advisory: drift is
  // objective, and a drifted kit is exactly how the 2D and 3D backends stop
  // rendering the same ramp the same way.
  let kernelFail = false;
  let sceneCount = 0;   // files actually READ, reported on the verdict line
  {
    // One check, four fences. KERNEL is the shared kit (all templates); SOLVER
    // is the cinematography solver, which reached SIX copies before its fence
    // existed -- the postmortem's own "at a third consumer, extract or
    // marker-fence it" trigger, fired and unacted; RIG (renderer setup and
    // mesh helpers) and DRIVER (overlay + recorder contract + async boot) fence
    // the 3D scenes' other byte-identical blocks — between them they carry
    // every LOAD-BEARING determinism guard (sortObjects, frustumCulled, the
    // nodeFrame tick), which is exactly the code whose silent drift would cost
    // the most. Scenes that legitimately diverge remove their markers and
    // leave the parity set.
    // AN ARGUMENT THAT CANNOT BE READ IS A HARD FAILURE, not a skip. This was
    // `catch (e) {}`, and the failure it hid is the worst shape a gate has: the
    // verdict on what WAS scanned stays correct while the scan itself silently
    // shrinks. Under bash an unmatched glob arrives as a literal (zsh errors
    // first; bash does not), so `fixtures/defect-corpus/*.html` survives a
    // rename of that directory as a string, matches nothing, and the run prints
    // ok having checked one directory less — in CI and in every installed hook,
    // green forever. A directory argument threw EISDIR into the same swallow.
    //
    // Collected rather than thrown on the first one: being told all three bad
    // arguments at once is the difference between one fix and three runs.
    const texts = new Map();                        // each file read ONCE
    const unreadable = [];
    for (const f of scenes) {
      try { texts.set(f, fs.readFileSync(f, 'utf8')); }
      catch (e) { unreadable.push(`${f} — ${e.code || e.message}`); }
    }
    if (unreadable.length) {
      console.error(`smoke: ${unreadable.length} argument(s) could not be read, so they were `
        + `never checked. Refusing rather than reporting on the rest:`);
      for (const u of unreadable) console.error('       ' + u);
      console.error('An unmatched glob reaches here as a literal string. If a directory was '
        + 'renamed, every caller that globs it is now scanning one directory less.');
      process.exit(1);
    }
    sceneCount = texts.size;
    // CONTRACT joins the set at 0.16.44. It was byte-identical across all eight
    // carriers and fenced by nothing — 3 lines of it were also FALSE ("the HTML
    // loop and the MP4 render provably identical"), which is how it was found:
    // correcting a wrong sentence in eight files by hand is the exact tax the
    // fences exist to remove, and the block sat outside every one of them.
    for (const name of ['CONTRACT', 'KERNEL', 'SOLVER', 'RIG', 'DRIVER', 'CHARACTER', 'HTML']) {
      // HTML fences the shared page scaffold (overlay CSS + caption/title DOM),
      // which lives outside <script> — its markers are HTML comments, not JS ones.
      const RE = name === 'HTML'
        ? new RegExp(`<!-- ==== ${name}-START ==== -->[\\s\\S]*?<!-- ==== ${name}-END ==== -->`)
        : new RegExp(`\\/\\* ==== ${name}-START ====[\\s\\S]*?\\/\\* ==== ${name}-END ==== \\*\\/`);
      const found = [];
      for (const [f, txt] of texts) {
        // Half-fenced is not exempt — and ask the SAME regex that builds the
        // parity set. An earlier version asked `!txt.includes('KERNEL-END')`,
        // which a mangled `KERNEL-ENDX` satisfies as a substring: the block
        // stopped extracting, the file dropped out of the parity set, and the
        // guard stayed silent -- the exact self-exemption it exists to
        // prevent. Deriving both from one pattern means any broken fence,
        // however broken, fails loudly.
        if (txt.includes(`${name}-START`) && !RE.test(txt)) {
          kernelFail = true;
          console.log(`FAIL ${f} — has ${name}-START but no well-formed ${name} block; `
                    + `check BOTH markers — a mangled START reads the same way here, `
                    + `and either way the file is excluded from the parity check`);
          continue;
        }
        const m = txt.match(RE);
        if (m) found.push({ f, k: m[0] });
      }
      if (found.length >= 2 && new Set(found.map(x => x.k)).size > 1) {
        kernelFail = true;
        console.log(`FAIL ${name} drift — these scenes carry different ${name} blocks:`);
        for (const x of found) console.log('       ' + x.f);
      } else if (found.length === 1 && texts.size > 1) {
        // A comparison of one file compares nothing. Without this line the run
        // prints `parity/integrity: ok` and the reader credits the fence with a
        // check that never ran — the precise shape of a green board that means
        // nothing. Say it out loud instead of documenting it elsewhere.
        //
        // Gated on a multi-scene scan on purpose. The documented authoring loop
        // leaves ONE film in the working directory, where every fence is
        // trivially uncompared; firing per fence there would print six notes
        // advising something the author cannot do, and noise that always fires
        // is noise nobody reads. The single-scene case is stated once below.
        console.log(`note: ${name} parity inert — only ${found[0].f} carries this fence; `
                  + `add the other carriers to the scan to compare`);
      }
    }

    // The single-scene case, said once rather than once per fence. Parity is
    // structurally inapplicable here, and a reader who does not know that reads
    // `parity/integrity: ok` as a fence check that passed.
    if (texts.size === 1) {
      console.log('note: parity needs two or more scenes to compare; scanned 1, '
                + 'so no fence was checked (integrity still was)');
    }

    // Template integrity, checked here because it is the same kind of property:
    // pure string work over the files, no render required. A shipped
    // `*.template.html` is a small readable starting point that keeps its
    // `<script src>` tag; build.js refuses to embed into one, but that guards
    // the TOOL path, and an artifact can be broken by a hand edit or a merge
    // that never calls it. Bracketed by observation both ways: intact templates
    // measure 40, 28 and 56 KB; an inflated one carries the ~1.09 MB embed
    // (802 KB observed on the old stack). Nothing sits near 200.
    for (const f of scenes) {
      if (!/\.template\.html$/.test(path.basename(f))) continue;
      let sz = 0;
      try { sz = fs.statSync(f).size; } catch (e) { continue; }
      if (sz <= 200 * 1024) continue;
      kernelFail = true;
      console.log(`FAIL ${f} — template is ${Math.round(sz / 1024)} KB; a template `
                + `must stay well under 200 KB (a vendored library looks embedded `
                + `into it — templates keep their <script src> tag and are copied `
                + `before being built on)`);
    }
  }

  if (parityOnly) {
    // THE COUNT IS PART OF THE VERDICT. The guard above catches an unmatched
    // glob that arrives as a literal; it structurally CANNOT catch the other
    // half — under `nullglob` the argument is removed from argv before smoke
    // runs, so a scan that was meant to cover three directories covers two and
    // nothing here knows a third was intended. A green line that states its own
    // scope is the only thing that makes that visible, and it costs one number.
    const scanned = `${sceneCount} file(s) scanned`;
    console.log(kernelFail ? `\nparity/integrity: FAILED (${scanned})`
                           : `\nparity/integrity: ok — ${scanned}`);
    process.exit(kernelFail ? 1 : 0);
  }

  loadBrowserDeps();
  const browser = await chromium.launch({
    executablePath: chromiumPath(),
    // THE SAME angleArgs as shoot.js (backend.js), so the gate checks the
    // configuration the recorder will actually shoot. The one difference is
    // deliberate: smoke may probe WEBGPU=swiftshader without WEBGPU_UNSAFE_SHIP
    // — its shipped-frame check exists exactly to demonstrate that
    // configuration failing — while shoot.js refuses to ship on it.
    args: angleArgs(),
  });

  let failed = kernelFail ? 1 : 0;
  let warned = 0;
  for (const scene of scenes) {
    // There is exactly ONE artifact now. Vendoring embeds three directly into the
    // scene, so the old source-vs-bundled pair collapsed into a single file --
    // and with it the whole class of "the bundled copy drifted from the source".
    // What survives is the property that mattered: assert the scene really is
    // self-contained, because a scene that still points at an external library
    // renders nothing the moment it is copied or committed on its own.
    // A template must keep its vendor tag, but it can only be RENDERED with
    // three embedded. Both are satisfied by checking a throwaway copy beside
    // it (same directory, so relative references still resolve). Checking the
    // template in place used to leave 0.77 MB of inlined three.js in a tracked
    // source file every time the gate ran -- a gate that damages its own input.
    let target = scene, tmp = null;
    if (/\.template\.html$/.test(path.basename(scene))) {
      // The copy must NOT itself end in `.template.html`, or ensureVendor's
      // refusal fires on it and the template can never be rendered at all.
      tmp = path.join(path.dirname(path.resolve(scene)),
                      `.smoke-${process.pid}-`
                      + path.basename(scene).replace(/\.template\.html$/, '.check.html'));
      fs.copyFileSync(scene, tmp);
      target = tmp;
    }
    try {
      try {
        execFileSync('bun', ['run', path.join(__dirname, 'build.js'), 'bundle', target],
                     { encoding: 'utf8', env: { ...process.env, VENDOR_CACHE: vendorCache } });
      } catch (e) {
        console.log(`FAIL ${scene} [self-contained] — ${e.message.split('\n')[0]}`);
        failed++;
      }
      const { fails, warnings, backend } = await checkScene(browser, target);
      const tag = backend ? `[source, ${backend}]` : '[source]';
      if (fails.length) {
        failed++;
        console.log(`FAIL ${scene} ${tag}`);
        for (const f of fails) console.log('       ' + f);
      } else {
        console.log(`ok   ${scene} ${tag}`);
      }
      // Advisory: printed after the ok/FAIL line, never counted toward `failed`
      // or the exit code — a scene with only warnings still prints `ok` and
      // still exits 0.
      if (warnings.length) {
        warned += warnings.length;
        console.log(`warn ${scene} [source]`);
        for (const w of warnings) console.log('       ' + w);
      }
    } finally {
      // finally, not end-of-loop: a throwing check must not leave a ~1.09 MB
      // .smoke-*.html sitting in templates/ for someone to commit by accident.
      if (tmp) { try { fs.unlinkSync(tmp); } catch (e) {} }
    }
  }
  await browser.close();
  try { fs.unlinkSync(vendorCache); } catch (e) {}
  console.log(failed ? `\n${failed} check(s) failed` : '\nall scenes pass');
  console.log(`${warned} advisory warning(s)`);
  process.exit(failed ? 1 : 0);
})();
