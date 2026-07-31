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
// declining cleanly. So every refusal arm below asserts that EVERY file in the
// fixture is byte-unchanged, not merely that the exit code was non-zero.
//
// Two guarantees come from the plan and are not negotiable, one arm each:
// the source is NAMED and never inferred from a majority (an unnamed run must
// refuse rather than guess), and a malformed source is refused.
//
// EVERY ARM ALSO ASSERTS THE MESSAGE (`says`), added 2026-07-31. Before that
// the arms captured the refusal text and discarded it, so *any* non-zero exit
// satisfied *every* refusal arm — four arms that could not tell each other's
// failure apart, and a crash satisfied all of them. That is the same weakness
// mutation testing already caught once in this file, rebuilt one level up.
const DRIFTED = FENCE.replace('const kit = 1;', 'const kit = 2;');
const MANGLED = FENCE.replace('KERNEL-END ==== */', 'KERNEL-ENDX ==== */');
const SOLVER = `/* ==== SOLVER-START ====
   the cinematography solver
   ======================================================================= */
const solve = 1;
/* ==== SOLVER-END ==== */`;
const SOLVER_MANGLED = SOLVER.replace('SOLVER-END ==== */', 'SOLVER-ENDX ==== */');
const SOLVER_DRIFTED = SOLVER.replace('const solve = 1;', 'const solve = 2;');
// The HTML fence is the only structurally different regex in the whole check —
// HTML comment markers, outside <script> — and until 2026-07-31 no arm ran it,
// while production propagation had already used it on the defect corpus.
const HTML_FENCE = `<!-- ==== HTML-START ==== -->
<div id="overlay">caption</div>
<!-- ==== HTML-END ==== -->`;
const HTML_DRIFTED = HTML_FENCE.replace('caption', 'CAPTION');

// A fixture value is either a script body, or {html, body, mode} for arms that
// need page-level markup or a permission bit.
const spec = v => (typeof v === 'string' ? { body: v } : v);
const render = v => {
  const { html = '', body = '' } = spec(v);
  return `<!doctype html><html><body><canvas id="c"></canvas>\n${html}\n<script>\n${body}\n</script></body></html>\n`;
};

