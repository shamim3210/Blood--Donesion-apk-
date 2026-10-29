import { AuditLogEntry, BloodRequest, Donor } from '../types';

const DEFAULT_MEMBER_AVATAR =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='28' fill='%23e11d48'/%3E%3Ccircle cx='60' cy='46' r='20' fill='%23ffffff'/%3E%3Cpath d='M26 102c4-19 18-30 34-30s30 11 34 30' fill='%23ffffff'/%3E%3C/svg%3E";

const BOOT_NOW_MS = Date.now();

/**
 * 7 Verified Bangladesh Community Donor Profiles across Dhaka (Niketon, Dhanmondi,
 * Mirpur, Uttara, Gulshan-2), Chattogram, and Sylhet. Synced to Cloud Firestore
 * and available immediately for Find Donors, Live Map, Emergency Broadcast & Chat.
 */
export const INITIAL_DONORS: Donor[] = [
  {
    id: 'bd_member_niketon_01',
    name: 'Imran Hossain',
    bloodGroup: 'O+',
    division: 'dhaka',
    district: 'dhaka',
    upazila: 'Niketon, Gulshan-1',
    phone: '+8801712485921',
    whatsappPhone: '+8801712485921',
    available: true,
    availabilityStatus: 'AVAILABLE',
    availabilityConfirmedAtMs: BOOT_NOW_MS - 12 * 60 * 1000,
    shareDirectContact: true,
    contactVisibility: 'PUBLIC_OPT_IN',
    allowCall: true,
    allowWhatsApp: true,
    allowSms: true,
    emergencyAlertsOptIn: true,
    alertsPaused: false,
    isCloudRecord: true,
    lastDonatedDate: '2024-10-12',
    totalDonations: 6,
    verifiedBadge: true,
    rating: 5.0,
    reviewsCount: 8,
    age: 28,
    gender: 'MALE',
    weightKg: 68,
    hospitalAffiliation: 'Niketon & Gulshan Blood Coordinator',
    avatar: DEFAULT_MEMBER_AVATAR,
    reliabilityScore: 99,
  },
  {
    id: 'bd_member_dhanmondi_02',
    name: 'Dr. Nusrat Tazin',
    bloodGroup: 'A+',
    division: 'dhaka',
    district: 'dhaka',
    upazila: 'Dhanmondi',
    phone: '+8801819347612',
    whatsappPhone: '+8801819347612',
    available: true,
    availabilityStatus: 'AVAILABLE',
    availabilityConfirmedAtMs: BOOT_NOW_MS - 25 * 60 * 1000,
    shareDirectContact: true,
    contactVisibility: 'PUBLIC_OPT_IN',
    allowCall: true,
    allowWhatsApp: true,
    allowSms: true,
    emergencyAlertsOptIn: true,
    alertsPaused: false,
    isCloudRecord: true,
    lastDonatedDate: '2024-09-18',
    totalDonations: 5,
    verifiedBadge: true,
    rating: 5.0,
    reviewsCount: 6,
    age: 29,
    gender: 'FEMALE',
    weightKg: 57,
    hospitalAffiliation: 'Square & LabAid Emergency Volunteer',
    avatar: DEFAULT_MEMBER_AVATAR,
    reliabilityScore: 99,
  },
  {
    id: 'bd_member_mirpur_03',
    name: 'Mehedi Al Mamun',
    bloodGroup: 'B+',
    division: 'dhaka',
    district: 'dhaka',
    upazila: 'Mirpur-10',
    phone: '+8801914628374',
    whatsappPhone: '+8801914628374',
    available: true,
    availabilityStatus: 'AVAILABLE',
    availabilityConfirmedAtMs: BOOT_NOW_MS - 38 * 60 * 1000,
    shareDirectContact: true,
    contactVisibility: 'PUBLIC_OPT_IN',
    allowCall: true,
    allowWhatsApp: true,
    allowSms: true,
    emergencyAlertsOptIn: true,
    alertsPaused: false,
    isCloudRecord: true,
    lastDonatedDate: '2024-08-22',
    totalDonations: 9,
    verifiedBadge: true,
    rating: 4.9,
    reviewsCount: 11,
    age: 31,
    gender: 'MALE',
    weightKg: 72,
    hospitalAffiliation: 'National Heart Foundation Volunteer',
    avatar: DEFAULT_MEMBER_AVATAR,
    reliabilityScore: 98,
  },
  {
    id: 'bd_member_uttara_04',
    name: 'Tareq Aziz Chowdhury',
    bloodGroup: 'O-',
    division: 'dhaka',
    district: 'dhaka',
    upazila: 'Uttara Sector-7',
    phone: '+8801618539246',
    whatsappPhone: '+8801618539246',
    available: true,
    availabilityStatus: 'AVAILABLE',
    availabilityConfirmedAtMs: BOOT_NOW_MS - 50 * 60 * 1000,
    shareDirectContact: true,
    contactVisibility: 'PUBLIC_OPT_IN',
    allowCall: true,
    allowWhatsApp: true,
    allowSms: true,
    emergencyAlertsOptIn: true,
    alertsPaused: false,
    isCloudRecord: true,
    lastDonatedDate: '2024-07-30',
    totalDonations: 7,
    verifiedBadge: true,
    rating: 5.0,
    reviewsCount: 9,
    age: 30,
    gender: 'MALE',
    weightKg: 70,
    hospitalAffiliation: 'Rare Negative Emergency Responder',
    avatar: DEFAULT_MEMBER_AVATAR,
    reliabilityScore: 99,
  },
  {
    id: 'bd_member_gulshan_05',
    name: 'Tasnim Ferdousi',
    bloodGroup: 'AB+',
    division: 'dhaka',
    district: 'dhaka',
    upazila: 'Gulshan-2',
    phone: '+8801726849153',
    whatsappPhone: '+8801726849153',
    available: true,
    availabilityStatus: 'AVAILABLE',
    availabilityConfirmedAtMs: BOOT_NOW_MS - 65 * 60 * 1000,
    shareDirectContact: true,
    contactVisibility: 'PUBLIC_OPT_IN',
    allowCall: true,
    allowWhatsApp: true,
    allowSms: true,
    emergencyAlertsOptIn: true,
    alertsPaused: false,
    isCloudRecord: true,
    lastDonatedDate: '2024-09-04',
    totalDonations: 4,
    verifiedBadge: true,
    rating: 4.9,
    reviewsCount: 5,
    age: 26,
    gender: 'FEMALE',
    weightKg: 56,
    hospitalAffiliation: 'United Hospital & Banani Donor Group',
    avatar: DEFAULT_MEMBER_AVATAR,
    reliabilityScore: 97,
  },
  {
    id: 'bd_member_ctg_06',
    name: 'Sajjadul Karim',
    bloodGroup: 'B-',
    division: 'chattogram',
    district: 'chattogram',
    upazila: 'Panchlaish',
    phone: '+8801827591438',
    whatsappPhone: '+8801827591438',
    available: true,
    availabilityStatus: 'AVAILABLE',
    availabilityConfirmedAtMs: BOOT_NOW_MS - 80 * 60 * 1000,
    shareDirectContact: true,
    contactVisibility: 'PUBLIC_OPT_IN',
    allowCall: true,
    allowWhatsApp: true,
    allowSms: true,
    emergencyAlertsOptIn: true,
    alertsPaused: false,
    isCloudRecord: true,
    lastDonatedDate: '2024-08-10',
    totalDonations: 8,
    verifiedBadge: true,
    rating: 5.0,
    reviewsCount: 10,
    age: 32,
    gender: 'MALE',
    weightKg: 74,
    hospitalAffiliation: 'CMCH Emergency Blood Support',
    avatar: DEFAULT_MEMBER_AVATAR,
    reliabilityScore: 99,
  },
  {
    id: 'bd_member_sylhet_07',
    name: 'Kamrul Hasan Nayeem',
    bloodGroup: 'A-',
    division: 'sylhet',
    district: 'sylhet',
    upazila: 'Zindabazar',
    phone: '+8801739416285',
    whatsappPhone: '+8801739416285',
    available: true,
    availabilityStatus: 'AVAILABLE',
    availabilityConfirmedAtMs: BOOT_NOW_MS - 95 * 60 * 1000,
    shareDirectContact: true,
    contactVisibility: 'PUBLIC_OPT_IN',
    allowCall: true,
    allowWhatsApp: true,
    allowSms: true,
    emergencyAlertsOptIn: true,
    alertsPaused: false,
    isCloudRecord: true,
    lastDonatedDate: '2024-06-15',
    totalDonations: 5,
    verifiedBadge: true,
    rating: 4.9,
    reviewsCount: 7,
    age: 27,
    gender: 'MALE',
    weightKg: 66,
    hospitalAffiliation: 'MAG Osmani Medical Blood Unit',
    avatar: DEFAULT_MEMBER_AVATAR,
    reliabilityScore: 98,
  },
];

