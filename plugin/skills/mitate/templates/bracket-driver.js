/* Bracket for the CHECK DRIVER in smoke.js — the guards C4 and C5 added, nine ways.
 *
 * What is under test is not a scene property. It is smoke.js's own structure:
 * the order its two check lists run in, and the ctx keys each check is allowed
 * to assume. Both were prose before 0.16.53 — two comments saying "reordering
 * this array is a behaviour change, not a formatting one" and nothing that
 * would notice a reorder.
 *
 * WHY THIS BRACKET IS NOT OPTIONAL. Every one of these guards fires only on a
 * smoke.js bug, so on a healthy tree all nine arms are invisible: the guards
 * emit nothing, and a version with them deleted produces byte-identical output
 * on all nine scenes. That is precisely the shape invariant 6 exists for — a
 * control whose green is indistinguishable from its absence has to be watched
 * going red on purpose, or it is decorative.
 *
 * The defect the ctx guard closes was measured — bracket-driver.js keeps it
 * reachable, which is why the record sits here rather than in a session log
 * (2026-08-01, by moving smoke.js's setup assignment after the advisory loop):
 *   - checkExposure drew a hard `render is 100.0% near-black` on a CORRECT
 *     scene, because `dur` was undefined so every sample time was NaN;
 *   - checkFramingInvariance went silently all-clear on that same run, because
 *     every window shape sampled at NaN is identical and a check comparing a
 *     frame against itself cannot fail.
 * Confidently wrong on one arm and quietly powerless on the other, from one
 * missing key. Before the extraction this was a TDZ ReferenceError; `ctx.dur`
 * made it silent, which is debt the extraction created and this repays.
 *
 * Arms 1-7 need no browser and no node_modules: the guards run at MODULE LOAD,
 * before argv is read, so `--parity-only` reaches them. Arms 8-9 need both,
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

// Anchors are exact source text. A missed anchor is reported as a FAILED arm and
// never as a pass -- if smoke.js drifts out from under this file, the honest
// outcome is "this bracket no longer tests what it says", not a green board.
const REQ_EXPOSURE = "checkExposure.requires = ['page', 'dur', 't', 'fails', 'warnings'];";
const DESTR_EXPOSURE = "async function checkExposure(ctx) {\n  const { page, dur, t, fails, warnings } = ctx;";
const ADV = "const ADVISORY_CHECKS = [\n  checkCaptionSpeed,\n  checkCaptionOverflow,\n  checkFramingInvariance,\n  checkExposure,\n];";
const PRE = "const PRE_RECORD_CHECKS = [\n  checkShippedFrame,\n  checkLivePlayback,\n];";

// [label, mutate, expect] — expect.code is 'zero' or 'nonzero', expect.says is a
// pattern the run MUST print. Asserting the MESSAGE and not only the exit code
// is load-bearing here: five of these arms are non-zero exits, so without a
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
  // Arms 8-9: the PER-SCENE half. `runChecks` validates ctx on every call, and
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
      // Reported, never absent. A bracket that quietly runs seven of nine arms
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
