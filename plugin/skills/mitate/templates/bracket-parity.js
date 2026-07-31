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

// ---------------------------------------------------------------------------
// --parity-fix: the same subject, but the command WRITES, so the arms assert
// what happened to the files rather than only an exit code.
//
// THE DANGEROUS FAILURE IS A PARTIAL WRITE, not a wrong verdict. A refusal that
// has already rewritten three of eight carriers leaves the corpus in a state no
// check describes and no author expects — worse than either propagating or
// declining cleanly. So every refusal arm below asserts the target is
// BYTE-UNCHANGED, not merely that the exit code was non-zero.
//
// Two guarantees come from the plan and are not negotiable, one arm each:
// the source is NAMED and never inferred from a majority (an unnamed run must
// refuse rather than guess), and a malformed source is refused.
const DRIFTED = FENCE.replace('const kit = 1;', 'const kit = 2;');
const MANGLED = FENCE.replace('KERNEL-END ==== */', 'KERNEL-ENDX ==== */');
const SOLVER = `/* ==== SOLVER-START ====
   the cinematography solver
   ======================================================================= */
const solve = 1;
/* ==== SOLVER-END ==== */`;
const SOLVER_MANGLED = SOLVER.replace('SOLVER-END ==== */', 'SOLVER-ENDX ==== */');

// [label, files, args, expect]
//   expect.code  — 'zero' or 'nonzero'
//   expect.b     — 'unchanged' (byte-identical to what was written) or 'canonical'
const FIX_ARMS = [
  ['fix: propagates from named source',
    { 'a.html': FENCE, 'b.html': DRIFTED }, ['--from', 'a.html'], { code: 'zero', b: 'canonical' }],
  ['fix: refuses without --from',
    { 'a.html': FENCE, 'b.html': DRIFTED }, [], { code: 'nonzero', b: 'unchanged' }],
  ['fix: refuses malformed source',
    { 'a.html': MANGLED, 'b.html': FENCE }, ['--from', 'a.html'], { code: 'nonzero', b: 'unchanged' }],
  ['fix: refuses malformed target',
    { 'a.html': FENCE, 'b.html': MANGLED }, ['--from', 'a.html'], { code: 'nonzero', b: 'unchanged' }],
  ['fix: refuses a source that is not a file',
    { 'a.html': FENCE, 'b.html': DRIFTED }, ['--from', 'nope.html'], { code: 'nonzero', b: 'unchanged' }],
  ['fix: idempotent on an already-clean corpus',
    { 'a.html': FENCE, 'b.html': FENCE }, ['--from', 'a.html'], { code: 'zero', b: 'unchanged' }],
  // THE PARTIAL-WRITE ARM, and the reason it needs three files. Every arm above
  // has exactly one target, where "refused" and "wrote as it went, then hit the
  // bad file" are indistinguishable — b is the only target, so a refusal on b
  // leaves b unchanged either way. Here b is a GOOD target that a write-as-you-go
  // implementation would rewrite before reaching the malformed c. If b comes
  // back modified, validation is not completing before the first write, and a
  // real run would leave the corpus half-propagated with nothing reporting it.
  ['fix: malformed target leaves the GOOD target untouched too',
    { 'a.html': FENCE, 'b.html': DRIFTED, 'c.html': MANGLED }, ['--from', 'a.html'],
    { code: 'nonzero', b: 'unchanged' }],
  // THE ARM THAT ACTUALLY PINS THE MALFORMED-SOURCE GUARD, added after a
  // mutation test showed the arm above it did not. Neutralise the guard and
  // 'refuses malformed source' STILL passes, because a wholly-mangled source
  // extracts zero blocks and gets refused by the no-blocks fallback instead —
  // the arm asserts the outcome but proves nothing about the guard.
  //
  // This source has a GOOD KERNEL and a MANGLED SOLVER, so `blocks` is
  // non-empty and the fallback never fires. Without the guard the run
  // propagates KERNEL, silently skips the broken fence, and exits 0 having
  // hidden a corrupt marker in the file it was told to treat as canonical.
  ['fix: refuses a source whose OTHER fence is malformed',
    { 'a.html': FENCE + '\n' + SOLVER_MANGLED, 'b.html': FENCE + '\n' + SOLVER },
    ['--from', 'a.html'], { code: 'nonzero', b: 'unchanged' }],
];

const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-parityfix-'));
try {
  for (const [label, files, args, expect] of FIX_ARMS) {
    for (const [name, body] of Object.entries(files)) {
      fs.writeFileSync(path.join(fixDir, name), scene(body));
    }
    const bPath = path.join(fixDir, 'b.html');
    const before = fs.readFileSync(bPath, 'utf8');
    let code = 0;
    try {
      // Scene list derived from the arm's own fixture, so an arm can add a third
      // file without the invocation silently continuing to scan only two.
      execFileSync('bun', ['run', SMOKE, '--parity-fix', ...args, ...Object.keys(files)],
        { cwd: fixDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { code = e.status ?? 1; }
    const after = fs.readFileSync(bPath, 'utf8');

    const codeOk = expect.code === 'zero' ? code === 0 : code !== 0;
    // 'canonical' means b's fenced block now matches a's byte for byte. Compare
    // the BLOCK, not the file: the rest of b is legitimately its own.
    const blockOf = t => (t.match(/\/\* ==== KERNEL-START ====[\s\S]*?\/\* ==== KERNEL-END ==== \*\//) || [null])[0];
    const bOk = expect.b === 'unchanged'
      ? after === before
      : blockOf(after) !== null && blockOf(after) === blockOf(fs.readFileSync(path.join(fixDir, 'a.html'), 'utf8'));
    const ok = codeOk && bOk;
    if (!ok) wrong++;
    console.log(`${label.padEnd(42)} exit ${code}  b:${expect.b === 'unchanged' ? (after === before ? 'unchanged' : 'MODIFIED') : (bOk ? 'canonical' : 'NOT-canonical')}`
      + `${ok ? '' : `  BRACKET FAILED (expected exit ${expect.code}, b ${expect.b})`}`);
  }
} finally {
  fs.rmSync(fixDir, { recursive: true, force: true });
}

if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — the parity check is not doing`
    + ` what this bracket claims. A drifted fence would ship, or a refusal would leave`
    + ` carriers half-rewritten. Do not trust a green --parity-only or --parity-fix`
    + ` until this is 0.`);
  process.exit(1);
}
console.log('\nall arms as specified');
