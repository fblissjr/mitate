/* Bracket for the console-noise classifier in smoke.js.
 *
 * Builds its own fixtures from a shipped example in a temp dir and drives the
 * REAL smoke.js as a subprocess, so what is under test is the shipped gate
 * rather than a copy of its logic. A copy would have passed while the gate
 * failed, which is exactly the defect this brackets.
 *
 * Why this exists. Until 0.16.16 the allow-list was one anchored regex that
 * matched NEITHER message it most needed to: Chromium prefixes driver chatter
 * with a context bracket ("[.WebGL-0x7f…]GL Driver Message (…)") and three
 * prefixes its own announcement ("THREE.WebGPURenderer: WebGPU is not
 * available, …"). Every 3D scene therefore FAILED on the default WebGL2 path —
 * the entire shipped corpus, on the one path advertised as CI-safe — and it
 * stayed invisible because nothing runs that path unattended and development
 * runs WEBGPU=metal, where neither message is emitted at all.
 *
 * So this bracket PINS THE FALLBACK PATH (it deletes WEBGPU from the child's
 * environment) regardless of what the developer's shell is set to. An
 * allow-list is a claim about text nobody controls; it has to be re-run on the
 * path it was written for, not the path that happens to be convenient.
 *
 * The two arms that matter pull in opposite directions:
 *   - the expected notice must NOT fail a clean scene (the regression above)
 *   - a real warning must STILL fail (the cloak must not have been closed to
 *     buy that green — the whole point of the fix is not to widen suppression)
 *
 *   NODE_PATH="$PWD/node_modules" \
 *     bun run "${CLAUDE_SKILL_DIR}"/templates/bracket-noise.js
 *
 * Invoke it FROM a working directory, leaving the file here: the fixture
 * resolves beside this script, but playwright-core exists only where a film is
 * being built. Bun stops its walk-up at the first node_modules it finds, which
 * is why the dependency has to be handed to it rather than discovered.
 *
 * Measured 2026-07-29 against gearbox at 0.16.16, WEBGPU unset (macOS,
 * playwright-core 1.61.1). The backend column is the gate's own tag, printed
 * because on a Chromium that serves WebGPU without the flag the notice is never
 * emitted and the first and last arms would measure nothing:
 *
 *   unmodified                             backend=webgl2  pass  (regression: FAILED before the fix)
 *   scene warns for real                   backend=webgl2  fail  (cloak did not close)
 *   claims webgpu while falling back       backend=webgpu  fail  (new structural arm)
 *   driver-shaped warning from the scene   backend=webgl2  pass  (cloak open BY DESIGN, surfaced as advisory)
 *
 * The first run of this bracket immediately caught a defect in the very fix it
 * was written for: the classifier existed in two copies and only one was
 * updated, so the cold shipped-frame page threw ReferenceError. That is the
 * whole argument for writing the bracket before trusting the green.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const EXAMPLE = path.join(__dirname, '..', 'examples', 'gearbox.html');
const HERE = __dirname;

// [tag, patch, expected] — expected is what the GATE should conclude.
const CASES = [
  ['unmodified', null, 'pass'],
  ['scene warns for real', s => s.replace(
    'window.sceneReady=true;',
    'console.warn("injected: a real defect");window.sceneReady=true;', 1), 'fail'],
  ['claims webgpu while falling back', s => s.replace(
    "window.BACKEND=renderer.backend.isWebGPUBackend?'webgpu':'webgl2';",
    "window.BACKEND='webgpu';", 1), 'fail'],
  // Documents the cloak that stays OPEN by design: a scene can still hide a
  // message behind a driver prefix. Reported as an advisory, never silently.
  ['driver-shaped warning from the scene', s => s.replace(
    'window.sceneReady=true;',
    'console.warn("[.WebGL-0xdead]GL Driver Message (injected)");window.sceneReady=true;', 1),
    'pass'],
];

const src = fs.readFileSync(EXAMPLE, 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-noise-'));

// The child must resolve playwright-core from the invoking workspace, and must
// run the FALLBACK path whatever the shell says.
const env = { ...process.env };
delete env.WEBGPU;
if (!env.NODE_PATH) env.NODE_PATH = path.join(process.cwd(), 'node_modules');

let wrong = 0;
try {
  for (const [tag, patch, expected] of CASES) {
    const body = patch ? patch(src) : src;
    if (patch && body === src) {
      console.log(`${tag.padEnd(38)} SKIPPED — injection point not found (example drifted)`);
      wrong++;
      continue;
    }
    const name = tag.replace(/\W+/g, '_') + '.html';
    fs.writeFileSync(path.join(dir, name), body);
    let out, verdict;
    try {
      // The REAL smoke.js, invoked where it lives, so its own __dirname finds
      // build.js and backend.js beside it. Copying it into the fixture dir
      // tested a copy and broke on the sibling it shells out to.
      out = execFileSync('bun', ['run', path.join(HERE, 'smoke.js'), name],
                         { cwd: dir, env, encoding: 'utf8', stdio: 'pipe' });
      verdict = 'pass';
    } catch (e) {
      out = (e.stdout || '') + (e.stderr || '');
      verdict = 'fail';
    }
    // Report the backend the gate actually observed: on a machine where
    // Chromium serves WebGPU without the flag, the fallback notice is never
    // emitted and these arms measure nothing. Better legible than mysterious.
    const seen = /\[source, (webgpu|webgl2)\]/.exec(out);
    const ok = verdict === expected;
    if (!ok) wrong++;
    console.log(`${tag.padEnd(38)} backend=${(seen ? seen[1] : '?').padEnd(7)}`
              + ` gate=${verdict.padEnd(5)} expected=${expected.padEnd(5)}`
              + ` -> ${ok ? 'OK' : 'BRACKET FAILED'}`);
    if (!ok) {
      console.log(out.split('\n').filter(l => l.trim()).slice(-6).map(l => '      ' + l).join('\n'));
    }
  }
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}

if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — the classifier is not doing`
            + ` what this bracket claims. Do not trust a green smoke run until this is 0.`);
  process.exit(1);
}
console.log(`\nall ${CASES.length} arms as specified`);
