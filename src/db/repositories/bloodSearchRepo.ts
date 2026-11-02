import crypto from 'node:crypto';
import { and, asc, between, count, desc, eq, inArray, isNotNull, ne, or, sql } from 'drizzle-orm';
import type { BloodSearchDatabase } from '../index.ts';
import { checkPostgisAvailability } from '../neonMonitor.ts';
import {
  adminRoles,
  auditLogs,
  bloodBanks,
  bloodInventory,
  bloodRequests,
  deviceTokens,
  donations,
  donorProfiles,
  emergencyAlerts,
  hospitals,
  liveDonorTrips,
  loginSessions,
  notifications,
  privateContacts,
  requestResponses,
  userConsents,
  users,
} from '../schema.ts';

export type ServerActorRole = 'SUPER_ADMIN' | 'CO_ADMIN' | 'MODERATOR' | 'USER';

export interface AuthenticatedActor {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  ipHash: string;
}

export interface ResolvedActor extends AuthenticatedActor {
  role: ServerActorRole;
}

export class DomainSecurityError extends Error {
  public readonly httpStatus: number;
  public readonly code: string;

  constructor(httpStatus: number, code: string, message: string) {
    super(message);
    this.name = 'DomainSecurityError';
    this.httpStatus = httpStatus;
    this.code = code;
  }
}

const SUPER_OWNER_SALTED_DIGEST =
  '1164a3a1b7fd8a68b85b97ca30a320b51bd493d1837ce8116925243985d7802a';

function isSuperOwnerIdentityEmail(normalizedEmail: string): boolean {
  if (!normalizedEmail) return false;
  const envEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  if (envEmail && normalizedEmail === envEmail) return true;
  const saltedDigest = crypto
    .createHash('sha256')
    .update(`BSBD_OWNER_ID_V3:${normalizedEmail}`)
    .digest('hex');
  return saltedDigest === SUPER_OWNER_SALTED_DIGEST;
}
const VALID_BLOOD_GROUPS = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
const VALID_URGENCIES = new Set(['CRITICAL', 'URGENT', 'STANDARD']);
const VALID_GENDERS = new Set(['MALE', 'FEMALE', 'OTHER']);
const TERMINAL_REQUEST_STATES = new Set(['FULFILLED', 'CANCELLED', 'EXPIRED']);

const COMPATIBLE_DONOR_GROUPS_FOR_RECIPIENT: Record<string, string[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

const ESCALATION_RADIUS_BY_LEVEL: Record<number, number> = {
  0: 5,
  1: 15,
  2: 40,
  3: 85,
  4: 500,
};

export function hashIdentifier(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

export function maskBangladeshPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.length < 7) return '***';
  return `${cleaned.slice(0, 6)}****${cleaned.slice(-2)}`;
}

export function normalizeBangladeshPhone(raw: string): string {
  const digits = String(raw || '').replace(/[^\d+]/g, '');
  if (/^\+8801[3-9]\d{8}$/.test(digits)) return digits;
  if (/^8801[3-9]\d{8}$/.test(digits)) return `+${digits}`;
  if (/^01[3-9]\d{8}$/.test(digits)) return `+88${digits}`;
  throw new DomainSecurityError(
    400,
    'INVALID_BD_PHONE',
    'Phone number must be a valid Bangladesh mobile number (+8801[3-9]XXXXXXXX).'
  );
}

function assertCleanText(value: unknown, fieldName: string, maxLen = 180, minLen = 1): string {
  const str = String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
  if (str.length < minLen || str.length > maxLen) {
    throw new DomainSecurityError(
      400,
      'VALIDATION_ERROR',
      `Invalid ${fieldName}: must be between ${minLen} and ${maxLen} characters.`
    );
  }
  return str;
}

function assertBloodGroup(value: unknown): string {
  const bg = String(value ?? '').trim().toUpperCase();
  if (!VALID_BLOOD_GROUPS.has(bg)) {
    throw new DomainSecurityError(400, 'INVALID_BLOOD_GROUP', 'Blood group must be one of A+, A-, B+, B-, AB+, AB-, O+, O-.');
  }
  return bg;
}

function assertOptionalCoordinates(latRaw: unknown, lngRaw: unknown): { lat: number | null; lng: number | null } {
  if (latRaw === undefined || latRaw === null || latRaw === '' || lngRaw === undefined || lngRaw === null || lngRaw === '') {
    return { lat: null, lng: null };
  }
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new DomainSecurityError(400, 'INVALID_COORDINATES', 'Latitude (-90..90) and Longitude (-180..180) must be valid numbers.');
  }
  return { lat, lng };
}

/**
 * Resolves the caller's authoritative role strictly from verified Firebase identity + PostgreSQL `admin_roles`.
 * NEVER trusts any role or admin flag sent by the frontend or APK request payload.
 */
export async function resolveActorRole(
  db: BloodSearchDatabase,
  actor: AuthenticatedActor
): Promise<ResolvedActor> {
  const normalizedEmail = (actor.email || '').trim().toLowerCase();

  if (actor.emailVerified && isSuperOwnerIdentityEmail(normalizedEmail)) {
    return { ...actor, role: 'SUPER_ADMIN' };
  }

  const [roleRow] = await db
    .select()
    .from(adminRoles)
    .where(and(eq(adminRoles.userUid, actor.uid), eq(adminRoles.isActive, true)))
    .limit(1);

  if (roleRow && actor.emailVerified) {
    if (roleRow.role === 'SUPER_ADMIN' && isSuperOwnerIdentityEmail(normalizedEmail)) {
      return { ...actor, role: 'SUPER_ADMIN' };
    }
    if (roleRow.role === 'CO_ADMIN') {
      return { ...actor, role: 'CO_ADMIN' };
    }
    if (roleRow.role === 'MODERATOR') {
      return { ...actor, role: 'MODERATOR' };
    }
  }

  return { ...actor, role: 'USER' };
}

export function isAdminRole(role: ServerActorRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'CO_ADMIN';
}

/**
 * Appends an immutable audit entry into `audit_logs` (sanitized, zero secrets or raw passwords).
 */
export async function writeAuditLog(
  dbOrTx: Pick<BloodSearchDatabase, 'insert'>,
  entry: {
    actorUid: string | null;
    actorRole: ServerActorRole | 'ANONYMOUS';
    action: string;
    targetEntityType: string;
    targetEntityId: string;
    outcome: 'SUCCESS' | 'DENIED' | 'ERROR';
    ipHash?: string;
    details?: Record<string, unknown>;
  }
): Promise<void> {
  await dbOrTx.insert(auditLogs).values({
    actorUid: entry.actorUid,
    actorRole: entry.actorRole,
    action: entry.action,
    targetEntityType: entry.targetEntityType,
    targetEntityId: entry.targetEntityId,
    outcome: entry.outcome,
    ipHash: entry.ipHash || null,
    detailsJson: entry.details || {},
  });
}

async function ensureActorUserRowTx(
  tx: Pick<BloodSearchDatabase, 'insert'>,
  actor: ResolvedActor
): Promise<void> {
  await tx
    .insert(users)
    .values({
      uid: actor.uid,
      email: actor.email || null,
      emailVerified: actor.emailVerified,
      displayName: actor.email ? actor.email.split('@')[0] || 'BloodSearch User' : 'BloodSearch User',
    })
    .onConflictDoNothing({ target: users.uid });
}

// ============================================================================
// 1. TRANSACTIONAL USER + DONOR PROFILE + PRIVATE CONTACT REGISTRATION / UPDATE
// ============================================================================
export interface UpsertDonorRegistrationInput {
  targetUid: string;
  displayName: string;
  bloodGroup: string;
  age?: number | null; // Strictly user-supplied, NEVER auto-calculated or defaulted
  gender?: string | null;
  weightKg?: number | null;
  district: string;
  upazila?: string | null;
  area: string;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  whatsappNumber?: string | null;
  facebookProfileUrl?: string | null;
  exactStreetAddress?: string | null;
  isAvailable?: boolean;
  shareDirectContact?: boolean;
  contactPreference?: 'CALL_ALLOWED' | 'WHATSAPP_ONLY' | 'IN_APP_ONLY' | 'DND';
  contactVisibility?: 'PUBLIC_OPT_IN' | 'REQUEST_ONLY' | 'EMERGENCY_VERIFIED_ONLY' | 'DND_PRIVATE';
  medicalDeclarationAccepted: boolean;
  bio?: string | null;
}

