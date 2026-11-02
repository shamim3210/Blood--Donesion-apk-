-- ============================================================================
-- BLOODSEARCH NEON POSTGRESQL — CONTROLLED ROLLBACK SCRIPT (0000)
-- ============================================================================
-- PURPOSE:
--   Reverses migration 0000_0000_bloodsearch_neon_core.sql in dependency-safe
--   child-to-parent order inside an atomic transaction.
--
-- SAFETY RULE:
--   Run ONLY after taking a Neon branch snapshot or logical backup via
--   `npm run db:backup` and while DB_CUTOVER_MODE="FIRESTORE_PRIMARY".
--   Firestore collections remain untouched as the fallback source of truth.
-- ============================================================================

BEGIN;

DROP TABLE IF EXISTS "direct_chat_messages" CASCADE;
DROP TABLE IF EXISTS "direct_chat_rooms" CASCADE;
DROP TABLE IF EXISTS "community_messages" CASCADE;
DROP TABLE IF EXISTS "gratitude_notes" CASCADE;
DROP TABLE IF EXISTS "scam_reports" CASCADE;
DROP TABLE IF EXISTS "announcements" CASCADE;
DROP TABLE IF EXISTS "live_donor_trips" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "login_sessions" CASCADE;
DROP TABLE IF EXISTS "user_consents" CASCADE;
DROP TABLE IF EXISTS "verification_records" CASCADE;
DROP TABLE IF EXISTS "admin_roles" CASCADE;
DROP TABLE IF EXISTS "device_tokens" CASCADE;
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "emergency_alerts" CASCADE;
DROP TABLE IF EXISTS "donations" CASCADE;
DROP TABLE IF EXISTS "request_responses" CASCADE;
DROP TABLE IF EXISTS "blood_requests" CASCADE;
DROP TABLE IF EXISTS "blood_inventory" CASCADE;
DROP TABLE IF EXISTS "blood_banks" CASCADE;
DROP TABLE IF EXISTS "hospitals" CASCADE;
DROP TABLE IF EXISTS "private_contacts" CASCADE;
DROP TABLE IF EXISTS "donor_profiles" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

COMMIT;
