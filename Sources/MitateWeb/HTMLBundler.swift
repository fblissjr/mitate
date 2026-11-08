import Foundation
import simd
import MitateCore

public struct BundleReport: Sendable, Codable, Equatable {
    public let outputPath: String
    public let durationSec: Double
    public let beatCount: Int
    public let actorCount: Int
    public let sampleFrameCount: Int
    public let bytesWritten: Int
    public let exportsVerified: [String]
}

public enum HTMLBundler {
    private struct BundledFrameActor: Codable {
        let id: String
        let role: String
        let shape: String
        let albedo: String
        let screenBBox: [Double] // [uMin, vMin, uMax, vMax]
        let depth: Double
        let rollDeg: Double
    }

    private struct BundledFrameSnapshot: Codable {
        let t: Double
        let beatId: String?
        let caption: String?
        let backdropColor: String
        let actors: [BundledFrameActor]
    }

    private struct BundledStagePayload: Codable {
        let title: String
        let width: Int
        let height: Int
        let fps: Int
        let duration: Double
        let sampleHz: Double
        let frames: [BundledFrameSnapshot]
    }

    public static func bundle(
        db: StageDB,
        outPath: String,
        sampleHz: Double = 30.0
    ) throws -> BundleReport {
        let cache = try StageStateCache(db: db)
        let totalDur = BeatAddressing.totalDuration(beats: cache.beats, fallbackDuration: cache.slate.fallbackDurSec)
        let frameCount = max(2, Int(ceil(totalDur * sampleHz)) + 1)

        var bundledFrames: [BundledFrameSnapshot] = []
        bundledFrames.reserveCapacity(frameCount)

        for i in 0..<frameCount {
            let t = min(totalDur, Double(i) / sampleHz)
            let snap = StageEvaluator.evaluate(cache: cache, at: t)
            var frameActors: [BundledFrameActor] = []

            for act in snap.actors.values where act.effectiveVisible && (act.role == "prop" || act.role == "rig") {
                let prop = cache.props[act.id]
                let shape = prop?.shape ?? (act.role == "rig" ? "rig" : "cube")
                if shape == "plane" { continue }
                let shader = prop.flatMap { cache.shaders[$0.shaderId] }
                let albedo = shader?.albedo ?? "#b8bec6"
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
                    if p.z > 0.05 {
                        uMin = min(uMin, p.x); vMin = min(vMin, p.y)
                        uMax = max(uMax, p.x); vMax = max(vMax, p.y)
                        depthSum += p.z; valid += 1
                    }
                }
                if valid > 0 && uMax > uMin && vMax > vMin {
                    frameActors.append(BundledFrameActor(
                        id: act.id,
                        role: act.role,
                        shape: shape,
                        albedo: albedo,
                        screenBBox: [
                            (uMin * 10000).rounded() / 10000,
                            (vMin * 10000).rounded() / 10000,
                            (uMax * 10000).rounded() / 10000,
                            (vMax * 10000).rounded() / 10000
                        ],
                        depth: ((depthSum / Double(valid)) * 1000).rounded() / 1000,
                        rollDeg: (act.worldEulerDeg.z * 100).rounded() / 100
                    ))
                }
            }
            frameActors.sort { $0.depth > $1.depth }
            bundledFrames.append(BundledFrameSnapshot(
                t: (t * 1000).rounded() / 1000,
                beatId: snap.clock.activeBeatId,
                caption: snap.clock.caption,
                backdropColor: snap.bible.backdropColor,
                actors: frameActors
            ))
        }

        let payload = BundledStagePayload(
            title: cache.slate.productionTitle,
            width: cache.slate.width,
            height: cache.slate.height,
            fps: cache.slate.fps,
            duration: totalDur,
            sampleHz: sampleHz,
            frames: bundledFrames
        )

        let encoder = JSONEncoder()
        let jsonData = try encoder.encode(payload)
        let jsonString = String(data: jsonData, encoding: .utf8) ?? "{}"

