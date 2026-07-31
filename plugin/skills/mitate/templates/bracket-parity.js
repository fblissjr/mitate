/* Bracket for the FENCE PARITY check, five ways.
 *
 * Parity is this repo's whole answer to duplication. Self-containment forbids a
 * shared import, so KERNEL/SOLVER/RIG/DRIVER/CHARACTER/HTML are written into
 * nine files and a check says when the copies diverge. That makes the check
 * load-bearing in a way most are not: if it goes quiet, the DRY guarantee goes
 * with it and nothing announces the loss.
 *
 * It has gone quiet twice, both recorded in smoke.js:
 *   - a mangled END marker (`KERNEL-ENDX`) satisfied an `includes()` test, the
 *     block stopped extracting, the file dropped OUT of the parity set, and the
 *     run stayed green -- the exact self-exemption the check exists to prevent;
 *   - a scan where only one file carried a fence printed `parity/integrity: ok`
 *     and the reader credited it with a comparison that never happened.
 *
 * Both are now guarded in smoke.js. Nothing proved the guards work, which is
 * what this file is for. Arms 3 and 4 are those two episodes; without them this
 * bracket would only test the easy case.
 *
 * No browser, no node_modules: --parity-only is pure string work, so this runs
 * from a clean checkout.
 *
 *   bun run "${CLAUDE_SKILL_DIR}"/templates/bracket-parity.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SMOKE = path.join(__dirname, 'smoke.js');

// A minimal two-file corpus. Deliberately NOT *.template.html: --parity-only
// also runs template-integrity rules, and this bracket is about parity alone.
const FENCE = `/* ==== KERNEL-START ====
   the shared kit
   ======================================================================= */
const kit = 1;
/* ==== KERNEL-END ==== */`;
const scene = body => `<!doctype html><html><body><canvas id="c"></canvas><script>
${body}
</script></body></html>
`;

// [label, files, expect] — expect is what this arm MUST produce. `fail` means a
// non-zero exit; `inert` means exit 0 but the run must SAY the comparison did
// not happen, which is the difference between a check and a decoration.
const ARMS = [
  ['identical carriers', { 'a.html': FENCE, 'b.html': FENCE }, 'pass'],
  ['drifted KERNEL', { 'a.html': FENCE, 'b.html': FENCE.replace('const kit = 1;', 'const kit = 2;') }, 'fail'],
  ['mangled END marker', { 'a.html': FENCE, 'b.html': FENCE.replace('KERNEL-END ==== */', 'KERNEL-ENDX ==== */') }, 'fail'],
  ['mangled START marker', { 'a.html': FENCE, 'b.html': FENCE.replace('KERNEL-START ====', 'KERNEL-STARTX ====') }, 'fail'],
  ['only one carrier', { 'a.html': FENCE, 'b.html': 'const kit = 1;' }, 'inert'],
];

let wrong = 0;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-parity-'));
try {
  for (const [label, files, expect] of ARMS) {
    for (const [name, body] of Object.entries(files)) {
      fs.writeFileSync(path.join(dir, name), scene(body));
    }
    let out = '', code = 0;
    try {
      out = execFileSync('bun', ['run', SMOKE, '--parity-only', 'a.html', 'b.html'],
        { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      code = e.status ?? 1;
      out = String(e.stdout || '') + String(e.stderr || '');
    }
    // `inert` is the subtle one: exit 0 is not enough, the run has to have said
    // out loud that nothing was compared. A silent 0 here is the defect.
    const said = /parity inert|no fence was checked/.test(out);
    const verdict = code !== 0 ? 'fail' : said ? 'inert' : 'pass';
    const ok = verdict === expect;
    if (!ok) wrong++;
    console.log(`${label.padEnd(22)} exit ${code}  -> ${verdict}`
      + `${ok ? '' : `  BRACKET FAILED (expected: ${expect})`}`);
  }
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}

if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — the parity check is not doing`
    + ` what this bracket claims. A drifted fence would ship. Do not trust a green`
    + ` --parity-only until this is 0.`);
  process.exit(1);
}
console.log('\nall arms as specified');
