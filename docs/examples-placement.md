last updated: 2026-07-25

# Should scenes live in `examples/` or `internal/`?

An open decision, written down so the reasoning survives the session that
produced it. **Nothing here is decided.** The current policy stands: scenes live
in gitignored `internal/` until owner-approved into `plugin/skills/mitate/examples/`
([plan.md](plan.md), examples policy).

The question is whether the *approved* destination should be the shipping plugin
subtree at all, or whether films should stay internal with the showcase site as
their public face.

---

## What is actually being decided

Not "should we have example films" — we should, and do. Three separable things
got bundled into one directory, and the decision is whether they belong together:

| purpose | audience | needs to ship? |
|---|---|---|
| **gate evidence** — menagerie proves the character scaffold; gearbox is the regression control against the frozen predecessor | the maintainer, and the phase record | no |
| **teaching** — showing an author how a technique is done | an installed user | *should be a reference's job* |
| **showcase** — proving the claim to someone who has not installed anything | a prospect | the site already does this |

`examples/` currently serves all three from one place, which is why the decision
feels binary when it is not.

---

## Measured costs of shipping them

Byte sums over `git ls-files`, 2026-07-25, working tree at 0.16.6. (Method
stated because `du` block-sums and byte-sums differ enough to matter, and
[source-of-truth.md](source-of-truth.md) requires conditions with a figure.)

| | size |
|---|---|
| `plugin/skills/mitate/examples` | **5.47 MB** |
| `plugin` (the whole shipped subtree) | 5.85 MB |
| `references` | 0.11 MB |
| `templates` | 0.25 MB |

**Examples are 93% of what ships.** The subtree is copied into a *per-version*
install cache — two versions are cached on this machine right now, so ~11 MB of
example films for one user who has updated once.

**Fence carriers:** a `KERNEL` change touches 9 files, a `SOLVER` change 8.
**Five of those are examples.** Every new example is +1 carrier on every future
kit change, permanently.

**A fourth cost, discovered rather than predicted:** 0.16.5 fixed seven dangling
pointers in `examples/README.md` — six broken poster images and a link, all
`../../../../site/posters/…`, which resolves in the repo and climbs *past the
cache root* for an installed user. The scene files were fine. The cost was in
the prose that has to explain them, correct across two different filesystem
layouts simultaneously.

---

## The case for moving them to `internal/`

**1. Reward hacking — the strongest argument, and the one that is not about cost.**
An agent optimizing "make a scene that works" gets full reward from copying a
pattern out of an example: smoke goes green, the film looks right, and nothing
in the signal penalizes reinvention or failure to promote. The proxy is
satisfied while the goal — a better kit — moves backward. Every shipped example
is a surface where that trade is available.

**2. The design currently forces it.** `SKILL.md` and `examples/README.md` both
index by *film* ("the regression film", "the comedy short"). There is no
pattern-level index, so an agent needing "how do I gate a prop's presence" has
exactly one move: open a scene and read it. And nothing anywhere tells a reader
that unfenced code in an example is that film's private solution rather than
sanctioned practice — the fences mark what *is* shared; nothing marks what is not.

**3. It is already happening, and it is already uncounted.** The presence idiom
exists as `clamp(sc,.001,1)` in `bear-and-bees` and as `Math.max(1e-4, …)` in a
later film — two spellings of one idea, in two scenes, neither aware of the
other, nothing recording the collision until [pattern-ledger.md](pattern-ledger.md)
was written.

**4. Examples are not gold standards and nothing says so.** They are the first
realizations of test-case specs, built with the capability available at the time.
Treating them as exemplary over-anchors on early work — and the copying problem
means agents *do* treat them that way, because copying implies endorsement.

**5. The audience mismatch.** Gate films prove things to the maintainer. A user
building a film does not need `menagerie`; they need `characters.md`. Gate
evidence belongs with the phase record, not in a user's install cache.

---

## The case against moving them

**1. `SKILL.md` teaches by pointing at in-tree baselines** — six citations today,
and the examples policy in `plan.md` states that as a deliberate design. Removing
them without first moving the teaching into references leaves a hole in the
place a user actually reads.

**2. Self-containment is the product claim, and an example is its proof.** One
file, opens from disk, no network. A user who installs the plugin and has a
working film in hand has seen the claim demonstrated. A link to a website is
weaker evidence of "this runs offline from a single file."

