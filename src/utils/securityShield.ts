import {
  auth,
  BOOTSTRAPPED_SUPER_ADMIN_EMAIL,
  FIREBASE_PROJECT_ID,
  isBootstrappedAdminUser,
  onAuthStateChanged,
} from '../firebase';

export interface SecurityDiagnostics {
  origin: string;
  hostname: string;
  isHttpsOrLocal: boolean;
  isStandaloneApp: boolean;
  isInIframe: boolean;
  isTrustedEnvironment: boolean;
  runtimeShieldActive: boolean;
  ownerEmail: string;
  firebaseProjectId: string;
}

let initialized = false;
let verifiedCloudAdminUid: string | null = null;

/**
 * Marks a Firebase UID as verified Cloud Admin for local cache consistency.
 * Even if tampered in memory, all Firestore writes & reads remain enforced server-side by firestore.rules.
 */
export function markRuntimeVerifiedAdminUid(uid: string | null): void {
  verifiedCloudAdminUid = uid;
}

function scrubForgedLocalRoleEscalation(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('bloodsearch_admin_auth');
    localStorage.removeItem('bloodsearch_admin_auth');

    const raw = localStorage.getItem('bloodsearch_current_user');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;

    const hasAdminClaim =
      parsed.role === 'ADMIN' || parsed.panelType === 'ADMIN';
    if (!hasAdminClaim) return;

    const currentUser = auth.currentUser;
    const isLegitAdminSession =
      Boolean(currentUser) &&
      (isBootstrappedAdminUser(currentUser) ||
        (verifiedCloudAdminUid !== null && currentUser?.uid === verifiedCloudAdminUid));

    if (!isLegitAdminSession) {
      const sanitized = {
        ...parsed,
        role: 'USER',
        panelType: 'USER',
      };
      localStorage.setItem('bloodsearch_current_user', JSON.stringify(sanitized));
    }
  } catch {
    // Ignore malformed JSON and remove tampered payload
    try {
      localStorage.removeItem('bloodsearch_current_user');
    } catch {}
  }
}

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

  // 2. Purge insecure client-only admin flags & watch localStorage against DevTools / APK WebView role spoofing
  scrubForgedLocalRoleEscalation();
  window.addEventListener('storage', () => {
    scrubForgedLocalRoleEscalation();
  });
  window.addEventListener('bloodsearch_user_changed', () => {
    scrubForgedLocalRoleEscalation();
  });
  try {
    onAuthStateChanged(auth, (u) => {
      if (!u) {
        verifiedCloudAdminUid = null;
      }
      scrubForgedLocalRoleEscalation();
    });
  } catch {}

  // 3. APK WebView & Browser Reverse-Tabnabbing + Dangerous URI Scheme Firewall
  const guardAnchorClicks = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    const anchor = target?.closest?.('a') as HTMLAnchorElement | null;
    if (!anchor) return;

    const rawHref = (anchor.getAttribute('href') || '').trim();
    if (/^(javascript|vbscript|data\s*:\s*text\/html)\s*:/i.test(rawHref)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (anchor.target === '_blank') {
      const existingRel = (anchor.getAttribute('rel') || '').toLowerCase();
      if (!existingRel.includes('noopener') || !existingRel.includes('noreferrer')) {
        anchor.setAttribute('rel', 'noopener noreferrer');
      }
    }
  };
  document.addEventListener('click', guardAnchorClicks, true);
  document.addEventListener('auxclick', guardAnchorClicks, true);

  // 4. Block untrusted Drag-and-Drop HTML/URI injection into APK WebViews & Browser Windows
  const blockUntrustedDrop = (e: DragEvent) => {
    const el = e.target as HTMLElement | null;
    if (el && el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'file') {
      return;
    }
    if (e.dataTransfer) {
      const uri = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain') || '';
      if (/^(javascript|vbscript|data)\s*:/i.test(uri.trim()) || e.type === 'drop') {
        e.preventDefault();
      } else if (e.type === 'dragover') {
        e.preventDefault();
      }
    }
  };
  window.addEventListener('dragover', blockUntrustedDrop, false);
  window.addEventListener('drop', blockUntrustedDrop, false);
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
      runtimeShieldActive: true,
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
    runtimeShieldActive: initialized,
    ownerEmail: BOOTSTRAPPED_SUPER_ADMIN_EMAIL,
    firebaseProjectId: FIREBASE_PROJECT_ID,
  };
}
