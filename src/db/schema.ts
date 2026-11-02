import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * BLOODSEARCH — NEON POSTGRESQL PRIMARY APPLICATION SCHEMA (Drizzle ORM)
 *
 * Implements all 17 mandatory core operational tables:
 *   1. users
 *   2. donor_profiles
 *   3. private_contacts
 *   4. blood_requests
 *   5. request_responses
 *   6. donations
 *   7. hospitals
 *   8. blood_banks
 *   9. blood_inventory
 *  10. notifications
 *  11. device_tokens
 *  12. admin_roles
 *  13. verification_records
 *  14. audit_logs
 *  15. emergency_alerts
 *  16. user_consents
 *  17. login_sessions
 *
 * Plus 7 lossless Firestore parity tables so all 18 legacy Firestore collections
 * migrate cleanly with zero data loss and preserved Firebase Authentication UIDs:
 *  18. live_donor_trips
 *  19. community_messages
 *  20. direct_chat_rooms
 *  21. direct_chat_messages
 *  22. announcements
 *  23. scam_reports
 *  24. gratitude_notes
 */

// ============================================================================
// 1. USERS (Preserves Firebase Authentication UID as Primary Key)
// ============================================================================
export const users = pgTable(
  'users',
  {
    uid: varchar('uid', { length: 128 }).primaryKey(), // Exact Firebase Auth UID
    email: varchar('email', { length: 255 }),
    emailVerified: boolean('email_verified').notNull().default(false),
    displayName: varchar('display_name', { length: 140 }).notNull(),
    photoUrl: text('photo_url'),
    bloodGroup: varchar('blood_group', { length: 5 }),
    district: varchar('district', { length: 80 }),
    area: varchar('area', { length: 160 }),
    accountStatus: varchar('account_status', { length: 24 }).notNull().default('ACTIVE'), // ACTIVE | SUSPENDED | DELETED
    authProvider: varchar('auth_provider', { length: 40 }).notNull().default('firebase'),
    preferredLanguage: varchar('preferred_language', { length: 8 }).notNull().default('bn'),
    familyCircleJson: jsonb('family_circle_json').$type<unknown[]>().default(sql`'[]'::jsonb`),
    legacyFirestoreSyncedAt: timestamp('legacy_firestore_synced_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_users_email_lower').on(table.email),
    index('idx_users_district_status').on(table.district, table.accountStatus),
    check(
      'chk_users_blood_group',
      sql`${table.bloodGroup} IS NULL OR ${table.bloodGroup} IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`
    ),
    check('chk_users_account_status', sql`${table.accountStatus} IN ('ACTIVE', 'SUSPENDED', 'DELETED')`),
  ]
);

// ============================================================================
// 2. DONOR_PROFILES (Public-safe searchable donor directory — ZERO phone numbers)
// ============================================================================
export const donorProfiles = pgTable(
  'donor_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userUid: varchar('user_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    legacyDonorDocId: varchar('legacy_donor_doc_id', { length: 128 }),
    donorSmartId: varchar('donor_smart_id', { length: 40 }).notNull(),
    publicName: varchar('public_name', { length: 140 }).notNull(),
    bloodGroup: varchar('blood_group', { length: 5 }).notNull(),
    age: integer('age'), // Strictly manual user-entered (18..65), never auto-filled
    gender: varchar('gender', { length: 20 }), // MALE | FEMALE | OTHER
    weightKg: integer('weight_kg'),
    district: varchar('district', { length: 80 }).notNull(),
    upazila: varchar('upazila', { length: 100 }),
    area: varchar('area', { length: 180 }).notNull(),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    availabilityStatus: varchar('availability_status', { length: 24 }).notNull().default('AVAILABLE'), // AVAILABLE | BUSY | OFFLINE | COOLDOWN
    isAvailable: boolean('is_available').notNull().default(true),
    lastDonationDate: timestamp('last_donation_date', { withTimezone: true }),
    nextEligibleDate: timestamp('next_eligible_date', { withTimezone: true }),
    totalDonations: integer('total_donations').notNull().default(0),
    isVerified: boolean('is_verified').notNull().default(false),
    medicalDeclarationAccepted: boolean('medical_declaration_accepted').notNull().default(false),
    shareDirectContact: boolean('share_direct_contact').notNull().default(false),
    contactPreference: varchar('contact_preference', { length: 24 }).notNull().default('IN_APP_ONLY'), // CALL_ALLOWED | WHATSAPP_ONLY | IN_APP_ONLY | DND
    maskedPhoneHint: varchar('masked_phone_hint', { length: 32 }), // e.g., "+88017****89" (never raw phone)
    rating: doublePrecision('rating').notNull().default(5.0),
    responseRatePercent: integer('response_rate_percent').notNull().default(100),
    avgResponseMinutes: integer('avg_response_minutes').notNull().default(10),
    bio: text('bio'),
    lastAvailabilityConfirmedAt: timestamp('last_availability_confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_donor_profiles_user_uid').on(table.userUid),
    uniqueIndex('uq_donor_profiles_smart_id').on(table.donorSmartId),
    index('idx_donor_search_bg_dist_avail').on(table.bloodGroup, table.district, table.isAvailable),
    index('idx_donor_geo_lat_lng').on(table.latitude, table.longitude),
    index('idx_donor_verified_donations').on(table.isVerified, table.totalDonations),
    check(
      'chk_donor_blood_group',
      sql`${table.bloodGroup} IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`
    ),
    check('chk_donor_age_range', sql`${table.age} IS NULL OR (${table.age} >= 18 AND ${table.age} <= 65)`),
    check(
      'chk_donor_lat_range',
      sql`${table.latitude} IS NULL OR (${table.latitude} >= -90 AND ${table.latitude} <= 90)`
    ),
    check(
      'chk_donor_lng_range',
      sql`${table.longitude} IS NULL OR (${table.longitude} >= -180 AND ${table.longitude} <= 180)`
    ),
    check(
      'chk_donor_availability_status',
      sql`${table.availabilityStatus} IN ('AVAILABLE', 'BUSY', 'OFFLINE', 'COOLDOWN')`
    ),
    check(
      'chk_donor_contact_preference',
      sql`${table.contactPreference} IN ('CALL_ALLOWED', 'WHATSAPP_ONLY', 'IN_APP_ONLY', 'DND')`
    ),
    check('chk_donor_total_donations', sql`${table.totalDonations} >= 0`),
  ]
);

