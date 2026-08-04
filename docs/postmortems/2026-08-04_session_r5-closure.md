---
mode: session
scope: r5-closure
date: 2026-08-04
summary: The when-absent marker compelled its own pruning atomically at first firing, but its action named no object set, and the move surfaced a live classification conflict — snapshots/ is doctrine-classed as a dated record and scanned as a live-claim surface.
artifacts:
  - docs/physics-bake-proposal.md
  - docs/working-plan.md
  - snapshots/2026-08-04/working-plan-superseded.md
  - scripts/derived-counts.js
  - scripts/selfcheck.js
  - scripts/bracket-selfcheck.js
  - docs/source-of-truth.md
  - docs/controls.md
  - .claude/skills/verify-written-claims/SKILL.md
  - CLAUDE.md
  - CHANGELOG.md
  - 01c18b7
  - 593d2ff
  - 69be60b
  - 945a65b
  - 2fcaaca
---

# Postmortem: the R5 closure session

Scope: the kinematic-body amendment, `restructure-2026-07.md`'s
self-deletion and its `when-absent` pruning cascade, the verification
pass, and the derived-counts cleanup. Four commits, `01c18b7..945a65b`,
all docs and check-prose, no plugin content.

## 1. What went well

- **The due-marker mechanism compelled its own execution, atomically, at
  first firing.** The marker (placed in `2fcaaca`) plus selfcheck check 15
  in the pre-commit hook made it impossible to commit the deletion without
  the pruning — deletion, snapshot move, and marker consumption landed as
  one commit (`593d2ff`) because no other shape could commit. Structural
  version: an obligation encoded as a commit-blocking check does not need
  anyone to remember it; the first real firing confirmed the design.
- **Auditing candidate sections against the tree, not the plan's status
  column, stopped two wrong moves.** A0 read as consumed until its tail
  showed a pre-registered control with a scoring answer key
  (`docs/working-plan.md`, A0's split table); Track D read as executed by
  R5.1 until a grep of both 3D templates returned zero hits for
  `titleCard` and `palette:` — two of its items never shipped. Both stayed.
  Structural version: "the migration executed this track" and "this
  section is wholly consumed" are different claims, and only the tree can
  settle the second.
- **The invalidation grep found a real pre-existing stale claim.**
  Working-plan's NaN section still said "R5.2 unstarted" two days after
  0.16.65 shipped it (`CHANGELOG.md`); annotated in `69be60b`. The
  procedure exists precisely because working-plan is outside every
  mechanical guard, and it produced a finding the first time it was run
  over this ground.
- **Counts were derived at write time, and the verification pass stayed
  clean because of it.** `/verify-written-claims` over the closure diff:
  16 claims, 14 derived against the record, 2 labelled as quotes, zero
  wrong. The deriving commands (CHANGELOG greps, template greps,
  `git show`) had been run before the prose was written, not after.

## 2. What did not go well

- **The marker's action named no object set, and reconstructing it was
  the session's single largest cost.** "Move this file's superseded
  sections" required recovering the criterion from CHANGELOG 0.16.34's
  460-line story, the deleted plan's own status claims, and per-section
  tree checks before anything could move. The mechanism guaranteed the
  obligation fired; it could not guarantee the action was specified.
  Structural version: a `when-absent` action that operates on a set must
  name the set or point at its defining criterion, or the firing session
  inherits a research project.
- **Moving prose between files moved it between check-coverage classes,
  and the first cascade commit failed on it.** "2 of 7 fences" was
  exempt inside `docs/working-plan.md` (on `scripts/derived-counts.js`'s
  HISTORICAL list) and flagged the moment it landed in
  `snapshots/2026-08-04/working-plan-superseded.md`, which is not. One
  commit retry, fixed with a `<!--count-mention-->`. The destination's
  coverage class governs, not the source's.
- **That red exposed a standing classification conflict, found only
  while writing this postmortem.** `CLAUDE.md`'s Map classes
  `snapshots/` as "a dated record, in the same class as `CHANGELOG.md`
  and the logs"; `derived-counts.js`'s HISTORICAL list — whose stated
  purpose is excluding dated records — does not contain `snapshots/`.
  The check and the doctrine disagree about what a snapshot is. The
  count-mention marker treated the symptom. Filed as forward item 1.
- **A hand-written count survived in the checks' own documentation.**
  "The two planning documents" sat in four live carriers —
  `derived-counts.js`'s comment, `scripts/selfcheck.js`'s check-13
  header, `docs/source-of-truth.md`'s coverage paragraph, and
  `.claude/skills/verify-written-claims/SKILL.md`'s verbatim quote — and
  went wrong the moment one planning document deleted itself. Fixed in
  `945a65b` by pointing at the list instead of counting it. Structural
  version: the never-hand-write-counts rule applies with full force to
  the prose *describing the counting machinery*, which is exactly where
  nobody looks for it.

## 3. Deviations from the plan

| Planned | Shipped | Verdict |
|---|---|---|
| Land R5 item 4, the kinematic-body amendment, per the deleted plan's terms | `01c18b7` amends `docs/physics-bake-proposal.md`, dateless per the load-bearing-dates rule, with the joint scope note | as planned |
| Deletion + marker-driven pruning of working-plan's superseded sections | `593d2ff`: three sections moved, three consumed-looking sections kept on tree evidence | as planned, scoped by audit rather than by the plan's own status column |
| (not planned) | `69be60b`: stale "R5.2 unstarted" claim annotated | unplanned, produced by running the standing invalidation-grep convention |
| Residue filed as "remove on the next derived-counts edit" | `945a65b`: removed same session through controls.md's door, plus de-counting four carriers | earlier than its own filing said; the trigger was written to avoid a special trip, and the trip happened anyway because the session had capacity |

## 4. Escapes (tests)

- **"R5.2 unstarted", stale for two days** — no check could have caught
  it: `docs/working-plan.md` is excluded from count/status scanning by
  design, and the exclusion is documented in check 13's header. Not
  green-but-blind; blind by declared scope. The procedural corrective
  (the invalidation grep) is the designated instrument and did catch it.
- **"The two planning documents", wrong in four carriers** — same
  declared blind spot: a count in a noun outside the REGISTRY. Caught
  only because the edit that falsified it happened to be made attentively.
  The REGISTRY approach cannot cover arbitrary nouns and says so; no test
  change follows from one instance.
- **The check-13 red on the snapshot** was a check working, not an
  escape — recorded in section 2 because the *classification* behind it
  is the defect, not the firing.
- No tests were added this session; the two bracket runs
  (`scripts/bracket-selfcheck.js`, 29 arms green before and after
  `945a65b`) were re-runs under invariant 6, not additions.

## 5. Forward items

1. **Align `derived-counts.js`'s HISTORICAL list with `CLAUDE.md`'s
   dated-record class: add `/^snapshots\//`, through `docs/controls.md`'s
   door, bracket before and after.** Refuted if the owner rules snapshots
   should keep live-claim scanning (then `CLAUDE.md`'s "same class as
   CHANGELOG.md" sentence is the thing to amend instead — the conflict
   must resolve in one direction or the other). Done when either edit
   lands; the `<!--count-mention-->` in
   `snapshots/2026-08-04/working-plan-superseded.md` becomes removable if
   the list wins.
2. **Propose to the owner: `source-of-truth.md`'s marker section gains
   one sentence — a `when-absent` action operating on a set names the
   set or its defining criterion.** Doctrine-adjacent, so proposed rather
   than landed. Checkable: the next `when-absent` marker written in this
   repo either satisfies it or this item was declined; wrong-premise if
   no such marker is ever written again.
