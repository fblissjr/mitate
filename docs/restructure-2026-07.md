last updated: 2026-08-01

# Restructure plan, 2026-07

> ## Current position
>
> **R0 MET** (0.16.30) · **R1 MET** (0.16.31) · **R2 FULLY MET** — its deferred
> half (a shipped `plugin/agents/` reaching a real install cache) was verified
> after PR #2 merged: the cache holds `agents/film-reviewer.md`, holds no `docs/`
> or `scripts/`, and is byte-identical to `main`'s plugin subtree ·
> **R3 MET (0.16.40)** — all five items done, and the cold-start run closed the
> last gate clause. A fresh zero-context agent reached R4 in **one hop and ~24
> lines**, read no superseded document unwarned, and independently proposed the
> same reordering recorded below. The `CLAUDE.md` byte clause was retired by
> owner call in favour of "no rule lost, no line unearned".
>
> **R4 MET and MERGED** (PR #3, `517a928`). All of R4 is done: 4.1 (0.16.54),
> 4.2 + 4.3 (0.16.41, corrected 0.16.42), 4.4 (0.16.43), 4.6, 4.7. Partial: 4.5
> (0.16.45 — fixture tracked, most rows still UNVERIFIED), not gate-blocking.
>
> **NEXT: the rest of R5. R5.1 is PARTLY DONE (0.16.62) and the reason it is only
> partly is the useful part.** Its two verifiable items shipped: the
> `setCamera(state)` seam across 8 carriers, and the `gaitPose` `rootX` hazard,
> which was reading mutable scene-graph state in 5 of 7 call sites.
>
> **`hide(obj,u)` and `subjectFromObject` were deliberately NOT promoted**, and
> the survey that stopped them is worth reading before anyone re-scopes this:
> neither exists in the tracked tree at all, and the ledger evidence for both
> lives in a local prototype `(local)` rather than in the corpus.
> The triggers do still fire (two spellings is drift), but the ledger's count for
> the presence idiom was **×7 against an actual ×11**, and four of its rows cite
> that same local-only film. All are now labelled `(local)`. Promote them as
> separate changes with their own red, not as a bundle.
>
> Also still open in R5: `references/breakdown.md`, `build.js check`, and the
> kinematic-body amendment to the bake proposal.
>
> **Phase R's first unit is also done** (0.16.61, separate PR) — the determinism
> trio, including the `!fails.length` guard this plan had recorded as blocked on
> a red-able fixture that did not exist. It exists now.
>
> **This paragraph said "Next: R4.5" and "Untouched: 4.1, 4.7" while the same
> block reported all three done 100 lines below.** That is the second time this
> exact defect has been fixed in this block in one day — `97b12d7` fixed it in
> the morning, and `d4e6434` re-created it by APPENDING a new dated section
> instead of updating the top. **A dated block appended to a stale summary does
> not correct the summary; it buries it.** `docs/README.md` routes "what should I
> work on next" straight here, so a zero-context session reads the top and starts
> the wrong tier. If you close a gate, edit this paragraph — do not only append.
>
> **R4 — the harness, seven items.** Its cheapest was also its most
> alarming gap: `build.js` and `shoot.js` had **zero** brackets between them.
> `build.js` gained `bracket-commands.js` at 0.16.41; **`shoot.js` still has
> none**, which is what that sentence means today.
> **Do R4.2 + R4.3 first** — the harness tier needs nothing from the `checkScene`
> extraction, and R4.1's gate (byte-unchanged `smoke.js` behaviour) is the
> expensive one. **R4.4-R4.7 are new (owner-directed 2026-07-30)**, all four about
> not paying a cost twice: `--parity-fix` stops the same *work* being repeated
> (4,611 lines held identical by hand); the defect corpus stops the same
> *mistakes* being repeated; retention stops the same *thinking* being repeated —
> a design question raised this session was recorded nowhere and had to be
> recovered; and grading the portfolio stops the same *question* — what do I build
> next — being re-derived from scratch. R2 items 1-7 landed across
> 0.16.32-0.16.34, 8 retracted, 9 trigger-gated on a fifth bracket of one family.
>
> **2026-07-31 — the harness tier's first unattended run, and what it cost to
> read it.** Three defects, all fixed in 0.16.42: the bracket's encoder table
> named ffmpeg for 2 rows when 9 need it (so five working verbs reported FAIL);
> both workflow bracket loops hid every bracket after the first red; and the
> failure tail printed the interpreter banner instead of the error. Reading that
> failure opened a larger question — **ffmpeg is an export utility, not a core or
> validation dependency, and this repo's prose says so while its code does not.**
> Measured: CI runs with no ffmpeg on PATH and `smoke.js` reports `all scenes
> pass`; of 10 encoder call sites only 4 serve export, 5 are review stills and 1
> is a measurement that writes no file. **New work lives in
> `working-plan.md` Track E**; the retention record is R4.6; the corrections are
> on R4.3 and R4.4 below.
>
> ### Handoff, end of 2026-07-31 — start here
>
> **THE MERGE BLOCK IS LIFTED.** A `/code-review high` over `main...HEAD`
> returned 15 findings; **all 15 are closed** — 0.16.47 (write path 1-4, and the
> bracket weaknesses 10-11), 0.16.48 (silent coverage loss 5-6), 0.16.49 (false
> claims 7-9), 0.16.50 (controls that did not control, 12-15). None deferred,
> none argued away.
>
> **If you develop this repo on a machine that installed the pre-commit hook
> before 0.16.45, `selfcheck.js` will now tell you so** — it was running the
> two-glob parity command and checking one directory less than it claimed. Run
> `./scripts/install-hooks.sh --force`.
>
> `--parity-fix` is safe to run. It checks writability as part of validation,
> inspects all seven fences in every target rather than the ones the source
> happens to carry, refuses `--parity-only` alongside it, and refuses `--from`
> without it.
>
> **Every fix was watched red first and then mutation-tested** — guard
> neutralised, its own arm confirmed red again. That step falsified three claims
> written in the same sitting: a `says` regex that could not cross a newline, a
> comment naming the wrong guard for a `bash -e` property, and a Map audit that
> found five more misses than the review reported. Writing a check is not the
> measurement; running it against a deliberately broken version is.
>
> **Next: R4.1, the only gate clause still open.** Finding dispositions in
> `working-plan.md`, first section. **(Closed 2026-08-01 — see the GATE R4 IS
> MET block below.)**
>
> **Shipped:** 0.16.42 (three harness defects) · 0.16.43 (**R4.4**,
> `--parity-fix`) · 0.16.44 (`CONTRACT` becomes the seventh fence, carrying a
> false-claim correction into all 8 scenes) · 0.16.45 (**R4.5**, defect corpus
> tracked at `fixtures/defect-corpus/`) · 0.16.46 (tiered harness tally). Plus
> `/extract-patterns`, the flywheel's extraction half, in `.claude/skills/`.
>
> **The gate ran green on all of it** (`workflow_dispatch`, since branch pushes
> do not fire it — see R4.3's correction).
>
> **Gate R4 clause 1 is MET** — observed in CI run 30672205795, not inferred
> from a local run. **R4.7 is DONE** (portfolio graded in `plan.md`).
> **R4.6's cold-start clause is MET** — two zero-context agents, two recorded
> design questions, both reached; the routing gap they both hit is fixed in
> `docs/README.md` (see the box at the end of this section).
>
> **Only R4.1 remains: extract `checkScene`.** Its baseline was re-taken
> 2026-07-31 and the old one was wrong — four advisory warnings, not one. Start
> it fresh, and re-capture the baseline on the machine and backend you will
> compare against.
>
> **SUPERSEDED — R4.1 is done (0.16.54); see the 2026-08-01 block below.** The
> re-capture advice held up in practice: the baseline was taken fresh on this
> machine and matched the recorded four warnings, which made it a verification
> rather than a citation.
>
> ### 2026-08-01 — re-verified, and the PR opens BEFORE R4.1
>
> The four clause verdicts above were checked against their evidence rather than
> re-read: run 30672205795 fetched and its tally compared line-by-line against
> the block quoted below (matches), `bracket-parity.js`'s refusal arms
> enumerated, `plan.md`'s nine rows counted, and `checkScene` re-measured at 594
> lines. **All four hold.** Four smaller claims around them did not, and are
> corrected in place: the parity arm count (twelve → eighteen), the corpus's
> ten-vs-twelve, `BUILT` missing from the reach legend, and "all identical" for
> the `Open question` convention.
>
> **Owner call: open the PR now, and land R4.1 inside it.** `gate.yml` fires on
> `pull_request` and on every push to an open PR, while `push` is filtered to
> `main` — so this branch has had exactly **one** gate run in its life, by hand
> dispatch. R4.1 refactors the gate instrument itself, which is the change that
> least deserves to run unwatched. Opening the PR first is what puts it under the
> gate, and that is this branch's own lesson (see R4.3's amendment) applied
> before rather than after the fact.
>
> ### 2026-08-01, later — GATE R4 IS MET, and R5 is untouched
>
> **The document does NOT retire here.** Its rule is "delete when R5's gate is
> green", and all four R5 items are unstarted — verified against the tree, not
> read off this plan: `setCamera(t)` is still the signature in every carrier,
> `references/breakdown.md` does not exist, `build.js` has no `check` verb, and
> `physics-bake-proposal.md` contains no occurrence of "kinematic". Gate R5 also
> depends on the Regression-by-edit case, which its own text calls untested.
>
> **On clause NUMBERS: do not use them.** The gate paragraph below defines its
> clauses in a different order than the PR table lists them, so "clause 5" names
> the `smoke.js` clause in one place and the cold-start clause in the other — and
> those are the strongest-evidenced and weakest-evidenced clauses in the set.
> Name the clause, never its index.
>
> **R4.1 is done (0.16.54).** `checkScene` finishes at **155 lines**, from 594.
> Stage 3 took the setup block and the determinism trio; C4 and C5 (0.16.53)
> closed the two pieces of debt stages 1-2 created, in that order, per the
> stopping rule.
>
> **The byte-unchanged clause is met end to end, not just per-stage.** Each stage
> was gated as it landed, but the clause is about the extraction, so it was also
> run end to end: `ee92780^`'s `smoke.js` — the last pre-extraction copy — against
> the current one, same machine, same backend, same 9 scenes. **Byte-identical**,
> reproduced independently a second time on a correctly pinned workspace. Only
> the four R4.1 commits touched `smoke.js` in that range, so the comparison
> isolates the extraction and nothing else.
>
> **The method has a limit, found by auditing it rather than by trusting it.**
> Equality over the corpus is only as stable as the corpus, and
> `after-hours.html` is intermittently nondeterministic — see `working-plan.md`
> bucket D. So a single equality run can differ for a reason that has nothing to
> do with the change under test, and a green one is weaker evidence than it
> reads. Two independent green comparisons and ~18 further full-corpus runs is
> what this clause actually rests on; one run would not have been enough, and
> every earlier stage gate on this branch WAS one run.
>
> **A green diff was again not treated as sufficient, and for stage 3 it is the
> weakest oracle in the file.** The trio emits nothing on an all-green corpus, so
> an extraction that orphaned one of the three would produce identical output.
> Each of its three assertions was forced true in turn: all three fired on all 9
> scenes with the exit code flipping. That is what says they are still wired to
> the verdict.
>
> **New control: `templates/bracket-driver.js`**, 10 arms, 8 needing no browser.
> It is the first bracket over `smoke.js`'s own structure rather than over a
> scene property — which it has to be, because every guard C4 and C5 added fires
> only on a smoke.js bug and is therefore invisible on a healthy tree.
>
> **Two Bun engine behaviours were found by that bracket and both changed code**,
> which is worth reading as a pattern rather than as trivia:
> `Function.prototype.toString()` returns a re-print of the parsed AST, not
> source text, so the first mutant written to prove an arm red came back
> **green** — Bun had normalised the mutation into the very shape being looked
> for. And it merges adjacent `const` declarations, which false-redded the new
> guard the moment `checkDeterminism` was written. Neither was findable by
> reading; both took a control that ran.
>
> **One thing is recorded and NOT resolved:** `after-hours.html` failed
> determinism once during a reachability run and did not reproduce in ~19 further
> runs across both the pre- and post-extraction copies. It is the fixture
> imported to reproduce the open 1-in-6 `WEBGPU=metal` failure, so that is the
> likely reading — but one event characterises nothing, and it is filed as
> `working-plan.md` bucket D item 7 rather than attributed.
>
> **What was left for Gate R4, in the order it was done:**
>
> 1. ~~**`poster` + the three tilers move off ffmpeg**~~ **DONE (0.16.51), with
>    Track E0's ratchet landed first so the migration is proved rather than
>    asserted.** All four run through `build.js`'s `tileStills` — one in-page
>    tiler replacing five call sites. The downscale stayed (5.3x supersampling
>    *is* the antialiasing; native 90px is aliased at 44.8% against canvas's
>    59.9%); only the scaler moved.
>
>    **Measured on a PATH with no encoder:** the review tier went from
>    `0 exercised / 5 skipped` to **`4 exercised / 1`**, and the encoder ratchet
>    from **10 sites to 5**. With encoders present all 17 harness rows still pass
>    and `smoke.js` reports all scenes pass.
>
>    `motion` was carved out by name and stayed carved out — it needs its scale
>    re-established, not ported, which is a different job.
>
>    **GATE CLAUSE 1 IS MET, observed in CI rather than inferred.** Run
>    **30672205795** (`workflow_dispatch`, 2026-07-31), the WebGL2-fallback gate
>    job, on a runner with no encoder installed:
>
>    ```
>    poster   ok  exit 0, tiny.jpg written
>    sheet    ok  exit 0, tiny.sheet.jpg written
>    aspect   ok  exit 0, tiny.aspect.jpg written
>    strip    ok  exit 0, tiny.strip.jpg written
>    motion   SKIP  ffmpeg not on PATH
>    core     4 exercised,  0 skipped
>    review   4 exercised,  1 skipped
>    export   0 exercised,  4 skipped
>    ```
>
>    Every core and review verb exercised except `motion`, carved out by name,
>    with export reported as deliberately skipped. That is the clause, verbatim.
>
>    **This paragraph first said the clause was met from a LOCAL run, and it was
>    not.** `gate.yml` fires on `main`, `pull_request` and `workflow_dispatch`
>    only, so every prior run on this branch was `static` — which globs
>    `scripts/`, while `bracket-commands.js` lives in `templates/`. The review
>    verbs had never executed in CI at all, before or after the migration, and
>    "it would run" is precisely the inference item 1's own correction above says
>    to stop making. It was made again anyway, one screen below where it is
>    written down. The dispatch cost five minutes.
> 2. ~~**R4.7 — reach grades** on `plan.md`'s nine portfolio cases.~~ **DONE
>    (`70051bf`).** All nine carry a grade, read off the tree rather than off
>    memory, each unbuilt case with one line on what blocks it and what was
>    checked.
>
>    **The legend defines `in reach`, `near` and `beyond` — and not `BUILT`,
>    which two rows carry.** That is coherent (a built case has no reach left)
>    and undefined, so define it the next time that table is touched rather than
>    leaving a reader to infer a fourth grade from two instances.
> 3. ~~**R4.6's cold-start test.**~~ **RUN 2026-07-31, clause MET (`a9b5d7d`).**
>    Two zero-context agents, two recorded design questions, both reached without
>    being told where to look. The box at the end of this section carries the
>    detail, including the routing gap both hit and the `docs/README.md` row that
>    closes it.
>
>    **This is the only gate clause with no re-runnable artifact.** It rests on
>    the report of the session that ran it, and a re-run is a fresh experiment
>    rather than a verification of that one — the agents cannot be un-told what
>    the second run would tell them. Weigh it as a passed experiment, not as a
>    standing check. The half that *is* checkable holds: the router row exists,
>    and `Open question` is a real convention.
> 4. ~~**R4.1 — extract `checkScene`.**~~ **DONE (0.16.54), 594 → 155 lines.**
>    Its gate was byte-unchanged smoke verdicts, met per-stage and end to end —
>    see the block above.
>
>    **BASELINE, RE-RUN 2026-07-31, and it corrects this block.** This said "all
>    9 scenes pass, with one `warn` on `menagerie.html`". All 9 do pass, but
>    there are **four** advisory warnings, on four different files:
>
>    ```
>    all scenes pass
>    4 advisory warning(s)
>      warn scene.character.template.html  exposure: crushed — 54.7% near black
>      warn menagerie.html                 exposure: crushed — 50.6% near black
>      warn scene2d.template.html          exposure: low dynamic range — 2.0 points p05..p95
>      warn scene.template.html            exposure: crushed — 44.7% near black
>    ```
>
>    A refactor checked against "one warn on menagerie" would have accepted the
>    silent loss of three others — the gate would have passed while the
>    instrument got quieter, which is this repo's recurring failure wearing a
>    fresh coat.
>
>    **The baseline is backend- and machine-specific and must be re-taken, not
>    cited.** Eight of the nine reported `[source, webgpu]` on the machine that
>    ran it; CI's default is the WebGL2 fallback, and the exposure percentages
>    above are pixel measurements that need not agree across backends. The gate
>    is *same machine, same backend, before vs after* — capture it immediately
>    before starting the extraction rather than reusing this block.
>
> **Not gate-blocking, but open:** ten of the corpus's twelve defects are
> unmeasured and labelled UNVERIFIED; `bracket-corpus.js` does not exist so
> nothing runs the corpus; `bracket-noise.js` false-reds on macOS (passes on the
> Linux gate); and `/extract-patterns` has no bracket and has never been run —
> pointing it at `bear-and-bees.html` is the cheap first exercise.
>
> **While this document is open it is the live queue**, and
> [`working-plan.md`](working-plan.md) is the standing backlog it executes
> against. A fresh session found the live queue only by reading `git log` commit
> prefixes; that is what this block is for.

A one-time migration plan. **This document is disposable**: when the last gate
below is green it gets deleted, and the CHANGELOG entries it produced are the
permanent record. Dated in the filename so it sorts with the postmortems and
cannot be mistaken for standing doctrine.

It covers `internal/`, `docs/`, `plugin/`, `.claude/`, `scripts/`,
`.github/workflows/` and the gates.

**`site/` is out of scope for restructuring** (owner's call, 2026-07-30) and
**in scope for truth** — meaning only that it should not say false things about
the code, which is the bar for anything public, not a special status.

**It is a side thing, and this plan previously said otherwise.** Owner,
2026-07-30, correcting an earlier reading: *"site is like a side thing. It should
work, but it exists to show people what this project is in a visual way. THAT'S
IT. The whole site folder is for the website that just is a glorified readme.md
with examples of scenes."* An earlier version of this paragraph promoted it to a
**"capability-claim surface"** and a **"vision carrier"** — two load-bearing
roles it does not have. The vision lives in `VISION.md`; the site shows people
what the thing looks like. It stays in this repo; the split question is settled
below.

## The finding that organizes all of it

Every problem found in this pass is the same problem: **a fact stored in more
than one place, where nothing checks the copies agree.**

- A verification criterion in four places, and the copies now disagree
  (`sample.yml:11-12` versus `:35-38`).
- A capture primitive in five consumers, two of which never got the fix.
- `backend.js` in three copies. (A companion claim here — that core symbols were
  63-75% grep noise — was **retracted**; see R2.5. It was measured with the wrong
  tool.)
- A contact constant whose only provenance is a tool that does not exist.
- Postmortems cited from shipped content and reachable from one machine.
- Two subjects and two evidence grades under one provenance header.

The repo already has the correct rule — [`source-of-truth.md`](source-of-truth.md),
*every fact has one home and everything else points at it* — and unusually good
instruments for enforcing it **in prose and in scene code**. It was never
extended to CI config, session logs, dev scripts, or local working copies. That
is exactly where it failed.

So the ordering principle for everything below is:

> **truth → reachability → structure → capability.**
> Fix what is false. Make the falsehood unrepeatable. Make what exists
> reachable. Then move things. Then build.

Restructuring first would move lies into tidier folders.

## What executing R0-R2 changed about the plan

Recorded because the plan was written before any of it was known, and a plan
that does not absorb its own execution is the next stale document.

**1. Guarding a copy is weaker than not writing it.** The model here was *find
each copy, write a check that guards it*. That is O(n) in copies, and each check
is one more artifact that can be wrong — five were, all in one way (below). The
durable move is to **delete the copy**. `CLAUDE.md` asserted "9 references" while
`selfcheck` derived the same number on every run; the assertion was wrong within
one commit of being written. It is gone rather than corrected, along with three
other counts. **New rule, home in `source-of-truth.md`: never hand-write what a
command produces.** Prose carries rules and rationale — those are not derivable
and do not rot the same way.

**2. A check must be run and read before it becomes a gate.** Five specs shipped
wrong first, every one failing to distinguish *carrying* a thing from
*describing* it: the citation check fired on a comment quoting a bad citation,
the `last_verified` check on the header explaining its removal, and three
variants of the seek check condemned correct files including a deliberate
control. Text matching cannot separate use from mention. Running a new check
against the tree and reading every hit costs one command and would have caught
all five.

**3. The always-loaded surface is the expensive one, and this plan grew it.**
`CLAUDE.md` 178 → 224 lines and `SKILL.md` 278 → 326 during R0-R2 — 94 lines
added to the only two files paid for on every session and every activation. That
is now R3's first item.

**4. Cold-start testing is cheap and finds what review does not.** A fresh agent
with no context, asked "what should I work on next", found nine orientation
defects in one run — most of them created during R2 while nominally fixing
orientation. **Run it at the end of R3 and again at R5.** It converts "is this
working" from an argument into a number, and the number that matters is not the
defect count but the *self-inflicted* share of it.

## Where each kind of thing lives (decided)

| kind | home | rationale |
|---|---|---|
| why the project exists, and why determinism is first | **`VISION.md`** (repo root, new) | the frame above everything; public; first read after `CLAUDE.md` |
| invariants that bite on first edit | `CLAUDE.md` | **always-loaded — every line is standing cost on every session.** Present tense only; no history, no count a command derives. R3.1 trims it |
| what it does, install, layout | `README.md` | user-facing, read-on-demand. Needs a trim, but it costs nothing recurring — R3.3, after the always-loaded pair |
| **which doc answers which question** | **`docs/README.md`** (new) | the router; a pointer table, never a summary |
| architecture and phase gates | `docs/plan.md` | loses goal-framing to `VISION.md`, keeps everything else |
| ranked tactical work | `docs/working-plan.md` | unchanged role, needs a pruning pass |
| this migration | `docs/restructure-2026-07.md` | disposable, dated, self-retiring |
| dated reasoning about finished work | **`docs/postmortems/`** (new) + root `.postmortem.json` | tracked; the distilled record, unlike logs |
| what a zero-context session or subagent must know | **`docs/orientation.md`** (new) | ~50 lines, routes and does not restate. Doubles as the briefing block for delegated work, which `CLAUDE.md` cannot be because a subagent does not auto-load it |
| what `t` is and how positions are addressed | **`docs/addressing.md`** (new) | adjacent to `VISION.md` but distinct: VISION owns *why determinism is first*, this owns *what the coordinate is* |
| the public explanation: what it does, how it works, examples | `site/` | stays in this repo. **Owns nothing.** A website — a glorified README with example scenes. If it disagrees with anything, it is the thing that is wrong. It enters the drift audit only because a public page should not state a capability the code lacks |
| where facts live | `docs/source-of-truth.md` | gains two rows |
| the count that fires promotion triggers | `docs/pattern-ledger.md` | unchanged |
| Phase 4 constraints | `docs/physics-bake-proposal.md` | gains the kinematic-body option |
| inherited history | `docs/predecessor-record.md` | unchanged |
| session narration | `internal/log/` | **tracked 2026-08-01** (was local); the log is narration, the postmortem is the finding |
| third-party correspondence | `internal/outside_comms/` | never citable from tracked content; already private by gitignore |
| frozen predecessors | `internal/legacy/` | already invisible to ripgrep via gitignore — the proposed reshuffle was retracted, see R2.5 |
| repo-development agents | `.claude/agents/` | `control-builder`, `doc-claim-auditor` audit *this repo* |
| **film-review capability** | **`plugin/agents/`** (new) | `film-reviewer` reviews *films* — a user capability, not a dev tool |

The `.claude/` split follows the same audience rule that already separates
`scripts/` (dev-only) from `plugin/skills/mitate/templates/` (shipped).

---

## R0 — Truth

Nothing structural. Everything here is currently false.

1. **`sample.yml:11-12`** states `no_canvas: true` must return 0/200. Its own
   input description (`:35-38`) says that arm **must still fail**, and its own
   measurement (`:7`) recorded 40%/30%/20%. `sample-determinism.js:69-75`
   already diagnosed this and **names the workflow header as a carrier**;
   `b233419` fixed the script and the input description and left the header.
   → Delete the criterion from the header; point at `sample-determinism.js:65-75`
   as its one home. Same for `internal/.../log_2026-07-29.md:61`.

2. **`bracket-determinism.js` bare-seeks. `diagnose-determinism.js` does not.**
   **DONE 2026-07-30.**

   The original finding claimed both were defective, and it was **wrong about
   the second**. It came from grepping import lists: `diagnose-determinism.js:27`
   takes `settle` and not `seekSynced`, which read as a bare seek. Its `gridAt`
   calls `window.seekTo` and performs the readback inside one `page.evaluate` —
   seekSynced's mechanism exactly — and it *cannot* call seekSynced, because
   there the completion barrier and the diagnostic payload are the same readback.
   Corrected by adding a comment recording the relationship, so nobody
   consolidates it later and loses the grid.

   **The lesson is this plan's own thesis turned inward.** An import list is not
   a capture pattern, and inferring behaviour from a grep instead of reading the
   body is how most of R0's other entries came to exist in the first place.

   `bracket-determinism.js` was genuinely bare-seeking on both sides, so it
   passed while testing a configuration nothing ships. Now `seekSynced` +
   `settle`, mirroring smoke.js's arm. Run **before** the change (three rows as
   specified, both failing arms reachable) and **after** (same three verdicts),
   macOS/WebGL2. Stated honestly: that pair proves the control still works, not
   that the change fixed anything here — the race does not reproduce on macOS
   (0 in 80). The evidence it matters is 0.16.28's Linux pair, and `sample.yml`
   is how it gets re-verified there.

3. **`bear-and-bees.html:1375**: `const STOP_X=-1.2; // solved from the probed
   nose reach (see probe.js)`. **`probe.js` does not exist** anywhere in the
   tree, and `build.js` has no `probe` subcommand.

   **Four carriers, one of them public:** `bear-and-bees.html:1375`,
   `SKILL.md:269`, `examples/README.md:57-59`, and — found 2026-07-30 —
   `site/index.html:205` (*"Every contact is probe-measured."*) and `:209`
   (a primitive chip reading **`Box3 contact probes`**).

   **Provenance question, closed 2026-07-30.** The hypothesis was that `probe.js`
   arrived with the migration from `explainer-video` → `screenwright` → mitate.
   It did not. Grepped both frozen predecessor trees and the 0.16.0-era circus
   toolchain under `internal/`: **no `probe.js` file and no `probe` subcommand in
   any generation.** Every "probe" hit there is `ffprobe`, `probeArgs` (encoder
   version checks), or a comment describing a step-halving probe as a *technique*.
   So the tool has never existed, in any ancestor. No memory lookup needed.

   State it precisely, because the honest version is not "the claim is false":
   the contacts were most likely measured by the hand-written `page.evaluate`
   probe `method.md:727-736` instructs, and `working-plan.md:64` records exactly
   that — *"a technique documented with no tool. Re-derived, then skipped."*
   So the measurement probably happened; the **harness was not kept**, so the
   claim cannot be re-derived by anyone. Same shape as rule 5's `sortObjects`
   repro, cited as preserved and absent from the tree — the failure
   `install-hooks.sh`'s own header names.
   → Instance 7 of the contact class, second of the claims-a-check-exists class.
   **Resolved by shipping `probe` (R2.2), not by editing prose** — then re-derive
   `STOP_X` and let all four carriers become true and checkable. Until then,
   restate the code comment honestly.

4. **`build.js:24`** cites `docs/internals/plugin-patterns.md`, which exists in
   neither this repo nor the install cache. Only such citation in harness code.
   → Drop the cross-repo pointer; keep the rule.

5. **`working-plan.md` calls `film-reviewer` a gate criterion at `plan.md:460`
   in three places** (`:246`, `:455`, `:704`). It is not — `film-reviewer`
   appears in `plan.md` at `:471` and `:509`, both inside DONE narrative, never
   in a `*Gate:*` clause; the examples gate is *owner approval, not rendering*.
   → Restate A0's justification on what is true: best measured catch record,
   unreachable from an install. That argument is strong enough without the
   overclaim.

6. **Stale and dangling citations.** `working-plan.md:246/455/704` → `plan.md:471`;
   `:1732` → `plan.md:280-283`. `plan.md:331/436/503` cite CHANGELOG 0.69.0 /
   0.74.0 / 0.78.0 — predecessor numbering; this CHANGELOG runs 0.1.0–0.16.29.
   → Repoint or drop. Pin to content, not line numbers, per the lesson
   `working-plan.md:955` already records.

7. **`plan.md:109-110`** still says the kernel/driver split *"costs only
   discipline"*, contradicted at `working-plan.md:1321-1323`, and the Phase 6
   gate text (`plan.md:587-588`) was never amended despite being known
   unreachable.
   → Amend both; point at the state-object fix.

8. **Crushed-exposure exists in three simultaneous states** (`plan.md:404-410`
   and `:424-425` open; `working-plan.md:1533-1539` measured;
   `working-plan.md:191-195` "left undone").
   → One home, one state.

9. **The window contract has four different memberships.** `CLAUDE.md:19` lists
   six names, `README.md:70-84` lists nine, `SKILL.md:85-94` lists eleven, and
   `smoke.js:66` hard-asserts four. **`CLAUDE.md`'s is the only list that omits
   `stopPlayback`, which is one of the four the gate actually enforces.** Four
   copies of the repo's most central concept, disagreeing, in direct violation
   of `source-of-truth.md:5-7`.
   → One home. `smoke.js:66` is the enforcer, so the tiering belongs where
   `README.md` already explains it; `CLAUDE.md:19` points rather than restates.

10. **`CLAUDE.md:43` cites "invariant 6: say which copy". That is invariant 7.**
    `9f99ce4` (0.16.18) inserted "Red before green" as the new invariant 6 and
    pushed the old one to 7 without updating the cross-reference. Same error at
    `working-plan.md:465`, while `working-plan.md:114` uses "invariant 6"
    correctly for the bracket rule — so one string names two different rules 350
    lines apart in one file.
    → Repoint both to 7. Cite invariants by name, not number, or this recurs on
    the next insertion.

11. **`README.md:116` links to `plugin/README.md#requirements`. That heading was
    deleted in `8c411f4` (0.16.13) and the anchor has dangled for 16 releases
    with a green board** — `selfcheck.js` check 3 covers neither repo-root files
    nor URL fragments.
    → Repoint to `#installation`. Extending check 3 to fragments is R1 work.

12. **The `noise1` independence claim is false, and the comment alone is not the
    fix.** `gcd(997, 4000) = 1` and `4 × 997 ≡ −12 (mod 4000)`, so
    `noise1(t,f,k)` and `noise1(t,f,k+4)` are the same track lagged 12 index
    samples — 6.3 seconds at the handheld 1.9 Hz, inside a normal film. The
    KERNEL comment says *"different k = independent track."*

    **Decision: correct the comment AND add a selfcheck arm. Not either/or.**
    Changing the stride constant would make the documented property true, and it
    would also change every value `noise1` returns — so every scene using
    handheld energy renders differently, every byte comparison against a shipped
    film breaks, every poster still needs re-rendering, and the site hero
    changes. That is a large irreversible cost against a trap **no shipped scene
    currently hits** (3D uses tracks 11-14, 2D uses 1-2; no pair differs by 4).
    Rejected.

    But documenting a limitation and trusting the next author to read it is the
    exact failure this plan exists to end, so the comment cannot stand alone. The
    arm scans scenes for literal `k` arguments and fails when two in one scene
    differ by a multiple of 4. It cannot see a computed `k`; the comment covers
    that residue, and the comment says so. Belt and braces, and it is cheap.
    KERNEL is 9 carriers, so the comment edit is a cross-directory parity run.

13. **`CLAUDE.md:63`'s "Verified: the cache contains … and nothing else" is
    literally false** — the live cache also carries `.in_use` bookkeeping
    dotfiles. The claim's substance holds; the word "Verified" is doing work the
    check does not support.
    → Say "and no other content."

**Gate R0 — MET 2026-07-30, shipped as 0.16.30.** `selfcheck` green (13 dated
docs, cascade coherent at 0.16.30); cross-directory fence parity green over all
nine KERNEL carriers; `smoke.js` exit 0 on all six scenes, advisories only;
`bracket-determinism.js` run before and after the capture change with all three
rows as specified both times. One item deliberately **not** done and recorded as
an exception: R0.3's `probe.js` comment in `bear-and-bees.html`, deferred to R2
so the film is touched once, by the change that makes its claim true.

Original gate text: `bun run scripts/selfcheck.js` green; `bracket-determinism.js`
demonstrated red then green on the `seekSynced` change; no tracked file cites a
path or version that does not resolve.

---

## R1 — Make the falsehood unrepeatable

Each item here is a check, not a cleanup.

1. **`source-of-truth.md` gains two rows**: CI config, and session logs. Its
   table currently covers references, code comments, SKILL.md and CLAUDE.md —
   not the surfaces where the criterion actually drifted. Two rows, not a new
   section.

2. **New `selfcheck.js` arm — no bare seek before a capture.**

   **The obvious spec is wrong, and R0.2 proved it.** "No file may compare
   `page.screenshot()` output while requiring `backend.js` without using
   `seekSynced`" would flag `diagnose-determinism.js`, which is correct — it
   hand-rolls the same barrier because it needs the readback's payload. A check
   whose first action is to condemn a correct file is worse than no check.

   Spec it on the **pattern**, not the import: flag any `page.evaluate` whose
   body calls `window.seekTo` and does **not** also read pixels back
   (`getImageData`) in that same evaluate. That is precisely the bare seek
   0.16.28 measured as racy. It catches `bracket-determinism.js`'s old shape, it
   passes `diagnose-determinism.js`, it passes every `seekSynced` caller because
   the primitive contains the readback by construction, and it is statically
   decidable. Build it against the pre-fix `bracket-determinism.js` as the red
   arm — that fixture exists in this branch's history.

3. **New `selfcheck.js` arm — `artifacts:` resolve.** Every postmortem
   frontmatter entry that looks like a repo path must exist. Turns a filing
   convention into a control, and it is the shape that would have caught the
   `probe.js` citation had it been in frontmatter.

4. **Bracket the fence-parity check.** It has two documented near-inert
   episodes (`smoke.js:923-934`, `:946`) and no control — the one check whose
   silent failure invalidates the repo's whole DRY story. Cheapest bracket
   available: pure string work over temp files, no browser, mirroring
   `--parity-only`.

5. **The code-versus-prose boundary gets a rule, and the ratchet gets extended.**
   Owner directive, 2026-07-30: *"comments and rules and notes inside code vs.
   what's inside md… No drift should be possible and we should make sure future
   claude sessions avoid this."*

   `source-of-truth.md:11-21` already assigns homes by *kind of fact*. What it
   never states is the boundary that every failure in this pass crossed:

   > **A code comment may assert what its own line does. It may not assert what
   > another file does.** A claim about another file's behaviour belongs in the
   > reference that owns the subject; the comment points at it and does not
   > restate it. Anything else is a claim that cannot be checked from where it
   > lives.

   Every instance found this session is that one violation:
   - `solveShot`'s comment asserts *"the extent check in smoke.js is what catches
     it"* — a claim about another file. There is no extent check.
   - `bear-and-bees.html:1375` cites `probe.js` — a claim about a file that has
     never existed in any generation.
   - `build.js:24` cites a doc in a different repo.
   - `sample.yml`'s header carried a verification criterion owned by
     `sample-determinism.js`, and the two drifted into contradiction.
   - The `noise1` comment asserts a *property* of the pool that is false.

   **Enforcement, not just a rule.** `selfcheck.js` already ratchets
   "measurement-assertions" — comments asserting a measurement without naming the
   control, budget 46, may fall and never rise. Extend the same ratchet to
   **comments asserting that a check exists, or that another file behaves a
   certain way**. That is `working-plan.md`'s items 6b and 6c, which were already
   queued, promoted from a one-time sweep to a standing budget so it cannot
   regrow. A one-time sweep fixes five instances; a ratchet stops the sixth.

6. **The claim audit gains `site/index.html`.** The `audit-claims` skill
   dispatches `doc-claim-auditor` at reference docs, `CLAUDE.md`, and the
   load-bearing comments in `templates/*.js`. The site states things about the
   code — `site/index.html:205` says *"Every contact is probe-measured"* and
   `:209` ships a primitive chip reading `Box3 contact probes` — and nothing
   audits it. **This is the only reason the site is in scope for anything**: not
   a role in the document graph, just the ordinary bar that a public page should
   not claim a capability the code lacks. A public page asserting a capability is exactly what that agent
   exists to check. One line in the skill's scope.

**Gate R1 — MET 2026-07-30, shipped as 0.16.31.** `bracket-parity.js` green on
all five arms, and demonstrated **red against the real regression** rather than a
synthetic one: with the half-fenced guard reverted in a scratch `smoke.js`, both
mangled-marker arms flip to `inert` and it exits 1. The seek arm demonstrated red
by dropping the pre-fix `bracket-determinism.js` into the tree and green when
removed. `selfcheck` green at 4 brackets; `gate.yml` globs `bracket-*.js`, so the
new control was in CI the moment it existed.

**Two items deliberately not done, with reasons rather than silence:**
- **The `artifacts:` resolver moves to R2.** `docs/postmortems/` does not exist
  yet, so the arm would scan zero files and print ok — a decorative check, which
  is what this phase exists to stop shipping.
- **`doc-claim-auditor` over `site/index.html` is scoped, not yet run.** Its one
  known finding is the probe claim, which R2 resolves by shipping the tool. Running
  it now would produce a report whose only item is already scheduled.

**The shared-bracket-harness trigger fired, and was declined on measurement.**
`working-plan.md` defers extraction until *the fourth bracket*; this is the
fourth, and all four do duplicate temp-dir setup, fixture mutation and an
expected-verdict table. Declined for two reasons, both checkable:

- **They are two families, not one.** `bracket-determinism` and
  `bracket-liveplay` drive playwright directly (zero `execFileSync`);
  `bracket-noise` and `bracket-parity` shell out to `smoke.js` (two each). A
  harness spanning both would abstract over a real difference.
- **Controls that share a harness share a failure mode.** These four exist
  because two shipped brackets could not go red. A bug in a common harness makes
  all four decorative at once, silently — the exact defect they were built after.

Revisit when a third bracket of *one* family exists. Duplication that buys
independence is a different thing from duplication that hides drift, and the
distinction is worth stating because this repo's default is to collapse copies.

Original gate text: each new arm demonstrated red on a deliberately broken copy, then
green. `.github/workflows/gate.yml` runs the new bracket (its glob already
picks it up). `doc-claim-auditor` run once over `site/index.html`, findings
dispositioned.

---

## R2 — Reachability

Things that exist and cannot be reached do not exist
(`working-plan.md:61-62`, the parent rule).

1. **Ship `film-reviewer`** — **DONE 0.16.32**, as `plugin/agents/film-reviewer.md`. It gates
   nothing formally (R0.5), but it has the best measured catch record in the
   project and no installed user can reach it. Plugins ship agents; this is a
   one-file move plus a `SKILL.md` routing line. **Version cascade.**

2. **Ship `build.js probe`** — **DONE 0.16.32.** Ranked 1 in `working-plan.md:405`, unblocked,
   **no new dependency for an installed user**. It is the instrument for the
   defect class at count 6 in the ledger, which just produced instance 7 inside
   a shipped example. Ship the eval prelude (`bb(o)` → `Box3().setFromObject`,
   `proj(v)` → NDC) plus the worked list in `method.md`: contact separation,
   reach, clearance from the camera-subject line, foot-plant drift.
   **Version cascade.** Then close R0.3 with a measured number.

   **Three cases waiting for it, all found 2026-07-30:**
   - `bear-and-bees.html:1375` `STOP_X` — the phantom-provenance constant.
   - `bear-and-bees.html:1383` `bearHead:{pos:t=>[bearXAt(t)+3.3,2.3,0],…}` — a
     **fourth independent statement of where the bear's head is**, with a
     hardcoded `+3.3` and fixed `y`, omitting the boop lean (`:1552`) and the
     neck extension (`:1568`). The camera's model of the head already disagrees
     with the head, and it is the subject of two shots. `SOLVER`'s own comment
     says this class is unchecked.
   - `bear-and-bees.html:1379` — the erupt recoil (`-.38*pulse(t,'erupt',.12,1)`)
     runs while `vAmp` is 0, so `gaitPose` collapses fully to the body-relative
     rest stance and **all four paws translate rigidly with the recoil** across a
     1.1s beat in an FSA shot. Unrendered; `build.js strip` over that window
     settles whether it reads.

3. **Postmortems become tracked** — **DONE 0.16.33.** `docs/postmortems/`, root `.postmortem.json`
   = `{"dir": "docs/postmortems"}` so placement is a decision rather than the
   filing skill's rung-3 inference. Convert `2026-07-25_session_handoff-review.md`
   to frontmatter form — it currently starts with `last updated:`, which is
   exactly the pattern `selfcheck.js` check 7 derives its set from, so it would
   fail on first commit, and it has no frontmatter so `postmortem-index` cannot
   see it. Cite from plugin content by **absolute repo URL** (invariant 4's
   existing pattern). New rule: a tracked postmortem may cite a local-only
   artifact but must label it `(local)` and must not rest a claim on it.

4. **Routing, now with a measured baseline** — **DONE 0.16.33 + `bb8e269`.** A cold session assuming no
   machine-local memory takes **3 hops and ~4,900 lines** to reach the working
   plan, and these never arrive at all:

   - **`README.md` (repo root) is an orphan** — nothing in `CLAUDE.md` or any
     `docs/` file points at it. The repo's front door is outside its own graph.
   - **`plugin/skills/mitate/SKILL.md` is an effective orphan.** It is named as
     prose at `CLAUDE.md:39` and `:111` and **never given as a path or a link**.
     The primary artifact this repo exists to ship is not routed to from the
     developer entry point.
   - **`docs/working-plan.md` — the current ranked work — appears zero times in
     `CLAUDE.md`.** Its only entry-point mention is `README.md:145`, inside the
     orphan.
   - **`.github/workflows/sample.yml` has zero inbound references anywhere**, and
     `scripts/sample-determinism.js` is reachable only through it. An orphan
     behind an orphan, edited in the most recent commit.
   - `pattern-ledger.md` and `examples-placement.md` are named in **neither**
     entry point.

   Three fixes, all cheap, all the pattern 0.16.19 already established:
   - **A `## Map` block in `CLAUDE.md`** listing all seven `docs/*`, the three
     `.claude/agents/*`, `.claude/skills/audit-claims/`, all five `scripts/*`,
     all three workflows, and the `SKILL.md` path. Unlinked, so it cannot dangle.
   - **A `**Map.**` block in `SKILL.md`** after line 37. `method.md`,
     `instruments.md` and `delivery.md` each got one in 0.16.19; **`SKILL.md`,
     the file `source-of-truth.md:16` names as the home of routing, did not.**
     Its only index is `## Files` at line 219 — 79% of the way down.
   - **`docs/README.md`**, a pointer table with a read-it-when column. Never a
     summary; a summary is the copy this plan is about. The root README's Layout
     table lists all seven and points here.

5. **`references/glossary.md`** — **DONE 0.16.33.** There was definitively no
   glossary; verified three ways before writing one. It goes in the subtree because that is reachable from **both**
   cold starts, and it loads on demand so it costs no standing context. The four
   worst by use-to-definition ratio:
   **`register`** (98 uses across 16 files, defined nowhere),
   **`install cache`** (11 uses *inside* a subtree that cannot see its
   definition — every reference's provenance header says a thing was "not
   verified against an install cache" to a reader standing in one),
   **`window contract`** (14 uses, four disagreeing membership lists — see R0.9),
   **`parity set`** (4 uses in `smoke.js`, defined nowhere in the repo).
   Also unreachable from the cache: **"Phase N"** as a numbering scheme, used by
   three references with no resolver.

6. **DONE 0.16.34 — two placement fixes inside `SKILL.md`**, both bibliography-only today
   despite their own entries naming a moment: **`materials.md`** says "read
   before authoring any surface beyond flat color" and is not cited at step 2's
   `buildWorlds()`; **`bibles.md`** says "read at art-direction time" and no step
   names art direction, so the cue never fires. `instruments.md` is cited twice
   (`:170`, `:259`) but neither is the moment it exists for — deciding whether a
   green result means anything, which is steps 3 and 4.

7. **DONE 0.16.34 — removed `metadata.last_verified` and bring `SKILL.md` under the provenance
   header rule instead.** Owner's call delegated 2026-07-30, on the criterion of
   long-term viability across many sessions. The decision and its reasoning:

   The field is stale right now (`"2026-07-25"`, against a file edited twice on
   2026-07-29 with all eight references rewritten), and **nothing catches that**
   — `selfcheck.js` check 7 derives its set from files carrying `last updated:`,
   which this is not. So it is an unenforced claim, in frontmatter, on a file
   that loads entirely into context on every activation.

   It is also a **worse duplicate of a mechanism that already works.** The eight
   references each carry a provenance header, and `selfcheck.js` check 4 enforces
   that every one names a date or honestly admits it is unaudited. That form is
   better on three counts: it is per-file rather than one date covering nine; it
   records **what was verified against what** rather than only when; and it is
   checked.

   The semantics were also drifting in practice. The field asserts *a human*
   reviewed the tree. In reality these stamps get written during Claude sessions,
   so the assertion and the act diverge — and "a human looked at it" is not
   auditable in the way "verified against `templates/*.js` on a date" is.

   → Delete the `metadata` block. `SKILL.md` gains a one-line provenance header
   in the body, in the same form as the references, and `selfcheck.js` check 4
   extends to cover it. Net: two frontmatter lines out, one checked line in, and
   the claim becomes falsifiable instead of asserted. **Version cascade** (it is
   plugin content), and `CLAUDE.md:39-45` loses the paragraph describing the
   field.

8. **`internal/` — RETRACTED 2026-07-30, and the retraction is the finding.**

   This item existed to fix "63-75% of grep hits for core symbols are
   non-authoritative". **That measurement was taken with shell `grep -r`, which
   ignores `.gitignore`.** The Grep tool uses ripgrep, which honours it, so
   `internal/` was never in its results. Re-measured: `solveShot` returns 18
   files under shell grep and **13 under ripgrep, none of them from `internal/`**
   — and the staged `site/films/` copies are excluded too, by `site/.gitignore`.
   The exclusion this item proposed building already exists and always did.

   That removes the retrieval justification, which was the strong half. The
   remaining argument — that `internal/` conflates private, archive and live work
   — is real but is a *meaning* problem with no measured cost, and the concrete
   instances are already resolved: postmortems are tracked (R2.3), `outside_comms`
   is private by gitignore, and `legacy/` is invisible to search. So this is
   **dropped**, not deferred (this was R2.5 before the renumber; the CHANGELOG
   0.16.33 entry calls it that), and the last-copy question about the predecessors is
   the only thing worth keeping from it.

   **The lesson generalizes past this item, which is why it is written here
   rather than deleted:** an instrument that disagrees with the one the reader
   actually uses will manufacture a problem. Measure with the tool whose behaviour
   you are reasoning about.

9. **Triage `internal/circus_prototype/bench/`.** Nine measurement harnesses —
   `bench_viewer_{desktop,mobile,loop}`, `bench_playback`, `bench_capture`,
   `bench_reviewloop`, `bench_scene`, `bench_liveplay_{corpus,bracket}` — all
   built on `backend.js`, all aimed at the viewer and playback questions the
   vision needs, all on one machine with nothing running them. This is the
   postmortem problem again, for code. **Promote on a trigger, not wholesale**:
   take the ones the R5 seam work actually calls, starting with viewer and
   playback. They are written as dense one-liners and need cleanup, so a
   promotion is a rewrite, not a move. Note the shape they share with
   `bracket-*.js`. Note the harness-extraction trigger they would feed was
   **fired and declined** in R1's gate, on the grounds that the brackets are two
   families and that controls sharing a harness share a failure mode. Three
   promotions of one family would reopen it; a mixed three would not.

**Gate R2 — MET 2026-07-30, shipped across 0.16.32-0.16.34.** `film-reviewer`
and `probe` are in `plugin/` and routed from `SKILL.md` at their moments; both
postmortems carry frontmatter an index can read, checked; `solveShot` under
ripgrep returns 13 files, none from `internal/` — which is the measurement that
retracted item 8.

~~**One part of this gate is deferred**~~ — **VERIFIED 2026-07-30 after the merge
of PR #2, and it is now fully met.** "Present in a real install cache" could not
be checked until `main` carried the plugin, because the marketplace clones from
the remote. Measured against the actual cache at
`<claude-config>/plugins/cache/mitate/mitate/0.16.40/`:

- **`agents/film-reviewer.md` is in the cache**, and the reload registered
  `mitate:film-reviewer` as a live agent type. A new shipped directory reached an
  installed user, which was the specific thing nobody had confirmed.
- **The cache holds `agents/`, `skills/` and `README.md` — nothing else.** No
  `docs/`, no `scripts/`, no `CLAUDE.md`. **Invariant 3 is now observed rather
  than asserted**, which matters because every "SKILL.md must not cite a path
  outside its subtree" rule derives from it.
- **Byte-identical to `main`'s `plugin/` subtree**, the only difference being an
  `.in_use` marker the harness writes.

The check that made this worth doing deliberately: a shipped directory is the
kind of thing that works on a laptop and is absent for every installed user, and
`selfcheck.js` resolving subtree links against the plugin root only proves the
links resolve *in the tree*. This proves the tree is what ships.

---

## Declined: a simplify pass over `scripts/selfcheck.js` (2026-07-30)

Proposed after the code review, then dropped when every justification for it was
measured and none survived. Recorded so it is not re-proposed as a fresh idea.

- **"It is too long"** — 636 lines, +274 this session. It reads whole against a
  2000-line window, so the truncation argument that would make length a
  *correctness* problem does not apply.
- **"The shape is wrong"** — it is eleven self-contained numbered blocks, which is
  the same shape argued *correct* for `build.js`'s eighteen verbs earlier in this
  same migration. Reversing that for one file would be taste, not reasoning.
- **"Checks 5 and 6d duplicate comment scanning"** — measured, and they do not.
  Check 5 is a per-LINE regex against a counter and a budget over `templateJs`.
  Check 6d is per-COMMENT extraction with two token regexes resolved against a
  file set, over `toolJs` plus length-filtered scene HTML. The only overlap is
  that both read comment text.

**And the argument that would have decided it anyway:** controls that share
machinery share a failure mode. That reasoning declined the shared bracket
harness in R1's gate, and it applies identically — a bug in a common
comment-scanner would weaken both checks at once, silently.

**The real reason it was on the agenda was that "review, then simplify" is a
habit.** No cost was ever identified. The growth is mostly comment blocks
recording specs that were wrong on the first attempt, which read as fat and are
the one thing that stops the next person re-making them.

**Trigger to revisit:** a third check that genuinely needs comment extraction, or
a measured cost — something taking too long, or a defect traced to the file's
size rather than to its logic.

## Review findings — CLOSED in 0.16.37

From the three-agent review of this branch. Both are fixed, each with a control
that was proven red first. Fixing them surfaced two more, recorded below.

1. **`selfcheck` check 6d compared BASENAME, not path.** ~~Open~~ — fixed. A
   citation naming a real file under an invented directory passed, because the
   basename existed somewhere; the historical catch only worked because *its*
   basename existed nowhere. Path-shaped tokens now resolve against two bases
   (repo root, and the shipped subtree, both real shapes in the corpus) and bare
   filenames keep basename matching. The accept-set moved from a live-filesystem
   walk to `git ls-files --cached --others --exclude-standard`, so gitignored
   build output no longer makes the answer depend on whether the machine has run
   a build. `PATHY` grew an optional leading dot; measured occurrence-neutral
   (29 → 29) apart from the one token it was for.

2. **`stage-films.sh` did not clear `films/` first.** ~~Open~~ — fixed. It now
   clears `*.html` before staging, so an aborted derivation leaves the variant
   *absent* rather than stale. Absent is visible; stale is not.

### Two the fixes exposed

3. **`scripts/bracket-selfcheck.js` was run by nothing.** Not `gate.yml` (globs
   `templates/` only), not `static.yml`, not the pre-commit hook — and check 6's
   bracket census read `templates/` too, so the count said 4 while 5 existed. The
   one control over the repo's own claim-checker was invisible to the check whose
   entire job is noticing that. Census now covers both directories (reports 6);
   `static.yml` gained a globbed `brackets` step; `gate.yml`'s comment now says
   why its glob is directory-scoped instead of implying it is complete.

4. **`static.yml`'s fence-parity step had a stale claim and a dangling
   continuation.** Its comment claimed it covered "the one negated exception in
   `site/films/`"; 0.16.35 made that copy derived and removed the argument,
   leaving the claim and an orphaned `\`. The command was doing less than it
   said. Same class as everything else on this branch — a fact with no check over
   it — but in CI config, which nothing audits.

**Controls:** `scripts/bracket-stage-films.js` is new (three arms; two proven red
against the pre-fix script). `bracket-selfcheck.js` gained two arms, both proven
MISSED before the fix and CAUGHT after.

## R3 — Structure

1. **Trim the always-loaded surface — `SKILL.md` DONE, `CLAUDE.md` partly.** Owner
   directive 2026-07-30, and the measurement backs the ordering. These are the
   only two files charged on every invocation — `SKILL.md` in full, frontmatter
   included, on every skill activation; `CLAUDE.md` on every session in this
   repo. Together ~33 KB. R0-R2 added 94 lines to them while fixing orientation
   elsewhere, which is the wrong direction paid forever.

   `CLAUDE.md` has had one pass already (present tense, four derived counts
   removed, 233 → 224). What remains for both: **every line must earn its place
   on every future invocation.** Anything that is history goes to `CHANGELOG.md`;
   anything a command derives goes to the command; anything read once goes to a
   reference or `docs/`. `SKILL.md`'s 1,458-byte frontmatter description is the
   single densest always-loaded block in the project and has never been audited
   for whether every clause changes a decision.

   **`SKILL.md` DONE 2026-07-30: 326 → 220 lines, 18.8 → 11.0 KB, 41% off.** The
   diagnosis was not length, it was **wrong audience** — this file is read by an
   agent helping someone make a film, and it carried a provenance essay, thirteen
   lines on bracket controls a film-maker never runs, release archaeology, a
   62-line prose bibliography (22% of every activation), and four shell comments
   inside code fences that parsed as h1 headings, so any outline of it reported
   fourteen headings where there were ten. Now six workflow steps in the order the
   work happens, each citing the one reference it needs at that moment.

   **Two regressions caught by the gates, both restored:** the provenance header
   fell outside `selfcheck` check 4's window once the intro grew above it, and
   four load-bearing terms vanished — `DURATION`, `stopPlayback`, `swiftshader`,
   `ANGLE_BACKEND`. The last two mattered most: "never hand-roll WebGPU flags"
   without naming `WEBGPU=swiftshader` states a consequence with no way to avoid
   it. **The no-rule-lost gate is a term diff, not a read.**

   **Gate the rest on a number**, not on taste: both files smaller than they
   started this migration, no rule lost — checked by a term diff and by re-running
   the cold-start test.

   **The references are NOT next, and that is a measured decision.** Blanket-
   rewriting the nine shipped references was considered and rejected: they are
   read-on-demand rather than always-loaded, so length is not automatically a
   cost, and a census found 0-3 release citations each and almost no
   wrong-audience content. `SKILL.md` was the outlier because it is charged on
   every activation and had been accumulating for releases. The counter-argument
   that decided it: **R2 created roughly ten defects while rewriting things for
   orientation**, so nine more rewrites is nine more chances at that, against a
   measured problem of one to three lines per file. Targeted instead:

   - **`delivery.md` split** — already item 4 below, a real restructure.
   - **`instruments.md`** — 338 lines, largest after `method.md`, three release
     citations. Worth a read, probably not a rewrite.
   - **The mechanical strip — DONE, and it was two edits, not eight.** Reading
     every version citation in context, only one was archaeology
     (`glossary.md`'s window-contract entry); the rest are provenance for
     measured findings, which the discipline requires. Also fixed: a shipped
     reference naming `docs/working-plan.md` as bare prose, which a cache reader
     cannot follow — the rule is now stated inline instead of pointed at.

2. **`README.md` trim — DONE 2026-07-30**, and deliberately *after* the pair above: it is
   read on demand, so its cost is a first impression rather than a recurring
   charge. Its Layout table lists a subset of `docs/` and should point at
   `docs/README.md` instead of enumerating.

3. **`VISION.md`** at repo root — **DONE 2026-07-30.** The ordering argument (determinism is the
   observation instrument, not a constraint accepted in exchange for one), the
   `t`-as-coordinate / state-as-driver-output formulation, films as the proving
   instrument rather than the product. **Supersedes `plan.md:821-823`**
   ("Scope creep toward a game engine… mitate ships films"); `plan.md` keeps
   architecture and gates. One page. It owns exactly one fact that has no home
   today — confirmed absent from all three planning docs by two independent
   passes.

   ~~**The site is the other vision carrier**~~ — **struck 2026-07-30.** It
   carries nothing; `VISION.md` is the home, full stop.

   **But the reconciliation obligation is real, and striking the whole clause
   over-corrected it.** Owner, 2026-07-30: *"the vision defines and informs site
   language, and plan informs site copy of plan... the site is just how you and I
   choose to communicate it out."* That is a one-directional derivation, not a
   shared ownership: upstream language change **⇒ work on the site**, and never
   the reverse. `source-of-truth.md` now states it.

   **Outstanding, measured 2026-07-30 — `site/index.html` is byte-identical to
   `main` while this branch rewrote the language it is supposed to carry:**

   - **The false duration ceiling**, which the owner corrected in `SKILL.md` and
     `README.md` this session. `site:156` still read *"nothing caps duration, but
     longer has not been shipped"* — the superseded README sentence verbatim —
     and `site:167` *"These run 12 to 21 seconds."* **Fixed 0.16.40**, because a
     public page asserting something the owner has explicitly called false is not
     a wording preference.
   - **`t` framed as time, not position.** The site says *"a pure function of
     time t"* three times, including the `<meta>` description and `og:description`
     that drive every social preview, plus *"A film is a pure function of time."*
     `VISION.md` and `README.md` now open on `t` being **a position, not a
     clock** — an address you evaluate, not a cursor you advance.
   - **The window contract shown flat, with a different membership list.**
     `site:345` lists `seekTo · DURATION · BEATS · FRAME · sceneReady`. The
     contract is **tiered** — four hard-asserted (`seekTo`, `DURATION`,
     `stopPlayback`, `sceneReady`) and the rest behind fallbacks — and this list
     omits a hard name while including two soft ones. `glossary.md` warns exactly
     this: *"four different membership lists can disagree, and the shortest list
     is the one most likely to omit a name the gate enforces."*
   - **No pointer to `VISION.md`.** The site's `#why` section predates the file.

   **All four closed 0.16.40 (owner-directed).** The `t` framing now leads with
   position-not-clock in the `<meta>`, the `og:description` and the `#why`
   heading, and `#why` links `VISION.md`. The contract layer shows the tier
   split. The roadmap lede states the engine/declarative-layer framing and
   Phase 4 is named as the declarative layer for interaction.

   **The length claim is reframed rather than merely corrected.** Owner: the
   examples are short *because a project site should not ship a giant cache of
   code* — every scene embeds its own three.js — **not** because anything caps
   duration. The site says that, and says longer films have been built. It does
   not name or link one.

4. **`delivery.md` splits — DONE 2026-07-30 (0.16.38).** It was titled
   *"Delivering inline on GitHub"* and concluded at line 197 that the repo
   *"ships no recordings at all"* — 150 lines of encoder forensics in front of
   the path actually taken, under one provenance header stamped "UNKNOWN — never
   audited" that also covered this repo's own measured brotli figures.
   → `delivery.md` keeps the scene as the deliverable (bundle, brotli
   economics, hosting and mount policy, posters, the surface table).
   → **`recordings.md`** takes the lossy-copy path (format tradeoff, AVIF
   decode, encoder settings, content-type forensics, LFS/APNG traps).

   **The provenance split is the point, not the page count.** `recordings.md`
   keeps the honest UNKNOWN — its measurements are inherited from the predecessor
   and were never re-run here. `delivery.md` gets a real date, **2026-07-24**,
   recovered from the commits that introduced the brotli figures and the mount
   policy rather than invented. One header could not be true of both halves,
   which is why the file had to split before either could be dated.

   Eight live pointers followed it: `plugin/README.md`, `SKILL.md` (×2),
   `method.md`, `webgpu-stack.md`'s "Not here" edge, `build.js` (×2) and
   `source-of-truth.md`. `source-of-truth.md`'s 2.3x-collision paragraph named
   `delivery.md` for a figure that moved to `recordings.md` — it now names three
   domains, not two. Historical mentions in `plan.md` and `predecessor-record.md`
   were left as written where they describe what happened; two in `plan.md` that
   made present-tense claims about where doctrine lives were repointed.

5. **`working-plan.md` pruning pass — DONE 2026-07-30 (0.16.39).** It carried
   superseded paragraphs kept verbatim (correct practice) that read as live
   positions to a scanner, plus edit residue where a resolved question was
   restated in its superseded conditional form. Both struck, keeping the
   reasoning and dropping the conclusion.

   **The larger finding was the sequencing table.** Twelve items, no record of
   which had shipped, and a prose warning at the top asserting "items 1 and 2
   have shipped" — item 2 never did. It now carries a status column verified
   against the tree, with rows not re-checked marked as unknown rather than
   pending. *The annotation was the bug, not the table*: a warning that states a
   status goes stale silently, a column that records one can be shown wrong.
   The ancestry row calling `probe` "dropped in migration" was corrected too —
   it shipped, and that is the third independent arrival of the shape, which is
   the count that table exists to keep.

   **This exposed a DONE that was not.** R3 item 3 above is marked done, but its
   clause requiring `source-of-truth.md` to name `site/` as a pointing surface
   for the vision had never landed. Found by grepping for the row instead of
   trusting the marker — which is the same lesson as the status column, one
   document up.

**Gate R3:** `selfcheck.js` green including provenance headers and "Not here"
edges on both split references; no doc states a goal that another doc
contradicts; **`CLAUDE.md` and `SKILL.md` both smaller than at the start of this
migration**; and a cold-start run reaches the right next item without reading a
superseded document.

### Gate R3: MET 2026-07-30

| clause | state |
|---|---|
| `selfcheck.js` green, both split references carrying a provenance header and a "Not here" edge | **MET** — 10 references |
| no doc states a goal another contradicts | **MET** for the one known case: `plan.md`'s "mitate ships films" now carries `VISION.md`'s supersession inline, and `working-plan.md` no longer restates the resolved fence question |
| `SKILL.md` smaller than at migration start | **MET** — 278L/15645B → 267L/13782B |
| `CLAUDE.md` smaller than at migration start | **RETIRED by owner call** — replaced by "no rule lost, no line unearned", which a term diff verifies. 248L → 209L this pass |
| cold-start run reaches the right next item | **MET** — see below |

**The cold-start run, 2026-07-30.** A fresh agent with no context, asked only
what to work on next and to log every file it opened: **1 hop, ~940 lines read
across 11 files, and the answer (R4) inside the first 24 lines of this document.**
Its words: *"the repo made this easy… the one document that would have wasted my
time warned me off itself three separate ways before I opened it."* It also
arrived independently at the R4.2-before-R4.1 ordering now recorded in the
position block. Compare R2's run, which found **nine** orientation defects, most
created while fixing orientation.

**It found three real defects, and all three are in the verification layer rather
than the navigation layer** — which is the useful result, because navigation is
what the gate was testing:

1. **Three stale doc-to-doc line anchors, all in this file**, pointing into
   `working-plan.md` — every one shifted ~140 lines by 0.16.39's prune, which
   updated the pruned file and nothing that cited it. Now cited **by heading**,
   because a line anchor across two documents rots the moment either moves.
   **This class is uncontrolled**: `selfcheck.js` check 6d resolves cited *paths*
   in code comments, not line anchors between docs. Historical anchors in the
   R0/R2 findings sections are left alone — they describe a state at a time.
2. **Two hand-written counts, stale, inside the document that states the
   never-hand-write rule.** `build.js` was called "827 lines and 18 verbs";
   it is **971 lines and 13 verbs**. `bracket-determinism.js` "115 lines"; it is
   129. The drift made the argument *stronger*, which is why nobody noticed.
   Both replaced with a pointer to `wc -l`.
3. **`docs/orientation.md` was unreachable from either router.** A file written
   for exactly the reader this test simulates, absent from `CLAUDE.md`'s map and
   from `docs/README.md`. The same failure the map was created to fix,
   reintroduced for a newer file. Both now point at it.

One friction item is worth keeping and is not a repo defect: the agent hit a
**transient red `selfcheck.js` from concurrent in-flight work** and nearly
reported the tree as broken. `git status` plus `git show HEAD:` disambiguated it.
Nothing in the tracked docs warns a fresh session to check whether the tree is
mid-edit before trusting an exit code — `orientation.md` is the right home for
that line.

**RESOLVED by the owner, 2026-07-30: the line count is not the criterion.**
*"Ignore CLAUDE.md being smaller than start — that's fine. What matters is that
we captured what's important and removed what isn't."*

So the clause is retired rather than met, and the replacement is the one the
trim was actually verified against: **every line earns its place, and no rule was
lost.** 0.16.39 cut `CLAUDE.md` 248 → 209 by moving history to `CHANGELOG.md` and
collapsing the Map's `docs/` half into a pointer at `docs/README.md`, which
already routed those nine entries — a duplicate this file was carrying against
its own one-home rule. **A term diff against the pre-trim file confirms no rule
was lost**; every dropped token is an anecdote, an illustrative example, or a
`docs/*` path reachable in one hop.

What remains over the 178-line baseline is the Map, which did not exist in `main`
and which R2 added to fix a *measured* orientation failure — the repo's front
door and its shipped skill were unreachable from its own graph. Deleting it to
satisfy a number would have undone an earlier gate's fix, which is why this was
recorded instead of decided. For the record, the always-loaded pair is smaller
either way: `CLAUDE.md` + `SKILL.md`, 26,835B → 26,577B.

**The lesson worth keeping is about gate design, not about this file.** A
byte-count gate over a file that is *also* required to carry orientation encodes
one of two competing goals and silently loses the other. A gate wants the
property, not the proxy.

---

## R4 — Harness

> ### Start here
>
> Seven items. **Do them in this order** — the reasons are dependency and cost,
> not preference, and a later item is not blocked by skipping an earlier one
> except where stated.
>
> 1. ~~**R4.2 + R4.3 — the harness tier.**~~ **DONE 0.16.41**, with a correction
>    below. `templates/bracket-commands.js`: 13 verbs, 4 red arms, 38s, and no CI
>    edit because the existing glob covered it. Its first run found that `vendor`
>    cannot run against a scene outside the workspace — `bun build` resolves
>    three from the entry file's directory.
>
>    **CORRECTED 2026-07-31: "the existing glob covered it" is true; "so it ran"
>    was not.** `gate.yml` fires on push-to-`main`, `pull_request` and
>    `workflow_dispatch` only. This bracket landed on a branch with no PR open,
>    so it had never executed in CI at all until it was dispatched by hand —
>    `gh run list --branch r4-harness` showed only `static` had ever run. Its
>    first unattended run then failed on five rows and found three real defects.
>    See item 3 for the inference to stop making. **Next: item 2.**
> 2. ~~**R4.4 — `--parity-fix`.**~~ **DONE 0.16.43.** `smoke.js --parity-fix
>    --from <canonical>`: source named and never inferred, malformed source or
>    target refuses, and every file validates before the first byte is written.
>    Twelve arms in `bracket-parity.js` at the time — **eighteen as of 0.16.47**,
>    when the write-path findings added six; do not cite either number, count
>    them. **Two of the original twelve were holes mutation
>    testing found** — the partial-write property had no arm that could see it,
>    and `refuses malformed source` passed with the guard removed. Both fixed.
>    Exercised twice on real corpora since (0.16.44, 0.16.45).
> 3. **R4.5 — the defect corpus. PARTIAL, 0.16.45. Not gate-blocking** — no R4
>    clause names the corpus, so its remainder is standing debt rather than a
>    thing between here and the gate. It was "where to start" while R4.1 was
>    deliberately deferred; R4.1 is no longer deferred.
>    `fixtures/defect-corpus/after-hours.html` is tracked, re-skinned, brought to
>    the current engine with `--parity-fix` (5 of its 7 fences had drifted), and
>    joined to the parity set with the decision recorded beside it. The decay
>    risk is closed — the fixture no longer lives only on one machine.
>
>    **Three things remain, in this order:**
>    - **The un-re-measured defects**, which the corpus README lists as
>      carried-over and UNVERIFIED rather than as properties of this build. That
>      labelling is doing real work: the **two** that were re-measured **both
>      moved** (`endcap` 0.94/peak 5.75 → 1.05/peak 6.79; the walker's 3.62 does
>      not reproduce, giving 3.12 and 3.30). Do not cite any of the rest until it
>      is re-run.
>
>      **This line said "ten of the twelve" and the two numbers count different
>      things.** The README's UNVERIFIED table has **twelve rows**
>      (`1, 2, 2b, 3, 4, 5, 5b, 6, 7, 9, 10, 10b`) because sub-lettered defects
>      stand alone there, while "twelve defects" folds each into its parent. Both
>      counts are defensible and neither is stated with its rule, so the corpus
>      README is the place to settle it — count the rows there rather than citing
>      a figure from here.
>    - **`bracket-corpus.js`** — nothing executes the corpus today. Parity checks
>      its fences; no check runs it. Do NOT solve this by adding it to the gate's
>      scene list; the reasoning is in `working-plan.md` and in the corpus README.
>    - **`bracket-noise.js` false-reds on macOS** (pre-existing, confirmed by
>      stashing against clean `HEAD`; passes on the Linux gate). A control that
>      cries wolf locally is one people learn to skip.
> 4. **R4.1 — extract `checkScene`. THE ONLY GATE-BLOCKING ITEM LEFT**, and the
>    reason it was deferred has expired: it was held back on 2026-07-31 because
>    refactoring the gate instrument at the end of a long session is how a
>    regression enters the thing that catches regressions. Start it fresh, which
>    is now.
>
>    `checkScene` measures **594 lines** (`smoke.js:278-871`, re-counted
>    2026-08-01). Its gate is byte-unchanged `smoke.js` verdicts on the same
>    corpus — **same machine, same backend, before vs after** — so capture the
>    baseline immediately before starting rather than citing the block above it.
>
> **R4.6 (retention) and R4.7 (portfolio grading) are continuous, not
> sequential.** Do them alongside: record a design question the day it is raised,
> grade a portfolio case the day its reach changes. Neither has a start date and
> both are gate clauses, and **both are now MET** — R4.6 by the cold-start run of
> 2026-07-31 (`a9b5d7d`, box at the end of this section), R4.7 by the grading
> pass in `plan.md` (`70051bf`). Their continuous half does not end with the
> gate: keep recording a design question the day it is raised and re-grading a
> case the day its reach changes, or the clauses pass once and rot.
>
> **If you only do one thing:** R4.1. It is the last thing between this branch
> and gate R4, and everything else listed here is standing debt that outlives
> this document. The un-re-measured defects are the best of that debt — a fixture
> nobody has measured is a fixture nobody can cite.
>
> **Before trusting any of this, run:** `bun run scripts/selfcheck.js`, every
> `scripts/bracket-*.js` and `templates/bracket-*.js`, and `smoke.js
> --parity-only` **cross-directory including `fixtures/defect-corpus/*.html`**,
> which is a ninth carrier as of 0.16.45.

1. **Extract `checkScene`.** ~595 lines (`smoke.js:269`-~862) holding ~11 checks
   over shared mutable `fails`/`warnings`/`noise`/`dropped`. Each check already
   has its own try/catch and its own name — it is a list wearing a function
   costume. Each becomes `(page, ctx) => ({fails, warnings})` driven from an
   array. **In place, not into files**: no new install-cache files, no new
   `require` edges, no new parity surface. The payoff is not tidiness — it is
   that a bracket can then drive one check directly instead of rebuilding the
   page setup, which is why `bracket-determinism.js` needs its whole length to test one
   thing.

2. **A harness tier below the chart tier — DONE 0.16.41** (`templates/bracket-commands.js`: 13 verbs, 4 red arms, 38s, skips reported not silent). (`working-plan.md`, **"Add a harness tier below the chart tier"** — cited by
   heading, not line: the 0.16.39 prune shifted every anchor in this file by ~140
   lines and nothing caught it). Run
   every `build.js` subcommand against one tiny scene; assert exit 0 and that
   the named artifact exists. `build.js` and `shoot.js` carry **zero** brackets between them — derive the
   sizes with `wc -l` rather than reading a number here, because the two written
   into this file went stale (827/18 against an actual 971/13) inside the
   document that states the never-hand-write rule. Cheapest test in the repo and it
   closes the command-never-run shape permanently. State what it is not: it
   checks the path executes, not that output is correct.

3. **`gate.yml` runs the harness tier — DONE 0.16.41, with no CI edit at all.** Naming it `bracket-commands.js` put it inside the existing `templates/bracket-*.js` glob, so it ran the day it was written and a future harness will too.

   > **AMENDED 2026-07-31. Globbed is not the same as runs, and this item made
   > that inference twice.** `gate.yml` triggers on push-to-`main`,
   > `pull_request` and `workflow_dispatch`. Branch work fires none of them — by
   > design, recorded in `gate.yml` itself as "branch work is now free until a PR
   > opens". So a bracket added on a branch is *covered by the glob and executed
   > by nothing* until a PR opens or it lands on `main`. Measured: this bracket
   > sat unrun from 0.16.41 until dispatched by hand the next day.
   >
   > **A second, worse instance sat in the same step.** The bracket loop ran
   > `bun run "$b"` bare under `bash -e`, so the first red bracket aborted the
   > step and its four siblings never ran — the same defect as the `!cancelled()`
   > one the step's own comment already documents, one level down, four lines
   > below its own postmortem. The history was recorded; the rule was never
   > generalised past the instance it came from.
   >
   > Both fixed in 0.16.42, with a runtime-assembled fixture proving the old loop
   > form hides a sibling and the new one does not. **The rule to carry: a
   > control is covered when a trigger fires it, not when a glob names it.** The prescription below (add a step) was the more expensive answer. No new workflow — the existing gate job
   gains a step. `sample.yml` stays manual-only and correct as designed;
   `static.yml` needs no change. **Name it `templates/bracket-commands.js` and
   no CI edit is needed at all** — `gate.yml` already globs
   `templates/bracket-*.js`, so it is covered the day it is written. That is
   strictly better than "the gate job gains a step", which this item used to say.

4. **`--parity-fix`: stop hand-editing six fenced blocks across eight files.**
   Measured 2026-07-30: **4,611 lines held byte-identical by hand** — KERNEL 151
   lines × 8 carriers, CHARACTER 278 × 3, SOLVER 113 × 7, DRIVER 111 × 7, RIG 83
   × 7, HTML 60 × 7.

   > **A seventh fence candidate, found 2026-07-31: the CONTRACT block.** It is
   > byte-identical across all **8** carriers (verified by hashing the block in
   > each), it names the window contract, and it sits **outside every fence** —
   > between `HTML-END` and `KERNEL-START`. So `--parity-fix` as scoped would not
   > propagate it and `--parity-only` does not check it. It was found the
   > expensive way: it carries a false sentence — *"That is what makes the HTML
   > loop and the MP4 render provably identical"* — which is wrong twice (nothing
   > proves it; invariant 5 says cross-backend frames are not byte-identical) and
   > which therefore has to be corrected in eight places by hand, with nothing
   > checking the eight agree afterwards. **Fence it as part of this item.** The
   > count in the paragraph above is short by one block for the same reason the
   > block is wrong: unfenced identical text is invisible to the tool that exists
   > to find identical text. This is DRY-by-*verification* in a repo that spent R0-R3
   moving to DRY-by-*construction*: `gearbox-neon.html` was a stored 1.14 MB
   duplicate and is now derived by one `sed`, on the argument that a claim should
   be executed rather than asserted.

   **Do NOT generate the scenes.** The examples are teaching artifacts — an agent
   reads `gearbox.html` end to end to learn how a film is built, and a file
   carrying `<!-- KERNEL injected here -->` teaches nothing. Generation would also
   make the tracked file stop being the shipped file, which is exactly what
   invariant 1 protects.

   **Do make detection able to propagate.** `smoke.js --parity-only` already
   computes both the divergence and the canonical text; it simply cannot write.
   `--parity-fix --from <canonical>` turns an eight-file edit into a one-file edit
   plus a command, with **zero change to any tracked or shipped artifact** —
   every scene stays complete and readable, and detection is untouched.

   Two conditions, both of which are the difference between this helping and this
   being a catastrophe:
   - **It must name its source explicitly and never infer a majority.** A fix that
     picks the wrong canonical file silently corrupts seven others — worse than
     the drift it repairs.
   - **It must refuse when the source's own fence is malformed**, with a bracket
     arm proving the refusal. A malformed fence makes a file *leave the parity
     set*, which is the documented way this check has already gone quiet twice
     while printing `ok` (see `bracket-parity.js`).

5. **The defect corpus — build it before the next instrument improvises another
   fixture.** `working-plan.md`'s *"Instrument brackets want a defect corpus, not
   per-instrument improvisation"* records that every instrument here was
   bracketed by hand-building a fixture and throwing it away, and it predicted
   its own failure: *"`circus.html` is currently the third such fixture about to
   evaporate."* **That prediction came true.** The prototype is in `internal/`,
   gitignored, on one machine, unbacked-up — and it is the only candidate
   reproducer for the open 1-in-6 `WEBGPU=metal` determinism failure, a use that
   does not survive the directory's loss.

   Keep a small corpus of scenes with **characterized defects at known
   timestamps**. A new instrument then has a positive control the day it is
   written, and a *regression* control the day someone changes it.

   **The scene to build it from is `circus`.** Change the theme, the character,
   the name, the opening title font and the style; set it somewhere else with a
   different character. **Keep the script** — content and captions can stay the
   same.

   That works because what the fixture is *for* is mechanical and none of it
   lives in the theme: ~60 seconds and 31 beats, multi-shot solver traffic,
   shadowed fur shells, the character rig. That combination is why it is the only
   candidate reproducer for the open 1-in-6 `WEBGPU=metal` failure —
   `noise-chart.html` failed to reproduce it in 15 runs precisely because it
   lacks them. So the beat count, durations, caption cadence and shot pattern
   carry over unchanged, and the instrument keeps its value.

   Two constraints on where it lands:

   - **NOT under `plugin/`.** Everything there ships into the install cache, and
     a deliberately defective scene must not reach users as though it were an
     example. `examples/` is teaching material; this is apparatus. A tracked
     directory outside the plugin subtree is the home.
   - **Decide its parity status explicitly.** A full scene carries the fenced
     blocks, so it either joins the parity set — adding a ninth carrier to the
     4,611 hand-held lines, which R4.4 is what makes that acceptable — or is
     deliberately excluded, in which case say so where the exclusion lives, since
     a file that silently leaves the parity set is the exact failure
     `bracket-parity.js` exists to catch.

   **The twelve characterized defects must be re-measured against the new build,
   not assumed to carry over.** They are mechanical and most should survive a
   re-skin, but "should" is not a measurement, and their timestamps will move if
   any beat duration does.

   **Items 4 and 5 are the same idea pointed at two costs** — 4 stops the same
   *work* being repeated, 5 stops the same *mistakes* being repeated. Neither
   makes anything new possible; both make the existing thing cheaper to keep
   correct, which is why they belong in the harness phase rather than in R5.

6. **Retention: what a session learns has to outlive the session.** The case for
   this is not theoretical, and the sharpest instance was found while writing
   this item.

   **A design discussion happened on 2026-07-30 and was recorded nowhere.** The
   owner asked whether the declarative tables would be better stored as
   structured data than as JavaScript, and stated a position — *"JSON isn't the
   right shape; is something else with some semblance of structure a better
   shape?"* It is absent from `docs/`, from `CLAUDE.md`, from `VISION.md`, and
   from the session log. A grep for it returns nothing. It survived only in a
   conversation transcript, which nothing routes to and no future session reads.
   **Recorded now as an open question** (below), which is the minimum, not the
   fix.

   **Second instance, 2026-07-31, and it cost three sessions to find once.** The
   owner asked why an exported MP4 would be expected to match an HTML render
   across machines of different speeds. Establishing the answer took a session of
   measurement; **two other sessions were independently asked the same question
   and re-derived it in parallel.** Three derivations of one finding is the cost
   this item exists to stop, and it is the sharpest measurement of that cost the
   repo has. The finding itself is recorded in its proper homes rather than here
   (`source-of-truth.md` routes it: the invariant to `CLAUDE.md`, the encoder
   scope to `references/recordings.md`, determinism's purpose already correct in
   `VISION.md`); the remediation is a working-plan track. What belongs *here* is
   why it was recoverable at all:

   - **The framing was inherited, not invented.** `docs/predecessor-record.md`
     carries the predecessor's own marquee claim four times — *"one scene file
     drives the live HTML loop and the frame-exact render alike"*, called "the
     property every instrument was built to check". That file is explicitly
     bounded as history. The sentence is not: near-identical phrasing is live and
     unqualified in `CLAUDE.md:56-58`, `docs/orientation.md:13-14`, and the
     CONTRACT block of **eight** shipped scene files. A frozen project's headline
     claim survived the rename while this project's purpose moved on.
   - **`VISION.md` was right the whole time** and says determinism is the
     measuring instrument. `method.md` says, in two section headers, that it
     exists to preserve video/HTML parity. `method.md` is the one read while
     building. Being correct in the document nobody opens at work time is not
     being correct.

   **Open question, recorded per the rule above rather than acted on: does this
   repo define its files by origin story where it should define them by
   function?** Raised by the owner 2026-07-31 from the `recordings.md` opening,
   and generalised from one concrete instance — `gate.yml`'s bracket-loop defect
   recurred four lines below the comment narrating its own earlier form, because
   the incident was preserved and the rule was never abstracted. **This is
   unmeasured.** The export sweeps were scoped to export framing and do not test
   it. The proposed instrument is a `selfcheck.js` ratchet counting
   version-citing comments that do not cite a postmortem — a proxy, and it should
   be counted before the thesis is trusted, including by whoever proposed it.

   Three retention channels exist and two work:
   - **Postmortems** — tracked as of this migration, in `docs/postmortems/`,
     checked by `selfcheck.js`. This one works.
   - **The CHANGELOG** — works, and is why history can be cut from `CLAUDE.md`.
   - **Design questions and fixtures** — no channel. The structured-data question
     evaporated; `circus.html` is evaporating (R4.5); and a cookbook of shape
     recipes was written once, cited from two shipped files *as though carried
     over*, was not carried over, and survived only because an archive audit went
     looking.

   `VISION.md` already names the shape of the answer: **capturing a pattern
   should be a side effect of making a film, not an act of discipline
   afterwards** — a flywheel where each film leaves the engine better equipped for
   the next. The mechanism is unbuilt and the argument is in
   [`pattern-ledger.md`](pattern-ledger.md), which counts how often a shape gets
   rebuilt and has **no way to extract one**.

   **One caveat on the "three sessions" figure itself, since it is the
   measurement this item rests on.** Three sessions did reach the finding, but
   they were not three independent derivations: one of the three documents is a
   *synthesis* that cites the others, and its convergence table ticks rows that
   originate in a single session. Only one of the three — the one that built a
   scene end to end and ran the instruments itself — is independent work. The
   cost is real and the retention argument stands; the number is softer than
   "three independent analyses" reads, and if that phrase gets cited later as
   evidence of anything, this is the correction it needs. `internal/analysis/`
   holds the documents and is **`(local)`**.

   **A fourth instance, produced accidentally on 2026-07-31, and the sharpest of
   the four because it has a measurable ground truth.** A squint-downscale
   comparison image was built for an eye check and handed out for independent
   review. Its difference panel was broken twice over: built while the two source
   images were still mismatched sizes, then amplified with a filter that pivots
   on mid-grey, which crushed a genuinely dark difference to a flat field.

   **Two independent reviewers read the flat panel as "zero difference", and both
   then used it to CONFIRM their reading of the other two panels**, concluding the
   methods were "entirely equivalent". The two images are **40.8 dB apart**, with
   a real structured difference (YAVG 16.9, YMAX 35). Neither reviewer could have
   caught it: they had the artifact and not the sources, so re-derivation was not
   available to them. Only the party who built it could.

   **The general form, and it sharpens the Victory Auditor lesson below rather
   than repeating it: agreement between independent reviewers is worth nothing
   when they share an input none of them can re-derive.** Independence is a
   property of the *derivation*, not of the reviewers. Two models, separately
   prompted, blind to each other, agreeing precisely — and the agreement carried
   no information at all, because it was agreement about a corrupted artifact.
   This is also why the "three sessions re-derived the ffmpeg finding" figure was
   softened above: convergence is only evidence when the paths are genuinely
   disjoint.

   Practical rule this earns: **an artifact built for someone else to judge gets
   a sanity assertion before it is sent** — for a difference image, that the
   panel is not uniform; for a table, that the numbers reproduce. The corrected
   image was verified varying (YMIN 16, YAVG 21, YMAX 131) before it went out the
   second time.

   **The fifth instance is the complement of the fourth, and together they give
   the usable rule.** The corrected image went to **four** independent readers
   with one question: which panels have antialiased edges and which are
   stair-stepped. They returned: *all clean* · *panel 3 aliased* · *panel 1
   aliased* · *all clean*.

   The measurement — fraction of edge pixels sitting strictly between their
   neighbours' extremes: 57.4%, 59.9%, **44.8%** — says panel 3 is the aliased
   one. **One reader of four was right. A majority vote returns "all clean",
   which is wrong**, and one reader was confidently wrong in the exact opposite
   direction. Weighting by model size would have picked the right answer here,
   but only the measurement tells you that afterwards, and a prior that needs a
   measurement to validate it is not doing the work.

   **All four caught something else, and every one of them was right:** the third
   panel's caption overlay reflows and changes what is visible at the bottom —
   reported as "a doubled banner", "lower, clipped", "taller, clipping the bottom
   tooth", and most precisely as "reveals a complete bottom tooth and a vertical
   post that the others clip". Four readers, one observation, no measurement
   needed, and it is the finding that independently rejects the native path for a
   second reason.

   **So weight independent agreement by the GRANULARITY of the claim.** These
   readers converged on a coarse, structural observation and diverged completely
   on a fine per-pixel judgment — of the same image, in the same pass. Agreement
   is evidence about layout, framing, whether a thing is present or clipped. It
   is not evidence about edge treatment, subtle tonal differences, or anything
   whose ground truth is a few pixels wide. **Ask outside readers what they can
   see, not what you can compute.** The aliasing question should never have been
   put to a reader at all; the composition question could not have been put to a
   metric, and answered itself in one pass.

   **A third instance, from outside this repo, worth keeping because its failure
   mode is one nothing here has hit yet.** A separate session investigated scenes
   built by a different multi-agent harness and found that harness's own audit
   declaring `VICTORY CONFIRMED` / `BIT-EXACT MATCH`, including a claimed
   reproduction of a `bracket-determinism.js` crash which does not reproduce when
   re-run. **The general form: stacking review layers does not substitute for any
   single layer re-deriving a number from the artifact.** Layer count reads as
   rigour and is not — three agreeing reviews of an unverified claim agree about
   nothing. This repo's defence is already written (invariant 6, red before
   green, measure don't assert); what it lacked was an instance where *review
   itself* was the thing that failed, and this is one. A related lesson from the
   same investigation: a diff between two copies taken at one snapshot cannot
   detect drift from an external baseline — it answers a different question than
   it appears to, and the same session's "nothing in the harness was modified"
   claim was true of the check it ran and false of the question it seemed to
   answer.

   Also in scope: **the disciplines this migration produced should become
   routine rather than remembered.** Red-before-green on every check edit; a
   cold-start run at each gate boundary (it is cheap and it found nine defects at
   R2, three at R3); `/audit-claims` pointed at `.claude/` as well as `docs/`;
   and the rule that a control must not contain the defect it injects, which cost
   three separate fixtures this session before it was written down.

7. ~~**Grade the test-case portfolio, and let it be refined rather than fixed.**~~
   **DONE 2026-07-31, in `plan.md` where it belongs.** Both halves: a `Reach`
   column on all nine cases (BUILT / in reach / near / beyond), a one-line
   blocker per unbuilt case naming what was checked, and four intermediate
   variants below the table. Graded against the tree, not against memory.
   **Three findings came out of grading rather than out of the grades:**
   `the-briefing` already ships two of its four requirements (SSS and rack
   focus), so it is narrower than "THE hard one" implies; `crowd-cross`'s
   instancing is proven only for **fur shell layers**, not for posed rigs, which
   is a design question rather than a port; and **`scene2d.template.html` ships
   to every installed user with no example exercising it** — all five examples
   carry the `RIG` fence. That last one is a hole the portfolio did not have a
   rung for, and now does.

   The original text follows, since the instruction is what the grades answer to.

   [`plan.md`](plan.md)'s nine-case portfolio is good and its opening line is
   right — *"diversity is the point: each case exists to break a different
   assumption."* Two things it lacks:

   - **Reach grading.** Nothing says which cases are *in reach today*, which are
     *just about there*, and which are *deliberately beyond* — so nothing tells a
     session which one to pick up, and the only signal is a parenthetical calling
     `the-briefing` "THE hard one". Grade every case, and expect the grades to
     move: a case that stays "beyond reach" for three phases is either mis-scoped
     or is naming a missing primitive, and both are findings.
   - **Variations between the rungs.** Nine cases is a coarse ladder over a wide
     space. A case that is one primitive away from an existing film is worth more
     as a next step than one that needs three — and those intermediate variants
     are exactly what does not exist today. **Two films and one chart are built
     against nine specs**, which is the measurement that makes this an R4 item
     rather than a nice idea.

   Keep it in `plan.md`, which owns it; **do not copy the table here.** What
   belongs here is the instruction to grade it and the note that the grades are
   expected to change — a portfolio whose entries never move is a wish list.

   **Open question, recorded so it stops evaporating: does any of the declarative
   layer want to be data rather than code?** `BEATS`, `SHOTS`, `SUBJECTS`,
   `STYLE`, the gait vectors and the lighting tables are all JavaScript object
   literals today. Owner position, 2026-07-30: JSON is **not** the right shape;
   the question is whether something with *some* semblance of structure is
   better. Unresolved, and it interacts with R5.2's enumeration of the
   declarative layer — enumerate first, since you cannot choose a shape for a set
   nobody has listed. This paragraph exists because the discussion itself was
   lost once already.

**Gate R4:** every **core and review** `build.js` verb exercised in CI —
**except `motion`, carved out by name** — with the export verbs reported as
deliberately skipped rather than counted missing

> **The `motion` exception, owner-agreed 2026-07-31, stated narrowly on purpose.**
> Review verbs cannot be exercised in CI while they shell out to an encoder, so
> this clause is satisfied by Track E1 moving them off it — `poster` and the
> three tilers, which are mechanical and checkable by "did the artifact get
> written". `motion` is excluded because its `DEAD_FLOOR` is calibrated against a
> scale that corresponds to no documented luma computation, so moving it is a
> calibration job rather than a port; carrying the threshold across unchanged is
> a measured ~150x error that silences dead-air detection entirely. Tracked as
> E1's `motion` bullet.
>
> **This is a carve-out, not a re-scope, and the difference is the point.** The
> clause still requires the review tier in CI; it names one verb, gives the
> reason, and points at the item that closes it. The rejected alternative was
> narrowing the clause to whatever passes today and relocating "review verbs
> exercised" into Track E's gate — which does not exist, so that would have
> deleted the requirement while looking like bookkeeping. **Write a gate before
> moving a requirement into it, never the reverse.**
(**amended 2026-07-31**: this clause read "every `build.js` verb exercised in
CI", which became unmeetable the moment export tooling was ruled out of the gate
— nine of seventeen rows skip by design and no encoder belongs in Actions. Left
as written it invites the next session to either install ffmpeg to satisfy it or
call the gate met while it is not; both undo the decision. The measurable form is
`working-plan.md` E5's tiered tally); `smoke.js` behaviour
byte-unchanged across the extraction (same verdicts on the same corpus); a fence
edited in one carrier and propagated by command lands byte-identical in every
other carrier, with the malformed-source refusal bracketed; every portfolio case
carries a reach grade; and **a design question raised in a session is findable
from `docs/` afterwards** — tested the only way it can be, by a cold-start agent
asked about one and reaching it without being told where to look.

> ### Cold-start findability: RUN 2026-07-31, clause MET, and it found something
>
> Two zero-context agents, two of the design questions this migration recorded
> *because they had evaporated* — the declarative-layer shape question and the
> origin-story question. Each was asked as a newcomer would ask it, deliberately
> **not** using the docs' own distinctive wording (or the test measures grep, not
> retention), and neither was told where to look.
>
> **Both reached a correct, complete, quotable answer** — owner position, date,
> analysis, prerequisites and triggers. The retention channel works: these two
> questions are exactly the ones that previously survived only in a transcript.
>
> **Both also reported the same failure, independently: the router did not get
> them there, and both nearly stopped at it.** `docs/README.md` had no row for
> either question. One won by grepping `declarative` — the repo's own word,
> guessed — and said plainly that "authoring tables" or "scene manifest" would
> have missed. The other's topic-word grep *did* miss, and it recovered only by
> switching to the repo's **epistemic** vocabulary, searching `open question`
> rather than any noun for the subject.
>
> **That convergence is admissible under this document's own rule.** Weight
> independent agreement by the granularity of the claim: these two agreed on a
> coarse structural observation about routing, not on a fine judgment, which is
> the case where agreement carries information. They also derived it
> independently — different questions, different search paths, no shared artifact.
>
> **Fixed the same day, in the cheapest place.** `docs/README.md` gains one row:
> unresolved design questions are filed under the exact phrase `Open question`,
> so grep the phrase rather than the topic. Verified as a real convention before
> routing to it — four instances across three files. This is the
> spine's first rule applied to itself: the correct move was already available
> and cost more than the mistake, so it lost.
>
> **"All identical" was the wrong word, checked 2026-08-01.** Three of the four
> are inline prose markers on a filed question
> (`restructure-2026-07.md` ×2, `working-plan.md` ×1); the fourth
> (`predecessor-record.md:1563`) is a **table column header**, which the grep
> finds and a reader following it does not get a question from. The row still
> routes correctly — the convention is real and the header is a near-miss, not a
> false positive — but a convention described as uniform when it is three-plus-one
> is the kind of claim this document exists to stop.
>
> **The clause is met as written** — they were not told where to look, and they
> reached it from `docs/`. Recording the margin anyway, because it was luck: the
> honest reading is that retention passed and routing failed, and only the first
> is what this clause measures.

---

## R5 — Capability

1. **The Track D batch, including the state seam.** `setCamera(t)` →
   `setCamera(state)` where `state` today contains only `{t}`
   (`working-plan.md`, **"Discipline has not held"**). Bundled with `STYLE.palette`,
   `CONFIG.name`/`titleCard`, `hide(obj,u)` owning the `1e-4` clamp, and
   `subjectFromObject` — all touching the same 8-9 carriers, so one cascade
   instead of five. Makes Phase 6's "zero modification" gate reachable by
   construction, and it is the seam a bake, a viewer, and an input driver all
   share. It gets several times more expensive after Phases 3 and 4, because
   face state and baked tracks will be authored as functions of `t` — that is
   what the signature invites.

   **One discipline, or `state` becomes a global with better manners**: the
   driver owns what goes in, and the kernel never reads anything the timeline
   driver cannot produce.

   **One hazard to fix while in there.** `gaitPose` defaults `rootX` to
   `rig.root.position.x` — it reads mutable scene-graph state, and is correct
   only because `root.position.x` is assigned on the line before it in
   `animate` (`menagerie.html:1496`/`1510`/`1525`). That is an ordering
   dependence inside `animate`, not a pure-function argument. It holds today and
   it is exactly what a bake refactor would trip over, so pass `rootX`
   explicitly as part of the same pass.

2. **`references/breakdown.md`** — enumerate the declarative layer. It exists,
   works, and is *"unnamed, unspecified, and unvalidated as a whole."* It was
   the #1 recommendation in two internal documents, costed at one afternoon and
   no code, and is a ranked item in none. `working-plan.md:1300` already cites
   "after the enumeration exists" as a revival trigger for something else — a
   trigger on a thing nobody scheduled.

3. **`build.js check`** — cross-reference validator over the tables that already
   exist: shot anchors land inside their beat, subject and focus names resolve,
   union shots use only wide rungs, captions fit at documented CPS,
   declared-versus-measured extents, `BEATS` sums to `DURATION`. Buildable
   today; *"would have caught at least three of this film's defects before a
   single frame rendered."*

4. **Amend `physics-bake-proposal.md` with the kinematic-body option.** As
   written, the declared impulse (`{beat:'hit', at:.3, impulse:[...]}`) is a
   literal restatement of the hand-matched constant it was meant to replace —
   the bake computes the hive's *consequence* correctly and still cannot tell
   anyone the bear's nose was there. Driving the closed-form character in as a
   **kinematic body** so Rapier computes the contact is still tier 1, needs no
   runtime simulator, respects all four red lines, and is what makes "did they
   touch" a computed fact. Record it; it does not have to be built now.
   Also record: a hive on a rope **is a joint**, so the corpus's flagship
   contact beat sits at the v1 scope line and v1 needs interpreting before it
   can be baked.

**Gate R5:** cross-directory fence parity green after the batch; every untouched
beat byte-identical or above the 70 dB bar on the three canonical edits
(`working-plan.md`'s **Regression-by-edit** case, itself still untested).

---

## Deliberately not doing

- **Mechanical coverage for `.claude/`** — deferred 2026-07-30, owner's call.
  0.16.40 found six stale claims there and the structural cause is real: those
  files carry no freshness marker *by design*, so `selfcheck.js` derives a set
  that excludes them and nothing checks the tree. `/audit-claims` routing at them
  is the only control, and it is a practice rather than a gate.
  **Two ways out, neither taken now:** build the coverage, or **decouple the
  rules into their own repo**, where they can be versioned and checked on their
  own cadence instead of riding a plugin's version cascade. The second is worth
  real consideration if the set keeps growing — a directory that governs agent
  behaviour and is exempt from every check is a strange thing to keep inside the
  artifact it governs.
  **Trigger to revisit:** a stale prior in `.claude/` produces a wrong verdict
  that reaches a commit, or the directory grows past what one review pass reads.

- **Repointing the six PR SHAs that moved in the re-sign.** Owner, 2026-07-30:
  *"if it's stale it's stale, I'm fine with that."* The threads on PR #2 cite
  pre-rebase hashes for six commits. The prose is correct, the links are not, and
  the PR is a narrative of a merged migration rather than a live index. Do not
  spend edits on it.

- **Renaming `templates/`.** It holds two kinds of thing, but it is already
  self-labeling (`*.template.html` versus tools; `bracket-` prefix). A rename
  costs the cascade, every doc pointer, CI paths and user habit to remove one
  inference made once.
- **Splitting `smoke.js`/`build.js` into files.** The repo's own argument
  against splitting `method.md` — a split creates a boundary to keep consistent
  — applies harder to code that ships. Measured: nothing in `templates/`
  truncates a default read.
- **Splitting `method.md`.** The truncation test the plan says was never run:
  996 lines / 52.7 KB, reads whole. The correctness argument does not apply.
- **`docs/decisions/`.** Two files is not a tier. Give them frontmatter.
- **Reorganising `internal/`** — retracted in R2.8. The last-copy question about
  the two frozen predecessors is still open and is the only live piece of it.
- **Splitting `site/` into its own repo.** Asked and settled 2026-07-30: no.
  The weight argument fails (tracked `site/` is 1.73 MB against `plugin/`'s
  6.18 MB, and 1.14 MB of it is one file), and CI already ignores `site/**`.
  Four couplings would break, every one of them a copy-or-pointer problem across
  a new boundary, which is the class this plan exists to fix:
  `site/posters/` is embedded by `examples/README.md` via absolute raw URL into
  every install cache; `scripts/stage-films.sh` would need a submodule or a
  duplicate, and duplication breaks films-tracked-once; **Netlify's build command
  IS `scripts/stage-films.sh`** (`site/netlify.toml`), so the site's build depends
  on a script outside `site/` — verified 2026-07-30 that it works from Netlify's
  base dir, and the neon variant now derives there; and `site/app.js` is the only
  evidence the window contract drives an external, non-monotonic consumer —
  which R4 wants closer to the tests, not further.
  **Trigger to revisit:** the site grows its own build step or dependency set,
  or needs a cadence that fights the version cascade, or stops consuming plugin
  artifacts. None is true today.
- **`site/app.js` hardcoding `DUR`/`BEAT_STARTS`** that `window.DURATION`/`BEATS`
  already publish, with `site/index.html:99-109` restating the same boundaries a
  third time as CSS percentages. Real, logged, not fixed this pass.
- ~~**Untracking `films/gearbox-neon.html`**~~ — **DONE in 0.16.35, so this
  belongs in the record rather than the not-doing list.** The test was run and
  paid: the neon variant differed from `gearbox.html` by exactly one line, so it
  is DERIVED by `stage-films.sh` and 1.14 MB — 66% of tracked site bytes — plus
  the only negated exception in `site/.gitignore` both disappeared.
  `bibles.md`'s "one object, one line" claim is now executed rather than
  asserted. 0.16.37 added `scripts/bracket-stage-films.js` over the derivation,
  after finding that a failed guard left the *previous* variant in place.

## Retirement

Delete this file when R5's gate is green. The CHANGELOG entries are the record;
a completed migration plan left in `docs/` is one more thing a future session
has to read to discover it does not matter.
