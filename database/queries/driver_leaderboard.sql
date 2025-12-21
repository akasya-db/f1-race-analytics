WITH rd_dedup AS (
    SELECT *
    FROM (
        SELECT
            rd.*,
            ROW_NUMBER() OVER (
                PARTITION BY rd.race_id, rd.driver_id
                ORDER BY
                    rd.is_real DESC,
                    rd.created_at DESC,
                    rd.id DESC
            ) AS rn
        FROM race_data rd
    ) x
    WHERE rn = 1
),

scope AS (
    SELECT
        r.id AS race_id,
        r.year,
        rd.driver_id,
        COALESCE(rd.race_points, 0) AS race_points,
        rd.position_display_order
    FROM rd_dedup rd
    JOIN race r   ON r.id = rd.race_id
    JOIN driver d ON d.id = rd.driver_id
    WHERE
        r.year BETWEEN %(year_from)s AND %(year_to)s
        AND rd.is_real = TRUE
        AND r.is_real  = TRUE
        AND d.is_real  = TRUE
),

-- yarış kazananını seç: race_points en yüksek olan
race_winners AS (
    SELECT driver_id, COUNT(*) AS race_wins
    FROM (
        SELECT
            race_id,
            driver_id,
            ROW_NUMBER() OVER (
                PARTITION BY race_id
                ORDER BY
                    race_points DESC,                          -- 1) en yüksek puan
                    CASE                                       -- 2) eşitlikte pozisyonu olanı tercih et
                        WHEN position_display_order IS NULL OR position_display_order <= 0 THEN 9999
                        ELSE position_display_order
                    END ASC,
                    driver_id ASC
            ) AS rn
        FROM scope
    ) t
    WHERE rn = 1
    GROUP BY driver_id
),

season_points AS (
    SELECT
        year,
        driver_id,
        SUM(race_points) AS season_points
    FROM scope
    GROUP BY year, driver_id
),

season_ranked AS (
    SELECT
        year,
        driver_id,
        season_points,
        ROW_NUMBER() OVER (PARTITION BY year ORDER BY season_points DESC) AS rn
    FROM season_points
),

championship_counts AS (
    SELECT
        driver_id,
        COUNT(*) AS championship_wins
    FROM season_ranked
    WHERE rn = 1
    GROUP BY driver_id
),

driver_points AS (
    SELECT
        driver_id,
        SUM(race_points) AS total_points
    FROM scope
    GROUP BY driver_id
)

SELECT
    d.id,
    d.full_name,
    COALESCE(cc.championship_wins, 0) AS championship_wins,
    COALESCE(rw.race_wins, 0)         AS race_wins,
    COALESCE(dp.total_points, 0)      AS total_points
FROM driver d
JOIN driver_points dp ON dp.driver_id = d.id
LEFT JOIN race_winners rw ON rw.driver_id = d.id
LEFT JOIN championship_counts cc ON cc.driver_id = d.id
ORDER BY
    championship_wins DESC,
    race_wins DESC,
    total_points DESC,
    d.full_name ASC
LIMIT %(limit)s;
