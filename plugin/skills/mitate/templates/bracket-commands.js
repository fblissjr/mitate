/* The HARNESS TIER: every build.js verb, run once, against one tiny scene.
 *
 * What this is NOT, stated first because the scope is the design: it does not
 * check that output is CORRECT. It checks that the path EXECUTES and names the
 * artifact it promised. Correctness is what the instruments are for; this closes
 * the other shape entirely — a command nobody has run since the feature landed.
 * That is not hypothetical: `build.js aspect` threw a ReferenceError in two
 * skills at once, undetected, because nothing invoked it.
 *
 *   cd <a workspace with three + playwright-core installed>
 *   NODE_PATH="$PWD/node_modules" bun run "${CLAUDE_SKILL_DIR}"/templates/bracket-commands.js
 *
 * Invoked FROM a workspace, like the other browser brackets: build.js resolves
 * three via `process.cwd()` and playwright-core comes from NODE_PATH, so the
 * fixture itself can live in a temp dir and needs no upkeep.
 *
 * CHEAP BY CONSTRUCTION. Every full-film verb takes an fps argument, so they run
 * at 1fps — ~17 frames for a 17s film instead of ~500 — and the raster verbs run
 * at small widths. The point is coverage of the dispatch, not fidelity.
 *
 * SKIPS ARE REPORTED, NEVER SILENT. A row whose encoder is absent prints SKIP
 * with the missing binary named, and is excluded from the pass tally rather
 * than counted as green. A harness that quietly covers less than it says is the
 * thing this file exists to prevent.
 *
 * FIVE ROWS NEED AN ENCODER as of Track E1's migration, down from nine, and the
 * REVIEW TIER NEEDS NONE. `poster`, `sheet`, `aspect` and `strip` moved to the
 * in-page tiler (build.js `tileStills`), so the instruments the build-review
 * loop runs on are now exercised on a bare runner instead of skipping there.
 * That closes the hole the tally below used to print in capitals.
 *
 * The count in this comment has been wrong before and the history is the
 * warning: it said TWO when nine were true, so five rows that were never broken
 * reported FAIL on the first unattended run rather than skipping. If you change
 * a `needs:` below, change this sentence in the same edit — or delete the number
 * and let the tally speak, which is what it is for.
 *
 * REQUIRE_ENCODERS=ffmpeg,avifenc turns a skip of a NAMED binary into a
 * failure. A skip is honest on a laptop and a hole in CI.
 *
 * READ THIS BEFORE TRUSTING A GREEN GATE. **No workflow installs ffmpeg, and
 * nothing sets REQUIRE_ENCODERS** — so the remaining encoder rows SKIP in CI,
 * every time. This comment used to assert the opposite ("the workflow installs
 * ffmpeg precisely so those nine rows run"), which contradicted 444a649 on this
 * same branch — the commit that DECLINED the encoder job — and was therefore a
 * load-bearing comment asserting a control that does not exist. Exactly the
 * class invariant 6 is for, written into the file that exists to prevent it.
 *
 * What still skips is `motion` (a measurement awaiting recalibration) and the
 * three export verbs, which stay ungated by decision rather than by accident.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BUILD = path.join(__dirname, 'build.js');
const SMOKE = path.join(__dirname, 'smoke.js');
// The corpus lives at the repo root (the plugin ships no films). Brackets are
// repo controls: they ship as dev tooling but run from a checkout, where four
// levels up from templates/ IS the repo root.
const SCENES = path.join(__dirname, '..', '..', '..', '..', 'scenes');
const TEMPLATE = path.join(__dirname, 'scene.template.html');

// The cheapest real scene in the corpus: one locked shot, no characters, no
// solver traffic. A film would work and would cost minutes.
const SOURCE = path.join(SCENES, 'noise-chart.html');

const has = bin => { try { execFileSync('command', ['-v', bin], { shell: true, stdio: 'ignore' }); return true; }
                     catch (e) { return false; } };

// Binaries whose absence must be a failure rather than a reported skip. Empty
// by default, so a laptop without avifenc still gets a useful run; set in CI,
// where a skip means the install broke and coverage silently shrank.
const REQUIRED = (process.env.REQUIRE_ENCODERS || '').split(',').map(s => s.trim()).filter(Boolean);

// INSIDE the workspace, not os.tmpdir() — and this bracket found the reason on
// its first run. `vendor` shells out to `bun build`, which resolves `three` from
// the ENTRY FILE's directory, and the entry is written beside the scene. A
// fixture in os.tmpdir() therefore fails to vendor even when three is installed,
// because tmpdir has no node_modules to walk up to. `require.resolve` inside
// build.js falls back to process.cwd() and would have been satisfied; the
// bundler is not. That is CLAUDE.md's "three resolves from the workspace where a
// scene is being built" being literally true of the bundler, and it is the kind
// of constraint no amount of reading finds.
const work = fs.mkdtempSync(path.join(process.cwd(), '.mitate-cmd-'));
const scene = path.join(work, 'tiny.html');
const base = scene.replace(/\.html$/, '');
// A COPY, never the tracked template. The red arm below runs build.js against a
// *.template.html to prove the embed guard fires — and if that guard ever
// regresses, running it against the real file inflates a SHIPPED source by
// ~1 MB. That is not hypothetical: neutralising the guard and running this
// bracket changed the tracked file's hash, which is the documented damage that
// "reached `git add` once", rebuilt inside the control meant to prevent it.
// The basename is preserved because the guard matches on it.
const templateCopy = path.join(work, path.basename(TEMPLATE));

/* FIXTURES FOR `check`, one defect apiece.
 *
 * `check` is the one verb whose whole output is a verdict, so "the path
 * executes" — this file's stated scope everywhere else — says nothing about it.
 * A checker that runs and finds nothing is indistinguishable from a broken one,
 * which is the shape the rest of this file exists to close for the other verbs.
 * So these rows do assert content: one arm per property `check` claims to
 * decide, each on a copy of the real scene with exactly that property broken.
 *
 * MUTATED FROM THE REAL SOURCE, not hand-written. A synthetic fixture proves a
 * checker works on synthetic fixtures. `mutate` throws when a replacement
 * matches nothing, so an edit to noise-chart.html's tables breaks this loudly
 * instead of leaving arms that pass against an unmodified copy — a fixture that
 * silently equals its original is a green arm testing the null change.
 */
