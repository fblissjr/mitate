last updated: 2026-08-08

# mitate: founding plan

A new skill for deterministic, generated moving pictures of any register — an
explainer, a game cutscene, a meme, a character short — built clean on the
three.js WebGPU/TSL node stack, structured from day one so the same core can
later drive interactive experiences. `mitate` inherits everything
explainer-video proved (the window contract, the determinism discipline, the
instruments, the review method) and rebuilds everything the old renderer stack
constrained (materials, post, characters, physics).

This file owns the architecture and the phase gates. The current *tactical* plan
— instruments, doc routing, the viewer and the camera bake, and what is
deliberately deferred with the trigger that revives it — lives in
[working-plan.md](working-plan.md). Most of that work is cross-phase: it serves
every phase and belongs to none.

The predecessor's full record — its arc and postmortem, per-item ledger, test
suite, and hardening findings — is consolidated in
[predecessor-record.md](predecessor-record.md), carried over verbatim so the
measured findings mitate must not re-learn the hard way do not live one
repository retirement away. The externally-authored WebGPU migration
research that triggered this was a capability map, not a migration plan; its
defects are catalogued below, its usable conclusions are already folded into
this document, and the corpus itself stayed in the predecessor's repo rather
than moving here — nothing in it is citable.

---

## Decision: a new skill, not a migration

The generalization plan decided "generalize the existing skill, do not create a
second one," and its reasoning was correct *for its conditions*. Three of those
conditions have changed; the fourth was that plan's own stated revisit trigger.

1. **The tooling fork is forced regardless.** The old argument was "one copy of
   the contract and tooling; a second skill duplicates it and the copies
   drift." But moving to `WebGPURenderer` + node materials forks the vendor
   entry, the template bootstrap (async init), the post chain (node passes
   replace `EffectComposer`), and every instrument calibration — inside one
   skill or across two, the fork happens. Two *live* copies drift; one live
   copy and one **frozen** copy do not. explainer-video freezes (below).
2. **The trigger surface genuinely broadens.** "Make me a cutscene for my
   game," "make this meme," "make it interactive later" are not the explainer
   intent. The old plan named its own split condition: "if the film-language
   layer grows a genuinely different workflow, revisit." Cutscenes and
   interactive experiences are that.
3. **Greenfield is this repo's stated default** for anything not
   production-facing, and a renderer-stack replacement is the textbook case:
   porting in place means every intermediate commit half-works on two stacks.
4. **The measurement ledger does not fragment — it transfers.** The measured
   knowledge (caption brackets, exposure two-tail rule, motion-detector
   negative result, AVIF decode cost) is recorded in the frozen skill's
   references and in [predecessor-record.md](predecessor-record.md).
   mitate imports the conclusions and re-verifies only what the renderer
   change invalidates (per-backend calibrations), appending to its own ledger.

**explainer-video's disposition: frozen, and NO LONGER PUBLISHED.** Verified
2026-07-30 against the `fb-claude-skills` marketplace manifest: neither
`explainer-video` nor `screenwright` is among its entries. This said "it stays
installed" for the whole life of this repo and was wrong, which matters more than
a stale line usually would — it is why a local archive `(local)` may hold the only
surviving copy of both ancestors, and it was the premise under which archiving
them looked safe. mitate supersedes it when its
explainer register is verifiably better on the same test cases; then the
marketplace `renames` map retires it, the same mechanism that retired
env-forge.

**The prime directive carries over verbatim** — the two rules that are never
negotiable, because everything else derives from them:

- The scene is a pure function of `t`.
- Tooling talks only to the window contract, never to scene internals.

Anything that cannot be had under those rules is reformulated (bake at build
time, play back pure) or not had.

---

## Decisions taken at founding (2026-07-23)

Settled with the owner; each is expensive to reverse, which is why it is
recorded here with its rationale.

| Decision | Choice | Why |
|---|---|---|
| Name | `mitate` | 見立て — to see one thing as another; the Japanese aesthetic of representing one thing through another. Exactly what this skill does: see any input as a scene. (Founding named it `screenwright`, for the wright who builds — shipwright, playwright. Retired over a real collision: an actively-maintained npm package *and* Claude Code skill in the same domain, Playwright tests to demo videos, already holds that name.) |
| Character assets | **Scaffold-as-data** | Parametric rigs and base meshes ship inside the skill as data tables (vertices, weights, morph deltas) — not model files, not primitives-only. Output stays a single self-contained file; any character is the same scaffold under different proportions, shells, shaders. Raises the ceiling far above primitives without becoming an asset pipeline. |
| Human quality bar | **Stylized-cinematic** | AAA-cutscene stylization (SSS skin, real facial rig, hair, hands — the Arcane/Pixar register). Photoreal is the hardest asset in CG and approaches the uncanny valley from the wrong side, where almost-right reads worse than stylized. Stylized is achievable, ages well, and reads better at every delivery size this skill ships. |
| Old skill | **Freeze, keep published** | See above. |

## Architecture: the layer split that makes "interactive later" free

The old skill's architecture had two layers: scene (pure `f(t)`) and tooling
(talks to the window contract). mitate splits the scene layer once more,
because "the film is `f(t)`" quietly welds together two things — *what the
world is at a state* and *how time advances*:

```
kernel     pure functions: pose(state), materials(state), camera(state)
           — no clock, no input, no side effects; state is a plain value
driver     produces the state stream:
           - timeline driver: state = g(t) from BEATS   (the film — built first)
           - input driver:    state = g(events)          (interactive — later)
contract   window.seekTo / DURATION / BEATS / FRAME / sceneReady — unchanged,
           implemented by the timeline driver
tooling    build / shoot / smoke / instruments — talk only to the contract
```

The timeline driver composed with the kernel IS today's `f(t)` — nothing about
film-making gets harder. But because the kernel never touches a clock, an input
driver later reuses every character, material, camera solver, and instrument
unchanged. This is a structuring rule, not extra machinery; Phase 6 proves it
with a spike.

**"Until then it costs only discipline" — retracted 2026-07-30.** Discipline did
not hold. `setCamera(t)` took `t`, not a state value, so the split was a
convention rather than a seam and Phase 6's gate below was not reachable as
written. The cheap repair, and the reason it was urgent, are in
[`working-plan.md`](working-plan.md) under "The weld gets more expensive every
phase": give `setCamera` a state object that today holds only `{t}`. Every later
phase welds tighter, because face state and baked tracks will be authored as
functions of `t` — that is what the signature invites.

**The repair LANDED in 0.16.62 (2026-08-01).** `setCamera(state)` is the
signature in all eight carriers, `state` holds `{t}` today, and the DRIVER
constructs it. The paragraph above is kept in the past tense rather than deleted
because the retraction it records is still the reason the seam exists.

**What that does and does not settle.** It removes the specific obstacle named
below — a bounded view offset no longer has to enter *inside* the kernel,
because it can enter as a field of `state`. It does **not** declare Phase 6's
gate met: the gate is that a spike reuses kernel, characters, materials and at
least one instrument with **zero** modification, and only a spike can measure
that. The honest reading is that the gate moved from *unreachable as written* to
*untested*, which is a different thing and a better one. One discipline carries
it: the driver owns what goes into `state`, and the kernel never reads anything
the timeline driver cannot produce — or `state` becomes a global with better
manners.

## The render stack (verified 2026-07-23, session spike)

Facts established empirically on `three@0.185.1`, recorded here because they
are otherwise only in a conversation:

- `three/webgpu` + `three/tsl` + TSL display nodes bundle to a classic-script
  IIFE with bun, run over `file://`, single file, no network. **1.09 MB** vs
  0.77 MB for the old stack (+0.3 MB per scene, accepted).
- `WebGPURenderer` transparently falls back to its WebGL2 backend when no
  WebGPU adapter exists (verified headless: same scene, same TSL materials and
  node bloom, both backends, visually identical composition). One template
  serves hardware and CI.
- Byte-determinism of `seekTo` holds on **both** backends (seek away and back,
  SHA-256-identical PNG). Cross-backend frames are *not* byte-identical —
  same as the old stack's Metal-vs-SwiftShader finding; byte comparison stays
  valid only within one backend.
- Speed with a node post chain at 960×540, screenshots included: **37 ms/frame
  WebGPU-Metal vs 87 ms/frame WebGL2-backend** (~2.3x).
- **The flag landmine:** `--enable-unsafe-webgpu` (with or without
  `--enable-features=Vulkan`) on macOS headless yields a SwiftShader-WebGPU
  adapter that renders **pure black, silently, exit 0**. The working macOS
  flag is `--use-angle=metal`. Default policy: launch with **no** WebGPU flags
  (fallback handles it); hardware WebGPU is per-platform opt-in. smoke's
  near-black check must be proven, not assumed, to catch this signature.
- `renderAsync()` is deprecated in r185 (warning observed); the contract is
  `await renderer.init()` once, then synchronous `render()` in `seekTo`.
- Present in the bundle and relevant to this plan: `MeshPhysicalNodeMaterial`
  (transmission, dispersion, sheen, iridescence), `MeshSSSNodeMaterial`,
  `MeshToonNodeMaterial`, `SkinnedMesh`, MaterialX noise nodes
  (`mx_fractal_noise_float`, `mx_worley_noise_float`, `mx_aastep`), ~45 TSL
  display nodes (bloom, dof, film, chromatic aberration, GTAO, godrays).
- Known-bad for this architecture, prohibited: `ComputeNode` / storage buffers
  (no WebGL2 fallback, stateful), temporal post passes (TAA, accumulation
  blur), the auto-incrementing TSL `time` node (drive a `uniform(0)` from
  `seekTo` instead).

On the research folder: its API surface is largely accurate (`RenderPipeline`
exists; the deprecations are real) but its upgrade diffs are internally
contradictory — one recipe loads three from a CDN importmap, violating the
offline contract it claims to demonstrate; its flag recipe is the black-frame
landmine above; it never considers the 2D sibling or the instruments. Capability
map, not migration plan.

### Framework survey (reviewed 2026-07-23)