export async function upsertUserAndDonorProfileTx(
  db: BloodSearchDatabase,
  actor: ResolvedActor,
  input: UpsertDonorRegistrationInput
) {
  // Anti-IDOR enforcement: A user can ONLY register/update their own UID unless verified Admin
  if (actor.uid !== input.targetUid && !isAdminRole(actor.role)) {
    await writeAuditLog(db, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'IDOR_DONOR_PROFILE_UPDATE_BLOCKED',
      targetEntityType: 'donor_profiles',
      targetEntityId: input.targetUid,
      outcome: 'DENIED',
      ipHash: actor.ipHash,
    });
    throw new DomainSecurityError(403, 'FORBIDDEN_IDOR', 'You may only create or modify your own donor profile.');
  }

  const publicName = assertCleanText(input.displayName, 'displayName', 140, 2);
  const bloodGroup = assertBloodGroup(input.bloodGroup);
  const district = assertCleanText(input.district, 'district', 80, 2);
  const area = assertCleanText(input.area, 'area', 180, 2);
  const phoneE164 = normalizeBangladeshPhone(input.phone);
  const whatsappE164 = input.whatsappNumber ? normalizeBangladeshPhone(input.whatsappNumber) : phoneE164;
  const { lat, lng } = assertOptionalCoordinates(input.latitude, input.longitude);

  // Age is strictly manual: validate 18..65 ONLY if provided by user, never auto-fill!
  let validatedAge: number | null = null;
  if (input.age !== undefined && input.age !== null) {
    const parsedAge = Number(input.age);
    if (!Number.isInteger(parsedAge) || parsedAge < 18 || parsedAge > 65) {
      throw new DomainSecurityError(400, 'INVALID_DONOR_AGE', 'Donor age must be an integer between 18 and 65.');
    }
    validatedAge = parsedAge;
  }

  let validatedGender: string | null = null;
  if (input.gender) {
    const g = String(input.gender).trim().toUpperCase();
    if (!VALID_GENDERS.has(g)) {
      throw new DomainSecurityError(400, 'INVALID_GENDER', 'Gender must be MALE, FEMALE, or OTHER.');
    }
    validatedGender = g;
  }

  if (!input.medicalDeclarationAccepted) {
    throw new DomainSecurityError(400, 'MEDICAL_CONSENT_REQUIRED', 'Donor medical eligibility declaration must be accepted.');
  }

  const shareDirect = input.contactPreference === 'DND' ? false : Boolean(input.shareDirectContact);
  const contactPref = input.contactPreference || (shareDirect ? 'CALL_ALLOWED' : 'IN_APP_ONLY');
  const visibility =
    contactPref === 'DND'
      ? 'DND_PRIVATE'
      : input.contactVisibility || (shareDirect ? 'PUBLIC_OPT_IN' : 'REQUEST_ONLY');

  const smartId = `BS-${district.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'B')}-${hashIdentifier(input.targetUid).slice(0, 8).toUpperCase()}`;

  return db.transaction(async (tx) => {
    const now = new Date();

    await tx
      .insert(users)
      .values({
        uid: input.targetUid,
        email: actor.uid === input.targetUid ? actor.email : null,
        emailVerified: actor.uid === input.targetUid ? actor.emailVerified : false,
        displayName: publicName,
        bloodGroup,
        district,
        area,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          displayName: publicName,
          bloodGroup,
          district,
          area,
          email: actor.uid === input.targetUid && actor.email ? actor.email : sql`${users.email}`,
          emailVerified: actor.uid === input.targetUid ? actor.emailVerified : sql`${users.emailVerified}`,
          updatedAt: now,
        },
      });

    const [profile] = await tx
      .insert(donorProfiles)
      .values({
        userUid: input.targetUid,
        donorSmartId: smartId,
        publicName,
        bloodGroup,
        age: validatedAge,
        gender: validatedGender,
        weightKg: input.weightKg ?? null,
        district,
        upazila: input.upazila ? assertCleanText(input.upazila, 'upazila', 100, 1) : null,
        area,
        latitude: lat,
        longitude: lng,
        availabilityStatus: input.isAvailable === false ? 'OFFLINE' : 'AVAILABLE',
        isAvailable: input.isAvailable !== false,
        medicalDeclarationAccepted: true,
        shareDirectContact: shareDirect,
        contactPreference: contactPref,
        maskedPhoneHint: maskBangladeshPhone(phoneE164),
        bio: input.bio ? assertCleanText(input.bio, 'bio', 500, 1) : null,
        lastAvailabilityConfirmedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: donorProfiles.userUid,
        set: {
          publicName,
          bloodGroup,
          age: validatedAge,
          gender: validatedGender,
          weightKg: input.weightKg ?? null,
          district,
          upazila: input.upazila ? assertCleanText(input.upazila, 'upazila', 100, 1) : null,
          area,
          latitude: lat,
          longitude: lng,
          availabilityStatus: input.isAvailable === false ? 'OFFLINE' : 'AVAILABLE',
          isAvailable: input.isAvailable !== false,
          medicalDeclarationAccepted: true,
          shareDirectContact: shareDirect,
          contactPreference: contactPref,
          maskedPhoneHint: maskBangladeshPhone(phoneE164),
          bio: input.bio ? assertCleanText(input.bio, 'bio', 500, 1) : null,
          lastAvailabilityConfirmedAt: now,
          updatedAt: now,
        },
      })
      .returning();

    await tx
      .insert(privateContacts)
      .values({
        userUid: input.targetUid,
        phoneE164,
        whatsappNumber: whatsappE164,
        facebookProfileUrl: input.facebookProfileUrl ? String(input.facebookProfileUrl).slice(0, 300) : null,
        exactStreetAddress: input.exactStreetAddress ? String(input.exactStreetAddress).slice(0, 400) : null,
        contactVisibility: visibility,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: privateContacts.userUid,
        set: {
          phoneE164,
          whatsappNumber: whatsappE164,
          facebookProfileUrl: input.facebookProfileUrl ? String(input.facebookProfileUrl).slice(0, 300) : null,
          exactStreetAddress: input.exactStreetAddress ? String(input.exactStreetAddress).slice(0, 400) : null,
          contactVisibility: visibility,
          updatedAt: now,
        },
      });

    await tx.insert(userConsents).values({
      userUid: input.targetUid,
      consentType: 'MEDICAL_ELIGIBILITY',
      status: 'GRANTED',
      policyVersion: '2.5.0',
      grantedAt: now,
      reason: `shareDirect=${shareDirect};visibility=${visibility}`,
    });

    await writeAuditLog(tx, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'DONOR_PROFILE_UPSERTED',
      targetEntityType: 'donor_profiles',
      targetEntityId: profile.id,
      outcome: 'SUCCESS',
      ipHash: actor.ipHash,
      details: {
        targetUid: input.targetUid,
        bloodGroup,
        district,
        visibility,
      },
    });

    return profile;
  });
}

// ============================================================================
// 2. PAGINATED & GEOSPATIAL PUBLIC DONOR SEARCH (ZERO RAW PII EXPOSURE)
// ============================================================================
export interface DonorSearchQuery {
  bloodGroup?: string;
  includeCompatible?: boolean;
  district?: string;
  areaQuery?: string;
  availableOnly?: boolean;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
}

