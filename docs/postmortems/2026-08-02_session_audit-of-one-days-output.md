---
mode: session
scope: audit-of-one-days-output
date: 2026-08-02
summary: A day's output was audited the same day by the instrument built for it. Ten drifts, nine authored that day, in work produced under unusual care. Three came from trusting a derived answer instead of the source — a truncated grep, a false-positive grep, and a figure inherited from an agent. The most serious finding was not drift at all but a code defect a reading pass would have missed, found only because one auditor was told to test rather than read.
artifacts:
  - plugin/skills/mitate/templates/build.js
  - plugin/skills/mitate/references/breakdown.md
  - plugin/skills/mitate/references/instruments.md
  - scripts/selfcheck.js
  - VISION.md
  - docs/representation.md
  - fixtures/defect-corpus/README.md
---

# Auditing one day's output, on the same day

`/audit-claims` had never been run at scale. On 2026-08-02 it was pointed at a
sixteen-commit branch spanning four versions, written that day, under more
deliberate care than usual — every figure measured, several agents verified
before use, red-before-green observed on every check.

**It found ten drifts. Nine were authored that day.**

That is the finding. Not that the work was careless — it was not — but that a
day's output produced under care still contained ten claims that disagreed with
the code, and that a same-day audit was cheap enough to find all of them.

## What was found

| # | where | drift |
|---|---|---|
| 1 | `build.js check` | **a code defect** — reports `ok` on a table it could not read |
| 2 | `selfcheck.js` check 12 | the stated LIMIT names the opposite hazard from the real one |
| 3 | `bracket-driver.js` | a false duration corrected in one shipped file that same day, missed in the other |
| 4 | `VISION.md` | a success criterion asserted "currently false" that a later commit made mostly true |
| 5 | `instruments.md` | understates the hole in (1), in the file whose subject is what a check cannot see |
| 6–7 | `breakdown.md` | two `CONFIG` keys' template scope wrong |
| 8 | `breakdown.md` | 2D camera described as linear; it is smoothstep-eased |
| 9 | `SKILL.md` | routes a reference by a description its own commit had inverted |
| 10 | corpus README | a base count contradicting the table below it, twice, both exempted from the count check |

## The three shapes of trusting a derived answer

This is the transferable part, and all three are the same mistake wearing
different clothes: **a command's output was treated as the fact, instead of as a
lossy view of the fact.**

**Truncation.** The `CONFIG` scope claims (6–7) came from a grep run with
`| head -6`. It returned exactly six lines, all from two files, and the third
file's four matches were cut off by the cap. The cap was mine and I read past it.
This is the `| tail` failure this repo already has a standing note about, in a
new costume: not "the pipeline reported the filter's status" but "the pipeline
reported a truncated set and nothing said so."

**A grep that matched the wrong thing.** A count of brackets lacking a derived
tally was reported as "8 of 9" from a regex that false-positived on unrelated
string interpolation. The correct figure — 3 — had already been obtained by
*running the brackets* an hour earlier. The wrong number displaced a right one.

**An inherited figure.** `docs/representation.md`'s "4–8% of authored content is
already literal tables" was carried from an agent's report into a tracked
document without recomputation. Two later independent recounts disagree with each
other *and* neither reaches the upper bound. The number was not wrong so much as
**travelling without its definition**, which `source-of-truth.md` already has a
rule about.

**The pattern:** in all three, a cheaper derived answer was available and was
taken. The corrective is not "grep more carefully" — it is that a number entering
a tracked file is either derived by a command the file names, or recomputed at
the point of writing. Two of the three would have been caught by re-running
without a cap.

## What only testing found, and why it matters most

Finding (1) is not drift. `build.js check` — a validator shipped that same day,
whose entire purpose is catching table errors before a frame renders — **reports
`check: ok — 0 errors, 0 warnings` on a scene whose `SHOTS` table it could not
parse.** A loop-built table yields `0 shot(s)` and a green verdict.

Three things about how it was found:

- **No check in this repo could reach it.** It is a semantic hole in a new tool,
  invisible to `selfcheck`, parity, and every bracket.
- **A reading pass would very likely have missed it.** The code is correct-looking;
  the absent case is the one nobody writes a line for.
- **It was found because one auditor was instructed to test rather than read** —
  to construct an adversarial input and run it. That instruction is the entire
  difference between finding it and not.

And the shape is one this repo had already named and fixed **that same morning**,
one tier up: a control whose green cannot be distinguished from a run that
checked nothing. `--parity-only` prints its file count for this reason; the
brackets gained derived tallies for this reason. The validator shipped hours later
with the same hole. **Fixing the instances did not prevent the next instance**,
which is the 2026-07-30 postmortem's conclusion recurring, on a document written
by someone who had read it.

## What this says about the instrument

`/audit-claims` earned itself here, and the manner matters: **the auditors that
produced the most valuable findings were the ones given explicit quoted claims
and told to verify empirically.** The skill says this — *"Give it the specific
claims, not a directory — a vague scope returns a vague answer"* — and the
difference was visible. The auditor handed a list of quoted sentences plus
instructions to run things returned a code defect. The same instrument pointed at
a directory would have returned prose.

Two of four auditors also produced findings I had to narrow when checking them
myself, which is why the skill's "weigh every finding against the code yourself"
step is not ceremony.

## What it says about review, against the previous postmortem

`2026-08-01_session_what-caught-the-defects.md` concluded that **not one defect
in the span it examined would have been caught by reading a diff.** This session
is consistent with that and sharpens it:

- The nine doc drifts were all findable by reading — *but only by reading the
  claim against the code*, which is not what a diff review does. A reviewer
  reading this branch's diff would have seen plausible prose.
- The one code defect was not findable by reading at all.

