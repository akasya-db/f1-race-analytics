
-- ============================================
-- F1 Race Analytics Database Schema
-- Database: PostgreSQL
-- Created: 2025-10-31
-- ============================================

-- Drop tables if they exist (for clean setup during development)
DROP TABLE IF EXISTS race_constructor_standing CASCADE;
DROP TABLE IF EXISTS race_driver_standing CASCADE;
DROP TABLE IF EXISTS race_data CASCADE;
DROP TABLE IF EXISTS race CASCADE;
DROP TABLE IF EXISTS user CASCADE;
DROP TABLE IF EXISTS constructor CASCADE;
DROP TABLE IF EXISTS driver CASCADE;
DROP TABLE IF EXISTS circuit CASCADE;
DROP TABLE IF EXISTS country CASCADE;


-- Country dictionary (lookup)
CREATE TABLE country (
    id VARCHAR(100) PRIMARY KEY,
    alpha3_code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
);

-- Constructor/Team information
CREATE TABLE constructor (
    id VARCHAR(100) NOT NULL,
    country_id VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    best_championship_position INTEGER,
    total_championship_wins INTEGER NOT NULL,
    total_race_starts INTEGER NOT NULL,
    total_podiums INTEGER NOT NULL,
    total_points DECIMAL(8,2) NOT NULL,
    total_pole_positions INTEGER NOT NULL,
    is_real BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id),
    FOREIGN KEY (country_id) REFERENCES country(id)
);

-- Driver results per race (real/sim mix) - FK's will be added later
CREATE TABLE race_data (
    id                                      BIGSERIAL PRIMARY KEY,            -- proposal: PK = autoincrement id
    race_id                                 INT         NOT NULL,             -- FK race(id)
    driver_id                               VARCHAR(100) NOT NULL,            -- FK driver(id) add later
    constructor_id                          VARCHAR(100) NOT NULL,            -- FK constructor(id) add later
    position_display_order                  INT         NOT NULL,
    driver_number                           VARCHAR(3)  NOT NULL,
    race_points                             DECIMAL(8,2),                     
    race_pole_position                      BOOLEAN,
    race_qualification_position_number      INT,
    race_grid_position_number               INT,
    is_real                                 BOOLEAN       DEFAULT FALSE,
    created_at                              TIMESTAMP     NOT NULL DEFAULT NOW(), -- new

    FOREIGN KEY (constructor_id) REFERENCES constructor (id),                 -- bu tabloların dosyanın yukarısında tanımlanmış olması gerekiyor
    FOREIGN KEY (driver_id)      REFERENCES driver      (id),                 -- eğer sonra tanımlanırsa ALTER TABLE ile eklenmeli
    FOREIGN KEY (race_id)        REFERENCES race        (id)
); 

-- Useful indexes
CREATE INDEX rcda_race_id_idx                  ON race_data(race_id);
CREATE INDEX rcda_position_display_order_idx   ON race_data(position_display_order);
CREATE INDEX rcda_driver_id_idx                ON race_data(driver_id);
CREATE INDEX rcda_constructor_id_idx           ON race_data(constructor_id);
CREATE INDEX rcda_driver_number_idx            ON race_data(driver_number);