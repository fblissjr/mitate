last updated: 2026-11-08

# Why this exists, and why in this order

`CLAUDE.md` has the rules. [`docs/plan.md`](docs/plan.md) has the architecture,
the SQLite soundstage schema, the Metal engine design, and the phase gates. This
file has the one thing neither of them says: **why determinism comes first**,
what it is first *for*, and **why `mitate` v2 moves from single-file HTML/JS to
a relational SQLite soundstage (`shot.db`) + native Apple Silicon Metal**.

It is short on purpose. If it grows into a summary of the plan, delete the
summary. Where it gestures at something, the file that owns it is linked:
[`docs/addressing.md`](docs/addressing.md) for `t`,
[`docs/physics-bake-proposal.md`](docs/physics-bake-proposal.md) for what a bake
may and may not do, [`docs/pattern-ledger.md`](docs/pattern-ledger.md) for how
patterns get promoted.

## The goal

An **engine**, its **primitives**, the **abstractions** that let an agent say
what it means instead of how to compute it, the **tooling** that builds and
ships it, and the **harness** that proves all of it — enough that an agent in
Antigravity (`agy`) or Claude Code can turn **any context** into a scene,
reliably.

Not "a tool that makes films." Films are how the engine gets proven: every
film in the corpus demonstrates that a layer works and fails loudly when it
does not.

**And not a template library.** A template is a finished thing you fill in. It
solves one film and rots on the second, because the next film is not that film.
What this is for is the pair of problems a template cannot hold together —
**consistency**, so the same idea is not rebuilt differently in every film, and
**the hand-rolled case**, so a film can still do something nobody anticipated. A
primitive earns its place only if it serves both.

But proving is not the point either. **The point is that the films land** — that
a gag reads without captions, that a contact looks like impact rather than
clipping, that a mechanism becomes obvious in motion when it was opaque in prose.
The three review axes exist because "it renders" and "it works" are different
claims, and the second one is the one anyone cares about. Determinism is what
makes the second claim checkable; it is not a substitute for it.

## Determinism is the instrument, not the point

The easy reading is that purity is a price paid for nice properties — byte
comparison, one artifact serving both preview and final render. True, and far
too small.

**A generator that produces a different result every run cannot be evaluated by
watching it run.** Every observation is of a different object. The only way to
ask "did that do what I intended" is to hold one output still, inspect it, hold
another still, and compare.

So the frozen, reproducible scene *is the measuring device*. Not the thing you
give up something for — the thing that makes any later question answerable at
all. Simulation, physics, interactivity: none of them can be developed against a
system that cannot be held still, because there would be no way to tell a bug
from the intended variety.

That is the ordering. Determinism first, because everything after it is
unfalsifiable otherwise.

**And it does not get outgrown.** Because it is a property of the *mapping*
rather than of the process, adding a generator upstream costs nothing. You do not
graduate past determinism; you keep using it, on the output of each new thing you
add.

### Two claims, and only one is load-bearing

These get conflated, and the conflation is how a useful instrument turns into
dogma.

- **Reproducibility** — the same inputs produce the same scene. This is the
  property. It is what makes evaluation possible, and it does not bend.
- **Byte-identity** — one *technique* for measuring reproducibility, with a
  stated validity scope. `CLAUDE.md` invariant 5 limits it to a single
  backend, because two backends (e.g. Native Metal vs. the WebGPU/WebGL2 HTML
  player) legitimately disagree per pixel.

Where the technique's scope runs out, the claim survives and the measurement
changes. A bake replayed from `baked_tracks` is byte-identical; the same bake
recomputed under a new solver version will not be, and that is not a determinism
failure — it is where a tolerance-shaped oracle becomes the right instrument.

**And it measures the toolmaker, not only the scene** (owner, 2026-08-04):
rebuild the same scene under new tooling and compare — better, worse, cheaper,
slower. That comparison needs "roughly the same" to be checkable, which a bare
pass/fail cannot express; the magnitude guard below is that instrument, and
physics is roughly where "slightly different" becomes legitimate rather than
alarming.

**The guard against dogma is a magnitude.** A check that reports only pass or
fail cannot tell a scene that renders a *different film* from one that moved a
single pixel by a single bit — and treated as equal, the second spends the
credibility the first depends on. A difference must be reported with its size
and its location (`changed_pixels`, `bbox`, `max_channel_delta`, `psnr_db`).
That is also what makes a failure actionable rather than merely alarming.

## `t` is a coordinate; `state` is what a driver emits

`t` is a position, not a clock: an address you evaluate, not a cursor you
advance. Nothing asks what time it is, only what the scene looks like at this
address. Any `t`, any order, any number of times, the same pixels.

Determinism is a property of the **mapping** from state to pixels — not of the
process that produced the mapping. That distinction is what makes the rest
reachable:

