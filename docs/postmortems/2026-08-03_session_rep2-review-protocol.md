---
mode: session
scope: rep2-review-protocol
date: 2026-08-03
summary: The four-pass review protocol replicated the recorded yield ordering on its second independent sample — adversarial construction found all three behavioral defects, reading found none — while the session's own summary prose produced five of the day's seven drift findings, which is what got the cite-or-label rule wired to the edit moment the same evening.
artifacts:
  - CHANGELOG.md
  - docs/plan.md
  - docs/working-plan.md
  - docs/README.md
  - docs/source-of-truth.md
  - docs/representation-exploration.html
  - docs/postmortems/2026-08-01_session_what-caught-the-defects.md
  - docs/postmortems/2026-08-02_session_audit-of-one-days-output.md
  - plugin/skills/mitate/templates/bracket-check-kit.js
  - plugin/skills/mitate/templates/bracket-parity.js
  - plugin/skills/mitate/templates/bracket-commands.js
  - plugin/skills/mitate/templates/build.js
  - plugin/skills/mitate/templates/smoke.js
  - plugin/skills/mitate/templates/shoot.js
  - plugin/skills/mitate/templates/fences/
  - plugin/skills/mitate/SKILL.md
  - plugin/skills/mitate/references/instruments.md
  - scripts/claims-reminder.sh
  - scripts/bracket-claims-reminder.js
  - .claude/settings.json
  - .claude/skills/verify-written-claims/SKILL.md
  - site/index.html
  - internal/log/log_2026-08-03.md
  - internal/handoff_next-session.md
  - snapshots/2026-08-02/history.md
---

# Postmortem: the REP2 day, and what the review of it measured

One session, morning to evening: the handoff's queue cleared (0.17.3 in
`1232664`, the spike retired in `9492a96`), REP2 built and merged as 0.18.0
(`6f656c1` through `e5d73e9`), a four-pass review run against it before
merge, and the review's own findings about summary prose converted into a
shipped mechanism the same evening (`4cee16e`). The artifact trail is
unusually complete because most claims below were re-derived while writing
this file — which is itself the day's last finding, practiced.

One in-vivo note: this file's first draft listed
`bracket-claims-reminder.js` under `templates/` in its artifacts frontmatter
— a path written from memory, hours after creating the file in `scripts/`.
Caught and removed while assembling the list, by checking each path instead
of recalling it: the derive-at-write rule catching this postmortem's own
frontmatter, the day's thesis in one line.

## 1. What went well

