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
  app.js          nav state, reveal-on-enter, live f(t) instrument, scene lightbox
  netlify.toml    deploy config — publish this dir, one build step (stage-films.sh)
  stage-films.sh  copies the skill's examples/ into films/
  films/          the self-contained scene HTML pages (three.js embedded, zero network)
  posters/        animated AVIF loops used as thumbnails, and their -still.jpg frames
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

`posters/` is tracked here and is also what the skill's `examples/README.md`
embeds, by relative path. Same rule: one copy.

## Run locally

Stage the films first, then any static server works:

```
cd site
./stage-films.sh
python3 -m http.server 8788
# open http://localhost:8788
```

Note: browsers block `file://` navigation for the scene iframes, so use a local
server rather than opening `index.html` from disk.

## Deploy to Netlify

`netlify.toml` sets `publish = "."` and `command = "./stage-films.sh"`. The
build step needs the repo checkout, because it reads the skill's `examples/`
from a sibling directory:

- **Git integration (the deployed setup):** point a Netlify site at this repo
  with **base directory `site`** — Netlify reads `site/netlify.toml`, runs
  `stage-films.sh`, and publishes `site/`.
- **CLI:** run `./stage-films.sh` first, then `netlify deploy --prod --dir site`.
- **Drag-and-drop:** run `./stage-films.sh` first, or the zip ships without its
  films.

## Keeping scenes current

Edit the scene where it lives — `plugin/skills/mitate/examples/<name>.html` —
and the next build picks it up. No copying.

Previews do need a manual render, from source rather than from the AVIF:

```
build.js poster <name>.html <t> 1280    # frame-exact -> posters/<name>-still.jpg
```

Bump the `?v=` query on the `styles.css` / `app.js` links in `index.html` when
you change either, so returning visitors get the new version.
