# Declarative Cinematography, Subjects, and Character Rigging (`wiki/cinematography-and-rigging.md`)

> **Scope:** How `mitate` v2 translates directorial intent (`style_bibles`, `sizes`, `subjects`, `shots`, `lenses`) into camera matrices and poses parametric characters (`characters`).
> **Not here:** Time & beat math → [`time-and-beats.md`](time-and-beats.md); props, lamps, and shaders → [`soundstage-schema.md`](soundstage-schema.md).

---

## 1. Why Cinematography Is Declarative

An agent should never hand-calculate camera `[tx, ty, tz]` coordinates or guess Euler pitch/yaw angles to frame a subject. In `mitate` v1, hand-computed subject extents and camera positions caused the single largest class of composition defects (cropped heads, missed contact points, and wall-of-rump quadruped framings).

In `mitate` v2, you declare:
1. **What to frame** (`subjects` — referencing an `actor_id` with `auto_bounds = 1`).
2. **How tight to frame it** (`sizes` — `ECU`, `CU`, `MCU`, `MS`, `MWS`, `FS`, `WS`, `EWS`).
3. **From what angle & camera behavior** (`shots` — `angle_deg`, `height_offset`, `move_type`, `energy_override`, `lead_x`, `lead_y`).
4. **Through what physical optics** (`lenses` — `focal_length_mm`, `f_stop`, `focus_actor_id`).

`MitateCore`'s deterministic camera solver computes the exact world-space camera transform at `t`.

---

## 2. Shot Sizes (`sizes`) and the Camera Solver

Each shot size in `sizes` defines `frac` (the fraction of vertical frame height the subject should occupy), pitch limits (`min_pitch`, `max_pitch`), and default `fov_deg`:

| `size_name` | `frac` | Default `fov_deg` | Typical Narrative Function |
| :--- | :--- | :--- | :--- |
| `ECU` | `1.80` | `28°` (85mm) | Micro-detail, gear tooth mesh, eye/hand contact |
| `CU` | `1.10` | `32°` (70mm) | Reaction, key mechanism, isolated callout |
| `MCU` | `0.75` | `38°` (55mm) | Upper body or primary sub-assembly |
| `MS` | `0.55` | `42°` (50mm) | Standard dialogue / interaction waist-up |
| `MWS` | `0.42` | `46°` (40mm) | Two-subject interaction with immediate context |
| `FS` | `0.34` | `50°` (35mm) | Full figure head-to-toe (`h`, `w`, `d` all inside safe frame) |
| `WS` | `0.22` | `58°` (28mm) | Subject in environment, travel/approach |
| `EWS` | `0.12` | `68°` (24mm) | Establishing geography and scale |

### How the Camera Distance $D$ Is Solved
At time `t`, `MitateCore`:
1. Evaluates the target subject's posed world-space bounding box $(W, H, D_{\text{box}})$ at `t` (automatically when `subjects.auto_bounds = 1`, plus any named `pad_val`).
2. Computes the effective projected span $S_{\text{eff}}(\theta)$ for the shot's azimuth `angle_deg` ($\theta$) so wide subjects (like quadrupeds or long assemblies) are never cropped horizontally when viewed from the side:

$$D = \max\left(\frac{H / \text{frac}}{2 \tan(\text{fov}_y / 2)},\; \frac{S_{\text{eff}}(\theta) / \text{frac}}{2 \tan(\text{fov}_x / 2)}\right)$$

3. Applies `lead_x` / `lead_y` screen-space look-room offsets and deterministic handheld/steadicam noise (`style_bibles.camera_energy` or `shots.energy_override`, seeded by `slate.seed`).

> [!IMPORTANT]
> **Purity Rule for `subjects`:** Never read a cached transform from a previous frame when resolving a subject's position. Because `MitateCore` evaluates actors in topological `parent_id` order at `t` *before* running the camera solver at `t`, `auto_bounds = 1` is 100% pure in `t`.

---

## 3. Authoring Shots (`shots` & `lenses`)

```sql
INSERT INTO subjects (id, actor_id, aim_y_frac, auto_bounds, pad_name, pad_val) VALUES
  ('subj_gearbox', 'carrier_root', 0.5, 1, 'housing_clearance', 0.15);

INSERT INTO shots (id, seq, beat_start, beat_end, subject_id, size_name, angle_deg, height_offset, move_type, energy_override, lens_id, cut_reason) VALUES
  ('shot_est',    1, 'establish@0.0', 'establish@1.0', 'subj_gearbox', 'FS',  35.0, 0.25, 'push',   'locked',    'cam_main', 'Establish full housing geometry'),
  ('shot_engage', 2, 'engage@0.0',    'engage@1.0',    'subj_gearbox', 'MCU', -25.0, 0.10, 'orbit', 'steadicam', 'cam_main', 'Show planetary carrier locking');
```

- **Reverse-Angle Rule:** When cutting between two shots on the same or interacting subjects, change `angle_deg` by at least `30°` or change `size_name` by at least two steps so the cut never reads as a jump cut (`mitate check` lints this automatically).
- **Per-Shot Camera Energy (`energy_override`):** Set `'locked'` for technical precision or dramatic stillness, `'steadicam'` for smooth organic drift, or `'handheld'` for kinetic urgency—per shot, without forcing the entire film into one mode.

---

## 4. Parametric Character Rigging (`characters`)

Every character in `mitate` v2 is defined in `characters` as a **proportion vector** (`proportions_json`) plus a **material map** (`material_map_json`), never an external mesh file.

### Coordinate & Rig Conventions
- Characters face **+X** in local space; the sagittal plane is **XY**, and **Z** is lateral.
- `root` places and rotates the character in world space (`actors.tx/ty/tz`).
- `body` (torso, neck chain, head, tail chain) receives bob, lean, and breathing so cosmetic secondary motion never shifts the IK hip/shoulder attach frames—keeping planted feet locked to the ground.
- **Visual Center (`centerX`):** With `auto_bounds = 1` on `subjects`, the solver automatically centers on the character's posed bounding box (including nose-to-tail length for quadrupeds) rather than the pelvis origin.

### Distance-Driven Gait (`s`, Never Raw Wall Time)
Walk cycles derive from **distance travelled $s(t)$**, never raw time $t$, and scale by a motion envelope `vAmp(t)` that matches the exact beat window of travel:

```sql
-- Both travel (tx) and gait envelope (vAmp) use the EXACT same beat window
INSERT INTO cue_sheet (actor_id, property_path, beat_start, beat_end, start_val, end_val, easing_curve) VALUES
  ('walker', 'tx',        'establish@0.35', 'engage@0.95', -4.0, 2.5, 'smoothstep'),
  ('walker', 'gait_vamp', 'establish@0.35', 'engage@0.95',  0.0, 1.0, 'bump');
```

> [!CAUTION]
> **The Skating-Limb Trap:** If `tx` translates across `establish@0.35 -> engage@0.95` while `gait_vamp` only spans `engage@0.0 -> engage@0.95`, the character translates during `establish` with `vAmp == 0` (legs locked straight, skating across the floor). `mitate check` validates that any character with translating `tx`/`tz` has a matching non-zero `gait_vamp` window, and `mitate strip` verifies foot planting visually.
