last updated: 2026-11-08

# mitate (`AGENTS.md`)

Deterministic animated scenes from any input — built on the **Slate** (`mitate` v2) architecture: a single-file SQLite 3 Virtual Soundstage (`shot.db`), a native Apple Silicon Swift 6 + Metal 3/4 rendering engine (`MitateCore` + `MitateMetal`), and a self-contained HTML exporter (`mitate bundle`).

This file is the canonical front door for both **Google Antigravity (`agy`)** and **Claude Code** (`CLAUDE.md` imports `@AGENTS.md`). It stays concise by acting as an **Index Router** into the repository's core documents and the modular **LLM Knowledge Wiki (`wiki/`)**.

## Core Intent & Architecture

- **[`VISION.md`](VISION.md) (Read First)**: Why determinism comes first (as a measuring instrument, not dogma), `t` as a coordinate vs. `state`, reproducibility vs. byte-identity, and why declarations live in SQLite (`shot.db`). Where any document conflicts with `VISION.md` on intent, `VISION.md` wins.
- **[`docs/user-guide.md`](docs/user-guide.md)**: Step-by-step user guide, mechanical and character tutorials (`gearbox-v2.db`, `bear-and-bees-v2.db`), Three-Axis Review Loop walkthrough, and CLI reference.
- **[`docs/plan.md`](docs/plan.md)**: System architecture, full SQLite soundstage DDL (`schema.sql`), Metal 3/4 hybrid rendering pipeline, CLI specification, and v2 roadmap milestones.
- **[`docs/source-of-truth.md`](docs/source-of-truth.md)**: Where facts are homed and how truth is maintained without duplicate prose.

## LLM Knowledge Wiki Router (`wiki/`)

Read the relevant topic module before authoring or modifying that layer:

| Topic | Wiki Module | What It Covers |
| :--- | :--- | :--- |
| **Master Index** | [`wiki/index.md`](wiki/index.md) | Master LLM Wiki Index, Schema Map & Quick Reference |
| **Time & Beats** | [`wiki/time-and-beats.md`](wiki/time-and-beats.md) | Prime Directive (`t` as a random-access coordinate), relative `beats` (`v_beats`), `warp_segments`, and Tier-1 `mitate bake` (`baked_tracks`) |
| **Soundstage Schema** | [`wiki/soundstage-schema.md`](wiki/soundstage-schema.md) | The SQLite 3 Virtual Soundstage (`shot.db`): `slate`, `actors`, `props`, `surface_shaders`, `lamps`, `atmospheres`, `cue_sheet`, `finishing_chain`, `takes`, `media_bay` |
| **Cinematography & Rigging** | [`wiki/cinematography-and-rigging.md`](wiki/cinematography-and-rigging.md) | Declarative cinematography: `style_bibles`, `sizes`, `characters` (proportion vectors & distance gait), `subjects` (`auto_bounds`), `lenses`, `shots`, and the camera solver |
| **Metal Engine & Kernels** | [`wiki/metal-engine-and-kernels.md`](wiki/metal-engine-and-kernels.md) | Apple Silicon Swift 6 & Metal 3/4 architecture: Unified Memory, HWRT, `kinematics(t, state)` MSL hook, `swarms`, `gpu_kernels`, `state_buffers`, `Denoise.metal`, and `MTLFXSpatialScaler` |
| **Instruments & Review** | [`wiki/instruments-and-review.md`](wiki/instruments-and-review.md) | The `mitate` CLI verbs (`init`, `schema`, `recipe`, `sql`, `check`, `bake`, `quad`, `sheet`, `strip`, `probe`, `smoke`, `shoot`, `bundle`), situated JSON telemetry, and the Three-Axis Review Loop (Composition, Continuity, Semantics) |
| **Patterns & Recipes** | [`wiki/patterns-and-recipes.md`](wiki/patterns-and-recipes.md) | Tested SQL + MSL recipes, procedural primitives (`gear`, `ring`, `arrow3d`, `text3d`), and lessons distilled from v1 postmortems |

## Shipped Plugin Surface (`plugin/`)