const SHOT = "  {at:['title',0], subject:'chart', size:'FS', angle:0, elev:0},";
const LIT_SHOTS = "const SHOTS=[\n  {at:['title',0], subject:'chart', size:'FS', angle:0, elev:0},\n].map(sh=>({...sh,t:beatAt(sh.at[0],sh.at[1])}));";
const IMP_SHOTS = "const SHOTS=[];\nfor (const q of [{at:['title',0], subject:'chart', size:'FS', angle:0, elev:0}])\n  SHOTS.push({...q,t:beatAt(q.at[0],q.at[1])});";
const NONLIT_SHOTS = "function buildShots(){return [{at:['title',0], subject:'chart', size:'FS', angle:0, elev:0}]\n  .map(sh=>({...sh,t:beatAt(sh.at[0],sh.at[1])}));}\nconst SHOTS=buildShots();";
const BAD = {};
const badPath = tag => (BAD[tag] = path.join(work, `check-${tag}.html`));
const mutate = (tag, pairs) => {
  let src = fs.readFileSync(SOURCE, 'utf8');
  for (const [from, to] of pairs) {
    if (!src.includes(from)) {
      // THROW, never process.exit. `exit` terminates without unwinding, so the
      // finally below never runs and the temp workspace is left in the repo
      // root -- where it is not gitignored, and where the next `git add -A`
      // sweeps it into a commit. That happened on 2026-08-02: a repointed
      // mutation string exited here, two .mitate-cmd-* directories survived, and
      // selfcheck check 9 caught them at the pre-commit hook. The check did its
      // job; this is the leak it was catching.
      throw new Error(`bracket-commands: fixture "${tag}" cannot be built — ${path.basename(SOURCE)} `
        + `no longer contains:\n  ${from}\nRepoint the mutation; an unmutated copy would make its arm `
        + `assert nothing.`);
    }
    src = src.split(from).join(to);
  }
  fs.writeFileSync(BAD[tag], src);
};
// A copy of the tool PAIR with smoke.js's caption constant renamed. `check`
// reads that threshold out of smoke.js rather than carrying its own, so this is
// the control over that one-home claim: rename it and the verb must refuse,
// never fall back to a private copy that could then drift.
const DRIFT = path.join(work, 'drift');
const DRIFT_BUILD = path.join(DRIFT, 'build.js');
for (const t of ['subject', 'focus', 'anchor', 'beat', 'rung', 'order', 'flash', 'frame',
                 'union', 'anchored-union', 'caption', 'repeat', 'notascene',
                 'imperative', 'nonliteral', 'durconst', 'fracconst', 'dotassign',
                 'unreadable', 'misskey', 'privatekey']) badPath(t);

