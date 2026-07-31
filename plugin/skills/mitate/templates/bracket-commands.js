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
 * NINE ROWS NEED AN ENCODER, NOT TWO, and this file asserted the wrong number
 * until its first unattended run. It recorded `needs: ffmpeg` on video and all
 * only, while poster, sheet, aspect, strip and motion shell out to ffmpeg too
 * (build.js 476, 530, 569, 642, 675). On a runner without it those five did not
 * skip — they reported FAIL, which is how the 0.16.41 gate run failed on five
 * rows that were never broken. Reproduced exactly by running this file with the
 * encoders stripped from PATH; the fix is the table below, not the verbs.
 *
 * REQUIRE_ENCODERS=ffmpeg,avifenc turns a skip of a NAMED binary into a
 * failure. A skip is honest on a laptop and a hole in CI: the workflow installs
 * ffmpeg precisely so those nine rows run, so a skip there means the install
 * silently stopped working and the harness is covering eight verbs while
 * printing green. That includes `aspect`, whose undetected ReferenceError is
 * the reason this file exists — the one verb least affordable to skip.
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
  ['vendor',  ['vendor', scene],                  { stdout: '' }],
  ['bundle',  ['bundle', scene],                  { stdout: 'self-contained' }],
  ['poster',  ['poster', scene, '0', '320'],      { artifact: base + '.jpg', needs: 'ffmpeg' }],
  ['sheet',   ['sheet', scene, '240', '0.6'],     { artifact: base + '.sheet.jpg', needs: 'ffmpeg' }],
  ['aspect',  ['aspect', scene, '0', '240'],      { artifact: base + '.aspect.jpg', needs: 'ffmpeg' }],
  ['strip',   ['strip', scene, '0', '0.5', '4'],  { artifact: base + '.strip.jpg', needs: 'ffmpeg' }],
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
  ['(red) bundle a template', ['bundle', TEMPLATE], { fails: 'shipped' }],
];

const results = [];
try {
  fs.copyFileSync(SOURCE, scene);

  for (const [label, argv, expect] of ROWS) {
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
    if (ok && expect.stdout) {
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

let wrong = 0, skipped = 0;
for (const [label, verdict, why, ok] of results) {
  if (verdict === 'SKIP') skipped++;
  else if (!ok) wrong++;
  console.log(`${label.padEnd(24)} ${verdict.padEnd(7)} ${why}`);
}
const ran = results.length - skipped;
console.log(`\n${ran} verb path(s) exercised, ${skipped} skipped for a missing encoder`);

if (wrong) {
  console.log(`\n${wrong} row(s) did not behave as specified — a build.js verb is broken, or the`
    + ` dispatch accepts what it should refuse. This is the shape where a command`
    + ` nobody runs rots quietly; do not trust the toolchain until this is 0.`);
  process.exit(1);
}
console.log('all rows as specified');
