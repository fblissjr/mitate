last updated: 2026-08-05

# How it got here

Frozen record, assembled 2026-08-02 from four independent passes over the
changelog, the session logs, the commit record, and the pull requests plus
postmortems. See [`README.md`](README.md) for why nothing here settles anything.

**On evidence.** Findings below are marked **[verified]** where they were
re-checked directly against the tree, git, or the GitHub API during assembly,
and **[reported]** where they come from a reading pass that was not
independently re-run. The distinction is kept because this repo's own record
shows that a confident claim written in the same sitting as the work fails at a
measurable rate — roughly four in twenty-three across the one audited set. The
reports that produced this file are exactly that kind of claim.

## The shape of it

**[verified]** First commit 2026-07-24. As of this snapshot: **261 commits over
six working days** across a nine-day span, with a three-day gap covering
2026-07-26 to 2026-07-28. One author throughout.

**[reported]** Commits per active day: 54, 40, 18, 62, 39, 45. Median commit is
~80 lines changed; median gap between commits is under 9 minutes on every day.
The cadence is flat even where the volume is not.

Version numbering makes this look like far more activity than it is, and the
reason is mechanical: **invariant 2 forces a version bump and a changelog entry
for any plugin-content edit**, so the release count measures edits, not
throughput. Six working days produced sixty-plus releases in the `0.16.x` line.

## The eras

**[reported]**, and the boundaries are soft — the honest unit is the working
day, which maps nearly one-to-one onto version ranges.

| Era | Versions | What it was about |
|---|---|---|
| inherited | 0.1.0–0.12.2 | building the engine, under a former name in another marketplace. Phase-numbered capability delivery |
| migration | 0.13.0–0.16.0 | rename, repo split, shipping references that had been cited but never shipped, and the site |
| instrument blindness | 0.16.1–0.16.15 | every check found to be measuring less than it claimed |
| CI arrives | 0.16.16–0.16.29 | first unattended execution, and a five-release misdiagnosis |
| navigation and one-home | 0.16.30–0.16.39 | orientation, glossary, tracked postmortems, claim-homing |
| controls over the tools | 0.16.40–0.16.51 | brackets for the harness, the defect corpus, `--parity-fix` |
| self-check saturation | 0.16.52–0.16.63 | `checkScene` decomposition, checks 9 through 14, the state seam |

**The inversion is the story.** The inherited era ships roughly one capability
per release with review as garnish. The current era ships roughly one
instrument-or-claim repair per release with capability as the exception.

One fact makes that concrete. **[verified]** The **shipped** example corpus is
five scenes, all of which predate 0.13.0, and the only scene added to the tree
since is the defect-corpus fixture, which is deliberately broken and does not
ship. **[reported]** The last *plan-phase* gate declared met is Phase 2; every
"gate met" since has been a restructure gate.

**That is a statement about shipping, not about building, and the difference
matters.** Scenes have been built and run as tests throughout — the corpus
fixture is one, re-skinned from a working film — and the owner's position
(2026-08-02) is that it is too early to ship scenes *reliably*, which is a
judgment about the bar, not an absence of work. Read against `VISION.md` the
order is the stated one: determinism and the harness first, films as the proof.

**What the record does not contain is an evaluation of that trade.** The
open question, in the owner's words: *did we go too far in restructuring and
building checks on top of checks — and what did we gain for all these cycles and
PRs?* It is filed as genuinely undecided rather than answered here, because the
evidence needed to settle it is per-check yield over time, and nobody has
gathered it. See `docs/working-plan.md` under `Open question` for where that
lives and what would answer it.

## Where the cost actually is

**[reported]** Ranked by commits touching a file, the list is nine deep before
anything executable appears. The top entries are `CHANGELOG.md`,
`docs/working-plan.md`, the two version manifests, `docs/restructure-2026-07.md`,
`site/index.html`, and `CLAUDE.md`. Excluding three bulk-import commits, prose
and meta account for roughly 47% of all line churn against roughly 21% for
everything that ships. **61% of non-merge commits touch only `.md` files.**

