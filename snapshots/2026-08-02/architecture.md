last updated: 2026-08-02

# Architecture, as of 2026-08-02

Frozen record. `CLAUDE.md` owns the invariants and `docs/plan.md` owns the phase
gates; where this disagrees with either, they win. See
[`README.md`](README.md) for why that matters here more than usual.

## What the thing actually is

Two artifacts share one repo:

1. **A Claude Code skill** (`plugin/skills/mitate/`) that turns any input into a
   deterministic animated scene. `mitate` (見立て) is to see one thing as
   another — here, seeing any input as a scene. Its output is a single
   self-contained HTML file.
2. **A showcase site** (`site/`) that presents example films. Strictly
   downstream: it consumes plugin artifacts and settles nothing.

The skill is what ships. Everything else — `docs/`, `scripts/`, `site/`,
`fixtures/`, `internal/` — is development apparatus that never reaches a user.

**Scale, derived 2026-08-02** (`git ls-files`, sizes from the working tree):

| Tree | Files | Size | Ships? |
|---|---|---|---|
| `plugin/` | 33 | 6.03 MB | yes, all of it |
| `site/` | 24 | 0.57 MB | no (deployed separately) |
| `docs/` | 14 | 0.66 MB | no |
| `fixtures/` | 2 | 1.17 MB | no |
| `scripts/` | 10 | 0.13 MB | no |
| `internal/` | 4 | 0.09 MB | no (only `internal/log/` is tracked) |
| `.claude/` | 4 | 0.03 MB | no |
| `CHANGELOG.md` | 1 | 0.22 MB | no |

The 6 MB in `plugin/` is almost entirely three.js: it is embedded per scene file,
about 1 MB each, which is invariant 1 doing its job rather than bloat.

## The prime directive

Two rules. Everything else in the repo is downstream of them, and `CLAUDE.md`
states both as non-negotiable.

### Rule 1 — the scene is a pure function of `t`, and `t` is a position

An address you evaluate, not a cursor you advance. No state carried across
frames, no `Math.random()` at runtime, no wall-clock dependence.

The consequences are the entire value proposition:

- **Any frame renders independently and identically.** So the live HTML page and
  a recorded MP4 are provably the same film, rather than two things that look
  alike.
- **Duration is free.** A frame at `t=18000` costs what a frame at `t=1` costs,
  because neither depends on the frames before it.
- **Recording parallelizes for free.** `shoot.js --workers N` gives each worker a
  contiguous slice of the range with, in its own words, "zero correctness risk."
  Contiguous rather than strided on purpose: a worker that dies leaves one
  obvious gap instead of a comb an encoder would silently smooth over.
- **Seeking is exact**, which is what makes determinism checkable at all — seek
  away, seek back, compare bytes.

Anything that cannot be had under this rule gets reformulated (bake at build
time, play back pure) or is not had. `docs/physics-bake-proposal.md` is that
reformulation for physics, and carries its own red lines.

### Rule 2 — tooling that DRIVES a scene talks only to the window contract

Never to scene internals. This is what keeps the recorder, the gate and the site
generic: any scene is swappable for any other, because no tool knows a film's
variable names.

The contract is **tiered**, and the membership list lives in `smoke.js`, not in
prose:

```
CONTRACT      = seekTo, DURATION, stopPlayback, sceneReady     (hard-asserted)
SOFT_CONTRACT = BEATS, FRAME, FLASHES, CAPFADE                 (behind fallbacks)
```

A scene missing a soft name is degraded, not broken. `SHOTS` joins the soft set
for 3D scenes only — a 2D scene has no shot list by design, so an unconditional
check would warn on every one of them.

**One admitted exception to rule 2: `build.js probe`**, which evaluates
scene-specific expressions because measuring a contact requires naming the two
things. It holds on three checkable conditions — it only reads, it runs at
authoring time, and it is in no pipeline that produces an artifact. Break any and
the exception lapses. `selfcheck.js` verifies the single-call-site half.

## The layer model

Named on the showcase site and implemented in every carrier:

| Layer | What it is |
|---|---|
| **kernel** | Pure functions. `pose(state)`, `materials(state)`, `camera(state)`. No clock, no input, no side effects. State is a plain value. |
| **driver** | Produces the state stream. The *timeline driver* is `state = g(t)` from the beats — that is the film. An *input driver* (`state = g(events)`) would reuse the same kernel — that is the interactive spike, not yet built. |
| **contract** | The window names above. The one seam tooling may touch. |
| **tooling** | `build.js`, `shoot.js`, `smoke.js`, the instruments. Talk only to the contract. |

The layer boundary is why the recorder and the live page can never disagree about
*when*.

**The state seam is mid-migration as of this snapshot.** PR #6 (0.16.62) changes
`setCamera(t)` to `setCamera(state)` where `state` holds only `{t}` today. The
point is not the current payload but the signature: a bake, a viewer and an input
driver all need to widen that one argument, and widening a parameter is a local
edit where changing a signature across every carrier is not. One discipline keeps
it from becoming a global with better manners — the driver owns what goes in, and
the kernel never reads anything the timeline driver cannot produce.

## One scene = one HTML file

Invariant 1. three.js is embedded per file as a ~1 MB IIFE. No CDN, no
`type="module"`, no sibling `.js`. `smoke.js` fails any scene that violates this,
and the documented response to such a failure is to fix the scene, never to relax
the check.

Because three.js ships inside every scene, its MIT notice is legally required;
`THIRD_PARTY_LICENSES.md` carries it.

Shipped example scenes, derived 2026-08-02:

| Scene | Lines | Size |
|---|---|---|
| `bear-and-bees.html` | 1784 | 1.1M |
| `menagerie.html` | 1684 | 1.1M |
| `gearbox.html` | 1361 | 1.1M |
| `noise-chart.html` | 1351 | 1.1M |
| `materials.html` | 1329 | 1.1M |

