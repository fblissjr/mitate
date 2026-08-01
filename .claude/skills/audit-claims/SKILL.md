---
name: audit-claims
description: Check that this repo's claims still match its code — reference docs, CLAUDE.md, the load-bearing comments in templates/*.js, and the public capability claims on the showcase site — by dispatching doc-claim-auditor at whatever the current diff touched. Use before committing a change that edits code a reference describes, after writing or revising any reference or invariant, or when a claim's freshness is in doubt. Read-only: reports drift, does not rewrite.
---

# audit-claims

`source-of-truth.md` already requires this: *"Drift detection is scheduled, not
heroic. A change that touches code a reference describes gets a
`doc-claim-auditor` pass over that reference before commit."*

The rule existed and the agent existed for the whole life of this repo, and
nothing made the pass happen — so it didn't. This is that rule, executable. It
exists because on 2026-07-29 a hand-invoked audit found two real defects that no <!--count-mention-->
check in the repo can reach, and it found them only because someone happened to
remember the agent's name.

## Why a check cannot do this job

`scripts/selfcheck.js` verifies what is mechanical: the version cascade, the
three pin and its stamps, link resolution, provenance headers, `Not here` edges,
freshness markers, the assertion ratchet. It cannot verify that a comment reading
`measured — does NOT close the cloak` describes a measurement anyone took. That
specific comment was false for seven releases and failed the entire shipped
corpus on the default path. Semantic agreement between a claim and its code needs
reading, which means an agent or nothing.

## The three classes, and which one rots

From `references/instruments.md`. Only the third decays, so weight the audit
there:

| class | example | rots? |
|---|---|---|
| incident record | "this reached `git add` once" | no — history stays true |
| intent | "this tick is why the frame is deterministic" | no — checkable by reading |
| **measurement assertion** | "measured", "40/40 clean", "~2.3x", "verified" | **yes, silently, the moment code moves** |

## Steps

1. **Get the scope.** `git status --short` and `git diff` for uncommitted work;
   `git diff <base>..HEAD` if a range or branch was named in the arguments. If
   the diff is empty, say so and stop rather than auditing the whole repo.

2. **Map touched code to the claims that describe it.** For each changed file:
   - Code under `plugin/skills/mitate/templates/` → the reference that owns its
     domain. Use each reference's `**Not here.**` edge and
     `docs/source-of-truth.md`'s homes table to route; do not guess.
   - Any changed file → the load-bearing comments *inside it*, especially ones
     asserting a measurement.
   - Changed invariants or conventions → `CLAUDE.md`, and check it against the
     code it claims to describe.
   - **Changed behaviour of any tool an agent describes → `.claude/agents/*`,
     `.claude/rules/*`, and this file.** These are the blind spot: they carry no
     freshness marker by design, `selfcheck.js` derives its set from files that
     do, so **nothing mechanical covers them at all** — this routing line is the
     only control they have. It is not a theoretical gap. A review found
     `doc-claim-auditor` teaching four capabilities as broken that the code had
     since fixed, this file asserting an instrument "is not built" three
     versions after it shipped, and `model-delegation` naming two agents that
     never existed. A briefing that primes an auditor with stale claims makes
     every downstream verdict wrong, so these files are worth *more* scrutiny
     than an ordinary doc, not less.
   - **Changed capability, or a claim about one → `site/index.html`.** The site
     is a claim surface and was out of scope until 0.16.30. A page telling the
     public what the code does is exactly what this agent is for, and it is the
     copy nobody was reading. Its *"Every contact is probe-measured"* line and
     its `Box3 contact probes` chip are **now backed** — `build.js probe` shipped
     in 0.16.37 and is that tool. So audit whether the claim is *true of the
     current corpus*, which is a different and harder question than whether the
     instrument exists. (This bullet previously said the tool "is not built",
     which turned every run into a standing false positive against a working
     path.)

3. **Include the claims this diff ADDS.** This is the step most likely to be
   skipped and it is where both of the founding findings were: `method.md`'s Map
   asserted a line count that was wrong by 23 the moment it was committed, and
   `CLAUDE.md` carried a four-day-stale `last updated:` through edits to itself.
   New prose is not presumed accurate because it is new.

4. **Dispatch `doc-claim-auditor`** (in `.claude/agents/`) with an explicit,
   quoted list of claims to verify and the files to verify them against. Give it
   the specific claims, not a directory — a vague scope returns a vague answer.
   For a wide diff, dispatch several in parallel, split by reference.

5. **Report only drift**, most severe first, each with `file:line`, the quoted
   claim, and the code fact that contradicts it. An accurate claim needs no line
   of output. Empty is a valid and common result.

6. **Do not fix anything in this pass.** Reporting and repairing in one motion is
   how a wrong diagnosis becomes a wrong edit. Hand the findings back.

## Judging what comes back

Weigh every finding against the code yourself before relaying it. Three verdicts
from the audits that motivated this skill are worth remembering, and only one was
a defect (undated on purpose — the shapes are what transfer, and a relative date
in a durable instruction file resolves to nothing in a later session):

- a **real** finding (the stale line count) — act on it;
- a finding that was **already disclosed** one file over in its proper home —
  not drift, that is the one-home rule working;
- a **false positive from a bad instrument** — an outside audit grepped for
  `site/` and reported backticked prose as broken links. Prose may name a repo
  path. A *link* may not leave the subtree. Do not repeat that error.

When a claim and the code disagree, neither wins by default —
`source-of-truth.md`: the newer audit date says which is more likely stale, and
the fix updates the home and deletes the copy.
