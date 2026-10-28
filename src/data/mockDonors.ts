import { AuditLogEntry, BloodRequest, Donor } from '../types';

/**
 * 100% Real-User Production Mode:
 * All fake/demo seed arrays are permanently emptied so only genuine registered donors,
 * real emergency SOS requests, and real security audit events appear in the app.
 */
export const INITIAL_DONORS: Donor[] = [];

export const INITIAL_REQUESTS: BloodRequest[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

export const LEGACY_FAKE_DONOR_IDS: ReadonlySet<string> = new Set([
  'donor-1',
  'donor-2',
  'donor-3',
  'donor-4',
  'donor-5',
  'donor-6',
  'donor-7',
  'donor-8',
  'donor-9',
  'donor-10',
  'seed-map-donor-1',
  'seed-map-donor-2',
  'seed-map-donor-3',
  'seed-map-donor-4',
]);

export const LEGACY_FAKE_REQUEST_IDS: ReadonlySet<string> = new Set([
  'req-1',
  'req-2',
  'req-3',
  'req-4',
  'seed-map-sos-1',
  'seed-map-sos-2',
  'sos_test_100',
]);

export const LEGACY_FAKE_AUDIT_IDS: ReadonlySet<string> = new Set([
  'audit-1',
  'audit-2',
  'audit-3',
]);

export const LEGACY_FAKE_NAMES: ReadonlySet<string> = new Set([
  'তানভীর আহমেদ (tanvir ahmed)',
  'ফারহানা হক (farhana haque)',
  'রাকিব হাসান (rakib hasan)',
  'সাদিয়া ইসলাম (sadia islam)',
  'মোস্তাফিজুর রহমান (mostafizur rahman)',
  'নাসরিন আক্তার (nasrin akhter)',
  'আরিফুল হক (ariful haque)',
  'মাহমুদুল হাসান (mahmudul hasan)',
  'সুমাইয়া জাহান (sumaiya jahan)',
  'জাহিদুল ইসলাম (zahidul islam)',
  'সুলতানা পারভীন (sultana parveen)',
  'মোহাম্মদ রফিক (md. rafiq)',
  'আফসানা রহমান (afsana rahman)',
  'আব্দুল কাদের (abdul kader)',
]);

export const SEED_DONOR_IDS: ReadonlySet<string> = LEGACY_FAKE_DONOR_IDS;
export const SEED_REQUEST_IDS: ReadonlySet<string> = LEGACY_FAKE_REQUEST_IDS;
export const SEED_AUDIT_IDS: ReadonlySet<string> = LEGACY_FAKE_AUDIT_IDS;

export function isFakeIdentifier(id?: string): boolean {
  if (!id) return false;
  const trimmed = id.trim();
  if (
    LEGACY_FAKE_DONOR_IDS.has(trimmed) ||
    LEGACY_FAKE_REQUEST_IDS.has(trimmed) ||
    LEGACY_FAKE_AUDIT_IDS.has(trimmed)
  ) {
    return true;
  }
  return /^(donor-\d+|req-\d+|audit-\d+|d\d+|seed[_-]|demo[_-]|fake[_-]|mock[_-]|sample[_-]|sos_test_)/i.test(
    trimmed
  );
}

export function isFakePersonName(name?: string): boolean {
  if (!name) return false;
  const lower = name.trim().toLowerCase();
  if (LEGACY_FAKE_NAMES.has(lower)) return true;
  return /^(fake\b|demo\b|test user\b|test donor\b|dummy\b|sample\b)/i.test(lower);
}

export function isSeedDonorId(id?: string): boolean {
  return isFakeIdentifier(id);
}

export function isSeedRequestId(id?: string): boolean {
  return isFakeIdentifier(id);
}

export function isSeedAuditId(id?: string): boolean {
  return isFakeIdentifier(id);
}

export function isRealOnlyModeEnabled(): boolean {
  try {
    const saved = localStorage.getItem('bloodsearch_real_only_mode');
    if (saved !== null) {
      return saved !== 'false';
    }
  } catch {
    // Ignore storage read errors
  }
  return true;
}

/**
 * Scrubs any legacy fake/seed donors, requests, audit logs, or mock caches
 * stored in browser localStorage from older app versions, while keeping all genuine records intact.
 */
export function scrubFakeLocalStorageOnBoot(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('bloodsearch_real_only_mode', 'true');

    const rawDonors = localStorage.getItem('bloodsearch_donors');
    if (rawDonors) {
      const parsed = JSON.parse(rawDonors);
      if (Array.isArray(parsed)) {
        const cleanDonors = parsed.filter(
          (d) => d && typeof d.id === 'string' && !isFakeIdentifier(d.id) && !isFakePersonName(d.name)
        );
        localStorage.setItem('bloodsearch_donors', JSON.stringify(cleanDonors));
      }
    }

    const rawRequests = localStorage.getItem('bloodsearch_requests');
    if (rawRequests) {
      const parsed = JSON.parse(rawRequests);
      if (Array.isArray(parsed)) {
        const cleanReqs = parsed.filter(
          (r) =>
            r &&
            typeof r.id === 'string' &&
            !isFakeIdentifier(r.id) &&
            !isFakePersonName(r.patientName)
        );
        localStorage.setItem('bloodsearch_requests', JSON.stringify(cleanReqs));
      }
    }

    const rawAudits = localStorage.getItem('bloodsearch_audit_logs');
    if (rawAudits) {
      const parsed = JSON.parse(rawAudits);
      if (Array.isArray(parsed)) {
        const cleanAudits = parsed.filter(
          (a) => a && typeof a.id === 'string' && !isFakeIdentifier(a.id)
        );
        localStorage.setItem('bloodsearch_audit_logs', JSON.stringify(cleanAudits));
      }
    }

    const rawUser = localStorage.getItem('bloodsearch_current_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u && (isFakeIdentifier(u.id) || isFakePersonName(u.name))) {
        localStorage.removeItem('bloodsearch_current_user');
      } else if (u && u.district === 'ঢাকা') {
        // Normalize legacy Bengali district ID on cached user profile so search filters match cleanly
        u.district = 'dhaka';
        if (u.upazila === 'সদর') u.upazila = 'dhanmondi';
        localStorage.setItem('bloodsearch_current_user', JSON.stringify(u));
      }
    }
  } catch {
    // Ignore malformed local cache
  }
}

export function evictSeedsProgressively<T extends { id: string; name?: string; patientName?: string }>(
  realItems: T[],
  _seedItems: T[] = [],
  _forceRealOnly = true
): T[] {
  const seen = new Set<string>();
  const uniqueReal: T[] = [];
  for (const item of realItems) {
    if (
      item &&
      item.id &&
      !seen.has(item.id) &&
      !isFakeIdentifier(item.id) &&
      !isFakePersonName(item.name || item.patientName)
    ) {
      seen.add(item.id);
      uniqueReal.push(item);
    }
  }
  return uniqueReal;
}
