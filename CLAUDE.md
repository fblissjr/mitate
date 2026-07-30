last updated: 2026-07-30

# mitate

A Claude Code skill (and its showcase site) that turns any input into a
deterministic animated scene. Read [`docs/plan.md`](docs/plan.md) for the
architecture and the phase gates; this file is only the things that bite on the
first edit.

## Map

Deliberately unlinked, and deliberately complete — a heading map costs nothing
and cannot dangle. Measured 2026-07-30: from this file a cold session reached the
working plan in **3 hops and ~4,900 lines**, and never reached `README.md`,
`SKILL.md`, `sample.yml` or two of the agents at all, because nothing pointed at
them. The repo's front door and its primary shipped artifact were both outside
its own graph.

- **What it is, for a user** — `README.md` (repo root), `plugin/README.md`
- **The skill that ships** — `plugin/skills/mitate/SKILL.md`, plus
  `references/` (9, including `glossary.md` — the words this project uses as if
  you knew them), `templates/`, `examples/`, and `plugin/agents/film-reviewer.md`
- **Why, and in what order** — `VISION.md` *(planned)*, `docs/addressing.md`
  (what `t` is)
- **Architecture and phase gates** — `docs/plan.md`
- **The standing backlog** — `docs/working-plan.md` (the spine, tracks A-D, the
  ancestry table, deferred items with their triggers). Parts are superseded while
  the migration below is open; that plan wins where they disagree
- **Where each kind of fact lives** — `docs/source-of-truth.md`
- **How many times a shape has been rebuilt** — `docs/pattern-ledger.md`
- **Phase 4 constraints and red lines** — `docs/physics-bake-proposal.md`
- **Inherited measured findings** — `docs/predecessor-record.md` (2,770 lines;
  exceeds a default read window, so read it in ranges)
- **What to work on next** — `docs/restructure-2026-07.md` while it exists. It is
  the live queue, not a decision record, and it carries a current-position block.
- **Open decisions** — `docs/examples-placement.md`
- **What happened and why** — `CHANGELOG.md`, `docs/postmortems/`
- **Repo tools** — `scripts/selfcheck.js`, `install-hooks.sh`,
  `stage-films.sh`, `diagnose-determinism.js`, `sample-determinism.js`
- **CI** — `.github/workflows/gate.yml` (browser, main + PRs),
  `static.yml` (cheap checks, every push), `sample.yml` (manual only)
- **Repo-development agents** — `.claude/agents/control-builder.md`,
  `doc-claim-auditor.md`, `.claude/skills/audit-claims/`,
  `.claude/rules/model-delegation.md`

## The prime directive

Two rules. Everything else derives from them, and neither is negotiable.

- **The scene is a pure function of `t`.** No simulation state carried across
  frames, no `Math.random()` at runtime, no wall-clock dependence. Any frame
  renders independently and identically, which is what makes one scene file both
  the live HTML artifact and the source of a frame-exact MP4.