export async function searchPublicDonorsPaginated(db: BloodSearchDatabase, query: DonorSearchQuery) {
  const page = Math.max(1, Math.floor(Number(query.page) || 1));
  const limit = Math.min(50, Math.max(1, Math.floor(Number(query.limit) || 20)));
  const offset = (page - 1) * limit;

  const conditions = [];

  if (query.bloodGroup && query.bloodGroup.trim().toUpperCase() !== 'ALL') {
    const bg = assertBloodGroup(query.bloodGroup);
    if (query.includeCompatible) {
      const compatList = COMPATIBLE_DONOR_GROUPS_FOR_RECIPIENT[bg] || [bg];
      conditions.push(inArray(donorProfiles.bloodGroup, compatList));
    } else {
      conditions.push(eq(donorProfiles.bloodGroup, bg));
    }
  }

  if (query.district && query.district.trim().toUpperCase() !== 'ALL') {
    const cleanDistrict = assertCleanText(query.district, 'district', 80, 1);
    conditions.push(sql`LOWER(${donorProfiles.district}) = LOWER(${cleanDistrict})`);
  }

  if (query.areaQuery && query.areaQuery.trim().length > 0) {
    const cleanQ = assertCleanText(query.areaQuery, 'areaQuery', 100, 1).replace(/[%_\\]/g, '');
    if (cleanQ.length > 0) {
      const pattern = `%${cleanQ}%`;
      conditions.push(
        or(
          sql`${donorProfiles.area} ILIKE ${pattern}`,
          sql`${donorProfiles.publicName} ILIKE ${pattern}`,
          sql`COALESCE(${donorProfiles.upazila}, '') ILIKE ${pattern}`
        )!
      );
    }
  }

  if (query.availableOnly !== false) {
    conditions.push(eq(donorProfiles.isAvailable, true));
  }

  const hasGeoCenter =
    query.latitude !== undefined &&
    query.longitude !== undefined &&
    Number.isFinite(Number(query.latitude)) &&
    Number.isFinite(Number(query.longitude));

  let geoStrategy: 'NONE' | 'POSTGIS_GEOGRAPHY' | 'INDEXED_BOUNDING_BOX_HAVERSINE' = 'NONE';
  let distanceExpr = sql<number | null>`NULL`;

  if (hasGeoCenter) {
    const { lat, lng } = assertOptionalCoordinates(query.latitude, query.longitude);
    const radiusKm = Math.min(500, Math.max(1, Number(query.radiusKm) || 25));

    if (lat !== null && lng !== null) {
      // Stage 1: Indexed Bounding-Box pre-filter on idx_donor_geo_lat_lng
      const latDelta = radiusKm / 110.574;
      const cosLat = Math.max(0.05, Math.cos((lat * Math.PI) / 180));
      const lngDelta = radiusKm / (111.32 * cosLat);

      conditions.push(isNotNull(donorProfiles.latitude));
      conditions.push(isNotNull(donorProfiles.longitude));
      conditions.push(between(donorProfiles.latitude, lat - latDelta, lat + latDelta));
      conditions.push(between(donorProfiles.longitude, lng - lngDelta, lng + lngDelta));

      // Stage 2: Check runtime PostGIS availability; otherwise use parameterized SQL Great-Circle Haversine
      const postgis = await checkPostgisAvailability(db);
      if (postgis.installed) {
        geoStrategy = 'POSTGIS_GEOGRAPHY';
        const radiusMeters = radiusKm * 1000;
        conditions.push(
          sql`ST_DWithin(
            ST_SetSRID(ST_MakePoint(${donorProfiles.longitude}, ${donorProfiles.latitude}), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
            ${radiusMeters}
          )`
        );
        distanceExpr = sql<number>`ROUND((
          ST_Distance(
            ST_SetSRID(ST_MakePoint(${donorProfiles.longitude}, ${donorProfiles.latitude}), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
          ) / 1000.0
        )::numeric, 2)::double precision`;
      } else {
        geoStrategy = 'INDEXED_BOUNDING_BOX_HAVERSINE';
        const rawHaversine = sql`(
          6371.0 * 2.0 * ASIN(
            SQRT(
              LEAST(
                1.0,
                POWER(SIN(RADIANS((${donorProfiles.latitude} - ${lat}) / 2.0)), 2) +
                COS(RADIANS(${lat})) * COS(RADIANS(${donorProfiles.latitude})) *
                POWER(SIN(RADIANS((${donorProfiles.longitude} - ${lng}) / 2.0)), 2)
              )
            )
          )
        )`;
        conditions.push(sql`${rawHaversine} <= ${radiusKm}`);
        distanceExpr = sql<number>`ROUND((${rawHaversine})::numeric, 2)::double precision`;
      }
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(donorProfiles)
    .where(whereClause);

  // Strictly select ONLY public-safe columns from donor_profiles — private_contacts is NEVER joined!
  const rows = await db
    .select({
      id: donorProfiles.id,
      userUid: donorProfiles.userUid,
      donorSmartId: donorProfiles.donorSmartId,
      publicName: donorProfiles.publicName,
      bloodGroup: donorProfiles.bloodGroup,
      age: donorProfiles.age,
      gender: donorProfiles.gender,
      district: donorProfiles.district,
      upazila: donorProfiles.upazila,
      area: donorProfiles.area,
      // Round public coordinates to 3 decimals (~110m privacy fuzzing) so exact home doorstep is protected
      approxLatitude: sql<number | null>`CASE WHEN ${donorProfiles.latitude} IS NULL THEN NULL ELSE ROUND(${donorProfiles.latitude}::numeric, 3)::double precision END`,
      approxLongitude: sql<number | null>`CASE WHEN ${donorProfiles.longitude} IS NULL THEN NULL ELSE ROUND(${donorProfiles.longitude}::numeric, 3)::double precision END`,
      availabilityStatus: donorProfiles.availabilityStatus,
      isAvailable: donorProfiles.isAvailable,
      totalDonations: donorProfiles.totalDonations,
      isVerified: donorProfiles.isVerified,
      shareDirectContact: donorProfiles.shareDirectContact,
      contactPreference: donorProfiles.contactPreference,
      maskedPhoneHint: donorProfiles.maskedPhoneHint,
      rating: donorProfiles.rating,
      responseRatePercent: donorProfiles.responseRatePercent,
      avgResponseMinutes: donorProfiles.avgResponseMinutes,
      lastAvailabilityConfirmedAt: donorProfiles.lastAvailabilityConfirmedAt,
      distanceKm: distanceExpr,
    })
    .from(donorProfiles)
    .where(whereClause)
    .orderBy(
      ...(hasGeoCenter ? [asc(distanceExpr)] : []),
      desc(donorProfiles.isAvailable),
      desc(donorProfiles.isVerified),
      desc(donorProfiles.rating),
      desc(donorProfiles.totalDonations)
    )
    .limit(limit)
    .offset(offset);

  const totalPages = Math.max(1, Math.ceil(Number(totalCount) / limit));

  return {
    items: rows,
    pagination: {
      page,
      limit,
      totalItems: Number(totalCount),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    geoStrategy,
  };
}

// ============================================================================
// 3. PRIVATE DONOR CONTACT VAULT ACCESS & CONSENT WORKFLOW
// ============================================================================
export async function getAuthorizedDonorPrivateContactTx(
  db: BloodSearchDatabase,
  actor: ResolvedActor,
  targetDonorUid: string,
  relatedRequestId?: string
) {
  return db.transaction(async (tx) => {
    const [profile] = await tx
      .select()
      .from(donorProfiles)
      .where(eq(donorProfiles.userUid, targetDonorUid))
      .limit(1);

    const [contact] = await tx
      .select()
      .from(privateContacts)
      .where(eq(privateContacts.userUid, targetDonorUid))
      .limit(1);

    if (!profile || !contact) {
      throw new DomainSecurityError(404, 'DONOR_CONTACT_NOT_FOUND', 'Donor contact record does not exist.');
    }

    const isSelf = actor.uid === targetDonorUid;
    const isAdmin = isAdminRole(actor.role);

    if (!isSelf && !isAdmin) {
      // Enforce Do-Not-Disturb & Private Vault lock
      if (profile.contactPreference === 'DND' || contact.contactVisibility === 'DND_PRIVATE') {
        await writeAuditLog(tx, {
          actorUid: actor.uid,
          actorRole: actor.role,
          action: 'UNMASK_PHONE_BLOCKED_DND',
          targetEntityType: 'private_contacts',
          targetEntityId: targetDonorUid,
          outcome: 'DENIED',
          ipHash: actor.ipHash,
        });
        throw new DomainSecurityError(
          403,
          'DONOR_DND_PRIVATE',
          'This donor has enabled Do-Not-Disturb / Private Contact protection.'
        );
      }

      const isPublicOptIn = profile.shareDirectContact && contact.contactVisibility === 'PUBLIC_OPT_IN';

      if (!isPublicOptIn) {
        // Check explicit GRANTED consent in `user_consents` for this seeker
        const now = new Date();
        const [grantedConsent] = await tx
          .select()
          .from(userConsents)
          .where(
            and(
              eq(userConsents.userUid, targetDonorUid),
              eq(userConsents.counterpartyUid, actor.uid),
              eq(userConsents.consentType, 'SEEKER_CONTACT_REQUEST'),
              eq(userConsents.status, 'GRANTED')
            )
          )
          .limit(1);

        const consentValid =
          Boolean(grantedConsent) && (!grantedConsent.expiresAt || grantedConsent.expiresAt.getTime() > now.getTime());

        // Or check if donor has explicitly ACCEPTED the actor's ACTIVE blood request
        let donorAcceptedActorsRequest = false;
        if (!consentValid && relatedRequestId) {
          const [activeReq] = await tx
            .select()
            .from(bloodRequests)
            .where(
              and(
                eq(bloodRequests.id, relatedRequestId),
                eq(bloodRequests.requesterUid, actor.uid),
                eq(bloodRequests.status, 'ACTIVE')
              )
            )
            .limit(1);
          if (activeReq) {
            const [acceptedResp] = await tx
              .select()
              .from(requestResponses)
              .where(
                and(
                  eq(requestResponses.requestId, activeReq.id),
                  eq(requestResponses.donorUid, targetDonorUid),
                  inArray(requestResponses.responseStatus, ['ACCEPTED', 'EN_ROUTE', 'ARRIVED'])
                )
              )
              .limit(1);
            donorAcceptedActorsRequest = Boolean(acceptedResp);
          }
        }

        if (!consentValid && !donorAcceptedActorsRequest) {
          await writeAuditLog(tx, {
            actorUid: actor.uid,
            actorRole: actor.role,
            action: 'UNMASK_PHONE_CONSENT_REQUIRED',
            targetEntityType: 'private_contacts',
            targetEntityId: targetDonorUid,
            outcome: 'DENIED',
            ipHash: actor.ipHash,
          });
          throw new DomainSecurityError(
            403,
            'CONSENT_REQUIRED',
            'Explicit donor consent is required before viewing private phone details. Send an in-app contact request first.'
          );
        }
      }
    }

    await writeAuditLog(tx, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'UNMASK_PHONE_GRANTED',
      targetEntityType: 'private_contacts',
      targetEntityId: targetDonorUid,
      outcome: 'SUCCESS',
      ipHash: actor.ipHash,
      details: {
        relatedRequestId: relatedRequestId || null,
        contactPreference: profile.contactPreference,
      },
    });

    return {
      donorUid: targetDonorUid,
      publicName: profile.publicName,
      contactPreference: profile.contactPreference,
      phoneE164: profile.contactPreference === 'WHATSAPP_ONLY' && !isSelf && !isAdmin ? null : contact.phoneE164,
      whatsappNumber: contact.whatsappNumber,
      facebookProfileUrl: contact.facebookProfileUrl,
    };
  });
}

export async function getPublicOptedInDonorContactTx(
  db: BloodSearchDatabase,
  targetDonorUid: string,
  ipHash: string
) {
  const cleanUid = assertCleanText(targetDonorUid, 'donorUid', 128, 2);
  return db.transaction(async (tx) => {
    const [profile] = await tx
      .select()
      .from(donorProfiles)
      .where(eq(donorProfiles.userUid, cleanUid))
      .limit(1);

    const [contact] = await tx
      .select()
      .from(privateContacts)
      .where(eq(privateContacts.userUid, cleanUid))
      .limit(1);

    if (!profile || !contact) {
      throw new DomainSecurityError(404, 'DONOR_CONTACT_NOT_FOUND', 'Donor contact record does not exist.');
    }

    if (
      profile.contactPreference === 'DND' ||
      profile.availabilityStatus === 'DND' ||
      contact.contactVisibility === 'DND_PRIVATE'
    ) {
      await writeAuditLog(tx, {
        actorUid: null,
        actorRole: 'ANONYMOUS',
        action: 'PUBLIC_OPTIN_CONTACT_BLOCKED_DND',
        targetEntityType: 'private_contacts',
        targetEntityId: cleanUid,
        outcome: 'DENIED',
        ipHash,
      });
      throw new DomainSecurityError(
        403,
        'DONOR_DND_PRIVATE',
        'Donor has enabled Do-Not-Disturb protection.'
      );
    }

    if (!profile.shareDirectContact || contact.contactVisibility !== 'PUBLIC_OPT_IN') {
      await writeAuditLog(tx, {
        actorUid: null,
        actorRole: 'ANONYMOUS',
        action: 'PUBLIC_OPTIN_CONTACT_CONSENT_REQUIRED',
        targetEntityType: 'private_contacts',
        targetEntityId: cleanUid,
        outcome: 'DENIED',
        ipHash,
      });
      throw new DomainSecurityError(
        403,
        'CONSENT_REQUIRED',
        'Donor requires authenticated consent before sharing direct contact.'
      );
    }

    await writeAuditLog(tx, {
      actorUid: null,
      actorRole: 'ANONYMOUS',
      action: 'PUBLIC_OPTIN_CONTACT_VIEWED',
      targetEntityType: 'private_contacts',
      targetEntityId: cleanUid,
      outcome: 'SUCCESS',
      ipHash,
      details: { contactPreference: profile.contactPreference },
    });

    const allowCall = profile.contactPreference !== 'WHATSAPP_ONLY' && profile.contactPreference !== 'IN_APP_ONLY';
    const allowWhatsApp = profile.contactPreference !== 'IN_APP_ONLY';
    const allowSms = profile.contactPreference !== 'WHATSAPP_ONLY' && profile.contactPreference !== 'IN_APP_ONLY';

    return {
      donorUid: cleanUid,
      publicName: profile.publicName,
      contactPreference: profile.contactPreference,
      phoneE164: allowCall || allowSms ? contact.phoneE164 : null,
      whatsappNumber: allowWhatsApp ? contact.whatsappNumber || contact.phoneE164 : null,
      facebookProfileUrl: contact.facebookProfileUrl,
      allowCall,
      allowWhatsApp,
      allowSms,
    };
  });
}

export async function requestDonorContactConsentTx(
  db: BloodSearchDatabase,
  actor: ResolvedActor,
  targetDonorUid: string,
  reason: string,
  relatedRequestId?: string
) {
  if (actor.uid === targetDonorUid) {
    throw new DomainSecurityError(400, 'SELF_CONSENT_INVALID', 'Cannot request contact consent from yourself.');
  }
  const cleanReason = assertCleanText(reason, 'reason', 300, 4);

  return db.transaction(async (tx) => {
    await ensureActorUserRowTx(tx, actor);

    const [consent] = await tx
      .insert(userConsents)
      .values({
        userUid: targetDonorUid,
        counterpartyUid: actor.uid,
        relatedRequestId: relatedRequestId || null,
        consentType: 'SEEKER_CONTACT_REQUEST',
        status: 'PENDING',
        reason: cleanReason,
      })
      .returning();

    await tx.insert(notifications).values({
      recipientUid: targetDonorUid,
      notificationType: 'CONTACT_REQUEST',
      title: 'জরুরি রক্তের যোগাযোগের অনুরোধ (Contact Request)',
      body: cleanReason,
      relatedRequestId: relatedRequestId || null,
      metadataJson: { consentId: consent.id, requesterUid: actor.uid },
    });

    await writeAuditLog(tx, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'CONTACT_CONSENT_REQUESTED',
      targetEntityType: 'user_consents',
      targetEntityId: consent.id,
      outcome: 'SUCCESS',
      ipHash: actor.ipHash,
      details: { targetDonorUid },
    });

    return consent;
  });
}

export async function respondDonorContactConsentTx(
  db: BloodSearchDatabase,
  actor: ResolvedActor,
  consentId: string,
  decision: 'GRANTED' | 'DENIED' | 'REVOKED'
) {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(userConsents).where(eq(userConsents.id, consentId)).limit(1);
    if (!existing) {
      throw new DomainSecurityError(404, 'CONSENT_NOT_FOUND', 'Consent request not found.');
    }

    // Strict IDOR protection: ONLY the donor who owns the private contact may grant/revoke consent
    if (existing.userUid !== actor.uid && !isAdminRole(actor.role)) {
      await writeAuditLog(tx, {
        actorUid: actor.uid,
        actorRole: actor.role,
        action: 'IDOR_CONSENT_DECISION_BLOCKED',
        targetEntityType: 'user_consents',
        targetEntityId: consentId,
        outcome: 'DENIED',
        ipHash: actor.ipHash,
      });
      throw new DomainSecurityError(403, 'FORBIDDEN_IDOR', 'Only the target donor can approve or revoke contact consent.');
    }

    const now = new Date();
    const expiresAt = decision === 'GRANTED' ? new Date(now.getTime() + 24 * 60 * 60 * 1000) : null;

    const [updated] = await tx
      .update(userConsents)
      .set({
        status: decision,
        grantedAt: decision === 'GRANTED' ? now : existing.grantedAt,
        revokedAt: decision === 'REVOKED' || decision === 'DENIED' ? now : null,
        expiresAt,
        updatedAt: now,
      })
      .where(eq(userConsents.id, consentId))
      .returning();

    if (existing.counterpartyUid) {
      await tx.insert(notifications).values({
        recipientUid: existing.counterpartyUid,
        notificationType: decision === 'GRANTED' ? 'CONTACT_APPROVED' : 'SYSTEM_SECURITY',
        title:
          decision === 'GRANTED'
            ? 'ডোনার যোগাযোগের অনুমতি দিয়েছেন (Contact Approved)'
            : 'যোগাযোগের অনুমতি আপডেট হয়েছে',
        body:
          decision === 'GRANTED'
            ? 'আপনি আগামী ২৪ ঘণ্টার জন্য ডোনারের ভেরিফায়েড নম্বর দেখতে পারবেন।'
            : 'ডোনার তার ব্যক্তিগত নম্বর গোপন রেখেছেন।',
        metadataJson: { consentId, decision },
      });
    }

    await writeAuditLog(tx, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: `CONTACT_CONSENT_${decision}`,
      targetEntityType: 'user_consents',
      targetEntityId: consentId,
      outcome: 'SUCCESS',
      ipHash: actor.ipHash,
    });

    return updated;
  });
}

