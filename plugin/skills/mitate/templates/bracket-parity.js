/* Bracket for the FENCE PARITY check.
 *
 * Parity is this repo's whole answer to duplication. Self-containment forbids a
 * shared import, so every fence in smoke.js's FENCES array is written into
 * nine files and a check says when a copy diverges. That makes the check
 * load-bearing in a way most are not: if it goes quiet, the DRY guarantee goes
 * with it and nothing announces the loss.
 *
 * SINCE THE EMITTER PHASE THE CHECK IS INVERTED. The canonical fence store (fences/ beside
 * smoke.js, one <NAME>.fence.txt per fence) is the single source; parity asks
 * "does every carrier match the store", not "do the carriers agree with each
 * other". Two consequences this bracket pins because nothing else does:
 *   - a SINGLE scanned scene is now a real comparison, where the old check was
 *     structurally inert below two scenes and had to say so out loud;
 *   - the store itself is a new place for the scan to shrink silently — a
 *     missing, partial, extra-file or mangled store must REFUSE, because a
 *     parity green over zero (or five of seven) fences is indistinguishable
 *     from a green over all of them. Same lesson as run-brackets.sh and the
 *     emit-spike scope guard, one tier down.
 *
 * The pre-store history still binds — it has gone quiet twice, both recorded
 * in smoke.js:
 *   - a mangled END marker (`KERNEL-ENDX`) satisfied an `includes()` test, the
 *     block stopped extracting, the file dropped OUT of the parity set, and the
 *     run stayed green -- the exact self-exemption the check exists to prevent;
 *   - a scan where only one file carried a fence printed `parity/integrity: ok`
 *     and the reader credited it with a comparison that never happened.
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
const REAL_STORE = path.join(__dirname, 'fences');

// Synthetic fences, one per name in smoke.js's FENCES. The store loader
// requires the full set, so every arm's store carries all seven even when its
// carriers use only KERNEL/SOLVER/HTML — which is also the production shape:
// scene2d carries 2 of 7 and the store still carries all of them.
const FENCE = `/* ==== KERNEL-START ====
   the shared kit
   ======================================================================= */
const kit = 1;
/* ==== KERNEL-END ==== */`;
const SOLVER = `/* ==== SOLVER-START ====
   the cinematography solver
   ======================================================================= */
const solve = 1;
/* ==== SOLVER-END ==== */`;
// The HTML fence is the only structurally different regex in the whole check —
// HTML comment markers, outside <script> — and until 2026-07-31 no arm ran it,
// while production propagation had already used it on the defect corpus.
const HTML_FENCE = `<!-- ==== HTML-START ==== -->
<div id="overlay">caption</div>
<!-- ==== HTML-END ==== -->`;
const jsFence = name => `/* ==== ${name}-START ====
   synthetic ${name}
   ======================================================================= */