// ============================================================================
// 3. PRIVATE_CONTACTS (Isolated donor PII vault — NEVER joined in public searches)
// ============================================================================
export const privateContacts = pgTable(
  'private_contacts',
  {
    userUid: varchar('user_uid', { length: 128 })
      .primaryKey()
      .references(() => users.uid, { onDelete: 'cascade' }),
    phoneE164: varchar('phone_e164', { length: 24 }).notNull(),
    whatsappNumber: varchar('whatsapp_number', { length: 24 }),
    alternatePhone: varchar('alternate_phone', { length: 24 }),
    facebookProfileUrl: text('facebook_profile_url'),
    emergencyContactName: varchar('emergency_contact_name', { length: 140 }),
    emergencyContactPhone: varchar('emergency_contact_phone', { length: 24 }),
    exactStreetAddress: text('exact_street_address'),
    phoneVerified: boolean('phone_verified').notNull().default(false),
    contactVisibility: varchar('contact_visibility', { length: 28 }).notNull().default('REQUEST_ONLY'), // PUBLIC_OPT_IN | REQUEST_ONLY | EMERGENCY_VERIFIED_ONLY | DND_PRIVATE
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_private_contacts_visibility').on(table.contactVisibility),
    check(
      'chk_private_contact_visibility',
      sql`${table.contactVisibility} IN ('PUBLIC_OPT_IN', 'REQUEST_ONLY', 'EMERGENCY_VERIFIED_ONLY', 'DND_PRIVATE')`
    ),
  ]
);

// ============================================================================
// 4. HOSPITALS (Verified 64-district Bangladesh hospitals & trauma centers)
// ============================================================================
export const hospitals = pgTable(
  'hospitals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 140 }).notNull(),
    nameEn: varchar('name_en', { length: 200 }).notNull(),
    nameBn: varchar('name_bn', { length: 200 }),
    district: varchar('district', { length: 80 }).notNull(),
    upazila: varchar('upazila', { length: 100 }),
    address: text('address').notNull(),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    emergencyPhone: varchar('emergency_phone', { length: 32 }),
    bloodBankPhone: varchar('blood_bank_phone', { length: 32 }),
    hospitalType: varchar('hospital_type', { length: 32 }).notNull().default('GOVERNMENT'), // GOVERNMENT | PRIVATE | MEDICAL_COLLEGE | SPECIALIZED
    hasBloodBank: boolean('has_blood_bank').notNull().default(true),
    isVerified: boolean('is_verified').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_hospitals_slug').on(table.slug),
    index('idx_hospitals_district').on(table.district, table.isVerified),
    index('idx_hospitals_geo').on(table.latitude, table.longitude),
    check(
      'chk_hospitals_type',
      sql`${table.hospitalType} IN ('GOVERNMENT', 'PRIVATE', 'MEDICAL_COLLEGE', 'SPECIALIZED', 'NON_PROFIT')`
    ),
  ]
);

