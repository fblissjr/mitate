last updated: 2026-07-30

# mitate

A Claude Code skill (and its showcase site) that turns any input into a
deterministic animated scene. Read [`docs/plan.md`](docs/plan.md) for the
architecture and the phase gates; this file is only the things that bite on the
first edit.

## Map

Deliberately unlinked — a heading map costs nothing and cannot dangle. It covers
**everything outside `docs/`**, because anything absent from a map is unreachable
in practice, and this repo's front door and its shipped skill once sat outside
their own graph.

**For everything inside `docs/`, read [`docs/README.md`](docs/README.md)** — it
routes question → file, including what to work on next and
[`docs/orientation.md`](docs/orientation.md), the ~50-line briefing to hand a
subagent (which never auto-loads this file). Neither is restated here; a second
copy of a router is the exact failure this file keeps catching.

- **What it is, for a user** — `README.md` (repo root), `plugin/README.md`
- **Why, and in what order** — `VISION.md` (determinism first, and what for)
- **The skill that ships** — `plugin/skills/mitate/SKILL.md`, plus
  `references/` (start with `glossary.md` — the words this project uses as if you
  knew them), `templates/`, `examples/`, and `plugin/agents/film-reviewer.md`
- **What happened and why** — `CHANGELOG.md`
- **Repo tools** — `scripts/selfcheck.js`, `install-hooks.sh`,
  `stage-films.sh`, `diagnose-determinism.js`, `sample-determinism.js`.
  `scripts/bracket-*.js` are their controls, and **cover two of the five** —
  `selfcheck.js` and `stage-films.sh`. The other three are uncontrolled, which
  invariant 6 wants visible rather than glossed
- **The website** — `site/` (`index.html`, `app.js`, `posters/`; films are staged
  in, never tracked). A glorified `README.md` with example scenes: how the vision
  and the plan get communicated outward. **Strictly downstream** — `VISION.md`,
  `plan.md`, `README.md` and the code inform its language; nothing flows back,
  and it settles no question. It owns nothing, so it is never the tiebreaker —
  but a wording change upstream is work on the site, or the two drift
- **CI** — `.github/workflows/gate.yml` (browser, main + PRs; brackets under
  `templates/`), `static.yml` (cheap checks, every push; brackets under
  `scripts/`), `sample.yml` (manual only). **Brackets live in two directories and
  each workflow globs one** — put one in the wrong directory and it runs nowhere.
  The pre-commit hook runs neither, by design.
- **Repo-development agents** — `.claude/agents/control-builder.md`,
  `doc-claim-auditor.md`, `.claude/skills/audit-claims/`,
  `.claude/rules/model-delegation.md`

## The prime directive

Two rules. Everything else derives from them, and neither is negotiable.

- **The scene is a pure function of `t`, and `t` is a position, not a clock.**
  An address you evaluate, not a cursor you advance. No state carried across
  frames, no `Math.random()` at runtime, no wall-clock dependence. Any frame
  renders independently and identically, which is what makes one scene file both
  the live HTML artifact and the source of a frame-exact MP4 — and what makes
  duration free, since a frame at `t=18000` costs what a frame at `t=1` costs.
