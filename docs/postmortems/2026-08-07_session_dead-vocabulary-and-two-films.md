---
mode: session
scope: dead-vocabulary-and-two-films
date: 2026-08-07
summary: Building the first two films that reached for unexercised vocabulary found two silent defects the harness could not see — STYLE.dof had never worked and SUBJECTS.pos was impure in both films — and the recurring shape behind both is that a green check certifies what it sampled, not the property it is named for.
artifacts:
  - CHANGELOG.md
  - plugin/skills/mitate/templates/fences/RIG.fence.txt
  - plugin/skills/mitate/templates/bracket-dof.js
  - plugin/skills/mitate/references/instruments.md
  - plugin/skills/mitate/references/film-language.md
  - plugin/skills/mitate/references/materials.md
  - plugin/skills/mitate/references/characters.md
  - plugin/agents/film-reviewer.md
  - docs/shipped-provenance.md
  - docs/plan.md
  - docs/README.md
  - docs/working-plan.md
  - docs/pattern-ledger.md
  - scenes/README.md
  - scenes/strider-intro.html
  - scenes/hauler.html
  - scripts/selfcheck.js
  - scripts/bracket-selfcheck.js
  - site/index.html
  - internal/log/log_2026-08-07.md
  - 452f4cf
  - f936abb
  - 21111aa
  - f492bdc
  - f286634
  - 1ec883a
  - 49f185e
  - 3e495f9
  - aeebc6a
  - 4a42d4a
---

# Postmortem: dead-vocabulary-and-two-films

Session mode. Thirteen commits (`452f4cf..b1bbaa1`), five releases
(0.22.2, 0.22.3, 0.23.0, 0.23.1, 0.24.0), 39 files, two films into the corpus.
The day's narration is `internal/log/log_2026-08-07.md`; this is the distilled
finding.

## 1. What went well

**Choosing films by what they would EXERCISE, not by what they would look
like, found two real defects in one day.** Both `strider-intro` and `hauler`
were specced against vocabulary verified unexercised across the whole corpus
first. `STYLE.dof` had never been enabled by any scene; `match: true` had zero
occurrences repo-wide; per-shot camera energy did not exist (its `docs/pattern-ledger.md` row moved 1 -> 2). The first of those
turned out to be dead code in `plugin/skills/mitate/templates/fences/RIG.fence.txt` (`f492bdc`, `CHANGELOG.md` 0.23.0). The general form: **unexercised
vocabulary is where dead code hides, and the cheapest way to find it is to
build the thing that needs it.**

**The verification pass earned its own release before any film was built.**
Re-deriving the prior evening's batch (`/verify-written-claims` over
`c4f7990..HEAD`) confirmed twelve claims and refuted nine, landing as 0.22.2
(`452f4cf`). Two were structural rather than clerical: `CLAUDE.md` contradicted
itself about `selfcheck.js` check 4 eight screens apart, and
`docs/source-of-truth.md` had updated its homes table for the 0.22.0 move while
leaving its rules section asserting the opposite. **A two-section document
invites half-migration — the edit lands where the writer was looking.**

**`plugin/agents/film-reviewer.md` got its first end-to-end verification and it
was not clean.** Three drift items, the sharpest being a mechanism claim about
`CONFIG.flashes` sample collisions that is arithmetic-dependent and **false on
`scenes/crash.html`, the only corpus scene that declares flashes**. It had no
row in `docs/shipped-provenance.md` either, and the reason generalises: the
0.22.0 scrub's working set was "files carrying a date", this file carried none,
so it fell out of the batch *and* out of the ledger that batch created. **A
scrub whose file set is what the check matches is narrower than the rule the
check enforces, and the gap is invisible because the check is green.**

**Pushing before continuing was the right call twice, on a stated basis.** Both
pushes were argued from the same specific gap — every local render reported
`[source, webgpu]`, and the gate is the only thing that runs the WebGL2
fallback. Both came back green (`31196777504`, 7m1s at `31201834110`), and the
second specifically verified the `SUBJECTS.pos` fix on a backend that was never
rendered locally.

