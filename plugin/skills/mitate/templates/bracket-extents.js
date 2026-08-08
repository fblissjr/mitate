/* Bracket for `build.js check`'s EXTENT-PROVENANCE warn (REP4) — the rule that
 * a SUBJECTS extent (h/w/d) derives its base from construction and names any
 * hand adjustment, never folding in a bare number.
 *
 * Each way a provenance lint can rot gets its own arms: silently firing on
 * nothing (the shipped scenes migrate and a regression stops the warn,
 * unnoticed because green output stays green) and firing on everything
 * (numbers inside `pos`, inside comments, inside strings — none of which is
 * an extent — until authors stop reading it). The run prints its own tally.
 * The synthetic fixtures live in a temp dir and cost no browser: check reads
 * source text only.
 *
 * DISCLOSED EDGES, out of scope by decision rather than accident:
 *   - a QUOTED extent key ('h': 2.8) is not the house spelling and is not
 *     scanned; every carrier and template writes bare keys.
 *   - a SUBJECTS assembled outside its literal (a call, later pushes) is the
 *     table-level declared substitution one tier up — the imperative arm here
 *     pins that the substitution is DECLARED, not that extents inside it are
 *     judged (they cannot be: there is no literal to scan). An ENTRY whose
 *     value is an identifier (`walker: WALKER`) is the same shape one level
 *     down and is skipped without a declaration — the entry's numbers live in
 *     another declaration this scan does not follow.
 *
 * The corpus arm pins the red-first subject: fixtures/defect-corpus row 11's
 * walker declares w:2.8 as a bare number, so the fixture must draw the warn
 * with walker among the named sites. Like bracket-corpus.js, that one arm
 * SKIPs with a stated reason where the corpus does not exist (the install
 * cache) — the synthetic arms run everywhere.
 *
 *   bun run "${CLAUDE_SKILL_DIR}"/templates/bracket-extents.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const BUILD = path.join(__dirname, 'build.js');

const run = argv => {
  try {
    const out = execFileSync('bun', ['run', ...argv],
      { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: String(e.stdout || '') + String(e.stderr || '') };
  }
};

let wrong = 0, ran = 0, skipped = 0;
const arm = (label, ok, why) => {
  ran++;
  if (!ok) wrong++;
  console.log(`${label.padEnd(56)} ${why}${ok ? '' : '  BRACKET FAILED'}`);
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bracket-extents-'));
const scene = (name, subjectsLine) => {
  const p = path.join(tmp, name);
  fs.writeFileSync(p, `const BEATS=[{name:'a',dur:2}];\n${subjectsLine}\n`);
  return p;
};
const WARN = /bare number\(s\) in extents/;

// Claim: delete this arm and the warn can stop firing on the exact shape it
// exists for — a fully hand-declared extent — and nothing else goes red.
{
  const r = run([BUILD, 'check', scene('bare.html',
    'const SUBJECTS={box:{pos:()=>[0,1,0],h:2.5,w:1.5}};')]);
  const hit = WARN.test(r.out) && /box \(h: 2\.5; w: 1\.5\)/.test(r.out);
  arm('bare h/w draws the warn, sites named', r.code === 0 && hit,
    `exit ${r.code}${hit ? ', warned' : ', NO WARNING'}`);
}

// Claim: delete this arm and the warn can start firing on the ADOPTED form —
// derived base plus named adjustment — which is how a lint trains route-around.
{
  const r = run([BUILD, 'check', scene('derived.html',
    'const PAD=.4;\nconst SUBJECTS={rig:{pos:()=>[0,1,0],h:rig.height+PAD,w:rig.length}};')]);
  const hit = WARN.test(r.out);
  arm('derived base + named term stays quiet', r.code === 0 && !hit,
    `exit ${r.code}${hit ? ', FALSE WARN' : ', quiet'}`);
}

// Claim: delete this arm and a bare pad on a derived base — the named-term
// half of the rule, the half every shipped +.3/+.4 pad violated — can pass.
{
  const r = run([BUILD, 'check', scene('pad.html',
    'const SUBJECTS={rig:{pos:()=>[0,1,0],h:rig.height+.4}};')]);
  const hit = WARN.test(r.out) && /rig \(h: \.4\)/.test(r.out);
  arm('bare pad on a derived base draws the warn', r.code === 0 && hit,
    `exit ${r.code}${hit ? ', warned' : ', NO WARNING'}`);
}

// Claim: delete this arm and the scan can leak out of the extent slots —
// literals in `pos` (every pos has them) or in a comment would warn on every
// scene ever written, and an always-on warn is one nobody reads.
{
  const r = run([BUILD, 'check', scene('leak.html',
    'const SUBJECTS={rig:{pos:t=>[Math.sin(t*1.3)*.2,3.05,0],h:rig.height, // was 3.6 once\n  w:rig.length}};')]);
  const hit = WARN.test(r.out);
  arm('pos literals and comment digits stay quiet', r.code === 0 && !hit,
    `exit ${r.code}${hit ? ', FALSE WARN' : ', quiet'}`);
}

// Claim: delete this arm and an imperative SUBJECTS can pass in silence —
// no extent scan is possible without a literal, and that absence must arrive
// as check's declared table-level substitution, not as a quiet green.
{
  const r = run([BUILD, 'check', scene('imperative.html',
    'const SUBJECTS=buildSubjects();')]);
  const declared = /SUBJECTS is declared but/.test(r.out);
  const hit = WARN.test(r.out);
  arm('imperative SUBJECTS: substitution declared, no scan', r.code === 0 && declared && !hit,
    `exit ${r.code}${declared ? ', declared' : ', UNDECLARED'}${hit ? ', phantom warn' : ''}`);
}

// The corpus arm — the red-first subject. Row 11's walker declares w:2.8 bare
// (h:6.1 beside it), so the fixture draws the warn with walker named.
// Claim: delete this arm and the fixture's extent signature can vanish — a
// corpus edit, a scan regression — while the synthetic arms above stay green.
{
  let root = __dirname, corpus = null;
  for (let i = 0; i < 6; i++) {
    const c = path.join(root, 'fixtures', 'defect-corpus', 'after-hours.html');
    if (fs.existsSync(c)) { corpus = c; break; }
    root = path.dirname(root);
  }
  if (!corpus) {
    skipped++;
    console.log('corpus arm: SKIP — fixtures/defect-corpus/ not found above this directory '
      + '(repo-only; the corpus deliberately does not ship)');
  } else {
    const r = run([BUILD, 'check', corpus]);
    const hit = WARN.test(r.out) && /walker \(h: 6\.1; w: 2\.8\)/.test(r.out);
    arm('corpus row 11: walker w:2.8 among the named sites', r.code === 0 && hit,
      `exit ${r.code}${hit ? ', warned' : ', NO WARNING'}`);
  }
}

fs.rmSync(tmp, { recursive: true, force: true });

if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — the extent-provenance warn is not `
    + `doing what its site in build.js says: either it stopped firing on a bare extent, or it `
    + `fires where no extent is. Fix the scan before trusting any green check on a 3D scene.`);
  process.exit(1);
}
console.log(`\nall ${ran} arms as specified${skipped ? ` (${skipped} skipped, stated above)` : ''}`);
