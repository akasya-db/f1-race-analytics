SELECT 
    r.id,
    c.full_name AS circuit_name,
    co.name AS country,
    c.place_name AS location,
    r.year,
    r.round,
    r.date,
    r.official_name,
    r.qualifying_format,
    r.laps,
    r.qualifying_date,
    r.is_real,
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
    (%(is_real)s IS NULL OR r.is_real = %(is_real)s)
LIMIT %(limit)s OFFSET %(offset)s;