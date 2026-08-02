last updated: 2026-08-02

# Addressing: what `t` is, and what the position-encoding literature does and does not lend us

## Abstract

mitate's scenes are pure functions of a single scalar `t`. This paper argues
that `t` is best understood as a **position** in a declared coordinate, not as a
clock, and that the interesting design question is not "how fast does time run"
but "against what origin is each expression addressed". The kit already answers
that question six different ways and squeezes all six through one scalar
argument.

The owner drew an analogy to position encoding in transformers: learned absolute
embeddings proved inflexible, relative schemes and then RoPE proved more
flexible, and the same trajectory may repeat here. This paper develops that
analogy, and then attacks it. The mechanism does not transfer at all: RoPE is a
rotation that makes an attention inner product depend on `i - j`, and mitate has
no attention, no learned parameters, and no operation that compares two
positions. What transfers is one lesson about encoding, and even that lesson
transfers in a weaker and more conditional form than the analogy suggests,
because mitate's failure mode is not extrapolation but **covariance under
editing**, which is closer to a dual of extrapolation than to the same problem.

Two things are new here and measured rather than argued: a quantification of the
known `bear-and-bees` retiming defect (section 4), and an aliasing property of
the frozen noise pool that makes it the one genuine learned-absolute-embedding
analogue in the codebase (section 6.2). Both carry their conditions, per
`docs/source-of-truth.md`. Everything else in this paper cites a home and does
not own it.

---

## 1. What `t` is

The contract fixes `t` as the only input to the world:

> Everything on screen is a pure function of t (no `Math.random()`, no
> `Date.now()`, no accumulated state). That is what makes the HTML loop and the
> MP4 render provably identical.

(`plugin/skills/mitate/templates/scene.template.html:71-77`)

Three properties follow, and together they are what make "position" the better
word than "clock".

**`t` is random-access.** `window.seekTo` evaluates a frame from `t` alone
(`plugin/skills/mitate/templates/scene.template.html:664`). Nothing is replayed.
Frame 400 costs what frame 0 costs and does not depend on frame 399 having been
drawn. A clock advances; a position is indexed.

**`t` is bounded and declared.** `seekTo` clamps to `[0, TOTAL]`, and `TOTAL`
resolves once at load from the `BEATS` literal
(`plugin/skills/mitate/templates/scene.template.html:184`, `:664`). The whole
toolchain reads it back through the contract rather than deriving it
independently (`plugin/skills/mitate/templates/scene.template.html:631`;
`plugin/skills/mitate/templates/shoot.js:146-150`).

**`t` is continuous, and steps are a projection on top of it.** `quant(t,n)`
exists (`plugin/skills/mitate/templates/scene.template.html:173`) and the kernel
is explicit about where it may live: "the quantized t is a pure function of t.
Quantize per-object, never inside seekTo itself"
(`plugin/skills/mitate/templates/scene.template.html:161-164`). This is the
sharpest available statement of the step-versus-coordinate distinction, and the
codebase enforces it structurally: `seekTo` contains no `quant` call in any
template. A scene can therefore hold a stop-motion prop at 12 poses per second
beside a smoothly interpolated camera, in the same frame, without either one
knowing about the other. Had `quant` been applied inside `seekTo`, the coordinate
itself would have become discrete and every consumer would have inherited the
step rate.

So: `t` addresses a point in a bounded, continuous, declared interval. The word
"clock" imports exactly the properties mitate spent its determinism budget
removing, namely monotone advance, accumulation, and wall-clock coupling. The
owner's reframing is correct and it is not merely rhetorical, because the three
properties above are each separately load-bearing.

---

## 2. The address space: six frames, one scalar

`t` is the only argument the driver passes to `animate()`. It is not the only
coordinate the scene reasons in. Six distinct frames are in active use, and every
one of them is reconstructed inside `animate()` from that single scalar.

| # | frame | origin | unit | constructor |
|---|---|---|---|---|
| 1 | film-absolute | film start | seconds | `t` itself |
| 2 | beat-fraction | a named beat's start | fraction of that beat | `ramp`, `pulse`, `span`, `during`, `beatAt`, `rampE` |
| 3 | beat-seconds | a named beat's start | seconds | `secAt`, `rampS`, `pulseS` |
| 4 | event-relative | an arbitrary absolute instant | seconds since | `latch` |
| 5 | distance travelled | where a walk began | world units | `s`, consumed by `footTarget` / `gaitPose` |
| 6 | warped | film start | warped seconds | `warp` |

Frames 2 and 3 come from a single resolution step. `BEATS` holds durations, not
timestamps; the kernel accumulates them into absolute spans exactly once at load
(`plugin/skills/mitate/templates/scene.template.html:183`) and everything after
that addresses by name:

