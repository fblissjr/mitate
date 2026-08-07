last updated: 2026-08-07

# Where truth lives

One rule generates the rest: **every fact has exactly one home, chosen by
asking where the next person who could break it will be standing.** Every
other surface points at the home. Nothing restates.

## The homes

| kind of fact | canonical home | everyone else |
|---|---|---|
| line-local invariant (a tick that guards determinism, a flag that renders black) | the comment ON that line | references may summarize and point in |
| method, discipline, failure modes — "how to fish" | `plugin/skills/mitate/references/*.md` | SKILL.md and code comments point, never re-teach |
| measured numbers and brackets | the one reference that owns the subject, with its conditions and a re-runnable harness — dateless, since shipped markdown is current-state only; the when lives in the ledger row below | code comments name the phenomenon, not the figure |
| **when a shipped file was last verified, against what** — the record shipped provenance headers used to carry (moved out 2026-08-05: everything under `plugin/` reads as current state, and selfcheck check 4 fails on any ISO date there) | `docs/shipped-provenance.md`, one row per shipped markdown file, updated in the same motion as the verification | shipped files carry dateless trust labels ("inherited, not re-measured on this stack") but never the date; history stays in git and CHANGELOG.md |
| routing and workflow order | SKILL.md | — |
| what a check can and cannot see | `references/instruments.md` | smoke.js comments say how, not what-it-means |
| **render-side** facts — backends, determinism, node stack, per-frame cost | `references/webgpu-stack.md` | — |
| **delivery-side** facts — shipping the scene itself: bundle size over the wire, hosting and mount policy, posters | `references/delivery.md` | — |
| **recording-side** facts — formats, encoders, decode cost, what GitHub renders inline | `references/recordings.md` | — |
| repo invariants that bite on first edit | CLAUDE.md | — |
| **INTENT** — what this is for, why determinism comes first and what it is first for, what a primitive has to be, why where-a-declaration-lives mattered, and which of reproducibility and byte-identity is load-bearing | **`VISION.md`** — the most important document in this repo, and the one every other is downstream of. Where any of them conflicts with it about intent, it wins and the other is the thing to fix | `site/` is DOWNSTREAM of this, one-directionally — see below. Nothing summarises it: it is argued rather than stated, and a bullet-point copy loses the argument, which is the content |
| **the representation decision** — the data/code boundary as drawn, its rejections, and its wrong-ifs (decided 2026-08-02) | `docs/representation.md`, the decision section. VISION.md keeps the why and points here for the what | the exploration page carries the argument; everything else points, nothing restates |
| history — what happened and why | CHANGELOG.md and git | docs speak present tense only |
| **a check's pass criterion** | the code that implements the check, beside the flag or constant it governs | CI config and session logs POINT; they never restate it |
| **what a session did** | `internal/log/`, one file per working day — **tracked as of 2026-08-01** | a finding worth keeping is still promoted to a postmortem. Tracking made the log citable; it did NOT make it doctrine. Cite it for what happened, never for what is true — where a log and a postmortem disagree, the postmortem wins |
| **what a cold build actually did** — the timeline, guidance-vs-behavior and tool-output record of an external, plugin-only session (class created 2026-08-05, owner) | `docs/scene-analyses/`, one dated file per analyzed build — **or one per BATCH of builds run as a single comparison** (amended 2026-08-07, when three builds on one day included a matched pair and the findings that mattered most were the ones that recurred across all three; one file per build would have put a single comparison in three files and left the recurring findings homeless). A dated record: it settles nothing and needs no freshness marker | the builder's own postmortem stays beside its scene as `(local)` evidence — cite it for the film's technical findings and this record for the builder's behavior; where they disagree about behavior, the transcript-derived record wins. References and working-plan cite these files as evidence |
| **which question a corpus film is evidence FOR** — its build class, COLD (plugin-only, no repo context) or WARM (built in-repo with the plan, notes and instrument source in hand) | `scenes/README.md`, stated per film in its own section (owner, 2026-08-07) | **the two classes are not poolable and the asymmetry runs one way**: a cold build's smoothness is evidence the shipped surface works; a WARM build's smoothness is evidence about *nothing*, because the builder read the source. A warm film is never a data point for VISION's cold-start criterion. Anything citing a film as evidence names its class or is making an unsupported claim |


