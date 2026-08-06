# mitate scenes — the tracked film corpus

last updated: 2026-08-05

The films that are **tracked but not shipped**: full members of the repo —
smoke-checked in CI, fence-parity carriers, browsable and reviewable — but
not copied into any installed user's plugin cache. **The plugin ships no
films at all** (owner call, 2026-08-05, revising examples-placement option
E the day it landed): a shipped example gets copied instead of learned
from, so the skill teaches through prose and tested snippets, and every
finished film lives here — as the maintainer's calibration corpus, the
evidence base for what the skill's docs actually produce, and the source
the showcase site stages from (`scripts/stage-films.sh` →
`site/films/`).

Each film is a complete, self-contained scene: open the `.html` straight
from disk and it plays. WebGPU is not required — the embedded
`WebGPURenderer` falls back to WebGL2 transparently.

> **The stills below are one frame each, rendered from the scene.** They
> are not recordings — GitHub cannot run a scene, so a frame is the honest
> thing to show. The `.html` next to each one is the artifact.

**These are finished films, not pattern references.** Reading one to learn
a technique is a bug report against `references/` — log it in
`docs/pattern-ledger.md` rather than only solving it.

## gearbox

[`gearbox.html`](gearbox.html) — the regression film against frozen
explainer-video: the same scene body on both stacks, judged side-by-side.
Five beats, 16.5s, seamless loop by construction. Showcases the baseline
pipeline: beats, the shot solver, the node post chain.

![gearbox](https://raw.githubusercontent.com/fblissjr/mitate/main/site/posters/gearbox-still.jpg)

The same file carries the committed style-bible control pair: switch
`const STYLE = BIBLES.workshop` to `BIBLES.neon` — one line — and the same
beats render as a dark stage where the light is the subject
(`gearbox-neon.html` on the site is derived from exactly that edit by
`stage-films.sh`, never stored):

![gearbox neon](https://raw.githubusercontent.com/fblissjr/mitate/main/site/posters/gearbox-neon-still.jpg)

## crash

[`crash.html`](crash.html) — a 37s, 10-beat market-crash explainer with no
characters: candlestick tape, order book, and the margin-call feedback loop
drawn as literal geometry (call-lines candle→marker, sell-streaks
marker→book with a stepped ask stack, and the cascade's feedback bolts
book→tape). **Built cold** by an installed-plugin session with no repo
context (2026-08-04; the record is
`docs/scene-analyses/2026-08-04_market-crash-cold.md`), then independently
reviewed and revised (2026-08-05: the causal-loop geometry, a
continuous-velocity reveal, a bg-to-bg loop landing). Candidate for the
shipped 2D teaching-baseline slot, which stays open until more portfolio
scenes corroborate — one cold build is one sample.

![crash](https://raw.githubusercontent.com/fblissjr/mitate/main/site/posters/crash-still.jpg)

## menagerie

[`menagerie.html`](menagerie.html) — the Phase 2 character-scaffold gate
demonstration: a furred bear, a fabric-shirted human, and a text-invented
three-eyed strider — three proportion vectors through ONE `buildCharacter`,
walking in on their own gaits (lateral-sequence quadruped, biped,
long-stride biped), stopping, looking at camera. Squint-distinct
silhouettes, strip-checked planted feet, byte-deterministic on both
backends. Showcases the character scaffold, the fur and fabric packs, and
gait.

![menagerie](https://raw.githubusercontent.com/fblissjr/mitate/main/site/posters/menagerie-still.jpg)

## bear-and-bees

[`bear-and-bees.html`](bear-and-bees.html) — the Phase 2 film deliverable,
a 21.3s comedy short carrying the comedic-timing half of the gate: a furred
bear ambles in, nose-boops a hanging hive, and the film HOLDS (2.6s of
near-stillness, one scout bee at the bear's eyeline, a double blink to
camera) before 1.1s of everything at once. Locked silent-comedy camera; the
gag reads with zero captions (nocap pass). Every contact is probe-measured
in all three axes: the boop solves to a surface graze (normalized 1.02),
and the flee passes UNDER the hive with measured clearance. Showcases
pause-then-fast timing, probe-solved staging, and the character register.

![bear-and-bees](https://raw.githubusercontent.com/fblissjr/mitate/main/site/posters/bear-and-bees-still.jpg)

## noise-chart

[`noise-chart.html`](noise-chart.html) — the first chart-tier scene:
charts isolate primitives the way films integrate them (one primitive per
cell, judged before anything downstream uses it). Eight cells: the top row
is the MaterialX baseline (fbm, worley, aastep, palette-mapped fbm); the
bottom row is hash-lattice primitives (value noise, re-hashed cells,
domain-warped fbm) plus the classic sin-hash as a deliberate drift
CONTROL — cells 6 and 8 are byte-identical constructions except for the
hash function. Verified 20/20 smoke-green across 15 WebGPU-Metal and 5
WebGL2-fallback runs, control included. Showcases the primitive-isolation
tier and the determinism instruments doing their job.

![noise-chart](https://raw.githubusercontent.com/fblissjr/mitate/main/site/posters/noise-chart-still.jpg)

## materials

[`materials.html`](materials.html) — the pack showcase: one film, three
beats, three surfaces — TSL-native cel banding, subsurface scattering
through thin ears, transmissive glass with dispersion over an emissive core
(the overlapping-transparency ordering case). Recipes and measured gotchas:
[`materials.md`](../plugin/skills/mitate/references/materials.md).

![materials](https://raw.githubusercontent.com/fblissjr/mitate/main/site/posters/materials-still.jpg)
