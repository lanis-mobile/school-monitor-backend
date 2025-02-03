import postgres from 'postgres';
import {config} from "../config";

const sql = postgres({
  ...config.pgDB,
  ssl: 'prefer',
});

sql`
    CREATE TABLE IF NOT EXISTS accounts
    (
        id
        SERIAL
        UNIQUE
        PRIMARY
        KEY,
        github_username
        VARCHAR
    (
        255
    ) UNIQUE,
        admin BOOLEAN DEFAULT FALSE,
        totp_secret TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    CREATE TYPE platform AS ENUM ('android', 'iOS', 'unspecified');
    CREATE TABLE IF NOT EXISTS sph_logins
    (
        id SERIAL UNIQUE PRIMARY KEY,
        school_id INT,
        app_version_code SMALLINT,
        app_platform platform DEFAULT 'unspecified',
        time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE
    OR REPLACE FUNCTION delete_old_rows() RETURNS void AS
$$
    BEGIN
    DELETE
    FROM sph_logins
    WHERE time < NOW() - INTERVAL '3 months';
    END;
$$
    LANGUAGE plpgsql;
`;

export default sql;