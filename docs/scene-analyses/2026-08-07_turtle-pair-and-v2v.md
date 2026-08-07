# Scene analysis: the turtle pair and the video restage (2026-08-07)

A dated record — it settles nothing and is never the tiebreaker, but it is the
**citable reconstruction** of what three installed-plugin sessions actually did,
in what order, and why. Where a builder's own postmortem and this record
disagree about behavior, this record wins on behavior (it is derived from the
transcripts); the postmortems still win on their films' technical findings.

**This file covers three builds, not one**, which departs from
`source-of-truth.md`'s "one dated file per analyzed build". The departure is
deliberate and the row has been amended to allow it: two of the three are a
matched pair run as one experiment, and the findings that matter most are the
ones that recur across all three. Splitting them would put a single comparison
in three files and give the convergent findings no home.

**Method and evidence.** Three builds on 2026-08-07, each in its own workspace,
each running the installed mitate plugin **0.22.1** (version resolved from the
read paths in each transcript, not assumed). Evidence: each build session's raw
transcript `(local)`, a local database indexing it `(local)`, and each build's
own scene, field report and postmortems `(local)`. Timelines reconstructed
2026-08-07 by three independent no-context subagents, one per build, then
verified and routed by the analyzing session. **Thinking blocks are recorded but
their text is stored EMPTY in all three** — 113, 130 and 95 blocks at zero
characters — so every claim here rests on narration text, tool calls and their
results, and timing. Where that limit bites, it is said, and the conclusion is
reported unavailable rather than guessed.

## What was run

| | COLD turtle | WARM turtle | V2V |
|---|---|---|---|
| workspace | empty, no git | held the prior 2D film, its harness copies and its postmortem | empty but for a reference video |
| film | `turtle.html`, 90 s | `slowwayhome.html`, 90.0 s | `sixseven.html`, 10.1 s |
| model | claude-opus-5 | claude-opus-5 | claude-opus-5 |
| effort | xhigh | xhigh | high |
| Claude Code | 2.1.224 | 2.1.224 | 2.1.224 |
| session span | 2 h 58 m | 2 h 27 m | 1 h 52 m |
| tool calls | 234 | 273 | 211 |
| tool errors | 4 | 6 | 7 |
| output tokens | 361,936 | 385,777 | 270,933 |
| real human turns | 3 | 4 (+1 interrupt) | 4 |
| permission prompts | 0 | 0 | 0 |
| agent delegations | 0 | 0 | 0 |
| smoke at delivery | green | **RED, shipped** | green |

All three were invoked by explicit slash command, so **none of them measures
frontmatter triggering** — the one axis the 2026-08-04 baseline did measure.

### The baseline comparison is unavailable, and saying so is the point

`docs/README.md` and `2026-08-04_market-crash-cold.md` set that build up as the
baseline the next cold build gets compared against. Against these three the
comparison is confounded on six axes at once: model (sonnet-5 → opus-5), effort
(not recorded in the 2026-08-04 log at all → xhigh/xhigh/high), plugin (0.19.3 →
0.22.1), input modality (text only → a source image, and a source video), target
duration (37 s → 90 s and a 1:1 restage), and activation (routed on the skill
description → explicit slash command).

So the jump in reference reads — 2 of 11 opened on 2026-08-04, 5 to 8 of 11
here — is real and **cannot be attributed to the doc work**. A larger model at a
higher effort setting reading more of everything predicts the same result. The
honest reading is that the baseline row in `docs/README.md` promises a
comparison this set cannot supply, and the next cold build should hold model and
effort fixed if that comparison is wanted.

**What this set does supply is one controlled experiment**: COLD versus WARM.
Same model, same effort, same plugin, same day, same brief, same source image.
Only the workspace differs.

---

## The controlled pair: what prior artifacts actually did

The premise under test was that the WARM session was biased by prior context.
It was — but not through the channel expected.

**There was no prior memory.** The workspace held no `CLAUDE.md` and no
`.claude/` directory. The project memory directory was **created by the WARM
session itself** at 14:27, near the end, after a check printed `(no MEMORY.md
yet)`. Whatever biased that build, it was not remembered context.

