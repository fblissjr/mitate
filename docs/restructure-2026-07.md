last updated: 2026-07-30

# Restructure plan, 2026-07

A one-time migration plan. **This document is disposable**: when the last gate
below is green it gets deleted, and the CHANGELOG entries it produced are the
permanent record. Dated in the filename so it sorts with the postmortems and
cannot be mistaken for standing doctrine.

It covers `internal/`, `docs/`, `plugin/`, `.claude/`, `scripts/`,
`.github/workflows/` and the gates.

**`site/` is out of scope for restructuring** (owner's call, 2026-07-30) and
**in scope for truth**. The distinction matters because of what the site is for
(owner, 2026-07-30): *"here's mitate and here's what it does and how it works
and here's the longer term vision and here's some examples."* That makes it two
things this plan cares about — a **capability-claim surface** and a **vision
carrier** — and nothing currently audits either. It stays in this repo; the
split question is settled below.

## The finding that organizes all of it

Every problem found in this pass is the same problem: **a fact stored in more
than one place, where nothing checks the copies agree.**

- A verification criterion in four places, and the copies now disagree
  (`sample.yml:11-12` versus `:35-38`).
- A capture primitive in five consumers, two of which never got the fix.
- `backend.js` in three copies. (A companion claim here — that core symbols were
  63-75% grep noise — was **retracted**; see R2.5. It was measured with the wrong
  tool.)
- A contact constant whose only provenance is a tool that does not exist.
- Postmortems cited from shipped content and reachable from one machine.
- Two subjects and two evidence grades under one provenance header.

The repo already has the correct rule — [`source-of-truth.md`](source-of-truth.md),
*every fact has one home and everything else points at it* — and unusually good
instruments for enforcing it **in prose and in scene code**. It was never
extended to CI config, session logs, dev scripts, or local working copies. That
is exactly where it failed.

So the ordering principle for everything below is:

> **truth → reachability → structure → capability.**
> Fix what is false. Make the falsehood unrepeatable. Make what exists
> reachable. Then move things. Then build.

Restructuring first would move lies into tidier folders.

## Where each kind of thing lives (decided)

| kind | home | rationale |
|---|---|---|
| why the project exists, and why determinism is first | **`VISION.md`** (repo root, new) | the frame above everything; public; first read after `CLAUDE.md` |
| invariants that bite on first edit | `CLAUDE.md` | unchanged |
| what it does, install, layout | `README.md` | unchanged, user-facing |
| **which doc answers which question** | **`docs/README.md`** (new) | the router; a pointer table, never a summary |
| architecture and phase gates | `docs/plan.md` | loses goal-framing to `VISION.md`, keeps everything else |
| ranked tactical work | `docs/working-plan.md` | unchanged role, needs a pruning pass |
| this migration | `docs/restructure-2026-07.md` | disposable, dated, self-retiring |
| dated reasoning about finished work | **`docs/postmortems/`** (new) + root `.postmortem.json` | tracked; the distilled record, unlike logs |
| what `t` is and how positions are addressed | **`docs/addressing.md`** (new) | adjacent to `VISION.md` but distinct: VISION owns *why determinism is first*, this owns *what the coordinate is* |
| the public explanation: what it does, how it works, the vision, examples | `site/` | stays in this repo. It **restates** the vision rather than owning it, so it points at `VISION.md`; and it makes capability claims, so it enters the drift audit |
| where facts live | `docs/source-of-truth.md` | gains two rows |
| the count that fires promotion triggers | `docs/pattern-ledger.md` | unchanged |
| Phase 4 constraints | `docs/physics-bake-proposal.md` | gains the kinematic-body option |
| inherited history | `docs/predecessor-record.md` | unchanged |
| session narration | `internal/log/` | local; the log is narration, the postmortem is the finding |
| third-party correspondence | `internal/outside_comms/` | never citable from tracked content; already private by gitignore |
| frozen predecessors | `internal/legacy/` | already invisible to ripgrep via gitignore — the proposed reshuffle was retracted, see R2.5 |
| repo-development agents | `.claude/agents/` | `control-builder`, `doc-claim-auditor` audit *this repo* |
| **film-review capability** | **`plugin/agents/`** (new) | `film-reviewer` reviews *films* — a user capability, not a dev tool |

The `.claude/` split follows the same audience rule that already separates
`scripts/` (dev-only) from `plugin/skills/mitate/templates/` (shipped).

---

## R0 — Truth

Nothing structural. Everything here is currently false.

1. **`sample.yml:11-12`** states `no_canvas: true` must return 0/200. Its own
   input description (`:35-38`) says that arm **must still fail**, and its own
   measurement (`:7`) recorded 40%/30%/20%. `sample-determinism.js:69-75`
   already diagnosed this and **names the workflow header as a carrier**;
   `b233419` fixed the script and the input description and left the header.
   → Delete the criterion from the header; point at `sample-determinism.js:65-75`
   as its one home. Same for `internal/.../log_2026-07-29.md:61`.

2. **`bracket-determinism.js` bare-seeks. `diagnose-determinism.js` does not.**
   **DONE 2026-07-30.**

   The original finding claimed both were defective, and it was **wrong about
   the second**. It came from grepping import lists: `diagnose-determinism.js:27`
   takes `settle` and not `seekSynced`, which read as a bare seek. Its `gridAt`
   calls `window.seekTo` and performs the readback inside one `page.evaluate` —
   seekSynced's mechanism exactly — and it *cannot* call seekSynced, because
   there the completion barrier and the diagnostic payload are the same readback.
   Corrected by adding a comment recording the relationship, so nobody
   consolidates it later and loses the grid.

   **The lesson is this plan's own thesis turned inward.** An import list is not
   a capture pattern, and inferring behaviour from a grep instead of reading the
   body is how most of R0's other entries came to exist in the first place.

   `bracket-determinism.js` was genuinely bare-seeking on both sides, so it
   passed while testing a configuration nothing ships. Now `seekSynced` +
   `settle`, mirroring smoke.js's arm. Run **before** the change (three rows as
   specified, both failing arms reachable) and **after** (same three verdicts),
   macOS/WebGL2. Stated honestly: that pair proves the control still works, not
   that the change fixed anything here — the race does not reproduce on macOS
   (0 in 80). The evidence it matters is 0.16.28's Linux pair, and `sample.yml`
   is how it gets re-verified there.

