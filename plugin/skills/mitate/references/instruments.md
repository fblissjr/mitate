# Instruments: what each check can and cannot see

Every check in this pipeline has a measured limit. This file is the ledger of
those limits, because the failure mode that costs the most is not a check that
fails — it is a check that **passes and should not have**.

`method.md` holds the method; this holds the instruments' brackets. Read it when
you are deciding whether a green result means anything.

> **Provenance.** Canonical for what each check can and cannot see, and for its
> measured brackets. **Still not audited end to end** — the honest state, and the
> earlier "Verification date: UNKNOWN" said so rather than pretending. What is
> now dated is narrower and real: on **2026-07-29** the three shipped brackets <!--count-mention-->
> were each run and each made capable of failing (0.16.16-0.16.17), and the
> console-noise check was found broken on the default path and fixed. On
> **2026-08-02** the `build.js check` section below was written against the verb
> as shipped, and every row of its table was watched go red with its own check
> neutralised before being written down. Most other
> brackets here were measured on the predecessor skill and
> carry over, because they describe what a *check* can perceive, not what a
> renderer draws. Anything the node stack invalidated has been re-measured or is
> labelled. Where a number is inherited and not re-verified on this stack, it
> says so.
>
> **Three kinds of claim live in this repo and only one of them rots.** An
> *incident record* ("this reached `git add` once") is history and stays true. An
> *intent* comment ("this tick is why the frame is deterministic") is checkable by
> reading. A *measurement assertion* ("measured — does not close the cloak",
> "40/40 clean", "~2.3x") is a claim about a run that happened elsewhere, and it
> decays silently the moment the code moves. The repo's own self-check counts the
> uncontrolled ones and **ratchets** them — the count lives there, once, and is
> not restated here. Two known casualties so far — 0.16.9's console anchor, whose comment
> asserted a measurement never taken, and rule 5's `sortObjects` repro, cited as
> preserved and absent from the tree. That ratio is the size of the class. It is
> not a to-do list; it is the reason to distrust an unsourced number here,
> including the ones below.
>
> **Not here.** the method itself → `method.md`; backend policy → `webgpu-stack.md`.

**Map.** Deliberately unlinked — a heading map costs nothing and cannot dangle,
where hand-written anchors ship into an install cache unverified.

- The rule these all serve — *a proxy can reject; it cannot approve*
- `smoke.js` — the gate, check by check
- `build.js check` — the tables against each other, before a frame exists
- `build.js motion` · `strip` · `sheet` · `aspect` · `poster` — the review tools
- Where a check belongs: the tool path or the artifact
- What has no instrument

## The rule these all serve

> **A proxy can reject. It cannot approve.**

A passing score in a region where the proxy has no authority means nothing, and
must not read as approval. Every threshold below is either bracketed by
observation on both sides, or explicitly labelled unbracketed.

---

## `smoke.js`

| check | quantifier | what it catches | what it cannot see |
|---|---|---|---|
| page errors | per load | console/page errors, deprecation warnings | anything that fails silently |
| contract | — | a missing `seekTo`/`DURATION`/`stopPlayback`/`sceneReady` | — |
| determinism | **all** of 4 planned points, +up to 2 transition midpoints, **plus one across a page reload** | state across frames, `Math.random()`, wall-clock, and load-time randomness that is pure within a session | state that only desyncs at unsampled times. Bracketed by `templates/bracket-determinism.js` |
| blank frame | **all** of 4 planned points, +up to 2 transition midpoints | a pipeline shooting empty frames | a frame that is dark but not empty |
| shipped-frame spread | **max** over its own 4-point plan | a backend that ships nothing (half-dead adapter) | a register that is legitimately flat *and* correct |
| live playback | 3+ `seekTo` calls, 2+ distinct `t`, on the one load without `?record=1` | a film that records perfectly and never moves for a viewer | whether the motion *reads*; a driver calling a captured reference instead of `window.seekTo` |
| marker parity | file set × <!--derived:fences-->7<!--/derived--> fences | two scenes carrying different kits | drift inside a scene |
| framing invariance | 3 shapes × 3 fixed fractions | a scene that crops instead of containing | composition quality at any single shape |
| caption speed / overflow | per beat | a caption too fast or too wide **for the frame** | canvas text; vertical collision; **text that fits but is too small to read** |
| exposure | 3 fixed fractions, worst | washed out or crushed | whether the register intended it |

