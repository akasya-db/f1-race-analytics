-- ============================================
-- Compare Driver Performance Query
-- ============================================
-- This complex query compares two drivers' performances at a specific circuit
-- for specific races (identified by race_id).
--
-- Features:
-- - 6 table JOINs (race, race_data, driver, constructor, circuit, country)
-- - Nested subqueries for historical statistics
-- - GROUP BY with aggregate functions
-- - LEFT JOINs for championship standings
-- - CTEs (Common Table Expressions) for readability
--
-- Parameters (17 total, using positional placeholders for psycopg2):
--   driver_1_id (VARCHAR) - appears multiple times
--   race_1_id (INT) - the specific race for driver 1
--   driver_2_id (VARCHAR) - appears multiple times
--   race_2_id (INT) - the specific race for driver 2
--   circuit_id (VARCHAR) - the circuit being compared
-- ============================================

WITH 
-- ===========================================
-- CTE 1: Driver 1's performance in the specific race
-- ===========================================
driver_1_race_performance AS (
    SELECT 
        rd.driver_id,
        rd.race_id,
        rd.constructor_id,
        rd.position_display_order AS finish_position,
        rd.race_points,
        rd.race_pole_position,
        rd.race_qualification_position_number AS quali_position,
        rd.race_grid_position_number AS grid_position,
        r.year AS race_year,
        r.official_name AS race_name,
        r.laps AS total_laps,
        c.name AS constructor_name,
        c.full_name AS constructor_full_name
    FROM race_data rd
    INNER JOIN race r ON rd.race_id = r.id
    INNER JOIN constructor c ON rd.constructor_id = c.id
    WHERE rd.driver_id = %s 
      AND rd.race_id = %s
),

-- ===========================================
-- CTE 2: Driver 2's performance in the specific race
-- ===========================================
driver_2_race_performance AS (
    SELECT 
        rd.driver_id,
        rd.race_id,
        rd.constructor_id,
        rd.position_display_order AS finish_position,
        rd.race_points,
        rd.race_pole_position,
        rd.race_qualification_position_number AS quali_position,
        rd.race_grid_position_number AS grid_position,
        r.year AS race_year,
        r.official_name AS race_name,
        r.laps AS total_laps,
        c.name AS constructor_name,
        c.full_name AS constructor_full_name
    FROM race_data rd
    INNER JOIN race r ON rd.race_id = r.id
    INNER JOIN constructor c ON rd.constructor_id = c.id
    WHERE rd.driver_id = %s 
      AND rd.race_id = %s
),

-- ===========================================
-- CTE 3: Driver 1's historical stats at this circuit
-- (Nested subquery with GROUP BY)
-- ===========================================
driver_1_circuit_history AS (
    SELECT 
        rd.driver_id,
        COUNT(DISTINCT rd.race_id) AS total_races_at_circuit,
        AVG(rd.position_display_order) AS avg_finish_position,
        MIN(rd.position_display_order) AS best_finish,
        MAX(rd.position_display_order) AS worst_finish,
        SUM(rd.race_points) AS total_points_at_circuit,
        AVG(rd.race_points) AS avg_points_per_race,
        COUNT(CASE WHEN rd.position_display_order = 1 THEN 1 END) AS wins_at_circuit,
        COUNT(CASE WHEN rd.position_display_order <= 3 THEN 1 END) AS podiums_at_circuit,
        COUNT(CASE WHEN rd.race_pole_position = TRUE THEN 1 END) AS poles_at_circuit,
        AVG(rd.race_qualification_position_number) AS avg_quali_position,
        MIN(rd.race_qualification_position_number) AS best_quali,
        -- Positions gained/lost from grid to finish (negative = positions gained)
        AVG(rd.position_display_order - rd.race_grid_position_number) AS avg_positions_delta
    FROM race_data rd
    INNER JOIN race r ON rd.race_id = r.id
    WHERE rd.driver_id = %s 
      AND r.circuit_id = %s
    GROUP BY rd.driver_id
),

