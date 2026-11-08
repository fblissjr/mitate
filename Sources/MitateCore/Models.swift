import Foundation
import simd

public struct StageError: Error, Sendable, Codable, Equatable {
    public let code: String
    public let message: String
    public let sqlError: String?
    public let pointer: String?

    public init(code: String, message: String, sqlError: String? = nil, pointer: String? = nil) {
        self.code = code
        self.message = message
        self.sqlError = sqlError
        self.pointer = pointer
    }
}

public struct AABB3D: Sendable, Codable, Equatable {
    public var min: SIMD3<Double>
    public var max: SIMD3<Double>

    public init(min: SIMD3<Double>, max: SIMD3<Double>) {
        self.min = min
        self.max = max
    }

    public var center: SIMD3<Double> {
        (min + max) * 0.5
    }

    public var size: SIMD3<Double> {
        simd_max(SIMD3<Double>.zero, max - min)
    }

    public mutating func formUnion(_ other: AABB3D) {
        min = simd_min(min, other.min)
        max = simd_max(max, other.max)
    }

    public func union(_ other: AABB3D) -> AABB3D {
        AABB3D(min: simd_min(min, other.min), max: simd_max(max, other.max))
    }

    public func translated(by offset: SIMD3<Double>) -> AABB3D {
        AABB3D(min: min + offset, max: max + offset)
    }

    public func scaled(around pivot: SIMD3<Double>, by scale: SIMD3<Double>) -> AABB3D {
        let half = size * 0.5 * scale
        let c = pivot + (center - pivot) * scale
        return AABB3D(min: c - half, max: c + half)
    }
}

// MARK: - Raw Database Row Models

public struct BeatRow: Sendable, Codable, Equatable {
    public var id: String
    public var seqOrder: Int
    public var durSec: Double
    public var t0: Double
    public var t1: Double
    public var caption: String?
    public var act: String?
    public var flashAt: Double?
    public var flashWidth: Double
}

public struct StyleBibleRow: Sendable, Codable, Equatable {
    public var id: String
    public var backdropMode: String
    public var backdropColor: String
    public var exposureEv: Double
    public var contrast: Double
    public var roughnessFloor: Double
    public var colorTransform: String
    public var lensMm: Double
    public var cameraEnergy: String
    public var swayAmp: Double
    public var cutWhipSec: Double
    public var cutBlendSec: Double
    public var bloomStrength: Double
    public var bloomThreshold: Double
    public var dofFstop: Double?
    public var outlineWidth: Double
    public var paletteJson: String
}

public struct SizeRow: Sendable, Codable, Equatable {
    public var rung: String
    public var frameFrac: Double
    public var anchorY: Double
    public var fovDeg: Double
    public var description: String
}

public struct SlateRow: Sendable, Codable, Equatable {
    public var productionTitle: String
    public var width: Int
    public var height: Int
    public var fps: Int
    public var fallbackDurSec: Double
    public var titleCardText: String?
    public var subtitleText: String?
    public var activeCamera: String?
    public var activeBible: String
    public var exposureEv: Double
    public var contrast: Double
    public var sppDraft: Int
    public var sppFinal: Int
    public var randomSeed: Int
}

public struct ActorRow: Sendable, Codable, Equatable {
    public var id: String
    public var parentId: String?
    public var role: String
    public var x: Double
    public var y: Double
    public var z: Double
    public var pitchDeg: Double
    public var yawDeg: Double
    public var rollDeg: Double
    public var scaleX: Double
    public var scaleY: Double
    public var scaleZ: Double
    public var scaleGate: Double
    public var aimAt: String?
    public var bankDeg: Double
    public var visible: Bool
    public var kinematicsKernel: String?
}

public struct PropRow: Sendable, Codable, Equatable {
    public var actorId: String
    public var shape: String
    public var shaderId: String
    public var radiusM: Double
    public var innerRadiusM: Double
    public var widthM: Double
    public var heightM: Double
    public var depthM: Double
    public var toothCount: Int
    public var bevelRadiusM: Double
    public var subdivLevel: Int
    public var textString: String?
    public var extrudeM: Double
    public var csgTree: String
    public var paramsJson: String
}

public struct CharacterRow: Sendable, Codable, Equatable {
    public var actorId: String
    public var preset: String
    public var quadruped: Bool
    public var hipH: Double
    public var torsoLen: Double
    public var torsoTiltDeg: Double
    public var pelvisR: Double
    public var chestR: Double
    public var shoulderW: Double
    public var hipW: Double
    public var neckLen: Double
    public var neckSegs: Int
    public var headR: Double
    public var muzzleLen: Double
    public var tailLen: Double
    public var tailSegs: Int
    public var foreUpper: Double
    public var foreLower: Double
    public var foreR: Double
    public var hindUpper: Double
    public var hindLower: Double
    public var hindR: Double
    public var footLen: Double
    public var footH: Double
    public var furShells: Int
    public var furLengthM: Double
    public var walkStartX: Double
    public var strideM: Double
    public var stepLiftM: Double
    public var shaderMapJson: String
}

public struct SubjectRow: Sendable, Codable, Equatable {
    public var id: String
    public var actorId: String?
    public var memberActorsJson: String
    public var extentMode: String
    public var heightM: Double
    public var widthM: Double
    public var depthM: Double
    public var headroomM: Double
    public var aimYFrac: Double
    public var extentNote: String?
}

