import Foundation
import CoreGraphics
import CoreText
import ImageIO
import UniformTypeIdentifiers
import AVFoundation
import CoreVideo
import simd
import MitateCore

public struct ExposureMeterReport: Sendable, Codable, Equatable {
    public let meanLuminance: Double
    public let dynamicRangeStops: Double
    public let clippedWhitePct: Double
    public let crushedBlackPct: Double
}

public struct FrameDiffReport: Sendable, Codable, Equatable {
    public let identical: Bool
    public let changedPixels: Int
    public let bbox: [Int]? // [xMin, yMin, xMax, yMax]
    public let maxChannelDelta: Int
    public let psnrDb: Double
}

public struct RenderedFrame: Sendable {
    public let width: Int
    public let height: Int
    public let rgbaBytes: [UInt8] // width * height * 4 (RGBA8)
    public let meter: ExposureMeterReport
    public let framing: [FramingProbeEntry]
}

public struct QuadRenderReport: Sendable, Codable, Equatable {
    public let t: Double
    public let activeBeatId: String?
    public let beatFrac: Double
    public let outputPath: String
    public let meter: ExposureMeterReport
    public let framing: [FramingProbeEntry]
}

public struct SheetRenderReport: Sendable, Codable, Equatable {
    public let frac: Double
    public let nocap: Bool
    public let beatCount: Int
    public let outputPath: String
    public let squintOutputPath: String
    public let meter: ExposureMeterReport
}

public struct StripRenderReport: Sendable, Codable, Equatable {
    public let fromT: Double
    public let toT: Double
    public let frameCount: Int
    public let outputPath: String
    public let medianFrameDiff: Double
    public let maxFrameDiff: Double
}

public struct SmokeSampleDiff: Sendable, Codable, Equatable {
    public let t: Double
    public let diff: FrameDiffReport
}

public struct SmokeReport: Sendable, Codable, Equatable {
    public let ok: Bool
    public let check: CheckReport
    public let sampleCount: Int
    public let determinismPassed: Bool
    public let sampleDiffs: [SmokeSampleDiff]
    public let meter: ExposureMeterReport
}

public struct ShootReport: Sendable, Codable, Equatable {
    public let mode: String
    public let outputPath: String
    public let frameCount: Int
    public let fps: Int
    public let durationSec: Double
    public let meter: ExposureMeterReport
}

public enum StageRenderer {

    // MARK: - Deterministic Single-Frame Beauty Renderer

    public static func renderFrame(
        cache: StageStateCache,
        at t: Double,
        width: Int = 640,
        height: Int = 360,
        includeOverlays: Bool = true
    ) -> RenderedFrame {
        let snap = StageEvaluator.evaluate(cache: cache, at: t)
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        var pixels = [UInt8](repeating: 0, count: width * height * 4)

        pixels.withUnsafeMutableBytes { rawPtr in
            guard let baseAddress = rawPtr.baseAddress,
                  let ctx = CGContext(
                      data: baseAddress,
                      width: width,
                      height: height,
                      bitsPerComponent: 8,
                      bytesPerRow: width * 4,
                      space: colorSpace,
                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
                  ) else {
                return
            }
            drawCameraBeautyIntoContext(
                ctx: ctx,
                rect: CGRect(x: 0, y: 0, width: width, height: height),
                cache: cache,
                snap: snap,
                includeOverlays: includeOverlays,
                showSafeGuides: false
            )
        }

        // Apply deterministic pixel-level finishing chain (AgX/tone curve, vignette, seeded grain)
        applyDeterministicFinishing(
            pixels: &pixels,
            width: width,
            height: height,
            t: snap.clock.t,
            seed: cache.slate.randomSeed,
            bible: snap.bible,
            finishing: cache.finishing,
            flashIntensity: includeOverlays ? snap.clock.flashIntensity : 0.0
        )

        let meter = computeExposureMeter(pixels: pixels, width: width, height: height)
        let framing = computeFramingEntries(snap: snap)
        return RenderedFrame(width: width, height: height, rgbaBytes: pixels, meter: meter, framing: framing)
    }

    // MARK: - Pass 0: `mitate quad` (2x2 Camera + Top/Front/Side Ortho Blueprint)

    public static func renderQuad(
        db: StageDB,
        atSpec: String? = nil,
        outPath: String,
        width: Int = 1280,
        height: Int = 720
    ) throws -> QuadRenderReport {
        let cache = try StageStateCache(db: db)
        let t: Double
        if let atSpec, !atSpec.isEmpty {
            t = try BeatAddressing.parseTimestamp(atSpec, beats: cache.beats, fallbackDuration: cache.slate.fallbackDurSec)
        } else if let firstBeat = cache.beats.first {
            t = firstBeat.t0 + firstBeat.durSec * 0.5
        } else {
            t = 0.0
        }
        let snap = StageEvaluator.evaluate(cache: cache, at: t)
        let halfW = width / 2
        let halfH = height / 2

        let colorSpace = CGColorSpaceCreateDeviceRGB()
        var pixels = [UInt8](repeating: 0, count: width * height * 4)

        pixels.withUnsafeMutableBytes { rawPtr in
            guard let baseAddress = rawPtr.baseAddress,
                  let ctx = CGContext(
                      data: baseAddress,
                      width: width,
                      height: height,
                      bitsPerComponent: 8,
                      bytesPerRow: width * 4,
                      space: colorSpace,
                      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
                  ) else {
                return
            }

            // Note: CoreGraphics origin (0,0) is bottom-left.
            // Top-Left quadrant: Active Camera Beauty + Safe-Title Guide
            let topLeft = CGRect(x: 0, y: halfH, width: halfW, height: halfH)
            drawCameraBeautyIntoContext(
                ctx: ctx,
                rect: topLeft,
                cache: cache,
                snap: snap,
                includeOverlays: true,
                showSafeGuides: true
            )

            // Top-Right quadrant: Top-Down Orthographic (XZ plane)
            let topRight = CGRect(x: halfW, y: halfH, width: halfW, height: halfH)
            drawOrthoBlueprintIntoContext(
                ctx: ctx,
                rect: topRight,
                plane: .topXZ,
                snap: snap
            )

            // Bottom-Left quadrant: Front Orthographic (XY plane)
            let bottomLeft = CGRect(x: 0, y: 0, width: halfW, height: halfH)
            drawOrthoBlueprintIntoContext(
                ctx: ctx,
                rect: bottomLeft,
                plane: .frontXY,
                snap: snap
            )

            // Bottom-Right quadrant: Right-Side Orthographic (ZY plane)
            let bottomRight = CGRect(x: halfW, y: 0, width: halfW, height: halfH)
            drawOrthoBlueprintIntoContext(
                ctx: ctx,
                rect: bottomRight,
                plane: .sideZY,
                snap: snap
            )

            // Draw quadrant divider lines
            ctx.setStrokeColor(CGColor(red: 0.28, green: 0.32, blue: 0.38, alpha: 1.0))
            ctx.setLineWidth(2.0)
            ctx.move(to: CGPoint(x: CGFloat(halfW), y: 0))
            ctx.addLine(to: CGPoint(x: CGFloat(halfW), y: CGFloat(height)))
            ctx.move(to: CGPoint(x: 0, y: CGFloat(halfH)))
            ctx.addLine(to: CGPoint(x: CGFloat(width), y: CGFloat(halfH)))
            ctx.strokePath()
        }

        try writeImageFile(rgbaBytes: pixels, width: width, height: height, to: outPath)
        let beautyOnly = renderFrame(cache: cache, at: t, width: halfW, height: halfH, includeOverlays: true)

        return QuadRenderReport(
            t: snap.clock.t,
            activeBeatId: snap.clock.activeBeatId,
            beatFrac: snap.clock.beatFrac,
            outputPath: outPath,
            meter: beautyOnly.meter,
            framing: beautyOnly.framing
        )
    }

    // MARK: - `mitate sheet` (Contact Sheet + `.squint.jpg` Companion + `--nocap`)

