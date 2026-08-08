# Film language: shots as data

> **Not here.** the determinism rules → `webgpu-stack.md`; the review passes → `method.md`.


The cinematography layer: framing described the way a cinematographer would —
sizes, angles, lenses, cuts — compiled onto the camera per frame by the solver
in `scene.template.html`. Raw camera keyframes are gone from the template on
purpose: coordinates were never the author's intent; framing was.

Implemented in the **3D template** and proven on a corpus film authored
with zero hand-written keyframes. The 2D backend keeps its
simpler `{x,y,zoom}` rail; a 2D solver analog is deliberately unbuilt until a
2D film wants shot vocabulary.

## The pieces

**SUBJECTS** — named things a camera can frame: `pos` is a pure function of
`t` returning the subject's center, `h` its framed extent (see below), and
optionally `w` its width. A moving subject is a tracking shot for free. Craft rule, learned by
rendering: track a subject's *travel*, not its jumps — leave vertical action
out of `pos` so it moves in the frame instead of being cancelled by the camera.

**`pos` may NOT call `getWorldPosition()`, and the reason is an ordering you
cannot see from here.** Reaching for the live object is the obvious way to
frame a rig's part — a head, a prop riding a body — and it is not pure. It
reads a world matrix, and that matrix was last written by the **previous**
`animate()` call, because `seekTo` runs:

```js
setCamera(state); animate(t); setOverlay(t);
```

`setCamera` is what calls `pos()`. So a `pos` that reads a matrix is a
function of `(t, whatever t was rendered before)`, the camera lands
differently depending on the arrival path, and the frame stops being
reproducible. Derive from the same named closed form the body uses instead —
the proven-walker rule — and measure the offset once with
`build.js probe <scene> <t> 'JSON.stringify(obj.getWorldPosition(new THREE.Vector3()))'`:

```js
// NOT this — impure, and silent until a seek lands on the wrong frame
head: {pos: () => {const p = new THREE.Vector3();
                   rig.head.getWorldPosition(p); return [p.x, p.y, p.z];}, h: 1.2},
// this — one closed form drives body and camera alike
head: {pos: t => [walkerXAt(t) + 4.82, 1.61, 0], h: 1.2},
```

**A green determinism run does not certify purity; it certifies the samples.**
One corpus film shipped with the impure form and passed — none of the sampled
`t` values landed where the stale pose moved a byte. The next film built the
same way failed on its first smoke, at one specific `t`. If you write this and
smoke is green, you have learned nothing about whether it is correct.

**`h` means "the extent that must stay in frame", not "the subject's height".**
Three films cropped their own payoff by declaring the figure and forgetting the
prop: a robot's antenna, a cross-section's outer stations, a pelican's umbrella.
If a beat pays off on it, it is inside `h`.

**An extent derives; a pad gets a name.** The base comes from the construction
the camera frames — `rig.height`, a geometry's computed bounding box — and any
hand adjustment rides as a named term (`h: walker.height+HEADROOM`), never a
bare number folded in. In the record that decided this rule, hand-declared
extents were wrong more often than right — one declared width sat under the
real body at every sampled moment — while the one derived from `rig.height`
was right first try. `build.js check` warns on a bare number in an extent: a
number tied to nothing is the number nothing updates when the geometry
changes. (The `h: 1.2` in the purity snippets above is elided context, not a
form to copy.)

**Declare `w` for anything wider than it is tall.** The size ladder below is
calibrated to subject HEIGHT — `f` is a fraction of the frame's height — and
the solver originally consulted nothing else. That is correct for an upright
subject and silently wrong for a wide one: on a bench 12.8 wide and 2.6 tall,
every rung tighter than WS framed less width than the subject occupied, so it
cropped. Measured at `h:4.3` on a 40° lens, the frame widths are EWS 44.4,
WS 17.8, FS 9.4, MS 5.6, MCU 3.7 — only the two widest rungs fit a 13-wide
subject at all, which collapses the variety the ladder exists to provide.
With `w` declared, framing binds on whichever axis is tighter, so the rungs
keep their cinematographic meaning on a timeline, an org chart, a waveform or
a supply chain. An upright subject (`w <= h * FRAME.aspect`) is unchanged.

