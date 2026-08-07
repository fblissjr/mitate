---
mode: session
scope: cold-build-analysis
date: 2026-08-07
summary: Reading three installed-plugin builds from their transcripts found a shipped defect that wrote outside the workspace in 3 of 3 builds, and measuring WHEN references get read found the structural one — every reference read landed in the opening minutes, so index routing cannot work and the pointer belongs in the instrument.
artifacts:
  - docs/scene-analyses/2026-08-07_turtle-pair-and-v2v.md
  - .claude/skills/analyze-build-session/SKILL.md
  - .claude/skills/extract-patterns/SKILL.md
  - plugin/skills/mitate/SKILL.md
  - scripts/selfcheck.js
  - scripts/bracket-selfcheck.js
  - .github/workflows/gate.yml
  - .github/workflows/sample.yml
  - docs/plan.md
  - docs/source-of-truth.md
  - docs/working-plan.md
  - docs/README.md
  - VISION.md
  - CHANGELOG.md
  - internal/log/log_2026-08-07.md
  - 5858e92
  - 06c30ba
  - e550d37
  - f40d176
  - 252e989
  - 2d770a5
  - beb3df6
  - 10d6c74
  - 5bcb55f
---

# Postmortem: the cold-build analysis session (2026-08-07, second half)

## 1. What went well

**Three independent no-context readers, one per build, produced findings a
single reader would not have.** The recurrence across them is what promoted
anything: the scaffold defect appears in all three transcripts, the unopened
`webgpu-stack.md` in all three, the patched `smoke.js` in all three. Recorded in
`docs/scene-analyses/2026-08-07_turtle-pair-and-v2v.md`. **Structural version:
independent readers are not redundancy, they are the measurement — a finding
seen once is a property of one session, and the same finding seen three times is
a property of the shipped surface.**

**The orchestrator/subagent split was right, and only visible in hindsight.**
Depth per build went to the subagents; the cross-build comparison (reference
reads, tool mix, model/effort, human turns) was run by the analysing session
because no subagent can see the other builds. The single highest-value query of
the day — reference-read *timing* — belongs to that half. Written into
`.claude/skills/analyze-build-session/SKILL.md`.

**Verify-before-writing caught a real duplicate, twice.** A `build.js check`
warning was one step from being written up as a false positive when the code
comment showed it was a deliberate declared-substitution notice with its own
bracket arm. Later, the extraction pass claimed `proud` was undocumented and
`materials.md:221` already prescribed it with numbers; writing that as reported
would have created a duplicate entry. Three of four sampled gap claims held;
one did not.

**The fixes were red-first and the controls were verified in both directions.**
The scaffold escape was reproduced in a scratch tree before the fix and the
whole fixed block run end-to-end after (`06c30ba`). Each new bracket arm was
checked to go MISSED with its fix reverted, not merely CAUGHT with it present
(`f40d176`). **Structural version: an arm that has only been seen CAUGHT has not
been shown to be a control.**

**Asking how a new file avoids drift found two live drift holes**
(`f40d176`, `252e989`). The question was procedural and the answer was a defect.

## 2. What did not go well

**Subagent-derived claims were written into a tracked record before being
verified.** `docs/scene-analyses/2026-08-07_turtle-pair-and-v2v.md` shipped in
`5858e92` carrying dozens of claims from three reports, of which two had been
independently re-run — the two that became actionable. A memory note already
said to verify a subagent's framing, not just its findings. Corrected in
`beb3df6` by giving the record explicit evidence tiers, and the rule is now the
first of four verification passes in the skill. **Structural version: the
claims you check are the ones you were already going to act on, which is
exactly the sample that needs checking least.**

**The first framing of model and effort was wrong, and it reached a live
routing surface.** They were written up as confounds to hold fixed
(`5858e92`, `docs/README.md`). The owner's correction: they are the outcome — if
the plugin is improving and agents are learning it, the tier and effort needed
to ship should fall, and pinning the axis hides what the loop exists to show.
Fixed in `beb3df6`. **Structural version: a variable that looks like noise in a
single comparison can be the dependent variable of the programme the comparison
belongs to.**

