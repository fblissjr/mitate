import Foundation

public enum StageSchema {
    public static let tableOrder: [String] = [
        "beats",
        "v_beats",
        "style_bibles",
        "sizes",
        "slate",
        "media_bay",
        "gpu_kernels",
        "state_buffers",
        "surface_shaders",
        "actors",
        "props",
        "characters",
        "subjects",
        "lenses",
        "shots",
        "lamps",
        "atmospheres",
        "swarms",
        "warp_segments",
        "baked_tracks",
        "cue_sheet",
        "finishing_chain",
        "takes",
        "v_set_lint"
    ]

    public static let bootstrapSQL: String = """
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = DELETE;

    -- ============================================================================
    -- A1. BEATS (Named Spans — Durations Accumulate, Never Hardcoded Timestamps)
    -- ============================================================================
    CREATE TABLE IF NOT EXISTS beats (
        id           TEXT PRIMARY KEY CHECK (length(id) > 0),
        seq_order    INTEGER NOT NULL UNIQUE,
        dur_sec      REAL NOT NULL CHECK (dur_sec > 0.0),
        caption      TEXT DEFAULT NULL,
        act          TEXT DEFAULT NULL,
        flash_at     REAL DEFAULT NULL CHECK (flash_at IS NULL OR (flash_at >= 0.0 AND flash_at <= 1.0)),
        flash_width  REAL NOT NULL DEFAULT 0.25 CHECK (flash_width > 0.0),
        revision_seq INTEGER NOT NULL DEFAULT 1
    );

    CREATE VIEW IF NOT EXISTS v_beats AS
    SELECT
        id,
        seq_order,
        dur_sec,
        COALESCE(SUM(dur_sec) OVER (ORDER BY seq_order ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0.0) AS t0,
        SUM(dur_sec) OVER (ORDER BY seq_order ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS t1,
        caption,
        act,
        flash_at,
        flash_width
    FROM beats
    ORDER BY seq_order;

    -- ============================================================================
    -- A2. STYLE BIBLES (The Look as One Object — Switched via slate.active_bible)
    -- ============================================================================
    CREATE TABLE IF NOT EXISTS style_bibles (
        id              TEXT PRIMARY KEY CHECK (length(id) > 0),
        backdrop_mode   TEXT NOT NULL DEFAULT 'physical_sky'
                        CHECK (backdrop_mode IN ('physical_sky', 'solid_color', 'hdri_dome', 'alpha_transparent')),
        backdrop_color  TEXT NOT NULL DEFAULT '#141619',
        exposure_ev     REAL NOT NULL DEFAULT 0.0 CHECK (exposure_ev BETWEEN -20.0 AND 20.0),
        contrast        REAL NOT NULL DEFAULT 1.0 CHECK (contrast > 0.0),
        roughness_floor REAL NOT NULL DEFAULT 0.04 CHECK (roughness_floor BETWEEN 0.0 AND 1.0),
        color_transform TEXT NOT NULL DEFAULT 'agx'
                        CHECK (color_transform IN ('agx', 'agx_punchy', 'aces_cg', 'filmic', 'linear_raw')),
        lens_mm         REAL NOT NULL DEFAULT 50.0 CHECK (lens_mm BETWEEN 1.0 AND 5000.0),
        camera_energy   TEXT NOT NULL DEFAULT 'locked'
                        CHECK (camera_energy IN ('locked', 'steadicam', 'handheld')),
        sway_amp        REAL NOT NULL DEFAULT 1.0 CHECK (sway_amp >= 0.0),
        cut_whip_sec    REAL NOT NULL DEFAULT 0.16 CHECK (cut_whip_sec >= 0.0),
        cut_blend_sec   REAL NOT NULL DEFAULT 0.80 CHECK (cut_blend_sec >= 0.0),
        bloom_strength  REAL NOT NULL DEFAULT 0.0 CHECK (bloom_strength >= 0.0),
        bloom_threshold REAL NOT NULL DEFAULT 0.9 CHECK (bloom_threshold >= 0.0),
        dof_fstop       REAL DEFAULT NULL CHECK (dof_fstop IS NULL OR dof_fstop BETWEEN 0.5 AND 128.0),
        outline_width   REAL NOT NULL DEFAULT 0.0 CHECK (outline_width >= 0.0),
        palette_json    TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(palette_json)),
        revision_seq    INTEGER NOT NULL DEFAULT 1
    );

    INSERT OR IGNORE INTO style_bibles (id, backdrop_mode, backdrop_color, exposure_ev, color_transform, lens_mm, camera_energy)
    VALUES
        ('workshop', 'solid_color', '#141619', 0.0, 'agx', 50.0, 'locked'),
        ('neon',     'solid_color', '#090a10', 0.4, 'agx_punchy', 35.0, 'steadicam'),
        ('daylight', 'physical_sky', '#87ceeb', 0.0, 'agx', 50.0, 'locked'),
        ('paper',    'solid_color', '#f4f1ea', 0.2, 'filmic', 50.0, 'locked');

    -- ============================================================================
    -- A3. SIZES (Kit-Owned Cinematographic Framing Ladder)
    -- ============================================================================
    CREATE TABLE IF NOT EXISTS sizes (
        rung        TEXT PRIMARY KEY,
        frame_frac  REAL NOT NULL CHECK (frame_frac > 0.0),
        anchor_y    REAL NOT NULL CHECK (anchor_y BETWEEN 0.0 AND 1.0),
        fov_deg     REAL NOT NULL DEFAULT 42.0 CHECK (fov_deg BETWEEN 5.0 AND 140.0),
        description TEXT NOT NULL
    );

    INSERT OR IGNORE INTO sizes (rung, frame_frac, anchor_y, fov_deg, description) VALUES
        ('EWS', 0.20, 0.50, 68.0, 'Extreme Wide Shot — speck in the world'),
        ('WS',  0.50, 0.50, 58.0, 'Wide Shot — full body, generous air'),
        ('FSA', 0.70, 0.50, 50.0, 'Full Shot Air — full body with breathing room (workhorse)'),
        ('FS',  0.95, 0.50, 46.0, 'Full Shot — full body tight'),
        ('MS',  1.60, 0.68, 42.0, 'Medium Shot — waist up'),
        ('MCU', 2.40, 0.78, 38.0, 'Medium Close-Up — chest up'),
        ('CU',  3.60, 0.84, 32.0, 'Close-Up — head / primary detail'),
        ('ECU', 6.00, 0.88, 28.0, 'Extreme Close-Up — micro detail');

    -- ============================================================================
    -- B1. SLATE (Singleton Global Soundstage Configuration)
    -- ============================================================================
    CREATE TABLE IF NOT EXISTS slate (
        id               INTEGER PRIMARY KEY CHECK (id = 1),
        production_title TEXT NOT NULL DEFAULT 'Untitled Scene',
        width            INTEGER NOT NULL DEFAULT 1920 CHECK (width BETWEEN 64 AND 7680),
        height           INTEGER NOT NULL DEFAULT 1080 CHECK (height BETWEEN 64 AND 4320),
        fps              INTEGER NOT NULL DEFAULT 24 CHECK (fps IN (24, 25, 30, 48, 60, 120)),
        fallback_dur_sec REAL NOT NULL DEFAULT 4.0 CHECK (fallback_dur_sec > 0.0),
        title_card_text  TEXT DEFAULT NULL,
        subtitle_text    TEXT DEFAULT NULL,
        active_camera    TEXT DEFAULT NULL,
        active_bible     TEXT NOT NULL DEFAULT 'workshop' REFERENCES style_bibles(id) ON UPDATE CASCADE,
        exposure_ev      REAL NOT NULL DEFAULT 0.0 CHECK (exposure_ev BETWEEN -20.0 AND 20.0),
        contrast         REAL NOT NULL DEFAULT 1.0 CHECK (contrast > 0.0),
        spp_draft        INTEGER NOT NULL DEFAULT 4 CHECK (spp_draft >= 1),
        spp_final        INTEGER NOT NULL DEFAULT 32 CHECK (spp_final >= 1),
        random_seed      INTEGER NOT NULL DEFAULT 101,
        revision_seq     INTEGER NOT NULL DEFAULT 1
    );

    INSERT OR IGNORE INTO slate (id, production_title, width, height, fps, active_bible, random_seed)
    VALUES (1, 'Mitate v2 Soundstage', 1920, 1080, 24, 'workshop', 101);

    -- ============================================================================
    -- B2. MEDIA BAY, GPU KERNELS & STATE BUFFERS
    -- ============================================================================
    CREATE TABLE IF NOT EXISTS media_bay (
        id           TEXT PRIMARY KEY CHECK (length(id) > 0),
        mime_type    TEXT NOT NULL,
        encoding     TEXT NOT NULL DEFAULT 'raw',
        width        INTEGER NOT NULL DEFAULT 0 CHECK (width >= 0),
        height       INTEGER NOT NULL DEFAULT 0 CHECK (height >= 0),
        data_blob    BLOB NOT NULL,
        revision_seq INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS gpu_kernels (
        id               TEXT PRIMARY KEY CHECK (length(id) > 0),
        hook_slot        TEXT NOT NULL DEFAULT 'kinematics'
                         CHECK (hook_slot IN ('kinematics', 'ray_medium', 'procedural_surface', 'lens_ray', 'finishing_pass')),
        purity_mode      TEXT NOT NULL DEFAULT 'pure_t'
                         CHECK (purity_mode IN ('pure_t', 'baked_sim')),
        entry_symbol     TEXT NOT NULL CHECK (length(entry_symbol) > 0),
        threadgroup_size INTEGER NOT NULL DEFAULT 64 CHECK (threadgroup_size BETWEEN 1 AND 1024),
        msl_source       TEXT NOT NULL CHECK (length(msl_source) > 0),
        uniforms_json    TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(uniforms_json)),
        revision_seq     INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS state_buffers (
        id                   TEXT PRIMARY KEY CHECK (length(id) > 0),
        element_stride_bytes INTEGER NOT NULL CHECK (element_stride_bytes > 0),
        element_count        INTEGER NOT NULL CHECK (element_count > 0),
        initial_data_blob    BLOB NOT NULL,
        revision_seq         INTEGER NOT NULL DEFAULT 1
    );

    -- ============================================================================
    -- B3. SURFACE SHADERS (PBR, Toon/Cel, SSS, Glass, Unlit)
    -- ============================================================================
    CREATE TABLE IF NOT EXISTS surface_shaders (
        id                TEXT PRIMARY KEY CHECK (length(id) > 0),
        mode              TEXT NOT NULL DEFAULT 'pbr'
                          CHECK (mode IN ('pbr', 'toon', 'sss', 'glass', 'unlit')),
        albedo            TEXT NOT NULL DEFAULT '#b8bec6',
        metalness         REAL NOT NULL DEFAULT 0.0 CHECK (metalness BETWEEN 0.0 AND 1.0),
        roughness         REAL NOT NULL DEFAULT 0.35 CHECK (roughness BETWEEN 0.0 AND 1.0),
        ior               REAL NOT NULL DEFAULT 1.5 CHECK (ior BETWEEN 1.0 AND 4.0),
        clarity           REAL NOT NULL DEFAULT 0.0 CHECK (clarity BETWEEN 0.0 AND 1.0),
        abbe_dispersion   REAL NOT NULL DEFAULT 0.0 CHECK (abbe_dispersion >= 0.0),
        subsurface_weight REAL NOT NULL DEFAULT 0.0 CHECK (subsurface_weight BETWEEN 0.0 AND 1.0),
        subsurface_mfp    TEXT NOT NULL DEFAULT '#ff5f45',
        clearcoat         REAL NOT NULL DEFAULT 0.0 CHECK (clearcoat BETWEEN 0.0 AND 1.0),
        fuzz_weight       REAL NOT NULL DEFAULT 0.0 CHECK (fuzz_weight BETWEEN 0.0 AND 1.0),
        fuzz_tint         TEXT NOT NULL DEFAULT '#ffffff',
        glow_color        TEXT NOT NULL DEFAULT '#000000',
        glow_nits         REAL NOT NULL DEFAULT 0.0 CHECK (glow_nits >= 0.0),
        opacity           REAL NOT NULL DEFAULT 1.0 CHECK (opacity BETWEEN 0.0 AND 1.0),
        procedural_kernel TEXT DEFAULT NULL REFERENCES gpu_kernels(id) ON UPDATE CASCADE ON DELETE SET NULL,
        revision_seq      INTEGER NOT NULL DEFAULT 1
    );

    INSERT OR IGNORE INTO surface_shaders (id, mode, albedo, metalness, roughness, clarity, subsurface_weight) VALUES
        ('studio_matte',  'pbr',   '#9aa2ad', 0.05, 0.65, 0.0,  0.0),
        ('brushed_steel', 'pbr',   '#c4cad0', 0.90, 0.24, 0.0,  0.0),
        ('warm_brass',    'pbr',   '#d9a14a', 0.88, 0.22, 0.0,  0.0),
        ('cel_amber',     'toon',  '#d9752e', 0.00, 0.50, 0.0,  0.0),
        ('glass_clear',   'glass', '#d6f2ff', 0.00, 0.06, 0.95, 0.0),
        ('sss_skin',      'sss',   '#e8a2a0', 0.00, 0.55, 0.0,  0.45);

    -- ============================================================================
    -- B4. ACTORS & PROPS (Right-Handed Y-Up Stage Graph & Procedural Geometry)
    -- ============================================================================
    CREATE TABLE IF NOT EXISTS actors (
        id           TEXT PRIMARY KEY CHECK (length(id) > 0),
        parent_id    TEXT DEFAULT NULL REFERENCES actors(id) ON UPDATE CASCADE ON DELETE CASCADE,
        role         TEXT NOT NULL DEFAULT 'prop'
                     CHECK (role IN ('rig', 'prop', 'camera', 'lamp', 'atmosphere', 'swarm', 'null')),
        x            REAL NOT NULL DEFAULT 0.0,
        y            REAL NOT NULL DEFAULT 0.0,
        z            REAL NOT NULL DEFAULT 0.0,
        pitch_deg    REAL NOT NULL DEFAULT 0.0,
        yaw_deg      REAL NOT NULL DEFAULT 0.0,
        roll_deg     REAL NOT NULL DEFAULT 0.0,
        scale_x      REAL NOT NULL DEFAULT 1.0 CHECK (scale_x > 0.0),
        scale_y      REAL NOT NULL DEFAULT 1.0 CHECK (scale_y > 0.0),
        scale_z      REAL NOT NULL DEFAULT 1.0 CHECK (scale_z > 0.0),
        scale_gate   REAL NOT NULL DEFAULT 1.0 CHECK (scale_gate >= 0.0 AND scale_gate <= 2.0),
        aim_at       TEXT DEFAULT NULL REFERENCES actors(id) ON UPDATE CASCADE ON DELETE SET NULL,
        bank_deg     REAL NOT NULL DEFAULT 0.0,
        visible      INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
        kinematics_kernel TEXT DEFAULT NULL REFERENCES gpu_kernels(id) ON UPDATE CASCADE ON DELETE SET NULL,
        revision_seq INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS props (
        actor_id        TEXT PRIMARY KEY REFERENCES actors(id) ON UPDATE CASCADE ON DELETE CASCADE,
        shape           TEXT NOT NULL DEFAULT 'cube'
                        CHECK (shape IN ('sphere', 'cube', 'plane', 'cylinder', 'capsule', 'torus', 'cone', 'ring', 'gear', 'arrow3d', 'lathe', 'text3d', 'csg', 'mesh_file')),
        shader_id       TEXT NOT NULL DEFAULT 'studio_matte' REFERENCES surface_shaders(id) ON UPDATE CASCADE,
        radius_m        REAL NOT NULL DEFAULT 0.5 CHECK (radius_m > 0.0),
        inner_radius_m  REAL NOT NULL DEFAULT 0.2 CHECK (inner_radius_m >= 0.0),
        width_m         REAL NOT NULL DEFAULT 1.0 CHECK (width_m > 0.0),
        height_m        REAL NOT NULL DEFAULT 1.0 CHECK (height_m > 0.0),
        depth_m         REAL NOT NULL DEFAULT 1.0 CHECK (depth_m > 0.0),
        tooth_count     INTEGER NOT NULL DEFAULT 16 CHECK (tooth_count >= 3),
        bevel_radius_m  REAL NOT NULL DEFAULT 0.02 CHECK (bevel_radius_m >= 0.0),
        subdiv_level    INTEGER NOT NULL DEFAULT 1 CHECK (subdiv_level BETWEEN 0 AND 4),
        text_string     TEXT DEFAULT NULL,
        extrude_m       REAL NOT NULL DEFAULT 0.1 CHECK (extrude_m > 0.0),
        csg_tree        TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(csg_tree)),
        params_json     TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(params_json)),
        revision_seq    INTEGER NOT NULL DEFAULT 1
    );

    -- ============================================================================
    -- A4. CHARACTERS (Parametric Skeleton + Shells + Analytic IK & Distance Gait)
    -- ============================================================================
    CREATE TABLE IF NOT EXISTS characters (
        actor_id        TEXT PRIMARY KEY REFERENCES actors(id) ON UPDATE CASCADE ON DELETE CASCADE,
        preset          TEXT NOT NULL DEFAULT 'biped'
                        CHECK (preset IN ('biped', 'quadruped', 'strider', 'custom')),
        quadruped       INTEGER NOT NULL DEFAULT 0 CHECK (quadruped IN (0, 1)),
        hip_h           REAL NOT NULL DEFAULT 1.05 CHECK (hip_h > 0.0),
        torso_len       REAL NOT NULL DEFAULT 0.68 CHECK (torso_len > 0.0),
        torso_tilt_deg  REAL NOT NULL DEFAULT 4.0,
        pelvis_r        REAL NOT NULL DEFAULT 0.22 CHECK (pelvis_r > 0.0),
        chest_r         REAL NOT NULL DEFAULT 0.26 CHECK (chest_r > 0.0),
        shoulder_w      REAL NOT NULL DEFAULT 0.58 CHECK (shoulder_w > 0.0),
        hip_w           REAL NOT NULL DEFAULT 0.36 CHECK (hip_w > 0.0),
        neck_len        REAL NOT NULL DEFAULT 0.20 CHECK (neck_len >= 0.0),
        neck_segs       INTEGER NOT NULL DEFAULT 2 CHECK (neck_segs BETWEEN 1 AND 12),
        head_r          REAL NOT NULL DEFAULT 0.22 CHECK (head_r > 0.0),
        muzzle_len      REAL NOT NULL DEFAULT 0.0 CHECK (muzzle_len >= 0.0),
        tail_len        REAL NOT NULL DEFAULT 0.0 CHECK (tail_len >= 0.0),
        tail_segs       INTEGER NOT NULL DEFAULT 4 CHECK (tail_segs BETWEEN 0 AND 16),
        fore_upper      REAL NOT NULL DEFAULT 0.42 CHECK (fore_upper > 0.0),
        fore_lower      REAL NOT NULL DEFAULT 0.40 CHECK (fore_lower > 0.0),
        fore_r          REAL NOT NULL DEFAULT 0.08 CHECK (fore_r > 0.0),
        hind_upper      REAL NOT NULL DEFAULT 0.54 CHECK (hind_upper > 0.0),
        hind_lower      REAL NOT NULL DEFAULT 0.52 CHECK (hind_lower > 0.0),
        hind_r          REAL NOT NULL DEFAULT 0.10 CHECK (hind_r > 0.0),
        foot_len        REAL NOT NULL DEFAULT 0.22 CHECK (foot_len >= 0.0),
        foot_h          REAL NOT NULL DEFAULT 0.08 CHECK (foot_h >= 0.0),
        fur_shells      INTEGER NOT NULL DEFAULT 0 CHECK (fur_shells BETWEEN 0 AND 16),
        fur_length_m    REAL NOT NULL DEFAULT 0.04 CHECK (fur_length_m >= 0.0),
        walk_start_x    REAL NOT NULL DEFAULT 0.0,
        stride_m        REAL NOT NULL DEFAULT 0.85 CHECK (stride_m > 0.0),
        step_lift_m     REAL NOT NULL DEFAULT 0.14 CHECK (step_lift_m >= 0.0),
        shader_map_json TEXT NOT NULL DEFAULT '{"default":"studio_matte"}' CHECK (json_valid(shader_map_json)),
        revision_seq    INTEGER NOT NULL DEFAULT 1,
        CHECK (hind_upper + hind_lower > hip_h)
    );

    -- ============================================================================
    -- A5. SUBJECTS (Named Framing Targets — Auto-Derived Bounds by Default)
    -- ============================================================================
    CREATE TABLE IF NOT EXISTS subjects (
        id                 TEXT PRIMARY KEY CHECK (length(id) > 0),
        actor_id           TEXT REFERENCES actors(id) ON UPDATE CASCADE ON DELETE CASCADE,
        member_actors_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(member_actors_json)),
        extent_mode        TEXT NOT NULL DEFAULT 'auto_bounds'
                           CHECK (extent_mode IN ('auto_bounds', 'declared_named')),
        height_m           REAL NOT NULL DEFAULT 2.0 CHECK (height_m > 0.0),
        width_m            REAL NOT NULL DEFAULT 2.0 CHECK (width_m > 0.0),
        depth_m            REAL NOT NULL DEFAULT 0.0 CHECK (depth_m >= 0.0),
        headroom_m         REAL NOT NULL DEFAULT 0.15 CHECK (headroom_m >= 0.0),
        aim_y_frac         REAL NOT NULL DEFAULT 0.50 CHECK (aim_y_frac BETWEEN 0.0 AND 1.0),
        extent_note        TEXT DEFAULT NULL,
        revision_seq       INTEGER NOT NULL DEFAULT 1
    );

    -- ============================================================================
    -- B5. LENSES & A6. SHOTS (Physical Optics & Declarative Cinematography)
    -- ============================================================================
    CREATE TABLE IF NOT EXISTS lenses (
        actor_id           TEXT PRIMARY KEY REFERENCES actors(id) ON UPDATE CASCADE ON DELETE CASCADE,
        focal_length_mm    REAL NOT NULL DEFAULT 50.0 CHECK (focal_length_mm BETWEEN 1.0 AND 5000.0),
        sensor_width_mm    REAL NOT NULL DEFAULT 36.0 CHECK (sensor_width_mm > 0.0),
        f_stop             REAL NOT NULL DEFAULT 4.0 CHECK (f_stop BETWEEN 0.5 AND 128.0),
        focus_distance_m   REAL NOT NULL DEFAULT 5.0 CHECK (focus_distance_m > 0.0),
        focus_actor_id     TEXT DEFAULT NULL REFERENCES actors(id) ON UPDATE CASCADE ON DELETE SET NULL,
        shutter_angle_deg  REAL NOT NULL DEFAULT 180.0 CHECK (shutter_angle_deg BETWEEN 0.0 AND 360.0),
        bokeh_blades       INTEGER NOT NULL DEFAULT 7 CHECK (bokeh_blades BETWEEN 0 AND 18),
        anamorphic_squeeze REAL NOT NULL DEFAULT 1.0 CHECK (anamorphic_squeeze >= 1.0),
        lens_kernel        TEXT DEFAULT NULL REFERENCES gpu_kernels(id) ON UPDATE CASCADE ON DELETE SET NULL,
        revision_seq       INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS shots (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        seq_order        INTEGER NOT NULL UNIQUE,
        beat_id          TEXT NOT NULL REFERENCES beats(id) ON UPDATE CASCADE ON DELETE CASCADE,
        beat_frac        REAL NOT NULL DEFAULT 0.0 CHECK (beat_frac >= 0.0 AND beat_frac <= 1.0),
        subject_id       TEXT NOT NULL REFERENCES subjects(id) ON UPDATE CASCADE ON DELETE CASCADE,
        size_rung        TEXT NOT NULL DEFAULT 'FSA' REFERENCES sizes(rung),
        angle_deg        REAL NOT NULL DEFAULT 30.0,
        elev_deg         REAL NOT NULL DEFAULT 8.0,
        fov_mm           REAL DEFAULT NULL CHECK (fov_mm IS NULL OR fov_mm BETWEEN 1.0 AND 5000.0),
        size2_rung       TEXT DEFAULT NULL REFERENCES sizes(rung),
        angle2_deg       REAL DEFAULT NULL,
        focus_subject_id TEXT DEFAULT NULL REFERENCES subjects(id) ON UPDATE CASCADE ON DELETE SET NULL,
        camera_energy    TEXT DEFAULT NULL CHECK (camera_energy IS NULL OR camera_energy IN ('locked', 'steadicam', 'handheld')),
        anchor_y         REAL DEFAULT NULL CHECK (anchor_y IS NULL OR (anchor_y >= 0.0 AND anchor_y <= 1.0)),
        anchor_x         REAL NOT NULL DEFAULT 0.0 CHECK (anchor_x BETWEEN -1.0 AND 1.0),
        cut_kind         TEXT NOT NULL DEFAULT 'hard' CHECK (cut_kind IN ('hard', 'whip', 'blend')),
        match_prev       INTEGER NOT NULL DEFAULT 0 CHECK (match_prev IN (0, 1)),
        cut_reason       TEXT DEFAULT NULL,
        revision_seq     INTEGER NOT NULL DEFAULT 1
    );

    -- ============================================================================
    -- B6. LAMPS, ATMOSPHERES & SWARMS
    -- ============================================================================
    CREATE TABLE IF NOT EXISTS lamps (
        actor_id        TEXT PRIMARY KEY REFERENCES actors(id) ON UPDATE CASCADE ON DELETE CASCADE,
        type            TEXT NOT NULL DEFAULT 'area_rect'
                        CHECK (type IN ('area_rect', 'panel', 'disk', 'bulb', 'point', 'spot', 'sun', 'sun_directional', 'dome')),
        kelvin          REAL NOT NULL DEFAULT 5600.0 CHECK (kelvin BETWEEN 1000.0 AND 20000.0),
        lumens          REAL NOT NULL DEFAULT 1500.0 CHECK (lumens >= 0.0),
        tint_hex        TEXT NOT NULL DEFAULT '#ffffff',
        spread_angle    REAL NOT NULL DEFAULT 60.0 CHECK (spread_angle BETWEEN 1.0 AND 180.0),
        softness        REAL NOT NULL DEFAULT 0.5 CHECK (softness BETWEEN 0.0 AND 1.0),
        width_m         REAL NOT NULL DEFAULT 1.0 CHECK (width_m > 0.0),
        height_m        REAL NOT NULL DEFAULT 1.0 CHECK (height_m > 0.0),
        volumetric_dust REAL NOT NULL DEFAULT 0.15 CHECK (volumetric_dust BETWEEN 0.0 AND 1.0),
        cast_shadows    INTEGER NOT NULL DEFAULT 1 CHECK (cast_shadows IN (0, 1)),
        revision_seq    INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS atmospheres (
        id            TEXT PRIMARY KEY CHECK (length(id) > 0),
        actor_id      TEXT DEFAULT NULL REFERENCES actors(id) ON UPDATE CASCADE ON DELETE CASCADE,
        mode          TEXT NOT NULL DEFAULT 'global_mist' CHECK (mode IN ('global_mist', 'haze_box')),
        fog_density   REAL NOT NULL DEFAULT 0.015 CHECK (fog_density >= 0.0),
        anisotropy    REAL NOT NULL DEFAULT 0.35 CHECK (anisotropy BETWEEN -0.99 AND 0.99),
        base_height_m REAL NOT NULL DEFAULT 0.0,
        falloff       REAL NOT NULL DEFAULT 0.25 CHECK (falloff >= 0.0),
        scatter_hex   TEXT NOT NULL DEFAULT '#c8d6e5',
        revision_seq  INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS swarms (
        actor_id           TEXT PRIMARY KEY REFERENCES actors(id) ON UPDATE CASCADE ON DELETE CASCADE,
        instance_count     INTEGER NOT NULL DEFAULT 64 CHECK (instance_count BETWEEN 1 AND 1000000),
        prop_source_id     TEXT NOT NULL REFERENCES actors(id) ON UPDATE CASCADE ON DELETE CASCADE,
        spawn_volume_json  TEXT NOT NULL DEFAULT '{"shape":"box","size":[4,4,4]}' CHECK (json_valid(spawn_volume_json)),
        state_buffer_id    TEXT DEFAULT NULL REFERENCES state_buffers(id) ON UPDATE CASCADE ON DELETE SET NULL,
        behavior_kernel_id TEXT DEFAULT NULL REFERENCES gpu_kernels(id) ON UPDATE CASCADE ON DELETE SET NULL,
        revision_seq       INTEGER NOT NULL DEFAULT 1
    );

    -- ============================================================================
    -- A7. WARP SEGMENTS, BAKED TRACKS & B7. CUE SHEET
    -- ============================================================================
    CREATE TABLE IF NOT EXISTS warp_segments (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        beat_id      TEXT NOT NULL REFERENCES beats(id) ON UPDATE CASCADE ON DELETE CASCADE,
        beat_frac    REAL NOT NULL DEFAULT 0.0 CHECK (beat_frac BETWEEN 0.0 AND 1.0),
        dur_sec      REAL NOT NULL CHECK (dur_sec > 0.0),
        rate         REAL NOT NULL CHECK (rate >= 0.0),
        revision_seq INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS baked_tracks (
        id            TEXT PRIMARY KEY CHECK (length(id) > 0),
        target_domain TEXT NOT NULL CHECK (target_domain IN ('actors', 'state_buffers')),
        target_id     TEXT NOT NULL,
        sample_hz     REAL NOT NULL DEFAULT 60.0 CHECK (sample_hz > 0.0),
        frame_count   INTEGER NOT NULL CHECK (frame_count > 0),
        seed          INTEGER NOT NULL DEFAULT 101,
        inputs_sha256 TEXT NOT NULL,
        samples_blob  BLOB NOT NULL,
        revision_seq  INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS cue_sheet (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_id        TEXT NOT NULL REFERENCES actors(id) ON UPDATE CASCADE ON DELETE CASCADE,
        channel         TEXT NOT NULL CHECK (channel IN (
            'x', 'y', 'z', 'tx', 'ty', 'tz',
            'pitch_deg', 'yaw_deg', 'roll_deg', 'rx', 'ry', 'rz',
            'scale_x', 'scale_y', 'scale_z', 'sx', 'sy', 'sz',
            'scale_gate', 'gait_vamp', 'lumens', 'focus_distance_m', 'exposure_ev'
        )),
        beat_id         TEXT DEFAULT NULL REFERENCES beats(id) ON UPDATE CASCADE ON DELETE CASCADE,
        beat_frac       REAL NOT NULL DEFAULT 0.0 CHECK (beat_frac BETWEEN 0.0 AND 1.0),
        end_beat_id     TEXT DEFAULT NULL REFERENCES beats(id) ON UPDATE CASCADE ON DELETE CASCADE,
        end_beat_frac   REAL DEFAULT NULL CHECK (end_beat_frac IS NULL OR (end_beat_frac BETWEEN 0.0 AND 1.0)),
        offset_sec      REAL DEFAULT NULL,
        dur_sec         REAL DEFAULT NULL CHECK (dur_sec IS NULL OR dur_sec > 0.0),
        start_val       REAL NOT NULL DEFAULT 0.0,
        end_val         REAL NOT NULL DEFAULT 0.0,
        curve           TEXT NOT NULL DEFAULT 'ease_in_out'
                        CHECK (curve IN ('linear', 'ease_in', 'ease_out', 'ease_in_out', 'smoothstep', 'hold_step', 'spring', 'ease_out_back', 'bump')),
        procedural_expr TEXT DEFAULT NULL,
        revision_seq    INTEGER NOT NULL DEFAULT 1
    );

    -- ============================================================================
    -- B8. FINISHING CHAIN & TAKES
    -- ============================================================================
    CREATE TABLE IF NOT EXISTS finishing_chain (
        id                   INTEGER PRIMARY KEY CHECK (id = 1),
        tone_mapper          TEXT NOT NULL DEFAULT 'agx'
                             CHECK (tone_mapper IN ('agx', 'agx_punchy', 'aces_cg', 'filmic', 'linear_raw')),
        exposure_ev          REAL NOT NULL DEFAULT 0.0 CHECK (exposure_ev BETWEEN -20.0 AND 20.0),
        contrast             REAL NOT NULL DEFAULT 1.0 CHECK (contrast > 0.0),
        saturation           REAL NOT NULL DEFAULT 1.0 CHECK (saturation >= 0.0),
        bloom_intensity      REAL NOT NULL DEFAULT 0.05 CHECK (bloom_intensity >= 0.0),
        bloom_threshold      REAL NOT NULL DEFAULT 0.9 CHECK (bloom_threshold >= 0.0),
        halation_weight      REAL NOT NULL DEFAULT 0.0 CHECK (halation_weight BETWEEN 0.0 AND 1.0),
        chromatic_aberration REAL NOT NULL DEFAULT 0.0 CHECK (chromatic_aberration >= 0.0),
        film_grain_intensity REAL NOT NULL DEFAULT 0.02 CHECK (film_grain_intensity >= 0.0),
        vignette_weight      REAL NOT NULL DEFAULT 0.15 CHECK (vignette_weight BETWEEN 0.0 AND 1.0),
        custom_kernel        TEXT DEFAULT NULL REFERENCES gpu_kernels(id) ON UPDATE CASCADE ON DELETE SET NULL,
        revision_seq         INTEGER NOT NULL DEFAULT 1
    );

    INSERT OR IGNORE INTO finishing_chain (id, tone_mapper, exposure_ev, contrast, saturation)
    VALUES (1, 'agx', 0.0, 1.0, 1.0);

    CREATE TABLE IF NOT EXISTS takes (
        take_number    INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp      TEXT NOT NULL DEFAULT (datetime('now')),
        mode           TEXT NOT NULL DEFAULT 'dailies',
        render_time_ms REAL NOT NULL DEFAULT 0.0,
        peak_vram_mb   REAL NOT NULL DEFAULT 0.0,
        mean_luminance REAL NOT NULL DEFAULT 0.0,
        clipping_pct   REAL NOT NULL DEFAULT 0.0,
        output_path    TEXT DEFAULT NULL,
        agent_notes    TEXT DEFAULT NULL
    );

    -- ============================================================================
    -- B9. SET LINT VIEW (Fast SQL Pre-Flight Diagnostics)
    -- ============================================================================
    CREATE VIEW IF NOT EXISTS v_set_lint AS
    SELECT
        'CPS_OVER_30' AS code,
        'error' AS severity,
        'beats.' || id AS target,
        'Caption reading speed (' || ROUND(CAST(length(caption) AS REAL) / dur_sec, 1) || ' chars/sec) exceeds 30 CPS limit.' AS message,
        'Shorten caption text or increase beats.dur_sec so length(caption)/dur_sec <= 30.' AS fix_hint
    FROM beats
    WHERE caption IS NOT NULL AND length(caption) > 0 AND (CAST(length(caption) AS REAL) / dur_sec) > 30.0
    UNION ALL
    SELECT
        'BARE_DECLARED_EXTENT' AS code,
        'warning' AS severity,
        'subjects.' || id AS target,
        'Subject uses extent_mode=declared_named without an extent_note explaining the provenance.' AS message,
        'Prefer extent_mode=''auto_bounds'', or provide a non-empty extent_note documenting where height_m/width_m came from.' AS fix_hint
    FROM subjects
    WHERE extent_mode = 'declared_named' AND (extent_note IS NULL OR length(trim(extent_note)) = 0)
    UNION ALL
    SELECT
        'UNBAKED_SIM_KERNEL' AS code,
        'error' AS severity,
        'gpu_kernels.' || k.id AS target,
        'Kernel ' || k.id || ' has purity_mode=baked_sim but no corresponding row exists in baked_tracks.' AS message,
        'Run `mitate bake <shot.db>` before rendering or checking scenes with baked_sim kernels.' AS fix_hint
    FROM gpu_kernels k
    WHERE k.purity_mode = 'baked_sim'
      AND NOT EXISTS (SELECT 1 FROM baked_tracks b WHERE b.id = k.id OR b.target_id = k.id);
    """

