last updated: 2026-08-04

# working-plan sections pruned at the restructure plan's retirement

Frozen record, moved here 2026-08-04 when `docs/restructure-2026-07.md`
deleted itself on R5's closure — the `when-absent` marker in
`docs/working-plan.md` named this move as its action. Where anything here
disagrees with a live document, the live document wins; nothing here is
current.

**The criterion for what moved, stated so the choice is auditable:** a
section moved only if it was wholly consumed — executed, resolved, or
superseded as a queue — AND homes no live rule, trigger, or pre-registered
design. Three sections met it: the sequencing table (superseded first by the
restructure plan as sequencer, then by the router's work-next row; its
status column was a 2026-07-30 snapshot), A1 (shipped as `build.js probe`,
0.16.32–0.16.37, its earn-in amendment adopted into `plan.md`'s promotion
rules), and the 2026-07-31 BLOCKING MERGE review (all 15 findings closed by
0.16.50, PR #3 merged). Sections describing executed work that still home
something live stayed: A0 (carries the pre-registered film-reviewer
prescription control and its answer key), Track D (`STYLE.palette` and the
`CONFIG.name`/`titleCard` split remain unshipped backlog), and the PR #3
readiness buckets (standing records nest under them).

Residual facts from the sequencing table that were still true at the move,
restated in `working-plan.md`'s header rather than lost: Track A items 2
(`build.js transitions`) and 3 (cost reporting) remain unbuilt; item 4's
limit-wins-tiebreaker half still waits on item 2.

---

## Sequencing at a glance

**Status column verified 2026-07-30 against the tree**, by checking the artifact
each row claims rather than by reading this document. Rows marked `—` were not
re-checked this pass and should be treated as unknown, not as pending.

| # | item | track | fenced | blocked by | status (2026-07-30) |
|---|---|---|---|---|---|
| **0** | **ship `film-reviewer` with the plugin** | **A** | no | — | **DONE** — `plugin/agents/film-reviewer.md` ships |
| 1 | `build.js probe` | A | no | — | **DONE** — in `build.js`'s `USAGE`, 0.16.37 amended the prime directive to admit it |
| 2 | `build.js transitions` | A | no | — | **NOT DONE** — absent from `build.js`'s verb list |
| 3 | self-reported elapsed + backend hint + resolved binary | A | no | — | **NOT DONE** — no elapsed or backend-hint reporting in `build.js` |
| 4 | `SKILL.md` step 3 rewrite **+ route to the reviewer + the limit-wins tiebreaker** | B | no | **0, 2** | **PARTIAL** — SKILL.md was rewritten whole in 0.16.34 and routes to `film-reviewer`; the limit-wins tiebreaker is absent, and item 2 never landed |
| 5 | demote backend policy in `SKILL.md` | B | no | 3 | **DONE** — carried by the 0.16.34 rewrite, which put backend policy after the workflow |
| 6 | provenance repairs (PNG home, 700px pointers, site row) | B | no | — | **PARTIAL** — the 700px pointers resolve; the `source-of-truth.md` site row landed 2026-07-30 |
| 6b | **fix the false extent-check claim** in `solveShot`'s comment | B | no | — | **DONE** — both 3D templates now say the guard is a lie about extent and to measure instead |
| 6c | sweep code comments that assert a check exists (second instance of the class) | B | no | — | **SUPERSEDED** — `selfcheck.js` check 6d makes the class mechanically detectable instead of swept by hand |
| 7 | the batched kit release | D | **yes** | — | — |
| 8 | viewer overlay + capture | C | no | 7 | — |
| 9 | camera bake + the fork | C | no | 8 | — |

**Track E is not in this table.** It was added 2026-07-31, after the status
column was verified, and adding rows dated differently would silently corrupt a
column whose whole value is that one date covers every row. Track E carries its
own ordering, and its E0 gates its own E1 and E2.

**What is actually left of Track A, after the status column:** items 2 and 3.
They are independent of each other and of everything else, so they can run in
parallel today; item 1 shipped and item 6b is closed. **Item 7 is the only fenced
work on this plan and it is batched deliberately** — see Track D. Item 4's
remaining half (the limit-wins tiebreaker) still waits on item 2.

Two notes on the dependencies, because both were initially overstated:

- **Item 4 is blocked on A2 only, not on A1.** None of step 3's four fixes
  mentions `probe`. Since the whole sequencing argument is "edit that paragraph
  once," this matters: step 3 can land the moment `transitions` exists. If A1
  happens to land first, name it in the same edit rather than making a third
  pass at the same fifteen lines.
- **Batching (item 7) buys three saved cascades and creates a critical path it
  should name.** The viewer — the item with the most external demo value — now
  sits behind three unrelated kit changes. Keep the option open explicitly: **if
  the viewer becomes time-sensitive, pull C1's single line out and pay one extra
  cascade.** The seam factoring is precisely what makes that escape cheap, which
  is an argument for the factoring rather than against the batching. *Corrected
  in Track D: that escape is an 8-file change, not one line. Still right, but
  choose it knowingly.*

**Owner's-call 0 is resolved in Track C's favour** (2026-07-25), so this is a
standing argument rather than a conditional one: the camera bake is the cheapest
Phase 4 spike, and de-risking the owner's stated priority outranks a routing
edit, which is a live reason to move items 8-9 ahead of 4-6.

*Struck 2026-07-30: this paragraph previously announced the resolution and then
restated the same claim in its superseded `if Track C is admitted…` form, ending
"the order above assumes the fence holds" — a fence that had already been
amended. Annotating a superseded sentence leaves two readings; striking it leaves
one.*

---

### A1. `build.js probe <scene> <t> '<expr>'`

`method.md` names "two things that must touch: measure the contact, do not infer
it" as its most repeated authoring bug and gives a `page.evaluate` + `Box3`
idiom. `instruments.md` independently records the same defect class recurring
**five times**. It was then skipped for an entire 60s film with four staged
setups — not from disagreement, but because hand-writing a Playwright harness
costs more than rendering a frame and squinting.

Ship a small eval prelude so the common measurements are one-liners (`bb(o)` →
`new THREE.Box3().setFromObject(o)`, `proj(v)` → NDC). Pair it with a worked list
in `method.md`: contact separation, reach, clearance from the camera-subject
line, foot-plant drift.

**State this as what it is: a reversal of a recorded decision, not a new
proposal.** The ancestor was bracketed (boundary/interior 1.0001 vs 0.0531,
spread 1.003x vs 72.7x) and then **deliberately declined** on earn-in grounds —
*"four films hit it and none was blocked"* — and dropped entirely in the
migration. Reviving it by simply feeling strongly about it would make every
declined item revivable the same way, which destroys the deferred list's value.

So the argument has to be an amendment to the earn-in rule itself:

> **Earn-in's trigger is "a film was blocked." That trigger cannot fire for a
> failure mode whose signature is *not blocked, reliably wrong*.** Six films hit
> the contact class; none was blocked; the sixth published a false claim as a
> direct consequence. For a human author the rule held, because doing the
> expensive thing informally (eyeball the render) is cheap and usually adequate.
> For an agent author it inverts: "not blocked" and "not done" are the same
> outcome, because the agent substitutes the cheap wrong method silently.
>
> **Amendment: earn-in fires on "blocked" *or* on a third recorded instance of
> the same wrong answer** — recorded in
> [pattern-ledger.md](pattern-ledger.md), which exists because no trigger
> phrased as a count can fire without one. Everything else in the deferred list keeps its
> original trigger.

Note the amendment also re-opens the occlusion linter's ancestor (*"no register-
aware lint engine — revisit when a film is blocked"*) on the same logic. It stays
third regardless, on the merits in the deferred table — but it should be third
for its own reasons, not because a trigger that cannot fire is holding it.

---

## BLOCKING MERGE: the 2026-07-31 review of `--parity-fix` and the fixture path

A `/code-review high` over `main...HEAD` returned 15 findings, most reproduced
against live fixtures rather than argued. **Do not merge this branch until the
write-path group is fixed.** Several contradict claims written into comments on
this same branch, which is the class invariant 6 exists for.

> **UPDATE 0.16.50 — 12-15 are FIXED. ALL 15 FINDINGS ARE CLOSED and this
> section no longer blocks the merge.** Finding 12 was demonstrated rather than
> argued: neutralising the embed guard and running `bracket-commands.js` changed
> the tracked `scene.template.html`'s hash. 13 and 14 were shown by breaking
> `build.js` and watching the bracket stay green. 15's extraction produced its
> own control, `bracket-run-brackets.js`, whose mutation test then falsified a
> comment I had just written (see below).
>
> **What is still open is NOT a review finding:** ten of the corpus's twelve
> defects are unmeasured, `bracket-corpus.js` does not exist, `bracket-noise.js`
> false-reds on macOS, and `/extract-patterns` has never been run.
>
> **UPDATE 0.16.49 — findings 7, 8 and 9 are FIXED. Open: 12-15 only.**
> Two were worse than the review said. Finding 7's comment contradicted a commit
> on this branch AND overstated a second control (`REQUIRE_ENCODERS` is set by
> nothing). Finding 9's Map was missing **five more** top-level entries beyond
> the two the review caught — so the completeness claim is now enforced by
> `selfcheck.js` check 9 rather than by remembering, with no exemption list.
>
> **UPDATE 0.16.48 — findings 5 and 6 are FIXED too. Open: 7-9 and 12-15.**
> An unreadable argument is a hard refusal, `--parity-only` states how many
> files it scanned, and `selfcheck.js` now detects a stale installed hook — it
> **fired immediately on the machine that wrote it**, which had been gating
> commits on the pre-0.16.45 two-glob command. Finding 6's real content was
> never "the installer should overwrite"; it was "nothing detects the stale
> copy", so the fix is a check, not a flag.
>
> **UPDATE 0.16.47 — findings 1, 2, 3, 4, 10 and 11 are FIXED.** The write-path
> group no longer blocks; **5-9 and 12-15 remain open** and the merge is still
> blocked on them. Each fix carries a `bracket-parity.js` arm that was watched
> going **red first**, and each was then **mutation-tested** — the guard
> neutralised, the arm confirmed red again, all four caught. That second step is
> the one this branch keeps skipping: 10 exists precisely because arms were
> written that passed while proving nothing.
>
> **One residue is labelled rather than closed.** `accessSync` answers a
> permission question only, so a full disk or a lock can still throw at write
> time; no arm reaches that path. It is now loud (the run names the carriers that
> landed) but it is depth, not a control, and the comment says so.
>
> **Finding 11's HTML arm found nothing wrong** — propagation through the one
> structurally different regex was already correct. The arm is worth keeping
> anyway: it was in production use on the corpus with no control at all.

**The write-path group — `--parity-fix` can corrupt a corpus today.** It is
committed and pushed, so this is a live hazard, not a design note.
**All four fixed in 0.16.47; kept below as the record of what was wrong.**

1. **The final write loop is neither guarded nor atomic** (`smoke.js:983`).
   Validation checks readability and fence well-formedness and **never
   writability**, so a target that is read-only, full, or locked throws mid-loop
   and leaves the corpus half-propagated — *the exact state the design comment
   above it claims to prevent*. Reproduced with `chmod 444`. My bracket arm
   tested validation ORDERING and never write FAILURE.
2. **The malformed-target guard only inspects fences the SOURCE carries**
   (`smoke.js:965`), so a target broken in a fence the source lacks is written
   anyway, exit 0. **Live:** `scene2d.template.html` carries only CONTRACT and
   KERNEL, so `--parity-fix --from` it validates 2 of 7 fences while writing to <!--count-mention-->
   all nine carriers. Directly contradicts the stated non-negotiable.
3. **`--parity-fix` silently overrides `--parity-only`** (`smoke.js:929`) —
   `parityOnly` is computed and never consulted, so a read-only invocation that
   also carries `--parity-fix` writes and exits 0 without running the check.
   `--parity-only` is what `static.yml` and the installed pre-commit hook run.
4. **`--from` is consumed even without `--parity-fix`** (`smoke.js:893`), so it
   swallows the next filename out of a read-only scan. Reproduced: two genuinely
   drifted files scanned as one, reported green.

**The silent-coverage-loss group, newly reachable because of my own change:**

5. **Unreadable scene arguments are swallowed** (`smoke.js:1023`, `catch (e) {}`).
   An unmatched glob passes through as a literal, scans nothing, prints
   `parity/integrity: ok`. I added a **third** glob (`fixtures/defect-corpus/*.html`)
   to `static.yml` and the hook today — rename or move that directory and CI and
   every installed hook check one directory less and stay green forever.
6. **`install-hooks.sh` will not overwrite a differing hook without `--force`**,
   so every machine that installed the hook before today still runs the
   8-carrier command and nothing detects the stale copy.

**Claims I wrote that are false:**

7. **`bracket-commands.js:34-39` asserts a CI ffmpeg install that does not
   exist** and contradicts commit `444a649` on this branch, which declined it. A
   load-bearing comment asserting a control that is not there.
8. **`fixtures/defect-corpus/README.md:59` claims `gate.yml` coverage the corpus
   does not have** — and contradicts itself five lines later at :65.
9. **`CLAUDE.md`'s Map omits both directories this branch adds**
   (`fixtures/defect-corpus/`, `.claude/skills/extract-patterns/`) despite
   stating it covers everything outside `docs/`; and invariant 2's verify command
   still omits the ninth carrier, so two tracked docs prescribe different
   commands for the same check.

**Bracket weaknesses — the controls do not control what they claim:**

10. **Every `FIX_ARM` asserts an exit code only** (`bracket-parity.js:159`); the
    refusal message is captured and discarded, so *any* non-zero exit satisfies
    all four refusal arms. The read-half arms do check stdout. This is the same
    failure mutation testing already caught once in this file.
11. **No arm exercises multi-fence propagation or the HTML fence**
    (`bracket-parity.js:108`). The `<!-- ==== HTML-START ==== -->` branch is the
    only structurally different regex and is **never run by the bracket**, while
    being in production use — the corpus's HTML fence was brought current by it.
12. **`bracket-commands.js:114` runs `build.js` against the tracked
    `scene.template.html` in place.** If the guard it tests regresses, the
    bracket inflates a shipped source by ~1 MB — the documented damage that
    "reached `git add` once", and the identical hazard `static.yml:73-75` records
    being removed from another bracket. Copy it into the temp workspace.
13. **The `all` row's artifact assertion is satisfied by the `video` row's
    leftover mp4** (`bracket-commands.js:102`), so it cannot detect `all`
    producing nothing.
14. **`expect.stdout: ''` is never evaluated** (`bracket-commands.js:92`) — a
    truthiness test where its sibling correctly uses `!== undefined`.

**Design duplication:** 15. the `bash -e` loop fix is copy-pasted verbatim into
both workflows with ~10 lines of duplicated prose, rather than extracted to one
`scripts/run-brackets.sh <glob>` both call — fixed at two call sites instead of
once underneath, which is how the `!cancelled()` defect reappeared one level down.

**Order to fix:** 1-4 first (they are one interacting group in the write path,
and the tool is already pushed), then 10-11 so the bracket can actually hold
them, then 5-6, then the false claims 7-9, then the rest. **Do not fix these at
the end of a long session** — the review found them precisely because that is
when they were written.

**Done in 0.16.47: 1-4, and 10-11 with them rather than after.** Splitting them
was not possible in the stated order — writing new arms for 1-4 under 10's
weakness would have meant knowingly building four more arms that any non-zero
exit satisfies.

**Done in 0.16.48: 5-6.** Finding 6 turned out to have a live instance rather
than a hypothetical one, and the check found it on the first run.

**Done in 0.16.49: 7-9.** Verified against the tree before rewriting, which is
how two of the three turned out worse than reported.

**Done in 0.16.50: 12-15. The review is fully dispositioned — 15 of 15 fixed,
none deferred, none argued away.**

**The pattern across all fifteen, worth more than any individual fix.** Nine of
them were controls or claims about controls, not product defects: brackets that
could not fail, assertions never evaluated, comments asserting guards that were
not there. Three separate times a fix's own mutation test falsified something
written minutes earlier — the `says` regex that could not cross a newline, the
`set -e` comment naming the wrong guard, the Map audit that found five more
misses than the review did. **Writing the check is not the measurement; running
the check against a deliberately broken version is.** That step caught something
in three of the five sessions' worth of work here, and it costs minutes.