const run = (args, cwd, build) => {
  try {
    const out = execFileSync('bun', ['run', build || BUILD, ...args],
      { cwd: cwd || process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, FRAMES_DIR: path.join(work, 'frames') } });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: String(e.stdout || '') + String(e.stderr || '') };
  }
};

// [label, argv, expect]
//   expect.artifact — a path that must exist afterwards
//   expect.stdout   — a substring the run must print (for verbs with no artifact)
//   expect.absent   — a substring the run must NOT print
//   expect.fails    — this row MUST exit non-zero, and print this substring
//   expect.needs    — external binary; absent => SKIP, reported, not counted
//   expect.build    — run a different build.js copy (for the tool-pair arms)
//
// `absent` exists for the false-positive side, which this repo has paid for
// more than once: a first-cut check here reported 46 failures of which 45 were
// correct files. An arm that only ever asserts a finding IS present cannot tell
// a sharp check from an indiscriminate one.
const ROWS = [
  // `stdout: ''` here for the file's whole life, and never evaluated: the guard
  // below read `if (ok && expect.stdout)`, where '' is falsy. So this row
  // asserted exit 0 and nothing else, while looking like it asserted output.
  // This row of bracket-commands.js measured the substring by running the verb.
  ['vendor',  ['vendor', scene],                  { stdout: 'three already embedded' }],
  ['bundle',  ['bundle', scene],                  { stdout: 'self-contained' }],
  ['poster',  ['poster', scene, '0', '320'],      { artifact: base + '.jpg' }],
  ['sheet',   ['sheet', scene, '240', '0.6'],     { artifact: base + '.sheet.jpg' }],
  ['aspect',  ['aspect', scene, '0', '240'],      { artifact: base + '.aspect.jpg' }],
  ['strip',   ['strip', scene, '0', '0.5', '4'],  { artifact: base + '.strip.jpg' }],
  ['motion',  ['motion', scene, '1'],             { stdout: 'motion:', needs: 'ffmpeg' }],
  ['probe',   ['probe', scene, '0', 'DURATION'],  { stdout: 'DURATION' }],
  ['check',   ['check', scene],                   { stdout: 'check: ok' }],
  ['frames',  ['frames', scene, '1'],             { artifact: path.join(work, 'frames', 'f00001.png') }],
  ['video',   ['video', scene, '1'],              { artifact: base + '.mp4', needs: 'ffmpeg' }],
  ['all',     ['all', scene, '1'],                { artifact: base + '.mp4', needs: 'ffmpeg' }],
  ['avif',    ['avif', scene, '1', '240'],        { artifact: base + '.avif', needs: 'avifenc' }],
  ['loop',    ['loop', scene, '1', '240'],        { artifact: base + '.webp', needs: 'img2webp' }],

  // RED ARMS. Without these the file is a smoke test wearing a bracket's name:
  // every row above could pass while the dispatch silently accepted anything.
  ['(red) unknown verb',     ['nosuchverb', scene],  { fails: 'usage:' }],
  ['(red) probe, no expr',   ['probe', scene, '0'],  { fails: 'need <when>' }],
  ['(red) missing scene',    ['poster', path.join(work, 'absent.html')], { fails: '' }],
  // ensureVendor refuses to embed into a shipped *.template.html -- a real guard
  // with a real history: running any command on one used to inflate it with
  // 0.77 MB of inlined three, idempotently, and it reached `git add` once.
  ['(red) bundle a template', ['bundle', templateCopy], { fails: 'shipped' }],

  // `check`'s error tier: the tables cannot both be satisfied, so the verb owes
  // a non-zero exit. Each names the substring its own message carries, because
  // "exit 1" alone would let any one of these pass on another's finding.
  // Since REP2 the subject, focus and rung refusals QUOTE THE KIT'S OWN THROW
  // (check executes the canonical solver rather than mirroring it), so these
  // arms assert the kit's words — the same words a driven page dies with,
  // which bracket-check-kit.js pins from both sides.
  ['(red) check subject',   ['check', BAD.subject],   { fails: 'unknown subject: chartt' }],
  ['(red) check focus',     ['check', BAD.focus],     { fails: 'focus — unknown subject: charts' }],
  ['(red) check anchor',    ['check', BAD.anchor],    { fails: 'outside 0..1' }],
  ['(red) check beat name', ['check', BAD.beat],      { fails: 'which BEATS does not declare' }],
  ['(red) check rung',      ['check', BAD.rung],      { fails: 'unknown size: FSX' }],
  ['(red) check shot order',['check', BAD.order],     { fails: 'before SHOTS[0]' }],
  // No shipped scene declares a flash, so this arm is the ONLY thing that ever
  // exercises that resolver. Without it the code path is prose.
  ['(red) check flash beat',['check', BAD.flash],     { fails: 'CONFIG.flashes[0]' }],
  ['(red) check frame px',  ['check', BAD.frame],     { fails: 'FRAME.aspect' }],
  ['(red) check not a scene', ['check', BAD.notascene], { fails: 'no BEATS table' }],
  ['(red) check cps home',  ['check', scene],         { fails: 'no longer declares CPS_WARN_THRESHOLD',
                                                        build: DRIFT_BUILD }],

  // `check`'s advisory tier: exit 0, and the finding must be ON SCREEN. The
  // anchored-union row is the false-positive control — the shipped two-shot in
  // bear-and-bees.html is exactly this shape and is deliberate, so a rule that
  // cannot tell the two apart would condemn a correct film.
  ['(warn) check union rung',    ['check', BAD.union],            { stdout: 'union of 2 subjects on rung MS' }],
  ['(warn) check union anchored',['check', BAD['anchored-union']], { absent: 'union of' }],
  ['(red) check loop-built SHOTS',  ['check', BAD['imperative']], { stdout: 'SHOTS is declared but assembled' }],
  ['(warn) check dur from a const',['check', BAD['durconst']],   { stdout: 'cannot resolve', absent: 'ERROR' }],
  ['(warn) check anchor from a const',['check', BAD['fracconst']], { stdout: 'cannot resolve', absent: 'ERROR' }],
  ['(warn) check dot-assigned SUBJECTS',['check', BAD['dotassign']], { stdout: 'SUBJECTS is declared but assembled', absent: 'ERROR' }],
  ['(warn) check misspelled kit key',  ['check', BAD['misskey']],   { stdout: 'did you mean "exposure"', absent: 'ERROR' }],
  ['(warn) check private key, read, quiet',['check', BAD['privatekey']], { stdout: 'check: ok', absent: 'nothing reads' }],
  ['(red) check unreadable SHOTS',  ['check', BAD['unreadable']], { stdout: 'SHOTS is declared but could not be read' }],
  ['(red) check call-built SHOTS',  ['check', BAD['nonliteral']], { stdout: 'SHOTS is declared but assembled' }],
  ['(warn) check caption cps',   ['check', BAD.caption],          { stdout: 'cps against a' }],
  ['(warn) check repeat framing',['check', BAD.repeat],           { stdout: 'share one framing' }],
];

