import express from 'express';
import type { Request, Response } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import dotenv from 'dotenv';
import { BloodSearchOtpService, type OtpServiceOptions } from './src/server/otpService';
import { createNeonApiRouter } from './src/server/neonRoutes';
import { verifyServerFirebaseIdentity } from './src/server/firebaseAuthVerifier';
import type { AuthenticatedActor } from './src/db/repositories/bloodSearchRepo';

dotenv.config();

const __dirname = process.cwd();

export interface VerifiedCaller {
  uid: string;
  emailVerified: boolean;
  rawEmailVerified?: boolean;
  emailHash: string;
}

export interface SanitizedAuditEvent {
  id: string;
  action:
    | 'SOS_DISPATCH_VALIDATED'
    | 'SOS_ESCALATION_TRIGGERED'
    | 'SOS_ALERT_STOPPED'
    | 'RATE_LIMIT_BLOCKED'
    | 'DUPLICATE_SOS_BLOCKED'
    | 'SMS_DISPATCH_ATTEMPT'
    | 'OTP_CHALLENGE_ISSUED'
    | 'OTP_CHALLENGE_VERIFIED'
    | 'OTP_CHALLENGE_BLOCKED';
  actorUidHash: string;
  requestId: string;
  bloodGroup?: string;
  district?: string;
  escalationLevel?: number;
  channelSummary: string;
  timestampIso: string;
}

interface ActiveServerRequestState {
  requestId: string;
  ownerUid: string;
  bloodGroup: string;
  district: string;
  status: 'ACTIVE' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
  escalationLevel: number;
  notifiedDonorHashes: Set<string>;
  createdAtMs: number;
  lastEscalatedAtMs: number;
}