A second external corpus (kept in the predecessor's repo, not carried here for
the reasons that follow) surveys eight frameworks and concludes three.js
WebGPU/TSL is the right 3D foundation. Reviewed twice — directly and by an independent agent — verdict:
**zero-weight confirmation.** Its conclusion converges with this plan's, but
its "Gartner Magic Quadrant" is fabricated framing (Gartner does not cover this
space, and the chart's own normalization note admits placements were moved to
fit the quadrant story), its figures are unsourced, it contradicts itself
(R3F's bundle is "~35KB" in one file and "~2.5MB+" in another), and it audited
a stale copy of the old skill. Nothing in it is citable evidence; this plan
cites only what was verified against the package or measured in the spike.
Three things it surfaced that survive scrutiny:

- **Pre-warm shaders before `sceneReady`:** `await renderer.compileAsync(scene,
  camera)` after `init()`, before signaling ready (verified present in r185).
  Adopted into the Phase 0 template contract — it closes the black-first-frame
  window the spike brushed against.
- **2D backend decision, made explicit:** the survey recommends PixiJS v8 for
  2D. Rejected for now. The Canvas2D template already satisfies every
  constraint for flat scenes at zero bundle cost and zero vendor step; PixiJS
  buys sprite/filter scale no current test case needs. Revisit only if a 2D
  case demands what Canvas2D cannot do; recorded here so the "no" is a
  decision, not an omission.
- **Alternatives ranked, once, so this does not reopen:** Babylon.js is the
  only workable substitute (real determinism path, strong procedural API) and
  loses on bundle economics and WASM-physics inlining with no capability this
  workflow needs; PlayCanvas's component `update(dt)` model is
  delta-accumulative by design; Bevy requires a Rust-to-WASM compile per
  generated scene, unusable when the scene author is an LLM writing code into
  an HTML file; R3F puts a React reconciler between `seekTo(t)` and the scene
  for zero benefit; Spline has no code-level procedural API. Editor-centric
  and toolchain-centric engines fail this skill's constraints structurally,
  not by degree.

## What carries over, what is rebuilt, what is dropped

**Verbatim (proven, renderer-agnostic):** the window contract; `BEATS` /
`CONFIG` / `FRAME` and beat addressing (`ramp`/`pulse`/`rampS`/`latch`/`warp`);
the seeded-PRNG determinism kit; the three failure axes and the review method;
the instrument *philosophy* (every check ships with its measured bracket and
its blind spots — `instruments.md` is the crown jewel); delivery forensics
(WebP/AVIF/MP4/HTML tradeoffs); style bibles as one object constraining
palette, lights, post, lens, cut pace; the Canvas2D 2D template (untouched by
any of this — it has no renderer to migrate).

**Rebuilt on the node stack:** the vendor entry; the 3D template bootstrap
(async init, `uniform(0)` time, backend report); the post chain (node passes
replace `EffectComposer`); material packs (TSL); every instrument
*calibration* (exposure lints, bloom brackets, blank-frame signatures were
measured on GL and are per-backend facts).

**Dropped or retired:** GLSL-era workarounds; the Sky/PMREM half-float
SwiftShader workaround chain — re-test the node-stack sky/environment path
from scratch before importing any of that scar tissue (the failure was
backend-specific and may simply not exist here).

## The character system (the new capability, staged)

Scaffold-as-data, three tiers of the same idea:

1. **Skeleton + proportions.** One parametric skeleton family (biped,
   quadruped, generic-creature: chains for spine/tail/neck), stored as data.
   Proportions are a small vector (limb lengths, torso ratios, head scale) —
   "a bear" and "a human" and "the creature you just described" are points in
   proportion space plus a shell choice. Analytic IK ports from the old skill
   and extends to spine/tail chains.
2. **Shells and surfaces.** Body surfaces generated over the skeleton
   (capsule/metaball-like hulls as vertex data, morphable by the proportion
   vector), shaded by TSL packs: SSS skin, fur (shell layers), cloth, chitin,
   toon. This is where stylized-cinematic lives — shading does the work
   geometry alone cannot.
3. **Face and hands.** Morph-delta tables on the head mesh (brow/lid/jaw/
   mouth-corner deltas — a compact FACS-like basis, authored once as data),
   driven per-beat exactly like any other pure function of `t`. Hands as
   posed-shape presets before per-finger articulation.

Secondary motion (hair, cloth follow-through, jiggle) is procedural or baked —
never integrated at runtime. Primary motion stays authored/IK. The scaffold
data is authored once, by a build-time generation pipeline that is itself
committed — the skill must never grow a runtime asset-fetch path.

## Test-case portfolio

Diversity is the point: each case exists to break a different assumption, and
each phase gate names the cases it must pass. These are specs, not committed
films; build them as they gate.

| Case | Register | Reach | What it stress-tests |
|---|---|---|---|
| `gearbox` | technical explainer | **BUILT** | Regression baseline against frozen explainer-video: same beats, node stack, must not be worse on any instrument |
| `market-crash` | data/abstract explainer | **in reach** | No characters at all — proves character work taxed nothing; charts and glyphs as sets |
| `bear-and-bees` | character short / comedy | **BUILT** | Quadruped scaffold, fur shells, comedic timing (pause-then-fast) |
| `boss-intro` | game cutscene | **in reach** | A creature invented from a text description on the generic scaffold; dramatic node lighting; title card; cut language |
| `the-briefing` | human two-shot | **beyond** | THE hard one: face rig, expressions readable in the nocap pass, SSS skin in closeup, rack focus between speakers |
| `crowd-cross` | scale | **near** | ~100 figures from one scaffold via instancing, individual gait phase offsets, LOD shading |
| `rube-goldberg` | physics | **beyond** | Build-time Rapier bake to sampled trajectories; byte-determinism preserved through the bake |
| `meme-remix` | meme | **in reach** | Speed of authoring is the metric: joke format, fast cuts, text overlays, made start-to-shipped in one session |
| `museum-walk` | interactive spike | **beyond** | Same kernel, input driver instead of timeline driver; walk the camera through a built set |

**Reach grades, first pass 2026-07-31, graded against the tree rather than
against memory.** *in reach* = every named element already exists and ships;
*near* = one identified primitive away; *beyond* = gated by a phase that has not
started. **Expect these to move, and treat a stuck grade as a finding:** a case
that stays *beyond* for three phases is either mis-scoped or is naming a missing
primitive, and both are worth knowing.

What blocks each unbuilt case, one line, with what was checked:

- **`market-crash`** — nothing. `gearbox` proves the explainer register and the
  SHOTS solver, `noise-chart` proves a grid of cells, `setOverlay` proves text.
  **The most in-reach case in the table, and the cheapest evidence available.**
- **`boss-intro`** — nothing. Every element it names is shipped: the
  text-invented creature is `menagerie`'s strider, cuts are `hard`/`blend`/`whip`
  with match-cut validation, and the title card is the HTML fence's overlay.
  Its register (Phase 5) is where cutscene *dialogue* lands; this spec asks for
  none.
- **`meme-remix`** — nothing in the engine. Its metric is authoring speed, so it
  tests the harness and the skill, not a primitive. That makes it the one case
  whose grade cannot be read off the code.
- **`crowd-cross`** — two steps, and the first is a design question rather than a
  port. `InstancedMesh` is shipped, but for **fur shell layers** (one geometry ×
  L offsets), which is not the same problem as 100 independently *posed* rigs;
  per-instance bone matrices need a decision. Per-figure phase is already
  expressible — `gaitPose`'s `opts.start` shifts the plant grid, and the gait is
  distance-driven. **LOD has no implementation and no reference.**
- **`the-briefing`** — the face, and only the face. **Two of its four named
  requirements already ship:** SSS (`materials.html`) and rack focus (`STYLE.dof`
  + `SHOTS[].focus` + `cut:'blend'`, which the solver lerps across the cut). The
  scaffold's head is a sphere plus an optional muzzle box; there is no blink,
  brow, jaw or mouth anywhere. So it is narrower than "THE hard one" suggests —
  it is Phase 3's morph basis, landing into shot language that already works.
- **`rube-goldberg`** — Phase 4, which is next by owner priority, and its
  constraints are already written in [`physics-bake-proposal.md`](physics-bake-proposal.md).
- **`museum-walk`** — Phase 6, whose gate this document already calls unreachable.
  There is no input handling anywhere in the repo (the only `addEventListener` in
  any scene is `resize`). It is also the one case that argues with the prime
  directive rather than extending it, which is why it stays last.

### Variations between the rungs

Nine cases is a coarse ladder and the intermediate variants are what does not
exist. Each of these isolates ONE new variable, which is Phase 1's lesson
applied to the portfolio itself.

- **A 2D film — CLOSED 2026-08-04 by `market-crash`, and the closure is the
  interesting part.** This bullet read "a hole, not a nicety —
  `scene2d.template.html` ships to every installed user and **no example
  exercises it**", and that was true until `crash.html` landed: a ten-beat 2D
  film built cold, from `method.md` and the 2D template alone. It is now in
  `scenes/` and it exercises `drawOn`/`alongPath` and in-canvas text, which
  had no worked demonstration anywhere. What the closure changed that a
  "done" would hide: `txt()` being 2D-only is precisely why the `nocap`
  semantics pass is incomplete on 3D films, which `instruments.md` owns. The
  rung below `market-crash` is therefore no longer "a 2D film" but **a second
  one** — the n=1 brake applies to the register as much as to the cold-start
  criterion.

  **CORRECTION, 2026-08-07.** This bullet asserted for one day that
  `crash.html` "carries no fence markers at all", sits "outside the parity
  set", and leaves "the 2D kernel unpoliced by parity where the 3D one is
  not". **All three were false and the error was mine**: the check behind
  them grepped for a marker syntax this repo does not use (`mitate:begin:X`
  rather than `==== X-START ====`), and an empty result was read as an
  absence rather than as a broken query. `crash.html` carries `CONTRACT` and
  `KERNEL` — the two every scene carries — and the 2D template carries only
  those two because a 2D scene has no solver, rig, driver or character block
  to share, which is design and not a gap. Parity guards them: injecting one
  line inside crash's `KERNEL` fence takes `--parity-only` red, verified
  rather than reasoned. The lesson is the one this repo keeps relearning in
  new costumes — **a query that returns nothing is a claim about the query
  until you make it return something.**
- **`small-crowd` (6–12 figures, no instancing, no LOD)** — sits below
  `crowd-cross` and answers the question that actually matters first: does
  per-figure gait phase read as a crowd? `menagerie` already draws three
  characters; this needs no new primitive. Only then instancing, then LOD, as
  three rungs instead of one leap.
- **A single-speaker closeup** — sits below `the-briefing` and uses what already
  ships: SSS skin, rack focus, existing head. It proves the closeup framing and
  focus language *before* the morph basis exists, so Phase 3's face lands into a
  shot that is already known to work rather than into two unknowns at once.
- **A title card and dramatic lighting on an EXISTING creature** — sits below
  `boss-intro` and separates the register work from the creature-invention work,
  which `menagerie` has already proven independently.

Formats (vertical 9:16, square) are exercised inside these via `FRAME`, not as
separate cases — that contract carries over and already works.

**Chart tier (decided 2026-07-23).** Below the films sits a second class of
test scene: charts — static grids of patches, one primitive per cell,
smoke-gated and byte-compared per backend. Films integrate; charts isolate.
The portfolio above is sufficient at the film tier (it already reserves a
film for every place a borrowed technique lands: `the-briefing` for skin,
`crowd-cross` for LOD shading, `rube-goldberg` for the bake); what it lacked
was anywhere to land a borrowed *primitive* alone — the Phase 1 lesson
(isolate one class of new variable) says a new hash or noise function must
not debut inside a film. Pipeline: chart proves the primitive, showcase
(materials.html's tier) proves the pack, film proves the register. Every
ported primitive lands chart-first (source map: appendix at the end of this
doc). That pipeline is the *proving* half of one axis; the layers it proves
into, and what triggers a promotion between them, are in
[Promotion](#promotion-what-enters-the-skill-and-in-what-form) below. First chart SHIPPED
same day (mitate 0.12.0, `examples/noise-chart.html`): 8 cells —
MaterialX baseline row (fbm, worley, aastep, palette-fbm), ported row (HWS
value noise, HWS cells, domain warp) plus the classic sin-hash as a
deliberate drift control, structurally identical to the HWS-cells cell
except the hash. Measured: 20/20 smoke green (15 WebGPU-Metal, 5 WebGL2
fallback), control included. **Negative finding on the metal 1-in-6 FAIL:**
dense noise/hash coverage alone — no shadows, no characters, single locked
shot — did NOT reproduce it in 15 metal runs, which narrows the suspect
space toward the machinery bear-and-bees has and the chart lacks (shadowed
fur shells, multi-shot solver traffic, the character rig). The sin-hash
control also stayed clean at this sample size; the classic drift claim
remains unconfirmed on this stack — keep the control in place, it costs
nothing and the chart re-runs free.

## Phases and gates

Each phase ends at a gate a reviewer can check. No phase starts until the
previous gate is green — except documentation, which trails every phase.

**Three sequences, not one.** Phases 0–6 below are the **capability ladder**
and are the only strictly sequenced track. **Phase R** (further down) is out of
band: restructuring under a proven oracle, available whenever a unit is about
to be rewritten. **The representation track (REP0–REP6, after Gate R)** is
also out of band: adopted 2026-08-02, implementing the decision recorded in
[`representation.md`](representation.md), and none of its gates blocks or is
blocked by a capability gate. A gate on one track never blocks another.

**Marking a gate met here obliges one more edit: `plugin/README.md`'s Status
line.** That obligation covers the capability ladder only — Phases 0–6, which
is what that Status line summarizes — not Phase R and not the REP track. That line summarizes which phases are done, and this file is its only
source. Nothing checks the two against each other, so the summary reads wrong
from the moment a gate moves until someone notices — which is precisely the
drift that got the README's longer status narrative deleted in 0.16.13. Write
the gate, then fix the summary, in the same change. If keeping them in step
ever costs more than the summary is worth, delete the summary and leave the
pointer: this file wins any disagreement by construction.

**Not a phase: the repo split (0.13.0–0.14.0, 2026-07-24).** The skill moved out
of the `fb-claude-skills` marketplace into this repo and was renamed
`screenwright` → `mitate` (a real name collision — see the founding decisions
table). Infrastructure only: no scene, template, or instrument behavior changed,
and phase status is exactly what Phase 2's gate left it. Two things worth
recording because they are findings, not moves. **0.14.0 shipped
`references/instruments.md` and `references/delivery.md`, which `smoke.js` and
`build.js` had cited since 0.1.0 without either file ever existing here** — a
dangling pointer every installed user has followed for the plugin's whole life,
found only once the tree sat in one place. Porting them was an audit, not a
copy, and it corrected four claims that had gone stale against this stack (six <!--count-mention-->
parity fences, not two — six was right at that audit and `CONTRACT` has since
made it seven, which is why this sentence is marked as a record of what the
audit said rather than a live count; the shipped-frame spread
floor and `build.js poster` undocumented entirely; the predecessor's
cross-backend PSNR figure relabelled inherited). And **the predecessor's measured
record now lives here**, consolidated verbatim into
[predecessor-record.md](predecessor-record.md) — this plan commits to importing
those conclusions rather than re-learning them, and they had been one repository
retirement away from gone.

**Phase 0 — Foundation. DONE 2026-07-23 (mitate 0.1.0).** Plugin
scaffold (`plugin/skills/mitate/`), vendor entry for the node stack (SkyMesh —
the node-stack Sky — kept), 3D template with async init + `compileAsync`
pre-warm before `sceneReady` + `uniform(0)` time + backend report, port of the
deterministic kit and all tooling, per-platform flag policy in the recorder,
instrument recalibration begun. *Gate, met:* template scenes pass smoke on
WebGPU-Metal **and** the WebGL2 fallback (plus the 2D sibling); the
flat-frame catch was demonstrated firing in the real instrument (playwright
headless-shell + `WEBGPU=swiftshader` → shipped-frame FAIL), not assumed;
determinism byte-check green on both backends. Four measured findings shipped
in the tools — the shadow `frameId` guard, the presentation settle, the
shipped-frame check with its spread bracket, the arm64 Chromium resolution
fix — recorded in `references/webgpu-stack.md`. (The predecessor's CHANGELOG
number that stood here resolved in no repo: this CHANGELOG runs 0.1.0 upward.)

**Phase 1 — Regression, post, shading.** Reshaped after Phase 0 (2026-07-23):
the gate work runs in this order, each step isolating one class of new
variable.

1. *Structural chores first:* a shared same-task render-and-read sampling
   helper in smoke.js — three checks independently hit the buffer-clears-
   after-composite trap in Phase 0; the rule becomes construction, not
   convention. **DONE 2026-07-23** (`sampleAt()`, both consumers refactored,
   crop-control re-verified).
2. *`gearbox` before any new capability.* The regression case has zero new
   variables, so it separates porting gaps from feature bugs, and it is the
   first real film through the instruments smoke does not cover (`motion`'s
   frame-difference metric, `strip`, the delivery encoders) on node-stack
   output. Judged against its explainer-video twin by the honest comparison:
   same beats spec on both skills, instruments green on mitate, and a
   side-by-side visual review (sheets, squint strips, watched loops) judged
   no worse. NOT "every instrument matches" — the two skills' instruments
   now differ, and frames are not byte-comparable across renderers.
   **DONE 2026-07-23** (mitate 0.2.0, `examples/gearbox.html`): the
   strategy paid immediately — gearbox exposed the sortObjects draw-order
   uniform corruption (now determinism rule #5, template default) and the
   stale frustum-cull decision (rule #6), both invisible to the 4-mesh
   template. Twin judged no worse. Both follow-up investigations closed
   same-day by subagents: the "~3% framing delta" was a capture-viewport
   artifact in the original A/B — at equal viewport, rendered geometry is
   sub-pixel identical across all three renderer configurations, so the
   inherited SIZES ladder is calibrated correctly (the real cross-stack
   difference is tone/shading only); and the sortObjects defect was
   confirmed by minimal reproduction (3 meshes, both backends, 40/40 vs
   39/40) with two refinements — the trigger is a REVISITED state after a
   depth-order change (object motion suffices; camera cuts are the common
   case), and it is 100% deterministic on revisit, not flaky. An
   independent film review then found two HIGH semantic defects in gearbox <!--count-mention-->
   (ring parked off the interlock; ratio trails asserting 1:1 against a
   3:1 caption) plus an uncovered loop seam — all fixed in 0.2.1, with the
   loop made seamless BY CONSTRUCTION (SPIN derived from TOTAL so both
   gears complete whole turns; final shot matches the opening shot). A doc
   audit caught three doc-vs-code drifts (inert vendor invocation, 2D
   contract overclaim, a nonexistent MaterialX export name), all fixed.
3. *Post plumbing active by default.* The template runs a pass-through
   `RenderPipeline` (neutral look; bloom behind a `STYLE` flag) so smoke's
   determinism and shipped-frame checks ride the post path on every scene —
   Phase 0's lesson is that the untested path is the broken path.
   **DONE 2026-07-23** (mitate 0.3.0): pass-through preserves the
   direct-render look (identical exposure statistics), smoke green on both
   backends through the pipeline, `STYLE.bloom` and `STYLE.dof` verified
   deterministic and visually working, DoF wired to the solver's
   `shotFocus` — the `focus` shot property is no longer inert. gearbox
   regenerated on the post-path template and re-shipped.
4. *Material packs, trimmed:* toon, SSS skin, glass/dispersion — each
   verified on a small showcase subject. Fur and fabric move to Phase 2,
   where characters exist to test them on.
   **DONE 2026-07-23** (mitate 0.4.0, `examples/materials.html` +
   `references/materials.md`): all three verified on both backends under
   byte-determinism. Two measured r185 traps now in the doc: the plain
   `transmission` PROPERTY never engages (the node slot works — recipe
   rule: node slots are the reliable interface), and Chang-SSS has no
   thickness input (thin/thick modeled as two materials). Cel is
   TSL-native banding — structurally immune to the ambient-wash failure.
   The glass beat carries the overlapping-transparency ordering case:
   farther-first creation composites correctly under sortObjects=false. **The glass pack pays the
   sortObjects bill:** unsorted drawing (determinism rule #5) composites
   transparency in creation order, and glass is nothing but overlapping
   transparency. The pack must ship an explicit ordering discipline
   (create/order farther-first; renderOrder where creation order cannot
   express it) and a test scene where transparent objects genuinely overlap
   and pass both determinism and a visual correctness look.
5. *Brackets re-measured, not imported.* The old bloom rule (threshold above
   sky-lit luminance, 3.2/8.0/14.0) was measured against `UnrealBloomPass`,
   which reads pre-tone-mapped values; the TSL bloom node is a different
   implementation and the numbers are presumptively stale. Same pass settles
   the template palette's standing crushed-exposure advisory.
   **PARTIAL 2026-07-23:** first TSL-bloom observations measured and
   recorded in materials.md (monotone, no cliff at 1.0 — appears
   pre-tone-map; emissives behind transmission barely feed it; palette-
   conditional as before). A full bracket waits for the first film that
   leans on bloom. The crushed-exposure advisory has since been **measured**
   (2026-07-29, full template+example corpus) and what remains open is the
   *disposition*, not the measurement — figures and the argument live in
   [`working-plan.md`](working-plan.md), "measurement debts". This entry said
   "remains open" while another file said "measured" and a third said "left
   undone": one item, three states, until 0.16.30.
6. Style bibles v2 on the new stack.
   **DONE 2026-07-23** (mitate 0.5.0, `references/bibles.md`): a
   bible IS the STYLE object — the solver and template already consume
   exposure/bloom/dof/lens/cutDur/energy, so the mechanism landed with no
   new machinery. gearbox ships the committed control pair
   (`workshop`/`neon`, one line apart): verified categorically different
   films, both byte-deterministic on both backends.

*Gate:* `gearbox` passes the comparison in (2); a committed control pair (two
bibles, one line apart, same beats) produces categorically different films;
the three material packs each demonstrated under byte-determinism.
**GATE MET 2026-07-23 — PHASE 1 COMPLETE** (mitate 0.5.0): gearbox
comparison closed in 0.2.x, packs in 0.4.0, control pair in 0.5.0. Open
carry-forwards into later phases: full bloom bracket (first film that leans
on bloom), template-palette crushed-exposure advisory (measured; disposition
open — see `working-plan.md`), `WEBGPU=vulkan`
unverified, upstream repro for the sortObjects defect unfiled.

*Post-gate quality pass (2026-07-23, mitate 0.6.0):* the deliberately
deferred simplify review ran four angles (reuse, simplification, efficiency,
altitude) over the whole founding range and applied ~30 deduped findings —
shared `templates/backend.js` (browser/flag policy/settle, one copy for
recorder and gate), `RIG`/`DRIVER` parity fences covering all three
load-bearing determinism guards, contract exports over internals probing
(`window.CAPFADE`; flashes resolved once), `energy` single-homed in STYLE,
per-run vendor cache, and the `motion` second-browser launch removed.
Verified look-neutral: pre/post example frames byte-identical. Full ledger: the
predecessor's, consolidated in [`predecessor-record.md`](predecessor-record.md)
— the bare version number here pointed at the ancestor's numbering, not ours. **Standing maintenance rule from this pass — standing until REP1's emitter
lands:** the fenced blocks span every carrier directory, but a smoke run only
checks the files it is pointed at — after editing any fenced block, run the
cross-directory parity command whose authoritative copy is
`scripts/install-hooks.sh`'s `HOOK_BODY` (`selfcheck.js` check 8 compares the
installed hook against it, and the run states its own scope). A per-directory
green does not cover the template↔example boundary — and an inlined copy of
the command here once prescribed fewer globs than the check has carriers,
which is why this line now points instead of restating.

**Phase 2 — Character scaffold.** Skeleton family + proportion vectors +
shells; IK ported and extended; gait on the new rig; fur-shell and fabric
packs land here, tested on the characters they exist for. *Gate:*
`bear-and-bees` plus a human plus a text-invented creature, all from one
scaffold; each squint-distinct; walk cycles plant (no sliding feet on the
strip check).

*Step 1 DONE 2026-07-23 (mitate 0.7.0):* the scaffold kit shipped as
`templates/scene.character.template.html` with a fifth parity fence
(`CHARACTER`) — skeleton family as one topology × proportion vector,
lathed/capsule shells from pure code (no data tables needed until morph
deltas arrive in Phase 3), ported two-bone IK generalized by bend direction,
plant-grid gait generalized to any planted-limb set, closed-form neck/tail
chains. Both the biped demo and a quadruped vector verified walking on both
backends; strip check confirms planted feet hold. `references/characters.md`
carries the vocabulary.

*Step 2 DONE 2026-07-23 (mitate 0.8.0):* fur (shell layers in the
CHARACTER fence — normal-displaced geometry per layer, TSL noise coverage,
alphaTestNode discard so fur never touches the transparency-ordering bill;
byte-deterministic both backends on the quadruped) and fabric (sheen node
recipe on MeshPhysicalNodeMaterial, verified rendering — node slots, per the
transmission lesson).

*Step 3 DONE 2026-07-23 (mitate 0.9.0):* `examples/menagerie.html` —
bear + human + text-invented strider from one buildCharacter, squint-distinct
(measured on the squint strip), planted (strip-checked per character),
byte-deterministic both backends, film-reviewer-reviewed with all HIGH
findings fixed (the look beat now carries on geometry in the nocap pass).
Kit addition from the review round: `rig.centerX` (subject aim at the visual
center, not the root — a root-aimed quadruped FS rendered a wall of rump).
**Phase 2 gate reading:** the scaffold criteria (three characters, one
scaffold, squint-distinct, planted) are demonstrated by menagerie;
`bear-and-bees` the comedy short remains open as the phase's film deliverable
and carries the comedic-timing half of the gate.

*Post-gate code review (2026-07-23, mitate 0.9.1):* five-agent pass
over the 0.6.0–0.9.0 range. Fixed: shoot.js's swiftshader refusal had gone
dead in the backend.js extraction (called `angleArgs()` without
`refuseSwiftshaderShip: true` — the documented asymmetry existed only in
comments); the template demo missed two fixes that landed only in menagerie
(subject aim without `rig.centerX` cropped the FS at the feet — verified on
before/after sheets — and the backOut(ramp) breath held the walker 4%
squashed from frame 0); `solveLimb`'s clamp floor (absolute .2) inverted for
rigs with reach under .21, posing limbs beyond their own length — floor now
`min(.2, reach-.02)`, a proven no-op at shipped scales but load-bearing for
insect-scale rigs (the bees). Docs: webgpu-stack.md overclaimed
`MeshToonNodeMaterial` as exercised; film-language.md still said
`CONFIG.energy`. New carry-forward, dispositioned not fixed: character
material colors are hex literals in `buildCharacter` calls, not STYLE keys —
bibles.md's rule ("a hex literal in a material is a look decision hiding
from the bible switch") applies when the first character bible pair arrives;
palette keys move into STYLE then, not before.

*Simplify pass over the same range (2026-07-23, mitate 0.10.0):* the
sixth parity fence, `HTML` — the shared page scaffold (overlay CSS + caption
DOM, carrying the will-change compositor hint) had silently reached five
identical unfenced copies; now HTML-comment-fenced in all five 3D scenes and
in smoke's parity loop (a second regex arm, since the block lives outside
`<script>`). Plus four small cleanups; ledger in
[`predecessor-record.md`](predecessor-record.md), not this CHANGELOG. The
standing cross-directory parity rule now covers <!--derived:fences-->7<!--/derived--> fences.

*Phase 2 GATE MET 2026-07-23 (mitate 0.11.0):*
`examples/bear-and-bees.html` — the comedy short, carrying the
comedic-timing half of the gate (2.6s hush against a 1.1s eruption, locked
tableau camera, gag fully readable in the nocap pass). Film-reviewer pass
found three HIGHs, all fixed and re-measured: the flee launch clipped the
hive before the duck opened (now +0.01..+0.24 clearance through the pass);
the face never faced the camera (a `face` 3/4-turn envelope spot→hush puts
the blink and glance on screen); and the boop was a z-axis miss faked by
the camera (contact-bug class instance five — restaged to a probe-measured
surface graze, normalized 1.02, all three axes). Method notes: the paw-swipe
staging died on probe data (the muzzle out-reaches the foreleg on this
vector — a quadruped paw can never pass its own nose), and the neck-curl
sign convention was bracketed empirically (+z RAISES this rig's head —
menagerie's comment implies the opposite; trust the probe, not the comment).
New carry-forwards: one intermittent WEBGPU=metal smoke determinism FAIL
(1 in ~6 runs at t=17.04, never reproduced, cause unmeasured — the bee
visibility gate added in the same round is hygiene, NOT the fix); a
per-shot camera-energy override (the hush wanted `locked` while the film
wanted `steadicam` — no vocabulary for it, so the film went all-locked,
which suits this register but will not suit the next one).

**Phase 3 — The human.** Face morph basis, expression library, hands, hair
shells; `the-briefing`. *Gate:* the two-shot survives all three review axes;
expressions carry the beat in the nocap pass — the caption is not doing the
acting.

**Phase 4 — Physics bake.** Build-time Rapier step: simulate once, emit
sampled trajectories as scene data, play back pure. *Gate:* `rube-goldberg`
byte-deterministic across seeks and across re-bakes with the same seed;
`crowd-cross` if instancing wants baked variety.
*OWNER PRIORITY (2026-07-23):* the owner chose bake-time simulation as the
next creative direction after `bear-and-bees` ships — "simulated creativity
without an LLM". Phase 4 moves ahead of Phase 3 in priority. Runtime
determinism stays; the sim happens once at build time. Constraints, red
lines against tier drift, eval criteria and the spike list:
[physics-bake-proposal.md](physics-bake-proposal.md) — read it before
writing any Phase 4 code.
*Sibling direction (owner-agreed 2026-07-23):* the same tier-1 shape applied
to illumination — a **light bake** (path-traced GI / radiosity / probe solve
at build time, shipped as data, playback pure). Recorded in the same
proposal doc, including the finding that reflections themselves need NO bake
(SSR node, planar reflector, GTAO, environment lighting are pure functions
of scene state — available at runtime today at zero determinism cost).
*NEXT SESSION ENTRY POINT (updated 2026-07-24, after the repo split):* start
with the proposal's spike list, measured before any pipeline code — (1) Rapier
version pin + WASM re-bake identity on this machine, (2) sample-rate bracket
(12/30/60Hz, size vs smoothness), (3) embedding format (JSON floats vs
base64 Float32Array) on a real bake. Then the light-bake spike under the
same red lines.

State going in: everything through 0.14.0 is shipped and **committed but not
pushed** — this repo's history begins with the migration, and the two commits
are local. The bake work needs no new tooling; `smoke.js` already gates
re-bake determinism the same way it gates seek determinism, which is the point
of doing the sim at build time.

Loose ends carried in, none blocking Phase 4:
- the standing measurement opens — full bloom bracket, the template palette's
  crushed-exposure advisory, `WEBGPU=vulkan` verification, per-shot camera
  energy vocabulary;
- the unreproduced `WEBGPU=metal` 1-in-6 determinism FAIL, narrowed by the
  chart tier (it did **not** reproduce under dense noise coverage with no
  shadows, no characters, one shot) toward machinery bear-and-bees has and the
  chart lacks. **Narrowed much further 2026-08-07 (0.26.0–0.27.0):**
  `bear-and-bees` itself ran 48/48 green under `WEBGPU=metal` on the
  seekSynced-hardened capture path — 24 runs on `playwright-core@1.61.1` and
  24 on 1.62.1, verdicts verified per file — a sample a standing 1-in-6 rate
  survives about 0.02% of the time. So on the current capture path the flake
  is gone or far rarer than recorded; the original observation predates the
  hardened path and is not retired by this. The determinism checks now carry
  a canvas-readback discriminator (`smoke.js`, bracketed by
  `templates/bracket-readback.js`), so any recurrence arrives with its layer
  named — capture versus scene — instead of as a bare byte mismatch.
  **Phase 4 raises the stakes on this one**: a bake is only worth
  anything if playback is deterministic, so if the intermittent FAIL is real
  it will surface here first. Re-run the chart control before trusting a green
  bake;
- character colors are still hex literals in `buildCharacter` calls rather
  than STYLE keys (dispositioned in 0.9.1, not fixed) — the bibles.md rule
  bites when the first character bible pair arrives, which Phase 5 will force
  if Phase 4 does not;
- the site's `stage-films.sh` build step has been verified locally but has not
  yet run on a real deploy.

**Phase 5 — Registers.** Cutscene and meme film-language extensions (dialogue
staging, comedic timing, title cards); `boss-intro` and `meme-remix`.
*Gate:* `meme-remix` authored start-to-shipped in one session by following the
skill docs alone.

**Phase 6 — Interactive spike.** Input driver over the unchanged kernel;
`museum-walk`. *Gate:* the spike reuses kernel, characters, materials, and at
least one instrument with zero modification — proving the layer split held.
**This gate was unreachable until 0.16.62, and knowing why is the point of
keeping it worded this way.** `setCamera(t)` took `t`, so a bounded view offset
had to enter *inside* the kernel, and one line inside `SOLVER` is not zero.
**The seam fix landed 2026-08-01**: `setCamera(state)` across all eight
carriers, so the offset can now enter as a field of `state` rather than as a
line in the kernel.

**The gate is therefore no longer unreachable — it is untested.** Do not read
that as met. Nothing has yet reused the kernel with zero modification; the seam
only removes the one obstacle this paragraph could name in advance. Until a
spike runs, this gate measures nothing either way, and the useful question it
now asks is whether a *second* obstacle exists that only building the spike will
find.
This phase decides whether interactivity becomes a sibling skill or a
mitate register; that decision is explicitly out of scope until the
spike exists.

*Unplanned early evidence (2026-07-25), and a weld to cut here.* A viewer
prototype built on one film swapped the timeline driver for its own loop — it
called `stopPlayback()` and drove `seekTo` itself — and reused the kernel,
characters, materials and the contract unchanged. **That is this phase's driver
swap, arrived at by accident, and it is real evidence the layer split holds.**
Two things it also established, both recorded in
[working-plan.md](working-plan.md) Track C. First, the gate's "zero
modification" is not yet literally reachable: a bounded view offset has to enter
somewhere, and because `setCamera(t)` took `t` rather than a state value, the
split this plan describes was a discipline rather than a seam. The offset
therefore landed as a hook *inside* `setCamera` — which deepened the weld at
precisely the point Phase 6 intends to cut, so the spike should start by cutting
there rather than discovering it. **That cut was made in 0.16.62** — the
signature is `setCamera(state)` now, so the spike inherits the seam instead of
having to open it. Second, the same machinery recording and
replaying its own camera deltas is a **Phase 4 bake** by this plan's own
definition (sample once at build time, splice as data, play back pure), and the
cheapest one available: the baker is a person, so there is no version pin, no
seed and no re-bake identity question. It exercises two of Phase 4's three spike
items against a baker that cannot be non-deterministic.

**Scope-fence amendment — APPROVED by the owner 2026-07-25.** The Risks section below fences
"input handling" as an engine-shaped non-goal until this phase reopens the
question, which as written blocks a viewer. The distinction worth drawing is not
film-versus-interactive but **who owns the state stream**: viewer chrome that
bounds a *viewing parameter* (framing, captions, transport) while the timeline
driver still owns `t` is a delivery feature and is admitted; an input driver that
*replaces* the state stream is Phase 6 and stays behind this gate. The recorder
never arms either, so neither can reach a shipped frame. Without this amendment
Track C is correctly blocked; with it, the fence still holds where it matters.

**Phase R — Restructuring under a proven oracle (owner-directed 2026-08-01).**
Remove inherited and unexamined code while what it does stays fixed. Numbered
out of band because it is **not sequenced behind Phase 6** — it is available
whenever a unit is about to be rewritten, and it gets more expensive the longer
the tree grows around what it would remove.

**The premise, stated because it is unusual and load-bearing:** most codebases
attempting this are blocked on defining "functionally the same." This one is
not. Sameness is already mechanical at four levels — byte-identical frames on
one backend, byte-unchanged `smoke.js` verdicts over the corpus, fence parity
across the nine carriers, and the harness tier's tallied rows. The expensive
prerequisite exists. So the binding constraint is not *can we define sameness*
but **which oracles can actually fail.**

**The rule.** Not new doctrine — invariant 6 (*red before green, on
modifications too*) extended from checks to restructuring:

> **Before refactoring a unit, prove that unit's oracle can go red. Mutation-test
> the oracle, not just the code.**

R4.1's stage 1 is the worked example and the reason this is written as a rule.
Byte-identical verdicts across the extraction said nothing until the
crushed-exposure threshold was neutralised inside the extracted function and the
diff caught it — three warnings gone, the tally 4 → 1. Without that step, "the
verdicts did not change" is indistinguishable from a comparison that cannot
change.

**The trap it exists to catch, found live 2026-08-01:** `bracket-determinism.js`
proves across-reload nondeterminism is *detectable*, but it reimplements the
comparison with its own Playwright calls and never invokes `smoke.js`.
Refactoring `smoke.js` under it would be refactoring under an oracle
structurally incapable of seeing the code being changed. Generalised: **a control
that rebuilds its subject verifies a reimplementation.** Check that before
trusting any oracle, not after.

**Triage, five buckets — because a sweep is the wrong instrument.** A sweep
rewrites the reasoned code alongside the rest, and here the reasoned code is the
majority:

| | reason recorded | control exists | action | covered today by |
|---|---|---|---|---|
| a | yes | yes | leave it alone | — |
| b | yes | no | build the control, keep the code | **`selfcheck.js` check 5**, ratcheted at 51 |
| c | no | yes | recover intent from the control's arms — they are a spec nobody wrote as prose | nothing |
| d | no | no | archaeology, then decide | **nothing** — `working-plan.md` Track F |
| e | duplicated by construction | — | the <!--derived:fences-->7<!--/derived--> fences | `--parity-fix` + cross-directory parity, **until REP1's emitter retires this bucket** (direction decided 2026-08-02 — `representation.md` point 5) |

**Two of the five are already instrumented, and that is the model to copy.**
Check 5 counts comment lines asserting a measurement without naming a runnable
control, seeded at an honest baseline and permitted to fall but never rise.
Bucket (d) needs the same instrument and does not have one — and (d) is the
harder class precisely because its members **make no claim at all**, so there is
nothing for a claim auditor to grade.

**Inventory, counted 2026-08-01 rather than estimated.** Uncontrolled
measurement claims, by file, and the silent-swallow count beside them:

| file | lines | uncontrolled claims | silent swallows |
|---|---|---|---|
| `smoke.js` | 1331 | 21 | 11 |
| `build.js` | 1070 | 12 | 0 |
| `shoot.js` | 327 | 3 | 0 |
| `backend.js` | 182 | 1 | 1 |

**The debt is concentrated, which is good news and should shape the order of
work.** `build.js` and `shoot.js` carried zero silent swallows across the 1,397
lines counted 2026-08-01 — `build.js` has since grown by roughly a third (the
`check` verb, 0.16.67) and the swallow audit has not been re-run over the
growth, so the conclusion is dated, not current.
Every one of `smoke.js`'s eleven behaviour-defining thresholds
(`SHIPPED_SPREAD_FLOOR`, `FRAMING_INVARIANCE_MAD`, the four `EXPOSURE_*`, …) is
named by **no bracket at all** — several carry a `Bracketed:` claim in the
comment beside them, with the measured figures, and those claims are counted as
debt by check 5 exactly because they name no runnable control. So the gate
instrument is where both the risk and the payoff sit.

**The premise got three independent confirmations in one afternoon
(2026-08-01), by accident, and they are the best argument for this phase.**
Three designs were proposed, each looked obviously right, each was run against
the actual repo, and **none survived**:

1. **A `selfcheck` arm for the version cascade**, anchored on
   `merge-base(origin/main, HEAD)` — **exited 0 on the live violation.** An
   earlier bump on the branch permanently satisfied a whole-branch version delta.
   A control that cannot go red on the instance that motivated it, proposed in
   the same breath as the rule against decorative controls.
2. **Deriving check order from a `requires`/`provides` table** — **zero edges to
   derive from.** None of the six checks writes to `ctx`, so every permutation
   was equally valid while exactly one was correct. The real constraints were
   page state: coldness, viewport at entry, whether the page was actually
   re-seeked.
3. **Mandatory `Rejected:` fields in commit messages** — **the motivating
   commit already had one.** `2c5742f` recorded two rejected alternatives
   voluntarily, in the comment and the CHANGELOG. The field would have been
   satisfied and the guard would still be unexplained.

Each was refuted by running it, not by arguing about it, and each would have
shipped as an improvement. **That is the whole phase in miniature:** the
dangerous artifact is not the obviously-broken one, it is the one that looks
correct and has never been executed against the case it exists for. Extend the
suspicion to the *fix* as readily as to the code — all three of these were
fixes.

### Phase R's first unit: the determinism trio (owner-directed 2026-08-01)

**Named here rather than left to whoever picks the phase up**, because "available
whenever a unit is about to be rewritten" is a rule that selects no unit, and a
phase with no first move is a phase that does not start.

**The unit:** `checkDeterminism`, `checkReloadDeterminism`, `checkBlankFrame` —
about 100 lines in `smoke.js`, sharing one captured `ctx.frames`.

**Why this one, and why now.** Phase R's binding constraint is not defining
sameness, it is *which oracles can actually fail*. For this unit that oracle now
exists **as a control rather than as a memory**: `bracket-driver.js` covers the
driver the trio runs under, the nine-scene corpus covers verdicts, and the trio's
three assertions are each **forced true in turn by a standing arm** that requires
that check's own message. That last technique is the reusable part — it is how a
check emitting nothing on a green corpus is shown to still be wired to the
verdict, and it is what R4.1's own gate could not do by equality alone.

**It was a memory until 0.16.58, and that is the part worth keeping.** The
original run was a manual mutation in a scratch directory that no longer exists,
so the load-bearing half of R4.1's argument was the half nobody could re-run. Two
things came out of turning it into arms. A **negative control** was needed before
the three meant anything — assertion forced *and* its push routed to a local
sink, which makes smoke report `all scenes pass` at exit 0; without it, "the
assertions reach the verdict" rested on arms never shown capable of noticing that
they do not. And the arms needed a fixture that passes smoke **outright**,
because `checkReloadDeterminism` is guarded by `!fails.length`: against a fixture
that fails anything earlier, forcing the reload assertion produces nothing.

**That guard is this unit's first tripwire, and it now has an alarm.** With the
fixture's playback disabled so the guard skips the check, the reload arm goes
BRACKET FAILED rather than quietly passing — so a change to the guard cannot
silently un-cover the check it protects.

**What the redesign has to decide, stated so it is not rediscovered.** The trio
bundles two decisions that are currently one:

1. **Fail rather than warn** on an unexpected throw. Deliberate, argued in the
   file, and correct — an advisory check crashing must never flip the exit code,
   a determinism check crashing must.
2. **Abandon every remaining check.** Inherited, never argued. It is what a throw
   inside a `try` block does to the statements after it, and the trio was inline
   inside one `try` before R4.1. The extraction preserved it because the gate was
   byte-unchanged verdicts; preserving a behaviour is not the same as it having a
   reason.

**These are independent axes, and this file already proves it:**
`checkShippedFrame` and `checkLivePlayback` are HARD checks that push to `fails`,
and both catch internally and let execution continue. So "it is a hard check"
does not imply "abandon". There are three tiers in the code and the module
comment describes two.

**The strongest argument FOR abandonment is unstated and covers only part of the
trio**, which is the finding: a throw inside `checkDeterminism` leaves the page
seeked somewhere arbitrary, and two of the four advisory checks that follow carry
hard-fail branches (framing invariance; exposure's >=99% near-black). Running
them on a broken page can manufacture a hard fail that blames the SCENE for a
HARNESS crash — the exact misattribution this repo already ate once, when a
capture race was reported as a scene defect. That reasoning holds for
`checkDeterminism`, holds more weakly for `checkReloadDeterminism` (mid-reload),
and **does not hold at all for `checkBlankFrame`**, which destructures
`{ PLAN, frames, fails }`, touches no page state, and is array indexing.

**So the unit is a genuine Phase R case rather than a tidy-up:** the reasoned code
and the inherited code are in the same control-flow decision. The triage table's
premise — that a sweep is wrong because reasoned code is the majority — is sound
for `smoke.js` as a whole and is *weakest here*, because separating the two means
separating statements, not files.

**Gate for this unit** is Gate R's second clause applied to it: the oracle
recorded red before the change and green after, both runs cited.

> ### DONE (0.16.61). Both decisions separated, and the guard settled with it.
>
> `onThrow` is declared per check beside `requires`, with `abandon` / `continue`
> / `warn` mapping onto the three tiers the code already had. **Undeclared is a
> hard error, never a default** — a default is how the unargued behaviour arrived.
> Only `checkBlankFrame` changed policy, `abandon` → `continue`, on the argument
> recorded above. Red: forcing it to throw took a run from 3 advisory warnings to
> 1. Green: `bracket-driver.js`, 18 arms, 0 skipped. Corpus verdicts
> byte-identical across all 9 scenes.
>
> **The `!fails.length` guard is gone too.** This paragraph said settling it
> needed "a fixture that can go red, which today it does not" — 0.16.58's `CLEAN`
> fixture made one constructible, so the blocker was removed by the arms rather
> than by argument. The fixture carries two defects at once: a random drawn at <!--count-mention-->
> load, and a playback loop never started so an unrelated hard fail lands before
> the trio. With the guard, smoke reported ONLY the playback failure; a scene
> whose live HTML and recorded MP4 are different films shipped green.
> `frames.length` stays and is a real precondition; `!fails.length` never was,
> because the check reloads the page itself.
>
> **One correction worth carrying:** that arm's first cut was ~3% flaky (an
> integer pixel offset with 32 reachable values), caught only because it failed
> once and passed once with no code change. It now rotates by a raw double. A
> control that is right 97% of the time teaches people to re-run it until it
> agrees.

**Gate R:** a ratchet exists for bucket (d) — behaviour-affecting code with no
recorded reason and no control — seeded at a counted baseline, failing when the
count rises, on the same escape hatch as `ASSERT_BUDGET` (edit the literal, in a
diff, with a reason); at least one unit restructured under an oracle **recorded
red before the change and green after**, with both runs cited rather than
asserted; and `bracket-determinism.js` driving the shipped `smoke.js` path rather
than its own copy of it. The last clause is the cheapest of the three and the one
that makes the others trustworthy.

## The representation track (REP0–REP6, adopted 2026-08-02)

Implements the decision recorded in
[`representation.md`](representation.md)'s decision section. **The seven
decision points are NOT restated here** — that file owns them, and this
section owns only the phases and their gates; the argument and tradeoffs
behind both live in `representation-exploration.html`, which is a draft
arguing one side and settles nothing. Out of band like Phase R: not sequenced
behind the capability ladder, available now, and REP1 grows more expensive
with every example added, which is the argument for its position in the order.

Placed after Phase R deliberately: the two share a premise (a control is only
worth what its oracle can refuse), and REP1 is what resolves Phase R's triage
bucket (e).

- **REP0 — decide and record.** *Gate:* the decision section is non-empty, or
  the deferral is recorded with its trigger. **MET 2026-08-02** (owner;
  `representation.md`).
- **REP1 — single-source the kit (the emitter).** The fenced blocks move to
  one canonical home, and regeneration in place IS the emitter — no separate
  assembler shipped, `--parity-fix` rewrites each carrier's fences from the
  store; the parity
  check inverts from "all copies agree" to "every carrier matches the
  store"; `--parity-fix`'s job shrinks to "regenerate". Feasibility was
  proven by a throwaway spike that reassembled every carrier
  byte-identically from film skeleton plus canonical fence store (retired
  2026-08-03, superseded by the bracketed emitter itself). **The site's
  source-equals-artifact wording ("the one scene file stays the source",
  "diffs like source") changes in this same phase** — it stops being true the
  day carriers become build products, and the site is downstream, so the
  wording is part of the work. *Gate:* the emitter reproduces every carrier
  byte-for-byte, behind a bracket recorded red before green. *Refuted if:*
  carriers need per-film divergence inside fences — then the fences were never
  kit and the track is miscarved.
  **MET 2026-08-02** (0.17.0, `ae9a977`): the store is
  `plugin/skills/mitate/templates/fences/<NAME>.fence.txt`; the rewritten
  `bracket-parity.js` was recorded red against the pre-store check and green
  on every arm after (the red run is recorded in `ae9a977`'s commit message
  and the day's log, and was independently reproduced during post-stamp
  verification); the store
  was extracted byte-identically from the carriers as they stood, and a full
  `--parity-fix` over all of them reported nothing to do. Parity now compares
  each carrier against the store, `--from` is removed with its reason, and
  the wording obligations landed with it — site, SKILL.md, glossary and
  instruments in 0.17.0; CLAUDE.md invariant 2 minutes later in an
  unversioned commit, since it is not plugin content; and a sixth surface,
  `orientation.md`, was missed by that sweep entirely and caught by the
  post-stamp verification pass. Independently re-verified at stamp
  time: selfcheck, parity-against-store, the full bracket, and the spike,
  each exit 0. Session postmortem:
  [`postmortems/2026-08-02_session_fence-store-emitter.md`](postmortems/2026-08-02_session_fence-store-emitter.md).
- **REP2 — one source for semantics.** `build.js check` reads the canonical
  definitions the kit is built from instead of reimplementing beat
  accumulation and anchor resolution; the open reimplementation-divergence
  findings close as a class; TypeScript-at-the-seams (decision point 6) is
  decided here, where the seams are written anyway. *Gate:* the review's
  divergence cases (a missing `size`, empty `SHOTS`, `subject: []`,
  prototype-named beats) resolve identically in `check` and in a driven page.
  *The stall trigger is retired unfired:* REP1 met the same day it was
  adopted, so the model-comparison bracket (2026-08-02 postmortem, forward
  item 5) is permanently superseded by the structural path. Recorded here
  and annotated on the forward item itself, so a reader arriving from
  either side finds the disposition.
  **MET 2026-08-03** (0.18.0, branch `r2-check-reads-store`): `check`
  executes the store's KERNEL and SOLVER fences against the scene's
  extracted tables — real `BEAT`/`beatAt`, real `SIZES`/`solveShot`, every
  solver refusal the kit's own throw, quoted. The gate is held by a
  control rather than a stamp: `bracket-check-kit.js` runs all four
  divergence cases through `check` AND a driven page and requires the same
  verdict carrying the same phrase — recorded red on all four against the
  pre-REP2 pair (the kit silently NaN'd two of them, so the kit gained
  three refusals in the same phase, regenerated into every carrier by the
  emitter), green after; every shipped scene still checks clean, and the
  PR's browser gate drove the full corpus green on a clean checkout. Where
  `check` stays deliberately stricter than the kit — among the cases:
  anchor fraction outside 0..1, duplicate beat names, out-of-order shots,
  `FRAME.px` disagreeing with `FRAME.aspect` — the divergence is one-way
  and the verb's header declares it as a class. **Decision point 6, resolved with the
  implementation: the canonical source stays plain JS.** Executing the
  store verbatim is what closes the divergence class; a TS seam would
  reinsert a transpile boundary — a reimplementation boundary by point 6's
  own argument — between the store and the carriers whose bytes it IS.
  Typed holes keep their discipline as declared signatures in the fence
  comments. Recorded by the implementing session; the merge review is the
  ratification. *Post-merge:* the four-pass review's findings — three
  pre-existing behavioral defects surfaced by the new adversarial
  instrument, plus wording — closed as the 0.18.2 cascade (2026-08-04,
  red-first per finding) in
  `working-plan.md`'s "What the REP2 review taught about review"
  (2026-08-03); this stamp is MET, not finished-forever. Session postmortem:
  [`postmortems/2026-08-03_session_rep2-review-protocol.md`](postmortems/2026-08-03_session_rep2-review-protocol.md).
- **REP3 — close the open bags.** `STYLE`/`CONFIG` gain a key registry
  **derived from the kit's actual reads** (the mechanical enumeration behind
  `references/breakdown.md` becomes its source); `check` warns on unknown
  keys; film-private keys get an explicit marker. REP3 also carries the
  **declared-substitution rule** (2026-08-03, from the REP2 review): every
  input an instrument substitutes or approximates — a stub, a sanitized
  value, an unresolved read — refuses or declares itself in the verdict.
  The unknown-key warns are one instance of that rule; its first three
  violations were fixed as 0.18.2 (2026-08-04), each behind a bracket arm
  recorded red first — the landing record is in `working-plan.md`'s
  2026-08-03 section.
  *Gate:* a misspelled kit key
  warns naming the near-miss; every shipped scene is warning-clean after
  annotation; the registry is derived or controlled, never hand-held.
  *Refuted if:* the registry cannot be derived from the reads — then it is
  another copy of the code.
  **MET 2026-08-04** (0.19.0): the vocabulary is derived from the canonical
  fence store's reads at check time, and CONSUMPTION is decided by the
  scene's own text — a carrier embeds its fences, so "the kit reads it" and
  "this scene's bytes read it" are one test, and it is the version that
  stays correct for a 2D scene declaring a SOLVER-read key (warned as
  carried-by-no-fence rather than passed on vocabulary). One deliberate
  deviation from the phase text above, taken on measurement: the
  film-private MARKER was not built. No carrier consumes STYLE/CONFIG
  indirectly (destructuring, `Object.keys`, computed access — measured
  2026-08-04 over all 8 scenes plus the corpus fixture), so a film-private
  key is recognized by the scene's own read of it with zero annotations;
  the first scene needing indirect consumption is the marker's trigger.
  Gate held by the `bracket-commands.js` pair — misspelled `exposur` fires
  naming `exposure`, a declared key the scene reads stays quiet — recorded
  red first, and the derivation found one real dead key in a shipped
  template on its first run (`scene2d`'s `faint`, declared and read by
  nothing; deleted), after which all 8 scenes check warning-clean.
- **REP4 — extents.** Implements decision point 4, whose binding terms —
  including what is forbidden — live in `representation.md` and are not
  copied here. *Gate:* the corpus fixture gains a
  deliberately wrong extent and the mechanism goes red on it, before any
  shipped scene is touched. **The fixture already exists** (noted
  2026-08-03): the corpus's row 11 IS a characterized wrong extent —
  `walker` declares `w:2.8` against a measured ~3.12 — and
  `bracket-corpus.js` already pins its geometry side, so REP4's red-first
  starts from a verified defect rather than authoring one.
  **MET 2026-08-08** (0.28.0): the mechanism is `check`'s extent-provenance
  warn — the FORM decided from the table source (any numeric literal in an
  `h`/`w`/`d` value fires; derived bases and named terms pass), the VALUE
  ceded to probe as the decision priced. The gate ran as written: the warn
  named `walker (h: 6.1; w: 2.8)` on the fixture before any shipped scene
  changed, and `templates/bracket-extents.js` holds both directions —
  firing arms watched red against the pre-change tree, quiet arms watched
  red under an over-firing mutant, the corpus arm pinning the fixture's
  signature. First catch on shipped content, found by the mechanism the
  hour it ran: the base template's knot declared `h:3.6` against a real
  bounding box of 4.79, so every FS shot overflowed the frame by a quarter
  — now derived from the geometry's own `computeBoundingBox`, with the
  character template's pad renamed to the intent term (`HEADROOM`). The
  corpus films still carry bare extents and warn on every `check`; their
  migration is queued in `working-plan.md` as per-scene, value-preserving
  work — each film re-verified, never a blind rename.
- **REP5 — instrument the movement triggers.** Makes the pattern-ledger's
  counting cheap enough that the Promotion table's triggers actually fire —
  this file declares them unfireable without a count. *Gate:* a migration
  proposal arrives with its trigger evidence and named second consumer
  attached, without a human going looking. *Refuted if:* two more films ship
  and nothing recurs or blocks — then the residue is residue and the line
  already sits right.
- **REP6 — long term, VISION-gated.** The physics bake as the derived-data
  tier's first large occupant (under the proposal's red lines);
  presentation-time separation; `state` widening by named parameters. Not
  scheduled — it is what the boundary was drawn to survive.

## Examples policy (decided 2026-07-23, measured on a live install)

> **SUPERSEDED TWICE — this section is the 2026-07-23 record, not current
> policy.** Option E (2026-08-04, `examples-placement.md`) moved the corpus
> out of the plugin; the owner's 2026-08-05 call (0.21.0) went further:
> **the plugin ships NO films at all.** Every film lives in `scenes/` as
> the maintainer's calibration corpus; the skill teaches through
> references, templates and tested snippets only. The paragraphs below are
> kept as the reasoning of their day — the shallow-clone/cache mechanics
> they measured are still true; the conclusion they drew from them is not
> the policy. `examples-placement.md`'s decision block carries the whole
> arc and is the thing to read before touching any of this.

Examples stay in the plugin dirs. The mechanics, verified on this machine:
`/plugin marketplace add` shallow-clones the ENTIRE repo regardless of which
plugin the user wants; `/plugin install` then copies just that plugin's
subtree — examples included — into a per-version cache. (Re-measured 2026-07-25 by byte-summing `git ls-files`: **7.9 MB tracked in
total, a 5.8 MB plugin subtree of which 5.5 MB is examples** — the method matters, <!--count-mention-->
since `du` block-sums differ at this precision. The earlier figures, 9.6/5.9/5.5,
were taken right after the repo split and carried neither date nor method. The original measurement was taken in the predecessor's
multi-plugin marketplace at ~18 MB; the ratio is what carried, not the figure.) So yes, examples ship; and no, it does not matter
for the concern that would actually bite: the Agent Skills spec loads ONLY
SKILL.md into context — `examples/` never auto-loads, so films are pure disk
weight, zero ambient-context cost. Moving them out would break what they pay
for: SKILL.md teaches by pointing at in-tree baselines, READMEs embed the
AVIFs by relative path, and recordings.md's own doctrine forbids the LFS
workaround (raw serves pointer files, breaking embeds).

Amended same day after owner pushback, and the amendment is better: the
teaching HTML files stay in-plugin (bundled — self-containment is doctrinal
and there is genuinely no way around embedding three without reopening the
shipped-broken-example class), but **rendered AVIF previews live outside every
plugin subtree** — in this repo, `site/posters/`, which is also what the
showcase site serves, so there is one copy rather than two. They are
human-browsing artifacts with zero skill value (Claude never reads them;
only the HTML teaches). Examples READMEs embed them by relative path
(GitHub resolves across the tree), the per-version install cache stops
duplicating them, and no release-asset uploads are ever needed. The one
rule: SKILL.md must never cite anything outside the plugin subtree — the
install cache lacks `docs/`, so such pointers dangle for installed users.
Remaining disciplines: ship only examples something cites; cap AVIF encodes
near the ~0.3–1 MB band (the frozen skill's 2.3 MB pelican outlier is the
cautionary case). Related measured note: always-loaded SKILL.md size is the
real ambient cost (the frozen skill's is ~6.8K tokens, over the spec's <5K
guidance) — mitate's SKILL.md stays lean by policy.

Amended 2026-07-23 (owner directive, clarified same day): the gate is
**owner approval, not rendering**. Nothing enters `examples/` until the
owner has seen it and approved it; test and interim scenes (and any interim
renders) live under gitignored `internal/` until promoted. But **once a
scene IS tracked in `examples/`, the preview set is mandatory and
consistent**: an AVIF in `site/posters/`, embedded in the examples README so it
renders on GitHub, alongside a link to the `.html` and a description of what the
example showcases, plus a `-still.jpg` rendered frame-exact from source
(`build.js poster`). Both come **from the scene**, never from each other — no
still pulled out of a compressed loop.

Amended 2026-07-24, and the amendment is the interesting part. The showcase site
briefly shipped a third preview tier (h264 clips at 1280/30fps) to escape the
AVIF's 720/12fps ceiling, then deleted it: **on a page we control the right
preview is the scene itself.** Brotli takes a scene HTML to ~255 KB where its own
mp4 was 559–1626 KB, so the artifact is cheaper than a lossy recording of it, and
the thumbnail and the lightbox become the same cached URL. The whole
compressed-loop argument (now `references/recordings.md`) was only ever scoped to
GitHub's refusal to render mp4 or run `<script>`, and that constraint does not
travel. The AVIF stays because the README genuinely needs it; the mp4 tier does
not exist. Live scenes mount lazily and unmount on scroll-out (peak of two
contexts, measured), gated off weak devices and reduced motion, where the still
is both the correct experience and the cheapest one. The examples README also
carries a standing callout above the listing: the AVIF is to the film what
a thumbnail is to a full image (720px/12fps/inline budget) — the HTML is
the artifact. The HTML remains the full-quality deliverable; the AVIF
exists so a browser of the repo can see the films without cloning.

## Promotion: what enters the skill, and in what form

The architecture section above splits the **runtime** — kernel, driver,
contract, tooling. This is the other axis: what a scene may hand *back* to the
skill, and what accepting it costs.

Four rules already governed this and lived in four places, two of them only in
[predecessor-record.md](predecessor-record.md), which reads as history rather
than as a live rule set — so they were unreachable at the moment anyone needed
them. Consolidated here.

**The insight that was missing, and the reason the rules felt inconsistent: the
promotion trigger scales with the cost of the form.** "At a third consumer" was
always a rule about *code*; applied to an idea it is far too strict, and applied
to a new fence it is barely strict enough. One trigger for four costs is the
defect.

### The layers

| layer | what lives there | how it is proven | trigger to promote |
|---|---|---|---|
| **contract** | the `window.*` exports | a tool consumes it | a tool would otherwise parse scene internals |
| **primitive** | pure functions of their arguments — `ramp`, `pulse`, noise, hashes, `solveLimb` | chart-first, byte-compared per backend | a second scene needs the same function |
| **kit** | the fenced blocks, material packs, the character scaffold | a showcase scene | **third consumer** — "at a third consumer, extract or marker-fence it" |
| **vocabulary** | the declarative tables and their semantics — `BEATS`, `SHOTS`, `SIZES`, `STYLE`, `SUBJECTS` | a film that wants it | a film is blocked expressing something the tables cannot say, **or is reliably wrong in a way the tables invite** — the earn-in escape below, generalised, because the declared-extents case (ledger row at 6) blocked no film and fired no trigger as this row was first written |
| **craft** | `method.md`, `film-language.md`, `characters.md` — rules, failure modes, idioms | a worked instance with evidence | the **second** time a scene solves the same problem better |
| **the film** | — | — | never promotes; see Anti-template below |

### The cost table, which sets the trigger

| form | cost to accept | trigger |
|---|---|---|
| a rule or named failure mode in a reference | one paragraph | second instance |
| a worked example cited from a reference | nothing newly tracked | first instance worth citing |
| a vocabulary entry | an edge in the dependency graph, plus a validator case | a film blocked without it, or reliably wrong without it |
| a primitive in `KERNEL` | a chart, plus the parity surface | second consumer, chart-proven |
| a new fenced block, or a new fence | every carrier + cross-directory parity + version cascade — a cost that falls when REP1's emitter gate is green | third consumer |
| an instrument | a bracket fired both ways, plus a row in `instruments.md` | earn-in: a film blocked, **or** a third recorded instance of the same wrong answer |
| **a pointer carried by an instrument** — routing, not content | a message change on a failure path, plus a red-first arm proving the pointer appears **without the verdict moving** | a reference measured unopened at the moment it was needed |

**Why the last row exists, and it was the cheapest row to be missing.** Every
other form above changes what the skill *says*. That one changes *when a reader
meets it*, and until 2026-08-07 the plan had no way to express the difference —
so a reference nobody opened looked like an editorial problem and invited a
rewrite that would have fixed nothing. First instance landed at 0.26.0: both
determinism verdicts carry the `webgpu-stack.md` pointer with its section
named, and `templates/bracket-readback.js` holds the red-first arm — the
pointer observed absent against the pre-change tree, present after, verdict
polarity unmoved.

The measurement that forced it: across the three installed-plugin builds, every
reference read landed in an opening window of 1.1, 3.5 and 6.6 minutes against
sessions of 178.6, 142.0 and 107.8. **Not one reference was opened mid-build in
any of them.** So `SKILL.md`'s routing table cannot function as a table — it
sits at the bottom of a document absorbed once at activation and asks to be
consulted at a moment when nothing is being consulted. The references sort by
*when* they are needed, and the open rates follow the sort exactly: **prelude**
(method, bibles, characters, materials, film-language) at 3/4–4/4, and
**situated** (instruments, webgpu-stack, delivery, recordings) at 0/4–2/4 —
while every build exported an MP4 and three hit determinism failures.
Measured cost: ~53 minutes across three builds rebuilding what one unopened
file documents. Evidence and per-file rates:
`docs/scene-analyses/2026-08-07_turtle-pair-and-v2v.md`.

The trigger is deliberately a *measurement*, not a hunch — "unopened at the
moment it was needed" is a fact a transcript can settle
(`/analyze-build-session`), and without that discipline this row becomes
licence to sprinkle documentation pointers through every message the tools
print. The red-first condition is the other half: a pointer that moves a
verdict is a check change wearing a routing costume, and goes through
`controls.md`'s door as one.

### Promotion is not code transfer

What comes back from a scene is rarely a function. It may be an idea, a staging
pattern, a design decision, or several at once — and the job is to grade it into
the **cheapest form that carries the finding**, not to move code. Worked
examples, all from the 2026-07-25 long film:

- *"Let the subject exit the frame and pick them up already moving at the top of
  the next beat"* → a **craft rule**, one paragraph. No code.
- A scale-gate incantation appearing in **two different spellings** across the
  corpus (`Math.max(1e-4,…)` and `clamp(sc,.001,1)`) → a **kit helper**, because
  two spellings of one idea is drift, not reuse.
- A procedural glyph alphabet → a **primitive**, so it lands chart-first: a grid
  of all 36 glyphs byte-compared per backend, before any film uses it. Its three
  bugs were each one letter built on a wrong assumption, which a grid exposes at
  a glance and a title card cannot.
- Hand-declared subject extents wrong three times out of five, while the one
  framed from measured `rig.height`/`centerX` was right first try → not code at
  all: **evidence for a vocabulary change**, measured extents replacing declared.
  **Decided 2026-08-02** ([`representation.md`](representation.md) point 4), and
  the adopted mechanism is narrower than this line's "replacing": the base
  extent derives from construction, and hand adjustment survives — as a named
  intent term, never a bare number. Implementation is REP4, red-first on the
  corpus fixture.
- Multi-station travel legs → **nothing yet**. Register-specific to the presenter
  explainer, which is one commission rather than a committed register. Deferred
  with its trigger recorded.

### The inverse question, which is the more dangerous one

The table above asks *did this earn its layer*. The reverse matters more, because
it is where the corpus decays: **an agent will copy a pattern out of an example
scene, because that is the fastest path and the reward is immediate — the copy
works and smoke goes green, while promoting it costs a chart or three carriers
or a cascade.** Local reward favours copying every time.

The design invited it until 0.21.0: `SKILL.md` and the shipped examples README
both indexed by *film*, so an agent needing a technique had one move: open a
scene and read it. The plugin now ships no films at all — the corpus lives in
`scenes/`, repo-side only — which removes the shipped copy path but not the
underlying pressure: no rule tells a repo-side reader that **unfenced code in a
corpus film is that film's private solution rather than sanctioned practice** —
the fences mark what is shared; nothing marks what is not. Left alone this yields individually good
scenes that each paid full price for the same thing, with no way to answer where
a pattern came from or how many times it has been rebuilt.

Two consequences:

> **Reading an example scene to learn a technique is a bug report against the
> references.** Examples demonstrate finished films; references teach patterns.
> Needing the former to get the latter means a reference is missing something.

> **Every trigger in the cost table above is unfireable without a count.**
> "Second instance" and "third consumer" presume someone is counting, and nobody
> was — the same defect earn-in had, whose "a film was blocked" bar could not fire
> for a shape that is *not blocked, reliably wrong*. The count lives in
> [pattern-ledger.md](pattern-ledger.md), fed by the film field reports that
> already name what each film built twice.

The ledger's two entries at **6** are the proof: contact-measurement and declared
extents were both far past every trigger here, both had a fix specified, and both
were still unbuilt — one with a shipped code comment claiming the check existed.
(Declared extents: landed — REP4, 0.28.0, the MET record above.)

### Provenance is required

Git makes the claim checkable, so make it. A promotion **names the scene it came
from and what that scene did better**, in the commit message and in the
CHANGELOG entry. "Several scenes do this" is not provenance; a commit range is.
This is the same rule [source-of-truth.md](source-of-truth.md) applies to
measured numbers — a thing that arrives without its origin gets trusted past its
warrant — and the reason to enforce it here is that a promotion is permanent
while the reasoning behind it is not.

One consequence worth stating: **this section is maintainer-facing and lives in
`docs/`, which SKILL.md may never cite** (invariant 3). An author working from an
installed plugin cannot be routed here, and should not need to be — their job is
to *report* candidates, not to grade them. The film field report convention
(defined in pattern-ledger.md) already does that: the 2026-07-25 report named
everything its author built twice, which is exactly the input this section
consumes.

## Anti-template principle

The recurring user fear to design against: tools so constrained they become
WordPress themes. The rule, stated once here and enforced in review: **the
skill ships contracts, kits, and vocabularies — never finished scenes.**

**The line is between a PRESET and a TECHNIQUE, and it reads as being about
specificity when it is not.** "A factory-floor scene preset" is declined. "How a
cutaway reads — anything inside the slab is invisible, so cavities must sit proud
of the front face" is craft, and belongs in a reference exactly the way shot
sizes and cut grammar do in `film-language.md`. Cinematography vocabulary is
specific too, and nobody calls `SIZES` a preset. A recipe organised **by shape
problem rather than by subject** is on the technique side by construction, since
the same geometry then serves unrelated domains. (Owner's call, 2026-07-30, on
promoting the predecessor's procedural cookbook into `materials.md`.)

A
style bible constrains *how* things look, not *what* is in the scene; the
character scaffold parameterizes *any* figure rather than shipping five
mascots; the film-language reference teaches shot grammar, not shot lists.
The test is always "could the user ask for something we did not anticipate and
have the pieces compose?" — the portfolio's text-invented `boss-intro`
creature exists to keep that test honest.

## Risks

- **Uncanny valley creep.** The stylized bar is a defense; the risk is drift
  toward realism one "just slightly more real" decision at a time. The bible
  system is the control: realism level is a bible property, reviewed there.
- **Instrument recalibration is real work.** Every measured bracket is
  per-backend. Budget it in Phase 0-1 rather than discovering it per-film.
- **Platform flag matrix.** WebGPU headless behavior differs by OS and
  Chromium build; the recorder owns a tested per-platform policy and smoke
  proves the black-frame catch on every platform the repo ships from.
- **Scaffold authoring cost.** The character data must be generated by
  committed build tooling, authored once — if it turns into per-character
  hand-authoring, the policy has silently become an asset pipeline.
- **Scope creep toward a game engine.** *(Framing superseded by
[`VISION.md`](../VISION.md), 2026-07-30: the destination is the engine and its
primitives, with films as how they get proven. This entry is still right about
the failure it names — building game-shaped features nobody asked for — and the
driver split is still the fence. It was wrong to describe the goal.)* The driver split is the fence:
  mitate ships films; interactivity is one spike behind a gate, and
  engine-shaped features (game state, audio mixing) are non-goals until Phase 6
  reopens the question. **Amended 2026-07-25 (owner-approved):** the fence is
  *who owns the state stream*, not film-versus-interactive. Viewer chrome that
  bounds a viewing parameter — framing, captions, transport — while the timeline
  driver still owns `t` is a delivery feature and is admitted; an input driver
  that *replaces* the state stream is Phase 6 and stays behind its gate. The
  recorder arms neither, so neither can reach a shipped frame. Rationale and the
  evidence that forced it are in the Phase 6 entry above.
- **The three pin is now load-bearing beyond the API surface.** `seekTo`
  ticks `renderer._nodes.nodeFrame.update()` (private API) to defeat the
  shadow frameId guard. The upgrade ritual for any pin bump, in order: grep
  the new build for `nodeFrame`; run the full smoke matrix (fallback, metal,
  swiftshader-must-fail); re-run the bloom/exposure brackets if the post
  implementation changed. An upgrade that skips the ritual inherits Phase
  0's bugs with none of its instruments proven against the new build.

## Non-goals

- Photoreal humans.
- Runtime physics integration, runtime asset fetching, CDN anything.
- Editing existing video files, screen recordings, slide decks (unchanged
  from explainer-video).
- Audio: inherits the designed-but-unwired status; revisit after Phase 5.

## Appendix: external shader sources — portability and license reality

Internal reference only — deliberately NOT shipped with the plugin, and
shipped files carry no source annotations; the ledger below is the record.
The TSL third-party ecosystem is thin by design, so most looks get
hand-ported from published work; this map is where a port starts, and the
license check happens before the port.

**Classification rule.** Transliterated code inherits the source license —
record it in the ledger below.
Re-implementing an algorithm from a paper or article is not a license
event; a citation is traceability courtesy, nothing more. Runtime vs bake:
a noise function belongs in the node graph (runtime determinism rules do
not bend); anything iterative or stochastic — integrators, verlet,
relaxation, GI solves — belongs in the Phase 4 bake, seeded and pinned,
because its output ships as data.

**Port freely (permissive):**
- iquilezles.org (Inigo Quilez) — MIT article snippets. Cosine palettes,
  fbm/domain warping, smooth-min, the 2D SDF zoo.
- three.js source + `webgpu_*` examples — MIT. The TSL idiom cookbook.
- "Hash Without Sine" (Dave Hoskins, shadertoy 4djSRW) — MIT. The hash for
  custom lattices; no trig, no large intermediates.
- Google Filament PBR docs — Apache 2.0. Charlie sheen, cloth BRDF, skin
  SSS survey. Penner "Pre-Integrated Skin Shading" (SIGGRAPH 2011),
  Kajiya-Kay, GPU Gems fur — papers, cite on re-implementation.
- tsl-textures (boytchev) — MIT. Vendor per-generator, pin the commit.
- pmndrs/postprocessing — zlib. WebGL-bound code; pass-merging and
  dithering ideas transfer.

**Ideas only (no code copying):**
- lygia — Prosperity license (non-commercial). Use as an index; follow its
  headers to the permissive original and port from there.
- Shadertoy — default CC BY-NC-SA; check each shader's own header.
- Theatre.js — never embed (stateful runtime editor vs pure-f(t) and
  self-containment); its authoring ideas are free.
- Aggregator directories (threejsresources.com etc.) — index only;
  evaluate license and quality at each linked item's own source.

**Ledger of ports in shipped scenes:**

| Where | What | Source | License |
|---|---|---|---|
| 3D template + packs | MaterialX noise nodes (via `three/tsl`) | MaterialX, shipped in three | Apache 2.0 |
| `CHARACTER` fence (`addFur`) | Shell fur | GPU Gems "Fur — Fins and Shells" (idea) | citation |
| fabric recipe | Sheen via `sheenNode` | three.js / Filament lineage | MIT / Apache 2.0 |
| `scenes/noise-chart.html` | `hws12` hash + value noise | Dave Hoskins, Hash Without Sine | MIT |
| `scenes/noise-chart.html` | Cosine gradient palette | iquilezles.org/articles/palettes | MIT |
| `scenes/noise-chart.html` | Domain-warped fbm (algorithm) | iquilezles.org/articles/warp (idea) | citation |
