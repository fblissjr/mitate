#!/usr/bin/env bash
# Run a COLD BUILD: a plugin-only Claude Code session builds a film from a
# fixed brief with nothing but the working-tree plugin, and the transcript is
# the measurement. This is the second flywheel's instrument (VISION.md, "How it
# gets better"); the record it feeds is docs/scene-analyses/, via
# /analyze-build-session. The plan that consumes the runs is
# docs/harness-loop.md.
#
#   MITATE_COLD_ROOT=<dir outside the repo> ./scripts/cold-build.sh [options]
#
#   --brief <file>       prompt file (default: scripts/cold-briefs/market-crash.md)
#   --model <alias>      model for the build (default: sonnet)
#   --effort <level>     low | medium | high | xhigh | max (default: unset — the CLI's default)
#   --mode <mode>        permission mode (default: auto — what every recorded fixture ran)
#   --cap <minutes>      wall-clock cap; the run is killed past it and the manifest says so (default: 240)
#   --budget <usd>       --max-budget-usd for the session (default: none)
#   --label <name>       run directory suffix (default: none)
#   --dry-run            print the command and the manifest, run nothing
#
# WHY THESE FLAGS, each one measured on 2026-09-04 against this machine:
#
#   --plugin-dir <run>/plugin    loads a COPY of the working tree's plugin/,
#       made into the run directory first. What will ship, not what users
#       have (CLAUDE.md invariant 7) — but loaded the way an install cache
#       is: the copy's parent holds nothing, so the session cannot walk up
#       from its skill directory into docs/ or scenes/. Loading plugin/ in
#       place would let it, and a marketplace install cannot (invariant 3).
#   --setting-sources ""         loads NO settings, so the marketplace-installed
#       mitate and every other installed plugin stay out. Probed: the session's
#       slash commands then hold exactly one plugin skill, mitate:mitate, from
#       --plugin-dir. Without this flag the other installed plugins load, and
#       with `--bare` or a fresh CLAUDE_CONFIG_DIR the session cannot log in
#       ("Not logged in") — OAuth credentials are not reachable from either.
#   --strict-mcp-config          drops the account's MCP connectors, which
#       otherwise load even with no settings (probed: seven of them).
#   --permission-prompts none    print mode has nobody to answer a prompt; a
#       tool call that would prompt is DENIED rather than hung. The manifest
#       records the denial count from the result event.
#   --output-format stream-json  the transcript, one event per line, to a file.
#       The CLI also persists the session under the config dir's projects/,
#       keyed by the workspace path; the script copies that file beside it.
#
# THE WORKSPACE IS EMPTY AND OUTSIDE THE REPO, so no CLAUDE.md is discovered
# from it or any parent — and the script refuses a cold root that has a
# CLAUDE.md or AGENTS.md anywhere in its ancestry, because the cold root may
# itself be a git repo and one instruction file there would load into every
# run. The account's global CLAUDE.md still loads, as it did for every
# recorded fixture — a shared axis, recorded in the manifest, not a
# contamination.
#
# PRIVACY. The transcript and the workspace stay under MITATE_COLD_ROOT, which
# is outside the repo on purpose and is never defaulted to a home path here
# (path-privacy: repo content carries no absolute home paths). The manifest is
# the only file meant to be cited, and it is cited by class ("the run
# manifest (local)"), never by path.
#
# AFTER THE RUN the script derives three things nobody should hand-write:
#   activation   did a Skill tool call name mitate — if not, the run is a
#                ROUTING measurement, labelled NOT-A-BUILD, and never counted
#                as a build of the docs;
#   reads        which files under the plugin the session read, and how many
#                times — the reference-read table the analysis skill wants;
#   contamination any read path under the repo (the in-place plugin/ included:
#                the session is meant to see only its copy) or under the
#                plugin cache — one hit marks the run CONTAMINATED.
#
# Controlled by scripts/bracket-cold-build.js (stub CLI; no model is called).
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLUGIN="$ROOT/plugin"
BRIEF="$ROOT/scripts/cold-briefs/market-crash.md"
MODEL="sonnet"
EFFORT=""
MODE="auto"
CAP_MIN=240
BUDGET=""
LABEL=""
DRY=0
CLAUDE_BIN="${MITATE_CLAUDE_BIN:-claude}"

