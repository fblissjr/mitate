last updated: 2026-07-25

# Working plan: instruments, routing, and the viewer

[`plan.md`](plan.md) is the founding architecture and its phase gates. This is
the consolidated *tactical* plan that came out of the 2026-07-25 sessions — the
first film built at ~3x the length of any shipped example, a viewer prototype,
and an audit of [`source-of-truth.md`](source-of-truth.md) against the tree.

**About half of this is not new ground — it is executing against a roadmap that
already exists**, and that discovery reorganized the document. Track C is Phase 6
under a different name (`museum-walk` is already in the test-case portfolio as
"same kernel, input driver instead of timeline driver"). The deferred type
primitive belongs to the existing three-tier chart pipeline. The "get more
evidence" recommendation is the portfolio. **An item that maps to a phase
inherits that phase's gate, and a gate is a stronger commitment device than any
trigger this document can write for itself.**

| item | maps to |
|---|---|
| Track A (instruments), Track B (routing) | no phase — cross-cutting, ranked by the spine |
| Track C (viewer + camera bake) | **Phase 6** (`museum-walk`), and the camera bake de-risks **Phase 4** |
| Track D (kit) | no phase, but `STYLE.palette` discharges a 0.9.1 carry-forward |
| type primitive (deferred) | the **chart tier** — chart before showcase before film |
| paths-nothing-exercises sweep (below) | no phase — see [Evidence](#evidence-calibration) |

So: **let the gates rank what maps, and the spine rank what doesn't.** Read
[the spine](#the-spine) first — it is one criterion, and without it the
unmapped half is a wish list.

---

## The spine

Four times in one session, an agent that had **read** the relevant rule broke it
anyway: a single-frame no-pops claim, a rate inferred off a block-buffered
progress counter, a 40-60s loop cost from recollection, and a doc line proposed
as the fix for a friction problem. The consistency is the finding, not the
carelessness — each time, the wrong move was the cheap one at the moment of
choosing.

**The precedent is what makes this a finding rather than an anecdote.** The same
class was diagnosed a lineage earlier, in writing, with the mechanism named:
five rounds were spent tuning multipliers before anything was measured, each
round made the scene worse, the fix took minutes once the offsets were read —
and it was *"committed by the author of the pass that added the measuring
instruments, in the same session."* The conclusion drawn then: **"the pull toward
tuning a coefficient is strongest exactly when a thing is nearly right, and that
is the moment to stop and instrument."**

That was written down. It was carried into `predecessor-record.md`. And the class
recurred four times in the successor project anyway. **That is the strongest
evidence the spine could have, and it is historical rather than n=1** — it does
not merely assert that prose loses to friction, it is a recorded instance of
this exact prose losing.

**The lineage supports a stronger statement, and it is the parent of the other
two.** Three things that already existed were unreachable from where the work
happened, and each was therefore re-derived, rediscovered, or never used:

> **0. A practice, a decision, or a tool that cannot be reached from where the
> work happens does not exist.**

- A **technique** — `Box3` probes — documented with no tool. Re-derived, then
  skipped for a whole film.
- A **decision** — "the palette moves into `STYLE`, on this trigger" —
  dispositioned in a plan nobody hits at authoring time. Rediscovered as a fresh
  finding.
- A **tool** — `film-reviewer`, which *gates two phases* and has the best measured
  catch record in the project — not shipped, not routed, and unknown to the
  people it was built for. See A0.

Everything below is one of two interventions under that parent, and nothing else
earns a slot:

> **1. Make the correct move the cheap one.** A documented practice that costs
> more than the mistake it prevents is not a practice, it is a wish.
>
> **2. Deliver the fact at the moment of use.** A correct rule in a bibliography
> arrives after the decision it governs.

A third rule follows from the measurements and settles most of the ranking
disputes below:

> **The scarce resource was never throughput — it is attention allocation.** A
> review round costs 1.8s on hardware WebGPU. Eight rounds converged the
> composition axis. The two defects that survived to the delivered MP4 were both
> found by an instrument run *once*, on a hand-picked window. Cycles were never
> binding. Knowing where to look was.

So: prefer tools that **aim** an existing instrument over tools that add a new
one, and prefer routing changes over new prose. Restructure the docs, but do not
expect them to carry load the tools should be carrying.

---

## Where the tree stands

**0.16.1 landed (commit `7250546`)** — the live-playback gate. Every template
starts playback with `if(!location.search.includes('record'))requestAnimationFrame(loop)`
and all three tooling loads carry `?record=1`, so the path every viewer takes was
executed by nothing in the pipeline. `smoke.js` now loads each scene once without
`?record=1`, wraps `seekTo`, and asserts 3+ calls and 2+ *distinct* `t` —
distinct rather than rising, because a viewer-driven or wrapping clock is not
monotone; counted after the inner call returns, so a throwing `seekTo` cannot
inflate past the count arm; agnostic to which loop drives, because more than one
thing already replaces the built-in one. Bracketed four ways, quiet on all five
examples and the 2D template. The same change closed the one host configuration
neither instrument reaches: `site/app.js` replaced the loop *and* swallowed
`seekTo` exceptions at two sites, so a dead film kept a healthy-looking scrubber.

That is the shape every item below is trying to be: a blind spot closed by
construction, bracketed both ways, quiet on the corpus.

---

## Ancestry: what this plan is rediscovering

**Most of this plan has an ancestor**, and the ancestors are better argued than
the rediscoveries because they were written against more films. The record was
preserved; the *backlog* was not — `predecessor-record.md` is 2,765 lines that
read as "what happened," so nothing carried its open structural items into a
roadmap. This session paid to re-derive several of them.

Every item below carries its ancestor and status. **Adding a row is mandatory for
any new item**: if it has no ancestor, say so, because that is itself
information.

| item | ancestor (hardening plan, 2026-07-22) | status |
|---|---|---|
| A1 `probe` | `build.js kinematics`, the state-space probe — **bracketed**: boundary/interior 1.0001 vs 0.0531, spread 1.003x vs 72.7x, on scenes `motion` called indistinguishable | **declined on earn-in, then dropped in migration** — see A1 |
| A3 self-reporting | *"Every check states its plan and prints the samples it used. A green result becomes auditable instead of authoritative"* | **partial** — see A3 |
| D `subjectFromObject` | *"Structural: declarations are never checked against the thing they describe"* | **specified, never built, and a comment claims it shipped** |
| B5 `txt()` / `strip=text` | *"Structural: make the text helper good enough that turning text off is possible"* | **half-built** — 2D got both parts, 3D got the instrument only |
| B4 limit-wins | *"Root cause 2 — vocabulary that promises more than it measures"* | inherited diagnosis, new tiebreaker |
| the spine | *"the pull toward tuning a coefficient is strongest exactly when a thing is nearly right"* | **written down, then violated four times in the successor** |
| deferred: occlusion linter | *"No register-aware lint engine. Two candidate instances exist; no film has been blocked. Revisit when one is."* | inherited decline, same earn-in shape as A1 |
| deferred: `shapes.md` | *"No content templates, scene presets, or genre scaffolds. This is the line that protects 'any scene you want'."* | inherited decline — **and a doctrinal one**, cited by the Anti-template principle |
| deferred: 2D pan/zoom (owner's-call 4) | *"No 2D shot solver.* The film built to want one concluded the `{x,y,zoom}` rail was expressively sufficient" | inherited decline, with a recorded alternative |
| Track C viewer | none in the hardening plan; **`museum-walk` in the portfolio** | Phase 6, arriving early |
| A2 `transitions` | **0.5.1** — smoke began sampling transition windows after review found no fixed-fraction sample ever landed in a blend window | **export shipped, the sweep did not** |
| A0 ship `film-reviewer` | gate criterion at `plan.md:460`; catch record in 0.9.0 and 0.11.0 | **built, gate-required, never shipped or routed** |
| D `STYLE.palette` | **0.9.1** — *"dispositioned, not fixed… the palette moves into STYLE"* when the first character bible pair arrives | **deferred decision, trigger fired** |

Three of the deferred items turn out to be *inherited decisions with recorded
reasoning*, which makes that list far more load-bearing than a set of
preferences. Two of them — `shapes.md` and 2D pan/zoom — are protected by the
Anti-template principle, not merely deferred. Reviving either is a doctrine
change.

### The sampling layer: the most useful thing that was lost

`kinematics` was not proposed as a standalone tool. It was the **second consumer
of a shared sampling layer** — modes (`beats`, `peaks`, `avoid:'flash'`) plus a
quantifier discipline — and the proposal's own point was that it "inherits
correct sampling for free."

Part of that layer shipped: `samplePlan(dur, flashes, n)` exists, is flash-aware,
and `instruments.md` documents determinism/blank/spread as **all**-quantified
over it. What did not ship, and is still worth having:

- **`peaks` mode** — *"the only mode that can see a 0.5s jump inside a 2.0s
  beat."* Note what that is: a continuity instrument that aims itself, which is
  the same argument as A2 and it was made first.
- **The second sampling mechanism was never retired.** `instruments.md` admits
  it: `SAMPLE_FRACTIONS` (exposure, framing invariance) is not flash-aware, so
  those checks "can land inside a white-out and read it as the frame."
- **Green results are still not auditable.** The plan is printed only in the
  *failure* message (`checked ${PLAN.join(', ')}`). A passing run prints
  `ok <scene> [source, webgl2]` and nothing about what it sampled — which is
  precisely the case the property was designed for. **Two lines, and it converts
  every green run from authoritative to auditable.** Folded into A3.
- **The quantifier is not declared.** The ancestor's sharpest line:
  > *"A check declares `all` or `any`. Determinism is `all`. Blankness is `all`.
  > 'Something legible happens' is `any`. Today every check is implicitly `any`
  > with n=1, which is the weakest possible claim stated as the strongest."*

  That is a precise description of all four errors this session committed, written
  a lineage earlier. `smoke.js` has since all-quantified three checks; the
  *discipline* — every check names its quantifier and its n — has not landed.

## What the predecessor already knew

`internal/prior_artifacts/` holds the four explainer-video planning documents and
the screenwright founding plan. **All of it is already consolidated** — the four
explainer docs into [`predecessor-record.md`](predecessor-record.md) (arc,
postmortem, per-item ledger, test suite, and the hardening plan as "The
remediation"), and `screenwright_plan.md` into [`plan.md`](plan.md) by the
rename. Nobody needs to re-read 3,400 lines. But reading the consolidated record
against this plan changed five items, and turned up one live defect.

### The live defect: a load-bearing capability claim, in code, that is false

`solveShot`'s camera-floor comment
(`scene.character.template.html:807`) reads: *"Not a fix for 'camera inside the
subject' — that is a LIE about extent, and **the extent check in smoke.js** is
what catches it."*

**There is no extent check.** Verified exhaustively: zero occurrences of `Box3`,
`setFromObject` or `computeBoundingBox` anywhere in `templates/`; zero hits for
`extent` or `declared` in `smoke.js`, `build.js` or `shoot.js`; and
`subjectExtent` (`:763`) reads the declared `SUBJECTS` values only — it never
touches geometry.

This is worse than a stale doc line because of what it is doing: it is the stated
*reason* the camera floor guard is deliberately not a fix for camera-inside-
subject. An author reading it believes a failure mode is covered when nothing
covers it. It is also exactly the class `doc-claim-auditor` exists for and that
B4's tiebreaker addresses — occurring in a code comment, which no audit pass has
ever been pointed at.

The history makes it sharper still. The predecessor specified this fix in
detail — *"the tool measures what the author declared. At load, walk the named
object's scene-graph bounding box and compare it to the declared extent.
Under-declaration throws; over-declaration warns"* — against three films that had
cropped their own payoff, and named the principle it serves: **"a rule with an
enforcement mechanism stayed true, and every rule that shipped as prose
drifted."** Three of the four Group 2 items shipped into mitate (the projected
box at `:794`, `anchorX` at `:801`, union subjects at `:764`). **The foundational
one did not, and a comment claims it did.**

So `subjectFromObject` in Track D is under-scoped. The predecessor's design is
*validation*, not a constructor: compare declared against measured, throw on
under-declaration, warn on over. Evidence now stands at six films — three
predecessor payoff crops, three of five hand-computed extents wrong on the long
film. Promote it, and fix the comment either way.

**And it is the second instance of its class, which makes the class worth
sweeping.** The predecessor's own five-agent code review found the first: the
`nodeFrame` determinism guard's *"smoke fails loudly"* comment **was false** for
the `_nodes`-removed path — the `if` silently no-opped. That one was fixed (the
template now emits a `console.warn`, which smoke's zero-warning rule converts to
a hard failure), so the shape is established and has already cost one round.

Two instances of *a code comment asserting an enforcement mechanism that does not
fire* argue for a bounded, cheap sweep rather than a general audit: **grep every
comment that claims a check exists — "smoke", "catches", "throws", "fails
loudly", "is what catches it" — and verify each against the code.** That is a
targeted pass over a specific sentence shape, and it is the one place
`doc-claim-auditor` has never been pointed, because it audits reference files
against code and this defect lives *in* the code.

### The earn-in rule has a blind spot, and A1 is what fell into it

The predecessor considered a contact checker and **explicitly declined it**, on
earn-in grounds: *"this scene did not earn a `build.js contact` checker, and it
did not get one… Resolved by documentation plus the measurement technique, not by
an instrument: four films hit it and none was blocked."*

That reasoning was sound for a human author, where eyeballing a render is cheap.
**For an agent it fails, because "not blocked" and "not done" are the same
outcome** — the agent silently substitutes the cheap wrong method, which is
precisely what happened two sessions later across a whole film with four staged
setups. The earn-in rule's cost model assumes the author can do the expensive
thing informally. An agent cannot: hand-writing a Playwright harness is not a
degraded version of eyeballing, it is a different order of cost.

This is the strongest justification A1 has, and it comes from the decision record
that declined it.

### Three smaller corrections

- **The spine is twice-derived, not n=1.** The predecessor reached it from the
  other direction in a different session: *"a rule with an enforcement mechanism
  stayed true, and every rule that shipped as prose drifted."* Mine is stated in
  terms of cost, theirs in terms of enforcement. Two independent derivations is a
  materially different evidence position from four errors in one session, and it
  partly answers this document's own n=1 problem — for the criterion, at least.
- **B5's diagnosis sharpens: the instrument shipped without its precondition.**
  The predecessor's design was explicitly two-part — ship `txt()` worth using,
  *then* a `?strip=text` that skips every draw through it — with the dependency
  stated: *"the instrument for the semantics axis falls out of making the helper
  good, and it only works because everyone uses the helper."* 2D got both. **3D
  got the instrument and not the helper.** That is why `method.md` reads as an
  overclaim: it describes a design that was half-implemented, and the half that
  shipped is the half that does nothing alone. It also explains why 3D is harder
  — in 2D the helper can be the only reasonable path to a glyph; in 3D text *is*
  geometry and there is no choke point to route through.
- **Occlusion is not a one-film finding.** The predecessor's two-character scene
  closed with it still open: *"geometric contact is not legible contact. Both
  blows now overlap on all three axes and still read as clipping rather than
  impact, because the contact point sits behind a body."* That is the occlusion
  class, recorded as unresolved, before the four new instances. It does not
  change the ranking — `transitions` still catches the expensive kind more
  cheaply — but the deferred entry should stop calling it one film's problem.

One more worth carrying into the spine's neighbourhood, because it names the
moment the failures actually happen: **"the pull toward tuning a coefficient is
strongest exactly when a thing is nearly right, and that is the moment to stop
and instrument."** Recorded against a session that spent five rounds tuning
multipliers before measuring anything, by the author of the pass that added the
measuring instruments.

---

## Sequencing at a glance

| # | item | track | fenced | blocked by |
|---|---|---|---|---|
| **0** | **ship `film-reviewer` with the plugin** | **A** | no | — |
| 1 | `build.js probe` | A | no | — |
| 2 | `build.js transitions` | A | no | — |
| 3 | self-reported elapsed + backend hint + resolved binary | A | no | — |
| 4 | `SKILL.md` step 3 rewrite **+ route to the reviewer + the limit-wins tiebreaker** | B | no | **0, 2** |
| 5 | demote backend policy in `SKILL.md` | B | no | 3 |
| 6 | provenance repairs (PNG home, 700px pointers, site row) | B | no | — |
| 6b | **fix the false extent-check claim** in `solveShot`'s comment | B | no | — |
| 6c | sweep code comments that assert a check exists (second instance of the class) | B | no | — |
| 7 | the batched kit release | D | **yes** | — |
| 8 | viewer overlay + capture | C | no | 7 |
| 9 | camera bake + the fork | C | no | 8 |

Items 1-3 and 6 are independent and can run in parallel today. **Item 7 is the
only fenced work on this plan and it is batched deliberately** — see Track D.

Two notes on the dependencies, because both were initially overstated:

- **Item 4 is blocked on A2 only, not on A1.** None of step 3's four fixes
  mentions `probe`. Since the whole sequencing argument is "edit that paragraph
  once," this matters: step 3 can land the moment `transitions` exists. If A1
  happens to land first, name it in the same edit rather than making a third
  pass at the same fifteen lines.
- **Batching (item 7) buys three saved cascades and creates a critical path it
  should name.** The viewer — the item with the most external demo value — now
  sits behind three unrelated kit changes. Keep the option open explicitly: **if
  the viewer becomes time-sensitive, pull C1's single line out and pay one extra
  cascade.** The seam factoring is precisely what makes that escape cheap, which
  is an argument for the factoring rather than against the batching. *Corrected
  in Track D: that escape is an 8-file change, not one line. Still right, but
  choose it knowingly.*

**This order is provisional on owner's-call 0.** If Track C is admitted through
an amendment to `plan.md`'s Phase 6 fence, the camera bake's role as the cheapest
Phase 4 spike (C0) is a live argument for moving 8-9 ahead of 4-6 — de-risking
the owner's stated priority outranks a routing edit. The order above assumes the
fence holds.

---

## Track A — instruments (do these first)

These are the spine's first clause, and they are the highest-confidence items in
the package because none of them rests on a single film.

### A0. Ship `film-reviewer` with the plugin — the item that costs nothing to build

**Ranked first under the reachability clause, and it reorders the rest of this
track.** `plan.md:460` makes it a gate criterion — *"byte-deterministic both
backends, film-reviewer-reviewed with all HIGH…"* — and the changelog credits it
with the defects author-eyes missed on both Phase 2 gate films: menagerie's look
beat entirely off-frame, its only closeup 70% void, a tail-wag spiking 5x, a
breath holding every character 3-5% squashed from frame 0; bear-and-bees' contact
z-axis miss *"faked by a lucky camera angle"* — instance five of the contact
class — plus the flee clipping the hive and the comedy's face never facing the
lens.

**It lives at `.claude/agents/film-reviewer.md`, outside `plugin/`.** Verified:
the plugin subtree ships `examples`, `references`, `SKILL.md`, `templates` and no
agents; `SKILL.md` contains zero occurrences of "agent" or "reviewer". So the
instrument two phase gates require is unavailable to anyone working from an
installed plugin. Its own description says it reviews "using the shipped
instruments" — it was written for exactly the context it cannot reach.

**The mechanism of the gap is worth naming, because it is not an oversight.**
`CLAUDE.md` invariant 3 forbids `SKILL.md` from citing any path outside its own
subtree — the install cache has no `.claude/`, so such a pointer would dangle.
Nobody writing `SKILL.md` could legally have added the route. **The invariant
that prevents dangling pointers is also what prevented anyone noticing a missing
capability**, and it means there is no doc-only fix: routing to the reviewer
requires shipping it into `plugin/agents/`.

The evidence for what it is worth is a controlled comparison this session
produced by accident. Two films, both self-reviewed by their author over many
rounds; one also got an independent reviewer pass and one did not. The one
without shipped a prop occluding a face, a presence gate nobody watched, and a
subject walking through geometry — defect classes matching menagerie's caught
list nearly item for item. The difference was not diligence. It was access to an
independent judge.

Under the spine's third rule this outranks both new instruments: `probe` and
`transitions` are instruments an agent runs; `film-reviewer` is the layer that
decides *what to run and judges the output* — the attention-allocation layer the
spine names as the scarce resource. **Building instruments for a judge that
cannot be reached is the wrong order.**

**It is a pointer rewrite, not a `git mv`.** Verified: the file addresses itself
from the repo root and **contradicts itself while doing it** — four pointers
dangle in an install cache (`plugin/skills/mitate/references/method.md`,
`…/instruments.md`, `…/film-language.md`, and `.claude/rules/model-delegation.md`,
which does not ship at all), while two are already subtree-relative
(`references/webgpu-stack.md`, `references/materials.md`). Two frames of
reference in one file — the same failure the `FRAME` architecture exists to kill,
one layer up, in prose. Its *content* is portable: every reference it cites is a
shipped one. Only its addressing is not. This is the identical class 0.5.1 fixed
for `SKILL.md`, described then as "the rule this very diff established."

**Four steps, in order:** rewrite the pointers subtree-relative; resolve the
`model-delegation` reference (inline the intent or drop it, since that rule does
not ship); decide the model policy for installed users knowingly; add the
delegation tier to `SKILL.md`'s routing so anyone knows the agent exists.

**And one consequence worth stating plainly, because it changes what step 3 can
honestly say.** `method.md:771` claims composition "is the axis that converges
with rounds," and backs it with a worked instance where four rounds converged
cleanly — so the claim is *supported*, and this is not an argument that it is
false. The problem is the evidence a user compares against: **both Phase 2 gate
films needed the reviewer to converge.** The changelog credits it with defects
"author-eyes missed" — five on menagerie, three HIGHs on bear-and-bees. The
maintainer's own rounds did not close them either.

So a user follows `SKILL.md`, budgets 3-4 rounds, compares their film to
menagerie, finds theirs weaker, and concludes their judgment is worse. The actual
difference is that one of them had an independent reviewer and nothing says so.
**The shipped examples are evidence for a workflow that did not produce them.**

That merges item 4's rewrite with this one: the honest replacement for the round
budget is not "rounds are cheap, look more" but *"your own rounds will not
converge alone — delegate a review."* **That sentence can only be written if A0
ships**, which is what makes item 4's dependency on {0, 2} real rather than
cosmetic.

**Decided: prescribed for the film tier, exempt for the chart tier, triggered at
saturation, and the prescription itself is gated on a control. Ship
`control-builder` with it; `doc-claim-auditor` stays repo-local.**

*An earlier draft of this section said opt-in, on the ecosystem's own precedent —
an always-on "identify what you'd do differently" rule replaced by on-demand
skills, because a standing elicitation beats its escape hatch and invents
findings on trivial work. **That argument does not transfer, and the reason
matters**: that rule fired on every task. Step 3 fires only when someone is
already building a film, so the population is filtered before the prescription is
reached.*

*The second argument for opt-in was that a default reviewer **makes looking
someone else's job**, eroding the practice `method.md` calls the method. **That
one dies on placement rather than on population.** The trigger is "when your own
rounds stop finding things," which cannot be reached without having looked — so
the prescription appends to the author's looking instead of substituting for it.
The erosion risk belongs to a reviewer named as a step in a list, which an author
could run first and skip the looking. It is not a property of prescribing.*

*What survives from that position is one carve-out, and it survives in the
project's own vocabulary rather than as a scale threshold nobody has bracketed:*
**exempt the chart tier.** `noise-chart.html` is a document — one locked head-on
shot, gated on byte-comparison per backend — and has no composition, continuity
or semantics axis in the sense the reviewer judges. Prescribing a judgment-model
pass over a chart is the postmortem failure in miniature. The chart / showcase /
film pipeline is already documented, so the carve-out costs nothing to state.

*The trigger, which is the actual design decision.* Not "before delivery" — the
precise moment is **when your own rounds stop finding things**. That is where the
long film stopped and shipped two defects; it is where menagerie's author stopped
and had five caught. Self-review saturating is not convergence, it is the point
where an independent pass has yield and only an independent pass does. So it
belongs in step 3 as the loop's **exit condition**, not as another command:

> *You have stopped finding things. That is when to delegate a review, not when
> to ship.*

*Findings are dispositioned, not obeyed — and without this the prescription
inverts.* Both gate films had every HIGH accepted. Eventually an author gets a
finding they disagree with, and with no convention there are two bad outcomes:
defer to the agent (which is the erosion this section just argued placement
prevents, arriving by another door), or silently drop it (and the finding is
lost). **The repo already has the right convention** — 0.9.1's palette entry:
*"Dispositioned, not fixed (recorded in the plan)… the palette moves into STYLE
then."* That disposition carried a trigger, and the trigger fired two lineages
later on the long film. That is the mechanism working end to end.

So the routing line must say the findings are **dispositioned with a reason, not
obeyed**. It preserves the author's authority, keeps the record, and it is the
whole difference between a reviewer that assists judgment and one that replaces
it.

*The prescription is gated on a control, and the control is the point.* The yield
evidence is **n=2, and both are maintainer films reviewed inside this repo by
their own author.** Nobody has run the reviewer on a film built by a different
agent following `SKILL.md` — which is exactly the population a `SKILL.md`
prescription targets. Prescribing on that evidence would be the
"instruments that generalise from a single sample" root cause, committed while
writing the document that names it.

**`circus.html` is that film and it has an answer key**: two defects a strip
caught after eight rounds of author review missed them, plus roughly eight more
the sheet caught along the way. One invocation says whether the yield generalises
past an author reviewing work they were already close to.

So split A0 in two:

| step | gated on |
|---|---|
| **ship the agents** — pointer rewrite, `plugin/agents/`, cascade, delegation tier in `SKILL.md` | nothing. Reachability is right regardless of yield |
| **prescribe at step 3** | the control coming back with meaningful yield on a non-maintainer film |

If the control comes back thin, the answer is the offer-it wording rather than the
prescription — and that is worth knowing before it is written into `SKILL.md`,
not after.

*The policy is already written — shipping makes it compliable, not new.*
`plan.md:460` already requires a reviewer pass for anything entering `examples/`.
So there are two tiers and they are consistent: **mandatory at the examples gate,
opt-in at saturation for everyone else.** Say it that way in the changelog, or it
reads as added ceremony rather than a closed gap.

*Ship `control-builder` too, and decide the surface once rather than per agent.*
The structural cost is the **first** agent — a new `plugin/agents/` subtree, new
plugin content in the cascade, the pointer rewrite, joining the audit surface.
The second costs a pointer rewrite and a routing line. `control-builder` is not a
maintainer tool: its brief is *"delegate when something is about to be trusted —
a new check, a threshold, a 'this technique helps' belief, or a green result on a
scene you expected to be broken"*, which is `method.md`'s build-the-control
discipline — a **shipped** discipline — packaged as an agent. All four of this
session's errors were control failures rather than review failures, and its own
brief names the mode verbatim: *"a weak control that passes is worse than no
control."* The frontmatter already sorts the three: `control-builder` and
`film-reviewer` inherit the session model as judgment tasks; `doc-claim-auditor`
pins `model: sonnet` as mechanical. **The two judgment agents are exactly the two
that face authors.**

The two agents route to different moments, which removes any ambiguity about
which to reach for: the reviewer at the end of the review loop (step 3,
saturation), `control-builder` when a green result is about to be trusted
(step 4, and whenever a threshold or bracket is set). Both routing lines must
state plainly that they spend a model call the user did not budget for —
`control-builder` runs things, so it may cost more per invocation than the
reviewer.

`doc-claim-auditor` stays repo-local: it audits `references/*.md` against code,
which installed users do not maintain, and the remit extension found above (code
comments asserting enforcement) is still a sweep over *this skill's* code.

*One honesty fix that routing does not cover, and should land with A0.* Whether
or not a user opts in, they will compare their film to the shipped examples.
**Say in `examples/README.md` that the shipped films had an independent reviewer
pass, and what it caught.** Without that line, the misattribution survives the
routing fix: a user who declines the delegation and finds their film weaker still
concludes their judgment is worse.

### A1. `build.js probe <scene> <t> '<expr>'`

`method.md` names "two things that must touch: measure the contact, do not infer
it" as its most repeated authoring bug and gives a `page.evaluate` + `Box3`
idiom. `instruments.md` independently records the same defect class recurring
**five times**. It was then skipped for an entire 60s film with four staged
setups — not from disagreement, but because hand-writing a Playwright harness
costs more than rendering a frame and squinting.

Ship a small eval prelude so the common measurements are one-liners (`bb(o)` →
`new THREE.Box3().setFromObject(o)`, `proj(v)` → NDC). Pair it with a worked list
in `method.md`: contact separation, reach, clearance from the camera-subject
line, foot-plant drift.

**State this as what it is: a reversal of a recorded decision, not a new
proposal.** The ancestor was bracketed (boundary/interior 1.0001 vs 0.0531,
spread 1.003x vs 72.7x) and then **deliberately declined** on earn-in grounds —
*"four films hit it and none was blocked"* — and dropped entirely in the
migration. Reviving it by simply feeling strongly about it would make every
declined item revivable the same way, which destroys the deferred list's value.

So the argument has to be an amendment to the earn-in rule itself:

> **Earn-in's trigger is "a film was blocked." That trigger cannot fire for a
> failure mode whose signature is *not blocked, reliably wrong*.** Six films hit
> the contact class; none was blocked; the sixth published a false claim as a
> direct consequence. For a human author the rule held, because doing the
> expensive thing informally (eyeball the render) is cheap and usually adequate.
> For an agent author it inverts: "not blocked" and "not done" are the same
> outcome, because the agent substitutes the cheap wrong method silently.
>
> **Amendment: earn-in fires on "blocked" *or* on a third recorded instance of
> the same wrong answer.** Everything else in the deferred list keeps its
> original trigger.

Note the amendment also re-opens the occlusion linter's ancestor (*"no register-
aware lint engine — revisit when a film is blocked"*) on the same logic. It stays
third regardless, on the merits in the deferred table — but it should be third
for its own reasons, not because a trigger that cannot fire is holding it.

### A2. `build.js transitions <scene>`

Continuity is the axis that got ~1% coverage on the long film: `strip` run once,
over a 0.6s window, on a film with 14 shot transitions, 7 scale-gated
appearances, a fall and a chase. Not because `strip` is bad — because choosing
windows by hand does not scale, so it gets run once and forgotten.

**The windows are not a matter of taste.** Discontinuities live at cut
boundaries, and the scene already publishes exactly that list: `window.SHOTS`
exports `{t, cutEnd}` and `smoke.js` already consumes it. **That export exists
because this problem was already diagnosed** — 0.5.1 added transition-window
sampling to smoke after a review *"verified no fixed-fraction sample ever landed
in any blend window on a shipped film."* So A2 is not a new idea; it is the
completion of a line of work that already identified transitions as structurally
under-sampled and shipped the export for it. Strip every cut window
plus each beat boundary, tile one row per cut, labelled. No new export, no new
concept — this **aims** an instrument that exists, which is why it outranks the
occlusion linter.

Evidence: run by hand on two windows of a film already called finished, it found
two real defects in ninety seconds — a bear inflating on camera for 0.74s, and
the subject walking through a prop row. Both invisible in a contact sheet, both
obvious in a strip, both shipped past eight rounds of composition review.

**Derive windows from `window.SHOTS` where present, and fall back to
`window.BEATS` boundaries where it is not.** As specified against `SHOTS` alone
this covers four of five shipped examples and silently does nothing for the
fifth: the 2D template has `KEYS[]` and exports no `SHOTS`. `window.BEATS` *is*
exported by all three templates (`scene2d.template.html:498`), so the fallback
costs a line and keeps the command universal — 3D gets cut-plus-beat coverage, 2D
gets beat coverage, and the tool does not acquire a second 2D asymmetry alongside
owner's-call #4. Write it in, rather than discovering it in the lead item that
everything else is blocked on.

**Its bracket is not `strip`'s.** It inherits `strip`'s *pixel* sensitivity
(blind to limb-level breaks, ~2% of frame area), but the new property is **window
selection**, and that needs its own positive control: does it surface a defect
nobody hand-picked? The fixture for that exists today and is about to evaporate —
`circus.html` lives outside the repo and has two characterized defects at known
timestamps. Its current state is the negative control (both fixed; the sweep
should be quiet). The positive control is two named reverts, recorded here so the
bracket is reproducible without the film ever being committed:

| defect | window | revert |
|---|---|---|
| bear inflates on camera | ~44.8-45.6s | `backOut(ramp(t,'fall',.80,.96))` → `backOut(ramp(t,'bear',.04,.20))` |
| subject walks through the prop row | ~23.4-24.1s | `(1-ramp(t,'beats',.84,.97))` → `(1-ramp(t,'ship',.10,.24))` |

### A3. Every command reports its own cost, and names the cheaper backend

`build.js all` printing elapsed and ms/frame would have prevented an entire
published retraction. Measured, the review loop is **1.8s on `WEBGPU=metal`
against 6.8-7.0s on the software-GL default** — a 3.8x nobody is told about,
because `webgpu-stack.md` frames the flag as a shooting-speed opt-in while the
review loop is where iterations actually get spent.

The doc-line version of this fix was proposed and correctly withdrawn: prose is
what loses. So the tool says it, at the moment of use — every command prints its
elapsed time, and when it ran on the fallback with hardware available, prints
what the other backend would have cost. This merges with the self-timing item
rather than adding one.

**Two more properties belong here, both inherited and both cheap.** The ancestor
specified: *"Every check states its plan and prints the samples it used. A green
result becomes auditable instead of authoritative."*

- **Print the sample plan on green, not only on failure.** Today the plan appears
  only inside the determinism failure string; a passing run prints
  `ok <scene> [source, webgl2]` and says nothing about what it sampled — which is
  exactly the case the property exists for. Two lines.
- **Declare the quantifier.** The ancestor's sharpest line is that a check
  declares `all` or `any`, and *"today every check is implicitly `any` with n=1,
  which is the weakest possible claim stated as the strongest."* `smoke.js` has
  since all-quantified determinism, blankness and spread — but nothing *states*
  it at the point of output. A green line that reads `ok <scene> [determinism:
  all/6, blank: all/6, playback: all/1]` makes the strength of the claim visible
  where it is being made, and would have made three of this session's four errors
  visibly weak at the moment they were committed.
- **Log the resolved browser binary**, alongside which backend resolved. One
  line, and it retires or promotes an entire suspect class for the open 1-in-6
  metal determinism FAIL (see the fixture note under Evidence).

---

## Track B — routing and provenance

The spine's second clause. **Everything here is a delivery-timing fix, not new
content.**

**Hard constraint on all of it** (`CLAUDE.md` invariant 3): `SKILL.md` may only
cite paths inside its own subtree, because the install cache has no `docs/` and
such a pointer dangles for every installed user. So B1 and B2 can route to
`references/*` and nothing else. Nothing proposed here breaks it — and it
independently confirms keeping `source-of-truth.md` in `docs/` from a second
direction: it is not only that installed users do not need it, it is that
`SKILL.md` cannot legally point at it.

### B1. `SKILL.md` step 3 — three findings land in fifteen lines

`instruments.md` is named exactly **once** in `SKILL.md`, at line 211, in the
bibliography. Step 3 is titled "Review on three axes" and never mentions it. The
pointer that exists is correctly worded and unusably timed: it says to read the
file "when deciding whether a green result means anything," which is a *moment*,
placed in a *bibliography*.

The structural version of the problem, which is why this generalizes past one
agent: progressive disclosure asks the agent to choose what to load at the moment
it has the least context to choose well, and the choice is rationally biased.
Under a build brief, the refs that answer *how do I build this* win and the ones
that answer *how do I know it's right* lose. That is correct triage under the
task as framed, which means the same two categories lose for every agent, every
time.

Four fixes, same paragraph:

1. **Route to `instruments.md` inline**, where the review commands are.
2. **Drop the round budget.** "Budget 3-4 look-and-edit rounds for composition"
   rations something measured at 1.8s. Rounds were never scarce; the guidance
   should say what to look at, not how often. (The per-setup reframe is better
   than per-film, but the deeper correction is that it should not be a budget.)
3. **Replace "`build.js strip` for a suspect window"** with `build.js
   transitions`. Hand-picking windows is precisely the practice that does not
   scale — which is why this item is blocked on A2, and why the edit should
   happen **once**, describing tools that exist, rather than twice.
4. **Stop prescribing an instrument the prescribed reader cannot use — this may
   be the largest of the four.** Step 3's continuity clause says "watch the loop;
   `build.js strip` for a suspect window." The references already know better and
   say so in as many words: `method.md:401` — `strip` "exists because the
   reviewer is often an agent, which cannot play a film, and *watch the loop* is
   not an instruction such a reviewer can follow"; `instruments.md:177` — `strip`
   is "the only pixel-level look at continuity available to a reviewer who cannot
   play the film." So `SKILL.md` names the unavailable instrument as primary and
   scopes the available one to a spot-check.

   **That is the actual reason continuity coverage was ~1% on the long film** —
   not neglect. No systematic pass was prescribed at all, so the spot-check ran
   once. The fix is therefore not "name `transitions` instead of `strip`"; it is
   to name the agent-available substitute as the *default systematic pass*, with
   watching the loop kept as what it honestly is: the strongest instrument, and a
   human's.

**Deliberately not promoting content into `SKILL.md`.** The three-axis model is
already there in compressed form (`SKILL.md:126-129`); what is missing is the
*limits*, and binding `instruments.md` to the step delivers those at the moment
of use for zero standing-context cost. Promotion is the expensive lever — every
line lands in every activation forever, including for the many that never review.
Bind first, then re-measure what is still missing.

### B2. Demote the backend policy

`SKILL.md:160-183` spends ~24 standing lines on backend policy and environment
for something used once, loudly, with immediate and obvious failure. One line
plus a pointer to `webgpu-stack.md`. The metal-versus-fallback cost belongs in
the tool's own output (A3), not in a doc that asserts it.

### B3. Repair the three provenance drifts

The audit of `source-of-truth.md` found the rule sound and the repo drifted from
it in three places. Two are verified:

- **The PNG/JPEG capture figure lives in `shoot.js:185` and `build.js:309` — two
  code files, zero references, no date, no measurement conditions.** The homes
  table says measured brackets belong to the one reference that owns the subject,
  with a date; code comments name the phenomenon, not the figure. **This
  misplacement directly caused a published error**: the figure was found in
  `shoot.js`, treated as authoritative, compared against a software-GL
  measurement, and a spurious "needs a scene-dependence caveat" was published.
  Had it carried its conditions, the mismatch would have been visible instantly.
  Give it one dated home in `webgpu-stack.md` with the backend stated; the code
  comments point.
- **The ~700px caption figure is in three places**: `method.md:892` (the home),
  `instruments.md:283` (restates), `site/index.html:144` (restates). Point, never
  restate.

The third — that the site's "4 to 5 seconds compiling shaders" is stale — is
**not established**. That figure has provenance (`site/app.js:47` and `:320`
record it as measured in WebKit for the character films) and the 238ms
counter-measurement is headless Chromium on metal with a different scene. That is
a comparison across machines, the same shape as two claims already retracted this
session, and it should not reach the auditor's list without a WebKit measurement.

**The surviving finding is better than the disputed one: the site is not in the
homes table at all**, makes public capability claims, and carries no verification
date. Add the row. Cheapest item on this plan.

### B4. A tiebreaker for doc-versus-doc

The audit found a real hole in `source-of-truth.md` itself. Two files can each
legitimately own their slice under the homes table and still contradict —
`method.md` owns method and failure modes, `instruments.md` owns what a check can
see — so a capability claimed in one with its limits recorded in the other drifts
apart with neither violating the table. The offered tiebreaker (the newer audit
date) is useless when both are dated the same day, which they are.

Live instance: `method.md:634` promises every draw routed through `txt()` becomes
a no-op under `?strip=text`; **the 3D templates ship no `txt()`** and alias
`strip=text` to the DOM-caption `nocap`, while `instruments.md:212` correctly
records that the pass cannot see canvas text. This is the exact failure class the
doc was born from — a reference confidently describing a mechanism the stack
never had — surviving in a shape the doc's rules do not detect.

**Proposed rule: when a capability claim and a limit claim disagree, the limit
wins.** The asymmetry is real — overclaiming is the failure mode with teeth,
under-claiming costs an author one unnecessary check.

**It needs a companion clause or it inverts.** Once limits are authoritative, a
*stale* limit blocks a true capability: implement `txt()` in 3D, forget to update
`instruments.md`, and the tiebreaker now enforces a falsehood. So: **implementing
a capability requires clearing its recorded limit in the same change.** That
makes the limits file the gate on capability claims rather than a parallel
narrative running alongside them.

Note how this compounds with B1. Under limit-wins, `instruments.md`'s "what has
no instrument" section stops being advisory and becomes the tiebreaker of record
— which raises the payoff on binding it to step 3, because the file an agent was
skipping becomes authoritative rather than informational. The two items are worth
more together than separately, and they should land together.

**Before adding the rule, understand why the existing mechanism did not fire —
otherwise this is a second unenforced rule stacked on a first, which is the
spine's own failure mode applied to the spine's own track.**
`.claude/agents/doc-claim-auditor.md` already exists, its brief is exactly this
("verifies that a reference doc's capability claims are actually true of the
code"), and its own rationale names this defect class in as many words: *"a claim
was true once, or was aspirational, and nothing rechecks it."* It lists five
prior instances. The `txt()` claim is a sixth.

The diagnosis is in the trigger, not the agent. The convention is that changes
*touching code a reference describes* get an auditor pass before commit. **An
inherited claim has no code change to trigger on.** `method.md`'s `txt()` promise
was ported from the predecessor describing a mechanism that never migrated to
this stack; nothing changed here, so nothing fired. That is the same class
0.14.0, 0.15.0 and 0.16.0 each caught by hand — dangling paths, then
`film-language.md`'s Focus section citing a predecessor filename that has never
existed here. **Three catches, three times heroic**, against a doc that claims
drift detection is "scheduled, not heroic."

So B4 carries two things beyond the tiebreaker, or it is prose:

- **A one-time sweep of inherited claims.** This is a different activity from
  ongoing drift detection: ported text is stale *on arrival*, and no
  change-triggered process will ever reach it.
- **A trigger widened past code change** — a file being ported, or carrying
  claims older than the stack, is itself cause to audit.

The tiebreaker is still worth having: it resolves what the auditor structurally
cannot — doc-versus-doc where both match the code, or where the code is
ambiguous.

**And a second rule, cheaper than the tiebreaker, that prevents the class rather
than adjudicating it.** The `txt()` case is not careless overclaiming. Its
ancestor is a *planned structural item* — "make the text helper good enough that
turning text off is possible" — and the reference describes the planned end
state, of which only half shipped. That is roadmap optimism reaching a reference
file, and it has a one-line fix:

> **A reference may not describe a mechanism that is planned but unbuilt, unless
> it is marked as such.**

Add it to `source-of-truth.md`. It composes with limit-wins rather than competing:
this rule stops the contradictions being created, limit-wins settles the ones
already live. It also generalises past docs — the false extent-check *comment*
is the same failure in code, describing a fix that was specified and never
built.

### B5. `?strip=text` in 3D — scope now, implement on demand

Something must move, because the two references contradict each other today.
Scope the doc now (free). Do **not** build the mechanism yet: in 2D `txt()` is a
draw call you can skip, but in 3D there is no canvas text — built type is
geometry, so the equivalent is a build-time registry of text-bearing objects
whose visibility toggles. Different mechanism, same contract.

And the damage is register-dependent: on the film that found it, the two affected
beats were a title card and a sign, and `method.md` already says the
cover-the-words test degenerates when text *is* the subject. The hole bites
hardest on labelled geometry — charts, diagrams, callouts — which is exactly the
diagrammatic register nobody here has built. Neither party should design a
mechanism from one film's title card.

---

## Track C — the viewer and the camera bake

### C0. The framing that resolves the determinism question

Recording a viewer's camera movements and replaying them is **a bake**, and
[`physics-bake-proposal.md`](physics-bake-proposal.md) already sanctioned the
pattern: run something non-pure once at build time, sample it, splice the samples
in as data, interpolate in closed form — *"a baked track is just another pure
signal."* Checked against its four red lines, a camera bake clears all four, and
it is the **easy** instance: Phase 4's hard problem is trusting the baker (pinned
Rapier, seed, fixed timestep), whereas here the baker is a person and the samples
*are* the ground truth. Nothing to reproduce.

**Which makes the camera bake the cheapest available spike for Phase 4 — the
owner's stated next priority.** `plan.md` records the bake as OWNER PRIORITY with
a spike list to be measured before any pipeline code: (1) Rapier version pin and
re-bake identity, (2) the sample-rate bracket, (3) the embedding format. **A
camera bake exercises 2 and 3 against a baker that cannot be non-deterministic**,
which is the whole point of a spike — isolate one class of new variable, which is
Phase 1's own lesson. It also proves beat-anchoring and the splice-and-playback
path end to end. That reframes Track C from "demo value, sequenced last" to
"de-risks the owner's priority," which is a stronger argument for moving it up
than any audience argument.

The live-camera question needed no doctrine change either. Determinism as this
repo defines and tests it is `seekTo(t)` twice giving byte-identical pixels, no
state across frames, no `Math.random()`, no wall-clock. A viewer offset is none of
those. The shipped precedent is exact: `build.js aspect` renders **one moment at
four window shapes** — same `t`, different viewing parameter, four different
outputs — and has never been called a determinism violation. Framing has always
been part of the viewing configuration. The doc change is a footnote saying the
offset is a viewing parameter, so nobody reads "camera responds to input" as
licence to carry state.

### C0.4. Run it AS the Phase 6 spike, not as a feature

**Label it, or you get the capability and lose the proof.** Phase 6's gate —
*"reuses kernel, characters, materials, and at least one instrument with zero
modification"* — only means something if it is asserted at the time the work is
done. Run Track C as the Phase 6 spike with `museum-walk` as its case, and the
gate arbitrates the seam question instead of us arguing it: **one line inside
`SOLVER` fails "zero modification"; state-routing passes.** That converts a
design disagreement into a measurement, which is this project's whole method.

### C0.5. This is Phase 6 arriving early, and the seam points at the cut

`plan.md`'s architecture section splits the scene layer in two: a **kernel**
(`pose(state)`, `materials(state)`, `camera(state)` — no clock, no input) and a
**driver** that produces the state stream, as `g(t)` for the film or `g(events)`
for interaction. Phase 6's gate reads: *"the spike reuses kernel, characters,
materials, and at least one instrument with zero modification — proving the layer
split held."*

**The prototype swapping the timeline driver for its own loop is that driver
swap, done by accident** — and it reused the kernel, the characters, the
materials and the contract. That is real evidence for the founding bet, arriving
years earlier than the phase that was meant to test it, and it should be recorded
as such rather than as a feature.

It also means the seam needs its fork named **before Track D batches it into a
fenced release**, which is the most expensive place to be wrong:

- The architecture's own answer is that a view offset is **part of state**: the
  timeline driver emits identity, an input driver emits it from events, and
  `setCamera` never changes. That is literally zero modification, and it is the
  shape Phase 6 will want.
- **That shape is not available today.** `setCamera(t)` takes `t`; the split
  "costs only discipline" until Phase 6 and has not been implemented. Threading
  state through the kernel is a large refactor, not a line.

So the honest position: our one-line hook does not violate a boundary that
exists — it **deepens the weld at exactly the point the plan intends to cut**.
That is acceptable and it is not free. Two mitigations, both cheap:

1. **Shape the hook so it converts trivially.** Read the offset from a single
   named object that a driver could later own, never from ad-hoc globals. Then
   the Phase 6 refactor changes where the offset *comes from*, not the math.
2. **Record it as a known weld** in `plan.md`'s Phase 6 entry, so the spike
   starts by cutting there rather than discovering it.

### C1. The seam, not the feature (batched into Track D)

Put **one line** inside `setCamera` that applies an offset which is identity
unless something set it, placed after the cut-blend block and before the energy
noise. Everything else — pointer handling, damping, pinch, clamps, arm gate,
hint UI, scrub bar, caption controls, capture, resample — lives outside the fence
in a single overlay that `build.js` splices in, the way `vendor` already splices
in 1.1 MB of three.

The sharpest argument for this shape only appears once you take per-scene
authorable clamps seriously: under a templates-carry-the-feature factoring,
**every clamp change is a fenced edit across templates plus parity plus cascade.**
With a nulled hook the fence carries no policy at all. It also makes the
prototype's best claim literally true — "the contract was already sufficient to
build a player on top of a film" is nearly Phase 6's gate ("zero modification"),
and one line inside `SOLVER` is not zero while a hook set from outside is.

### C2. Capture and bake

- **Bake the delta, not the absolute camera.** Three scalars — azimuth,
  elevation, dolly — about the shot's own aim point. The shot still cuts, the aim
  still rides `SUBJECTS.pos`, so a tracking shot stays a tracking shot. Absolute
  positions freeze framing against a moving subject and discard what the solver
  exists for. This is "coordinates were never the intent, framing was," one layer
  out.
- **Resample to keyframes; never bake the raw pointer track.** A person dragging
  emits dense jitter; baked raw it becomes camera nerves nobody authored, fighting
  `STYLE.energy`. Three scalars at a handful of control points is already
  `SHOTS`-shaped — which is the test for whether the fork stays *editable*.
- **Anchor to beats, not absolute `t`.** The physics proposal already made this
  call for impulses (`{beat:'hit', at:.3}`) so retiming re-bakes cleanly instead
  of silently desynchronizing.

Done this way the bake is not a new table — it is `SHOTS` entries or a small
offset track beside them, and the only genuinely new code is capture-and-resample.
The prototype already holds exactly the three numbers, already clamped, already
in the solver's vocabulary.

### C3. Two rules the viewer must carry

- **The scene stands down when framed** (`window.self !== window.top`). One line,
  no cross-frame coordination, correct by default on disk and top-level — which
  is the general case, and the only case with no chrome of its own. Known
  consequence: a third-party embed gets no controls. That matches today's
  behaviour so it is not a regression, but the override should be a declaration
  of *who owns the transport*, not a boolean someone flips to make a symptom go
  away.
- **Call `window.seekTo` by name.** The live-playback gate cannot see a driver
  that captured a direct reference before the wrap. The natural refactor —
  hoisting `const s = window.seekTo` out of a hot loop — reads as an obvious tidy
  and would silently take the scene dark to the gate. This belongs as a comment
  at the overlay's call sites, not only in `instruments.md`: the person who breaks
  it will be reading the overlay.

---

## Track D — the kit, as one batched fenced release

**This is the only fenced work on the plan, and batching it is the point.** Each
fenced change costs edit-every-carrier + parity verify + version cascade. Four
separate changes pay that four times; one release pays it once.

**The carrier count is four times what a templates-only reading suggests.**
Fences are carried by the templates *and* every example *and* the site's neon
variant — measured: `scene.character.template.html` 6, `scene.template.html` 5,
`scene2d.template.html` 1, `bear-and-bees` 6, `menagerie` 6, `gearbox` 5,
`materials` 5, `noise-chart` 5, `site/films/gearbox-neon.html` 5. 0.16.0's boot
card confirms this is established practice: it landed "byte-identically in both
3D templates, all five examples, and the site-only neon variant."

| change | fence | carriers |
|---|---|---|
| camera view-offset seam (C1) | `SOLVER` | 2 templates + 5 examples + neon = **8** |
| `CONFIG.name` / `CONFIG.titleCard` split | `DRIVER` + `HTML` | **8** |
| `hide(obj, u)` owning the `1e-4` clamp | `KERNEL` | 3 templates + 5 examples + neon = **9** |
| `subjectFromObject(group, {pad})` | `KERNEL`/`RIG` | **8-9** |

Two consequences, both of which move decisions taken earlier in this document:

- **Batching is worth far more than first stated** — four separate changes touch
  ~33 files and pay four cascades.
- **The escape hatch is not cheap.** "Pull C1 out and pay one extra cascade" is
  an 8-file change, not a one-line one. It remains the right move if the viewer
  becomes time-sensitive, but it should be chosen knowingly.

**Use the standing maintenance rule, which this plan previously omitted**
(`plan.md`, 0.6.0 post-gate pass): after editing any fenced block, run
`bun run smoke.js --parity-only templates/*.html examples/*.html`
**cross-directory** before committing. A per-directory green does not cover the
template↔example boundary, which is exactly where a 33-file change will drift.

Plus one unfenced template edit that belongs in the same release because it is
the same kind of fact:

- **`STYLE` gains a `palette: {}` slot.** `bibles.md` says the whole look is ONE
  object switched by one line, but `STYLE` offers only `bg`/`exposure`/`energy`,
  so the natural move for an author is a `PAL` const beside it — which is exactly
  what happened, leaving a film that cannot swap bibles. **The template is the
  documentation most authors actually read.** Cheapest change on this plan,
  widest effect.

  **This is not a new item — it discharges a carry-forward whose trigger has
  fired.** The 0.9.1 review dispositioned character colors as hex literals rather
  than `STYLE` keys, deferring with a stated trigger: *"palette keys move into
  STYLE then, not before"*, the trigger being the first character bible pair.
  A film has now shipped with its palette outside `STYLE` for precisely the
  predicted reason, which is the same trigger arriving from the other direction.

Also fold in one open carry-forward that is the **same shape as C1** and will
otherwise reopen it: **per-shot camera energy.** `bear-and-bees` wanted `locked`
for the hush while the film wanted `steadicam`, and there is no vocabulary for
it, so the film went all-locked. That is a per-shot override of a `STYLE`-level
camera property applied inside `setCamera` — structurally identical to the view
offset. Design the two together or the second one reopens the first.

Notes on two of these:

- **`CONFIG.title` does two jobs** — the DOM title card (`:892`) and the boot
  card (`:951`). Wanting a *built* title card forces `title = ""`, which blanks
  the boot card. Worth knowing: the boot card shipped in 0.16.0, so this is a
  one-version-old conflation rather than an ancient wart, and nothing depends on
  the coupling yet.
- **`hide()` rather than an `ACTORS` table.** Seven copies of the scale-gate
  incantation in one film justifies nothing about the corpus; but the corpus
  already carries **two different spellings** of the same idea (`Math.max(1e-4,…)`
  in the new film, `clamp(sc,.001,1)` plus a `visible` flip in
  `bear-and-bees.html`), and no shipped example carries the canonical form at all.
  Two spellings of one idea is drift waiting to happen, and that justifies a
  helper owning the clamp. It does not justify a table.
- **`subjectFromObject` generalizes something already proven in-file.** The
  character rig computes `height`/`length`/`centerX` and the template's own
  `SUBJECTS.walker` is built from them. On the long film, the one subject framed
  from measured extents was right first try; five hand-declared extents were wrong
  three times. Measure the mechanical part, leave the judgement to `pad` and to
  naming sub-subjects — `film-language.md` is right that `h` is "the extent that
  must stay in frame," which is a judgement layered on a measurement.

---

## Deferred, with the trigger that revives each

Recorded so nobody re-argues them from scratch, and so the trigger is explicit
rather than a matter of mood.

| deferred | why | revived by |
|---|---|---|
| JSON `tables`/`patch` round-trip | the tables contain functions exactly where they matter (`SUBJECTS.pos` is a function of `t`); a projection that cannot represent the interesting half lies about completeness. The cited pain — regex-editing JS source — is a tooling habit, not a format problem | an agent needing to *restructure* tables mechanically, after the enumeration exists |
| `ACTORS` presence table | one prior instance in the corpus, differently spelled; `hide()` covers the drift risk | a second film with multi-appearance presence that `hide()` cannot express |
| occlusion linter | **not a one-film finding** — the predecessor's two-character scene closed with it explicitly open ("geometric contact is not legible contact… the contact point sits behind a body"). Still ranked third: 3 of 4 new instances were static staging the contact sheet already catches by eye; the 4th was a transit defect a beat-midpoint sample structurally cannot see, and `transitions` catches it. So the linter automates eye-work on a converging axis — real, but third | probe + transitions shipped and composition rounds still not converging |
| solver-aware staging | the proposed vocabulary fails on its own originating use case: props at fixed world positions a character walks to, which was every exhibit in the film that motivated it | a design that handles walked-to props |
| `travel()` / `LEGS` / `shapes.md` | register-specific to the presenter explainer, which arrived as a commission rather than from the roadmap | a second presenter film asking |
| type primitive (glyph data + renderers) | generalizes past the register — any film with a sign, an axis, a label — but it is a bigger build than it looks, and no shipped example needs it. **And it is governed by an existing rule neither review applied: a glyph alphabet is a *primitive*, so under the chart tier it lands as a chart — a grid of all 36 glyphs, byte-compared per backend — before any film uses it.** That is also the right shape on the evidence: all three glyph bugs were one letter built on a wrong assumption, which a grid makes obvious at a glance and a title card cannot | a second film needing built text, or the diagrammatic register (see B5) — entering at the chart tier, not in a film |
| splitting `method.md` (960 lines, 45% of reference text) | it would create exactly the doc-versus-doc boundary B4 exists to patch, and `method.md`/`instruments.md` already contradict in that shape. Its own justification is honest but weak: "I read all of it, so splitting wouldn't have helped me read" | B4's tiebreaker landing first |
| distance-space gait as the template default | the algebra is sound (`{start:0, rootX:s}` reduces identically where travel is monotone) but was argued, not measured | the PSNR comparison `method.md` prescribes |
| `--workers` in `build.js all` | **not a bug — retracted.** Clean cold run: exit 0, 180/180 frames, 32.5s vs 38.1s. It works and buys ~1.17x, contention-bound | a workload where 15% matters |

---

## What this implies for the phases, the tests, and the hierarchy

Forward-looking consequences that are not items above, recorded because they
change decisions in phases nobody has started.

### The weld gets more expensive every phase — cut it while it is cheap

`plan.md` says the kernel/driver split "costs only discipline" until Phase 6.
**Discipline has not held**: `setCamera(t)` takes `t`, C1 adds a hook inside the
kernel, and Phase 6's gate ("zero modification") is therefore not reachable as
written. Every phase from here welds tighter — Phase 3 adds face state, Phase 4
adds baked tracks, both of which will be authored as functions of `t` because
that is what the signature invites.

**Cheapest possible intervention, and the moment is now:** make the seam *visible*
without implementing the split — `setCamera` takes a state object that today
contains only `{t}`. The viewer's offset then becomes `state.view`, which the
timeline driver simply omits — and `setCamera` needs **zero modification**, so
Phase 6's gate is met by construction rather than by argument (C0.4).

**One discipline keeps the place from rotting:** a state object invites becoming
a bag. The driver owns what goes in, and **the kernel never reads anything the
timeline driver cannot produce.** Without that rule, `state` is a global with
better manners and the split is back to being discipline. Mechanically provable byte-identical, no behaviour change,
and it converts a discipline into a place. Do it inside the Track D batched
release, because it touches the same 8 files and would otherwise be a ninth
cascade later. After Phase 3 and 4 the same change costs several times more.

### The portfolio tests content; nothing tests the harness

The nine-case portfolio and the chart tier both vary *what is in the scene*.
Every expensive defect this session traced was in a path nothing exercised — and
one of them, `build.js aspect` throwing a `ReferenceError` in both skills, was a
**command nobody had run since the feature landed**. There is no test that
invokes each `build.js` subcommand once.

**Add a harness tier below the chart tier:** run every subcommand against one
tiny scene, assert exit 0 and that the named artifact exists. It is the cheapest
test in the repo and it closes the "command never run" shape permanently. Note
what it is not — it does not check that output is *correct*, only that the path
executes. That is the right scope: correctness is what the instruments are for,
and this catches the class where an instrument was never reached at all.

### Instrument brackets want a defect corpus, not per-instrument improvisation

Every instrument in this repo was bracketed by hand-injecting a defect and
confirming it fires — `strip`'s 1.2-unit jump, the shipped-frame check's
half-dead adapter, and 0.16.1's four controls. Each time the fixture was built
from scratch and thrown away. `circus.html` is currently the third such fixture
about to evaporate.

**Keep a small corpus of scenes with characterized defects at known timestamps**
(gitignored is fine — this is bracketing apparatus, not teaching material). A new
instrument then has a positive control the day it is written, and a
*regression* control the day someone changes it. This is what makes the
occlusion linter cheap to evaluate whenever its trigger fires, and it is why the
two `circus` reverts are recorded in A2 rather than left in a conversation.

### Phase 3 has a design input it does not know about

`characters.md` documents chains and vectors; Phase 3 builds the face morph
basis. The only person to hand-build a face on this stack found a specific,
measured failure: **dark eye furniture merges below MS.** Two dark eye rings
whose radii nearly meet, plus lashes, plus a hair fringe, read as goggles at
medium shot and as a blindfold in a walk strip — and it looks correct in the
close-up where it was authored, which is the same shape as the documented
"silhouette failure is invisible at the size you are authoring at." The squint
strip is whole-frame and cannot see a face.

The rule generalises past faces: **a feature is validated at the rung it will be
seen at, not the rung it is authored at — and the authoring rung is always
tighter.**

That belongs in `characters.md` before Phase 3 designs the basis, not after
`the-briefing` rediscovers it. And the instrument it implies is not a squint pass
— it is a **rung ladder**: `build.js ladder <scene> <subject> <t>`, the same
declared sub-subject framed at CU / MCU / MS / FSA and tiled. `sheet`'s shape,
over rungs instead of over beats. It is nearly free because every part exists:
the solver already does rungs, `SUBJECTS` already resolves any declared name (so
a `face` sub-subject is just another entry), and the tiling is `sheet`'s ffmpeg
call.

Scope it before Phase 3 designs the morph basis, because it changes what the
basis must survive: **expressions that read at CU are the easy case, and the gate
should be MS.**

### A control rule the project does not have

The chart-tier experiment varied the *scene* and held the environment fixed, so
it could only ever implicate scene machinery — which is exactly why the suspect
list for the intermittent FAIL reads "fur shells, solver traffic, character rig."
The same error produced this session's retracted PNG caveat: one backend was
benchmarked and the conclusion generalised to the documented figure.

> **When an intermittent resists reproduction, the next control must vary the
> layer the last one held fixed.**

That belongs in `method.md`'s control discipline, beside "verify the control
actually ran." It is one sentence and it would have redirected two separate
investigations.

### Two test cases that do not exist, and one is the product claim

**The headline claim is untested.** *"Ask for one change and everything else
changes too"* is the thesis the films assert and the site sells, and no case in
the portfolio exercises it. The long film validated it by accident — eight beats
added to a finished, reviewed film moved nothing in the existing thirty seconds —
which is a gate waiting to be written:

> **Regression-by-edit.** Take `gearbox`, apply three canonical edits — retime a
> beat, swap the bible, insert a shot — and assert the blast radius is bounded:
> every untouched beat byte-identical, or above the project's 70 dB bar.

It needs no new film, it is mechanical, and it converts the most load-bearing
untested claim in the project into something a gate can check.

**Deployment configurations need a check, not a film.** One scene, four hosts
(disk, top-level, iframe-with-parent-driving-`seekTo`, install cache), assert it
plays and the contract holds in each. That is where the site collision would have
surfaced as a failing check rather than a design argument.

`museum-walk` already covers the interactive path — provided Track C is run as
the Phase 6 spike (C0.4) rather than shipped as a feature.

### The hierarchy lesson generalises past `SKILL.md`

The routing failure (B1) and the lost backlog (Ancestry) are the same failure at
two scales, and the general form is worth stating once:

> **A document that records is not a document that directs.** Every record needs
> an extraction into something that directs, and the extraction is where the
> value leaks.

`predecessor-record.md` is 2,765 lines of record; its open structural items never
became a backlog, so they were re-derived at cost. `instruments.md` is a ledger
of what checks cannot see; it never became a step, so it was skipped by an agent
who then published a false claim. Same shape, different scale.

Two consequences for the reference hierarchy:

- **Route at every workflow step, not just step 3.** B1 fixes the worst instance;
  the general rule is that `SKILL.md`'s numbered steps are the router and the
  bibliography is a fallback. Constrained by invariant 3 to `references/*`.
- **Add the tier that is genuinely missing: delegation.** The hierarchy today has
  two levels — always-loaded `SKILL.md`, and references pulled on demand. There is
  no level for *who else the agent can ask*, and `SKILL.md` names no agent at all.
  `film-reviewer` is the instance, it has the best measured yield of anything in
  the project, and A0 is what makes routing to it legal under invariant 3.
- **Resist a middle tier.** The tempting fix is a short checklist between
  `SKILL.md` and the 293-line reference. Do not add one: `instruments.md`'s "what
  has no instrument" section *is* that checklist, and a second copy is the drift
  this repo keeps finding. The problem was never that the 15 lines did not exist
  — it is that nothing pointed at them at the moment they mattered. Adding a tier
  pays standing context to solve a routing problem.

---

## Owner's calls

**0. Is Track C inside or outside `plan.md`'s Phase 6 fence?** This is the
largest call here and the two documents currently disagree. `plan.md`'s risk
section names the scope fence in as many words: *"mitate ships films;
interactivity is one spike behind a gate, and engine-shaped features (input
handling, game state, audio mixing) are non-goals until Phase 6 reopens the
question."* The viewer is input handling. This document treats it as delivery
chrome, distinct from an input driver — a defensible distinction that was
asserted rather than reconciled, and someone reading `plan.md` today would
correctly block Track C as the exact scope creep it fences against. Either
`plan.md` gets an amendment, or Track C waits. Note that C0.5 argues the viewer
*is* Phase 6 arriving early, which makes "amend" the more honest option than
"it's a different thing."

1. **Is the presenter explainer a register mitate commits to?** It arrived as a
   commission. If yes, `travel()` and `shapes.md` become roadmap; if no, the film
   is a worked example and nothing more. Note the package splits on this line —
   type generalizes past the register, travel does not.
2. **`?strip=text` in 3D — scope or implement?** B5 recommends scope now,
   implement on demand. Either way something moves, since the references
   contradict each other today.
3. **Viewer clamp defaults, and the right to decline.** ±35°/±20°/±30% was tuned
   on a 190-unit stage with props in a band. `gearbox` is a tight mechanism;
   `menagerie` has characters with no backs. Authorable per scene with
   conservative defaults — and a scene needs a way to decline orbit entirely,
   because *explorable* is a materially stronger claim on the geometry than
   *filmable*, and it will be false for some shipped films.
4. **Does the 2D template get pan/zoom or a documented opt-out?** It has no
   solver, so the seam has no meaning there.

---

## Measurement debts

Things this plan asserts or assumes that have not been measured. Each is cheap;
none should be believed until it is.

**Each carries the trigger that forces it**, the same column the deferred table
uses — an untriggered debt list sits, and this session's whole lesson is that
unverified numbers get published anyway.

- **PSNR before flipping the gait default** — same sample timestamps before and
  after, `ffmpeg -lavfi psnr`, per `method.md`'s own migration guidance.
  *Trigger: before the distance-space gait becomes a template default.*
- **Whether a PNG master is required for the MP4** — JPEG q92 would take a 60s
  film from 6.3 min to ~1.6 min. The stated reason for lossless is that artifacts
  would add noise to a frame-difference metric, which is an argument about
  `motion`, not about the mp4. Shoot 100 frames both ways, PSNR against a PNG
  master, and if it clears this project's 70 dB imperceptibility bar the argument
  is over.
  *Trigger: the first film long enough that 6 minutes of encode is a real cost — or never; it is annoying, not prohibitive.*
- **Whether 370 material instances for 121 distinct looks costs anything.** The
  node renderer caches programs by graph structure, so the compile cost may
  already be shared and the real cost may be only uniform updates. Measure before
  memoising — and note that memoising would silently share materials the film
  mutates per frame, which is a determinism hazard `method.md` documents.
  *Trigger: before any memoisation of `gloss()`/`std()`/`flat()` is written.*
- **A WebKit measurement for the site's shader-compile figure** (B3), before
  anyone calls it stale.
  *Trigger: before that figure goes on the auditor's list or gets edited on the site.*
- **A second data point on reference-reading order.** Ask the next agent to build
  a film and log which references it opened *and when* — before telling it that is
  being measured. The order matters as much as the set: `instruments.md` opened
  late is a different fix from `instruments.md` never opened.
  *Trigger: the next film built by an agent — free if asked for up front, unrecoverable after.*

---

## Evidence calibration

**Read this before treating anything above as measured doctrine.** The findings
behind Tracks B, C and D come from *one agent, one film, one register, one
session*. What is defensible as general is the **direction** — under a build
brief, build refs win and epistemics refs lose, which follows from rational triage
rather than from anything idiosyncratic — not the specific skip list.

Untouched by that film and therefore unmeasured here: the 2D backend, style
bibles, all three material packs, fur, `poster`/`loop`/`avif` and everything in
`delivery.md`, `warp()`, `latch()`, world cuts and flashes, `match:` cuts, and
DoF/bloom. Roughly half the skill. Nothing above is evidence that half is healthy
— only that nobody went there.

Track A is the exception and that is why it leads: `probe` rests on five prior
recurrences recorded in `instruments.md` plus a sixth, and `transitions` rests on
an export the gate already consumes.

### Moving n past 1 — two axes, and only one of them is the portfolio

Nothing in Tracks A-D generates a second data point; every item responds to what
one film found. Two mechanisms, and they are **not** substitutes for each other.

**Surface coverage — pull a portfolio case forward, do not invent one.**
`plan.md` already carries nine test cases, framed as *"each case exists to break a
different assumption, and each phase gate names the cases it must pass."*
`market-crash` ("no characters at all — charts and glyphs as sets") is the cheap
stressor for untouched surface, and it inherits a gate, which is stronger than
any trigger this document writes for itself. Note also that the examples policy
makes experiments cheap: nothing enters `examples/` without owner approval, so a
throwaway lives in `internal/` at no cost to the corpus.

**Condition coverage — a different axis, and the portfolio does not address
it.** This is the repo's most expensive recorded lesson
(`predecessor-record.md:302`): the framing defect was invisible to the entire
verification surface *by construction*, because **no tool in the chain ever
opened a non-16:9 viewport**. Every gate was met honestly against artifacts that
could not exhibit the defect. The general form is already written down: *"a film
gate proves what the film's rendering conditions can express. One viewport is one
condition. The same is true of one renderer, one window size, one aspect."*

A diverse portfolio does not fix this — the aspect defect happened *despite* one,
and was found by a human resizing a window. **0.16.1 is a fresh instance of the
same class**: all three tooling loads carry `?record=1`, so the live path was
unreachable rather than untested. That is the third instance, after aspect (one
viewport) and `FRAMES_DIR` (one call site).

So carry a standing item, cheaper than a film and recurring: **enumerate the
paths nothing exercises, and close the cheapest one each cycle.** "Conditions" is
too narrow — the family has three shapes and the repo has shipped all three:

- **a condition never produced** — no tool opened a non-16:9 viewport (the
  framing defect); no tool loaded without `?record=1` (0.16.1)
- **a command never run** — `build.js aspect` threw a `ReferenceError` on an
  undefined `stripText` in *both* skills, because the command "had never been
  exercised on either fork since the nocap feature landed"
- **a branch never taken** — the `_nodes`-removed path, where the determinism
  guard silently no-opped under a comment claiming smoke would fail loudly
- **a deployment configuration never exercised** — a film ships into four hosts
  (disk, top-level, an iframe whose parent drives `seekTo`, and the plugin
  install cache) and tooling exercises one. Both the site collision and the
  `film-reviewer` gap are instances. This shape is a *harness* item, not a smoke
  item — smoke checks a scene, and this checks how a scene is delivered

Open by that test right now:

| condition | status |
|---|---|
| non-16:9 viewport | closed — framing-invariance check |
| no-`record` load | closed — 0.16.1 |
| second backend | covered — smoke runs both |
| cold vs warm GPU | partial — shipped-frame check runs first, deliberately cold |
| **framed vs top-level** | **open** — the site path is covered by neither instrument |
| **WebKit** | **open** — verified only by hand |
| **`WEBGPU=vulkan`** | **open** — a standing `plan.md` carry-forward |

### Preserve `circus.html` now — it is time-sensitive twice over

It lives outside the repo and will evaporate. Two reasons that is a cost, not
housekeeping:

1. It is A2's positive control for **window selection** (the two reverts above).
2. **It is a candidate reproducer for the open 1-in-6 `WEBGPU=metal` determinism
   FAIL**, which has resisted reproduction for two versions. `plan.md:275`
   narrows the suspect space toward "shadowed fur shells, multi-shot solver
   traffic, the character rig" — the machinery `bear-and-bees` has and the noise
   chart lacks. `circus.html` has 14 shots and two rigs, i.e. *more* multi-shot
   solver traffic than the current suspect film. A loop of repeated metal smoke
   runs answers it, and `plan.md` notes Phase 4 raises the stakes on this one,
   because a bake is worth nothing if playback is not deterministic.

**But check the environment before the machinery — the current narrowing
excludes the likeliest suspect by construction.** The predecessor's Phase 0
session recorded this, and it is not in either consolidated doc: *"the Chromium
cache scan matched nothing on Apple Silicon (no `-arm64` rels) and silently used
system Chrome — which disagrees with playwright's pinned build about WebGPU.
**That binary split is what made [the half-dead-adapter finding]
warmth-dependent and maddening to reproduce.**"* Both tools were fixed to scan
both layouts.

Note the shape: an intermittent, warmth-dependent, hard-to-reproduce WebGPU
defect whose cause was **which binary got resolved**, not what the scene
contained. The chart-tier experiment that produced the current narrowing varied
the *scene* and held the environment fixed, so it could only ever implicate scene
machinery. Before hunting fur shells and solver traffic, assert the resolved
browser binary is identical across the failing and passing runs — it is one line
of logging and it retires or promotes an entire suspect class.