**Render, delivery and recording are separate domains and must not share a
home.** They measure different things and their figures collide: a "2.3x" exists
in two of them — the renderer backend speedup (`webgpu-stack.md`) and an AVIF
encoder-effort ratio (`recordings.md`) — and a consolidation pass nearly merged
them as duplicates of one fact. When a figure could belong to more than one, say
which side it is on.

**`site/` is downstream of everything, and nothing is downstream of it.** Owner,
2026-07-30: *"the vision defines and informs site language, and plan informs site
copy of plan. Fundamentally the vision and the code tracked out of site is the
source of truth. The site is just how you and I choose to communicate it out."*

So the flow is one-directional — `VISION.md`, `docs/plan.md`, `README.md` and the
code **→** `site/` — and it never runs the other way. Two consequences that are
easy to miss in opposite directions:

- **The site is not a source, so it settles nothing.** If it disagrees with
  `VISION.md`, the site is what is wrong. It is not a "vision carrier" and it
  owns no fact; an earlier version of this repo's plan promoted it to one.
- **But it is not exempt either.** A language change in `VISION.md`, `plan.md` or
  `README.md` creates real work on the site, because the site is how that
  language reaches anyone. Changing the wording upstream and leaving the site on
  the old wording is drift, not independence. **Measured 2026-07-30:** this
  branch rewrote `README.md`'s `t` framing and deleted a false duration ceiling,
  and `site/index.html` still carried the superseded sentence verbatim.

How the copy *reads* is the owner's call and may change over time; what it
asserts is not.

The delivery/recording line was drawn in 0.16.38, and it is the line between
**the artifact and a copy of it**: `delivery.md` owns shipping the scene, which
is what happens on any surface that can run one; `recordings.md` owns producing a
lossy copy, which exists solely because GitHub will not render an mp4 inline. One
file previously held both under a single provenance header that said "UNKNOWN —
never audited", which was true of the inherited encoder measurements and false of
this repo's own measured brotli figures sitting beside them.

**A number travels with its provenance, or it gets trusted past its warrant.**
One rule, three facets — a bracket carries its **date** (above), its
**conditions** (how it was measured), and its **reproducibility** (a harness
that runs from a clean checkout). A claim you cannot re-derive is soft in a way
the reader cannot see, whether the gap is in the method or in the ability to
run it again.

It fails in both directions, independently. **Sending:** state the conditions,
or someone with no way to check will rank your figure above their own result.
**Receiving:** an external number missing its conditions does not outrank a
control you already ran. Make the harness self-contained when the measurement
is taken — a minute there, unrecoverable later.

Worked instance: CHANGELOG 0.16.2.

## A code comment may not assert what another file does

The boundary every claim-defect in this repo has crossed. Stated as a rule
because five instances shared it and none was careless:

> **A code comment may assert what its own line does. It may not assert what
> another file does.** A claim about another file's behaviour belongs in the
> reference that owns the subject; the comment points and does not restate.
> Anything else is a claim that cannot be checked from where it lives.

The instances: a solver comment asserting *"the extent check in smoke.js is what
catches it"* when there is no extent check; a shipped example citing a probe tool
that has never existed in any generation; `build.js` naming a docs path belonging
to a different repository; a workflow header carrying a verification criterion
owned by a script, until the two contradicted each other; and a KERNEL comment
asserting that different noise tracks are independent when a quarter of the pairs
alias exactly.

**Two halves, and only one of them is decidable.** Whether a claim about
behaviour is *true* needs a reader. Whether a cited path *exists* does not, so
`scripts/selfcheck.js` checks that half on every commit — path-shaped citations
and bare filenames in a provenance frame, both measured for precision before
being trusted. The other half is what `doc-claim-auditor` is for.

## Never hand-write what a command produces

The rule that generalises every copy-defect found while executing the 2026-07
migration, and the one that would have prevented four of them outright.

> **If `selfcheck.js`, `--parity-only`, `git` or `ls` can answer it, prose points
> at the answer and does not restate it.** A number that is not written cannot be
> wrong.

