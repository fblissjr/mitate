import Foundation
import simd

public enum CameraSolver {
    public struct ResolvedSubject: Sendable, Equatable {
        public let id: String
        public let bounds: AABB3D
        public let aimPoint: SIMD3<Double>
        public let facingYawDeg: Double
    }

    public static func resolveSubject(
        _ subject: SubjectRow,
        actors: [String: EvaluatedActor],
        characters: [String: EvaluatedCharacterPose]
    ) -> ResolvedSubject {
        var memberIds: [String] = []
        if let data = subject.memberActorsJson.data(using: .utf8),
           let decoded = try? JSONDecoder().decode([String].self, from: data) {
            memberIds.append(contentsOf: decoded)
        }
        if let primary = subject.actorId, !primary.isEmpty, !memberIds.contains(primary) {
            memberIds.insert(primary, at: 0)
        }

        let primaryActor = subject.actorId.flatMap { actors[$0] } ?? memberIds.compactMap { actors[$0] }.first
        // Characters face +X in local space (yaw 0 -> facing +X, which is +90 deg relative to +Z); props use yawDeg.
        let facingYawDeg = primaryActor?.worldEulerDeg.y ?? 0.0

        if subject.extentMode == "auto_bounds", !memberIds.isEmpty {
            var unionBox: AABB3D?
            for id in memberIds {
                if let charPose = characters[id] {
                    unionBox = unionBox.map { $0.union(charPose.worldBounds) } ?? charPose.worldBounds
                } else if let act = actors[id] {
                    unionBox = unionBox.map { $0.union(act.worldBounds) } ?? act.worldBounds
                }
            }
            if var box = unionBox {
                box.max.y += subject.headroomM
                let sz = box.size
                let aimY = box.min.y + sz.y * subject.aimYFrac
                let aim = SIMD3<Double>(box.center.x, aimY, box.center.z)
                return ResolvedSubject(id: subject.id, bounds: box, aimPoint: aim, facingYawDeg: facingYawDeg)
            }
        }

        // Fallback or `declared_named` mode
        let center = primaryActor?.worldPosition ?? SIMD3<Double>(0.0, subject.heightM * 0.5, 0.0)
        let halfW = max(0.05, subject.widthM * 0.5)
        let halfD = max(0.05, max(subject.depthM, subject.widthM) * 0.5)
        let totalH = max(0.1, subject.heightM + subject.headroomM)
        let minPt = SIMD3<Double>(center.x - halfW, center.y - subject.heightM * 0.5, center.z - halfD)
        let maxPt = SIMD3<Double>(center.x + halfW, minPt.y + totalH, center.z + halfD)
        let box = AABB3D(min: minPt, max: maxPt)
        let aim = SIMD3<Double>(center.x, minPt.y + totalH * subject.aimYFrac, center.z)
        return ResolvedSubject(id: subject.id, bounds: box, aimPoint: aim, facingYawDeg: facingYawDeg)
    }

