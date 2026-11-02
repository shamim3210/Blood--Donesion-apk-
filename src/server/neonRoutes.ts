import { Router, type Request, type Response } from 'express';
import { ensureMainPostgresReady, type BloodSearchDatabase } from '../db/index.ts';
import { evaluateNeonHealthAndLimits } from '../db/neonMonitor.ts';
import {
  createBloodRequestWithAlertsTx,
  DomainSecurityError,
  escalateBloodRequestTx,
  getAuthorizedDonorPrivateContactTx,
  getPublicOptedInDonorContactTx,
  isAdminRole,
  listBloodInventory,
  listBloodRequestsPaginated,
  listHospitalsByDistrict,
  manageAdminRoleTx,
  queryAuditLogsPaginated,
  recordLoginSessionTx,
  requestDonorContactConsentTx,
  resolveActorRole,
  respondDonorContactConsentTx,
  respondToBloodRequestTx,
  searchPublicDonorsPaginated,
  transitionBloodRequestStateTx,
  updateBloodInventoryTx,
  upsertDeviceTokenTx,
  upsertUserAndDonorProfileTx,
  writeAuditLog,
  type AuthenticatedActor,
  type ResolvedActor,
} from '../db/repositories/bloodSearchRepo.ts';
import { extractHashedClientIp, verifyServerFirebaseIdentity } from './firebaseAuthVerifier.ts';

export interface NeonApiRouterOptions {
  verifyActorOverride?: (token: string) => Promise<AuthenticatedActor | null>;
}

/**
 * Dedicated Express `/api/v1` router backed by Neon PostgreSQL (or server-isolated PG16 fallback) + Drizzle ORM.
 * Enforces:
 *  - Per-IP & per-UID sliding-window rate limiting + Admin brute-force lockout
 *  - Server-side Firebase ID Token authentication & DB-backed RBAC
 *  - Strict separation of public donor profiles vs `private_contacts`
 *  - Parameterized SQL queries & ACID database transactions
 */
