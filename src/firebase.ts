import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import {
  initializeAuth,
  getAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  ConfirmationResult,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  BloodGroup,
  BloodRequest,
  ContactConsentRequestItem,
  ContactVisibility,
  Donor,
  DonorAvailabilityStatus,
  LiveDonorTrip,
  LiveDonorTripStatus,
  RequestAlertItem,
  RequestLifecycleState,
  RequiredTimeWindow,
  Responder,
  UserAccount,
} from './types';
import {
  deriveRequestLifecycleState,
  normalizeValidBangladeshMobileE164,
} from './utils/donorMatcher';
import { isFakeIdentifier, isFakePersonName } from './data/mockDonors';

// ============================================================================
// 1. INITIALIZE FIREBASE SDK (Iframe-Resilient Persistence + Popup Resolver)
// ============================================================================
const app = initializeApp(firebaseConfig);

const rawRecaptchaSiteKey = String(
  (import.meta as any).env?.VITE_RECAPTCHA_V3_SITE_KEY || ''
).trim();

export const IS_APP_CHECK_CONFIGURED = Boolean(
  rawRecaptchaSiteKey && rawRecaptchaSiteKey !== 'YOUR_RECAPTCHA_V3_SITE_KEY'
);

if (typeof window !== 'undefined' && IS_APP_CHECK_CONFIGURED) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(rawRecaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    console.warn('Firebase App Check init skipped:', e);
  }
}

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

function createResilientAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createResilientAuth();
auth.languageCode = 'bn';

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;
export const FIREBASE_PROJECT_NUMBER = firebaseConfig.messagingSenderId || '194868852449';
export const FIREBASE_AUTH_PROVIDERS_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;
export const FIREBASE_SETTINGS_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
export const FIREBASE_PROJECT_SETTINGS_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/settings/general`;
export const FIREBASE_DATA_CONSOLE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`;
export const FIREBASE_RULES_CONSOLE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/rules`;
export const FIREBASE_APP_CHECK_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/appcheck`;
export const FIREBASE_BACKUPS_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/backups`;
export const FIREBASE_USAGE_BUDGET_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/usage`;
export const GCP_API_CREDENTIALS_URL = `https://console.cloud.google.com/apis/credentials?project=${firebaseConfig.projectId}`;
export const GCP_TOKEN_SERVICE_API_URL = `https://console.developers.google.com/apis/api/securetoken.googleapis.com/overview?project=${FIREBASE_PROJECT_NUMBER}`;

export const BOOTSTRAPPED_SUPER_ADMIN_EMAIL =
  String((import.meta as any).env?.VITE_SUPER_ADMIN_EMAIL || '').trim() ||
  'shamimrakib015@gmail.com';

export const DEFAULT_AVATAR_DATA_URI =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23e11d48'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff'/%3E%3Cpath d='M26 102c4-19 18-30 34-30s30 11 34 30' fill='%23ffffff'/%3E%3C/svg%3E";

// ============================================================================
// 1B. AUTH TOKEN-SERVICE HEALTH GATE (Prevents Disabled securetoken API From
//     Poisoning Firestore WebChannel Into False Offline Mode)
// ============================================================================
export interface TokenServiceAlertInfo {
  active: boolean;
  expiredEmail?: string;
  enableApiUrl: string;
  detectedAt: string;
}

let latestTokenServiceAlert: TokenServiceAlertInfo | null = null;
let tokenExpiryGuardTimer: number | null = null;

export function getTokenServiceAlert(): TokenServiceAlertInfo | null {
  return latestTokenServiceAlert;
}

export function dismissTokenServiceAlert(): void {
  latestTokenServiceAlert = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bloodsearch_token_service_alert'));
  }
}

function recordTokenServiceAlert(rawErrorMessage: string, email?: string | null): void {
  const urlMatch = rawErrorMessage.match(
    /https:\/\/console\.developers\.google\.com\/apis\/api\/securetoken\.googleapis\.com\/overview\?project=[0-9a-zA-Z_-]+/
  );
  latestTokenServiceAlert = {
    active: true,
    expiredEmail: email || undefined,
    enableApiUrl: urlMatch ? urlMatch[0] : GCP_TOKEN_SERVICE_API_URL,
    detectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bloodsearch_token_service_alert'));
  }
}

export async function probeTokenServiceApiEnabled(): Promise<boolean> {
  try {
    const res = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: 'probe_status_check',
        }),
      }
    );
    const json = await res.json().catch(() => ({}));
    const msg = String(json?.error?.message || '');
    const status = String(json?.error?.status || '');
    if (
      msg.includes('Token Service API has not been used') ||
      msg.includes('securetoken.googleapis.com') ||
      msg.includes('SERVICE_DISABLED') ||
      status === 'PERMISSION_DENIED'
    ) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

function scheduleProactiveTokenServiceGuard(user: User): void {
  if (typeof window === 'undefined') return;
  if (tokenExpiryGuardTimer !== null) {
    window.clearTimeout(tokenExpiryGuardTimer);
    tokenExpiryGuardTimer = null;
  }
  user
    .getIdTokenResult()
    .then((tokenResult) => {
      const expMs = new Date(tokenResult.expirationTime).getTime();
      if (!Number.isFinite(expMs)) return;
      // Check 6 minutes before expiry (1 minute before Firebase SDK's 5-min refresh window)
      const msUntilGuard = Math.max(5000, expMs - Date.now() - 6 * 60 * 1000);
      tokenExpiryGuardTimer = window.setTimeout(async () => {
        if (auth.currentUser?.uid !== user.uid) return;
        const enabled = await probeTokenServiceApiEnabled();
        if (!enabled && auth.currentUser?.uid === user.uid) {
          recordTokenServiceAlert(GCP_TOKEN_SERVICE_API_URL, user.email);
          await signOut(auth).catch(() => {});
        }
      }, msUntilGuard);
    })
    .catch(() => {});
}

export async function validateOrClearBrokenAuthToken(
  candidateUser: User | null
): Promise<User | null> {
  if (!candidateUser) return null;
  try {
    await candidateUser.getIdToken();
    scheduleProactiveTokenServiceGuard(candidateUser);
    return candidateUser;
  } catch (err: any) {
    const rawMsg = String(err?.message || err || '');
    const code = String(err?.code || '');
    const isTokenServiceDisabled =
      rawMsg.includes('token-service-api') ||
      rawMsg.includes('securetoken.googleapis.com') ||
      code.includes('token-service-api');
    const isInvalidatedToken =
      isTokenServiceDisabled ||
      code === 'auth/user-token-expired' ||
      code === 'auth/invalid-user-token' ||
      code === 'auth/user-disabled';

    if (isTokenServiceDisabled) {
      recordTokenServiceAlert(rawMsg, candidateUser.email);
    }

    if (isInvalidatedToken) {
      // Sign out ONLY the broken Firebase Auth token so Firestore never gets stuck offline;
      // keep localStorage profile intact for smooth UX.
      await signOut(auth).catch(() => {});
      return null;
    }
    return candidateUser;
  }
}

let bootAuthHealthPromise: Promise<void> | null = null;

export function waitForHealthyAuthBoot(): Promise<void> {
  if (!bootAuthHealthPromise) {
    bootAuthHealthPromise = (async () => {
      try {
        await auth.authStateReady();
        if (auth.currentUser) {
          await validateOrClearBrokenAuthToken(auth.currentUser);
        }
      } catch {
        // Proceed safely if IndexedDB is restricted
      }
    })();
  }
  return bootAuthHealthPromise;
}

export async function ensureValidAuthSession(): Promise<User | null> {
  await waitForHealthyAuthBoot();
  return validateOrClearBrokenAuthToken(auth.currentUser);
}

function attachSnapshotAfterBoot(startSnapshot: () => () => void): () => void {
  let cancelled = false;
  let innerUnsub: (() => void) | null = null;
  waitForHealthyAuthBoot().then(() => {
    if (!cancelled) {
      try {
        innerUnsub = startSnapshot();
      } catch (e) {
        console.warn('Firestore listener setup skipped:', e);
      }
    }
  });
  return () => {
    cancelled = true;
    if (innerUnsub) {
      innerUnsub();
    }
  };
}

// ============================================================================
// 2. VALIDATE CONNECTION ON BOOT (Mandatory per Firebase Integration Skill)
// ============================================================================
async function testConnection() {
  await waitForHealthyAuthBoot();
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// ============================================================================
// 3. STANDARDIZED FIRESTORE ERROR HANDLER (Mandatory per Skill Section 3)
// ============================================================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ============================================================================
// 4. ZERO-LEAK CRYPTOGRAPHIC ADMIN CODE HASHING (Server-Verified in Firestore)
//    Zero static secret codes or hashes exist in the client bundle!
// ============================================================================

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr(n: number, x: number): number {
  return (x >>> n) | (x << (32 - n));
}

export function sha256HexSync(asciiOrUtf8: string): string {
  const bytes = new TextEncoder().encode(asciiOrUtf8);
  const bitLen = bytes.length * 8;
  const totalLen = (((bytes.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(totalLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(totalLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);
  for (let offset = 0; offset < totalLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((v) => v.toString(16).padStart(8, '0'))
    .join('');
}

export function computeAdminProofHashSync(rawCode: string): {
  wellFormed: boolean;
  proofHash: string;
} {
  const normalized = rawCode.trim().toUpperCase();
  if (normalized.length < 6 || normalized.length > 64) {
    return { wellFormed: false, proofHash: '' };
  }
  const proofHash = sha256HexSync(`BSBD_OWNER_VAULT_V2:${normalized}`);
  return {
    wellFormed: true,
    proofHash,
  };
}

export async function verifyAdminInviteCodeInCloud(
  rawCode: string,
  currentUser?: User | null
): Promise<{ valid: boolean; proofHash: string }> {
  await waitForHealthyAuthBoot();
  const u = currentUser ?? (await ensureValidAuthSession());
  if (u && isBootstrappedAdminUser(u)) {
    return {
      valid: true,
      proofHash: sha256HexSync(`BSBD_SUPER_OWNER:${u.uid}`),
    };
  }
  const { wellFormed, proofHash } = computeAdminProofHashSync(rawCode);
  if (!wellFormed || !u) {
    return { valid: false, proofHash: '' };
  }
  try {
    const snap = await getDoc(doc(db, 'adminInviteLocks', proofHash));
    if (snap.exists() && snap.data()?.active === true) {
      return { valid: true, proofHash };
    }
    return { valid: false, proofHash: '' };
  } catch {
    return { valid: false, proofHash: '' };
  }
}

// ============================================================================
// 5. DEFENSIVE SANITIZATION & BANGLA-DIGIT PHONE NORMALIZATION
// ============================================================================
const BANGLA_DIGIT_MAP: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

export function normalizeAsciiDigits(input: string): string {
  return (input || '').replace(/[০-৯]/g, (ch) => BANGLA_DIGIT_MAP[ch] ?? ch);
}

export function sanitizeSafeText(raw: string | undefined | null): string {
  return (raw ?? '')
    .replace(/<\s*\/?\s*(?:script|iframe|svg|object|embed|img|meta|link|style|form|base)\b[^>]*>/gi, '')
    .replace(/<[^>]*\bon[a-z]+\s*=/gi, '<')
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .replace(/on(?:error|load|click|mouseover|focus|toggle|begin)\s*=/gi, '')
    .trim();
}

function clampStr(
  val: string | undefined | null,
  minLen: number,
  maxLen: number,
  fallback: string
): string {
  const clean = sanitizeSafeText(val);
  if (clean.length < minLen) return sanitizeSafeText(fallback).slice(0, maxLen);
  return clean.slice(0, maxLen);
}

function clampNum(val: number | undefined | null, min: number, max: number, fallback: number): number {
  const num = Number(val);
  if (Number.isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

export function maskPhoneNumber(phone: string): string {
  const digits = normalizeAsciiDigits(phone).replace(/\s+/g, '');
  if (digits.length < 7) return '017****00';
  return `${digits.slice(0, 4)}****${digits.slice(-2)}`.slice(0, 24);
}

/**
 * Normalizes any Bangladesh mobile input (Bangla or English digits, with or without
 * +880 / 880 / 01 / 17...) into strict E.164 format (+8801XXXXXXXXX).
 * Prevents the +880017... double-zero bug!
 */
export function formatBangladeshE164(rawPhone: string): string {
  const ascii = normalizeAsciiDigits(rawPhone).trim();
  let digits = ascii.replace(/[^0-9]/g, '');

  // Strip country prefix 880 or 88 if present
  if (digits.startsWith('880')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('88') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  // Strip any leading zeros so 01712345678 and 001712345678 both become 1712345678
  digits = digits.replace(/^0+/, '');

  if (!digits) return '';
  return `+880${digits}`;
}

export function isValidBangladeshMobile(rawPhone: string): boolean {
  const e164 = formatBangladeshE164(rawPhone);
  return /^\+8801[3-9][0-9]{8}$/.test(e164);
}

export async function compressAvatarIfNeeded(dataUrlOrHttp: string): Promise<string> {
  if (!dataUrlOrHttp) {
    return DEFAULT_AVATAR_DATA_URI;
  }
  if (!dataUrlOrHttp.startsWith('data:image')) {
    const httpsUpgraded = dataUrlOrHttp.replace(/^http:\/\//i, 'https://');
    if (!/^https:\/\//i.test(httpsUpgraded) || httpsUpgraded.length > 2048) {
      return DEFAULT_AVATAR_DATA_URI;
    }
    return httpsUpgraded;
  }
  if (dataUrlOrHttp.length <= 65000) {
    return dataUrlOrHttp;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 180;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let compressed = canvas.toDataURL('image/jpeg', 0.68);
        if (compressed.length > 135000) {
          compressed = canvas.toDataURL('image/jpeg', 0.5);
        }
        resolve(compressed.length <= 140000 ? compressed : DEFAULT_AVATAR_DATA_URI);
      } else {
        resolve(DEFAULT_AVATAR_DATA_URI);
      }
    };
    img.onerror = () => {
      resolve(DEFAULT_AVATAR_DATA_URI);
    };
    img.src = dataUrlOrHttp;
  });
}

export async function compressChatAttachmentImage(dataUrlOrHttp: string): Promise<string> {
  if (!dataUrlOrHttp) return '';
  if (!dataUrlOrHttp.startsWith('data:image')) {
    return dataUrlOrHttp.slice(0, 145000);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 760;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let compressed = canvas.toDataURL('image/jpeg', 0.72);
        if (compressed.length > 140000) {
          compressed = canvas.toDataURL('image/jpeg', 0.52);
        }
        resolve(compressed.length <= 148000 ? compressed : '');
      } else {
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = dataUrlOrHttp;
  });
}

// ============================================================================
// 6. LIVE FIREBASE AUTH DIAGNOSTICS & REAL AUTHENTICATION METHODS
// ============================================================================
export interface LiveAuthDiagnosticReport {
  checkedAt: string;
  currentHostname: string;
  domainAuthorized: boolean;
  authorizedDomains: string[];
  tokenServiceEnabled: boolean;
  tokenServiceUrl: string;
  googleOAuthReady: boolean;
  emailPasswordEnabled: boolean;
  emailLinkEnabled: boolean;
  phoneSmsStatus: 'READY' | 'PROVIDER_DISABLED' | 'BILLING_REQUIRED' | 'UNKNOWN';
  phoneRawMessage: string;
}

export async function runLiveFirebaseAuthDiagnostics(): Promise<LiveAuthDiagnosticReport> {
  const apiKey = firebaseConfig.apiKey;
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const report: LiveAuthDiagnosticReport = {
    checkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    currentHostname: hostname,
    domainAuthorized: true,
    authorizedDomains: [],
    tokenServiceEnabled: true,
    tokenServiceUrl: GCP_TOKEN_SERVICE_API_URL,
    googleOAuthReady: false,
    emailPasswordEnabled: false,
    emailLinkEnabled: false,
    phoneSmsStatus: 'UNKNOWN',
    phoneRawMessage: '',
  };

  try {
    // 0. Check Google Cloud Token Service API (securetoken.googleapis.com)
    report.tokenServiceEnabled = await probeTokenServiceApiEnabled();
    if (report.tokenServiceEnabled) {
      dismissTokenServiceAlert();
    }

    // 1. Check Authorized Domains
    const cfgRes = await fetch(`https://identitytoolkit.googleapis.com/v1/projects?key=${apiKey}`);
    if (cfgRes.ok) {
      const cfgJson = await cfgRes.json();
      const domains: string[] = cfgJson.authorizedDomains || [];
      report.authorizedDomains = domains;
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
        report.domainAuthorized = domains.includes(hostname);
      }
    }

    // 2. Check Google OAuth Provider
    const googleRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: 'google.com',
          continueUri: `https://${firebaseConfig.authDomain}/__/auth/handler`,
        }),
      }
    );
    if (googleRes.ok) {
      const gJson = await googleRes.json();
      report.googleOAuthReady = Boolean(gJson.authUri);
    }

    // 3. Check Email/Password Provider status (non-destructive invalid-email probe)
    const passRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'probe_status_check@invalid-probe.local',
          password: 'ProbeCheckPassword123!',
          returnSecureToken: true,
        }),
      }
    );
    const passJson = await passRes.json();
    const passErr = passJson?.error?.message || '';
    report.emailPasswordEnabled =
      passErr !== 'PASSWORD_LOGIN_DISABLED' && passErr !== 'OPERATION_NOT_ALLOWED';

    // 4. Check Email Link Sign-In status
    const linkRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestType: 'EMAIL_SIGNIN',
          email: 'probe_status_check@invalid-probe.local',
          continueUrl: typeof window !== 'undefined' ? window.location.origin : `https://${firebaseConfig.authDomain}`,
          canHandleCodeInApp: true,
        }),
      }
    );
    const linkJson = await linkRes.json();
    const linkErr = linkJson?.error?.message || '';
    report.emailLinkEnabled = linkErr !== 'OPERATION_NOT_ALLOWED';

    // 5. Check Phone SMS OTP Provider status
    const phoneRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '+8801700000000',
        }),
      }
    );
    const phoneJson = await phoneRes.json();
    const phoneErr = phoneJson?.error?.message || '';
    report.phoneRawMessage = phoneErr;
    if (phoneErr === 'OPERATION_NOT_ALLOWED') {
      report.phoneSmsStatus = 'PROVIDER_DISABLED';
    } else if (phoneErr.includes('BILLING_NOT_ENABLED') || phoneErr.includes('QUOTA_EXCEEDED')) {
      report.phoneSmsStatus = 'BILLING_REQUIRED';
    } else if (
      phoneErr.includes('MISSING_RECAPTCHA_TOKEN') ||
      phoneErr.includes('CAPTCHA_CHECK_FAILED') ||
      phoneErr.includes('INVALID_APP_CREDENTIAL') ||
      phoneRes.ok
    ) {
      report.phoneSmsStatus = 'READY';
    }
  } catch (e: any) {
    report.phoneRawMessage = e?.message || 'NETWORK_ERROR';
  }

  return report;
}

export interface AuthProviderErrorDetails {
  code: string;
  messageBn: string;
  messageEn: string;
  needsConsoleProviderEnable: boolean;
  isPopupBlocked?: boolean;
  consoleUrl: string;
}

export function parseFirebaseAuthError(error: any): AuthProviderErrorDetails {
  const code = error?.code || 'auth/unknown';
  const rawMsg = String(error?.message || '');

  if (
    rawMsg.includes('token-service-api') ||
    rawMsg.includes('securetoken.googleapis.com') ||
    code.includes('token-service-api')
  ) {
    return {
      code: 'auth/token-service-disabled',
      messageBn:
        'আপনার পূর্ববর্তী সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে উপরের "Google দিয়ে ১-ক্লিকে লগইন করুন" বাটনে ট্যাপ করে পুনরায় যুক্ত হোন।',
      messageEn:
        'Your session has expired. Please tap "Continue with Google" above to sign in again.',
      needsConsoleProviderEnable: false,
      consoleUrl: '',
    };
  }

  if (
    code === 'auth/operation-not-allowed' ||
    code === 'auth/admin-restricted-operation' ||
    rawMsg.includes('PASSWORD_LOGIN_DISABLED') ||
    rawMsg.includes('OPERATION_NOT_ALLOWED')
  ) {
    return {
      code,
      messageBn:
        'এই মুহূর্তে এই পদ্ধতিটি সাময়িক বন্ধ আছে। অনুগ্রহ করে উপরের "Google দিয়ে ১-ক্লিকে লগইন করুন" বাটনে ট্যাপ করে সাথে সাথে লগইন করুন।',
      messageEn:
        'This sign-in method is currently unavailable. Please use "Continue with Google" above for instant access.',
      needsConsoleProviderEnable: false,
      consoleUrl: '',
    };
  }

  if (
    code === 'auth/billing-not-enabled' ||
    code === 'auth/quota-exceeded' ||
    rawMsg.includes('BILLING_NOT_ENABLED') ||
    rawMsg.includes('QUOTA_EXCEEDED') ||
    rawMsg.includes('SMS unable to be sent until this region enabled') ||
    rawMsg.includes('REGION_NOT_ENABLED') ||
    code === 'auth/unsupported-first-factor'
  ) {
    return {
      code,
      messageBn:
        'এই মুহূর্তে মোবাইল এসএমএস সার্ভিস ব্যস্ত আছে। কোনো অপেক্ষা ছাড়াই লগইন করতে উপরের "Google দিয়ে ১-ক্লিকে লগইন করুন" বাটনটি ব্যবহার করুন।',
      messageEn:
        'SMS delivery is temporarily unavailable right now. Please tap "Continue with Google" above to sign in immediately.',
      needsConsoleProviderEnable: false,
      consoleUrl: '',
    };
  }

  if (
    code === 'auth/captcha-check-failed' ||
    code === 'auth/invalid-app-credential' ||
    code === 'auth/missing-app-credential' ||
    code === 'auth/missing-client-identifier' ||
    rawMsg.includes('CAPTCHA_CHECK_FAILED') ||
    rawMsg.includes('INVALID_APP_CREDENTIAL')
  ) {
    return {
      code: 'auth/captcha-check-failed',
      messageBn:
        'নিরাপত্তা যাচাই সম্পন্ন হয়নি। আবার চেষ্টা করুন অথবা সরাসরি "Google দিয়ে ১-ক্লিকে লগইন করুন" ব্যবহার করুন।',
      messageEn:
        'Security verification did not complete. Please try again or use "Continue with Google" above.',
      needsConsoleProviderEnable: false,
      consoleUrl: '',
    };
  }

  if (code === 'auth/too-many-requests' || rawMsg.includes('TOO_MANY_ATTEMPTS_TRY_LATER')) {
    return {
      code,
      messageBn:
        'অল্প সময়ে একাধিকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন অথবা সরাসরি Google দিয়ে লগইন করুন।',
      messageEn:
        'Too many attempts in a short time. Please wait a moment or sign in with Google above.',
      needsConsoleProviderEnable: false,
      consoleUrl: '',
    };
  }

  if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
    return {
      code,
      messageBn:
        'আপনার ব্রাউজারে পপ-আপ ব্লক করা আছে। ব্রাউজারে পপ-আপ অনুমতি দিয়ে আবার লগইন বাটনে ট্যাপ করুন।',
      messageEn:
        'Your browser blocked the sign-in window. Please allow popups for this site and tap again.',
      needsConsoleProviderEnable: false,
      isPopupBlocked: true,
      consoleUrl: '',
    };
  }

  if (code === 'auth/unauthorized-domain') {
    return {
      code,
      messageBn: 'এই ঠিকানা থেকে লগইন সাময়িক সীমাবদ্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।',
      messageEn: 'Sign-in from this domain is temporarily restricted.',
      needsConsoleProviderEnable: false,
      consoleUrl: '',
    };
  }

  if (code === 'auth/popup-closed-by-user') {
    return {
      code,
      messageBn: 'লগইন সম্পন্ন হওয়ার আগেই উইন্ডোটি বন্ধ হয়ে গেছে। আবার ট্যাপ করে আপনার অ্যাকাউন্ট নির্বাচন করুন।',
      messageEn: 'Sign-in window was closed before selecting an account. Please tap again.',
      needsConsoleProviderEnable: false,
      consoleUrl: '',
    };
  }

  if (code === 'auth/invalid-phone-number') {
    return {
      code,
      messageBn: 'সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন (যেমন: 01712345678)।',
      messageEn: 'Please enter a valid 11-digit mobile number (e.g. 01712345678).',
      needsConsoleProviderEnable: false,
      consoleUrl: '',
    };
  }

  if (code === 'auth/invalid-verification-code') {
    return {
      code,
      messageBn: 'ওটিপি কোডটি সঠিক নয়। অনুগ্রহ করে ৬-সংখ্যার কোডটি মিলিয়ে আবার লিখুন।',
      messageEn: 'Incorrect verification code. Please check the 6-digit SMS code and try again.',
      needsConsoleProviderEnable: false,
      consoleUrl: '',
    };
  }

  if (code === 'auth/code-expired') {
    return {
      code,
      messageBn: 'কোডটির মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন কোড পাঠান।',
      messageEn: 'Verification code expired. Please request a new code.',
      needsConsoleProviderEnable: false,
      consoleUrl: '',
    };
  }

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return {
      code,
      messageBn:
        'ইমেইল বা পাসওয়ার্ড মেলেনি। সহজে লগইন করতে উপরের "Google দিয়ে ১-ক্লিকে লগইন করুন" বাটনটি ব্যবহার করুন।',
      messageEn:
        'Incorrect email or password. Use "Continue with Google" above for 1-click sign-in.',
      needsConsoleProviderEnable: false,
      consoleUrl: '',
    };
  }

  if (code === 'auth/email-already-in-use') {
    return {
      code,
      messageBn: 'এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা আছে। সরাসরি লগইন করুন অথবা Google বাটন ব্যবহার করুন।',
      messageEn: 'This email is already registered. Sign in or continue with Google above.',
      needsConsoleProviderEnable: false,
      consoleUrl: '',
    };
  }

  return {
    code,
    messageBn: 'লগইন সম্পন্ন করা যায়নি। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।',
    messageEn: 'Could not complete sign-in. Please check your connection and try again.',
    needsConsoleProviderEnable: false,
    consoleUrl: '',
  };
}

/**
 * IMPORTANT: Must be invoked synchronously inside a click/submit handler
 * (no preceding `await`) so browsers never block the OAuth popup!
 */
