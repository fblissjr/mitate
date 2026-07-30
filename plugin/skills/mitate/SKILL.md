---
name: mitate
description: >
  Create deterministic animated films of any register — an explainer, a game
  cutscene, a meme, a character short — as a self-contained looping HTML page,
  an MP4, or an animated WebP/AVIF that plays inline in a README. Use when
  asked to "make a video / animation / cutscene / walkthrough / explainer /
  motion graphic / animated meme" of anything: a mechanism, a story beat, a
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
metadata:
  last_verified: "2026-07-25"
---

# mitate

One idea powers everything here: **the entire film is a pure function of `t`**.
No simulation state, no `Math.random()` at runtime, no wall-clock dependence.
Any frame renders independently and identically — one scene file is both the
interactive HTML artifact and the source for a frame-exact MP4.

The register — explainer, cutscene, meme, character short — changes the
geometry, the pacing, and the caption voice. It never changes the contract,
the pipeline, or the review method.

## Workflow

The method is inherited from a project that shipped and hardened it; this file
covers the mechanics, `references/method.md` the discipline. Read method.md
before building — it organizes the recurring failure modes by axis with the
fix for each.

### 1. Spec first (data before code)

Write the spec before touching the template: topic, audience, duration,
`FRAME` (aspect + px — vertical and square are one edit), register, style,
subtitles on/off, and the **beats table** — named beats with durations that
accumulate. Nothing downstream holds a timestamp; retiming a beat is a
one-line edit. Every beat needs geometry, not just a caption; vary durations;
budget the content window, not the beat.

### 2. Scaffold

Two templates, one window contract, every tool works on both:

- `scene.template.html` — the 3D node stack: `WebGPURenderer` (WebGL2
  fallback), TSL node materials, shadows, the cinematography solver
  (`SHOTS[]` as data). Needs the vendor step.
- `scene.character.template.html` — the 3D template PLUS the character
  scaffold (`CHARACTER` fence): parametric skeleton family, two-bone IK,
  planted gait, neck/tail chains. Copy THIS when the film has figures;
  see `references/characters.md`.
- `scene2d.template.html` — Canvas2D flat vector. Born self-contained; skip
  `bun add three` and `vendor` entirely.

```bash
cp "${CLAUDE_SKILL_DIR}"/templates/{scene.template.html,shoot.js,build.js,smoke.js,backend.js} .
mv scene.template.html <name>.html
# film has figures? copy scene.character.template.html instead of scene.template.html
bun add three@0.185.1 playwright-core@1.61.1
bun run build.js vendor <name>.html   # EMBEDS three into the scene; leaves no .js
# (skipping this is recoverable for build.js: every build.js command embeds
#  automatically via ensureVendor. Direct shoot.js runs do NOT — an
#  unvendored scene fails there with "scene never set window.sceneReady")
```

All three run as-is (placeholder, 12s; 12.6s for the character template)
and carry the shared contract:
`BEATS`, `CONFIG`/`STYLE`, `FRAME`, the deterministic kit (seeded `R[]` pool,
`ss`, `bump`, easing personalities, `ramp`/`pulse`/`rampS`/`latch`/`warp` —
see method.md), DOM caption/title overlays, and the driver: `window.seekTo(t)`,
`window.DURATION`, `window.stopPlayback()`, `window.sceneReady`,
`window.BEATS`, `window.FRAME`, `window.FLASHES`, `window.CAPFADE`. Do not
rename any of these — smoke hard-asserts only `seekTo`/`DURATION`/
`stopPlayback`/`sceneReady`; the rest are read behind fallbacks and merely
*named* when absent, so a rename degrades checks instead of failing them
(`FLASHES` alone makes the blank-frame check misfire on a clean film).
The 3D templates additionally carry `SUBJECTS[]` and `SHOTS[]` with the
match-cut constraint (the 2D template keeps its simpler `KEYS[]` camera rail)
and export `window.BACKEND` (`'webgpu' | 'webgl2'` — which backend actually
rendered; smoke tags each scene with it, and 2D scenes set none).

Replace the marked sections: `buildWorlds()` (geometry) and `animate(t)`
(per-beat motion, every property a function of `t`) in every template — plus
`SUBJECTS` and `SHOTS` in the 3D ones, where the camera is authored. Leaving
those at their placeholders frames the template's demo geometry, not your
film, and the `h`/`w` declarations that decide every crop are the easiest
thing here to get wrong. Read `references/film-language.md` before authoring
them.

**Node-stack rules (3D scenes)** — full detail in `references/webgpu-stack.md`:

- Time reaches shaders only through the `uTime` uniform the template declares;
  never import the TSL `time` node (it wall-clocks).
- The `seekTo` body's `nodeFrame.update()` tick, the boot block's
  `compileAsync`, `renderer.sortObjects=false`, and `frustumCulled=false` in
  `mesh()` are each load-bearing for determinism — measured, not stylistic;
  do not simplify them away. Consequence of unsorted drawing: create
  overlapping transparent objects farther-first.
