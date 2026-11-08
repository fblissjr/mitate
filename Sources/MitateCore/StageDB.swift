import Foundation
import SQLite3

private let SQLITE_TRANSIENT_DESTRUCTOR = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

public final class StageDB: @unchecked Sendable {
    public let path: String
    private var handle: OpaquePointer?

    public init(path: String, createIfMissing: Bool = true) throws {
        self.path = path
        let flags = createIfMissing
            ? (SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX)
            : (SQLITE_OPEN_READWRITE | SQLITE_OPEN_FULLMUTEX)
        var db: OpaquePointer?
        let rc = sqlite3_open_v2(path, &db, flags, nil)
        guard rc == SQLITE_OK, let opened = db else {
            let msg = db.flatMap { sqlite3_errmsg($0) }.map { String(cString: $0) } ?? "Failed to open SQLite database"
            if let db { sqlite3_close(db) }
            throw StageError(
                code: "SQLITE_OPEN_ERROR",
                message: "Unable to open database at '\(path)'",
                sqlError: msg,
                pointer: "wiki/soundstage-schema.md"
            )
        }
        self.handle = opened
        try execRaw("PRAGMA foreign_keys = ON;")
        _ = try? execRaw("PRAGMA journal_mode = WAL;")
    }

    deinit {
        if let handle {
            sqlite3_close(handle)
        }
    }

    public func initializeStage(preset: String? = "three-point-studio") throws {
        try execRaw(StageSchema.bootstrapSQL)
        if let preset, !preset.isEmpty, preset != "none" {
            guard let sql = StageSchema.presetSQL(named: preset) else {
                throw StageError(
                    code: "UNKNOWN_PRESET",
                    message: "Unknown stage preset '\(preset)'. Valid presets: three-point-studio, explainer-stage, character-stage, sunlit-exterior, none.",
                    pointer: "wiki/instruments-and-review.md"
                )
            }
            try executeTransaction(sql)
        }
    }

    @discardableResult
    public func executeTransaction(_ sql: String) throws -> Int {
        let before = Int(sqlite3_total_changes(handle))
        try execRaw("BEGIN IMMEDIATE TRANSACTION;")
        do {
            try execRaw(sql)
            // Verify foreign key integrity before committing
            let fkViolations = try checkForeignKeys()
            if !fkViolations.isEmpty {
                try? execRaw("ROLLBACK;")
                throw StageError(
                    code: "FOREIGN_KEY_VIOLATION",
                    message: "Foreign key constraint failed on table '\(fkViolations[0].table)' referencing '\(fkViolations[0].parent)'",
                    sqlError: fkViolations.map { "\($0.table)->\($0.parent)" }.joined(separator: ", "),
                    pointer: situatedPointer(forError: fkViolations[0].table)
                )
            }
            try execRaw("COMMIT;")
        } catch {
            try? execRaw("ROLLBACK;")
            throw error
        }
        let after = Int(sqlite3_total_changes(handle))
        return max(0, after - before)
    }

    public func execRaw(_ sql: String) throws {
        guard let handle else {
            throw StageError(code: "DB_CLOSED", message: "Database handle is closed")
        }
        var errMsg: UnsafeMutablePointer<CChar>?
        let rc = sqlite3_exec(handle, sql, nil, nil, &errMsg)
        if rc != SQLITE_OK {
            let detail = errMsg.map { String(cString: $0) } ?? "SQLite error (\(rc))"
            if let errMsg { sqlite3_free(errMsg) }
            throw StageError(
                code: "SQL_EXECUTION_ERROR",
                message: "SQL execution failed: \(detail)",
                sqlError: detail,
                pointer: situatedPointer(forError: detail + " " + sql)
            )
        }
    }

    private func situatedPointer(forError text: String) -> String {
        let lower = text.lowercased()
        if lower.contains("beats") || lower.contains("warp_segments") || lower.contains("baked_tracks") {
            return "wiki/time-and-beats.md"
        }
        if lower.contains("characters") || lower.contains("shots") || lower.contains("subjects") || lower.contains("sizes") || lower.contains("style_bibles") {
            return "wiki/cinematography-and-rigging.md"
        }
        if lower.contains("gpu_kernels") || lower.contains("state_buffers") || lower.contains("swarms") {
            return "wiki/metal-engine-and-kernels.md"
        }
        return "wiki/soundstage-schema.md"
    }

