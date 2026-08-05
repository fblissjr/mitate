---
mode: session
scope: cold-mining-and-option-e
date: 2026-08-05
summary: The independent no-context reconstruction caught the analyzer repeating the builder postmortem's own drift ("shipped invisibly") into a shipped reference, the repo's hooks caught every other error class the session produced, and the owner's mid-execution n=1 brake turned a decided promotion into a corpus placement with the baseline slot held open.
artifacts:
  - a local transcript database
  - the builder's postmortem (local)
  - docs/scene-analyses/2026-08-04_market-crash-cold.md
  - plugin/skills/mitate/references/instruments.md
  - plugin/skills/mitate/references/method.md
  - plugin/skills/mitate/SKILL.md
  - plugin/skills/mitate/templates/smoke.js
  - scripts/stage-films.sh
  - scenes/crash.html
  - docs/README.md
  - docs/working-plan.md
  - docs/examples-placement.md
  - docs/pattern-ledger.md
  - internal/log/log_2026-08-05.md
  - 616fa2d
  - f4a32f5
  - e186390
  - d57ca71
  - a5883cb
  - b14c05c
  - e8edcc4
---

# Postmortem: cold-mining-and-option-e

Session mode. Scope: mining the 2026-08-04 cold market-crash build (its
postmortems, its transcript index at a local transcript database `(local)`,
its raw transcript `(local)`) and routing everything it taught — which grew, by
owner instruction and two interviews, into three patch releases
(0.19.4–0.19.6), a new document class, the option E restructure (0.20.0),
the film-reviewer agent's first real exercise, and the revision of
`crash.html`. Nine commits over the day; the ones findings rest on are
cited where they bite.

## 1. What went well

**The independent reconstruction found what the first-pass mining missed —
including the first pass's own error.** The finding-oriented pass produced
the 0.19.4 routing (`616fa2d`); a no-context subagent then rebuilt the cold
session's timeline from the same evidence and surfaced three things the
first pass had not: the field report's absence traces to the builder's own
task list omitting step 8 (now a SKILL.md line, `e186390`); the `| tail`
habit cost the builder four recovery calls on a filename its tool had
printed; and the full smoke run never states its parity scope. It also
caught the analyzer's inherited error (section 2). Structural: the repo's
"runnable on work you did not do" extraction doctrine
(`docs/pattern-ledger.md`, flywheel section) held on its first
analyzer-side use — the second reader is not redundant with the first even
when both read the same record.

**The film-reviewer's first exercise beat the builder's self-review.** The
agent's pass on the cold scene returned three findings the build session's
own eight-instrument inline review never surfaced: the middle three beats
were captions over one continuous fall (nocap cells indistinguishable), the
outro was a static uncovered loop seam, and the reveal carried the
documented momentum-stall anti-pattern, measured at ~0.35 candles/s across
boundaries against 3.0 mid-beat. All three were fixed in `scenes/crash.html`
and confirmed by re-run instruments — the revised nocap sheet shows the
middle beats as visibly distinct stages of a drawn loop.

**Red-first survived a batch with time pressure.** The smoke parity-scope
change was watched red (a full run in a scratch workspace with real deps,
line absent) before the edit and green after, with `bracket-parity`'s 33
arms green post-change and the one uncontrolled edge disclosed in the code
comment (`plugin/skills/mitate/templates/smoke.js`); `stage-films.sh`'s
bracket ran green on both sides of its edit (`d57ca71`).

**The repo's controls caught every error the session left for them.**
selfcheck caught a hand-written count ("two defects") in `docs/README.md`'s
queue row before it landed; the pre-commit hook blocked the docs commit
over three undated freshness markers; the cascade trigger blocked a
plugin-content change from landing without a version move. Structural: all
three fired at the moment the work was sloppiest, which is the design
intent observed rather than asserted.

**Owner decisions landed in records the same hour they were made.** Two
interview rounds plus one mid-turn brake, each written where it governs:
the delegation softening as owner's call 5 resolved
(`docs/working-plan.md`, `f4a32f5`), the promotion call *and its same-day
revision* both in `docs/examples-placement.md` (`a5883cb`), the vendoring
exploration as an Open question with its measurement (`b14c05c`).

## 2. What did not go well

**The analyzer repeated the exact drift it was documenting.** 0.19.4's
`instruments.md` entry said the inert blink "shipped invisibly" — wording
compressed from the builder postmortem's frontmatter
(`the builder's postmortem (local)`,
whose own body contradicts it) rather than re-derived from the transcript,
which shows the blink caught at 19:43:50, pre-delivery. Fixed in 0.19.6
(`e186390`) only because the independent reconstruction flagged it.
Structural: a summary inherits its source's drift unless re-derived at
write time — and knowing the rule does not confer immunity while applying
it, since this error was written *into a document about that build's
errors*.

