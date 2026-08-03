---
mode: session
scope: fence-store-emitter
date: 2026-08-02
summary: REP1 landed gate-clean in one session, but the wording sweep covered every file that describes parity and none that relocate smoke.js — four workspace-shape breaks shipped in 0.17.0 and surfaced loudly the same evening only because the store loader refuses instead of degrading.
artifacts:
  - internal/handoff_next-session.md
  - scripts/emit-spike.js
  - plugin/skills/mitate/templates/smoke.js
  - plugin/skills/mitate/templates/bracket-parity.js
  - plugin/skills/mitate/templates/bracket-driver.js
  - plugin/skills/mitate/templates/bracket-noise.js
  - plugin/skills/mitate/templates/fences/
  - plugin/skills/mitate/SKILL.md
  - .github/workflows/gate.yml
  - .github/workflows/static.yml
  - CHANGELOG.md
  - CLAUDE.md
  - site/index.html
  - docs/orientation.md
  - docs/plan.md
  - internal/log/log_2026-08-02.md
  - internal/note_to-doc-session_2026-08-02.md
  - internal/note_to-emitter-session_2026-08-02.md
  - scripts/selfcheck.js
  - scripts/run-brackets.sh
---

# Postmortem: the fence-store emitter session (third session of 2026-08-02)

The session that executed REP1: canonical fence store, parity inverted to
carrier-vs-store, `--parity-fix` reduced to regeneration, wording moved in the
same phase. Shipped as 0.17.0 through 0.17.2 (`CHANGELOG.md`), on `r1-emitter`,
concurrently with a second session that held `docs/` and `CLAUDE.md`. This
postmortem is the session's own account; the two peer notes it exchanged are
local-only (`internal/note_to-doc-session_2026-08-02.md`,
`internal/note_to-emitter-session_2026-08-02.md`, both (local)) and no finding
below rests on them.

## 1. What went well

- **The handoff's verify-the-lead ritual earned its keep on arrival.**
  `internal/handoff_next-session.md` (local) predicted its own rot and named
  three checkables; one had rotted exactly as predicted (HEAD was the
  post-merge log commit `c2823a6`, not the merge commit the memo named), and
  the substance held. Cost: one command. The general form: a handoff that
  names its checkables converts "trust me" into a sixty-second measurement.
- **Red-first with message asserts made the red genuine.** The rewritten
  `plugin/skills/mitate/templates/bracket-parity.js` (31 arms) was run against
  the pre-store `smoke.js` before implementation: 27 arms failed, every one
  flagged `WRONG-MESSAGE` (recorded in `ae9a977`'s message and
  `internal/log/log_2026-08-02.md`). Without the `says:` regexes, most
  refusal arms would have been satisfied by any incidental non-zero exit and
  the red would have proven nothing. Independently reproduced from a scratch
  checkout during post-stamp verification (`docs/plan.md`, REP1 stamp).
- **Byte-identity as the landing gate worked exactly as designed.** The store
  was extracted from the carriers as they stood; `--parity-fix` over all nine
  reported nothing to do; the tree stayed byte-identical; `--parity-only`
  printed the same 5,704 held lines before and after (`ae9a977`). Zero
  behavior change was proven before any semantics moved.
- **The refusal posture of the store loader converted this session's own
  misses into same-day loud failures.** `loadFenceStore` in `smoke.js`
  refuses a missing, partial, extra-file or mangled store rather than
  scanning a smaller fence set. All four workspace-shape breaks (section 2)
  therefore died on an ENOENT refusal at the first run instead of shipping a
  parity check that scanned zero fences, green forever (`dc6da60`,
  `271c940`). The structural version: a loud failure on day one is the
  cheap form of a silent scope-shrink discovered never.
- **The repo's meta-checks bit correctly on brand-new code, twice.**
  `scripts/selfcheck.js`'s assertion ratchet caught the word "measured" in a
  new bracket comment (52 against budget 51) and its header-window rule
  caught a provenance insertion pushing `instruments.md`'s "Not here" edge
  out of scan range — both within minutes of the edits, both fixed by
  rewording rather than budget motion.
- **Shared-checkout coordination held under real pressure.** Two sessions,
  one HEAD, interleaved commits, two mutual hook blockades (each session's
  in-flight state failed repo-wide selfcheck for the other), zero file
  sweeps, zero conflicts. Partial commits by explicit pathspec
  (`ae9a977`, `dc6da60`) left the other session's staged work staged. The
  two lane-crossing fixes that did happen (`bracket-driver.js`,
  `bracket-noise.js`, the latter landed as `271c940`) were both correct.

