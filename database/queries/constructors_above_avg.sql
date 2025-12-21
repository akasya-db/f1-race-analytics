-- constructors with above average performance within their country
SELECT 
    c.*, 
    co.name AS nationality,
    -- calculate country average total points
    (SELECT AVG(c2.total_points) 
     FROM constructor c2 
     WHERE c2.country_id = c.country_id) AS country_avg,
    COUNT(*) OVER() as full_count
FROM constructor c
JOIN country co ON c.country_id = co.id
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
-- grouping by constructor and country
GROUP BY c.id, co.name
-- only include constructors with above average total points in their country
HAVING c.total_points > (
    SELECT AVG(c3.total_points) 
    FROM constructor c3 
    WHERE c3.country_id = c.country_id
)
ORDER BY c.total_points DESC
LIMIT %(limit)s OFFSET %(offset)s;