---
mode: session
scope: three-releases-and-a-review
date: 2026-08-07
summary: Three releases closed the analysis batch's entire tool queue in one day, and the sharpest finding came from outside the session — the independent review caught the new discriminator affirming a broken scene's innocence on a blank readback, the exact misattribution it shipped to end.
artifacts:
  - CHANGELOG.md
  - CLAUDE.md
  - .gitignore
  - .github/workflows/gate.yml
  - .github/workflows/sample.yml
  - .claude/skills/verify-written-claims/SKILL.md
  - docs/README.md
  - docs/plan.md
  - docs/working-plan.md
  - docs/pattern-ledger.md
  - docs/shipped-provenance.md
  - docs/source-of-truth.md
  - docs/postmortems/2026-08-07_session_cold-build-analysis.md
  - plugin/skills/mitate/SKILL.md
  - plugin/skills/mitate/references/method.md
  - plugin/skills/mitate/references/characters.md
  - plugin/skills/mitate/references/film-language.md
  - plugin/skills/mitate/references/instruments.md
  - plugin/skills/mitate/references/materials.md
  - plugin/skills/mitate/references/breakdown.md
  - plugin/skills/mitate/templates/smoke.js
  - plugin/skills/mitate/templates/bracket-readback.js
  - plugin/skills/mitate/templates/bracket-driver.js
  - plugin/skills/mitate/templates/build.js
  - internal/log/log_2026-08-07.md
  - e83fc64
  - a4cedf9
  - 56dfb80
---

# Postmortem: three releases and a review (2026-08-07, closing session)

## 1. What went well

**Verify-before-writing held all nine harvest rows, and its one alarm was the
verifier's own defect.** Every queue row's grep was re-derived against the
current references before writing (`docs/working-plan.md`'s queue section,
disposed in `e83fc64`); the apparent refutation — `proud` absent from
`plugin/skills/mitate/references/materials.md` — was a case-sensitive grep
against a file that says `PROUD`. The empty result was interrogated instead of
believed, which is the "a query that returns nothing is a claim about the
query" rule from `docs/plan.md` doing its work on the person citing it.
**Structural version: the wrong-premise alarm and the broken-instrument alarm
present identically, and only re-running the query the other way tells them
apart.**

**Red-first ran end to end on the discriminator, and the discipline itself
produced a finding.** `plugin/skills/mitate/templates/bracket-readback.js` was
written before the change and observed failing four ways against the
unmodified `smoke.js` (`a4cedf9`); the two `bracket-driver.js` anchor updates
were each observed failing before being edited — and the second failure showed
the negative-control arm half-applying its mutation and reporting a throw as
its verdict, a decay mode invisible on any green run.

**The heavy reference content was re-derived from the fixtures, not the
extraction's summaries.** The contact disc came from the restage's
delivery-green implementation, the pool-ceiling fix from both turtle scenes'
independently agreeing code `(local)`, the three false-green shapes from the
warm build's own postmortem `(local)`, and the facing-angle product from the
SOLVER fence's placement arithmetic (`plugin/skills/mitate/references/method.md`,
`characters.md`, `film-language.md`, `breakdown.md`, `materials.md`,
`instruments.md`; ledger moves in `docs/pattern-ledger.md`, provenance rows in
`docs/shipped-provenance.md`).

**The independent review earned its run on the first substantive code diff.**
Both its findings against `a4cedf9` were confirmed, and the first —
`canvasReadback` reading byte-stable zeros from a GL canvas without
`preserveDrawingBuffer`, so a genuinely broken scene drew "the scene is
innocent" — inverted the discriminator's whole purpose. Closed red-first in
`56dfb80` with a WebGL arm watched drawing the innocence verdict against the
pre-fix tree. **Structural version: a control's own first release is the
highest-value review target, because its failure modes have just become
load-bearing and nobody has lived with them yet.**

**The owner's hold converted the dependency bump into a measured no-op.** The
sequence — discriminator bracketed on 1.61.1, 24-run baseline, then bump —
ran to completion in order (`56dfb80`, `CHANGELOG.md` 0.27.0): the identical
battery on Chromium 151 reproduced the identical result, 24/24 both sides.
**Structural version: a hold that names the experiment it is waiting for
spends itself; a hold that names only a risk never does.**

**The selfcheck ratchet fired twice on this session's own comments** (56→51,
then 52→51 during `56dfb80`'s staging) and both times forced a claim to name
its source or lose its trigger word. The ratchet works on the author writing
it, which is the only population that matters.

## 2. What did not go well

**The session hit two of the repo's own recorded traps within an hour of
writing them down.** The first metal characterization piped the validator
through `grep` and read silence as a result; the second failed on a stale
`cd` that left `NODE_PATH` pointing at nothing — the wrong-artifact shape
added to `plugin/skills/mitate/references/method.md`'s control section that
same afternoon. Both were caught by exit codes and re-run pinned
(`internal/log/log_2026-08-07.md`, fifth part). **Structural version: writing
a rule grants no immunity to it; the exit code does.**

