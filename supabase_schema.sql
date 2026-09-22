\set ON_ERROR_STOP on

-- TinyRide v3 schema entry point.
-- Run with: psql "$SUPABASE_DB_URL" --file supabase_schema.sql
-- The included test stub is intentionally excluded; Supabase provides auth.*.

\ir sql/00_extensions_helpers.sql
\ir sql/01_enums_lookups.sql
\ir sql/02_identity_family_school.sql
\ir sql/03_supply.sql
\ir sql/04_routes.sql
\ir sql/05_booking.sql
\ir sql/06_payments.sql
\ir sql/07_trips.sql
\ir sql/08_safety_ops.sql
\ir sql/09_comms_support_audit.sql
\ir sql/10_rls.sql
