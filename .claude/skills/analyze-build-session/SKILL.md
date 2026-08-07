---
name: analyze-build-session
description: Reconstruct what an installed-plugin session actually did while building a film — the timeline, which references it opened and which it never opened, where the harness fought it, and where its own account of itself is wrong — from the session transcript rather than from its field report. Use when one or more build fixtures come back from an isolated workspace, when asking whether a doc change actually changed behavior, or before editing SKILL.md's workflow or a reference's routing. Read-only: it reports and routes; it does not fix the findings it finds.
---

last updated: 2026-08-07

# analyze-build-session

`VISION.md` names two flywheels. The first carries technique out of a film and
into the references — that is `/extract-patterns`. **This is the second one**:
a session that has only the installed plugin builds a film, and what it did is
the measurement. Improving the skill and the harness is downstream of watching
them be used, and this is the instrument that watches.

It is also the only instrument VISION's cold-start criterion has ever had.
Every other criterion in that list is checked by running something; this one is
checked by reading what a stranger did with the docs.

**Not `/extract-patterns`, which also reads finished work.** That one asks
*what should leave this film and enter the references*. This one asks *what did
the shipped surface cause*, and its inputs are the transcript and the tool
output, not the scene. A technique and a defect can be the same three lines;
so can a good reference and one nobody opens.

## Read the transcript, not the field report

This is the rule the skill exists to enforce, and it is measured rather than
assumed. Across four analysed builds:

- **Every one overstated its own debugging effort.** Three by six- to
  sevenfold — "roughly two hours" against a measured 20m28s and 17m40s.
- One shipped a directory size it had itself measured twice and contradicted.
- One gave three different counts for one number in three places.
- One shipped a field report that **disagrees with its own postmortem** about
  the session's signature finding.
- One presented an unmeasured table cell as measured, and attributed a quote to
  a file it had only grepped when the quote was in a file it had read in full.
- None of the three 2026-08-07 builds reported the most consequential thing
  about its own run. One of them never mentioned that the owner had interrupted
  it.

Their *technical* findings held up well — most measured figures are exact. Their
accounts of their own *behaviour* did not, and behaviour is what this is for.
So: **the account is a lead, the transcript is the evidence.** Where they
disagree about behavior, the transcript wins; where they disagree about the
film, the builder wins.

## Zero context is the qualification

Dispatch **one subagent per build**, each told nothing about mitate and told not
to go looking. They read one transcript and that build's own outputs. Reasons,
in order of how much they cost to learn:

- A reader who knows what the docs *say* will confirm the docs. A reader who
  does not can only report what the session *did*.
- Parallel readers cannot contaminate each other's findings, which is what makes
  recurrence across them meaningful.
- Depth per build is a different job from comparison across builds. **The
  orchestrator does the cross-cut itself** — see below. Asking a subagent for
  it produces a comparison against builds it cannot see.

## The split that works

**Subagents (one per build), depth:** timeline with phase boundaries and every
gap over 90s; the full reference-read table; every shipped-tool invocation with
exit code and printed output; every error verbatim; guidance-versus-behavior;
the builder's-account-versus-transcript diff; friction with costs.

**Orchestrator, breadth — run these yourself, before and after dispatch:**
the comparison table across builds, the never-opened complement, and the
verification pass. A subagent cannot do any of the three.

## The extraction schema

Fixed, so the axes stop drifting between runs and the owner stops having to name
them. Every field is derived, never remembered.

| field | why it is not optional |
|---|---|
| model | varied silently across builds until someone asked. Sonnet-5 and opus-5 do not read the same amount of anything |
| **effort** | same, and it is not in the database — only the raw log. A build at `xhigh` and one at `high` are not the same experiment |
| plugin version | read from the transcript's own read paths, never assumed from what is installed now |
| Claude Code version | a harness change is a confound like any other |
| build class | COLD (plugin-only, empty workspace) or WARM. `source-of-truth.md` makes this load-bearing: a warm build is never evidence for the cold-start criterion |
| activation | slash command or description-routed. Only the second measures frontmatter triggering, and three of four builds so far measured nothing about it |
| rollups | duration, tool calls, tool errors, output tokens, thinking blocks, compactions, permission prompts, delegations |
| real human turns | with the filter below, or the count is ~5x too high |
| references opened, **and the complement** | the complement is the highest-yield field in the whole schema, four builds running |
| shipped-tool verb census | with exit codes |
| every error and warning | verbatim, including the ones the session ignored |

## Queries that work, and the traps under them

The store is a star schema; query it read-only. Strip ANSI with
`sed 's/\x1b\[[0-9;]*m//g'` and prefer `-box` or `-list -noheader`.

**Trap 1 — `fact_content_blocks` is EMPTY.** Do not build on it.

**Trap 2 — thinking text is stored EMPTY.** The blocks are counted, their
content is not there. Confirm it per fixture rather than assuming, then say so
in the output: a conclusion that needs the reasoning is **unavailable**, not
inferable. Long silent gaps are unrecorded thinking; report the gap and its
boundary markers, never a guess at its content.

