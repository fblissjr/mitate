import Foundation

public enum BeatAddressing {
    public static func totalDuration(beats: [BeatRow], fallbackDuration: Double) -> Double {
        guard let last = beats.last else {
            return max(0.001, fallbackDuration)
        }
        return max(0.001, last.t1)
    }

    public static func beatAt(id: String, frac: Double = 0.0, beats: [BeatRow]) -> Double? {
        guard let beat = beats.first(where: { $0.id == id }) else {
            return nil
        }
        let clamped = min(max(frac, 0.0), 1.0)
        return beat.t0 + clamped * beat.durSec
    }

    /// Parses either a numeric timestamp ("1.4") or a beat-relative coordinate ("intro@0.5" or "intro").
    public static func parseTimestamp(_ spec: String, beats: [BeatRow], fallbackDuration: Double = 4.0) throws -> Double {
        let trimmed = spec.trimmingCharacters(in: .whitespacesAndNewlines)
        if let raw = Double(trimmed) {
            return raw
        }
        if trimmed.contains("@") {
            let parts = trimmed.split(separator: "@", maxSplits: 1, omittingEmptySubsequences: false)
            let beatId = String(parts[0])
            let fracStr = parts.count > 1 ? String(parts[1]) : "0.0"
            let normalizedFracStr = fracStr.hasPrefix(".") ? ("0" + fracStr) : fracStr
            guard let frac = Double(normalizedFracStr) else {
                throw StageError(
                    code: "INVALID_BEAT_FRAC",
                    message: "Invalid beat fraction in '\(spec)'. Expected '<beat_id>@<0..1>'.",
                    pointer: "wiki/time-and-beats.md"
                )
            }
            guard let t = beatAt(id: beatId, frac: frac, beats: beats) else {
                throw StageError(
                    code: "UNKNOWN_BEAT",
                    message: "Unknown beat '\(beatId)' in address '\(spec)'. Available beats: \(beats.map(\.id).joined(separator: ", "))",
                    pointer: "wiki/time-and-beats.md"
                )
            }
            return t
        }
        if let t = beatAt(id: trimmed, frac: 0.0, beats: beats) {
            return t
        }
        throw StageError(
            code: "INVALID_TIME_ADDRESS",
            message: "Could not resolve time address '\(spec)' as seconds or '<beat_id>@<frac>'.",
            pointer: "wiki/time-and-beats.md"
        )
    }

    /// Piecewise-linear time warp: maps presentation time `t` to simulation/domain time `tWarped`.
    /// Outside any `warp_segments` window, time advances at rate 1.0; inside a segment, it advances at `seg.rate`.
    public static func warp(t: Double, beats: [BeatRow], segments: [WarpSegmentRow]) -> Double {
        guard !segments.isEmpty else { return t }
        let resolved: [(t0: Double, t1: Double, rate: Double)] = segments.compactMap { seg in
            guard let start = beatAt(id: seg.beatId, frac: seg.beatFrac, beats: beats) else { return nil }
            return (start, start + seg.durSec, max(0.0, seg.rate))
        }.sorted { $0.t0 < $1.t0 }

        var cursor = 0.0
        var warped = 0.0
        for seg in resolved {
            if t <= cursor { break }
            if t <= seg.t0 {
                warped += (t - cursor)
                cursor = t
                break
            }
            if seg.t0 > cursor {
                warped += (seg.t0 - cursor)
                cursor = seg.t0
            }
            let endInSeg = min(t, seg.t1)
            if endInSeg > cursor {
                warped += (endInSeg - cursor) * seg.rate
                cursor = endInSeg
            }
        }
        if t > cursor {
            warped += (t - cursor)
        }
        return warped
    }