`CLAUDE.md` asserted "`references/` (9)" while `selfcheck` derived the same
number on every run; the assertion was wrong one commit after it was written. It
also carried a fence-carrier count, "all three brackets" when there were four,
and a fourth membership list for the window contract. All four were deleted
rather than corrected, because correcting a copy only resets its clock.

**This outranks writing a check.** Guarding a copy is O(n) in copies and each
guard is one more thing that can misfire — five did, every one of them failing to
tell *carrying* a fact from *describing* one, which is a limit of text matching
rather than a series of accidents. Deleting the copy is O(0) and cannot misfire.

Prose still carries rules, rationale and design arguments. Those are not
derivable, and they do not rot the way a count does.

**2026-08-01 — the rule got a check anyway, and the paragraph above is why that
needs explaining.** `selfcheck` check 12 fails when a bracket states its own arm
count in prose. That is exactly the O(n) guard this section says is outranked by
deletion, and it was added because **deletion alone did not hold**: the rule was
written here, and then broken four separate times — `gate.yml`'s "all three"
against four globbed brackets, `CLAUDE.md`'s "9 references", `bracket-parity.js`
saying "five ways" while running 22 rows, and `bracket-driver.js` saying "nine
ways" two lines above its own printed count of ten. A rule written down and
violated four times is not being followed, so the choice was not
*delete-versus-check*, it was *check-or-keep-losing*.

**Two things keep it consistent with the rule rather than an exception to it.**
The check does not guard a copy; it forbids the copy existing, and the same
change made every bracket print its count so the derived number is on screen —
which is the deletion this section asks for, with the check only preventing
reintroduction. And the second: **check 12 immediately demonstrated this
section's own warning.** Its first cut flagged `bracket-selfcheck.js`, whose
fixture is a string literal *containing* the forbidden header — a guard failing
to tell carrying a fact from describing one, for the sixth time. Fixed by
requiring a line to BEGIN with a comment marker rather than contain one. Read
that as evidence for the warning, not against it: the guard was written by
someone who had just read this paragraph, and it still happened.

**2026-08-01 — check 13 closes the class, and the design lesson is that a
scanner cannot.** Check 12 covered one shape; the rule kept losing everywhere
else. The first design was a scanner over prose, and it is wrong for a reason
worth keeping: the forms a count takes are unbounded — "9 references",
"`references/` (9)", "all three", "five ways", "two of twelve" — so three greps
written specifically to find the `CLAUDE.md` violation came back **empty on a
violation already written down two paragraphs above**, because it was a
parenthetical. A line-based scan then missed a second class outright: these files
wrap at ~80 columns, so `docs/addressing.md`'s "all five shipped\nexamples"
straddles a newline and is invisible to anything matching one line at a time.

So the instrument is a **generator**. `scripts/derived-counts.js` holds a
REGISTRY of countables and fills a marker it placed itself; check 13 recomputes
and fails on disagreement. It cannot miss and cannot false-positive, because it
never has to recognise anything. Adding a countable is a data edit.

**What it found on its first run is the argument for it**: `instruments.md`
asserted six registered fences and listed six, omitting `CONTRACT`, stale since
0.16.44 — in a file that SHIPS, so it had disagreed with `smoke.js` for eleven
versions for every installed user. The same stale six sat in `docs/plan.md` and
in `.claude/skills/`, which nothing mechanical had ever covered.

**The bare-count half is best-effort by admission**, scoped by measurement:
scanning every tracked file surfaced 71 hits, essentially all legitimate history;
the front-door files surfaced five. `CHANGELOG.md`, the logs, the postmortems and
the planning records in `derived-counts.js`'s HISTORICAL list are excluded as
dated records (the list is named by pattern there, not counted here — a "two
planning documents" phrasing went stale the day the restructure plan deleted
itself). What remains uncovered
is a noun outside the REGISTRY and anything inside an excluded record — a handoff
listing four cached plugin versions where five exist is outside every guard here.
**There the answer is not a check: cite the command, not its output** — and
since 2026-08-03 that sentence has teeth: a line about repo state in those
files either carries the command/commit that produced it, or is written in
past tense with its observation time, or is labelled `(memory)`, `(local)`
or `(reported)` (the vocabulary the postmortems and
`snapshots/2026-08-02/history.md` already use). Adopted on measurement: an
audit of three days of corrections found every drifted line uncited and
every cited line surviving, at a base rate of roughly four failures per
twenty-three confident same-sitting claims. `/verify-written-claims` is the
procedure; `scripts/claims-reminder.sh` (bracketed, session-deduped) reminds
at the edit. The refutation test travels with the rule: if a third of the
next twenty corrected lines turn out to have carried citations, the
discriminator is wrong and this paragraph reverts to its first sentence.

