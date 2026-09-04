last updated: 2026-09-04

# The harness loop: how the harness gets better, and how we know

**Start here if you are a future session asking what to do** (owner request,
2026-09-04). This file is the plan for getting the two flywheels in
[`../VISION.md`](../VISION.md) to actually turn, written after a session
read the whole tree and the owner confirmed the reading below. It is a plan,
not doctrine: `VISION.md` wins on intent, `CLAUDE.md` on rules, and the
lifecycle rules in [`source-of-truth.md`](source-of-truth.md) say who may edit
it (tactical edits need no owner input; changing the sequence's ranking does).
[`README.md`](README.md)'s work-next row points here; the board it replaced is
kept in that row as record.

<!--due: 2026-10-04 | if no cold build has run by this date, this plan is stale: re-read it against the tree and re-decide the sequence with the owner before doing anything else in it -->

## What mitate is, in plain terms

The reading the owner confirmed on 2026-09-04, kept short because
`VISION.md` is the argued version:

- A skill an agent loads inside Claude Code or Antigravity. Any input in, one
  self-contained HTML file out, playing an animated three.js scene. The scene
  is code, not pixels.
- The one rule: the scene is a pure function of `t`. That is what lets a scene
  be held still, compared byte for byte, reshot one shot at a time, and
  rendered at any length from the same file. Determinism is the instrument,
  not the goal.
- The point is an **engine** built as declarative layers: beats instead of
  timestamps, a shot description instead of camera coordinates, a style object
  instead of per-material values, a proportion vector instead of a hand-built
  rig. The next layer on the public roadmap is interaction, baked at build
  time and played back pure.
- **The harness is the product.** It is everything that lets an agent drive
  that engine and prove the result: the shipped kit (templates, the fenced
  kernel, `build.js`, `shoot.js`, `smoke.js`, the references, `SKILL.md`), the
  instruments (contact sheets, squint strips, probes, the determinism and
  framing checks, the film-reviewer), and the repo-side controls that keep the
  kit honest. Films are how it gets proven and improved.
- Two loops. A build carries technique out of a film into the kit. Separately,
  a session holding only the installed plugin builds a film cold, and the
  transcript of what it read, skipped and stumbled on is the measurement of
  whether the harness works. Improve the harness, rebuild, compare.

## Where the board stood when this was written

Verified on 2026-09-04 against the tree; each line names how to re-derive it,
because this section will go stale and a re-derivation is the only honest
refresh.

- `bun run scripts/selfcheck.js` was green.
- The corpus in `scenes/` (count it with `ls scenes/*.html`) had not gained a
  film since `git log -1 --format=%ad -- scenes/` reported 2026-08-07.
- The cold-start criterion had one clean sample: `scene-analyses/` holds the
  2026-08-04 market-crash record and the 2026-08-07 batch, and that record
  says the batch is not comparable to the baseline.
- The board's top item, the cold build one tier down, had been "blocked on a
  plugin-only session" since 2026-08-07 (the prior entry in `README.md`'s
  work-next row). Nothing in the repo could unblock it, so sessions took
  harness work instead.
- Every release from 0.23.0 through 0.28.4 was instrument, doctrine or
  packaging work (`CHANGELOG.md`). The caught-defect split in
  [`representation.md`](representation.md) is roughly four product to
  twenty-five meta. The allocation note at the end of the 2026-08-08 log
  named this risk; this file is the response to it.
- Phase 4, marked `next` on the public site since it went up, had not
  started; its spike list dates from 2026-07-23 (`plan.md`).
- Two of `VISION.md`'s success criteria were still marked false: determinism
  magnitude (size and position of a difference) and pre-render validation of
  an extent's posed VALUE.
- **Dead vocabulary in the kernel**, derived in one pass and never derived
  before: subtracting each name's definition inside the fenced kit from its
  count in each film, `rampE` and `during` are called by no film in the
  corpus, `warp` only from inside the kit, `latch` and `quant` by one film
  each, while `bear-and-bees` defines its own `rampS` beside them. Re-derive
  with `grep -o '\brampE(' scenes/*.html | wc -l` against the same grep over
  `plugin/skills/mitate/templates/fences/KERNEL.fence.txt`. That is the
  `STYLE.dof` shape of 0.23.0 again, and nothing in the tree looks for it.

## The one rule this plan runs on

> **A harness change counts as landed only when a cold build run after it
> shows the change in the transcript.**

A green bracket proves the mechanism works. Only a cold build proves a
stranger met it. Every step below therefore ends with a run of
`scripts/cold-build.sh`, and the sequence is ordered so that each step
produces what the next one is measured against.

The comparison rule is the owner's from 2026-08-07 (recorded in `README.md`'s
prior entry and in `scene-analyses/2026-08-07_turtle-pair-and-v2v.md`): hold
the **brief** fixed and let the **model tier** fall. Do not pin model and
effort. If the harness is getting better, the tier needed to ship clean
should descend, and that descent is the headline measure.

## The sequence

