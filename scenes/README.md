# mitate scenes — the tracked film corpus

last updated: 2026-08-07

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

## Two build classes, and they are not comparable evidence

Every film here carries a **build class**, because the corpus answers two
different questions and pooling them would silently corrupt both.

- **COLD** — built by a session holding *only the installed plugin*: SKILL.md,
  the references, the templates, the tools. No repo context, no `VISION.md`,
  no plan, no instrument source. A cold build asks **does the shipped surface
  carry a stranger through?** Its stumbles are evidence about the docs, and
  its smoothness is evidence the docs work. Recorded per build in
  `docs/scene-analyses/`.
- **WARM** — built by a session working *in this repository*, with the plan,
  the working notes, the pattern ledger and the instruments' own source in
  hand. A warm build asks **does the vocabulary do what it claims, and where
  does it run out?** Its stumbles are evidence about the harness. **Its
  smoothness is evidence about nothing** — the builder read the source, so a
  clean warm build says nothing whatsoever about the shipped surface.

The asymmetry is the whole point and it is easy to lose: a warm film that
lands in one pass is *not* a data point for VISION's cold-start criterion, and
citing it as one would inflate a sample of exactly one. When a film's class is
unstated, assume nothing and go read its section below.

**The cold-build practice began 2026-08-04.** Every film that predates it was
built in-repo and is therefore WARM by construction; each section states its
class explicitly rather than leaving it to that inference.

## gearbox

**Build class: WARM** — in-repo, Phase 1.

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

**Build class: COLD** — the only one, and the reason the class exists.

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

## strider-intro

**Build class: WARM** — in-repo, and the class matters more here than
anywhere else in the corpus. This film was built by a session with the plan,
the pattern ledger and the instruments' own source in hand, and it was
*designed* to reach for vocabulary a stranger would never touch. **Its
smoothness is evidence about nothing.** What it is evidence for is below.

[`strider-intro.html`](strider-intro.html) — a 20.4s, 7-beat game-cutscene
boss intro: a creature walks out of the dark to a glowing shard, stops, turns
its three eyes on the viewer, and the film cuts from those eyes to the shard
at identical framing. Low-key rig — one warm practical inside the set, a rim
that finds the silhouette edge, and a fill deliberately under the key.

**Rung A of `boss-intro`, deliberately.** `plan.md` specifies the rung below
that case as "a title card and dramatic lighting on an EXISTING creature",
separating the register work from creature invention — so the strider is
`menagerie`'s proportion vector verbatim, and the one new variable is the
register. Creature invention is the next rung; mixing them would have made
any failure unattributable.

**What it was built to exercise**, all three verified unexercised across the
whole corpus beforehand:

- **`STYLE.dof` and a rack focus** — and enabling it is what found that
  `STYLE.dof` had never worked (0.23.0). The film now carries the first
  working depth of field in the project: shots 4 and 5 are identical framing
  differing only in `focus`, joined by `blend`, and `shotFocus` pulls
  8.18 → 5.62 across it.
- **`match: true`** — zero occurrences repo-wide before this. Shot 7 rhymes
  the shard against shot 6's head insert; the solver validates the constraint
  at load and throws loud, so the rhyme is guaranteed rather than eyeballed.
- **Per-shot camera energy, by hitting the wall.** `STYLE.energy` is global.
  The approach wants `steadicam` and the halt wants `locked`; one value
  serves both. That is **instance 2** of `pattern-ledger.md`'s per-shot-energy
  row, which stood at 1 (`bear-and-bees`, the same compromise in the opposite
  direction).

Reviewed on all three axes: composition converged in three rounds plus a
fourth after dof went live; `motion` reports 0 dead-air stretches; the
semantics pass reads without a single word; the shard's composed periodic is
probe-verified at 5 distinct values rather than assumed. It sits at 52.5%
crushed — inside the exposure advisory by design, and the advisory's wording
("add a fill/rim light") was the correct diagnosis of a real first-draft
defect, not noise.

![strider-intro](https://raw.githubusercontent.com/fblissjr/mitate/main/site/posters/strider-intro-still.jpg)

## menagerie

**Build class: WARM** — in-repo, Phase 2 gate.

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

**Build class: WARM** — in-repo, Phase 2 deliverable.

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

**Build class: WARM** — in-repo, chart tier.

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

**Build class: WARM** — in-repo, pack showcase.

[`materials.html`](materials.html) — the pack showcase: one film, three
beats, three surfaces — TSL-native cel banding, subsurface scattering
through thin ears, transmissive glass with dispersion over an emissive core
(the overlapping-transparency ordering case). Recipes and measured gotchas:
[`materials.md`](../plugin/skills/mitate/references/materials.md).

![materials](https://raw.githubusercontent.com/fblissjr/mitate/main/site/posters/materials-still.jpg)
