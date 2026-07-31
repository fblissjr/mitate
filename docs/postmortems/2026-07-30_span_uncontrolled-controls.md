---
mode: span
scope: uncontrolled-controls
date: 2026-07-30
range: e530631..e7b5a34
summary: The 2026-07-29 postmortem's finding — that this repo's instruments were strong and its instruments-on-instruments did not exist — recurred within one day in three fresh places, none of which the previous fix touched. The class is not "a check was missing"; it is that a control, once written, is the artifact nobody re-examines.
artifacts:
  - scripts/selfcheck.js
  - scripts/bracket-selfcheck.js
  - scripts/bracket-stage-films.js
  - .claude/agents/doc-claim-auditor.md
  - .claude/skills/audit-claims/SKILL.md
  - .github/workflows/static.yml
  - docs/restructure-2026-07.md
---

# The controls were the least-checked artifacts in the repo

**Verdict: the previous postmortem named the class and the class recurred anyway,
because the fix was applied to the instances rather than to the position.**

[2026-07-29](2026-07-29_span_instrument-hardening.md) concluded that the repo's
instruments were strong and its *instruments-on-instruments* did not exist, and
hardened the four scene brackets in response. Within a day, three unrelated
places failed the same way. None of them was a scene bracket, which is why the
previous pass did not reach them.

## The three recurrences

**1. The control over the claim-checker had never run.**
`scripts/bracket-selfcheck.js` was written to bracket `selfcheck.js` — the file
that verifies every claim in this repo. It was executed by no automated path:
`gate.yml` globs `templates/bracket-*.js`, `static.yml` ran no brackets at all,
and the pre-commit hook runs the self-check and fence parity. It passed by hand
once and then sat inert.

Worse, **check 6 is the census that exists to notice exactly this**, and it also
read `templates/` only — reporting 4 brackets while 5 existed. The instrument for
detecting uncontrolled checks was blind in the same direction as the gap it was
meant to find.

*Fixed:* census reads both directories (reports 6), `static.yml` gained a globbed
brackets step, `gate.yml`'s comment states that its glob is directory-scoped on
purpose and says where the others run. That comment had also said "all three
brackets" while globbing four.

**2. The agent briefings taught working capabilities as broken.**
`.claude/agents/doc-claim-auditor.md` listed five drift instances in the present
tense as its priming context. **Four had since been fixed**: `focus` (both 3D
templates wire `STYLE.dof` → `THREE.dof` with `uFocus` driven from `shotFocus`),
`aspect` (`shoot.js` reads `window.FRAME.aspect`), `whip`, and `h`. The fifth
cites a reference that does not exist here. An auditor dispatched at
`film-language.md` would have returned `focus` as dead.

`/audit-claims` separately asserted that `build.js probe` "is not built" — three
versions after it shipped, and it is what backs the site's *"Every contact is
probe-measured"* claim, so every run carried a standing false positive against a
working path. `model-delegation.md` named two agents that have never existed here.

**This is the sharpest instance because these files are priors.** An agent reads
them before it reads any code, so one stale line makes every downstream verdict
wrong — a defect that manufactures further defects.

*Structural cause:* `.claude/*` carries no freshness marker **by design** — those
files are behaviour definitions, not documentation — and `selfcheck.js` derives
its set from files that do carry one. The exemption is correct. The hole is that
*not documentation* was silently treated as *not checked*.

**3. The prime directive's one exception was unenforced.**
`CLAUDE.md` admits `build.js probe` past "tooling talks only to the window
contract" on three conditions, and calls them *"all currently true and all
checkable."* Nothing checked them for three releases. All three still held when
measured — but nothing would have said so if they had stopped.

*Fixed:* `selfcheck.js` check 6f enforces the two mechanical conditions, with two
bracket arms.

## What the three have in common

Not "someone forgot a check." In every case **a control existed and was correct
when written**, and nothing re-examined it afterwards:

| artifact | correct when written | what made it stale |
|---|---|---|
| `bracket-selfcheck.js` | yes | lived in the directory the wrong workflow globbed |
| `doc-claim-auditor`'s priors | yes | the code it described got fixed |
| the probe exception | yes | never had teeth; conditions could lapse silently |

A check verifies the thing it points at. **Nothing points at the check.** The
2026-07-29 fix added controls; it did not add a position from which controls are
themselves reviewed, so the next three went unexamined by construction.

## The false-accusation class hit twice more

`restructure-2026-07.md` records five prior instances of a checker that cannot
distinguish *carrying* a thing from *describing* it. Two more landed today:

- The citation check flagged `bracket-selfcheck.js`, because a literal bad
  citation in a control's source **is** the defect it injects. Fixtures are now
  assembled at runtime.
- Check 6f's first run reported the probe exception had already lapsed. It had
  not: `build.js` carries a comment reading *"a step-halving probe("* as prose,
  and the call-site counter read it as a caller. Comments are stripped now.

Both surfaced **because the bracket arm was written first and observed to go
MISSED**, then the check was run against the real tree. Neither would have been
caught by reading.

## What was verified rather than asserted

- Regex tightening on the citation check: **occurrence-neutral, 29 → 29.** An
  earlier form excluded `/` from its lookbehind and silently dropped four real
  citations.
- Dropping `site/films/gearbox-neon.html` from the parity set loses no coverage:
  the sed'd line sits at index 701, outside all five fences.
- `build.js` is **971 lines and 13 verbs**, not the 827/18 written into the plan.
- Fence duplication: **4,611 lines held byte-identical by hand** across 8 carriers.

## Annotations

*(none yet — later corrections belong here, dated, rather than rewriting the
above.)*