    /// Exact inverse of `warp(t:beats:segments:)`: maps domain/simulation time `tWarped` back to presentation time `t`.
    public static func unwarp(tWarped: Double, beats: [BeatRow], segments: [WarpSegmentRow], maxDuration: Double = 3600.0) -> Double {
        guard !segments.isEmpty else { return tWarped }
        var lo = 0.0
        var hi = max(maxDuration, tWarped * 4.0 + 60.0)
        for _ in 0..<64 {
            let mid = 0.5 * (lo + hi)
            let w = warp(t: mid, beats: beats, segments: segments)
            if w < tWarped {
                lo = mid
            } else {
                hi = mid
            }
        }
        return 0.5 * (lo + hi)
    }

    public static func resolveClock(
        t: Double,
        beats: [BeatRow],
        warpSegments: [WarpSegmentRow],
        fallbackDuration: Double
    ) -> StageClock {
        let total = totalDuration(beats: beats, fallbackDuration: fallbackDuration)
        let clampedT = min(max(t, 0.0), total)
        let warpedT = warp(t: clampedT, beats: beats, segments: warpSegments)

        guard !beats.isEmpty else {
            return StageClock(
                t: clampedT,
                tWarped: warpedT,
                totalDuration: total,
                activeBeatId: nil,
                beatFrac: total > 0 ? (clampedT / total) : 0.0,
                beatSec: clampedT,
                caption: nil,
                flashIntensity: 0.0
            )
        }

        var active = beats.last!
        for b in beats {
            if clampedT >= b.t0 && clampedT < b.t1 {
                active = b
                break
            }
        }
        let beatSec = max(0.0, clampedT - active.t0)
        let beatFrac = active.durSec > 0 ? min(max(beatSec / active.durSec, 0.0), 1.0) : 0.0

        var flash = 0.0
        if let flashAt = active.flashAt {
            let dist = abs(beatFrac - flashAt)
            let halfW = max(1e-4, active.flashWidth * 0.5)
            if dist < halfW {
                let u = 1.0 - (dist / halfW)
                flash = u * u * (3.0 - 2.0 * u)
            }
        }

        return StageClock(
            t: clampedT,
            tWarped: warpedT,
            totalDuration: total,
            activeBeatId: active.id,
            beatFrac: beatFrac,
            beatSec: beatSec,
            caption: active.caption,
            flashIntensity: flash
        )
    }

    // MARK: - Pure Easing Curves

    public static func evalCurve(_ curve: String, u rawU: Double) -> Double {
        let u = min(max(rawU, 0.0), 1.0)
        switch curve {
        case "linear":
            return u
        case "ease_in":
            return u * u * u
        case "ease_out":
            let inv = 1.0 - u
            return 1.0 - inv * inv * inv
        case "ease_in_out", "smoothstep":
            return u * u * (3.0 - 2.0 * u)
        case "hold_step":
            return u >= 1.0 ? 1.0 : 0.0
        case "ease_out_back":
            let c1 = 1.70158
            let c3 = c1 + 1.0
            let u1 = u - 1.0
            return 1.0 + c3 * u1 * u1 * u1 + c1 * u1 * u1
        case "spring":
            if u <= 0.0 { return 0.0 }
            if u >= 1.0 { return 1.0 }
            return 1.0 - exp(-6.5 * u) * cos(12.0 * u)
        case "bump":
            // Smooth 0 -> 1 -> 0 envelope across [0, 1] with flat plateau in [0.15, 0.85]
            if u <= 0.0 || u >= 1.0 { return 0.0 }
            if u < 0.15 {
                let x = u / 0.15
                return x * x * (3.0 - 2.0 * x)
            } else if u > 0.85 {
                let x = (1.0 - u) / 0.15
                return x * x * (3.0 - 2.0 * x)
            }
            return 1.0
        default:
            return u * u * (3.0 - 2.0 * u)
        }
    }

    // MARK: - Pure Expression Evaluator (for cue_sheet.procedural_expr)

    public static func evaluateExpression(_ expr: String, t: Double, tWarped: Double = 0.0) -> Double {
        var parser = ExpressionParser(source: expr, t: t, tWarped: tWarped)
        return parser.parseExpression()
    }
}

private struct ExpressionParser {
    private let chars: [Character]
    private var idx: Int = 0
    private let t: Double
    private let tWarped: Double