    public static func solveCamera(
        t: Double,
        slate: SlateRow,
        bible: StyleBibleRow,
        beats: [BeatRow],
        sizes: [String: SizeRow],
        subjects: [String: SubjectRow],
        shots: [ShotRow],
        actors: [String: EvaluatedActor],
        characters: [String: EvaluatedCharacterPose]
    ) -> EvaluatedCamera {
        let aspect = Double(max(1, slate.width)) / Double(max(1, slate.height))
        let totalDur = BeatAddressing.totalDuration(beats: beats, fallbackDuration: slate.fallbackDurSec)

        // Resolve each shot's start timestamp tStart
        struct ResolvedShotEntry {
            let row: ShotRow
            let t0: Double
            var t1: Double
        }
        var timeline: [ResolvedShotEntry] = shots.map { s in
            let start = BeatAddressing.beatAt(id: s.beatId, frac: s.beatFrac, beats: beats) ?? 0.0
            return ResolvedShotEntry(row: s, t0: start, t1: totalDur)
        }.sorted { a, b in
            if abs(a.t0 - b.t0) > 1e-6 { return a.t0 < b.t0 }
            return a.row.seqOrder < b.row.seqOrder
        }
        if timeline.count > 1 {
            for i in 0..<(timeline.count - 1) {
                timeline[i].t1 = max(timeline[i].t0 + 1e-3, timeline[i + 1].t0)
            }
        }

        guard !timeline.isEmpty else {
            // Fallback to active_camera actor or default 50mm studio camera
            if let camId = slate.activeCamera, let camActor = actors[camId] {
                let yawRad = camActor.worldEulerDeg.y * .pi / 180.0
                let pitchRad = camActor.worldEulerDeg.x * .pi / 180.0
                let forward = SIMD3<Double>(
                    -sin(yawRad) * cos(pitchRad),
                    sin(pitchRad),
                    -cos(yawRad) * cos(pitchRad)
                )
                return EvaluatedCamera(
                    shotId: nil,
                    subjectId: nil,
                    sizeRung: "FSA",
                    eye: camActor.worldPosition,
                    target: camActor.worldPosition + forward * 5.0,
                    up: SIMD3<Double>(0, 1, 0),
                    fovYDeg: 39.6,
                    focalLengthMm: bible.lensMm,
                    fStop: bible.dofFstop ?? 4.0,
                    focusDistanceM: 5.0,
                    aspectRatio: aspect,
                    energyMode: bible.cameraEnergy
                )
            }
            return EvaluatedCamera(
                shotId: nil,
                subjectId: nil,
                sizeRung: "FSA",
                eye: SIMD3<Double>(0, 1.8, 5.0),
                target: SIMD3<Double>(0, 1.0, 0),
                up: SIMD3<Double>(0, 1, 0),
                fovYDeg: 39.6,
                focalLengthMm: bible.lensMm,
                fStop: bible.dofFstop ?? 4.0,
                focusDistanceM: 5.0,
                aspectRatio: aspect,
                energyMode: bible.cameraEnergy
            )
        }

        var activeIdx = timeline.count - 1
        for i in 0..<timeline.count {
            if t >= timeline[i].t0 && t < timeline[i].t1 {
                activeIdx = i
                break
            } else if t < timeline[0].t0 {
                activeIdx = 0
                break
            }
        }

        let current = timeline[activeIdx]
        let shotSpan = max(1e-3, current.t1 - current.t0)
        let shotU = min(max((t - current.t0) / shotSpan, 0.0), 1.0)
        let smoothU = shotU * shotU * (3.0 - 2.0 * shotU)

        let rawPose = solveSingleShot(
            shot: current.row,
            shotU: smoothU,
            t: t,
            aspect: aspect,
            slate: slate,
            bible: bible,
            sizes: sizes,
            subjects: subjects,
            actors: actors,
            characters: characters
        )

        // Optional cut blend/whip transition from previous shot
        if activeIdx > 0 && current.row.cutKind != "hard" {
            let windowSec = current.row.cutKind == "whip" ? max(0.04, bible.cutWhipSec) : max(0.08, bible.cutBlendSec)
            let dt = t - current.t0
            if dt >= 0.0 && dt < windowSec {
                let prev = timeline[activeIdx - 1]
                let prevPose = solveSingleShot(
                    shot: prev.row,
                    shotU: 1.0,
                    t: t,
                    aspect: aspect,
                    slate: slate,
                    bible: bible,
                    sizes: sizes,
                    subjects: subjects,
                    actors: actors,
                    characters: characters
                )
                let alpha = dt / windowSec
                let blend = current.row.cutKind == "whip"
                    ? (1.0 - pow(1.0 - alpha, 3.0))
                    : (alpha * alpha * (3.0 - 2.0 * alpha))
                return EvaluatedCamera(
                    shotId: rawPose.shotId,
                    subjectId: rawPose.subjectId,
                    sizeRung: rawPose.sizeRung,
                    eye: prevPose.eye + (rawPose.eye - prevPose.eye) * blend,
                    target: prevPose.target + (rawPose.target - prevPose.target) * blend,
                    up: SIMD3<Double>(0, 1, 0),
                    fovYDeg: prevPose.fovYDeg + (rawPose.fovYDeg - prevPose.fovYDeg) * blend,
                    focalLengthMm: prevPose.focalLengthMm + (rawPose.focalLengthMm - prevPose.focalLengthMm) * blend,
                    fStop: rawPose.fStop,
                    focusDistanceM: prevPose.focusDistanceM + (rawPose.focusDistanceM - prevPose.focusDistanceM) * blend,
                    aspectRatio: aspect,
                    energyMode: rawPose.energyMode
                )
            }
        }

        return rawPose
    }

