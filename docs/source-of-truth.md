last updated: 2026-07-30

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
| **render-side** facts — backends, determinism, node stack, per-frame cost | `references/webgpu-stack.md` | — |
| **delivery-side** facts — shipping the scene itself: bundle size over the wire, hosting and mount policy, posters | `references/delivery.md` | — |
| **recording-side** facts — formats, encoders, decode cost, what GitHub renders inline | `references/recordings.md` | — |
| repo invariants that bite on first edit | CLAUDE.md | — |
| **why determinism comes first**, and what it is first for | `VISION.md` | `site/` is a POINTING SURFACE for this and no other fact — it restates the vision for a public reader, in a different register, and must be reconciled against `VISION.md` whenever either moves. A restatement, never a second source |
| history — what happened and why | CHANGELOG.md and git | docs speak present tense only |
| **a check's pass criterion** | the code that implements the check, beside the flag or constant it governs | CI config and session logs POINT; they never restate it |
| **what a session did** | `internal/` session logs, one per day | a finding worth keeping is promoted to a postmortem; the log is narration and is not cited by tracked content |


**Render, delivery and recording are separate domains and must not share a
home.** They measure different things and their figures collide: a "2.3x" exists
in two of them — the renderer backend speedup (`webgpu-stack.md`) and an AVIF
encoder-effort ratio (`recordings.md`) — and a consolidation pass nearly merged
them as duplicates of one fact. When a figure could belong to more than one, say
which side it is on.

The delivery/recording line was drawn in 0.16.38, and it is the line between
**the artifact and a copy of it**: `delivery.md` owns shipping the scene, which
is what happens on any surface that can run one; `recordings.md` owns producing a
lossy copy, which exists solely because GitHub will not render an mp4 inline. One
file previously held both under a single provenance header that said "UNKNOWN —
never audited", which was true of the inherited encoder measurements and false of
this repo's own measured brotli figures sitting beside them.

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

## A code comment may not assert what another file does

The boundary every claim-defect in this repo has crossed. Stated as a rule
because five instances shared it and none was careless:

> **A code comment may assert what its own line does. It may not assert what
> another file does.** A claim about another file's behaviour belongs in the
> reference that owns the subject; the comment points and does not restate.
> Anything else is a claim that cannot be checked from where it lives.

The instances: a solver comment asserting *"the extent check in smoke.js is what
catches it"* when there is no extent check; a shipped example citing a probe tool
that has never existed in any generation; `build.js` naming a docs path belonging
to a different repository; a workflow header carrying a verification criterion
owned by a script, until the two contradicted each other; and a KERNEL comment
asserting that different noise tracks are independent when a quarter of the pairs
alias exactly.

**Two halves, and only one of them is decidable.** Whether a claim about
behaviour is *true* needs a reader. Whether a cited path *exists* does not, so
`scripts/selfcheck.js` checks that half on every commit — path-shaped citations
and bare filenames in a provenance frame, both measured for precision before
being trusted. The other half is what `doc-claim-auditor` is for.

## Never hand-write what a command produces

The rule that generalises every copy-defect found while executing the 2026-07
migration, and the one that would have prevented four of them outright.

> **If `selfcheck.js`, `--parity-only`, `git` or `ls` can answer it, prose points
> at the answer and does not restate it.** A number that is not written cannot be
> wrong.

`CLAUDE.md` asserted "`references/` (9)" while `selfcheck` derived the same
number on every run; the assertion was wrong one commit after it was written. It
also carried a fence-carrier count, "all three brackets" when there were four,
and a fourth membership list for the window contract. All four were deleted
rather than corrected, because correcting a copy only resets its clock.

**This outranks writing a check.** Guarding a copy is O(n) in copies and each
guard is one more thing that can misfire — five did, every one of them failing to
tell *carrying* a fact from *describing* one, which is a limit of text matching
rather than a series of accidents. Deleting the copy is O(0) and cannot misfire.

Prose still carries rules, rationale and design arguments. Those are not
derivable, and they do not rot the way a count does.

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
