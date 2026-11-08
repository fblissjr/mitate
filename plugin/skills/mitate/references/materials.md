# Materials, lighting, and procedural props

> **Not here.** Character rigging and fur shells → `characters.md`; style bibles → `bibles.md`; Metal engine & custom kernels → `webgpu-stack.md`.

`mitate` v2 renders `surface_shaders`, photometric `lamps`, volumetric `atmospheres`, and procedural `props` natively on Apple Silicon Metal (`MitateMetal`) with hardware ray-traced area shadows, reflections, and refraction.

## Shading modes (`surface_shaders.mode`)

| `mode` | Key columns | When to use & craft rules |
|---|---|---|
| `'pbr'` | `albedo`, `roughness`, `metalness`, `clearcoat`, `fuzz_weight`, `fuzz_tint` | Default physical surfaces: brushed metals (`metalness = 0.9, roughness = 0.28`), matte plastics, studio floors, and fabric (`fuzz_weight = 0.8, fuzz_tint = '#ffd9e0'`). |
| `'toon'` | `albedo`, `roughness`, `procedural_kernel` | Cel-shaded 3-band Lambertian step response on an unlit-immune base so ambient/fill light never washes out the bands. Pair with `characters` or inverted-hull outlines. |
| `'sss'` | `albedo`, `subsurface_weight`, `subsurface_mfp_rgb`, `roughness` | Subsurface scattering (skin, wax, leaves, ears). Requires a backlight (`lamps`) behind the subject to read. Use separate rows for thick torso (`subsurface_weight = 0.25`) vs. thin ears/membranes (`subsurface_weight = 0.85`) so the whole body does not glow uniformly. |
| `'glass'` | `albedo`, `ior`, `clarity`, `abbe_dispersion`, `roughness` | Dielectric refractive glass (`ior = 1.5, clarity = 0.95, abbe_dispersion = 0.12`). Evaluated via inline ray tracing, eliminating creation-order sorting artifacts. |
| `'unlit'` | `albedo`, `glow_color`, `glow_nits`, `opacity` | Emissive indicators, HUD markers, laser callouts, and high-contrast graphic shapes. |

```sql
INSERT INTO surface_shaders (id, mode, albedo, roughness, metalness, ior, clarity, abbe_dispersion, glow_color, glow_nits) VALUES
  ('brushed_brass', 'pbr',   '#c9a35c', 0.28, 0.88, 1.5, 0.0,  0.0,  '#000000', 0.0),
  ('skin_thin',     'sss',   '#e8a2a0', 0.48, 0.00, 1.4, 0.0,  0.0,  '#000000', 0.0),
  ('optic_lens',    'glass', '#d6f2ff', 0.05, 0.00, 1.5, 0.95, 0.12, '#000000', 0.0),
  ('signal_pulse',  'unlit', '#ffb45e', 0.20, 0.00, 1.5, 0.0,  0.0,  '#ffb45e', 4.5);
```

## Photometric lighting: the 4-lamp low-key rig (`lamps`)

Lamps attach to `actors` (`role = 'lamp'`) and are specified in physical `lumens` and blackbody color temperature `kelvin` (`1000..40000`). Use `mitate recipe three-point-lights` or this verified 4-lamp ratio:

| Role | `shape` | `kelvin` | Relative `lumens` | Placement & purpose |
|---|---|---|---|---|
| **Key** | `'panel'` | `3400K` (warm) | `1.00×` (e.g. `2400`) | 45° off camera axis, 35° elevation — primary form modeling |
| **Fill** | `'panel'` | `5600K` (neutral) | `0.20×` (`480`) | Opposite side of camera — lifts shadows above `crush_low_pct` without flattening |
| **Rim** | `'spot'` | `7200K` (cool steel) | `0.65×` (`1560`) | Behind subject, aimed so its grazing edge sits on the side the **camera** sees |
| **Practical** | `'bulb'` | `2700K` (amber) | `0.15×` (`360`) | Placed near the active mechanism or contact point |

- **Rim intensity scales with silhouette aspect**: Low, broad quadrupeds need ~30% more rim lumens than tall thin bipeds to separate cleanly in `.squint.jpg`.
- **Fill scales with shot tightness**: At `MCU`/`CU`, check `meter.crush_low_pct` in stdout JSON; if a dark subject turns into an unlit silhouette at close range, raise fill lumens rather than global exposure.

## Procedural explainer & stage primitives (`props`)

Every prop in `props` is generated deterministically from parametric dimensions (zero external asset downloads):
- **Mechanical & diagrammatic primitives**: `'gear'` (`radius_m`, `inner_radius_m`, `tooth_count`, `depth_m`), `'ring'`, `'arrow3d'` (force/flow callouts), `'lathe'`, `'text3d'` (`text_string`, `extrude_m`).
- **Standard primitives**: `'sphere'`, `'cube'`, `'plane'`, `'cylinder'`, `'capsule'`, `'torus'`, `'cone'`.
- **Cutaways & dioramas**: When staging a cross-section (an engine housing, a geological stratum, a database interior), offset internal layers, cavities, and moving payload spheres `0.1–0.3m` **proud** of the slab's front face so they are never occluded or z-fighting.