Inflating `h` is NOT the fix — it pulls the camera back but leaves the subject
small in a tall empty frame. The other honest move is the one a
cinematographer would make anyway: push in on a **narrower named sub-subject**
for the detail beat, rather than trying to frame the whole wide thing tight.

**SIZES** — the ladder, calibrated to what a cinematographer means:

| size | subject height ÷ frame | aim anchor | reads as |
|---|---|---|---|
| EWS | 0.20 | .5 | speck in the world |
| WS | 0.50 | .5 | full body, generous air |
| FSA | 0.70 | .5 | full body with a little air — the workhorse |
| FS | 0.95 | .5 | full body tight |

| MS | 1.6 | .68 | waist up |
| MCU | 2.4 | .78 | chest up |
| CU | 3.6 | .84 | head |
| ECU | 6 | .88 | detail |

The first cut of this table shipped MS at full-shot framing and the rack's
second subject fell out of frame — sizes are conventions with meanings, not
free parameters. Per-shot `anchor:` overrides the aim height when a
composition needs it (e.g. aiming low to hold a prop or sign in frame).

**A rung is relative to the DECLARED subject, not to the figure.** `MS` means
"the subject spans 1.6 frame-heights" — waist-up when the subject is a whole
person, and a close-up of *part of a head* when the subject is a head. Naming a
small sub-subject and then reaching for a tight rung compounds twice and puts the
camera inside it. For an insert on a named part, use a rung that FITS
(`FSA`/`FS`); the tightness is already in the choice of subject.

**Union subjects take WIDE rungs only.** `MS`/`MCU`/`CU` carry human-figure
meanings — waist-up, chest-up, head — and a union box of two fighters has no
waist. Asking for `MS` on a 9-unit-wide pair jams the camera into the gap
between them. Use `WS`/`FSA`/`FS` for a union and save the tight rungs for a
single named subject.

**The camera has a reachable region; the lens is how you stay inside it.**
Rung and lens set the distance, so a tight rung on a normal lens can put the
camera inside a wall, inside the subject's own volume, or across a set piece —
the solver places, it does not collide. When the framing is right and the
position is not, hold the rung and declare a longer per-shot lens (`fov:`
smaller): identical subject-to-frame ratio, camera farther out. The reverse
trade — widening `fov` to squeeze into a cramped set — buys perspective
distortion along with the proximity, which is a look to choose, not a fix.

**Subjects may name several things.** `subject: ['plank','hammer']` frames the
union box. Every causal beat is two objects and the space between them, and
hand-authoring a composite subject with an invented centre is the thing this
vocabulary exists to abolish. `focus:` takes a list too.

**`d` (depth), optional.** Declare it and the solver fits the **projected** box,
rotating the extent by the shot's angle. Measured on a real scene: identical
rung, identical declared size, varying only `angle` — 0° fitted, **−26° clipped
at the frame edge**, −45° fitted. An axis-aligned width is non-monotonic in
angle. With `d` undeclared the subject is treated as billboarded, which is what
every scene written before this assumed.

**`anchorX`, optional.** The ladder had a vertical anchor and none horizontal, in
both backends. That is why framing a named subject put its most important feature
at the frame edge, and why an author porting the ladder to 2D used one of its
seven rungs and framed regions instead.

**The solver** — `dist = max(h/f, wProj/(f·aspect)) / (2·tan(fov/2))`: size and
lens give distance, binding on whichever axis is tighter; `angle`/`elev` place the camera on that sphere; the aim rides the
subject. The projected fit rotates the box by **azimuth only** — a near-top-down shot of
a deep subject can still clip on depth. `size2`/`angle2` ease across the shot's duration — push-in,
pull-out, orbit — and a moving subject makes any shot a tracking shot.

**`angle` is a world azimuth, and the shot that shows a face is a product.**
The solver places the camera at `[sin(angle), ·, cos(angle)]` of the subject's
center: `0°` puts it on **+Z**, `90°` on **+X**, negative angles the other way
around. The character convention faces **+X** (`breakdown.md`), so on a
convention-following subject `angle:90` is frontal, `0` and `180` are the two
profiles, and `-90` shoots the back of the head. Neither fact answers the
framing question alone — what the camera sees is the subject's facing composed
with the shot's angle, and a subject that turns mid-film carries its frontal
angle with it. A build that composed nothing framed the back of a head for
five consecutive shots.

