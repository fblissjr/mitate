last updated: 2026-08-02

# Representation: where data stops and code starts

**A design session brief, written before the session, and the place its decision
goes afterwards.** That ordering is deliberate and is the first thing this file
is for: the same discussion happened on 2026-07-30, produced a real owner
position, and was **recorded nowhere** — it survived only because a later pass
went looking for it. `restructure-2026-07.md` files that as its worked example of
knowledge evaporating. This file exists so the outcome has a home before it is
reached.

Nothing here is decided. Where this file states something as settled, it is
citing a decision made elsewhere, and the citation is given.

---

## The question

**Where is the boundary between data and code in a mitate scene?**

Everything else in this design space is downstream of it: what the source
artifact is, what the fenced blocks become, what a compiler validates, and how a
migration would run. Those are listed below as agenda items 2–4, but they mostly
answer themselves once this one is settled, which is why letting them open early
is the main way this session goes wrong.

## Settled — inputs, not agenda

Do not re-litigate these. Each has a home; the home wins.

| settled | where |
|---|---|
| The scene is a pure function of `t`; tooling talks only to the window contract | `CLAUDE.md`, the prime directive. Not in scope |
| Determinism is the instrument, not the point. **Reproducibility** is load-bearing; **byte-identity** is one technique for measuring it, scoped to one backend | `VISION.md` |
| Not a template library. Primitives that solve **consistency** and **the hand-rolled case** together | `VISION.md` |
| **Not a DSL.** The framing is "reliably render data as code". No new syntax to learn | owner, 2026-08-02 |
| **Schema where things connect, code where things are specific** | `VISION.md`. Existence proof: `buildCharacter(P, matFor)` — a fixed proportion vector plus a function, from which one shipped example builds a bear, a human and an invented strider |
| `state` is the intermediate layer; the window contract is not. The contract is an interface for tools and its thinness is its value | `VISION.md` |
| "Data and a small compiler, not an abstraction layer" | `predecessor-record.md`, written before this repo existed |
| JSON is not the right shape; whether something with more structure is remains open | owner, 2026-07-30 |

## Open — the agenda, in order

**1. Where does data stop and code start?**
`references/breakdown.md` enumerated the declarative layer and deliberately
stopped at this line: geometry construction and per-frame motion are authored
code, and they are where most of a film's lines live. That is the whole design
space.

**2. What is the source artifact, and does one self-contained HTML survive?**
Invariant 1 is a *delivery* constraint — a compiler satisfies it by emitting one
file. The open part is what an author edits and what `git diff` shows. Note that
a compile step already ships and is bracketed: the neon variant is derived by
`stage-films.sh`, and `build.js vendor` rewrites a tracked file in place.

**3. What do the fenced blocks become?**
They stop existing if you emit rather than duplicate. The cost is not obvious:
roughly half the fenced surface is comments, and those comments sit inline beside
the code they constrain, carrying this project's measured determinism lessons.

**4. Migration shape.**
Five shipped examples plus one corpus fixture. <!--count-mention--> Big-bang is
not the only option and probably not the right one.

## The evidence, measured

All figures taken 2026-08-02 and re-runnable. Prefer re-running to citing.

**What replication costs.** `--parity-only` now derives and prints it:
**5,704 lines held byte-identical** across nine carriers. The repo's prose said
4,611 until today — measured 2026-07-30, before `CONTRACT` became the seventh
fence <!--count-mention--> and before the ninth carrier joined, so the surface
grew ~24% in three days and **grows with every example added**. Policing it costs
a propagation tool, a bracket, a pre-commit hook and a three-glob discipline
restated in several tracked files.

**What is already data — and the ratio is the wrong instrument.** Two independent
recounts of "how much of a scene is literal tables" landed at 3.4–5.5% and
4.2–6.3%, differing only on whether blank lines count in the denominator. The
figure originally written here, 4–8%, was carried out of an agent's report and
never recomputed; nothing supports its upper bound. **Recompute it with a stated
definition or do not cite it** — the audit that caught this is the reason the
rule about numbers travelling with their provenance exists.

What the ratio hides in both directions matters more than its value. It
understates, because the tables control the two most-edited axes — timing and
camera — through a small interpreter. It overstates, because `SUBJECTS.pos` is a
**function**, so the existing "data" is already data-with-embedded-code. **That
last fact is question 1 in miniature** and no percentage can express it.

