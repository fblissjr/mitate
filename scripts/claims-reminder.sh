#!/usr/bin/env bash
# A one-line, model-facing, non-blocking reminder that fires at the moment
# this repo's record says the failure happens: a claim about repo state being
# written into summary prose from memory instead of re-derived. Wired as a
# PreToolUse hook in .claude/settings.json; controlled by
# scripts/bracket-claims-reminder.js (static.yml's glob runs it).
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

set -euo pipefail

IN="$(cat)"

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
  Edit|Write|MultiEdit|NotebookEdit)
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

case "$CLASS" in
  changelog) MSG='This CHANGELOG entry is summary prose about work you did. Every count, "red first" claim and refusal list in it must be re-derived now — run the bracket, read its tally — not written from the session. The 0.18.0 entry contradicted its own next paragraph and was corrected 40 minutes later in 38e3773. Run /verify-written-claims on the staged diff before committing.' ;;
  record)    MSG='This is a dated record. Counts, statuses and attributions written here are outside every mechanical guard: scripts/derived-counts.js excludes CHANGELOG.md, internal/log/, docs/postmortems/ and the planning documents by design. Cite the command, not its output; label anything resting on session memory as (memory) and anything untracked as (local). /verify-written-claims has the procedure.' ;;
  status)    MSG='You are writing a status claim into a live document — MET, landed, open, next, "deliberately not". A status has a validity window: log_2026-08-02 said invariant 2 was "deliberately NOT touched" and the same session landed it an hour later (1df1fbe). Re-read the stamp or run the command that decides the status, and when something lands later today, grep this file again for the framing it invalidated.' ;;
  commit)    MSG='First commit of this session. The pre-commit hook covers the version cascade, links, freshness and fence parity — it does NOT check any count, status or attribution in CHANGELOG.md, internal/log/, docs/postmortems/ or the planning documents. If this commit or a later one touches those, run /verify-written-claims over the staged diff first.' ;;
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
