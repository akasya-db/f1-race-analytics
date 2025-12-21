SELECT
    d.id,
    d.full_name,

    COUNT(DISTINCT rds.race_id)
        FILTER (WHERE rds.position_number = 1) AS race_wins,

    SUM(rds.points) AS total_points,

    COUNT(DISTINCT r.year)
        FILTER (WHERE rds.position_number = 1) AS championship_wins

FROM race_driver_standing rds
JOIN race r   ON r.id = rds.race_id
JOIN driver d ON d.id = rds.driver_id

WHERE
    (%(year_from)s IS NULL OR r.year >= %(year_from)s)
    AND (%(year_to)s IS NULL OR r.year <= %(year_to)s)

GROUP BY d.id, d.full_name

ORDER BY
    championship_wins DESC,
    race_wins DESC,
    total_points DESC

LIMIT %(limit)s;