// ============================================================================
// 5. BLOOD_BANKS (Licensed blood banks & transfusion centers)
// ============================================================================
export const bloodBanks = pgTable(
  'blood_banks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: varchar('code', { length: 64 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    hospitalId: uuid('hospital_id').references(() => hospitals.id, { onDelete: 'set null' }),
    district: varchar('district', { length: 80 }).notNull(),
    address: text('address').notNull(),
    contactPhone: varchar('contact_phone', { length: 32 }).notNull(),
    licenseNumber: varchar('license_number', { length: 80 }),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    is24Hours: boolean('is_24_hours').notNull().default(true),
    isVerified: boolean('is_verified').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_blood_banks_code').on(table.code),
    index('idx_blood_banks_district').on(table.district, table.isVerified),
  ]
);

// ============================================================================
// 6. BLOOD_INVENTORY (Per-bank, per-blood-group stock tracking)
// ============================================================================
export const bloodInventory = pgTable(
  'blood_inventory',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bloodBankId: uuid('blood_bank_id')
      .notNull()
      .references(() => bloodBanks.id, { onDelete: 'cascade' }),
    bloodGroup: varchar('blood_group', { length: 5 }).notNull(),
    componentType: varchar('component_type', { length: 32 }).notNull().default('WHOLE_BLOOD'), // WHOLE_BLOOD | PACKED_RBC | PLATELETS | PLASMA
    unitsAvailable: integer('units_available').notNull().default(0),
    unitsReserved: integer('units_reserved').notNull().default(0),
    criticalThreshold: integer('critical_threshold').notNull().default(5),
    stockStatus: varchar('stock_status', { length: 20 }).notNull().default('ADEQUATE'), // ADEQUATE | LOW | CRITICAL | OUT_OF_STOCK
    updatedByUid: varchar('updated_by_uid', { length: 128 }).references(() => users.uid, {
      onDelete: 'set null',
    }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_inventory_bank_group_comp').on(table.bloodBankId, table.bloodGroup, table.componentType),
    index('idx_inventory_group_status').on(table.bloodGroup, table.stockStatus),
    check(
      'chk_inventory_blood_group',
      sql`${table.bloodGroup} IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`
    ),
    check(
      'chk_inventory_units_non_negative',
      sql`${table.unitsAvailable} >= 0 AND ${table.unitsReserved} >= 0 AND ${table.criticalThreshold} >= 0`
    ),
    check(
      'chk_inventory_stock_status',
      sql`${table.stockStatus} IN ('ADEQUATE', 'LOW', 'CRITICAL', 'OUT_OF_STOCK')`
    ),
  ]
);