**There are two different sampling mechanisms, and conflating them is a mistake
this file has already made once.** Which one a check uses decides whether it can
be blinded by a flash:

| mechanism | used by | points | flash-aware? |
|---|---|---|---|
| `samplePlan(dur, flashes, 4)` | determinism, blank frame, shipped-frame spread | 4 interior, at `dur*i/5` | **yes** — cleared against MERGED flash intervals |
| `SAMPLE_FRACTIONS = [0.25, 0.5, 0.8]` | exposure, framing invariance | 3 fixed fractions of `DURATION` | **no** — raw multiplication, no avoidance |

So exposure and framing invariance can land inside a white-out and read it as the
frame. That is tolerable for those two (both are advisory or shape-comparing) and
would not be for determinism — which is exactly why determinism routes through
the plan. The determinism check additionally appends up to two shot-transition
midpoints from `window.SHOTS`, so its real floor is 4 points and often 6: fixed
fractions were measured missing every blend window on a shipped film, and a
transition-confined bug would have passed every check.

**The determinism check was the sharpest lesson in this whole file.** It used to
sample `Math.min(1, dur/3)` — the constant 1.0s for any film over 3s, inside the
title card the workflow tells you to write first. Three controls on one scene:

| control | truth | verdict |
|---|---|---|
| stateful, rotor moving at t=1.0 | non-deterministic | **FAIL** (correct) |
| same bug, diagram fades in over the title | non-deterministic | determinism passed; failed by luck on a **9-byte margin** |
| same bug, faint structure drawn from t=0 | non-deterministic | **`all scenes pass`, 0 warnings** |

t=1.0 was the only timestamp in that film where the scene was clean. Quantifying
over a sample plan is why all three now fail. **When a check reports absence, ask
what a positive result would have looked like.**

**Parity had the same shape of hole, one level down.** The parity row above only
means anything for files actually *in* the comparison set, and a scene used to be
able to leave it silently. Extraction is anchored on the full
`/* ==== KERNEL-END ==== */`; the guard meant to catch a half-fenced file asked
the loose `includes('KERNEL-END')`. A mangled `KERNEL-ENDX` satisfies the loose
form and defeats the anchored one, so the block stopped extracting and nothing
complained — a deleted marker failed, a *corrupted* one did not. Both now derive
from the same pattern. The general rule, which is the third instance of it in
this file: **when a guard and the thing it guards ask different questions, the
gap between the two questions is where defects live.**

**<!--derived:fences-->7<!--/derived--> fences are registered**, not two:
`CONTRACT`, `KERNEL`, `SOLVER`, `RIG`, `DRIVER`, `CHARACTER`, `HTML`. This line
said "Six" and omitted `CONTRACT` for every version after 0.16.44 made it the
seventh — in a file that ships, so the count and the list disagreed with
`smoke.js` for every installed user. The number is now derived from that array.
The `HTML` block uses HTML-comment markers rather than
JS-comment ones, because it lives outside `<script>` — smoke's parity loop
carries a second regex arm for it. A new shared block gets a fence at the third
consumer, and the fence goes in this list or it is not enforced.

