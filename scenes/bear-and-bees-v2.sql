-- ============================================================================
-- Calibration Scene 2: Bear & Bees v2 — The Honey Heist (Character Short + Tier-1 Bake)
-- ============================================================================

DELETE FROM shots;
DELETE FROM subjects;
DELETE FROM cue_sheet;
DELETE FROM baked_tracks;
DELETE FROM gpu_kernels;
DELETE FROM characters;
DELETE FROM lamps;
DELETE FROM lenses;
DELETE FROM props;
DELETE FROM actors;
DELETE FROM beats;

UPDATE style_bibles SET dof_fstop = 2.8 WHERE id = 'daylight';

INSERT OR REPLACE INTO surface_shaders (id, mode, albedo, metalness, roughness, subsurface_weight, subsurface_mfp) VALUES
    ('bear_fur',     'pbr', '#6e472b', 0.02, 0.78, 0.15, '#8c5834'),
    ('honey_gold',   'sss', '#e5a93c', 0.05, 0.32, 0.65, '#ffae33'),
    ('oak_bark',     'pbr', '#4a3525', 0.00, 0.85, 0.00, '#4a3525'),
    ('meadow_grass', 'pbr', '#3b5230', 0.00, 0.88, 0.00, '#3b5230');

INSERT INTO beats (id, seq_order, dur_sec, caption, act) VALUES
    ('prowl',    1, 3.0, 'A hungry bear pads toward the old oak tree.', 'setup'),
    ('discover', 2, 2.8, 'Golden hive sways overhead as bees stir.',    'turn'),
    ('retreat',  3, 2.8, 'The swarm buzzes out; the bear backs away.',  'resolution');

INSERT INTO gpu_kernels (id, hook_slot, purity_mode, entry_symbol, msl_source) VALUES
    ('hive_pendulum_sim', 'kinematics', 'baked_sim', 'hive_pendulum_sim',
     '[[visible]] void hive_pendulum_sim(float t, device ActorState& state) { state.position.x += sin(t * 2.8) * 0.22; }');

INSERT INTO actors (id, role, x, y, z, pitch_deg, yaw_deg, roll_deg, scale_gate, kinematics_kernel) VALUES
    ('meadow',      'prop',   0.00, 0.00,  0.00,   0.0,   0.0, 0.0, 1.0, NULL),
    ('oak_tree',    'prop',   1.95, 1.50, -0.35,   0.0,   0.0, 0.0, 1.0, NULL),
    ('oak_bough',   'prop',   1.48, 2.52, -0.15,   0.0,   0.0, 0.0, 1.0, NULL),
    ('hive',        'prop',   1.15, 2.05,  0.00,   0.0,   0.0, 0.0, 1.0, 'hive_pendulum_sim'),
    ('bee_scout_1', 'prop',   1.05, 1.95,  0.10,   0.0,   0.0, 0.0, 0.0, NULL),
    ('bee_scout_2', 'prop',   1.15, 2.10, -0.10,   0.0,   0.0, 0.0, 0.0, NULL),
    ('bee_scout_3', 'prop',   0.95, 1.85,  0.00,   0.0,   0.0, 0.0, 0.0, NULL),
    ('bear',        'rig',   -1.60, 0.00,  0.00,   0.0,   0.0, 0.0, 1.0, NULL),
    ('cam_main',    'camera', 0.00, 1.50,  5.80,  -5.0,   0.0, 0.0, 1.0, NULL),
    ('sun_key',     'lamp',   6.00, 9.00,  5.00, -45.0,  35.0, 0.0, 1.0, NULL),
    ('sky_fill',    'lamp',  -5.00, 6.00,  5.00, -30.0, -40.0, 0.0, 1.0, NULL),
    ('warm_rim',    'lamp',  -2.00, 4.50, -4.50, -35.0, 160.0, 0.0, 1.0, NULL);

UPDATE slate SET
    production_title = 'Bear & Bees v2 — The Honey Heist',
    width = 1920,
    height = 1080,
    fps = 24,
    active_camera = 'cam_main',
    active_bible = 'daylight',
    random_seed = 101
WHERE id = 1;

INSERT INTO props (actor_id, shape, shader_id, radius_m, width_m, height_m, depth_m) VALUES
    ('meadow',      'plane',    'meadow_grass', 15.00, 30.00, 0.10, 30.00),
    ('oak_tree',    'cylinder', 'oak_bark',      0.45,  0.90, 3.00,  0.90),
    ('oak_bough',   'cube',     'oak_bark',      0.65,  1.30, 0.22,  0.45),
    ('hive',        'sphere',   'honey_gold',    0.38,  0.76, 0.90,  0.76),
    ('bee_scout_1', 'sphere',   'honey_gold',    0.11,  0.22, 0.22,  0.22),
    ('bee_scout_2', 'sphere',   'honey_gold',    0.10,  0.20, 0.20,  0.20),
    ('bee_scout_3', 'sphere',   'honey_gold',    0.12,  0.24, 0.24,  0.24);

