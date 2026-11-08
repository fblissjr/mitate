import Foundation
import CryptoKit
import simd

public enum BakeEngine {
    public struct BakedTransformSample: Sendable, Equatable {
        public var position: SIMD3<Double>
        public var eulerDeg: SIMD3<Double>
        public var scale: SIMD3<Double>
    }

    public static let floatsPerSample = 9
    public static let bytesPerSample = floatsPerSample * MemoryLayout<Float>.size

    public static func computeInputsHash(
        kernel: GPUKernelRow,
        actor: ActorRow?,
        seed: Int,
        sampleHz: Double,
        totalDuration: Double
    ) -> String {
        let payload = [
            kernel.id,
            kernel.hookSlot,
            kernel.purityMode,
            kernel.entrySymbol,
            kernel.mslSource,
            kernel.uniformsJson,
            actor?.id ?? "",
            String(format: "%.4f,%.4f,%.4f", actor?.x ?? 0, actor?.y ?? 0, actor?.z ?? 0),
            "\(seed)",
            String(format: "%.2f", sampleHz),
            String(format: "%.4f", totalDuration)
        ].joined(separator: "|")
        let digest = SHA256.hash(data: Data(payload.utf8))
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    /// Runs a deterministic fixed-timestep Tier-1 bake for all `baked_sim` kernels in `shot.db`
    /// and writes their trajectory blobs into `baked_tracks`.
    public static func bakeAll(
        db: StageDB,
        seedOverride: Int? = nil,
        sampleHz: Double = 60.0
    ) throws -> [BakedTrackRow] {
        let slate = try db.loadSlate()
        let beats = try db.loadBeats()
        let kernels = try db.loadGPUKernels().filter { $0.purityMode == "baked_sim" }
        let actors = try db.loadActors()
        let actorByKernel = Dictionary(grouping: actors, by: { $0.kinematicsKernel ?? "" })

        let totalDur = BeatAddressing.totalDuration(beats: beats, fallbackDuration: slate.fallbackDurSec)
        let seed = seedOverride ?? slate.randomSeed
        let frameCount = max(2, Int(ceil(totalDur * sampleHz)) + 1)
        let dt = 1.0 / sampleHz

        var written: [BakedTrackRow] = []

        for kernel in kernels {
            let boundActors = actorByKernel[kernel.id] ?? [
                ActorRow(
                    id: kernel.id,
                    parentId: nil,
                    role: "prop",
                    x: 0, y: 1, z: 0,
                    pitchDeg: 0, yawDeg: 0, rollDeg: 0,
                    scaleX: 1, scaleY: 1, scaleZ: 1,
                    scaleGate: 1, aimAt: nil, bankDeg: 0,
                    visible: true, kinematicsKernel: kernel.id
                )
            ]

            for actor in boundActors {
                let hash = computeInputsHash(
                    kernel: kernel,
                    actor: actor,
                    seed: seed,
                    sampleHz: sampleHz,
                    totalDuration: totalDur
                )

                // Deterministic spring-damper / orbital / pendulum step integrator seeded by `(seed, actor.id)`
                var pos = SIMD3<Double>(actor.x, actor.y, actor.z)
                var vel = SIMD3<Double>(0.0, 0.0, 0.0)
                var euler = SIMD3<Double>(actor.pitchDeg, actor.yawDeg, actor.rollDeg)
                let scale = SIMD3<Double>(actor.scaleX, actor.scaleY, actor.scaleZ)

                var deterministicIdHash: UInt64 = 1469598103934665603
                for byte in actor.id.utf8 {
                    deterministicIdHash ^= UInt64(byte)
                    deterministicIdHash &*= 1099511628211
                }
                let actorSeed = Double((deterministicIdHash &+ UInt64(bitPattern: Int64(seed))) % 1009) * 0.013
                var floats: [Float] = []
                floats.reserveCapacity(frameCount * floatsPerSample)

                for step in 0..<frameCount {
                    let t = Double(step) * dt
                    // Record sample at step
                    floats.append(Float(pos.x))
                    floats.append(Float(pos.y))
                    floats.append(Float(pos.z))
                    floats.append(Float(euler.x))
                    floats.append(Float(euler.y))
                    floats.append(Float(euler.z))
                    floats.append(Float(scale.x))
                    floats.append(Float(scale.y))
                    floats.append(Float(scale.z))

                    // Deterministic step integration (damped harmonic + seeded excitation)
                    let targetPos = SIMD3<Double>(
                        actor.x + sin(t * 2.8 + actorSeed) * 0.22,
                        max(0.05, actor.y + cos(t * 5.6 + actorSeed) * 0.05),
                        actor.z + sin(t * 1.9 + actorSeed * 2.0) * 0.10
                    )
                    let stiffness = 14.0
                    let damping = 3.2
                    let accel = (targetPos - pos) * stiffness - vel * damping
                    vel += accel * dt
                    pos += vel * dt
                    euler.y = actor.yawDeg + sin(t * 1.9 + actorSeed) * 28.0
                    euler.z = actor.rollDeg + cos(t * 2.7 + actorSeed) * 18.0
                }

                let blob = floats.withUnsafeBufferPointer { Data(buffer: $0) }
                let row = BakedTrackRow(
                    id: kernel.id,
                    targetDomain: "actors",
                    targetId: actor.id,
                    sampleHz: sampleHz,
                    frameCount: frameCount,
                    seed: seed,
                    inputsSha256: hash,
                    samplesBlob: blob
                )
                try db.upsertBakedTrack(row)
                written.append(row)
            }
        }
        return written
    }

    /// O(1) random-access evaluation of a baked trajectory at timestamp `t`.
    public static func evaluateTrack(_ track: BakedTrackRow, at t: Double) -> BakedTransformSample? {
        let totalFloats = track.samplesBlob.count / MemoryLayout<Float>.size
        let availableFrames = totalFloats / floatsPerSample
        guard availableFrames >= 1 else { return nil }

        let exactIndex = max(0.0, t * track.sampleHz)
        let idx0 = min(availableFrames - 1, Int(floor(exactIndex)))
        let idx1 = min(availableFrames - 1, idx0 + 1)
        let frac = exactIndex - Double(idx0)

        return track.samplesBlob.withUnsafeBytes { rawBuf -> BakedTransformSample in
            let floatPtr = rawBuf.bindMemory(to: Float.self)
            func readSample(_ frameIdx: Int) -> BakedTransformSample {
                let base = frameIdx * floatsPerSample
                return BakedTransformSample(
                    position: SIMD3<Double>(Double(floatPtr[base + 0]), Double(floatPtr[base + 1]), Double(floatPtr[base + 2])),
                    eulerDeg: SIMD3<Double>(Double(floatPtr[base + 3]), Double(floatPtr[base + 4]), Double(floatPtr[base + 5])),
                    scale: SIMD3<Double>(Double(floatPtr[base + 6]), Double(floatPtr[base + 7]), Double(floatPtr[base + 8]))
                )
            }
            let s0 = readSample(idx0)
            if idx0 == idx1 || frac <= 1e-9 {
                return s0
            }
            let s1 = readSample(idx1)
            return BakedTransformSample(
                position: s0.position + (s1.position - s0.position) * frac,
                eulerDeg: s0.eulerDeg + (s1.eulerDeg - s0.eulerDeg) * frac,
                scale: s0.scale + (s1.scale - s0.scale) * frac
            )
        }
    }
}
