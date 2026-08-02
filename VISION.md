last updated: 2026-08-02

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

**And not a template library.** A template is a finished thing you fill in. It
solves one film and rots on the second, because the next film is not that film.
What this is for is the pair of problems a template cannot hold together —
**consistency**, so the same idea is not rebuilt differently in every film, and
**the hand-rolled case**, so a film can still do something nobody anticipated. A
primitive earns its place only if it serves both.

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

## Determinism is the instrument, not the point

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

### Two claims, and only one is load-bearing

These get conflated, and the conflation is how a useful instrument turns into
dogma.

- **Reproducibility** — the same inputs produce the same scene. This is the
  property. It is what makes evaluation possible, and it does not bend.
- **Byte-identity** — one *technique* for measuring reproducibility, with a
  stated validity scope. `CLAUDE.md` invariant 5 already limits it to a single
  backend, because two backends legitimately disagree per pixel.

Where the technique's scope runs out, the claim survives and the measurement
changes. A bake replayed is byte-identical; the same bake recomputed under a new
solver version will not be, and that is not a determinism failure — it is where a
tolerance-shaped oracle becomes the right instrument. The bake proposal already
treats re-bake identity as its own question rather than assuming it.

**The guard against dogma is a magnitude.** A check that reports only pass or
fail cannot tell a scene that renders a *different film* from one that moved a
single pixel by a single bit — and treated as equal, the second spends the
credibility the first depends on. A difference should be reported with its size
and its location. That is also what makes a failure actionable rather than merely
alarming.

## `t` is a coordinate; `state` is what a driver emits

`t` is a position, not a clock: an address you evaluate, not a cursor you
advance. Nothing asks what time it is, only what the scene looks like at this
address. Any `t`, any order, any number of times, the same pixels.

Determinism is a property of the **mapping** from state to pixels — not of the
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
position-encoding literature in machine learning does and does **not** transfer:
the mechanism does not, because nothing here compares two positions.

### `state` is the intermediate layer. The window contract is not.

Worth being exact, because the design depends on the difference.

- **The window contract** is an interface *for tools*. It is deliberately thin,
  and the thinness is the whole value: any scene is interchangeable for any
  other because no tool knows a film's internals. Widen it and that dies.
- **`state`** is the value a driver hands the kernel. It is where meaning
  accumulates, and the table above is its growth plan.

`setCamera(t)` became `setCamera(state)` in 0.16.62. That was `state` acquiring
its first named parameter — the seam a bake, a viewer and an input driver all
widen. The contract does not move when they do, which is the point of having two
layers instead of one.

### Scene position and presentation time are not the same coordinate

They are fused today: playback advances `t` in real seconds. Separate them — `t`
addresses the scene, and a second mapping decides how fast an observer moves
through it — and slow motion, holds, speed-ups and timelapse become
**declarative** instead of authored into the beats.

That matters beyond convenience once anything is simulated. If a bake is computed
at scene-position resolution, how fast someone watches it cannot change what
happened. Leave the two fused and playback speed is a physics parameter, which is
exactly the coupling this project exists to remove. A warped coordinate already
exists as one of the addressing frames; the separation at the presentation layer
does not.

**One honest limit.** A recording gives you an oracle for *that run*, not for the
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

### Where a declaration lives is not decided, and it is not a detail

The table says *what* you declare. It does not say where the declaration lives,
and today the answer is: as JavaScript object literals inside the shipped
artifact, replicated into every file that carries them. That came from a tool for
building explainer videos. Nobody here chose it.

It belongs in this file rather than in the plan because **"declarative" is a
claim about structure**. If a declaration cannot be read, validated or rendered
independently of the artifact that embeds it, the claim is about authoring style
instead — and the difference shows up as work: blocks held byte-identical across
every carrier, a tool to propagate them, and a control to police that tool. The
parity run reports the size of that tax on every invocation. It is not small, and
it grows with every example added.

The direction was written down before this project had its current name, and it
has already been applied three times: **make the implicit thing data, then make
the tooling read it.** `BEATS` made timing data, and timing became retimeable.
`SHOTS` made camera data, and framing became solvable. `FRAME` made the frame
data, and vertical and square output became first-class — each one previously
impossible by construction, whatever an author wrote. The same record names the
shape it should take: **data and a small compiler, not an abstraction layer.**

It has never been applied to geometry or motion, which is where most of a film
actually is.

**Open, with a position and an ordering.** The position: JSON is not the right
shape, and whether something with more structure is remains the question. The
ordering is the one this file already applies — enumerate the layer before
choosing a representation for it, because you cannot pick a shape for a set
nobody has listed. The question is filed under `Open question` in
[`docs/restructure-2026-07.md`](docs/restructure-2026-07.md), which is where it
lives; this file says why it matters, not what to do about it.

## The shape a primitive has to have

Two failure modes bound the design, and naming them is more useful than naming a
technology.

**A closed vocabulary rots.** If the only expressible things are the ones someone
anticipated, the first film that needs something else either cannot be made or is
made by escaping the system — and once authors escape, the consistency the
vocabulary existed for is gone.

**An unstructured one cannot be checked.** Nothing can validate a declaration
that has no shape. That is why declared extents rot, why a hand-written subject
table can disagree with the geometry it describes and nothing notices, and why a
NaN can make one instrument fail loudly while another goes silently all-clear on
the same run.

Both are avoidable at once, and the existence proof is already in the tree.
`buildCharacter(P, matFor)` takes a fixed proportion vector — a real schema — and
a **function** for materials. From that one constructor, `menagerie` builds a
bear, a human and an invented strider. Structure at the seam, arbitrary code in
the leaf.

That is the rule to design to: **schema where things connect, code where things
are specific.** It is not a language to learn and it is not a template to fill
in.

A primitive earns its place when it makes a **pair** of things travel together
that were previously re-derived apart — a biped and its gait, a shot size and the
camera math that realises it. The test is not "is this reusable" but *does using
it make the next film's version consistent with this one, without forbidding the
film that needs something else.*

## What this is all for

Today, staging a character tripping over another moving character means computing
the outcome by hand: where each one is, how fast, with what stride and what mass,
where the contact lands and what it looks like — then tuning until it reads, and
re-tuning every one of those numbers when any single one changes.

The destination is that you declare the bodies and the intent and the system
works out the consequence — the same move lighting already made, and the reason
the bake is described as a declarative layer rather than a feature. Determinism
is what makes it reachable: a computed consequence is only trustworthy if you can
hold it still and check it, and only useful if it does not change under you
between runs.

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
  and the difference is *localisable* — reported with its size and its position,
  not as a bare verdict.
- A claim in this repo can be re-derived by running something, not by trusting
  prose.
- A declaration can be validated **before a frame is rendered**.
- A new capability reuses the kernel, the characters, the materials and at least
  one instrument **without modification** — that is Phase 6's gate, and it is the
  real test of whether the layering was ever true.
- A film that needs something the vocabulary cannot say can still be made, and
  the gap is visible afterwards rather than silently absorbed.
- A session arriving with no context can find what it needs and act correctly.

The last one is measurable and gets measured. Two of the others are currently
**false** — nothing validates a declaration ahead of rendering, and a determinism
failure reports no magnitude. They are listed because a criterion you fail is
worth more than one you have quietly dropped.
