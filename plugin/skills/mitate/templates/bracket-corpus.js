/* Bracket for the DEFECT CORPUS (fixtures/defect-corpus/) — the wiring its
 * README promised and nothing built, carried across seven PRs and ruled on by
 * the owner 2026-08-03 (option: coarse tier now, row-by-row later).
 *
 * WHAT THE CORPUS IS, checked by running smoke on it before this was
 * designed: after-hours.html
 * PASSES smoke clean — its fourteen documented defects are COMPOSITION
 * defects (sliding paws, dead framing, occlusion), which the pass/fail gate
 * does not see. It is a calibration target for the review instruments, not a
 * scene that fails checks. A first design assumed "must fail the gate" and
 * a single smoke run refuted it; this file asserts what is actually true:
 *
 *   1. The fixture stays USABLE — smoke passes, so the measuring stick still
 *      loads, renders, and holds determinism. A corpus scene that rots into
 *      not-running stops being apparatus.
 *   2. The rows the corpus README re-checked on 2026-08-02 still show
 *      their derivable signatures:
 *        row 10b — four byte-identical framings, SHOTS[2,6,9,11], which
 *                  `build.js check` reports as its repeat-framing warning;
 *        row 11  — the walker's real width exceeds its declared w:2.8
 *                  (probe reads ~3.12 at t=5). This arm pins the GEOMETRY
 *                  side; a fix that re-declares w would pass it — the
 *                  README row owns the declared figure.
 *      Row 8 (motion's endcap floor) needs an encoder and is deliberately
 *      deferred, stated here rather than silently absent. The ten
 *      prototype-evidence-only rows stay UNVERIFIED and unpinned — each one
 *      that later graduates from that table earns its arm then.
 *
 * The corpus lives OUTSIDE the plugin subtree on purpose, so this bracket
 * walks up from wherever it runs (repo, gate workspace) to find it, and
 * SKIPS with a stated reason where it does not exist (the install cache) —
 * a repo-only control, said out loud rather than a green over nothing.
 *
 * Cost, disclosed: one full smoke run plus one probe (~2 min in the gate).
 *
 *   cd <a workspace with three + playwright-core installed>
 *   NODE_PATH="$PWD/node_modules" bun run "${CLAUDE_SKILL_DIR}"/templates/bracket-corpus.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD = path.join(__dirname, 'build.js');
const SMOKE = path.join(__dirname, 'smoke.js');

// The corpus is outside the shipped subtree; find it by walking up.
let root = __dirname;
let corpus = null;
for (let i = 0; i < 6; i++) {
  const c = path.join(root, 'fixtures', 'defect-corpus');
  if (fs.existsSync(c)) { corpus = c; break; }
  root = path.dirname(root);
}
if (!corpus) {
  console.log('SKIP — fixtures/defect-corpus/ not found above this directory. This is a '
    + 'repo-only control (the corpus deliberately does not ship); 0 arms ran.');
  process.exit(0);
}
const SCENE = path.join(corpus, 'after-hours.html');

const run = argv => {
  try {
    const out = execFileSync('bun', ['run', ...argv],
      { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: String(e.stdout || '') + String(e.stderr || '') };
  }
};

let wrong = 0, ran = 0;
const arm = (label, ok, why) => {
  ran++;
  if (!ok) wrong++;
  console.log(`${label.padEnd(52)} ${why}${ok ? '' : '  BRACKET FAILED'}`);
};

// Claim: delete this arm and the corpus can rot into a scene that no longer
// runs — an unusable measuring stick — with everything else still green.
{
  const r = run([SMOKE, SCENE]);
  arm('fixture still passes smoke (usable apparatus)',
    r.code === 0 && /all scenes pass/.test(r.out), `exit ${r.code}`);
}

// Claim: delete this arm and row 10b's signature (the corpus's one
// table-derivable defect) can vanish — a framing dedupe, a check regression —
// unnoticed. The warning text is check's own; the shot list is the row's.
{
  const r = run([BUILD, 'check', SCENE]);
  const hit = /SHOTS\[2,6,9,11\]: 4 shots share one framing/.test(r.out);
  arm('row 10b: four identical framings still warned',
    r.code === 0 && hit, `exit ${r.code}${hit ? ', warned' : ', NO WARNING'}`);
}

// Claim: delete this arm and row 11's geometry side (real width above the
// declared 2.8) can drift — a walker rebuild, a probe regression — unnoticed.
// Band 2.9..3.4 brackets the README's 2026-08-02 figure (3.12 at t=5) with room
// for none of the defect to disappear silently.
{
  const r = run([BUILD, 'probe', SCENE, '5', 'bb(walker).max.x - bb(walker).min.x']);
  const m = r.out.match(/^\s+([\d.]+)\s*$/m);
  const v = m ? Number(m[1]) : NaN;
  const ok = r.code === 0 && v > 2.9 && v < 3.4;
  arm('row 11: walker width still exceeds its declaration',
    ok, `exit ${r.code}, measured ${Number.isFinite(v) ? v.toFixed(3) : 'NOTHING'}`);
}

if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — the corpus no longer matches its `
    + `own README: either the fixture stopped being usable, or a verified defect's signature `
    + `is gone. Re-measure against fixtures/defect-corpus/README.md before trusting any `
    + `instrument that was calibrated on it.`);
  process.exit(1);
}
console.log(`\nall ${ran} arms as specified`);