// ============================================================================
// 7. BLOOD_REQUESTS (Emergency SOS & scheduled transfusion requests)
// ============================================================================
export const bloodRequests = pgTable(
  'blood_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legacyRequestDocId: varchar('legacy_request_doc_id', { length: 128 }),
    requesterUid: varchar('requester_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'restrict' }),
    patientName: varchar('patient_name', { length: 160 }).notNull(),
    bloodGroup: varchar('blood_group', { length: 5 }).notNull(),
    bagsNeeded: integer('bags_needed').notNull().default(1),
    bagsFulfilled: integer('bags_fulfilled').notNull().default(0),
    urgency: varchar('urgency', { length: 20 }).notNull().default('URGENT'), // CRITICAL | URGENT | STANDARD
    status: varchar('status', { length: 20 }).notNull().default('ACTIVE'), // ACTIVE | FULFILLED | CANCELLED | EXPIRED
    hospitalId: uuid('hospital_id').references(() => hospitals.id, { onDelete: 'set null' }),
    hospitalName: varchar('hospital_name', { length: 220 }).notNull(),
    district: varchar('district', { length: 80 }).notNull(),
    area: varchar('area', { length: 180 }).notNull(),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    neededAt: timestamp('needed_at', { withTimezone: true }),
    clinicalReason: text('clinical_reason'),
    requisitionSlipVerified: boolean('requisition_slip_verified').notNull().default(false),
    contactName: varchar('contact_name', { length: 140 }),
    contactPhonePrivate: varchar('contact_phone_private', { length: 28 }), // Masked in API unless shareDirectContact=true & status='ACTIVE' or owner/admin
    shareDirectContact: boolean('share_direct_contact').notNull().default(false),
    escalationLevel: integer('escalation_level').notNull().default(0),
    SearchRadiusKm: integer('search_radius_km').notNull().default(5),
    respondersCount: integer('responders_count').notNull().default(0),
    resolvedByUid: varchar('resolved_by_uid', { length: 128 }).references(() => users.uid, {
      onDelete: 'set null',
    }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolutionReason: varchar('resolution_reason', { length: 160 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_blood_requests_legacy_id').on(table.legacyRequestDocId),
    index('idx_requests_status_bg_district').on(table.status, table.bloodGroup, table.district),
    index('idx_requests_requester_created').on(table.requesterUid, table.createdAt),
    index('idx_requests_geo').on(table.latitude, table.longitude),
    check(
      'chk_request_blood_group',
      sql`${table.bloodGroup} IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`
    ),
    check('chk_request_urgency', sql`${table.urgency} IN ('CRITICAL', 'URGENT', 'STANDARD')`),
    check('chk_request_status', sql`${table.status} IN ('ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED')`),
    check(
      'chk_request_bags_range',
      sql`${table.bagsNeeded} >= 1 AND ${table.bagsNeeded} <= 20 AND ${table.bagsFulfilled} >= 0`
    ),
    check('chk_request_escalation_range', sql`${table.escalationLevel} >= 0 AND ${table.escalationLevel} <= 4`),
  ]
);

// ============================================================================
// 8. REQUEST_RESPONSES (Donor commitments & en-route status per blood request)
// ============================================================================
export const requestResponses = pgTable(
  'request_responses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legacyResponseDocId: varchar('legacy_response_doc_id', { length: 128 }),
    requestId: uuid('request_id')
      .notNull()
      .references(() => bloodRequests.id, { onDelete: 'cascade' }),
    donorUid: varchar('donor_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    donorName: varchar('donor_name', { length: 140 }).notNull(),
    donorBloodGroup: varchar('donor_blood_group', { length: 5 }).notNull(),
    responseStatus: varchar('response_status', { length: 28 }).notNull().default('ACCEPTED'), // ACCEPTED | EN_ROUTE | ARRIVED | DONATED | DECLINED | CANCELLED
    etaMinutes: integer('eta_minutes'),
    note: text('note'),
    donorLatitude: doublePrecision('donor_latitude'),
    donorLongitude: doublePrecision('donor_longitude'),
    respondedAt: timestamp('responded_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_request_donor_response').on(table.requestId, table.donorUid),
    index('idx_responses_request_status').on(table.requestId, table.responseStatus),
    check(
      'chk_response_status',
      sql`${table.responseStatus} IN ('ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'DONATED', 'DECLINED', 'CANCELLED')`
    ),
  ]
);

// ============================================================================
// 9. DONATIONS (Verified completed blood donation records & cooldown enforcement)
// ============================================================================
export const donations = pgTable(
  'donations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    donorUid: varchar('donor_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'restrict' }),
    requestId: uuid('request_id').references(() => bloodRequests.id, { onDelete: 'set null' }),
    hospitalId: uuid('hospital_id').references(() => hospitals.id, { onDelete: 'set null' }),
    hospitalName: varchar('hospital_name', { length: 200 }).notNull(),
    bloodGroup: varchar('blood_group', { length: 5 }).notNull(),
    unitsDonated: integer('units_donated').notNull().default(1),
    donatedAt: timestamp('donated_at', { withTimezone: true }).notNull().defaultNow(),
    cooldownUntil: timestamp('cooldown_until', { withTimezone: true }).notNull(),
    verifiedByUid: varchar('verified_by_uid', { length: 128 }).references(() => users.uid, {
      onDelete: 'set null',
    }),
    certificateCode: varchar('certificate_code', { length: 64 }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_donations_certificate_code').on(table.certificateCode),
    index('idx_donations_donor_date').on(table.donorUid, table.donatedAt),
    index('idx_donations_request').on(table.requestId),
    check(
      'chk_donations_blood_group',
      sql`${table.bloodGroup} IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`
    ),
    check('chk_donations_units', sql`${table.unitsDonated} >= 1 AND ${table.unitsDonated} <= 4`),
  ]
);

// ============================================================================
// 10. EMERGENCY_ALERTS (Targeted SOS dispatch lifecycle & instant stop-alert lock)
// ============================================================================
export const emergencyAlerts = pgTable(
  'emergency_alerts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legacyAlertDocId: varchar('legacy_alert_doc_id', { length: 128 }),
    requestId: uuid('request_id')
      .notNull()
      .references(() => bloodRequests.id, { onDelete: 'cascade' }),
    targetDonorUid: varchar('target_donor_uid', { length: 128 }).references(() => users.uid, {
      onDelete: 'cascade',
    }),
    escalationLevel: integer('escalation_level').notNull().default(0),
    radiusKm: integer('radius_km').notNull().default(5),
    channel: varchar('channel', { length: 24 }).notNull().default('IN_APP'), // IN_APP | FCM_PUSH | SMS_FALLBACK
    alertState: varchar('alert_state', { length: 28 }).notNull().default('DISPATCHED'), // DISPATCHED | DELIVERED | ACKNOWLEDGED | STOPPED_RESOLVED | EXPIRED
    dispatchedAt: timestamp('dispatched_at', { withTimezone: true }).notNull().defaultNow(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    stoppedAt: timestamp('stopped_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_emergency_alerts_request_state').on(table.requestId, table.alertState),
    index('idx_emergency_alerts_donor_state').on(table.targetDonorUid, table.alertState),
    check(
      'chk_emergency_alert_channel',
      sql`${table.channel} IN ('IN_APP', 'FCM_PUSH', 'SMS_FALLBACK')`
    ),
    check(
      'chk_emergency_alert_state',
      sql`${table.alertState} IN ('DISPATCHED', 'DELIVERED', 'ACKNOWLEDGED', 'STOPPED_RESOLVED', 'EXPIRED')`
    ),
  ]
);

// ============================================================================
// 11. NOTIFICATIONS (User notification inbox for SOS, consents, & verification)
// ============================================================================
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    recipientUid: varchar('recipient_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    notificationType: varchar('notification_type', { length: 40 }).notNull(), // SOS_MATCH | CONTACT_REQUEST | CONTACT_APPROVED | REQUEST_RESOLVED | SYSTEM_SECURITY
    title: varchar('title', { length: 200 }).notNull(),
    body: text('body').notNull(),
    relatedRequestId: uuid('related_request_id').references(() => bloodRequests.id, {
      onDelete: 'set null',
    }),
    metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_notifications_recipient_unread').on(table.recipientUid, table.isRead, table.createdAt),
  ]
);