> beat addressing (use these, never raw timestamps)

(`plugin/skills/mitate/templates/scene.template.html:178`)

The rationale on the same comment block states the invariance property directly:
"The a/b arguments are FRACTIONS of the beat, not seconds, so an effect keeps its
place when the beat is retimed"
(`plugin/skills/mitate/templates/scene.template.html:180-182`). The template
header makes it a prohibition: "NOTHING else in this file may contain a literal
timestamp"
(`plugin/skills/mitate/templates/scene.template.html:85`).

**This is enforced in practice, not just asserted.** Across every shipped
example, no `ss(t, <literal>, <literal>)` or `bump(t, <literal>, <literal>)`
call exists in scene code. Every temporal anchor routes through the beat table.
The one apparent exception, `ss(t, e0+di, e0+di+.15)` at
`plugin/skills/mitate/examples/bear-and-bees.html:1591`, derives `e0` from
`beatAt('erupt',.05)` on line 1588 and offsets it by a physical stagger. That is
frame 3 spelled out longhand, not a raw timestamp.

The kit is therefore already relatively addressed, and has been since before the
analogy was drawn. The owner's prediction that mitate will move from absolute to
relative addressing "over time" describes a transition that already happened at
the kernel's founding. Section 9 argues that the interesting frontier is
elsewhere.

### 2.1 The distinction the kit makes that ML does not

Frames 2 and 3 share an origin and differ only in unit, and the reference is
emphatic that the difference is semantic:

> **Fractions by default; seconds when the duration is physical.** A rise
> "across the first half of a beat" should stretch if the beat grows. A 0.25s
> flash or a 0.06s world cut should not.

(`plugin/skills/mitate/references/method.md:89-93`)

The consequence has already cost real work: `method.md:625-626` records that
stretching a cut window with its beat uncovers the cut, a bug that cost one
re-render. So mitate does not have one relative scheme, it has two, and choosing
between them per quantity is a judgment about physics, not about style. Hold on
to this. It is where the ML analogy takes its heaviest damage (section 5.3).

---

## 3. The relative-position operators

### 3.1 `latch` is a relative-position operator, and it is used as one

`const latch=(t,at)=>t<at?0:t-at;`
(`plugin/skills/mitate/templates/scene.template.html:233`)

It maps a film-absolute position to seconds-since-an-event, and its documentation
argues the case in terms that are almost exactly the argument for relative
attention: driving one element from another's own expression propagates onset but
not persistence, and the fix is to hand the downstream link a **time origin** and
let it evaluate its own closed form from there
(`plugin/skills/mitate/templates/scene.template.html:219-232`). The comment
records the measured failure that motivated it: a hammer's post-impact ringdown
retracted the driver and an entire fallen domino row stood back up and fell
again.

`bear-and-bees` uses it as designed. The anchor is a beat-fraction address:

```
const T_HIT=beatAt('boop',.55);       // the pendulum's latch anchor
```
(`plugin/skills/mitate/examples/bear-and-bees.html:1536`)

and the hive's response is a physical ringdown evaluated in seconds since that
anchor:

```
const L=latch(t,T_HIT),L2=latch(t,beatAt('button',.45));
hivePiv.rotation.z=.32*Math.sin(4.4*L)*Math.exp(-.42*L)
                  +.05*Math.sin(5*L2)*Math.exp(-.9*L2);
```
(`plugin/skills/mitate/examples/bear-and-bees.html:1582-1584`, with the
companion `rotation.x` and `position.y` terms on `:1585-1586`)

This is the correct composite and worth naming precisely, because it is the
pattern the rest of this paper recommends generalizing: **the anchor is
relative to the edit structure, the response is absolute in physical units.**
Retiming the `boop` beat moves `T_HIT` and the whole ringdown moves with it,
undistorted. Stretching `boop` does not turn a 2.4 rad/s oscillation into a
1.6 rad/s one, which would be physically wrong.

### 3.2 `warp` is a monotone reparameterisation, and it splits the scene into two clocks

`warp(t, segs)` (`plugin/skills/mitate/templates/scene.template.html:248-260`)
rescales windows of real seconds, running the coordinate slow inside a segment
and 1:1 outside it. The comment claims strict monotonicity for `rate > 0` and
purity, and directs the author to "use T for bodies, t for beats/camera"
(`plugin/skills/mitate/templates/scene.template.html:241-247`).

Measured 2026-07-30 on `bun`, sampling `t` at 1e-4 over `[0, 20]`, the kernel
source copied verbatim: monotonicity holds in every case tested, including
degenerate ones. Purity holds; the sort is on a copy and the input array is not
mutated. `rate: 0` produces a hold rather than a reversal, which is consistent
with the "strictly monotone for rate>0" wording.