    public static func presetSQL(named preset: String) -> String? {
        switch preset {
        case "three-point-studio", "default":
            return """
            INSERT INTO beats (id, seq_order, dur_sec, caption, act) VALUES
                ('establish', 1, 2.5, 'Three-point studio soundstage ready.', 'setup'),
                ('payoff',    2, 2.5, 'Hero prop framed by declarative shot solver.', 'resolution');

            INSERT INTO actors (id, role, x, y, z, pitch_deg, yaw_deg, roll_deg) VALUES
                ('floor',     'prop',   0.0,  0.0,  0.0,   0.0,   0.0, 0.0),
                ('hero_prop', 'prop',   0.0,  1.0,  0.0,   0.0,   0.0, 0.0),
                ('cam_main',  'camera', 0.0,  1.8,  5.0,  -8.0,   0.0, 0.0),
                ('lamp_key',  'lamp',   4.0,  5.0,  4.0, -38.0,  42.0, 0.0),
                ('lamp_fill', 'lamp',  -4.5,  3.0,  4.0, -20.0, -45.0, 0.0),
                ('lamp_rim',  'lamp',  -2.5,  4.5, -4.0, -35.0, 155.0, 0.0);

            INSERT INTO props (actor_id, shape, shader_id, width_m, height_m, depth_m, radius_m) VALUES
                ('floor',     'plane',  'studio_matte',  20.0, 0.1, 20.0, 10.0),
                ('hero_prop', 'sphere', 'brushed_steel',  1.6, 1.6,  1.6,  0.8);

            INSERT INTO lenses (actor_id, focal_length_mm, f_stop, focus_distance_m, focus_actor_id) VALUES
                ('cam_main', 50.0, 2.8, 5.0, 'hero_prop');

            INSERT INTO lamps (actor_id, type, kelvin, lumens, spread_angle, softness, volumetric_dust) VALUES
                ('lamp_key',  'area_rect', 3400.0, 2400.0, 65.0, 0.55, 0.15),
                ('lamp_fill', 'area_rect', 5600.0,  480.0, 90.0, 0.85, 0.05),
                ('lamp_rim',  'spot',      7200.0, 1560.0, 40.0, 0.35, 0.30);

            INSERT INTO subjects (id, actor_id, extent_mode, headroom_m) VALUES
                ('subj_hero', 'hero_prop', 'auto_bounds', 0.15);

            INSERT INTO shots (seq_order, beat_id, beat_frac, subject_id, size_rung, angle_deg, elev_deg, cut_kind) VALUES
                (1, 'establish', 0.0, 'subj_hero', 'FSA',  30.0,  8.0, 'hard'),
                (2, 'payoff',    0.0, 'subj_hero', 'MCU', -25.0, 12.0, 'hard');

            UPDATE slate SET active_camera = 'cam_main', active_bible = 'workshop' WHERE id = 1;
            """

        case "explainer-stage":
            return """
            INSERT INTO beats (id, seq_order, dur_sec, caption, act) VALUES
                ('intro',  1, 2.5, '1 · Drive gear rotates at constant angular velocity.', 'setup'),
                ('engage', 2, 3.0, '2 · Driven gear meshes in counter-rotation.', 'turn');

            INSERT INTO actors (id, role, x, y, z, pitch_deg, yaw_deg, roll_deg) VALUES
                ('drive_gear',  'prop',  -1.15, 1.2, 0.0,  0.0,   0.0, 0.0),
                ('driven_gear', 'prop',   1.15, 1.2, 0.0,  0.0,  11.25, 0.0),
                ('cam_main',    'camera', 0.0,  1.6, 5.5, -6.0,   0.0, 0.0),
                ('lamp_key',    'lamp',   4.0,  5.0, 4.0, -38.0, 42.0, 0.0),
                ('lamp_fill',   'lamp',  -4.5,  3.0, 4.0, -20.0,-45.0, 0.0),
                ('lamp_rim',    'lamp',   0.0,  4.5,-4.0, -35.0,180.0, 0.0);

            INSERT INTO props (actor_id, shape, shader_id, radius_m, inner_radius_m, tooth_count, depth_m) VALUES
                ('drive_gear',  'gear', 'warm_brass',    1.15, 0.35, 16, 0.35),
                ('driven_gear', 'gear', 'brushed_steel', 1.15, 0.35, 16, 0.35);

            INSERT INTO lamps (actor_id, type, kelvin, lumens, spread_angle, softness) VALUES
                ('lamp_key',  'area_rect', 3400.0, 2600.0, 65.0, 0.55),
                ('lamp_fill', 'area_rect', 5600.0,  520.0, 90.0, 0.85),
                ('lamp_rim',  'spot',      7200.0, 1600.0, 45.0, 0.35);

            INSERT INTO subjects (id, actor_id, member_actors_json, extent_mode, headroom_m) VALUES
                ('gear_pair', 'drive_gear', '["drive_gear","driven_gear"]', 'auto_bounds', 0.20);

            INSERT INTO shots (seq_order, beat_id, beat_frac, subject_id, size_rung, angle_deg, elev_deg, cut_kind) VALUES
                (1, 'intro',  0.0, 'gear_pair', 'FSA',  20.0, 10.0, 'hard'),
                (2, 'engage', 0.0, 'gear_pair', 'MS',  -25.0, 14.0, 'hard');

            INSERT INTO cue_sheet (actor_id, channel, beat_id, beat_frac, end_beat_id, end_beat_frac, start_val, end_val, curve) VALUES
                ('drive_gear',  'roll_deg', 'intro', 0.0, 'engage', 1.0, 0.0,  360.0, 'linear'),
                ('driven_gear', 'roll_deg', 'intro', 0.0, 'engage', 1.0, 0.0, -360.0, 'linear');

            UPDATE slate SET active_camera = 'cam_main', active_bible = 'workshop' WHERE id = 1;
            """

        case "character-stage":
            return """
            INSERT INTO beats (id, seq_order, dur_sec, caption, act) VALUES
                ('approach', 1, 3.0, 'The walker crosses the stage on planted steps.', 'setup'),
                ('halt',     2, 2.0, 'Feet settle into rest stance as the camera pushes in.', 'resolution');

            INSERT INTO actors (id, role, x, y, z) VALUES
                ('floor',    'prop',   0.0, 0.0, 0.0),
                ('walker',   'rig',   -1.8, 0.0, 0.0),
                ('cam_main', 'camera', 0.0, 1.5, 5.0),
                ('lamp_key', 'lamp',   4.0, 5.2, 4.0),
                ('lamp_rim', 'lamp',  -3.0, 4.5,-4.0);

            INSERT INTO props (actor_id, shape, shader_id, width_m, height_m, depth_m) VALUES
                ('floor', 'plane', 'studio_matte', 24.0, 0.1, 24.0);

            INSERT INTO characters (actor_id, preset, quadruped, walk_start_x, stride_m, step_lift_m) VALUES
                ('walker', 'biped', 0, -1.8, 0.85, 0.14);

            INSERT INTO lamps (actor_id, type, kelvin, lumens) VALUES
                ('lamp_key', 'area_rect', 3400.0, 2400.0),
                ('lamp_rim', 'spot',      7200.0, 1500.0);

            INSERT INTO subjects (id, actor_id, extent_mode, headroom_m) VALUES
                ('subj_walker', 'walker', 'auto_bounds', 0.15);

            INSERT INTO shots (seq_order, beat_id, beat_frac, subject_id, size_rung, angle_deg, elev_deg, cut_kind) VALUES
                (1, 'approach', 0.0, 'subj_walker', 'FSA', 35.0, 8.0, 'hard'),
                (2, 'halt',     0.0, 'subj_walker', 'MS', -25.0, 6.0, 'hard');

            INSERT INTO cue_sheet (actor_id, channel, beat_id, beat_frac, end_beat_id, end_beat_frac, start_val, end_val, curve) VALUES
                ('walker', 'x',         'approach', 0.0, 'approach', 0.95, -1.8, 1.6, 'smoothstep'),
                ('walker', 'gait_vamp', 'approach', 0.0, 'approach', 0.95,  0.0, 1.0, 'bump');

            UPDATE slate SET active_camera = 'cam_main', active_bible = 'workshop' WHERE id = 1;
            """

        case "sunlit-exterior":
            return """
            UPDATE slate SET active_bible = 'daylight' WHERE id = 1;
            INSERT INTO beats (id, seq_order, dur_sec, caption, act) VALUES
                ('dawn', 1, 3.0, 'Direct sunlight sweeps across the courtyard.', 'setup');
            INSERT INTO actors (id, role, x, y, z, pitch_deg, yaw_deg) VALUES
                ('ground',   'prop',   0.0, 0.0, 0.0,   0.0,  0.0),
                ('monolith', 'prop',   0.0, 1.5, 0.0,   0.0, 15.0),
                ('sun_lamp', 'lamp',  10.0,18.0, 8.0, -48.0, 35.0);
            INSERT INTO props (actor_id, shape, shader_id, width_m, height_m, depth_m) VALUES
                ('ground',   'plane', 'studio_matte', 40.0, 0.1, 40.0),
                ('monolith', 'cube',  'brushed_steel', 1.2, 3.0,  0.6);
            INSERT INTO lamps (actor_id, type, kelvin, lumens, softness) VALUES
                ('sun_lamp', 'sun_directional', 5600.0, 8000.0, 0.15);
            INSERT INTO subjects (id, actor_id, extent_mode) VALUES ('subj_mono', 'monolith', 'auto_bounds');
            INSERT INTO shots (seq_order, beat_id, beat_frac, subject_id, size_rung, angle_deg, elev_deg) VALUES
                (1, 'dawn', 0.0, 'subj_mono', 'FSA', 30.0, 10.0);
            """

        default:
            return nil
        }
    }

