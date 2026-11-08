last updated: 2026-11-08

# `mitate` v2 User Guide & Step-by-Step Tutorial (`docs/user-guide.md`)

**Jump:** [`README.md`](../README.md) · [`VISION.md`](../VISION.md) · [`AGENTS.md`](../AGENTS.md) · [`plan.md`](plan.md) · [`wiki/index.md`](../wiki/index.md)

This guide walks you through building, inspecting, reviewing, and exporting deterministic 3D animated films with **`mitate` v2 (Slate)** — both from the command line and alongside an AI coding agent (**Google Antigravity (`agy`)** or **Claude Code**).

---

## 1. Prerequisites & Setup

### System Requirements
- **OS**: macOS Golden Gate **27.2+** (`arm64-apple-macosx27.2`) on Apple Silicon (M1/M2/M3/M4 family).
- **Toolchain**: Xcode with the macOS 27.2+ SDK and **Swift 6.4** (`xcrun swift --version`).

### Build the `mitate` CLI
From the repository root:

```bash
# Build debug binary (.build/debug/mitate) and run the 9-test verification suite
xcrun swift build
xcrun swift test

# Optional: build an optimized release binary (.build/release/mitate)
xcrun swift build -c release
```

> **Tip (`xcrun swift` vs. Homebrew `swift`):** If `/opt/homebrew/opt/swift/bin/swift` is ahead of `/usr/bin/swift` on your `PATH`, prefer `xcrun swift build` and `xcrun swift test` so SwiftPM uses Xcode's native `arm64-apple-macosx27.2` toolchain directly.

For convenience during this tutorial, alias `mitate` in your shell:

```bash
alias mitate="$(pwd)/.build/debug/mitate"
```

### Using `mitate` with an Agent (`agy` or Claude Code)
- **Google Antigravity (`agy`)**: Open this workspace (`mitate`) or install the plugin with `agy plugin install ./plugin`. The `.agents/plugins.json` manifest automatically loads the [`mitate` skill](../plugin/skills/mitate/SKILL.md), the [`film-reviewer` subagent](../plugin/agents/film-reviewer.md), and the active rules.
- **Claude Code**: Run `/plugin marketplace add fblissjr/mitate` and `/plugin install mitate@mitate` (or open the repository directly, where `CLAUDE.md` delegates to [`AGENTS.md`](../AGENTS.md)).

---

## 2. The Core Mental Model in 60 Seconds

Before running commands, keep three invariants in mind (from [`VISION.md`](../VISION.md)):

1. **One SQLite 3 file (`shot.db`) is the entire Virtual Soundstage.**
   Every beat, style bible, camera lens, shot, actor, procedural prop, articulated character rig, PBR/toon/SSS shader, area lamp, animation cue, Metal shader kernel, and baked simulation track lives in tables inside `shot.db` with `PRAGMA foreign_keys = ON;`.
2. **`t` is a random-access coordinate, never a clock.**
   Evaluating the scene at `t = 4.2` (`StageEvaluator.evaluate(at: 4.2)`) is a pure $O(1)$ function that never depends on having rendered `t = 4.1` first. Multi-body or stateful simulations are frozen at build time into `baked_tracks` via `mitate bake`.
3. **Address time by `beat@frac`, never hardcoded cumulative seconds.**
   Every cue and camera shot attaches to a named beat (`intro@0.5`, `transfer@0.95`). When you change a beat's `dur_sec` in the `beats` table, the entire film retimes automatically (`v_beats`).

### Progressive CLI Discovery (`schema` & `recipe`)
You never need to memorize the 19 SQLite tables upfront. Ask the CLI at any time:

```bash
# List all tables and views in shot.db
mitate schema

# Inspect the exact CREATE TABLE DDL for a specific table
mitate schema shots
mitate schema characters
mitate schema cue_sheet

# List tested SQL + MSL recipes or print one to stdout
mitate recipe
mitate recipe explainer-gears
mitate recipe character-walk
```

---

## 3. Tutorial 1: Build a Mechanical Explainer from Scratch

In this tutorial, we will stage a 3-gear compound reduction train (`12T` drive gear → `15T` idler gear → `24T` load gear), verify exact 3D pitch-circle contact with `mitate probe`, scout the framing in 4 views with `mitate quad`, run the Three-Axis Review Loop, and export both an `.mp4` video and a self-contained `.html` player.

*(You can also inspect the finished calibration scene at [`scenes/gearbox-v2.sql`](../scenes/gearbox-v2.sql) and [`scenes/gearbox-v2.db`](../scenes/gearbox-v2.db).)*

