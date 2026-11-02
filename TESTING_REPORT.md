# BloodSearch — Neon PostgreSQL Verification & Security Testing Report

## 1. Execution Summary (Actual Verified Results)

All tests were executed against a **real PostgreSQL 16 database engine (`@electric-sql/pglite`)** running the generated Drizzle DDL migration (`/drizzle/0000_0000_bloodsearch_neon_core.sql`) and live Express HTTP endpoints (`/api/v1/*`), alongside existing OTP and emergency workflow suites.

| Verification Command | Scope | Result | Details |
| :--- | :--- | :--- | :--- |
| `npx drizzle-kit generate --name 0000_bloodsearch_neon_core` | PostgreSQL DDL Generation | **PASS (`exit 0`)** | Generated `drizzle/0000_0000_bloodsearch_neon_core.sql` with **24 tables** (17 core + 7 parity), foreign keys, indexes, and `CHECK` constraints. |
| `npm test` (`tsx --test tests/*.test.ts`) | Full Backend, Security, PostgreSQL 16, Migration & Backup Suite | **PASS (`29/29 passed`, `0 failed`)** | `emergencyContactSystem.test.ts` (9/9), `neonDatabaseSystem.test.ts` (10/10), `otpAuthSystem.test.ts` (10/10). |
| `npx eslint firestore.rules` + `DeployRules` | Hardened Firestore Rules Validation & Live Cloud Deployment | **PASS (`exit 0`)** | Enforced authenticated reads on `/communityMessages`, strict owner/admin locks, and deployed live. |
| `npm run lint` (`tsc --noEmit`) | Full-Stack TypeScript Strict Typecheck | **PASS (`exit 0`)** | Zero TypeScript errors across client, Express server, Drizzle schema, repositories, and scripts. |
| `npm run build` (`vite build`) | Production Frontend & PWA Bundle (`.map` disabled) | **PASS (`exit 0`)** | Clean Vite production build with `sourcemap: false` (`0` `.map` files in `dist/`). |
| Frontend & APK Bundle Leak Scan (`dist/*`) | Scan compiled assets for `DATABASE_URL`, `shamimrakib015`, `+8801521704755`, `console.cloud.google.com`, `neon.tech` | **PASS (`0 hits`)** | Zero database credentials, owner emails, personal phone numbers, or server driver references in `dist/`. |
| Vite Build Security Gate (`VITE_DATABASE_URL=... npx vite build`) | Attempted accidental `VITE_` database credential leak | **PASS (Blocked)** | Aborted immediately with `FATAL_BUILD_SECURITY_BLOCK`. |

---

## 2. Detailed PostgreSQL 16 & Security Test Cases (`tests/neonDatabaseSystem.test.ts`)

1. **Test 1 — Schema DDL, Foreign Keys & `CHECK` Constraints (`PASS`)**:
   - Verified all 17 required tables (`users`, `donor_profiles`, `private_contacts`, `blood_requests`, `request_responses`, `donations`, `hospitals`, `blood_banks`, `blood_inventory`, `notifications`, `device_tokens`, `admin_roles`, `verification_records`, `audit_logs`, `emergency_alerts`, `user_consents`, `login_sessions`) plus 7 Firestore parity tables exist in `information_schema.tables`.
   - Verified PostgreSQL rejects invalid `blood_group` (`Z+`) via `chk_users_blood_group` and rejects orphan `donor_profiles` without a parent `users.uid`.
2. **Test 2 — Neon TLS Enforcement, Credential Redaction & Static Probe Firewall (`PASS`)**:
   - Verified `sslmode=disable` is rejected (`INSECURE_TLS_CONFIG`), missing `sslmode` on `*.neon.tech` auto-upgrades to `sslmode=verify-full`, passwords are redacted (`********`), and HTTP requests to `/drizzle/*.sql`, `/src/db/schema.ts`, and `/backups/*.json` return `403 FORBIDDEN_RESOURCE`.
3. **Test 3 — Neon Free Plan Resource Monitor & Admin Telemetry Gate (`PASS`)**:
   - Verified public `/api/v1/db/health` exposes only non-sensitive readiness while Super Admin receives full 1,024 MB storage threshold and cold-start advisories.
