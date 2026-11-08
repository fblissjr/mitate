import Foundation
import simd

public struct StageStateCache: Sendable {
    public let slate: SlateRow
    public let beats: [BeatRow]
    public let bibles: [String: StyleBibleRow]
    public let sizes: [String: SizeRow]
    public let actors: [ActorRow]
    public let props: [String: PropRow]
    public let characters: [String: CharacterRow]
    public let subjects: [String: SubjectRow]
    public let shots: [ShotRow]
    public let cues: [CueRow]
    public let warpSegments: [WarpSegmentRow]
    public let bakedTracks: [String: BakedTrackRow]

    public init(db: StageDB) throws {
        self.slate = try db.loadSlate()
        self.beats = try db.loadBeats()
        self.bibles = try db.loadStyleBibles()
        self.sizes = try db.loadSizes()
        self.actors = try db.loadActors()
        self.props = try db.loadProps()
        self.characters = try db.loadCharacters()
        self.subjects = try db.loadSubjects()
        self.shots = try db.loadShots()
        self.cues = try db.loadCues()
        self.warpSegments = try db.loadWarpSegments()
        self.bakedTracks = try db.loadBakedTracks()
    }
}

public enum StageEvaluator {
    /// Pure, order-independent O(1) evaluation of `shot.db` at timestamp `t`.
    public static func evaluate(db: StageDB, at t: Double) throws -> StageSnapshot {
        let cache = try StageStateCache(db: db)
        return evaluate(cache: cache, at: t)
    }

