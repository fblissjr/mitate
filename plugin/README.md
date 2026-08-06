# mitate

last updated: 2026-08-05

Turn any input — a document, a codebase, a mechanism, a joke — into a
deterministic animated scene of any register: an explainer, a game cutscene, a
meme, a character short. Delivered as a self-contained HTML page, a frame-exact
MP4, or an animated WebP/AVIF that plays inline in a README.

*mitate* (見立て): to see one thing as another — the Japanese aesthetic of
representing one thing through another. Here, seeing any input as a scene.

## What it is, and what it is not

It **is** a scene compiler: you describe a film, and the skill writes one
self-contained HTML file whose every frame is a pure function of time, then
renders that same file to video. Zero assets, one file per scene.

It is **not** a video editor — it cannot cut an existing MP4, trim a screen
recording, or animate a slide deck, because there is no input footage anywhere
in the pipeline.

**WebGPU is not required.** Scenes fall back to WebGL2 transparently, so any
modern browser plays one and the recorder's default path needs no GPU.

## Installation

```
/plugin marketplace add fblissjr/mitate
/plugin install mitate@mitate
```

Then just ask. The skill activates on intent, not on a command:

- "Make a 30-second video of how our approval process flows"
- "Animate a boss-intro cutscene for this creature: ..."
- "Turn a long dense paper into an explainer"
- "Make this joke an animated meme"

You need `bun` and `ffmpeg` on PATH. Everything else is checked by the tool
that needs it — a browser binary, an encoder — and named at the moment it is
missing.

## Where to find what

Every fact has exactly one home. This README points; it does not restate.

| you want | read |
|---|---|
| the workflow, and what to run in what order | `skills/mitate/SKILL.md` |
| method, discipline, the recurring failure modes | `skills/mitate/references/method.md` |
| shot vocabulary — sizes, cuts, focus, camera energy | `skills/mitate/references/film-language.md` |
| backends, determinism, the node stack | `skills/mitate/references/webgpu-stack.md` |
| shipping the scene itself — bundle size, hosting, posters | `skills/mitate/references/delivery.md` |
| formats, encoders, file size, inline on GitHub | `skills/mitate/references/recordings.md` |
| what each check can and cannot see | `skills/mitate/references/instruments.md` |
| materials, characters, style bibles | the correspondingly named `references/*.md` |
| worked films you can open and read | none ship in the plugin, on purpose — the skill teaches through templates, references and tested snippets; the film corpus is tracked at https://github.com/fblissjr/mitate/tree/main/scenes |

## Status

Phases 0-2 are complete; Phase 4 (the physics bake) is next by owner priority.

Phase definitions, gate criteria, and what remains live in
[`docs/plan.md`](https://github.com/fblissjr/mitate/blob/main/docs/plan.md);
what actually shipped, and when, is
[`CHANGELOG.md`](https://github.com/fblissjr/mitate/blob/main/CHANGELOG.md).
Those two are canonical — if this paragraph disagrees with them, they win.

(Absolute links, because this README ships into an install cache that has no
`docs/`.)

## Provenance

mitate began as `screenwright` in the `fb-claude-skills` marketplace, itself the
successor to that repo's `explainer-video` skill (now frozen, bugfix-only). The
name changed on a real collision with an actively-maintained package in the same
domain. Version history from 0.1.0 carries forward unbroken in the changelog
linked above.
