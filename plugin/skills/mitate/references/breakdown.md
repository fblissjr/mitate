# Breakdown: the declarative layer, enumerated

A mitate scene is mostly **declaration**, not code: you say what you mean and the
kit works out the consequences. That layer is substantial, it works, and until
this file it was unnamed and unspecified as a whole — so nobody could say what it
can express, what it silently ignores, or what checks any of it.

This is the specification. One section per table: what it declares, its fields,
who reads it, and — the column that matters most — **what validates it**, where
the honest answer is usually *nothing*.

> **Not here.** How to author a film → `method.md`; shot grammar and what `h`
> means → `film-language.md`; look packs → `bibles.md`; character vectors →
> `characters.md`; what a check can and cannot see → `instruments.md`.

**Not audited:** whether each documented semantic is *correct* — this file
records what the code does, and a wrong-but-consistent semantic would survive
it. Field descriptions are copied from the templates' own comments where those
exist.

## The shape of the layer

| table | 3D | 2D | character | declares |
|---|:--:|:--:|:--:|---|
| `BEATS` | ● | ● | ● | named spans — the editor's half of the film |
| `STYLE` | ● | ● | ● | the look, including camera energy and cut pace |
| `CONFIG` | ● | ● | ● | everything that is neither timing nor look |
| `FRAME` | ● | ● | ● | the one declared reference frame |
| `SUBJECTS` | ● | | ● | what a camera can frame |
| `SHOTS` | ● | | ● | the shot list — the cinematographer's half |
| `SIZES` | ● | | ● | the shot-size ladder (kit-owned, not authored) |
| `KEYS` | | ● | | camera keyframes; 2D has no cinematography to solve |
| proportion vector | | | ● | a body, as numbers |

Two things are derived and must never be authored: `BEAT{}` (each beat's absolute
`t0`/`t1`, accumulated from `BEATS`) and `TOTAL` (their sum, published as
`window.DURATION`). Because duration is derived, a declared-versus-actual
mismatch is impossible by construction — the one place in this layer where that
is true. **So "check that `BEATS` sums to `DURATION`" is not a check that can
exist**, and a plan that listed it was asking for a control over a subtraction
with one operand. `build.js check` recomputes the accumulation anyway, because it
needs the spans to resolve every anchor, and validates what a sum cannot: that no
beat is declared twice and that every `dur` is a positive number.

---

## `BEATS` — named spans

```js
const BEATS = [
  {name: 'title', dur: 2.8},
  {name: 'one',   dur: 3.0, cap: "1 · First beat — what the viewer should notice"},
];
```

| field | meaning |
|---|---|
| `name` | the address every other table anchors to |
| `dur` | seconds. Durations, **never** absolute times |
| `cap` | optional caption shown across the beat |

Durations rather than timestamps is the whole point: they accumulate, so
lengthening one beat shifts every later beat instead of silently overlapping it.
That is what makes retiming a one-line edit. The template states the rule
absolutely — *nothing else in the file may contain a literal timestamp* — and
everything addresses beats by name through `ramp`/`pulse`/`beatAt`.

**Validated:** `beat(name)` throws on an unknown name, in all three templates.
`build.js check` reads reading speed against the same limit `smoke.js` owns,
before a frame renders, and rejects a duplicated or non-positive `dur`.
**Not validated:** whether the caption is legible at the size it will actually be
viewed — a different question from whether it fits, and `instruments.md` records
it as having no instrument at all.

## `STYLE` — the look

The template declares three keys. **The kit reads twelve.** That gap is the
single most useful finding in this enumeration, because an author scaffolding
from a template sees only what the template declares.

**Kit-read** (a shipped template consumes these):

