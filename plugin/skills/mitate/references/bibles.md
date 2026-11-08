# Style bibles: the whole look is one row

> **Not here.** Material modes and lighting recipes → `materials.md`; shot vocabulary → `film-language.md`; SQLite schema columns → `breakdown.md`.

A style bible is a single row in `style_bibles` that constrains everything about a film's look — backdrop, exposure, color transform, default focal length, camera energy, cut pace, bloom, depth of field, and `palette_json` — switched by updating one column on `slate`:

```sql
UPDATE slate SET active_bible = 'neon' WHERE id = 1;
```

## Built-in style bibles (`style_bibles`)

Every `shot.db` initialized by `mitate init` includes four baseline rows in `style_bibles`:

| `id` | `backdrop_mode` / `backdrop_color` | `color_transform` | `lens_mm` | `camera_energy` | Register |
|---|---|---|---|---|---|
| `workshop` | `solid_color` (`#141619`) | `agx` | `50.0` | `locked` | Lit machine-shop / studio stage (steel, brass, warm key + cool fill) |
| `neon` | `solid_color` (`#090a10`) | `agx_punchy` | `35.0` | `steadicam` | High-contrast dark stage where silhouettes and emissive `glow_nits` carry the read |
| `daylight` | `physical_sky` (`#87ceeb`) | `agx` | `50.0` | `locked` | Exterior daylight with Hosek-Wilkie physical sky and sun |
| `paper` | `solid_color` (`#f4f1ea`) | `filmic` | `50.0` | `locked` | High-key diagrammatic / editorial stage with crisp ink contrast |

## Customizing or adding a style bible

```sql
INSERT INTO style_bibles (
  id, backdrop_mode, backdrop_color, exposure_ev, contrast,
  color_transform, lens_mm, camera_energy, sway_amp,
  cut_whip_sec, cut_blend_sec, bloom_strength, bloom_threshold,
  dof_fstop, palette_json
) VALUES (
  'cyber_cutscene', 'solid_color', '#07090f', 0.2, 1.15,
  'agx_punchy', 40.0, 'steadicam', 0.8,
  0.16, 0.80, 0.65, 0.75,
  2.8, '{"hero":"#ffb45e","accent":"#2a9d8f","rim":"#6f93c4"}'
);

UPDATE slate SET active_bible = 'cyber_cutscene' WHERE id = 1;
```

## Register rules

- **One active bible per film (`slate.active_bible`).** A bible constrains *how* things look, never *what* is on stage. Switching `slate.active_bible` from `'workshop'` to `'neon'` re-renders the exact same beats, geometry, and shots in a new register without breaking determinism.
- **The bible owns post-processing defaults.** Dark emissive registers (`neon`) enable `bloom_strength > 0` and budget `surface_shaders.glow_nits` so only the hero callouts cross `bloom_threshold`. Pale/lit registers (`paper`, `daylight`) keep `bloom_strength = 0.0` to avoid halating bright backgrounds.
- **Camera energy is register, not decoration.** Technical explainers and diagrams read clearest with `camera_energy = 'locked'` or low-amplitude `'steadicam'`; reserve `'handheld'` for moments where narrative instability is the point.
