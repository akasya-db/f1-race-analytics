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
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS constructor CASCADE;
DROP TABLE IF EXISTS driver CASCADE;
DROP TABLE IF EXISTS circuit CASCADE;
DROP TABLE IF EXISTS country CASCADE;

-- ============================================
-- Core dictionaries
-- ============================================

-- Country dictionary (lookup)
CREATE TABLE country (
    id            VARCHAR(100)  PRIMARY KEY,
    alpha3_code   VARCHAR(3)    NOT NULL UNIQUE,
    name          VARCHAR(100)  NOT NULL
);

-- Uyarı: "user" SQL'de anahtar kelime olabilir. Bu yüzden tablo adı tırnaklı.
CREATE TABLE "user" (
    id            VARCHAR(100) PRIMARY KEY,
    country_id    VARCHAR(100) REFERENCES country(id),
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    date_joined   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX user_country_id_idx ON "user"(country_id);

-- Circuits
CREATE TABLE circuit (
  id                VARCHAR(100)  NOT NULL,
  name              VARCHAR(100)  NOT NULL,
  full_name         VARCHAR(100)  NOT NULL,
  previous_names    VARCHAR(255),
  type              VARCHAR(6)    NOT NULL,
  direction         VARCHAR(14)   NOT NULL,
  place_name        VARCHAR(100)  NOT NULL,
  country_id        VARCHAR(100)  NOT NULL,
  latitude          DECIMAL(10,6) NOT NULL,
  longitude         DECIMAL(10,6) NOT NULL,
  length            DECIMAL(6,3)  NOT NULL,
  turns             INT           NOT NULL,
  total_races_held  INT           NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (country_id) REFERENCES country (id)
);

CREATE INDEX circuit_country_id_idx ON circuit(country_id);
CREATE INDEX circuit_place_name_idx ON circuit(place_name);

-- ============================================
-- Constructor/Team information
-- ============================================
CREATE TABLE constructor (
    id                           VARCHAR(100)  NOT NULL,
    country_id                   VARCHAR(100)  NOT NULL,
    name                         VARCHAR(100)  NOT NULL,
    full_name                    VARCHAR(100)  NOT NULL,
    best_championship_position   INTEGER,
    total_championship_wins      INTEGER       NOT NULL,
    total_race_starts            INTEGER       NOT NULL,
    total_podiums                INTEGER       NOT NULL,
    total_points                 DECIMAL(8,2)  NOT NULL,
    total_pole_positions         INTEGER       NOT NULL,
    is_real                      BOOLEAN       DEFAULT TRUE,
    PRIMARY KEY (id),
    FOREIGN KEY (country_id) REFERENCES country(id)
);

CREATE INDEX constructor_country_id_idx ON constructor(country_id);

-- ============================================
-- RACE  
-- ============================================
CREATE TABLE race (
    id                   INT PRIMARY KEY,
    circuit_id           VARCHAR(100) NOT NULL REFERENCES circuit(id),

    -- Non-key (iş ihtiyaçlarına göre minimal set)
    year                 INT          NOT NULL,
    round                INT          NOT NULL,
    date                 DATE         NOT NULL,
    official_name        VARCHAR(100) NOT NULL,
    qualifying_format    VARCHAR(20)  NOT NULL,
    laps                 INT          NOT NULL,
    qualifying_date      DATE,
    is_real              BOOLEAN      DEFAULT TRUE,

    
    UNIQUE (year, round) -- Yarış sezonu boyunca tekil tur (round) için pratik kısıt
);
-- Yararlı indeksler
CREATE INDEX race_year_idx       ON race(year);
CREATE INDEX race_circuit_id_idx ON race(circuit_id);

-- ============================================
-- RACE DATA
-- ============================================
CREATE TABLE race_data (
    id                                      BIGSERIAL    PRIMARY KEY,
    race_id                                 INT          NOT NULL,             -- FK race(id)
    driver_id                               VARCHAR(100) NOT NULL,             -- FK driver(id)
    constructor_id                          VARCHAR(100) NOT NULL,             -- FK constructor(id)
    position_display_order                  INT          NOT NULL,
    driver_number                           VARCHAR(3)   NOT NULL,
    race_points                             DECIMAL(8,2),
    race_pole_position                      BOOLEAN,
    race_qualification_position_number      INT,
    race_grid_position_number               INT,
    is_real                                 BOOLEAN      DEFAULT FALSE,
    created_at                              TIMESTAMP    NOT NULL DEFAULT NOW(),
    FOREIGN KEY (constructor_id) REFERENCES constructor (id),
    FOREIGN KEY (driver_id)      REFERENCES driver      (id),
    FOREIGN KEY (race_id)        REFERENCES race        (id)
);

-- Useful indexes
CREATE INDEX rcda_race_id_idx                ON race_data(race_id);
CREATE INDEX rcda_position_display_order_idx ON race_data(position_display_order);
CREATE INDEX rcda_driver_id_idx              ON race_data(driver_id);
CREATE INDEX rcda_constructor_id_idx         ON race_data(constructor_id);
CREATE INDEX rcda_driver_number_idx          ON race_data(driver_number);

-- ============================================
-- RACE CONSTRUCTOR STANDING 
-- ============================================
CREATE TABLE race_constructor_standing (
    race_id            INT          NOT NULL REFERENCES race(id),
    constructor_id     VARCHAR(100) NOT NULL REFERENCES constructor(id),

    -- Non-key
    position_number    INT,
    points             DECIMAL(8,2) NOT NULL,

    -- Composite PK as requested
    PRIMARY KEY (race_id, constructor_id)
);
-- İhtiyaca göre sorgular:
CREATE INDEX rcst_position_number_idx ON race_constructor_standing(position_number)
