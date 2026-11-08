# Rendering backends: Native Metal (`MitateMetal`) and Web Bundle (`MitateWeb`)

> **Not here.** Self-contained HTML delivery → `delivery.md`; video recording modes → `recordings.md`; material modes → `materials.md`; what `mitate smoke` measures → `instruments.md`.

`mitate` v2 renders scenes from `shot.db` on two deterministic backends:
1. **Primary Native Backend (`MitateMetal`)**: Apple Silicon Swift 6 + Metal 3/4 (`MTLStorageModeShared` unified memory, hardware TBDR G-Buffer, inline `raytracing::intersector` area lighting, single-frame AOV wavelet denoiser, and `IOSurface` → `VideoToolbox`).
2. **Self-Contained Web Bundle (`mitate bundle`)**: Single-file HTML player exporting the `window.seekTo(t)` contract over WebGPU with automatic WebGL2 fallback.

## Determinism scope and diff magnitude

**Byte-identity holds within a single backend.** Seeking `t_a -> t_b -> t_a` on `MitateMetal` (or within a fixed browser backend) must produce **0 changed pixels**. Across different backends (`MitateMetal` vs. bundled WebGPU/WebGL2), shading and edge antialiasing legitimately differ while composition, timing, and framing match.

Whenever `mitate smoke` detects a pixel difference on random-access seek, it reports the exact magnitude and location in stdout JSON rather than a bare pass/fail:
- `changed_pixels` — count of differing pixels.
- `bbox` — `[min_x, min_y, max_x, max_y]` bounding box of the divergence.
- `max_channel_delta` — maximum 8-bit/16-bit channel delta.
- `psnr_db` — Peak Signal-to-Noise Ratio in dB (with `--dump-frames` writing the disagreeing images for visual inspection).

## Five rules that keep both backends byte-deterministic

1. **Time enters only through `StageClock(t)`.** Never read wall-clock timers (`Date()`, `performance.now()`, or auto-incrementing shader time nodes). Every transform, material parameter, and shader uniform derives from `t`.
2. **Zero temporal accumulation.** Never enable `MTLFXTemporalScaler`, temporal anti-aliasing (TAA/TRAA), temporal GI caches, or frame-to-frame feedback buffers. `MitateMetal` uses single-frame edge-stopping A-Trous wavelet denoising (`Denoise.metal`) guided by noise-free G-Buffer Albedo, Normal, and Depth AOVs, plus spatial-only scaling (`MTLFXSpatialScaler`).
3. **Pure GPU kernels (`purity_mode = 'pure_t'`).** Custom `.metal` functions attached via `mitate kernel` (`MTLVisibleFunctionTable` slots: `kinematics`, `ray_medium`, `procedural_surface`, `lens_ray`, `finishing_pass`) must treat `state_buffers` as read-only initial data and seed any stochastic sampling strictly from `(pixel_xy, sample_idx, slate.random_seed)`.
4. **Stateful simulations freeze into `baked_tracks` (`mitate bake`).** Any kernel or system that integrates velocity or collisions across time steps uses `purity_mode = 'baked_sim'`. Running `mitate bake shot.db --seed <N>` steps the simulation deterministically at build time and writes compressed trajectories into `baked_tracks`, which both `MitateMetal` and `mitate bundle` evaluate in $O(1)$ at any `t`.
5. **Synchronous completion barrier before capture.** On `MitateMetal`, every capture waits for `MTLCommandBuffer.waitUntilCompleted()` on unified memory before reading texture bytes; on the bundled web path, `window.seekTo(t)` completes pipeline rendering synchronously after `window.sceneReady()` returns `true`.
