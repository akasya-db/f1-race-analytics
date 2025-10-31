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
-- DRIVER 
-- ============================================
CREATE TABLE driver (
    id                              VARCHAR(100) PRIMARY KEY,

    -- biographical information
    name                            VARCHAR(100) NOT NULL,
    first_name                      VARCHAR(100),
    last_name                       VARCHAR(100),
    full_name                       VARCHAR(100) NOT NULL,
    abbreviation                    VARCHAR(10),
    permanent_number                INT,
    gender                          VARCHAR(20),
    date_of_birth                   DATE,
    date_of_death                   DATE,
    place_of_birth                  VARCHAR(100),

    -- nationality / origin information
    country_of_birth_country_id     VARCHAR(100) NOT NULL,
    nationality_country_id          VARCHAR(100) NOT NULL,

    -- best career results
    best_championship_position      INT,
    best_race_result                INT,

    -- aggregated career stats
    total_championship_wins         INT          NOT NULL,
    total_race_starts               INT          NOT NULL,
    total_race_wins                 INT          NOT NULL,
    total_race_laps                 INT          NOT NULL,
    total_podiums                   INT          NOT NULL,
    total_points                    DECIMAL(8,2) NOT NULL,
    total_pole_positions            INT          NOT NULL,

    -- whether this is a real driver or simulation data
    is_real                         BOOLEAN      DEFAULT TRUE,

    -- foreign keys
    FOREIGN KEY (country_of_birth_country_id) REFERENCES country(id),
    FOREIGN KEY (nationality_country_id)      REFERENCES country(id)
);

-- helpful indexes for common lookups and filtering
CREATE INDEX drv_nationality_idx          ON driver(nationality_country_id);
CREATE INDEX drv_country_of_birth_idx     ON driver(country_of_birth_country_id);
CREATE INDEX drv_permanent_number_idx     ON driver(permanent_number);


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
-- RACE DRIVER STANDING
-- ============================================
CREATE TABLE race_driver_standing (
    race_id             INT          NOT NULL,          -- FK to race(id)
    driver_id           VARCHAR(100) NOT NULL,          -- FK to driver(id)

    position_number     INT          NOT NULL,          
    points              DECIMAL(8,2) NOT NULL,          

    PRIMARY KEY (race_id, driver_id),

    FOREIGN KEY (race_id)   REFERENCES race(id),
    FOREIGN KEY (driver_id) REFERENCES driver(id)
);

-- index to quickly get the full standings for a given race
CREATE INDEX rds_race_id_idx ON race_driver_standing(race_id);

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
