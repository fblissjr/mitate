---
mode: session
scope: rep4-and-the-omission-audit
date: 2026-08-08
summary: Every instrument's first catch this session included its own author — REP4's warn caught the teaching template's wrong extent the hour it ran, the review then found four bugs in the warn itself, and the audit skill this session extended for other files was itself not run until the owner asked.
artifacts:
  - docs/representation.md
  - docs/plan.md
  - docs/controls.md
  - docs/pattern-ledger.md
  - docs/working-plan.md
  - plugin/skills/mitate/templates/build.js
  - plugin/skills/mitate/templates/bracket-extents.js
  - plugin/skills/mitate/templates/scene.template.html
  - plugin/agents/film-reviewer.md
  - .claude/skills/audit-claims/SKILL.md
  - scripts/bracket-selfcheck.js
  - .github/workflows/static.yml
  - fixtures/defect-corpus/README.md
  - internal/log/log_2026-08-08.md
  - CHANGELOG.md
---

# Postmortem: REP4 and the omission audit (2026-08-08 session)

Session scope: REP4 (the representation track's extents phase) taken as the
next unblocked front while the cold build stays blocked on a plugin-only
session; an owner-directed audit of `plugin/agents/film-reviewer.md`
mid-session; the 0.28.0 release, its code review, and the two patch releases
the review and an owner ruling produced (0.28.1, 0.28.2, plus the
environment-axis doctrine commit `df95dca`).

## 1. What went well

**Doctrine-first design left almost nothing to decide.** REP4's binding terms
were already recorded — `docs/representation.md` decision point 4 (derive the
base, name the adjustment, declare-and-compare rejected) and the phase gate in
`docs/plan.md` (red on the corpus fixture before any shipped scene is touched)
— so the session's only fresh choices were warn-versus-error and scope, and
the severity followed from `check`'s own recorded severity rule rather than
argument. The mechanism landed in one pass (`1f610e3`). Structural version: a
decision written down at decision time converts a design session into an
implementation session.

**The mechanism's first run caught shipped content, including the file that
teaches the form.** `scene.template.html` declared `h:3.6` while the knot's
measured bounding box is 4.788 tall — every FS shot overflowed the frame by a
quarter — the ninth independent instance of `docs/pattern-ledger.md`'s
declared-extents-rot row, found the hour the warn first ran (`1f610e3`).

**The owner's two mid-session questions each redirected the work more cheaply
than any planned step.** "What's NOT in there" turned a clean drift audit of
`plugin/agents/film-reviewer.md` (zero drifted claims) into an omission audit
that found the real exposure — `check` and `probe` routed to no axis, and no
control naming the file at all (`1f610e3`). "New class of adversarial run, or
a check-on-a-check that will drift?" sized 0.28.2 as a round axis plus a
derived census instead of standing meta-machinery (`a285dd4`). Structural
version: the complement of a passing audit (what is absent, what would drift)
is a different question from the audit, and it takes someone asking it.

**Red-first held under recursion.** 0.28.1's four fixes were each reproduced
as a failing bracket arm against the committed 0.28.0 before the fix
(`f9b412e`); 0.28.2's census was watched red under a phantom-state mutant
before being trusted (`a285dd4`); the quiet arms of `bracket-extents.js` were
proven fallible under a deliberately over-firing mutant. The discipline
survived being applied to fixes of the thing it had just been applied to.

**The review loop earned its run on consecutive days, on the same class of
code.** Nine findings against the 0.28.0 diff, four of them live-verified
correctness bugs in the brand-new scanner (`f9b412e`) — the day after the
same loop found two confirmed bugs in the brand-new readback discriminator.
Structural version: a mechanism's first external review is worth more than
its author's adversarial round, and both days' evidence says schedule it
between commit and push, which is where it ran.

## 2. What did not go well

**0.28.0 carried four scanner bugs past an adversarial round that followed
the day's own new doctrine.** The round varied the environment axis as
yesterday's postmortem prescribed, and still missed: quoted entry names (an
adjacent cell to the quoted *keys* it did test), the mutated-table coupling
(unreachable by any input-shaped fixture), array-index literals (no quiet
fixture used indexed derivation, because no shipped scene does), and a
garbled sentence in the standing footer that the author read repeatedly
without seeing (`f9b412e`). Structural version: fixture families inherit the
author's corpus and the author's reading; adjacency in fixture space is where
variants hide, and your own output prose is something you can no longer read.

**The session's own claims needed the same instruments it was building.** The
first corpus sweep said "all five" 3D films warn when `check`'s own reader
found seven — a grep pattern over declaration spellings, the exact
derive-with-the-instrument class the repo already documents — caught by the
claims pass before the number reached prose (`docs/working-plan.md`'s queue
row records the correction).