    public static func renderSheet(
        db: StageDB,
        frac: Double = 0.6,
        nocap: Bool = false,
        cols: Int = 3,
        outPath: String
    ) throws -> SheetRenderReport {
        let cache = try StageStateCache(db: db)
        let beats = cache.beats
        let sampleTimes: [(label: String, t: Double)]
        if beats.isEmpty {
            let dur = cache.slate.fallbackDurSec
            sampleTimes = [("stage@\(String(format: "%.2f", frac))", dur * frac)]
        } else {
            sampleTimes = beats.map { b in
                ("\(b.id)@\(String(format: "%.2f", frac))", b.t0 + b.durSec * min(max(frac, 0.0), 1.0))
            }
        }

        let cellW = 480
        let cellH = 270
        let actualCols = max(1, min(cols, sampleTimes.count))
        let rows = Int(ceil(Double(sampleTimes.count) / Double(actualCols)))
        let sheetW = cellW * actualCols
        let sheetH = cellH * rows

        var sheetPixels = [UInt8](repeating: 20, count: sheetW * sheetH * 4)
        var meters: [ExposureMeterReport] = []

        for (idx, item) in sampleTimes.enumerated() {
            let col = idx % actualCols
            let row = idx / actualCols
            let frame = renderFrame(cache: cache, at: item.t, width: cellW, height: cellH, includeOverlays: !nocap)
            meters.append(frame.meter)
            blitFrame(
                src: frame.rgbaBytes,
                srcW: cellW,
                srcH: cellH,
                dst: &sheetPixels,
                dstW: sheetW,
                dstH: sheetH,
                dstX: col * cellW,
                dstY: row * cellH
            )
        }

        try writeImageFile(rgbaBytes: sheetPixels, width: sheetW, height: sheetH, to: outPath)

        // Generate companion `.squint.jpg` (blurred low-res value-hierarchy strip)
        let squintPath = deriveSquintPath(from: outPath)
        let squintH = 90
        let squintW = max(90, Int(Double(sheetW) * (Double(squintH) / Double(sheetH))))
        let squintPixels = downsampleAndBoxBlur(src: sheetPixels, srcW: sheetW, srcH: sheetH, dstW: squintW, dstH: squintH, blurRadius: 3)
        try writeImageFile(rgbaBytes: squintPixels, width: squintW, height: squintH, to: squintPath)

        let avgMeter = averageMeters(meters)
        return SheetRenderReport(
            frac: frac,
            nocap: nocap,
            beatCount: sampleTimes.count,
            outputPath: outPath,
            squintOutputPath: squintPath,
            meter: avgMeter
        )
    }

    // MARK: - `mitate strip` (Continuity Filmstrip + Frame-Diff Metrics)

    public static func renderStrip(
        db: StageDB,
        fromSpec: String,
        toSpec: String,
        frameCount: Int = 8,
        outPath: String
    ) throws -> StripRenderReport {
        let cache = try StageStateCache(db: db)
        let t0 = try BeatAddressing.parseTimestamp(fromSpec, beats: cache.beats, fallbackDuration: cache.slate.fallbackDurSec)
        let t1 = try BeatAddressing.parseTimestamp(toSpec, beats: cache.beats, fallbackDuration: cache.slate.fallbackDurSec)
        let count = max(2, min(frameCount, 32))

        let cellW = 320
        let cellH = 180
        let cols = min(4, count)
        let rows = Int(ceil(Double(count) / Double(cols)))
        let stripW = cellW * cols
        let stripH = cellH * rows

        var stripPixels = [UInt8](repeating: 16, count: stripW * stripH * 4)
        var frames: [[UInt8]] = []

        for i in 0..<count {
            let u = Double(i) / Double(count - 1)
            let sampleT = t0 + (t1 - t0) * u
            let f = renderFrame(cache: cache, at: sampleT, width: cellW, height: cellH, includeOverlays: true)
            frames.append(f.rgbaBytes)
            let col = i % cols
            let row = i / cols
            blitFrame(
                src: f.rgbaBytes,
                srcW: cellW,
                srcH: cellH,
                dst: &stripPixels,
                dstW: stripW,
                dstH: stripH,
                dstX: col * cellW,
                dstY: row * cellH
            )
        }

        var diffs: [Double] = []
        for i in 1..<frames.count {
            diffs.append(meanNormalizedPixelDiff(frames[i - 1], frames[i]))
        }
        let sortedDiffs = diffs.sorted()
        let medianDiff = sortedDiffs.isEmpty ? 0.0 : sortedDiffs[sortedDiffs.count / 2]
        let maxDiff = sortedDiffs.last ?? 0.0

        try writeImageFile(rgbaBytes: stripPixels, width: stripW, height: stripH, to: outPath)

        return StripRenderReport(
            fromT: t0,
            toT: t1,
            frameCount: count,
            outputPath: outPath,
            medianFrameDiff: (medianDiff * 10000.0).rounded() / 10000.0,
            maxFrameDiff: (maxDiff * 10000.0).rounded() / 10000.0
        )
    }

    // MARK: - `mitate smoke` (Random-Access Seek Determinism + Diff Magnitude BBox)

    public static func runSmoke(
        db: StageDB,
        dumpFramesDir: String? = nil
    ) throws -> SmokeReport {
        let checkReport = try StageCheck.validate(db: db)
        let cache = try StageStateCache(db: db)
        let totalDur = BeatAddressing.totalDuration(beats: cache.beats, fallbackDuration: cache.slate.fallbackDurSec)

        // Build deterministic sample plan covering beat midpoints, beat ends (0.95), and shot cut boundaries
        var sampleTimes: [Double] = []
        if cache.beats.isEmpty {
            sampleTimes = [0.0, totalDur * 0.25, totalDur * 0.5, totalDur * 0.75, totalDur * 0.95]
        } else {
            for b in cache.beats {
                sampleTimes.append(b.t0 + b.durSec * 0.15)
                sampleTimes.append(b.t0 + b.durSec * 0.60)
                sampleTimes.append(b.t0 + b.durSec * 0.95)
            }
        }
        // Deduplicate & sort
        let orderedTimes = Array(Set(sampleTimes.map { ($0 * 1000.0).rounded() / 1000.0 })).sorted()

        let w = 320
        let h = 180

        // Pass 1: Forward sequential evaluation (t0 -> tN)
        var forwardFrames: [Double: RenderedFrame] = [:]
        for t in orderedTimes {
            forwardFrames[t] = renderFrame(cache: cache, at: t, width: w, height: h, includeOverlays: true)
        }

        // Pass 2: Out-of-order shuffled evaluation (interleaving reverse and middle jumps)
        var shuffledTimes: [Double] = []
        var lo = 0
        var hi = orderedTimes.count - 1
        while lo <= hi {
            if lo == hi {
                shuffledTimes.append(orderedTimes[lo])
                break
            }
            shuffledTimes.append(orderedTimes[hi])
            shuffledTimes.append(orderedTimes[lo])
            lo += 1
            hi -= 1
        }

        var sampleDiffs: [SmokeSampleDiff] = []
        var allIdentical = true

        for t in shuffledTimes {
            let outOfOrderFrame = renderFrame(cache: cache, at: t, width: w, height: h, includeOverlays: true)
            let refFrame = forwardFrames[t]!
            let diff = compareFrames(
                frameA: refFrame.rgbaBytes,
                frameB: outOfOrderFrame.rgbaBytes,
                width: w,
                height: h
            )
            if !diff.identical {
                allIdentical = false
                if let dumpDir = dumpFramesDir {
                    try? FileManager.default.createDirectory(atPath: dumpDir, withIntermediateDirectories: true)
                    let base = String(format: "t_%.3f", t)
                    try? writeImageFile(rgbaBytes: refFrame.rgbaBytes, width: w, height: h, to: "\(dumpDir)/\(base)_forward.png")
                    try? writeImageFile(rgbaBytes: outOfOrderFrame.rgbaBytes, width: w, height: h, to: "\(dumpDir)/\(base)_shuffled.png")
                }
            }
            sampleDiffs.append(SmokeSampleDiff(t: t, diff: diff))
        }

        let avgMeter = averageMeters(forwardFrames.values.map(\.meter))
        let overallOk = checkReport.ok && allIdentical

        return SmokeReport(
            ok: overallOk,
            check: checkReport,
            sampleCount: orderedTimes.count,
            determinismPassed: allIdentical,
            sampleDiffs: sampleDiffs.sorted { $0.t < $1.t },
            meter: avgMeter
        )
    }

