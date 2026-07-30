# Delivering the scene

The scene HTML **is** the deliverable. It is not a source file you render a
product from — it is the product, and on any surface that can run it, shipping
anything else is shipping a lossy copy of something you already have.

That is a measured claim, not a preference: after compression the real artifact
is smaller than a mid-quality recording of itself, at far better fidelity.

> **Provenance.** Canonical for the scene as the delivered artifact — bundle
> economics over the wire, hosting and mount policy, posters and stills, and
> which artifact belongs on which surface.
> **Verification date: 2026-07-24**, measured in this repo on this stack: the
> brotli and showcase byte figures below, and the mount policy, were both taken
> then and reconciled against what `site/` actually ships. Neither has been
> re-measured since; the byte figures move whenever a scene's content does.
>
> **Not here.** recording formats, encoders and their measured costs →
> `recordings.md`; the format DECISION → SKILL.md, at spec time; render-side
> cost → `webgpu-stack.md`.

**Map.** Deliberately unlinked — a heading map costs nothing and cannot dangle,
where hand-written anchors ship into an install cache unverified.

- On a page you control, ship the scene — not a recording of it
- Stills come from the scene, never from the loop
- Which artifact goes on which surface

The HTML scene is a fourth, co-equal delivery option alongside mp4, WebP and
AVIF — not a footnote to them. It is the interactive, deterministic source
itself, not a rendering of it: `build.js bundle` makes it a single
self-contained file that runs offline, and it plays fine served from GitHub
Pages or any static host. It does **not** run from github.com directly, because
GFM strips `<script>` — which is the one constraint that makes a recording
necessary at all, and the entire subject of `recordings.md`.

## On a page you control, ship the scene — not a recording of it

The compressed-loop path is scoped to **one constraint: GitHub will not render
an mp4 inline.** Lift it — on any page you control — and the right answer is not
a better recording. It is no recording: serve the scene.

The instinct is that an HTML file carrying an embedded three.js is the heavy
option. Measured, it is the opposite, because text compresses and video does not:

| per film, over the wire | size |
|---|---|
| scene HTML, raw | ~1.11 MB |
| scene HTML, **brotli** (what a static host actually serves) | **~255 KB** |
| the same film as h264 1280/30fps | 559-1626 KB |
| the same film as AVIF 720/12fps | ~344 KB |

The real artifact is cheaper than a mid-quality recording of itself, at far
better fidelity — because it is not a copy, it is the thing. On this repo's
showcase the swap cut a full scroll-through from ~6.3 MB to ~1.9 MB and removed
8 MB of tracked mp4s.

Two second-order wins, both larger than they look:

- **The thumbnail and the full view are the same URL.** Watch a thumbnail, click
  to open it, and the open costs zero bytes — already cached. A recording makes
  you pay for the film twice.
- **Bandwidth tracks device capability.** Weak devices fall back to the poster
  still (~45 KB), cheaper than any animated format. The degradation path saves
  bytes instead of costing them.

The cost is real and worth stating: a live scene boots in about a second where a
video paints its poster instantly, and each one holds a GPU context. So the
showcase mounts almost nothing: one driven hero scene on capable desktops
(gearbox — the cheapest warm, ~1.1s to `sceneReady` against 4-5s for the
character films), and every other scene only on an explicit click, unmounted on
close. Under `prefers-reduced-motion`, and on coarse-pointer devices — where an
offscreen-composited iframe was measured never reaching `sceneReady` — the hero
holds a poster still and a static readout instead. Zero or one mounted scene,
by construction.

## Stills come from the scene, never from the loop

`build.js poster <scene.html> [t] [width]` renders a frame-exact still straight
from the scene. Use it for README heroes, reduced-motion fallbacks, and site
thumbnails. Extracting a frame from an AVIF or WebP instead gives you a
transcode of a lossy encode — visibly worse, and for no gain, since the scene is
right there and deterministic.

This is a rule about the scene being the source, which is why it lives here and
not with the encoders: the still is rendered, never re-derived from a recording.

In this repo that rule is why `site/posters/` carries a `-still.jpg` per film,
rendered from source at a chosen `t`. It is the only image the showcase ships.

## Which artifact goes on which surface

| surface | ship | why |
|---|---|---|
| GitHub README | animated AVIF (or WebP) | the only animated formats GitHub embeds; mp4 is served `text/plain` and `<video>` is stripped |
| a page you control | **the scene HTML** | smaller than its own recording after brotli, and it is the artifact rather than a lossy copy |
| a poster or still, anywhere | `build.js poster` | a frame rendered from source |

The first row is the whole reason `recordings.md` exists; everything about
producing that artifact — formats, encoders, decode cost, the content-type
mechanism — lives there.

What this repo actually does, after trying the alternatives: **it ships no
recordings at all.** The showcase drives one hero scene through the window
contract where the device can afford it, loads any other scene on demand, and
otherwise nothing moves; the examples README embeds a poster frame per example, because GitHub
cannot run a scene and a frame is the honest thing to show there. Every image is
`build.js poster` against the scene. The recording path still holds for anyone
who *needs* an inline animated preview on GitHub — that is what `build.js avif`
is for — but a page that says it is not a video should not open by playing one.
