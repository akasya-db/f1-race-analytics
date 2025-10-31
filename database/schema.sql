
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

