import { BOOTSTRAPPED_SUPER_ADMIN_EMAIL, FIREBASE_PROJECT_ID } from '../firebase';

export interface SecurityDiagnostics {
  origin: string;
  hostname: string;
  isHttpsOrLocal: boolean;
  isStandaloneApp: boolean;
  isInIframe: boolean;
  isTrustedEnvironment: boolean;
  ownerEmail: string;
  firebaseProjectId: string;
}

let initialized = false;

export function initRuntimeSecurityShield(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // 1. Anti-Self-XSS Browser Console Warning (Protects Owner & Users from social-engineering paste attacks)
  try {
    console.log(
      '%c🛑 থামুন! STOP — BloodSearch Security Shield',
      'color:#e11d48;font-size:22px;font-weight:900;'
    );
    console.log(
      '%cকেউ যদি আপনাকে এখানে কোনো কোড কপি-পেস্ট করতে বলে (যেমন "ফ্রি ভেরিফিকেশন" বা "অ্যাডমিন আনলক"), তবে তা ১০০% প্রতারণা (Self-XSS Scam)। এখানে কখনোই অপরিচিত কোড পেস্ট করবেন না।\nOwner Locked To: ' +
        BOOTSTRAPPED_SUPER_ADMIN_EMAIL,
      'color:#f59e0b;font-size:13px;font-weight:700;'
    );
  } catch {}

  // 2. Purge any legacy insecure client-only admin unlock flags from storage
  try {
    sessionStorage.removeItem('bloodsearch_admin_auth');
    localStorage.removeItem('bloodsearch_admin_auth');
  } catch {}
}

export function getSecurityDiagnostics(): SecurityDiagnostics {
  if (typeof window === 'undefined') {
    return {
      origin: '',
      hostname: '',
      isHttpsOrLocal: true,
      isStandaloneApp: false,
      isInIframe: false,
      isTrustedEnvironment: true,
      ownerEmail: BOOTSTRAPPED_SUPER_ADMIN_EMAIL,
      firebaseProjectId: FIREBASE_PROJECT_ID,
    };
  }

  const origin = window.location.origin;
  const hostname = window.location.hostname;
  const isHttpsOrLocal =
    window.location.protocol === 'https:' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1';

  const isStandaloneApp =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    Boolean((window.navigator as any).standalone) ||
    document.referrer.startsWith('android-app://');

  let isInIframe = false;
  try {
    isInIframe = window.self !== window.top;
  } catch {
    isInIframe = true;
  }

  const isTrustedHost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.run.app') ||
    hostname.endsWith('.web.app') ||
    hostname.endsWith('.firebaseapp.com') ||
    isHttpsOrLocal;

  return {
    origin,
    hostname,
    isHttpsOrLocal,
    isStandaloneApp,
    isInIframe,
    isTrustedEnvironment: isTrustedHost && isHttpsOrLocal,
    ownerEmail: BOOTSTRAPPED_SUPER_ADMIN_EMAIL,
    firebaseProjectId: FIREBASE_PROJECT_ID,
  };
}
