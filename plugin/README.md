# mitate

Turn any input — a document, a codebase, a mechanism, a joke — into a
deterministic animated scene of any register: an explainer, a game cutscene, a
meme, a character short. Authored on a single-file SQLite 3 Virtual Soundstage
(`shot.db`), rendered by the native Apple Silicon Swift 6 + Metal 3/4 engine
(`mitate`, aliased as `slate`), and delivered as frame-exact MP4 / ProRes 4444
or a self-contained looping HTML page (`mitate bundle`).

*mitate* (見立て): to see one thing as another — the Japanese aesthetic of
representing one thing through another. Here, seeing any input as a scene.

## What it is, and what it is not

It **is** a declarative 3D soundstage and scene compiler: you declare beats,
style bibles, characters, props, materials, lamps, and shots in a single SQLite
database (`shot.db`) — plus optional hot-compiled `.metal` GPU kernels — where
every frame is a pure function of position `t`. One precompiled native binary
validates the relational graph in `<5ms` (`mitate check`), scouts 4-view
orthographic + camera blueprints in `~40ms` (`mitate quad`), runs the
three-axis review instruments (`sheet`, `strip`, `probe`, `smoke`), shoots
hardware-encoded video (`mitate shoot`), and bundles a self-contained HTML
player (`mitate bundle`).

It is **not** a video editor — it cannot cut an existing MP4, trim a screen
recording, or animate a slide deck, because every scene is staged from scratch
as procedural geometry and lighting on the virtual soundstage.

## Installation

**Claude Code**:
```
/plugin marketplace add fblissjr/mitate
/plugin install mitate@mitate
```

**Antigravity 2.0**:
Declared via `.agents/plugins.json` pointing to `./plugin`, or installable via `agy plugin install ./plugin`.

Then just ask. The skill activates on intent, not on a command:

- "Make a 30-second video of how our approval process flows"
- "Animate a boss-intro cutscene for this creature: ..."
- "Turn a long dense paper into an explainer"
- "Make this joke an animated meme"

You need the `mitate` (or `slate`) native CLI on `PATH` (built on macOS Apple
Silicon via `swift build -c release`). Every command prints structured JSON
telemetry (`meter`, `framing`, `contacts`, `lint`) directly to stdout.

## Where to find what

Every fact has exactly one home. This README points; it does not restate.

| you want | read |
|---|---|
| the workflow, and what to run in what order | [`skills/mitate/SKILL.md`](skills/mitate/SKILL.md) |
| the three-axis review subagent | [`agents/film-reviewer.md`](agents/film-reviewer.md) |
| plugin rules (Antigravity & Claude Code active rules) | [`rules/AGENTS.md`](rules/AGENTS.md) |
| method, discipline, the recurring failure modes | [`skills/mitate/references/method.md`](skills/mitate/references/method.md) |
| shot vocabulary — sizes, cuts, focus, camera energy | [`skills/mitate/references/film-language.md`](skills/mitate/references/film-language.md) |
| declarative tables & schema breakdown | [`skills/mitate/references/breakdown.md`](skills/mitate/references/breakdown.md) |
| style bibles, materials, characters | [`skills/mitate/references/bibles.md`](skills/mitate/references/bibles.md), [`skills/mitate/references/materials.md`](skills/mitate/references/materials.md), [`skills/mitate/references/characters.md`](skills/mitate/references/characters.md) |
| what each review instrument can and cannot see | [`skills/mitate/references/instruments.md`](skills/mitate/references/instruments.md) |
| shipping HTML bundles and recordings | [`skills/mitate/references/delivery.md`](skills/mitate/references/delivery.md), [`skills/mitate/references/recordings.md`](skills/mitate/references/recordings.md) |
| glossary of terms | [`skills/mitate/references/glossary.md`](skills/mitate/references/glossary.md) |
| worked films you can open and inspect | tracked at https://github.com/fblissjr/mitate/tree/main/scenes |

## Architecture & Roadmap

Architecture, full SQLite soundstage schema (`schema.sql`), Metal 3/4 pipeline
details, and phase milestones live in
[`docs/plan.md`](https://github.com/fblissjr/mitate/blob/main/docs/plan.md) and
[`VISION.md`](https://github.com/fblissjr/mitate/blob/main/VISION.md); release
history lives in
[`CHANGELOG.md`](https://github.com/fblissjr/mitate/blob/main/CHANGELOG.md).

## Provenance

`mitate` v2 synthesizes `mitate` v1's random-access `t` discipline, relative
beat addressing, cinematography solver, parametric character scaffolds, and
three-axis review instruments with the **Slate** SQLite 3 Virtual Soundstage
(`shot.db`) and Apple Silicon Native Metal 3/4 engine.
