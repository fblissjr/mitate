last updated: 2026-08-02

# The verification apparatus, as of 2026-08-02

Frozen record. Every count was derived on this date; re-run the named command
rather than citing a number here. See [`README.md`](README.md).

## The governing idea

Three rules explain almost every design decision below, and they are worth
stating before the inventory because the inventory is unreadable without them.

**1. Red before green, on modifications too.** Every gate check ships with a
*bracket* — a control carrying at least one arm that MUST fail, where the bracket
itself exits non-zero when an arm misbehaves. A control that cannot go red is
decorative. The rule's teeth are on **edits**, not features: touching a check, a
threshold, a filter or a flag means re-running its bracket before the change
(prove red is reachable) and after (prove green is earned). Writing "measured" in
a comment is not the measurement.

**2. Never hand-write what a command produces.** A count in prose disagrees with
the check that derives it, and the check is the one that runs. This rule was
written down and violated repeatedly before it became mechanical — and the
mechanism had to be a *generator*, not a scanner, because a scanner over
arbitrary prose cannot recognise a count. Three greps written specifically to
find one known violation came back empty.

**3. Signal honesty over green boards.** Never make a check pass by touching what
it measures. The clearest live example: the CI runner is deliberately slow and
GPU-less, because that slowness is the only reason a capture race was ever
observed. Upgrading the runner for a green board is named in `gate.yml` as the
purest form of the violation.

## `scripts/selfcheck.js` — the repo's claim-checker

1173 lines, no browser, no `node_modules`, near-instant. It is pointed at the
repo's own assertions rather than at scene behaviour. On this date it reports
**ok** across nineteen checks, numbered 1 to 14 with lettered insertions:

| # | What it asserts |
|---|---|
| 1 | version cascade coherent across the three sources |
| 2 | the three.js pin is one fact, and every embedding scene names it |
| 2b | the pins have one home, including executable copies |
| 3 | no pointer inside shipped content escapes the plugin subtree |
| 4 | every reference carries a parseable provenance date |
| 5 | the measurement-assertion **ratchet** |
| 6 | every bracket can fail |
| 6b | tool JS read once (ordered before 6 deliberately) |
| 6c | no bare seek before a capture |
| 6d | a comment may not cite a file that does not exist |
| 6e | tracked postmortems readable by the thing that indexes them |
| 6f | the one exception to the prime directive has not quietly lapsed |
| 7 | dated freshness markers are not older than the file |
| 8 | the installed pre-commit hook still matches its generator |
| 9 | `CLAUDE.md`'s Map covers every tracked top-level entry |
| 10 | the encoder boundary only shrinks |
| 11 | plugin content may not change without the cascade |
| 12 | a bracket may not state its own arm count in prose |
| 13 | a derived count may not drift from what it counts |
| 14 | a skill's frontmatter description fits the Agent Skills limit |

Several of these are unusual enough to be worth naming individually.

**Check 5, the ratchet.** Comments in `templates/*.js` that assert a measurement
without naming the control behind it. The budget may fall, never rise. The figure
deliberately lives only in the check, because a count in prose would disagree
with the check that derives it.

**Check 9 is why this snapshot needed a `CLAUDE.md` edit.** It asserts that every
tracked top-level entry appears in the Map, because the claim above that Map is a
completeness claim and prose could not hold it — a review once found two
directories missing, and auditing the rest found five more.

**Check 11, the cascade trigger,** diffs the working tree against the last commit
touching `plugin.json`, not commit-to-commit, so a staged-but-uncommitted bump
counts. That matters because a pre-commit hook inspects exactly that state. The
first version of this check could never go green in the commit that fixed it.
*This check has a blind spot found on 2026-08-02 — see
[`state-of-play.md`](state-of-play.md).*