**One property the comment does not claim and the function does not have:
continuity under overlapping segments.** With
`segs = [{at:1,dur:5,rate:1},{at:2,dur:.1,rate:.2}]`, `warp` returns 6.0000 at
`t = 6` and 9.1201 at `t = 6.0001`: a 3.12 second jump in the body clock across
one sample, produced by an interior term going negative when a later segment's
end precedes the running cursor. The result is still monotone, so it is not a
time reversal, but it is a hard cut in the warped coordinate that no author
wrote. Well-formed disjoint segments behave exactly as documented. This is
unguarded in the kernel and undocumented anywhere; see recommendation R3.

**Does `warp` preserve what makes `t` addressable?** Partly, and the qualifier
matters. It preserves purity, boundedness, and order. It does **not** carry the
address table with it. `BEAT{}` spans are fixed in unwarped seconds, so
`ramp(warp(t,...), 'flee', ...)` addresses the wrong interval. The kernel's
instruction to keep beats and camera on raw `t` is not a stylistic preference,
it is the only configuration in which the two coordinates stay coherent. A scene
using `warp` therefore runs two clocks at once, with the author responsible for
routing each quantity to the right one. Nothing checks the routing.

### 3.3 Argument shift is the closest thing to an `i - j` operator

`bear-and-bees` shifts the argument of a position function to produce a lagged
follower:

```
const swarmXAt=t=>lerp(HIVE_C[0],bearXAt(t-.5)-1.2, ...)
```
(`plugin/skills/mitate/examples/bear-and-bees.html:1380`)

