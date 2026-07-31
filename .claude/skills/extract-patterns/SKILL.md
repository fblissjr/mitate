---
name: extract-patterns
description: Read finished work — a scene, a session log, a postmortem, a directory of them, or a mix — and propose which of its techniques belong in the references, each with its evidence, its destination from source-of-truth.md's homes table, and its pattern-ledger row. Use after a film ships or a review lands, when picking up a scene someone else built (another session, another agent, another harness), or when a technique looks like it was invented twice. Read-only: it proposes; it never writes a reference, CLAUDE.md, or the ledger.
---

last updated: 2026-07-31

# extract-patterns

`VISION.md`: *"capturing a pattern should be a side effect of making a film, not
an act of discipline afterwards."* `docs/pattern-ledger.md` argues the case,
counts the rebuilds, and says plainly that it *"has no way to extract one."*
This is that half.

**What it exists to prevent, in the concrete form the repo already paid for:** a
cookbook of eight worked shape recipes was written once, cited from two tracked
files as though it had been carried over, was **not** carried over, and survived
only because an archive audit went looking. The pattern existed, was known to be
good, was referred to as shipped, and was one directory deletion from gone.
Nothing was looking for it. This is the thing that looks.

The other half is `VISION.md`'s own success criterion — *"a session arriving with
no context can find what it needs and act correctly."* A promoted pattern is what
that session finds. An unpromoted one is what it reverse-engineers out of an
example scene, which the ledger classifies as a bug report against the
references. So naming the destination matters as much as spotting the pattern; a
finding with no home reaches nobody.

## Why the author is the wrong person to run this

Not tiredness. The author **felt the necessity that produced each choice**, and
therefore cannot easily see which choices were general — every one of them felt
required at the time. A session with no investment in them can.

The corpus says so twice: the prototype's twelve defects came from a *single*
independent `film-reviewer` pass on a film its author had already reviewed over
eight rounds and shipped, and on 2026-07-31 an independent no-context pass on a
postmortem found that postmortem's flagship claim false. Both are recorded in
`docs/pattern-ledger.md`, which is where the argument for this skill lives; do
not restate it here.

So **zero context is the qualification, not the handicap.** Three consequences,
and they are binding:

- **Never ask why a choice was made.** You cannot know, the author's answer is
  the least reliable evidence available, and the artifact is sitting right there.
  Judge what is in the file.
- **Prose about the work is a claim, not evidence.** A session log or postmortem
  says a thing was built twice; the two builds are the evidence. Verify against
  the artifact. If the artifact is not reachable from here, the proposal is
  marked `weak` and says so.
- **Do not assume this repo's harness.** A scene handed in from elsewhere may
  carry no fences, no window contract and different vocabulary. Absence of them
  is not a finding for this pass — that is `smoke.js`'s job, and reporting it
  here turns an extraction into a review nobody asked for. Judge the technique,
  translate it into this repo's vocabulary in the proposal, and say the
  translation is yours.

## One command

`/extract-patterns <path>...` takes any mix of scenes, session logs, postmortems
and directories. The judgment is identical whichever arrives — only where the
evidence line comes from changes — and splitting it into a scene command and a
session command would put the general-versus-local criteria in two files, which
is the one-home rule failing inside the tool built to serve it.

**Not `film-reviewer`, which also reads a finished scene.** That agent finds what
is wrong with *this* film and hands the findings back to it. This finds what
should *leave* the film, and hands it somewhere else. A defect and a pattern can
be the same three lines — the reviewer says fix it, this says the next film
should never have to.

## The judgment: engine, not film

This is the whole job. A skill that flags everything is noise; one that flags
nothing is decorative.

> **`VISION.md`: not "a tool that makes films." Films are how the engine gets
> proven.** So the test is: **does this leave the ENGINE better equipped for the
> next film, or did it only make THIS film better?** A solution that helps only
> the scene it came from is local, however elegant.

Everything below makes that decidable. **The unit of a proposal is a statement,
not a region of code.** The line does not run between files or even between
functions: in the worked pair below, a general statement and a local one sit on
adjacent lines of the same declaration.

**And it is not a code filter.** `film-language.md` exists because someone noticed
recurring *framing* decisions and wrote them down. Staging, pacing, entrances,
legibility and what makes a gag read without captions are first-class candidates.
`VISION.md`: *"the point is that the films land."* A pass that can only see code
misses the half the references were mostly built out of.

### Six tests

1. **Substitution.** Replace the film's nouns with roles — bear → subject, hive →
   contact target, rain → streaming field. If a statement survives, it is
   technique. If what is left is "and then the subject waves", it was the film.
