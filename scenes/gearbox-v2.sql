-- ============================================================================
-- Calibration Scene 1: Gearbox v2 — Compound Torque Reduction (Technical Explainer)
-- ============================================================================

DELETE FROM shots;
DELETE FROM subjects;
DELETE FROM cue_sheet;
DELETE FROM lamps;
DELETE FROM lenses;
DELETE FROM props;
DELETE FROM actors;
DELETE FROM beats;

INSERT OR REPLACE INTO surface_shaders (id, mode, albedo, metalness, roughness, glow_color, glow_nits) VALUES
    ('signal_cyan', 'pbr', '#2de2e6', 0.15, 0.25, '#2de2e6', 1.5);

INSERT INTO beats (id, seq_order, dur_sec, caption, act) VALUES
    ('engage',    1, 3.0, '1 · High-speed brass pinion engages the steel idler.', 'setup'),
    ('transfer',  2, 3.0, '2 · Idler reverses torque into the heavy output wheel.', 'turn'),
    ('overdrive', 3, 3.0, '3 · 2:1 reduction doubles output torque at half RPM.', 'resolution');

INSERT INTO actors (id, role, x, y, z, pitch_deg, yaw_deg, roll_deg, scale_gate) VALUES
    ('floor',        'prop',   0.00, 0.00,  0.00,   0.0,   0.0,  0.0, 1.0),
    ('drive_gear',   'prop',  -1.80, 1.65,  0.00,   0.0,   0.0,  0.0, 1.0),
    ('idler_gear',   'prop',   0.00, 1.65,  0.00,   0.0,   0.0, 12.0, 1.0),
    ('driven_gear',  'prop',   2.60, 1.65,  0.00,   0.0,   0.0,  7.5, 1.0),
    ('load_ring',    'prop',   2.60, 1.65,  0.10,   0.0,   0.0,  0.0, 0.0),
    ('torque_arrow', 'prop',  -0.90, 3.15,  0.00,   0.0,   0.0,  0.0, 1.0),
    ('ratio_badge',  'prop',   2.60, 3.55,  0.00,   0.0,   0.0,  0.0, 1.0),
    ('cam_main',     'camera', 0.00, 1.80,  6.50,  -6.0,   0.0,  0.0, 1.0),
    ('lamp_key',     'lamp',   4.50, 5.20,  4.20, -38.0,  42.0,  0.0, 1.0),
    ('lamp_fill',    'lamp',  -4.80, 3.20,  4.50, -20.0, -45.0,  0.0, 1.0),
    ('lamp_rim',     'lamp',   0.50, 4.80, -4.50, -35.0, 175.0,  0.0, 1.0);

UPDATE slate SET
    production_title = 'Gearbox v2 — Compound Torque Reduction',
    width = 1920,
    height = 1080,
    fps = 24,
    active_camera = 'cam_main',
    active_bible = 'workshop',
    random_seed = 101
WHERE id = 1;

INSERT INTO props (actor_id, shape, shader_id, radius_m, inner_radius_m, width_m, height_m, depth_m, tooth_count, text_string) VALUES
    ('floor',        'plane',   'studio_matte',  12.00, 0.00, 24.00, 0.10, 24.00, 12, NULL),
    ('drive_gear',   'gear',    'warm_brass',     0.80, 0.25,  1.60, 1.60,  0.35, 12, NULL),
    ('idler_gear',   'gear',    'brushed_steel',  1.00, 0.30,  2.00, 2.00,  0.35, 15, NULL),
    ('driven_gear',  'gear',    'warm_brass',     1.60, 0.48,  3.20, 3.20,  0.35, 24, NULL),
    ('load_ring',    'ring',    'signal_cyan',    0.92, 0.65,  1.84, 1.84,  0.15, 12, NULL),
    ('torque_arrow', 'arrow3d', 'signal_cyan',    0.45, 0.15,  0.90, 0.32,  0.18, 12, NULL),
    ('ratio_badge',  'text3d',  'studio_matte',   0.60, 0.15,  1.25, 0.36,  0.14, 12, '2:1 TORQUE');

INSERT INTO lenses (actor_id, focal_length_mm, f_stop, focus_distance_m, focus_actor_id) VALUES
    ('cam_main', 50.0, 4.0, 6.0, 'idler_gear');

INSERT INTO lamps (actor_id, type, kelvin, lumens, spread_angle, softness, volumetric_dust) VALUES
    ('lamp_key',  'area_rect', 3400.0, 2800.0, 65.0, 0.55, 0.15),
    ('lamp_fill', 'area_rect', 5600.0,  620.0, 90.0, 0.85, 0.05),
    ('lamp_rim',  'spot',      7200.0, 1800.0, 45.0, 0.35, 0.25);

INSERT INTO subjects (id, actor_id, member_actors_json, extent_mode, headroom_m, aim_y_frac) VALUES
    ('gear_train', 'idler_gear', '["drive_gear","idler_gear","driven_gear","load_ring","torque_arrow","ratio_badge"]', 'auto_bounds', 0.25, 0.50);

INSERT INTO shots (seq_order, beat_id, beat_frac, subject_id, size_rung, angle_deg, size2_rung, angle2_deg, elev_deg, cut_kind, match_prev) VALUES
    (1, 'engage',    0.0, 'gear_train', 'WS',   14.0, 'FSA', -12.0,  8.0, 'hard',  0),
    (2, 'transfer',  0.0, 'gear_train', 'FSA', -12.0, 'FSA',  16.0, 10.0, 'blend', 1),
    (3, 'overdrive', 0.0, 'gear_train', 'FSA',  16.0,  NULL,  NULL,  8.0, 'blend', 1);

INSERT INTO cue_sheet (actor_id, channel, beat_id, beat_frac, end_beat_id, end_beat_frac, start_val, end_val, curve) VALUES
    ('drive_gear',   'roll_deg',   'engage',    0.0, 'overdrive', 1.0,  0.0,  720.0, 'linear'),
    ('idler_gear',   'roll_deg',   'engage',    0.0, 'overdrive', 1.0, 12.0, -564.0, 'linear'),
    ('driven_gear',  'roll_deg',   'engage',    0.0, 'overdrive', 1.0,  7.5,  367.5, 'linear'),
    ('torque_arrow', 'x',          'engage',    0.0, 'overdrive', 1.0, -1.00,  1.20, 'smoothstep'),
    ('load_ring',    'scale_gate', 'overdrive', 0.0, 'overdrive', 0.35, 0.0,    1.0, 'ease_out_back');
