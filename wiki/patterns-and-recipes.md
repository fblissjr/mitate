# Tested Patterns, SQL + MSL Recipes, and Visual Traps (`wiki/patterns-and-recipes.md`)

> **Scope:** Copy-pasteable SQL + MSL recipes (`mitate recipe <name>`) and hard-won visual lessons distilled from the `mitate` corpus and postmortems.
> **Not here:** Full schema DDL → [`soundstage-schema.md`](soundstage-schema.md); CLI flag reference → [`instruments-and-review.md`](instruments-and-review.md).

---

## 1. The 4-Lamp Low-Key Rig (`mitate recipe low-key-rig`)

Tested across multiple corpus films: a reliable cinematic lighting setup depends on **lumen ratios and Kelvin separation**, not cranking one light until it clips.

| Role | `type` | `kelvin` | Relative `lumens` Ratio | Placement Relative to Subject |
| :--- | :--- | :--- | :--- | :--- |
| **Key** (`lamp_key`) | `area_rect` | `3400K` (warm) | `1.00×` (e.g., `2400 lm`) | $45^\circ$ off camera axis, $35^\circ$ elevation |
| **Fill** (`lamp_fill`) | `area_rect` | `5600K` (neutral) | `0.20×` (`480 lm`) | Opposite side of camera, wide `softness = 0.85` |
| **Rim / Back** (`lamp_rim`) | `spot` | `7200K` (cool steel) | `0.65×` (`1560 lm`) | Behind subject ($\sim 155^\circ$), separates silhouette from dark background |
| **Practical / Accent** (`lamp_acc`) | `point` | `2700K` (amber) | `0.15×` (`360 lm`) | Near the mechanism/contact point being explained |

```sql
INSERT INTO actors (id, archetype, tx, ty, tz, rx, ry, rz) VALUES
  ('lamp_key',  'light',  4.5, 5.2,  4.0, -38,  42, 0),
  ('lamp_fill', 'light', -5.0, 3.0,  4.5, -20, -45, 0),
  ('lamp_rim',  'light', -2.5, 4.5, -4.5, -35, 155, 0);

INSERT INTO lamps (actor_id, type, kelvin, lumens, spread_angle, softness, volumetric_dust) VALUES
  ('lamp_key',  'area_rect', 3400, 2400.0, 65.0, 0.55, 0.15),
  ('lamp_fill', 'area_rect', 5600,  480.0, 90.0, 0.85, 0.05),
  ('lamp_rim',  'spot',      7200, 1560.0, 40.0, 0.35, 0.30);
```

---

## 2. Cel / Toon Shading with Inverted-Hull Outline (`mitate recipe cel-outline`)

Quantizes key-light Lambertian response into three crisp value bands without ambient washout, paired with a `style_bibles.outline_width` inverted-hull pass:

```sql
UPDATE style_bibles SET outline_width = 0.035 WHERE id = 'default';

INSERT INTO surface_shaders (id, model, base_color_r, base_color_g, base_color_b, roughness, procedural_code) VALUES (
  'cel_amber',
  'toon',
  0.85, 0.46, 0.18,
  0.6,
  'float3 shadow = float3(0.54, 0.25, 0.11);
   float3 mid    = float3(0.85, 0.46, 0.18);
   float3 high   = float3(1.00, 0.71, 0.37);
   albedo = mix(mix(shadow, mid, step(0.33, ndotl)), high, step(0.72, ndotl));'
);
```

---

## 3. Subsurface Scattering (`mitate recipe sss-skin`)

Subsurface scattering (`model = 'subsurface'`) only reads visually when:
1. A rim/back light sits **behind** the subject (`lamp_rim`).
2. Thin geometry (ears, membranes, petals) uses a higher `subsurface` scale (`0.85`) than thick body parts (`0.25`), so the entire torso does not glow like a lightbomb.

```sql
INSERT INTO surface_shaders (id, model, base_color_r, base_color_g, base_color_b, roughness, subsurface) VALUES
  ('skin_thick', 'subsurface', 0.91, 0.64, 0.63, 0.55, 0.25),
  ('skin_thin',  'subsurface', 1.00, 0.37, 0.27, 0.45, 0.85);
```

---

## 4. Presence Gating (`scale_gate` vs. `visible`)

When an actor appears or disappears mid-beat (e.g., a callout arrow, a spawned packet, or an exploded-view label), animate `scale_gate` in `cue_sheet` (`0.0 -> 1.0` with `'ease_out_back'` or `'smoothstep'`):
- `MitateCore` automatically sets `visible = 0` when `scale_gate < 1e-4` (so hidden objects cast zero HWRT shadows and cost zero ray intersections) and scales uniformly by `scale_gate` when `>= 1e-4`.
- This replaces the two conflicting hand-rolled idioms from v1 (`clamp(sc, .001, 1)` vs. `Math.max(1e-4, ...)`).

```sql
INSERT INTO cue_sheet (actor_id, property_path, beat_start, beat_end, start_val, end_val, easing_curve) VALUES
  ('torque_arrow', 'scale_gate', 'engage@0.15', 'engage@0.30', 0.0, 1.0, 'ease_out_back');
```

---

## 5. High-Frequency Visual Traps & How `mitate` v2 Prevents Them

| Trap Observed in v1 Corpus | Root Cause | Prevention in `mitate` v2 |
| :--- | :--- | :--- |
| **False 2D Contact ("Touching in Camera, Missing in Depth")** | Two actors overlap in the camera's 2D projection while separated by `1.5m` along the camera's view ray. | Inspect `mitate quad` (Top/Front/Side ortho views) and check `contacts[].surface_gap_world` in the JSON output (`mitate probe`). |
| **Cropped Payoff / Wrong Hand-Computed Extent** | Author guessed `h: 3.6` for a rig whose actual posed height was `4.79`, cropping the top `25%` in `FS`. | Set `subjects.auto_bounds = 1` (the default). `MitateCore` measures the exact posed 3D AABB at `t` before solving camera distance. |
| **Quadruped "Wall of Rump" Framing** | Camera aimed at `root` (pelvis) instead of the nose-to-tail bounding box center, and ignored horizontal width `w`. | `auto_bounds = 1` centers on the full posed AABB `(W, H, D)` and uses $S_{\text{eff}}(\theta)$ across azimuth $\theta$. |
| **Skating Limbs Across Beat Boundaries** | Character `tx` translated from `beat1@0.35 -> beat2@0.95`, while `gait_vamp` only spanned `beat2`. | Always anchor `tx`/`tz` and `gait_vamp` to the exact same `beat_start` and `beat_end`. `mitate check` flags mismatched travel/gait windows. |
| **Caption Occluding World Payoff on Push-In** | A camera push-in slid key diagram labels or geometry into the bottom `10%` caption safe band. | `mitate check` and `mitate smoke` check `framing[].screen_bbox` against the bottom caption safe zone (`y > 0.88`) whenever a beat carries a non-empty `caption`. |