**What is code.** Authored top-level functions run 53–172 lines per shipped
example, and 701 lines in the corpus fixture, whose `animate()` alone is 233.
None of it is covered by any static check, any parity check, or any reference.

**The layer is uneven, and validation is in the wrong place.** From
`breakdown.md`: the character proportion vector is a real schema that throws;
`STYLE` and `CONFIG` are open bags that validate nothing. `STYLE` has twelve
kit-read keys against three declared in the template, plus seven film-private
ones that the source does not distinguish from kit keys. **Validation clusters
where a mistake is *unrepresentable*** — an unknown name fails a lookup — **not
where it is expensive.** An extent that does not match its geometry, an anchor
outside its beat and a caption that will not fit are all decidable from the tables
and none is checked.

**What has been re-examined and what has not.** 91% of `scene.template.html`
still blames to the migration commit; `smoke.js` is 26%. The harness has been
rebuilt; the representation never has. Scene HTML is 6.77 MB of 9.10 MB tracked,
dominated by the embedded library, one copy per file.

**Where defects actually come from.** Across the whole apparatus the caught-defect
split is roughly **4 product against ~25 meta**. The repo's own postmortem on the
question concludes that not one defect in the span it examined would have been
caught by reading a diff, and that four times over the *check* was broken rather
than the thing it checked.

## Constraints any answer must satisfy

1. The prime directive, unchanged.
2. The shipped artifact remains one self-contained HTML file that opens from disk
   with no dependencies. A compiler is allowed; a runtime dependency is not.
3. No new syntax an author has to learn.
4. A film must still be able to do something nobody anticipated — the
   hand-rolled case is half the reason primitives exist.
5. Whatever replaces a fence must not lose the comments, which are where measured
   lessons live and are more than half that surface.
6. `build.js probe` is the prime directive's one admitted exception and holds on
   three checkable conditions. Any answer that needs a second exception must say
   so explicitly rather than acquire one.

## Failure modes this session must avoid, each one earned here

- **Adopted framing becoming structure.** An agent repeats a questioner's framing
  rather than its findings, and it reaches a tracked file. This has happened at
  least three times, including once on 2026-08-02 inside the document describing
  it. *Guard: written positions in, not a blank conversation, so the session
  compares drafts instead of converging live.*
- **The decision evaporating.** Already happened to this exact question. *Guard:
  this file, created first.*
- **Deciding by argument where measurement is available.** Every time this project
  measured instead of arguing it declined work it would otherwise have built — a
  container, a documentation split, a topological sort, a prose scanner. That
  habit is the healthiest thing in the record and is nowhere named as one.
- **Designing against an unenumerated set.** Closed 2026-08-02 by
  `references/breakdown.md`. It was open for the whole life of the project.
- **A schema that is another copy of the code.** The strongest objection to any
  structured representation, and it has already happened at small scale: a
  six-entry registry contained one derivation reading the wrong copy of the list
  it existed to protect.

## How to run it

**Do `build.js check` first.** It is the compiler's front half — validation over
the tables that already exist — and it needs no reframe at all. It produces the
schema as a by-product, because you cannot write a validator without committing
to what the tables mean; it converts "compile-time validation beats runtime" from
an argument into a measurement, on a corpus that includes a deliberately broken
fixture; and it pays off whether or not the reframe happens. Its results are the
session's most important input.

Then the session, one question at a time, in the order above.

## The decision goes here

When it is reached, this file records: the boundary as drawn, the cases it cannot
hold, what was rejected and why, and what would make the decision wrong. Until
then the section is empty on purpose — an empty section is honest and a
placeholder full of options is not.

### Falsifiers, written in advance

- **If `build.js check` catches nothing real on the corpus**, the claim that these
  errors are worth catching before render is weaker than it looks, and the case
  for a compile step rests on duplication cost alone.
- **If the tables resist being validated** — if writing the validator forces
  case-by-case exceptions rather than a schema — that is evidence the layer is
  not one thing and a single representation is the wrong goal.
- **If the boundary cannot be drawn without a closed vocabulary**, constraint 4
  is violated and the answer is not data-as-code but something else.
- **If replication cost stops growing** — no new examples, no new carriers — the
  largest measured cost of the current foundation stops compounding and the
  urgency drops.