and per-bee, `const cx=bearXAt(t-lag)-1.0-.05*i` with `lag=.25+.06*i`
(`plugin/skills/mitate/examples/bear-and-bees.html:1596-1597`). This is a domain
translation, the operation whose invariance RoPE is built to secure. Note what it
is measured in: absolute seconds, applied to a function whose interior is
beat-fraction addressed. Retiming `flee` rescales `bearXAt`'s shape while the
0.5s lag stays put, so the swarm's spatial offset behind the bear changes. For a
chase lag that is arguably the right call (a bee's reaction time is physical),
but it is a choice nobody recorded making.

---

## 4. The defect the analogy predicts, measured

`bear-and-bees` contains one causal relationship whose two halves are addressed
in different frames.

The bear's flee travel is **beat-fraction** addressed:

```
const bearXAt=t=>lerp(WALK_START,STOP_X,ss(t,beatAt('title',.45),beatAt('amble',.97)))
               +(FLEE_END-STOP_X)*ramp(t,'flee',.09,.98)
               -.38*pulse(t,'erupt',.12,1);
```
(`plugin/skills/mitate/examples/bear-and-bees.html:1377-1379`)

The duck that must keep the bear's head clear of the hive underside as it passes
is **beat-seconds** addressed:

```
// duck OPENS BEFORE the launch (review: the launch reached the hive's
// x-span ~0.3s before the old duck had amplitude ...)
const duck=pulseS(t,'flee',-.12,1.35);   // scuttle low UNDER the hive
```
(`plugin/skills/mitate/examples/bear-and-bees.html:1560-1562`)

The comment is the evidence. This exact desynchronization shipped once, was
caught on review as a measured clip, and was repaired by moving the duck's onset
0.12 seconds earlier. The repair fixed the symptom at the current beat duration
and left the encoding mismatch in place.

### 4.1 Quantification

Measured 2026-07-30. Method: the kernel's `ss` and `bump` copied verbatim,
`STOP_X = -1.2`, `FLEE_END = 15`
(`plugin/skills/mitate/examples/bear-and-bees.html:1374-1376`), hive centre
`x = 2.95` (`:1249`, `:1253`), head offset `+3.3` from the root (`:1383`). The
pass event is defined as the first `t` at which the head's x reaches the hive's
x, holding everything else fixed and varying only the `flee` duration from its
shipped 3.2s (`:676`). The event criterion is a proxy chosen for this
measurement; its magnitudes depend on that choice, its shape does not.

| `flee` duration | pass at (s after beat start) | duck amplitude at the pass |
|---|---|---|
| 1.6 | 0.342 | 0.834 |
| 2.4 | 0.513 | 0.976 |
| **3.2 (shipped)** | **0.683** | **0.989** |
| 4.0 | 0.854 | 0.872 |
| 4.5 | 0.961 | 0.739 |
| 6.0 | 1.281 | 0.146 |
| 8.0 | 1.708 | 0.000 |

Three readings.

**The repair was tuned, not fixed.** At the shipped duration the duck sits at
0.989 of full amplitude exactly when the head passes under the hive. That is not
luck, it is the review's correction landing well. It is also a point solution.

**The degradation is one-sided and silent.** Lengthening the beat drives the
amplitude to zero: at 8.0s the duck has entirely finished before the bear
arrives, and the near-miss gag no longer happens. Nothing in the toolchain
detects this. The scene still renders, still passes determinism, still passes
seek purity, still passes every parity check. `smoke.js` samples fractions of
`DURATION` (`plugin/skills/mitate/templates/smoke.js:188`) and would sample a
perfectly well-formed frame of a bear standing straight up beneath a beehive.

**A one-line edit is enough to cause it.** `BEATS` is a literal list of
durations, and retiming is advertised as a one-line edit
(`plugin/skills/mitate/references/method.md:95-96`). The property that makes
retiming cheap is the property that makes this defect reachable.

### 4.2 How common is the mismatch?

I ran a per-beat encoding classifier over the scene code of
`plugin/skills/mitate/examples/bear-and-bees.html` (lines past the vendored
bundle), tagging each beat name by whether it is addressed through the
fraction family (`ramp`, `pulse`, `during`, `beatAt`, `span`, `rampE`) or the
seconds family (`rampS`, `pulseS`, `secAt`). Three of the film's eight beats are
addressed both ways:

- **`flee`**: fractions at `:1378`, `:1380`, `:1542`; seconds at `:1559`,
  `:1562`, `:1580`. This is the known defect.
- **`erupt`**: fractions at `:1379`, `:1380`, `:1555`, `:1570`, `:1588`; seconds
  at `:1557`, `:1566`, `:1580`. The anticipation squash (`pulseS`, `:1580`) and
  the launch recoil (`pulse`, `:1379`) are an anticipation-and-release pair, so
  the same coupling exists. Latent and untested.
- **`hush`**: fractions at `:1607`, `:1608` (the scout bee emerging and
  drifting); seconds at `:1558`, `:1575` (the bear's fourth-wall glance and its
  blinks). Whether these are causally paired is a directorial judgment. Latent.

The five remaining beats are internally consistent.

The honest reading of this is a negative result about tooling. A naive per-beat
lint fires three times on a film with one confirmed defect, so its precision is
at best one in three, and the two other hits are cases where a human has to
decide whether two things are meant to be coupled. **The unit that matters is
the causal pair, not the beat**, and a causal pair is not recoverable from the
source without knowing what the film is about. Recommendation R1 works around
this rather than solving it.

---

## 5. Where the analogy breaks

### 5.1 There is no inner product, so there is no mechanism to port

RoPE's content is a single algebraic fact: rotate a query and a key by angles
proportional to their absolute indices, and the attention inner product
`<R_i q, R_j k>` becomes a function of `q`, `k`, and `i - j` only. Absolute
encoding is applied; relative behaviour comes out. It is elegant precisely
because it is a property of the bilinear form that attention already computes.

mitate computes no bilinear form between two positions. It computes no function
of two positions at all. The prime directive forbids it: every frame is
evaluated independently, so nothing in a scene ever holds `t_i` and `t_j` at
once. The one construct that looks like it might, `latch(t, at)`, is not a
comparison between two evaluated positions; `at` is a constant resolved at load,
so `latch` is a unary function of `t` with a baked-in origin.

The correct statement is therefore blunt: **RoPE's mechanism has no image in
mitate.** Any proposal that describes itself as "RoPE for mitate" is either
using the name decoratively or is proposing to introduce cross-frame coupling,
which is red line 2 of `docs/physics-bake-proposal.md:36-40`. This is worth
saying loudly because the phrase would sound sophisticated and would be
architecturally catastrophic.

What survives is one sentence: *encoding a position by its offset from a
meaningful origin is more robust to changes in the surrounding structure than
encoding it by its index from zero.* That is a design intuition, not a
mechanism, and mitate arrived at it independently.

### 5.2 There is no learned function, so there is no extrapolation

The ML failures the analogy invokes are generalization failures. A model with a
learned absolute position table of size L has no parameters for position L+1.
A model trained with RoPE to length L degrades past L because the rotary phases
at those positions never appeared in training, which is why position
interpolation and its successors rescale the coordinate to keep it inside the
fitted range. ALiBi's motivation is stated in exactly these terms: train short,
test long.

mitate fits nothing. Its functions are closed forms written by an author, exact
at every point of their domain, and they do not degrade anywhere. When retiming
`flee` breaks the duck, no function generalized badly. The function did exactly
what it says, for every input, before and after. **The author's intent stopped
matching the author's expression.** That is a specification failure, and it is
categorically different from a generalization failure in the one way that
matters most: a generalization failure degrades gradually and shows up as
worse output, whereas this fails silently and shows up as a correct-looking
render of the wrong film.

### 5.3 The correct encoding is per-quantity, so no uniform scheme is right

This is the deepest break, and it inverts the lesson.

In ML the encoding is an architectural choice made once for all positions.
Nobody ships a model where some heads use RoPE and others use learned absolute
embeddings because the physics differs per head. Relative encoding wins
globally, so you adopt it globally.

In mitate the answer differs per quantity, and both answers are correct
somewhere. `method.md:89-93` states the rule and `method.md:625-626` records the
cost of getting it backwards: a 0.06s world cut expressed as a fraction gets
stretched by a retime and uncovers the cut, which already cost a re-render. A
hypothetical "make everything relative to the beat" reform would reintroduce
that exact bug across every scene.

So the transferable lesson is not "prefer relative". It is the weaker and more
useful claim: **name the frame, and never let two members of one causal pair sit
in different frames.** Section 4 is a measurement of the cost of violating the
second half.

### 5.4 mitate's problem is closer to covariance than to extrapolation

A more accurate framing than either "extrapolation" or "context length":

An author is permitted certain reparameterisations of the address space:
retiming a beat, inserting a beat, reordering beats, changing `TOTAL`. An
expression is **well-formed** if its rendered meaning is invariant under the
reparameterisations the author is allowed to perform on the beats it touches.

Under scaling of a single beat's duration:

- A beat-fraction term is **covariant**: it scales with the beat and keeps its
  proportional place.
- A beat-seconds term is **invariant**: it keeps its physical size and moves its
  proportional place.
- A film-absolute term (`Math.sin(1.3*t)`, at
  `plugin/skills/mitate/examples/bear-and-bees.html:1579`) is invariant in rate
  but has its phase shifted at every later beat, since durations accumulate.
- A distance-travelled term is invariant in shape and covariant in rate, because
  `s` is derived from position rather than from time.

Neither covariant nor invariant is better. The bug class is **a product that
mixes a covariant factor with an invariant factor when the author needed them
to stay aligned**. Line 1379 times a covariant recoil into `bearXAt` while line
1580 times an invariant squash into `body.scale.y`, and both describe one launch.

This framing is more useful than the ML analogy because it is checkable in
principle and it names the right unit. ML's extrapolation problem is: hold the
function fixed, extend the input, hope the output stays good. mitate's problem
is: hold the expression fixed, change the coordinate system, require the output
to stay the same. Those are duals, not the same problem, and the techniques do
not cross over.

---

## 6. Is `TOTAL` a context window?

### 6.1 The direct comparison fails

`TOTAL` resolves once at load and `seekTo` clamps to `[0, TOTAL]`
(`plugin/skills/mitate/templates/scene.template.html:184`, `:664`). Superficially
that is a maximum sequence length.

The comparison fails on three counts, and each failure is instructive.

**No degradation curve.** A trained context limit is soft and expensive: quality
falls off approaching and past it, and the model has no way to signal that it
has. `TOTAL` is a hard clamp with identical fidelity at `t = 0.001` and
`t = TOTAL - 0.001`. There is no near-boundary region to be careful in.

**Changing it costs one line and no retraining.** Extending a model's context is
a capital expense. Extending `TOTAL` means adding a beat to `BEATS`, and every
derived quantity follows automatically: `DURATION`, the caption schedule, the
shot list's final `t1`
(`plugin/skills/mitate/examples/bear-and-bees.html:1404`), the recorder's frame
count. The clamp is not a capacity limit, it is a **declaration**, and the
toolchain's dependence on it is the feature (`shoot.js:146-150` refuses a scene
that does not declare it rather than defaulting).

