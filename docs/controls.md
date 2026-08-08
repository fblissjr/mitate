last updated: 2026-08-08

# Controls: what makes a check trustworthy here

The door a session walks through before **building, editing, or retiring**
any mechanism that decides something — a check, a bracket, a hook, a
threshold, a reminder, a due-marker. Router-shaped: every principle below
has one home and this file points at it. Two rules have their home HERE and
are marked; for everything else, if this file and the home disagree, the
home wins and this file is the thing to fix.

Born 2026-08-04, the day the owner asked why the harness's doctrine lived in
eight places and its newest mechanism needed a prompted adversarial round to
find three holes the day it was built.

## Before you build

- **Red before green, teeth on edits.** Home: `CLAUDE.md` invariant 6. The
  arm is watched fail against the pre-change state, or the green is a stamp.
- **A verdict states its scope.** A green that ran nothing must be
  distinguishable from a green that ran everything. Homes: `build.js check`'s
  header and scope line; `scripts/run-brackets.sh` (fails on an empty glob).
- **Execute, don't mirror.** A second model of the subject drifts in silence;
  where the subject is kit code, run the canonical copy, and where execution
  would invert a boundary, the mirror is declared a standing review
  obligation instead. Home: `working-plan.md`'s execute-don't-mirror section
  and its mirrors table (which carries the tableValue disposition).
- **Every substitution declares itself.** A stub, a sanitized value, an
  unresolved read: it refuses or it says so in the verdict. Homes: `plan.md`
  REP3; `references/instruments.md`'s declared-substitution paragraphs.

## Before you trust

- **The adversarial round — home is THIS file (owner rule, 2026-08-04:
  "adversarial testing is all we've learned works").** Invariant 6 proves
  the failure modes you thought of; this round hunts the ones you did not.
  Before a new mechanism is called done, attack it as an enemy: spelling and
  formatting variants of its inputs, scan-scope gaps, and above all the
  silent-miss class — an input the mechanism never sees fails no check and
  raises no error. First specimens: the due-marker check's three same-day
  holes (`internal/log/log_2026-08-04.md`), each closed behind an arm
  observed red.
  **The round MUST vary the environment axis, not just the input axis**
  (owner rule, 2026-08-08): context type, tracked vs untracked, laptop vs
  CI — at least one fixture per round from outside the family the author
  built the mechanism against. The evidence is the blank-readback escape
  (postmortem `2026-08-07_session_three-releases-and-a-review.md`): the
  readback discriminator's arms varied fixture *behavior* thoroughly and
  every fixture was a 2D canvas where `getImageData` works, so the input
  class that broke the classifier — an environment variant — was tried only
  by the external review. An adversarial round built from the author's own
  fixture family inherits the author's blind spots; environment variation is
  the half redundancy cannot buy.
- **Controls need controls.** A check rots exactly like the thing it checks.
  Homes: invariant 6's bracket rule; `scripts/bracket-selfcheck.js`'s header
  (born because three checks shipped without one).
- **Signal honesty: never make a check pass by touching what it measures.**
  Homes: `gate.yml`'s runner comment (the purest-form warning) and the
  corpus doctrine in `CLAUDE.md`'s defect-corpus bullet.
- **Emission ≠ delivery ≠ effect.** Proving a mechanism fires is not proving
  it was read, which is not proving it changed anything. Judge the layer you
  measured. Homes: `scripts/claims-reminder.sh`'s delivery-semantics header;
  postmortem `2026-08-03_session_rep2-review-protocol.md`.

## Before you retire

- **Delete, don't tune — but only on a powered comparison. The retirement
  checklist's home is THIS file** (generalized 2026-08-04 from two
  sibling-repo memos, one per checkpoint): a rate-shaped retirement trigger
  states its **exposure basis** and compares per-opportunity, never
  per-calendar-window; its **classifiers are frozen at registration**, never
  chosen on the day; it commits a **minimum sample per window** (10 unless
  argued) below which the checkpoint **extends instead of deciding**; and
  amendments are legitimate only before the window closes. Specimens: both
  2026-08-24 checkpoints (`scripts/claims-reminder.sh` header;
  `working-plan.md`'s muted-blocks row).
- **Disambiguate before ruling:** never-delivered and
  delivered-but-ineffective are different verdicts with different fixes.
  Home: `scripts/claims-reminder.sh`'s header.
- **A permanent red trains route-around.** A control that is red for a
  correct-but-unfixable reason on the surface people watch converts to a
  skip-with-stated-reason, behind its own red-first pass. Homes: the corpus
  doctrine in `CLAUDE.md`; the bracket-noise row in `working-plan.md`.

## What this file is not

Not a summary of the harness and not its roadmap — the queue stays in
`working-plan.md` and the ledger of what each instrument can see stays in
`references/instruments.md`. If a principle here grows an argument, move the
argument to its home and leave the pointer.
