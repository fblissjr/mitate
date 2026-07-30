#!/usr/bin/env bun
/* Measure the RATE of the in-session determinism failure, per scene and per t.
 *
 * Written for forward item 2 of internal/postmortems/2026-07-29_span_instrument-
 * hardening.md. On Linux/WebGL2 the gate has failed smoke's in-session arm four
 * times across TWO scenes and TWO timestamps (materials.html at 5.36,
 * menagerie.html at 8.52) against two clean runs, while macOS passes on both
 * hardware and software GL. Four runs spanning a changed configuration support no
 * conclusion, so the next step is a rate, not another anecdote.
 *
 * Why this and not "run the gate ten times": the gate spends ~2m30s per run on
 * eight scenes and yields ONE sample of each cell. Repeating the arm inside one
 * run yields N samples for the same wall clock, and `cancel-in-progress` on the
 * gate's concurrency group means parallel dispatches would cancel each other
 * anyway. One run, many samples.
 *
 *   NODE_PATH="$PWD/node_modules" \
 *     bun run scripts/sample-determinism.js [--repeats N] [scene.html ...]
 *
 * Defaults to every *.html in the cwd that reports a 3D backend, 5 repeats.
 *
 * It compares TWO things per cell, and the difference between them is the whole
 * diagnosis. smoke.js compares screenshots, which travel through the compositor.
 * This also hashes the canvas IN-PAGE. The discriminator, straight out of the
 * comment above smoke's own determinism check:
 *
 *   canvas differs  -> the scene really is carrying state. A scene defect.
 *   canvas SAME, screenshot differs -> a capture/presentation race, not a scene
 *     defect. smoke.js has produced exactly this false positive before ("a
 *     capture race reported as a scene bug, which is the one thing this check
 *     must never do"), and closed it with the double-rAF settle -- ~33ms, which
 *     may simply be too short on a slower software-GL runner.
 *
 * If the Linux failures are the second row, the films are fine and `settle` is
 * the thing to fix.
 *
 * OBSERVER EFFECT, measured the hard way. The first Linux run of this script was
 * 0 failures in 200 samples, on the platform where the gate had failed four
 * times — and the likeliest reason is this script itself. `canvasHashAt` does a
 * drawImage + getImageData, which is a GPU READBACK, which forces a
 * synchronization point. If the failure is a presentation race, the discriminator
 * suppresses the phenomenon it exists to observe.
 *
 * Hence --no-canvas: screenshots only, exactly what smoke.js compares, no
 * readback. Run BOTH and the pair is the experiment:
 *
 *   fails without the readback, clean with it -> a capture race, near-proven,
 *     and the readback is what masks it
 *   clean both ways -> the difference is elsewhere in what smoke does per page
 *     (a cold ?strip=text page, a live-playback page, three viewport resizes for
 *     framing, exposure sampling) and this script is too gentle to reproduce it
 * Exits 0 whatever it finds: this is an instrument, not a gate. A rate of zero is
 * a result, and a non-zero rate is the finding it exists to produce.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { chromium } = require('playwright-core');
const { chromiumPath, angleArgs, settle } = require(
  path.join(__dirname, '..', 'plugin', 'skills', 'mitate', 'templates', 'backend.js'));

const argv = process.argv.slice(2);
const ri = argv.indexOf('--repeats');
const REPEATS = ri >= 0 ? parseInt(argv[ri + 1], 10) : 5;
// Screenshots only, no in-page readback: matches smoke.js exactly. Loses the
// mechanism label and gains the ability to see a race the readback would hide.
const NO_CANVAS = argv.includes('--no-canvas');
let scenes = argv.filter((a, i) => a.endsWith('.html') && (ri < 0 || i !== ri + 1));
if (!scenes.length) {
  scenes = fs.readdirSync(process.cwd())
    .filter(f => f.endsWith('.html') && !f.startsWith('.smoke-') && !f.endsWith('.bundled.html'));
}
const sha = b => crypto.createHash('sha256').update(b).digest('hex').slice(0, 12);

// Seek and hash the canvas inside ONE evaluate. The node stack clears the drawing
// buffer after compositing, so a read in a LATER task intermittently sees zeros --
// smoke.js's sampleAt exists for this and carries the same warning.
const canvasHashAt = (page, t) => page.evaluate(`(() => {
  window.seekTo(${t});
  const c = document.querySelector('canvas');
  const off = document.createElement('canvas');
  off.width = 160; off.height = 90;
  const g = off.getContext('2d');
  g.drawImage(c, 0, 0, 160, 90);
  const d = g.getImageData(0, 0, 160, 90).data;
  let h = 2166136261;
  for (let i = 0; i < d.length; i += 4) { h ^= d[i] | (d[i+1] << 8) | (d[i+2] << 16); h = (h * 16777619) >>> 0; }
  return h.toString(16);
})()`);

// The same four interior points smoke's samplePlan produces (dur*i/5, i=1..4) —
// which is where both observed failures landed (13.4/5 = 2.68 … 5.36 …). Flash
// avoidance is deliberately NOT replicated: this measures a rate at fixed cells,
// and a moving sample point would confound the per-cell counts.
const plan = dur => [1, 2, 3, 4].map(i => +(dur * i / 5).toFixed(4));

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: angleArgs() });
  const tally = new Map();   // "scene@t" -> {fail, n}
  let backendSeen = 'n/a';
  try {
    for (let rep = 1; rep <= REPEATS; rep++) {
      for (const scene of scenes) {
        // A FRESH page per repeat, matching how smoke opens a scene: this samples
        // load-to-load variation as well as within-session, and the failure has
        // only ever been seen on a first visit after a seek away.
        const page = await browser.newPage({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 1 });
        try {
          await page.goto('file://' + path.resolve(scene) + '?record=1');
          await page.waitForFunction('window.sceneReady === true', { timeout: 20000 });
          await page.evaluate('window.stopPlayback && window.stopPlayback()');
          const dur = await page.evaluate('window.DURATION');
          const backend = await page.evaluate('window.BACKEND || null');
          if (backend) backendSeen = backend;
          if (!backend) continue;                       // 2D scenes are not in scope
          for (const t of plan(dur)) {
            const key = `${scene}@${t}`;
            const rec = tally.get(key) || { fail: 0, race: 0, n: 0 };
            let ca = null, cb = null;
            if (NO_CANVAS) await page.evaluate(`window.seekTo(${t})`);
            else ca = await canvasHashAt(page, t);
            await settle(page);
            const a = sha(await page.screenshot());
            if (NO_CANVAS) {
              await page.evaluate(`window.seekTo(${dur})`);
              await page.evaluate(`window.seekTo(${t})`);
            } else {
              await canvasHashAt(page, dur);
              cb = await canvasHashAt(page, t);
            }
            await settle(page);
            const b = sha(await page.screenshot());
            rec.n++;
            if (a !== b) {
              rec.fail++;
              // Canvas identical but capture differed: the compositor, not the scene.
              if (ca !== null && ca === cb) rec.race++;
            }
            tally.set(key, rec);
          }
        } catch (e) {
          console.log(`  ${scene} rep${rep}: errored — ${e.message.split('\n')[0]}`);
        } finally {
          await page.close();
        }
      }
      console.log(`repeat ${rep}/${REPEATS} done`);
    }
  } finally {
    await browser.close();
  }

  console.log(`\nbackend: ${backendSeen}   repeats: ${REPEATS}   platform: ${process.platform}`
            + `   mode: ${NO_CANVAS ? 'screenshots only (no readback, matches smoke)' : 'canvas + screenshot'}`);
  const rows = [...tally.entries()].sort((x, y) => (y[1].fail / y[1].n) - (x[1].fail / x[1].n));
  let anyFail = 0;
  for (const [key, r] of rows) {
    if (r.fail) anyFail++;
    const pct = (100 * r.fail / r.n).toFixed(0);
    const why = r.fail ? (r.race === r.fail ? '  CAPTURE RACE (canvas identical)'
                        : r.race ? `  ${r.race}/${r.fail} capture race, rest real`
                        : '  SCENE STATE (canvas differed)')
                     : '';
    // In --no-canvas mode there is no label to give, and claiming one would be
    // inventing a mechanism from a screenshot diff.
    console.log(`  ${r.fail ? 'FAIL' : ' ok '} ${key.padEnd(34)} ${r.fail}/${r.n} (${pct}%)${why}`);
  }
  console.log(anyFail
    ? `\n${anyFail} of ${rows.length} cells non-deterministic at least once — that is the rate.`
    : `\nall ${rows.length} cells deterministic in every repeat. A zero rate here is a`
      + ` result about THIS platform only; the failure has only been seen on Linux.`);
})();