// ============================================================================
// 4. TRANSACTIONAL EMERGENCY BLOOD REQUESTS, RESPONSES & TERMINAL STATE LOCKS
// ============================================================================
export interface CreateBloodRequestInput {
  patientName: string;
  bloodGroup: string;
  bagsNeeded: number;
  urgency: 'CRITICAL' | 'URGENT' | 'STANDARD';
  hospitalId?: string | null;
  hospitalName: string;
  district: string;
  area: string;
  latitude?: number | null;
  longitude?: number | null;
  clinicalReason?: string | null;
  contactName?: string | null;
  contactPhone: string;
  shareDirectContact?: boolean;
}

export async function createBloodRequestWithAlertsTx(
  db: BloodSearchDatabase,
  actor: ResolvedActor,
  input: CreateBloodRequestInput
) {
  const patientName = assertCleanText(input.patientName, 'patientName', 160, 2);
  const bloodGroup = assertBloodGroup(input.bloodGroup);
  const urgency = String(input.urgency || 'URGENT').trim().toUpperCase();
  if (!VALID_URGENCIES.has(urgency)) {
    throw new DomainSecurityError(400, 'INVALID_URGENCY', 'Urgency must be CRITICAL, URGENT, or STANDARD.');
  }

  const bagsNeeded = Number(input.bagsNeeded);
  if (!Number.isInteger(bagsNeeded) || bagsNeeded < 1 || bagsNeeded > 20) {
    throw new DomainSecurityError(400, 'INVALID_BAGS_NEEDED', 'Bags needed must be an integer between 1 and 20.');
  }

  const hospitalName = assertCleanText(input.hospitalName, 'hospitalName', 220, 2);
  const district = assertCleanText(input.district, 'district', 80, 2);
  const area = assertCleanText(input.area, 'area', 180, 2);
  const contactPhoneE164 = normalizeBangladeshPhone(input.contactPhone);
  const { lat, lng } = assertOptionalCoordinates(input.latitude, input.longitude);

  return db.transaction(async (tx) => {
    const now = new Date();

    // Ensure requester exists in `users`
    await tx
      .insert(users)
      .values({
        uid: actor.uid,
        email: actor.email,
        emailVerified: actor.emailVerified,
        displayName: input.contactName ? assertCleanText(input.contactName, 'contactName', 140, 2) : 'BloodSearch User',
        district,
        area,
      })
      .onConflictDoNothing({ target: users.uid });

    const [createdRequest] = await tx
      .insert(bloodRequests)
      .values({
        requesterUid: actor.uid,
        patientName,
        bloodGroup,
        bagsNeeded,
        urgency,
        status: 'ACTIVE',
        hospitalId: input.hospitalId || null,
        hospitalName,
        district,
        area,
        latitude: lat,
        longitude: lng,
        clinicalReason: input.clinicalReason ? assertCleanText(input.clinicalReason, 'clinicalReason', 500, 1) : null,
        contactName: input.contactName ? assertCleanText(input.contactName, 'contactName', 140, 1) : null,
        contactPhonePrivate: contactPhoneE164,
        shareDirectContact: Boolean(input.shareDirectContact),
        escalationLevel: 0,
        SearchRadiusKm: 5,
        expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      })
      .returning();

    // Find up to 25 compatible available donors in the same district (excluding requester) to dispatch initial SOS alerts
    const compatGroups = COMPATIBLE_DONOR_GROUPS_FOR_RECIPIENT[bloodGroup] || [bloodGroup];
    const matchedDonors = await tx
      .select({ userUid: donorProfiles.userUid })
      .from(donorProfiles)
      .where(
        and(
          inArray(donorProfiles.bloodGroup, compatGroups),
          sql`LOWER(${donorProfiles.district}) = LOWER(${district})`,
          eq(donorProfiles.isAvailable, true),
          ne(donorProfiles.userUid, actor.uid)
        )
      )
      .limit(25);

    if (matchedDonors.length > 0) {
      await tx.insert(emergencyAlerts).values(
        matchedDonors.map((d) => ({
          requestId: createdRequest.id,
          targetDonorUid: d.userUid,
          escalationLevel: 0,
          radiusKm: 5,
          channel: 'IN_APP',
          alertState: 'DISPATCHED',
        }))
      );

      await tx.insert(notifications).values(
        matchedDonors.map((d) => ({
          recipientUid: d.userUid,
          notificationType: 'SOS_MATCH',
          title: `জরুরি ${bloodGroup} রক্ত প্রয়োজন (${district})`,
          body: `${hospitalName}-এ ${bagsNeeded} ব্যাগ ${bloodGroup} রক্ত প্রয়োজন।`,
          relatedRequestId: createdRequest.id,
          metadataJson: { urgency, bloodGroup, district },
        }))
      );
    }

    await writeAuditLog(tx, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'SOS_REQUEST_CREATED',
      targetEntityType: 'blood_requests',
      targetEntityId: createdRequest.id,
      outcome: 'SUCCESS',
      ipHash: actor.ipHash,
      details: {
        bloodGroup,
        urgency,
        district,
        alertsDispatched: matchedDonors.length,
      },
    });

    return {
      request: sanitizeBloodRequestForCaller(createdRequest, actor),
      alertsDispatched: matchedDonors.length,
    };
  });
}

