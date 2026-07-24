# mitate

A Claude Code skill that turns any input — a document, a codebase, a joke — into
an animated scene of any length. Not a one-shot generator but a filmmaking
pipeline an agent drives: reshoot parts, validate on three axes, and get better
over time. Every scene is a deterministic, self-contained HTML file — a pure
function of time `t`.

*mitate* (見立て): to see one thing as another — the Japanese aesthetic of
representing one thing through another. Here, seeing any input as a scene.

## Status

This repo currently holds the **showcase site** in [`site/`](site/) — the films
playing at native quality, plus the thesis. The skill itself (templates,
references, the recorder) is migrating in; until it lands, this is the front
door.

## Layout

| Path | What |
|---|---|
| [`site/`](site/) | The static showcase site — see [`site/README.md`](site/README.md) to run or deploy it |

## License

MIT — see [LICENSE](LICENSE). Third-party notices (three.js, embedded in every
scene) are in [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
