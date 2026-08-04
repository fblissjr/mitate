last updated: 2026-08-04

# physics bake proposal (mitate Phase 4, owner-prioritized)

The owner's direction, given 2026-07-23 during the bear-and-bees session:
relax mitate's determinism *at authoring time* — "simulated
creativity without an LLM" — while keeping runtime playback pure. Of the
three tiers discussed (bake-time sim / seeded runtime sim / true
nondeterminism), **the owner chose tier 1: bake-time simulation**, which is
the founding plan's Phase 4 shape. Phase 4 therefore moves ahead of Phase 3
(the human face rig) in priority, starting after `bear-and-bees` ships.

This document exists so the next session inherits the constraints and the
eval criteria, not just the enthusiasm. The specific failure it guards
against, named by the owner: tier 1 quietly becoming tier 2 becoming tier 3
across sessions, each step looking like a small relaxation of the last.

## The invariant that does not move

**The shipped scene file remains a pure function of `t` at runtime.** No
simulator executes at playback. The bake step runs a physics engine ONCE at
build time, samples the result, and writes the samples into the scene as
data. Playback interpolates that data with closed forms — a baked track is
just another pure signal, like `ramp()` or the frozen `R[]` pool.

Everything the current verification stack relies on survives unchanged:
`seekTo` stays random-access (no replay), HTML/MP4 parity holds, smoke's
determinism check, the strip/sheet instruments, and byte-identical
pre/post comparisons all keep working with zero modification.

## Red lines (tier drift, requires explicit owner sign-off)

Any change that does one of the following is NOT tier 1, whatever it is
called in the moment:

1. Playback steps a simulator (even a "small" one, even fixed-timestep).
2. Any state carried across frames at runtime.
3. `smoke.js`'s determinism or seek-purity checks are weakened, special-
   cased, or given a per-scene opt-out "to accommodate the sim".
4. Wall-clock time or unseeded randomness anywhere in the pipeline.

Tier 2 (seeded runtime simulation, seek-as-replay) is a legitimate future
direction but it is a SEPARATE proposal with its own instrument redesign —
smoke's seek-twice-compare and the strip re-shoots both assume random
access. It is not an incremental relaxation of this one, and the owner has
not asked for it.

## Shape of the bake step

- `bake <scene>` as a build.js command (or sibling script): reads a
  declarative sim block from the scene (bodies, colliders, impulses),
  runs Rapier (exact version pinned) at a fixed timestep with
  `CONFIG.seed`, and splices the sampled trajectories into the scene file
  as a data block — the same one-file discipline as the vendored three
  bundle. The scene stays self-contained.
- Sim inputs are scene data next to BEATS, and impulses anchor to beats
  (`{beat:'hit', at:.3, impulse:[...]}`), so retiming a beat re-bakes
  cleanly instead of silently desynchronizing.
- Playback: per-object keyframe tracks, interpolated in closed form.
  Baked objects and closed-form objects mix freely in one scene; baked
  tracks drive transforms through the same restate-every-frame rule.
- v1 scope: rigid bodies and props. Characters stay closed-form (IK/gait
  on top of, or independent of, baked roots). No baked joints, no cloth,
  no fluids in v1.

## The kinematic-body option (amendment, 2026-08-04)

Recorded as an option the Phase 4 build must weigh, deliberately without a
schedule — it does not have to be built now, and nothing here fires on a date.

**The gap it closes.** As written above, the declared impulse
(`{beat:'hit', at:.3, impulse:[...]}`) is a literal restatement of the
hand-matched constant it was meant to replace: the author still names the
force by hand. The bake computes the hive's *consequence* correctly and
still cannot tell anyone the bear's nose was there — the contact class this
project keeps re-measuring (`pattern-ledger.md`, "contact measured, not
inferred") stays un-computed at the one layer that could finally compute it.

**The option.** Drive the closed-form character into the sim as a
**kinematic body**: position-driven at each sim step from the same closed
forms that play back, colliding but not integrated. Rapier then computes the
contact, and the impulse falls out of the collision instead of being
declared. "Did they touch" becomes a computed fact rather than an authored
claim.

**Still tier 1, checkably.** The sim still runs once at build time and the
character's driving signal is itself pure in `t`; playback interpolates
baked tracks exactly as above. No runtime simulator (red line 1), no
cross-frame state at playback (2), no gate weakening (3), no wall-clock or
unseeded randomness (4). All four red lines hold unchanged.

**Scope note, recorded so v1 is interpreted rather than tripped over.** A
hive on a rope **is a joint**, and v1 above says no baked joints — so the
example corpus's flagship contact beat (`bear-and-bees`' hive) sits exactly
at the v1 scope line. Before that beat can be baked, v1 needs an
interpretation: either the joint enters scope, or the rope stays
closed-form and only the contact is computed.

