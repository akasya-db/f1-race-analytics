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
-- Driver (race_data FK'si için gerekli)
-- ============================================
CREATE TABLE driver (
    id           VARCHAR(100) PRIMARY KEY,
    country_id   VARCHAR(100) REFERENCES country(id),
    first_name   VARCHAR(100),
    last_name    VARCHAR(100),
    code         VARCHAR(3),
    number       VARCHAR(3),
    is_real      BOOLEAN DEFAULT TRUE
);

CREATE INDEX driver_country_id_idx ON driver(country_id);
CREATE INDEX driver_code_idx        ON driver(code);
CREATE INDEX driver_number_idx      ON driver(number);

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
    id                          INT PRIMARY KEY,
    year                        INT NOT NULL,
    round                       INT NOT NULL,
    date                        DATE NOT NULL,
    time                        TIME,                           -- varchar(5) yerine TIME
    grand_prix_id               VARCHAR(100) NOT NULL,
    official_name               VARCHAR(100) NOT NULL,
    qualifying_format           VARCHAR(20) NOT NULL,
    sprint_qualifying_format    VARCHAR(20),
    circuit_id                  VARCHAR(100) NOT NULL,
    circuit_type                VARCHAR(6) NOT NULL,
    direction                   VARCHAR(14) NOT NULL,
    course_length               DECIMAL(6,3) NOT NULL,
    turns                       INT NOT NULL,
    laps                        INT NOT NULL,
    distance                    DECIMAL(6,3) NOT NULL,
    scheduled_laps              INT,
    scheduled_distance          DECIMAL(6,3),
    drivers_championship_decider        BOOLEAN,
    constructors_championship_decider   BOOLEAN,
    pre_qualifying_date         DATE,
    pre_qualifying_time         TIME,          -- varchar(5) -> TIME
    free_practice_1_date        DATE,
    free_practice_1_time        TIME,
    free_practice_2_date        DATE,
    free_practice_2_time        TIME,
    free_practice_3_date        DATE,
    free_practice_3_time        TIME,
    free_practice_4_date        DATE,
    free_practice_4_time        TIME,
    qualifying_1_date           DATE,
    qualifying_1_time           TIME,
    qualifying_2_date           DATE,
    qualifying_2_time           TIME,
    qualifying_date             DATE,
    qualifying_time             TIME,
    sprint_qualifying_date      DATE,
    sprint_qualifying_time      TIME,
    sprint_race_date            DATE,
    sprint_race_time            TIME,
    warming_up_date             DATE,
    warming_up_time             TIME,

    UNIQUE (year, round),

    FOREIGN KEY (circuit_id) REFERENCES circuit (id)
    -- Aşağıdaki FK'ler ilgili tablolar tanımlandıktan sonra açılabilir:
    -- FOREIGN KEY (grand_prix_id) REFERENCES grand_prix (id),
    -- FOREIGN KEY (year)          REFERENCES season (year)
);

-- Yararlı indeksler
CREATE INDEX race_year_idx            ON race(year);
CREATE INDEX race_circuit_id_idx      ON race(circuit_id);
CREATE INDEX race_grand_prix_id_idx   ON race(grand_prix_id);

-- ============================================
-- RACE DATA (mevcut tablon - ufak düzenleme yok, sadece sıra)
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
-- RACE CONSTRUCTOR STANDING (senin eklediğin tablo)
-- ============================================
CREATE TABLE race_constructor_standing (
    race_id                 INT NOT NULL,
    position_display_order  INT NOT NULL,
    position_number         INT,
    position_text           VARCHAR(4) NOT NULL,
    constructor_id          VARCHAR(100) NOT NULL,
    engine_manufacturer_id  VARCHAR(100) NOT NULL,
    points                  DECIMAL(8,2) NOT NULL,
    positions_gained        INT,

    PRIMARY KEY (race_id, position_display_order),

    FOREIGN KEY (race_id)        REFERENCES race (id),
    FOREIGN KEY (constructor_id) REFERENCES constructor (id)
    -- FOREIGN KEY (engine_manufacturer_id) REFERENCES engine_manufacturer (id)
);

-- Yararlı indeksler
CREATE INDEX rcst_constructor_id_idx         ON race_constructor_standing(constructor_id);
CREATE INDEX rcst_engine_manufacturer_id_idx ON race_constructor_standing(engine_manufacturer_id);
CREATE INDEX rcst_position_number_idx        ON race_constructor_standing(position_number);
CREATE INDEX rcst_position_text_idx          ON race_constructor_standing(position_text);
