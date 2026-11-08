# Recordings: hardware video (`mitate shoot`) and inline loops

> **Not here.** Self-contained HTML bundles (`mitate bundle`) and the `window.seekTo(t)` contract → `delivery.md`; Metal rendering pipeline → `webgpu-stack.md`.

`mitate shoot` renders `shot.db` on Apple Silicon Metal (`MitateMetal`) and encodes frames zero-copy via `IOSurface` → `VTCompressionSession` (Apple Silicon hardware Media Engine), logging each completed render in the `takes` table of `shot.db`.

## Native video recording modes (`mitate shoot`)

```bash
# Fast iteration preview (H.264 MP4, draft SPP)
mitate shoot shot.db --mode dailies   --out preview.mp4

# Production delivery (HEVC / H.264 MP4, full SPP + AOV wavelet denoiser)
mitate shoot shot.db --mode hero      --out final.mp4

# Mastering / compositing output (12-bit ProRes 4444 .mov with alpha support)
mitate shoot shot.db --mode reference --out master.mov
```

| `--mode` | Container / Codec | Typical use |
|---|---|---|
| `dailies` | `.mp4` (`H.264`) | Quick full-motion check after `quad`, `sheet`, and `strip` pass |
| `hero` | `.mp4` (`HEVC` / `H.264`) | Final shareable video file with hardware decode on every device |
| `reference` | `.mov` (`ProRes 4444`) | Archival master or transparent-backdrop (`backdrop_mode = 'alpha_transparent'`) overlay |

Because every frame is a pure function of `t` (`StageClock(t) -> StageSnapshot(t)`), `mitate shoot` evaluates each frame `k / slate.fps` independently with zero temporal-accumulator warmup artifacts across cuts.

---

## Inline animated loops on GitHub READMEs (AVIF and WebP)

GitHub strips `<script>` and `<video>` tags in Markdown and serves repo-relative `.mp4` files with `Content-Type: text/plain`, so an `.mp4` committed to a repository will not render inline inside a GitHub `README.md`. When you specifically need an inline animated preview inside a GitHub Markdown file, transcode the `mitate shoot` output to animated **AVIF** (`avifenc`) or **WebP** (`img2webp`):

| Format | Disk Size (moving camera) | Playback Decode Cost | Best when |
|---|---|---|---|
| **MP4 (`mitate shoot`)** | Small (`~0.5 MB`) | Hardware-accelerated everywhere | Any surface outside GitHub Markdown (chat, web, docs, issues attachment) |
| **Animated AVIF (`.avif`)** | Very small (`~0.3 MB` moving, `~0.03 MB` held) | Software-decoded per frame (`width × height × fps` budget) | Bandwidth matters; keep width `<= 720..960px` so software decode stays smooth |
| **Animated WebP (`.webp`)** | Small on held camera (`~0.2 MB`), large on moving camera | Lightweight software decode on all browsers | Held-camera (`camera_energy = 'locked'`) diagrams on older or low-power viewers |

### Practical rules for GitHub inline loops
- **Prefer cutting resolution (`720px` width) over frame rate** when tuning animated AVIF decode cost so motion cadence stays smooth.
- **Never track inline `.avif` or `.webp` README images under Git LFS** — GitHub's raw URL serves the text LFS pointer instead of the image, breaking inline rendering.
