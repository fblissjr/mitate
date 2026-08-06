---
mode: span
scope: instrument-hardening
date: 2026-07-29
range: f9fbb84..61fcd54
summary: Four outside reviews found almost nothing real, but running the gate they all assumed was green found that it had been failing every 3D scene on the documented CI-safe path since 0.16.9 — the repo's instruments were strong and its instruments-on-instruments did not exist.
artifacts:
  - plugin/skills/mitate/templates/smoke.js
  - plugin/skills/mitate/templates/bracket-noise.js
  - plugin/skills/mitate/templates/bracket-determinism.js
  - plugin/skills/mitate/templates/bracket-liveplay.js
  - plugin/skills/mitate/templates/build.js
  - plugin/skills/mitate/references/webgpu-stack.md
  - plugin/skills/mitate/references/materials.md
  - plugin/skills/mitate/references/instruments.md
  - plugin/skills/mitate/references/method.md
  - scripts/selfcheck.js
  - scripts/install-hooks.sh
  - .claude/skills/audit-claims/SKILL.md
  - .github/workflows/gate.yml
  - .github/workflows/static.yml
  - CLAUDE.md
  - docs/working-plan.md
  - 2c5742f
  - 28a4c94
  - a99e1a2
  - 8e2383e
  - 3223316
  - 747c0eb
  - 61fcd54
---

# Instrument hardening, 2026-07-29

Began as an assessment of four outside reviews. Became a debt-paydown pass when
the first thing actually *run* turned out to be red.

## 1. What went well

**Running the gate beat reading about it, by a wide margin.** Four outside
reviews `(local)` produced, between them,
two real defects — a duplication in `build.js`'s temp filenames and a
context-budget observation about `references/method.md`. One `bun run smoke.js` on
the default path produced a defect that had failed the entire shipped corpus for
seven releases (`28a4c94`). The structural version: **for a repo whose artifacts
are executable, reading is a weaker instrument than running, and no amount of
reviewer care closes that gap.**

**The bracket discipline caught its own author within a minute.** `bracket-noise.js`
was written to control the fix in `28a4c94`; its first run failed, because the
classifier existed in two copies and only one had been updated. The bracket found
in one run what the review of the same diff had missed. This is the pattern the
repo already committed to and it paid immediately.

**Retractions were cheaper than defences.** Three claims were withdrawn on
evidence during the span rather than argued for: "reproducible, therefore a state
dependency" in `plugin/skills/mitate/references/materials.md`, an over-read of
`SKILL.md`'s size, and the container's own justification (below). Each retraction
cost a paragraph. Each defence would have cost the finding.

**The container was rejected by measurement, in the same session it was
adopted.** Adopted on three stated benefits, then measured at 2.31 GB with
firefox (270 MB) and webkit (273 MB) shipped to run chromium
(`.github/workflows/gate.yml` header records the figures). Two of three benefits
were false. Elapsed cost of the whole detour: one commit forward, one back.

## 2. What did not go well

**A hardening pass introduced the defect.** The console allow-list in
`plugin/skills/mitate/templates/smoke.js` was anchored in `2c5742f` — 0.16.9,
titled "a test-audit of the only test suite, and what it found green" — with a
comment asserting the anchor was measured not to close the cloak. It matched
neither message it needed to, because both arrive prefixed. **The structural
version: a comment claiming a measurement is itself an untested assertion, and a
pass whose purpose is hardening is the most dangerous place to write one.**

**Two of three controls could not fail.** `bracket-determinism.js` and
`bracket-liveplay.js` printed their rows and exited 0 regardless of verdict until
`a99e1a2`. They had been cited as evidence in `references/instruments.md` the
whole time.

**I over-read 3-of-3 as proof and published it.** Three identical CI failures on
`materials.html` at the same `t` were written into `references/materials.md` and a
commit message as "reproducible … a state dependency, not a race." Run four
refuted it. Compounding the error, the two passing runs also changed the CI
environment, so the sample was confounded and supported no conclusion in either
direction. **The structural version: N-of-N is never evidence of determinism; it
is evidence of N.** Same shape as the caption-CPS bracket this repo already
documents as small-n, committed by someone who had read that entry hours earlier.