**Nothing wants to address outside it.** ALiBi and position interpolation exist
because there is real value beyond the trained length. There is no value at
`t = TOTAL + 1`; the film is over. The clamp forecloses nothing an author wants.

So the honest verdict: **`TOTAL` is not the analogue of a context window.** It is
the analogue of a sequence length declared per example, which in ML is
uncontroversial and carries no lesson.

The one real cost of the clamp is subtler and is about composition rather than
capacity. `warp` with slowdown segments maps `[0, TOTAL]` into a strictly shorter
warped range (`warp(20, [{at:5,dur:.5,rate:.18}]) = 19.59`, measured 2026-07-30).
A body driven through `warp` therefore never reaches the pose its expression
assigns at `TOTAL`. That is semantically correct for slow motion, but it means
the warped coordinate has a different endpoint than the address table, and the
author has to know it.

### 6.2 The thing that is actually a fixed-capacity absolute table

There is one structure in the kernel with the exact shape of a learned absolute
position embedding, and the resemblance is not metaphorical.

```
const R=[];for(let i=0;i<4000;i++)R.push(rng());   // frozen random pool
const noise1=(t,f=1,k=0)=>{const x=t*f,i=Math.floor(x),u=x-i,
  g=j=>R[((j%R.length)+R.length)%R.length]-.5, ...
```
(`plugin/skills/mitate/templates/scene.template.html:142`, `:174-176`)

