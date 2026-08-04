last updated: 2026-08-04

# Snapshot, 2026-08-04: the restructure plan retires

A dated record, in the same class as `CHANGELOG.md` and the session logs —
it settles nothing and is never the tiebreaker. It exists because
`docs/restructure-2026-07.md` deleted itself today per its own retirement
rule ("delete this file when R5's gate is green"), and two things needed a
tracked home that would otherwise have died with it or been lost from the
pruned working plan.

## The closure record

**R5 closed 2026-08-04.** Final state, carried out of the deleted file's
current-position block:

- **R5.1** partly shipped (0.16.62): the `setCamera(state)` seam across 8
  carriers, and the `gaitPose` `rootX` hazard fixed. Its unpromoted half —
  `hide(obj,u)` and `subjectFromObject` — was **closed by owner
  ratification, 2026-08-04**: the evidence-based declination stands (the
  ledger evidence lived in a local-only prototype and the presence-idiom
  count was wrong ×7 vs ×11), so the gate is satisfied as a recorded
  disposition rather than as shipped code. Promoting either later means a
  separate change with its own red, not a bundle.
- **R5.2** done (0.16.65): `references/breakdown.md`.
- **R5.3** done (0.16.67): `build.js check` — with declared-versus-measured
  extents BLOCKED on the probe exception, and "`BEATS` sums to `DURATION`"
  unrepresentable by construction.
- **R5 item 4** landed 2026-08-04 (`01c18b7`): the kinematic-body amendment
  to `docs/physics-bake-proposal.md`, deliberately dateless.

R0–R4 were already met and recorded in `CHANGELOG.md` (0.16.30 through
0.16.54); the CHANGELOG entries are the migration's permanent record, per
the deleted plan's own retirement clause. The R-label (`R0`–`R5`) leaves
the live doc set with this closure; `Phase R` (`plan.md`) and `REP0`–`REP6`
(the representation track) remain live and were never the same thing.

## The pruning

[`working-plan-superseded.md`](working-plan-superseded.md) holds the three
working-plan sections moved here by the `when-absent` marker that fired on
the deletion, with the selection criterion stated at its top.