    public func schemaDDL(table: String? = nil) throws -> [String: String] {
        var result: [String: String] = [:]
        let sql: String
        if let table, !table.isEmpty {
            sql = "SELECT name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name = ? ORDER BY type DESC, name ASC;"
        } else {
            sql = "SELECT name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY name ASC;"
        }
        try query(sql, bind: { stmt in
            if let table, !table.isEmpty {
                sqlite3_bind_text(stmt, 1, table, -1, SQLITE_TRANSIENT_DESTRUCTOR)
            }
        }, row: { stmt in
            let name = Self.colString(stmt, 0) ?? ""
            let ddl = Self.colString(stmt, 1) ?? ""
            if !name.isEmpty {
                result[name] = ddl
            }
        })
        return result
    }

    public func checkForeignKeys() throws -> [(table: String, rowid: Int64, parent: String, fkid: Int)] {
        var list: [(String, Int64, String, Int)] = []
        try query("PRAGMA foreign_key_check;", row: { stmt in
            let table = Self.colString(stmt, 0) ?? "unknown"
            let rowid = sqlite3_column_int64(stmt, 1)
            let parent = Self.colString(stmt, 2) ?? "unknown"
            let fkid = Int(sqlite3_column_int(stmt, 3))
            list.append((table, rowid, parent, fkid))
        })
        return list
    }

    // MARK: - Typed Table Loaders

    public func loadBeats() throws -> [BeatRow] {
        var rows: [BeatRow] = []
        let sql = "SELECT id, seq_order, dur_sec, t0, t1, caption, act, flash_at, flash_width FROM v_beats ORDER BY seq_order ASC;"
        try query(sql, row: { stmt in
            rows.append(BeatRow(
                id: Self.colString(stmt, 0) ?? "",
                seqOrder: Int(sqlite3_column_int(stmt, 1)),
                durSec: sqlite3_column_double(stmt, 2),
                t0: sqlite3_column_double(stmt, 3),
                t1: sqlite3_column_double(stmt, 4),
                caption: Self.colString(stmt, 5),
                act: Self.colString(stmt, 6),
                flashAt: Self.colOptionalDouble(stmt, 7),
                flashWidth: sqlite3_column_double(stmt, 8)
            ))
        })
        return rows
    }

    public func loadSlate() throws -> SlateRow {
        var slate = SlateRow(
            productionTitle: "Mitate v2 Soundstage",
            width: 1920,
            height: 1080,
            fps: 24,
            fallbackDurSec: 4.0,
            titleCardText: nil,
            subtitleText: nil,
            activeCamera: nil,
            activeBible: "workshop",
            exposureEv: 0.0,
            contrast: 1.0,
            sppDraft: 4,
            sppFinal: 32,
            randomSeed: 101
        )
        let sql = """
        SELECT production_title, width, height, fps, fallback_dur_sec,
               title_card_text, subtitle_text, active_camera, active_bible,
               exposure_ev, contrast, spp_draft, spp_final, random_seed
        FROM slate WHERE id = 1;
        """
        try query(sql, row: { stmt in
            slate = SlateRow(
                productionTitle: Self.colString(stmt, 0) ?? "Mitate v2 Soundstage",
                width: Int(sqlite3_column_int(stmt, 1)),
                height: Int(sqlite3_column_int(stmt, 2)),
                fps: Int(sqlite3_column_int(stmt, 3)),
                fallbackDurSec: sqlite3_column_double(stmt, 4),
                titleCardText: Self.colString(stmt, 5),
                subtitleText: Self.colString(stmt, 6),
                activeCamera: Self.colString(stmt, 7),
                activeBible: Self.colString(stmt, 8) ?? "workshop",
                exposureEv: sqlite3_column_double(stmt, 9),
                contrast: sqlite3_column_double(stmt, 10),
                sppDraft: Int(sqlite3_column_int(stmt, 11)),
                sppFinal: Int(sqlite3_column_int(stmt, 12)),
                randomSeed: Int(sqlite3_column_int(stmt, 13))
            )
        })
        return slate
    }

