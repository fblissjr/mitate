last updated: 2026-08-04

# Brainstorm: the state of the board, 2026-08-04

**A working document, and it settles nothing.** Owner asked for a
brainstorm: the problem/opportunity as the working session sees it, the
paths and their tradeoffs, gaps in the plans, drift found and likely,
over-implementation, and where future problems arise. Every state claim
below was verified against the tree on 2026-08-04, with the command or
source named — nothing is recalled from conversation.

**The graduate-or-die rule, borrowed from `restructure-2026-07.md`:** each
item here either graduates into its proper home (`working-plan.md`,
`plan.md`, an owner decision) with a disposition noted beside it, or dies
here. When every item is dispositioned, this file is deleted. A brainstorm
that lingers becomes a second copy of the plans it fed.

---

## 1. The problem/opportunity, in one paragraph

The apparatus has outrun the product. Zero new example films have shipped
in the repo's life — every file in `plugin/skills/mitate/examples/` was
added by the single 2026-07-24 migration commit
(`git log --diff-filter=A -- plugin/skills/mitate/examples/`, one commit) —
while the caught-defect record runs roughly 4 product to ~25 meta
(`docs/representation.md`, "Where defects actually come from"). Meanwhile
REP1–REP3 landed on three consecutive days (plan.md stamps: 0.17.0,
0.18.0, 0.19.0), so the instruments are the strongest they have ever been
and a film is the cheapest it has ever been to make *correctly*. The
opportunity is that the next film is simultaneously: product evidence,
the first end-to-end exercise of the REP work, fuel for the pattern
ledger (REP5's gate is unfireable without films shipping), and — if built
by a fresh session from the docs alone — the deferred VISION criterion
test ("a session arriving with no context can find what it needs and act
correctly"). The risk of not taking it: VISION's flywheel ("capturing a
pattern should be a side effect of making a film") has had nothing to
grind for eleven days.

## 2. The paths, and their tradeoffs

Three live candidates, not mutually exclusive — the real question is
ordering.

**A. REP4 (derived extents) first.** For: the highest recorded product
defect class (hand-declared extents wrong 3 of 5 in plan.md's promotion
worked-examples; ledger count 6; breakdown.md calls it "the layer's most
expensive gap"); the red-first fixture already exists and is already
pinned (`bracket-corpus.js` row 11 arm, green in today's gate). Against:
it is another meta phase on top of eleven meta days, and it carries the
track's hardest design tension — deriving extents means measuring
geometry, measuring geometry is `probe`'s territory, and `probe`'s
exception to the prime directive lapses if it enters "a pipeline that
produces an artifact" (CLAUDE.md, prime directive). A derivation step
that writes extents into `SUBJECTS` walks up to that line. The binding
terms are in `representation.md` decision point 4; the design session
reads those first.

**B. A film first.** For: everything in section 1. A Phase-3/4 portfolio
film (`the-briefing`, `rube-goldberg` — plan.md's test-case portfolio) or
a small commission-register short. Run it as the cold-start variant and
it doubles as the deferred docs-only test (postmortem 2026-08-03, forward
item 6). Against: the extent-defect class REP4 exists for is still
unguarded, so the film will likely hit it — though hitting it under
instruments that can *measure* it (probe) is also exactly the motivating
evidence REP4's design wants fresh.

**C. Phase 4 via R5's remnant.** The owner's standing capability
priority (plan.md: "Phase 4 moves ahead of Phase 3"). The cheap first
step is R5 item 4, the kinematic-body amendment to
`physics-bake-proposal.md` (a document edit), which also moves
`restructure-2026-07.md` toward its self-deletion gate — R5's open items
are that amendment plus the deliberately-unpromoted `hide`/
`subjectFromObject` half (restructure current-position block). Against:
the bake is the project's biggest build; starting it with zero films
shipped on the new instrument stack means its acceptance film
(`rube-goldberg`) is also the first film through everything else.

**The lean, stated as a lean:** B, then A, then C — with C's document
amendment (R5 item 4) done any time it is convenient, since it is small
and unblocking. A film first converts the meta investment into observed
value, feeds REP4's design with a fresh motivating instance, and tests
the docs cold. The counter-argument (ship the guard before the film that
needs it) is real; it is the owner's call, which is why this is a
brainstorm item and not a working-plan edit.

**DECIDED 2026-08-04 (owner): B — diverse scenes from the test-case
portfolio first.** The router's work-next row carries the queue
(`market-crash`, `boss-intro`, the 2D-explainer rung as the in-reach
picks); REP4 follows; C's amendment lands whenever convenient.

## 3. Gaps in plan / working-plan, verified

- **VISION's failing "determinism magnitude" criterion has no owning
  item.** VISION.md names it a criterion and says plainly it is still
  false ("a determinism failure reports that it happened, not how large
  it was or where"). Grep for `magnitude` in `docs/plan.md` and
  `docs/working-plan.md` (2026-08-04): zero relevant hits. A recorded
  failing success-criterion with no queue slot is a criterion on its way
  to being quietly dropped — the exact failure VISION's own list warns
  about. *Disposition: FILED 2026-08-04, with the owner's same-day
  clarification recorded in the row and in VISION — determinism exists so
  the tooling itself can be evaluated across versions, which needs
  "roughly the same" to be checkable, and magnitude-with-location is the
  instrument for "roughly".*
- **The 2026-08-24 muted-blocks count lives only in a local file.** The
  claims-reminder evaluation half is tracked (postmortem 2026-08-03,
  forward item 3; procedure in `scripts/claims-reminder.sh`'s header).
  The second half — counting violations of what the muted dev-conventions
  blocks used to say, which decides an ambient-tier question in the
  skills repo — appears in no tracked file (grep `muted` across
  postmortems and working-plan, 2026-08-04: nothing). It existed only in
  `internal/handoff_next-session.md`, a file whose own rule was that it
  gets replaced. *Disposition: GRADUATED same day — a dated row in
  working-plan's deferred table, filed when the handoff was retired.*
- **Working-plan has no pruning plan for itself.** 3,413 lines
  (`wc -l`, 2026-08-04), with superseded sections guarded by header
  warnings — the recorded cost is a fresh session reading 460 superseded
  lines (its own header). The mitigation is gated on
  `restructure-2026-07.md` deleting itself, which is gated on R5's
  remnant. *Disposition: no new item — one more argument for closing R5,
  which section 2C already carries.* *Later the same day, twice: first the
  guarantee became mechanical (the pruning is a `when-absent` marker in
  working-plan that fires the moment the restructure doc self-deletes);
  then the owner's load-bearing-dates rule removed the invented 2026-08-08
  date that had briefly sat on R5's closure — the closure is the router's
  near-term queue item, its ratification recorded in the restructure doc's
  current-position block, and the only dates left in markers are ones
  where the date itself is the instrument.*

## 4. Drift found this span, and where it strikes next

Found and fixed across 2026-08-03..04 (receipts in the span postmortem
and today's log): version-token staleness (plan.md twice, working-plan
twice, docs/README once — all said "0.18.1" for work that landed as
0.18.2) and control-existence claims (static.yml asserting
`bracket-corpus.js` unbuilt after it shipped; instruments.md's SIZES
sentence). Two transferable classes, both now carried by a control or a
procedure: grep the moved version token itself across all tracked prose
(postmortem forward item), and `.github/workflows/*.yml` added to
audit-claims' blind-spot routing.

Where it likely strikes next, measured:

- **The provenance-window class has a queue.** References accumulate
  dated amendments above their "Not here" edge until the edge leaves
  selfcheck's 2500-byte header window. instruments.md hit it this
  morning (fixed by moving the edge up); breakdown.md sat 325 bytes from
  the boundary this afternoon (byte-offset scan over every reference,
  2026-08-04) and was moved preemptively in 0.19.1. Every other
  reference sits under 1,700 bytes. The structural fix — edge directly
  after the founding provenance paragraph, amendments below it — is now
  the shape of the two files that matter; adopt it opportunistically
  when a reference gains its next amendment. *Disposition: convention,
  not machinery; noted here and in the two fixed files' structure.*
- **Gate cost is creeping.** gate.yml's comment says ~6m30s (measured
  2026-08-02, dated, so not false). The last four green runs took
  7m01s–7m48s (`gh run list` timestamps, 2026-08-04), with
  `bracket-corpus.js` disclosing ~2min of that at its own site. The
  repo's own doctrine says a slow gate is one people route around.
  *Proposed disposition: a watch threshold, not work — revisit the
  gate's composition when a green run first exceeds 10 minutes.*
- **The handoff memo rots by design — RETIRED 2026-08-04 (owner).** Its
  predecessor "rotted four times in one day" (its own header); it failed
  spine rule 0 (gitignored, so unreachable from any clone, and nothing in
  CLAUDE.md pointed at it — a session had to be told it existed); and it
  grew the untracked obligation in section 3. The convention it replaced
  is the one that stays: orientation is `docs/README`'s work-next row
  plus the day's log, both tracked and guarded. The film field report
  ("names what its author built twice", `pattern-ledger.md`'s input) is a
  different convention and lives on — called a "film handoff" in older
  records, renamed and defined at its home 2026-08-04 after the owner
  reasonably asked what it even was. *Disposition: done — memo deleted,
  unique content graduated, the surviving convention named and defined,
  memory notes updated.*

## 5. Over-implemented, or soon to add little

Candidates examined honestly; most of the apparatus survives the look.

- **The claims-reminder machinery already carries its own sunset.**
  Delete-don't-tune on 2026-08-24 if the correction rate is unchanged
  (script header; postmortem forward item 3). Nothing to do early —
  judging it now would repeat the emission≠delivery≠effect collapse the
  record warns about. *Amended later the same day (the skills repo's
  second denominator memo): the comparison as first registered was
  calendar-normalized — the underpowered-zero flaw in retirement
  clothing. Now corrections-per-opportunity, classifiers frozen, minimum
  exposure 10 per window or the checkpoint extends. The procedure's home
  is the script header; the retirement checklist it instantiates is in
  `controls.md`.*
- **`bracket-noise`'s claims-webgpu arm is a standing local red** on
  WebGPU-native machines (filed, CHANGELOG 0.17.2). A permanently red
  arm on developer hardware trains exactly the route-around behavior the
  corpus doctrine names ("a gate red for a correct reason is one people
  learn to route around"). Candidate: skip-with-stated-reason on
  hardware-WebGPU machines while CI keeps the real arm — but that edit
  touches signal honesty and deserves its own red-first pass.
  *Disposition: FILED 2026-08-04 — a working-plan deferred-table row,
  revived by the next bracket-noise edit or a second same-week bite.*
- **Working-plan's superseded bulk** — value already declared decaying;
  covered by 3 above.
- **Not over-implemented, checked:** every bracket has a failing exit
  path (selfcheck asserts it, and owns the count) and each names a
  defect it caught or pins; none reads as decorative. The doc mass outside
  working-plan is either dated record (fine by class) or routed.

## 6. Future problems and opportunities not yet on a queue

- **Install-cache growth just changed slope.** Examples are ~5.5 MB of a
  ~5.8 MB plugin subtree (plan.md's examples policy, re-measured
  2026-07-25), and `plugin install` caches per-version. Three cached
  versions measured 18 MB when releases were occasional; 0.17.0 → 0.19.1
  landed in three days. Daily releases multiply cached copies of the
  same 5.5 MB of films. The deferred `examples-placement.md` option E is
  blocked on exactly one thing: the owner's fixture-vs-example call
  (working-plan deferred table). *This decision's price went up this
  week; worth a fresh look.* *Disposition: DECIDED 2026-08-04 (owner) —
  option E, executed with the first new portfolio film; full terms and
  the due-marker guard live in `examples-placement.md`.*
- **REP5 is film-starved by construction.** Its gate ("a migration
  proposal arrives with its trigger evidence attached, without a human
  going looking") requires films recurring shapes — see section 1.
  *Resolved by the section-2 decision: films first, each ending in the
  method's field report.*
- **Shared-checkout coordination remains manual.** An uncommitted
  `.gitignore` edit (`.archive/`) from another session sat in the tree
  today and was nearly swept into a release commit by `git add -A`
  (caught, unstaged, left in place per the by-path etiquette). The
  etiquette held, but only because the diff was read. *Disposition: none
  proposed — the memory rule "stage by path" is the control; this is its
  incident log entry.*
- **The label collision (R0–R5 / Phase R / REP0–REP6) has a demonstrated
  cost** — the orientation postmortem records the owner losing the plot
  as its live instance — and a declared ceiling (the router's label
  key). Renaming would churn more record than it clarifies. *Dies here
  unless a second confusion instance argues otherwise.* **The second
  instance arrived the same day** (owner, 2026-08-04: "did we actually
  finish the R(x)'s from representation.md?" — the R-gates belong to the
  restructure plan, not the representation track, and the two tracks
  never block each other). *Revised disposition: still no rename — the
  cheaper resolution is closing R5's remnant, which lets
  `restructure-2026-07.md` delete itself and retires the R-label from
  the live doc set entirely. The router's work-next row now says so.*

## 7. What this document proposes, compressed

1. Owner picks the section-2 ordering (lean: film, then REP4, with R5's
   kinematic amendment whenever convenient). (DECIDED 2026-08-04: films
   first, from the test-case portfolio.)
2. Two one-line working-plan additions: the determinism-magnitude
   deferred row (DONE 2026-08-04, with the owner's clarification), and
   the 2026-08-24 muted-blocks count line (DONE — landed with the
   handoff retirement, then amended with the skills repo's denominator
   memo: violations over opportunities, per class, minimum exposure 10).
3. One small filed item: the bracket-noise local-red ergonomics (DONE —
   filed in working-plan's deferred table, 2026-08-04).
4. One refreshed owner decision: examples-placement, repriced under
   daily releases. (DECIDED 2026-08-04: option E, with the first film —
   recorded in `examples-placement.md`.)
5. Everything else here either already happened (breakdown's edge,
   0.19.1) or dies with this file.

