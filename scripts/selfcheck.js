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
  const build = R(path.join(TEMPLATES, 'build.js'));
  const pin = (build.match(/const THREE_PIN = '([^']+)'/) || [])[1];
  if (!pin) fail('build.js no longer declares THREE_PIN — the pin has gone back to being prose');
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
  for (const f of fs.readdirSync(TEMPLATES).filter(f => f.endsWith('.js'))) {
    for (const line of R(path.join(TEMPLATES, f)).split('\n')) {
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
  const brackets = fs.readdirSync(TEMPLATES).filter(f => /^bracket-.*\.js$/.test(f));
  if (!brackets.length) fail('no bracket-*.js found — the controls have gone missing');
  for (const b of brackets) {
    if (!/process\.exit\(1\)/.test(R(path.join(TEMPLATES, b)))) {
      fail(`${b} has no failing exit path — it cannot go red, so its green means nothing`);
    }
  }
  notes.push(`${brackets.length} brackets, each with a failing exit path (proxy: not a correctness check)`);
}

for (const n of notes) console.log('  ok   ' + n);
if (fails.length) {
  console.log('');
  for (const f of fails) console.log('  FAIL ' + f);
  console.log(`\n${fails.length} self-check failure(s)`);
  process.exit(1);
}
console.log('\nself-check: ok');
