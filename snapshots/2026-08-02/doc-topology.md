last updated: 2026-08-02

# Documentation topology, as of 2026-08-02

Frozen record. `docs/source-of-truth.md` is the live home for the homes table
summarized here; `docs/README.md` is the live router. Where either disagrees with
this file, it wins. See [`README.md`](README.md).

## The organising principle

**Every fact has one home, and everything else points at it.** That is the rule,
and the reason it needs a rule is that this repo has broken it more often than any
other. The failures are always the same shape: a fact restated somewhere it is not
owned, which then rots while the original moves. Named instances include a fence
count that shipped wrong to installed users for eleven versions, a "cover two of
the five" line that two additions made wrong twice, a parity command printed with
two globs after a third carrier joined, and a ledger figure stale in the very file
whose job is counting.

The derived corollary, which the repo treats as more important than the rule
itself: **a list of names goes stale loudly; a count goes stale silently.** Prefer
naming things over counting them, and prefer deriving a count over writing one.

## The tiers

| Tier | Location | Ships? | Freshness governed by |
|---|---|---|---|
| front door | `CLAUDE.md` | no | `last updated:` + check 9's Map completeness |
| vision | `VISION.md` | no | `last updated:` |
| developer docs | `docs/` | **no** | `last updated:` |
| shipped skill | `plugin/skills/mitate/` | **yes** | provenance headers, check 4 |
| dated records | `CHANGELOG.md`, `internal/log/`, `docs/postmortems/` | no | nothing — they are the record |
| downstream | `site/` | no (deployed) | nothing mechanical |
| behaviour definitions | `.claude/` | no | **nothing** — the known gap |

**Nothing in `docs/` ships.** An install cache holds only what lives under
`plugin/`, so those files are for people and agents *developing* mitate. A
reference that needs to reach an installed user goes in
`plugin/skills/mitate/references/` instead.

## Where each kind of fact lives

Condensed from `docs/source-of-truth.md`, which owns it:

| Kind of fact | Canonical home |
|---|---|
| a line-local invariant (a tick guarding determinism, a flag rendering black) | the comment **on that line** |
| method, discipline, failure modes — "how to fish" | `references/*.md`; SKILL.md and code comments point, never re-teach |
| measured numbers and brackets | the one reference owning the subject, with date, conditions, and a re-runnable harness. Code comments name the phenomenon, not the figure |
| routing and workflow order | SKILL.md |
| what a check can and cannot see | `references/instruments.md` |
| render-side facts (backends, determinism, node stack, per-frame cost) | `references/webgpu-stack.md` |
| delivery-side facts (bundle size over the wire, hosting, posters) | `references/delivery.md` |
| recording-side facts (formats, encoders, decode cost) | `references/recordings.md` |
| repo invariants that bite on first edit | `CLAUDE.md` |
| why determinism comes first | `VISION.md` |
| history | `CHANGELOG.md` and git; docs speak present tense only |
| **a check's pass criterion** | the code implementing the check, beside the flag it governs. CI config and logs **point**, never restate |
| what a session did | `internal/log/`, one file per working day |

The check-criterion row is the sharpest of these, and it is why `gate.yml` and
`static.yml` are dense with reasoning but contain no thresholds.

## The developer docs, by size

Derived 2026-08-02. Size is informative here because two of these exceed a
default read window and the repo says so rather than letting a reader discover it:

| File | Lines | Role |
|---|---|---|
| `working-plan.md` | 3274 | the standing backlog — spine, ancestry table, deferred items with triggers, measurement debts, sequencing with a verified status column |
| `predecessor-record.md` | 2770 | inherited measured findings. **Exceeds a default read window — read it in ranges** |
| `restructure-2026-07.md` | 1874 | the open migration; carries the current-position block |
| `plan.md` | 1189 | architecture and phase gates |
| `addressing.md` | 773 | what `t` is, and why it is addressed by beat |
| `pattern-ledger.md` | 239 | how many times a shape has been independently rebuilt |
| `source-of-truth.md` | 199 | where each kind of fact lives |
| `examples-placement.md` | 199 | one settled decision, kept for reopening |
| `physics-bake-proposal.md` | 140 | what a Phase 4 bake may and may never do |
| `orientation.md` | 66 | the briefing to hand a subagent |
| `README.md` | 32 | the router |