| key | shape | default |
|---|---|---|
| `bg` | colour | declared in template |
| `exposure` | number | declared in template. Lower this first if the scene looks washed out |
| `energy` | `'locked' \| 'steadicam' \| 'handheld'` | declared in template — camera nerves |
| `lens` | number, vertical degrees | `42` |
| `cutDur` | partial override of the cut table | merged over `{hard:0, whip:.16, blend:.8}` |
| `dof` | `true \| {focalLength, bokehScale}` | off; `2.5 / 3`. `focalLength` is WORLD UNITS, so it scales with the set. Focus follows `SHOTS[].focus` |
| `bloom` | `true \| {strength,radius,threshold}` | off; `.5 / .3 / .9`. **Thresholds unmeasured on the TSL path** |
| `ink`, `stroke`, `accents`, `fontFamily`, `titleInk` | colours / typography | per template |

**Film-private** — names films have invented that no template reads: `dotIn`,
`dotOut`, `floor`, `fogFar`, `gearIn`, `gearOut`, `markerGlow`.

**`STYLE` is an open bag, not a schema** — a film may invent keys, and a film-
private name that a future kit key collides with would silently change meaning.
**Validated: consumption.** `build.js check` warns on any declared
key that nothing reads — not the fences the scene carries, not the scene's own
code — naming the nearest known key when one is within two edits, so a
misspelled `exposure` is a named near-miss instead of a silent render at the
default. The kit vocabulary is derived from the canonical fence store's own
reads at check time, never listed (a hand-held registry is another copy of the
code); consumption is decided by the scene's own text, which is what lets a
film-private key pass without any annotation. What this does not validate:
whether a key that IS read does what its name says.

## `CONFIG` — neither timing nor look

| key | meaning |
|---|---|
| `title`, `subtitle` | title-card text |
| `flashes` | world-cut flashes as `{beat, at, w?}`, resolved into `FLASHES` |
| `seed` | reshuffles all seeded randomness |
| `sway` | idle camera drift. **Set to `0` for `build.js loop`** — sway moves every pixel every frame, which defeats WebP/GIF inter-frame compression and can 10× the file size. Free in mp4 |
| `capFade` | caption fade inset from each beat edge, seconds |

**Two more the kit reads and no template declares:**

| key | where | default |
|---|---|---|
| `flashWidth` | **all three** templates — it lives in the `DRIVER` fence | `.25` (per-flash `w` overrides) |
| `cameraFloor` | **both 3D** templates — it lives in the `SOLVER` fence, which 2D has no copy of | off. Opt-in, world units — clamps the camera's `y` |

**Validated: the beat resolution, and consumption.** `build.js check` resolves
each `flashes[].beat` against `BEATS` — the only exercise that resolver gets,
since no shipped template declares a flash — and the same
unknown-key warn as `STYLE` covers this bag: a misspelled `capFade` draws a
warn naming the near-miss instead of rendering at the default and reading as
a choice.

## `FRAME` — the one declared reference frame

```js
const FRAME = { aspect: 16/9, px: [1920, 1080] };
```

`aspect` is the design frame the scene is authored for; `px` is what the recorder
renders at. It reads `window.FRAME.px`, so changing this is the **only** edit
needed to ship 9:16 vertical or 1:1 square — the tooling follows.

This table exists because the skill previously measured against many implicit
frames — canvas scaled by window height, captions in fixed CSS px, the shot
ladder against frame height, an overflow check against a hardcoded width — which
disagreed the moment a window was not 16:9.

**Validated:** `smoke.js` reads `FRAME.aspect` and fails a scene whose contents
change at a different window shape (framing invariance). `build.js check` fails a
scene whose `px` and `aspect` disagree — the recorder would otherwise render at a
shape the scene was never composed for. **Not validated:** whether either is the
frame the film wanted.

## `SUBJECTS` — what a camera can frame

```js
const SUBJECTS = {
  knot: {pos: t => [0, 3 + Math.sin(t*1.3)*.2, 0], h: 3.6},
};
```

| field | meaning |
|---|---|
| `pos` | **a pure function of `t`** returning the subject's centre. A moving subject is a tracking shot for free |
| `h` | the framed **extent** — not the figure's height |
| `w`, `d` | optional width and depth; `w` defaults to `h`, `d` to `0` |