export function sanitizeBloodRequestForCaller(
  reqRow: typeof bloodRequests.$inferSelect,
  actor: ResolvedActor | null
) {
  const isOwner = Boolean(actor && actor.uid === reqRow.requesterUid);
  const isAdmin = Boolean(actor && isAdminRole(actor.role));
  const revealPhone = isOwner || isAdmin || (reqRow.shareDirectContact && reqRow.status === 'ACTIVE');

  return {
    id: reqRow.id,
    requesterUid: reqRow.requesterUid,
    patientName: reqRow.patientName,
    bloodGroup: reqRow.bloodGroup,
    bagsNeeded: reqRow.bagsNeeded,
    bagsFulfilled: reqRow.bagsFulfilled,
    urgency: reqRow.urgency,
    status: reqRow.status,
    hospitalId: reqRow.hospitalId,
    hospitalName: reqRow.hospitalName,
    district: reqRow.district,
    area: reqRow.area,
    latitude: reqRow.latitude,
    longitude: reqRow.longitude,
    clinicalReason: reqRow.clinicalReason,
    requisitionSlipVerified: reqRow.requisitionSlipVerified,
    contactName: reqRow.contactName,
    contactPhone: revealPhone ? reqRow.contactPhonePrivate : null,
    maskedContactPhone: maskBangladeshPhone(reqRow.contactPhonePrivate),
    shareDirectContact: reqRow.shareDirectContact,
    escalationLevel: reqRow.escalationLevel,
    searchRadiusKm: reqRow.SearchRadiusKm,
    respondersCount: reqRow.respondersCount,
    resolvedAt: reqRow.resolvedAt,
    createdAt: reqRow.createdAt,
  };
}

