/* Bracket for `build.js band` — ink under the caption, on a 2D scene.
 *
 * `band` reports, per captioned beat, the share of the caption pill's area
 * that is not page background in a caption-free render. It carries NO
 * threshold and no verdict: it is a measurement to read beside the sheet.
 * What this bracket pins is that the measurement MOVES, and that its scope is
 * declared rather than silently misapplied:
 *
 *   pristine 2D template     every reading low (nothing sits under the pill)
 *   content pushed under it  at least one reading high, and far above pristine
 *   3D template              a declared skip, no readings, exit 0 — the world
 *                            fills the frame behind the caption, so ink there
 *                            is not a signal (the environment axis)
 *   no captions at all       a declared skip, no readings, exit 0
 *
 * A measurement that reads ~0 everywhere, or that "measures" a 3D scene, would
 * pass a board that only asserted exit codes. These arms are what fail it.
 *
 *   cd <a workspace with playwright-core installed>
 *   NODE_PATH="$PWD/node_modules" bun run "${CLAUDE_SKILL_DIR}"/templates/bracket-band.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BUILD = path.join(__dirname, 'build.js');
const T2D = path.join(__dirname, 'scene2d.template.html');
const T3D = path.join(__dirname, 'scene.template.html');

// The pristine ceiling and the pushed floor. Neither is a threshold `band`
// applies; they are this bracket's statement of "low" and "high", and the
// ratio is what carries the claim that the reading tracks the geometry.
const LOW = 1, HIGH = 5, RATIO = 5;

const run = scene => {
  try {
    return { code: 0, out: execFileSync('bun', ['run', BUILD, 'band', scene],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) {
    return { code: e.status ?? 1, out: String(e.stdout || '') + String(e.stderr || '') };
  }
};
const readings = out => [...out.matchAll(/^ {2}band\s+(\S+)\s+([\d.]+)%/gm)].map(m => [m[1], Number(m[2])]);

const mutate = (src, from, to) => {
  if (!src.includes(from)) throw new Error(`bracket-band: mutation target gone — ${from}`);
  return src.split(from).join(to);
};

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'band-'));
let wrong = 0, arms = 0;
const row = (tag, ok, why) => { arms++; if (!ok) wrong++; console.log(`${tag.padEnd(24)} ${ok ? 'ok  ' : 'FAIL'}  ${why}`); };
try {
  const s2 = fs.readFileSync(T2D, 'utf8');
  const write = (name, body) => { const p = path.join(dir, name); fs.writeFileSync(p, body); return p; };
  const pristine = write('pristine.html', s2);
  // Shift every world draw down after the camera, so the stations sit where
  // the caption pill is on the unzoomed beats.
  const pushed = write('pushed.html', mutate(s2, '  applyCamera(t);\n', '  applyCamera(t);ctx.translate(0,36);\n'));
  const nocaps = write('nocaps.html', s2.replace(/, cap: "[^"]*"/g, ''));
  if (nocaps.length && fs.readFileSync(nocaps, 'utf8') === s2) throw new Error('bracket-band: caption removal matched nothing');
  const threeD = write('scene3d.html', fs.readFileSync(T3D, 'utf8'));

  const a = run(pristine), ra = readings(a.out);
  const maxA = Math.max(0, ...ra.map(r => r[1]));
  row('pristine 2D', a.code === 0 && ra.length > 0 && maxA < LOW,
    `${ra.length} reading(s), max ${maxA}% (must be < ${LOW}%)`);

  const b = run(pushed), rb = readings(b.out);
  const maxB = Math.max(0, ...rb.map(r => r[1]));
  row('content under the pill', b.code === 0 && maxB >= HIGH && maxB >= RATIO * Math.max(maxA, 0.1),
    `max ${maxB}% (must be >= ${HIGH}% and >= ${RATIO}x pristine)`);

  const c = run(threeD), rc = readings(c.out);
  row('3D template', c.code === 0 && rc.length === 0 && /band: skipped .*3D/.test(c.out),
    rc.length ? `${rc.length} reading(s) on a 3D scene` : (/band: skipped .*3D/.test(c.out) ? 'declared skip' : 'no declared skip'));

  const d = run(nocaps), rd = readings(d.out);
  row('no captions', d.code === 0 && rd.length === 0 && /band: skipped .*no beat carries a caption/.test(d.out),
    rd.length ? `${rd.length} reading(s)` : 'declared skip');
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — do not read band's numbers until this is 0.`);
  process.exit(1);
}
console.log(`\nall ${arms} arms as specified`);