Two cautions on that ranking, both from the same pass. The version manifests
rank third and fourth purely because invariant 2 couples them into every
plugin-content commit — they carry about three meaningful lines each and are
ceremony, not hotspots. And `docs/restructure-2026-07.md` plus
`docs/working-plan.md` together outrank the changelog, which is a real signal:
the migration document was supposed to delete itself when its last gate went
green and has instead become a second standing backlog beside the first.

## The dominant failure mode, and why the repo's own name for it is slightly wrong

The repo believes its characteristic defect is *a claim with no control over it*.
The record supports the belief and suggests the framing understates it.

**[reported]** Across the `0.16.x` line, at least 70% of releases contain at
least one item that is a broken check, a defective fix, or a corrected claim.
Counted separately, instances where **the instrument itself was wrong** —
independent of any claim about it — outnumber instances of a defective fix by
roughly three to one. The largest bucket is not "we said something untrue"; it
is "the thing that would have told us was broken."

That is corroborated by every other source. **[verified]** A postmortem covering
0.16.57–0.16.62 concludes that *not one defect in that span would have been
caught by reading a diff*, and that four times over the check was broken rather
than the thing it checked. **[reported]** A session log for the preceding day
records that **nine of fifteen findings from a dispatched code review were
controls or claims about controls, not product defects** — described there as
"the shape of this repo's risk."

### The chain nobody had connected

**[verified], and the sharpest single finding in this assembly.**

Commit `2c5742f` (0.16.9, 2026-07-25) carries the subject *"a test-audit of the
only test suite, and what it found green."* In one 94-line change to `smoke.js`
it introduced **both**:

- the `!fails.length` guard on the across-reload determinism check — which read
  `fails` globally, so any unrelated earlier failure silently disabled the only
  check covering load-time nondeterminism. Removed 2026-08-01, in 0.16.61.
- the console allow-list anchoring that the 2026-07-29 postmortem names as the
  origin of the defect which *"failed the entire shipped corpus for seven
  releases"* on the documented CI-safe path.

And that commit was itself the execution of a prescribed corrective action: the
2026-07-25 postmortem's forward item 5 reads *"Run `test-audit` on `smoke.js`.
Trigger already met."*