const results = [];
try {
  fs.copyFileSync(SOURCE, scene);
  fs.copyFileSync(TEMPLATE, templateCopy);

  const shot = (body) => [[SHOT, body]];
  mutate('subject', shot("  {at:['title',0], subject:'chartt', size:'FS', angle:0, elev:0},"));
  mutate('focus',   shot("  {at:['title',0], subject:'chart', size:'FS', angle:0, elev:0, focus:'charts'},"));
  mutate('anchor',  shot("  {at:['title',1.4], subject:'chart', size:'FS', angle:0, elev:0},"));
  mutate('beat',    shot("  {at:['ttitle',0], subject:'chart', size:'FS', angle:0, elev:0},"));
  mutate('rung',    shot("  {at:['title',0], subject:'chart', size:'FSX', angle:0, elev:0},"));
  mutate('order',   shot("  {at:['ports',.5], subject:'chart', size:'FS', angle:0, elev:0},\n"
                       + "  {at:['title',.5], subject:'chart', size:'WS', angle:0, elev:0},"));
  mutate('union',   shot("  {at:['title',0], subject:['chart','chart'], size:'MS', angle:0, elev:0},"));
  // Same shot, one field added. The pair is the whole point: the rule must fire
  // on the first and stay quiet on the second, or it is not a rule about unions.
  mutate('anchored-union', shot("  {at:['title',0], subject:['chart','chart'], size:'MS', angle:0, elev:0, anchor:.45},"));
  mutate('repeat',  shot(SHOT + "\n  {at:['mxrow',.2], subject:'chart', size:'FS', angle:0, elev:0},"
                              + "\n  {at:['ports',.2], subject:'chart', size:'FS', angle:0, elev:0},"));
  // A table the checker CANNOT read must say so. Both shapes below are legal
  // JS that a film could plausibly write, and before 0.16.68 both produced a
  // clean green: the loop form evaluated the empty literal as a valid table,
  // the call form fell into the same 'absent' state as a 2D scene with no
  // SHOTS at all. A verdict that cannot tell 'nothing to check' from 'could
  // not check' is the failure this whole file exists to keep out.
  // A dur that references a scene constant is ORDINARY AUTHORING, not a defect.
  // Before 0.16.70 the unresolved-identifier proxy made it read as `undefined`
  // and check ERRORED on a valid scene -- a false positive, in a verb now wired
  // into every push, so the first author to write `const HOLD = 2.5` would have
  // redded main.
  mutate('durconst',    [["const BEATS = [", "const HOLD = 2.5;\nconst BEATS = ["],
                         ["{name: 'title', dur: 2.4}", "{name: 'title', dur: HOLD}"]]);
  // The same authoring shape ONE FIELD OVER: an anchor FRACTION from a scene
  // constant. The 0.16.70 exemption never reached this validator, so the
  // unresolved proxy stringified as `undefined` and check ERRORED on a scene
  // that drives — quoting a value the source never wrote.
  mutate('fracconst',   [["const BEATS = [", "const FRAC = 0.5;\nconst BEATS = ["],
                         [SHOT, "  {at:['title',FRAC], subject:'chart', size:'FS', angle:0, elev:0},"]]);
  // Dot-assignment after the literal changes MEMBERSHIP, and the mutation
  // scanner knew .push() and bracket-assignment but not this spelling: check
  // read the stale literal WHILE claiming coverage, and errored `unknown
  // subject` on a scene that drives fine.
  mutate('dotassign',   [["};\n// One locked, head-on shot",
                          "};\nSUBJECTS.legend={pos:t=>[0,GRID_CY,0],h:1};\n// One locked, head-on shot"],
                         [SHOT, "  {at:['title',0], subject:'legend', size:'FS', angle:0, elev:0},"]]);
  // REP3's unknown-key pair, same discipline as union/anchored-union: the rule
  // must fire on a misspelled kit key AND stay quiet on a film-private key the
  // scene's own code reads, or it is not a rule about dead keys.
  mutate('misskey',     [["  exposure: 1.0,", "  exposur: 1.0,"]]);
  mutate('privatekey',  [["const STYLE = {", "const STYLE = {\n  chartGlow: 0x101010,"],
                         ["const SUBJECTS={", "void STYLE.chartGlow;\nconst SUBJECTS={"]]);
  // A 3D scene whose SHOTS literal cannot be SLICED must say so. Until 0.16.70
  // every malformed-literal path returned null, which means "this scene has no
  // SHOTS" -- so a broken table printed `no SHOTS (2D)` under a clean green.
  // That is the same class 0.16.68 closed for loop-built tables, reached through
  // the other door, and its commit message claimed the class was shut.
  mutate('unreadable',  [["const SHOTS=[\n", "const SHOTS=[\n  /* unterminated comment\n"]]);
  mutate('imperative',  [[LIT_SHOTS, IMP_SHOTS]]);
  mutate('nonliteral',  [[LIT_SHOTS, NONLIT_SHOTS]]);
  mutate('flash',   [['  flashes: [],', '  flashes: [{beat:"nosuchbeat", at:0}],']]);
  mutate('frame',   [['px: [1920, 1080]', 'px: [1080, 1920]']]);
  // Long enough to cross the threshold, not merely longer than the original —
  // a first draft of this fixture lengthened the caption to 28.8 cps against a
  // 30 cps limit and its arm reported MISSED, which is the fixture failing to
  // reach the property rather than the check failing to see it.
  mutate('caption', [['cap: "Bottom row', 'cap: "Far more of a caption than anybody could read while it is on screen, and then some. Bottom row']]);
  fs.writeFileSync(BAD.notascene, '<html><body><script>const NOTHING=[1];</script></body></html>');

  fs.mkdirSync(DRIFT, { recursive: true });
  fs.copyFileSync(BUILD, DRIFT_BUILD);
  // fences/ moves with the tools (the 0.17.1 workspace rule): since REP2 check
  // executes the store before it reads smoke.js's constants, so a drift copy
  // without fences/ would fail on the store refusal and this arm would pass on
  // the wrong message.
  fs.cpSync(path.join(__dirname, 'fences'), path.join(DRIFT, 'fences'), { recursive: true });
  fs.writeFileSync(path.join(DRIFT, 'smoke.js'),
    fs.readFileSync(SMOKE, 'utf8').split('CPS_WARN_THRESHOLD').join('CPS_RENAMED'));

  for (const [label, argv, expect] of ROWS) {
    // A vacuous expectation is a defect, not a style choice — see the vendor row.
    if (expect.stdout === '') {
      console.error(`${label}: expect.stdout is empty, which asserts nothing. `
                  + `Name a substring the verb actually prints, or drop the key.`);
      process.exit(1);
    }
    // AN ARTIFACT ASSERTION MUST PROVE THIS ROW WROTE THE FILE. `all` expected
    // base.mp4 — which the `video` row two lines above had already produced, so
    // `all` doing nothing at all still passed, "tiny.mp4 written" and green.
    // Reproduced by removing the video() call from `all`. Clearing first makes
    // every artifact row prove its own work rather than inherit a neighbour's.
    if (expect.artifact) fs.rmSync(expect.artifact, { force: true });
    if (expect.needs && !has(expect.needs)) {
      const required = REQUIRED.includes(expect.needs);
      results.push([label, required ? 'FAIL' : 'SKIP',
        `${expect.needs} not on PATH` + (required ? ' — REQUIRE_ENCODERS says that is a failure here' : ''),
        required ? false : null]);
      continue;
    }
    const r = run(argv, undefined, expect.build);
    if (expect.fails !== undefined) {
      const ok = r.code !== 0 && r.out.includes(expect.fails);
      results.push([label, ok ? 'CAUGHT' : 'MISSED', `exit ${r.code}`, ok]);
      continue;
    }
    let ok = r.code === 0, why = `exit ${r.code}`;
    if (ok && expect.artifact) {
      ok = fs.existsSync(expect.artifact);
      why += ok ? `, ${path.basename(expect.artifact)} written` : `, ${path.basename(expect.artifact)} ABSENT`;
    }
    // !== undefined, matching how `expect.fails` is tested twelve lines up. The
    // truthiness form skipped any row whose expected substring was '' — which
    // was exactly one row, and it had been silently unasserted since it was
    // written. Two sibling checks in one function disagreeing about how to test
    // presence is the shape to watch for.
    if (ok && expect.stdout !== undefined) {
      ok = r.out.includes(expect.stdout);
      why += ok ? '' : `, stdout lacks "${expect.stdout}"`;
    }
    // The other direction, and it carries as much as the one above: this is
    // where a check that fires on a correct file is caught.
    if (ok && expect.absent !== undefined) {
      ok = !r.out.includes(expect.absent);
      why += ok ? '' : `, stdout contains "${expect.absent}" and must not`;
    }
    // The line that NAMES the failure, not the last two lines. Those are a
    // blank and the interpreter banner on any Bun crash, so the 0.16.41 gate
    // log said `/ Bun v1.3.14 (Linux x64)` five times and nothing else, and the
    // cause had to be re-derived locally. A diagnostic that survives only where
    // you can already reproduce is not one.
    if (!ok && r.code !== 0) {
      const lines = r.out.trim().split('\n').filter(l => l.trim());
      const named = lines.find(l => /^\s*(error|[A-Za-z]*Error)\b/.test(l));
      why += `\n      ${named || lines.slice(-2).join(' / ')}`;
    }
    results.push([label, ok ? 'ok' : 'FAIL', why, ok]);
  }
} catch (e) {
  // Cleanup first, THEN report: an unbuildable fixture is a real failure and must
  // exit non-zero, but it must not also leave scratch behind on the way out.
  fs.rmSync(work, { recursive: true, force: true });
  console.error(String(e && e.message ? e.message : e));
  process.exit(1);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}

