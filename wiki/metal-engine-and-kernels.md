# Apple Silicon Swift 6 & Metal 3/4 Engine (`wiki/metal-engine-and-kernels.md`)

> **Scope:** How `MitateEngine` renders `shot.db` on Apple Silicon (M2 Ultra / Metal 3/4), how custom MSL `kinematics(t, state)` and `swarms` kernels work, and how deterministic denoising/upscaling preserves the Prime Directive.
> **Not here:** SQLite schema tables → [`soundstage-schema.md`](soundstage-schema.md); CLI commands & review loop → [`instruments-and-review.md`](instruments-and-review.md).

---

## 1. Unified Memory & Zero-Copy Pipeline

On Apple Silicon (`Apple M2 Ultra`, 76 GPU cores, 192 GB Unified Memory), CPU and GPU share the same physical memory pool:
- `MitateCore` evaluates SQLite tables (`beats`, `warp_segments`, `cue_sheet`, `baked_tracks`, `characters`, `shots`) at `t` and writes packed `simd_float4x4` instance matrices and material uniforms directly into `MTLResourceStorageModeShared` buffers (`MTLHeap`).
- Zero PCIe staging copies are needed between SQLite evaluation and Metal command buffer submission.
- **Synchronous Readback Contract:** Every capture command (`quad`, `sheet`, `strip`, `shoot`, `smoke`) waits for `MTLCommandBuffer.waitUntilCompleted()` before reading texture bytes, eliminating presentation-race determinism flakes.

---

## 2. The Pure `kinematics(t, state)` MSL Hook

When an agent needs high-frequency procedural vertex or instance motion on the GPU (`gpu_kernels`, `swarms`, or `surface_shaders.displacement_code`), it writes a pure Metal Shading Language (MSL) snippet conforming to the `kinematics(t, state)` ABI:

```msl
// Pure function of t and immutable instance state
TransformState kinematics(
    float t,
    uint instance_id,
    constant SlateUniforms& u,
    device const ParticleInit* init_state
) {
    ParticleInit p = init_state[instance_id];
    float angle = p.phase0 + t * p.omega;
    float radius = p.r0 + 0.12 * sin(t * 2.0 + float(instance_id) * 0.37);
    TransformState out;
    out.position = float3(cos(angle) * radius, p.y0 + sin(t * 1.5) * 0.08, sin(angle) * radius);
    out.euler_deg = float3(0.0, degrees(-angle), 0.0);
    out.scale = float3(p.scale);
    return out;
}
```

### Rules for Custom MSL Kernels (`gpu_kernels`)
1. **Read-Only Initial Buffers (`state_buffers`):** Compute kernels at render time read from `state_buffers.initial_data_blob` and write to the frame's output transform buffer. They must **never** mutate `initial_data_blob` in place across frames during `seekTo(t)`.
2. **Stateful Simulations Use `mitate bake`:** If a kernel needs step-by-step velocity integration ($v_{k+1} = v_k + a \Delta t$), run it via `mitate bake shot.db --seed <N>` to populate `baked_tracks`, which `MitateEngine` then evaluates in $O(1)$ at any `t`.
3. **Runtime Compilation & Situated Errors:** `MitateEngine` compiles `gpu_kernels.msl_source` via `device.makeLibrary(source:options:)` targeting **Metal 4.1 (`MTLLanguageVersion.version4_1`)** on macOS Golden Gate 27.2+ (`arm64-apple-macosx27.2`) with both `options.mathMode = .safe` (IEEE 754 arithmetic) and `options.mathFloatingPointFunctions = .precise` (`metal::precise` transcendentals). Any MSL syntax or type error is caught and returned as structured JSON naming the `gpu_kernels.id`, line, and column.

---

## 3. Hardware Ray Tracing (HWRT) & Single-Frame Deterministic Denoising

### Acceleration Structures (`MTLAccelerationStructure`)
- Each unique procedural prop (`props.csg_tree`) builds a Bottom-Level Acceleration Structure (**BLAS**) once per geometry hash.
- At each evaluated timestamp `t`, `MitateEngine` updates the Top-Level Acceleration Structure (**TLAS**) from the evaluated `actors` and `swarms` transforms and dispatches inline `raytracing::intersector<triangle_data, instancing>` in `RayTrace.metal` for area-light soft shadows, reflections, ambient occlusion, and glass refraction.

### Why Single-Frame AOV Wavelet Denoising (`Denoise.metal`) + `MTLFXSpatialScaler`?
Temporal denoisers and `MTLFXTemporalScaler` accumulate history buffers from frame $t-1, t-2, \dots$. That violates the Prime Directive: seeking directly to `t = 4.2` would produce different pixels than playing `t = 0.0 .. 4.2`.

Instead, `MitateEngine` uses:
1. **Single-Frame SVGF / À-Trous Wavelet Filtering (`Denoise.metal`):** Guided by exact noiseless G-buffer AOVs (world normal $N$, linear depth $Z$, roughness, and albedo) rendered at `t`.
2. **`MTLFXSpatialScaler`:** Pure single-frame MetalFX spatial upscaling with zero temporal history buffers.
3. **Result:** Every frame `t` is 100% order-independent and byte-identical on the same Apple Silicon GPU.