**Held a harvest back on purpose and it paid.** The low-key lighting rig was
not written into `plugin/skills/mitate/references/materials.md` after
`strider-intro`, on the grounds that one scene's lighting is taste. `hauler`
became the second sample, and the section that landed is not the four lights —
it is the three things that *moved between* the two films and why.

## 2. What did not go well

**A false claim reached a commit and was pushed before it was caught.**
`docs/plan.md` asserted that `scenes/crash.html` "carries no fence markers at
all" and sits "outside the parity set". All three clauses were false. The check
behind them grepped `mitate:begin:X`, a marker syntax this repo does not use —
the real markers are `==== X-START ====` — and an empty result was read as an
absence rather than as a query that never had a chance to match. Corrected in
`49f185e` with the general form attached: **a query that returns nothing is a
claim about the query until you make it return something.**

**A bracket header asserted a measurement it had not taken.** The first draft
of `plugin/skills/mitate/templates/bracket-dof.js` predicted two arms would go
red; the run produced one. Corrected before commit, but the header was written
as though the run had already happened — the same derive-at-write-time defect
this repo keeps recording in other people's work, committed inside the file
whose entire purpose is to replace prediction with measurement.

**The site defect from 2026-08-05 reproduced exactly two days later.**
`strider-intro` staged and served with no card in `site/index.html` and no
entry in the player's film map — reachable by URL, dead as a button, which is
precisely what `crash.html` shipped with. Fixed in `1ec883a`, and this time the
check was written over *every* staged film rather than the new one. **A defect
fixed on one instance without a check that covers the class returns on the next
instance.**

**Two composition rounds on `hauler` were spent on geometry that existed and was
invisible.** The cradle — the film's entire subject — was authored at a local
`y` that put it inside the torso, along with four plating slabs. Probing
`bb(walker.body)` reported the torso spanning `y 0.30..2.40` in one command;
the two rounds before that were spent looking at renders. **When geometry is
missing from a frame, measure the box before adjusting the light.**

**Instrument-output hygiene cost time again, and I caused some of it.** Piped a
validator through `tail` twice (recovered both times), and the `motion` verb's
ffmpeg banner buried the operative table under ~20 lines of build configuration
on every run. Both are already filed in `docs/working-plan.md`; this session
added datapoints rather than fixes.

## 3. Deviations from the plan

| Planned | Shipped | Verdict |
|---|---|---|
| Verify the recent shifts, get up to speed, continue | That, plus a release (0.22.2) the verification itself forced | Grew by discovery — the drift was real |
| Build `boss-intro` Rung A | `scenes/strider-intro.html` (0.23.1, `f286634`), plus the `STYLE.dof` fix and `bracket-dof.js` it uncovered (0.23.0) | Better than planned; the film was the instrument that found the bug |
| Then the 2D-explainer rung | **Not built.** Requeued as blocked-on-cold (`3e495f9`) | Correct refusal — see below |
| — | `boss-intro` Rung B, `scenes/hauler.html` (0.24.0, `aeebc6a`), substituted for the 2D rung | Substituted deliberately, with the reasoning recorded |
| — | `SUBJECTS.pos` purity bug found, fixed in two scenes, guarded by `scripts/selfcheck.js` check 23 (`4a42d4a`) | Unplanned; the highest-value thing in the session |
| Owner call: strike unmeasurable success criteria | 0.22.3 (`f936abb`) — struck from `plugin/skills/mitate/references/instruments.md`, swept `method.md`, `VISION.md` and the agent brief for siblings | As directed |
| Owner call: label build provenance | `scenes/README.md` defines COLD/WARM and labels all films; registered in `source-of-truth.md` (`21111aa`) | Widened deliberately from a note to a doctrine with a stated asymmetry |

