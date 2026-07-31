#!/usr/bin/env bun
/* Bracket for scripts/stage-films.sh.
 *
 * The script carries a GUARD -- it refuses to derive gearbox-neon.html if the
 * bible line it edits has moved -- and a guard with no control is a claim. This
 * proves the guard fires, and proves the thing 0.16.37 fixed: a run that aborts
 * must not leave the previous derivation behind, because a stale film is
 * indistinguishable from a fresh one by looking at it.
 *
 *   bun run scripts/bracket-stage-films.js
 *
 * NOTHING TRACKED IS EVER WRITTEN. The guard arm used to rewrite the real 1.14 MB
 * gearbox.html and restore it in a finally, which put a shipped artifact at risk
 * to control a script that only serves the website — the examples are the
 * product, the site is a showcase of it, and that is the wrong way round. It now
 * points stage-films.sh at a throwaway fixture via MITATE_EXAMPLES/MITATE_FILMS.
 * The clean-run arm still uses the real corpus, read-only.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(__dirname, 'stage-films.sh');
const FILMS = path.join(ROOT, 'site', 'films');
const NEON = path.join(FILMS, 'gearbox-neon.html');
const BIBLE_LINE = 'const STYLE = BIBLES.workshop;';
// Fixture root for the guard arm. Under site/ so it lands in gitignored
// territory even if a run is killed before the finally.
const FIX = path.join(FILMS, '_bracket_fixture');

const run = (env) => {
  try { execFileSync('bash', [SCRIPT], { cwd: ROOT, encoding: 'utf8',
          env: { ...process.env, ...(env || {}) }, stdio: ['ignore','pipe','pipe'] });
        return { code: 0, out: '' }; }
  catch (e) { return { code: e.status ?? 1, out: String(e.stdout || '') + String(e.stderr || '') }; }
};

const results = [];
const check = (label, ok, detail) => { results.push([label, ok, detail]); };

// ---- arm 1: a clean run derives the variant, and it differs by ONE line -----
{
  const r = run();
  let detail = `exit ${r.code}`;
  let ok = r.code === 0 && fs.existsSync(NEON);
  if (ok) {
    const a = fs.readFileSync(path.join(FILMS, 'gearbox.html'), 'utf8').split('\n');
    const b = fs.readFileSync(NEON, 'utf8').split('\n');
    const diff = a.length !== b.length ? -1 : a.filter((l, i) => l !== b[i]).length;
    ok = diff === 1;
    detail += `, ${diff} line(s) differ from gearbox.html`;
  } else {
    detail += ', neon absent';
  }
  check('clean run derives neon, one line apart', ok, detail);
}

// ---- arm 2: output from a previous build does not survive ------------------
// The whole films/ directory is regenerated, so an example DELETED from the
// skill must vanish from the site too. Before 0.16.37 nothing removed it.
{
  const stale = path.join(FILMS, '_bracket_stale_film.html');
  let ok, detail;
  try {
    // Explicit, not inherited from arm 1 having run stage-films.sh already.
    // site/films/.gitkeep keeps the directory across a clone; this covers its
    // removal. Depending on arm ORDERING for a directory's existence is the
    // latent form of how the sibling bracket died in CI.
    fs.mkdirSync(FILMS, { recursive: true });
    fs.writeFileSync(stale, '<!-- an example that no longer exists -->\n');
    const r = run();
    ok = r.code === 0 && !fs.existsSync(stale);
    detail = `exit ${r.code}, stale file ${fs.existsSync(stale) ? 'SURVIVED' : 'cleared'}`;
  } finally { fs.rmSync(stale, { force: true }); }
  check('stale film from a previous build cleared', ok, detail);
}

// ---- arm 3: the guard fires, and leaves nothing stale behind ----------------
// The failure this brackets is not "the guard exits 1" alone -- it is that an
// exit-1 run must not leave the PREVIOUS neon in place, since a stale film is
// indistinguishable from a fresh one by looking at it.
//
// ENTIRELY ON A FIXTURE. Two runs against a throwaway examples dir: the first
// carries the bible line and must produce a neon, the second does not and must
// fail while REMOVING the neon the first produced. That sequencing is what makes
// "not left stale" a real assertion rather than a coincidence, and it is why the
// old version reached for the tracked example -- it needed a prior good run.
// A fixture supplies one for a few hundred bytes instead of 1.14 MB of product.
{
  let ok, detail;
  const exDir = path.join(FIX, 'examples'), filmDir = path.join(FIX, 'films');
  const env = { MITATE_EXAMPLES: exDir, MITATE_FILMS: filmDir };
  const fixNeon = path.join(filmDir, 'gearbox-neon.html');
  try {
    fs.mkdirSync(exDir, { recursive: true }); fs.mkdirSync(filmDir, { recursive: true });
    fs.writeFileSync(path.join(exDir, 'gearbox.html'), `<!-- fixture -->\n${BIBLE_LINE}\n`);
    const good = run(env);
    const seeded = fs.existsSync(fixNeon);

    fs.writeFileSync(path.join(exDir, 'gearbox.html'), '<!-- fixture -->\nconst STYLE = BIBLES["workshop"];\n');
    const r = run(env);
    const survived = fs.existsSync(fixNeon);

    ok = good.code === 0 && seeded
      && r.code !== 0 && r.out.includes('no longer selects its bible') && !survived;
    detail = `seed exit ${good.code} (neon ${seeded ? 'made' : 'MISSING'}), `
           + `guard exit ${r.code}, neon ${survived ? 'SURVIVED (stale)' : 'absent'}`;
  } finally { fs.rmSync(FIX, { recursive: true, force: true }); }
  check('bible line moved: guard fires, neon not left stale', ok, detail);
}

// Leave films/ as a build would. Arm 2 ran against the real corpus, so this is
// belt-and-braces rather than repair -- the fixture arm never touched it.
run();

let wrong = 0;
for (const [label, ok, detail] of results) {
  if (!ok) wrong++;
  console.log(`${label.padEnd(46)} ${detail}${ok ? '' : '   BRACKET FAILED'}`);
}
if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — stage-films.sh is not doing what its`
    + ` header claims. A stale film looks exactly like a fresh one; do not trust a preview until this is 0.`);
  process.exit(1);
}
console.log('\nall arms as specified');
