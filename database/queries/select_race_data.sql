-- Select race_data rows for a given race with pagination
-- Params: race_id (required), is_real (optional boolean), limit, offset
SELECT
  rd.id,
  rd.race_id,
  rd.driver_id,
  d.full_name AS driver_name,
  rd.constructor_id,
  c.full_name AS constructor_name,
  rd.position_display_order,
  rd.driver_number,
  rd.race_points,
  rd.race_pole_position,
  rd.race_qualification_position_number,
  rd.race_grid_position_number,
  rd.is_real,
  rd.created_at,
  COUNT(*) OVER() AS full_count
FROM (
  SELECT DISTINCT ON (race_id, driver_id) *
  FROM race_data
  ORDER BY race_id, driver_id, position_display_order NULLS LAST
) rd
JOIN driver d ON rd.driver_id = d.id
JOIN constructor c ON rd.constructor_id = c.id
WHERE (%(race_id)s IS NULL OR rd.race_id = %(race_id)s)
  AND (%(is_real)s IS NULL OR rd.is_real = %(is_real)s)
ORDER BY rd.race_points DESC NULLS LAST, rd.position_display_order NULLS LAST, rd.id
LIMIT %(limit)s OFFSET %(offset)s;