- **Tooling talks only to the window contract**, never to scene internals.
  **The membership list is not here.** `smoke.js` hard-asserts four names and
  reads the rest behind fallbacks; that tiering is the fact, and its home is
  `smoke.js`'s `CONTRACT` / `SOFT_CONTRACT` with the reader-facing version in
  [`README.md`](README.md#the-window-contract). This line carried a fourth,
  shorter list until 0.16.30 — six names, omitting `stopPlayback`, which is one
  of the four the gate actually enforces. Four copies of one membership, and the
  only wrong one was in the file that auto-loads.

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
   carries no `version` and no `author`, because the whole file including
   frontmatter loads into context on activation, so both would be standing cost
   with no runtime use. Do not add them. SKILL.md carried a
   `metadata.last_verified` field until 0.16.34 and no longer does: it asserted a
   human review, sat in always-loaded frontmatter, went stale on every edit, and
   nothing checked it — it was four days and two releases stale when removed. It
   now carries a **provenance header** in the body, the same form the references
   use, which records what was verified against what and IS checked
   (`selfcheck.js` check 4).

   A **fenced** block (`KERNEL`, `SOLVER`, `RIG`, `DRIVER`, `CHARACTER`, `HTML`)
   is carried by more files than it looks: both 3D templates, all five examples,
   and `site/films/gearbox-neon.html` — 8 tracked files for `SOLVER`, 9 for
   `KERNEL`. Edit every carrier together, then verify with `smoke.js
   --parity-only templates/*.html examples/*.html` **cross-directory**. A
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
   it. Verified: the cache contains `.claude-plugin/`, `README.md`, `skills/`
   and — since 0.16.32 — `agents/`, and no other content (plus plugin-manager
   dotfiles such as `.in_use`, which are bookkeeping, not yours). **Everything
   under `plugin/` ships**, which is the rule to reason from rather than that
   list; `scripts/selfcheck.js` resolves links against the plugin root for
   exactly that reason, so a new shipped directory is covered the day it exists. Link outside the subtree with an absolute repo URL, which
   resolves from the cache, a clone, and GitHub alike.

4. **Films are tracked once.** The scenes live in
   `plugin/skills/mitate/examples/`; `scripts/stage-films.sh` copies them into
   `site/films/` at build, which `site/.gitignore` ignores wholesale
   (`films/*.html`) so a new example needs no edit there.
   `site/films/gearbox-neon.html` is the one negated exception — a showcase-only
   variant, so `site/` is its only home. Poster stills live once in `site/posters/`, which
   the skill's `examples/README.md` embeds them by **absolute raw URL** — never a
   relative path, which climbs out of the install cache and breaks for every
   installed user (this invariant licensed exactly that until 0.16.5). Never
   re-introduce
   a second copy of either.

5. **Byte comparison is valid only within one backend.** WebGPU-Metal and the
   WebGL2 fallback do not produce byte-identical frames — that is expected, not
   a bug. Determinism is checked by seeking away and back on the *same* backend.

6. **Red before green, on modifications too.** Every gate check ships with a
   bracket (`templates/bracket-*.js`) carrying at least one arm that MUST fail,
   and the bracket exits non-zero when an arm misbehaves. A control that cannot
   go red is decorative; two of the three shipped brackets were exactly that
   until 0.16.17, printing rows and exiting 0 whatever the rows said.

   **The rule's teeth are on edits, not features.** The 0.16.16 defect — the
   gate failing every 3D scene on the default path — was introduced by 0.16.9's
   *test-audit pass*: it changed a console filter and wrote a comment asserting
   the change was measured, without re-running anything that would have shown the
   filter now matched nothing. So: touching a check, a threshold, a filter, or a
   flag means re-running its bracket **before** the change (prove red is
   reachable) and after (prove green is earned). Writing "measured" in a comment
   is not the measurement. `.github/workflows/gate.yml` runs all three brackets,
   which is what keeps them runnable; a new check with no bracket is visibly
   uncontrolled there.

   Standing debt: comments in `templates/*.js` that assert a measurement without
   naming the control behind it. **`scripts/selfcheck.js` owns the count and its
   definition, and ratchets it** — the budget may fall, never rise. Do not restate
   the figure here; it was briefly published in three files from a coarser grep
   and disagreed with the check within a day.

7. **The installed skill is not the skill you are editing.** `mitate` is
   normally enabled as a plugin on a machine where it is also developed, and the
   two are different artifacts: `plugin install` copies a subtree into a
   *version-stamped* cache, so invoking `/mitate` here loads the cached release,
   not the working tree. During 0.16.3 development the tree was 0.16.3 while the
   cache held 0.16.1, with differing `SKILL.md` files. Read the working tree
   when asking *what will ship*; read the cache when asking *what users have* —
   and say which one you checked, because they answer different questions. The
   cache is genuinely useful as the installed-user fixture, so do not disable
   the plugin to dodge this; label the copy instead. (mitate ships no hooks, so
   the loaded skill cannot act on this repo on its own — the hazard is reading
   the wrong copy, not interference.)

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
that configuration failing, so the gate must be able to enter it. This line named
the wrong tool until 0.16.18, which inverted the intent — anyone acting on it
would have "fixed" smoke by breaking the check.

Also true of the default fallback path: it is CI-safe, and until 0.16.16 the
gate was failing every 3D scene on it. Nothing ran it unattended. `.github/`
now does.

## Conventions

- Session logs and scratch renders go under `internal/` (gitignored).
- **Postmortems are TRACKED, in [`docs/postmortems/`](docs/postmortems/), named
  `YYYY-MM-DD_<mode>_<slug>.md`** so the listing sorts chronologically and a slug
  grep finds a topic. `.postmortem.json` pins that location so it is a decision
  rather than an inference. They were gitignored under `internal/` until 0.16.33,
  which made five tracked files — one of them shipped plugin content — cite
  evidence that existed on one machine. **Session logs stay local**: the log is
  narration, the postmortem is the distilled finding, and only the second is
  citable. A tracked postmortem MAY cite a local-only artifact, but must label it
  `(local)` and must not rest a claim on it. Deliberately no
  hand-written index: that is a copy whose only consumer is the check that it
  matches the directory. `/postmortem:postmortem-index` generates a browsable one
  from frontmatter when you want it. Start with the newest — a postmortem carries
  dated annotations, so its later corrections matter more than its first verdict.
- Documentation carries a **dated freshness marker**, in whichever of these
  three forms fits: a `last updated:` line (docs, plans), a dated **provenance
  header** saying what was verified against what (all eight references — the
  better instrument, since it records the check and not just the touch), or
  `metadata.last_verified` (SKILL.md only). A file that is itself a dated record
  needs none: `CHANGELOG.md` is dated by entry, and `THIRD_PARTY_LICENSES.md` is
  static legal text. `last updated:` means last **touched**, not last reviewed: a
  commit that edits a dated doc dates it to that commit, or the rule is
  unsatisfiable — review semantics are the provenance header's job, which is why
  both forms exist. `scripts/selfcheck.js` enforces this over every tracked `.md`
  carrying the marker, deriving that set rather than listing it. `.claude/agents/*` and `.claude/rules/*` are behaviour
  definitions rather than documentation — their freshness is git history — but
  note that they still make drift-prone claims: `doc-claim-auditor` cites "five
  real instances" of doc drift and that count is already low. An earlier version of this rule demanded one specific form
  and so read as violated by eleven files that all carried a better one.
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