export async function listBloodRequestsPaginated(
  db: BloodSearchDatabase,
  actor: ResolvedActor | null,
  filters: { status?: string; bloodGroup?: string; district?: string; page?: number; limit?: number }
) {
  const page = Math.max(1, Math.floor(Number(filters.page) || 1));
  const limit = Math.min(50, Math.max(1, Math.floor(Number(filters.limit) || 20)));
  const offset = (page - 1) * limit;

  const conds = [];
  if (filters.status && filters.status.toUpperCase() !== 'ALL') {
    const st = String(filters.status).toUpperCase();
    if (!['ACTIVE', 'FULFILLED', 'CANCELLED', 'EXPIRED'].includes(st)) {
      throw new DomainSecurityError(400, 'INVALID_STATUS_FILTER', 'Invalid request status filter.');
    }
    conds.push(eq(bloodRequests.status, st));
  }
  if (filters.bloodGroup && filters.bloodGroup.toUpperCase() !== 'ALL') {
    conds.push(eq(bloodRequests.bloodGroup, assertBloodGroup(filters.bloodGroup)));
  }
  if (filters.district && filters.district.toUpperCase() !== 'ALL') {
    const dist = assertCleanText(filters.district, 'district', 80, 1);
    conds.push(sql`LOWER(${bloodRequests.district}) = LOWER(${dist})`);
  }

  const whereClause = conds.length > 0 ? and(...conds) : undefined;
  const [{ totalCount }] = await db.select({ totalCount: count() }).from(bloodRequests).where(whereClause);
  const rows = await db
    .select()
    .from(bloodRequests)
    .where(whereClause)
    .orderBy(desc(bloodRequests.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    items: rows.map((r) => sanitizeBloodRequestForCaller(r, actor)),
    pagination: {
      page,
      limit,
      totalItems: Number(totalCount),
      totalPages: Math.max(1, Math.ceil(Number(totalCount) / limit)),
    },
  };
}

export async function respondToBloodRequestTx(
  db: BloodSearchDatabase,
  actor: ResolvedActor,
  requestId: string,
  payload: { responseStatus: 'ACCEPTED' | 'EN_ROUTE' | 'ARRIVED' | 'DECLINED'; etaMinutes?: number; note?: string }
) {
  return db.transaction(async (tx) => {
    const [reqRow] = await tx.select().from(bloodRequests).where(eq(bloodRequests.id, requestId)).limit(1);
    if (!reqRow) {
      throw new DomainSecurityError(404, 'REQUEST_NOT_FOUND', 'Blood request does not exist.');
    }
    if (reqRow.status !== 'ACTIVE') {
      throw new DomainSecurityError(409, 'REQUEST_NOT_ACTIVE', `Cannot respond to a ${reqRow.status} blood request.`);
    }
    if (reqRow.requesterUid === actor.uid) {
      throw new DomainSecurityError(400, 'CANNOT_RESPOND_OWN_REQUEST', 'Requester cannot respond as donor to own request.');
    }

    const [donor] = await tx.select().from(donorProfiles).where(eq(donorProfiles.userUid, actor.uid)).limit(1);
    if (!donor) {
      throw new DomainSecurityError(400, 'DONOR_PROFILE_REQUIRED', 'Complete your donor profile before accepting an SOS request.');
    }

    const [resp] = await tx
      .insert(requestResponses)
      .values({
        requestId,
        donorUid: actor.uid,
        donorName: donor.publicName,
        donorBloodGroup: donor.bloodGroup,
        responseStatus: payload.responseStatus,
        etaMinutes: payload.etaMinutes ?? null,
        note: payload.note ? assertCleanText(payload.note, 'note', 280, 1) : null,
      })
      .onConflictDoUpdate({
        target: [requestResponses.requestId, requestResponses.donorUid],
        set: {
          responseStatus: payload.responseStatus,
          etaMinutes: payload.etaMinutes ?? null,
          note: payload.note ? assertCleanText(payload.note, 'note', 280, 1) : null,
          updatedAt: new Date(),
        },
      })
      .returning();

    const [{ activeCount }] = await tx
      .select({ activeCount: count() })
      .from(requestResponses)
      .where(
        and(
          eq(requestResponses.requestId, requestId),
          inArray(requestResponses.responseStatus, ['ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'DONATED'])
        )
      );

    await tx
      .update(bloodRequests)
      .set({ respondersCount: Number(activeCount), updatedAt: new Date() })
      .where(eq(bloodRequests.id, requestId));

    await tx.insert(notifications).values({
      recipientUid: reqRow.requesterUid,
      notificationType: 'SOS_MATCH',
      title: `${donor.publicName} (${donor.bloodGroup}) সাড়া দিয়েছেন`,
      body: `স্ট্যাটাস: ${payload.responseStatus}`,
      relatedRequestId: requestId,
    });

    await writeAuditLog(tx, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: `SOS_RESPONSE_${payload.responseStatus}`,
      targetEntityType: 'blood_requests',
      targetEntityId: requestId,
      outcome: 'SUCCESS',
      ipHash: actor.ipHash,
    });

    return resp;
  });
}

/**
 * Enforces strict emergency request state transitions inside a PostgreSQL ACID transaction:
 *  - Only owner or verified Admin can transition state (blocks IDOR).
 *  - Terminal states (FULFILLED, CANCELLED, EXPIRED) are immutable and cannot be re-opened or transitioned again.
 *  - Atomically stops all open `emergency_alerts` and `live_donor_trips` upon resolution.
 *  - Records verified `donations` and places donor into 90-day medical cooldown when FULFILLED with `fulfilledByDonorUid`.
 */
export async function transitionBloodRequestStateTx(
  db: BloodSearchDatabase,
  actor: ResolvedActor,
  requestId: string,
  transition: {
    nextStatus: 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
    reason?: string;
    fulfilledByDonorUid?: string;
    unitsDonated?: number;
  }
) {
  if (!TERMINAL_REQUEST_STATES.has(transition.nextStatus)) {
    throw new DomainSecurityError(400, 'INVALID_TARGET_STATE', 'Target status must be FULFILLED, CANCELLED, or EXPIRED.');
  }

  return db.transaction(async (tx) => {
    const [reqRow] = await tx.select().from(bloodRequests).where(eq(bloodRequests.id, requestId)).limit(1);
    if (!reqRow) {
      throw new DomainSecurityError(404, 'REQUEST_NOT_FOUND', 'Blood request not found.');
    }

    if (reqRow.requesterUid !== actor.uid && !isAdminRole(actor.role)) {
      await writeAuditLog(tx, {
        actorUid: actor.uid,
        actorRole: actor.role,
        action: 'IDOR_REQUEST_STATE_CHANGE_BLOCKED',
        targetEntityType: 'blood_requests',
        targetEntityId: requestId,
        outcome: 'DENIED',
        ipHash: actor.ipHash,
      });
      throw new DomainSecurityError(
        403,
        'FORBIDDEN_NOT_OWNER',
        'Only the request creator or an authorized administrator can change this request status.'
      );
    }

    if (TERMINAL_REQUEST_STATES.has(reqRow.status)) {
      throw new DomainSecurityError(
        409,
        'INVALID_TERMINAL_TRANSITION',
        `Request is already in terminal state ${reqRow.status} and cannot transition to ${transition.nextStatus}.`
      );
    }

    const now = new Date();
    const [updatedRequest] = await tx
      .update(bloodRequests)
      .set({
        status: transition.nextStatus,
        bagsFulfilled: transition.nextStatus === 'FULFILLED' ? reqRow.bagsNeeded : reqRow.bagsFulfilled,
        resolvedByUid: actor.uid,
        resolvedAt: now,
        resolutionReason: transition.reason ? assertCleanText(transition.reason, 'reason', 160, 1) : transition.nextStatus,
        updatedAt: now,
      })
      .where(eq(bloodRequests.id, requestId))
      .returning();

    // Immediately halt all active emergency alerts for this request
    const haltedAlerts = await tx
      .update(emergencyAlerts)
      .set({
        alertState: 'STOPPED_RESOLVED',
        stoppedAt: now,
      })
      .where(
        and(
          eq(emergencyAlerts.requestId, requestId),
          inArray(emergencyAlerts.alertState, ['DISPATCHED', 'DELIVERED'])
        )
      )
      .returning();

    // Stop any live donor trips attached to this request
    await tx
      .update(liveDonorTrips)
      .set({
        tripStatus: transition.nextStatus === 'FULFILLED' ? 'COMPLETED' : 'STOPPED',
        updatedAt: now,
      })
      .where(and(eq(liveDonorTrips.requestId, requestId), eq(liveDonorTrips.tripStatus, 'EN_ROUTE')));

    let recordedDonation = null;
    if (transition.nextStatus === 'FULFILLED' && transition.fulfilledByDonorUid) {
      const units = Math.min(4, Math.max(1, Number(transition.unitsDonated) || 1));
      const cooldownUntil = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90-day medical recovery window
      const certCode = `CERT-${now.getUTCFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      const [donationRow] = await tx
        .insert(donations)
        .values({
          donorUid: transition.fulfilledByDonorUid,
          requestId,
          hospitalId: reqRow.hospitalId,
          hospitalName: reqRow.hospitalName,
          bloodGroup: reqRow.bloodGroup,
          unitsDonated: units,
          donatedAt: now,
          cooldownUntil,
          verifiedByUid: actor.uid,
          certificateCode: certCode,
        })
        .returning();
      recordedDonation = donationRow;

      await tx
        .update(donorProfiles)
        .set({
          totalDonations: sql`${donorProfiles.totalDonations} + 1`,
          lastDonationDate: now,
          nextEligibleDate: cooldownUntil,
          availabilityStatus: 'COOLDOWN',
          isAvailable: false,
          updatedAt: now,
        })
        .where(eq(donorProfiles.userUid, transition.fulfilledByDonorUid));
    }

    await writeAuditLog(tx, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: `REQUEST_TRANSITION_${transition.nextStatus}`,
      targetEntityType: 'blood_requests',
      targetEntityId: requestId,
      outcome: 'SUCCESS',
      ipHash: actor.ipHash,
      details: {
        previousStatus: reqRow.status,
        nextStatus: transition.nextStatus,
        haltedAlertsCount: haltedAlerts.length,
        recordedDonationId: recordedDonation?.id || null,
      },
    });

    return {
      request: sanitizeBloodRequestForCaller(updatedRequest, actor),
      haltedAlertsCount: haltedAlerts.length,
      donation: recordedDonation,
    };
  });
}

export async function escalateBloodRequestTx(db: BloodSearchDatabase, actor: ResolvedActor, requestId: string) {
  return db.transaction(async (tx) => {
    const [reqRow] = await tx.select().from(bloodRequests).where(eq(bloodRequests.id, requestId)).limit(1);
    if (!reqRow) {
      throw new DomainSecurityError(404, 'REQUEST_NOT_FOUND', 'Blood request not found.');
    }
    if (reqRow.requesterUid !== actor.uid && !isAdminRole(actor.role)) {
      throw new DomainSecurityError(403, 'FORBIDDEN_NOT_OWNER', 'Only the request owner or Admin can escalate an SOS alert.');
    }
    if (reqRow.status !== 'ACTIVE') {
      throw new DomainSecurityError(
        409,
        'CANNOT_ESCALATE_TERMINAL_REQUEST',
        `Cannot escalate request in ${reqRow.status} state.`
      );
    }
    if (reqRow.escalationLevel >= 4) {
      throw new DomainSecurityError(409, 'MAX_ESCALATION_REACHED', 'Request has already reached maximum nationwide tier (Level 4).');
    }

    const nextLevel = reqRow.escalationLevel + 1;
    const nextRadiusKm = ESCALATION_RADIUS_BY_LEVEL[nextLevel] || 500;

    const [updated] = await tx
      .update(bloodRequests)
      .set({
        escalationLevel: nextLevel,
        SearchRadiusKm: nextRadiusKm,
        updatedAt: new Date(),
      })
      .where(eq(bloodRequests.id, requestId))
      .returning();

    await writeAuditLog(tx, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'SOS_ESCALATED',
      targetEntityType: 'blood_requests',
      targetEntityId: requestId,
      outcome: 'SUCCESS',
      ipHash: actor.ipHash,
      details: { escalationLevel: nextLevel, radiusKm: nextRadiusKm },
    });

    return sanitizeBloodRequestForCaller(updated, actor);
  });
}

// ============================================================================
// 5. ADMIN & SUPER ADMIN OPERATIONS (BLOOD INVENTORY, RBAC, AUDIT LOGS)
// ============================================================================
export async function updateBloodInventoryTx(
  db: BloodSearchDatabase,
  actor: ResolvedActor,
  input: {
    bloodBankCode: string;
    bloodBankName: string;
    district: string;
    address: string;
    contactPhone: string;
    bloodGroup: string;
    componentType?: 'WHOLE_BLOOD' | 'PACKED_RBC' | 'PLATELETS' | 'PLASMA';
    unitsAvailable: number;
    criticalThreshold?: number;
  }
) {
  if (!isAdminRole(actor.role)) {
    await writeAuditLog(db, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'UNAUTHORIZED_INVENTORY_UPDATE',
      targetEntityType: 'blood_inventory',
      targetEntityId: input.bloodBankCode || 'unknown',
      outcome: 'DENIED',
      ipHash: actor.ipHash,
    });
    throw new DomainSecurityError(403, 'ADMIN_REQUIRED', 'Only verified Admins can modify blood bank inventory.');
  }

  const bloodGroup = assertBloodGroup(input.bloodGroup);
  const unitsAvailable = Number(input.unitsAvailable);
  const criticalThreshold = Number(input.criticalThreshold ?? 5);
  if (!Number.isInteger(unitsAvailable) || unitsAvailable < 0 || !Number.isInteger(criticalThreshold) || criticalThreshold < 0) {
    throw new DomainSecurityError(400, 'INVALID_INVENTORY_UNITS', 'Units available and threshold must be non-negative integers.');
  }

  const stockStatus =
    unitsAvailable === 0
      ? 'OUT_OF_STOCK'
      : unitsAvailable <= criticalThreshold
        ? 'CRITICAL'
        : unitsAvailable <= criticalThreshold * 2
          ? 'LOW'
          : 'ADEQUATE';

  const componentType = input.componentType || 'WHOLE_BLOOD';

  return db.transaction(async (tx) => {
    await ensureActorUserRowTx(tx, actor);

    const [bank] = await tx
      .insert(bloodBanks)
      .values({
        code: assertCleanText(input.bloodBankCode, 'bloodBankCode', 64, 2).toUpperCase(),
        name: assertCleanText(input.bloodBankName, 'bloodBankName', 200, 2),
        district: assertCleanText(input.district, 'district', 80, 2),
        address: assertCleanText(input.address, 'address', 300, 2),
        contactPhone: assertCleanText(input.contactPhone, 'contactPhone', 32, 3),
      })
      .onConflictDoUpdate({
        target: bloodBanks.code,
        set: {
          name: assertCleanText(input.bloodBankName, 'bloodBankName', 200, 2),
          updatedAt: new Date(),
        },
      })
      .returning();

    const [inv] = await tx
      .insert(bloodInventory)
      .values({
        bloodBankId: bank.id,
        bloodGroup,
        componentType,
        unitsAvailable,
        criticalThreshold,
        stockStatus,
        updatedByUid: actor.uid,
      })
      .onConflictDoUpdate({
        target: [bloodInventory.bloodBankId, bloodInventory.bloodGroup, bloodInventory.componentType],
        set: {
          unitsAvailable,
          criticalThreshold,
          stockStatus,
          updatedByUid: actor.uid,
          updatedAt: new Date(),
        },
      })
      .returning();

    await writeAuditLog(tx, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'BLOOD_INVENTORY_UPDATED',
      targetEntityType: 'blood_inventory',
      targetEntityId: inv.id,
      outcome: 'SUCCESS',
      ipHash: actor.ipHash,
      details: {
        bloodBankCode: bank.code,
        bloodGroup,
        unitsAvailable,
        stockStatus,
      },
    });

    return { bank, inventory: inv };
  });
}

export async function listBloodInventory(db: BloodSearchDatabase, district?: string) {
  const rows = await db
    .select({
      inventoryId: bloodInventory.id,
      bankCode: bloodBanks.code,
      bankName: bloodBanks.name,
      district: bloodBanks.district,
      contactPhone: bloodBanks.contactPhone,
      bloodGroup: bloodInventory.bloodGroup,
      componentType: bloodInventory.componentType,
      unitsAvailable: bloodInventory.unitsAvailable,
      criticalThreshold: bloodInventory.criticalThreshold,
      stockStatus: bloodInventory.stockStatus,
      updatedAt: bloodInventory.updatedAt,
    })
    .from(bloodInventory)
    .innerJoin(bloodBanks, eq(bloodInventory.bloodBankId, bloodBanks.id))
    .where(district ? sql`LOWER(${bloodBanks.district}) = LOWER(${assertCleanText(district, 'district', 80, 1)})` : undefined)
    .orderBy(asc(bloodBanks.district), asc(bloodInventory.bloodGroup));

  return rows;
}

export async function manageAdminRoleTx(
  db: BloodSearchDatabase,
  actor: ResolvedActor,
  target: {
    targetUid: string;
    targetEmail: string;
    role: 'CO_ADMIN' | 'MODERATOR';
    isActive: boolean;
    permissions?: string[];
  }
) {
  // STRICT SUPER ADMIN GUARD: Co-Admins can NEVER promote, demote, or grant admin roles
  if (actor.role !== 'SUPER_ADMIN') {
    await writeAuditLog(db, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'PRIVILEGE_ESCALATION_BLOCKED',
      targetEntityType: 'admin_roles',
      targetEntityId: target.targetUid,
      outcome: 'DENIED',
      ipHash: actor.ipHash,
    });
    throw new DomainSecurityError(
      403,
      'SUPER_ADMIN_REQUIRED',
      'Strictly restricted to Super Owner. Co-Admins cannot grant or revoke administrative roles.'
    );
  }

  const cleanEmail = assertCleanText(target.targetEmail, 'targetEmail', 255, 5).toLowerCase();
  const targetUid = assertCleanText(target.targetUid, 'targetUid', 128, 3);

  return db.transaction(async (tx) => {
    await ensureActorUserRowTx(tx, actor);

    await tx
      .insert(users)
      .values({
        uid: targetUid,
        email: cleanEmail,
        emailVerified: true,
        displayName: cleanEmail.split('@')[0] || 'Admin User',
      })
      .onConflictDoNothing({ target: users.uid });

    const now = new Date();
    const [roleRecord] = await tx
      .insert(adminRoles)
      .values({
        userUid: targetUid,
        email: cleanEmail,
        role: target.role,
        permissionsJson: target.permissions || ['MANAGE_REQUESTS', 'VERIFY_DONORS', 'MANAGE_INVENTORY'],
        isActive: target.isActive,
        grantedByUid: actor.uid,
        revokedByUid: target.isActive ? null : actor.uid,
        revokedAt: target.isActive ? null : now,
      })
      .onConflictDoUpdate({
        target: adminRoles.userUid,
        set: {
          role: target.role,
          permissionsJson: target.permissions || ['MANAGE_REQUESTS', 'VERIFY_DONORS', 'MANAGE_INVENTORY'],
          isActive: target.isActive,
          revokedByUid: target.isActive ? null : actor.uid,
          revokedAt: target.isActive ? null : now,
          updatedAt: now,
        },
      })
      .returning();

    await writeAuditLog(tx, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: target.isActive ? 'ADMIN_ROLE_GRANTED' : 'ADMIN_ROLE_REVOKED',
      targetEntityType: 'admin_roles',
      targetEntityId: targetUid,
      outcome: 'SUCCESS',
      ipHash: actor.ipHash,
      details: { role: target.role, isActive: target.isActive },
    });

    return roleRecord;
  });
}

export async function upsertDeviceTokenTx(
  db: BloodSearchDatabase,
  actor: ResolvedActor,
  payload: { fcmToken: string; platform: 'WEB_PWA' | 'ANDROID_APK' | 'IOS_WEB'; deviceLabel?: string }
) {
  const token = assertCleanText(payload.fcmToken, 'fcmToken', 2048, 16);
  if (!['WEB_PWA', 'ANDROID_APK', 'IOS_WEB'].includes(payload.platform)) {
    throw new DomainSecurityError(400, 'INVALID_PLATFORM', 'Platform must be WEB_PWA, ANDROID_APK, or IOS_WEB.');
  }

  return db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({
        uid: actor.uid,
        email: actor.email,
        emailVerified: actor.emailVerified,
        displayName: actor.email?.split('@')[0] || 'BloodSearch User',
      })
      .onConflictDoNothing({ target: users.uid });

    const [saved] = await tx
      .insert(deviceTokens)
      .values({
        userUid: actor.uid,
        fcmToken: token,
        platform: payload.platform,
        deviceLabel: payload.deviceLabel ? assertCleanText(payload.deviceLabel, 'deviceLabel', 140, 1) : null,
        isActive: true,
        lastSeenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: deviceTokens.fcmToken,
        set: {
          userUid: actor.uid,
          platform: payload.platform,
          isActive: true,
          lastSeenAt: new Date(),
        },
      })
      .returning();

    return saved;
  });
}

export async function recordLoginSessionTx(
  db: BloodSearchDatabase,
  actor: ResolvedActor,
  payload: {
    rawTokenFragment: string;
    authMethod: 'GOOGLE_OAUTH' | 'EMAIL_PASSWORD' | 'PHONE_OTP' | 'ADMIN_CONSOLE';
    userAgent?: string;
    isAdminConsole?: boolean;
  }
) {
  if (payload.isAdminConsole && !isAdminRole(actor.role)) {
    await writeAuditLog(db, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: 'ADMIN_CONSOLE_SESSION_DENIED',
      targetEntityType: 'login_sessions',
      targetEntityId: actor.uid,
      outcome: 'DENIED',
      ipHash: actor.ipHash,
    });
    throw new DomainSecurityError(403, 'ADMIN_CONSOLE_FORBIDDEN', 'Unauthorized user cannot establish an Admin Console session.');
  }

  const tokenHash = hashIdentifier(`${actor.uid}:${payload.rawTokenFragment}`);

  return db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({
        uid: actor.uid,
        email: actor.email,
        emailVerified: actor.emailVerified,
        displayName: actor.email?.split('@')[0] || 'BloodSearch User',
      })
      .onConflictDoNothing({ target: users.uid });

    const expiresAt = new Date(Date.now() + (payload.isAdminConsole ? 4 : 24) * 60 * 60 * 1000);
    const [session] = await tx
      .insert(loginSessions)
      .values({
        userUid: actor.uid,
        sessionTokenHash: tokenHash,
        authMethod: payload.authMethod,
        ipHash: actor.ipHash,
        userAgentSummary: payload.userAgent ? String(payload.userAgent).slice(0, 250) : null,
        isAdminConsole: Boolean(payload.isAdminConsole),
        expiresAt,
      })
      .onConflictDoUpdate({
        target: loginSessions.sessionTokenHash,
        set: {
          lastActiveAt: new Date(),
          expiresAt,
          isRevoked: false,
        },
      })
      .returning();

    await writeAuditLog(tx, {
      actorUid: actor.uid,
      actorRole: actor.role,
      action: payload.isAdminConsole ? 'ADMIN_CONSOLE_LOGIN' : 'USER_SESSION_RECORDED',
      targetEntityType: 'login_sessions',
      targetEntityId: session.id,
      outcome: 'SUCCESS',
      ipHash: actor.ipHash,
    });

    return session;
  });
}

export async function queryAuditLogsPaginated(
  db: BloodSearchDatabase,
  actor: ResolvedActor,
  page = 1,
  limit = 25
) {
  if (!isAdminRole(actor.role)) {
    throw new DomainSecurityError(403, 'ADMIN_REQUIRED', 'Only verified Admins can view PostgreSQL security audit logs.');
  }
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  const offset = (safePage - 1) * safeLimit;

  const [{ totalCount }] = await db.select({ totalCount: count() }).from(auditLogs);
  const items = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.id))
    .limit(safeLimit)
    .offset(offset);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      totalItems: Number(totalCount),
      totalPages: Math.max(1, Math.ceil(Number(totalCount) / safeLimit)),
    },
  };
}

export async function listHospitalsByDistrict(db: BloodSearchDatabase, district?: string) {
  return db
    .select()
    .from(hospitals)
    .where(district ? sql`LOWER(${hospitals.district}) = LOWER(${assertCleanText(district, 'district', 80, 1)})` : undefined)
    .orderBy(asc(hospitals.district), asc(hospitals.nameEn))
    .limit(100);
}