**The 0.24.1 fix shipped with its own version of the bug it fixed.** The new
`package.json` line used a bare `>`, which truncates an existing manifest —
silent damage outside the intended scope, which is what 0.24.1 was about. Caught
by review, not by a check; fixed in `252e989`.

**The work-next row in `docs/README.md` was stale on arrival.** It still named
`boss-intro` Rung B as next after `hauler` had landed as Rung B the same day.
Found incidentally while integrating, not by any check — the row is the most-read
line in the repo and nothing watches it.

**A bracket header's recovery advice had been wrong for longer than this
session.** `scripts/bracket-selfcheck.js` told a killed run that `git status`
shows "what to delete", true only of arms that create a fixture; several arms
modify tracked files in place. Corrected in `2d770a5`, and the first rewrite of
that comment was itself rejected by selfcheck for stating an arm count in prose.

## 3. Deviations from the plan

| Planned | Shipped | Verdict |
|---|---|---|
| Analyse three build fixtures; learn how an agent uses the plugin | Done, plus a tracked record and four working-plan rows | As planned |
| Record the flywheel as a guiding principle | `VISION.md` gains the second flywheel with its contamination and privacy constraints | As planned |
| Check whether an analysis skill exists | It did not; `.claude/skills/analyze-build-session/` written from the retro on the pass, not from the morning's hypothesis | Better than planned — the hypothesis lost five items and gained five it had not anticipated |
| (not planned) Fix findings | 0.24.1 and 0.24.2 shipped; three selfcheck checks and three bracket arms added | Scope grew, deliberately, on owner direction |
| (not planned) Upgrade three.js and playwright | `three@0.185.1` already latest — no-op. Playwright **held**: 1.62.1 ships Chromium 151 against 1.61.1's 149, which invariant 5 makes a backend change | Scoped down honestly, owner agreed the gating sequence |
| (not planned) Extract techniques | `/extract-patterns` run; nine findings **filed, not disposed** | Scoped down deliberately — nine reference edits at the end of a long session is how a good extraction becomes a bad reference |
| Do not leak private paths | Held throughout; all citations by class with `(local)` | As planned |

## 4. Escapes (tests)

**The scaffold escape — missing, and worse than missing.** Nothing checked that
`bun add` installed where it was told. `.github/workflows/gate.yml` built its
workspace the same manifest-less way, so CI was exercising the defect rather
than the prescribed path and could never have caught it. Fixed in `06c30ba`.
**Structural version: a gate that reproduces the shape of the bug is not a
green board, it is a blind one — CI must run what the docs prescribe, or it
tests a configuration no user has.**

**The freshness check — green-but-blind, for a week.** `scripts/selfcheck.js`
check 7 derives its population by looking for a marker in a 200-char window, and
a skill's frontmatter description pushes the marker past it. Two skills carried
markers nothing had ever checked; `extract-patterns` was in fact stale. A file
outside the population cannot fail, so the count simply came back lower with
nothing naming the absentee. Fixed twice in `f40d176` and `252e989`: strip
frontmatter, then make a marker outside the window a *failure* rather than an
absence. **Structural version: a check that silently narrows its own population
reports on what it happened to look at, and its green is a statement about
coverage nobody stated.**

**The `sample.yml` pin — missing.** A fifth consumer of the playwright pin that
nothing compared (`f40d176`). Its note now names any pin it could not compare,
so the verdict states its scope (`2d770a5`).

**The 0.24.2 clobber — no check exists and none is proposed.** A destructive
shell command in shipped guidance is not something the current apparatus can
see. Caught by reading. Recorded rather than fixed, because a check for
"shipped shell is destructive" is a large build against one instance.

**The cascade arm — disclosed, not blind, and fixed on its fourth sighting.**
It reported MISSED whenever an uncommitted bump sat in the tree, which was check
11 behaving correctly presenting as "selfcheck has stopped working". Arms now
take a precondition and skip with the reason stated (`252e989`). **Structural
version: a control that cannot be exercised has not failed, and reporting it as
a failure trains people to read past its verdict.**

