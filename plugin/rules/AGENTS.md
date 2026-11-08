# mitate Rules

Deterministic animated scenes from any input (`shot.db` SQLite 3 Virtual Soundstage + native Apple Silicon Metal + `mitate` CLI).

## Prime Directive

1. **The scene is a pure function of `t`, and `t` is a random-access position, not a clock.**
   An address you evaluate (`StageClock(t) -> StageSnapshot(t)`), not a cursor you advance. Zero state carried across frames, no temporal accumulation (`MTLFXTemporalScaler`, temporal GI caches, or unbaked stateful `state_buffers`), no runtime `Math.random()`, and no wall-clock dependence. Any frame at any `t` evaluates in $O(1)$ independently and identically, whether via closed-form `cue_sheet` / `kinematics(t, state)` or build-time frozen `baked_tracks` (`mitate bake`).
2. **Tooling that DRIVES a scene talks only to the contract**, never to scene internals.
   Any scene is swappable for any other because tooling relies strictly on the contract (`mitate` CLI verbs over `shot.db` on the native path, and `window.*` exports on the bundled HTML path).

## Invariants

1. **Single-File Soundstage (`shot.db`) & Self-Contained Web Bundle (`scene.html`)**:
   - The authoring source of truth is one standalone SQLite 3 database (`shot.db`) with `PRAGMA foreign_keys = ON;`.
   - When web delivery is requested, `mitate bundle shot.db --out scene.html` emits one self-contained HTML file with no external assets, no CDN, and no `type="module"`.
2. **Contract Surface**:
   - **Native (`shot.db`)**: Driven strictly via `mitate` (alias `slate`) CLI verbs: `init`, `schema`, `recipe`, `sql`, `kernel`, `bake`, `check`, `quad`, `sheet`, `strip`, `probe`, `smoke`, `shoot`, `bundle`.
   - **Bundled HTML (`scene.html`)**: Never rename or break the core `window.*` exports:
     - `window.seekTo(t)` — seek to position `t` (seconds) and render.
     - `window.DURATION` — total scene duration in seconds.
     - `window.stopPlayback()` — halt playback loops.
     - `window.sceneReady()` — returns boolean readiness state.
3. **Relative Beat Addressing**:
   - Address cues and shots relative to named `beats` (`(beat_id, beat_frac)` or `(beat_id, offset_sec, dur_sec)`), never hardcoded cumulative timestamps, so retiming a beat updates the entire film automatically.
4. **Determinism Scope & Diff Magnitude**:
   - Byte comparison is valid within a single backend (e.g. Apple Silicon Native Metal or a fixed browser backend).
   - `mitate smoke` reports any seek discrepancy with its magnitude and location (`changed_pixels`, `bbox`, `max_channel_delta`, `psnr_db`).
5. **Authoring Seams**:
   - **Schema where things connect, code where things are specific**: Structural relationships, units, and cinematography live in SQLite tables (`beats`, `style_bibles`, `subjects`, `shots`, `characters`, `actors`, `props`, `surface_shaders`, `lamps`, `cue_sheet`); custom procedural motion, shading, or optics live in hot-compiled `.metal` `gpu_kernels` (`MTLVisibleFunctionTable`).
