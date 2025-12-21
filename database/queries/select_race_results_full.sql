-- Full race results with complex join of 6 tables
-- Returns race info + circuit + country + driver results + constructor
-- Params: race_id (required), limit, offset
SELECT
    -- Race info
    r.id AS race_id,
    r.year AS race_year,
    r.round AS race_round,
    r.official_name AS race_name,
    r.date AS race_date,
    r.laps AS total_laps,
    r.qualifying_format,
    
    -- Circuit info (JOIN 2: circuit)
    cir.id AS circuit_id,
    cir.full_name AS circuit_name,
    cir.place_name AS circuit_place,
    cir.type AS circuit_type,
    cir.length AS circuit_length_km,
    cir.turns AS circuit_turns,
    cir.direction AS circuit_direction,
    
    -- Country info (JOIN 3: country for circuit)
    co.id AS country_id,
    co.name AS country_name,
    co.alpha3_code AS country_code,
    
    -- Race result data (JOIN 4: race_data)
    rd.id AS result_id,
    rd.position_display_order AS finish_position,
    rd.driver_number,
    rd.race_points,
    rd.race_pole_position,
    rd.race_qualification_position_number AS quali_position,
    rd.race_grid_position_number AS grid_position,
    
    -- Driver info (JOIN 5: driver)
    d.id AS driver_id,
    d.full_name AS driver_name,
    d.abbreviation AS driver_abbr,
    d.nationality_country_id AS driver_nationality_id,
    
    -- Constructor/Team info (JOIN 6: constructor)
    con.id AS constructor_id,
    con.full_name AS constructor_name,
    con.name AS constructor_short_name,
    
    -- Driver's nationality country (JOIN 7: country for driver - bonus!)
    dco.name AS driver_nationality,
    
    -- Pagination helper
    COUNT(*) OVER() AS full_count

FROM race r
-- JOIN 1: Circuit where race was held
INNER JOIN circuit cir ON r.circuit_id = cir.id
-- JOIN 2: Country of the circuit
INNER JOIN country co ON cir.country_id = co.id
-- JOIN 3: Race results data
INNER JOIN race_data rd ON rd.race_id = r.id
-- JOIN 4: Driver who participated
INNER JOIN driver d ON rd.driver_id = d.id
-- JOIN 5: Constructor/Team
INNER JOIN constructor con ON rd.constructor_id = con.id
-- JOIN 6: Driver's nationality (LEFT JOIN - some drivers may not have nationality set)
LEFT JOIN country dco ON d.nationality_country_id = dco.id

WHERE r.id = %(race_id)s
ORDER BY rd.position_display_order ASC NULLS LAST, rd.race_points DESC NULLS LAST
LIMIT %(limit)s OFFSET %(offset)s;
