last updated: 2026-11-08

# Where truth lives (`docs/source-of-truth.md`)

One rule generates the rest: **every fact has exactly one canonical home, chosen by asking where the next person or agent who could break it will be standing.** Every other surface points at the home rather than restating it.

## Canonical Homes in `mitate` v2

| Kind of fact | Canonical home | Who points here |
|---|---|---|
| **Intent & Core Philosophy** — why determinism comes first, `t` as a coordinate vs. `state`, reproducibility vs. byte-identity, and why declarations live in SQLite (`shot.db`) | [`VISION.md`](../VISION.md) | `AGENTS.md`, `README.md`, `docs/plan.md`. Where any document conflicts with `VISION.md` on intent, `VISION.md` wins |
| **Repo-Wide Rules & Wiki Router** — Prime Directive, Three-Axis Review Loop, plugin isolation rules, and topic routing | [`AGENTS.md`](../AGENTS.md) (`CLAUDE.md` contains `@AGENTS.md`) | Root `README.md`, `docs/README.md`, `wiki/index.md` |
| **System Architecture, Full `schema.sql` DDL & Roadmap** — `MitateCore`, `MitateMetal`, `MitateWeb`, CLI specification, and v2 phase gates | [`docs/plan.md`](plan.md) | `AGENTS.md`, `wiki/*.md` |
| **Modular In-Repo LLM Knowledge Wiki** — focused topic guides for time/beats, soundstage schema, cinematography/rigging, Metal engine/kernels, CLI instruments, and SQL/MSL recipes | [`wiki/*.md`](../wiki/index.md) | `AGENTS.md`, `docs/README.md`, situated CLI telemetry pointers |
| **Shipped Skill Workflow & Domain References** — the date-free instructions and reference modules that ship into a user's plugin install cache | [`plugin/skills/mitate/SKILL.md`](../plugin/skills/mitate/SKILL.md) and [`plugin/skills/mitate/references/*.md`](../plugin/skills/mitate/references/method.md) | [`plugin/README.md`](../plugin/README.md), [`plugin/agents/film-reviewer.md`](../plugin/agents/film-reviewer.md) |
| **Three-Axis Review Dispatch** — independent review subagent prompt | [`plugin/agents/film-reviewer.md`](../plugin/agents/film-reviewer.md) | `plugin/skills/mitate/SKILL.md`, `AGENTS.md` |
| **Release & Version History** | [`CHANGELOG.md`](../CHANGELOG.md) (checked for coherence with `plugin/plugin.json`, `plugin/.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json` by `scripts/selfcheck.js`) | — |

## Maintenance Rules

1. **Single Front Door (`AGENTS.md`)**: Edit `AGENTS.md` for repo-wide agent instructions; `CLAUDE.md` must contain only `@AGENTS.md` (enforced by `scripts/selfcheck.js`).
2. **Plugin Cache Isolation (`plugin/`)**: Everything under `plugin/` ships standalone into user install caches where `docs/` and `wiki/` do not exist. Relative links inside `plugin/**/*.md` must resolve within `plugin/`, and shipped markdown under `plugin/` must remain ISO-date-free (`scripts/selfcheck.js`).
3. **Composed Facts Live at the Consumer**: When an authoring rule is the product of two conventions (for example, character facing `+X` composed with `shots.angle_deg`), document the composed formula at the consumer (`film-language.md` and `wiki/cinematography-and-rigging.md`) and point to it from the input (`characters.md`).
4. **Derived Facts Are Computed, Never Hand-Copied**: Total duration (`v_beats`) and subject bounding boxes (`subjects.extent_mode = 'auto_bounds'`) are derived by `MitateCore` from the authoritative rows in `shot.db` rather than hand-restated in multiple places.
5. **Every Check Is Bracketed Red-Before-Green**: A validator rule in `mitate check`, `mitate smoke`, or `scripts/selfcheck.js` is trusted only after it is proven to fail on a broken fixture.
