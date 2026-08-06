last updated: 2026-08-05

# Pattern ledger: how many times have we built this

[Promotion](plan.md#promotion-what-enters-the-skill-and-in-what-form) sets
triggers like "second instance" and "third consumer". **Nothing counted
instances, so none of those triggers could fire.** This file is the counter.

It exists because of a specific failure the corpus already contains: the
scale-gate presence idiom appears as `clamp(sc,.001,1)` in `bear-and-bees` and
as `Math.max(1e-4, …)` in a later film — the count is in that shape's row below,
not restated here, because this sentence carried "seven times" while the row now
reads eleven and neither had been re-counted since it was written. Two
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

The design invited it until 0.21.0, when the plugin stopped shipping films
at all — an installed agent now has no scene to copy from, only references
and templates. Repo-side the pressure survives in `scenes/`: the corpus
still indexes by *film* — "the regression film", "the comedy short" — there
is no pattern-level index, and **no rule anywhere tells a reader that
unfenced code in a corpus film is that film's private solution rather than
sanctioned practice.** The fences mark what *is* shared; nothing marks what
is not.

So:

> **Reading an example scene to learn a technique is a bug report against the
> references.** Examples demonstrate finished films. References teach patterns.
> Needing the former to get the latter means a reference is missing something —
> log it here rather than only solving it.

That log is the input the promotion triggers consume, and it is already being
produced by the **film field report**: after building a film, the builder
writes up what they had to build twice or re-derive from scratch, and those
write-ups are what this ledger counts. One real instance exists so far — the
2026-07-25 report from the circus-film build, distilled into
[`postmortems/`](postmortems/); the raw reports lived in gitignored
`internal/` until 0.16.33. What was missing is that nobody aggregated them.
(Older records call this a "film handoff" — renamed here 2026-08-04 when the
unrelated next-session handoff memo was retired, so one word stops meaning two
things.)

A second, partial firing on 2026-08-04 is worth grading precisely (the
market-crash cold build; its transcript `(local)`). The step
**fired by name** — the session announced "let's do the film field report"
unprompted, first evidence the 0.19.2 closing step reaches a builder who never
read this repo — but what it then wrote was a delivery note (what the film
shows, how to retime it), not the three bullets: no built-twice, re-derived,
or copied-from-example line, not even as an explicit "nothing to report". The
content would likely have been near-empty (the build read no example scene at
all), but "fired in name, form not followed" is the honest grade, and no row
increments from it. One datapoint on the step's wording; the next film is the
second.

The report's form follows the builder's record: a session log section, a
postmortem, or a note delivered with a commission all count, and no separate
file is mandated. As of 2026-08-04 the producer side is the method's own
closing step (`references/method.md`, "The last step of a film"), so a builder
following the method produces one without being asked; the executable consumer
is `/extract-patterns`, which reads finished work and proposes rows here. The
builder reports; this file and its maintainers grade.

## The ledger

Count is *independent solutions of the same shape*, not usages. Disposition
names where it went, or why it has not moved.

| shape | count | where seen | disposition |
|---|---|---|---|
| **contact measured, not inferred** | **6** | 5 recorded in `instruments.md` as a recurring class, + the 2026-07-25 film `(local)` | `build.js probe` — plan item A1. Trigger long past; earn-in blocked it because its bar was "a film was blocked" and this shape is *not blocked, reliably wrong* |
| **declared extents rot; measured ones do not** | **6** | 3 predecessor films cropped their own payoff; 3 of 5 hand-computed extents wrong on the 2026-07-25 film `(local)` | `subjectFromObject` — Track D, promoted. The predecessor *specified* the fix and it never shipped, while a code comment claimed it had |
| **presence gating (scale gate)** | **2 spellings** | `bear-and-bees` (`clamp(sc,.001,1)` + a `visible` flip), ×1 tracked; `fixtures/defect-corpus/after-hours.html` (`Math.max(1e-4,…)`, **×11**, counted 2026-08-02 — this row said ×7, then said the spelling was local-only) | `hide(obj, u)` kit helper — Track D. **The trigger stands**: two spellings is drift, not reuse, and that is what justifies a helper. **Both spellings are tracked**, so this row rests on nothing local: the ×11 is re-countable by anyone with the repo. It does not raise the count — the corpus fixture is a re-skin of the 2026-07-25 film with the script unchanged, so it is the same instance carried into the tree, not an independent rebuild. Promote as its own change with its own red, not bundled |
| **transition windows under-sampled** | **2** | 0.5.1 review (which shipped the `window.SHOTS` export for it); 2026-07-25 film `(local)`, ~1% continuity coverage | `build.js transitions` — plan item A2. The export exists; the sweep does not |
| **per-shot camera energy** | **1** | `bear-and-bees` wanted `locked` for the hush while the film wanted `steadicam`; went all-locked | Open carry-forward. Same shape as the viewer's camera-delta seam — design them together |
| **built (non-DOM) text** | **1** | 2026-07-25 film: a stroke alphabet, 3 bugs, all "one letter on a wrong assumption" | Deferred. Enters at the **chart tier** when it lands — a grid of 36 glyphs exposes that bug class at a glance; a title card cannot |
| **multi-station travel** | **1** | 2026-07-25 film: chained `lerp`s over a `LEGS` table | Deferred — register-specific to the presenter explainer, which is one commission, not a committed register |
| **row/grid layout of unequal items** | **1** | 2026-07-25 film: centred on an accumulator instead of the row's own span; ran through a character's torso | Deferred at 1 |

## Reading the counts

The two 6s are the finding. Both were **past every trigger the promotion model
sets**, both had a fix specified, and both were still unbuilt — one of them with
a shipped code comment asserting the check existed. A count that nobody
maintains is the same as no count, which is why this file is tracked while the
field reports that feed it are not.

A shape sitting at 1 is not a failure. It is the ledger working: the entry costs
a row, and the row is what makes the *second* instance visible as a second
rather than as a fresh idea.

**Check a `(local)` label before trusting it — five rows still carry one, and at
least one was wrong.** `fixtures/defect-corpus/after-hours.html` is a re-skin of
the 2026-07-25 film in which *the script did not change*, so evidence recorded
here as living only on one machine may in fact be sitting in the tracked tree,
countable with a grep. That was true of the presence-gating row and was found
only because someone counted. The remaining rows citing that film — contact
measured, declared extents, transition windows, built text, multi-station
travel, row/grid layout — have **not** been re-checked against the fixture, and
each needs checking on its own rather than as a batch: the fixture carries the
script, not the surrounding film, so a citation may or may not have survived the
re-skin.

The distinction that matters when one does survive: a re-skin is the **same
instance carried into the tree**, so it makes the evidence re-runnable without
raising the count. `(local)` is a claim about where evidence lives, and the rule
it serves is that a claim may cite a local artifact but must not rest on one.
Getting it wrong in the direction found here is the benign one — it understates
what is checkable. Getting it wrong the other way rests a promotion on something
nobody else can run.

## Maintaining it

- A film field report that names what its author built twice → add or increment a row.
- Copying a pattern out of an example scene → add or increment a row, and say
  which scene. That is the borrow record; without it the count is unrecoverable
  and the next author starts from zero.
- Promoting a shape → set its disposition. Do not delete the row: the count is
  the evidence for why the promotion happened, and
  [source-of-truth.md](source-of-truth.md) requires a promotion to name its
  origin.

## The flywheel this ledger is only half of

Owner's direction, 2026-07-30, and the strongest unbuilt idea in the project.

This file **counts** — how many times a shape has been independently rebuilt, so
the promotion triggers in `plan.md` have something to fire on. Counting is the
cheap half. The expensive half is noticing a pattern *while making a film* and
getting it out of that film and into a reference where the next one inherits it.
Today that depends on an author being reflective at the end of a long build,
which is exactly when nobody is.

> **The skill should capture reusable generalised patterns as a side effect of
> use, not as an act of discipline afterwards.**

Two shapes it could take, and they are not exclusive:

- **A prompt in the workflow.** The review step already asks what went wrong.
  It could also ask what got built twice, or what a future film would want —
  and offer to write it where it belongs.
- **A command that extracts.** `build.js patterns <scene>` or similar: read a
  finished film, surface the things that look like generalised technique rather
  than this film's own solution, and propose which reference each belongs in.

**A third property, owner's direction 2026-07-31, and it is the one that makes
the other two work: it must be RUNNABLE ON WORK YOU DID NOT DO.** A command
taking a scene *or a session*, handed to a different agent than the one that
produced either — my work given to another session, that session's work given to
me, a third harness's scenes given to both.

Both shapes above quietly assume the party who built the thing also runs the
extraction. That is the assumption to break, and this file already contains the
reason: *"Today that depends on an author being reflective at the end of a long
build, which is exactly when nobody is."* The author is not merely tired — they
are the **worst-positioned observer**, because they felt the necessity that
produced each choice and therefore cannot easily see which choices were general.
A session with no investment in them can.

The corpus evidence is unambiguous and was gathered independently of this idea:

- The prototype's defects — the count is not restated here; `fixtures/defect-corpus/README.md` explains why it cannot be checked — came from a **single** independent <!--count-mention-->
  `film-reviewer` pass on a film its author had already reviewed over eight
  look-and-edit rounds and shipped. It found almost nothing the author had
  considered and dismissed, and nearly everything they had never looked at.
- On 2026-07-31 a session had an independent no-context pass review *its own
  postmortem*, which found that postmortem's flagship claim false.

**One constraint that falls out immediately: it PROPOSES, it never writes.**
Extraction that writes is how this becomes the fifth place a fact can live, which
`source-of-truth.md`'s one-home rule forbids. Proposing also settles part of "who
decides where it lands" — the command surfaces candidates and names a destination;
the session or owner holding the one-home rule disposes.

Why it matters more than it sounds: the predecessor's procedural cookbook —
eight worked shape recipes — was written once, cited from two tracked files as
though it had been carried over, and was **not carried over**. It survived only
because an archive audit went looking. That is the failure this closes: a pattern
that exists, is known to be good, is referred to as though it is shipped, and is
one directory deletion from gone.

**The precedent is cinematography.** Nobody argues about whether shot sizes
belong in a reference. `film-language.md` exists because someone noticed the same
framing decisions recurring and wrote them down once. Shape recipes, gait
families, contact staging, material behaviour under a palette — all the same
move. The flywheel is making that move cheap enough that it happens by default.

**Not scoped, deliberately.** It needs a design pass: what counts as a pattern,
who decides where it lands, and how it avoids becoming a fifth place a fact can
live. `source-of-truth.md`'s one-home rule is the constraint it must satisfy, not
an obstacle to route around.

### The flywheel ran manually on 2026-07-31, and its output is already at risk

A parallel session did the whole loop by hand: built a scene end to end, reviewed
it with `film-reviewer` and found six defects, wrote a postmortem, had an <!--count-mention-->
independent no-context pass review *that postmortem* (which found its own
flagship claim false — a `probe` measurement projecting a hand-declared constant
rather than the live geometry it claimed to measure), then investigated a
different AI harness's scenes against source and produced a consolidated
patterns / anti-patterns list.

**That list is this flywheel's output, produced by discipline rather than by
mechanism** — at the end of a long build, which is the condition named above as
exactly when nobody is reflective. It is an existence proof that the loop yields
something real, and the strongest argument yet for not leaving it to willingness.

**And it lives in `internal/`, which is gitignored.** So a set of extracted,
reviewed, cross-checked patterns is one directory deletion from gone — *the
identical failure this section cites as its own motivation*, re-enacted the same
week it was written down, with a fresh instance. The predecessor's cookbook
survived only because an audit went looking; nothing is currently looking for
this one.

Two consequences for the design pass, both empirical rather than speculative now:

- **"What counts as a pattern" has a worked example.** That list is real material
  to design against instead of a hypothetical, and it was produced without any of
  the tooling proposed above — which bounds how much tooling the answer needs.
- **The promotion path is the missing half, not the noticing.** The session
  noticed fine. What no mechanism did was move the result anywhere durable, and
  the count in this file must not absorb those instances either: they come from
  scenes outside this corpus, so folding them in would break what the number
  means (see the entry conditions above).

## Open question: when does a pattern need its provenance, and when is that noise?

Owner-raised 2026-08-01, and it is a **session of its own** rather than a task.
Filed here because this file is where attribution policy actually bites.

**The position that prompted it:** note the pattern and use it if it works. We do
not always need to say exactly where it came from. That is not laxness — it is a
claim that provenance has a cost and should be paid when it buys something.

**Today produced evidence for it, by accident.** A pass removing references to one
local prototype rewrote ~33 citations across ten files. The ones that rewrote
cleanly were the ones stating a *lesson* — a threshold, a defect class, a rule.
The ones that read badly afterward were the ones **resting on the artifact**:
"we know X because that scene did X." That is a usable diagnostic and it fell out
of doing the work rather than out of designing a policy:

> **If removing the citation breaks the claim, the claim was leaning on the
> artifact rather than on the finding.**

### What the session has to decide

- **When citation earns its cost.** A measured figure needs a source you can
  re-run. A shape that has been rebuilt three times needs a count. A technique
  that simply works needs neither — and today the repo treats all three the same.
- **Cross-scene generalizations, which the current model cannot express.** The
  ledger counts *independent solutions of the same shape*, one row per shape. But
  the most valuable findings may be assembled from several scenes and belong to
  none of them: not "scene A did this", but "A, C and D each did part of this and
  the general form is X". A row with one origin cannot hold that.
- **Which citations are safe to make at all.** Public repo. A local prototype is
  not a citable source for a public claim, whatever it taught — and the fix is
  not a careful label, it is writing the finding so it does not need one.
- **How to mine example scenes, and against what.** Reading a finished film for
  technique is one method. Others: diffing scenes against each other for
  convergent solutions, reading session logs and postmortems for what an author
  said they built twice, and running an instrument across the corpus to find a
  shape nobody named. **These have never been compared** — `/extract-patterns`
  implements the first, and nothing establishes it is the best of the four.

### Why the process is part of the deliverable

Owner's framing, and it matches the flywheel section above: the value is in the
findings *and* in working out what makes sense. That argues for running the
methods against the same corpus and comparing what each surfaces, rather than
picking one and writing it up as doctrine.

**Prior art in this repo to start from, not to re-derive:** the flywheel section
above (capture as a side effect of use, and the 2026-07-31 direction that it must
be runnable on work you did not do), `/extract-patterns`, and
`docs/examples-placement.md`, which already argues that reading an example to
learn a technique is a bug report against the references.
