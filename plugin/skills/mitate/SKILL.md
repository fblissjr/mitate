---
name: mitate
description: >
  Create deterministic animated films of any register — a game cutscene, a
  character short, a meme — as a self-contained looping HTML page
  (exportable to MP4/AVIF/WebP). Use when asked to "make a video / animation
  / cutscene / walkthrough / explainer / simulation / movie / animated meme"
  of anything: a mechanism, a story beat, a system, a joke, a document, an
  image or screenshot, an existing video re-staged from scratch. mitate
  (見立て) is to see one thing as another — here, seeing any input as a scene.
  What that costs, known before invoking rather than after: films are SILENT
  (no narration, no audio; MP4 is merely a container that could carry one)
  and NOT INTERACTIVE (it plays; no clicks, chapters, quizzes or branching),
  and every input is RE-AUTHORED as procedural geometry — there is no import
  path for an image, document, video or any asset, which is literally what
  "re-staged from scratch" means. Do NOT use for editing existing video
  files, screen recordings, or slide decks.
---

# mitate

**What it makes:** one self-contained HTML file that plays an animated scene in
any browser, and renders frame-exact to MP4, AVIF or WebP. No player, no build
step, no assets — the geometry is drawn live from code on every frame.

**What it cannot do**, so you do not promise it: films are **silent**, and every
input is **re-authored as procedural geometry** — there is no import path for an
image, a video, a logo or any asset. It will not edit an existing video, a screen
recording or a slide deck. It is stylised by construction and cannot be photoreal.

**Duration is free, and there is no ceiling.** Five minutes, twenty, five hours —
a film lasts exactly as long as the beats written for it. A frame at `t=18000`
costs precisely what a frame at `t=1` costs: `buildWorlds()` runs once at boot and
`animate(t)` *restates* transforms rather than accumulating them, so nothing grows
with length. **The HTML file is the same size for a five-hour film as for a
twelve-second one**, because the duration is a number in `BEATS`. That is the
opposite of how video behaves, and it is the point.

60s across 31 beats has been built. Films built with this skill have mostly
run 12–40s because they were demonstrations — **never quote a film's length
as a limit.**

What does scale is narrower than it sounds: *recording* time is linear in frames,
and authoring and review effort grow with the number of beats, so budget review
passes per **setup** rather than per film. The artifact, the memory and the
per-frame cost do not move.

**The one rule everything rests on:** the film is a pure function of `t`. No
state across frames, no `Math.random()` at runtime, no wall-clock.

**`t` is a position, not a clock.** It is an address you evaluate, not a cursor
you advance — nothing ever asks "what time is it", only "what does the scene look
like at this address". Any `t`, in any order, as many times as you like, always
the same pixels. That is what lets the recorder shoot frames out of order, a
check seek away and back to compare, and a viewer scrub backwards. The same
distinction position encodings make in a transformer: a token's position is an
index into a structure, not elapsed time, and treating it as elapsed time is what
breaks under editing.

The consequence you feel while authoring: **address by beat, never by raw
seconds.** `ramp(t,'amble',.1,.9)`, not `ramp(t,3.2,4.1)`. Retime the beat and
every expression anchored to it follows; hardcode a second and it silently
desynchronises. `references/glossary.md` defines the vocabulary.

The register — explainer, cutscene, meme, character short — changes the geometry,
the pacing and the caption voice. It never changes the contract or the method.

**Read `references/method.md` before building.** It is the only reference that is
a prerequisite rather than a lookup; the rest are cited below at the step that
needs them.

## Workflow

### 1. Spec, before any code

Topic, audience, duration, `FRAME` (aspect + px — vertical and square are one
edit), register, style, subtitles on/off, and the **beats table**: named beats
with durations that accumulate. Nothing downstream holds a timestamp, so
retiming a beat is a one-line edit. Every beat needs geometry, not just a
caption. Vary durations. Budget the content window, not the beat.

Choosing the look is a spec decision, not a later one — read
`references/bibles.md` now. A style bible is the whole look as ONE object
switched by one line; reaching for a loose palette constant instead is how a film
ends up unable to swap bibles.

