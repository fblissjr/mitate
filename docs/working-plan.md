last updated: 2026-07-31

# Working plan: instruments, routing, and the viewer

> **Read [`restructure-2026-07.md`](restructure-2026-07.md) first while it
> exists.** That migration is the live queue and parts of this file are
> superseded by it. Where the two disagree, the restructure plan is newer and
> wins. A fresh session following this file's sequencing table read 460
> superseded lines before finding that out.
>
> **The sequencing table now carries a verified status column** (checked
> 2026-07-30 against the tree, not against this document's memory of itself).
> An earlier version of this warning said "items 1 and 2 have shipped" — item 1
> shipped and **item 2 never did**, which is the failure this file keeps
> producing: an annotation asserting a state instead of a column recording one.

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
- A **tool** — `film-reviewer`, which *both shipped gate films were reviewed by*
  and which has the best measured
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

## Phase 4 readiness (2026-07-29)

**The hardening in 0.16.16-0.16.21 was a Phase 4 prerequisite, not a detour.**
The bake proposal's red line #3 is "`smoke.js`'s determinism or seek-purity
checks are weakened, special-cased, or given a per-scene opt-out" — which means
Phase 4's entire defence against tier drift IS the trustworthiness of those
checks. This session found the console filter failing every 3D scene on the
default path, two of three brackets incapable of failing, and rule 5's control
absent from the tree. A bake landing on top of that would have been guarded by
instruments nobody had run.

What Phase 4's eval criteria now rest on, verified rather than assumed:

- **Criterion 2 ("smoke green on both backends with the UNTOUCHED checks")** —
  measured green on WebGL2-fallback and `WEBGPU=metal`, on the full
  template+example corpus. Before 0.16.16 the fallback half was red.
- **Criterion 1 (`bake --verify` re-bake identity)** — a new check, so
  CLAUDE.md invariant 6 applies by construction: it ships with a bracket that
  can go red, or it is decorative. Model it on `bracket-determinism.js`, which
  already injects load-time randomness and proves the reload arm catches it.
- **The Rapier pin** (spike list, item 1) — do NOT introduce it as prose. The
  three pin lived in a comment for the project's whole life and nothing checked
  it; `THREE_PIN` + a per-scene stamp + `scripts/selfcheck.js` is the pattern to
  copy, and the self-check already cross-checks pins against the CI install and
  SKILL.md so a fourth consumer cannot silently disagree.
- **Criterion 3 (size bracket against the 1.09 MB vendor bundle)** — that figure
  now lives only in `references/webgpu-stack.md`. It was restated in `plan.md`
  until 0.16.21, which was a duplicate aimed squarely at this criterion.

**UPDATE 2026-07-30: CI has now run, and it found a real defect on its first
push.** The static job is green on Linux, including `selfcheck.js` with the
git-based freshness check (`fetch-depth: 0` was required — a shallow clone makes
every marker look stale). The gate job is 7 of 8 scenes green, and the eighth is
the finding:

> **`materials.html` failed smoke's in-session determinism arm on ubuntu-latest /
> WebGL2 — `seekTo(5.36) not deterministic` — on three consecutive runs, then
> passed on two. It does not reproduce on macOS on hardware or software GL.**
>
> The three-then-two pattern is confounded: the passing runs also changed the CI
> environment. Intermittency and an environment change cannot be separated in
> that sample, and an earlier version of this entry called it "reproducible …
> a state dependency, not a race" on 3-of-3 — retracted. Every failure did land
> on the same `t`, which a uniform flake would not.

Postmortem of the span that found it:
[`docs/postmortems/2026-07-29_span_instrument-hardening.md`](postmortems/2026-07-29_span_instrument-hardening.md).

**RESOLVED 2026-07-30 — and demoted, then replaced by something worse.** Measured:
screenshots-only 40%/30%/20% on three cells, versus 0 of 200 with an in-page GPU
readback inserted, same runner and scenes. The readback is the only variable, so
the mechanism is a capture race and `settle`'s double rAF is too short on a slow
GL stack. The corpus was never broken; `smoke.js` was reporting a capture race as
a scene defect, which the comment above that check says is the one thing it must
never do — twice now, five months apart.

**The replacement item, which is worse:** `shoot.js --workers N` runs N pages
capturing concurrently, i.e. maximum presentation contention, and its output is a
shipped MP4 rather than a gate verdict. If `settle` can be outrun on a slow stack,
that is where the same mechanism causes real damage, and **nothing samples it.**
**FIXED 0.16.28, verified as a red/green pair on Linux** (shipped path 0 of 200;
control 10/10 on the worst cell). All three `shoot.js` capture paths route through
`seekSynced`, so the exposure is closed *by construction* wherever it was
reachable. What remains is narrower and honest: it has never been **measured**
under `--workers N`, where contention is highest. *Trigger: before trusting a
parallel-shot deliverable made on a loaded machine — shoot the same range at
`--workers 1` and `--workers 4` and diff the frames.*

The paragraph this replaces read as follows, and its escalation was right even
though its substance was wrong:

**This was the top item before Phase 4**, ahead of everything else on this
page. Not because a bake depends on it, but because the bake's eval criterion 2
is "smoke green on both backends with the UNTOUCHED checks" and main is currently
red — and a permanently-red CI teaches people to ignore CI, which is the
warning-fatigue failure this plan already tracks for the crushed-exposure
threshold. Diagnosis notes, ruled-out hypotheses, and the constraint against
resolving it by exemption are in `references/materials.md` at the ordering
discipline. There is no local repro, so CI is the loop: the honest next step is a
diagnostic job that dumps both hashes and a frame strip around 5.36 as artifacts.

The paragraph this replaces read as follows, and it was right:

**One thing is NOT de-risked, and it is the biggest: CI has never run.**
`.github/workflows/gate.yml` exists and its static half is verified locally, but
nothing in it has executed on Linux — so by this document's own standard it is a
claim, not a control. It needs a push. Until then, "the gate runs unattended" is
exactly the kind of sentence this session spent five commits deleting.

**A trigger worth knowing before you start:** rule 5's `sortObjects` relabel
carries "rebuild the repro on the next three bump **or any change to the boot
sequence**." A bake that loads sampled data before `sceneReady` is a boot-sequence
change, so expect that trigger to fire during Phase 4 rather than after it.

Deliberately left undone, because none of it blocks a bake: the
measurement-assertion sweep (ratcheted, so it cannot worsen), the
crushed-exposure threshold **decision** (the measurement is done — see the debts
section below; only the disposition is undone), the PNG-vs-JPEG and
caption-legibility figure duplications (both already tracked above).

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
examples and the 2D template. The same change also fixed `site/app.js`, which swallowed `seekTo` exceptions at
two sites so a dead film kept a healthy-looking scrubber. *(An earlier draft
called that "the one host configuration neither instrument reaches" — retracted
in 0.16.2: the check is **not** blind to a swallowing host, because it counts
after the inner call returns. What survives is that nothing tests the embedded
deployment configuration.)*

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
| A1 `probe` | `build.js kinematics`, the state-space probe — **bracketed**: boundary/interior 1.0001 vs 0.0531, spread 1.003x vs 72.7x, on scenes `motion` called indistinguishable | declined on earn-in, dropped in migration, then **REBUILT AND SHIPPED** as `build.js probe` (0.16.37 amended the prime directive to admit it). The third independent arrival of the same shape — see A1 |
| A3 self-reporting | *"Every check states its plan and prints the samples it used. A green result becomes auditable instead of authoritative"* | **partial** — see A3 |
| D `subjectFromObject` | *"Structural: declarations are never checked against the thing they describe"* | **specified, never built, and a comment claims it shipped** |
| B5 `txt()` / `strip=text` | *"Structural: make the text helper good enough that turning text off is possible"* | **half-built** — 2D got both parts, 3D got the instrument only |
| B4 limit-wins | *"Root cause 2 — vocabulary that promises more than it measures"* | inherited diagnosis, new tiebreaker |
| the spine | *"the pull toward tuning a coefficient is strongest exactly when a thing is nearly right"* | **written down, then violated four times in the successor** |
| deferred: occlusion linter | *"No register-aware lint engine. Two candidate instances exist; no film has been blocked. Revisit when one is."* | inherited decline, same earn-in shape as A1 |
| deferred: `shapes.md` (**narrowed 2026-07-30** — the decline covers scene PRESETS, not shape-problem technique; the predecessor's procedural cookbook was promoted into `materials.md` under that reading, see `plan.md`'s Anti-template principle) | *"No content templates, scene presets, or genre scaffolds. This is the line that protects 'any scene you want'."* | inherited decline — **and a doctrinal one**, cited by the Anti-template principle |
| deferred: 2D pan/zoom (owner's-call 4) | *"No 2D shot solver.* The film built to want one concluded the `{x,y,zoom}` rail was expressively sufficient" | inherited decline, with a recorded alternative |
| Track C viewer | none in the hardening plan; **`museum-walk` in the portfolio** | Phase 6, arriving early |
| A2 `transitions` | **0.5.1** — smoke began sampling transition windows after review found no fixed-fraction sample ever landed in a blend window | **export shipped, the sweep did not** |
| A0 ship `film-reviewer` | both Phase 2 gate films reviewed by it (`plan.md:471`, `:509`); catch record in 0.9.0 and 0.11.0 | **SHIPPED 0.16.32** — `plugin/agents/`, routed from SKILL.md step 3 |
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

## What actually wants structure, and what shape (2026-07-30)

Owner's question, recorded because the existing deferred row answers it too
narrowly. That row declines a JSON projection because `SUBJECTS.pos` is a
function of `t` and "a projection that cannot represent the interesting half lies
about completeness." True — **and it proves too much.** That is a reason not to
project everything, not a reason to project nothing.

**The boundary is not code-versus-data. It is *declaration about the film*
versus *computation over `t`*.**

| | fits structure | why |
|---|---|---|
| `BEATS` | fully | flat records: name, duration, caption |
| `STYLE`, `CONFIG` | fully | bags of scalars and colours |
| `SIZES`, `LENS`, `CUT_DUR` | fully | lookup tables |
| `SHOTS` | nearly | enums, names, numbers, beat anchors — plus *references* that must resolve, which is precisely what a validator wants |
| `SUBJECTS` | **straddles** | extents are data; `pos` is a trajectory. A declaration whose value is a function |
| `buildWorlds()` | no | imperative construction |
| `animate(t)` | no | this is the film's actual authorship |

**Then ask what the structure is FOR, because that decides the shape.** Four
wants, and three of them are read-only:

1. **Validate before rendering** (`build.js check`) — read
2. **Extract patterns across films** (the flywheel) — read
3. **Diff two films' *decisions* rather than their text** — read
4. **Mechanically restructure** — retime, reorder, insert a beat — read *and write*

Only (4) argues for a different storage format, and it is the weakest of the
four: a human or an agent editing JS is fine, and the cited pain — regex-editing
source — is a tooling habit rather than a format problem.

**So the pressure is on reading, and reading does not need a new format. It needs
addressability.** Which this repo already has a mechanism for: extend the fence
markers to data blocks (`/* ==== BEATS-START ==== */`), so a tool can find a
table without a regex and without a parser guessing. That is the unresolved
proposal from the 2026-07-25 intermediates memo, and it costs nearly nothing
because the fence machinery exists — note it would be a fence used for
*location*, not for parity, which is a new use of an old tool and should be said
out loud when it lands.

**Where structure genuinely pays and costs nothing: the OUTPUTS.** A `probe`
result, a `check` result, a pattern extraction — those should emit JSON so tools
can chain. Nobody hand-edits them, so none of the objections apply.

**The failure mode to design against**, named in the same memo: expressions
in strings. "That is where this class of project dies: you reimplement arithmetic
badly." Any shape that ends up with `"pos": "lerp(a, b, t)"` has lost — it
discards the type checker, the editor, and `probe`'s ability to evaluate the
thing directly.

**Not decided, deliberately.** This is an answer to *what wants structure* and
*what shape*, not a commitment to build it. The trigger is `build.js check`,
which needs to read the tables and is the first consumer that would pay for the
fences.

### The naming question is a different one, and it gates Phase 4 (2026-07-31)

Everything above answers *what shape* the declarative layer should take. It does
not answer what the layer **is called or contains**, and
[`VISION.md`](../VISION.md) names that as the blocker on the physics bake: the
existing layer is *"substantial, it works, and it is **unnamed, unspecified, and
unvalidated as a whole**"*, and adding another layer on top of tables nobody has
enumerated *"buys a capability with no foundation. **Enumerate first.**"*

So there are **two vocabulary questions and they are not the same work**:

| | what it names | where | gates |
|---|---|---|---|
| tooling vocabulary | what the tools *do* — `build.js`'s verbs | Track E, E2 | nothing; it is CLI ergonomics |
| authoring vocabulary | what a scene *declares* — `BEATS`, `SHOTS`, `SUBJECTS`, `STYLE`, `CONFIG`, `SIZES`, `LENS` | here | **Phase 4** |

**Run them independently — owner's call, 2026-07-31, and the reasoning is that
one blocks a phase and the other does not.** E2 waits on E0's allowlist because
that is what draws the export line for it. This enumeration waits on nothing: it
has no encoder dependency, no relationship to the boundary work, and sequencing a
Phase-4 prerequisite behind a verb rename would be backwards. Renaming `all`
changes nothing about how a film is written; enumerating `SUBJECTS` changes what
the engine can validate and what a bake is allowed to rest on.

**Do not start the enumeration from a blank slate.** `SUBJECTS` "straddling" the
boundary — extents are data, `pos` is a trajectory — is not a hypothetical shape:
it is the tracked defect class in
[`pattern-ledger.md`](pattern-ledger.md), **"declared extents rot; measured ones
do not"**, standing at 6 instances with `subjectFromObject` already promoted as
its fix. That row bears directly on the question the enumeration has to answer —
whether `SUBJECTS`'s extents need to become functions of `t` rather than declared
constants — and it is empirical evidence that already exists. Further instances
were observed in externally-built scenes `(local)`; read them as corroboration
and **do not add them to the ledger's count**, which gates promotion triggers and
is defined over this repo's own corpus.

**The risk of running them separately is that two naming passes disagree**, and
the mitigation is that neither pass invents its own rule. The principle is one
line — *group by the question an author is asking, not by what the implementation
happens to touch* — and it gets planted once in `method.md` (Track E, E3) so both
passes cite the same sentence rather than each deriving a taste. Whatever either
concludes lands in [`references/glossary.md`](../plugin/skills/mitate/references/glossary.md),
which exists for exactly this and is 96 lines today.

## Salvaged from the ancestors, and what was deliberately left behind (2026-07-30)

`internal/legacy/` is being archived off this machine. An audit checked every
prose file in it against `predecessor-record.md`, `plan.md` and this file before
calling anything uncaptured. **The consolidation held** — the four explainer-video
planning docs, `screenwright_plan.md` and all twelve carried-over references are
verbatim or corrected in the tracked corpus, and `internal/prior_artifacts/` is
byte-identical to `internal/legacy/docs/`, so it is fully redundant.

**Promoted (0.16.35):** the procedural-asset cookbook into `materials.md`, which
two shipped files already claimed contained it.

**Corrected (0.16.35):** the depth-swap limitation restored to `materials.md`;
the marketplace claim in `plan.md` and `predecessor-record.md`, which is what made
archiving look free.

**Left behind deliberately. Each has a trigger; none is silently dropped.**

| what | where it was | why not promoted | trigger to go get it |
|---|---|---|---|
| `references/audio.md` (47 lines) — the ffmpeg assembly recipe (`anullsrc` base, `adelay` per clip, `amix`, `sidechaincompress` ducking) and the HTML sync sketch (`audioEl.currentTime = t` on seek) | explainer-video | Audio is a stated non-goal until after Phase 5, and `plan.md` already records the designed-but-unwired status. The *spec* survives in `predecessor-record.md`; only the assembly mechanics are going | **Phase 5 closing, or any decision to wire audio.** Three citations in `predecessor-record.md` point at this file — they are now pointers into the archive, not the repo, and should be read that way |
| three 2D style packs (140 lines) — paper-cutout, blueprint, neon-dark: palettes, register rules, per-pack hazards labelled observed vs predicted | explainer-video | The 2D backend has shipped no film since the rename, so register documentation for it would be doctrine ahead of demand | **The first 2D film anyone actually builds.** Note the real gap this exposes: `bibles.md` is v2 and 3D-only (`lens`, `energy`, `cutDur`, `bloom`, `dof`), so `scene2d.template.html` ships with **no art-direction reference of any kind** |
| `one-scene-every-format.html` (32 KB) — the only worked 2D film in existence | explainer-video | Superseded in stack terms only by 18 diff lines; `plan.md` explicitly exempts the 2D backend from the node-stack rebuild, so it is not superseded by construction the way the five 3D films are | **The first 2D film**, again — it is the only worked reference for one, and `examples/` ships five 3D and zero 2D |
| the committed-artifact-versus-re-render argument | explainer-video's `bibles.md` | *"a committed artifact can go stale against the scene, a re-render cannot."* This repo took the opposite decision and, as of 0.16.35, has effectively come back around to it — `gearbox-neon.html` is now derived rather than stored | none; recorded here so the reversal is not rediscovered as a fresh idea |

## Confirmed defect: the erupt recoil slides all four paws (2026-07-30)

`examples/bear-and-bees.html` — **measured, not inferred.** During `erupt`
(t=14.2-15.3, 1.1s) `bearXAt` adds `-.38*pulse(t,'erupt',.12,1)`, while `vAmp` is
0 because the amble ramp has completed and the flee has not begun. `gaitPose`'s
blend collapses fully to the body-relative rest stance, so the IK targets become
constant in root-local space:

| t | root x | hind-left paw | fore-right paw | paw − root |
|---|---|---|---|---|
| 14.20 | −1.200 | −1.217 | 0.347 | **−0.017** |
| 14.75 | −1.571 | −1.588 | −0.024 | **−0.017** |
| 15.30 | −1.200 | −1.217 | 0.347 | **−0.017** |

`paw − root` constant to three decimals: the paws translate rigidly with the
body instead of holding ground, across a 0.371-unit recoil, in an FSA shot that
frames the whole animal. Found by reading in this session and confirmed with
`build.js probe` in three page loads — **the first use of that instrument on
something nobody had already measured by hand.**

**Not fixed, and the fix is a judgement call rather than a mechanic.** Either
plant the feet through the recoil (drive `gaitPose` with a non-zero `vAmp`
derived from the recoil's own displacement, so the grid holds), or accept it as
a whole-body flinch and make it read as one. The second is legitimate — a real
animal recoiling on its haunches does drag its feet — but right now it is an
accident of `vAmp` hitting zero, not a decision.

**Trigger to act:** the next edit to `bear-and-bees.html`'s erupt beat, or the
next character film whose body translates while `vAmp` is 0, which is the general
shape.

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

**There is no extent check.** Verified exhaustively **in the working tree**: zero occurrences of `Box3`,
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

**Status column verified 2026-07-30 against the tree**, by checking the artifact
each row claims rather than by reading this document. Rows marked `—` were not
re-checked this pass and should be treated as unknown, not as pending.

| # | item | track | fenced | blocked by | status (2026-07-30) |
|---|---|---|---|---|---|
| **0** | **ship `film-reviewer` with the plugin** | **A** | no | — | **DONE** — `plugin/agents/film-reviewer.md` ships |
| 1 | `build.js probe` | A | no | — | **DONE** — in `build.js`'s `USAGE`, 0.16.37 amended the prime directive to admit it |
| 2 | `build.js transitions` | A | no | — | **NOT DONE** — absent from `build.js`'s verb list |
| 3 | self-reported elapsed + backend hint + resolved binary | A | no | — | **NOT DONE** — no elapsed or backend-hint reporting in `build.js` |
| 4 | `SKILL.md` step 3 rewrite **+ route to the reviewer + the limit-wins tiebreaker** | B | no | **0, 2** | **PARTIAL** — SKILL.md was rewritten whole in 0.16.34 and routes to `film-reviewer`; the limit-wins tiebreaker is absent, and item 2 never landed |
| 5 | demote backend policy in `SKILL.md` | B | no | 3 | **DONE** — carried by the 0.16.34 rewrite, which put backend policy after the workflow |
| 6 | provenance repairs (PNG home, 700px pointers, site row) | B | no | — | **PARTIAL** — the 700px pointers resolve; the `source-of-truth.md` site row landed 2026-07-30 |
| 6b | **fix the false extent-check claim** in `solveShot`'s comment | B | no | — | **DONE** — both 3D templates now say the guard is a lie about extent and to measure instead |
| 6c | sweep code comments that assert a check exists (second instance of the class) | B | no | — | **SUPERSEDED** — `selfcheck.js` check 6d makes the class mechanically detectable instead of swept by hand |
| 7 | the batched kit release | D | **yes** | — | — |
| 8 | viewer overlay + capture | C | no | 7 | — |
| 9 | camera bake + the fork | C | no | 8 | — |

**Track E is not in this table.** It was added 2026-07-31, after the status
column was verified, and adding rows dated differently would silently corrupt a
column whose whole value is that one date covers every row. Track E carries its
own ordering, and its E0 gates its own E1 and E2.

**What is actually left of Track A, after the status column:** items 2 and 3.
They are independent of each other and of everything else, so they can run in
parallel today; item 1 shipped and item 6b is closed. **Item 7 is the only fenced
work on this plan and it is batched deliberately** — see Track D. Item 4's
remaining half (the limit-wins tiebreaker) still waits on item 2.

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

**Owner's-call 0 is resolved in Track C's favour** (2026-07-25), so this is a
standing argument rather than a conditional one: the camera bake is the cheapest
Phase 4 spike, and de-risking the owner's stated priority outranks a routing
edit, which is a live reason to move items 8-9 ahead of 4-6.

*Struck 2026-07-30: this paragraph previously announced the resolution and then
restated the same claim in its superseded `if Track C is admitted…` form, ending
"the order above assumes the fence holds" — a fence that had already been
amended. Annotating a superseded sentence leaves two readings; striking it leaves
one.*

---

## Track A — instruments (do these first)

These are the spine's first clause, and they are the highest-confidence items in
the package because none of them rests on a single film.

### A0. Ship `film-reviewer` with the plugin — the item that costs nothing to build

**Ranked first under the reachability clause, and it reorders the rest of this
track.** **Correction, 2026-07-30:** three places in this file called it "a gate
criterion at `plan.md:460`". It is not, and that line is not where it appears.
`plan.md:471` and `:509` cite it inside Phase 2's **DONE narrative** — what was
actually done to `menagerie` and `bear-and-bees` — and the `*Gate:*` clauses for
Phases 2 and 3 do not mention it. The `examples/` gate is *"owner approval, not
rendering"* (`plan.md:657-658`). The real argument needs no overclaim: **both
shipped gate films were reviewed by it** — *"film-reviewer-reviewed with all HIGH
findings fixed"* (`plan.md:471`) — and the changelog credits it
with the defects author-eyes missed on both Phase 2 gate films: menagerie's look
beat entirely off-frame, its only closeup 70% void, a tail-wag spiking 5x, a
breath holding every character 3-5% squashed from frame 0; bear-and-bees' contact
z-axis miss *"faked by a lucky camera angle"* — instance five of the contact
class — plus the flee clipping the hive and the comedy's face never facing the
lens.

**It lives at `.claude/agents/film-reviewer.md`, outside `plugin/`.** Verified in
the **working tree** (per invariant 7, and separately confirmed against a real
install cache, which contains only `.claude-plugin/`, `README.md` and `skills/`):
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

**Make disposition structural, not permissive** — the retired reflection rule's
second lesson applies here exactly: *"the escape hatch ('if nothing, say so') is
weaker than the elicitation."* Wording it as "delegate a review, and you may
disagree" puts a weak permission under a strong instruction, and it will lose the
same way. The convention is that **every finding exits as fixed or dispositioned
with a reason and a trigger, recorded** — a required field, not an available out.
That is the shape 0.9.1 used, and its trigger fired two lineages later, which is
the evidence it works.

**And note the same lesson constrains the prescription's own wording**, because
`SKILL.md` loads in full on every activation: the instruction is ambient even
where the action is not. That is the retired rule's problem at much lower
strength — two population filters down — but it is the reason the chart-tier
exemption earns its place and the reason this text must *displace* the
round-budget sentence rather than sit beside it.

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

**The control is this item's revisit trigger, not a nice-to-have.** The policy is
landing before its evidence, which is acceptable for a reversible doc line, but
an untriggered debt is the format this plan just fixed. Same column as everything
else: *trigger — before the step-3 prescription is written.*

**Score it against the answer key, written in advance.** `circus.html` carries
three classes of defect and **which class the reviewer hits is the whole
finding**:

| class | contents | what it means |
|---|---|---|
| **1** — found by an instrument, already fixed | the bear inflating on camera; the walk-through of the block row | reviewer adds nothing over `transitions`; offer-it wording was right |
| **2** — seen by the author and **dispositioned**, not fixed | the eye rings + lashes reading as a black bar at MS (judged faithful to the reference and shipped); the whip-cut into the ship beat, where the block row crosses her face for ~5 frames (called a transient inside a 0.16s cut) | **the interesting class** — judgment over an author's dismissals, which no instrument does, and the reason to prescribe an agent at all |
| **3** — neither the instruments nor the author saw it | unknown by construction | strongest result; justifies prescription on its own |

**The viewer layer is unkeyed territory, and it needs its own advance
classification.** `circus.html` carries a prototype viewer — orbit, captions,
caption size, scrub — that postdates every reference the reviewer is reading and
that no one but its author has examined. The three classes above cover the
*film*; they say nothing about the viewer. Fixed in advance:

| reviewer output about the viewer | reading |
|---|---|
| a genuine defect in it | **class 3** — nothing covered it and nobody else looked |
| "the viewer threatens determinism" | **characterised false positive** — it is gated on `?record=1`, and byte-identity against the pre-viewer render was verified (`cmp` clean, infinite PSNR). If this lands as a HIGH it reports the reviewer's priors, not the film's state |
| **off-brief commentary** (code quality, architecture) rather than a film defect | **scope drift**, and neither a hit nor a false positive. A prescribed reviewer that wanders is a cost, and this is the run that would reveal it |
| silence | uninformative — no reference it reads describes the feature |

**One thing to watch that is about the reviewer rather than the film: does it
measure or does it assert?** Its brief says it reviews "using the shipped
instruments." If it *runs* them, its claims are measured. If it reads the source
and infers — particularly on determinism, which cannot be established by reading
— then it committed this project's central error inside the very pass being
evaluated for prescription. Record which it did. That is arguably more decisive
for the prescription question than the yield count.

**A second discriminator is sitting in the fixture, and it is free.** The nocap
sheet on `circus.html` **does not strip the title card** — the logo is geometry,
and the 3D templates ship no `txt()`, so the two title beats survive the
"cover every word" pass with their words intact. A reviewer that opened that
image is positioned to notice its own semantics pass is compromised there; one
that inferred from the source, or trusted the command name, reports semantics
clean.

This is fair rather than a gotcha: the reviewer is pointed at `instruments.md`
with "read this before trusting any green result," and the cached 0.16.0 copy
says at `:218-221` that `?nocap` "does **not** remove canvas text." The knowledge
required is in the file it was told to read.

Score it in three states, not two — the middle one is where a correct
observation could be misfiled as a miss:

| reviewer output | reading |
|---|---|
| notes the nocap sheet still shows words on the title beats | **measured, and knows the instrument's contract** |
| flags the visible words as a *film* defect without connecting them to the stripped pass | **still measured** — it opened the image; the misattribution is a softer, separate signal |
| reports semantics clean with no mention | **ambiguous** — did not look, or looked without reading the ledger. Both are the behaviour under test |

Note this scores on the measure-vs-assert axis, **not** the yield count: it is a
fact about the instrument, not a defect in the film.

Note the environment is doubly old, and both ways are correct for realism: the
prototype's `smoke.js` is also pre-0.16.1, so a "smoke green" from this run
carries no live-playback check at all. Absence of that observation is not a
miss — it is not executable there.

**Who runs it matters, and it cannot be the film's author.** Applying the brief to
one's own fixture reproduces the condition that already failed — eight rounds of
self-review. The value in the agent is independence, and an author is
definitionally not independent of their own film. It needs a real invocation from
this repo, where the agent is scoped.

One methodological caution for whoever does: running the *brief* as a general
agent is indicative, not an instrument run. Record which references actually
resolved — the brief's four dangling pointers are exactly what an installed user
would hit, so an agent that resolves them from this repo is getting context the
target population does not have. That is the difference between measuring the
agent and measuring the agent-plus-repo.

*The policy is already written — shipping makes it compliable, not new.*
Every scene that has entered `examples/` got a reviewer pass (`plan.md:471`,
`:509`), even though the written gate is owner approval rather than a reviewer
run — so shipping it makes an established practice reachable, not new.
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
> the same wrong answer** — recorded in
> [pattern-ledger.md](pattern-ledger.md), which exists because no trigger
> phrased as a count can fire without one. Everything else in the deferred list keeps its
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
- **The ~700px caption figure is in FOUR places**, not three, and this item undercounted it until 2026-07-25: `method.md` (the home, which alone carries the conditions — 30px at 1920, 10px at 640, 5.69px at 364, all exactly `0.015625 x frame width`), plus restatements in `instruments.md`, `README.md` and `site/index.html`. Line numbers are deliberately omitted here: the earlier version cited three that had already moved, which is its own small lesson about pinning a repair item to line numbers instead of to content.

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

The instance that motivated this was `method.md` promising every draw routed
through `txt()` becomes a no-op under `?strip=text`, while **the 3D templates
ship no `txt()`** and alias `strip=text` to the DOM-caption `nocap` — with
`instruments.md` correctly recording that the pass cannot see canvas text. The
exact failure class the doc was born from: a reference confidently describing a
mechanism the stack never had, in a shape the doc's rules do not detect.

**Resolved in 0.16.13-0.16.14, which does not retire this item.** The limit won,
as the rule below would have required — but it won because a human asked for a
full read of SKILL.md, not because anything detected it. The correction then had
to be chased into `SKILL.md`, the DRIVER fence across eight carriers, and
`shoot.js`, over two releases, because fixing the reference does not move the
copies. The underlying capability gap (3D has no `txt()`) is still open as B5, so
the companion clause below is still the live risk: implementing `txt()` in 3D now
has to clear the limit in *four* places, not one.

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

## Track E — the review loop should need nothing but bun and a browser (2026-07-31)

**Why this track exists, stated before the mechanism, because the mechanism is
not the point.** [`VISION.md`](../VISION.md) names the goal as an engine and
"the **harness** that proves all of it — enough that an agent can turn **any
context** into a scene, reliably", and measures success partly by whether "a
session arriving with no context can find what it needs and act correctly". The
build-review-fix loop is how an agent learns to make a scene land. **Every
external dependency on that loop is a tax on the thing this project is for.**

Export is not on that loop. Owner, 2026-07-31: *"The export path is seriously
secondary and not important in any core sense. The HTML scene itself is the real
artifact… If ffmpeg is genuinely only used for export, it doesn't belong in
GitHub Actions or as a core test in any way."*

Two consequences, and the second reverses an earlier draft of this track:

- **The review verbs are worth freeing** because an agent should be able to build
  and verify a scene with bun and a browser and nothing else. That is the payoff,
  not dependency hygiene for its own sake.
- **The export verbs are deliberately NOT gated, and that is a decision rather
  than a gap.** An earlier version of this track — and both independent analyses
  — flagged "after decoupling, export verbs are exercised nowhere unattended" as
  a problem wanting an encoder-equipped CI job. It is not a problem. A rotted
  export verb costs one annoyed moment at export time; a rotted review instrument
  silently corrupts the loop the project exists to teach. No encoder-equipped CI
  job for **export**.

  > **CORRECTED 2026-07-31, same day, and the error is instructive.** This bullet
  > first read *"Do not add an encoder to CI… stop proposing an addition"* —
  > stated flatly, about ffmpeg in general. The owner's directive was
  > **conditional**: *"**If ffmpeg is genuinely only used for export**, it doesn't
  > belong in GitHub Actions or as a core test in any way."* It is **not** only
  > used for export — five review verbs still call it — so the condition is not
  > yet earned, and the conclusion was recorded as though it were.
  >
  > The asymmetry argument makes the same point in reverse: it says a rotted
  > review instrument is the expensive one. **Review tooling therefore has the
  > strongest possible claim on unattended coverage**, and today CI exercises
  > none of it (`bracket-commands` prints `review 0 exercised, 5 skipped`). The
  > directive was about export. It was never about the review tier, and applying
  > it there would have used the owner's words to protect the exact hole those
  > words were worried about.

**The finding, measured, not argued.** `smoke.js` — the validation instrument —
has no encoder dependency: the gate ran with no ffmpeg on PATH and reported `all
scenes pass`. ffmpeg never receives HTML, never runs JS, never drives the
browser; all 10 encoder call sites read raster files already written to disk by
Playwright. They split **4 / 5 / 1**:

- **4 serve export** — `video`→mp4 (282), `avifenc` (427), `img2webp` (452), and
  the frame scaler at 354. **The scaler is not a migration target**, and a first
  pass of this analysis wrongly grouped it with the review tilers because it
  writes stills: it is reached only through `inlineExport`, whose only callers
  are `avif` and `loop`. It feeds encoders that stay encoder-gated regardless, so
  moving it buys nothing. Corrected 2026-07-31 against a second analysis.
- **5 are review stills** — `poster` (476), `aspect` (530), `sheet` (569), the
  squint strip (575), `strip` (642). Scaling one PNG to a JPEG, tiling stills
  into grids.
- **1 is measurement** — `motion` (675), which differences frames and prints
  numbers, writing no file at all.

**So the migration target is 6, and only 4 call sites are load-bearing for
export.**

**So the boundary the docs already describe is not implemented.** SKILL.md
separates step 6 ("the HTML file IS the deliverable") from step 7 ("Export, only
if the destination cannot run a page"); `delivery.md` and `recordings.md` are
separate references with explicit "Not here" edges; `VISION.md` does not mention
export at all. `build.js` presents 13 flat peer verbs where `bundle`, `strip` and
`avif` look like the same kind of thing. **The CLI surface teaches the wrong
model, and that is where the confusion actually comes from** — nothing ever
claimed ffmpeg was core; it is simply everywhere, and ubiquity reads as
infrastructure.

Ordering note that is easy to get backwards: **E0 makes E1 and E2 safe**, because
once the allowlist has ratcheted down, "what is export?" stops being a judgment
call and becomes whatever is left inside it.

### E0. An encoder-boundary ratchet in `selfcheck.js`

Pin the exact set of functions permitted to invoke `ffmpeg`/`avifenc`/`img2webp`,
and **let that set only shrink** — the idiom this repo already runs twice (the
measurement-assertion budget, and "1 probe instrument, read-only and
single-call-site"). Seed it at today's ten sites: that is the honest baseline,
not a target. Ships with its red arm in `scripts/bracket-selfcheck.js` proving it
goes red when an encoder call appears outside the allowlist — invariant 6, and
`static.yml` already runs `selfcheck.js`, so no CI edit is needed.

**Resolve one question before writing the check**, raised by the second analysis
and a real gap in the proposal as first stated: "may only shrink, never rise"
handles drift-back cleanly but has no answer for a *deliberate, legitimate*
addition later — a genuinely new export format verb. Check whether the
measurement-assertion ratchet this is modelled on already has an escape hatch for
"deliberate addition, not drift", and reuse it rather than inventing a second one
for this case.

Each later migration then deletes one function from the allowlist and one
`needs: 'ffmpeg'` from `bracket-commands.js`, and both checks prove it. **Today
9 of 17 bracket rows skip without an encoder; the target is 4.** That is a
measurable finish line, and it exists only because the encoder table was made
honest first (0.16.42).

### E1. Migrate the non-export verbs off encoders

Cheapest-risk first. **Do not batch these**; each has a different control.

- **`motion` — best candidate, and the one deferred by the first analysis.** It
  writes no artifact, so there is no visual-quality risk; the output is a number.
  The refactor is one this function has *already performed once*: the beats
  manifest rides along as a side product of the shoot via `MANIFEST_OUT`, and the
  per-frame delta should ride along the same way, leaving `motion` as bookkeeping
  over a series. Two things must be got right: the metric is the luma-weighted
  mean of per-channel `|diff|`, **not** `|diff of luma|` (they diverge when
  channels move oppositely), and ffmpeg's RGB→YUV range and coefficients set the
  absolute scale that `DEAD_FLOOR = 0.05` lives in.

  **Measured 2026-07-31, and it is worse than "the scale might shift".** The
  invocation pins nothing colour-related — no `-colorspace`, `-color_range`,
  `-pix_fmt`, no `format=` term. PNG decodes as RGB; `signalstats` requires YUV;
  so ffmpeg silently auto-negotiates a conversion nothing in the command
  specifies. On two solid frames (red → green, 64×64, macOS ffmpeg 7.x static
  build): **the shipped chain reports `YAVG=1`, the same chain with an explicit
  BT.601 conversion reports `YAVG=145`** — and a hand-computed BT.601 luma of the
  difference image is ~150, so the *pinned* path is the one that matches theory
  and the shipped path is the one that does not. A second control: two
  byte-identical grey frames give 0 on the shipped path and **16** if the
  conversion resolves to limited range, which would put every frame above
  `DEAD_FLOOR` and silence dead-air detection entirely.

  So `motion`'s absolute scale corresponds to no documented luma computation and
  is set by an unspecified negotiation. **The calibration job is therefore not
  "port the metric" — it is "establish what the current numbers mean," because
  nobody can currently derive them.** That reframes the risk: the in-page
  reimplementation would be *defined*, where the incumbent is *accidental*.
  **The negotiation is nonetheless STABLE across builds, measured 2026-07-31 —
  and this refutes a hypothesis two independent analyses both advanced.** Both
  argued that because the conversion is unpinned, `motion` scores may *already*
  vary machine to machine, which would make this a live defect rather than a
  migration risk. Run on Ubuntu x86_64 with the distro's **ffmpeg 8.0.1**, the
  same three cases return exactly what macOS arm64 with a static **ffmpeg 7.x**
  returns: 1, 145, 0. Different OS, architecture, major version and build origin;
  identical numbers.

  So the accurate statement is **accidental but reproducible**, not unstable.
  Two consequences, and they pull in opposite directions from what was assumed:
  the incumbent is *not* already broken, so this migration is a deliberate
  improvement rather than a bug fix and carries no urgency of its own — **and**
  the existing fixtures (0.16, 3.90) and any published `motion` score remain
  reproducible, so they are usable as verdict anchors even though they are not
  interpretable as luma. Do not cite the "already varies across machines"
  argument; it was tested and did not hold.

  **A replacement owes ffmpeg no fidelity** (second analysis, and it is right):
  ffmpeg was reached for as a convenient batch calculator, never chosen as ground
  truth, so the new implementation needs only to be well-defined and
  self-consistent, with `DEAD_FLOOR` re-established fresh by bracketing a
  known-clean scene against a known dead-air one — the same method used for the
  aspect-framing MAD threshold. Old and new numbers land on permanently
  different, non-comparable scales, which is a **labeling** problem, not a
  tolerance-band one. Hence:

  - **Stamp the implementation in `motion`'s own output** — `motion
    (ffmpeg-tblend/signalstats): median frame-diff 1.11` versus `motion
    (in-page-delta v1): …`. Then any postmortem citing a score inherits the stamp
    as part of the citation, and a future reader can tell without external
    context whether two numbers are even the same unit. This is a control rather
    than a comment asserting one: a number that cannot be traced to what produced
    it is unauditable. Cheap, and it closes the comparability question
    permanently instead of relying on anyone remembering.
  - **Widen the calibration corpus past the two documented fixtures** before
    setting any threshold — two observations is thin by this repo's own standard.
    Run the full example corpus. A real external before/after pair exists (an
    LFP-battery explainer, 8 beats, scores independently re-derived rather than
    taken from a self-report) and is offered as additional data. It sits in
    `internal/sonnet_and_gemini_scenes/` **`(local)`** — inside this tree and
    directly runnable (`bun run build.js motion lfp-explainer.html`), but
    `internal/` is gitignored, so it is present on one machine and absent from
    any clone. **The reason not to rest a threshold on it is sample size, not
    reachability** — it is one external scene, the same thinness argument that
    applies to the two documented fixtures. An earlier draft of this line said it
    was held outside the repo, which was wrong and was caught by checking.
  - **A `motion` score is sensitive to changes well outside the beat it scores.**
    Measured on that scene: a revision targeting three beats moved *every* beat
    up, because it touched shared geometry. That matters for anyone attributing a
    score delta to a specific edit, and `instruments.md` does not currently list
    it among the instrument's documented limits. Add it there when this lands.
  - **The side-emission must be strictly read-only against the canvas** and run
    *after* the frame is captured, never interleaved — a pure side-read, exactly
    like `MANIFEST_OUT`. `seekTo`'s purity should make this safe; check it as an
    explicit invariant rather than assuming the architecture guarantees it.
  - **The worker lead-in needs its own test case**, not coverage by the general
    parallel-workers byte-identity guarantee — that guarantee was established for
    the current design, where ffmpeg's separate pass over finished PNGs does not
    care which worker wrote which file. Force a chunk boundary onto a known beat
    transition and confirm the delta there matches the single-worker value.
    Otherwise the metric is wrong exactly at the seams, in a way that looks fine
    in any single worker's own output.
  - **A parallel-run transition window is proposed and DECLINED on the owner's
    priority call.** Running both implementations against every scene in CI for
    some releases would need an encoder-equipped job, and export tooling does not
    earn one — see this track's opening. If a transition window is wanted, run it
    locally against the example corpus, which is where the calibration lives
    anyway. `full` mode can shoot chunks
  across parallel workers, so frame N-1 may sit on another page — each worker
  needs a lead-in frame or the deltas break at chunk boundaries. **Deliverable is
  a calibration control, not a rewrite**: both implementations over the corpus,
  against the documented fixtures (median 0.16 held-camera, 3.90 moving-camera)
  and the dead-air verdicts. A `control-builder` job.
  **Do not propose a self-normalising threshold** — `DEAD_FLOOR` is absolute
  deliberately, and the reasoning is recorded beside it.
  **Two things were learned from an incidental attempt, and neither is a design
  to adopt.** A separate scene-building session on another machine happened to
  cut `build.js` from 10 encoder call sites to 4 as a side effect of its own
  work. Owner's framing, and the right one: not a source of truth, not an E1
  design pass, and its code is not the plan. Inspected read-only, purely for
  what it demonstrates:

  1. **The capture-time side-emission works** — an existence proof, which is
     genuinely useful because it is the part of E1 that was unproven. In-page
     `page.evaluate` + canvas `getImageData`, deltas accumulated during the
     existing shoot rather than a second pass. It also got the subtle part right:
     per-channel diff **then** luma weight, in that order. So the design E1
     prescribes is implementable; that question is closed.
  2. **Carrying `DEAD_FLOOR = 0.05` across is a silent ~150x miscalibration**,
     and this is the finding worth keeping. Measured on one frame pair: the old
     shipped chain reports 1 where the in-page formula's quantity is 150 (hand
     arithmetic: 151.4). The equivalent floor on the new scale is ~7.5. Left at
     0.05 it is ~150x too low, no frame falls below it, and dead-air detection
     never fires — `motion` would report "0 dead-air stretches" on every film,
     which `build.js`'s own comment already calls worse than no check at all.
     **Derived, not run end to end:** the scale factor is measured, the
     consequence is arithmetic.

  That second point is the concrete evidence that the calibration step here is
  load-bearing rather than ceremony — it is the exact failure this item exists to
  prevent, produced for free by someone not trying to implement this item.

- **`poster` — small, not free.** Playwright screenshots JPEG natively. The
  interesting option is rendering at the target width rather than downscaling a
  larger render, since the geometry is resolution-independent — but scenes *do*
  respond to viewport (`aspect` exists to show exactly that), so a native render
  at a different size is a different image, not just a cheaper one. One
  comparison settles it. Note `poster` is a **delivery** command, not a review
  one (`instruments.md`: "a delivery command that happens to be frame-exact").
- **`sheet` / `squint` / `strip` / `aspect` — measured 2026-07-31, and the
  answer is "probably fine, not yet proven".** The squint strip is a 480→90
  downscale where filter choice is load-bearing for the instrument's whole job.

  **Conditions:** ONE frame — `gearbox.html` at `t=6.0`, scaled to 480 wide —
  each downscale compared against a lanczos reference. macOS, ffmpeg 7.x static.

  | downscale | PSNR vs ref | SSIM |
  |---|---|---|
  | ffmpeg default (ships today) | **49.94 dB** | 0.9992 |
  | canvas `drawImage`, smoothing `high` | **40.45 dB** | 0.9920 |
  | canvas `drawImage`, smoothing `low` | **40.45 dB** | 0.9920 |
  | point-sampled (known-bad control) | 30.00 dB | 0.9592 |

  Three things follow. **Canvas is 9.5 dB worse than what ships**, so this is not
  a free swap. **It is 10.4 dB better than the known-bad control**, so it is
  nowhere near point-sampling territory and SSIM stays at 0.992. And
  **`imageSmoothingQuality` makes no difference at all** — `high` and `low` are
  bit-identical here, so the obvious mitigation does not exist and there is no
  quality knob to turn if the eye check goes against it.

  **This does NOT clear the swap on its own.** `method.md`'s own PSNR rule is
  that byte-identical or >70 dB is imperceptible rounding and anything lower gets
  a difference-image look before it is trusted; 40 dB is well under. The
  difference image was generated and handed to the owner `(local)`; that judgment
  is not made here.

  **Widened to the whole example corpus, same day, because one frame from one
  scene is thin by this repo's own standard.** One frame at `t=6.0` from each of
  the five examples, PSNR against a lanczos reference:

  | scene | ffmpeg | canvas | point-sampled | canvas penalty |
  |---|---|---|---|---|
  | gearbox | 50.10 | 40.48 | 30.00 | −9.6 dB |
  | bear-and-bees | 48.18 | 38.39 | 29.29 | −9.8 |
  | menagerie | 47.12 | 36.58 | 28.13 | −10.5 |
  | materials | 48.83 | 39.03 | 29.13 | −9.8 |
  | noise-chart | 39.69 | 28.90 | 21.72 | −10.8 |

  **The consistency is the result, not the magnitude.** The original worry was
  aliasing at a 5.3x reduction, and aliasing is content-dependent — it would
  spike on `noise-chart`, which is high-frequency by construction. It does not:
  that gap is 1.2 dB wider than `gearbox`'s, against content that is far harder.
  A penalty this flat across this much variation is a **systematically softer
  filter, not an aliasing failure**, and softness costs a silhouette far less
  than aliasing does. Canvas also never drops below the point-sampled control on
  matched content, and both methods fall together on `noise-chart` — that is the
  content being hard, not canvas failing on it.

  **PSNR was the wrong metric, and an independent review is what exposed it.**
  An outside read of the corrected difference image found the variance
  **concentrated on edges and outlines**, with flat regions dark — canvas
  feathers boundaries where ffmpeg holds them. That is the same physical fact as
  the flat ~10 dB penalty above, but it inverts the conclusion drawn from it:
  softness is benign for general image quality and **hostile to this instrument
  specifically**, because at 90px there is no detail left to protect and the
  outline is the entire signal. The reasoning error was applying a general
  image-quality heuristic to an edge-critical measurement.

  **So measure edge energy, not fidelity.** Sobel mean over the 90px image —
  directly, how much edge contrast survived:

  | 90px image | edge energy |
  |---|---|
  | **rendered natively at 90px** | **47.04** |
  | lanczos reference | 46.44 |
  | ffmpeg default (ships today) | 46.36 |
  | canvas `drawImage` | 45.47 |

  Two results. **Canvas loses 1.9% of edge energy against ffmpeg** — real,
  matching the outside read's "subtly crisper", and far smaller than the 10 dB
  PSNR gap implied. PSNR overstated the functional difference because it measures
  fidelity to a reference rather than the property in use.

  **And native rendering beats every downscale**, because it antialiases at
  render time with the full scene rather than resampling an already-rasterized
  image. It also needs no encoder, which dissolves the ffmpeg-versus-canvas
  question for the riskiest verb instead of settling it.

  **Sobel was ALSO the wrong metric, and native rendering is REJECTED on
  measurement.** Sobel cannot tell a crisp edge from a jagged one — both are high
  gradient — so native's top score was ambiguous. The distinction has a direct
  signature: an antialiased edge carries **intermediate tones**, an aliased one
  jumps between two values. Fraction of edge pixels sitting strictly between
  their neighbours' extremes:

  | 90px image | intermediate on edges | edge energy |
  |---|---|---|
  | lanczos reference | 57.9% | 46.44 |
  | ffmpeg default (ships today) | 57.4% | 46.36 |
  | canvas `drawImage` | **59.9%** | 45.47 |
  | native 90px render | **44.8%** | 47.04 |

  **Native's edge-energy win was aliasing.** A 480→90 downscale is 5.3x
  supersampling — excellent antialiasing by construction. A native 90px render
  gets only the renderer's MSAA, which is not enough at that size. The
  supersampling *is* the feature, so do not remove the downscale.

  **And canvas is fine — better antialiased than ffmpeg, not worse.** Its 59.9%
  is the highest of the three real candidates; the feathering an outside review
  saw is extra antialiasing, not lost edge. Combined with a 1.9% edge-energy
  difference, the tilers can move to canvas.

  **Three metrics, and the sequence is the lesson.** PSNR measured fidelity to a
  reference rather than the property in use. Sobel measured edge magnitude and
  could not separate sharp from jagged. Only intermediate-tone fraction measures
  the thing that distinguishes the two failure modes this instrument actually
  has. **A metric that cannot separate your two failure modes will confidently
  rank them.** Both wrong metrics produced clean, plausible tables.

  Also confirmed while testing: at a 90px viewport the caption overlay reflows —
  two independent reads noticed it, one as a doubled banner and one as clipping.
  Scenes respond to viewport, which is the caveat `poster` carries too, and it is
  a second reason the native path costs more than it looks.

### E2. The verb taxonomy, after E0

**This is the *tooling* vocabulary only.** The authoring vocabulary — what a
scene declares — is a separate, larger question that gates Phase 4 and runs
independently of this track; see "The naming question is a different one" above.
Both cite the same grouping principle; neither derives its own.

`build.js:2` declares the pipeline's terminus to be an mp4, and the verb set
fossilised around it: **`all` = `bundle` + `frames` + `video`** (it means "the
full path to an mp4", not "all artifacts"); **`video` takes `<name>`, not a
scene**, so a pipeline stage leaks into the CLI as a peer verb; **`frames` exists
largely because `video` needs a predecessor**; and `video`/`avif`/`loop`/`all`
are four naming schemes for what SKILL.md calls "four peer formats… chosen at
spec time, not encode time" — i.e. the docs treat format as a parameter of one
decision while the code makes it three verbs.

**The review verbs are not fossils and should not be collapsed.**
`instruments.md` documents distinct measured blind spots for each — sheet's fixed
fraction, strip bracketed both ways, motion's four limits. Each answers a
question the others cannot.

Likely surface: core (`vendor`, `bundle`) · authoring measurement (`probe`) ·
review (`sheet`, `strip`, `aspect`, `motion`) · delivery (`poster`, the scene) ·
**one** encoder-gated export operation taking a format, with `frames` internal.
**This is a breaking CLI change** — `build.js all` appears in SKILL.md and ships
to every install cache — so it needs a version bump, a changelog entry and
probably a deprecation window, not a silent rename.

Three caveats before any of it is treated as settled, two of them from the second
analysis and both fair:

- **`video`'s `<name>` asymmetry has a fix, not just a flag.** Have `video`
  accept `<scene.html>` like every other verb and call `frames()` internally when
  the directory does not exist — removes the interface leak without losing the
  one-command convenience.
- **Do not demote `frames` on the fossil argument alone.** Check first whether
  anyone consumes the raw PNG sequence outside this tool — a different encoder, a
  custom pipeline. If nobody does it is a fossil; if somebody does it is a
  legitimate export-adjacent verb that simply is not on the direct path to mp4.
- **Collapsing `video`/`avif`/`loop` into one format-argument verb has a real
  ergonomic cost**: `video` takes `fps` only while `avif` and `loop` take `fps`
  *and* `width`, so unification needs format-conditional arguments or a flag
  interface. Weigh it rather than assuming three-into-one is a pure win.

**And "review" is operationally mixed, which is the proof the grouping is
right rather than a problem with it**: `probe` never shells out at all,
`sheet`/`strip`/`aspect` use ffmpeg to tile images, `motion` uses it for
arithmetic and produces no image. Three implementations under one label, because
the label tracks the question an author is asking — not what happens to touch an
encoder today. Group by intent; that is the same lesson this whole track is
about, applied to the act of designing the taxonomy.

### E3. Framing remediation, split by whether the code has earned it

**`VISION.md` is deliberately NOT edited, and the decision has a dependency worth
stating.** It never mentions MP4, AVIF, WebP or GitHub, and that silence is the
strongest available statement that export is not core — adding a paragraph saying
so would make export a topic the file discusses, which elevates it. The file also
carries its own instruction: *"It is short on purpose. If it grows into a summary
of the plan, delete the summary."*

**But silence-as-signal is fragile alone.** A reader who lands on the tooling
question directly could read that silence as "does not cover export, so infer it
from `build.js`'s comments" — which is precisely the path that produced this
whole track. The decision holds **only because the explicit statement lands
elsewhere**: `method.md`'s corrected headers and the verb taxonomy are what a
reader arriving at the tooling question actually finds. If those slip, the
silence stops being sufficient and this decision should be revisited rather than
inherited.

Three parallel sweeps, 2026-07-31, over shipped prose, code comments, and the
repo-dev surface. **Clean, zero findings:** `bibles.md`, `characters.md`,
`materials.md`, `glossary.md`, `instruments.md`, `plugin/agents/film-reviewer.md`,
`backend.js`, `smoke.js`, every bracket but `commands`, all of `scripts/`, all
three workflows, `.claude/agents/*`, `.claude/rules/*`, `audit-claims`.
`examples/README.md`, `install-hooks.sh` and `stage-films.sh` state the framing
*correctly* and are the language to reuse. **Not a repo-wide infection** — it
concentrates in `build.js` (7 of 9 code findings), `plugin/README.md`,
`method.md`, and SKILL.md's opener.

**Fix now — wrong regardless of what the code does:**

| where | what |
|---|---|
| 8 scene files, CONTRACT block | *"what makes the HTML loop and the MP4 render provably identical"* — false twice; see R4.4's fence note |
| `method.md:51-52, 849, 962` | determinism justified by "video/HTML parity", **twice as section headers**, in the file read before building. When correcting these, **plant the positive principle rather than only deleting the wrong one**: group by the question an author is asking, not by what happens to touch an encoder today. Stated there, it is the reason the taxonomy looks the way it does; left implicit, a future author reverse-engineers it from a verb list |
| `CLAUDE.md:56-58` + `docs/orientation.md:13-14` | same inversion; orientation.md is the literal text pasted to every context-free subagent |
| `physics-bake-proposal.md:20-23` | *"HTML/MP4 parity holds"* listed as a surviving property — **asserts a check that does not exist**, in the doc governing the next phase |
| `docs/addressing.md:38-40` | quotes the scene-template claim as the foundational definition of `t` |
| `plugin/README.md:5-8, 15-17` | *"then renders that same file to video"* — the front door |
| `SKILL.md:26-28` | opener contradicts its own steps 6 and 7 |
| `build.js:2, 41-42, 288-291, 318, 479-482`; `shoot.js:190` | mp4 terminus; "deliverables (frames/all)"; "the pipeline's own output"; "Sizing is the whole game"; poster's README-only guidance |
| `recordings.md:3-6` | scope named too narrowly — GitHub is one instance of "a README, a chat, a slide" |
| `delivery.md:29-31` | "co-equal delivery option" now reads as a ceiling against its own opening |
| `docs/plan.md:210-212` | "delivery forensics" bucketed with the determinism kit as equal-weight inheritance |
| `docs/plan.md:358-361` | lists "`motion`'s frame-difference metric, `strip`, the delivery encoders" as one set of "instruments smoke does not cover" — the first two are real review-coverage gaps, the third is export tooling smoke was never meant to cover. Separate them |
| `build.js` USAGE + header | group the verbs core/review/export — true *today*, independent of E1 |
| `SKILL.md` step 4 (review block) | **omits `motion` entirely** — it lists `sheet`, `strip`, `aspect`, `probe`. The instrument is real and correctly documented in `film-reviewer.md` and `method.md`; the quick-reference an agent skims first does not mention it. Same shape as the rest of this table, and unrelated to ffmpeg |

**Wait for the code — TRUE today, and editing them first would make the docs lie
and delete the only signal the structure is wrong:** `CLAUDE.md:167`,
`build.js:19`, `plugin/README.md:40-42`, `SKILL.md:226`. All four state ffmpeg as
a baseline dependency, which is accurate while `sheet`/`strip`/`aspect`/`motion`/
`poster` still call it. They change when E1 lands. Note `CLAUDE.md:167` already
scopes `avifenc` "for AVIF loops" and `img2webp` "for WebP" in the same sentence —
the pattern exists, it just was not applied to the one with seven call sites.

**Unread, and the gap is deliberate rather than silent:**
`docs/predecessor-record.md` was read at ~2100 of 2770 lines. It is explicitly
bounded as history ("Read this as history, not as current spec"), so its findings
are origin evidence rather than live drift — but that origin is the point: it
carries the predecessor's marquee claim four times, and near-identical phrasing
is live and unqualified in this repo today.

### E4. `audit-claims` does not cover either README

Its scope is reference docs, `CLAUDE.md`, load-bearing comments in
`templates/*.js`, `site/index.html`, and — verified — `.claude/agents/*` and
`.claude/rules/*`. **`plugin/README.md` and the root `README.md` are in none of
it**, and `plugin/README.md` is where the worst drift found on 2026-07-31 lives.
The asymmetry is the argument: `site/index.html` was *deliberately added* at
0.16.30 because "the site is a claim surface". `plugin/README.md` is a claim
surface too **and it ships into every install cache** — wider distribution,
no coverage. One line in the skill's scope. Probably the cheapest item on this
track. Open question worth settling in the same edit: `plugin/agents/` is not
`.claude/agents/`, and whether the routing covers it should be explicit rather
than inferred, for a file that ships.

### E5. The harness tier's output reads as a coverage hole when it is a scope line

`bracket-commands.js` currently prints `8 verb path(s) exercised, 9 skipped for a
missing encoder`. Under this track's opening that phrasing is wrong in a way that
matters: it reads as nine missing tests when nine are **deliberately out of
scope** for an unattended gate. Tier the tally so the harness reports core and
review fully exercised, and export explicitly not gated — making the priority
visible in the instrument rather than leaving it as a number a reader has to
interpret. Plugin content, so it carries the cascade. Small, and it is the
difference between a gate that looks 47% covered and one that says what it
covers and why.

## The defect corpus is in parity but nothing runs it (2026-07-31)

Opened by R4.5 and recorded the same day rather than left as a known-unknown.
`gate.yml`'s workspace step copies `templates/` and `examples/` and not
`fixtures/`, so `fixtures/defect-corpus/after-hours.html` is fence-checked by
`static.yml` and **executed by nothing**. A `KERNEL` change it cannot survive
would be discovered by whoever next tried to use the corpus — which is exactly
the shape the harness tier exists to close, reintroduced by a directory that did
not exist when that step was written.

**Do not fix this by adding it to the gate's scene list.** The file is
deliberately defective. The day a defect lands that trips exposure or framing,
a general pass/fail gate goes red for a correct reason, and a gate that fails
correctly on purpose is one people learn to route around.

Write `bracket-corpus.js` instead, in `templates/` so the existing glob picks it
up: run smoke over the corpus and assert the **expected verdict**, the same shape
`bracket-parity.js` and `bracket-commands.js` already use. It fails when the
verdict changes in either direction — a scene that starts failing, and equally a
defect that quietly stops being detected. Cheap, and it is the only thing that
would notice either.

## `bracket-noise.js` reports a false red on macOS (2026-07-31)

Found while verifying R4.4, and confirmed pre-existing by stashing the change and
re-running against a clean `HEAD`: the **`claims webgpu while falling back`** arm
fails on this machine and passes in CI. It is not a smoke defect. The arm needs a
scene that *claims* WebGPU and then *falls back*, and on a Mac with a real WebGPU
adapter no fallback happens — so smoke correctly passes the fixture and the arm,
which expects a failure, calls that wrong. On the Linux gate there is no adapter
(`No available adapters` → WebGL2), the fallback is real, and the arm passes.

So the fixture's premise is environment-dependent and the bracket does not say
so. **The cost is the one this repo cares about most: a control that cries wolf
on the developer's own machine is a control people learn to skip**, and this one
sits in the same directory as four that are honest. Fix by forcing the fallback
rather than assuming it (or by skipping the arm, loudly, where an adapter
exists) — a silent skip would be the worse of the two and is the failure
`bracket-commands` already had.

---

## Deferred, with the trigger that revives each

Recorded so nobody re-argues them from scratch, and so the trigger is explicit
rather than a matter of mood.

| deferred | why | revived by |
|---|---|---|
| JSON `tables`/`patch` round-trip (**answered 2026-07-30** — see "What actually wants structure" above; the decline is right about JSON and too broad about structure) | the tables contain functions exactly where they matter (`SUBJECTS.pos` is a function of `t`); a projection that cannot represent the interesting half lies about completeness. The cited pain — regex-editing JS source — is a tooling habit, not a format problem | an agent needing to *restructure* tables mechanically, after the enumeration exists |
| `ACTORS` presence table | one prior instance in the corpus, differently spelled; `hide()` covers the drift risk | a second film with multi-appearance presence that `hide()` cannot express |
| occlusion linter | **not a one-film finding** — the predecessor's two-character scene closed with it explicitly open ("geometric contact is not legible contact… the contact point sits behind a body"). Still ranked third: 3 of 4 new instances were static staging the contact sheet already catches by eye; the 4th was a transit defect a beat-midpoint sample structurally cannot see, and `transitions` catches it. So the linter automates eye-work on a converging axis — real, but third | probe + transitions shipped and composition rounds still not converging |
| solver-aware staging | the proposed vocabulary fails on its own originating use case: props at fixed world positions a character walks to, which was every exhibit in the film that motivated it | a design that handles walked-to props |
| `travel()` / `LEGS` / `shapes.md` | register-specific to the presenter explainer, which arrived as a commission rather than from the roadmap | a second presenter film asking |
| type primitive (glyph data + renderers) | generalizes past the register — any film with a sign, an axis, a label — but it is a bigger build than it looks, and no shipped example needs it. **And it is governed by an existing rule neither review applied: a glyph alphabet is a *primitive*, so under the chart tier it lands as a chart — a grid of all 36 glyphs, byte-compared per backend — before any film uses it.** That is also the right shape on the evidence: all three glyph bugs were one letter built on a wrong assumption, which a grid makes obvious at a glance and a title card cannot | a second film needing built text, or the diagrammatic register (see B5) — entering at the chart tier, not in a film |
| splitting `method.md` (969 lines, 50.9 KB, 42% of reference text) | it would create exactly the doc-versus-doc boundary B4 exists to patch, and `method.md`/`instruments.md` already contradict in that shape. Its own justification is honest but weak: "I read all of it, so splitting wouldn't have helped me read". **Two independent outside reviews (2026-07-29) both pushed for the split, which raises the priority but not the argument — both argued cognitive load, which is the same taste claim already recorded here.** One of them gestured at something stronger without pressing it: if a wholesale read exceeds the reading tool's byte cap, an agent gets a TRUNCATED read and cannot tell. That would be a correctness argument, not a style one, and it would revive this on a different basis than B4 | B4's tiebreaker landing first — OR the truncation question resolving yes. **That test was run on 2026-07-30 and the answer is no.** `method.md` is 996 lines / 52.7 KB against a 2000-line default read window, so a wholesale read returns the whole file and the truncation argument does not apply to it. **The correctness basis for reviving this row is therefore closed**, and the row falls back to the taste argument it already admits is weak. (Measured in the same pass: `docs/predecessor-record.md` at 2770 lines DOES exceed that window, and nobody has proposed splitting it — the truncation risk in this repo is real and it is not here.) **PARTIALLY DISCHARGED in 0.16.19:** the three long references gained heading maps. The hypothesis is that "monolithic" was a navigation complaint wearing a structure costume — 27 headings under 6 well-ordered top-level sections were invisible without reading all 969 lines. If the next reader still asks for a split *after* seeing the map, that is the evidence this row has always lacked |
| moving films out of the shipped subtree (`docs/examples-placement.md`, option E) | **the doc exists, is undecided, and was referenced from nowhere in `docs/` or `CLAUDE.md` until 0.16.18** — which is spine rule 0 turned on this plan: an unreachable decision does not exist, and an outside reviewer independently re-derived its cost table because of that. Measured: examples are 5.47 MB, ~93% of the shipped subtree, of which ~95% is the same byte-identical three IIFE five times; three cached versions on one machine came to 18 MB. The blocker is now clearer than the doc states it: all **three** brackets hardcode `../examples/gearbox.html`, so E is really "one scene stays as a *fixture*, four films move" — a different and easier decision than example-versus-internal. **Do not** reach for the unvendoring variant a review proposed: it breaks invariant 1, fails `build.js bundle`'s own self-containment assertion, and hangs every bracket | owner deciding fixture-vs-example, which is the only open question left in it |
| distance-space gait as the template default | the algebra is sound (`{start:0, rootX:s}` reduces identically where travel is monotone) but was argued, not measured | the PSNR comparison `method.md` prescribes |
| extracting a shared bracket harness | the three `bracket-*.js` scripts now triplicate temp-dir setup, injection-point drift detection, and the tally/exit report — **this repo's own "extract or fence at the third consumer" trigger, fired**, this time for tooling rather than scene code. Declined at the moment it was found only because it would refactor three controls that were verified green minutes earlier, at the end of a session, and a broken control is worse than a duplicated one. The distinct parts are genuinely distinct (one drives smoke.js as a subprocess, two drive pages directly), so the extraction is the scaffolding only | the fourth bracket — `bracket-sortobjects.js` is already anticipated by rule 5's trigger, which would make it a fifth copy of the scaffolding |
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

**0. RESOLVED 2026-07-25 — Track C is admitted.** The owner approved the
scope-fence amendment; `plan.md`'s Phase 6 entry and its Risks bullet now set
the fence at *who owns the state stream*, and "input handling" was removed from
the non-goals list. Viewer chrome that bounds a viewing parameter while the
timeline driver still owns `t` is a delivery feature; an input driver that
*replaces* the state stream stays behind the Phase 6 gate.

**Why it was a real question** — kept as one paragraph of reasoning, not as a
live position. `plan.md` used to fence the scope in as many words: *"mitate ships
films; interactivity is one spike behind a gate, and engine-shaped features
(input handling, game state, audio mixing) are non-goals until Phase 6 reopens
the question."* The viewer is input handling, and treating it as delivery chrome
was a defensible distinction that had been asserted rather than reconciled — so a
reader of `plan.md` would correctly have blocked Track C as the exact scope creep
it fenced against. C0.5's argument that the viewer *is* Phase 6 arriving early is
what made "amend the fence" more honest than "it's a different thing", and that
is the route taken.

**`VISION.md` has since superseded the framing that fence rested on.** "mitate
ships films" described the product; films are the *proving instrument* for an
engine, and `plan.md`'s Risks section is no longer the authority on the
destination. The fence's live half — that a driver replacing the state stream
waits for Phase 6 — survives the change.

*Struck 2026-07-30: the paragraph above was previously carried verbatim with a
single sentence crossed out, so it still read as an open dispute ending "either
`plan.md` gets an amendment, or Track C waits" — an amendment that had already
landed. The reasoning is worth keeping; the conclusion is not.*

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

- **The measurement-assertion sweep** — comments in `templates/*.js` that assert a
  measurement (`measured`, `bracketed`, `confirmed`, `verified`) without naming
  the control behind it. **`scripts/selfcheck.js` owns the count, its definition,
  and ratchets it**; the figure is deliberately not restated here, because it was
  published as "41" in three files from a coarser grep and disagreed with the
  check within a day of being written. Two are known-bad: 0.16.9's console anchor
  asserted a measurement never taken and broke the gate on the default path for
  seven releases, and rule 5's `sortObjects` repro is cited as preserved and is
  absent from the tree. Each survivor either gains a pointer to something
  runnable or gets relabelled as an observation. This is the parent of the two
  fixes shipped in 0.16.18 and should not be done one instance at a time.
  *Trigger: fired — it has two confirmed casualties. Ranked against Track A on
  the owner's call.*
- **Whether the crushed-exposure threshold has earned its number** — it fires on
  44.7% (`scene.template.html`), 54.8% (`scene.character.template.html`) and
  50.6% (`menagerie.html`): both 3D templates and one of five examples, all
  deliberately dark. A lint that warns on most of a correct corpus is training
  people to ignore it. It is already labelled `provisional threshold`, which is
  honest, and that label is exactly the debt. *Trigger: fired — measured
  2026-07-29 across the full template+example corpus.*
- **`ubuntu-22.04` has an expiry, and the pin does not know it.** `gate.yml` pins
  the runner image deliberately (see 0.16.24), which trades a moving target for a
  dated one: GitHub retires runner images, warning first and failing later. Nothing
  in the repo notices. *Trigger: the first deprecation warning in a gate run — at
  which point re-pin, and decide then whether the newer image needs a fresh
  determinism baseline before it is trusted.*
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
- **Unmount the hero iframe while the lightbox is open — DOWNGRADED 2026-07-25,
  probably not needed.** The 0.16.10 visibility fix resolved the report on
  desktop and iOS Safari, which says the scene was booting all along and the
  `opacity:0`-until-`sceneReady` gate was the bug itself, not a symptom of
  resource contention. Slow boot is now survivable because the film's own boot
  card is visible while it compiles. Kept only as a note, not a plan item: Opening the lightbox calls
  `stop()`, which cancels only the *parent's* rAF; the hero iframe stays mounted
  and keeps its WebGPU device, so a second scene boots alongside a live first
  one. Measured in Safari with the hero live: `menagerie` reached `sceneReady` in
  **11,110 ms** against the hero gearbox's **1,232 ms** — ~9x, scaling with scene
  weight. That is the same WebKit-budget effect that already sent mobile taps
  top-level. An investigation could not reproduce the user's failure in Chrome or
  Safari, locally or on the live site, so this is the best-supported explanation
  rather than a diagnosis. 0.16.10 fixed the *visibility* of the failure without
  guessing at its cause; do not ship the unmount until someone confirms the
  cause, because remounting costs a re-boot on every lightbox close.
  *Trigger: a reproduction, or the one-line console probe on a failing session.*
- **A deployment-configuration check — a check to build, not an audit to run.**
  One scene, four hosts: disk, top-level, iframe with a parent driving `seekTo`,
  and the install cache. Only the top-level case is exercised today. This is the
  claim that *survives* the 0.16.2 retraction — the live-playback check is not
  blind to a swallowing host, but nothing tests the embedded configuration, and
  `site/app.js`'s warning is a warning rather than a check.
  *Trigger: before the viewer ships, since it makes the embedded case load-bearing.*
- **Consistency sweep backlog — CLEARED 2026-07-25 (0.16.7).** Three subagent
  audits found duplicated figures, undated provenance, an ad-hoc count in a
  shipped reference, and — sharpest — the reproducibility facet violated
  repo-wide. All fixed rather than carried: `~2.3x` and `1.09 MB` now have one
  home each with conditions (two apparent duplicates turned out to be a
  *different* 2.3x — AVIF encoder speed — and were correctly left alone); the
  contact count left `instruments.md` for the ledger; `plan.md`'s size figures
  were re-measured with a stated method; both undated provenance headers now say
  they have no verification date rather than acquiring an invented one; the
  live-playback bracket carries its machine, scene and viewport; six headers name
  which copy was verified; and `templates/bracket-liveplay.js` is now tracked and
  runnable from a clean checkout, so the bracket `instruments.md` cites can
  actually be re-run. *Kept here as a record of what the audits found, not as
  open work.*
- **`test-audit` over `smoke.js` — RUN 2026-07-25. Four of five escapes fixed;
  two items remain and both need design, not typing.** 25 spot mutations. The
  worst finding was neither of the two escapes that triggered it: determinism was
  only ever checked *within one page session*, so a scene drawing a random once at
  init passed clean while rendering a different film on every load — the prime
  directive broken, invisible to the whole suite. Fixed in 0.16.9 and bracketed by
  `templates/bracket-determinism.js`. Also fixed: caption overflow could not fire
  (resized without settling, under-measuring ~3x, and its stated rationale was
  false), the `?strip=text` page had no error listeners, and three of four
  contract members were shadowed by their own consumers.

  **Two adjacent instances closed in 0.16.13-0.16.14, which sharpens what is
  left.** The same family — a check that weakens without saying so — had two
  cheap members: the soft contract (`BEATS`/`FRAME`/`FLASHES`/`CAPFADE`, plus
  `SHOTS` on 3D) fell back in silence, and fence parity printed `ok` for a fence
  carried by one scene and therefore compared against nothing. Both now say so,
  and both are bracketed in each direction. Neither needed a design decision —
  they needed a print statement. **That is exactly what distinguishes them from
  the two below**, which cannot be fixed by speaking louder.

  **Still open, both requiring a design decision:**
  1. **Hard checks silently degrade to advisory when a scene throws.** Framing
     invariance, exposure and the caption blocks each wrap in
     `try/catch → warnings.push`, so a scene that *explodes* downgrades a hard
     fail to a warning and exits 0 — the worse the scene, the softer the verdict.
     The intent is right (an instrument bug must not flip the exit code); the
     implementation cannot tell an instrument bug from the scene detonating.
     *Trigger: before anyone relies on a green from those three checks.*
  2. **The console-noise cloak is open by construction.** An error prefixed with
     a driver string is still dropped; 0.16.9 made every suppressed message
     visible as an advisory rather than closing it, because origin filtering
     fails (three.js is inlined, so its legitimate warnings carry the scene's own
     URL) and a bounded tail is unmaintainable. *Trigger: a real defect found
     hiding there — until then the advisory is the mitigation.*

  Coverage limit worth carrying: every mutation ran on `gearbox` (3D, metal). The
  2D backend and the WebGL2 fallback were exercised at baseline only, so a defect
  confined to either is outside what the audit measured.
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
   FAIL**, which has resisted reproduction for two versions. `plan.md`'s Phase 1
   chart-control note (search "did NOT reproduce it in 15 metal runs")
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
