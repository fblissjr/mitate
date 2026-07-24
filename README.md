# mitate

A Claude Code skill that turns any input or context — markdown, a codebase, an
image or video, or whatever you want — into an animated scene of any length.
A scene pipeline an agent drives: reshoot parts, validate on three axes, and get
better over time. Every scene is a deterministic, self-contained HTML file — a
pure function of time `t`.

*mitate* (見立て): to see one thing as another — the Japanese aesthetic of
representing one thing through another. Here, seeing any input as a scene.

The example scenes are in [`plugin/skills/mitate/examples/`](plugin/skills/mitate/examples/)
and play straight from disk. If you'd rather just watch them,
[mitate.microapp.me](https://mitate.microapp.me) runs the same files in the
browser — it's an early version, and it's what the skill produces today rather
than what it's aiming at.

## Install

```
/plugin marketplace add fblissjr/mitate
/plugin install mitate@mitate
```

Then ask for a scene: *"make a 30-second video of how our approval process
flows"*, *"animate a boss-intro cutscene for this creature"*, *"turn
docs/data-flywheel.md into an explainer"*, *"make this joke an animated meme"*.

**WebGPU is not required** — scenes use three.js `WebGPURenderer`, which falls
back to WebGL2 transparently. Rendering to MP4 or AVIF needs `bun`, ffmpeg, and
a Chromium; see [`plugin/README.md`](plugin/README.md#requirements).

## Layout

| Path | What |
|---|---|
| [`plugin/`](plugin/) | The skill itself — manifest, `skills/mitate/` with SKILL.md, references, templates, examples. See [`plugin/README.md`](plugin/README.md) |
| [`site/`](site/) | The static showcase site — see [`site/README.md`](site/README.md) to run or deploy it |
| [`docs/`](docs/) | [`plan.md`](docs/plan.md) (founding plan, architecture, phase gates), [`physics-bake-proposal.md`](docs/physics-bake-proposal.md), and [`predecessor-record.md`](docs/predecessor-record.md) (the frozen predecessor's measured findings, inherited) |

The scene HTML files are tracked once, as `plugin/skills/mitate/examples/`, and
staged into `site/films/` at deploy. Edit them where they live.

## Status

Phases 0–2 are complete and gated: the node-stack templates, recorder, and
instruments on both backends; the material packs and style bibles; the character
scaffold, demonstrated by `menagerie` and delivered by `bear-and-bees`. A chart
tier sits below the films for isolating shader primitives. Next by priority is
Phase 4, the physics bake. Full detail in [`docs/plan.md`](docs/plan.md); version
history in [`CHANGELOG.md`](CHANGELOG.md).

## License

MIT — see [LICENSE](LICENSE). Third-party notices (three.js, embedded in every
scene) are in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