## Eval criteria (measured, per method.md — no vibes)

1. **Re-bake determinism:** same seed + same inputs → byte-identical bake
   block, verified by a `bake --verify` that re-runs and diffs. This is
   the plan's own Phase 4 gate. Cross-MACHINE bake identity is an open
   question (Rapier is WASM; determinism claims need measuring, not
   trusting) — if it fails, the bake block is committed data and playback
   is unaffected; only re-bake reproducibility varies, and that gets
   documented honestly.
2. **Runtime gates unchanged:** smoke green on both backends with the
   UNTOUCHED checks; seek purity holds (`seekTo(8)` cold ==
   after `seekTo(2)`).
3. **Size bracket:** measure bake-block size on the gate film at 2-3
   sample rates before choosing one; the block should stay well under the
   1.09MB vendor bundle or the one-file discipline starts to hurt.
4. **The control (method.md's core rule):** author one beat both ways —
   closed-form fake vs baked — and confirm the baked version either reads
   better or authors dramatically cheaper. If it does neither, the
   machinery is decorative and Phase 4 stops.
5. **The film gate:** `rube-goldberg` ships and passes all three review
   axes. Note: sim gives physically consistent contacts for free, but NOT
   legible ones — the "geometric contact is not legible contact" rule
   still applies to staging.

## Spike list (answer by measuring, before building the pipeline)

- Rapier version pin + WASM determinism: re-bake identity on this machine,
  then across a second environment if available.
- Sample rate bracket (size vs smoothness at 12/30/60Hz sampling).
- Embedding format (JSON floats vs base64 Float32Array) — measure both on
  a real bake.

## Sibling: the light bake (owner-agreed 2026-07-23)

The same tier-1 shape applied to illumination. The owner's underlying want
("reflect light off objects/characters... same rough scene when you run it
twice") decomposes into two halves with very different costs, and the
decomposition is recorded here so it is not re-litigated:

**Reflections need NO bake.** SSR (the TSL addon node), planar
`ReflectorNode`, GTAO, and environment lighting are pure functions of scene
state — deterministic, seek-pure, available at runtime today at zero
determinism cost. Any session that reaches for a relaxation to get
"reflections" has misdiagnosed the problem.

**Iterative illumination is what bakes.** Real bounce lighting — path-traced
GI, radiosity, probe solves — runs once at build time (seeded, version-
pinned), ships as lightmap/probe data in the scene file, and plays back
pure. Same invariant, same four red lines as the physics bake. This is the
lightmap pattern shipped games have used for decades, not an invention.

What stays OUT (tier-2 territory, separate proposal, not asked for):
temporal/stateful runtime techniques — TRAA, temporal denoising, any
accumulation across frames. Their cost is red line #2 (state across frames
kills seek purity), and no bake shape rescues them.

Variety without relaxation: bake N seeds, review the contact sheets, ship
the one that reads best — the instruments become a curation tool at
authoring time while keeping their teeth as shipping gates. This is the
"simulated creativity without an LLM" want, satisfied inside tier 1.

Eval criteria mirror the physics bake's five, with one substitution: the
size bracket matters MORE here (lightmaps/probe grids are bulkier than
trajectory tracks — measure against the 1.09MB vendor-bundle yardstick
before committing to a resolution), and the gate film is assigned when
Phase 4 is scoped (`boss-intro`'s dramatic lighting and `the-briefing`'s
closeup are the candidates that would actually lean on GI).

## Tracking

- Decision + session-start reminder: memory
  (`project_relax_determinism_exploration.md`; the MEMORY.md flag demotes
  once raised).
- Phase priority note: `plan.md` Phase 4.
- This document is the constraint reference; the plan stays the hub.
