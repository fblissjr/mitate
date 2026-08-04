#!/usr/bin/env bash
# A one-line, model-facing, non-blocking reminder tied to the edits where
# this repo's record says the failure happens: a claim about repo state being
# written into summary prose from memory instead of re-derived. Wired as a
# PreToolUse hook in .claude/settings.json; controlled by
# scripts/bracket-claims-reminder.js (static.yml's glob runs it).
#
# DELIVERY SEMANTICS, stated so the evaluation judges the mechanism that
# exists: PreToolUse additionalContext lands beside the tool result, so the
# model reads it one half-step AFTER the edit — the closest legal
# approximation to interrupting at the keystroke, in time to re-derive and
# amend, not in time to prevent the write (peer review, 2026-08-03).
#
# WHY NOT hookify: hookify's `warn` action returns only `systemMessage`, which
# the hooks contract sends to the USER'S TERMINAL AND NOT TO CLAUDE — a
# reminder the model never reads cannot change what the model writes. Its only
# model-facing path blocks the edit, and hookify is stateless so the retry is
# blocked too. `permissionDecision: "allow"` plus `additionalContext` is the
# documented shape for a non-blocking reminder Claude actually reads, and the
# once-per-session dedup needs a state file. Hence a script.
#
# WHY IT DEDUPES: sampled over 25 commits (b91b182..c4f1a16), the path classes
# below fire on 15 — roughly 5 of which carried prose a re-derivation would
# have fixed. A reminder at that rate is one people learn to scroll past,
# which is the failure invariant 6 names. Once per session per class turns
# ~15 fires into ~3. The cost, stated: a long session's twentieth CHANGELOG
# edit gets nothing.
#
# WHAT IT DOES NOT DO: it does not check anything. It cannot tell a derived
# count from a remembered one — no text scan can, which is why
# scripts/selfcheck.js check 13 is a generator and not a scanner. It points
# at the skill that does the work.
#
# RETIREMENT TRIGGER, named at install (2026-08-03): if correction commits of
# the 38e3773 / 625ac32 shape keep appearing at the prior rate three weeks
# in, this reminder is not working — delete it rather than tune it. And any
# class here that becomes mechanically checkable gets a check instead, and
# drops out of this classifier.
#
# WHY 2026-08-24, since an unexplained date invites the question (owner
# asked, 2026-08-04): install date (2026-08-03) plus the 21-day window named
# at registration. The 21 days was a cadence judgment, not physics — what is
# load-bearing is that it was fixed BEFORE any data existed, so nobody picks
# the window after seeing results. It moves only by the extension rule below.
# The owner's question also surfaced a defect the amendment below absorbs:
# the registered baseline ("the three weeks prior") exceeds the repo's life —
# first commit 2026-07-24, so the repo was ten days old at registration and
# a calendar-symmetric baseline never existed. Per-opportunity comparison
# needs no symmetric calendar, only sufficient opportunities per window.
#
# AMENDED 2026-08-04, pre-registered before the window closes (the skills
# repo's second denominator memo, relayed by the owner): the comparison is
# EXPOSURE-normalized, not calendar-normalized — two quiet windows would
# read "rate matches, delete" when the honest reading is "no exposure, no
# information", and that deletes a control on evidence that could not have
# shown it working. Both classifiers are FROZEN NOW so the day brings no
# freedom: a CORRECTION is a commit whose message or diff corrects a
# previously-committed state claim (the 38e3773/625ac32 shape); an
# OPPORTUNITY is a commit in the window that touched any surface this
# script's own path classifier matches (record surfaces, status surfaces,
# CHANGELOG — read the matcher below, not a paraphrase). Compare
# corrections-per-opportunity across the two windows, derived in one pass
# per window from the same diff ranges; if either window holds fewer than
# 10 opportunities, the checkpoint EXTENDS to the next one instead of
# deciding. Report both ratios either way, separately from the
# muted-blocks count, which shares the date and nothing else.
#
# BEFORE RULING, DISAMBIGUATE (peer review, 2026-08-03): an unchanged
# correction rate has two readings — "delivered but did not change behavior"
# (hypothesis wrong: delete) and "never actually delivered" (mechanism
# broken: fix and restart the clock). The bracket verifies EMISSION, not
# delivery. The cheap check: grep a few session transcripts for this file's
# message text and confirm it appears as absorbed context rather than
# surfaced to the terminal. Deleting on a delivery failure would bury the
# hypothesis without testing it.

set -euo pipefail

IN="$(cat)"

