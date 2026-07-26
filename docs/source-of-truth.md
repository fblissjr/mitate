last updated: 2026-07-25

# Where truth lives

One rule generates the rest: **every fact has exactly one home, chosen by
asking where the next person who could break it will be standing.** Every
other surface points at the home. Nothing restates.

## The homes

| kind of fact | canonical home | everyone else |
|---|---|---|
| line-local invariant (a tick that guards determinism, a flag that renders black) | the comment ON that line | references may summarize and point in |
| method, discipline, failure modes — "how to fish" | `plugin/skills/mitate/references/*.md` | SKILL.md and code comments point, never re-teach |
| measured numbers and brackets | the one reference that owns the subject, with its date, conditions, and a re-runnable harness | code comments name the phenomenon, not the figure |
| routing and workflow order | SKILL.md | — |
| what a check can and cannot see | `references/instruments.md` | smoke.js comments say how, not what-it-means |
| repo invariants that bite on first edit | CLAUDE.md | — |
| history — what happened and why | CHANGELOG.md and git | docs speak present tense only |


**A number travels with its provenance, or it gets trusted past its warrant.**
One rule, three facets — a bracket carries its **date** (above), its
**conditions** (how it was measured), and its **reproducibility** (a harness
that runs from a clean checkout). A claim you cannot re-derive is soft in a way
the reader cannot see, whether the gap is in the method or in the ability to
run it again.

It fails in both directions, independently. **Sending:** state the conditions,
or someone with no way to check will rank your figure above their own result.
**Receiving:** an external number missing its conditions does not outrank a
control you already ran. Make the harness self-contained when the measurement
is taken — a minute there, unrecoverable later.

Worked instance: CHANGELOG 0.16.2.

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
