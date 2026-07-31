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
const EXAMPLES = path.join(__dirname, '..', 'examples');
const TEMPLATE = path.join(__dirname, 'scene.template.html');

// The cheapest real scene in the corpus: one locked shot, no characters, no
// solver traffic. A film would work and would cost minutes.
const SOURCE = path.join(EXAMPLES, 'noise-chart.html');

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

const run = (args, cwd) => {
  try {
    const out = execFileSync('bun', ['run', BUILD, ...args],
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
//   expect.fails    — this row MUST exit non-zero, and print this substring
//   expect.needs    — external binary; absent => SKIP, reported, not counted
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
];

const results = [];
try {
  fs.copyFileSync(SOURCE, scene);
  fs.copyFileSync(TEMPLATE, templateCopy);

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
    const r = run(argv);
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
  core:   ['vendor', 'bundle', 'probe', 'frames'],
  review: ['poster', 'sheet', 'aspect', 'strip', 'motion'],
  export: ['video', 'all', 'avif', 'loop'],
};
const tierOf = label => label.startsWith('(red)') ? 'red'
  : Object.keys(TIER).find(k => TIER[k].includes(label)) || 'other';

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

if (wrong) {
  console.log(`\n${wrong} row(s) did not behave as specified — a build.js verb is broken, or the`
    + ` dispatch accepts what it should refuse. This is the shape where a command`
    + ` nobody runs rots quietly; do not trust the toolchain until this is 0.`);
  process.exit(1);
}
console.log('all rows as specified');
