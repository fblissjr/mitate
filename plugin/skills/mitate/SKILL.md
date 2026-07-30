---
name: mitate
description: >
  Create deterministic animated films of any register — an explainer, a game
  cutscene, a meme, a character short — as a self-contained looping HTML page (and able to be exported to MP4/AVIF/WebP).
  Use when asked to "make a video / animation / cutscene / walkthrough / explainer /
  simulation / movie / animated meme" of anything: a mechanism, a story beat, a
  system, an organism, a joke, a document, an image or screenshot, an
  existing video re-staged from scratch. mitate (見立て) is to see one thing
  as another — here, seeing any input as a scene. Built on the three.js node
  stack — WebGPURenderer with transparent WebGL2 fallback, TSL node materials,
  MaterialX procedural noise, zero assets — plus a Canvas2D flat-vector
  backend, on one shared contract: the film is a pure function of time t, so
  one scene file drives the live HTML loop and the frame-exact render alike.
  What that costs, so it is known before invoking rather than after: films are
  SHORT (beats run 3-4s, shipped examples 12-21s) and SILENT (no narration, no
  audio track; MP4 is merely the one container that could carry one), and every
  input is RE-AUTHORED as procedural geometry — there is no import path for an
  image, a document, a video, or any asset, which is what "re-staged from
  scratch" means literally.
  Do NOT use for editing existing video files, screen recordings, or slide
  decks.
---

# mitate

> **Provenance.** Canonical for routing and workflow order. Verified 2026-07-30
> against `templates/` and `references/`.

**What it makes:** one self-contained HTML file that plays an animated scene in
any browser, and renders frame-exact to MP4, AVIF or WebP. No player, no build
step, no assets — the geometry is drawn live from code on every frame.

**What it cannot do**, so you do not promise it: films are **short** (12-21s
shipped) and **silent**. Every input is **re-authored as procedural geometry** —
there is no import path for an image, a video, a logo or any asset. It will not
edit an existing video, a screen recording or a slide deck. It is stylised by
construction and cannot be photoreal.

**The one rule everything rests on:** the film is a pure function of `t`. No
state across frames, no `Math.random()` at runtime, no wall-clock. That is what
makes one file both the live page and the source of an exact render — and what
makes a regression byte-detectable.

The register — explainer, cutscene, meme, character short — changes the geometry,
the pacing and the caption voice. It never changes the contract or the method.

**Read `references/method.md` before building.** It is the only reference that is
a prerequisite rather than a lookup; the rest are cited below at the step that
needs them.

## Workflow

### 1. Spec, before any code

Topic, audience, duration, `FRAME` (aspect + px — vertical and square are one
edit), register, style, subtitles on/off, and the **beats table**: named beats
with durations that accumulate. Nothing downstream holds a timestamp, so
retiming a beat is a one-line edit. Every beat needs geometry, not just a
caption. Vary durations. Budget the content window, not the beat.

Choosing the look is a spec decision, not a later one — read
`references/bibles.md` now. A style bible is the whole look as ONE object
switched by one line; reaching for a loose palette constant instead is how a film
ends up unable to swap bibles.

### 2. Scaffold

| template | use when | needs `vendor` |
|---|---|---|
| `scene.template.html` | 3D, no figures | yes |
| `scene.character.template.html` | 3D **with figures** — adds the character kit (`references/characters.md`) | yes |
| `scene2d.template.html` | flat vector, Canvas2D | no, born self-contained |

```bash
cp "${CLAUDE_SKILL_DIR}"/templates/{scene.template.html,shoot.js,build.js,smoke.js,backend.js} .
mv scene.template.html <name>.html
bun add three@0.185.1 playwright-core@1.61.1
bun run build.js vendor <name>.html
```

`vendor` embeds three into the scene. Every `build.js` command re-embeds
automatically, so skipping it is recoverable there — but a direct `shoot.js` run
is not, and fails with *"scene never set window.sceneReady"*.

All three templates run as-is and carry the same contract and deterministic kit
(`ramp`, `pulse`, `latch`, `warp`, the seeded `R[]` pool). **Do not rename any
`window.*` export.** `smoke.js` hard-asserts four — `seekTo`, `DURATION`,
`stopPlayback`, `sceneReady` — and reads the rest behind fallbacks, so renaming
one of those degrades checks instead of failing them. `references/glossary.md`
defines the tiering.

### 3. Author the film

Replace the marked sections: `buildWorlds()` for geometry, `animate(t)` for
per-beat motion with every property a function of `t`, and in 3D scenes
`SUBJECTS` and `SHOTS` — where the camera is authored, and where the `h`/`w`
declarations that decide every crop are easiest to get wrong. Left at their
placeholders, the camera frames the template's demo, not your film.

- `references/film-language.md` before authoring `SUBJECTS`/`SHOTS` — sizes,
  cuts, the match constraint, focus, camera energy.
- `references/materials.md` before any surface beyond flat colour — the toon,
  subsurface and glass packs, and what does and does not bloom.

### 4. Review, on three axes