**`/audit-claims` was not run until the owner asked, at session end.** Three
sibling passes ran unprompted — `doc-claim-auditor` twice, the
written-claims derivation pass, the code review — but the one skill whose
founding premise is "nothing made the pass happen, so it didn't"
(`.claude/skills/audit-claims/SKILL.md`) repeated its founding failure in the
session that extended its routing for other files. When run it found one real
drift: `.github/workflows/static.yml`'s comment describing the corpus's
check-visible signature as one warning, invalidated by the landing hours
earlier. Structural version: adding a surface to a control's scope is not the
same act as running the control, and the second does not follow from the
first.

**A control fixture one day stale.** `scripts/bracket-selfcheck.js`'s
pin-skew arm hardcoded the version that was a skew when written; yesterday's
pin bump made the mutation a no-op and the arm reported its checker MISSED.
Found incidentally by running the full static tier, confirmed pre-existing
against a clean-HEAD worktree, fixed by deriving the skew from the current
pin (`f687a8e`). Structural version: a fixture that names its subject's
current value goes stale the day the subject moves; derive the neighbour.

## 3. Deviations from the plan

| Planned | Shipped | Verdict |
|---|---|---|
| REP4 mechanism, red-first on the corpus fixture, per the recorded gate | Warn in `check`, `bracket-extents.js`, fixture red observed before any shipped scene changed (`1f610e3`) | As planned |
| Template migration in the same session, corpus films queued | Both templates; the base template was itself the first catch | As planned, with an unplanned finding |
| Film-reviewer drift check (owner, mid-session) | Zero drift; omission audit closed six gaps; `audit-claims` routing gained `plugin/agents/*` and both READMEs (E4 settled) | As directed; grew, each step owner-prompted |
| (not planned) 0.28.1 | The review's four scanner bugs and two doc findings, each closed red-first (`f9b412e`) | Review-driven; the release exists because the review ran before the push |
| (not planned) 0.28.2 and the class naming | Enter-through-the-verdict and the host-state sweep in `docs/controls.md`; census derived, watched red (`a285dd4`) | As directed, sized by the owner's round-axis-versus-meta-check cut |
| Environment-axis decision (offered at session start, decided in parallel) | Ruled and written into `docs/controls.md` (`df95dca`) | As planned |

## 4. Escapes (tests)

**The four 0.28.0 scanner bugs, by which control should have caught each:**
quoted entry names — a missing fixture one cell from a tested one (quoted
keys), the classic near-miss; the mutated-table coupling — green-but-blind by
construction, since no input fixture can reach a host-state bug, which is
what promoted the host-state sweep to doctrine and the state census to a
standing arm (`docs/controls.md`, `a285dd4`); array-index literals — a
missing quiet fixture, because the fixture family mirrored the shipped corpus
and no shipped scene derives through an index yet; the garbled footer — not
test-shaped at all, output prose has no oracle, and the review (a cold
reader) is the instrument that caught it. All four fixes now stand behind
arms with recorded delete-claims (`plugin/skills/mitate/templates/bracket-extents.js`,
13 arms plus the census).

**The pin-skew arm staleness was an escape from yesterday's session**, not
this one: 0.27.0's bump battery did not include the static bracket tier
locally, and nothing had been pushed to make CI run it. The escape window was
local-only and one day wide (`f687a8e`).

**The corpus fixture's check signature changed and its own documentation
kept up, but a workflow comment did not** — `.github/workflows/static.yml`
described the fixture's check output as a single warning; the extent warn
made it two. Caught by the late `/audit-claims` run, fixed in the same
commit as this file. `fixtures/defect-corpus/README.md` had been updated in
the landing itself; the workflow comment was in no route this session walked
until the audit ran — which is the audit's argument.

## 5. Forward items

- **`tableSource` has exactly one caller (`tableValue`), measured this
  session.** If a second caller appears in `build.js`, the
  enter-through-the-verdict class is recurring in the file that named it —
  checkable with one grep, and the finding would argue the prose rule needs a
  mechanical form. Refuted if a second caller lands with a verdict-respecting
  justification written at the site.
- **The cold build now installs ≥0.28.2 and its scene analysis should measure
  the warn's reach**: if the built film ships bare extents AND the transcript
  shows `check` ran, the warn was seen and not taught — rewrite the message,
  not the mechanism. Refuted if the film ships derived extents or never runs
  `check`.
- **Corpus film migration is enforced by its queue row** (`docs/working-plan.md`):
  the next corpus-film edit that lands without paying that film's migration —
  visible as the film still warning under `check` after the edit — refutes
  the row's on-next-touch mechanism and argues for the own-session sweep
  instead.
- **The film-reviewer agent's next drift check has a control**: `audit-claims`
  now routes at `plugin/agents/*`, so a `build.js`/`smoke.js` behavior change
  that lands without a film-reviewer pass is checkable in retrospect from the
  skill's own routing table. Refuted if the next such change shows the
  routing was read and the pass still skipped — which would mean routing
  lines do not produce runs, and the skill needs a hook, not a bullet.
