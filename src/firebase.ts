import { initializeApp } from 'firebase/app';
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
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
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
import { BloodGroup, BloodRequest, Donor, UserAccount } from './types';

// ============================================================================
// 1. INITIALIZE FIREBASE SDK (Iframe-Resilient Persistence + Popup Resolver)
// ============================================================================
const app = initializeApp(firebaseConfig);
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
export const FIREBASE_AUTH_PROVIDERS_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`;
export const FIREBASE_SETTINGS_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
export const FIREBASE_PROJECT_SETTINGS_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/settings/general`;
export const FIREBASE_RULES_CONSOLE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/rules`;
export const GCP_API_CREDENTIALS_URL = `https://console.cloud.google.com/apis/credentials?project=${firebaseConfig.projectId}`;

export const BOOTSTRAPPED_SUPER_ADMIN_EMAIL = 'shamimrakib015@gmail.com';

export const DEFAULT_AVATAR_DATA_URI =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23e11d48'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff'/%3E%3Cpath d='M26 102c4-19 18-30 34-30s30 11 34 30' fill='%23ffffff'/%3E%3C/svg%3E";

// ============================================================================
// 2. VALIDATE CONNECTION ON BOOT (Mandatory per Firebase Integration Skill)
// ============================================================================
async function testConnection() {
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
  const u = currentUser ?? auth.currentUser;
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

function clampStr(
  val: string | undefined | null,
  minLen: number,
  maxLen: number,
  fallback: string
): string {
  const clean = (val ?? '').trim();
  if (clean.length < minLen) return fallback.slice(0, maxLen);
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
  if (!dataUrlOrHttp.startsWith('data:image') || dataUrlOrHttp.length <= 120000) {
    return dataUrlOrHttp.slice(0, 145000);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 220;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.72);
        resolve(compressed.slice(0, 145000));
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

// ============================================================================
// 6. LIVE FIREBASE AUTH DIAGNOSTICS & REAL AUTHENTICATION METHODS
// ============================================================================
export interface LiveAuthDiagnosticReport {
  checkedAt: string;
  currentHostname: string;
  domainAuthorized: boolean;
  authorizedDomains: string[];
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
    googleOAuthReady: false,
    emailPasswordEnabled: false,
    emailLinkEnabled: false,
    phoneSmsStatus: 'UNKNOWN',
    phoneRawMessage: '',
  };

  try {
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
    code === 'auth/operation-not-allowed' ||
    code === 'auth/admin-restricted-operation' ||
    rawMsg.includes('PASSWORD_LOGIN_DISABLED') ||
    rawMsg.includes('OPERATION_NOT_ALLOWED')
  ) {
    return {
      code,
      messageBn:
        'আপনার Firebase প্রজেক্টে (fifth-receiver-v5v9p) বর্তমানে শুধু "Google Direct Sign-In" চালু আছে — কিন্তু "Phone SMS" এবং "Email/Password" অপশনটি Firebase Console থেকে এখনো অন (Enable) করা হয়নি! নিচের নীল বাটনে ক্লিক করে Firebase Console থেকে অন করুন, অথবা উপরের "Google / Gmail দিয়ে ১-ক্লিকে সরাসরি লগইন" বাটনটি চাপুন (এটি এখনই ১০০% কাজ করবে)!',
      messageEn:
        'Phone SMS / Email-Password is currently disabled in your Firebase Console (fifth-receiver-v5v9p). Enable it via the Console button below, or use 1-Click Direct Google Sign-In above right now!',
      needsConsoleProviderEnable: true,
      consoleUrl: FIREBASE_AUTH_PROVIDERS_URL,
    };
  }
  if (
    code === 'auth/billing-not-enabled' ||
    code === 'auth/quota-exceeded' ||
    rawMsg.includes('BILLING_NOT_ENABLED')
  ) {
    return {
      code,
      messageBn:
        'গুগলের নিয়ম অনুযায়ী বাংলাদেশের গ্রামীণফোন/রবি/বাংলালিংক সিমে সরাসরি অটো SMS পাঠাতে Firebase প্রজেক্টে Blaze Plan চালু থাকতে হয়। তবে একদম ফ্রিতে (০ টাকায়) টেস্ট করতে চাইলে Firebase Console -> Authentication -> Sign-in method -> Phone -> "Phone numbers for testing"-এ আপনার নম্বর (+8801...) ও ৬-ডিজিট কোড যোগ করুন, অথবা উপরের "Google / Gmail ১-ক্লিক লগইন" ব্যবহার করুন!',
      messageEn:
        'Real carrier SMS requires Firebase Blaze billing, OR add your SIM number for FREE under "Phone numbers for testing" in Firebase Console -> Phone.',
      needsConsoleProviderEnable: true,
      consoleUrl: FIREBASE_AUTH_PROVIDERS_URL,
    };
  }
  if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
    return {
      code,
      messageBn:
        'আপনার ব্রাউজার Google লগইন পপ-আপ উইন্ডোটি ব্লক করেছে! ব্রাউজারের অ্যাড্রেস বারের ডানদিকে "Popup Blocked" আইকনে ক্লিক করে "Always allow popups" অন করে আবার বাটনে চাপুন।',
      messageEn:
        'Browser blocked the Google sign-in popup! Please allow popups for this site in your browser address bar and click again.',
      needsConsoleProviderEnable: false,
      isPopupBlocked: true,
      consoleUrl: FIREBASE_AUTH_PROVIDERS_URL,
    };
  }
  if (code === 'auth/unauthorized-domain') {
    return {
      code,
      messageBn: `এই ডোমেইনটি (${window.location.hostname}) এখনো Firebase Authorized Domains তালিকায় যুক্ত নেই। নিচের লিংকে গিয়ে ডোমেইনটি যোগ করুন।`,
      messageEn: `Domain (${window.location.hostname}) is not in Firebase Authorized Domains.`,
      needsConsoleProviderEnable: true,
      consoleUrl: FIREBASE_SETTINGS_URL,
    };
  }
  if (code === 'auth/popup-closed-by-user') {
    return {
      code,
      messageBn: 'গুগল লগইন পপ-আপটি সম্পূর্ণ হওয়ার আগেই বন্ধ হয়ে গেছে। আবার ক্লিক করে আপনার Gmail অ্যাকাউন্টটির ওপর ট্যাপ করুন।',
      messageEn: 'Google sign-in popup was closed before selecting an account. Please try again.',
      needsConsoleProviderEnable: false,
      consoleUrl: FIREBASE_AUTH_PROVIDERS_URL,
    };
  }
  if (code === 'auth/invalid-phone-number') {
    return {
      code,
      messageBn: 'মোবাইল নম্বরটির ফরম্যাট সঠিক নয়। সঠিক ১১ সংখ্যার নম্বর দিন (যেমন: 01712345678)।',
      messageEn: 'Invalid phone number format. Enter an 11-digit number like 01712345678.',
      needsConsoleProviderEnable: false,
      consoleUrl: FIREBASE_AUTH_PROVIDERS_URL,
    };
  }
  if (code === 'auth/invalid-verification-code') {
    return {
      code,
      messageBn: 'ওটিপি (OTP) কোডটি মেলেনি! সঠিক ৬-সংখ্যার কোডটি লিখুন।',
      messageEn: 'Invalid verification code. Please enter the exact 6-digit SMS code.',
      needsConsoleProviderEnable: false,
      consoleUrl: FIREBASE_AUTH_PROVIDERS_URL,
    };
  }
  if (code === 'auth/code-expired') {
    return {
      code,
      messageBn: 'ওটিপি (OTP) কোডের মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে পুনরায় কোড পাঠান।',
      messageEn: 'Verification code expired. Please request a new code.',
      needsConsoleProviderEnable: false,
      consoleUrl: FIREBASE_AUTH_PROVIDERS_URL,
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
        'ইমেইল বা পাসওয়ার্ড সঠিক নয়, অথবা এখনো পাসওয়ার্ড অ্যাকাউন্ট খোলা হয়নি। সরাসরি লগইনের জন্য উপরের "Google / Gmail দিয়ে ১-ক্লিকে লগইন" বাটনটি ব্যবহার করুন!',
      messageEn: 'Invalid email or password. Use 1-Click Google Sign-In above or Register mode.',
      needsConsoleProviderEnable: false,
      consoleUrl: FIREBASE_AUTH_PROVIDERS_URL,
    };
  }
  if (code === 'auth/email-already-in-use') {
    return {
      code,
      messageBn: 'এই Gmail দিয়ে আগেই অ্যাকাউন্ট খোলা আছে! লগইন মোডে যান অথবা সরাসরি Google বাটনে ক্লিক করুন।',
      messageEn: 'This Gmail is already registered. Sign in directly or use Google Sign-In.',
      needsConsoleProviderEnable: false,
      consoleUrl: FIREBASE_AUTH_PROVIDERS_URL,
    };
  }
  return {
    code,
    messageBn: `অথেনটিকেশন ত্রুটি (${code}): ${error?.message || 'আবার চেষ্টা করুন।'}`,
    messageEn: `Authentication error (${code}): ${error?.message || 'Please try again.'}`,
    needsConsoleProviderEnable: false,
    consoleUrl: FIREBASE_AUTH_PROVIDERS_URL,
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

  return signInWithPopup(auth, provider, browserPopupRedirectResolver).then((res) => res.user);
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

export async function sendRealPhoneSmsOtp(
  rawPhone: string,
  recaptchaContainerId: string
): Promise<ConfirmationResult> {
  const formattedPhone = formatBangladeshE164(rawPhone);
  clearPhoneRecaptchaVerifier(recaptchaContainerId);

  const host = document.getElementById(recaptchaContainerId);
  if (!host) {
    throw {
      code: 'auth/internal-error',
      message: 'reCAPTCHA mount element not found in DOM.',
    };
  }

  // Create a fresh child element every attempt so Google reCAPTCHA never throws "already rendered"
  const widgetEl = document.createElement('div');
  host.appendChild(widgetEl);

  activeRecaptchaVerifier = new RecaptchaVerifier(auth, widgetEl, {
    size: 'normal',
  });

  await activeRecaptchaVerifier.render();
  return await signInWithPhoneNumber(auth, formattedPhone, activeRecaptchaVerifier);
}

export async function signOutReal(): Promise<void> {
  clearPhoneRecaptchaVerifier();
  await signOut(auth);
  localStorage.removeItem('bloodsearch_current_user');
  sessionStorage.removeItem('bloodsearch_admin_auth');
  window.dispatchEvent(new Event('bloodsearch_user_changed'));
}

export { onAuthStateChanged };
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
  const adminPath = `admins/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch (error) {
    console.warn('Admin status check warning:', adminPath, error);
    return false;
  }
}

export async function fetchUserProfileFromFirestore(uid: string): Promise<UserAccount | null> {
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
      totalDonations: data.totalDonations,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fetchUnmaskedDonorContactIfAuthorized(
  donorUid: string
): Promise<{ phone: string; whatsappPhone?: string; facebookUrl?: string } | null> {
  const current = auth.currentUser;
  if (!current) return null;
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
  const uid = firebaseUser.uid;
  const safeAvatar = await compressAvatarIfNeeded(account.photoUrl || donor.avatar || '');
  const isAdminPanel = account.role === 'ADMIN';

  const normalizedPhone = normalizeAsciiDigits(account.phone || firebaseUser.phoneNumber || '').trim();
  const normalizedWa = normalizeAsciiDigits(account.whatsappPhone || normalizedPhone).trim();

  const batch = writeBatch(db);

  const ownerAutoHash = isBootstrappedAdminUser(firebaseUser)
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
        name: clampStr(account.name, 2, 80, 'Admin Coordinator'),
        idCardNumber: clampStr(account.idCardNumber, 5, 40, 'ADMIN-BD-2026'),
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

  const userPayloadBase = {
    uid,
    name: clampStr(account.name, 2, 80, 'Blood Donor'),
    email: clampStr(
      firebaseUser.email || account.email,
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
    upazila: clampStr(account.upazila, 2, 50, 'sadar'),
    idCardNumber: clampStr(account.idCardNumber, 5, 40, 'BD-2026-1001'),
    panelType: isAdminPanel ? 'ADMIN' : 'USER',
    photoUrl: safeAvatar,
    age: clampNum(account.age, 18, 65, 24),
    gender: account.gender || 'MALE',
    weightKg: clampNum(account.weightKg, 40, 180, 62),
    availableToDonate: Boolean(account.availableToDonate),
    totalDonations: clampNum(account.totalDonations, 0, 500, 0),
    updatedAt: serverTimestamp(),
  };

  if (existingUserSnap.exists()) {
    const prev = existingUserSnap.data();
    batch.set(userRef, {
      ...userPayloadBase,
      email: prev.email,
      createdAt: prev.createdAt,
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
    isBootstrappedAdminUser(firebaseUser) || Boolean(isAdminPanel && adminProofHash);

  const donorPayloadBase = {
    ownerUid: uid,
    name: clampStr(donor.name, 2, 80, 'Blood Donor'),
    bloodGroup: donor.bloodGroup,
    division: clampStr(donor.division, 2, 40, 'dhaka'),
    district: clampStr(donor.district, 2, 40, 'dhaka'),
    upazila: clampStr(donor.upazila, 2, 50, 'sadar'),
    maskedPhone: maskPhoneNumber(normalizedPhone || donor.phone),
    available: Boolean(donor.available),
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
      isAdminPanel ? 'জেলা রক্ত সমন্বয়ক ও অ্যাডমিন' : 'Voluntary Donor'
    ),
    avatar: safeAvatar,
    idCardNumber: clampStr(account.idCardNumber, 5, 40, 'BD-2026-1001'),
    panelType: isAdminPanel ? 'ADMIN' : 'USER',
    isPublic: true,
    updatedAt: serverTimestamp(),
  };

  if (existingDonorSnap.exists()) {
    const prevD = existingDonorSnap.data();
    batch.set(donorRef, {
      ...donorPayloadBase,
      verifiedBadge: alreadyAdmin ? true : Boolean(prevD.verifiedBadge),
      panelType: alreadyAdmin ? (isAdminPanel ? 'ADMIN' : prevD.panelType) : prevD.panelType,
      idCardNumber: alreadyAdmin && isAdminPanel ? donorPayloadBase.idCardNumber : prevD.idCardNumber,
      createdAt: prevD.createdAt,
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
}

export function subscribePublicDonors(onData: (donors: Donor[]) => void): () => void {
  const path = 'donors';
  const q = query(collection(db, path), where('isPublic', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Donor[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name,
          bloodGroup: data.bloodGroup as BloodGroup,
          division: data.division,
          district: data.district,
          upazila: data.upazila,
          phone: data.maskedPhone || '017****00',
          available: Boolean(data.available),
          lastDonatedDate: data.lastDonatedDate || '',
          totalDonations: Number(data.totalDonations) || 0,
          verifiedBadge: Boolean(data.verifiedBadge),
          rating: 5.0,
          reviewsCount: 1,
          age: Number(data.age) || 24,
          gender: data.gender || 'MALE',
          weightKg: Number(data.weightKg) || 60,
          hospitalAffiliation: data.hospitalAffiliation || 'Voluntary Donor',
          avatar: data.avatar || DEFAULT_AVATAR_DATA_URI,
          reliabilityScore: data.verifiedBadge ? 99 : 92,
        };
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribePublicRequests(onData: (requests: BloodRequest[]) => void): () => void {
  const path = 'requests';
  const q = query(collection(db, path), where('isPublic', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: BloodRequest[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
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
          contactName: data.patientName,
          contactPhone: 'হাসপাতাল জরুরি কাউন্টার',
          requiredDate: data.requiredDate || 'জরুরি',
          reason: data.reason || 'জরুরি রক্ত সঞ্চালন',
          responders: [],
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'এইমাত্র',
          status: data.status || 'ACTIVE',
        };
      });
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createBloodRequestInFirestore(newReq: BloodRequest): Promise<void> {
  const user = auth.currentUser;
  if (!user || !isUserVerifiedForWrites(user)) return;

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
      requiredDate: clampStr(newReq.requiredDate, 2, 30, 'আজ জরুরি'),
      reason: clampStr(newReq.reason, 2, 300, 'জরুরি রক্তের প্রয়োজন'),
      status: 'ACTIVE',
      isPublic: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function pledgeBloodRequestUnitInFirestore(reqId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !isUserVerifiedForWrites(user)) return false;
  const safeId = reqId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const path = `requests/${safeId}`;
  try {
    const ref = doc(db, 'requests', safeId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const prev = snap.data();
    if (prev.status !== 'ACTIVE' || prev.unitsCollected >= prev.unitsNeeded) return false;
    const nextCollected = prev.unitsCollected + 1;
    const nextStatus = nextCollected >= prev.unitsNeeded ? 'FULFILLED' : 'ACTIVE';
    await setDoc(ref, {
      ...prev,
      unitsCollected: nextCollected,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminToggleDonorVerifiedInFirestore(donorId: string): Promise<boolean> {
  const user = auth.currentUser;
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
  const user = auth.currentUser;
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
  const user = auth.currentUser;
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
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function adminDeleteRequestInFirestore(reqId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !isUserVerifiedForWrites(user)) return false;
  const path = `requests/${reqId}`;
  try {
    const ref = doc(db, 'requests', reqId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    await deleteDoc(ref);
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
}

export async function adminUpdateBloodStockInFirestore(
  group: BloodGroup,
  newUnits: number
): Promise<boolean> {
  const user = auth.currentUser;
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
  const user = auth.currentUser;
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
}

export async function ownerCreateAdminInviteLock(
  rawCode: string,
  label: string
): Promise<string> {
  const user = auth.currentUser;
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
  const user = auth.currentUser;
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
  const user = auth.currentUser;
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
}

export async function ownerRevokeAdminAccess(targetUid: string): Promise<void> {
  const user = auth.currentUser;
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
}

export async function sendCommunityMessageInFirestore(params: {
  text: string;
  senderName: string;
  senderBloodGroup: BloodGroup;
  senderAvatar?: string;
  senderDistrict?: string;
  replyToName?: string;
  replyToText?: string;
}): Promise<void> {
  const user = auth.currentUser;
  if (!user || !isUserVerifiedForWrites(user)) {
    throw new Error('AUTH_REQUIRED');
  }
  const cleanText = params.text.trim().slice(0, 2000);
  if (!cleanText) return;

  const msgId = `cmsg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `communityMessages/${msgId}`;
  const safeAvatar = await compressAvatarIfNeeded(params.senderAvatar || user.photoURL || '');

  try {
    await setDoc(doc(db, 'communityMessages', msgId), {
      senderUid: user.uid,
      senderName: clampStr(params.senderName || user.displayName || 'রক্তদাতা', 1, 80, 'রক্তদাতা'),
      senderBloodGroup: params.senderBloodGroup || 'B+',
      senderAvatar: safeAvatar,
      senderDistrict: (params.senderDistrict || '').trim().slice(0, 50),
      text: cleanText,
      replyToName: (params.replyToName || '').trim().slice(0, 80),
      replyToText: (params.replyToText || '').trim().slice(0, 300),
      isPublic: true,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCommunityMessageInFirestore(messageId: string): Promise<void> {
  const user = auth.currentUser;
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
          createdAtMs: t.ms,
          timeLabel: t.label,
        };
      });
      list.sort((a, b) => a.createdAtMs - b.createdAtMs);
      onData(list);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, `directChats/${chatId}/messages`)
  );
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
}): Promise<string> {
  const user = auth.currentUser;
  if (!user || !isUserVerifiedForWrites(user)) {
    throw new Error('AUTH_REQUIRED');
  }

  const myUid = sanitizeFirestoreIdPart(user.uid);
  const cleanPeerUid = sanitizeFirestoreIdPart(params.peerUid);
  if (myUid === cleanPeerUid || user.uid !== myUid) {
    throw new Error('SELF_CHAT_NOT_ALLOWED');
  }

  const cleanText = params.text.trim().slice(0, 2000);
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
  const cleanMyFb = (params.myFb || '').trim().slice(0, 200);

  const cleanPeerWaInit =
    params.peerWhatsapp && !params.peerWhatsapp.includes('*') && !params.peerWhatsapp.includes('X')
      ? normalizeAsciiDigits(params.peerWhatsapp).replace(/[^0-9+]/g, '').slice(0, 24)
      : '';
  const cleanPeerFbInit = (params.peerFb || '').trim().slice(0, 200);

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

  batch.set(msgRef, {
    chatId,
    senderUid: myUid,
    senderName: clampStr(params.myName || user.displayName || 'রক্তদাতা', 1, 80, 'রক্তদাতা'),
    participantOneUid: p1Uid,
    participantTwoUid: p2Uid,
    text: cleanText,
    replyToText: (params.replyToText || '').trim().slice(0, 300),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return chatId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `directChats/${chatId}`);
  }
}

