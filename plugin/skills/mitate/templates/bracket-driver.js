/* Bracket for the CHECK DRIVER in smoke.js — the guards C4 and C5 added.
 *
 * What is under test is not a scene property. It is smoke.js's own structure:
 * the order its two check lists run in, and the ctx keys each check is allowed
 * to assume. Both were prose before 0.16.53 — two comments saying "reordering
 * this array is a behaviour change, not a formatting one" and nothing that
 * would notice a reorder.
 *
 * WHY THIS BRACKET IS NOT OPTIONAL. Every one of these guards fires only on a
 * smoke.js bug, so on a healthy tree every arm is invisible: the guards
 * emit nothing, and a version with them deleted produces byte-identical output
 * on all nine scenes. That is precisely the shape invariant 6 exists for — a
 * control whose green is indistinguishable from its absence has to be watched
 * going red on purpose, or it is decorative.
 *
 * WHAT THIS FILE DOES NOT DO. It exercises the GUARDS; it does not reproduce
 * the DEFECT they close. No arm moves smoke.js's setup assignment after the
 * advisory loop, so nothing here keeps that failure reachable. An earlier
 * version of this header claimed otherwise — a claim of measurement naming no
 * control that reproduces it, which is the exact shape invariant 6 ratchets, in
 * the file whose whole job is controls. The observation itself is a dated record
 * and lives in CHANGELOG 0.16.53 and working-plan.md, not here.
 *
 * Arms 1-8 need no browser and no node_modules: the guards run at MODULE LOAD,
 * before argv is read, so `--parity-only` reaches them. Arms 9-10 need both,
 * because the presence check runs per scene, and they SKIP loudly rather than
 * pass quietly when playwright cannot be resolved.
 *
 *   bun run "${CLAUDE_SKILL_DIR}"/templates/bracket-driver.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const HERE = __dirname;
const SRC = fs.readFileSync(path.join(HERE, 'smoke.js'), 'utf8');

// A trivial two-file corpus for the static arms. The guards throw before any of
// this is read; it exists so the UNMODIFIED arm has something to exit 0 on.
const TRIVIAL = '<!doctype html><html><body><canvas id="c"></canvas></body></html>\n';

// The fixture for the per-scene arms. It satisfies the four hard CONTRACT names
// and nothing else, so smoke.js boots it instantly and then fails it on the
// checks it genuinely cannot pass (no rAF loop, so live playback is a hard
// fail). Both are fine: these arms assert a MESSAGE, not a verdict.
//
// It is minimal on a measurement, not on taste. An empty page was tried first
// and cost ~40s per run in `waitForFunction` timeouts, because a scene that
// never sets sceneReady makes smoke wait the full 20s twice -- a control that
// makes the gate slower for no added coverage is one people learn to route
// around. seekTo derives its fill from `t` alone, so the fixture obeys the
// prime directive it is being used to test tooling for.
const SCENE = `<!doctype html><html><body><canvas id="c" width="640" height="360"></canvas>
<script>
const c = document.getElementById('c'), g = c.getContext('2d');
window.DURATION = 2;
window.seekTo = function (t) {
  g.fillStyle = 'rgb(' + Math.round(20 + 100 * t) + ',40,80)';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff';
  g.fillRect(Math.round(t * 200), 40, 120, 120);
};
window.stopPlayback = function () {};
window.seekTo(0);
window.sceneReady = true;
</script></body></html>
`;

// The fixture for the REACHABILITY arms, and the reason it is not SCENE above.
// Those arms force one assertion inside the determinism trio and require the
// message to appear; that only proves something if the fixture does NOT produce
// the message on its own, and if the check under test actually RUNS.
//
// checkReloadDeterminism is guarded by `!fails.length`, so ANY earlier failure
// silently skips it -- and SCENE fails live playback by construction. Forcing
// the reload assertion against SCENE would therefore have produced nothing, and
// read as a broken arm rather than as the guard doing this. This fixture passes
// smoke.js OUTRIGHT (`all scenes pass`, exit 0 — measured by bracket-driver.js's
// own "clean fixture, unmutated" arm, which re-runs it every time), which is
// what makes the trio reachable and each arm's message attributable.
//
// Two properties are load-bearing and were each arrived at by running it:
//   - It draws its own letterbox instead of using CSS. framingReader maps
//     WINDOW coordinates into the canvas buffer via canvas.width/innerWidth, so
//     a fixed-size buffer letterboxed in CSS makes the check read a different
//     region at every window shape (MAD 30.3 narrow, 34.6 wide against a
//     threshold of 8 — re-derived by bracket-driver.js's clean-fixture arm,
//     which goes red the moment the fixture stops passing).
//
//     THE MARGIN, because a green arm on its own does not give one. Observed
//     on macOS: 0.473 narrow / 0.422 wide against a threshold of 8. Those two
//     figures are an observation and nothing re-derives them, so do not build
//     on them and do not read them as cross-platform — CI establishes only
//     that the fixture is under the threshold there.
//
//     What IS controlled is the headroom: bracket-driver.js's "clean fixture
//     holds at HALF the framing threshold" arm halves it to 4 and requires the
//     fixture to still pass, on every platform the bracket runs on. So the
//     margin is asserted by a run rather than claimed by this comment, and it
//     reds with slack left instead of at the moment coverage is lost.
//   - It draws ~240 deterministic cells. A flat two-rect frame compressed to
//     1555 bytes against a 5760-byte floor, so the fixture failed the very
//     blank-frame check the third arm exists to force.
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

// Anchors are exact source text. A missed anchor is reported as a FAILED arm and
// never as a pass -- if smoke.js drifts out from under this file, the honest
// outcome is "this bracket no longer tests what it says", not a green board.
const REQ_EXPOSURE = "checkExposure.requires = ['page', 'dur', 't', 'fails', 'warnings'];";
const DESTR_EXPOSURE = "async function checkExposure(ctx) {\n  const { page, dur, t, fails, warnings } = ctx;";
const ADV = "const ADVISORY_CHECKS = [\n  checkCaptionSpeed,\n  checkCaptionOverflow,\n  checkFramingInvariance,\n  checkExposure,\n];";
const PRE = "const PRE_RECORD_CHECKS = [\n  checkShippedFrame,\n  checkLivePlayback,\n];";
const SHOT = "const SHOT_CHECKS = [\n  checkDeterminism,\n  checkReloadDeterminism,\n  checkBlankFrame,\n];";

// [label, mutate, expect] — expect.code is 'zero' or 'nonzero', expect.says is a
// pattern the run MUST print. Asserting the MESSAGE and not only the exit code
// is load-bearing here: most arms below are non-zero exits, so without a
// message assertion any crash would satisfy all five and they could not tell
// each other's failure apart. That weakness was found in bracket-parity.js and
// is not being re-introduced one file over.
const STATIC_ARMS = [
  ['unmodified', s => s,
    { code: 'zero', says: /parity\/integrity: ok/ }],

  ['ADVISORY_CHECKS reordered', s => s.replace(ADV,
    "const ADVISORY_CHECKS = [\n  checkCaptionSpeed,\n  checkCaptionOverflow,\n  checkExposure,\n  checkFramingInvariance,\n];"),
    { code: 'nonzero', says: /ADVISORY_CHECKS is out of order/ }],

  ['PRE_RECORD_CHECKS reordered', s => s.replace(PRE,
    "const PRE_RECORD_CHECKS = [\n  checkLivePlayback,\n  checkShippedFrame,\n];"),
    { code: 'nonzero', says: /PRE_RECORD_CHECKS is out of order/ }],

  // The coupled list, and the one where a reorder does real damage rather than
  // merely being wrong: checkDeterminism is what assigns ctx.frames, so hoisting
  // either reader above it leaves both reading a key nothing has written. The
  // ORDER guard is what catches it, at module load, before a scene is opened --
  // the runtime presence guard would catch it too, but one scene later and once
  // per scene.
  ['SHOT_CHECKS reordered', s => s.replace(SHOT,
    "const SHOT_CHECKS = [\n  checkBlankFrame,\n  checkDeterminism,\n  checkReloadDeterminism,\n];"),
    { code: 'nonzero', says: /SHOT_CHECKS is out of order/ }],

  ['requires undeclared', s => s.replace(REQ_EXPOSURE + '\n', ''),
    { code: 'nonzero', says: /no ctx requirements declared/ }],

  ['requires drifted from the pattern', s => s.replace(REQ_EXPOSURE,
    "checkExposure.requires = ['page', 'dur', 'fails', 'warnings'];"),
    { code: 'nonzero', says: /does not match the keys it destructures/ }],

  ['ctx destructured from elsewhere', s => s.replace(DESTR_EXPOSURE,
    DESTR_EXPOSURE.replace('} = ctx;', '} = ctx.inner;')),
    { code: 'nonzero', says: /pattern found/ }],

  // NOT a red arm, and deliberately kept. It pins an ENGINE behaviour the
  // cross-check silently rests on: Function.prototype.toString() under Bun
  // returns a re-print of the parsed AST rather than the source text, so
  // sequential `const`s come back AS a destructuring pattern and the guard
  // accepts them. That is the correct verdict -- the mutation is semantically
  // identical -- but it is the reason the first attempt to red this arm came
  // back green, and if Bun ever stops normalising, this arm goes red and says
  // what changed instead of leaving the next reader to rediscover it.
  ['sequential consts (Bun re-prints to a pattern)', s => s.replace(DESTR_EXPOSURE,
    "async function checkExposure(ctx) {\n  const page = ctx.page, dur = ctx.dur, t = ctx.t, fails = ctx.fails, warnings = ctx.warnings;"),
    { code: 'zero', says: /parity\/integrity: ok/ }],
];

let wrong = 0, ran = 0, skipped = 0;

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-driver-'));
try {
  fs.writeFileSync(path.join(dir, 'a.html'), TRIVIAL);
  fs.writeFileSync(path.join(dir, 'b.html'), TRIVIAL);

  const run = (mutantPath, argv, env) => {
    let out = '', code = 0;
    try {
      out = execFileSync('bun', ['run', mutantPath, ...argv],
        { cwd: dir, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      code = e.status ?? 1;
      out = String(e.stdout || '') + String(e.stderr || '');
    }
    return { out, code };
  };

  const report = (label, code, expect, out) => {
    const codeOk = expect.code === 'zero' ? code === 0 : code !== 0;
    const saidOk = expect.says.test(out);
    const ok = codeOk && saidOk;
    if (!ok) wrong++;
    ran++;
    console.log(`${label.padEnd(46)} exit ${code}${saidOk ? '' : '  WRONG-MESSAGE'}`
      + `${ok ? '' : `  BRACKET FAILED (expected exit ${expect.code}, saying ${expect.says})`}`);
    if (!ok) console.log(out.split('\n').filter(l => l.trim()).slice(-4).map(l => '      ' + l).join('\n'));
  };

  for (const [label, mutate, expect] of STATIC_ARMS) {
    const body = mutate(SRC);
    if (body === SRC && label !== 'unmodified') {
      console.log(`${label.padEnd(46)} SKIPPED — anchor not found (smoke.js drifted)`);
      wrong++;
      continue;
    }
    // The mutant lives in the temp dir, not beside smoke.js. It can, because
    // both guards run before loadBrowserDeps(), so nothing resolves ./backend.js
    // on this path -- the same reason bracket-parity.js needs no node_modules.
    const mutantPath = path.join(dir, 'mutant.js');
    fs.writeFileSync(mutantPath, body);
    const { out, code } = run(mutantPath, ['--parity-only', 'a.html', 'b.html'], process.env);
    report(label, code, expect, out);
  }

  // -------------------------------------------------------------------------
  // Arms 9-10: the PER-SCENE half. `runChecks` validates ctx on every call, and
  // nothing above reaches it -- the module-load guards fire first and exit.
  //
  // The fixture is SCENE above -- a contract-satisfying page that fails other
  // checks, which is all these arms need. The pair is the point: the same
  // fixture through unmutated smoke.js must NOT produce this message, which is
  // what separates "the guard fired" from "the fixture was broken". Both arms
  // expect a non-zero exit, so only the message tells them apart.
  let browserReady = true;
  try {
    require.resolve('playwright-core', { paths: [process.cwd(), dir, HERE] });
  } catch (e) {
    browserReady = false;
  }
  const env = { ...process.env };
  if (!env.NODE_PATH) env.NODE_PATH = path.join(process.cwd(), 'node_modules');

  const BROWSER_ARMS = [
    ['required key ctx never carries', s => s
      .replace("checkShippedFrame.requires = ['browser', 'file', 'fails', 'noise', 'classify'];",
               "checkShippedFrame.requires = ['browser', 'file', 'fails', 'noise', 'classify', 'nosuchkey'];")
      .replace("async function checkShippedFrame(ctx) {\n  const { browser, file, fails, noise, classify } = ctx;",
               "async function checkShippedFrame(ctx) {\n  const { browser, file, fails, noise, classify, nosuchkey } = ctx;\n  void nosuchkey;"),
      { code: 'nonzero', says: /checkShippedFrame ran before ctx carried nosuchkey/ }],

    ['same fixture, unmutated (message must NOT appear)', s => s,
      { code: 'nonzero', says: /^(?![\s\S]*ran before ctx carried)[\s\S]*$/ }],
  ];

  for (const [label, mutate, expect] of BROWSER_ARMS) {
    if (!browserReady) {
      // Reported, never absent. A bracket that quietly runs its static arms
      // and prints "all arms as specified" is the failure mode CLAUDE.md names:
      // a green step that ran zero controls reads identically to one that ran
      // five. Say the number.
      console.log(`${label.padEnd(46)} SKIPPED — playwright-core not resolvable from this cwd`);
      skipped++;
      continue;
    }
    const body = mutate(SRC);
    if (body === SRC && !label.startsWith('same fixture')) {
      console.log(`${label.padEnd(46)} SKIPPED — anchor not found (smoke.js drifted)`);
      wrong++;
      continue;
    }
    // backend.js AND build.js: smoke.js resolves both against its own __dirname,
    // which for a mutant is this temp dir. build.js is not optional even for a
    // scene that needs no bundling -- smoke shells out to it once per scene
    // unconditionally, and without it the run fails `[self-contained]` for a
    // reason that has nothing to do with what these arms measure.
    fs.copyFileSync(path.join(HERE, 'backend.js'), path.join(dir, 'backend.js'));
    fs.copyFileSync(path.join(HERE, 'build.js'), path.join(dir, 'build.js'));
    fs.writeFileSync(path.join(dir, 'scene.html'), SCENE);
    const mutantPath = path.join(dir, 'mutant-browser.js');
    fs.writeFileSync(mutantPath, body);
    const { out, code } = run(mutantPath, ['scene.html'], env);
    report(label, code, expect, out);
  }

  // -------------------------------------------------------------------------
  // THE REACHABILITY ARMS. What they close: R4.1's gate rested on two things --
  // byte-identical verdicts across the checkScene extraction (reproducible, and
  // independently reproduced) and a forced-assertion run proving the determinism
  // trio's assertions still REACH the verdict. The second was a one-off manual
  // mutation in a scratch directory that no longer exists. Since the argument
  // was "equality alone is a weak oracle for these three", the load-bearing half
  // was the half nobody could re-run. These arms are that half, as a control.
  //
  // Equality is weak here for a specific reason: all three assertions are
  // silent on a healthy corpus, so a version with any of them disconnected from
  // `ctx.fails` emits byte-identical output on every scene. The extraction moved
  // each check into its own function taking ctx -- exactly the edit that could
  // leave a check pushing to an array the verdict never reads.
  //
  // Each arm forces ONE condition true and requires that check's own message.
  // The control arm is not optional: it establishes that the fixture is silent
  // on all three, which is what makes a forced message attributable to the
  // mutation rather than to the scene.
  const REACH_ARMS = [
    ['clean fixture, unmutated (all three silent)', s => s,
      { code: 'zero', says: /all scenes pass/ }],

    ['checkDeterminism assertion forced', s => s.replace(
      'if (sha256(x) !== sha256(y)) {', 'if (true) {'),
      { code: 'nonzero', says: /not deterministic — scene carries state across frames/ }],

    // The one the `!fails.length` guard can silently skip. If that guard ever
    // starts firing on this fixture, this arm goes MISSED rather than quietly
    // passing -- which is the alarm Phase R wants before it touches the guard.
    ['checkReloadDeterminism assertion forced', s => s.replace(
      'if (sha256(reloaded) !== sha256(frames[0])) {', 'if (true) {'),
      { code: 'nonzero', says: /differs ACROSS a page reload/ }],

    ['checkBlankFrame assertion forced', s => s.replace(
      'if (frames[i].length < blankFloor) {', 'if (true) {'),
      { code: 'nonzero', says: /looks blank at t=/ }],

    // THE ARM THAT GIVES THE THREE ABOVE THEIR TEETH, and the reason it is an
    // arm rather than a sentence: it reproduces the defect they exist to catch.
    // The assertion is forced AND its push is routed into a local sink, while
    // `fails` stays destructured so the requires guard is still satisfied --
    // that guard catches the cruder shape (dropping `fails` from the
    // destructure) at module load, so this is the disconnection that survives
    // it. smoke.js then reports `all scenes pass` at exit 0 with the message
    // absent, which is exactly what the three arms above would go red on.
    //
    // Read it as the negative control: without it, "the assertions reach the
    // verdict" rests on three arms that have never been shown capable of
    // noticing that they do not. If smoke.js is ever hardened so a push cannot
    // be disconnected, this arm goes red and should be retired deliberately.
    // HEADROOM, not just a pass. The fixture scoring under the real threshold
    // says nothing about BY HOW MUCH, and a control resting on an unmeasured
    // margin is one renderer change away from failing for a reason nothing on
    // hand explains. Halving the threshold and requiring the fixture to still
    // pass turns the margin into something a run asserts rather than something
    // a comment claims -- and it reds while there is still 4 points of slack,
    // instead of at the moment real coverage is lost.
    ['clean fixture holds at HALF the framing threshold', s => s.replace(
      'const FRAMING_INVARIANCE_MAD = 8;', 'const FRAMING_INVARIANCE_MAD = 4;'),
      { code: 'zero', says: /all scenes pass/ }],

    ['a disconnected push is invisible (negative control)', s => s
      .replace('if (sha256(x) !== sha256(y)) {', 'if (true) {')
      .replace('const { page, dur, PLAN, fails } = ctx;',
               'const { page, dur, PLAN, fails } = ctx; const sink = []; void fails;')
      .replace('      fails.push(`seekTo(${ts}) not deterministic',
               '      sink.push(`seekTo(${ts}) not deterministic'),
      { code: 'zero', says: /all scenes pass/ }],
  ];

  for (const [label, mutate, expect] of REACH_ARMS) {
    if (!browserReady) {
      console.log(`${label.padEnd(46)} SKIPPED — playwright-core not resolvable from this cwd`);
      skipped++;
      continue;
    }
    const body = mutate(SRC);
    if (body === SRC && !label.startsWith('clean fixture')) {
      console.log(`${label.padEnd(46)} SKIPPED — anchor not found (smoke.js drifted)`);
      wrong++;
      continue;
    }
    fs.copyFileSync(path.join(HERE, 'backend.js'), path.join(dir, 'backend.js'));
    fs.copyFileSync(path.join(HERE, 'build.js'), path.join(dir, 'build.js'));
    fs.writeFileSync(path.join(dir, 'clean.html'), CLEAN);
    const mutantPath = path.join(dir, 'mutant-reach.js');
    fs.writeFileSync(mutantPath, body);
    const { out, code } = run(mutantPath, ['clean.html'], env);
    report(label, code, expect, out);
  }
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}

console.log(`\n${ran} arm(s) exercised, ${skipped} skipped`);
if (skipped) {
  console.log('The skipped arms cover the PER-SCENE ctx validation. They need a workspace with'
    + ' playwright-core installed (the gate has one); this run did not check that half.');
}
if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — the check driver is not enforcing`
    + ` what smoke.js claims. A reordered check list or a check reading a ctx key nothing`
    + ` assigned would then ship silently, and both are invisible on an all-green corpus.`
    + ` Do not trust a green smoke run until this is 0.`);
  process.exit(1);
}
console.log('all arms as specified');