- **Tooling that DRIVES a scene talks only to the window contract**, never to
  scene internals. That is what keeps the recorder, the gate and the site generic
  — any scene is swappable for any other because none of them knows a film's
  variable names.

  **One admitted exception: `build.js probe`**, which evaluates scene-specific
  expressions because measuring a contact requires naming the two things. It
  holds on three conditions, all checkable: it only reads, it runs at authoring
  time, and **it is in no pipeline that produces an artifact.** Break any and the
  exception lapses.

  **The membership list is not here** — it is `smoke.js`'s `CONTRACT` /
  `SOFT_CONTRACT` (tiered: four names hard-asserted, the rest behind fallbacks),
  with the reader-facing copy in [`README.md`](README.md#the-window-contract).

Anything that cannot be had under those rules gets reformulated (bake at build
time, play back pure) or not had. The Phase 4 bake proposal is exactly that
reformulation — see [`docs/physics-bake-proposal.md`](docs/physics-bake-proposal.md)
for its red lines.

## Repo invariants

1. **Self-containment: one scene = one HTML file.** three.js is embedded per
   file (~1 MB IIFE). No CDN, no `type="module"`, no sibling `.js`. `smoke.js`
   fails any scene that violates this — do not "fix" a failure by relaxing the
   check. Because three.js ships inside every scene, its MIT notice is required:
   [`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md) carries it.

2. **Plugin content change ⇒ version cascade (three files).**
   `plugin/.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` +
   a [`CHANGELOG.md`](CHANGELOG.md) entry. Without all three, `marketplace
   update` never reaches installed users. Editing anything under
   `plugin/skills/mitate/` — templates, references, examples, not just SKILL.md
   prose — is plugin content. **SKILL.md is deliberately NOT in the cascade:** it
   carries no `version`, no `author` and no freshness field, because the whole
   file loads into context on activation and none of the three has a runtime use.
   Its dating lives in a **provenance header** in the body, which `selfcheck.js`
   check 4 verifies.

   A **fenced** block (`KERNEL`, `SOLVER`, `RIG`, `DRIVER`, `CHARACTER`, `HTML`)
   is carried by both 3D templates and every example — more files than it looks,
   and the count grows with the corpus, so `--parity-only` reports it rather than
   this file stating it. Edit every carrier together, then verify with `smoke.js
   --parity-only templates/*.html examples/*.html` **cross-directory**: a
   per-directory green does not cover the template↔example boundary, and drift
   there is silent.

3. **The plugin lives under `plugin/`, not at the repo root.** `marketplace add`
   shallow-clones the whole repo, but `plugin install` copies *the plugin
   subtree* into a per-version cache. Keeping `site/` and `docs/` outside
   `plugin/` keeps every cached version to what the skill actually needs. For
   the same reason, SKILL.md must never cite a path outside its own subtree —
   the install cache has no `docs/`, so such a pointer dangles for every
   installed user. **The plugin README is NOT exempt** — it ships into that same
   cache, so a `../docs/...` link from it dangles for exactly the reader holding
   it. **Everything under `plugin/` ships** — that is the rule to reason from,
   rather than a list that goes stale the next time a directory is added.
   `scripts/selfcheck.js` resolves links against the plugin root for exactly that
   reason, so a new shipped directory is covered the day it exists. Link outside
   the subtree with an absolute repo URL, which resolves from the cache, a clone,
   and GitHub alike.

4. **Films are tracked once.** The scenes live in
   `plugin/skills/mitate/examples/`; `scripts/stage-films.sh` copies them into
   `site/films/` at build, which `site/.gitignore` ignores wholesale
   (`films/*.html`) so a new example needs no edit there.
   **There are no exceptions.** `gearbox-neon.html` is DERIVED by
   `stage-films.sh`, not stored. Poster stills live once in `site/posters/`, and
   the skill's `examples/README.md` embeds them by **absolute raw URL** — never a
   relative path, which climbs out of the install cache and breaks for every
   installed user. Never re-introduce a second copy of either.

5. **Byte comparison is valid only within one backend.** WebGPU-Metal and the
   WebGL2 fallback do not produce byte-identical frames — that is expected, not
   a bug. Determinism is checked by seeking away and back on the *same* backend.

6. **Red before green, on modifications too.** Every gate check ships with a
   bracket (`templates/bracket-*.js`) carrying at least one arm that MUST fail,
   and the bracket exits non-zero when an arm misbehaves. A control that cannot
   go red is decorative — a bracket that prints its rows and exits 0 whatever
   they say is the shape to watch for.

   **The rule's teeth are on edits, not features.** Touching a check, a
   threshold, a filter or a flag means re-running its bracket **before** the
   change (prove red is reachable) and after (prove green is earned). Writing
   "measured" in a comment is not the measurement — a test-audit pass that
   changed a console filter and asserted the change was measured is how the gate
   came to fail every 3D scene on its default path.

   Standing debt: comments in `templates/*.js` that assert a measurement without
   naming the control behind it. **`scripts/selfcheck.js` owns the count and its
   definition, and ratchets it** — the budget may fall, never rise. Do not restate
   the figure here: a count written in prose disagrees with the check that
   derives it, and the check is the one that runs.

7. **The installed skill is not the skill you are editing.** `mitate` is
   normally enabled as a plugin on a machine where it is also developed, and the
   two are different artifacts: `plugin install` copies a subtree into a
   *version-stamped* cache, so invoking `/mitate` here loads the cached release,
   not the working tree, and the two routinely differ by several versions and a
   whole `SKILL.md`. Read the working tree when asking *what will ship*; read the
   cache when asking *what users have* — and say which one you checked. The cache
   is the installed-user fixture, so do not disable the plugin to dodge this;
   label the copy instead. (mitate ships no hooks, so the hazard is reading the
   wrong copy, not interference.)

## Tooling

`bun`, `three@0.185.1` + `playwright-core@1.61.1` (both pinned), ffmpeg on PATH;
`avifenc` for AVIF loops, `img2webp` for WebP. The recorder resolves `three` from
the workspace where a scene is being built, not from the plugin.

Default headless path is the WebGL2 fallback (CI-safe, no GPU). Hardware WebGPU
is opt-in per platform (`WEBGPU=metal` on macOS; measurably faster for
recording — figure and conditions in `references/webgpu-stack.md`).
**Flag landmine:** `--enable-unsafe-webgpu` on macOS headless yields a
SwiftShader adapter that renders pure black, silently, exit 0. **`shoot.js`**
refuses `WEBGPU=swiftshader` for exactly this reason — `refuseSwiftshaderShip`
in `backend.js`, overridable only by `WEBGPU_UNSAFE_SHIP=1`. `smoke.js`
deliberately does NOT refuse it: its shipped-frame check exists to demonstrate
that configuration failing, so the gate must be able to enter it. Naming the
wrong tool here inverts the intent: anyone acting on it "fixes" smoke by breaking
the check.

## Conventions

- Session logs and scratch renders go under `internal/` (gitignored).
- **Postmortems are TRACKED, in [`docs/postmortems/`](docs/postmortems/), named
  `YYYY-MM-DD_<mode>_<slug>.md`** so the listing sorts chronologically and a slug
  grep finds a topic; `.postmortem.json` pins that location. **Session logs stay
  local**: the log is narration, the postmortem is the distilled finding, and
  only the second is citable. A tracked postmortem MAY cite a local-only
  artifact, but must label it `(local)` and must not rest a claim on it.
  Deliberately no hand-written index — `/postmortem:postmortem-index` generates
  one from frontmatter. Read the newest first: a postmortem carries dated
  annotations, so its later corrections outrank its first verdict.
- Documentation carries a **dated freshness marker**, in whichever of the two
  forms fits: a `last updated:` line (docs, plans), or a dated **provenance
  header** saying what was verified against what (every reference, and SKILL.md).
  The second is the better instrument — it records the check, not just the touch —
  and both exist because `last updated:` means last **touched**: a commit that
  edits a dated doc dates it to that commit, or the rule is unsatisfiable. A file
  that is itself a dated record needs neither (`CHANGELOG.md`,
  `THIRD_PARTY_LICENSES.md`). `scripts/selfcheck.js` enforces this over every
  tracked `.md` carrying the marker, deriving that set rather than listing it.
  `.claude/agents/*` and `.claude/rules/*` are behaviour definitions, not
  documentation — their freshness is git history — so **nothing mechanical covers
  them**, and a review found four stale claims in one agent file, each of which
  would have made it report a working capability as drift. `/audit-claims` routes
  at them explicitly for that reason; it is their only control.
- **Two controls exist to be used, not rediscovered.** `/audit-claims` dispatches
  `doc-claim-auditor` at whatever the diff touched — the executable form of the
  drift rule in `source-of-truth.md`, which went unrun for this repo's whole life
  despite being written down. `./scripts/install-hooks.sh` installs the pre-commit
  self-check and fence parity into the slot path-privacy leaves free; `.git/hooks/`
  is untracked, so that installer is the only reproducible copy of the hook.
- **Commit freely; never push.** Pushing is the owner's call, always. Validate
  before writing, and let the pre-commit hook gate the commit rather than
  deferring the commit itself (owner directive, 2026-07-29 — this line read
  "never auto-commit" and no longer matches how the repo is worked).
- Every fact has one home — code comment, reference, SKILL.md, or CLAUDE.md —
  and everything else points at it. Before writing the same thing in two
  places, read [`docs/source-of-truth.md`](docs/source-of-truth.md).
