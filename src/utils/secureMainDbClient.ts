import { auth } from '../firebase';
import type { BloodGroup, BloodRequest, Donor } from '../types';

export interface ServerAdminVerificationResult {
  ok: boolean;
  isAdmin: boolean;
  role: 'SUPER_ADMIN' | 'CO_ADMIN' | 'MODERATOR' | 'USER';
  lockedOut?: boolean;
  retryAfterSec?: number;
}

let mainServerApiMissing = false;
let mainServerBackoffUntilMs = 0;

async function getBearerHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Proceed unauthenticated if token fetch fails
    }
  }
  return headers;
}

/**
 * Verifies Admin / Super-Owner role strictly against the server-side PostgreSQL RBAC & lockout shield.
 */
export async function verifyAdminWithMainServer(): Promise<ServerAdminVerificationResult> {
  if (mainServerApiMissing || Date.now() < mainServerBackoffUntilMs) {
    return { ok: false, isAdmin: false, role: 'USER' };
  }
  try {
    const headers = await getBearerHeaders();
    if (!headers.Authorization) {
      return { ok: false, isAdmin: false, role: 'USER' };
    }
    const resp = await fetch('/api/v1/auth/admin-verify', {
      method: 'GET',
      headers,
      credentials: 'same-origin',
    });
    if (resp.status === 404) {
      mainServerApiMissing = true;
      return { ok: false, isAdmin: false, role: 'USER' };
    }
    if (resp.status >= 500) {
      mainServerBackoffUntilMs = Date.now() + 60_000;
      return { ok: false, isAdmin: false, role: 'USER' };
    }
    const data = await resp.json().catch(() => ({}));
    if (resp.status === 429) {
      return {
        ok: false,
        isAdmin: false,
        role: 'USER',
        lockedOut: true,
        retryAfterSec: Number(data?.retryAfterSec) || 900,
      };
    }
    return {
      ok: Boolean(resp.ok && data?.ok),
      isAdmin: Boolean(resp.ok && data?.isAdmin),
      role: (data?.role as ServerAdminVerificationResult['role']) || 'USER',
    };
  } catch {
    return { ok: false, isAdmin: false, role: 'USER' };
  }
}

/**
 * Syncs a registered/updated donor profile + private contact vault to the server-side PostgreSQL main DB.
 */