    public static func evaluate(cache: StageStateCache, at t: Double) -> StageSnapshot {
        let clock = BeatAddressing.resolveClock(
            t: t,
            beats: cache.beats,
            warpSegments: cache.warpSegments,
            fallbackDuration: cache.slate.fallbackDurSec
        )
        let evalT = clock.tWarped
        let bible = cache.bibles[cache.slate.activeBible] ?? StyleBibleRow(
            id: "workshop",
            backdropMode: "solid_color",
            backdropColor: "#141619",
            exposureEv: 0.0,
            contrast: 1.0,
            roughnessFloor: 0.04,
            colorTransform: "agx",
            lensMm: 50.0,
            cameraEnergy: "locked",
            swayAmp: 1.0,
            cutWhipSec: 0.16,
            cutBlendSec: 0.80,
            bloomStrength: 0.0,
            bloomThreshold: 0.9,
            dofFstop: nil,
            outlineWidth: 0.0,
            paletteJson: "{}"
        )

        // Group cues by actor_id
        let cuesByActor = Dictionary(grouping: cache.cues, by: \.actorId)

        // First pass: evaluate local transforms & channels per actor at `evalT`
        struct LocalActorEval {
            var row: ActorRow
            var pos: SIMD3<Double>
            var eulerDeg: SIMD3<Double>
            var scale: SIMD3<Double>
            var scaleGate: Double
            var gaitVamp: Double
        }

        var locals: [String: LocalActorEval] = [:]
        for actor in cache.actors {
            var pos = SIMD3<Double>(actor.x, actor.y, actor.z)
            var euler = SIMD3<Double>(actor.pitchDeg, actor.yawDeg, actor.rollDeg)
            var scale = SIMD3<Double>(actor.scaleX, actor.scaleY, actor.scaleZ)
            var scaleGate = actor.scaleGate
            var gaitVamp = 0.0

            // Apply baked track if present for this actor or its kinematics kernel
            if let track = cache.bakedTracks[actor.id] ?? actor.kinematicsKernel.flatMap({ cache.bakedTracks[$0] }),
               let sample = BakeEngine.evaluateTrack(track, at: evalT) {
                pos = sample.position
                euler = sample.eulerDeg
                scale = sample.scale
            }

            // Apply closed-form cue_sheet rows in deterministic id order
            if let actorCues = cuesByActor[actor.id] {
                for cue in actorCues {
                    guard let val = evaluateCueValue(cue: cue, t: evalT, beats: cache.beats, totalDuration: clock.totalDuration) else {
                        continue
                    }
                    switch cue.channel {
                    case "x", "tx": pos.x = val
                    case "y", "ty": pos.y = val
                    case "z", "tz": pos.z = val
                    case "pitch_deg", "rx": euler.x = val
                    case "yaw_deg", "ry": euler.y = val
                    case "roll_deg", "rz": euler.z = val
                    case "scale_x", "sx": scale.x = max(1e-4, val)
                    case "scale_y", "sy": scale.y = max(1e-4, val)
                    case "scale_z", "sz": scale.z = max(1e-4, val)
                    case "scale_gate": scaleGate = max(0.0, val)
                    case "gait_vamp": gaitVamp = min(max(val, 0.0), 1.0)
                    default: break
                    }
                }
            }

            locals[actor.id] = LocalActorEval(
                row: actor,
                pos: pos,
                eulerDeg: euler,
                scale: scale,
                scaleGate: scaleGate,
                gaitVamp: gaitVamp
            )
        }

        // Second pass: resolve parent hierarchy topologically
        var evaluatedActors: [String: EvaluatedActor] = [:]
        var evaluatedCharacters: [String: EvaluatedCharacterPose] = [:]

        func resolveActor(_ id: String, visited: Set<String> = []) -> EvaluatedActor? {
            if let existing = evaluatedActors[id] {
                return existing
            }
            guard let local = locals[id], !visited.contains(id) else {
                return nil
            }
            var nextVisited = visited
            nextVisited.insert(id)

            var worldPos = local.pos
            var worldEuler = local.eulerDeg
            var worldScale = local.scale
            var parentVisible = true

            if let pid = local.row.parentId, let parent = resolveActor(pid, visited: nextVisited) {
                worldScale = parent.worldScale * local.scale
                worldEuler = parent.worldEulerDeg + local.eulerDeg
                let rotatedLocal = rotateYawPitchRoll(local.pos * parent.worldScale, eulerDeg: parent.worldEulerDeg)
                worldPos = parent.worldPosition + rotatedLocal
                parentVisible = parent.effectiveVisible
            }

            let effectiveGate = local.scaleGate
            let effectiveVisible = parentVisible && local.row.visible && (effectiveGate >= 1e-4)
            let gatedScale = effectiveVisible ? (worldScale * effectiveGate) : SIMD3<Double>(repeating: 0.0)

            let bounds: AABB3D
            if let charRow = cache.characters[id] {
                let charPose = CharacterRig.evaluatePose(
                    character: charRow,
                    worldPos: worldPos,
                    gaitVamp: local.gaitVamp
                )
                evaluatedCharacters[id] = charPose
                bounds = charPose.worldBounds
            } else {
                bounds = computePropBounds(
                    prop: cache.props[id],
                    worldPos: worldPos,
                    worldScale: effectiveVisible ? gatedScale : worldScale
                )
            }

            let eval = EvaluatedActor(
                id: id,
                parentId: local.row.parentId,
                role: local.row.role,
                localPosition: local.pos,
                localEulerDeg: local.eulerDeg,
                localScale: local.scale,
                worldPosition: worldPos,
                worldEulerDeg: worldEuler,
                worldScale: gatedScale,
                scaleGate: effectiveGate,
                gaitVamp: local.gaitVamp,
                effectiveVisible: effectiveVisible,
                worldBounds: bounds
            )
            evaluatedActors[id] = eval
            return eval
        }

        for actor in cache.actors {
            _ = resolveActor(actor.id)
        }

        // Third pass: apply `aim_at` orientation overrides after all world positions are known
        for actor in cache.actors {
            if let targetId = actor.aimAt,
               let selfEval = evaluatedActors[actor.id],
               let targetEval = evaluatedActors[targetId] {
                let delta = targetEval.worldPosition - selfEval.worldPosition
                let lenXZ = hypot(delta.x, delta.z)
                if lenXZ > 1e-5 || abs(delta.y) > 1e-5 {
                    let yawDeg = atan2(delta.x, delta.z) * 180.0 / .pi
                    let pitchDeg = atan2(delta.y, max(1e-5, lenXZ)) * 180.0 / .pi
                    let aimed = SIMD3<Double>(pitchDeg, yawDeg, actor.bankDeg)
                    evaluatedActors[actor.id] = EvaluatedActor(
                        id: selfEval.id,
                        parentId: selfEval.parentId,
                        role: selfEval.role,
                        localPosition: selfEval.localPosition,
                        localEulerDeg: selfEval.localEulerDeg,
                        localScale: selfEval.localScale,
                        worldPosition: selfEval.worldPosition,
                        worldEulerDeg: aimed,
                        worldScale: selfEval.worldScale,
                        scaleGate: selfEval.scaleGate,
                        gaitVamp: selfEval.gaitVamp,
                        effectiveVisible: selfEval.effectiveVisible,
                        worldBounds: selfEval.worldBounds
                    )
                }
            }
        }

        let camera = CameraSolver.solveCamera(
            t: evalT,
            slate: cache.slate,
            bible: bible,
            beats: cache.beats,
            sizes: cache.sizes,
            subjects: cache.subjects,
            shots: cache.shots,
            actors: evaluatedActors,
            characters: evaluatedCharacters
        )

        return StageSnapshot(
            clock: clock,
            slate: cache.slate,
            bible: bible,
            actors: evaluatedActors,
            characters: evaluatedCharacters,
            camera: camera
        )
    }