# --clear-session: the PostCompact mode. Compaction can summarize an already-
# delivered reminder OUT of the model's context while the state file still
# says "fired" — a long session's second half would then run unguarded, and
# the three-week retirement measurement would count its corrections against a
# reminder that was no longer in context (bias toward wrongful deletion).
# Clearing state on PostCompact restores at most one more fire per class,
# which the dedup math absorbs (peer review, 2026-08-03; PostCompact and
# session_id persistence confirmed against the hooks docs the same day).
if [ "${1:-}" = "--clear-session" ]; then
  SESSION=$(printf '%s' "$IN" | python3 -c "import json,sys; print(json.load(sys.stdin).get('session_id','none'))" 2>/dev/null || echo none)
  rm -rf "${TMPDIR:-/tmp}/claims-reminder.${SESSION}"
  exit 0
fi

# One interpreter spawn, not four: this runs on every matched tool call, so
# its latency is a tax on the whole session.
eval "$(printf '%s' "$IN" | python3 -c '
import json, shlex, sys
try:
    d = json.load(sys.stdin)
except Exception:
    d = {}
ti = d.get("tool_input") or {}
print("TOOL=" + shlex.quote(str(d.get("tool_name", ""))))
print("SESSION=" + shlex.quote(str(d.get("session_id", "none"))))
print("FILE=" + shlex.quote(str(ti.get("file_path", ""))))
print("CMD=" + shlex.quote(str(ti.get("command", ""))))
' 2>/dev/null || echo 'TOOL=""; SESSION=none; FILE=""; CMD=""')"

allow_silently() { printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow"}}'; exit 0; }

# Classify. Exactly four classes, each from the failure record, each fired at
# most once per session. Anything not in a class is silent — arms 3 and 4 of
# the bracket pin that, and go red if this widens by accident.
CLASS=""
case "$TOOL" in
  # NotebookEdit is deliberately absent: it sends notebook_path, not
  # file_path, so listing it here would claim coverage this script does not
  # deliver. No notebooks exist in this repo; if one ever does, read both
  # keys rather than re-adding the name alone (peer review, 2026-08-03).
  Edit|Write|MultiEdit)
    case "$FILE" in
      */CHANGELOG.md)                                   CLASS=changelog ;;
      */internal/log/*|*/docs/postmortems/*|*/internal/handoff*|*/snapshots/*)
                                                        CLASS=record ;;
      */docs/plan.md|*/docs/working-plan.md|*/docs/README.md|*/VISION.md|*/CLAUDE.md|*/site/index.html|*/docs/*-exploration.html)
                                                        CLASS=status ;;
    esac ;;
  Bash)
    # The publication moment. Fires once per session, on the first commit only.
    case "$CMD" in *"git commit"*) CLASS=commit ;; esac ;;
esac
[ -n "$CLASS" ] || allow_silently

STATE="${TMPDIR:-/tmp}/claims-reminder.${SESSION}"
mkdir -p "$STATE"
[ -e "$STATE/$CLASS" ] && allow_silently
: > "$STATE/$CLASS"

# FACTUAL STATEMENTS, NOT COMMANDS, deliberately: the hooks guidance warns
# that command-phrased injected text can trip prompt-injection defenses and
# get surfaced to the user instead of absorbed as context — which would
# silently turn this into the user-facing warn path the header rejects, and
# the retirement measurement would read "never delivered" as "did not work"
# (peer review, 2026-08-03).
case "$CLASS" in
  changelog) MSG='CHANGELOG entries are summary prose, and counts, red-first claims and refusal lists written into them from session memory have failed here before: the 0.18.0 entry contradicted its own next paragraph and was corrected 40 minutes later in 38e3773. The deriving command for each claim class is listed in /verify-written-claims.' ;;
  record)    MSG='This file is a dated record, outside every mechanical guard: scripts/derived-counts.js excludes CHANGELOG.md, internal/log/, docs/postmortems/ and the planning documents by design. The house rule for lines here is "cite the command, not its output" — or the label (memory), (local) or (reported) with an observation time. The procedure is /verify-written-claims.' ;;
  status)    MSG='Status claims in live documents have a validity window: log_2026-08-02 recorded invariant 2 as "deliberately NOT touched" and the same session landed it an hour later (corrected in 1df1fbe). The stamp or command that decides a status is the current source, and same-day prose is the most likely to be invalidated by what lands next; /verify-written-claims includes the post-landing invalidation grep.' ;;
  commit)    MSG='This is the session'"'"'s first git commit. The pre-commit hook covers the version cascade, links, freshness and fence parity; it checks no count, status or attribution in CHANGELOG.md, internal/log/, docs/postmortems/ or the planning documents. /verify-written-claims covers that gap for a staged diff.' ;;
esac

python3 - "$MSG" <<'PY'
import json, sys
print(json.dumps({"hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "additionalContext": sys.argv[1],
}}))
PY
exit 0
