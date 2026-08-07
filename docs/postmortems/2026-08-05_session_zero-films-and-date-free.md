---
mode: session
scope: zero-films-and-date-free
date: 2026-08-05
summary: Executing the zero-films move surfaced three tool paths that 0.20.0's "every pointer moved" claim had missed and no CI run had exercised (nothing was pushed), and the date-scrub landed with its enforcement inverted red-first — the shipped skill now carries only current state, with the verification record and the snippet-harvest teaching debt both filed repo-side.
artifacts:
  - scripts/selfcheck.js
  - scripts/bracket-selfcheck.js
  - scripts/stage-films.sh
  - plugin/skills/mitate/references/instruments.md
  - docs/shipped-provenance.md
  - docs/working-plan.md
  - docs/README.md
  - site/index.html
  - site/app.js
  - internal/log/log_2026-08-05.md
  - 401c1ed
  - 2a0f547
  - a7e8184
  - 91fcabe
---

# Postmortem: zero-films-and-date-free

Session mode — the same day's second act, distinct in scope from
`2026-08-05_session_cold-mining-and-option-e.md` (the mining and the E
batch), so a sibling file rather than an annotation. The owner's two
directives, mid-evening: the plugin ships **no example scenes at all** — a
shipped film gets copied instead of learned from; examples exist for the
maintainer to learn patterns from, and the skill must teach through
current-state prose and tested snippets — and **nothing under `plugin/`
carries dates, amendment notes, or decision history**, because loaded
context is for the consuming agent, who only needs what is true now — the
verification record those headers carried moved to
`docs/shipped-provenance.md`.
Landed as 0.21.0 (`401c1ed`), 0.22.0 (`2a0f547`), 0.22.1 (`a7e8184`) and
the site repair (`91fcabe`); the day's log (`internal/log/log_2026-08-05.md`)
carries the narration.

## 1. What went well

**The inversion of a check landed red-first, with its first bracket arm.**
`scripts/selfcheck.js` check 4 flipped from requiring dated provenance
headers to failing on any ISO date under `plugin/` — observed red on 26
real dated lines mid-scrub, green earned only when the last was converted.
The new check walks the filesystem rather than `git ls-files`, and the arm
added to `scripts/bracket-selfcheck.js` proves exactly that (an untracked
dated fixture fires it). The prior day's forward item — expect the cascade
trigger to interact with in-flight version bumps — was applied rather than
re-learned: the one arm that reported MISSED mid-batch was diagnosed as
the uncommitted-bump artifact, and the full bracket ran 30/30 green
post-commit.

**Three parallel scrub agents left nothing behind, and their reports were
themselves useful.** Twelve shipped markdown files scrubbed under tight
rules (trust labels survive dateless; routing edges survive; measurements
keep numbers, lose dates; no new untested code), verified by grep and by
the inverted check going green. The agents' flags were real findings, not
noise: a shipped reference citing the showcase player by repo path
(invariant-3 debt, fixed as 0.22.1 in
`plugin/skills/mitate/references/instruments.md`), a stale
mechanism claim in bibles, and the three snippet-harvest candidates now
filed in `docs/working-plan.md`.

**The site defect was found by verifying before fixing.** The staging
pipeline (`scripts/stage-films.sh`) was reported broken; a clean Netlify
simulation proved it working, which redirected the search to the page —
where the real defect sat: `crash.html` staging and serving with no card
and no entry in the player's film map, a preview button that would have
been silently dead (`site/index.html`, `site/app.js`). The card's figures
were derived from the scene's own `BEATS` table, not copied from prose.

## 2. What did not go well

**0.20.0's "every pointer moved in the same batch" claim was overstated,
and nothing had caught it.** Five shipped brackets and selfcheck's
three-pin scan still resolved films from the shipped examples path — the
stamp scan had silently narrowed to one film the day the corpus moved,
and to zero today. No check went red because the paths were only
exercised by CI on push, and nothing was pushed. Structural: a check
whose scan set is a directory literal narrows silently when content
migrates out from under it; check 2 now derives its set from the corpus
home (`scenes/`), which survives the next move.

**The `| tail` habit fired again, on the control for the new check.** The
mid-batch bracket run was piped through `tail` with the exit code echoed
after — reporting the filter's status, the exact defect this repo's own
records keep re-finding. Caught in the same breath and re-run unpiped,
but "caught immediately" is not "did not happen."

