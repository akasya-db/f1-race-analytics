SELECT
    d.id,
    d.name,
    d.first_name,
    d.last_name,
    d.full_name,
    d.abbreviation,
    d.permanent_number,
    d.gender,
    d.date_of_birth,
    d.date_of_death,
    d.place_of_birth,

    cb.name AS country_of_birth,
    n.name AS nationality,

    d.best_championship_position,
    d.best_race_result,
    d.total_championship_wins,
    d.total_race_starts,
    d.total_race_wins,
    d.total_race_laps,
    d.total_podiums,
    d.total_points,
    d.total_pole_positions,

    d.is_real,

    COUNT(*) OVER() AS full_count

FROM driver d
JOIN country cb ON cb.id = d.country_of_birth_country_id
JOIN country n  ON n.id  = d.nationality_country_id

WHERE
    (%(name)s IS NULL OR d.full_name ILIKE '%%' || %(name)s || '%%')
    AND (%(nationality)s IS NULL OR n.name ILIKE '%%' || %(nationality)s || '%%')
    AND (%(place_of_birth)s IS NULL OR d.place_of_birth ILIKE '%%' || %(place_of_birth)s || '%%')

    AND (%(wins_min)s IS NULL OR d.total_race_wins >= %(wins_min)s)
    AND (%(podiums_min)s IS NULL OR d.total_podiums >= %(podiums_min)s)
    AND (%(points_min)s IS NULL OR d.total_points >= %(points_min)s)
    AND (%(poles_min)s IS NULL OR d.total_pole_positions >= %(poles_min)s)

    AND (%(birth_from)s IS NULL OR d.date_of_birth >= %(birth_from)s::date)
    AND (%(birth_to)s IS NULL OR d.date_of_birth <= %(birth_to)s::date)

    AND (%(is_real)s IS NULL OR d.is_real = %(is_real)s)

LIMIT %(limit)s OFFSET %(offset)s;