A table of 4000 entries, indexed by an integer derived from position, wrapping
modulo the table size, with a per-track offset of `k*997`. The kernel documents
it as "Same k = same track, different k = independent track"
(`plugin/skills/mitate/templates/scene.template.html:165-167`).

**The independence claim is conditional, and the condition is not stated.**
Measured 2026-07-30: `gcd(997, 4000) = 1`, so `4*997 = 3988 ≡ -12 (mod 4000)`.
Therefore for any `k`, track `k+4` is track `k` lagged by exactly 12 index
samples; `k+8` by 24; `k+12` by 36. Verified numerically: `noise1(t, f, 4)`
equals `noise1(t - 12/f, f, 0)` to full double precision at every point tested.
The pool's wrap point is unreachable in practice (4000 samples at the solver's
1.9 Hz handheld frequency is over 2000 seconds of film), but the **aliasing
between tracks is reachable**: at 1.9 Hz a `k` and `k+4` pair are the same
wobble 6.3 seconds apart, which is inside a normal film.

**No shipped scene hits it.** The 3D solver uses `k` values 11, 12, 13, 14
(`plugin/skills/mitate/templates/scene.template.html:559`, `:561`) and the 2D
template uses 1 and 2 (`plugin/skills/mitate/templates/scene2d.template.html:281-282`).
No pair within either set differs by a multiple of 4. That is a property of the
chosen constants, not of the design, and the kernel comment invites an author to
pick any `k`.

This is the genuine transfer of the learned-absolute-embedding lesson, and it
arrives from an unexpected direction: not `t`, which was never absolute in the
way the analogy feared, but a fixed-size table indexed by absolute position with
an unguarded collision structure. See recommendation R4.

---

## 7. The repo has converged on relative addressing five times without naming it

The same principle appears in five places, discovered independently, each stated
in the vocabulary of its own subsystem and never as one idea.

1. **Beat addressing.** "so an effect keeps its place when the beat is retimed"
   (`plugin/skills/mitate/templates/scene.template.html:180-182`).
2. **`latch`.** Give the downstream link a time origin rather than a driving
   expression (`plugin/skills/mitate/templates/scene.template.html:219-232`).
3. **Gait in distance space.** "Everything derives from DISTANCE TRAVELLED s,
   never wall time", because "feet freeze mid-plant when the body stops"
   (`plugin/skills/mitate/templates/scene.character.template.html:542-544`). The
   grid also anchors at the walk's start rather than the world origin, and the
   comment records that anchoring at the origin shipped once and put the first
   frame's foot target a film-width ahead (`:546-548`). Both halves are the same
   move: pick an origin that means something. `bear-and-bees` constructs it as
   `const s=x-WALK_START;` with the comment "gait rides distance, never t"
   (`plugin/skills/mitate/examples/bear-and-bees.html:1540`).
4. **Baked physics impulses.** Impulses anchor to beats,
   `{beat:'hit', at:.3, impulse:[...]}`, "so retiming a beat re-bakes cleanly
   instead of silently desynchronizing" (`docs/physics-bake-proposal.md:56-58`).
   Note the word *silently*: the proposal predicted section 4's failure mode
   before section 4 measured it, in a subsystem that does not exist yet.
5. **Interactive camera deltas.** "Anchor to beats, not absolute `t`. The physics
   proposal already made this call for impulses ... so retiming re-bakes cleanly
   instead of silently desynchronizing" (`docs/working-plan.md:1183-1185`). The
   same section also refuses to bake absolute camera positions, on the grounds
   that "coordinates were never the intent, framing was"
   (`docs/working-plan.md:1173-1178`), which is the identical argument one layer
   out in space rather than time.

Five independent derivations of one principle. `docs/pattern-ledger.md` exists to
count exactly this, because `docs/plan.md`'s promotion triggers fire on the
count. On the ledger's own logic the principle is well past the threshold at
which a shape earns a name and a home. It does not have one. This paper proposes
that name in section 9, R1.

The absence has a measurable cost: item 5 above had to re-derive the argument
from item 4 by citation rather than by invoking a shared rule, and item 4 could
not cite items 1 through 3 at all because they are phrased in three different
vocabularies (beats, latches, distance).

---

## 8. The forward direction: `setCamera(state)`

`docs/plan.md:96-103` splits the runtime into a **kernel** of pure functions
(`pose(state)`, `materials(state)`, `camera(state)`, with no clock and no input)
and a **driver** producing the state stream, as `g(t)` for a film or `g(events)`
for interaction. Phase 6's gate requires a spike to reuse the kernel with zero
modification (`docs/plan.md:585-586`).