public struct ShotRow: Sendable, Codable, Equatable {
    public var id: Int
    public var seqOrder: Int
    public var beatId: String
    public var beatFrac: Double
    public var subjectId: String
    public var sizeRung: String
    public var angleDeg: Double
    public var elevDeg: Double
    public var fovMm: Double?
    public var size2Rung: String?
    public var angle2Deg: Double?
    public var focusSubjectId: String?
    public var cameraEnergy: String?
    public var anchorY: Double?
    public var anchorX: Double
    public var cutKind: String
    public var matchPrev: Bool
    public var cutReason: String?
}

public struct CueRow: Sendable, Codable, Equatable {
    public var id: Int
    public var actorId: String
    public var channel: String
    public var beatId: String?
    public var beatFrac: Double
    public var endBeatId: String?
    public var endBeatFrac: Double?
    public var offsetSec: Double?
    public var durSec: Double?
    public var startVal: Double
    public var endVal: Double
    public var curve: String
    public var proceduralExpr: String?
}

public struct WarpSegmentRow: Sendable, Codable, Equatable {
    public var id: Int
    public var beatId: String
    public var beatFrac: Double
    public var durSec: Double
    public var rate: Double
}

public struct GPUKernelRow: Sendable, Codable, Equatable {
    public var id: String
    public var hookSlot: String
    public var purityMode: String
    public var entrySymbol: String
    public var threadgroupSize: Int
    public var mslSource: String
    public var uniformsJson: String
}

public struct BakedTrackRow: Sendable, Codable, Equatable {
    public var id: String
    public var targetDomain: String
    public var targetId: String
    public var sampleHz: Double
    public var frameCount: Int
    public var seed: Int
    public var inputsSha256: String
    public var samplesBlob: Data
}

public struct SurfaceShaderRow: Sendable, Codable, Equatable {
    public var id: String
    public var mode: String
    public var albedo: String
    public var metalness: Double
    public var roughness: Double
    public var ior: Double
    public var clarity: Double
    public var abbeDispersion: Double
    public var subsurfaceWeight: Double
    public var subsurfaceMfp: String
    public var clearcoat: Double
    public var fuzzWeight: Double
    public var fuzzTint: String
    public var glowColor: String
    public var glowNits: Double
    public var opacity: Double
    public var proceduralKernel: String?
}

public struct LampRow: Sendable, Codable, Equatable {
    public var actorId: String
    public var type: String
    public var kelvin: Double
    public var lumens: Double
    public var tintHex: String
    public var spreadAngle: Double
    public var softness: Double
    public var widthM: Double
    public var heightM: Double
    public var volumetricDust: Double
    public var castShadows: Bool
}

public struct AtmosphereRow: Sendable, Codable, Equatable {
    public var id: String
    public var actorId: String?
    public var mode: String
    public var fogDensity: Double
    public var anisotropy: Double
    public var baseHeightM: Double
    public var falloff: Double
    public var scatterHex: String
}

public struct FinishingChainRow: Sendable, Codable, Equatable {
    public var toneMapper: String
    public var exposureEv: Double
    public var contrast: Double
    public var saturation: Double
    public var bloomIntensity: Double
    public var bloomThreshold: Double
    public var halationWeight: Double
    public var chromaticAberration: Double
    public var filmGrainIntensity: Double
    public var vignetteWeight: Double
    public var customKernel: String?
}

// MARK: - Evaluated Snapshot Models (Pure Function of t)

public struct StageClock: Sendable, Codable, Equatable {
    public let t: Double
    public let tWarped: Double
    public let totalDuration: Double
    public let activeBeatId: String?
    public let beatFrac: Double
    public let beatSec: Double
    public let caption: String?
    public let flashIntensity: Double
}

public struct LimbPose: Sendable, Codable, Equatable {
    public let attachWorld: SIMD3<Double>
    public let kneeOrElbowWorld: SIMD3<Double>
    public let footOrHandWorld: SIMD3<Double>
    public let upperAngleRad: Double
    public let lowerAngleRad: Double
    public let planted: Bool
}

public struct EvaluatedCharacterPose: Sendable, Codable, Equatable {
    public let actorId: String
    public let rootPosition: SIMD3<Double>
    public let bodyOffset: SIMD3<Double>
    public let headCenter: SIMD3<Double>
    public let centerXOffset: Double
    public let distanceTravelled: Double
    public let gaitEnvelope: Double
    public let gaitBobPhase: Double
    public let limbs: [String: LimbPose]
    public let worldBounds: AABB3D
}

public struct EvaluatedActor: Sendable, Codable, Equatable {
    public let id: String
    public let parentId: String?
    public let role: String
    public let localPosition: SIMD3<Double>
    public let localEulerDeg: SIMD3<Double>
    public let localScale: SIMD3<Double>
    public let worldPosition: SIMD3<Double>
    public let worldEulerDeg: SIMD3<Double>
    public let worldScale: SIMD3<Double>
    public let scaleGate: Double
    public let gaitVamp: Double
    public let effectiveVisible: Bool
    public let worldBounds: AABB3D
}

public struct EvaluatedCamera: Sendable, Codable, Equatable {
    public let shotId: Int?
    public let subjectId: String?
    public let sizeRung: String
    public let eye: SIMD3<Double>
    public let target: SIMD3<Double>
    public let up: SIMD3<Double>
    public let fovYDeg: Double
    public let focalLengthMm: Double
    public let fStop: Double
    public let focusDistanceM: Double
    public let aspectRatio: Double
    public let energyMode: String
}

public struct StageSnapshot: Sendable, Codable, Equatable {
    public let clock: StageClock
    public let slate: SlateRow
    public let bible: StyleBibleRow
    public let actors: [String: EvaluatedActor]
    public let characters: [String: EvaluatedCharacterPose]
    public let camera: EvaluatedCamera
}
