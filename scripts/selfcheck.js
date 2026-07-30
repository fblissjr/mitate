#!/usr/bin/env bun
/* The instrument pointed at the repo's own claims.
 *
 * smoke.js checks the film. Nothing checked the claims ABOUT the film, the
 * tools, or the pins — and every defect found in the 0.16.16-0.16.20 span was
 * exactly that: an assertion nobody re-read. The console anchor whose comment
 * said "measured" (never was, broke the gate for seven releases). Rule 5's
 * repro cited as preserved (absent). SHIP_VIEWPORT's comment (contradicted the
 * code 500 lines below). CLAUDE.md naming the wrong tool for the SwiftShader
 * refusal. Two brackets that could not fail. A three pin that lived only in
 * prose.
 *
 * Prose cannot hold that line, because prose is what rotted. A check can.
 *
 * NOT in the plugin subtree on purpose: it reads CHANGELOG.md and
 * .claude-plugin/marketplace.json, which do not exist in an install cache, and
 * the subtree ships to every user. It is a repo tool. It also deliberately does
 * NOT read site/.
 *
 *   bun run scripts/selfcheck.js          # from the repo root
 *
 * No browser, no node_modules, ~instant — it belongs in CI's cheap stage beside
 * --parity-only. Exits 1 on any failure.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SUBTREE = path.join(ROOT, 'plugin', 'skills', 'mitate');
const REFS = path.join(SUBTREE, 'references');
const TEMPLATES = path.join(SUBTREE, 'templates');
const EXAMPLES = path.join(SUBTREE, 'examples');

const R = f => fs.readFileSync(f, 'utf8');
// THE pin, scraped once. build.js has no require.main guard, so requiring it as
// a library would run its CLI -- the regex is the only safe read, and doing it
// in one place keeps this file from becoming a second copy of the fact.
const threePin = (fs.readFileSync(path.join(__dirname, '..', 'plugin', 'skills',
  'mitate', 'templates', 'build.js'), 'utf8')
  .match(/const THREE_PIN = '([^']+)'/) || [])[1];
// Thresholds, named. Neither is a count of anything in the repo — one
// distinguishes a vendored library from scene code, the other bounds how far
// into a file a provenance header may sit.
const LIB_MIN_BYTES = 100000;
const HEADER_WINDOW = 2500;
const fails = [];
const notes = [];
const fail = m => fails.push(m);

/* ---- 1. version cascade coherence (CLAUDE.md invariant 2) -----------------
 * Three files must move together or `marketplace update` never reaches an
 * installed user. Nothing checked that they had. */
{
  const plugin = JSON.parse(R(path.join(ROOT, 'plugin', '.claude-plugin', 'plugin.json'))).version;
  const mkt = JSON.parse(R(path.join(ROOT, '.claude-plugin', 'marketplace.json')));
  const mktMeta = mkt.metadata.version;
  const mktPlugin = mkt.plugins.find(p => p.name === 'mitate').version;
  const heading = (R(path.join(ROOT, 'CHANGELOG.md')).match(/^## (\d+\.\d+\.\d+)/m) || [])[1];
  const all = { 'plugin.json': plugin, 'marketplace.metadata': mktMeta, 'marketplace.plugins[mitate]': mktPlugin, 'CHANGELOG newest heading': heading };
  const distinct = [...new Set(Object.values(all))];
  if (distinct.length !== 1) {
    fail('version cascade disagrees — ' + Object.entries(all).map(([k, v]) => `${k}=${v}`).join(', '));
  } else {
    notes.push(`version cascade coherent at ${distinct[0]}`);
  }
}

/* ---- 2. the three pin is one fact, and every shipped scene names it -------
 * Minification mangles three's REVISION into a getter, so a vendored scene
 * cannot be interrogated for its version after the fact. The stamp is the
 * claim; `build.js` refuses to write a wrong one. This asserts every scene
 * carries one and they all agree with the pin declared in build.js. */
{
  if (!threePin) fail('build.js no longer declares THREE_PIN — the pin has gone back to being prose');
  const pin = threePin;
  const stamp = /<!-- three (\d+\.\d+\.\d+) embedded by build\.js vendor -->/;
  for (const f of fs.readdirSync(EXAMPLES).filter(f => f.endsWith('.html'))) {
    const s = R(path.join(EXAMPLES, f));
    const embedded = new RegExp(`<script>[\\s\\S]{${LIB_MIN_BYTES},}?</script>`).test(s);
    const m = s.match(stamp);
    if (!embedded) { notes.push(`${f}: no embedded library (2D or unvendored) — stamp not required`); continue; }
    if (!m) fail(`${f} embeds a library with no version stamp — re-run build.js vendor`);
    else if (m[1] !== pin) fail(`${f} stamped three ${m[1]}, but build.js pins ${pin}`);
  }
  if (pin) notes.push(`three pin ${pin}, every embedding scene stamped and agreeing`);
}

/* ---- 2b. the pins have one home, including the EXECUTABLE copies -----------
 * `THREE_PIN` in build.js is the pin. But gate.yml `bun add`s a version too,
 * and SKILL.md tells a user to — three consumers, one fact. The CI copy is the
 * dangerous one: bump THREE_PIN alone and CI installs a version build.js will
 * refuse to vendor, while check 2 above (build.js vs embedded stamps) stays
 * green and says nothing. Phase 4 pins Rapier as well, so this generalizes
 * rather than special-cases: every pinned `pkg@version` in the CI install must
 * appear identically in SKILL.md's install command, and three must additionally
 * match the code. */
{
  const pin = threePin;
  const ci = R(path.join(ROOT, '.github', 'workflows', 'gate.yml'));
  const skill = R(path.join(SUBTREE, 'SKILL.md'));
  const pinned = [...ci.matchAll(/bun add ([^\n]+)/g)]
    .flatMap(m => m[1].split(/\s+/))
    .filter(t => /^[@\w./-]+@[\d.]+$/.test(t));
  if (!pinned.length) fail('gate.yml installs nothing pinned — did the workspace step change?');
  for (const t of pinned) {
    const [pkg, ver] = [t.slice(0, t.lastIndexOf('@')), t.slice(t.lastIndexOf('@') + 1)];
    if (!skill.includes(t)) {
      fail(`CI installs ${t} but SKILL.md's install command does not — a user and CI would `
         + `build against different versions`);
    }
    if (pkg === 'three' && pin && ver !== pin) {
      fail(`CI installs three@${ver} but build.js pins ${pin} — vendor would refuse what CI installed`);
    }
  }
  // The container tag is a FOURTH consumer of the playwright version. An image
  // shipping browsers for one playwright and a playwright-core pinned to another
  // is a version skew that presents as mysterious rendering behaviour — exactly
  // the thing the container was adopted to eliminate.
  const img = ci.match(/image:\s*mcr\.microsoft\.com\/playwright:v([\d.]+)/);
  const pw = pinned.find(t => t.startsWith('playwright-core@'));
  if (img && pw) {
    const pwVer = pw.split('@').pop();
    if (img[1] !== pwVer) {
      fail(`CI's container is playwright v${img[1]} but playwright-core is pinned ${pwVer} `
         + `— the image's browsers and the client would disagree`);
    } else {
      notes.push(`container image v${img[1]} matches the playwright-core pin`);
    }
  } else if (img && !pw) {
    fail('CI pins a playwright container image but installs no pinned playwright-core');
  }
  notes.push(`${pinned.length} pinned dependencies, agreeing across build.js, gate.yml and SKILL.md`);
}

/* ---- 3. no pointer inside the subtree escapes it (invariant 3) ------------
 * An install cache holds .claude-plugin/, README.md and skills/ — nothing else.
 * A relative link to docs/ or site/ therefore dangles for exactly the reader
 * holding it. Done by RESOLVING markdown links, not by grepping for "site/":
 * an outside audit did the grep version and reported backticked prose as broken
 * links, which is a category error. Prose may name a repo path; a LINK may not
 * leave the subtree. */
{
  const files = [];
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.md$/.test(e.name)) files.push(p);   // .md only: see note below
  });
  walk(SUBTREE);
  files.push(path.join(ROOT, 'plugin', 'README.md'));   // ships in the cache too
  let checked = 0;
  for (const f of files) {
    // Markdown links only, in markdown files only. Two exclusions, both
    // deliberate: bare prose and backticked paths are not pointers (an outside
    // audit grepped for "site/" and reported backticked prose as broken links,
    // which is the category error this avoids), and .js files are skipped
    // because `](${out})` inside a template literal that PRINTS markdown is not
    // a link either — that false positive is why this scope is narrow.
    for (const m of R(f).matchAll(/\]\(([^)#\s]+)(?:#[^)\s]*)?\)/g)) {
      const t = m[1];
      if (/^(https?:|mailto:)/.test(t)) continue;
      checked++;
      const resolved = path.resolve(path.dirname(f), t);
      const inSubtree = resolved.startsWith(SUBTREE) || resolved === path.join(ROOT, 'plugin', 'README.md');
      if (!inSubtree) {
        fail(`${path.relative(ROOT, f)} links out of the install cache: ${t} — use an absolute repo URL`);
      } else if (!fs.existsSync(resolved)) {
        fail(`${path.relative(ROOT, f)} links to a missing file: ${t}`);
      }
    }
  }
  notes.push(`${checked} relative markdown links inside the shipped subtree, all resolving`);
}

/* ---- 4. every reference carries a parseable provenance date ---------------
 * `metadata.review_interval_days` used to assert a 90-day cadence that nothing
 * enforced; it was deleted in 0.16.18 for being ambient cost. This is the
 * version that runs. Two references legitimately say they are unaudited — that
 * is an honest state, not a missing date, so it passes and is reported. */
{
  // Deliberately does NOT assert how many references there are. A hardcoded 8
  // here would be a stale claim with a timer on it — the class this whole file
  // exists to catch. Every reference is checked; the population is reported.
  const refs = fs.readdirSync(REFS).filter(f => f.endsWith('.md'));
  for (const f of refs) {
    const head = R(path.join(REFS, f)).slice(0, HEADER_WINDOW);
    if (!/>\s*\*\*Provenance\.\*\*/.test(head)) { fail(`${f} has no provenance header`); continue; }
    const dated = /\b20\d\d-\d\d-\d\d\b/.test(head);
    const admits = /not (been )?audited|UNKNOWN/i.test(head);
    if (!dated && !admits) fail(`${f} provenance names neither a date nor an unaudited state`);
    // The EDGE, and the reason this check exists rather than a schema document.
    // Every reference says what it is canonical FOR; without the negative
    // direction a reader who guessed wrong has nowhere to go, and the ownership
    // map lived only in docs/source-of-truth.md — outside the subtree, so
    // unreachable from the install cache. `grep -A1 'Not here' references/*.md`
    // is now the whole relationship graph, which is the one thing a database
    // would have bought, without the database.
    const edge = head.match(/\*\*Not here\.\*\*(.*)/);
    if (!edge) {
      fail(`${f} has no "Not here" edge — say where the adjacent thing lives`);
    } else {
      // The edge names its targets in BACKTICKS, as prose, so it cannot dangle
      // as a link out of an install cache. The cost of that choice is that
      // nothing would notice a renamed target — seven edges pointing at a ghost,
      // silently. So resolve the backticked .md names too. Presence only: this
      // cannot tell whether the target is the RIGHT owner, which is the usual
      // proxy limit — it can reject a broken edge, it cannot approve a correct one.
      for (const m of edge[1].matchAll(/`([\w.-]+\.md)`/g)) {
        if (!fs.existsSync(path.join(REFS, m[1]))) {
          fail(`${f}'s "Not here" edge points at ${m[1]}, which is not in references/`);
        }
      }
    }
  }
  notes.push(`${refs.length} references, each with a provenance header and a "Not here" edge`);
}

// templates/*.js, read ONCE. Checks 5 and 6 below both walk this directory and
// both read the bracket files; they used to do it separately, which is the same
// read-it-twice shape the parity check in smoke.js keeps a Map to avoid.
const templateJs = new Map(
  fs.readdirSync(TEMPLATES).filter(f => f.endsWith('.js'))
    .map(f => [f, R(path.join(TEMPLATES, f))]));

/* ---- 5. the measurement-assertion RATCHET --------------------------------
 * Comments in templates/*.js that assert a measurement WITHOUT naming the
 * control that backs it. Auditing them all at once is a chore that recurs; a
 * ratchet converges. The budget may go DOWN freely — lower it when you retire
 * one. It may not go up: a new "measured" comment either names a bracket or
 * replaces one that did.
 *
 * THIS FILE IS THE HOME OF THE NUMBER. It was briefly published as "41" in
 * CLAUDE.md, instruments.md and working-plan.md from a shell grep that counted
 * whole-pattern matches, controlled and uncontrolled alike; this check counts
 * uncontrolled lines and gets 46. Rather than reconcile a figure across four
 * files — the exact drift this repo keeps finding — those three now point here
 * and state no number. Measured 2026-07-29 by this check. */
// THE ONE HARDCODED COUNT IN THIS FILE, and it has to be. A ratchet needs a
// recorded high-water mark: derive this from the code and the check passes
// always and measures nothing. Every other count here is computed. Lower it
// when you retire a claim; never raise it.
const ASSERT_BUDGET = 46;
{
  // Per LINE, and only lines that do NOT name their control: a comment saying
  // "measured — see bracket-noise.js" is exactly what this wants more of, so
  // counting it as debt would punish the fix. The first run of this check
  // reported 46 against a budget of 41 because the 41 came from a coarser
  // shell grep that counted controlled and uncontrolled alike — the number is
  // defined by this check, not by that grep.
  const re = /\/\/.{0,80}?\b(measured|bracketed|confirmed|verified)\b/i;
  let n = 0;
  for (const [, text] of templateJs) {
    for (const line of text.split('\n')) {
      // A claim is CONTROLLED if it names something runnable — a bracket or
      // this self-check. The first version recognised only bracket-*.js and so
      // counted "verified by scripts/selfcheck.js" as debt, which punishes
      // exactly the thing it wants. Widened, not relaxed: the test is still
      // "does it name a control a reader can run".
      if (re.test(line) && !/(bracket-[a-z]+|selfcheck)\.js/.test(line)) n++;
    }
  }
  if (n > ASSERT_BUDGET) {
    fail(`measurement-assertions in templates/*.js rose to ${n} (budget ${ASSERT_BUDGET}). `
       + `A new "measured" comment must name a runnable bracket, or replace one that did. `
       + `Lower ASSERT_BUDGET when you retire one.`);
  } else {
    notes.push(`measurement-assertions ${n}/${ASSERT_BUDGET}${n < ASSERT_BUDGET ? ' — ratchet down: lower the budget' : ''}`);
  }
}

/* ---- 6. every bracket can fail ------------------------------------------
 * Two of three shipped brackets printed their rows and exited 0 whatever those
 * rows said, until 0.16.17. A control that cannot go red is decorative, and
 * putting one in CI buys a green that means nothing. This is a PROXY — it reads
 * for a non-zero exit path, not for correctness — and a proxy can reject, it
 * cannot approve. Running the brackets is what approves them; CI does that. */
{
  const brackets = [...templateJs.keys()].filter(f => /^bracket-.*\.js$/.test(f));
  if (!brackets.length) fail('no bracket-*.js found — the controls have gone missing');
  for (const b of brackets) {
    if (!/process\.exit\(1\)/.test(templateJs.get(b))) {
      fail(`${b} has no failing exit path — it cannot go red, so its green means nothing`);
    }
  }
  notes.push(`${brackets.length} brackets, each with a failing exit path (proxy: not a correctness check)`);
}

/* ---- 7. dated freshness markers are not older than the file ---------------
 * CLAUDE.md's Conventions section mandates a `last updated:` marker on docs and
 * plans, and CLAUDE.md itself carried a four-day-stale one — found by an audit,
 * which is the expensive way to find something a command can answer. Compares
 * each marker against the file's last commit date.
 *
 * Skipped on a shallow clone, where `git log -- <file>` reports the tip commit
 * for everything and every marker would look stale. The workflow sets
 * fetch-depth: 0 so this actually runs there.
 *
 * Timing note: this compares against the last COMMIT, so an uncommitted edit is
 * invisible until it lands — the run that catches a forgotten marker is the one
 * after the commit, i.e. CI, not a pre-commit hook. That is the correct place
 * for it to fire and not a gap to close: a marker bumped before the commit that
 * justifies it would be the same lie in the other direction. */
{
  const { execFileSync } = require('child_process');
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
  let shallow = 'true';
  try { shallow = git('rev-parse', '--is-shallow-repository'); } catch (e) {}
  // DERIVED, not listed. An earlier version named eight paths, and it had
  // already gone stale: docs/predecessor-record.md carries the marker and was
  // silently unchecked. That is the same bandaid check 4 above explicitly
  // refuses ("A hardcoded 8 here would be a stale claim with a timer on it") —
  // twelve lines away from the comment warning against it. The population is
  // whatever tracked .md actually carries the marker; the check reports the
  // count instead of asserting it.
  let marked = [];
  try {
    marked = git('ls-files', '*.md').split('\n').filter(f => {
      if (!f) return false;
      const abs = path.join(ROOT, f);
      return fs.existsSync(abs) && /^last updated:/m.test(R(abs).slice(0, 200));
    });
  } catch (e) {}
  if (shallow === 'true') {
    notes.push('freshness markers: skipped, shallow clone (needs fetch-depth: 0)');
  } else {
    let n = 0;
    for (const rel of marked) {
      const f = path.join(ROOT, rel);
      if (!fs.existsSync(f)) continue;
      const m = R(f).match(/^last updated:\s*(20\d\d-\d\d-\d\d)/m);
      if (!m) { fail(`${rel} has no "last updated:" marker`); continue; }
      // Newest commit touching the file, EXCLUDING the migration that created
      // the repo: 406d9ec moved every inherited doc in on 2026-07-24, so a file
      // authored 2026-07-23 gets a later commit date without its content having
      // changed. Found on this check's first run, against
      // docs/physics-bake-proposal.md, whose marker was correct and whose
      // failure was my check being too strict. One named historical event, not
      // a growing exemption list.
      const MIGRATION = '406d9ec';
      let committed;
      try {
        committed = git('log', '--format=%h %cs', '--', rel).split('\n')
          .filter(l => l && !l.startsWith(MIGRATION))
          .map(l => l.split(' ')[1])[0];
      } catch (e) { continue; }
      if (committed && committed > m[1]) {
        fail(`${rel} says "last updated: ${m[1]}" but was last committed ${committed}`);
      }
      n++;
    }
    notes.push(`${n} dated docs checked for marker freshness`);   // outcome is in fails, not here
  }
}

for (const n of notes) console.log('  ok   ' + n);
if (fails.length) {
  console.log('');
  for (const f of fails) console.log('  FAIL ' + f);
  console.log(`\n${fails.length} self-check failure(s)`);
  process.exit(1);
}
console.log('\nself-check: ok');