3. **`bear-and-bees.html:1375**: `const STOP_X=-1.2; // solved from the probed
   nose reach (see probe.js)`. **`probe.js` does not exist** anywhere in the
   tree, and `build.js` has no `probe` subcommand.

   **Four carriers, one of them public:** `bear-and-bees.html:1375`,
   `SKILL.md:269`, `examples/README.md:57-59`, and — found 2026-07-30 —
   `site/index.html:205` (*"Every contact is probe-measured."*) and `:209`
   (a primitive chip reading **`Box3 contact probes`**).

   **Provenance question, closed 2026-07-30.** The hypothesis was that `probe.js`
   arrived with the migration from `explainer-video` → `screenwright` → mitate.
   It did not. Grepped both frozen predecessor trees and the 0.16.0-era circus
   toolchain under `internal/`: **no `probe.js` file and no `probe` subcommand in
   any generation.** Every "probe" hit there is `ffprobe`, `probeArgs` (encoder
   version checks), or a comment describing a step-halving probe as a *technique*.
   So the tool has never existed, in any ancestor. No memory lookup needed.

   State it precisely, because the honest version is not "the claim is false":
   the contacts were most likely measured by the hand-written `page.evaluate`
   probe `method.md:727-736` instructs, and `working-plan.md:64` records exactly
   that — *"a technique documented with no tool. Re-derived, then skipped."*
   So the measurement probably happened; the **harness was not kept**, so the
   claim cannot be re-derived by anyone. Same shape as rule 5's `sortObjects`
   repro, cited as preserved and absent from the tree — the failure
   `install-hooks.sh`'s own header names.
   → Instance 7 of the contact class, second of the claims-a-check-exists class.
   **Resolved by shipping `probe` (R2.2), not by editing prose** — then re-derive
   `STOP_X` and let all four carriers become true and checkable. Until then,
   restate the code comment honestly.

4. **`build.js:24`** cites `docs/internals/plugin-patterns.md`, which exists in
   neither this repo nor the install cache. Only such citation in harness code.
   → Drop the cross-repo pointer; keep the rule.

5. **`working-plan.md` calls `film-reviewer` a gate criterion at `plan.md:460`
   in three places** (`:246`, `:455`, `:704`). It is not — `film-reviewer`
   appears in `plan.md` at `:471` and `:509`, both inside DONE narrative, never
   in a `*Gate:*` clause; the examples gate is *owner approval, not rendering*.
   → Restate A0's justification on what is true: best measured catch record,
   unreachable from an install. That argument is strong enough without the
   overclaim.

6. **Stale and dangling citations.** `working-plan.md:246/455/704` → `plan.md:471`;
   `:1732` → `plan.md:280-283`. `plan.md:331/436/503` cite CHANGELOG 0.69.0 /
   0.74.0 / 0.78.0 — predecessor numbering; this CHANGELOG runs 0.1.0–0.16.29.
   → Repoint or drop. Pin to content, not line numbers, per the lesson
   `working-plan.md:955` already records.

7. **`plan.md:109-110`** still says the kernel/driver split *"costs only
   discipline"*, contradicted at `working-plan.md:1321-1323`, and the Phase 6
   gate text (`plan.md:587-588`) was never amended despite being known
   unreachable.
   → Amend both; point at the state-object fix.

8. **Crushed-exposure exists in three simultaneous states** (`plan.md:404-410`
   and `:424-425` open; `working-plan.md:1533-1539` measured;
   `working-plan.md:191-195` "left undone").
   → One home, one state.

9. **The window contract has four different memberships.** `CLAUDE.md:19` lists
   six names, `README.md:70-84` lists nine, `SKILL.md:85-94` lists eleven, and
   `smoke.js:66` hard-asserts four. **`CLAUDE.md`'s is the only list that omits
   `stopPlayback`, which is one of the four the gate actually enforces.** Four
   copies of the repo's most central concept, disagreeing, in direct violation
   of `source-of-truth.md:5-7`.
   → One home. `smoke.js:66` is the enforcer, so the tiering belongs where
   `README.md` already explains it; `CLAUDE.md:19` points rather than restates.

10. **`CLAUDE.md:43` cites "invariant 6: say which copy". That is invariant 7.**
    `9f99ce4` (0.16.18) inserted "Red before green" as the new invariant 6 and
    pushed the old one to 7 without updating the cross-reference. Same error at
    `working-plan.md:465`, while `working-plan.md:114` uses "invariant 6"
    correctly for the bracket rule — so one string names two different rules 350
    lines apart in one file.
    → Repoint both to 7. Cite invariants by name, not number, or this recurs on
    the next insertion.

11. **`README.md:116` links to `plugin/README.md#requirements`. That heading was
    deleted in `8c411f4` (0.16.13) and the anchor has dangled for 16 releases
    with a green board** — `selfcheck.js` check 3 covers neither repo-root files
    nor URL fragments.
    → Repoint to `#installation`. Extending check 3 to fragments is R1 work.