**The shipped-frame spread floor** is distinct from the exposure advisory and
runs on a caption-stripped page: exposure takes the MIN over the plan (the
flattest frame, a style-conditional advisory), the shipped-frame check takes the
MAX (the film's richest stripped frame). A film whose *best* frame is flat is not
a register, it is a backend shipping nothing. Bracketed on this stack: a half-dead
SwiftShader-WebGPU configuration measured 1.7; the healthy 3D template 161.3; the
flat paper-register 2D template 120.9 — two orders of magnitude of daylight.

**The live-playback check exists because the whole pipeline was blind to the only
path a viewer takes.** Every template starts its rAF loop with
`if(!location.search.includes('record'))requestAnimationFrame(loop)`, and every
page load in `smoke.js` and `shoot.js` carries `?record=1`. So the loop — the
thing every human who opens the file gets — was executed by nothing in this
suite, and a scene whose loop dies on its first frame shipped perfect recorded
frames while sitting motionless on screen. It passed this gate green on both
backends. The recorder cannot see the defect by construction, which is precisely
why the gate has to.

It watches the mechanism rather than the pixels: the loop's only job is to call
`seekTo` with a rising `t`, so the check wraps `seekTo` after `sceneReady` and
counts. A pixel diff would have to guess how far a given film moves in 200 ms and
would fire on a held title card — the same "one frame answers no question about
motion" trap the strip exists for. Counting cannot. **Two distinct `t` values is
the load-bearing half:** a loop that runs forever while recomputing the same `t`
is as frozen as one that never started, and a call count alone passes it.

**It asks whether `seekTo` is being driven, never whose loop is driving it**, and
that generality is deliberate rather than incidental. More than one thing already
replaces the built-in loop: `site/app.js` calls `stopPlayback()` and drives `t`
itself ("we drive it now"), and any in-scene viewer does the same. A check
written against `requestAnimationFrame` would go blind on exactly the scenes with
the most machinery between the clock and the frame — and a control aimed at the
built-in loop of such a scene fails to fire, which is how this shape was found.
For the same reason the assertion is *distinct* `t`, not *rising* `t`: a
viewer-driven or wrapping clock is not monotone, and demanding monotonicity would
fail correct scenes. The one thing it cannot see is a driver that captured a
direct reference to the function before the wrap and calls it privately; every
template calls `window.seekTo` by name, and any replacement loop must keep doing
so to stay visible here.

**Corrected 2026-07-25 — an earlier version of this entry claimed a blind spot
that does not exist, and the correction is the more useful finding.** It said a
host that both replaces the loop *and* swallows the exception passes this check
while rendering nothing, citing a measurement of 71 calls with 71 distinct `t`.
That was an artifact of the **probe**, not of the gate: the ad-hoc wrapper used
for that measurement incremented its counter *before* calling the inner
`seekTo`, so the increment ran even when the inner threw. The shipped check
counts **after the inner call returns**, which is why a swallowing host fires
like any other frozen film.

Re-bracketed four ways against `gearbox` by `templates/bracket-liveplay.js`,
which builds its own broken copies and is runnable from a clean checkout —
all four firing: unmodified
(calls=20, distinct=20, playing); a throw in the rAF loop; a throw inside
`seekTo`; and a host that swallows the throw — the last three all calls=0,
distinct=0. **The wrapper ordering is load-bearing**, and that is the finding
this entry should have carried in the first place.

What survives, restated narrowly: **the check runs standalone, so no
*deployment configuration* other than a top-level load is exercised** — not the
iframe-with-a-parent-driving-`seekTo` case, not the install cache. The
shipped-frame check runs under `?record=1` and does not reach them either. That
is a coverage gap in the harness, not a blind spot in this check, and
`site/app.js`'s warning is a warning rather than a check.

Bracketed three ways on `gearbox`, all three firing with the right message: the
rAF chain never started (0 calls), the first frame threw and killed the chain
(0 calls, plus the page error) — which is the shape the real defect took — and a
frozen clock driving `seekTo(0)` forever (3+ calls, 1 distinct `t`, caught only
by the distinctness arm). Quiet on every shipped example and on the 2D
template. Cost is one extra page load per scene: **+0.14 s on hardware WebGPU, +1.05 s on the
software-GL default** — measured 2026-07-25 on `gearbox` at the 640x360 check
viewport, one machine, wall-clock over a full `smoke.js` run; the gap is boot,
not the check.

## `build.js check`

The only instrument here that reads no pixels and loads no page. It
cross-references the declarative tables `breakdown.md` enumerates — `BEATS`,
`SHOTS`, `SUBJECTS`, `SIZES`, `CONFIG`, `FRAME`, `KEYS` — against each other, in
the scene's source text, and every finding is decidable before a frame renders
or the page loads at all.

| it decides | severity | what it cannot see |
|---|---|---|
| a shot's `at` names a beat that exists, at a fraction inside `0..1` | error | whether the moment is the right one |
| `subject` / `focus` resolve in `SUBJECTS`, `size` / `size2` in `SIZES` | error | whether the subject is the one the beat is about |
| shots are in ascending time order | error | — |
| `KEYS[].beat` and `CONFIG.flashes[].beat` resolve | error | — |
| `FRAME.px` describes `FRAME.aspect` | error | whether either is the frame you wanted |
| a union shot on a rung whose anchor is a body landmark, with no `anchor` override | warn | whether the composition reads |
| a caption above `smoke.js`'s reading-speed limit | warn | legibility at the size it is viewed — see below |
| three or more shots sharing one framing | warn | whether the repetition is a motif |

**It does not drive the scene, and that is what keeps it off the prime
directive's exception list.** No browser, no `seekTo`, no runtime state. It reads
source text and only for the kit-owned table names above, never a film's own
identifiers — the same category as `smoke.js --parity-only`.

**The severity split is the design.** An error is a statement the tables cannot
both satisfy and it sets the exit code; a warning is a composition judgement the
tables merely make visible, and stays advisory for the reason the exposure lint
does.

**What it cannot see, and it is the layer's most expensive gap:** whether a
declared `h`/`w`/`d` matches the geometry it claims to describe. Measuring that
means naming scene objects, which is `build.js probe`'s admitted exception and
not this command's to take. `check` says so on every run, green ones included.
Two smaller blind spots: a table whose values are computed from geometry built at
runtime reads as `NaN` here rather than as a number, and a scene that assembles
`SHOTS` from a loop rather than a literal is reported as unreadable rather than
checked — in both cases it says which table it could not cover.

**The threshold to know about is the repeated-framing warning.** Three is the
floor, and it has an observation on each side: `gearbox` and `menagerie` each
return to their establishing shot, which puts both at a pair of identical
framings — ordinary grammar, which must not fire — while the defect corpus's
known "same card" defect sits at four. Nothing distinguishes a lazy repeat from a
deliberate motif, so it is a warning and not an error.

**Every row above has an arm in `templates/bracket-commands.js`**, each on a copy
of a shipped scene with exactly that property broken, and each was watched go red
with its own check neutralised. The union row carries a second arm in the other
direction: the same shot WITH an `anchor` must produce no warning, because a
shipped two-shot is exactly that shape and a rule that cannot tell them apart
condemns a correct film.

## `build.js motion`

Reports per-beat motion energy and dead air. Its limits are measured, not
assumed (inherited; the analysis is renderer-independent):

- **It does not detect pops or stalls.** That was built and cut: a known 0.35 rad
  limb step measured **1.00x its own local baseline**, and a stall detector fired
  at *every* beat boundary on the defective control — and ~10 times on a
  known-good film, because a film is SUPPOSED to settle between beats.
- **It measures textured pixels, not motion.** A title beat with a real 14° camera
  orbit scored 0.54 because the frame is mostly flat sky; a comparable push over a
  detailed frame scored 3.09. Bars are **not comparable across beats of different
  texture density**.
- **It measures moving area, not significance.** A payoff beat where the whole
  argument resolves scored 0.23 against a neighbour's 8.23, because it is two
  small dots against a large block crossing frame.
- **The bar is normalised to the peak beat**, so one loud beat flattens every
  other into a single `#`.
- **The per-beat value is a mean**, so it is invariant to distribution: a 0.73s
  end-of-beat freeze moved it by 0.00.
- **Dead air is structural in some registers.** A comic rest is by construction
  longer than the minimum and below the floor; fine, low-contrast linework
  animates without registering at all. Both produce true-positive flags on
  correct films.

## `build.js strip`

Consecutive frames tiled — the only pixel-level look at continuity available to a
reviewer who cannot play the film. **Bracketed both ways**: a 1.2-unit whole-body
jump (~15% of frame height) is obvious between adjacent cells; a 0.35 rad limb
rotation (~2% of frame area) is invisible. So it reaches world- and object-level
breaks and stops short of limb-level ones, and it does better on a held camera.

It is the one instrument that caught a whole-mechanism stall a full render of
`motion` called indistinguishable — beads visibly frozen across nine cells.

## `build.js sheet`

One frame per beat, plus a `.squint.jpg` silhouette strip.

- **Its fixed fraction is a blind spot.** At 0.6 it misses effects that park; the
  0.95 end-of-beat pass exists for that and is a standing step. But **both** land
  inside a `CONFIG.flashes` window on the beats that bracket a world cut — the
  highest-risk moments in a two-world film — and inside any bright in-scene
  effect. A defect duly hid there.
- **It cannot see a short physical event.** A 0.5s jump inside a 2.0s beat is
  invisible at 0.6 and at 0.95.
- Tiled beats are what reveal a *systematic* error; the same mistake in six shots
  reads as six small problems one at a time and as one bad formula when tiled.

The squint strip is also the character-silhouette gate: at 90px, distinct
characters must stay distinguishable from one another.

## `build.js aspect`

Tiles one moment at four window shapes. Complements the framing-invariance lint:
the lint can **reject** a scene whose design frame changes with the window, and
cannot **approve** one — and the render is always the design shape, so it can
never show you this. Read the cells; every one must be the same composition.

Caveat: cells are padded into a common square box, so four window shapes render
at four scales. A correctly contained subject can *look* like it drifts. When in
doubt read the individual frames rather than the sheet.

## `build.js poster`

One frame-exact still at a chosen `t`, plus a markdown snippet. It is the right
source for any still image — a README hero, a reduced-motion fallback, a site
thumbnail — because it renders from the scene rather than transcoding a lossy
loop. **Never extract a still from an AVIF or WebP when the scene is available.**

It is not an instrument: one frame at one time answers no question about
continuity or motion. It is a delivery command that happens to be frame-exact.

## Where a check belongs: the tool path or the artifact

A guard placed on the code path only holds for callers who take that path. A
guard placed on the artifact holds however the artifact got that way.

The case that taught this: `build.js` embeds the vendored library into a scene
in place, which is correct for an authored film and destructive for a shipped
`*.template.html`. Running the gate rewrote a tracked template with a full
inlined library, idempotently, so nothing flagged it. `ensureVendor` now refuses
templates — but that only protects callers who go through `ensureVendor`. A hand
edit, a bad merge, or a future command that writes the file directly all
reproduce the same broken artifact past that guard. Checking the artifact's own
invariant — a template is small and still carries its `<script src>` tag —
catches every route to it, including routes nobody has written yet.

The artifact check itself lives in `smoke.js --parity-only`, next to marker
parity, because it is the same kind of property: pure string work over the
files, no render required. That mode exists so a fast caller — an editor hook,
a pre-commit, CI's cheap stage — can run these without paying a Chromium
launch.

**Resist reimplementing it in the caller.** A first attempt wrote the parity
logic a second time, in bash, inside the hook. It diverged from this file on
day one: a scene with a mangled `KERNEL-STARTX` marker dropped out of the
comparison in total silence — the exact self-exemption the check exists to
catch, and the exact two-copies-drift failure the marker fences exist to
prevent. **A check duplicated into its caller is subject to the rule it
enforces.** Callers should be wrappers.

**The instrument deliberately NOT built here** is worth as much as the ones
that were. The obvious move looked like "assert the working tree is clean after
`smoke.js` runs". It is wrong: `smoke.js` runs mostly in an author's scratch
directory, which is usually not a repository at all and where writing files is
the entire point. The assertion would be false in the tool's primary use case
and would have to be suppressed there — which is how a check becomes noise and
then becomes bypassed. **An invariant that belongs to a repository gets
enforced where repositories are enforced** (a hook, CI, a pre-commit check),
not inside a tool that has no idea it is in one. Note the split: *a template is
small and self-contained* is a property of the file, so it lives here; *the
tree has no uncommitted changes* is a property of the repository, so it does
not.

## What has no instrument

Recorded honestly, because these are where films actually ship broken:

- **Watching the loop at speed.** The strongest continuity instrument, and it
  needs a human. No agent can do it. The live-playback check above is not this
  and does not weaken it: it answers *does the loop run*, never *does it read* —
  a film that plays and pops at every cut passes it.
- **Semantics.** "Cover everything except the geometry" is a question you ask
  yourself. The `?nocap` switch removes the DOM caption; it does **not** remove
  canvas text, which is where a diagrammatic film's meaning actually lives — in
  one external-doc film only 2 of 8 beats survived a strict cover-*all*-text pass.
- **Whether a beat is funny, warm, or tense.** No still answers it.
- **Whether a caption is legible at the size it will actually be viewed.**
  Captions are a constant fraction of the frame (`calc(var(--fw)*.015625)`), so
  they compose correctly at every size and go unreadable at small ones — ~5.7px
  in a phone-sized box. The overflow check passes, because the text fits. See
  `method.md`; the answer below ~700px of frame width is `?nocap`.
- **Whether a contact is real in all three axes.** A camera angle can fake a
  graze that misses in depth; that class of defect recurs (the running count is kept outside this subtree,
  with the repo's pattern ledger) and is
  caught by probe-measuring the contact, not by looking at it.
- **Cross-backend reproducibility.** `seekTo` purity is a property *within* one
  backend. WebGPU-Metal and the WebGL2 fallback do not produce byte-identical
  frames — expected, not a bug — so any byte-comparison regression must fix the
  backend on both sides. (The predecessor measured its own cross-backend delta at
  PSNR 57–58 dB, differences confined to antialiased edges and speculars; that
  number is **inherited and has not been re-measured** for the WebGPU/WebGL2 pair,
  so treat the shape of the finding as transferable and the figure as indicative.)
