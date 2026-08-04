---
mode: span
scope: project-orientation
date: 2026-08-04
range: 2026-08-03..2026-08-04 (1232664..92bf0e0)
summary: The two days advanced one thing, the checkability of the declared layer (REP2 landed, its review's three defects closed as 0.18.2); the plan/working-plan pair is genuinely maintained by declared precedence rather than merged content, and its one live gap is two stale "0.18.1 cascade" pointers in plan.md's REP stamps, found by this postmortem's own evidence pass.
artifacts:
  - VISION.md
  - docs/representation.md
  - docs/plan.md
  - docs/working-plan.md
  - docs/README.md
  - docs/restructure-2026-07.md
  - docs/postmortems/2026-08-03_session_rep2-review-protocol.md
  - internal/log/log_2026-08-03.md
  - internal/log/log_2026-08-04.md
  - CHANGELOG.md
  - 6f656c1
  - e5d73e9
  - f2ad67b
  - e4cd60f
  - 4cee16e
  - 9f94ab2
---

# Postmortem: project orientation — the whole vs the representation track vs the plans, over 2026-08-03..04

Written to answer an orientation question, so the map comes first and the
findings hang off it.

**The layers, from the top.** `VISION.md` owns why: an engine that turns any
input into a deterministic scene, where determinism is the measuring
instrument, and "declarative" is a claim about structure, not authoring style.
`docs/representation.md` owns the 2026-08-02 decision that operationalizes
that claim: data is what is decidable without running the scene, every end of
decidability is a declared hole, and the kit is emitted from one source.
`docs/plan.md` owns the architecture and the gates, including the REP0–REP6
track that implements the representation decision phase by phase.
`docs/working-plan.md` owns the tactical layer: cross-phase tracks, deferred
items with revival triggers, and the day-to-day queue. `docs/README.md` routes
between all of them.

**The difference between plan and working-plan is declared in both files, in
both directions.** `docs/plan.md` (line 13): "This file owns the architecture
and the phase gates. The current *tactical* plan ... lives in working-plan.md.
Most of that work is cross-phase: it serves every phase and belongs to none."
`docs/working-plan.md` (line 17) points back: "plan.md is the founding
architecture and its phase gates. This is the consolidated *tactical* plan,"
and its mapping table sends each tactical track to the phase whose gate
governs it, on the stated principle that "an item that maps to a phase
inherits that phase's gate." So the pair is not two versions of one document;
it is strategy-with-gates and queue-with-triggers, coherent by declared
precedence rather than by content synchronization.

**Is it maintained? Yes, measurably.** Both files carry freshness markers
current to the range (`plan.md` 2026-08-03, `working-plan.md` 2026-08-04).
`working-plan.md`'s header carries a verified status column added after its
own annotation asserted a state that was false. REP stamps in `plan.md` were
written at landing time on both days (REP2's stamp on 08-03, with its
post-merge queue pointer). The queue section in `working-plan.md` was updated
to LANDED within hours of 0.18.2 shipping (log_2026-08-04). Corrections are
logged rather than silent: 9f94ab2 corrected a hand-written count in the
day's log the same evening it was written.

## 1. What went well

- **The whole span was one coherent motion on the representation track.**
  08-03 morning: 0.17.3 parity findings closed red-first. 08-03 midday: REP2
  landed (6f656c1, merged as PR #10 at e5d73e9) — `check` executes the
  canonical fence store instead of mirroring it, gate held by
  `bracket-check-kit.js` running four divergence cases through both
  instruments. 08-03 evening: the corpus bracket landed as 0.18.1 (f2ad67b).
  08-04: the review's three behavioral findings closed as 0.18.2 (e4cd60f),
  every fix's arm recorded red first. Each step is the representation
  decision's point 1 (declared holes) or point 5 (kit emitted once) becoming
  enforcement rather than prose.
- **The review protocol converted directly into shipped fixes.** The 08-03
  four-pass review found all three behavioral defects via its adversarial
  pass (docs/postmortems/2026-08-03_session_rep2-review-protocol.md); they
  were deliberately kept out of the merge, queued with mechanisms in
  `working-plan.md`, and closed within 20 hours as 0.18.2. Report and repair
  in separate motions, both fully recorded.
- **The plan pair absorbed the churn without drifting apart.** REP2's stamp,
  the working-plan queue section, the router's work-next row, the site's
  REP card, and the CHANGELOG were all updated at their own landing moments
  across the span — five surfaces, one version of events. The single miss is
  filed under Escapes.
- **VISION's honestly-failing criterion moved.** VISION.md's "a declaration
  can be validated before a frame is rendered" is recorded as only partly
  true, and both days strengthened exactly that criterion: REP2 made the
  validator run the kit's real semantics, and 0.18.2 made every remaining
  substitution declare itself (log_2026-08-04). The criterion's honest
  boundary (extents need runtime geometry) is unchanged and stated in
  VISION.md itself.
- **An unplanned rule earned its adoption on measurement.** The cite-or-label
  rule (4cee16e) was adopted mid-span after the 08-03 review measured the
  session's own summary prose as its least reliable artifact — seven drift
  findings on hour-old writing. Its reminder hook fired on 08-04's record
  surfaces and caught a claim written before it was true (log_2026-08-04,
  the "selfcheck green" incident).

## 2. What did not go well

- **The invalidation sweep after 0.18.2 missed the architecture document.**
  The 08-04 landing updated `docs/README.md`, `site/index.html`, and
  `working-plan.md`, but `docs/plan.md` lines 1048 and 1060 still call the
  landed cascade "the 0.18.1 cascade" / "the 0.18.1 queue" — stale the moment
  0.18.1 was assigned to the corpus bracket instead (f2ad67b), and found only
  by this postmortem's evidence pass. Structural version: **a version number
  written into a stamp is a state claim; when the number moves, every stamp
  naming it is invalidated, and only a grep for the number itself — not a
  memorized list of status surfaces — finds them all.**
- **The superseded-parts hazard in working-plan is managed, not solved.** Its
  own header records a fresh session reading 460 superseded lines before
  discovering the restructure plan wins (`docs/working-plan.md` header). The
  mitigation is a warning block plus the router; the actual fix is
  `docs/restructure-2026-07.md` deleting itself when its last gate is green,
  which has not happened yet (R5 remnants remain open).
- **The label collision is a standing comprehension tax.** One letter means
  three things — R0–R5 (restructure gates), Phase R (plan.md's restructuring
  phase), REP0–REP6 (representation track) — and `docs/README.md`'s work-next
  row carries a "label key" precisely because of it. The orientation question
  that prompted this postmortem is the cost showing up live. Inference, not
  measurement: renaming now would churn more record than it clarifies; the
  key in the router is likely the right ceiling.

## 3. Deviations from the plan

| Planned | Shipped | Verdict |
|---|---|---|
| REP2 gate: the review's four divergence cases resolve identically in `check` and a driven page (`docs/plan.md`, REP2) | 0.18.0 (6f656c1), gate held by a standing control (`bracket-check-kit.js`), recorded red on all four first | met, and as a control rather than a stamp |
| Review findings queued as "the 0.18.1 cascade" (`docs/plan.md` REP2 stamp) | landed as 0.18.2 (e4cd60f); 0.18.1 went to the corpus bracket by owner ruling the night before (f2ad67b) | shipped under a different number; the stamp's pointer is now stale (see Escapes) |
| Corpus bracket: a forward item with a "before the next corpus change" trigger | landed 08-03 night, and the wiring corrected the doctrine: the corpus passes smoke, so its purpose was restated from gate-bait to calibration target (f2ad67b, CHANGELOG.md 0.18.1) | better than planned — the measurement fixed a false premise |
| Declared-substitution rule: assigned to REP3 (`docs/plan.md`, REP3) | its first three violations fixed and bracketed in 0.18.2, ahead of REP3 proper; REP3's registry work started (fence-store read enumeration, log_2026-08-04) | partially delivered early |
| cite-or-label rule: not planned at span start | adopted 08-03 on the review's measurement (4cee16e), wired as a hook with its own bracket | unplanned addition, evidence-driven |

## 4. Escapes (tests)

- **The three 0.18.2 defects were green-but-blind escapes of `check`'s own
  arm suite.** `bracket-commands.js` had arms for every property `check`
  claimed to decide, but no arm exercised a bible STYLE with match/fov, an
  unresolved anchor fraction, or a dot-assigned table — so `check` was green
  while wrong in three ways. Caught by the adversarial review pass instead
  (docs/postmortems/2026-08-03_session_rep2-review-protocol.md). Each now
  has an arm, and each arm was watched red against the pre-fix verb
  (log_2026-08-04).
- **The stale plan.md pointers are a process escape from 08-04's own
  invalidation grep.** The grep enumerated status surfaces from memory
  instead of grepping for the moved token ("0.18.1") across all tracked
  prose. No mechanical check covers version pointers inside planning prose,
  and that is by design (`scripts/derived-counts.js` excludes the planning
  documents), so the control is the procedure, and the procedure's scope was
  the defect. Fixed in the follow-up to this postmortem.
- Tests added in the span carry recorded claims: the six
  `bracket-check-kit.js` arms and the two new `bracket-commands.js` arms each
  state what they pin, and CHANGELOG.md 0.18.2 records the red-first runs.

## 5. Forward items

- **Fix `docs/plan.md:1048` and `:1060`** to say the cascade landed as
  0.18.2. Checkable: `grep -n "0.18.1 cascade\|0.18.1 queue" docs/plan.md`
  returns nothing. (Done in the same commit as this postmortem, along with
  two more hits the token-grep found in `docs/working-plan.md`.)
- **Write the tableValue row expansion** agreed on 08-04: conversions
  declined on representation decision points 1 and 2, parser declined on
  execute-don't-mirror and measure-first, revive trigger "a false verdict
  from this reader reaches a shipped film." Checkable: the mirrors-table row
  in `docs/working-plan.md` names all three dispositions and the trigger.
  *(Annotation, 2026-08-04, later the same day: done — the row carries all
  three dispositions and the trigger; landed in the handoff-retirement
  commit.)*
- **REP3 derivation-source question is open with one measurement in hand:**
  the fence store reads 7 of the 12 kit STYLE keys (log_2026-08-04); the
  other 5 are read by template code outside fences. Checkable: the registry
  design names its derivation source and covers all 12, or records why the
  boundary moved. *(Annotation, 2026-08-04, later the same day: answered by
  0.19.0 — consumption is decided by the scene's own text and the store
  supplies the near-miss vocabulary, so all 12 are covered through the two
  sources; the design and its measured basis are in plan.md's REP3 MET
  stamp.)*
- **When the next version lands, run the invalidation grep on the version
  token itself** across all tracked prose, not on a remembered surface list.
  Checkable: the next landing's log records the grep and its hit list.
