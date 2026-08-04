last updated: 2026-08-04

# Which doc answers which question

**Jump:** [VISION](../VISION.md) ·
[plan](plan.md) ·
[working-plan](working-plan.md) ·
[orientation](orientation.md) ·
[representation](representation.md) ·
[addressing](addressing.md) ·
[source-of-truth](source-of-truth.md) ·
[pattern-ledger](pattern-ledger.md) ·
[predecessor-record](predecessor-record.md) ·
[postmortems](postmortems/)

A router, not a summary. The strip above is every destination one click away;
the table below is the actual router — which question sends you to which of
them, and when. A summary here would be a second copy of everything it
points at, which is the failure this repo keeps finding — see
[`source-of-truth.md`](source-of-truth.md).

**Nothing in `docs/` ships.** An install cache holds only what lives under
`plugin/`, so these files are for people and agents *developing* mitate. A
reference that needs to reach an installed user goes in
`plugin/skills/mitate/references/` instead.

| If you are asking | Read | When |
|---|---|---|
| **I have no context at all — what must I not break** | **[`orientation.md`](orientation.md)** | first, if you are a fresh session or a delegated subagent. ~50 lines: the two rules, three ways to break something silently, and the commands that tell you the truth. A subagent does not auto-load `CLAUDE.md`, so this is the briefing block to paste |
| **what is this project for** — and why determinism first, what a primitive has to be, where a declaration lives | **[`../VISION.md`](../VISION.md)** — the most important document in this repo | **first, and again before anything structural.** Not "once": it is the file the others are downstream of, and where one of them conflicts with it about intent, it wins |
| what is `t`, and why is it addressed by beat | [`addressing.md`](addressing.md) | before changing anything about time, seeking, or the bake |
| what is the architecture, and what gates each phase | [`plan.md`](plan.md) | before starting anything phase-shaped |
| **what should I work on next** | the review's red-first cascade **landed as 0.18.2 (2026-08-04**; the queue and its landing record are in **[`working-plan.md`](working-plan.md)'s "What the REP2 review taught about review" section, whose mirrors table also carries the 2026-08-04 `tableValue` disposition — closed, with its revive trigger)**. Now open: **[`plan.md`](plan.md)'s representation track (REP0–REP6)** — REP1 (0.17.0), REP2 (0.18.0) and **REP3 (0.19.0, 2026-08-04)** are MET; **REP4 is the open front** (its red-first fixture already exists — corpus row 11) — and **[`restructure-2026-07.md`](restructure-2026-07.md)** while that migration is open (it carries a current-position block) | at the start of a work session. Label key, because one letter means three things: `R0`–`R5` are the restructure plan's gates, `Phase R` / `Gate R` is `plan.md`'s restructuring phase, and `REP0`–`REP6` is the representation track |
| the standing backlog the migration executes against | [`working-plan.md`](working-plan.md) | when the migration closes, or for an item it does not cover. **Parts of it are superseded**; the restructure plan wins on anything they both name |
| what is on the table but undecided — the current brainstorm | [`brainstorm-2026-08-04.md`](brainstorm-2026-08-04.md), while it exists | it settles nothing and deletes itself once every item graduates or dies; read it for the live path question (film vs REP4 vs Phase 4) and the verified gaps behind it |
| **is this already decided, or is it still open** | grep `docs/` for **`Open question`** — every unresolved design question is filed under that exact phrase, deliberately | before re-deriving a decision or re-raising one. **This row exists because a cold-start test found the routing gap it closes:** two zero-context agents were asked about two recorded design questions, both reached correct answers, and *both* got there by guessing a topic keyword after finding no row here — one won on "declarative", the other only after its topic words missed and it searched the repo's *epistemic* vocabulary instead |
| where does this fact belong | [`source-of-truth.md`](source-of-truth.md) | before writing the same thing twice |
| has this shape been built before | [`pattern-ledger.md`](pattern-ledger.md) | before proposing a primitive or a fence |
| **where does data stop and code start** — the representation question, its brief, and **the recorded decision (2026-08-02)** | **[`representation.md`](representation.md)** | before proposing anything about the source format, the fences, or a compile step. The decision section is written — do not re-litigate it; its wrong-ifs say what would reopen it. The file was created before the session precisely because this discussion evaporated once already |
| the argument behind that decision — one argued position, with examples, tradeoffs and a roadmap | [`representation-exploration.html`](representation-exploration.html) | when you want the reasoning rather than the record. **A draft arguing one side, not doctrine** — `representation.md` owns the decision and wins wherever they disagree |
| what may a Phase 4 bake do, and what may it never do | [`physics-bake-proposal.md`](physics-bake-proposal.md) | before any bake code |
| what did the predecessor already measure | [`predecessor-record.md`](predecessor-record.md) | when tempted to re-measure something. 2,770 lines — exceeds a default read window, so read it in ranges |
| should examples live in the plugin | [`examples-placement.md`](examples-placement.md) | only if reopening that decision |
| what does this word mean | `../plugin/skills/mitate/references/glossary.md` | the first time `register`, `fence`, `the parity set` or `install cache` does more work than it looks like |
| what went wrong, and what we learned | [`postmortems/`](postmortems/) | newest first — later entries correct earlier ones |

**The invariants that bite on a first edit** are in `CLAUDE.md` at the repo
root, which also carries the full map of scripts, workflows and agents.