export function signInWithGoogleReal(loginHintEmail?: string): Promise<User> {
  const provider = new GoogleAuthProvider();
  const params: Record<string, string> = {
    prompt: 'select_account',
  };
  const cleanHint = (loginHintEmail || '').trim();
  if (cleanHint && cleanHint.includes('@')) {
    params.login_hint = cleanHint;
  }
  provider.setCustomParameters(params);

  return signInWithPopup(auth, provider, browserPopupRedirectResolver).then((res) => {
    dismissTokenServiceAlert();
    scheduleProactiveTokenServiceGuard(res.user);
    return res.user;
  });
}

export async function sendRealGmailSignInLink(email: string): Promise<void> {
  const cleanEmail = email.trim();
  const actionCodeSettings = {
    url: window.location.origin + window.location.pathname,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, cleanEmail, actionCodeSettings);
  localStorage.setItem('bloodsearch_email_for_signin', cleanEmail);
}

export async function completeRealGmailSignInIfPresent(): Promise<User | null> {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let storedEmail = localStorage.getItem('bloodsearch_email_for_signin');
    if (!storedEmail) {
      return null;
    }
    const result = await signInWithEmailLink(auth, storedEmail, window.location.href);
    localStorage.removeItem('bloodsearch_email_for_signin');
    window.history.replaceState({}, document.title, window.location.pathname);
    return result.user;
  }
  return null;
}

export async function registerOrLoginRealEmailPassword(
  email: string,
  password: string,
  isRegister: boolean
): Promise<{ user: User; verificationSent: boolean }> {
  const cleanEmail = email.trim();
  if (isRegister) {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    await sendEmailVerification(cred.user);
    return { user: cred.user, verificationSent: true };
  }
  const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
  if (!cred.user.emailVerified) {
    try {
      await sendEmailVerification(cred.user);
      return { user: cred.user, verificationSent: true };
    } catch {
      return { user: cred.user, verificationSent: false };
    }
  }
  return { user: cred.user, verificationSent: false };
}

export async function sendRealPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

export function clearPhoneRecaptchaVerifier(recaptchaContainerId?: string): void {
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch {}
    activeRecaptchaVerifier = null;
  }
  if (recaptchaContainerId && typeof document !== 'undefined') {
    const host = document.getElementById(recaptchaContainerId);
    if (host) {
      host.innerHTML = '';
    }
  }
}

export interface SendPhoneOtpOptions {
  forceVisibleRecaptcha?: boolean;
  onRecaptchaChallengeShown?: () => void;
  onRecaptchaSolved?: () => void;
}

async function dispatchPhoneOtpWithVerifier(
  formattedPhone: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  // If user is already signed in with Google/Email without a linked phone, try linking first
  // so they don't lose their existing Google/Admin session; fall back to signInWithPhoneNumber
  // if this phone number is already linked to an existing account.
  const current = auth.currentUser;
  if (current && !current.phoneNumber) {
    try {
      return await linkWithPhoneNumber(current, formattedPhone, verifier);
    } catch (linkErr: any) {
      const code = String(linkErr?.code || '');
      if (
        code === 'auth/credential-already-in-use' ||
        code === 'auth/provider-already-linked' ||
        code === 'auth/account-exists-with-different-credential'
      ) {
        return await signInWithPhoneNumber(auth, formattedPhone, verifier);
      }
      throw linkErr;
    }
  }
  return await signInWithPhoneNumber(auth, formattedPhone, verifier);
}

export async function sendRealPhoneSmsOtp(
  rawPhone: string,
  recaptchaContainerId: string,
  options?: SendPhoneOtpOptions
): Promise<ConfirmationResult> {
  const formattedPhone = formatBangladeshE164(rawPhone);
  if (!isValidBangladeshMobile(rawPhone)) {
    throw {
      code: 'auth/invalid-phone-number',
      message: 'Invalid Bangladesh E.164 phone number.',
    };
  }

  const attemptWithSize = async (sizeMode: 'invisible' | 'normal'): Promise<ConfirmationResult> => {
    clearPhoneRecaptchaVerifier(recaptchaContainerId);
    const host = document.getElementById(recaptchaContainerId);
    if (!host) {
      throw {
        code: 'auth/internal-error',
        message: 'reCAPTCHA mount element not found in DOM.',
      };
    }

    // Fresh child node prevents "reCAPTCHA has already been rendered in this element"
    const widgetEl = document.createElement('div');
    host.appendChild(widgetEl);

    activeRecaptchaVerifier = new RecaptchaVerifier(auth, widgetEl, {
      size: sizeMode,
      callback: () => {
        options?.onRecaptchaSolved?.();
      },
    });

    await activeRecaptchaVerifier.render();
    if (sizeMode === 'normal') {
      options?.onRecaptchaChallengeShown?.();
    }
    return await dispatchPhoneOtpWithVerifier(formattedPhone, activeRecaptchaVerifier);
  };

  if (options?.forceVisibleRecaptcha) {
    return await attemptWithSize('normal');
  }

  try {
    // 1st attempt: Invisible reCAPTCHA — sends OTP in 1 click without hanging on a hidden/unclicked checkbox!
    return await attemptWithSize('invisible');
  } catch (err: any) {
    const code = String(err?.code || '');
    const msg = String(err?.message || '');
    const shouldFallbackToVisibleCheckbox =
      code === 'auth/captcha-check-failed' ||
      code === 'auth/missing-client-identifier' ||
      code === 'auth/internal-error' ||
      msg.includes('CAPTCHA_CHECK_FAILED') ||
      msg.includes('Timeout');

    if (shouldFallbackToVisibleCheckbox) {
      return await attemptWithSize('normal');
    }
    throw err;
  }
}

export async function signOutReal(): Promise<void> {
  clearPhoneRecaptchaVerifier();
  if (tokenExpiryGuardTimer !== null && typeof window !== 'undefined') {
    window.clearTimeout(tokenExpiryGuardTimer);
    tokenExpiryGuardTimer = null;
  }
  await signOut(auth);
  localStorage.removeItem('bloodsearch_current_user');
  sessionStorage.removeItem('bloodsearch_admin_auth');
  window.dispatchEvent(new Event('bloodsearch_user_changed'));
}

/**
 * Safe wrapper around Firebase `onAuthStateChanged` that ensures expired/unrefreshable
 * tokens (e.g., when securetoken.googleapis.com is disabled in GCP) are validated and
 * cleaned up BEFORE emitting a user to UI components or triggering Firestore reads.
 */
export function onAuthStateChanged(
  authInstance: Auth,
  nextOrObserver: (user: User | null) => void,
  errorCallback?: (error: Error) => void
): () => void {
  let active = true;
  let callSeq = 0;
  const rawUnsub = firebaseOnAuthStateChanged(
    authInstance,
    async (rawUser) => {
      const seq = ++callSeq;
      await waitForHealthyAuthBoot();
      if (!active || seq !== callSeq) return;
      if (!rawUser) {
        nextOrObserver(null);
        return;
      }
      const verifiedUser = await validateOrClearBrokenAuthToken(rawUser);
      if (!active || seq !== callSeq) return;
      nextOrObserver(verifiedUser);
    },
    errorCallback
  );
  return () => {
    active = false;
    rawUnsub();
  };
}

export type { User, ConfirmationResult };

// ============================================================================
// 7. REAL FIRESTORE CRUD & ATOMIC SMART ID REGISTRATION
// ============================================================================
export function isUserVerifiedForWrites(user: User | null): boolean {
  if (!user) return false;
  const isPhoneUser =
    user.providerData.some((p) => p.providerId === 'phone') || Boolean(user.phoneNumber);
  return user.emailVerified === true || isPhoneUser;
}

export function isBootstrappedAdminUser(user: User | null): boolean {
  if (!user) return false;
  return (
    user.emailVerified === true &&
    user.email?.toLowerCase() === BOOTSTRAPPED_SUPER_ADMIN_EMAIL.toLowerCase()
  );
}

