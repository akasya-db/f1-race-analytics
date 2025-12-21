SELECT 
    -- Ranking based on total points in street track
    RANK() OVER (ORDER BY SUM(COALESCE(rd.race_points, 0)) DESC) as rank_position,
    c.name AS constructor_name,
    co.name AS nationality,
    cir.type AS track_type,
    COUNT(DISTINCT r.id) AS total_races,
    -- Making sure to handle NULL race points
    SUM(COALESCE(rd.race_points, 0)) AS total_points,
    -- Best race position on street tracks
    MIN(rd.position_display_order) AS best_position
FROM constructor c
JOIN country co ON c.country_id = co.id
JOIN race_data rd ON c.id = rd.constructor_id
JOIN race r ON rd.race_id = r.id
JOIN circuit cir ON r.circuit_id = cir.id
WHERE 
    UPPER(cir.type) = 'STREET'
GROUP BY c.name, co.name, cir.type
-- Only include constructors with points on street tracks
HAVING SUM(COALESCE(rd.race_points, 0)) > 0
ORDER BY total_points DESC
LIMIT 10;