Craft note from the template: track a subject's **travel**, not its jumps — leave
vertical action out of `pos` so it moves in the frame instead of being cancelled
by the camera.

**Validated:** an unknown subject name throws; `build.js check` resolves every
name a shot uses without loading the page. **Not validated — and this is the
layer's most expensive gap:** nothing compares `h`/`w`/`d` against the geometry
they claim to describe. A declared extent that is wrong produces a shot framed
around a box that does not match the object, and it reads as a composition
problem rather than a data error. This is a counted, recurring defect class, not
a hypothetical. It is also the one item on `check`'s work-list that `check` does
**not** do: measuring geometry means naming scene objects, which is `build.js
probe`'s admitted exception to the prime directive and not a second command's to
take. The instrument that exists is `probe`; what is missing is the comparison
between what it reports and what `SUBJECTS` declares.

## `SHOTS` — the shot list

```js
const SHOTS = [
  {at: ['one', .1], subject: 'knot', size: 'FS', angle: 60, cut: 'blend'},
];
```

| field | meaning |
|---|---|
| `at` | `[beatName, fraction]` — the anchor. A shot runs until the next shot starts |
| `subject` | a `SUBJECTS` key, **or an array** — several resolves to the union box |
| `size` | a `SIZES` rung |
| `angle` | degrees around the subject, `0` = from `+Z` |
| `elev` | degrees above level, default `6` |
| `fov` | this shot's lens, default `STYLE.lens` |
| `size2` / `angle2` | optional end values — a push/pull or an orbit eased across the shot |
| `focus` | subject the depth-of-field plane sits on, default the shot's subject |
| `anchor` | overrides the rung's vertical anchor `a` outright. The remedy for a union box, which has no waist for `MS` to aim at |
| `anchorX` | horizontal aim, as a fraction of the box width along camera-right. Default `0` |
| `cut` | how the shot **enters**: `'hard'` (default), `'whip'` (.16s snap), `'blend'` (.8s dolly-morph) |
| `match` | `true` = must enter with the same framing vocabulary as the previous shot |

Raw keyframes are absent on purpose: coordinates were never the author's intent,
framing was. If a shot the vocabulary cannot say is genuinely needed, **extend
the vocabulary — do not sneak coordinates back in.**

**Validated at load:** `match: true` throws unless `size`, `angle`, `elev`, `fov`
and `anchor` all equal the previous shot's. An unknown `size` throws.
**Validated lazily:** `subject` and `focus` throw on an unknown name — but only
on a frame where that shot is active, so a typo in a shot nobody seeks to is
found by a viewer, not by loading.
**Validated before the page loads, by `build.js check`:** every one of the three
this section used to list as unchecked — `at`'s fraction inside `0..1`, shots in
ascending time order, and a union on a rung whose anchor is a body landmark. The
last is a warning rather than an error, and narrowed: a union that supplies
`anchor` explicitly has supplied the landmark the box lacks, which is what a
real two-shot does deliberately. `check` also resolves the names the two rows
above leave to load time and to luck, and flags three or more shots that share
one framing.

## `SIZES` — the shot-size ladder

Kit-owned, not authored. `EWS WS FSA FS MS MCU CU ECU`, each `{f, a}` where `f`
is how many frame-heights the subject's full height spans and `a` is the vertical
anchor on the subject the camera aims at. Calibrated to the convention a
cinematographer means: `FS` is full-body tight, `MS` is waist-up. The first cut of
this table shipped `MS` at full-shot framing and a subject fell out of frame.

## `KEYS` — the 2D camera rail

```js
const KEYS = [{beat: 'two', at: .45, x: 0, y: -2, zoom: 1.55}];
```

2D keeps explicit keyframes where 3D has a solver, on a stated argument: **a flat
frame has no cinematography to solve.** Values are lerped against a
**smoothstep-eased** fraction of the span — `ss(t, a.t, b.t)`, not `t` itself —
so motion between adjacent keys eases in and out rather than running at constant
velocity, with `CONFIG.sway` noise added on top. It is **not** a linear
interpolation, and reading it as one predicts uniform motion and is wrong about
every 2D camera move. World space is 90 units tall,
`y` down, origin centre, contained on both axes against `FRAME.aspect`.