**Tests added, each with a recorded claim.** Three selfcheck checks
(frontmatter-stripped population, stray markers outside the window, `sample.yml`
pin agreement) and three bracket arms in `scripts/bracket-selfcheck.js`
(stale marker behind long frontmatter; marker pushed below the window;
`sample.yml` skewed off `gate.yml`). Each arm was verified to go MISSED with its
fix reverted. The skip mechanism was verified conditional, not permanent — the
arm returns to CAUGHT on a clean tree — because a precondition that always fired
would silently disable the arm, which is worse than the MISSED it replaced.

## 5. Forward items

1. **Build the readback discriminator as a real bracket on
   `playwright-core@1.61.1`.** Done when a bracket reproduces *screenshot
   differs N/8, canvas readback 0/8* from a clean checkout. If the readback also
   differs, the capture-race framing in
   `docs/scene-analyses/2026-08-07_turtle-pair-and-v2v.md` is wrong and the
   determinism lead points at the scenes instead. Gates item 2.
   **DONE 0.26.0, in a stronger form than specified** — the discriminator
   ships inside `smoke.js`'s determinism checks themselves (a readback beside
   every screenshot, layer named in the verdict), and
   `templates/bracket-readback.js` reproduces screenshot-differs/readback-agrees
   from a clean checkout deterministically (a wall-clock DOM overlay) rather
   than probabilistically. Scope honestly narrower in one respect: the bracket
   proves the *instrument* discriminates; it does not retro-diagnose the field
   failures — that is what the baseline runs are for, and their count and
   verdicts are in the changelog and `working-plan.md`'s lead row. The
   refutation condition stands, restated in the bracket's header.
2. **Then bump `playwright-core` to 1.62.1 and re-measure.** Refuted if the
   Chromium 149→151 change moves determinism results in a way item 1's baseline
   cannot separate from a real fix — in which case the bump was premature and
   should be reverted, not absorbed.
   **DONE 0.27.0 (owner-directed, same day).** The refutation condition did
   not fire: the identical battery on 1.62.1 reproduced the identical result —
   corpus green, all three determinism-family brackets green, 24/24 metal runs
   on `bear-and-bees` on both versions. Nothing moved that the baseline can
   see. The 1-in-6 lead itself remains open on both backends; the changelog
   carries the counts.
3. **Dispose the harvest queue** in `docs/working-plan.md`, verifying each
   item's grep before writing. Done when each of the nine rows is written,
   refuted, or explicitly declined. Wrong-premise if a second sampled gap claim
   fails, which would mean the extraction's precision is too low to route from
   without full re-derivation.
   **DONE 0.25.0 (`e83fc64`)** — all nine written, greps re-verified first,
   the two fence-priced helpers declined at two instances. The wrong-premise
   condition did not fire: a second claim *appeared* to fail (`proud` absent
   from `materials.md`) and the failure was the verifying grep's own
   case-sensitivity, not the extraction's — the file says `PROUD`.
4. **Ship `smoke.js --dump-frames`.** Done when a failing determinism arm writes
   the two disagreeing frames and the bracket shows the verdict unchanged. Three
   builds each hand-built this; a fourth doing so refutes nothing but confirms
   the cost.
   **DONE 0.26.0** — `bracket-readback.js`'s artifacts arm pins exactly the
   stated condition: both PNGs written, verdict class unchanged, observed
   MISSED against the pre-change tree.
5. **Route a situated reference from the instrument that creates the need**,
   under `docs/plan.md`'s new cost-table row. Done when a determinism failure
   names `webgpu-stack.md` and its section, with a red-first arm proving the
   pointer appears without the verdict moving. Refuted if the next analysed
   build still does not open it — which would mean the pointer is not the
   binding constraint and the finding was wrong.
   **DONE 0.26.0** for the determinism instrument, both failure texts, section
   named, path resolved against smoke's own location so it works from the
   install cache; the red-first arm is in `bracket-readback.js`. The
   refutation half stays open by construction — it can only be settled by the
   next analysed build.
6. **Run the next cold build one tier DOWN** from the last configuration that
   shipped clean, same brief. Done when the result is recorded either way. This
   is the only measurement that can show the loop working; four builds so far
   give one point per configuration and no descent is demonstrable.
7. **Nothing watches the work-next row.** It was stale within hours of being
   written, and it is the row a session reads first. Open question rather than a
   proposal: no mechanical form is obvious, and a check that cannot tell a stale
   queue from a correct one would be worse than none.