    public static func cueTimeWindow(
        cue: CueRow,
        beats: [BeatRow],
        totalDuration: Double
    ) -> (t0: Double, t1: Double) {
        let baseStart: Double
        if let beatId = cue.beatId, let bStart = BeatAddressing.beatAt(id: beatId, frac: cue.beatFrac, beats: beats) {
            baseStart = bStart + (cue.offsetSec ?? 0.0)
        } else {
            baseStart = cue.offsetSec ?? 0.0
        }

        let baseEnd: Double
        if let dur = cue.durSec {
            baseEnd = baseStart + dur
        } else if let endBeatId = cue.endBeatId,
                  let bEnd = BeatAddressing.beatAt(id: endBeatId, frac: cue.endBeatFrac ?? 1.0, beats: beats) {
            baseEnd = bEnd
        } else if let beatId = cue.beatId,
                  let bEnd = BeatAddressing.beatAt(id: beatId, frac: cue.endBeatFrac ?? 1.0, beats: beats) {
            baseEnd = bEnd
        } else {
            baseEnd = totalDuration
        }
        return (baseStart, max(baseStart + 1e-5, baseEnd))
    }

    private static func evaluateCueValue(
        cue: CueRow,
        t: Double,
        beats: [BeatRow],
        totalDuration: Double
    ) -> Double? {
        let (t0, t1) = cueTimeWindow(cue: cue, beats: beats, totalDuration: totalDuration)
        if let expr = cue.proceduralExpr, !expr.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            if t < t0 || t > t1 { return nil }
            return BeatAddressing.evaluateExpression(expr, t: t, tWarped: t)
        }
        if cue.curve == "bump" {
            if t < t0 || t > t1 { return cue.startVal }
            let u = (t - t0) / (t1 - t0)
            let env = BeatAddressing.evalCurve("bump", u: u)
            return cue.startVal + (cue.endVal - cue.startVal) * env
        }
        if t < t0 {
            return nil
        }
        let u = min(max((t - t0) / (t1 - t0), 0.0), 1.0)
        let k = BeatAddressing.evalCurve(cue.curve, u: u)
        return cue.startVal + (cue.endVal - cue.startVal) * k
    }

    private static func computePropBounds(
        prop: PropRow?,
        worldPos: SIMD3<Double>,
        worldScale: SIMD3<Double>
    ) -> AABB3D {
        guard let prop else {
            let half = SIMD3<Double>(repeating: 0.5) * worldScale
            return AABB3D(min: worldPos - half, max: worldPos + half)
        }
        let halfLocal: SIMD3<Double>
        switch prop.shape {
        case "sphere":
            halfLocal = SIMD3<Double>(repeating: prop.radiusM)
        case "gear", "ring", "torus":
            // Spur gear / ring sitting in XY plane (axis along Z)
            halfLocal = SIMD3<Double>(prop.radiusM, prop.radiusM, prop.depthM * 0.5)
        case "cylinder", "cone":
            halfLocal = SIMD3<Double>(prop.radiusM, prop.heightM * 0.5, prop.radiusM)
        case "capsule":
            halfLocal = SIMD3<Double>(prop.radiusM, prop.heightM * 0.5 + prop.radiusM, prop.radiusM)
        case "plane":
            halfLocal = SIMD3<Double>(prop.widthM * 0.5, max(0.02, prop.heightM * 0.5), prop.depthM * 0.5)
        case "text3d":
            let charCount = Double(max(1, (prop.textString ?? "Text").count))
            halfLocal = SIMD3<Double>(charCount * prop.heightM * 0.32, prop.heightM * 0.5, prop.extrudeM * 0.5)
        default:
            halfLocal = SIMD3<Double>(prop.widthM * 0.5, prop.heightM * 0.5, prop.depthM * 0.5)
        }
        let scaledHalf = halfLocal * worldScale
        return AABB3D(min: worldPos - scaledHalf, max: worldPos + scaledHalf)
    }

    private static func rotateYawPitchRoll(_ v: SIMD3<Double>, eulerDeg: SIMD3<Double>) -> SIMD3<Double> {
        let rx = eulerDeg.x * .pi / 180.0
        let ry = eulerDeg.y * .pi / 180.0
        let rz = eulerDeg.z * .pi / 180.0

        // Roll (Z)
        let x1 = v.x * cos(rz) - v.y * sin(rz)
        let y1 = v.x * sin(rz) + v.y * cos(rz)
        let z1 = v.z

        // Pitch (X)
        let x2 = x1
        let y2 = y1 * cos(rx) - z1 * sin(rx)
        let z2 = y1 * sin(rx) + z1 * cos(rx)

        // Yaw (Y)
        let x3 = x2 * cos(ry) + z2 * sin(ry)
        let y3 = y2
        let z3 = -x2 * sin(ry) + z2 * cos(ry)

        return SIMD3<Double>(x3, y3, z3)
    }
}