// [label, files, args, expect]
//   expect.code  — 'zero' or 'nonzero'
//   expect.b     — 'unchanged' (byte-identical to what was written) or 'canonical'
//   expect.fence — which fence 'canonical' compares (default KERNEL)
//   expect.says  — RegExp the run's own output MUST match. Without this an arm
//                  asserts only that SOMETHING went wrong, which every other
//                  refusal arm also satisfies.
//   rawArgs      — full argv, replacing ['--parity-fix', ...args]. For the arms
//                  about flag COMBINATIONS, where the combination is the subject.
const FIX_ARMS = [
  ['fix: propagates from named source',
    { 'a.html': FENCE, 'b.html': DRIFTED }, ['--from', 'a.html'],
    { code: 'zero', b: 'canonical', says: /propagated 1 fence\(s\) from a\.html into 1 file/ }],
  ['fix: refuses without --from',
    { 'a.html': FENCE, 'b.html': DRIFTED }, [],
    { code: 'nonzero', b: 'unchanged', says: /need --from <canonical\.html>/ }],
  ['fix: refuses malformed source',
    { 'a.html': MANGLED, 'b.html': FENCE }, ['--from', 'a.html'],
    { code: 'nonzero', b: 'unchanged', says: /malformed source|carries no fenced block/ }],
  ['fix: refuses malformed target',
    { 'a.html': FENCE, 'b.html': MANGLED }, ['--from', 'a.html'],
    { code: 'nonzero', b: 'unchanged', says: /refusing the WHOLE run/ }],
  ['fix: refuses a source that is not a file',
    { 'a.html': FENCE, 'b.html': DRIFTED }, ['--from', 'nope.html'],
    { code: 'nonzero', b: 'unchanged', says: /cannot read source nope\.html/ }],
  ['fix: idempotent on an already-clean corpus',
    { 'a.html': FENCE, 'b.html': FENCE }, ['--from', 'a.html'],
    { code: 'zero', b: 'unchanged', says: /nothing to do/ }],
  // THE PARTIAL-WRITE ARM, and the reason it needs three files. Every arm above
  // has exactly one target, where "refused" and "wrote as it went, then hit the
  // bad file" are indistinguishable — b is the only target, so a refusal on b
  // leaves b unchanged either way. Here b is a GOOD target that a write-as-you-go
  // implementation would rewrite before reaching the malformed c. If b comes
  // back modified, validation is not completing before the first write, and a
  // real run would leave the corpus half-propagated with nothing reporting it.
  ['fix: malformed target leaves the GOOD target untouched too',
    { 'a.html': FENCE, 'b.html': DRIFTED, 'c.html': MANGLED }, ['--from', 'a.html'],
    { code: 'nonzero', b: 'unchanged', says: /refusing the WHOLE run/ }],
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
    ['--from', 'a.html'], { code: 'nonzero', b: 'unchanged', says: /malformed source/ }],

  // --- the 2026-07-31 review's write-path group, one arm each ----------------

  // FINDING 2. The malformed-TARGET guard used to iterate only the fences the
  // SOURCE carries, so a target broken in a fence the source lacks was written
  // anyway, exit 0. Live instance: scene2d.template.html carries 2 of 7 fences,
  // so propagating from it validated two and wrote nine. Here the source has no
  // SOLVER at all and the target's SOLVER is mangled — the guard must still fire.
  ['fix: refuses a target malformed in a fence the SOURCE lacks',
    { 'a.html': FENCE, 'b.html': DRIFTED + '\n' + SOLVER_MANGLED }, ['--from', 'a.html'],
    { code: 'nonzero', b: 'unchanged', says: /refusing the WHOLE run/ }],

  // FINDING 1. Validation covered readability and well-formedness and never
  // WRITABILITY, so a read-only target threw mid-loop out of an unguarded write
  // and left the corpus half-propagated — the precise state the design comment
  // above the loop claims to prevent. c is read-only and comes AFTER the good
  // target b, so a write-as-you-go implementation rewrites b and then dies.
  ['fix: refuses a read-only target before touching the good one',
    { 'a.html': FENCE, 'b.html': DRIFTED, 'c.html': { body: DRIFTED, mode: 0o444 } },
    ['--from', 'a.html'], { code: 'nonzero', b: 'unchanged', says: /cannot write .*c\.html/ }],

  // FINDING 3. `parityOnly` was computed and never consulted, so --parity-fix
  // silently overrode it. --parity-only is what static.yml and the installed
  // pre-commit hook run: a read-only contract that can be turned into a writer
  // by an adjacent flag is not a read-only contract.
  ['fix: refuses --parity-only + --parity-fix together',
    { 'a.html': FENCE, 'b.html': DRIFTED }, null,
    { code: 'nonzero', b: 'unchanged', says: /mutually exclusive/,
      rawArgs: ['--parity-only', '--parity-fix', '--from', 'a.html', 'a.html', 'b.html'] }],

  // FINDING 4. --from was consumed even without --parity-fix, swallowing the
  // NEXT FILENAME out of a read-only scan. Here b and c genuinely disagree; the
  // buggy parse ate b.html, scanned c alone, found one carrier and reported
  // green. A scan one file short of what was asked for must never exit 0.
  ['scan: refuses --from without --parity-fix',
    { 'a.html': FENCE, 'b.html': FENCE, 'c.html': DRIFTED }, null,
    { code: 'nonzero', b: 'unchanged', says: /only meaningful with --parity-fix/,
      rawArgs: ['--parity-only', '--from', 'b.html', 'c.html'] }],

  // FINDING 11, two arms. No arm exercised multi-fence propagation, and none
  // ever ran the HTML fence — the one structurally different regex, and the one
  // production had already used on the corpus.
  ['fix: propagates two fences in one run',
    { 'a.html': FENCE + '\n' + SOLVER, 'b.html': DRIFTED + '\n' + SOLVER_DRIFTED },
    ['--from', 'a.html'],
    { code: 'zero', b: 'canonical', says: /propagated 2 fence\(s\)/ }],
  ['fix: propagates the HTML fence',
    { 'a.html': { html: HTML_FENCE, body: FENCE }, 'b.html': { html: HTML_DRIFTED, body: FENCE } },
    ['--from', 'a.html'],
    // Two, not one: this fixture carries KERNEL as well, and the count reports
    // the fences the SOURCE carries rather than the ones that changed.
    { code: 'zero', b: 'canonical', fence: 'HTML', says: /propagated 2 fence\(s\)/ }],
];

