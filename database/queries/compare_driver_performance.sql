-- ============================================
-- Compare Driver Performance Query
-- ============================================
-- This complex query compares two drivers' performances at a specific circuit
-- for specific races (identified by race_id).
--
-- Features:
-- - 7 table JOINs (race, race_data, driver, constructor, circuit, country, race_driver_standing)
-- - Window functions (RANK) to calculate actual finish positions
-- - Nested subqueries for historical statistics
-- - GROUP BY with aggregate functions (COUNT, AVG, SUM, MIN)
-- - LEFT JOINs for championship standings
-- - CTEs (Common Table Expressions) for readability
--
-- Parameters (21 total, in order of appearance):
-- 1: race_1_id, 2: driver_1_id
-- 3: race_2_id, 4: driver_2_id
-- 5: driver_1_id, 6: circuit_id
-- 7: driver_2_id, 8: circuit_id
-- 9-14: driver_1_id (x3), race_1_id (x3) for season stats
-- 15-20: driver_2_id (x3), race_2_id (x3) for season stats
-- 21: circuit_id
-- ============================================

WITH 
-- ===========================================
-- CTE 1: All drivers' positions in race 1
-- Uses RANK() window function to get actual finish position
-- ===========================================
race_1_all_positions AS (
    SELECT 
        rd.driver_id,
        rd.race_id,
        rd.constructor_id,
        rd.race_points,
        rd.race_pole_position,
        rd.race_qualification_position_number AS quali_position,
        rd.race_grid_position_number AS grid_position,
        r.year AS race_year,
        r.official_name AS race_name,
        c.name AS constructor_name,
        -- Use RANK to get actual position within this race
        RANK() OVER (ORDER BY rd.position_display_order ASC) AS finish_position
    FROM race_data rd
    INNER JOIN race r ON rd.race_id = r.id
    INNER JOIN constructor c ON rd.constructor_id = c.id
    WHERE rd.race_id = %s
),

-- ===========================================
-- CTE 2: Driver 1's performance filtered from race 1
-- ===========================================
driver_1_race_performance AS (
    SELECT * FROM race_1_all_positions
    WHERE driver_id = %s
),

-- ===========================================
-- CTE 3: All drivers' positions in race 2
-- ===========================================
race_2_all_positions AS (
    SELECT 
        rd.driver_id,
        rd.race_id,
        rd.constructor_id,
        rd.race_points,
        rd.race_pole_position,
        rd.race_qualification_position_number AS quali_position,
        rd.race_grid_position_number AS grid_position,
        r.year AS race_year,
        r.official_name AS race_name,
        c.name AS constructor_name,
        RANK() OVER (ORDER BY rd.position_display_order ASC) AS finish_position
    FROM race_data rd
    INNER JOIN race r ON rd.race_id = r.id
    INNER JOIN constructor c ON rd.constructor_id = c.id
    WHERE rd.race_id = %s
),

-- ===========================================
-- CTE 4: Driver 2's performance filtered from race 2
-- ===========================================
driver_2_race_performance AS (
    SELECT * FROM race_2_all_positions
    WHERE driver_id = %s
),

-- ===========================================
-- CTE 5: Driver 1's historical stats at this circuit
-- Uses GROUP BY with multiple aggregate functions
-- Joins: race_data -> race (2 tables)
-- ===========================================
driver_1_circuit_history AS (
    SELECT 
        rd.driver_id,
        COUNT(DISTINCT rd.race_id) AS total_races_at_circuit,
        -- For historical stats, position 1 means winner based on position_display_order
        COUNT(CASE WHEN rd.position_display_order = 1 THEN 1 END) AS wins_at_circuit,
        COUNT(CASE WHEN rd.position_display_order <= 3 THEN 1 END) AS podiums_at_circuit,
        COUNT(CASE WHEN rd.race_pole_position = TRUE THEN 1 END) AS poles_at_circuit,
        ROUND(AVG(rd.position_display_order)::numeric, 1) AS avg_finish_position,
        MIN(rd.position_display_order) AS best_finish,
        SUM(COALESCE(rd.race_points, 0)) AS total_points_at_circuit,
        ROUND(AVG(COALESCE(rd.race_points, 0))::numeric, 1) AS avg_points_per_race
    FROM race_data rd
    INNER JOIN race r ON rd.race_id = r.id
    WHERE rd.driver_id = %s 
      AND r.circuit_id = %s
    GROUP BY rd.driver_id
),

