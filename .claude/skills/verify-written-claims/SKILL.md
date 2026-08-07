---
name: verify-written-claims
description: Re-derive every count, status and attribution written into a diff before it is committed, against the record rather than from memory. Use before committing a change that touches CHANGELOG.md, internal/log/, docs/postmortems/, a planning document, a handoff, or any summary prose about the repo's own state; and immediately after a decision, merge or version lands, to find the same day's prose that the landing invalidated. Read-only: it reports what disagrees and what cannot be derived, it does not rewrite.
---

last updated: 2026-08-07

# verify-written-claims


Summary prose is where this repo's claims fail. Not the code, not the
references — the files whose job is to say what happened. The mechanical
guards were built for the other set on purpose: `scripts/derived-counts.js`
excludes `CHANGELOG.md`, `internal/log/`, `docs/postmortems/` and the
planning documents as dated records, and says so in
`scripts/selfcheck.js`'s check-13 header —

> WHAT IT DOES NOT COVER, said plainly: a count in a noun not in the
> REGISTRY, and any count in the files derived-counts.js's HISTORICAL list
> names -- the changelog, logs, postmortems and planning records.

`docs/source-of-truth.md` already names the corrective for that gap and
leaves it to a human: *"There the answer is not a check: cite the command,
not its output."* This skill is that sentence with a procedure attached.

**It is not `/audit-claims`.** That one asks *does this doc still describe
the code* and dispatches `doc-claim-auditor` at reference prose. This one
asks *was this number, status or attribution derived at the moment it was
written* — about files where there is often no code to read, only the record.
Run both when the diff spans both; neither subsumes the other.

## Scope

Default: the staged diff. `git diff --cached` if anything is staged,
otherwise `git diff HEAD`. A path argument narrows to that file.

**Added lines only.** Unchanged prose is somebody else's problem and
re-checking it on every commit is how a check becomes noise.

## Procedure

### 1. Extract the claims

Read the added lines and pull out every sentence in three classes. Do this by
reading, not by regex — a regex over prose was tried and refuted
(`selfcheck.js` check 13's header: *"A scanner has to RECOGNISE a count in
arbitrary prose and cannot"*).

| class | shape | example that failed here |
|---|---|---|
| count | a number bound to a noun | "31 arms, each carrying a claim comment" — measured 3 |
| status | a state assertion about repo, phase, file or branch | "CLAUDE.md invariant 2 deliberately NOT touched" — landed an hour later |
| attribution | who/what found, caused, fixed or surfaced a thing | "the class was surfaced by the owner asking about `.github/`" — two routes, one credited |

Skip: claims about the diff's own content that the diff proves; quoted
historical text; anything already carrying `(local)`, `(memory)`,
`<!--count-mention-->`, or an explicit observation time.

### 2. Name the deriving command, before running anything

For each claim write the command whose output IS the claim. If you cannot
write one, that is the finding — go to step 4.

    counts of tracked things      git ls-files … | wc -l
    counts inside one file        grep -c … <file>
    registered countables         bun run scripts/derived-counts.js
    arms / checks in a control    run the control, read its derived tally
    "red before green"            re-run the bracket at the pre-change commit
    branch / PR / merge state     git log --oneline -1, git status --short,
                                  gh pr list --state open
    "landed in <sha>"             git show --stat <sha>
    "X was found by Y"            the artifact that records the finding —
                                  a commit message, a log line, a CI run

Rule from `docs/orientation.md`: **never hand-write what a command
produces.** A number you did not just run is a number you are remembering.

### 3. Run them, and record both sides

One row per claim: the sentence, the command, the command's output, the
verdict. Never `| tail` or `| grep` a validator — the pipeline reports the
filter's status, which this repo has already been bitten by twice
(`scripts/install-hooks.sh`'s HOOK_BODY comment).

### 4. Claims with no deriving command

These are not failures; they are unlabelled. Each must be rewritten to one of:

- past tense with its observation time — "as of 18:20 the other session held
  `docs/**`" instead of "another session holds `docs/**`";
- explicitly sourced — `(memory)`, `(local)`, `(reported)` — the convention
  `snapshots/2026-08-02/history.md` already uses for exactly this;
- deleted. A number that carries nothing usually carries nothing.

The precedent is `docs/postmortems/2026-08-02_session_fence-store-emitter.md`'s
response annotation: *"a count resting half on memory should have said so
when written."*

### 5. The invalidation pass — run this when a decision or version lands

The other half of the failure record, and the half no write-time check can
reach: prose that was **true when written** and made false by something
landing later in the same session. Five of eight findings in one audit were
this shape (`docs/postmortems/2026-08-02_session_audit-of-one-days-output.md`,
second annotation), and its corrective is a search, not a rule:

> when a decision lands, grep the same day's output for the framing it
> invalidates. The newest prose is the most likely to be wrong about it,
> precisely because it was written closest to the change.

Mechanically:

1. Name what just became true (a phase MET, a file edited, a PR merged, a
   decision recorded).
2. Write down the distinctive phrases of the framing it replaces — the words
   the old state would have been described with, not the new one.
3. `git grep -n` those phrases across tracked files, then the same grep over
   today's own additions: `git log --since=midnight -p | grep -n …`.
4. Every hit is either correct history in a dated record, or live prose to
   fix. Say which for each.

This is the same instruction `docs/postmortems/2026-08-02_session_fence-store-emitter.md`
forward item 2 gives for wording sweeps: enumerate surfaces by grepping the
invalidated claim text repo-wide, **not from a remembered list** — a
remembered list found five of six surfaces.

### 6. Report

    claim                                    command                    derived     verdict
    ---------------------------------------- -------------------------- ----------- --------
    "31 arms carry a claim comment"          grep -c 'Delet' …          3           WRONG
    "REP2 is the next open phase"            docs/plan.md REP stamps    MET         STALE
    "the owner surfaced the class"           git log --grep, PR #9 gate two routes  PARTIAL
    "two mutual hook blockades"              (none available)           —           UNSOURCED

State the scope of the run itself — how many added lines were read, how many
claims extracted, how many derived. A green report that does not say what it
covered cannot be told from a run that read nothing; that is this repo's
most-repeated defect and it applies to this skill too.

**Report, do not rewrite.** The caller fixes. Two of four auditors in the
2026-08-02 run produced findings that had to be narrowed on checking, which
is why `/audit-claims`'s "weigh every finding against the source yourself"
step is not ceremony — the same applies here.

## When this skill is the wrong instrument

- The claim is about **code behaviour** — that is `/audit-claims` and
  `doc-claim-auditor`.
- The claim is a **registered countable in a live-claim file** — that is
  `bun run scripts/derived-counts.js`, already mechanical, already in the
  pre-commit hook. Do not re-derive by hand what a generator fills.
- The claim is about **whether a control can go red** — that is a bracket,
  and running one is the only answer (invariant 6).