**The first cascade commit swept unrelated staged content.** `git rm` of
the brainstorm files earlier in the session left staged deletions; the
later `git add <paths> && git commit` for 0.19.4 carried them along
(original commit, reset and recut as `616fa2d`). Caught by reading the
commit output, cost one reset. Structural: staging by path constrains what
you add, not what was already staged.

**The hook and the cascade trigger deadlocked on the fix for a
hook-caught error.** Three stale freshness markers blocked the docs
commit; folding the marker fix into the released commit via `--amend` was
then blocked by the cascade trigger, which compares against the very
commit being amended and cannot know the result would be coherent.
Resolved by soft-reset and recutting (`d57ca71`); a straggler marker took
one more commit (`e8edcc4`). Not a control defect — but a real interaction
that cost two blocked commits, worth knowing before the next amend of a
version-bump commit.

**One wrong inference stated before checking.** Early in the mining, the
gap between the cold session's 19:05 start and its 19:32 first command was
narrated as "27 minutes of reading before any command"; the message record
shows the window was `/plugin` update commands and the prompt arrived at
19:32:08. Corrected in-flight and it never reached a record — but it was
stated as fact in conversation before the evidence was read.

## 3. Deviations from the plan

| Planned | Shipped | Verdict |
|---|---|---|
| Mine the cold-build fixture and report what works/what's missing (the owner's opening ask) | Mining plus full routing: 0.19.4–0.19.6, the scene-analyses class, docs closure, session log (`internal/log/log_2026-08-05.md`) | Grew by explicit owner instruction ("do everything you think is worth doing"), then by interview — sanctioned, not drift |
| Owner interview: crash promotes to `examples/` after a film-reviewer pass, inside the E batch | The pass ran, the fixes landed, and crash went to `scenes/` with the shipped 2D-baseline slot held open | Changed by the owner's mid-execution n=1 brake; both same-day calls recorded in `docs/examples-placement.md` |
| Owner interview: both mechanical checks stay filed on their triggers | The smoke parity-scope row landed anyway (0.20.0) | Its trigger — "the option E batch" — fired by the row's own written terms; honoring a filed trigger is the marker system working, not scope creep |
| Option E including "one 2D scene joins gearbox in-tree" | E executed with gearbox as the only shipped example; four films + crash to `scenes/` | Scoped down deliberately: one cold build is one sample, and the baseline waits for a second (`docs/working-plan.md` row) |

## 4. Escapes

- **The "shipped invisibly" claim reached a committed release.** The check
  that should have caught it: `/verify-written-claims`, whose exact target
  is attributions written into a diff from memory or secondhand prose — it
  was not run against the 0.19.4 diff (counts were derived; this
  attribution was not). Caught instead by the independent reconstruction,
  one session later. A green-but-unrun escape: the procedure existed and
  was skipped.
- **Everything else the session got wrong was caught before landing**: the
  hand-written count by selfcheck, the undated markers and the
  version-move gap by the pre-commit hook, the commit sweep by reading the
  output. No second escape reached the record.
- **Did the scope add checks? Yes.** The full smoke run now prints its
  parity scope (`N file(s) scanned, M fenced line(s) held byte-identical`);
  its recorded claim is that a green full run silent about parity is
  indistinguishable from one that compared nothing — the cold session
  watched three such greens with no way to know. Derivation is controlled
  by `bracket-parity`'s scan arms; the full-run print is the disclosed
  uncontrolled edge.

## 5. Forward items

1. **Any claim about a cold build written into a shipped reference is
   derived from the transcript, not from the builder's postmortem prose.**
   Checkable: the next changelog or reference entry citing a cold build
   carries either a query-derived figure or a `(local)` transcript
   citation, and `/verify-written-claims` runs against that diff before
   commit — the session log of that day records the run.
2. **The 2D teaching-baseline decision stays blocked until a second 2D
   portfolio scene is built and reviewed.** Checkable against
   `docs/working-plan.md`'s slot row: it either fires on that trigger or
   the slot is still open; filling it any other way refutes this item.
3. **The next cold build's scene analysis compares against the baseline.**
   Checkable: the next file in `docs/scene-analyses/` cites
   `docs/scene-analyses/2026-08-04_market-crash-cold.md` and states
   guidance-vs-behavior deltas (did the field report fire in form this
   time; did the nocap-early rule in `method.md` change first-draft
   behavior; did SKILL.md's step-8-as-task line produce the report).
4. **Before amending any version-bump commit, expect the cascade trigger
   to block, and recut instead.** Checkable: the next such amend either
   follows soft-reset-and-recut or this item gets annotated with the
   better path someone found.
