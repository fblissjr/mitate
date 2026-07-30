#!/usr/bin/env bun
/* Bracket for the three selfcheck arms added in 0.16.31-0.16.33.
 *
 * They shipped without controls. Each was demonstrated red by hand during the
 * session that wrote it, which is not the same thing: a demonstration that
 * cannot be re-run is a claim. Review caught the gap against invariant 6 --
 * "every gate check ships with a bracket" -- and this is that bracket.
 *
 * It works by BREAKING THE TREE on purpose, one defect at a time, and asserting
 * selfcheck notices. Every fixture is removed in a finally; if this script is
 * killed mid-run, `git status` shows what to delete.
 *
 *   bun run scripts/bracket-selfcheck.js
 *
 * Not in templates/ on purpose: selfcheck.js is a repo tool that reads
 * CHANGELOG.md and marketplace.json, neither of which exists in an install
 * cache. Its control belongs beside it, not in the shipped subtree.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SELFCHECK = path.join(__dirname, 'selfcheck.js');

const run = () => {
  try { execFileSync('bun', ['run', SELFCHECK], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore','pipe','pipe'] });
        return { code: 0, out: '' }; }
  catch (e) { return { code: e.status ?? 1, out: String(e.stdout || '') + String(e.stderr || '') }; }
};

// [label, break, expected substring in the failure]. `break` returns its undo.
const ARMS = [
  ['clean tree', () => () => {}, null],

  ['bare seek before a capture', () => {
    // The pre-fix bracket-determinism.js, recovered from history: it seeked and
    // screenshotted with no readback between. That is the exact shape 0.16.28
    // measured at 40/30/20 on a slow GL stack.
    const f = path.join(__dirname, '_bracket_fixture_seek.js');
    const src = execFileSync('git', ['show', '9d2d6a6^:plugin/skills/mitate/templates/bracket-determinism.js'],
      { cwd: ROOT, encoding: 'utf8' });
    fs.writeFileSync(f, src);
    return () => fs.rmSync(f, { force: true });
  }, 'with no readback in that same call'],

  ['comment citing a file that does not exist', () => {
    const f = path.join(__dirname, '_bracket_fixture_cite.js');
    // ASSEMBLED, not written literally. A literal citation here would sit in
    // THIS file's source, where the very check under test would flag it -- and
    // did, on the first run: the control cannot itself be the defect it injects.
    const ghost = ['probe', 'that', 'never', 'existed'].join('-') + '.' + 'js';
    fs.writeFileSync(f, `// see ${ghost} for the measurement\n`);
    return () => fs.rmSync(f, { force: true });
  }, 'no such file exists in the repo'],

  ['comment citing a real name in the wrong dir', () => {
    const f = path.join(__dirname, '_bracket_fixture_wrongdir.js');
    // `backend.js` is real, at plugin/skills/mitate/templates/. Only the
    // DIRECTORY is a lie -- which a basename comparison cannot see, and which is
    // how the check shipped in 0.16.33. Assembled for the same reason as above.
    const strayed = ['totally', 'wrong', 'dir'].join('-') + '/' + 'backend.js';
    fs.writeFileSync(f, `// the backend lives in ${strayed}\n`);
    return () => fs.rmSync(f, { force: true });
  }, 'nothing tracked resolves there'],

  ['comment citing gitignored build output', () => {
    // site/films/*.html is DERIVED by stage-films.sh and gitignored, so it is
    // present on a laptop that has run a build and absent in CI. A check whose
    // accept-set is the live filesystem therefore gives two different answers to
    // the same question -- the opposite of what this file is for.
    const html = path.join(ROOT, 'site', 'films', '_bracket_fixture_derived.html');
    const f = path.join(__dirname, '_bracket_fixture_ignored.js');
    fs.writeFileSync(html, '<!-- derived, not tracked -->\n');
    fs.writeFileSync(f, `// staged from ${'site/films/'}_bracket_fixture_derived.html\n`);
    return () => { fs.rmSync(html, { force: true }); fs.rmSync(f, { force: true }); };
  }, 'is not tracked'],

  ['postmortem an index cannot read', () => {
    const dir = path.join(ROOT, 'docs', 'postmortems');
    const f = path.join(dir, '2026-01-01_session_bracket-fixture.md');
    fs.writeFileSync(f, '# no frontmatter, so the index cannot see this at all\n');
    return () => fs.rmSync(f, { force: true });
  }, 'has no frontmatter'],
];

let wrong = 0;
for (const [label, breakIt, expect] of ARMS) {
  let undo = () => {};
  let r;
  try { undo = breakIt(); r = run(); } finally { undo(); }
  const caught = r.code !== 0 && (!expect || r.out.includes(expect));
  const ok = expect ? caught : r.code === 0;
  if (!ok) wrong++;
  console.log(`${label.padEnd(38)} exit ${r.code}  -> ${expect ? (caught ? 'CAUGHT' : 'MISSED') : (r.code === 0 ? 'clean' : 'DIRTY')}`
    + (ok ? '' : `  BRACKET FAILED${expect ? ` (expected: ${expect})` : ' (tree was not clean to begin with)'}`));
}

if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — selfcheck is not catching what it`
    + ` claims to. Its green means less than it looks like. Do not trust it until this is 0.`);
  process.exit(1);
}
console.log('\nall arms as specified');
