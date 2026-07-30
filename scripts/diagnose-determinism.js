#!/usr/bin/env bun
/* Turn a determinism FAIL into evidence, instead of a three-minute blind run.
 *
 * smoke.js reports "seekTo(5.36) not deterministic" and stops — correct for a
 * gate, useless for a diagnosis. This reproduces the same arm and says WHERE the
 * two renders differ, which is the difference between "materials.html is broken"
 * and "the cel-banded torus is the culprit".
 *
 * Written because the failure it exists for does NOT reproduce on macOS (hardware
 * GL or software GL), so CI is the only instrument that sees it and CI's only
 * output is a log line. Run it there.
 *
 *   NODE_PATH="$PWD/node_modules" \
 *     bun run scripts/diagnose-determinism.js <scene.html> <t>
 *
 * Prints both hashes and, when they differ, the coarse grid cells that changed —
 * then writes before/after PNGs beside the scene for upload as artifacts.
 *
 * The read is in ONE evaluate per sample, deliberately: the node stack clears the
 * drawing buffer after compositing, so a canvas read in a LATER task sees zeros.
 * smoke.js's sampleAt carries the same constraint and the same comment.
 */
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { chromiumPath, angleArgs, settle } = require(path.join(__dirname, '..', 'plugin', 'skills', 'mitate', 'templates', 'backend.js'));

const scene = process.argv[2];
const T = parseFloat(process.argv[3]);
if (!scene || !Number.isFinite(T)) {
  console.error('usage: diagnose-determinism.js <scene.html> <t>');
  process.exit(2);
}
const GX = 32, GY = 18;
const sha = b => crypto.createHash('sha256').update(b).digest('hex').slice(0, 16);

// Seek and read in one task. Returns a coarse luma grid of the whole canvas.
function gridAt(page, t) {
  return page.evaluate(`(() => {
    window.seekTo(${t});
    const c = document.querySelector('canvas');
    const tmp = document.createElement('canvas');
    tmp.width = ${GX}; tmp.height = ${GY};
    const g = tmp.getContext('2d');
    g.drawImage(c, 0, 0, ${GX}, ${GY});
    const d = g.getImageData(0, 0, ${GX}, ${GY}).data;
    const out = [];
    for (let i = 0; i < d.length; i += 4)
      out.push(0.2126 * d[i] + 0.7152 * d[i+1] + 0.0722 * d[i+2]);
    return out;
  })()`);
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: angleArgs() });
  const page = await browser.newPage({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 1 });
  const out = f => path.join(path.dirname(path.resolve(scene)), f);
  try {
    await page.goto('file://' + path.resolve(scene) + '?record=1');
    await page.waitForFunction('window.sceneReady === true', { timeout: 20000 });
    await page.evaluate('window.stopPlayback && window.stopPlayback()');
    const dur = await page.evaluate('window.DURATION');
    console.log(`scene ${path.basename(scene)}  DURATION ${dur}  backend ${await page.evaluate('window.BACKEND || "n/a"')}`);

    // FIRST visit to t.
    const gA = await gridAt(page, T);
    await settle(page);
    const shotA = await page.screenshot();

    // Away, then BACK — the arm smoke fails on. Rule 5's shape: a revisit after
    // the draw order has had a chance to change.
    await gridAt(page, dur);
    const gB = await gridAt(page, T);
    await settle(page);
    const shotB = await page.screenshot();

    console.log(`first  visit to ${T}: ${sha(shotA)}`);
    console.log(`second visit to ${T}: ${sha(shotB)}`);
    if (sha(shotA) === sha(shotB)) {
      console.log('IDENTICAL — did not reproduce here');
      return;
    }
    console.log('DIFFERS — locating it');
    const cells = gA.map((v, i) => ({ i, d: Math.abs(v - gB[i]) }))
      .filter(c => c.d > 0.5).sort((a, b) => b.d - a.d);
    console.log(`${cells.length}/${GX * GY} grid cells changed by >0.5 luma`);
    for (const c of cells.slice(0, 12)) {
      console.log(`  cell (x=${c.i % GX}, y=${Math.floor(c.i / GX)}) of ${GX}x${GY}  Δluma ${c.d.toFixed(1)}`);
    }
    // Localized vs global is the whole question: one object misbehaving looks
    // nothing like a whole-frame shift.
    const frac = cells.length / (GX * GY);
    console.log(frac < 0.15
      ? `LOCALIZED (${(frac * 100).toFixed(0)}% of cells) — suspect one object, not the pipeline`
      : `WIDESPREAD (${(frac * 100).toFixed(0)}% of cells) — suspect the pipeline or the camera, not one object`);
    fs.writeFileSync(out('diag-first.png'), shotA);
    fs.writeFileSync(out('diag-second.png'), shotB);
    console.log('wrote diag-first.png and diag-second.png');
  } finally {
    await browser.close();
  }
})();
