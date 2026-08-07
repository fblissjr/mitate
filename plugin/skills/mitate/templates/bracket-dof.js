/* Bracket for STYLE.dof — the depth-of-field branch of the RIG fence's post
 * pipeline.
 *
 * WHY THIS EXISTS. STYLE.dof was documented in film-language.md and in the
 * RIG comment block of every 3D scene as a working feature, and it was dead
 * code. The fence called
 *
 *     THREE.dof(out, scenePass.getTextureNode('depth'), uFocus, maxBlur)
 *
 * against a three r185 signature that is
 *
 *     dof(node, viewZNode, focusDistance, focalLength, bokehScale)
 *
 * Two errors in one line: argument 2 must be VIEW-SPACE Z (PassNode exposes
 * getViewZNode()), not a depth texture; and argument 4 is focalLength, not a
 * "maxBlur" — r185's dof has no such parameter at any position.
 *
 * The symptom is narrower than "inert", and the distinction is the reason
 * this bracket measures what it does. Enabling STYLE.dof DOES change the
 * frame: it applies a uniform, barely-perceptible softening with no depth
 * falloff. What it does not do is respond to its parameter — identical bytes
 * at maxBlur .016/.10/1.0, and identical again at focalLength 0.8 vs 400.0, a
 * 500x sweep. A depth texture in the viewZ slot saturates the circle of
 * confusion everywhere at once, so the knob has nothing left to move. "Is
 * there an effect" therefore CANNOT discriminate the bug; only "does the
 * parameter do anything" can, which is why the arms are parameter sweeps.
 *
 * It failed SILENTLY, which is the reason a bracket and not a bug report:
 * no page error, smoke green, STYLE.dof truthy, THREE.dof a function, and
 * uFocus correctly tracking the solver's shotFocus. Every input was right and
 * the output never moved. Nothing caught it for the same reason it survived:
 * no scene in the corpus had ever enabled STYLE.dof, so the branch was never
 * entered outside the authoring of the line itself. film-language.md said as
 * much — "Nothing shipped here enables STYLE.dof yet, bracket before trusting
 * a look to it" — which is a warning that only pays off if somebody runs the
 * bracket.
 *
 * WHAT IT MEASURES. Not "is there blur", which needs an eye. The falsifiable
 * property is RESPONSIVENESS: a post effect that is wired up changes the
 * frame when you change its parameter, and one that is inert does not. Every
 * arm below is a byte comparison between two renders of the same t, so the
 * arms hold on any backend and need no reference image.
 *
 * Execute, don't mirror (controls.md): the arms drive the REAL build.js
 * against a REAL corpus scene with dof injected into its STYLE. Nothing here
 * reimplements the pipeline, so a fence that drifts is caught rather than
 * modelled.
 *
 *   NODE_PATH="$PWD/node_modules" \
 *     bun run "${CLAUDE_SKILL_DIR}"/templates/bracket-dof.js
 *
 * Invoke it FROM a working directory that has three and playwright-core, as
 * with every browser bracket here: the fixture resolves beside this script,
 * the dependencies do not.
 *
 * MEASURED by bracket-dof.js itself against the pre-fix fence (gearbox,
 * t=8.0, WEBGPU unset), and the run is the reason this block is not a
 * prediction: an earlier draft of this header asserted that two arms would go
 * red, and only ONE did.
 *
 *   parameter is live        9bebe068 vs 9bebe068  same    RED — the defect
 *   dof changes the frame    8d13783f vs 9bebe068  differ  green, see below
 *   dof off is unaffected    8d13783f vs 8d13783f  same    green
 *   corpus render unchanged  8d13783f vs 8d13783f  same    green
 *
 * ONE red arm, which satisfies invariant 6, and the arm that did not go red
 * is worth keeping for a stated reason rather than deleting as decorative:
 * "dof changes the frame" cannot discriminate the defect (it passes broken
 * and fixed alike), but it is what stops the fix from being bought by
 * applying dof unconditionally — a change that made the parameter live by
 * blurring every scene that never declared dof would satisfy arm 1 and fail
 * arms 3 and 4. Arms 2-4 are the blast radius; arm 1 is the claim.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// The corpus lives at the repo root (the plugin ships no films). Brackets are
// repo controls: they ship as dev tooling but run from a checkout, where four
// levels up from templates/ IS the repo root.
const SCENE = path.join(__dirname, '..', '..', '..', '..', 'scenes', 'gearbox.html');
const HERE = __dirname;
const AT = '8.0';                       // mid-film, geometry at several depths

// gearbox picks its bible on one line; appending to STYLE right after it runs
// before the pipeline is constructed, which is when `if(STYLE.dof)` is read.
const ANCHOR = 'const STYLE = BIBLES.workshop;';

// Injected as focalLength/bokehScale — the parameters r185 actually has. A
// SMALL focalLength is a shallow depth of field (things go out of focus close
// to the plane); a very large one is effectively everything in focus. If the
// branch is live, those two cannot render the same bytes.
const withDof = (fl) => (s) => s.replace(ANCHOR,
  `${ANCHOR} STYLE.dof={focalLength:${fl},bokehScale:3};`, 1);

const env = { ...process.env };
delete env.WEBGPU;                      // pin the fallback path, as every bracket here does
if (!env.NODE_PATH) env.NODE_PATH = path.join(process.cwd(), 'node_modules');

const src = fs.readFileSync(SCENE, 'utf8');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-dof-'));

/* Render one variant and hash the frame. A patched fixture legitimately
 * diverges from the canonical store, so it takes the documented exit:
 * neutralize its fence markers and leave the parity set. Without this every
 * mutated arm would trip carrier-vs-store parity and go red for a reason it
 * does not measure. */