So the earlier postmortem's conclusion holds, and the useful refinement is that
**"review" splits into three instruments with different yields**: reading a diff
(near zero here), reading a claim against its code (nine findings), and
constructing an adversarial input (one finding, the only one that was a defect
rather than a description).

## ANNOTATION, same day — a third instrument, and the class was still open

A targeted code review ran after this postmortem was written, pointed not at the
diff but at **`build.js check`'s reimplemented semantics** read against the
`KERNEL` and `SOLVER` fences it mirrors. It returned **fifteen findings**.

**That is a fourth instrument and it out-yielded the other three**, which revises
this document's own §"What it says about review". The list is now: reading a diff
(near zero here), reading a claim against its code (nine), constructing an
adversarial input (one, the only defect), and **reading a control against the
thing it reimplements (fifteen)**. The last is the one nothing had tried.

Two of the fifteen were fixed immediately (0.16.70) and both sharpen this
postmortem's existing conclusions rather than adding new ones:

- **A false ERROR on a valid scene**, in the verb wired into CI on every push
  hours earlier. `dur: SOME_CONST` is ordinary authoring; the unresolved-identifier
  proxy made it read as invalid. So the day's own new CI step carried a live
  false-positive risk from the moment it landed.
- **The silent-green class this postmortem opens with was still open.** 0.16.68
  closed it for loop-built tables and its commit message said the class was shut.
  A table whose literal cannot be *sliced* took the other door and printed
  `no SHOTS (2D)` under a clean green. **Third time in one day that fixing the
  instance did not close the position** — which is the 2026-07-30 postmortem's
  verdict recurring for the third consecutive session, now with a same-day
  instance inside the document describing it.

The remaining thirteen are filed rather than fixed. Their shape is uniform and is
the finding: `check` reimplements the kit in order to validate it, **and nothing
proves the two models agree**. Divergences run both ways — it passes what the
solver throws on (a missing `size`, an empty `SHOTS`, `subject: []`) and fails
what the kit accepts (prototype-named beats). `plan.md:772` already names this
trap: *"a control that rebuilds its subject verifies a reimplementation."* The
trap is unavoidable here — `check` is static and cannot call `beatAt` — so the
mitigation cannot be "do not reimplement"; it has to be a control that compares
the two models, and no such control exists.

## ANNOTATION, same day, second session — the instrument re-run, and the class re-confirmed

Forward item 4 (run `/audit-claims` at the end of any day that produced a
reference) was executed at the end of the day's second session, over the
representation-decision diff plus `.claude/` and `.github/` — six auditors,
each given quoted claims and told to test. **Eight findings, all fixed the
same session.** Two results extend this document rather than merely repeating
it:

- **Five of the eight were the same defect wearing a new coat: prose made
  false by a decision landing hours after it was written.** The
  representation decision was recorded mid-session, and the freshest documents
  — written that morning, under care, by a session that had read this
  postmortem — still described the question as open, pointed a method citation
  at the wrong file, and cited a finding recorded only in an untracked memo.
  The corrective that transfers: **when a decision lands, grep the same day's
  output for the framing it invalidates.** The newest prose is the most likely
  to be wrong about it, precisely because it was written closest to the
  change.
- **The adversarial-input instruction again produced the only code-behavior
  findings.** Reading passes returned prose drift; the auditor told to
  construct hostile inputs against `scripts/emit-spike.js` returned four
  reachable failure-shape gaps (silent green over a shrunk scope, wrong-blame
  crash, uncaught refusals, duplicate fences accepted) — the same
  instrument-yield ordering this document reports, reproduced on a tool that
  was one day old.

Two auditors' verdicts were narrowed on checking, consistent with the "weigh
every finding yourself" step: one reported a live exit-condition term as dead
code when it guards the round-trip machinery rather than content divergence,
and one finding's premise (a comparison bracket as the fix) had been
overtaken by the recorded decision's structural alternative.

## Forward items

1. **Fix (1) by making `check` state its scope** — the same corrective already
   applied to `--parity-only` and the brackets. Ship (4), (5) and (9) with it:
   each describes what `check` covers and would otherwise be wrong in a new way.
   *Done if:* a scene with an imperatively-built table produces a warning naming
   the table, and a green verdict states what it covered.
2. **(2), (3), (10) separately**, each with its own reason. *Wrong-premise if:*
   bundling them turns out to cost less than the blurring — this is a judgment,
   not a measurement.
3. **Decide whether `count-mention` needs a guard.** Finding (10) was exempted
   from the count check by a marker applied to a wrong number — the escape hatch
   used to exempt an error. *Refuted if:* a survey of existing `count-mention`
   uses finds no other instance, which would make this a one-off rather than a
   shape.
4. **Run `/audit-claims` at the end of any day that produced a reference.** The
   cost here was four parallel agents and roughly an hour; the yield was ten
   findings, one of them a shipped code defect.
5. **Build the control that compares `check`'s model to the kit's** — the thirteen
   open findings are all instances of its absence. *Done if:* a bracket arm drives
   a scene in a page and asserts that `check`'s resolved anchors, spans and rung
   lookups equal the kit's for the same tables. *Refuted if:* the two cannot be
   compared without loading the page, which would make `check` and `smoke` the
   same instrument and this verb's static premise wrong.
   *(Disposition, 2026-08-02 evening: superseded unfired. The representation
   decision's structural path — `check` reading the same canonical fence store
   the kit is built from — replaces the comparison; the record is `plan.md`'s
   representation track, REP2, whose stall trigger existed to fall back to
   this item and never fired.)*
6. **Point a review at a control against the thing it reimplements**, on anything
   else that mirrors kit logic. It out-yielded every other instrument tried here
   and nothing had tried it.