### 2. Scaffold

| template | use when | needs `vendor` |
|---|---|---|
| `scene.template.html` | 3D, no figures | yes |
| `scene.character.template.html` | 3D **with figures** — adds the character kit (`references/characters.md`) | yes |
| `scene2d.template.html` | flat vector, Canvas2D | no, born self-contained |

```bash
T=scene.template.html   # or scene.character.template.html / scene2d.template.html — pick from the table above
cp -R "${CLAUDE_SKILL_DIR}"/templates/{$T,shoot.js,build.js,smoke.js,backend.js,fences} .
mv "$T" <name>.html
echo '{"name":"scene","private":true}' > package.json
bun add three@0.185.1 playwright-core@1.61.1
bun run build.js vendor <name>.html   # skip for scene2d — born self-contained
```

**The `package.json` line is load-bearing, not tidiness.** Without a manifest in
the scene directory `bun add` walks UP the tree and installs into the first one
it finds — outside your workspace, in someone else's project or a home
directory — and says `installed three@0.185.1` either way, so nothing in the
output tells you it went elsewhere. You find out later, when `node_modules/` is
not where you are.

`fences/` is the canonical fence store and travels with the tools: `smoke.js`
refuses to run without it rather than silently checking zero fences, and
`build.js check` executes it to get the kit's own beat and solver semantics
rather than mirroring them.

`vendor` embeds three into the scene. Every `build.js` command re-embeds
automatically, so skipping it is recoverable there — but a direct `shoot.js` run
is not, and fails with *"scene never set window.sceneReady"*.

All three templates run as-is and carry the same contract and deterministic kit
(`ramp`, `pulse`, `latch`, `warp`, the seeded `R[]` pool). **Do not rename any
`window.*` export.** `smoke.js` hard-asserts four — `seekTo`, `DURATION`,
`stopPlayback`, `sceneReady` — and reads the rest behind fallbacks, so renaming
one of those degrades checks instead of failing them. `references/glossary.md`
defines the tiering.

### 3. Author the film

Replace the marked sections: `buildWorlds()` for geometry, `animate(t)` for
per-beat motion with every property a function of `t`, and in 3D scenes
`SUBJECTS` and `SHOTS` — where the camera is authored, and where the `h`/`w`
declarations that decide every crop are easiest to get wrong. Left at their
placeholders, the camera frames the template's demo, not your film.

- `references/film-language.md` before authoring `SUBJECTS`/`SHOTS` — sizes,
  cuts, the match constraint, focus, camera energy.
- `references/materials.md` before any surface beyond flat colour — the toon,
  subsurface and glass packs, and what does and does not bloom.

```bash
bun run build.js check <name>.html    # the tables against each other — no browser, no frames
```

Run it the moment `BEATS`, `SUBJECTS` and `SHOTS` exist, and after every edit to
them. It resolves every name a shot uses, checks each anchor lands inside its own
beat, and reads captions at the same limit `smoke.js` uses — all from the source
text, so it costs no render and works on a scene too broken to load. A typo in a
subject name otherwise throws only on a frame where that shot is live, which
means a viewer finds it. `references/breakdown.md` is the table-by-table
specification; `references/instruments.md` says what `check` cannot see, and the
headline is that it never compares a declared `h`/`w`/`d` against the geometry —
that is `probe`, below.

### 4. Review, on three axes

```bash
bun run build.js sheet <name>.html                # one frame per beat
bun run build.js sheet <name>.html 480 0.6 nocap  # semantics pass — writes <name>.nocap.sheet.jpg, NOT <name>.sheet.jpg
bun run build.js strip <name>.html <t0> <t1>      # consecutive frames — continuity
bun run build.js aspect <name>.html 8.5           # one moment, four window shapes
bun run build.js probe <name>.html "beatAt('hit',.5)" 'sep(a, b)'
bun run build.js probe <name>.html 4 'shape(bear)'   # what IS this thing?
```

