# Instruments: what each check can and cannot see

> **Not here.** Authoring method and the three axes → `method.md`; backend determinism architecture → `webgpu-stack.md`; SQLite table definitions → `breakdown.md`.

Every `mitate` CLI instrument has a specific scope and measured boundary. **A proxy can reject; it cannot approve.** Read both the structured stdout JSON telemetry (`meter`, `framing`, `contacts`, `lint`) and the rendered images (`read_file` / `Read`).

## 1. `mitate check shot.db` (`<5ms`, no GPU)

Cross-references the relational soundstage in `shot.db` before a single GPU thread runs:

| What `mitate check` decides | Severity | What it cannot see |
|---|---|---|
| Foreign keys (`beats`, `shots`, `subjects`, `actors`, `props`, `surface_shaders`, `cue_sheet`) | error | Whether the staged composition looks good |
| `beats.dur_sec > 0`, `shots.beat_frac IN [0, 1]`, ascending shot sequence order | error | Whether beat pacing feels rushed or slow |
| `shots.match_prev = 1` framing equality (`size_rung`, `angle_deg`, `elev_deg`, `fov_mm`, `anchor_y`) | error | Whether the match cut reads visually |
| `gpu_kernels` with `purity_mode = 'baked_sim'` have a fresh matching row in `baked_tracks` | error | Whether a `pure_t` kernel is hiding subtle visual aliasing |
| Caption reading speed (`CPS > 30` warning; bracketed at `27 CPS` comfortable vs `37 CPS` unreadable) | warn | Whether caption text is legible at tiny display widths |
| Union subject (`member_actors_json`) using a body-landmark rung (`MS`/`MCU`/`CU`) without `anchor_y` | warn | Whether a wide union shot is aesthetically balanced |
| 3+ shots sharing identical framing parameters | warn | Whether the repetition is an intentional motif |

## 2. `mitate quad shot.db --t <beat@frac> --out quad.png` (`~40ms`)

Renders a 2×2 spatial scout:
- **Top-Left**: Active camera beauty render with safe-title and framing guides.
- **Top-Right**: Top-down orthographic (`XZ`) with 1m/5m grid, camera frustum cone, lamp direction vectors, and labeled actor AABBs.
- **Bottom-Left**: Front orthographic (`XY`).
- **Bottom-Right**: Right-side orthographic (`ZY`).

**What it catches:** Floating props above the floor, actors outside the camera frustum cone, lamps pointing the wrong way, and depth misses (`dz`) that look like contact in the camera view.
**What it cannot see:** Motion continuity between frames or full-sequence pacing.

## 3. `mitate sheet shot.db --frac <0..1> [--nocap] --out sheet.jpg`

Renders one frame per beat tiled side by side, plus `sheet.squint.jpg` (90px height silhouette strip):
- **`--frac 0.6` (mid-beat)** and **`--frac 0.95` (end-of-beat)**: Running both is mandatory. A single `0.6` sample misses effects that park at the end of a beat or subjects that drift out of frame right before a cut.
- **Flash avoidance**: If a beat carries a world-cut flash (`flash_at`, `flash_width`) covering `0.95`, inspect a timestamp just outside the flash window.
- **`sheet.squint.jpg`**: Tests value separation and silhouette readability at thumbnail scale.
- **`--nocap`**: Strips captions and title cards to test Axis 3 (Semantics). Note that 3D `text3d` prop geometry in the scene remains visible unless hidden or mentally masked during semantic review.

## 4. `mitate strip shot.db --from <beat@frac> --to <beat@frac> --out strip.jpg`

Tiles consecutive frames across a motion window or cut boundary.
- **Measured bracket**: Easily reveals world- and object-level jumps (~15% of frame height), mechanism stalls, and skating feet during a walk cycle. Very small limb rotations (~2% of frame area on a moving camera) can fall below visual detection in a strip — inspect `cue_sheet` spans directly for uncovered step boundaries (`method.md`).

## 5. `mitate probe shot.db --t <beat@frac> --sep <actor_a> <actor_b>`

Evaluates exact 3D world-space AABBs, per-axis clearance/overlap (`dx`, `dy`, `dz`, where negative values mean overlap), and 2D screen-space bounding boxes at `t`.
- **When required**: Every time a scene claims physical contact (feet on the floor, a hand/snout touching a target, meshing gear teeth) or when verifying that an animated expression varies across 4–5 distinct `t` samples.

## 6. `mitate smoke shot.db [--dump-frames]`

The automated contract and determinism gate:
1. Runs `mitate check`.
2. Evaluates out-of-order random-access seeks (`t_a -> t_b -> t_a`) across a flash-aware 4-point beat sample plan plus shot-transition midpoints.
3. Verifies non-blank output and luma spread (`meter.clip_high_pct`, `meter.crush_low_pct`).
4. Reports any pixel discrepancy with its exact magnitude and location (`changed_pixels`, `bbox`, `max_channel_delta`, `psnr_db`), writing disagreeing PNGs when `--dump-frames` is passed.

## What has no automated instrument

- **Whether the film's visual metaphor actually explains the concept** (`--nocap` strips the words, but a human or reviewing agent must look at `sheet_nocap.jpg` and judge whether the geometry carries the meaning).
- **Whether motion cadence feels right at real-time playback speed.**
