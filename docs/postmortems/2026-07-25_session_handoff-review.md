---
mode: session
scope: handoff-review
date: 2026-07-25
summary: Reviewing another agent's handoff found two live defects nobody was looking for — a shipped code comment naming an extent check that does not exist, and film-reviewer gating two phases from outside the plugin where no installed user can reach it — and reversed a recommendation that was about to be acted on.
artifacts:
  - plugin/skills/mitate/templates/smoke.js
  - plugin/skills/mitate/templates/scene.character.template.html
  - plugin/skills/mitate/references/instruments.md
  - plugin/skills/mitate/references/method.md
  - docs/plan.md
  - docs/working-plan.md
  - docs/predecessor-record.md
  - docs/source-of-truth.md
  - site/app.js
  - the local prototype directory (local)
  - references/style-3d.md (historical — renamed since)
  - 7250546
  - 8022f49
---

# Postmortem: the handoff-review session (2026-07-25)

**Scope:** session mode. Evidence base is this conversation plus the artifacts it
produced — mitate commits `7250546`..`8022f49`, two dotfiles commits, one
settings change, and the path-privacy wrapper regeneration.

**Stated task at the start:** *"think through his findings and thoughts and get
your thoughts to brainstorm"* — a review of another agent's handoff after it
built a 60-second character film.

---

## 1. What went well

**The one code change was bracketed four ways before shipping, and one control
earned its keep by proving a fix that would otherwise have been cosmetic.**
`7250546` added the live-playback check to `smoke.js`. Controls: chain never
starts, first frame throws, frozen clock, and a guarded loop swallowing a
throwing `seekTo`. That fourth one isolated the count-after-inner-returns
ordering fix — the old wrapper counted 71 attempts and passed blind; the new one
reports 0 and fires. Without it the reordering would have shipped as an
unverifiable tidy-up.

**Verifying handed-down claims rather than accepting them found two live defects
that nobody was looking for.** `solveShot`'s camera-floor comment
(`scene.character.template.html:807`) asserts "the extent check in smoke.js is
what catches it"; there is no extent check — zero `Box3`/`setFromObject`/
`computeBoundingBox` anywhere in `templates/`, and `subjectExtent` (`:763`) reads
declared values only. Separately, `film-reviewer` is a gate criterion at
`plan.md:460` with the best measured catch record in the project, and it lives
outside `plugin/` where no installed user can reach it. Neither was in the
handoff; both surfaced from checking adjacent claims.

**Checking before cutting reversed a recommendation about to be acted on.** I was
going to advise removing the `uv`/`bun` bullets from global CLAUDE.md as
redundant with the dev-conventions SessionStart hook. That hook keys on
`package.json`/`pyproject.toml`/`bun.lock`; mitate has none at root, so it never
fires here and those globals were the only thing specifying bun all session.
Recorded in dotfiles `c0df94e` so the next person does not re-propose it.

**Interpretation for the pending control was fully committed before the data.**
`84bfe2d` (three film classes, two revert expressions), `6ed2ff1` (viewer
readings plus scope drift), `8022f49` (the nocap discriminator, scored in three
states). The session's own record shows this is the first time in the thread
that fixing the interpretation preceded the result rather than followed it.

---

## 2. What did not go well

**The pattern first, because it is the finding: four claims went out as
confident assertions that were actually inference, in a session whose entire
subject was that failure mode.** Each was caught by someone else or by a
measurement, not by me before publishing.

**Review-loop arithmetic was wrong in the opposite direction from the claim it
was correcting.** I argued capture was ~2% of the loop and process reuse was the
lever worth ~10x. Measured: `build.js sheet` is 1.8s on `WEBGPU=metal`, boot is
238ms, capture is roughly half. I took the ~4s shader-compile figure out of the
handoff and applied it per-invocation without checking it described the cold /
fallback regime. *Structural version: I inferred from a number without
establishing which conditions produced it — the same error the session was
cataloguing in someone else's work.* Mitigating, and worth stating honestly: I
hedged the arithmetic as "not a stopwatch" and asked for exactly the measurement
that settled it, which is why it cost one exchange rather than a doc.