**Delegate this to the `film-reviewer` agent** (ships beside this skill; it runs
the instruments, reads the images, and reports on all three axes with evidence)
**— or run the instruments yourself and read every image.** Both paths are
legitimate: the first cold-start build reviewed inline and caught real defects
pre-delivery. What is not legitimate is skipping the images — the delegation
exists to guarantee the review happens with fresh eyes, not to gatekeep it.

**Read the generated images with the Read tool — a filename is not a review.**
Composition fails within a frame; continuity fails between frames; semantics
fails when every frame is fine and the film explains nothing. Budget 3-4 rounds
for composition; the other two axes need their own passes.

**Never judge a contact from an image.** Two things that must touch and do not is
the most repeated defect in this project's history, and a camera angle fakes it
routinely. `probe` reports the gap on all three axes, negative meaning overlap;
one recorded miss had an x-overlap of -1.66 and a y-overlap of 0.01 and arced
cleanly over its target. `shape(x)` answers "what is this" when a name's
structure is not obvious — a rig's limbs are keyed `HL/HR/FL/FR`, not indexed —
and a failed expression tells you which `shape()` call to run next. `references/instruments.md` owns what a green check can
and cannot see — the question to ask before trusting one.

### 5. Smoke-test the contract

```bash
bun run smoke.js                     # all scenes in the directory
```

Checks that each scene loads clean, exposes the contract, is byte-deterministic
at the same `t` **and across a reload**, actually plays without `?record=1`,
ships a non-empty frame, and that fenced blocks byte-match the canonical fence
store (`templates/fences/`, beside `smoke.js`) — one scene is a real comparison,
because the store is always the other side.
Run it before any full shoot. `--parity-only` is the no-browser subset.

### 6. Deliver — the HTML file IS the deliverable

The scene is what you hand over. It opens in any browser, needs no player and no
build step, runs at any resolution, and is smaller over the wire than a
mid-quality recording of itself. Nothing further is required.

```bash
bun run build.js bundle <name>.html        # assert self-contained; that is the artifact
```

One caveat about where it can live: github.com strips `<script>`, so the scene is
inert *there*. GitHub Pages, a static host, or a published Artifact all run it.

### 7. Export, only if the destination cannot run a page

A README, a chat, a slide. Then you are shipping a recording of the film rather
than the film, and the format is a spec-time decision:

```bash
bun run build.js poster <name>.html 7.2    # .jpg still — always cheap, always works
bun run build.js avif   <name>.html 12 720 # small file, decode-heavy at playback
bun run build.js loop   <name>.html 12 720 # .webp — decodes cheaply, larger file
bun run build.js all    <name>.html        # .mp4 — the only container that could carry audio
```

WebP costs per pixel changed, so it constrains the camera — set `CONFIG.sway = 0`
before shooting one. Whatever ships, every recording derives from the one scene
file.
`references/recordings.md` owns the format tradeoffs; `references/delivery.md`
owns the case where you ship no recording at all, which is most of them.

`all` (and `frames`) leave their intermediate PNGs in `frames/` — deliberately,
so the encode can be redone or a frame inspected without a reshoot — and that
is tens of MB per film (a 37s export left 1,110 PNGs, 52 MB). Delete or move
the directory once the export is accepted; it is not part of the deliverable,
and nothing else cleans it up.

### 8. Close out — the film field report

The method's last step, not optional bookkeeping: before you finish, write
three honest bullets into whatever record you keep — what you built twice,
what you re-derived from scratch, and what you copied out of a template or an
earlier scene (and what for). `references/method.md`'s closing section owns the step and the
why; the five minutes after the film lands are worth more than any review
later.

**If you keep a task list for the build, this step is a task in it.** The
first cold build mirrored steps 3–7 into its list, left this one out, then
announced the report at delivery and never wrote it — once the last listed
task closed, nothing remained to prompt the step. A "nothing to report" line
still counts; silence does not.

## Rules that silently break a film

Not style — each was measured, and each fails quietly rather than loudly.

- **Time reaches shaders only through the `uTime` uniform** the template
  declares. Never import the TSL `time` node; it wall-clocks.
