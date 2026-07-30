last updated: 2026-07-30

# Why this exists, and why in this order

`CLAUDE.md` has the rules. [`docs/plan.md`](docs/plan.md) has the architecture
and the phase gates. This file has the one thing neither of them says: **why
determinism comes first**, and what it is first *for*.

It is short on purpose. If it grows into a summary of the plan, delete the
summary. Where it gestures at something, the file that owns it is linked:
[`docs/addressing.md`](docs/addressing.md) for `t`,
[`docs/physics-bake-proposal.md`](docs/physics-bake-proposal.md) for what a bake
may and may not do, [`docs/pattern-ledger.md`](docs/pattern-ledger.md) for how
patterns get promoted.

## The goal

An **engine**, its **primitives**, the **abstractions** that let you say what you
mean instead of how to compute it, the **tooling** that builds and ships it, and
the **harness** that proves all of it — enough that an agent can turn **any
context** into a scene, reliably.

Not "a tool that makes films." Films are how the engine gets proven: every
shipped example demonstrates that a layer works and fails loudly when it does
not.

But proving is not the point either. **The point is that the films land** — that
a gag reads without captions, that a contact looks like impact rather than
clipping, that a mechanism becomes obvious in motion when it was opaque in prose.
The three review axes exist because "it renders" and "it works" are different
claims, and the second one is the one anyone cares about. Determinism is what
makes the second claim checkable; it is not a substitute for it.

> This supersedes the framing in `plan.md`'s Risks section, which read "mitate
> ships films" and fenced engine-shaped work as scope creep. That fence was
> written to protect against building a game engine nobody asked for, and it is
> still right about *that*. It was wrong to describe the destination.

## Determinism is not a constraint. It is the instrument.

The easy reading is that purity is a price paid for nice properties — byte
comparison, one file serving both the page and the render. True, and far too
small.

**A generator that produces a different result every run cannot be evaluated by
watching it run.** Every observation is of a different object. The only way to
ask "did that do what I intended" is to hold one output still, inspect it, hold
another still, and compare.

So the frozen, reproducible scene *is the measuring device*. Not the thing you
give up something for — the thing that makes any later question answerable at
all. Simulation, physics, interactivity: none of them can be developed against a
system that cannot be held still, because there would be no way to tell a bug
from the intended variety.

That is the ordering. Determinism first, because everything after it is
unfalsifiable otherwise.

**And it does not get outgrown.** Because it is a property of the *mapping*
rather than of the process, adding a generator upstream costs nothing. You do not
graduate past determinism; you keep using it, on the output of each new thing you
add.

## `t` is a coordinate, and state is what a driver emits

`t` is a position, not a clock: an address you evaluate, not a cursor you
advance. Nothing asks what time it is, only what the scene looks like at this
address. Any `t`, any order, any number of times, the same pixels.

Determinism is a property of the **mapping** from `t` to pixels — not of the
process that produced the mapping. That distinction is what makes the rest
reachable:

| driver | emits | the test |
|---|---|---|
| timeline (today) | `{t}` | same state twice → same pixels |
| a recorded run | `{t, baked}` | unchanged |
| a viewer | `{t, view}` | unchanged |
| an input driver | `{t, …}` from events | unchanged |

A simulation is a **generator of mappings**. Each run produces one. Recording
freezes one. Once frozen it is an ordinary scene, and the whole instrument stack
applies to it unmodified. That is the bridge, and `t` is the interface it hands
back.

**The table is a shape, not a roadmap.** Only the first row exists. The others
are what the shape admits, and whether any of them gets built — or whether the
useful direction turns out to be something not listed — is genuinely open. What
the shape buys is that finding out later costs a signature change rather than a
rewrite. `docs/addressing.md` works this through properly, including what the
position-encoding literature in machine learning does and does not transfer.

One honest limit: a recording gives you an oracle for *that run*, not for the
generator. Nothing yet tells you a simulator is right — that needs a different
kind of instrument, property- or distribution-shaped rather than byte-identical,
and this project has never built one.

## What we are actually building: declarative layers

Look at what already exists and the pattern is obvious. You declare, and the
system works out the consequences:

| layer | you declare | you do not author |
|---|---|---|
| `BEATS` | named spans | timestamps |
| `SHOTS` / `SUBJECTS` | "medium shot on the bear" | camera coordinates |
| `STYLE` / bibles | the look, as one object | per-material values |
| lights | where light comes from | what is lit, and when |
| gait | a proportion vector | leg keyframes |
| **interaction** | — | **hand-coded, every time** |

That last row is the gap, and it is what Phase 4 is really for — its constraints
and its four red lines are in
[`docs/physics-bake-proposal.md`](docs/physics-bake-proposal.md). A physics bake is
not a feature; it is the declarative layer for interaction, the way lighting is
one for illumination. Declare mass and solidity, let the system work out what
happens when things meet, instead of hand-tuning three sine waves that approximate
a swing.

It must be **opt-in and per-object**, never a global mode. Wanting a character to
clip through a wall as a joke, or gravity set to Mars, is a legitimate authoring
decision — "cede control here, keep it there" is the interface.

**And it is premature until the layer beneath it is named.** The declarative
layer that already exists is, in this project's own words, *"substantial, it
works, and it is unnamed, unspecified, and unvalidated as a whole."* Adding
another layer on top of tables nobody has enumerated, validated by nothing, buys
a capability with no foundation. Enumerate first.

## How it gets better

An engine that only grows when someone remembers to generalise will not grow.
Every reference here exists because a person noticed the same problem twice and
wrote it down — `film-language.md` is shot grammar someone kept re-deciding,
`materials.md` is surface behaviour someone kept re-deriving.

**So capturing a pattern should be a side effect of making a film, not an act of
discipline afterwards** — a flywheel where each film leaves the engine better
equipped for the next one. The mechanism is unbuilt and the argument for it is in
[`docs/pattern-ledger.md`](docs/pattern-ledger.md), which counts how often a
shape gets rebuilt and has no way to extract one.

The cost of not having it is on record: a cookbook of shape recipes was written
once, cited from two shipped files as though it had been carried over, was not
carried over, and survived only because an archive audit went looking.

## How to tell if this is working

Not "are there more features." These:

- A change to a scene either matches the last run byte-for-byte or it does not,
  and the difference is *localisable*.
- A claim in this repo can be re-derived by running something, not by trusting
  prose.
- A new capability reuses the kernel, the characters, the materials and at least
  one instrument **without modification** — that is Phase 6's gate, and it is the
  real test of whether the layering was ever true.
- A session arriving with no context can find what it needs and act correctly.

The last one is measurable and gets measured. The others are the reason the first
one has to hold.