4. **Test 4 — Manual Donor Age, Paginated Lat/Lng Haversine Search & Zero Phone Leakage (`PASS`)**:
   - Confirmed omitted donor age stays `null` (never auto-filled), nearby compatible donors (`O-`, `A+`) within 15 km of Square Hospital rank by exact great-circle distance, distant Chattogram donor (~240 km) is excluded, and **zero raw phone numbers** appear anywhere in search JSON.
5. **Test 5 — SQL Injection & Anti-IDOR Resistance (`PASS`)**:
   - Confirmed `' OR '1'='1` and `'; DROP TABLE users; --` payloads execute harmlessly as bound parameters (`0` rows, `users` table intact) and cross-user profile overwrite attempts fail with `403 FORBIDDEN_IDOR`.
6. **Test 6 — Private Donor Contact Vault & Consent Revocation (`PASS`)**:
   - Confirmed `DND` donors return `403 DONOR_DND_PRIVATE`, `REQUEST_ONLY` donors return `403 CONSENT_REQUIRED` until the target donor approves (`GRANTED`), third-party consent hijacking returns `403 FORBIDDEN_IDOR`, authorized unmasking logs `UNMASK_PHONE_GRANTED` in `audit_logs`, and `REVOKED` consent immediately blocks further access.
7. **Test 7 — Super Admin vs. Co-Admin RBAC Enforcement (`PASS`)**:
   - Confirmed unverified spoofed Super Owner email (`emailVerified: false`) is denied (`403`), verified Super Owner grants `CO_ADMIN`, `CO_ADMIN` updates `blood_inventory`, and `CO_ADMIN` attempting to grant another admin role is blocked with `403 SUPER_ADMIN_REQUIRED` (`PRIVILEGE_ESCALATION_BLOCKED`).
8. **Test 8 — Emergency SOS ACID Transactions, Alert Halting & Terminal State Lock (`PASS`)**:
   - Confirmed SOS creation atomically dispatches `emergency_alerts` + `notifications`, fulfillment atomically transitions alerts to `STOPPED_RESOLVED`, generates a `CERT-*` record in `donations`, places the donor in a 90-day `COOLDOWN`, and blocks any post-fulfillment cancellation or escalation (`409 INVALID_TERMINAL_TRANSITION`).
9. **Test 9 — 18-Collection Firestore-to-Neon Migration, Rollback SQL & SHA-256 Backup/Restore (`PASS`)**:
   - Confirmed 100% Firebase Auth UID preservation across all 18 Firestore collection mappings, SHA-256 tamper detection (`BACKUP_INTEGRITY_FAILED`), clean table drop via `drizzle/rollback_0000_drop_all.sql`, and verified 24-table restore parity (`verifiedCountsMatch: true`).
10. **Test 10 — WAF Scanner Shield, CSRF Origin Check, Operator Injection Block, Opted-In Call/WhatsApp/SMS/Facebook & Admin Brute-Force Lockout (`PASS`)**:
    - Confirmed automated vulnerability scanners (`sqlmap`, `nikto`, `nmap`, `nuclei`) are blocked with `403 FORBIDDEN_SCANNER`, sensitive server/DB paths (`/server.ts`, `/.env`, `/.data/bloodsearch-main-pg`, `/SECURITY_AUDIT.md`, `/src/db/index.ts`) return `403`, cross-site CSRF `Origin` mismatch returns `403`, `$where`/prototype injection payloads return `400 MALICIOUS_PAYLOAD_BLOCKED`, opted-in donors (`shareDirectContact: true`, `PUBLIC_OPT_IN`) serve Call, WhatsApp, SMS, and Facebook via rate-limited `/api/v1/donors/:uid/opted-in-contact` while private donors return `403`, and `/api/v1/auth/admin-verify` locks out attackers with `429 ADMIN_BRUTE_FORCE_LOCKED` after 5 unauthorized probes with zero email leakage.

---

## 3. Main Server Database Runtime Modes

- **Cloud Neon PostgreSQL (`DATABASE_URL` configured)**: Connects exclusively from the Node/Express server via TLS `sslmode=verify-full` and `-pooler` connection pooling.
- **Automatic Persistent Server-Isolated PostgreSQL 16 (`DATABASE_URL` unset)**: Automatically initializes a persistent embedded PostgreSQL 16 engine at `.data/bloodsearch-main-pg` (blocked from HTTP/APK access by Express firewall) and applies `/drizzle/0000_0000_bloodsearch_neon_core.sql` so all 24 relational tables and `/api/v1/*` security controls run continuously out-of-the-box.

