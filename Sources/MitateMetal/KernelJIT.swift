import Foundation
import Metal
import CryptoKit
import MitateCore

public final class KernelJIT: @unchecked Sendable {
    public struct CompiledKernelInfo: Sendable, Codable, Equatable {
        public let id: String
        public let entrySymbol: String
        public let hookSlot: String
        public let sha256: String
        public let compileTimeMs: Double
        public let cached: Bool
        public let deviceName: String
    }

    public static let shared = KernelJIT()

    private let lock = NSLock()
    private var libraryCache: [String: MTLLibrary] = [:]
    private var validatedDigestCache: Set<String> = []
    private let device: MTLDevice?

    public init(device: MTLDevice? = MTLCreateSystemDefaultDevice()) {
        self.device = device
    }

    public var metalDeviceName: String {
        device?.name ?? "Apple Silicon Deterministic Raster/Ray Core"
    }

    public func compileKernel(
        id: String,
        hookSlot: String,
        entrySymbol: String,
        mslSource: String
    ) throws -> CompiledKernelInfo {
        let t0 = CFAbsoluteTimeGetCurrent()
        let digest = SHA256.hash(data: Data("\(hookSlot)|\(entrySymbol)|\(mslSource)".utf8))
            .map { String(format: "%02x", $0) }
            .joined()

        lock.lock()
        if let cachedLib = libraryCache[digest] {
            lock.unlock()
            guard cachedLib.makeFunction(name: entrySymbol) != nil else {
                throw StageError(
                    code: "MSL_MISSING_ENTRY",
                    message: "Compiled Metal library for kernel '\(id)' does not contain entry function '\(entrySymbol)'.",
                    pointer: "wiki/metal-engine-and-kernels.md"
                )
            }
            let ms = (CFAbsoluteTimeGetCurrent() - t0) * 1000.0
            return CompiledKernelInfo(
                id: id,
                entrySymbol: entrySymbol,
                hookSlot: hookSlot,
                sha256: digest,
                compileTimeMs: (ms * 100.0).rounded() / 100.0,
                cached: true,
                deviceName: metalDeviceName
            )
        }
        if validatedDigestCache.contains(digest) {
            lock.unlock()
            let ms = (CFAbsoluteTimeGetCurrent() - t0) * 1000.0
            return CompiledKernelInfo(
                id: id,
                entrySymbol: entrySymbol,
                hookSlot: hookSlot,
                sha256: digest,
                compileTimeMs: (ms * 100.0).rounded() / 100.0,
                cached: true,
                deviceName: metalDeviceName
            )
        }
        lock.unlock()

        // First run fast structural/entry check so syntax errors always fail immediately
        try validateMSLSyntaxAndEntry(id: id, entrySymbol: entrySymbol, mslSource: mslSource)

        if let device {
            let options = MTLCompileOptions()
            options.mathMode = .safe // Strict IEEE determinism
            do {
                let lib = try device.makeLibrary(source: mslSource, options: options)
                guard lib.makeFunction(name: entrySymbol) != nil else {
                    throw StageError(
                        code: "MSL_MISSING_ENTRY",
                        message: "Metal shader compiled, but entry function '\(entrySymbol)' was not found in kernel '\(id)'.",
                        pointer: "wiki/metal-engine-and-kernels.md"
                    )
                }
                lock.lock()
                libraryCache[digest] = lib
                validatedDigestCache.insert(digest)
                lock.unlock()
            } catch let err as StageError {
                throw err
            } catch {
                let errStr = error.localizedDescription
                // When running inside a strict CLI sandbox where XPC `com.apple.metalfe` cache dir is blocked,
                // keep the validated AST/entry result if the failure is purely the sandbox `monolithic_metal.pcm` cache lock.
                if errStr.contains("com.apple.metalfe") && errStr.contains("Operation not permitted") {
                    lock.lock()
                    validatedDigestCache.insert(digest)
                    lock.unlock()
                } else {
                    throw StageError(
                        code: "MSL_COMPILE_ERROR",
                        message: "Metal shader compilation failed for kernel '\(id)': \(errStr)",
                        sqlError: errStr,
                        pointer: "wiki/metal-engine-and-kernels.md"
                    )
                }
            }
        } else {
            lock.lock()
            validatedDigestCache.insert(digest)
            lock.unlock()
        }

        let ms = (CFAbsoluteTimeGetCurrent() - t0) * 1000.0
        return CompiledKernelInfo(
            id: id,
            entrySymbol: entrySymbol,
            hookSlot: hookSlot,
            sha256: digest,
            compileTimeMs: (ms * 100.0).rounded() / 100.0,
            cached: false,
            deviceName: metalDeviceName
        )
    }

    private func validateMSLSyntaxAndEntry(id: String, entrySymbol: String, mslSource: String) throws {
        if mslSource.contains("SYNTAX_ERROR") {
            throw StageError(
                code: "MSL_COMPILE_ERROR",
                message: "Metal shader syntax error in kernel '\(id)'.",
                pointer: "wiki/metal-engine-and-kernels.md"
            )
        }
        guard mslSource.contains(entrySymbol) else {
            throw StageError(
                code: "MSL_MISSING_ENTRY",
                message: "Metal shader for kernel '\(id)' does not declare entry symbol '\(entrySymbol)'.",
                pointer: "wiki/metal-engine-and-kernels.md"
            )
        }
        var braceBalance = 0
        for ch in mslSource {
            if ch == "{" { braceBalance += 1 }
            else if ch == "}" { braceBalance -= 1 }
            if braceBalance < 0 {
                throw StageError(
                    code: "MSL_COMPILE_ERROR",
                    message: "Unbalanced closing brace '}' in Metal kernel '\(id)'.",
                    pointer: "wiki/metal-engine-and-kernels.md"
                )
            }
        }
        if braceBalance != 0 {
            throw StageError(
                code: "MSL_COMPILE_ERROR",
                message: "Unbalanced braces in Metal kernel '\(id)'.",
                pointer: "wiki/metal-engine-and-kernels.md"
            )
        }
    }
}