-- ===========================================
-- CTE 4: Driver 2's historical stats at this circuit
-- ===========================================
driver_2_circuit_history AS (
    SELECT 
        rd.driver_id,
        COUNT(DISTINCT rd.race_id) AS total_races_at_circuit,
        AVG(rd.position_display_order) AS avg_finish_position,
        MIN(rd.position_display_order) AS best_finish,
        MAX(rd.position_display_order) AS worst_finish,
        SUM(rd.race_points) AS total_points_at_circuit,
        AVG(rd.race_points) AS avg_points_per_race,
        COUNT(CASE WHEN rd.position_display_order = 1 THEN 1 END) AS wins_at_circuit,
        COUNT(CASE WHEN rd.position_display_order <= 3 THEN 1 END) AS podiums_at_circuit,
        COUNT(CASE WHEN rd.race_pole_position = TRUE THEN 1 END) AS poles_at_circuit,
        AVG(rd.race_qualification_position_number) AS avg_quali_position,
        MIN(rd.race_qualification_position_number) AS best_quali,
        AVG(rd.position_display_order - rd.race_grid_position_number) AS avg_positions_delta
    FROM race_data rd
    INNER JOIN race r ON rd.race_id = r.id
    WHERE rd.driver_id = %s 
      AND r.circuit_id = %s
    GROUP BY rd.driver_id
),

-- ===========================================
-- CTE 5: Driver 1's season stats (year of their race)
-- Uses nested subquery to get the year first
-- ===========================================
driver_1_season_stats AS (
    SELECT 
        rd.driver_id,
        r.year,
        COUNT(DISTINCT rd.race_id) AS races_in_season,
        SUM(rd.race_points) AS season_points,
        AVG(rd.position_display_order) AS season_avg_finish,
        COUNT(CASE WHEN rd.position_display_order = 1 THEN 1 END) AS season_wins,
        COUNT(CASE WHEN rd.position_display_order <= 3 THEN 1 END) AS season_podiums,
        -- Championship position at end of season (subquery)
        (
            SELECT rds.position_number 
            FROM race_driver_standing rds
            INNER JOIN race r2 ON rds.race_id = r2.id
            WHERE rds.driver_id = %s 
              AND r2.year = r.year
            ORDER BY r2.round DESC
            LIMIT 1
        ) AS championship_position
    FROM race_data rd
    INNER JOIN race r ON rd.race_id = r.id
    WHERE rd.driver_id = %s
      AND r.year = (SELECT year FROM race WHERE id = %s)
    GROUP BY rd.driver_id, r.year
),

-- ===========================================
-- CTE 6: Driver 2's season stats
-- ===========================================
driver_2_season_stats AS (
    SELECT 
        rd.driver_id,
        r.year,
        COUNT(DISTINCT rd.race_id) AS races_in_season,
        SUM(rd.race_points) AS season_points,
        AVG(rd.position_display_order) AS season_avg_finish,
        COUNT(CASE WHEN rd.position_display_order = 1 THEN 1 END) AS season_wins,
        COUNT(CASE WHEN rd.position_display_order <= 3 THEN 1 END) AS season_podiums,
        (
            SELECT rds.position_number 
            FROM race_driver_standing rds
            INNER JOIN race r2 ON rds.race_id = r2.id
            WHERE rds.driver_id = %s 
              AND r2.year = r.year
            ORDER BY r2.round DESC
            LIMIT 1
        ) AS championship_position
    FROM race_data rd
    INNER JOIN race r ON rd.race_id = r.id
    WHERE rd.driver_id = %s
      AND r.year = (SELECT year FROM race WHERE id = %s)
    GROUP BY rd.driver_id, r.year
),