**I committed through a red check by piping it into `tail`.** The pipeline
reported the filter's status, so a self-check with two failures printed
"self-check: ok". CI caught it (`747c0eb`). On the night whose entire subject was
green results that should not have been green, the verification step manufactured
one.

**I amended a pushed commit.** `3223316` was public when I amended it, diverging
history. Recovered non-destructively with `git reset --soft origin/main`, but the
check that would have prevented it — look at the remote before rewriting — was
not run.

**The repo's own doctrine predicted every one of these and did not prevent
them.** `docs/working-plan.md`'s spine records four instances of an agent reading
a rule and breaking it anyway, and names the mechanism. This span added at least
three more instances *of that same document's own lessons*. Prose lost to friction
again, which is the finding the spine already carries.

## 3. Deviations from the plan

| Planned | Shipped | Verdict |
|---|---|---|
| Assess four outside reviews | Assessed, plus ten releases of instrument repair | Better than planned — the assessment was the cheap part; running what it discussed was the value |
| Act on the reviews' findings | Acted on ~4 of ~30 raised items; refuted the rest with evidence | As intended. m4's headline findings were artifacts of its own uncommitted mutations to the tree it audited |
| — (not planned) | First CI in the repo's history, two workflows | Better than planned. Directly caused by discovering the unattended path was never run |
| — (not planned) | `scripts/selfcheck.js`, 8 checks | Better than planned. The class of defect found had no possible mechanical check before it |
| Adopt a pinned container | Adopted, measured, reverted | Scoped down honestly. Cost one commit each way; the measurement is recorded so it is not re-adopted on the same reasoning |
| Get to Phase 4 "in a happy place" | Prerequisites discharged and documented; Phase 4 itself untouched | Scoped down honestly — and the prerequisite was real, not a detour: the bake proposal's red line #3 depends on exactly the checks found broken |

## 4. Escapes (tests)

**The 0.16.9 console defect: green-but-blind, and the blindness was structural.**
No check could have caught it, because the gate *was* the thing broken and the
only path that exercised it was one nobody ran unattended. Fixed at two altitudes:
`bracket-noise.js` controls the classifier, and `.github/workflows/gate.yml` runs
the path. Its bracket carries the claim explicitly — an arm that must still fail,
proving the green was not bought by widening suppression.

**Rule 5's `sortObjects` control: missing, and cited as present.**
`references/webgpu-stack.md` claimed "repro scripts preserved in the session
scratchpad." They are not in the tree. Relabelled from measurement to observation
in `9f99ce4` rather than re-derived, with a trigger.

**`brackets` in CI: the test existed and never ran.** Added in `a99e1a2` to keep
the controls runnable, then skipped in all three subsequent runs because a step
after a failing step is skipped by default. Found only by reading per-step
timings and noticing `0s`. **The structural version: "the step is present" and
"the step ran" are different claims, and CI summaries report the first.**

**Tests added this span, each with a recorded claim:** `bracket-noise.js` (four
arms, two pulling opposite ways); the failing-exit paths in the two older
brackets; `scripts/selfcheck.js`'s eight checks, six of which fired on real
defects during the span; the `no-undef` lint rule, which would have caught the
`ReferenceError` the bracket caught instead.

**Not fixed, and now larger than first recorded.** The Linux determinism failure
was characterised as `materials.html` at `t=5.36`. The 0.16.25 gate run
(`gh run 30512312769`) instead failed **`menagerie.html` at `t=8.52`**. Tally on
Linux WebGL2: four failures across two different scenes and two different
timestamps, two clean runs. **This is a class, not a scene bug** — 3D scenes
intermittently failing the in-session determinism arm on Linux — and
`references/materials.md` currently under-describes it as scene-specific. That
entry needs widening; recorded here as the correction, not applied silently.

## 5. Forward items

1. **Widen the determinism finding in `references/materials.md` to a class.** Two
   scenes, two timestamps, one platform. Refuted if a third failure names a 2D
   scene or a non-Linux runner, which would mean the platform axis is wrong.
