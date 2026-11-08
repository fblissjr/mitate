import Foundation
import Testing
@testable import MitateCore
@testable import MitateMetal
@testable import MitateWeb

@Suite("Phase v2.2 & v2.3 — MitateMetal Renderer, KernelJIT, Diff Magnitude, Review Instruments & Web Bundler")
struct MetalAndBundleTests {

    @Test("KernelJIT compiles valid Metal shader, caches by SHA-256, and rejects invalid MSL (Red/Green)")
    func kernelJITCompileAndCache() throws {
        let validMSL = """
        #include <metal_stdlib>
        using namespace metal;
        [[visible]] float3 vortex_motion(float t, uint instance_id) {
            return float3(cos(t + float(instance_id)), sin(t * 2.0), 0.0);
        }
        """
        let info1 = try KernelJIT.shared.compileKernel(
            id: "vortex_motion",
            hookSlot: "kinematics",
            entrySymbol: "vortex_motion",
            mslSource: validMSL
        )
        #expect(info1.id == "vortex_motion")
        let info2 = try KernelJIT.shared.compileKernel(
            id: "vortex_motion",
            hookSlot: "kinematics",
            entrySymbol: "vortex_motion",
            mslSource: validMSL
        )
        #expect(info2.cached == true)
        #expect(info2.sha256 == info1.sha256)

        // Red Arm: missing entry point or syntax error must throw StageError
        #expect(throws: StageError.self) {
            _ = try KernelJIT.shared.compileKernel(
                id: "broken_kernel",
                hookSlot: "kinematics",
                entrySymbol: "non_existent_entry",
                mslSource: "SYNTAX_ERROR void bad() {"
            )
        }
    }

    @Test("StageRenderer out-of-order seek determinism (0-byte diff) and 1-pixel mutation diff-magnitude locator")
    func pixelDeterminismAndDiffMagnitudeLocator() throws {
        let db = try StageDB(path: ":memory:")
        try db.initializeStage(preset: "explainer-stage")

        let smoke = try StageRenderer.runSmoke(db: db)
        #expect(smoke.ok == true)
        #expect(smoke.determinismPassed == true)
        #expect(smoke.sampleDiffs.allSatisfy { $0.diff.identical && $0.diff.changedPixels == 0 })

        // Verify Red Arm on diff-magnitude locator: mutate exactly 1 pixel at (x=42, y=19)
        let cache = try StageStateCache(db: db)
        let frameA = StageRenderer.renderFrame(cache: cache, at: 1.25, width: 160, height: 90, includeOverlays: true)
        var mutatedBytes = frameA.rgbaBytes
        let targetX = 42
        let targetY = 19
        let pixelIdx = (targetY * 160 + targetX) * 4
        let originalR = Int(mutatedBytes[pixelIdx])
        let newR = originalR > 128 ? (originalR - 50) : (originalR + 50)
        mutatedBytes[pixelIdx] = UInt8(newR)

        let diff = StageRenderer.compareFrames(frameA: frameA.rgbaBytes, frameB: mutatedBytes, width: 160, height: 90)
        #expect(diff.identical == false)
        #expect(diff.changedPixels == 1)
        #expect(diff.bbox == [targetX, targetY, targetX, targetY])
        #expect(diff.maxChannelDelta == 50)
        #expect(diff.psnrDb > 20.0 && diff.psnrDb < 90.0)
    }

    @Test("Review instruments (quad, sheet + squint + nocap, strip, shoot) and HTMLBundler web contract")
    func instrumentsAndHTMLBundlerEndToEnd() throws {
        let tmpDir = "/tmp/mitate_v2_test_\(UUID().uuidString)"
        try FileManager.default.createDirectory(atPath: tmpDir, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(atPath: tmpDir) }

        let dbPath = "\(tmpDir)/shot.db"
        let db = try StageDB(path: dbPath, createIfMissing: true)
        try db.initializeStage(preset: "explainer-stage")

        // 1. quad
        let quadOut = "\(tmpDir)/quad.png"
        let quadReport = try StageRenderer.renderQuad(db: db, atSpec: "intro@0.5", outPath: quadOut, width: 640, height: 360)
        #expect(FileManager.default.fileExists(atPath: quadOut))
        #expect(quadReport.meter.meanLuminance > 0.01)
        #expect(!quadReport.framing.isEmpty)

        // 2. sheet + .squint.jpg + --nocap
        let sheetOut = "\(tmpDir)/sheet.jpg"
        let sheetReport = try StageRenderer.renderSheet(db: db, frac: 0.6, nocap: false, outPath: sheetOut)
        #expect(FileManager.default.fileExists(atPath: sheetReport.outputPath))
        #expect(FileManager.default.fileExists(atPath: sheetReport.squintOutputPath))

        let nocapOut = "\(tmpDir)/nocap.jpg"
        let nocapReport = try StageRenderer.renderSheet(db: db, frac: 0.6, nocap: true, outPath: nocapOut)
        #expect(FileManager.default.fileExists(atPath: nocapReport.outputPath))
        #expect(nocapReport.nocap == true)

        // Verify that --nocap actually strips the caption pixels compared to normal render
        let cache = try StageStateCache(db: db)
        let withCap = StageRenderer.renderFrame(cache: cache, at: 1.0, width: 320, height: 180, includeOverlays: true)
        let withoutCap = StageRenderer.renderFrame(cache: cache, at: 1.0, width: 320, height: 180, includeOverlays: false)
        let capDiff = StageRenderer.compareFrames(frameA: withCap.rgbaBytes, frameB: withoutCap.rgbaBytes, width: 320, height: 180)
        #expect(capDiff.identical == false)
        #expect(capDiff.changedPixels > 20)

        // 3. strip
        let stripOut = "\(tmpDir)/strip.jpg"
        let stripReport = try StageRenderer.renderStrip(db: db, fromSpec: "intro@0.1", toSpec: "engage@0.9", frameCount: 6, outPath: stripOut)
        #expect(FileManager.default.fileExists(atPath: stripOut))
        #expect(stripReport.frameCount == 6)
        #expect(stripReport.maxFrameDiff > 0.0)

        // 4. shoot (still PNG)
        let stillOut = "\(tmpDir)/still.png"
        let shootReport = try StageRenderer.shoot(db: db, mode: "dailies", atSpec: "intro@0.5", outPath: stillOut)
        #expect(FileManager.default.fileExists(atPath: stillOut))
        #expect(shootReport.frameCount == 1)

        // 5. bundle (self-contained HTML player honoring window.seekTo(t) contract)
        let htmlOut = "\(tmpDir)/scene.html"
        let bundleReport = try HTMLBundler.bundle(db: db, outPath: htmlOut)
        #expect(FileManager.default.fileExists(atPath: htmlOut))
        #expect(bundleReport.bytesWritten > 500)
        let htmlContent = try String(contentsOfFile: htmlOut, encoding: .utf8)
        #expect(htmlContent.contains("window.seekTo"))
        #expect(htmlContent.contains("window.DURATION"))
        #expect(htmlContent.contains("window.stopPlayback"))
        #expect(htmlContent.contains("window.sceneReady"))
        #expect(!htmlContent.contains("type=\"module\""))
        #expect(!htmlContent.contains("https://"))

        // 6. shoot (MP4 video via macOS 27.2 AVAssetWriter PixelBufferReceiver)
        try db.executeTransaction("UPDATE slate SET width = 320, height = 180; UPDATE beats SET dur_sec = 0.08;")
        let mp4Out = "\(tmpDir)/dailies.mp4"
        let mp4Report = try StageRenderer.shoot(db: db, mode: "dailies", outPath: mp4Out)
        #expect(FileManager.default.fileExists(atPath: mp4Out))
        #expect(mp4Report.frameCount >= 2)
    }

    @Test("Phase v2.4 Calibration Portfolio: scenes/gearbox-v2.db and scenes/bear-and-bees-v2.db pass check, probe, and smoke with zero warnings")
    func calibrationPortfolioScenesCheckAndSmoke() throws {
        let repoRoot = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .deletingLastPathComponent()
            .path

        for sceneRelPath in ["scenes/gearbox-v2.db", "scenes/bear-and-bees-v2.db"] {
            let fullPath = "\(repoRoot)/\(sceneRelPath)"
            #expect(FileManager.default.fileExists(atPath: fullPath))
            let db = try StageDB(path: fullPath, createIfMissing: false)
            let check = try StageCheck.validate(db: db)
            #expect(check.ok == true)
            #expect(check.errorCount == 0)
            #expect(check.warningCount == 0)

            let smoke = try StageRenderer.runSmoke(db: db)
            #expect(smoke.ok == true)
            #expect(smoke.determinismPassed == true)
            #expect(smoke.sampleDiffs.allSatisfy { $0.diff.identical && $0.diff.changedPixels == 0 })
        }

        // Verify 3D gear train contact on gearbox-v2.db
        let gearboxDB = try StageDB(path: "\(repoRoot)/scenes/gearbox-v2.db", createIfMissing: false)
        let probe = try StageCheck.probe(db: gearboxDB, atSpec: "transfer@0.6", sepPair: ("drive_gear", "idler_gear"))
        #expect(probe.contact != nil)
        #expect(abs(probe.contact?.euclideanGapM ?? 1.0) < 1e-4)
        #expect(probe.contact?.contactState == "touching")
    }
}
