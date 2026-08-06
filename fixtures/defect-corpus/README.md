last updated: 2026-08-05

# The defect corpus — apparatus, not an example

> **Wired as of 2026-08-03:** `plugin/skills/mitate/templates/bracket-corpus.js`
> (in the gate's bracket loop) asserts the fixture still passes smoke — a
> corpus scene that stops running stops being apparatus — and pins each
> VERIFIED row's derivable signature: row 10b via `build.js check`'s
> repeat-framing warning, row 11 via a probe of the walker's real width
> against its declaration. Row 8 needs an encoder and is deferred, stated in
> the bracket's header. **A row moving out of UNVERIFIED earns its arm in the
> same change** — that is the wiring the earlier "before the next change,
> build the runner" note was waiting for, ruled on by the owner (coarse tier
> now, row-by-row as verification happens).

Scenes kept **because they are broken**, with characterized defects at known
timestamps. A new instrument gets a positive control the day it is written, and
a *regression* control the day someone changes it.

**This is not teaching material and must never be read as one.** The films in
`scenes/` are finished work an instrument has passed; these are scenes an
instrument should be measured against. That is why this directory lives outside
the plugin subtree: everything under `plugin/` ships into the install cache, and
a deliberately defective scene must not reach a user as though it were a
finished film.

## Why it exists at all

`working-plan.md` recorded that every instrument here was bracketed by
hand-building a fixture and throwing it away, and predicted its own failure —
*"The prototype scene is currently the third such fixture about to evaporate."* That
came true: the prototype survives on one machine, gitignored and unbacked-up.
This directory is the fix.

## `after-hours.html`

**Provenance.** Re-skinned from that prototype `(local)`. The theme, palette,
title words and setting changed; **the script did not**. Beat names, durations,
captions, `SHOTS` and the rig are unchanged, because what the fixture is *for* is
mechanical and none of it lives in the theme: ~60s over 17 beats, multi-shot
solver traffic, shadowed fur shells, a character rig. That combination is why the
prototype was the only candidate reproducer for the open 1-in-6 `WEBGPU=metal`
determinism failure — `noise-chart.html` failed to reproduce it in 15 runs
precisely because it lacks them.

The title words were length-matched to the originals on purpose — `THE STRANGE` /
`MUSEUM`, 11 and 6 characters, the same lengths the source used — so the glyph
arch, gap and scale metrics did not move.

**Measured constraint, found the hard way:** the scene's procedural alphabet
defines **thirteen letters** — `T H E A M N Z I G C R U S`. A first pass chose
`AFTER HOURS`, matched the character count, and crashed in `buildWord` on the
missing `F`. Character count is not glyph coverage. Any future re-skin must check
the alphabet, not the length.

### Parity status: IT JOINS THE PARITY SET — a ninth carrier

Stated here because the plan requires the decision to live where the file does,
and because a file that silently leaves the parity set is the exact failure
`bracket-parity.js` exists to catch.

The reason is not tidiness. **A regression control running a stale kernel is not
measuring the engine the instruments actually gate.** When this file was
imported, 5 of its 7 fences had drifted from the shipped corpus — `CONTRACT` was <!--count-mention-->
absent entirely, and `KERNEL`, `SOLVER`, `DRIVER` and `HTML` were months behind.
It was brought current with `smoke.js --parity-fix --from
plugin/skills/mitate/templates/scene.character.template.html`, which is the
second real use of that command and the reason joining is affordable at all.

So: include this directory in every `--parity-only` invocation. It is wired into
`static.yml` and the pre-commit hook — **and deliberately not into `gate.yml`,
which does not see this directory at all.** An earlier version of this line
claimed `gate.yml` too and was contradicted five lines below by the section that
explains why it is absent; the reader who believed the first sentence would have
read the second as describing a different problem.

### Open: nothing checks this file still RUNS (2026-07-31)

Parity covers it. **Smoke does not.** `gate.yml` copies `templates/` and
`scenes/` into its workspace and not `fixtures/`, so a change that stops this
scene loading — a `KERNEL` edit it cannot survive, a contract rename — would be
found by whoever next tried to use it, which is the "a command nobody runs rots
quietly" shape the harness tier exists to close. It passed `smoke.js` cleanly on
import (0 advisory warnings), so this is a gap in coverage, not a known failure.

**The fix is NOT to add it to the gate's scene list.** This scene is
deliberately defective; the day a defect is added that trips an exposure or
framing check, a general pass/fail gate goes red for a *correct* reason and the
gate becomes something people route around.

It wants a check that asserts its **expected verdict** — a `bracket-corpus.js`
in the same expected-verdict shape `bracket-parity.js` and
`bracket-commands.js` already use, recording what smoke *should* say about this
file and failing when that changes in either direction. Not yet written.

## The defects, and which have been re-measured

This build enumerates the prototype's defects as
<!--derived:defect-rows-->14<!--/derived--> rows across the two tables below:
**<!--derived:defect-bases-->11<!--/derived--> base defects, three of which are
split into sub-lettered rows** (`2b`, `5b`, `10b`).