// ============================================================================
// 12. DEVICE_TOKENS (Firebase Cloud Messaging tokens per authenticated device)
// ============================================================================
export const deviceTokens = pgTable(
  'device_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userUid: varchar('user_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    fcmToken: text('fcm_token').notNull(),
    platform: varchar('platform', { length: 24 }).notNull().default('WEB_PWA'), // WEB_PWA | ANDROID_APK | IOS_WEB
    deviceLabel: varchar('device_label', { length: 140 }),
    isActive: boolean('is_active').notNull().default(true),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_device_tokens_fcm').on(table.fcmToken),
    index('idx_device_tokens_user_active').on(table.userUid, table.isActive),
    check('chk_device_platform', sql`${table.platform} IN ('WEB_PWA', 'ANDROID_APK', 'IOS_WEB')`),
  ]
);

// ============================================================================
// 13. ADMIN_ROLES (Strict DB-backed RBAC — Super Admin & Co-Admin registry)
// ============================================================================
export const adminRoles = pgTable(
  'admin_roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userUid: varchar('user_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    role: varchar('role', { length: 24 }).notNull(), // SUPER_ADMIN | CO_ADMIN | MODERATOR
    permissionsJson: jsonb('permissions_json').$type<string[]>().default(sql`'[]'::jsonb`),
    isActive: boolean('is_active').notNull().default(true),
    grantedByUid: varchar('granted_by_uid', { length: 128 }).references(() => users.uid, {
      onDelete: 'set null',
    }),
    revokedByUid: varchar('revoked_by_uid', { length: 128 }).references(() => users.uid, {
      onDelete: 'set null',
    }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_admin_roles_user_uid').on(table.userUid),
    index('idx_admin_roles_active_role').on(table.isActive, table.role),
    check('chk_admin_role_type', sql`${table.role} IN ('SUPER_ADMIN', 'CO_ADMIN', 'MODERATOR')`),
  ]
);