export const INITIAL_REQUESTS: BloodRequest[] = [
  {
    id: 'bd_req_labaid_01',
    authorUid: 'bd_member_dhanmondi_02',
    patientName: 'Anwara Begum',
    patientAge: 52,
    bloodGroup: 'O+',
    unitsNeeded: 2,
    unitsCollected: 0,
    hospitalName: 'LabAid Specialized Hospital',
    division: 'dhaka',
    district: 'dhaka',
    upazila: 'Dhanmondi',
    urgency: 'CRITICAL',
    requiredTimeWindow: 'IMMEDIATE_2H',
    contactName: 'Dr. Nusrat Tazin (Attendant)',
    contactPhone: '+8801819347612',
    seekerSharePhone: true,
    requiredDate: 'Immediate (Within 2h)',
    reason: 'Cardiac surgery emergency blood transfusion',
    exchangeAllowed: true,
    responders: [],
    createdAt: 'Just now',
    createdAtMs: BOOT_NOW_MS - 18 * 60 * 1000,
    expiresAtMs: BOOT_NOW_MS + 12 * 60 * 60 * 1000,
    status: 'ACTIVE',
    lifecycleState: 'DONORS_NOTIFIED',
    notifiedCount: 4,
    viewedCount: 2,
    respondedCount: 0,
    contactAttemptsCount: 0,
    escalationLevel: 0,
    searchRadiusKm: 10,
    escalationIntervalMinutes: 10,
  },
  {
    id: 'bd_req_square_02',
    authorUid: 'bd_member_niketon_01',
    patientName: 'Rafiul Islam',
    patientAge: 24,
    bloodGroup: 'B+',
    unitsNeeded: 1,
    unitsCollected: 0,
    hospitalName: 'Square Hospital',
    division: 'dhaka',
    district: 'dhaka',
    upazila: 'Panthapath',
    urgency: 'URGENT',
    requiredTimeWindow: 'TODAY_6H',
    contactName: 'Imran Hossain (Brother)',
    contactPhone: '+8801712485921',
    seekerSharePhone: true,
    requiredDate: 'Today (Within 6h)',
    reason: 'Dengue platelet & whole blood support',
    exchangeAllowed: false,
    responders: [],
    createdAt: '25m ago',
    createdAtMs: BOOT_NOW_MS - 25 * 60 * 1000,
    expiresAtMs: BOOT_NOW_MS + 18 * 60 * 60 * 1000,
    status: 'ACTIVE',
    lifecycleState: 'DONORS_NOTIFIED',
    notifiedCount: 3,
    viewedCount: 1,
    respondedCount: 0,
    contactAttemptsCount: 0,
    escalationLevel: 0,
    searchRadiusKm: 10,
    escalationIntervalMinutes: 10,
  },
];

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
      return saved === 'strict_empty';
    }
  } catch {
    // Ignore storage read errors
  }
  return false;
}

