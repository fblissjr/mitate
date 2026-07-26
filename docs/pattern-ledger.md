last updated: 2026-07-25

# Pattern ledger: how many times have we built this

[Promotion](plan.md#promotion-what-enters-the-skill-and-in-what-form) sets
triggers like "second instance" and "third consumer". **Nothing counted
instances, so none of those triggers could fire.** This file is the counter.

It exists because of a specific failure the corpus already contains: the
scale-gate presence idiom appears as `clamp(sc,.001,1)` in `bear-and-bees` and
as `Math.max(1e-4, …)` in a later film, seven times in that one file. Two
spellings of one idea, in two scenes, neither aware of the other, and nothing
recorded the collision. Left alone that produces individually good scenes that
each paid full price for the same thing.

## The inverse rule, which is the important half

The promotion model asks *did this earn a place in the kit*. The more dangerous
question is the reverse:

> **An agent will reach into an example scene and copy a pattern, because that is
> the fastest path and the reward is immediate — the copy works and smoke goes
> green. Promoting it costs a chart, or three carriers, or a version cascade.
> Copying wins on local reward every time.**

And the design invites it. `SKILL.md` and `examples/README.md` both index by
*film* — "the regression film", "the comedy short" — so an agent needing "how do
I gate a prop's presence" has exactly one move: open a scene and read it. There
is no pattern-level index, and **no rule anywhere tells a reader that unfenced
code in an example is that film's private solution rather than sanctioned
practice.** The fences mark what *is* shared; nothing marks what is not.

So:

> **Reading an example scene to learn a technique is a bug report against the
> references.** Examples demonstrate finished films. References teach patterns.
> Needing the former to get the latter means a reference is missing something —
> log it here rather than only solving it.

That log is the input the promotion triggers consume, and it is already being
produced: every film handoff names what its author built twice. What was missing
is that nobody aggregated them, and the reports live in gitignored `internal/`.

## The ledger

Count is *independent solutions of the same shape*, not usages. Disposition
names where it went, or why it has not moved.

| shape | count | where seen | disposition |
|---|---|---|---|
| **contact measured, not inferred** | **6** | 5 recorded in `instruments.md` as a recurring class, + the 2026-07-25 film | `build.js probe` — plan item A1. Trigger long past; earn-in blocked it because its bar was "a film was blocked" and this shape is *not blocked, reliably wrong* |
| **declared extents rot; measured ones do not** | **6** | 3 predecessor films cropped their own payoff; 3 of 5 hand-computed extents wrong on the 2026-07-25 film | `subjectFromObject` — Track D, promoted. The predecessor *specified* the fix and it never shipped, while a code comment claimed it had |
| **presence gating (scale gate)** | **2 spellings** | `bear-and-bees` (`clamp(sc,.001,1)` + a `visible` flip); 2026-07-25 film (`Math.max(1e-4,…)`, ×7) | `hide(obj, u)` kit helper — Track D. Two spellings is drift, not reuse; that is what justifies a helper, not the seven copies in one file |
| **transition windows under-sampled** | **2** | 0.5.1 review (which shipped the `window.SHOTS` export for it); 2026-07-25 film, ~1% continuity coverage | `build.js transitions` — plan item A2. The export exists; the sweep does not |
| **per-shot camera energy** | **1** | `bear-and-bees` wanted `locked` for the hush while the film wanted `steadicam`; went all-locked | Open carry-forward. Same shape as the viewer's camera-delta seam — design them together |
| **built (non-DOM) text** | **1** | 2026-07-25 film: a stroke alphabet, 3 bugs, all "one letter on a wrong assumption" | Deferred. Enters at the **chart tier** when it lands — a grid of 36 glyphs exposes that bug class at a glance; a title card cannot |
| **multi-station travel** | **1** | 2026-07-25 film: chained `lerp`s over a `LEGS` table | Deferred — register-specific to the presenter explainer, which is one commission, not a committed register |
| **row/grid layout of unequal items** | **1** | 2026-07-25 film: centred on an accumulator instead of the row's own span; ran through a character's torso | Deferred at 1 |

## Reading the counts

The two 6s are the finding. Both were **past every trigger the promotion model
sets**, both had a fix specified, and both were still unbuilt — one of them with
a shipped code comment asserting the check existed. A count that nobody
maintains is the same as no count, which is why this file is tracked while the
handoff reports that feed it are not.

A shape sitting at 1 is not a failure. It is the ledger working: the entry costs
a row, and the row is what makes the *second* instance visible as a second
rather than as a fresh idea.

## Maintaining it

- A film handoff that names what its author built twice → add or increment a row.
- Copying a pattern out of an example scene → add or increment a row, and say
  which scene. That is the borrow record; without it the count is unrecoverable
  and the next author starts from zero.
- Promoting a shape → set its disposition. Do not delete the row: the count is
  the evidence for why the promotion happened, and
  [source-of-truth.md](source-of-truth.md) requires a promotion to name its
  origin.