// ============================================================================
// 14. VERIFICATION_RECORDS (Donor KYC, Hospital Slips, & Admin Vault Invite Locks)
// ============================================================================
export const verificationRecords = pgTable(
  'verification_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subjectUid: varchar('subject_uid', { length: 128 }).references(() => users.uid, {
      onDelete: 'cascade',
    }),
    relatedRequestId: uuid('related_request_id').references(() => bloodRequests.id, {
      onDelete: 'set null',
    }),
    verificationType: varchar('verification_type', { length: 40 }).notNull(), // DONOR_IDENTITY | HOSPITAL_SLIP | PHONE_OTP | ADMIN_INVITE_LOCK | SCAM_INVESTIGATION
    status: varchar('status', { length: 24 }).notNull().default('PENDING'), // PENDING | APPROVED | REJECTED | EXPIRED | CONSUMED
    proofHash: varchar('proof_hash', { length: 128 }),
    evidenceSummary: text('evidence_summary'),
    reviewedByUid: varchar('reviewed_by_uid', { length: 128 }).references(() => users.uid, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_verification_proof_hash').on(table.proofHash),
    index('idx_verification_subject_type').on(table.subjectUid, table.verificationType, table.status),
    check(
      'chk_verification_status',
      sql`${table.status} IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONSUMED')`
    ),
  ]
);

// ============================================================================
// 15. USER_CONSENTS (GDPR/BD Data Protection — Contact Reveal & Medical Terms)
// ============================================================================
export const userConsents = pgTable(
  'user_consents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legacyConsentDocId: varchar('legacy_consent_doc_id', { length: 128 }),
    userUid: varchar('user_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    counterpartyUid: varchar('counterparty_uid', { length: 128 }).references(() => users.uid, {
      onDelete: 'cascade',
    }),
    relatedRequestId: uuid('related_request_id').references(() => bloodRequests.id, {
      onDelete: 'set null',
    }),
    consentType: varchar('consent_type', { length: 40 }).notNull(), // DIRECT_CONTACT_OPT_IN | SEEKER_CONTACT_REQUEST | MEDICAL_ELIGIBILITY | PRIVACY_POLICY | SMS_EMERGENCY_ALERT
    status: varchar('status', { length: 24 }).notNull().default('GRANTED'), // PENDING | GRANTED | DENIED | REVOKED | EXPIRED
    policyVersion: varchar('policy_version', { length: 24 }).notNull().default('2.5.0'),
    reason: text('reason'),
    grantedAt: timestamp('granted_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_user_consents_owner_type').on(table.userUid, table.consentType, table.status),
    index('idx_user_consents_counterparty').on(table.counterpartyUid, table.userUid, table.status),
    check(
      'chk_user_consent_status',
      sql`${table.status} IN ('PENDING', 'GRANTED', 'DENIED', 'REVOKED', 'EXPIRED')`
    ),
  ]
);

// ============================================================================
// 16. LOGIN_SESSIONS (Server-verified session audit & anomaly tracking)
// ============================================================================
export const loginSessions = pgTable(
  'login_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userUid: varchar('user_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    sessionTokenHash: varchar('session_token_hash', { length: 128 }).notNull(),
    authMethod: varchar('auth_method', { length: 32 }).notNull(), // GOOGLE_OAUTH | EMAIL_PASSWORD | PHONE_OTP | ADMIN_CONSOLE
    ipHash: varchar('ip_hash', { length: 64 }).notNull(),
    userAgentSummary: varchar('user_agent_summary', { length: 255 }),
    isAdminConsole: boolean('is_admin_console').notNull().default(false),
    isRevoked: boolean('is_revoked').notNull().default(false),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_login_sessions_token_hash').on(table.sessionTokenHash),
    index('idx_login_sessions_user_active').on(table.userUid, table.isRevoked, table.expiresAt),
  ]
);

// ============================================================================
// 17. AUDIT_LOGS (Immutable security & clinical action trail — zero raw secrets)
// ============================================================================
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    actorUid: varchar('actor_uid', { length: 128 }), // Nullable for unauthenticated blocked attempts
    actorRole: varchar('actor_role', { length: 28 }).notNull().default('USER'),
    action: varchar('action', { length: 64 }).notNull(), // e.g., UNMASK_PHONE, SOS_CREATED, REQUEST_STATE_CHANGED, ADMIN_ROLE_GRANTED, INVENTORY_UPDATED, AUTH_REJECTED
    targetEntityType: varchar('target_entity_type', { length: 48 }).notNull(),
    targetEntityId: varchar('target_entity_id', { length: 128 }).notNull(),
    outcome: varchar('outcome', { length: 20 }).notNull().default('SUCCESS'), // SUCCESS | DENIED | ERROR
    ipHash: varchar('ip_hash', { length: 64 }),
    detailsJson: jsonb('details_json').$type<Record<string, unknown>>().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_audit_logs_actor_created').on(table.actorUid, table.createdAt),
    index('idx_audit_logs_action_outcome').on(table.action, table.outcome, table.createdAt),
    index('idx_audit_logs_target').on(table.targetEntityType, table.targetEntityId),
    check('chk_audit_outcome', sql`${table.outcome} IN ('SUCCESS', 'DENIED', 'ERROR')`),
  ]
);

