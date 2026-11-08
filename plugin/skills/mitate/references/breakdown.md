# Breakdown: the declarative soundstage schema

> **Not here.** Authoring workflow and failure axes → `method.md`; shot grammar and framing rules → `film-language.md`; look presets → `bibles.md`; character rigging → `characters.md`; material modes and lighting → `materials.md`; what `mitate check` validates → `instruments.md`.

Every `mitate` v2 scene is a standalone SQLite 3 database (`shot.db`) with `PRAGMA foreign_keys = ON`. You can inspect the exact DDL and copy-pasteable SQL examples at any time via `mitate schema [table_name]`.

## Two layers in one `shot.db`

| Table | Layer | What it declares | Validated by |
|---|---|---|---|
| `beats` (`v_beats`) | Declarative Intent | Named narrative spans (`id`, `seq_order`, `dur_sec`, `caption`, `flash_at`, `flash_width`) | `CHECK (dur_sec > 0)`, `UNIQUE(seq_order)`, `mitate check` CPS lint |
| `style_bibles` | Declarative Intent | Coherent look preset (`backdrop_mode`, `exposure_ev`, `color_transform`, `lens_mm`, `camera_energy`, `bloom_*`, `dof_fstop`, `palette_json`) | `CHECK` constraints, `slate.active_bible` FK |
| `sizes` | Declarative Intent | Kit-owned shot-size ladder (`EWS`, `WS`, `FSA`, `FS`, `MS`, `MCU`, `CU`, `ECU`) with `frame_frac` and `anchor_y` | Primary key & `shots.size_rung` FK |
| `characters` | Declarative Intent | Parametric skeleton & shell proportions, `fur_shells`, and distance-driven gait (`walk_start_x`, `stride_m`, `step_lift_m`) | `CHECK` reachability & `mitate check` gait-window lint |
| `subjects` | Declarative Intent | Framing targets (`actor_id`, `member_actors_json`, `extent_mode = 'auto_bounds'`, `headroom_m`) | FK + runtime 3D AABB derivation in `MitateCore` |
| `shots` | Declarative Intent | Shot list (`beat_id`, `beat_frac`, `subject_id`, `size_rung`, `angle_deg`, `elev_deg`, `cut_kind`, `match_prev`, `focus_subject_id`) | FK + `mitate check` ordering, `match_prev`, and jump-cut lint |
| `warp_segments` | Declarative Intent | Presentation time-warps (`beat_id`, `beat_frac`, `dur_sec`, `rate`) | `CHECK (dur_sec > 0 AND rate >= 0)` |
| `baked_tracks` | Declarative Intent | Frozen trajectories produced by `mitate bake` (`target_domain`, `target_id`, `sample_hz`, `samples_blob`) | `inputs_sha256` freshness check in `mitate check` |
| `slate` | Physical Stage | Singleton project settings (`width`, `height`, `fps`, `active_bible`, `random_seed`) | `CHECK (id = 1)` |
| `actors` | Physical Stage | Right-handed Y-up hierarchy (`id`, `parent_id`, `role`, `x,y,z`, `pitch_deg,yaw_deg,roll_deg`, `scale_x,y,z`, `aim_at`) | Self-referential FK + cycle check |
| `props` | Physical Stage | Procedural shapes (`sphere`, `cube`, `plane`, `cylinder`, `capsule`, `torus`, `cone`, `ring`, `gear`, `arrow3d`, `lathe`, `text3d`) | `CHECK` shape enum + `shader_id` FK |
| `surface_shaders` | Physical Stage | Material definitions (`mode IN ('pbr','toon','sss','glass','unlit')`, `albedo`, `roughness`, `metalness`, `ior`, `glow_nits`) | `CHECK` ranges + `procedural_kernel` FK |
| `lamps` & `atmospheres` | Physical Stage | Photometric area/spot/sun lights (`lumens`, `kelvin`, `cone_deg`) and volumetric haze (`haze_box`, `global_mist`) | `CHECK (lumens >= 0 AND kelvin BETWEEN 1000 AND 40000)` |
| `cue_sheet` | Physical Stage | Beat-relative animation spans (`beat_id`, `beat_frac`, `end_beat_id`, `end_beat_frac`, `target_domain`, `target_id`, `property_path`, `value_num`, `curve`) | Beat FKs + property path validator in `mitate check` |
| `gpu_kernels` | Physical Stage | Custom `.metal` `[[visible]]` functions (`hook_slot`, `purity_mode`, `entry_symbol`, `msl_source`) | ~25ms Metal JIT compiler + `baked_sim` check |

---

## Key table contracts

### `beats` and `v_beats`
Never store cumulative start or end times in `beats`. `v_beats` computes `t0` and `t1` automatically from `SUM(dur_sec) OVER (ORDER BY seq_order)`. Total scene `DURATION` is `MAX(t1)` from `v_beats`.

### `subjects` (`auto_bounds` by default)
In `mitate` v1, hand-declared subject extents (`h`, `w`, `d`) drifted from actual geometry more often than any other declaration. In `mitate` v2, `subjects.extent_mode` defaults to `'auto_bounds'`: `MitateCore` evaluates the posed world-space 3D bounding box of `actor_id` (or the union of `member_actors_json`) at timestamp `t` before solving the camera transform, adding `headroom_m`. If you ever use `extent_mode = 'declared_named'`, `extent_note` must name the geometric derivation.

### `cue_sheet`
Each row animates a scalar property path (such as `x`, `y`, `z`, `pitch_deg`, `yaw_deg`, `roll_deg`, `scale_x`, `scale_y`, `scale_z`, `lumens`, `exposure_ev`) across a beat window:
- Single-beat cue: set `beat_id` and `beat_frac` (with `dur_sec` or `end_beat_frac`).
- Multi-beat continuous cue: set `beat_id`, `beat_frac` and `end_beat_id`, `end_beat_frac` so motion crosses beat boundaries without decelerating to zero in the middle.
- Supported `curve` values: `'ease_in_out'`, `'linear'`, `'ease_in'`, `'ease_out'`, `'hold_step'`, `'spring'`, `'bump'`.
