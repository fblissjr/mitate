# The SQLite 3 Virtual Soundstage Schema (`wiki/soundstage-schema.md`)

> **Scope:** How physical scene elements—actors, procedural CSG/SDF props, materials, lamps, atmospheres, cues, and post-processing—are stored and mutated in `shot.db`.
> **Not here:** Beats & time-warping → [`time-and-beats.md`](time-and-beats.md); cameras, lenses, subjects, and character rigs → [`cinematography-and-rigging.md`](cinematography-and-rigging.md).

---

## 1. Surgical SQL Authoring Discipline

In `mitate` v2, you never rewrite a whole scene file to change a light, material, or prop. You execute targeted SQL mutations via `mitate sql shot.db "<SQL>"`:
- **Foreign Keys & Check Constraints:** `PRAGMA foreign_keys = ON` is enforced on every connection. Inserting a `prop` with a missing `shader_id` or a `cue_sheet` with an invalid `easing_curve` fails immediately with a situated JSON diagnostic.
- **Inspect Schema On-Demand:** Run `mitate schema [table_name]` to print exact column names and `CHECK` constraints without guessing.

---

## 2. Scene Graph (`slate` & `actors`)

### `slate` (Singleton `id = 1`)
Controls resolution, frame rate, total frame count (automatically synced with `beats` when `beats` is non-empty), deterministic PRNG `seed`, ray-tracing sample counts (`spp_draft`, `spp_final`), and active `style_bible_id`.

```sql
UPDATE slate
SET project_name = 'Planetary Gearbox',
    resolution_x = 1920,
    resolution_y = 1080,
    fps = 24,
    seed = 108
WHERE id = 1;
```

### `actors` (Hierarchical Transform Graph)
Every entity in the world (`prop`, `character`, `camera`, `light`, `swarm`, `volume`, `null`) is first registered in `actors`. Child actors inherit their parent's world transform (`parent_id REFERENCES actors(id)`):

```sql
INSERT INTO actors (id, archetype, parent_id, tx, ty, tz, rx, ry, rz, sx, sy, sz) VALUES
  ('carrier_root', 'null', NULL,           0.0, 1.2, 0.0, 0, 0, 0, 1, 1, 1),
  ('sun_gear',     'prop', 'carrier_root', 0.0, 0.0, 0.0, 0, 0, 0, 1, 1, 1);
```

---

## 3. Procedural Geometry (`props` & `csg_tree`)

`mitate` v2 contains no external `.obj`/`.gltf` asset-fetch path; every prop is defined procedurally via `props.csg_tree` (JSON AST) and tessellated/evaluated natively in `MitateCore`.

### Supported `csg_tree` Primitives
| Primitive `op` | Parameters | Use Case |
| :--- | :--- | :--- |
| `box` | `size: [x, y, z]`, `bevel: r` | Housings, architectural slabs, monoliths |
| `sphere` | `radius: r` | Orbs, joints, celestial bodies |
| `cylinder` | `radius: r, height: h, radial_segments: n` | Shafts, columns, pistons |
| `capsule` | `radius: r, length: l` | Limbs, rounded links, pills |
| `torus` / `ring` | `inner_r: r1, outer_r: r2, height: h, arc_deg: a` | Collars, bearings, callout rings |
| `cone` | `radius_bottom: r1, radius_top: r2, height: h` | Nozzles, frusta, pointers |
| `lathe` | `points: [[r, y], ...], segments: n` | Turned mechanical housings, bells, torsos |
| `extrude` | `polygon: [[x, y], ...], depth: d, bevel: r` | Brackets, plates, custom cross-sections |
| `gear` | `teeth: n, module: m, pressure_angle: 20, thickness: t, bore_r: b` | Exact involute spur/annulus gears |
| `arrow3d` | `from: [x,y,z], to: [x,y,z], shaft_r: r, head_r: hr, head_len: hl` | Force vectors, torque callouts, flow indicators |
| `text3d` | `text: "1:1", font_size: s, depth: d, align: "center"` | Built 3D world-space labels and signs |

### CSG Boolean Operations
Combine primitives with `union`, `subtract`, `intersect`, or `smooth_union` (`k: 0.15`):

