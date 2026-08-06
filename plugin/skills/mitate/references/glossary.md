# Glossary

The words this skill uses as if you already knew them.

> **Not here.** How to do any of it → `method.md`; what a check can and cannot
> see → `instruments.md`; shot grammar → `film-language.md`.

**register** — the kind of film being made: explainer, game cutscene, meme,
character short, diagram. It changes geometry, pacing and caption voice, and
never changes the contract, the pipeline or the review method. The most-used
undefined word in the project.

**`t`** — a POSITION, not a clock. An address you evaluate, not a cursor you
advance: any `t`, in any order, as many times as you like, always the same
pixels. Nothing asks what time it is. That is what lets the recorder shoot out of
order and a check seek away and back.

**beat** — a named span of `t` with a duration, declared in `BEATS`. Everything
is addressed by beat name and fraction (`ramp(t,'amble',.1,.9)`), never by raw
seconds — retime the beat and every expression anchored to it follows; hardcode a
second and it silently desynchronises. `method.md` owns the craft.

**shot** — an entry in `SHOTS`: which subject, framed at which size, from which
angle, starting at which beat. The camera is solved from these, never keyframed.

**bible** — a style object that defines the whole look, switched by one line.
Constrains *how* things look, never *what* is in the scene. See `bibles.md`.

**the window contract** — the handful of `window.*` exports every tool talks to,
and the rule that tooling never reaches past them into scene internals.
**Tiered, which is the part usually missed:** `smoke.js` hard-asserts four names
(`seekTo`, `DURATION`, `stopPlayback`, `sceneReady`) and reads the rest behind
fallbacks, so a scene missing `BEATS` is degraded, not broken. `smoke.js`'s
`CONTRACT` / `SOFT_CONTRACT` are the authority; four different membership lists
can disagree, and the shortest list is the one most likely to omit a name the
gate enforces.

**fence** — a block of code marked `/* ==== NAME-START ==== */ … NAME-END`,
written byte-identically into every scene that carries it. Self-containment
forbids a shared import, so the copies are real and a check reports divergence.
The list is `smoke.js`'s `FENCES`, and it is the enforcing copy — a fence absent
from it is not checked, whatever a doc says. Read the array; do not trust a
restatement of it, including this one: a prose list of fence names goes stale
silently, and several files have carried the same undercount at once.

**the parity set** — the files whose copy of a given fence is actually compared
against the canonical store (`templates/fences/`) on one run. One file is a
real comparison, because the store is always the other side. A file whose fence
is malformed *leaves the set*, which is how the check twice went quiet while
printing `ok`; `smoke.js` now fails loudly instead, and `bracket-parity.js`
proves it.

**bracket** — a control that proves a check can fail. It builds its own broken
fixtures, states the verdict each arm MUST produce, and exits non-zero when an
arm misbehaves. A check without one is a claim, not a control.

**probe** — `build.js probe`, which measures the scene's own geometry at one `t`
instead of inferring it. Reach for it whenever two things must touch.

**nocap** — a render with the caption pill and DOM title hidden (`?nocap` or
`?strip=text`), used for the semantics pass: if the film only reads with its
captions on, the film is not carrying the meaning.

**the three axes** — composition (fails within a frame), continuity (fails
between frames), semantics (every frame fine, film explains nothing). Different
instruments catch each. `method.md` owns them.

**the install cache** — the per-version copy of `plugin/` that
`/plugin install` writes, and what an installed user actually holds. **It
contains only what lives under `plugin/`** — this subtree, `plugin/README.md`,
`agents/`, the manifest. No `docs/`, no `CLAUDE.md`, no `scripts/`. The repo
keeps its verification records for these references outside this subtree, and
they record checks against the working tree rather than against a cache — the
two routinely differ by several versions, which is the thing being
distinguished.

**earn-in** — the bar a proposed instrument must clear before it is built:
a film was blocked without it, **or** a third recorded instance of the same
wrong answer. The second clause exists because the first cannot fire for a
failure mode whose signature is *not blocked, reliably wrong*.

**the chart tier** — a test scene that isolates one primitive per cell instead of
integrating many. Films integrate; charts isolate. A new noise function or hash
lands in a chart first, byte-compared per backend, before any film uses it.

**Phase N** — this project ships in numbered phases, each ending at a gate a
reviewer can check. Phases 0-2 are done; 4 (the physics bake) is next by owner
priority. The numbering and the gates live in the repo's `docs/plan.md`, which is
not in an install cache — so a Phase number in a reference is a pointer you can
only follow from a clone.

**the prime directive** — the two rules nothing negotiates: the scene is a pure
function of `t`, and tooling talks only to the window contract. Everything else
derives from them, and anything that cannot be had under them gets reformulated
(bake at build time, play back pure) or not had.