```sql
WITH b AS (SELECT unnest(json_extract(message_json,'$.content')::json[]) AS blk
           FROM read_parquet('<lake>/projects/*/sessions/*/log_entries.parquet')
           WHERE type='assistant')
SELECT json_extract_string(blk,'$.type') t, count(*) n,
       sum(length(coalesce(json_extract_string(blk,'$.thinking'),''))) think_chars
FROM b GROUP BY 1 ORDER BY 2 DESC;
```

**Trap 3 — effort is not in the database.** Only the raw log carries it, and
`read_parquet` on an in-memory database refuses `-readonly`:

```sql
SELECT DISTINCT regexp_extract(raw_json,'"effort"\s*:\s*"[a-z]*"',0) hit, count(*) n
FROM read_parquet('<lake>/projects/*/sessions/*/log_entries.parquet')
WHERE raw_json ILIKE '%effort%' GROUP BY 1 ORDER BY 2 DESC;
```

**Trap 4 — tool results are `user`-type messages**, so the naive human-turn
count is wrong by about 5x. Filter, then read what survives by eye: rows like
`[Image: original 2080x520, displayed at ...]` are the result of the session
reading its own contact sheet, not a person saying something.

```sql
SELECT strftime(timestamp,'%H:%M:%S') t, length(content_text) len,
       replace(substr(content_text,1,220),chr(10),' ') txt
FROM semantic_messages
WHERE message_type='user' AND content_text IS NOT NULL
  AND content_text NOT LIKE '%tool_result%'
  AND content_text NOT LIKE '<system-reminder>%'
  AND length(content_text) > 5
ORDER BY timestamp;
```

**Trap 5 — regex over `input_json` silently misses.** Extract the field first:

```sql
WITH c AS (SELECT json_extract_string(input_json,'$.command') cmd
           FROM semantic_tool_calls WHERE tool_name='Bash')
SELECT regexp_extract(cmd,'(build|smoke|shoot)\.js\s+([a-z-]+)',0) verb, count(*) n
FROM c WHERE cmd LIKE '%build.js%' OR cmd LIKE '%smoke.js%' OR cmd LIKE '%shoot.js%'
GROUP BY 1 ORDER BY 2 DESC;
```

**Reference reads, and the plugin version, from the same column:**

```sql
SELECT strftime(invoke_timestamp,'%H:%M:%S') t,
       regexp_extract(read_file_path,'([^/]+)$',1) f,
       read_num_lines nl, read_total_lines tot
FROM semantic_tool_calls WHERE read_file_path LIKE '%plugins/cache/mitate%'
ORDER BY invoke_timestamp;

SELECT DISTINCT regexp_extract(read_file_path,'mitate/mitate/([0-9.]+)/',1) v, count(*) n
FROM semantic_tool_calls WHERE read_file_path LIKE '%plugins/cache/mitate%' GROUP BY 1;
```

Then **the complement**: list the references that version actually ships and
subtract. That subtraction is the finding, not the read list.

## Verify before writing anything down

Two passes, both cheap, both of which have already caught a wrong write-up.

**Against the current tree.** The analysed build ran an older plugin. Check
every finding against what ships now — some are already fixed, and a
working-plan row for a closed defect is worse than none.

**Against the code, for anything that looks like a bug.** A warning that fires
on the documented-correct pattern read exactly like a false positive until the
code comment showed it was a deliberate declared-substitution notice, pinned by
its own bracket. **Never route a finding toward quieting a check** — that is
`signal-honesty`, and this instrument is unusually good at generating
plausible arguments for it. An ergonomics complaint about a check is fine; it
must be filed as one, with the constraint that the signal survives the fix.

## Recurrence is what promotes a finding

One build hitting something is an anecdote about that build. **The same thing in
two or more independent builds is a property of the shipped surface**, and that
is the bar for a working-plan row or a fix. State the count in the finding.

The corollary matters as much: a finding that appears once still gets recorded
in the analysis file, because the next build is what turns it into evidence.

## Output and routing

One dated record in `docs/scene-analyses/` — one file per build, **or one per
batch run as a single comparison** when the comparison is the point. It is a
dated record: it settles nothing, it is never the tiebreaker, and it needs no
freshness marker.

Then triage every finding three ways, and say where each went:

- **fix-now** — ships in a reference or SKILL.md, so it takes the version
  cascade (`CLAUDE.md` invariant 2) and, if it touches a check, goes through
  `controls.md`'s door red-first.
- **working-plan row with a revive trigger** — the trigger is the point; a row
  with no trigger is a wish.
- **held as record** — with the reason. Most findings land here and that is
  correct.

Finish by checking whether an existing row's trigger has **fired**, and say so
in the row rather than filing a duplicate beside it.

## Privacy is not optional here

The transcripts, the workspaces and the databases are local and private. The
analysis is tracked and public.

**Keep every observed finding, count, timing and quote verbatim. Scrub only the
provenance names.** Cite by class — "the build transcript `(local)`", "a local
analysis fixture" — never a path, a filename, a workspace name or a database
name. Give each build a label in the write-up and use it. Restate this
constraint inside every subagent prompt, because the subagent is the one
holding the paths.

And never advertise the scrub: no commit message, changelog line or prose says
what was genericized.
