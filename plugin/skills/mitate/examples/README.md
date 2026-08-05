# mitate examples

last updated: 2026-08-05

One teaching baseline per template ships here: a complete, self-contained
film per rendering backend — open the `.html` straight from disk and it
plays. **WebGPU is not required** — the embedded `WebGPURenderer` falls
back to WebGL2 transparently, so any WebGL2-capable browser plays these;
with a WebGPU adapter present it is used automatically. Each passed the
full instrument suite (smoke on both backends, sheets, motion, independent
review).

**The rest of the film corpus is tracked in the repo, not shipped here:**
[`scenes/` at the repo root](https://github.com/fblissjr/mitate/tree/main/scenes)
(absolute URL on purpose — this README ships into a per-version install
cache, and a relative path would climb out of it). The plugin cache carries
only what the skill itself needs; the corpus moved out 2026-08-05
(examples-placement option E), which cut the shipped subtree by ~93%.

Poster frames live in [`site/posters/`](https://github.com/fblissjr/mitate/tree/main/site/posters) at the repo
root, NOT here, for the same reason.

> **The stills below are one frame each, rendered from the scene.** They are not
> recordings and there is no compressed loop to watch — GitHub cannot run a
> scene, so a frame is the honest thing to show here. The `.html` next to each
> one is the artifact: open it and the scene runs.

## gearbox

[`gearbox.html`](gearbox.html) — the regression film against frozen
explainer-video: the same scene body on both stacks, judged side-by-side.
Five beats, 16.5s, seamless loop by construction. Showcases the baseline
pipeline: beats, the shot solver, the node post chain.

![gearbox](https://raw.githubusercontent.com/fblissjr/mitate/main/site/posters/gearbox-still.jpg)

The same file carries the committed style-bible control pair: switch
`const STYLE = BIBLES.workshop` to `BIBLES.neon` — one line — and the same
beats render as a dark stage where the light is the subject:

![gearbox neon](https://raw.githubusercontent.com/fblissjr/mitate/main/site/posters/gearbox-neon-still.jpg)
