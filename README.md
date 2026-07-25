# mitate

A Claude Code skill that writes **an animated three.js scene as native HTML**.
There is no input format — whatever context your agent can already read is
enough: a prompt, a document, a codebase, a screenshot. Ask for one and you get
a single file that opens in any browser. Not a video: no player, no build step,
and the geometry is drawn live on every frame.

It is a pipeline an agent drives rather than a one-shot generator: it reshoots
parts, validates on three axes, and gets better over time. Every scene is
deterministic — a pure function of time `t`, so the same `t` always renders the
same frame. The whole surface tooling touches is a handful of `window.*`
exports at the end of every scene — [the window contract](#the-window-contract),
shown below.

The tooling tries to abstract all this cleanly, but clean abstraction is nearly
impossible here — so treat it as a bootstrap to personalize. When the film you
want needs a primitive that doesn't exist yet, you build it on top — until
models can do all of this on their own.

[![Six scenes made with mitate: a bear nosing a hanging beehive, three characters walking in on their own gaits, a gearbox mechanism, subsurface scattering through thin skin, a grid of shader primitives, and the same gearbox under a neon style bible](site/posters/scenes.jpg)](https://mitate.microapp.me)

Those six are what it makes today, playing in the browser at
**[mitate.microapp.me](https://mitate.microapp.me)** — free and MIT-licensed, and
the site is just the films. The same scenes are in
[`plugin/skills/mitate/examples/`](plugin/skills/mitate/examples/): open one from
disk and you get the real artifact, at full resolution and frame rate, rather than
a compressed recording of it. It's an early version — this is the current output,
not the ceiling.

*mitate* (見立て): to see one thing as another — the Japanese aesthetic of
representing one thing through another. Here, seeing any input as a scene.

## Why do it this way, and what it costs

**What you gain.** The output is code, not pixels. An agent can reshoot one shot
without re-rendering the rest, and swap the whole look by changing one line. It
diffs and versions like source. It renders at any resolution from the same file,
because nothing is baked in. And determinism makes a regression byte-detectable:
the same `t` either matches the last run or it does not.

**What it can't do.** This is three.js with no image textures — flat color, node
math, GPU noise — so it is stylized by construction: it cannot be photoreal, and
no frame of footage ever appears in a film. It will not edit an existing video, a
screen recording, or a slide deck. The films are silent. Faces are not built yet.
The character films spend 4 to 5 seconds compiling shaders on a first visit on
capable hardware — slower devices, longer — and captions stop being legible below
roughly 700px of frame width.

**Where it is.** There's a balance in building in AI between "unfinished" and
"over-engineered", and this sits on the unfinished side (I think). Everything
here runs 12 to 21 seconds — kept short so the examples open as live HTML on
ordinary devices; nothing caps duration, but longer has not been shipped.
Characters are one skeleton family. I don't know yet whether this is useful — it
is fun to tinker with and see what it can do, and that is why it is public.

## The window contract

Everything the recorder, the smoke gate, and the showcase site can do, they do
through a few `window.*` exports at the end of every scene — never by reaching
into scene internals. This is the driver block from
[`gearbox.html`](plugin/skills/mitate/examples/gearbox.html) (search for
`window.seekTo`). The excerpt is abridged and may drift out of sync as scenes
evolve — the scene file is the source of truth:

```js
// the driver (abridged)
window.DURATION = TOTAL;            // derived from BEATS, cannot disagree
window.BEATS    = BEATS;            // tools label frames by beat
window.FRAME    = FRAME;            // the declared aspect + px
window.FLASHES  = FLASHES;          // flash midpoints, absolute seconds
window.CAPFADE  = CONFIG.capFade;   // caption fade, for the reading-speed lint
window.SHOTS    = SHOTS.map(/* cut-entry windows */);

window.seekTo = function (t) {      // the f in f(t)
  uTime.value = t;
  setCamera(t); animate(t); setOverlay(t);
  pipeline.render();
};
window.stopPlayback = function () { playing = false; };
// …and window.sceneReady = true, once every shader is warm
```

The names are permanent — every tool depends on them. The list grows when a
tool needs an export rather than a peek: `FLASHES` and `SHOTS` joined the day
a check needed them. The showcase site is itself a consumer — its hero drives
gearbox through `seekTo`, live.

## Install

```
/plugin marketplace add fblissjr/mitate
/plugin install mitate@mitate
```

Then ask for one, in whatever words you'd normally use: *"animate how our
approval process flows"*, *"make a boss-intro cutscene for this creature"*,
*"turn docs/data-flywheel.md into an explainer"*, *"make this joke an animated
meme"*.

The shipped examples run 12 to 21 seconds. A film lasts exactly as long as the
beats written for it, so there is no built-in ceiling — but nothing longer has
been built or gated yet, so treat longer as untested rather than promised.

**WebGPU is not required** — scenes use three.js `WebGPURenderer`, which falls
back to WebGL2 transparently, so any WebGL2 browser plays one.

**The toolchain is local, and how much of it you need depends on the backend.**
The Canvas2D template is born self-contained and needs nothing at all. A three.js
scene needs `bun` to embed three into the file — skipping that is recoverable,
since every `build.js` command embeds automatically (a direct `shoot.js` run is
the one path that does not). Rendering to MP4 or
AVIF, and running the review instruments, needs `bun`, ffmpeg and a Chromium.
See [`plugin/README.md`](plugin/README.md#requirements).

That local dependency is worth knowing if you use Claude somewhere other than
Claude Code: Cowork and cloud sessions load the skills enabled on your claude.ai
account rather than a locally installed plugin, and they are a different
environment from the one these commands assume. **Nobody has run mitate there,
so treat it as untested rather than supported.**

## Layout

| Path | What |
|---|---|
| [`plugin/`](plugin/) | The skill itself — manifest, `skills/mitate/` with SKILL.md, references, templates, examples. See [`plugin/README.md`](plugin/README.md) |
| [`site/`](site/) | The static showcase site behind [mitate.microapp.me](https://mitate.microapp.me) — one hand-authored page, no framework |
| [`docs/`](docs/) | [`plan.md`](docs/plan.md) (founding plan, architecture, phase gates), [`physics-bake-proposal.md`](docs/physics-bake-proposal.md), and [`predecessor-record.md`](docs/predecessor-record.md) (the frozen predecessor's measured findings, inherited) |
| [`scripts/`](scripts/) | `stage-films.sh` — copies the skill's examples into `site/films/` at build time |

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
