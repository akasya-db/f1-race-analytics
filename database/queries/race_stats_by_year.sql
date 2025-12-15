-- Race statistics grouped by year with pagination and sorting
-- Params: year, year_from, year_to, race_count_min, race_count_max, avg_laps_min, avg_laps_max, sort_by, sort_dir, limit, offset
SELECT
  r.year,
  COUNT(*) AS race_count,
  ROUND(AVG(r.laps), 3) AS avg_laps,
  SUM(CASE WHEN r.qualifying_format = 'SPRINT_RACE' THEN 1 ELSE 0 END) AS sprint_races,
  SUM(CASE WHEN r.qualifying_format = 'KNOCKOUT' THEN 1 ELSE 0 END) AS knockout_races,
  SUM(CASE WHEN r.qualifying_format = 'ONE_SESSION' THEN 1 ELSE 0 END) AS one_session_races,
  SUM(CASE WHEN r.qualifying_format = 'TWO_SESSION' THEN 1 ELSE 0 END) AS two_session_races,
  SUM(CASE WHEN r.qualifying_format = 'FOUR_LAPS' THEN 1 ELSE 0 END) AS four_laps_races,
  SUM(CASE WHEN r.qualifying_format = 'AGGREGATE' THEN 1 ELSE 0 END) AS aggregate_races,
  COUNT(*) OVER() AS full_count
FROM race r
WHERE (%(year)s IS NULL OR r.year = %(year)s)
  AND (%(year_from)s IS NULL OR r.year >= %(year_from)s)
  AND (%(year_to)s IS NULL OR r.year <= %(year_to)s)
GROUP BY r.year
HAVING (%(race_count_min)s IS NULL OR COUNT(*) >= %(race_count_min)s)
  AND (%(race_count_max)s IS NULL OR COUNT(*) <= %(race_count_max)s)
  AND (%(avg_laps_min)s IS NULL OR AVG(r.laps) >= %(avg_laps_min)s)
  AND (%(avg_laps_max)s IS NULL OR AVG(r.laps) <= %(avg_laps_max)s)
ORDER BY 
  CASE WHEN %(sort_by)s = 'year' AND %(sort_dir)s = 'ASC' THEN r.year END ASC,
  CASE WHEN %(sort_by)s = 'year' AND %(sort_dir)s = 'DESC' THEN r.year END DESC,
  CASE WHEN %(sort_by)s = 'race_count' AND %(sort_dir)s = 'ASC' THEN COUNT(*) END ASC,
  CASE WHEN %(sort_by)s = 'race_count' AND %(sort_dir)s = 'DESC' THEN COUNT(*) END DESC,
  CASE WHEN %(sort_by)s = 'avg_laps' AND %(sort_dir)s = 'ASC' THEN AVG(r.laps) END ASC,
  CASE WHEN %(sort_by)s = 'avg_laps' AND %(sort_dir)s = 'DESC' THEN AVG(r.laps) END DESC,
  r.year DESC
LIMIT %(limit)s OFFSET %(offset)s;