### Step 1 — Initialize the Soundstage (`mitate init`)

Start from the `explainer-stage` preset (which configures a `workshop` style bible, 3-point area lighting, a 50mm lens, and starter shaders):

```bash
mitate init /tmp/tutorial-gears.db --preset explainer-stage
```

Every `mitate` command emits structured JSON telemetry to stdout:

```json
{
  "command": "init",
  "dbPath": "/tmp/tutorial-gears.db",
  "ok": true,
  "preset": "explainer-stage"
}
```

### Step 2 — Stage the Beats, Gears, Cues & Camera Shots (`mitate sql`)

You can pass inline SQL (`mitate sql /tmp/tutorial-gears.db "UPDATE ..."`) or load a `.sql` script file with `-f`. Look at how [`scenes/gearbox-v2.sql`](../scenes/gearbox-v2.sql) stages the 3-gear train:

- **Pitch-circle tangency (`module = 2 * r / teeth = 0.1333m`)**:
  - `drive_gear`: radius `0.80m`, `12` teeth, centered at `x = -1.80`
  - `idler_gear`: radius `1.00m`, `15` teeth, centered at `x = 0.00` (`|-1.80 - 0.00| = 0.80 + 1.00 = 1.80m`)
  - `load_gear`: radius `1.60m`, `24` teeth, centered at `x = +2.60` (`|2.60 - 0.00| = 1.00 + 1.60 = 2.60m`)
- **Pure `t` rotation cues (`cue_sheet`)**:
  - Drive spins at `-180 * u` deg (`roll_deg`).
  - Idler counter-rotates at `12 + 144 * u` deg (`12/15 = 0.8x` speed, with `12 deg` half-tooth phase offset so teeth interleave instead of colliding).
  - Load rotates at `7.5 - 90 * u` deg (`12/24 = 0.5x` speed — exact `2:1` reduction).

Apply the full SQL script into a fresh database:

```bash
rm -f /tmp/tutorial-gears.db
mitate init /tmp/tutorial-gears.db --preset explainer-stage
mitate sql /tmp/tutorial-gears.db -f scenes/gearbox-v2.sql
```

### Step 3 — Lint Schema & Measure 3D Contact (`mitate check` & `mitate probe`)

Run `mitate check` (<5ms) to verify foreign keys, caption reading speed (`CPS <= 30`), shot continuity (`match_prev`), and procedural expressions:

```bash
mitate check /tmp/tutorial-gears.db
```

Never judge whether two 3D objects touch from a 2D camera render (depth foreshortening creates false 2D overlaps). Use `mitate probe --sep <actor_a> <actor_b>` to measure the exact 3D Euclidean AABB separation in meters:

```bash
mitate probe /tmp/tutorial-gears.db --t transfer@0.6 --sep drive_gear idler_gear
mitate probe /tmp/tutorial-gears.db --t transfer@0.6 --sep idler_gear load_gear
```

Both return `"contactState": "touching"` and `"euclideanGapM": 0`.

### Step 4 — Spatial Scout (`mitate quad`)

Render a 2×2 diagnostic quad view (**Camera Beauty + Top XZ + Front XY + Side ZY** orthographic wireframes with 1m grid lines and title-safe guides):

```bash
mitate quad /tmp/tutorial-gears.db --t transfer@0.6 --out /tmp/gears_quad.png
```

Inspect `/tmp/gears_quad.png` — the Top XZ and Front XY orthographic panels confirm that all three gears lie in the `z = 0` plane (`yaw_deg = 0`, rotating around their Z axis via `roll_deg`) and that the torque vector arrow sits cleanly above the train without clipping the gear teeth.

### Step 5 — Run the Three-Axis Review Loop (`sheet`, `strip`, `smoke`)

Every scene must pass three visual axes plus the random-access determinism gate before shipping:

```bash
# Axis 1 — Composition (mid-beat 0.6, end-of-beat 0.95, and 90px .squint.jpg silhouette strip)
mitate sheet /tmp/tutorial-gears.db --frac 0.6  --out /tmp/gears_sheet_06.jpg
mitate sheet /tmp/tutorial-gears.db --frac 0.95 --out /tmp/gears_sheet_095.jpg

# Axis 2 — Continuity across motion and shot transitions
mitate strip /tmp/tutorial-gears.db --from engage@0.2 --to payoff@0.8 --frames 8 --out /tmp/gears_strip.jpg

# Axis 3 — Semantics without words (strips all captions & 3D text badges)
mitate sheet /tmp/tutorial-gears.db --frac 0.6 --nocap --out /tmp/gears_nocap.jpg

# Gate — Random-access out-of-order seek determinism + diff magnitude locator
mitate smoke /tmp/tutorial-gears.db
```

