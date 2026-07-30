# Material packs: cel, subsurface, glass

> **Provenance.** Canonical for the material packs and their ordering and bloom discipline. Last verified (in the working tree, not an install cache) against
> the templates and shipped examples 2026-07-24 (full source audit;
> corrections recorded in the changelog). If this file and the code
> disagree, audit before trusting either — then fix the stale one.
>
> **Not here.** the character scaffold → `characters.md`; backend and determinism → `webgpu-stack.md`.


Three verified recipes on the node stack, each shipped in
`examples/materials.html` and reviewed on the instruments. Every number and
gotcha here was measured on `three@0.185.1`, most of them the hard way.

## The property-vs-node trap (read first)

**The plain `transmission` material PROPERTY never engages on this stack** —
the material stores the value (verified) but renders fully diffuse, on both
backends, direct or through the pipeline. The NODE path works:

```js
const glass = new THREE.MeshPhysicalNodeMaterial({roughness:.06, thickness:.9, ior:1.5, dispersion:.12});
glass.transmissionNode = THREE.float(.95);   // THIS is what turns glass on
```

Assume any physically-featured property may share this fate until seen
rendering; the node slot is the reliable interface. (This is also why the cel
recipe below authors banding in the node graph rather than trusting
`gradientMap`.)

## Cel (toon)

TSL-native: quantize the key-light lambert into three crisp tones in
`colorNode`. Unlit base material, so ambient light CANNOT wash the bands
(the old stack's hemisphere-washes-toon lesson, solved structurally):

```js
const keyDir = THREE.vec3(6, 12, 8).normalize();       // match your key light
const nl = THREE.normalWorld.dot(keyDir).max(0);
const cel = new THREE.MeshBasicNodeMaterial();
cel.colorNode = THREE.mix(
  THREE.mix(THREE.color(0x8a3f1d), THREE.color(0xd9752e), THREE.step(.33, nl)),
  THREE.color(0xffb45e), THREE.step(.72, nl));
```

Outline: the inverted hull carries over unchanged — a `BackSide` dark shell
child at scale ~1.06 (`MeshBasicMaterial`, shadows off). Costume features
(eyes) sit PROUD of the face and the head biases toward the shot's angle so
they read — a face nobody framed is a face nobody sees.

## Subsurface (SSS)

`MeshSSSNodeMaterial`: setting `thicknessColorNode` ENABLES the scattering
term; tune with `thicknessDistortionNode/AttenuationNode/PowerNode/ScaleNode`.
The Chang-style model has **no real thickness input** — a constant
thicknessColor glows the whole mesh uniformly (measured: a lightbomb). Model
thin-vs-thick yourself: one material per regime.

```js
const skin = new THREE.MeshSSSNodeMaterial({color: 0xe8a2a0, roughness: .55});
skin.thicknessColorNode = THREE.color(0xff5f45);
skin.thicknessDistortionNode = THREE.float(.25);
skin.thicknessAttenuationNode = THREE.float(.55);
skin.thicknessPowerNode = THREE.float(2.2);
skin.thicknessScaleNode = THREE.float(2.2);    // THICK parts: subtle
const thin = skin.clone();
thin.thicknessScaleNode = THREE.float(10);     // THIN parts (ears): the glow
```

It only reads with a light BEHIND the subject: a `PointLight` at ~2 world
units behind, intensity ~2.2 (measured: 4.5 clips thin parts to white, 26 is
a supernova), ramped per-beat as a pure function of t.

## Glass

```js
const glass = new THREE.MeshPhysicalNodeMaterial({
  roughness: .06, metalness: 0, thickness: .9, ior: 1.5, dispersion: .12,
  attenuationColor: new THREE.Color(0xd6f2ff), attenuationDistance: 3.5});
glass.transmissionNode = THREE.float(.95);     // see the trap above
```

**Ordering discipline (the sortObjects bill):** with `sortObjects=false`,
transparent and transmissive objects composite in CREATION order. Create
farther-first — in the showcase: emissive core, then glow disc, then far orb,
then near orb. Verified: the overlap zone composites correctly and the scene
is byte-deterministic on both backends **on macOS** — and that qualifier is
load-bearing, because CI refuted the unqualified version.

> **RESOLVED 2026-07-30: this was never a defect in this film.** `materials.html`
> failed smoke's in-session determinism arm on Linux/WebGL2 at `seekTo(5.36)`, as
> did `menagerie.html` at 8.52 and 5.68. Measured rate with screenshots only:
> 40%, 30%, 20% over 10 repeats. Measured rate with an in-page GPU readback
> inserted before each screenshot, same runner, same scenes, identical `seekTo`
> sequence: **0 of 200**.
>
> The readback is the only variable, and it eliminates the failure — so the
> mechanism is a presentation/capture race, not scene state. A real divergence
> would survive a readback, which reads the canvas and cannot repair it.
> `settle`'s double rAF (~33ms) is enough on macOS hardware GL and not enough on
> a slow software-GL runner. The intermittency, the Linux-only-ness, and the
> failing scene moving between runs all follow; the two affected films are the
> two heaviest to render, which is what a latency-sensitive race predicts.
>
> The ordering discipline above is unaffected and still correct. What was wrong
> was an earlier version of this note accusing the film of carrying state — and
> before that, calling three identical failures "reproducible, therefore a state
> dependency," which four runs later was false. Both retracted. Evidence and the
> full chain: `internal/postmortems/2026-07-29_span_instrument-hardening.md`.
>
> **The repair belongs in `settle` (`backend.js`), not here and not in the
> determinism arm.** Relaxing the arm would be repairing the layer that was
> right.

## Bloom (first observations, not yet a rule)

Measured on the showcase's emissive-behind-glass payoff, sweep .3→1.5:
threshold is monotone with NO cliff at 1.0 (input appears pre-tone-map), but
the spread was ~1 mean-luma point — emissives seen THROUGH transmission
barely feed bloom. The same strength at threshold .55 visibly halated the
template's pale palette. So, as with the old stack: **what blooms is
palette-conditional** — bracket on your film's own palette before trusting
any number, and put emissives you want haloed in direct view, not behind
glass.

## Fur and fabric (the character packs)

Live with the character scaffold, not here: fur is shell-layer kit code in
`scene.character.template.html` (`addFur`/`furCharacter` — alpha-test
discard, so it never joins the transparency-ordering bill above), fabric is
a sheen recipe on `MeshPhysicalNodeMaterial`. Both node-slot-driven and both
verified rendering; see `characters.md`.