- **The review protocol's yield ordering replicated on a second independent
  sample.** `2026-08-01_session_what-caught-the-defects.md` predicted
  diff-reading ≈ 0; the 2026-08-02 audit postmortem measured the full
  ordering. Today, run as a designed protocol on PR #10: my diff pass found
  one nit (`execKit`'s prototype-chain `in`), the claim auditors found the
  wording drifts, and the adversarial constructor found **all three
  behavioral defects** (the STYLE-stub false green, the unresolved-fraction
  false ERROR, the dot-assignment stale read — mechanisms and exits in
  `docs/working-plan.md`'s 2026-08-03 section). Structural version: **an
  instrument ordering measured twice is a protocol, not an observation.**
- **Red-first held through every layer, including the meta-layer.** REP2's
  gate bracket (`bracket-check-kit.js`) was recorded red on all four
  divergence cases before any fix, measured again at midpoint (kit hardening
  alone: driven halves green, check halves still red), green after the
  rewrite — and the same discipline applied to the day's smallest artifact:
  `bracket-claims-reminder.js` was recorded red against a dedup-stripped
  mutant before the hook it controls was trusted. The commit-message red
  claims were then *re-verified from a clean worktree* during review, and
  reproduced exactly.
- **The emitter paid for itself on first real use.** The kit hardening
  (null-prototype `BEAT`, empty-`SHOTS` guard, empty-subject refusal in
  `plugin/skills/mitate/templates/fences/`) propagated to all 9 carriers by
  one `--parity-fix` run; the diff was read and was exactly the fence edits;
  parity held at the derived 5,796 lines.
- **Verification read receipts, not badges.** The PR gate's green was
  checked in its logs: `bracket-check-kit` ran 5/5 in CI in ~10s (the
  `shoot.js` fail-fast working), and `bracket-noise` passed all 4 arms in
  the fallback environment — the claims-webgpu arm's CI-arbitration story
  (CHANGELOG 0.17.2) confirmed rather than assumed.
- **Report-then-repair held under temptation.** The three behavioral
  findings were deliberately kept out of the merge and queued as 0.18.1;
  the wording fixes went in as their own reviewed commit (`38e3773`). No
  repeat of the `2c5742f` shape.
- **A reviewed review.** The targeted audit of the day's own doc commit
  found two drifts in hour-old prose before push (`c4f1a16`'s amend): the
  site's "every defect it knows" overclaim, and the `tableValue` trigger
  that had already fired. The second changed a queue item's status, not
  just its wording.

## 2. What did not go well

- **The session's summary prose was the least reliable artifact it
  produced.** Seven drift findings landed on this session's own writing:
  the 0.18.0 CHANGELOG entry contradicting its own next paragraph, the
  one-way-strictness list reading as exhaustive (in three files), the
  exploration page self-contradicting two screens apart, the site
  overclaim, and the "first two" miscount — the last written an hour after
  citing the never-hand-write-counts rule, by the session that had verified
  the true count's components earlier the same day. Structural version:
  **compression is where errors enter; the work being fresh is the signal
  to check, not the excuse not to.** This finding is what `4cee16e` ships
  against.
- **The piped-validator trap fired twice in one day, on the session that
  had read its write-up.** Morning: the full bracket glob piped through
  `tail` with a `PIPESTATUS` guard that is wrong under zsh (caught before
  the run finished, relaunched). Evening: `selfcheck | grep` with the exit
  echoed from grep (caught one call later, re-run direct). Both recorded in
  `internal/log/log_2026-08-03.md`. Same binding-failure shape as the
  miscount: the rule was in context and did not fire at the keystroke.
- **A stale reference shipped for the whole gap between REP2 and its
  audit.** `plugin/skills/mitate/references/instruments.md` still said
  `SIZES` is cross-referenced "in the scene's source text" after `6f656c1`
  made it come from the store — found by the post-merge auditor, queued for
  0.18.1 rather than fixed in-place (it is plugin content). The wording
  sweep at ship time covered SKILL.md and missed the reference that
  describes the verb most directly.

## 3. Deviations from the plan

The plan is `internal/handoff_next-session.md`'s THE WORK section plus the
owner's in-session asks.

| Planned | Shipped | Verdict |
|---|---|---|
| Three smoke.js findings as one red-first 0.17.3 cascade | Shipped as specified; the duplicate-`--store` arm exited 0 against old code, confirming the finding before fixing it (`1232664`) | as planned |
| Retire `scripts/emit-spike.js` via the retire sweep | Swept, retired, annotated in three live docs; historical records deliberately left with the keep-list logged (`9492a96`) | as planned |
| REP2: `check` reads the canonical store; thirteen findings close as a class; decision point 6 decided here | Shipped as 0.18.0 with the gate held by a standing control rather than a stamp; decision point 6 resolved as plain JS with merge review named as ratification (`docs/plan.md`, REP2 stamp) | as planned, with the gate strengthened |
| — (not planned) | Four-pass review protocol with two auditors, an adversarial constructor and a clean-worktree red reproduction; 3 behavioral + wording findings, all dispositioned | unplanned, owner-directed mid-day; produced the day's most durable output |
| — (not planned) | The cite-or-label rule wired to its moment: `scripts/claims-reminder.sh` + `.claude/settings.json` + `/verify-written-claims` + a 9-arm bracket, red-first (`4cee16e`) | unplanned; grew out of the review's own findings and the context-binding research |
| — (not planned) | The review's design conclusions filed with triggers (`docs/working-plan.md`, 2026-08-03 section), `docs/README.md` gaining its jump-nav and a current work-next row, the site's landed-vs-next sentence corrected (`c4f1a16`, amended after a targeted audit of its own hour-old prose found two drifts) | unplanned, owner-directed |
| `bracket-corpus.js` before the next defect-corpus change, or an owner decision to drop | **Not done.** The corpus regenerated this session (`--parity-fix` touched `fixtures/defect-corpus/after-hours.html` in `6f656c1`) with no corpus bracket existing — arguably the trigger firing on a technicality (fence propagation, not a corpus-content change). Carried across seven PRs now (six as of PR #9 per the handoff, plus #10) | carried again; the trigger's edge case should be ruled on rather than re-carried |

## 4. Escapes (tests)

- **The three behavioral defects were unreachable by the existing suites,
  and that is the finding, not an excuse.** All three pre-existed REP2
  (verified against `9492a96` during review); no bracket arm exercised an
  imperative STYLE with `match:true`, an unresolved anchor fraction, or a
  dot-assigned table. They were found only when an agent was told to
  *construct* disagreements. Each becomes an arm in 0.18.1, which is the
  only exit from this class that lasts.
- **The frontmatter of this very file carried an escape** (see the note at
  top): a path written from memory into the artifacts list, caught by
  derivation while writing. The check that should catch it mechanically
  does not exist — the postmortem filing rule says artifacts must match
  citations, and nothing verifies it.
- **Tests added today, with their claims:** `bracket-check-kit.js` (5 arms;
  header states the identity claim, per-arm comments state what each pins),
  two `bracket-parity.js` arms and one tightened pair (0.17.3, each with a
  deletion-claim comment), four `bracket-commands.js` expectation updates
  (subject/focus/rung moved to the kit's quoted throws, each observed red
  before its expectation moved; the DRIFT fixture gained `fences/` — the
  0.17.1 workspace class biting a bracket fixture), and
  `bracket-claims-reminder.js` (9 arms; the changelog-fires and dedup arms
  carry explicit deletion claims, the rest rationale comments — stated
  plainly here per the 2026-08-02 annotation's correction about
  overclaiming exactly this).

## 5. Forward items

1. **0.18.1 ships the review's queue red-first.** Checkable: the fraction
   exemption, dot-assignment detection and STYLE warning each land with a
   new arm recorded red against current `build.js`; `bracket-check-kit.js`
   gains a sixth arm pinning the STYLE case as a declared-coverage warn
   (honesty, not agreement — the stub cannot know the lens);
   `instruments.md`'s SIZES sentence and environment-mirror limit land in
   the same cascade. Refuted-if: the STYLE warn proves noisier than the
   union-rung precedent tolerates — then the narrowing (warn only when a
   shot declares `match` or `fov`) is the fix, not silence.
2. **The `tableValue` conversion gets a design note, not a fifth finding.**
   Its execute-don't-mirror trigger has already fired (`docs/working-plan.md`,
   corrected row). Checkable: a note lands choosing sandbox-prefix
   evaluation, contract export, or an explicit decline-with-reason, before
   any further false-verdict finding is filed against its reading model.
3. **The claims reminder carries its own retirement date.** Checkable on
   2026-08-24: count correction commits of the `38e3773`/`625ac32` shape
   since install; if the rate matches the three weeks prior, delete the
   hook per its own header rather than tuning it. *(Annotation,
   2026-08-04, pre-registered before the window closes: the comparison as
   first written was calendar-normalized, which deletes the control on
   quiet-window evidence that could not have shown it working — the same
   underpowered-zero flaw the muted-blocks checkpoint was amended for the
   same day. The rule is now corrections-per-opportunity with both
   classifiers frozen and a minimum exposure of 10 per window, below
   which the checkpoint extends rather than decides. The amended
   procedure's home is `scripts/claims-reminder.sh`'s header; source: the
   skills repo's second denominator memo, relayed by the owner.)*
4. **The cite-or-label rule carries its refutation test.** Checkable: of
   the next 20 corrected state-claim lines, record how many carried a
   citation when written; a third or more means the discriminator is wrong
   and `docs/source-of-truth.md`'s paragraph reverts (the test is written
   into the rule's home).
5. **Rule on the corpus-bracket trigger's edge case.** Checkable: the next
   change under `fixtures/defect-corpus/` either ships with
   `bracket-corpus.js`, or the owner's decision to drop it is recorded —
   and whether emitter-driven fence propagation counts as "a change to the
   corpus" gets decided rather than re-argued (this session treated it as
   not counting, without a ruling).
   *(Disposition, 2026-08-03 evening, owner: ruled and built. Propagation
   counted as the trigger firing; the coarse tier shipped as
   `bracket-corpus.js` (0.18.1) — with the design premise corrected by
   measurement first: the corpus PASSES smoke, its defects being
   composition-class, so the bracket pins usability plus the verified
   rows' signatures rather than expecting a gate failure. Recorded red
   against a healthy scene before being trusted. Row-by-row arms accrue
   as rows leave UNVERIFIED; row 8 waits on an encoder, stated in the
   bracket header. CLAUDE.md's corpus bullet and the corpus README were
   corrected in the same change — the "so a check that stops catching is
   noticed" framing was itself checkable prose that had never been
   checked, for three days.)*
6. **The fresh-session docs-only test stays live** (handoff, "one
   deliberately deferred review"): weeks from now, a session with no
   context builds a film from the docs alone; store-workflow confusion is
   the finding. Now also covers `/verify-written-claims` — a skill nobody
   has cold-run.

## ANNOTATION, 2026-08-03 (same evening) — outside peer review, four fixes landed

A reviewer session working on the skills marketplace repo read the reminder
apparatus end to end and returned four findings plus three sharpenings; the
hooks-doc claims among them were verified against the current official docs
before acting (the injection-defense sentence exists verbatim; PostCompact
exists; `session_id` persists across compaction and resume). What changed,
same evening, all under the re-run bracket (12 arms, green; the additions
follow the same red-provable design):

- **Forward item 3's retirement test was conflating two failure modes, and
  only one means delete.** The bracket verifies *emission*, not *delivery* —
  and the reminder's imperative phrasing was exactly the shape the hooks
  docs warn can trip injection defenses and bounce the text to the terminal.
  All four messages rewritten as factual statements (citations kept), and
  the ruling procedure now requires the disambiguation first: grep session
  transcripts for the message text absorbed-vs-surfaced; delivery failure
  means fix-and-restart-the-clock, not delete. The check is in the script
  header beside the trigger it protects.
- **Compaction biased the same measurement toward wrongful deletion**: a
  summarized-away reminder plus surviving dedup state left long sessions'
  second halves unguarded while their corrections counted against the
  mechanism. A PostCompact `--clear-session` mode now restores at most one
  fire per class, with its own bracket arm (fire, clear, fire again).
- **The classifier claimed NotebookEdit coverage it did not deliver**
  (`notebook_path` vs `file_path`) — dropped from the matcher and the
  script, with the reason at the site. Two bracket gaps closed: the
  sha-resolution arm now also covers all-digit sha prefixes (`1232664` is
  one), and each multi-path class pins a second path so accidental
  narrowing goes red somewhere.
- **The delivery-semantics claim in this file's own apparatus description
  was aspirational**: PreToolUse `additionalContext` lands beside the tool
  result, so the model reads it one half-step *after* the edit — in time to
  re-derive and amend, not to prevent the write. The script header now
  states the mechanism that exists, so the three-week evaluation judges
  that mechanism. (The in-vivo firings earlier today are consistent: each
  reminder arrived attached to its tool result.)

## ANNOTATION, 2026-08-03 (late) — the apparatus's uncovered surface, demonstrated same-day

A second peer round caught this session recommending a capability that does
not exist: `/dev-conventions:configure` was offered as able to mute the
plugin's SessionStart directive blocks per-repo, an operational claim
inferred from the skill's description line and never verified against its
hook (which selects blocks by project marker only — confirmed by reading it
after the peer's report; `internal/log/log_2026-08-03.md` carries the
account). The class extends finding 2's structural version to a surface no
mechanism reaches: **the reminder's classifier fires on file edits, so
claims made in conversation — recommendations included — are guarded by the
derive-at-write rule alone.** Cross-session peer review is currently the
only control that has ever caught one. Filed as the apparatus's disclosed
edge rather than a gap to wire, because a hook cannot read intentions.

## ANNOTATION, 2026-08-03 (night) — the corpus episode, and the day's thesis run forward for once

The corpus ruling (forward item 5's disposition) produced three findings
that belong to this postmortem's argument, not just its queue:

- **The central finding finally ran in the right direction.** Every drift
  specimen above shares one order: work done, prose written, prose
  corrected after. The corpus bracket inverted it — this session pitched
  the owner a "must still fail the gate" design in conversation, then ran
  one smoke command *before building*, and the measurement refuted the
  premise (`fixtures/defect-corpus/after-hours.html` passes clean; its
  defects are composition-class). The wrong artifact was never built.
  Derive-before-design is the same rule as derive-at-write, applied one
  step earlier, and this is its first recorded save. The conversation-
  surface caveat from the previous annotation still held on the way in:
  the smoke-detector pitch itself was an unverified conversational claim
  about the repo's own apparatus, one command from being checked.
- **Three days of tracked prose about the corpus's mechanism had never
  been checked.** "Kept broken so a check that stops catching is noticed"
  shipped with the corpus at 0.16.45 and was false the whole time — no
  check catches those defects. The same-day-stale class extends backward:
  founding-day framing is same-day prose that simply never got its same
  day. Corrected in `f2ad67b` (CLAUDE.md's corpus bullet, the corpus
  README) alongside the bracket that now pins what is actually true.
- **The apparatus policed its own installer twice more.** The rewritten
  changelog reminder fired on the 0.18.1 entry and was absorbed as
  context (the factual phrasing delivering as redesigned), and the
  assertion ratchet refused the corpus bracket's first commit — its
  header said "measured" without naming a control, 54 then 53 against
  budget 51, and the shipped wording is honest because the check rejected
  the adjective (recorded in `f2ad67b`'s message). At sign-out the same
  discipline caught the fresh handoff hand-writing three state values
  (version, bracket count, unpushed-commit count) that had all rotted
  within the hour — fixed by anchoring each to its deriving source
  (handoff is `(local)`; the class is this file's finding 1, still alive
  at day's end, still caught before publication).
