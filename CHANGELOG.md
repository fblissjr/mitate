# changelog

Versions before 0.13.0 are the history of this skill under its former name,
`screenwright`, inside the `fb-claude-skills` marketplace. Those entries are
reproduced **verbatim** — they name the old plugin, its old paths, and its
sibling plugins as they actually were, because a retrospective rewrite would
make the record say things that never happened. The rename and repo split are
0.13.0. See the provenance note in [`plugin/README.md`](plugin/README.md).

## 0.23.0

### fixed

**`STYLE.dof` produced no depth of field, and now does.** The RIG fence
called `THREE.dof()` with two wrong arguments against three r185's
signature `dof(node, viewZNode, focusDistance, focalLength, bokehScale)`:
argument 2 was a depth texture where the node wants **view-space Z**
(`PassNode.getViewZNode()`), and argument 4 was passed a `maxBlur` — which
is not a parameter r185's `dof()` has at any position.

The symptom is worth stating precisely, because "broken" is too coarse and
the coarse version is what a check would have missed. Enabling `STYLE.dof`
**did** change the frame: it applied a uniform, barely-perceptible softening
with no depth falloff. What it did not do is respond to its own parameter —
byte-identical renders at `maxBlur` `.016`/`.10`/`1.0`, and identical again
at `focalLength` `0.8` vs `400.0`, a 500× sweep. A depth texture in the
viewZ slot saturates the circle of confusion everywhere at once, leaving the
knob nothing to move. So "is there an effect" cannot distinguish working
from broken; only "does the parameter do anything" can.

It failed silently in every direction: no page error, smoke green,
`STYLE.dof` truthy, `THREE.dof` a function, and `uFocus` correctly tracking
the solver. **The solver half was right the whole time** — `shotFocus`
interpolates 8.18 → 5.62 across a `blend`, probe-measured — so the rack focus
resolved exactly as documented and the render simply ignored it.

Nothing caught it because nothing had ever entered the branch: no scene in
the corpus enables `STYLE.dof`. `film-language.md` said so and told the next
reader to bracket it before trusting a look to it, which is a warning that
only pays when somebody runs the bracket.

**New control: `templates/bracket-dof.js`.** Four arms, all byte comparisons
between two renders of one `t`, so they hold on any backend with no
reference image. One arm is the claim — the frame must change when
`focalLength` changes — and it was observed RED against the pre-fix fence
(`9bebe068` vs `9bebe068`) and green after. The other three are the blast
radius: they held `8d13783f` identically across both runs, which is what
proves the fix was not bought by blurring scenes that never asked for it.

### changed

**`STYLE.dof`'s option shape is `{focalLength, bokehScale}`** (defaults
`2.5` / `3`), replacing `{maxBlur}`. These are three's own parameter names,
chosen deliberately over a friendlier alias: the invented `maxBlur` is how
the call and its documentation drifted apart without either looking wrong.
`focalLength` is in **world units** — how far off the focal plane a thing
goes fully soft — so it scales with the set and a value that reads on one
scene means nothing on another. Updated in the fence store, all eight
carriers, `film-language.md` and `breakdown.md`.

Verified across the corpus: the fence change moves **zero rendered pixels**
in every existing scene, since all of them take the `if(STYLE.dof)` false
branch. Confirmed by rendering `gearbox`, `materials` and `menagerie` at the
same `t` before and after.

## 0.22.3

### changed

**A success criterion is measurable, human-routed, or deleted** (owner rule).
`instruments.md`'s *What has no instrument* ledger loses **"whether a beat is
funny, warm, or tense"** and gains the rule that keeps it out: every entry is
a property of the artifact that is either reachable by an instrument nobody
has built yet, or real, decidable and reachable only by a human who must
therefore be asked. A criterion that is neither is not a gap in the toolkit.

The framing was the defect, not the sentence. A ledger titled *what has no
instrument* turns each entry into work someone should do, and an undecidable
property has no ground truth to build an instrument against — so that work
cannot fail, which means it cannot succeed. It also quietly relocates what a
corpus film is for: these scenes exist as **test cases for recursive
improvement of the skill, the harness and the instruments**, not to be good.
Every surviving entry is now one of the two admissible classes.

## 0.22.2

### fixed

**`agents/film-reviewer.md` verified against the code for the first time, and
three drift items fixed.** The file shipped from the day the plugin had an
agent and had never been audited end to end; it was also the one shipped
markdown file with no row in `docs/shipped-provenance.md`, because the 0.22.0
scrub's working set was "files carrying a date" and this one carried none.

- **A false mechanism claim.** The brief stated that "both the 0.6 and 0.95
  samples land inside `CONFIG.flashes` windows on the beats bracketing a world
  cut" as a structural property. It is arithmetic dependent on beat length and
  flash half-width, and it is **false on the only scene in the corpus that
  declares flashes**: `scenes/crash.html` anchors `{beat:'halt', at:0, w:.12}`,
  and the preceding beat's `0.95` sample lands 0.175s before the anchor —
  outside the window. Now stated as the arithmetic to compute against a
  scene's own `BEATS`, with the real common case named (`0.05 × dur < w` on
  the beat before an `at: 0` flash).
- **Reference pointers that dangle from an install cache.** Three were written
  `plugin/skills/mitate/references/...`, which resolves from a clone and from
  nothing else — the plugin subtree IS the cache root. Rewritten plugin-root
  relative, the form an installed reader actually has. Same invariant-3 class
  as 0.22.1, and invisible to `selfcheck.js` check 5, which resolves markdown
  links rather than backticked paths.
- **Three amendment narratives survived the 0.22.0 scrub** ("this cited a
  repo-local rules file until it shipped", "this line dropped both for four
  versions", "wider than this line once claimed"). Check 4 matches ISO dates;
  these carried none, so the enforcement covered one third of the rule it was
  written for. Removed.

### changed

**`docs/shipped-provenance.md` states its row set as a derivable rule** — one
row per line of `git ls-files 'plugin/' | grep '\.md$'` — rather than leaving
it to be inferred from the rows present, which is how a 14-file scope came to
have 13 rows.

## 0.22.1

### fixed

**`instruments.md` no longer cites `site/app.js`** — a path outside the
shipped subtree dangles in every install cache (invariant 3, the same class
the plugin README was caught in). Both mentions now name the showcase
player by role; the technical claims around them are unchanged.

## 0.22.0

### changed

**Every shipped markdown file is date-free current state** (owner rule: the
skill loads into working context, and an agent using it only needs what is
true now — an amendment date or a decision narrative is history riding
along). The dated **Provenance** headers, **Amended** blocks, version tags
and correction narratives are gone from SKILL.md and all eleven references;
the verified-against-what record they carried moved to
`docs/shipped-provenance.md` (one row per shipped file, updated in the same
motion as a re-verification), and history stays where it always was — git
and this changelog. Two things deliberately survived in the shipped files,
dateless: **trust labels** ("inherited from the predecessor stack, not
re-measured here", "never audited end to end") because they are current
state, and the **"Not here" routing edges** because they are routing.
Dependency pins (`three@0.185.1`, `r185`) also stay — they are the stack a
measurement binds to, not release history.

**`selfcheck.js` check 4 inverted with the move.** It used to REQUIRE a
dated provenance header in every reference; it now FAILS on any ISO date in
any markdown under `plugin/`, walking the filesystem rather than
`git ls-files` so a scratch file is caught before staging. The "Not here"
edge requirement survives unchanged. Red observed, green earned after;
`bracket-selfcheck.js` gains the check's first arm (an untracked dated
fixture under `plugin/skills/mitate/`, which also proves the filesystem
walk). This entry read "Red observed **before the scrub** (26 dated lines
across the tree)" until it was re-derived on 2026-08-07: the pre-scrub tree
carried **40** dated lines across 12 files
(`git grep -nE '20[0-9][0-9]-[0-9][0-9]-[0-9][0-9]' 2a0f547^ -- 'plugin/'`).
26 was a mid-scrub reading — which is how the day's log and the postmortem
both worded it — and the changelog alone promoted it to a before-and-after
figure it never was.

**No example-film citations remain anywhere in the shipped skill.** Every
"see `examples/<film>.html`" and film-name attribution became either the
technique itself (where a snippet or template already carries it) or a
plain "measured on a corpus film" provenance note. Techniques whose ONLY
worked evidence was a retired film are logged as snippet-harvest debt in
`working-plan.md` (first: the instanced-field outline pass; also the
`normalBias` shadow fix and the physical/SSS integrated demo) — paid
scene-by-scene as portfolio films land, never by authoring untested code
into a reference.

## 0.21.0

### changed

**The plugin ships zero films** (owner call, revising option E the day
after it landed: a shipped example gets copied instead of learned from,
and the skill's job is to teach building, not to hand out finished work).
`gearbox.html` moved to `scenes/` with the rest of the corpus and the
shipped `examples/` directory is gone — the install cache is now SKILL.md,
references, templates and the film-reviewer agent, nothing else (~93% of
the remaining shipped bytes were that one film). Every pointer moved in
the batch: SKILL.md's Examples section replaced by a no-films statement
under References, CLAUDE.md's Map and invariants 2 and 4 (parity command
is three globs now), the pre-commit hook generator (reinstalled), all
three workflows, both READMEs and the site copy, `netlify.toml` and
`site/.gitignore` comments, the defect-corpus README's contrast line,
and the extract-patterns skill's destination list.

**`stage-films.sh` stages one home.** `scenes/` is required rather than
tolerated-absent, the `MITATE_EXAMPLES` override is retired for
`MITATE_SCENES`, and its bracket ran red before the edit (all three arms,
on the moved tree) and green after.

**Five shipped brackets repointed at the corpus.** `bracket-determinism`,
`-liveplay`, `-noise` (gearbox), `-check-kit` and `-commands`
(noise-chart) resolved their fixture scenes from the shipped examples
directory — a path that went half-dead when the corpus moved at 0.20.0
and nothing pushed since, so no CI run ever saw it. They now resolve
`scenes/` at the repo root; brackets are repo controls that happen to
ship as dev tooling.

**`selfcheck.js` check 2 derives its scan set from `scenes/`.** It
scanned the shipped examples directory, which silently narrowed the
three-pin stamp check to one film at 0.20.0 and to zero today; it now
scans the corpus home, where every embedding scene lives. Check 6's
comment-citation scan moved with it. `derived-counts.js` retires the
`examples` countable for a `scenes` one and deliberately keeps
`scenes`/`films` out of the bare-count net (generic prose nouns — the
first run flagged a dozen narrative phrases).

## 0.20.0

### changed

**Examples-placement option E, executed** (decided 2026-08-04; batch
condition fired when the first portfolio film landed). The install cache
now carries ONE example film — `gearbox.html`, the teaching baseline and
bracket fixture — instead of five; `bear-and-bees`, `menagerie`,
`materials` and `noise-chart` moved to `scenes/` at the repo root:
tracked, CI-smoked, fence-parity carriers, staged onto the site by
`stage-films.sh` (which now stages both directories; its bracket ran
green before and after the edit), just not shipped. Every pointer moved
in the same batch: CLAUDE.md's Map, invariant 2's parity command (four
globs) and invariant 4's wording, the pre-commit hook generator
(reinstalled), all three workflows (a film leaving the plugin does NOT
leave the gate), SKILL.md's Examples section, both READMEs, the plugin
README, and the line-anchored citations in `docs/addressing.md` and the
extract-patterns skill.

**The full smoke run now states its parity scope on green** — the same
`N file(s) scanned, M fenced line(s) held byte-identical` line
`--parity-only` prints. The first cold build had its scene's fences
compared three times with no way to know; the string is built once for
both modes, its derivation is controlled by `bracket-parity`'s scan arms
(all 33 green after the change), and the full-run print's uncontrolled
edge is disclosed in the code comment beside it.

### added

**`scenes/crash.html`** — the market-crash film, revised per the
`film-reviewer` pass that was the shipped agent's first real exercise
(verdict: promote after fixing). The middle beats now draw the causal
loop the captions assert (call-lines candle→marker, sell-streaks
marker→book with a stepped, impact-flashed ask ladder, feedback bolts
book→tape through the cascade); the reveal keeps a strictly positive
print rate across phase boundaries instead of the summed-ramps stall;
the outro fades the world down so the loop lands bg-to-bg; the break
crack is sized to survive a thumbnail; plus a poster still. **It is in
the corpus, not the shipped examples** — the owner held the 2D
teaching-baseline promotion on the n=1 principle: more portfolio scenes
get built and reviewed before that slot is filled. The cold-built
original stays untouched under `internal/` as the scene-analysis
fixture.

## 0.19.6

### fixed

**Three corrections from the cold build's transcript-derived timeline**
(the independent reconstruction is `docs/scene-analyses/`' first record;
this repo, not the plugin, carries it):

- `instruments.md`'s inert-expression entry no longer says the blink
  "shipped invisibly" — the transcript shows it caught pre-delivery, by
  incidental hand-inspection during the continuity pass. The wording had
  inherited the builder postmortem's own frontmatter drift; the corrected
  line states what is true and still damning: invisible to every
  instrument, caught by nothing in the toolkit.
- SKILL.md step 8 now says a build task list must carry the field report
  as a task. The cold session mirrored steps 3–7 into its list, omitted
  step 8, announced the report at delivery, and never wrote it — the
  omission in its own planning structure is the traced cause.
- SKILL.md step 4's nocap command now names its output file
  (`<name>.nocap.sheet.jpg`) — the different filename cost the cold
  session four recovery calls, including reading a stale sheet and
  grepping the tool's source to check its own arguments had taken.

## 0.19.5

### changed

**Step 4's review delegation softened to delegate-or-review-inline**
(owner call, 2026-08-05, settling the question the cold build raised).
The first cold-start session never invoked `film-reviewer` — it ran the
instruments inline, read every image, caught real defects pre-delivery,
and shipped. The instruction now names both paths and states the real
requirement: the images get read; the delegation guarantees fresh eyes,
it does not gatekeep the review.

## 0.19.4

### added

**What the first cold-start build taught, written where the next build
will read it.** The market-crash film (2026-08-04) was built by an
installed-plugin session with no repo context — the docs-only test the
work queue called for — and it shipped in one pass with zero tool
errors, catching two real defects pre-delivery with the shipped
instruments. Its postmortem also named what nothing caught, and each
finding now lives in its home:

- `references/method.md`: two rules in the semantics axis — route every
  2D canvas draw through `txt()` from the first draft (hand-rolled
  `fillText` opts out of `?strip=text` silently, and the nocap sheet
  still looks normal), and run the nocap sheet early on any text-heavy
  2D scene, not only at review. New continuity-axis section "A composed
  periodic can be constant": that build's halt-banner blink,
  `sin(quant(t,2)*π*2)`, was exactly 0 from the first draft — pure in
  `t`, no pop, invisible to `motion`'s whole-frame delta — so the rule
  is to `probe` any composed periodic at 4-5 `t` values before shipping
  it.
- `references/instruments.md`: the no-instrument ledger gains both
  classes — the `txt()` bypass (a strippable pass certifies only
  opted-in text) and the inert sub-expression, which every instrument
  reports clean by construction.
- `SKILL.md` step 7: `build.js all` leaves its intermediate PNGs in
  `frames/` (a 37s export left 1,110 PNGs, 52 MB) — deliberate tool
  behavior, but nothing in the workflow said to clean it up, and that
  build noticed only during its postmortem.

## 0.19.3

### fixed

**Five drifts across the two documents about to become load-bearing,
found by a fresh-eyes claim audit the day before the first cold-start
build.** Two auditors ran against 0.19.2; every finding was re-verified
against the code before the fix.