| step | what changes | how we know it worked |
|---|---|---|
| **1. The cold build becomes a repo tool** — DONE 2026-09-04, unrun | `scripts/cold-build.sh`: empty workspace outside the repo, the working-tree plugin loaded via `--plugin-dir`, no settings, no MCP, a fixed brief from `scripts/cold-briefs/`, the stream-JSON transcript saved for `/analyze-build-session`, a manifest, and a verdict derived from the transcript (activated, reads, contamination). Bracketed by `scripts/bracket-cold-build.js` on a stub CLI | The first real run on today's tree is the baseline record. Contamination is mechanical: a read outside `plugin/` marks the run. Red-first arms: no cold root, root inside the repo, a brief that names the skill, no plugin, a session that never activates the skill, a read outside the plugin, a hang past the cap |
| **2. The corpus census** | One script that derives, never hand-writes, three tables over any set of scenes: consumers per kit export (counted outside the fences), unfenced helpers per film normalised and clustered across films (the invented-twice detector), and vocabulary with no user (kernel exports, `STYLE` keys, glossary terms no scene reaches). The `pattern-ledger.md` count column becomes its output; REP5 lands as a by-product | Red first: it must flag `rampE` and `during` on today's tree before anything is removed. A bracket plants one duplicate helper in two fixtures and must cluster them. Then a cold build after each removal shows whether the smaller vocabulary changed anything a builder did |
| **3. The cheap cold-build findings** | The open findings in `scene-analyses/2026-08-07_turtle-pair-and-v2v.md` that shape what a builder does: the film-reviewer offered to four builds and used by none becomes a verb the workflow runs; the squint sheet generated every run and never read; output filenames undiscoverable | Same brief, same or lower tier, one re-run per fix. Each fix is a yes or no in the next transcript: did the reviewer run, was the sheet opened. This is the first time the second loop turns with a before and after on one brief |
| **4. Determinism magnitude** | The frame dump (0.26.0) gains the numbers: changed-pixel count, bounding box, max channel delta, so "roughly the same after a tooling change" becomes checkable | A bracket injects a one-pixel diff and a whole-frame diff; the report must tell them apart by size and position. Flips one `VISION.md` scorecard entry |
| **5. Phase 4 as the kinematic bake** | The two measurable spikes first (sample rate, embedding format — the 2026-08-04 kinematic-body amendment in [`physics-bake-proposal.md`](physics-bake-proposal.md) needs no simulator and no WASM identity question), then one contact-gag film built on the bake. The harness gains its declarative layer for interaction, the largest gap in `VISION.md`'s table | The plan's own gate: byte-deterministic across seeks and across re-bakes with the same seed, with `smoke.js` untouched (red line 3). One new film in `scenes/`, one new card on the site, the roadmap row flips from `next` to `landed`. Then a cold build with the bake reference reachable |
| **6. Extent VALUE at shot times, and the rest of REP5** | Only when a film in step 5 or a cold build in step 3 demands them | The demand is the trigger, recorded in the ledger, never a session's judgment |

Each step is one to two sessions. A step is not done on a green bracket
alone. The site is the outward scoreboard: a harness improvement counts when
it flips a roadmap row or adds a film card. Three small site drifts (the
"six works" head over a larger corpus, the Hauler and Strider slugs out of
order, the header pill naming only Claude Code) go in their own commit,
because a push that touches `site/` deploys.

## Step 1 in full

### How it works

`scripts/cold-build.sh` is the whole mechanism, and its header comment is the
authoritative explanation of every flag; this section says why the shape is
what it is. Run it as

```
MITATE_COLD_ROOT=<an empty directory outside the repo> ./scripts/cold-build.sh --model sonnet
```

and it will:

1. Make an empty workspace under the cold root, so no `CLAUDE.md` is found in
   the working directory or any parent. The root is never defaulted to a home
   path, because repo content carries none; the owner keeps one outside the
   repo.
2. Load exactly one copy of the plugin, the **working tree**, via
   `--plugin-dir`, with `--setting-sources ""` so the marketplace-installed
   mitate and every other installed plugin stay out, and
   `--strict-mcp-config` so the account's connectors stay out. Both were
   probed on 2026-09-04: with no settings the session's slash commands hold
   one plugin skill, `mitate:mitate`; `--bare` and a fresh
   `CLAUDE_CONFIG_DIR` both fail to log in, so neither is the isolation
   mechanism.
3. Feed the brief on stdin in print mode with `--permission-prompts none`,
   so a tool call that would prompt is denied rather than hung, and capture
   the stream-JSON transcript to a file, capped by wall clock.
4. Write a manifest (git SHA, plugin version, model, effort, permission mode,
   brief and its hash, environment, timing, exit) and a **verdict derived
   from the transcript**: whether a `Skill` call named mitate (if not, the
   run is a routing measurement, `NOT-A-BUILD`, never counted as a build of
   the docs), which plugin files were read and how often (the reference-read
   table the analysis skill wants), and any read outside `plugin/`, which
   marks the run `CONTAMINATED`.