2. **Characterise the intermittency before diagnosing it.** Run `gate.yml` via
   `workflow_dispatch` on an unchanged SHA 10 times and record the failure rate
   per scene. Done when a rate exists; wrong-premise if all 10 pass, which would
   point at something in the changed configs rather than the scenes.
3. **Do not resolve item 1 or 2 by exempting a scene or relaxing the arm.** That
   is the bake proposal's red line #3 verbatim. Checkable: any diff touching the
   determinism check's thresholds or adding a per-scene skip fails this item.
4. **Ratchet `ASSERT_BUDGET` below 46** in `scripts/selfcheck.js`, by pointing
   measurement-assertions at controls or relabelling them as observations. Done
   when the number falls; refuted if the remaining 46 are all found to name
   controls already, meaning the metric over-counts.
5. **Extract the bracket harness at the fourth bracket.** Triplicated now;
   `bracket-sortobjects.js` is already anticipated by rule 5's trigger and would
   make it four. Done when one harness serves all of them.
6. **Verify the `method.md` truncation question.** Read it wholesale with the
   agent's own file tool and check for a truncation notice. If yes, the split
   becomes a correctness item; if no, it stays deferred taste and both reviews'
   pressure on it is answered by the heading map already added.
7. **Re-pin the runner when `ubuntu-22.04` warns.** Nothing notices today.
   Checkable at the first deprecation notice in a gate log.

## Annotations

**2026-07-29, on §4's "Not fixed, and now larger than first recorded" and on
forward items 1-3.** The owner asked whether per-run variation is licensed —
shader compilation, seeds — which sent me to re-read what the failing arm actually
compares. It compares two renders **in one page, one session**: `seekTo(t)` →
settle → screenshot, `seekTo(dur)` → `seekTo(t)` → settle → screenshot
(`plugin/skills/mitate/templates/smoke.js`). Both are after `compileAsync` and
after the boot's warmup-absorbing `seekTo(0)`, with the same frozen `R[]` pool. So
neither shader compilation nor seeding can account for it, and neither can
invariant 5 (both sides are webgl2) nor the bake proposal's cross-machine caveat
(Phase 4, unshipped, about the bake block rather than rendering).

What the re-read did surface is a better suspect than any of the above, and it was
sitting in the comment directly over that check the whole time: *"the capture race
it closes was measured as a flaky determinism FAIL whose in-page canvas pixels
were byte-identical — a capture race reported as a scene bug, which is the one
thing this check must never do."* That false positive has happened once already
and was closed with a double-rAF `settle`, which is ~33ms — plausibly sufficient
on macOS hardware GL and insufficient on a slower Linux software-GL runner. It
would explain all three things nothing else did: the intermittency, the
Linux-only-ness, and why the failing scene moved.

**This does not overturn §4** — the scope really did widen to two scenes, and the
class framing stands. It changes the likely *mechanism* from "3D scenes carry
state on Linux" to "the gate's capture may be racing on Linux," which is an
instrument defect rather than a corpus defect. Marked as inference, not
measurement: no discriminating observation has been taken yet.

The discriminator is now built rather than argued.
`scripts/sample-determinism.js` hashes the canvas **in-page** alongside the
screenshot, so each failure is labelled: canvas differs → scene state; canvas
identical while the screenshot differs → capture race. macOS baseline taken and
recorded below. `.github/workflows/sample.yml` runs it on Linux by manual
dispatch, 10 repeats by default.

**macOS baseline, measured 2026-07-29:** 20 cells (five 3D examples × four sample
points), 4 repeats each, **0 failures**. That converts "macOS passes" from two
incidental observations into 80 samples, and it means a Linux non-zero rate is a
platform difference rather than a corpus property.

**Forward item 2 is therefore superseded in method, not in intent:** one dispatch
of `sample.yml` yields ten samples per cell with a mechanism label, where ten gate
runs would have yielded one sample per cell with none. Item 1's widening stands.
Item 3's constraint stands and gets sharper — if the answer is a capture race,
then fixing `settle` is the correct repair and relaxing the determinism arm would
be repairing the wrong layer.

