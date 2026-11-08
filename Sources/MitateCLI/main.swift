import Foundation
import MitateCore
import MitateMetal
import MitateWeb

private struct CLIEnvelope<T: Encodable>: Encodable {
    let ok: Bool
    let command: String
    let db: String?
    let duration_ms: Double
    let payload: T?
    let error: StageError?
}

private func emitJSON<T: Encodable>(
    ok: Bool,
    command: String,
    db: String? = nil,
    startTime: CFAbsoluteTime,
    payload: T? = nil,
    error: StageError? = nil
) -> Never {
    let elapsedMs = (CFAbsoluteTimeGetCurrent() - startTime) * 1000.0
    let env = CLIEnvelope(
        ok: ok,
        command: command,
        db: db,
        duration_ms: (elapsedMs * 100.0).rounded() / 100.0,
        payload: payload,
        error: error
    )
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    if let data = try? encoder.encode(env), let str = String(data: data, encoding: .utf8) {
        print(str)
    } else {
        print("{\"ok\":false,\"command\":\"\(command)\"}")
    }
    Foundation.exit(ok ? 0 : 1)
}

let startTime = CFAbsoluteTimeGetCurrent()
let args = Array(CommandLine.arguments.dropFirst())
let verb = args.first ?? "help"

do {
    switch verb {
    case "init":
        guard args.count >= 2 else {
            throw StageError(
                code: "MISSING_ARGUMENT",
                message: "Usage: mitate init <shot.db> [--preset three-point-studio|explainer-stage|character-stage|sunlit-exterior|none]",
                pointer: "wiki/instruments-and-review.md"
            )
        }
        let dbPath = args[1]
        var preset = "three-point-studio"
        var i = 2
        while i < args.count {
            if (args[i] == "--preset" || args[i] == "--template") && i + 1 < args.count {
                preset = args[i + 1]
                i += 2
            } else {
                i += 1
            }
        }
        for suffix in ["", "-wal", "-shm"] {
            let p = dbPath + suffix
            if FileManager.default.fileExists(atPath: p) {
                try? FileManager.default.removeItem(atPath: p)
            }
        }
        let db = try StageDB(path: dbPath, createIfMissing: true)
        try db.initializeStage(preset: preset)
        let checkReport = try StageCheck.validate(db: db)
        struct InitPayload: Encodable {
            let preset: String
            let check: CheckReport
        }
        emitJSON(
            ok: true,
            command: "init",
            db: dbPath,
            startTime: startTime,
            payload: InitPayload(preset: preset, check: checkReport)
        )

    case "schema":
        let tableFilter = args.count >= 2 ? args[1] : nil
        let memDB = try StageDB(path: ":memory:", createIfMissing: true)
        try memDB.initializeStage(preset: "none")
        let ddlMap = try memDB.schemaDDL(table: tableFilter)
        if let tableFilter, ddlMap.isEmpty {
            throw StageError(
                code: "UNKNOWN_TABLE",
                message: "Table or view '\(tableFilter)' does not exist. Valid tables: \(StageSchema.tableOrder.joined(separator: ", "))",
                pointer: "wiki/soundstage-schema.md"
            )
        }
        struct SchemaPayload: Encodable {
            let tables: [String]
            let ddl: [String: String]
        }
        emitJSON(
            ok: true,
            command: "schema",
            startTime: startTime,
            payload: SchemaPayload(tables: ddlMap.keys.sorted(), ddl: ddlMap)
        )

    case "recipe":
        let name = args.count >= 2 ? args[1] : "list"
        struct RecipeEntry: Encodable {
            let name: String
            let summary: String
            let sql: String?
        }
        if name == "list" {
            let entries = StageSchema.recipes.keys.sorted().map { k in
                RecipeEntry(name: k, summary: StageSchema.recipes[k]!.summary, sql: nil)
            }
            emitJSON(ok: true, command: "recipe", startTime: startTime, payload: entries)
        } else {
            guard let r = StageSchema.recipes[name] else {
                throw StageError(
                    code: "UNKNOWN_RECIPE",
                    message: "Unknown recipe '\(name)'. Available recipes: \(StageSchema.recipes.keys.sorted().joined(separator: ", "))",
                    pointer: "wiki/patterns-and-recipes.md"
                )
            }
            emitJSON(
                ok: true,
                command: "recipe",
                startTime: startTime,
                payload: RecipeEntry(name: name, summary: r.summary, sql: r.sql)
            )
        }

    case "sql":
        guard args.count >= 3 else {
            throw StageError(
                code: "MISSING_ARGUMENT",
                message: "Usage: mitate sql <shot.db> \"<SQL>\" | mitate sql <shot.db> -f <file.sql>",
                pointer: "wiki/soundstage-schema.md"
            )
        }
        let dbPath = args[1]
        let sql: String
        if (args[2] == "-f" || args[2] == "--file"), args.count >= 4 {
            let filePath = args[3]
            guard let content = try? String(contentsOfFile: filePath, encoding: .utf8) else {
                throw StageError(
                    code: "FILE_READ_ERROR",
                    message: "Unable to read SQL file at '\(filePath)'",
                    pointer: "wiki/soundstage-schema.md"
                )
            }
            sql = content
        } else {
            sql = args[2]
        }
        let db = try StageDB(path: dbPath, createIfMissing: false)
        let changed = try db.executeTransaction(sql)
        let checkReport = try StageCheck.validate(db: db)
        struct SQLPayload: Encodable {
            let rows_changed: Int
            let check: CheckReport
        }
        emitJSON(
            ok: checkReport.ok,
            command: "sql",
            db: dbPath,
            startTime: startTime,
            payload: SQLPayload(rows_changed: changed, check: checkReport)
        )

    case "kernel":
        guard args.count >= 2 else {
            throw StageError(
                code: "MISSING_ARGUMENT",
                message: "Usage: mitate kernel <shot.db> --id <id> --slot <kinematics|ray_medium|procedural_surface|lens_ray|finishing_pass> --file <shader.metal> [--entry <symbol>] [--purity pure_t|baked_sim]",
                pointer: "wiki/metal-engine-and-kernels.md"
            )
        }
        let dbPath = args[1]
        var kernelId = ""
        var slot = "kinematics"
        var filePath = ""
        var entrySymbol = ""
        var purity = "pure_t"
        var i = 2
        while i < args.count {
            switch args[i] {
            case "--id" where i + 1 < args.count:
                kernelId = args[i + 1]; i += 2
            case "--slot" where i + 1 < args.count:
                slot = args[i + 1]; i += 2
            case "--file" where i + 1 < args.count:
                filePath = args[i + 1]; i += 2
            case "--entry" where i + 1 < args.count:
                entrySymbol = args[i + 1]; i += 2
            case "--purity" where i + 1 < args.count:
                purity = args[i + 1]; i += 2
            default:
                i += 1
            }
        }
        guard !kernelId.isEmpty, !filePath.isEmpty else {
            throw StageError(
                code: "MISSING_ARGUMENT",
                message: "Both --id <id> and --file <shader.metal> are required for `mitate kernel`.",
                pointer: "wiki/metal-engine-and-kernels.md"
            )
        }
        let mslSource = try String(contentsOfFile: filePath, encoding: .utf8)
        let resolvedEntry = entrySymbol.isEmpty ? kernelId : entrySymbol
        // JIT compile / verify Metal shader before storing
        let jitInfo = try KernelJIT.shared.compileKernel(
            id: kernelId,
            hookSlot: slot,
            entrySymbol: resolvedEntry,
            mslSource: mslSource
        )
        let escapedSource = mslSource.replacingOccurrences(of: "'", with: "''")
        let db = try StageDB(path: dbPath, createIfMissing: false)
        _ = try db.executeTransaction("""
        INSERT OR REPLACE INTO gpu_kernels (id, hook_slot, purity_mode, entry_symbol, msl_source)
        VALUES ('\(kernelId)', '\(slot)', '\(purity)', '\(resolvedEntry)', '\(escapedSource)');
        """)
        emitJSON(
            ok: true,
            command: "kernel",
            db: dbPath,
            startTime: startTime,
            payload: jitInfo
        )

    case "check":
        guard args.count >= 2 else {
            throw StageError(
                code: "MISSING_ARGUMENT",
                message: "Usage: mitate check <shot.db>",
                pointer: "wiki/instruments-and-review.md"
            )
        }
        let dbPath = args[1]
        let db = try StageDB(path: dbPath, createIfMissing: false)
        let report = try StageCheck.validate(db: db)
        emitJSON(
            ok: report.ok,
            command: "check",
            db: dbPath,
            startTime: startTime,
            payload: report
        )

    case "bake":
        guard args.count >= 2 else {
            throw StageError(
                code: "MISSING_ARGUMENT",
                message: "Usage: mitate bake <shot.db> [--seed <N>] [--hz <hz>]",
                pointer: "wiki/time-and-beats.md"
            )
        }
        let dbPath = args[1]
        var seedOverride: Int? = nil
        var hz: Double = 60.0
        var i = 2
        while i < args.count {
            if args[i] == "--seed", i + 1 < args.count {
                seedOverride = Int(args[i + 1])
                i += 2
            } else if args[i] == "--hz", i + 1 < args.count {
                hz = Double(args[i + 1]) ?? 60.0
                i += 2
            } else {
                i += 1
            }
        }
        let db = try StageDB(path: dbPath, createIfMissing: false)
        let tracks = try BakeEngine.bakeAll(db: db, seedOverride: seedOverride, sampleHz: hz)
        struct BakeSummary: Encodable {
            let baked_track_count: Int
            let track_ids: [String]
            let sample_hz: Double
        }
        emitJSON(
            ok: true,
            command: "bake",
            db: dbPath,
            startTime: startTime,
            payload: BakeSummary(
                baked_track_count: tracks.count,
                track_ids: tracks.map(\.id),
                sample_hz: hz
            )
        )

    case "probe":
        guard args.count >= 2 else {
            throw StageError(
                code: "MISSING_ARGUMENT",
                message: "Usage: mitate probe <shot.db> [--t|--at <t|beat@frac>] [--actor <id>] [--sep <a> <b>] [--unwarp <t_sim>]",
                pointer: "wiki/instruments-and-review.md"
            )
        }
        let dbPath = args[1]
        var atSpec: String? = nil
        var actorFilter: String? = nil
        var sepPair: (String, String)? = nil
        var unwarpTime: Double? = nil

        var i = 2
        while i < args.count {
            let flag = args[i]
            if (flag == "--t" || flag == "--at"), i + 1 < args.count {
                atSpec = args[i + 1]
                i += 2
            } else if flag == "--actor", i + 1 < args.count {
                actorFilter = args[i + 1]
                i += 2
            } else if flag == "--sep", i + 2 < args.count {
                sepPair = (args[i + 1], args[i + 2])
                i += 3
            } else if flag == "--unwarp", i + 1 < args.count {
                unwarpTime = Double(args[i + 1])
                i += 2
            } else {
                i += 1
            }
        }
        let db = try StageDB(path: dbPath, createIfMissing: false)
        let report = try StageCheck.probe(
            db: db,
            atSpec: atSpec,
            actorFilter: actorFilter,
            sepPair: sepPair,
            unwarpDomainTime: unwarpTime
        )
        emitJSON(
            ok: true,
            command: "probe",
            db: dbPath,
            startTime: startTime,
            payload: report
        )

    case "quad":
        guard args.count >= 2 else {
            throw StageError(
                code: "MISSING_ARGUMENT",
                message: "Usage: mitate quad <shot.db> [--t|--at <t|beat@frac>] --out <quad.png|quad.jpg>",
                pointer: "wiki/instruments-and-review.md"
            )
        }
        let dbPath = args[1]
        var atSpec: String? = nil
        var outPath = "quad.png"
        var i = 2
        while i < args.count {
            let flag = args[i]
            if (flag == "--t" || flag == "--at"), i + 1 < args.count {
                atSpec = args[i + 1]; i += 2
            } else if flag == "--out", i + 1 < args.count {
                outPath = args[i + 1]; i += 2
            } else {
                i += 1
            }
        }
        let db = try StageDB(path: dbPath, createIfMissing: false)
        let report = try StageRenderer.renderQuad(db: db, atSpec: atSpec, outPath: outPath)
        emitJSON(ok: true, command: "quad", db: dbPath, startTime: startTime, payload: report)

    case "sheet":
        guard args.count >= 2 else {
            throw StageError(
                code: "MISSING_ARGUMENT",
                message: "Usage: mitate sheet <shot.db> [--frac 0.6] [--nocap] [--cols 3] --out <sheet.jpg>",
                pointer: "wiki/instruments-and-review.md"
            )
        }
        let dbPath = args[1]
        var frac = 0.6
        var nocap = false
        var cols = 3
        var outPath = "sheet.jpg"
        var i = 2
        while i < args.count {
            let flag = args[i]
            if flag == "--frac", i + 1 < args.count {
                frac = Double(args[i + 1]) ?? 0.6; i += 2
            } else if flag == "--nocap" {
                nocap = true; i += 1
            } else if flag == "--cols", i + 1 < args.count {
                cols = Int(args[i + 1]) ?? 3; i += 2
            } else if flag == "--out", i + 1 < args.count {
                outPath = args[i + 1]; i += 2
            } else {
                i += 1
            }
        }
        let db = try StageDB(path: dbPath, createIfMissing: false)
        let report = try StageRenderer.renderSheet(db: db, frac: frac, nocap: nocap, cols: cols, outPath: outPath)
        emitJSON(ok: true, command: "sheet", db: dbPath, startTime: startTime, payload: report)

    case "strip":
        guard args.count >= 2 else {
            throw StageError(
                code: "MISSING_ARGUMENT",
                message: "Usage: mitate strip <shot.db> --from <beat@frac> --to <beat@frac> [--frames 8] --out <strip.jpg>",
                pointer: "wiki/instruments-and-review.md"
            )
        }
        let dbPath = args[1]
        var fromSpec = "0.0"
        var toSpec = "1.0"
        var frames = 8
        var outPath = "strip.jpg"
        var i = 2
        while i < args.count {
            let flag = args[i]
            if flag == "--from", i + 1 < args.count {
                fromSpec = args[i + 1]; i += 2
            } else if flag == "--to", i + 1 < args.count {
                toSpec = args[i + 1]; i += 2
            } else if flag == "--frames", i + 1 < args.count {
                frames = Int(args[i + 1]) ?? 8; i += 2
            } else if flag == "--out", i + 1 < args.count {
                outPath = args[i + 1]; i += 2
            } else {
                i += 1
            }
        }
        let db = try StageDB(path: dbPath, createIfMissing: false)
        let report = try StageRenderer.renderStrip(db: db, fromSpec: fromSpec, toSpec: toSpec, frameCount: frames, outPath: outPath)
        emitJSON(ok: true, command: "strip", db: dbPath, startTime: startTime, payload: report)

    case "smoke":
        guard args.count >= 2 else {
            throw StageError(
                code: "MISSING_ARGUMENT",
                message: "Usage: mitate smoke <shot.db> [--dump-frames <dir>]",
                pointer: "wiki/instruments-and-review.md"
            )
        }
        let dbPath = args[1]
        var dumpDir: String? = nil
        var i = 2
        while i < args.count {
            if args[i] == "--dump-frames" {
                if i + 1 < args.count && !args[i + 1].hasPrefix("--") {
                    dumpDir = args[i + 1]; i += 2
                } else {
                    dumpDir = "smoke_dumps"; i += 1
                }
            } else {
                i += 1
            }
        }
        let db = try StageDB(path: dbPath, createIfMissing: false)
        let report = try StageRenderer.runSmoke(db: db, dumpFramesDir: dumpDir)
        emitJSON(ok: report.ok, command: "smoke", db: dbPath, startTime: startTime, payload: report)

    case "shoot":
        guard args.count >= 2 else {
            throw StageError(
                code: "MISSING_ARGUMENT",
                message: "Usage: mitate shoot <shot.db> [--mode dailies|hero|reference] [--t|--at <t|beat@frac>] --out <take.mp4|take.mov|still.png>",
                pointer: "wiki/instruments-and-review.md"
            )
        }
        let dbPath = args[1]
        var mode = "dailies"
        var atSpec: String? = nil
        var outPath = "take01.mp4"
        var i = 2
        while i < args.count {
            let flag = args[i]
            if flag == "--mode", i + 1 < args.count {
                mode = args[i + 1]; i += 2
            } else if (flag == "--t" || flag == "--at"), i + 1 < args.count {
                atSpec = args[i + 1]; i += 2
            } else if flag == "--out", i + 1 < args.count {
                outPath = args[i + 1]; i += 2
            } else {
                i += 1
            }
        }
        let db = try StageDB(path: dbPath, createIfMissing: false)
        let report = try StageRenderer.shoot(db: db, mode: mode, atSpec: atSpec, outPath: outPath)
        emitJSON(ok: true, command: "shoot", db: dbPath, startTime: startTime, payload: report)

    case "bundle":
        guard args.count >= 2 else {
            throw StageError(
                code: "MISSING_ARGUMENT",
                message: "Usage: mitate bundle <shot.db> --out <scene.html>",
                pointer: "wiki/instruments-and-review.md"
            )
        }
        let dbPath = args[1]
        var outPath = "scene.html"
        var i = 2
        while i < args.count {
            if args[i] == "--out", i + 1 < args.count {
                outPath = args[i + 1]; i += 2
            } else {
                i += 1
            }
        }
        let db = try StageDB(path: dbPath, createIfMissing: false)
        let report = try HTMLBundler.bundle(db: db, outPath: outPath)
        emitJSON(ok: true, command: "bundle", db: dbPath, startTime: startTime, payload: report)

    default:
        struct HelpPayload: Encodable {
            let commands: [String]
            let wiki_router: String
        }
        emitJSON(
            ok: verb == "help" || verb == "--help" || verb == "-h",
            command: verb,
            startTime: startTime,
            payload: HelpPayload(
                commands: [
                    "init", "schema", "recipe", "sql", "kernel", "bake",
                    "check", "probe", "quad", "sheet", "strip", "smoke", "shoot", "bundle"
                ],
                wiki_router: "AGENTS.md -> wiki/index.md"
            )
        )
    }
} catch let err as StageError {
    emitJSON(
        ok: false,
        command: verb,
        db: args.count >= 2 ? args[1] : nil,
        startTime: startTime,
        payload: Optional<String>.none,
        error: err
    )
} catch {
    emitJSON(
        ok: false,
        command: verb,
        db: args.count >= 2 ? args[1] : nil,
        startTime: startTime,
        payload: Optional<String>.none,
        error: StageError(code: "UNEXPECTED_ERROR", message: error.localizedDescription)
    )
}
