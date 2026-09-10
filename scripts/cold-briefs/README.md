last updated: 2026-09-10

# Cold-build briefs

The prompts `scripts/cold-build.sh` feeds a plugin-only session. **A brief
never names mitate**: whether the skill's own description routes the request
is part of what a cold build measures, and a brief that invokes the skill by
name removes that measurement.

Each brief is held FIXED across runs so runs are comparable. Edit one and the
runs before the edit stop being comparable with the runs after it; add a new
file instead, and say in the manifest which one ran (the script records the
brief's SHA-256 for exactly that reason).

- `market-crash.md` — the baseline. The verbatim prompt of the first cold
  build (2026-08-04, 0.19.3, `docs/scene-analyses/2026-08-04_market-crash-cold.md`),
  recovered from that build's transcript `(local)`. 2D register, no
  characters. Every run of this brief compares against that record.
- `incident-timeline.md` — a timestamped record as the input: an invented
  outage log whose times must survive into the film. Written after a warm
  session built a film from a git record `(local)` and had to re-derive two
  things (a record clock with its inverse, screen-anchored labels under a
  moving 2D camera), both since carried into the kit. What it measures: does
  a cold session find `method.md`'s record-clock snippet and the 2D
  template's `worldToScreen`, or rebuild them. No run yet.

The plan that consumes these runs is `docs/harness-loop.md`.