    /// Computes exact diff magnitude and spatial bounding box between two RGBA8 frames (`VISION.md` diff-magnitude contract).
    public static func compareFrames(
        frameA: [UInt8],
        frameB: [UInt8],
        width: Int,
        height: Int
    ) -> FrameDiffReport {
        let pixelCount = width * height
        guard frameA.count == pixelCount * 4, frameB.count == pixelCount * 4 else {
            return FrameDiffReport(
                identical: false,
                changedPixels: pixelCount,
                bbox: [0, 0, max(0, width - 1), max(0, height - 1)],
                maxChannelDelta: 255,
                psnrDb: 0.0
            )
        }

        var changedPixels = 0
        var xMin = width
        var yMin = height
        var xMax = -1
        var yMax = -1
        var maxDelta = 0
        var sumSqErr: Double = 0.0

        for y in 0..<height {
            let rowBase = y * width * 4
            for x in 0..<width {
                let idx = rowBase + x * 4
                let dr = abs(Int(frameA[idx + 0]) - Int(frameB[idx + 0]))
                let dg = abs(Int(frameA[idx + 1]) - Int(frameB[idx + 1]))
                let db = abs(Int(frameA[idx + 2]) - Int(frameB[idx + 2]))
                let da = abs(Int(frameA[idx + 3]) - Int(frameB[idx + 3]))
                let localMax = max(max(dr, dg), max(db, da))
                if localMax > 0 {
                    changedPixels += 1
                    xMin = min(xMin, x)
                    yMin = min(yMin, y)
                    xMax = max(xMax, x)
                    yMax = max(yMax, y)
                    maxDelta = max(maxDelta, localMax)
                    sumSqErr += Double(dr * dr + dg * dg + db * db)
                }
            }
        }

        if changedPixels == 0 {
            return FrameDiffReport(
                identical: true,
                changedPixels: 0,
                bbox: nil,
                maxChannelDelta: 0,
                psnrDb: 99.99
            )
        }

        let mse = sumSqErr / Double(max(1, pixelCount * 3))
        let psnr = mse > 1e-12 ? (10.0 * log10((255.0 * 255.0) / mse)) : 99.99
        return FrameDiffReport(
            identical: false,
            changedPixels: changedPixels,
            bbox: [xMin, yMin, xMax, yMax],
            maxChannelDelta: maxDelta,
            psnrDb: (psnr * 100.0).rounded() / 100.0
        )
    }

    // MARK: - `mitate shoot` (Stills & Hardware VideoToolbox MP4 / ProRes 4444)

    public static func shoot(
        db: StageDB,
        mode: String = "dailies",
        atSpec: String? = nil,
        outPath: String
    ) throws -> ShootReport {
        let t0 = CFAbsoluteTimeGetCurrent()
        let cache = try StageStateCache(db: db)
        let totalDur = BeatAddressing.totalDuration(beats: cache.beats, fallbackDuration: cache.slate.fallbackDurSec)
        let ext = URL(fileURLWithPath: outPath).pathExtension.lowercased()

        let renderW: Int
        let renderH: Int
        switch mode {
        case "dailies":
            renderW = min(960, cache.slate.width)
            renderH = min(540, cache.slate.height)
        default:
            renderW = cache.slate.width
            renderH = cache.slate.height
        }

        if ext == "png" || ext == "jpg" || ext == "jpeg" {
            let sampleT: Double
            if let atSpec, !atSpec.isEmpty {
                sampleT = try BeatAddressing.parseTimestamp(atSpec, beats: cache.beats, fallbackDuration: cache.slate.fallbackDurSec)
            } else {
                sampleT = totalDur * 0.5
            }
            let frame = renderFrame(cache: cache, at: sampleT, width: renderW, height: renderH, includeOverlays: true)
            try writeImageFile(rgbaBytes: frame.rgbaBytes, width: renderW, height: renderH, to: outPath)
            let elapsedMs = (CFAbsoluteTimeGetCurrent() - t0) * 1000.0
            try? db.recordTake(
                mode: mode,
                renderTimeMs: elapsedMs,
                meanLuminance: frame.meter.meanLuminance,
                clippingPct: frame.meter.clippedWhitePct,
                outputPath: outPath
            )
            return ShootReport(
                mode: mode,
                outputPath: outPath,
                frameCount: 1,
                fps: cache.slate.fps,
                durationSec: totalDur,
                meter: frame.meter
            )
        }

        // Video output (.mp4 or .mov)
        let fps = max(1, cache.slate.fps)
        let totalFrames = max(2, Int(ceil(totalDur * Double(fps))))
        var frames: [RenderedFrame] = []
        frames.reserveCapacity(totalFrames)
        for idx in 0..<totalFrames {
            let t = Double(idx) / Double(fps)
            frames.append(renderFrame(cache: cache, at: t, width: renderW, height: renderH, includeOverlays: true))
        }

        try writeVideoSequence(frames: frames, width: renderW, height: renderH, fps: fps, mode: mode, to: outPath)
        let avgMeter = averageMeters(frames.map(\.meter))
        let elapsedMs = (CFAbsoluteTimeGetCurrent() - t0) * 1000.0
        try? db.recordTake(
            mode: mode,
            renderTimeMs: elapsedMs,
            meanLuminance: avgMeter.meanLuminance,
            clippingPct: avgMeter.clippedWhitePct,
            outputPath: outPath
        )

        return ShootReport(
            mode: mode,
            outputPath: outPath,
            frameCount: totalFrames,
            fps: fps,
            durationSec: totalDur,
            meter: avgMeter
        )
    }

    // MARK: - Internal Drawing & Shading Helpers

    private enum OrthoPlane {
        case topXZ
        case frontXY
        case sideZY
    }