| driver | emits | the test |
|---|---|---|
| timeline (`beats` + `cue_sheet`) | `StageClock(t)` | same state twice → same pixels |
| a recorded bake (`mitate bake`) | `StageClock(t) + baked_tracks` | unchanged |
| a viewer / ortho scout (`quad`) | `StageClock(t) + view` | unchanged |
| an input driver | `StageClock(t, events)` | unchanged |

A simulation is a **generator of mappings**. Each run produces one. Recording
(`mitate bake`) freezes one into `baked_tracks`. Once frozen it is an ordinary
scene, and the whole instrument stack (`quad`, `sheet`, `strip`, `probe`,
`smoke`) applies to it unmodified. That is the bridge, and `t` is the interface
it hands back.

**Temporal accumulation is the enemy of random-access `t`.** Any rendering
technique that carries history buffers across frames (`MTLFXTemporalScaler`,
temporal irradiance caches, unbaked step-integrated `state_buffers`) makes frame
`t` depend on which frames were rendered before it. In `mitate` v2, evaluation at
`t` is strictly single-frame deterministic: spatial-only upscaling, single-frame
AOV-guided denoising, and Sobol/PCG3D sequences seeded purely by
`(pixel_xy, sample_idx, random_seed)`.

### `state` is the intermediate layer. The window contract is not.

Worth being exact, because the design depends on the difference.

- **The contract** (`mitate` CLI verbs over `shot.db` on the native path;
  `window.seekTo(t)` / `window.DURATION` / `window.sceneReady()` on the bundled
  HTML path) is an interface *for tools*. It is deliberately thin, and the
  thinness is the whole value: any scene is interchangeable for any other
  because no tool knows a film's private internals.
- **`state` (`StageClock` + evaluated `StageSnapshot`)** is the value the
  evaluator hands the renderer and the `.metal` kernel hooks. It is where
  meaning accumulates.

### Scene position and presentation time are not the same coordinate

Separating them — `t` addresses the scene, and `warp_segments` decides how fast
an observer moves through it — makes slow motion, holds, speed-ups and timelapse
**declarative** instead of authored into the beats. Once anything is simulated or
baked at scene-position resolution, how fast someone watches it cannot change
what happened.

## What we are actually building: declarative layers on a relational stage

Look at what `mitate` builds and the pattern is obvious. You declare intent in
relational tables, and the compiler works out the physical consequences:

| layer | you declare (in `shot.db`) | you do not hand-author |
|---|---|---|
| `beats` | named spans with durations | cumulative timestamps (`t0`, `t1`, `DURATION`) |
| `shots` / `subjects` | `"MCU on the bear at 35°"` | raw camera `(x,y,z)` coordinates or auto-derived bounding boxes |
| `style_bibles` | the look as one row (`active_bible`) | scattered per-material hex literals or exposure tweaks |
| `lamps` / `atmospheres` | photometric lumens, Kelvin, haze density | what is lit, shadow rays, or volumetric god-rays |
| `characters` | a proportion vector + `walk_start_x` | bone hierarchies, 2-bone IK math, or leg keyframes |
| `baked_tracks` (`mitate bake`) | mass, colliders, kinematics kernel + seed | hand-tuned sine waves approximating a bounce or collision |

### Where a declaration lives — why `mitate` v2 is a SQLite Soundstage (`shot.db`)

In `mitate` v1, declarations lived as JavaScript object literals inside a
shipped HTML file, beside 5,704 lines of fenced kit machinery replicated across
every carrier. As this file noted in v1: **"declarative" is a claim about
structure.** If a declaration cannot be read, validated, queried, or rendered
independently of the artifact that embeds it, the claim is about authoring style
instead.

Since v1 was written, two things became clear from watching real agent sessions
in Claude Code and Antigravity (`docs/harness-loop.md`):

1. **Agents are surgical with SQL and clumsy with thousand-line file rewrites.**
   Asking an LLM to tweak a light, retime a beat, or adjust a character's stride
   inside a 1,500-line HTML file burns tokens and risks corrupting adjacent code
   or fence markers. In a relational SQLite database (`shot.db`), that edit is a
   one-line atomic `UPDATE` (`mitate sql shot.db "UPDATE lamps SET lumens=2800
   WHERE actor_id='key'"`), validated immediately by SQLite `CHECK` and
   `FOREIGN KEY` constraints before a single GPU thread launches.
2. **Per-scene JavaScript/Chromium bootstrapping is pure friction.** Installing
   `three` and `playwright-core`, resolving headless Chromium binaries, and
   dodging WebGPU SwiftShader black-frame landmines in every scratch workspace
   taxes every session before it writes a single beat. A single precompiled
   Swift + Metal binary (`mitate`, aliased as `slate`) talking directly to Apple
   Silicon Unified Memory (`MTLStorageModeShared`) and hardware `VideoToolbox`
   renders a 2×2 orthographic + camera scout sheet (`mitate quad`) in ~40ms with
   zero per-scene setup.

Moving the source of truth to `shot.db` completes the arc `VISION.md` started:
- **Zero fence replication**: The engine lives in the compiled binary
  (`MitateCore` + `MitateMetal`), never duplicated across scene files.