// ============================================================================
// 18–24. LOSSLESS FIRESTORE PARITY TABLES (Preserve all 18 Firestore collections)
// ============================================================================

export const liveDonorTrips = pgTable(
  'live_donor_trips',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legacyTripDocId: varchar('legacy_trip_doc_id', { length: 128 }),
    requestId: uuid('request_id')
      .notNull()
      .references(() => bloodRequests.id, { onDelete: 'cascade' }),
    donorUid: varchar('donor_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    requesterUid: varchar('requester_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    donorName: varchar('donor_name', { length: 140 }).notNull(),
    bloodGroup: varchar('blood_group', { length: 5 }).notNull(),
    currentLat: doublePrecision('current_lat').notNull(),
    currentLng: doublePrecision('current_lng').notNull(),
    hospitalLat: doublePrecision('hospital_lat'),
    hospitalLng: doublePrecision('hospital_lng'),
    etaMinutes: integer('eta_minutes'),
    distanceKm: doublePrecision('distance_km'),
    tripStatus: varchar('trip_status', { length: 24 }).notNull().default('EN_ROUTE'), // EN_ROUTE | ARRIVED | COMPLETED | STOPPED
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_live_trips_legacy_id').on(table.legacyTripDocId),
    index('idx_live_trips_request_status').on(table.requestId, table.tripStatus),
  ]
);

export const communityMessages = pgTable(
  'community_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legacyMessageDocId: varchar('legacy_message_doc_id', { length: 128 }),
    senderUid: varchar('sender_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    senderName: varchar('sender_name', { length: 140 }).notNull(),
    senderBloodGroup: varchar('sender_blood_group', { length: 5 }),
    district: varchar('district', { length: 80 }),
    messageText: text('message_text').notNull(),
    attachmentType: varchar('attachment_type', { length: 24 }), // NONE | GPS_PIN | SLIP_PHOTO | SOS_CARD
    attachmentJson: jsonb('attachment_json').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_community_msg_legacy_id').on(table.legacyMessageDocId),
    index('idx_community_msg_created').on(table.createdAt),
  ]
);

export const directChatRooms = pgTable(
  'direct_chat_rooms',
  {
    id: varchar('id', { length: 160 }).primaryKey(), // Deterministic uidA_uidB room key
    participantOneUid: varchar('participant_one_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    participantTwoUid: varchar('participant_two_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    lastMessagePreview: text('last_message_preview'),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_direct_chat_p1').on(table.participantOneUid, table.lastMessageAt),
    index('idx_direct_chat_p2').on(table.participantTwoUid, table.lastMessageAt),
  ]
);

export const directChatMessages = pgTable(
  'direct_chat_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legacyMessageDocId: varchar('legacy_message_doc_id', { length: 128 }),
    roomId: varchar('room_id', { length: 160 })
      .notNull()
      .references(() => directChatRooms.id, { onDelete: 'cascade' }),
    senderUid: varchar('sender_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    messageText: text('message_text').notNull(),
    metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_direct_msg_legacy_id').on(table.legacyMessageDocId),
    index('idx_direct_msg_room_created').on(table.roomId, table.createdAt),
  ]
);

export const announcements = pgTable(
  'announcements',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legacyAnnouncementDocId: varchar('legacy_announcement_doc_id', { length: 128 }),
    title: varchar('title', { length: 220 }).notNull(),
    body: text('body').notNull(),
    priority: varchar('priority', { length: 20 }).notNull().default('INFO'), // INFO | WARNING | CRITICAL
    isActive: boolean('is_active').notNull().default(true),
    authorUid: varchar('author_uid', { length: 128 }).references(() => users.uid, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_announcements_legacy_id').on(table.legacyAnnouncementDocId),
    index('idx_announcements_active_created').on(table.isActive, table.createdAt),
  ]
);

export const scamReports = pgTable(
  'scam_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legacyReportDocId: varchar('legacy_report_doc_id', { length: 128 }),
    reporterUid: varchar('reporter_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    accusedUid: varchar('accused_uid', { length: 128 }).references(() => users.uid, {
      onDelete: 'set null',
    }),
    accusedPhoneHash: varchar('accused_phone_hash', { length: 64 }),
    category: varchar('category', { length: 48 }).notNull().default('ILLEGAL_MONEY_DEMAND'),
    description: text('description').notNull(),
    status: varchar('status', { length: 24 }).notNull().default('OPEN'), // OPEN | UNDER_REVIEW | ACTION_TAKEN | DISMISSED
    reviewedByUid: varchar('reviewed_by_uid', { length: 128 }).references(() => users.uid, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_scam_reports_legacy_id').on(table.legacyReportDocId),
    index('idx_scam_reports_status').on(table.status, table.createdAt),
  ]
);