Notice what `--nocap` tests on Axis 3: with all text stripped, beat 1 (`engage`), beat 2 (`transfer`, where `torque_arrow` scales in via `scale_gate`), and beat 3 (`payoff`, where `load_ring` scales in around `load_gear`) are still visually distinct by their geometry and motion alone.

### Step 6 — Shoot Video (`.mp4` / `.mov`) & Bundle Web Player (`.html`)

```bash
# Render hardware-encoded H.264 MP4 dailies (or --mode reference --out film.mov for ProRes 4444)
mitate shoot /tmp/tutorial-gears.db --mode dailies --out /tmp/gears.mp4

# Export a single self-contained HTML file honoring the window.seekTo(t) contract
mitate bundle /tmp/tutorial-gears.db --out /tmp/gears.html
```

Open `/tmp/gears.html` in any browser:
- Press `Space` to play/pause, drag the scrub bar, or open the browser console and call `window.seekTo(4.2)` directly.
- Zero external assets, zero CDN imports, and 100% deterministic random-access seeking.

---

## 4. Tutorial 2: Character Rigging, Planted Gait & Tier-1 Simulation Baking

Open or inspect the second calibration scene, [`scenes/bear-and-bees-v2.sql`](../scenes/bear-and-bees-v2.sql) (`scenes/bear-and-bees-v2.db`), to see how `mitate` v2 handles organic characters, rack focus, and stateful physics without violating the Prime Directive.

### 1. Articulated Characters & Distance-Integrated Gait (`characters`)
In [`scenes/bear-and-bees-v2.sql`](../scenes/bear-and-bees-v2.sql), `bear_actor` is rigged via the `characters` table:
- **Anatomical SQLite `CHECK` constraints**: `fore_upper + fore_lower <= shoulder_h` and `hind_upper + hind_lower <= hip_h` guarantee at insert time that the 2-bone IK solver never hyper-extends a limb.
- **Zero-skating locomotion**: Instead of computing leg swing from raw clock time $t$ (which causes feet to slide when a character speeds up or slows down), `CharacterRig` integrates path arc-length $d(t)$ along the character's translation cue and computes:
  $$\text{step\_phase}(d) = \frac{d}{\text{stride\_frac} \cdot \text{hip\_h}}$$
  If a character's `stride_frac` is misconfigured for its travel speed, `mitate check` flags `SKATING_LIMB` before a single pixel is rendered.

### 2. Tier-1 Simulation Baking (`gpu_kernels` + `mitate bake`)
What if a scene needs stateful step-by-step physics — such as `hive_actor` swinging like a damped pendulum after the bear swipes it, or a swarm of bees with collision avoidance?
1. Register the simulation kernel in `gpu_kernels` with `hook_slot = 'baked_sim'`.
2. If you run `mitate check` before baking, it immediately blocks with `UNBAKED_SIM_KERNEL`.
3. Freeze the trajectory into `baked_tracks` with an explicit seed:
   ```bash
   mitate bake scenes/bear-and-bees-v2.db --seed 42
   ```
4. At render time (`quad`, `sheet`, `strip`, `smoke`, `shoot`, `bundle`), `StageEvaluator` binary-searches `baked_tracks` in $O(1)$ at any `t` with Hermite interpolation (`pos_x/y/z`, `vel_x/y/z`). If you later edit `gpu_kernels.msl_source` without re-running `mitate bake`, `mitate check` catches the SHA-256 mismatch (`STALE_BAKED_TRACK`).

---

## 5. Working with AI Agents (`agy` & Claude Code)

Because `shot.db` is relational and every `mitate` CLI command returns situated JSON telemetry, you can direct your agent with high-level creative or editorial prompts:

- **Create a new film from any input**:
  > *"Create `scenes/raft-consensus.db` explaining leader election and log replication across 3 nodes in 4 beats. Run the full Three-Axis Review Loop (`check`, `quad`, `sheet`, `strip`, `sheet --nocap`, `probe`, `smoke`) and export `scenes/raft-consensus.html`."*
- **Surgical 1-line retiming or lighting adjustment**:
  > *"Beat 2 (`transfer`) feels rushed — extend its duration from 3.2s to 4.5s in `scenes/gearbox-v2.db` and warm up the key light by 400K, then re-run `mitate smoke`."*
- **Delegate independent visual critique to `film-reviewer`**:
  > *"Have `film-reviewer` audit `scenes/bear-and-bees-v2.db` across composition, continuity, and `--nocap` semantics and report any bracket failures."*