2. **Re-derivation.** Would the next author, in another register, have to work
   this out again, or would they just do it right without thinking? Only the
   first is a pattern. Corollary: a thing that took two tries to land is *better*
   evidence than a thing that worked first time, and this repo records those
   tries in comments.
3. **Second spelling.** The same idea spelled two ways in two places is drift, and
   drift is proof of independent invention — it is the ledger's founding
   instance. Grep the corpus for the other spellings before proposing. Finding
   one raises both the form and the count.
4. **Shape problem, not subject.** `docs/plan.md`'s anti-template principle: a
   recipe organised by shape problem serves unrelated domains by construction;
   one organised by subject is a preset. "How to build a beehive" is a preset.
   "How to hang a prop from a pivot so the swing is one rotation" is a technique.
5. **Named failure mode.** Can it be stated as *X fails when Y, and the symptom is
   Z*? The strongest entries in `method.md` are failure modes, not recipes. A
   candidate with no failure mode attached is usually decoration.
6. **Falsifiability.** Is there a way to know when it is wrong — an instrument, a
   bracket, a visible symptom? If not, say so under `weak`. That is a real
   property of the proposal, not a footnote.

### Do not propose

- **Tuned constants.** A camera position, a beat duration, a palette value, a
  pivot coordinate. The discipline that produced them may be general; the numbers
  never are.
- **Anything that only reads with this film's subjects in place.**
- **The film's beat structure or story.** `docs/plan.md`: the film never promotes.
- **Correct use of what the kit already provides.** Using `ramp()` as documented
  is not a discovery.
- **Contract or self-containment violations in an outside scene.** Not this pass.
- **Anything already in a reference.** Step 5 exists to catch this, and for a
  session with no context it is the most likely way to waste the disposer's time.

### The worked pair, twenty-four lines apart in one file

**General — propose it.** `plugin/skills/mitate/examples/bear-and-bees.html:1284`:

```
// meadow clutter from the frozen R pool, clear of the walk lane (|z|<1.6)
// and shallow enough not to trip feet visually — travel needs parallax
// (menagerie review: a bare plane made an 11-unit walk read as a treadmill)
```

Substitution leaves *"a travel shot over an untextured ground plane reads as a
treadmill; scatter parallax markers clear of the subject's lane."* No noun of
this film survives; it holds for a walk, a drive, a flight, a conveyor. It is a
named failure mode with a symptom (test 5). It was found reviewing one film and
applied in a second, so it demonstrably transferred (test 2). And
`grep -rn 'treadmill|parallax' plugin/skills/mitate/references/` returns nothing
(measured 2026-07-31) — a legibility finding, discovered in review, re-applied,
and never once leaving the films. That is the flywheel argument in three lines of
comment, and it is a *films-land* pattern rather than a code one.

**Local — do not propose it.** Same file, line 1260:

```
const PIV=[2.95,5.05,.25];   // branch attach point (pendulum pivot) — z near
                             // the walk lane: the boop must CONTACT in all
                             // three axes, not just x (review: z was a .41 miss)
```