**Check 13 is a generator, not a scanner.** `scripts/derived-counts.js` owns a
registry of countables and fills a marker it placed itself, which can neither
miss nor false-positive; check 13 recomputes every marker and fails on drift. Its
second half (bare counts in prose) is **best-effort by admission** and scoped by
data: scanning everything surfaced 71 hits, essentially all legitimate history;
scanning only the front-door files surfaced five. The scope is a `HISTORICAL`
exclusion list — `CHANGELOG.md`, `internal/log/`, `docs/postmortems/`, and the
planning documents — on the reasoning that those are dated records whose job is
to say what was true *then*. **This snapshot directory is in the same class but
is not on that list**, so its counts carry the sanctioned `count-mention` marker
instead.

Check 13's own comment says plainly what it does not cover: a count in a noun
outside the registry, and any count in the dated records. The answer there is to
cite the command rather than its output.

## The brackets — controls over the checks

Nine on this date, split across two directories, and the split is operationally
significant: **each CI workflow globs one directory**, so a bracket in the wrong
place runs nowhere.

### Under `plugin/skills/mitate/templates/` (run by `gate.yml`)

| Bracket | What it controls |
|---|---|
| `bracket-driver.js` | `smoke.js`'s own structure — check order and the ctx keys each check may assume. 424 lines, the largest. |
| `bracket-parity.js` | the fence system, this repo's whole answer to duplication |
| `bracket-commands.js` | that `build.js` paths **execute** and name the artifact they promised. Explicitly not a correctness check |
| `bracket-determinism.js` | builds its own broken copies of a shipped example in a temp dir |
| `bracket-liveplay.js` | same fixture discipline |
| `bracket-noise.js` | drives the **real** `smoke.js` as a subprocess, so what is under test is the shipped gate rather than a copy of its logic |

### Under `scripts/` (run by `static.yml`)

| Bracket | What it controls |
|---|---|
| `bracket-selfcheck.js` | `selfcheck.js`, `stage-films.sh`, and `derived-counts.js` (through its check-13 arms). 420 lines |
| `bracket-run-brackets.js` | the loop that decides whether any other bracket runs at all |
| `bracket-stage-films.js` | the guard in `stage-films.sh` that refuses to derive the neon variant if the line it edits has moved |

Two design patterns recur and both were learned the hard way:

- **A bracket builds its own fixtures in a temp dir.** The first versions of
  `bracket-determinism.js` and `bracket-liveplay.js` depended on scratch files
  that had already been deleted by the time they were preserved. A bracket you
  cannot re-run is a claim, not a control.
- **A bracket drives the real tool as a subprocess.** `bracket-noise.js` says
  why: a copy of the logic would have passed while the gate was broken.

### What is uncontrolled, stated rather than glossed

`diagnose-determinism.js`, `sample-determinism.js` and `install-hooks.sh` have no
brackets. **`shoot.js` has none either** — the recorder, uncontrolled. `CLAUDE.md`
names the uncontrolled tools rather than counting them, on the reasoning that a
list of names goes stale loudly where a count goes stale silently.

## Where things run

| Surface | Trigger | Runs |
|---|---|---|
| `static.yml` | every push and PR | lint (`oxlint`, and `no-undef` is the whole reason it exists), `selfcheck.js`, cross-directory fence parity, every bracket under `scripts/` |
| `gate.yml` | push and PR | `smoke.js` over the scene corpus in an isolated workspace, then every bracket under `templates/` |
| `sample.yml` | manual only | determinism sampling |
| pre-commit hook | local commit | `selfcheck.js` + fence parity. Runs **no** brackets, by design |

Both workflows call one loop, `scripts/run-brackets.sh <glob>`, which runs every
bracket even when one is red, and **fails when its glob matches nothing** —
because a green step that ran zero controls is indistinguishable from one that
ran five. The glob is quoted so the script expands it and an unmatched pattern
fails loudly.

`gate.yml` deliberately pins no backend and deliberately uses a slow GPU-less
runner. `static.yml` is deliberately not path-filtered, because it checks docs as
much as code and a docs-only commit is exactly when it has the most to say. It
also uses `fetch-depth: 0`, because the freshness check compares each marker
against the file's last commit date and a shallow clone reports the tip commit
for everything.

