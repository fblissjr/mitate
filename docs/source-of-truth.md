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
| measured numbers and brackets | the one reference that owns the subject, with a date **and its conditions** | code comments name the phenomenon, not the figure |
| routing and workflow order | SKILL.md | — |
| what a check can and cannot see | `references/instruments.md` | smoke.js comments say how, not what-it-means |
| repo invariants that bite on first edit | CLAUDE.md | — |
| history — what happened and why | CHANGELOG.md and git | docs speak present tense only |


**A measurement that crosses a boundary must carry its method, not just its
value.** Added 2026-07-25 after a bare figure — "calls=71, distinct=71, passes"
— was published as a boundary finding without stating that the probe counted
*before* the call it was measuring. It reached a shipped `instruments.md` entry
and outranked a local control that had already disproved it, because a specific
number with no visible method reads as more authoritative than a result whose
softness you can see. One clause would have prevented it.

The rule has two halves and they fail independently. **Receiving:** an external
number without its conditions does not get to outrank a control you already
ran. **Sending:** state the conditions, or the number will be trusted past its
warrant by someone with no way to check. The date requirement above exists for
the same reason; conditions are the other half of it.

**And the same rule applied to reproducibility: a bracket that cannot be re-run
from a clean checkout does not get recorded as a bracket.** The 2026-07-25
instance was caught only because a re-run refuted it — and the harness was
re-runnable by accident, having depended on scratch files that were already
deleted. It survived a housekeeping pass that could as easily have removed it.
Make the harness self-contained when the measurement is taken, where it costs a
minute; a claim you cannot re-derive is trusted past its warrant whether the gap
is in its method or in its reproducibility.

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