12. **The `noise1` independence claim is false, and the comment alone is not the
    fix.** `gcd(997, 4000) = 1` and `4 × 997 ≡ −12 (mod 4000)`, so
    `noise1(t,f,k)` and `noise1(t,f,k+4)` are the same track lagged 12 index
    samples — 6.3 seconds at the handheld 1.9 Hz, inside a normal film. The
    KERNEL comment says *"different k = independent track."*

    **Decision: correct the comment AND add a selfcheck arm. Not either/or.**
    Changing the stride constant would make the documented property true, and it
    would also change every value `noise1` returns — so every scene using
    handheld energy renders differently, every byte comparison against a shipped
    film breaks, every poster still needs re-rendering, and the site hero
    changes. That is a large irreversible cost against a trap **no shipped scene
    currently hits** (3D uses tracks 11-14, 2D uses 1-2; no pair differs by 4).
    Rejected.

    But documenting a limitation and trusting the next author to read it is the
    exact failure this plan exists to end, so the comment cannot stand alone. The
    arm scans scenes for literal `k` arguments and fails when two in one scene
    differ by a multiple of 4. It cannot see a computed `k`; the comment covers
    that residue, and the comment says so. Belt and braces, and it is cheap.
    KERNEL is 9 carriers, so the comment edit is a cross-directory parity run.

13. **`CLAUDE.md:63`'s "Verified: the cache contains … and nothing else" is
    literally false** — the live cache also carries `.in_use` bookkeeping
    dotfiles. The claim's substance holds; the word "Verified" is doing work the
    check does not support.
    → Say "and no other content."

**Gate R0 — MET 2026-07-30, shipped as 0.16.30.** `selfcheck` green (13 dated
docs, cascade coherent at 0.16.30); cross-directory fence parity green over all
nine KERNEL carriers; `smoke.js` exit 0 on all six scenes, advisories only;
`bracket-determinism.js` run before and after the capture change with all three
rows as specified both times. One item deliberately **not** done and recorded as
an exception: R0.3's `probe.js` comment in `bear-and-bees.html`, deferred to R2
so the film is touched once, by the change that makes its claim true.

Original gate text: `bun run scripts/selfcheck.js` green; `bracket-determinism.js`
demonstrated red then green on the `seekSynced` change; no tracked file cites a
path or version that does not resolve.

---

## R1 — Make the falsehood unrepeatable

Each item here is a check, not a cleanup.

1. **`source-of-truth.md` gains two rows**: CI config, and session logs. Its
   table currently covers references, code comments, SKILL.md and CLAUDE.md —
   not the surfaces where the criterion actually drifted. Two rows, not a new
   section.

