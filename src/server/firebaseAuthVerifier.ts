import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Request } from 'express';
import { cert, getApps, initializeApp, type App as FirebaseAdminApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { hashIdentifier, type AuthenticatedActor } from '../db/repositories/bloodSearchRepo.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AppletFirebaseConfig {
  projectId?: string;
  apiKey?: string;
}

function readLocalFirebaseConfig(): AppletFirebaseConfig {
  try {
    const cfgPath = path.resolve(__dirname, '..', '..', 'firebase-applet-config.json');
    if (!fs.existsSync(cfgPath)) return {};
    return JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as AppletFirebaseConfig;
  } catch {
    return {};
  }
}

let cachedAdminApp: FirebaseAdminApp | null = null;

function getOrInitFirebaseAdminApp(projectId: string): FirebaseAdminApp | null {
  if (cachedAdminApp) return cachedAdminApp;
  const existing = getApps();
  if (existing.length > 0) {
    cachedAdminApp = existing[0]!;
    return cachedAdminApp;
  }

  try {
    const rawSvcJson = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
    if (rawSvcJson) {
      const parsed = JSON.parse(rawSvcJson);
      cachedAdminApp = initializeApp({
        credential: cert(parsed),
        projectId: parsed.project_id || projectId,
      });
      return cachedAdminApp;
    }

    if (projectId) {
      // firebase-admin/auth verifyIdToken validates RS256 signatures against Google's public JWKS keys
      // using projectId alone (no private service account key needed for JWT verification!).
      cachedAdminApp = initializeApp({ projectId });
      return cachedAdminApp;
    }
  } catch {
    return null;
  }
  return null;
}

export function extractHashedClientIp(req: Request): string {
  const forwarded = String(req.headers['x-forwarded-for'] || '')
    .split(',')[0]
    ?.trim();
  const rawIp = forwarded || req.socket?.remoteAddress || 'unknown';
  return hashIdentifier(rawIp);
}

/**
 * Verifies a Firebase Authentication Bearer ID Token strictly on the server:
 *  1. Primary: `firebase-admin/auth` cryptographic RS256 JWKS verification (`verifyIdToken`).
 *  2. Fallback: Firebase IdentityToolkit `accounts:lookup` endpoint if JWKS network is unreachable.
 *  NEVER trusts unverified JWT payloads or client-supplied role/UID headers.
 */
export async function verifyServerFirebaseIdentity(
  req: Request,
  overrideVerifier?: (token: string) => Promise<AuthenticatedActor | null>
): Promise<AuthenticatedActor | null> {
  const authHeader = String(req.headers.authorization || '');
  if (!authHeader.startsWith('Bearer ')) return null;
  const idToken = authHeader.slice(7).trim();
  if (!idToken || idToken.length > 4096) return null;

  const ipHash = extractHashedClientIp(req);

  if (overrideVerifier) {
    const actor = await overrideVerifier(idToken);
    return actor ? { ...actor, ipHash } : null;
  }

  const cfg = readLocalFirebaseConfig();
  const projectId = (process.env.FIREBASE_PROJECT_ID || cfg.projectId || '').trim();

  // 1. Cryptographic RS256 JWT verification via firebase-admin
  const adminApp = getOrInitFirebaseAdminApp(projectId);
  if (adminApp) {
    try {
      const decoded = await getAuth(adminApp).verifyIdToken(idToken, false);
      if (decoded?.uid) {
        return {
          uid: decoded.uid,
          email: decoded.email ? decoded.email.toLowerCase() : null,
          emailVerified: Boolean(decoded.email_verified),
          ipHash,
        };
      }
    } catch {
      // Fall through to IdentityToolkit lookup only if configured
    }
  }

  // 2. Secondary verification via Google IdentityToolkit accounts:lookup
  if (cfg.apiKey) {
    try {
      const resp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(cfg.apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );
      if (!resp.ok) return null;
      const body = (await resp.json()) as {
        users?: Array<{ localId?: string; email?: string; emailVerified?: boolean }>;
      };
      const user = body.users?.[0];
      if (!user?.localId) return null;
      return {
        uid: user.localId,
        email: user.email ? user.email.toLowerCase() : null,
        emailVerified: Boolean(user.emailVerified),
        ipHash,
      };
    } catch {
      return null;
    }
  }

  return null;
}