    public func loadStyleBibles() throws -> [String: StyleBibleRow] {
        var map: [String: StyleBibleRow] = [:]
        let sql = """
        SELECT id, backdrop_mode, backdrop_color, exposure_ev, contrast,
               roughness_floor, color_transform, lens_mm, camera_energy,
               sway_amp, cut_whip_sec, cut_blend_sec, bloom_strength,
               bloom_threshold, dof_fstop, outline_width, palette_json
        FROM style_bibles;
        """
        try query(sql, row: { stmt in
            let row = StyleBibleRow(
                id: Self.colString(stmt, 0) ?? "workshop",
                backdropMode: Self.colString(stmt, 1) ?? "solid_color",
                backdropColor: Self.colString(stmt, 2) ?? "#141619",
                exposureEv: sqlite3_column_double(stmt, 3),
                contrast: sqlite3_column_double(stmt, 4),
                roughnessFloor: sqlite3_column_double(stmt, 5),
                colorTransform: Self.colString(stmt, 6) ?? "agx",
                lensMm: sqlite3_column_double(stmt, 7),
                cameraEnergy: Self.colString(stmt, 8) ?? "locked",
                swayAmp: sqlite3_column_double(stmt, 9),
                cutWhipSec: sqlite3_column_double(stmt, 10),
                cutBlendSec: sqlite3_column_double(stmt, 11),
                bloomStrength: sqlite3_column_double(stmt, 12),
                bloomThreshold: sqlite3_column_double(stmt, 13),
                dofFstop: Self.colOptionalDouble(stmt, 14),
                outlineWidth: sqlite3_column_double(stmt, 15),
                paletteJson: Self.colString(stmt, 16) ?? "{}"
            )
            map[row.id] = row
        })
        return map
    }

    public func loadSizes() throws -> [String: SizeRow] {
        var map: [String: SizeRow] = [:]
        let sql = "SELECT rung, frame_frac, anchor_y, fov_deg, description FROM sizes;"
        try query(sql, row: { stmt in
            let row = SizeRow(
                rung: Self.colString(stmt, 0) ?? "FSA",
                frameFrac: sqlite3_column_double(stmt, 1),
                anchorY: sqlite3_column_double(stmt, 2),
                fovDeg: sqlite3_column_double(stmt, 3),
                description: Self.colString(stmt, 4) ?? ""
            )
            map[row.rung] = row
        })
        return map
    }

    public func loadActors() throws -> [ActorRow] {
        var list: [ActorRow] = []
        let sql = """
        SELECT id, parent_id, role, x, y, z, pitch_deg, yaw_deg, roll_deg,
               scale_x, scale_y, scale_z, scale_gate, aim_at, bank_deg,
               visible, kinematics_kernel
        FROM actors ORDER BY id ASC;
        """
        try query(sql, row: { stmt in
            list.append(ActorRow(
                id: Self.colString(stmt, 0) ?? "",
                parentId: Self.colString(stmt, 1),
                role: Self.colString(stmt, 2) ?? "prop",
                x: sqlite3_column_double(stmt, 3),
                y: sqlite3_column_double(stmt, 4),
                z: sqlite3_column_double(stmt, 5),
                pitchDeg: sqlite3_column_double(stmt, 6),
                yawDeg: sqlite3_column_double(stmt, 7),
                rollDeg: sqlite3_column_double(stmt, 8),
                scaleX: sqlite3_column_double(stmt, 9),
                scaleY: sqlite3_column_double(stmt, 10),
                scaleZ: sqlite3_column_double(stmt, 11),
                scaleGate: sqlite3_column_double(stmt, 12),
                aimAt: Self.colString(stmt, 13),
                bankDeg: sqlite3_column_double(stmt, 14),
                visible: sqlite3_column_int(stmt, 15) != 0,
                kinematicsKernel: Self.colString(stmt, 16)
            ))
        })
        return list
    }

