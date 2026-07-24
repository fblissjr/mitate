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
  netlify.toml    deploy config — publish this dir, no build step
  films/          the five self-contained scene HTML pages (three.js embedded, zero network)
  posters/        animated AVIF loops used as thumbnails
```

The scenes in `films/` are copies of the skill's shipped examples. They are fully
self-contained — three.js is embedded per file, no CDN, no fetched assets — so
serving them statically is all that's required. The lightbox loads each one into
an iframe on demand (and tears it down on close, releasing the WebGL context).

Once the skill lives in this repo, prefer tracking the scenes once (as the skill's
`examples/`) and staging them into `site/films/` at deploy via a build command,
rather than committing two copies. Until then, the copies here keep the site
self-contained and deployable on its own.

## Run locally

Any static server works, since there is no build step:

```
cd site
python3 -m http.server 8788
# open http://localhost:8788
```

Note: browsers block `file://` navigation for the scene iframes, so use a local
server rather than opening `index.html` from disk.

## Deploy to Netlify

Publish this directory as-is (`netlify.toml` sets `publish = "."`, no build
command). Either:

- **Drag-and-drop:** zip this folder and drop it on the Netlify dashboard, or
- **CLI:** `netlify deploy --prod --dir site`, or
- **Git integration:** point a Netlify site at this repo with **base directory
  `site`** (Netlify then reads `site/netlify.toml` and publishes it).

## Pending the skill migration

The install commands and GitHub links in `index.html` point at `fblissjr/mitate`
and `mitate@mitate` — the intended home once the skill migrates and publishes
under the new name. Update them if the marketplace or repo path differs.

## Keeping scenes current

When a skill example changes, re-copy it from the skill's `examples/` directory:

```
cp <skill>/examples/<name>.html site/films/
cp <path-to-rendered-previews>/<name>.avif site/posters/
```

Bump the `?v=` query on the `styles.css` / `app.js` links in `index.html` when
you change either, so returning visitors get the new version.