## Fences and the parity set

A scene is not written from scratch. Seven named blocks are held **byte-identical
across every carrier**: <!--count-mention-->

```
CONTRACT   KERNEL   SOLVER   RIG   DRIVER   CHARACTER   HTML
```

Carried by both 3D templates and every example and the defect-corpus fixture —
nine files on this date, spanning three directories. That cross-directory span is
the part that bites: a per-directory green does not cover the template-to-example
boundary, and drift there is silent. The check must be invoked with three globs
(`templates/`, `examples/`, `fixtures/defect-corpus/`), and the authoritative
copy of that command is `scripts/install-hooks.sh`'s `HOOK_BODY`.

Propagation is no longer hand work. `smoke.js --parity-fix --from <canonical>`
propagates a block from a source you **name** — never a majority, because a
majority vote is how a drifted block rewrites the two carriers that were right.
It refuses a malformed source or target and writes nothing until every file
validates.

**Why fences rather than a shared library:** invariant 1 forbids a sibling `.js`,
so the alternative to duplication-with-a-checker is not modularity, it is
divergence. The fence system is duplication that cannot silently drift.

## The plugin / repo split

`plugin install` copies **the plugin subtree** into a per-version cache;
`marketplace add` shallow-clones the whole repo. So keeping `docs/`, `site/` and
`scripts/` outside `plugin/` keeps every cached version to what the skill needs.

Two consequences that have each caused real defects:

- **SKILL.md must never cite a path outside its own subtree.** The install cache
  has no `docs/`, so such a pointer dangles for every installed user. The plugin
  README is not exempt — it ships into the same cache. Link outward with an
  absolute repo URL, which resolves from cache, clone and GitHub alike.
- **The installed skill is not the skill you are editing.** mitate is normally
  enabled as a plugin on a machine where it is also developed. Invoking `/mitate`
  in this repo loads the *cached release*, not the working tree, and the two
  routinely differ by several versions and a whole SKILL.md. Read the working
  tree to ask what will ship; read the cache to ask what users have; say which
  one you checked.

Everything under `plugin/` ships — stated as a rule to reason from rather than a
list, because a list goes stale the next time a directory is added.
`selfcheck.js` resolves links against the plugin root for the same reason.

## What ships, in detail

```
plugin/
  README.md                      user-facing
  .claude-plugin/plugin.json     version (half of the cascade)
  agents/film-reviewer.md        review agent, shipped
  skills/mitate/
    SKILL.md                     274 lines, loads whole on activation
    references/                  bibles, characters, delivery, film-language,
                                 glossary, instruments, materials, method,
                                 recordings, webgpu-stack
    templates/                   3 scene templates + the toolchain + brackets
    examples/                    5 films
```

**SKILL.md is deliberately not in the version cascade.** It carries no `version`,
no `author`, no freshness field, because the whole file loads into context on
activation and none of the three has a runtime use. Its dating lives in a
provenance header in the body, which `selfcheck.js` check 4 verifies. Its
frontmatter `description` is the routing surface a model reads when deciding
whether to invoke, and it is capped at 1024 by the Agent Skills spec — currently
986.

### The toolchain

| Tool | Lines | Role |
|---|---|---|
| `smoke.js` | 1591 | the gate: contract, self-containment, determinism, fence parity |
| `build.js` | 1070 | `vendor bundle frames video all avif loop poster sheet aspect strip motion probe` |
| `shoot.js` | 327 | drives `seekTo(t)` in headless Chromium, screenshots frames |
| `backend.js` | 182 | backend selection and the SwiftShader refusal |

`smoke.js` and `build.js` are deliberately **not** split into files. The repo's
own argument against splitting `method.md` — a split creates a boundary to keep
consistent — applies harder to code that ships, and it was measured that nothing
in `templates/` truncates a default read.

## How a film gets made

The skill's documented workflow, seven steps: spec before any code, scaffold from
a template, author the film, review on three axes (composition, continuity,
semantics), smoke-test the contract, deliver — **the HTML file is the
deliverable** — and export only if the destination cannot run a page.

Export is genuinely optional and the repo has been correcting itself on this
point: ffmpeg is an export utility, not a core or validation dependency. Measured
during Track E — CI runs with no ffmpeg on PATH and `smoke.js` still reports all
scenes pass. `selfcheck.js` pins the encoder call-site count as a boundary that
may shrink but never grow (currently 5 sites across 5 functions).

## Backends

Default headless path is the **WebGL2 fallback** — CI-safe, no GPU. Hardware
WebGPU is opt-in per platform (`WEBGPU=metal` on macOS), and measurably faster
for recording.

Two things here are counterintuitive and both are load-bearing:

- **Byte comparison is valid only within one backend.** WebGPU-Metal and WebGL2
  do not produce byte-identical frames. That is expected. Determinism is checked
  by seeking away and back on the *same* backend.
- **`--enable-unsafe-webgpu` on macOS headless yields a SwiftShader adapter that
  renders pure black, silently, exit 0.** `shoot.js` refuses
  `WEBGPU=swiftshader` for this reason. `smoke.js` deliberately does *not* refuse
  it, because its shipped-frame check exists to demonstrate that configuration
  failing — so the gate must be able to enter it. Naming the wrong tool here
  inverts the intent.

CI pins no backend on purpose. The gate runs the fallback path because that is
the path that was once broken for the entire shipped corpus without anyone
noticing.

## Pinned tooling

`bun`; `three@0.185.1` and `playwright-core@1.61.1`, both exact; ffmpeg on PATH
for export; `avifenc` for AVIF, `img2webp` for WebP. The recorder resolves
`three` from the workspace where a scene is being built, not from the plugin.