**2026-07-29, second annotation — the capture-race hypothesis is NOT confirmed,
and the instrument built to test it probably broke the test.**
`.github/workflows/sample.yml` ran 10 repeats × 5 examples × 4 timestamps on
ubuntu-22.04 / WebGL2: **0 failures in 200 samples** (run 30513335626), on the
same platform and the same scenes where `gate.yml` failed four times. macOS was
likewise 0 in 80.

That is not evidence the corpus is deterministic. It is evidence the sampler does
not reproduce what smoke reproduces, and the likeliest reason is the sampler
itself: `canvasHashAt` performs a `drawImage` + `getImageData`, which is a GPU
readback, which forces a synchronization point. **If the failure is a presentation
race, the discriminator suppresses the phenomenon it was written to observe.** The
structural version, and the transferable part: **an instrument that adds a
synchronization point cannot be used to measure a race.**

Bad luck is a weak alternative. The gate showed roughly one failing cell in twenty
on about half its runs — call it 2.5% per sample. P(0 in 200) at that rate is
~0.6%, so "the conditions differ" outranks "we got unlucky." Recorded as
inference; the rate estimate is itself derived from seven runs, not measured.

Next experiment, built and one dispatch away: `--no-canvas` (also a workflow
input) drops the readback and compares screenshots only, which is exactly what
`smoke.js` does. The pair is the experiment — fails without the readback and
clean with it near-proves a capture race and identifies the mask; clean both ways
moves the suspicion to what else `smoke.js` does per page that this script does
not (a cold `?strip=text` page, a live-playback page, three viewport resizes for
framing, exposure sampling), i.e. the sampler is too gentle.

**Forward item 2 stands as unfinished.** Two of its three possible answers are now
eliminated cheaply, which is progress, and the headline question — broken corpus
or racing instrument — is still open. It should not be closed by a green sampler.

**2026-07-29, third annotation — RESOLVED as a capture race, not a corpus defect.
Forward item 2 closed; a new and worse question opens.**

`sample.yml` with `no_canvas: true` (run 30513771889), 10 repeats, ubuntu-22.04 /
WebGL2, screenshots only — exactly what `smoke.js` compares:

| cell | rate |
|---|---|
| `materials.html@5.36` | 4/10 (40%) |
| `menagerie.html@8.52` | 3/10 (30%) |
| `menagerie.html@5.68` | 2/10 (20%) |
| the other 17 cells | 0/10 |

Against 0/200 in the readback mode, on the same runner image, the same scenes and
an identical `seekTo` sequence. **The only variable between the two runs is whether
an in-page GPU readback precedes the screenshot, and it eliminates the failure.**

That settles the mechanism. A genuine scene-state divergence would survive a
readback — the readback reads whatever is in the canvas, it cannot repair it. A
failure that disappears when a synchronization point is inserted is a
presentation/capture race: `settle`'s double rAF (~33ms) is sufficient on macOS
hardware GL and insufficient on this runner. Every previously unexplained property
follows — the intermittency, the Linux-only-ness, and why the failing scene moved
between gate runs. The two affected films are the two heaviest to render, which is
what a latency-sensitive race would predict.

**So the corpus was never broken, and `smoke.js` was reporting a capture race as a
scene defect — the one thing the comment above that check says it must never do.**
It has now done it twice, five months apart, in the same place.

**Cost of the wrong framing while it stood:** `references/materials.md` accused a
shipped film of carrying state, and `docs/working-plan.md` made it the top item
before Phase 4. Both were wrong in substance while being right to escalate.

**The new question is bigger than the one just closed.** If presentation latency on
a slow GL stack can outrun `settle`, then `shoot.js --workers N` — N pages
capturing frames concurrently, i.e. maximum contention — is the most exposed
consumer in the pipeline, and its output is a *shipped MP4* rather than a gate
verdict. A stale frame there is a defect in a deliverable that no instrument
currently samples. Raised by the owner mid-run as "could also be related to
parallelism in how it windows parallel workers"; the workers are not implicated in
*this* failure (smoke and the sampler are single-page and sequential), but they are
the place the same mechanism would do real damage. **Nothing has measured it.**