export async function checkIsVerifiedAdminInFirestore(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (isBootstrappedAdminUser(user)) return true;
  const healthyUser = await validateOrClearBrokenAuthToken(user);
  if (!healthyUser) return false;
  const adminPath = `admins/${healthyUser.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', healthyUser.uid));
    return snap.exists();
  } catch (error) {
    console.warn('Admin status check warning:', adminPath, error);
    return false;
  }
}

export async function fetchUserProfileFromFirestore(uid: string): Promise<UserAccount | null> {
  const healthyUser = await ensureValidAuthSession();
  if (!healthyUser) return null;
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: data.uid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsappPhone: data.whatsappPhone,
      facebookUrl: data.facebookUrl,
      bloodGroup: data.bloodGroup as BloodGroup,
      division: data.division,
      district: data.district,
      upazila: data.upazila,
      photoUrl: data.photoUrl,
      role: data.panelType === 'ADMIN' ? 'ADMIN' : 'USER',
      verifiedStatus: true,
      idCardNumber: data.idCardNumber,
      age: data.age,
      gender: data.gender,
      weightKg: data.weightKg,
      availableToDonate: data.availableToDonate,
      availabilityStatus:
        (data.availabilityStatus as DonorAvailabilityStatus | undefined) ||
        (data.availableToDonate ? 'AVAILABLE' : 'TEMPORARILY_UNAVAILABLE'),
      availabilityConfirmedAtMs:
        data.availabilityConfirmedAt instanceof Timestamp
          ? data.availabilityConfirmedAt.toMillis()
          : undefined,
      shareDirectContact:
        typeof data.shareDirectContact === 'boolean' ? data.shareDirectContact : undefined,
      contactVisibility: data.contactVisibility as ContactVisibility | undefined,
      allowCall: typeof data.allowCall === 'boolean' ? data.allowCall : true,
      allowWhatsApp: typeof data.allowWhatsApp === 'boolean' ? data.allowWhatsApp : true,
      allowSms: typeof data.allowSms === 'boolean' ? data.allowSms : true,
      emergencyAlertsOptIn:
        typeof data.emergencyAlertsOptIn === 'boolean' ? data.emergencyAlertsOptIn : true,
      alertsPaused: typeof data.alertsPaused === 'boolean' ? data.alertsPaused : false,
      totalDonations: data.totalDonations,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return null;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeMyUserProfile(
  uid: string,
  onProfile: (profile: UserAccount | null) => void
): () => void {
  return attachSnapshotAfterBoot(() => {
    const path = `users/${uid}`;
    return onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (!snap.exists()) {
          onProfile(null);
          return;
        }
        const data = snap.data();
        onProfile({
          id: data.uid,
          name: data.name,
          email: data.email,
          phone: data.phone,
          whatsappPhone: data.whatsappPhone,
          facebookUrl: data.facebookUrl,
          bloodGroup: data.bloodGroup as BloodGroup,
          division: data.division,
          district: data.district,
          upazila: data.upazila,
          photoUrl: data.photoUrl,
          role: data.panelType === 'ADMIN' ? 'ADMIN' : 'USER',
          verifiedStatus: true,
          idCardNumber: data.idCardNumber,
          age: data.age,
          gender: data.gender,
          weightKg: data.weightKg,
          availableToDonate: data.availableToDonate,
          availabilityStatus:
            (data.availabilityStatus as DonorAvailabilityStatus | undefined) ||
            (data.availableToDonate ? 'AVAILABLE' : 'TEMPORARILY_UNAVAILABLE'),
          availabilityConfirmedAtMs:
            data.availabilityConfirmedAt instanceof Timestamp
              ? data.availabilityConfirmedAt.toMillis()
              : undefined,
          shareDirectContact:
            typeof data.shareDirectContact === 'boolean' ? data.shareDirectContact : undefined,
          contactVisibility: data.contactVisibility as ContactVisibility | undefined,
          allowCall: typeof data.allowCall === 'boolean' ? data.allowCall : true,
          allowWhatsApp: typeof data.allowWhatsApp === 'boolean' ? data.allowWhatsApp : true,
          allowSms: typeof data.allowSms === 'boolean' ? data.allowSms : true,
          emergencyAlertsOptIn:
            typeof data.emergencyAlertsOptIn === 'boolean' ? data.emergencyAlertsOptIn : true,
          alertsPaused: typeof data.alertsPaused === 'boolean' ? data.alertsPaused : false,
          totalDonations: data.totalDonations,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  });
}

const inFlightAutoSyncUids = new Set<string>();

/**
 * Automatically provisions /users/{uid} and /donors/{uid} in Cloud Firestore the moment
 * a brand-new verified user signs in for the first time, so every connected device & Admin Panel
 * receives the new user automatically in real time without manual refresh.
 */
export async function ensureUserAutoSyncedInFirestore(
  firebaseUser: User
): Promise<UserAccount | null> {
  const validUser = await validateOrClearBrokenAuthToken(firebaseUser);
  if (!validUser) return null;

  const isAdmin = await checkIsVerifiedAdminInFirestore(validUser);
  const existing = await fetchUserProfileFromFirestore(validUser.uid);
  if (existing) {
    if (isAdmin) existing.role = 'ADMIN';
    if (existing.district === 'ঢাকা') existing.district = 'dhaka';
    if (existing.upazila === 'সদর') existing.upazila = 'dhanmondi';

    // Smart 90-Day Medical Recovery Auto-Unlock + Auto-Repair if /donors/{uid} was ever missing
    try {
      const dSnap = await getDoc(doc(db, 'donors', validUser.uid));
      if (dSnap.exists()) {
        const dData = dSnap.data();
        if (dData.available === false && typeof dData.lastDonatedDate === 'string' && dData.lastDonatedDate.length >= 8) {
          const donatedMs = new Date(dData.lastDonatedDate).getTime();
          if (Number.isFinite(donatedMs)) {
            const daysElapsed = Math.floor((Date.now() - donatedMs) / (1000 * 60 * 60 * 24));
            if (daysElapsed >= 90) {
              await syncDonorAvailabilityInFirestore(true);
              existing.availableToDonate = true;
            }
          }
        }
      } else if (isUserVerifiedForWrites(validUser)) {
        // Auto-recreate /donors/{uid} card if an admin or user's public donor card was missing
        const repairedDonor: Donor = {
          id: validUser.uid,
          name: existing.name,
          bloodGroup: existing.bloodGroup,
          division: existing.division || 'dhaka',
          district: existing.district || 'dhaka',
          upazila: existing.upazila || 'dhanmondi',
          phone: existing.phone || '01700000000',
          whatsappPhone: existing.whatsappPhone || existing.phone,
          facebookUrl: existing.facebookUrl,
          available: existing.availableToDonate !== false,
          availabilityStatus: existing.availabilityStatus || 'AVAILABLE',
          availabilityConfirmedAtMs: Date.now(),
          shareDirectContact: Boolean(existing.shareDirectContact),
          contactVisibility: existing.contactVisibility || 'REQUEST_ONLY',
          allowCall: existing.allowCall !== false,
          allowWhatsApp: existing.allowWhatsApp !== false,
          allowSms: existing.allowSms !== false,
          emergencyAlertsOptIn: existing.emergencyAlertsOptIn !== false,
          alertsPaused: existing.alertsPaused === true,
          lastDonatedDate: existing.lastDonationDate || '',
          totalDonations: existing.totalDonations || 0,
          verifiedBadge: isAdmin,
          rating: 5.0,
          reviewsCount: 0,
          age: existing.age || 25,
          gender: existing.gender || 'MALE',
          weightKg: existing.weightKg || 62,
          hospitalAffiliation: isAdmin ? 'অ্যাডমিন ও রক্ত সমন্বয়ক' : 'স্বেচ্ছাসেবী রক্তদাতা',
          avatar: existing.photoUrl || DEFAULT_AVATAR_DATA_URI,
        };
        await registerSmartAccountInFirestore({
          firebaseUser: validUser,
          account: existing,
          donor: repairedDonor,
        }).catch(() => {});
      }
    } catch {}
    return existing;
  }

  if (!isUserVerifiedForWrites(validUser)) {
    return null;
  }

  if (inFlightAutoSyncUids.has(validUser.uid)) {
    return null;
  }
  inFlightAutoSyncUids.add(validUser.uid);

  try {
    let cachedLocal: Partial<UserAccount> | null = null;
    try {
      const raw = localStorage.getItem('bloodsearch_current_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && (!parsed.id || parsed.id === validUser.uid) && !isFakePersonName(parsed.name)) {
          cachedLocal = parsed;
        }
      }
    } catch {}

    const cleanUidSuffix =
      validUser.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || '1001';
    const displayName = (
      cachedLocal?.name ||
      validUser.displayName ||
      validUser.email?.split('@')[0] ||
      'স্বেচ্ছাসেবী রক্তদাতা'
    ).trim();
    const rawVerifiedPhone = normalizeAsciiDigits(
      validUser.phoneNumber || cachedLocal?.phone || ''
    ).trim();
    const hasRealPhone = rawVerifiedPhone.length >= 10 && rawVerifiedPhone !== '01700000000';
    const safePhone = hasRealPhone ? rawVerifiedPhone : '01700000000';
    const safeWa = normalizeAsciiDigits(cachedLocal?.whatsappPhone || safePhone).trim() || safePhone;
    const idCardNumber =
      cachedLocal?.idCardNumber ||
      (isAdmin ? `ADMIN-BD-${cleanUidSuffix}` : `BS-${cleanUidSuffix}`);
    const nowMs = Date.now();

    const autoAccount: UserAccount = {
      id: validUser.uid,
      name: displayName.length >= 2 ? displayName : 'Blood Donor',
      email: validUser.email || cachedLocal?.email || `${validUser.uid.slice(0, 8)}@bloodsearch.bd`,
      phone: safePhone,
      whatsappPhone: safeWa,
      facebookUrl: cachedLocal?.facebookUrl || 'https://facebook.com/bloodsearch.bd',
      bloodGroup: cachedLocal?.bloodGroup || 'O+',
      division: cachedLocal?.division || 'dhaka',
      district:
        cachedLocal?.district && cachedLocal.district !== 'ঢাকা'
          ? cachedLocal.district
          : 'dhaka',
      upazila:
        cachedLocal?.upazila && cachedLocal.upazila !== 'সদর'
          ? cachedLocal.upazila
          : 'dhanmondi',
      photoUrl: validUser.photoURL || cachedLocal?.photoUrl || DEFAULT_AVATAR_DATA_URI,
      role: isAdmin ? 'ADMIN' : 'USER',
      verifiedStatus: true,
      idCardNumber,
      age: cachedLocal?.age || 25,
      gender: cachedLocal?.gender || 'MALE',
      weightKg: cachedLocal?.weightKg || 62,
      availableToDonate: true,
      availabilityStatus: 'AVAILABLE',
      availabilityConfirmedAtMs: nowMs,
      shareDirectContact: hasRealPhone,
      contactVisibility: hasRealPhone ? 'PUBLIC_OPT_IN' : 'REQUEST_ONLY',
      allowCall: true,
      allowWhatsApp: true,
      allowSms: true,
      emergencyAlertsOptIn: true,
      alertsPaused: false,
      totalDonations: cachedLocal?.totalDonations || 0,
      createdAt: new Date().toISOString(),
    };

    const autoDonor: Donor = {
      id: validUser.uid,
      name: autoAccount.name,
      bloodGroup: autoAccount.bloodGroup,
      division: autoAccount.division,
      district: autoAccount.district,
      upazila: autoAccount.upazila,
      phone: safePhone,
      whatsappPhone: safeWa,
      available: true,
      availabilityStatus: 'AVAILABLE',
      availabilityConfirmedAtMs: nowMs,
      shareDirectContact: hasRealPhone,
      contactVisibility: hasRealPhone ? 'PUBLIC_OPT_IN' : 'REQUEST_ONLY',
      allowCall: true,
      allowWhatsApp: true,
      allowSms: true,
      emergencyAlertsOptIn: true,
      alertsPaused: false,
      lastDonatedDate: '',
      totalDonations: autoAccount.totalDonations,
      verifiedBadge: isAdmin,
      rating: 5.0,
      reviewsCount: 0,
      age: autoAccount.age,
      gender: autoAccount.gender,
      weightKg: autoAccount.weightKg,
      hospitalAffiliation: isAdmin ? 'অ্যাডমিন ও রক্ত সমন্বয়ক' : 'স্বেচ্ছাসেবী রক্তদাতা',
      avatar: autoAccount.photoUrl,
    };

    await registerSmartAccountInFirestore({
      firebaseUser: validUser,
      account: autoAccount,
      donor: autoDonor,
    });

    return autoAccount;
  } finally {
    inFlightAutoSyncUids.delete(validUser.uid);
  }
}

export interface UnmaskedDonorContactPayload {
  phone: string;
  whatsappPhone?: string;
  facebookUrl?: string;
  allowCall?: boolean;
  allowWhatsApp?: boolean;
  allowSms?: boolean;
  contactVisibility?: ContactVisibility;
  source: 'CONSENT_DIRECT' | 'APPROVED_REQUEST' | 'OWNER_OR_ADMIN';
}

/**
 * Fetches an unmasked donor phone/WhatsApp ONLY when authorized by Firestore Zero-Trust rules:
 * 1. Consent-gated `/donorDirectContacts/{donorUid}` (`allow list: if false`; single `get` allowed
 *    when `shareDirectContact == true`, `availabilityStatus != 'DND'`, and visibility allows caller).
 * 2. Approved `/contactRequests/{seekerUid__donorUid}` when a private donor approved this seeker.
 * 3. `/users/{donorUid}` strictly when caller is the donor owner or a verified Admin.
 * Never throws on privacy denial—returns `null` cleanly so UI shows private fallback options.
 */
export async function fetchUnmaskedDonorContactIfAuthorized(
  donorUid: string
): Promise<UnmaskedDonorContactPayload | null> {
  if (!donorUid || !/^[a-zA-Z0-9_-]{1,128}$/.test(donorUid)) return null;
  await waitForHealthyAuthBoot();

  // Path 1: Consent-gated /donorDirectContacts/{donorUid} (works for public or verified seekers per donor's choice)
  try {
    const directSnap = await getDoc(doc(db, 'donorDirectContacts', donorUid));
    if (directSnap.exists()) {
      const d = directSnap.data();
      if (d.shareDirectContact === true && d.availabilityStatus !== 'DND' && d.phone) {
        return {
          phone: String(d.phone),
          whatsappPhone: d.whatsappPhone ? String(d.whatsappPhone) : String(d.phone),
          allowCall: d.allowCall !== false,
          allowWhatsApp: d.allowWhatsApp !== false,
          allowSms: d.allowSms !== false,
          contactVisibility: d.contactVisibility as ContactVisibility | undefined,
          source: 'CONSENT_DIRECT',
        };
      }
    }
  } catch {
    // Expected PERMISSION_DENIED when donor opted into REQUEST_ONLY, DND, or VERIFIED_SEEKERS while signed out
  }

  const current = await ensureValidAuthSession();
  if (!current) return null;

  // Path 2: Approved 1-to-1 /contactRequests/{seekerUid__donorUid}
  if (current.uid !== donorUid) {
    try {
      const crSnap = await getDoc(doc(db, 'contactRequests', `${current.uid}__${donorUid}`));
      if (crSnap.exists()) {
        const cr = crSnap.data();
        if (cr.status === 'APPROVED' && cr.approvedPhone) {
          return {
            phone: String(cr.approvedPhone),
            whatsappPhone: cr.approvedWhatsApp ? String(cr.approvedWhatsApp) : String(cr.approvedPhone),
            allowCall: true,
            allowWhatsApp: true,
            allowSms: true,
            source: 'APPROVED_REQUEST',
          };
        }
      }
    } catch {}
  }

  // Path 3: Owner or Verified Admin reading /users/{donorUid}
  try {
    const isAdmin = await checkIsVerifiedAdminInFirestore(current);
    if (current.uid !== donorUid && !isAdmin) return null;
    const snap = await getDoc(doc(db, 'users', donorUid));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      phone: d.phone,
      whatsappPhone: d.whatsappPhone,
      facebookUrl: d.facebookUrl,
      allowCall: d.allowCall !== false,
      allowWhatsApp: d.allowWhatsApp !== false,
      allowSms: d.allowSms !== false,
      contactVisibility: d.contactVisibility as ContactVisibility | undefined,
      source: 'OWNER_OR_ADMIN',
    };
  } catch {
    return null;
  }
}

export async function registerSmartAccountInFirestore(params: {
  firebaseUser: User;
  account: UserAccount;
  donor: Donor;
  adminProofHash?: string;
}): Promise<void> {
  const { firebaseUser, account, donor, adminProofHash } = params;
  const validUser = await validateOrClearBrokenAuthToken(firebaseUser);
  if (!validUser) {
    throw new Error('AUTH_TOKEN_EXPIRED_PLEASE_SIGN_IN');
  }
  const uid = validUser.uid;
  const safeAvatar = await compressAvatarIfNeeded(account.photoUrl || donor.avatar || '');
  const isVerifiedAdmin = await checkIsVerifiedAdminInFirestore(validUser);
  const isAdminPanel = account.role === 'ADMIN' || isVerifiedAdmin;

  const normalizedPhone = normalizeAsciiDigits(account.phone || validUser.phoneNumber || '').trim();
  const normalizedWa = normalizeAsciiDigits(account.whatsappPhone || normalizedPhone).trim();

  const rawIdCard = String(account.idCardNumber || '').replace(/[^a-zA-Z0-9+-]/g, '-');
  const safeIdCard = clampStr(
    rawIdCard,
    5,
    40,
    `BS-${uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || '1001'}`
  );
  const cleanName = clampStr(account.name, 2, 80, 'Blood Donor');
  const cleanUpazila = clampStr(account.upazila || donor.upazila, 2, 50, 'Dhaka');

  const batch = writeBatch(db);

  const ownerAutoHash = isBootstrappedAdminUser(validUser)
    ? sha256HexSync(`BSBD_SUPER_OWNER:${uid}`)
    : '';
  const effectiveAdminProofHash = adminProofHash || ownerAutoHash;

  // 1. If registering an Admin Panel ID with a verified server invite proof or Super Owner JWT, write /admins/{uid}
  if (isAdminPanel && effectiveAdminProofHash) {
    const adminRef = doc(db, 'admins', uid);
    const existingAdminSnap = await getDoc(adminRef);
    if (!existingAdminSnap.exists()) {
      batch.set(adminRef, {
        uid,
        name: cleanName,
        idCardNumber: safeIdCard,
        district: clampStr(account.district, 2, 40, 'dhaka'),
        secretProofHash: effectiveAdminProofHash,
        registryKey: 'BSBD_ADMIN',
        createdAt: serverTimestamp(),
      });
    }
  }

  // 2. Write isolated PII profile to /users/{uid}
  const userRef = doc(db, 'users', uid);
  const existingUserSnap = await getDoc(userRef);

  const resolvedStatus: DonorAvailabilityStatus =
    account.availabilityStatus ||
    donor.availabilityStatus ||
    (account.availableToDonate ? 'AVAILABLE' : 'TEMPORARILY_UNAVAILABLE');
  const resolvedAvailable = resolvedStatus === 'AVAILABLE';
  const resolvedVisibility: ContactVisibility =
    account.contactVisibility ||
    donor.contactVisibility ||
    (account.shareDirectContact === false ? 'REQUEST_ONLY' : 'PUBLIC_OPT_IN');
  const resolvedShareDirect =
    typeof account.shareDirectContact === 'boolean'
      ? account.shareDirectContact && resolvedVisibility !== 'REQUEST_ONLY'
      : resolvedVisibility !== 'REQUEST_ONLY';
  const resolvedAllowCall = account.allowCall !== false;
  const resolvedAllowWhatsApp = account.allowWhatsApp !== false;
  const resolvedAllowSms = account.allowSms !== false;
  const resolvedEmergencyOptIn = account.emergencyAlertsOptIn !== false;
  const resolvedAlertsPaused = account.alertsPaused === true;

  const userPayloadBase = {
    uid,
    name: cleanName,
    email: clampStr(
      validUser.email || account.email,
      3,
      120,
      `${uid.slice(0, 10)}@bloodsearch.bd`
    ),
    phone: clampStr(normalizedPhone, 6, 24, '01700000000'),
    whatsappPhone: clampStr(normalizedWa, 6, 24, '01700000000'),
    facebookUrl: clampStr(account.facebookUrl, 8, 200, 'https://facebook.com/bloodsearch.bd'),
    bloodGroup: account.bloodGroup,
    division: clampStr(account.division, 2, 40, 'dhaka'),
    district: clampStr(account.district, 2, 40, 'dhaka'),
    upazila: cleanUpazila,
    idCardNumber: safeIdCard,
    panelType: isAdminPanel ? 'ADMIN' : 'USER',
    photoUrl: safeAvatar,
    age: clampNum(account.age, 18, 65, 24),
    gender: account.gender || 'MALE',
    weightKg: clampNum(account.weightKg, 40, 180, 62),
    availableToDonate: resolvedAvailable,
    availabilityStatus: resolvedStatus,
    availabilityConfirmedAt: serverTimestamp(),
    shareDirectContact: resolvedShareDirect,
    contactVisibility: resolvedVisibility,
    allowCall: resolvedAllowCall,
    allowWhatsApp: resolvedAllowWhatsApp,
    allowSms: resolvedAllowSms,
    emergencyAlertsOptIn: resolvedEmergencyOptIn,
    alertsPaused: resolvedAlertsPaused,
    totalDonations: clampNum(account.totalDonations, 0, 500, 0),
    updatedAt: serverTimestamp(),
  };

  if (existingUserSnap.exists()) {
    const prev = existingUserSnap.data();
    const preservedPanelType =
      prev.panelType === 'ADMIN' || isAdminPanel ? 'ADMIN' : 'USER';
    const prevIdClean =
      typeof prev.idCardNumber === 'string' && /^[a-zA-Z0-9+-]{5,40}$/.test(prev.idCardNumber)
        ? prev.idCardNumber
        : safeIdCard;
    const safePrevEmail =
      typeof prev.email === 'string' && prev.email.trim().length >= 3 && prev.email.length <= 120
        ? prev.email
        : userPayloadBase.email;
    batch.set(userRef, {
      ...userPayloadBase,
      panelType: preservedPanelType,
      idCardNumber: account.role === 'ADMIN' ? safeIdCard : prevIdClean,
      email: safePrevEmail,
      createdAt: prev.createdAt instanceof Timestamp ? prev.createdAt : serverTimestamp(),
    });
  } else {
    batch.set(userRef, {
      ...userPayloadBase,
      createdAt: serverTimestamp(),
    });
  }

  // 3. Write non-PII public donor directory card to /donors/{uid}
  const donorRef = doc(db, 'donors', uid);
  const existingDonorSnap = await getDoc(donorRef);
  const alreadyAdmin =
    isVerifiedAdmin ||
    isBootstrappedAdminUser(validUser) ||
    Boolean(account.role === 'ADMIN' && adminProofHash);

  const donorPayloadBase = {
    ownerUid: uid,
    name: clampStr(donor.name || cleanName, 2, 80, 'Blood Donor'),
    bloodGroup: donor.bloodGroup || account.bloodGroup,
    division: clampStr(donor.division || account.division, 2, 40, 'dhaka'),
    district: clampStr(donor.district || account.district, 2, 40, 'dhaka'),
    upazila: cleanUpazila,
    maskedPhone: maskPhoneNumber(normalizedPhone || donor.phone),
    available: resolvedAvailable,
    availabilityStatus: resolvedStatus,
    availabilityConfirmedAt: serverTimestamp(),
    shareDirectContact: resolvedShareDirect,
    contactVisibility: resolvedVisibility,
    allowCall: resolvedAllowCall,
    allowWhatsApp: resolvedAllowWhatsApp,
    allowSms: resolvedAllowSms,
    emergencyAlertsOptIn: resolvedEmergencyOptIn,
    alertsPaused: resolvedAlertsPaused,
    lastDonatedDate: (donor.lastDonatedDate || '').slice(0, 20),
    totalDonations: clampNum(donor.totalDonations, 0, 500, 0),
    verifiedBadge: alreadyAdmin ? true : false,
    age: clampNum(donor.age, 18, 65, 24),
    gender: donor.gender || 'MALE',
    weightKg: clampNum(donor.weightKg, 40, 180, 62),
    hospitalAffiliation: clampStr(
      donor.hospitalAffiliation,
      2,
      100,
      alreadyAdmin ? 'জেলা রক্ত সমন্বয়ক ও অ্যাডমিন' : 'Voluntary Donor'
    ),
    avatar: safeAvatar,
    idCardNumber: safeIdCard,
    panelType: alreadyAdmin ? 'ADMIN' : 'USER',
    isPublic: true,
    updatedAt: serverTimestamp(),
  };

  if (existingDonorSnap.exists()) {
    const prevD = existingDonorSnap.data();
    const prevDonorIdClean =
      typeof prevD.idCardNumber === 'string' && /^[a-zA-Z0-9+-]{5,40}$/.test(prevD.idCardNumber)
        ? prevD.idCardNumber
        : donorPayloadBase.idCardNumber;
    const prevDonorPanelType =
      prevD.panelType === 'ADMIN' || prevD.panelType === 'USER' ? prevD.panelType : 'USER';
    batch.set(donorRef, {
      ...donorPayloadBase,
      ownerUid: typeof prevD.ownerUid === 'string' && prevD.ownerUid ? prevD.ownerUid : uid,
      verifiedBadge: alreadyAdmin ? true : Boolean(prevD.verifiedBadge),
      panelType: alreadyAdmin ? 'ADMIN' : prevDonorPanelType,
      idCardNumber:
        alreadyAdmin && account.role === 'ADMIN'
          ? donorPayloadBase.idCardNumber
          : prevDonorIdClean,
      createdAt: prevD.createdAt instanceof Timestamp ? prevD.createdAt : serverTimestamp(),
    });
  } else {
    batch.set(donorRef, {
      ...donorPayloadBase,
      createdAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }

  await updateProfile(validUser, { displayName: cleanName }).catch(() => {});

  // 4. Sync consent-isolated /donorDirectContacts/{uid} AFTER /users/{uid} exists
  try {
    const directRef = doc(db, 'donorDirectContacts', uid);
    const existingDirectSnap = await getDoc(directRef);
    const hasValidRealPhone =
      normalizedPhone.length >= 10 && normalizedPhone !== '01700000000';

    if (resolvedShareDirect && hasValidRealPhone) {
      const prevDirectCreatedAt =
        existingDirectSnap.exists() && existingDirectSnap.data().createdAt instanceof Timestamp
          ? existingDirectSnap.data().createdAt
          : serverTimestamp();
      const directPayload = {
        ownerUid: uid,
        phone: clampStr(normalizedPhone, 6, 24, '01700000000'),
        whatsappPhone: clampStr(normalizedWa, 6, 24, normalizedPhone).slice(0, 24),
        shareDirectContact: true,
        contactVisibility: resolvedVisibility,
        availabilityStatus: resolvedStatus,
        allowCall: resolvedAllowCall,
        allowWhatsApp: resolvedAllowWhatsApp,
        allowSms: resolvedAllowSms,
        createdAt: prevDirectCreatedAt,
        updatedAt: serverTimestamp(),
      };
      await setDoc(directRef, directPayload);
    } else if (existingDirectSnap.exists()) {
      await deleteDoc(directRef);
    }
  } catch (err) {
    console.warn('Direct contact vault sync warning:', err);
  }
}

export function subscribePublicDonors(onData: (donors: Donor[]) => void): () => void {
  return attachSnapshotAfterBoot(() => {
    const path = 'donors';
    const q = query(collection(db, path), where('isPublic', '==', true));
    return onSnapshot(
      q,
      (snapshot) => {
        const mapped = snapshot.docs
          .filter((d) => {
            const data = d.data();
            return !isFakeIdentifier(d.id) && !isFakePersonName(String(data.name || ''));
          })
          .map((d) => {
            const data = d.data();
            const updatedAtMs =
              data.updatedAt instanceof Timestamp
                ? data.updatedAt.toMillis()
                : data.createdAt instanceof Timestamp
                  ? data.createdAt.toMillis()
                  : 0;
            const confirmedAtMs =
              data.availabilityConfirmedAt instanceof Timestamp
                ? data.availabilityConfirmedAt.toMillis()
                : undefined;
            const availabilityStatus: DonorAvailabilityStatus =
              (data.availabilityStatus as DonorAvailabilityStatus | undefined) ||
              (data.available ? 'AVAILABLE' : 'TEMPORARILY_UNAVAILABLE');
            const normalizedDist =
              data.district === 'ঢাকা' ? 'dhaka' : String(data.district || 'dhaka');
            const normalizedUpz =
              data.upazila === 'সদর' ? 'dhanmondi' : String(data.upazila || 'dhanmondi');
            const donor: Donor = {
              id: d.id,
              name: data.name,
              bloodGroup: data.bloodGroup as BloodGroup,
              division: data.division || 'dhaka',
              district: normalizedDist,
              upazila: normalizedUpz,
              phone: data.maskedPhone || '017****00',
              available: Boolean(data.available) && availabilityStatus === 'AVAILABLE',
              availabilityStatus,
              availabilityConfirmedAtMs: confirmedAtMs,
              updatedAtMs: updatedAtMs || undefined,
              shareDirectContact:
                typeof data.shareDirectContact === 'boolean' ? data.shareDirectContact : false,
              contactVisibility:
                (data.contactVisibility as ContactVisibility | undefined) || 'REQUEST_ONLY',
              allowCall: data.allowCall !== false,
              allowWhatsApp: data.allowWhatsApp !== false,
              allowSms: data.allowSms !== false,
              emergencyAlertsOptIn: data.emergencyAlertsOptIn !== false,
              alertsPaused: data.alertsPaused === true,
              isCloudRecord: true,
              lastDonatedDate: data.lastDonatedDate || '',
              totalDonations: Number(data.totalDonations) || 0,
              verifiedBadge: Boolean(data.verifiedBadge),
              rating: 5.0,
              reviewsCount: 0,
              age: Number(data.age) || 24,
              gender: data.gender || 'MALE',
              weightKg: Number(data.weightKg) || 60,
              hospitalAffiliation: data.hospitalAffiliation || 'স্বেচ্ছাসেবী রক্তদাতা',
              avatar: data.avatar || DEFAULT_AVATAR_DATA_URI,
              reliabilityScore: data.verifiedBadge ? 99 : 92,
            };
            return { donor, sortMs: confirmedAtMs || updatedAtMs };
          });
        mapped.sort((a, b) => b.sortMs - a.sortMs);
        onData(mapped.map((m) => m.donor));
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  });
}

const requestDirectContactCache = new Map<
  string,
  { contactName: string; contactPhone: string } | null
>();
const inFlightRequestContactIds = new Set<string>();

export async function fetchRequestDirectContact(
  requestId: string
): Promise<{ contactName: string; contactPhone: string } | null> {
  if (!requestId || !/^[a-zA-Z0-9_-]{1,80}$/.test(requestId)) return null;
  if (requestDirectContactCache.has(requestId)) {
    return requestDirectContactCache.get(requestId) ?? null;
  }
  await waitForHealthyAuthBoot();
  try {
    const snap = await getDoc(doc(db, 'requestDirectContacts', requestId));
    if (snap.exists()) {
      const d = snap.data();
      const validPhone = normalizeValidBangladeshMobileE164(String(d.contactPhone || ''));
      if (validPhone && d.shareDirectContact !== false && d.status === 'ACTIVE') {
        const result = {
          contactName: String(d.contactName || ''),
          contactPhone: validPhone,
        };
        requestDirectContactCache.set(requestId, result);
        return result;
      }
    }
    requestDirectContactCache.set(requestId, null);
    return null;
  } catch {
    requestDirectContactCache.set(requestId, null);
    return null;
  }
}

export function subscribePublicRequests(onData: (requests: BloodRequest[]) => void): () => void {
  return attachSnapshotAfterBoot(() => {
    const path = 'requests';
    const qReq = query(collection(db, path), where('isPublic', '==', true));
    const qResp = query(collection(db, 'requestResponses'), where('isPublic', '==', true));

    let latestRawDocs: { req: BloodRequest; sortMs: number }[] = [];
    let responsesByReq = new Map<string, Responder[]>();
    let disposed = false;

    const emitMerged = () => {
      if (disposed) return;
      const seenActiveSig = new Set<string>();
      const finalItems: BloodRequest[] = [];

      for (const item of latestRawDocs) {
        const r = item.req;
        if (r.status === 'ACTIVE') {
          const sig = `${r.patientName.trim().toLowerCase()}|${r.hospitalName.trim().toLowerCase()}|${r.bloodGroup}`;
          if (seenActiveSig.has(sig)) {
            continue;
          }
          seenActiveSig.add(sig);
        }

        const cachedContact = requestDirectContactCache.get(r.id);
        const cloudResponders = responsesByReq.get(r.id) || [];
        const effectiveRespondedCount = Math.max(
          r.respondedCount || 0,
          cloudResponders.length
        );

        const enriched: BloodRequest = {
          ...r,
          contactName: cachedContact?.contactName || r.contactName,
          contactPhone: cachedContact?.contactPhone || r.contactPhone,
          responders: cloudResponders,
          respondedCount: effectiveRespondedCount,
        };
        enriched.lifecycleState = deriveRequestLifecycleState(enriched);
        finalItems.push(enriched);
      }

      onData(finalItems);
    };

    const unsubReq = onSnapshot(
      qReq,
      (snapshot) => {
        const mapped = snapshot.docs
          .filter((d) => {
            const data = d.data();
            return !isFakeIdentifier(d.id) && !isFakePersonName(String(data.patientName || ''));
          })
          .map((d) => {
            const data = d.data();
            const createdAtMs =
              data.createdAt instanceof Timestamp
                ? data.createdAt.toMillis()
                : data.updatedAt instanceof Timestamp
                  ? data.updatedAt.toMillis()
                  : 0;
            const status = (data.status as BloodRequest['status']) || 'ACTIVE';
            const notifiedCount = Number(data.notifiedCount) || 0;
            const viewedCount = Number(data.viewedCount) || 0;
            const respondedCount = Number(data.respondedCount) || 0;
            const contactAttemptsCount = Number(data.contactAttemptsCount) || 0;
            const expiresAtMs =
              typeof data.expiresAtMs === 'number' ? data.expiresAtMs : undefined;

            const baseReq: BloodRequest = {
              id: d.id,
              authorUid: typeof data.authorUid === 'string' ? data.authorUid : undefined,
              patientName: data.patientName,
              patientAge: Number(data.patientAge) || 25,
              bloodGroup: data.bloodGroup as BloodGroup,
              unitsNeeded: Number(data.unitsNeeded) || 1,
              unitsCollected: Number(data.unitsCollected) || 0,
              hospitalName: data.hospitalName,
              division: data.division,
              district: data.district,
              upazila: data.upazila,
              urgency: data.urgency || 'CRITICAL',
              requiredTimeWindow:
                (data.requiredTimeWindow as RequiredTimeWindow | undefined) || 'IMMEDIATE_2H',
              contactName: data.patientName,
              contactPhone: 'হাসপাতাল জরুরি কাউন্টার',
              requiredDate: data.requiredDate || 'জরুরি',
              reason: data.reason || 'জরুরি রক্ত সঞ্চালন',
              responders: [],
              createdAt:
                data.createdAt instanceof Timestamp
                  ? data.createdAt.toDate().toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'সাম্প্রতিক আবেদন',
              createdAtMs: createdAtMs || undefined,
              expiresAtMs,
              status,
              lifecycleState: data.lifecycleState as RequestLifecycleState | undefined,
              notifiedCount,
              viewedCount,
              respondedCount,
              contactAttemptsCount,
              confirmedDonorId:
                typeof data.confirmedDonorId === 'string' && data.confirmedDonorId
                  ? data.confirmedDonorId
                  : undefined,
              confirmedDonorName:
                typeof data.confirmedDonorName === 'string' && data.confirmedDonorName
                  ? data.confirmedDonorName
                  : undefined,
              escalationLevel: Number(data.escalationLevel) || 0,
              searchRadiusKm: Number(data.searchRadiusKm) || 10,
              escalationIntervalMinutes: Number(data.escalationIntervalMinutes) || 10,
              exchangeAllowed: Boolean(data.exchangeAllowed),
            };
            baseReq.lifecycleState = deriveRequestLifecycleState(baseReq);
            return { req: baseReq, sortMs: createdAtMs };
          });

        mapped.sort((a, b) => b.sortMs - a.sortMs);
        latestRawDocs = mapped;
        emitMerged();

        // Resolve opted-in hospital callback phones for active requests via single-doc get
        for (const item of mapped) {
          const rid = item.req.id;
          if (
            item.req.status === 'ACTIVE' &&
            !requestDirectContactCache.has(rid) &&
            !inFlightRequestContactIds.has(rid)
          ) {
            inFlightRequestContactIds.add(rid);
            fetchRequestDirectContact(rid)
              .then((res) => {
                if (res && !disposed) {
                  emitMerged();
                }
              })
              .finally(() => {
                inFlightRequestContactIds.delete(rid);
              });
          } else if (item.req.status !== 'ACTIVE') {
            requestDirectContactCache.set(rid, null);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );

    const unsubResp = onSnapshot(
      qResp,
      (snap) => {
        const nextMap = new Map<string, Responder[]>();
        const sortedDocs = [...snap.docs].sort((a, b) => {
          const ta = a.data().createdAt instanceof Timestamp ? a.data().createdAt.toMillis() : 0;
          const tb = b.data().createdAt instanceof Timestamp ? b.data().createdAt.toMillis() : 0;
          return ta - tb;
        });

        for (const docSnap of sortedDocs) {
          const d = docSnap.data();
          const reqId = String(d.requestId || '');
          if (!reqId) continue;
          const tsLabel =
            d.createdAt instanceof Timestamp
              ? d.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'ভেরিফাইড সাড়া';
          const list = nextMap.get(reqId) || [];
          list.push({
            id: docSnap.id,
            responderUid: String(d.responderUid || ''),
            name: String(d.responderName || 'রক্তদাতা'),
            phone: '',
            bloodGroup: (d.bloodGroup as BloodGroup) || 'O+',
            timestamp: tsLabel,
            notes: d.note ? String(d.note) : undefined,
          });
          nextMap.set(reqId, list);
        }
        responsesByReq = nextMap;
        emitMerged();
      },
      (err) => {
        console.warn('Public requestResponses listener warning:', err);
      }
    );

    return () => {
      disposed = true;
      unsubReq();
      unsubResp();
    };
  });
}

export async function createBloodRequestInFirestore(newReq: BloodRequest): Promise<string | null> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return null;
  await ensureUserAutoSyncedInFirestore(user).catch(() => null);

  const safeId = newReq.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || `req_${Date.now()}`;
  const path = `requests/${safeId}`;
  try {
    await setDoc(doc(db, 'requests', safeId), {
      authorUid: user.uid,
      patientName: clampStr(newReq.patientName, 2, 80, 'জরুরি রোগী'),
      patientAge: clampNum(newReq.patientAge, 0, 120, 30),
      bloodGroup: newReq.bloodGroup,
      unitsNeeded: clampNum(newReq.unitsNeeded, 1, 20, 1),
      unitsCollected: clampNum(newReq.unitsCollected, 0, 20, 0),
      hospitalName: clampStr(newReq.hospitalName, 2, 120, 'ঢাকা মেডিকেল কলেজ হাসপাতাল'),
      division: clampStr(newReq.division, 2, 40, 'dhaka'),
      district: clampStr(newReq.district, 2, 40, 'dhaka'),
      upazila: clampStr(newReq.upazila, 2, 50, 'sadar'),
      urgency: newReq.urgency || 'CRITICAL',
      requiredTimeWindow: newReq.requiredTimeWindow || 'IMMEDIATE_2H',
      requiredDate: clampStr(newReq.requiredDate, 2, 30, 'আজ জরুরি'),
      reason: clampStr(newReq.reason, 2, 300, 'জরুরি রক্তের প্রয়োজন'),
      status: 'ACTIVE',
      lifecycleState: newReq.lifecycleState || 'SEARCHING',
      notifiedCount: clampNum(newReq.notifiedCount ?? 0, 0, 5000, 0),
      viewedCount: clampNum(newReq.viewedCount ?? 0, 0, 5000, 0),
      respondedCount: clampNum(newReq.respondedCount ?? 0, 0, 5000, 0),
      contactAttemptsCount: clampNum(newReq.contactAttemptsCount ?? 0, 0, 5000, 0),
      confirmedDonorId: clampStr(newReq.confirmedDonorId || '', 0, 128, ''),
      confirmedDonorName: clampStr(newReq.confirmedDonorName || '', 0, 80, ''),
      escalationLevel: clampNum(newReq.escalationLevel ?? 0, 0, 10, 0),
      searchRadiusKm: clampNum(newReq.searchRadiusKm ?? 10, 1, 1000, 10),
      escalationIntervalMinutes: clampNum(newReq.escalationIntervalMinutes ?? 10, 1, 180, 10),
      expiresAtMs:
        typeof newReq.expiresAtMs === 'number' && newReq.expiresAtMs > 0
          ? newReq.expiresAtMs
          : Date.now() + 24 * 60 * 60 * 1000,
      exchangeAllowed: Boolean(newReq.exchangeAllowed),
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Persist consent-isolated hospital attendant callback phone in /requestDirectContacts/{safeId}
    const validCallbackE164 = normalizeValidBangladeshMobileE164(newReq.contactPhone);
    const shouldShareDirect = newReq.seekerSharePhone !== false && Boolean(validCallbackE164);
    if (validCallbackE164 && shouldShareDirect) {
      const cleanAttendantName = clampStr(
        newReq.contactName || newReq.patientName,
        2,
        80,
        'রোগীর স্বজন'
      );
      try {
        await setDoc(doc(db, 'requestDirectContacts', safeId), {
          requestId: safeId,
          authorUid: user.uid,
          contactName: cleanAttendantName,
          contactPhone: validCallbackE164,
          shareDirectContact: true,
          status: 'ACTIVE',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        requestDirectContactCache.set(safeId, {
          contactName: cleanAttendantName,
          contactPhone: validCallbackE164,
        });
      } catch (contactErr) {
        console.warn('Could not persist requestDirectContact:', contactErr);
      }
    }

    return safeId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function submitVolunteerResponseInFirestore(params: {
  requestId: string;
  responderName: string;
  responderPhone: string;
  bloodGroup: BloodGroup;
  note?: string;
}): Promise<{
  ok: boolean;
  alreadyResponded?: boolean;
  seekerContactName?: string;
  seekerContactPhone?: string;
  authorUid?: string;
  reason?:
    | 'AUTH_REQUIRED'
    | 'SELF_PLEDGE'
    | 'ALREADY_RESPONDED'
    | 'ALREADY_FULFILLED'
    | 'LOCAL_ONLY_REQUEST';
}> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) {
    return { ok: false, reason: 'AUTH_REQUIRED' };
  }
  await ensureUserAutoSyncedInFirestore(user).catch(() => null);

  const safeId = params.requestId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const reqRef = doc(db, 'requests', safeId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) {
    return { ok: false, reason: 'LOCAL_ONLY_REQUEST' };
  }

  const prev = reqSnap.data();
  const authorUid = String(prev.authorUid || '');
  if (authorUid === user.uid) {
    return { ok: false, reason: 'SELF_PLEDGE' };
  }
  if (prev.status !== 'ACTIVE') {
    return { ok: false, reason: 'ALREADY_FULFILLED' };
  }

  // Mutual contact visibility: fetch the Finder/Requester's direct phone so the willing donor also receives it immediately
  const directContact = await fetchRequestDirectContact(safeId).catch(() => null);
  const seekerContactName = directContact?.contactName || String(prev.patientName || 'Patient Family');
  const seekerContactPhone = directContact?.contactPhone || '';

  const cleanName = clampStr(
    params.responderName.trim() || user.displayName || 'Voluntary Donor',
    2,
    80,
    'Voluntary Donor'
  );
  const cleanNote = sanitizeSafeText(params.note || '').slice(0, 200);
  const validPhone = normalizeValidBangladeshMobileE164(params.responderPhone);

  // Upsert /requestAlerts/{safeId}__{user.uid} BEFORE updating /requests/{safeId} so Finder immediately sees Responder's callback phone & WhatsApp!
  if (authorUid && authorUid !== user.uid && validPhone) {
    try {
      const alertId = `${safeId}__${user.uid}`;
      const alertRef = doc(db, 'requestAlerts', alertId);
      const existingAlertSnap = await getDoc(alertRef);
      if (existingAlertSnap.exists()) {
        const prevAlert = existingAlertSnap.data();
        if (prevAlert.deliveryState !== 'STOPPED_RESOLVED') {
          await setDoc(alertRef, {
            ...prevAlert,
            deliveryState: 'RESPONDED_ACCEPT',
            responseNote: cleanNote,
            responderPhone: validPhone.slice(0, 24),
            responderName: cleanName,
            updatedAt: serverTimestamp(),
          });
        }
      } else {
        await setDoc(alertRef, {
          requestId: safeId,
          authorUid,
          donorUid: user.uid,
          bloodGroup: (prev.bloodGroup as BloodGroup) || params.bloodGroup,
          hospitalName: clampStr(String(prev.hospitalName || 'Hospital'), 2, 120, 'Hospital'),
          district: clampStr(String(prev.district || 'dhaka'), 2, 40, 'dhaka'),
          urgency:
            prev.urgency === 'CRITICAL' || prev.urgency === 'URGENT' || prev.urgency === 'STANDARD'
              ? prev.urgency
              : 'CRITICAL',
          seekerCallbackPhone: seekerContactPhone ? seekerContactPhone.slice(0, 24) : '',
          escalationLevel: clampNum(Number(prev.escalationLevel) || 0, 0, 10, 0),
          deliveryState: 'RESPONDED_ACCEPT',
          responseNote: cleanNote,
          responderPhone: validPhone.slice(0, 24),
          responderName: cleanName,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (alertErr) {
      console.warn('Could not sync responder alert callback:', alertErr);
    }
  }

  const responseId = `${safeId}__${user.uid}`;
  const respRef = doc(db, 'requestResponses', responseId);
  const existingResp = await getDoc(respRef);
  if (existingResp.exists()) {
    return {
      ok: true,
      alreadyResponded: true,
      seekerContactName,
      seekerContactPhone,
      authorUid,
    };
  }

  try {
    await setDoc(respRef, {
      requestId: safeId,
      authorUid,
      responderUid: user.uid,
      responderName: cleanName,
      bloodGroup: params.bloodGroup,
      note: cleanNote,
      isPublic: true,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `requestResponses/${responseId}`);
  }

  const nextCollected = Math.min(Number(prev.unitsNeeded) || 1, (Number(prev.unitsCollected) || 0) + 1);
  const nextStatus = nextCollected >= prev.unitsNeeded ? 'FULFILLED' : 'ACTIVE';
  const nextResponded = clampNum((Number(prev.respondedCount) || 0) + 1, 1, 5000, 1);
  const nextLifecycle: RequestLifecycleState =
    nextStatus === 'FULFILLED' ? 'FULFILLED' : 'RESPONSES_RECEIVED';

  try {
    await setDoc(reqRef, {
      ...prev,
      unitsCollected: nextCollected,
      respondedCount: nextResponded,
      lifecycleState: nextLifecycle,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `requests/${safeId}`);
  }

  // Privately deliver volunteer's verified callback phone to the patient's family via 1-to-1 Inbox
  if (authorUid && authorUid !== user.uid && validPhone) {
    const privateMsg = `আসসালামু আলাইকুম, আমি ${cleanName} (${params.bloodGroup})। "${prev.patientName}"-এর জরুরি রক্তের আবেদনে (${prev.hospitalName}) রক্ত দিতে প্রস্তুত। আমার সরাসরি মোবাইল নম্বর: ${validPhone}${cleanNote ? ` · নোট: ${cleanNote}` : ''}`;
    sendDirectMessageInFirestore({
      myName: cleanName,
      myGroup: params.bloodGroup,
      myWhatsapp: validPhone,
      peerUid: authorUid,
      peerName: String(prev.patientName || 'রোগীর স্বজন'),
      peerGroup: (prev.bloodGroup as BloodGroup) || params.bloodGroup,
      text: privateMsg,
    }).catch(() => {});
  }

  return {
    ok: true,
    seekerContactName,
    seekerContactPhone,
    authorUid,
  };
}

export async function pledgeBloodRequestUnitInFirestore(reqId: string): Promise<boolean> {
  const res = await submitVolunteerResponseInFirestore({
    requestId: reqId,
    responderName: auth.currentUser?.displayName || 'রক্তদাতা',
    responderPhone: auth.currentUser?.phoneNumber || '',
    bloodGroup: 'O+',
    note: '',
  });
  return res.ok;
}

export async function adminToggleDonorVerifiedInFirestore(donorId: string): Promise<boolean> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return false;
  const path = `donors/${donorId}`;
  try {
    const ref = doc(db, 'donors', donorId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const prev = snap.data();
    await setDoc(ref, {
      ...prev,
      verifiedBadge: !prev.verifiedBadge,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminDeleteDonorInFirestore(donorId: string): Promise<boolean> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return false;
  const path = `donors/${donorId}`;
  try {
    const ref = doc(db, 'donors', donorId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    await deleteDoc(ref);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function adminMarkRequestFulfilledInFirestore(reqId: string): Promise<boolean> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return false;
  const path = `requests/${reqId}`;
  try {
    const ref = doc(db, 'requests', reqId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const prev = snap.data();
    await setDoc(ref, {
      ...prev,
      unitsCollected: prev.unitsNeeded,
      status: 'FULFILLED',
      updatedAt: serverTimestamp(),
    });
    try {
      const dcRef = doc(db, 'requestDirectContacts', reqId);
      const dcSnap = await getDoc(dcRef);
      if (dcSnap.exists()) {
        await setDoc(dcRef, {
          ...dcSnap.data(),
          status: 'FULFILLED',
          updatedAt: serverTimestamp(),
        });
      }
      requestDirectContactCache.set(reqId, null);
    } catch {}
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminDeleteRequestInFirestore(reqId: string): Promise<boolean> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return false;
  const path = `requests/${reqId}`;
  try {
    const ref = doc(db, 'requests', reqId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    await deleteDoc(ref);
    try {
      const dcRef = doc(db, 'requestDirectContacts', reqId);
      const dcSnap = await getDoc(dcRef);
      if (dcSnap.exists()) {
        await deleteDoc(dcRef);
      }
      requestDirectContactCache.delete(reqId);
    } catch {}
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function groupToDocId(grp: BloodGroup): string {
  return grp.replace('+', '_POS').replace('-', '_NEG');
}

export function subscribeBloodStock(
  onData: (stockMap: Partial<Record<BloodGroup, number>>) => void
): () => void {
  return attachSnapshotAfterBoot(() => {
    const path = 'bloodStock';
    const q = query(collection(db, path), where('unitsInStock', '>=', 0));
    return onSnapshot(
      q,
      (snapshot) => {
        const updates: Partial<Record<BloodGroup, number>> = {};
        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (data.bloodGroup) {
            updates[data.bloodGroup as BloodGroup] = Number(data.unitsInStock) || 0;
          }
        });
        onData(updates);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  });
}

export async function adminUpdateBloodStockInFirestore(
  group: BloodGroup,
  newUnits: number
): Promise<boolean> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return false;
  const docId = groupToDocId(group);
  const path = `bloodStock/${docId}`;
  try {
    await setDoc(doc(db, 'bloodStock', docId), {
      bloodGroup: group,
      unitsInStock: clampNum(newUnits, 0, 10000, 0),
      updatedByUid: user.uid,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface AdminInviteLockItem {
  proofHash: string;
  label: string;
  ownerUid: string;
  active: boolean;
  createdAtLabel: string;
}

export interface RegisteredAdminItem {
  uid: string;
  name: string;
  idCardNumber: string;
  district: string;
  createdAtLabel: string;
}

export async function grantAdminAccessWithInviteCode(rawCode: string): Promise<boolean> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return false;

  if (isBootstrappedAdminUser(user)) {
    return true;
  }

  const verified = await verifyAdminInviteCodeInCloud(rawCode, user);
  if (!verified.valid || !verified.proofHash) {
    return false;
  }

  const adminPath = `admins/${user.uid}`;
  try {
    const ref = doc(db, 'admins', user.uid);
    const existingSnap = await getDoc(ref);
    if (!existingSnap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        name: clampStr(user.displayName || user.email?.split('@')[0], 2, 80, 'Verified Admin'),
        idCardNumber: `ADMIN-BD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        district: 'dhaka',
        secretProofHash: verified.proofHash,
        registryKey: 'BSBD_ADMIN',
        createdAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, adminPath);
  }
}

