-- Race statistics grouped by year and decade with nested query + complex GROUP BY
-- Params: year, year_from, year_to, race_count_min, race_count_max, avg_laps_min, avg_laps_max, sort_by, sort_dir, limit, offset
SELECT
  stats.decade,
  stats.year,
  stats.race_count,
  stats.avg_laps,
  stats.sprint_races,
  stats.knockout_races,
  stats.one_session_races,
  stats.two_session_races,
  stats.four_laps_races,
  stats.aggregate_races,
  -- Aggregation over the outer result for decade-level totals (ROLLUP simulation)
  SUM(stats.race_count) OVER (PARTITION BY stats.decade) AS decade_race_count,
  ROUND(AVG(stats.avg_laps) OVER (PARTITION BY stats.decade), 3) AS decade_avg_laps,
  COUNT(*) OVER() AS full_count
FROM (
  -- Nested subquery: aggregate race data by year with complex GROUP BY (year + derived decade)
  SELECT
    -- Complex GROUP BY: grouping by both year and a derived decade expression
    (r.year / 10) * 10 AS decade,
    r.year,
    COUNT(*) AS race_count,
    ROUND(AVG(r.laps), 3) AS avg_laps,
    SUM(CASE WHEN r.qualifying_format = 'SPRINT_RACE' THEN 1 ELSE 0 END) AS sprint_races,
    SUM(CASE WHEN r.qualifying_format = 'KNOCKOUT' THEN 1 ELSE 0 END) AS knockout_races,
    SUM(CASE WHEN r.qualifying_format = 'ONE_SESSION' THEN 1 ELSE 0 END) AS one_session_races,
    SUM(CASE WHEN r.qualifying_format = 'TWO_SESSION' THEN 1 ELSE 0 END) AS two_session_races,
    SUM(CASE WHEN r.qualifying_format = 'FOUR_LAPS' THEN 1 ELSE 0 END) AS four_laps_races,
    SUM(CASE WHEN r.qualifying_format = 'AGGREGATE' THEN 1 ELSE 0 END) AS aggregate_races
  FROM race r
  WHERE (%(year)s IS NULL OR r.year = %(year)s)
    AND (%(year_from)s IS NULL OR r.year >= %(year_from)s)
    AND (%(year_to)s IS NULL OR r.year <= %(year_to)s)
  -- Complex GROUP BY: multiple columns including derived expression
  GROUP BY (r.year / 10) * 10, r.year
) AS stats
WHERE (%(race_count_min)s IS NULL OR stats.race_count >= %(race_count_min)s)
  AND (%(race_count_max)s IS NULL OR stats.race_count <= %(race_count_max)s)
  AND (%(avg_laps_min)s IS NULL OR stats.avg_laps >= %(avg_laps_min)s)
  AND (%(avg_laps_max)s IS NULL OR stats.avg_laps <= %(avg_laps_max)s)
ORDER BY 
  CASE WHEN %(sort_by)s = 'year' AND %(sort_dir)s = 'ASC' THEN stats.year END ASC,
  CASE WHEN %(sort_by)s = 'year' AND %(sort_dir)s = 'DESC' THEN stats.year END DESC,
  CASE WHEN %(sort_by)s = 'race_count' AND %(sort_dir)s = 'ASC' THEN stats.race_count END ASC,
  CASE WHEN %(sort_by)s = 'race_count' AND %(sort_dir)s = 'DESC' THEN stats.race_count END DESC,
  CASE WHEN %(sort_by)s = 'avg_laps' AND %(sort_dir)s = 'ASC' THEN stats.avg_laps END ASC,
  CASE WHEN %(sort_by)s = 'avg_laps' AND %(sort_dir)s = 'DESC' THEN stats.avg_laps END DESC,
  stats.decade ASC, stats.year DESC
LIMIT %(limit)s OFFSET %(offset)s;