-- ===========================================
-- CTE 7: Circuit information
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
-- MAIN QUERY: Combine all CTEs into final comparison
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

    -- Driver 1 Info
    d1.id AS driver_1_id,
    d1.full_name AS driver_1_name,
    d1.abbreviation AS driver_1_abbr,
    nat1.name AS driver_1_nationality,
    d1.permanent_number AS driver_1_number,
    
    -- Driver 1 Race Performance
    d1rp.race_year AS driver_1_race_year,
    d1rp.race_name AS driver_1_race_name,
    d1rp.constructor_name AS driver_1_constructor,
    d1rp.finish_position AS driver_1_finish_position,
    d1rp.quali_position AS driver_1_quali_position,
    d1rp.grid_position AS driver_1_grid_position,
    d1rp.race_points AS driver_1_race_points,
    d1rp.race_pole_position AS driver_1_had_pole,
    (d1rp.grid_position - d1rp.finish_position) AS driver_1_positions_gained,
    
    -- Driver 1 Circuit History
    COALESCE(d1ch.total_races_at_circuit, 0) AS driver_1_circuit_races,
    ROUND(COALESCE(d1ch.avg_finish_position, 0)::numeric, 2) AS driver_1_circuit_avg_finish,
    COALESCE(d1ch.best_finish, 0) AS driver_1_circuit_best_finish,
    COALESCE(d1ch.worst_finish, 0) AS driver_1_circuit_worst_finish,
    COALESCE(d1ch.total_points_at_circuit, 0) AS driver_1_circuit_total_points,
    ROUND(COALESCE(d1ch.avg_points_per_race, 0)::numeric, 2) AS driver_1_circuit_avg_points,
    COALESCE(d1ch.wins_at_circuit, 0) AS driver_1_circuit_wins,
    COALESCE(d1ch.podiums_at_circuit, 0) AS driver_1_circuit_podiums,
    COALESCE(d1ch.poles_at_circuit, 0) AS driver_1_circuit_poles,
    ROUND(COALESCE(d1ch.avg_quali_position, 0)::numeric, 2) AS driver_1_circuit_avg_quali,
    COALESCE(d1ch.best_quali, 0) AS driver_1_circuit_best_quali,
    ROUND(COALESCE(d1ch.avg_positions_delta, 0)::numeric, 2) AS driver_1_circuit_avg_pos_delta,
    
    -- Driver 1 Season Stats
    COALESCE(d1ss.season_points, 0) AS driver_1_season_points,
    ROUND(COALESCE(d1ss.season_avg_finish, 0)::numeric, 2) AS driver_1_season_avg_finish,
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
    (d2rp.grid_position - d2rp.finish_position) AS driver_2_positions_gained,
    
    -- Driver 2 Circuit History
    COALESCE(d2ch.total_races_at_circuit, 0) AS driver_2_circuit_races,
    ROUND(COALESCE(d2ch.avg_finish_position, 0)::numeric, 2) AS driver_2_circuit_avg_finish,
    COALESCE(d2ch.best_finish, 0) AS driver_2_circuit_best_finish,
    COALESCE(d2ch.worst_finish, 0) AS driver_2_circuit_worst_finish,
    COALESCE(d2ch.total_points_at_circuit, 0) AS driver_2_circuit_total_points,
    ROUND(COALESCE(d2ch.avg_points_per_race, 0)::numeric, 2) AS driver_2_circuit_avg_points,
    COALESCE(d2ch.wins_at_circuit, 0) AS driver_2_circuit_wins,
    COALESCE(d2ch.podiums_at_circuit, 0) AS driver_2_circuit_podiums,
    COALESCE(d2ch.poles_at_circuit, 0) AS driver_2_circuit_poles,
    ROUND(COALESCE(d2ch.avg_quali_position, 0)::numeric, 2) AS driver_2_circuit_avg_quali,
    COALESCE(d2ch.best_quali, 0) AS driver_2_circuit_best_quali,
    ROUND(COALESCE(d2ch.avg_positions_delta, 0)::numeric, 2) AS driver_2_circuit_avg_pos_delta,
    
    -- Driver 2 Season Stats
    COALESCE(d2ss.season_points, 0) AS driver_2_season_points,
    ROUND(COALESCE(d2ss.season_avg_finish, 0)::numeric, 2) AS driver_2_season_avg_finish,
    COALESCE(d2ss.season_wins, 0) AS driver_2_season_wins,
    COALESCE(d2ss.season_podiums, 0) AS driver_2_season_podiums,
    d2ss.championship_position AS driver_2_championship_pos

FROM circuit_info cinfo

-- Join Driver 1 data
CROSS JOIN driver d1
LEFT JOIN country nat1 ON d1.nationality_country_id = nat1.id
LEFT JOIN driver_1_race_performance d1rp ON d1.id = d1rp.driver_id
LEFT JOIN driver_1_circuit_history d1ch ON d1.id = d1ch.driver_id
LEFT JOIN driver_1_season_stats d1ss ON d1.id = d1ss.driver_id

-- Join Driver 2 data
CROSS JOIN driver d2
LEFT JOIN country nat2 ON d2.nationality_country_id = nat2.id
LEFT JOIN driver_2_race_performance d2rp ON d2.id = d2rp.driver_id
LEFT JOIN driver_2_circuit_history d2ch ON d2.id = d2ch.driver_id
LEFT JOIN driver_2_season_stats d2ss ON d2.id = d2ss.driver_id

WHERE d1.id = %s AND d2.id = %s;