const ${name.toLowerCase()} = 1;
/* ==== ${name}-END ==== */`;
const STORE_BLOCKS = {
  CONTRACT: jsFence('CONTRACT'),
  KERNEL: FENCE,
  SOLVER,
  RIG: jsFence('RIG'),
  DRIVER: jsFence('DRIVER'),
  CHARACTER: jsFence('CHARACTER'),
  HTML: HTML_FENCE,
};

const DRIFTED = FENCE.replace('const kit = 1;', 'const kit = 2;');
const MANGLED = FENCE.replace('KERNEL-END ==== */', 'KERNEL-ENDX ==== */');
const SOLVER_MANGLED = SOLVER.replace('SOLVER-END ==== */', 'SOLVER-ENDX ==== */');
const SOLVER_DRIFTED = SOLVER.replace('const solve = 1;', 'const solve = 2;');
const HTML_DRIFTED = HTML_FENCE.replace('caption', 'CAPTION');

// Write a synthetic store into <dir>/store. `mutate` edits the file map before
// writing: delete a key for a missing-file arm, mangle a value, add an extra.
const writeStore = (dir, mutate) => {
  const storeDir = path.join(dir, 'store');
  fs.mkdirSync(storeDir, { recursive: true });
  const files = Object.fromEntries(
    Object.entries(STORE_BLOCKS).map(([n, b]) => [`${n}.fence.txt`, b + '\n']));
  if (mutate) mutate(files);
  for (const [name, body] of Object.entries(files)) {
    fs.writeFileSync(path.join(storeDir, name), body);
  }
  return storeDir;
};

// A fixture value is either a script body, or {html, body, mode} for arms that
// need page-level markup or a permission bit.
const spec = v => (typeof v === 'string' ? { body: v } : v);
const render = v => {
  const { html = '', body = '' } = spec(v);
  return `<!doctype html><html><body><canvas id="c"></canvas>\n${html}\n<script>\n${body}\n</script></body></html>\n`;
};

let wrong = 0, ran = 0;

// ---------------------------------------------------------------------------
// SCAN ARMS — the read-only half. Every arm names the store explicitly except
// the one whose subject IS the default resolution.
//
// [label, files, storeMutate|null, extraArgs, expect]
//   expect.code — 'zero' or 'nonzero'
//   expect.says — RegExp the run's own output MUST match. Without this an arm
//                 asserts only that SOMETHING went wrong, which every other
//                 refusal arm also satisfies — the weakness a mutation test
//                 caught here once already, rebuilt one level up.
const SCAN_ARMS = [
  // Deleting this arm loses the only proof a clean carrier still passes at all.
  ['scan: carriers matching the store pass',
    { 'a.html': FENCE, 'b.html': FENCE }, null, [],
    { code: 'zero', says: /parity\/integrity: ok/ }],
  // THE INVERSION'S CORE CLAIM: drift is now judged against the store, so a
  // fence that differs from it fails even if every carrier agrees. Under the
  // old cross-carrier check this exact fixture (two identical drifted copies)
  // was GREEN — delete this arm and the inversion is unproven.
  ['scan: carriers agreeing with each other but not the store fail',
    { 'a.html': DRIFTED, 'b.html': DRIFTED }, null, [],
    { code: 'nonzero', says: /does not match the canonical store/ }],
  ['scan: one drifted carrier fails and is named',
    { 'a.html': FENCE, 'b.html': DRIFTED }, null, [],
    { code: 'nonzero', says: /b\.html[\s\S]*does not match the canonical store/ }],
  // The two marker-mangling episodes from the pre-store era. The guard must
  // survive the inversion: a broken fence still fails loudly rather than
  // dropping the file out of the comparison.
  ['scan: mangled END marker fails',
    { 'a.html': FENCE, 'b.html': MANGLED }, null, [],
    { code: 'nonzero', says: /no well-formed KERNEL block/ }],
  ['scan: mangled START marker fails',
    { 'a.html': FENCE, 'b.html': FENCE.replace('KERNEL-START ====', 'KERNEL-STARTX ====') }, null, [],
    { code: 'nonzero', says: /no well-formed KERNEL block/ }],
  // A single scene was structurally uncomparable before the store and the run
  // had to SAY so; now it is a real comparison. Both directions pinned: a
  // drifted singleton goes red (the old check exited 0 here — this arm is the
  // bracket's red-first witness), and a clean singleton is a green that
  // states its scope rather than an inert note.
  ['scan: a single drifted scene fails (was inert pre-store)',
    { 'a.html': DRIFTED }, null, [],
    { code: 'nonzero', says: /does not match the canonical store/ }],
  ['scan: a single clean scene passes and states its scope',
    { 'a.html': FENCE }, null, [],
    { code: 'zero', says: /1 file\(s\) scanned/ }],
  ['scan: states how many files it read',
    { 'a.html': FENCE, 'b.html': FENCE }, null, [],
    { code: 'zero', says: /2 file\(s\) scanned/ }],
  // THE COUNT IS PART OF THE VERDICT, so it must be honest on a RED run too:
  // a drifted fence's lines are not "held byte-identical to the canonical
  // store" and must not be counted as if they were. The synthetic fence is 5
  // lines; one clean carrier plus one drifted carrier must report 5 held, not
  // 10. Delete this arm and the verdict line on every FAIL run can silently
  // overstate what parity actually held.
  ['scan: a FAIL run counts only the lines actually held',
    { 'a.html': FENCE, 'b.html': DRIFTED }, null, [],
    { code: 'nonzero', says: /FAILED \(2 file\(s\) scanned, 5 fenced line\(s\) held/ }],
  // A carrier with NO fences at all stays out of the parity set — removing
  // your markers is still how a scene legitimately diverges, and the store
  // must not drag it back in.
  ['scan: a fence-free scene beside a clean one passes',
    { 'a.html': FENCE, 'b.html': 'const kit = 1;' }, null, [],
    { code: 'zero', says: /parity\/integrity: ok/ }],

  // --- store hygiene: every way the scan's new input can shrink it ----------
  // Each of these is a scope-silently-shrinks shape: without the refusal the
  // run reports green having compared fewer fences than the reader believes.
  // The refusal must also NAME THE REMEDY: the person reading it is standing
  // in a workspace that copied smoke.js without fences/ (the 0.17.0 class —
  // gate.yml and SKILL.md's copy list both shipped that break), and "cannot
  // read" without "copy fences/ from templates/" leaves them to rediscover
  // the sibling rule from scratch.
  ['scan: refuses a store directory that does not exist',
    { 'a.html': FENCE }, 'absent', [],
    { code: 'nonzero', says: /fence-store: cannot read[\s\S]*copy the fences\/ directory/ }],
  ['scan: refuses a store missing one fence file',
    { 'a.html': FENCE }, files => { delete files['RIG.fence.txt']; }, [],
    { code: 'nonzero', says: /missing RIG\.fence\.txt/ }],
  ['scan: refuses an empty store directory',
    { 'a.html': FENCE }, files => { for (const k of Object.keys(files)) delete files[k]; }, [],
    { code: 'nonzero', says: /missing/ }],
  ['scan: refuses a store file that is not a registered fence',
    { 'a.html': FENCE }, files => { files['EXTRA.fence.txt'] = FENCE + '\n'; }, [],
    { code: 'nonzero', says: /not a fence in FENCES/ }],
  // The store-side mangled marker. The subject is a fence NO carrier in this
  // fixture uses: the loader must validate the whole store, not just the
  // fences in play, or a corrupt RIG waits silently for the first 3D scene.
  ['scan: refuses a store whose UNUSED fence is mangled',
    { 'a.html': FENCE },
    files => { files['RIG.fence.txt'] = jsFence('RIG').replace('RIG-END ==== */', 'RIG-ENDX ==== */') + '\n'; }, [],
    { code: 'nonzero', says: /RIG\.fence\.txt is not a single well-formed/ }],
  ['scan: refuses --store without a value',
    { 'a.html': FENCE }, null, 'store-flag-bare',
    { code: 'nonzero', says: /--store needs a directory/ }],
  // Same value-flag hygiene class as the two above: two --store flags means
  // one silently wins, and the run scans against a store the command's reader
  // did not pick. Delete this arm and last-wins can come back with every
  // other refusal arm still green, because every other arm passes it once.
  ['scan: refuses a duplicate --store',
    { 'a.html': FENCE }, null, 'store-flag-dup',
    { code: 'nonzero', says: /--store was passed more than once/ }],
  // --from died with the named-carrier era; consuming it silently would eat
  // the next filename out of the scene list, the exact defect its old
  // combination guard existed for.
  ['scan: refuses --from',
    { 'a.html': FENCE, 'b.html': FENCE }, null, 'from-flag',
    { code: 'nonzero', says: /--from is gone/ }],
];

for (const [label, files, storeMutate, extraArgs, expect] of SCAN_ARMS) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-parityscan-'));
  try {
    for (const [name, v] of Object.entries(files)) {
      fs.writeFileSync(path.join(dir, name), render(v));
    }
    const storeDir = storeMutate === 'absent'
      ? path.join(dir, 'no-such-store')
      : writeStore(dir, typeof storeMutate === 'function' ? storeMutate : undefined);
    const argv = extraArgs === 'store-flag-bare'
      ? ['--parity-only', ...Object.keys(files), '--store']
      : extraArgs === 'store-flag-dup'
        ? ['--parity-only', '--store', storeDir, '--store', storeDir, ...Object.keys(files)]
        : extraArgs === 'from-flag'
          ? ['--parity-only', '--store', storeDir, '--from', 'a.html', ...Object.keys(files)]
          : ['--parity-only', '--store', storeDir, ...Object.keys(files), ...extraArgs];
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
    ran++;
    if (!ok) wrong++;
    console.log(`${label.padEnd(58)} exit ${code}${saidOk ? '' : '  WRONG-MESSAGE'}`
      + `${ok ? '' : `  BRACKET FAILED (expected exit ${expect.code}, saying ${expect.says})`}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// The default store path is the ONLY one production runs — CI, the pre-commit
