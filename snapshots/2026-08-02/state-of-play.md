last updated: 2026-08-02

# State of play, 2026-08-02

Frozen record. Verified against the tree on this date rather than recalled — the
distinction matters here, because the preceding handoff in `internal/log/` was
audited by the following session and had four inaccuracies, every one a confident
pointer or count written in the same sitting as the work.

## Position

**This section was written twice on the same day, which is the point.** It first
recorded two open PRs at 0.16.61 and 0.16.62 against a `main` at 0.16.60. Those
landed within hours. What follows is the end-of-day state; the superseded
paragraph is not preserved, because unlike a plan document this file has no
readers who acted on the earlier version.

| | |
|---|---|
| `main` | version **0.16.63**, both PRs merged |
| open PRs | **none** |
| deleted | `phase-r-determinism-trio` and `r5-state-seam`, local and on `origin`, both fully merged first |
| branch with no PR | `postmortem-what-caught-defects` — docs only, still unmerged, conflicts with nothing |
| local work not yet pushed | `drift-2026-08-02` (two corrections), `snapshot-2026-08-02` (this directory) |

**The `nas` remote was unreachable at cleanup time**, so its `r5-state-seam` ref
is stale and its `main` is many commits behind. That second remote is easy to
forget and has been forgotten before.

## The merge, and what it costs

Verified by dry run on 2026-08-02, not predicted.

**#5 must merge before #6.** #6 is numbered 0.16.62 around #5's 0.16.61, so
landing #6 first puts main ahead and merging #5 afterwards walks the version
backwards. `selfcheck` will not catch that: check 1 verifies the three sources
agree with each other, not that the version moves forward.

**#5 merges into main cleanly. #5-then-#6 produces exactly four conflicts**, all
additive collisions rather than semantic ones:

```
.claude-plugin/marketplace.json      version string
plugin/.claude-plugin/plugin.json    version string
CHANGELOG.md                         both add an entry at the top
internal/log/log_2026-08-01.md       both append a sitting
```

Resolution: both changelog entries in version order, both log sections in sitting
order (ninth then tenth), and 0.16.62 for the version.

### Landing both turns `main` red — found 2026-08-02

`main` alone passes `selfcheck` (exit 0). After merging #5 then #6 with merge
commits, it exits 1:

```
FAIL plugin/ content changed since the last version bump (7245663) but the
     version did not move: bracket-driver.js, smoke.js
```

**Mechanism.** Check 11 anchors on `git log -1 --format=%H -- plugin.json`. The
merge commit is TREESAME to its second parent (both hold 0.16.62), so git's
history simplification skips it and the anchor resolves to #6's bump commit.
#5's `smoke.js` and `bracket-driver.js` changes then appear to have landed after
the last bump with no bump of their own.

**Squash-merging does not fix it, it trades it.** Under squash the cascade check
goes green, but `%cs` becomes the squash date and the freshness check reds on six
docs dated 2026-08-01. Either strategy leaves main red, and `static.yml` runs on
every push.

**Fix applied:** merge commits, with the **0.16.63 reconciliation carried in the
merge commit itself** rather than as a follow-up. Putting it in the merge makes
that commit non-TREESAME to both parents, so it becomes the anchor and the check
reads true. A follow-up commit would also have worked, but could not have been
committed — the pre-commit hook runs `selfcheck`, so the intermediate state was
unlandable without bypassing a hook.

Verified on the merged tree before pushing: `selfcheck` exit 0 at nineteen
checks, cascade trigger `0.16.61 → 0.16.63` over eight plugin files, parity ok
over nine files, `smoke.js` exit 0 with all scenes passing, `bracket-driver.js`
18 arms 0 skipped.

**The check is not wrong about users.** #5's code does ship in 0.16.62; it is in
the tree. Check 11 is blind to merge topology, which is a narrower defect than it
first reads and is recorded here rather than fixed, because touching a check
means running its bracket red-then-green first.

**Neither PR's CI covered the merged combination** — #5 changes the checker, #6
changes the scenes. Run on 2026-08-02 against the merged tree: `smoke.js` exit 0,
all scenes pass; `bracket-driver.js` 18 arms, 0 skipped, all as specified. But on
WebGPU-Metal, not CI's WebGL2 fallback, so that is corroboration and not a
substitute for the gate.