export function subscribeOwnerAdminInviteLocks(
  onData: (locks: AdminInviteLockItem[]) => void
): () => void {
  return attachSnapshotAfterBoot(() => {
    const user = auth.currentUser;
    if (!user || !isBootstrappedAdminUser(user)) {
      onData([]);
      return () => {};
    }
    const path = 'adminInviteLocks';
    const q = query(collection(db, path), where('ownerUid', '==', user.uid));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: AdminInviteLockItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            proofHash: d.id,
            label: String(data.label || 'Admin Invite Code'),
            ownerUid: String(data.ownerUid || user.uid),
            active: Boolean(data.active),
            createdAtLabel:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toLocaleDateString('bn-BD')
                : 'সক্রিয়',
          };
        });
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  });
}

export async function ownerCreateAdminInviteLock(
  rawCode: string,
  label: string
): Promise<string> {
  const user = await ensureValidAuthSession();
  if (!user || !isBootstrappedAdminUser(user)) {
    throw new Error('Only the verified Super Owner can create Admin Invite Codes.');
  }
  const { wellFormed, proofHash } = computeAdminProofHashSync(rawCode);
  if (!wellFormed || !proofHash) {
    throw new Error('সিক্রেট কোড কমপক্ষে ৬ অক্ষরের হতে হবে।');
  }
  const path = `adminInviteLocks/${proofHash}`;
  try {
    await setDoc(doc(db, 'adminInviteLocks', proofHash), {
      proofHash,
      label: clampStr(label, 2, 60, 'জেলা কো-অর্ডিনেটর কোড'),
      ownerUid: user.uid,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return proofHash;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function ownerToggleAdminInviteLock(
  proofHash: string,
  nextActive: boolean,
  currentLabel: string
): Promise<void> {
  const user = await ensureValidAuthSession();
  if (!user || !isBootstrappedAdminUser(user)) return;
  const path = `adminInviteLocks/${proofHash}`;
  try {
    const ref = doc(db, 'adminInviteLocks', proofHash);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const prev = snap.data();
    await setDoc(ref, {
      ...prev,
      label: clampStr(currentLabel || prev.label, 2, 60, 'জেলা কো-অর্ডিনেটর কোড'),
      active: Boolean(nextActive),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function ownerDeleteAdminInviteLock(proofHash: string): Promise<void> {
  const user = await ensureValidAuthSession();
  if (!user || !isBootstrappedAdminUser(user)) return;
  const path = `adminInviteLocks/${proofHash}`;
  try {
    await deleteDoc(doc(db, 'adminInviteLocks', proofHash));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeAllRegisteredAdminsForOwner(
  onData: (admins: RegisteredAdminItem[]) => void
): () => void {
  return attachSnapshotAfterBoot(() => {
    const user = auth.currentUser;
    if (!user || !isBootstrappedAdminUser(user)) {
      onData([]);
      return () => {};
    }
    const path = 'admins';
    const q = query(collection(db, path), where('registryKey', '==', 'BSBD_ADMIN'));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: RegisteredAdminItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            uid: d.id,
            name: String(data.name || 'Admin'),
            idCardNumber: String(data.idCardNumber || 'ADMIN-BD'),
            district: String(data.district || 'dhaka'),
            createdAtLabel:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toLocaleDateString('bn-BD')
                : 'ভেরিফাইড',
          };
        });
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  });
}

export async function ownerRevokeAdminAccess(targetUid: string): Promise<void> {
  const user = await ensureValidAuthSession();
  if (!user || !isBootstrappedAdminUser(user)) return;
  const path = `admins/${targetUid}`;
  try {
    await deleteDoc(doc(db, 'admins', targetUid));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// 8. REAL-TIME UNLIMITED USER-TO-USER & COMMUNITY CHAT + WHATSAPP BRIDGE
// ============================================================================
export interface CommunityMessageItem {
  id: string;
  senderUid: string;
  senderName: string;
  senderBloodGroup: BloodGroup;
  senderAvatar: string;
  senderDistrict: string;
  text: string;
  replyToName: string;
  replyToText: string;
  attachmentUrl?: string;
  createdAtMs: number;
  timeLabel: string;
}

export interface DirectChatRoomItem {
  id: string;
  participantOneUid: string;
  participantOneName: string;
  participantOneGroup: BloodGroup;
  participantOneAvatar: string;
  participantOneWhatsapp: string;
  participantOneFb: string;
  participantTwoUid: string;
  participantTwoName: string;
  participantTwoGroup: BloodGroup;
  participantTwoAvatar: string;
  participantTwoWhatsapp: string;
  participantTwoFb: string;
  lastMessage: string;
  lastSenderUid: string;
  updatedAtMs: number;
  timeLabel: string;
}

export interface DirectMessageItem {
  id: string;
  chatId: string;
  senderUid: string;
  senderName: string;
  text: string;
  replyToText: string;
  attachmentUrl?: string;
  createdAtMs: number;
  timeLabel: string;
}

export function sanitizeFirestoreIdPart(raw: string): string {
  return (raw || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 56) || 'user';
}

export function buildDirectChatId(uidA: string, uidB: string): string {
  const a = sanitizeFirestoreIdPart(uidA);
  const b = sanitizeFirestoreIdPart(uidB);
  return [a, b].sort().join('__').slice(0, 120);
}

/**
 * Builds a clean WhatsApp click-to-chat URL (`https://wa.me/...`).
 * Works with Bangladeshi numbers (Bangla or English digits) or falls back to
 * WhatsApp contact picker share if phone is masked/unavailable.
 */
export function buildWhatsAppChatUrl(rawPhone?: string, prefilledText?: string): string {
  const msgQuery = prefilledText ? `?text=${encodeURIComponent(prefilledText)}` : '';
  const ascii = normalizeAsciiDigits(rawPhone || '').trim();
  if (!ascii || ascii.includes('*') || ascii.includes('X') || ascii.includes('•')) {
    return `https://wa.me/${msgQuery}`;
  }
  const e164 = formatBangladeshE164(ascii).replace(/[^0-9]/g, '');
  if (e164.length >= 11) {
    return `https://wa.me/${e164}${msgQuery}`;
  }
  return `https://wa.me/${msgQuery}`;
}

function formatChatTimestamp(ts: unknown): { ms: number; label: string } {
  if (ts instanceof Timestamp) {
    const dt = ts.toDate();
    return {
      ms: dt.getTime(),
      label: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
  return {
    ms: Date.now(),
    label: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export function subscribeCommunityMessages(
  onData: (messages: CommunityMessageItem[]) => void
): () => void {
  return attachSnapshotAfterBoot(() => {
    const path = 'communityMessages';
    const q = query(collection(db, path), where('isPublic', '==', true));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: CommunityMessageItem[] = snapshot.docs.map((d) => {
          const data = d.data();
          const t = formatChatTimestamp(data.createdAt);
          return {
            id: d.id,
            senderUid: data.senderUid || '',
            senderName: data.senderName || 'Blood Donor',
            senderBloodGroup: (data.senderBloodGroup as BloodGroup) || 'O+',
            senderAvatar: data.senderAvatar || DEFAULT_AVATAR_DATA_URI,
            senderDistrict: data.senderDistrict || '',
            text: data.text || '',
            replyToName: data.replyToName || '',
            replyToText: data.replyToText || '',
            attachmentUrl: data.attachmentUrl || '',
            createdAtMs: t.ms,
            timeLabel: t.label,
          };
        });
        items.sort((a, b) => a.createdAtMs - b.createdAtMs);
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  });
}

export async function sendCommunityMessageInFirestore(params: {
  text: string;
  senderName: string;
  senderBloodGroup: BloodGroup;
  senderAvatar?: string;
  senderDistrict?: string;
  replyToName?: string;
  replyToText?: string;
  attachmentUrl?: string;
}): Promise<void> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) {
    throw new Error('AUTH_REQUIRED');
  }
  await ensureUserAutoSyncedInFirestore(user).catch(() => null);
  const safeAttachment = params.attachmentUrl
    ? await compressChatAttachmentImage(params.attachmentUrl)
    : '';
  const fallbackText = safeAttachment ? '📷 হাসপাতালের রিকুইজিশন স্লিপ / প্রেসক্রিপশন ছবি' : '';
  const cleanText = sanitizeSafeText(params.text.trim() || fallbackText).slice(0, 2000);
  if (!cleanText) return;

  const msgId = `cmsg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `communityMessages/${msgId}`;
  const safeAvatar = await compressAvatarIfNeeded(params.senderAvatar || user.photoURL || '');

  const payload: Record<string, any> = {
    senderUid: user.uid,
    senderName: clampStr(params.senderName || user.displayName || 'রক্তদাতা', 1, 80, 'রক্তদাতা'),
    senderBloodGroup: params.senderBloodGroup || 'B+',
    senderAvatar: safeAvatar,
    senderDistrict: sanitizeSafeText(params.senderDistrict).slice(0, 50),
    text: cleanText,
    replyToName: sanitizeSafeText(params.replyToName).slice(0, 80),
    replyToText: sanitizeSafeText(params.replyToText).slice(0, 300),
    isPublic: true,
    createdAt: serverTimestamp(),
  };

  if (safeAttachment) {
    payload.attachmentUrl = safeAttachment;
  }

  try {
    await setDoc(doc(db, 'communityMessages', msgId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCommunityMessageInFirestore(messageId: string): Promise<void> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return;
  const path = `communityMessages/${messageId}`;
  try {
    await deleteDoc(doc(db, 'communityMessages', messageId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeMyDirectChats(
  uid: string,
  onData: (rooms: DirectChatRoomItem[]) => void
): () => void {
  if (!uid) {
    onData([]);
    return () => {};
  }

  return attachSnapshotAfterBoot(() => {
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      onData([]);
      return () => {};
    }

    const mapOne = new Map<string, DirectChatRoomItem>();
    const mapTwo = new Map<string, DirectChatRoomItem>();

    const parseDoc = (id: string, data: any): DirectChatRoomItem => {
      const t = formatChatTimestamp(data.updatedAt || data.createdAt);
      return {
        id,
        participantOneUid: data.participantOneUid,
        participantOneName: data.participantOneName || 'User',
        participantOneGroup: (data.participantOneGroup as BloodGroup) || 'B+',
        participantOneAvatar: data.participantOneAvatar || DEFAULT_AVATAR_DATA_URI,
        participantOneWhatsapp: data.participantOneWhatsapp || '',
        participantOneFb: data.participantOneFb || '',
        participantTwoUid: data.participantTwoUid,
        participantTwoName: data.participantTwoName || 'Donor',
        participantTwoGroup: (data.participantTwoGroup as BloodGroup) || 'O+',
        participantTwoAvatar: data.participantTwoAvatar || DEFAULT_AVATAR_DATA_URI,
        participantTwoWhatsapp: data.participantTwoWhatsapp || '',
        participantTwoFb: data.participantTwoFb || '',
        lastMessage: data.lastMessage || '',
        lastSenderUid: data.lastSenderUid || '',
        updatedAtMs: t.ms,
        timeLabel: t.label,
      };
    };

    const emitMerged = () => {
      const merged = new Map<string, DirectChatRoomItem>();
      mapOne.forEach((v, k) => merged.set(k, v));
      mapTwo.forEach((v, k) => merged.set(k, v));
      const sorted = Array.from(merged.values()).sort((a, b) => b.updatedAtMs - a.updatedAtMs);
      onData(sorted);
    };

    const q1 = query(collection(db, 'directChats'), where('participantOneUid', '==', uid));
    const q2 = query(collection(db, 'directChats'), where('participantTwoUid', '==', uid));

    const unsub1 = onSnapshot(
      q1,
      (snap) => {
        mapOne.clear();
        snap.docs.forEach((d) => mapOne.set(d.id, parseDoc(d.id, d.data())));
        emitMerged();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'directChats')
    );

    const unsub2 = onSnapshot(
      q2,
      (snap) => {
        mapTwo.clear();
        snap.docs.forEach((d) => mapTwo.set(d.id, parseDoc(d.id, d.data())));
        emitMerged();
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'directChats')
    );

    return () => {
      unsub1();
      unsub2();
    };
  });
}

export function subscribeDirectChatMessages(
  chatId: string,
  myUid: string,
  participantOneUid: string,
  onData: (messages: DirectMessageItem[]) => void
): () => void {
  if (!chatId || !myUid) {
    onData([]);
    return () => {};
  }
  return attachSnapshotAfterBoot(() => {
    if (!auth.currentUser || auth.currentUser.uid !== myUid) {
      onData([]);
      return () => {};
    }
    const fieldName = myUid === participantOneUid ? 'participantOneUid' : 'participantTwoUid';
    const q = query(
      collection(db, 'directChats', chatId, 'messages'),
      where(fieldName, '==', myUid)
    );
    return onSnapshot(
      q,
      (snap) => {
        const list: DirectMessageItem[] = snap.docs.map((d) => {
          const data = d.data();
          const t = formatChatTimestamp(data.createdAt);
          return {
            id: d.id,
            chatId: data.chatId || chatId,
            senderUid: data.senderUid || '',
            senderName: data.senderName || '',
            text: data.text || '',
            replyToText: data.replyToText || '',
            attachmentUrl: data.attachmentUrl || '',
            createdAtMs: t.ms,
            timeLabel: t.label,
          };
        });
        list.sort((a, b) => a.createdAtMs - b.createdAtMs);
        onData(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, `directChats/${chatId}/messages`)
    );
  });
}

export async function sendDirectMessageInFirestore(params: {
  myName: string;
  myGroup: BloodGroup;
  myAvatar?: string;
  myWhatsapp?: string;
  myFb?: string;
  peerUid: string;
  peerName: string;
  peerGroup: BloodGroup;
  peerAvatar?: string;
  peerWhatsapp?: string;
  peerFb?: string;
  text: string;
  replyToText?: string;
  attachmentUrl?: string;
}): Promise<string> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) {
    throw new Error('AUTH_REQUIRED');
  }
  await ensureUserAutoSyncedInFirestore(user).catch(() => null);

  const myUid = sanitizeFirestoreIdPart(user.uid);
  const cleanPeerUid = sanitizeFirestoreIdPart(params.peerUid);
  if (myUid === cleanPeerUid || user.uid !== myUid) {
    throw new Error('SELF_CHAT_NOT_ALLOWED');
  }

  const safeAttachment = params.attachmentUrl
    ? await compressChatAttachmentImage(params.attachmentUrl)
    : '';
  const fallbackText = safeAttachment ? '📷 রিকুইজিশন স্লিপ / প্রেসক্রিপশন ছবি' : '';
  const cleanText = sanitizeSafeText(params.text.trim() || fallbackText).slice(0, 2000);
  if (!cleanText) return '';

  const chatId = buildDirectChatId(myUid, cleanPeerUid);
  const roomRef = doc(db, 'directChats', chatId);
  const msgId = `dmsg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const msgRef = doc(db, 'directChats', chatId, 'messages', msgId);

  const safeMyAvatar = await compressAvatarIfNeeded(params.myAvatar || user.photoURL || '');
  const safePeerAvatar = await compressAvatarIfNeeded(params.peerAvatar || '');

  const cleanMyWa = normalizeAsciiDigits(params.myWhatsapp || '')
    .replace(/[^0-9+]/g, '')
    .slice(0, 24);
  const cleanMyFb = sanitizeSafeText(params.myFb || '').slice(0, 200);

  // Never allow room creator to pre-populate peer's WhatsApp/Facebook links on room creation
  const cleanPeerWaInit = '';
  const cleanPeerFbInit = '';

  const existingSnap = await getDoc(roomRef);
  const batch = writeBatch(db);

  let p1Uid: string;
  let p2Uid: string;

  if (existingSnap.exists()) {
    const prev = existingSnap.data();
    p1Uid = prev.participantOneUid;
    p2Uid = prev.participantTwoUid;
    const amP1 = p1Uid === myUid;

    batch.set(roomRef, {
      participantOneUid: prev.participantOneUid,
      participantOneName: amP1
        ? clampStr(params.myName, 1, 80, prev.participantOneName)
        : prev.participantOneName,
      participantOneGroup: amP1 ? params.myGroup : prev.participantOneGroup,
      participantOneAvatar: amP1 ? safeMyAvatar : prev.participantOneAvatar,
      participantOneWhatsapp: amP1 ? cleanMyWa || prev.participantOneWhatsapp : prev.participantOneWhatsapp,
      participantOneFb: amP1 ? cleanMyFb || prev.participantOneFb : prev.participantOneFb,
      participantTwoUid: prev.participantTwoUid,
      participantTwoName: !amP1
        ? clampStr(params.myName, 1, 80, prev.participantTwoName)
        : prev.participantTwoName,
      participantTwoGroup: !amP1 ? params.myGroup : prev.participantTwoGroup,
      participantTwoAvatar: !amP1 ? safeMyAvatar : prev.participantTwoAvatar,
      participantTwoWhatsapp: !amP1 ? cleanMyWa || prev.participantTwoWhatsapp : prev.participantTwoWhatsapp,
      participantTwoFb: !amP1 ? cleanMyFb || prev.participantTwoFb : prev.participantTwoFb,
      lastMessage: cleanText.slice(0, 500),
      lastSenderUid: myUid,
      createdAt: prev.createdAt,
      updatedAt: serverTimestamp(),
    });
  } else {
    const sorted = [myUid, cleanPeerUid].sort();
    p1Uid = sorted[0];
    p2Uid = sorted[1];
    const amP1 = p1Uid === myUid;

    batch.set(roomRef, {
      participantOneUid: p1Uid,
      participantOneName: clampStr(amP1 ? params.myName : params.peerName, 1, 80, 'User'),
      participantOneGroup: amP1 ? params.myGroup : params.peerGroup,
      participantOneAvatar: amP1 ? safeMyAvatar : safePeerAvatar,
      participantOneWhatsapp: amP1 ? cleanMyWa : cleanPeerWaInit,
      participantOneFb: amP1 ? cleanMyFb : cleanPeerFbInit,
      participantTwoUid: p2Uid,
      participantTwoName: clampStr(!amP1 ? params.myName : params.peerName, 1, 80, 'Donor'),
      participantTwoGroup: !amP1 ? params.myGroup : params.peerGroup,
      participantTwoAvatar: !amP1 ? safeMyAvatar : safePeerAvatar,
      participantTwoWhatsapp: !amP1 ? cleanMyWa : cleanPeerWaInit,
      participantTwoFb: !amP1 ? cleanMyFb : cleanPeerFbInit,
      lastMessage: cleanText.slice(0, 500),
      lastSenderUid: myUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const msgPayload: Record<string, any> = {
    chatId,
    senderUid: myUid,
    senderName: clampStr(params.myName || user.displayName || 'রক্তদাতা', 1, 80, 'রক্তদাতা'),
    participantOneUid: p1Uid,
    participantTwoUid: p2Uid,
    text: cleanText,
    replyToText: (params.replyToText || '').trim().slice(0, 300),
    createdAt: serverTimestamp(),
  };

  if (safeAttachment) {
    msgPayload.attachmentUrl = safeAttachment;
  }

  batch.set(msgRef, msgPayload);

  try {
    await batch.commit();
    return chatId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `directChats/${chatId}`);
  }
}

// ============================================================================
// 9. REAL DONATION RECOVERY LOGGING & CLOUD AVAILABILITY SYNC
// ============================================================================
export async function recordCompletedDonationInFirestore(params: {
  donationDate: string;
  hospitalName?: string;
  donationType?: 'WHOLE_BLOOD' | 'PLATELET';
}): Promise<{ totalDonations: number; syncedToCloud: boolean }> {
  const cleanDate = (params.donationDate || new Date().toISOString().slice(0, 10)).slice(0, 20);
  const donationType = params.donationType || 'WHOLE_BLOOD';
  const hospitalLabel = (params.hospitalName || 'হাসপাতাল রক্ত সঞ্চালন কেন্দ্র').trim().slice(0, 90);

  let nextTotal = 1;

  // 1. Update local UserAccount & Donation History immediately
  try {
    const rawUser = localStorage.getItem('bloodsearch_current_user');
    const parsedUser = rawUser ? JSON.parse(rawUser) : {};
    nextTotal = Math.min(500, (Number(parsedUser?.totalDonations) || 0) + 1);
    const updatedLocalUser = {
      ...parsedUser,
      lastDonationDate: cleanDate,
      lastDonationType: donationType,
      totalDonations: nextTotal,
      availableToDonate: false,
    };
    localStorage.setItem('bloodsearch_current_user', JSON.stringify(updatedLocalUser));

    const rawHist = localStorage.getItem('bloodsearch_donation_history');
    const prevHist = rawHist ? JSON.parse(rawHist) : [];
    const newEntry = {
      id: `don_${Date.now()}`,
      date: cleanDate,
      type: donationType,
      hospital: hospitalLabel,
    };
    localStorage.setItem(
      'bloodsearch_donation_history',
      JSON.stringify([newEntry, ...(Array.isArray(prevHist) ? prevHist : [])].slice(0, 30))
    );
    window.dispatchEvent(new Event('bloodsearch_user_changed'));
  } catch {}

  // 2. Sync atomically to Cloud Firestore if signed in with a verified session
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) {
    return { totalDonations: nextTotal, syncedToCloud: false };
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const donorRef = doc(db, 'donors', user.uid);
    const [uSnap, dSnap] = await Promise.all([getDoc(userRef), getDoc(donorRef)]);
    const batch = writeBatch(db);
    let hasWrites = false;

    if (uSnap.exists()) {
      const prevU = uSnap.data();
      nextTotal = clampNum((Number(prevU.totalDonations) || 0) + 1, 1, 500, nextTotal);
      batch.set(userRef, {
        ...prevU,
        availableToDonate: false,
        totalDonations: nextTotal,
        updatedAt: serverTimestamp(),
      });
      hasWrites = true;
    }

    if (dSnap.exists()) {
      const prevD = dSnap.data();
      const dTotal = clampNum((Number(prevD.totalDonations) || 0) + 1, 1, 500, nextTotal);
      nextTotal = Math.max(nextTotal, dTotal);
      batch.set(donorRef, {
        ...prevD,
        available: false,
        lastDonatedDate: cleanDate,
        totalDonations: nextTotal,
        updatedAt: serverTimestamp(),
      });
      hasWrites = true;
    }

    if (hasWrites) {
      await batch.commit();
      return { totalDonations: nextTotal, syncedToCloud: true };
    }
  } catch {}

  return { totalDonations: nextTotal, syncedToCloud: false };
}

export interface DonorAvailabilityAndConsentUpdate {
  availabilityStatus: DonorAvailabilityStatus;
  confirmNow?: boolean;
  shareDirectContact?: boolean;
  contactVisibility?: ContactVisibility;
  allowCall?: boolean;
  allowWhatsApp?: boolean;
  allowSms?: boolean;
  emergencyAlertsOptIn?: boolean;
  alertsPaused?: boolean;
  phone?: string;
  whatsappPhone?: string;
}

export async function updateDonorAvailabilityAndConsentInFirestore(
  prefs: DonorAvailabilityAndConsentUpdate
): Promise<boolean> {
  const available = prefs.availabilityStatus === 'AVAILABLE';

  try {
    const rawUser = localStorage.getItem('bloodsearch_current_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      parsed.availableToDonate = available;
      parsed.availabilityStatus = prefs.availabilityStatus;
      if (prefs.confirmNow) parsed.availabilityConfirmedAtMs = Date.now();
      if (typeof prefs.shareDirectContact === 'boolean') {
        parsed.shareDirectContact = prefs.shareDirectContact;
      }
      if (prefs.contactVisibility) parsed.contactVisibility = prefs.contactVisibility;
      if (typeof prefs.allowCall === 'boolean') parsed.allowCall = prefs.allowCall;
      if (typeof prefs.allowWhatsApp === 'boolean') parsed.allowWhatsApp = prefs.allowWhatsApp;
      if (typeof prefs.allowSms === 'boolean') parsed.allowSms = prefs.allowSms;
      if (typeof prefs.emergencyAlertsOptIn === 'boolean') {
        parsed.emergencyAlertsOptIn = prefs.emergencyAlertsOptIn;
      }
      if (typeof prefs.alertsPaused === 'boolean') parsed.alertsPaused = prefs.alertsPaused;
      if (prefs.phone) parsed.phone = normalizeAsciiDigits(prefs.phone).trim();
      if (prefs.whatsappPhone) {
        parsed.whatsappPhone = normalizeAsciiDigits(prefs.whatsappPhone).trim();
      }
      localStorage.setItem('bloodsearch_current_user', JSON.stringify(parsed));
      window.dispatchEvent(new Event('bloodsearch_user_changed'));
    }
  } catch {}

  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return false;

  try {
    const userRef = doc(db, 'users', user.uid);
    const donorRef = doc(db, 'donors', user.uid);
    const directRef = doc(db, 'donorDirectContacts', user.uid);
    const [uSnap, dSnap, directSnap] = await Promise.all([
      getDoc(userRef),
      getDoc(donorRef),
      getDoc(directRef),
    ]);

    const batch = writeBatch(db);
    let hasWrites = false;

    let effectivePhone = prefs.phone ? normalizeAsciiDigits(prefs.phone).trim() : '';
    let effectiveWa = prefs.whatsappPhone ? normalizeAsciiDigits(prefs.whatsappPhone).trim() : '';
    let effectiveShare = prefs.shareDirectContact;
    let effectiveVisibility = prefs.contactVisibility;
    let effectiveAllowCall = prefs.allowCall;
    let effectiveAllowWa = prefs.allowWhatsApp;
    let effectiveAllowSms = prefs.allowSms;
    let effectiveEmergOptIn = prefs.emergencyAlertsOptIn;
    let effectivePaused = prefs.alertsPaused;

    if (uSnap.exists()) {
      const prevU = uSnap.data();
      effectivePhone = effectivePhone || String(prevU.phone || '');
      effectiveWa = effectiveWa || String(prevU.whatsappPhone || effectivePhone || '');
      effectiveVisibility =
        effectiveVisibility ||
        (prevU.contactVisibility as ContactVisibility | undefined) ||
        'REQUEST_ONLY';
      effectiveShare =
        typeof effectiveShare === 'boolean'
          ? effectiveShare && effectiveVisibility !== 'REQUEST_ONLY'
          : Boolean(prevU.shareDirectContact) && effectiveVisibility !== 'REQUEST_ONLY';
      effectiveAllowCall =
        typeof effectiveAllowCall === 'boolean' ? effectiveAllowCall : prevU.allowCall !== false;
      effectiveAllowWa =
        typeof effectiveAllowWa === 'boolean' ? effectiveAllowWa : prevU.allowWhatsApp !== false;
      effectiveAllowSms =
        typeof effectiveAllowSms === 'boolean' ? effectiveAllowSms : prevU.allowSms !== false;
      effectiveEmergOptIn =
        typeof effectiveEmergOptIn === 'boolean'
          ? effectiveEmergOptIn
          : prevU.emergencyAlertsOptIn !== false;
      effectivePaused =
        typeof effectivePaused === 'boolean' ? effectivePaused : prevU.alertsPaused === true;

      const nextUser: Record<string, unknown> = {
        ...prevU,
        phone: clampStr(effectivePhone, 6, 24, String(prevU.phone || '01700000000')),
        whatsappPhone: clampStr(effectiveWa, 6, 24, String(prevU.whatsappPhone || '01700000000')),
        availableToDonate: available,
        availabilityStatus: prefs.availabilityStatus,
        shareDirectContact: effectiveShare,
        contactVisibility: effectiveVisibility,
        allowCall: effectiveAllowCall,
        allowWhatsApp: effectiveAllowWa,
        allowSms: effectiveAllowSms,
        emergencyAlertsOptIn: effectiveEmergOptIn,
        alertsPaused: effectivePaused,
        updatedAt: serverTimestamp(),
      };
      if (prefs.confirmNow) {
        nextUser.availabilityConfirmedAt = serverTimestamp();
      }
      batch.set(userRef, nextUser);
      hasWrites = true;
    }

    if (dSnap.exists()) {
      const prevD = dSnap.data();
      const vis =
        effectiveVisibility ||
        (prevD.contactVisibility as ContactVisibility | undefined) ||
        'REQUEST_ONLY';
      const shr =
        typeof effectiveShare === 'boolean'
          ? effectiveShare
          : Boolean(prevD.shareDirectContact) && vis !== 'REQUEST_ONLY';

      const nextDonor: Record<string, unknown> = {
        ...prevD,
        maskedPhone: effectivePhone ? maskPhoneNumber(effectivePhone) : prevD.maskedPhone,
        available,
        availabilityStatus: prefs.availabilityStatus,
        shareDirectContact: shr,
        contactVisibility: vis,
        allowCall:
          typeof effectiveAllowCall === 'boolean' ? effectiveAllowCall : prevD.allowCall !== false,
        allowWhatsApp:
          typeof effectiveAllowWa === 'boolean' ? effectiveAllowWa : prevD.allowWhatsApp !== false,
        allowSms:
          typeof effectiveAllowSms === 'boolean' ? effectiveAllowSms : prevD.allowSms !== false,
        emergencyAlertsOptIn:
          typeof effectiveEmergOptIn === 'boolean'
            ? effectiveEmergOptIn
            : prevD.emergencyAlertsOptIn !== false,
        alertsPaused:
          typeof effectivePaused === 'boolean' ? effectivePaused : prevD.alertsPaused === true,
        updatedAt: serverTimestamp(),
      };
      if (prefs.confirmNow) {
        nextDonor.availabilityConfirmedAt = serverTimestamp();
      }
      batch.set(donorRef, nextDonor);
      hasWrites = true;
    }

    const canPublishDirect =
      Boolean(effectiveShare) &&
      effectiveVisibility !== 'REQUEST_ONLY' &&
      prefs.availabilityStatus !== 'DND' &&
      effectivePhone.length >= 6 &&
      effectivePhone !== '01700000000';

    if (canPublishDirect && uSnap.exists()) {
      batch.set(directRef, {
        ownerUid: user.uid,
        phone: clampStr(effectivePhone, 6, 24, '01700000000'),
        whatsappPhone: clampStr(effectiveWa || effectivePhone, 6, 24, effectivePhone).slice(0, 24),
        shareDirectContact: true,
        contactVisibility: effectiveVisibility || 'PUBLIC_OPT_IN',
        availabilityStatus: prefs.availabilityStatus,
        allowCall: effectiveAllowCall !== false,
        allowWhatsApp: effectiveAllowWa !== false,
        allowSms: effectiveAllowSms !== false,
        createdAt: directSnap.exists() ? directSnap.data().createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      hasWrites = true;
    } else if (directSnap.exists()) {
      batch.delete(directRef);
      hasWrites = true;
    }

    if (hasWrites) {
      await batch.commit();
      return true;
    }
  } catch (err) {
    console.warn('Availability & consent sync failed:', err);
  }
  return false;
}

export async function syncDonorAvailabilityInFirestore(available: boolean): Promise<boolean> {
  return updateDonorAvailabilityAndConsentInFirestore({
    availabilityStatus: available ? 'AVAILABLE' : 'TEMPORARILY_UNAVAILABLE',
    confirmNow: available,
  });
}

// ============================================================================
// 9B. CONSENT CONTACT REQUESTS, CONCURRENT EMERGENCY ALERTS & ESCALATION ENGINE
// ============================================================================
export async function sendContactConsentRequestInFirestore(params: {
  donorUid: string;
  donorName: string;
  seekerName: string;
  seekerPhone: string;
  bloodGroupNeeded: BloodGroup;
  hospitalName: string;
  urgency: 'CRITICAL' | 'URGENT' | 'STANDARD';
}): Promise<{ ok: boolean; reason?: string }> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) {
    return { ok: false, reason: 'AUTH_REQUIRED' };
  }
  if (user.uid === params.donorUid) {
    return { ok: false, reason: 'SELF_REQUEST' };
  }
  await ensureUserAutoSyncedInFirestore(user).catch(() => null);

  const contactReqId = `${user.uid}__${params.donorUid}`;
  const path = `contactRequests/${contactReqId}`;
  const cleanSeekerPhone = clampStr(
    normalizeAsciiDigits(params.seekerPhone).trim(),
    6,
    24,
    '01700000000'
  );

  try {
    const ref = doc(db, 'contactRequests', contactReqId);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      const prev = existing.data();
      if (prev.status === 'APPROVED') {
        return { ok: true, reason: 'ALREADY_APPROVED' };
      }
      await setDoc(ref, {
        ...prev,
        seekerName: clampStr(params.seekerName, 2, 80, 'Blood Seeker'),
        seekerPhone: cleanSeekerPhone,
        bloodGroupNeeded: params.bloodGroupNeeded,
        hospitalName: clampStr(params.hospitalName, 2, 120, 'Hospital Emergency'),
        urgency: params.urgency || 'CRITICAL',
        status: 'PENDING',
        approvedPhone: '',
        approvedWhatsApp: '',
        updatedAt: serverTimestamp(),
      });
      return { ok: true };
    }

    await setDoc(ref, {
      seekerUid: user.uid,
      seekerName: clampStr(params.seekerName, 2, 80, 'Blood Seeker'),
      seekerPhone: cleanSeekerPhone,
      donorUid: params.donorUid,
      donorName: clampStr(params.donorName, 2, 80, 'Voluntary Donor'),
      bloodGroupNeeded: params.bloodGroupNeeded,
      hospitalName: clampStr(params.hospitalName, 2, 120, 'Hospital Emergency'),
      urgency: params.urgency || 'CRITICAL',
      status: 'PENDING',
      approvedPhone: '',
      approvedWhatsApp: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ok: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeIncomingContactRequestsForDonor(
  donorUid: string,
  onData: (items: ContactConsentRequestItem[]) => void
): () => void {
  return attachSnapshotAfterBoot(() => {
    const q = query(collection(db, 'contactRequests'), where('donorUid', '==', donorUid));
    return onSnapshot(
      q,
      (snap) => {
        const list: ContactConsentRequestItem[] = snap.docs.map((d) => {
          const x = d.data();
          const createdAtMs =
            x.createdAt instanceof Timestamp ? x.createdAt.toMillis() : Date.now();
          const updatedAtMs =
            x.updatedAt instanceof Timestamp ? x.updatedAt.toMillis() : createdAtMs;
          return {
            id: d.id,
            seekerUid: String(x.seekerUid || ''),
            seekerName: String(x.seekerName || ''),
            seekerPhone: String(x.seekerPhone || ''),
            donorUid: String(x.donorUid || ''),
            donorName: String(x.donorName || ''),
            bloodGroupNeeded: (x.bloodGroupNeeded as BloodGroup) || 'O+',
            hospitalName: String(x.hospitalName || ''),
            urgency: (x.urgency as 'CRITICAL' | 'URGENT' | 'STANDARD') || 'CRITICAL',
            status: (x.status as 'PENDING' | 'APPROVED' | 'DECLINED') || 'PENDING',
            approvedPhone: x.approvedPhone ? String(x.approvedPhone) : undefined,
            approvedWhatsApp: x.approvedWhatsApp ? String(x.approvedWhatsApp) : undefined,
            createdAtMs,
            updatedAtMs,
          };
        });
        list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
        onData(list);
      },
      (err) => {
        console.warn('Incoming contact requests listener warning:', err);
        onData([]);
      }
    );
  });
}

export async function respondToContactRequestInFirestore(params: {
  contactReqId: string;
  approve: boolean;
  donorPhone?: string;
  donorWhatsApp?: string;
}): Promise<boolean> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return false;

  const ref = doc(db, 'contactRequests', params.contactReqId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const prev = snap.data();
  if (prev.donorUid !== user.uid || prev.status !== 'PENDING') return false;

  let phoneToShare = normalizeAsciiDigits(params.donorPhone || '').trim();
  let waToShare = normalizeAsciiDigits(params.donorWhatsApp || '').trim();

  if (params.approve && !phoneToShare) {
    const uSnap = await getDoc(doc(db, 'users', user.uid));
    if (uSnap.exists()) {
      phoneToShare = String(uSnap.data().phone || '');
      waToShare = String(uSnap.data().whatsappPhone || phoneToShare || '');
    }
  }

  await setDoc(ref, {
    ...prev,
    status: params.approve ? 'APPROVED' : 'DECLINED',
    approvedPhone: params.approve ? clampStr(phoneToShare, 6, 24, '01700000000') : '',
    approvedWhatsApp: params.approve
      ? clampStr(waToShare || phoneToShare, 6, 24, '01700000000')
      : '',
    updatedAt: serverTimestamp(),
  });
  return true;
}

export interface EmergencyBroadcastDispatchResult {
  requestId: string;
  syncedToCloud: boolean;
  alertsWritten: number;
  pushChannelState: 'CONFIGURED' | 'NOT_CONFIGURED_BROWSER_REALTIME_ONLY';
  smsChannelState: 'SENT' | 'NOT_CONFIGURED' | 'PROVIDER_ERROR' | 'NO_ELIGIBLE_RECIPIENTS';
  smsSentCount: number;
  honestNotice: string;
}

export async function checkFcmAndServerCapabilities(): Promise<{
  fcmClientSupported: boolean;
  fcmVapidConfigured: boolean;
  fcmServerConfigured: boolean;
  smsProviderConfigured: boolean;
  smsProvider: string;
  browserNotificationPermission: string;
}> {
  const vapidKey = String((import.meta as any).env?.VITE_FIREBASE_VAPID_KEY || '').trim();
  let fcmClientSupported = false;
  if (typeof window !== 'undefined') {
    try {
      const { isSupported } = await import('firebase/messaging');
      fcmClientSupported = await isSupported();
    } catch {
      fcmClientSupported = false;
    }
  }
  const browserPerm =
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported';

  try {
    const res = await fetch('/api/capabilities');
    if (res.ok) {
      const capJson = await res.json();
      const cap = capJson?.capabilities || capJson;
      return {
        fcmClientSupported,
        fcmVapidConfigured: Boolean(vapidKey || cap.fcmVapidConfigured),
        fcmServerConfigured: Boolean(cap.fcmServerConfigured || cap.fcmPushConfigured),
        smsProviderConfigured: Boolean(cap.smsConfigured || cap.smsProviderConfigured),
        smsProvider: String(cap.smsProvider || 'NONE'),
        browserNotificationPermission: browserPerm,
      };
    }
  } catch {}

  return {
    fcmClientSupported,
    fcmVapidConfigured: Boolean(vapidKey),
    fcmServerConfigured: false,
    smsProviderConfigured: false,
    smsProvider: 'NONE',
    browserNotificationPermission: browserPerm,
  };
}

export async function dispatchEmergencyBroadcastClient(params: {
  request: BloodRequest;
  seekerCallbackPhone: string;
  candidateCloudDonorIds: string[];
}): Promise<EmergencyBroadcastDispatchResult> {
  const { request, seekerCallbackPhone, candidateCloudDonorIds } = params;
  const safeId =
    request.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || `req_${Date.now()}`;

  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) {
    return {
      requestId: safeId,
      syncedToCloud: false,
      alertsWritten: 0,
      pushChannelState: 'NOT_CONFIGURED_BROWSER_REALTIME_ONLY',
      smsChannelState: 'NOT_CONFIGURED',
      smsSentCount: 0,
      honestNotice:
        'Signed-out session: request saved locally on this device only. Sign in with a verified account to broadcast to cloud donors, or call opted-in donors directly right now.',
    };
  }

  await ensureUserAutoSyncedInFirestore(user).catch(() => null);

  // Filter eligible cloud donor IDs (exclude self and local seed IDs like donor-1 or d1)
  const uniqueDonorIds = Array.from(
    new Set(
      candidateCloudDonorIds.filter(
        (id) =>
          id &&
          id !== user.uid &&
          !/^(d|donor-)\d+$/.test(id) &&
          /^[a-zA-Z0-9_-]{4,128}$/.test(id)
      )
    )
  ).slice(0, 25);

  let pushChannelState: 'CONFIGURED' | 'NOT_CONFIGURED_BROWSER_REALTIME_ONLY' =
    'NOT_CONFIGURED_BROWSER_REALTIME_ONLY';
  let smsChannelState: 'SENT' | 'NOT_CONFIGURED' | 'PROVIDER_ERROR' | 'NO_ELIGIBLE_RECIPIENTS' =
    'NOT_CONFIGURED';
  let smsSentCount = 0;
  let serverNote = '';

  // 1. Validate & dispatch through secure Express backend (/api/emergency/dispatch)
  try {
    const idToken = await user.getIdToken();
    const optedInRecipientPhones: string[] = [];
    for (const dId of uniqueDonorIds.slice(0, 10)) {
      const contact = await fetchUnmaskedDonorContactIfAuthorized(dId);
      if (contact?.phone && contact.allowSms !== false) {
        optedInRecipientPhones.push(contact.phone);
      }
    }

    const resp = await fetch('/api/emergency/dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        requestId: safeId,
        bloodGroup: request.bloodGroup,
        unitsNeeded: request.unitsNeeded,
        hospitalName: request.hospitalName,
        district: request.district,
        upazila: request.upazila,
        urgency: request.urgency,
        requiredTimeWindow: request.requiredTimeWindow || 'IMMEDIATE_2H',
        escalationLevel: 0,
        searchRadiusKm: request.searchRadiusKm || 10,
        candidateDonorIds: uniqueDonorIds,
        optedInSmsPhones: optedInRecipientPhones,
      }),
    });

    if (resp.status === 409 || resp.status === 429) {
      const errBody = await resp.json().catch(() => ({}));
      serverNote = String(
        errBody.message || 'Broadcast SMS throttled — saving live cloud request directly.'
      );
    } else if (resp.ok) {
      const data = await resp.json();
      const rawPush = String(data?.channels?.pushStatus || data?.channels?.fcmPush || '');
      pushChannelState =
        rawPush === 'FCM_SERVER_READY' || rawPush === 'CONFIGURED'
          ? 'CONFIGURED'
          : 'NOT_CONFIGURED_BROWSER_REALTIME_ONLY';
      smsChannelState =
        data?.channels?.smsStatus || data?.channels?.sms?.status || 'NOT_CONFIGURED';
      smsSentCount =
        Number(data?.channels?.smsSentCount ?? data?.channels?.sms?.sentCount) || 0;
      serverNote = String(data?.honestDeliveryNotice || data?.honestDeliveryNote || '');
    }
  } catch {
    // Proceed cleanly to Firestore request persistence so urgent blood requests never fail
  }

  // 2. Write /requests/{safeId} FIRST so /requestAlerts relational check sees it
  const initialLifecycle: RequestLifecycleState =
    uniqueDonorIds.length > 0 ? 'DONORS_NOTIFIED' : 'SEARCHING';
  const createdId = await createBloodRequestInFirestore({
    ...request,
    id: safeId,
    authorUid: user.uid,
    lifecycleState: initialLifecycle,
    notifiedCount: uniqueDonorIds.length,
    escalationLevel: 0,
    searchRadiusKm: request.searchRadiusKm || 10,
    escalationIntervalMinutes: request.escalationIntervalMinutes || 10,
  });

  if (!createdId) {
    return {
      requestId: safeId,
      syncedToCloud: false,
      alertsWritten: 0,
      pushChannelState,
      smsChannelState,
      smsSentCount,
      honestNotice: 'Could not publish cloud request. Use direct Call/WhatsApp on matched donors.',
    };
  }

  // 3. Concurrently fan out deterministic /requestAlerts/{safeId__donorUid}
  let alertsWritten = 0;
  const cleanCallback = clampStr(
    normalizeAsciiDigits(seekerCallbackPhone).trim(),
    0,
    24,
    ''
  );

  if (uniqueDonorIds.length > 0) {
    try {
      const batch = writeBatch(db);
      for (const donorUid of uniqueDonorIds) {
        const alertId = `${createdId}__${donorUid}`;
        batch.set(doc(db, 'requestAlerts', alertId), {
          requestId: createdId,
          authorUid: user.uid,
          donorUid,
          bloodGroup: request.bloodGroup,
          hospitalName: clampStr(request.hospitalName, 2, 120, 'Hospital Emergency'),
          district: clampStr(request.district, 2, 40, 'dhaka'),
          urgency: request.urgency || 'CRITICAL',
          seekerCallbackPhone: cleanCallback,
          escalationLevel: 0,
          deliveryState: 'DISPATCHED',
          responseNote: '',
          responderPhone: '',
          responderName: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      alertsWritten = uniqueDonorIds.length;
    } catch (err) {
      console.warn('Partial alert fan-out fallback:', err);
      // Fallback per-donor write in case one donor doc was deleted concurrently
      for (const donorUid of uniqueDonorIds) {
        try {
          await setDoc(doc(db, 'requestAlerts', `${createdId}__${donorUid}`), {
            requestId: createdId,
            authorUid: user.uid,
            donorUid,
            bloodGroup: request.bloodGroup,
            hospitalName: clampStr(request.hospitalName, 2, 120, 'Hospital Emergency'),
            district: clampStr(request.district, 2, 40, 'dhaka'),
            urgency: request.urgency || 'CRITICAL',
            seekerCallbackPhone: cleanCallback,
            escalationLevel: 0,
            deliveryState: 'DISPATCHED',
            responseNote: '',
            responderPhone: '',
            responderName: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          alertsWritten += 1;
        } catch {}
      }
    }
  }

  return {
    requestId: createdId,
    syncedToCloud: true,
    alertsWritten,
    pushChannelState,
    smsChannelState,
    smsSentCount,
    honestNotice:
      serverNote ||
      `Dispatched ${alertsWritten} concurrent real-time in-app alerts. Note: A dispatched alert does not guarantee a donor has read it—call opted-in donors directly in parallel.`,
  };
}

export async function escalateBloodRequestInFirestore(params: {
  requestId: string;
  nextEscalationLevel: number;
  nextRadiusKm: number;
  additionalCloudDonorIds: string[];
  seekerCallbackPhone?: string;
}): Promise<{ ok: boolean; newlyNotified: number }> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return { ok: false, newlyNotified: 0 };

  const safeId = params.requestId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const reqRef = doc(db, 'requests', safeId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) return { ok: false, newlyNotified: 0 };
  const prev = reqSnap.data();
  if (prev.status !== 'ACTIVE' || prev.authorUid !== user.uid) {
    return { ok: false, newlyNotified: 0 };
  }

  const cleanNewIds = Array.from(
    new Set(
      params.additionalCloudDonorIds.filter(
        (id) =>
          id &&
          id !== user.uid &&
          !/^(d|donor-)\d+$/.test(id) &&
          /^[a-zA-Z0-9_-]{4,128}$/.test(id)
      )
    )
  ).slice(0, 25);

  try {
    const idToken = await user.getIdToken();
    await fetch('/api/emergency/escalate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        requestId: safeId,
        bloodGroup: prev.bloodGroup,
        hospitalName: prev.hospitalName,
        district: prev.district,
        nextLevel: params.nextEscalationLevel,
        newRadiusKm: params.nextRadiusKm,
        newlyMatchedDonorIds: cleanNewIds,
      }),
    }).catch(() => null);
  } catch {}

  let newlyNotified = 0;
  const cleanCallback = clampStr(
    normalizeAsciiDigits(params.seekerCallbackPhone || '').trim(),
    0,
    24,
    ''
  );

  for (const donorUid of cleanNewIds) {
    const alertId = `${safeId}__${donorUid}`;
    try {
      const alertRef = doc(db, 'requestAlerts', alertId);
      const existingAlert = await getDoc(alertRef);
      if (!existingAlert.exists()) {
        await setDoc(alertRef, {
          requestId: safeId,
          authorUid: user.uid,
          donorUid,
          bloodGroup: prev.bloodGroup,
          hospitalName: clampStr(prev.hospitalName, 2, 120, 'Hospital Emergency'),
          district: clampStr(prev.district, 2, 40, 'dhaka'),
          urgency: prev.urgency || 'CRITICAL',
          seekerCallbackPhone: cleanCallback,
          escalationLevel: clampNum(params.nextEscalationLevel, 1, 10, 1),
          deliveryState: 'DISPATCHED',
          responseNote: '',
          responderPhone: '',
          responderName: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        newlyNotified += 1;
      }
    } catch {}
  }

  const totalNotified = clampNum((Number(prev.notifiedCount) || 0) + newlyNotified, 0, 5000, 0);
  const nextLifecycle: RequestLifecycleState =
    Number(prev.respondedCount) > 0
      ? 'RESPONSES_RECEIVED'
      : totalNotified > 0
        ? 'DONORS_NOTIFIED'
        : 'NO_RESPONSE';

  await setDoc(reqRef, {
    ...prev,
    escalationLevel: clampNum(params.nextEscalationLevel, 1, 10, 1),
    searchRadiusKm: clampNum(params.nextRadiusKm, 1, 1000, 25),
    notifiedCount: totalNotified,
    lifecycleState: nextLifecycle,
    updatedAt: serverTimestamp(),
  });

  return { ok: true, newlyNotified };
}

export async function updateBloodRequestTrackingInFirestore(params: {
  requestId: string;
  status?: 'ACTIVE' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
  lifecycleState?: RequestLifecycleState;
  incrementContactAttempt?: boolean;
  confirmedDonorId?: string;
  confirmedDonorName?: string;
}): Promise<boolean> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return false;

  const safeId = params.requestId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const reqRef = doc(db, 'requests', safeId);
  const snap = await getDoc(reqRef);
  if (!snap.exists()) return false;
  const prev = snap.data();
  if (prev.status !== 'ACTIVE') return false;

  const isAdmin = await checkIsVerifiedAdminInFirestore(user);
  if (prev.authorUid !== user.uid && !isAdmin) return false;

  const nextStatus = params.status || prev.status || 'ACTIVE';
  const nextAttempts = params.incrementContactAttempt
    ? clampNum((Number(prev.contactAttemptsCount) || 0) + 1, 1, 5000, 1)
    : clampNum(Number(prev.contactAttemptsCount) || 0, 0, 5000, 0);
  const nextConfirmedId =
    params.confirmedDonorId !== undefined
      ? clampStr(params.confirmedDonorId, 0, 128, '')
      : clampStr(prev.confirmedDonorId || '', 0, 128, '');
  const nextConfirmedName =
    params.confirmedDonorName !== undefined
      ? clampStr(params.confirmedDonorName, 0, 80, '')
      : clampStr(prev.confirmedDonorName || '', 0, 80, '');

  const nextLifecycle: RequestLifecycleState =
    nextStatus === 'FULFILLED'
      ? 'FULFILLED'
      : nextStatus === 'CANCELLED'
        ? 'CANCELLED'
        : nextStatus === 'EXPIRED'
          ? 'EXPIRED'
          : params.lifecycleState ||
            (nextConfirmedId
              ? 'DONOR_CONFIRMED'
              : nextAttempts > 0
                ? 'CONTACT_ATTEMPTED'
                : (prev.lifecycleState as RequestLifecycleState) || 'SEARCHING');

  await setDoc(reqRef, {
    ...prev,
    status: nextStatus,
    lifecycleState: nextLifecycle,
    unitsCollected: nextStatus === 'FULFILLED' ? prev.unitsNeeded : prev.unitsCollected,
    contactAttemptsCount: nextAttempts,
    confirmedDonorId: nextConfirmedId,
    confirmedDonorName: nextConfirmedName,
    updatedAt: serverTimestamp(),
  });

  // If terminal state reached (FULFILLED, CANCELLED, EXPIRED), lock /requestDirectContacts/{safeId} & stop alerts
  if (nextStatus !== 'ACTIVE') {
    try {
      const dcRef = doc(db, 'requestDirectContacts', safeId);
      const dcSnap = await getDoc(dcRef);
      if (dcSnap.exists()) {
        await setDoc(dcRef, {
          ...dcSnap.data(),
          status: nextStatus,
          updatedAt: serverTimestamp(),
        });
      }
      requestDirectContactCache.set(safeId, null);
    } catch {}

    try {
      const idToken = await user.getIdToken();
      await fetch('/api/emergency/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          requestId: safeId,
          reason: nextStatus,
        }),
      }).catch(() => null);
    } catch {}

    try {
      const alertsSnap = await getDocs(
        query(collection(db, 'requestAlerts'), where('authorUid', '==', user.uid))
      );
      const batch = writeBatch(db);
      let count = 0;
      alertsSnap.docs.forEach((d) => {
        const ad = d.data();
        if (ad.requestId === safeId && ad.deliveryState !== 'STOPPED_RESOLVED') {
          batch.set(doc(db, 'requestAlerts', d.id), {
            ...ad,
            deliveryState: 'STOPPED_RESOLVED',
            updatedAt: serverTimestamp(),
          });
          count += 1;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    } catch {}

    try {
      const tripsSnap = await getDocs(
        query(collection(db, 'liveDonorTrips'), where('seekerUid', '==', user.uid))
      );
      const terminalTripStatus: LiveDonorTripStatus =
        nextStatus === 'FULFILLED' ? 'COMPLETED' : 'CANCELLED';
      const tripBatch = writeBatch(db);
      let tripCount = 0;
      tripsSnap.docs.forEach((d) => {
        const td = d.data();
        if (
          td.requestId === safeId &&
          td.tripStatus !== 'COMPLETED' &&
          td.tripStatus !== 'CANCELLED'
        ) {
          tripBatch.set(doc(db, 'liveDonorTrips', d.id), {
            ...td,
            tripStatus: terminalTripStatus,
            updatedAt: serverTimestamp(),
          });
          tripCount += 1;
        }
      });
      if (tripCount > 0) {
        await tripBatch.commit();
      }
    } catch {}
  }

  return true;
}

export function subscribeAlertsForAuthorRequests(
  authorUid: string,
  onData: (alerts: RequestAlertItem[]) => void
): () => void {
  return attachSnapshotAfterBoot(() => {
    const q = query(collection(db, 'requestAlerts'), where('authorUid', '==', authorUid));
    return onSnapshot(
      q,
      (snap) => {
        const list: RequestAlertItem[] = snap.docs.map((d) => {
          const x = d.data();
          const createdAtMs =
            x.createdAt instanceof Timestamp ? x.createdAt.toMillis() : Date.now();
          const updatedAtMs =
            x.updatedAt instanceof Timestamp ? x.updatedAt.toMillis() : createdAtMs;
          return {
            id: d.id,
            requestId: String(x.requestId || ''),
            authorUid: String(x.authorUid || ''),
            donorUid: String(x.donorUid || ''),
            bloodGroup: (x.bloodGroup as BloodGroup) || 'O+',
            hospitalName: String(x.hospitalName || ''),
            district: String(x.district || ''),
            urgency: (x.urgency as 'CRITICAL' | 'URGENT' | 'STANDARD') || 'CRITICAL',
            seekerCallbackPhone: x.seekerCallbackPhone ? String(x.seekerCallbackPhone) : undefined,
            escalationLevel: Number(x.escalationLevel) || 0,
            deliveryState: x.deliveryState || 'DISPATCHED',
            responseNote: x.responseNote ? String(x.responseNote) : undefined,
            responderPhone: x.responderPhone ? String(x.responderPhone) : undefined,
            responderName: x.responderName ? String(x.responderName) : undefined,
            createdAtMs,
            updatedAtMs,
          };
        });
        list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
        onData(list);
      },
      () => onData([])
    );
  });
}

export function subscribeIncomingAlertsForDonor(
  donorUid: string,
  onData: (alerts: RequestAlertItem[]) => void
): () => void {
  return attachSnapshotAfterBoot(() => {
    const q = query(collection(db, 'requestAlerts'), where('donorUid', '==', donorUid));
    return onSnapshot(
      q,
      (snap) => {
        const list: RequestAlertItem[] = snap.docs.map((d) => {
          const x = d.data();
          const createdAtMs =
            x.createdAt instanceof Timestamp ? x.createdAt.toMillis() : Date.now();
          const updatedAtMs =
            x.updatedAt instanceof Timestamp ? x.updatedAt.toMillis() : createdAtMs;
          return {
            id: d.id,
            requestId: String(x.requestId || ''),
            authorUid: String(x.authorUid || ''),
            donorUid: String(x.donorUid || ''),
            bloodGroup: (x.bloodGroup as BloodGroup) || 'O+',
            hospitalName: String(x.hospitalName || ''),
            district: String(x.district || ''),
            urgency: (x.urgency as 'CRITICAL' | 'URGENT' | 'STANDARD') || 'CRITICAL',
            seekerCallbackPhone: x.seekerCallbackPhone ? String(x.seekerCallbackPhone) : undefined,
            escalationLevel: Number(x.escalationLevel) || 0,
            deliveryState: x.deliveryState || 'DISPATCHED',
            responseNote: x.responseNote ? String(x.responseNote) : undefined,
            responderPhone: x.responderPhone ? String(x.responderPhone) : undefined,
            responderName: x.responderName ? String(x.responderName) : undefined,
            createdAtMs,
            updatedAtMs,
          };
        });
        list.sort((a, b) => b.createdAtMs - a.createdAtMs);
        onData(list);
      },
      () => onData([])
    );
  });
}

export async function respondToRequestAlertInFirestore(params: {
  alertId: string;
  action: 'VIEWED' | 'RESPONDED_ACCEPT' | 'RESPONDED_DECLINE';
  responderName?: string;
  responderPhone?: string;
  responseNote?: string;
}): Promise<boolean> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return false;

  const ref = doc(db, 'requestAlerts', params.alertId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const prev = snap.data();
  if (prev.donorUid !== user.uid || prev.deliveryState === 'STOPPED_RESOLVED') return false;

  await setDoc(ref, {
    ...prev,
    deliveryState: params.action,
    responderName: clampStr(params.responderName || prev.responderName || '', 0, 80, ''),
    responderPhone:
      params.action === 'RESPONDED_ACCEPT'
        ? clampStr(normalizeAsciiDigits(params.responderPhone || '').trim(), 0, 24, '')
        : '',
    responseNote: clampStr(params.responseNote || prev.responseNote || '', 0, 200, ''),
    updatedAt: serverTimestamp(),
  });

  if (params.action === 'RESPONDED_ACCEPT') {
    await pledgeBloodRequestUnitInFirestore(String(prev.requestId || '')).catch(() => false);
  }
  return true;
}

// ============================================================================
// 10. ANTI-SPAM RATE-LIMIT GUARD, OWNER MEGAPHONE, SCAM SHIELD & GRATITUDE WALL
// ============================================================================
const actionCooldownRegistry = new Map<string, number>();

export function checkActionCooldownGuard(
  actionKey: 'CHAT_SEND' | 'CREATE_SOS' | 'SCAM_REPORT' | 'GRATITUDE_POST',
  cooldownMs: number
): { allowed: boolean; waitSeconds: number } {
  const now = Date.now();
  const prev = actionCooldownRegistry.get(actionKey) || 0;
  const elapsed = now - prev;
  if (elapsed < cooldownMs) {
    return {
      allowed: false,
      waitSeconds: Math.max(1, Math.ceil((cooldownMs - elapsed) / 1000)),
    };
  }
  actionCooldownRegistry.set(actionKey, now);
  return { allowed: true, waitSeconds: 0 };
}

export interface OwnerAnnouncementItem {
  id: string;
  title: string;
  message: string;
  urgency: 'CRITICAL' | 'INFO' | 'CAMPAIGN';
  active: boolean;
  updatedAtLabel: string;
}

export interface RemoteAppUpdateRelease {
  version: string;
  mode: 'OPTIONAL' | 'REQUIRED';
  changelog: string;
  apkUrl?: string;
  active: boolean;
  updatedAtLabel: string;
}

const REAL_ONLY_MODE_DOC_ID = 'system_real_only_mode';
const APP_UPDATE_DOC_ID = 'system_app_update';

function parseRemoteAppUpdateDoc(
  data: Record<string, any> | undefined
): RemoteAppUpdateRelease | null {
  if (!data || !data.active) return null;
  const rawTitle = String(data.title || '').trim();
  if (!rawTitle.startsWith('APP_UPDATE|')) return null;

  const parts = rawTitle.split('|');
  const version = (parts[1] || '2.5.0').trim();
  const mode: 'OPTIONAL' | 'REQUIRED' = parts[2] === 'REQUIRED' ? 'REQUIRED' : 'OPTIONAL';

  const rawMsg = String(data.message || '').trim();
  const apkMarkerIdx = rawMsg.indexOf('\nAPK_URL:');
  let changelog = rawMsg;
  let apkUrl: string | undefined;

  if (apkMarkerIdx >= 0) {
    changelog = rawMsg.slice(0, apkMarkerIdx).trim();
    const candidateUrl = rawMsg.slice(apkMarkerIdx + '\nAPK_URL:'.length).trim();
    if (/^https:\/\/[^\s<>"]+$/i.test(candidateUrl)) {
      apkUrl = candidateUrl;
    }
  }

  const t = formatChatTimestamp(data.updatedAt || data.createdAt);
  return {
    version,
    mode,
    changelog: changelog || 'নতুন ফিচার ও পারফরম্যান্স আপডেট যুক্ত হয়েছে।',
    apkUrl,
    active: true,
    updatedAtLabel: t.label,
  };
}

export function isGlobalRealOnlyModeActive(): boolean {
  try {
    return localStorage.getItem('bloodsearch_real_only_mode') !== 'false';
  } catch {
    return true;
  }
}

function setLocalRealOnlyModeFlag(active: boolean): void {
  try {
    const prev = localStorage.getItem('bloodsearch_real_only_mode') !== 'false';
    localStorage.setItem('bloodsearch_real_only_mode', String(active));
    if (prev !== active) {
      window.dispatchEvent(new Event('bloodsearch_real_mode_changed'));
    }
  } catch {}
}

export function subscribeRemoteAppUpdate(
  onUpdate: (release: RemoteAppUpdateRelease | null) => void
): () => void {
  return attachSnapshotAfterBoot(() => {
    const ref = doc(db, 'announcements', APP_UPDATE_DOC_ID);
    return onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          onUpdate(null);
          return;
        }
        onUpdate(parseRemoteAppUpdateDoc(snap.data()));
      },
      () => {
        onUpdate(null);
      }
    );
  });
}

export async function adminPublishAppUpdateInFirestore(params: {
  version: string;
  mode: 'OPTIONAL' | 'REQUIRED';
  changelog: string;
  apkUrl?: string;
}): Promise<void> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) {
    throw new Error('AUTH_REQUIRED');
  }

  const safeVersion = params.version
    .trim()
    .replace(/^v/i, '')
    .replace(/[^0-9a-zA-Z.\-]/g, '')
    .slice(0, 24) || '2.5.0';

  const mode = params.mode === 'REQUIRED' ? 'REQUIRED' : 'OPTIONAL';
  const cleanApk = (params.apkUrl || '').trim();
  const validApk = /^https:\/\/[^\s<>"]{6,220}$/i.test(cleanApk) ? cleanApk : '';
  const maxNotesLen = validApk ? Math.max(40, 560 - validApk.length) : 560;
  const cleanNotes = clampStr(
    params.changelog.replace(/\nAPK_URL:/gi, ' '),
    2,
    maxNotesLen,
    'নতুন আপডেট ও বাগ ফিক্স যুক্ত হয়েছে।'
  );

  const encodedTitle = clampStr(`APP_UPDATE|${safeVersion}|${mode}`, 2, 120, 'APP_UPDATE|2.5.0|OPTIONAL');
  const encodedMessage = validApk ? `${cleanNotes}\nAPK_URL:${validApk}` : cleanNotes;

  const ref = doc(db, 'announcements', APP_UPDATE_DOC_ID);
  const existing = await getDoc(ref);

  const payload = {
    title: encodedTitle,
    message: clampStr(encodedMessage, 2, 600, cleanNotes),
    urgency: mode === 'REQUIRED' ? ('CRITICAL' as const) : ('INFO' as const),
    active: true,
    updatedByUid: user.uid,
    createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `announcements/${APP_UPDATE_DOC_ID}`);
  }
}

export async function adminDeactivateAppUpdateInFirestore(): Promise<void> {
  await adminDeactivateAnnouncementInFirestore(APP_UPDATE_DOC_ID);
}

export function subscribeActiveAnnouncements(
  onData: (items: OwnerAnnouncementItem[]) => void
): () => void {
  return attachSnapshotAfterBoot(() => {
    const q = query(collection(db, 'announcements'), where('active', '==', true));
    return onSnapshot(
      q,
      (snap) => {
        const cloudRealDoc = snap.docs.find((d) => d.id === REAL_ONLY_MODE_DOC_ID);
        if (cloudRealDoc) {
          setLocalRealOnlyOnlySync(Boolean(cloudRealDoc.data().active));
        }

        const list: OwnerAnnouncementItem[] = snap.docs
          .filter((d) => d.id !== REAL_ONLY_MODE_DOC_ID && d.id !== APP_UPDATE_DOC_ID)
          .map((d) => {
            const data = d.data();
            const t = formatChatTimestamp(data.updatedAt || data.createdAt);
            return {
              id: d.id,
              title: String(data.title || ''),
              message: String(data.message || ''),
              urgency:
                data.urgency === 'CRITICAL' || data.urgency === 'CAMPAIGN' ? data.urgency : 'INFO',
              active: Boolean(data.active),
              updatedAtLabel: t.label,
            };
          });
        onData(list);
      },
      (error) => {
        onData([]);
        handleFirestoreError(error, OperationType.LIST, 'announcements');
      }
    );
  });
}

function setLocalRealOnlyOnlySync(active: boolean): void {
  setLocalRealOnlyModeFlag(active);
}

export async function adminSetGlobalRealOnlyModeInFirestore(enable: boolean): Promise<void> {
  setLocalRealOnlyModeFlag(enable);
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return;

  const ref = doc(db, 'announcements', REAL_ONLY_MODE_DOC_ID);
  const existing = await getDoc(ref);
  if (!enable && !existing.exists()) return;

  const payload = {
    title: 'REAL_ONLY_MODE_CONFIG',
    message: enable
      ? 'All demo/seed items hidden globally; 100% real user mode active.'
      : 'Progressive 1-by-1 seed replacement mode active.',
    urgency: 'INFO' as const,
    active: enable,
    updatedByUid: user.uid,
    createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `announcements/${REAL_ONLY_MODE_DOC_ID}`);
  }
}

/**
 * Automatically purges ONLY fake, seed, demo, or unverified test records from Cloud Firestore
 * while strictly keeping the Super Owner and all genuine registered real users intact!
 */
export async function ownerPurgeFakeCloudRecordsOnlyInFirestore(): Promise<{
  deletedDonors: number;
  deletedRequests: number;
  deletedMessages: number;
  deletedGratitude: number;
}> {
  const user = await ensureValidAuthSession();
  if (!user || !isBootstrappedAdminUser(user)) {
    throw new Error('OWNER_ONLY');
  }

  let deletedDonors = 0;
  let deletedRequests = 0;
  let deletedMessages = 0;
  let deletedGratitude = 0;

  const donorsSnap = await getDocs(query(collection(db, 'donors'), where('isPublic', '==', true)));
  for (const d of donorsSnap.docs) {
    const data = d.data();
    if (data.ownerUid === user.uid) continue;
    const isFakeDoc =
      isFakeIdentifier(d.id) ||
      isFakePersonName(String(data.name || '')) ||
      !data.ownerUid ||
      String(data.idCardNumber || '').toUpperCase().includes('TEST') ||
      String(data.idCardNumber || '').toUpperCase().includes('FAKE') ||
      String(data.idCardNumber || '').toUpperCase().includes('DEMO');
    if (isFakeDoc) {
      await deleteDoc(doc(db, 'donors', d.id));
      deletedDonors += 1;
    }
  }

  const reqSnap = await getDocs(query(collection(db, 'requests'), where('isPublic', '==', true)));
  const sortedReqs = [...reqSnap.docs].sort((a, b) => {
    const ta = a.data().createdAt instanceof Timestamp ? a.data().createdAt.toMillis() : 0;
    const tb = b.data().createdAt instanceof Timestamp ? b.data().createdAt.toMillis() : 0;
    return tb - ta;
  });
  const seenActiveSigs = new Set<string>();
  for (const r of sortedReqs) {
    const data = r.data();
    const sig = `${String(data.patientName || '').trim().toLowerCase()}|${String(data.hospitalName || '').trim().toLowerCase()}|${String(data.bloodGroup || '')}`;
    const isDuplicateActive = data.status === 'ACTIVE' && seenActiveSigs.has(sig);
    if (data.status === 'ACTIVE') seenActiveSigs.add(sig);

    const isFakeReq =
      isFakeIdentifier(r.id) ||
      isFakePersonName(String(data.patientName || '')) ||
      !data.authorUid ||
      isDuplicateActive ||
      String(data.hospitalName || '').toLowerCase().includes('test');
    if (isFakeReq) {
      await deleteDoc(doc(db, 'requests', r.id));
      deletedRequests += 1;
    }
  }

  const msgSnap = await getDocs(
    query(collection(db, 'communityMessages'), where('isPublic', '==', true))
  );
  for (const m of msgSnap.docs) {
    const data = m.data();
    if (isFakeIdentifier(m.id) || isFakePersonName(String(data.senderName || ''))) {
      await deleteDoc(doc(db, 'communityMessages', m.id));
      deletedMessages += 1;
    }
  }

  const gratSnap = await getDocs(
    query(collection(db, 'gratitudeNotes'), where('isPublic', '==', true))
  );
  for (const g of gratSnap.docs) {
    const data = g.data();
    if (
      isFakeIdentifier(g.id) ||
      data.authorUid === 'seed' ||
      isFakePersonName(String(data.donorName || ''))
    ) {
      await deleteDoc(doc(db, 'gratitudeNotes', g.id));
      deletedGratitude += 1;
    }
  }

  return { deletedDonors, deletedRequests, deletedMessages, deletedGratitude };
}

/**
 * Super-Owner 1-Click Full Cloud Test Data Reset:
 * Removes old test documents in /donors (excluding the Super Owner's own donor card),
 * /requests, /communityMessages, and /gratitudeNotes when explicitly requested by Super Owner.
 */
export async function ownerPurgeTestCloudRecordsInFirestore(): Promise<{
  deletedDonors: number;
  deletedRequests: number;
  deletedMessages: number;
  deletedGratitude: number;
}> {
  const user = await ensureValidAuthSession();
  if (!user || !isBootstrappedAdminUser(user)) {
    throw new Error('OWNER_ONLY');
  }

  let deletedDonors = 0;
  let deletedRequests = 0;
  let deletedMessages = 0;
  let deletedGratitude = 0;

  const donorsSnap = await getDocs(query(collection(db, 'donors'), where('isPublic', '==', true)));
  for (const d of donorsSnap.docs) {
    const data = d.data();
    if (data.ownerUid !== user.uid) {
      await deleteDoc(doc(db, 'donors', d.id));
      deletedDonors += 1;
    }
  }

  const reqSnap = await getDocs(query(collection(db, 'requests'), where('isPublic', '==', true)));
  for (const r of reqSnap.docs) {
    await deleteDoc(doc(db, 'requests', r.id));
    deletedRequests += 1;
  }

  const msgSnap = await getDocs(
    query(collection(db, 'communityMessages'), where('isPublic', '==', true))
  );
  for (const m of msgSnap.docs) {
    await deleteDoc(doc(db, 'communityMessages', m.id));
    deletedMessages += 1;
  }

  const gratSnap = await getDocs(
    query(collection(db, 'gratitudeNotes'), where('isPublic', '==', true))
  );
  for (const g of gratSnap.docs) {
    await deleteDoc(doc(db, 'gratitudeNotes', g.id));
    deletedGratitude += 1;
  }

  return { deletedDonors, deletedRequests, deletedMessages, deletedGratitude };
}

export async function adminPublishAnnouncementInFirestore(params: {
  title: string;
  message: string;
  urgency: 'CRITICAL' | 'INFO' | 'CAMPAIGN';
}): Promise<void> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) {
    throw new Error('AUTH_REQUIRED');
  }
  const docId = 'global_megaphone';
  const ref = doc(db, 'announcements', docId);
  const existing = await getDoc(ref);

  const payload = {
    title: clampStr(params.title, 2, 120, 'জরুরি ঘোষণা'),
    message: clampStr(params.message, 2, 600, 'ব্লাডসার্চ বাংলাদেশ জরুরি বার্তা'),
    urgency: params.urgency,
    active: true,
    updatedByUid: user.uid,
    createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `announcements/${docId}`);
  }
}

export async function adminDeactivateAnnouncementInFirestore(
  announcementId = 'global_megaphone'
): Promise<void> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return;
  const ref = doc(db, 'announcements', announcementId);
  const existing = await getDoc(ref);
  if (!existing.exists()) return;
  const prev = existing.data();
  try {
    await setDoc(ref, {
      title: prev.title,
      message: prev.message,
      urgency: prev.urgency,
      active: false,
      updatedByUid: user.uid,
      createdAt: prev.createdAt,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `announcements/${announcementId}`);
  }
}

export interface ScamReportItem {
  id: string;
  reporterUid: string;
  reporterName: string;
  suspectPhone: string;
  suspectName: string;
  reason: string;
  status: 'OPEN' | 'BLOCKED' | 'DISMISSED';
  createdAtLabel: string;
}

export async function submitScamReportInFirestore(params: {
  suspectPhone: string;
  suspectName: string;
  reason: string;
}): Promise<{ syncedToCloud: boolean }> {
  const guard = checkActionCooldownGuard('SCAM_REPORT', 8000);
  if (!guard.allowed) {
    throw new Error(`অনুগ্রহ করে ${guard.waitSeconds} সেকেন্ড অপেক্ষা করে রিপোর্ট পাঠান।`);
  }

  const cleanPhone = clampStr(params.suspectPhone.trim(), 4, 24, 'Unknown');
  const cleanName = clampStr(params.suspectName.trim(), 1, 80, 'সন্দেহভাজন নম্বর');
  const cleanReason = clampStr(
    params.reason.trim(),
    4,
    400,
    'রক্ত দেওয়ার আগে বিকাশ/নগদে গাড়িভাড়া বা টাকা দাবি করেছে'
  );

  // Always save locally as well so local scam warnings work immediately
  try {
    const raw = localStorage.getItem('bloodsearch_local_scam_reports');
    const prev = raw ? JSON.parse(raw) : [];
    const localItem: ScamReportItem = {
      id: `scam_${Date.now()}`,
      reporterUid: auth.currentUser?.uid || 'local',
      reporterName: auth.currentUser?.displayName || 'সচেতন ব্যবহারকারী',
      suspectPhone: cleanPhone,
      suspectName: cleanName,
      reason: cleanReason,
      status: 'OPEN',
      createdAtLabel: 'এইমাত্র',
    };
    localStorage.setItem(
      'bloodsearch_local_scam_reports',
      JSON.stringify([localItem, ...(Array.isArray(prev) ? prev : [])].slice(0, 40))
    );
  } catch {}

  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) {
    return { syncedToCloud: false };
  }
  await ensureUserAutoSyncedInFirestore(user).catch(() => null);

  const reportId = `scam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  try {
    await setDoc(doc(db, 'scamReports', reportId), {
      reporterUid: user.uid,
      reporterName: clampStr(user.displayName || user.email?.split('@')[0], 2, 80, 'Verified User'),
      suspectPhone: cleanPhone,
      suspectName: cleanName,
      reason: cleanReason,
      status: 'OPEN',
      adminQueryKey: 'BSBD_SCAM',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { syncedToCloud: true };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `scamReports/${reportId}`);
  }
}

export function subscribeAdminScamReports(
  onData: (reports: ScamReportItem[]) => void
): () => void {
  return attachSnapshotAfterBoot(() => {
    const user = auth.currentUser;
    if (!user) {
      onData([]);
      return () => {};
    }
    const q = query(collection(db, 'scamReports'), where('adminQueryKey', '==', 'BSBD_SCAM'));
    return onSnapshot(
      q,
      (snap) => {
        const list: ScamReportItem[] = snap.docs.map((d) => {
          const data = d.data();
          const t = formatChatTimestamp(data.createdAt);
          return {
            id: d.id,
            reporterUid: String(data.reporterUid || ''),
            reporterName: String(data.reporterName || 'User'),
            suspectPhone: String(data.suspectPhone || ''),
            suspectName: String(data.suspectName || ''),
            reason: String(data.reason || ''),
            status:
              data.status === 'BLOCKED' || data.status === 'DISMISSED' ? data.status : 'OPEN',
            createdAtLabel: t.label,
          };
        });
        onData(list);
      },
      (error) => {
        try {
          const raw = localStorage.getItem('bloodsearch_local_scam_reports');
          onData(raw ? JSON.parse(raw) : []);
        } catch {
          onData([]);
        }
        handleFirestoreError(error, OperationType.LIST, 'scamReports');
      }
    );
  });
}

export async function adminUpdateScamReportStatusInFirestore(
  reportId: string,
  status: 'OPEN' | 'BLOCKED' | 'DISMISSED'
): Promise<void> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return;
  const ref = doc(db, 'scamReports', reportId);
  const existing = await getDoc(ref);
  if (!existing.exists()) return;
  const prev = existing.data();
  try {
    await setDoc(ref, {
      ...prev,
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `scamReports/${reportId}`);
  }
}

export async function adminDeleteScamReportInFirestore(reportId: string): Promise<void> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return;
  try {
    await deleteDoc(doc(db, 'scamReports', reportId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `scamReports/${reportId}`);
  }
}

export interface GratitudeNoteItem {
  id: string;
  authorUid: string;
  authorName: string;
  donorName: string;
  bloodGroup: BloodGroup;
  hospitalName: string;
  message: string;
  createdAtMs: number;
  timeLabel: string;
}

const SEED_GRATITUDE_NOTES: GratitudeNoteItem[] = [];

export function subscribePublicGratitudeNotes(
  onData: (notes: GratitudeNoteItem[]) => void
): () => void {
  onData(isGlobalRealOnlyModeActive() ? [] : SEED_GRATITUDE_NOTES);
  return attachSnapshotAfterBoot(() => {
    const q = query(collection(db, 'gratitudeNotes'), where('isPublic', '==', true));
    return onSnapshot(
      q,
      (snap) => {
        const cloudList: GratitudeNoteItem[] = snap.docs.map((d) => {
          const data = d.data();
          const t = formatChatTimestamp(data.createdAt);
          return {
            id: d.id,
            authorUid: String(data.authorUid || ''),
            authorName: String(data.authorName || 'রোগীর স্বজন'),
            donorName: String(data.donorName || 'স্বেচ্ছাসেবী রক্তদাতা'),
            bloodGroup: (data.bloodGroup as BloodGroup) || 'O+',
            hospitalName: String(data.hospitalName || 'হাসপাতাল'),
            message: String(data.message || ''),
            createdAtMs: t.ms || Date.now(),
            timeLabel: t.label,
          };
        });
        cloudList.sort((a, b) => b.createdAtMs - a.createdAtMs);
        const remainingSeeds = isGlobalRealOnlyModeActive()
          ? []
          : SEED_GRATITUDE_NOTES.slice(cloudList.length);
        onData([...cloudList, ...remainingSeeds]);
      },
      (error) => {
        onData(isGlobalRealOnlyModeActive() ? [] : SEED_GRATITUDE_NOTES);
        handleFirestoreError(error, OperationType.LIST, 'gratitudeNotes');
      }
    );
  });
}

export async function createGratitudeNoteInFirestore(params: {
  authorName: string;
  donorName: string;
  bloodGroup: BloodGroup;
  hospitalName: string;
  message: string;
}): Promise<{ syncedToCloud: boolean; note: GratitudeNoteItem }> {
  const guard = checkActionCooldownGuard('GRATITUDE_POST', 8000);
  if (!guard.allowed) {
    throw new Error(`অনুগ্রহ করে ${guard.waitSeconds} সেকেন্ড পর আবার চেষ্টা করুন।`);
  }

  const cleanAuthor = clampStr(params.authorName.trim(), 2, 80, 'রোগীর পরিবার');
  const cleanDonor = clampStr(params.donorName.trim(), 2, 80, 'রক্তযোদ্ধা');
  const cleanHospital = clampStr(params.hospitalName.trim(), 2, 120, 'হাসপাতাল ব্লাড ইউনিট');
  const cleanMsg = clampStr(params.message.trim(), 4, 500, 'আলহামদুলিল্লাহ, রক্তদাতার প্রতি কৃতজ্ঞতা!');

  const noteId = `grat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const localObj: GratitudeNoteItem = {
    id: noteId,
    authorUid: auth.currentUser?.uid || 'local',
    authorName: cleanAuthor,
    donorName: cleanDonor,
    bloodGroup: params.bloodGroup,
    hospitalName: cleanHospital,
    message: cleanMsg,
    createdAtMs: Date.now(),
    timeLabel: 'এইমাত্র',
  };

  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) {
    return { syncedToCloud: false, note: localObj };
  }
  await ensureUserAutoSyncedInFirestore(user).catch(() => null);

  try {
    await setDoc(doc(db, 'gratitudeNotes', noteId), {
      authorUid: user.uid,
      authorName: cleanAuthor,
      donorName: cleanDonor,
      bloodGroup: params.bloodGroup,
      hospitalName: cleanHospital,
      message: cleanMsg,
      isPublic: true,
      createdAt: serverTimestamp(),
    });
    return { syncedToCloud: true, note: { ...localObj, authorUid: user.uid } };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `gratitudeNotes/${noteId}`);
  }
}

// ============================================================================
// 10B. LIVE DONOR ON-THE-WAY TRACKING (/liveDonorTrips/{requestId__donorUid})
// ============================================================================
function parseLiveDonorTripDoc(id: string, x: Record<string, any>): LiveDonorTrip {
  const createdAtMs =
    x.createdAt instanceof Timestamp ? x.createdAt.toMillis() : Date.now();
  const updatedAtMs =
    x.updatedAt instanceof Timestamp ? x.updatedAt.toMillis() : createdAtMs;
  const rawStatus = String(x.tripStatus || 'ON_THE_WAY');
  const tripStatus: LiveDonorTripStatus =
    rawStatus === 'ARRIVED' || rawStatus === 'COMPLETED' || rawStatus === 'CANCELLED'
      ? rawStatus
      : 'ON_THE_WAY';

  return {
    id,
    requestId: String(x.requestId || ''),
    seekerUid: String(x.seekerUid || ''),
    donorUid: String(x.donorUid || ''),
    donorName: String(x.donorName || 'Voluntary Donor'),
    bloodGroup: (x.bloodGroup as BloodGroup) || 'O+',
    responderPhone: String(x.responderPhone || ''),
    hospitalName: String(x.hospitalName || ''),
    district: String(x.district || 'dhaka'),
    lat: clampNum(Number(x.lat), 20.0, 27.0, 23.7465),
    lng: clampNum(Number(x.lng), 87.5, 93.0, 90.389),
    hospitalLat: clampNum(Number(x.hospitalLat), 20.0, 27.0, 23.7465),
    hospitalLng: clampNum(Number(x.hospitalLng), 87.5, 93.0, 90.389),
    distanceKm: clampNum(Number(x.distanceKm), 0, 1000, 1.5),
    etaMinutes: Math.round(clampNum(Number(x.etaMinutes), 1, 1440, 15)),
    areaLabel: String(x.areaLabel || x.district || 'Dhaka'),
    tripStatus,
    createdAtMs,
    updatedAtMs,
  };
}

export async function upsertLiveDonorTripInFirestore(params: {
  requestId: string;
  donorName: string;
  bloodGroup: BloodGroup;
  responderPhone?: string;
  hospitalName: string;
  district: string;
  lat: number;
  lng: number;
  hospitalLat: number;
  hospitalLng: number;
  distanceKm: number;
  etaMinutes: number;
  areaLabel: string;
  tripStatus?: LiveDonorTripStatus;
}): Promise<{ ok: boolean; tripId?: string; reason?: string }> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) {
    return { ok: false, reason: 'AUTH_REQUIRED' };
  }

  await ensureUserAutoSyncedInFirestore(user);

  const safeReqId = params.requestId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  if (!safeReqId) {
    return { ok: false, reason: 'INVALID_REQUEST_ID' };
  }

  const reqRef = doc(db, 'requests', safeReqId);
  let reqSnap;
  try {
    reqSnap = await getDoc(reqRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `requests/${safeReqId}`);
  }

  if (!reqSnap || !reqSnap.exists()) {
    return { ok: false, reason: 'LOCAL_OR_INACTIVE' };
  }

  const reqData = reqSnap.data();
  const seekerUid = String(reqData.authorUid || '').trim();
  if (
    !seekerUid ||
    seekerUid === user.uid ||
    (reqData.status !== 'ACTIVE' && reqData.status !== 'FULFILLED')
  ) {
    return { ok: false, reason: 'LOCAL_OR_INACTIVE' };
  }

  const validGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const cleanBloodGroup: BloodGroup = validGroups.includes(params.bloodGroup)
    ? params.bloodGroup
    : validGroups.includes(reqData.bloodGroup)
      ? reqData.bloodGroup
      : 'O+';

  const cleanDonorName = clampStr(
    params.donorName,
    2,
    80,
    user.displayName || 'Voluntary Donor'
  );
  const rawCleanedTripPhone = normalizeAsciiDigits(params.responderPhone || '')
    .replace(/[^0-9+\-\s()]/g, '')
    .trim()
    .slice(0, 24);
  const cleanPhone = rawCleanedTripPhone.length >= 6 ? rawCleanedTripPhone : '';
  const cleanHospital = clampStr(
    params.hospitalName || reqData.hospitalName,
    2,
    120,
    'Hospital Emergency'
  );
  const cleanDistrict = clampStr(
    params.district || reqData.district,
    2,
    40,
    'dhaka'
  );
  const cleanLat = Number(clampNum(params.lat, 20.0, 27.0, 23.7465).toFixed(5));
  const cleanLng = Number(clampNum(params.lng, 87.5, 93.0, 90.389).toFixed(5));
  const cleanHospLat = Number(
    clampNum(params.hospitalLat, 20.0, 27.0, 23.7465).toFixed(5)
  );
  const cleanHospLng = Number(
    clampNum(params.hospitalLng, 87.5, 93.0, 90.389).toFixed(5)
  );
  const cleanDistKm = Number(clampNum(params.distanceKm, 0, 1000, 1.5).toFixed(1));
  const cleanEtaMin = Math.round(clampNum(params.etaMinutes, 1, 1440, 15));
  const cleanArea = clampStr(params.areaLabel, 2, 80, cleanDistrict);
  const desiredStatus: LiveDonorTripStatus = params.tripStatus || 'ON_THE_WAY';

  const tripId = `${safeReqId}__${user.uid}`;
  const tripRef = doc(db, 'liveDonorTrips', tripId);

  try {
    const existingSnap = await getDoc(tripRef);

    if (existingSnap.exists()) {
      const prev = existingSnap.data();
      const prevTerminal =
        prev.tripStatus === 'COMPLETED' || prev.tripStatus === 'CANCELLED';

      if (prevTerminal) {
        if (desiredStatus !== 'ON_THE_WAY') {
          return { ok: true, tripId };
        }
        await deleteDoc(tripRef);
      } else {
        await setDoc(tripRef, {
          requestId: prev.requestId,
          seekerUid: prev.seekerUid,
          donorUid: prev.donorUid,
          bloodGroup: prev.bloodGroup,
          hospitalName: prev.hospitalName,
          district: prev.district,
          hospitalLat: prev.hospitalLat,
          hospitalLng: prev.hospitalLng,
          createdAt: prev.createdAt,
          donorName: cleanDonorName,
          responderPhone: cleanPhone || prev.responderPhone || '',
          lat: cleanLat,
          lng: cleanLng,
          distanceKm: cleanDistKm,
          etaMinutes: cleanEtaMin,
          areaLabel: cleanArea,
          tripStatus: desiredStatus,
          updatedAt: serverTimestamp(),
        });
        return { ok: true, tripId };
      }
    }

    await setDoc(tripRef, {
      requestId: safeReqId,
      seekerUid,
      donorUid: user.uid,
      donorName: cleanDonorName,
      bloodGroup: cleanBloodGroup,
      responderPhone: cleanPhone,
      hospitalName: cleanHospital,
      district: cleanDistrict,
      lat: cleanLat,
      lng: cleanLng,
      hospitalLat: cleanHospLat,
      hospitalLng: cleanHospLng,
      distanceKm: cleanDistKm,
      etaMinutes: cleanEtaMin,
      areaLabel: cleanArea,
      tripStatus: 'ON_THE_WAY',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ok: true, tripId };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `liveDonorTrips/${tripId}`);
    return { ok: false, reason: 'FIRESTORE_ERROR' };
  }
}

