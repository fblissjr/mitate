# mitate

last updated: 2026-07-24

Turn any input — a document, a codebase, a mechanism, a joke — into a
deterministic animated scene of any register: an explainer, a game cutscene, a
meme, a character short. Delivered as a self-contained HTML page, a frame-exact
MP4, or an animated WebP/AVIF that plays inline in a README. Built on the
three.js node stack: `WebGPURenderer` with transparent WebGL2 fallback, TSL node
materials, and MaterialX procedural noise — zero assets, one file per scene.

*mitate* (見立て): to see one thing as another — the Japanese aesthetic of
representing one thing through another. Here, seeing any input as a scene.

The founding plan, architecture, and phase gates: [`docs/plan.md`](../docs/plan.md)
in this repo.

## Installation

```
/plugin marketplace add fblissjr/mitate
/plugin install mitate@mitate
```

## Skills

| Skill | Description |
|---|---|
| `mitate` | The full pipeline: spec -> scaffold -> three-axis review -> smoke gate -> delivery, on two backends (three.js node stack 3D, Canvas2D 2D) under one window contract |

## Requirements

**WebGPU is NOT required.** Scenes use three.js `WebGPURenderer`, which falls
back to its WebGL2 backend transparently when no WebGPU adapter exists — any
WebGL2-capable browser plays a scene, and the recorder's default headless path
is the WebGL2 fallback (CI-safe, no GPU needed). Hardware WebGPU is an opt-in
speedup for the recorder only (`WEBGPU=metal` on macOS, measured ~2.3x
faster); see `references/webgpu-stack.md` for the flag policy.

Tooling: `bun`, `three@0.185.1` + `playwright-core@1.61.1` (pinned), ffmpeg
on PATH; `avifenc` (libavif) for AVIF loops, `img2webp` (webp) for WebP loops.

## Invocation examples

- "Make a 30-second video of how our approval process flows"
- "Animate a boss-intro cutscene for this creature: ..."
- "Turn docs/data-flywheel.md into an explainer"
- "Make this joke an animated meme"

## Status

Phases 0 (foundation) and 1 (regression, post, shading) are complete:
templates, recorder, and instruments on the node stack, gated green on both
backends; the `gearbox` regression film judged no worse than its
frozen-predecessor twin; the cel/SSS/glass material packs verified under
byte-determinism; style bibles v2 with the committed `workshop`/`neon`
control pair. Phase 2 (the character scaffold) is demonstrated: one
parametric skeleton family with two-bone IK, planted gait, neck/tail
chains, and fur/fabric packs — `examples/menagerie.html` walks a bear, a
human, and an invented creature from one `buildCharacter`, squint-distinct
and strip-checked — and its film deliverable shipped:
`examples/bear-and-bees.html`, a comedy short whose pause-then-fast timing
carries the register half of the gate. **Phase 2 is complete.** A chart
tier now sits below the films: `examples/noise-chart.html` isolates shader
primitives one cell at a time (with a deliberate drift control), and new
primitives land there before any film uses them. Next up by
owner priority: Phase 4, the physics bake (bake-time simulation, runtime
determinism intact — see [`docs/physics-bake-proposal.md`](../docs/physics-bake-proposal.md)).
Later phases (the human face rig, registers, the interactive spike) land as
they pass their gates.

## Provenance

mitate began as `screenwright` in the `fb-claude-skills` marketplace, itself
the successor to that repo's `explainer-video` skill (now frozen, published,
bugfix-only). The name changed on a real collision: an actively-maintained
npm package and Claude Code skill in the same domain already holds
"screenwright". Version history from 0.1.0 carries forward unbroken in
[`CHANGELOG.md`](../CHANGELOG.md).
