last updated: 2026-11-08

# mitate

Deterministic animated scenes from any input — a prompt, a document, a codebase, a mechanism, a screenshot, or a story beat — built on the **`mitate` v2 (Slate)** architecture: a **single-file SQLite 3 Virtual Soundstage (`shot.db`)**, a **native Apple Silicon Swift 6 + Metal 3/4 rendering engine (`MitateCore` + `MitateMetal`)**, and a **self-contained HTML exporter (`mitate bundle`)**.

*mitate* (見立て): to see one thing as another — the Japanese aesthetic of representing one thing through another. Here, seeing any input as a scene.

**Why it is built this way, and why determinism comes first**, is [`VISION.md`](VISION.md) — one page, and the thing to read before deciding this project is just a video generator.

## The Prime Directive

1. **Every scene is a pure function of `t` — and `t` is a random-access position, not a clock.**
   It is an address you evaluate (`StageClock(t) -> StageSnapshot(t)`), not a cursor you advance: zero state carried across frames, no temporal accumulation (`MTLFXTemporalScaler`, temporal GI caches, or unbaked stateful buffers), no runtime `Math.random()`, and no wall-clock dependence. Motion is either closed-form (`cue_sheet` + pure `.metal` `kinematics` kernels) or frozen at build time into `baked_tracks` via `mitate bake`. Any `t`, in any order, as many times as you like, evaluates in $O(1)$ and produces the exact same pixels.
2. **Tooling that drives a scene talks only to the contract**, never to scene internals:
   - **Native contract (`shot.db`)**: Driven strictly via `mitate` (alias `slate`) CLI verbs (`init`, `schema`, `recipe`, `sql`, `kernel`, `bake`, `check`, `quad`, `sheet`, `strip`, `probe`, `smoke`, `shoot`, `bundle`).
   - **Web contract (`scene.html` via `mitate bundle`)**: `window.seekTo(t)`, `window.DURATION`, `window.stopPlayback()`, `window.sceneReady()`.

## Why SQLite (`shot.db`) + Native Apple Silicon Metal

- **Surgical 1-line SQL mutations**: Instead of rewriting a 1,500-line HTML file to adjust a light, retime a beat, or tweak a character's stride, an agent runs `mitate sql shot.db "UPDATE lamps SET lumens=2800 WHERE actor_id='key'"`, validated immediately by SQLite `FOREIGN KEY` and `CHECK` constraints.
- **Relative beat addressing (`beats` & `v_beats`)**: Every shot and animation cue anchors to `(beat_id, beat_frac)`. Retiming a beat in `beats` shifts every downstream cue and transition automatically.
- **Auto-derived subject bounds (`auto_bounds`)**: `MitateCore` computes the exact posed 3D world-space bounding box of any actor, character rig, or group at shot time `t` before solving camera framing (`SIZES`: `EWS`, `WS`, `FSA`, `FS`, `MS`, `MCU`, `CU`, `ECU`).
- **Schema at the seam, code in the leaf**: Structural relationships live in SQLite tables; custom procedural motion, volumetric media, or shading hooks compile in ~25ms from `.metal` `[[visible]]` functions into `MTLVisibleFunctionTable` (`gpu_kernels`).
- **Situated JSON telemetry + Three-Axis Review**: Every `mitate` command prints structured JSON (`meter`, `framing`, `contacts`, `lint`) to stdout. Scenes are verified across **Composition** (`quad` + `sheet` at `0.6` and `0.95` + `.squint.jpg`), **Continuity** (`strip`), **Semantics** (`sheet --nocap`), **3D Contact** (`probe`), and **Random-Access Determinism** (`smoke`, reporting `changed_pixels`, `bbox`, `max_channel_delta`, `psnr_db`).

## Install & Usage

**Claude Code**:
```
/plugin marketplace add fblissjr/mitate
/plugin install mitate@mitate
```

**Google Antigravity (`agy`)**:
Discovered automatically via `.agents/plugins.json` pointing to `./plugin`, or installable via `agy plugin install ./plugin`.

### Build & Test (macOS Golden Gate 27.2+ / Swift 6.4 / Metal 4.1)

```bash
xcrun swift build
xcrun swift test
```

### Quick CLI Workflow

```bash
# Discover schema or apply a tested SQL recipe
mitate schema [table_name]
mitate recipe [three-point-lights|character-walk|rack-focus|explainer-gears]

# Initialize a new SQLite soundstage and mutate with atomic SQL
mitate init shot.db --preset workshop
mitate sql shot.db "INSERT INTO beats (id, seq_order, dur_sec, caption) VALUES ('intro', 1, 2.8, '1 · The drive gear engages');"

# Pre-render lint (<5ms) and 2x2 Camera + Top/Front/Side ortho scout (~40ms)
mitate check shot.db
mitate quad shot.db --t intro@0.5 --out quad.png

# Three-Axis Review & Determinism Gate
mitate sheet shot.db --frac 0.6  --out sheet_06.jpg
mitate sheet shot.db --frac 0.95 --out sheet_095.jpg
mitate sheet shot.db --frac 0.6 --nocap --out sheet_nocap.jpg
mitate strip shot.db --from intro@0.2 --to intro@0.8 --out strip.jpg
mitate probe shot.db --t intro@0.5 --sep gear_a gear_b
mitate smoke shot.db

# Shoot hardware-encoded video (MP4 / ProRes 4444) or bundle self-contained HTML
mitate shoot shot.db --mode hero --out film.mp4
mitate bundle shot.db --out scene.html
```

## Repository Layout

| Path | What lives here |
|---|---|
| [`AGENTS.md`](AGENTS.md) (`CLAUDE.md`) | Canonical front-door router for Google Antigravity (`agy`) and Claude Code |
| [`VISION.md`](VISION.md) | Core intent: why determinism comes first, `t` vs. `state`, reproducibility vs. byte-identity, and why declarations live in `shot.db` |
| [`docs/plan.md`](docs/plan.md) | `mitate` v2 system architecture, full SQLite soundstage DDL (`schema.sql`), Metal 3/4 hybrid rendering pipeline, CLI specification, and roadmap milestones |
| [`docs/README.md`](docs/README.md) | Documentation & wiki question router |
| [`wiki/index.md`](wiki/index.md) | Modular LLM Knowledge Wiki (`time-and-beats.md`, `soundstage-schema.md`, `cinematography-and-rigging.md`, `metal-engine-and-kernels.md`, `instruments-and-review.md`, `patterns-and-recipes.md`) |
| [`plugin/`](plugin/) | Shipped agent plugin (`skills/mitate/SKILL.md`, `skills/mitate/references/*.md`, `agents/film-reviewer.md`, `rules/AGENTS.md`) |
| [`scripts/`](scripts/) | Repository self-check (`scripts/selfcheck.js`) and git hook installer (`scripts/install-hooks.sh`) |

## License

MIT — see [LICENSE](LICENSE).