5. Hand off: `/analyze-build-session` on the transcript, then compare against
   the brief's baseline record in `scene-analyses/`.

The brief never names mitate; the script refuses one that does. Whether the
skill's description routes the request is part of the measurement.

The transcript and workspace stay under the cold root. The manifest is the
only file meant to be cited, and by class ("the run manifest `(local)`"),
never by path.

### What it is measuring, and what it is not

The run measures the docs against a **headless builder from the working
tree**. Two axes differ from the recorded fixtures: those were interactive
sessions (one human turn in the market-crash build, owner interruptions in
the 2026-08-07 batch) on a marketplace-installed cache. The manifest records
both axes as shared, and the analysis must label them. The marketplace
install path itself, `marketplace add` then `plugin install`, is not
exercised by this tool at all; the manual plugin-only session remains the
truer fixture for "what users have", and the two answer different questions.

### What can go wrong

- **Not actually cold.** Something leaks in. The check is mechanical, any
  read under the repo outside `plugin/` or under the plugin cache marks the
  run, and the analysis skill refuses contaminated samples. The account's
  global `CLAUDE.md` still loads, as it did for every recorded fixture: a
  shared axis, recorded, not a contamination.
- **The skill never triggers.** At a lower tier the description may fail to
  route. The run is then a measurement of the description, labelled as such.
- **Cost and hangs.** Past builds ran 100 to 180 minutes and about 100k
  output tokens. The cap kills a hung run and the manifest says `CAPPED`; a
  capped run is a partial sample. `--budget` bounds spend. On 2026-09-04 the
  first real run was deferred because the account's five-hour usage window
  was nearly exhausted: check `/usage` before starting one.
- **Environment failures read as doc failures.** The manifest records the
  encoders present and the GPU environment so the analysis can separate them.
- **Noise read as signal.** Two runs of one brief differ. What means
  something is recurrence across runs, and the tier at which a build still
  ships clean.
- **Overfitting to the brief.** Keep `market-crash.md` as the fixed baseline
  and add a second brief that rotates across registers; never edit a brief
  in place (the hash in the manifest is what makes runs comparable).
- **The cost moves to reading.** Each transcript needs an analysis session
  with subagents, and their findings need spot checks (`analyze-build-session`
  says which). Attention, not throughput, is the scarce resource; the spine
  in [`working-plan.md`](working-plan.md) already says so.

### Why it exists, and the case against it

The cold build is the only measurement the second flywheel has ever had, and
it was blocked on a manual owner step for four weeks. Without it every harness
change since 2026-08-07 is unfalsified. With it, a change is tested before its
version cascade, on the same brief, and the tier descent becomes something to
plot rather than remember.

Against: if the question is "what do installed users have", the manual
marketplace session is the truer fixture. If cold builds will run twice a
month, a checklist would do and this is more meta in a repo that already has
too much. Print mode may behave differently from an interactive session in
ways that confound comparison with the existing records. Each run costs real
tokens and an analysis session, and the value appears only after several. The
owner heard all of this on 2026-09-04 and chose to build it; the risks are
recorded in the manifest as labelled axes rather than left as objections.

## Session protocol

At the start of a session working this plan:

1. `git status --short`, then `bun run scripts/selfcheck.js`. A red may be
   another session's in-flight edit (`orientation.md`).
2. Read this file's sequence and find the first step whose "how we know"
   column is not yet satisfied. Re-derive the board section's lines you are
   about to rely on; do not trust them from the date at the top.
3. Before a cold build: check usage headroom, pick the tier one down from the
   last configuration that shipped clean, and use the fixed brief.

At the end:

1. Update the sequence's status words in place (DONE, unrun, BLOCKED and on
   what). Tactical edits here need no owner input.
2. Cite any run by class. Put counts and statuses only where a command can
   re-derive them, and run `/verify-written-claims` on the diff.
3. Write the day's log in `../internal/log/` before the session ends.

## How this reaches VISION's criteria

| criterion in `VISION.md` | step that moves it |
|---|---|
| a difference is localisable, reported with size and position | 4 |
| a claim can be re-derived by running something | 2 (the census replaces hand counts) |
| a declaration validates before a frame renders | 6, when a film demands it |
| a new capability reuses kernel, characters, materials and an instrument unmodified | 5 (the bake is the first capability to test it) |
| a film that needs something the vocabulary cannot say can still be made, and the gap is visible afterwards | 2 (unfenced helpers become a table) and 5 |
| a session arriving with no context can find what it needs and act correctly | 1 and 3, measured, on a cadence |

## What this plan deliberately does not schedule

- The lean-films change (the three.js injection question in
  `working-plan.md`), real and worth doing, but it changes no scene; after
  steps 1 and 2.
- The disclosure audit and the rest of REP5's trigger instrumentation, behind
  the census.
- A current-state rewrite of the repo-side docs. Recommended on 2026-09-04
  and not ruled on; it trims doctrine, which is the owner's call.
- Rapier or any runtime simulator. Red line 1 of the bake proposal.