    public func loadProps() throws -> [String: PropRow] {
        var map: [String: PropRow] = [:]
        let sql = """
        SELECT actor_id, shape, shader_id, radius_m, inner_radius_m,
               width_m, height_m, depth_m, tooth_count, bevel_radius_m,
               subdiv_level, text_string, extrude_m, csg_tree, params_json
        FROM props;
        """
        try query(sql, row: { stmt in
            let row = PropRow(
                actorId: Self.colString(stmt, 0) ?? "",
                shape: Self.colString(stmt, 1) ?? "cube",
                shaderId: Self.colString(stmt, 2) ?? "studio_matte",
                radiusM: sqlite3_column_double(stmt, 3),
                innerRadiusM: sqlite3_column_double(stmt, 4),
                widthM: sqlite3_column_double(stmt, 5),
                heightM: sqlite3_column_double(stmt, 6),
                depthM: sqlite3_column_double(stmt, 7),
                toothCount: Int(sqlite3_column_int(stmt, 8)),
                bevelRadiusM: sqlite3_column_double(stmt, 9),
                subdivLevel: Int(sqlite3_column_int(stmt, 10)),
                textString: Self.colString(stmt, 11),
                extrudeM: sqlite3_column_double(stmt, 12),
                csgTree: Self.colString(stmt, 13) ?? "{}",
                paramsJson: Self.colString(stmt, 14) ?? "{}"
            )
            map[row.actorId] = row
        })
        return map
    }

    public func loadCharacters() throws -> [String: CharacterRow] {
        var map: [String: CharacterRow] = [:]
        let sql = """
        SELECT actor_id, preset, quadruped, hip_h, torso_len, torso_tilt_deg,
               pelvis_r, chest_r, shoulder_w, hip_w, neck_len, neck_segs,
               head_r, muzzle_len, tail_len, tail_segs, fore_upper, fore_lower,
               fore_r, hind_upper, hind_lower, hind_r, foot_len, foot_h,
               fur_shells, fur_length_m, walk_start_x, stride_m, step_lift_m, shader_map_json
        FROM characters;
        """
        try query(sql, row: { stmt in
            let row = CharacterRow(
                actorId: Self.colString(stmt, 0) ?? "",
                preset: Self.colString(stmt, 1) ?? "biped",
                quadruped: sqlite3_column_int(stmt, 2) != 0,
                hipH: sqlite3_column_double(stmt, 3),
                torsoLen: sqlite3_column_double(stmt, 4),
                torsoTiltDeg: sqlite3_column_double(stmt, 5),
                pelvisR: sqlite3_column_double(stmt, 6),
                chestR: sqlite3_column_double(stmt, 7),
                shoulderW: sqlite3_column_double(stmt, 8),
                hipW: sqlite3_column_double(stmt, 9),
                neckLen: sqlite3_column_double(stmt, 10),
                neckSegs: Int(sqlite3_column_int(stmt, 11)),
                headR: sqlite3_column_double(stmt, 12),
                muzzleLen: sqlite3_column_double(stmt, 13),
                tailLen: sqlite3_column_double(stmt, 14),
                tailSegs: Int(sqlite3_column_int(stmt, 15)),
                foreUpper: sqlite3_column_double(stmt, 16),
                foreLower: sqlite3_column_double(stmt, 17),
                foreR: sqlite3_column_double(stmt, 18),
                hindUpper: sqlite3_column_double(stmt, 19),
                hindLower: sqlite3_column_double(stmt, 20),
                hindR: sqlite3_column_double(stmt, 21),
                footLen: sqlite3_column_double(stmt, 22),
                footH: sqlite3_column_double(stmt, 23),
                furShells: Int(sqlite3_column_int(stmt, 24)),
                furLengthM: sqlite3_column_double(stmt, 25),
                walkStartX: sqlite3_column_double(stmt, 26),
                strideM: sqlite3_column_double(stmt, 27),
                stepLiftM: sqlite3_column_double(stmt, 28),
                shaderMapJson: Self.colString(stmt, 29) ?? "{}"
            )
            map[row.actorId] = row
        })
        return map
    }

