SELECT 
    r.id,
    r.circuit_id,
    r.year,
    r.round,
    r.date,
    r.official_name,
    r.qualifying_format,
    r.laps,
    r.qualifying_date,
    r.is_real,
    c.full_name AS circuit_name,
    co.name AS circuit_country,
    c.place_name AS circuit_place_name,
    c.length AS circuit_length,
    c.turns AS circuit_turns,
    c.type AS circuit_type,
    c.direction AS circuit_direction,
    c.total_races_held AS circuit_total_races,
    c.latitude AS circuit_latitude,
    c.longitude AS circuit_longitude,
    COUNT(*) OVER() as full_count
FROM
    race r
LEFT JOIN
    circuit c ON r.circuit_id = c.id
LEFT JOIN
    country co ON c.country_id = co.id
WHERE
    (%(year)s IS NULL OR r.year = %(year)s)
    AND
    (%(round)s IS NULL OR r.round = %(round)s)
    AND
    (%(circuit_id)s IS NULL OR r.circuit_id = %(circuit_id)s)
    AND
    (%(official_name)s IS NULL OR r.official_name ILIKE '%%' || %(official_name)s || '%%')
    AND
    (%(laps_min)s IS NULL OR r.laps >= %(laps_min)s)
    AND
    (%(laps_max)s IS NULL OR r.laps <= %(laps_max)s)
    AND
    (%(date_from)s IS NULL OR r.date >= %(date_from)s::date)
    AND
    (%(date_to)s IS NULL OR r.date <= %(date_to)s::date)
    AND
    (%(qualifying_format)s IS NULL OR r.qualifying_format = %(qualifying_format)s)
    AND
    (%(is_real)s::boolean IS NULL OR r.is_real = %(is_real)s::boolean)
LIMIT %(limit)s OFFSET %(offset)s;