- **Pre-render validation by construction**: SQLite constraints + `v_set_lint` +
  `mitate check` validate the entire relational graph in <5ms with no GPU and no
  browser.
- **Auto-derived extents (`auto_bounds`)**: In v1, hand-declared `SUBJECTS`
  extents (`h`/`w`/`d`) were the #1 recurring composition defect because tables
  could not read runtime geometry. In v2, `MitateCore` evaluates the exact 3D
  bounding box of any actor or character rig at `t` directly when `extent_mode =
  'auto_bounds'`.
- **Web delivery stays one command away**: Because `shot.db` is pure structured
  data + closed-form cues + `baked_tracks`, `mitate bundle shot.db --out
  scene.html` still emits a single self-contained HTML file implementing the
  canonical `window.seekTo(t)` contract whenever browser delivery is wanted.

## The shape a primitive has to have

Two failure modes bound the design, and naming them is more useful than naming a
technology.

**A closed vocabulary rots.** If the only expressible things are the rows
someone anticipated in SQLite tables, the first film that needs a custom vortex
swarm, a mirage ray medium, or a procedural iridescent shader either cannot be
made or escapes the system.

**An unstructured one cannot be checked.** Nothing can validate a declaration
that has no shape.

`mitate` v2 solves both with the same rule as v1: **schema where things connect,
code where things are specific.**
- **Schema at the seam**: The SQLite tables (`beats`, `shots`, `subjects`,
  `characters`, `actors`, `props`, `surface_shaders`, `lamps`, `cue_sheet`)
  enforce every structural connection, unit, and foreign key.
- **Code in the leaf**: The `gpu_kernels` table holds agent-authored Metal C++17
  `[[visible]]` functions that JIT-compile in ~25ms into 5 typed
  `MTLVisibleFunctionTable` hook slots (`kinematics`, `ray_medium`,
  `procedural_surface`, `lens_ray`, `finishing_pass`), reading `StageClock` and
  the shared-memory scene heap directly.

## How it gets better: the agent-driven harness loops

An engine that only grows when someone remembers to generalise will not grow.
And an agent skill whose guidance sits in unopened markdown files will not guide.

Across four analyzed cold-start builds in v1, **every reference read happened in
the first 1–6 minutes of the session; not one reference was opened mid-build.**
When an agent hit a determinism bug, a cropped frame, or an exposure blowout at
minute 90, it never went back to read a reference table — it reacted to what the
CLI printed on stdout.

That measurement governs every CLI verb in `mitate` v2:

1. **Situated telemetry on every run.** Every `mitate` render and check command
   (`check`, `quad`, `sheet`, `strip`, `probe`, `smoke`, `shoot`) emits
   structured JSON telemetry to stdout (`meter`, `framing.in_frame_actors`,
   `framing.out_of_frame_actors`, `contacts`, `lint`, and situado pointers to
   the exact command or reference section that fixes a detected issue). The tool
   teaches the agent at the moment of need.
2. **Self-discoverable schema and recipes.** `mitate schema [table]` prints
   compact DDL and copy-pasteable SQL examples; `mitate recipe <name>` prints or
   applies tested SQL patterns (`three-point-lights`, `character-walk`,
   `rack-focus`, `explainer-gears`).
3. **Two flywheels, both active in `agy` and Claude Code:**
   - **In-session review (`film-reviewer`)**: After building a draft `shot.db`
     and checking spatial layout with `mitate quad`, the builder delegates to the
     `film-reviewer` subagent, which runs `mitate sheet` (`0.6`, `0.95`, and
     `--nocap`), `mitate strip`, `mitate probe`, and `mitate smoke` to grade
     **Composition**, **Continuity**, and **Semantics** with measured brackets.
   - **Cold-build transcript loop (`cold-build.sh` + `analyze-build-session`)**:
     Fixed briefs run against lower model/effort tiers, measuring whether the
     floor required to ship a clean film descends over time.

## How to tell if this is working

Not "are there more features." These:

- A change to a scene either matches the last run byte-for-byte (within one
  backend) or it does not, and the difference is *localisable* — reported by
  `mitate smoke` with its changed-pixel count, bounding box, max channel delta,
  and PSNR, not as a bare pass/fail verdict.
- A claim in this repo can be re-derived by running something, not by trusting
  prose.
- A declaration is validated **before a frame is rendered** — at SQL `INSERT` /
  `UPDATE` time via constraints, and in <5ms via `mitate check` (including
  auto-derived actor/character bounding boxes at shot times).
- A new capability reuses the evaluator, the character rig, the shaders, and the
  review instruments **without modification**.
- A film that needs something the SQLite tables cannot say can still be made via
  a 25ms-JIT `gpu_kernels` function or procedural prop, and recurring patterns
  promote cleanly into recipes or schema.
- An agent session in `agy` or Claude Code arriving with no context can discover
  the schema (`mitate schema`), build a `shot.db`, inspect it (`mitate quad` /
  `sheet` / `probe`), pass `mitate smoke`, and ship a film that lands.