-- ===========================================
-- CTE 6: Driver 2's historical stats at this circuit
-- ===========================================
driver_2_circuit_history AS (
    SELECT 
        rd.driver_id,
        COUNT(DISTINCT rd.race_id) AS total_races_at_circuit,
        COUNT(CASE WHEN rd.position_display_order = 1 THEN 1 END) AS wins_at_circuit,
        COUNT(CASE WHEN rd.position_display_order <= 3 THEN 1 END) AS podiums_at_circuit,
        COUNT(CASE WHEN rd.race_pole_position = TRUE THEN 1 END) AS poles_at_circuit,
        ROUND(AVG(rd.position_display_order)::numeric, 1) AS avg_finish_position,
        MIN(rd.position_display_order) AS best_finish,
        SUM(COALESCE(rd.race_points, 0)) AS total_points_at_circuit,
        ROUND(AVG(COALESCE(rd.race_points, 0))::numeric, 1) AS avg_points_per_race
    FROM race_data rd
    INNER JOIN race r ON rd.race_id = r.id
    WHERE rd.driver_id = %s 
      AND r.circuit_id = %s
    GROUP BY rd.driver_id
),

-- ===========================================
-- CTE 7: Driver 1's season stats
-- Complex nested subqueries for wins/podiums count
-- Joins: race_driver_standing -> race (for championship position)
-- ===========================================
driver_1_season_stats AS (
    SELECT 
        rds.driver_id,
        rds.position_number AS championship_position,
        rds.points AS season_points,
        -- Nested subquery: count wins in the season
        (
            SELECT COUNT(*) 
            FROM race_data rd2 
            INNER JOIN race r2 ON rd2.race_id = r2.id
            WHERE rd2.driver_id = %s
              AND rd2.position_display_order = 1
              AND r2.year = (SELECT year FROM race WHERE id = %s)
        ) AS season_wins,
        -- Nested subquery: count podiums in the season
        (
            SELECT COUNT(*) 
            FROM race_data rd3 
            INNER JOIN race r3 ON rd3.race_id = r3.id
            WHERE rd3.driver_id = %s
              AND rd3.position_display_order <= 3
              AND r3.year = (SELECT year FROM race WHERE id = %s)
        ) AS season_podiums
    FROM race_driver_standing rds
    WHERE rds.driver_id = %s
      AND rds.race_id = %s
),

-- ===========================================
-- CTE 8: Driver 2's season stats
-- ===========================================
driver_2_season_stats AS (
    SELECT 
        rds.driver_id,
        rds.position_number AS championship_position,
        rds.points AS season_points,
        (
            SELECT COUNT(*) 
            FROM race_data rd2 
            INNER JOIN race r2 ON rd2.race_id = r2.id
            WHERE rd2.driver_id = %s
              AND rd2.position_display_order = 1
              AND r2.year = (SELECT year FROM race WHERE id = %s)
        ) AS season_wins,
        (
            SELECT COUNT(*) 
            FROM race_data rd3 
            INNER JOIN race r3 ON rd3.race_id = r3.id
            WHERE rd3.driver_id = %s
              AND rd3.position_display_order <= 3
              AND r3.year = (SELECT year FROM race WHERE id = %s)
        ) AS season_podiums
    FROM race_driver_standing rds
    WHERE rds.driver_id = %s
      AND rds.race_id = %s
),

-- ===========================================
-- CTE 9: Circuit information
-- Joins: circuit -> country (2 tables)
-- ===========================================
circuit_info AS (
    SELECT 
        ci.id AS circuit_id,
        ci.full_name AS circuit_name,
        ci.place_name AS circuit_location,
        ci.length AS circuit_length_km,
        ci.turns AS circuit_turns,
        ci.type AS circuit_type,
        ci.direction AS circuit_direction,
        co.name AS circuit_country,
        ci.total_races_held
    FROM circuit ci
    INNER JOIN country co ON ci.country_id = co.id
    WHERE ci.id = %s
)