**I claimed the interactive viewer needed a prime-directive amendment.**
Overstated. `build.js aspect` (`templates/build.js:468`) renders one `t` at four
window shapes, has always done so, and has never been called a determinism
violation. The precedent was in the repo; I asserted before looking. The owner
pushed back and was right.

**I argued the Co-Authored-By CLAUDE.md rule was not redundant with the
attribution setting, on "different actors" grounds.** Wrong — the system-prompt
instruction to append those trailers *is* the attribution default being
injected, so emptying the setting removes the behaviour at source. Corrected in
dotfiles `131754f`.

**Track D's carrier count was understated roughly 4x.** I wrote "2 × 3D
templates" for a `SOLVER` change. Fences are carried by both templates, all five
examples, and the site's neon variant — 8 files for `SOLVER`, 9 for `KERNEL`.
Corrected in `2fcdcbc`. Found only because I was prompted to look at it, which
means the error class was not self-caught.

**The `film-reviewer` routing recommendation flipped after being committed.**
`f96c38c` recorded opt-in citing the retired always-on reflection rule as
precedent; `0f187ed` flipped to prescribed because that precedent does not
transfer — the retired rule fired on every task from global CLAUDE.md, while
step 3 fires only inside a film build. My second argument (a default reviewer
erodes the author's own looking) died on placement rather than population: the
saturation trigger cannot be reached without having looked.

**Cost sink.** `docs/working-plan.md` reached 683 net insertions across eight
commits (`524d537`..`8022f49`), and a material share of that was re-deriving
items already present in `predecessor-record.md` — `probe` has an ancestor
(`build.js kinematics`, bracketed), `subjectFromObject` has one, `txt()`/
`strip=text` has one, and the spine itself has one. The ancestry table in
`aae92df` exists because that re-derivation happened first and was noticed
second.

> **ANNOTATION 2026-07-25 (later same session): there is a fifth instance, and
> it is the worst of the set — because I had a control that contradicted the
> claim and published the claim anyway.**
>
> I wrote into `instruments.md` that the live-playback check is blind to a host
> that replaces the loop *and* swallows `seekTo` exceptions, citing a handed-down
> measurement of 71 calls / 71 distinct `t`. **My own control D had already
> disproved it.** `ctlD_guarded.html` was exactly that shape — a throwing
> `seekTo` under a guarded loop — and it reported `drove seekTo 0 time(s)` and
> fired. I ran it, read the output, used it to justify the counting-order fix,
> and then wrote the opposite into the ledger because someone else's number was
> more specific than my own result.
>
> Re-verified from a self-contained harness
> (`a local prototype's bench harness`): all four rows
> fire — unmodified 20/20 playing; loop throw, `seekTo` throw, and swallowing
> host all 0/0 frozen. Corrected in 0.16.2.
>
> *Structural version, and it is sharper than the one in the body: deferring to
> an external number over a control you already ran is not inference — it is
> discarding evidence.* Instances 1-4 were inference in the absence of a
> measurement; this one is inference **over** a measurement.
>
> **The rule has a sending half, and it is the more actionable one** (from the
> other agent, taking their share): the number that beat my control was
> published as "calls=71, distinct=71, PASSES" — with confidence, in a table,
> and *without its method*. Had it said "counted before the inner call
> returns," the defect was visible in seconds, because the ordering **was** the
> defect. A bare number outranks a local result precisely because you cannot see
> where it is soft. So: **receiving** — an external number without its
> conditions does not outrank a control you already ran; **sending** — state the
> conditions or the number gets trusted past its warrant. Added to
> `source-of-truth.md` as the other half of the existing "with a date"
> requirement on measured brackets.
>
> **And this is the observed failure mode of a long two-agent thread, which is
> not the one either of us predicted.** The risk raised earlier was mutual
> concession converging somewhere neither would choose alone. What actually
> happened was narrower and more specific: one party discarded good local
> evidence to accept the other's assertion. Worth recording as the real shape.
> Three things recovered it. **Two were by design; the decisive one was luck** —
> *corrected here from an earlier draft of this annotation that claimed all
> three, which was flattering and false.* The control had been run and the
> interpretation was pre-registered, both deliberate. But the bracket was **not**
> re-runnable by design: it depended on scratch files that had already been
> deleted. It became re-runnable because the owner asked for the prototype to be
> moved, organised, and stripped of anything stale — and that third instruction
> is what made someone open the harnesses and find two of them broken. They could
> as easily have been deleted as fixed.
>
> So a housekeeping request produced the arbiter that caught a false claim in
> shipped content. The actionable version is small and belongs at authoring time,
> where it costs a minute, rather than in a cleanup pass that may never come:
> **a bracket that cannot be re-run from a clean checkout does not get recorded
> as a bracket.** Same shape as the conditions rule — a claim you cannot
> re-derive is a claim trusted past its warrant, whether the gap is in its method
> or in its reproducibility.
>
> One mechanism finding attaches to it, from the other agent: the original
> bracket could not be re-run because it depended on deleted scratch files.
> Rebuilding it self-contained is what refuted the claim. **A measurement that
> cannot be re-run is an assertion with a number attached** — which strengthens
> forward item 5 (`test-audit`): the trigger is not only two green-but-blind
> escapes, it is that the brackets themselves were not re-runnable.

> **ANNOTATION 2026-07-25: a third defect in shipped docs, found the same way.**
> `method.md` cites `style-3d.md` at `:19`, `:146` and `:244` — a predecessor
> filename absent from both the repo and the 0.16.0 install cache. Fourth
> instance of the verbatim-copied-reference class (after 0.14.0, 0.15.0,
> 0.16.0), and the first found by an agent *following* the pointer rather than
> by an audit. Section 4's finding needs widening: `doc-claim-auditor` has one
> class it structurally cannot see (claims in code) **and** one it can see and
> was never pointed at (a reference citing a nonexistent file). Both converge on
> the same root — `source-of-truth.md` says drift detection is "scheduled, not
> heroic," and it is not actually scheduled. Fixed in 0.16.2.

---

## 3. Deviations from the plan

The "planned" column is the task as stated at the start: brainstorm on a
handoff.

| Planned | Shipped | Verdict |
|---|---|---|
| Read four handoff docs, give a view | Same, plus independent verification of ~15 claims against the tree | **Better than planned** — verification produced two defects the handoff did not contain |
| Brainstorm only, no code | One release (`0.16.1`): `smoke.js` live-playback check, `site/app.js` fix, `instruments.md`, full version cascade | **Scope grew, at owner direction** — the user redirected mid-turn ("Please address §3.1 then") |
| Discuss the interactive viewer | Reframed as Phase 6 arriving early; `plan.md` scope fence amended and owner-approved | **Better than planned** — connected to an existing phase and gate rather than treated as a new feature |
| (not in scope) | `docs/working-plan.md`, ~900 lines, plus `plan.md` amendment | **Scope grew** — justified by the volume of findings, but the doc was rewritten eight times |
| (not in scope) | Global CLAUDE.md cleanup, `attribution` settings, path-privacy 0.6.2 → 0.7.2 regeneration | **Adjacent, user-directed** — each was asked for explicitly |
| (not in scope) | Pre-registration of a control this session will not see the result of | **Correct call** — the fixture was about to evaporate |

---

## 4. Escapes (tests)

**Live playback was never executed by any instrument.** All three tooling page
loads carry `?record=1` (`shoot.js:131`, `smoke.js:292`, `smoke.js:338`) and all
three templates gate the rAF loop on that flag's absence. Which test should have
caught it: none existed — **missing, not blind.** True of all five shipped
examples at the time. Now covered, and the new check carries its claim:
`instruments.md` states what it catches, what it cannot see, its brackets, and
the four controls.

**`site/app.js` swallowed `seekTo` exceptions at two sites.** Which test should
have caught it: none can reach that path — smoke loads standalone (where the
chain dies), and the shipped-frame check runs under `?record=1`. Measured: the
same injected fault reads 0 calls standalone and 71 calls with 71 distinct `t`
under a swallowing host. **Green-but-blind, structurally.** Note what the fix
is and is not: a `console.warn`, not a check. **The host path still has no
test.**

**The false extent-check comment.** Which check should have caught it:
`doc-claim-auditor` exists and names this exact defect class — but it audits
reference docs against code, and this defect is *in* code. Its remit does not
reach comments. **Second instance of the class**; the first (the `nodeFrame`
guard's "smoke fails loudly" comment, false for the `_nodes`-removed path) was
caught by a five-agent code review, also not by a test.

**Tests added this session: one.** It carries a recorded claim in the sense the
provenance rule asks for — `instruments.md` states what breaks if it is deleted
(a film that records perfectly and never moves for a viewer ships green).

**Trigger reached:** two green-but-blind escapes in one session (record-gating,
host path), which is the stated threshold for running `test-audit` over the
whole `smoke.js` suite. Recorded as forward item 5.

---

## 5. Forward items

1. **Re-check the path-privacy wrapper after 0.7.3.** mitate's wrappers are
   stamped 0.7.2; 0.7.3 is now the newest installed. Run `install-git-hooks.sh
   --doctor`. *Done if:* doctor exits 0 and reports the wrapper current.
   *Refuted if:* it flags the wrapper, in which case re-run the installer.
2. **Score the control against the committed key**, not against a reading formed
   after seeing it. *Refuted if:* the result is class 1 only or nothing — then
   the prescription recorded in `docs/working-plan.md` A0 is wrong and step 3
   gets offer-it wording instead.
3. **Land A2 (`build.js transitions`) before the `SKILL.md` step-3 edit.**
   *Refuted if:* step 3 is edited first, which contradicts the plan's own
   edit-that-paragraph-once argument and will require a second pass.
4. **Record whether the reviewer measured or asserted.** *Done if:* the report
   states which instruments it ran. *Consequence:* if it inferred determinism
   from source, the prescription case weakens regardless of the yield count.
5. **Run `test-audit` on `smoke.js`.** Trigger already met (finding 4). *Done
   if:* every check in `smoke.js` has a recovered claim and a verified oracle.
   *Wrong-premise if:* the audit finds the two escapes were the only blind spots,
   which would mean the trigger threshold is too sensitive for this suite.
6. **Verify `the local prototype directory` survives.** *Refuted if:* it is lost —
   the bracket expressions and answer key survive in `docs/working-plan.md`, but
   the reproducer use for the open 1-in-6 `WEBGPU=metal` determinism FAIL does
   not.

---

## Routing

- **Memory candidate:** nothing new. The session's durable lesson — a practice,
  decision, or tool unreachable from where work happens does not exist — is
  already written into `docs/working-plan.md` as the spine's parent clause,
  which is a better home than memory because it ranks the plan's items.
- **CLAUDE.md candidate:** none proposed. The two repo-invariant candidates
  (fence carriers span `examples/` too; the cross-directory parity rule) are
  already stated in `plan.md`'s 0.6.0 post-gate note — the failure was not
  reading it, not its absence.
- **Hook candidate:** the code-comment sweep (grep for comments asserting a
  check exists — "smoke", "catches", "throws", "fails loudly" — and verify each)
  is mechanical and has two known instances. Recorded as item 6c in
  `docs/working-plan.md`; a hook is premature until the sweep runs once and
  shows how many there are.
- **Roadmap:** all six forward items above are already in `docs/working-plan.md`
  except item 5 (`test-audit`), which is new here.