export async function updateLiveDonorTripStatusInFirestore(
  tripId: string,
  nextStatus: LiveDonorTripStatus
): Promise<boolean> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return false;

  const safeTripId = tripId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  if (!safeTripId) return false;
  const tripRef = doc(db, 'liveDonorTrips', safeTripId);

  try {
    const snap = await getDoc(tripRef);
    if (!snap.exists()) return false;
    const prev = snap.data();

    if (prev.tripStatus === 'COMPLETED' || prev.tripStatus === 'CANCELLED') {
      return true;
    }

    if (prev.donorUid === user.uid) {
      await setDoc(tripRef, {
        ...prev,
        tripStatus: nextStatus,
        updatedAt: serverTimestamp(),
      });
      return true;
    }

    if (
      prev.seekerUid === user.uid &&
      (nextStatus === 'COMPLETED' || nextStatus === 'CANCELLED')
    ) {
      await setDoc(tripRef, {
        ...prev,
        tripStatus: nextStatus,
        updatedAt: serverTimestamp(),
      });
      return true;
    }

    return false;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `liveDonorTrips/${safeTripId}`);
    return false;
  }
}

export function subscribeLiveTripsForSeeker(
  seekerUid: string,
  onData: (trips: LiveDonorTrip[]) => void
): () => void {
  return attachSnapshotAfterBoot(() => {
    const q = query(
      collection(db, 'liveDonorTrips'),
      where('seekerUid', '==', seekerUid)
    );
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => parseLiveDonorTripDoc(d.id, d.data()));
        list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
        onData(list);
      },
      (error) => {
        if (auth.currentUser?.uid === seekerUid) {
          try {
            handleFirestoreError(error, OperationType.LIST, 'liveDonorTrips');
          } catch {}
        }
        onData([]);
      }
    );
  });
}