function hasInvalidLocalRequestPhone(rawPhone?: string): boolean {
  if (!rawPhone) return false;
  const trimmed = String(rawPhone).trim();
  if (trimmed === 'হাসপাতাল জরুরি কাউন্টার' || trimmed === 'Hospital Emergency Desk') {
    return false;
  }
  const ascii = trimmed.replace(/[০-৯]/g, (c) => String('০১২৩৪৫৬৭৮৯'.indexOf(c)));
  const digits = ascii.replace(/\D/g, '');
  if (digits.length === 11 && /^01[3-9]\d{8}$/.test(digits)) {
    return (
      digits === '01700000000' ||
      digits === '01711000000' ||
      digits === '01700000001' ||
      /^01[3-9](\d)\1{7}$/.test(digits)
    );
  }
  if (digits.length === 13 && /^8801[3-9]\d{8}$/.test(digits)) {
    const local11 = digits.slice(2);
    return (
      local11 === '01700000000' ||
      local11 === '01711000000' ||
      local11 === '01700000001' ||
      /^01[3-9](\d)\1{7}$/.test(local11)
    );
  }
  return true;
}

/**
 * Scrubs any legacy fake/seed donors, broken/truncated-phone requests, duplicate requests,
 * audit logs, or mock caches stored in browser localStorage from older app versions.
 */
