/* Bracket for the CROSS-RELOAD determinism check (shipped in 0.16.9), three ways.
 *
 * Builds its own broken copies of a shipped example in a temp dir, so its
 * fixtures need no upkeep. A bracket you cannot re-run is a claim, not a
 * control — and this file exists because the first version of these
 * controls was written as throwaway shell heredocs and was gone within the
 * hour, one release after the repo adopted that rule.
 *
 * What is under test: smoke.js verifies seekTo purity WITHIN a page session
 * (seek away, seek back, compare) AND across a reload. The in-session half
 * cannot see load-time nondeterminism: a scene drawing a random once at init is
 * perfectly self-consistent per session while rendering a different film on
 * every load, which breaks the prime directive — the live HTML and the recorded
 * MP4 stop being the same film.
 *
 *   NODE_PATH="$PWD/node_modules" \
 *     bun run "${CLAUDE_SKILL_DIR}"/templates/bracket-determinism.js
 *
 * Invoke it FROM a working directory, leaving the file here: the fixture
 * resolves beside this script, but playwright-core exists only where a film is
 * being built. Bun stops its walk-up at the first node_modules it finds, which
 * is why the dependency has to be handed to it rather than discovered.
 *
 * Measured 2026-07-25 against gearbox at 0.16.9, WEBGPU=metal:
 *
 *   unmodified              in-session: same   across reload: same   PASS
 *   state across frames     in-session: DIFFERS                      caught in session
 *   random seeded at load   in-session: same   across reload: DIFFERS  caught ONLY by reload
 *
 * The third row is the whole point: before 0.16.9 it read `all scenes pass`.
 *
 * Re-measured 2026-07-30 on macOS/WebGL2 after switching the capture to
 * seekSynced: same three verdicts, all rows as specified. The verdicts are a
 * property of the injections, so the pattern change was expected to leave them
 * alone -- it was run before AND after precisely because "expected to" is not a
 * measurement.
 */
const { chromium } = require('playwright-core');
const { chromiumPath, angleArgs, settle, seekSynced } = require(require('path').join(__dirname, 'backend.js'));
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const EXAMPLE = path.join(__dirname, '..', 'examples', 'gearbox.html');
const T = 3.3;
const sha = b => crypto.createHash('sha256').update(b).digest('hex').slice(0, 12);

// [label, mutate, expected] — expected is the verdict this row MUST produce.
// Encoded (0.16.17) because without it this script printed three rows and
// exited 0 whatever they said: a control that cannot fail is decorative, and
// putting one in CI buys a green that means nothing.
const INJECTIONS = [
  ['unmodified', null, 'PASS'],
  ['state across frames', s => s.replace(
    'window.seekTo=function(t){',
    'let _acc=0;window.seekTo=function(t){_acc+=0.001;t=t+_acc;', 1),
    'caught in session'],
  ['random seeded at load', s => s.replace(
    'window.seekTo=function(t){',
    'const _SEED=Math.random()*0.7;window.seekTo=function(t){t=t+_SEED;', 1),
    'caught ONLY by reload'],
];
let wrong = 0;

(async () => {
  const src = fs.readFileSync(EXAMPLE, 'utf8');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-det-'));
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: angleArgs() });
  try {
    for (const [label, mutate, expected] of INJECTIONS) {
      const file = path.join(dir, 'scene.html');
      const body = mutate ? mutate(src) : src;
      // Silent injection-point drift is how a bracket quietly stops testing
      // anything: the mutation no-ops, the row reads like `unmodified`, and the
      // script still exits 0. bracket-liveplay.js already guarded this.
      if (mutate && body === src) {
        console.log(`${label.padEnd(24)} SKIPPED — injection point not found (example drifted)`);
        wrong++;
        continue;
      }
      fs.writeFileSync(file, body);
      const url = 'file://' + file + '?record=1';
      // seekSynced + settle, because that is what the arm under test does
      // (smoke.js's determinism loop, 0.16.28). A bracket that captures
      // differently from the check it brackets is measuring a configuration
      // nothing ships: this file used a bare seek on BOTH sides until 0.16.30,
      // which passed here while the shipped path had already moved on, so the
      // control silently stopped covering the code it names. Symmetry is not
      // enough -- smoke.js's own reload comment records that mixing the two
      // manufactures a spurious across-reload failure.
      const shot = async page => {
        await seekSynced(page, T);
        await settle(page);
        return sha(await page.screenshot());
      };
      const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
      await page.goto(url);
      await page.waitForFunction('window.sceneReady === true', { timeout: 20000 });
      await page.evaluate('window.stopPlayback()');
      const a = await shot(page);
      await seekSynced(page, 'window.DURATION');        // the seek away is a capture site too
      const b = await shot(page);                       // in-session: away and back
      await page.goto(url);                             // and across a reload
      await page.waitForFunction('window.sceneReady === true', { timeout: 20000 });
      await page.evaluate('window.stopPlayback()');
      const c = await shot(page);
      await page.close();
      const inSession = a === b ? 'same   ' : 'DIFFERS';
      const across = a === c ? 'same   ' : 'DIFFERS';
      const verdict = a !== b ? 'caught in session'
                    : a !== c ? 'caught ONLY by reload'
                    : 'PASS';
      const ok = verdict === expected;
      if (!ok) wrong++;
      console.log(`${label.padEnd(24)} in-session: ${inSession}  across reload: ${across}`
                + `  -> ${verdict}${ok ? '' : `  BRACKET FAILED (expected: ${expected})`}`);
    }
  } finally {
    await browser.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
  if (wrong) {
    console.log(`\n${wrong} row(s) did not behave as specified — the determinism checks are not`
              + ` doing what this bracket claims. Do not trust a green smoke run until this is 0.`);
    process.exit(1);
  }
  console.log('\nall rows as specified');
})();
