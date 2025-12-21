SELECT
    c.id,
    c.name,
    c.full_name,
    co.name AS nationality,
    c.best_championship_position,
    c.total_championship_wins,
    c.total_race_starts,
    c.total_podiums,
    c.total_points,
    c.total_pole_positions,
    c.is_real,
    COUNT(*) OVER() as full_count
FROM
    constructor c
JOIN
    country co ON c.country_id = co.id
WHERE
    (%(name)s IS NULL OR c.full_name ILIKE '%%' || %(name)s || '%%')
    AND
    (%(nationality)s IS NULL OR co.name = %(nationality)s)
    AND
    (%(champs_min)s IS NULL OR c.total_championship_wins >= %(champs_min)s)
    AND
    (%(total_points_min)s IS NULL OR c.total_points >= %(total_points_min)s)
    AND
    (%(total_points_max)s IS NULL OR c.total_points <= %(total_points_max)s)
    AND
    (%(is_real)s IS NULL OR c.is_real = %(is_real)s)
LIMIT %(limit)s OFFSET %(offset)s;