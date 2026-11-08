import Foundation
import Testing
@testable import MitateCore

@Suite("Phase v2.1 — SQLite Soundstage, Addressing, Solver, Bake & Check Brackets")
struct SchemaAndCheckBrackets {

    @Test("All built-in stage presets initialize cleanly and pass StageCheck with zero errors")
    func presetsInitializeCleanly() throws {
        for preset in ["three-point-studio", "explainer-stage", "character-stage", "sunlit-exterior"] {
            let db = try StageDB(path: ":memory:")
            try db.initializeStage(preset: preset)
            let report = try StageCheck.validate(db: db)
            #expect(report.ok, "Preset \(preset) failed check: \(report.findings)")
            #expect(report.errorCount == 0)
        }
    }

    @Test("SQLite CHECK and FOREIGN KEY constraints reject invalid soundstage mutations (Red) and accept valid ones (Green)")
    func sqliteConstraintBrackets() throws {
        let db = try StageDB(path: ":memory:")
        try db.initializeStage(preset: "three-point-studio")

        // Red Arm 1: negative beat duration
        #expect(throws: StageError.self) {
            try db.executeTransaction("INSERT INTO beats (id, seq_order, dur_sec) VALUES ('bad_beat', 99, -1.5);")
        }

        // Red Arm 2: foreign key violation (prop referencing non-existent actor)
        #expect(throws: StageError.self) {
            try db.executeTransaction("INSERT INTO props (actor_id, shape, shader_id) VALUES ('ghost_actor', 'sphere', 'studio_matte');")
        }

        // Red Arm 3: character anatomical CHECK constraint (hind_upper + hind_lower <= hip_h)
        try db.executeTransaction("INSERT INTO actors (id, role) VALUES ('bad_rig', 'rig');")
        #expect(throws: StageError.self) {
            try db.executeTransaction("""
            INSERT INTO characters (actor_id, hip_h, hind_upper, hind_lower)
            VALUES ('bad_rig', 1.50, 0.50, 0.50);
            """)
        }

        // Green Arm: valid character proportion vector succeeds
        try db.executeTransaction("""
        INSERT INTO characters (actor_id, hip_h, hind_upper, hind_lower)
        VALUES ('bad_rig', 1.00, 0.55, 0.55);
        """)
    }

    @Test("StageCheck brackets: CPS > 30, match_prev violation, skating limbs, inert expression, and unbaked/stale sim kernels")
    func stageCheckRedAndGreenBrackets() throws {
        let db = try StageDB(path: ":memory:")
        try db.initializeStage(preset: "three-point-studio")

        // 1. CPS_OVER_30 Bracket (Red -> Green)
        try db.executeTransaction("""
        UPDATE beats SET dur_sec = 1.0, caption = 'This caption is way too long to be read comfortably in one single second.' WHERE id = 'establish';
        """)
        var report = try StageCheck.validate(db: db)
        #expect(!report.ok)
        #expect(report.findings.contains(where: { $0.code == "CPS_OVER_30" }))

        try db.executeTransaction("""
        UPDATE beats SET dur_sec = 3.0, caption = 'Short, clear caption.' WHERE id = 'establish';
        """)
        report = try StageCheck.validate(db: db)
        #expect(!report.findings.contains(where: { $0.code == "CPS_OVER_30" }))

        // 2. MATCH_PREV_VIOLATION Bracket (Red -> Green)
        try db.executeTransaction("""
        UPDATE shots SET match_prev = 1, angle_deg = -45.0 WHERE seq_order = 2;
        """)
        report = try StageCheck.validate(db: db)
        #expect(!report.ok)
        #expect(report.findings.contains(where: { $0.code == "MATCH_PREV_VIOLATION" }))

        try db.executeTransaction("""
        UPDATE shots SET match_prev = 1, size_rung = 'FSA', angle_deg = 30.0 WHERE seq_order = 2;
        """)
        report = try StageCheck.validate(db: db)
        #expect(!report.findings.contains(where: { $0.code == "MATCH_PREV_VIOLATION" }))

        // 3. CHARACTER_SKATING_LIMBS Bracket (Red -> Green)
        try db.executeTransaction("""
        INSERT INTO actors (id, role, x, y, z) VALUES ('runner', 'rig', -2.0, 0.0, 0.0);
        INSERT INTO characters (actor_id, preset, walk_start_x) VALUES ('runner', 'biped', -2.0);
        INSERT INTO cue_sheet (actor_id, channel, beat_id, beat_frac, end_beat_id, end_beat_frac, start_val, end_val, curve)
        VALUES ('runner', 'x', 'establish', 0.0, 'payoff', 1.0, -2.0, 2.0, 'smoothstep');
        """)
        report = try StageCheck.validate(db: db)
        #expect(!report.ok)
        #expect(report.findings.contains(where: { $0.code == "CHARACTER_SKATING_LIMBS" }))

        try db.executeTransaction("""
        INSERT INTO cue_sheet (actor_id, channel, beat_id, beat_frac, end_beat_id, end_beat_frac, start_val, end_val, curve)
        VALUES ('runner', 'gait_vamp', 'establish', 0.0, 'payoff', 1.0, 0.0, 1.0, 'bump');
        """)
        report = try StageCheck.validate(db: db)
        #expect(!report.findings.contains(where: { $0.code == "CHARACTER_SKATING_LIMBS" }))

        // 4. INERT_PROCEDURAL_EXPRESSION Bracket (Red -> Green)
        try db.executeTransaction("""
        INSERT INTO cue_sheet (actor_id, channel, beat_id, beat_frac, end_beat_id, end_beat_frac, procedural_expr)
        VALUES ('hero_prop', 'y', 'establish', 0.0, 'payoff', 1.0, 'sin(quant(t, 2) * 2 * pi)');
        """)
        report = try StageCheck.validate(db: db)
        #expect(!report.ok)
        #expect(report.findings.contains(where: { $0.code == "INERT_PROCEDURAL_EXPRESSION" }))

        try db.executeTransaction("""
        UPDATE cue_sheet SET procedural_expr = '1.0 + 0.25 * sin(t * 2 * pi)' WHERE actor_id = 'hero_prop' AND channel = 'y';
        """)
        report = try StageCheck.validate(db: db)
        #expect(!report.findings.contains(where: { $0.code == "INERT_PROCEDURAL_EXPRESSION" }))

        // 5. UNBAKED_SIM_KERNEL & STALE_BAKED_TRACK Bracket (Red -> Green -> Red on Stale)
        try db.executeTransaction("""
        INSERT INTO gpu_kernels (id, hook_slot, purity_mode, entry_symbol, msl_source)
        VALUES ('hive_swing', 'kinematics', 'baked_sim', 'hive_sim', '// msl pendulum');
        UPDATE actors SET kinematics_kernel = 'hive_swing' WHERE id = 'hero_prop';
        """)
        report = try StageCheck.validate(db: db)
        #expect(!report.ok)
        #expect(report.findings.contains(where: { $0.code == "UNBAKED_SIM_KERNEL" }))

        let tracks = try BakeEngine.bakeAll(db: db, seedOverride: 101, sampleHz: 60.0)
        #expect(tracks.count == 1)
        report = try StageCheck.validate(db: db)
        #expect(report.ok, "Expected clean check after bake, got: \(report.findings)")

        // Mutate actor initial x -> invalidates inputs_sha256 -> STALE_BAKED_TRACK
        try db.executeTransaction("UPDATE actors SET x = 3.5 WHERE id = 'hero_prop';")
        report = try StageCheck.validate(db: db)
        #expect(!report.ok)
        #expect(report.findings.contains(where: { $0.code == "STALE_BAKED_TRACK" }))
    }

    @Test("StageEvaluator is a pure O(1) function of t: forward, reverse, and shuffled seeks are bit-for-bit identical")
    func randomAccessSeekOrderIndependence() throws {
        let db = try StageDB(path: ":memory:")
        try db.initializeStage(preset: "character-stage")
        try db.executeTransaction("""
        INSERT INTO gpu_kernels (id, hook_slot, purity_mode, entry_symbol, msl_source)
        VALUES ('orb_sim', 'kinematics', 'baked_sim', 'orb_step', '// sim');
        INSERT INTO actors (id, role, x, y, z, kinematics_kernel)
        VALUES ('orb', 'prop', 0.5, 1.5, -0.5, 'orb_sim');
        INSERT INTO props (actor_id, shape, shader_id, radius_m)
        VALUES ('orb', 'sphere', 'warm_brass', 0.35);
        """)
        _ = try BakeEngine.bakeAll(db: db, seedOverride: 77, sampleHz: 60.0)

        let cache = try StageStateCache(db: db)
        let sampleTimes: [Double] = stride(from: 0.0, through: 5.0, by: 0.125).map { $0 }

        var forwardMap: [Double: StageSnapshot] = [:]
        for t in sampleTimes {
            forwardMap[t] = StageEvaluator.evaluate(cache: cache, at: t)
        }

        var reverseMap: [Double: StageSnapshot] = [:]
        for t in sampleTimes.reversed() {
            reverseMap[t] = StageEvaluator.evaluate(cache: cache, at: t)
        }

        let shuffledTimes: [Double] = [
            3.75, 0.125, 4.875, 1.25, 2.5, 0.0, 5.0, 0.625, 4.125, 1.875,
            2.125, 3.0, 0.375, 4.5, 1.5, 2.875, 3.375, 0.875, 4.25, 1.0
        ]
        for t in shuffledTimes {
            let snapShuffled = StageEvaluator.evaluate(cache: cache, at: t)
            #expect(snapShuffled == forwardMap[t])
            #expect(snapShuffled == reverseMap[t])
        }
    }

    @Test("Time warping (warp/unwarp) is invertible and StageProbe distinguishes false 2D overlap from real 3D contact")
    func timeWarpAndContactProbeAccuracy() throws {
        let db = try StageDB(path: ":memory:")
        try db.initializeStage(preset: "three-point-studio")

        // Add a slow-motion warp segment during 'establish'
        try db.executeTransaction("""
        INSERT INTO warp_segments (beat_id, beat_frac, dur_sec, rate)
        VALUES ('establish', 0.2, 1.2, 0.25);
        """)
        let beats = try db.loadBeats()
        let segs = try db.loadWarpSegments()

        for presentationT in [0.0, 0.3, 0.8, 1.4, 2.2, 3.8, 4.9] {
            let domainT = BeatAddressing.warp(t: presentationT, beats: beats, segments: segs)
            let recoveredT = BeatAddressing.unwarp(tWarped: domainT, beats: beats, segments: segs, maxDuration: 5.0)
            #expect(abs(recoveredT - presentationT) < 1e-5)
        }

        // Place two spheres so they line up in camera 2D projection but sit 2.0m apart in depth (false_2d_contact)
        try db.executeTransaction("""
        UPDATE shots SET angle_deg = 0.0, elev_deg = 0.0 WHERE seq_order = 1;
        INSERT INTO actors (id, role, x, y, z) VALUES
            ('orb_near', 'prop', 0.0, 1.0,  0.8),
            ('orb_far',  'prop', 0.0, 1.0, -1.2);
        INSERT INTO props (actor_id, shape, shader_id, radius_m) VALUES
            ('orb_near', 'sphere', 'warm_brass',    0.35),
            ('orb_far',  'sphere', 'brushed_steel', 0.35);
        """)

        let falseContactProbe = try StageCheck.probe(db: db, atSpec: "establish@0.5", sepPair: ("orb_near", "orb_far"))
        let c1 = try #require(falseContactProbe.contact)
        #expect(c1.overlapsInCamera2D == true)
        #expect(c1.euclideanGapM > 1.2)
        #expect(c1.contactState == "false_2d_contact")

        // Move orb_far to touch orb_near in 3D space (centers 0.70m apart, radii 0.35m + 0.35m = 0.70m -> gap = 0.0m)
        try db.executeTransaction("UPDATE actors SET z = 0.10 WHERE id = 'orb_far';")
        let trueContactProbe = try StageCheck.probe(db: db, atSpec: "establish@0.5", sepPair: ("orb_near", "orb_far"))
        let c2 = try #require(trueContactProbe.contact)
        #expect(abs(c2.euclideanGapM) <= 0.01)
        #expect(c2.contactState == "touching")
    }
}
