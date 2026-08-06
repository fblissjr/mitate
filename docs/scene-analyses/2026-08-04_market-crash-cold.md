# Scene analysis: the market-crash cold build (2026-08-04)

A dated record — it settles nothing and is never the tiebreaker, but it is
the **citable reconstruction** of what a zero-context, installed-plugin
session actually did, in what order, and why. Where the builder's own
postmortem and this record disagree about behavior, this record wins on
behavior (it is derived from the transcript); the postmortem still wins on
the film's technical findings.

**Method and evidence.** Built by a sonnet-5 session in an isolated
workspace with only the installed mitate plugin (0.19.3 — byte-identical to
this repo's tree at the time), no repo context, permission mode `auto`.
Evidence: the build session's raw transcript `(local)`, a local database
that indexes it `(local)`, the scene and its postmortems from that build
`(local)`, and the 0.19.3 install cache. Timeline reconstructed 2026-08-05
by an independent no-context subagent (the repo's runnable-on-work-you-
did-not-do extraction doctrine), then verified and routed by the analyzing
session. **Thinking blocks are stored empty in both stores** — every claim
here rests on narration text, tool calls and their results, and token
accounting; where that limit bites, it is said.

Headline numbers (derived from the transcript index's session and
tool-call rollups): prompt 19:32:08 → delivery 19:50:28, 96 tool
calls, 0 tool errors, 0 permission prompts, 93,262 output tokens, one
human interaction in the whole session (the postmortem-phase filing
question).

---

## The timeline

### Phase 0 — activation (19:32:06–19:32:47)

The prompt never names mitate. The session routed on the skill
description's own vocabulary ("explainer / simulation / animated" plus "no
characters"), announced *"This is exactly what the mitate skill is built
for"*, and invoked the Skill tool with a self-authored 600-char brief. It
absorbed the description's cost disclosures correctly — never promised
audio or interactivity, and the delivery caption leads with "silent, no
characters."

Then, in order and within 40 seconds: `ls` the empty workspace, **read
`method.md` in full** (1,054 lines), **read `bibles.md` in full**, copy
the 2D template + tools + `fences/` into the workspace, rename to
`crash.html`. It correctly skipped `bun add three` / `build.js vendor`,
narrating the reason ("scene2d is self-contained").

### Phase 1 — the silent design block (19:32:52–19:37:32)

Read all 535 lines of the untouched template, then 4m27s of silence — a
single assistant turn at 24,110 output tokens producing only a 234-char
text and the first small Edit. The gap is ~23k tokens of extended
thinking: whole-film design in one unrecorded block. SKILL.md step 1's
spec (beats table, register, duration) happened *inside* it and was never
externalized before code; the first artifact of the design is Edit #1
itself. 24% of the build's wall clock is uninspectable by construction.

### Phase 2 — authoring (19:37:32–19:39:53)

Ten Edits total across the build; the first four are authoring:

| # | target | what |
|---|---|---|
| 1 | BEATS + STYLE | 4 template beats → 10 named beats, 37.0s; paper palette → dark terminal; STYLE-as-one-object per `bibles.md` |
| 2 | KEYS | 10 camera keys, one per beat, rail described in a comment |
| 3 | SCENE incl. `draw()` | the whole film body in ONE 12kB edit: `PHASES[]`, `buildPrices()`, candlestick tape, order book, HUD, halt banner |
| 4 | template dead code | removed `contrastOn`/`ACCENT_INK` — after grepping the fence markers to confirm both sit outside `KERNEL-END` |

Between Edits 1 and 2 it built a six-task list mirroring SKILL.md steps
3–7 — **and omitted step 8, the film field report.** That omission
propagates: the task list became the de-facto workflow spec, and when its
last task closed at delivery, nothing remained to prompt the report.

The fence interaction was exactly right and exactly once: one boundary
grep before deleting template code, an explicit "they're outside the
fenced kernel block", and no fence ever touched.

### Phase 3–6 — check, review, fix (19:39:58–19:48:21)

- `build.js check`: first run only after the whole scene was written
  (step 3 says "the moment BEATS exist"); thereafter honored after edits.
  Four green runs; the standing caveat ("not checked: whether a declared
  h/w/d matches the geometry") printed four times, acted on zero times.
- `smoke.js`: three runs, all green, each carrying the same advisory
  exposure warning ("low dynamic range, 10.1 points between p05 and
  p95... judge by looking"). Total narration spent on it across three
  appearances: the word "Passes." The judge-by-looking escape was taken
  implicitly.
- **Composition: one round, not the budgeted 3–4.** Sheet + squint read
  properly (images actually opened). Caught the duplicated drawdown
  readout. The one `probe` call of the session ran with the literal
  expression `'null'` inside a compound command whose real purpose (a
  PIL tile-zoom) failed on a missing module — **the session's only probe
  measured nothing, and probe's output for a no-op expression (`null`,
  exit 0) is indistinguishable from a probe that found nothing.**
- **Continuity: the session's best moment.** The unpiped `motion` run
  surfaced halt at 10.73, highest bar in the film — backwards for a
  freeze. 59s of reading later it diagnosed the single end-of-beat camera
  key, split it (settle at 35%, hold to end), re-measured 7.40 with a new
  intended dead-air stretch. **The inert blink was found in the same
  window, incidentally** — nothing in `motion` measures it; the session
  spotted `sin(quant(t,2)·π·2) ≡ 0` while re-reading KEYS/draw for the
  camera fix, and fixed it at 19:44:01. It never reached the user — the
  builder postmortem's frontmatter ("shipped invisibly") is that
  document's own drift; its body states it correctly.
- Three `strip` runs, each read; all wrote the same `crash.strip.jpg`,
  silently overwriting — the earlier two strips' evidence was destroyed
  and the session never noticed.
- **Semantics: the txt() recall.** At 19:46:40 the session remembered the
  template's inline doc — read once, 14 minutes earlier — that
  `?strip=text` only strips draws routed through `txt()`, and found its
  own HUD hand-rolled with `ctx.fillText`. Three edits to convert.
  Template comments influenced review, not authoring: the same template
  read had also documented `quant()` correctly, and the blink misapplied
  it anyway.
- **The `| tail` habit cost four calls and ~28s**: `sheet ... nocap | tail -5`
  hid the `sheet -> crash.nocap.sheet.jpg` line, so the session read the
  stale captioned sheet, suspected its own argument parsing, grepped
  `build.js`'s dispatch, read the `sheet` function, `ls`'d, and only then
  read the right file. Same shape smaller on `strip` (filename line
  tailed away; one recovery `ls`) and on `motion` (the re-run's `tail -20`
  cut the `median frame-diff` header — the table's only absolute scale;
  the 10.73→7.40 comparison survived only because the first run was
  unpiped).
- Never run at all: `aspect` (despite method.md's framing-rules section,
  which it read), any playback ("watch the film at speed" — no instrument
  for an agent, disclosed as such in instruments.md), `--parity-only`,
  and the `film-reviewer` agent (resolved 2026-08-05: delegation softened
  to delegate-or-review-inline, 0.19.5).

### Phase 7 — deliver (19:48:21–19:50:28)

`smoke` again, `bundle` (self-contained confirmed), then MP4 export — the
export gate ("only if the destination cannot run a page") soft-skipped
with a stated convenience rationale, and delivery led with the MP4, HTML
second. Four encoded-frame spot-checks including a mid-transition frame —
method.md's instruction followed literally. Then: *"Let's do the film
field report and hand off"* — **announced, and not performed.** The
closing messages are a delivery note (what the film shows, how to retime
it) with none of the three bullets.

### Postmortem phase (20:13–20:21), compressed

A different skill. One AskUserQuestion (filing location). Found and
cleaned the 52MB `frames/` directory `build.js all` had silently left;
confirmed from source it was intended behavior. Produced the md + a
self-contained 0.95MB HTML rendering with embedded evidence, verified
zero external refs.

---

## Guidance-vs-behavior, compressed

Followed exactly: read method.md and bibles.md before building; scaffold
incl. fences; skip vendor on 2D; fences untouched; images actually read
("a filename is not a review"); smoke before shoot; bundle before deliver;
mp4 spot-checks incl. mid-transition. Partially: check-when-tables-exist
(first run late); review order (reordered, harmlessly); spec-before-code
(done, but only inside unrecorded thinking). Skipped: 3–4 composition
rounds (did one); `aspect`; watch-at-speed; film-reviewer delegation (now
softened by owner call); **the film field report (announced, not done —
traced to its absence from the session's own task list)**; instruments.md
never opened despite SKILL.md pointing at it twice, so three green checks
were taken at face value without reading what green cannot see.

References never opened (9 of 11): glossary, breakdown, instruments,
film-language, materials, characters, webgpu-stack, delivery, recordings.
The two that were opened were both read in full, in the first 30 seconds,
and never consulted again.

## What the tools printed, and what it bought

| signal | count | effect |
|---|---|---|
| `motion`'s halt bar (10.73, highest) | 1 | the session's most valuable output — caused the camera fix and, by proximity, the blink catch |
| smoke exposure advisory | 3 | absorbed as noise all three times |
| `check`'s h/w/d caveat | 4 | never acted on |
| `strip`'s moving-camera caveat | 3 | strips were read under a moving camera anyway, passed |
| ffmpeg banner noise ahead of `motion`'s payload | 1 | pushed the session into the `tail` habit that later cost it |
| `probe 'null'` → `null`, exit 0 | 1 | a probe with no question looks identical to a probe that found nothing |
| smoke silent on fence parity when green | 3 | the scene's parity was never independently confirmed and the session had no way to know it had been checked |

## Disposition — where every finding went

**Shipped (0.19.4–0.19.6):** txt()-from-first-draft + early nocap;
"A composed periodic can be constant" + probe rule; instruments.md
no-instrument entries (wording corrected 0.19.6 — caught pre-delivery,
not shipped); SKILL.md `frames/` cleanup note; review delegation softened
(owner); field-report-into-the-task-list line and the nocap output
filename named in step 4 (0.19.6).

**Filed in `working-plan.md` with revive triggers:** mechanical
inert-expression check; `fillText`-outside-`txt()` detector; `motion`
output hygiene (banner suppression, operative-line-last); `strip`/`sheet`
filename-last printing and strip overwrite; probe refusing a no-op
expression. Owner's call 5 resolved 2026-08-05. The smoke-parity-scope row
landed the same day (0.20.0): its trigger fired with the option E batch and
the full smoke run now states its parity scope on green.

**The scene itself (added 2026-08-05):** a `film-reviewer` pass — the
shipped agent's first real exercise — returned promote-after-fixing: the
middle three beats were three captions over one continuous fall, the outro
was a static uncovered loop seam, and the reveal carried the documented
momentum-stall anti-pattern. All were fixed in a revised copy that landed
in `scenes/crash.html`; the cold original stays local as this record's
fixture `(local)`. The shipped 2D-baseline promotion was **held by owner
call on the n=1 principle** — more portfolio scenes get built and reviewed
first.

**Held here as record, no action:** the 23k-token uninspectable design
block; the one-round composition pass; the absorbed exposure advisory;
`aspect` unrun; the export-gate soft-skip; the builder postmortem's
frontmatter drift; instruments.md unopened beside three trusted greens.
Each is one datapoint; the next cold build (boss-intro) is the second,
and this file is the baseline it gets compared against.