2. **New `selfcheck.js` arm — no bare seek before a capture.**

   **The obvious spec is wrong, and R0.2 proved it.** "No file may compare
   `page.screenshot()` output while requiring `backend.js` without using
   `seekSynced`" would flag `diagnose-determinism.js`, which is correct — it
   hand-rolls the same barrier because it needs the readback's payload. A check
   whose first action is to condemn a correct file is worse than no check.

   Spec it on the **pattern**, not the import: flag any `page.evaluate` whose
   body calls `window.seekTo` and does **not** also read pixels back
   (`getImageData`) in that same evaluate. That is precisely the bare seek
   0.16.28 measured as racy. It catches `bracket-determinism.js`'s old shape, it
   passes `diagnose-determinism.js`, it passes every `seekSynced` caller because
   the primitive contains the readback by construction, and it is statically
   decidable. Build it against the pre-fix `bracket-determinism.js` as the red
   arm — that fixture exists in this branch's history.

3. **New `selfcheck.js` arm — `artifacts:` resolve.** Every postmortem
   frontmatter entry that looks like a repo path must exist. Turns a filing
   convention into a control, and it is the shape that would have caught the
   `probe.js` citation had it been in frontmatter.

4. **Bracket the fence-parity check.** It has two documented near-inert
   episodes (`smoke.js:923-934`, `:946`) and no control — the one check whose
   silent failure invalidates the repo's whole DRY story. Cheapest bracket
   available: pure string work over temp files, no browser, mirroring
   `--parity-only`.

5. **The code-versus-prose boundary gets a rule, and the ratchet gets extended.**
   Owner directive, 2026-07-30: *"comments and rules and notes inside code vs.
   what's inside md… No drift should be possible and we should make sure future
   claude sessions avoid this."*

   `source-of-truth.md:11-21` already assigns homes by *kind of fact*. What it
   never states is the boundary that every failure in this pass crossed:

   > **A code comment may assert what its own line does. It may not assert what
   > another file does.** A claim about another file's behaviour belongs in the
   > reference that owns the subject; the comment points at it and does not
   > restate it. Anything else is a claim that cannot be checked from where it
   > lives.

   Every instance found this session is that one violation:
   - `solveShot`'s comment asserts *"the extent check in smoke.js is what catches
     it"* — a claim about another file. There is no extent check.
   - `bear-and-bees.html:1375` cites `probe.js` — a claim about a file that has
     never existed in any generation.
   - `build.js:24` cites a doc in a different repo.
   - `sample.yml`'s header carried a verification criterion owned by
     `sample-determinism.js`, and the two drifted into contradiction.
   - The `noise1` comment asserts a *property* of the pool that is false.

   **Enforcement, not just a rule.** `selfcheck.js` already ratchets
   "measurement-assertions" — comments asserting a measurement without naming the
   control, budget 46, may fall and never rise. Extend the same ratchet to
   **comments asserting that a check exists, or that another file behaves a
   certain way**. That is `working-plan.md`'s items 6b and 6c, which were already
   queued, promoted from a one-time sweep to a standing budget so it cannot
   regrow. A one-time sweep fixes five instances; a ratchet stops the sixth.

6. **The claim audit gains `site/index.html`.** The `audit-claims` skill
   dispatches `doc-claim-auditor` at reference docs, `CLAUDE.md`, and the
   load-bearing comments in `templates/*.js`. The site is a **capability-claim
   surface** — `site/index.html:205` states *"Every contact is probe-measured"*
   and `:209` ships a primitive chip reading `Box3 contact probes` — and nothing
   audits it. A public page asserting a capability is exactly what that agent
   exists to check. One line in the skill's scope.

**Gate R1 — MET 2026-07-30, shipped as 0.16.31.** `bracket-parity.js` green on
all five arms, and demonstrated **red against the real regression** rather than a
synthetic one: with the half-fenced guard reverted in a scratch `smoke.js`, both
mangled-marker arms flip to `inert` and it exits 1. The seek arm demonstrated red
by dropping the pre-fix `bracket-determinism.js` into the tree and green when
removed. `selfcheck` green at 4 brackets; `gate.yml` globs `bracket-*.js`, so the
new control was in CI the moment it existed.

**Two items deliberately not done, with reasons rather than silence:**
- **The `artifacts:` resolver moves to R2.** `docs/postmortems/` does not exist
  yet, so the arm would scan zero files and print ok — a decorative check, which
  is what this phase exists to stop shipping.
- **`doc-claim-auditor` over `site/index.html` is scoped, not yet run.** Its one
  known finding is the probe claim, which R2 resolves by shipping the tool. Running
  it now would produce a report whose only item is already scheduled.

**One trigger fired and is recorded, not acted on:** `working-plan.md` defers
"extracting a shared bracket harness" until *the fourth bracket*. This is the
fourth. It named `bracket-sortobjects.js` specifically, so the letter has not
fired but the count has — and all four now duplicate temp-dir setup, fixture
mutation and an expected-verdict table. Worth revisiting when a fifth is written.