Substitution leaves `[2.95,5.05,.25]`, which is where this film's branch is.
**But the comment one line above it is general** — *the contact geometry is
SOLVED from probed offsets, measure the contact rather than inferring it* — and
that shape is already the ledger's top row at 6, dispositioned to `build.js
probe`. Three outcomes from five consecutive lines: propose, reject, and
already-counted-and-shipped. Check the ledger before writing any of them.

## Where a proposal may land

**Every proposal names a home that already exists in `docs/source-of-truth.md`'s
homes table.** Read the table; do not work from memory. Route with the
destination's own provenance line ("canonical for …") and its `**Not here.**`
edge, which is what those edges are for. In practice the reachable homes are:

- `plugin/skills/mitate/references/*.md` — method, discipline, failure modes.
  Pick the file by subject, not by convenience: render-side facts are
  `webgpu-stack.md`, delivery `delivery.md`, recording `recordings.md`, what a
  check can and cannot see `instruments.md`, and those three must not share a
  home.
- **the comment on the line itself** — a line-local invariant. Cheapest home
  there is, and correct when the fact cannot be checked from anywhere else.
- `plugin/skills/mitate/SKILL.md` — routing and workflow order only.
- `CLAUDE.md` — a repo invariant that bites on first edit. Rare.

**Not destinations, and refusing them is part of the job:** `VISION.md` (short on
purpose; a summary of the plan gets deleted), `site/` (downstream, owns no fact),
the examples (a film never promotes), and `internal/` (see Step 8).

**If no home in the table fits, say so and stop there.** Creating a home is a
source-of-truth decision the disposer makes, not a side effect of an extraction
run. `bibles.md` already carries a "no home yet" note for the flat-vector
vocabulary — naming homelessness is an accepted outcome here.

Then grade the form. `docs/plan.md`'s cost table owns the forms and the trigger
each one earns — a paragraph, a cited worked example, a vocabulary entry, a
primitive, a fenced block, an instrument. Read it and name one; do not restate
its triggers here. Grade into the **cheapest form that carries the finding**:
most of what comes back from a scene is not a function.

## The ledger half

Counting is what lets `docs/plan.md`'s promotion triggers fire at all, so every
proposal ends with a ledger disposition — increment an existing row, open a new
one, or nothing.

**Count is independent solutions of the same shape, not usages.** Two rules fall
out, and they are the ones a no-context session gets wrong:

- **A documented borrow does not increment the count.** If the second site cites
  the first (the treadmill comment cites the menagerie review), that is one
  independent solution and one reuse. Record the borrow in `where seen` — the
  ledger requires the borrow record — and argue it in the proposal body, because
  a technique that transferred across two films is general *by demonstration*.
  It is strong promotion evidence and a weak count.
- **Byte-identical code in two scenes is one instance** unless something says
  otherwise. Different spellings of one idea are two.

**The corpus boundary, and it is hard:**

> **Instances from work produced by another party — another harness, another
> model's scenes, a scene handed in from outside this project — are
> CORROBORATION ONLY. They never enter the count and never enter `where seen`.**

The count is defined over what this repo can re-derive; an outside scene may
vanish tomorrow, is not tracked here, and may not even share the harness. A shape
seen *only* outside gets no row at all — it may still earn a reference proposal
on its merits, but it arrives with a count of zero, not one. Corroboration goes
in its own block in the report, where it can strengthen an argument without
inflating a number.

One qualifier, from `CLAUDE.md`'s postmortem convention: an in-corpus instance
whose artifact is local-only (`internal/`, gitignored) may be counted, but the
row must rest on a **tracked** record of it — a postmortem or a handoff — and
label the artifact `(local)`. A count resting on a gitignored file is
unrecoverable, which is the failure the ledger's closing section is about.

## Steps

1. **Classify the inputs and fix the corpus boundary before reading anything.**
   For each path: scene `.html`, session log or postmortem `.md`, directory
   (enumerate it), or other. Mark each in-corpus or outside. This governs the
   ledger half, so it goes in the report header, not in your head.

2. **Read the scene body, never the scene file.** three.js is embedded per file
   (invariant 1), ~1 MB across a handful of minified lines. `grep -n
   'CONTRACT-START' <scene>` gives the body start; read and grep from there
   (`sed -n '<start>,$p' <scene> | grep -n …`, adding the offset back to report
   absolute lines). An unrestricted `grep -n` for `.001` on
   `plugin/skills/mitate/examples/bear-and-bees.html` returned 568 KB, nearly all
   of it vendored bundle (measured 2026-07-31). On an outside scene with no
   marker, anchor on `window.seekTo`, `const BEATS`, or the first line under
   ~500 characters after the bundle.

3. **Search five regions, and only three of them are code.**
   - **Unfenced code — the search space by definition.** The six fences
     (`KERNEL`, `SOLVER`, `RIG`, `DRIVER`, `CHARACTER`, `HTML`) are already
     promoted kit; something found inside one is a parity concern for `smoke.js
     --parity-only`, not a pattern. Nothing marks unfenced code as this film's
     private solution — that is the ledger's complaint, and it is also the map:
     unfenced is exactly where a film's own answers live.
   - **The declarative tables** — `BEATS`, `SHOTS`, `SUBJECTS`, `STYLE`. Staging
     and pacing decisions live here rather than in code. A beat structure that
     solves a legibility problem is a candidate; its durations are not.
   - **Load-bearing comments.** This repo writes its findings into comments
     (`review: z was a .41 miss`). Highest yield per line, and the region a
     code-shaped reading skips.
   - **Beat boundaries and the camera** — entrances, exits, cuts, dwell, what the
     film does when a subject leaves frame.
   - **What the film had to fight** — a clamp, an epsilon, a re-ordering, a "must
     run before X" note, a computation done twice. Fights recur; smooth code does
     not.

4. **Apply the engine test, then the six tests.** Reject early and cheaply.

5. **Check the destination before proposing, every time.** Read the candidate
   home. Grep `plugin/skills/mitate/references/` for the concept *and its likely
   alternate spellings*. Check `references/glossary.md` for the term. Record what
   you checked and what it returned, in the proposal. A proposal duplicating an
   existing entry is the one-home rule failing quietly.

6. **Check the ledger.** An instance of a shape already in
   `docs/pattern-ledger.md` is an increment (or, if already dispositioned and
   shipped, nothing) — not a discovery. Read its disposition before writing.

7. **Optional, and only to test a claim you are about to make:** `bun run
   build.js probe <scene> <t> <expr>` and `build.js motion <scene>` report to
   stdout and change nothing — `probe` is `CLAUDE.md`'s admitted contract
   exception and this pass satisfies all three of its conditions (reads only,
   authoring time, no artifact pipeline). Name the exact command in the proposal
   so the disposer can re-run it. `sheet`, `strip` and `poster` write image files
   beside the scene; leave those to the disposer. Everything else in this skill
   works from reading, because the scene you were handed may not be renderable
   here at all.

8. **Report, and write nothing.** No reference, no `CLAUDE.md`, no ledger row, no
   queue file. The report goes to the conversation. **Especially not
   `internal/`** — the last hand-run of this loop landed there, and the ledger's
   closing section is about that output being one directory deletion from gone.
   An undisposed run is a lost run, by design: the proposal format exists to make
   disposal cheap enough that it happens now. If the disposer explicitly asks for
   it on disk, the tracked landing is theirs — the reference itself, the ledger
   row, or a postmortem under `docs/postmortems/` named per `CLAUDE.md`.

## Output format

Copy this shape. Fields are fixed; blank is not an option, `none` is.

```
## extract-patterns — <what was read, one line>

scope    <path> (scene, in-corpus) · <path> (postmortem, in-corpus)
         <path> (scene, OUTSIDE — corroboration only)
read     <body ranges actually read, e.g. bear-and-bees.html:651-1766>

### P1 — travel over a bare ground plane reads as a treadmill

form      craft rule — one paragraph (docs/plan.md cost table)
evidence  plugin/skills/mitate/examples/bear-and-bees.html:1284
          `// travel needs parallax (menagerie review: a bare plane made an
           11-unit walk read as a treadmill)`
          borrow site: plugin/skills/mitate/examples/menagerie.html:1260
general   substitution leaves "a travel shot over an untextured ground plane
          reads as a treadmill; scatter parallax markers clear of the
          subject's lane" — no noun of this film survives. Named failure mode
          with a symptom. Transferred across two films.
home      plugin/skills/mitate/references/method.md, Axis 3 (semantics): every
          frame is correct and the film fails to say "travelling". NOT
          materials.md — the clutter is a field of instances, but the finding
          is about the legibility of motion, not how to build the field.
checked   read method.md and materials.md; `grep -rn 'treadmill|parallax'
          plugin/skills/mitate/references/` → 0 hits (2026-07-31); no glossary
          entry; no pattern-ledger row.
ledger    NEW ROW, count 1 (borrow, not a second independent solution):
          | travel reads as a treadmill without parallax | 1 | menagerie
          review; borrowed into bear-and-bees.html:1284 | proposed: method.md
          Axis 3 |
weak      no instrument sees this — `motion` measures textured pixels, and
          scattered clutter raises its score whether or not the walk reads.
          The proposal rests on reading a comment and two scenes, not on a
          measurement.

### Considered and rejected

- hive staging constants, bear-and-bees.html:1260 — local: substitution leaves
  coordinates. The discipline in the comment above them is general and is
  already pattern-ledger row 1 at 6, dispositioned to `build.js probe`.

### Corroboration (OUTSIDE the corpus — not counted, no ledger row)

- <shape> — <path> (outside, <whose>). Strengthens P1; changes no count.

### Nothing further

<one line: what was read and yielded nothing, so the next run does not redo it>
```

## What a good run looks like

**Zero proposals is a valid and expected result** on a scene that used the kit as
documented. Say what you read and stop.

**More than about five from one scene is the smell of flagging everything.** Order
by strength, re-apply the engine test to the weakest, and drop the ones that only
pass because they are true. There is no hard cap, because the honest number
depends on the scene — but a long list transfers the judgment back to the
disposer, which is the work this skill exists to do.

**Rejections earn one line each, and only the near misses** — a candidate that
passed the engine test and failed a later one, which someone would otherwise
re-propose next month. Not every line you read.