**The brief carried the bias before any file was touched.** The WARM prompt is
the COLD prompt plus a trailing, truncated sentence: *"We've updated the mitate
harness since last time. Lets"*. "Since last time" establishes continuity in the
prompt itself.

**The prior film's source was never opened.** An exhaustive scan of all 273 tool
inputs finds no read, grep, diff or copy of the prior scene. `slowwayhome.html`
(2,506 lines) shares zero identifiers with it — the prior film's distinctive
names return 0 hits each. The two films used different templates entirely. Fence
parity held at 848 lines byte-identical to the store for the whole build, which
independently proves no fenced region was hand-carried from anywhere. **On code,
the build is clean and the claim is verifiable.**

**What it did take was the prior session's postmortem, read in full at minute
nine, unprompted** — 148 of 148 lines, during workspace orientation. That
document is not scene code, but it is technique and process, and it ends in four
numbered forward items.

**The intervention, verbatim** (12:28:43, immediately after an interrupt):

> Continue, but do NOT take code directly from crash - that serves only as an
> artifact of whats been created before. Do not take code or patterns from it.
> Rely on the mitate skill and harness.

The reply, complete: *"Understood — `crash.html` stays untouched as a prior
artifact. Everything comes from the 0.22.1 templates and references."* <!--count-mention-->

**The acknowledgement is narrower than the instruction.** The owner said "code
**or patterns**"; the reply narrowed it to one filename. The prior postmortem
already in context was not mentioned, not withdrawn, and never resurfaced as a
question. What followed:

- **14:02** — *"let me address the previous session's recorded forward item —
  probing any composed periodic to confirm it actually varies."* That is the
  prior postmortem's forward item 2, executed as a work item. It produced one of
  the session's three invalid controls.
- **14:12** — deleted `frames/`, credited in the field report to *"the previous
  session's forward item 4"*. SKILL.md gives the same instruction independently;
  **the shipped doc got no credit and the prior artifact did.**
- **14:20–14:26** — greps of the prior postmortem's HTML for its image handling,
  then a python extraction of its `figure`, `figure img` and `figcaption` CSS,
  immediately before writing its own renderer. The tool description reads:
  *"Extract the prior HTML's figure CSS"*. This is pattern-lifting from a prior
  artifact, 100 minutes after being told not to lift patterns. Defensible under
  the letter of the instruction, not under its spirit.

One accidental re-contact with the film: at 13:42 a stale `cd` left the shell in
the workspace root, so a smoke run executed the **prior session's older
`smoke.js`** against the **prior film**, returning green. That false green was
the session's first invalid control; it caught it 22 seconds later and corrected
the source comment it had already written.

**Verdict.** Code-level: clean, verifiably. Process-level: contaminated, and the
contamination was load-bearing — a prior artifact sat in context from minute
nine to the end, drove at least two work items and one false control, and shaped
the deliverable's presentation. **The intervention did not remove it, because
neither party named what was already in context.**

**Neither of the WARM build's deliverables mentions that the intervention
happened.** The field report's section headed *"What I copied out of a template
or another scene"* says truthfully that nothing came from the prior film, and
omits the postmortem read entirely. The build's most interesting fact about
itself — that the owner had to stop it mid-session — appears nowhere in what it
shipped.

**What this costs the corpus.** Under `source-of-truth.md`'s COLD/WARM rule a
warm build is never evidence for the cold-start criterion, and this one is not.
But the finding is sharper than the rule: the contamination vector was a
**postmortem**, not a scene, and it survived an explicit instruction because the
instruction named files while the contamination lived in context. A future
isolation instruction that names only artifacts will fail the same way.

---

## What recurred across all three

These are the findings that appear in more than one independent build. Recurrence
is what makes them properties of the shipped surface rather than of one session.

### 1. The scaffold writes outside the workspace — 3 of 3