while [ $# -gt 0 ]; do
  case "$1" in
    --brief)   BRIEF="$2"; shift 2 ;;
    --model)   MODEL="$2"; shift 2 ;;
    --effort)  EFFORT="$2"; shift 2 ;;
    --mode)    MODE="$2"; shift 2 ;;
    --cap)     CAP_MIN="$2"; shift 2 ;;
    --budget)  BUDGET="$2"; shift 2 ;;
    --label)   LABEL="$2"; shift 2 ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) sed -n '2,60p' "$0"; exit 0 ;;
    *) echo "cold-build: unknown option $1" >&2; exit 2 ;;
  esac
done

die() { echo "cold-build: $*" >&2; exit 2; }

[ -n "${MITATE_COLD_ROOT:-}" ] || die "MITATE_COLD_ROOT is unset — point it at an empty directory OUTSIDE the repo (the transcript and workspace land there and stay there)"
case "$MITATE_COLD_ROOT" in
  "$ROOT"|"$ROOT"/*) die "MITATE_COLD_ROOT is inside the repo — a cold workspace under the repo discovers CLAUDE.md and is not cold" ;;
esac
[ -d "$PLUGIN" ] && [ -f "$PLUGIN/.claude-plugin/plugin.json" ] || die "no plugin at $PLUGIN — nothing to load, refusing to run a session that would measure the built-in skills"
d="$MITATE_COLD_ROOT"; while :; do
  for f in CLAUDE.md AGENTS.md; do [ -f "$d/$f" ] && die "$d/$f would load into every cold session — the cold root and its ancestors must carry no instruction file"; done
  [ "$d" = "/" ] && break; d="$(dirname "$d")"
done
[ -f "$BRIEF" ] || die "brief not found: $BRIEF"
command -v "$CLAUDE_BIN" >/dev/null 2>&1 || die "claude CLI not on PATH (or MITATE_CLAUDE_BIN wrong)"
# A brief that names the skill removes the routing measurement (see cold-briefs/README.md).
if grep -qi 'mitate' "$BRIEF"; then die "brief names mitate — the skill's routing is part of what a cold build measures; use a brief that does not"; fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN="$MITATE_COLD_ROOT/runs/$STAMP${LABEL:+-$LABEL}"
WS="$RUN/workspace"
PLUGIN_RUN="$RUN/plugin"
mkdir -p "$WS"
cp -R "$PLUGIN" "$PLUGIN_RUN" || die "could not copy plugin/ into the run directory"
export MITATE_PLUGIN_DIR="$PLUGIN_RUN"

SHA="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"
DIRTY="$(git -C "$ROOT" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
PLUGIN_VERSION="$(sed -n 's/.*"version" *: *"\([^"]*\)".*/\1/p' "$PLUGIN/.claude-plugin/plugin.json" | head -1)"
CLAUDE_VERSION="$("$CLAUDE_BIN" --version 2>/dev/null | head -1)"
BRIEF_SHA="$(shasum -a 256 "$BRIEF" | cut -c1-64)"
HAS_FFMPEG="$(command -v ffmpeg >/dev/null 2>&1 && echo true || echo false)"
HAS_AVIFENC="$(command -v avifenc >/dev/null 2>&1 && echo true || echo false)"
BUN_VERSION="$(bun --version 2>/dev/null || echo none)"

CMD=("$CLAUDE_BIN" -p
     --plugin-dir "$PLUGIN_RUN"
     --setting-sources ""
     --strict-mcp-config
     --permission-mode "$MODE"
     --permission-prompts none
     --model "$MODEL"
     --output-format stream-json --verbose)
[ -n "$EFFORT" ] && CMD+=(--effort "$EFFORT")
[ -n "$BUDGET" ] && CMD+=(--max-budget-usd "$BUDGET")