## Document lifecycle: three classes, and who may edit what

Added 2026-08-04 (owner session), because the retired next-session handoff
memo proved that future obligations kept in prose evaporate, and because
"when may a session prune a document" had no written answer.

- **Doctrine** — `VISION.md`, `plan.md`, `representation.md`, `CLAUDE.md`,
  the shipped references. Changed by decision, never pruned. Drift control is
  `/audit-claims`. **Changes here need the owner.**
- **Dated records** — `CHANGELOG.md`, `internal/log/`, `docs/postmortems/`,
  `snapshots/`. Append or annotate only; never pruned, never a tiebreaker.
  No permission needed to append; rewriting history is forbidden for anyone.
- **In-motion documents** — `working-plan.md`'s queue and status sections,
  any dated brainstorm, and the class's worked example: `restructure-2026-07.md`,
  which lived as one until it deleted itself 2026-08-04. Consumed by
  design: items graduate, sections get pruned, the file may delete itself.
  **Tactical edits here need no owner input (owner, 2026-08-04)** — queue
  updates, dispositions, landings recorded, superseded sections marked. What
  DOES need the owner: changing a decision the document records, or deleting
  content that is not superseded.

**A future obligation is a marker, not a memory.** Any "do X when Y" or
"run X on date D" that must survive session boundaries is written as

    <!--due: <YYYY-MM-DD> | the action, stated so a stranger can do it-->
    <!--due: when-absent <repo-relative-path> | the action-->

(both shown with placeholder brackets so this documentation is not itself a
marker; a real one carries a bare date or path) in the document it governs.

**A date in a marker must be load-bearing** (owner, 2026-08-04): a
pre-registered measurement window (frozen at registration, never re-dated
after) or a real external deadline. An invented "check back by Friday" date
is a queue item wearing a deadline costume — it goes in the deferred table
or the router's queue with a trigger, not in a marker, because an arbitrary
red trains route-around and serial re-dating is the snooze button that kills
the mechanism's authority. Likewise every `when-absent` action must be
completable in all its branches — a marker that can go red with no
satisfiable action is a permanent alarm, which is worse than none. `scripts/selfcheck.js` (check 15, controlled by
`bracket-selfcheck.js`) goes red the moment one falls due — at the next
commit or push, whichever comes first — naming the file and the action.
Completing or deferring is an edit to the marker, so the disposition is in
git. This replaced the handoff memo's job of remembering the future; a
mechanism that fires beats a memo that rots.

## The rules

- **A number appears once.** Re-measure it → update its home plus a CHANGELOG
  line. Finding the same figure in two places is itself the bug — delete the
  copy, don't sync it.
- **Every reference declares what it is canonical for, and its verification
  date lives in `shipped-provenance.md`** — not in the reference. A capability
  claim without a verification date is still a rumor; the date just stopped
  travelling with the claim at 0.22.0, because shipped markdown loads into an
  agent's context and history riding along is cost with no reader. The homes
  table above records the move; this rule said the opposite until it was
  caught, which is the half-migration shape a two-section file invites.
- **Incident records are canonical in code.** "This reached `git add` once"
  belongs on the line it scarred, forever; docs may cite it, never own it.
- **When code and doc disagree, neither wins by default.** The newer audit
  date says which is more likely stale; the fix updates the home and deletes
  the copy.
- **Drift detection is scheduled, not heroic.** A change that touches code a
  reference describes gets a `doc-claim-auditor` pass (shipped in
  `.claude/agents/`) over that reference before commit.

Born 2026-07-24 — the day one session found the same figure stale in four
files, and a reference confidently describing a mechanism the stack never
had.
