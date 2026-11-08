import Foundation
import simd

public enum CharacterRig {
    public struct AnatomicalIssue: Sendable, Codable, Equatable {
        public let code: String
        public let message: String
        public let fixHint: String
    }

    /// Validates anatomical constraints from the character scaffold doctrine:
    /// 1. `hind_upper + hind_lower > hip_h`
    /// 2. For quadrupeds: `fore_upper + fore_lower > shoulder_h` (where `shoulder_h = hip_h + cos(torso_tilt)*torso_len`)
    /// 3. `shoulder_w / 2 > chest_r` (so hanging arms/forelimbs do not embed in the torso)
    public static func validateProportions(_ c: CharacterRow) -> [AnatomicalIssue] {
        var issues: [AnatomicalIssue] = []
        if c.hindUpper + c.hindLower <= c.hipH {
            issues.append(AnatomicalIssue(
                code: "CHARACTER_HIND_HYPEREXTENSION",
                message: "Character '\(c.actorId)' has hind_upper+hind_lower (\(c.hindUpper + c.hindLower)) <= hip_h (\(c.hipH)), causing IK hyperextension.",
                fixHint: "Increase hind_upper/hind_lower or lower hip_h in `characters`."
            ))
        }
        let tiltRad = c.torsoTiltDeg * .pi / 180.0
        let shoulderH = c.hipH + cos(tiltRad) * c.torsoLen
        if c.quadruped && (c.foreUpper + c.foreLower <= shoulderH) {
            issues.append(AnatomicalIssue(
                code: "CHARACTER_FORE_HYPEREXTENSION",
                message: "Quadruped '\(c.actorId)' has fore_upper+fore_lower (\(c.foreUpper + c.foreLower)) <= shoulder height (\(String(format: "%.2f", shoulderH))).",
                fixHint: "Increase fore_upper/fore_lower or increase torso_tilt_deg (~75..85 deg for quadrupeds) in `characters`."
            ))
        }
        if (c.shoulderW * 0.5) <= c.chestR {
            issues.append(AnatomicalIssue(
                code: "CHARACTER_SHOULDER_EMBEDDED",
                message: "Character '\(c.actorId)' has shoulder_w/2 (\(c.shoulderW * 0.5)) <= chest_r (\(c.chestR)), embedding forelimbs inside the chest shell.",
                fixHint: "Set shoulder_w > 2 * chest_r in `characters`."
            ))
        }
        return issues
    }

    /// Analytic two-bone IK in the character's sagittal plane (XY, +X forward, +Y up).
    public static func solveLimb(
        attachWorld: SIMD3<Double>,
        upperLen: Double,
        lowerLen: Double,
        targetWorld: SIMD3<Double>,
        bendSign: Double = 1.0,
        planted: Bool
    ) -> LimbPose {
        let dx = targetWorld.x - attachWorld.x
        let dy = targetWorld.y - attachWorld.y
        let rawDist = hypot(dx, dy)
        let maxReach = max(1e-4, (upperLen + lowerLen) - 1e-4)
        let minReach = abs(upperLen - lowerLen) + 1e-4
        let dist = min(max(rawDist, minReach), maxReach)

        let baseAngle = atan2(dx, -dy)
        let cosKnee = min(max(
            (upperLen * upperLen + dist * dist - lowerLen * lowerLen) / (2.0 * upperLen * dist),
            -1.0
        ), 1.0)
        let kneeOffset = acos(cosKnee) * bendSign
        let upperAngle = baseAngle + kneeOffset

        let kneeWorld = SIMD3<Double>(
            attachWorld.x + sin(upperAngle) * upperLen,
            attachWorld.y - cos(upperAngle) * upperLen,
            attachWorld.z
        )
        let footDirX = targetWorld.x - kneeWorld.x
        let footDirY = targetWorld.y - kneeWorld.y
        let lowerAngle = atan2(footDirX, -footDirY)
        let reachedWorld = SIMD3<Double>(
            kneeWorld.x + sin(lowerAngle) * lowerLen,
            kneeWorld.y - cos(lowerAngle) * lowerLen,
            targetWorld.z
        )

        return LimbPose(
            attachWorld: attachWorld,
            kneeOrElbowWorld: kneeWorld,
            footOrHandWorld: reachedWorld,
            upperAngleRad: upperAngle,
            lowerAngleRad: lowerAngle - upperAngle,
            planted: planted
        )
    }