export async function syncDonorProfileToMainDb(payload: {
  displayName: string;
  bloodGroup: BloodGroup;
  age?: number | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  weightKg?: number | null;
  district: string;
  upazila?: string | null;
  area: string;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  whatsappNumber?: string | null;
  facebookProfileUrl?: string | null;
  isAvailable?: boolean;
  shareDirectContact?: boolean;
  contactVisibility?:
    | 'PUBLIC_OPT_IN'
    | 'VERIFIED_SEEKERS'
    | 'REQUEST_ONLY'
    | 'EMERGENCY_VERIFIED_ONLY'
    | 'DND_PRIVATE';
  bio?: string | null;
}): Promise<boolean> {
  if (mainServerApiMissing || Date.now() < mainServerBackoffUntilMs) return false;
  try {
    const headers = await getBearerHeaders();
    if (!headers.Authorization) return false;

    const shareDirect = payload.shareDirectContact !== false;
    const normalizedVisibility =
      payload.contactVisibility === 'VERIFIED_SEEKERS'
        ? 'EMERGENCY_VERIFIED_ONLY'
        : payload.contactVisibility || (shareDirect ? 'PUBLIC_OPT_IN' : 'REQUEST_ONLY');
    const resp = await fetch('/api/v1/donors/profile', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: JSON.stringify({
        displayName: payload.displayName,
        bloodGroup: payload.bloodGroup,
        age: payload.age ?? null,
        gender: payload.gender ?? null,
        weightKg: payload.weightKg ?? null,
        district: payload.district,
        upazila: payload.upazila ?? null,
        area: payload.area,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        phone: payload.phone,
        whatsappNumber: payload.whatsappNumber || payload.phone,
        facebookProfileUrl: payload.facebookProfileUrl || null,
        isAvailable: payload.isAvailable !== false,
        shareDirectContact: shareDirect,
        contactPreference: shareDirect ? 'CALL_ALLOWED' : 'IN_APP_ONLY',
        contactVisibility: normalizedVisibility,
        medicalDeclarationAccepted: true,
        bio: payload.bio || null,
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * Syncs a new emergency blood request into the server-side PostgreSQL main DB.
 */
export async function syncBloodRequestToMainDb(req: BloodRequest): Promise<boolean> {
  if (mainServerApiMissing) return false;
  try {
    const headers = await getBearerHeaders();
    if (!headers.Authorization) return false;

    const resp = await fetch('/api/v1/requests', {
      method: 'POST',
      headers,
      credentials: 'same-origin',
      body: JSON.stringify({
        patientName: req.patientName,
        bloodGroup: req.bloodGroup,
        bagsNeeded: req.unitsNeeded,
        unitsNeeded: req.unitsNeeded,
        urgency: req.urgency,
        hospitalName: req.hospitalName,
        district: req.district,
        upazila: req.upazila || null,
        area: req.upazila || req.district,
        contactName: req.contactName || req.patientName,
        contactPhone: req.contactPhone,
        whatsappNumber: req.contactPhone,
        shareDirectContact: req.seekerSharePhone !== false,
        clinicalReason: req.reason || null,
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * Fetches public donors from the server-side PostgreSQL main DB (`/api/v1/donors/search`)
 * so server-persisted donors are available alongside real-time updates without raw bulk PII dumps.
 */
export async function fetchDonorsFromMainDb(): Promise<Donor[]> {
  if (mainServerApiMissing || Date.now() < mainServerBackoffUntilMs) return [];
  try {
    const resp = await fetch('/api/v1/donors/search?availableOnly=false&limit=50', {
      method: 'GET',
      credentials: 'same-origin',
    });
    if (resp.status === 404) {
      mainServerApiMissing = true;
      return [];
    }
    if (resp.status >= 500) {
      mainServerBackoffUntilMs = Date.now() + 60_000;
      return [];
    }
    if (!resp.ok) return [];
    const contentType = String(resp.headers.get('content-type') || '').toLowerCase();
    if (!contentType.includes('json')) {
      mainServerApiMissing = true;
      return [];
    }
    const data = await resp.json();
    if (!data?.ok || !Array.isArray(data.items)) return [];

    return data.items.map(
      (row: any): Donor => ({
        id: String(row.userUid || row.id),
        name: String(row.publicName || 'Donor'),
        bloodGroup: (row.bloodGroup as BloodGroup) || 'O+',
        division: 'dhaka',
        district: String(row.district || 'dhaka').toLowerCase(),
        upazila: String(row.area || row.upazila || row.district || 'Dhaka'),
        phone: String(row.maskedPhoneHint || '017****00'),
        available: Boolean(row.isAvailable),
        availabilityStatus:
          row.availabilityStatus === 'DND'
            ? 'DND'
            : row.isAvailable === false
              ? 'TEMPORARILY_UNAVAILABLE'
              : 'AVAILABLE',
        availabilityConfirmedAtMs: row.lastAvailabilityConfirmedAt
          ? new Date(row.lastAvailabilityConfirmedAt).getTime()
          : undefined,
        shareDirectContact: row.shareDirectContact !== false,
        contactVisibility: row.shareDirectContact === false ? 'REQUEST_ONLY' : 'PUBLIC_OPT_IN',
        allowCall: row.contactPreference !== 'WHATSAPP_ONLY' && row.contactPreference !== 'IN_APP_ONLY',
        allowWhatsApp: row.contactPreference !== 'IN_APP_ONLY',
        allowSms: row.contactPreference !== 'WHATSAPP_ONLY' && row.contactPreference !== 'IN_APP_ONLY',
        isCloudRecord: true,
        lastDonatedDate: '',
        totalDonations: Number(row.totalDonations) || 0,
        verifiedBadge: Boolean(row.isVerified),
        rating: Number(row.rating) || 5.0,
        reviewsCount: 0,
        age: Number(row.age) || 0,
        gender:
          row.gender === 'FEMALE' ? 'FEMALE' : row.gender === 'OTHER' ? 'OTHER' : 'MALE',
        weightKg: 0,
      })
    );
  } catch {
    return [];
  }
}

/**
 * Resolves single-donor opted-in Call, WhatsApp, SMS, and Facebook details from the server-side
 * PostgreSQL vault (rate-limited per IP to stop automated scraping while keeping legitimate UX instant).
 */
export async function resolveOptedInDonorContactFromMainDb(donorUid: string): Promise<{
  phone?: string;
  whatsappPhone?: string;
  facebookUrl?: string;
  allowCall?: boolean;
  allowWhatsApp?: boolean;
  allowSms?: boolean;
} | null> {
  if (!donorUid || mainServerApiMissing || Date.now() < mainServerBackoffUntilMs) return null;
  try {
    const headers = await getBearerHeaders();
    // Try authenticated endpoint first if signed in, otherwise opted-in single-donor endpoint
    const url = headers.Authorization
      ? `/api/v1/donors/${encodeURIComponent(donorUid)}/contact?silent=1`
      : `/api/v1/donors/${encodeURIComponent(donorUid)}/opted-in-contact?silent=1`;

    const resp = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'same-origin',
    });
    if (resp.status >= 500) {
      mainServerBackoffUntilMs = Date.now() + 60_000;
      return null;
    }
    if (!resp.ok) return null;
    const data = await resp.json();
    const c = data?.contact;
    if (!c) return null;
    return {
      phone: c.phoneE164 || undefined,
      whatsappPhone: c.whatsappNumber || c.phoneE164 || undefined,
      facebookUrl: c.facebookProfileUrl || undefined,
      allowCall: c.allowCall !== false,
      allowWhatsApp: c.allowWhatsApp !== false,
      allowSms: c.allowSms !== false,
    };
  } catch {
    return null;
  }
}
