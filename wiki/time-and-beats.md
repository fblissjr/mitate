# Time, Beats, Warping, and Tier-1 Bake (`wiki/time-and-beats.md`)

> **Scope:** How time `t` works in `mitate` v2, relative beat addressing (`beats`), time-warping (`warp_segments`), and deterministic build-time simulation (`mitate bake` / `baked_tracks`).
> **Not here:** SQLite physical soundstage tables → [`soundstage-schema.md`](soundstage-schema.md); camera framing & character rigs → [`cinematography-and-rigging.md`](cinematography-and-rigging.md).

---

## 1. The Prime Directive: `t` Is a Coordinate, Not a Clock

Every frame in `mitate` v2 is a pure function of continuous scene time `t` (in seconds, `0 <= t <= DURATION`):

$$\text{Frame}(t) = \text{Render}(\text{Evaluate}(\text{shot.db}, t))$$

- **Order-independent evaluation:** Evaluating `t = 4.20` first or after `t = 0.0..4.19` must produce identical scene transforms, camera matrices, and pixels.
- **Zero runtime state:** Never accumulate velocity, position, or PRNG state across frames at render time.
- **Deterministic noise:** Any randomness in MSL or SQL expressions must be a pure hash of `(actor_id, instance_id, t, slate.seed)`.

---

## 2. Relative Beat Addressing (`beats`)

Scenes never hardcode absolute second timestamps in shots or cues. Instead, narrative time is partitioned into sequential rows in the `beats` table:

```sql
INSERT INTO beats (id, seq, dur, caption, act) VALUES
  ('establish', 1, 2.5, 'Three concentric shafts share one housing.', 'setup'),
  ('engage',    2, 3.0, 'The sliding collar locks the planetary carrier.', 'turn'),
  ('payoff',    3, 2.5, 'Torque flows straight through at 1:1.', 'resolution');
```

### How Beats Resolve to `t`
`MitateCore` computes each beat's `[t0, t1]` span from `ORDER BY seq`:
- `establish`: `[0.0, 2.5]`
- `engage`: `[2.5, 5.5]`
- `payoff`: `[5.5, 8.0]` (`DURATION = 8.0s`)

If you later lengthen `'establish'` from `2.5s` to `4.0s`:
```sql
UPDATE beats SET dur = 4.0 WHERE id = 'establish';
```
Every shot, cue, and camera move anchored to `'engage'` or `'payoff'` shifts automatically by `+1.5s` with zero broken keyframes.

### Beat-Relative Helpers (`beat@fraction`)
Across CLI flags (`--at engage@0.5`), `shots` (`beat_start = 'engage@0.0'`), `cue_sheet`, and MSL uniforms, `beat@u` resolves to:

$$t(\text{beat}, u) = t_0(\text{beat}) + u \cdot \text{dur}(\text{beat}), \quad u \in [0, 1]$$

| Helper | Definition | Typical Use |
| :--- | :--- | :--- |
| `beatAt(id, u)` | $t_0 + u \cdot \text{dur}$ | Exact event timestamp inside a beat |
| `ramp(t, id, u0, u1)` | $\text{smoothstep}(t(\text{id}, u_0), t(\text{id}, u_1), t)$ | Smooth transition from $0 \to 1$ across a window |
| `pulse(t, id, u0, u1)` | $\text{ramp}(t, \text{id}, u_0, u_{\text{in}}) \cdot (1 - \text{ramp}(t, \text{id}, u_{\text{out}}, u_1))$ | Envelope that rises and returns to $0$ |
| `bump(t, t_a, t_b)` | Smooth envelope spanning two arbitrary beat coordinates | Multi-beat walk or motion envelope |

> [!WARNING]
> **The Composed-Periodic Trap:** Never write `sin(floor(t * 2.0) * 2.0 * PI)` — `sin(integer * 2 * PI)` evaluates to `0.0` at every `t`, producing a dead/constant animation that passes determinism checks silently. `mitate check` and `mitate probe` test expressions across multiple fractional offsets to catch constant/inert expressions.

---

## 3. Piecewise Time Warping (`warp_segments`)

When a film needs slow-motion impact, a freeze-frame hold for a diagram callout, or a speed ramp, author it in `warp_segments` rather than mutating every actor's velocity expression:

```sql
INSERT INTO warp_segments (id, seq, t_start, t_end, rate_start, rate_end, easing) VALUES
  ('impact_slowmo', 1, 'engage@0.4', 'engage@0.8', 0.15, 0.15, 'smoothstep');
```

- **Forward map `warp(t)`:** Maps presentation time `t` to simulation/world time $t_{\text{sim}}$.
- **Inverse map `unwarp(t_sim)`:** Built into `MitateCore` and queryable via `mitate probe --unwarp <t_sim>`. Use `unwarp` whenever an external dataset/log event occurs at domain time $t_{\text{sim}}$ and you need the exact presentation time `t` to aim a camera cut or `mitate strip`.

---

## 4. Tier-1 Bake-Time Simulation (`mitate bake` & `baked_tracks`)

Closed-form equations (`cue_sheet` + MSL `kinematics(t, state)`) handle ~85% of scenes. When a scene requires stateful dynamics—rigid-body collisions, spring-damper settling, or multi-agent boid avoidance—use **Tier-1 Bake-Time Simulation**:

1. **Author the simulation kernel or rules** in `swarms` / `gpu_kernels` / `props`.
2. **Run the deterministic bake:**
   ```bash
   mitate bake shot.db --seed 42 --hz 60
   ```
3. **What `mitate bake` does:**
   - Steps the simulation forward from `t = 0` to `DURATION` using a seeded deterministic PRNG (`slate.seed`) and fixed timestep (`1 / sample_hz`).
   - Compresses and writes the resulting `[tx, ty, tz, rx, ry, rz, sx, sy, sz]` samples per actor/instance into the `baked_tracks` table inside `shot.db`.
4. **How `seekTo(t)` reads `baked_tracks`:**
   - At render/evaluation time, `MitateCore` computes sample index $k = t \cdot \text{sample\_hz}$ and performs $O(1)$ cubic Hermite / slerp interpolation between samples $\lfloor k \rfloor$ and $\lceil k \rceil$.
   - Result: **100% pure random-access `seekTo(t)`** with zero runtime simulation drift.