    public func loadSubjects() throws -> [String: SubjectRow] {
        var map: [String: SubjectRow] = [:]
        let sql = """
        SELECT id, actor_id, member_actors_json, extent_mode,
               height_m, width_m, depth_m, headroom_m, aim_y_frac, extent_note
        FROM subjects;
        """
        try query(sql, row: { stmt in
            let row = SubjectRow(
                id: Self.colString(stmt, 0) ?? "",
                actorId: Self.colString(stmt, 1),
                memberActorsJson: Self.colString(stmt, 2) ?? "[]",
                extentMode: Self.colString(stmt, 3) ?? "auto_bounds",
                heightM: sqlite3_column_double(stmt, 4),
                widthM: sqlite3_column_double(stmt, 5),
                depthM: sqlite3_column_double(stmt, 6),
                headroomM: sqlite3_column_double(stmt, 7),
                aimYFrac: sqlite3_column_double(stmt, 8),
                extentNote: Self.colString(stmt, 9)
            )
            map[row.id] = row
        })
        return map
    }

    public func loadShots() throws -> [ShotRow] {
        var list: [ShotRow] = []
        let sql = """
        SELECT id, seq_order, beat_id, beat_frac, subject_id, size_rung,
               angle_deg, elev_deg, fov_mm, size2_rung, angle2_deg,
               focus_subject_id, camera_energy, anchor_y, anchor_x,
               cut_kind, match_prev, cut_reason
        FROM shots ORDER BY seq_order ASC;
        """
        try query(sql, row: { stmt in
            list.append(ShotRow(
                id: Int(sqlite3_column_int(stmt, 0)),
                seqOrder: Int(sqlite3_column_int(stmt, 1)),
                beatId: Self.colString(stmt, 2) ?? "",
                beatFrac: sqlite3_column_double(stmt, 3),
                subjectId: Self.colString(stmt, 4) ?? "",
                sizeRung: Self.colString(stmt, 5) ?? "FSA",
                angleDeg: sqlite3_column_double(stmt, 6),
                elevDeg: sqlite3_column_double(stmt, 7),
                fovMm: Self.colOptionalDouble(stmt, 8),
                size2Rung: Self.colString(stmt, 9),
                angle2Deg: Self.colOptionalDouble(stmt, 10),
                focusSubjectId: Self.colString(stmt, 11),
                cameraEnergy: Self.colString(stmt, 12),
                anchorY: Self.colOptionalDouble(stmt, 13),
                anchorX: sqlite3_column_double(stmt, 14),
                cutKind: Self.colString(stmt, 15) ?? "hard",
                matchPrev: sqlite3_column_int(stmt, 16) != 0,
                cutReason: Self.colString(stmt, 17)
            ))
        })
        return list
    }

    public func loadCues() throws -> [CueRow] {
        var list: [CueRow] = []
        let sql = """
        SELECT id, actor_id, channel, beat_id, beat_frac, end_beat_id, end_beat_frac,
               offset_sec, dur_sec, start_val, end_val, curve, procedural_expr
        FROM cue_sheet ORDER BY id ASC;
        """
        try query(sql, row: { stmt in
            list.append(CueRow(
                id: Int(sqlite3_column_int(stmt, 0)),
                actorId: Self.colString(stmt, 1) ?? "",
                channel: Self.colString(stmt, 2) ?? "x",
                beatId: Self.colString(stmt, 3),
                beatFrac: sqlite3_column_double(stmt, 4),
                endBeatId: Self.colString(stmt, 5),
                endBeatFrac: Self.colOptionalDouble(stmt, 6),
                offsetSec: Self.colOptionalDouble(stmt, 7),
                durSec: Self.colOptionalDouble(stmt, 8),
                startVal: sqlite3_column_double(stmt, 9),
                endVal: sqlite3_column_double(stmt, 10),
                curve: Self.colString(stmt, 11) ?? "ease_in_out",
                proceduralExpr: Self.colString(stmt, 12)
            ))
        })
        return list
    }

    public func loadWarpSegments() throws -> [WarpSegmentRow] {
        var list: [WarpSegmentRow] = []
        let sql = "SELECT id, beat_id, beat_frac, dur_sec, rate FROM warp_segments ORDER BY id ASC;"
        try query(sql, row: { stmt in
            list.append(WarpSegmentRow(
                id: Int(sqlite3_column_int(stmt, 0)),
                beatId: Self.colString(stmt, 1) ?? "",
                beatFrac: sqlite3_column_double(stmt, 2),
                durSec: sqlite3_column_double(stmt, 3),
                rate: sqlite3_column_double(stmt, 4)
            ))
        })
        return list
    }