function renderHash(tag, patch) {
  const body = patch ? patch(src) : src;
  if (patch && body === src) return { err: 'injection point not found (scene drifted)' };
  const name = tag.replace(/\W+/g, '_') + '.html';
  const fixture = patch
    ? body.replace(/==== ([A-Z]+)-(START|END) ====/g, '=OFF= $1 $2 =OFF=')
    : body;
  fs.writeFileSync(path.join(dir, name), fixture);
  try {
    execFileSync('bun', ['run', path.join(HERE, 'build.js'), 'poster', name, AT],
                 { cwd: dir, env, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    return { err: ((e.stdout || '') + (e.stderr || '')).split('\n').filter(Boolean).slice(-3).join(' | ') };
  }
  const jpg = path.join(dir, name.replace(/\.html$/, '.jpg'));
  if (!fs.existsSync(jpg)) return { err: 'poster produced no file' };
  return { sha: crypto.createHash('sha256').update(fs.readFileSync(jpg)).digest('hex').slice(0, 16) };
}

/* [tag, variantA, variantB, expected]
 * expected 'differ'  — the two renders MUST NOT be byte-identical
 * expected 'same'    — the two renders MUST be byte-identical            */
const CASES = [
  // THE TWO RED-FIRST ARMS. Both are identical against the broken fence.
  ['parameter is live',       withDof('0.8'), withDof('400.0'), 'differ'],
  ['dof changes the frame',   null,           withDof('0.8'),   'differ'],
  // THE TWO THAT MUST STAY GREEN. These are what stop the fix from being
  // bought by applying dof to everything: a scene that never declared it must
  // render exactly as it did, and must not acquire a parameter it never set.
  ['dof off is unaffected',   null,           s => s.replace(ANCHOR, `${ANCHOR} STYLE.notDof={focalLength:0.8};`, 1), 'same'],
  ['corpus render unchanged', null,           null,             'same'],
];

let wrong = 0;
try {
  for (const [tag, a, b, expected] of CASES) {
    const ra = renderHash(tag + '_a', a);
    const rb = renderHash(tag + '_b', b);
    if (ra.err || rb.err) {
      console.log(`${tag.padEnd(26)} SKIPPED — ${ra.err || rb.err}`);
      wrong++;
      continue;
    }
    const verdict = ra.sha === rb.sha ? 'same' : 'differ';
    const ok = verdict === expected;
    if (!ok) wrong++;
    console.log(`${tag.padEnd(26)} ${ra.sha} vs ${rb.sha}`
              + ` -> ${verdict.padEnd(6)} expected=${expected.padEnd(6)}`
              + ` ${ok ? 'OK' : 'BRACKET FAILED'}`);
  }
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}

if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — STYLE.dof is not doing what`
            + ` the RIG fence and film-language.md claim. Do not trust a scene's declared`
            + ` depth of field until this is 0.`);
  process.exit(1);
}
console.log(`\nall ${CASES.length} arms as specified`);