## What shipped 0.16.57 to 0.16.62

| Version | What |
|---|---|
| 0.16.57 | check 13 closes the hand-written-count class with a generator. Found a stale fence count that had shipped wrong to every installed user for eleven versions |
| 0.16.58 | the reachability arms — unreproducible evidence became a standing control, with a negative control proving the arms can notice a disconnected push |
| 0.16.59 | the framing margin became a controlled claim (an arm halves the threshold and requires the fixture to still pass) |
| 0.16.60 | `SKILL.md`'s description was 1093 against the 1024 limit and had been since 0.16.18. Trimmed to 986; check 14 enforces it |
| 0.16.61 (#5) | the determinism trio: `onThrow` declared per check, and the `!fails.length` guard removed |
| 0.16.62 (#6) | `setCamera(state)` across eight carriers, and `gaitPose` no longer reading mutable scene-graph state |

Two of those are worth expanding because they are the sharpest instances of this
repo's characteristic failure mode.

**The `!fails.length` guard (0.16.61).** It read `fails` *globally*, so any
unrelated earlier failure silently disabled the only check covering load-time
nondeterminism. Written at 0.16.9 with no recorded reason, never exercised by any
control, and it survived four months because demonstrating it needs a fixture
carrying **two** defects at once. With the guard in place, a scene whose live HTML
and recorded MP4 are provably different films shipped green — on the clause the
entire project rests on.

**`gaitPose`'s `rootX` (0.16.62).** It defaulted to `rig.root.position.x` and was
correct only because every caller assigned that field on the line above: an
ordering dependence inside `animate`, not an argument. Five of seven call sites
relied on the default. Now required with a loud throw, because the silent failure
is NaN foot targets — a film that renders and is subtly wrong.

## Carried hazards, all deliberate

| Hazard | Status |
|---|---|
| `bracket-noise.js` reds locally on macOS, green in CI | pre-existing. The arm needs a scene that *claims* WebGPU then *falls back*; on a Mac with a real adapter no fallback happens. The premise is environment-dependent and the bracket does not say so |
| `after-hours.html` fails determinism intermittently | 2 of 2 events under full corpus, 0 of 17 isolated. A single green comparison is weaker than it reads |
| the defect corpus has no runner | `bracket-corpus.js` does not exist |
| `shoot.js` has no brackets | the recorder is uncontrolled |
| the deployed site may lag the repo's films | deliberate, per `site/netlify.toml` |

The first is the one to watch, and the repo names why: a control that cries wolf
on the developer's own machine is a control people learn to skip, and this one
sits beside four that are honest.

## Filed open questions

Every unresolved design question in `docs/` is filed under the exact phrase `Open
question`, and that convention is the search path. Two were filed on 2026-08-01,
both **design sessions rather than tasks**:

**NaN has no policy, and the kit has become a DSL** (`docs/working-plan.md`,
owner-raised). Three recorded instances where NaN made one check confidently
wrong and another silently all-clear. The DSL half has a home in R5.2, unstarted —
and R5.2 is the prerequisite this turns on, because a policy written against an
unenumerated language covers only what someone remembered.

**When does a pattern need its provenance, and when is that noise?**
(`docs/pattern-ledger.md`). Carries the diagnostic that fell out of the day: *if
removing the citation breaks the claim, the claim was leaning on the artifact
rather than the finding.*

## R5, the current tier

**R5.1 is partly done (0.16.62), and the reason it is only partly is the useful
part.** Its two verifiable items shipped. `hide(obj,u)` and `subjectFromObject`
were deliberately not promoted: neither exists in the tracked tree at all, and the
survey that stopped them found the ledger's count for the presence idiom was ×7
against an actual ×11.

Still open in R5:

1. **`references/breakdown.md`** — enumerate the declarative layer. It exists,
   works, and is "unnamed, unspecified, and unvalidated as a whole." It was the
   top recommendation in two internal documents, costed at one afternoon and no
   code, and is a ranked item in none. Something else already cites "after the
   enumeration exists" as its revival trigger — a trigger on a thing nobody
   scheduled.
2. **`build.js check`** — a cross-reference validator over tables that already
   exist: shot anchors inside their beat, subject and focus names resolving,
   union shots using only wide rungs, captions fitting at documented CPS,
   declared-versus-measured extents, beats summing to duration. Buildable today,
   and claimed to have caught at least three of one film's defects before a
   single frame rendered.
3. **Amend `physics-bake-proposal.md` with the kinematic-body option.** As
   written, the declared impulse is a literal restatement of the hand-matched
   constant it was meant to replace. Driving the character in as a kinematic body
   is what makes "did they touch" a computed fact.

Gate R5: cross-directory fence parity green after the batch, and every untouched
beat byte-identical or above the 70 dB bar on the three canonical edits.

## Findings from the 2026-08-02 verification pass

Recorded here because they are new on this date and not yet filed anywhere live.

**1. `docs/pattern-ledger.md`'s presence-gating row mislabels its evidence as
local-only.** The row states the `Math.max(1e-4,…)` spelling "lives in a local
prototype `(local)`, not in the tracked corpus," and PR #6 reasoned from that to
"the drift is between one tracked file and one local one — enough to justify the
helper, not enough to promote from." But `fixtures/defect-corpus/after-hours.html`
is tracked and holds exactly eleven occurrences <!--count-mention--> — the same
count — and the corpus README records that file as re-skinned from that prototype
with the script unchanged. The evidence is re-countable by anyone with the repo.

Stated fairly, because it cuts both ways: a re-skin is not an *independent*
rebuild, so the ledger's count-of-independent-instances logic may still be right
to decline it as a second instance. What is wrong is the **location** claim, and
location is precisely what the `(local)` rule governs — a claim may cite a local
artifact but must not rest on one. This row no longer rests on one. Same shape as
the error PR #6 itself caught, one layer down.

**2. `site/index.html` will show a signature that no longer exists.** Its contract
section presents a code block captioned as the driver block from `gearbox.html`,
links to that file, and prints `setCamera(t); animate(t);`. After #6 that file
reads `const state={t};setCamera(state);`. Not a call site, so #6's "zero stale
call sites" is literally true — but this is the drift `CLAUDE.md` names when it
says a change upstream is work on the site or the two drift. The layer
description directly above the excerpt already promises `camera(state)` and
"State is a plain value," so updating it makes the page agree with itself.

**3. Check 11's merge-topology blind spot**, above. **Not fixed** — changing a
check means running its bracket red-then-green first, which is its own change.

**All three were acted on the same day.** (1) and (2) are corrected on
`drift-2026-08-02`. Fixing (2) turned out to be wider than reported: the same
excerpt was also in `README.md`, and grepping for the old signature found **six
present-tense claims across four planning documents** asserting that
`setCamera(t)` takes `t` and that Phase 6's gate is therefore unreachable. The
most consequential is `plan.md`'s Phase 6 entry — the seam moved that gate from
*unreachable as written* to *untested*, which is a different state and a better
one, and the plan did not say so. Corrected without claiming the gate is met,
because only a spike can measure that.

## Next work, in order

1. Land `drift-2026-08-02` and this snapshot, then
   `postmortem-what-caught-defects` — which is where the day's distilled finding
   lives and which `main` still cannot see.
2. **R5.2, `references/breakdown.md`** — the prerequisite the NaN question turns
   on.
3. The corpus debt: `bracket-corpus.js`.
4. `hide(obj,u)` and `subjectFromObject` — triggers verified as still firing, but
   each is its own change with its own red. Explicitly **not** a bundle.

## Housekeeping surfaced on 2026-08-02, none of it filed anywhere live

Recorded in [`history.md`](history.md) with evidence; listed here because each is
small, actionable and currently owned by nobody:

- `CHANGELOG.md` carries an `## unreleased` heading stranded mid-file, above a
  released version, describing shipped work. Nothing checks heading order.
- Two of the six working days have no session log, and they are the first two.
- A backticked pointer in the earliest log does not resolve; check 3 excludes
  backticked prose by design.
- The 2026-07-30 log's opening summary contradicts its own body.
- A "four months" duration claim ships inside `smoke.js` in a repo eight days
  old.
- A postmortem forward item points at a threshold that has since moved the other
  way for a good reason recorded only in the code.
- Eight commits from 2026-08-01 are unsigned. Signing works again.