export function subscribeLiveTripsForDonor(
  donorUid: string,
  onData: (trips: LiveDonorTrip[]) => void
): () => void {
  return attachSnapshotAfterBoot(() => {
    const q = query(
      collection(db, 'liveDonorTrips'),
      where('donorUid', '==', donorUid)
    );
    return onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => parseLiveDonorTripDoc(d.id, d.data()));
        list.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
        onData(list);
      },
      (error) => {
        if (auth.currentUser?.uid === donorUid) {
          try {
            handleFirestoreError(error, OperationType.LIST, 'liveDonorTrips');
          } catch {}
        }
        onData([]);
      }
    );
  });
}

// ============================================================================
// 11. SMART DATABASE ARCHITECTURE INSPECTOR, LIVE PENETRATION TEST & HYGIENE
// ============================================================================
export interface DatabaseCollectionMeta {
  id: string;
  path: string;
  titleBn: string;
  titleEn: string;
  tier: 'PRIVATE_PII' | 'OWNER_VAULT' | 'ADMIN_ONLY' | 'PUBLIC_MASKED' | 'PARTICIPANT_LOCKED';
  tierLabelBn: string;
  tierLabelEn: string;
  fieldsSummary: string;
  smartBehaviorBn: string;
  smartBehaviorEn: string;
}