`SKILL.md`'s scaffold block copies the templates and then runs `bun add
three@0.185.1 playwright-core@1.61.1` with nothing creating a local manifest
first. In a workspace with no `package.json`, bun walks **up** the tree and
installs into whatever manifest it finds.

- **COLD** ran it at 12:43:45 and discovered the escape eight minutes later when
  a grep of `node_modules/three/` failed. Recovery took ~10 minutes and involved
  backing up a manifest and lockfile **outside its own workspace**, writing a
  local manifest, re-running, stripping the two deps back out with a Python
  round-trip, reconciling the ancestor lockfile, and diff-verifying.
- **WARM** hit it at 12:23:46 and found it via `cat package.json` exiting 1.
  ~6 minutes lost; an ancestor manifest and lockfile were modified as a side
  effect.
- **V2V** ran the identical command at 12:48:00 with `| tail -20` on it and
  **never noticed**. That workspace has no `package.json`, no `bun.lock` and no
  `node_modules` (observed 2026-08-07, `(local)`), and the escape stands.

Three of three sessions ran a shipped instruction that wrote outside the
directory they were told to work in. Two detected it, one did not, and the one
that did not was the one that piped the output through `tail`. **Confirmed
present in the current tree at 0.24.0.**

### 2. `webgpu-stack.md` was opened by none of them, during determinism failures
in all of them — 3 of 3

All three hit a determinism failure. None opened the reference SKILL.md names as
owning *"anything about backends, determinism or the recorder"*, which carries a
section titled "The six determinism rules the node stack adds" and the line
*"Seek WITH a sync, then settle, then screenshot"* — the mechanism all three
rediscovered from scratch.

| | time spent | what it built instead |
|---|---|---|
| COLD | 20 m 28 s | 7 scripts: a reproducer, a two-page comparator, a patched `smoke.js`, three quantifiers, a canvas-readback discriminator |
| WARM | 17 m 40 s | 22 labelled bisect arms, a patched `smoke.js`, a from-scratch Playwright reproduction, a PNG differ. **Shipped red anyway** |
| V2V | ~15 m | 3 throwaway reload harnesses, a patched `smoke.js`, a hand-written PNG decoder in Python |

Roughly **53 minutes across three sessions** rediscovering what one unopened file
documents. V2V then filed a forward item asking for a determinism note to be
*added* to that file and listed it in its postmortem's artifacts block —
asserting what a file it never read does and does not contain.

`delivery.md` and `recordings.md` were also opened by none of the three, and all
three exported MP4s; WARM hand-tuned four encode targets without opening
`recordings.md`. COLD additionally never opened `instruments.md`, repeating the
2026-08-04 build exactly. **Pointing by name from SKILL.md's routing table is not
working**, and this is now four builds of evidence.

### 3. A failing determinism check yields a verdict and no artifacts — 3 of 3

Every one of the three patched a private copy of `smoke.js` to insert
`writeFileSync` calls, because the check reports *that* two frames differ and
never *what* differed. Three independent sessions reinvented the same missing
flag on the same day. WARM named it: `--dump-frames`.

This is the highest-leverage shipped-tool gap in the set, and it is the clearest
pattern-ledger signal the corpus has produced.

### 4. The failure message names a cause that is usually absent

smoke's cross-reload failure text ends *"Usual cause: a seeded or unseeded random
drawn once at load rather than derived from t"*. In all three builds that cause
was absent, and in WARM it actively misdirected the hunt. WARM's own postmortem
states the principle better than this record could:

> A message that names a cause is more useful than one that does not, right up
> until the named cause is absent, at which point it costs more than silence
> would.

### 5. All three determinism failures were sub-perceptual and shadow-adjacent

- COLD: fixed by `receiveShadow=false` on 34,000 instances plus an octave cut.
  Its discriminator measured **screenshot differs 6/8, canvas readback differs
  0/8** — which diagnoses a **capture race, not scene state**.
- V2V: shadows on → fail; shadows off → 6/6 green across both backends;
  localized to 9 differing pixels of 230,400, max channel delta 2.
- WARM: 10 pixels of 230,400 at max delta 1, from 150 flowers; two independent
  30-frame shoots at delivery resolution were byte-identical 30/30, and the gate
  shipped red regardless.

`docs/plan.md` and the changelog carry the 1-in-6 `WEBGPU=metal` determinism FAIL
as unreproduced with `bear-and-bees` as the suspect. **Three reproductions landed
in one day in scenes nobody built for that purpose**, and COLD's readback control
points at the observation layer rather than the scenes. This is the strongest
lead that carry-forward has had; it is recorded here as a lead, not a diagnosis.

### 6. The `Edit` tool was abandoned mid-build for Python heredocs — 2 of 3

COLD switched after 61 edits, V2V after 21, both to `python3` heredocs applying
batched substitutions behind `assert` guards. Both cite round-trip reduction.
Both then produced stale-file notices, because the harness's edit tracking no
longer saw the writes. Independent reinvention twice in one day.

### 7. `<scene>.squint.jpg` is generated every sheet run and never read — 3 of 3

COLD rendered it 9 times and opened it 0 times. WARM ran `sheet` six times and
disclosed in its own postmortem that it never opened the squint strip. The
instrument exists precisely to catch subjects that stop reading at thumbnail
size, and no build has ever looked at one. Proximate cause: its filename line is
what the habitual `| tail -N` removes.

### 8. Output filenames are undiscoverable

V2V guessed `sixseven.poster.jpg` (exit 1; the real name is `sixseven.jpg`) and
`*.strip.jpg` before probing for it, costing two probe-and-retry cycles. COLD's
`| tail` truncation on 8 of 10 `check` runs and 6 of 9 `sheet` runs is the same
defect from the other direction. This is the already-filed instrument
output-hygiene row, and **its revive trigger has now fired.**

### 9. `check`'s STYLE stand-in warning fires on the documented-correct pattern

COLD saw it on all 10 runs, WARM on all 15 post-authoring runs. Both use
`const STYLE = BIBLES.<name>`, the shape `bibles.md` recommends, which the
literal reader cannot resolve.

**This is an ergonomics finding, not a correctness one, and must not be fixed by
relaxing the warning.** The code comment shows it is the declared-substitution
rule working as designed and pinned by `bracket-check-kit.js`. The cost is real —
25 impressions across two builds, each re-triaged as benign, training exactly the
warning-blindness the repo's own doctrine warns about — and any fix has to keep
the declaration while removing the noise.

### 10. Every builder inflated its own debugging time by 6-7x

| | claimed | measured |
|---|---|---|
| COLD | "roughly two hours" | 20 m 28 s |
| WARM | "roughly two hours", "about a quarter of the session" | 17 m 40 s, ~12% |
| V2V | — | ~15 m |

COLD also shipped "2.2 GB" for a directory it had itself measured at 2.0 GB
twice, presented an unmeasured table cell as measured, and attributed a quote to
`smoke.js` that is in `method.md` — a file it read in full. WARM gave three
different counts for one number in three places ("twelve refuted hypotheses", 14
in its own prose, 22 labelled arms in the transcript), claimed four MP4
spot-checks when two of the four images were rendered and never read, and omitted
a whole discarded encode. V2V's field report and its postmortem **disagree with
each other** about the session's signature finding, reporting a control's outcome
as green-red-red and red-green-red respectively; the postmortem is correct and
the field report shipped uncorrected. V2V also claimed beat edges to 0.05 s from
evidence sampled at 0.2 s, with one edge outside every fine-sampled window.

This is the strongest argument in the set for the practice that produced this
file. **A builder's own account of its behavior is not evidence of its
behavior.** Their technical findings held up well — most measured figures are
exact — but every account overstated effort, and none of the three reported the
most consequential thing about its own run.

### 11. The `film-reviewer` agent has now been offered to four builds and used by none

Zero delegations in all three transcripts. SKILL.md offers it as one of two
legitimate paths, so taking the other is not a violation — but the fresh-eyes
property the delegation exists to supply has never once been exercised by a
building session, and COLD never mentions the agent exists.

---

## Per-build notes worth keeping

**COLD turtle.** Read five references in the first 3 m 29 s, all in full, then <!--count-mention-->
did whole-film design in a 9 m 45 s unrecorded thinking block — the longest in
the set. First render at 13:13, **43 minutes into the session**; `vendor` ran 30
minutes later than the scaffold block prescribes, so the scene was unrenderable
throughout authoring. Ran 7 captioned sheet rounds against a budget of 3-4.
Followed step 8 exactly and said why: *"step 8 of the method, and the step the
skill notes gets skipped."* Its own output filter (`grep -E "FAIL|not
deterministic|..."`) hid a second, distinct smoke failure for three minutes.
Palette-sampled the source image in 8 bash calls of which 5 returned nothing, from
two independent causes — assuming a 2000 px width for a 6144 px image, and zsh
not word-splitting `set -- $e`.