// TIERS. A flat "N exercised, M skipped" reads as M missing tests, and that is
// the wrong story in two different directions at once: the export rows are
// DELIBERATELY not gated (owner call — a rotted export verb costs one annoyed
// moment; a rotted review instrument silently corrupts the loop this project
// teaches), while the review rows are encoder-blocked ACCIDENTALLY and that is a
// real hole. One number cannot say both. Grouping is what makes the difference
// legible, and it is why this reports per tier.
const TIER = {
  core:   ['vendor', 'bundle', 'probe', 'frames', 'check'],
  review: ['poster', 'sheet', 'aspect', 'strip', 'motion'],
  export: ['video', 'all', 'avif', 'loop'],
};
// `(red)` and `(warn)` are both control arms and they assert opposite things:
// red says the dispatch must REFUSE, warn says the report must SAY. Splitting
// them keeps a green board from reading as if every control were a refusal.
const CONTROL = /^\((red|warn)\)/;
const tierOf = label => (CONTROL.exec(label) || [])[1]
  || Object.keys(TIER).find(k => TIER[k].includes(label)) || 'other';

let wrong = 0, skipped = 0;
const tally = {};
for (const [label, verdict, why, ok] of results) {
  const t = tierOf(label);
  (tally[t] ||= { ran: 0, skipped: 0 });
  if (verdict === 'SKIP') { skipped++; tally[t].skipped++; }
  else { tally[t].ran++; if (!ok) wrong++; }
  console.log(`${label.padEnd(24)} ${verdict.padEnd(7)} ${why}`);
}
const ran = results.length - skipped;
const line = (name, note) => {
  const t = tally[name] || { ran: 0, skipped: 0 };
  console.log(`  ${name.padEnd(7)} ${String(t.ran).padStart(2)} exercised, `
            + `${String(t.skipped).padStart(2)} skipped   ${note}`);
};
console.log(`\n${ran} verb path(s) exercised, ${skipped} skipped for a missing encoder`);
line('core',   'no encoder needed — this tier must always be fully exercised');
// The review line distinguishes the two states it can be in, because before
// Track E1 it printed HOLE at `0 exercised / 5 skipped` and printing the same
// words at `4 / 1` would overstate what is left. What remains is `motion`, and
// it is a KNOWN DEFERRAL rather than an accident: migrating it needs a
// recalibration (its current scale corresponds to no documented luma
// computation), which is a different job from swapping a scaler.
line('review', !tally.review?.skipped
  ? 'the build-review loop, fully exercised — no encoder needed'
  : tally.review.ran
    ? 'the tilers run encoder-free (Track E1). What still skips is `motion`, a'
      + '\n                                   measurement awaiting recalibration — a known deferral, not a hole.'
    : 'HOLE: encoder-blocked, not by design. These are the instruments the build-review'
      + '\n                                   loop runs on, and CI exercises none of them. '
      + 'Track E1 closes it.');
line('export', 'DELIBERATELY not gated — no encoder belongs in CI (working-plan Track E)');
line('red',    'the dispatch must refuse these');
line('warn',   'advisories that must be REPORTED — including one that must NOT fire');

if (wrong) {
  console.log(`\n${wrong} row(s) did not behave as specified — a build.js verb is broken, or the`
    + ` dispatch accepts what it should refuse. This is the shape where a command`
    + ` nobody runs rots quietly; do not trust the toolchain until this is 0.`);
  process.exit(1);
}
console.log(`all ${ran} rows as specified`);
