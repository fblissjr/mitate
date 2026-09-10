/* Bracket for the 2D template's CAMERA EXPORT: `CAM` and `worldToScreen`,
 * and its CAPTION BAND export, `CAP_SAFE_Y` (second half of the file).
 *
 * The property: worldToScreen(x, y) is where the frame actually drew world
 * point (x, y). Anything a scene draws in screen space against a world
 * position (a HUD tracer, an edge-pinned label) rests on it, and a stale or
 * partial restate is silent: the labels drift off their lanes, nothing throws.
 *
 * EXECUTE, DON'T MIRROR. The truth is not a second copy of the camera maths;
 * it is the transform the world pass drew with: the template's own
 * applyCamera(t), run inside save/restore after the seek and read back with
 * ctx.getTransform(), in the SAME task as the seek (the one-task rule
 * smoke.js's sampleAt states). worldToScreen is sampled first, from CAM as the
 * frame left it. An earlier version read the context straight after the seek,
 * trusting draw() to leave the camera transform on it; the caption-safe clip
 * made draw() end in ctx.restore(), and this bracket's pristine arm went red
 * on exactly that coupling, which is why the camera is now re-run explicitly.
 *
 * This names template internals (ctx, worldToScreen), because the property
 * under test IS a template internal. It is a read-only control over the
 * shipped template, not a tool that drives scenes, so the window-contract rule
 * does not apply to it.
 *
 *   cd <a workspace with playwright-core installed>
 *   NODE_PATH="$PWD/node_modules" bun run "${CLAUDE_SKILL_DIR}"/templates/bracket-camera2d.js
 *
 * Fixtures are mutated from the shipped template in a temp dir, and a
 * mutation that matches nothing counts as a failure (a fixture equal to its
 * original is an arm testing the null change).
 */
const { chromium } = require('playwright-core');
const { chromiumPath, angleArgs } = require(require('path').join(__dirname, 'backend.js'));
const fs = require('fs');
const path = require('path');
const os = require('os');

const TEMPLATE = path.join(__dirname, 'scene2d.template.html');

// [tag, patch, expectAgrees]
const ARMS = [
  ['pristine', null, true],
  // The restate is what keeps CAM current; without it CAM holds its initial
  // {s:1,cx:0,cy:0} and every mapping is wrong at any real canvas size.
  ['restate removed', s => s.replace('CAM.s=s;CAM.cx=cx;CAM.cy=cy;', ''), false],
  // A helper that forgets the zoom agrees only where s happens to be 1.
  ['helper ignores scale', s => s.replace(
    'canvas.width/2+(wx-CAM.cx)*CAM.s,canvas.height/2+(wy-CAM.cy)*CAM.s',
    'canvas.width/2+(wx-CAM.cx),canvas.height/2+(wy-CAM.cy)'), false],
];
// Sampled at the title (zoom 1), inside the push-in (zoom > 1) and at the end,
// so an error that only appears under zoom or only off-centre is reachable.
const TIMES = "[0, beatAt('two',.45), DURATION*.98]";
const POINTS = [[0, 0], [30, -12], [-52, 8]];
// Sub-pixel. DOMMatrix.transformPoint carries float error well below a
// micro-pixel but above 1e-6 (the first run of this bracket failed its own
// pristine arm at 1e-6 while printing 0.000px); the mutant arms miss by
// hundreds of pixels, so 1e-3 still separates them by five orders.
const TOL = 1e-3;