```sql
INSERT INTO props (actor_id, csg_tree, shader_id, subdivision_level) VALUES (
  'sun_gear',
  '{"op":"subtract","a":{"op":"gear","teeth":18,"module":0.12,"thickness":0.4},"b":{"op":"cylinder","radius":0.35,"height":0.6}}',
  'brushed_steel',
  1
);
```

---

## 4. Materials (`surface_shaders`)

`surface_shaders` supports four shading models (`CHECK(model IN ('pbr', 'toon', 'subsurface', 'emissive'))`) plus inline MSL procedural surface/displacement hooks:

| Column | Meaning | Notes |
| :--- | :--- | :--- |
| `model` | `'pbr'`, `'toon'`, `'subsurface'`, `'emissive'` | Selects shading evaluation path in `Surface.metal` |
| `base_color_r/g/b` | Linear RGB `[0.0 .. 1.0]` | Base albedo or emissive tint |
| `metallic` | `[0.0 .. 1.0]` | `0.0` dielectric, `1.0` conductor |
| `roughness` | `[0.04 .. 1.0]` | Clamped to `style_bibles.roughness_floor` so specular highlights never alias |
| `subsurface` | `[0.0 .. 1.0]` | Enables thin/thick subsurface scattering when `model = 'subsurface'` |
| `ior` / `transmission` | `ior >= 1.0`, `transmission ∈ [0..1]` | Physical glass/refraction (evaluated via HWRT ray queries, no creation-order sorting bugs) |
| `procedural_code` | Optional MSL snippet | Pure function of `(world_pos, uv, normal, t)` modifying `albedo`/`roughness` |
| `displacement_code` | Optional MSL snippet | Vertex/micro-displacement along normal as a pure function of `(pos, t)` |

---

## 5. Photometric Lighting & Atmosphere (`lamps` & `atmospheres`)

### `lamps`
Lamps attach to an actor in `actors` (so a lamp can be aimed, parented to a moving vehicle, or animated via `cue_sheet`):
- **`type`:** `'area_rect'`, `'spot'`, `'sun'`, `'dome'`, `'point'`
- **`kelvin`:** Color temperature in Kelvin (`1000..20000`, e.g., `3200` warm tungsten key, `5600` daylight, `7500` cool steel rim) converted to linear RGB via Planckian locus.
- **`lumens`:** Photometric luminous flux.
- **`volumetric_dust`:** `[0.0..1.0]` multiplier for God-ray / Froxel scattering contribution.

### `atmospheres`
Configures heterogeneous exponential height fog and Froxel scattering (`fog_density`, `anisotropy` $g \in [-1, 1]$ for Henyey-Greenstein phase function, `base_height`, `falloff`, and `scatter_r/g/b`).

---

## 6. Closed-Form Animation (`cue_sheet`) and Finishing (`finishing_chain`)

### `cue_sheet`
Animates any scalar property path (`tx`, `ty`, `tz`, `rx`, `ry`, `rz`, `sx`, `sy`, `sz`, `scale_gate`, `lumens`, `focus_distance`, `exposure_ev`) over a beat window (`beat_start`, `beat_end`) or frame span (`frame_start`, `frame_end`):
- **Interpolated cues:** Specify `start_val`, `end_val`, and `easing_curve` (`'linear'`, `'smoothstep'`, `'ease_in_expo'`, `'ease_out_back'`, `'spring_damped'`).
- **Procedural expressions:** Specify `procedural_expr` (e.g., `'t * 120.0'` for constant angular rotation, or `'sin(t * 3.14159) * 0.25'`).

### `finishing_chain`
Singleton (`id = 1`) configuring deterministic post-processing:
- **`tone_mapper`:** `'aces_cg'` (default), `'agx_punchy'`, `'filmic_neutral'`, or `'khronos_pbr'`.
- **`exposure_ev`**, **`contrast`**, **`saturation`**, **`bloom_intensity`**, **`bloom_threshold`**, **`chromatic_aberration`**, **`film_grain_intensity`** (seeded by `slate.seed`), and **`vignette_weight`**.