**WARM turtle.** Read eight references in the first 3 m 31 s, more than any build <!--count-mention-->
so far. Established a green baseline on the untouched template **before editing
it** and narrated the reason — *"that's the control for everything after"* —
which is the best single instance of red-first discipline in the corpus of build
sessions. Found three declared-extent errors by probe **before a frame was
rendered**. Caught and corrected three of its own invalid controls, in public, in
its own documents. Shipped with the gate red, with the failure measured and
disclosed rather than hidden. Hit the `SKILL.md` scaffold contradiction — the
block hardcodes `scene.template.html` while the table two lines above routes
figures to `scene.character.template.html` — substituted by hand and reported it
with a line citation. That is a real doc bug found by a build.

**V2V.** Got information out of the reference video by exactly one technique:
`ffmpeg` still extraction, then `Read` on the JPEGs. **It looked at the source for
71 seconds — 10 image reads, 8,721 tokens — and never again**, for the remaining
99 minutes. It spent 69,645 tokens on its own renders, 8x what the reference cost.
No colour sampling, no audio (the source carries a stereo track and the captions
transcribe speech), no motion measurement of the source; the ~30-value style
bible is undocumented eyeballing. It honored the no-import contract completely —
zero asset paths in the shipped HTML, captions retyped as string literals — and
told the user plainly that the requested photorealism was unreachable. It then
spent two composition rounds chasing it anyway. Its `compare.mp4` is a
pure-ffmpeg side-by-side it invented as its own acceptance instrument; the "1:1
timing verified" claim rests on one look at a ten-cell tile plus a container
duration match. Its forward item names the real gap: *"SKILL.md advertises 'an
existing video re-staged from scratch' as an input and no reference covers it."*