Original gate text: each new arm demonstrated red on a deliberately broken copy, then
green. `.github/workflows/gate.yml` runs the new bracket (its glob already
picks it up). `doc-claim-auditor` run once over `site/index.html`, findings
dispositioned.

---

## R2 — Reachability

Things that exist and cannot be reached do not exist
(`working-plan.md:61-62`, the parent rule).

1. **Ship `film-reviewer`** as `plugin/agents/film-reviewer.md`. It gates
   nothing formally (R0.5), but it has the best measured catch record in the
   project and no installed user can reach it. Plugins ship agents; this is a
   one-file move plus a `SKILL.md` routing line. **Version cascade.**

2. **Ship `build.js probe`** — ranked 1 in `working-plan.md:405`, unblocked,
   **no new dependency for an installed user**. It is the instrument for the
   defect class at count 6 in the ledger, which just produced instance 7 inside
   a shipped example. Ship the eval prelude (`bb(o)` → `Box3().setFromObject`,
   `proj(v)` → NDC) plus the worked list in `method.md`: contact separation,
   reach, clearance from the camera-subject line, foot-plant drift.
   **Version cascade.** Then close R0.3 with a measured number.

   **Three cases waiting for it, all found 2026-07-30:**
   - `bear-and-bees.html:1375` `STOP_X` — the phantom-provenance constant.
   - `bear-and-bees.html:1383` `bearHead:{pos:t=>[bearXAt(t)+3.3,2.3,0],…}` — a
     **fourth independent statement of where the bear's head is**, with a
     hardcoded `+3.3` and fixed `y`, omitting the boop lean (`:1552`) and the
     neck extension (`:1568`). The camera's model of the head already disagrees
     with the head, and it is the subject of two shots. `SOLVER`'s own comment
     says this class is unchecked.
   - `bear-and-bees.html:1379` — the erupt recoil (`-.38*pulse(t,'erupt',.12,1)`)
     runs while `vAmp` is 0, so `gaitPose` collapses fully to the body-relative
     rest stance and **all four paws translate rigidly with the recoil** across a
     1.1s beat in an FSA shot. Unrendered; `build.js strip` over that window
     settles whether it reads.

3. **Postmortems become tracked.** `docs/postmortems/`, root `.postmortem.json`
   = `{"dir": "docs/postmortems"}` so placement is a decision rather than the
   filing skill's rung-3 inference. Convert `2026-07-25_session_handoff-review.md`
   to frontmatter form — it currently starts with `last updated:`, which is
   exactly the pattern `selfcheck.js` check 7 derives its set from, so it would
   fail on first commit, and it has no frontmatter so `postmortem-index` cannot
   see it. Cite from plugin content by **absolute repo URL** (invariant 4's
   existing pattern). New rule: a tracked postmortem may cite a local-only
   artifact but must label it `(local)` and must not rest a claim on it.

4. **Routing, now with a measured baseline.** A cold session assuming no
   machine-local memory takes **3 hops and ~4,900 lines** to reach the working
   plan, and these never arrive at all:

   - **`README.md` (repo root) is an orphan** — nothing in `CLAUDE.md` or any
     `docs/` file points at it. The repo's front door is outside its own graph.
   - **`plugin/skills/mitate/SKILL.md` is an effective orphan.** It is named as
     prose at `CLAUDE.md:39` and `:111` and **never given as a path or a link**.
     The primary artifact this repo exists to ship is not routed to from the
     developer entry point.
   - **`docs/working-plan.md` — the current ranked work — appears zero times in
     `CLAUDE.md`.** Its only entry-point mention is `README.md:145`, inside the
     orphan.
   - **`.github/workflows/sample.yml` has zero inbound references anywhere**, and
     `scripts/sample-determinism.js` is reachable only through it. An orphan
     behind an orphan, edited in the most recent commit.
   - `pattern-ledger.md` and `examples-placement.md` are named in **neither**
     entry point.

   Three fixes, all cheap, all the pattern 0.16.19 already established:
   - **A `## Map` block in `CLAUDE.md`** listing all seven `docs/*`, the three
     `.claude/agents/*`, `.claude/skills/audit-claims/`, all five `scripts/*`,
     all three workflows, and the `SKILL.md` path. Unlinked, so it cannot dangle.
   - **A `**Map.**` block in `SKILL.md`** after line 37. `method.md`,
     `instruments.md` and `delivery.md` each got one in 0.16.19; **`SKILL.md`,
     the file `source-of-truth.md:16` names as the home of routing, did not.**
     Its only index is `## Files` at line 219 — 79% of the way down.
   - **`docs/README.md`**, a pointer table with a read-it-when column. Never a
     summary; a summary is the copy this plan is about. The root README's Layout
     table lists all seven and points here.