INSERT INTO characters (
    actor_id, preset, quadruped,
    hip_h, torso_len, torso_tilt_deg, pelvis_r, chest_r, shoulder_w, hip_w,
    head_r, neck_len, muzzle_len, tail_len,
    fore_upper, fore_lower, hind_upper, hind_lower,
    fur_shells, fur_length_m,
    stride_m, step_lift_m, walk_start_x, shader_map_json
) VALUES (
    'bear', 'quadruped', 1,
    0.72, 0.85, 82.0, 0.28, 0.30, 0.68, 0.60,
    0.24, 0.14, 0.22, 0.14,
    0.48, 0.46, 0.46, 0.42,
    12, 0.045,
    0.80, 0.14, -1.60, '{"default":"bear_fur"}'
);

INSERT INTO lenses (actor_id, focal_length_mm, f_stop, focus_distance_m, focus_actor_id) VALUES
    ('cam_main', 50.0, 2.8, 5.5, 'bear');

INSERT INTO lamps (actor_id, type, kelvin, lumens, spread_angle, softness, volumetric_dust) VALUES
    ('sun_key',  'sun_directional', 5600.0, 4200.0, 60.0, 0.25, 0.15),
    ('sky_fill', 'dome',            6500.0,  950.0, 90.0, 0.90, 0.05),
    ('warm_rim', 'spot',            3400.0, 1500.0, 45.0, 0.40, 0.20);

INSERT INTO subjects (id, actor_id, member_actors_json, extent_mode, headroom_m, aim_y_frac) VALUES
    ('subj_bear',      'bear', '["bear"]',                                                             'auto_bounds', 0.20, 0.50),
    ('subj_hive',      'hive', '["hive","oak_bough"]',                                                 'auto_bounds', 0.15, 0.50),
    ('subj_encounter', 'bear', '["bear","hive","oak_bough","oak_tree","bee_scout_1","bee_scout_2"]',   'auto_bounds', 0.25, 0.50);

INSERT INTO shots (seq_order, beat_id, beat_frac, subject_id, size_rung, angle_deg, size2_rung, angle2_deg, elev_deg, focus_subject_id, cut_kind, match_prev) VALUES
    (1, 'prowl',    0.0, 'subj_encounter', 'WS',   14.0, 'FSA', -16.0,  8.0, 'subj_bear', 'hard',  0),
    (2, 'discover', 0.0, 'subj_encounter', 'FSA', -16.0, 'WS',   12.0, 10.0, 'subj_hive', 'blend', 1),
    (3, 'retreat',  0.0, 'subj_encounter', 'WS',   12.0,  NULL,  NULL,  8.0, 'subj_bear', 'blend', 1);

INSERT INTO cue_sheet (actor_id, channel, beat_id, beat_frac, end_beat_id, end_beat_frac, start_val, end_val, curve) VALUES
    ('bear',        'x',          'prowl',    0.00, 'prowl',    0.92, -1.60, -0.35, 'smoothstep'),
    ('bear',        'gait_vamp',  'prowl',    0.00, 'prowl',    0.92,  0.00,  1.00, 'bump'),
    ('bee_scout_1', 'scale_gate', 'discover', 0.20, 'discover', 0.45,  0.00,  1.00, 'ease_out_back'),
    ('bee_scout_2', 'scale_gate', 'discover', 0.25, 'discover', 0.50,  0.00,  1.00, 'ease_out_back'),
    ('bee_scout_3', 'scale_gate', 'discover', 0.30, 'discover', 0.55,  0.00,  1.00, 'ease_out_back'),
    ('bee_scout_1', 'x',          'discover', 0.35, 'retreat',  0.85,  1.05, -0.55, 'smoothstep'),
    ('bee_scout_2', 'x',          'discover', 0.40, 'retreat',  0.85,  1.15, -0.35, 'smoothstep'),
    ('bee_scout_3', 'x',          'discover', 0.45, 'retreat',  0.85,  0.95, -0.75, 'smoothstep'),
    ('bee_scout_1', 'y',          'discover', 0.35, 'retreat',  0.85,  1.95,  1.25, 'smoothstep'),
    ('bee_scout_2', 'y',          'discover', 0.40, 'retreat',  0.85,  2.10,  1.40, 'smoothstep'),
    ('bee_scout_3', 'y',          'discover', 0.45, 'retreat',  0.85,  1.85,  1.15, 'smoothstep'),
    ('bear',        'x',          'retreat',  0.00, 'retreat',  0.92, -0.35, -1.40, 'smoothstep'),
    ('bear',        'gait_vamp',  'retreat',  0.00, 'retreat',  0.92,  0.00,  1.00, 'bump');