**Validated:** the beat name, via `beatAt`, and again by `build.js check` before
the page loads, along with `at` inside `0..1`. **Not validated:** anything else —
`x`, `y` and `zoom` have no reachable ground truth without rendering.

## The character proportion vector

A body expressed as numbers, consumed by `buildCharacter(P, matFor)`. Lengths in
world units, angles in degrees; facing `+X`, sagittal plane `XY`, `z` lateral.
Defaults come from `propDefaults()`; *"a bear", "a human", "the creature you just
described"* are overrides of those defaults plus a material choice.

Groups: pelvis and torso (`hipH`, `torsoLen`, `torsoTilt`, `pelvisR`, `chestR`);
neck and head (`neckLen`, `neckSegs`, `neckTilt`, `headR`, `muzzle`); tail
(`tailLen`, `tailSegs`, `tailR`, `tailTilt`); stance (`shoulderW`, `hipW`); limbs
(`foreUpper`, `foreLower`, `foreR`, `hindUpper`, `hindLower`, `hindR`); feet
(`footLen`, `footH`); and `quadruped`, which decides whether forelimbs **plant**
as a gait or **hang** as arms.

**This is the layer's best-shaped member, and the model worth copying.** It is a
fixed schema with one typed hole: `matFor(part)` returns the material for
`'torso' | 'head' | 'muzzle' | 'limb' | 'foot' | 'tail'`, which is where shading
packs plug in without touching the skeleton. From that one constructor a single
corpus film builds a bear, a human and an invented strider. Structure at the seam,
arbitrary code in the leaf.

**Validated, and it throws loudly:** hind legs must out-reach `hipH`; forelegs
must reach the ground from shoulder height. `gaitPose` additionally requires
`rootX` to be passed rather than read back from the scene graph, because the
silent failure is NaN foot targets — a film that renders and is subtly wrong.
**Not validated:** the stance-width rule the comment states
(`shoulderW/2 >= chestR + foreR*~0.4`, or hanging arms embed in the torso) is
documented and unchecked.

---

## What this enumeration establishes

**The layer is real and it is uneven.** Two members have genuine schemas that
throw on violation — the proportion vector and, partially, `SHOTS`. Two are open
bags with no schema at all — `STYLE` and `CONFIG`. The rest sit between.

**Validation clusters where a mistake is unrepresentable, not where it is
expensive.** Unknown names throw because a lookup fails; the checks that would
catch an authoring error which *is* representable — an extent that does not match
its geometry, an anchor outside its beat, a caption that will not fit — are the
harder half. Two of those three are covered: `build.js check` is that reading of
this section, built from it. The third is still open and is the expensive one,
because it is the only item here that cannot be decided from the tables at all —
it needs the geometry, and reading geometry is `probe`'s exception.

**Which is the sharper form of the claim above.** "Decidable from the tables
alone" was the right test, and applying it separates the layer's gaps into two
kinds that look identical in this file: the ones a text pass closes, and the one
that needs the scene to be running. Only the first kind was ever cheap.

**Kit-read and film-private are indistinguishable in the source.** A key the kit
consumes and a key one film invented look identical in `STYLE`. Nothing marks the
boundary, so extending the kit risks colliding with a name a film already uses,
and an author cannot tell which keys are sanctioned.

**Two kit-read `CONFIG` keys appear in no template.** `flashWidth` and
`cameraFloor` are consumed by shipped templates and declared by none, so they are
reachable only by reading the kit — which is the path this project treats as a
defect rather than a route.

**What is deliberately not enumerated here:** geometry construction and per-frame
motion. Those are authored code, not declaration, and they are where most of a
film's lines actually live. That boundary — which parts of a scene are data and
which are code — is the open question this file exists to make answerable, and
naming it is as far as an enumeration can go.
