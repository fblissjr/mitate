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
 * It writes into site/films/ (gitignored build output) and, for the guard arm,
 * temporarily edits the tracked example, restoring the original bytes in a
 * finally. If this is killed mid-run, `git status` shows the example as modified
 * and `git checkout` restores it.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(__dirname, 'stage-films.sh');
const FILMS = path.join(ROOT, 'site', 'films');
const GEARBOX = path.join(ROOT, 'plugin', 'skills', 'mitate', 'examples', 'gearbox.html');
const NEON = path.join(FILMS, 'gearbox-neon.html');
const BIBLE_LINE = 'const STYLE = BIBLES.workshop;';

const run = () => {
  try { execFileSync('bash', [SCRIPT], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
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
    fs.writeFileSync(stale, '<!-- an example that no longer exists -->\n');
    const r = run();
    ok = r.code === 0 && !fs.existsSync(stale);
    detail = `exit ${r.code}, stale file ${fs.existsSync(stale) ? 'SURVIVED' : 'cleared'}`;
  } finally { fs.rmSync(stale, { force: true }); }
  check('stale film from a previous build cleared', ok, detail);
}

// ---- arm 3: the guard fires, and leaves nothing stale behind ----------------
// The failure this brackets is not "the guard exits 1" alone -- it is that an
// exit-1 run must not leave the PREVIOUS neon in place. Arm 1 has already
// produced one, so its survival here would be exactly the defect.
{
  const original = fs.readFileSync(GEARBOX, 'utf8');
  let ok, detail;
  try {
    if (!original.includes(BIBLE_LINE)) {
      ok = false; detail = 'gearbox.html no longer contains the line this arm moves — arm is inert';
    } else {
      fs.writeFileSync(GEARBOX, original.replace(BIBLE_LINE, 'const STYLE = BIBLES["workshop"];'));
      const r = run();
      const survived = fs.existsSync(NEON);
      ok = r.code !== 0 && r.out.includes('no longer selects its bible') && !survived;
      detail = `exit ${r.code}, neon ${survived ? 'SURVIVED (stale)' : 'absent'}`;
    }
  } finally { fs.writeFileSync(GEARBOX, original); }
  check('bible line moved: guard fires, neon not left stale', ok, detail);
}

// Leave the tree in the state a build would: the arms above ran the script with
// a broken example last, so films/ is missing the variant the site expects.
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