The pre-commit hook lives in a slot left free by another tool's wrapper chain.
`.git/hooks/` is untracked, so `scripts/install-hooks.sh` is the only
reproducible copy — and check 8 compares the installed hook against that
generator, because an installer only speaks when you run it and the whole point
of a hook is that you never run it again.

## The defect corpus

`fixtures/defect-corpus/` holds scenes kept **broken on purpose**, with
characterized defects at known timestamps, so a check that stops catching
something is noticed. It is the ninth fence-parity carrier.

Its placement is a deliberate three-way decision:

- **Wired into `static.yml` and the pre-commit hook.**
- **Deliberately not into `gate.yml`.** A general pass/fail gate that goes red for
  a correct reason is one people learn to route around.
- **Outside `plugin/`**, because everything under `plugin/` ships, and a
  deliberately defective scene must not reach a user as an example.

Its single fixture, `after-hours.html`, is re-skinned from a local prototype: the
theme, palette, title words and setting changed, the script did not. The re-skin
produced a finding worth keeping — the scene's procedural alphabet defines
thirteen letters, a first pass chose a title with an `F` and crashed. Character
count is not glyph coverage.

**Two open debts on the corpus, both recorded rather than left implicit:**

1. **Nothing runs it.** `gate.yml` copies `templates/` and `examples/` into its
   workspace and not `fixtures/`, so the file is fence-checked and **executed by
   nothing**. The recorded fix is a `bracket-corpus.js` under `templates/` that
   runs smoke over the corpus and asserts the *expected verdict* — failing when
   the verdict changes in either direction, a scene that starts failing and
   equally a defect that quietly stops being detected. Not built.
2. **Most defect rows are still labelled UNVERIFIED**, carried from the prototype
   rather than re-measured against this build. Where they *were* re-measured, the
   figures moved.

## The three axes of scene review

`plugin/agents/film-reviewer.md` reviews on composition, continuity and
semantics, using the shipped instruments and reporting findings with their
measured brackets.

## Repo-development agents and skills

Under `.claude/`, and outside every mechanical check:

| | |
|---|---|
| `agents/control-builder.md` | takes a claim, builds the control that would refute it, runs it, reports which way it went |
| `agents/doc-claim-auditor.md` | verifies a reference's capability claims against the code; read-only |
| `skills/audit-claims/` | dispatches the auditor at whatever the diff touched |
| `skills/extract-patterns/` | proposes which techniques from finished work belong in the references |

**This directory is the apparatus's own blind spot, and the repo says so.** These
files carry no freshness marker by design, so `selfcheck.js` derives a set that
excludes them and nothing checks the tree. A review found stale claims in one
agent file, each of which would have made it report a working capability as
drift. `/audit-claims` routing at them is the only control, and it is a practice
rather than a gate. Two ways out are recorded and neither is taken: build the
coverage, or decouple the rules into their own repo. The trigger to revisit is a
stale prior producing a wrong verdict that reaches a commit.

There is **no standing model-delegation rule** — retired by owner call
2026-08-01, on the grounds that an always-loaded tiering rule cost more than it
bought. Each agent states its own model reasoning in its own file.

## What the apparatus is actually for

Worth stating plainly, because the inventory above reads as ordinary CI and is
not. Nearly every check in this repo is pointed at a **claim** rather than at
behaviour: does the version cascade agree with itself, does a comment cite a file
that exists, does a count match what it counts, does a bracket actually have a
failing path, does the Map cover the tree, does a reference's provenance header
say what it was checked against.

That emphasis is empirical, not aesthetic. The repo's own postmortem on the
question — `2026-08-01_session_what-caught-the-defects.md`, **on the unmerged
`postmortem-what-caught-defects` branch as of this date, so not present on
`main`** — concluded that not one defect across 0.16.57–0.16.62 would have been
caught by reading a diff. Every one surfaced from running something and noticing a
count disagreed with a summary line, and four times over the **checker** was
broken rather than the thing it checked. Its table is worth reading in full before
adding a review step; the short version is that the failure mode which survives
here is the one that looks correct on the page.

An apparatus built on that finding checks itself first.