**So the corrective action prescribed by the repo's first postmortem produced,
in a single commit, the two worst latent defects of the following week.** Each <!--count-mention-->
half has been traced separately — the 2026-07-29 postmortem names that commit
for the console defect, and 0.16.61's archaeology names it for the guard — and
no artifact connects them. The general lesson is already written in the same
postmortem (*"a pass whose purpose is hardening is the most dangerous place to
write an untested assertion"*) and has never been applied to its own
prescription.

### What actually finds defects here

**[reported]**, tallied across the session logs, roughly sixty-five citable
instances of being wrong and catching it. In rough order of yield: running a
control or a mutation test; a repo check or ratchet firing; re-running a
measurement; another agent or a fresh session; the owner; reading the source
instead of assuming. Twice, the catch was that a result was too implausible to
believe — *"seven simultaneous misses after five deliberate edits is
implausible, so the check was the suspect."*

Reading is near-absent from that list, and the logs say so directly: *"every one
of these was found by checking, not by review. The ones I caught myself, I
caught by running something."*

## Review, as an institution

**[verified], and it reframes everything above.** Across all six pull requests
there are **zero reviews and zero inline comments**. Every comment on every PR is
from the repository owner's own account, which is also the author of every
commit. The PR threads are self-authored session narration published under a
review-shaped surface.

**[verified]** PR #1 merged **77 seconds** after opening, carrying 40 files and
over ten thousand added lines — and its own body states that the reason for
opening a PR at all was to watch a deploy preview, which 77 seconds cannot have
served.

So "review" in this repo means one of four things, and they behave very
differently:

1. **Agent review dispatched by the author.** This has the strongest record: one
   pre-merge pass produced fifteen findings and an explicit merge block. It also
   produced a false positive in the same round, and its findings skewed heavily
   toward controls rather than product.
2. **The owner intervening.** **[reported]** The only reviewer whose
   intervention has changed a shipped structural decision — three times on one
   PR, twice correcting a framing the session had inflated by repeating a review
   agent's words without checking them.
3. **Outside reviews**, assessed once and found to have produced *"between them,
   two real defects"* against roughly thirty raised items, while a single run of <!--count-mention-->
   the gate on the default path found a defect that had failed the entire
   shipped corpus.
4. **GitHub review.** Zero instances, ever.

**[reported]** The failure mode specific to (1) is not bad findings but adopted
framing: an agent's *justification* rides along unverified and becomes
structure. One instance reached the changelog and a source-of-truth document
before the owner caught it — recorded at the time as *"one step from inverting
the direction of truth."*

## Things that are true right now and probably should not be

Each verified during assembly on 2026-08-02.

- **`CHANGELOG.md` has an `## unreleased` heading stranded mid-file**, at line
  533, sitting between 0.16.52 and 0.16.51 in an otherwise descending sequence.
  It describes work that shipped. It has survived more than ten subsequent
  version bumps. Nothing checks changelog heading order.
- **Two of the six working days have no session log.** `internal/log/` holds
  four files, for 07-29 through 08-01. The two missing days are the first two —
  together roughly a third of all commits and a larger share of line churn — and
  they are the days the site and the migration were built. The convention says
  one file per working day.
- **A pointer in the earliest log does not resolve.** It cites the
  instrument-hardening postmortem by its old local-only path, which moved to
  `docs/postmortems/` in 0.16.33. The log was committed after the move. Nothing
  covers it: check 3 resolves markdown links and deliberately excludes
  backticked prose, and this is backticked prose. The log for the following day
  diagnoses that exact blind spot.
- **The 2026-07-30 log still opens "No code changed, nothing committed"** while
  the same file goes on to record eight releases, a merged pull request and a
  deleted branch in four appended sections. The 2026-08-01 log names this exact
  shape — *"a dated block appended to a stale summary does not correct the
  summary; it buries it"* — without noticing the instance one file over.
- **A duration claim that no artifact supports ships inside `smoke.js`.** The
  comment explaining the removed guard says it *"survived four months."* The
  guard entered 2026-07-25 and was removed 2026-08-01: **seven days**, in a
  repository whose entire history is eight. The predecessor record spans days,
  not months, and the guard's own archaeology explicitly rules out inheritance.
  The same figure appears in several other places. It is a hand-written number
  in the repository whose most-repeated rule is never to hand-write one.
- **A postmortem forward item points the wrong way with no bridge.** It says
  *"Ratchet `ASSERT_BUDGET` below 46"*; the value is **51**. The rise is a
  legitimate re-baseline — the definition widened to count block comments — and
  that reasoning is written in `selfcheck.js`. It was never annotated onto the
  postmortem, so a reader following the doctrine finds a metric moving away from
  its target and an invariant that reads as violated.

## Two patterns the record shows and no document states

**A control's first unattended run is where its defects live.** **[reported]**
This has now happened at least three times: brackets added to CI failed on their
first CI run with the defect *in the bracket*; a bracket reported its arm count
correctly only once CI ran it; and a guard arm was found to be 3% flaky only
because it failed once and passed once with no code change. The implied rule —
**a control's local green is not evidence about the control** — is not written
anywhere.

**Measurement is used as often to decline work as to confirm it.** **[reported]**
At least eight proposals were killed by measuring rather than arguing: a
container adoption measured and rejected in one session, a documentation split
closed by running the truncation test the plan said had never been run, a
reorganisation retracted when the measuring tool turned out to ignore
`.gitignore`, a scanner design refuted in favour of a generator, a topological
sort refuted by measurement. The repo frames measurement as validation; the
record shows it is at least as valuable as a way of not doing things. This is
arguably the healthiest habit in the corpus and it is nowhere described as a
habit.

## The recurring shape, stated once

Three defects have now been traced to a warning that was written down and never <!--count-mention-->
executed: a description-length limit named in an inherited record with the
closing line *"Nothing in the run's checkpoint checks it"* — and which then went
unchecked here for roughly forty versions; a claim-audit command that *"went
unrun for this repo's whole life despite being written down"*; and the defect
corpus, whose own founding document predicted the fixture it was built to
preserve would evaporate, correctly.

**The dominant failure mode is not missing knowledge. It is knowledge with no
execution path.** The only intervention that has reliably worked is converting
the sentence into a check that runs — which is what the last twenty releases have
mostly been.