- **Main Skill**: [`plugin/skills/mitate/SKILL.md`](plugin/skills/mitate/SKILL.md) and domain references in `plugin/skills/mitate/references/*.md`.
- **Review Subagent**: [`plugin/agents/film-reviewer.md`](plugin/agents/film-reviewer.md) — audits scenes on Composition, Continuity, and Semantics with measured brackets.
- **Active Plugin Rules**: [`plugin/rules/AGENTS.md`](plugin/rules/AGENTS.md).

## Prime Directive

1. **The scene is a pure function of `t`, and `t` is a random-access position, not a clock.**
   An address you evaluate (`StageClock(t) -> StageSnapshot(t)`), not a cursor you advance. Zero state carried across frames, no temporal accumulation (`MTLFXTemporalScaler`, temporal GI caches, or unbaked step-integrated `state_buffers`), no runtime `Math.random()`, and no wall-clock dependence. Motion is either closed-form (`cue_sheet` + pure `kinematics(t, state)` kernels) or frozen at build time into `baked_tracks` via `mitate bake`. Any `t` evaluates in $O(1)$ in any order.
2. **Tooling that DRIVES a scene talks only to the contract**, never to scene internals:
   - **Native contract**: `mitate` (alias `slate`) CLI verbs over `shot.db` (`check`, `quad`, `sheet`, `strip`, `probe`, `smoke`, `shoot`, `bundle`). One admitted authoring-time read-only exception: `mitate probe` for exact 3D AABB separation and screen-projection measurements.
   - **Web contract (`mitate bundle`)**: `window.seekTo(t)`, `window.DURATION`, `window.stopPlayback()`, `window.sceneReady()`.
3. **Determinism Scope & Diff Magnitude**: Byte comparison is valid within a single backend (e.g., M2 Ultra Native Metal or a fixed browser backend). Differences must be reported with their magnitude and location (`changed_pixels`, `bbox`, `max_channel_delta`, `psnr_db`), never as a bare pass/fail.

## Three-Axis Review Loop

Every `mitate` command emits situated JSON telemetry (`meter`, `framing`, `contacts`, `lint`). Never ship a scene without verifying all three axes (inline or by delegating to `film-reviewer`):

1. **Pre-render & Spatial Scout**: `mitate check shot.db` (<5ms schema/constraint/bounds lint) and `mitate quad shot.db --t <beat@frac> --out quad.png` (~40ms 2×2 Camera + Top/Front/Side ortho blueprint).
2. **Axis 1 — Composition**: `mitate sheet shot.db --frac 0.6 --out sheet.jpg` and `--frac 0.95` (end-of-beat check) + `.squint.jpg` silhouette strip. Visually inspect every generated image.
3. **Axis 2 — Continuity**: `mitate strip shot.db --from <beat@frac> --to <beat@frac> --out strip.jpg` across motion transitions and cuts.
4. **Axis 3 — Semantics & 3D Contact**: `mitate sheet shot.db --nocap --out nocap.jpg` (verify the film reads with all words stripped) and `mitate probe shot.db --t <beat@frac> --sep <actor_a> <actor_b>` (never judge 3D contact from a perspective still).
5. **Gate**: `mitate smoke shot.db` (out-of-order random-access seek byte-identity + diff magnitude check).

## Engineering & Git Discipline

- **Single Front Door**: Edit `AGENTS.md` for repo-wide instructions; keep `CLAUDE.md` as `@AGENTS.md`.
- **Plugin Isolation (`plugin/`)**: Everything under `plugin/` ships into user install caches. Relative links inside `plugin/*.md` must resolve within `plugin/` (use absolute GitHub URLs for repo docs), shipped markdown under `plugin/` must stay ISO-date-free, and any version bump must keep `plugin/plugin.json`, `plugin/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, and `CHANGELOG.md` coherent.
- **Red Before Green**: Every validator rule or check bracket must be proven to fail on a broken fixture before it is trusted.
- **Commit Freely; Never Push Without Approval**: Run `bun run scripts/selfcheck.js` before committing. Pushing to remotes is always the owner's call.
- **Path Privacy**: Keep all paths repo-relative; never include absolute home-directory paths or personal full names in tracked files, commit messages, or branch names.