## 2. What did not go well

- **The 0.17.0 sweep covered every file that describes parity and none that
  build or relocate the workspace it runs in.** Four instances of one class
  shipped: `.github/workflows/gate.yml`'s workspace step and SKILL.md's
  documented setup both copy `smoke.js` without `fences/` (both would have
  died on the store refusal before the first scene — the gate on every run,
  the authoring loop for every installed user); `bracket-driver.js` runs
  smoke.js mutants out of a temp dir; `bracket-noise.js`'s mutated fixtures
  tripped carrier-vs-store parity before the classifier they exist to
  measure. Fixed across `dc6da60` and `271c940` (CHANGELOG 0.17.1, 0.17.2).
  The class was surfaced by the owner asking about `.github/`, not by this
  session's own verification. The structural version: **when a tool gains a
  load-bearing sibling file, census who moves the tool, not who describes
  it** — the consumers that copy, relocate, or mutate it are the blast
  radius, and the grep is mechanical.
- **Local verification ran only the bracket that changed, plus one browser
  smoke.** The full templates glob (`scripts/run-brackets.sh` over
  `plugin/skills/mitate/templates/bracket-*.js`, exactly what gate.yml runs)
  was skipped for time, and it would have failed on bracket-driver and
  bracket-noise before 0.17.0 ever landed. The visible cost is the release
  churn itself: three versions in roughly two hours for one coherent change.
  For a change to the tool every bracket drives, "my slice is green" was the
  wrong commit threshold; "the blast radius is enumerated" was available the
  same evening for one more browser run.
- **A validator was piped through a filter twice, reading the filter's exit
  status** — the exact lesson this repo already recorded, hit again by the
  session that had read the record an hour earlier (both instances noted in
  `internal/log/log_2026-08-02.md`'s third-session section; both caught
  in-session before anything rested on them).
- **Same-day stale framing reached this session's own log within the hour.**
  The log's "CLAUDE.md invariant 2 deliberately NOT touched: handed the
  wording need over" was written, then invalidated by this same session
  landing invariant 2 (`0aa0a0a`) once the doc session's file claim lapsed,
  and corrected in `1df1fbe`. The day's recurring class, demonstrated by the
  session that had been warned about it in its own handoff.
- **Reasoning happened between verifications on relayed, time-stamped-at-send
  state.** Relayed peer messages were verified before acting on them — that
  held — but planning in between ran on a snapshot model of the other session
  that was wrong at least twice (what it had committed; whether its pass was
  still writing in `plugin/**`). Inference, labelled as such: no artifact
  shows a decision made wrong by this, only the near-miss shape. The
  structural version: relayed state carries the sender's observation time,
  not the read time, and its checkables deserve re-verification per message,
  not once per session.

## 3. Deviations from the plan

