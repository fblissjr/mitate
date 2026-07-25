last updated: 2026-07-24

# Where truth lives

One rule generates the rest: **every fact has exactly one home, chosen by
asking where the next person who could break it will be standing.** Every
other surface points at the home. Nothing restates.

## The homes

| kind of fact | canonical home | everyone else |
|---|---|---|
| line-local invariant (a tick that guards determinism, a flag that renders black) | the comment ON that line | references may summarize and point in |
| method, discipline, failure modes — "how to fish" | `plugin/skills/mitate/references/*.md` | SKILL.md and code comments point, never re-teach |
| measured numbers and brackets | the one reference that owns the subject, with a date | code comments name the phenomenon, not the figure |
| routing and workflow order | SKILL.md | — |
| what a check can and cannot see | `references/instruments.md` | smoke.js comments say how, not what-it-means |
| repo invariants that bite on first edit | CLAUDE.md | — |
| history — what happened and why | CHANGELOG.md and git | docs speak present tense only |

## The rules

- **A number appears once.** Re-measure it → update its home plus a CHANGELOG
  line. Finding the same figure in two places is itself the bug — delete the
  copy, don't sync it.
- **Every reference carries a provenance header**: what it is canonical for,
  and when it was last verified against the code. A capability claim without
  a verification date is a rumor.
- **Incident records are canonical in code.** "This reached `git add` once"
  belongs on the line it scarred, forever; docs may cite it, never own it.
- **When code and doc disagree, neither wins by default.** The newer audit
  date says which is more likely stale; the fix updates the home and deletes
  the copy.
- **Drift detection is scheduled, not heroic.** A change that touches code a
  reference describes gets a `doc-claim-auditor` pass (shipped in
  `.claude/agents/`) over that reference before commit.

Born 2026-07-24 — the day one session found the same figure stale in four
files, and a reference confidently describing a mechanism the stack never
had.
