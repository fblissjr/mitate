/* Bracket for the live-playback gate (shipped in 0.16.1).
 *
 * Builds its own broken copies of a shipped example in a temp dir, so its
 * fixtures need no upkeep. The first version of this depended on scratch files
 * that had already been deleted by the time it was preserved — a bracket you
 * cannot re-run is a claim, not a control.
 *
 * Detector under test: wrap window.seekTo, count calls, require at least two
 * DISTINCT t. Distinct rather than rising, because a viewer-driven clock scrubs
 * backwards and the built-in loop wraps at DURATION — monotonicity would
 * false-positive on both. Counted AFTER the inner call returns, so a throwing
 * seekTo cannot inflate the count.
 *
 *   NODE_PATH="$PWD/node_modules" \
 *     bun run "${CLAUDE_SKILL_DIR}"/templates/bracket-liveplay.js
 *
 * Invoke it FROM a working directory, leaving the file here: the fixture
 * resolves beside this script, but playwright-core exists only where a film is
 * being built. Bun stops its walk-up at the first node_modules it finds, which
 * is why the dependency has to be handed to it rather than discovered.
 *
 * Measured 2026-07-25 against gearbox at 0.16.0:
 *
 *   unmodified                 calls=21  distinct=21  PLAYING
 *   throw in the rAF loop      calls= 0  distinct= 0  FROZEN (fires)
 *   throw inside seekTo        calls= 0  distinct= 0  FROZEN (fires)
 *   host swallows the throw    calls= 0  distinct= 0  FROZEN (fires)
 *
 * CORRECTION, 2026-07-25. An earlier hand-run of this bracket reported the
 * fourth row as calls=71 / PLAYING and it was written up as the gate's blind
 * spot. That was an artifact of the PROBE, not the gate: that version
 * incremented the counter BEFORE calling the inner seekTo, so the increment
 * ran even when the inner threw. Counting after the inner returns — which is
 * what 0.16.1 ships — makes a swallowing host fire like any other frozen film.
 *
 * So the gate is not blind to a host that replaces the loop and swallows
 * exceptions. The wrapper ordering is load-bearing, and that is the finding.
 * If instruments.md carries the blind-spot claim, it needs this correction.
 */
const { chromium } = require('playwright-core');
const { chromiumPath, angleArgs } = require(require('path').join(__dirname, 'backend.js'));
const fs = require('fs');
const path = require('path');
const os = require('os');

// The corpus lives at the repo root (the plugin ships no films). Brackets are
// repo controls: they ship as dev tooling but run from a checkout, where four
// levels up from templates/ IS the repo root.
const EXAMPLE = path.join(__dirname, '..', '..', '..', '..', 'scenes', 'gearbox.html');
let wrong = 0;

// [tag, patch, expectPlaying] — expectPlaying is what the DETECTOR must
// conclude. Encoded (0.16.17) because without it this script printed four rows
// and exited 0 whatever they said: a control that cannot fail is decorative,
// and putting one in CI buys a green that means nothing.
const INJECTIONS = [
  ['unmodified', null, true],
  ['throw in the rAF loop', s => s.replace(
    'function loop(now){if(!playing)return;',
    'function loop(now){if(!playing)return;if(now>0)throw new Error("injected: loop");', 1), false],
  ['throw inside seekTo', s => s.replace(
    'window.seekTo=function(t){',
    'window.seekTo=function(t){if(t>0)throw new Error("injected: seekTo");', 1), false],
  ['host swallows the throw', s => s
    .replace('window.seekTo(((now-t0)/1000)%TOTAL);',
             'try{window.seekTo(((now-t0)/1000)%TOTAL);}catch(e){}', 1)
    .replace('window.seekTo=function(t){',
             'window.seekTo=function(t){if(t>0)throw new Error("injected: swallowed");', 1), false],
];

(async () => {
  const src = fs.readFileSync(EXAMPLE, 'utf8');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'liveplay-'));
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: angleArgs() });
  try {
    for (const [tag, patch, expectPlaying] of INJECTIONS) {
      const body = patch ? patch(src) : src;
      if (patch && body === src) {
        console.log(`${tag.padEnd(26)} SKIPPED — injection point not found (template drifted)`);
        wrong++;
        continue;
      }
      const out = path.join(dir, tag.replace(/\W+/g, '_') + '.html');
      fs.writeFileSync(out, body);
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
      await page.goto('file://' + out);
      await page.waitForFunction('window.sceneReady === true', null, { timeout: 180000 });
      await page.evaluate(() => {
        window.__n = 0; window.__ts = new Set();
        const inner = window.seekTo;
        window.seekTo = t => { const r = inner(t); window.__n++; window.__ts.add(+t.toFixed(4)); return r; };
      });
      await page.waitForTimeout(1000);
      const r = await page.evaluate(() => ({ calls: window.__n, distinct: window.__ts.size }));
      const passes = r.calls > 2 && r.distinct > 1;
      const ok = passes === expectPlaying;
      if (!ok) wrong++;
      console.log(`${tag.padEnd(26)} calls=${String(r.calls).padStart(3)} distinct=${String(r.distinct).padStart(3)}  -> ${passes ? 'PLAYING' : 'FROZEN (check fires)'}`
                + `${ok ? '' : `  BRACKET FAILED (expected ${expectPlaying ? 'PLAYING' : 'FROZEN'})`}`);
      await page.close();
    }
  } finally {
    await browser.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
  if (wrong) {
    console.log(`\n${wrong} row(s) did not behave as specified — the live-playback check is not`
              + ` doing what this bracket claims. Do not trust a green smoke run until this is 0.`);
    process.exit(1);
  }
  console.log(`\nall ${INJECTIONS.length} rows as specified`);
})();
