---
mode: session
scope: what-caught-the-defects
date: 2026-08-01
summary: Across a long session that shipped four versions, every defect worth catching was found by running something and noticing a count disagreed with a summary line — not by reading. Four of them were broken CHECKS rather than broken code, and one control was 3% flaky and would have shipped had its first run passed. The practical conclusion is that blanket review is the wrong instrument here, and where a second pass does pay is named.
artifacts:
  - plugin/skills/mitate/templates/smoke.js
  - plugin/skills/mitate/templates/bracket-driver.js
  - scripts/selfcheck.js
  - scripts/bracket-selfcheck.js
  - scripts/derived-counts.js
  - docs/pattern-ledger.md
  - docs/plan.md
---

# What actually caught the defects

A session spanning 0.16.57–0.16.62 produced a usable answer to a question that
had never been asked here directly: **when is a second pair of eyes worth it, and
when is it the wrong instrument entirely.**

## The finding

**Not one defect in this session would have been caught by reading a diff.**

| defect | how it surfaced |
|---|---|
| A corpus comparison that scanned **zero scenes** | the globs arrived as one literal string; both runs produced the same refusal and `diff` said IDENTICAL. Caught by asking *which scenes failed* |
| A corpus comparison whose **bundler was broken** | a concurrent process deleted the workspace's `node_modules`; every template failed `[self-contained]`. Caught by checking the tail, not the verdict |
| A guard arm that was **3% flaky** | an integer offset with 32 reachable values collided about one run in thirty. Caught only because it failed once and passed once with no code change |
| `selfcheck` check 13 **crashing** instead of reporting | a tracked file absent from the working tree threw ENOENT and took the whole run down |
| `SKILL.md`'s description **1093 against a 1024 limit** | found by counting, not reading. It had been over since 0.16.18 — roughly forty versions |
| `instruments.md` asserting **six fences, listing six**, omitting `CONTRACT` | found by a check deriving the number from `smoke.js`'s array. It had shipped wrong for eleven versions |

Each of these reads fine on the page. That is the whole point: **the failure mode
that survives here is the one that looks correct.**

## Four times the CHECK was broken, not the thing it checked

Worth separating, because it changes what to distrust:

1. A scanned-scene guard added *after* the zero-scene miss counted **11 for 9
   scenes** — `ok`/`FAIL` lines are not one per scene.
2. A verification that all seven `gaitPose` callers passed `rootX` reported
   **7 MISS**. It split each line on `:` and tested a fragment truncated at
   `{start:`. The code was correct.
3. A bracket arm's expected message matched its own check's **passing note**, so
   it could have read CAUGHT off a green check plus any unrelated failure.
4. A red arm asserting `frontmatter description` — a substring that also appears
   when the check *passes*.

In every case the check was the suspect only because its result was
*implausible*: seven simultaneous misses after five deliberate edits, or a
comparison reporting success over a corpus it never opened.

> **A result that agrees with what you expected is the one to check hardest,
> because nothing about it will prompt you to.**

## What this says about review

**Blanket review is the wrong instrument for this repo.** A reviewer reading the
diffs above finds none of them — they are behavioural, not readable. And a
generic reviewer lacks what makes review work here: red-before-green, the
ratchets, the parity set, the split between a scene verdict and a harness fault.
It would report style and miss the class the repo actually loses to.

**Where a second pass does pay, with evidence:**

- **Before merging a branch.** `/code-review high` on PR #3 returned **15
  findings, all closed**. That is a real hit rate on a real branch.
- **`/audit-claims` after doc or claim changes.** `source-of-truth.md` already
  records that it "went unrun for this repo's whole life despite being written
  down." It would have caught the shipped fence count above.
- **`control-builder` when something is about to be trusted** — the fresh-eyes
  role that works here, because it *builds the refutation* rather than reading
  for one.

**What replaces review the rest of the time** is what already exists: ratchets
that fail when a number rises, brackets with an arm that must go red, and checks
that derive a figure rather than trusting prose. Two of this session's defects
were caught by checks the repo added earlier in the same session, against their
own author.

## The corollary about controls

The flaky arm is the sharpest lesson and nearly shipped. It passed on the run
that mattered and failed on a repeat; had the order been reversed it would have
entered the gate as a control that agrees 97% of the time.

> **A control that is right most of the time teaches people to re-run it until it
> agrees, which is worse than not having it.** Prefer a fixture that cannot
> collide over one that probably will not.

## Scope of this finding

This is about **this** repo, where the corpus is green by construction and the
dangerous defects are silent. A codebase whose failures are visible in a diff —
logic errors, missing cases, unsafe input handling — would weigh review
differently. Recorded so the conclusion is not over-generalised into "review is
not worth it."
