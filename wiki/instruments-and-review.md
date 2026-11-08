# CLI Instruments, Situated JSON Telemetry, and the 3-Axis Review Loop (`wiki/instruments-and-review.md`)

> **Scope:** Every `mitate` (aliased as `slate`) CLI command, its JSON telemetry schema, and the mandatory Three-Axis Review Loop before delivering any scene.
> **Not here:** SQLite tables → [`soundstage-schema.md`](soundstage-schema.md); camera solver & shot sizes → [`cinematography-and-rigging.md`](cinematography-and-rigging.md).

---

## 1. Complete `mitate` CLI Reference

All commands accept `<shot.db>` and emit structured JSON on `stdout` so `agy` and Claude Code never have to scrape unstructured log banners.

| Command | Speed | Purpose |
| :--- | :--- | :--- |
| `mitate init <shot.db> [--template 3d\|character\|diagram2d]` | `<10ms` | Create a new `shot.db` initialized with `schema.sql`, default `sizes`, `style_bibles`, and starter `slate` / `finishing_chain`. |
| `mitate schema [table_name]` | `<5ms` | Print exact DDL and `CHECK` constraints for all tables (or one specific table). |
| `mitate recipe [list\|<name>]` | `<5ms` | Print tested SQL + MSL snippets (`low-key-rig`, `cel-outline`, `planetary-gear`, `biped-walk`, `boid-swarm`). |
| `mitate sql <shot.db> "<SQL>"` | `<10ms` | Execute transactional SQL with `PRAGMA foreign_keys = ON` and run fast post-mutation validation. |
| `mitate check <shot.db>` | `<20ms` | Static & semantic linter: beat continuity, shot coverage, jump-cut angle checks, unused actors/shaders, gait envelope alignment, and inert expression checks. |
| `mitate probe <shot.db> --at <t\|beat@u> [--actor <id>] [--unwarp <tsim>]` | `<15ms` | Authoring-time numerical inspection: exact world AABB, pairwise surface clearance/contact distance, and camera screen-space projection `[u, v, depth]`. |
| `mitate bake <shot.db> [--seed <N>] [--hz 60]` | `0.1–2s` | Run deterministic Tier-1 simulation from `t=0..DURATION` and write compressed trajectories into `baked_tracks`. |
| `mitate quad <shot.db> --at <t\|beat@u> --out <quad.jpg>` | `~40ms` | Render 2×2 diagnostic view (**Camera + Top/Front/Side orthographic wireframes with frustum, 3D axes, and AABBs**) + JSON exposure/framing telemetry. |
| `mitate sheet <shot.db> [--nocap] [--cols 4] --out <sheet.jpg>` | `~250ms` | Render contact sheet sampling every beat's midpoint (`--nocap` strips captions/text3d for semantic review) + `sheet.squint.jpg` blurred value-hierarchy companion. |
| `mitate strip <shot.db> --from <beat@u> --to <beat@u> [--frames 12] --out <strip.jpg>` | `~180ms` | Render high-density filmstrip across a motion or cut window + frame-to-frame luminance delta metrics. |
| `mitate smoke <shot.db>` | `~400ms` | Automated gate: forward vs. reverse vs. shuffled `seekTo(t)` byte-determinism, exposure clipping/blackout bounds, caption reading speed, and framing safety. |
| `mitate shoot <shot.db> --out <film.mp4\|film.mov>` | `1–10s` | Render full sequence via `AVAssetWriter` (`H.264`/`HEVC` `.mp4` or 12-bit `ProRes 4444` `.mov`) and log a row in `takes`. |
| `mitate bundle <shot.db> --out <scene.html>` | `<200ms` | Compile `shot.db` (including `baked_tracks`) into a single self-contained WebGPU/three.js HTML file implementing `window.seekTo(t)`, `window.DURATION`, `window.stopPlayback()`, and `window.sceneReady()`. |

---

## 2. Situated JSON Telemetry Format

Every `mitate` command prints its JSON summary **last** on `stdout` (so even if an agent pipes output, the operative payload is never lost) and always includes concrete output file paths (`outputs`):

```json
{
  "ok": true,
  "command": "quad",
  "db": "gearbox.db",
  "t": 3.25,
  "beat": "engage@0.25",
  "outputs": {
    "quad": "renders/engage_quad.jpg"
  },
  "meter": {
    "mean_luminance": 0.21,
    "dynamic_range_stops": 8.4,
    "clipped_white_pct": 0.0,
    "crushed_black_pct": 1.8
  },
  "framing": [
    {
      "actor_id": "sun_gear",
      "screen_bbox": [0.34, 0.28, 0.66, 0.72],
      "in_safe_frame": true,
      "occluded_pct": 0.0
    }
  ],
  "contacts": [
    {
      "pair": ["collar", "planet_carrier"],
      "surface_gap_world": 0.001,
      "contact_state": "touching"
    }
  ],
  "warnings": []
}
```

When a check or constraint fails, `warnings` or `errors` include a **situated pointer** naming the exact SQL fix or wiki section (e.g., `"wiki/cinematography-and-rigging.md#4-parametric-character-rigging-characters"`).

---

## 3. The Mandatory Three-Axis Review Loop

No scene is complete until it passes `mitate smoke` AND has been visually inspected across all three failure axes using `read_file` on the generated images:

### Axis 1: Composition (`mitate quad` + `mitate sheet`)
- **What to check:** Are subjects inside the safe frame (`in_safe_frame: true`)? Does the blurred `*.squint.jpg` companion show a clear focal hierarchy (the hero subject reads first, background does not compete)? Are physical contacts actually touching in all 3 orthographic views of `quad` (not just overlapping in camera projection)?
- **Fix via:** `UPDATE subjects`, `UPDATE shots`, `UPDATE lamps`, or `UPDATE actors`.

### Axis 2: Continuity (`mitate strip`)
- **What to check:** Aim `mitate strip --from <beat@u0> --to <beat@u1>` across the key action window and across shot transitions. Check that planted feet hold their ground position while the body passes over them, rotating parts move monotonically without aliasing jumps, and camera cuts change angle/size cleanly without disorienting pops.
- **Fix via:** `UPDATE cue_sheet`, `UPDATE shots`, or `mitate bake`.

### Axis 3: Semantics (`mitate sheet --nocap` + `mitate smoke`)
- **What to check:** Open the `--nocap` contact sheet (`read_file`). Could a viewer tell what happens in each beat **without reading the captions**? If two beats look identical without their captions, the geometry/staging is not carrying the story—add a visual state change (motion, contact, lighting shift, scale change, or directional `arrow3d`).
- **Delegate Independent Review:** Invoke the `film-reviewer` subagent on finished scenes so a fresh context evaluates the three axes against the rendered evidence.