    private static func drawCameraBeautyIntoContext(
        ctx: CGContext,
        rect: CGRect,
        cache: StageStateCache,
        snap: StageSnapshot,
        includeOverlays: Bool,
        showSafeGuides: Bool
    ) {
        ctx.saveGState()
        defer { ctx.restoreGState() }
        ctx.clip(to: rect)

        // 1. Backdrop fill (style_bible backdrop_color or sky gradient)
        let bgRGB = parseHexColor(snap.bible.backdropColor)
        if snap.bible.backdropMode == "physical_sky" {
            let colors = [
                CGColor(red: bgRGB.x * 0.55, green: bgRGB.y * 0.65, blue: bgRGB.z * 0.85, alpha: 1.0),
                CGColor(red: bgRGB.x, green: bgRGB.y, blue: bgRGB.z, alpha: 1.0)
            ] as CFArray
            if let grad = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0.0, 1.0]) {
                ctx.drawLinearGradient(
                    grad,
                    start: CGPoint(x: rect.midX, y: rect.minY),
                    end: CGPoint(x: rect.midX, y: rect.maxY),
                    options: []
                )
            }
        } else {
            ctx.setFillColor(CGColor(red: bgRGB.x, green: bgRGB.y, blue: bgRGB.z, alpha: 1.0))
            ctx.fill(rect)
        }

        // Gather active lamps for photometric shading
        var keyLightDir = simd_normalize(SIMD3<Double>(0.45, 0.75, 0.48))
        var totalLumenScale = 1.0
        var lampColorTint = SIMD3<Double>(1.0, 0.98, 0.94)
        if !cache.lamps.isEmpty {
            var weightedDir = SIMD3<Double>.zero
            var lumenSum = 0.0
            var tintSum = SIMD3<Double>.zero
            for (lampActorId, lamp) in cache.lamps {
                if let lampAct = snap.actors[lampActorId], lampAct.effectiveVisible {
                    let dir = simd_normalize(lampAct.worldPosition - snap.camera.target)
                    weightedDir += dir * lamp.lumens
                    lumenSum += lamp.lumens
                    tintSum += kelvinToRGB(lamp.kelvin) * lamp.lumens
                }
            }
            if lumenSum > 1.0 {
                if simd_length(weightedDir) > 1e-4 {
                    keyLightDir = simd_normalize(weightedDir)
                }
                totalLumenScale = min(2.2, max(0.3, lumenSum / 3200.0))
                lampColorTint = tintSum / lumenSum
            }
        }

        // Sort visible renderable actors back-to-front by camera depth (painter's order with exact projection)
        let visibleActors = snap.actors.values.filter { act in
            guard act.effectiveVisible else { return false }
            if !includeOverlays && cache.props[act.id]?.shape == "text3d" {
                return false
            }
            return act.role == "prop" || act.role == "rig" || act.role == "swarm"
        }.sorted { a, b in
            let da = CameraSolver.projectToScreen(worldPoint: a.worldPosition, camera: snap.camera).z
            let db = CameraSolver.projectToScreen(worldPoint: b.worldPosition, camera: snap.camera).z
            return da > db
        }

        for act in visibleActors {
            if let charPose = snap.characters[act.id], let charRow = cache.characters[act.id] {
                drawCharacterPose(
                    ctx: ctx,
                    rect: rect,
                    charRow: charRow,
                    pose: charPose,
                    camera: snap.camera,
                    keyLightDir: keyLightDir,
                    lampColorTint: lampColorTint,
                    lumenScale: totalLumenScale,
                    outlineWidth: snap.bible.outlineWidth
                )
            } else {
                let prop = cache.props[act.id]
                let shader = prop.flatMap { cache.shaders[$0.shaderId] }
                drawPropActor(
                    ctx: ctx,
                    rect: rect,
                    actor: act,
                    prop: prop,
                    shader: shader,
                    camera: snap.camera,
                    keyLightDir: keyLightDir,
                    lampColorTint: lampColorTint,
                    lumenScale: totalLumenScale,
                    outlineWidth: snap.bible.outlineWidth
                )
            }
        }

        if showSafeGuides {
            let safeRect = rect.insetBy(dx: rect.width * 0.05, dy: rect.height * 0.05)
            ctx.setStrokeColor(CGColor(red: 0.25, green: 0.78, blue: 0.95, alpha: 0.45))
            ctx.setLineWidth(1.0)
            ctx.stroke(safeRect)
            drawLabel(
                ctx: ctx,
                text: "CAM · \(snap.camera.sizeRung) · t=\(String(format: "%.2f", snap.clock.t))s",
                at: CGPoint(x: rect.minX + 10, y: rect.maxY - 22),
                fontSize: 11.0,
                color: CGColor(red: 0.85, green: 0.92, blue: 1.0, alpha: 0.9)
            )
        }

        if includeOverlays, let caption = snap.clock.caption, !caption.isEmpty {
            let pillW = min(rect.width * 0.86, CGFloat(max(180, caption.count * 9 + 28)))
            let pillH: CGFloat = 26.0
            let pillRect = CGRect(
                x: rect.midX - pillW * 0.5,
                y: rect.minY + rect.height * 0.055,
                width: pillW,
                height: pillH
            )
            ctx.setFillColor(CGColor(red: 0.05, green: 0.06, blue: 0.08, alpha: 0.82))
            let path = CGPath(roundedRect: pillRect, cornerWidth: 6, cornerHeight: 6, transform: nil)
            ctx.addPath(path)
            ctx.fillPath()

            drawLabel(
                ctx: ctx,
                text: caption,
                at: CGPoint(x: pillRect.minX + 12, y: pillRect.minY + 6),
                fontSize: 12.0,
                color: CGColor(red: 0.96, green: 0.97, blue: 0.99, alpha: 1.0)
            )
        }
    }

    private static func drawPropActor(
        ctx: CGContext,
        rect: CGRect,
        actor: EvaluatedActor,
        prop: PropRow?,
        shader: SurfaceShaderRow?,
        camera: EvaluatedCamera,
        keyLightDir: SIMD3<Double>,
        lampColorTint: SIMD3<Double>,
        lumenScale: Double,
        outlineWidth: Double
    ) {
        let shape = prop?.shape ?? "cube"
        if shape == "plane" {
            // Draw ground plane horizon / grid polygon
            let b = actor.worldBounds
            let corners = [
                SIMD3(b.min.x, b.max.y, b.min.z),
                SIMD3(b.max.x, b.max.y, b.min.z),
                SIMD3(b.max.x, b.max.y, b.max.z),
                SIMD3(b.min.x, b.max.y, b.max.z)
            ]
            var pts: [CGPoint] = []
            for c in corners {
                let p = CameraSolver.projectToScreen(worldPoint: c, camera: camera)
                if p.z > 0.05 {
                    pts.append(CGPoint(
                        x: rect.minX + CGFloat(p.x) * rect.width,
                        y: rect.minY + CGFloat(1.0 - p.y) * rect.height
                    ))
                }
            }
            if pts.count >= 3 {
                let baseCol = parseHexColor(shader?.albedo ?? "#323842")
                let lit = simd_clamp(baseCol * lampColorTint * (0.42 * lumenScale), SIMD3(repeating: 0.0), SIMD3(repeating: 1.0))
                ctx.setFillColor(CGColor(red: lit.x, green: lit.y, blue: lit.z, alpha: 0.85))
                ctx.beginPath()
                ctx.move(to: pts[0])
                for p in pts.dropFirst() { ctx.addLine(to: p) }
                ctx.closePath()
                ctx.fillPath()
            }
            return
        }

        let centerScreen = CameraSolver.projectToScreen(worldPoint: actor.worldBounds.center, camera: camera)
        guard centerScreen.z > 0.1 else { return }

        let b = actor.worldBounds
        let corners = [
            SIMD3(b.min.x, b.min.y, b.min.z), SIMD3(b.max.x, b.min.y, b.min.z),
            SIMD3(b.min.x, b.max.y, b.min.z), SIMD3(b.max.x, b.max.y, b.min.z),
            SIMD3(b.min.x, b.min.y, b.max.z), SIMD3(b.max.x, b.min.y, b.max.z),
            SIMD3(b.min.x, b.max.y, b.max.z), SIMD3(b.max.x, b.max.y, b.max.z)
        ]
        var uMin = 1.0, vMin = 1.0, uMax = 0.0, vMax = 0.0
        for c in corners {
            let p = CameraSolver.projectToScreen(worldPoint: c, camera: camera)
            if p.z > 0.05 {
                uMin = min(uMin, p.x); vMin = min(vMin, p.y)
                uMax = max(uMax, p.x); vMax = max(vMax, p.y)
            }
        }
        guard uMax > uMin, vMax > vMin else { return }

        let screenRect = CGRect(
            x: rect.minX + CGFloat(uMin) * rect.width,
            y: rect.minY + CGFloat(1.0 - vMax) * rect.height,
            width: max(2.0, CGFloat(uMax - uMin) * rect.width),
            height: max(2.0, CGFloat(vMax - vMin) * rect.height)
        )

        let albedo = parseHexColor(shader?.albedo ?? "#b8bec6")
        let normal = simd_normalize(SIMD3<Double>(
            sin(actor.worldEulerDeg.y * .pi / 180.0),
            0.55,
            cos(actor.worldEulerDeg.y * .pi / 180.0)
        ))
        let ndotl = max(0.18, simd_dot(normal, keyLightDir))
        let mode = shader?.mode ?? "pbr"

        let shadedRGB: SIMD3<Double>
        if mode == "toon" {
            let band = ndotl > 0.72 ? 1.15 : (ndotl > 0.33 ? 0.85 : 0.48)
            shadedRGB = simd_clamp(albedo * band, SIMD3(repeating: 0.0), SIMD3(repeating: 1.0))
        } else {
            let spec = pow(max(0.0, ndotl), 12.0) * (1.0 - (shader?.roughness ?? 0.35)) * 0.35
            shadedRGB = simd_clamp(albedo * lampColorTint * (ndotl * lumenScale) + SIMD3(repeating: spec), SIMD3(repeating: 0.0), SIMD3(repeating: 1.0))
        }

        let alpha = mode == "glass" ? 0.55 : (shader?.opacity ?? 1.0)
        ctx.setFillColor(CGColor(red: shadedRGB.x, green: shadedRGB.y, blue: shadedRGB.z, alpha: alpha))

        if outlineWidth > 0.0 || mode == "toon" {
            ctx.setStrokeColor(CGColor(red: 0.06, green: 0.07, blue: 0.09, alpha: 1.0))
            ctx.setLineWidth(max(1.5, CGFloat(outlineWidth * 45.0)))
        } else {
            ctx.setStrokeColor(CGColor(red: shadedRGB.x * 1.15, green: shadedRGB.y * 1.15, blue: shadedRGB.z * 1.15, alpha: 0.9))
            ctx.setLineWidth(1.0)
        }

        switch shape {
        case "gear":
            let teeth = max(6, prop?.toothCount ?? 12)
            let rollRad = (actor.worldEulerDeg.z + actor.worldEulerDeg.y) * .pi / 180.0
            let cx = screenRect.midX
            let cy = screenRect.midY
            let rxOuter = screenRect.width * 0.50
            let ryOuter = screenRect.height * 0.50
            let rxRoot = rxOuter * 0.84
            let ryRoot = ryOuter * 0.84
            ctx.beginPath()
            let steps = teeth * 4
            for s in 0..<steps {
                let frac = Double(s) / Double(steps)
                let ang = rollRad + frac * 2.0 * .pi
                let inTooth = (s % 4 == 0 || s % 4 == 1)
                let rx = inTooth ? rxOuter : rxRoot
                let ry = inTooth ? ryOuter : ryRoot
                let pt = CGPoint(x: cx + CGFloat(cos(ang)) * rx, y: cy + CGFloat(sin(ang)) * ry)
                if s == 0 { ctx.move(to: pt) } else { ctx.addLine(to: pt) }
            }
            ctx.closePath()
            ctx.fillPath()
            ctx.beginPath()
            for s in 0..<steps {
                let frac = Double(s) / Double(steps)
                let ang = rollRad + frac * 2.0 * .pi
                let inTooth = (s % 4 == 0 || s % 4 == 1)
                let rx = inTooth ? rxOuter : rxRoot
                let ry = inTooth ? ryOuter : ryRoot
                let pt = CGPoint(x: cx + CGFloat(cos(ang)) * rx, y: cy + CGFloat(sin(ang)) * ry)
                if s == 0 { ctx.move(to: pt) } else { ctx.addLine(to: pt) }
            }
            ctx.closePath()
            ctx.strokePath()
            // Inner hub and index spoke
            let hubRect = screenRect.insetBy(dx: screenRect.width * 0.34, dy: screenRect.height * 0.34)
            ctx.setFillColor(CGColor(red: 0.09, green: 0.10, blue: 0.12, alpha: 0.92))
            ctx.fillEllipse(in: hubRect)
            ctx.strokeEllipse(in: hubRect)
            ctx.move(to: CGPoint(x: cx, y: cy))
            ctx.addLine(to: CGPoint(x: cx + CGFloat(cos(rollRad)) * rxRoot * 0.92, y: cy + CGFloat(sin(rollRad)) * ryRoot * 0.92))
            ctx.strokePath()

        case "ring", "torus":
            ctx.fillEllipse(in: screenRect)
            ctx.strokeEllipse(in: screenRect)
            let holeRect = screenRect.insetBy(dx: screenRect.width * 0.24, dy: screenRect.height * 0.24)
            ctx.setFillColor(CGColor(red: 0.08, green: 0.09, blue: 0.11, alpha: 0.92))
            ctx.fillEllipse(in: holeRect)
            ctx.strokeEllipse(in: holeRect)

        case "sphere":
            ctx.fillEllipse(in: screenRect)
            ctx.strokeEllipse(in: screenRect)

        case "arrow3d":
            let cx = screenRect.midX
            let cy = screenRect.midY
            let w = screenRect.width * 0.48
            let h = screenRect.height * 0.36
            ctx.beginPath()
            ctx.move(to: CGPoint(x: cx - w, y: cy - h * 0.45))
            ctx.addLine(to: CGPoint(x: cx + w * 0.25, y: cy - h * 0.45))
            ctx.addLine(to: CGPoint(x: cx + w * 0.25, y: cy - h))
            ctx.addLine(to: CGPoint(x: cx + w, y: cy))
            ctx.addLine(to: CGPoint(x: cx + w * 0.25, y: cy + h))
            ctx.addLine(to: CGPoint(x: cx + w * 0.25, y: cy + h * 0.45))
            ctx.addLine(to: CGPoint(x: cx - w, y: cy + h * 0.45))
            ctx.closePath()
            ctx.fillPath()
            ctx.strokePath()

        case "text3d":
            ctx.fill(screenRect)
            ctx.stroke(screenRect)
            let label = prop?.textString ?? actor.id
            drawLabel(
                ctx: ctx,
                text: label,
                at: CGPoint(x: screenRect.minX + 6, y: screenRect.midY - 6),
                fontSize: 12.0,
                color: CGColor(red: 0.98, green: 0.98, blue: 1.0, alpha: 1.0)
            )

        default:
            ctx.fill(screenRect)
            ctx.stroke(screenRect)
        }
    }

    private static func drawCharacterPose(
        ctx: CGContext,
        rect: CGRect,
        charRow: CharacterRow,
        pose: EvaluatedCharacterPose,
        camera: EvaluatedCamera,
        keyLightDir: SIMD3<Double>,
        lampColorTint: SIMD3<Double>,
        lumenScale: Double,
        outlineWidth: Double
    ) {
        // Draw torso/head bounds + 2-bone IK limbs
        let bodyColor = CGColor(red: 0.78 * lampColorTint.x, green: 0.62 * lampColorTint.y, blue: 0.48 * lampColorTint.z, alpha: 1.0)
        let limbColor = CGColor(red: 0.62 * lampColorTint.x, green: 0.48 * lampColorTint.y, blue: 0.36 * lampColorTint.z, alpha: 1.0)

        ctx.setStrokeColor(limbColor)
        ctx.setLineWidth(4.0)
        for limb in pose.limbs.values {
            let p0 = CameraSolver.projectToScreen(worldPoint: limb.attachWorld, camera: camera)
            let p1 = CameraSolver.projectToScreen(worldPoint: limb.kneeOrElbowWorld, camera: camera)
            let p2 = CameraSolver.projectToScreen(worldPoint: limb.footOrHandWorld, camera: camera)
            if p0.z > 0.05 && p1.z > 0.05 && p2.z > 0.05 {
                ctx.move(to: CGPoint(x: rect.minX + CGFloat(p0.x) * rect.width, y: rect.minY + CGFloat(1.0 - p0.y) * rect.height))
                ctx.addLine(to: CGPoint(x: rect.minX + CGFloat(p1.x) * rect.width, y: rect.minY + CGFloat(1.0 - p1.y) * rect.height))
                ctx.addLine(to: CGPoint(x: rect.minX + CGFloat(p2.x) * rect.width, y: rect.minY + CGFloat(1.0 - p2.y) * rect.height))
                ctx.strokePath()
            }
        }

        let headScreen = CameraSolver.projectToScreen(worldPoint: pose.headCenter, camera: camera)
        let hipScreen = CameraSolver.projectToScreen(worldPoint: pose.rootPosition + SIMD3(0, charRow.hipH, 0) + pose.bodyOffset, camera: camera)
        if headScreen.z > 0.05 && hipScreen.z > 0.05 {
            ctx.setStrokeColor(bodyColor)
            ctx.setLineWidth(7.0)
            ctx.move(to: CGPoint(x: rect.minX + CGFloat(hipScreen.x) * rect.width, y: rect.minY + CGFloat(1.0 - hipScreen.y) * rect.height))
            ctx.addLine(to: CGPoint(x: rect.minX + CGFloat(headScreen.x) * rect.width, y: rect.minY + CGFloat(1.0 - headScreen.y) * rect.height))
            ctx.strokePath()

            let headRadiusPx = max(6.0, CGFloat(charRow.headR / max(0.5, headScreen.z)) * rect.height)
            let headRect = CGRect(
                x: rect.minX + CGFloat(headScreen.x) * rect.width - headRadiusPx,
                y: rect.minY + CGFloat(1.0 - headScreen.y) * rect.height - headRadiusPx,
                width: headRadiusPx * 2.0,
                height: headRadiusPx * 2.0
            )
            ctx.setFillColor(bodyColor)
            ctx.fillEllipse(in: headRect)
        }
    }

    private static func drawOrthoBlueprintIntoContext(
        ctx: CGContext,
        rect: CGRect,
        plane: OrthoPlane,
        snap: StageSnapshot
    ) {
        ctx.saveGState()
        defer { ctx.restoreGState() }
        ctx.clip(to: rect)

        ctx.setFillColor(CGColor(red: 0.07, green: 0.08, blue: 0.11, alpha: 1.0))
        ctx.fill(rect)

        let spanMeters = 10.0
        let pxPerMeter = Double(min(rect.width, rect.height)) / spanMeters

        func toScreen(_ p: SIMD3<Double>) -> CGPoint {
            let hx: Double
            let hy: Double
            switch plane {
            case .topXZ:
                hx = p.x; hy = -p.z
            case .frontXY:
                hx = p.x; hy = p.y - 1.5
            case .sideZY:
                hx = p.z; hy = p.y - 1.5
            }
            return CGPoint(
                x: rect.midX + CGFloat(hx * pxPerMeter),
                y: rect.midY + CGFloat(hy * pxPerMeter)
            )
        }

        // Draw 1m grid lines
        ctx.setStrokeColor(CGColor(red: 0.16, green: 0.19, blue: 0.24, alpha: 1.0))
        ctx.setLineWidth(1.0)
        for m in -8...8 {
            let dm = Double(m)
            let pA: CGPoint
            let pB: CGPoint
            let pC: CGPoint
            let pD: CGPoint
            switch plane {
            case .topXZ:
                pA = toScreen(SIMD3(dm, 0, -8)); pB = toScreen(SIMD3(dm, 0, 8))
                pC = toScreen(SIMD3(-8, 0, dm)); pD = toScreen(SIMD3(8, 0, dm))
            case .frontXY:
                pA = toScreen(SIMD3(dm, -4, 0)); pB = toScreen(SIMD3(dm, 8, 0))
                pC = toScreen(SIMD3(-8, dm, 0)); pD = toScreen(SIMD3(8, dm, 0))
            case .sideZY:
                pA = toScreen(SIMD3(0, -4, dm)); pB = toScreen(SIMD3(0, 8, dm))
                pC = toScreen(SIMD3(0, dm, -8)); pD = toScreen(SIMD3(0, dm, 8))
            }
            ctx.move(to: pA); ctx.addLine(to: pB)
            ctx.move(to: pC); ctx.addLine(to: pD)
        }
        ctx.strokePath()

        // Draw actor AABB wireframes
        for act in snap.actors.values where act.effectiveVisible && (act.role == "prop" || act.role == "rig") {
            let pMin = toScreen(act.worldBounds.min)
            let pMax = toScreen(act.worldBounds.max)
            let boxRect = CGRect(
                x: min(pMin.x, pMax.x),
                y: min(pMin.y, pMax.y),
                width: max(3.0, abs(pMax.x - pMin.x)),
                height: max(3.0, abs(pMax.y - pMin.y))
            )
            ctx.setStrokeColor(CGColor(red: 0.35, green: 0.88, blue: 0.62, alpha: 0.9))
            ctx.setLineWidth(1.5)
            ctx.stroke(boxRect)
            drawLabel(
                ctx: ctx,
                text: act.id,
                at: CGPoint(x: boxRect.minX + 2, y: boxRect.maxY + 2),
                fontSize: 9.5,
                color: CGColor(red: 0.65, green: 0.95, blue: 0.80, alpha: 0.9)
            )
        }

        // Draw camera position & sightline
        let camPt = toScreen(snap.camera.eye)
        let tgtPt = toScreen(snap.camera.target)
        ctx.setStrokeColor(CGColor(red: 1.0, green: 0.78, blue: 0.25, alpha: 0.85))
        ctx.setLineWidth(1.5)
        ctx.move(to: camPt)
        ctx.addLine(to: tgtPt)
        ctx.strokePath()
        ctx.setFillColor(CGColor(red: 1.0, green: 0.78, blue: 0.25, alpha: 1.0))
        ctx.fillEllipse(in: CGRect(x: camPt.x - 3.5, y: camPt.y - 3.5, width: 7, height: 7))

        let title: String
        switch plane {
        case .topXZ: title = "ORTHO TOP (XZ)"
        case .frontXY: title = "ORTHO FRONT (XY)"
        case .sideZY: title = "ORTHO SIDE (ZY)"
        }
        drawLabel(
            ctx: ctx,
            text: title,
            at: CGPoint(x: rect.minX + 10, y: rect.maxY - 22),
            fontSize: 11.0,
            color: CGColor(red: 0.75, green: 0.82, blue: 0.92, alpha: 0.9)
        )
    }

    private static func drawLabel(
        ctx: CGContext,
        text: String,
        at point: CGPoint,
        fontSize: CGFloat,
        color: CGColor
    ) {
        let font = CTFontCreateWithName("Helvetica-Bold" as CFString, fontSize, nil)
        let attrs: [NSAttributedString.Key: Any] = [
            NSAttributedString.Key(kCTFontAttributeName as String): font,
            NSAttributedString.Key(kCTForegroundColorAttributeName as String): color
        ]
        let attrStr = NSAttributedString(string: text, attributes: attrs)
        let line = CTLineCreateWithAttributedString(attrStr)
        ctx.textPosition = point
        CTLineDraw(line, ctx)
    }

    private static func applyDeterministicFinishing(
        pixels: inout [UInt8],
        width: Int,
        height: Int,
        t: Double,
        seed: Int,
        bible: StyleBibleRow,
        finishing: FinishingChainRow,
        flashIntensity: Double
    ) {
        let totalEv = bible.exposureEv + finishing.exposureEv
        let exposureGain = pow(2.0, totalEv)
        let contrast = max(0.1, bible.contrast * finishing.contrast)
        let vignette = finishing.vignetteWeight
        let grainAmp = finishing.filmGrainIntensity * 14.0
        let seedU = UInt32(truncatingIfNeeded: abs(seed) &+ Int((t * 1000.0).rounded()))

        for y in 0..<height {
            let ny = (Double(y) / Double(max(1, height - 1))) * 2.0 - 1.0
            let rowOffset = y * width * 4
            for x in 0..<width {
                let nx = (Double(x) / Double(max(1, width - 1))) * 2.0 - 1.0
                let r2 = nx * nx + ny * ny
                let vigFactor = max(0.2, 1.0 - vignette * r2 * 0.55)

                // Pure deterministic spatial hash for film grain (zero runtime state)
                var h = UInt32(truncatingIfNeeded: x &* 374761393 &+ y &* 668265263) ^ seedU
                h = (h ^ (h >> 13)) &* 1274126177
                let noise = (Double(h & 0xFFFF) / 65535.0 - 0.5) * grainAmp

                let idx = rowOffset + x * 4
                for c in 0..<3 {
                    var v = Double(pixels[idx + c]) / 255.0
                    v = v * exposureGain * vigFactor
                    // AgX-like sigmoid shoulder
                    v = 0.5 + (v - 0.5) * contrast
                    v = v / (1.0 + max(0.0, v - 0.85) * 0.6)
                    if flashIntensity > 0.0 {
                        v = v + (1.0 - v) * flashIntensity * 0.65
                    }
                    let outByte = Int((v * 255.0 + noise).rounded())
                    pixels[idx + c] = UInt8(min(255, max(0, outByte)))
                }
                pixels[idx + 3] = 255
            }
        }
    }

    private static func computeExposureMeter(pixels: [UInt8], width: Int, height: Int) -> ExposureMeterReport {
        let count = max(1, width * height)
        var lumaSum = 0.0
        var clipped = 0
        var crushed = 0
        var minLuma = 1.0
        var maxLuma = 0.0

        for i in 0..<count {
            let idx = i * 4
            let r = Double(pixels[idx + 0]) / 255.0
            let g = Double(pixels[idx + 1]) / 255.0
            let b = Double(pixels[idx + 2]) / 255.0
            let y = 0.2126 * r + 0.7152 * g + 0.0722 * b
            lumaSum += y
            if y > 0.985 { clipped += 1 }
            if y < 0.015 { crushed += 1 }
            if y > 0.001 { minLuma = min(minLuma, y) }
            maxLuma = max(maxLuma, y)
        }

        let mean = lumaSum / Double(count)
        let stops = maxLuma > minLuma ? log2(maxLuma / max(1e-4, minLuma)) : 0.0
        return ExposureMeterReport(
            meanLuminance: (mean * 1000.0).rounded() / 1000.0,
            dynamicRangeStops: (stops * 100.0).rounded() / 100.0,
            clippedWhitePct: ((Double(clipped) / Double(count)) * 10000.0).rounded() / 100.0,
            crushedBlackPct: ((Double(crushed) / Double(count)) * 10000.0).rounded() / 100.0
        )
    }

    private static func computeFramingEntries(snap: StageSnapshot) -> [FramingProbeEntry] {
        let hasCaption = (snap.clock.caption != nil && !(snap.clock.caption?.isEmpty ?? true))
        var list: [FramingProbeEntry] = []
        for id in snap.actors.keys.sorted() {
            guard let act = snap.actors[id], act.effectiveVisible else { continue }
            if act.role != "prop" && act.role != "rig" { continue }
            let b = act.worldBounds
            let corners = [
                SIMD3(b.min.x, b.min.y, b.min.z), SIMD3(b.max.x, b.min.y, b.min.z),
                SIMD3(b.min.x, b.max.y, b.min.z), SIMD3(b.max.x, b.max.y, b.min.z),
                SIMD3(b.min.x, b.min.y, b.max.z), SIMD3(b.max.x, b.min.y, b.max.z),
                SIMD3(b.min.x, b.max.y, b.max.z), SIMD3(b.max.x, b.max.y, b.max.z)
            ]
            var uMin = 1.0, vMin = 1.0, uMax = 0.0, vMax = 0.0, depthSum = 0.0
            var valid = 0
            for c in corners {
                let p = CameraSolver.projectToScreen(worldPoint: c, camera: snap.camera)
                if p.z > 1e-4 {
                    uMin = min(uMin, p.x); vMin = min(vMin, p.y)
                    uMax = max(uMax, p.x); vMax = max(vMax, p.y)
                    depthSum += p.z; valid += 1
                }
            }
            let depth = valid > 0 ? (depthSum / Double(valid)) : -1.0
            let inSafe = valid > 0 && uMin >= 0.05 && uMax <= 0.95 && vMin >= 0.05 && vMax <= 0.95
            let inCap = hasCaption && vMax > 0.88 && uMax > 0.15 && uMin < 0.85
            list.append(FramingProbeEntry(
                actorId: act.id,
                role: act.role,
                worldPosition: [act.worldPosition.x, act.worldPosition.y, act.worldPosition.z],
                worldBoundsMin: [b.min.x, b.min.y, b.min.z],
                worldBoundsMax: [b.max.x, b.max.y, b.max.z],
                screenBBox: [uMin, vMin, uMax, vMax],
                depthM: depth,
                inSafeFrame: inSafe,
                inCaptionBand: inCap
            ))
        }
        return list
    }

    // MARK: - Image & Video File I/O

    public static func writeImageFile(
        rgbaBytes: [UInt8],
        width: Int,
        height: Int,
        to path: String
    ) throws {
        let url = URL(fileURLWithPath: path)
        let dir = url.deletingLastPathComponent()
        if !dir.path.isEmpty {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        let ext = url.pathExtension.lowercased()
        let utType: CFString = (ext == "jpg" || ext == "jpeg")
            ? (UTType.jpeg.identifier as CFString)
            : (UTType.png.identifier as CFString)

        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let data = Data(rgbaBytes) as CFData
        let mutableData = CFDataCreateMutable(nil, 0)!
        guard let provider = CGDataProvider(data: data),
              let cgImage = CGImage(
                  width: width,
                  height: height,
                  bitsPerComponent: 8,
                  bitsPerPixel: 32,
                  bytesPerRow: width * 4,
                  space: colorSpace,
                  bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
                  provider: provider,
                  decode: nil,
                  shouldInterpolate: true,
                  intent: .defaultIntent
              ),
              let dest = CGImageDestinationCreateWithData(mutableData, utType, 1, nil) else {
            throw StageError(code: "IMAGE_WRITE_ERROR", message: "Failed to create image destination for '\(path)'")
        }
        CGImageDestinationAddImage(dest, cgImage, nil)
        guard CGImageDestinationFinalize(dest) else {
            throw StageError(code: "IMAGE_FINALIZE_ERROR", message: "Failed to encode image data for '\(path)'")
        }
        let outData = mutableData as Data
        unlink(path)
        guard let fp = fopen(path, "wb") else {
            throw StageError(code: "IMAGE_WRITE_ERROR", message: "Failed to open '\(path)' for writing")
        }
        defer { fclose(fp) }
        let written = outData.withUnsafeBytes { rawBuf -> Int in
            guard let base = rawBuf.baseAddress else { return 0 }
            return fwrite(base, 1, outData.count, fp)
        }
        guard written == outData.count else {
            throw StageError(code: "IMAGE_WRITE_ERROR", message: "Short write to '\(path)' (\(written)/\(outData.count) bytes)")
        }
    }

    private static func writeVideoSequence(
        frames: [RenderedFrame],
        width: Int,
        height: Int,
        fps: Int,
        mode: String,
        to path: String
    ) throws {
        let url = URL(fileURLWithPath: path)
        try? FileManager.default.removeItem(at: url)
        let dir = url.deletingLastPathComponent()
        if !dir.path.isEmpty {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        let ext = url.pathExtension.lowercased()
        let fileType: AVFileType = (ext == "mov" || mode == "reference") ? .mov : .mp4
        let codec: AVVideoCodecType = (ext == "mov" || mode == "reference") ? .proRes4444 : .h264

        let writer = try AVAssetWriter(outputURL: url, fileType: fileType)
        let settings: [String: Any] = [
            AVVideoCodecKey: codec,
            AVVideoWidthKey: width,
            AVVideoHeightKey: height
        ]
        let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
        input.expectsMediaDataInRealTime = false

        let attrs: [String: Any] = [
            kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32ARGB),
            kCVPixelBufferWidthKey as String: width,
            kCVPixelBufferHeightKey as String: height
        ]
        let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: attrs)
        guard writer.canAdd(input) else {
            throw StageError(code: "VIDEO_WRITER_ERROR", message: "Cannot add video input to AVAssetWriter for '\(path)'")
        }
        writer.add(input)
        writer.startWriting()
        writer.startSession(atSourceTime: .zero)

        for (idx, frame) in frames.enumerated() {
            while !input.isReadyForMoreMediaData {
                Thread.sleep(forTimeInterval: 0.001)
            }
            var pb: CVPixelBuffer?
            guard let pool = adaptor.pixelBufferPool,
                  CVPixelBufferPoolCreatePixelBuffer(nil, pool, &pb) == kCVReturnSuccess,
                  let pixelBuffer = pb else {
                continue
            }
            CVPixelBufferLockBaseAddress(pixelBuffer, [])
            if let base = CVPixelBufferGetBaseAddress(pixelBuffer) {
                let dstBytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
                let dstPtr = base.assumingMemoryBound(to: UInt8.self)
                for y in 0..<height {
                    for x in 0..<width {
                        let sIdx = (y * width + x) * 4
                        let dIdx = y * dstBytesPerRow + x * 4
                        // RGBA -> ARGB
                        dstPtr[dIdx + 0] = frame.rgbaBytes[sIdx + 3]
                        dstPtr[dIdx + 1] = frame.rgbaBytes[sIdx + 0]
                        dstPtr[dIdx + 2] = frame.rgbaBytes[sIdx + 1]
                        dstPtr[dIdx + 3] = frame.rgbaBytes[sIdx + 2]
                    }
                }
            }
            CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
            let time = CMTime(value: CMTimeValue(idx), timescale: CMTimeScale(fps))
            adaptor.append(pixelBuffer, withPresentationTime: time)
        }

        input.markAsFinished()
        let sem = DispatchSemaphore(value: 0)
        writer.finishWriting {
            sem.signal()
        }
        sem.wait()
        if writer.status == .failed {
            throw StageError(
                code: "VIDEO_ENCODE_FAILED",
                message: writer.error?.localizedDescription ?? "AVAssetWriter failed"
            )
        }
    }

    // MARK: - Utility Functions

    private static func blitFrame(
        src: [UInt8],
        srcW: Int,
        srcH: Int,
        dst: inout [UInt8],
        dstW: Int,
        dstH: Int,
        dstX: Int,
        dstY: Int
    ) {
        for y in 0..<srcH {
            let ty = dstY + y
            guard ty >= 0 && ty < dstH else { continue }
            for x in 0..<srcW {
                let tx = dstX + x
                guard tx >= 0 && tx < dstW else { continue }
                let sIdx = (y * srcW + x) * 4
                let dIdx = (ty * dstW + tx) * 4
                dst[dIdx + 0] = src[sIdx + 0]
                dst[dIdx + 1] = src[sIdx + 1]
                dst[dIdx + 2] = src[sIdx + 2]
                dst[dIdx + 3] = src[sIdx + 3]
            }
        }
    }

    private static func downsampleAndBoxBlur(
        src: [UInt8],
        srcW: Int,
        srcH: Int,
        dstW: Int,
        dstH: Int,
        blurRadius: Int
    ) -> [UInt8] {
        var scaled = [UInt8](repeating: 255, count: dstW * dstH * 4)
        for y in 0..<dstH {
            let sy = min(srcH - 1, (y * srcH) / max(1, dstH))
            for x in 0..<dstW {
                let sx = min(srcW - 1, (x * srcW) / max(1, dstW))
                let sIdx = (sy * srcW + sx) * 4
                let dIdx = (y * dstW + x) * 4
                scaled[dIdx + 0] = src[sIdx + 0]
                scaled[dIdx + 1] = src[sIdx + 1]
                scaled[dIdx + 2] = src[sIdx + 2]
                scaled[dIdx + 3] = 255
            }
        }
        guard blurRadius > 0 else { return scaled }
        var blurred = scaled
        for y in 0..<dstH {
            for x in 0..<dstW {
                var rSum = 0, gSum = 0, bSum = 0, cnt = 0
                for dy in -blurRadius...blurRadius {
                    let ny = min(dstH - 1, max(0, y + dy))
                    for dx in -blurRadius...blurRadius {
                        let nx = min(dstW - 1, max(0, x + dx))
                        let idx = (ny * dstW + nx) * 4
                        rSum += Int(scaled[idx + 0])
                        gSum += Int(scaled[idx + 1])
                        bSum += Int(scaled[idx + 2])
                        cnt += 1
                    }
                }
                let outIdx = (y * dstW + x) * 4
                blurred[outIdx + 0] = UInt8(rSum / max(1, cnt))
                blurred[outIdx + 1] = UInt8(gSum / max(1, cnt))
                blurred[outIdx + 2] = UInt8(bSum / max(1, cnt))
                blurred[outIdx + 3] = 255
            }
        }
        return blurred
    }

    private static func deriveSquintPath(from path: String) -> String {
        let url = URL(fileURLWithPath: path)
        let ext = url.pathExtension.isEmpty ? "jpg" : url.pathExtension
        let stem = url.deletingPathExtension().path
        return "\(stem).squint.\(ext)"
    }

    private static func meanNormalizedPixelDiff(_ a: [UInt8], _ b: [UInt8]) -> Double {
        let n = min(a.count, b.count)
        guard n > 0 else { return 0.0 }
        var sum = 0.0
        for i in 0..<n {
            sum += Double(abs(Int(a[i]) - Int(b[i]))) / 255.0
        }
        return sum / Double(n)
    }

    private static func averageMeters(_ list: [ExposureMeterReport]) -> ExposureMeterReport {
        guard !list.isEmpty else {
            return ExposureMeterReport(meanLuminance: 0, dynamicRangeStops: 0, clippedWhitePct: 0, crushedBlackPct: 0)
        }
        let n = Double(list.count)
        let mean = list.reduce(0.0) { $0 + $1.meanLuminance } / n
        let dr = list.reduce(0.0) { $0 + $1.dynamicRangeStops } / n
        let clip = list.reduce(0.0) { $0 + $1.clippedWhitePct } / n
        let crush = list.reduce(0.0) { $0 + $1.crushedBlackPct } / n
        return ExposureMeterReport(
            meanLuminance: (mean * 1000.0).rounded() / 1000.0,
            dynamicRangeStops: (dr * 100.0).rounded() / 100.0,
            clippedWhitePct: (clip * 100.0).rounded() / 100.0,
            crushedBlackPct: (crush * 100.0).rounded() / 100.0
        )
    }

    private static func parseHexColor(_ hex: String) -> SIMD3<Double> {
        let cleaned = hex.trimmingCharacters(in: .whitespacesAndNewlines).replacingOccurrences(of: "#", with: "")
        guard cleaned.count == 6, let val = UInt32(cleaned, radix: 16) else {
            return SIMD3<Double>(0.5, 0.5, 0.5)
        }
        let r = Double((val >> 16) & 0xFF) / 255.0
        let g = Double((val >> 8) & 0xFF) / 255.0
        let b = Double(val & 0xFF) / 255.0
        return SIMD3<Double>(r, g, b)
    }

    private static func kelvinToRGB(_ kelvin: Double) -> SIMD3<Double> {
        let temp = min(max(kelvin, 1000.0), 20000.0) / 100.0
        let r: Double
        let g: Double
        let b: Double
        if temp <= 66.0 {
            r = 1.0
            g = min(1.0, max(0.0, (99.4708025861 * log(temp) - 161.1195681661) / 255.0))
            if temp <= 19.0 {
                b = 0.0
            } else {
                b = min(1.0, max(0.0, (138.5177312231 * log(temp - 10.0) - 305.0447927307) / 255.0))
            }
        } else {
            r = min(1.0, max(0.0, (329.698727446 * pow(temp - 60.0, -0.1332047592)) / 255.0))
            g = min(1.0, max(0.0, (288.1221695283 * pow(temp - 60.0, -0.0755148492)) / 255.0))
            b = 1.0
        }
        return SIMD3<Double>(r, g, b)
    }
}
