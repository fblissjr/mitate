last updated: 2026-08-02

# Zero-context orientation

For a session or subagent arriving with nothing. **This routes; it does not
restate.** If it grows past about fifty lines it has started duplicating the
files it points at, and the fix is to cut it, not to reconcile it.

## The two rules that are never negotiable

1. **A scene is a pure function of `t`.** No state across frames, no
   `Math.random()` at runtime, no wall-clock. Any frame renders independently and
   identically — that is what makes one file both the live HTML and the source of
   a frame-exact MP4.
2. **Tooling talks only to the window contract**, never to scene internals.

Anything that cannot be had under those gets reformulated (bake at build time,
play back pure) or not had.

## Three ways to break something without noticing

- **Editing under `plugin/` without the version cascade.** `plugin.json` +
  `marketplace.json` + a `CHANGELOG.md` entry, or the change never reaches an
  installed user.
- **Hand-editing a fenced block inside a carrier.** `CONTRACT`/`KERNEL`/
  `SOLVER`/`RIG`/`DRIVER`/`CHARACTER`/`HTML` live once, in
  `plugin/skills/mitate/templates/fences/<NAME>.fence.txt` (0.17.0). Edit the
  store copy, then `smoke.js --parity-fix` regenerates every carrier; run
  `--parity-only` **cross-directory** to confirm. Never edit a fence in a
  scene — parity checks each carrier against the store, and there is no
  `--from`.
- **Citing a path from inside `plugin/` that lives outside it.** Everything under
  `plugin/` ships to a cache that has no `docs/`, no `CLAUDE.md`, no `scripts/`.
  Such a pointer dangles for every installed user.

## The house discipline, in four lines

- **Measure, do not assert.** A claim without a re-runnable control is a rumor.
- **Red before green.** Prove a check can fail before trusting that it passed.
- **One home per fact.** Everything else points. A figure in two places is the bug.
- **Never hand-write what a command produces.** A number that is not written
  cannot be wrong.

## Commands that tell you the truth

    git status --short                              # FIRST — see below
    bun run scripts/selfcheck.js                    # claims vs code, instant
    bun run .../templates/smoke.js --parity-only …  # fence parity, no browser
    bun run scripts/bracket-*.js                    # controls on the repo tools
    bun run .../templates/bracket-*.js              # controls on the scene checks

**Check `git status` before you trust a red.** This tree is often worked by more
than one session at once, so a failing check may be someone's in-flight edit
rather than a defect in `main`. `git show HEAD:<file>` tells you what the
committed version does. A cold-start run nearly reported the repo broken over a
check that was green again five minutes later.

## Where to go next

**[`VISION.md`](../VISION.md) is the most important document here** — it says why
the two rules above exist and what they are *for*. Read it before proposing
anything structural; where another file conflicts with it about intent, it wins.

[`docs/README.md`](README.md) routes question → file. Start there rather than
guessing. `CLAUDE.md` carries the invariants and the full map of scripts,
workflows and agents. `plugin/skills/mitate/references/glossary.md` defines the
words this project uses as if you already knew them — `register`, `fence`, the
parity set, the install cache.

**One hazard worth knowing before it costs you an hour:** the installed plugin
and the working tree are different artifacts at different versions. Say which one
you checked, because they answer different questions — *what will ship* versus
*what users have*.