**Cuts** — how a shot ENTERS: `hard` (default), `whip` (0.16s snap), `blend`
(0.8s dolly-morph). **`whip` is a fast cut, not a whip pan** — it differs from
`blend` only in duration, and without directional blur the ~3 transit frames read
as a snap with a stutter rather than a smear. Measured; use it for pace, not for
the effect its name suggests. `match: true` is the match-cut constraint: the entry must
carry identical framing vocabulary (size/angle/elev/fov/anchor) to the
previous shot — checked at load, throws loud. The worked instance is inherited:
MS on a sign plate, hard cut, MS on a robot's torso — the frames rhyme because
the compiler guarantees they must. Nothing shipped here uses `match:` yet.

**Focus** — needs no extra wiring: the always-on `RenderPipeline` carries the
DoF chain, gated on declaring `STYLE.dof` (`{focalLength, bokehScale}`,
defaults 2.5 / 3). Each shot's DoF
plane sits on `focus` (default: its subject); `shotFocus` is solved per frame
and feeds the chain's focus uniform whether or not DoF is enabled, so setting
`focus:` without `STYLE.dof` changes nothing visibly. **A rack focus
is two adjacent shots differing only in `focus`, joined by `blend`** — the
focus distance interpolates with the same ease as the camera. No manual
distance math survives in scene code.

`focalLength` is **world units**: how far off the focal plane something goes
fully soft. It scales with the set, so 2.5 is shallow in a room and
effectively everything-in-focus across a landscape — a value that reads well
on one scene means nothing on another. Both names are three's own; this
paragraph documented a `{maxBlur}` for a long time and r185's `dof()` has no
such parameter at any position.

**The measured caution, which is the reason to look rather than assume.** The
solver half and the render half fail independently. `shotFocus` was correct
and interpolating (8.18 → 5.62 across a blend, measured by `probe`) while the
render ignored it entirely, because the pipeline was handing `dof()` a depth
texture where it wanted view-space Z. That combination is silent: no error,
smoke green, every input individually valid, and a uniform imperceptible
softening instead of depth of field. `bracket-dof.js` pins the property that
catches it — the frame must CHANGE when `focalLength` changes — because "is
there an effect" passes in both states and cannot tell them apart.

The worked rack, lifted from a corpus film whose instruments ran green:

```js
const STYLE = { /* … */ dof: {focalLength: 2.2, bokehScale: 3} };

// Two adjacent shots, IDENTICAL framing, differing only in `focus`.
// `blend` is what interpolates the focus distance across the cut.
{at:['regard',.02], subject:'walker', size:'MCU', angle:10, focus:'shard'},
{at:['regard',.42], subject:'walker', size:'MCU', angle:10, focus:'walker',
 cut:'blend'},
```

**Size `focalLength` against the pull, not against taste.** Probe the two
ends before choosing it — `build.js probe <scene> <t> 'shotFocus'` — and pick
a focalLength of the same order as the travel. In the film above the pull is
8.18 → 5.62, a 2.56-unit move, so 2.2 puts the far half soft and the near
half sharp; at 40 the whole set stays sharp and the rack is invisible while
every other check still passes.

**Stage across the line, not down it.** Two subjects separated along an axis
read as two subjects only when the camera looks ACROSS that axis — a small
`angle` relative to their separation. Swinging near-perpendicular to the frame
(a large `angle`) looks down the line and stacks them in depth, which is the
problem side-on framing is usually reached for to fix. Get variety from
elevation and from which side, not from going side-on.

**Camera energy** — `STYLE.energy`: `locked` (tripod), `steadicam` (gentle
drift), `handheld` (documentary nerves) — seeded `noise1` tracks, amplitude
riding `CONFIG.sway` so `build.js loop`'s held-camera warning stays honest.

## Deliberately not built yet

Earn-in rule: vocabulary enters when a film is **blocked** expressing something the tables cannot say — not merely when one would find it convenient.

- **Dissolve / wipe** — needs a two-target composite; no film has wanted one.
- **ffmpeg-side edit lists** (`xfade`) — would fork the MP4 from the HTML
  artifact; stays out until something needs it, and then as an opt-in.
- **Cut rhythm as a style parameter** — belongs to the style bibles (Phase 4).
- **2D solver analog** — when a 2D film wants shot vocabulary.
