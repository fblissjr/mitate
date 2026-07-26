last updated: 2026-07-25

# mitate

A Claude Code skill (and its showcase site) that turns any input into a
deterministic animated scene. Read [`docs/plan.md`](docs/plan.md) for the
architecture and the phase gates; this file is only the things that bite on the
first edit.

## The prime directive

Two rules. Everything else derives from them, and neither is negotiable.

- **The scene is a pure function of `t`.** No simulation state carried across
  frames, no `Math.random()` at runtime, no wall-clock dependence. Any frame
  renders independently and identically, which is what makes one scene file both
  the live HTML artifact and the source of a frame-exact MP4.
- **Tooling talks only to the window contract**, never to scene internals:
  `window.seekTo` / `DURATION` / `BEATS` / `FRAME` / `SHOTS` / `sceneReady`.

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
   with no runtime use. Do not add them. `metadata.last_verified` asserts that a
   human reviewed the skill against its source — write it only after an actual
   review, never as part of a version bump.

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
   installed user. (Plugin READMEs may, since a repo clone has them.)

4. **Films are tracked once.** The scenes live in
   `plugin/skills/mitate/examples/`; `scripts/stage-films.sh` copies them into
   `site/films/` at build, which `site/.gitignore` ignores wholesale
   (`films/*.html`) so a new example needs no edit there.
   `site/films/gearbox-neon.html` is the one negated exception — a showcase-only
   variant, so `site/` is its only home. Poster stills live once in `site/posters/`, which
   the skill's `examples/README.md` embeds by relative path. Never re-introduce
   a second copy of either.

5. **Byte comparison is valid only within one backend.** WebGPU-Metal and the
   WebGL2 fallback do not produce byte-identical frames — that is expected, not
   a bug. Determinism is checked by seeking away and back on the *same* backend.

## Tooling

`bun`, `three@0.185.1` + `playwright-core@1.61.1` (both pinned), ffmpeg on PATH;
`avifenc` for AVIF loops, `img2webp` for WebP. The recorder resolves `three` from
the workspace where a scene is being built, not from the plugin.

Default headless path is the WebGL2 fallback (CI-safe, no GPU). Hardware WebGPU
is opt-in per platform (`WEBGPU=metal` on macOS, ~2.3x faster for recording).
**Flag landmine:** `--enable-unsafe-webgpu` on macOS headless yields a
SwiftShader adapter that renders pure black, silently, exit 0. `smoke.js` refuses
`WEBGPU=swiftshader` for exactly this reason.

## Conventions

- Session logs and scratch renders go under `internal/` (gitignored).
- Documentation carries a `last updated:` line.
- Never auto-commit; validate before writing.
- Every fact has one home — code comment, reference, SKILL.md, or CLAUDE.md —
  and everything else points at it. Before writing the same thing in two
  places, read [`docs/source-of-truth.md`](docs/source-of-truth.md).