    public func loadGPUKernels() throws -> [GPUKernelRow] {
        var list: [GPUKernelRow] = []
        let sql = """
        SELECT id, hook_slot, purity_mode, entry_symbol, threadgroup_size, msl_source, uniforms_json
        FROM gpu_kernels ORDER BY id ASC;
        """
        try query(sql, row: { stmt in
            list.append(GPUKernelRow(
                id: Self.colString(stmt, 0) ?? "",
                hookSlot: Self.colString(stmt, 1) ?? "kinematics",
                purityMode: Self.colString(stmt, 2) ?? "pure_t",
                entrySymbol: Self.colString(stmt, 3) ?? "",
                threadgroupSize: Int(sqlite3_column_int(stmt, 4)),
                mslSource: Self.colString(stmt, 5) ?? "",
                uniformsJson: Self.colString(stmt, 6) ?? "{}"
            ))
        })
        return list
    }

    public func loadSurfaceShaders() throws -> [String: SurfaceShaderRow] {
        var map: [String: SurfaceShaderRow] = [:]
        let sql = """
        SELECT id, mode, albedo, metalness, roughness, ior, clarity, abbe_dispersion,
               subsurface_weight, subsurface_mfp, clearcoat, fuzz_weight, fuzz_tint,
               glow_color, glow_nits, opacity, procedural_kernel
        FROM surface_shaders;
        """
        try query(sql, row: { stmt in
            let row = SurfaceShaderRow(
                id: Self.colString(stmt, 0) ?? "studio_matte",
                mode: Self.colString(stmt, 1) ?? "pbr",
                albedo: Self.colString(stmt, 2) ?? "#9aa2ad",
                metalness: sqlite3_column_double(stmt, 3),
                roughness: sqlite3_column_double(stmt, 4),
                ior: sqlite3_column_double(stmt, 5),
                clarity: sqlite3_column_double(stmt, 6),
                abbeDispersion: sqlite3_column_double(stmt, 7),
                subsurfaceWeight: sqlite3_column_double(stmt, 8),
                subsurfaceMfp: Self.colString(stmt, 9) ?? "#ff5f45",
                clearcoat: sqlite3_column_double(stmt, 10),
                fuzzWeight: sqlite3_column_double(stmt, 11),
                fuzzTint: Self.colString(stmt, 12) ?? "#ffffff",
                glowColor: Self.colString(stmt, 13) ?? "#000000",
                glowNits: sqlite3_column_double(stmt, 14),
                opacity: sqlite3_column_double(stmt, 15),
                proceduralKernel: Self.colString(stmt, 16)
            )
            map[row.id] = row
        })
        return map
    }

    public func loadLamps() throws -> [String: LampRow] {
        var map: [String: LampRow] = [:]
        let sql = """
        SELECT actor_id, type, kelvin, lumens, tint_hex, spread_angle, softness,
               width_m, height_m, volumetric_dust, cast_shadows
        FROM lamps;
        """
        try query(sql, row: { stmt in
            let row = LampRow(
                actorId: Self.colString(stmt, 0) ?? "",
                type: Self.colString(stmt, 1) ?? "area_rect",
                kelvin: sqlite3_column_double(stmt, 2),
                lumens: sqlite3_column_double(stmt, 3),
                tintHex: Self.colString(stmt, 4) ?? "#ffffff",
                spreadAngle: sqlite3_column_double(stmt, 5),
                softness: sqlite3_column_double(stmt, 6),
                widthM: sqlite3_column_double(stmt, 7),
                heightM: sqlite3_column_double(stmt, 8),
                volumetricDust: sqlite3_column_double(stmt, 9),
                castShadows: sqlite3_column_int(stmt, 10) != 0
            )
            map[row.actorId] = row
        })
        return map
    }

