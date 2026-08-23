last updated: 2026-08-23

# mitate (Antigravity Instructions)

Deterministic animated scenes from any input.

- **Primary Intent**: Read [`VISION.md`](VISION.md) first. It is the most important document in this repository and the canonical definition of intent.
- **Repository Invariants and Development Rules**: Follow [`CLAUDE.md`](CLAUDE.md) for repo-level invariants, coding discipline, and self-check rules.
- **Architecture & Roadmap**: Read [`docs/plan.md`](docs/plan.md).
- **Source of Truth Map**: Read [`docs/source-of-truth.md`](docs/source-of-truth.md) for where facts are homed and how truth is maintained.
- **Skill Definition**: The main skill is homed at [`plugin/skills/mitate/SKILL.md`](plugin/skills/mitate/SKILL.md) with references in `plugin/skills/mitate/references/` and templates in `plugin/skills/mitate/templates/`.

## Prime Directive

1. **The scene is a pure function of `t`, and `t` is a position, not a clock.**
2. **Tooling that DRIVES a scene talks only to the window contract**, never to scene internals (one admitted exception: `build.js probe` for authoring-time measurements).