// A fresh directory per arm: an arm that chmods a fixture would otherwise make
// the next arm's writeFileSync throw, and a bracket that fails for its own
// bookkeeping reasons teaches people to ignore it.
for (const [label, files, args, expect] of FIX_ARMS) {
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-parityfix-'));
  try {
    for (const [name, v] of Object.entries(files)) {
      const p = path.join(fixDir, name);
      fs.writeFileSync(p, render(v));
      if (spec(v).mode !== undefined) fs.chmodSync(p, spec(v).mode);
    }
    // Root ignores the permission bits this arm is built on, and an arm that
    // cannot pose its question must SAY so rather than report a green.
    const readonly = Object.entries(files).filter(([, v]) => spec(v).mode !== undefined);
    let skip = null;
    for (const [name] of readonly) {
      try { fs.accessSync(path.join(fixDir, name), fs.constants.W_OK); skip = name; } catch {}
    }
    if (skip) {
      wrong++;
      console.log(`${label.padEnd(52)} BRACKET INCONCLUSIVE — ${skip} is still writable `
        + `(running as root?), so this arm cannot pose its question`);
      continue;
    }

    const before = Object.fromEntries(Object.keys(files)
      .map(n => [n, fs.readFileSync(path.join(fixDir, n), 'utf8')]));
    // Scene list derived from the arm's own fixture, so an arm can add a third
    // file without the invocation silently continuing to scan only two.
    const argv = expect.rawArgs ?? ['--parity-fix', ...args, ...Object.keys(files)];
    let out = '', code = 0;
    try {
      out = execFileSync('bun', ['run', SMOKE, ...argv],
        { cwd: fixDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      code = e.status ?? 1;
      out = String(e.stdout || '') + String(e.stderr || '');
    }
    const after = Object.fromEntries(Object.keys(files)
      .map(n => [n, fs.readFileSync(path.join(fixDir, n), 'utf8')]));

    const codeOk = expect.code === 'zero' ? code === 0 : code !== 0;
    // 'canonical' means b's fenced block now matches a's byte for byte. Compare
    // the BLOCK, not the file: the rest of b is legitimately its own.
    const name = expect.fence || 'KERNEL';
    const RE = name === 'HTML'
      ? new RegExp(`<!-- ==== ${name}-START ==== -->[\\s\\S]*?<!-- ==== ${name}-END ==== -->`)
      : new RegExp(`\\/\\* ==== ${name}-START ====[\\s\\S]*?\\/\\* ==== ${name}-END ==== \\*\\/`);
    const blockOf = t => (t.match(RE) || [null])[0];
    const bOk = expect.b === 'unchanged'
      ? after['b.html'] === before['b.html']
      : blockOf(after['b.html']) !== null && blockOf(after['b.html']) === blockOf(after['a.html']);
    // A refusal must leave EVERY file alone, not just the one the arm names.
    // Checking b only is what let the read-only-target defect read as a clean
    // refusal: b was the sole target, so "refused" and "died after writing it"
    // looked identical.
    const untouched = expect.code !== 'nonzero'
      || Object.keys(files).every(n => after[n] === before[n]);
    const saidOk = expect.says.test(out);
    const ok = codeOk && bOk && untouched && saidOk;
    if (!ok) wrong++;
    const bState = expect.b === 'unchanged'
      ? (after['b.html'] === before['b.html'] ? 'unchanged' : 'MODIFIED')
      : (bOk ? 'canonical' : 'NOT-canonical');
    console.log(`${label.padEnd(52)} exit ${code}  b:${bState}`
      + `${untouched ? '' : '  OTHERS-MODIFIED'}${saidOk ? '' : '  WRONG-MESSAGE'}`
      + `${ok ? '' : `  BRACKET FAILED (expected exit ${expect.code}, b ${expect.b}, saying ${expect.says})`}`);
  } finally {
    for (const name of Object.keys(files)) {
      try { fs.chmodSync(path.join(fixDir, name), 0o644); } catch {}
    }
    fs.rmSync(fixDir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// SCAN INPUT HYGIENE — the read-only half, where the failure is that the check
// scans FEWER FILES THAN ASKED and reports success for the ones it never read.
//
// This is the same family as the mangled-marker episode: nothing is wrong with
// the verdict on what was scanned, the scan itself silently shrank. It is the
// worst shape a gate can take, because the exit code is 0 and stays 0 forever.
const SCAN_ARMS = [
  // FINDING 5. An unmatched glob reaches argv as a LITERAL under bash (zsh
  // errors first, bash does not), readFileSync threw, and the throw was
  // swallowed by `catch (e) {}` — scanning nothing and printing ok. Live risk:
  // a third glob was added to static.yml and the installed hook yesterday, so
  // renaming fixtures/defect-corpus/ would silently drop a directory from CI
  // and from every hook, green forever.
  ['scan: refuses an argument it cannot read',
    { 'a.html': FENCE, 'b.html': FENCE },
    ['--parity-only', 'a.html', 'b.html', 'fixtures/nope/*.html'],
    // [\s\S], not . — the offending argument is named on its own line, and a
    // `.`-based regex passed the exit-code half while silently missing that.
    { code: 'nonzero', says: /could not be read[\s\S]*fixtures\/nope\/\*\.html/ }],
  // The companion, and NOT decoration: the guard above cannot see the other
  // half of this failure. Under `nullglob` an unmatched glob is removed from
  // argv entirely, so smoke is handed fewer arguments and has no way to know
  // any were intended. Printing the count is the only thing that makes that
  // case visible to a reader — a green line that states its own scope.
  ['scan: states how many files it read',
    { 'a.html': FENCE, 'b.html': FENCE },
    ['--parity-only', 'a.html', 'b.html'],
    { code: 'zero', says: /2 file\(s\) scanned/ }],
  // A directory argument throws EISDIR, which the same swallow hid.
  ['scan: refuses a directory argument',
    { 'a.html': FENCE, 'b.html': FENCE },
    ['--parity-only', 'a.html', 'b.html', '.'],
    { code: 'nonzero', says: /could not be read[\s\S]*EISDIR/ }],
];

for (const [label, files, argv, expect] of SCAN_ARMS) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-parityscan-'));
  try {
    for (const [name, v] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), render(v));
    let out = '', code = 0;
    try {
      out = execFileSync('bun', ['run', SMOKE, ...argv],
        { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      code = e.status ?? 1;
      out = String(e.stdout || '') + String(e.stderr || '');
    }
    const codeOk = expect.code === 'zero' ? code === 0 : code !== 0;
    const saidOk = expect.says.test(out);
    const ok = codeOk && saidOk;
    if (!ok) wrong++;
    console.log(`${label.padEnd(52)} exit ${code}${saidOk ? '' : '  WRONG-MESSAGE'}`
      + `${ok ? '' : `  BRACKET FAILED (expected exit ${expect.code}, saying ${expect.says})`}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — the parity check is not doing`
    + ` what this bracket claims. A drifted fence would ship, or a refusal would leave`
    + ` carriers half-rewritten. Do not trust a green --parity-only or --parity-fix`
    + ` until this is 0.`);
  process.exit(1);
}
console.log('\nall arms as specified');
