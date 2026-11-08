# Glossary

> **Not here.** Workflow and failure axes → `method.md`; what each check can and cannot see → `instruments.md`; shot vocabulary → `film-language.md`; SQLite schema breakdown → `breakdown.md`.

The terms `mitate` v2 uses across the skill, CLI telemetry, and review subagent:

- **`shot.db` (Virtual Soundstage)** — the single-file SQLite 3 database (`PRAGMA foreign_keys = ON`) that holds all declarative intent (`beats`, `style_bibles`, `sizes`, `subjects`, `shots`, `characters`, `warp_segments`, `baked_tracks`) and physical stage tables (`slate`, `actors`, `props`, `surface_shaders`, `lamps`, `atmospheres`, `cue_sheet`, `gpu_kernels`, `finishing_chain`, `takes`).
- **`t`** — a random-access **position** in seconds (`0 <= t <= DURATION`), not a advancing clock. Evaluating `StageClock(t) -> StageSnapshot(t)` at any `t`, in any order, always produces the same scene state and pixels.
- **register** — the kind of film being made: technical explainer, game cutscene, character short, diagram, or animated meme. Register changes geometry, pacing, style bible, and caption voice without ever changing the contract or review loop.
- **beat** — a named narrative span with a duration (`beats.id`, `beats.seq_order`, `beats.dur_sec`). `v_beats` derives cumulative `[t0, t1]` windows. Shots and animation cues anchor to `(beat_id, beat_frac)` so retiming a beat shifts all downstream cues automatically.
- **shot** — a row in `shots` declaring which `subject_id` to frame, at which `size_rung` (`EWS`..`ECU`), from which `angle_deg` and `elev_deg`, starting at `(beat_id, beat_frac)`. `MitateCore`'s camera solver computes the exact world camera transform per frame.
- **`auto_bounds`** — the default `subjects.extent_mode` (`'auto_bounds'`), where `MitateCore` computes the exact 3D world-space bounding box of the target actor, character rig, or `member_actors_json` union at shot time `t`, eliminating hand-declared extent drift.
- **bible (`style_bibles`)** — a single row defining the coherent look of a film (backdrop, exposure, color transform, lens focal length, camera energy, cut durations, bloom, DoF, and `palette_json`), switched by `UPDATE slate SET active_bible = '<id>'`. See `bibles.md`.
- **`gpu_kernels`** — hot-compiled Metal C++17 `[[visible]]` shader functions (`kinematics`, `ray_medium`, `procedural_surface`, `lens_ray`, `finishing_pass`) linked via `MTLVisibleFunctionTable` in ~25ms.
- **`baked_tracks` (`mitate bake`)** — deterministic build-time trajectories frozen from `purity_mode = 'baked_sim'` physics or swarm kernels so runtime evaluation at any `t` stays $O(1)$ and order-independent.
- **the native contract** — the `mitate` (alias `slate`) CLI verbs over `shot.db` (`init`, `schema`, `recipe`, `sql`, `kernel`, `bake`, `check`, `quad`, `sheet`, `strip`, `probe`, `smoke`, `shoot`, `bundle`) plus structured stdout JSON telemetry.
- **the window contract** — the browser interface exported by every `mitate bundle` HTML file: `window.seekTo(t)`, `window.DURATION`, `window.stopPlayback()`, and `window.sceneReady()`.
- **`quad`** — `mitate quad shot.db --t <beat@frac>`, rendering a ~40ms 2×2 spatial blueprint (Camera beauty preview + Top/Front/Side orthographic views with 1m/5m grid, camera frustum cone, lamp vectors, and actor AABBs).
- **`sheet` & `.squint.jpg`** — `mitate sheet shot.db --frac <0..1>`, tiling one frame per beat alongside a 90px blurred `.squint.jpg` strip that tests silhouette and value hierarchy.
- **`strip`** — `mitate strip shot.db --from <beat@frac> --to <beat@frac>`, tiling consecutive frames across a motion window or cut to inspect continuity.
- **`probe`** — `mitate probe shot.db --t <beat@frac> --sep <actor_a> <actor_b>`, the authoring-time read-only instrument that measures exact 3D world-space AABB separation (`dx`, `dy`, `dz`) and 2D screen projections.
- **`nocap`** — `mitate sheet shot.db --nocap`, rendering with captions and title overlays stripped to test the Semantics axis.
- **the three axes** — Composition (fails inside one frame), Continuity (fails between frames), and Semantics (every frame looks fine, but the geometry explains nothing without words). See `method.md`.
- **bracket** — a red-before-green control test that constructs a broken fixture, proves a validator or instrument fails on it, and verifies the passing state.
- **the install cache** — the shipped copy of `plugin/` installed into a user's agent environment. It contains only files inside `plugin/`, so all relative links inside `plugin/` must resolve within `plugin/`.
- **the prime directive** — the two non-negotiable rules: (1) the scene is a pure function of random-access position `t`, and (2) tooling that drives a scene talks only to the contract.