export function createNeonApiRouter(options?: NeonApiRouterOptions): Router {
  const router = Router();
  const rateBuckets = new Map<string, number[]>();
  const adminFailureBuckets = new Map<string, number[]>();

  const enforceRateLimit = (
    res: Response,
    bucketKey: string,
    maxRequests: number,
    windowMs: number
  ): boolean => {
    const now = Date.now();
    const history = (rateBuckets.get(bucketKey) || []).filter((ts) => now - ts < windowMs);
    if (history.length >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - (history[0] || now))) / 1000));
      rateBuckets.set(bucketKey, history);
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        ok: false,
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait before retrying.',
        retryAfterSec,
      });
      return false;
    }
    history.push(now);
    rateBuckets.set(bucketKey, history);
    return true;
  };

  const checkAdminLockout = (res: Response, key: string): boolean => {
    const windowMs = 15 * 60_000;
    const now = Date.now();
    const failures = (adminFailureBuckets.get(key) || []).filter((ts) => now - ts < windowMs);
    adminFailureBuckets.set(key, failures);
    if (failures.length >= 5) {
      const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - (failures[0] || now))) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        ok: false,
        code: 'ADMIN_BRUTE_FORCE_LOCKED',
        message: 'Too many unauthorized admin attempts. Access temporarily locked.',
        retryAfterSec,
      });
      return false;
    }
    return true;
  };

  const recordAdminFailure = (key: string) => {
    const windowMs = 15 * 60_000;
    const now = Date.now();
    const failures = (adminFailureBuckets.get(key) || []).filter((ts) => now - ts < windowMs);
    failures.push(now);
    adminFailureBuckets.set(key, failures);
  };

  const requireDatabase = async (res: Response): Promise<BloodSearchDatabase | null> => {
    const { db } = await ensureMainPostgresReady();
    if (!db) {
      res.status(503).json({
        ok: false,
        code: 'NEON_DATABASE_UNCONFIGURED',
        message: 'Primary PostgreSQL database is temporarily unavailable.',
      });
      return null;
    }
    return db;
  };

  const requireAuthenticatedActor = async (
    req: Request,
    res: Response,
    db: BloodSearchDatabase
  ): Promise<ResolvedActor | null> => {
    const verified = await verifyServerFirebaseIdentity(req, options?.verifyActorOverride);
    if (!verified) {
      res.status(401).json({
        ok: false,
        code: 'UNAUTHENTICATED',
        message: 'Valid Firebase Authentication Bearer token is required.',
      });
      return null;
    }
    return resolveActorRole(db, verified);
  };

  const handleRouteError = (res: Response, err: unknown) => {
    if (err instanceof DomainSecurityError) {
      res.status(err.httpStatus).json({
        ok: false,
        code: err.code,
        message: err.message,
      });
      return;
    }
    // Never leak internal SQL details, table names, or connection strings to clients
    console.error(
      '[NeonApiRouter] Unhandled database/API error:',
      err instanceof Error ? err.name : 'UnknownError'
    );
    res.status(500).json({
      ok: false,
      code: 'INTERNAL_DATABASE_ERROR',
      message: 'An unexpected server error occurred while processing the request.',
    });
  };

  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    next();
  });

  // --------------------------------------------------------------------------
  // 1. NEON / MAIN POSTGRES HEALTH & RESOURCE MONITOR
  //    Public gets sanitized status; full storage/plan telemetry requires Admin
  // --------------------------------------------------------------------------
  router.get('/db/health', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `dbhealth:${ipHash}`, 30, 60_000)) return;

    try {
      const { db, info } = await ensureMainPostgresReady();
      const report = await evaluateNeonHealthAndLimits(db, info);

      let isAdmin = false;
      if (db) {
        const verified = await verifyServerFirebaseIdentity(req, options?.verifyActorOverride);
        if (verified) {
          const actor = await resolveActorRole(db, verified);
          isAdmin = isAdminRole(actor.role);
        }
      }

      if (!isAdmin) {
        res.json({
          ok: report.status === 'HEALTHY' || report.status === 'WARNING',
          status: report.status,
          cutoverMode: report.cutoverMode,
          configured: report.connection.configured,
          activeGeoStrategy: report.capabilities.activeGeoStrategy,
          checkedAtIso: report.checkedAtIso,
        });
        return;
      }

      res.json({ ok: true, report });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  // --------------------------------------------------------------------------
  // 1B. SERVER-AUTHORITATIVE ADMIN VERIFICATION & BRUTE-FORCE SHIELD
  //     Never leaks owner email or internal admin identifiers in responses
  // --------------------------------------------------------------------------
  router.get('/auth/admin-verify', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `adminverify:${ipHash}`, 15, 60_000)) return;
    if (!checkAdminLockout(res, `adminlock:ip:${ipHash}`)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const verified = await verifyServerFirebaseIdentity(req, options?.verifyActorOverride);
      if (!verified) {
        recordAdminFailure(`adminlock:ip:${ipHash}`);
        res.status(401).json({
          ok: false,
          isAdmin: false,
          code: 'UNAUTHENTICATED',
          message: 'Valid authentication token is required.',
        });
        return;
      }

      if (!checkAdminLockout(res, `adminlock:uid:${verified.uid}`)) return;

      const actor = await resolveActorRole(db, verified);
      const granted = isAdminRole(actor.role);

      if (!granted) {
        recordAdminFailure(`adminlock:ip:${ipHash}`);
        recordAdminFailure(`adminlock:uid:${actor.uid}`);
        await writeAuditLog(db, {
          actorUid: actor.uid,
          actorRole: actor.role,
          action: 'ADMIN_CONSOLE_UNAUTHORIZED_ATTEMPT',
          targetEntityType: 'admin_roles',
          targetEntityId: actor.uid,
          outcome: 'DENIED',
          ipHash,
        });
        res.status(200).json({
          ok: true,
          isAdmin: false,
          isSuperAdmin: false,
          role: 'USER',
          code: 'FORBIDDEN_ADMIN_ONLY',
          message: 'Account is not authorized for Admin Console access.',
        });
        return;
      }

      await writeAuditLog(db, {
        actorUid: actor.uid,
        actorRole: actor.role,
        action: 'ADMIN_CONSOLE_VERIFIED',
        targetEntityType: 'admin_roles',
        targetEntityId: actor.uid,
        outcome: 'SUCCESS',
        ipHash,
      });

      res.json({
        ok: true,
        isAdmin: true,
        isSuperAdmin: actor.role === 'SUPER_ADMIN',
        role: actor.role,
      });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  // --------------------------------------------------------------------------
  // 2. PUBLIC PAGINATED & GEOSPATIAL DONOR SEARCH (ZERO RAW PHONE NUMBERS)
  // --------------------------------------------------------------------------
  router.get('/donors/search', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `donorsearch:${ipHash}`, 60, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const result = await searchPublicDonorsPaginated(db, {
        bloodGroup: req.query.bloodGroup ? String(req.query.bloodGroup) : undefined,
        includeCompatible: req.query.includeCompatible === 'true',
        district: req.query.district ? String(req.query.district) : undefined,
        areaQuery: req.query.q ? String(req.query.q) : undefined,
        availableOnly: req.query.availableOnly !== 'false',
        latitude: req.query.lat !== undefined ? Number(req.query.lat) : undefined,
        longitude: req.query.lng !== undefined ? Number(req.query.lng) : undefined,
        radiusKm: req.query.radiusKm !== undefined ? Number(req.query.radiusKm) : undefined,
        page: req.query.page !== undefined ? Number(req.query.page) : 1,
        limit: req.query.limit !== undefined ? Number(req.query.limit) : 20,
      });

      res.json({ ok: true, ...result });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  // --------------------------------------------------------------------------
  // 3. DONOR PROFILE + PRIVATE CONTACT REGISTRATION / UPDATE (AUTHENTICATED)
  //    Explicitly ignores any client-sent `role` or `isAdmin` fields
  // --------------------------------------------------------------------------
  router.post('/donors/profile', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `donorupsert:${ipHash}`, 15, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const actor = await requireAuthenticatedActor(req, res, db);
      if (!actor) return;

      const body = req.body || {};
      const targetUid = body.targetUid ? String(body.targetUid) : actor.uid;

      const profile = await upsertUserAndDonorProfileTx(db, actor, {
        targetUid,
        displayName: body.displayName,
        bloodGroup: body.bloodGroup,
        age: body.age ?? null,
        gender: body.gender ?? null,
        weightKg: body.weightKg ?? null,
        district: body.district,
        upazila: body.upazila ?? null,
        area: body.area,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        phone: body.phone,
        whatsappNumber: body.whatsappNumber ?? null,
        facebookProfileUrl: body.facebookProfileUrl ?? body.facebookUrl ?? null,
        exactStreetAddress: body.exactStreetAddress ?? null,
        isAvailable: body.isAvailable,
        shareDirectContact: body.shareDirectContact,
        contactPreference: body.contactPreference,
        contactVisibility: body.contactVisibility,
        medicalDeclarationAccepted: body.medicalDeclarationAccepted !== false,
        bio: body.bio ?? null,
      });

      res.status(201).json({ ok: true, profile });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  // --------------------------------------------------------------------------
  // 4. PROTECTED DONOR PRIVATE CONTACT UNMASK & OPTED-IN SINGLE-DONOR LOOKUP
  // --------------------------------------------------------------------------
  router.get('/donors/:donorUid/opted-in-contact', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    // Strict anti-scraping cap: single-donor lookup only (max 20/min per IP)
    if (!enforceRateLimit(res, `optincontact:${ipHash}`, 20, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const contact = await getPublicOptedInDonorContactTx(
        db,
        String(req.params.donorUid || ''),
        ipHash
      );
      res.json({
        ok: true,
        contact: {
          ...contact,
          facebookUrl: contact.facebookProfileUrl,
        },
      });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  router.get('/donors/:donorUid/contact', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `contactunmask:${ipHash}`, 12, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const actor = await requireAuthenticatedActor(req, res, db);
      if (!actor) return;
      if (!enforceRateLimit(res, `contactunmask:uid:${actor.uid}`, 10, 60_000)) return;

      const contact = await getAuthorizedDonorPrivateContactTx(
        db,
        actor,
        String(req.params.donorUid || ''),
        req.query.requestId ? String(req.query.requestId) : undefined
      );

      res.json({ ok: true, contact });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  router.post(
    ['/donors/:donorUid/contact-request', '/donors/:donorUid/contact-requests'],
    async (req: Request, res: Response) => {
      const ipHash = extractHashedClientIp(req);
      if (!enforceRateLimit(res, `contactreq:${ipHash}`, 10, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const actor = await requireAuthenticatedActor(req, res, db);
      if (!actor) return;
      if (!enforceRateLimit(res, `contactreq:uid:${actor.uid}`, 8, 60_000)) return;

      const consent = await requestDonorContactConsentTx(
        db,
        actor,
        String(req.params.donorUid || ''),
        String(req.body?.reason || ''),
        req.body?.requestId ? String(req.body.requestId) : undefined
      );

      res.status(201).json({ ok: true, consent });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  router.post('/consents/:consentId/respond', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `consentresp:${ipHash}`, 15, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const actor = await requireAuthenticatedActor(req, res, db);
      if (!actor) return;

      const decision = req.body?.decision === 'GRANTED' ? 'GRANTED' : 'REVOKED';
      const updated = await respondDonorContactConsentTx(
        db,
        actor,
        String(req.params.consentId || ''),
        decision
      );

      res.json({ ok: true, consent: updated });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  // --------------------------------------------------------------------------
  // 5. BLOOD REQUESTS: CREATE, LIST, RESPOND, ESCALATE, STATE TRANSITION
  // --------------------------------------------------------------------------
  router.get('/requests', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `reqlist:${ipHash}`, 60, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const verified = await verifyServerFirebaseIdentity(req, options?.verifyActorOverride);
      const optionalActor = verified ? await resolveActorRole(db, verified) : null;

      const data = await listBloodRequestsPaginated(db, optionalActor, {
        bloodGroup: req.query.bloodGroup ? String(req.query.bloodGroup) : undefined,
        district: req.query.district ? String(req.query.district) : undefined,
        status: req.query.status ? String(req.query.status) : 'ACTIVE',
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      });

      res.json({ ok: true, ...data });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  router.post('/requests', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `reqcreate:${ipHash}`, 8, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const actor = await requireAuthenticatedActor(req, res, db);
      if (!actor) return;
      if (!enforceRateLimit(res, `reqcreate:uid:${actor.uid}`, 5, 60_000)) return;

      const body = req.body || {};
      const outcome = await createBloodRequestWithAlertsTx(db, actor, {
        patientName: body.patientName,
        bloodGroup: body.bloodGroup,
        bagsNeeded: Number(body.bagsNeeded ?? body.unitsNeeded ?? 1),
        urgency: body.urgency || 'CRITICAL',
        hospitalId: body.hospitalId ?? null,
        hospitalName: body.hospitalName,
        district: body.district,
        area: body.area || body.upazila || body.district,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        clinicalReason: body.clinicalReason ?? body.medicalReason ?? body.notes ?? null,
        contactName: body.contactName ?? null,
        contactPhone: body.contactPhone,
        shareDirectContact: body.shareDirectContact !== false,
      });

      res.status(201).json({ ok: true, ...outcome });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  router.post('/requests/:requestId/respond', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `reqresp:${ipHash}`, 20, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const actor = await requireAuthenticatedActor(req, res, db);
      if (!actor) return;

      const body = req.body || {};
      const response = await respondToBloodRequestTx(
        db,
        actor,
        String(req.params.requestId || ''),
        {
          responseStatus: body.responseStatus || 'ACCEPTED',
          etaMinutes: body.etaMinutes !== undefined ? Number(body.etaMinutes) : undefined,
          note: body.note ? String(body.note) : undefined,
        }
      );

      res.json({ ok: true, response });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  router.post('/requests/:requestId/escalate', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `reqesc:${ipHash}`, 10, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const actor = await requireAuthenticatedActor(req, res, db);
      if (!actor) return;

      const updatedRequest = await escalateBloodRequestTx(
        db,
        actor,
        String(req.params.requestId || '')
      );
      res.json({ ok: true, request: updatedRequest });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  router.post('/requests/:requestId/transition', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `reqtrans:${ipHash}`, 12, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const actor = await requireAuthenticatedActor(req, res, db);
      if (!actor) return;

      const body = req.body || {};
      const outcome = await transitionBloodRequestStateTx(
        db,
        actor,
        String(req.params.requestId || ''),
        {
          nextStatus: body.nextStatus,
          reason: body.reason ? String(body.reason) : undefined,
          fulfilledByDonorUid: body.fulfilledByDonorUid ? String(body.fulfilledByDonorUid) : undefined,
          unitsDonated: body.unitsDonated !== undefined ? Number(body.unitsDonated) : undefined,
        }
      );

      res.json({ ok: true, ...outcome });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  // --------------------------------------------------------------------------
  // 6. HOSPITALS, BLOOD BANKS & INVENTORY
  // --------------------------------------------------------------------------
  router.get('/hospitals', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `hospitals:${ipHash}`, 60, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const items = await listHospitalsByDistrict(
        db,
        req.query.district ? String(req.query.district) : undefined
      );
      res.json({ ok: true, items });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  router.get(['/inventory', '/blood-inventory'], async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `invlist:${ipHash}`, 60, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const items = await listBloodInventory(
        db,
        req.query.district ? String(req.query.district) : undefined
      );
      res.json({ ok: true, items });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  // --------------------------------------------------------------------------
  // 7. ADMIN, SUPER ADMIN, AUDIT LOGS, DEVICE TOKENS & SESSIONS
  // --------------------------------------------------------------------------
  const handleAdminInventoryWrite = async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `admininv:${ipHash}`, 25, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const actor = await requireAuthenticatedActor(req, res, db);
      if (!actor) return;

      const updated = await updateBloodInventoryTx(db, actor, {
        bloodBankCode: String(req.body?.bloodBankCode || req.body?.bloodBankId || 'DEFAULT-BANK'),
        bloodBankName: String(req.body?.bloodBankName || 'Central Blood Bank'),
        district: String(req.body?.district || 'Dhaka'),
        address: String(req.body?.address || 'Bangladesh'),
        contactPhone: String(req.body?.contactPhone || '16263'),
        bloodGroup: String(req.body?.bloodGroup || ''),
        componentType: req.body?.componentType,
        unitsAvailable: Number(req.body?.unitsAvailable ?? 0),
        criticalThreshold:
          req.body?.criticalThreshold !== undefined ? Number(req.body.criticalThreshold) : undefined,
      });

      res.json({ ok: true, bank: updated.bank, inventory: updated.inventory });
    } catch (err) {
      handleRouteError(res, err);
    }
  };

  router.put('/admin/inventory', handleAdminInventoryWrite);
  router.post('/admin/blood-inventory', handleAdminInventoryWrite);

  router.post('/admin/roles', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `adminroles:${ipHash}`, 10, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const actor = await requireAuthenticatedActor(req, res, db);
      if (!actor) return;

      const updated = await manageAdminRoleTx(db, actor, {
        targetUid: String(req.body?.targetUid || ''),
        targetEmail: String(req.body?.targetEmail || ''),
        role: (req.body?.role || 'CO_ADMIN') as 'CO_ADMIN' | 'MODERATOR',
        isActive: req.body?.isActive !== false,
        permissions: Array.isArray(req.body?.permissions) ? req.body.permissions : undefined,
      });

      res.json({ ok: true, adminRole: updated });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  router.get('/admin/audit-logs', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `auditlogs:${ipHash}`, 20, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const actor = await requireAuthenticatedActor(req, res, db);
      if (!actor) return;

      const logs = await queryAuditLogsPaginated(
        db,
        actor,
        req.query.page ? Number(req.query.page) : 1,
        req.query.limit ? Number(req.query.limit) : 25
      );
      res.json({ ok: true, ...logs });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  router.post('/devices/token', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `devtok:${ipHash}`, 15, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const actor = await requireAuthenticatedActor(req, res, db);
      if (!actor) return;

      const saved = await upsertDeviceTokenTx(db, actor, {
        fcmToken: String(req.body?.fcmToken || ''),
        platform: String(req.body?.platform || 'WEB_PWA').toUpperCase() as
          | 'WEB_PWA'
          | 'ANDROID_APK'
          | 'IOS_WEB',
        deviceLabel: req.body?.deviceLabel ? String(req.body.deviceLabel) : undefined,
      });

      res.json({
        ok: true,
        device: { id: saved.id, platform: saved.platform, isActive: saved.isActive },
      });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  router.post('/auth/session', async (req: Request, res: Response) => {
    const ipHash = extractHashedClientIp(req);
    if (!enforceRateLimit(res, `authsess:${ipHash}`, 20, 60_000)) return;

    const db = await requireDatabase(res);
    if (!db) return;

    try {
      const actor = await requireAuthenticatedActor(req, res, db);
      if (!actor) return;

      const authHeader = String(req.headers.authorization || '').slice(7, 47);
      const session = await recordLoginSessionTx(db, actor, {
        rawTokenFragment: authHeader || actor.uid,
        authMethod: (req.body?.authMethod || 'GOOGLE_OAUTH') as
          | 'GOOGLE_OAUTH'
          | 'EMAIL_PASSWORD'
          | 'PHONE_OTP'
          | 'ADMIN_CONSOLE',
        userAgent: String(req.headers['user-agent'] || ''),
        isAdminConsole: Boolean(req.body?.isAdminConsole),
      });

      res.json({
        ok: true,
        session: {
          id: session.id,
          uid: actor.uid,
          role: actor.role,
          isAdminConsole: session.isAdminConsole,
          expiresAt: session.expiresAt,
        },
      });
    } catch (err) {
      handleRouteError(res, err);
    }
  });

  return router;
}
