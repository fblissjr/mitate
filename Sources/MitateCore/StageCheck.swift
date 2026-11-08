import Foundation
import simd

public struct LintFinding: Sendable, Codable, Equatable {
    public let code: String
    public let severity: String // "error" or "warning"
    public let target: String
    public let message: String
    public let fixHint: String
    public let pointer: String

    public init(
        code: String,
        severity: String,
        target: String,
        message: String,
        fixHint: String,
        pointer: String
    ) {
        self.code = code
        self.severity = severity
        self.target = target
        self.message = message
        self.fixHint = fixHint
        self.pointer = pointer
    }
}

public struct CheckReport: Sendable, Codable, Equatable {
    public let ok: Bool
    public let errorCount: Int
    public let warningCount: Int
    public let totalDurationSec: Double
    public let beatCount: Int
    public let shotCount: Int
    public let actorCount: Int
    public let findings: [LintFinding]
}

public struct FramingProbeEntry: Sendable, Codable, Equatable {
    public let actorId: String
    public let role: String
    public let worldPosition: [Double]
    public let worldBoundsMin: [Double]
    public let worldBoundsMax: [Double]
    public let screenBBox: [Double] // [uMin, vMin, uMax, vMax]
    public let depthM: Double
    public let inSafeFrame: Bool
    public let inCaptionBand: Bool

    public init(
        actorId: String,
        role: String,
        worldPosition: [Double],
        worldBoundsMin: [Double],
        worldBoundsMax: [Double],
        screenBBox: [Double],
        depthM: Double,
        inSafeFrame: Bool,
        inCaptionBand: Bool
    ) {
        self.actorId = actorId
        self.role = role
        self.worldPosition = worldPosition
        self.worldBoundsMin = worldBoundsMin
        self.worldBoundsMax = worldBoundsMax
        self.screenBBox = screenBBox
        self.depthM = depthM
        self.inSafeFrame = inSafeFrame
        self.inCaptionBand = inCaptionBand
    }
}

public struct ContactSeparationReport: Sendable, Codable, Equatable {
    public let actorA: String
    public let actorB: String
    public let gapX: Double
    public let gapY: Double
    public let gapZ: Double
    public let euclideanGapM: Double
    public let overlapsInCamera2D: Bool
    public let contactState: String // "touching", "interpenetrating", "separated", "false_2d_contact"
}

public struct ProbeReport: Sendable, Codable, Equatable {
    public let t: Double
    public let tWarped: Double
    public let unwarpedPresentationT: Double?
    public let activeBeatId: String?
    public let beatFrac: Double
    public let caption: String?
    public let camera: EvaluatedCamera
    public let framing: [FramingProbeEntry]
    public let contact: ContactSeparationReport?
}

