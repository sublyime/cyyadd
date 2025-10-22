DO $$
BEGIN
    -- Create sequence if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'plume_id_seq') THEN
        CREATE SEQUENCE plume_id_seq START WITH 1 INCREMENT BY 1;
    END IF;

    -- Create stations table if it doesn't exist (needs to be first for foreign key refs)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stations') THEN
        CREATE TABLE stations (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            lon DOUBLE PRECISION NOT NULL,
            lat DOUBLE PRECISION NOT NULL,
            provider VARCHAR(255)
        );
    END IF;

    -- Create chemicals table if it doesn't exist (needs to be before events)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chemicals') THEN
        CREATE TABLE chemicals (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            state VARCHAR(255),
            molecular_weight DOUBLE PRECISION,
            cas VARCHAR(255)
        );
    END IF;

    -- Create events table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
        CREATE TABLE events (
            id BIGSERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            time TIMESTAMP,
            amount DOUBLE PRECISION,
            heat DOUBLE PRECISION,
            lat DOUBLE PRECISION,
            lon DOUBLE PRECISION,
            terrain VARCHAR(255),
            type VARCHAR(255),
            chemical_id BIGINT,
            FOREIGN KEY (chemical_id) REFERENCES chemicals(id)
        );
    END IF;

    -- Create plume table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plume') THEN
        CREATE TABLE plume (
            id BIGINT PRIMARY KEY DEFAULT nextval('plume_id_seq'),
            time TIMESTAMP,
            time_obs TIMESTAMP,
            so2_error_ppb DOUBLE PRECISION,
            so2_flag DOUBLE PRECISION,
            so2_ppb DOUBLE PRECISION,
            wind_dir_deg DOUBLE PRECISION,
            wind_speed_ms DOUBLE PRECISION,
            wind_dir_error_deg DOUBLE PRECISION,
            wind_speed_error_ms DOUBLE PRECISION,
            species VARCHAR(255),
            so2_ppb_forecast DOUBLE PRECISION,
            time_forecast TIMESTAMP,
            station_id BIGINT,
            FOREIGN KEY (station_id) REFERENCES stations(id)
        );
    END IF;

    -- Create weather table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'weather') THEN
        CREATE TABLE weather (
            id BIGSERIAL PRIMARY KEY,
            time TIMESTAMP NOT NULL,
            humidity DOUBLE PRECISION,
            wind_speed DOUBLE PRECISION,
            wind_direction DOUBLE PRECISION,
            pressure DOUBLE PRECISION,
            temperature DOUBLE PRECISION,
            precipitation DOUBLE PRECISION,
            station_id BIGINT,
            FOREIGN KEY (station_id) REFERENCES stations(id)
        );
    END IF;
END $$;
