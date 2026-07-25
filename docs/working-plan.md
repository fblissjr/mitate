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
| condition coverage (below) | no phase — see [Evidence](#evidence-calibration) |

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

Everything below is one of two interventions, and nothing else earns a slot:

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

## Sequencing at a glance

| # | item | track | fenced | blocked by |
|---|---|---|---|---|
| 1 | `build.js probe` | A | no | — |
| 2 | `build.js transitions` | A | no | — |
| 3 | self-reported elapsed + backend hint on every command | A | no | — |
| 4 | `SKILL.md` step 3 rewrite (four findings) **+ the limit-wins tiebreaker** | B | no | **2** |
| 5 | demote backend policy in `SKILL.md` | B | no | 3 |
| 6 | provenance repairs (PNG home, 700px pointers, site row) | B | no | — |
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

Six agents across films, not one. This is the best-justified item here.

### A2. `build.js transitions <scene>`

Continuity is the axis that got ~1% coverage on the long film: `strip` run once,
over a 0.6s window, on a film with 14 shot transitions, 7 scale-gated
appearances, a fall and a chase. Not because `strip` is bad — because choosing
windows by hand does not scale, so it gets run once and forgotten.

**The windows are not a matter of taste.** Discontinuities live at cut
boundaries, and the scene already publishes exactly that list: `window.SHOTS`
exports `{t, cutEnd}` and `smoke.js` already consumes it. Strip every cut window
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
| occlusion linter | 3 of 4 instances were static staging the contact sheet already catches by eye; the 4th was a transit defect a beat-midpoint sample structurally cannot see, and `transitions` catches it. So the linter automates eye-work on a converging axis — real, but third | probe + transitions shipped and composition rounds still not converging |
| solver-aware staging | the proposed vocabulary fails on its own originating use case: props at fixed world positions a character walks to, which was every exhibit in the film that motivated it | a design that handles walked-to props |
| `travel()` / `LEGS` / `shapes.md` | register-specific to the presenter explainer, which arrived as a commission rather than from the roadmap | a second presenter film asking |
| type primitive (glyph data + renderers) | generalizes past the register — any film with a sign, an axis, a label — but it is a bigger build than it looks, and no shipped example needs it. **And it is governed by an existing rule neither review applied: a glyph alphabet is a *primitive*, so under the chart tier it lands as a chart — a grid of all 36 glyphs, byte-compared per backend — before any film uses it.** That is also the right shape on the evidence: all three glyph bugs were one letter built on a wrong assumption, which a grid makes obvious at a glance and a title card cannot | a second film needing built text, or the diagrammatic register (see B5) — entering at the chart tier, not in a film |
| splitting `method.md` (960 lines, 45% of reference text) | it would create exactly the doc-versus-doc boundary B4 exists to patch, and `method.md`/`instruments.md` already contradict in that shape. Its own justification is honest but weak: "I read all of it, so splitting wouldn't have helped me read" | B4's tiebreaker landing first |
| distance-space gait as the template default | the algebra is sound (`{start:0, rootX:s}` reduces identically where travel is monotone) but was argued, not measured | the PSNR comparison `method.md` prescribes |
| `--workers` in `build.js all` | **not a bug — retracted.** Clean cold run: exit 0, 180/180 frames, 32.5s vs 38.1s. It works and buys ~1.17x, contention-bound | a workload where 15% matters |

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
conditions the verification surface never produces, and close the cheapest one
each cycle.** Open by that test right now:

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
