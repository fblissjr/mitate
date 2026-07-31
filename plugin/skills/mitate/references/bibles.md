# Style bibles v2: the whole look is one object

> **Provenance.** Canonical for the style-bible schema and the committed workshop/neon control pair. Last verified (in the working tree, not an install cache) against
> the templates and shipped examples 2026-07-24 (full source audit;
> corrections recorded in the changelog). If this file and the code
> disagree, audit before trusting either — then fix the stale one.
>
> **Not here.** material recipes → `materials.md`; shot vocabulary → `film-language.md`. The flat-vector vocabulary has no home yet — see the backend table below.


A bible is a single object that constrains everything about a film's look —
palette, exposure, post, lens, cut pace, camera energy — selected by ONE
line. Changing the film's register is changing that line; changing a field
mid-film is a bible violation (the look stops being coherent the moment two
registers mix).

## What a bible is, on any backend

**The contract, and it is backend-agnostic:** a bible is the whole look as ONE
object, switched by one line. It constrains *how* things look, never *what* is in
the scene — that is the Anti-template line, and it is what keeps a bible from
becoming a preset.

**The vocabulary is per-backend, and that is the part that grows.** A 3D bible
speaks lens, camera energy, cut pace, bloom, depth of field; a flat-vector bible
cannot mean any of those and needs its own words — stroke weight, ink, accent,
contrast polarity. Both satisfy the same contract. Neither field list is the
definition.

| backend | vocabulary lives in | state |
|---|---|---|
| 3D node stack | below, in this file | shipped |
| Canvas2D flat vector | `bibles-2d.md` | **NOT WRITTEN.** `scene2d.template.html` ships with no art-direction reference of any kind. Its surface is `STYLE`, a palette const, `ACCENT_INK`, `stroke` weight and `contrastOn()`; the predecessor had three worked packs (paper-cutout, blueprint, neon-dark) which were left in the archive rather than promoted, because no 2D film has shipped since the rename |
| anything later | its own `bibles-<backend>.md` | — |

**Whoever writes the next one:** satisfy the contract above, name only what your
backend can actually mean, and state the hazards you *observed* separately from
the ones you *predict*. A bible whose fields the template cannot consume is a
mood board.

**Why flat files and not a `bibles/` subfolder.** `scripts/selfcheck.js`'s
provenance check reads `references/*.md` non-recursively, so a subfoldered
reference would ship with no provenance enforcement at all. Flat costs nothing
until one backend needs more than one file — **that is the trigger to subfolder**,
and it comes with a one-line change to make that check recurse.

## The v2 shape (node stack)

The template and solver already consume these STYLE fields directly, so a
bible needs no extra machinery — it IS the STYLE object:

| Field | Consumed by | Governs |
|---|---|---|
| `bg`, `exposure` | template | backdrop, tone-mapped exposure |
| `bloom`, `dof` | post pipeline | halation, rack-focus (per-frame pure) |
| `lens` | cinematography solver | default fov — long flattens, short dramatizes |
| `cutDur` | solver | cut personalities (`{blend, whip}` durations) |
| `energy` | solver | `locked` / `steadicam` / `handheld` camera nerves |
| palette keys | `buildWorlds()` by convention | every material color, emissive glow scale, fog depth |

```js
const BIBLES = {
  workshop: { bg: 0x182430, exposure: 1.15, energy: 'steadicam',
              gearIn: 0xc9a35c, /* ... */ markerGlow: .9 },
  neon:     { bg: 0x0a0e16, exposure: 1.0, energy: 'locked', lens: 24,
              cutDur: {blend: 1.2}, bloom: {threshold: .7, strength: .85},
              gearIn: 0x232b3a, /* ... */ markerGlow: 3.2 },
};
const STYLE = BIBLES.workshop;   // <-- the one line
```

## The committed control pair

`examples/gearbox.html` ships both bibles above. Verified 2026-07-23: same
beats, same geometry, one line — two categorically different films, both
byte-deterministic on both backends. `workshop` is a lit machine-shop
(steel and brass under a key light, steadicam); `neon` is a dark stage
where the machines are silhouettes and the LIGHT is the subject — bloomed
emissive markers, glowing time-history trails, locked long-lens camera,
slower dolly blends. Poster frames for both live in the repo's `site/posters/` — outside this
subtree, so not present in an install cache. To see them move, open the scene,
which is here.

## Register rules

- **One bible per film.** A film that needs two looks is two worlds under a
  cut, each still inside the bible, or it is two films.
- **The bible owns the post flags.** A dark emissive register (neon) turns
  bloom on and budgets markerGlow so only the payoff crosses the threshold;
  a lit register leaves bloom off rather than fighting a pale palette's
  halation (bloom is palette-conditional — `materials.md`).
- **Camera energy is register, not preference.** Technical/diagrammatic
  wants `locked` or calm `steadicam` + long lens; character registers earn
  `handheld` only in moments the story is unstable.
- **Palette keys are the scene's contract with the bible.** buildWorlds()
  reads every color that IS the look from STYLE — a hex literal on a
  subject is a look decision hiding from the bible switch (the control
  pair is the test: if switching bibles leaves a subject color behind,
  that color was hardcoded). Neutral hardware may keep literals: the
  committed pair leaves gearbox's pedestal, axle and rim-light hexes
  fixed across both bibles.