    private static func solveSingleShot(
        shot: ShotRow,
        shotU: Double,
        t: Double,
        aspect: Double,
        slate: SlateRow,
        bible: StyleBibleRow,
        sizes: [String: SizeRow],
        subjects: [String: SubjectRow],
        actors: [String: EvaluatedActor],
        characters: [String: EvaluatedCharacterPose]
    ) -> EvaluatedCamera {
        let size1 = sizes[shot.sizeRung] ?? SizeRow(rung: "FSA", frameFrac: 0.70, anchorY: 0.50, fovDeg: 50.0, description: "")
        let size2 = shot.size2Rung.flatMap { sizes[$0] } ?? size1

        let frameFrac = size1.frameFrac + (size2.frameFrac - size1.frameFrac) * shotU
        let defaultAnchorY = size1.anchorY + (size2.anchorY - size1.anchorY) * shotU
        let anchorY = shot.anchorY ?? defaultAnchorY

        let focalMm = shot.fovMm ?? bible.lensMm
        let sensorHeightMm = 24.0
        let fovYRad = 2.0 * atan(sensorHeightMm / (2.0 * max(1.0, focalMm)))
        let fovYDeg = fovYRad * 180.0 / .pi
        let fovXRad = 2.0 * atan(tan(fovYRad * 0.5) * aspect)

        let subjRow = subjects[shot.subjectId] ?? SubjectRow(
            id: shot.subjectId,
            actorId: shot.subjectId,
            memberActorsJson: "[]",
            extentMode: "auto_bounds",
            heightM: 2.0,
            widthM: 2.0,
            depthM: 2.0,
            headroomM: 0.15,
            aimYFrac: 0.50,
            extentNote: nil
        )
        let resolvedSubj = resolveSubject(subjRow, actors: actors, characters: characters)
        let boxSize = resolvedSubj.bounds.size
        let H = max(0.15, boxSize.y)
        let W = max(0.15, boxSize.x)
        let D = max(0.15, boxSize.z)

        let angle1 = shot.angleDeg
        let angle2 = shot.angle2Deg ?? angle1
        let relAzimuthDeg = angle1 + (angle2 - angle1) * shotU
        // Compose shot azimuth with subject's facing direction
        let worldAzimuthRad = (resolvedSubj.facingYawDeg + relAzimuthDeg) * .pi / 180.0
        let elevRad = shot.elevDeg * .pi / 180.0

        // Effective horizontal span projected perpendicular to the camera view ray
        let projectedSpan = abs(W * cos(worldAzimuthRad)) + abs(D * sin(worldAzimuthRad))
        let halfDepthAlongView = 0.5 * (abs(W * sin(worldAzimuthRad)) + abs(D * cos(worldAzimuthRad)))
        let distV = (H / max(0.05, frameFrac)) / (2.0 * tan(fovYRad * 0.5))
        let distH = (projectedSpan / max(0.05, frameFrac)) / (2.0 * tan(fovXRad * 0.5))
        let distance = max(0.35, max(distV, distH) + halfDepthAlongView)

        // Bias vertical aim slightly downward so the subject sits comfortably above the v > 0.88 caption band
        let aimY = resolvedSubj.bounds.min.y + H * max(0.15, anchorY - 0.06)
        var target = SIMD3<Double>(
            resolvedSubj.bounds.center.x + shot.anchorX * projectedSpan * 0.35,
            aimY,
            resolvedSubj.bounds.center.z
        )

        let horizDist = distance * cos(elevRad)
        var eye = SIMD3<Double>(
            target.x + sin(worldAzimuthRad) * horizDist,
            target.y + distance * sin(elevRad),
            target.z + cos(worldAzimuthRad) * horizDist
        )

        // Deterministic camera energy sway (pure function of t and slate.randomSeed)
        let energy = shot.cameraEnergy ?? bible.cameraEnergy
        if energy != "locked" && bible.swayAmp > 0.0 {
            let seedPhase = Double(slate.randomSeed % 997) * 0.173
            let freq = energy == "handheld" ? 3.4 : 0.85
            let amp = (energy == "handheld" ? 0.035 : 0.015) * bible.swayAmp
            let dx = sin(t * freq + seedPhase) * amp + cos(t * freq * 1.7 + seedPhase * 2.1) * (amp * 0.4)
            let dy = cos(t * freq * 1.3 + seedPhase * 0.7) * (amp * 0.7)
            eye.x += dx
            eye.y += dy
            target.y += dy * 0.35
        }

        // Focus distance (rack focus support via focus_subject_id)
        var focusDist = simd_length(target - eye)
        if let focusSubjId = shot.focusSubjectId, let fSubjRow = subjects[focusSubjId] {
            let resolvedFocus = resolveSubject(fSubjRow, actors: actors, characters: characters)
            focusDist = max(0.1, simd_length(resolvedFocus.aimPoint - eye))
        }

        return EvaluatedCamera(
            shotId: shot.id,
            subjectId: shot.subjectId,
            sizeRung: shot.sizeRung,
            eye: eye,
            target: target,
            up: SIMD3<Double>(0, 1, 0),
            fovYDeg: fovYDeg,
            focalLengthMm: focalMm,
            fStop: bible.dofFstop ?? 4.0,
            focusDistanceM: focusDist,
            aspectRatio: aspect,
            energyMode: energy
        )
    }

    /// Projects a 3D world point into normalized screen space `(u, v, ndcDepth)`:
    /// `u ∈ [0, 1]` left-to-right, `v ∈ [0, 1]` top-to-bottom, `ndcDepth > 0` in front of camera.
    public static func projectToScreen(worldPoint: SIMD3<Double>, camera: EvaluatedCamera) -> SIMD3<Double> {
        let forward = simd_normalize(camera.target - camera.eye)
        let right = simd_normalize(simd_cross(forward, camera.up))
        let trueUp = simd_cross(right, forward)

        let rel = worldPoint - camera.eye
        let camX = simd_dot(rel, right)
        let camY = simd_dot(rel, trueUp)
        let camZ = simd_dot(rel, forward) // positive in front of camera

        guard camZ > 1e-4 else {
            return SIMD3<Double>(-1.0, -1.0, camZ)
        }
        let fovYRad = camera.fovYDeg * .pi / 180.0
        let halfTanY = tan(fovYRad * 0.5)
        let halfTanX = halfTanY * camera.aspectRatio

        let ndcX = camX / (camZ * halfTanX)
        let ndcY = camY / (camZ * halfTanY)

        let u = 0.5 + 0.5 * ndcX
        let v = 0.5 - 0.5 * ndcY
        return SIMD3<Double>(u, v, camZ)
    }
}