-- ===========================================
-- MAIN QUERY: Combine all CTEs
-- Uses CROSS JOIN to combine single-row CTEs
-- Uses LEFT JOINs for optional data (history, season stats)
-- Total tables involved: race_data, race, driver, constructor, 
--                        circuit, country, race_driver_standing (7 tables)
-- ===========================================
SELECT 
    -- Circuit Information
    cinfo.circuit_name,
    cinfo.circuit_location,
    cinfo.circuit_country,
    cinfo.circuit_length_km,
    cinfo.circuit_turns,
    cinfo.circuit_type,
    cinfo.circuit_direction,
    cinfo.total_races_held AS circuit_total_races,

    -- Driver 1 Info (from driver table join)
    d1.id AS driver_1_id,
    d1.full_name AS driver_1_name,
    d1.abbreviation AS driver_1_abbr,
    nat1.name AS driver_1_nationality,
    d1.permanent_number AS driver_1_number,
    
    -- Driver 1 Race Performance (with calculated finish position)
    d1rp.race_year AS driver_1_race_year,
    d1rp.race_name AS driver_1_race_name,
    d1rp.constructor_name AS driver_1_constructor,
    d1rp.finish_position AS driver_1_finish_position,
    d1rp.quali_position AS driver_1_quali_position,
    d1rp.grid_position AS driver_1_grid_position,
    d1rp.race_points AS driver_1_race_points,
    d1rp.race_pole_position AS driver_1_had_pole,
    (COALESCE(d1rp.grid_position, 0) - d1rp.finish_position) AS driver_1_positions_gained,
    
    -- Driver 1 Circuit History (aggregated stats)
    COALESCE(d1ch.total_races_at_circuit, 0) AS driver_1_circuit_races,
    COALESCE(d1ch.avg_finish_position, 0) AS driver_1_circuit_avg_finish,
    COALESCE(d1ch.best_finish, 0) AS driver_1_circuit_best_finish,
    COALESCE(d1ch.total_points_at_circuit, 0) AS driver_1_circuit_total_points,
    COALESCE(d1ch.avg_points_per_race, 0) AS driver_1_circuit_avg_points,
    COALESCE(d1ch.wins_at_circuit, 0) AS driver_1_circuit_wins,
    COALESCE(d1ch.podiums_at_circuit, 0) AS driver_1_circuit_podiums,
    COALESCE(d1ch.poles_at_circuit, 0) AS driver_1_circuit_poles,
    
    -- Driver 1 Season Stats
    COALESCE(d1ss.season_points, 0) AS driver_1_season_points,
    COALESCE(d1ss.season_wins, 0) AS driver_1_season_wins,
    COALESCE(d1ss.season_podiums, 0) AS driver_1_season_podiums,
    d1ss.championship_position AS driver_1_championship_pos,
    
    -- Driver 2 Info
    d2.id AS driver_2_id,
    d2.full_name AS driver_2_name,
    d2.abbreviation AS driver_2_abbr,
    nat2.name AS driver_2_nationality,
    d2.permanent_number AS driver_2_number,
    
    -- Driver 2 Race Performance
    d2rp.race_year AS driver_2_race_year,
    d2rp.race_name AS driver_2_race_name,
    d2rp.constructor_name AS driver_2_constructor,
    d2rp.finish_position AS driver_2_finish_position,
    d2rp.quali_position AS driver_2_quali_position,
    d2rp.grid_position AS driver_2_grid_position,
    d2rp.race_points AS driver_2_race_points,
    d2rp.race_pole_position AS driver_2_had_pole,
    (COALESCE(d2rp.grid_position, 0) - d2rp.finish_position) AS driver_2_positions_gained,
    
    -- Driver 2 Circuit History
    COALESCE(d2ch.total_races_at_circuit, 0) AS driver_2_circuit_races,
    COALESCE(d2ch.avg_finish_position, 0) AS driver_2_circuit_avg_finish,
    COALESCE(d2ch.best_finish, 0) AS driver_2_circuit_best_finish,
    COALESCE(d2ch.total_points_at_circuit, 0) AS driver_2_circuit_total_points,
    COALESCE(d2ch.avg_points_per_race, 0) AS driver_2_circuit_avg_points,
    COALESCE(d2ch.wins_at_circuit, 0) AS driver_2_circuit_wins,
    COALESCE(d2ch.podiums_at_circuit, 0) AS driver_2_circuit_podiums,
    COALESCE(d2ch.poles_at_circuit, 0) AS driver_2_circuit_poles,
    
    -- Driver 2 Season Stats
    COALESCE(d2ss.season_points, 0) AS driver_2_season_points,
    COALESCE(d2ss.season_wins, 0) AS driver_2_season_wins,
    COALESCE(d2ss.season_podiums, 0) AS driver_2_season_podiums,
    d2ss.championship_position AS driver_2_championship_pos

FROM circuit_info cinfo

-- Join Driver 1 race performance and details
CROSS JOIN driver_1_race_performance d1rp
LEFT JOIN driver d1 ON d1rp.driver_id = d1.id
LEFT JOIN country nat1 ON d1.nationality_country_id = nat1.id

-- Join Driver 2 race performance and details
CROSS JOIN driver_2_race_performance d2rp
LEFT JOIN driver d2 ON d2rp.driver_id = d2.id
LEFT JOIN country nat2 ON d2.nationality_country_id = nat2.id

-- Join circuit history (optional - might be first race at circuit)
LEFT JOIN driver_1_circuit_history d1ch ON d1.id = d1ch.driver_id
LEFT JOIN driver_2_circuit_history d2ch ON d2.id = d2ch.driver_id

-- Join season stats (optional)
LEFT JOIN driver_1_season_stats d1ss ON d1.id = d1ss.driver_id
LEFT JOIN driver_2_season_stats d2ss ON d2.id = d2ss.driver_id;