`docs/working-plan.md:1321-1340` records that the discipline had not held:
`setCamera(t)` took `t`, so the gate was not reachable as written, and the
proposed intervention was to widen the signature to a state object that today
contains only `{t}`, with one rule attached: the kernel never reads anything the
timeline driver cannot produce.

**That intervention shipped in 0.16.62 (2026-08-01)** — `setCamera(state)` in
all eight carriers, with the DRIVER constructing `state`. The rule came with it
and is the load-bearing half. The gate is now untested rather than unreachable;
`plan.md`'s Phase 6 entry carries that distinction.

### 8.1 What this buys addressing specifically

The state object is the natural home for the frames of section 2. Today every
one of them is reconstructed inside `animate()` from the one scalar, by every
consumer, separately.

```js
// today, in every scene
function animate(t){
  const x = bearXAt(t);
  const s = x - WALK_START;                 // frame 5, reconstructed here
  const L = latch(t, T_HIT);                // frame 4, reconstructed here
  ...
}
```

```js
// the shape the split enables
function animate(state){
  state.t                 // frame 1
  state.s                 // frame 5, produced once by the driver
  state.since('hit')      // frame 4, named rather than derived per call site
}
```

Four concrete gains, in decreasing confidence.

**Named frames become first-class and therefore checkable.** `state.since('hit')`
carries its frame in its name. `latch(t, T_HIT)` carries it in a convention. A
lint over the second form has to recognize an idiom; over the first it reads a
property access. This is the precondition for R1 and it is the strongest
argument.

**One producer per frame.** `s` is computed at
`plugin/skills/mitate/examples/bear-and-bees.html:1540` and consumed by
`gaitPose`, `gaitBob`, and `tailWag`. That is fine at one consumer per scene and
becomes a drift surface at several, which is the same failure the SOLVER fence
exists to prevent (`CLAUDE.md`, invariant 2).

**The warp routing becomes expressible.** Section 3.2's two-clock problem is
today a comment telling the author which variable to pass where. As `state.t`
and `state.tBody` it is a data-structure question, and a scene that reaches for
the wrong one is at least greppable.

**The interactive fork gets a place to live.** This is the argument
`docs/working-plan.md` already makes, and addressing is a second, independent
motivation for the same change, which raises its expected value without changing
its cost.

### 8.2 The honest cost

**It is a fenced edit across the carriers.** The KERNEL fence lives in every 3D
template, every example, and the showcase-only film (`CLAUDE.md`, invariant 2,
which owns the count). Any addressing change is a cross-directory parity edit
plus a version cascade. `docs/working-plan.md:1337-1340` argues the change is
mechanically byte-identical in behaviour and should ride the already-planned
batched release for this reason. That argument is sound and it is the only
reason the cost is tolerable.

**A state object invites becoming a bag.** `docs/working-plan.md:1334-1337`
names this and gives the discipline that prevents it. The addressing use case
makes the risk worse, not better: six frames is a plausible-sounding reason to
add six properties, and a seventh will always sound plausible too. The frames in
section 2 that belong in `state` are the ones with **more than one consumer in a
real scene**. On present evidence that is `t` and `s`. `since(name)` is a method,
not stored data, so it costs nothing to include. Frames 2, 3, and 6 stay as kernel
functions, because they are cheap, pure, and single-use per call site.

**It does not fix section 4.** Nothing about `state` prevents an author from
writing `pulseS` where they needed `pulse`. The mismatch is between two
correctly-typed expressions. `state` makes a checker possible; it is not a
checker.

---

## 9. Predictions and recommendations

Ordered by confidence. Each is falsifiable, and each names how it would be shown
wrong.

**R1. Name the principle and give it one home.** Section 7 shows five
independent derivations in five vocabularies. Write it once, in
`plugin/skills/mitate/references/method.md` next to the fractions-versus-seconds
rule that is already its clearest instance, as: *an expression's origin should be
the structure an editor will move; its unit should be the physics the world
obeys; and two halves of one causal relationship must share both.* Everything
else points at it. Falsified if a sixth instance arrives and the rule as written
does not cover it.

**R2. Test the film under retiming, not just under seeking.** The determinism
gate seeks away and back on one backend, which is a check on the coordinate. It
cannot see section 4, because retiming produces a different, internally
consistent film. The cheap version: a script that perturbs each `BEATS` duration
by +/- 40%, re-shoots the contact sheet, and presents them side by side for a
human to look at. This is a curation instrument, not a pass/fail gate, which is
the same shape `docs/physics-bake-proposal.md:122-125` proposes for bake seeds.
Prediction, falsifiable by running it: on `bear-and-bees` the `flee +40%` sheet
shows a visibly less ducked bear at the pass, and the `erupt` and `hush` sheets
show no human-visible change. If `erupt` or `hush` also degrade, section 4.2's
"latent" verdict was too soft. If `flee` does not, my proxy criterion was wrong
and the numbers in 4.1 should be discarded.

