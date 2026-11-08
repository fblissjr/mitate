# Delivering the scene: HTML bundles and poster stills

> **Not here.** Video recording modes (`MP4`, `HEVC`, `ProRes 4444`) and inline GitHub loops → `recordings.md`; WebGPU/WebGL2 browser runtime details → `webgpu-stack.md`.

From a single `shot.db` soundstage, `mitate` v2 produces two primary deliverables: hardware-encoded video (`mitate shoot`, covered in `recordings.md`) and a single self-contained looping HTML player (`mitate bundle`).

## Self-contained HTML bundle (`mitate bundle`)

```bash
mitate bundle shot.db --out scene.html
```

Compiles `shot.db` — including its declarative `beats`, `shots`, `subjects`, `style_bibles`, procedural `props`, `characters`, `cue_sheet`, and any frozen `baked_tracks` — into one standalone `.html` file with zero external network requests, no CDN links, and no `type="module"` server requirement. Double-click `scene.html` from disk or serve it from any static host.

### The Web Contract (`window.*`)

Every bundled `scene.html` implements the permanent `window.*` contract so external players, test harnesses, and embedding pages can drive any scene without touching scene internals:

- `window.seekTo(t)` — seeks to position `t` (in seconds, `0 <= t <= window.DURATION`) and renders that exact frame deterministically.
- `window.DURATION` — total duration in seconds, derived from `beats` (`SUM(dur_sec)`).
- `window.stopPlayback()` — halts the built-in `requestAnimationFrame` playback loop so an external scrubber or harness can drive `window.seekTo(t)` directly.
- `window.sceneReady()` — returns boolean readiness (`true` once all shaders and buffers are initialized and `seekTo(0)` has warmed the pipeline).

## Poster stills come from the scene, never from a compressed video

To generate a hero still, thumbnail, or reduced-motion fallback image at a specific beat coordinate `beat@frac`, render directly from `shot.db` rather than extracting a lossy frame from an MP4 or AVIF encode.

## Which artifact goes on which surface

| Surface | Deliverable | Command |
|---|---|---|
| Local review, static website, or interactive scrubber | Self-contained `scene.html` | `mitate bundle shot.db --out scene.html` |
| Direct video delivery, presentation, or NLE timeline | Frame-exact `.mp4` or `.mov` (`ProRes 4444`) | `mitate shoot shot.db --mode hero --out film.mp4` |
| GitHub README inline animation (where `<video>` and `<script>` are stripped) | Animated `.avif` or `.webp` | See `recordings.md` |
