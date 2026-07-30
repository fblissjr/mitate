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

> **UNRESOLVED on Linux, 2026-07-30. Environment-sensitive, NOT scene-specific,
> cause unknown.** `materials.html` failed smoke's in-session determinism arm on
> Linux / WebGL2 — `seekTo(5.36) not deterministic` — on three consecutive CI
> runs, then passed on two. The next failure was a **different scene at a
> different timestamp**: `menagerie.html` at `seekTo(8.52)`. Tally on Linux
> WebGL2: four failures across two scenes and two timestamps, two clean runs.
>
> **So this is a class, not a defect in this film**, and it is recorded here only
> because this is where it was first seen — 3D scenes intermittently failing the
> in-session determinism arm on Linux, where macOS passes on both hardware and
> software GL. The two scenes are the two most shading-heavy in the corpus
> (cel/SSS/glass here, fur/fabric/characters there), which is suggestive and is
> not evidence. Characterise the rate before diagnosing the mechanism: repeated
> `workflow_dispatch` runs on an unchanged SHA, counting failures per scene.
>
> **RETRACTION, same day.** After the three failures this entry read
> "reproducible … so it is a state dependency, not a race." That was wrong, and
> wrong in this repo's signature way: 3-of-3 was read as proof of determinism
> when it only ever supported "3 so far," and run four refuted it. Worse, the two
> passing runs also changed the CI environment (browser install path, an added
> cache step), so the sample is **confounded** — intermittency and an
> environment change are indistinguishable in it. No conclusion is available from
> these five runs, and the correct move is not more samples from an environment
> nobody pinned. It is to pin the environment first.
>
> Still notable and still unexplained: every failure landed on the same `t`. A
> uniformly random flake would not. What is ruled
> OUT: `t=5.36` falls in the **toon** beat (beats run title 0-2.2, toon 2.2-5.6,
> skin 5.6-9.2, glass 9.2-13.4), the orbs only move on `pulse(t,'glass',…)`, and
> no `renderOrder` is set anywhere — so the depth-swapping-transparent-pair
> exemption below does NOT explain it, and neither does the transmission
> backdrop. NOT reproducible on macOS: hardware GL and software GL
> (`ANGLE_BACKEND=swiftshader`) both pass, so there is no local repro loop yet
> and CI is currently the only instrument that sees it.
>
> **This must not be resolved by exempting the scene or relaxing the check.**
> It also must not be declared fixed because it went green — five runs of an
> unpinned environment cannot support that either.
> That is the physics-bake proposal's red line #3 verbatim ("smoke's determinism
> checks are weakened, special-cased, or given a per-scene opt-out"), and the
> check is behaving correctly: it found something on a platform the claim above
> was never measured on. When creation order cannot express
the ordering (objects that swap depth mid-film), set `renderOrder` explicitly
— and accept that a genuinely depth-swapping transparent pair is currently
outside the guarantee.

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
