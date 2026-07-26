/* Bracket for the CROSS-RELOAD determinism check (shipped in 0.16.9), three ways.
 *
 * Self-contained by design: builds its own broken copies of a shipped example
 * in a temp dir. A bracket you cannot re-run from a clean checkout is a claim,
 * not a control — and this file exists because the first version of these
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
 *   bun run bracket-determinism.js
 *
 * Measured 2026-07-25 against gearbox at 0.16.9, WEBGPU=metal:
 *
 *   unmodified              in-session: same   across reload: same   PASS
 *   state across frames     in-session: DIFFERS                      caught in session
 *   random seeded at load   in-session: same   across reload: DIFFERS  caught ONLY by reload
 *
 * The third row is the whole point: before 0.16.9 it read `all scenes pass`.
 */
const { chromium } = require('playwright-core');
const { chromiumPath, angleArgs, settle } = require(require('path').join(__dirname, 'backend.js'));
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

const EXAMPLE = path.join(__dirname, '..', 'examples', 'gearbox.html');
const T = 3.3;
const sha = b => crypto.createHash('sha256').update(b).digest('hex').slice(0, 12);

const INJECTIONS = [
  ['unmodified', null],
  ['state across frames', s => s.replace(
    'window.seekTo=function(t){',
    'let _acc=0;window.seekTo=function(t){_acc+=0.001;t=t+_acc;', 1)],
  ['random seeded at load', s => s.replace(
    'window.seekTo=function(t){',
    'const _SEED=Math.random()*0.7;window.seekTo=function(t){t=t+_SEED;', 1)],
];

(async () => {
  const src = fs.readFileSync(EXAMPLE, 'utf8');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-det-'));
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: angleArgs() });
  try {
    for (const [label, mutate] of INJECTIONS) {
      const file = path.join(dir, 'scene.html');
      fs.writeFileSync(file, mutate ? mutate(src) : src);
      const url = 'file://' + file + '?record=1';
      const shot = async page => {
        await page.evaluate(`window.seekTo(${T})`);
        await settle(page);
        return sha(await page.screenshot());
      };
      const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
      await page.goto(url);
      await page.waitForFunction('window.sceneReady === true', { timeout: 20000 });
      await page.evaluate('window.stopPlayback()');
      const a = await shot(page);
      await page.evaluate('window.seekTo(window.DURATION)');
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
      console.log(`${label.padEnd(24)} in-session: ${inSession}  across reload: ${across}  -> ${verdict}`);
    }
  } finally {
    await browser.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
})();