    public func loadAtmospheres() throws -> [AtmosphereRow] {
        var list: [AtmosphereRow] = []
        let sql = """
        SELECT id, actor_id, mode, fog_density, anisotropy, base_height_m, falloff, scatter_hex
        FROM atmospheres ORDER BY id ASC;
        """
        try query(sql, row: { stmt in
            list.append(AtmosphereRow(
                id: Self.colString(stmt, 0) ?? "",
                actorId: Self.colString(stmt, 1),
                mode: Self.colString(stmt, 2) ?? "global_mist",
                fogDensity: sqlite3_column_double(stmt, 3),
                anisotropy: sqlite3_column_double(stmt, 4),
                baseHeightM: sqlite3_column_double(stmt, 5),
                falloff: sqlite3_column_double(stmt, 6),
                scatterHex: Self.colString(stmt, 7) ?? "#c8d6e5"
            ))
        })
        return list
    }

    public func loadFinishingChain() throws -> FinishingChainRow {
        var row = FinishingChainRow(
            toneMapper: "agx",
            exposureEv: 0.0,
            contrast: 1.0,
            saturation: 1.0,
            bloomIntensity: 0.05,
            bloomThreshold: 0.9,
            halationWeight: 0.0,
            chromaticAberration: 0.0,
            filmGrainIntensity: 0.02,
            vignetteWeight: 0.15,
            customKernel: nil
        )
        let sql = """
        SELECT tone_mapper, exposure_ev, contrast, saturation, bloom_intensity,
               bloom_threshold, halation_weight, chromatic_aberration,
               film_grain_intensity, vignette_weight, custom_kernel
        FROM finishing_chain WHERE id = 1;
        """
        try query(sql, row: { stmt in
            row = FinishingChainRow(
                toneMapper: Self.colString(stmt, 0) ?? "agx",
                exposureEv: sqlite3_column_double(stmt, 1),
                contrast: sqlite3_column_double(stmt, 2),
                saturation: sqlite3_column_double(stmt, 3),
                bloomIntensity: sqlite3_column_double(stmt, 4),
                bloomThreshold: sqlite3_column_double(stmt, 5),
                halationWeight: sqlite3_column_double(stmt, 6),
                chromaticAberration: sqlite3_column_double(stmt, 7),
                filmGrainIntensity: sqlite3_column_double(stmt, 8),
                vignetteWeight: sqlite3_column_double(stmt, 9),
                customKernel: Self.colString(stmt, 10)
            )
        })
        return row
    }

    public func recordTake(
        mode: String,
        renderTimeMs: Double,
        meanLuminance: Double,
        clippingPct: Double,
        outputPath: String
    ) throws {
        let escapedOut = outputPath.replacingOccurrences(of: "'", with: "''")
        let escapedMode = mode.replacingOccurrences(of: "'", with: "''")
        let sql = """
        INSERT INTO takes (mode, render_time_ms, mean_luminance, clipping_pct, output_path)
        VALUES ('\(escapedMode)', \(renderTimeMs), \(meanLuminance), \(clippingPct), '\(escapedOut)');
        """
        _ = try executeTransaction(sql)
    }

    public func loadBakedTracks() throws -> [String: BakedTrackRow] {
        var map: [String: BakedTrackRow] = [:]
        let sql = """
        SELECT id, target_domain, target_id, sample_hz, frame_count, seed, inputs_sha256, samples_blob
        FROM baked_tracks;
        """
        try query(sql, row: { stmt in
            let row = BakedTrackRow(
                id: Self.colString(stmt, 0) ?? "",
                targetDomain: Self.colString(stmt, 1) ?? "actors",
                targetId: Self.colString(stmt, 2) ?? "",
                sampleHz: sqlite3_column_double(stmt, 3),
                frameCount: Int(sqlite3_column_int(stmt, 4)),
                seed: Int(sqlite3_column_int(stmt, 5)),
                inputsSha256: Self.colString(stmt, 6) ?? "",
                samplesBlob: Self.colBlob(stmt, 7)
            )
            map[row.targetId] = row
            map[row.id] = row
        })
        return map
    }