- Every scene renders through an always-on `RenderPipeline` (pass-through
  by default — zero look change, but the post path is smoke-checked on every
  scene). Effects are `STYLE` flags: `STYLE.bloom` (`{strength,radius,
  threshold}` — thresholds for the TSL bloom are unmeasured; bracket before
  trusting) and `STYLE.dof` (`{maxBlur}` — focus follows the `SHOTS[]`
  `focus` property, so two adjacent shots differing only in focus, joined by
  `cut:'blend'`, are a rack focus).
- No temporal post passes, no `ComputeNode`, no storage buffers.
- Shared scene blocks are marker-fenced (`KERNEL` in every template, plus
  `SOLVER`/`RIG`/`DRIVER`/`HTML` in 3D scenes and `CHARACTER` in character
  scenes) and smoke
  byte-parity-checks every fence across the scenes it is pointed at: edit a
  fenced block in ALL scenes or in none. `HTML` uses HTML-comment markers
  (it fences the page scaffold outside `<script>`); the rest use JS comments.

### 3. Review on three axes (looking is the method)

```bash
bun run build.js sheet <name>.html            # one frame per beat -> .sheet.jpg + .squint.jpg
bun run build.js sheet <name>.html 480 0.95   # every beat at its END — a standing pass
bun run build.js sheet <name>.html 480 0.6 nocap  # caption pill hidden — the semantics pass
bun run build.js aspect <name>.html 8.5       # one moment, four window shapes
bun run shoot.js <name>.html sample 0,3,7,11  # arbitrary timestamps
bun run build.js probe <name>.html "beatAt('hit',.5)" 'sep(a, b)'  # MEASURE a contact
```

**Delegate the review pass to the `film-reviewer` agent**, which ships beside
this skill. It runs these instruments, reads the images, and reports findings on
all three axes with the bracket behind each one. It caught the defects author
eyes missed on both gate films — a look beat that happened entirely off-frame, a
closeup that was 70% void, a tail wag spiking 5x, a contact faked by a lucky
camera angle. It was built for exactly this moment and was unreachable from an
install until 0.16.32.

**Read the generated images with the Read tool.** A filename is not a review.
**And do not read a contact off an image at all** — two things that must touch is
the most-repeated defect in this project's history, and a camera angle fakes it
routinely. `probe` reports the gap on all three axes (negative means overlap);
one recorded miss had an x-overlap of -1.66 and a y-overlap of 0.01, which no
contact sheet can show. `references/method.md` owns the technique and the
worked instances; `references/instruments.md` owns what a green check can and
cannot see, which is the question to ask before trusting one.
Composition fails within a frame (sheet shows it); continuity fails between
frames (`build.js strip <name>.html <t0> <t1>` for a suspect window); semantics
fails when every frame is fine and the film explains nothing (cover the
captions — the nocap sheet; on a 3D film it hides the DOM title and caption but
no geometry, so mesh-built labels survive it and `references/method.md` owns
the rest). Budget
3-4 look-and-edit rounds for composition;
the other two axes need their own passes.

### 4. Smoke-test the contract

```bash
bun run smoke.js                              # all scenes; add WEBGPU=metal to test that path
bun run build.js motion <name>.html           # per-beat motion profile + dead air
bun run build.js probe  <name>.html <when> 'expr'  # measure the scene's own geometry
```

`smoke.js` checks:

- **loads clean**, and the **contract** is present.
- **deterministic `seekTo`** — the same `t` twice is byte-identical, **and so is
  the same `t` after a page reload**. The reload half is what catches a random
  drawn once at load: pure within a session, a different film every time it opens.
- **plays** — one load *without* `?record=1`. Every other load in the pipeline
  sets it and the rAF loop is gated on its absence, so a film can record
  perfectly and never move for a viewer.
- **ships something** — a caption-stripped cold-page check that catches a backend
  compositing only the clear color, which four other checks passed on before it existed.
- **fence parity** — fires only when two or more scanned scenes share a fence,
  and says so when one does not.

Run before any full shoot. `--parity-only` is the no-browser subset for a
pre-commit hook (`references/instruments.md` owns why not to reimplement it).

### 5. Build and deliver

```bash
bun run build.js all  <name>.html             # bundle -> frames -> mp4
bun run build.js loop <name>.html 12 720      # <fps> <width> -> .webp, inline in a README
bun run build.js avif <name>.html 12 720      # <fps> <width> -> .avif, smaller, decode-heavier
bun run build.js poster <name>.html 7.2       # <t> -> .jpg still + markdown
```

Four peer formats — HTML (the scene itself; Pages or an Artifact, not raw
github.com), MP4 (only format with audio; attach to an issue/PR for a player),
WebP (held camera), AVIF (moving camera, small). Choose at spec time, not
encode time: WebP's cost is per-pixel-changed, so it constrains the camera —
set `CONFIG.sway = 0` before shooting one, and heed the size warning `loop`
prints *before* it shoots rather than after.
Whatever ships, the scene file stays the single source.

## Backend policy (recorder)