const VALID_BLOOD_GROUPS = new Set(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
const VALID_URGENCIES = new Set(['CRITICAL', 'URGENT', 'STANDARD']);

const ESCALATION_TIERS = [
  { level: 0, radiusKm: 5, includeNearbyDistricts: false, labelEn: '5 km Local Radius', labelBn: '৫ কিমি স্থানীয় পরিধি' },
  { level: 1, radiusKm: 15, includeNearbyDistricts: false, labelEn: '15 km City Radius', labelBn: '১৫ কিমি শহর পরিধি' },
  { level: 2, radiusKm: 40, includeNearbyDistricts: true, labelEn: '40 km + Nearby Areas', labelBn: '৪০ কিমি ও পার্শ্ববর্তী এলাকা' },
  { level: 3, radiusKm: 85, includeNearbyDistricts: true, labelEn: 'Nearby Districts (85 km)', labelBn: 'পার্শ্ববর্তী জেলাসমূহ (৮৫ কিমি)' },
  { level: 4, radiusKm: 500, includeNearbyDistricts: true, labelEn: 'All Bangladesh Emergency', labelBn: 'সারাদেশ জরুরি নেটওয়ার্ক' },
];

function loadFirebaseWebApiKey(): string {
  const envKey = (process.env.FIREBASE_WEB_API_KEY || process.env.VITE_FIREBASE_API_KEY || '').trim();
  if (envKey) return envKey;
  const candidates = [
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
    path.join(__dirname, 'firebase-applet-config.json'),
    path.resolve(__dirname, '..', 'firebase-applet-config.json'),
  ];
  for (const cfgPath of candidates) {
    try {
      if (fs.existsSync(cfgPath)) {
        const raw = fs.readFileSync(cfgPath, 'utf8');
        const parsed = JSON.parse(raw) as { apiKey?: string };
        if (parsed.apiKey) return parsed.apiKey;
      }
    } catch {
      // Continue
    }
  }
  return '';
}

export function sha256Short(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}

function isSafeHttpsWebhookUrl(rawUrl: string | undefined): boolean {
  if (!rawUrl) return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      host === '[::1]'
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getNotificationCapabilities() {
  const vapidKey = (process.env.VITE_FIREBASE_VAPID_KEY || '').trim();
  const fcmServerKey = (process.env.FCM_SERVER_KEY || '').trim();
  const smsProviderRaw = (process.env.SMS_PROVIDER || 'NONE').trim().toUpperCase();

  const twilioReady =
    smsProviderRaw === 'TWILIO' &&
    Boolean(process.env.TWILIO_ACCOUNT_SID?.trim()) &&
    Boolean(process.env.TWILIO_AUTH_TOKEN?.trim()) &&
    Boolean(process.env.TWILIO_FROM_NUMBER?.trim());

  const webhookReady =
    smsProviderRaw === 'WEBHOOK_BD' &&
    isSafeHttpsWebhookUrl(process.env.SMS_WEBHOOK_URL) &&
    Boolean(process.env.SMS_WEBHOOK_API_KEY?.trim());

  const smsConfigured = twilioReady || webhookReady;

  return {
    fcmVapidConfigured: vapidKey.length > 20,
    fcmServerConfigured: fcmServerKey.length > 20,
    smsConfigured,
    smsProvider: smsConfigured ? smsProviderRaw : 'NONE',
    inAppRealtimeAlerts: true,
    browserLocalNotificationSupported: true,
    rateLimits: {
      maxBroadcastsPer10Min: 4,
      maxEscalationsPer15Min: 6,
      duplicateWindowMinutes: 10,
    },
  };
}

export function createEmergencyApiApp(options?: {
  verifyTokenOverride?: (token: string) => Promise<VerifiedCaller | null>;
  verifyNeonActorOverride?: (token: string) => Promise<AuthenticatedActor | null>;
  otpServiceOptions?: OtpServiceOptions;
}) {
  const app = express();
  app.disable('x-powered-by');

  const isProd = process.env.NODE_ENV === 'production';
  const devWsSources = isProd ? '' : ' ws: wss:';
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com https://www.gstatic.com https://www.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' https://*.googleapis.com https://www.gstatic.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://accounts.google.com https://nominatim.openstreetmap.org https://router.project-osrm.org https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://*.tile.openstreetmap.fr https://*.basemaps.cartocdn.com${devWsSources}`,
    "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://www.google.com",
    "frame-ancestors 'self' https://aistudio.google.com https://*.google.com https://*.googleusercontent.com https://*.run.app",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']);
  const BLOCKED_SCANNER_UAS =
    /\b(sqlmap|nikto|acunetix|nmap|masscan|zgrab|nuclei|dirbuster|gobuster|feroxbuster|ffuf|wfuzz|wpscan|havij|commix|scrapy|nessus|openvas|hydra|medusa|burpsuite|metasploit|dalfox|xsstrike|arachni)\b/i;
  const BIDI_OR_NULL_RE = /[\u0000\u202A-\u202E\u2066-\u2069]/;

  const hasMaliciousObjectKeysOrNullBytes = (val: unknown, depth = 0): boolean => {
    if (depth > 8) return true;
    if (typeof val === 'string') {
      return BIDI_OR_NULL_RE.test(val);
    }
    if (Array.isArray(val)) {
      return val.some((item) => hasMaliciousObjectKeysOrNullBytes(item, depth + 1));
    }
    if (val && typeof val === 'object') {
      const rawObj = val as Record<string, unknown>;
      for (const key of Object.keys(rawObj)) {
        if (
          key === '__proto__' ||
          key === 'constructor' ||
          key === 'prototype' ||
          key.startsWith('$') ||
          BIDI_OR_NULL_RE.test(key)
        ) {
          return true;
        }
        if (hasMaliciousObjectKeysOrNullBytes(rawObj[key], depth + 1)) {
          return true;
        }
      }
    }
    return false;
  };

  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Origin-Agent-Cluster', '?1');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader(
      'Permissions-Policy',
      'camera=(), usb=(), payment=(), serial=(), bluetooth=(), midi=(), geolocation=(self), microphone=(self)'
    );
    res.setHeader('Content-Security-Policy', cspDirectives);
    if (isProd) {
      res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }

    // 0. Block dangerous HTTP methods (XST / proxy tunneling) and oversized URIs
    if (!ALLOWED_METHODS.has(String(req.method || '').toUpperCase())) {
      res.status(405).json({ ok: false, code: 'METHOD_NOT_ALLOWED' });
      return;
    }
    const checkUrlLen = String(req.originalUrl || req.url || '');
    if (checkUrlLen.length > 2048) {
      res.status(414).json({ ok: false, code: 'URI_TOO_LONG' });
      return;
    }

    // 1. Block automated vulnerability scanners & exploit bots immediately
    const ua = String(req.headers['user-agent'] || '');
    if (ua && BLOCKED_SCANNER_UAS.test(ua)) {
      res.status(403).json({ ok: false, code: 'FORBIDDEN_SCANNER' });
      return;
    }

    // 2. Block path traversal & sensitive server/config/database file probing
    //    (allow /.well-known/assetlinks.json for verified Android TWA APK, and allow Vite's ?import JS wrapper for firebase-applet-config.json in dev)
    const lowerPath = (req.path || '').toLowerCase();
    const rawUrl = String(req.originalUrl || req.url || '');
    const isWellKnownAssetLinks = lowerPath === '/.well-known/assetlinks.json';
    const isViteDevJsonModule =
      !isProd && lowerPath === '/firebase-applet-config.json' && /[?&]import\b/.test(rawUrl);
    const isBlockedSensitiveFile =
      !isWellKnownAssetLinks &&
      !isViteDevJsonModule &&
      (lowerPath.includes('..') ||
        lowerPath.includes('%2e%2e') ||
        lowerPath.includes('\0') ||
        lowerPath.startsWith('/.env') ||
        lowerPath.startsWith('/.git') ||
        lowerPath.startsWith('/.data') ||
        lowerPath.startsWith('/drizzle') ||
        lowerPath.startsWith('/backups') ||
        lowerPath.startsWith('/scripts') ||
        lowerPath.startsWith('/tests') ||
        lowerPath.startsWith('/src/db') ||
        lowerPath.startsWith('/src/server') ||
        lowerPath.endsWith('.sql') ||
        lowerPath.endsWith('.map') ||
        lowerPath.endsWith('.md') ||
        lowerPath === '/drizzle.config.ts' ||
        lowerPath === '/vite.config.ts' ||
        lowerPath === '/tsconfig.json' ||
        lowerPath === '/firebase-applet-config.json' ||
        lowerPath === '/firebase-blueprint.json' ||
        lowerPath === '/firestore.rules' ||
        lowerPath === '/server.ts' ||
        lowerPath === '/package.json' ||
        lowerPath === '/package-lock.json');

    if (isBlockedSensitiveFile) {
      res.status(403).json({ ok: false, code: 'FORBIDDEN_RESOURCE' });
      return;
    }

    // 3. Cross-Site Request Forgery (CSRF) Origin & Fetch-Metadata Guard for state-changing API routes
    if (
      lowerPath.startsWith('/api/') &&
      (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE')
    ) {
      const secFetchSite = String(req.headers['sec-fetch-site'] || '').toLowerCase();
      if (secFetchSite === 'cross-site') {
        res.status(403).json({ ok: false, code: 'CSRF_CROSS_SITE_BLOCKED' });
        return;
      }

      const originHeader = String(req.headers.origin || '').trim();
      const hostHeader = String(req.headers['x-forwarded-host'] || req.headers.host || '')
        .split(',')[0]
        ?.trim()
        .toLowerCase();

      if (originHeader && hostHeader) {
        try {
          const originHost = new URL(originHeader).host.toLowerCase();
          if (originHost !== hostHeader) {
            res.status(403).json({ ok: false, code: 'CSRF_ORIGIN_MISMATCH' });
            return;
          }
        } catch {
          res.status(403).json({ ok: false, code: 'CSRF_INVALID_ORIGIN' });
          return;
        }
      }
    }

    next();
  });

  // Dynamic Cryptographic Android APK / TWA Digital Asset Links Endpoint
  app.get('/.well-known/assetlinks.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    const pkgName = (process.env.ANDROID_APK_PACKAGE_NAME || 'bd.bloodsearch.app').trim();
    const rawCerts = (process.env.ANDROID_APK_SHA256_FINGERPRINT || '').trim();
    const validCerts = rawCerts
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s) && !/^00(:00){31}$/.test(s));

    if (validCerts.length === 0 || !/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(pkgName)) {
      res.json([]);
      return;
    }

    res.json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: pkgName,
          sha256_cert_fingerprints: validCerts,
        },
      },
    ]);
  });

  app.use(express.json({ limit: '64kb', strict: true }));

  // Mask malformed JSON syntax errors so internal Express/V8 stack traces never leak
  app.use((err: unknown, _req: Request, res: Response, next: express.NextFunction) => {
    if (err && typeof err === 'object' && ('type' in err || err instanceof SyntaxError)) {
      res.status(400).json({
        ok: false,
        code: 'MALFORMED_JSON_PAYLOAD',
        message: 'Invalid or oversized JSON request body.',
      });
      return;
    }
    next(err);
  });

  // Deep Prototype-Pollution, Operator-Injection, HTTP Parameter Pollution (HPP) & Null-Byte Firewall
  app.use('/api', (req: Request, res: Response, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    const hasQueryArrayPollution =
      req.query &&
      typeof req.query === 'object' &&
      Object.values(req.query).some((v) => Array.isArray(v));
    if (
      hasQueryArrayPollution ||
      hasMaliciousObjectKeysOrNullBytes(req.body) ||
      hasMaliciousObjectKeysOrNullBytes(req.query)
    ) {
      res.status(400).json({
        ok: false,
        code: 'MALICIOUS_PAYLOAD_BLOCKED',
        message: 'Malformed or disallowed request payload keys.',
      });
      return;
    }
    next();
  });

  // Mount dedicated Neon PostgreSQL primary database API (/api/v1/*)
  app.use(
    '/api/v1',
    createNeonApiRouter({
      verifyActorOverride: options?.verifyNeonActorOverride,
    })
  );

  const firebaseApiKey = loadFirebaseWebApiKey();
  const otpService = new BloodSearchOtpService(options?.otpServiceOptions);
  const MAX_SERVER_BUCKETS = 5000;
  const rateBuckets = new Map<string, number[]>();
  const duplicateFingerprints = new Map<string, { requestId: string; timestampMs: number }>();
  const activeRequests = new Map<string, ActiveServerRequestState>();
  const auditTrail: SanitizedAuditEvent[] = [];

  const pruneBoundedMap = <K, V>(map: Map<K, V>, maxEntries = MAX_SERVER_BUCKETS) => {
    while (map.size >= maxEntries) {
      const oldestKey = map.keys().next().value;
      if (oldestKey === undefined) break;
      map.delete(oldestKey);
    }
  };

  const recordAudit = (entry: Omit<SanitizedAuditEvent, 'id' | 'timestampIso'>) => {
    auditTrail.unshift({
      ...entry,
      id: `aud-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      timestampIso: new Date().toISOString(),
    });
    if (auditTrail.length > 200) {
      auditTrail.length = 200;
    }
  };

  const checkRateLimit = (bucketKey: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfterSec: number } => {
    const now = Date.now();
    const prev = rateBuckets.get(bucketKey) || [];
    const active = prev.filter((ts) => now - ts < windowMs);
    if (active.length >= maxRequests) {
      const oldest = active[0] || now;
      const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
      rateBuckets.set(bucketKey, active);
      return { allowed: false, retryAfterSec };
    }
    if (!rateBuckets.has(bucketKey)) {
      pruneBoundedMap(rateBuckets);
    }
    active.push(now);
    rateBuckets.set(bucketKey, active);
    return { allowed: true, retryAfterSec: 0 };
  };

  const verifyBearerToken = async (req: Request): Promise<VerifiedCaller | null> => {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) return null;
    const idToken = authHeader.slice(7).trim();
    if (!idToken || idToken.length > 4096) return null;

    if (options?.verifyTokenOverride) {
      return options.verifyTokenOverride(idToken);
    }

    // Enforce valid 3-segment JWT format before network/crypto verification
    if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(idToken)) {
      return null;
    }

    // 1. Primary: Cryptographic RS256 JWKS verification via firebase-admin/auth
    const verifiedAdminActor = await verifyServerFirebaseIdentity(req);
    if (verifiedAdminActor?.uid) {
      return {
        uid: verifiedAdminActor.uid,
        emailVerified: Boolean(
          verifiedAdminActor.emailVerified ||
            (verifiedAdminActor.email && verifiedAdminActor.email.includes('@')) ||
            !verifiedAdminActor.email
        ),
        rawEmailVerified: verifiedAdminActor.emailVerified,
        emailHash: verifiedAdminActor.email
          ? sha256Short(verifiedAdminActor.email.toLowerCase())
          : 'phone-user',
      };
    }

    if (!firebaseApiKey) return null;

    try {
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );
      if (!resp.ok) return null;
      const data = (await resp.json()) as {
        users?: Array<{ localId?: string; email?: string; emailVerified?: boolean; phoneNumber?: string }>;
      };
      const user = data.users?.[0];
      if (!user?.localId) return null;
      const rawEmailVerified = Boolean(user.emailVerified);
      const emailVerified = Boolean(
        rawEmailVerified || user.phoneNumber || (user.email && user.email.includes('@'))
      );
      return {
        uid: user.localId,
        emailVerified,
        rawEmailVerified,
        emailHash: user.email ? sha256Short(user.email.toLowerCase()) : 'phone-user',
      };
    } catch {
      return null;
    }
  };

  async function dispatchLegitimateSmsIfConfigured(
    phones: string[],
    messageText: string
  ): Promise<{ status: 'SENT' | 'NOT_CONFIGURED' | 'PROVIDER_ERROR'; sentCount: number; fallbackMessage: string }> {
    const caps = getNotificationCapabilities();
    if (!caps.smsConfigured || phones.length === 0) {
      return {
        status: 'NOT_CONFIGURED',
        sentCount: 0,
        fallbackMessage:
          'SMS gateway credentials are not configured on the server (SMS_PROVIDER=NONE). Using real-time in-app alerts + direct Call/WhatsApp.',
      };
    }

    // Restrict strictly to valid Bangladesh mobile numbers (+8801[3-9]XXXXXXXX or 01[3-9]XXXXXXXX)
    // to block international premium-rate SMS toll fraud
    const cleanPhones = phones
      .map((p) => String(p || '').replace(/[^\d+]/g, ''))
      .filter((p) => /^(\+?8801[3-9]\d{8}|01[3-9]\d{8})$/.test(p))
      .slice(0, 15);

    if (cleanPhones.length === 0) {
      return {
        status: 'NOT_CONFIGURED',
        sentCount: 0,
        fallbackMessage: 'No valid opted-in Bangladesh (+8801...) SMS numbers provided in this batch.',
      };
    }

    try {
      if (caps.smsProvider === 'TWILIO') {
        const sid = process.env.TWILIO_ACCOUNT_SID!.trim();
        const token = process.env.TWILIO_AUTH_TOKEN!.trim();
        const from = process.env.TWILIO_FROM_NUMBER!.trim();
        const authBasic = Buffer.from(`${sid}:${token}`).toString('base64');
        let sentCount = 0;

        await Promise.all(
          cleanPhones.map(async (toPhone) => {
            const normalizedTo = toPhone.startsWith('+')
              ? toPhone
              : toPhone.startsWith('880')
              ? `+${toPhone}`
              : `+88${toPhone}`;
            const form = new URLSearchParams({
              To: normalizedTo,
              From: from,
              Body: messageText.slice(0, 300),
            });
            const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
              method: 'POST',
              headers: {
                Authorization: `Basic ${authBasic}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: form.toString(),
            });
            if (r.ok) sentCount += 1;
          })
        );

        return {
          status: sentCount > 0 ? 'SENT' : 'PROVIDER_ERROR',
          sentCount,
          fallbackMessage:
            sentCount > 0
              ? `Dispatched ${sentCount} SMS message(s) via Twilio.`
              : 'Twilio rejected SMS dispatch; use direct Call or WhatsApp immediately.',
        };
      }

      if (caps.smsProvider === 'WEBHOOK_BD') {
        const url = process.env.SMS_WEBHOOK_URL!.trim();
        if (!isSafeHttpsWebhookUrl(url)) {
          return {
            status: 'PROVIDER_ERROR',
            sentCount: 0,
            fallbackMessage: 'SMS webhook URL must be an external HTTPS endpoint.',
          };
        }
        const apiKey = process.env.SMS_WEBHOOK_API_KEY!.trim();
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            recipients: cleanPhones,
            message: messageText.slice(0, 300),
          }),
        });
        if (r.ok) {
          return {
            status: 'SENT',
            sentCount: cleanPhones.length,
            fallbackMessage: `Dispatched ${cleanPhones.length} SMS message(s) via configured SMS gateway.`,
          };
        }
      }

      return {
        status: 'PROVIDER_ERROR',
        sentCount: 0,
        fallbackMessage: 'SMS gateway returned an error. Use direct Call, WhatsApp, or in-app alerts.',
      };
    } catch {
      return {
        status: 'PROVIDER_ERROR',
        sentCount: 0,
        fallbackMessage: 'SMS network request failed. Use direct Call, WhatsApp, or in-app alerts.',
      };
    }
  }

  app.get('/api/capabilities', (req: Request, res: Response) => {
    const ipKey = req.ip || 'unknown-ip';
    const capRate = checkRateLimit(`caps:ip:${ipKey}`, 60, 60 * 1000);
    if (!capRate.allowed) {
      res.status(429).json({ ok: false, code: 'RATE_LIMITED', retryAfterSec: capRate.retryAfterSec });
      return;
    }
    res.json({
      ok: true,
      capabilities: getNotificationCapabilities(),
    });
  });

  app.post('/api/emergency/dispatch', async (req: Request, res: Response) => {
    const caller = await verifyBearerToken(req);
    if (!caller || !caller.emailVerified) {
      res.status(401).json({
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'Verified Firebase sign-in is required to dispatch concurrent emergency broadcasts.',
      });
      return;
    }

    const body = req.body || {};
    const requestId = String(body.requestId || '').trim();
    const bloodGroup = String(body.bloodGroup || '').trim();
    const hospitalName = String(body.hospitalName || '').trim();
    const district = String(body.district || '').trim();
    const urgency = String(body.urgency || 'URGENT').trim();
    const candidateDonorIds: string[] = Array.isArray(body.candidateDonorIds)
      ? body.candidateDonorIds.map((id: unknown) => String(id || '').trim()).filter(Boolean).slice(0, 50)
      : [];
    const optedInSmsPhones: string[] = Array.isArray(body.optedInSmsPhones)
      ? body.optedInSmsPhones.map((p: unknown) => String(p || '').trim()).filter(Boolean).slice(0, 15)
      : [];
    const escalationIntervalMinutes = Math.min(60, Math.max(2, Number(body.escalationIntervalMinutes) || 10));

    if (
      !requestId ||
      requestId.length > 100 ||
      !/^[a-zA-Z0-9_-]+$/.test(requestId) ||
      !VALID_BLOOD_GROUPS.has(bloodGroup) ||
      hospitalName.length < 2 ||
      hospitalName.length > 200 ||
      district.length < 2 ||
      district.length > 80 ||
      !VALID_URGENCIES.has(urgency)
    ) {
      res.status(400).json({
        ok: false,
        code: 'INVALID_PAYLOAD',
        message: 'Missing or invalid blood group, hospital name, district, or request ID.',
      });
      return;
    }

    const ipKey = req.ip || 'unknown-ip';
    const uidRate = checkRateLimit(`dispatch:uid:${caller.uid}`, 4, 10 * 60 * 1000);
    const ipRate = checkRateLimit(`dispatch:ip:${ipKey}`, 10, 10 * 60 * 1000);

    if (!uidRate.allowed || !ipRate.allowed) {
      const retryAfterSec = Math.max(uidRate.retryAfterSec, ipRate.retryAfterSec);
      recordAudit({
        action: 'RATE_LIMIT_BLOCKED',
        actorUidHash: sha256Short(caller.uid),
        requestId,
        bloodGroup,
        district,
        channelSummary: `Rate limit hit (${retryAfterSec}s cooldown)`,
      });
      res.status(429).json({
        ok: false,
        code: 'RATE_LIMITED',
        retryAfterSec,
        message: `Broadcast rate limit reached to prevent donor spam. Please call available donors directly or retry in ${retryAfterSec}s.`,
      });
      return;
    }

    const dupHash = sha256Short(
      `${caller.uid}|${bloodGroup}|${hospitalName.toLowerCase().replace(/\s+/g, ' ')}|${district.toLowerCase()}`
    );
    const existingDup = duplicateFingerprints.get(dupHash);
    if (existingDup && Date.now() - existingDup.timestampMs < 10 * 60 * 1000 && existingDup.requestId !== requestId) {
      const prevReq = activeRequests.get(existingDup.requestId);
      if (!prevReq || prevReq.status === 'ACTIVE') {
        recordAudit({
          action: 'DUPLICATE_SOS_BLOCKED',
          actorUidHash: sha256Short(caller.uid),
          requestId,
          bloodGroup,
          district,
          channelSummary: `Duplicate of active request ${existingDup.requestId}`,
        });
        res.status(409).json({
          ok: false,
          code: 'DUPLICATE_REQUEST',
          existingRequestId: existingDup.requestId,
          message:
            'An identical active blood request for this hospital and blood group was submitted within the last 10 minutes. Expand the existing request instead of creating duplicates.',
        });
        return;
      }
    }

    if (!duplicateFingerprints.has(dupHash)) pruneBoundedMap(duplicateFingerprints);
    duplicateFingerprints.set(dupHash, { requestId, timestampMs: Date.now() });

    const notifiedHashes = new Set<string>(candidateDonorIds.map((uid) => sha256Short(uid)));
    if (!activeRequests.has(requestId)) pruneBoundedMap(activeRequests);
    activeRequests.set(requestId, {
      requestId,
      ownerUid: caller.uid,
      bloodGroup,
      district,
      status: 'ACTIVE',
      escalationLevel: 0,
      notifiedDonorHashes: notifiedHashes,
      createdAtMs: Date.now(),
      lastEscalatedAtMs: Date.now(),
    });

    const caps = getNotificationCapabilities();
    const safeSmsHospital = hospitalName
      .replace(/https?:\/\/\S+|www\.\S+/gi, '')
      .replace(/[\r\n<>]/g, ' ')
      .trim()
      .slice(0, 90);
    const safeSmsDistrict = district
      .replace(/https?:\/\/\S+|www\.\S+/gi, '')
      .replace(/[\r\n<>]/g, ' ')
      .trim()
      .slice(0, 40);
    const smsText = `[BloodSearch Emergency] ${bloodGroup} blood needed (${urgency}) at ${safeSmsHospital}, ${safeSmsDistrict}. Open BloodSearch to respond or confirm availability.`;
    const smsResult = await dispatchLegitimateSmsIfConfigured(optedInSmsPhones, smsText);

    const pushStatus = caps.fcmServerConfigured
      ? 'FCM_SERVER_READY'
      : caps.fcmVapidConfigured
      ? 'CLIENT_VAPID_PUSH_ONLY'
      : 'IN_APP_AND_BROWSER_LOCAL_ONLY';

    recordAudit({
      action: 'SOS_DISPATCH_VALIDATED',
      actorUidHash: sha256Short(caller.uid),
      requestId,
      bloodGroup,
      district,
      escalationLevel: 0,
      channelSummary: `donors=${candidateDonorIds.length}, push=${pushStatus}, sms=${smsResult.status}(${smsResult.sentCount})`,
    });

    res.json({
      ok: true,
      requestId,
      escalationTier: ESCALATION_TIERS[0],
      nextEscalationAtIso: new Date(Date.now() + escalationIntervalMinutes * 60 * 1000).toISOString(),
      channels: {
        inAppRealtime: 'DISPATCH_AUTHORIZED',
        pushStatus,
        pushNote:
          pushStatus === 'FCM_SERVER_READY'
            ? 'Background FCM push configured.'
            : 'Background FCM server push is not configured (FCM_SERVER_KEY / VITE_FIREBASE_VAPID_KEY missing). Active browser tabs receive real-time Firestore & local notifications; call opted-in donors directly for fastest response.',
        smsStatus: smsResult.status,
        smsSentCount: smsResult.sentCount,
        smsNote: smsResult.fallbackMessage,
      },
      honestDeliveryNotice:
        'Dispatched notifications indicate server/database delivery only and do not guarantee a donor has seen or read the alert. Call opted-in available donors directly while waiting.',
    });
  });

  app.post('/api/emergency/escalate', async (req: Request, res: Response) => {
    const caller = await verifyBearerToken(req);
    if (!caller || !caller.emailVerified) {
      res.status(401).json({
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'Verified Firebase sign-in is required to escalate a blood request.',
      });
      return;
    }

    const body = req.body || {};
    const requestId = String(body.requestId || '').trim();
    const requestedLevel = Number(body.nextLevel);
    const newlyMatchedIds: string[] = Array.isArray(body.newlyMatchedDonorIds)
      ? body.newlyMatchedDonorIds.map((id: unknown) => String(id || '').trim()).filter(Boolean).slice(0, 50)
      : [];

    if (!requestId || !/^[a-zA-Z0-9_-]+$/.test(requestId)) {
      res.status(400).json({ ok: false, code: 'INVALID_REQUEST_ID', message: 'Invalid requestId.' });
      return;
    }

    const tracked = activeRequests.get(requestId);
    if (tracked && tracked.ownerUid !== caller.uid) {
      res.status(403).json({
        ok: false,
        code: 'FORBIDDEN',
        message: 'Only the seeker who created this blood request can escalate it.',
      });
      return;
    }

    if (tracked && tracked.status !== 'ACTIVE') {
      res.status(409).json({
        ok: false,
        code: 'REQUEST_INACTIVE',
        message: `Cannot escalate request because its status is ${tracked.status}. Future alerts are stopped.`,
      });
      return;
    }

    const escRate = checkRateLimit(`escalate:uid:${caller.uid}`, 6, 15 * 60 * 1000);
    if (!escRate.allowed) {
      res.status(429).json({
        ok: false,
        code: 'RATE_LIMITED',
        retryAfterSec: escRate.retryAfterSec,
        message: `Escalation rate limit reached. Try again in ${escRate.retryAfterSec}s or call donors directly.`,
      });
      return;
    }

    const currentLevel = tracked ? tracked.escalationLevel : 0;
    const nextLevel = Number.isFinite(requestedLevel)
      ? Math.min(ESCALATION_TIERS.length - 1, Math.max(currentLevel + 1, requestedLevel))
      : Math.min(ESCALATION_TIERS.length - 1, currentLevel + 1);

    const tier = ESCALATION_TIERS[nextLevel] || ESCALATION_TIERS[ESCALATION_TIERS.length - 1];

    const dedupedNewDonorIds = newlyMatchedIds.filter((uid) => {
      const h = sha256Short(uid);
      if (tracked?.notifiedDonorHashes.has(h)) return false;
      tracked?.notifiedDonorHashes.add(h);
      return true;
    });

    if (tracked) {
      tracked.escalationLevel = nextLevel;
      tracked.lastEscalatedAtMs = Date.now();
    } else {
      activeRequests.set(requestId, {
        requestId,
        ownerUid: caller.uid,
        bloodGroup: String(body.bloodGroup || ''),
        district: String(body.district || ''),
        status: 'ACTIVE',
        escalationLevel: nextLevel,
        notifiedDonorHashes: new Set(newlyMatchedIds.map((uid) => sha256Short(uid))),
        createdAtMs: Date.now(),
        lastEscalatedAtMs: Date.now(),
      });
    }

    recordAudit({
      action: 'SOS_ESCALATION_TRIGGERED',
      actorUidHash: sha256Short(caller.uid),
      requestId,
      escalationLevel: nextLevel,
      channelSummary: `tier=${tier.labelEn}, newlyEligible=${dedupedNewDonorIds.length}`,
    });

    res.json({
      ok: true,
      requestId,
      escalationTier: tier,
      dedupedNewDonorIds,
      skippedDuplicatesCount: newlyMatchedIds.length - dedupedNewDonorIds.length,
    });
  });

  app.post('/api/emergency/stop', async (req: Request, res: Response) => {
    const caller = await verifyBearerToken(req);
    if (!caller || !caller.emailVerified) {
      res.status(401).json({ ok: false, code: 'UNAUTHORIZED', message: 'Verified authentication required.' });
      return;
    }

    const stopRate = checkRateLimit(`stop:uid:${caller.uid}`, 12, 10 * 60 * 1000);
    if (!stopRate.allowed) {
      res.status(429).json({
        ok: false,
        code: 'RATE_LIMITED',
        retryAfterSec: stopRate.retryAfterSec,
        message: 'Too many stop requests in a short window.',
      });
      return;
    }

    const body = req.body || {};
    const requestId = String(body.requestId || '').trim();
    const reason = String(body.reason || 'CANCELLED').toUpperCase();
    const finalStatus: 'FULFILLED' | 'CANCELLED' | 'EXPIRED' =
      reason === 'FULFILLED' ? 'FULFILLED' : reason === 'EXPIRED' ? 'EXPIRED' : 'CANCELLED';

    if (!requestId || requestId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(requestId)) {
      res.status(400).json({ ok: false, code: 'INVALID_REQUEST_ID', message: 'Invalid requestId.' });
      return;
    }

    const tracked = activeRequests.get(requestId);
    if (tracked && tracked.ownerUid !== caller.uid) {
      res.status(403).json({ ok: false, code: 'FORBIDDEN', message: 'Only the request author can stop alerts.' });
      return;
    }

    if (tracked) {
      tracked.status = finalStatus;
    } else {
      activeRequests.set(requestId, {
        requestId,
        ownerUid: caller.uid,
        bloodGroup: '',
        district: '',
        status: finalStatus,
        escalationLevel: 0,
        notifiedDonorHashes: new Set(),
        createdAtMs: Date.now(),
        lastEscalatedAtMs: Date.now(),
      });
    }

    recordAudit({
      action: 'SOS_ALERT_STOPPED',
      actorUidHash: sha256Short(caller.uid),
      requestId,
      channelSummary: `stopped=${finalStatus}`,
    });

    res.json({
      ok: true,
      requestId,
      status: finalStatus,
      alertsHalted: true,
    });
  });

  // =========================================================================
  // SECURE OTP AUTHENTICATION ENDPOINTS (Phases 2, 3, 4, 5, 6)
  // Zero OTP plaintext logging; salted HMAC-SHA256 verification; production lock
  // =========================================================================
  const extractClientIp = (req: Request): string => {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) {
      return xff.split(',')[0].trim();
    }
    if (Array.isArray(xff) && xff.length > 0) {
      return String(xff[0]).trim();
    }
    return req.socket?.remoteAddress || req.ip || '127.0.0.1';
  };

  app.get('/api/auth/otp/config', (_req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      ...otpService.getPublicCapabilities(),
    });
  });

  app.post('/api/auth/otp/send', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const body = req.body || {};
    const rawPhone = String(body.phone || '').slice(0, 32);
    const preferDevSandbox = body.preferDevSandbox === true;
    const clientIp = extractClientIp(req);

    const outcome = await otpService.requestOtp({
      rawPhone,
      clientIp,
      preferDevSandbox,
    });

    // Audit strictly hashes phone & IP — NEVER logs or stores OTP values!
    recordAudit({
      action: outcome.body.ok ? 'OTP_CHALLENGE_ISSUED' : 'OTP_CHALLENGE_BLOCKED',
      actorUidHash: sha256Short(outcome.body.phoneE164 || rawPhone || 'invalid'),
      requestId: outcome.body.challengeId ? outcome.body.challengeId.slice(0, 16) : 'otp_send',
      channelSummary: `mode=${outcome.body.deliveryMode || 'NONE'}, code=${outcome.body.code}`,
    });

    res.status(outcome.httpStatus).json(outcome.body);
  });

  app.post('/api/auth/otp/verify', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const body = req.body || {};
    const challengeId = String(body.challengeId || '').slice(0, 80);
    const rawPhone = String(body.phone || '').slice(0, 32);
    const otpCode = String(body.otp || '').slice(0, 12);
    const clientIp = extractClientIp(req);

    const outcome = otpService.verifyOtp({
      challengeId,
      rawPhone,
      otpCode,
      clientIp,
    });

    recordAudit({
      action: outcome.body.ok ? 'OTP_CHALLENGE_VERIFIED' : 'OTP_CHALLENGE_BLOCKED',
      actorUidHash: sha256Short(outcome.body.phoneE164 || rawPhone || 'invalid'),
      requestId: challengeId ? challengeId.slice(0, 16) : 'otp_verify',
      channelSummary: `mode=${outcome.body.deliveryMode || 'NONE'}, result=${outcome.body.code}`,
    });

    res.status(outcome.httpStatus).json(outcome.body);
  });

  app.post('/api/auth/otp/session', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const authHeader = String(req.headers.authorization || '');
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const token = bearerToken || String(req.body?.sessionToken || '').trim();
    const verified = otpService.verifyDevSandboxSessionToken(token);
    if (!verified.valid) {
      res.status(401).json({ ok: false, code: 'INVALID_DEV_OTP_SESSION' });
      return;
    }
    res.json({
      ok: true,
      session: {
        uid: verified.uid,
        phoneE164: verified.phoneE164,
        operator: verified.operator,
        role: 'USER',
        adminEligible: false,
        isDevSandbox: true,
        expiresAtMs: verified.expiresAtMs,
      },
    });
  });

  app.post('/api/auth/otp/logout', (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store');
    const authHeader = String(req.headers.authorization || '');
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const token = bearerToken || String(req.body?.sessionToken || '').trim();
    otpService.revokeDevSandboxSessionToken(token);
    res.json({ ok: true });
  });

  app.get('/api/app-version', (req: Request, res: Response) => {
    const clientIp = extractClientIp(req);
    const verRate = checkRateLimit(`ver:ip:${clientIp}`, 60, 60 * 1000);
    if (!verRate.allowed) {
      res.status(429).json({ ok: false, code: 'RATE_LIMITED', retryAfterSec: verRate.retryAfterSec });
      return;
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    let pkgVersion = '2.5.0';
    let distBuildId = '';
    try {
      const distVersionPath = path.join(__dirname, 'dist', 'version.json');
      if (fs.existsSync(distVersionPath)) {
        const parsed = JSON.parse(fs.readFileSync(distVersionPath, 'utf8')) as {
          version?: string;
          buildId?: string;
        };
        if (parsed.version) pkgVersion = parsed.version;
        if (parsed.buildId) distBuildId = parsed.buildId;
      } else {
        const pkgPath = path.join(__dirname, 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as { version?: string };
        if (pkg.version) pkgVersion = pkg.version;
      }
    } catch {}
    res.json({
      ok: true,
      version: pkgVersion,
      buildId: distBuildId || `${pkgVersion}-live`,
    });
  });

  app.get('/api/audit/summary', async (req: Request, res: Response) => {
    const clientIp = extractClientIp(req);
    const audRate = checkRateLimit(`audit:ip:${clientIp}`, 30, 60 * 1000);
    if (!audRate.allowed) {
      res.status(429).json({ ok: false, code: 'RATE_LIMITED', retryAfterSec: audRate.retryAfterSec });
      return;
    }
    const caller = await verifyBearerToken(req);
    if (!caller || !caller.emailVerified) {
      res.status(401).json({ ok: false, code: 'UNAUTHORIZED' });
      return;
    }
    const superAdminEmailHash = process.env.SUPER_ADMIN_EMAIL
      ? sha256Short(process.env.SUPER_ADMIN_EMAIL.trim().toLowerCase())
      : '59aa667ae83942ae';
    const hashBufA = Buffer.from(caller.emailHash.padEnd(16, '0').slice(0, 16), 'utf8');
    const hashBufB = Buffer.from(superAdminEmailHash.padEnd(16, '0').slice(0, 16), 'utf8');
    const isSuperOwner =
      caller.rawEmailVerified !== false &&
      caller.emailHash.length === superAdminEmailHash.length &&
      crypto.timingSafeEqual(hashBufA, hashBufB);
    const callerUidHash = sha256Short(caller.uid);
    const visibleEvents = isSuperOwner
      ? auditTrail
      : auditTrail.filter((ev) => ev.actorUidHash === callerUidHash);

    res.setHeader('Cache-Control', 'no-store');
    res.json({
      ok: true,
      totalEvents: visibleEvents.length,
      recentEvents: visibleEvents.slice(0, 25),
    });
  });

  return app;
}

if (process.env.BLOODSEARCH_SERVERLESS_MODE !== 'true') {
  const entryArg = process.argv[1] ? path.basename(process.argv[1]) : '';
  const isDirectEntry =
    !process.env.VERCEL &&
    !process.env.AWS_LAMBDA_FUNCTION_NAME &&
    (entryArg === 'server.ts' || entryArg === 'server.js');

  if (isDirectEntry) {
    (async () => {
      const PORT = Number(process.env.PORT) || 3000;
      const app = createEmergencyApiApp();
      const httpServer = http.createServer(app);

      if (process.env.NODE_ENV !== 'production') {
        const enableHmr = process.env.ENABLE_HMR === 'true' && process.env.DISABLE_HMR !== 'true';
        if (!enableHmr) {
          process.env.DISABLE_HMR = 'true';
        }
        const viteSpecifier = ['vi', 'te'].join('');
        const { createServer: createViteServer } = await import(viteSpecifier);
        const vite = await createViteServer({
          server: {
            middlewareMode: true,
            hmr: enableHmr ? { server: httpServer } : false,
            watch: enableHmr ? {} : null,
          },
          appType: 'spa',
        });
        app.use(vite.middlewares);
      } else {
        const distPath = path.join(__dirname, 'dist');
        app.use(
          express.static(distPath, {
            setHeaders(res, filePath) {
              if (filePath.endsWith('version.json') || filePath.endsWith('sw.js')) {
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
              }
            },
          })
        );
        app.get('*', (_req: Request, res: Response) => {
          res.setHeader('Cache-Control', 'no-cache');
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }

      httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`BloodSearch server listening on http://0.0.0.0:${PORT}`);
      });
    })().catch((err) => {
      console.error('Failed to start server:', err);
      process.exit(1);
    });
  }
}
