#!/usr/bin/env bash
# Run every bracket matching a glob, and DO NOT stop at the first red one.
#
#   ./scripts/run-brackets.sh 'plugin/skills/mitate/templates/bracket-*.js'
#
# One copy, called by both workflows. It was two copies: gate.yml and static.yml
# each carried the same loop and ~10 lines of the same prose explaining it, fixed
# at two call sites instead of once underneath. That is how the `!cancelled()`
# defect reappeared one level down, and the duplication was flagged for the same
# reason -- the next fix here would have had to be made twice, and one of them
# would have been forgotten.
#
# Every bracket must run even when one fails. 0.16.41's gate proved the cost of
# getting this wrong: bracket-commands failed and determinism, liveplay, noise
# and parity never ran -- four controls hidden behind one red.
#
# TWO THINGS COULD ENFORCE THAT AND ONLY ONE DOES. The load-bearing one is the
# `if ! bun run` below: a command inside a condition is exempt from -e, so the
# loop survives a red bracket no matter what -e says. Omitting `-e` here is
# belt, not braces -- mutation-tested 2026-07-31, and restoring `set -euo`
# changed nothing, no arm in bracket-run-brackets.js noticed. Kept anyway,
# because it is what saves the next person who rewrites the loop body without
# the `if !`; but do not read it as the guard, and do not delete the `if !`
# believing this line covers you.
set -uo pipefail

pattern="${1:?usage: run-brackets.sh '<glob>'   (quote it — this script expands it)}"

failed=""
ran=0
# Unquoted on purpose: word-splitting IS the expansion. The caller quotes the
# pattern so their shell leaves it alone and this one does the globbing.
# shellcheck disable=SC2086
for b in $pattern; do
  # An unmatched glob survives as a literal string under bash, so without this
  # the loop would "run" one nonexistent bracket and report it as a failure for
  # the wrong reason. The zero-match case is caught below instead, where it can
  # say what actually happened.
  [ -e "$b" ] || continue
  echo "--- $(basename "$b") ---"
  if ! bun run "$b"; then
    failed="$failed $(basename "$b")"
  fi
  ran=$((ran + 1))
done

# A GLOB THAT MATCHES NOTHING MUST NOT EXIT 0. Without this the loop body never
# executes, nothing is reported, and CI prints a green step having run zero
# controls -- the same silent-coverage-loss shape as an unmatched scene glob in
# smoke.js, and worse here because it disables EVERY bracket at once rather than
# shrinking one scan. Bracketed in scripts/bracket-run-brackets.js.
if [ "$ran" -eq 0 ]; then
  echo "::error::run-brackets.sh matched no bracket for '$pattern' — zero controls ran."
  echo "A glob that matches nothing is every control silently disabled at once."
  exit 1
fi

if [ -n "$failed" ]; then
  echo "::error::brackets failed:$failed"
  exit 1
fi
echo "every bracket ran ($ran), all green"