export const gratitudeNotes = pgTable(
  'gratitude_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legacyNoteDocId: varchar('legacy_note_doc_id', { length: 128 }),
    authorUid: varchar('author_uid', { length: 128 })
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    authorName: varchar('author_name', { length: 140 }).notNull(),
    honoredDonorUid: varchar('honored_donor_uid', { length: 128 }).references(() => users.uid, {
      onDelete: 'set null',
    }),
    district: varchar('district', { length: 80 }),
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('uq_gratitude_notes_legacy_id').on(table.legacyNoteDocId),
    index('idx_gratitude_notes_created').on(table.createdAt),
  ]
);

// ============================================================================
// DRIZZLE ORM EXPLICIT RELATIONAL GRAPH
// ============================================================================
export const usersRelations = relations(users, ({ one, many }) => ({
  donorProfile: one(donorProfiles, {
    fields: [users.uid],
    references: [donorProfiles.userUid],
  }),
  privateContact: one(privateContacts, {
    fields: [users.uid],
    references: [privateContacts.userUid],
  }),
  adminRole: one(adminRoles, {
    fields: [users.uid],
    references: [adminRoles.userUid],
  }),
  bloodRequests: many(bloodRequests),
  requestResponses: many(requestResponses),
  donations: many(donations),
  notifications: many(notifications),
  deviceTokens: many(deviceTokens),
  consents: many(userConsents),
  loginSessions: many(loginSessions),
}));

export const donorProfilesRelations = relations(donorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [donorProfiles.userUid],
    references: [users.uid],
  }),
}));

export const privateContactsRelations = relations(privateContacts, ({ one }) => ({
  user: one(users, {
    fields: [privateContacts.userUid],
    references: [users.uid],
  }),
}));

export const hospitalsRelations = relations(hospitals, ({ many }) => ({
  bloodBanks: many(bloodBanks),
  bloodRequests: many(bloodRequests),
  donations: many(donations),
}));

export const bloodBanksRelations = relations(bloodBanks, ({ one, many }) => ({
  hospital: one(hospitals, {
    fields: [bloodBanks.hospitalId],
    references: [hospitals.id],
  }),
  inventoryItems: many(bloodInventory),
}));

export const bloodInventoryRelations = relations(bloodInventory, ({ one }) => ({
  bloodBank: one(bloodBanks, {
    fields: [bloodInventory.bloodBankId],
    references: [bloodBanks.id],
  }),
}));

export const bloodRequestsRelations = relations(bloodRequests, ({ one, many }) => ({
  requester: one(users, {
    fields: [bloodRequests.requesterUid],
    references: [users.uid],
  }),
  hospital: one(hospitals, {
    fields: [bloodRequests.hospitalId],
    references: [hospitals.id],
  }),
  responses: many(requestResponses),
  emergencyAlerts: many(emergencyAlerts),
  donations: many(donations),
}));

export const requestResponsesRelations = relations(requestResponses, ({ one }) => ({
  request: one(bloodRequests, {
    fields: [requestResponses.requestId],
    references: [bloodRequests.id],
  }),
  donor: one(users, {
    fields: [requestResponses.donorUid],
    references: [users.uid],
  }),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  donor: one(users, {
    fields: [donations.donorUid],
    references: [users.uid],
  }),
  request: one(bloodRequests, {
    fields: [donations.requestId],
    references: [bloodRequests.id],
  }),
  hospital: one(hospitals, {
    fields: [donations.hospitalId],
    references: [hospitals.id],
  }),
}));

export const CORE_REQUIRED_TABLES = [
  'users',
  'donor_profiles',
  'private_contacts',
  'blood_requests',
  'request_responses',
  'donations',
  'hospitals',
  'blood_banks',
  'blood_inventory',
  'notifications',
  'device_tokens',
  'admin_roles',
  'verification_records',
  'audit_logs',
  'emergency_alerts',
  'user_consents',
  'login_sessions',
] as const;

export const PARITY_TABLES = [
  'live_donor_trips',
  'community_messages',
  'direct_chat_rooms',
  'direct_chat_messages',
  'announcements',
  'scam_reports',
  'gratitude_notes',
] as const;

export const ALL_BLOODSEARCH_TABLES = [...CORE_REQUIRED_TABLES, ...PARITY_TABLES] as const;
