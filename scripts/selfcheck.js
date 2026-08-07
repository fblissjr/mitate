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
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const PLUGIN_ROOT = path.join(ROOT, 'plugin');
const SUBTREE = path.join(ROOT, 'plugin', 'skills', 'mitate');
const REFS = path.join(SUBTREE, 'references');
const TEMPLATES = path.join(SUBTREE, 'templates');
const SCENES = path.join(ROOT, 'scenes');

const R = f => fs.readFileSync(f, 'utf8');
// ONE directory walk. There were two, written a session apart for checks 3 and
// 6d, differing only in what they collected and what they skipped -- which is
// the same duplicate-with-a-small-difference shape this file exists to catch,
// in this file.
// .archive is in SKIP by owner rule (2026-08-04): archived means withdrawn
// from the record, so no check may read it — and it is gitignored, so reading
// it would also make an accept-set environment-dependent, the defect the
// staged-films arm documents.
const SKIP = /^(\.git|node_modules|internal|\.archive)$/;
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
  // Scans the tracked corpus at scenes/ — the plugin ships no films, so that
  // is where every embedding scene lives. This scan pointed at the shipped
  // examples dir until the corpus moved out, which silently narrowed it to the
  // one film left behind; deriving the set from the corpus home fixes the
  // narrowing and survives the next move.
  for (const f of fs.readdirSync(SCENES).filter(f => f.endsWith('.html'))) {
    const s = R(path.join(SCENES, f));
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
  // sample.yml is a FIFTH consumer and was unchecked until 2026-08-07: it
  // installs playwright-core for the determinism sampler, so bumping the pin
  // everywhere else left it silently a version behind — and a sampler running a
  // different browser than the gate is measuring a different thing while
  // reporting in the same units. Checked by the same rule rather than a second
  // one: every pinned token it installs must match gate.yml's.
  const sampleCi = R(path.join(ROOT, '.github', 'workflows', 'sample.yml'));
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
  {
    const samplePinned = [...sampleCi.matchAll(/bun add ([^\n]+)/g)]
      .flatMap(m => m[1].split(/\s+/))
      .filter(t => /^[@\w./-]+@[\d.]+$/.test(t));
    if (!samplePinned.length) fail('sample.yml installs nothing pinned — did its workspace step change?');
    for (const t of samplePinned) {
      const pkg = t.slice(0, t.lastIndexOf('@'));
      const gateSame = pinned.find(g => g.slice(0, g.lastIndexOf('@')) === pkg);
      if (gateSame && gateSame !== t) {
        fail(`sample.yml installs ${t} but gate.yml installs ${gateSame} — the sampler and the `
           + `gate would measure determinism on different browsers`);
      }
    }
    // THE VERDICT STATES ITS SCOPE. A pin sample.yml installs that gate.yml
    // does not is compared against nothing, and a note reading "N pin(s) agree"
    // would cover that silently — the same shape as check 7's dropped
    // population, one file away. Name the uncompared ones instead: this check
    // can reject a skew, it cannot approve a package only one workflow has.
    const unmatched = samplePinned.filter(t =>
      !pinned.some(g => g.slice(0, g.lastIndexOf('@')) === t.slice(0, t.lastIndexOf('@'))));
    if (samplePinned.length) {
      notes.push(`sample.yml: ${samplePinned.length - unmatched.length} pin(s) agree with gate.yml`
        + (unmatched.length ? `, ${unmatched.length} not in gate.yml so uncompared (${unmatched.join(', ')})` : ''));
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

/* ---- 4. shipped markdown is date-free current state, with routing edges ---
 * INVERTED at 0.22.0, owner rule: everything under plugin/ is loaded or read
 * by agents using the skill, and they only care about what is true NOW — a
 * date or an amendment note in a shipped file is history riding along in
 * context. This check used to REQUIRE a dated provenance header in SKILL.md
 * and every reference; the verification record those headers carried moved to
 * docs/shipped-provenance.md, and the check now fails on any ISO date in any
 * markdown under plugin/. Walks the filesystem rather than git ls-files, so a
 * scratch .md with a date is caught before it is ever staged.
 *
 * The "Not here" edge requirement SURVIVES — it is routing, not history: every
 * reference says what it is canonical for, and without the negative direction
 * a reader who guessed wrong has nowhere to go. `grep -A1 'Not here'
 * references/*.md` is still the whole ownership graph. */
{
  const mdUnder = (dir) => {
    const out = [];
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) out.push(...mdUnder(p));
      else if (e.name.endsWith('.md')) out.push(p);
    }
    return out;
  };
  const shippedMd = mdUnder(path.join(ROOT, 'plugin'));
  for (const f of shippedMd) {
    const rel = path.relative(ROOT, f);
    const lines = R(f).split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/\b20\d\d-\d\d-\d\d\b/.test(lines[i])) {
        fail(`${rel}:${i + 1} carries a dated annotation — shipped markdown is `
           + `current-state only; the verification record lives in `
           + `docs/shipped-provenance.md and history lives in git`);
      }
    }
  }
  // Deliberately does NOT assert how many references there are. A hardcoded 8
  // here would be a stale claim with a timer on it — the class this whole file
  // exists to catch. Every reference is checked; the population is reported.
  const refs = fs.readdirSync(REFS).filter(f => f.endsWith('.md'));
  for (const f of refs) {
    const head = R(path.join(REFS, f)).slice(0, HEADER_WINDOW);
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
  notes.push(`${shippedMd.length} shipped markdown files date-free; `
    + `${refs.length} references, each with a "Not here" edge`);
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
/* ---- 6b. tool JS, read once. ORDERED BEFORE check 6 because the bracket
 * census below is over both directories, and reading scripts/ twice to keep the
 * old numbering would be the duplicate this file exists to catch. */
const toolJs = new Map([
  ...templateJs,
  ...fs.readdirSync(__dirname).filter(f => f.endsWith('.js'))
    .map(f => ['scripts/' + f, R(path.join(__dirname, f))]),
]);

{
  // BOTH DIRECTORIES. The census read templates/ only, which was true when every
  // bracket lived there and silently false afterwards: bracket-selfcheck.js sat
  // in scripts/ uncounted here and unrun by any workflow, so the one control over
  // the repo's own claim-checker was invisible to the check that exists to notice
  // exactly that. Matched on basename, since a scripts/ key carries its directory.
  const brackets = [...toolJs.keys()].filter(f => /^bracket-.*\.js$/.test(path.posix.basename(f)));
  if (!brackets.length) fail('no bracket-*.js found — the controls have gone missing');
  for (const b of brackets) {
    if (!/process\.exit\(1\)/.test(toolJs.get(b))) {
      fail(`${b} has no failing exit path — it cannot go red, so its green means nothing`);
    }
  }
  notes.push(`${brackets.length} brackets, each with a failing exit path (proxy: not a correctness check)`);
}

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
  //
  // The lookbehind excludes word characters but deliberately NOT `/`. Excluding
  // `/` was tried and dropped four real citations: the bracket usage lines read
  // `"${CLAUDE_SKILL_DIR}"/templates/bracket-noise.js`, whose checkable part
  // begins right after a slash. A tightening that silently narrows what a check
  // sees is the failure this file exists to prevent, so it was measured both
  // ways. The optional leading dot is what lets `.claude-plugin/marketplace.json`
  // be resolved as the path it is rather than as a dotless near-miss.
  const PATHY = /(?<![\w.-])\.?[\w][\w.-]*(?:\/[\w.-]+)+\.(?:js|md|html|json|yml|sh)\b/g;
  const PROV = /\b(?:see|per|recorded in|preserved in|cited in|documented in)\s+`?([\w][\w.-]*\.(?:js|md|html|json|yml|sh))`?/gi;
  // Upstream paths inside a dependency, which a comment may legitimately name
  // and this repo will never contain. One entry, and it earned it: three dropped
  // its UMD build after 0.160, which is why build.js explains the vendoring.
  const EXTERNAL_OK = new Set(['build/three.min.js']);
  // THE ACCEPT-SET IS WHAT GIT TRACKS, not what the disk holds. Two defects, one
  // cause -- the first version walked the live filesystem and compared BASENAMES:
  //
  //   * A citation naming a real file under an invented directory passed, because
  //     the basename existed somewhere. Only the directory was a lie, and a
  //     basename comparison cannot see one. (The fixture is assembled in
  //     bracket-selfcheck.js rather than written here, because a literal example
  //     of a bad citation IS one, and this check flagged this very comment.)
  //   * The staged film copies under the site directory are derived output and
  //     gitignored, so they are on a laptop that has built and absent in CI. The
  //     check answered the same question two ways depending on where it ran.
  //
  // `--others --exclude-standard` keeps a file you have just written and not yet
  // staged in the set, so writing a comment and its target in one change does not
  // fail on the way past; build output stays out because it is ignored.
  const tracked = new Set(execFileSync('git',
    ['ls-files', '--cached', '--others', '--exclude-standard'],
    { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean));
  const names = new Set([...tracked].map(p => path.posix.basename(p)));
  // Two bases, because both are real shapes in the corpus and both are how a
  // reader would follow the pointer: repo-root-relative from a repo tool
  // (`docs/source-of-truth.md`), and subtree-relative from inside the shipped
  // subtree (`references/method.md`), where a reader holds only that subtree.
  const SUBTREE_REL = path.relative(ROOT, SUBTREE).split(path.sep).join('/');
  const commentRe = /(?:\/\/|\*|#).*/g;
  let cited = 0;
  const flag = (name, tok) => {
    cited++;
    if (EXTERNAL_OK.has(tok)) return;
    if (!tok.includes('/')) {                       // PROV: a bare filename
      if (names.has(tok)) return;
      fail(`${name} cites \`${tok}\` in a comment and no such file exists in the repo. `
         + `A comment may name a rule; it may not cite a path its reader cannot reach.`);
      return;
    }
    const tries = [tok, `${SUBTREE_REL}/${tok}`];
    if (tries.some(p => tracked.has(p))) return;
    const onDisk = tries.find(p => fs.existsSync(path.join(ROOT, p)));
    fail(onDisk
      ? `${name} cites \`${tok}\`, which exists at \`${onDisk}\` but is not tracked. `
        + `Derived output is present on one machine and absent on another; a comment may not rest on it.`
      : `${name} cites \`${tok}\` in a comment and nothing tracked resolves there `
        + `(tried the repo root and the shipped subtree). A comment may name a rule; `
        + `it may not cite a path its reader cannot reach.`);
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
  for (const d of [TEMPLATES, SCENES]) {
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

/* ---- 6f. the ONE exception to the prime directive has not quietly lapsed ----
 * CLAUDE.md admits `build.js probe` past "tooling talks only to the window
 * contract", because measuring a contact requires naming the two things being
 * measured. It admits it on three conditions and calls them "all currently true
 * and all checkable" -- and then nothing checked them, which is how a bent rule
 * becomes a gone rule. Two of the three are mechanical and are checked here;
 * "runs at authoring time" is not decidable from source and is carried by the
 * third (nothing in an artifact pipeline can invoke it).
 *
 * Written over every tool file rather than over build.js by name, so a probe
 * copied into a second tool inherits the same rule, and so the bracket can
 * exercise it with a fixture instead of mutating a shipped artifact. */
{
  // Deliberately broad: anything that spawns, writes, or removes. A probe that
  // shells out is not read-only however careful the command looks.
  const WRITES = /\b(writeFileSync|appendFileSync|mkdirSync|rmSync|unlinkSync|createWriteStream|execFileSync|spawnSync|execSync)\s*\(/;
  // COMMENTS STRIPPED FIRST, and this is not a nicety: build.js has a comment
  // reading "a step-halving probe(" as ordinary prose, which the first version
  // counted as a second call site and reported the exception lapsed. A checker
  // that reads prose as code produces exactly the false accusation this file
  // exists to prevent -- the third time that shape has appeared here.
  const stripComments = s => s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
  let probes = 0;
  for (const [name, raw] of toolJs) {
    const text = stripComments(raw);
    const def = /(?:async\s+)?function\s+probe\s*\(/.exec(text);
    if (!def) continue;
    probes++;
    // Balanced-brace extraction from the definition's opening brace, the same
    // shape check 6c uses for evaluate() -- a regex to the next `}` would stop
    // at the first nested block and read almost nothing.
    let i = text.indexOf('{', def.index + def[0].length - 1), depth = 0, end = -1;
    for (let j = i; j < text.length && i >= 0; j++) {
      if (text[j] === '{') depth++;
      else if (text[j] === '}' && --depth === 0) { end = j; break; }
    }
    const body = end > 0 ? text.slice(i, end) : '';
    const w = body.match(WRITES);
    if (w) {
      fail(`${name}: \`probe\` calls ${w[1]} — the prime directive admits this instrument `
         + `ONLY because it must only READ (CLAUDE.md). Writing from it lapses the exception.`);
    }
    // Call sites excluding the definition. Exactly one is expected: the CLI
    // dispatch. A second means some other verb reaches through it, which is the
    // "in no pipeline that produces an artifact" condition failing.
    const calls = [...text.matchAll(/\bprobe\s*\(/g)]
      .filter(m => m.index !== def.index && !/function\s+$/.test(text.slice(0, m.index)));
    if (calls.length > 1) {
      fail(`${name}: \`probe\` has ${calls.length} call sites; the exception holds only while it `
         + `is in no pipeline that produces an artifact, i.e. the CLI dispatch and nothing else.`);
    }
  }
  // The same condition from the other side: nothing automated may invoke it.
  const WF = path.join(ROOT, '.github', 'workflows');
  const auto = [
    ...fs.readdirSync(WF).map(f => [`.github/workflows/${f}`, R(path.join(WF, f))]),
    ['scripts/install-hooks.sh', R(path.join(__dirname, 'install-hooks.sh'))],
  ];
  for (const [name, text] of auto) {
    if (/build\.js\s+probe\b/.test(text)) {
      fail(`${name} invokes \`build.js probe\` — an authoring instrument in an automated `
         + `pipeline. That is the condition CLAUDE.md says lapses the exception.`);
    }
  }
  if (!probes) fail('no `probe` instrument found — check 6f is guarding nothing');
  notes.push(`${probes} probe instrument, read-only and single-call-site (the prime directive's one exception)`);
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
  const strayMarkers = [];
  try {
    marked = git('ls-files', '*.md').split('\n').filter(f => {
      if (!f) return false;
      const abs = path.join(ROOT, f);
      if (!fs.existsSync(abs)) return false;
      // STRIP YAML FRONTMATTER BEFORE THE WINDOW. The 200-char window says
      // "near the top", which is the right intent and was the wrong
      // implementation: a file whose frontmatter is longer than 200 chars
      // pushes its marker outside the window, so the file drops out of the
      // POPULATION and is never checked. Silent, because a file that is not in
      // the set cannot fail — the count just comes back one lower and nothing
      // says which one is missing. Found 2026-08-07: two repo skills carry
      // markers at bytes 578 and 614 (a long frontmatter `description:` is
      // what a skill needs to trigger correctly), and `extract-patterns` had
      // gone unchecked since it was written. Demonstrated by setting its
      // marker to 2020-01-01 against a 2026-08-05 commit and watching
      // selfcheck stay green.
      const raw = R(abs);
      const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
      if (/^last updated:/m.test(body.slice(0, 200))) return true;
      // NO SILENT DROPS. Stripping frontmatter fixed the case that bit, and
      // left the CLASS intact: a marker below the window still vanishes from
      // the population with nothing said, which is how two skills went
      // unchecked for a week. A file that carries a marker somewhere but not
      // where this check reads is now a failure rather than an absence — the
      // window stays narrow (a marker belongs at the top) and being outside it
      // is loud instead of silent.
      if (/^last updated:/m.test(raw)) strayMarkers.push(f);
      return false;
    });
  } catch (e) {}
  for (const rel of strayMarkers) {
    fail(`${rel} carries a "last updated:" marker outside the window this check reads, so its `
       + `freshness would go unverified — move the marker to the top of the file, directly `
       + `after any frontmatter`);
  }
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

/* ---- 8. the installed pre-commit hook still matches its generator ----------
 * install-hooks.sh REFUSES to overwrite a differing hook without --force, which
 * is right: it must not clobber one someone edited on purpose. The consequence
 * is that a hook installed before a command changed keeps running the OLD
 * command forever, and nothing said so — the installer only speaks when you run
 * it, and the whole point of a hook is that you never run it again.
 *
 * Live instance, and the reason this check exists: `fixtures/defect-corpus/`
 * became a ninth parity carrier in 0.16.45 and the generator gained a third
 * glob. Every machine that had installed before that kept gating commits on the
 * two-glob command — checking one directory less than the message it printed
 * claimed. It was found by reading the hook, not by any check.
 *
 * SKIPPED when no hook is installed. CI has none and that is not a defect; the
 * note says so out loud rather than leaving a silent pass. `.git/hooks` is also
 * absent-by-indirection in a linked worktree, which lands in the same branch.
 *
 * The expected body is EXTRACTED from install-hooks.sh, never restated here. A
 * second copy of the hook body in this file is precisely the duplicate this
 * file exists to catch, and it would rot the same way. Compared trimmed: the
 * generator writes with `printf '%s\n'`, so trailing-newline count is an
 * artifact of the writer, not a difference in what the hook runs.
 *
 * The no-heredoc branch is NOT bracketed, and deliberately so: an arm for it
 * would have to mutate the tracked install-hooks.sh in place, which is the
 * shipped-artifact hazard this repo just removed from another bracket. It is
 * fail-CLOSED — it can only produce a red, never a false green — so what it
 * risks is a nuisance, not a silent hole. Mutation-tested: neutralising the
 * comparison above kills the arm in bracket-selfcheck.js; neutralising this
 * branch does not, which is the honest reading of its coverage. */
{
  const hookPath = path.join(ROOT, '.git', 'hooks', 'pre-commit.local');
  let installed = null;
  try { installed = R(hookPath); } catch (e) {}
  if (installed === null) {
    notes.push('no pre-commit.local installed — nothing to compare (CI has none; run '
             + './scripts/install-hooks.sh to get one)');
  } else {
    const gen = R(path.join(__dirname, 'install-hooks.sh'));
    // [^\n]* because the heredoc line carries `|| true` after the delimiter.
    const m = gen.match(/<<'HOOK_BODY'[^\n]*\n([\s\S]*?)\nHOOK_BODY/);
    if (!m) {
      fail('scripts/install-hooks.sh has no readable HOOK_BODY heredoc, so the installed hook '
         + 'cannot be checked against it — the generator changed shape and this check went blind');
    } else if (installed.trim() !== m[1].trim()) {
      fail('.git/hooks/pre-commit.local is a STALE copy — it differs from what '
         + 'scripts/install-hooks.sh generates, so every commit it gates is checked against an '
         + 'older command than the one in the tree. Diff it, then run '
         + './scripts/install-hooks.sh --force');
    } else {
      notes.push('installed pre-commit.local matches its generator');
    }
  }
}

/* ---- 9. CLAUDE.md's Map covers every tracked top-level entry --------------
 * The Map states that it covers "everything outside `docs/`", on the stated
 * reasoning that anything absent from a map is unreachable in practice. That is
 * a completeness claim, and nothing checked it.
 *
 * It was wrong. A review caught two directories a branch had added; auditing the
 * rest of the claim found five more entries never listed at all. Seven misses in
 * one file is not carelessness, it is the wrong instrument — a claim of
 * completeness maintained by remembering to update it will drift every time
 * someone adds a directory, which is precisely when nobody is thinking about
 * this file.
 *
 * NO EXEMPTION LIST, deliberately. An exemption list is the same prose problem
 * one level down: it grows a line each time this fails and eventually exempts
 * the thing that mattered. If an entry is too minor to name, it can share a
 * bullet with its neighbours — that costs one clause and keeps the rule total.
 *
 * Substring match, because the Map names things in prose (`site/`, `README.md`,
 * `.claude/agents/...`) rather than in a list. That accepts a bit less than it
 * could: naming `.claude/agents/` satisfies `.claude`. Deliberate — the check is
 * "is there a way in from here", not "is the description good". */
{
  const mapSection = (R(path.join(ROOT, 'CLAUDE.md'))
    .match(/^## Map$([\s\S]*?)^## /m) || [])[1];
  if (!mapSection) {
    fail('CLAUDE.md has no "## Map" section — the front door lost its map, and this check '
       + 'cannot verify a claim that is no longer there');
  } else {
    const top = new Set(execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
      .split('\n').filter(Boolean).map(f => f.split('/')[0]));
    const missing = [...top].filter(e => !mapSection.includes(e)).sort();
    if (missing.length) {
      fail(`CLAUDE.md's Map claims to cover everything outside docs/ but never names: `
         + `${missing.join(', ')}. Add a bullet, or share one with a neighbour — an entry `
         + `absent from the map is unreachable in practice, which is the Map's own argument`);
    } else {
      notes.push(`${top.size} tracked top-level entries, each named in CLAUDE.md's Map`);
    }
  }
}

/* ---- 10. the encoder boundary only shrinks (Track E0) ---------------------
 * Which functions may shell out to ffmpeg/avifenc/img2webp, pinned per function
 * and allowed to fall but never rise. Same idiom as the measurement-assertion
 * ratchet above and the probe single-call-site rule: a number the repo drives
 * toward zero, with the current value stated rather than a target asserted.
 *
 * WHY IT COMES BEFORE THE MIGRATION IT SERVES. Track E's whole claim is that an
 * agent should be able to build and review a scene with bun and a browser and
 * nothing else — so "what is export?" has to stop being a judgment call. Once
 * this list has ratcheted down, export is whatever is still inside it, and each
 * migration is a line deleted here rather than an assertion in prose.
 *
 * Seeded at the honest baseline (ten sites, eight functions), NOT at a target.
 * `motion` is in the list and stays for now: it is a measurement rather than an
 * export, but migrating it needs a recalibration that this check does not.
 *
 * THE ESCAPE HATCH IS THE SAME ONE ASSERT_BUDGET USES, deliberately, rather
 * than a second mechanism: a legitimate new export verb edits this literal, in a
 * diff, with a reason. The budget above moved up exactly once in its life and
 * only because the measurement changed definition. That is the bar.
 *
 * LIMIT, stated because a check whose blind spot is undocumented gets trusted
 * past it: this matches a LITERAL binary name in a call expression. An encoder
 * reached through a variable would not be seen. That is not a hole worth
 * closing with a parser — indirection to dodge a boundary check is visible in
 * review in a way a forgotten call site is not. */
{
  const ENCODER_BUDGET = {
    video: 1, shootAndScale: 1, avif: 1, loop: 1,          // export — the four that stay
    motion: 1,                                             // measurement — needs recalibration
    // RATCHETED 10 -> 5 by Track E1: poster, aspectSheet, sheet (x2) and strip
    // moved to build.js's in-page tiler. Those five lines are deleted rather
    // than zeroed, so re-adding an encoder to any of them trips the
    // outside-the-boundary arm instead of quietly fitting under a stale budget.
    //
    // THAT FIGURE READ 6 UNTIL 2026-08-02, against a table of five entries, a
    // migration commit saying "10 call sites across 9 functions -> 5 across 5",
    // and a run printing 5. It was also inconsistent with its own next sentence,
    // which names five removals from ten. Nothing caught it for eleven versions:
    // check 12 scans bracket-*.js only, and check 13's REGISTRY holds six
    // countables, none of them encoder sites. So the one stale hand-written
    // count in this file sat between the two checks built to stop stale
    // hand-written counts, in the blind spot they share. Prefer deriving it:
    // `Object.keys(ENCODER_BUDGET).length` is the honest form, and the only
    // reason it stays prose is that the ARROW is history rather than state.
  };
  const ENCODERS = /\b(?:run|execFileSync|spawnSync|spawn)\(\s*['"](?:ffmpeg|avifenc|img2webp)['"]/;
  const DECL = /^(?:async\s+)?function\s+([A-Za-z0-9_]+)|^const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(/;
  const found = {};
  for (const [rel, text] of toolJs) {
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      // Comment-only lines are not call sites, and this is scoping rather than
      // relaxation: the subject is what EXECUTES. It is also not theoretical —
      // the first run of this check was tripped by a comment in its own bracket
      // describing the pattern it scans for. A trailing comment after real code
      // still matches, because that line does execute. Residual limit: a line
      // inside a block comment that starts with neither marker is not skipped.
      const t = line.trim();
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
      if (!ENCODERS.test(line)) return;
      let fn = `${rel}:top-level`;
      for (let j = i; j >= 0; j--) {
        const m = lines[j].match(DECL);
        if (m) { fn = m[1] || m[2]; break; }
      }
      found[fn] = (found[fn] || 0) + 1;
    });
  }
  const outside = Object.keys(found).filter(f => !(f in ENCODER_BUDGET)).sort();
  const over = Object.keys(found).filter(f => f in ENCODER_BUDGET && found[f] > ENCODER_BUDGET[f]);
  const under = Object.keys(ENCODER_BUDGET).filter(f => (found[f] || 0) < ENCODER_BUDGET[f]);
  if (outside.length) {
    fail(`encoder call outside the pinned boundary, in: ${outside.join(', ')}. Track E exists to `
       + `SHRINK this set — an encoder in a new function is the review loop growing a dependency `
       + `it is supposed to be losing. If this is a deliberate new export verb, add it to `
       + `ENCODER_BUDGET with a reason, the way ASSERT_BUDGET is moved`);
  }
  if (over.length) {
    fail(`more encoder calls than pinned in: ${over.map(f => `${f} (${found[f]} > ${ENCODER_BUDGET[f]})`).join(', ')}`);
  }
  if (under.length) {
    fail(`encoder budget is now too generous for: ${under.map(f => `${f} (${found[f] || 0} < ${ENCODER_BUDGET[f]})`).join(', ')}. `
       + `A migration landed and the ratchet was not tightened — lower it in selfcheck.js so the `
       + `ground that was won cannot be given back silently`);
  }
  if (!outside.length && !over.length && !under.length) {
    const total = Object.values(ENCODER_BUDGET).reduce((a, b) => a + b, 0);
    notes.push(`${total} encoder call site(s) across ${Object.keys(ENCODER_BUDGET).length} pinned `
             + `function(s) — the boundary may shrink, never grow`);
  }
}

/* ---- 11. plugin content may not change without the cascade ----------------
 * Invariant 2 says a change to ANYTHING under `plugin/` requires a version
 * bump in plugin.json + marketplace.json + a CHANGELOG entry. Check 1 verifies
 * those three AGREE; nothing verified that a change TRIGGERED them. So the
 * rule was prose, and this branch broke it undetected: R4.1 stages 1 and 2 both
 * edited plugin/skills/mitate/templates/smoke.js while the version sat at
 * 0.16.51, and check 1 printed "version cascade coherent" on every one of them.
 *
 * THE ANCHOR IS THE LAST COMMIT THAT TOUCHED plugin.json, and picking it was
 * the whole difficulty. The obvious anchor — merge-base with origin/main — was
 * built, run, and MEASURED WRONG in two independent ways (2026-08-01):
 *
 *   - It exits 0 on the live violation. It asks "did the version move anywhere
 *     across the branch", and one early bump permanently satisfies that for
 *     every later unversioned change. A control that cannot go red on the case
 *     that motivated it is decorative.
 *   - `origin/main` is not reliably fetched. Reproduced against a clone
 *     mimicking actions/checkout: `git rev-parse origin/main` fails outright,
 *     so the check would crash on exactly the pushes and PRs it exists to gate.
 *
 * Anchoring on the last bump fixes both: it goes red on the real violation, and
 * it needs no remote ref at all. It DOES need real history, so this belongs in
 * static.yml (fetch-depth: 0) and not gate.yml.
 *
 * NOT A RATCHET, unlike checks 5 and 10 — there is no budget to lower. The
 * answer is binary: either the version moved with the content or it did not. */
{
  const sh = (cmd) => { try { return require('child_process').execSync(cmd, { encoding: 'utf8' }).trim(); } catch (e) { return null; } };
  const PLUGIN_JSON = 'plugin/.claude-plugin/plugin.json';
  // The last commit that touched the manifest IS the anchor. If it has never
  // been touched (a fresh repo, or a shallow clone deep enough to lose it),
  // skip loudly rather than inventing a comparison — a check that silently
  // no-ops is the shape this whole file exists to catch.
  const anchor = sh(`git log -1 --format=%H -- ${PLUGIN_JSON}`);
  if (!anchor) {
    notes.push('cascade trigger: SKIPPED — no commit in history touches ' + PLUGIN_JSON
             + ' (shallow clone?). This check needs full history; static.yml supplies it');
  } else {
    // `${anchor}` and not `${anchor}..HEAD`: diff the anchor against the WORKING
    // TREE, so an uncommitted or staged edit to plugin/ counts. Comparing
    // commits only would fire one commit AFTER the violation, which is too late
    // for a pre-commit hook — the whole point is to stop the unversioned change
    // from landing, not to report it afterwards.
    const changed = (sh(`git diff --name-only ${anchor} -- plugin/`) || '')
      .split('\n').filter(Boolean);
    // Compare the VERSION STRING against the anchor's, not the commit dates.
    // The first cut compared history alone and could never go green in the
    // commit that fixes it: the pre-commit hook blocks until the bump is
    // committed, and committing is what the hook is blocking. Found by running
    // it, one minute after it earned its red. Reading the working tree makes a
    // staged-but-uncommitted bump count, which is exactly the state a
    // pre-commit hook inspects.
    const verAt = (() => {
      const raw = sh(`git show ${anchor}:${PLUGIN_JSON}`);
      const m = raw && raw.match(/"version"\s*:\s*"([^"]+)"/);
      return m ? m[1] : null;
    })();
    const verNow = (JSON.parse(R(PLUGIN_JSON)) || {}).version;
    if (!changed.length) {
      notes.push(`cascade trigger: no plugin/ content has changed since the last version bump (${anchor.slice(0, 7)})`);
    } else if (verAt && verNow && verAt !== verNow) {
      notes.push(`cascade trigger: ${changed.length} plugin/ file(s) changed and the version moved ${verAt} → ${verNow}`);
    } else {
      fail(`plugin/ content changed since the last version bump (${anchor.slice(0, 7)}) but the version did not move: `
         + `${changed.join(', ')}. Invariant 2 — bump ${PLUGIN_JSON} and .claude-plugin/marketplace.json, `
         + `and add a CHANGELOG entry, or marketplace update never reaches installed users`);
    }
  }
}

/* ---- 12. a bracket may not state its own arm count in prose ---------------
 * `source-of-truth.md` already says "never hand-write what a command produces".
 * The rule did not hold, and the instructive part is WHERE it failed:
 * `bracket-driver.js` opened with "nine ways" while printing `10 arm(s)
 * exercised` at runtime two lines below. The correct number was derived, on
 * screen, every run — and the prose beside it was still wrong, because adding an
 * arm updates the array and nothing updates the sentence.
 *
 * THREE PRIOR INSTANCES OF THE SAME SHAPE, which is why this became a check
 * rather than a fourth reminder: `gate.yml` read "all three" while four brackets
 * were globbed; `CLAUDE.md` asserted "9 references" while selfcheck derived the
 * same number every run; `bracket-parity.js` said "five ways" while running 22
 * rows across three blocks. A rule that has been written down and violated four
 * times is not a rule, it is a wish.
 *
 * NARROW ON PURPOSE, because the obvious wide version is unusable. A first cut
 * flagged any number near "arm" and matched 28 lines, nearly all legitimate:
 * "one arm each", "the two arms that matter", "four arms that could not tell
 * each other's failure apart" — narrative and history, which do not rot. The
 * distinguishing property of the dangerous ones is that they describe the file's
 * OWN CURRENT structure, and those take three forms. Anything else is prose
 * about the past and is left alone.
 *
 * The escape hatch is to say it structurally instead — "one arm per property",
 * "the static half and the browser half" — and let the run print the number. */
{
  const SELF_COUNT = [
    /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+ways\b/i,
    /\ball\s+(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+arms?\b/i,
    /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+of\s+(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+|these|those|the|its)\s+arms?\b/i,
  ];
  const hits = [];
  for (const [f, text] of toolJs) {
    if (!/^bracket-.*\.js$/.test(path.posix.basename(f))) continue;
    text.split('\n').forEach((line, i) => {
      // BEGINS with a comment marker, never merely CONTAINS one. The first cut
      // used /(^\s*\*|\/\/|\/\*)/ and immediately flagged bracket-selfcheck.js's
      // own fixture — a STRING LITERAL holding the bad header it injects. That
      // is this repo's oldest check-authoring failure (five specs shipped wrong
      // the same way, each unable to separate carrying a thing from describing
      // it), reproduced by the check written to stop counts drifting. A line of
      // prose starts with its marker; a mention inside code does not.
      if (!/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      if (SELF_COUNT.some(re => re.test(line))) hits.push(`${f}:${i + 1}`);
    });
  }
  if (hits.length) {
    fail(`${hits.length} bracket comment(s) state an arm count in prose: ${hits.join(', ')}. `
       + `Every bracket prints its own tally at runtime — say it structurally ("one arm per `
       + `property", "the static half") and let the run produce the number. A count in a comment `
       + `goes stale the next time an arm lands, and this one has four times.`);
  }

  /* SECOND HALF, 2026-08-02. Forbidding the STALE number never required a LIVE
   * one, and three brackets satisfied the half above by printing no count at
   * all: `all arms as specified`, a green line that cannot tell twenty-three
   * arms from zero. That is the same shape `run-brackets.sh` already fails a
   * zero-match glob over — "a green step that ran zero controls is
   * indistinguishable from one that ran five" — reproduced one level down, in
   * the controls themselves.
   *
   * The sharpest part is that this check's OWN success note asserted "the count
   * is derived at runtime" while that was false for a third of them. The check
   * built to stop stale claims about arm counts was emitting one.
   *
   * WHY THIS SHAPE RATHER THAN A LAYER ABOVE: the recorded failure class here is
   * coverage decay — a control that was right when written and silently stops
   * covering what it claims. A control that reports its own SCOPE cannot decay
   * silently and needs nothing above it to notice. Adding a fourth recursion
   * layer would decay the same way; this does not.
   *
   * THE TEST: a success line is a console.log saying "as specified" or
   * "exercised" and NOT mentioning `wrong` — the `${wrong}` lines run only when
   * the bracket is already red, and a count you see only on failure says nothing
   * about whether the green was earned. That line must interpolate.
   *
   * LIMIT, stated because an unstated one gets trusted past it -- and stated
   * BACKWARDS until 2026-08-02, which is worse than leaving it unstated. The
   * first version claimed a bracket wording its tally differently "is not seen
   * and would pass while printing nothing", i.e. a silent miss. Tested: it is
   * FLAGGED. A success line is recognised by the literal phrases "as specified"
   * or "exercised", so a bracket with a perfectly good derived count under
   * different wording has no recognised success line at all and trips the check.
   *
   * So the real hazard is the opposite one: a FALSE POSITIVE against a compliant
   * bracket, not a false negative against a sloppy one. This check goes LOUD on
   * a deviation, never quiet. The idiom is the contract; a bracket that wants
   * different wording must add its phrase here rather than expect to be missed.
   *
   * Recorded at length because a wrong statement of a blind spot is worse than
   * none: it points the next reader at a failure mode that does not exist while
   * the real one goes unwatched. Found by an auditor told to test the sentence
   * rather than read it. */
  const noTally = [];
  let brackets = 0;
  for (const [f, text] of toolJs) {
    if (!/^bracket-.*\.js$/.test(path.posix.basename(f))) continue;
    brackets++;
    const success = text.split('\n').filter(l =>
      /console\.log\(/.test(l) && /\b(?:as specified|exercised)\b/.test(l) && !/\bwrong\b/.test(l));
    if (!success.length || !success.some(l => l.includes('${'))) noTally.push(f);
  }
  if (noTally.length) {
    fail(`${noTally.length} bracket(s) print no derived count on the success path: `
       + `${noTally.join(', ')}. "all arms as specified" cannot be told apart from a run that `
       + `exercised nothing. Print the tally you already computed — the idiom is `
       + `\`all \${ran} arms as specified\` — so the green states its own scope.`);
  }

  if (!hits.length && !noTally.length) {
    notes.push(`no bracket states its own arm count in prose, and all ${brackets} `
             + `print a derived count on success`);
  }
}

/* ---- 13. a derived count may not drift from the thing it counts -----------
 * Check 12 closed ONE shape of the rule `source-of-truth.md` states -- a
 * bracket naming its own arm count. The rule kept losing everywhere else,
 * because the dangerous forms are unbounded: "9 references", "`references/`
 * (9)", "all three", "five ways", "two of twelve". A scanner has to RECOGNISE a
 * count in arbitrary prose and cannot; the CLAUDE.md instance was a
 * parenthetical, and three greps written specifically to find it came back
 * empty on a violation the repo had already documented.
 *
 * So the instrument is a GENERATOR, not a scanner. `derived-counts.js` owns a
 * REGISTRY of countables and fills a marker it placed itself, which can neither
 * miss nor false-positive. This check is the drift half: it recomputes every
 * marker and fails when one disagrees. Same shape as check 8, which compares
 * the installed hook against its generator -- a pattern already proven here.
 *
 * The second half (bare counts) is best-effort BY ADMISSION and scoped by data:
 * registry nouns only, live-claim files only. Scanning everything surfaced 71
 * hits, essentially all legitimate history; scanning the front-door files
 * surfaced five. Both numbers were measured before this was written. A
 * legitimate mention carries `<!--count-mention-->` on its line, which is the
 * use-versus-mention seam this repo has now failed six times and is therefore
 * explicit rather than inferred.
 *
 * WHAT IT DOES NOT COVER, said plainly: a count in a noun not in the REGISTRY,
 * and any count in the files derived-counts.js's HISTORICAL list names -- the
 * changelog, logs, postmortems and planning records. A handoff that lists four cached plugin
 * versions where five exist is outside every guard here -- the answer there is
 * to cite the command, not its output. */
{
  const { scan, REGISTRY } = require('./derived-counts.js');
  const { drift, bare, missing } = scan();
  // A tracked .md absent from the working tree is not this check's business to
  // fix, but reading less than claimed without saying so IS. Reported in both
  // branches rather than only the green one, so it cannot hide behind a failure.
  const scope = missing.length
    ? ` (${missing.length} tracked file(s) not in the working tree, unread: ${missing.join(', ')})`
    : '';
  if (drift.length) {
    fail(`${drift.length} derived count(s) drifted from what they count: ${drift.join('; ')}. `
       + `Run 'bun run scripts/derived-counts.js --write' — the marker is refilled from the `
       + `REGISTRY, never by hand.`);
  }
  if (bare.length) {
    fail(`${bare.length} hand-written count(s) in live-claim prose: ${bare.join('; ')}. `
       + `Replace with a <!--derived:key--> marker, drop the number (it usually carries nothing), `
       + `or mark a genuine historical mention with <!--count-mention--> on its line.`);
  }
  if (!drift.length && !bare.length) {
    notes.push(`${Object.keys(REGISTRY).length} registered countables, every marker matching its `
             + `source and no bare count in live-claim prose${scope}`);
  } else if (scope) {
    fail(`derived-count scan read an incomplete file set${scope}`);
  }
}

/* ---- 14. a skill's frontmatter description must fit the Agent Skills limit --
 * ONE DEFECT IN TWO LINEAGES, which is why it is a check and not a note. Here it
 * crossed at 0.16.18 (898 -> 1371, bisected) and stayed over for ~40 versions,
 * reaching 1093 by the time anyone counted — including the build in the local
 * install cache. `predecessor-record.md` records the predecessor hitting it
 * independently at 1150, "pre-existing, surfaced only because 0.17.0 had to
 * touch the file", ending with "Nothing in the run's checkpoint checks it."
 * Nothing here did either. Twice written down, never checked: a missing control,
 * not a missing reminder.
 *
 * DERIVED over plugin/skills/*, not hardcoded to mitate: a second skill would
 * otherwise ship unchecked, which is the silent-coverage-loss shape this file
 * exists to catch. The limit itself is an EXTERNAL constant — it belongs to the
 * Agent Skills spec, not to this repo — so it is named once here rather than
 * restated anywhere else.
 *
 * The description is the only field measured. It is what a model reads when
 * deciding whether to invoke, so an over-limit one is not a style problem: it is
 * the routing surface being silently truncated or rejected. */
{
  const DESCRIPTION_LIMIT = 1024;              // Agent Skills spec, not ours
  const skillsRoot = path.join(PLUGIN_ROOT, 'skills');
  const skills = fs.existsSync(skillsRoot)
    ? fs.readdirSync(skillsRoot, { withFileTypes: true })
        .filter(e => e.isDirectory() && fs.existsSync(path.join(skillsRoot, e.name, 'SKILL.md')))
        .map(e => [e.name, path.join(skillsRoot, e.name, 'SKILL.md')])
    : [];
  if (!skills.length) {
    fail(`no plugin/skills/*/SKILL.md found — check 14 would pass by having nothing to measure`);
  }
  for (const [name, file] of skills) {
    const fm = (R(file).match(/^---\n([\s\S]*?)\n---/) || [, ''])[1];
    // Folded scalar: single newlines become spaces, which is what the consumer
    // sees. Measuring the raw block instead would count indentation and report a
    // length no reader ever receives.
    const lines = fm.split('\n');
    let desc = [], inDesc = false;
    for (const l of lines) {
      if (/^description:\s*>/.test(l)) { inDesc = true; continue; }
      if (inDesc) { if (/^[A-Za-z_-]+:/.test(l)) break; desc.push(l.trim()); }
    }
    // A single-line `description: ...` form is legal too and must not read as 0.
    const inline = (fm.match(/^description:[ \t]+(?!>)(.+)$/m) || [])[1];
    const value = desc.length ? desc.join(' ').trim() : (inline || '').trim();
    if (!value) {
      fail(`plugin/skills/${name}/SKILL.md has no readable frontmatter description`);
    } else if (value.length > DESCRIPTION_LIMIT) {
      fail(`plugin/skills/${name}/SKILL.md frontmatter description is ${value.length} characters, `
         + `over the Agent Skills limit of ${DESCRIPTION_LIMIT}. It is the routing surface a model `
         + `reads to decide whether to invoke, so over-limit means truncated or rejected, not untidy. `
         + `This has now happened three times — see predecessor-record.md.`);
    } else {
      notes.push(`${name} frontmatter description ${value.length}/${DESCRIPTION_LIMIT} `
               + `(${DESCRIPTION_LIMIT - value.length} to spare)`);
    }
  }
}

/* ---- 15. standing obligations fire on their due condition -----------------
 * In-motion documents (docs/source-of-truth.md classes them) carry future
 * obligations as markers rather than memories:
 *
 *   <!--due: 2026-08-24 | run the muted-blocks count-->
 *   <!--due: when-absent <a-self-deleting-plan>.md | prune what it superseded-->
 *
 * A date is due once today reaches it; `when-absent <path>` is due once that
 * file is gone. A due obligation is a RED check naming its action, which is
 * the mechanism that replaced the retired handoff memo's job of remembering
 * the future (owner, 2026-08-04). Completing or deferring is an edit to the
 * marker — remove it or move its date — so the disposition is visible in git.
 * An unparseable marker fails outright: an obligation the check cannot read
 * is one it would silently never fire.
 */
{
  let standing = 0, due = 0;
  const today = new Date().toISOString().slice(0, 10);
  // Tracked set for the when-absent guard below: a target that exists but is
  // untracked would make the condition environment-dependent — standing on
  // the laptop that has the file, due in every clone and in CI. That is the
  // accept-set defect the staged-films arm documents, one tier up.
  const tracked = new Set(execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n'));
  const scanDue = (f) => {
    if (!f.endsWith('.md')) return;
    const rel = path.relative(ROOT, f);
    // Whitespace- and case-tolerant on purpose, adversarially earned: the
    // first regex required `<!--due:` exactly, so the naturally-spaced
    // `<!-- due:` spelling was INVISIBLE — no fire, no error, the silent-miss
    // class this repo keeps finding. Accept the variants rather than policing
    // them; the bracket's spaced arm pins it.
    for (const m of R(f).matchAll(/<!--\s*due:\s*([^|>]+?)\s*\|\s*([^>]+?)\s*-->/gi)) {
      const when = m[1].trim(), action = m[2].trim();
      const absent = when.match(/^when-absent\s+(\S+)$/);
      if (absent) {
        if (!fs.existsSync(path.join(ROOT, absent[1]))) { due++; fail(`${rel}: obligation is due (${absent[1]} is gone) — ${action}`); }
        else if (!tracked.has(absent[1])) {
          fail(`${rel}: due-marker has an environment-dependent condition — ${absent[1]} exists here but is `
             + `not tracked, so this obligation would read standing on this machine and due in every clone. `
             + `Point it at a tracked file.`);
        }
        else standing++;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(when)) {
        if (today >= when) { due++; fail(`${rel}: obligation is due (${when} has arrived) — ${action}`); }
        else standing++;
      } else {
        fail(`${rel}: unparseable due-marker "${when}" — use a YYYY-MM-DD date or \`when-absent <repo-relative-path>\``);
      }
    }
  };
  walkFiles(ROOT, scanDue);
  // internal/ is deliberately outside walkFiles, but internal/log/ is TRACKED
  // narration — a marker written there must fire rather than silently never
  // being scanned. (Obligations BELONG in in-motion docs per source-of-truth;
  // scanning the logs is the safety net, not an endorsement.)
  const logDir = path.join(ROOT, 'internal', 'log');
  if (fs.existsSync(logDir)) for (const e of fs.readdirSync(logDir)) scanDue(path.join(logDir, e));
  if (!due) notes.push(`${standing} standing obligation(s), none due`);
}

/* ---- 23. no SUBJECTS[*].pos reads a world matrix -------------------------
 * `pos` is specified as a pure function of t. `obj.getWorldPosition()` is not
 * one: it reads a world matrix, and that matrix was last written by the
 * PREVIOUS animate() call, because the DRIVER fence's seekTo runs
 *
 *     setCamera(state); animate(t); setOverlay(t);
 *
 * and setCamera is what calls pos(). So the camera aims with the pose from
 * wherever the film was seeked from, and the subject is a function of
 * (t, previous t).
 *
 * WHY A CHECK AND NOT A RULE. The determinism sampler already catches this —
 * sometimes. Two corpus films were written the impure way on consecutive
 * days: hauler.html failed smoke at t=16.64, and strider-intro.html SHIPPED
 * and passed, because none of its sampled t values landed where the stale
 * pose moved a byte. A green determinism run certifies the samples, not the
 * property, so the thing that catches this reliably has to read the source.
 *
 * THE PROXY LIMIT, stated rather than discovered: this is a text scan over
 * the SUBJECTS block. It sees a direct getWorldPosition call and it does NOT
 * see one reached through a helper, nor a matrixWorld read spelled another
 * way. It can reject; it cannot approve. Widen it when something slips past,
 * and do not read a green here as proof of purity. */
{
  const dirs = [SCENES, TEMPLATES, path.join(ROOT, 'fixtures', 'defect-corpus')];
  const IMPURE = /getWorldPosition|\.matrixWorld/;
  let scanned = 0;
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter(f => f.endsWith('.html'))) {
      const rel = path.relative(ROOT, path.join(d, f));
      const lines = R(path.join(d, f)).split('\n');
      // Bound the block by brace depth from `const SUBJECTS`, so a scene that
      // formats it differently is still covered. Minified library lines are
      // skipped by length — the embedded three.js is one enormous line and it
      // is full of matrixWorld.
      let depth = 0, inside = false, inBlockComment = false;
      for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        if (raw.length > 400) continue;
        /* COMMENTS ARE STRIPPED BEFORE THE TEST, and the first version of this
         * check did not do that — so it fired on the very comments explaining
         * why not to write the impure form, in the two scenes that had just
         * been FIXED. A check that cannot tell an instruction from a warning
         * about that instruction reports the documentation as the defect. */
        let line = raw;
        if (inBlockComment) {
          const end = line.indexOf('*/');
          if (end === -1) continue;
          line = line.slice(end + 2);
          inBlockComment = false;
        }
        line = line.replace(/\/\*[\s\S]*?\*\//g, ' ');
        const open = line.indexOf('/*');
        if (open !== -1) { inBlockComment = true; line = line.slice(0, open); }
        line = line.replace(/\/\/.*$/, '');
        if (!inside && /^\s*(const|let|var)\s+SUBJECTS\s*=/.test(line)) { inside = true; scanned++; depth = 0; }
        if (!inside) continue;
        for (const ch of line) { if (ch === '{') depth++; else if (ch === '}') depth--; }
        if (IMPURE.test(line)) {
          fail(`${rel}:${i + 1} — a SUBJECTS entry reads a world matrix, which is not a pure `
             + `function of t: seekTo runs setCamera BEFORE animate, so pos() sees the previous `
             + `frame's pose and the camera depends on the arrival path. Derive from the same `
             + `named closed form the body uses; references/film-language.md carries both spellings`);
        }
        if (depth <= 0 && /}/.test(line)) inside = false;
      }
    }
  }
  notes.push(`${scanned} SUBJECTS block(s) scanned, none reading a world matrix `
           + `(text scan: sees a direct call, not one behind a helper)`);
}

for (const n of notes) console.log('  ok   ' + n);
if (fails.length) {
  console.log('');
  for (const f of fails) console.log('  FAIL ' + f);
  console.log(`\n${fails.length} self-check failure(s)`);
  process.exit(1);
}
console.log('\nself-check: ok');