**The freshness-marker known-limit cost a third party a discovery.** The
records commit passed the pre-commit hook (which cannot see the pending
commit, by design), leaving two markers stale for every subsequent
selfcheck run — found not by this session but by a subagent whose
constraint list forbade touching them. The limit is documented; the cost
of it landing on whoever runs selfcheck next was not.

## 3. Deviations from the plan

| Planned | Shipped | Verdict |
|---|---|---|
| Scrub shipped examples and every reference to them (owner directive) | That, plus repair of the three tool paths 0.20.0 had left half-dead | Grew by discovery — the repairs were prerequisites, not scope creep |
| Scrub dates/history from `plugin/skills/` (owner directive) | Whole-of-`plugin/` scope: README and agent file included, enforcement inverted, ledger created | Widened deliberately — a rule that covers only one subtree of the shipped payload invites the drift back in through the rest |
| Owner interview: strip fully, record moves out; scrub now, harvest per-scene | Executed as answered | — |
| Site: "fix the website so it shows the films" | Pipeline verified working; the page was fixed (crash carded, film map entry, claims re-scoped) | The reported symptom and the actual defect differed; verification before repair is what caught that |

## 4. Escapes

- **The half-dead bracket paths escaped 0.20.0's batch.** The check that
  should have caught them: the gate's bracket loop — green-but-unrun,
  because nothing was pushed between the corpus move and today. Selfcheck's
  cited-path check could not see them: it resolves paths in comments, not
  code. Caught by executing the follow-on move carefully rather than by
  any control.
- **Did the scope add checks? Yes.** Check 4's inverted form carries the
  recorded claim that a dated annotation under `plugin/` cannot land
  unnoticed, and its bracket arm proves the filesystem walk (delete the
  arm and an untracked dated scratch file becomes invisible until staged).

## 5. Forward items

1. **The next session builds and reviews portfolio scenes — `boss-intro`,
   then the 2D-explainer rung — before any "good enough, move on" call**,
   and each scene's close-out runs three named steps: the film field
   report, the snippet harvest (`docs/working-plan.md`'s standing row),
   and — for a cold build — the scene-analysis comparison against the
   market-crash baseline. Checkable: the next scene's close-out either
   shows all three or refutes this item. `docs/README.md`'s work-next row
   now leads with exactly this.
2. **Snippet-harvest debt is paid only from instrument-green scenes.** The
   three filed candidates (instanced-field outline pass, `normalBias`
   shadow fix, physical/SSS demo) either gain snippets lifted from a real
   scene's passing code or stay filed. A snippet authored freestanding
   into a reference refutes this item.
3. **The first push after this session is the first CI exercise of the
   moved bracket paths.** If the gate goes red on any
   `templates/bracket-*.js` fixture resolution, section 2's repair claim
   was incomplete — annotate here. If it runs green, the claim held under
   the only test that matters.

   **RESOLVED 2026-08-07: it ran green, and the claim held.** The push
   landed 2026-08-06T00:53Z; gate run `31061108002` reports
   `every bracket ran (8), all green` with every fixture resolving from
   `scenes/`, and static run `31061108001` is green alongside it. Nothing
   in section 2's repair was incomplete.

## 6. Annotation, 2026-08-07 — what a verification pass found afterwards

A re-derivation of this batch's own prose (the `/verify-written-claims`
procedure, run over `c4f7990..HEAD`) confirmed twelve claims and refuted
nine, landed as 0.22.2. Two of them bear on this postmortem directly:

- **Section 1's "26 real dated lines mid-scrub" is unverifiable and the
  changelog's version of it was wrong.** The pre-scrub tree carried **40**
  dated lines across 12 files
  (`git grep -nE '20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]' 2a0f547^ -- 'plugin/'`).
  This file's "mid-scrub" wording is consistent with 26 being a
  partial-progress reading; `CHANGELOG.md` promoted the same number to
  "before the scrub", which it never was. Corrected there.
- **Section 3's "README and agent file included" was true of the rule's
  scope and false of the edit's.** `plugin/agents/film-reviewer.md` was
  never touched by the scrub — it carried no dates, so it fell out of a
  working set defined by what check 4 matches — and it was consequently
  the one shipped markdown file with no row in the ledger the batch
  created. Its first end-to-end verification (2026-08-07) found three real
  drift items, including a mechanism claim false on the only corpus scene
  that exercises it. **The generalisable finding: a scrub whose file set is
  "what the check matches" is narrower than the rule the check enforces**,
  and the gap is invisible precisely because the check is green.
