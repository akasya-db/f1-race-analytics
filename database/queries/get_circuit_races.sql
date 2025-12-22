SELECT 
    r.id,
    r.year,
    r.round,
    r.date,
    r.official_name,
    r.qualifying_format,
    r.laps,
    r.is_real,
    (
        SELECT COUNT(*) 
        FROM race_data rd 
        WHERE rd.race_id = r.id
    ) AS participant_count
FROM race r
WHERE r.circuit_id = %(circuit_id)s
ORDER BY r.year DESC, r.round DESC;