**0.26.0 shipped with the blank-readback hole despite an adversarial pass.**
The bracket's arms varied the fixture's *behavior* (state drift, wall-clock
DOM) but never its *context type* — every fixture was a 2D canvas, where
`getImageData` always works. The input class that broke the classifier was an
environment variant, not a behavior variant, and only the external review
tried it. **Structural version: an adversarial round built from the author's
own fixture family inherits the author's blind spots; vary the environment
axis, not just the input axis.**

**Relayed state disagreed with the tree twice, in both directions.** The
owner reported a `.gitignore` edit the working tree did not contain (added
here after verifying, `56dfb80`); earlier, the queue's own verification note
was nearly overruled by a defective grep. Neither cost anything because both
were checked, but both took a check.

## 3. Deviations from the plan

| Planned | Shipped | Verdict |
|---|---|---|
| Dispose the nine-row harvest queue, greps verified first | Done as specified; fence-priced helpers declined at two instances per the queue's own pricing (`e83fc64`) | As planned |
| Readback discriminator as a real bracket on 1.61.1 | Shipped inside the check itself plus the bracket, with a deterministic from-clean-checkout reproduction instead of a probabilistic one (`a4cedf9`) | Better than planned, with the scope caveat written into the bracket header |
| `smoke.js --dump-frames` | As specified, artifacts arm pinning verdict-unchanged | As planned |
| (not planned) Situated pointer + "Usual cause" demotion | Same edit site as the two fronts; first instance of `docs/plan.md`'s pointer row | Scope grew, deliberately — three findings shared one failure path |
| (not planned) Metal baselines, 24 runs per version | Ran on both 1.61.1 and 1.62.1 | Grew; it is what made the bump an experiment |
| Bump playwright (owner-directed mid-session) | Executed with the full battery; install path corrected to the pinned package's own CLI (`.github/workflows/gate.yml`, `sample.yml`, `plugin/skills/mitate/SKILL.md`, `templates/build.js`) | As directed |
| Archive snapshots (owner-directed) | Untracked, gitignored, moved out; every live pointer and the dated-record class updated; one deferred-table conflict dissolved with its subject (`CLAUDE.md`, `docs/source-of-truth.md`, `.claude/skills/verify-written-claims/SKILL.md`, `.gitignore`, `56dfb80`) | As directed |
| Last look at `.claude/` and `.github/` (owner-directed) | Sweep found no stale pins, snapshot paths, or invalidated claims; one ratchet catch | As directed, quiet |

## 4. Escapes (tests)

**The blank-readback misclassification — green-but-blind in the brand-new
bracket.** `bracket-readback.js`'s first five arms could not see it: all used
2D-canvas fixtures, and the defect lives in the GL context type. The arm that
should have existed now does (the `GLBLANK` fixture, `56dfb80`), observed red
against the pre-fix tree. The deeper escape is in the adversarial round that
approved 0.26.0, not in any existing check.

**The unavailable-branch formatting defect — no test, none added, said
plainly.** Finding 2 (`smoke.js` printing one healthy hash as the reason
attribution did not run) was caught by the reviewer reading, and the fix is
one interpolation. No arm pins it: forcing exactly one of two readbacks to
error requires fault injection into `page.evaluate` whose cost exceeds the
defect class. Recorded as an accepted gap rather than dressed as coverage.

**Tests added, each with a recorded claim:** the `GLBLANK` arm (delete it and
a blank readback can silently reclaim the innocence verdict), and 0.26.0's
five arms carried forward. Both `bracket-driver.js` anchor updates re-run red
then green.

## 5. Forward items

1. **The determinism lead has an armed instrument and no live sighting.** Done
   when the next `WEBGPU=metal` determinism FAIL anywhere in the corpus
   arrives carrying a layer verdict. If that verdict says the readback also
   differed, the capture-race framing in
   `docs/postmortems/2026-08-07_session_cold-build-analysis.md` is refuted and
   the lead points at the scenes.
2. **The first push exercises the new surfaces in CI.** Done when the pushed
   gate run shows `bracket-readback.js` in the bracket loop's derived count
   and `sample.yml`'s new `playwright-core/cli.js` install step succeeds.
   Either failing is a same-day fix, not a debate.
3. **The pointer instance's refutation half is still open** (carried from the
   prior postmortem's item 5): if the next analyzed plugin-only build hits a
   determinism failure and still never opens `webgpu-stack.md`, the pointer
   was not the binding constraint and the routing finding was wrong.
4. **The adversarial-round gap is a method fix, not a wish.** Done when
   `docs/controls.md`'s adversarial-round bullet names the environment axis
   (context type, backend, tracked-vs-untracked) beside its existing input
   variants, so the next new-control round varies both. Refuted if the owner
   rules the review pass owns that axis instead.
5. **The work-next queue head is unchanged and this file does not restate
   it** — the cold build one tier down, in `docs/README.md`'s row.
