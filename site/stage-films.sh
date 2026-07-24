#!/usr/bin/env bash
# Stage the skill's example scenes into site/films/ for serving.
#
# The scenes are tracked ONCE, as the skill's examples. This copies them in so
# the site has one source of truth instead of two divergent ones. Run from the
# site/ directory (Netlify's base dir); it is the build command in netlify.toml
# and is also what you run before a local preview.
#
# gearbox-neon.html is NOT staged — it is tracked here directly, because it is a
# showcase-only variant (one line: STYLE = BIBLES.neon) rather than a skill example.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
examples="$here/../plugin/skills/mitate/examples"

if [ ! -d "$examples" ]; then
  echo "stage-films: no examples at $examples" >&2
  exit 1
fi

mkdir -p "$here/films"
n=0
for f in "$examples"/*.html; do
  cp "$f" "$here/films/"
  n=$((n + 1))
done

echo "stage-films: staged $n scene(s) into films/"