    public static let recipes: [String: (summary: String, sql: String)] = [
        "low-key-rig": (
            summary: "4-lamp photometric low-key lighting setup (Key 3400K 1.0x, Fill 5600K 0.2x, Rim 7200K 0.65x, Accent 2700K 0.15x)",
            sql: """
            INSERT OR REPLACE INTO actors (id, role, x, y, z, pitch_deg, yaw_deg, roll_deg) VALUES
              ('lamp_key',  'lamp',  4.5, 5.2,  4.0, -38.0,  42.0, 0.0),
              ('lamp_fill', 'lamp', -5.0, 3.0,  4.5, -20.0, -45.0, 0.0),
              ('lamp_rim',  'lamp', -2.5, 4.5, -4.5, -35.0, 155.0, 0.0),
              ('lamp_acc',  'lamp',  0.8, 1.4,  1.2, -15.0,   0.0, 0.0);

            INSERT OR REPLACE INTO lamps (actor_id, type, kelvin, lumens, spread_angle, softness, volumetric_dust) VALUES
              ('lamp_key',  'area_rect', 3400.0, 2400.0, 65.0, 0.55, 0.15),
              ('lamp_fill', 'area_rect', 5600.0,  480.0, 90.0, 0.85, 0.05),
              ('lamp_rim',  'spot',      7200.0, 1560.0, 40.0, 0.35, 0.30),
              ('lamp_acc',  'point',     2700.0,  360.0,180.0, 0.70, 0.10);
            """
        ),
        "three-point-lights": (
            summary: "Classic 3-point studio lighting (warm key, neutral soft fill, cool separation rim)",
            sql: """
            INSERT OR REPLACE INTO actors (id, role, x, y, z, pitch_deg, yaw_deg, roll_deg) VALUES
              ('lamp_key',  'lamp',  4.0, 5.0,  4.0, -38.0,  42.0, 0.0),
              ('lamp_fill', 'lamp', -4.5, 3.0,  4.0, -20.0, -45.0, 0.0),
              ('lamp_rim',  'lamp', -2.5, 4.5, -4.0, -35.0, 155.0, 0.0);

            INSERT OR REPLACE INTO lamps (actor_id, type, kelvin, lumens, spread_angle, softness, volumetric_dust) VALUES
              ('lamp_key',  'area_rect', 3400.0, 2400.0, 65.0, 0.55, 0.15),
              ('lamp_fill', 'area_rect', 5600.0,  480.0, 90.0, 0.85, 0.05),
              ('lamp_rim',  'spot',      7200.0, 1560.0, 40.0, 0.35, 0.30);
            """
        ),
        "character-walk": (
            summary: "Distance-driven character walk with synchronized translation and gait_vamp envelope (prevents limb skating)",
            sql: """
            -- Both x-translation and gait_vamp MUST share the exact same beat_id / end_beat_id span:
            INSERT INTO cue_sheet (actor_id, channel, beat_id, beat_frac, end_beat_id, end_beat_frac, start_val, end_val, curve) VALUES
              ('walker', 'x',         'approach', 0.0, 'approach', 0.95, -2.0, 2.0, 'smoothstep'),
              ('walker', 'gait_vamp', 'approach', 0.0, 'approach', 0.95,  0.0, 1.0, 'bump');
            """
        ),
        "rack-focus": (
            summary: "Declarative shallow-DoF rack focus shifting focus_subject_id across shots",
            sql: """
            UPDATE style_bibles SET dof_fstop = 2.0 WHERE id = 'workshop';
            UPDATE shots SET focus_subject_id = 'subj_foreground' WHERE seq_order = 1;
            UPDATE shots SET focus_subject_id = 'subj_background', match_prev = 1, cut_kind = 'blend' WHERE seq_order = 2;
            """
        ),
        "explainer-gears": (
            summary: "Meshed spur gears with exact counter-rotating angular cues and union subject framing",
            sql: """
            INSERT OR REPLACE INTO actors (id, role, x, y, z, roll_deg) VALUES
              ('gear_a', 'prop', -1.15, 1.2, 0.0,  0.0),
              ('gear_b', 'prop',  1.15, 1.2, 0.0, 11.25);

            INSERT OR REPLACE INTO props (actor_id, shape, shader_id, radius_m, inner_radius_m, tooth_count, depth_m) VALUES
              ('gear_a', 'gear', 'warm_brass',    1.15, 0.35, 16, 0.35),
              ('gear_b', 'gear', 'brushed_steel', 1.15, 0.35, 16, 0.35);

            INSERT OR REPLACE INTO subjects (id, actor_id, member_actors_json, extent_mode, headroom_m) VALUES
              ('subj_gears', 'gear_a', '["gear_a","gear_b"]', 'auto_bounds', 0.20);
            """
        ),
        "cel-outline": (
            summary: "Three-band cel/toon shader immune to ambient washout with inverted-hull outline",
            sql: """
            UPDATE style_bibles SET outline_width = 0.035 WHERE id = 'workshop';
            INSERT OR REPLACE INTO surface_shaders (id, mode, albedo, roughness) VALUES
              ('cel_hero', 'toon', '#d9752e', 0.55);
            """
        ),
        "sss-skin": (
            summary: "Thin vs. thick subsurface scattering pair (prevents uniform whole-mesh lightbomb)",
            sql: """
            INSERT OR REPLACE INTO surface_shaders (id, mode, albedo, roughness, subsurface_weight, subsurface_mfp) VALUES
              ('skin_thick', 'sss', '#e8a2a0', 0.55, 0.25, '#ff5f45'),
              ('skin_thin',  'sss', '#f2b5b3', 0.45, 0.85, '#ff5f45');
            """
        )
    ]
}