5. **`references/glossary.md`** — there is definitively no glossary; verified
   three ways. It goes in the subtree because that is reachable from **both**
   cold starts, and it loads on demand so it costs no standing context. The four
   worst by use-to-definition ratio:
   **`register`** (98 uses across 16 files, defined nowhere),
   **`install cache`** (11 uses *inside* a subtree that cannot see its
   definition — every reference's provenance header says a thing was "not
   verified against an install cache" to a reader standing in one),
   **`window contract`** (14 uses, four disagreeing membership lists — see R0.9),
   **`parity set`** (4 uses in `smoke.js`, defined nowhere in the repo).
   Also unreachable from the cache: **"Phase N"** as a numbering scheme, used by
   three references with no resolver.

6. **Two placement fixes inside `SKILL.md`**, both bibliography-only today
   despite their own entries naming a moment: **`materials.md`** says "read
   before authoring any surface beyond flat color" and is not cited at step 2's
   `buildWorlds()`; **`bibles.md`** says "read at art-direction time" and no step
   names art direction, so the cue never fires. `instruments.md` is cited twice
   (`:170`, `:259`) but neither is the moment it exists for — deciding whether a
   green result means anything, which is steps 3 and 4.

7. **Remove `metadata.last_verified` and bring `SKILL.md` under the provenance
   header rule instead.** Owner's call delegated 2026-07-30, on the criterion of
   long-term viability across many sessions. The decision and its reasoning:

   The field is stale right now (`"2026-07-25"`, against a file edited twice on
   2026-07-29 with all eight references rewritten), and **nothing catches that**
   — `selfcheck.js` check 7 derives its set from files carrying `last updated:`,
   which this is not. So it is an unenforced claim, in frontmatter, on a file
   that loads entirely into context on every activation.

   It is also a **worse duplicate of a mechanism that already works.** The eight
   references each carry a provenance header, and `selfcheck.js` check 4 enforces
   that every one names a date or honestly admits it is unaudited. That form is
   better on three counts: it is per-file rather than one date covering nine; it
   records **what was verified against what** rather than only when; and it is
   checked.

   The semantics were also drifting in practice. The field asserts *a human*
   reviewed the tree. In reality these stamps get written during Claude sessions,
   so the assertion and the act diverge — and "a human looked at it" is not
   auditable in the way "verified against `templates/*.js` on a date" is.

   → Delete the `metadata` block. `SKILL.md` gains a one-line provenance header
   in the body, in the same form as the references, and `selfcheck.js` check 4
   extends to cover it. Net: two frontmatter lines out, one checked line in, and
   the claim becomes falsifiable instead of asserted. **Version cascade** (it is
   plugin content), and `CLAUDE.md:39-45` loses the paragraph describing the
   field.

5. **`internal/` — RETRACTED 2026-07-30, and the retraction is the finding.**

   This item existed to fix "63-75% of grep hits for core symbols are
   non-authoritative". **That measurement was taken with shell `grep -r`, which
   ignores `.gitignore`.** The Grep tool uses ripgrep, which honours it, so
   `internal/` was never in its results. Re-measured: `solveShot` returns 18
   files under shell grep and **13 under ripgrep, none of them from `internal/`**
   — and the staged `site/films/` copies are excluded too, by `site/.gitignore`.
   The exclusion this item proposed building already exists and always did.

   That removes the retrieval justification, which was the strong half. The
   remaining argument — that `internal/` conflates private, archive and live work
   — is real but is a *meaning* problem with no measured cost, and the concrete
   instances are already resolved: postmortems are tracked (R2.3), `outside_comms`
   is private by gitignore, and `legacy/` is invisible to search. So this is
   **dropped**, not deferred, and the last-copy question about the predecessors is
   the only thing worth keeping from it.

   **The lesson generalizes past this item, which is why it is written here
   rather than deleted:** an instrument that disagrees with the one the reader
   actually uses will manufacture a problem. Measure with the tool whose behaviour
   you are reasoning about.

6. **Triage `internal/circus_prototype/bench/`.** Nine measurement harnesses —
   `bench_viewer_{desktop,mobile,loop}`, `bench_playback`, `bench_capture`,
   `bench_reviewloop`, `bench_scene`, `bench_liveplay_{corpus,bracket}` — all
   built on `backend.js`, all aimed at the viewer and playback questions the
   vision needs, all on one machine with nothing running them. This is the
   postmortem problem again, for code. **Promote on a trigger, not wholesale**:
   take the ones the R5 seam work actually calls, starting with viewer and
   playback. They are written as dense one-liners and need cleanup, so a
   promotion is a rewrite, not a move. Note the shape they share with
   `bracket-*.js` — if three of them promote, that is the fourth-bracket trigger
   `working-plan.md` already records for extracting a shared bracket harness.

**Gate R2:** `film-reviewer` and `probe` present in a real install cache;
`postmortem-index` renders both postmortems; a grep for `solveShot` returns only
authoritative hits.

---

## R3 — Structure

1. **`VISION.md`** at repo root. The ordering argument (determinism is the
   observation instrument, not a constraint accepted in exchange for one), the
   `t`-as-coordinate / state-as-driver-output formulation, films as the proving
   instrument rather than the product. **Supersedes `plan.md:821-823`**
   ("Scope creep toward a game engine… mitate ships films"); `plan.md` keeps
   architecture and gates. One page. It owns exactly one fact that has no home
   today — confirmed absent from all three planning docs by two independent
   passes.

   **The site is the other vision carrier**, by design: its stated job includes
   *"here's the longer term vision."* So `VISION.md` is the home and the site
   restates it for a public audience — which is legitimate (different register,
   different reader) but must be a **restatement of one source, not a second
   source**. When `VISION.md` lands, reconcile the site's vision copy against it
   in the same commit, and note in `source-of-truth.md` that the site is a
   pointing surface for this fact.

2. **`delivery.md` splits.** It is titled *"Delivering inline on GitHub"* and
   concludes at line 197 that the repo *"ships no recordings at all"* — 150
   lines of encoder forensics in front of the path actually taken, under one
   provenance header stamped "UNKNOWN — never audited" that also covers this
   repo's own measured brotli figures.
   → `delivery.md` keeps the scene as the deliverable (bundle, brotli
   economics, hosting and mount policy, posters, the surface table).
   → **`recordings.md`** takes the lossy-copy path (format tradeoff, AVIF
   decode, encoder settings, content-type forensics, LFS/APNG traps).
   Each gets its own honest provenance date. "Stills come from the scene" stays
   in `delivery.md` — it is a rule about the scene being the source.
   **Version cascade.**

3. **`working-plan.md` pruning pass.** It carries superseded paragraphs kept
   verbatim (correct practice) that now read as three live positions to a
   scanner, plus edit residue at `:436-443` where a resolved question is
   restated in its superseded conditional form. Strike, don't just annotate,
   where the newer verdict is settled.

**Gate R3:** `selfcheck.js` green including provenance headers and "Not here"
edges on both split references; no doc states a goal that another doc contradicts.

---

## R4 — Harness

1. **Extract `checkScene`.** ~595 lines (`smoke.js:269`-~862) holding ~11 checks
   over shared mutable `fails`/`warnings`/`noise`/`dropped`. Each check already
   has its own try/catch and its own name — it is a list wearing a function
   costume. Each becomes `(page, ctx) => ({fails, warnings})` driven from an
   array. **In place, not into files**: no new install-cache files, no new
   `require` edges, no new parity surface. The payoff is not tidiness — it is
   that a bracket can then drive one check directly instead of rebuilding the
   page setup, which is why `bracket-determinism.js` is 115 lines to test one
   thing.

2. **A harness tier below the chart tier** (`working-plan.md:1342-1355`). Run
   every `build.js` subcommand against one tiny scene; assert exit 0 and that
   the named artifact exists. `build.js` is 827 lines and 18 verbs with **zero**
   brackets; `shoot.js` is 327 lines with zero. Cheapest test in the repo and it
   closes the command-never-run shape permanently. State what it is not: it
   checks the path executes, not that output is correct.

3. **`gate.yml` runs the harness tier.** No new workflow — the existing gate job
   gains a step. `sample.yml` stays manual-only and correct as designed;
   `static.yml` needs no change.

**Gate R4:** every `build.js` verb exercised in CI; `smoke.js` behaviour
byte-unchanged across the extraction (same verdicts on the same corpus).

---

## R5 — Capability

1. **The Track D batch, including the state seam.** `setCamera(t)` →
   `setCamera(state)` where `state` today contains only `{t}`
   (`working-plan.md:1328-1340`). Bundled with `STYLE.palette`,
   `CONFIG.name`/`titleCard`, `hide(obj,u)` owning the `1e-4` clamp, and
   `subjectFromObject` — all touching the same 8-9 carriers, so one cascade
   instead of five. Makes Phase 6's "zero modification" gate reachable by
   construction, and it is the seam a bake, a viewer, and an input driver all
   share. It gets several times more expensive after Phases 3 and 4, because
   face state and baked tracks will be authored as functions of `t` — that is
   what the signature invites.

   **One discipline, or `state` becomes a global with better manners**: the
   driver owns what goes in, and the kernel never reads anything the timeline
   driver cannot produce.

   **One hazard to fix while in there.** `gaitPose` defaults `rootX` to
   `rig.root.position.x` — it reads mutable scene-graph state, and is correct
   only because `root.position.x` is assigned on the line before it in
   `animate` (`menagerie.html:1496`/`1510`/`1525`). That is an ordering
   dependence inside `animate`, not a pure-function argument. It holds today and
   it is exactly what a bake refactor would trip over, so pass `rootX`
   explicitly as part of the same pass.

2. **`references/breakdown.md`** — enumerate the declarative layer. It exists,
   works, and is *"unnamed, unspecified, and unvalidated as a whole."* It was
   the #1 recommendation in two internal documents, costed at one afternoon and
   no code, and is a ranked item in none. `working-plan.md:1300` already cites
   "after the enumeration exists" as a revival trigger for something else — a
   trigger on a thing nobody scheduled.

3. **`build.js check`** — cross-reference validator over the tables that already
   exist: shot anchors land inside their beat, subject and focus names resolve,
   union shots use only wide rungs, captions fit at documented CPS,
   declared-versus-measured extents, `BEATS` sums to `DURATION`. Buildable
   today; *"would have caught at least three of this film's defects before a
   single frame rendered."*

4. **Amend `physics-bake-proposal.md` with the kinematic-body option.** As
   written, the declared impulse (`{beat:'hit', at:.3, impulse:[...]}`) is a
   literal restatement of the hand-matched constant it was meant to replace —
   the bake computes the hive's *consequence* correctly and still cannot tell
   anyone the bear's nose was there. Driving the closed-form character in as a
   **kinematic body** so Rapier computes the contact is still tier 1, needs no
   runtime simulator, respects all four red lines, and is what makes "did they
   touch" a computed fact. Record it; it does not have to be built now.
   Also record: a hive on a rope **is a joint**, so the corpus's flagship
   contact beat sits at the v1 scope line and v1 needs interpreting before it
   can be baked.

**Gate R5:** cross-directory fence parity green after the batch; every untouched
beat byte-identical or above the 70 dB bar on the three canonical edits
(`working-plan.md:1415-1436`'s regression-by-edit case, itself still untested).

---

## Deliberately not doing

- **Renaming `templates/`.** It holds two kinds of thing, but it is already
  self-labeling (`*.template.html` versus tools; `bracket-` prefix). A rename
  costs the cascade, every doc pointer, CI paths and user habit to remove one
  inference made once.
- **Splitting `smoke.js`/`build.js` into files.** The repo's own argument
  against splitting `method.md` — a split creates a boundary to keep consistent
  — applies harder to code that ships. Measured: nothing in `templates/`
  truncates a default read.
- **Splitting `method.md`.** The truncation test the plan says was never run:
  996 lines / 52.7 KB, reads whole. The correctness argument does not apply.
- **`docs/decisions/`.** Two files is not a tier. Give them frontmatter.
- **Deleting `internal/archive/`** until the last-copy question is resolved.
- **Splitting `site/` into its own repo.** Asked and settled 2026-07-30: no.
  The weight argument fails (tracked `site/` is 1.73 MB against `plugin/`'s
  6.18 MB, and 1.14 MB of it is one file), and CI already ignores `site/**`.
  Five couplings would break, every one of them a copy-or-pointer problem across
  a new boundary, which is the class this plan exists to fix:
  `films/gearbox-neon.html` is a fence carrier in the parity set;
  `site/posters/` is embedded by `examples/README.md` via absolute raw URL into
  every install cache; `scripts/stage-films.sh` would need a submodule or a
  duplicate, and duplication breaks films-tracked-once; `static.yml` is the
  deploy job *and* the `selfcheck.js` gate; and `site/app.js` is the only
  evidence the window contract drives an external, non-monotonic consumer —
  which R4 wants closer to the tests, not further.
  **Trigger to revisit:** the site grows its own build step or dependency set,
  or needs a cadence that fights the version cascade, or stops consuming plugin
  artifacts. None is true today.
- **`site/app.js` hardcoding `DUR`/`BEAT_STARTS`** that `window.DURATION`/`BEATS`
  already publish, with `site/index.html:99-109` restating the same boundaries a
  third time as CSS percentages. Real, logged, not fixed this pass.
- **Untracking `films/gearbox-neon.html`** — but run the test, because it is
  cheap and either outcome pays. It is **66% of tracked site bytes** and the
  only negated exception in `site/.gitignore`. `bibles.md` claims the whole look
  is one object switched by one line; if that is true the neon variant is
  **derivable** from `gearbox.html` plus a bible swap, `stage-films.sh` can
  generate it, and 1.14 MB and one copy both disappear. If it is **not**
  derivable, that is a finding about the bible system that nothing currently
  surfaces, and it is worth more than the megabyte. One `build.js` run and a
  diff settles it.

## Retirement

Delete this file when R5's gate is green. The CHANGELOG entries are the record;
a completed migration plan left in `docs/` is one more thing a future session
has to read to discover it does not matter.