public enum StageCheck {
    public static func validate(db: StageDB) throws -> CheckReport {
        var findings: [LintFinding] = []

        // 1. Foreign key integrity check
        let fkErrors = try db.checkForeignKeys()
        for fk in fkErrors {
            findings.append(LintFinding(
                code: "FOREIGN_KEY_VIOLATION",
                severity: "error",
                target: "\(fk.table)[rowid=\(fk.rowid)]",
                message: "Row in '\(fk.table)' references missing parent row in '\(fk.parent)'.",
                fixHint: "Insert the missing parent row in '\(fk.parent)' or delete the orphan row in '\(fk.table)'.",
                pointer: "wiki/soundstage-schema.md"
            ))
        }

        // 2. SQL View Lint (`v_set_lint`: CPS > 30, bare declared extents, unbaked sim kernels)
        let viewRows = try db.loadSetLintView()
        for r in viewRows {
            let ptr: String
            switch r.code {
            case "CPS_OVER_30": ptr = "wiki/time-and-beats.md"
            case "BARE_DECLARED_EXTENT": ptr = "wiki/cinematography-and-rigging.md"
            case "UNBAKED_SIM_KERNEL": ptr = "wiki/metal-engine-and-kernels.md"
            default: ptr = "wiki/instruments-and-review.md"
            }
            findings.append(LintFinding(
                code: r.code,
                severity: r.severity,
                target: r.target,
                message: r.message,
                fixHint: r.fixHint,
                pointer: ptr
            ))
        }

        let slate = try db.loadSlate()
        let beats = try db.loadBeats()
        let actors = try db.loadActors()
        let characters = try db.loadCharacters()
        let shots = try db.loadShots()
        let cues = try db.loadCues()
        let kernels = try db.loadGPUKernels()
        let bakedTracks = try db.loadBakedTracks()
        let totalDur = BeatAddressing.totalDuration(beats: beats, fallbackDuration: slate.fallbackDurSec)

        // 3. Stale baked_tracks SHA-256 verification
        let actorByKernel = Dictionary(grouping: actors, by: { $0.kinematicsKernel ?? "" })
        for kernel in kernels where kernel.purityMode == "baked_sim" {
            let boundActors = actorByKernel[kernel.id] ?? []
            for act in boundActors {
                if let track = bakedTracks[act.id] ?? bakedTracks[kernel.id] {
                    let expectedHash = BakeEngine.computeInputsHash(
                        kernel: kernel,
                        actor: act,
                        seed: track.seed,
                        sampleHz: track.sampleHz,
                        totalDuration: totalDur
                    )
                    if track.inputsSha256 != expectedHash {
                        findings.append(LintFinding(
                            code: "STALE_BAKED_TRACK",
                            severity: "error",
                            target: "baked_tracks.\(track.id)",
                            message: "Baked track '\(track.id)' inputs_sha256 does not match current kernel/actor/duration state.",
                            fixHint: "Re-run `mitate bake <shot.db>` after modifying kernel source, actor start transform, or beat durations.",
                            pointer: "wiki/time-and-beats.md"
                        ))
                    }
                }
            }
        }

        // 4. Beat & Shot timeline checks
        if beats.isEmpty {
            findings.append(LintFinding(
                code: "EMPTY_BEATS",
                severity: "warning",
                target: "beats",
                message: "No rows in `beats`; scene uses slate.fallback_dur_sec (\(slate.fallbackDurSec)s).",
                fixHint: "Insert named narrative spans into `beats` so shots and cues address relative beat coordinates.",
                pointer: "wiki/time-and-beats.md"
            ))
        }

        if !shots.isEmpty && !beats.isEmpty {
            let resolvedShots: [(shot: ShotRow, tStart: Double)] = shots.map { s in
                let t0 = BeatAddressing.beatAt(id: s.beatId, frac: s.beatFrac, beats: beats) ?? 0.0
                return (s, t0)
            }.sorted {
                if abs($0.tStart - $1.tStart) > 1e-6 { return $0.tStart < $1.tStart }
                return $0.shot.seqOrder < $1.shot.seqOrder
            }

            if let first = resolvedShots.first, first.tStart > 0.01 {
                findings.append(LintFinding(
                    code: "UNCOVERED_FIRST_BEAT",
                    severity: "error",
                    target: "shots[seq=\(first.shot.seqOrder)]",
                    message: "First shot starts at t=\(String(format: "%.2f", first.tStart))s instead of t=0.0s, leaving opening frames unframed.",
                    fixHint: "Anchor the first shot to the first beat at beat_frac = 0.0.",
                    pointer: "wiki/cinematography-and-rigging.md"
                ))
            }

            // Check match_prev continuity and jump-cut angles across consecutive shots
            for i in 1..<resolvedShots.count {
                let prev = resolvedShots[i - 1].shot
                let curr = resolvedShots[i].shot
                let prevEndRung = prev.size2Rung ?? prev.sizeRung
                let prevEndAngle = prev.angle2Deg ?? prev.angleDeg

                if curr.matchPrev {
                    let sameSubject = (curr.subjectId == prev.subjectId)
                    let sameRung = (curr.sizeRung == prevEndRung)
                    let angleDiff = abs(curr.angleDeg - prevEndAngle)
                    if !sameSubject || !sameRung || angleDiff > 1.0 {
                        findings.append(LintFinding(
                            code: "MATCH_PREV_VIOLATION",
                            severity: "error",
                            target: "shots[seq=\(curr.seqOrder)]",
                            message: "Shot seq=\(curr.seqOrder) sets match_prev=1 but its start framing (\(curr.subjectId), \(curr.sizeRung), \(curr.angleDeg) deg) does not match previous shot's terminal framing (\(prev.subjectId), \(prevEndRung), \(prevEndAngle) deg).",
                            fixHint: "Set shots.subject_id='\(prev.subjectId)', size_rung='\(prevEndRung)', and angle_deg=\(prevEndAngle) on shot seq=\(curr.seqOrder), or set match_prev=0.",
                            pointer: "wiki/cinematography-and-rigging.md"
                        ))
                    }
                } else if curr.cutKind == "hard" && curr.subjectId == prev.subjectId && curr.sizeRung == prevEndRung {
                    let angleDiff = abs(curr.angleDeg - prevEndAngle)
                    if angleDiff < 25.0 {
                        findings.append(LintFinding(
                            code: "JUMP_CUT_WARNING",
                            severity: "warning",
                            target: "shots[seq=\(curr.seqOrder)]",
                            message: "Hard cut between seq=\(prev.seqOrder) and seq=\(curr.seqOrder) on '\(curr.subjectId)' at rung '\(curr.sizeRung)' changes angle by only \(String(format: "%.1f", angleDiff)) deg (< 25 deg 30-degree rule).",
                            fixHint: "Change angle_deg by >= 30 deg, change size_rung, or set match_prev=1 if a continuous camera move was intended.",
                            pointer: "wiki/cinematography-and-rigging.md"
                        ))
                    }
                }
            }
        }

        // 5. Character anatomy & skating-limb envelope checks
        let cuesByActor = Dictionary(grouping: cues, by: \.actorId)
        for charRow in characters.values {
            for issue in CharacterRig.validateProportions(charRow) {
                findings.append(LintFinding(
                    code: issue.code,
                    severity: "error",
                    target: "characters.\(charRow.actorId)",
                    message: issue.message,
                    fixHint: issue.fixHint,
                    pointer: "wiki/cinematography-and-rigging.md"
                ))
            }

            let actorCues = cuesByActor[charRow.actorId] ?? []
            let travelCues = actorCues.filter {
                ["x", "tx", "z", "tz"].contains($0.channel) && (abs($0.endVal - $0.startVal) > 1e-3 || ($0.proceduralExpr != nil))
            }
            let gaitCues = actorCues.filter { $0.channel == "gait_vamp" && $0.endVal > 1e-3 }

            for tCue in travelCues {
                let tWin = StageEvaluator.cueTimeWindow(cue: tCue, beats: beats, totalDuration: totalDur)
                let matchingGait = gaitCues.first { gCue in
                    let gWin = StageEvaluator.cueTimeWindow(cue: gCue, beats: beats, totalDuration: totalDur)
                    return abs(tWin.t0 - gWin.t0) < 0.05 && abs(tWin.t1 - gWin.t1) < 0.05
                }
                if matchingGait == nil {
                    findings.append(LintFinding(
                        code: "CHARACTER_SKATING_LIMBS",
                        severity: "error",
                        target: "characters.\(charRow.actorId)",
                        message: "Character '\(charRow.actorId)' translates on '\(tCue.channel)' across [\(String(format: "%.2f", tWin.t0))s..\(String(format: "%.2f", tWin.t1))s] without a matching `gait_vamp` envelope cue on the same window (causes locked-limb skating).",
                        fixHint: "Add a `gait_vamp` cue in `cue_sheet` for '\(charRow.actorId)' with the exact same beat_id/beat_frac and end_beat_id/end_beat_frac span.",
                        pointer: "wiki/cinematography-and-rigging.md"
                    ))
                }
            }
        }

        // 6. Inert / constant procedural expression check (catches `sin(floor(t*2)*2*pi)` and `sin(quant(t,2)*2*pi)`)
        let sampleFracs: [Double] = [0.0, 0.07, 0.13, 0.21, 0.29, 0.37, 0.46, 0.53, 0.61, 0.72, 0.83, 0.91, 1.0]
        for cue in cues {
            guard let expr = cue.proceduralExpr?.trimmingCharacters(in: .whitespacesAndNewlines),
                  !expr.isEmpty else {
                continue
            }
            let lower = expr.lowercased()
            let mentionsTime = lower.contains("t")
            guard mentionsTime else { continue }

            let win = StageEvaluator.cueTimeWindow(cue: cue, beats: beats, totalDuration: totalDur)
            var minVal = Double.greatestFiniteMagnitude
            var maxVal = -Double.greatestFiniteMagnitude
            for f in sampleFracs {
                let sampleT = win.t0 + f * (win.t1 - win.t0)
                let v = BeatAddressing.evaluateExpression(expr, t: sampleT, tWarped: sampleT)
                minVal = min(minVal, v)
                maxVal = max(maxVal, v)
            }
            if (maxVal - minVal) < 1e-7 {
                findings.append(LintFinding(
                    code: "INERT_PROCEDURAL_EXPRESSION",
                    severity: "error",
                    target: "cue_sheet[id=\(cue.id),actor=\(cue.actorId)]",
                    message: "Procedural expression '\(expr)' on '\(cue.actorId).\(cue.channel)' evaluates to a constant (\(String(format: "%.4f", minVal))) across its entire active window.",
                    fixHint: "Avoid composed periodics that quantize `t` to integer multiples of 2*pi (e.g. `sin(quant(t,2)*2*pi)`); verify non-constancy with `mitate probe`.",
                    pointer: "wiki/time-and-beats.md"
                ))
            }
        }

        let errors = findings.filter { $0.severity == "error" }.count
        let warnings = findings.filter { $0.severity == "warning" }.count

        return CheckReport(
            ok: errors == 0,
            errorCount: errors,
            warningCount: warnings,
            totalDurationSec: totalDur,
            beatCount: beats.count,
            shotCount: shots.count,
            actorCount: actors.count,
            findings: findings
        )
    }

