last updated: 2026-08-05

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
| **what should I work on next** | **NEXT SESSION STARTS HERE (owner, 2026-08-05): build and review more portfolio scenes — `boss-intro` first, then the 2D-explainer rung — BEFORE any "good enough, move on" call.** Each scene's close-out has THREE named steps now: the film field report (method.md's closing step), the **snippet harvest** (lift the scene's instrument-green techniques into the references as tested snippets — `working-plan.md`'s standing row carries the debt list, starting with the instanced-field outline pass), and, for a cold build, the scene-analysis comparison against the market-crash baseline (`scene-analyses/`). The n=1 brake is the reason: one cold build is one sample, and VISION's cold-start criterion has one passing measurement, not a verdict. Context, newest first: **the plugin ships NO films and no dates (0.21.0–0.22.0, superseding option E the evening it landed)** — every film lives in `scenes/` as the maintainer's calibration corpus, the skill teaches only through references/templates/tested snippets, shipped markdown is date-free current state (verification ledger: `shipped-provenance.md`), and the 2D-baseline-slot question is **retired, not open** — there is no shipped slot for any template, so no film promotion decision exists to make (`examples-placement.md` carries the whole arc). **`market-crash` landed 2026-08-04** — built cold by an installed-plugin session (0.19.3) with no repo context, which was VISION's docs-only test running for real: shipped in one pass, zero tool errors, with real defects caught pre-delivery by the shipped instruments (the day's log carries them); what nothing caught landed as 0.19.4 (changelog entry), and the artifacts sit outside the tree `(local)`. Alongside the films, owner-requested (2026-08-05): explore injecting three.js at build time instead of tracking ~1.1 MB of vendored library per film — the Open question is filed in [`working-plan.md`](working-plan.md) with its measured basis and the invariant-1 edges it must respect. Behind the films: **[`plan.md`](plan.md)'s representation track** — REP1 (0.17.0), REP2 (0.18.0) and REP3 (0.19.0) are MET, **REP4 is the track's open front** (its red-first fixture already exists — corpus row 11). The review's red-first cascade landed as 0.18.2; its record is in [`working-plan.md`](working-plan.md)'s "What the REP2 review taught about review" section. The restructure plan closed: R5's remnant landed 2026-08-04 (`01c18b7`) and `restructure-2026-07.md` deleted itself per its own rule — closure record in `snapshots/2026-08-04/`, named not linked | at the start of a work session. Label key: `Phase R` / `Gate R` is `plan.md`'s restructuring phase, `REP0`–`REP6` the representation track; the third meaning of the letter — the deleted restructure plan's `R0`–`R5` gates — left the live doc set with that plan, which is what retired the label collision |
| the standing backlog | [`working-plan.md`](working-plan.md) | for any item the work-next row does not cover — the deferred table with revive triggers, the owner's calls, and the measurement debts. **Parts of it are superseded**; the restructure plan that superseded them closed 2026-08-04 and its record is in `snapshots/2026-08-04/`, so a superseded-marked section stays superseded even though the winner is now a frozen record |
| **is this already decided, or is it still open** | grep `docs/` for **`Open question`** — every unresolved design question is filed under that exact phrase, deliberately | before re-deriving a decision or re-raising one. **This row exists because a cold-start test found the routing gap it closes:** two zero-context agents were asked about two recorded design questions, both reached correct answers, and *both* got there by guessing a topic keyword after finding no row here — one won on "declarative", the other only after its topic words missed and it searched the repo's *epistemic* vocabulary instead |
| where does this fact belong | [`source-of-truth.md`](source-of-truth.md) | before writing the same thing twice |
| **am I building, editing, or retiring a check, bracket, hook, or threshold** | **[`controls.md`](controls.md)** — the door, router-shaped | before the first line of it. It carries the two rules homed nowhere else: the adversarial round before a mechanism is trusted, and the retirement checklist (exposure basis, frozen classifiers, minimum sample) |
| has this shape been built before | [`pattern-ledger.md`](pattern-ledger.md) | before proposing a primitive or a fence |
| **where does data stop and code start** — the representation question, its brief, and **the recorded decision (2026-08-02)** | **[`representation.md`](representation.md)** | before proposing anything about the source format, the fences, or a compile step. The decision section is written — do not re-litigate it; its wrong-ifs say what would reopen it. The file was created before the session precisely because this discussion evaporated once already |
| the argument behind that decision — one argued position, with examples, tradeoffs and a roadmap | [`representation-exploration.html`](representation-exploration.html) | when you want the reasoning rather than the record. **A draft arguing one side, not doctrine** — `representation.md` owns the decision and wins wherever they disagree |
| what may a Phase 4 bake do, and what may it never do | [`physics-bake-proposal.md`](physics-bake-proposal.md) | before any bake code |
| what did the predecessor already measure | [`predecessor-record.md`](predecessor-record.md) | when tempted to re-measure something. 2,770 lines — exceeds a default read window, so read it in ranges |
| should films ship in the plugin (decided: none do) | [`examples-placement.md`](examples-placement.md) | only if reopening that decision |
| when was a shipped file last verified, against what | [`shipped-provenance.md`](shipped-provenance.md) — the record the shipped files' dated headers used to carry; everything under `plugin/` is date-free current state | before trusting a reference wholesale, and in the same motion as re-verifying one |
| what does this word mean | `../plugin/skills/mitate/references/glossary.md` | the first time `register`, `fence`, `the parity set` or `install cache` does more work than it looks like |
| what went wrong, and what we learned | [`postmortems/`](postmortems/) | newest first — later entries correct earlier ones |
| **how a cold session actually used the skill** — the timeline, what it read vs skipped, where it stumbled, what the tools printed at it | [`scene-analyses/`](scene-analyses/), one dated record per analyzed plugin-only build | before changing SKILL.md's workflow or a reference's routing, and when judging whether written guidance binds — the first record (market-crash) is the baseline the next cold build gets compared against |

**The invariants that bite on a first edit** are in `CLAUDE.md` at the repo
root, which also carries the full map of scripts, workflows and agents.