Plus `postmortems/`, currently three files. <!--count-mention-->

## Routing, and the two documents that matter most for it

**`docs/README.md` is a router, not a summary** — deliberately, because a summary
there would be a second copy of everything it points at. It maps question to file
and to *when* you should read it.

**`docs/orientation.md` is the ~50-line briefing to hand a subagent**, which never
auto-loads `CLAUDE.md`. Its existence is the answer to a structural problem: a
delegated agent starts with no invariants, and the failure mode is not that it
refuses to work but that it works confidently against rules it cannot see.

Two routing rows are unusual enough to name:

- **"Is this already decided, or still open?"** routes to a grep for the exact
  phrase `Open question`. That row exists because a cold-start test found the gap
  it closes: two zero-context agents asked about two recorded design questions
  both reached correct answers, and **both got there by guessing a topic keyword**
  after finding no row — one won on "declarative", the other only after its topic
  words missed and it searched the repo's *epistemic* vocabulary instead.
- **"What should I work on next"** routes to `restructure-2026-07.md`'s
  current-position block while that migration is open.

## The precedence order

When two documents disagree, this is the resolution order, and it is not the
obvious one:

1. **Code** — a check's pass criterion is the code, always.
2. **Postmortems over logs.** Both are dated records, but the log is narration and
   the postmortem is the distilled finding. Tracking the logs (2026-08-01) made
   them citable; it did not make them doctrine. Cite a log for what happened,
   never for what is true.
3. **Newer postmortems over older, and later annotations over first verdicts.** A
   postmortem carries dated annotations, so its own later corrections outrank its
   original conclusion. Read newest first.
4. **`restructure-2026-07.md` over `working-plan.md`** wherever both name a thing,
   for as long as that migration is open. Parts of `working-plan.md` are
   explicitly superseded.
5. **`CLAUDE.md`** for invariants.
6. **The site settles nothing.** It owns nothing, so it is never the tiebreaker.

## Freshness, in two forms

Documentation carries a dated freshness marker in whichever form fits:

- **`last updated:`** — for docs and plans. It means last **touched**: a commit
  editing a dated doc dates it to that commit, or the rule is unsatisfiable.
- **A dated provenance header** saying what was verified against what — for every
  reference, and for SKILL.md. This is the better instrument, because it records
  *the check* rather than the touch.

A file that is itself a dated record needs neither. `selfcheck.js` enforces this
over every tracked `.md` **carrying** the marker, deriving that set rather than
listing it — an earlier version named eight paths and had already gone stale, with
one marked file silently unchecked.

## The known gap: `.claude/`

`.claude/agents/*` and `.claude/skills/*` are behaviour definitions, not
documentation. Their freshness is git history, so **nothing mechanical covers
them** — the derived set that check 7 builds excludes them by construction.

This is not theoretical. A review found four stale claims in one agent file, each
of which would have made that agent report a working capability as drift.
`/audit-claims` routes at them explicitly and is their only control.

## Drift found on 2026-08-02

Two live instances, both recorded in
[`state-of-play.md`](state-of-play.md) with their evidence:

1. **`docs/pattern-ledger.md`** labels the presence-gating row's evidence
   `(local)` when a tracked file carries it at the same count. A location claim
   that is false, in the file whose job is counting — the second such defect found
   in that file in two days.
2. **`site/index.html`** shows a code excerpt, captioned and linked as being from
   a named shipped file, whose signature PR #6 changes. The site is downstream and
   settles nothing, but "downstream" means a change upstream *is* work on the site,
   not that the site may lag.

Both are the same class the topology exists to prevent, which is the useful
observation: the rule is written down, mechanically enforced in several places,
and still losing at the edges the generator cannot reach — a location claim in
prose, and a code sample in HTML.