    public static func probe(
        db: StageDB,
        atSpec: String? = nil,
        actorFilter: String? = nil,
        sepPair: (String, String)? = nil,
        unwarpDomainTime: Double? = nil
    ) throws -> ProbeReport {
        let cache = try StageStateCache(db: db)
        let unwarpedT: Double?
        if let domainT = unwarpDomainTime {
            unwarpedT = BeatAddressing.unwarp(
                tWarped: domainT,
                beats: cache.beats,
                segments: cache.warpSegments,
                maxDuration: BeatAddressing.totalDuration(beats: cache.beats, fallbackDuration: cache.slate.fallbackDurSec)
            )
        } else {
            unwarpedT = nil
        }

        let t: Double
        if let atSpec, !atSpec.isEmpty {
            t = try BeatAddressing.parseTimestamp(atSpec, beats: cache.beats, fallbackDuration: cache.slate.fallbackDurSec)
        } else if let unwarpedT {
            t = unwarpedT
        } else {
            t = 0.0
        }

        let snap = StageEvaluator.evaluate(cache: cache, at: t)
        let hasCaption = (snap.clock.caption != nil && !(snap.clock.caption?.isEmpty ?? true))

        var framingEntries: [FramingProbeEntry] = []
        for actorId in snap.actors.keys.sorted() {
            if let filter = actorFilter, !filter.isEmpty, actorId != filter {
                continue
            }
            guard let act = snap.actors[actorId], act.effectiveVisible else { continue }
            if act.role == "camera" || act.role == "lamp" || act.role == "atmosphere" || act.role == "null" {
                if actorFilter == nil { continue }
            }
            let screenBox = projectAABBToScreen(bounds: act.worldBounds, camera: snap.camera)
            let inSafe = screenBox.uMin >= 0.05 && screenBox.uMax <= 0.95 && screenBox.vMin >= 0.05 && screenBox.vMax <= 0.95 && screenBox.depthM > 0.0
            let inCapBand = hasCaption && screenBox.vMax > 0.88 && screenBox.uMax > 0.15 && screenBox.uMin < 0.85

            framingEntries.append(FramingProbeEntry(
                actorId: act.id,
                role: act.role,
                worldPosition: [act.worldPosition.x, act.worldPosition.y, act.worldPosition.z],
                worldBoundsMin: [act.worldBounds.min.x, act.worldBounds.min.y, act.worldBounds.min.z],
                worldBoundsMax: [act.worldBounds.max.x, act.worldBounds.max.y, act.worldBounds.max.z],
                screenBBox: [screenBox.uMin, screenBox.vMin, screenBox.uMax, screenBox.vMax],
                depthM: screenBox.depthM,
                inSafeFrame: inSafe,
                inCaptionBand: inCapBand
            ))
        }

        var contactReport: ContactSeparationReport? = nil
        if let (idA, idB) = sepPair {
            guard let actA = snap.actors[idA] else {
                throw StageError(code: "UNKNOWN_ACTOR", message: "Actor '\(idA)' not found in `actors`.", pointer: "wiki/soundstage-schema.md")
            }
            guard let actB = snap.actors[idB] else {
                throw StageError(code: "UNKNOWN_ACTOR", message: "Actor '\(idB)' not found in `actors`.", pointer: "wiki/soundstage-schema.md")
            }
            contactReport = measureSeparation(actA: actA, actB: actB, camera: snap.camera)
        }

        return ProbeReport(
            t: snap.clock.t,
            tWarped: snap.clock.tWarped,
            unwarpedPresentationT: unwarpedT,
            activeBeatId: snap.clock.activeBeatId,
            beatFrac: snap.clock.beatFrac,
            caption: snap.clock.caption,
            camera: snap.camera,
            framing: framingEntries,
            contact: contactReport
        )
    }

