---
name: mitate
description: >
  Create deterministic animated films of any register — an explainer, a game
  cutscene, a character short, a meme — on the mitate v2 SQLite 3 Virtual
  Soundstage (shot.db) and Apple Silicon Metal 3/4 engine, exportable to
  frame-exact MP4/ProRes 4444 or a self-contained looping HTML page. Use when
  asked to "make a video / animation / cutscene / walkthrough / explainer /
  simulation / movie / animated meme" of anything: a mechanism, a story beat,
  a system, a joke, a document, an image or screenshot, or an existing video
  re-staged from scratch. mitate (見立て) is to see one thing as another —
  seeing any input as a scene. Films are SILENT (no narration or audio) and
  NOT INTERACTIVE, and every input is RE-AUTHORED as declarative SQLite staging
  and procedural geometry. Do NOT use for editing existing video files, screen
  recordings, or slide decks.
---

# mitate

**What it makes:** a single-file SQLite 3 Virtual Soundstage (`shot.db`) that
renders deterministically on Apple Silicon Metal (`mitate`, aliased as `slate`)
to frame-exact MP4 / ProRes 4444 (`mitate shoot`) and exports to a
self-contained HTML player (`mitate bundle shot.db --out scene.html`). Zero
per-scene package setup, zero fence replication — the entire stage is relational
data plus closed-form cues and optional ~25ms-JIT Metal shaders.

**What it cannot do**, so you do not promise it: films are **silent** (no audio
or voiceover), **non-interactive**, and every input is **re-staged as
declarative 3D geometry, materials, rigs, and lighting** — it will not trim an
existing MP4, edit a screen recording, or animate a slide deck.

**Duration is free, and there is no ceiling.** Five seconds, five minutes, five
hours — a film lasts as long as the rows in `beats`. Evaluating a frame at
`t=18000` costs the same $O(1)$ pass as `t=1.0`, because `MitateCore` evaluates
closed-form state (`StageClock(t) -> StageSnapshot(t)`) or reads indexed
`baked_tracks` without stepping from `t=0`. **Never quote a demo film's length
as a limit.**

**The one rule everything rests on:** the scene is a pure function of `t`, and
**`t` is a random-access position, not a clock.** It is an address you evaluate,
not a cursor you advance. No state carried across frames, no temporal
accumulation (`MTLFXTemporalScaler`, temporal GI caches, or unbaked stateful
buffers), no runtime `Math.random()`, and no wall-clock dependence. Any `t`, in
any order, as many times as you like, always produces the exact same pixels.

The authoring consequence: **address by `beat_id` and `beat_frac`, never by raw
cumulative seconds.** Anchor shots and `cue_sheet` rows to `(beat_id, beat_frac)`
or `(beat_id, offset_sec, dur_sec)`. Retime a beat in `beats` (`UPDATE beats SET
dur_sec = 3.4 WHERE id = 'reveal'`), and every shot, cue, and camera transition
anchored to it shifts automatically via `v_beats`.

**Read [`references/method.md`](references/method.md) before building.** It is
the prerequisite for the three failure axes (Composition, Continuity, Semantics)
and the controls discipline; the other references in `references/` are cited at
the step that needs them.

## Workflow

### 1. Spec, before any SQL

Decide topic, audience, register (explainer, cutscene, character short, meme),
aspect ratio (`slate.width` × `slate.height`, e.g. `1920×1080`, `1080×1920`,
`1080×1080`), style bible (`slate.active_bible`: `'workshop'`, `'neon'`,
`'daylight'`, `'paper'`, or a custom row in `style_bibles`), captions on/off,
and the **`beats` table**: named beats with `seq_order` and `dur_sec`.

Read [`references/bibles.md`](references/bibles.md) when choosing the look. A
style bible sets backdrop, exposure, color transform (`agx`, `agx_punchy`,
`aces_cg`, `filmic`), default focal length, camera energy (`locked`,
`steadicam`, `handheld`), bloom, and DoF as one coherent row in `style_bibles`,
switched by `UPDATE slate SET active_bible = 'neon'`.

### 2. Initialize & Discover Schema

No `package.json`, no `node_modules`, no browser install required. Use the
native `mitate` (or `slate`) CLI directly:

```bash
# Inspect DDL and copy-pasteable SQL examples for any table
mitate schema
mitate schema beats
mitate schema shots

# List or apply tested SQL recipes
mitate recipe --list
mitate recipe three-point-lights

# Initialize a new SQLite soundstage from a preset
mitate init shot.db --preset workshop   # or: three-point-studio | sunlit-exterior | explainer-stage | character-stage
```

