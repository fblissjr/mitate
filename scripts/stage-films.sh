#!/usr/bin/env bash
# Stage the skill's example scenes into site/films/ for serving.
#
# The scenes are tracked ONCE, as the skill's examples. This copies them in so
# the site has one source of truth instead of two divergent ones. Run from the
# site/ directory (Netlify's base dir); it is the build command in netlify.toml
# and is also what you run before a local preview. Lives in scripts/; it
# resolves the repo root from its own location, so it works from any cwd.
#
# gearbox-neon.html is GENERATED here, not stored. It was a tracked 1.14 MB second
# copy of gearbox.html until 0.16.35 — 66% of the site's tracked bytes — differing
# by exactly one line. bibles.md claims a whole look is ONE object switched by one
# line; this script is that claim executed rather than asserted, and it fails loudly
# if the line it edits ever stops existing.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
examples="$root/plugin/skills/mitate/examples"
films="$root/site/films"

if [ ! -d "$examples" ]; then
  echo "stage-films: no examples at $examples" >&2
  exit 1
fi

mkdir -p "$films"

# CLEARED FIRST, and the order is the point. The derivation below can exit 1 —
# that is what its guard is for — and an aborted run used to leave the PREVIOUS
# gearbox-neon.html sitting beside freshly copied examples, with nothing saying
# it was stale. A local preview then served a film derived from a gearbox that no
# longer exists. Absent is visible; stale is not. Scoped to *.html because that is
# exactly what this script produces and what site/.gitignore ignores; nothing else
# in films/ is ours to delete.
rm -f "$films"/*.html

n=0
for f in "$examples"/*.html; do
  cp "$f" "$films/"
  n=$((n + 1))
done

# The neon bible variant, derived. Measured 2026-07-30: the stored copy differed
# from gearbox.html by the STYLE line and nothing else.
src="$films/gearbox.html"
if [ ! -f "$src" ]; then
  echo "stage-films: gearbox.html not staged — cannot derive the neon variant" >&2
  exit 1
fi
if ! grep -q 'const STYLE = BIBLES.workshop;' "$src"; then
  echo "stage-films: gearbox.html no longer selects its bible with" >&2
  echo "  'const STYLE = BIBLES.workshop;' — the neon variant cannot be derived." >&2
  echo "  Either restore that line or stop generating gearbox-neon.html." >&2
  exit 1
fi
sed 's/const STYLE = BIBLES.workshop;/const STYLE = BIBLES.neon;/' \
  "$src" > "$films/gearbox-neon.html"
n=$((n + 1))

echo "stage-films: staged $n scene(s) into films/ (gearbox-neon derived from gearbox)"