    public static func measureSeparation(
        actA: EvaluatedActor,
        actB: EvaluatedActor,
        camera: EvaluatedCamera
    ) -> ContactSeparationReport {
        let a = actA.worldBounds
        let b = actB.worldBounds

        // Signed axis gap: > 0 means separated along that axis; <= 0 means overlapping/penetrating along that axis
        let gapX = max(a.min.x - b.max.x, b.min.x - a.max.x)
        let gapY = max(a.min.y - b.max.y, b.min.y - a.max.y)
        let gapZ = max(a.min.z - b.max.z, b.min.z - a.max.z)

        let posGapX = max(0.0, gapX)
        let posGapY = max(0.0, gapY)
        let posGapZ = max(0.0, gapZ)
        let euclidean = sqrt(posGapX * posGapX + posGapY * posGapY + posGapZ * posGapZ)

        let projA = projectAABBToScreen(bounds: a, camera: camera)
        let projB = projectAABBToScreen(bounds: b, camera: camera)
        let overlaps2D = (projA.uMin <= projB.uMax && projA.uMax >= projB.uMin) &&
                         (projA.vMin <= projB.vMax && projA.vMax >= projB.vMin)

        let state: String
        if gapX < -0.02 && gapY < -0.02 && gapZ < -0.02 {
            state = "interpenetrating"
        } else if euclidean <= 0.025 {
            state = "touching"
        } else if overlaps2D && euclidean > 0.08 {
            state = "false_2d_contact"
        } else {
            state = "separated"
        }

        return ContactSeparationReport(
            actorA: actA.id,
            actorB: actB.id,
            gapX: gapX,
            gapY: gapY,
            gapZ: gapZ,
            euclideanGapM: euclidean,
            overlapsInCamera2D: overlaps2D,
            contactState: state
        )
    }

