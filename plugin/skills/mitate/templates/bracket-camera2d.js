/* Bracket for the 2D template's CAMERA EXPORT: `CAM` and `worldToScreen`.
 *
 * The property: worldToScreen(x, y) is where the frame actually drew world
 * point (x, y). Anything a scene draws in screen space against a world
 * position (a HUD tracer, an edge-pinned label) rests on it, and a stale or
 * partial restate is silent: the labels drift off their lanes, nothing throws.
 *
 * EXECUTE, DON'T MIRROR. The truth is not a second copy of the camera maths;
 * it is the transform the world pass drew with, read back from the canvas
 * context with ctx.getTransform() in the SAME task as the seek (the one-task
 * rule smoke.js's sampleAt states). The template's draw() leaves the camera
 * transform on the context after the world pass, which is what makes that
 * read meaningful; an arm below goes red if that stops being true.
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
          const m = ctx.getTransform();
          for (const [x, y] of ${JSON.stringify(POINTS)}) {
            const p = m.transformPoint(new DOMPoint(x, y)), q = worldToScreen(x, y);
            worst = Math.max(worst, Math.hypot(p.x - q[0], p.y - q[1])); n++;
          }
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
  if (wrong) {
    console.log(`\n${wrong} arm(s) did not behave as specified — worldToScreen is not what the template claims.`);
    process.exit(1);
  }
  console.log(`\nall ${ARMS.length} arms as specified`);
})();