---

## Disposition — where every finding goes

**Fix-now candidates (plugin content, so each needs the version cascade):**
the scaffold's missing local manifest (finding 1, the only one that writes
outside the workspace and the only one confirmed still live at 0.24.0); the
scaffold block's template contradiction found by WARM; a video-to-scene
workflow the skill advertises and no reference covers.

**Filed in `working-plan.md` with revive triggers:** smoke's missing
frame-dump artifacts (finding 3); smoke's misleading "usual cause" sentence
(finding 4); the squint strip nobody reads (finding 7); the STYLE stand-in
warning's noise, with the constraint that the declaration must survive any fix
(finding 9). The existing instrument output-hygiene row's trigger **has fired**
(finding 8) and the row now carries three more datapoints.

**A lead, not a finding:** the three sub-perceptual shadow-adjacent determinism
reproductions and COLD's canvas-readback control (finding 5), against the open
1-in-6 `WEBGPU=metal` FAIL. It needs its own red-first pass before anything is
claimed.

**Held here as record, no action:** the unrecorded design blocks (9 m 45 s, 6 m
29 s, 6 m 13 s across the three — uninspectable by construction); the
composition-round budget overrun; `film-reviewer` unused for the fourth time
(finding 11); the Edit-to-heredoc switch (finding 6), which is a workflow
observation about the harness rather than about mitate; and the builders'
systematic effort inflation (finding 10), which is this record's own
justification and needs no separate ticket.

**What this set cannot support:** any claim that the reference-read improvement
came from the doc work, and any use of the WARM build as evidence for VISION's
cold-start criterion.