json_str() { python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$1"; }

write_manifest() {
  # $1 = status, $2 = end iso, $3 = exit code, $4 = wall seconds
  cat > "$RUN/manifest.json" <<EOF
{
  "run": $(json_str "$(basename "$RUN")"),
  "status": $(json_str "$1"),
  "plugin_copy": "working-tree, copied into the run directory",
  "workspace_git_root": $(json_str "$(git -C "$WS" rev-parse --show-toplevel 2>/dev/null || echo none)"),
  "plugin_version": $(json_str "$PLUGIN_VERSION"),
  "git_sha": $(json_str "$SHA"),
  "git_dirty_files": $DIRTY,
  "claude_version": $(json_str "$CLAUDE_VERSION"),
  "model": $(json_str "$MODEL"),
  "effort": $(json_str "${EFFORT:-default}"),
  "permission_mode": $(json_str "$MODE"),
  "permission_prompts": "none",
  "brief": $(json_str "$(basename "$BRIEF")"),
  "brief_sha256": $(json_str "$BRIEF_SHA"),
  "environment": {
    "os": $(json_str "$(uname -sm)"),
    "bun": $(json_str "$BUN_VERSION"),
    "ffmpeg": $HAS_FFMPEG,
    "avifenc": $HAS_AVIFENC,
    "webgpu_env": $(json_str "${WEBGPU:-unset}")
  },
  "shared_axes": ["the account's global CLAUDE.md loads, as in every recorded fixture", "print mode: no human turn, no interruption"],
  "cap_minutes": $(json_str "$CAP_MIN"),
  "budget_usd": $(json_str "${BUDGET:-none}"),
  "started": $(json_str "$START_ISO"),
  "ended": $(json_str "$2"),
  "exit_code": $3,
  "wall_seconds": $4
}
EOF
}

START_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "cold-build: run $RUN"
echo "cold-build: plugin $PLUGIN_VERSION (working tree @ $SHA, $DIRTY dirty file(s)), model $MODEL, effort ${EFFORT:-default}, mode $MODE, cap ${CAP_MIN}m"
echo "cold-build: brief $(basename "$BRIEF") ($BRIEF_SHA)"
if [ "$DRY" -eq 1 ]; then
  printf 'cold-build: would run in %s:\n  ' "$WS"; printf '%q ' "${CMD[@]}"; echo "< $BRIEF > $RUN/transcript.jsonl"
  write_manifest "dry-run" "$START_ISO" 0 0
  cat "$RUN/manifest.json"
  exit 0
fi

# The run, capped. macOS ships no GNU timeout, so the watchdog is a background
# sleep that kills the session; the manifest records CAPPED when it fires.
CAP_SEC="$(awk "BEGIN{print $CAP_MIN*60}")"
T0=$(date +%s)
(
  cd "$WS" || exit 1
  exec "${CMD[@]}" < "$BRIEF" > "$RUN/transcript.jsonl" 2> "$RUN/stderr.log"
) &
PID=$!
# The watchdog's stdio goes to /dev/null: it inherits this script's stdout
# otherwise, and a caller reading that pipe (a bracket's spawnSync, a CI step)
# waits on the orphaned sleep until the whole cap has elapsed.
( sleep "$CAP_SEC"; kill -TERM "$PID" 2>/dev/null && echo capped > "$RUN/.capped" ) >/dev/null 2>&1 &
WATCH=$!
wait "$PID"; CODE=$?
pkill -P "$WATCH" 2>/dev/null; kill "$WATCH" 2>/dev/null; wait "$WATCH" 2>/dev/null
T1=$(date +%s)
END_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
CAPPED=$([ -f "$RUN/.capped" ] && echo true || echo false)

# Copy the CLI's own persisted session file beside the stream: the projects/
# directory is keyed by the workspace path with '/' and '.' folded to '-'.
CFG="${CLAUDE_CONFIG_DIR:-$HOME/.claude}" # path-privacy: ignore
PROJ="$CFG/projects/$(printf '%s' "$WS" | sed 's#[/.]#-#g')"
if [ -d "$PROJ" ]; then
  newest="$(ls -t "$PROJ"/*.jsonl 2>/dev/null | head -1)"
  [ -n "$newest" ] && cp "$newest" "$RUN/session.jsonl"
fi

# Derived verdicts. Everything below is read from the transcript, never typed.
python3 - "$RUN/transcript.jsonl" "$PLUGIN_RUN" "$ROOT" "$CFG" "$RUN" "$CAPPED" "$CODE" <<'PY'
import json, sys, os, re, collections
tr, plugin, root, cfg, run, capped, code = sys.argv[1:8]
plugin = os.path.realpath(plugin); root = os.path.realpath(root)
cache = os.path.join(os.path.realpath(cfg), 'plugins')
activated = False; reads = collections.Counter(); contaminated = []; denials = None
tool_calls = 0; tool_errors = 0; result = None; events = 0
def walk(o):
    if isinstance(o, dict):
        yield o
        for v in o.values(): yield from walk(v)
    elif isinstance(o, list):
        for v in o: yield from walk(v)
def outside(p):
    # A path under the run's plugin copy is a legitimate read; anything under
    # the repo (its in-place plugin/ included) or the plugin cache is not.
    rp = os.path.realpath(p) if p.startswith('/') else p
    if rp.startswith(plugin + os.sep): return 'plugin'
    if rp.startswith(root + os.sep) or rp.startswith(cache + os.sep): return 'outside'
    return None
for line in open(tr, encoding='utf-8', errors='replace'):
    line = line.strip()
    if not line: continue
    try: e = json.loads(line)
    except Exception: continue
    events += 1
    if e.get('type') == 'result':
        result = e; denials = len(e.get('permission_denials') or [])
    for o in walk(e):
        if o.get('type') == 'tool_use':
            tool_calls += 1
            name = o.get('name'); inp = o.get('input') or {}
            if name == 'Skill' and 'mitate' in json.dumps(inp): activated = True
            for k in ('file_path', 'path', 'notebook_path'):
                p = inp.get(k)
                if isinstance(p, str):
                    w = outside(p)
                    if w == 'plugin': reads[os.path.relpath(os.path.realpath(p), plugin)] += 1
                    elif w == 'outside': contaminated.append(p)
            cmd = inp.get('command') if name == 'Bash' else None
            if isinstance(cmd, str):
                for m in re.findall(r'(?:%s|%s)/[^\s"\'`;|&)]*' % (re.escape(root), re.escape(cache)), cmd):
                    if outside(m) == 'outside': contaminated.append(m)
        if o.get('type') == 'tool_result' and o.get('is_error'): tool_errors += 1
status = 'COMPLETE'
if capped == 'true': status = 'CAPPED'
elif events == 0 or result is None: status = 'NO-RESULT'
if not activated: status = 'NOT-A-BUILD (' + status + ')'
if contaminated: status = 'CONTAMINATED (' + status + ')'
verdict = {
  'status': status, 'exit_code': int(code), 'events': events,
  'skill_activated': activated, 'tool_calls': tool_calls, 'tool_errors': tool_errors,
  'permission_denials': denials,
  'plugin_reads': dict(sorted(reads.items())),
  'contaminating_paths': contaminated[:20],
  'cost_usd': (result or {}).get('total_cost_usd'), 'num_turns': (result or {}).get('num_turns'),
  'usage': (result or {}).get('usage'),
}
json.dump(verdict, open(os.path.join(run, 'verdict.json'), 'w'), indent=2)
print('cold-build: status', status)
print('cold-build: skill activated', activated, '| tool calls', tool_calls, '| tool errors', tool_errors, '| denials', denials)
print('cold-build: plugin files read:', len(reads), '| contaminating paths:', len(contaminated))
for p, n in sorted(reads.items()): print('   ', n, 'x', p)
for p in contaminated[:5]: print('    CONTAMINATED:', p)
PY

STATUS="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["status"])' "$RUN/verdict.json" 2>/dev/null || echo UNKNOWN)"
write_manifest "$STATUS" "$END_ISO" "$CODE" "$((T1 - T0))"
echo "cold-build: manifest $RUN/manifest.json; transcript $RUN/transcript.jsonl; workspace $WS"
echo "cold-build: next — /analyze-build-session on the transcript, then compare against the brief's baseline record in docs/scene-analyses/"
case "$STATUS" in
  COMPLETE) exit 0 ;;
  *) exit 1 ;;
esac
