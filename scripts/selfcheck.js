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
const PLUGIN_ROOT = path.join(ROOT, 'plugin');
const SUBTREE = path.join(ROOT, 'plugin', 'skills', 'mitate');
const REFS = path.join(SUBTREE, 'references');
const TEMPLATES = path.join(SUBTREE, 'templates');
const EXAMPLES = path.join(SUBTREE, 'examples');

const R = f => fs.readFileSync(f, 'utf8');
// ONE directory walk. There were two, written a session apart for checks 3 and
// 6d, differing only in what they collected and what they skipped -- which is
// the same duplicate-with-a-small-difference shape this file exists to catch,
// in this file.
const SKIP = /^(\.git|node_modules|internal)$/;
const walkFiles = (dir, onFile) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.test(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, onFile); else onFile(p, e.name);
  }
};
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

/* ---- 3. no pointer inside SHIPPED content escapes it (invariant 3) --------
 * An install cache holds what is under plugin/ and nothing else -- as of
 * 0.16.32 that is .claude-plugin/, README.md, skills/ AND agents/. A relative
 * link to docs/ or site/ therefore dangles for exactly the reader holding it. Done by RESOLVING markdown links, not by grepping for "site/":
 * an outside audit did the grep version and reported backticked prose as broken
 * links, which is a category error. Prose may name a repo path; a LINK may not
 * leave the subtree. */
{
  const files = [];
  // EVERYTHING under plugin/ ships, not just skills/. This walked the skill
  // subtree plus one hardcoded README until 0.16.32, when plugin/agents/ was
  // added and would have been a shipped directory whose links nothing resolved.
  // Walking the plugin root instead means the next shipped directory is covered
  // the day it exists rather than the day someone remembers this check.
  walkFiles(PLUGIN_ROOT, (p, n) => { if (/\.md$/.test(n)) files.push(p); });   // .md only: see note below
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
      const inSubtree = resolved.startsWith(PLUGIN_ROOT);
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
  // SKILL.md carries one too, as of 0.16.34. It used to carry
  // `metadata.last_verified` instead: frontmatter, so standing context cost on
  // every activation, asserting a HUMAN review, going stale on every edit, and
  // checked by nothing -- it was four days and two releases stale when removed.
  // The provenance form is per-file, records what was verified against what, and
  // is checked here. It is exempt from the "Not here" edge below: that edge maps
  // ownership BETWEEN references, and SKILL.md is the router, not a peer.
  const SKILL_MD = path.join(SUBTREE, 'SKILL.md');
  {
    const head = R(SKILL_MD).slice(0, HEADER_WINDOW);
    if (!/>\s*\*\*Provenance\.\*\*/.test(head)) fail('SKILL.md has no provenance header');
    else if (!/\b20\d\d-\d\d-\d\d\b/.test(head)) fail('SKILL.md provenance names no date');
    // Scoped to the FRONTMATTER, not the whole head. The first version grepped
    // the head for the string and fired on the provenance header immediately
    // below, which explains why the field was removed -- a check that cannot
    // tell carrying a field from describing one, which is the same
    // false-accusation shape as the two seek-check specs before it.
    const fm = (R(SKILL_MD).match(/^---\n([\s\S]*?)\n---/) || [])[1] || '';
    if (/^\s*last_verified:/m.test(fm)) {
      fail('SKILL.md still carries metadata.last_verified — removed in 0.16.34 as an '
         + 'unenforced claim in always-loaded frontmatter; use the provenance header');
    }
  }
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
const ASSERT_BUDGET = 51;
{
  // Per LINE, and only lines that do NOT name their control: a comment saying
  // "measured — see bracket-noise.js" is exactly what this wants more of, so
  // counting it as debt would punish the fix. The first run of this check
  // reported 46 against a budget of 41 because the 41 came from a coarser
  // shell grep that counted controlled and uncontrolled alike — the number is
  // defined by this check, not by that grep.
  // BLOCK COMMENTS COUNT AS OF 0.16.37. The scan was `//`-only, and this file's
  // biggest neighbours (build.js, smoke.js) carry their heaviest prose in `/* */`
  // headers -- so the ratchet was blind to exactly where a "measured" claim is
  // most likely to be written. Found by reading, then walked into: two new block
  // claims landed in build.js's probe docstring in the very session that found
  // the hole. Review caught them.
  //
  // The budget MOVED UP, once, and only because the measurement changed
  // DEFINITION -- 46 `//` lines became 52 across both comment forms. That is a
  // re-baseline, not a rise, and it is the only kind permitted: widening what is
  // counted is not the same as tolerating more debt. From here it may fall and
  // never rise.
  const re = /(?:\/\/|^\s*\*).{0,80}?\b(measured|bracketed|confirmed|verified)\b/i;
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

/* ---- 6b. tool JS, read once -------------------------------------------- */
const toolJs = new Map([
  ...templateJs,
  ...fs.readdirSync(__dirname).filter(f => f.endsWith('.js'))
    .map(f => ['scripts/' + f, R(path.join(__dirname, f))]),
]);

/* ---- 6c. no bare seek before a capture ------------------------------------
 * 0.16.28 measured a bare `evaluate('window.seekTo(t)')` followed by a capture
 * at 40/30/20 percent byte-differences on ubuntu-22.04/WebGL2, against 0 of 200
 * once the seek and a GPU readback shared one page task. backend.js's seekSynced
 * is that fix. It did not reach every consumer: bracket-determinism.js still
 * bare-seeked through 0.16.29, passing while exercising a pattern nothing ships.
 *
 * SPEC'D ON THE PATTERN, NOT THE IMPORT, and the difference is the whole check.
 * The obvious version -- "requires backend.js and screenshots but never calls
 * seekSynced" -- condemns scripts/diagnose-determinism.js, which is CORRECT: its
 * gridAt seeks and reads back in one evaluate, and it cannot delegate to
 * seekSynced because there the completion barrier and the diagnostic payload are
 * the same readback. A check whose first act is to condemn a correct file is
 * worse than no check. So: does this evaluate seek AND read pixels back? */
{
  // THE SPEC TOOK THREE TRIES AND THE FIRST TWO WERE WRONG, which is recorded
  // because the wrong ones look reasonable:
  //   1. "requires backend.js, screenshots, never calls seekSynced" — condemns
  //      diagnose-determinism.js, which is correct.
  //   2. "any evaluate that seeks without reading back" — condemns
  //      bracket-liveplay.js (it wraps seekTo to COUNT calls, never captures)
  //      and sample-determinism.js's control arm. Forbidding the control that
  //      proves the fix works is worse than not checking at all.
  // What is actually wrong is narrower: a bare seek WHOSE RESULT IS CAPTURED.
  // Hence the window: an evaluate that seeks, a .screenshot() within six lines,
  // and no readback between them. Measured against the pre-fix
  // bracket-determinism.js, which it catches, and against the tree, which is
  // clean but for one declared control.
  // SAME TASK, not "a readback appears nearby". backend.js's seekSynced comment
  // is explicit about the mechanism: the drawing buffer is cleared after
  // compositing, so a readback in a LATER task reads zeros and synchronises
  // nothing. Review caught that the first version tested `/getImageData/` against
  // raw window text, which would exempt a seek whose readback sat in a SEPARATE
  // evaluate -- a pattern that does not fix the race at all. So the body is now
  // extracted per call with a balanced-paren scan, and the readback must be in it.
  const evaluateSites = text => {
    const out = [];
    const re = /\.evaluate\(/g;
    let m;
    while ((m = re.exec(text))) {
      let i = m.index + m[0].length, depth = 1;
      while (i < text.length && depth > 0) {
        if (text[i] === '(') depth++; else if (text[i] === ')') depth--;
        i++;
      }
      if (depth !== 0) continue;
      out.push({
        body: text.slice(m.index + m[0].length, i - 1),
        line: text.slice(0, m.index).split('\n').length,
        endLine: text.slice(0, i).split('\n').length,
      });
    }
    return out;
  };
  // WINDOW is a heuristic and cannot be made exact -- that is stated rather than
  // hidden, because the note below would otherwise read as a guarantee it does
  // not give. 8 lines, chosen to cover the widest real gap in the tree
  // (sample-determinism's control arm: seek at 145, capture at 151) rather than
  // by taste. A capture further from its seek than this is not caught.
  //
  // KNOWN FALSE-POSITIVE SHAPE, do not "fix" by widening further: smoke.js's
  // sampleAt seeks and then interpolates `reader.toString()` into the SAME
  // evaluate, so its readback exists at runtime and is invisible to any static
  // scan. Widening until that trips is how this check starts condemning correct
  // code, which it did twice during development.
  const WINDOW = 8;
  const OPT_OUT = /selfcheck: bare-seek-is-the-control/;
  const LOOKBACK = 6;   // a declaration sits ABOVE the line it excuses
  let bare = 0, flagged = 0;
  for (const [name, text] of toolJs) {
    const lines = text.split('\n');
    for (const site of evaluateSites(text)) {
      if (!/window\.seekTo/.test(site.body)) continue;
      if (/getImageData/.test(site.body)) continue;          // synced, same task
      bare++;
      const after = lines.slice(site.endLine, site.endLine + WINDOW).join('\n');
      if (!/\.screenshot\(/.test(after)) continue;            // seek is not captured
      flagged++;
      // site.line is 1-indexed; `lines` is 0-indexed. Converting explicitly
      // rather than folding the -1 into the constant: the first version used
      // `site.line - 6` and started the slice one line PAST the marker, which
      // read as a missing declaration rather than an off-by-one.
      const from = Math.max(0, (site.line - 1) - LOOKBACK);
      if (OPT_OUT.test(lines.slice(from, site.endLine + WINDOW).join('\n'))) continue;
      fail(`${name}:${site.line} seeks in a page.evaluate with no readback in that same `
         + `call, and captures within ${WINDOW} lines — the race measured at 40/30/20 on a `
         + `slow GL stack, 0 of 200 once seek and readback shared a task. Use seekSynced. `
         + `If the bare seek IS the control, say so on the line.`);
    }
  }
  notes.push(`${bare} bare seeks scanned, ${flagged} of them captured within ${WINDOW} lines `
    + `— all synced or declared (a capture further than ${WINDOW} lines from its seek is not seen)`);
}

/* ---- 6d. a comment may not cite a file that does not exist ----------------
 * The boundary every claim-defect in this repo has crossed: a comment may assert
 * what its own line does; it may not assert what another file does. The
 * unfalsifiable half of that is decidable, so it gets a check.
 *
 * Caught, had it existed: a shipped example pointing at a probe tool that has
 * never existed in ANY generation of this project (both frozen predecessors
 * grepped), cited as the provenance for the one constant that makes its gag
 * land; and build.js naming a docs path belonging to a different repo. Both read
 * as evidence and were not. */
{
  // TWO NARROW PATTERNS, chosen by measurement rather than by taste. The broad
  // version -- any `\w+\.(js|md|html)` token in a comment -- was written first
  // and reported 46 failures, of which 45 were `scene.html`, `template.html` and
  // `three.js`: usage-string placeholders and a library's name. Precision is
  // what separates a gate from noise, so it was narrowed until the hits were
  // explicable, and the two that survive are exactly the shapes that went wrong.
  //
  //   PATHY -- a token containing a slash. Placeholders never do.
  //   PROV  -- a bare filename in a citation frame (see X, recorded in X).
  //            A "see <tool>" frame is a provenance claim; a usage line like
  //            "bun run smoke.js scene.html" is not.
  const PATHY = /\b[\w][\w.-]*(?:\/[\w.-]+)+\.(?:js|md|html|json|yml|sh)\b/g;
  const PROV = /\b(?:see|per|recorded in|preserved in|cited in|documented in)\s+`?([\w][\w.-]*\.(?:js|md|html|json|yml|sh))`?/gi;
  // Upstream paths inside a dependency, which a comment may legitimately name
  // and this repo will never contain. One entry, and it earned it: three dropped
  // its UMD build after 0.160, which is why build.js explains the vendoring.
  const EXTERNAL_OK = new Set(['build/three.min.js']);
  const present = new Set();
  walkFiles(ROOT, (_, name) => present.add(name));
  const commentRe = /(?:\/\/|\*|#).*/g;
  let cited = 0;
  const flag = (name, tok) => {
    cited++;
    if (present.has(path.basename(tok)) || EXTERNAL_OK.has(tok)) return;
    fail(`${name} cites \`${tok}\` in a comment and no such file exists in the repo. `
       + `A comment may name a rule; it may not cite a path its reader cannot reach.`);
  };
  // SCENE HTML IS IN SCOPE AS OF 0.16.32, and the order was deliberate: it
  // carried the live instance -- bear-and-bees cited a probe.js that has never
  // existed, as the provenance for the constant its gag depends on. Widening
  // the check before shipping `probe` would have meant a standing exemption for
  // a known-bad line, which is how a ratchet rots. `probe` shipped, the constant
  // was re-derived and now measures -0.32/-0.76/-1.06, and the scope follows.
  //
  // LONG LINES SKIPPED: an example embeds ~1 MB of minified three, whose license
  // banners and single-line bodies are not authored comments. 500 chars keeps
  // every hand-written line (the widest authored line in the corpus is far under
  // it) and drops the bundle. The counts are REPORTED below rather than written
  // here: this file's own rule is that a number a command produces does not get
  // hand-written, and a frozen figure would go stale the next time an example
  // lands with nothing to catch it. Review flagged that it was written here.
  const MINIFIED_LINE = 500;
  const sceneHtml = [];
  for (const d of [TEMPLATES, EXAMPLES]) {
    for (const f of fs.readdirSync(d).filter(x => x.endsWith('.html'))) {
      sceneHtml.push([path.relative(ROOT, path.join(d, f)), R(path.join(d, f))]);
    }
  }
  let skipped = 0, scanned = 0;
  const sources = [
    ...[...toolJs].map(([n, t]) => [n, t.split('\n')]),
    ...sceneHtml.map(([n, t]) => {
      const all = t.split('\n');
      const keep = all.filter(l => l.length <= MINIFIED_LINE);
      skipped += all.length - keep.length; scanned += keep.length;
      return [n, keep];
    }),
  ];
  for (const [name, lines] of sources) {
    for (const raw of lines) {
      for (const line of raw.match(commentRe) || []) {
        for (const tok of line.match(PATHY) || []) flag(name, tok);
        let m; PROV.lastIndex = 0;
        while ((m = PROV.exec(line))) flag(name, m[1]);
      }
    }
  }
  notes.push(`${cited} cited paths in tool and scene comments, all resolving `
    + `(scene HTML: ${scanned} lines scanned, ${skipped} minified lines skipped)`);
}

/* ---- 6e. tracked postmortems are readable by the thing that indexes them ---
 * NOT an existence check on `artifacts:`, which is what the plan specified and
 * which would have been wrong. A postmortem is a DATED RECORD: its citations are
 * historical by nature, and one here legitimately names a reference that was
 * renamed since. Failing the build when a cited file is later moved would punish
 * exactly the archival value that tracking these is for.
 *
 * What is decidable and does not rot is whether the file can be READ by the
 * index that makes a corpus of postmortems navigable. The 2026-07-25 record had
 * no frontmatter at all and was invisible to it, which is the real failure and
 * the one worth a gate. */
{
  const PM = path.join(ROOT, 'docs', 'postmortems');
  const REQUIRED = ['mode', 'scope', 'date', 'summary', 'artifacts'];
  const NAME = /^(\d{4}-\d\d-\d\d)_(session|span|feature)_[a-z0-9-]+\.md$/;
  let n = 0;
  if (fs.existsSync(PM)) {
    for (const f of fs.readdirSync(PM).filter(x => x.endsWith('.md'))) {
      n++;
      const m = f.match(NAME);
      if (!m) {
        fail(`docs/postmortems/${f} is not named YYYY-MM-DD_<session|span|feature>_<slug>.md `
           + `— date first so the listing sorts chronologically`);
        continue;
      }
      const head = R(path.join(PM, f)).slice(0, HEADER_WINDOW);
      if (!/^---\n/.test(head)) {
        fail(`docs/postmortems/${f} has no frontmatter — the index cannot see it, `
           + `which is how one of these sat unlisted for five days`);
        continue;
      }
      const fm = head.slice(4, head.indexOf('\n---', 4));
      for (const k of REQUIRED) {
        if (!new RegExp(`^${k}:`, 'm').test(fm)) fail(`docs/postmortems/${f} frontmatter has no \`${k}:\``);
      }
      const d = (fm.match(/^date:\s*(\d{4}-\d\d-\d\d)/m) || [])[1];
      if (d && d !== m[1]) fail(`docs/postmortems/${f} says date: ${d} but its filename says ${m[1]}`);
      const mode = (fm.match(/^mode:\s*(\w+)/m) || [])[1];
      if (mode && mode !== m[2]) fail(`docs/postmortems/${f} says mode: ${mode} but its filename says ${m[2]}`);
    }
  }
  notes.push(`${n} tracked postmortems, each indexable (frontmatter + name agree)`);
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
