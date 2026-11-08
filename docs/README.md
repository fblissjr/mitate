last updated: 2026-11-08

# Which doc answers which question

**Jump:** [`VISION.md`](../VISION.md) · [`AGENTS.md`](../AGENTS.md) · [`user-guide.md`](user-guide.md) · [`plan.md`](plan.md) · [`source-of-truth.md`](source-of-truth.md) · [`wiki/index.md`](../wiki/index.md) · [`plugin/skills/mitate/SKILL.md`](../plugin/skills/mitate/SKILL.md)

A router, not a summary. Every fact in this repository has one canonical home (see [`source-of-truth.md`](source-of-truth.md)). Nothing in `docs/` or `wiki/` ships into a user's plugin install cache — installed users receive [`plugin/`](../plugin/), while contributors and in-repo agents read `AGENTS.md`, `VISION.md`, `docs/`, and `wiki/`.

| If you are asking | Read | When |
|---|---|---|
| **I want a hands-on walkthrough — how do I build, review, and export my first `mitate` v2 scene?** | **[`user-guide.md`](user-guide.md)** | First-time setup, step-by-step mechanical & character tutorials, and CLI cheat sheet |
| **I am starting a session — what are the rules and where do I look?** | **[`../AGENTS.md`](../AGENTS.md)** (`CLAUDE.md` -> `@AGENTS.md`) | First, at the start of every session |
| **What is this project for** — why determinism comes first, what `t` vs. `state` means, why reproducibility outranks byte-identity, and why declarations live in `shot.db` | **[`../VISION.md`](../VISION.md)** | First, and before any structural or architectural change. Where any document conflicts with `VISION.md` on intent, `VISION.md` wins |
| **What is the `mitate` v2 architecture, complete SQLite `schema.sql` DDL, Metal 3/4 pipeline, and phase roadmap?** | **[`plan.md`](plan.md)** | Before implementing or modifying `MitateCore`, `MitateMetal`, `MitateWeb`, or the `mitate` CLI |
| **Which LLM Knowledge Wiki page covers a specific layer?** | **[`../wiki/index.md`](../wiki/index.md)** | Master index and table directory for all `wiki/*.md` modules |
| **How do `t`, relative `beats` (`v_beats`), `warp_segments`, and Tier-1 `mitate bake` (`baked_tracks`) work?** | [`../wiki/time-and-beats.md`](../wiki/time-and-beats.md) | Before authoring motion, retiming beats, warping time, or running `mitate bake` |
| **How are `slate`, `actors`, `props`, `surface_shaders`, `lamps`, `atmospheres`, `cue_sheet`, and `finishing_chain` structured?** | [`../wiki/soundstage-schema.md`](../wiki/soundstage-schema.md) | When creating or mutating `shot.db` stage tables |
| **How do `style_bibles`, `sizes`, `subjects` (`auto_bounds`), `shots`, `lenses`, and `characters` (proportion vectors & distance gait) work?** | [`../wiki/cinematography-and-rigging.md`](../wiki/cinematography-and-rigging.md) | When framing shots, configuring style bibles, or rigging characters |
| **How does the Apple Silicon Swift 6 + Metal 3/4 engine (`MitateMetal`), `MTLVisibleFunctionTable` (`gpu_kernels`), and single-frame AOV wavelet denoising work?** | [`../wiki/metal-engine-and-kernels.md`](../wiki/metal-engine-and-kernels.md) | When writing `.metal` kernels or working on `MitateMetal` |
| **What do the `mitate` CLI verbs (`check`, `quad`, `sheet`, `strip`, `probe`, `smoke`, `shoot`, `bundle`) measure, and how does the Three-Axis Review Loop run?** | [`../wiki/instruments-and-review.md`](../wiki/instruments-and-review.md) | When validating, scouting, reviewing, or shooting a scene |
| **What tested SQL + MSL recipes and visual trap countermeasures exist?** | [`../wiki/patterns-and-recipes.md`](../wiki/patterns-and-recipes.md) | When staging lighting rigs, cel/SSS/glass materials, gears, or character walks |
| **Where does a fact belong so it is never duplicated?** | [`source-of-truth.md`](source-of-truth.md) | Before documenting a rule, schema constraint, or measurement in two places |
| **What ships inside the installed plugin (`plugin/`)?** | [`../plugin/README.md`](../plugin/README.md), [`../plugin/skills/mitate/SKILL.md`](../plugin/skills/mitate/SKILL.md), [`../plugin/agents/film-reviewer.md`](../plugin/agents/film-reviewer.md) | When updating shipped skill instructions or `plugin/skills/mitate/references/*.md` |
