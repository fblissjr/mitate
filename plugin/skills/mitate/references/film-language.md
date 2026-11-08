# Film language: shots as declarative data

> **Not here.** Schema tables and column types → `breakdown.md`; review passes → `method.md`; style bibles → `bibles.md`; character rigging → `characters.md`.

`mitate` v2 describes framing the way a cinematographer does — subjects, shot sizes, azimuth/elevation angles, lenses, cuts, and focus — in the `subjects` and `shots` tables of `shot.db`, compiled into exact camera and lens transforms at every `t` by `MitateCore`'s deterministic camera solver.

## `subjects` — what the camera frames

```sql
INSERT INTO subjects (id, actor_id, extent_mode, headroom_m) VALUES
  ('hero_gear', 'drive_gear', 'auto_bounds', 0.15);

-- Group / two-shot union subject:
INSERT INTO subjects (id, member_actors_json, extent_mode, headroom_m) VALUES
  ('duel_pair', '["walker_a", "walker_b"]', 'auto_bounds', 0.25);
```

- **Default to `extent_mode = 'auto_bounds'`**: `MitateCore` computes the exact posed 3D world-space AABB $(W, H, D)$ of `actor_id` or `member_actors_json` at shot time `t` in topological parent-before-child order, so camera solving is 100% pure in `t` and never crops a tall prop or wide quadruped.
- **Projected width fit ($W, D$ across `angle_deg`)**: The solver rotates the horizontal footprint $(W, D)$ by the shot's azimuth `angle_deg` and binds camera distance on whichever axis (vertical height vs. horizontal projected width) is tighter against `slate.width / slate.height`. Wide assemblies, timelines, and quadrupeds stay inside the safe frame at any angle.

## `sizes` — the shot-size ladder

Kit-owned in `sizes`, calibrated to standard cinematographic meaning:

| `rung` | `frame_frac` (`subject_h / frame_h`) | `anchor_y` | Reads as |
|---|---|---|---|
| `EWS` | `0.20` | `0.50` | Extreme Wide Shot — speck in the environment |
| `WS` | `0.50` | `0.50` | Wide Shot — full body with generous air |
| `FSA` | `0.70` | `0.50` | Full Shot Air — full body with breathing room (workhorse) |
| `FS` | `0.95` | `0.50` | Full Shot — full body head-to-toe tight |
| `MS` | `1.60` | `0.68` | Medium Shot — waist up |
| `MCU` | `2.40` | `0.78` | Medium Close-Up — chest up |
| `CU` | `3.60` | `0.84` | Close-Up — head or primary mechanism |
| `ECU` | `6.00` | `0.88` | Extreme Close-Up — micro detail or contact point |

- **A rung is relative to the declared subject, not the whole figure.** If you declare a sub-subject around a character's head or a single gear tooth, frame that sub-subject with `FSA` or `FS` — using `CU` on an already small sub-subject compounds twice and pushes the camera inside the mesh.
- **Union subjects (`member_actors_json`) take wide rungs (`WS`, `FSA`, `FS`)** or an explicit `shots.anchor_y` override, because a union box of two actors has no shared waist for `MS` to aim at (`mitate check` warns if you use a tight body-landmark rung on a union without `anchor_y`).

## `shots` — the shot list

```sql
INSERT INTO shots (seq_order, beat_id, beat_frac, subject_id, size_rung, angle_deg, elev_deg, cut_kind, focus_subject_id) VALUES
  (1, 'intro',  0.0, 'hero_gear', 'FSA', 35.0, 12.0, 'hard',  'hero_gear'),
  (2, 'engage', 0.0, 'hero_gear', 'MCU', -25.0, 8.0, 'blend', 'hero_gear');
```

### `angle_deg` composed with subject facing (`+X`)
The solver places the camera at azimuth `angle_deg` around the subject's center (`0°` = from `+Z`, `90°` = from `+X`, `-90°` = from `-X`). Because parametric characters in `characters` face **`+X`** (`characters.md`):
- `angle_deg = 90` is dead-on **frontal** (face).
- `angle_deg = 55` or `125` is a **3/4 front** shot.
- `angle_deg = 0` or `180` is a **profile** shot.
- `angle_deg = -90` shoots the **back of the head**.

Always compose the subject's world yaw with `angle_deg`, and verify in `mitate quad` that the camera frustum looks at the intended face.

### Cuts (`cut_kind` and `match_prev`)
- `'hard'` (default): Instantaneous cut on the frame `beat_id@beat_frac` begins.
- `'whip'`: Fast snap transition over `style_bibles.cut_whip_sec` (`0.16s`).
- `'blend'`: Smooth dolly-morph over `style_bibles.cut_blend_sec` (`0.80s`).
- `match_prev = 1`: Enforces a match cut — `size_rung`, `angle_deg`, `elev_deg`, `fov_mm`, and `anchor_y` must match the preceding shot (`mitate check` validates this before rendering).

### Rack focus (`focus_subject_id` and `dof_fstop`)
When `style_bibles.dof_fstop` (or `lenses.f_stop`) is active, each shot focuses on `focus_subject_id` (defaulting to `subject_id`). A **rack focus** is two adjacent rows in `shots` with identical framing (`match_prev = 1`) and `cut_kind = 'blend'`, differing only in `focus_subject_id` — the focal plane interpolates smoothly from the first subject to the second across the blend window.

### Stage across the line, not down it
When framing two interacting subjects, choose an `angle_deg` that looks **across** the axis connecting them rather than down it, so both silhouettes read clearly with visible separation between them.