export const DATABASE_COLLECTION_ARCHITECTURES: DatabaseCollectionMeta[] = [
  {
    id: 'users',
    path: '/users/{userId}',
    titleBn: 'প্রাইভেট ইউজার ও PII ভল্ট',
    titleEn: 'Private User & PII Vault',
    tier: 'PRIVATE_PII',
    tierLabelBn: '🔒 প্রাইভেট PII (List সম্পূর্ণ বন্ধ)',
    tierLabelEn: '🔒 Strict Private PII (No List)',
    fieldsSummary: 'uid, name, email, phone, whatsappPhone, facebookUrl, bloodGroup, panelType',
    smartBehaviorBn:
      'আসল মোবাইল নম্বর, ইমেইল ও WhatsApp এখানে আলাদা করে লক থাকে। অন্য কোনো সাধারণ ইউজার বা স্ক্র্যাপার কখনোই অন্যের ডকুমেন্ট বা পুরো তালিকা পড়তে পারে না।',
    smartBehaviorEn:
      'Isolates raw phone, email & WhatsApp. Bulk listing is unconditionally denied (`allow list: if false`).',
  },
  {
    id: 'donors',
    path: '/donors/{donorId}',
    titleBn: 'পাবলিক ডোনার ডিরেক্টরি (মাস্কড)',
    titleEn: 'Public Donor Directory (Masked)',
    tier: 'PUBLIC_MASKED',
    tierLabelBn: '🌐 পাবলিক সার্চ (নম্বর মাস্কড **)',
    tierLabelEn: '🌐 Public Search (Masked Phone)',
    fieldsSummary: 'ownerUid, name, bloodGroup, division, district, upazila, maskedPhone, available',
    smartBehaviorBn:
      '১ অ্যাকাউন্ট = ১ ডোনার কার্ড (`donorId == uid`), নম্বর অবশ্যই `**` দিয়ে মাস্কড থাকে এবং রক্তদানের ৯০ দিন পূর্ণ হলে অটোমেটিক আবার "প্রস্তুত" হয়ে যায়।',
    smartBehaviorEn:
      'Enforces 1-UID-1-Card anti-Sybil lock, mandatory `**` phone masking, and smart 90-day medical recovery unlock.',
  },
  {
    id: 'donorDirectContacts',
    path: '/donorDirectContacts/{donorId}',
    titleBn: 'কনসেন্ট-লকড ডিরেক্ট কল/WhatsApp ভল্ট',
    titleEn: 'Consent-Gated Direct Contact Vault',
    tier: 'PRIVATE_PII',
    tierLabelBn: '🔒 শুধু ডোনার অপ্ট-ইন করলে গেট খোলে (List নিষিদ্ধ)',
    tierLabelEn: '🔒 Consent Opt-In Get Only (No List)',
    fieldsSummary: 'ownerUid, phone, whatsappPhone, shareDirectContact, contactVisibility, availabilityStatus',
    smartBehaviorBn:
      'ডোনার নিজে সম্মতি (`shareDirectContact == true`) দিলে রক্তপ্রার্থী সরাসরি কল/WhatsApp করতে পারেন, কিন্তু বাল্ক স্ক্র্যাপিং (`list`) সম্পূর্ণ নিষিদ্ধ এবং DND মোডে অটো-লক হয়ে যায়।',
    smartBehaviorEn:
      'Enables zero-friction direct Call/WhatsApp ONLY when donor explicitly opts in and is not in DND; bulk `list` is unconditionally denied.',
  },
  {
    id: 'contactRequests',
    path: '/contactRequests/{seekerUid__donorUid}',
    titleBn: 'প্রাইভেট ডোনার কনসেন্ট রিকোয়েস্ট',
    titleEn: 'Consent-Based Contact Requests',
    tier: 'PARTICIPANT_LOCKED',
    tierLabelBn: 'রক্তপ্রার্থী ও ডোনার ১-টু-১ লক',
    tierLabelEn: 'Seeker-Donor Pair Locked',
    fieldsSummary: 'seekerUid, donorUid, bloodGroupNeeded, hospitalName, urgency, status, approvedPhone',
    smartBehaviorBn:
      'যারা সরাসরি নম্বর প্রকাশ করেন না (`REQUEST_ONLY`), তাদের কাছে ১-ক্লিকে কনসেন্ট রিকোয়েস্ট যায়; ডোনার অনুমোদন করলেই কেবল ঐ প্রার্থীর জন্য নম্বর আনলক হয়।',
    smartBehaviorEn:
      'Allows seekers to request contact consent from private donors without exposing PII until explicitly approved.',
  },
  {
    id: 'requestAlerts',
    path: '/requestAlerts/{requestId__donorUid}',
    titleBn: 'মাল্টি-ডোনার কনকারেন্ট SOS অ্যালার্ট',
    titleEn: 'Concurrent Multi-Donor SOS Alerts',
    tier: 'PARTICIPANT_LOCKED',
    tierLabelBn: 'ডিটারমিনিস্টিক অ্যান্টি-স্প্যাম ফ্যান-আউট',
    tierLabelEn: 'Deterministic Anti-Spam Fan-Out',
    fieldsSummary: 'requestId, authorUid, donorUid, escalationLevel, deliveryState, responderPhone',
    smartBehaviorBn:
      'একসাথে একাধিক ম্যাচিং ডোনারকে রিয়েল-টাইম অ্যালার্ট পাঠায়, ডুপ্লিকেট স্প্যাম আটকায় এবং রিকোয়েস্ট Fulfilled/Cancelled হলে সাথে সাথে অ্যালার্ট বন্ধ করে দেয়।',
    smartBehaviorEn:
      'Concurrent multi-donor alert dispatch with deterministic IDs (`requestId__donorUid`) and immediate stop on cancel/fulfill.',
  },
  {
    id: 'liveDonorTrips',
    path: '/liveDonorTrips/{requestId__donorUid}',
    titleBn: 'লাইভ ডোনার অন-দ্য-ওয়ে ট্র্যাকিং (Uber/Pathao রুট)',
    titleEn: 'Pair-Isolated Live Donor On-the-Way Tracking',
    tier: 'PARTICIPANT_LOCKED',
    tierLabelBn: 'রোগী ও ডোনার ১-টু-১ লাইভ রুট লক',
    tierLabelEn: 'Seeker-Donor Live GPS Pair Lock',
    fieldsSummary: 'requestId, seekerUid, donorUid, lat, lng, hospitalLat, hospitalLng, distanceKm, etaMinutes, tripStatus',
    smartBehaviorBn:
      'ডোনার "আমি রক্ত দিতে আসছি" দিলে কেবল রোগীর পরিবার ও ঐ ডোনার লাইভ ম্যাপে দূরত্ব ও পৌঁছানোর সময় দেখতে পান; তৃতীয় পক্ষ কখনোই ট্র্যাক করতে পারে না।',
    smartBehaviorEn:
      'Pair-isolated real-time GPS & ETA sharing between volunteer donor and seeker; blocks 3rd-party stalking and locks terminal states.',
  },
  {
    id: 'requests',
    path: '/requests/{requestId}',
    titleBn: 'জরুরি রক্তের আবেদন (SOS)',
    titleEn: 'Emergency SOS Blood Requests',
    tier: 'PUBLIC_MASKED',
    tierLabelBn: '🚨 ভেরিফাইড রাইট + টার্মিনাল লক',
    tierLabelEn: '🚨 Verified Write + Terminal Lock',
    fieldsSummary: 'authorUid, patientName, bloodGroup, unitsNeeded, unitsCollected, hospitalName, status',
    smartBehaviorBn:
      'নিবন্ধিত ভেরিফাইড ইউজার ছাড়া কেউ পোস্ট করতে পারে না। রক্তের ব্যাগ পূর্ণ (`FULFILLED`) হলে কার্ড স্বয়ংক্রিয়ভাবে লক হয়ে যায়।',
    smartBehaviorEn:
      'Requires registered `/users/{uid}` profile, blocks self-pledge spoofing, and locks terminal `FULFILLED` states.',
  },
  {
    id: 'bloodStock',
    path: '/bloodStock/{groupId}',
    titleBn: 'কেন্দ্রীয় ব্লাড ব্যাংক ইনভেন্টরি',
    titleEn: 'Central Blood Bank Stock',
    tier: 'ADMIN_ONLY',
    tierLabelBn: '🛡️ শুধুমাত্র অ্যাডমিন আপডেট',
    tierLabelEn: '🛡️ Admin-Only Mutation',
    fieldsSummary: 'bloodGroup, unitsInStock, updatedByUid, updatedAt',
    smartBehaviorBn:
      'সকল ৮টি গ্রুপের (`A+` থেকে `O-`) লাইভ ইউনিট সংখ্যা সংরক্ষণ করে; শুধুমাত্র ভেরিফাইড অ্যাডমিন স্টক পরিবর্তন করতে পারেন।',
    smartBehaviorEn:
      'Real-time blood bag inventory across all 8 ABO/Rh groups; strictly writable by verified Admins.',
  },
  {
    id: 'directChats',
    path: '/directChats/{chatId}',
    titleBn: '১-টু-১ প্রাইভেট ইনবক্স রুম',
    titleEn: '1-to-1 Private Chat Rooms',
    tier: 'PARTICIPANT_LOCKED',
    tierLabelBn: 'শুধু ২ জন চ্যাট অংশগ্রহণকারী',
    tierLabelEn: 'Participant-Pair Locked',
    fieldsSummary: 'participantOneUid, participantTwoUid, lastMessage, lastSenderUid, updatedAt',
    smartBehaviorBn:
      'ডিটারমিনিস্টিক `uidA__uidB` রুম লক—রোগী ও রক্তদাতা ছাড়া তৃতীয় কোনো ব্যক্তি রুমের অস্তিত্বও দেখতে পান না।',
    smartBehaviorEn:
      'Deterministic `uidA__uidB` room lock isolating private coordination strictly to the two participants.',
  },
  {
    id: 'directChatMessages',
    path: '/directChats/{chatId}/messages/{messageId}',
    titleBn: 'প্রাইভেট ইনবক্স মেসেজ ও প্রেসক্রিপশন ছবি',
    titleEn: 'Private Inbox Messages Subcollection',
    tier: 'PARTICIPANT_LOCKED',
    tierLabelBn: 'মাস্টার-গেট প্যারেন্ট ভেরিফাইড',
    tierLabelEn: 'Master-Gate Parent Verified',
    fieldsSummary: 'chatId, senderUid, participantOneUid, participantTwoUid, text, attachmentUrl',
    smartBehaviorBn:
      'প্রতিটি মেসেজ পড়া ও লেখার সময় প্যারেন্ট রুম যাচাই (`get`/`getAfter`), `isSafeMediaUri` এবং অ্যান্টি-XSS শিল্ড কার্যকর থাকে।',
    smartBehaviorEn:
      'Enforces relational Master-Gate parent verification, safe HTTPS/image media URIs, and immutable history.',
  },
  {
    id: 'communityMessages',
    path: '/communityMessages/{messageId}',
    titleBn: 'কমিউনিটি রক্তযোদ্ধা লাইভ রুম',
    titleEn: 'Community Blood Warriors Stream',
    tier: 'PUBLIC_MASKED',
    tierLabelBn: '💬 অ্যান্টি-XSS ফিল্টারড চ্যাট',
    tierLabelEn: '💬 Anti-XSS Filtered Stream',
    fieldsSummary: 'senderUid, senderName, senderBloodGroup, text, attachmentUrl, createdAt',
    smartBehaviorBn:
      'সার্ভার কার্নেলে `<script>` ও ক্ষতিকর কোড অটো-ব্লক করা হয় এবং মেসেজ পাঠানোর পর কেউ তা টেম্পার (`update: false`) করতে পারে না।',
    smartBehaviorEn:
      'Kernel-enforced `isSafeText` XSS firewall and immutable append-only message history.',
  },
  {
    id: 'admins',
    path: '/admins/{userId}',
    titleBn: 'ভেরিফাইড অ্যাডমিন রোস্টার',
    titleEn: 'Verified Admin Roster',
    tier: 'OWNER_VAULT',
    tierLabelBn: '👑 সুপার ওনার নিয়ন্ত্রিত',
    tierLabelEn: '👑 Super-Owner Controlled',
    fieldsSummary: 'uid, name, idCardNumber, district, secretProofHash, registryKey',
    smartBehaviorBn:
      'শুধুমাত্র সুপার ওনার (`shamimrakib015@gmail.com`) অথবা ওনারের তৈরি সক্রিয় SHA-256 ইনভাইট কোড থাকলেই এখানে নাম যুক্ত হয়।',
    smartBehaviorEn:
      'Zero client secrets; requires server-verified `/adminInviteLocks/{proofHash}` or Super Owner JWT.',
  },
  {
    id: 'adminInviteLocks',
    path: '/adminInviteLocks/{proofHash}',
    titleBn: 'ওনার SHA-256 সিক্রেট ইনভাইট ভল্ট',
    titleEn: 'Owner SHA-256 Invite Lock Vault',
    tier: 'OWNER_VAULT',
    tierLabelBn: '👑 একচেটিয়া সুপার ওনার ভল্ট',
    tierLabelEn: '👑 Exclusive Owner Vault',
    fieldsSummary: 'proofHash (64-hex SHA256), label, ownerUid, active',
    smartBehaviorBn:
      'আসল কোড কখনোই ডাটাবেসে বা কোডে থাকে না—শুধু ৬৪ অক্ষরের Salted SHA-256 হ্যাশ থাকে, যা ওনার ১-ক্লিকে বন্ধ বা ডিলিট করতে পারেন।',
    smartBehaviorEn:
      'Stores only salted 64-char SHA-256 digests; list/write/delete locked strictly to `shamimrakib015@gmail.com`.',
  },
  {
    id: 'scamReports',
    path: '/scamReports/{reportId}',
    titleBn: 'অ্যান্টি-বিকাশ/দালাল স্ক্যাম ভল্ট',
    titleEn: 'Anti-bKash/Broker Scam Vault',
    tier: 'ADMIN_ONLY',
    tierLabelBn: '🛡️ অ্যাডমিন মডারেশন ভল্ট',
    tierLabelEn: '🛡️ Admin Moderation Vault',
    fieldsSummary: 'reporterUid, suspectPhone, suspectName, reason, status',
    smartBehaviorBn:
      'অগ্রিম গাড়িভাড়া বা বিকাশ প্রতারকের রিপোর্ট জমা হলে তা সাধারণ মানুষের আড়ালে সরাসরি অ্যাডমিন মডারেশন ভল্টে জমা হয়।',
    smartBehaviorEn:
      'Verified users can file reports (`OPEN`), while listing and blocking are restricted strictly to Admins.',
  },
  {
    id: 'announcements',
    path: '/announcements/{announcementId}',
    titleBn: 'লাইভ মেগাফোন ও সিস্টেম কনফিগ',
    titleEn: 'Live Megaphone & Global Config',
    tier: 'ADMIN_ONLY',
    tierLabelBn: '📢 অ্যাডমিন ব্রডকাস্ট',
    tierLabelEn: '📢 Admin Broadcast',
    fieldsSummary: 'title, message, urgency, active, updatedByUid',
    smartBehaviorBn:
      'অ্যাডমিন প্যানেল থেকে জরুরি ঘোষণা বা "১০০% রিয়েল ইউজার মোড" অন করলে মুহূর্তেই সব ডিভাইসে সিঙ্ক হয়।',
    smartBehaviorEn:
      'Powers instant nationwide emergency banners and global 100% real-user-only mode flag.',
  },
  {
    id: 'gratitudeNotes',
    path: '/gratitudeNotes/{noteId}',
    titleBn: 'রোগীর পরিবারের দোয়া ও কৃতজ্ঞতা দেয়াল',
    titleEn: 'Patient Family Gratitude Wall',
    tier: 'PUBLIC_MASKED',
    tierLabelBn: '🤲 ভেরিফাইড ইমিউটেবল নোট',
    tierLabelEn: '🤲 Verified Immutable Wall',
    fieldsSummary: 'authorUid, authorName, donorName, bloodGroup, hospitalName, message',
    smartBehaviorBn:
      'জীবন বাঁচানোর পর রোগীর স্বজনদের দোয়া সংরক্ষিত থাকে (কোনো গোপন ফোন নম্বর ছাড়া)।',
    smartBehaviorEn:
      'Append-only public gratitude notes with zero PII exposure and anti-XSS text validation.',
  },
];

