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
    // mkdir FIRST, and it is belt to site/films/.gitkeep's braces rather than a
    // duplicate of it: the tracked .gitkeep is what makes the directory survive
    // a clone, this covers the case where it has been removed (which is exactly
    // how this arm gets tested). Before that .gitkeep existed, git stored no
    // empty directory here and a fresh checkout had no site/films/ at all --
    // this arm died with ENOENT the first time CI ever ran it, so the arm
    // written to catch an environment-dependent accept-set was itself
    // environment-dependent, passing locally only because a previous
    // stage-films.sh run had left the directory behind.
    const films = path.join(ROOT, 'site', 'films');
    const html = path.join(films, '_bracket_fixture_derived.html');
    const f = path.join(__dirname, '_bracket_fixture_ignored.js');
    fs.mkdirSync(films, { recursive: true });
    fs.writeFileSync(html, '<!-- derived, not tracked -->\n');
    fs.writeFileSync(f, `// staged from ${'site/films/'}_bracket_fixture_derived.html\n`);
    return () => { fs.rmSync(html, { force: true }); fs.rmSync(f, { force: true }); };
  }, 'is not tracked'],

  // CLAUDE.md's prime directive admits ONE exception -- `build.js probe` reads
  // scene-specific expressions -- on three conditions it calls "all currently
  // true and all checkable". Nothing checked them, so the exception could lapse
  // in silence, which is the one way a bent rule becomes a gone rule. Both arms
  // use a FIXTURE, never build.js: mutating a shipped 1.14 MB artifact to test a
  // rule about it is the trade this repo just removed from bracket-stage-films.
  // ASSEMBLED, like the citation arm above and for the same reason: a literal
  // `function probe(){ writeFileSync(...) }` sitting in THIS file's source IS the
  // defect, and check 6f scans scripts/*.js -- so writing the fixture plainly
  // makes the control fail on itself. It did, on the first run.
  ['a probe instrument that writes', () => {
    const f = path.join(__dirname, '_bracket_fixture_probew.js');
    const head = ['async', 'function', 'probe'].join(' ') + '(scene, when, exprs) {';
    const bad = 'fs.' + 'writeFileSync' + '("out.json", "{}");';
    fs.writeFileSync(f, `${head}\n  ${bad}\n}\n${'probe'}(1, 2, 3);\n`);
    return () => fs.rmSync(f, { force: true });
  }, 'must only READ'],

  ['a probe instrument with a second caller', () => {
    const f = path.join(__dirname, '_bracket_fixture_probec.js');
    const head = ['async', 'function', 'probe'].join(' ') + '(scene, when, exprs) {';
    fs.writeFileSync(f, `${head}\n  return 1;\n}\n`
      + `function bundle(t) { return ${'probe'}(t, 0, []); }\n${'probe'}(1, 2, 3);\n`);
    return () => fs.rmSync(f, { force: true });
  }, 'call site'],

  // install-hooks.sh refuses to overwrite a DIFFERING hook without --force,
  // which is correct — it must not clobber a hand-edited one. The consequence
  // is that a hook installed before a command changed runs the old command
  // forever and nothing says so. Not hypothetical: every machine that installed
  // before 0.16.45 was still running the two-glob parity command after a NINTH
  // carrier joined, so the hook gated commits on one directory less than it
  // claimed — including on the machine where this arm was written.
  ['a stale installed pre-commit hook', () => {
    const hook = path.join(ROOT, '.git', 'hooks', 'pre-commit.local');
    const had = fs.existsSync(hook) ? fs.readFileSync(hook, 'utf8') : null;
    // DERIVED from the generator, never written literally: a fixture that
    // restates the hook body would drift away from the thing it imitates and
    // start testing a shape that no longer exists. This reproduces the actual
    // historical staleness — drop the third glob, and the line-continuation
    // backslash that preceded it, which is byte-for-byte the old hook.
    const gen = fs.readFileSync(path.join(__dirname, 'install-hooks.sh'), 'utf8');
    // [^\n]* because the heredoc line carries `|| true` after the delimiter.
    const body = (gen.match(/<<'HOOK_BODY'[^\n]*\n([\s\S]*?)\nHOOK_BODY/) || [])[1];
    const stale = body.split('\n')
      .filter(l => !l.includes('fixtures/defect-corpus'))
      .join('\n').replace(/ \\\n$/, '\n').replace(/ \\$/, '');
    fs.mkdirSync(path.dirname(hook), { recursive: true });
    fs.writeFileSync(hook, stale + '\n');
    fs.chmodSync(hook, 0o755);
    return () => {
      if (had === null) fs.rmSync(hook, { force: true });
      else { fs.writeFileSync(hook, had); fs.chmodSync(hook, 0o755); }
    };
  }, 'STALE copy'],

  // The Map's completeness claim, which prose could not hold: a review found two
  // directories missing and auditing the rest found five more. This arm adds a
  // top-level entry and asserts the Map notices it is unlisted.
  //
  // `git add -N` (intent-to-add), because check 9 reads `git ls-files` — an
  // untracked file is invisible to it, so a plain writeFileSync fixture would
  // pass while proving nothing. Intent-to-add records a path with no content and
  // touches no other staged work, and the undo removes exactly that path.
  ['a top-level entry the Map does not name', () => {
    const name = '_bracket_fixture_unmapped';
    const f = path.join(ROOT, name);
    fs.writeFileSync(f, 'fixture\n');
    execFileSync('git', ['add', '-N', '--', name], { cwd: ROOT });
    return () => {
      try { execFileSync('git', ['rm', '--cached', '--force', '--quiet', '--', name], { cwd: ROOT }); }
      catch (e) {}
      fs.rmSync(f, { force: true });
    };
  }, 'never names'],

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
