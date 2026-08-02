last updated: 2026-08-02

# Snapshot — 2026-08-02

A point-in-time record of what mitate is, how it is built, and how it checks
itself. Written at `main` = `3bb15b5` (0.16.60), with two PRs open at 0.16.61 and
0.16.62.

## Read this first: a snapshot is not a source of truth

This directory is a **dated record**, in the same class as `CHANGELOG.md`, the
session logs and the postmortems. It says what was true on 2026-08-02 and it does
not get updated. Nothing here settles a question.

That framing is load-bearing, not a disclaimer. This repo's most persistent
failure mode is the second copy: a fact restated somewhere it is not owned, which
then rots while the original moves. `docs/source-of-truth.md` exists to prevent
exactly this, and a document titled "complete snapshot of the whole project" is
the most dangerous shape that failure can take. So:

- **Where this disagrees with a live document, the live document wins.** Always,
  and without argument. The live homes are `CLAUDE.md` (invariants),
  `docs/plan.md` (architecture and phase gates), `docs/working-plan.md` (the
  backlog), `docs/source-of-truth.md` (which fact lives where).
- **Every count here was derived on 2026-08-02 and is frozen.** Do not cite one
  as current. Re-run the command instead; the commands are named beside the
  numbers wherever one exists.
- **Do not link to this directory from a live document.** A live document
  pointing at a frozen one is how the frozen one starts being read as current.

If you are a fresh session looking for orientation, you want
`docs/orientation.md`, not this. This is for the reader asking *how did it get
this way*, which no live document answers because no live document is supposed
to.

## What is in here

| File | What it covers |
|---|---|
| [`architecture.md`](architecture.md) | What mitate is, the two rules everything derives from, the layer model, how a scene is built and shipped, the plugin/repo split |
| [`verification.md`](verification.md) | Every check and control by name, what each can go red on, what runs where, and what is uncontrolled |
| [`state-of-play.md`](state-of-play.md) | Versions, branches, open PRs, carried hazards, filed open questions, measurement debts |
| [`doc-topology.md`](doc-topology.md) | The routing graph, which document owns which fact, what is superseded, and the drift found on the day this was written |
| [`history.md`](history.md) | How the project got from its first commit to here: eras, what dominated the work, and findings that are not recorded elsewhere |

## The one-paragraph version

mitate is a Claude Code skill that turns any input into a deterministic animated
scene, plus a showcase site for the output. A scene is one self-contained HTML
file with three.js embedded, and the whole project rests on a single property:
the scene is a pure function of `t`, so any frame renders independently and
identically. That is what makes one file both the live artifact and the source of
a frame-exact MP4, and it is why duration is free. Everything else in the repo —
the fences, the parity checks, the brackets, the self-check, the defect corpus —
exists to keep that property true and to keep the claims about it honest. By
volume the project is far more verification apparatus than it is animation code,
and that ratio is deliberate.