`SKILL.md` (the cold session's entire teaching surface): the fence list
omitted `CONTRACT` — one of seven parity-checked fences, and the block
carrying the four `window.*` exports the same file calls load-bearing —
so a cold reader could hand-edit it believing it sat outside the parity
set; the two WebGPU flag hazards had merged into one wrong sentence
(hand-rolled flags fail deterministic-black; `WEBGPU=swiftshader` fails
NON-deterministic, warmth-dependent, and is refused — `backend.js` and
`webgpu-stack.md` agree, the old line attributed each mode's symptom to
the other's cause); and the numbered workflow ended at step 7, so the
method's closing step — the film field report added in 0.19.2 — was
unreachable by construction for a reader following SKILL.md's own
routing. It is now step 8.

`plugin/agents/film-reviewer.md` (used the moment the next film ships,
last touched at 0.16.32): its definition of "smoke passed" omitted the
blank-frame check, shipped-frame spread, and live playback — the check
built because everything else was blind to a frozen film — and named two
of seven fences; and its semantics instruction dropped `method.md`'s
explicit caveat that `nocap` cannot strip mesh-built 3D labels, on the
two-of-three templates where that matters most. Both lines now carry the
full sets and point at their owners.

## 0.19.2

### added

**The method gains its closing step: the film field report.** `method.md`
ends with "The last step of a film" — after shipping, the builder writes
three honest bullets into whatever record they keep: what they built
twice, what they re-derived, and what they copied out of an example scene
(and what for). The convention existed as exactly one hand-arranged
instance (the 2026-07-25 report) under a name that collided with the
retired next-session memo and with no producer-side home, which is why it
happened once. Now it is a step of the written method, so a builder
following the method produces one without being asked — capture as a side
effect of making a film, which is VISION's own phrasing for the flywheel.
`method.md`'s heading map gains the section and drops its hand-written
section count; the map's own rot warning applied to itself.

Upstream records aligned in the same motion: `pattern-ledger.md` states
the report's form follows the builder's record (no mandated file) and
names `/extract-patterns` as the executable consumer; `VISION.md`'s
"the mechanism is unbuilt" corrected to half-built — capture is now the
method's step, extraction is the repo-side skill, and what remains
unproven is the loop actually turning, which only films can demonstrate.

## 0.19.1

### changed

**`breakdown.md`'s "Not here" edge moved above the amendment paragraphs**,
directly after the founding provenance. Same failure class as
`instruments.md`'s this morning: dated amendments accumulate above the
edge and push it past selfcheck's fixed header window — breakdown's sat
325 bytes from the boundary (measured 2026-08-04), one amendment from
red. Structure only; no wording changed.

## 0.19.0

### added

**REP3: the open bags police their own keys.** `build.js check` warns on
any `STYLE` or `CONFIG` key that nothing reads — not the fences the scene
carries, not the scene's own code — naming the nearest known key when one
is within two edits, so a misspelled `exposure` is a named near-miss
instead of a silent render at the default (`breakdown.md`'s founding
finding for these two tables). The kit vocabulary is derived from the
canonical fence store's reads at check time, never listed — a hand-held
registry is another copy of the code, which is the phase's recorded
refuted-if — and consumption is decided by the scene's own text, which is
what lets a film-private key pass with zero annotation and keeps the
verdict correct for a 2D scene declaring a SOLVER-read key (warned as
carried-by-no-fence, not passed on vocabulary).

One deliberate deviation from the phase text, taken on measurement: the
film-private marker was not built. No carrier consumes these bags
indirectly (destructuring, `Object.keys`, computed access — measured
2026-08-04 over all 8 scenes plus the corpus fixture), so the first scene
that needs indirect consumption is the marker's trigger.

Recorded red first (`bracket-commands.js` gained the pair: misspelled
`exposur` must fire naming `exposure`; a declared key the scene reads must
stay quiet), and the derivation's first run over the shipped corpus found
a real defect: `scene2d.template.html` declared `STYLE.faint` ("not-yet-
active linework") and nothing read it — dead since it was written, its
value hardcoded nowhere. Deleted. After that deletion, all 8 scenes check
warning-clean, which is REP3's gate. Verified locally 2026-08-04:
bracket-commands 40/40, bracket-check-kit 6/6, bracket-corpus 3/3,
selfcheck and parity green.

## 0.18.2

### fixed

**The REP2 review's three behavioral findings, closed as one red-first
cascade — the shared root was silent input substitution, and the fix in
every case is that the substitution now says so.** Each landed with its arm
watched red against the pre-fix verb before the change:

- **An anchor fraction written as a scene constant no longer errors on a
  value the source never wrote.** `at:['beat', SOME_CONST]` hit the
  0.16.70 class one field over: the unresolved-reference proxy stringifies
  as `undefined`, so `check` exited 1 quoting it on a scene that drives.
  Both spellings (a shot's `at` fraction and a 2D `KEYS[].at`) now warn as
  unresolved, naming what goes unchecked — the shot's start time, so its
  ordering. New `bracket-commands.js` arm beside the `durconst` one it
  mirrors; arithmetic ON such a constant still collapses to `NaN` and
  errors, which `instruments.md` now states.
- **`mutatedAfterDeclaration` learns dot-assignment.** The scanner knew
  `.push()` and bracket-assignment but not `SUBJECTS.legend = {...}`, so
  `check` read the stale literal WHILE claiming coverage and errored
  `unknown subject` on a scene that drives fine. The new spelling matches
  no shipped carrier (grepped templates, examples and the corpus,
  2026-08-04); its arm proves the fixture now draws the declared
  assembled-at-runtime warn instead of the false ERROR.
- **The STYLE stand-in declares itself.** A `STYLE` assembled from a bible
  (`const STYLE = BIBLES.x`) is beyond the literal reader, so the solver
  ran against a quiet `{}` whose lens default satisfied a match cut the
  scene's real lens makes a driven page refuse at boot — same fence code,
  two verdicts, green on the broken one. `check` now warns whenever STYLE
  is declared-but-unreadable and shots carry `match`/`fov`. Agreement is
  not achievable there (the stand-in cannot know the lens), so the sixth
  `bracket-check-kit.js` arm pins honesty instead: a new declared-divergence
  arm form requires `check` to exit 0 SAYING the stand-in while the driven
  page refuses with the match-cut throw.

**`execKit` tests scene tables with `Object.hasOwn`, not `in`** — the
review's diff-pass nit: `in` walks the prototype chain, the same
inherited-lookup shape the KERNEL's null-prototype `BEAT` fix killed one
layer down.

### changed

**The reference and the headers say what the review measured.**
`instruments.md`'s check section no longer claims `SIZES` is read from the
scene's source text — it comes from executing the canonical fence store,
sound only because parity holds — and gains the executor's environment
seam (an identifier declared nowhere is a `ReferenceError` in a page and
`undefined` in `execKit`) plus the declared-substitution behaviors.
`build.js`'s header marks its one-way-strictness examples as a class, not
a list (the `38e3773` correction, applied to the file that still had the
old shape), and `bracket-check-kit.js`'s header scopes its identity claim
to inputs `check` can actually read. Verified locally 2026-08-04:
`bracket-commands.js` all 38 rows, `bracket-check-kit.js` all 6 arms,
parity 9 files / 5,796 held lines, `check` clean over all 8 scenes,
selfcheck green.

## 0.18.1

### added

**The defect corpus is wired, three days after it was tracked — and the
wiring corrected the doctrine.** `bracket-corpus.js` (in the gate's bracket
loop, seven-PR-old forward item, owner-ruled) walks up to
`fixtures/defect-corpus/` (skipping with a stated reason where the corpus
does not exist — it deliberately never ships) and asserts what one
measurement showed is actually true of it: the fixture PASSES smoke — its
fourteen documented defects are composition-class, invisible to the
pass/fail gate — so "kept broken so a check that stops catching is noticed"
was never the mechanism, and CLAUDE.md plus the corpus README now say what
is: a calibration target for the review instruments, pinned by usability
(smoke still passes) and the VERIFIED rows' derivable signatures (row 10b
via `check`'s repeat-framing warning naming `SHOTS[2,6,9,11]`; row 11 via a
probe of the walker's real width against its declared 2.8). Recorded red
against a healthy scene before being trusted; a row leaving UNVERIFIED
earns its arm in the same change. Bonus noted on the REP track: row 11 is a
characterized wrong extent, so REP4's red-first fixture already exists.

## 0.18.0

### changed

**`build.js check` executes the canonical fence store instead of mirroring
it — REP2 on the representation track.** The KERNEL and SOLVER fences load
from `fences/` beside the tools and run against the scene's extracted
tables, so beat accumulation, anchor resolution, rung lookup and every
solver refusal are now the kit's own code path. The 2026-08-02 review's
thirteen open findings — `check` and the kit disagreeing in both directions,
with nothing comparing them — close as a class: there is one model now, and
a new bracket (`bracket-check-kit.js`) runs the review's four divergence
cases through BOTH instruments and requires the same verdict with the same
phrase. Recorded red first on all four: `check` was green on three defects
a driven page refuses (only one of which, a missing `size`, was a clean
in-scope solver throw — an empty `SHOTS` crashed downstream on a TypeError
and `subject: []` was a silent NaN box, per the next paragraph), and the
kit was silent on the prototype-named beat `check` already refused. Green
after. The subject, focus and rung refusals now quote the kit's own throw
(`unknown subject: x`, `unknown size: x`), with the declared names
appended; where `check` is deliberately stricter than the kit — among the
cases: an anchor fraction outside 0..1, a duplicate beat name, out-of-order
shots, `FRAME.px` disagreeing with `FRAME.aspect` — the divergence is
one-way (the kit accepts and mis-renders, `check` refuses) and is declared
in the verb's header as a class.

**The kit refuses three silent-NaN shapes it used to accept.** `BEAT` is
built on a null prototype, so a shot anchored to a prototype name
(`toString`) now throws `unknown beat` instead of resolving an inherited
function into NaN spans; the solver refuses an empty `SHOTS` at load with
its own message instead of dying later on an unhelpful TypeError; and
`subjectExtent` refuses an empty subject list instead of building an
Infinity box and rendering a blank film under a green boot. All three
regenerated into every carrier from the store by `--parity-fix`.

**A scene that throws while booting now fails the recorder immediately**
(`shoot.js` races the `sceneReady` wait against the first page error)
instead of sitting out the full 20s timeout to report a certainty.

## 0.17.3

### fixed

**Three parity findings from PR #9's post-merge review, each landed
red-first as a new or tightened `bracket-parity.js` arm.** (1) A red
`--parity-only` run counted a drifted fence's lines in its "held
byte-identical to the canonical store" figure, so the verdict line on
exactly the runs where the count matters most overstated what parity held;
lines now count only when the block matches the store, and a FAIL-run arm
pins the number. (2) A duplicate `--store` silently last-won — the same
value-flag hygiene class the existing refusals close — and now refuses,
naming the rule. (3) The store-refusal message for an unreadable `fences/`
now names the remedy where the reader is standing: copy the `fences/`
directory from the skill's templates/ so it sits beside the copied
smoke.js — the 0.17.1 workspace class, taught at the point of failure
instead of rediscovered from it. All three arms were recorded red against
the pre-fix smoke.js (the duplicate-store arm exited 0, confirming
last-wins) and green after, 33 arms total.

## 0.17.2

### fixed

**`bracket-noise.js`'s mutation arms tripped the new carrier-vs-store parity,
so one arm failed and two were green for the wrong reason.** Every patch
injects into the DRIVER fence, which pre-store was inert for a lone scene;
since 0.17.0 the mutated fixture fails parity before the console classifier
is ever measured. In the 0.17.0 gate run the driver-shaped arm failed
outright, and the warns-for-real and claims-webgpu arms went red on the
parity message rather than the one they assert — a green bracket measuring
the wrong thing, the exact shape invariant 6 hunts. Patched fixtures now take
the documented divergence exit: their fence markers are neutralized so they
leave the parity set (fully de-tokenized — a half-visible `NAME-START` trips
the mangled-marker heuristic, measured on the first attempt). The unmodified
arm keeps its markers on purpose and now doubles as proof that a pristine
example still matches the store from inside a browser run. Verified
red-then-green locally on the arms this platform can measure; the
claims-webgpu arm is CI-arbitrated per its own documented note (a machine
serving real WebGPU has no fallback notice to detect).

## 0.17.1

### fixed

**The documented workspace omitted the fence store, so 0.17.0's smoke.js
refused to run in it.** SKILL.md's setup step copies four tools into the film
workspace; `smoke.js` now resolves `fences/` beside itself and refuses to
scan without it (correctly — a scan over zero fences reporting ok is the
defect class the store loader exists to close). Reproduced in a scratch
workspace built exactly as documented: the run dies on the store refusal
before the first scene. The copy list now includes `fences/`, and gate.yml's
workspace step — the same shape, and the same break — copies it too. The
census of the class closed at three: `bracket-driver.js` runs smoke.js
*mutants* out of a temp dir, so it now copies the store beside each mutant
(the fourth candidate, `bracket-commands.js`'s drift copy, only ever reads
smoke.js as text — no store needed, verified before leaving it alone).

Found because the `.github/` workflows were left out of the 0.17.0 sweep.
While correcting static.yml's parity-step comment, its neon-derivation
argument turned out to be carrying two stale hand-written facts: "all five
fences" (gearbox has carried six since `CONTRACT` joined at 0.16.44) and
line indexes measured before the file grew. Re-verified mechanically against
every fence gearbox carries, and the comment no longer states indexes at all.

## 0.17.0

### changed

**The fenced kit is single-sourced: parity inverted from "nine copies agree"
to "every carrier matches the canonical store."** The seven fences now live
once, in `templates/fences/<NAME>.fence.txt` beside `smoke.js`, and every
carrier's copy is checked against them. The gate for landing this was
byte-identity: the store was extracted from the carriers as they stood, and a
full `--parity-fix` over all nine reported nothing to do — zero behavior
change, proven before anything was allowed to differ.

What the inversion buys, each shape pinned by a `bracket-parity.js` arm run
red against the pre-store check first:

- nine copies drifting *together* — a bad propagation laundered into every
  carrier — now fails, because the store is the copy you edit deliberately;
- a single scanned scene is a real comparison (the store is always the other
  side), so the old "parity inert below two scenes" note is gone and a
  drifted singleton that used to exit 0 now goes red;
- the store is validated before any scan: a missing, partial, extra-file or
  mangled store refuses the whole run rather than silently shrinking the
  fence set it compares.

**`--parity-fix` is now regeneration, not propagation.** It rewrites fences
from the store; `--from` is refused with the reason (a named-carrier source
is a second source of truth). The run reports the fences that actually
changed, not the seven the store carries. All the write-path guarantees
carry over: validate every file before the first byte, writability checked
up front, a partial write is loud.

The workflow for editing shared kit code is now: edit the store copy, run
`--parity-fix`, read the diff. Hand-editing a fence inside a scene is the
thing the check exists to catch; a scene that legitimately diverges still
removes its markers and leaves the parity set. SKILL.md, `glossary.md`,
`instruments.md` and the site's source-of-truth wording updated in the same
release — "the one scene file stays the source" stopped being true as
written the day the kit became a build product.

## 0.16.70

### fixed

**A false ERROR on a valid scene, in a verb wired into every push hours earlier.**
`const HOLD = 2.5; ... dur: HOLD` is ordinary authoring. The unresolved-identifier
proxy made `typeof b.dur === 'number'` false, so `check` exited 1 and reported
`has dur undefined` — quoting a value the source never wrote, which is the worst
shape a false positive takes: it names something the author cannot find in their
own file. The same run reported a wrong total.

"This reader could not resolve it" and "the author wrote something invalid" are
different verdicts. Unresolved is now a **warning** that names the beat, says the
timeline after it is approximate, and puts `BEATS` in the not-covered list.

**The silent-green class 0.16.68 claimed to close was still open through the
other door.** A 3D scene whose `SHOTS` literal cannot be *sliced* — a malformed
block comment, an unbalanced bracket, a regex carrying one — returned `null` from
`tableSource`, which means "this scene has no SHOTS". So it printed
`no SHOTS (2D)` and a clean green, asserting a scene kind that was false.

`tableSource` now separates three states where it had two: **not declared**
(null), **declared but assembled at runtime** (IMPERATIVE, 0.16.68), and
**declared but unsliceable** (UNPARSEABLE, this release). Unreadable also joins
the not-covered list, which it never did.

Both watched red first — the valid scene exiting 1, the broken one silent — and
both found by a targeted code review of `check`'s reimplemented semantics, which
returned fifteen findings. The other thirteen are filed, not fixed; these two
came first because CI now runs this verb on every push, so the false positive was
live, and because 0.16.68's commit message asserted a class was shut that was not.

**And a scratch leak, found by the pre-commit hook while committing the above.**
`bracket-commands.js` mkdtemps its workspace into `cwd` and removes it in a
`finally` — but the unbuildable-fixture path called `process.exit(1)`, which
terminates without unwinding, so the `finally` never ran. Two `.mitate-cmd-*`
directories survived a repointed mutation string, were not gitignored, and were
swept up by `git add -A`. `selfcheck` check 9 caught them at the hook.

Now it throws instead, cleanup runs on both paths, and the pattern is gitignored
as a belt. The check worked; this is the leak it was catching.

## 0.16.69

### fixed

**The same unmeasured duration, in the second shipped file that carried it.**
`bracket-driver.js` said the `!fails.length` guard went unexercised for "four
months". It lived seven days — entered at 0.16.9 on 2026-07-25, removed
2026-08-01 — in a repository whose entire history is eight.

0.16.66 corrected the `smoke.js` copy of this figure and **grepped one file
instead of the tree**, so it fixed the instance and left the class, in the commit
whose message argued for fixing the class. Found by `/audit-claims` hours later.
Both shipped; both are now right.

The comment keeps its point at the true number, because the point survives and
sharpens: elapsed time was never going to surface this defect. A fixture that
could carry two defects at once was.

## 0.16.68

### fixed

**`build.js check` reported `ok` on a table it could not read.** Shipped one
version earlier, found the same day by `/audit-claims`. A scene whose `SHOTS` is
built by a loop gave `0 shot(s)` and a clean green; one returned from a call fell
into the same state as a 2D scene that has no `SHOTS` at all. Two legal shapes a
film could plausibly write, both silently uncovered by the verb whose entire
purpose is catching what a render would miss.

**It is the same silent-scope class closed for the brackets earlier the same
day** — a green indistinguishable from a run that checked nothing, which
`--parity-only`'s file count and the bracket tallies already close one tier up.
Fixing the instances did not prevent the next instance, which is the 2026-07-30
postmortem's conclusion recurring on a tool written by someone who had read it.

Now: `tableSource` distinguishes *declared but not a literal* from *not declared*
rather than collapsing both to null; a literal that later lines push into or
splice is reported rather than read stale; such a table draws a warning naming
it; the header says `SHOTS unread` instead of asserting `no SHOTS (2D)` about a
scene that declares one; and **the verdict line states its scope** — either the
tables covered, or the tables not covered.

Two arms, both watched red first against the live defect: a loop-built and a
call-built `SHOTS`, each failing with `exit 0, stdout lacks` before the change.
`bracket-commands.js` at 34 rows.

### changed

**Four claims that describe what `check` covers, corrected in the same commit,
because each becomes wrong in a new way if the verb changes without them.**

- `references/instruments.md` said such a table "is reported as unreadable rather
  than checked — in both cases it says which table it could not cover." It said
  nothing. Corrected in the file whose whole subject is what a check cannot see,
  and the remaining quieter blind spot — a `NaN` no comparison reaches — is now
  stated separately from the one that was fixed.
- `VISION.md` listed pre-render validation among its currently-false criteria.
  Now partly true, with the boundary drawn narrowly: true for the tables'
  internal consistency, still false for a declared extent versus its geometry.
  The determinism-magnitude criterion remains false and says so.
- `SKILL.md` routed `breakdown.md` as "what nothing checks" — inverted by 0.16.67.
- `references/breakdown.md`: `flashWidth` is read by all three templates, not
  "2D and character"; `cameraFloor` by both 3D templates, not "character only".
  Both errors came from a grep capped with `head -6` whose truncation was read as
  completeness. And the 2D camera does not "interpolate linearly" — values are
  lerped against a smoothstep-eased fraction, so motion eases rather than running
  at constant velocity.

## 0.16.67

### added

**`build.js check` — the declarative tables cross-referenced against each other,
before a frame renders or the page loads.** R5 item 3, and the first consumer of
`references/breakdown.md`, which enumerated the layer and found its validation
column mostly empty.

It resolves every `subject`, `focus`, `size` and beat name a shot uses; rejects
an `at` fraction outside `0..1`, shots out of time order, a `KEYS` or
`CONFIG.flashes` entry naming a beat that does not exist, a duplicated beat, and
a `FRAME.px` that does not describe `FRAME.aspect`. It warns on a union shot
taking a rung whose anchor is a body landmark, on a caption above the reading
speed `smoke.js` already owns, and on three or more shots sharing one framing.
No browser, no encoder, no frames — string work over the scene source, so it runs
on a scene too broken to load, which is exactly when a name error is cheapest to
find. Today a mistyped subject throws only on a frame where that shot is live: a
viewer finds it, not the toolchain.

**It is not a second exception to the prime directive, and the distinction is
the design.** That rule binds tooling which DRIVES a scene to the window
contract; `check` drives nothing and reads only kit-owned table names, never a
film's own identifiers. Going through the contract was considered and rejected on
two grounds: `window.SHOTS` is deliberately a `{t, cutEnd}` projection and the
authored fields are on no window at all, and a scene whose shot names a
nonexistent beat throws inside `beatAt` at load — so it never reaches
`sceneReady` and a contract reader would have nothing to inspect.

**One work-list item was deliberately NOT built: declared-versus-measured
extents.** Comparing a declared `h`/`w`/`d` against geometry means naming scene
objects, which is `build.js probe`'s admitted exception. Extending it on the way
past would have been the cheapest possible way to lose the rule. `check` prints
that gap on every run, green ones included.

**One work-list item turned out not to exist.** "`BEATS` sums to `DURATION`" is
undecidable in the useful sense: `TOTAL` is *derived* from `BEATS`, so the two
cannot disagree. `breakdown.md` had already said so and the plan had not caught
up. What replaces it is the coherence that IS decidable — no duplicate beat name,
every `dur` positive — plus `FRAME.px` against `FRAME.aspect`, which
`breakdown.md` listed as unvalidated and is the same kind of fact.

**Narrowed once, against a shipped film, and that is the finding worth keeping.**
The rule as specified — "union shots use only wide rungs" — condemns
`bear-and-bees.html`'s two-shot, which asks for `MS` on a pair deliberately and
annotates itself as doing so. It supplies `anchor:.45`, and the solver prefers an
explicit `anchor` over the rung's own, so that shot is not making the mistake.
The check now fires only on a union that overrides nothing, and
`bracket-commands.js` carries the anchored case as an arm that must stay quiet.
Without it the first run of this verb would have reported a correct, shipped,
commented shot as a defect.

### changed

- **`bracket-commands.js` gains a `check` row per property the verb decides**,
  each mutated from a real shipped scene rather than hand-written, plus
  `expect.absent` for the false-positive direction and `expect.build` for the one
  arm whose fixture is the tool pair rather than a scene. Every arm was watched
  go red with its own check neutralised; the union pair was additionally run
  end-to-end through the harness with the narrowing removed, which reports FAIL
  and exits 1. Its fixture builder refuses to write an unmutated copy, so an edit
  to `noise-chart.html`'s tables breaks the controls loudly instead of leaving
  arms that assert nothing.
- **The caption threshold has one home and `check` reads it out of `smoke.js`**
  rather than restating it, so the two instruments cannot disagree about the same
  beat. Renaming the constant makes `check` refuse rather than fall back — which
  is itself an arm.
- **`references/instruments.md`** gains the `check` section: what it decides, at
  which severity, and the three things it cannot see.
- **`references/breakdown.md`** amended the same day it was written, by the work
  it specified. Its validation column now records what `check` closed, and it
  gained two `SHOTS` fields the enumeration had missed — `anchor` and `anchorX`,
  both read by the solver and both used by shipped examples. Reading a spec does
  not find those; writing code against it does.
- **`SKILL.md`** routes to `check` at step 3, the moment the tables exist.
- **`fixtures/defect-corpus/README.md`**: defect 10b moves out of the UNVERIFIED
  table. `check` finds **four** shots sharing a byte-identical framing, not the
  five the prototype's squint strip reported — the fifth differs by `elev` alone,
  which the eye reads as the same card and a table comparison does not. The rung
  half of that row is untouched and stays unverified.

## 0.16.66

### fixed

**A duration in `smoke.js` that was never measured, off by roughly seventeen
times, in shipped content.** The comment explaining the removed `!fails.length`
guard said it *"survived four months."* It entered at 0.16.9 on 2026-07-25 and
was removed on 2026-08-01: **seven days**, in a repository whose entire history
is eight. The same figure has been repeated in several tracked files.

It was written to convey "a long time" and read as a fact — which is the class
this repo has spent two days closing, arriving here as an elapsed-time claim
rather than a count. Corrected rather than deleted, because the point survives at
the true figure and sharpens: a week was enough, because nothing was ever going
to find this defect by elapsed time. What found it was building a fixture that
could carry two defects at once.

## 0.16.65

### added

**`references/breakdown.md` — the declarative layer, enumerated.** R5.2, and the
prerequisite `VISION.md` and the open shape question both name: you cannot choose
a representation for a set nobody has listed. Derived by reading the three
templates and every shipped example rather than from the plan; the `STYLE` and
`CONFIG` key surfaces were enumerated mechanically, which is why the
kit-versus-film split is known rather than guessed.

One section per table — `BEATS`, `STYLE`, `CONFIG`, `FRAME`, `SUBJECTS`, `SHOTS`,
`SIZES`, `KEYS`, the character proportion vector — each with its fields, its
consumers, and what validates it.

**Four findings that change what comes next rather than merely recording it:**

- **The layer is uneven.** The proportion vector is a real schema that throws on
  violation; `STYLE` and `CONFIG` are open bags that validate nothing. A
  misspelled `exposure` renders at the default and looks like an authoring choice.
- **Validation clusters where a mistake is UNREPRESENTABLE, not where it is
  expensive.** Unknown names throw because a lookup fails. The errors that are
  representable — an extent that does not match its geometry, an anchor outside
  its beat, a caption that will not fit — have no check, and every one is
  decidable from the tables before a frame renders.
- **`STYLE` has twelve kit-read keys and the template declares three.** An author
  scaffolding from a template cannot discover the other nine except by reading an
  example, which this project treats as a defect rather than a route. Seven more
  keys are film-private, and nothing in the source distinguishes the two kinds —
  so extending the kit risks colliding with a name a film already uses.
- **Two kit-read `CONFIG` keys appear in no template**, `flashWidth` and
  `cameraFloor`.

The character vector is named as the model worth copying: a fixed schema with one
typed hole (`matFor`), from which one constructor yields a bear, a human and an
invented strider. Structure at the seam, arbitrary code in the leaf.

Deliberately not enumerated: geometry construction and per-frame motion, which
are authored code rather than declaration and are where most of a film's lines
live. Naming that boundary is as far as an enumeration can go, and it is the
question the enumeration existed to make answerable.

`SKILL.md` routes to it. `VISION.md`'s "enumerate first" paragraph is updated,
since it described a thing that had not been done and now has.

## 0.16.64

### changed

**The parity run reports the size of the tax it exists to measure.**
`--parity-only` now derives and prints the fenced lines held byte-identical
alongside the file count: `ok — 9 file(s) scanned, 5704 fenced line(s) held
byte-identical`. Summed over what was actually read, so a narrowed glob shrinks
the figure instead of reporting the old one.

### fixed

**A hand-written count in `smoke.js` was stale by ~24%, in the file that does
the counting.** The `--parity-fix` comment read "4,611 lines are held
byte-identical", measured 2026-07-30 — before `CONTRACT` became the seventh
fence (0.16.44) and before the defect-corpus fixture became the ninth carrier
(0.16.45). The true figure is 5,704. Eleven versions stale, in shipped content,
and restated in three other tracked files.

Nothing could have caught it. "Lines held byte-identical" is not one of check
13's registered countables, and no bracket reads prose. This is the second
instance found in two days of the same shape — a count sitting in a blind spot
between the checks built to eliminate counts — and the remedy is the same one
both times: derive it, or delete it. The comment now points at the run.

`docs/restructure-2026-07.md` carried it twice. The undated instance now points
at the command; the dated one is kept, annotated with the re-measurement and the
reason it grew, because a dated figure is a record rather than a claim.

**The fence list had two copies in `smoke.js`, and the generator was reading the
wrong one.** `--parity-only` (which ENFORCES) iterated a bare literal;
`--parity-fix` (which PROPAGATES) used `const FENCES`. They agreed, so nothing
was broken — but `scripts/derived-counts.js` scrapes `const FENCES` to fill the
fence-count marker, which means the instrument whose stated guarantee is that it
*"cannot miss and cannot false-positive, because it never has to recognise
anything"* was deriving the enforcing list from the propagation copy. Hoisted to
one module-scope `const` consumed by both. Deleting the copy is O(0); guarding
two is O(n) and one more thing that can misfire, and `source-of-truth.md` already
says to prefer the deletion.

**Two shipped files still said six fences.** `references/glossary.md` — *"Six
exist: KERNEL, SOLVER, RIG, DRIVER, CHARACTER, HTML"* — and
`templates/bracket-parity.js`'s header. `CONTRACT` became the seventh at 0.16.44,
so both had been wrong for twenty versions, in content that ships to every
installed user. This is the **third and fourth** instance of the exact defect
`instruments.md` carried and check 13 was built to close at 0.16.57. They
survived it for two structural reasons, both now stated where they bite: the
sentence carries no registered noun, so the bare-count scanner cannot see it, and
`derived-counts.js` filters to `.md`, so a `.js` header is out of reach by
construction. Both now name the array instead of restating it — including the
glossary line, which says in as many words not to trust a restatement, itself
included.

## 0.16.63

### changed

**Version reconciliation. No plugin content differs from 0.16.62** — this bump
exists so a check can tell that, and the reason is worth recording because it
will recur the next time two plugin-content branches are open at once.

0.16.61 and 0.16.62 were independent branches, each bumping the cascade. Landing
them together puts both bumps behind one merge, and `selfcheck` check 11 anchors
on the last commit touching `plugin.json`. A merge commit that simply took one
side's version would be TREESAME to that parent, so git's history simplification
skips it and the anchor lands on the *branch's* bump — leaving 0.16.61's
`smoke.js` and `bracket-driver.js` looking like plugin content that changed with
no bump behind it. They are not: they ship in this version. The bump is what
tells the check so, and it is carried in the merge commit itself rather than a
follow-up, so the anchor is the merge.

Squash-merging trades the failure rather than fixing it — the cascade check goes
green and the freshness check reds on every doc dated to the previous day,
because the committer date becomes the squash date.

**Check 11 is blind to merge topology.** Recorded rather than fixed: changing a
check means running its bracket red-then-green first, and that is its own change.

## 0.16.62

> **Ordering note.** This entry is numbered 0.16.62 because 0.16.61 is claimed by
> the open determinism-trio PR, which is independent of this one and touches
> different files. **That PR should merge first.** If this one lands first
> instead, 0.16.61 must be re-bumped rather than merged behind a higher version.

### changed

**R5.1's state seam: `setCamera(t)` → `setCamera(state)`, where `state` holds
only `{t}` today.** The indirection buys one structural thing — the DRIVER owns
what goes in, and the kit never reads anything the timeline driver cannot
produce. A bake, a viewer and an input driver all need to widen this exact
argument, and widening a parameter is a local edit where changing a signature
across every carrier is not. The plan's reason for doing it now holds: it gets
several times more expensive after Phases 3 and 4, once face state and baked
tracks are authored as functions of `t`.

Propagated across all 8 carriers with `--parity-fix --from` the named canonical
rather than eight hand edits: `SOLVER` carries the signature, `DRIVER` the
`const state={t}` construction, and `scene2d` carries neither (it has no camera).
Zero stale `setCamera(t)` call sites.

### fixed

**`gaitPose` no longer reads mutable scene-graph state.** `rootX` defaulted to
`rig.root.position.x` and was correct only because every caller assigned
`root.position.x` on the line above — an ordering dependence inside `animate`,
not an argument, and exactly what a bake trips over since a baked track replays
poses with no scene graph to read back from.

`rootX` is now required, with a **loud throw** rather than a default: the silent
failure is NaN foot targets, a film that renders and is subtly wrong. **5 of 7
call sites were relying on the default**; all now pass the same
pure-function-of-`t` value they already computed one line above. A green corpus
run is therefore real evidence that no caller was missed.

### docs

**The pattern ledger's evidence was audited and it was wrong in two ways.** Four
rows cite "the 2026-07-25 film", which is a local prototype rather than anything
tracked. Every such citation is now labelled
`(local)`, per the rule that a claim may cite a local artifact but must not rest
on one.

The presence-gating row claimed `Math.max(1e-4,…)` **×7**. Re-counted: **×11**.
The ledger's own introduction restated "seven times" as well, so one stale figure
lived in two places; the intro now points at the row instead of repeating it.

**The trigger still stands** — two spellings is drift, so `hide(obj, u)` remains
justified — but the drift is between one tracked file (`bear-and-bees`, ×1) and
one local one. `hide(obj,u)` and `subjectFromObject` are therefore NOT
promoted here: each is a separate change with its own red, and neither belongs
bundled into a branch that has already made two behavioural changes.
## 0.16.61

### changed

**Phase R's first unit: the determinism trio, restructured under an oracle that
existed first.** The trio bundled two decisions into one `try` block, and only
one of them had ever been argued.

**"Fail rather than warn" stays** — deliberate and correct: an advisory check
crashing must never flip the exit code, a determinism check crashing must.

**"Abandon every remaining check" is gone as a blanket rule.** It was never a
decision; it is what a throw does inside a `try`, and the trio shared one.
Preserving a behaviour through an extraction is not the same as it having a
reason. The two are independent axes and this file already proved it before the
split: `checkShippedFrame` and `checkLivePlayback` are HARD checks that catch
internally and continue, so "hard" never implied "abandon". There were three
tiers in the code and the comments described two.

What a throw costs is now **declared per check** (`onThrow`, beside `requires`),
with `abandon` / `continue` / `warn` mapping onto those three tiers.
**Undeclared is a hard error, never a default** — a default is exactly how the
unargued behaviour arrived, and would let a new check inherit a policy nobody
chose for it.

Only one policy actually changed: `checkBlankFrame`, `abandon` → `continue`. It
destructures `{ PLAN, frames, fails }`, touches no page state, and is array
indexing. **Measured red:** forcing it to throw took the run from 3 advisory
warnings to 1 — the two caption results vanished and framing/exposure never ran,
losing information for no safety gain.

### fixed

**The `!fails.length` guard is gone, and what it cost is measured.** It read
`fails` GLOBALLY, so any unrelated earlier failure silently disabled the only
check covering load-time nondeterminism. Written at 0.16.9 with no recorded
reason, never exercised by any control, and it survived four months because
demonstrating it needs a fixture carrying TWO defects at once — which is why the
plan recorded the fix as blocked on a red-able fixture that did not exist.

`bracket-driver.js`'s `CLEAN` fixture (0.16.58) made one constructible: a random
drawn at load, plus a playback loop never started so an unrelated hard fail lands
before the trio. **With the guard, smoke reported only the playback failure — a
scene whose live HTML and recorded MP4 are different films shipped green on the
clause the project rests on.** Without it, both are reported.

`frames.length` stays and is a real precondition (the check compares against
`frames[0]`). `!fails.length` never was one: this check navigates and reloads the
page itself, so nothing it reads depends on an earlier check having succeeded.
Two halves of one `if` with opposite justifications.

**The arm for it was 3% flaky on its first cut and that is recorded rather than
quietly fixed.** It offset a rect by `Math.round(loadSeed * 90)` — 32 reachable
values, so two loads collided about one run in thirty, the frames matched, and
the arm read WRONG-MESSAGE. Observed failing once and passing once with no code
change. The load value now drives a continuous rotation, which differs unless two
raw doubles are bitwise equal. A control that is right 97% of the time teaches
people to re-run it until it agrees.

Gate for the unit, per Gate R's second clause: red recorded before the change and
green after, both re-runnable as arms rather than cited from memory, and corpus
verdicts byte-identical across all 9 scenes.

## 0.16.60

### fixed

**`SKILL.md`'s frontmatter description was 1093 characters against the Agent
Skills 1024 limit, and had been over it since 0.16.18.** Bisected rather than
assumed: `406d9ec` migrated the skill in at **898** (under), `9f99ce4` took it to
**1371** at 0.16.18, and it has been over ever since — drifting down to 1093 but
never back under. That is roughly forty versions, including the 0.16.40 sitting
in the local install cache right now.

**The predecessor hit the same defect independently** — `predecessor-record.md`
has it at 1150, "pre-existing, surfaced only because 0.17.0 had to touch the
file", closing with **"Nothing in the run's checkpoint checks it."** Nothing here
did either. Two lineages, one defect, twice written down and never checked: that
is a missing control, not a missing reminder.

Trimmed to 986 with 38 characters of margin. Nothing load-bearing was dropped:
every trigger word survives (`video`, `animation`, `cutscene`, `walkthrough`,
`explainer`, `simulation`, `movie`, `animated meme`) and so does every cost
disclosure the description exists to make before invocation — SILENT, NOT
INTERACTIVE, RE-AUTHORED with no import path, and the do-not-use clause. The
register list lost two entries that the trigger list already carried.

### added

**`selfcheck` check 14 — the description limit is now enforced**, so the third
occurrence cannot be silent. Bracketed both ways in `bracket-selfcheck.js`: an
over-limit arm that must red, and a within-limit arm that must stay green, since
a length check is trivially satisfied by one that always fails. The over-limit
fixture pads a continuation line so the folded scalar stays valid YAML and only
the length changes — a malformed block would red for parsing and prove nothing
about the limit.

## 0.16.59

### added

**A sixteenth arm makes the `CLEAN` fixture's framing HEADROOM a controlled
claim, not a comment.** A green arm says the fixture is under the threshold; it
says nothing about by how much, and a control resting on an unmeasured margin is
one renderer change away from failing for a reason nothing on hand explains. The
arm halves `FRAMING_INVARIANCE_MAD` to 4 and requires the fixture to still pass,
so the margin is asserted by a run on every platform the bracket reaches, and it
reds with slack left rather than at the moment coverage is lost. Verified both
ways: green at 4, and BRACKET FAILED at 0.4.

Observed on macOS, recorded as an observation and nothing more: 0.473 narrow /
0.422 wide. Those figures are not re-derived by anything and are explicitly not
cross-platform — 0.16.58's gate run establishes only that the fixture is under
the threshold on CI's WebGL2-fallback path.

**The first draft of that comment asserted the numbers held on both platforms,
from a single-platform measurement, and then tried to dodge the
measurement-assertion ratchet by rewording.** Both were caught before commit.
The ratchet was right: an unsourced number is debt whether or not the sentence
containing it uses the word "measured", and the fix is a control, not a
synonym.

### removed

**`.claude/rules/model-delegation.md` is gone, by owner call** — the standing
tiering rule was costing more than it bought in practice. `working-plan.md` had
already filed the same conclusion from a different direction ("inline the intent
or drop it, since that rule does not ship"), so this closes that step rather
than opening a question.

**Two live pointers were rewritten with it**, which is the part a deletion
usually leaves behind: `CLAUDE.md`'s Map cited the file, and
`.claude/agents/control-builder.md` cited it to justify inheriting the session
model. The agent now states that criterion inline, where the decision is
actually made. Nothing mechanical would have caught either — `.claude/agents/*`
carry no freshness marker by design, and `CLAUDE.md`'s Map is checked in the
entry-to-Map direction only, so a Map line pointing at a deleted file is exactly
the gap. Remaining mentions are in the CHANGELOG, a postmortem and
`working-plan.md`, all dated records that stay true.

### fixed

**Check 13 crashed instead of reporting when a tracked file was absent from the
working tree.** `git ls-files` lists the index, so a file deleted but not staged
is still in it, and reading every entry blindly threw ENOENT and took the whole
self-check down — reporting nothing about the counts while blaming the wrong
file. Missing entries are now skipped and named in the check's own line, in both
the passing and failing branches, so a run cannot quietly read less than it
claims. Found on a live instance in a shared checkout.

## 0.16.58

### added

**`bracket-driver.js` gains the reachability arms — R4.1's unreproducible half
becomes a control.** That gate rested on two things: byte-identical verdicts
across the `checkScene` extraction (reproducible, and independently reproduced)
and a forced-assertion run proving the determinism trio's assertions still reach
the verdict. The second was a one-off manual mutation in a scratch directory
that no longer exists. Since the argument was "equality alone is a weak oracle
for these three", the load-bearing half was the half nobody could re-run.

Three arms force one condition each — `checkDeterminism`,
`checkReloadDeterminism`, `checkBlankFrame` — and require that check's own
message. A fourth is the negative control that gives them teeth: the assertion
forced AND its push routed into a local sink, which makes smoke report `all
scenes pass` at exit 0 with the message absent. That is exactly what the three
would go red on, and without it "the assertions reach the verdict" would rest on
arms never shown capable of noticing that they do not.

**A second disconnection shape is already covered elsewhere, found by trying
it:** dropping `fails` from the destructure is caught at module load by the
requires guard, so the sink is the shape that survives it.

### changed

**The arms needed a fixture that passes smoke outright**, and `SCENE` could not
be it. `checkReloadDeterminism` is guarded by `!fails.length`, and `SCENE` fails
live playback by construction — so forcing the reload assertion against it would
have produced nothing and read as a broken arm rather than as the guard doing
this. The new `CLEAN` fixture reports `all scenes pass` at exit 0, which is what
makes the trio reachable and each message attributable.

Two of its properties were arrived at by running it, not by design. It draws its
own letterbox rather than using CSS, because `framingReader` maps window
coordinates into the canvas buffer via `canvas.width / innerWidth` — a
fixed-size buffer letterboxed in CSS makes the check read a different region at
every window shape (measured: MAD 30.3 narrow, 34.6 wide, against a threshold of
8). And it draws ~240 deterministic cells, because a flat two-rect frame
compressed to 1555 bytes against a 5760-byte floor, failing the very
blank-frame check the third arm exists to force.

Bracket cost: 15 arms, 0 skipped, ~40s with a browser available.

## 0.16.57

### added

**`selfcheck` check 13 — a derived count may not drift from the thing it
counts.** Check 12 closed one shape of the no-hand-written-counts rule; this
closes the class. The instrument is a **generator, not a scanner**, and the
reason is measured: the forms a count takes in prose are unbounded, and the
`CLAUDE.md` violation the rule was written for was a parenthetical —
`` `references/` (9) `` — so three greps written specifically to find it came
back empty on a violation this repo had already documented. A scanner has to
recognise a count in arbitrary prose and cannot. A generator fills a marker it
placed itself, so it can neither miss nor false-positive.

`scripts/derived-counts.js` owns a REGISTRY of countables — data, so adding one
is an entry rather than a new check — and a `--write` path that refills every
`<!--derived:key-->` marker. Check 13 recomputes them and fails on disagreement,
the same shape check 8 already uses against the installed pre-commit hook.

**Found immediately, which is the argument for it.** `instruments.md` asserted
"Six fences are registered" and listed six, omitting `CONTRACT` — stale since
0.16.44 made it the seventh, in a file that **ships to every installed user**, so
the count and the list had disagreed with `smoke.js` for eleven versions. The
same stale six appeared in `docs/plan.md` and in `.claude/skills/extract-patterns/`,
the last of which nothing mechanical had ever covered. The corpus README said
"twelve characterized defects" while carrying fourteen table rows, three of the
twelve having been split into sub-lettered rows with the sentence never
revisited. Four more counts were correct but latent — "the five shipped
examples", "Three companion references" — each certain to rot on the next
addition.

### changed

The bare-count half is **best-effort by admission** and scoped by data: registry
nouns only, live-claim files only. Scanning every tracked file surfaced 71 hits,
essentially all legitimate history; scanning the front-door files surfaced five.
Both figures were measured before the check was written. `CHANGELOG.md`, the
session logs, the postmortems and the two planning documents are excluded as
dated records, and a genuine mention carries `<!--count-mention-->` on its line —
the use-versus-mention seam this repo has now failed six times, made explicit
rather than inferred.

What it does not cover is stated in the check: a noun outside the REGISTRY, and
anything in an excluded record. A handoff listing four cached plugin versions
where five are installed is outside every guard here; the answer there is to
cite the command, not its output.

## 0.16.56

### added

**`selfcheck` check 12 — a bracket may not state its own arm count in prose.**
Built red against **eight live violations in five bracket files**, which is the
argument for it: `source-of-truth.md` has said "never hand-write what a command
produces" for weeks, and the rule has now been broken four separate times —
`gate.yml` read "all three" while four brackets were globbed; `CLAUDE.md`
asserted "9 references" while selfcheck derived the number every run;
`bracket-parity.js` said "five ways" while running 22 rows; `bracket-driver.js`
said "nine ways" while printing `10 arm(s) exercised` two lines below it. A rule
written down and violated four times is not a rule, it is a wish.

**Narrow on purpose.** A first cut flagged any number near "arm" and matched 28
lines, nearly all legitimate — "one arm each", "the two arms that matter",
"four arms that could not tell each other's failure apart". Those are narrative
and history, and history does not rot. The dangerous ones describe the file's
OWN CURRENT structure and take three forms; the check matches those and nothing
else, and a bracket arm pins the distinction by injecting a narrative count and
requiring it to stay green.

### changed

**Every bracket now prints a derived count, so the number exists without anyone
writing it.** Five of six previously ended on "all rows as specified" with no
figure — the count was only obtainable by counting rows by eye, which is why the
prose copies survived. `bracket-parity.js` now reports `all 22 arms as
specified`, against a header that claimed five. `bracket-commands.js` already
derived its own `ran` and simply was not printing it.

## 0.16.55

### fixed

**Four false or stale claims, three of them inside shipped files.** Found by an
independent audit of what 0.16.53 and 0.16.54 recorded against what the tree
actually does — the claims were written in the same sitting as the code they
describe, and every one of them read as correct.

- **`bracket-driver.js` said "nine ways" and "Arms 1-7 / 8-9" after 0.16.54 added
  a tenth arm** (`SHOT_CHECKS reordered`). Five stale spots in the header of a
  file that ships to every installed user, and the commit that added the arm
  mentioned it nowhere. The count is derived and printed at runtime
  (`10 arm(s) exercised`), so the prose was the only wrong copy.
- **`bracket-driver.js` claimed it keeps the ctx defect reachable. It does not** —
  no arm moves the setup assignment after the advisory loop. That is a claim of
  measurement naming no control that reproduces it, in the file whose whole job
  is controls. The claim is removed rather than weakened; the observation is a
  dated record and lives in 0.16.53's entry above.
- **`smoke.js` said `setupScene` was the only writer to `ctx` besides
  `checkDeterminism`.** There are three: `checkScene` writes `ctx.beats`.
- **`smoke.js`'s "zero edges" premise had expired.** It was true of the six checks
  that existed when the derivation was refuted; B3 then gave the trio real edges
  (`checkDeterminism` provides `frames`, two others require it). The CONCLUSION
  is unchanged and now rests on the right reason: a sort would derive that one
  constraint and still admit wrong orders, because what actually orders this file
  is page state, which is not a ctx key. Deriving a fraction is worse than
  deriving nothing — it looks principled and still needs the hand-written rows.

No behaviour changed. Verdicts are unaffected: every edit is a comment.

## 0.16.54

### changed

**R4.1 stage 3 — the setup block and the determinism trio leave `checkScene`,
which finishes at 155 lines from 594.** The last stage of the extraction, and
the coupled one: three hard checks sharing one captured frame array, none with
its own `try/catch`.

`setupScene` takes the `?record=1` load, the contract assertions and everything
derived from them (`dur`, the sample `PLAN`, `t`, `backend`). It is called
directly rather than driven from a list, because a list models a choice of order
and there is none — nothing can precede the load that produces the page. It is
also the only thing besides `checkDeterminism` that writes to `ctx`.

`checkDeterminism`, `checkReloadDeterminism` and `checkBlankFrame` become
`SHOT_CHECKS`, driven through the same validating driver as the other two lists
and asserted in the same `CHECK_ORDER`. **The error semantics are preserved
exactly**: none carries a `try/catch`, so a throw reaches `checkScene`'s outer
catch, becomes a FAIL, and abandons the remaining checks — unlike the four
advisory checks, which degrade to a warning. Wrapping these the same way would
have converted three hard fails into warnings while every corpus verdict stayed
green.

The captured array is `ctx.frames`, not `ctx.shots`: `window.SHOTS` is the
scene's shot list, an unrelated contract name that the inline version shadowed
one block apart.

**The `!fails.length` guard on the across-reload check is carried unchanged and
is known debt.** It reads `fails` globally, so any unrelated failure silently
disables the only check covering load-time nondeterminism. Preserved
deliberately: this stage's gate is byte-unchanged verdicts on an all-green
corpus, where a fix could not be validated by the same run that makes it
visible.

**Verdicts are byte-unchanged across all nine scenes — and that was not treated
as sufficient.** These checks emit nothing on a green corpus, so an extraction
that orphaned one would produce identical output. Each of the three assertions
was forced true in turn: every one fired on all 9 scenes and flipped the exit
code, which is what says they are still wired to the verdict.

`Function.prototype.toString()` under Bun also merges adjacent `const`
declarations into one declarator list, which false-redded the new destructuring
cross-check the moment `checkDeterminism` was written. The anchor accepts `,` as
well as `;`; `ctx.inner` still refuses.

## 0.16.53

### added

**The check driver validates `ctx`, and the check order is asserted** — the two
pieces of debt R4.1's extraction created, both in `smoke.js`, both now under
`bracket-driver.js` (nine arms, seven of them browser-free).

Before the extraction, `dur` and `t` were block-scoped `const`s, so reading one
early threw a TDZ `ReferenceError`. `ctx.dur` read before the setup block
assigns it is `undefined`, silently. That trade was measured rather than
assumed, by moving the setup assignment after the advisory loop: one correct
scene drew a hard `render is 100.0% near-black` (every sample time became NaN),
while framing invariance went **silently all-clear** on the same run, because
every window shape sampled at NaN is identical and a check comparing a frame to
itself cannot fail. Confidently wrong on one arm and quietly powerless on the
other, from a single missing key.

Each check now declares the ctx keys it reads, and one driver — `runChecks`,
not the checks themselves — asserts them on entry. Validation is by **presence**
(`k in ctx`), never definedness: `beats` is legitimately `undefined` for a scene
exporting no `window.BEATS`, and both caption checks handle that themselves. All
nine corpus scenes export it, so the two readings are indistinguishable here and
the wrong one would have shipped green — measured against a BEATS-stripped
scene, where presence passes with the intended `skipped` warnings and
definedness fails the scene outright.

The declaration is **cross-checked against the pattern each check destructures**,
so `requires` cannot drift from the code beside it. That guard rests on an
engine behaviour worth naming: `Function.prototype.toString()` under Bun returns
a re-print of the parsed AST, not source text, so `const p = ctx.page` comes
back as a destructuring pattern that was never typed. The first mutant written
to prove this arm red came back **green** for that reason — the mutation was
normalised into the shape being looked for. An arm now pins the behaviour.

**Order is asserted, not derived.** Deriving it from a `requires`/`provides`
table was designed and refuted by measurement: no check writes to `ctx`, so
`provides` is empty for every one of them and the topological sort has zero
edges — every permutation equally valid under the scheme while exactly one is
correct. `CHECK_ORDER` records the constraint that puts each check at its index,
so a reorder argues with a reason rather than with a list.

Verdicts are byte-unchanged across all nine scenes.

## 0.16.52

### changed

**R4.1, stages 1 and 2 — `checkScene` goes from 594 lines to 267.** Six checks
move to module scope, each taking one `ctx`: the four advisory ones (caption
speed, caption overflow, framing invariance, exposure) and the two hard
pre-record ones (shipped frame, live playback). Driven from `ADVISORY_CHECKS`
and `PRE_RECORD_CHECKS`, whose order is load-bearing and said so in both.

Every stage was gated on byte-unchanged smoke verdicts over 9 scenes — the three
templates, five examples, and the defect-corpus fixture, which is the one that
exercises failure paths. Baseline: all pass, 4 advisory warnings.

**A green diff was not treated as sufficient, because for these checks it is not
sufficient.** All nine scenes pass, so the hard checks emit nothing, and an
extraction that silently orphaned one would produce byte-identical output — the
silent-coverage-loss shape, invisible to equality. So stage 1's comparison was
mutation-tested until it went red (neutralising the crushed-exposure threshold
dropped three warnings, tally 4 → 1), and stage 2 proved **reachability**
instead: each extracted check was forced to push a marker, and both markers
appeared on all nine scenes with the exit code flipping.

**A premise in the restructure plan turned out false and is corrected in the
code.** It described these as "each already has its own try/catch and its own
name — a list wearing a function costume." Six do; the determinism trio does not.
Extracting them as one uniform list would have converted three hard fails into
warnings while every verdict on the corpus stayed green.

### added

**`selfcheck.js` check 11 — plugin content may not change without the cascade.**
Invariant 2 was prose with no enforcement: check 1 verifies the three version
sources *agree*, and nothing verified that a change *triggered* them. This branch
broke the rule undetected — two commits edited a shipped template while the
version sat still, and check 1 printed "version cascade coherent" on both.

**It was built red, against the live violation, before the bump that fixes it** —
the state that made the red possible would have been destroyed by fixing first.

The anchor is the last commit that touched `plugin.json`, and choosing it was the
whole difficulty. The obvious anchor — merge-base with `origin/main` — was built,
run, and measured wrong twice: it **exits 0 on the live violation** (an early
bump permanently satisfies a whole-branch version delta), and `origin/main` is
not reliably fetched by the CI checkout, so it would crash on exactly the pushes
and PRs it gates. Anchoring on the last bump fixes both and needs no remote ref.
It does need real history, so it belongs in `static.yml`.

Not a ratchet, unlike checks 5 and 10: there is no budget to lower, only whether
the version moved with the content.

## unreleased

### added

**Track E0 — the encoder boundary is pinned and may only shrink.**
`selfcheck.js` check 10 records which functions may shell out to
`ffmpeg`/`avifenc`/`img2webp`, per function, seeded at the honest baseline of
**ten call sites across nine functions** rather than at a target.

This comes *before* the migration it serves, which is the plan's own ordering and
worth restating: Track E's claim is that an agent should be able to build and
review a scene with bun and a browser and nothing else, so "what is export?" has
to stop being a judgment call. Once the list has ratcheted down, export is
whatever is still inside it, and each migration is a deleted line here rather
than an assertion in prose.

It fails in **three** directions, one arm each in `bracket-selfcheck.js`: an
encoder in a function that is not pinned (drift in), an extra call inside one
that is (drift within), and — the direction a ratchet exists for — a pinned site
that no longer exists, meaning a migration landed and the budget was not
tightened behind it. The escape hatch is deliberately the same one
`ASSERT_BUDGET` uses rather than a second mechanism: a legitimate new export verb
edits the literal, in a diff, with a reason.

**The check's first run failed on its own bracket.** A comment there named the
call pattern in full, and the scanner read it as a call site — the
"a control must not contain the defect it injects" rule, violated by the comment
explaining that rule. Check 10 now skips comment-only lines, which is scoping
rather than relaxation since the subject is what executes; the fixtures stay
assembled at runtime regardless, because leaning on a scanner's blind spot to
keep a control honest is the wrong direction.

**`/extract-patterns` — the flywheel's extraction half.** `VISION.md` has argued
that capturing a pattern should be a side effect of making a film rather than an
act of discipline afterwards; `docs/pattern-ledger.md` counts the rebuilds and
says plainly it *"has no way to extract one"*. This is that half.

Reads a scene, a session log, a postmortem or a directory of them, and proposes
which techniques belong in the references — each with evidence, a destination
from `source-of-truth.md`'s homes table, and a `pattern-ledger` row. **It writes
nothing**, because an extractor that writes becomes the fifth place a fact can
live, which the one-home rule forbids.

**Built to run on work the runner did not do**, which is the property that makes
it worth having: the author felt the necessity behind every choice and is
therefore the worst-placed reader of which ones were general. Its primary filter
is `VISION.md`'s own — does this leave the ENGINE better equipped for the next
film, or did it only make THIS film better — made decidable by six tests, and it
is deliberately not a code filter, since staging, pacing and legibility are what
the references were mostly built from.

Known gaps, recorded rather than hidden: **it has no bracket**, so nothing yet
proves its criteria can reject a plausible local pattern or accept a subtle
general one; its destination-check step is the expensive one and the easiest to
fake; and **it has never been run**.

*Record correction: this landed in commit `7f0732e`, whose message describes only
a downscale measurement. The commit was already pushed, so it was left alone
rather than rewritten — this entry is where the addition is actually findable,
which is what `source-of-truth.md` assigns the CHANGELOG.*

## 0.16.51

### changed

**Track E1 — `poster`, `sheet`, `aspect` and `strip` no longer need an encoder.**
The review tier runs on bun and a browser alone. That is the point of the track,
not dependency hygiene: `VISION.md`'s subject is the build-review loop, and every
external dependency on that loop is a tax on what the project is for.

All four did the same thing through ffmpeg — read already-rasterized stills,
scale each, lay them out on a background — so they collapse into one in-page
tiler (`build.js` `tileStills`) that replaces **five** call sites. `aspect`'s
hardest constraint disappears with it: its cells have different pixel dimensions,
which ruled out ffmpeg's tile filter *and* the image2 demuxer, and a `contain`
fit into a square box expresses it directly.

**Measured, both directions.** With no encoder on PATH the harness tier goes from
`review 0 exercised / 5 skipped` to **`4 exercised / 1`** — the one remaining is
`motion`, which is deferred rather than blocked. With encoders present all 17
rows still pass. Output geometry was checked against the layout arithmetic rather
than assumed: `sheet` 966×546 (2 cols × 480 + 6 padding), `squint` 276×51
(3 cells × 90 + 3), `aspect` 960×240 (4 shapes × a 240 square box).

**The downscale did NOT change, and that is the load-bearing part.** The squint
strip's 480→90 reduction is 5.3× supersampling and that supersampling *is* the
antialiasing; a native 90px render scores 44.8% intermediate tones on edges
against canvas's 59.9%. Only the scaler moved. The reasoning is recorded in
`build.js` beside the code, labelled as a recorded finding rather than a control
— nothing in the repo re-runs those numbers, and the comment says so.

**The encoder ratchet tightened 10 → 5** in the same commit, which is what proves
the migration happened rather than asserting it. `selfcheck.js`'s check 10 fails
if a pinned site disappears without the pin being lowered.

**Docs corrected in the same edit, not after:** `SKILL.md`'s Environment section
and `build.js`'s header both listed ffmpeg as a flat prerequisite. Both now say
what actually needs one. `bracket-commands.js`'s header said "nine rows need an
encoder"; it says five, with the note that this number has been wrong before.

## 0.16.50

### fixed

**The last four review findings, 12-15 — the controls that did not control.**
Each was demonstrated by breaking `build.js` and watching the bracket stay green
before the fix, then go red after.

- **`bracket-commands.js` ran `build.js` against the tracked
  `scene.template.html` in place.** Neutralising the embed guard and running the
  bracket **changed that tracked file's hash** — the ~1 MB inflation that
  "reached `git add` once", rebuilt inside the control meant to prevent it. It
  now runs against a copy in the temp workspace, keeping the basename so the
  guard still fires. Re-measured after the fix: the tracked file's hash is
  unchanged even with the guard removed.
- **The `all` row was satisfied by the `video` row's leftover mp4.** Removing
  the `video()` call from `all` left the row reporting `ok, tiny.mp4 written`.
  Every artifact expectation is now cleared before its row runs, so each proves
  its own work rather than inheriting a neighbour's.
- **`expect.stdout: ''` was never evaluated** — a truthiness test where its
  sibling correctly used `!== undefined`, so the `vendor` row had asserted exit
  0 and nothing else for its whole life while looking like it asserted output.
  Fixed both ways: the guard now tests presence, and an empty expectation is
  rejected outright so the vacuous form cannot come back quietly.
- **The `bash -e` bracket loop is one file, `scripts/run-brackets.sh`**, called
  by both workflows instead of copy-pasted into each with ~10 lines of matching
  prose. Fixing that trap at two call sites instead of once underneath is how
  the `!cancelled()` defect reappeared one level down.

### added

**`scripts/bracket-run-brackets.js`** — the loop both workflows now depend on is
the largest single point of failure here, since a defect in it disables every
other control at once while CI stays green. Four arms: a red bracket does not
hide its siblings, every red is reported rather than the first, a fully green set
says how many ran, and **a glob matching nothing fails** rather than reporting
green having run nothing.

**One honest correction found by mutation-testing it.** The script's comment
claimed `set -e`'s absence was what kept the loop going past a red bracket.
Restoring `set -euo pipefail` changed nothing and no arm noticed: the
load-bearing part is the `if ! bun run` construction, since a command inside a
condition is exempt from `-e` regardless. The comment now says which one holds
the property and which one is depth.

## 0.16.49

### fixed

**Three false claims — findings 7, 8 and 9 of the 2026-07-31 review.** Each was
verified against the tree before being rewritten, and two turned out worse than
the review said.

- **`bracket-commands.js` asserted a CI ffmpeg install that does not exist.** It
  read "the workflow installs ffmpeg precisely so those nine rows run",
  contradicting `444a649` on this same branch — the commit that *declined* the
  encoder job. No workflow installs ffmpeg and nothing sets `REQUIRE_ENCODERS`,
  so those nine rows skip in CI every time. The comment now says so and points at
  the tiered tally that reports it as a HOLE.
- **`fixtures/defect-corpus/README.md` claimed `gate.yml` coverage it does not
  have**, then explained five lines later why `gate.yml` cannot see the
  directory. A reader who believed the first sentence would have read the second
  as describing something else.
- **`CLAUDE.md`'s Map omitted the two directories this branch added, and
  invariant 2 still printed the two-glob verify command** after a ninth carrier
  joined — so two tracked files prescribed different commands for the same check.
  Both fixed; the command is now a fenced block naming all three globs.

### added

**`selfcheck.js` check 9: the Map's completeness claim is now checked.** The Map
says it covers "everything outside `docs/`" on the argument that anything absent
from a map is unreachable. Auditing that claim after fixing finding 9 found
**five more entries it had never named** — seven misses in one file. That is not
carelessness, it is the wrong instrument: a completeness claim maintained by
remembering to update it drifts exactly when someone adds a directory, which is
when nobody is thinking about `CLAUDE.md`.

**No exemption list, deliberately** — that would be the same prose problem one
level down, growing a line per failure until it exempts the thing that mattered.
An entry too minor for its own bullet shares one with its neighbours. Bracketed
in `bracket-selfcheck.js` by an intent-to-add fixture, because the check reads
`git ls-files` and an untracked file would have passed while proving nothing.

## 0.16.48

### fixed

**The silent-coverage-loss group — findings 5 and 6 of the 2026-07-31 review.**
Both have the same shape and it is the worst one a gate has: the verdict on what
was scanned stays correct while the scan itself quietly shrinks, and the exit
code is 0 forever.

- **An argument `smoke.js` cannot read is now a hard refusal.** It was
  `catch (e) {}`. Under bash an unmatched glob arrives as a literal string, so
  renaming `fixtures/defect-corpus/` would have left CI and every installed hook
  checking one directory less and reporting `parity/integrity: ok`. A directory
  argument (EISDIR) went into the same swallow. All bad arguments are collected
  and named at once rather than thrown on the first.
- **`--parity-only` now states its scope: `ok — 9 file(s) scanned`.** This is not
  decoration. The refusal above cannot catch the other half of the same failure:
  under `nullglob` the unmatched argument is removed from argv *before* smoke
  runs, so nothing inside it can know a directory was intended. A green line
  that says how much it covered is the only thing that makes that visible.
- **`selfcheck.js` detects a stale installed pre-commit hook.**
  `install-hooks.sh` refuses to overwrite a differing hook without `--force`,
  which is correct — but the consequence was that a hook installed before a
  command changed ran the old command forever and nothing said so. The check
  **fired on the machine that wrote it**: the installed hook was still the
  two-glob version from before `fixtures/defect-corpus/` became the ninth
  carrier, so commits were being gated on one directory less than the hook
  claimed. Skipped when no hook is installed, since CI has none. The expected
  body is extracted from `install-hooks.sh` rather than restated, so there is
  still one home for it.

Each fix was watched red first and then mutation-tested. One branch is labelled
rather than controlled: the no-heredoc fallback in the hook check is fail-closed
(it can only produce a red), and an arm for it would have to mutate the tracked
`install-hooks.sh` in place — the shipped-artifact hazard this repo removed from
another bracket. The comment says which of the two the mutation test kills.

## 0.16.47

### fixed

**`--parity-fix`'s write path — the four defects that blocked the merge.** The
command shipped in 0.16.43 and was already pushed, so these were a live hazard
rather than a design note. A `/code-review high` reproduced all four against
fixtures; each now has a bracket arm that was watched going red before the fix
landed, and each fix was mutation-tested afterwards by neutralising it and
confirming its own arm goes red again.

- **Writability is now part of validation.** Readability and fence
  well-formedness were checked and writability never was, so a read-only target
  threw out of an unguarded write loop and left the corpus **half-propagated** —
  precisely the state the design comment above that loop claimed to prevent. The
  arm puts the read-only file *after* a good target, so a write-as-you-go
  implementation is caught rewriting the good one.
- **The malformed-target guard inspects all seven fences, not the ones the
  source happens to carry.** A target broken in a fence the source lacks was
  rewritten anyway, exit 0. Live instance: `scene2d.template.html` carries 2 of
  7, so propagating from it validated two fences while writing nine carriers.
- **`--parity-only` and `--parity-fix` are now mutually exclusive.** `parityOnly`
  was computed and never consulted, so the read-only invocation that
  `static.yml` and the installed pre-commit hook run became a writer whenever
  `--parity-fix` sat beside it.
- **`--from` is refused without `--parity-fix`.** It was consumed regardless,
  swallowing the next filename out of a read-only scan — two genuinely drifted
  files scanned as one and reported green.

A residue remains and is labelled in the code as residue: `accessSync` answers a
permission question only, so a full disk or a lock can still throw at write time.
No arm reaches that path. It is now *loud* rather than silent — the run names the
carriers that landed — but it is depth, not a control.

### changed

**Every `--parity-fix` bracket arm asserts the refusal MESSAGE, not just a
non-zero exit.** The refusal text was captured and discarded, so *any* non-zero
exit satisfied *every* refusal arm and a crash satisfied all of them — four arms
that could not tell each other's failures apart. This is the same weakness
mutation testing had already caught once in this file, rebuilt one level up.
Refusal arms also now assert that **every** file in the fixture is byte-unchanged
rather than only the one they name, which is what made the half-propagated write
visible at all.

**Two arms for propagation paths nothing exercised:** multi-fence propagation in
one run, and the `HTML` fence — the only structurally different regex in the
check, and one production had already used on the defect corpus.

## 0.16.46

### changed

**The harness tier reports by tier — Track E's E5.** `8 verb path(s) exercised,
9 skipped` read as nine missing tests. It was telling two opposite stories with
one number: the four export rows are **deliberately** not gated, and the five
review rows are encoder-blocked **accidentally**, which is a real hole. One
figure cannot say both.

It now prints `core 4/0`, `review 0 exercised / 5 skipped`, `export 0/4` and
`red 4/0`, each with what its state means — and the review line says `HOLE`
outright when it is skipped, naming Track E1 as what closes it.

**This makes a coverage gap visible that the flat count hid: CI exercises none
of the review instruments.** Those are the tools the build-review loop actually
runs on, and the number that concealed it was green.

## 0.16.45

### added

**The defect corpus — R4.5.** `fixtures/defect-corpus/after-hours.html`, a scene
kept **because it is broken**, with characterized defects at known timestamps. A
new instrument gets a positive control the day it is written, and a regression
control the day someone changes it.

`working-plan.md` predicted its own failure here — *"The prototype scene is currently
the third such fixture about to evaporate"* — and was right: the prototype lives
on one machine, gitignored and unbacked-up. This is the fix.

**Outside `plugin/`, deliberately.** Everything under the plugin subtree ships
into the install cache, and a deliberately defective scene must not reach a user
as though it were an example.

**It JOINS the parity set**, and that decision is recorded beside the file. The
reason is not tidiness: **a regression control running a stale kernel is not
measuring the engine the instruments gate.** On import, 5 of its 7 fences had
drifted — `CONTRACT` absent entirely, `KERNEL`/`SOLVER`/`DRIVER`/`HTML` months
behind. It was brought current with `--parity-fix`, which is what makes a ninth
carrier affordable, and is wired into `static.yml` and the pre-commit hook.

Re-skinned from the prototype: theme, palette, title words and setting changed;
beat names, durations, captions, `SHOTS` and the rig unchanged, because what the
fixture is for is mechanical and none of it lives in the theme. Title words were
length-matched (11 and 6 characters) so the glyph metrics did not move.

**Measured constraint found the hard way:** the procedural alphabet defines
thirteen letters (`T H E A M N Z I G C R U S`). A first pass matched the
character count with `AFTER HOURS` and crashed in `buildWord` on the missing `F`.
Character count is not glyph coverage.

**Two of twelve defects re-measured against this build, and both numbers moved** —
which is exactly why the plan forbade assuming they carry over. `endcap` dead air:
`motion` 0.94 against peak 5.75 becomes **1.05 against peak 6.79**. The walker's
declared `w:2.8`: the prototype's measured 3.62 does **not** reproduce, giving
**3.12 @ t=5 and 3.30 @ t=20**. The remaining ten are listed in the corpus README
as carried-over and **UNVERIFIED against this build**, not as properties of it.

## 0.16.44

### fixed

**A false claim in the CONTRACT block of all eight shipped scenes.** Every
carrier said, of `t` purity, *"That is what makes the HTML loop and the MP4
render provably identical."* Nothing proves that: frames are not byte-identical
across backends (repo invariant 5), the default record path is the WebGL2
fallback while a viewer may be on hardware WebGPU, and an export is a lossy copy.
It now says what purity actually buys — that a frame can be re-rendered at any
`t`, in any order, and compared against itself — and says explicitly what it does
*not* mean.

This is the sentence that taught the inversion. It sat in the first block of
every scene file, which is the first thing an author or an agent reads.

### added

**`CONTRACT` is now a fence, the seventh.** It was byte-identical across all
eight carriers and fenced by nothing, so `--parity-only` could not see it and
`--parity-fix` could not propagate it — which is exactly why a wrong sentence
survived in eight places. Found by looking for what `--parity-fix` could not
reach.

The correction was made in one carrier and propagated by command, which is the
first real use of `--parity-fix` outside its own fixtures: parity green after
fencing, **red** on the one-file edit naming all eight carriers, green again
after the propagation, and `smoke.js` passing every scene afterwards.

## 0.16.43

### added

**`smoke.js --parity-fix --from <canonical.html>` — R4.4.** `--parity-only`
reports that the fenced copies disagree; this makes them agree, from a source you
name. 4,611 lines are held byte-identical by hand across the carriers, and
hand-propagation is the tax that measurement made visible.

Two guarantees from the plan, both bracketed:

- **The source is named, never inferred.** No majority vote, no "most common
  block wins" — a majority is precisely how a block that drifted into three
  carriers rewrites the two that were still right, and reports success doing it.
  No `--from`, no write.
- **A malformed source is refused**, and so is a malformed target. `-START`
  without a well-formed block is the mangled-marker shape that made this check go
  quiet once already.

**And one property that outranks both: every file and every fence validates
before the first byte is written.** A refusal that has already rewritten three of
eight carriers leaves the corpus in a state no check describes — worse than
either finishing or declining cleanly.

A file that does not carry a fence is left alone, never given one: removing your
markers is how a scene legitimately leaves the parity set.

### fixed

**Two holes in `bracket-parity.js`'s own new arms, both found by mutation testing
rather than by review.** The bracket now runs twelve arms.

The partial-write property had no arm that could see it: every fix arm had a
single target, where "refused" and "wrote as it went, then hit the bad file" are
indistinguishable. The arm added for it uses three files, and mutating the
implementation to write-as-you-go turns it red — the only arm that catches that.

And `refuses malformed source` passed with the guard neutralised, because a
wholly-mangled source extracts zero blocks and gets refused by the no-blocks
fallback instead. It asserted the outcome and proved nothing about the guard.
The hole behind it is real: a source with a good `KERNEL` and a mangled `SOLVER`
has a non-empty block set, so the fallback never fires, and without the guard the
run propagates one fence while silently skipping the broken one. That case now
has its own arm, and it is the only arm that fails when the guard is removed.

## 0.16.42

### fixed

**The harness tier's encoder table named ffmpeg for two rows when nine need it.**
`bracket-commands.js` recorded `needs: 'ffmpeg'` on `video` and `all` only, while
`poster`, `sheet`, `aspect`, `strip` and `motion` shell out to it as well
(`build.js` 476, 530, 569, 642, 675). On a runner without ffmpeg those five did
not skip — they reported FAIL. That is how the first unattended run of this
bracket failed on five rows that were never broken. Reproduced exactly by running
the file with the encoders stripped from `PATH`; the fix is the table, not the
verbs. A skip of a *named* binary can now be made a failure with
`REQUIRE_ENCODERS=ffmpeg,avifenc`, so a CI install that silently stops working
goes red instead of quietly covering less.

**Both workflow bracket loops hid every bracket after the first red.** The loops
ran `bun run "$b"` bare under `bash -e`, so the first failing bracket aborted the
step and its siblings never ran: the 0.16.41 gate ran `bracket-commands`, failed,
and never reached determinism, liveplay, noise or parity. This is the same defect
as the `!cancelled()` one that `gate.yml`'s own comment already documents — a
failing step skipping the next — reproduced one level down, four lines below its
own postmortem. The history had been recorded; the rule was never generalised
past the instance it came from. Fixed in `gate.yml` and `static.yml` with a
runtime-assembled fixture proving the old form hides a sibling and the new form
does not, both still exiting non-zero.

**The bracket's failure tail printed the interpreter banner, not the error.** It
took the last two lines of output, which on any Bun crash are a blank line and
`Bun v… (Linux x64)`. The CI log said exactly that, five times, and the cause had
to be re-derived locally. It now prefers the line that names the failure.

### changed

**`gate.yml` and `static.yml` report which brackets failed** rather than stopping
at the first, and say so with `::error::`.

## 0.16.41

### added

**The harness tier: `templates/bracket-commands.js` runs every `build.js` verb
once and asserts the path executes.** R4's cheapest item, and the gap it closes
was the widest in the repo — `build.js` and `shoot.js` carried **zero** brackets
between them, which is how `build.js aspect` came to throw a `ReferenceError` in
two skills at once, undetected, because nothing invoked it.

Thirteen verbs (`vendor`, `bundle`, `poster`, `sheet`, `aspect`, `strip`,
`motion`, `probe`, `frames`, `video`, `all`, `avif`, `loop`) plus **four red
arms**: an unknown verb, `probe` without an expression, a missing scene, and
`bundle` against a shipped `*.template.html` — the last a real guard with real
history, since running any command on a template used to inflate it with 0.77 MB
of inlined three, idempotently, and it reached `git add` once.

**Scope is the design, and it is stated in the file:** this does not check that
output is *correct*. It checks that the path executes and names the artifact it
promised. Correctness is what the instruments are for; this closes the other
shape entirely — a command nobody has run since the feature landed.

**Cheap by construction.** Every full-film verb takes an fps argument, so they
run at 1fps (~17 frames instead of ~500) at small widths. 38 seconds locally.

**Skips are reported, never silent.** `avifenc` and `img2webp` are not on a stock
CI runner; those rows print SKIP with the missing binary named and are excluded
from the tally rather than counted green. A harness that quietly covers less than
it claims is the thing this file exists to prevent.

**No CI edit was needed** — `gate.yml` already globs
`templates/bracket-*.js`, so naming it `bracket-commands.js` covers it the day it
is written. R4.3 as specified had prescribed adding a step; the glob is better,
because a future harness is covered without anyone remembering to wire it.

### fixed

**Its first run failed, and found a real constraint rather than a bug.** The
fixture was built in `os.tmpdir()`, and `vendor` failed there even with three
installed: `vendor` shells out to `bun build`, which resolves `three` from the
**entry file's** directory, and the entry is written beside the scene. A tmpdir
has no `node_modules` to walk up to. `require.resolve` inside `build.js` falls
back to `process.cwd()` and is satisfied; the bundler is not. That is CLAUDE.md's
*"three resolves from the workspace where a scene is being built"* being
literally true of the bundler — the kind of constraint no amount of reading
finds. The fixture now lives inside the invoking workspace, and the reason is
recorded at the line that depends on it.

## 0.16.40

### fixed

**The first CI run of the brackets caught a defect in the brackets — an
environment-dependent arm inside the arm written to catch environment
dependence.** `bracket-selfcheck.js`'s "comment citing gitignored build output"
arm wrote a fixture into `site/films/` without creating the directory.
`films/*.html` is gitignored, so git tracks nothing there and does not create the
path: a fresh checkout has no `site/films/`, and the arm died with `ENOENT` the
moment it ran anywhere that had not already executed `stage-films.sh`. It passed
locally for exactly that reason.

**Fixed at the root as well as at the consumers.** `site/films/.gitkeep` is now
tracked, so the directory survives a clone instead of three separate callers each
compensating for its absence — and `site/.gitignore` widens from `films/*.html`
to `films/*` with `.gitkeep` negated, because the narrower rule would have let a
staged `.json`, sprite sheet or map file get tracked by accident, which is the
second-copy problem arriving through a side door.

The `mkdir -p` calls stay as belt to that braces: `.gitkeep` covers the clone,
the `mkdir` covers the directory being removed — which is precisely how these
arms get tested. `bracket-stage-films.js` had the same latent fault — arm 2 wrote into `site/films/` and worked only because arm 1 had
run `stage-films.sh` first, which is ordering, not a guarantee.

Reproduced locally by deleting `site/films/` before the fix and after, which is
the only honest way to test a claim about a fresh checkout. **This is what wiring
the brackets into `static.yml` was for:** they had never run anywhere but a
laptop, and the first unattended execution found a defect of precisely the class
the branch exists to remove.

### fixed

**`site/` is strictly downstream, and the direction was stated wrong in both
directions before this landed.** Owner, 2026-07-30: *"the vision defines and
informs site language, and plan informs site copy of plan... fundamentally the
vision and the code tracked out of site is the source of truth. The site is just
how you and I choose to communicate it out."*

0.16.39 corrected an inflation — the plan had promoted the site to a "vision
carrier" — but over-corrected by striking the reconciliation obligation with it.
Both errors are the same mistake about direction. The site owns nothing and
settles nothing, **and** a language change in `VISION.md`, `plan.md` or
`README.md` is real work on the site, because the site is how that language
reaches anyone. `source-of-truth.md` now states the one-directional flow;
`CLAUDE.md`'s map entry says the site is never the tiebreaker but is never exempt.

**The obligation had already been missed, and it was measurable.**
`site/index.html` is byte-identical to `main` while this branch rewrote the
language it exists to carry. Four gaps found; one was not a wording question and
is fixed here:

- **The false duration ceiling.** `site:156` carried *"nothing caps duration, but
  longer has not been shipped"* — the superseded `README.md` sentence **verbatim**,
  the same claim the owner struck from `SKILL.md` and `README.md` earlier in this
  session — and `site:167` led with *"These run 12 to 21 seconds."* Both now say
  the examples are short **by choice**, and that a frame at `t=18000` costs what a
  frame at `t=1` costs because the duration is a number in a table. A public page
  asserting something the owner has explicitly called false is not a style
  preference.

Three remain, recorded in the plan and left for the owner because they are voice:
`t` is framed as *"a pure function of **time** t"* three times including the
`<meta>` and `og:description` that drive every social preview, where `VISION.md`
and `README.md` now lead with **`t` as a position, not a clock**; the window
contract is shown flat at `site:345` with a membership list that omits a
hard-asserted name (`stopPlayback`) while including two soft ones, exactly the
disagreement `glossary.md` warns about; and the `#why` section predates
`VISION.md` and does not point at it.

### added

**The prime directive's one exception is now bracketed, three releases after it
was granted.** `CLAUDE.md` admits `build.js probe` past "tooling talks only to
the window contract" on three conditions, and calls them *"all currently true and
all checkable"* — then nothing checked them, so the exception could have lapsed
in silence, which is exactly how a bent rule becomes a gone rule. `selfcheck.js`
check 6f enforces the two that are mechanical: the instrument must not write or
spawn, and it must have exactly one call site (its CLI dispatch), with a second
check that no workflow or hook invokes `build.js probe`. Written over every tool
file rather than over `build.js` by name, so a probe copied elsewhere inherits
the rule — and so its two bracket arms use a fixture instead of mutating a
shipped artifact, the trade removed from `bracket-stage-films.js` in this same
release.

**Its first version reported the exception had already lapsed, and was wrong.**
`build.js` carries a comment reading *"a step-halving probe("* as ordinary prose,
which the call-site counter read as a second caller. Comments are stripped before
counting now. That is the third time in this repo a checker has read prose as
code and produced a false accusation, which is the argument for brackets: the arm
was written first, went MISSED, and the false positive surfaced the moment the
check ran against the real tree rather than against an idea of it.

**R4 gains two items, both about not paying the same cost twice** (owner-directed).

**`--parity-fix`.** Six fenced blocks are held byte-identical across eight
carriers by hand — **measured 4,611 lines**: KERNEL 151 × 8, CHARACTER 278 × 3,
SOLVER 113 × 7, DRIVER 111 × 7, RIG 83 × 7, HTML 60 × 7. That is
DRY-by-*verification* in a repo that spent R0-R3 moving to
DRY-by-*construction*. The resolution is **not** to generate the scenes: the
examples are teaching artifacts, an agent reads `gearbox.html` end to end to
learn how a film is built, and a file carrying an injection placeholder teaches
nothing — it would also stop the tracked file being the shipped file, which is
what invariant 1 protects. Instead, make detection able to propagate.
`--parity-only` already computes both the divergence and the canonical text and
simply cannot write; `--parity-fix --from <canonical>` turns an eight-file edit
into one edit plus a command with **zero change to any tracked or shipped
artifact**. It must name its source explicitly rather than infer a majority — a
fix that picks the wrong canonical file corrupts seven others — and must refuse a
malformed source, with a bracket arm proving the refusal, because a malformed
fence makes a file *leave the parity set*, which is how this check has already
gone quiet twice while printing `ok`.

**The defect corpus.** It is built from the the prototype scene with a new theme,
character, name, opening title font and style, set somewhere else with a
different character; the script stays, and content and captions can stay the
same. What the
fixture is for is entirely mechanical and none of it lives in the subject matter:
~60 seconds and 31 beats, multi-shot solver traffic, shadowed fur shells, the
character rig. That combination is why it is the only candidate reproducer for
the open 1-in-6 `WEBGPU=metal` failure — `noise-chart.html` failed to reproduce
it in 15 runs precisely because it lacks them. So the script structure, caption
cadence, beat count, durations, shot pattern and every mechanic carry over, and
the scenario, style bible, character, world and title are generated new. Same
instrument, new content, trackable.

Two constraints recorded with it. It must **not** live under `plugin/`, because
everything there ships and a deliberately defective scene must not reach users as
an example. And its parity status must be stated explicitly — a full scene
carries the fenced blocks, so it either joins the set as a ninth carrier (which
is what R4.4 makes acceptable) or is deliberately excluded and said to be, since
a file silently leaving the parity set is the exact failure `bracket-parity.js`
exists to catch. The twelve characterized defects get **re-measured** against the
new build rather than assumed to carry over.

`working-plan.md` records that every instrument here was
bracketed by hand-building a fixture and discarding it, and predicted its own
failure: *"The prototype scene is currently the third such fixture about to
evaporate."* **The prediction came true** — that prototype is gitignored, on one
machine, unbacked-up, and is the only candidate reproducer for the open 1-in-6
`WEBGPU=metal` determinism failure. Keeping a small corpus of scenes with
characterized defects at known timestamps gives a new instrument a positive
control the day it is written and a regression control the day someone changes
it. Gitignored is correct: this is bracketing apparatus, not teaching material,
and the repo already draws that line.

R4.3 also got cheaper: naming the harness tier `templates/bracket-commands.js`
means `gate.yml`'s existing glob covers it the day it is written, so the "gate
job gains a step" the item used to prescribe is not needed at all.

**R4 gains two more (owner-directed), and the case for the first was found while
writing it.**

**R4.6 — retention.** A design discussion held on 2026-07-30 was recorded
**nowhere**: the owner asked whether the declarative tables would be better
stored as structured data than as JavaScript, and stated a position — *"JSON
isn't the right shape; is something else with some semblance of structure a
better shape?"* It is absent from `docs/`, `CLAUDE.md`, `VISION.md` and the
session log; a grep returns nothing. It survived only in a conversation
transcript, which nothing routes to and no future session reads. It is now
recorded as an open question, which is the minimum rather than the fix.

Three retention channels exist and two work. Postmortems are tracked and checked;
the CHANGELOG is why history can be cut from `CLAUDE.md`. **Design questions and
fixtures have no channel at all** — the structured-data question evaporated,
the prototype scene is evaporating, and a cookbook of shape recipes was written once,
cited from two shipped files as though carried over, was not, and survived only
because an archive audit went looking. `VISION.md` already names the shape of the
answer — capturing a pattern should be a *side effect* of making a film, not an
act of discipline afterwards — and `pattern-ledger.md` counts how often a shape
gets rebuilt while having no way to extract one. Also in scope: the disciplines
this migration produced should become routine rather than remembered, including
the one that cost three fixtures before it was written down — **a control must
not contain the defect it injects.**

**R4.7 — grade the portfolio.** `plan.md`'s nine-case portfolio is good and its
premise is right, but nothing says which cases are *in reach*, which are *just
about there*, and which are *deliberately beyond*, so nothing tells a session
which to pick up. It also has no rungs between the nine: a case one primitive
away from an existing film is worth more as a next step than one needing three,
and those intermediate variants do not exist. **Two films and one chart are built
against nine specs.** The grades are expected to move — a case stuck at "beyond
reach" for three phases is either mis-scoped or is naming a missing primitive,
and both are findings. The table stays in `plan.md`, which owns it.

Gate R4 gains two clauses: every portfolio case carries a reach grade, and **a
design question raised in a session is findable from `docs/` afterwards** —
tested the only way it can be, by a cold-start agent asked about one and reaching
it without being told where to look.

**R3's gate is MET — the cold-start run closed it, and found three defects doing
so.** A fresh agent with no context, asked only what to work on next: **1 hop,
~940 lines across 11 files, answer inside the first 24 lines of the live queue**,
no superseded document read unwarned. It also arrived independently at the
R4.2-before-R4.1 ordering. R2's equivalent run found *nine* orientation defects,
most self-inflicted; this one found three, and all three are in the
**verification** layer rather than the navigation layer the gate was testing:

- **Three stale doc-to-doc line anchors**, all pointing into `working-plan.md`
  and all shifted ~140 lines by 0.16.39's own prune — which updated the pruned
  file and nothing that cited it. Now cited **by heading**. This class is
  uncontrolled: check 6d resolves cited *paths* in code comments, not line
  anchors between documents.
- **Two hand-written counts, stale, inside the document that states the
  never-hand-write rule.** `build.js` was called "827 lines and 18 verbs"; it is
  **971 lines and 13 verbs**. The drift made the argument stronger, which is
  exactly why nobody noticed. Replaced with a pointer to `wc -l`.
- **`docs/orientation.md` was unreachable from either router** — a file written
  for precisely the reader that test simulates, missing from `CLAUDE.md`'s map
  and from `docs/README.md`. The same failure the map exists to fix,
  reintroduced for a newer file. Both now point at it.

`orientation.md` also gains the one thing that cost that run real time and was
not a repo defect: **check `git status` before trusting a red**, because this
tree is often worked by more than one session and a failing check may be
in-flight work rather than a defect.

### changed

**The site now carries the language it exists to carry.** All four gaps recorded
above are closed. `t` leads with **position, not a clock** in the `<meta>`
description, the `og:description` that drives every link preview, and the `#why`
heading — which now also links `VISION.md`. The contract layer shows the tier
split (`seekTo · DURATION · stopPlayback · sceneReady` hard, the rest behind
fallbacks) instead of a flat list that omitted a hard-asserted name. The roadmap
lede states what is actually being built — an engine, and a **declarative layer**
per phase: declare beats and never write timestamps, declare a shot and never
write camera coordinates — with films as how each layer gets proven rather than
the product. Phase 4 is named as **the declarative layer for interaction**, the
way lighting is one for illumination, opt-in and per-object.

**The length claim is reframed, not just corrected.** The examples are short
because a project site should not ship a giant cache of code — every scene embeds
its own three.js — **not** because anything caps duration. A frame at `t=18000`
costs what a frame at `t=1` costs, and the file is the same size either way,
because duration is a number in a table rather than anything accumulated. Longer
films have been built; the site says so and deliberately neither names nor links
one.

## 0.16.39

### changed

**`working-plan.md`'s sequencing table carries a verified status column.** It
listed twelve items with no record of which had shipped, so a session arriving
at it had to re-derive the state of every row or trust the prose warning at the
top — which asserted "items 1 and 2 have shipped" when **item 2 never did**.
Checked against the tree rather than against the document's memory of itself:
items 0, 1, 5 and 6b are done; 2 and 3 are not; 4 and 6 are partial; 6c is
superseded by `selfcheck.js` check 6d, which makes its whole class mechanically
detectable rather than something you sweep for by hand. Rows not re-checked this
pass say so, because "unknown" and "pending" are different states and collapsing
them is how the table became untrustworthy.

The annotation was the bug, not the table. A warning that *states* a status goes
stale silently; a column that *records* one can be re-derived and shown wrong.

**Two superseded positions struck rather than annotated.** Both had been kept
verbatim with a single sentence crossed out — correct practice for preserving
reasoning, but it left each reading as a live dispute:

- Owner's-call 0 announced that Track C was admitted (2026-07-25) and then
  restated the same question in its `if Track C is admitted…` form, closing with
  "either `plan.md` gets an amendment, or Track C waits" — an amendment that had
  already landed. The reasoning is kept as reasoning; the conclusion is gone. It
  also now records that `VISION.md` superseded the framing the fence rested on:
  "mitate ships films" described the product, and films are the proving
  instrument. The fence's live half — a driver that *replaces* the state stream
  waits for Phase 6 — survives that.
- The note under the sequencing table announced the same resolution and then
  repeated the superseded conditional immediately after it, ending "the order
  above assumes the fence holds."

**The ancestry table said `probe` was "dropped in migration".** It shipped as
`build.js probe`, and 0.16.37 amended the prime directive to admit it — this
being the *third* independent arrival of that shape, which is the count the
ancestry table exists to keep. A pattern ledger that misses a rebuild is
measuring the wrong thing.

**`source-of-truth.md` gained the `VISION.md` row that R3 assumed it had.** The
restructure plan marked that item done while the row had never landed — found by
grepping for it instead of trusting the DONE. `VISION.md` owns why determinism
comes first; `site/` says a public-facing version of some of it and owns nothing,
so if the two disagree the site is wrong.

**`CLAUDE.md` is 39 lines lighter, and the cut was history, not rules.** It had
grown 178 → 248 lines across this migration — the wrong direction for the one
file charged on every session in this repo. Nearly every clause carried the
defect that motivated it, and those anecdotes are already in this changelog,
which is where the repo's own rule sends them. **A term diff against the
pre-trim file confirms no rule was lost**; every dropped token is an anecdote, an
illustrative example, or a path still reachable.

The largest single cut was structural: the Map's `docs/` half was a second copy
of [`docs/README.md`](docs/README.md), which already routes those nine entries by
question. `CLAUDE.md` now maps everything *outside* `docs/` and points at that
router for the rest — the one-home rule applied to the file that states it.

**Gate R3 is three of four, and the fourth is recorded as a conflict rather than
quietly redefined.** `SKILL.md` is smaller than at migration start (278 → 267
lines); `CLAUDE.md` is not (178 → 209), because the Map did not exist before and
was added to fix a measured orientation failure — the repo's front door and its
shipped skill were unreachable from its own graph. The always-loaded *pair* is
smaller (26,835 → 26,577 bytes). Which of those is the real budget is the
owner's call, and the alternatives are written down in the plan. Redefining a
gate to match what was achieved is the failure this branch exists to remove.

### fixed

**A framing was corrected before it reached anything load-bearing, and the sweep
for what it had touched found one real bad trade.** The plan had promoted `site/`
to a **"capability-claim surface"** and a **"vision carrier"** — two roles it does
not have. Owner, 2026-07-30: *"site is like a side thing. It should work, but it
exists to show people what this project is in a visual way. THAT'S IT."* The
whole `site/` folder is the website: a glorified `README.md` with example scenes.

The audit for consequences: **`site/app.js` and `site/index.html` are
byte-identical to `main`**, `VISION.md` never mentions the site, and no file
under `plugin/` — the actual product — changed for a site-shaped reason. The
framing had reached exactly one load-bearing place, a row added to
`source-of-truth.md` naming `site/` a "pointing surface" that `VISION.md` had to
be reconciled against. That file defines where facts live, so the row was one
step from inverting the direction of truth. It now says the site owns nothing and
is the thing that is wrong when they disagree.

**The bad trade, and it was in code.** `bracket-stage-films.js` tested the
derivation guard by rewriting the tracked 1.14 MB `gearbox.html` and restoring it
in a `finally` — risking a **shipped** artifact to control a script that only
serves the website. `stage-films.sh` now takes `MITATE_EXAMPLES`/`MITATE_FILMS`
overrides (Netlify's invocation is unchanged, since both default), and the arm
drives a throwaway fixture: two runs, one seeding a variant and one moving the
bible line, which is a stronger assertion than before because the guard must now
*remove* a variant it can see. Proven red against a no-clear script first, and
`git status` confirms nothing tracked is written.

**Two stale claims fell out of the same sweep, both from 0.16.35's removal of the
tracked neon copy.** `static.yml` and `install-hooks.sh` each kept a dangling `\`
where `site/films/gearbox-neon.html` used to be an argument, and `static.yml`'s
comment still claimed to cover it. Dropping it loses no coverage, and that is now
**measured rather than assumed**: the line the derivation seds sits at index 701,
outside all five fences (HTML 5-66, KERNEL 725-877, RIG 879-963, SOLVER
1076-1190, DRIVER 1232-1344), and re-running parity with the neon included still
reports ok.

**`.claude/` was drifting with nothing watching it, and the drift was in the
briefings that tell agents what is true.** A review pointed at that tree found
six stale claims. They are worse than ordinary doc drift because they are *priors*:
an agent reads them before it looks at any code, so a stale one turns every
downstream verdict wrong.

- **`doc-claim-auditor` taught four working capabilities as broken.** Its "five
  real instances" of drift were written in the present tense and four had since
  been fixed: `focus` (both 3D templates wire `STYLE.dof` through `THREE.dof`
  with a `uFocus` uniform driven from `shotFocus`), `aspect` (`shoot.js` reads
  `window.FRAME.aspect` and feeds `aspectShapes`), `whip` (`film-language.md`
  now states it is a fast cut, not a whip pan), and `h` (documented as framed
  extent). The fifth cites a reference that does not exist in this repo. An
  auditor dispatched at `film-language.md` would have returned `focus` as dead.
  The list is now past-tense with each resolution, and says plainly that none of
  it is a current defect. *The pattern ate its own briefing.*
- **`/audit-claims` asserted that `build.js probe` "is not built"** — it shipped
  in 0.16.37, which is what backs the site's *"Every contact is probe-measured"*
  claim. Every run was a standing false positive against a working path. It now
  asks the harder and correct question: is the claim true of the current corpus.
- **`model-delegation.md` named `fast-executor` and `task-coder`** as agents "in
  `.claude/agents/`". Neither has ever existed here; the directory holds
  `control-builder` and `doc-claim-auditor`. The rule now says to list the
  directory rather than trust a name written in prose.

**The structural half: nothing mechanical covers `.claude/`.** Those files carry
no freshness marker by design, and `selfcheck.js` derives its set from files that
do — correct, and it means the tree is uncovered. `/audit-claims` now routes at
`.claude/agents/*`, `.claude/rules/*` and itself explicitly, and `CLAUDE.md` says
that routing line is their only control instead of the softer "not exempt from
being wrong".

**Two errors of this session's own, both caught by the same review.** The Map
claimed to cover "everything outside `docs/`" while omitting `site/`, so by its
own stated criterion a tracked top-level directory was unreachable from the front
door — and it is the one `/audit-claims` is required to route at. It has an entry
now, named as the **capability-claim surface** it is: not a second half of the
product, which is the skill, but the page that tells the public what the skill
does, and therefore something a changed capability changes. And the repo-tools
line called
`scripts/bracket-*.js` "the controls over the first three" when two exist,
covering the first and third; it now says two of five and names the three that
are uncontrolled, which is the state invariant 6 wants visible.

`plugin/README.md` carried a stale `last updated:` marker after 0.16.38 edited
it. The freshness check fires one commit late by construction, which is the
correct place for it: a marker bumped before the commit that justifies it would
be the same lie pointed the other way.

## 0.16.38

### changed

**`delivery.md` splits into `delivery.md` and `recordings.md`, because one
provenance header could not be true of both halves.** The file was titled
"Delivering inline on GitHub", carried 150 lines of encoder forensics, and then
concluded that this repo *"ships no recordings at all"* — the path actually taken
was at the bottom, behind the path that was abandoned. Underneath both sat a
single header reading **"Verification date: UNKNOWN — never audited end to
end"**, which was honest about the inherited encoder measurements and false about
this repo's own measured brotli figures sitting beside them.

- **`delivery.md`** now owns the scene as the deliverable: bundle economics over
  the wire, hosting and mount policy, posters and stills, which artifact goes on
  which surface. **Verification date 2026-07-24** — recovered from the commits
  that introduced the brotli figures and the mount policy, not invented.
- **`recordings.md`** owns the lossy-copy path, which exists for exactly one
  reason and now says so in its first line: GitHub will not render an mp4
  inline. Format tradeoffs, the decode cost, encoder settings, the content-type
  evidence chain, the LFS and APNG traps. It keeps the honest UNKNOWN, because
  those measurements were taken on the predecessor and have not been re-run here.

"Stills come from the scene, never from the loop" stays in `delivery.md`. It
reads like an encoder rule and is not one — it is a rule about the scene being
the source, and filing it with the encoders is what would make it look optional.

**Eight live pointers followed the split**: `plugin/README.md`, `SKILL.md`
(twice), `method.md`, `webgpu-stack.md`'s "Not here" edge, `build.js` (twice),
and `source-of-truth.md`. Historical mentions in `plan.md` and
`predecessor-record.md` were left as written where they record what happened;
two in `plan.md` making present-tense claims about where doctrine lives were
repointed.

**`source-of-truth.md` now separates three domains, not two.** Its
2.3x-collision paragraph — the near-miss where a consolidation pass almost merged
the renderer-backend speedup with an AVIF encoder-effort ratio because they share
a number — named `delivery.md` as the home of a figure that has now moved to
`recordings.md`. Splitting a file moves its figures, and a rule about where
figures live is exactly the kind of thing that goes stale silently when it does.

## 0.16.37

### fixed

**Two review findings closed, and the fixes found two more — all four the same
shape: a claim with no control over it.**

**The citation check accepted a real filename under an invented directory.** It
compared basenames against a walk of the live filesystem, so a comment could
point anywhere as long as *some* file somewhere carried that name; the one
historical catch worked only because its basename existed nowhere in the tree.
Path-shaped tokens now resolve against two bases — the repo root, and the shipped
subtree, both of which are real shapes in the corpus and both of which are how a
reader would follow the pointer. Bare filenames in a provenance frame keep
basename matching, which is all they can support.

**Its accept-set was environment-dependent, which is the opposite of what the
file is for.** The walk swept in gitignored build output, so the staged film
copies were in the accept-set on a laptop that had run a build and absent in CI —
the same question answered two ways depending on where it ran. The set is now
`git ls-files --cached --others --exclude-standard`: derived output is out,
and a file you have just written and not yet staged is still in, so writing a
comment and its target in one change does not fail on the way past.

The token regex grew an optional leading dot so `.claude-plugin/marketplace.json`
resolves as the path it is. Measured both ways before shipping: **occurrence-
neutral, 29 → 29**, apart from that one token. An earlier form of the tightening
excluded `/` from its lookbehind and silently dropped four real citations — the
bracket usage lines, whose checkable part begins right after a slash. A narrowing
that goes quiet is the failure this check exists to prevent, so it was measured
rather than reasoned about.

**`stage-films.sh` left a stale derived film behind when its guard fired.** The
guard exists to refuse the neon derivation if the bible line it edits ever moves,
and it worked — but the script exited 1 with the *previous* `gearbox-neon.html`
still sitting beside freshly copied examples, with nothing saying it was stale. A
local preview then served a film derived from a gearbox that no longer existed.
`films/*.html` is now cleared before staging: absent is visible, stale is not.

**`scripts/bracket-selfcheck.js` had never run anywhere.** `gate.yml` globs
`templates/` only, `static.yml` did not run brackets at all, and the pre-commit
hook runs the self-check and fence parity. So the single control over the repo's
own claim-checker existed, passed by hand once, and was executed by no automated
path. Worse, check 6 — the census that exists to notice exactly this — also read
`templates/` only, and reported 4 while 5 existed. The census now covers both
directories and reports 6; `static.yml` gained a globbed `brackets` step (both
repo brackets are browser-free, which is why they belong in the cheap job);
`gate.yml`'s comment now states that its glob is directory-scoped *on purpose*
and says where the others run, instead of saying "globbed, not listed" in a way
that reads as complete. That comment also claimed "all three brackets" while
globbing four.

**`static.yml`'s fence-parity step claimed coverage it had lost.** Its comment
said it included "the one negated exception in `site/films/`". 0.16.35 made that
copy derived and removed the argument, leaving the claim behind and a dangling
`\` at end of file. The step was doing less than it said, in the one place
nothing audits: CI config.

### added

**`scripts/bracket-stage-films.js`** — three arms: a clean run derives the
variant and it differs from its source by exactly one line; output from a
previous build does not survive a re-run; and when the bible line moves, the
guard fires *and* leaves nothing stale. The last two were proven red against the
pre-fix script before the fix was written. `bracket-selfcheck.js` gained two arms
on the same discipline — MISSED before, CAUGHT after.

One of those arms could not be written literally. A comment citing a real name
under a wrong directory *is* the defect the check catches, so a literal fixture
in the bracket's own source trips it — as it did, on the first run, and again in
the explanatory comment inside `selfcheck.js` itself. Both are assembled or
described instead.

## 0.16.36

### changed

**The skill description was measured, not edited to taste.** 232 → 191 words,
1354 → 1093 characters, with an empirically identical trigger rate. Run against a
20-query eval set (10 should-trigger, 10 near-miss negatives), 5 runs per query,
on the same model this session used, from a neutral project root so this repo's
own `CLAUDE.md` could not bias the decisions.

| description | words | passes | false triggers |
|---|---|---|---|
| baseline | 232 | 18/20 | 0/50 |
| **shipped (architecture cut, NOT INTERACTIVE added)** | **191** | **18/20** | **0/50** |
| red arm — constraint disclosure removed | 149 | 17/20 | **4/50** |

Two results, and the second is the one that matters:

**The 53-word renderer-architecture clause gates nothing.** TSL, MaterialX,
`WebGPURenderer`, the Canvas2D backend, "pure function of time t" — 24% of the
description's characters, and removing it verbatim changed no measured outcome.
Nobody asks for an animation differently because of TSL.

**The constraint disclosure is load-bearing, and that is now measured rather than
assumed.** Strip it and a "10-minute animated course module with chapters and
quiz cards" — a near-miss negative — flips from 0/5 to 4/5 false triggers. That
is the only false trigger observed in 1,000+ negative runs across six
descriptions, so the negative half of the eval set can detect a mis-trigger, and
the disclosure is what prevents it.

**The false duration ceiling is gone from the description too.** `films are SHORT
(beats run 3-4s, shipped examples 12-21s)` was replaced by `NOT INTERACTIVE (a
film plays; it does not respond to clicks…)`, and the course-module negative
still holds at 0/5 — confirmed at 0/10 on a re-run at double the sample. So the
false claim was never doing the discriminating work, and the description no
longer contradicts the body. `README.md`'s two carriers of the same figure are
corrected in the same pass.

**A defect in the measuring tool had to be fixed before any number meant
anything.** `skill-creator`'s `run_eval.py` writes every parallel worker's command
file into one shared `.claude/commands/`, so with N workers Claude sees N
identically-described skills, names whichever it picked, and the membership test
reads False for the other N−1 *even though the skill triggered*. Measured rate
collapses to roughly (true rate)/N. Proven with a control on a patched scratch
copy: same positives, same 12 workers, `0/5, 0/5, 1/5, 2/5` before → `3/3, 3/3,
3/3, 0/3` after. **Anyone running that tool with `--num-workers > 1` is reading
noise.** Reported upstream-worthy; the patch was not applied to this repo, which
does not vendor it.

### added

**`build.js probe` learns `shape(x)`.** Probing the erupt foot-slide cost two
page loads to discover that a rig's limbs are keyed `HL/HR/FL/FR` rather than
indexed — guessing at structure, in the instrument built so that measuring beats
inferring. `shape()` reports keys for an object, length and element shape for an
array, type and child count for an `Object3D`; a failed expression now names the
`shape()` call to run next, collapsing that two-call sequence into one.

Checked before building: probe **cannot** list what a scene exposes. A classic
script's top-level `let`/`const` live in the global lexical environment, which is
not enumerable — which is exactly why they are reachable by name and absent from
`window`. So auto-discovery is impossible and only the structural half was built.

**`bibles.md` separates the contract from the per-backend vocabulary.** Its own
heading was already "The v2 shape (node stack)" while `scene2d.template.html`
ships with no art-direction reference at all. The contract — the whole look as
one object switched by one line, constraining *how* and never *what* — holds on
any backend; the field list does not, since a flat-vector bible cannot mean lens
or depth of field. A backend table now carries that, with 2D's real surface named
and the brief for whoever writes it. Flat files rather than a `bibles/` subfolder,
for a checkable reason: `selfcheck`'s provenance check reads `references/*.md`
non-recursively, so a subfoldered reference would ship with no provenance
enforcement. The trigger to subfolder is one backend needing more than one file.

## 0.16.35

### added

**The predecessor's procedural-asset cookbook, promoted before the ancestor tree
is archived off-machine.** 94 lines, eight worked shape recipes organised by
shape *problem* rather than by subject. `CHANGELOG.md:1094` and
`references/method.md:274` have both asserted these live in `materials.md` since
the reference split; the citations were repointed and the content never moved, so
a reader following a shipped pointer found nothing. Now they do.

**The preset-versus-technique line, drawn in `plan.md`'s Anti-template
principle.** The doctrine declines scene presets and genre scaffolds; it does not
decline craft. "How a cutaway reads" belongs in a reference exactly the way shot
sizes do in `film-language.md` — cinematography vocabulary is specific too, and
nobody calls `SIZES` a preset. `working-plan.md`'s `shapes.md` decline is
narrowed rather than left reading as blanket.

**The pattern flywheel, homed in `pattern-ledger.md`.** That file counts how
often a shape gets rebuilt; nothing extracts. The direction: the skill should
capture reusable generalised patterns as a **side effect of use** rather than as
an act of discipline afterwards — a prompt in the review step, or a command that
reads a finished film and proposes which reference each pattern belongs in.
Deliberately unscoped. The cookbook is its argument: written once, cited as
though shipped, not shipped, one directory deletion from gone.

### changed

**`site/films/gearbox-neon.html` is derived, not stored.** It was a tracked
1.14 MB file — **66% of the site's tracked bytes** — and measured against
`gearbox.html` it differed by **one line**: `BIBLES.workshop` → `BIBLES.neon`.
`bibles.md` claims a whole look is one object switched by one line;
`stage-films.sh` now executes that claim instead of asserting it, and **fails
loudly** if the line it edits ever stops existing. The generated file is strictly
better than the copy it replaces: it carries the `build.js vendor` stamp the
stored one was missing. `CLAUDE.md` invariant 4 has no exceptions now, and the
file is out of the parity path lists because a derived file cannot drift from its
source.

### fixed

**The erupt recoil slides all four paws in `bear-and-bees.html`** — measured, not
inferred, and recorded in `working-plan.md` with the numbers. During `erupt`
(1.1s) the body translates 0.371 units while `vAmp` is 0, so `gaitPose` collapses
to the body-relative rest stance and `paw − root` stays constant to three
decimals across the whole beat, in a shot framing the whole animal. Found by
reading, confirmed with `build.js probe` in three page loads — **the first use of
that instrument on something nobody had already measured by hand.** Not fixed:
whether the feet should plant through the recoil or the flinch should read as a
whole-body drag is a judgement call, and right now it is an accident of `vAmp`
hitting zero rather than a decision. Trigger recorded.

## 0.16.34

### changed

**A cold-start test found nine orientation defects, most of them created in the
previous two releases.** A fresh agent with no context was asked to get up to
speed and say what to work on next; it reached the answer in ~13 files and ~2,000
lines, of which roughly 460 were superseded. What it found:

- **`docs/README.md` routed "what should I work on next" at
  `working-plan.md`**, which is partly superseded. One table row cost 460 lines.
  It now points at the live migration, with the working plan demoted to the
  standing backlog it executes against.
- **Three documents gave three different answers** to what is next
  (`README.md` said Phase 4, the working plan's sequencing table said items that
  had already shipped, the migration said R2). All three now agree.
- **`working-plan.md` did not know the migration exists** — one grep hit, and it
  was the ordinary English word. It now says so in its first paragraph, including
  that its own sequencing table is superseded.
- **The migration had no "you are here"**; the live queue was findable only from
  `git log` commit prefixes. It now opens with a current-position block, and R2's
  items carry `DONE <version>` markers the way R0's already did — reconstructing
  that from the changelog plus tree greps was the single largest block of wasted
  effort.
- **R2's item numbering collided** (two 5s, two 6s), and 0.16.33's entry cites
  "R2.5" by number. Renumbered, with the old number recorded.
- **`CLAUDE.md`'s new Map said `references/` (8)** one commit after it was
  written. There are 9; the glossary shipped in the same release as the Map and
  the Map missed it. It also filed the migration under "Open decisions", which is
  why the tester did not open it first.
- **The glossary was named only after the router's table**, so it was found late
  and by accident. It is a row now.

**`metadata.last_verified` is removed from `SKILL.md`.** It asserted a *human*
review, sat in always-loaded frontmatter, went stale on every edit, and nothing
checked it — it was four days and two releases stale when removed, and
`CLAUDE.md` was simultaneously instructing readers to write it while the
migration was scheduled to delete it. `SKILL.md` now carries a provenance header
in the body, the same form the nine references use, and `selfcheck.js` check 4
verifies it and fails if the field returns. Demonstrated red by putting it back.

**`materials.md` and `bibles.md` are cited at their moment.** Both were
bibliography-only, despite their own entries naming when to read them ("before
authoring any surface beyond flat color", "at art-direction time"). Neither cue
could fire from a bibliography.

## 0.16.33

### added

**Postmortems are tracked, in `docs/postmortems/`.** Five tracked files cited
them — one of them shipped plugin content — while they existed on one machine
under gitignored `internal/`. `.postmortem.json` pins the location so it is a
decision rather than an inference from a sibling directory. The 2026-07-25
record gained the frontmatter it never had, without which the index that makes a
corpus navigable could not see it at all. Citations repointed: `materials.md` by
absolute repo URL (the pattern invariant 4 already uses for poster stills, so it
resolves from a cache, a clone and GitHub alike), the rest repo-relative.
**Session logs stay local** — the log is narration, the postmortem is the
distilled finding, and only the second is citable. A tracked postmortem may cite
a local-only artifact, but must label it `(local)` and must not rest a claim on it.

**A `selfcheck` arm for postmortem frontmatter — and NOT the one the plan
specified.** The plan called for checking that every `artifacts:` entry resolves.
That would have been wrong: a postmortem is a dated record, its citations are
historical by nature, and one here legitimately names a reference renamed since.
Failing the build when a cited file is later moved punishes exactly the archival
value tracking them is for. What is decidable and does not rot is whether the
file can be READ by its index — required keys present, filename and frontmatter
agreeing on date and mode. Demonstrated red by stripping the frontmatter back
off, which is the real 2026-07-25 failure.

**`references/glossary.md`.** Written from a term census: `register` appeared 98
times across 16 files and was defined nowhere; `parity set` 4 times and nowhere;
`install cache` 11 times *inside the shipped subtree* with its only definition
outside it, where a reader holding the subtree cannot follow. It sits in
`references/` because the subtree is a subset of the repo, so one file serves
both a contributor and an installed user, and it loads on demand rather than
standing in context.

**Map blocks in `CLAUDE.md` and `SKILL.md`,** the unlinked-heading-map pattern
already used by three references. Measured: from `CLAUDE.md` a cold session
reached the working plan in 3 hops and ~4,900 lines, and never reached
`README.md`, `SKILL.md`, `sample.yml` or two agents at all, because nothing
pointed at them — the repo's front door and its primary shipped artifact were
both outside its own graph. `SKILL.md`'s only index sat at 79% depth.

### changed

**The `internal/` reshuffle is RETRACTED, and the retraction is the finding.**
It existed to fix "63-75% of grep hits for core symbols are non-authoritative".
That was measured with shell `grep -r`, which ignores `.gitignore`. Ripgrep
honours it, so `internal/` was never in the Grep tool's results: `solveShot`
returns 18 files under shell grep and **13 under ripgrep, none from `internal/`**,
with the staged `site/films/` copies excluded too. The exclusion the item
proposed building already existed. An instrument that disagrees with the one the
reader actually uses will manufacture a problem — measure with the tool whose
behaviour you are reasoning about.

## 0.16.32

### added

**`build.js probe` — the contact class finally has an instrument.** Two things
that must touch, and do not, is the most-repeated authoring defect in this
project's history: six recorded instances, a fix specified each time, never
built. The trigger could not fire, because earn-in asks whether a film was
*blocked* and this shape is not blocked, it is reliably wrong.

    bun run build.js probe <scene.html> <when> '<expr>' ['<expr>' ...]

`<when>` is a number or an expression in the scene's own scope, so a probe is
addressed by beat like everything else in the kit; a raw second is accepted and
is exactly what rots when a beat is retimed. The prelude is four helpers:
`bb(o)` (world AABB, **accepting a rig or an Object3D** — `buildCharacter`
returns `{root, body, head, ...}`, so `setFromObject(bear)` throws
`updateWorldMatrix is not a function`, measured, and unwrapping `.root` retires
that trap rather than documenting it); `sep(a,b)` (per-axis gap, **negative
means overlap**, all three axes because one recorded miss had an x-overlap of
-1.66 and a y-overlap of 0.01 and arced cleanly over its target); `proj(v)`
(NDC and on-screen, for "a hit the camera cannot see did not land"); and
`reach(l)`.

Playwright loads lazily, the way `smoke.js` defers its browser deps, so every
other `build.js` verb stays dependency-free. Nothing is instrumented and the
window contract is untouched: scenes are classic scripts, so their top-level
`let` bindings live in the global lexical scope and resolve by name inside
`page.evaluate`. Verified 2026-07-30 — `bear` resolves, `window.bear` is
undefined.

**`film-reviewer` ships.** It has the best measured catch record in the project
and lived outside `plugin/`, so no installed user could reach it, and `SKILL.md`
contained zero occurrences of "agent" or "reviewer". It is now
`plugin/agents/film-reviewer.md`, routed from step 3 at the moment a review
happens. Moved rather than copied; the `.claude/` original is gone, because two
copies of one agent is the drift this repo keeps finding.

### fixed

**`bear-and-bees.html`'s `STOP_X` is re-derivable, and the number was right.**
Its comment cited a `probe.js` that has never existed in any generation — both
frozen predecessors grepped — as the provenance for the constant its gag depends
on. The measurement was almost certainly taken with the hand-written
`page.evaluate` that `method.md` teaches, and the harness was not kept, so the
figure was correct and unverifiable. Re-derived with the new command at
`beatAt('boop',.55)`: x -0.3202, y -0.7606, z -1.0578 — **overlap on all three
axes**, so the contact is geometric and not a camera angle, and the third number
is the one a contact sheet cannot show. The claims on `SKILL.md`,
`examples/README.md` and the showcase site are now true *and* checkable.

**`selfcheck.js` check 3 resolves links against the whole plugin root**, not the
skill subtree plus one hardcoded README. Adding `plugin/agents/` would otherwise
have created a shipped directory whose links nothing checked — and its first
file did cite a repo-local rules path that no installed reader can reach, which
is the defect the check exists for. Reasoning from "everything under `plugin/`
ships" means the next shipped directory is covered the day it exists.

**The citation check now covers scene HTML.** Held back in 0.16.31 on purpose,
because scene HTML carried the live instance and widening early would have meant
a standing exemption for a known-bad line. `probe` shipped, the line was fixed,
and the scope followed. Long lines are skipped so an example's embedded ~1 MB of
minified three is not mistaken for authored comments: 216 skipped, 10800 scanned.

## 0.16.31

### added

**`bracket-parity.js` — the fence check finally has a control.** Parity is this
repo's entire answer to duplication: self-containment forbids a shared import, so
six fenced blocks are written into nine files and a check reports divergence.
That makes it load-bearing in a way most checks are not — if it goes quiet, the
DRY guarantee goes with it and nothing announces the loss. It has gone quiet
twice, both recorded in `smoke.js`: a mangled `KERNEL-ENDX` satisfied an
`includes()` test, so the block stopped extracting, the file dropped out of the
parity set, and the run stayed green; and a scan where one file carried a fence
printed `parity/integrity: ok` for a comparison that never happened. Both are
guarded now, and until this release nothing proved the guards work.

Five arms: identical carriers pass, drifted KERNEL fails, mangled END fails,
mangled START fails, single carrier reports inert rather than passing silently.
Verified red against the real regression, not a synthetic one — with the
half-fenced guard reverted in a scratch copy of `smoke.js`, the two mangled-marker
arms flip to `inert` and the bracket exits 1. No browser and no `node_modules`:
`--parity-only` is pure string work, so it runs from a clean checkout, and
`gate.yml` globs `bracket-*.js` so it was already in CI the moment it existed.

**Two `selfcheck.js` arms, both spec'd by measurement rather than by taste.**

*No bare seek before a capture.* An evaluate that seeks, a `.screenshot()` within
six lines, and no pixel readback between — the pattern measured at 40/30/20 on a
slow GL stack against 0 of 200 when seek and readback share a task. **The first
two specs were wrong and are recorded in the source, because both looked
reasonable.** "Requires backend.js, screenshots, never calls seekSynced" condemns
`diagnose-determinism.js`, which is correct. "Any evaluate that seeks without
reading back" condemns `bracket-liveplay.js`, which counts seek calls and never
captures, and `sample-determinism.js`'s control arm — forbidding the control that
proves the fix works is worse than not checking. A deliberate bare seek now
declares itself at the site with a marker, the way path-privacy's skip-file works,
rather than hiding in an allowlist. Demonstrated red by dropping the pre-fix
bracket into the tree, and green when removed.

*A comment may not cite a file that does not exist.* The decidable half of the
boundary rule below. The broad version — any `\w+.(js|md|html)` token in a
comment — was written first and reported 46 failures, of which 45 were
`scene.html`, `template.html` and `three.js`: usage placeholders and a library's
name. Narrowed to path-shaped tokens and bare filenames in a provenance frame,
which leaves two hits in the whole tree, both explicable. Scene HTML is
deliberately still out of scope: it carries the live instance, and that citation
becomes true when `probe` ships, so widening now would mean shipping a check with
a standing exemption for a known-bad line.

### changed

**`source-of-truth.md` gains the rule every claim-defect in this repo has
broken:** a code comment may assert what its own line does, and may not assert
what another file does. Five instances shared that shape and none was careless.
Its table also gains two rows for the surfaces where the one-home rule was never
applied and where it consequently failed — a check's pass criterion belongs to
the code that implements it, and CI config and session logs point rather than
restate.

**`audit-claims` now covers `site/index.html`.** The site is a capability-claim
surface and was out of scope: it states *"Every contact is probe-measured"* and
ships a chip reading `Box3 contact probes` while the tool that would make either
re-derivable does not exist. A public page describing what the code does is
exactly what `doc-claim-auditor` is for, and it was the copy nobody read.

## 0.16.30

### fixed

**`noise1`'s tracks are not all independent, and the KERNEL comment said they
were.** The pool is 4000 draws and the per-track stride is 997, so
`4 * 997 = -12 (mod 4000)`: tracks `k` and `k+4` are the **same** wobble lagged
12 index samples, which at the handheld 1.9 Hz is 6.3 seconds — inside a normal
film. Verified empirically before the comment was written: `k=4` against `k=0`
lagged `12/f` agrees to 3.9e-15 over 1539 samples, while the control (`k=1`
against `k=0`, same lag) differs by 0.92. No shipped scene hits it — the 3D
solver uses tracks 11-14 and the 2D template 1-2, no pair differing by 4 — so
this is luck in the constants rather than design. Corrected in the comment
across all nine KERNEL carriers rather than by changing the stride, because a
new stride changes every value `noise1` returns and would break byte comparison
against every shipped film, every poster still and the site hero, to close a
trap nothing currently reaches. A `selfcheck` arm for literal colliding `k`
values is queued; a computed `k` stays beyond a static check, which the comment
now says.

**`bracket-determinism.js` captured with a bare seek on both sides**, so it
passed while exercising a capture pattern nothing has shipped since 0.16.28.
Now `seekSynced` + `settle`, mirroring `smoke.js`'s determinism arm. Run before
the change (three rows as specified, both failing arms reachable) and after
(same three verdicts) on macOS/WebGL2 — which proves the control still works,
not that the change fixed anything there, since the race does not reproduce on
macOS at 0 in 80. `scripts/diagnose-determinism.js` was accused of the same
defect and is **not** guilty: its `gridAt` seeks and reads back inside one
`page.evaluate`, which is `seekSynced`'s mechanism, and it cannot call
`seekSynced` because there the barrier and the diagnostic payload are the same
readback. That relationship is now a comment, so nobody consolidates it and
loses the grid.

**`build.js` cited a documentation path in a different repository**, which
resolved for no reader holding that file — not in a clone, not in an install
cache. The rule it names survives; the unreachable pointer does not.

### changed

**One criterion, one home.** `sample.yml`'s header stated a pass criterion that
contradicted its own input description and its own recorded measurement, and it
survived the commit that corrected the other two copies. The criterion now lives
beside the flag it describes in `scripts/sample-determinism.js`, and the
workflow points at it.

**`gate.yml` no longer double-fires.** It triggered on `push` with no branch
filter *and* on `pull_request`, so every push to a branch with an open PR bought
two full runs of the same commit. Push is now `main`-only; branch work is free
until a PR opens.

**Claims that nothing could check from where they lived.** `CLAUDE.md` carried a
fourth membership list for the window contract — six names, omitting
`stopPlayback`, which is one of the four `smoke.js` actually enforces — and now
points instead of restating. `CLAUDE.md` and `working-plan.md` both cited
"invariant 6: say which copy", which became invariant 7 when a new 6 was
inserted and neither pointer moved. `README.md` linked to a `#requirements`
anchor deleted in 0.16.13, dangling for sixteen releases because the link check
covers neither repo-root files nor fragments. `plan.md` cited three CHANGELOG
versions from the predecessor's numbering that exist in no repo. `working-plan.md`
called `film-reviewer` "a gate criterion at `plan.md:460`" in three places: it is
cited at `:471` and `:509`, both inside DONE narrative, and the `examples/` gate
is owner approval. The crushed-exposure carry-forward existed in three
simultaneous states across two files and is now one (measured; disposition
open). The `method.md` truncation test, recorded as never run, was run: 996
lines against a 2000-line window, so the correctness argument for splitting it
is closed.

**`docs/restructure-2026-07.md`** records the plan this is the first phase of,
and retires itself when its last gate is green. `docs/addressing.md` is new: what
`t` is, and what the position-encoding literature does and does not transfer.

## 0.16.29

### verified

**0.16.28's capture-race fix holds, measured as a red/green pair on Linux.** Two
dispatches, same runner image, same scenes, 10 repeats each, back to back:
the shipped path (`seekSynced`) came back **0 failures across 200 samples**; the
control (a bare seek, the pre-0.16.28 pattern) still failed at **10/10** on
`materials.html@5.36` and 2/10 on `menagerie.html@8.52`.

Both arms are the verification. A clean shipped run alone would not have been one:
if the control had also gone quiet it would mean the instrument stopped detecting
the race, not that the race was gone.

**The mechanism is settled beyond inference.** The same cell read 40%, 80% and
10/10 under the bare-seek pattern across three measurements — a state-carrying
defect does not vary like that, a timing race does — and it vanishes entirely when
a completion barrier is inserted on identical hardware.

Two shipped films were accused of carrying state and never were. `references/materials.md`
and `docs/working-plan.md` now record the verified outcome rather than the
accusation.

The residual is narrower and stated as untested rather than fixed: the pattern is
correct at all three `shoot.js` capture sites, so the stale-frame exposure in a
recorded MP4 is closed by construction, but it has never been *measured* under
`--workers N`, where contention is highest.

## 0.16.28

### fixed

**The capture race, at its one home.** `backend.js` gains `seekSynced(page, t)`:
seek and force the render to complete **in a single page task**, then `settle`
waits for presentation. Two mechanisms, both needed. Measured on
ubuntu-22.04/WebGL2, 10 repeats per cell — a bare seek gave byte-differences at
40%/30%/20% on three cells, the same sequence with the readback sharing the seek's
task gave **0 of 200**.

Why not simply a longer `settle`: two rAFs is a guess at a latency, and the next
slow machine invalidates it. A readback is a completion *barrier* rather than a
duration. Scope of the evidence is stated in both homes: WebGL2 only, unverified
on WebGPU's async queue, applied on both paths anyway because a 1x1 read is cheap
and the failure it prevents is silent.

Why it lives in `seekSynced` and not in `settle`: the drawing buffer is cleared
after compositing, so a readback in a *later* task reads zeros and synchronises
nothing. `smoke.js`'s `sampleAt` already renders and reads in one task for exactly
this reason — and the six sites that bypassed it are what shipped the flake.

**This was never only a gate problem.** All three of `shoot.js`'s capture paths
used the vulnerable pattern, so every frame of every recorded MP4 went through it,
with nothing sampling for stale frames. Cost of the fix there, measured over 30
frames: 8.660s versus 8.657s — inside the noise, because the sync folds into an
`evaluate` round trip that already existed.

Six sites converted. Four in the first draft; review caught two more, and the
second mattered more than a miss: the cross-reload check compared a bare-seek
capture against a `seekSynced` one, diffing a race-hardened frame against a
race-vulnerable one and manufacturing the spurious "differs ACROSS a page reload"
it exists to rule out.

### changed

`gate.yml` and `sample.yml` headers refreshed — both still narrated the failure as
unresolved. `sample.yml` is kept as the regression instrument (`no_canvas: true`
must now return 0/200) and stops copying `build.js`, which the sampler never
required.

`gate.yml` also records the temptation to avoid: these runners have no GPU, and
their slowness is the only reason the race was observable. Upgrading the runner to
get a green board would be making the check pass by touching what it measures.

## 0.16.27

### fixed

**The Linux determinism failure was a capture race in the gate, not a defect in
any film.** Measured on ubuntu-22.04 / WebGL2, 10 repeats: screenshots only gives
`materials.html@5.36` 40%, `menagerie.html@8.52` 30%, `menagerie.html@5.68` 20%,
every other cell 0%. The identical run with an in-page GPU readback inserted
before each screenshot gives **0 of 200** — same runner, same scenes, identical
`seekTo` sequence.

The readback is the only variable and it eliminates the failure, so the mechanism
is presentation latency: a real state divergence would survive a readback, which
reads the canvas and cannot repair it. `settle`'s double rAF (~33ms) is sufficient
on macOS hardware GL and insufficient on a slow software-GL runner. Every
previously unexplained property follows — the intermittency, the Linux-only-ness,
and the failing scene moving between gate runs — and the two affected films are
the two heaviest to render, which is what a latency-sensitive race predicts.

`references/materials.md` accused a shipped film of carrying state and
`docs/working-plan.md` made it the top item before Phase 4. Both corrected. The
escalation was right; the substance was wrong. **`smoke.js` has now reported a
capture race as a scene defect twice, five months apart, in the same place** —
which the comment above that check names as the one thing it must never do.

The repair belongs in `settle` (`backend.js`), NOT in the determinism arm.
Relaxing the arm would be repairing the layer that was correct.

### open, and larger than what closed

`shoot.js --workers N` captures frames from N pages concurrently — maximum
presentation contention — and its output is a shipped MP4 rather than a gate
verdict. If `settle` can be outrun on a slow stack, that is where this mechanism
does real damage, and nothing samples it. Raised by the owner while the
measurement was running.

## 0.16.26

### changed

**The Linux determinism failure is a class, not a scene bug.** It was recorded in
`references/materials.md` as `materials.html` at `seekTo(5.36)`; the next failure
was a different scene at a different timestamp — `menagerie.html` at
`seekTo(8.52)`. Tally on Linux WebGL2 is now four failures across two scenes and
two timestamps against two clean runs, where macOS passes on both hardware and
software GL. The entry stays where it was first seen but no longer claims to be
about one film. The two affected scenes are the two most shading-heavy in the
corpus, which is suggestive and is not evidence.

The instruction that goes with it: characterise the rate before diagnosing the
mechanism — repeated `workflow_dispatch` runs on an unchanged SHA, counting
failures per scene. Four runs across a changed configuration supported no
conclusion, which is what the earlier retraction in this entry already records.

## 0.16.25

### fixed

Two `last updated:` markers dated to the wrong day, and CI caught it — which is
the point, but the mistake is worth recording because the reasoning was
backwards. 0.16.24's derived freshness check found `predecessor-record.md` and
`examples/README.md` carrying stale markers, and they were "fixed" by setting
each to the date of the *previous* substantive commit. Committing that fix then
made both stale again, immediately, because touching a file is itself an update.

**The rule is what the convention already says: `last updated:` means last
touched, not last meaningfully reviewed.** A commit that edits a dated doc dates
it to that commit. Review semantics live in the provenance headers, which is
exactly why both mechanisms exist. Anything else makes the check unsatisfiable.

Recorded also because of how it was found: the local run that should have caught
it before the commit was piped into `tail`, which masked the non-zero exit, so a
red self-check reported as green. `bun run scripts/selfcheck.js | tail -2` is a
green-looking lie; check the exit code.

## 0.16.24

### changed

**The playwright container was adopted, measured, and rejected in the same
session.** It pins the OS and driver stack, which is the variable
`materials.html` implicates — but it measures **2.31 GB**, of which chromium is
958 MB and firefox (270 MB) plus webkit (273 MB) are browsers this project will
never open. GitHub gives each job a fresh VM, so that is a full pull every run,
replacing a 22-second install of the one browser needed. Two of its three
justifications did not survive contact: it does not remove the download, it
multiplies it, and it does not provide a local repro either, because this is an
arm64 host and the runners are amd64 — a local run is a third environment, not a
reproduction. Recorded in `gate.yml`'s header so it is not re-adopted on the same
reasoning.

What survives is the cheap half: `runs-on` is now pinned to **`ubuntu-22.04`**
rather than `ubuntu-latest`, so "byte-identical within one backend" stops quietly
meaning "on whatever the runner was today." The Mesa/GL driver stack inside that
image remains unpinned, and that is stated rather than papered over.

**`selfcheck.js`'s freshness check now derives its own population.** It named
eight docs, and the list had already gone stale: `docs/predecessor-record.md`
carries the marker and was silently unchecked — the same hardcoded-count bandaid
the *adjacent* check in the same file explicitly refuses ("a stale claim with a
timer on it"). It now takes whatever tracked `.md` actually carries a
`last updated:` marker, finds **11**, and reports the count instead of asserting
it. That immediately caught two genuinely stale markers, in
`docs/predecessor-record.md` and `examples/README.md`, both from substantive
commits — fixed here.

### quality pass

Applied: the shared one-read of `templates/*.js` (the ratchet and the
bracket-exit check each walked the directory and re-read the bracket files), and
`THREE_PIN` scraped once instead of by two regex sites a few lines apart — one
fact, one read.

Skipped deliberately, with reasons. **The bracket harness is triplicated** —
temp-dir setup, injection-point drift detection, and the tally/exit report now
exist three times, which is this repo's own "extract at the third consumer"
trigger firing for tooling instead of scene code. Real, and tracked, but not done
at the end of a session: it would refactor three controls that are currently
verified green, and a broken control is worse than a duplicated one. **The luma
grid in `diagnose-determinism.js`** duplicates `smoke.js`'s `framingReader`, but
the only shareable home is `backend.js`, which ships to every installed user — so
sharing it would add bytes to the install cache for a maintainer-only diagnostic.
Batching the freshness check's git spawns and parallelising the brackets were both
declined on measurement: the spawns are tens of milliseconds against an 8s job,
and `bracket-liveplay.js` asserts on a fixed one-second rAF window that CPU
contention would flake.

## 0.16.23

### fixed

**The `brackets` step had been skipped in every CI run.** A step after a failing
step is skipped by default, and `smoke` fails first — so the controls added to CI
in 0.16.17 specifically to keep them runnable had never once executed there. The
same defect this workflow exists to prevent, reintroduced by step ordering.
`if: '!cancelled()'` now runs them regardless of smoke's verdict, which is correct
independently: the brackets test the detectors, not the corpus.

### changed

**Split into `static.yml` and `gate.yml`, on measured cost.** Three runs put the
cheap stage at **8 seconds** and the browser gate at **~3m04s** (chromium 22s,
smoke 2m36s over 8 scenes). Eleven consecutive commits paid the full price while
touching no scene at all. Now:

- `static.yml` — lint, self-check, fence parity. Every push, **not**
  path-filtered, because it checks docs as hard as code: the cascade, the
  freshness markers, subtree links, the provenance headers. A docs-only commit is
  when it has the most to say.
- `gate.yml` — the browser battery, `paths-ignore` on `**/*.md`, `docs/**` and
  `site/**`. A prose edit cannot break a scene, and paying three minutes for a
  changelog entry is how a gate becomes something people route around.

Chromium is cached (22s → seconds), keyed on the playwright pin.

### added

`scripts/diagnose-determinism.js` — reproduces smoke's in-session determinism arm
and reports **where** the two renders differ: which coarse grid cells moved, and
whether the change is localized to one object or spread across the frame. The
distinction is the whole lead. Wired as a `if: failure()` step, so the green path
pays nothing, with the two frames uploaded as artifacts.

It exists because the failure it targets does not reproduce on macOS — verified
again here, where it reports `IDENTICAL — did not reproduce`, which is the correct
answer locally and the reason CI has to be the loop.

## 0.16.22

### changed

**CI ran for the first time and refuted a shipped claim.** `references/materials.md`
asserted `materials.html` "is byte-deterministic on both backends" — measured on
macOS, stated without the platform. On ubuntu-latest / WebGL2 the scene fails
smoke's in-session determinism arm at `seekTo(5.36)`, reproducibly across three
independent runs. The claim now carries its platform and its refutation.

Ruled out, so the next session does not re-derive it: `t=5.36` is in the **toon**
beat (title 0-2.2, toon 2.2-5.6, skin 5.6-9.2, glass 9.2-13.4), the orbs move
only on `pulse(t,'glass',…)`, and no `renderOrder` is set anywhere — so neither
the transmission backdrop nor the documented depth-swapping-transparent-pair
exemption explains it. Not reproducible on macOS on hardware GL or software GL
(`ANGLE_BACKEND=swiftshader`), so CI is currently the only instrument that sees
it and there is no local loop yet.

Recorded with the constraint that matters: **this must not be resolved by
exempting the scene or relaxing the check.** That is the bake proposal's red line
#3 verbatim, and the check is behaving correctly — it found something on a
platform the claim was never measured on. It is now the top item before Phase 4,
because main is red and a permanently-red CI teaches people to ignore CI.

Also confirmed by that run: the static job is green on Linux, `selfcheck.js`
included, and the freshness check genuinely executes there — `fetch-depth: 0` was
required, since a shallow clone reports the tip commit for every file and would
make every marker look stale.

## 0.16.21

### fixed

`smoke.js`'s caption-speed comment pointed at `CPS_WARN_THRESHOLD` "for where 25
comes from" — the constant has been 30 for as long as that comment has existed,
with the change to 30 documented three lines above the definition. It now points
without restating the number, which is the only version that cannot go stale.

**The pins had three consumers and one checked copy.** `THREE_PIN` in `build.js`
is the pin, but `gate.yml` `bun add`s a version and SKILL.md tells a user to. The
CI copy is the dangerous one: bump `THREE_PIN` alone and CI installs a version
`vendor` will refuse, while the stamp check stays green and says nothing.
`scripts/selfcheck.js` now cross-checks every pinned `pkg@version` in the CI
install against SKILL.md's install command, and `three` additionally against the
code. Generalized rather than special-cased, because **Phase 4 pins Rapier** and
this is exactly where that would have repeated.

`docs/plan.md` restated the 1.09 MB / 0.77 MB bundle figures owned by
`references/webgpu-stack.md`. Phase 4's size bracket measures against that
number, so two copies of it was a hazard aimed at Phase 4 specifically.

### documented (repo)

`docs/working-plan.md` gains a **Phase 4 readiness** section: which of the bake
proposal's eval criteria the 0.16.16-0.16.21 work actually discharged and how
they were measured, the instruction to introduce the Rapier pin as a checked fact
rather than prose, the boot-sequence trigger on rule 5 that a bake will likely
fire, and the one thing still un-de-risked — **CI has never run.** The workflow's
static half is verified locally; nothing in it has executed on Linux, so it is a
claim until it is pushed.

## 0.16.20

### added

**`scripts/selfcheck.js` — the instrument pointed at the repo's own claims.**
`smoke.js` checks the film; nothing checked the claims about the film, the tools,
or the pins, and every defect in the 0.16.16-0.16.20 span was exactly that: an
assertion nobody re-read. Prose could not hold that line, because prose is what
rotted. Six checks, no browser, no `node_modules`, instant, in CI's cheap stage:
version-cascade coherence across all three files plus the newest CHANGELOG
heading; the three pin and its per-scene stamps; markdown links inside the
shipped subtree resolving *within* it; a provenance header and a `Not here` edge
on every reference; the measurement-assertion ratchet; and that every bracket has
a failing exit path. Not in the plugin subtree on purpose — it reads CHANGELOG.md
and marketplace.json, which no install cache has. It does not read `site/`.

**The three pin is now a fact, not prose.** It lived in a comment
(`bun add three@0.185.1`) and nothing checked it, so a workspace where someone
ran `bun add three` without the version embedded whatever it had — silently,
permanently, into a scene that then looks self-contained and correct.
Minification mangles three's own `REVISION` into a getter (`REVISION:()=>bK`), so
the shipped bytes cannot be interrogated after the fact. So: `THREE_PIN` declared
once in `build.js`, `vendor` resolves the installed version and **refuses to
embed a mismatch** (`VENDOR_ANY_THREE=1` overrides deliberately), and every
vendored scene carries a readable stamp naming the version inside it.

Verified both ways before shipping: a fresh IIFE built from `three@0.185.1` is
**byte-identical** to the one already embedded in `gearbox.html`, which is what
licensed stamping the five examples as 0.185.1 rather than asserting it — and all
five carry the identical library. The refusal path was confirmed by faking an
installed 0.186.0 and watching it refuse.

**A `Not here` edge on all eight references.** Each said what it was canonical
FOR; none said where the adjacent thing lived, so a reader who guessed wrong had
nowhere to go — and the ownership map existed only in `docs/source-of-truth.md`,
outside the subtree, unreachable from an install cache.
`grep -A1 'Not here' references/*.md` is now the entire relationship graph. That
is the one thing a schema document or a database would have bought, obtained
without either, and the self-check fails if an edge goes missing.

### changed

The measurement-assertion count moved out of prose and into the check that
computes it. It was published as "41" in three files from a coarse shell grep and
disagreed with the check within a day of being written — so `CLAUDE.md`,
`instruments.md` and `working-plan.md` now point at `scripts/selfcheck.js` and
state no figure. The ratchet's budget is the one hardcoded count in that file, and
it has to be: derive it from the code and the check passes always and measures
nothing. Every other count there is computed — an earlier draft asserted
"8 references" and that was a stale claim with a timer on it.

`.oxlintrc.json` stops flagging the deliberate `catch (e) {}` idiom. Fourteen
warnings on every run is how lint output becomes something people scroll past —
the same failure the crushed-exposure threshold has.

CI globs `bracket-*.js` instead of listing three names, so a new bracket cannot
silently never run.

## 0.16.19

### changed

The three long references — `method.md` (969 lines), `instruments.md`,
`delivery.md` — carry a heading map at the top. **Deliberately unlinked:** a map
costs nothing and cannot dangle, where hand-written anchors would ship into an
install cache unverified, and this repo has already paid for unverified pointers
more than once.

This is the cheap answer to the split pressure two independent outside reviews
applied to `method.md`, and it comes with a hypothesis worth testing: that
"monolithic" was a NAVIGATION complaint wearing a structure costume. The file has
27 headings under 6 well-ordered top-level sections and no way to see that
without reading all 969 lines. If the next reader still wants a split after
seeing the map, that is the evidence the deferred row has always lacked.

`delivery.md`'s map also states what is NOT in it: the format decision lives in
SKILL.md, at spec time, which is when it has to be made. The file is the
operational half. That was already true and unstated — the reason a rename to
`export.md` was considered and declined is that the content is delivery (where a
thing renders, what GitHub strips, why stills come from the scene) and only about
a quarter of it is export. Renaming would have made the name narrower than the
file and invited a per-format split that the comparative content resists.

`source-of-truth.md` instead moves to the accurate label: **render-side versus
delivery-side**, not export-side. One line, no pointer cascade, and it closes the
vocabulary seam that prompted the rename question.

## 0.16.18

### fixed

`CLAUDE.md` named the wrong tool for the SwiftShader refusal, and inverted the
intent while doing it. `shoot.js` refuses `WEBGPU=swiftshader`
(`refuseSwiftshaderShip` in `backend.js`, overridable only by
`WEBGPU_UNSAFE_SHIP=1`); `smoke.js` deliberately does **not**, because its
shipped-frame check exists to demonstrate that configuration failing and so the
gate has to be able to enter it. Anyone acting on the old line would have
"fixed" smoke by breaking the check. `SKILL.md` had it right all along, which is
the drift: the always-loaded invariants file was the stale copy.

### changed

**Rule 5 (`sortObjects = false`) relabelled from measurement to observation.**
It claimed CONFIRMED with 40/40 and 16/16 control counts and said the repro
scripts were "preserved in the session scratchpad." They are not in the tree —
not tracked, not under gitignored `internal/`. So nothing there can be re-run,
and nothing can say whether the defect still holds past r185. The counts now read
as history, with a trigger to rebuild the repro as a tracked
`bracket-sortobjects.js` on the next three bump. Keeping the flag off costs
nothing meanwhile, which is why this is relabelled rather than re-derived now.

`~2.3x` (WebGPU-Metal) and the `-s 6` AVIF knee now carry their conditions at
the claim site — one machine, one sweep — in the style `delivery.md` already used
for its decode figures. Neither number was wrong; both read as portable when
they are directional.

The skill `description` states what invoking costs: films are short (3-4s beats,
shipped examples 12-21s) and silent, and every input is re-authored as procedural
geometry because there is no import path for an image, document, video, or asset.
The description is a routing surface, so a reader who needs audio or an imported
asset should learn it before invoking rather than after. Scope unchanged —
"re-staged from scratch" always meant this literally.

`references/instruments.md` gains its first dated provenance, narrowly and
honestly: still not audited end to end, but on 2026-07-29 all three brackets were
run and made capable of failing. It also names the three kinds of claim in this
repo and which one rots — incident records and intent survive; **measurement
assertions decay silently.** Measured: 41 such assertions in `templates/*.js`
comments, 2 naming a runnable harness.

### removed

`metadata.review_interval_days` from `SKILL.md`. Nothing reads it, nothing
enforces 90 days, and the whole frontmatter loads into context on every
activation — the same reasoning that already keeps `version` and `author` out.
Scheduling belongs in `source-of-truth.md`'s drift-detection rule, not in every
activation's budget.

### documented (repo)

`docs/working-plan.md` now routes two things that existed and were unreachable:
`docs/examples-placement.md` (referenced from nowhere until now — spine rule 0
turned on the plan, and an outside reviewer independently re-derived its cost
table as a result), and the measurement-assertion sweep as a triggered debt with
its measured scale. The `method.md` split row records that two independent
reviews now push for it, that both argued the same taste claim already on file,
and that the one argument which would change its basis — a wholesale read
exceeding the reading tool's byte cap, giving a silent truncation — has not been
tested.

## 0.16.17

### fixed

`build.js vendor` wrote its two build inputs — `.three-entry.js` and the
intermediate `three.global.js` — to unsalted names in the scene folder, while
`workspace()` two functions below has been PID-isolated all along. Two
concurrent `build.js` runs in one scene folder shared both, and the loser's
`finally` deleted the winner's entry file mid-build. Both are now PID-salted.
Reachable in exactly the case this repo already documents: more than one session
live in one checkout. Raised by an outside review; verified by reading, then by
running an unvendored template through the gate.

### changed

**`bracket-determinism.js` and `bracket-liveplay.js` can now fail.** Both
printed their rows and exited 0 whatever those rows said — so adding them to CI
would have bought a green that could not go red, which is the exact shape this
repo spends its instruments budget arguing against. Each row now carries the
verdict it must produce, mismatches print `BRACKET FAILED (expected: …)`, and
the script exits 1. `bracket-determinism.js` also gains the injection-point
guard `bracket-liveplay.js` already had: a mutation that silently no-ops makes
a row read like `unmodified` and is how a bracket stops testing anything.

CI now runs all three brackets rather than only the new one. An unrunnable
control is a defect this repo has already eaten once — rule 5's repro is cited
as preserved and is not in the tree — and running them is how they stay runnable.

### documented

`settle()` in `backend.js` carries its known limit: two rAFs is ~33ms, so a
scene that debounced its resize handler past that would be captured mid-relayout.
No shipped scene or template debounces, so nothing is exposed and the closing
assertion is deliberately not written. Recorded with a trigger — the first scene
that debounces, or any resize handler that awaits — because a check with no
reachable failure is the earn-in shape this repo declines.

## 0.16.16

### fixed

The console-noise allow-list in `smoke.js` matched neither of the two messages
it most needed to, so **every 3D scene failed the gate on the default WebGL2
path** — the whole shipped corpus, on the one path documented as CI-safe. One
anchored regex was tested against message bodies, but both arrive with a prefix
in front: Chromium emits `[.WebGL-0x7f…]GL Driver Message (…)` and three emits
`THREE.WebGPURenderer: WebGPU is not available, …`. Only `No available
adapters.` ever matched. The intent was already documented correctly in the
comment above the filter; the regex never implemented it.

It stayed invisible because nothing runs that path unattended and development
runs `WEBGPU=metal`, where neither message is emitted at all. The absence of CI
was not a documentation gap — it was masking a broken gate on the path CI would
use.

Also fixed, and found by the new bracket on its first run: the classifier
existed in **two copies** — one per page the check opens — and only one was
updated, so the cold shipped-frame page threw `ReferenceError`. There is now one
`classify` shared by both. Two copies of a filter is the same bug shape as two
copies of a fence.

### changed

`GL Driver Message` and `GPU stall` now tolerate one leading context bracket.
Three's fallback announcement is no longer text-matched at all: it is held and
classified **structurally** against `window.BACKEND` once the scene has booted,
because whether it is a defect depends on state the console handler cannot see.
Expected when the scene reports `webgl2` (or is 2D and reports nothing); a hard
failure from a scene claiming `BACKEND='webgpu'`, which is a self-contradiction
the old text-only filter could not catch. That arm is strictly stronger than
what it replaced. The suppression advisory now says which of the two kinds it
dropped.

### added

`templates/bracket-noise.js` — the control for the allow-list, four arms, and it
drives the real `smoke.js` as a subprocess rather than re-implementing its
logic, because a copy would have passed while the gate failed. It **pins the
fallback path** by clearing `WEBGPU`, since the thing under test is a claim
about text nobody controls and it has to be re-run where it applies, not where
the developer happens to be. The two load-bearing arms pull opposite ways: the
expected notice must not fail a clean scene, and a real warning must still fail
— the second is what proves the green was not bought by widening suppression.

Measured 2026-07-29, `WEBGPU` unset: corpus green on the fallback path with the
dropped messages surfaced as advisories, corpus green on `WEBGPU=metal`
unchanged, all four bracket arms as specified.

Introduced in **0.16.9**, by the test-audit pass that added the `^\s*` anchor
and wrote a comment asserting the anchor was measured not to close the cloak.
The anchor was tested against message bodies rather than against what Chromium
and three actually emit, so it matched nothing on the fallback path. A hardening
pass broke the gate and documented the break as a measurement.

### added (repo, does not ship)

`.github/workflows/gate.yml` — the first CI this repo has had, and the direct
answer to why the above shipped. Two jobs: `static` (oxlint with `no-undef` on,
plus cross-directory fence parity including the negated `site/films/` carrier —
seconds, cannot flake) and `gate` (the full smoke battery plus
`bracket-noise.js`). The browser job pins **no** backend env var on purpose:
that is the fallback path, and running it unattended is the entire point. It is
**unverified on Linux** — every measurement in this repo was taken on macOS — so
the first run is the measurement, not a regression.

`.oxlintrc.json` — `no-undef` is **off** in oxlint's defaults, which is the one
line that matters; `browser: true` is required because the brackets pass real
functions into `page.evaluate`. Neither file ships: `plugin install` copies only
the `plugin/` subtree, so there is no cascade and no install-cache weight.

### removed

`SHIP_VIEWPORT` in `smoke.js` — dead since the caption-overflow resize was
removed, and its comment asserted the caption "must be measured here and not at
VIEWPORT" while the live reasoning 500 lines below records the opposite. A
constant that outlived its claim and then contradicted it. The incident record
it belonged to stays where it is. Found by a `no-undef`/`no-unused-vars` pass,
which is the first thing to run over these files that reads them statically —
worth noting that `no-undef` is **off** in oxlint's defaults and has to be
enabled explicitly.

## 0.16.15

### changed

- `SKILL.md`'s `metadata.last_verified` moves to 2026-07-25, on owner
  authorization. It records a full line-by-line read of **the working tree**
  (invariant 6) against `templates/`, `references/` and `examples/`, run twice
  from independent readings and then cross-checked by a third that had seen
  neither. What that review found is 0.16.13 and 0.16.14; this entry only dates
  it. The date is a version cascade of its own because the frontmatter ships,
  and an installed cache that keeps the old date is the drift the cascade
  exists to prevent.

## 0.16.14

### fixed

- **`--parity-only` could not run in a fresh clone.** `smoke.js` required
  `playwright-core` at module scope, long before the parity path's early exit,
  so the no-browser pre-commit mode 0.16.13 advertised died on a dependency it
  never uses — the same "advertised runnable, needs an undeclared dependency"
  shape 0.16.13 fixed for the brackets, reintroduced one release later for the
  check it recommends. It and `backend.js` now load lazily; parity completes
  with nothing installed.
- **The DRIVER fence still taught the `nocap` claim 0.16.13 corrected.** Its
  comment said `?strip=text` "hides every word on screen"; in a 3D scene both
  flags are one boolean and neither touches geometry. Corrected across all eight
  carriers together, and in `shoot.js`, which quoted the same phrase.
- SKILL.md said the nocap sheet hides "the caption pill only" — it hides the DOM
  title as well.
- The plugin README lost its only mention of `ffmpeg` when 0.16.13 removed its
  Requirements block, and `build.js` invokes ffmpeg unprobed, so a missing one
  surfaces as a bare spawn error with nothing to explain it. Restored.
- The bracket headers still advertised themselves as "self-contained" and
  re-runnable "from a clean checkout" — the claim 0.16.13 recorded as false —
  thirteen lines above the note explaining they are neither.

### changed

- The inert-parity note fires only on a multi-scene scan. The documented
  authoring loop leaves one film in the working directory, where it would have
  printed six notes per run advising something the author cannot do; that case
  is now stated once instead.
- `SHOTS` joins the soft-contract check for 3D scenes, gated on `window.BACKEND`
  so 2D scenes, which legitimately have none, do not warn.
- `docs/plan.md` now states that marking a gate met obliges updating the plugin
  README's status line, written at the point where gates are declared. Nothing
  can check those two against each other, so the obligation belongs where the
  decision is made.

## 0.16.13

### added

- **`smoke.js` says when fence parity is inert.** A fence carried by only one
  scanned scene compares nothing, and the run still printed a bare
  `parity/integrity: ok` — a green board for a check that never ran, which is
  the failure this repo cares most about. Bracketed both ways: silent across the
  full carrier set, five notes against a single scene.
- **`smoke.js` names absent soft-contract exports** (`BEATS`, `FRAME`,
  `FLASHES`, `CAPFADE`) instead of silently falling back. The fallback stays —
  scenes authored before a field existed must keep running — but its silence was
  what let a rename read as a pass. Both changes replace a SKILL.md warning with
  the tool saying it at the moment it applies.

### fixed

- **The bracket scripts could not be run by anyone.** Advertised as
  "self-contained", they resolve their fixture beside themselves (so a copy in a
  working directory fails on the missing example) and require `playwright-core`
  (so an in-place run fails on the missing dependency). SKILL.md now gives the
  invocation that works — run in place from the working directory, with
  `NODE_PATH` supplying the dependency — verified end to end.
- **`SUBJECTS` was never mentioned.** SKILL.md said to replace "the two marked
  sections", but the 3D templates require `SUBJECTS` and `SHOTS` to be authored
  too. Following the file literally left the camera framing the template's demo
  geometry. The `h`-is-the-payoff-extent and declare-`w` rules are now stated at
  the point of authoring rather than only in `film-language.md`.
- **The semantics pass claimed more than it does.** `sheet ... nocap` sends
  `?strip=text`, which no-ops `txt()` draws — but `txt()` exists only in the 2D
  template. On a 3D film both flags collapse to hiding the DOM caption, so
  mesh-built labels survive. `method.md` contradicted itself on this inside one
  paragraph; both homes now say the same true thing.
- **The contract's rename rule overstated enforcement.** Smoke asserts four of
  the eight window names; the rest are read behind fallbacks, so a rename
  misleads rather than failing. `BEATS`/`FRAME`/`CAPFADE` quietly weaken checks;
  `FLASHES` stops the sample plan avoiding flash frames, which makes the
  blank-frame check fire on a legitimate film — the exact regression
  `smoke.js:242-246` records having already happened once.
- **Fence parity's precondition is now stated** — it needs two or more scanned
  scenes carrying the same fence, so it cannot fire in a one-scene working
  directory.
- `capEnd` appeared in `method.md`'s canonical beats example and is implemented
  nowhere; removed rather than left as a silently ignored field.
- Undocumented positionals labelled (`loop`/`avif` are `<fps> <width>`,
  `poster` is `<t>`, `strip` takes `<t0> <t1>`); `CONFIG.sway = 0` named as the
  actual mechanism behind the held-camera constraint; `--parity-only`
  surfaced; the required Chromium install and the `img2webp`/`avifenc`
  encoders added to Environment.
- Self-containment restated precisely: a canonical vendor tag is re-embedded by
  `ensureVendor`, it is other external references that fail the scene.
- Stale `BokehPass` comment corrected to `STYLE.dof` across its four carriers.
- **The `h` misconception was still being taught by the code.** The template's
  own `SUBJECTS` comment said "`h` is the height the framing math uses" — the
  exact belief `references/film-language.md` exists to correct, sitting one
  paragraph from the `BokehPass` line above it in the same four files. That
  reference also contradicted itself on the point within six lines. Both
  corrected, and both SKILL.md and the four comments now point at that reference
  rather than becoming further copies of the rule.
- The brackets' own usage comments described invocations that fail — one said to
  run from `templates/`, where the dependency does not resolve. Both now carry
  the verified form.
- Plugin README reduced to what a user actually needs: what it is and is not,
  install, invocation, where to find what, and status as a pointer. Its tooling
  and phase narratives were third copies of facts owned by `references/*.md`
  and `docs/plan.md`, and had already begun to drift.
- Restructured the smoke-check paragraph, which 0.16.12 left as an unreadable
  run-on sentence.

## 0.16.12

### changed
- **`SKILL.md` caught up with the suite twice over.** Its one-line summary of the determinism check still read "same `t` twice → byte-identical", which has been incomplete since 0.16.9 added the cross-reload sample — and the reload is the half that catches the interesting class, a random drawn once at load that is pure within a session and produces a different film every time the page opens. An author reading the old line would reasonably conclude smoke covers only in-session purity. This is the third time this release series that `SKILL.md`'s description of a check lagged the check; the version cascade deliberately excludes `SKILL.md`, and that exemption is about frontmatter cost, not accuracy.
- **The two tracked brackets are listed where authors look.** `templates/bracket-liveplay.js` and `templates/bracket-determinism.js` now appear in the Files section with what they are for: each builds its own broken copies of a shipped example and reports which injections fire, so an author who doubts a green can re-derive it rather than trusting it. They were tracked precisely so that is possible, and a control nobody can find is barely better than one that does not exist.

## 0.16.11

### added
- **`templates/bracket-determinism.js` — the control for the check 0.16.9 shipped, which had none.** Three injections against `gearbox`, self-contained: unmodified passes both halves; state-across-frames is caught in-session; a random seeded once at load is **caught ONLY by the reload**, which is the row the whole check exists for and the one that read `all scenes pass` before 0.16.9. Written because the original controls were shell heredocs that generated and deleted their fixtures in the same command, so within an hour of shipping the fix nothing could re-run it — the exact failure the repo adopted a rule against earlier the same day, repeated by the person who wrote the rule. `instruments.md`'s determinism row now names the bracket and the new reload sample.

### changed
- **The blank-lightbox diagnosis is downgraded, because the fix identified the cause.** 0.16.10 shipped visibility fixes without claiming a cause, and recorded hero-iframe WebGPU contention as the leading hypothesis. The fix resolved the report on desktop and iOS Safari — which means the scene was booting all along and the `opacity:0`-until-`sceneReady` gate *was* the bug, not a symptom of contention. Slow boot is now survivable because the film's own boot card is visible while it compiles. The unmount idea is demoted from a plan item to a note.

## 0.16.10

### fixed
- **The lightbox made a slow film and a dead film pixel-identical.** Three defects in `openFilm()`, all of which turn any boot problem into a flat dark panel under correct chrome — which is exactly what a user reported. The iframe was hidden (`opacity:0`) until `sceneReady`, which threw away the scene's own boot card — the card that exists *precisely* so a booting film never reads as blank. On expiry of a 90-second ceiling it then revealed an unrendered iframe with the loading text removed and nothing logged. And the readiness probe did `catch (e) { ready = true }`, so a thrown error counted as success, on a path with no logging at all — which is why "nothing in the console" was never evidence the scene was fine. Now: the film is revealed immediately and its own boot card is the loading state; the ceiling is 20s and expiry both keeps the film visible and warns, naming the film and suggesting opening it full size; and a thrown probe logs instead of lying. Measured motivation, in Safari with the hero still live: `menagerie` took **11.1s** to reach `sceneReady` against the hero's **1.2s** — under the old gate that is eleven seconds of blank panel with no signal.
- `site/index.html` moves to `app.js?v=30`, because `app.js` changed and `netlify.toml` caches `/*.js` for an hour — the same defect 0.16.3 fixed and the reason the rule exists.

### changed
- The investigation could not reproduce the original report in Chrome or Safari, locally or against the live site, and the deploy is confirmed healthy (all six films 200, md5-identical to source, no CSP, no service worker). So this release fixes the *visibility* of the failure rather than claiming its cause. The leading hypothesis — the hero iframe stays mounted and holds a WebGPU device while a second scene boots beside it — is recorded in `working-plan.md` with its measurement and a trigger, deliberately unshipped: the fix costs a re-boot on every lightbox close and nothing has confirmed the cause.

## 0.16.9

### fixed
- **Determinism was only ever checked inside one page session, and that let a prime-directive violation pass clean.** The check rendered at `t`, sought away, sought back, and compared — never reloading. A scene that draws a random ONCE at init is perfectly pure within a session and passed green, while three page loads produced three different films (measured: `d99140c980d9` three times unmodified, `47abb8be…`/`fdec2be5…`/`cd673d81…` with a load-seeded random). That is the founding claim broken — the HTML a viewer loads and the MP4 the recorder shoots are not the same film — and the entire suite was blind to it. One reload and one re-screenshot now covers the class. Bracketed: the load-seeded mutant fails, the shipped corpus stays green.
- **The caption-overflow check could not fire, and its stated reason was false.** It resized to 1920x1080 because the caption was "sized in fixed CSS px" — but the template sizes it `calc(var(--fw)*.015625)`, frame-relative, and the pill/frame ratio measures 1.219 at 640 against 1.217 at 1920. Scale-invariant, so the resize bought nothing. It also *cost* everything: resizing without settling measured a pill still laid out at the old size against a frame computed at the new one, under-measuring by ~3x, so a caption overflowing by 32% produced no warning at all. The resize is gone; measuring at the check viewport is now equivalent and cannot go stale. The framing block's own comment already stated the rule this broke.
- **The cold `?strip=text` page had no error listeners**, so any defect manifesting only on that load was invisible while the identical defect on the live load failed red. Same listeners attached; bracketed both ways.
- **Three of the contract check's four members were shadowed by their own consumers.** It ran after `sceneReady` was awaited and after `stopPlayback()` was called, so only `DURATION` ever produced the `missing contract:` message — the others surfaced as a 20s timeout or a raw `TypeError`. The check now runs before `stopPlayback()`. `sceneReady` stays shadowed by its own wait, which is unavoidable and now said out loud rather than implied.

### changed
- **The console-noise filter cannot be closed, so it is made loud instead.** `console.error('GL Driver Message: <a real defect>')` was dropped silently, because the filter substring-matched driver text. Anchoring narrows it but does not close it — the real noise strings *are* prefixes. Two closes were tried and rejected: filtering on message origin fails because three.js is inlined, so three's own legitimate "WebGPU is not available" carries the scene's URL and would stop being suppressed; a bounded tail is unmaintainable against driver text nobody controls. Every suppressed message is now reported as an advisory naming what was dropped. Silent suppression was the actual defect — an error nobody can see is indistinguishable from no error.
- **The blank-frame check stops advertising coverage it does not provide.** An audit found no mutation that fires it without the shipped-frame spread check firing first, including a fully black render where it stayed silent because the caption pill kept the PNG above the floor. Kept as a backstop for scenes with no `?strip=text` support — the one case where it adds anything — with the comment rewritten to say so.

## 0.16.8

### changed
- **Render and export are now named as separate domains, because one shared namespace nearly cost a fact.** A consistency pass found `2.3x` in six places and almost merged them: four are the renderer-backend speedup, two are an AVIF **encoder-effort** ratio (`-s 8` produces 2.3x larger files) with no relationship beyond the digits. Both figures now say which side they are on at every site, `source-of-truth.md`'s homes table gains explicit render-side (`webgpu-stack.md`) and export-side (`delivery.md`) rows, and the rule is stated: when a figure could belong to either domain, say which. The near-miss is the argument — a blind sweep merges facts that share a number.
- **Two references now carry an actionable unverified marker instead of a passive admission.** `instruments.md` and `delivery.md` read **"Verification date: UNKNOWN — never audited end to end"** with an explicit call to verify and stamp a real date. The earlier wording ("has never carried one") was true and did nothing; this states the debt as work.
- **The freshness rule was what was wrong, not the eleven files violating it.** `CLAUDE.md` demanded a `last updated:` line, and eleven files carried a *better* instrument instead — all eight references use a dated provenance header recording what was verified against what, and `SKILL.md` uses `metadata.last_verified`. The rule now names all three acceptable forms, exempts files that are themselves dated records (`CHANGELOG.md` by entry, `THIRD_PARTY_LICENSES.md` static), and exempts `.claude/` behaviour definitions while noting they still carry drift-prone claims. `README.md`, which genuinely had none, gets one.
- **Two inherited citations in `predecessor-record.md` resolved to the wrong rule in this repo** — "CLAUDE.md invariant 3" and a "mirrored-copies-plus-test pattern", both from the predecessor's numbering. The file is reproduced verbatim, so the text stands and editorial notes were inserted beside it: this repo's invariant 3 is the plugin-layout rule, and the equivalent idea lives in invariant 2 plus `instruments.md`. A dangling pointer is better than one that resolves to the wrong rule, which is why these earned annotation rather than the read-as-history banner.

## 0.16.7

### fixed
- **The reproducibility facet of the provenance rule was violated repo-wide, one release after the rule shipped.** `source-of-truth.md` requires a measured bracket to carry a date, its conditions, *and* a harness runnable from a clean checkout — and no harness of any kind was tracked. The one that refuted 0.16.2's blind-spot claim lived only in gitignored scratch. `templates/bracket-liveplay.js` now ships beside `smoke.js`: 89 lines, builds its own four broken copies of `gearbox`, and re-homing it made it self-contained within the subtree so `instruments.md` can cite it under invariant 3. Verified from its new home — unmodified 21/21 playing, the other three all 0/0 firing.
- **One figure, several homes.** `~2.3x` appeared in four places and `1.09 MB` in two, most without conditions, against the rule that a number appearing twice is itself the bug. `webgpu-stack.md` keeps both with their conditions; `CLAUDE.md`, `SKILL.md`, `plugin/README.md`, `backend.js` and `build.js` now name the phenomenon and point. **Two apparent duplicates were a coincidence** — `delivery.md` and `build.js` cite a 2.3x about AVIF *encoder* speed, an unrelated measurement — and were left alone; a blind consolidation would have merged two different facts.
- **A count maintained by hand inside a shipped reference.** `instruments.md` said the contact-bug class "has recurred five times" while the repo's ledger derived six. The reference now names the class without a figure and notes the running count is kept outside the subtree, which is the only correct shape given it may not cite `docs/`.
- **Measurements without their conditions.** The live-playback cost (+0.14s hardware, +1.05s software-GL) now states machine, scene, viewport and method. `plan.md`'s tracked-size figures were re-measured — 7.9 MB total, 5.8 MB plugin, 5.5 MB examples, by byte-summing `git ls-files` on 2026-07-25 — replacing undated post-split numbers that had drifted, with the method named because `du` block-sums differ at that precision.
- **Two provenance headers had no verification date, and now say so.** `instruments.md` and `delivery.md` state plainly that they have never carried one, rather than acquiring an invented date — writing one would assert a review that did not happen, which is the same trap `metadata.last_verified` carries.
- **Six provenance headers did not say which copy was verified**, which invariant 6 made load-bearing the same day: they now read "verified (in the working tree, not an install cache) against…". `CLAUDE.md`'s invariant 2 and `working-plan.md`'s extent-check verification got the same treatment.

## 0.16.6

### fixed
- **Four code comments asserted enforcement that does not exist, found by pointing an audit at comments rather than at docs.** The HTML fence in all thirteen carriers said "smoke.js fails a scene that is still carrying it" of the vendor tag. It does not: `bundle()` calls `ensureVendor()` *first*, which embeds three in place, so a canonical tag is silently fixed rather than failed — control-verified by building a scene carrying the tag and watching `build.js bundle` exit 0 with the tag gone. What smoke genuinely fails is a *non-canonical* external ref, which `ensureVendor` skips and the external-ref check catches. The same comment claimed `ensureVendor` runs before "every command that opens a scene"; `shoot.js` opens scenes and never embeds, which `SKILL.md` already documented as an exception. Both corrected.
- **`smoke.js`'s own headers contradicted its code.** The section header at the advisory block said "never fail the build" while framing invariance and the ≥99%-near-black branch of exposure both `fails.push` 130 lines below it — each with its own honest inline comment saying so, making the header the stale part. The file header repeated it, listing exposure as purely advisory and omitting framing invariance from both lists. It also still claimed checks run "unbundled AND bundled" when the source/bundled pair collapsed into one artifact, which the code states explicitly 800 lines later. Third instance of the comment-asserts-a-mechanism class after the extent check and the nodeFrame guard.
- **`film-language.md` stated the vocabulary trigger below the bar the promotion model sets** — "vocabulary enters when a film *needs* it" against `plan.md`'s "a film is **blocked** expressing something the tables cannot say". This matters more than an ordinary drift: `docs/` is uncitable from the plugin subtree, so this line is the *only* earn-in statement an author working from an installed plugin ever sees.

### changed
- `plugin/README.md` carries the date it was actually edited (2026-07-25), not the day before.

## 0.16.5

### fixed
- **Six broken images and a broken link shipped in `examples/README.md`, licensed by an invariant that contradicted the one fixed a release earlier.** Every poster reference used `../../../../site/posters/…`, which resolves in the repo — the reason nobody noticed — and climbs *past the cache root* for an installed user: from `skills/mitate/examples/` it lands on `<cache>/mitate/mitate/site/posters`, which does not exist. Verified by resolving the path against a real 0.16.1 cache. Now absolute `raw.githubusercontent.com` URLs for the embeds and a `tree/` URL for the directory, which render from the cache, a clone, and GitHub alike, and keep the tracked-once rule intact — no second copy of any poster. **The rule is the finding.** 0.16.4 corrected invariant 3's claim that plugin READMEs may cite outside the subtree, and its own entry says "a wrong rule outlives any single link it licensed" — but invariant **4** separately licensed the same defect for this file ("embeds by relative path"), so the two invariants contradicted each other for one release. Fixing a rule now means checking whether another rule licenses the same thing.
- **`bibles.md` sent an installed reader to two files they do not have.** It cited `site/posters/gearbox-still.jpg` and its neon pair as where to look; that directory is outside the plugin subtree and absent from every install cache. Reworded to name the location and say plainly it is not in the cache — the scene itself, which *is* in the subtree, is what a reader there can actually open. Not a link, so nothing was broken; it was directions to nowhere.
- **A contents-table anchor in `predecessor-record.md` pointed at a heading that does not exist**, written against the link text ("AVIF vs WebP") rather than the heading ("Inline delivery: the format comparison"). The file reproduces the predecessor's four planning docs verbatim, but a *merged* contents table cannot be verbatim — the source documents were separate — so the anchor is this repo's own consolidation artifact and was fixed rather than preserved. The heading is untouched.

## 0.16.4

### fixed
- **The shipped plugin README pointed three times at files an installed user does not have.** `plugin/README.md` linked `../docs/plan.md`, `../docs/physics-bake-proposal.md` and `../CHANGELOG.md`. `plugin install` copies only the plugin subtree into a version-stamped cache — verified, it contains `.claude-plugin/`, `README.md` and `skills/` and nothing else — so every one of those resolved to nothing for the reader actually holding the README. Now absolute repo URLs, which resolve from the cache, from a clone, and on GitHub alike. One more line in the same file had the same problem without being a link: the invocation example `"Turn docs/data-flywheel.md into an explainer"` reads as a path into a `docs/` the reader does not have, and was the only example of the four written as a path rather than as a request — now `"Turn a long dense paper into an explainer"`, which is the case the skill's own description already advertises. Fifth instance of the dangling-pointer class this week, and the first in a file `CLAUDE.md` had explicitly exempted: its invariant 3 said plugin READMEs may cite outside the subtree "since a repo clone has them", which is true of a clone and false of the install cache. The exemption is corrected rather than the link alone — a wrong rule outlives any single link it licensed.

### changed
- **`CLAUDE.md` gains a sixth invariant: the installed skill is not the skill you are editing.** mitate is normally enabled as a plugin on the machine where it is developed, and the two are different artifacts — invoking `/mitate` in this repo loads the version-stamped cache, not the working tree. Measured during this release: tree at 0.16.3, cache at 0.16.1, with differing `SKILL.md` files, so a check run against "the skill" could answer about either. The rule is not to disable the plugin — the cache is genuinely valuable as the installed-user fixture, and was used that way twice this week to verify what a reviewer would actually read. The rule is to say which copy was checked, because *what will ship* and *what users have* are different questions. (mitate ships no hooks, so the loaded skill cannot act on this repo by itself; the hazard is reading the wrong copy.)

## 0.16.3

### fixed
- **A false capability claim shipped in eight tracked files, and the session that identified it shipped twice without fixing it.** `solveShot`'s floor-guard comment said camera-inside-subject "is a LIE about extent, and the extent check in smoke.js is what catches it." There is no extent check — no `Box3`, `setFromObject` or `computeBoundingBox` anywhere in `templates/`, and `subjectExtent` reads hand-declared `SUBJECTS` values without ever touching geometry. An author reading it believes a failure mode is gated and skips the manual check. Because it sits in the `SOLVER` fence the same line was in both 3D templates, all five examples, and the site's neon variant; corrected in all thirteen carriers (the six staged `site/films/` copies are gitignored and regenerate). The comment now names the gap instead of a guard: nothing catches it today, so measure the extent. Found by a code review of the diff in which `working-plan.md` had already written "fix the comment either way" — identifying a defect and shipping past it twice is the more useful half of this entry.
- **The site's cache-buster did not move when `app.js` did.** 0.16.1 changed `app.js` to route both `seekTo` call sites through a warning `drive()`, but `index.html` still requested `app.js?v=28`, and `netlify.toml` sets `max-age=3600` on `/*.js`. A returning visitor inside the hour, or any intermediate cache, would run the pre-fix file — so the warning that entry claims to ship would never reach them. Same class as the defect 0.16.0 bumped `v=27→28` to close. Now `v=29`.
- **The live-playback check could fail a healthy film for being slow.** It required three `seekTo` calls inside a fixed 5s — a budget bracketed on one machine at one viewport, then applied as a universal threshold, which is precisely the measured-on-one-machine error this suite exists to catch. A heavy scene on a contended box under software GL could miss it while perfectly alive. **Zero is now the only hard fail**, and the asymmetry is the point: a dead chain drives `seekTo` exactly 0 times however long you wait, so it separates from "slow" with no wall-clock calibration at all. A count of 1-2 is genuinely ambiguous — a loop that ran once and died is indistinguishable in a 5s window from a slow healthy one — and now warns, naming the disambiguation (a dead chain stays at 0; a slow one climbs).
- **One diagnostic read as a flood.** The live-playback load shares the page whose console listeners feed `noise`, and `noise` concatenates into `fails`. So every boot-time console error was captured once per load, and any per-frame warning inside `seekTo` — the `nodeFrame` guard, for instance — emitted once per rendered frame while the loop ran, turning a single three-pin diagnostic into hundreds of identical FAIL lines. Deduped.

### changed
- **`SKILL.md` did not know about the check `smoke.js` had gained.** Its enumeration of the hard checks and its `templates/smoke.js` summary both predated the live-playback gate, so an author hitting `live playback stalled --` found no entry point in the most-read file in the skill. The version cascade correctly excludes `SKILL.md`, but that exemption is about frontmatter cost, not accuracy. Both updated.
- **`method.md`'s provenance line claimed an audit that missed what was in front of it.** It asserts a full source audit on 2026-07-24; 0.16.2 then fixed three dangling `style-3d.md` pointers inside that same file. The header now says so, with the reason it generalises: a straight read does not test whether pointers resolve — only following them does.
- **The retracted figure in 0.16.1 carries a marker.** That entry still states the 71-calls measurement 0.16.2 retracted as a probe artifact. History is not rewritten here, so the number stays as what was believed at the time — with a pointer saying it is retracted and must not be reused. This is the `source-of-truth.md` provenance rule applied to the changelog itself.

## 0.16.2

### fixed
- **A "cannot see" entry in the instruments ledger described a blind spot that does not exist — and the correction is the more useful finding.** 0.16.1 recorded that a host which both replaces the playback loop *and* swallows `seekTo` exceptions passes the live-playback check while rendering nothing, citing a measurement of 71 calls with 71 distinct `t`. That number was an artifact of the **probe**, not the gate: the ad-hoc wrapper used to produce it incremented its counter *before* calling the inner `seekTo`, so the increment ran even when the inner threw. The shipped check counts after the inner returns, which is exactly why a swallowing host fires like any other frozen film. Re-bracketed four ways against `gearbox` from a self-contained harness — unmodified (calls=20, distinct=20, playing), a throw in the rAF loop, a throw inside `seekTo`, and a swallowing host, the last three all calls=0 and firing. The wrapper ordering is load-bearing and the entry now says so. What survives, stated narrowly: the check runs standalone, so **no deployment configuration other than a top-level load is exercised** — the iframe-with-a-parent-driving-`seekTo` case and the install cache are covered by nothing, which is a gap in the harness rather than a limit of this check. Worth recording how it was caught: the original bracket depended on scratch files that were later deleted, so re-running it required rebuilding it self-contained — and the rebuild refuted the claim. A measurement that cannot be re-run is an assertion with a number attached.
- **`method.md` cited a reference that has never existed here, three times.** Lines 19, 146 and 244 pointed at `style-3d.md` — a predecessor filename — including as the home of the wash-rule refutation. The file is absent from the repo and from the install cache, so every installed user following those pointers hit nothing, in the most-read file in the skill. The predecessor's single cookbook was split across four references on this stack, and the citations now say so: backend and API specifics to `webgpu-stack.md`, procedural recipes to `materials.md`, look-as-one-object to `bibles.md`, lens and camera vocabulary to `film-language.md`. The wash-rule line now points at `materials.md`, where the failure is solved structurally (cel builds on an unlit base, so ambient light cannot wash the bands) rather than restated as a rule. Fourth instance of the verbatim-copied-reference class after 0.14.0, 0.15.0 and 0.16.0 — and the first found by an agent following the pointer rather than by an audit.

## 0.16.1

### added
- **The gate never once ran the film.** Every template starts its playback loop with `if(!location.search.includes('record'))requestAnimationFrame(loop)`, and all three page loads in the tooling — one in `shoot.js`, two in `smoke.js` — carry `?record=1`. So the code path every human who opens a scene actually takes was executed by nothing in this pipeline: a scene whose loop dies on its first frame ships perfect recorded frames, sits motionless on screen, and passes green on both backends. Found by driving a real page while prototyping viewer controls, where the frozen film was the only symptom and every instrument disagreed with it. `smoke.js` now loads each scene once **without** `?record=1` and watches the mechanism rather than the pixels: the loop's only job is to call `seekTo` with a rising `t`, so it wraps `seekTo` after `sceneReady` and counts. A pixel diff would have to guess how far a given film moves in 200ms and would fire on a held title card — the same one-frame-proves-nothing trap the strip exists for. Two distinct `t` values is the load-bearing half of the assertion: a loop that runs forever recomputing the same `t` is as frozen as one that never started, and a call count alone passes it. Bracketed three ways on `gearbox`, each firing with its own message — chain never started, first frame threw and killed the chain (the shape the real defect took, page error captured alongside), and a clock stuck at `seekTo(0)` caught only by the distinctness arm. Quiet on all five shipped examples and on the 2D template, whose `[source]` tag with no backend confirms the Canvas2D path is covered too. Costs one page load per scene: +0.14s on hardware WebGPU, +1.05s on the software-GL default, the gap being boot rather than the check. `instruments.md` carries the row, the brackets, and the boundary it does not cross — it answers *does the loop run*, never *does it read*, so watching the loop at speed is still a human's job.

### fixed
- **The one configuration where a dead film looked alive to everything.** The site replaces the scene's own loop (`stopPlayback()`, "we drive it now") and drove `seekTo` through two separate `try { … } catch (e) {}` sites that swallowed silently. So a scene throwing on every seek kept a perfectly healthy-looking scrubber — the readout advancing, the marker moving, the canvas rendering nothing — and neither instrument covers that path: the live-playback check loads standalone, where the chain does die, and the shipped-frame check runs under `?record=1`. Measured: the same injected fault reads 0 calls standalone and 71 calls with 71 distinct `t` under a swallowing host. **(That second figure is retracted — see 0.16.2. It was a probe artifact: the ad-hoc wrapper counted before the inner call returned. The entry stays as written because the record should say what was believed at the time; the number should not be reused.)** Both call sites now route through one `drive()` that warns once and keeps going; the page must not die because a film did, but nobody should have to guess why the canvas stopped. Found while bracketing the check above — the boundary of an instrument is worth measuring, not just stating.

## 0.16.0

### added
- **The hero's timeline is an input now: drag t and the scene follows.** The track is a real slider (pointer + keyboard, `role="slider"`) — a drag pauses the clock and drives `seekTo` with the dragged t, so the readout, the marker and the rendered frame agree by construction at any point you choose; release resumes from where you let go. On touch devices nothing mounts until the first touch of the track; while the scene warms the axis says "loading the scene…" and the numbers hold rather than move against a still. Under reduced motion, scrubbed frames render (user-driven, not autoplay) but nothing plays by itself. Verified: drag-to-50% reads exactly t 8.250s / beat 3/5 / frame 00247, Shift+arrow steps one frame, and a touch tap mounts, holds honestly, then plays from the tapped t. A transport row — play/pause and ±3s — rides the same t plumbing (verified in Chromium, WebKit and mobile emulation: pause freezes t, skips land at exactly ±3.00s, a transport press on an unmounted hero mounts first), the marker grows on hover to read as a handle, and the axis label says "drag it".

### changed
- **On a phone, tapping a film opens it directly instead of in the lightbox — measured, not assumed.** The same scene reaches `sceneReady` in 5-6s as a top-level document on iOS 26 and takes over 20s inside the lightbox iframe. Safari gives an iframe a far smaller budget; it is the same effect that left an offscreen iframe never becoming ready at all under mobile WebKit. Coarse-pointer taps now open the film, and the badge says "open full size" there instead of "preview". The lightbox stays on desktop, where it is fast and keeps you in the gallery.
- **The hero had grown past the fold.** At 906 characters it pushed the instrument — the thing the page exists to show — off-screen at both phone and desktop widths, needing 1.14-1.26 viewports of scrolling to reach. Trimmed to 411; the instrument now paints on load at both sizes. The cut keeps "there is no input format" and the 見立て line and drops the aspirational passage, which the "where it is" card already carries.
- **The second action was invisible.** "Open in a new tab" was a 13.76px underlined text link below the card while the first action was a badge on it, so the two never read as a pair. It is a bordered button now — "Open Gearbox full size ↗" — in the dark-section style the rest of that section already uses.
- Poster frames carry `decoding="async"`, keeping a 1280x720 JPEG decode off the main thread as a card scrolls in.

- **Fur shells compile as one program instead of L, and the character films start 3-4x sooner.** `addFur` minted a fresh `MeshStandardNodeMaterial` per shell, and TSL bakes JS-computed constants in as shader literals, so eight shells whose graphs differed only in `u` were eight distinct programs to the driver. Instrumented before touching anything — hooking `WebGL2RenderingContext.prototype.shaderSource`/`compileShader` on unmodified scenes — which refuted two hypotheses on the way: program *count* is not the cost (menagerie compiled 28 shaders against materials' 30 and was 12x slower) and neither is CPU setup (~190ms for every film, so the per-vertex JS displacement loop was innocent). What tracks the time is the number of programs containing `mx_fractal_noise_float`, bracketed at **~1-1.6s each**. Dropping the PBR base confirmed it: shader bytes fell 150KB to 110KB and the clock did not move. The shell index now rides `instanceIndex` on a single `InstancedMesh`, displacement moves from the JS loop into the vertex stage, and noise samples the displaced point — sampling the undisplaced one would change the strand pattern. Measured on WebKit at phone size: **menagerie 17.3s to 4.0s, bear-and-bees 18.4s to 6.9s**, noise-carrying programs 17 to 3 in both. Not pixel-identical: 0.89% of pixels differ (mean 0.117, max 157), all in the fur, because L instances resolve coincident alpha-tested shells differently from L meshes under depth test — visually indistinguishable at t=6.0, but recorded as a look change rather than claimed as parity. The `CHARACTER` fence stays byte-identical across its three carriers; smoke green on both backends with the exposure advisory unchanged at 50.7%, and cross-file parity green.
- **The 18-20 second figure is swept everywhere it was written.** It lived in the site's limits card, two `app.js` comments, `delivery.md` and the README — all now 4 to 7 seconds. Measuring a thing and leaving its old number in four files is the exact drift this repo keeps finding in inherited docs; no reason to mint a fresh instance of it the same day.
- **The hero says there is no input format.** The list of accepted inputs read like a whitelist when the point is the opposite: the skill parses nothing, the agent has already read whatever you gave it. The copy now says that outright and illustrates the range — a repo, a spec, a paper, a screenshot, a stack trace, a pasted thread — with 見立て carrying the examples that make the move concrete.

### added
- **Truth has addresses now: `docs/source-of-truth.md`.** The teaching content had been accumulating in code comments, SKILL.md, and the references at once, and every drift this session found was a copy — the same figure stale in four files, a mechanism description outliving its stack. The system is one rule: every fact has exactly one home, chosen by where the next person who could break it will be standing — line-local invariants in the comment on the line, method and measured brackets in the owning reference, routing in SKILL.md — and everything else points, never restates. A number appearing twice is itself the bug. Enforcement: all eight references now carry provenance headers (what each is canonical for, last verified 2026-07-24 against source), `SKILL.md`'s `last_verified` reflects that audit, CLAUDE.md points at the doc, and changes touching code a reference describes get a `doc-claim-auditor` pass before commit.
- **The window contract is shown, not just described.** Section 04 now carries the driver block from `gearbox.html` abridged to its shape — the handful of `window.*` exports that are the entire surface tooling may touch — with a link to the real file; the README points at the same block. Both state how the schema evolves: the names are permanent, and the list grows when a tool needs an export rather than a peek at scene internals (which is verbatim how `FLASHES` and `SHOTS` joined). The section is also named for humans now — nav and header say "How it's constrained", pairing with "How it's directed", and the word contract first appears in the lede that defines it.

### changed
- **The skill now activates on image and video asks.** SKILL.md's description adds "an image or screenshot, an existing video re-staged from scratch" to its input list — without them, "turn this screenshot into an explainer" plausibly never fired the skill. The do-not-use line is unchanged, so the boundary survives: re-staging a video as a new scene is in scope, editing its footage never was.
- **The site says what the input can be, what the look is, and what to expect.** The hero's input list grew from three kinds to the honest range (prompt, document, codebase, image, a video re-staged rather than edited) and its subtitle trades an abstract register list for the concrete case that is 見立て — a 200-page terms of service explained by a figure who keeps falling over. The limits card names the material fact (three.js with no image textures: flat color, node math, GPU noise) and follows with the reframe the films earned: what the look carries is direction, not rendering. The method lede admits what SKILL.md always budgeted — a few look-and-edit rounds are the method — and the example-length card states the real reason the films are short: chosen so every example still opens as live HTML on ordinary devices, with duration itself uncapped by the contract.

### fixed
- **A cold scene open showed nothing while shaders compiled — a blank dark page that read as a broken link, worst on phones where films open as top-level tabs.** Every 3D scene now boots to a title card: the film's name (from `CONFIG.title`), a "compiling shaders — a few seconds on first open" line, and a thin sweep bar. Pure DOM in the shared `HTML` fence, and removed one statement *before* `sceneReady` goes true, so no instrument can ever capture it — the recorder acts only after ready. Landed byte-identically in both 3D templates, all five examples, and the site-only neon variant; smoke green on webgl2 and `WEBGPU=metal`, menagerie's exposure advisory unchanged. Canvas2D scenes deliberately skip it: they boot instantly, and a loading card there would be a lie. This also fixes the from-disk open, which had the same blank. Known and deferred: the card's secondary line is small on phones.
- **Three bugs a code review of the hero's interactive machinery confirmed, all fixed and verified.** Opening the lightbox left the hero rendering behind the overlay (an IntersectionObserver cannot see an overlay) — two live scenes at once; the lightbox now pauses the hero and resumes it on close only if the user hadn't paused. The scrubber's `aria-valuenow` froze at 0 during autoplay — the value-that-did-not-render failure, for assistive tech specifically; `paint()` now updates it, throttled. And an explicit pause was silently overridden by scroll-out/in and focus blur; `wantPlay` is now the single user-intent flag every auto-resume path consults. The same review passed the fur-instancing change clean: shell math verified algebraically identical, fence byte-parity confirmed, no determinism hazards.
- **The hero preview hid the film's captions (`?nocap`), which made beat 2's authored close-up read as a cropping bug.** Measured: the iframe is exactly 16:9 with zero canvas overflow in both engines, and a recorder render at the same t shows identical framing. The defect was the missing words, not the frame; the hero now plays the film with captions on.
- **`film-language.md` told authors a shipped feature doesn't work.** Its Focus section required "a post chain with a `BokehPass`, which the base template does not have" and pointed to `examples/toybot-walk.html` for the wiring — a predecessor filename that has never existed here, describing a mechanism that never migrated to this stack. The template has carried the working chain all along: the always-on `RenderPipeline` gates DoF on `STYLE.dof`, and `shotFocus` feeds its focus uniform every frame. The section now documents that, notes that no shipped example enables `STYLE.dof` yet, and labels the toybot match-cut illustration as inherited (no shipped example uses `match:` either). Same defect class as the dangling paths 0.14.0 and 0.15.0 caught — verbatim-copied references citing a repo that isn't this one.
- **SKILL.md promised a recovery `shoot.js` does not provide.** "Every command that opens a scene embeds automatically via ensureVendor" is true of `build.js` only; direct `shoot.js` runs never embed, by design — the recorder does not rewrite scenes on disk, and its own header says so. The claim is now scoped, and names the failure an unvendored scene actually produces there ("scene never set window.sceneReady").
- **Stale measurements corrected against the current tree.** `build.js`'s vendor-cost comment said ~0.73 MB where the embed is ~1.09 MB (line 71 of the same file had it right); `smoke.js`'s size-gate bracket cited 32/24 KB templates that now measure 40/28/56 KB; SKILL.md's "12s placeholder" is 12.6s for the character template; `characters.md`'s "verified" bear vector had drifted from the one `menagerie.html` ships (`neckLen .85`, `headR .62`) and now matches it and names its source. Past-tense incident records keep their historical 0.77 MB figure — only current-state claims changed.
- **Claims that overstated their own subject, scoped to what the code shows.** `instruments.md` had moved the stall-detector's fired-at-every-boundary false-positive rate onto the known-good film; `build.js` records it was the defective control, with ~10 firings on the good film — restored. Its blank-frame row now admits the check shares determinism's 4-to-6-point plan instead of underselling it. `bibles.md`'s "buildWorlds() reads colors ONLY from STYLE" was falsified by its own committed control pair (gearbox's neutral-hardware hexes never move between bibles); the contract is now about subject colors, with the hardware exception stated. `scene2d.template.html`'s camera comment cited "the 3D template's `KEYS[]`", which does not exist — the 3D rail is `SHOTS[]`; the comment now says what the rail actually is. `SKILL.md`'s fence list grouped `SOLVER` with the universal `KERNEL`; only `KERNEL` is fenced in all three templates.
- CLAUDE.md invariant 4 follows 0.15.0: poster stills, not preview AVIFs, are what `site/posters/` holds once.
- **The hero readout's numbers are now gearbox's own.** The rebuilt hero displayed 512 frames at 31.03 fps — a pair no artifact of this pipeline has ever had; the recorder ships 30 fps, and 16.5s × 30 is 495. The beat readout follows the scene's real accumulated beat boundaries instead of five equal slices (gearbox's beats are unequal, so the split disagreed with what was rendering for stretches of the timeline). And the static fallback claimed t = 13.541s beside a poster whose caption says beat 2 — the still was rendered at t = 7.2 (verified by re-rendering the scene and comparing), so the readout now says 7.2. An instrument about honest readings cannot display numbers nothing produced.
- **`delivery.md`'s showcase description caught up with the showcase, twice over.** It still prescribed the deleted mount/unmount lifecycle and `hardwareConcurrency`/Save-Data capability gate from before 0.15.0; and 0.15.0's own "nothing else moves" stopped being true when the hero began driving a live scene. It now describes what ships: one driven hero scene on capable desktops, stills under reduced-motion and coarse pointers, every other scene on explicit click — zero or one mounted scene by construction.
- **Two gallery chips said things the scenes don't.** Bear & Bees claimed `captions none` while the film renders four; the chip now states the register fact that is true and load-bearing — the 2.6s hush. Materials claimed 3 beats where the site counts title beats everywhere else (gearbox "5", the hero "5"); it has 4.

## 0.15.0

### changed
- **The showcase ships no recordings at all, and the docs follow.** The site had been playing compressed AVIF loops as its default experience while the copy said "not a video" — an incoherence the owner caught. Every AVIF is deleted; the gallery is poster frames with two explicit actions per film (preview in a lightbox, or open the scene in a new tab), and exactly one scene is ever loaded, on demand. `examples/README.md` now embeds `-still.jpg` frames instead of loops, with the reasoning stated: GitHub cannot run a scene, so a frame is the honest thing to show there.
- **`delivery.md` records the reversal rather than dropping it.** The AVIF-versus-WebP measurements stay, because they are real and `build.js avif` still exists for anyone who needs an inline animated preview on GitHub. What changed is the conclusion for a page you control: shipping a recording to explain a thing that is not a recording is not a tradeoff, it is a contradiction. Also corrected two stale predecessor paths that survived the migration — `bibles.md` pointed at `docs/media/*.avif` and `webgpu-stack.md` at `examples/gearbox.avif`, neither of which has ever existed in this repo.

### fixed
- The lightbox's loading state now waits for `sceneReady` with a 90s ceiling, and the format readout is gone along with the preview tier it described.

## 0.14.2

### fixed
- **`method.md` documented a caption/window parity gap that no longer exists.** It claimed captions are fixed CSS px sized against the window, leaving `smoke.js`'s 1920-wide overflow check unrepresentative at other sizes. The template says otherwise: `#cap` is `font: 600 calc(var(--fw)*.015625)` and `--fw` tracks the design frame, so captions are frame-relative. Measured on `gearbox` at three frame widths — 30px at 1920, 10px at 640, 5.69px at 364, every one exactly `0.015625 x frame width`. The claim was inherited from the predecessor, where it was true; frame-relative captions were one of the ten implicit frames the FRAME architecture eliminated, and the template's own comment lists it among the defects that fix closed. The doc never caught up. So the gap is closed, not open, and nobody needs to build a fix for it.
- **The real caption limit, now documented in both references, is legibility.** Scaling with the frame is what makes composition faithful and what makes the text ~5.7px in a phone-sized box and ~10px in a gallery card. No instrument catches it: overflow passes because the text fits, and reading speed passes because it is a timing check. Added to `instruments.md`'s "what it cannot see" column and to its no-instrument list, with the standing answer — below roughly 700px of frame width, ship `?nocap` and let the geometry carry the beat.

## 0.14.1

### fixed
- **The 0.14.0 sampling "correction" was itself wrong, and a code review caught it.** `instruments.md` claimed the determinism and blank-frame checks quantify over three points from `SAMPLE_FRACTIONS = [0.25, 0.5, 0.8]` with merged-interval flash avoidance. The code does something else: `samplePlan(dur, flashes, 4)` is called with an explicit `4` at both call sites (smoke.js:297 and :356 — the `n = 3` default is never used), and the determinism check then appends up to two shot-transition midpoints from `window.SHOTS`, so its real floor is **four points and often six**. `SAMPLE_FRACTIONS` is a separate constant feeding only the **exposure** and **framing-invariance** checks, which multiply it against `DURATION` raw and get **no flash avoidance at all**. Two mechanisms, conflated into one, and shipped as a confident correction of a predecessor doc whose "four" was right. The failure mode is worth naming because it is the one this repo keeps re-learning: the signature was read (`n = 3`) and the call sites were not. `instruments.md` now documents both mechanisms in their own table, including the consequence that exposure and framing invariance CAN be blinded by a white-out where determinism cannot. The false claim is annotated in place in the 0.14.0 entry above rather than deleted, and dropped from `docs/plan.md`.
- **`.playbadge` had no `z-index`, so the hero's "open film" affordance was covered** by a live thumbnail the moment it faded in — `.live-frame` is `z-index:1` and mounts after the badge in DOM order, while the gallery's equivalent `.open` badge was already at 3. Now 3 in both.
- **The hover-zoom cue died for exactly the users who get live thumbnails.** `:hover img{transform:scale()}` targeted the still, but once a scene mounts the iframe paints on top and did not scale, so the card lifted without the zoom. Both hover rules now scale whichever layer is visible, and `.live-frame` carries the matching transform transition (and is added to the reduced-motion transition kill-list).
- Dropped the obsolete `scrolling="no"` attribute from mounted iframes (superseded by CSS `overflow`).

### changed
- Nav "Install" becomes a **GitHub link with an inline mark** — inline SVG, so the page still makes zero external requests. The install commands remain in the CTA block where they belong.
- `site/.gitignore` states the actual rule (`films/*.html` plus a `!films/gearbox-neon.html` negation) instead of enumerating five filenames, so a sixth example needs no edit. CLAUDE.md invariant 4 updated to match — it had also drifted to the pre-move `site/stage-films.sh` path.
- `app.js`: the gearbox bible toggle uses a `BIBLES` lookup rather than three parallel ternaries, matching the `FILMS` map idiom already in the file; the `effectiveType` guard is a direct comparison against a closed enum rather than a regex; and the size comparison in its comment is now a pointer to `references/delivery.md` rather than a third, rounder copy of the same numbers.

## 0.14.0

### added
- **`references/instruments.md` and `references/delivery.md` — two references the tooling has cited since 0.1.0 but never actually shipped.** `smoke.js` told readers "callers should invoke THIS rather than reimplement the check; see `references/instruments.md`", and `build.js` pointed at `references/delivery.md`; both files existed only in the predecessor and were left behind when this skill forked. Every installed user has been following a dangling pointer for the whole life of the plugin. Ported and **audited against this stack rather than copied**, which turned up four stale claims: parity covers **six** fences (`KERNEL`, `SOLVER`, `RIG`, `DRIVER`, `CHARACTER`, `HTML`), not two; the determinism and blank-frame checks quantify over **three** sampled points (`SAMPLE_FRACTIONS = [0.25, 0.5, 0.8]`, interior-only, flash windows avoided against merged intervals), not four **[this claim was wrong — see 0.14.1; the code samples four, and `SAMPLE_FRACTIONS` belongs to two different checks]**; the shipped-frame spread floor and `build.js poster` postdate the original text entirely and are now documented (spread bracketed on this stack at 1.7 half-dead SwiftShader / 161.3 healthy 3D / 120.9 flat 2D); and the cross-machine section now leads with the WebGPU-Metal vs WebGL2 finding, with the predecessor's PSNR 57–58 dB figure explicitly labelled inherited-and-not-re-measured. Both files carry a provenance header saying which measurements were re-verified here and which transfer unchanged. `delivery.md` also gains a rule the predecessor had no reason to state: stills come from `build.js poster` against the scene, never from transcoding an AVIF or WebP.

### fixed
- **A broken table in `references/characters.md`.** The `buildCharacter` row documented `matFor(part)`'s accepted values as a code span containing unescaped pipes, which GFM reads as column delimiters — the row rendered as 7 columns against a 2-column header, breaking the table wherever it was viewed. Pipes escaped.

## 0.13.0

### changed
- **Renamed `screenwright` to `mitate`, and split out of `fb-claude-skills` into its own repo.** The name went on a real collision: `github.com/guidupuy/screenwright` is an actively-maintained npm package *and* Claude Code skill in the same domain (Playwright tests to demo videos). `mitate` (見立て — to see one thing as another, the Japanese aesthetic of representing one thing through another) says what the skill does: see any input as a scene. No behavior changed — templates, references, examples, and the recorder are byte-identical apart from the name and the doc links that moved with them.

  **Layout.** The doubly-nested marketplace shape (`skills/screenwright/skills/screenwright/`) flattened to `plugin/skills/mitate/`, with the marketplace manifest at the repo root. The plugin is fenced under `plugin/` deliberately: `marketplace add` shallow-clones the whole repo, but `plugin install` copies *the plugin subtree* into a per-version cache, so keeping `site/` (the showcase, ~7.5 MB of films and posters) outside that subtree keeps every cached version to what the skill actually needs — the same measured reasoning that moved the preview AVIFs out of the subtree in 0.2.2.

  **Deduplication.** The showcase site's `films/` were byte-identical copies of the skill's `examples/`, and its `posters/` byte-identical to the old repo's `docs/media/`. Both now have one tracked copy: the examples are the source of truth and stage into `site/films/` at deploy; `examples/README.md` embeds the posters the site already serves. `gearbox-neon.html` stays tracked in `site/` — it is a one-line `STYLE = BIBLES.neon` variant that exists for the showcase, not as a skill example.

  **Descriptions.** The "successor to explainer-video" clause came out of both the plugin and SKILL.md descriptions. SKILL.md frontmatter loads into context on every activation, so a sentence describing a plugin that does not exist in this repo is standing cost for nothing; the provenance lives in the README and in this file, which are never context-loaded. explainer-video remains published and frozen in `fb-claude-skills`.

## 0.12.2

### changed

**`metadata.author` removed from SKILL.md frontmatter.** Shipped inside a repo-wide sweep across 16 `fb-claude-skills` plugins, so it never had a standalone entry there — reconstructed here to keep the version line unbroken. The reasoning: the entire SKILL.md, frontmatter included, loads into context when a skill activates, so an author name there is standing context cost with no runtime use. Authorship lives in `plugin.json` and the plugin README, neither of which is context-loaded. `metadata.last_verified` and `review_interval_days` were kept.

## 0.12.1

### changed

**every tracked example now ships its preview set, and the READMEs catch up.** Examples policy clarified (recorded in the plan): owner approval gates what enters `examples/`; once tracked, the preview set is mandatory — an AVIF in repo-level `docs/media/`, embedded in the examples README with a link to the `.html` and a description of what the example showcases. Rendered the three missing previews (menagerie, bear-and-bees, noise-chart — 720px/12fps via the Metal recorder path) and restructured the examples README: every entry now links its HTML, embeds its AVIF, and says what it demonstrates, under a standing callout that the AVIF is to the film what a thumbnail is to a full image — the HTML is the artifact. Also: the plugin README's Status section notes the chart tier, and the repo hub README's explainer-video section now points readers at screenwright as the in-development replacement (frozen predecessor, successor on the node stack, supersedes when verifiably better on the same test cases).

## 0.12.0

### added

**`examples/noise-chart.html`, the first chart-tier scene, plus two plan-level directions.** The chart tier (recorded in the plan) sits below the films: static grids, one primitive per cell, smoke-gated and byte-compared per backend — charts isolate what films integrate, and new shader primitives land chart-first before any showcase or film uses them. The chart: 12s, one locked head-on shot (a chart is a document), eight unlit tiles — a MaterialX baseline row (fbm, worley, scrolling aastep, palette-mapped fbm) and a hash-lattice row (value noise, re-hashed cells, domain-warped fbm) plus the classic `fract(sin(dot))` hash as a deliberate drift CONTROL, structurally identical to the hash-cells cell except for the hash function. Measured: 20/20 smoke green including the control — 15 consecutive `WEBGPU=metal` runs and 5 WebGL2-fallback runs. The honest negative: the 0.11.0 carry-forward metal 1-in-6 determinism FAIL did **not** reproduce under dense noise coverage (no shadows, no characters, one shot), which narrows the suspect space toward the machinery bear-and-bees has and the chart deliberately lacks; the sin-hash control also stayed clean at this sample size, so it stays in place — re-runs are free. Also recorded in the plan: the Phase 4 bake direction gains a **light-bake sibling** (iterative illumination — GI, radiosity, probe solves — baked at build time, playback pure, same red lines against tier drift), including the finding that reflections need no bake at all: SSR, planar reflector, GTAO, and environment lighting are pure functions of scene state, available at runtime today. Cross-directory fence parity green with the new example in the set.

## 0.11.0

### added

**Phase 2 GATE MET: `examples/bear-and-bees.html`, the comedy short.** 21.3s, eight beats, the register's whole point in one ratio: a 2.6s hush (bear frozen nose-under-hive, one scout bee holding his eyeline, a double blink played TO CAMERA) against a 1.1s eruption. The bear is the menagerie quadruped vector scaled ~0.8 with fur; the bees are scene add-ons (closed-form swarm — comet chase via per-bee lagged evaluation of the bear's own travel function, `bearXAt(t-lag)`, so pursuit derives from the pursued). Staging is probe-solved, not eyeballed: the original paw-swipe gag died on measurement (this vector's muzzle projects ~2.9 past the shoulder, the foreleg reaches 2.33 — a paw can never pass the nose), so the gag became a nose boop, solved in ALL THREE axes to a surface graze (normalized ellipsoid distance 1.02 at the latch instant) after the film-reviewer caught the z-axis as a 0.41 miss faked by a lucky camera angle — instance five of the documented contact-bug class. The reviewer's other two HIGHs: the flee launch clipped the hive before the duck opened (duck now opens pre-launch; measured +0.01..+0.24 clearance through the under-run), and the comedy's face never faced the lens (a 3/4 face-turn envelope from spot through hush puts both eyes, the blink and the glance on screen). MEDs: whole-film `energy:'locked'` (steadicam sway moved ~10% of frame through THE pause — silent-comedy tableau grammar instead), hush two-shot re-anchored to the face, the button's cross-meadow blend cut to a hard cut (its motion bar dropped 7.00→2.34, erupt now correctly the film's peak at 7.07). The neck-curl sign convention was bracketed empirically mid-build: +z curl RAISES this rig's head — the probe grid settled it after two theory-first rounds went the wrong way. Verification: smoke green both backends, zero advisories; cross-directory fence parity green with the new example in the set; nocap sheet carries the full gag wordlessly; motion profile shows no dead air. Carry-forwards (recorded in the plan): one unreproduced WEBGPU=metal determinism FAIL (1 in ~6 runs — the bee visibility gate shipped in the same round is hygiene, not the fix), and the missing per-shot camera-energy vocabulary. Also riding: docs/internals/physics_bake_proposal.md — the owner-selected Phase 4 direction (bake-time simulation, runtime determinism intact) with red lines, eval criteria, and spike list; Phase 4 now precedes Phase 3.

## 0.10.0

### changed

**simplify pass over the 0.6.0–0.9.1 range: five findings applied, headlined by a sixth parity fence.** The structural one: the page scaffold (overlay CSS + caption/title/vig/flash DOM, lines 1–46 of every 3D scene) had reached FIVE byte-identical unfenced copies — the exact "at a third consumer, extract or marker-fence it" trigger the SOLVER fence's own comment memorializes, fired and unacted again. It is now the `HTML` fence: HTML-comment markers (the block lives outside `<script>`, so the JS-comment marker form cannot fence it), a second regex arm in smoke's parametrized parity loop, verified byte-identical across all five carriers and green on the cross-directory run. This block carries the `will-change` compositor-layer hint — determinism-relevant, previously mirrored only by discipline. The rest: `build.js`'s `REVIEW_EXT` restored to a derivation of `REVIEW_FMT` (it had been snapped to a literal `'jpg'` under a comment still claiming the derivation — changing `REVIEW_FMT` would have silently broken every sheet/strip/poster ffmpeg path); dead `chestX`/`chestY` dropped from `buildCharacter`'s return in both `CHARACTER` carriers (never read anywhere; the rig API now matches characters.md's documented field list); menagerie's 36-line CINEMATOGRAPHY doc block trimmed to the 4-line pointer gearbox and materials already use; characters.md's "Not here yet" closing no longer contradicts the fur/fabric section 40 lines above it (fur and fabric shipped in 0.8.0). Efficiency angle reviewed clean — no findings. Verification: smoke green for all five 3D scenes on webgl2 and both character carriers on webgpu; cross-directory fence parity green with the new fence in the loop.

## 0.9.1

### fixed

**six findings from a five-agent code review of the 0.6.0–0.9.0 range, fixed and re-verified.** The one that mattered most: shoot.js's refusal of `WEBGPU=swiftshader` went dead in the 0.6.0 backend.js extraction — the shared `angleArgs()` gates the throw behind `refuseSwiftshaderShip`, defaulting false, and shoot.js called it bare, so the documented recorder/gate asymmetry existed only in comments (reproduced: no throw; the exact "600 flat frames with exit 0" class the guard was measured against). Fixed at the call site; the refusal now throws and smoke's probe path is unchanged. Two menagerie review fixes had never been backported to the template they came from: the demo subject aimed at the root instead of `rootX + rig.centerX` (the FS cropped the walker's feet — verified on before/after contact sheets, the documented wall-of-rump class), and the settle breath was still `backOut(ramp)-1`, holding the walker 4% squashed from frame 0 (menagerie's pulse idiom applied). In the `CHARACTER` fence (both carriers, cross-directory parity re-run green): `solveLimb`'s clamp floor was an absolute `.2`, which INVERTS the clamp for rigs with total reach under `.21` and poses the limb beyond its own length every frame — floor is now `min(.2, reach-.02)`, byte-identical at every shipped scale (menagerie legs are all reach > 1.9) and load-bearing for the insect-scale rigs bear-and-bees needs. Docs: webgpu-stack.md claimed `MeshToonNodeMaterial` is "exercised by the material packs" when materials.html deliberately avoids it (banding is authored in the node graph on `MeshBasicNodeMaterial`) — reverted to available-but-unused; film-language.md still said `CONFIG.energy` after 0.6.0 single-homed energy in STYLE. Dispositioned, not fixed (recorded in the plan): character colors are hex literals in `buildCharacter` calls rather than STYLE keys — the bibles.md rule bites when the first character bible pair arrives, and the palette moves into STYLE then. Verification: smoke green on both backends (webgl2 + webgpu confirmed) for the character template and menagerie in a scratch workspace; cross-directory fence parity green; the swiftshader refusal demonstrated throwing; before/after sheets read frame by frame.

## 0.9.0

### added

**Phase 2 step 3: `examples/menagerie.html`, the character-scaffold gate demonstration.** A furred bear (lateral-sequence quadruped), a fabric-shirted human (biped), and a text-invented three-eyed whip-tailed strider — three proportion vectors through ONE `buildCharacter`, walking in on staggered gaits, all turning to the viewer, settling as a group. Gate criteria measured: squint-distinct silhouettes (the squint strip separates all three at 90px), planted feet (strip-checked for each), byte-determinism on both backends, cross-directory fence parity green (all five fences, templates + examples). Independently reviewed by the film-reviewer agent, which caught the round of defects author-eyes missed — the look beat happened entirely off-frame (heads yawed ~26° where the camera needed ~75°, and the shot framed one character while the other two turned off-screen), the film's only closeup was 70% void, the tail-wag idle blend spiked the wag rate ~5x for a few frames (phase blended through a t-scaled gate instead of crossfading amplitudes), a one-shot "breath" held every character 3-5% squashed from frame 0, and a bare floor made an 11-unit walk read as a treadmill. All fixed and re-verified; the nocap pass now carries the look beat on geometry alone. One kit addition fell out: `rig.centerX` (visual center relative to the root) — aiming a subject at a quadruped's root orbits its tail end and crops the head, measured as an FS rendering a wall of rump. Per owner policy (recorded in the plan): the HTML is the shipped artifact — no AVIF/MP4 is rendered by default; finalized scene HTMLs are also copied to a gitignored local directory for viewing.

## 0.8.0

### added

**Phase 2 step 2: the fur and fabric packs.** Fur is kit code in the `CHARACTER` fence: `addFur(mesh, opts)` grows shell layers as children of the mesh (riding every IK transform) — the same geometry displaced along its own normals per layer, TSL fractal-noise coverage thinning toward the tips and darkening toward the roots, discarded via `alphaTestNode` so fur stays on the OPAQUE pipeline and never joins the sortObjects transparency-ordering bill; shells cast no shadows. `furCharacter(rig, parts, opts)` furs whole parts, identified by their shared per-part material instance so scene add-ons (eyes, props) are never furred by accident. Verified byte-deterministic on both backends on the quadruped vector. Fabric is a `matFor` recipe, not code: `MeshPhysicalNodeMaterial` + `sheenNode`/`sheenRoughnessNode`/`sheenColorNode`, verified rendering on r185 (the sheen rim visibly brightens grazing angles on a roughness-.9 base) — node slots again, with the plain `sheen` property presumed unreliable the way `transmission` measurably is. Both documented in `references/characters.md` with a cross-reference from `materials.md`. Phase 2 remaining: the three gate films (bear-and-bees, human, text-invented creature).

## 0.7.0

### added

**Phase 2 step 1: the character scaffold.** New `templates/scene.character.template.html`: the 3D template plus a parity-fenced `CHARACTER` block (the fifth fence, registered in smoke) holding the scaffold kit — ONE parametric skeleton family where a character is a point in proportion space (`propDefaults` overrides) plus a material choice (`matFor(part)` is the seam where shading packs will plug in). The kit: lathed-profile torso + capsule shells generated from the proportion vector at load (pure code, zero assets), analytic two-bone IK ported from the predecessor's proven walker (generalized with a bend direction: knee-forward hind legs, elbow-back forelegs), the plant-grid gait generalized to any planted-limb set (biped `0/.5`; quadruped lateral-sequence `0/.25/.5/.75`, each limb's plant column riding its own attach x), and closed-form chain helpers (`chainCurl`, `chainWave`) for neck/tail — the "IK extends to spine/tail" half of the plan, done analytically. Loud build-time reach checks (match-cut-constraint spirit) replace silent hyperextension. New `references/characters.md` documents the vector, gait, conventions, and a QUADRUPED vector verified building and walking, not just the biped demo. The template demo walks a tailed biped through title/walk/look/settle and grew the face-features-as-scene-add-ons pattern (eyes riding `rig.head` — which also fixed front/back ambiguity: a bare sphere head made front shots read as back shots).

Template-authoring findings measured on the way, kept as comments: near-equal overlapping shell radii z-fight into jagged seams (hence ONE lathed torso profile); `shoulderW` must clear the torso silhouette or hanging arms embed in it; framing estimates must respect torso/neck tilt or the camera frames empty air above a quadruped; solver angle 0 is the PROFILE (0 = from +Z), a misread that cost two probe rounds. Verified: smoke green on both backends (webgl2 + webgpu confirmed), CHARACTER fence parity-checked, contact sheet and mid-walk strip read frame by frame — planted feet hold their ground position across cells. Gate work remaining in Phase 2: fur-shell/fabric packs, then `bear-and-bees` + human + text-invented creature from the one scaffold, squint-distinct, strip-checked.

## 0.6.0

### changed

**the deferred quality pass: a four-angle simplify review (reuse, simplification, efficiency, altitude) over the whole founding range, ~30 findings deduped and applied, verified look-neutral.** The structural fixes:

1. **New `templates/backend.js`, shared by shoot.js and smoke.js** — Chromium resolution, the WEBGPU/ANGLE flag policy, the settle idiom, and the aspect-shape table now have ONE copy each. The duplication was already biting: smoke's inline flag builder had lost the `ANGLE_BACKEND` allow-list (a typo the recorder rejects loudly sailed through the gate), and the arm64 Chromium fix had to be hand-applied to four copies earlier the same day. The one deliberate asymmetry survives as a parameter: shoot.js refuses `WEBGPU=swiftshader` for shoots; smoke may probe it.
2. **Two new parity fences, `RIG` and `DRIVER`, in every 3D scene** (renderer/post/mesh-helpers and overlay/contract/boot — both regions verified byte-identical across the three 3D scenes before fencing). Between them they cover all three LOAD-BEARING determinism guards (sortObjects, frustumCulled, the nodeFrame tick), which until now were byte-identical only by discipline, invisible to the parity check. The check itself is one parametrized loop over fence names (was two hand-copies), reads each file once, and was run cross-directory (templates + examples): green.
3. **Contract over internals:** caption fade is now exported (`window.CAPFADE`) and smoke reads the contract instead of probing `CONFIG` against a mirrored default; flashes are resolved ONCE per scene and both the renderer and `window.FLASHES` consume the same list (the resolution was written twice per file and could drift).
4. **`energy` has one home: STYLE** (per bibles v2). The solver's `STYLE.energy||CONFIG.energy` chain and the dead `CONFIG.energy` knobs (shadowed by every bible) are gone; template prose now matches bibles.md on where the look lives.
5. **Wasted work removed:** smoke builds the three vendor bundle once per run instead of once per template scene (`VENDOR_CACHE`, ~1-2s per extra scene); `build.js motion` no longer launches a second browser just to read `window.BEATS` (the shoot now writes the beats manifest as a side product, ~3-6s saved per run); `loop`/`avif` shoot JPEG q92 intermediates instead of PNG masters for their q60/720px lossy deliverables (capture measured 164-190 ms/frame PNG vs 29 ms JPEG); smoke's framing check resizes 3 times instead of 9; the shipped-frame spread PNG travels as an evaluate argument instead of a megabyte JS source literal; `avif`/`loop` scaffolding collapsed into one `inlineExport`; the 2D template resolves accent inks at load and shares one polyline measurement between `drawOn`/`alongPath`.
6. **Cleanups:** argument-less `build.js vendor` (built the full bundle and discarded it) is gone along with the SKILL.md caveat explaining it; the CLI destructure names no longer lie (`arg1/arg2/arg3`, meaning named per dispatch line); dead `thicknessScaleNode = 14` assignment and the write-then-overwrite dance removed from materials.html; both examples drop the template's "replace this placeholder" banner and 35-line SHOTS tutorial in favor of pointers; webgpu-stack.md no longer claims the pack materials are "not yet exercised"; film-language.md cites this plugin's own example instead of the frozen skill's; the 2D template carries a provenance note (forked from frozen explainer-video; bugfixes must be mirrored by hand). READMEs now state explicitly that **WebGPU is not required** (WebGL2 fallback is the default path; `WEBGPU=metal` is an opt-in speedup), and the plugin README's status caught up to Phase 1 complete.

Deliberately NOT taken (measured machinery): merging seekTo+settle into one evaluate, deduping the three stringified luma readers (the shipped-frame bracket was measured against the current implementation), caching `warp()`'s sort. Verification: smoke green on both backends for both templates AND both examples (`webgl2` and `webgpu` confirmed per run); the swiftshader flat-frame FAIL re-demonstrated after the flag-plumbing change (exit 1); cross-directory fence parity green; `motion`/`loop`/`vendor` exercised; and pre-edit vs post-edit gearbox frames byte-identical at two timestamps — the pass provably changed no pixels.

## 0.5.1

### fixed

**eleven findings from a five-agent code review of the day's diff, all fixed and re-verified.** The three that mattered most: `build.js aspect` threw a `ReferenceError` on an undefined `stripText` in BOTH skills (confirmed by running it — the command had never been exercised on either fork since the nocap feature landed; fixed in both, and explainer-video's fix is bugfix-scoped under its freeze along with the arm64 Chromium-resolution backport its shoot/smoke needed); smoke.js's inline WEBGPU flag builder lacked shoot.js's allow-list and conflict rejection, so a typo like `WEBGPU=meta` silently fell through to the SwiftShader branch — the gate would have checked the exact backend the shipped-frame check exists to catch (now throws); and the `nodeFrame` determinism guard's "smoke fails loudly" comment was false for the `_nodes`-removed path — the `if` silently no-opped; it now emits a console warning, which smoke's zero-warnings rule converts to a hard failure. Plus: smoke now samples inside shot-transition windows (scenes export `window.SHOTS` cut windows; review verified no fixed-fraction sample ever landed in any blend window on a shipped film), worker-parallel shoots verify all pages resolved the SAME backend before splicing frames (and the byte-identity comment now says it was measured on the WebGL2-everywhere path only), the SIZES comment gained its missing `FSA`, a stale carried-over example path in a smoke comment was reworded, SKILL.md no longer cites a path outside the plugin subtree (the rule this very diff established), the root README's install and invocation lists gained screenwright, and explainer-video's README got its last-updated bump. Examples regenerated on the fixed template; smoke green everywhere; three review findings scored out as non-manifesting (playwright's exit reaper covers the browser-cleanup pair; the classic stack honors preserveDrawingBuffer, mooting the framing-check backport).

## 0.5.0

### added

**Phase 1 step 6: style bibles v2. PHASE 1 COMPLETE.** A bible is the STYLE object itself — the solver and template already consume `exposure`/`bloom`/`dof`/`lens`/`cutDur`/`energy`, so the v2 mechanism landed with zero new machinery; palette keys are the scene's contract with the bible (a hex literal in a material is a look decision hiding from the switch). `examples/gearbox.html` now ships the committed control pair: `workshop` (lit machine-shop, steel and brass, steadicam) vs `neon` (dark stage, machines as silhouettes, the light as subject — bloomed markers, glowing trails, locked long lens, slow blends), one line apart, verified categorically different and byte-deterministic on both backends. New `references/bibles.md` carries the shape and register rules; `docs/media/gearbox-neon.avif` is the second preview. Phase 1 gate met: regression comparison (0.2.x), material packs (0.4.0), control pair (0.5.0). Carried forward: full bloom bracket, template-palette exposure pass, `WEBGPU=vulkan` verification, upstream sortObjects repro filing.

## 0.4.0

### added

**Phase 1 step 4: the material packs (cel, subsurface, glass), with step 5's first bloom measurements.** New `references/materials.md` carries three recipes, all verified byte-deterministic on both backends in the shipped showcase (`examples/materials.html`, preview in `docs/media/`), and two r185 traps found the hard way:

1. **The plain `transmission` material property never engages** — the value stores correctly but renders fully diffuse on both backends; the `transmissionNode` slot works. Recipe rule: node slots are the reliable interface, and any physically-featured property is suspect until seen rendering. (Found because the glass beat rendered as opaque balloons; isolated by an in-page property-vs-node A/B against a bright wall.)
2. **Chang-style SSS has no thickness input** — a constant `thicknessColorNode` glows the whole mesh uniformly (measured: a lightbomb at backlight 26, clipping at 4.5, right at 2.2). The recipe models thin-vs-thick as two materials: strong scattering on ears, subtle on the body.

Cel is TSL-native — three tones by quantized key-light lambert in `colorNode` on an unlit material, so ambient light *cannot* wash the bands (the old stack's hemisphere-washes-toon failure, solved structurally rather than by light budgeting). The glass beat pays the sortObjects bill on purpose: emissive core, glow disc, far orb, near orb created farther-first composite correctly under unsorted drawing, per the plan's ordering-discipline requirement. Bloom: first honest observations recorded (monotone threshold, no cliff at 1.0 — appears pre-tone-map; emissives behind transmission barely feed it; palette-conditional as ever) — a rule waits for a film that leans on bloom.

## 0.3.0

### added

**Phase 1 step 3: the post pipeline is always on.** Every 3D scene now renders through `RenderPipeline`, pass-through by default — the look is unchanged (identical exposure statistics to direct rendering), but smoke's determinism and shipped-frame checks exercise the post path on every scene, closing the last "present in the bundle, exercised nowhere" gap. Effects are `STYLE` flags, both verified byte-deterministic on both backends and visually confirmed: `STYLE.bloom` (TSL bloom — thresholds deliberately unmeasured until the pack work brackets them; the old `UnrealBloomPass` numbers do not transfer) and `STYLE.dof`, whose focus distance rides the cinematography solver's `shotFocus` through a uniform — the `SHOTS[]` `focus` property is functional for the first time on this stack (the doc audit had flagged it inert), so two adjacent shots differing only in focus, joined by `cut:'blend'`, are a rack focus. gearbox regenerated on the post-path template and re-shipped (example + docs/media recording).

## 0.2.2

### changed

**rendered previews move out of the plugin subtree.** Decided on measured install mechanics (an opus agent verified both steps on a live install): `marketplace add` shallow-clones the whole repo either way, but `plugin install` copies the plugin subtree into a per-version cache — so binary previews in the plugin dir get duplicated per retained version while contributing nothing to the skill (Claude never reads an AVIF; only the HTML baselines teach, and `examples/` never auto-loads into context per the Agent Skills spec). `gearbox.avif` now lives in repo-level `docs/media/`, embedded by the new `examples/README.md` via cross-tree relative path (GitHub resolves it; no release-asset uploads needed). New standing rule, recorded in the plan: **SKILL.md never cites paths outside the plugin subtree** — the install cache lacks `docs/`, so such pointers would dangle for every installed user. Teaching HTML files stay in-plugin and bundled: self-containment is doctrinal, and there is no way to avoid embedding three without reopening the shipped-broken-example class.

## 0.2.1

### changed

**four subagent reports folded in: two review passes fixed, two investigations closed.**

The independent film review found what the author's own review missed, with measured evidence: the mesh-beat highlight ring was parked 0.17 world units off the interlock midpoint (~45% of its radius framing blank face); the ratio beat's trails swept EQUAL arcs while caption and in-source comment promised 3:1 (the comment described code that did not exist); and the HTML loop seam was a naked triple discontinuity (camera FSA→WS jump + both markers mid-arc). All fixed in the example: ring centered on the measured interlock midpoint with a pulsed fill light (the meshing teeth sat in the key's shadow), trails rewritten as a TIME HISTORY (dot i sits where the marker was at t−(i+1)·DT, so arc lengths show the true 3:1 sweep), a motor block with a breathing lamp gives "input" actual geometry, and the loop is now seamless BY CONSTRUCTION — `SPIN = 12π/TOTAL` puts both gears at whole revolutions per film and the final shot matches the opening shot. Two LOW findings (marker passes near the caption zone; title mass sits left) accepted as register choices.

The minimal-repro agent CONFIRMED the sortObjects defect outside the pipeline (3 meshes, no shadows, both backends; 39/40 wrong with sorting, 40/40 clean without; stale object's shadow correct while its beauty pass lags) and refined the story: the trigger is a REVISITED state after a depth-order change — object motion suffices, camera cuts are just the common case — and it is 100% deterministic on revisit; the "~12% flaky" was sampling structure. Rule #5 and the template comment now state the confirmed mechanism. New caution recorded: a one-time WebGPU first-render warmup difference exists even with sorting off; the boot's pre-`sceneReady` render absorbs it.

The framing-delta agent MEASURED AWAY the "~3% zoom" between stacks: at equal viewport, rendered geometry is sub-pixel identical (±0.7 px / 14 silhouette probes) across all three renderer configurations — the original A/B had a ~33 px effective-viewport mismatch. The SIZES ladder calibration is safe; the real cross-stack difference is tone/shading (~9% of pixels), which the eye reads as zoom.

The doc audit caught three drifts, all fixed: SKILL.md's scaffold step invoked argument-less `build.js vendor` (builds and discards — inert; now names the scene), the shared-contract paragraph claimed `SHOTS[]` and `window.BACKEND` for the 2D template (scoped to 3D), and webgpu-stack.md named a nonexistent `mx_perlin_noise_float` (the export is `mx_noise_float`). Plus: smoke now prints which backend each scene verified (`ok scene.html [source, webgl2]`), making `window.BACKEND` consumed rather than decorative.

## 0.2.0

### added

**Phase 1 steps 1–2: the sampling helper and the `gearbox` regression film.** The film shipped as the skill's first example (`examples/gearbox.html` + `.avif`), built from ONE scene body injected into both screenwright's and frozen explainer-video's templates and judged side-by-side: composition and read match cell for cell, both stacks smoke-green. It also did exactly what running the regression FIRST was for — it caught the biggest node-stack defect so far:

**With `renderer.sortObjects` on, a camera cut corrupts per-object uniform state.** The depth sort reorders the draw list and objects render at a *previous seek's* pose — sticky across re-renders, immune to settle time (0.5s changed nothing), on both backends, ~12% of determinism checks on a 25-mesh multi-shot scene. The proven template never hit it (4 meshes, stable order). Isolated by ascending bisection after seven descending bisects each refuted a suspect (settle length, frustum culling, transparency, nesting, the internal animation loop, fog, rim light): the same world under one static shot was clean, multiple shots broke it, `sortObjects=false` fixed it 16/16. Now a template default and determinism rule #5; per-mesh `frustumCulled=false` (a smaller cousin, measured separately) is rule #6. Consequence documented: overlapping transparent objects must be created farther-first.

Also: `sampleAt()` in smoke.js — THE one way to read scene pixels in-page (render + read in a single task), with the framing and exposure checks refactored onto it; a scene-rig lesson from the twin comparison (`key.shadow.normalBias = .035` kills extruded-face shadow acne in both stacks); and one parked honest residual — a ~3% constant framing delta between the stacks at identical `t`, visible only in direct A/B, unexplained.

## 0.1.0

### added

**a new plugin: the explainer-video successor on the three.js node stack.** Phase 0 (foundation) of `docs/internals/screenwright_plan.md`: the templates, recorder, and instruments ported from explainer-video to `WebGPURenderer` (transparent WebGL2 fallback) + TSL node materials, gated green on both backends. `explainer-video` is now frozen — published, bugfix-only — per the plan's founding decisions.

Phase 0 shipped four measured findings, each now encoded in the tools rather than in prose:

1. **Shadow maps update at most once per `nodeFrame.frameId`, and `render()` never advances it** — only the renderer's internal rAF loop does. Two `seekTo` calls in one browser tick left the second rendering with the first's shadow map: a flaky byte-determinism failure whose pixel diff was confined to shadowed regions. `seekTo` now ticks `renderer._nodes.nodeFrame.update()` before rendering (private API, pinned at `three@0.185.1`; smoke fails loudly on rename).
2. **The compositor can present a frame late** relative to the queued render, so the recorder settles one double-rAF between seek and screenshot — without it, screenshot hashes flaked over byte-identical canvas content.
3. **A half-dead WebGPU adapter ships the flat clear color with exit 0** — deterministic, caption crisp on top, four existing checks green. New hard check in `smoke.js`: a caption-stripped cold page must ship frames that change across sampled `t` and whose richest frame clears a measured luma-spread floor (broken 1.7 / healthy 3D 161.3 / flat 2D register 120.9; floor 12). Demonstrated firing on the real failure (playwright headless-shell + `WEBGPU=swiftshader`), not assumed. `shoot.js` refuses that adapter outright without `WEBGPU_UNSAFE_SHIP=1`.
4. **The Chromium cache scan matched nothing on Apple Silicon** (missing `-arm64` layouts) and silently fell through to system Chrome — an auto-updating build that disagreed with playwright's pinned one about WebGPU, which is how finding 3 hid. Both tools now scan both layouts.

Also: `WEBGPU=off|auto|metal|vulkan|swiftshader` recorder policy with conflict rejection (the wrong flag combination is how the silent black-frame configuration happens); `compileAsync` pre-warm before `sceneReady`; `window.BACKEND` export; the demo scene's material is a TSL MaterialX node graph driven by the sanctioned `uTime` uniform, proving the pattern under byte-determinism. New reference `references/webgpu-stack.md` carries the backend policy, the four node-stack determinism rules, and every measured bracket.
