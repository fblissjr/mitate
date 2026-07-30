last updated: 2026-07-30

# Which doc answers which question

A router, not a summary. A summary here would be a second copy of everything it
points at, which is the failure this repo keeps finding — see
[`source-of-truth.md`](source-of-truth.md).

**Nothing in `docs/` ships.** An install cache holds only what lives under
`plugin/`, so these files are for people and agents *developing* mitate. A
reference that needs to reach an installed user goes in
`plugin/skills/mitate/references/` instead.

| If you are asking | Read | When |
|---|---|---|
| what is this project for, and why determinism first | `VISION.md` *(planned)* | first, once |
| what is `t`, and why is it addressed by beat | [`addressing.md`](addressing.md) | before changing anything about time, seeking, or the bake |
| what is the architecture, and what gates each phase | [`plan.md`](plan.md) | before starting anything phase-shaped |
| what should I work on next | [`working-plan.md`](working-plan.md) | at the start of a work session |
| where does this fact belong | [`source-of-truth.md`](source-of-truth.md) | before writing the same thing twice |
| has this shape been built before | [`pattern-ledger.md`](pattern-ledger.md) | before proposing a primitive or a fence |
| what may a Phase 4 bake do, and what may it never do | [`physics-bake-proposal.md`](physics-bake-proposal.md) | before any bake code |
| what did the predecessor already measure | [`predecessor-record.md`](predecessor-record.md) | when tempted to re-measure something. 2,770 lines — exceeds a default read window, so read it in ranges |
| why is the repo shaped like this, and what is mid-migration | [`restructure-2026-07.md`](restructure-2026-07.md) | while that migration is open; it deletes itself when done |
| should examples live in the plugin | [`examples-placement.md`](examples-placement.md) | only if reopening that decision |
| what went wrong, and what we learned | [`postmortems/`](postmortems/) | newest first — later entries correct earlier ones |

Two more homes are outside this directory and are the ones most often wanted:

- **The invariants that bite on a first edit** — `CLAUDE.md` at the repo root,
  which also carries the full map of scripts, workflows and agents.
- **The vocabulary** — `plugin/skills/mitate/references/glossary.md`. It ships,
  because a term used inside the subtree needs a definition reachable from
  inside the subtree.
