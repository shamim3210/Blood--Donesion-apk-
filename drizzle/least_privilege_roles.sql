-- ============================================================================
-- BLOODSEARCH NEON POSTGRESQL — LEAST-PRIVILEGE ROLE SEPARATION
-- ============================================================================
-- Because Neon Free Plan does not include IP Allowlisting or AWS PrivateLink
-- (those network controls require the Neon Scale plan), BloodSearch enforces
-- strict database-level least privilege in addition to TLS `sslmode=verify-full`
-- and Express backend-only access:
--
--   1. `neondb_owner` / `bloodsearch_migrator` -> Used ONLY in DIRECT_DATABASE_URL
--      during controlled schema migrations (`npm run db:migrate`).
--   2. `bloodsearch_app` -> Used in Express runtime `DATABASE_URL` (`-pooler`).
--      Has NO SUPERUSER, NO CREATEDB, NO CREATEROLE, NO DROP/ALTER DDL privileges,
--      and CANNOT DELETE from `audit_logs`.
--
-- ReplaceSTRONG_RANDOM_PASSWORD_HERE before executing in Neon SQL Editor:
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'bloodsearch_app') THEN
    CREATE ROLE bloodsearch_app WITH LOGIN PASSWORD 'REPLACE_WITH_32_BYTE_RANDOM_SECRET' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE neondb TO bloodsearch_app;
GRANT USAGE ON SCHEMA public TO bloodsearch_app;

-- Grant standard CRUD on operational tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bloodsearch_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bloodsearch_app;

-- IMMUTABLE AUDIT TRAIL HARDENING:
-- Revoke UPDATE and DELETE on `audit_logs` from the runtime app role so even a compromised
-- application process cannot erase or tamper with historical security audit logs.
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.audit_logs FROM bloodsearch_app;
GRANT SELECT, INSERT ON TABLE public.audit_logs TO bloodsearch_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bloodsearch_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO bloodsearch_app;
