/* Bracket for the DETERMINISM VERDICT's layer attribution — the canvas-readback
 * discriminator, the --dump-frames artifacts, and the reference pointer the
 * failure text carries.
 *
 * What is under test is not whether smoke.js catches nondeterminism (that is
 * bracket-determinism.js, end to end, and bracket-driver.js's reachability
 * arms). It is what the verdict SAYS when it fires — because the verdict's
 * wording drove real behavior three times in one day (the scene-analysis
 * record carries the counts): three
 * independent plugin-only builds each patched a private copy of smoke.js to
 * see what a failing determinism arm compared, and one spent its longest
 * debugging stretch chasing a scene defect the failure text asserted and the
 * scene did not have. A screenshot is two layers downstream of scene state;
 * a check that compares only screenshots attributes the intervening layer's
 * noise to the subject.
 *
 * The discriminator: alongside every screenshot, smoke hashes the canvas
 * IN PAGE (getImageData, one layer above the compositor). When screenshots
 * disagree, the readback pair says which layer moved:
 *
 *   readback differs too   -> scene state. The scene is the defect.
 *   readback byte-stable   -> capture layer. The scene is innocent, and the
 *                             verdict must say so instead of blaming it.
 *
 * The refutation condition, recorded where the claim is made: if a scene is
 * ever found whose readback agrees while real scene state differs, the
 * discriminator's clean verdict is wrong — that requires state that affects
 * rendering without affecting canvas pixels. File it against this bracket.
 *
 * The wall-clock arm is the "screenshot differs / readback agrees" case
 * reproduced from a clean checkout — deliberately via a DOM overlay driven by
 * performance.now(), not via the GPU capture race. The classifier cannot tell
 * which layer outside the canvas injected the noise, and does not need to:
 * what it certifies is that the CANVAS was stable while the observation
 * differed. This arm therefore proves the instrument discriminates; it does
 * NOT prove any particular field failure was a capture race — that
 * characterization is a separate recorded run on the backend where the race
 * lives, and writing it here would claim what only that run can show.
 *
 *   NODE_PATH="$PWD/node_modules" \
 *     bun run "${CLAUDE_SKILL_DIR}"/templates/bracket-readback.js
 *
 * Invoke it FROM a workspace where playwright-core resolves (the gate has
 * one). Without it every arm SKIPS loudly — a bracket that quietly runs
 * nothing and prints success is the green-that-ran-zero-controls shape the
 * runner exists to refuse.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HERE = __dirname;
const SMOKE = path.join(HERE, 'smoke.js');

// The fixture is bracket-driver.js's CLEAN shape: letterboxed canvas, ~240
// deterministic cells, its own rAF loop, passes smoke outright. Duplicated
// rather than imported because each bracket must run standalone from a clean
// checkout; the clean-control arm re-verifies the copy passes on every run,
// so a drifted duplicate goes red here rather than silently diverging.
const CLEAN = `<!doctype html><html><head><style>
html,body{margin:0;background:#000;height:100%;overflow:hidden}
canvas{display:block;position:absolute;inset:0}
</style></head><body><canvas id="c"></canvas>
<script>
const c = document.getElementById('c'), g = c.getContext('2d');
window.DURATION = 2;
window.FRAME = { aspect: 16 / 9 };
let lastT = 0;
function fit() { c.width = window.innerWidth; c.height = window.innerHeight; }
window.seekTo = function (t) {
  lastT = t;
  const W = c.width, H = c.height, AR = window.FRAME.aspect;
  const fw = Math.min(W, H * AR), fh = fw / AR;
  const fx = (W - fw) / 2, fy = (H - fh) / 2;
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  g.save();
  g.beginPath(); g.rect(fx, fy, fw, fh); g.clip();
  g.translate(fx, fy); g.scale(fw / 640, fh / 360);
  g.fillStyle = 'rgb(' + Math.round(12 + 40 * t) + ',18,34)';
  g.fillRect(0, 0, 640, 360);
  for (let i = 0; i < 240; i++) {
    const a = i * 2.399963 + t * 0.7;
    const x = (Math.sin(a) * 0.5 + 0.5) * 640, y = (Math.cos(a * 1.37) * 0.5 + 0.5) * 360;
    g.fillStyle = 'rgb(' + ((i * 37) % 200 + 40) + ',' + ((i * 71) % 180 + 30) + ',' + ((i * 113) % 210 + 20) + ')';
    g.fillRect(x, y, 9 + (i % 7) * 3, 7 + (i % 5) * 3);
  }
  g.fillStyle = '#e8e8f0';
  g.fillRect(Math.round(t * 180) + 20, 46, 110, 108);
  g.restore();
};
let playing = true;
window.stopPlayback = function () { playing = false; };
window.addEventListener('resize', function () { fit(); window.seekTo(lastT); });
function loop() {
  if (playing) window.seekTo((performance.now() / 1000) % window.DURATION);
  requestAnimationFrame(loop);
}
fit();
window.seekTo(0);
loop();
window.sceneReady = true;
</script></body></html>
`;

// Injection 1: real cross-frame state that reaches the canvas. Every seek
// drifts t by an accumulator, so away-and-back renders different pixels and
// the READBACK differs alongside the screenshots — the scene-state verdict.
const stateInj = s => s.replace(
  'window.seekTo = function (t) {',
  'let _acc = 0;\nwindow.seekTo = function (t) { _acc += 0.001; t = t + _acc;');

// Injection 2: observation noise OUTSIDE the canvas. A DOM overlay rewrites
// itself from performance.now() on its own rAF (stopPlayback does not reach
// it), so every screenshot differs while the canvas is byte-stable — the
// capture-layer verdict. The overlay must not obscure the letterboxed canvas
// content the other checks read, so it sits in one corner at fixed size.
const clockInj = s => s.replace(
  '<canvas id="c"></canvas>',
  '<canvas id="c"></canvas>\n<div id="wallclock" style="position:fixed;top:2px;left:2px;'
  + 'color:#fff;background:#333;font:10px monospace;z-index:9">.</div>\n'
  + '<script>(function tick(){document.getElementById(\'wallclock\').textContent='
  + 'performance.now().toFixed(3);requestAnimationFrame(tick)})();</script>');

// [label, fixture transform, extra argv, expect] — expect.says is asserted on
// the run's combined output, expect.absent (if set) must NOT appear, and
// expect.files (if set) is a pattern at least one written file must match.
// Asserting absence matters on the capture arm: the whole point is that the
// scene is NOT blamed, and a regex that only requires the new wording would
// pass a message that says both.
const ARMS = [
  ['clean fixture, unmutated (control)', s => s, [],
    { code: 'zero', says: /all scenes pass/ }],

  ['state across frames -> verdict names the differing readback', stateInj, [],
    { code: 'nonzero', says: /not deterministic[\s\S]*canvas readback differs/ }],

  ['determinism failure names the reference and the flag', stateInj, [],
    { code: 'nonzero', says: /webgpu-stack\.md[\s\S]*--dump-frames|--dump-frames[\s\S]*webgpu-stack\.md/ }],

  ['wall-clock overlay -> capture layer named, scene not blamed', clockInj, [],
    { code: 'nonzero', says: /CAPTURE layer/, absent: /carries state|renders differently per load/ }],

  ['--dump-frames writes both PNGs, verdict class unchanged', stateInj, ['--dump-frames'],
    { code: 'nonzero', says: /not deterministic[\s\S]*frames written/, files: /\.detfail\..*\.(a|b)\.png$/ }],
];

let wrong = 0, ran = 0, skipped = 0;

let browserReady = true;
try {
  require.resolve('playwright-core', { paths: [process.cwd(), HERE] });
} catch (e) {
  browserReady = false;
}
const env = { ...process.env };
if (!env.NODE_PATH) env.NODE_PATH = path.join(process.cwd(), 'node_modules');

(async () => {
  for (const [label, mutate, extraArgv, expect] of ARMS) {
    if (!browserReady) {
      console.log(`${label.padEnd(56)} SKIPPED — playwright-core not resolvable from this cwd`);
      skipped++;
      continue;
    }
    const scene = mutate(CLEAN);
    if (scene === CLEAN && !label.startsWith('clean fixture')) {
      console.log(`${label.padEnd(56)} SKIPPED — injection point not found (CLEAN drifted)`);
      wrong++;
      continue;
    }
    // Fresh dir per arm: the --dump-frames arm asserts files EXIST, so a
    // shared dir would let a previous arm's artifacts satisfy it.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-readback-'));
    try {
      fs.writeFileSync(path.join(dir, 'scene.html'), scene);
      let out = '', code = 0;
      try {
        out = execFileSync('bun', ['run', SMOKE, ...extraArgv, 'scene.html'],
          { cwd: dir, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
      } catch (e) {
        code = e.status ?? 1;
        out = String(e.stdout || '') + String(e.stderr || '');
      }
      const codeOk = expect.code === 'zero' ? code === 0 : code !== 0;
      const saidOk = expect.says.test(out);
      const absentOk = expect.absent ? !expect.absent.test(out) : true;
      const filesOk = expect.files
        ? fs.readdirSync(dir).some(n => expect.files.test(n))
        : true;
      const ok = codeOk && saidOk && absentOk && filesOk;
      if (!ok) wrong++;
      ran++;
      console.log(`${label.padEnd(56)} exit ${code}`
        + `${saidOk ? '' : '  WRONG-MESSAGE'}${absentOk ? '' : '  FORBIDDEN-MESSAGE-PRESENT'}`
        + `${filesOk ? '' : '  ARTIFACTS-MISSING'}`
        + `${ok ? '' : `  BRACKET FAILED (expected exit ${expect.code}, saying ${expect.says})`}`);
      if (!ok) console.log(out.split('\n').filter(l => l.trim()).slice(-5).map(l => '      ' + l).join('\n'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  console.log(`\n${ran} arm(s) exercised, ${skipped} skipped`);
  if (skipped) {
    console.log('Every skipped arm needs a browser; this run checked nothing about the verdict.');
  }
  if (wrong) {
    console.log(`\n${wrong} arm(s) did not behave as specified — the determinism verdict is not`
      + ` attributing layers the way its text claims. A capture race would then be reported`
      + ` as a scene defect again, which is the misattribution this discriminator exists to end.`
      + ` Do not trust a green smoke run until this is 0.`);
    process.exit(1);
  }
  console.log('all arms as specified');
})();