    init(source: String, t: Double, tWarped: Double) {
        self.chars = Array(source)
        self.t = t
        self.tWarped = tWarped
    }

    mutating func parseExpression() -> Double {
        var v = parseTerm()
        while true {
            skipWhitespace()
            if match("+") {
                v += parseTerm()
            } else if match("-") {
                v -= parseTerm()
            } else {
                break
            }
        }
        return v
    }

    private mutating func parseTerm() -> Double {
        var v = parseFactor()
        while true {
            skipWhitespace()
            if match("*") {
                v *= parseFactor()
            } else if match("/") {
                let denom = parseFactor()
                v = abs(denom) > 1e-12 ? (v / denom) : 0.0
            } else {
                break
            }
        }
        return v
    }

    private mutating func parseFactor() -> Double {
        skipWhitespace()
        if match("+") { return parseFactor() }
        if match("-") { return -parseFactor() }
        if match("(") {
            let v = parseExpression()
            skipWhitespace()
            _ = match(")")
            return v
        }
        if let num = parseNumber() {
            return num
        }
        let ident = parseIdentifier()
        skipWhitespace()
        if match("(") {
            var args: [Double] = []
            skipWhitespace()
            if !match(")") {
                while true {
                    args.append(parseExpression())
                    skipWhitespace()
                    if match(",") { continue }
                    _ = match(")")
                    break
                }
            }
            return evalFunction(ident.lowercased(), args: args)
        }
        switch ident.lowercased() {
        case "t": return t
        case "t_warped", "twarped": return tWarped
        case "pi", "math.pi": return Double.pi
        case "tau": return Double.pi * 2.0
        default: return 0.0
        }
    }

    private func evalFunction(_ name: String, args: [Double]) -> Double {
        let a0 = args.first ?? 0.0
        let a1 = args.count > 1 ? args[1] : 0.0
        let a2 = args.count > 2 ? args[2] : 1.0
        switch name {
        case "sin", "math.sin": return sin(a0)
        case "cos", "math.cos": return cos(a0)
        case "tan", "math.tan": return tan(a0)
        case "abs", "math.abs": return abs(a0)
        case "floor", "math.floor": return floor(a0)
        case "ceil", "math.ceil": return ceil(a0)
        case "round", "math.round": return round(a0)
        case "sqrt", "math.sqrt": return a0 >= 0 ? sqrt(a0) : 0.0
        case "quant":
            let step = max(1e-6, a1)
            return floor(a0 * step) / step
        case "min", "math.min": return min(a0, a1)
        case "max", "math.max": return max(a0, a1)
        case "clamp": return min(max(a0, a1), a2)
        case "smoothstep":
            let span = a1 - a0
            if abs(span) < 1e-12 { return 0.0 }
            let u = min(max((a2 - a0) / span, 0.0), 1.0)
            return u * u * (3.0 - 2.0 * u)
        default:
            return a0
        }
    }

    private mutating func skipWhitespace() {
        while idx < chars.count && chars[idx].isWhitespace {
            idx += 1
        }
    }

    private mutating func match(_ ch: Character) -> Bool {
        if idx < chars.count && chars[idx] == ch {
            idx += 1
            return true
        }
        return false
    }

    private mutating func parseNumber() -> Double? {
        skipWhitespace()
        let start = idx
        var hasDot = false
        while idx < chars.count {
            let c = chars[idx]
            if c.isNumber {
                idx += 1
            } else if c == "." && !hasDot {
                hasDot = true
                idx += 1
            } else {
                break
            }
        }
        guard idx > start else { return nil }
        let str = String(chars[start..<idx])
        return Double(str)
    }

    private mutating func parseIdentifier() -> String {
        skipWhitespace()
        let start = idx
        while idx < chars.count {
            let c = chars[idx]
            if c.isLetter || c.isNumber || c == "_" || c == "." {
                idx += 1
            } else {
                break
            }
        }
        guard idx > start else { return "" }
        return String(chars[start..<idx])
    }
}