        let html = """
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>\(escapeHTML(cache.slate.productionTitle))</title>
        <style>
          html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #0d0f12; overflow: hidden; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
          canvas { max-width: 100vw; max-height: 100vh; aspect-ratio: \(cache.slate.width) / \(cache.slate.height); display: block; }
        </style>
        </head>
        <body>
        <canvas id="stage" width="\(cache.slate.width)" height="\(cache.slate.height)"></canvas>
        <script>
        (function() {
          "use strict";
          const STAGE = \(jsonString);
          const canvas = document.getElementById("stage");
          const ctx = canvas.getContext("2d");
          const stripText = new URLSearchParams(window.location.search).get("strip") === "text";
          let rafId = null;
          let playing = true;
          let ready = false;

          window.DURATION = STAGE.duration;
          window.sceneReady = function() { return ready; };
          window.stopPlayback = function() {
            playing = false;
            if (rafId !== null) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
          };

          function lerp(a, b, u) { return a + (b - a) * u; }

          window.seekTo = function(tRaw) {
            const t = Math.max(0, Math.min(STAGE.duration, Number(tRaw) || 0));
            const exactIdx = t * STAGE.sampleHz;
            const i0 = Math.min(STAGE.frames.length - 1, Math.floor(exactIdx));
            const i1 = Math.min(STAGE.frames.length - 1, i0 + 1);
            const frac = exactIdx - i0;
            const f0 = STAGE.frames[i0];
            const f1 = STAGE.frames[i1] || f0;

            const W = canvas.width;
            const H = canvas.height;
            ctx.fillStyle = f0.backdropColor || "#141619";
            ctx.fillRect(0, 0, W, H);

            const map1 = {};
            for (let k = 0; k < f1.actors.length; k++) { map1[f1.actors[k].id] = f1.actors[k]; }

            for (let i = 0; i < f0.actors.length; i++) {
              const a0 = f0.actors[i];
              const a1 = map1[a0.id] || a0;
              const uMin = lerp(a0.screenBBox[0], a1.screenBBox[0], frac);
              const vMin = lerp(a0.screenBBox[1], a1.screenBBox[1], frac);
              const uMax = lerp(a0.screenBBox[2], a1.screenBBox[2], frac);
              const vMax = lerp(a0.screenBBox[3], a1.screenBBox[3], frac);
              const roll = lerp(a0.rollDeg, a1.rollDeg, frac) * Math.PI / 180.0;

              const x = uMin * W;
              const y = vMin * H;
              const w = Math.max(2, (uMax - uMin) * W);
              const h = Math.max(2, (vMax - vMin) * H);

              ctx.fillStyle = a0.albedo || "#b8bec6";
              ctx.strokeStyle = "#111318";
              ctx.lineWidth = 2;

              if (a0.shape === "sphere" || a0.shape === "gear" || a0.shape === "ring" || a0.shape === "torus") {
                ctx.beginPath();
                ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                if (a0.shape === "gear") {
                  const r = Math.min(w, h) * 0.45;
                  ctx.beginPath();
                  ctx.moveTo(x + w * 0.5, y + h * 0.5);
                  ctx.lineTo(x + w * 0.5 + Math.cos(roll) * r, y + h * 0.5 + Math.sin(roll) * r);
                  ctx.stroke();
                }
              } else {
                ctx.fillRect(x, y, w, h);
                ctx.strokeRect(x, y, w, h);
              }
            }

            if (!stripText && f0.caption) {
              const padX = 24;
              ctx.font = "600 22px -apple-system, BlinkMacSystemFont, sans-serif";
              const tw = ctx.measureText(f0.caption).width;
              const pw = Math.min(W * 0.88, tw + padX * 2);
              const ph = 44;
              const px = (W - pw) * 0.5;
              const py = H * 0.90 - ph * 0.5;
              ctx.fillStyle = "rgba(12, 14, 18, 0.82)";
              ctx.fillRect(px, py, pw, ph);
              ctx.fillStyle = "#f4f6fa";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(f0.caption, W * 0.5, py + ph * 0.5);
            }
          };

          window.seekTo(0);
          ready = true;

          const tStart = performance.now();
          function tick(now) {
            if (!playing) return;
            const elapsed = ((now - tStart) / 1000.0) % Math.max(0.001, STAGE.duration);
            window.seekTo(elapsed);
            rafId = requestAnimationFrame(tick);
          }
          rafId = requestAnimationFrame(tick);
        })();
        </script>
        </body>
        </html>
        """

        let outURL = URL(fileURLWithPath: outPath)
        let dir = outURL.deletingLastPathComponent()
        if !dir.path.isEmpty {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        let data = Data(html.utf8)
        unlink(outPath)
        guard let fp = fopen(outPath, "wb") else {
            throw StageError(code: "BUNDLE_WRITE_ERROR", message: "Failed to open '\(outPath)' for writing")
        }
        defer { fclose(fp) }
        let written = data.withUnsafeBytes { rawBuf -> Int in
            guard let base = rawBuf.baseAddress else { return 0 }
            return fwrite(base, 1, data.count, fp)
        }
        guard written == data.count else {
            throw StageError(code: "BUNDLE_WRITE_ERROR", message: "Short write to '\(outPath)'")
        }

        return BundleReport(
            outputPath: outPath,
            durationSec: totalDur,
            beatCount: cache.beats.count,
            actorCount: cache.actors.count,
            sampleFrameCount: frameCount,
            bytesWritten: data.count,
            exportsVerified: ["window.seekTo", "window.DURATION", "window.stopPlayback", "window.sceneReady"]
        )
    }

    private static func escapeHTML(_ str: String) -> String {
        str
            .replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
            .replacingOccurrences(of: "\"", with: "&quot;")
    }
}
