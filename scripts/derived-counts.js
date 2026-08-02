#!/usr/bin/env bun
/* The counts, derived — so no one has to write one down.
 *
 * `source-of-truth.md` has said "never hand-write what a command produces"
 * since 0.16.50, and the rule lost six times: `gate.yml`'s "all three" against
 * four globbed brackets, `CLAUDE.md`'s "`references/` (8)" then "(9)" against a
 * real 10, `bracket-parity.js`'s "five ways" against 22 rows,
 * `bracket-driver.js`'s "nine ways" two lines above its own printed ten, this
 * corpus README's "twelve characterized defects" against fourteen table rows,
 * and a handoff listing four cached plugin versions where five are installed.
 * Check 12 closed exactly one of those shapes. This closes the class.
 *
 * WHY A GENERATOR AND NOT A SCANNER, which was the first design and is wrong.
 * A scanner has to RECOGNISE a count inside arbitrary prose, and the forms are
 * unbounded: "9 references", "`references/` (9)", "all three", "five ways",
 * "two of twelve". The CLAUDE.md instance was a parenthetical, so the obvious
 * `<number> <noun>` pattern never saw it -- three greps failed to find a
 * violation this repo had already written down. A generator does not recognise
 * anything; it fills a marker it placed itself, which is why it cannot miss and
 * cannot false-positive.
 *
 *   bun run scripts/derived-counts.js            # report drift, exit 1 on any
 *   bun run scripts/derived-counts.js --write    # refill every marker in place
 *
 * `selfcheck.js` check 13 calls scan() and owns the verdict; this file owns the
 * derivations and the write path. Adding a countable is a REGISTRY edit -- data,
 * not a new check.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const R = f => fs.readFileSync(f, 'utf8');
const SUBTREE = path.join('plugin', 'skills', 'mitate');

const tracked = () => execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(Boolean);

// Count tracked files matching a predicate. Deriving from `git ls-files` rather
// than readdir on purpose: an untracked scratch file in examples/ is not an
// example, and the numbers these markers carry are claims about what SHIPS.
const trackedCount = pred => tracked().filter(pred).length;

/* ---- THE REGISTRY -- data. A new countable is an entry here, nothing else. */
const REGISTRY = {
  references: {
    what: 'reference docs in the shipped subtree',
    derive: () => trackedCount(f => f.startsWith(path.posix.join(SUBTREE, 'references')) && f.endsWith('.md')),
  },
  brackets: {
    what: 'controls (bracket-*.js), both directories',
    derive: () => trackedCount(f => /(^|\/)bracket-[^/]*\.js$/.test(f)),
  },
  examples: {
    what: 'example scenes that ship',
    derive: () => trackedCount(f => f.startsWith(path.posix.join(SUBTREE, 'examples')) && f.endsWith('.html')),
  },
  postmortems: {
    what: 'tracked postmortems',
    derive: () => trackedCount(f => /^docs\/postmortems\/\d{4}-\d{2}-\d{2}_.*\.md$/.test(f)),
  },
  fences: {
    what: 'fenced blocks in the parity set',
    // Scraped from smoke.js's FENCES array, which is the enforcing list — a
    // fence absent from it is not checked, whatever a doc says. instruments.md
    // asserted six and omitted CONTRACT for the eleven versions after CONTRACT
    // became the seventh, in a file that ships to every installed user.
    derive: () => ((R(path.join(ROOT, SUBTREE, 'templates', 'smoke.js'))
      .match(/const FENCES = \[([^\]]*)\]/) || [, ''])[1].match(/'/g) || []).length / 2,
  },
  'defect-bases': {
    what: 'distinct base defect numbers in the corpus README (sub-lettered rows folded into their parent)',
    // The ROWS and the BASES are different questions and the README needs both:
    // fourteen rows over eleven bases, because three defects are split. Stating
    // either without the other is what made "twelve" survive -- it was neither,
    // and its own explanatory sentence ("three of the twelve are split, which is
    // why the two numbers differ") only balances at eleven. Registered rather
    // than exempted, because the previous instance was exempted with
    // count-mention and that is precisely why nothing caught it.
    derive: () => new Set((R(path.join(ROOT, 'fixtures', 'defect-corpus', 'README.md'))
      .match(/^\| [0-9]+[a-z]? \|/gm) || []).map(m => m.match(/[0-9]+/)[0])).size,
  },
  'defect-rows': {
    what: 'defect rows in the corpus README, both tables',
    // The rows ARE the corpus's inventory, so they are what a reader is owed.
    // The README's prose said "twelve" while carrying fourteen, because three
    // defects were split into sub-lettered rows (2b, 5b, 10b) and the sentence
    // was never revisited.
    derive: () => (R(path.join(ROOT, 'fixtures', 'defect-corpus', 'README.md'))
      .match(/^\| [0-9]+[a-z]? \|/gm) || []).length,
  },
};

/* ---- WHICH FILES CARRY LIVE CLAIMS -- also data.
 * A count is only dangerous where it describes the repo AS IT IS. CHANGELOG.md,
 * the session logs, the postmortems and the two planning documents are dated
 * records whose whole job is to say what was true THEN, and they are dense with
 * it: scanning them surfaced 71 hits, essentially all legitimate. Scanning only
 * the front-door files surfaced five. That ratio is the entire argument for this
 * list, and it was measured before the check was written, not after. */
const HISTORICAL = [
  /^CHANGELOG\.md$/,
  /^internal\/log\//,
  /^docs\/postmortems\//,
  /^docs\/predecessor-record\.md$/,
  /^docs\/restructure-2026-07\.md$/,
  /^docs\/working-plan\.md$/,
  /^docs\/source-of-truth\.md$/,
];
// TRACKED AND PRESENT, which are not the same set. `git ls-files` lists the
// index, and a file deleted in the working tree but not yet staged is still in
// it -- so reading every entry blindly throws ENOENT and takes the whole
// self-check down. That happened on a tracked rule file that another session in
// a shared checkout had deleted without staging (deliberately not cited by path
// here: the path stopped resolving, which is what check 6 exists to catch, and
// a comment about a missing file must not itself dangle). A crash is the worst
// of the three available outcomes: it reports
// nothing about the counts AND blames the wrong file. Missing entries are
// skipped and RETURNED, so the run can say what it did not read rather than
// quietly reading less than it claims.
const liveClaimFiles = () => {
  const all = tracked().filter(f => f.endsWith('.md') && !HISTORICAL.some(re => re.test(f)));
  const present = [], missing = [];
  for (const f of all) (fs.existsSync(path.join(ROOT, f)) ? present : missing).push(f);
  return { present, missing };
};

/* ---- MARKERS. `<!--derived:key-->N<!--/derived-->` */
const MARKER = /<!--derived:([a-z-]+)-->([^<]*)<!--\/derived-->/g;

/* ---- BARE COUNTS. The residue a generator cannot reach: a number written
 * straight into prose with no marker. Narrow by construction -- only nouns in
 * the REGISTRY, only in live-claim files -- and every legitimate historical
 * mention carries `<!--count-mention-->` on its line. That exemption is the
 * SAME use-versus-mention seam check 12 hit, and this repo has failed it six
 * times, so it is explicit rather than inferred. */
const NOUN_OF = {
  references: 'references', brackets: 'brackets', examples: 'examples',
  postmortems: 'postmortems', defects: 'defect-rows', fences: 'fences',
};
const NUM = '(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|\\d+)';
// Up to two words may sit between the number and its noun, because the live
// violation this was written for reads "twelve characterized defects" and the
// adjacent form never saw it. Widening moved the hit count from five to
// fourteen and surfaced four MORE latent counts ("the five shipped examples",
// "Three companion references"), each correct today and each certain to rot.
// That is the whole return on the extra exemptions it also cost.
const BARE = new RegExp(`\\b${NUM}(?:\\s+[a-z]+){0,2}\\s+(${Object.keys(NOUN_OF).join('|')})\\b`, 'i');
const EXEMPT = '<!--count-mention-->';

/* Returns { drift: [...], bare: [...] } — never throws on a bad key, because a
 * marker naming nothing in the REGISTRY is itself a defect worth reporting. */
function scan() {
  const drift = [], bare = [];
  const { present, missing } = liveClaimFiles();
  for (const rel of present) {
    const text = R(path.join(ROOT, rel));
    const lines = text.split('\n');

    // OFFSET -> LINE, because this cannot be a line-by-line scan. These files
    // wrap at ~80 columns, so a count and its noun routinely straddle a
    // newline: docs/addressing.md carried "all five shipped\nexamples" and a
    // line-based first cut read straight past it. That is the SAME blindness
    // that made `git log -S'9 references'` come back empty on the CLAUDE.md
    // violation -- a wrapped claim is invisible to anything matching one line
    // at a time, and this file exists because of that violation.
    let flat = '';
    const lineAt = [];
    lines.forEach((line, i) => {
      for (let c = 0; c < line.length; c++) { flat += line[c]; lineAt.push(i); }
      flat += ' '; lineAt.push(i);
    });
    const where = idx => `${rel}:${(lineAt[idx] ?? 0) + 1}`;

    // Markers first, over the flattened text so a wrapped marker still parses.
    let m;
    const mre = new RegExp(MARKER.source, 'g');
    // Blank out every marker span before the bare scan, preserving offsets, so
    // a marker's own digits can never read as a hand-written count.
    let masked = flat;
    while ((m = mre.exec(flat))) {
      const [whole, key, val] = m;
      masked = masked.slice(0, m.index) + ' '.repeat(whole.length) + masked.slice(m.index + whole.length);
      if (!REGISTRY[key]) { drift.push(`${where(m.index)} marker names '${key}', which is not in the REGISTRY`); continue; }
      const truth = String(REGISTRY[key].derive());
      if (val !== truth) drift.push(`${where(m.index)} '${key}' says ${val || '(empty)'}, derived ${truth}`);
    }

    const bre = new RegExp(BARE.source, 'gi');
    while ((m = bre.exec(masked))) {
      // A wrapped claim spans two lines, so EITHER line may carry the
      // exemption -- requiring it on the first would make the marker's correct
      // placement depend on where the text happened to wrap.
      const a = lineAt[m.index] ?? 0, b = lineAt[m.index + m[0].length - 1] ?? a;
      if (lines.slice(a, b + 1).some(l => l.includes(EXEMPT))) continue;
      const noun = REGISTRY[NOUN_OF[m[1].toLowerCase()]];
      bare.push(`${where(m.index)} "${m[0].replace(/\s+/g, ' ')}" — ${noun.what}`);
    }
  }
  return { drift, bare, missing };
}

/* Refill every marker from its derivation. Only ever rewrites BETWEEN the
 * marker delimiters, so prose is never touched. */
function write() {
  const changed = [];
  for (const rel of liveClaimFiles().present) {
    const p = path.join(ROOT, rel);
    const before = R(p);
    const after = before.replace(new RegExp(MARKER.source, 'g'),
      (whole, key) => REGISTRY[key] ? `<!--derived:${key}-->${REGISTRY[key].derive()}<!--/derived-->` : whole);
    if (after !== before) { fs.writeFileSync(p, after); changed.push(rel); }
  }
  return changed;
}

module.exports = { REGISTRY, scan, write, liveClaimFiles, EXEMPT };

if (require.main === module) {
  if (process.argv.includes('--write')) {
    const changed = write();
    console.log(changed.length ? `rewrote ${changed.join(', ')}` : 'every marker already current');
    process.exit(0);
  }
  const { drift, bare } = scan();
  for (const k of Object.keys(REGISTRY)) console.log(`  ${k.padEnd(12)} ${REGISTRY[k].derive()}  (${REGISTRY[k].what})`);
  if (!drift.length && !bare.length) { console.log('\nno drift, no bare counts'); process.exit(0); }
  for (const d of drift) console.log('  DRIFT ' + d);
  for (const b of bare) console.log('  BARE  ' + b);
  console.log(`\nrun --write to refill markers; a legitimate historical mention takes ${EXEMPT} on its line`);
  process.exit(1);
}
