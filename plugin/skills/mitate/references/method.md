# Method: designing a sequence that reads

> **Not here.** SQLite table specifications → `breakdown.md`; what each check can and cannot see → `instruments.md`; shot grammar and camera solver → `film-language.md`; backend determinism rules → `webgpu-stack.md`.

The core discipline of `mitate` v2: the three failure axes, relative beat addressing in `shot.db`, the controls discipline, continuity and semantics review, and the determinism rules. Everything here holds across both the native Apple Silicon Metal engine (`MitateMetal`) and the self-contained HTML bundle (`mitate bundle`).

## Three ways a sequence fails

A film fails on three independent axes, and each axis requires a different instrument:

| Axis | Fails | Instrument |
|---|---|---|
| **Composition** | inside a single frame | `mitate quad` (2×2 ortho + camera) and `mitate sheet` (`--frac 0.6`, `--frac 0.95`, plus `.squint.jpg`) |
| **Continuity** | between consecutive frames | `mitate strip --from <beat@frac> --to <beat@frac>` and inspecting `cue_sheet` spans |
| **Semantics** | even when every frame is composed and motion is smooth | `mitate sheet --nocap` — strip all words and ask what the geometry communicates |

Composition failures are the only ones a single still can show. Continuity and semantics failures survive a frame-by-frame beauty check untouched unless you run their dedicated passes.

## Before you build

### Beats live in `beats`, never as hardcoded timestamps

`beats` is the only place narrative durations exist. `v_beats` derives cumulative `[t0, t1]` windows and total film `DURATION` via SQL window functions:

```sql
INSERT INTO beats (id, seq_order, dur_sec, caption) VALUES
  ('title', 1, 2.4, NULL),
  ('scan',  2, 2.8, '1 · Scan the incoming stream'),
  ('load',  3, 3.2, '2 · Lock the planetary carrier');
```

Anchor every `shots` row and `cue_sheet` row to `(beat_id, beat_frac)` or `(beat_id, offset_sec, dur_sec)`:
- **Fractions (`beat_frac`) by default**: A motion across `[0.0, 0.6]` of a beat stretches proportionally when you retime the beat (`UPDATE beats SET dur_sec = 4.0 WHERE id = 'load'`).
- **Physical seconds (`offset_sec`, `dur_sec`, `flash_width`) when the duration is physical**: A `0.25s` world-cut flash or a `0.16s` whip transition should not stretch when a beat is lengthened.

### Reading a source, when one exists

Every input is re-staged as declarative geometry and lighting in `shot.db`. A source image, video, or timestamped log contributes **measurements**:
- **An image gives palette and proportions**: Read its dimensions first, sample key colors, and store them in `style_bibles.palette_json`.
- **A timed video gives beat edges**: Extract stills at the precision you intend to claim, and compare your `mitate sheet` renders side by side against the source stills after each composition pass.
- **A timestamped log or event trace gives domain times**: Use `warp_segments` and `mitate probe` to map between domain time and presentation time `t` so fast stretches do not pop.

### Beats before geometry

Write the `beats` table first and keep each beat to **one idea**. 3–4 seconds per beat is the pacing that reads for a mechanism; under 2s the viewer misses it, over 6s it drags. While the table is still rows in `beats`, check each beat against the Semantics axis: a beat that states a conclusion rather than showing a physical change has no geometry.

## Build the control

**For any claim that a technique improves a shot or that a check catches a defect, test the opposite side.**

| Claim | Control |
|---|---|
| "this lighting or staging makes it read better" | render without it (`mitate quad` / `mitate sheet`); confirm the difference is visible |
| "this check catches the failure" | construct the failing `shot.db` state; confirm `mitate check` or `mitate smoke` fails on it |
| "this threshold is right" | bracket it — one observation confirmed bad above, one confirmed good below |

Before trusting a green check, confirm the control actually varied its independent variable. When a check reports absence, ask what a positive result would have looked like.

---

## Axis 1 — Composition: what fails inside one frame

### Spatial scout first (`mitate quad`)

```bash
mitate quad shot.db --t scan@0.5 --out quad.png
```

Renders a 2×2 blueprint in ~40ms: active camera preview (top-left) plus Top (`XZ`), Front (`XY`), and Side (`ZY`) orthographic views with a 1m/5m grid, camera frustum cone, lamp direction vectors, and labeled actor AABBs. Check `quad` before shooting full sheets to catch floating props, off-axis lamps, and subjects outside the frustum.

### One frame per beat hides end-of-beat bugs (`0.6` and `0.95`)

Always shoot two contact sheets across all beats:

```bash
mitate sheet shot.db --frac 0.6  --out sheet_06.jpg
mitate sheet shot.db --frac 0.95 --out sheet_095.jpg
```

Reviewing beats tiled side by side reveals systematic framing errors immediately. The `0.95` end-of-beat sheet catches effects that park early, actors that drift out of frame before the cut, and transitions that fire late.

### Silhouette (`*.squint.jpg`)

`mitate sheet` automatically writes a 90px-tall blurred `.squint.jpg` silhouette strip alongside the contact sheet. If a character or mechanism reads as an undifferentiated blob in `.squint.jpg`, more surface detail will not save it — separate the masses in `actors`/`characters`, push limbs clear of the torso, and add a rim lamp (`materials.md`).

### Dwell and transit

The ~3s floor applies to the window where the **content** happens, not the beat's total `dur_sec`. If a 3.4s beat spends 1.5s walking a character into position, only 1.9s remains for the mechanism. Vary `beats.dur_sec` according to the weight of each beat; uniform durations across every beat read as a mechanical slideshow.

---

## Axis 2 — Continuity: what fails between frames

Stills cannot show time. A film can pass every composition check and still stall, pop, or skate between frames.

```bash
mitate strip shot.db --from scan@0.2 --to load@0.4 --out strip.jpg
```

`mitate strip` tiles consecutive frames across a motion window or cut boundary. Smooth motion progresses evenly across cells; a discontinuity jumps in one cell and freezes in the next.

### Continuous motion needs one span, not chained `ease_in_out` ramps

An `ease_in_out` curve has zero velocity at both endpoints (`u=0` and `u=1`). Chaining three per-beat `ease_in_out` rows in `cue_sheet` for a spinning flywheel or travelling vehicle brings it to a dead stop at every beat boundary.

**Fix:** Author continuous motion as a single `cue_sheet` row spanning `beat_id` (`scan`, `beat_frac = 0.2`) to `end_beat_id` (`outro`, `end_beat_frac = 0.8`). Both endpoints stay beat-relative, so retiming any intermediate beat preserves smooth momentum across the entire span.

### Never step uncovered

Toggling an actor's visibility or snapping a transform on an uncovered frame produces a 1-frame pop. Either:
1. **Ramp scale or opacity to zero** before the boundary (`curve = 'bump'` or a closing `ease_in_out` ramp to `0.0`), or
2. **Cover a hard world cut with a flash** (`beats.flash_at`, `beats.flash_width`) or a camera hard cut (`shots.cut_kind = 'hard'`).

### Cyclic motion derives from distance travelled, not `t`

Any repeating cycle tied to travel (walking legs, rolling wheels, tank treads) must derive its phase from distance travelled $s(t)$, never raw wall time $t$, and scale its amplitude by a motion envelope matching the travel span (`characters.md`).

---

## Axis 3 — Semantics: what fails when it looks right

### Cover everything except the geometry (`--nocap`)

```bash
mitate sheet shot.db --frac 0.6 --nocap --out sheet_nocap.jpg
```

`--nocap` strips all beat captions and title cards. Inspect `sheet_nocap.jpg` (and mentally mask any 3D `text3d` prop labels) and ask what each beat communicates through geometry, motion, lighting, and staging alone. If two beats look identical without their captions, add a physical state change (a moving payload, an engaging gear, a directional `arrow3d`, or a lighting shift).

### Never eyeball 3D contact from a perspective camera (`mitate probe`)

A perspective camera routinely fakes contact in 2D while the actors miss by a meter along the depth ray. Whenever two objects must touch (feet on the floor, a hand or snout touching a prop, meshing gear teeth), measure their exact 3D world-space AABB separation with `mitate probe`:

```bash
mitate probe shot.db --t load@0.5 --sep collar carrier
```

---

## Determinism rules

1. **Pure function of `t`**: `StageClock(t) -> StageSnapshot(t)` evaluates in $O(1)$ with zero cross-frame state.
2. **Pure GPU kernels (`purity_mode = 'pure_t'`)**: Custom `.metal` functions in `gpu_kernels` must compute output strictly from `StageClock(t)`, immutable initial state buffers, and deterministic `(pixel_xy, sample_idx, random_seed)` hashes.
3. **Stateful simulations bake at build time (`purity_mode = 'baked_sim'`)**: Rigid-body collisions, spring-damper chains, and boid swarms are frozen into `baked_tracks` via `mitate bake shot.db --seed <N>` so runtime `seekTo(t)` remains $O(1)$ and random-access pure.
4. **No temporal accumulation**: Never use temporal denoisers or temporal upscalers that depend on prior frames; `MitateMetal` uses single-frame AOV-guided wavelet denoising and spatial-only scaling.