    public func upsertBakedTrack(_ track: BakedTrackRow) throws {
        let sql = """
        INSERT OR REPLACE INTO baked_tracks (
            id, target_domain, target_id, sample_hz, frame_count, seed, inputs_sha256, samples_blob
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
        """
        guard let handle else { throw StageError(code: "DB_CLOSED", message: "DB closed") }
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(handle, sql, -1, &stmt, nil) == SQLITE_OK, let stmt else {
            let msg = String(cString: sqlite3_errmsg(handle))
            throw StageError(code: "SQL_PREPARE_ERROR", message: msg, sqlError: msg)
        }
        defer { sqlite3_finalize(stmt) }
        sqlite3_bind_text(stmt, 1, track.id, -1, SQLITE_TRANSIENT_DESTRUCTOR)
        sqlite3_bind_text(stmt, 2, track.targetDomain, -1, SQLITE_TRANSIENT_DESTRUCTOR)
        sqlite3_bind_text(stmt, 3, track.targetId, -1, SQLITE_TRANSIENT_DESTRUCTOR)
        sqlite3_bind_double(stmt, 4, track.sampleHz)
        sqlite3_bind_int(stmt, 5, Int32(track.frameCount))
        sqlite3_bind_int(stmt, 6, Int32(track.seed))
        sqlite3_bind_text(stmt, 7, track.inputsSha256, -1, SQLITE_TRANSIENT_DESTRUCTOR)
        track.samplesBlob.withUnsafeBytes { rawBuf in
            _ = sqlite3_bind_blob(stmt, 8, rawBuf.baseAddress, Int32(track.samplesBlob.count), SQLITE_TRANSIENT_DESTRUCTOR)
        }
        let rc = sqlite3_step(stmt)
        guard rc == SQLITE_DONE else {
            let msg = String(cString: sqlite3_errmsg(handle))
            throw StageError(code: "SQL_STEP_ERROR", message: msg, sqlError: msg)
        }
    }

    public func loadSetLintView() throws -> [(code: String, severity: String, target: String, message: String, fixHint: String)] {
        var rows: [(String, String, String, String, String)] = []
        let sql = "SELECT code, severity, target, message, fix_hint FROM v_set_lint;"
        try query(sql, row: { stmt in
            rows.append((
                Self.colString(stmt, 0) ?? "",
                Self.colString(stmt, 1) ?? "warning",
                Self.colString(stmt, 2) ?? "",
                Self.colString(stmt, 3) ?? "",
                Self.colString(stmt, 4) ?? ""
            ))
        })
        return rows
    }

    // MARK: - Low-Level Query Helper

    private func query(
        _ sql: String,
        bind: ((OpaquePointer) -> Void)? = nil,
        row: (OpaquePointer) -> Void
    ) throws {
        guard let handle else {
            throw StageError(code: "DB_CLOSED", message: "Database handle is closed")
        }
        var stmt: OpaquePointer?
        let rc = sqlite3_prepare_v2(handle, sql, -1, &stmt, nil)
        guard rc == SQLITE_OK, let stmt else {
            let msg = String(cString: sqlite3_errmsg(handle))
            throw StageError(code: "SQL_PREPARE_ERROR", message: "Failed to prepare query: \(msg)", sqlError: msg)
        }
        defer { sqlite3_finalize(stmt) }
        bind?(stmt)
        while true {
            let stepRc = sqlite3_step(stmt)
            if stepRc == SQLITE_ROW {
                row(stmt)
            } else if stepRc == SQLITE_DONE {
                break
            } else {
                let msg = String(cString: sqlite3_errmsg(handle))
                throw StageError(code: "SQL_STEP_ERROR", message: "Query step failed: \(msg)", sqlError: msg)
            }
        }
    }

    private static func colString(_ stmt: OpaquePointer, _ idx: Int32) -> String? {
        guard sqlite3_column_type(stmt, idx) != SQLITE_NULL,
              let cStr = sqlite3_column_text(stmt, idx) else {
            return nil
        }
        return String(cString: cStr)
    }

    private static func colOptionalDouble(_ stmt: OpaquePointer, _ idx: Int32) -> Double? {
        guard sqlite3_column_type(stmt, idx) != SQLITE_NULL else {
            return nil
        }
        return sqlite3_column_double(stmt, idx)
    }

    private static func colBlob(_ stmt: OpaquePointer, _ idx: Int32) -> Data {
        guard sqlite3_column_type(stmt, idx) != SQLITE_NULL,
              let ptr = sqlite3_column_blob(stmt, idx) else {
            return Data()
        }
        let count = Int(sqlite3_column_bytes(stmt, idx))
        return Data(bytes: ptr, count: count)
    }
}