### 3. Author the Soundstage (`shot.db`)

Mutate `shot.db` surgically using `mitate sql shot.db "<SQL>"` (or a `.sql`
script). Foreign keys and `CHECK` constraints validate every edit immediately:

1. **Beats (`beats`)**: Insert named spans (`id`, `seq_order`, `dur_sec`,
   `caption`, optional `flash_at`). Never hardcode cumulative timestamps; query
   `v_beats` when you want to inspect derived `[t0, t1]` windows.
2. **Actors, Props & Characters (`actors`, `props`, `characters`)**:
   - Stage hierarchy lives in `actors` (`id`, `parent_id`, `role IN ('rig',
     'prop', 'camera', 'lamp', 'atmosphere', 'swarm')`, `x, y, z`, Euler
     `pitch_deg, yaw_deg, roll_deg`, `aim_at`).
   - Procedural and explainer geometry lives in `props` (`shape IN ('sphere',
     'cube', 'plane', 'cylinder', 'capsule', 'torus', 'cone', 'ring', 'gear',
     'arrow3d', 'lathe', 'text3d', 'mesh_file')`, `radius_m`, `inner_radius_m`,
     `tooth_count`, `shader_id`).
   - Articulated figures live in `characters` (`preset IN ('biped', 'quadruped',
     'strider', 'custom')`, proportion vector `hip_h`, `torso_len`, `head_r`,
     `fur_shells`, and distance-driven gait `walk_start_x`, `stride_m`,
     `step_lift_m`). Read [`references/characters.md`](references/characters.md)
     whenever staging figures.
3. **Materials & Lighting (`surface_shaders`, `lamps`, `atmospheres`)**:
   - Read [`references/materials.md`](references/materials.md) before authoring
     surfaces beyond matte PBR (`mode IN ('pbr', 'toon', 'sss', 'glass',
     'unlit')`, `albedo`, `roughness`, `metalness`, `subsurface_weight`, `ior`,
     `abbe_dispersion`, `glow_nits`).
   - Photometric area lamps (`shape IN ('panel', 'disk', 'bulb', 'spot',
     'sun_directional')`, `lumens`, `kelvin`, `cone_deg`) and volumetric
     `atmospheres` (`haze_box`, `global_mist`).
4. **Subjects & Declarative Shots (`subjects`, `shots`)**:
   - Read [`references/film-language.md`](references/film-language.md) and
     [`references/breakdown.md`](references/breakdown.md) before authoring
     `subjects` and `shots`.
   - `subjects` defaults to `extent_mode = 'auto_bounds'`, where `MitateCore`
     computes the exact 3D world-space bounding box of the actor/character or
     `member_actors_json` group at shot time `t` — eliminating hand-declared
     extent drift.
   - `shots` frames subjects using the `sizes` ladder (`EWS`, `WS`, `FSA`, `FS`,
     `MS`, `MCU`, `CU`, `ECU`), `angle_deg`, `elev_deg`, `cut_kind` (`hard`,
     `whip`, `blend`), `match_prev`, and optional rack-focus `focus_subject_id`.
5. **Animation Cues, Metal Kernels & Tier-1 Bake (`cue_sheet`, `gpu_kernels`, `baked_tracks`)**:
   - Animate properties across beat fractions in `cue_sheet` (`beat_id`,
     `beat_frac`, `end_beat_id`, `end_beat_frac`, `target_domain`, `target_id`,
     `property_path`, `value_num`, `curve`).
   - For custom procedural motion, volumetric media, or shader patterns, attach a
     Metal C++17 `[[visible]]` function (~25ms JIT compile into
     `MTLVisibleFunctionTable`):
     ```bash
     mitate kernel shot.db --id vortex_motion --slot kinematics --file vortex.metal
     ```
   - For physics or multi-body collisions (`purity_mode = 'baked_sim'`), freeze
     trajectories into `baked_tracks` so runtime evaluation stays $O(1)$ and
     random-access pure:
     ```bash
     mitate bake shot.db --seed 101
     ```

Run pre-render validation after every structural edit (`<5ms`, no GPU):

```bash
mitate check shot.db
```

### 4. Review on Three Axes (Plus 3D Contact Probe)

Every `mitate` command emits structured JSON telemetry (`meter`, `framing`,
`contacts`, `lint`) to stdout. Run the instruments and **visually inspect every
generated image with your file-reading tool (`Read` / `read_file`)** — or
delegate to the `film-reviewer` subagent:

```bash
# Spatial Scout (~40ms): 2x2 Camera + Top/Front/Side Orthographic blueprint
mitate quad shot.db --t intro@0.5 --out quad.png

# Axis 1 — Composition: mid-beat (0.6), end-of-beat (0.95), plus .squint.jpg strip
mitate sheet shot.db --frac 0.6  --out sheet_06.jpg
mitate sheet shot.db --frac 0.95 --out sheet_095.jpg

# Axis 2 — Continuity: consecutive frames tiled across a transition or action
mitate strip shot.db --from hit@0.2 --to hit@0.8 --out strip.jpg

# Axis 3 — Semantics: all captions & overlays stripped
mitate sheet shot.db --frac 0.6 --nocap --out sheet_nocap.jpg

# 3D Contact & Extent Probe: exact world AABB separation (negative = overlap)
mitate probe shot.db --t hit@0.5 --sep actor_a actor_b
```

- **Never eyeball 3D contact from a perspective render.** Camera angles fake
  contact in 2D while missing in depth (`dz`). Always verify physical contacts
  with `mitate probe`.
- Read [`references/instruments.md`](references/instruments.md) for what each
  check can and cannot see.

### 5. Smoke-Test the Contract & Determinism

```bash
mitate smoke shot.db [--dump-frames]
```

Verifies `mitate check`, out-of-order random-access seek determinism (`t_a ->
t_b -> t_a`) across the beat sample plan and cut midpoints, non-blank frame
output, and reports any pixel difference with its exact magnitude and bounding
box (`changed_pixels`, `bbox`, `max_channel_delta`, `psnr_db`).

### 6. Shoot Video or Bundle Self-Contained HTML

Depending on the requested deliverable (`references/delivery.md` and
`references/recordings.md`):

```bash
# Zero-copy Apple Silicon VideoToolbox render (MP4 / HEVC / ProRes 4444)
mitate shoot shot.db --mode dailies   --out preview.mp4
mitate shoot shot.db --mode hero      --out final.mp4
mitate shoot shot.db --mode reference --out master.mov

# Export a single self-contained HTML file honoring the window.seekTo(t) contract
mitate bundle shot.db --out scene.html
```

### 7. Close Out — Film Field Report

Before finishing, write three honest bullets in your response or session log:
what you built twice, what you had to work out from scratch, and what SQL recipe
or kernel pattern should be promoted into `mitate recipe` or the references.

## Rules That Silently Break a Film

- **Never bypass relative beat addressing with hardcoded cumulative seconds** in
  multi-beat films; retiming a beat will desynchronize every downstream cue.
- **Never introduce cross-frame state or temporal accumulation.** `gpu_kernels`
  with `purity_mode = 'pure_t'` must be pure functions of `StageClock(t)` and
  deterministic `(pixel_xy, sample_idx, seed)` hashes. Any step-integrated
  simulation must use `purity_mode = 'baked_sim'` and be frozen into
  `baked_tracks` via `mitate bake shot.db`.
- **Always run the `0.95` end-of-beat sheet and `--nocap` semantics sheet.**
  Effects that park early or films that rely on captions as a crutch for inert
  geometry are only caught there.
- **Never judge 3D contact without `mitate probe`.**

## References

| file | read it when |
|---|---|
| [`references/method.md`](references/method.md) | **before building anything** — the three failure axes and controls discipline |
| [`references/glossary.md`](references/glossary.md) | a term is doing more work than it looks like |
| [`references/breakdown.md`](references/breakdown.md) | authoring declarative tables (`beats`, `subjects`, `shots`, `style_bibles`) |
| [`references/film-language.md`](references/film-language.md) | authoring `subjects` and `shots` — `SIZES`, cuts, `match_prev`, focus, camera energy |
| [`references/bibles.md`](references/bibles.md) | choosing or customizing a `style_bibles` row at spec time |
| [`references/materials.md`](references/materials.md) | authoring `surface_shaders` (`pbr`, `toon`, `sss`, `glass`) and lighting |
| [`references/characters.md`](references/characters.md) | staging articulated figures in `characters` |
| [`references/instruments.md`](references/instruments.md) | understanding what `check`, `quad`, `sheet`, `strip`, `probe`, and `smoke` measure |
| [`references/delivery.md`](references/delivery.md) | shipping a self-contained HTML bundle (`mitate bundle`) and poster stills |
| [`references/recordings.md`](references/recordings.md) | choosing recording modes and formats (`mitate shoot`) |
| [`references/webgpu-stack.md`](references/webgpu-stack.md) | browser playback and WebGPU/WebGL2 bundle determinism notes |