**And one more instance of the session's own pattern, mine.** The run above printed
`SCENE STATE (canvas differed)` for all three failing cells — in a mode where the
canvas is never read. A label asserting a measurement nobody took, emitted by the
instrument built to catch exactly that, with a comment in the same file saying a
label must not be invented there and no code implementing it. Fixed to print
`mechanism UNLABELLED (no readback taken)`. **Writing the rule in a comment is not
implementing the rule** — which is, verbatim, the finding in §2 about 0.16.9.

**2026-07-30, fourth annotation — the fix shipped, and my verification criterion
was incapable of verifying it.**

`seekSynced` shipped in 0.16.28: seek plus a 1x1 GPU readback in one page task,
routed through six capture sites — all three in `shoot.js` and three in `smoke.js`.
Review caught two of those six, and the second was worse than an omission: the
cross-reload check was left comparing a bare-seek capture against a `seekSynced`
one, diffing a race-hardened frame against a race-vulnerable one.

Then I asserted the verification criterion **"`no_canvas: true` must now return
0/200"** in the workflow header, the changelog and the session log. It cannot.
`--no-canvas` bypasses `seekSynced` by construction. The sampler had two modes and
*neither* exercised the shipped path — the default used its own bespoke readback,
the control used a bare seek. Run 30514669527 duly failed at 8/10, 4/10, 2/10, and
that is not a failed fix; it is a measurement of the code the fix replaced.

**This is the session's own defect, committed for the fourth time, by me, in the
instrument built to catch it.** A criterion that names a thing it cannot test reads
exactly like evidence. The general form, and it is the one line worth carrying out
of this entire span: **an instrument must exercise the shipped path, or its green
is about something else.** Corrected — the default arm now calls `seekSynced`, and
verification takes two dispatches: shipped path clean AND control still failing,
because a quiet control proves the instrument died rather than the bug.

Also newly measured and useful: the control's rate swings hard, 40% to 80% on
`materials@5.36` within the hour. A stable defect does not do that; a timing race
does.

**Still unverified.** The fix is plausible, locally green on both macOS backends,
and untested on the only platform where the failure exists.

**2026-07-30, fifth annotation — VERIFIED. The fix holds and the control still
bites.**

Two dispatches, same runner image, same scenes, 10 repeats each, back to back:

| arm | run | result |
|---|---|---|
| shipped path (`seekSynced`) | 30515053120 | **0 failures / 200 samples** |
| control (bare seek, pre-0.16.28) | 30515326660 | `materials@5.36` **10/10**, `menagerie@8.52` 2/10 |

That is a valid red/green pair: the instrument demonstrably still detects the race
— at 100% on the worst cell, its highest reading across four measurements — and the
shipped path is clean on the only platform where the failure has ever appeared. The
first fully verified conclusion of this span, and it took two corrections of the
verification itself to get here.

**The mechanism is now settled beyond inference.** Four measurements of the same
cell under the bare-seek pattern read 40%, 80%, 10/10 and (earlier, differently
sampled) 4/10. A stable state-carrying defect does not vary like that; a timing
race does. And it disappears entirely when a completion barrier is inserted, on
identical hardware. `settle`'s double rAF was a latency guess that held on macOS
hardware GL and lost on a GPU-less runner.

**What this closes, and what it costs to say plainly.** Two shipped films were
accused of carrying state. They never were. `smoke.js` reported a capture race as a
scene defect — twice, five months apart, in the same place, which the comment above
that check names as the one thing it must never do. The corpus was fine the whole
time; the instrument was wrong.

**What it opens is now closed by construction, not by measurement.** All three
`shoot.js` capture paths route through `seekSynced`, so the exposure that mattered
most — stale frames in a shipped MP4, on a contended machine, with nothing sampling
for it — is fixed wherever it was reachable. It has still never been *measured*
under `--workers N`, which is the honest residual: the pattern is right, the
parallel case is untested.

**Annotation discipline note.** This document's first verdict on the matter was
wrong, its second was wrong about the mechanism, its third named the mechanism
without proof, its fourth admitted the proof was invalid, and only the fifth holds.
Nothing above was edited to hide that. Anyone reading only the first finding would
be misled, which is why the filing rule says read newest-first.