    private static func projectAABBToScreen(
        bounds: AABB3D,
        camera: EvaluatedCamera
    ) -> (uMin: Double, vMin: Double, uMax: Double, vMax: Double, depthM: Double) {
        let corners: [SIMD3<Double>] = [
            SIMD3(bounds.min.x, bounds.min.y, bounds.min.z),
            SIMD3(bounds.max.x, bounds.min.y, bounds.min.z),
            SIMD3(bounds.min.x, bounds.max.y, bounds.min.z),
            SIMD3(bounds.max.x, bounds.max.y, bounds.min.z),
            SIMD3(bounds.min.x, bounds.min.y, bounds.max.z),
            SIMD3(bounds.max.x, bounds.min.y, bounds.max.z),
            SIMD3(bounds.min.x, bounds.max.y, bounds.max.z),
            SIMD3(bounds.max.x, bounds.max.y, bounds.max.z)
        ]
        var uMin = 1.0
        var vMin = 1.0
        var uMax = 0.0
        var vMax = 0.0
        var depthSum = 0.0
        var validCount = 0

        for c in corners {
            let p = CameraSolver.projectToScreen(worldPoint: c, camera: camera)
            if p.z > 1e-4 {
                uMin = min(uMin, p.x)
                vMin = min(vMin, p.y)
                uMax = max(uMax, p.x)
                vMax = max(vMax, p.y)
                depthSum += p.z
                validCount += 1
            }
        }
        if validCount == 0 {
            return (0, 0, 0, 0, -1.0)
        }
        return (uMin, vMin, uMax, vMax, depthSum / Double(validCount))
    }
}