(async () => {
  const src = fs.readFileSync(TEMPLATE, 'utf8');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'camera2d-'));
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: angleArgs() });
  let wrong = 0;
  try {
    for (const [tag, patch, expectAgrees] of ARMS) {
      const body = patch ? patch(src) : src;
      if (patch && body === src) {
        console.log(`${tag.padEnd(22)} FIXTURE NOT BUILT — mutation matched nothing (template drifted)`);
        wrong++;
        continue;
      }
      const out = path.join(dir, tag.replace(/\W+/g, '_') + '.html');   // not *.template.html
      fs.writeFileSync(out, body);
      const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
      await page.goto('file://' + out + '?record=1');
      await page.waitForFunction('window.sceneReady === true', null, { timeout: 60000 });
      await page.evaluate('window.stopPlayback()');
      const r = await page.evaluate(`(() => {
        let worst = 0, n = 0;
        for (const t of ${TIMES}) {
          window.seekTo(t);                       // seek and read in ONE task
          // worldToScreen as the frame left CAM, captured BEFORE anything below
          // re-runs the camera (which would restate CAM itself).
          const P = ${JSON.stringify(POINTS)}, qs = P.map(([x, y]) => worldToScreen(x, y));
          // The transform the world pass drew with: the template's own
          // applyCamera for this t, run inside save/restore and read back.
          ctx.save(); applyCamera(t); const m = ctx.getTransform(); ctx.restore();
          P.forEach(([x, y], i) => {
            const p = m.transformPoint(new DOMPoint(x, y)), q = qs[i];
            worst = Math.max(worst, Math.hypot(p.x - q[0], p.y - q[1])); n++;
          });
        }
        return { worst, n, zoomed: CAM.s };
      })()`);
      const agrees = r.worst <= TOL;
      const ok = agrees === expectAgrees;
      if (!ok) wrong++;
      console.log(`${tag.padEnd(22)} ${r.n} samples, worst ${r.worst.toExponential(2)}px -> ${agrees ? 'AGREES' : 'DISAGREES'}`
        + (ok ? '' : `  BRACKET FAILED (expected ${expectAgrees ? 'AGREES' : 'DISAGREES'})`));
      await page.close();
    }
  } finally {
    await browser.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
  // ---- the caption band: CAP_SAFE_Y against the pill the page lays out ----
  // CAP_SAFE_Y is computed from the fractions #cap's CSS uses, which is a
  // second copy of those numbers; this is the control that holds the copy to
  // the real pill. SAFE means the line sits above the pill's top at every
  // captioned beat and not wastefully far above it (< 2 design units). Run at
  // two window shapes, because the band is placed against the contained frame
  // and a narrow window letterboxes it.
  const CAP_ARMS = [
    ['caption line, 16:9', null, [1280, 720], true],
    ['caption line, narrow', null, [900, 900], true],
    ['caption line, no padding', s => s.replace('(.015625*1.3+2*.00729167)', '(.015625*1.3)'), [1280, 720], false],
  ];
  const browser2 = await chromium.launch({ executablePath: chromiumPath(), args: angleArgs() });
  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'caption2d-'));
  try {
    for (const [tag, patch, [w, h], expectSafe] of CAP_ARMS) {
      const body = patch ? patch(src) : src;
      if (patch && body === src) {
        console.log(`${tag.padEnd(26)} FIXTURE NOT BUILT — mutation matched nothing (template drifted)`);
        wrong++;
        continue;
      }
      const out = path.join(dir2, tag.replace(/\W+/g, '_') + '.html');
      fs.writeFileSync(out, body);
      const page = await browser2.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      await page.goto('file://' + out + '?record=1');
      await page.waitForFunction('window.sceneReady === true', null, { timeout: 60000 });
      await page.evaluate('window.stopPlayback()');
      let r;
      try {
        r = await page.evaluate(`(() => {
          const sb = Math.min(canvas.width / VIEW_W, canvas.height / VIEW_H), tops = [];
          for (const b of BEATS) {
            if (!b.cap) continue;
            window.seekTo(beatAt(b.name, .5));
            tops.push((document.getElementById('cap').getBoundingClientRect().top - canvas.height / 2) / sb);
          }
          return { safe: CAP_SAFE_Y, pillTop: Math.min(...tops), n: tops.length };
        })()`);
      } catch (e) {
        r = { error: String(e.message).split('\n')[0] };
      }
      await page.close();
      const safe = !r.error && r.n > 0 && r.safe <= r.pillTop && r.pillTop - r.safe < 2;
      const ok = safe === expectSafe;
      if (!ok) wrong++;
      console.log(`${tag.padEnd(26)} ${r.error ? 'ERROR ' + r.error
        : `line ${r.safe.toFixed(2)} vs pill top ${r.pillTop.toFixed(2)} over ${r.n} beat(s)`} -> ${safe ? 'SAFE' : 'UNSAFE'}`
        + (ok ? '' : `  BRACKET FAILED (expected ${expectSafe ? 'SAFE' : 'UNSAFE'})`));
    }
  } finally {
    await browser2.close();
    fs.rmSync(dir2, { recursive: true, force: true });
  }

  if (wrong) {
    console.log(`\n${wrong} arm(s) did not behave as specified — the template's camera or caption exports are not what it claims.`);
    process.exit(1);
  }
  console.log(`\nall ${ARMS.length + CAP_ARMS.length} arms as specified`);
})();