- **Four load-bearing lines**: `nodeFrame.update()` in `seekTo`, `compileAsync`
  in the boot block, `renderer.sortObjects = false`, and `frustumCulled = false`
  in `mesh()`. Do not simplify them away. Because drawing is unsorted, create
  overlapping transparent objects **farther-first**.
- **No temporal post passes, no `ComputeNode`, no storage buffers** — all carry
  state across frames.
- **Never allocate in `animate(t)`.** Build the scene graph once in
  `buildWorlds()`; `animate` only *restates* transforms, materials and
  visibility for the given `t`. Adding a mesh, a geometry or a material per call
  makes the scene accumulate — which breaks purity, and is the single thing that
  would put a ceiling on duration. Hide with scale or `visible`, do not create
  and destroy.
- **Fenced blocks byte-match the canonical store** in `templates/fences/` —
  the set is `smoke.js`'s own `FENCES` list, not this bullet: `CONTRACT` and
  `KERNEL` in every scene (yes, the block carrying the four `window.*` exports
  is itself a fence — do not hand-edit it either), and in 3D also
  `SOLVER`/`RIG`/`DRIVER`/`HTML`, plus `CHARACTER`.
  Never hand-edit a fence inside a scene: edit the store copy and run
  `smoke.js --parity-fix` to regenerate every carrier, or remove the markers
  to diverge deliberately and leave the parity set.
- **One scene = one file.** three is embedded, never a CDN, never a sibling
  `.js`, never `type="module"` — module imports are CORS-blocked over `file://`,
  and opening the file from disk is the point.

## Environment

Pinned: `three@0.185.1`, `playwright-core@1.61.1`, bun. **No encoder is needed to
build or review a scene** — `bundle`, `frames`, `probe`, `poster`, `sheet`,
`aspect` and `strip` all run on bun and a browser alone, and `check` needs not
even a browser.

`playwright-core` ships **no browser** — run `bunx playwright install chromium`
before the first render, or set `CHROMIUM_PATH`.

**Export needs encoders, and only export does:** `video`/`all` need ffmpeg on
PATH, `avif` needs avifenc, `loop` needs img2webp. Each probes for its own and
prints the install command before shooting a frame. (`motion` still needs
ffmpeg; it is a measurement whose scale has to be re-established before it can
move.)

**Backend:** with no env vars you get the WebGL2 fallback, which is universal and
CI-safe. `WEBGPU=metal` opts into macOS hardware and is measurably faster.
Frames are **not** byte-identical across backends, so pin the backend on both
sides of any comparison. Two distinct flag hazards, and they fail differently:
hand-rolled WebGPU Chromium flags (`--enable-unsafe-webgpu` without
`--use-angle=metal`) ship pure-black frames, deterministically, exit 0; the
configured `WEBGPU=swiftshader` path ships flat frames NON-deterministically,
warmth-dependent — and `shoot.js` refuses it outright. `ANGLE_BACKEND` selects
the GL backend on the fallback path.
`references/webgpu-stack.md` owns all of it.

## References

Cited above at the step that needs them. In full:

| file | read it when |
|---|---|
| `method.md` | **before building anything** — the failure axes and the discipline |
| `glossary.md` | a term is doing more work than it looks like |
| `breakdown.md` | what the declarative tables can say, and where `build.js check` still cannot reach |
| `film-language.md` | authoring `SUBJECTS` and `SHOTS` |
| `bibles.md` | choosing the look, at spec time |
| `materials.md` | authoring any surface beyond flat colour |
| `characters.md` | the film has figures |
| `webgpu-stack.md` | anything about backends, determinism or the recorder |
| `instruments.md` | deciding whether a green check means anything |
| `delivery.md` | shipping the scene itself, and posters |
| `recordings.md` | choosing and encoding a recording format |

No finished films ship with this skill, on purpose: a film would get copied
instead of built, and every technique a film could teach belongs in a
reference as tested code you compose yourself. If you find yourself needing
a worked film to learn something the templates and references do not carry,
that is a gap — report it in the field report (step 8).