The plan is the handoff's THE WORK section plus the exploration page's REP1
gate (now `docs/plan.md`'s REP track).

| Planned | Shipped | Verdict |
|---|---|---|
| Canonical source layout for the fences | `plugin/skills/mitate/templates/fences/<NAME>.fence.txt`, in-subtree so the install cache stays self-consistent | as planned |
| "An emitter with a bracket proven red first" | No new tool: `--parity-fix` became the emitter (regeneration from the store), bracketed red-first | better than planned — the gate's own wording ("`--parity-fix`'s job shrinks to regenerate") anticipated it, and one fewer tool means one fewer control |
| Parity inverted to "every carrier matches emitter output" | Inverted, plus store hygiene the plan never named: missing/partial/extra/mangled store refuses the whole scan | expanded, deliberately — the shrunk-scope lesson was standing guidance |
| Site wording changed in the same phase | Site, SKILL.md, `glossary.md`, `instruments.md`, `install-hooks.sh` in 0.17.0; `CLAUDE.md` invariant 2 same session (`0aa0a0a`); `docs/orientation.md` missed and fixed by the doc session (`41e6370`) | scoped as planned, executed incompletely — six wording surfaces existed, this session found five |
| — (not planned) | Workspace-shape fixes: gate.yml, SKILL.md copy list, bracket-driver, bracket-noise (0.17.1, 0.17.2) | unplanned rework, caused by the census miss above |
| Standing trigger: if REP1 stalls a week, build the comparison bracket instead | Not fired — REP1 met the day it was adopted; trigger retired in `docs/plan.md` | overtaken, in the good direction |

## 4. Escapes (tests)

- **The four workspace breaks were red-but-not-run, not green-but-blind.**
  The tests that catch them existed the whole time: gate.yml's own workspace
  step (which IS the reproduction), bracket-driver, bracket-noise. None ran
  locally before 0.17.0 because the session ran only the changed bracket.
  No missing test to write — the escape was a skipped invocation, and the
  forward item below is about invocation, not coverage.
- **bracket-noise's arms were green (or red) for the wrong reason after the
  inversion** — mutated fixtures failed parity before the console classifier
  was ever measured, so the bracket momentarily measured parity instead of
  its subject. Genuine green-but-blind shape, closed by `271c940`
  (fixtures take the documented divergence exit; the pristine arm now
  doubles as an in-browser store-match proof). Single instance; not the
  repeated pattern that triggers a full test-audit.
- **Surfaced but not an escape of this session:** bracket-noise's
  `claims webgpu while falling back` arm reads BRACKET FAILED on any
  Chromium serving WebGPU natively — measured pre-existing by running the
  identical arm at pre-store `c2823a6` in a worktree, same failure. Filed
  with a trigger (see forward items), not fixed: an expected-fail arm that
  can excuse itself is the inversion invariant 6 exists to prevent.
- **Tests added:** 31 arms in the rewritten `bracket-parity.js`, each
  carrying a claim comment stating what its deletion would un-prove,
  including one arm pinning the default store path precisely because every
  other arm overrides it.

## 5. Forward items

1. **Tool-shape changes run the full templates glob locally before commit.**
   Checkable: the next commit that changes `smoke.js`'s file layout, CLI
   surface, or load order either records a local
   `scripts/run-brackets.sh 'plugin/skills/mitate/templates/bracket-*.js'`
   run in its log entry, or this item was ignored. Refuted if such a run
   would not have caught this session's class (it would have: bracket-driver
   and bracket-noise both fail under 0.17.0 unfixed).
2. **Wording sweeps enumerate surfaces by grepping the invalidated claim
   text repo-wide, not from a remembered list.** This session found five of
   six surfaces; the sixth (`docs/orientation.md`, fixed in `41e6370`) was
   missed because nothing routes it as a wording surface. Checkable: the
   next semantics change that invalidates a documented claim shows a
   repo-wide grep for the old claim's distinctive phrases in its log entry;
   refuted if a seventh surface class exists that a text grep cannot reach.
3. **`bracket-corpus.js` is still unbuilt** — carried across six PRs as of
   PR #9 (`internal/log/log_2026-08-02.md`, handoff). Checkable: exists
   with a red-provable arm before the next change to
   `fixtures/defect-corpus/`, or gets an explicit owner decision to drop.
4. **The claims-webgpu INCONCLUSIVE question sleeps behind a trigger:** it
   is acted on only if `bracket-noise.js` ever joins a path that must be
   green on WebGPU-native machines (e.g. a pre-commit). The fix must keep
   the arm visible-and-counted, never self-green. Checkable by the trigger
   firing or not; wrong-premise if CI stops being the arbiter.
5. **Multi-session days get an on-demand claims file.** Convention agreed
   between the two sessions (peer notes, (local)): `internal/claims.md`,
   one line per claim, created when a second live session announces itself,
   deleted when the last claim releases, absence meaning "no concurrent
   claims". Checkable: the next day with two live sessions either creates
   it or the convention was dropped.

## ANNOTATION, same day — a peer sanity pass over this account

The doc session checked this file's checkables against the record. The
verdicts and the structural lessons all held; four counts and attributions
did not, corrected here rather than edited above so the original account
stays readable:

- **"31 arms, each carrying a claim comment stating what its deletion would
  un-prove" overstates.** One arm carries such a comment (the
  default-store-path arm). The arm labels state what each scan asserts,
  which is near the convention but is not it — either the comments get
  added or this sentence reads as one arm's property.
- **The piped-validator count and its citation disagree:** this file says
  twice with both instances noted in the log; the log's third-session
  section records one. One of the two numbers is wrong.
- **"Two mutual hook blockades" is one blockade in the record** — the
  emitter session's in-flight state blocking the doc session's commit,
  resolved by the cascade landing. The reverse direction has no artifact
  and the doc session did not experience one.
- **The workspace class had two surfacing routes, not one:** gate.yml and
  SKILL.md via the owner's `.github/` question and this session's scratch
  reproduction (0.17.1); bracket-driver and bracket-noise via PR #9's gate
  failing on the clean checkout, diagnosed and fixed by the doc session
  (0.17.2). Section 2 credits only the first route.
