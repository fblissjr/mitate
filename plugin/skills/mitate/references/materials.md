# Material packs: cel, subsurface, glass

> **Not here.** the character scaffold → `characters.md`; backend and determinism → `webgpu-stack.md`.


Three verified recipes on the node stack, each measured on a corpus film and
reviewed on the instruments. Every number and gotcha here was measured on
`three@0.185.1`, most of them the hard way.

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
farther-first — measured on a corpus film: emissive core, then glow disc, then
far orb, then near orb. Verified: the overlap zone composites correctly and the scene
is byte-deterministic on both backends **on macOS** — and that qualifier is
load-bearing, because CI refuted the unqualified version.

**Where creation order cannot express it** — objects that swap depth mid-film —
set `renderOrder` explicitly, and **accept that a genuinely depth-swapping
transparent pair is outside the guarantee.**

> **A heavy transmissive scene failing the determinism arm is a capture race,
> not scene state.** Measured: heavy films failed smoke's in-session determinism
> arm on Linux/WebGL2 at particular seek points, 40%, 30% and 20% over 10
> repeats with screenshots only. With an in-page GPU readback inserted before
> each screenshot — same runner, same scenes, identical `seekTo` sequence —
> **0 of 200**.
>
> The readback is the only variable, and it eliminates the failure, so the
> mechanism is presentation/capture latency, not scene state. A real divergence
> would survive a readback, which reads the canvas and cannot repair it.
> `settle`'s double rAF (~33ms) is enough on macOS hardware GL and not enough on
> a slow software-GL runner. The intermittency, the Linux-only-ness, the failing
> scene moving between runs, and the affected films being the heaviest to render
> all follow — which is what a latency-sensitive race predicts. A small run of
> identical failures is not evidence of a state dependency: that inference was
> drawn here from three in a row and four more runs refuted it.
>
> The ordering discipline above is unaffected and still correct. The fix lives in
> the recorder's capture pattern: `backend.js`'s `seekSynced` seeks and forces
> render completion in one page task, at all six capture sites. Verified on Linux
> as a red/green pair — shipped path 0 of 200, control (bare seek) 10/10 on the
> worst cell. The repair belonged there, never in a film and never in the
> determinism arm; relaxing the arm would have repaired the layer that was right.

## Bloom (first observations, not yet a rule)

Measured on a corpus film's emissive-behind-glass payoff, sweep .3→1.5:
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

## Procedural assets: recipes by shape problem

Everything is composed from primitives — spheres, boxes, cylinders, planes, tori.
No model files, no textures, no downloads. That constraint is what keeps a scene a
single self-contained HTML file, and it is far less limiting than it sounds.

### The general move

Recipes below are organized by **shape problem**, not by subject, because the same
geometry serves wildly different domains. Before reaching for one, derive your own:

1. **Decompose to primitives.** Almost anything reads as spheres, boxes and
   cylinders in a Group hierarchy. Detail is not what makes it legible.
2. **Silhouette first.** Check it on the squint strip, not at full resolution
   (the rule and the instrument are in `method.md`, "Silhouette").
3. **Signature feature, oversized ~30%.** Whatever identifies the subject — a
   beak, a hat, a chimney, a rotor, a spike in a chart — push it past comfortable.
   The first render is always too timid.
4. **Costume beats anatomy.** A hard hat makes a figure a builder; a torus brim
   and a cap make one a surgeon. Role reads instantly from accessories and never
   from accurate proportions.
5. **Signal over realism.** Emissive brightness, scale pulses and colour shifts
   carry meaning. A photoreal object that does not change is worse than a crude
   one that does.

### Recipes that have actually been built

- **Figure** (creature, mascot, person, robot — anything that presents or
  reacts): body = sphere scaled ~(0.9, 1.1, 1.15); head sphere on a short neck
  sphere; limbs = spheres or cylinders in pivot Groups at the shoulder/hip so
  they rotate for gestures; feet = flattened boxes. A protruding feature (beak,
  snout, visor) = cone scaled flat in one axis and rotated forward. Keep the neck
  and shoulder visible — costume that swallows both kills the silhouette.
- **Expressive face**: head sphere; eyes = white spheres scaled z≈0.5 sitting
  PROUD of the face (bug-eyed reads at distance), pinpoint pupils, glint dots;
  brows floated slightly off the head; blush = flat circles rotated to the
  cheeks; open mouth = dark sphere in a Group (doubles as a portal for dive-ins;
  scale to 0 and swap in a half-torus smile for a finale).
- **Cutaway / cross-section** (geology strata, building floors, soil horizons,
  battery internals, an engine block, a seabed): a flat slab box + bands for
  layers, viewed frontally. CRITICAL: anything "inside" the slab is invisible —
  cavities, thin layers and particles must sit PROUD of the front face by 0.1-0.3
  units, like a museum diorama. A thin dark torus rim where a cavity meets the
  surface sells the carved look.
- **Network or flow** (data pipelines, supply chains, transit maps, circuits,
  approval workflows, nutrient cycles): stations = labeled boxes on a ground
  plane; the payload = a bright emissive sphere whose position is a piecewise
  function of t along the edge path; arrival = `pulse()` scale bump on the
  station.
- **Atmosphere for a large ground plane**: `scene.fog = new THREE.Fog(bg, near,
  far)` matched to the background colour. The floor edge stops reading as a hard
  disc against the backdrop, and distant stations recede instead of competing
  with the subject. Cheap, and it does what a vignette cannot.

- **Field of instances** (forests, crowds, populations, fleets): one
  `InstancedMesh` per geometry, transforms composed ONCE at load from the
  seeded `R[]` pool — deterministic arrangement, one draw call however many
  items. The cel trick: the outlines are a *second* `InstancedMesh` sharing
  the same matrices scaled ~1.06 with the BackSide ink material — linework
  for the whole field at one more draw call. Built on a corpus film: a 46-tree
  forest. For a beat that animates the field, write
  per-instance values as functions of `(t, R[i])` and recompose matrices in
  `animate()` — still pure.
- **Curves without asset files**: `LatheGeometry` from a `Vector2` profile
  (a lathed urn), `ExtrudeGeometry` from a `Shape`, `TubeGeometry`
  along a Catmull-Rom curve. A profile array is data; no download.

### Not yet built, but the shape is obvious

Sketches, not battle-tested — treat them as starting points and add what you
learn back here.

- **Mechanism** (gears, levers, pumps, linkages): cylinders and boxes in nested
  Groups where each rotation is a closed form of `t`. Meshing is faked — two
  gears at a fixed ratio never actually collide, so drive both from one ramp.

Shared-material purity — the `setHex` before `lerp` rule — moved to
`method.md`'s determinism section: the worked example is three.js, but the
principle is backend-agnostic and `smoke.js` enforces it for every backend.

# The cinematic kit: post chain, cel shading, analytic IK

Everything in this section was built on a corpus film and verified the
project's way — `smoke.js` byte-determinism with the full chain enabled,
contact sheet, squint strip, motion profile.

## The post chain (per-frame pure, or not at all)

`build.js vendor` bundles the composer classes onto the THREE namespace:
`EffectComposer`, `RenderPass`, `UnrealBloomPass`, `BokehPass`, `OutputPass`.
The recipe: RenderPass → Bokeh → Bloom → OutputPass (which applies the
renderer's tone mapping + sRGB), `composer.setSize` in the resize handler,
`composer.render()` in `seekTo`.
