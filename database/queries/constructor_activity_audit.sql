SELECT 
    c.name AS constructor_name,
    co.name AS nationality,
    COUNT(rd.id) AS total_race_entries,
    'Never Raced' AS status
FROM constructor c
JOIN country co ON c.country_id = co.id
-- Left Join (Outer Join): Bring who never raced
LEFT JOIN race_data rd ON c.id = rd.constructor_id
GROUP BY c.id, c.name, co.name
-- Filter to only those constructors who have never participated
HAVING COUNT(rd.id) = 0
ORDER BY c.name ASC;