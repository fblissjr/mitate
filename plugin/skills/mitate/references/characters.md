# The character scaffold (`characters`)

> **Not here.** Surface shaders and lighting → `materials.md`; per-beat motion and continuity rules → `method.md`; camera framing and `angle_deg` → `film-language.md`.

Every articulated figure in `mitate` v2 is a row in `characters` attached to an actor (`actors.role = 'rig'`) — defined by a **proportion vector**, a **shader map** (`shader_map_json`), optional **shell fur** (`fur_shells`), and **distance-driven analytic IK gait** (`walk_start_x`, `stride_m`, `step_lift_m`). Never fetch external character meshes.

## Conventions

- **Facing `+X`**: Characters face **`+X`** in local space; the sagittal plane is `XY` and `Z` is lateral. In `shots`, `angle_deg = 90` frames the face frontally, `55` or `125` frames a 3/4 front view, `0` or `180` frames profile, and `-90` frames the back of the head (`film-language.md`).
- **Hierarchy & `auto_bounds`**: `actors` holds the root world transform (`x, y, z, yaw_deg`). When a `subjects` row targets a character actor with `extent_mode = 'auto_bounds'`, `MitateCore` automatically bounds the full posed figure (including nose-to-tail length for quadrupeds) so the camera aims at the visual center rather than cropping the head.

## Proportion vector (`characters`)

```sql
INSERT INTO actors (id, role, x, y, z) VALUES ('bear', 'rig', -3.0, 0.0, 0.0);

INSERT INTO characters (
  actor_id, preset, quadruped,
  hip_h, torso_len, torso_tilt_deg, pelvis_r, chest_r,
  shoulder_w, hip_w, neck_len, neck_segs, head_r, muzzle_len,
  tail_len, tail_segs,
  fore_upper, fore_lower, fore_r,
  hind_upper, hind_lower, hind_r,
  foot_len, foot_h,
  fur_shells, fur_length_m,
  walk_start_x, stride_m, step_lift_m,
  shader_map_json
) VALUES (
  'bear', 'quadruped', 1,
  1.85, 2.40, 80.0, 0.95, 1.05,
  1.60, 1.50, 0.85, 2, 0.62, 0.55,
  0.50, 2,
  1.20, 1.15, 0.34,
  1.10, 1.05, 0.38,
  0.65, 0.22,
  8, 0.04,
  -3.0, 1.25, 0.16,
  '{"default":"bear_coat","muzzle":"bear_snout"}'
);
```

### Anatomical constraints enforced by `mitate check`
1. **Hind leg reach**: `hind_upper + hind_lower > hip_h` (prevents hyperextension lock).
2. **Quadruped foreleg reach**: When `quadruped = 1`, `fore_upper + fore_lower` must reach the floor from shoulder height (`hip_h + cos(torso_tilt_deg) * torso_len`).
3. **Biped arm clearance**: When `quadruped = 0`, keep `shoulder_w / 2.0 > chest_r + fore_r * 0.4` so hanging arms do not embed in the torso.

## Distance-driven gait (never raw wall time `t`)

Walk cycles derive from **distance travelled** $s(t) = x(t) - \text{walk\_start\_x}$ along the character's own plant grid (`stride_m`, `step_lift_m`), never from wall time `t`. When the character stops translating, its feet remain planted on the floor.

- **Biped phase (`quadruped = 0`)**: Hind legs alternate at phases `0.0` and `0.5`; forelimbs hang as arms and swing in counter-phase.
- **Quadruped lateral-sequence phase (`quadruped = 1`)**: `HL = 0.0`, `FL = 0.25`, `HR = 0.50`, `FR = 0.75`.
- **Match travel and gait envelope windows**: When a walk spans multiple beats in `cue_sheet`, anchor the translation cue and any gait envelope to the **exact same** `(beat_id, beat_frac)` and `(end_beat_id, end_beat_frac)` pair. Verify foot planting across frames with `mitate strip`.
- **Every character owns its own grid**: When two characters walk in the same scene, each row in `characters` has its own `walk_start_x`, `stride_m`, and `hip_h` — never share one character's gait parameters with another body.

## Shell fur (`fur_shells`) and scene features

- **Shell fur**: Setting `fur_shells > 0` (e.g. `8`, `fur_length_m = 0.04`) generates concentric normal-displaced shell layers using deterministic alpha-test discard seeded by `(vertex_id, shell_idx)` — 100% order-independent and byte-deterministic.
- **Costume & facial features**: Parent child `actors` (`role = 'prop'`) to the character rig for eyes, ears, hats, or held props. Position eyes proud of `head_r` (`head_r + lift`) so facing direction reads immediately even in wide shots, and verify all physical contacts with `mitate probe`.