```bash
bun run build.js sheet <name>.html                # one frame per beat
bun run build.js sheet <name>.html 480 0.6 nocap  # captions hidden — the semantics pass
bun run build.js strip <name>.html <t0> <t1>      # consecutive frames — continuity
bun run build.js aspect <name>.html 8.5           # one moment, four window shapes
bun run build.js probe <name>.html "beatAt('hit',.5)" 'sep(a, b)'
```

**Delegate this to the `film-reviewer` agent**, which ships beside this skill. It
runs the instruments, reads the images, and reports on all three axes with the
evidence behind each finding.

**Read the generated images with the Read tool — a filename is not a review.**
Composition fails within a frame; continuity fails between frames; semantics
fails when every frame is fine and the film explains nothing. Budget 3-4 rounds
for composition; the other two axes need their own passes.

**Never judge a contact from an image.** Two things that must touch and do not is
the most repeated defect in this project's history, and a camera angle fakes it
routinely. `probe` reports the gap on all three axes, negative meaning overlap;
one recorded miss had an x-overlap of -1.66 and a y-overlap of 0.01 and arced
cleanly over its target. `references/instruments.md` owns what a green check can
and cannot see — the question to ask before trusting one.

### 5. Smoke-test the contract

```bash
bun run smoke.js                     # all scenes in the directory
```

Checks that each scene loads clean, exposes the contract, is byte-deterministic
at the same `t` **and across a reload**, actually plays without `?record=1`,
ships a non-empty frame, and that fenced blocks are byte-identical across scenes.
Run it before any full shoot. `--parity-only` is the no-browser subset.

### 6. Deliver

```bash
bun run build.js all    <name>.html        # bundle -> frames -> mp4
bun run build.js loop   <name>.html 12 720 # .webp — inline in a README
bun run build.js avif   <name>.html 12 720 # .avif — smaller, decode-heavier
bun run build.js poster <name>.html 7.2    # .jpg still
```

Four peer formats: the **HTML scene itself** (Pages or an Artifact — github.com
strips `<script>`), **MP4** (the only one that could carry audio; attach to an
issue for a player), **WebP** (held camera), **AVIF** (moving camera, small).
Choose at spec time: WebP costs per pixel changed, so it constrains the camera —
set `CONFIG.sway = 0` before shooting one. Whatever ships, the scene file stays
the single source. `references/delivery.md` owns the tradeoffs.

## Rules that silently break a film

Not style — each was measured, and each fails quietly rather than loudly.

- **Time reaches shaders only through the `uTime` uniform** the template
  declares. Never import the TSL `time` node; it wall-clocks.
- **Four load-bearing lines**: `nodeFrame.update()` in `seekTo`, `compileAsync`
  in the boot block, `renderer.sortObjects = false`, and `frustumCulled = false`
  in `mesh()`. Do not simplify them away. Because drawing is unsorted, create
  overlapping transparent objects **farther-first**.
- **No temporal post passes, no `ComputeNode`, no storage buffers** — all carry
  state across frames.
- **Fenced blocks are byte-identical across every scene that carries them**
  (`KERNEL`, and in 3D also `SOLVER`/`RIG`/`DRIVER`/`HTML`, plus `CHARACTER`).
  Edit a fence in all of them or in none.
- **One scene = one file.** three is embedded, never a CDN, never a sibling
  `.js`, never `type="module"` — module imports are CORS-blocked over `file://`,
  and opening the file from disk is the point.

## Environment

Pinned: `three@0.185.1`, `playwright-core@1.61.1`, ffmpeg on PATH, bun.

`playwright-core` ships **no browser** — run `bunx playwright install chromium`
before the first render, or set `CHROMIUM_PATH`. `loop` and `avif` each need an
external encoder; both probe for theirs and print the install command before
shooting a frame.

**Backend:** with no env vars you get the WebGL2 fallback, which is universal and
CI-safe. `WEBGPU=metal` opts into macOS hardware and is measurably faster.
Frames are **not** byte-identical across backends, so pin the backend on both
sides of any comparison. Never hand-roll WebGPU Chromium flags: the wrong
combination ships flat frames and exits 0. In particular `WEBGPU=swiftshader`
renders pure black, silently — `shoot.js` refuses it outright.
`ANGLE_BACKEND` selects the GL backend on the fallback path.
`references/webgpu-stack.md` owns all of it.

## References

Cited above at the step that needs them. In full:

| file | read it when |
|---|---|
| `method.md` | **before building anything** — the failure axes and the discipline |
| `glossary.md` | a term is doing more work than it looks like |
| `film-language.md` | authoring `SUBJECTS` and `SHOTS` |
| `bibles.md` | choosing the look, at spec time |
| `materials.md` | authoring any surface beyond flat colour |
| `characters.md` | the film has figures |
| `webgpu-stack.md` | anything about backends, determinism or the recorder |
| `instruments.md` | deciding whether a green check means anything |
| `delivery.md` | choosing a delivery format |

## Examples

| file | what it demonstrates |
|---|---|
| `gearbox.html` | the baseline film, and the committed `workshop`/`neon` bible pair |
| `menagerie.html` | three creatures from one `buildCharacter` — bear, human, invented strider |
| `bear-and-bees.html` | comedic timing; the gag reads with no captions |
| `materials.html` | the cel, subsurface and glass packs in one film |
| `noise-chart.html` | the chart tier — one primitive per cell. New shader primitives land here before any film uses them |