// hook and every installed user resolve fences/ beside smoke.js without ever
// passing --store. Delete this arm and --store could quietly become mandatory
// while every bracket arm keeps passing, because every other arm passes it.
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-paritydefault-'));
  try {
    const realKernel = fs.readFileSync(path.join(REAL_STORE, 'KERNEL.fence.txt'), 'utf8')
      .replace(/\n$/, '');
    fs.writeFileSync(path.join(dir, 'a.html'), render(realKernel));
    let out = '', code = 0;
    try {
      out = execFileSync('bun', ['run', SMOKE, '--parity-only', 'a.html'],
        { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      code = e.status ?? 1;
      out = String(e.stdout || '') + String(e.stderr || '');
    }
    const ok = code === 0 && /parity\/integrity: ok/.test(out);
    ran++;
    if (!ok) wrong++;
    console.log(`${'scan: default store resolves beside smoke.js'.padEnd(58)} exit ${code}`
      + `${ok ? '' : '  BRACKET FAILED (expected exit zero against the shipped store)'}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// --parity-fix: the same subject, but the command WRITES, so the arms assert
// what happened to the files rather than only an exit code. Its job since the
// store became canonical is REGENERATION: every fenced block in every named
// carrier is rewritten from the store. No --from, no majority, no
// named-carrier source.
//
// THE DANGEROUS FAILURE IS A PARTIAL WRITE, not a wrong verdict. A refusal that
// has already rewritten three of eight carriers leaves the corpus in a state no
// check describes and no author expects — worse than either regenerating or
// declining cleanly. So every refusal arm below asserts that EVERY file in the
// fixture is byte-unchanged, not merely that the exit code was non-zero.
//
// EVERY ARM ALSO ASSERTS THE MESSAGE (`says`), added 2026-07-31. Before that
// the arms captured the refusal text and discarded it, so *any* non-zero exit
// satisfied *every* refusal arm — four arms that could not tell each other's
// failure apart, and a crash satisfied all of them.
//
// [label, files, storeMutate|null, expect]
//   expect.code  — 'zero' or 'nonzero'
//   expect.b     — 'unchanged' (byte-identical to what was written) or
//                  'canonical' (b's block now matches the STORE byte for byte)
//   expect.fence — which fence 'canonical' compares (default KERNEL)
//   expect.says  — RegExp the run's own output MUST match
//   rawArgs      — full argv AFTER the store flag, for flag-combination arms.
const FIX_ARMS = [
  // The emitter's core claim, and R1's gate in miniature: regeneration writes
  // the store's bytes into a drifted carrier and reports what it did.
  ['fix: regenerates a drifted carrier from the store',
    { 'a.html': FENCE, 'b.html': DRIFTED }, null,
    { code: 'zero', b: 'canonical', says: /regenerated 1 fence\(s\) from the store into 1 file/ }],
  // Byte-idempotence is the difference between an emitter and a churn source:
  // a clean corpus must produce ZERO writes, or every regeneration dirties
  // git and the byte-identity gate is unprovable.
  ['fix: idempotent on an already-clean corpus',
    { 'a.html': FENCE, 'b.html': FENCE }, null,
    { code: 'zero', b: 'unchanged', says: /nothing to do/ }],
  ['fix: refuses --from, naming the store as the source',
    { 'a.html': FENCE, 'b.html': DRIFTED }, null,
    { code: 'nonzero', b: 'unchanged', says: /--from is gone/,
      rawArgs: ['--parity-fix', '--from', 'a.html', 'a.html', 'b.html'] }],
  ['fix: refuses a store directory that does not exist',
    { 'a.html': FENCE, 'b.html': DRIFTED }, 'absent',
    { code: 'nonzero', b: 'unchanged', says: /fence-store: cannot read[\s\S]*copy the fences\/ directory/ }],
  // A mangled STORE is the new malformed-source: regenerating from it would
  // write the corruption into every carrier and report success doing it.
  ['fix: refuses a store whose fence is mangled',
    { 'a.html': FENCE, 'b.html': DRIFTED },
    files => { files['KERNEL.fence.txt'] = MANGLED + '\n'; },
    { code: 'nonzero', b: 'unchanged', says: /KERNEL\.fence\.txt is not a single well-formed/ }],
  ['fix: refuses a malformed target',
    { 'a.html': FENCE, 'b.html': MANGLED }, null,
    { code: 'nonzero', b: 'unchanged', says: /refusing the WHOLE run/ }],
  // The guard's subject is the TARGET's whole integrity, not just the fences
  // being rewritten: b's KERNEL is what drifts, but its mangled SOLVER must
  // still refuse the run — writing a good KERNEL into a file broken in SOLVER
  // corrupts a carrier that nothing else reports as broken.
  ['fix: refuses a target mangled in a fence that did not drift',
    { 'a.html': FENCE, 'b.html': DRIFTED + '\n' + SOLVER_MANGLED }, null,
    { code: 'nonzero', b: 'unchanged', says: /refusing the WHOLE run/ }],
  // THE PARTIAL-WRITE ARM, and the reason it needs three files. Arms above
  // have exactly one bad target, where "refused" and "wrote as it went, then
  // hit the bad file" are indistinguishable. Here b is a GOOD drifted target
  // that a write-as-you-go implementation would rewrite before reaching the
  // malformed c. If b comes back modified, validation is not completing before
  // the first write, and a real run would leave the corpus half-regenerated
  // with nothing reporting it.
  ['fix: malformed target leaves the GOOD target untouched too',
    { 'a.html': FENCE, 'b.html': DRIFTED, 'c.html': MANGLED }, null,
    { code: 'nonzero', b: 'unchanged', says: /refusing the WHOLE run/ }],
  // Validation covered readability and well-formedness and never WRITABILITY,
  // so a read-only target threw mid-loop out of an unguarded write and left
  // the corpus half-regenerated. c is read-only and comes AFTER the good
  // target b, so a write-as-you-go implementation rewrites b and then dies.
  ['fix: refuses a read-only target before touching the good one',
    { 'a.html': FENCE, 'b.html': DRIFTED, 'c.html': { body: DRIFTED, mode: 0o444 } }, null,
    { code: 'nonzero', b: 'unchanged', says: /cannot write .*c\.html/ }],
  // --parity-only is what static.yml and the installed pre-commit hook run: a
  // read-only contract that can be turned into a writer by an adjacent flag is
  // not a read-only contract.
  ['fix: refuses --parity-only + --parity-fix together',
    { 'a.html': FENCE, 'b.html': DRIFTED }, null,
    { code: 'nonzero', b: 'unchanged', says: /mutually exclusive/,
      rawArgs: ['--parity-only', '--parity-fix', 'a.html', 'b.html'] }],
  // Multi-fence regeneration, with an HONEST count: the run reports fences it
  // actually rewrote, not the seven the store carries — a "regenerated 7"
  // over a one-fence drift would teach readers the number is noise.
  ['fix: regenerates two drifted fences in one run',
    { 'a.html': FENCE + '\n' + SOLVER, 'b.html': DRIFTED + '\n' + SOLVER_DRIFTED }, null,
    { code: 'zero', b: 'canonical', says: /regenerated 2 fence\(s\)/ }],
  ['fix: regenerates the HTML fence',
    { 'a.html': { html: HTML_FENCE, body: FENCE }, 'b.html': { html: HTML_DRIFTED, body: FENCE } }, null,
    { code: 'zero', b: 'canonical', fence: 'HTML', says: /regenerated 1 fence\(s\)/ }],
];

// A fresh directory per arm: an arm that chmods a fixture would otherwise make
// the next arm's writeFileSync throw, and a bracket that fails for its own
// bookkeeping reasons teaches people to ignore it.
for (const [label, files, storeMutate, expect] of FIX_ARMS) {
  const fixDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-parityfix-'));
  try {
    for (const [name, v] of Object.entries(files)) {
      const p = path.join(fixDir, name);
      fs.writeFileSync(p, render(v));
      if (spec(v).mode !== undefined) fs.chmodSync(p, spec(v).mode);
    }
    const storeDir = storeMutate === 'absent'
      ? path.join(fixDir, 'no-such-store')
      : writeStore(fixDir, typeof storeMutate === 'function' ? storeMutate : undefined);
    // Root ignores the permission bits this arm is built on, and an arm that
    // cannot pose its question must SAY so rather than report a green.
    const readonly = Object.entries(files).filter(([, v]) => spec(v).mode !== undefined);
    let skip = null;
    for (const [name] of readonly) {
      try { fs.accessSync(path.join(fixDir, name), fs.constants.W_OK); skip = name; } catch {}
    }
    if (skip) {
      wrong++;
      console.log(`${label.padEnd(58)} BRACKET INCONCLUSIVE — ${skip} is still writable `
        + `(running as root?), so this arm cannot pose its question`);
      continue;
    }

    const before = Object.fromEntries(Object.keys(files)
      .map(n => [n, fs.readFileSync(path.join(fixDir, n), 'utf8')]));
    // Scene list derived from the arm's own fixture, so an arm can add a third
    // file without the invocation silently continuing to scan only two.
    const argv = ['--store', storeDir,
      ...(expect.rawArgs ?? ['--parity-fix', ...Object.keys(files)])];
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
    // 'canonical' means b's fenced block now matches the STORE byte for byte.
    // Compare the BLOCK, not the file: the rest of b is legitimately its own.
    const name = expect.fence || 'KERNEL';
    const RE = name === 'HTML'
      ? new RegExp(`<!-- ==== ${name}-START ==== -->[\\s\\S]*?<!-- ==== ${name}-END ==== -->`)
      : new RegExp(`\\/\\* ==== ${name}-START ====[\\s\\S]*?\\/\\* ==== ${name}-END ==== \\*\\/`);
    const blockOf = t => (t.match(RE) || [null])[0];
    const bOk = expect.b === 'unchanged'
      ? after['b.html'] === before['b.html']
      : blockOf(after['b.html']) !== null && blockOf(after['b.html']) === STORE_BLOCKS[name];
    // A refusal must leave EVERY file alone, not just the one the arm names.
    // Checking b only is what let the read-only-target defect read as a clean
    // refusal: b was the sole target, so "refused" and "died after writing it"
    // looked identical.
    const untouched = expect.code !== 'nonzero'
      || Object.keys(files).every(n => after[n] === before[n]);
    const saidOk = expect.says.test(out);
    const ok = codeOk && bOk && untouched && saidOk;
    ran++;
    if (!ok) wrong++;
    const bState = expect.b === 'unchanged'
      ? (after['b.html'] === before['b.html'] ? 'unchanged' : 'MODIFIED')
      : (bOk ? 'canonical' : 'NOT-canonical');
    console.log(`${label.padEnd(58)} exit ${code}  b:${bState}`
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
// SCAN INPUT HYGIENE — where the failure is that the check scans FEWER FILES
// THAN ASKED and reports success for the ones it never read.
//
// This is the same family as the mangled-marker episode: nothing is wrong with
// the verdict on what was scanned, the scan itself silently shrank. It is the
// worst shape a gate can take, because the exit code is 0 and stays 0 forever.
const HYGIENE_ARMS = [
  // An unmatched glob reaches argv as a LITERAL under bash (zsh errors first,
  // bash does not), readFileSync threw, and the throw was once swallowed by
  // `catch (e) {}` — scanning nothing and printing ok. Live risk: renaming
  // fixtures/defect-corpus/ would silently drop a directory from CI and from
  // every installed hook, green forever.
  ['scan: refuses an argument it cannot read',
    { 'a.html': FENCE, 'b.html': FENCE },
    ['a.html', 'b.html', 'fixtures/nope/*.html'],
    // [\s\S], not . — the offending argument is named on its own line, and a
    // `.`-based regex passed the exit-code half while silently missing that.
    { code: 'nonzero', says: /could not be read[\s\S]*fixtures\/nope\/\*\.html/ }],
  // A directory argument throws EISDIR, which the same swallow hid.
  ['scan: refuses a directory argument',
    { 'a.html': FENCE, 'b.html': FENCE },
    ['a.html', 'b.html', '.'],
    { code: 'nonzero', says: /could not be read[\s\S]*EISDIR/ }],
];

for (const [label, files, sceneArgs, expect] of HYGIENE_ARMS) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-parityhygiene-'));
  try {
    for (const [name, v] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), render(v));
    const storeDir = writeStore(dir);
    let out = '', code = 0;
    try {
      out = execFileSync('bun', ['run', SMOKE, '--parity-only', '--store', storeDir, ...sceneArgs],
        { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      code = e.status ?? 1;
      out = String(e.stdout || '') + String(e.stderr || '');
    }
    const codeOk = expect.code === 'zero' ? code === 0 : code !== 0;
    const saidOk = expect.says.test(out);
    const ok = codeOk && saidOk;
    ran++;
    if (!ok) wrong++;
    console.log(`${label.padEnd(58)} exit ${code}${saidOk ? '' : '  WRONG-MESSAGE'}`
      + `${ok ? '' : `  BRACKET FAILED (expected exit ${expect.code}, saying ${expect.says})`}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — the parity check is not doing`
    + ` what this bracket claims. A drifted fence would ship, a broken store would scan`
    + ` as green, or a refusal would leave carriers half-rewritten. Do not trust a green`
    + ` --parity-only or --parity-fix until this is 0.`);
  process.exit(1);
}
console.log(`\nall ${ran} arms as specified`);