export interface SecurityPenetrationProbeResult {
  id: string;
  nameBn: string;
  nameEn: string;
  attackVector: string;
  blockedAsExpected: boolean;
  serverVerdict: string;
}

export interface SmartDatabaseHealthReport {
  checkedAt: string;
  latencyMs: number;
  online: boolean;
  projectId: string;
  databaseId: string;
  appCheckActive: boolean;
  counts: {
    publicDonors: number;
    publicRequests: number;
    fulfilledOrCancelledRequests: number;
    bloodStockGroups: number;
    communityMessages: number;
    gratitudeNotes: number;
  };
  probes: SecurityPenetrationProbeResult[];
}

/**
 * Runs a real, non-destructive live health & Zero-Trust penetration self-test
 * directly against Cloud Firestore so the Owner/User can visually verify protection.
 */
export async function runSmartDatabaseHealthAndSecurityAudit(): Promise<SmartDatabaseHealthReport> {
  await waitForHealthyAuthBoot();
  const t0 = performance.now();
  let online = true;

  try {
    await getDocFromServer(doc(db, 'announcements', 'global_megaphone'));
  } catch (err: any) {
    const msg = String(err?.message || '');
    if (msg.includes('client is offline')) {
      online = false;
    }
  }
  const latencyMs = Math.max(1, Math.round(performance.now() - t0));

  let publicDonors = 0;
  let publicRequests = 0;
  let fulfilledOrCancelledRequests = 0;
  let bloodStockGroups = 0;
  let communityMessages = 0;
  let gratitudeNotes = 0;

  try {
    const [dSnap, rSnap, sSnap, cSnap, gSnap] = await Promise.all([
      getDocs(query(collection(db, 'donors'), where('isPublic', '==', true))),
      getDocs(query(collection(db, 'requests'), where('isPublic', '==', true))),
      getDocs(query(collection(db, 'bloodStock'), where('unitsInStock', '>=', 0))),
      getDocs(query(collection(db, 'communityMessages'), where('isPublic', '==', true))),
      getDocs(query(collection(db, 'gratitudeNotes'), where('isPublic', '==', true))),
    ]);
    publicDonors = dSnap.size;
    publicRequests = rSnap.size;
    fulfilledOrCancelledRequests = rSnap.docs.filter((x) => x.data().status !== 'ACTIVE').length;
    bloodStockGroups = sSnap.size;
    communityMessages = cSnap.size;
    gratitudeNotes = gSnap.size;
  } catch {}

  const probes: SecurityPenetrationProbeResult[] = [];

  // Probe 1: Attempt bulk scraping of private /users collection (`allow list: if false`)
  try {
    await getDocs(collection(db, 'users'));
    probes.push({
      id: 'probe-users-list',
      nameBn: 'প্রাইভেট ইউজার ফোন নম্বর বাল্ক স্ক্র্যাপিং রোধ',
      nameEn: 'Private /users Bulk PII Scrape Shield',
      attackVector: 'LIST /users',
      blockedAsExpected: false,
      serverVerdict: 'UNEXPECTED_ALLOW',
    });
  } catch (e: any) {
    const denied =
      String(e?.code || '').includes('permission-denied') ||
      String(e?.message || '').includes('Missing or insufficient permissions');
    probes.push({
      id: 'probe-users-list',
      nameBn: 'প্রাইভেট ইউজার ফোন নম্বর বাল্ক স্ক্র্যাপিং রোধ',
      nameEn: 'Private /users Bulk PII Scrape Shield',
      attackVector: 'LIST /users',
      blockedAsExpected: denied,
      serverVerdict: denied ? 'PERMISSION_DENIED (100% সুরক্ষিত)' : 'NETWORK_GUARDED',
    });
  }

  // Probe 2: Attempt reading a private DirectChat room not belonging to caller
  try {
    await getDocFromServer(doc(db, 'directChats', 'intruderUidA__intruderUidB'));
    const amAdmin = await checkIsVerifiedAdminInFirestore(auth.currentUser);
    probes.push({
      id: 'probe-private-chat',
      nameBn: 'অন্যের প্রাইভেট ইনবক্স মেসেজ গোপনীয়তা শিল্ড',
      nameEn: 'Foreign 1-to-1 Inbox Isolation Shield',
      attackVector: 'GET /directChats/intruderUidA__intruderUidB',
      blockedAsExpected: amAdmin,
      serverVerdict: amAdmin
        ? 'ADMIN_AUDIT_AUTHORIZED (সুপার অ্যাডমিন)'
        : 'UNEXPECTED_ALLOW',
    });
  } catch (e: any) {
    const denied =
      String(e?.code || '').includes('permission-denied') ||
      String(e?.message || '').includes('Missing or insufficient permissions');
    probes.push({
      id: 'probe-private-chat',
      nameBn: 'অন্যের প্রাইভেট ইনবক্স মেসেজ গোপনীয়তা শিল্ড',
      nameEn: 'Foreign 1-to-1 Inbox Isolation Shield',
      attackVector: 'GET /directChats/intruderUidA__intruderUidB',
      blockedAsExpected: denied,
      serverVerdict: denied ? 'PERMISSION_DENIED (100% সুরক্ষিত)' : 'NETWORK_GUARDED',
    });
  }

  // Probe 3: Attempt reading catch-all unknown shadow collection (`match /{document=**}`)
  try {
    await getDocFromServer(doc(db, 'shadow_hack_probe', 'test_doc'));
    probes.push({
      id: 'probe-catchall',
      nameBn: 'অজানা শ্যাডো কালেকশন ও ডিফল্ট-ডিনাই গেট',
      nameEn: 'Global Default-Deny Catch-All Gate',
      attackVector: 'GET /shadow_hack_probe/test_doc',
      blockedAsExpected: false,
      serverVerdict: 'UNEXPECTED_ALLOW',
    });
  } catch (e: any) {
    const denied =
      String(e?.code || '').includes('permission-denied') ||
      String(e?.message || '').includes('Missing or insufficient permissions');
    probes.push({
      id: 'probe-catchall',
      nameBn: 'অজানা শ্যাডো কালেকশন ও ডিফল্ট-ডিনাই গেট',
      nameEn: 'Global Default-Deny Catch-All Gate',
      attackVector: 'GET /shadow_hack_probe/test_doc',
      blockedAsExpected: denied,
      serverVerdict: denied ? 'PERMISSION_DENIED (100% সুরক্ষিত)' : 'NETWORK_GUARDED',
    });
  }

  // Probe 4: Attempt bulk scraping of /donorDirectContacts (`allow list: if false`)
  try {
    await getDocs(collection(db, 'donorDirectContacts'));
    probes.push({
      id: 'probe-direct-contacts-list',
      nameBn: 'ডোনার ডিরেক্ট কন্টাক্ট বাল্ক স্ক্র্যাপিং রোধ',
      nameEn: 'Direct Contact Vault Bulk Scrape Shield',
      attackVector: 'LIST /donorDirectContacts',
      blockedAsExpected: false,
      serverVerdict: 'UNEXPECTED_ALLOW',
    });
  } catch (e: any) {
    const denied =
      String(e?.code || '').includes('permission-denied') ||
      String(e?.message || '').includes('Missing or insufficient permissions');
    probes.push({
      id: 'probe-direct-contacts-list',
      nameBn: 'ডোনার ডিরেক্ট কন্টাক্ট বাল্ক স্ক্র্যাপিং রোধ',
      nameEn: 'Direct Contact Vault Bulk Scrape Shield',
      attackVector: 'LIST /donorDirectContacts',
      blockedAsExpected: denied,
      serverVerdict: denied ? 'PERMISSION_DENIED (100% সুরক্ষিত)' : 'NETWORK_GUARDED',
    });
  }

  // Probe 5: Attempt unscoped bulk scraping/stalking of /liveDonorTrips GPS locations
  try {
    await getDocs(collection(db, 'liveDonorTrips'));
    probes.push({
      id: 'probe-live-trips-stalking',
      nameBn: 'তৃতীয় পক্ষের লাইভ ডোনার GPS ট্র্যাকিং রোধ',
      nameEn: 'Live Donor GPS Stalking Shield',
      attackVector: 'LIST /liveDonorTrips (unscoped)',
      blockedAsExpected: false,
      serverVerdict: 'UNEXPECTED_ALLOW',
    });
  } catch (e: any) {
    const denied =
      String(e?.code || '').includes('permission-denied') ||
      String(e?.message || '').includes('Missing or insufficient permissions');
    probes.push({
      id: 'probe-live-trips-stalking',
      nameBn: 'তৃতীয় পক্ষের লাইভ ডোনার GPS ট্র্যাকিং রোধ',
      nameEn: 'Live Donor GPS Stalking Shield',
      attackVector: 'LIST /liveDonorTrips (unscoped)',
      blockedAsExpected: denied,
      serverVerdict: denied ? 'PERMISSION_DENIED (100% সুরক্ষিত)' : 'NETWORK_GUARDED',
    });
  }

  return {
    checkedAt: new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    latencyMs,
    online,
    projectId: FIREBASE_PROJECT_ID,
    databaseId: FIRESTORE_DATABASE_ID,
    appCheckActive: IS_APP_CHECK_CONFIGURED,
    counts: {
      publicDonors,
      publicRequests,
      fulfilledOrCancelledRequests,
      bloodStockGroups,
      communityMessages,
      gratitudeNotes,
    },
    probes,
  };
}

/**
 * Smart Database Auto-Hygiene for Verified Admins:
 * Removes completed (`FULFILLED` / `CANCELLED`) SOS requests from active cloud storage
 * so emergency feeds stay ultra-fast and free-tier read quotas remain minimal.
 */
export async function adminSmartCleanupCompletedRequestsInFirestore(): Promise<number> {
  const user = await ensureValidAuthSession();
  if (!user || !isUserVerifiedForWrites(user)) return 0;
  const isAdmin = await checkIsVerifiedAdminInFirestore(user);
  if (!isAdmin) return 0;

  const snap = await getDocs(query(collection(db, 'requests'), where('isPublic', '==', true)));
  let cleaned = 0;
  for (const d of snap.docs) {
    const status = d.data().status;
    if (status === 'FULFILLED' || status === 'CANCELLED') {
      await deleteDoc(doc(db, 'requests', d.id));
      cleaned += 1;
    }
  }
  return cleaned;
}

/**
 * Ensures the 7 verified starter donor IDs and 2 active hospital blood requests
 * exist in Cloud Firestore when the Super Owner signs in, so Find Donors,
 * Requests Feed, Live Map, and Chat Users work end-to-end across all devices.
 */
export async function seedVerifiedStarterNetworkInFirestore(
  starterDonors: Donor[],
  starterRequests: BloodRequest[]
): Promise<number> {
  const user = await ensureValidAuthSession();
  if (!user || !isBootstrappedAdminUser(user)) return 0;

  let seededCount = 0;

  // Ensure global real-only flag is off so verified community cards remain visible
  try {
    await adminSetGlobalRealOnlyModeInFirestore(false);
  } catch {}

  for (const d of starterDonors) {
    const safeDonorId = d.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
    if (!safeDonorId) continue;
    try {
      const dRef = doc(db, 'donors', safeDonorId);
      const snap = await getDoc(dRef);
      const e164Phone = normalizeValidBangladeshMobileE164(d.phone);
      const safeIdCard =
        d.id.replace(/[^a-zA-Z0-9+-]/g, '-').slice(0, 36).toUpperCase() || 'BS-VERIFIED-101';

      if (!snap.exists()) {
        await setDoc(dRef, {
          ownerUid: safeDonorId,
          name: clampStr(d.name, 2, 80, 'Verified Donor'),
          bloodGroup: d.bloodGroup,
          division: clampStr(d.division, 2, 40, 'dhaka'),
          district: clampStr(d.district, 2, 40, 'dhaka'),
          upazila: clampStr(d.upazila, 2, 50, 'Dhaka'),
          maskedPhone: maskPhoneNumber(e164Phone || d.phone),
          available: d.available !== false,
          availabilityStatus: d.availabilityStatus || 'AVAILABLE',
          availabilityConfirmedAt: serverTimestamp(),
          shareDirectContact: true,
          contactVisibility: 'PUBLIC_OPT_IN',
          allowCall: true,
          allowWhatsApp: true,
          allowSms: true,
          emergencyAlertsOptIn: true,
          alertsPaused: false,
          lastDonatedDate: (d.lastDonatedDate || '').slice(0, 20),
          totalDonations: clampNum(d.totalDonations, 0, 500, 2),
          verifiedBadge: Boolean(d.verifiedBadge),
          age: clampNum(d.age, 18, 65, 26),
          gender: d.gender || 'MALE',
          weightKg: clampNum(d.weightKg, 40, 180, 65),
          hospitalAffiliation: clampStr(
            d.hospitalAffiliation,
            2,
            100,
            'Verified Voluntary Donor'
          ),
          avatar: DEFAULT_AVATAR_DATA_URI,
          idCardNumber: safeIdCard,
          panelType: 'USER',
          isPublic: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        seededCount += 1;
      }

      if (e164Phone) {
        const directRef = doc(db, 'donorDirectContacts', safeDonorId);
        const directSnap = await getDoc(directRef);
        if (!directSnap.exists()) {
          await setDoc(directRef, {
            ownerUid: safeDonorId,
            phone: e164Phone,
            whatsappPhone: e164Phone,
            shareDirectContact: true,
            contactVisibility: 'PUBLIC_OPT_IN',
            availabilityStatus: 'AVAILABLE',
            allowCall: true,
            allowWhatsApp: true,
            allowSms: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      console.warn('Starter donor sync skipped for', safeDonorId, err);
    }
  }

  for (const r of starterRequests) {
    const safeReqId = r.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
    if (!safeReqId) continue;
    try {
      const rRef = doc(db, 'requests', safeReqId);
      const rSnap = await getDoc(rRef);
      const authorId = (r.authorUid || safeReqId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
      if (!rSnap.exists()) {
        await setDoc(rRef, {
          authorUid: authorId,
          patientName: clampStr(r.patientName, 2, 80, 'Emergency Patient'),
          patientAge: clampNum(r.patientAge, 0, 120, 32),
          bloodGroup: r.bloodGroup,
          unitsNeeded: clampNum(r.unitsNeeded, 1, 20, 2),
          unitsCollected: clampNum(r.unitsCollected, 0, 20, 0),
          hospitalName: clampStr(r.hospitalName, 2, 120, 'Hospital'),
          division: clampStr(r.division, 2, 40, 'dhaka'),
          district: clampStr(r.district, 2, 40, 'dhaka'),
          upazila: clampStr(r.upazila, 2, 50, 'Dhanmondi'),
          urgency: r.urgency || 'CRITICAL',
          requiredTimeWindow: r.requiredTimeWindow || 'IMMEDIATE_2H',
          requiredDate: clampStr(r.requiredDate, 2, 30, 'Today Urgent'),
          reason: clampStr(r.reason, 2, 300, 'Emergency Blood Transfusion'),
          status: 'ACTIVE',
          lifecycleState: r.lifecycleState || 'DONORS_NOTIFIED',
          notifiedCount: clampNum(r.notifiedCount ?? 4, 0, 5000, 4),
          viewedCount: clampNum(r.viewedCount ?? 2, 0, 5000, 2),
          respondedCount: clampNum(r.respondedCount ?? 0, 0, 5000, 0),
          contactAttemptsCount: 0,
          confirmedDonorId: '',
          confirmedDonorName: '',
          escalationLevel: 0,
          searchRadiusKm: 10,
          escalationIntervalMinutes: 10,
          expiresAtMs: Date.now() + 48 * 60 * 60 * 1000,
          exchangeAllowed: true,
          isPublic: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        seededCount += 1;
      }

      const validContact = normalizeValidBangladeshMobileE164(r.contactPhone);
      if (validContact) {
        const rcRef = doc(db, 'requestDirectContacts', safeReqId);
        const rcSnap = await getDoc(rcRef);
        if (!rcSnap.exists()) {
          await setDoc(rcRef, {
            requestId: safeReqId,
            authorUid: authorId,
            contactName: clampStr(r.contactName || r.patientName, 2, 80, 'Patient Attendant'),
            contactPhone: validContact,
            shareDirectContact: true,
            status: 'ACTIVE',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      console.warn('Starter request sync skipped for', safeReqId, err);
    }
  }

  return seededCount;
}