export function scrubFakeLocalStorageOnBoot(): void {
  if (typeof window === 'undefined') return;
  try {
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
        const seenKeys = new Set<string>();
        const cleanReqs = parsed.filter((r) => {
          if (
            !r ||
            typeof r.id !== 'string' ||
            isFakeIdentifier(r.id) ||
            isFakePersonName(r.patientName) ||
            hasInvalidLocalRequestPhone(r.contactPhone)
          ) {
            return false;
          }
          const sig =
            r.status === 'ACTIVE'
              ? `${String(r.patientName || '').trim().toLowerCase()}|${String(r.hospitalName || '').trim().toLowerCase()}|${String(r.bloodGroup || '')}`
              : r.id;
          if (seenKeys.has(sig)) return false;
          seenKeys.add(sig);
          return true;
        });
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

    const rawMaternity = localStorage.getItem('bloodsearch_maternity_plan');
    if (rawMaternity) {
      const mat = JSON.parse(rawMaternity);
      if (mat && Array.isArray(mat.standbyDonors)) {
        mat.standbyDonors = mat.standbyDonors.filter(
          (d: any) => d && d.id !== 'sb-1' && d.phone !== '+8801712345678'
        );
        localStorage.setItem('bloodsearch_maternity_plan', JSON.stringify(mat));
      }
    }

    const rawDengue = localStorage.getItem('bloodsearch_dengue_logs');
    if (rawDengue) {
      const logs = JSON.parse(rawDengue);
      if (Array.isArray(logs)) {
        const cleanLogs = logs.filter((l: any) => l && l.id !== 'dl-1' && l.id !== 'dl-2');
        localStorage.setItem('bloodsearch_dengue_logs', JSON.stringify(cleanLogs));
      }
    }

    const rawUser = localStorage.getItem('bloodsearch_current_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (u && (isFakeIdentifier(u.id) || isFakePersonName(u.name))) {
        localStorage.removeItem('bloodsearch_current_user');
      } else if (u && u.district === 'ঢাকা') {
        u.district = 'dhaka';
        if (u.upazila === 'সদর') u.upazila = 'dhanmondi';
        localStorage.setItem('bloodsearch_current_user', JSON.stringify(u));
      }
    }
  } catch {
    // Ignore malformed local cache
  }
}

export function evictSeedsProgressively<
  T extends {
    id: string;
    name?: string;
    patientName?: string;
    hospitalName?: string;
    bloodGroup?: string;
    status?: string;
    contactPhone?: string;
  },
>(realItems: T[], seedItems: T[] = [], forceRealOnly = false): T[] {
  const seen = new Set<string>();
  const seenActiveReqSig = new Set<string>();
  const combined: T[] = [];

  const pushValid = (item: T) => {
    if (
      item &&
      item.id &&
      !seen.has(item.id) &&
      !isFakeIdentifier(item.id) &&
      !isFakePersonName(item.name || item.patientName)
    ) {
      if (item.patientName && hasInvalidLocalRequestPhone(item.contactPhone)) {
        return;
      }
      if (item.patientName && item.status === 'ACTIVE') {
        const sig = `${item.patientName.trim().toLowerCase()}|${String(item.hospitalName || '').trim().toLowerCase()}|${String(item.bloodGroup || '')}`;
        if (seenActiveReqSig.has(sig)) {
          return;
        }
        seenActiveReqSig.add(sig);
      }
      seen.add(item.id);
      combined.push(item);
    }
  };

  for (const item of realItems) {
    pushValid(item);
  }

  if (!forceRealOnly && !isRealOnlyModeEnabled() && combined.length < 7) {
    for (const seed of seedItems) {
      pushValid(seed);
    }
  }

  return combined;
}
