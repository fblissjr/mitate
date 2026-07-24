# mitate — showcase site

last updated: 2026-07-24

The showcase site for **mitate**: the full HTML scenes playing at native quality,
plus the thesis — an agent turns any input into a deterministic scene, built from
reusable primitives, in any register.

*mitate* (見立て): to see one thing as another. Here, seeing any input — a
document, a codebase, an idea — as a scene. Self-contained and zero-build; lives
in `site/` alongside the skill it demonstrates.

## What's here

```
site/
  index.html      the page (one file, hand-authored)
  styles.css      design system — spec-sheet light + sound-stage dark, one type system
  app.js          nav state, reveal-on-enter, live f(t) instrument, scene lightbox, clip playback
  netlify.toml    deploy config — publish this dir, one build step
  films/          the self-contained scene HTML pages (three.js embedded, zero network)
  clips/          h264 thumbnail loops, 1280/30fps — what the gallery plays
  posters/        -still.jpg poster frames, plus the animated AVIFs the GitHub READMEs embed
scripts/
  stage-films.sh  copies the skill's examples/ into site/films/
```

The scenes are fully self-contained — three.js is embedded per file, no CDN, no
fetched assets — so serving them statically is all that's required. The lightbox
loads each one into an iframe on demand (and tears it down on close, releasing
the WebGL context).

**`films/` is staged, not tracked.** The scenes live once, as the skill's
`plugin/skills/mitate/examples/`; `stage-films.sh` copies them here at build
time, and the five staged names are gitignored so there is never a second copy
to drift. The one exception is `gearbox-neon.html`, tracked here directly — it
is a showcase-only variant (one line: `STYLE = BIBLES.neon`), not a skill
example, so this is its only home.

`clips/` and `posters/` are tracked. The gallery thumbnails are **muted h264
clips, not animated images** — `<video>` with the `-still.jpg` as its `poster`.
That is a deliberate split from what the READMEs do:

| surface | format | why |
|---|---|---|
| this site | h264 mp4, 1280/30fps | hardware-decoded, so six loops on one page are cheap, and it is far better quality per byte |
| GitHub READMEs | animated AVIF, 720/12fps | GitHub refuses to render an mp4 inline; AVIF is the only animated format it will embed |

The AVIF's software decode is exactly why it never belonged on a page showing six
at once. `references/delivery.md` in the skill has the full measurement. The AVIFs
stay in `posters/` because the skill's `examples/README.md` embeds them by
relative path — one copy, two consumers.

Clips are fetched lazily: `preload="none"`, and `app.js` only attaches the source
when a thumbnail nears the viewport. Under `prefers-reduced-motion` no video is
requested at all — the poster still is the whole experience.

## Run locally

Stage the films first, then any static server works:

```
./scripts/stage-films.sh
cd site && python3 -m http.server 8788
# open http://localhost:8788
```

Note: browsers block `file://` navigation for the scene iframes, so use a local
server rather than opening `index.html` from disk.

## Deploy to Netlify

`netlify.toml` sets `publish = "."` and `command = "../scripts/stage-films.sh"`.
The build step needs the repo checkout, because it reads the skill's `examples/`
from a sibling directory:

- **Git integration (the deployed setup):** point a Netlify site at this repo
  with **base directory `site`** — Netlify reads `site/netlify.toml`, runs
  `stage-films.sh`, and publishes `site/`.
- **CLI:** run `./scripts/stage-films.sh` first, then `netlify deploy --prod --dir site`.
- **Drag-and-drop:** run `./scripts/stage-films.sh` first, or the zip ships
  without its films.

## Keeping scenes current

Edit the scene where it lives — `plugin/skills/mitate/examples/<name>.html` —
and the next build picks it up. No copying.

Clips and posters do need a manual re-render, both from source — never by
transcoding one preview into another:

```
# poster still, frame-exact at time t
build.js poster <name>.html <t> 1280                -> posters/<name>-still.jpg

# thumbnail loop: render frames, then encode 1280/30fps
build.js frames <name>.html 30
ffmpeg -framerate 30 -i frames/f%05d.png -vf scale=1280:-2 \
  -c:v libx264 -preset slow -tune animation -crf 24 \
  -pix_fmt yuv420p -movflags +faststart clips/<name>.mp4
```

`-tune animation` is worth the flag: on this synthetic, large-flat-area content it
cut ~20% off the file at identical CRF (1393 KB to 1119 KB on gearbox).

Bump the `?v=` query on the `styles.css` / `app.js` links in `index.html` when
you change either, so returning visitors get the new version.