**R3. Guard or document `warp`'s overlapping-segment jump.** Section 3.2 measured
a 3.12 second discontinuity in the body clock from a segment list an author could
plausibly write. Two lines in `warp` that skip a segment whose end precedes the
cursor, or one sentence in the kernel comment saying segments must be disjoint.
The former is better and both beat the current state. Per `CLAUDE.md` invariant
6, a change to `warp` needs its bracket run before and after; the reproduction in
section 3.2 is the red arm.

**R4. Document the `noise1` track aliasing at its line.** Section 6.2 measured
that `k` and `k+4` are the same track lagged 12 index samples. The comment
currently says the tracks are independent. Per `docs/source-of-truth.md:13`, a
line-local fact belongs on the line: amend `:165-167` to say that `k` values
should not differ by a multiple of 4. Falsified if someone shows the aliasing is
perceptually irrelevant at every reachable frequency, which would be a fine
result and should then be recorded as the reason not to worry.

**R5. Widen `setCamera` to a state object, on the addressing argument as well as
the interactive one.** Section 8. This is already ranked in
`docs/working-plan.md`; the contribution here is a second independent
justification for the same edit, which should raise its rank rather than add an
item. Falsified if the state object lands and no addressing lint or named frame
follows within two phases, which would mean it bought only the interactive fork.

**R6 (speculative, lowest confidence). A mixed-encoding lint is worth prototyping
but not shipping yet.** Section 4.2 measured its precision at one in three on the
only film with a known defect. Prototype it, run it across every shipped example,
and count. Ship it only if the false-positive rate on beats that turn out to be
genuinely independent is low enough that authors will not learn to ignore it.
`CLAUDE.md` invariant 6 requires a bracket regardless: the red arm is
`bear-and-bees` with the duck reverted to `pulse` from `pulseS`.

**A prediction about the trajectory itself.** The owner predicted that mitate
would follow ML's path from absolute to relative addressing. On the evidence it
already did, at the kernel's founding, before the analogy was available. The
prediction I would make instead is narrower and I think more likely: *the next
addressing improvement will not add a more relative primitive; it will make the
frame of an existing expression legible to a tool.* Five relative operators
already exist and two of them (`warp`, `quant`) have zero uses across every
shipped example, which is the strongest available evidence that the shortage is
not of primitives. This is falsified the moment someone ships a seventh frame
and it earns its place.

---

## 10. Where the framing that motivated this paper was wrong

Recorded because the corrections are the useful output.

**"The same may occur here over time" understates the repo.** mitate did not
start absolute. `plugin/skills/mitate/templates/scene.template.html:85` forbids
literal timestamps and `:178` says "use these, never raw timestamps". The
migration the analogy predicts is the kernel's founding design, and every
shipped example complies. The prediction is retrospectively correct rather than
forward-looking.

**"Three natural coordinate frames" undercounts.** There are six (section 2), and
the two the framing omitted, beat-seconds and warped time, are precisely the two
that make the ML analogy fail: the first because it is deliberately non-relative
and correct, the second because it reparameterises the coordinate without
reparameterising the address table.

**Two line citations were slightly off.** The flee travel is at
`plugin/skills/mitate/examples/bear-and-bees.html:1378` as given, but the duck is
at `:1562` (not `:1560`; 1560 is the first line of its two-line comment). Minor,
and noted only because this paper's own citations should be checkable.

**"`seekTo` clamping is the analogue of a fixed maximum context length" is
wrong**, and section 6.1 gives three reasons. There is no degradation curve, the
limit is one line to change with no refitting, and nothing wants to address past
it. The real analogue of a fixed-capacity absolute table is the frozen `R` pool,
which the framing did not mention and which turns out to have a measurable
collision structure (section 6.2). This was the most productive error in the
brief.

**The "defect the analogy predicts" is real but the analogy did not predict it
first.** `docs/physics-bake-proposal.md:56-58` names the same failure, in the
same words ("silently desynchronizing"), for a subsystem that does not exist yet,
dated 2026-07-23. The repo predicted it from its own experience a week before the
analogy was drawn. That is a stronger result for the underlying principle and a
weaker one for the analogy, and both should be recorded honestly.

**One thing in the framing was more right than stated.** "Not wall clock, just a
position in time" is not a rephrasing. Three separate properties of `t` depend on
it (random access, boundedness, continuity-with-optional-projection), each is
independently load-bearing, and the word "clock" imports the accumulation
semantics the prime directive exists to forbid. The vocabulary is worth adopting
in the references.
