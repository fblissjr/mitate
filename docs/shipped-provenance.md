last updated: 2026-08-05

# Shipped-file verification ledger

The maintainer-side record of **when each shipped markdown file was last
verified, against what** — the record the shipped files themselves used to
carry as dated provenance headers, moved here at 0.22.0 on the owner's rule
that everything under `plugin/` reads as current state: an agent loading the
skill does not care when a rule was amended, and a date in a shipped file is
history riding along in context. History lives in git and `CHANGELOG.md`;
verification lives here; the shipped file carries only what is true now.

Two things deliberately did NOT move out of the shipped files:

- **Trust labels.** "This figure is inherited from the predecessor stack and
  has not been re-measured here" is current state, not history — it tells the
  reader how much weight a number bears today. Those stay in the shipped
  files, dateless.
- **The "Not here" routing edges.** Routing, not provenance.

**Maintenance rule:** re-verifying a shipped file against the code updates
its row here (date, scope, findings note) — nothing in the shipped file
changes unless the verification found drift. `scripts/selfcheck.js` enforces
the other half: any ISO date appearing in tracked markdown under `plugin/`
is a failure, so a dated annotation cannot quietly return.

| shipped file | canonical for | last verified | scope and known limits |
|---|---|---|---|
| `SKILL.md` | routing and workflow order | 2026-08-04 (full claim audit against 0.19.2), spot-amendments verified 2026-08-05 | audited before the first cold-start build; step 7/8 additions verified against `build.js` and that build's transcript-derived record |
| `references/method.md` | the three failure axes, beats/controls discipline, review passes, determinism idioms | 2026-07-24 (full source audit); semantics/continuity additions 2026-08-04/05 verified against the cold build's record | dangling-pointer class known: a straight read does not test pointers, only following them does |
| `references/instruments.md` | what each check can and cannot see; measured brackets | brackets run-and-made-fallible 2026-07-29; `check` section verified 2026-08-02 and re-verified 2026-08-04 against the 0.18.2 verb; no-instrument ledger extended 2026-08-05 | **never audited end to end**; many brackets measured on the predecessor and carried over — the file labels inherited numbers as inherited |
| `references/breakdown.md` | the declarative tables and what validates each field | derived mechanically 2026-08-02 (every `STYLE.*`/`CONFIG.*` read enumerated); validation column re-verified 2026-08-04 against `check` | semantic *correctness* not audited — records what the code does; a wrong-but-consistent semantic would survive |
| `references/glossary.md` | definitions of the project vocabulary | 2026-07-30 (term census across the tracked corpus); `parity set` entry re-verified 2026-08-02 against `smoke.js` | owns no measurement; every entry points at an owner file |
| `references/bibles.md` | style-bible schema and the workshop/neon control pair | 2026-07-24 (full source audit) | |
| `references/characters.md` | character scaffold API, gait, proportion vectors | 2026-07-24 (full source audit) | |
| `references/film-language.md` | shot vocabulary and `SHOTS[]` solver semantics | 2026-07-24 (full source audit) | |
| `references/materials.md` | material packs, ordering and bloom discipline | 2026-07-24 (full source audit) | |
| `references/webgpu-stack.md` | backend policy, determinism rules, recorder mechanics, node-stack brackets | 2026-07-24 (full source audit) | |
| `references/delivery.md` | the scene as delivered artifact; posters; mount policy | 2026-07-24 (byte figures and mount policy measured then; not re-measured since — they move whenever a scene's content does) | |
| `references/recordings.md` | recording formats and measured costs | **never audited end to end** | size/decode measurements taken on the predecessor skill; they operate on encoded output so they carry over, but are not re-measured on this stack |
| `plugin/README.md` | install and layout, reader-facing | 2026-08-05 (rewritten alongside the zero-films restructure) | |

The full amendment history the old headers narrated — what changed on which
date and why — is recoverable from git (`git log --follow` on any shipped
file) and from `CHANGELOG.md`, which was always the second copy of it. This
table is deliberately not a third: it records verification state, not change
history.