    /// Plant-grid foot target from distance travelled `s` (never wall clock `t`), so planted feet hold ground position.
    public static func footTarget(
        attachX: Double,
        attachZ: Double,
        groundY: Double,
        s: Double,
        phase: Double,
        stride: Double,
        swingLift: Double,
        vAmp: Double
    ) -> (pos: SIMD3<Double>, planted: Bool) {
        let clampedAmp = min(max(vAmp, 0.0), 1.0)
        let restOffset = (phase - 0.25) * 0.35 * stride
        let restTarget = SIMD3<Double>(attachX + restOffset, groundY, attachZ)
        if clampedAmp < 1e-4 {
            return (restTarget, true)
        }

        let cyclePos = (s / max(0.05, stride)) + phase
        let frac = cyclePos - floor(cyclePos)
        // Stance phase [0.0 .. 0.55]: foot locked to ground grid cell
        let isPlanted = frac < 0.55
        let localX: Double
        let liftY: Double
        if isPlanted {
            let stanceU = frac / 0.55
            localX = (0.5 - stanceU) * stride * 0.55
            liftY = 0.0
        } else {
            let swingU = (frac - 0.55) / 0.45
            let smoothU = swingU * swingU * (3.0 - 2.0 * swingU)
            localX = (-0.5 + smoothU) * stride * 0.55
            liftY = sin(swingU * .pi) * swingLift
        }
        let activeTarget = SIMD3<Double>(attachX + localX, groundY + liftY, attachZ)
        let blended = restTarget + (activeTarget - restTarget) * clampedAmp
        return (blended, isPlanted)
    }

