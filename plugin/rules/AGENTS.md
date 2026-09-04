# mitate Rules

Deterministic animated scenes from any input.

## Prime Directive

1. **The scene is a pure function of `t`, and `t` is a position, not a clock.**
   An address you evaluate, not a cursor you advance. No state carried across frames, no `Math.random()` at runtime, no wall-clock dependence. Any frame renders independently and identically.
2. **Tooling that DRIVES a scene talks only to the window contract**, never to scene internals.
   Any scene is swappable for any other because tooling (recorders, review gates, showcase sites) relies strictly on the window contract.

## Invariants

1. **Self-containment**: One scene = one self-contained HTML file. three.js is embedded per file via `build.js vendor`. No CDN, no `type="module"`, no sibling `.js`.
2. **Window Contract**: Never rename or break the core `window.*` exports:
   - `window.seekTo(t)` — seek to position `t` (seconds) and render.
   - `window.DURATION` — total scene duration in seconds.
   - `window.stopPlayback()` — halt playback loops.
   - `window.sceneReady()` — returns boolean readiness state.
3. **Determinism Scope**: Byte comparison is valid only within the same backend (e.g. WebGPU-Metal or WebGL2 fallback). WebGPU-Metal and WebGL2 legitimately disagree per pixel.
4. **Authoring Seams**:
   - Schema where things connect, code where things are specific.
   - Edit canonical fences only in `templates/fences/<NAME>.fence.txt` using `smoke.js --parity-fix`; never hand-edit a fence marker inside a carrier.
