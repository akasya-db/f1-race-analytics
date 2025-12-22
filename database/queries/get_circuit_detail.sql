WITH circuit_base AS (
    SELECT 
        c.id,
        c.name,
        c.full_name,
        c.place_name,
        c.type,
        c.direction,
        c.length,
        c.turns,
        c.total_races_held,
        c.latitude,
        c.longitude,
        co.name AS country_name
    FROM circuit c
    LEFT JOIN country co ON c.country_id = co.id
    WHERE c.id = %(circuit_id)s
    LIMIT 1
),
race_rollup AS (
    SELECT 
        r.circuit_id,
        COUNT(*) AS total_races,
        COUNT(*) FILTER (WHERE r.is_real) AS official_races,
        COUNT(*) FILTER (WHERE NOT r.is_real) AS simulated_races,
        MIN(r.year) AS first_year,
        MAX(r.year) AS last_year,
        AVG(r.laps)::NUMERIC(10,2) AS avg_laps
    FROM race r
    WHERE r.circuit_id = %(circuit_id)s
    GROUP BY r.circuit_id
),
winner_stats AS (
    SELECT 
        r.circuit_id,
        COUNT(DISTINCT CASE WHEN rd.position_display_order = 1 THEN rd.driver_id END) AS unique_winners
    FROM race r
    LEFT JOIN race_data rd ON rd.race_id = r.id
    WHERE r.circuit_id = %(circuit_id)s
    GROUP BY r.circuit_id
),
home_driver_counts AS (
    SELECT 
        c.id AS circuit_id,
        COUNT(DISTINCT d.id) AS home_drivers
    FROM circuit c
    LEFT JOIN country co ON c.country_id = co.id
    LEFT JOIN driver d ON d.nationality_country_id = co.id
    WHERE c.id = %(circuit_id)s
    GROUP BY c.id
),
home_constructor_counts AS (
    SELECT 
        c.id AS circuit_id,
        COUNT(DISTINCT cons.id) AS home_constructors
    FROM circuit c
    LEFT JOIN country co ON c.country_id = co.id
    LEFT JOIN constructor cons ON cons.country_id = co.id
    WHERE c.id = %(circuit_id)s
    GROUP BY c.id
),
race_payload AS (
    SELECT 
        r.circuit_id,
        json_agg(
            json_build_object(
                'id', r.id,
                'year', r.year,
                'round', r.round,
                'official_name', r.official_name,
                'date', r.date,
                'qualifying_format', r.qualifying_format,
                'laps', r.laps,
                'is_real', r.is_real,
                'participant_count', (
                    SELECT COUNT(*) 
                    FROM race_data rd 
                    WHERE rd.race_id = r.id
                ),
                'winner', (
                    SELECT json_build_object(
                        'driver_id', d.id,
                        'driver_name', d.full_name,
                        'constructor_name', cons.full_name
                    )
                    FROM race_data rd2
                    JOIN driver d ON rd2.driver_id = d.id
                    LEFT JOIN constructor cons ON cons.id = rd2.constructor_id
                    WHERE rd2.race_id = r.id
                    ORDER BY rd2.position_display_order ASC
                    LIMIT 1
                )
            )
            ORDER BY r.year DESC, r.round DESC
        ) AS races
    FROM race r
    WHERE r.circuit_id = %(circuit_id)s
    GROUP BY r.circuit_id
)
SELECT 
    cb.*,
    rr.total_races,
    rr.official_races,
    rr.simulated_races,
    rr.first_year,
    rr.last_year,
    rr.avg_laps,
    ws.unique_winners,
    hd.home_drivers,
    hc.home_constructors,
    rp.races
FROM circuit_base cb
LEFT JOIN race_rollup rr ON rr.circuit_id = cb.id
LEFT JOIN winner_stats ws ON ws.circuit_id = cb.id
LEFT JOIN home_driver_counts hd ON hd.circuit_id = cb.id
LEFT JOIN home_constructor_counts hc ON hc.circuit_id = cb.id
LEFT JOIN race_payload rp ON rp.circuit_id = cb.id;