    public static func evaluatePose(
        character c: CharacterRow,
        worldPos: SIMD3<Double>,
        gaitVamp: Double
    ) -> EvaluatedCharacterPose {
        let s = worldPos.x - c.walkStartX
        let stride = max(0.1, c.strideM)
        let vAmp = min(max(gaitVamp, 0.0), 1.0)
        let bobPhase = sin(.pi * s / stride)
        let bobY = abs(bobPhase) * 0.04 * vAmp

        let tiltRad = c.torsoTiltDeg * .pi / 180.0
        let shoulderDX = sin(tiltRad) * c.torsoLen
        let shoulderDY = cos(tiltRad) * c.torsoLen
        let groundY = worldPos.y

        // Attach frames stay on `root` (un-bobbed) so planted feet never slide vertically when body bobs!
        let hlAttach = SIMD3<Double>(worldPos.x, groundY + c.hipH, worldPos.z - c.hipW * 0.5)
        let hrAttach = SIMD3<Double>(worldPos.x, groundY + c.hipH, worldPos.z + c.hipW * 0.5)
        let flAttach = SIMD3<Double>(worldPos.x + shoulderDX, groundY + c.hipH + shoulderDY, worldPos.z - c.shoulderW * 0.5)
        let frAttach = SIMD3<Double>(worldPos.x + shoulderDX, groundY + c.hipH + shoulderDY, worldPos.z + c.shoulderW * 0.5)

        var limbs: [String: LimbPose] = [:]
        if c.quadruped {
            // Lateral-sequence quadruped walk: HL 0.0, FL 0.25, HR 0.50, FR 0.75
            let hlT = footTarget(attachX: hlAttach.x, attachZ: hlAttach.z, groundY: groundY, s: s, phase: 0.00, stride: stride, swingLift: c.stepLiftM, vAmp: vAmp)
            let flT = footTarget(attachX: flAttach.x, attachZ: flAttach.z, groundY: groundY, s: s, phase: 0.25, stride: stride, swingLift: c.stepLiftM, vAmp: vAmp)
            let hrT = footTarget(attachX: hrAttach.x, attachZ: hrAttach.z, groundY: groundY, s: s, phase: 0.50, stride: stride, swingLift: c.stepLiftM, vAmp: vAmp)
            let frT = footTarget(attachX: frAttach.x, attachZ: frAttach.z, groundY: groundY, s: s, phase: 0.75, stride: stride, swingLift: c.stepLiftM, vAmp: vAmp)

            limbs["HL"] = solveLimb(attachWorld: hlAttach, upperLen: c.hindUpper, lowerLen: c.hindLower, targetWorld: hlT.pos, bendSign: -1.0, planted: hlT.planted)
            limbs["FL"] = solveLimb(attachWorld: flAttach, upperLen: c.foreUpper, lowerLen: c.foreLower, targetWorld: flT.pos, bendSign: 1.0, planted: flT.planted)
            limbs["HR"] = solveLimb(attachWorld: hrAttach, upperLen: c.hindUpper, lowerLen: c.hindLower, targetWorld: hrT.pos, bendSign: -1.0, planted: hrT.planted)
            limbs["FR"] = solveLimb(attachWorld: frAttach, upperLen: c.foreUpper, lowerLen: c.foreLower, targetWorld: frT.pos, bendSign: 1.0, planted: frT.planted)
        } else {
            // Biped: HL 0.0, HR 0.50; forelimbs swing as arms
            let hlT = footTarget(attachX: hlAttach.x, attachZ: hlAttach.z, groundY: groundY, s: s, phase: 0.00, stride: stride, swingLift: c.stepLiftM, vAmp: vAmp)
            let hrT = footTarget(attachX: hrAttach.x, attachZ: hrAttach.z, groundY: groundY, s: s, phase: 0.50, stride: stride, swingLift: c.stepLiftM, vAmp: vAmp)
            limbs["HL"] = solveLimb(attachWorld: hlAttach, upperLen: c.hindUpper, lowerLen: c.hindLower, targetWorld: hlT.pos, bendSign: 1.0, planted: hlT.planted)
            limbs["HR"] = solveLimb(attachWorld: hrAttach, upperLen: c.hindUpper, lowerLen: c.hindLower, targetWorld: hrT.pos, bendSign: 1.0, planted: hrT.planted)

            let armSwing = bobPhase * 0.25 * vAmp
            let armReachY = groundY + c.hipH + shoulderDY - (c.foreUpper + c.foreLower) * 0.88
            let flHand = SIMD3<Double>(flAttach.x + armSwing, armReachY, flAttach.z)
            let frHand = SIMD3<Double>(frAttach.x - armSwing, armReachY, frAttach.z)
            limbs["FL"] = solveLimb(attachWorld: flAttach, upperLen: c.foreUpper, lowerLen: c.foreLower, targetWorld: flHand, bendSign: -1.0, planted: false)
            limbs["FR"] = solveLimb(attachWorld: frAttach, upperLen: c.foreUpper, lowerLen: c.foreLower, targetWorld: frHand, bendSign: -1.0, planted: false)
        }

        let headCenter = SIMD3<Double>(
            worldPos.x + shoulderDX + sin(tiltRad * 0.5) * c.neckLen + c.muzzleLen * 0.3,
            groundY + c.hipH + shoulderDY + bobY + cos(tiltRad * 0.5) * c.neckLen + c.headR,
            worldPos.z
        )
        let centerXOffset = c.quadruped ? (shoulderDX * 0.5) : 0.0

        // Compute exact posed 3D world AABB across pelvis, chest, head, muzzle, tail, and all 4 limbs
        let minX = min(worldPos.x - c.pelvisR - c.tailLen, worldPos.x + shoulderDX - c.chestR) - c.footLen * 0.5
        let maxX = max(worldPos.x + c.pelvisR, headCenter.x + c.headR + c.muzzleLen) + c.footLen * 0.5
        let minY = groundY
        let maxY = headCenter.y + c.headR + (c.furShells > 0 ? c.furLengthM : 0.0)
        let halfZ = max(c.shoulderW, c.hipW) * 0.5 + max(c.chestR, c.pelvisR) * 0.5

        var bounds = AABB3D(
            min: SIMD3<Double>(minX, minY, worldPos.z - halfZ),
            max: SIMD3<Double>(maxX, maxY, worldPos.z + halfZ)
        )
        for limb in limbs.values {
            let footBox = AABB3D(
                min: limb.footOrHandWorld - SIMD3<Double>(c.footLen * 0.5, 0.0, c.hindR),
                max: limb.footOrHandWorld + SIMD3<Double>(c.footLen * 0.5, c.footH, c.hindR)
            )
            bounds.formUnion(footBox)
        }

        return EvaluatedCharacterPose(
            actorId: c.actorId,
            rootPosition: worldPos,
            bodyOffset: SIMD3<Double>(0.0, bobY, 0.0),
            headCenter: headCenter,
            centerXOffset: centerXOffset,
            distanceTravelled: s,
            gaitEnvelope: vAmp,
            gaitBobPhase: bobPhase,
            limbs: limbs,
            worldBounds: bounds
        )
    }
}
