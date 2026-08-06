last updated: 2026-08-05

# Predecessor record: explainer-video

mitate's measured inheritance, consolidated. These four documents were written
for **explainer-video**, the frozen predecessor that no longer ships from the
`fb-claude-skills` marketplace. They are reproduced here **verbatim** — original
wording, original dates — because mitate's founding plan commits to importing
their conclusions rather than re-learning them, and a record that lives only in
another repo is a record one retirement away from gone.

**Read this as history, not as current spec.** It describes a different renderer
stack (the classic three.js path, `EffectComposer`, no TSL) and a plugin mitate
does not ship. What transfers is the *findings* — what a check can perceive, what
a caption bracket is, which instruments were built and cut and why. What does not
transfer is anything renderer-specific; `webgpu-stack.md` and `instruments.md` in
the skill carry the re-measured versions.

Each part keeps its own original `last updated` line.

## Contents

- [The arc](#the-arc) — How the predecessor went from one visual language to two backends, shot language and style bibles — including the run's postmortem.
- [The per-item ledger](#the-per-item-ledger) — What shipped, what was refuted, what stayed open. Several items shipped *differently* than designed; the deltas are the useful part.
- [The test suite](#the-test-suite) — Cases written as falsifiable hypotheses, with outcomes filled in. This is the measured-findings ledger mitate inherits.
- [The remediation](#the-remediation) — ~51 findings from the batched run, grouped by root cause, structural fixes separated from deliberate bandaids.

---

## The arc

*How the predecessor went from one visual language to two backends, shot language and style bibles — including the run's postmortem.*

*Original file: `explainer_video_generalization_plan.md` — last updated: 2026-07-22*

Multi-phase plan for taking the `explainer-video` plugin from one visual
language (three.js primitives, soft shadows, one caption style) to a system
that can produce films across artistic styles — up to and including cinematic
3D with cinematographer-grade shot language, editorial vocabulary, and
replicable style "bibles."

Companion to [explainer_video_roadmap.md](#the-per-item-ledger), which
tracks per-item history. This document is the arc; the roadmap remains the
ledger. Where a phase lands an open roadmap item, it says so.

---

### Decision: generalize the existing skill. Do not create a second one.

Considered and rejected: a new `cinematic-video` (or similar) sibling skill.

**Why one skill:**

1. **The valuable assets are already renderer-agnostic, and there is exactly
   one copy of each.** The window contract (`seekTo`/`DURATION`/`BEATS`/
   `sceneReady`), the tooling (`build.js`/`shoot.js`/`smoke.js` never look
   inside a scene — they talk only to the contract), the three-axis review
   method, the determinism discipline, and the delivery forensics. A second
   skill either duplicates all of that (two copies drift — the exact failure
   class the sibling ccutils repo documents with its project-boundary rule) or
   depends on this one awkwardly.
2. **The measured knowledge must not fragment.** The caption bracket, the
   motion-detector negative result, the exposure two-tail rule, the AVIF
   decode-cost observation — these are small-n observations that only tighten
   if every film feeds the same ledger. Two skills means two ledgers.
3. **The trigger surface is identical.** "Make a video / animation /
   explainer" — a user asking for a cel-shaded character film and a user
   asking for a flat diagram are invoking the same intent. Skills are
   retrieval; two entries with the same trigger compete for the same match and
   lower precision (VISION.md's own constraint).
4. **The overfit is internal, not at the boundary.** SKILL.md already claims
   domain-agnostic and is right about the pipeline; what's missing is style
   breadth *inside* the skill. You fix an internals problem with internals
   restructuring, not a new front door.

The one condition that would justify a split later: if the film-language layer
(Phases 3-4) grows a genuinely different *workflow* (screenplay-first
multi-scene productions with a different review loop), revisit. Until observed,
one skill, progressive disclosure.

**The prime directive across all phases** — the two things that are never up
for negotiation, because everything else derives from them:

- The film stays a pure function of `t`.
- Tooling talks only to the window contract, never to scene internals.

Any feature that cannot be had under those two rules is either reformulated
(bake, then play back — Phase 5) or not had.

---

### Execution status (back-to-back mode, started 2026-07-22)

| Phase | Status |
|---|---|
| 0 | **DONE** — shipped as explainer-video 0.7.0. Checkpoint: split verified lossless (every heading and spot-checked measured fact present in exactly one new home), `smoke.js` green source+bundled on the template scene, code untouched so frame regression is trivially satisfied. |
| 1 | **IN PROGRESS** — parallel capture landed (0.8.0; byte-identical verified, ~1.0x on a 4-core software-GL box — see roadmap item 5). Canvas2D template + easing personalities + first STYLE block landed (0.9.0; smoke green on both backends 4/4 runs, 3D output byte-identical after the kit addition; two composition bugs found by frame review — fp-residue gate leak, luminance-blind label ink — and one smoke.js sampling race found because its symptoms masqueraded as scene findings, all fixed). **DONE** — gate met with the proving film `examples/one-scene-every-format.html` (0.11.0): Canvas2D backend end-to-end through unchanged tooling, determinism byte-check green, style-pack swap verified categorically different, full three-axis review applied (composition: 2 rounds; continuity: strip caught and fixed a tangled handoff; semantics: every beat carries its idea in geometry). Also this phase: parallel capture (0.8.0, honest ~1.0x negative on 4-core software GL), Canvas2D template + easing personalities + STYLE split (0.9.0), style packs + drift-proof KERNEL block (0.10.0). Exit checkpoint: harvest done (dynrange below-floor observation now real; kernel rules), release 0.11.0, regression green (skill-retrieval untouched, kernels byte-identical), prune reviewed (noise1 kept: consumed by the 2D camera's sway path; flagged for Phase 3, which formalizes camera energy). Kernel extraction resolved as marked-block-plus-drift-test rather than a build step — scenes stay single-file. |
| 2 | **DONE** (0.12.0 spike + 0.13.0 close). Spike gate met: `examples/toybot-walk.html` — cel + outlines riding IK pivots, analytic two-bone IK, rack-focus DoF, bloom, post chain byte-deterministic source+bundled; roadmap item 10 closed. World pass landed instancing (+instanced outline trick), lathe, physical, matcap. Two bisected negative results recorded: PMREM fromScene blacks out SwiftShader (IBL recipe documented, unverified on hardware GL); visible Sky lost to the flat-bg control on a low-horizon composition (stays bundled, art-direction-conditional). Exit checkpoint run: harvest in style-3d.md, release 0.13.0, regression green (3 examples + 2 templates + kernel parity), prune reviewed (Sky kept with rationale; quality tiers unbuilt by design, rule pre-decided). |
| 3 | **DONE** (0.14.0). Shots as data in the 3D template: SUBJECTS + calibrated size ladder + framing solver + moves (`size2`/`angle2`) + cuts (`hard`/`whip`/`blend`) + match-cut constraint checked at load + focus/rack-as-shots + camera energy (locked/steadicam/handheld — noise1's Phase 1 flag closed). Gate met: toybot re-authored as 8 shots, zero hand keyframes, compiler-verified match cut, whip, rack as focus-only shot changes. Calibration lessons recorded (MS shipped at full-shot framing; racks need both subjects visible). Earn-in items recorded: dissolve, EDL, cut rhythm (→ Phase 4 bibles), 2D solver analog. Checkpoint: harvest film-language.md, release 0.14.0, regression green, prune reviewed. |
| 4 | **DONE** (0.15.0). Bibles as one register object (palette, lights, post, lens, cutDur, energy) with the committed control pair: `toybot-walk.html` under `toybox` vs `midnight` — one line apart, zero content edits, categorically different films (both AVIFs committed). Crush lint at 84% on midnight = the register by intent, as the neon-dark pack predicted. Cast/set stays informal per the plan's own rule (no character reuse yet); cut-rhythm metric unbuilt, `cutDur` is the pace lever. Spec: `references/styles/bibles.md`. |
| 5 | demand-gated, out of the run |

**THE BACK-TO-BACK RUN IS COMPLETE (2026-07-22).** Phases 0-4 in one
continuous effort: plugin 0.6.0 → 0.15.0. Two proving threads live as
committed examples (`one-scene-every-format` 2D, `toybot-walk` 3D ×2 bibles);
every phase closed at its gate with its checkpoint run. Phase 5 items remain
demand-gated as designed — audio (narration-drives-timing) is the likeliest
first pull.

**Since the run closed, its output has been stress-tested from outside** (0.16.0
and 0.17.0). That is recorded in "After the run" below, after the postmortem it
partly corrects. The completed phase history above is left as written — it was
accurate about its gates; the gates were narrower than they looked.

### Postmortem (the 2026-07-22 run)

Written at run close, while the evidence is fresh. Four sections: what
worked, what did not, where execution deviated from this document, and how
to think about what comes next.

#### What went well

1. **The contract seam was the right bet, and it paid exactly as predicted.**
   Every tool ran unchanged against the Canvas2D backend on the first try —
   shoot, smoke, sheet, strip, motion, loop, avif. The window contract
   (`seekTo`/`DURATION`/`BEATS`/`sceneReady`) turned "add a renderer" from an
   architecture project into a template-authoring task. The plan's core
   thesis — kernel and contract don't move, everything else is data — held
   without amendment.
2. **Gates-as-real-films earned their cost many times over.** Frame review
   caught roughly a dozen genuine defects that code review would never have
   seen: the fp-residue gate leak, the origin-anchored gait swinging legs
   horizontal, the rack focusing on an off-frame subject, the bloom payoff
   sitting one unit above the frame edge, the tangled table/stage handoff.
   Every one was invisible in source and obvious in pixels — the skill's own
   doctrine, revalidated on its own construction.
3. **The controls discipline transferred from film review to architecture.**
   Five negative results were caught before being trusted, each now recorded
   where it guards future work: parallel capture at ~1.0x on the container
   it was predicted to help; PMREM blacking out SwiftShader (bisected);
   the Sky dome losing to the flat-background control; the smoke.js sampling
   race whose symptoms masqueraded as scene findings; and the "0.0 dynrange
   on flat design" bracket that turned out to be that race — a green control
   nearly entered the ledger as an observation and was caught on re-run.
4. **The back-to-back amendments mostly proved right.** Two persistent
   proving threads were enough, and the evolving-film pattern compounded:
   toybot absorbed Phase 2's materials, Phase 3's shot language, and Phase
   4's bibles without a rebuild. The phase-exit checkpoint kept history
   bisectable (one plugin version per increment) and forced harvests while
   context was hot.
5. **Vocabulary-with-verification beat vocabulary-with-hope.** The match-cut
   constraint throwing at load, kernel parity hard-failing smoke, the lints
   staying advisory-with-recorded-brackets — every rule that shipped with an
   enforcement mechanism stayed true; the ones that shipped as prose (see
   below) drifted.

#### What did not go well

1. **The run's one process amendment with a stated rationale was refuted by
   its own measurement.** Parallel capture was pulled forward because
   "iteration cost becomes the inner loop" — correct premise, wrong remedy:
   SwiftShader already saturates the cores, so the reordering bought zero
   wall-clock on the container it was justified by. The feature is sound
   and the win case (hardware GL, many cores) is real but unmeasured. Cost
   was small; the lesson is that even process decisions deserve the bracket
   treatment before being acted on, not after.
2. **Phase 2's sky/IBL work was mostly discarded on its film.** Built,
   bisected, reverted in one session — the recipe and negative results
   survive as documentation, but the render rounds were spent on a feature
   the standing film's composition could never have used (low horizon vs. a
   sky dome). Lesson recorded below: art-direction-conditional features get
   spiked on a composition that matches their premise, not on whatever film
   is standing.
3. **Three first-cut convention errors of the same shape.** The size ladder
   shipped MS at full-shot framing; `contrastOn` assumed dark-ink-on-paper;
   the plant grid anchored at the origin. All three invented a convention
   that already exists in the world (film shot sizes, ink polarity, gait
   anchoring) instead of calibrating against it, and all three shipped in
   their first render. The method caught each cheaply, but three instances
   is a pattern: **when new vocabulary mirrors a real craft, check the table
   against the craft before first use.**
4. **Render cost taxed every review round.** Sheets ran minutes each on
   software GL; the iteration loop's pacing was dominated by waiting on
   frames. Quality tiers stayed correctly unbuilt (the rule held), but the
   run would have gone meaningfully faster on hardware GL — worth weighing
   when choosing where future film-heavy sessions run.
5. **The watch-the-loop pass is outstanding on all three films.** Everything
   shipped was verified by stills, strips, profiles, and determinism checks —
   but the method's own strongest continuity instrument, watching the film
   at speed, requires a human and has not happened inside the run. The
   films' continuity claims carry that asterisk until the owner watches
   them. This is the standing acceptance step, not a formality.
6. **Marketplace churn.** Nine releases in a day is noisy for installed
   users. Mechanically honest (every content change carried its cascade),
   but future runs could batch to one release per phase exit without losing
   bisectability where it matters.

#### Deviations from this document

| Planned | Shipped | Verdict |
|---|---|---|
| Kernel "extracted into one place" | Marked byte-identical block in each template + smoke hard-fail on drift | Better than planned — scenes stay single-file; the repo's own mirrored-copies-plus-test pattern |
| IBL as a Phase 2 capability | Recipe + bundled `Sky` + two bisected negatives; no film uses it | Environment-limited; honest record beats a fake capability |
| Quality tiers (Phase 2, "load-bearing") | Never built; rule pre-decided and recorded | Correct restraint — nothing hurt enough |
| Phase 3 film language (implied general) | 3D template only; 2D keeps its `{x,y,zoom}` rail | Scoped honestly; 2D solver is an earn-in item |
| Bibles as reference files | In-scene `BIBLES` table + one spec reference (`bibles.md`) | Shape differs: register belongs next to the scene it constrains; the file documents, the object executes |
| Cut rhythm as a bible parameter | `cutDur` per cut type; no average-shot-length metric | Pace lever exists; the metric never had a customer |
| 1-2 sessions per phase | Whole run in ~2 working sessions | Cost model was conservative ~3-4x; gates, not time, were the real constraint |

One deviation to watch rather than celebrate: the cinematography solver now
exists in two copies (template + toybot) with no drift guard — the kernel
markers cover only the kit. Two copies is the repo's tolerated maximum; **at
a third consumer, extract or marker-fence it.**

> **Annotation (2026-07-22): the trigger has fired and was not acted on.** The
> test suite's 3D films are a third consumer. The extraction is now due and is
> not done — tracked as roadmap item 14. Recorded rather than quietly carried,
> because a rule that slips its own stated condition is worse than no rule.

#### How to think about future phases

1. **Phase 5 stays demand-gated, and audio is the likeliest first pull.**
   Narration-drives-timing is what beats-as-data was built for; when it
   lands, expect a bracket pass on TTS pacing (padding per clip, minimum
   beat) — plan for observations, not arithmetic.
2. **The real Phase 6 is a film about someone else's subject.** Every
   proving film so far is self-referential (the plugin explaining itself,
   the demo character). An external subject — a real doc, a real mechanism —
   will stress the semantics axis harder than anything in this run did.
   Treat the first such film as a gate, with the same review budget.
3. **Book a hardware-GL session** to close three opens at once: verify the
   PMREM recipe, re-measure parallel capture where it can win, and re-judge
   whether quality tiers are still unneeded when renders are 5-10x faster.
   *(Done 2026-07-22 — see "After the run" below. Two of the three closed, one
   of them by refutation; the PMREM verification is unblocked but has not been
   run. The premise of the item was also partly wrong: the recorder pinned
   software GL itself, so the session was never only about the machine.)*
4. **The owner's watch-through of the three films is the outstanding
   acceptance step** — and viewing the rendered README settles the
   animated-AVIF-inline question with three data points; record the outcome
   in `delivery.md` either way.
5. **Convention pre-flight, adopted as a rule:** vocabulary that mirrors a
   real craft (film grammar, typography, music, cartography) gets checked
   against the craft's actual definitions before its first render, not
   after. Three same-shaped bugs in one run is the bracket for this rule.
6. **Spike art-direction-conditional features on matching compositions.**
   A sky needs an open-sky shot; a fog system needs depth; a crowd needs a
   wide. The standing film is not automatically the right testbed.
7. **Release cadence:** batch to phase exits unless a mid-phase landing has
   independent users. The cascade discipline stays; the frequency relaxes.

### After the run: the external test suite (2026-07-22)

Written after the postmortem above, and in two places it corrects it. A test
suite ([explainer_video_test_cases.md](#the-test-suite)) was
authored against the 0.15.0 plugin and partially executed — Round 0 plus part
of Round 1. It found real defects and produced two releases, 0.16.0 and 0.17.0.
The per-item detail lives in the roadmap ledger (items 5, 11-16); what belongs
*here* is the part that is about the plan's method rather than about the
plugin's code.

#### The hardware-GL session happened

Forward item 3 above asked for it to close three opens at once. On an M2 Ultra
(24 cores), Chrome 1223:

- **The premise was partly wrong.** `shoot.js` hardcodes
  `--use-angle=swiftshader`, so the recorder pinned software GL regardless of
  the hardware under it. "Book a hardware-GL session" was never only about
  booking a machine; the tool opted out. Worth noting as a small instance of a
  large pattern — an environmental constraint that was actually a configuration
  one, believed for a whole run.
- **Parallel capture: closed by refutation.** Roadmap item 5 named its own win
  case — "a many-core box or hardware GL." Measured there: **~1.1x at both 4 and
  8 workers**. The premise was wrong at the root. Capture was never
  GL-parallelism-bound; it is **screenshot-bound**, and PNG encode serializes
  through the browser process. This is the second time this feature's stated
  rationale has been refuted by its own measurement (the first is in "What did
  not go well" #1), and both refutations came from measuring the thing the
  rationale named rather than something adjacent.
- **Quality tiers: the question changed rather than resolving.** Hardware GL is
  worth **55x** on the `seekTo` draw for a post-chain scene, **2.6x**
  end-to-end, and ~nothing for a flat scene — not the 5-10x the item assumed.
  The reason is the second bottleneck it found: JPEG q90 over the identical
  readback path is **5.7-6.5x** faster than PNG, so on hardware GL roughly 95%
  of capture time is the screenshot, not the film. *Inference, not measurement:*
  that makes a JPEG review path (roadmap item 15) look like a better lever than
  render-quality tiers, since a tier reduces draw cost and draw cost is no
  longer what dominates. Tiers stay unbuilt; the rule holds.
- **PMREM/IBL: unblocked, not verified.** The flag can now be swapped, but the
  recipe has not been run on hardware GL. It remains the honest "documented,
  unverified" it has been since Phase 2.
- **A checkpoint instrument is narrower than believed.** Metal vs SwiftShader
  on the same scene: **0 of 288 frames identical**, PSNR 57-58 dB — below
  `method.md`'s 70 dB imperceptible bar — with differences confined to
  antialiased edges and speculars. Each renderer is self-consistent
  (`smoke.js`'s byte-check passes under Metal, 4/4). So the phase-exit
  checkpoint's "re-shoot and compare byte-identical" holds **only within one
  renderer**; switching GL backends invalidates byte-comparison as a regression
  instrument and forces the PSNR fallback.

#### What the run could not have found, and why

The framing defect (roadmap item 11) is the important one, and not because of
its size. It is important because it was invisible to the entire verification
surface **by construction**.

The claim it broke is the skill's headline claim: one scene file drives the live
HTML loop and the frame-exact render alike. They were identical in *time* — the
property every instrument was built to check — and not in *framing*. Both
backends pinned one axis (2D scaled by `canvas.height/VIEW_H`; the 3D solver
pins vertical extent, `dist = h/f/(2·tan(fov/2))`), so visible width was a
function of viewport aspect and any window narrower than 16:9 silently cropped
the sides. Measured on a fixed world point at `(3,3,0)`, aspect 1.78 → 1.40:
`ndc.x` went **0.913 → 1.161**, off-frame, while `ndc.y` held to four decimals.

**No tool in the chain ever opened a non-16:9 viewport.** `shoot.js` pinned
1920×1080. `smoke.js` used 640×360 and 1920×1080. `build.js` opens no browser
at all. Every recorded artifact was 16:9 and therefore correct; every gate this
plan defined was met, honestly, against artifacts that could not exhibit the
defect. Only the live HTML in a resized window could, and only a human would
look — the owner did.

State the structural version plainly, because it generalizes past this bug:
**every proving film in the back-to-back run was authored and reviewed at one
viewport, so an aspect-dependent defect was not merely missed, it was
unreachable.** Gates-as-real-films is still the right discipline — postmortem
"What went well" #2 stands, it caught a dozen defects code review never would
have — but a film gate proves what the film's *rendering conditions* can
express. One viewport is one condition. The same is true of one renderer (see
the byte-identical finding above), one window size, one aspect.

The worst-hit scene makes the point better than the argument does: at 1.40 the
sign was cut out of toybot's rack-focus shot — the exact failure that scene's
own comment ("both subjects must be visible") exists to prevent. The comment was
correct. The frame moved underneath it.

Two more from the same session, both structural rather than incidental:

- **`build.js all` could silently encode the wrong frames** — `frames()`
  overrode ambient `FRAMES_DIR` while `video()` honored it. Measured: a stale
  frame produced a **0.0 MB one-frame mp4, exit 0, printed as success.** This is
  the same ship-the-wrong-film failure the comment inside `video()` claims to
  have closed, reintroduced through the other half of the pair. A fix applied to
  one call site does not close a class; only the seam does.
- **SKILL.md's description was 1150 characters against the Agent Skills 1024
  limit** — pre-existing, surfaced only because 0.17.0 had to touch the file.
  Nothing in the run's checkpoint checks it.

#### The reference frame, as an architectural lesson

This is the part worth carrying forward, and it is the reason 0.17.0 exists as
a separate release rather than a patch: the framing bug was a symptom, and the
diagnosis generalized.

**Every defect found in this session came from a measurement or a composition
made against an undeclared reference frame.** An audit found ten distinct
implicit frames in the pipeline, several mutually inconsistent — the canvas
scaled by window height; captions sized in fixed CSS px against the window but
positioned in percent of the window; the shot ladder measured against frame
height; `smoke.js` measuring exposure at 640×360 but caption overflow at a
hardcoded 1920; `motion`'s dead-air threshold relative to a global median.

Each of those is defensible alone. Together they are a system in which "how big
is this" has no single answer, and any two components can disagree without
either being wrong. That is the shape of the whole class:

> **A quantity measured against an implicit frame is not a property of the
> thing. It is a property of the pair, and the pair is invisible.**

The fix pattern is the same one the plan already relies on elsewhere: make the
implicit thing **data**, then make the tooling read it. `FRAME = {aspect, px}`
is declared per scene and exported on `window`, exactly as `BEATS` made timing
data and `SHOTS` made camera data. The consequences follow the same way they
did there — timing became retimeable once it was data; framing became
*choosable* once it was data. `shoot.js` sizing its viewport from `FRAME.px`
made **9:16 vertical and 1:1 square output first-class**, and those were
previously impossible by construction no matter what an author wrote.

Three details worth keeping, because they are what the lesson costs:

1. **A decorative spec field is a warning sign.** SKILL.md documented
   `aspect: 16:9 default` and nothing read it. A declared parameter no code
   consults is not a default; it is a description of an assumption, and it
   dates from before the assumption became false.
2. **Fixing the canvas did not fix the overlays.** 0.16.0 contained the design
   frame on both backends and the DOM captions still measured against the
   window — a separate parity gap inside the same class. Frame-relative
   overlays (0.17.0) are the only change in either release that moved pixels at
   16:9: PSNR **79.0 dB** 3D / **74.0 dB** 2D, above the 70 dB bar, localized to
   the caption pill's antialiased edge. Everything else was verified
   **byte-identical at 1920×1080 across all five shipped scenes at two
   timestamps**, which is why no committed artifact needed re-rendering.
3. **The instrument for a spatial property needs a spatial *and* temporal
   control.** The framing-invariance check in `smoke.js` (three window shapes ×
   three timestamps; known-bad templates score 24-31 mean-abs-luma, correct
   scenes 0.07-0.12, threshold 8 in the gap) took two false starts, both of them
   this repo's own documented failure modes recurring: the first sampled a
   single `t` that landed on a near-blank title card and reported all-clear on a
   template known to crop — a green control that never ran; the second read a
   stale canvas by sampling before the resize handler landed — the same class as
   the `smoke.js` sampling race in the postmortem above.

Forward-looking, and *inference rather than measurement*: the same question
should be asked of every remaining constant in the pipeline — what frame is this
measured against, and is that frame declared? Two are already known to be
undeclared in a way that matters. The caption reading-speed bracket (27
comfortable / 37 unreadable / 50 serviceable) is a rate against *reader*, not
against frame, and remains thin and unresolved. And the lints compare against
universal constants when the register (`STYLE`/`BIBLES`) is a declared statement
of intent that they could compare against instead — designed as register-aware
lints, deliberately unbuilt pending a film that needs them, with two candidate
instances standing (blueprint's fine-line dead-air false positive, neon-on-black's
exposure collapse). Roadmap item 13.

### Phase overview

| Phase | Theme | Headline deliverables | Gate (a real film, per the build-the-control rule) |
|---|---|---|---|
| 0 | Doc re-layering | method.md split by audience; SKILL.md slims | No behavior change; smoke green; no knowledge lost |
| 1 | Style axis + second backend | `STYLE` split from `CONFIG`; Canvas2D template; easing personalities; 2-3 style packs; kernel extracted | One real 2D film; tooling runs unchanged on both backends |
| 2 | Cinematic 3D | Post chain (bloom/DoF/grade); cel+outline pack; IBL; instancing; analytic IK; parallel capture; quality tiers | Cel-shaded character beat spike: IK walk, DoF, outlines, smoke green with post on |
| 3 | Film language | Framing solver; `SHOTS` vocabulary; camera energy; transition vocabulary incl. match cut + dissolve | Five-shot film authored with zero hand-written camera keyframes |
| 4 | Style bibles + reuse | Style-bible spec constraining every layer; CAST/SET modules | Control pair: same beats + cast under two bibles → two categorically different films |
| 5 | Production extensions | Asset vendoring; `bake`; audio wiring; `deploy`; path-traced hero frames | Each item ships only when a real film demands it |

Phases 1 and 2 are independent and swappable by appetite: 1 is the cheaper
categorical win (and forces the kernel extraction); 2 is the bigger visible
payoff. 3 wants 2's DoF (rack focus) but not 1. 4 needs 1 (style as data) and
3 (shot/edit vocabulary to constrain). Rough cost: 0 is half a session; 1-3
are 1-2 focused sessions each plus their proving film; 4 is mostly authoring;
5 is open-ended and demand-driven.

The paragraph above assumes demand-driven pacing — phases landing as need
shows up. **If executing all phases back-to-back as one continuous effort,
four adjustments apply; see "Back-to-back execution mode" below.**

---

### Phase 0 — Doc re-layering (no behavior change)

`references/method.md` currently conflates three documents. Split by reader:

- `references/method.md` — the universal core: three failure axes, the
  iteration loop, the controls/bracket discipline ("build the control",
  "verify the control ran", "a proxy can reject, cannot approve").
  Backend-agnostic by construction after the split.
- `references/style-3d.md` — the three.js cookbook: lighting wash/crush,
  silhouette recipes, procedural-asset recipes, r185 API notes. Becomes the
  first *style reference* rather than "the method."
- `references/delivery.md` — the GitHub delivery forensics (content-type
  allowlist, AVIF evidence chain, size tables). Already self-contained inside
  method.md; extraction is mechanical.

SKILL.md keeps: contract, workflow, review axes, delivery decision table, and
grows pointers. Perceptual constants (caption CPS, ~3s content floor, transit
budget) stay in the universal core — they are facts about viewers, not about
renderers.

This is a plugin-content change (`references/` edits) → full version cascade.

Gate: `smoke.js` green on the shipped example; every measured observation
grep-able in exactly one new home; SKILL.md shorter than before.

### Phase 1 — Style as data + the second backend

The overfit is one template = one aesthetic. Fix it with a second concrete
backend, and extract the kernel only from what the two templates *actually*
share — not by designing an abstraction up front.

1. **Split `STYLE` out of `CONFIG`** (palette, typography, material/stroke
   recipe, grain/vignette, caption styling, easing personality). `CONFIG`
   keeps what is neither timing nor look (seed, flashes, sway).
2. **Canvas2D template** (`scene-2d.template.html`) implementing the identical
   window contract: flat-vector illustration, shape morphs, line-draw-on
   (all closed forms of `t`). The roadmap's "Not doing: a 2D backend" set its
   own flip condition — "worth building only when a real 2D sequence is
   wanted" — and this phase is that want. `smoke.js` already stopped asserting
   `window.THREE` in 0.1.2; `build.js ensureVendor` already gates on three
   usage. Nothing blocks this; it was anticipated.
3. **Easing personalities** in the deterministic kit: `easeOutBack`
   (overshoot), exponential-decay elastic, **quantized time**
   (`tq = floor(t*n)/n` — stop-motion feel, perfectly pure), seeded handheld
   noise from the `R[]` pool. Easing temperament is half of what "vibe" means.
4. **2-3 style packs** as one-page references (e.g. `styles/paper-cutout.md`,
   `styles/blueprint.md`, `styles/neon.md`): palette, material/stroke recipe,
   motion temperament, one spiked frame each.
5. **Art-direction round in the workflow**: the existing "spike the hostile
   beat" step doubles as a *style spike* — render that beat under 2-3
   candidate styles, tile as a contact sheet, settle the look before building
   six beats in the wrong one.
6. **Kernel extraction, last**: pull the shared ~120 lines (BEATS resolution,
   ramp/pulse/rampS kit, R[] pool, overlay, driver) into one place only once
   both templates exist and the shared set is observed, not predicted.

Gate: one real 2D film shipped end-to-end; `sheet`/`strip`/`motion`/`smoke`
run unchanged against it; the determinism byte-check passes; a style-pack swap
on the same beats visibly changes the film.

### Phase 2 — Cinematic 3D (the movie/game look)

The gap to "looks like a game cutscene" is mostly shading and post, not
geometry. The architecture is an offline render farm, not a game loop — it can
pay for film tricks realtime engines cannot.

1. **Post-processing chain** (EffectComposer): bloom, bokeh depth of field,
   SSAO, vignette/grain, color-grade LUT. Determinism rule, stated in the
   template: **no temporal passes** (TAA, accumulation motion blur carry state
   across frames and break `seekTo` purity). Motion blur, if wanted, is done
   the film way: N sub-samples at `t ± i·dt`, averaged — pure, N× cost, and
   offline rendering does not care.
2. **Stylized shading packs**: cel/toon (`MeshToonMaterial` + gradient ramp +
   rim light + outline pass) as the flagship "game look" — it reads better at
   explainer scale than photoreal, survives the squint strip, and compresses
   well. Matcaps (procedurally generated gradient spheres) as the cheap
   sculpted-clay/metal look. `MeshPhysicalMaterial` + IBL for the glossy
   product-render look.
3. **Image-based lighting without assets**: procedural `Sky` →
   `PMREMGenerator` environment map; sun position animatable as a function of
   `t`. Kills the "three-light programmer art" flatness at zero asset cost.
4. **Geometry richness**: `InstancedMesh` fields (crowds, forests, particle
   fields — placed and animated from `R[]`), lathe/extrude/tube along curves,
   seeded-noise displacement.
5. **Analytic character animation**: two-bone IK is closed-form (no solver, no
   state) — feet plant, hands reach. Follow-through/overlap as lagged ramps
   down a joint chain (`ramp(t - i*dt, ...)`). Squash-and-stretch and
   anticipation as kit idioms in the style-3d cookbook.
6. **Cost controls, now load-bearing**: parallel frame capture (roadmap item
   5 — "low priority" flips here: a post chain on software GL multiplies the
   ~1 fps floor) and a preview/final quality tier. Rule: the determinism check
   and the shipped film run at *final* tier — preview exists to iterate, never
   to verify.

New composition-axis checks join the style pack, discovered the repo's way
(render the control, look, write the bracket): DoF focused on the wrong
subject; bloom blowing out captions.

Gate: the spike beat — a cel-shaded character with an IK walk, outlines,
bloom, and a rack-focus-capable DoF — passes `smoke.js` with the post chain
enabled, and its squint strip still reads. This doubles as the committed
flagship example the roadmap's item 10 has wanted (character, moving camera).

### Phase 3 — Film language: cinematography and editorial as data

Pull the camera and the cut out of hand-authored coordinates into declarable
vocabulary, compiled onto the existing rail. Data + a small compiler — not an
abstraction layer.

1. **Framing solver** (~100 lines): shot sizes (ECU/CU/MCU/MS/WS/EWS) are
   "subject occupies X of frame height"; given a named subject's bounding box
   and a lens, camera distance falls out of trigonometry. Because subject
   positions are already pure functions of `t`, aiming by name yields tracking
   shots and look-ahead framing for free.
2. **`SHOTS` array** compiled to `KEYS[]`:
   `{beat, size, subject, lens, move, focus, energy}` with a movement
   vocabulary (static, pan, dolly, push-in, pull-out, orbit, crane, whip pan)
   and camera-energy profiles (locked / steadicam / handheld — amplitude and
   frequency of seeded noise). Rack focus = animating DoF focus distance
   between named subjects (needs Phase 2's bokeh pass).
3. **Transition vocabulary**, split by an architectural line:
   - *In-scene, parity-preserving*: hard cut, flash cut (exists), whip-pan cut
     (accelerate, cut mid-smear), and **match cut as a compiler constraint** —
     shot N's exit framing must equal shot N+1's entry framing; the solver can
     verify it, turning the strongest cohesion device in film into a checkable
     property.
   - *Composited*: dissolve/wipe via two render targets blended on a
     fullscreen quad, mix a function of `t` — pure, costs a second render on
     transition frames only. (An ffmpeg-`xfade` edit-decision-list in
     `build.js` is the mp4-only power alternative; it forks MP4 from HTML, so
     it stays opt-in and clearly labeled.)
4. **Cut rhythm** as a parameter (average shot length, cut-on-action vs
   cut-on-rest) — a huge fraction of perceived vibe is this one number.

Vocabulary enters the compiler only after a film needed it: v1 is the solver,
the six sizes, three moves, two cut types. Orbits, match-cut constraints, and
dissolves earn their way in.

Semantics-axis upgrade for method.md: a shot list makes "why this shot?" a
reviewable authorial decision per beat, alongside "cover the caption."

Gate: a five-shot film authored entirely through `SHOTS` — zero hand-written
camera keyframes — including one match cut verified by the solver and one
whip-pan transition.

### Phase 4 — Style bibles and cast/set reuse

"Vibe" is every layer making consistent choices. A style bible is one
reference file that constrains all of them at once — palette and material
finish, lens set, framing rules, camera energy, cut rhythm and transition
vocabulary, easing temperament, texture/grain, caption typography. Descriptive
names (`planimetric-pastel`, `neo-noir`, `saturday-cartoon`,
`documentary-handheld`), never director names.

1. **Bible spec + 2-3 bibles**, each one page, each with a spiked frame.
2. **The control pair** (this phase's gate and its reason to exist): the same
   `BEATS` + cast rendered under two bibles must produce two categorically
   different films with zero beat or geometry edits. If a bible swap does not
   visibly change the film, the layers are not actually separated — that
   result would be a Phase 1-3 bug report, and finding it is the point.
3. **CAST/SET as reusable modules** — a character defined once (rig recipe,
   costume, motion idioms) and referenced by name from shots and blocking.
   Deliberately informal until a second film actually reuses a character;
   promoting it earlier is speculative abstraction.

### Phase 5 — Production extensions (opt-in, demand-driven)

Each of these is designed, none is built until a real film demands it — the
same discipline that has audio.md sitting unwired today.

- **Asset vendoring** (`build.js vendor-assets`): base64-embed a CC0 GLB or
  HDRI into the bundle. Keeps single-file/offline/deterministic
  (`sceneReady` already exists to gate on load). Relaxes the "no files" rule
  per scene, opt-in; bundle-size cost hits the HTML artifact, not the MP4
  path.
- **`build.js bake`**: the film-industry answer to the simulation ban. Run
  cloth/particles/ragdoll once at fixed timestep as a build step, write
  sampled results into the scene as data, play back by interpolation — again
  a pure function of `t`; `smoke.js` still passes. Sim → cache → playback.
- **Audio** (roadmap item 3): narration-drives-timing as designed in
  `references/audio.md` — possible at all because beats are data.
- **`build.js deploy`** (roadmap item 9's forward note): publish the bundled
  HTML scene to Pages / as an Artifact — the only delivery that keeps
  interactivity and sidesteps the raster tradeoff.
- **Path-traced hero frames** (exploratory): deterministic per-frame-seeded
  path tracing for still/short "money shots"; offline capture makes slow
  affordable, parallel capture makes it tolerable.

---

### Back-to-back execution mode

The phase contents above hold; four sequencing/scoping choices change when
the phases run continuously instead of demand-driven.

1. **Parallel frame capture moves to Phase 0/1.** Its "low priority, add
   anytime" verdict (roadmap item 5) assumed occasional films on local
   hardware GL. Back-to-back, render-look-edit is the inner loop for the
   whole effort and Phase 2's post chain multiplies the ~1 fps software-GL
   floor. Infrastructure that cheapens every subsequent iteration ships
   first; it touches no scene code, so pulling it forward is risk-free.
2. **Two persistent proving threads instead of a film per phase.** A 2D
   diagrammatic thread (born in Phase 1) and a 3D character thread (born in
   Phase 2, gains shots/editorial in Phase 3, becomes the Phase 4 control
   pair). Gates attach to the threads' milestones rather than to fresh
   throwaway films. Two threads, never one: a single evolving film would
   overfit the system to itself — the disease this whole plan exists to cure.
3. **Order is fixed: 0 → 1 → 2 → 3 → 4.** The 1↔2 swap option is for
   appetite-driven pacing only. Running continuously, the kernel must be
   extracted (Phase 1) before Phase 2 piles post-chain and quality-tier churn
   onto the 3D template — extracting shared code from a moving target is how
   the extraction goes wrong.
4. **"All phases" means 0-4.** Phase 5 is demand-gated *by design*; building
   bake/asset-vendoring/path-tracing speculatively is exactly the
   overcomplication failure mode. Pull a Phase 5 item into the run only when
   one of the two proving threads concretely hits its need (audio via
   narration-drives-timing is the likeliest candidate).

**Phase-exit checkpoint (mandatory in this mode).** Demand-driven pacing has
natural pauses where observations get harvested; back-to-back momentum blows
through them. Every phase ends with, in order:

- Harvest: new brackets, gotchas, and negative results into `method.md` /
  the style references, and the phase's status into the roadmap ledger.
- Release: cut the plugin version (the cascade), so history stays bisectable
  per phase instead of one mega-release at the end.
- Regress: re-shoot the fixed sample timestamps of every committed example
  and compare (byte-identical or the PSNR technique in `method.md`); a phase
  may not open while a prior phase's example renders differently unexplained.
  *(Annotation 2026-07-22: byte-identical holds only **within one renderer** —
  Metal vs SwiftShader is 0/288 identical at PSNR 57-58 dB. Change GL backends
  and this step must fall back to PSNR. And it compares one viewport: see
  "After the run".)*
- Prune: anything built this phase that the proving threads did not use gets
  removed before the next phase starts, not "kept for later."

---

### Cross-cutting rules (all phases)

1. **Every phase gates on a real film**, not on code review — the repo's own
   "build the control" applied to architecture. What the proving film did not
   need does not ship.
2. **Tooling talks only to the window contract.** If a phase tempts a tool to
   parse scene internals, the contract is missing an export (the `window.BEATS`
   precedent) — extend the contract instead.
3. **New perceptual rules ship with brackets** — an observation on each side
   or an honest "unbracketed, single observation" label, per method.md's
   existing standard. New instruments ship with a verified positive control.
4. **Determinism red lines per phase**: no temporal post passes; shared
   materials restated every frame; sims baked, never live; quantized time and
   seeded noise are pure — use them freely.
5. **Version cascade** fires on every phase that touches `templates/`,
   `references/`, or `examples/` (CLAUDE.md invariant 1) — which is all of
   them except this document.
6. **Duration stays the user's spec input; nothing in any phase assumes
   long-form.** "Film language" here means craft density, not runtime: the
   shot vocabulary, editorial grammar, and style bibles must read correctly
   on a 10-second three-shot explainer exactly as on a 40-second piece —
   `duration_s` and the beats table remain the only place length exists,
   set per spec by what the content needs. Every proving film in this plan
   is explainer-scale (the 15-40s SKILL.md pacing guidance), and a phase
   deliverable that only works at length is overfit and fails its gate.

---

## The per-item ledger

*What shipped, what was refuted, what stayed open. Several items shipped *differently* than designed; the deltas are the useful part.*

*Original file: `explainer_video_roadmap.md` — last updated: 2026-07-22*

Roadmap for the `explainer-video` plugin (currently **0.17.0**). Originally
written at 0.1.2 after finding the skill's central usability claim false; the
beats refactor that fixed it, and most of the review tooling designed here, have
since shipped. The design write-ups below are kept as history even where DONE —
several shipped *differently* than designed, and the deltas are the useful part.

The larger arc — style generalization, cinematic 3D, film language, style
bibles — lives in
[explainer_video_generalization_plan.md](#the-arc);
this file remains the per-item ledger. Note the plan's Phase 1 triggers the
flip condition the "Not doing: a 2D backend" entry below set for itself.

| # | Item | Status | Blocked by |
|---|---|---|---|
| 1 | [Named beats as the timing source](#1-named-beats-as-the-timing-source) | **DONE** (0.2.0) | — |
| 2 | [Beat-aware contact sheet](#2-beat-aware-contact-sheet) | **DONE** (0.6.0, as `build.js sheet`) | 1 |
| 3 | [Narration-driven timing](#3-narration-driven-timing-audio) | designed, unbuilt | 1 |
| 4 | [Caption lint](#4-caption-floor-lint-replaces-the-magic-number-lint) | **DONE** (0.6.0, advisory) | 1 |
| 5 | [Parallel frame capture](#5-parallel-frame-capture) | **CLOSED** — mechanism shipped 0.8.0; speed refuted on its own predicted best case | — |
| 6 | [Repo-wide version alignment check](#6-repo-wide-version-alignment-check) | open | — (not this plugin) |
| 7 | [Spike the hostile beat first](#7-spike-the-hostile-beat-first-methodmd-addition) | **DONE** (0.2.0, in method.md) | — |
| 8 | [The three-axis review model](#8-the-three-axis-review-model-06) | **DONE** (0.6.0) | 1 |
| 9 | [Inline delivery: AVIF vs WebP](#9-inline-delivery-the-format-comparison-06) | **DONE** (0.6.0), one test open | — |
| 10 | [A committed flagship example](#10-a-committed-flagship-example) | **DONE** (0.12.0, as `examples/toybot-walk.html`) | — |
| 11 | [Declared reference frames (`FRAME`)](#11-declared-reference-frames-frame) | **DONE** (0.16.0 containment + 0.17.0 `FRAME`) | — |
| 12 | [Width-aware framing (`EXTENT`)](#12-width-aware-framing-extent) | **DONE** (0.17.0) | 11 |
| 13 | [Register-aware lints](#13-register-aware-lints) | designed, deliberately unbuilt | a film that needs them |
| 14 | [Extract the cinematography solver](#14-extract-the-cinematography-solver-third-consumer-reached) | **DUE** — third consumer reached, not done | — |
| 15 | [JPEG capture for review passes](#15-jpeg-capture-for-review-passes) | candidate, measured, unbuilt | — |
| 16 | [`sheet 480 0.95` as a standing step](#16-sheet-480-095-as-a-standing-step) | open (a method change, not code) | 2 |

The 0.6.0 items (8, 9) and how 2 and 4 actually shipped are summarized next,
then the 0.16.0/0.17.0 pass; the older design write-ups follow unchanged from
item 1 down, and items 11-16 are appended after item 7.

---

### Shipped in 0.6.0 (the review-tooling session)

A large pass that gave the skill instruments for two failure axes it was blind
to, and — as importantly — recorded honestly where an instrument could **not** be
built. Detail lives in `references/method.md` (reorganized around the three axes)
and the root `CHANGELOG.md` 0.50.0 entry.

- **Contact sheet (item 2) shipped as `build.js sheet`, not `shoot.js sheet`,**
  and captions each cell via a stdout legend rather than `ffmpeg drawtext` —
  libfreetype is not guaranteed present in every ffmpeg build, and a hard
  dependency on it would fail the command. Samples `frac` into each beat (default
  0.6; `sheet <scene> 480 0.95` puts every beat at its end, which is what catches
  an effect that parks at the end of its ramp). Ships with a `.squint.jpg`
  thumbnail strip — the silhouette check the docs had asserted for months with no
  instrument.
- **`build.js strip`** — consecutive frames tiled, the only pixel-level look at
  the continuity axis for a reviewer that cannot play the film. Bracketed both
  ways: a whole-body jump is visible between cells, a 0.35 rad limb rotation is
  not. Catches world/object-level breaks, not limb-level ones.
- **`build.js motion`** — per-beat motion profile + dead-air report. It
  **deliberately does not** detect pops or stalls: that was built, measured
  against a known-bad scene, and cut when whole-frame statistics put the defect at
  1.00x its local baseline and the stall detector fired on a known-good film. A
  negative result, documented in the code and method.md rather than shipped as a
  check that lies.
- **Caption lint (item 4) shipped advisory, not as a hard-fail floor** — see the
  item 4 note below.
- **Exposure lint** — both tails (washed-out *and* crushed), because the wash rule
  turned out palette-conditional; a dark scene refuted the "every render is
  overexposed" law. Advisory.
- **`window.BEATS`** added to the scene contract, so tooling labels frames and
  checks caption timing without re-parsing source. A `manifest` shoot mode emits
  the beat table as JSON without rendering (used by `motion`).
- **`build.js video`** now warns and prints the re-encode command past the 10MB
  attachment ceiling.

---

### Shipped in 0.16.0-0.17.0 (the test-suite session)

Not a phase of the generalization plan — this is what fell out of *running*
[the test suite](#the-test-suite) against the 0.15.0 plugin. Every
defect it found was already there when the back-to-back run closed at its gates;
none of them was findable from inside that run, for a structural reason recorded
in the plan's post-run section: every proving film was authored and reviewed at
one viewport.

- **0.16.0 — framing.** The HTML loop and the recorded formats agreed in *time*
  and not in *framing*. Both backends now contain a 16:9 design frame; see item
  11.
- **0.17.0 — the reference-frame pass.** One declared `FRAME` per scene,
  frame-relative overlays, `EXTENT`, a framing-invariance check in `smoke.js`,
  and `build.js aspect`. Items 11 and 12.
- **`build.js all` could silently encode the wrong frames.** `frames()`
  overrode ambient `FRAMES_DIR` while `video()` honored it, so
  `FRAMES_DIR=X build.js all` shot into `frames/` and encoded from `X/`.
  Measured: one stale frame in `X` produced a **0.0 MB one-frame mp4, exit 0,
  printed as success**. This is the same ship-the-wrong-film failure the comment
  inside `video()` claims to have closed, reintroduced through the other half of
  the pair — the argument for fixing a class at the seam rather than at one
  call site.
- **SKILL.md's description was 1150 characters against the Agent Skills 1024
  limit.** Pre-existing; surfaced only because 0.17.0 had to touch the file.

Two instrument findings from the same session that changed no code and are
recorded as brackets: `build.js motion`'s dead-air detector measures pixel
**contrast, not activity**, against a **global** median (item 13's evidence),
and the end-of-beat contact sheet caught two defects the default sample
structurally cannot show (item 16).

---

### 1. Named beats as the timing source

> **Shipped in 0.2.0.** Built as designed, with one addition the design missed:
> a seconds-from-beat-start form (`rampS`/`pulseS`/`secAt`) alongside the
> fractional one. Fractions are right for anything that should stretch when a
> beat is retimed, but a 0.25s flash and a 0.06s world cut are *physical*
> durations — stretching them uncovers the cut. Also added `capEnd`, for a
> caption that must end before its beat does. Items 2, 3 and 4 are now unblocked.

#### The problem

`SKILL.md` says: *"Retiming a beat later is a one-line edit."* That is false. Beat
timing currently lives in three unrelated places:

1. `CONFIG.captions` — `{a: 2.4, b: 4.6, s: "..."}`
2. numeric literals scattered through `animate()` — `ss(t, 5.0, 6.9)`, `bump(t, 6.6, 7.6)`
3. the camera rail — `KEYS[].t`

Retiming means hunting magic numbers across the file and hoping you found them
all. Nothing catches a miss: the scene still renders, just wrong.

This is structural, not a discipline problem. The strongest evidence is that
`examples/skill-retrieval.html` was written *in the same session as the critique
describing this flaw*, and has the flaw — `ss(t,2.4,4.4)`, `ss(t,5.0,6.9)`,
`bump(t,6.6,7.6)` each restate a caption window as a literal. The template makes
magic numbers the path of least resistance, so warnings in `SKILL.md` will not
fix it. Only changing the path will.

#### The design

One `BEATS` array is the sole timing source. Everything else derives.

```js
const BEATS = [
  {name: 'title', dur: 2.2},
  {name: 'scan',  dur: 2.4, cap: "1 · every description is an index entry — all are candidates"},
  {name: 'load',  dur: 3.4, cap: "2 · only the match is loaded into the context window"},
];
```

Durations **accumulate**; starts are derived. That is what makes the one-line-edit
claim true — lengthening `scan` shifts `load` automatically instead of silently
overlapping it. `CONFIG.duration` becomes the sum, so it can never disagree with
the beats.

Resolution happens once at load:

```js
let _acc = 0;
const BEAT = {};
for (const b of BEATS) { BEAT[b.name] = {...b, t0: _acc, t1: _acc + b.dur}; _acc += b.dur; }
const DURATION_S = _acc;
```

#### The addressing primitive

Almost nothing spans a whole beat — things happen in the first third, or the last
20%. So the core helper takes a fractional sub-range:

```js
// ramp(t,'load')       -> 0..1 smoothstep across the whole beat
// ramp(t,'load',0,.6)  -> 0..1 across the first 60% of it
// ramp(t,'load',.5,1)  -> 0..1 across the back half
function ramp(t, name, a = 0, b = 1) {
  const B = BEAT[name];
  return ss(t, B.t0 + a * B.dur, B.t0 + b * B.dur);
}
function pulse(t, name, a = 0, b = 1) {      // rise-and-fall, same addressing
  const B = BEAT[name];
  return bump(t, B.t0 + a * B.dur, B.t0 + b * B.dur);
}
const during = (t, name) => t >= BEAT[name].t0 && t < BEAT[name].t1;
```

Migration is then mechanical and readable:

| before | after |
|---|---|
| `ss(t, 2.4, 4.4)` | `ramp(t, 'scan')` |
| `ss(t, 5.0, 6.9)` | `ramp(t, 'load', 0, .56)` |
| `bump(t, 6.6, 7.6)` | `pulse(t, 'load', .53, .82)` |
| `ss(t, 4.15, 4.6)` | `ramp(t, 'scan', .73, .92)` |

The fractions read worse than the literals in isolation, which is worth naming
honestly. The gain is that they are *relative* — retiming `scan` moves them all
correctly, and a reader can see that an effect belongs to `scan` without holding
the beat table in their head.

#### Captions and camera derive

Captions stop being a parallel list. `setOverlay` walks `BEATS`, showing `cap`
where present, insetting the fade from the beat edges:

```js
const CAP_FADE = .35;   // fade in/out inset, seconds
```

The camera rail addresses beats too, so a keyframe cannot drift away from the
beat it was framing:

```js
const KEYS = [
  {beat: 'title', at: 0,  p: [0,0,19.5], l: [0,0,0]},
  {beat: 'load',  at: 1,  p: [0,0,19.5], l: [0,0,0]},
];
// resolved to absolute t once, at load
```

`at` is the fractional position within the named beat, same convention as `u`.

#### Migration

Three files, in order: `templates/scene.template.html`, then
`examples/skill-retrieval.html` (small, 2 beats — do it second as the proving
run), then the longer worked example (20s, 5 beats, two worlds — the real
test).

`smoke.js` is the safety net and it is already sufficient: it byte-compares
`seekTo(t)` before and after seeking away. A migration that shifts any timing
changes rendered output, so **shoot the same sample timestamps before and after
and diff the PNGs**. Identical output means the refactor was behavior-preserving.
That check should be part of the migration, not an afterthought.

#### Cost

Roughly: template ~40 lines changed, `skill-retrieval` ~15, the longer example
~60, plus `SKILL.md` steps 1-2 and a `method.md` section. Half a session.

---

### Why beats first

Not just "the cost only goes up." Three of the remaining items are *blocked* on
it, and doing them first means building them against a shape already decided to
be wrong:

- **Contact sheet** needs to know where beats are to sample and label them.
  Without `BEATS` it takes a hand-passed timestamp list, which is the magic-number
  problem again in a new place.
- **Narration-driven timing** has to *write beat durations back* from measured
  speech lengths. There is nothing to write back to until durations are data.
- **The lint** exists to enforce the helpers, which do not exist yet.

Only parallel capture is genuinely independent.

---

### 2. Beat-aware contact sheet

> **Shipped in 0.6.0**, with two deltas from the design below:
> - It is `build.js sheet`, not `shoot.js sheet` — the tiling/legend belongs with
>   the other ffmpeg pipeline steps.
> - Cells are **not** captioned with `ffmpeg drawtext`. libfreetype is not
>   guaranteed present in every ffmpeg build, so a drawtext dependency would fail
>   the command on some installs; the legend (beat name + `t`) prints to stdout
>   instead, and the reviewer reads it beside the image.
>
> It also samples `frac` into each beat (default 0.6), not a fixed midpoint —
> `sheet <scene> 480 0.95` puts every beat at its *end*, which is what surfaces an
> effect that parks at the end of its ramp. And it ships a `.squint.jpg`
> thumbnail strip for the silhouette check.

The iteration loop is the real bottleneck — the longer example took four rounds of
render-look-edit. Right now that means picking timestamps by hand and opening
PNGs one at a time.

```bash
bun run build.js sheet <scene>.html          # tiled PNG, every beat + a squint strip
```

Renders a point in each beat, tiles them into a single image. One look tells you
which beat fails — and, tiled, which failures are *systematic* (the same framing
error across every beat is one bad camera formula, invisible one frame at a time).

---

### 3. Narration-driven timing (audio)

`references/audio.md` currently fits narration into pre-decided beat windows and
validates that each clip fits. That is backwards from how explainers are actually
made: you write the script, and the speech duration dictates the beat length.

With named beats, both directions work and narration-drives-timing becomes the
default:

```yaml
audio:
  mode: narration-drives-timing        # default; or `fixed` to keep beat durations
  narration:
    - {beat: scan, text: "Every skill's description is an index entry."}
    - {beat: load, text: "Only the match is loaded into the context window."}
```

Pipeline: TTS each line → `ffprobe` its duration → set `BEATS[i].dur = max(clip +
padding, min_beat)` → re-render. Under `mode: fixed` the current behavior is kept
and a clip that overruns its window is an error.

This is the item that most needs beats to be data rather than literals — there is
no way to write a measured duration back into `ss(t, 5.0, 6.9)`.

Still deliberately unbuilt until a real narration request lands: voice, language,
and licensing are the user's decisions, and guessing them is how you get an
unwanted dependency.

---

### 4. Caption floor lint (replaces the magic-number lint)

> **Shipped in 0.6.0 — but advisory, not the hard-fail floor designed here.**
> Every lint in `smoke.js` (caption speed, caption overflow, exposure) prints a
> `warn` line and never touches the exit code, on the same reasoning the design
> below reaches for: a gate on a judgment call gets bypassed. So rather than
> hard-fail at ~35 CPS and stay silent below, it warns at **30** (inside the
> unresolved 27-comfortable / 37-unreadable gap, biased to the confirmed-good
> end) and is otherwise quiet. The "a proxy can reject, cannot approve" principle
> still holds — a passing scene is unjudged — it is just enforced by not failing
> rather than by a one-sided threshold.

**Revised twice, and the second revision is the one to build.**

The original design was a magic-number detector — heuristic, false-positive
prone, and largely obsoleted when the beats refactor removed the literals
structurally. It was replaced by a caption reading-speed lint, which was then
invalidated in practice: the threshold (17-21 CPS) came from arithmetic, and one
viewer watching three seconds of video read a 27 CPS caption comfortably.

The usable rule that survives is about proxies generally, not captions:

> **A proxy can reject. It cannot approve.**

The characters-per-second metric was not useless — it correctly flagged a caption
at 37 CPS that was genuinely unreadable. It was wrong at 27, where it had no
authority. The error was granting its entire range decision power when it only
has a confident region and an uncertain one. A passing score in the uncertain
region means nothing and must not read as approval.

So the lint that earns its place is a **floor**, not a pacing tool:

- Hard-fail somewhere around 35+ CPS of effective window — the egregious case,
  where you do not need to watch it to know it is broken.
- **Silent everywhere below.** No warning band, no "tight" verdict. A caption
  that passes has not been judged, and the output must not imply it has.
- Report the effective window (`1.5s effective, 3.3s needed`), never just
  "too long" — the cause is often a `capEnd` trim or fade the author forgot,
  not word count.

The ~35 CPS figure is **bracketed by observation on both sides** — 37 watched and
found unreadable, 27 watched and found comfortable — which is the evidence the
original 17-21 threshold never had. But it is one viewer and two data points.
Tighten the bracket as more scenes get watched; do not treat 35 as settled.

Near-zero false positives by construction, which is what makes it safe to gate.
Built in 0.6.0 (advisory — see the banner above), after the JS stabilized.

### 4b. Magic-number lint (dropped)

Advisory, and honestly heuristic. After the refactor, warn when `animate()`
contains a numeric literal as the 2nd or 3rd argument to `ss`/`bump`:

```
warn: skill-retrieval.html:142 — ss(t, 5.0, 6.9) uses literal timings.
      Use ramp(t,'<beat>',a,b) so retiming a beat moves this with it.
```

Scoped to the `animate()` body by brace matching, because literals elsewhere are
legitimate — `setOverlay`'s `ss(t, .2, .8)` title fade is a fade inset, not a
beat. Suppressible with a trailing `// literal-ok` for the genuine exceptions.

**Warning, never a failure.** A brace-matching heuristic will have false
positives, and a gate that cries wolf gets bypassed — which is exactly the
staleness-metric lesson from 0.32.0. If it proves reliable over a few scenes,
revisit promoting it.

---

### 5. Parallel frame capture

> **Shipped in 0.8.0** (Phase 1 of the generalization plan pulled it forward —
> back-to-back execution makes iteration cost the inner loop). Built as
> designed: `--workers N` or `SHOOT_WORKERS=N`, contiguous chunks, N pages in
> one browser. Correctness verified: 4-worker output is **byte-identical** to
> 1-worker output on the template scene, 48/48 frames.
>
> **The speed prediction below was refuted where it was made.** "The ~1 fps
> software-GL case is where this would matter" — measured on a 4-core
> software-GL container: 25.1s single vs 26.1s with 4 workers, ~1.0x.
> SwiftShader already multithreads a single page's rasterization across the
> cores, so extra pages only contend. The remaining win case is a many-core box
> or hardware GL, where one page cannot saturate the machine — plausible,
> unmeasured. Recorded per the build-the-control rule: the mechanism is
> correct, the benefit is environment-conditional and so far undemonstrated.
>
> **CLOSED 2026-07-22 as a measured negative on its own predicted best case.**
> The remaining open above named the win case exactly: "a many-core box or
> hardware GL." Measured there (24 cores + hardware GL via ANGLE Metal, 288
> frames @ 24fps): **~1.1x at both 4 and 8 workers**, and ~1.0-1.05x on the same
> box under SwiftShader. The premise was wrong at the root — capture was never
> GL-parallelism-bound. It is **screenshot-bound**, and PNG encode serializes
> through the browser process, so adding pages adds contention on the one
> resource that was already the bottleneck (Round 0 of the test suite: on
> hardware GL ~95% of capture time is the screenshot, not the film). The
> feature stays — it is correct, byte-identical, and costs nothing — but it is
> no longer a lever anyone should reach for. The lever that the same measurement
> *did* find is item 15.



Falls straight out of determinism: frames are independent, so N headless pages can
each shoot a contiguous 1/N of the range with zero correctness risk. Contiguous
chunks rather than a stride, so a failed worker leaves an obvious gap.

```bash
bun run shoot.js <scene>.html full 30 --workers 4
```

**Low priority.** Measured 5.3 fps on local hardware GL — a 20s/30fps film is
about two minutes. The ~1 fps software-GL case is where this would matter, and
that is CI/cloud, not the common path. Nothing is lost by waiting: determinism
means this can be added at any time without touching scene code.

---

### 6. Repo-wide version alignment check

Not this plugin, but surfaced by it and still open.

`path-privacy` sat at 0.1.1 in `marketplace.json` while its `plugin.json` had
reached 0.1.6 — five releases where installs resolved a stale version. It was
found by accident, when an unrelated edit touched the plugin and the pre-commit
hook fired.

`skill-maintain test` should assert `marketplace.json` version == `plugin.json`
version for **every** plugin on every run, not only for the one being touched.
Cheap, and it closes a hole that persisted across five releases.

Related but not the same: CLAUDE.md invariant 1 was clarified in this repo (a
skill plugin's `templates/`/`references/`/`examples/` edits trigger the cascade,
not just SKILL.md) — that documents *when* to bump; this item is the automated
check that the bump actually landed everywhere. Still open.

---

### 8. The three-axis review model (0.6)

The skill's whole method was "render frames and look at them," which only covers
failures visible *within* a single frame. `method.md` is now reorganized around
three independent axes, because the reorganization is what made the gaps visible:

- **Composition** — fails inside one frame (framing, occlusion, exposure, hidden
  internals). Instrument: look at stills / the contact sheet. Well covered.
- **Continuity** — fails *between* frames (pops, stalls, sliding feet). No metric
  works (see the `motion` negative result above); reviewed by watching the loop,
  `build.js strip`, and three named source-level shapes. This axis had **zero**
  coverage before 0.6.
- **Semantics** — every frame is right and the film still explains nothing.
  Test: cover the caption, ask what the beat is about. A beat that only works with
  its caption is a slideshow with a 3D background.

The load-bearing lesson, worth keeping: a real scene got four thorough rounds of
look-and-edit that converged composition cleanly, and two continuity defects rode
through untouched to a confident all-clear. Rounds of *looking* converge the axis
stills can show and do nothing for the other two.

---

### 9. Inline delivery: the format comparison (0.6)

Four ways to deliver a scene, and — by explicit decision — **no forced default**.
Each wins on a different axis; the choice is the user's, per context. The job of
the tooling and docs is to surface the tradeoff, not to pick.

| Delivery | Size | Plays inline in a README? | Playback | Audio | Notes |
|---|---|---|---|---|---|
| **HTML+JS scene** | n/a (hosted) | No (github.com strips `<script>`) | Interactive, exact | — | The source of truth and the richest form; runs on Pages or a published Artifact. `build.js bundle` makes it a single offline file. |
| **MP4** | small | No — served as `text/plain`; needs an issue/PR attachment URL for a player | Hardware-decoded, smooth everywhere | Yes (attachment player) | The only path with audio. |
| **AVIF** | smallest (measured 7-54x under WebP) | One real-world observation, not independently confirmed | Software-decoded AV1 sequence — heavier; low-end smoothness unconfirmed | Silent | Lifts the held-camera constraint. |
| **WebP** | largest (ruinous on a moving camera) | Yes, verified | Light, smooth | Silent | Inline rendering is the best-verified case. |

These are **peers**, not a ranking. Keep the measured facts (sizes, the AVIF
decode cost, the content-type mechanism, browser support) as decision inputs in
`method.md`; do not phrase any one as "the default." The single open empirical
question is whether animated AVIF stays smooth on genuinely low-end hardware —
until that is watched and recorded, none of the three raster formats is presented
as safer than the others, just *different*.

Forward: a first-class **deploy-the-HTML-scene** path (package the bundled scene
and publish it to Pages / as an Artifact) is worth treating as a real delivery
option rather than a footnote — it is the only form that keeps the interactivity
and the determinism, and it sidesteps the raster tradeoff entirely. Possible
`build.js deploy` helper; not built.

---

### 10. A committed flagship example

> **Shipped in 0.12.0** as `examples/toybot-walk.html` — the Phase 2 spike of
> the generalization plan: a character, a moving camera, world entry to payoff
> end-to-end, and beyond what this item asked for — cel shading with
> inverted-hull outlines, analytic two-bone IK, rack-focus DoF, and bloom
> through a post chain proven byte-deterministic. Committed as a 0.13 MB
> animated AVIF (moving camera — WebP's punishing case). A longer multi-world
> walkthrough remains possible later, but the character/moving-camera path
> this item wanted demonstrated is demonstrated.

The repo ships exactly one example: `examples/skill-retrieval.html` — 11s,
held-camera, diagrammatic (now in html/webp/avif). There is **no committed
character/"Playful"-style example**; SKILL.md admits as much. The flagship
walkthrough that exercises a figure, world cuts, and a moving camera was built in
a sibling project and is not committed here.

Worth a committed hero example that shows the character/moving-camera path end to
end — it is the case the diagrammatic sample cannot demonstrate, and the one most
likely to be copied from. Open; deliberately not auto-created.

---

### 7. Spike the hostile beat first (method.md addition)

From a walkthrough built in a sibling project, generalized into `method.md`
rather than lost here.

That film is 30s and six beats, and one beat is a violently wobbling wheel driving
a second geared one — every pixel changing every frame, which is precisely the
case that defeats inter-frame compression. It is simultaneously the most
important beat and the most compression-hostile one.

The move: **build and encode the single hardest beat first**, before the other
five exist. Seven seconds of work answers both open questions at once — does the
motion read without a caption, and does it encode small enough to sit inline.
Fail the first and the premise is wrong. Fail only the second and the delivery
plan changes, not the film.

Generalized rule for `method.md`: identify the beat that is both load-bearing and
compression-hostile, and spike it before committing to the full beats table. This
is the same "iterate by looking, not by hoping" discipline applied to the encode
step, which currently has no equivalent early check — the skill tells you to look
at frames but says nothing about testing the delivery target early.

Note this rule also mostly disappears if the scene holds the camera, since the
whole problem is per-frame change. It matters for the moving-camera case.

---

### 11. Declared reference frames (`FRAME`)

> **Shipped in two releases, and the second is the one that generalizes.**
> 0.16.0 fixed the symptom: both backends now *contain* a 16:9 design frame
> instead of pinning one axis. 0.17.0 fixed the class: a scene **declares** its
> reference frame (`FRAME = {aspect, px}`, exported as `window.FRAME`) and
> everything that measures or composes reads it.
>
> The design below did not exist in advance — this item is written after the
> fact, because the defect was found by a human resizing a window, not by any
> instrument. That is the entry's main value.

#### The defect (0.16.0)

`SKILL.md`'s headline claim is that the film is a pure function of `t`, so *one
scene file drives the live HTML loop and the frame-exact render alike*. They
were identical in **time** and not in **framing**.

- The 2D template scaled by `canvas.height/VIEW_H` alone, so visible world
  *width* was a function of viewport aspect.
- The 3D solver pins the *vertical* extent (`dist = h/f/(2·tan(fov/2))`), so
  horizontal extent is vertical × aspect.

Different mechanisms, same assumption, same consequence: **any window narrower
than 16:9 silently cropped the sides.** Measured on a fixed world point at
`(3,3,0)` in the 3D template, aspect 1.78 → 1.40: `ndc.x` went **0.913 →
1.161** (off-frame) while `ndc.y` held constant to four decimals.

**It was invisible to the entire test surface by construction.** No tool in the
chain ever opened a non-16:9 viewport — `shoot.js` pinned 1920×1080, `smoke.js`
used 640×360 and 1920×1080, `build.js` opens no browser at all. Every recorded
artifact was 16:9 and therefore correct; only the live HTML could exhibit it,
and only a human resizing a window would see it. One did.

Per-scene crop thresholds, measured (the aspect at which content starts leaving
the frame):

| scene | crops below |
|---|---|
| `examples/toybot-walk.html` | **1.66** — 7% margin at 16:9 |
| `templates/scene2d.template.html` | 1.45 |
| `examples/skill-retrieval.html` | 1.30 |
| `examples/one-scene-every-format.html` | 1.07 |

Worst hit is the shipped flagship: at 1.40 the sign was cut out of toybot's
rack-focus shot — the exact failure that scene's own code comment ("both
subjects must be visible") exists to prevent. The comment was right and the
renderer moved the goalposts underneath it.

The fix is the identity at 16:9, which is what made it cheap: verified
**byte-identical at 1920×1080 across all five shipped scenes at two
timestamps**, so no committed artifact needed re-rendering.

#### The generalization (0.17.0)

The diagnosis that made this worth a second release: *every* defect found in
this session came from a measurement or a composition made against an
**undeclared reference frame**. An audit found ten different implicit frames,
several mutually inconsistent — the canvas scaled by window height; captions
sized in fixed CSS px against the window but positioned in percent of the
window; the shot ladder against frame height; `smoke.js` measuring exposure at
640×360 but caption overflow at a hardcoded 1920; `motion`'s dead-air threshold
relative to a global median. What shipped:

- **`FRAME`** — one declared reference frame per scene, exported on `window`.
  `shoot.js` sizes its viewport from `FRAME.px` instead of hardcoding
  1920×1080, which makes **9:16 vertical and 1:1 square output first-class**;
  they were previously impossible by construction, no matter what the author
  wrote. `SKILL.md`'s `aspect: 16:9 default` spec field was decorative —
  nothing read it — and is now the single source.
- **Frame-relative overlays** — captions and titles sized *and* positioned as
  fractions of the design frame, via CSS vars the scene publishes. This closes a
  **separate** parity gap that 0.16.0 did not fix: containing the canvas does
  nothing for a DOM overlay measured against the window. Not byte-identical
  (PSNR **79.0 dB** 3D / **74.0 dB** 2D, above `method.md`'s 70 dB imperceptible
  bar, localized to the caption pill's antialiased edge) — the one place this
  pass changed pixels, and it is recorded rather than smoothed over.
- **Framing-invariance check in `smoke.js`** — samples the design frame at three
  window shapes across three timestamps and fails if its contents change.
  Bracketed both ways: known-bad pre-fix templates score **24-31** mean-abs-luma,
  correct scenes score **0.07-0.12**, threshold **8** sits in the gap.
- **`build.js aspect`** — a visual diagnostic tiling one moment at four window
  shapes. It exists because the lint can *reject* a scene and cannot *approve*
  one (item 4's rule), so the author still has to look.

Two false starts in building that check, worth recording because both are the
repo's own documented failure modes recurring:

1. The first version sampled a single `t` that landed on a near-blank title
   card and reported all-clear on a template **known** to crop. A green control
   that never ran — the same shape as the dynrange bracket caught during Phase 1.
2. The second read a **stale canvas**, sampling before the scene's resize
   handler landed. Same class as the `smoke.js` sampling race already in the
   plan's postmortem.

An instrument for a spatial property needs a spatial *and* temporal positive
control. One timestamp is not a control.

### 12. Width-aware framing (`EXTENT`)

> **Shipped in 0.17.0**, from a finding the test suite produced before the
> framing work started (case D4).

`SIZES.f` is "subject height ÷ frame height", so the framing solver derived
distance from height alone and never consulted width. Anything wider than
**~1.8× its declared height cropped at `FS` and tighter** — which means wide
subjects (timelines, org charts, waveforms, supply chains: a large share of the
explainer domain) could only ever use EWS/WS, collapsing the shot variety the
ladder exists to provide. Compounded by item 11: the ladder was
height-calibrated *and* the viewport was height-calibrated, so a wide subject
was squeezed twice.

Subjects may now declare `w` alongside `h` in `EXTENT`, and framing binds on
whichever axis is tighter. Backward compatible: an upright subject where
`w <= h*aspect` frames exactly as before.

The craft answer recorded alongside it still stands and is the better first
move — inflating `h` pulls back but leaves the subject small in a tall empty
frame; pushing in on a **narrower named sub-subject** is both better cinema and
uncropped. `EXTENT` exists for when the wide thing genuinely is the subject.

This is the third instance of the postmortem's convention-pre-flight pattern
(shot sizes, ink polarity, gait anchoring were the first three; the size ladder
assuming an upright subject is of the same shape).

### 13. Register-aware lints

**Designed, deliberately not built.** Two candidate instances exist; neither has
a film that is blocked on it, which is the earn-in bar.

Every lint in `smoke.js` compares against a universal constant. But the plugin's
whole Phase 4 thesis is that a **register** is a declared intent — `STYLE` and
`BIBLES` say what the film is supposed to look like. A lint that ignores that
declaration is measuring departure-from-average when the useful signal is
departure-from-*intent*.

The evidence, all measured, all from registers behaving exactly as designed:

- **Crush at 84% on `midnight`** — the neon-dark pack predicted this hazard two
  phases before the film existed. Correct by intent.
- **Dynamic range 0.0 on D4** at both tails, on a film correctly exposed by
  eye: sparse bright subjects on a near-black field put p05 and p95 both in the
  background.
- **Dead-air on blueprint's fine linework.** The submit beat drew three evidence
  rules sequentially and `motion` reported dead air across the identical window
  before and after the rules changed from an alpha fade to a sequential
  `drawOn`. The control — same timing, same geometry, **only** stroke weight
  ×3.7 and colour changed — cleared that flag and manufactured **three new ones
  in other beats**.

Two conclusions from that last control, and they are the design input:

- The detector measures **pixel contrast, not activity**. Thin low-alpha
  linework animates without registering, and blueprint is precisely the register
  that draws thin low-alpha linework.
- The threshold is relative to a **global median**, so a dead-air report is not
  a stable per-beat property at all — it is a statement about one beat relative
  to the rest of *that particular cut*. Making one beat busier pushes quieter
  beats below the line.

The design: have `STYLE`/`BIBLES` declare an expected exposure and ink envelope,
and have the lints check departure from *that*. Not built. The rule that keeps
it unbuilt is the same one that kept quality tiers unbuilt through Phase 2 —
nothing is hurt enough yet, and every instance so far was correctly resolved by
looking. Build it when a film's register makes a lint useless rather than noisy.

### 14. Extract the cinematography solver (third consumer reached)

**DUE. Not done.** This is a ledger entry recording an unpaid debt, not a plan.

The plan's postmortem set the trigger itself: the solver existed in two copies
(3D template + `examples/toybot-walk.html`) with no drift guard — the kernel
markers cover only the deterministic kit, not the solver — and *"two copies is
the repo's tolerated maximum; at a third consumer, extract or marker-fence
it."*

The test suite's 3D films are that third consumer. The threshold is reached and
the extraction has not happened, which means the trigger fired and was not
acted on — worth stating plainly, because a rule that quietly slips its own
condition is worse than no rule.

Shape, per the repo's own precedent (CLAUDE.md invariant 3 — *editorial note: that
numbering is the PREDECESSOR's; this repo's invariant 3 is the plugin-layout rule,
and the mirrored-copies-plus-parity-check idea lives in invariant 2 and
instruments.md*, and the kernel block
itself): **marker-fence plus a hard-fail drift test in `smoke.js`**, not a
build step. Scenes stay single-file. The kernel block already proved the pattern
works on templates, including its positive control (a one-character mutation
fails the suite).

### 15. JPEG capture for review passes

**Candidate. Measured, unbuilt.** Surfaced by Round 0 of the test suite, and it
is the lever item 5 was looking for in the wrong place.

Two independent bottlenecks exist in capture, and fixing either alone leaves the
other: software rasterization of a post chain, and **PNG encode / CDP
transfer**. Same readback path, encode swapped, on hardware GL: JPEG q90 is
**5.7x** faster on the flat template and **6.5x** on toybot. On hardware GL
roughly **95% of capture time is the screenshot, not the film**.

The proposal: the **review** passes (`sheet`, `strip`, sample frames) already
emit `.jpg` at the end, so they could shoot JPEG directly for ~6x. Final
MP4/WebP/AVIF renders keep lossless PNG, unconditionally — the determinism
byte-check and every shipped artifact stay on the lossless path, the same
"preview exists to iterate, never to verify" rule Phase 2 pre-decided for
quality tiers.

Deliberately not implemented during the test run: changing the instrument while
using it to measure is how a green board gets manufactured. Logged here to be
built as its own change with its own control.

Related environment fact from the same round, which belongs with this item
because it decides where any of it matters: **`shoot.js` hardcodes
`--use-angle=swiftshader`**, so the recorder pinned software GL regardless of
hardware. "Book a hardware-GL session" was never only about the machine — the
tool opted out. On an M2 Ultra, hardware GL is worth **55x** on the `seekTo`
draw for a post-chain scene, **2.6x** end-to-end, and ~nothing for a flat scene.

### 16. `sheet 480 0.95` as a standing step

**Open — a method change, not code.** The instrument already exists (item 2
shipped `frac` sampling for exactly this); what is proposed is promoting the
end-of-beat pass from an option to a required step in the review loop.

Evidence, from case A2: the 0.95 sheet caught two defects that the default 0.6
sample **structurally cannot show**, because both are end-of-beat states —

1. a payload dot arriving at empty space, because its target box drew a beat
   late;
2. a connector routed *through* a box interior instead of approaching from
   outside.

Both are timing/geometry errors that are correct at mid-beat and wrong at the
edge. A mid-beat sample is not a weaker look at the same thing; it is a look at
a different moment, and a whole class of defect lives only at the boundary.

Counter-argument to weigh before adopting: it doubles sheet render cost, and
render cost already taxed every review round in the back-to-back run. Item 15
would pay for it several times over, which is an argument for sequencing 15
first.

### Not doing

- **GIF output.** GitHub renders it, but it lost to WebP on every axis measured
  (12.08 MB vs 15.56 MB on a hostile scene; WebP wins outright on a friendly one)
  and it has no audio and visible banding. WebP plus the poster path covers it.
- **Baking audio into the scene file.** Keeps the artifact self-contained and
  small; muxing stays a separable post-step that never re-renders frames.
- **A 2D backend.** The contract already permits one — `smoke.js` was fixed in
  0.1.2 to stop asserting `window.THREE`, so any scene exposing the four globals
  gets frame-exact MP4s. Worth building only when a real 2D sequence is wanted;
  the point is that nothing now blocks it.

---

## The test suite

*Cases written as falsifiable hypotheses, with outcomes filled in. This is the measured-findings ledger mitate inherits.*

*Original file: `explainer_video_test_cases.md` — last updated: 2026-07-22*

A diverse test suite for the `explainer-video` plugin, written against **0.15.0**
(the state after the back-to-back Phase 0–4 run) and executed through **0.17.0**,
which shipped the fixes the suite found. Companion to
[explainer_video_generalization_plan.md](#the-arc)
(the arc) and [explainer_video_roadmap.md](#the-per-item-ledger) (the
per-item ledger). This file is the **exercise sheet**: films to build that span
the capability surface and aim at the plan's own stated opens.

Not plugin content (`docs/internals/`), so no version cascade — see the plan's
cross-cutting rule 5.

### How to read a case

Every case is a **hypothesis**, not just a prompt. That is the repo's
"build the control" discipline (`references/method.md`) applied to testing: a
case earns its place only if it can come back either *worked* or *didn't*, and
the prediction is written down before the render so the result can refute it.
Each line carries: backend + register/style + a delivery target, **what it
probes**, and **the hypothesis** (what should work, and what to watch).

Fill in an `Outcome:` under a case after building it. An outcome that matches
the hypothesis is a confirmation; one that doesn't is the valuable kind — it
goes back to `method.md` or the roadmap ledger as a bracket or a gotcha.

Render cost is real: minutes per contact sheet on software GL, per the plan's
postmortem, and the continuity axis's strongest instrument (watching the loop
at speed) needs a human. Every continuity verdict below carries the
"owner hasn't watched it yet" asterisk until someone does.

---

### Coverage map — cases against the plan's open questions

The highest-value cases are the ones that aim at something the plan admits is
unproven. Mapping is explicit so the suite can't drift into only testing the
happy path:

| Open question (from the plan / postmortem) | Case(s) |
|---|---|
| Every committed film is self-referential; external-subject semantics never stressed ("the real Phase 6") | A3, A5 |
| Watch-the-loop is human-only; outstanding on all three committed films | C3, D1, and every case's continuity verdict |
| AVIF inline smoothness on low-end hardware unconfirmed | B2, C4 |
| The 2D shot-solver is unbuilt (earn-in item) | D2 |
| IBL / procedural Sky / PMREM unverified on hardware GL (blacks out SwiftShader) | C5 |
| Caption bracket thin — 37–50 CPS band unmapped, ledger wants the next point | D3 |
| Convention pre-flight: new-craft vocabulary shipped wrong three times | C1, C2, D6 |
| Determinism pull on physical-process scenes (momentum/decay/trails) | D1, B3 |
| Assertion-shaped beats (film-from-a-document hazard) | A3, A5 |
| Film language must read at explainer scale, floor and ceiling | D4, D5 |
| Cinematography solver exists in two copies with no drift guard | (maintenance, not a film — see note at end) |

---

### Track A — Domain-agnostic explainers

The core claim under test: only the geometry and the caption register change
with domain; the contract, beats, and pipeline do not.

#### A1 · How a heat pump works
3D cross-section · technical · WebP.
**Probes:** the one cross-section rule (internals must sit *proud of* the front
face, never hidden inside the slab) + closed-form physics of a refrigeration
cycle (compression, phase change, expansion — all pure functions of `t`).
**Hypothesis:** works; the trap is burying the compressor inside solid geometry
where the squint strip can't see it. A held camera makes WebP the right
inline format.
*Outcome:* —

#### A2 · Our approval process
2D diagrammatic · blueprint pack · WebP.
**Probes:** the best-verified happy path — held camera, a pulse traveling
labeled edges between stations. `examples/skill-retrieval.html` is the
reference shape.
**Hypothesis:** the cleanest win in the suite; serves as the baseline the
harder cases are judged against. If this needs more than 2 composition rounds,
something regressed.

**Outcome (2026-07-22): PASS — but it took 3 composition rounds, not the
predicted ≤2, and it produced the run's best instrument finding.**
Film: `a2-approval-flow.html` `(local)` — a request travelling from
filing to recorded decision. 5 beats / 15.8s, blueprint pack, locked camera
(`sway:0`, KEYS pinned to zoom 1). Built by splicing the 2D template so the
KERNEL block stays byte-identical; `smoke.js` kernel-parity check confirms it.
Semantics passes: filed → routed with one branch **visibly not taken** →
checked → recorded. Keeping the untaken `AUTO-OK` branch drawn but faint is
what makes a decision legible; a single drawn path is just a pipe.

**Two defects, both found only by the end-of-beat sheet (`sheet 480 0.95`),
both invisible at the default 0.6 sample:**
1. The payload dot **arrived at empty space** — the connector and dot completed
   during `route`, but the APPROVER box did not draw until the following beat.
   Fixed by drawing the box during route's tail, as the branch is chosen.
2. The ledger connector **descended through the box interior** (vertical
   segment at x=52 inside a box spanning x 46–70) instead of approaching from
   outside. Fixed by moving the descent clear of the left edge.

This is a direct argument for the 0.95 pass as a standing step, not an option:
both defects are *timing/geometry* errors that a mid-beat sample cannot show.

**INSTRUMENT FINDING — `build.js motion`'s dead-air detector is blind to
low-contrast linework, and its threshold is global rather than per-beat.**
The submit beat drew three evidence rules sequentially across 3.84–5.54s and
`motion` still reported `DEAD AIR t=3.92–5.17` — the identical window before
and after the rules were converted from an alpha fade to a sequential
`drawOn`. Control run (same timing, same geometry, **only** stroke weight
×3.7 and colour changed from `faint` to an accent):

| | submit bar | dead-air flags |
|---|---|---|
| faint thin rules | 0.05 | `submit 3.92–5.17` |
| bright thick rules | 0.07 | **submit clean**; three NEW flags in `review` and `record` |

Two conclusions, both bracketed by that control:
- The detector measures **pixel contrast, not activity**. Thin, low-alpha
  linework animates without registering — and the blueprint pack (fine lines,
  faint construction grid) is precisely the register that trips it.
- The threshold is **relative to a global median**, so making one beat busier
  pushes quieter beats below it and *manufactures* dead-air flags elsewhere.
  A dead-air report is therefore not a stable per-beat property; it is a
  statement about one beat relative to the rest of that particular cut.

Same family as the documented pop/stall negative result: whole-frame
statistics see *that* a film moves, not *what* moved. Recorded, threshold
deliberately not touched — the submit beat genuinely animates and the flag is
a false positive for this register.

**Delivery — the held-camera case, and the bracket it completes.** Same
encoder settings, 720px @ 12fps, against D4's moving camera:

| film | camera | WebP | AVIF | AVIF advantage |
|---|---|---|---|---|
| A2 approval flow | **held** | **0.27 MB** | 0.051 MB | 5.3x |
| D4 noise cancelling | **moving** | **4.58 MB** | 0.195 MB | 23.5x |

A 17x swing in WebP cost from camera choice alone, on the same pipeline. This
is a self-generated confirmation of the delivery table's central claim: WebP is
entirely shippable on a held camera and ruinous on a moving one, and AVIF's
advantage grows with how much of the frame changes per frame.

#### A3 · A real external document → 30s film
3D or 2D · register per doc · AVIF.
**Probes:** THE semantics stress the plan calls "the real Phase 6" — a film
about a subject the plugin did not write about itself. Deliberately choose a
doc that is *argument*, not just mechanism (`VISION.md` is a strong candidate),
to trigger the assertion-shaped-beat hazard on purpose.
**Hypothesis:** composition converges normally; 2–3 beats come back as
B-roll-with-a-thesis and force the "invent geometry for the claim, or cut the
beat" decision from `method.md` Axis 3. **The single highest-value case — this
exact stress has never been run.**
*Outcome:* —

#### A4 · Photosynthesis (inside a chloroplast)
3D playful · AVIF.
**Probes:** geometry vocabulary for an *organism* — a domain far from tech —
and a conversion (light + water + CO₂ → sugar) that is a claim, not a native
motion.
**Hypothesis:** works, but leans hard on inventing geometry for a conversion;
a good check that "playful" register survives a non-character subject.
*Outcome:* —

#### A5 · A market flywheel / supply chain
2D paper-cutout · WebP.
**Probes:** inventing visible geometry for a *non-physical economic* claim —
the flywheel hazard (`method.md`: "a beat that asserts has no geometry")
generalized past the plugin's own flywheel film.
**Hypothesis:** the hardest semantics case that isn't a character film; expect
at least one beat to have no honest geometry and need cutting.
*Outcome:* —

---

### Track B — Fun / creative / non-explainer

The register the skill documents least. These test whether the semantics axis
and the "every beat needs geometry, not a caption" discipline even apply when
the goal is delight rather than explanation.

#### B1 · Toybot victory dance
3D cinematic cel · **no captions** · AVIF.
**Probes:** reuses the committed IK asset in `examples/toybot-walk.html`
(cheap); with the caption-cover test removed, does the review method still
function? Tests character-as-star and a bible for mood.
**Hypothesis:** fast and fun; quietly tests whether "semantics" means anything
without a caption to cover. Best first case — highest delight per render minute.
*Outcome:* —

#### B2 · Generative loop — particle / flow field
3D neon-dark (or 2D) · **no subject** · AVIF.
**Probes:** `InstancedMesh` field + seeded `noise1`, pure vibe with nothing to
explain, and AVIF on a busy every-pixel-moving frame — the compression-hostile
delivery case and the unconfirmed-low-end-smoothness question at once.
**Hypothesis:** AVIF wins decisively on size (the plan's 0.28 MB vs 15 MB WebP
measurement lives here); the open risk is playback smoothness, which needs a
human on real hardware.
*Outcome:* —

#### B3 · Rube Goldberg chain reaction
3D · cross-section-ish · MP4/AVIF.
**Probes:** causality-must-read *for fun* — each step drives the next, which is
the phase/derivation rule from `method.md` Axis 3 applied to a delight subject
— plus a compression-hostile spike and several chained closed-form physics
events.
**Hypothesis:** genuinely delightful *and* a real stress test: if step N reads
as "moving near step N+1" rather than "driving it," it fails exactly the way an
explainer's causality beat fails. Spike the busiest link first.
*Outcome:* —

#### B4 · Kinetic-typography quote loop
2D neon-dark · WebP.
**Probes:** text *is* the hero — deliberately inverts "geometry not caption."
Tests whether the overlay/caption system can carry a beat when it is supposed
to, and 2D motion-graphics timing.
**Hypothesis:** exposes the limits of the caption layer as a primary subject;
likely wants the text drawn into the canvas, not the DOM overlay.
*Outcome:* —

#### B5 · Animated greeting / seasonal card
2D or 3D playful · warm · WebP.
**Probes:** tone as a register (warmth), a short shareable loop for a README or
a message.
**Hypothesis:** trivial mechanically; a real test of whether "warm/playful"
reads as *warmth* and not just saturated color. Good WebP-shareable exemplar.
*Outcome:* —

#### B6 · One-joke visual gag
3D or 2D · e.g. "merge conflict as two trains," "the spinner that finally
finishes," "CI red → green."
**Probes:** comedic timing, anticipation, whip/match cut as a *punchline*.
**Hypothesis:** the whole film lives in beat-duration variation and one
well-placed cut — a sharp test of the pacing floor at the short end and of
timing as authorship.
*Outcome:* —

---

### Track C — Cinematic & film-language stress (3D shots-as-data)

Exercises the Phase 3–4 layer: the framing solver, cuts, focus, camera energy,
and bibles. All 3D template (the 2D backend has no solver — see D2).

#### C1 · Match-cut short
3D · author two shots that must rhyme, then deliberately break one.
**Probes:** does the match-cut constraint **throw at load** when the entry
framing vocabulary (size/angle/elev/fov/anchor) differs, and hold silently when
it matches? This is the compiler-verified cohesion device.
**Hypothesis:** the headline film-language feature; confirming the throw fires
(the negative control) matters as much as confirming a good match passes.

**Outcome (2026-07-22): PASS in both directions — the constraint genuinely
enforces.** Ridden on D4 rather than given its own film, and it needed **no
rendering at all**: the check runs at load, so both directions cost one page
open each. Two variants of the same scene, differing only in shot 3:

| variant | shot 3 framing vs shot 2 | result |
|---|---|---|
| `c1-matchcut-bad` | `match:true`, angle 4 vs -17, elev 26 vs 12 | **throws** — `match cut into SHOTS[2] breaks framing: size/angle/elev/fov must equal the previous shot` |
| `c1-matchcut-good` | `match:true`, framing vocabulary identical | loads and shoots clean |

Critically, the failure is **loud, not advisory** — verified by exit code, not
by reading the message: `shoot.js` exits **1**, and `smoke.js` exits **1** with
`FAIL` on *both* source and bundled. A broken match cut cannot reach a render.

Worth noting for authors: the constraint compares size/angle/elev/fov/anchor
and deliberately **not** `subject` — so a match cut may change what is on
screen while holding the framing, which is exactly the real editorial device.

#### C2 · Rack-focus reveal
3D · two subjects, focus-only shot change joined by `blend`.
**Probes:** BokehPass DoF + rack-as-two-shots (`references/film-language.md`).
**Hypothesis:** works; watch for racking onto a subject that is off-frame at
the moment of the rack — a recorded past bug and a convention-pre-flight case
(racks need both subjects visible).
*Outcome:* —

#### C3 · Handheld documentary energy, moving subject
3D · `energy: handheld`.
**Probes:** the watch-the-loop human-only gap directly — does handheld noise
read as *intent* or as *pops*, and can `build.js strip` even resolve the
difference at limb scale (it can't below ~0.35 rad)?
**Hypothesis:** this is where the continuity axis is genuinely blind; the
verdict *requires* a human viewing and should be logged as such.
*Outcome:* —

#### C4 · Whip-pan transition
3D · accelerate, cut mid-smear.
**Probes:** the spike-the-hostile-beat rule + AVIF-vs-WebP on a full-frame
smear.
**Hypothesis:** reads well, encodes badly on WebP — a clean, concrete argument
for AVIF on a moving camera. Build and encode this beat alone first.
*Outcome:* —

#### C5 · IBL open-sky hero shot
3D · procedural Sky + PMREM · spiked on a *matching* composition (open sky).
**Probes:** the unverified-on-hardware-GL IBL recipe, tested on the
composition its premise needs (per the postmortem: spike art-direction-
conditional features on matching compositions, not on whatever film is
standing).
**Hypothesis:** blacks out on software GL (SwiftShader + PMREM `fromScene`);
**only meaningful on hardware GL.** A scoping flag on the render environment,
not a failure of the scene.
*Outcome:* —

---

### Track D — Deliberate edge / negative probes

The point of these is to break something, feel an unbuilt gap, or extend a thin
bracket — not to ship a pretty film.

#### D1 · A scene that *wants* to be a simulation
3D or 2D · flywheel coast-down, particle trails, or accumulating charge.
**Probes:** forces the closed-form-vs-simulation fork (`method.md`,
"Where you will be tempted to break this"). Does `smoke.js`'s determinism
byte-check catch a shared-material mutation or a `count++` slip — the HTML
second-pass desync that renders fine in the MP4?
**Hypothesis:** the sharpest test of the prime directive; a scene actively
pulling toward carried state. Expect to hand-author `ω0·exp(-k·(t-t0))` where
the instinct is to integrate velocity.
*Outcome:* —

#### D2 · A 2D film that wants shot vocabulary
2D · a piece begging for CU/MS/rack (a face, a reveal, a push-in).
**Probes:** the known-unbuilt 2D shot-solver (`film-language.md`,
"Deliberately not built yet").
**Hypothesis:** you feel the gap immediately — the `{x,y,zoom}` rail can't
express a size ladder or a rack. The deliverable is an honest earn-in ledger
entry ("a 2D film finally wanted shots"), not a finished film.
*Outcome:* —

#### D3 · Caption-density torture test
Either backend · author a beat squarely in the unmapped **37–50 CPS** band.
**Probes:** the thin caption bracket (`method.md`: 27 comfortable, 37
unreadable, 50 "serviceable but imperfect") that the ledger explicitly wants
the next data point on.
**Hypothesis:** produces a real observation either way; watch it and record
which side of the line it fell on. Pure ledger value.
*Outcome:* —

#### D4 · Sub-10s, 3-beat micro-explainer
Either backend · fastest possible full pipeline.
**Probes:** the "film language reads at explainer scale" claim at the floor
(plan cross-cutting rule 6); also the fastest end-to-end smoke of the whole
toolchain.
**Hypothesis:** works, and is the cheapest way to shake out a broken install or
a toolchain regression before committing render time to a big case.

**Outcome (2026-07-22): PASS on all three axes — hypothesis confirmed, plus
one new finding worth promoting to `film-language.md`.**
Film: `d4-noise-cancelling.html` `(local)` — how noise-cancelling
headphones work. 3 beats / 9.4s / 3 shots, no title card. The anti-wave is
computed as the negation of the source wave's own expression and the sum trace
is `a+b`, so causality is structural rather than co-incidental
(`method.md` Axis 3). Composition converged in **3 rounds**, inside budget.

- **Composition:** pass after 3 rounds (see finding below).
- **Continuity:** `smoke.js` determinism green source+bundled; `motion` reports
  0 dead-air and good variety (1.66 / 10.54 / 9.67 — beat 1 is legitimately
  quieter as an establishing shot, not a failed action); `strip` across the
  0.8s blend into the payoff shows smooth per-cell motion, no pop.
- **Semantics:** passes the cover-the-caption test on all three beats — a wave
  arriving at an earbud, a mirrored wave, two waves summing to a flat line.
- **The floor claim holds.** Shot vocabulary reads fine at 3 beats: WS
  establishing → WS detail on a sub-subject → elevated WS payoff.

**NEW FINDING — the size ladder is height-calibrated and cannot frame a wide
subject.** `SIZES.f` is "subject height ÷ frame height", so the solver derives
distance from height alone and never consults width. On this bench (12.8 wide
× 2.6 tall, `h:4.3`, 40° lens) the frame widths are:

| size | horizontal extent | fits a 13-wide subject? |
|---|---|---|
| EWS | 44.4 | yes (too wide to be useful) |
| WS | 17.8 | yes |
| FS | 9.4 | **no — crops** |
| MS | 5.6 | no |
| MCU | 3.7 | no |

Anything wider than ~1.8x its declared height crops at FS and tighter, so a
wide subject can only use EWS/WS — which collapses the shot variety the ladder
exists to provide. **Inflating `h` is the wrong fix** (it pulls back but leaves
the subject small in a tall empty frame, which was this film's first-round
defect). The right fix is the one the craft already has: push in on a
**narrower named sub-subject**. Here beat 2 reframed from `field` onto `cross`
(the region where the two waves meet, by the earbud) — better cinema *and*
uncropped, because the detail beat is genuinely about that region.
This is a second instance of the postmortem's convention-pre-flight pattern:
the ladder silently assumes an upright subject, the way the first cut of the
table silently assumed MS meant full-shot framing.

**Delivery data point (moving camera, 720px @ 12fps):** AVIF **0.195 MB** vs
WebP **4.577 MB** — **23.5x**. Third measurement of the moving-camera case and
consistent with the existing two (55x on the template scene, 7x held-camera);
the ratio scales with how much of the frame changes per frame.

**Lint observation:** the exposure lint reports `0.0 points` dynamic range on
this scene at both tails, on a film that is correctly exposed by eye. Sparse
bright subjects on a near-black field put *both* p05 and p95 in the background,
so the percentile spread collapses. Same family as the hazard the `neon-dark`
pack predicted for the crush lint — a dark register trips the lint by design.
Judge by looking; do not chase it by moving the threshold.

#### D5 · 40s, 8–10 beats, multiple world cuts
3D · dive-in / pull-out structure, two or more worlds under flashes.
**Probes:** the top of the duration range, multi-world hard cuts
(`method.md` Axis 2: "hide the cut under a flash, completely"), pacing
discipline at length.
**Hypothesis:** pacing is the risk — uniform beat durations and repeated
framing read as a slideshow more visibly the longer the film runs. Tests the
holding-keyframe-before-a-cut rule that shipped a re-render once.
*Outcome:* —

#### D6 · New-craft-vocabulary calibration
3D · first use of a lens set / shot-size framing the author hasn't calibrated
against real film craft.
**Probes:** the convention-pre-flight rule (postmortem: three same-shaped bugs
where invented vocabulary — shot sizes, ink polarity, gait anchoring — shipped
without being checked against the craft it mirrored).
**Hypothesis:** if the table is checked against actual cinematographic
definitions before the first render, the pattern doesn't recur; if it isn't,
expect the first-cut framing to be wrong in the same quiet way.
*Outcome:* —

---

### Test rounds

Cases are grouped into **rounds**, not a flat ranking. A round is a batch whose
results are read *together*, so each round must be internally diverse — a round
that is all-2D, all-explainer, or all-happy-path tells you about one axis and
lets the others hide.

#### The diversity rule

Every round spans these seven dimensions. Check a proposed round against the
list before running it; a deliberate skew is fine, an accidental one is not, so
**name the skew and its rationale** when a round doesn't balance.

| Dimension | Values to spread across |
|---|---|
| Backend | 3D three.js / 2D Canvas2D |
| Style register | cel-cinematic / blueprint / paper-cutout / neon-dark / cross-section |
| Posture | explainer / fun |
| Caption | captioned / uncaptioned |
| Camera | held / moving |
| Delivery | WebP / AVIF / MP4 / HTML |
| Probe type | capability (should work) / negative-or-gap (should break or reveal) |

**Camera** carries more weight than it looks: held-vs-moving is the axis the
whole delivery tradeoff is built on (`delivery.md`), so a round with no held
camera can't say anything about WebP and a round with no moving camera can't
say anything about AVIF.

#### Film-level cases vs riders

Not every case needs its own scene file, and treating them as if they did was
the first draft's mistake. Three classes:

- **Film-level** — needs its own scene and full render: A1–A5, B1–B6, D1, D2,
  D4, D5.
- **Shot-level riders** — fold into an existing 3D film as extra shots, costing
  a re-render and no new scene: **C1** (match cut), **C2** (rack focus),
  **C4** (whip pan). All three are `SHOTS[]` entries, which is exactly what
  shots-as-data bought.
- **One-line riders** — nearly free. **C3** (camera energy) is a single
  `CONFIG.energy` swap plus a re-render, the same shape as the bible control
  pair. **D3** (caption density) is one beat's caption authored into the target
  band on whatever film is standing.
- **Not a film** — **D6** (convention pre-flight) is a discipline applied to
  whichever case introduces new craft vocabulary; **C5** (IBL) is gated on the
  render environment, not on scheduling.

Attach **D3 to a different film in each round**: three observations in the
unmapped 37–50 CPS band builds a bracket, where one observation only builds an
anecdote.

---

#### Round 0 · Environment check (do this first — minutes, not hours)

**Newly relevant: the whole generalization run executed on a software-GL
container (SwiftShader).** The postmortem's standing recommendation is to
"book a hardware-GL session" to close three opens at once. Confirm what this
machine actually gives Chromium before budgeting any render time, because the
answer changes everything downstream:

- If **hardware GL**: render cost drops ~5–10x, which re-prices every round
  below; **C5 (IBL/PMREM) becomes testable** for the first time; parallel
  capture can be re-measured where it was predicted to win (roadmap item 5's
  open); and the quality-tier question can be honestly re-judged.
- If **software GL**: C5 stays blocked (PMREM `fromScene` blacks out on
  SwiftShader — a bisected negative result), and the rounds stay expensive.

This is the cheapest high-leverage step in the suite. Record the answer here.

**Outcome (2026-07-22, Apple M2 Ultra / 24 cores, Chrome 1223, bun 1.3.14,
ffmpeg 8.1.2): RUN — and it closed three opens at once, one of them by
refutation.**

**Finding 1 — the recorder pins software GL regardless of hardware.**
`shoot.js:177` (and `smoke.js:362`) hardcode
`--use-angle=swiftshader --enable-unsafe-swiftshader`. So "book a hardware-GL
session" was never only about the machine — the tool opts out. Probed three
flag sets on this box:

| flags | renderer | maxTex |
|---|---|---|
| as shipped | ANGLE SwiftShader (software, Vulkan/LLVM) | 8192 |
| `--use-angle=metal` | **ANGLE Metal, Apple M2 Ultra** | 16384 |
| default (no angle flag) | ANGLE Metal, Apple M2 Ultra | 16384 |

**Finding 2 — GL matters enormously, but only on a post-chain scene.** Timing
120 frames at 1920×1080, `seekTo` alone vs `seekTo`+screenshot:

| | template (no post) | toybot (cel + outlines + IK + bloom + DoF) |
|---|---|---|
| `seekTo` only, Metal | 0.4 ms/frame | 3.3 ms/frame |
| `seekTo` only, SwiftShader | 0.4 ms/frame | **182.2 ms/frame** |
| draw speedup from hardware GL | ~1x | **55x** |
| end-to-end PNG, Metal | 164.6 ms/frame | 187.7 ms/frame |
| end-to-end PNG, SwiftShader | 232.8 ms/frame | 489.2 ms/frame |
| end-to-end speedup | 1.4x | **2.6x** |

The SwiftShader column is what validates the control: 182 ms/frame on the
same `seekTo`-only loop proves the timing path really does capture
rasterization, so the template's 0.4 ms is a genuinely cheap draw and not an
async-submit artifact. **Hardware GL is worth 2.6x end-to-end and 55x on the
draw for post-chain scenes, and ~nothing for a flat one.**

**Finding 3 — PNG screenshot is a second, unrecognized bottleneck, and it
dominates as soon as GL is fast.** Same readback path, encode swapped:

| scene / renderer | PNG | JPEG q90 | ratio |
|---|---|---|---|
| template, Metal | 164.6 ms | 29.1 ms | **5.7x** |
| toybot, Metal | 187.7 ms | 28.8 ms | **6.5x** |
| toybot, SwiftShader | 489.2 ms | 269.9 ms | 1.8x |

So there are **two independent bottlenecks** — software rasterization of a
post chain, and PNG encode/CDP transfer — and fixing either alone leaves the
other. On hardware GL, ~95% of capture time is the screenshot, not the film.

*Actionable:* the **review** passes (`sheet`, `strip`, samples) already emit
`.jpg` and could shoot JPEG directly for ~6x, while final MP4/WebP/AVIF
renders keep lossless PNG. Not yet implemented — logged as a roadmap
candidate, not a change made under a test run.

**Finding 4 — parallel capture is refuted on the exact hardware the roadmap
predicted would rescue it.** Roadmap item 5 left the open as "a many-core box
or hardware GL, where one page cannot saturate the machine — plausible,
unmeasured." This is that box (24 cores + Metal), 288 frames @ 24fps:

| workers | Metal | SwiftShader |
|---|---|---|
| 1 | 54.7s | 64.5s |
| 4 | 49.1s (1.11x) | 61.6s (1.05x) |
| 8 | 48.8s (1.12x) | 63.1s (1.02x) |

**~1.1x, not the predicted win.** The premise was wrong at the root: capture
was never GL-parallelism-bound, it is screenshot-bound, and PNG encode
serializes through the browser process. Item 5's remaining open can be closed
as *measured negative on its own predicted best case*.

**Finding 5 — cross-renderer frames are NOT byte-identical, which limits a
checkpoint instrument.** Metal vs SwiftShader on the same scene: **0 of 288
frames identical**, PSNR 57–58 dB (below `method.md`'s 70 dB
imperceptible bar), with differences confined to anti-aliased edges and
specular highlights — invisible at 1x even amplified 20x. Each renderer is
*self*-consistent: `smoke.js`'s determinism byte-check passes under Metal
(4/4 scenes). **Implication for the phase-exit checkpoint:** "re-shoot the
committed examples and compare byte-identical" only holds *within* one
renderer. Switching GL backends invalidates byte-comparison as a regression
instrument and forces the PSNR>70 fallback.

---

#### Round 1 · Breadth and baselines

**Purpose:** prove both backends, four distinct style registers, and both
inline formats work end to end — and produce the baselines every later round is
judged against. All cases cheap by design.

| # | Case | Backend | Register | Posture | Camera | Delivery | Probe |
|---|---|---|---|---|---|---|---|
| 1 | **D4** micro-explainer (3 beats, <10s) | 3D | cel | explainer | moving | AVIF | capability + toolchain smoke |
| 2 | **A2** approval flow | 2D | blueprint | explainer | held | WebP | capability (baseline) |
| 3 | **B1** toybot dance | 3D | toybox cel | **fun** | moving | AVIF | **uncaptioned** review |
| 4 | **B5** greeting card | 2D | paper-cutout | **fun** | held | WebP | warmth as register |

**Riders:** C1 (match cut) on B1 — and deliberately break it once, so the
load-time throw is verified as a negative control, not assumed.

**Run D4 first.** It is the fastest complete pass through the toolchain and
will surface a broken install or a regression before you spend real render time
on anything else.

Diversity: 2/2 backend, 4 distinct registers, 2 explainer / 2 fun, 2 held /
2 moving, 2 WebP / 2 AVIF, one negative control. Balanced with no skew.

---

#### Round 2 · The hard axes

**Purpose:** attack the three things that rounds of *looking* never converge —
semantics, causality, continuity. These are the cases most likely to produce
real ledger entries.

| # | Case | Backend | Register | Posture | Camera | Delivery | Probe |
|---|---|---|---|---|---|---|---|
| 1 | **A3** external doc → film | 3D | per doc | explainer | moving | AVIF | **semantics** (the "Phase 6" stress) |
| 2 | **B3** Rube Goldberg | 3D | cross-section-ish | **fun** | moving | MP4/AVIF | **causality** + compression-hostile |
| 3 | **D1** simulation-shaped scene | 2D | neon-dark | fun/abstract | moving | AVIF | **determinism** negative probe |
| 4 | **C3** handheld energy swap | 3D | (on B1) | — | moving | — | **continuity** / watch-the-loop gap |

**Riders:** C2 (rack focus) on A3 — a reveal shot is natural in an explainer
and gives the rack two genuinely visible subjects, which is the calibration the
first cut got wrong.

**Named skew:** this round is 3D-heavy and entirely moving-camera. That is
deliberate, not accidental — causality, camera energy, and the shot layer all
live in the 3D backend, and every hard axis here involves motion. D1 carries
the 2D representation, and picking neon-dark for it is not arbitrary: the
deterministic **trail idiom is that pack's signature move**, which is exactly
the shape that tempts you into carrying state across frames.

**Sequencing within the round:** spike B3's busiest link before building the
rest of its chain (the hostile-beat rule). C3 is last and nearly free — it
rides on B1 from Round 1.

---

#### Round 3 · Ceilings, gaps, and the unbuilt

**Purpose:** find the limits and log earn-in items. Expect at least one case
here to produce a roadmap entry rather than a film.

| # | Case | Backend | Register | Posture | Camera | Delivery | Probe |
|---|---|---|---|---|---|---|---|
| 1 | **D2** a 2D film that wants shots | 2D | any | explainer | wants moving | — | **known-unbuilt gap** |
| 2 | **D5** 40s, 8–10 beats, multi-world | 3D | cinematic | explainer | moving | MP4/AVIF | **ceiling** + world cuts |
| 3 | **A1** heat pump | 3D | **cross-section** | explainer | held | WebP | the third documented register |
| 4 | **B2** generative particle/flow loop | 2D or 3D | neon-dark | **fun** | moving | AVIF | **no subject** + AVIF playback |

**Riders:** C4 (whip pan) on D5 — a hostile transition belongs in the long film
where there is room for it.

**A1 earns its slot** because cross-section is one of the three registers
SKILL.md names and no earlier round touches it; it also has a rule of its own
(internals must sit proud of the front face) that nothing else tests.

**D2's deliverable is a ledger entry, not a film.** If the `{x,y,zoom}` rail
turns out to be enough, that is the finding — and it means the 2D solver stays
correctly unbuilt.

---

#### Reserve bench

Pull these when a round has capacity, or when a specific question comes up.
Deliberately not scheduled — the suite should not become a completionist
checklist:

- **A4** photosynthesis — organism geometry, if a biology subject is wanted.
- **A5** market flywheel — the hardest non-character semantics case; overlaps
  A3's probe, so it is redundant *unless* A3 comes back clean.
- **B4** kinetic typography — text-as-hero; pull if B5 suggests the overlay
  layer is a limit.
- **B6** one-joke gag — timing as authorship; cheapest possible fun case.
- **C5** IBL open-sky — **unblocked only if Round 0 reports hardware GL.**
- **D6** convention pre-flight — a discipline, applied to whichever case
  introduces new craft vocabulary.

---

### Tooling defects found by running the suite

Both were found by *using* the pipeline, not by reading it, and neither is
visible from inside the recorded outputs. Recorded here; the fixes are
plugin-content changes and carry the version cascade.

#### 1. The HTML artifact and the recorded formats disagree on framing

**Severity: high — it touches the skill's headline claim.** SKILL.md says the
film is a pure function of `t` so "one scene file drives the live HTML loop and
the frame-exact render alike." They are identical in **time**. They are not
identical in **framing**.

The 2D template's `applyCamera()` derives scale from height alone:

```js
const s=(canvas.height/VIEW_H)*zoom;
```

so the visible world *width* is `VIEW_H × (canvas.width/canvas.height)` — a pure
function of the viewport's aspect ratio. Any window narrower than 16:9 silently
crops the sides.

It was never caught because **`shoot.js` hardcodes a 1920×1080 viewport**, so
every recorded artifact is 16:9 by construction and can never exhibit the
defect. Only the live HTML — opened in a real browser window — does. The owner
hit it first: a ~1.40:1 Chrome window cropped the diagram badly while the WebP
and AVIF of the same scene looked correct, which reads as an encoder problem
and is not one.

Measured on `a2-approval-flow.html` at a fixed `t`, same scene, four viewports:

| viewport | aspect | result |
|---|---|---|
| 1920×1080 (what `shoot.js` records) | 1.78 | fully framed, comfortable margins |
| 2000×1430 | 1.40 | leftmost and rightmost elements cut off |
| 1440×1200 | 1.20 | severely cropped both sides |
| 2560×1080 | 2.37 | fine (extra width is slack) |

**Fix for the 2D backend** — contain the design area on both axes, letterboxing
instead of cropping:

```js
const VIEW_H=90, VIEW_W=160;                 // design area, 16:9
const s=Math.min(canvas.width/VIEW_W, canvas.height/VIEW_H)*zoom;
```

Verified: after the change all four viewports frame identically.

The 3D backend is under separate investigation — it solves camera distance from
subject **height** and a **vertical** fov (`dist = S.h/f/(2·tan(fov/2))`), which
is the same height-only assumption, so it is expected to share the defect; the
open questions are the correct compensation and whether making `fov`
viewport-dependent weakens the load-time match-cut constraint, which compares
`fov` between shots.

Note this compounds the D4 size-ladder finding: the ladder is height-calibrated
*and* the viewport is height-calibrated, so a wide subject is squeezed twice.

#### 2. `build.js all` could silently encode the wrong frames

**Severity: high — silent, and it ships the wrong film.** `frames()` declared
`dir = 'frames'` as a default parameter and then passed it as `FRAMES_DIR` to
`shoot.js`, **overriding** any ambient `FRAMES_DIR`. But `video()` reads
`process.env.FRAMES_DIR || 'frames'`. So `FRAMES_DIR=X build.js all` shot fresh
frames into `frames/` and encoded from `X/`.

This is the same ship-the-wrong-film failure the comment inside `video()`
already describes and claims to have closed — reintroduced through the other
half of the pair. When `X` is empty ffmpeg errors loudly, which is survivable.
When `X` already holds frames it is **silent**: measured, a single stale frame
in `X` produced a **0.0 MB one-frame mp4 and exit 0**, reported as
`encoded -> ... (0.0 MB)`.

Fixed by defaulting `frames()`'s `dir` to the *same expression* `video()` uses,
so the shoot half and the encode half cannot disagree. Callers that
deliberately own a scratch dir (`sheet`, `loop`, `avif`, `strip`) pass one
explicitly and are unaffected. Verified with a positive control: the exact
command that produced the 0.0 MB film now shoots 474 frames to the right place
and encodes correctly.

#### 3. The root cause behind all of them: undeclared reference frames

Both defects above, the D4 size-ladder finding, the `motion` dead-air false
positive and the exposure collapse are **one failure**, not five: a measurement
or a composition made against a reference frame nobody declared. An audit of
the pipeline found **ten**, several mutually inconsistent:

| Subsystem | Measured against |
|---|---|
| `shoot.js` viewport | hardcoded 1920x1080 |
| `smoke.js` main checks | 640x360 |
| `smoke.js` caption overflow | `innerWidth` at 1920x1080 |
| caption size | `30px` fixed — the **window** |
| caption position | `bottom:5.5%` — the **window** |
| title size | `44px`/`24px` fixed — the **window** |
| `SIZES.f` | fraction of frame **height** |
| exposure lint | absolute luma + whole-frame percentile spread |
| `motion` dead air | global median of that cut |
| caption CPS | absolute chars/sec |

The caption rule mixes fixed px with a percentage *inside a single CSS rule*,
and `smoke.js` measures exposure at 640x360 while measuring caption overflow at
1920x1080. Nothing was individually wrong; nothing was anchored.

**Shipped as 0.17.0** — one declared frame, and everything resolves against it:

- **`FRAME`** (`{aspect, px}`, exported as `window.FRAME`). `shoot.js` sizes its
  viewport from `FRAME.px`, so **9:16 vertical and 1:1 square are now
  first-class** — previously impossible by construction. SKILL.md's
  `aspect: 16:9 default` field was decorative; it is now the single source.
- **Frame-relative overlays** — captions and titles sized and positioned from
  CSS vars carrying the frame rect. This closes open item 1; the 0.16.0
  containment fix did **not** fix it. PSNR 79.0 dB (3D) / 74.0 dB (2D), above
  the 70 dB bar, localized to the caption pill's antialiased edge.
- **`EXTENT`** — subjects may declare `w` beside `h`; framing binds on whichever
  axis is tighter. Closes the D4 finding at the root and unlocks wide subjects
  (timelines, org charts, waveforms). Backward compatible: an upright subject
  where `w <= h*aspect` is unchanged.
- **Framing-invariance check in `smoke.js`** — closes open item 2. Bracketed
  both ways: known-bad pre-fix templates 24-31 mean-abs-luma, correct scenes
  0.07-0.12, threshold 8 in the gap.
- **`build.js aspect`** — tiles one moment at four window shapes. The lint can
  reject a scene; it cannot approve one, and the render is always the design
  shape, so the author still has to look.

**Two false starts on the guard, both worth keeping**, because both produced a
confident all-clear on a scene known to be broken:

1. Sampling a **single `t`** landed on a near-blank title card and scored ~0 on
   a template known to crop. A blank frame is invariant under every window
   shape precisely because it contains nothing. Now samples three timestamps
   and takes the worst.
2. Reading a **stale canvas** — sampling before the scene's own resize handler
   ran — scored a correctly-fixed template *worse* than a broken one. Same
   class as the `smoke.js` sampling race already in the plan's postmortem. Any
   check that changes viewport must re-settle before it measures.

Deliberately **not** built, pending a film that needs it: register-aware lints
(having `STYLE`/`BIBLES` declare an expected exposure/ink envelope so lints
check departure-from-intent rather than a universal constant). Two candidate
instances exist — blueprint's fine-line dead-air false positive and
neon-on-black's exposure collapse — which is arguably enough to earn it, but no
film has been blocked by it yet.

Also still open: the caption reading-speed bracket (27 comfortable / 37
unreadable / 50 "serviceable") remains thin; and the cinematography solver now
exists in **three** copies, past the postmortem's own "at a third consumer,
extract or marker-fence it" threshold.

#### Deliverable policy for the rest of the suite

**HTML + MP4 only.** WebP/AVIF are set aside for testing — at 720px the
raster loops are visibly soft, and the settings are not yet dialled in. MP4
(`crf 17`, full resolution) is the honest quality reference and HTML is the
interactive source. The delivery *measurements* already recorded (the held vs
moving camera bracket) stand as size data; they were never quality claims.

Related, and worth stating because it looked like a problem and is not:
**ffmpeg's `drawtext` is irrelevant to this pipeline.** Captions and titles are
DOM overlays precisely because the HTML is a first-class deliverable — they
stay crisp in screenshots and restyle without touching the scene. The one place
drawtext was ever considered was contact-sheet cell labels, and the roadmap
rejected it because libfreetype is not guaranteed in every ffmpeg build; the
legend prints to stdout instead. No ffmpeg text capability is required.

### Maintenance note (not a film)

The plan's postmortem flags one structural risk this suite can't test with a
film: the cinematography solver now exists in **two copies** (the 3D template
and `examples/toybot-walk.html`) with no drift guard — the kernel markers cover
only the deterministic kit, not the solver. Two copies is the repo's tolerated
maximum. If any case here adds a **third** consumer of the solver (a second
3D example, or a new template), extract it or marker-fence it first, per the
CLAUDE.md mirrored-copies-plus-test pattern. *(Editorial note: no rule of that
name exists in this repo's CLAUDE.md; the equivalent is invariant 2's fenced-block
carriers plus smoke's parity check.)*

---

## The remediation

*~51 findings from the batched run, grouped by root cause, structural fixes separated from deliberate bandaids.*

*Original file: `explainer_video_hardening_plan.md` — last updated: 2026-07-22*

What the batched test run found, grouped by root cause, and what to do about it.

Companion to [explainer_video_test_cases.md](#the-test-suite)
(the exercise sheet and per-case outcomes) and
[explainer_video_generalization_plan.md](#the-arc)
(the arc). This document is the **remediation**: eleven films built by seven
agents plus two built in the main loop produced ~51 distinct findings, and they
collapse into two root causes.

---

### The diagnosis

#### Root cause 1 — instruments that generalise from a single sample

Every measuring device in the pipeline samples **one point** and then reports
about a whole film. One timestamp. One viewport. One scratch directory. One
renderer. One text layer. Whole-frame statistics standing in for "what moved".

The sharpest proof came from three controls on one scene:

| control | scene | `smoke.js` says |
|---|---|---|
| stateful, rotor visibly moving at t=1.0 | non-deterministic | **FAIL** (correct) |
| same bug, diagram fades in during the title | non-deterministic | passes the determinism check; fails by luck on a **9-byte, 0.16% margin** |
| same bug, faint structure drawn from t=0 (an ordinary design choice) | non-deterministic | **`all scenes pass`, 0 warnings** |

`smoke.js:147` is `const t = Math.min(1, dur / 3)`, which for any film ≥3s is the
**constant 1.0s** — inside the title card the workflow tells you to write first.
t=1.0 was the only timestamp in that film where the scene was clean, and it is
the only one the check looks at. **The skill's central guarantee can report green
on a scene that provably violates it.**

The same shape, everywhere: the framing lint (fixed and re-bracketed mid-run) had
it; the contact sheet's fixed fraction lands inside world-cut flashes and inside
lightning, blinding exactly the highest-risk beats; `motion`'s per-beat **mean**
is invariant to distribution, so a 0.73s end-of-beat freeze moved it by 0.00;
five independent agents hit fixed scratch directories, worst case encoding
**3 frames from one film and 70 from another** with no warning.

#### Root cause 2 — vocabulary that promises more than it measures

Names that mean something narrower than they say:

- **`h`** is documented as the subject's height. It must mean *the extent that has
  to stay in frame*. Three independent films cropped their own payoff — a robot's
  antenna, a cross-section slab, a pelican's umbrella.
- **`w`** (added in 0.17.0) is an axis-aligned world-X scalar the solver never
  rotates. Measured: same rung, same declared size, varying only `angle` — 0°
  fits, −26° **clips at the frame edge**, −45° fits. Non-monotonic, because it is
  the projected extent of a 3D box.
- **`SIZES`** has a vertical anchor and no horizontal one, in *both* backends. An
  agent ported the ladder to 2D and used **one of its seven rungs**, because the
  rungs carry human-figure meanings (waist-up, chest-up) with no referent for a
  region, and once a subject is a bounding box "fit this box" is the only op.
- **`cut:'whip'`** differs from `blend` only in duration. There is no motion blur,
  so it reads as a fast snap with a stutter. The word promises what the renderer
  cannot deliver.
- **`focus`** is one of six documented shot properties and does nothing in the
  base template, which has no `BokehPass`.
- **a bible swap** is "one line" only for scenes that never author an emissive:
  emissive intensity lives in `animate()`, and the bible layer has no gain.
- **`solveShot`** has no clamps at all — it will place the camera *inside* the
  subject (measured: 2.79 units from a head on a body extending 3.7 units back)
  or *below the ground plane*.

---

### The rule that keeps this open-ended

The point of this skill is that a user can ask for *any* scene — any subject, any
character, any register. Hardening must not narrow that. So every change here
obeys one rule:

> **A fix may make an instrument honest, or let an author say something they
> already meant. It may not add a required shape to a scene.**

Operationally: every new field is **optional, defaulting to today's behaviour**;
every new primitive is a **pure function of `t`** that composes with the existing
kit; no fix introduces a content template, a mandatory beat, or a required
structure. Where a finding could be answered either by a feature or by a
constraint, prefer the feature — a constraint spends the user's freedom, and
this skill's whole thesis is that only geometry and caption register change by
domain.

---

### How to read the fixes below

The temptation with 51 findings is 51 patches. Most of them are one class wearing
different clothes, so each group below leads with the **structural** change that
removes the class, and then names the few places where a **bandaid is genuinely
the right answer** — because sometimes it is, and pretending otherwise is its own
kind of over-engineering.

A useful test: *if a new check, a new command, or a new scene were added
tomorrow, would it get this right for free?* If yes, the fix is structural. If it
would have to remember, it is a bandaid and should be labelled one.

---

### Group 1 — Instrument integrity

#### Structural: the harness has no shared notion of "how to sample a film"

Every check hand-rolls its own sampling, which is why the same defect appears
independently in the determinism check, the blank check, the contact sheet, and
(until mid-run) the framing lint. The fix is not "sample three timestamps in the
determinism check" — that is the 1-of-N patch, and the next check written will
have the bug again.

Add a **sampling layer** that every instrument draws from. It knows what the
harness already knows and no individual check does: the beat table, the flash
windows, the duration, and where the motion peaks are.

```
plan = samplePlan(scene, {mode: 'uniform'|'beats'|'peaks', n, avoid: 'flash'})
```

- `uniform` — n fractions across DURATION (what exposure already does by hand)
- `beats` — one per beat at a given fraction (what `sheet` does by hand)
- `peaks` — where per-beat frame delta is maximal, which is the only mode that
  can see a 0.5s jump inside a 2.0s beat. `motion` already computes the numbers.
- `avoid: 'flash'` — nudges off any `CONFIG.flashes` window, which is what blinds
  the highest-risk beats of any two-world film

Two properties matter as much as the modes:

1. **Every check states its plan and prints the samples it used.** A green result
   becomes auditable instead of authoritative. The three-control proof above was
   only possible because someone went looking for *which* timestamp was checked.
2. **A check declares `all` or `any`.** Determinism is `all`. Blankness is `all`.
   "Something legible happens" is `any`. Today every check is implicitly `any`
   with n=1, which is the weakest possible claim stated as the strongest.

Consequence: `build.js kinematics` (the state-space probe) is then a *new
consumer of the same layer*, not another bespoke sampler. It is worth building on
its own merits — bracketed at boundary/interior **1.0001 vs 0.0531** and spread
**1.003x vs 72.7x** on scenes `motion` called indistinguishable — but the point
here is that it inherits correct sampling for free.

#### Structural: runs are not isolated, and nothing verifies provenance

Five agents hit fixed scratch directories independently; the worst case encoded
**3 frames from one film and 70 from another** silently. Suffixing each of the
six hardcoded names with a pid is the bandaid, and it is the wrong shape: the
seventh command someone adds will hardcode a seventh name.

Instead: **one `workspace(scene, tag)` helper that every command must go through
to get scratch space**, plus a **provenance assertion** — the frames a command
reads must be the frames it wrote (count against `fps × DURATION`, and a manifest
written at capture time). The assertion is the part that generalises: it catches
*any* future desync, not just the concurrent one, including the stale-tail class
`build.js` already carries three comments about.

#### Genuine bandaids here, and they are fine

- **A ≥99% near-black frame becomes a failure, not an advisory.** This really is
  just a threshold moved from "warn" to "fail". There is no class behind it — a
  black frame is never a design, and the only reason it needs saying is that a
  342-frame all-black render currently reports `all scenes pass`.
- **GL backend selectable, hardware default.** One flag, currently hardcoded.
- **`shoot.js` runs `ensureVendor` and honours `FRAMES_DIR`.** Two lines bringing
  one tool in line with its sibling. (Though note *why* it drifted: `build.js`
  grew the self-healing and `shoot.js` was never revisited — an argument for the
  workspace helper above being the single door.)

---

### Group 2 — Framing that measures what it promises

#### Structural: declarations are never checked against the thing they describe

Three films cropped their own payoff — a robot's antenna, a cross-section slab, a
pelican's umbrella. The bandaid is a doc line saying "remember to include props
in `h`". It will not work; it did not work, and the docs already say `h` is the
subject's height, which is exactly the misleading part.

The structural fix is that **the tool measures what the author declared**. At load,
walk the named object's scene-graph bounding box and compare it to the declared
extent. Under-declaration throws; over-declaration warns. An author then cannot
declare `h:7.8` for a bot that is 9.6 tall to the antenna, because the antenna is
in the box.

This is the same move that made the match-cut constraint trustworthy — a rule
with an enforcement mechanism stayed true, and every rule that shipped as prose
drifted. It also subsumes several separate findings at once: the wide-subject
crop, the "ladder silently becomes fraction-of-width" surprise, and the
camera-inside-the-subject case, because all three are the solver reasoning from a
number nobody verified.

With extents honest, the solver can then do the thing it always claimed:

- fit the **projected** box (rotate by `angle`/`elev`) rather than an
  axis-aligned scalar — the current `w` is non-monotonic in angle, measured
  fitting at 0° and −45° and **clipping at −26°**
- derive clamps *from the extent itself* — never inside the subject, never below
  the floor — rather than the two hand-added magic numbers two agents wrote
  independently
- accept `subject: ['plank','hammer']` and solve the union, because every causal
  beat is two objects and the space between them

#### Genuine bandaids here

- **A rung between `WS` (.50) and `FS` (.95).** A missing table entry. "Full body
  with a little air" is the workhorse framing of a character film.
- **A horizontal anchor** alongside the vertical one. A missing field.

Both are honestly just gaps, and neither has a class behind it.

#### Deliberately NOT fixed structurally: the rung names

`MS`/`MCU`/`CU` carry human-figure meanings with no referent for a region, which
is why an agent ported the ladder and used one of seven rungs. The structural fix
would be a second ladder for regions — and that is a vocabulary the films have
not asked for. Documented as a limitation instead. This one is a bandaid *on
purpose*.

---

### Group 3 — The kit has beat-addressing and no time-shaping

#### Structural: the missing half of the kernel

`ramp`/`pulse`/`rampS`/`during` all answer **"where am I inside this beat?"**.
Nothing answers **"how does time itself run here?"** — and four separate findings
are all that gap:

| finding | what the author wanted to say |
|---|---|
| chain reactions run backwards | "start when *that* finished, and stay" |
| no slow-motion | "run this stretch at quarter speed" |
| loops hard-cut every cycle | "make this term periodic over DURATION" |
| holds need hand-integration | "coast, then hold, then coast" |

These are one idea: **build a monotone (or periodic) reparameterisation of `t`,
then evaluate closed forms through it.** Add them as a small, composable time
algebra in the kernel — `latch`, `warp`, `cyc`, `progress` — all pure functions
of `t`, all obeying the prime directive, none constraining content.

The chain-reaction finding is why this is structural rather than four utilities:
taking "drive B from A's expression" literally on an *impulsive* coupling
produces a **reversible chain** — a hammer's ringdown retracted the driver by 54%
of a contact width and an entire fallen domino row stood back up. Derivation
propagates **onset**, not **persistence**, and `latch` is the primitive that
expresses the difference. Without it the docs give advice that is wrong for half
the cases it covers.

#### Structural: make the text helper good enough that turning text off is possible

Two findings look unrelated and are not: `label()` is unusable for real
typography (centre-align only, no weight, no measure — every 2D film replaced it
within minutes), and the semantics test cannot see canvas text (only 2 of 8 beats
in the external-doc film survived a strict cover-*all*-text pass).

Fix them together. Ship a text helper worth using (`txt()` with align/weight/
measure, which the blueprint pack already assumes exists), and then a
`?strip=text` mode the template honours by skipping every draw that goes through
it. The instrument for the semantics axis falls out of making the helper good —
and it only works *because* everyone uses the helper.

#### Genuine bandaids here

- **Flash width as a parameter.** Hardcoded ±0.25s; one film's whole beat was
  shorter than the shortest expressible flash. A missing argument.
- **`rampE()` returning `{u, e}`.** Three agents gated on an eased value having
  read the warning not to. Making the correct path the easy path is a one-function
  bandaid, and the right one — the alternative is a louder warning, which is what
  already failed.
- **World-anchored DOM labels.** Genuinely additive; two films shipped unlabelled
  because a world→screen projection would have to be hand-rolled identically by
  every author.

---

### Group 4 — The method describes a narrower world than the tool serves

Mostly documentation, and mostly *restatement* rather than addition — the
findings show the existing rules are right about explainers and stated as
universals.

- **Semantics**: "cover the caption" is undefined with no caption, removes the
  film when text is the subject, and becomes "is it funny" for a gag. Restate as
  **"cover everything except the geometry"**, with the `?strip=text` instrument
  above making it a standing pass.
- **Pacing**: the ~3s floor derives from *mechanism comprehension*. A gag beat
  carries a single-token state change; four beats under 2s read fine. And the
  converse is undocumented — a domino falls in 0.30s while beats want 3-4s, so
  **physical durations fight beat durations**, and the docs only cover the
  opposite case ("transit eats the content window").
- **Dead air is structural** in comedy (a comic rest is by construction longer
  than the minimum and below the floor) and in fine-line registers.
- **`style-3d.md` corrections**: the SwiftShader failure is not "PMREM is
  broken" — PMREM works for LDR and HDR; only `Sky` into a **half-float** target
  fails, it poisons *direct* lighting on every `MeshStandardMaterial`, and a
  fallback verified equal across backends to 0.2% exists. Bloom threshold should
  read "above the **sky-lit** luminance of your brightest material". The
  no-env-map fallback holds for semi-rough metal, not metalness ~1.
- **Caption facts that are load-bearing and undocumented**: the pill's top edge
  at ~0.883 of frame height is a binding layout constraint; a `blend` cut makes
  the caption **lead the picture by up to 0.65s**; `#cap` is `nowrap`, single
  line, with nowhere to put a legend.

### Group 5 — Ergonomics (bandaids, all of them, and that is correct)

ffmpeg banners off stdout; `shoot.js` progress to stderr; the oversize warning
acts rather than printing a command; 2D shadow/bloom unit traps documented with a
`camAt(t)` accessor so screen-constant quantities are expressible. None of these
has a class behind it; they are friction, and friction is fixed one piece at a
time.

---

### What we deliberately do NOT build

Keeping faith with the earn-in discipline, and with the open-endedness rule:

- **No 2D shot solver.** The film that was built to want one concluded the
  `{x,y,zoom}` rail was expressively sufficient; it earns three small things
  instead (seconds-anchored keyframes, an exposed `camAt(t)`, a documented hold
  idiom). Porting the ladder would buy least and cost most.
- **No register-aware lint engine.** Two candidate instances exist; no film has
  been *blocked*. Revisit when one is.
- **No content templates, scene presets, or genre scaffolds.** This is the line
  that protects "any scene you want".
- **No motion blur** for `whip` — instead, stop promising it: rename or document
  it as a fast cut until a film pays for the sub-sample pass.

---

### Addendum — what the two-character scene taught (2026-07-22)

Pass three shipped, then a fight scene between two existing characters was built
as an end-to-end exercise. It confirmed the plan's central bet and added one
finding the eleven earlier films had produced without anyone naming it.

**The earn-in rule worked, in both directions.** `warp` was deferred in pass
three as "no film is blocked on it" — every film that wanted slow motion had
shipped without it. One scene later a film genuinely needed it, and it shipped
then. That is the rule functioning, not an exception to it. Conversely, this
scene did **not** earn a `build.js contact` checker (below), and it did not get
one.

**A fourth root cause, hiding in plain sight: contact points are never
declared.** Four films had already hit this and each was written off as a
one-off — a payload dot arriving at empty space, a hammer head hanging clear of
its plank, a domino sweeping between the paddles, a body descending offset from
the gate that opened it. The fight made it a pattern: **`h`/`w` describe the
FRAMING extent, and the interaction point is a different number that nothing
records.** Authors reach for the number that is written down.

This is the same shape as root cause 2 — *vocabulary that promises more than it
measures* — one level further in. `h` was corrected from "the subject's height"
to "the extent that must stay in frame"; it still says nothing about where the
thing actually touches. Resolved by documentation plus the measurement technique
(`Box3` through `page.evaluate`, the same probe the cross-section film used),
**not** by an instrument: four films hit it and none was *blocked*.

**One process failure worth recording against myself.** Five rounds were spent
tuning multipliers before anything was measured, and each round made the scene
worse. The fix took minutes once the offsets were read. This is precisely the
"iterate by looking, not by hoping" failure `method.md` documents — committed by
the author of the pass that added the measuring instruments, in the same
session. The lesson is not "measure more"; it is that **the pull toward tuning a
coefficient is strongest exactly when a thing is nearly right**, and that is the
moment to stop and instrument.

**Still open on that scene:** geometric contact is not legible contact. Both
blows now overlap on all three axes and still read as clipping rather than
impact, because the contact point sits behind a body. The rule is written down
(`method.md`); the scene has not been re-staged.

### Sequencing

1. **Group 1 first**, because every subsequent measurement depends on it, and
   because two of its items (single-sample determinism, black-frame-as-advisory)
   are the two ways this pipeline can currently ship something broken while
   reporting success.
2. **Group 2**, verified against the three films that cropped their own payoff.
3. **Group 3**, each primitive landed with the control that motivated it.
4. **Group 4/5** docs, harvested last so they describe what actually shipped.

**Verification standard for the whole plan:** re-run every committed example plus
the test films from clean, isolated directories — the concurrency defect means
several of this run's own motion numbers cannot be trusted as measured, and the
re-run is the control on the fix.