**The 2D-rung refusal is the deviation worth defending.** Its stated reason is
the n=1 brake, the brake is on the **cold-start** criterion, and a second 2D
film built in-repo is WARM — so it would have moved the queue without moving
the measurement, and a discharged-looking row stops anyone else running the
real experiment. The warm bug-hunting case was checked rather than assumed and
was weak: parity does guard the 2D kernel (verified by injecting a line inside
`crash.html`'s `KERNEL` fence and watching `--parity-only` go red), smoke's
checks are not backend-gated, and `aspect` holds across all four window shapes
on `crash`.

## 4. Escapes (tests)

**`STYLE.dof` — green-but-absent.** No check could have caught it because no
scene had ever entered the branch: no corpus film enabled `STYLE.dof`, so the
code path existed only in the authoring of the line. `plugin/skills/mitate/references/film-language.md` had
literally written *"bracket before trusting a look to it"* — a warning that
only pays when somebody runs the bracket. The symptom also defeats the obvious
check: enabling dof **did** change the frame (a uniform imperceptible
softening), so "is there an effect" passes in both the broken and fixed states.
Only "does the parameter do anything" discriminates, which is why
`plugin/skills/mitate/templates/bracket-dof.js` is a parameter sweep — identical bytes at `maxBlur`
`.016`/`.10`/`1.0` and at `focalLength` `0.8` vs `400.0`.

**`SUBJECTS.pos` purity — green-but-blind, and demonstrably so.** `hauler`
failed smoke at `seekTo(16.64)`. `scenes/strider-intro.html` had the identical
defect, shipped, and passed — no sampled `t` landed where the stale pose moved
a byte. **This is the cleanest instance of the session's structural finding: a
green determinism run certifies the samples, not the property.** The two films
are a matched pair on the same bug with opposite verdicts from the same check.

**Did the session add checks? Three, each with a recorded claim.**
`bracket-dof.js` (4 arms; one is the claim, three are the blast radius that
stop the fix being bought by blurring scenes that never asked for it —
observed red `9bebe068` vs `9bebe068`, green after). `scripts/selfcheck.js` check 23
plus two arms in `scripts/bracket-selfcheck.js` — and the second arm exists
because the check's first draft **fired on the two scenes that had just been
fixed**, since their comments name `getWorldPosition` while warning against it.
A check that cannot tell an instruction from a warning about that instruction
reports its own documentation as the defect; delete that arm and it is free to
do so again.

**Disclosed limits rather than discovered ones.** Check 23 is a text scan: it
sees a direct call and not one reached through a helper. Stated in its header —
it can reject, it cannot approve.

**`motion` cannot see a focus pull.** The `hauler` `cradle` beat scored 0.09
and reported 2.0s of dead air over a window in which the rack focus was
running. There was genuine dead air too, and it was fixed — but the
instrument's blindness to a deliberate optical change is its own escape and is
recorded nowhere but here and the day's log.

## 5. Forward items

1. **The 2D rung must be built COLD, by a plugin-only session.** Checkable: if
   the next 2D film is built in-repo, this item was ignored and the n=1 brake
   is still at n=1. `docs/README.md`'s work-next row states the block.
2. **Check 23's proxy limit is real and will be found.** Its header claims it
   cannot see `getWorldPosition` reached through a helper. Checkable: write a
   scene whose `pos` calls a local helper that reads a world matrix; if check 23
   passes it and smoke's determinism sampler also passes it, the guard is
   thinner than the changelog implies and wants widening.
3. **Watch whether a third film needs the generalised multi-beat gait rule.**
   `plugin/skills/mitate/references/characters.md` documents the one-span form; `hauler` needed a two-disjoint-leg
   form and I extended it in my head rather than in the reference. Checkable: if
   a third film writes a multi-leg travel and the reference still only covers one
   span, the rule needs the general statement.
4. **The `bracket-selfcheck` cascade artifact has now fired four times and is
   still unfixed** (`docs/working-plan.md`). Checkable: a fifth sighting means
   the filing mechanism is not converting to work, and the row should either be
   built or retired rather than re-observed.
5. **My own claim-error rate this session was two, both self-caught.** The false
   parity claim reached a push; the bracket header asserted an untaken
   measurement. Checkable against the next session: if a claim-shaped error
   again reaches a commit, the corrective is not more care but a mechanical
   pre-commit step over added prose — which is what `/verify-written-claims`
   already is, and which I ran on somebody else's batch this morning and not on
   my own.