**3. Diversity has real value, and you lose the cheap way to browse it.** A
maintainer looking across five scenes for how lighting is handled is doing
legitimate work. `internal/` supports that fine on one machine — but it is
gitignored, so the corpus stops being shared, reviewable, or reachable by a
second person or a fresh clone.

**4. A film in `examples/` gets the parity check, smoke, and the version cascade.**
A film in `internal/` gets none of them by default. The five shipped examples are
byte-verified carriers of six fenced blocks; today's floor-guard correction
propagated to all of them and was verified. Move them out and that verification
surface has to be rebuilt or lost.

**5. It is a doctrine change, not a cleanup.** The examples policy was amended
twice already (2026-07-23, 2026-07-24) after deliberate argument. Reversing it
a third time should clear a higher bar than a cost table.

---

## Options, which are not binary

| option | what it does | cost |
|---|---|---|
| **A. Status quo** | examples ship as-is | the five costs above, growing per example |
| **B. All to `internal/`** | site becomes the only public face | biggest win on every measured axis; largest doctrine change; loses shared corpus and the verification surface |
| **C. Shrink to a minimum** | keep 1-2 that teach something no reference can; rest to `internal/` | most of the win, much less disruption; needs a criterion for which stay |
| **D. Keep them, fix the attractor** | ship examples but move pattern-teaching into references first, so nobody needs to read a scene for technique | addresses the root cause rather than the symptom; slowest; leaves disk and carrier costs |
| **E. Tracked but unshipped** | move to a top-level `films/` outside `plugin/` — tracked, reviewable, parity-checked, but not in the install cache | keeps the corpus shared and verified, drops the 93% and the cache multiplier; `SKILL.md` cannot cite it (invariant 3), which is either the point or the problem |

**E is the option that was not obvious** and it dissolves the sharpest conflict:
it keeps everything the "against" column wants — tracked, reviewable, smoke- and
parity-checked, diverse and browsable — while removing the install-cache weight
and, because `SKILL.md` legally cannot point at it, the sanctioned copy path.

---

## What breaks, specifically

- **Six `SKILL.md` citations** would need to become references or absolute URLs.
- **`examples/README.md`** and its poster embeds move or go.
- **The AVIF preview policy** ([plan.md](plan.md)) is built on the examples
  README embedding `site/posters/` — it survives B/C/E but needs rewording.
- **`scripts/stage-films.sh`** copies `examples/*.html` into `site/films/`; its
  source path changes under B, C and E.
- **`smoke.js`'s default run** checks `*.html` in cwd. Any move changes which
  invocation covers the corpus — and the cross-directory parity rule
  (`CLAUDE.md` invariant 2) gets *more* important, not less.
- **The tracked-once rule** (invariant 4) is stated in terms of `examples/` and
  `site/films/`; the wording assumes the current layout.

---

## Reversibility

Moving is reversible in git and costs one version cascade. What is *not* cheaply
reversible is the version window in which installed users have no example films —
if the teaching hole is real, it shows up as confused authors, and the evidence
arrives late and indirect.

---

## The experiment that would settle it

This is testable rather than arguable, and the test is cheap:

> **Build a film with `examples/` unavailable.** Give an agent the skill with
> only `SKILL.md`, `references/` and `templates/` — no example scenes — and have
> it build something. Log every point where it wanted a scene to read.

Each of those points is a reference gap, and the list *is* the work item for
option D. If the list is short, B/C/E are safe. If it is long, the examples are
load-bearing teaching and should stay until the references catch up.

That reuses the population that already exists: the 2026-07-25 film was built by
a non-maintainer agent following the docs, and its handoff named everything the
author had to invent — travel, built type, presence gating, layout. Four reference
gaps, from a run where examples *were* available. That is weak evidence the
examples were not doing much teaching to begin with.

---

## My reading, flagged as opinion

E, then D. Move films to a tracked, unshipped `films/` — that captures the whole
measured win and every "against" argument except the `SKILL.md` teaching one,
which option D then closes properly by moving pattern-teaching into references
where it belonged.

The order matters: doing D first makes E painless, and doing E first creates
pressure to do D. Doing B without D is the only sequence that risks a real hole.

Least defensible is A, not because the costs are unbearable but because **the
reward-hacking argument does not get better with more examples** — it gets worse
linearly, and the ledger's job is to make that visible before it does.
