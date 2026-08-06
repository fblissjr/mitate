/* Bracket for the CHECK-vs-KIT AGREEMENT — REP2's gate, kept running.
 *
 * `build.js check` derives its semantics from the canonical fence store (the
 * same KERNEL and SOLVER the kit is built from), so a defect the kit refuses
 * from inputs `check` can actually read must fail `check` statically AND fail
 * a DRIVEN page, with the same message. The scope qualifier is load-bearing:
 * an input beyond the literal reader (a STYLE assembled from a bible) is a
 * place agreement cannot be promised, and the adversarial review proved it
 * with a green check on a scene the page refuses. Before REP2 the two
 * disagreed in both directions and nothing compared them:
 * `check` passed what the solver throws on (a missing `size`, an empty SHOTS,
 * `subject: []`) and the kit silently accepted what `check` errors on (a shot
 * anchored to a prototype-named beat resolved BEAT['toString'] to an inherited
 * function and rendered NaN spans). Those four cases are the 2026-08-02
 * review's divergence list. Each arm here runs BOTH instruments on one
 * fixture: the refusal arms require the same verdict carrying the same phrase
 * — the "resolve identically in check and in a driven page" gate, made a
 * control instead of a stamp — and the stand-in arm requires the divergence
 * DECLARED in check's own output, because where identity is unachievable the
 * achievable property is honesty.
 *
 * The pristine arm is the negative control: an unmodified copy of the real
 * scene must pass `check` AND drive to a poster, or every refusal arm above it
 * could be satisfied by a harness that fails everything.
 *
 *   cd <a workspace with three + playwright-core installed>
 *   NODE_PATH="$PWD/node_modules" bun run "${CLAUDE_SKILL_DIR}"/templates/bracket-check-kit.js
 *
 * Fixtures are MUTATED FROM THE REAL SCENE, not hand-written, and the mutation
 * throws when its target string is gone — an unmutated copy would make an arm
 * assert nothing (same discipline as bracket-commands.js, same reason).
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD = path.join(__dirname, 'build.js');
// The corpus lives at the repo root (the plugin ships no films). Brackets are
// repo controls: they ship as dev tooling but run from a checkout, where four
// levels up from templates/ IS the repo root.
const SCENES = path.join(__dirname, '..', '..', '..', '..', 'scenes');
// The cheapest real 3D scene in the corpus — one shot, real solver traffic.
const SOURCE = path.join(SCENES, 'noise-chart.html');

// The same anchor strings bracket-commands.js mutates; both files throw when
// the scene stops carrying them, so drift is loud in whichever runs first.
const SHOT = "  {at:['title',0], subject:'chart', size:'FS', angle:0, elev:0},";
const LIT_SHOTS = "const SHOTS=[\n  {at:['title',0], subject:'chart', size:'FS', angle:0, elev:0},\n].map(sh=>({...sh,t:beatAt(sh.at[0],sh.at[1])}));";

// [label, mutation pairs | null, phrase]
//   null mutation    = the pristine control (check ok + poster written).
//   phrase (string)  = the substring BOTH verdicts must carry on a refusal. One
//                      phrase, two instruments: that identity IS the claim.
//   phrase (object)  = a DECLARED divergence: {check, driven}. check must exit
//                      0 carrying phrase.check, the driven page must refuse
//                      carrying phrase.driven. Agreement is not achievable on
//                      these — check's stand-in cannot know what it stands in
//                      for — so what this arm pins is honesty: the substitution
//                      is said in the verdict, never silent.
const CASES = [
  ['pristine scene: check ok and page drives', null, null],
  // The kit throws 'unknown size: undefined' in solveShot on the first driven
  // frame; check must reach the same refusal without a browser.
  ['missing size fails both, same phrase',
    [[SHOT, "  {at:['title',0], subject:'chart', angle:0, elev:0},"]],
    'unknown size'],
  // Pre-guard the driven page died on an unhelpful TypeError (SHOTS[0] of an
  // empty list) and check iterated nothing and printed green.
  ['empty SHOTS fails both, same phrase',
    [[LIT_SHOTS, "const SHOTS=[\n].map(sh=>({...sh,t:beatAt(sh.at[0],sh.at[1])}));"]],
    'SHOTS is empty'],
  // Pre-guard subjectExtent([]) built an Infinity box, the camera went NaN,
  // and the page reached sceneReady rendering nothing — a silent blank film.
  ['empty subject fails both, same phrase',
    [[SHOT, "  {at:['title',0], subject:[], size:'FS', angle:0, elev:0},"]],
    'at least one subject'],
  // BEAT['toString'] used to find Object.prototype.toString, so beat() never
  // threw and every span was NaN — the kit ACCEPTING what check refuses.
  ['prototype-named beat fails both, same phrase',
    [[SHOT, "  {at:['toString',0], subject:'chart', size:'FS', angle:0, elev:0},"]],
    'unknown beat'],
  // The largest of the adversarial pass's three silent-substitution findings:
  // a STYLE assembled from a bible is beyond check's literal reader, so its
  // solver ran against a quiet `{}` whose lens default (42) satisfied a match
  // cut the scene's real lens (35 here) makes the page refuse at boot — same
  // fence code, two verdicts, GREEN on the broken one. The fix is not
  // agreement (the stand-in cannot know the lens): check must SAY the
  // stand-in whenever shots carry `match`/`fov`, and this arm pins the saying.
  ['non-literal STYLE: check declares its stand-in, page refuses',
    [["const STYLE = {", "const STYLE_BASE = {\n  lens: 35,"],
     ["/* ---------- CONFIG:", "const STYLE = STYLE_BASE;\n\n/* ---------- CONFIG:"],
     [SHOT, SHOT + "\n  {at:['mxrow',0], subject:'chart', size:'FS', angle:0, elev:0, match:true, fov:42},"]],
    { check: 'empty stand-in', driven: 'match cut into SHOTS[1]' }],
];

const run = argv => {
  try {
    const out = execFileSync('bun', ['run', BUILD, ...argv],
      { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { code: 0, out };
  } catch (e) {
    return { code: e.status ?? 1, out: String(e.stdout || '') + String(e.stderr || '') };
  }
};

// Inside the workspace, not os.tmpdir(): build.js resolves three and
// playwright from the workspace the scene is being built in.
const work = fs.mkdtempSync(path.join(process.cwd(), '.mitate-checkkit-'));
let wrong = 0, ran = 0;
try {
  for (const [label, pairs, phrase] of CASES) {
    const fixture = path.join(work, label.replace(/[^a-z]+/g, '-') + '.html');
    let src = fs.readFileSync(SOURCE, 'utf8');
    for (const [from, to] of pairs || []) {
      if (!src.includes(from)) {
        throw new Error(`bracket-check-kit: fixture "${label}" cannot be built — `
          + `${path.basename(SOURCE)} no longer contains:\n  ${from}\n`
          + `Repoint the mutation; an unmutated copy would make its arm assert nothing.`);
      }
      src = src.split(from).join(to);
    }
    fs.writeFileSync(fixture, src);

    const chk = run(['check', fixture]);
    const drv = run(['poster', fixture, '0', '160']);
    let ok, why;
    if (!pairs) {
      const poster = fixture.replace(/\.html$/, '.jpg');
      ok = chk.code === 0 && /check: ok/.test(chk.out)
        && drv.code === 0 && fs.existsSync(poster);
      why = `check exit ${chk.code}, poster exit ${drv.code}`;
    } else if (phrase && typeof phrase === 'object') {
      const chkOk = chk.code === 0 && chk.out.includes(phrase.check);
      const drvOk = drv.code !== 0 && drv.out.includes(phrase.driven);
      ok = chkOk && drvOk;
      why = `check exit ${chk.code}${chkOk ? '' : ` MISSING "${phrase.check}"`}`
          + `, driven exit ${drv.code}${drvOk ? '' : ` MISSING "${phrase.driven}"`}`;
    } else {
      const chkOk = chk.code !== 0 && chk.out.includes(phrase);
      const drvOk = drv.code !== 0 && drv.out.includes(phrase);
      ok = chkOk && drvOk;
      why = `check exit ${chk.code}${chkOk ? '' : ` MISSING "${phrase}"`}`
          + `, driven exit ${drv.code}${drvOk ? '' : ` MISSING "${phrase}"`}`;
    }
    ran++;
    if (!ok) wrong++;
    console.log(`${label.padEnd(52)} ${why}${ok ? '' : '  BRACKET FAILED'}`);
  }
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}

if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — check and the kit disagree `
    + `about at least one refusal, which is the divergence class REP2 exists to close. `
    + `Do not trust a green \`check\` on a scene the kit would refuse until this is 0.`);
  process.exit(1);
}
console.log(`\nall ${ran} arms as specified`);