---

## 6. CLI Command Reference & Diagnostic Codes

### The 14 `mitate` (alias `slate`) CLI Verbs

| Command | Purpose |
| :--- | :--- |
| `mitate schema [table]` | Progressive DDL discovery (list all tables/views or inspect one table's `CREATE TABLE` DDL). |
| `mitate recipe [name]` | List or print tested SQL + MSL staging recipes (`three-point-lights`, `character-walk`, `rack-focus`, `explainer-gears`). |
| `mitate init <shot.db> [--preset <name>]` | Initialize a new `shot.db` soundstage (`three-point-studio`, `explainer-stage`, `character-stage`, `sunlit-exterior`). |
| `mitate sql <shot.db> "<SQL>" \| -f <file.sql>` | Execute an atomic SQL transaction with `PRAGMA foreign_keys = ON`. |
| `mitate kernel <shot.db> --id <id> --slot <slot> --entry <fn> --file <f.metal>` | Compile and validate a Metal 4.1 (`MTLLanguageVersion.version4_1`) shader in ~25ms and register it in `gpu_kernels`. |
| `mitate bake <shot.db> [--seed <int>] [--fps <int>]` | Run Tier-1 simulation kernels with a deterministic PRNG seed and freeze trajectories into `baked_tracks`. |
| `mitate check <shot.db>` | Fast (<5ms) schema, continuity, reading-speed, gait, and bake freshness validator. |
| `mitate probe <shot.db> --t <beat@frac> [--sep <a> <b>]` | Read-only 3D world-space AABB, screen projection, and exact Euclidean separation probe. |
| `mitate quad <shot.db> --t <beat@frac> --out <quad.png>` | Render a 2×2 Camera + Top XZ + Front XY + Side ZY orthographic blueprint (~40ms). |
| `mitate sheet <shot.db> [--frac <0..1>] [--nocap] --out <sheet.jpg>` | Render 1 frame per beat + companion `.squint.jpg` 90px silhouette strip (`--nocap` strips all text for Axis 3). |
| `mitate strip <shot.db> --from <beat@frac> --to <beat@frac> [--frames <n>] --out <strip.jpg>` | Render consecutive frames across a motion window or cut boundary for Axis 2 continuity review. |
| `mitate smoke <shot.db> [--dump-frames <dir>]` | Verify out-of-order random-access seek byte-identity and report diff magnitude (`changedPixels`, `bbox`, `maxChannelDelta`, `psnrDb`). |
| `mitate shoot <shot.db> [--mode dailies\|hero\|reference] [--t <beat@frac>] --out <out.mp4\|.mov\|.png>` | Render still frames or hardware-encoded H.264 `.mp4` / ProRes 4444 `.mov` video via `AVAssetWriterInput.PixelBufferReceiver`. |
| `mitate bundle <shot.db> --out <scene.html>` | Export a single self-contained HTML player honoring `window.seekTo(t)`, `window.DURATION`, `window.stopPlayback()`, and `window.sceneReady()`. |

### Common `mitate check` Diagnostic Codes

| Code | What It Means & How to Fix It |
| :--- | :--- |
| `CPS_OVER_30` | A beat's `caption` exceeds 30 characters per second (`len(caption) / dur_sec > 30`). Shorten the caption or increase `beats.dur_sec`. |
| `SHOT_CONTINUITY_JUMP` | Two adjacent shots with `match_prev = 1` jump more than `45 deg` in `angle_deg` or more than 2 steps on the `sizes` ladder. Adjust `angle_deg`/`size_code` or set `match_prev = 0` for an intentional jump cut. |
| `SKATING_LIMB` | A rigged character translates faster/slower than its `stride_frac * hip_h` cadence allows without foot slip. Adjust `characters.stride_frac` or the translation distance in `cue_sheet`. |
| `INERT_PROCEDURAL_EXPR` | A `cue_sheet` row with `easing = 'procedural'` has an `expr` that does not vary with `u` or `t` across `[0, 1]`. Use `u` (`0..1` beat fraction) or `t` in `expr`, or switch `easing` to `'linear'`/`'smoothstep'`. |
| `UNBAKED_SIM_KERNEL` | A `gpu_kernels` row with `hook_slot = 'baked_sim'` has no corresponding rows in `baked_tracks`. Run `mitate bake shot.db --seed <N>`. |
| `STALE_BAKED_TRACK` | `gpu_kernels.msl_source` was modified after `baked_tracks` was generated (`kernel_sha256` mismatch). Re-run `mitate bake shot.db --seed <N>`. |