No env vars: WebGL2 fallback — universal, CI-safe. `WEBGPU=metal` (macOS
hardware, verified faster — figure and conditions in `references/webgpu-stack.md`) or `WEBGPU=vulkan` (Linux, unverified) to
opt in; `ANGLE_BACKEND` selects the GL backend on the fallback path.
`WEBGPU=swiftshader` is diagnostic-only — shoot refuses it. Frames are not
byte-identical across backends; pin the backend on both sides of any
comparison. Never hand-roll WebGPU Chromium flags: the wrong combination
ships flat frames with exit 0 (`references/webgpu-stack.md`).

## Environment

Pinned: `three@0.185.1`, `playwright-core@1.61.1`, ffmpeg on PATH, bun.

`playwright-core` ships **no browser** — install one before the first render
(`bunx playwright install chromium`, or set `CHROMIUM_PATH`). `loop` and `avif`
each need an external encoder too; both probe for theirs and print the install
command before shooting a frame, and `references/delivery.md` owns which and why.

Two constraints that dictate the setup — do not "simplify" them away:

- **three is vendored and EMBEDDED in the scene** (`build.js vendor` builds an
  IIFE of `three/webgpu` + `three/tsl` + display passes and splices it in;
  ~1 MB per scene, paid once; exact figure in `references/webgpu-stack.md`). Never CDN, never a sibling `.js`, never
  `type="module"`: module imports are CORS-blocked over `file://`, and opening
  the file from disk is the point. A canonical vendor tag is re-embedded in
  place by `ensureVendor` on any `build.js` command; any other external
  reference fails the scene in `smoke.js`.
- **One scene = one file.** No `.bundled.html`, no shipped `three.global.js`.

## Files

- `templates/scene.template.html` — 3D scaffold (node stack)
- `templates/scene.character.template.html` — 3D scaffold + character kit
- `templates/scene2d.template.html` — 2D scaffold (Canvas2D, self-contained)
- `templates/shoot.js` / `templates/build.js` — recorder + pipeline (sheet,
  strip, aspect, motion, loop, avif, poster)
- `templates/smoke.js` — contract, determinism, live-playback, shipped-frame checks + lints
- `templates/bracket-liveplay.js` / `templates/bracket-determinism.js` /
  `templates/bracket-noise.js` — the
  controls for three of smoke's checks: each builds its own broken copies of a
  shipped example and reports which injections fire. `bracket-noise.js` pins the
  WebGL2 fallback path (it clears `WEBGPU`), because the console allow-list it
  brackets is a claim about text nobody controls and it silently matched nothing
  there until 0.16.16. They read that example
  from beside themselves, so leave them in place and invoke from your working
  directory, which supplies `playwright-core`:
  `NODE_PATH="$PWD/node_modules" bun run
  "${CLAUDE_SKILL_DIR}"/templates/bracket-determinism.js`. Run one when a green
  result needs to mean something; a check whose bracket you cannot re-run is a
  claim, not a control
- `templates/backend.js` — shared by shoot.js and smoke.js: Chromium
  resolution, the WEBGPU/ANGLE flag policy, the settle idiom (one copy, so
  the gate and the recorder cannot drift apart)
- `references/method.md` — the universal method: failure axes, beats and
  controls discipline, continuity/semantics review, determinism rules
- `references/film-language.md` — shot vocabulary: sizes, cuts, match
  constraint, focus, camera energy
- `references/webgpu-stack.md` — the node stack: backend policy, async boot,
  the six determinism rules, recorder mechanics, measured brackets
- `references/materials.md` — the material packs: cel (TSL-native banding),
  subsurface (thin/thick split), glass (transmissionNode, ordering
  discipline), bloom observations — read before authoring any surface
  beyond flat color
- `references/characters.md` — the character scaffold: the proportion
  vector, gait, chains, the add-on pattern, worked biped/quadruped vectors
- `references/bibles.md` — style bibles v2: the whole look as ONE object
  (palette, exposure, post, lens, cut pace, camera energy), switched by one
  line; `examples/gearbox.html` ships the committed control pair
  (`workshop` / `neon`) — read at art-direction time
- `references/instruments.md` — what each check can and cannot see, with its
  measured brackets; read when deciding whether a green result means anything
- `references/delivery.md` — shipping inline on GitHub: format tradeoffs, the
  AVIF decode cost, encoder settings, and why stills come from the scene
- `examples/gearbox.html` — the regression film against frozen
  explainer-video: same scene body on both stacks, judged side-by-side
- `examples/menagerie.html` — the character-scaffold demonstration: bear,
  human, and an invented strider from one `buildCharacter`, three gaits,
  fur and fabric packs live
- `examples/bear-and-bees.html` — the comedy short: pause-then-fast timing
  (a 2.6s hush against a 1.1s eruption), probe-measured contacts, locked
  tableau camera — the register where the gag must read with no words
- `examples/noise-chart.html` — the chart tier: 8 noise/hash primitives in
  a grid, one per cell — MaterialX baseline row, hash-lattice row, and a
  sin-hash drift control; new shader primitives land HERE before any
  showcase or film uses them
- `examples/materials.html` — the pack showcase: cel, SSS, glass in one
  film, including the overlapping-transparency ordering case
  (rendered previews live in the repository outside the plugin subtree —
  deliberately: installed plugins carry only what the skill needs)
