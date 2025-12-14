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

-- Countries
CREATE TABLE country (
    id            VARCHAR(100)  PRIMARY KEY,
    alpha3_code   VARCHAR(3)    NOT NULL UNIQUE,
    name          VARCHAR(100)  NOT NULL
);



-- User accounts
CREATE TABLE "user" (
    id            VARCHAR(100) PRIMARY KEY,
    country_id    VARCHAR(100) REFERENCES country(id),
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    date_joined   TIMESTAMP    NOT NULL DEFAULT NOW(),
    is_admin      BOOLEAN      NOT NULL DEFAULT FALSE
);

CREATE INDEX user_username_idx ON "user"(username);
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

CREATE INDEX circuit_name_idx ON circuit(name);
CREATE INDEX circuit_country_id_idx ON circuit(country_id);


-- Constructor/Teams
CREATE TABLE constructor (
    id                           VARCHAR(100)  NOT NULL,
    user_id                      VARCHAR(100)  DEFAULT NULL,
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
    FOREIGN KEY (country_id) REFERENCES country(id),
    FOREIGN KEY (user_id)    REFERENCES "user"(id)
);

CREATE INDEX constructor_name_idx ON constructor(name);
CREATE INDEX constructor_country_id_idx ON constructor(country_id);
-- CREATE INDEX constructor_is_real_idx ON constructor(is_real);

-- Drivers 
CREATE TABLE driver (
    id                              VARCHAR(100) PRIMARY KEY,
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
    country_of_birth_country_id     VARCHAR(100) NOT NULL,
    nationality_country_id          VARCHAR(100) NOT NULL,
    best_championship_position      INT,
    best_race_result                INT,
    total_championship_wins         INT          NOT NULL,
    total_race_starts               INT          NOT NULL,
    total_race_wins                 INT          NOT NULL,
    total_race_laps                 INT          NOT NULL,
    total_podiums                   INT          NOT NULL,
    total_points                    DECIMAL(8,2) NOT NULL,
    total_pole_positions            INT          NOT NULL,
    is_real                         BOOLEAN      DEFAULT TRUE,

    FOREIGN KEY (country_of_birth_country_id) REFERENCES country(id),
    FOREIGN KEY (nationality_country_id)      REFERENCES country(id)
);

CREATE INDEX driver_name_idx ON driver(full_name);
CREATE INDEX driver_abbreviation_idx ON driver(abbreviation);
CREATE INDEX drv_nationality_idx          ON driver(nationality_country_id);
CREATE INDEX drv_country_of_birth_idx     ON driver(country_of_birth_country_id);


-- Races  
CREATE TABLE race (
    id                   INT PRIMARY KEY,
    circuit_id           VARCHAR(100) NOT NULL REFERENCES circuit(id),
    year                 INT          NOT NULL,
    round                INT          NOT NULL,
    date                 DATE         NOT NULL,
    official_name        VARCHAR(100) NOT NULL,
    qualifying_format    VARCHAR(20)  NOT NULL,
    laps                 INT          NOT NULL,
    qualifying_date      DATE,
    is_real              BOOLEAN      DEFAULT TRUE,
    user_id              VARCHAR(100)  DEFAULT NULL,

    FOREIGN KEY (user_id)    REFERENCES "user"(id),
    UNIQUE (year, round)
);

CREATE INDEX race_year_idx       ON race(year);
CREATE INDEX race_circuit_id_idx ON race(circuit_id);
-- CREATE INDEX race_official_name_idx ON race(official_name);


-- Race data
CREATE TABLE race_data (
    id                                      BIGSERIAL    PRIMARY KEY,
    race_id                                 INT          NOT NULL,             -- FK race(id)
    driver_id                               VARCHAR(100) NOT NULL,             -- FK driver(id)
    constructor_id                          VARCHAR(100) NOT NULL,             -- FK constructor(id)
    user_id                                 VARCHAR(100) DEFAULT NULL,         -- FK user(id)
    position_display_order                  INT          NOT NULL,
    driver_number                           VARCHAR(3)   NOT NULL,
    race_points                             DECIMAL(8,2),
    race_pole_position                      BOOLEAN,
    race_qualification_position_number      INT,
    race_grid_position_number               INT,
    is_real                                 BOOLEAN      DEFAULT FALSE,
    created_at                              TIMESTAMP    NOT NULL DEFAULT NOW(),

    FOREIGN KEY (user_id)        REFERENCES "user"(id),
    FOREIGN KEY (constructor_id) REFERENCES constructor (id),
    FOREIGN KEY (driver_id)      REFERENCES driver      (id),
    FOREIGN KEY (race_id)        REFERENCES race        (id)
);


CREATE INDEX rcda_race_id_idx                ON race_data(race_id);
CREATE INDEX rcda_position_display_order_idx ON race_data(position_display_order);
CREATE INDEX rcda_driver_id_idx              ON race_data(driver_id);
CREATE INDEX rcda_constructor_id_idx         ON race_data(constructor_id);


-- Race driver standings
CREATE TABLE race_driver_standing (
    race_id             INT          NOT NULL,          
    driver_id           VARCHAR(100) NOT NULL,         

    position_number     INT          NOT NULL,          
    points              DECIMAL(8,2) NOT NULL,          

    PRIMARY KEY (race_id, driver_id),

    FOREIGN KEY (race_id)   REFERENCES race(id),
    FOREIGN KEY (driver_id) REFERENCES driver(id)
);

CREATE INDEX rds_race_id_idx ON race_driver_standing(race_id);
CREATE INDEX rds_driver_id_idx ON race_driver_standing(driver_id);

-- Race constructor standings
CREATE TABLE race_constructor_standing (
    race_id            INT          NOT NULL REFERENCES race(id),
    constructor_id     VARCHAR(100) NOT NULL REFERENCES constructor(id),
    position_number    INT,
    points             DECIMAL(8,2) NOT NULL,

    PRIMARY KEY (race_id, constructor_id)
);

CREATE INDEX rcst_race_id_idx ON race_constructor_standing(race_id);