**The prototype's own count is NOT stated here, because no tracked file can check
it.** This sentence said "twelve" until 2026-08-02, with arithmetic that only
balances at eleven — three splits over eleven bases gives the fourteen rows; over
twelve it would give fifteen. Whether the prototype carried eleven, or carried
twelve and one was never enumerated here, is unanswerable from the tree: the
prototype is local-only. Per the rule that a claim may cite a local artifact but
must not rest on one, this file now states what its own tables hold and stops
asserting what only one machine could confirm.

The figure was also **exempted from the count check by a `count-mention` marker**
— the escape hatch for legitimate historical mentions, applied to a number that
contradicted the table three lines below it, which is why the generator never
caught it. **The defects are mechanical and most should survive a re-skin, but
"should" is not a measurement** — and the engine changed underneath this build
when the fences were brought current, which can move both framings and numbers.

**Re-measured against THIS build:**

| # | defect | prototype | this build | verdict |
|---|---|---|---|---|
| 8 | `endcap` — a beat in which no character moves | `motion` 0.94 against peak 5.75 | **1.05 against peak 6.79** (`orbit`), median 2.57 | **survives**; still the weakest beat by a wide margin, and both numbers moved |
| 11 | `SUBJECTS.walker` declares `w:2.8` | measured 3.62 | **3.12 @ t=5, 3.30 @ t=20, 5.76 @ t=45** (fallen) | **survives**; declared extent is under the real one at every sampled moment. The prototype's 3.62 does **not** reproduce — the figure moved |
| 10b | five shots are the identical card | squint strip, by eye | **four** shots share a byte-identical framing — `SHOTS[2,6,9,11]`, all `walker` / `FSA` / angle 26 / elev 7 | **survives, and the count moved.** The fifth (`fall`) differs by `elev` alone, which the eye reads as the same card and a table comparison does not. The rung half of the row — 15 of 22 at `FSA` — is untouched by this and remains UNVERIFIED |
| — | beat map: 17 beats, 60.0s | 17 beats, 60.0s | **unchanged**, confirmed by `motion` | durations carried over, so timestamps below are still addressed correctly |

Re-run those three with:

```bash
bun run plugin/skills/mitate/templates/build.js motion fixtures/defect-corpus/after-hours.html 12
bun run plugin/skills/mitate/templates/build.js probe fixtures/defect-corpus/after-hours.html 20 'bb(walker.root)'
bun run plugin/skills/mitate/templates/build.js check fixtures/defect-corpus/after-hours.html
```

**`check` is also this file's cheapest standing use, and its report is worth
reading as a boundary.** It runs in milliseconds with no browser, and on this
scene it finds exactly one thing: 10b's repeated framing. Every other defect
below needs pixels, geometry or a clock. That is not a gap in the checker — it is
the honest shape of what a declarative cross-reference can reach, and it is why
row 11's declared-versus-real extent is the row `check` names and does not
measure.

**NOT yet re-measured against this build — carried from the prototype and
therefore UNVERIFIED here.** Do not cite these numbers as properties of this
file until each has been re-run; that is the whole discipline this corpus exists
to serve.

| # | defect | prototype evidence |
|---|---|---|
| 1 | orbit shot runs off the end of the set, up to 14.27% background void | frame-luma fraction Y<24, peak t=37.72 |
| 2 | every exhibit scales to nothing while its own shot still frames it | scale probe: flowRig .168@12.9, timeRig .339@20.1, beatRig 0@23.59 |
| 2b | `scrub`'s payoff held at full size for 0.064s | payoff-complete vs rig-exit timestamps |
| 3 | ship exhibit occludes the walker's torso through the outro | AABB overlap x 3.08 / y 2.20 at t=26.9 |
| 4 | the film's own title is cropped in both title beats | logo top ndc.y 1.064 @ t=2.6, 1.027 @ t=58.8 |
| 5 | uncovered single-frame teleport of all 40 pixels | `settle` steps 1.0 → 0 at t=10.888 |
| 5b | pixels do not fly in from the prompt card the comment claims | 0.87 units clear in x, 1.38 in z |
| 6 | 1.38 rad elbow snap at the `bear`→`chase` boundary | rotation probe at 0.04s steps |
| 7 | the chase has no pursuit — gap constant within ±0.4 from 47.5s | AABB separation trace |
| 9 | paws render as hard black rectangles | self-shadowed by the leg |
| 10 | ~4 of 9 act-one beats read unaided vs 7 of 8 act-two | `nocap` sheet |

## The finding that justifies the whole directory

The prototype's defects — however many it carried; see above — were found by a **single** `film-reviewer` pass on
a film its author had already reviewed over roughly eight look-and-edit rounds
and delivered as an MP4. The review found almost nothing the author had
considered and dismissed, and nearly everything the author had never looked at.

**Independent review is not a second opinion here; it is coverage of the space
you stopped searching.**
