import type {
  AvailabilityConfidence,
  BloodGroup,
  BloodRequest,
  ContactVisibility,
  Donor,
  DonorAvailabilityStatus,
  Language,
  RequestLifecycleState,
  RequiredTimeWindow,
  UrgencyLevel,
} from '../types';
import { getCompatibleDonors } from '../data/compatibility';
import { DISTRICTS, DIVISIONS } from '../data/bangladeshGeo';
import {
  Coordinates,
  calculateHaversineDistance,
  resolveBangladeshCoordinates,
} from './geolocation';
import { calculateRecoveryCountdown } from './sosAlertEngine';

export const RECENT_CONFIRMATION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface RankedDonorResult {
  donor: Donor;
  matchScore: number;
  bloodMatchType: 'EXACT' | 'COMPATIBLE' | 'EXCHANGE';
  distanceKm: number;
  availabilityConfidence: AvailabilityConfidence;
  isMedicallyEligible: boolean;
  recoveryDaysLeft: number;
  canDirectContactImmediately: boolean;
  freshnessLabel: string;
  wasAttemptedUnsuccessfully: boolean;
}

export interface SeekerSearchCriteria {
  bloodGroup: BloodGroup | 'ALL';
  compatibleMatchEnabled?: boolean;
  exchangeAllowed?: boolean;
  division?: string;
  district?: string;
  areaQuery?: string;
  urgency?: UrgencyLevel;
  requiredTimeWindow?: RequiredTimeWindow;
  originCoords: Coordinates;
  maxRadiusKm?: number | null;
  includeNearbyDistricts?: boolean;
  onlyConfirmedOrAvailable?: boolean;
  seekerIsVerifiedUser?: boolean;
  unsuccessfulDonorIds?: Set<string> | string[];
  lang?: Language;
  nowMs?: number;
}

export function doesDivisionMatch(donorDivision: string | undefined, filterDivision: string | undefined): boolean {
  if (!filterDivision || filterDivision === 'ALL') return true;
  if (!donorDivision) return false;
  const f = filterDivision.trim().toLowerCase();
  const d = donorDivision.trim().toLowerCase();
  if (d === f) return true;
  const divInfo = DIVISIONS.find(
    (item) =>
      item.id.toLowerCase() === f ||
      item.nameEn.toLowerCase() === f ||
      item.nameBn.trim() === filterDivision.trim()
  );
  if (!divInfo) return false;
  return (
    d === divInfo.id.toLowerCase() ||
    d === divInfo.nameEn.toLowerCase() ||
    donorDivision.trim() === divInfo.nameBn.trim()
  );
}

export function doesDistrictMatch(donorDistrict: string | undefined, filterDistrict: string | undefined): boolean {
  if (!filterDistrict || filterDistrict === 'ALL') return true;
  if (!donorDistrict) return false;
  const f = filterDistrict.trim().toLowerCase();
  const d = donorDistrict.trim().toLowerCase();
  if (d === f) return true;
  const distInfo = DISTRICTS.find(
    (item) =>
      item.id.toLowerCase() === f ||
      item.nameEn.toLowerCase() === f ||
      item.nameBn.trim() === filterDistrict.trim()
  );
  if (!distInfo) return false;
  return (
    d === distInfo.id.toLowerCase() ||
    d === distInfo.nameEn.toLowerCase() ||
    donorDistrict.trim() === distInfo.nameBn.trim()
  );
}

export function resolveDonorCoordinates(donor: Pick<Donor, 'id' | 'district' | 'upazila' | 'division'>): Coordinates {
  return resolveBangladeshCoordinates({
    district: donor.district,
    upazila: donor.upazila,
    division: donor.division,
    seedKey: donor.id,
  });
}

export function resolveEffectiveAvailabilityStatus(donor: Donor): DonorAvailabilityStatus {
  if (donor.availabilityStatus === 'DND') return 'DND';
  if (donor.availabilityStatus === 'TEMPORARILY_UNAVAILABLE') return 'TEMPORARILY_UNAVAILABLE';
  if (donor.availabilityStatus === 'AVAILABLE') return 'AVAILABLE';
  return donor.available ? 'AVAILABLE' : 'TEMPORARILY_UNAVAILABLE';
}

export function getDonorAvailabilityConfidence(
  donor: Donor,
  nowMs: number = Date.now()
): AvailabilityConfidence {
  const status = resolveEffectiveAvailabilityStatus(donor);
  if (status === 'DND') return 'DND';
  if (status === 'TEMPORARILY_UNAVAILABLE' || !donor.available) {
    return 'TEMPORARILY_UNAVAILABLE';
  }
  const confirmedAt = donor.availabilityConfirmedAtMs || 0;
  if (confirmedAt > 0 && nowMs - confirmedAt <= RECENT_CONFIRMATION_WINDOW_MS) {
    return 'CONFIRMED_RECENT';
  }
  return 'UNKNOWN_UNCONFIRMED';
}

export function formatAvailabilityTimestamp(
  donor: Donor,
  lang: Language = 'en',
  nowMs: number = Date.now()
): string {
  const confidence = getDonorAvailabilityConfidence(donor, nowMs);
  if (confidence === 'DND') {
    return lang === 'bn' ? 'ডু নট ডিস্টার্ব (বিরত)' : 'Do Not Disturb';
  }
  if (confidence === 'TEMPORARILY_UNAVAILABLE') {
    return lang === 'bn' ? 'সাময়িকভাবে অনুপস্থিত' : 'Temporarily Unavailable';
  }

  const confirmedAt = donor.availabilityConfirmedAtMs || 0;
  if (!confirmedAt || confirmedAt <= 0) {
    return lang === 'bn'
      ? 'স্ট্যাটাস অজানা · সাম্প্রতিক নিশ্চিতকরণ নেই'
      : 'Status unknown · Not recently confirmed';
  }

  const diffMin = Math.max(0, Math.floor((nowMs - confirmedAt) / 60000));
  if (diffMin < 1) {
    return lang === 'bn' ? 'এইমাত্র প্রস্তুতি নিশ্চিত করেছেন' : 'Confirmed available just now';
  }
  if (diffMin < 60) {
    return lang === 'bn'
      ? `${diffMin} মিনিট আগে প্রস্তুতি নিশ্চিত`
      : `Confirmed ${diffMin}m ago`;
  }
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    return lang === 'bn'
      ? `${diffHours} ঘণ্টা আগে প্রস্তুতি নিশ্চিত`
      : `Confirmed ${diffHours}h ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) {
    return lang === 'bn'
      ? `${diffDays} দিন আগে প্রস্তুতি নিশ্চিত`
      : `Confirmed ${diffDays}d ago`;
  }
  return lang === 'bn'
    ? `${diffDays} দিন আগে আপডেট (পুনঃনিশ্চিতকরণ প্রয়োজন)`
    : `Last confirmed ${diffDays}d ago (unconfirmed today)`;
}

export function isPhoneMaskedOrInvalid(phone?: string | null): boolean {
  if (!phone) return true;
  if (phone.includes('*')) return true;
  const digits = phone.replace(/\D/g, '');
  return digits.length < 10;
}

export function canSeekerViewDirectContact(
  donor: Donor,
  seekerIsVerifiedUser: boolean
): {
  allowed: boolean;
  visibility: ContactVisibility;
  reasonEn: string;
  reasonBn: string;
} {
  const status = resolveEffectiveAvailabilityStatus(donor);
  const visibility: ContactVisibility =
    donor.contactVisibility ||
    (donor.shareDirectContact === false ? 'REQUEST_ONLY' : 'PUBLIC_OPT_IN');

  if (status === 'DND') {
    return {
      allowed: false,
      visibility,
      reasonEn: 'Donor has enabled Do Not Disturb. Direct phone/WhatsApp is paused.',
      reasonBn: 'রক্তদাতা বর্তমানে ডু নট ডিস্টার্ব মোডে আছেন; সরাসরি নম্বর সাময়িকভাবে বন্ধ।',
    };
  }

  if (donor.shareDirectContact === false || visibility === 'REQUEST_ONLY') {
    return {
      allowed: false,
      visibility: 'REQUEST_ONLY',
      reasonEn: 'Donor requires a consent contact request or in-app chat first.',
      reasonBn: 'রক্তদাতা সরাসরি নম্বরের বদলে ইন-অ্যাপ চ্যাট বা অনুমতি অনুরোধ বেছে নিয়েছেন।',
    };
  }

  if (visibility === 'VERIFIED_SEEKERS' && !seekerIsVerifiedUser) {
    return {
      allowed: false,
      visibility: 'VERIFIED_SEEKERS',
      reasonEn: 'Sign in with a verified account to view this donor’s opted-in phone/WhatsApp.',
      reasonBn: 'এই রক্তদাতার সরাসরি কল ও WhatsApp পেতে ভেরিফাইড অ্যাকাউন্টে লগইন করুন।',
    };
  }

  return {
    allowed: true,
    visibility,
    reasonEn: 'Donor opted in to direct emergency contact.',
    reasonBn: 'রক্তদাতা সরাসরি জরুরি যোগাযোগের অনুমতি দিয়েছেন।',
  };
}

export function normalizeBangladeshPhoneForWa(rawPhone: string): string | null {
  if (isPhoneMaskedOrInvalid(rawPhone)) return null;
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length >= 13) return digits;
  if (digits.startsWith('01') && digits.length === 11) return `88${digits}`;
  if (digits.length >= 10) return digits;
  return null;
}

export function buildDirectCallHref(rawPhone?: string | null): string | null {
  if (!rawPhone || isPhoneMaskedOrInvalid(rawPhone)) return null;
  const cleaned = rawPhone.replace(/[^\d+]/g, '');
  if (cleaned.replace(/\D/g, '').length < 10) return null;
  return `tel:${cleaned}`;
}

export function buildWhatsAppHref(
  rawPhone: string | null | undefined,
  message?: string
): string | null {
  if (!rawPhone) return null;
  const waDigits = normalizeBangladeshPhoneForWa(rawPhone);
  if (!waDigits) return null;
  const base = `https://wa.me/${waDigits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function rankDonorsForSeeker(
  donors: Donor[],
  criteria: SeekerSearchCriteria
): RankedDonorResult[] {
  const nowMs = criteria.nowMs ?? Date.now();
  const lang = criteria.lang ?? 'en';
  const unsuccessfulSet =
    criteria.unsuccessfulDonorIds instanceof Set
      ? criteria.unsuccessfulDonorIds
      : new Set(criteria.unsuccessfulDonorIds || []);

  const compatibleGroups =
    criteria.bloodGroup === 'ALL'
      ? null
      : criteria.compatibleMatchEnabled
      ? getCompatibleDonors(criteria.bloodGroup)
      : [criteria.bloodGroup];

  const areaLower = (criteria.areaQuery || '').trim().toLowerCase();
  const results: RankedDonorResult[] = [];

  for (const donor of donors) {
    // 1. Blood group filter
    let bloodMatchType: 'EXACT' | 'COMPATIBLE' | 'EXCHANGE' = 'EXACT';
    if (criteria.bloodGroup !== 'ALL') {
      if (donor.bloodGroup === criteria.bloodGroup) {
        bloodMatchType = 'EXACT';
      } else if (compatibleGroups && compatibleGroups.includes(donor.bloodGroup)) {
        bloodMatchType = 'COMPATIBLE';
      } else if (criteria.exchangeAllowed) {
        bloodMatchType = 'EXCHANGE';
      } else {
        continue;
      }
    }

    // 2. Location / Nearby-District filter
    const donorCoords = resolveDonorCoordinates(donor);
    const distanceKm = calculateHaversineDistance(criteria.originCoords, donorCoords);

    if (criteria.maxRadiusKm && criteria.maxRadiusKm > 0) {
      if (distanceKm > criteria.maxRadiusKm) continue;
    } else if (!criteria.includeNearbyDistricts) {
      if (!doesDivisionMatch(donor.division, criteria.division)) {
        continue;
      }
      if (!doesDistrictMatch(donor.district, criteria.district)) {
        continue;
      }
    } else if (criteria.district && criteria.district !== 'ALL') {
      // Nearby districts mode: allow within 85km of selected district center
      const selectedDistCenter = resolveBangladeshCoordinates({ district: criteria.district });
      const distFromSelectedDistrict = calculateHaversineDistance(selectedDistCenter, donorCoords);
      if (!doesDistrictMatch(donor.district, criteria.district) && distFromSelectedDistrict > 85) {
        continue;
      }
    }

    if (areaLower) {
      const hay = `${donor.name} ${donor.upazila} ${donor.district} ${donor.hospitalAffiliation || ''}`.toLowerCase();
      if (!hay.includes(areaLower)) continue;
    }

    const availabilityConfidence = getDonorAvailabilityConfidence(donor, nowMs);
    const recovery = calculateRecoveryCountdown(donor.lastDonatedDate, 'WHOLE_BLOOD', lang);

    if (criteria.onlyConfirmedOrAvailable) {
      if (
        availabilityConfidence === 'DND' ||
        availabilityConfidence === 'TEMPORARILY_UNAVAILABLE' ||
        !recovery.isEligible
      ) {
        continue;
      }
    }

    const consent = canSeekerViewDirectContact(donor, Boolean(criteria.seekerIsVerifiedUser));
    const wasAttemptedUnsuccessfully = unsuccessfulSet.has(donor.id);

    // Multi-factor emergency ranking score
    let score = 0;

    // A. Blood match priority
    if (bloodMatchType === 'EXACT') score += 45;
    else if (bloodMatchType === 'COMPATIBLE') score += 26;
    else score += 8;

    // B. Availability & recent confirmation priority
    if (availabilityConfidence === 'CONFIRMED_RECENT') score += 42;
    else if (availabilityConfidence === 'UNKNOWN_UNCONFIRMED') score += 16;
    else if (availabilityConfidence === 'TEMPORARILY_UNAVAILABLE') score -= 45;
    else if (availabilityConfidence === 'DND') score -= 110;

    // C. 90-day medical eligibility
    if (recovery.isEligible) score += 25;
    else score -= 60;

    // D. Approximate proximity (vital when urgency is CRITICAL / IMMEDIATE_2H)
    const urgencyDistanceWeight =
      criteria.urgency === 'CRITICAL' || criteria.requiredTimeWindow === 'IMMEDIATE_2H' ? 1.45 : 1.0;
    const proximityPoints = Math.max(0, 35 - distanceKm * 0.75) * urgencyDistanceWeight;
    score += proximityPoints;

    // E. Low-friction direct contact opt-in & recent activity
    if (consent.allowed) score += 12;
    if (donor.verifiedBadge) score += 6;
    const recentTouchMs = Math.max(donor.availabilityConfirmedAtMs || 0, donor.updatedAtMs || 0);
    if (recentTouchMs > 0) {
      const ageHours = (nowMs - recentTouchMs) / (1000 * 60 * 60);
      if (ageHours <= 24) score += 10;
      else if (ageHours <= 168) score += 5;
    }

    // F. Demote already-tried unsuccessful donors so next donor surfaces immediately
    if (wasAttemptedUnsuccessfully) {
      score -= 200;
    }

    results.push({
      donor,
      matchScore: Math.round(score * 10) / 10,
      bloodMatchType,
      distanceKm,
      availabilityConfidence,
      isMedicallyEligible: recovery.isEligible,
      recoveryDaysLeft: recovery.remainingDays,
      canDirectContactImmediately: consent.allowed && recovery.isEligible,
      freshnessLabel: formatAvailabilityTimestamp(donor, lang, nowMs),
      wasAttemptedUnsuccessfully,
    });
  }

  results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return a.distanceKm - b.distanceKm;
  });

  return results;
}

export interface EscalationPlan {
  nextLevel: number;
  radiusKm: number;
  includeNearbyDistricts: boolean;
  tierLabelEn: string;
  tierLabelBn: string;
  eligibleDonorsToNotify: Donor[];
}

const ESCALATION_STEPS = [
  { level: 0, radiusKm: 10, includeNearbyDistricts: false, en: '10 km Local Radius', bn: '১০ কিমি স্থানীয় পরিধি' },
  { level: 1, radiusKm: 25, includeNearbyDistricts: false, en: '25 km District Radius', bn: '২৫ কিমি জেলা পরিধি' },
  { level: 2, radiusKm: 50, includeNearbyDistricts: true, en: '50 km + Nearby Areas', bn: '৫০ কিমি ও পার্শ্ববর্তী অঞ্চল' },
  { level: 3, radiusKm: 90, includeNearbyDistricts: true, en: 'Nearby Districts (90 km)', bn: 'পার্শ্ববর্তী জেলাসমূহ (৯০ কিমি)' },
  { level: 4, radiusKm: 600, includeNearbyDistricts: true, en: 'All Bangladesh Network', bn: 'সারাদেশ জরুরি নেটওয়ার্ক' },
];

export function computeEscalationTargets(params: {
  targetLevel: number;
  bloodGroup: BloodGroup;
  originDistrict: string;
  originCoords?: Coordinates;
  allDonors: Donor[];
  alreadyNotifiedDonorIds: Iterable<string>;
  excludeUid?: string;
  exchangeAllowed?: boolean;
}): EscalationPlan {
  const stepIndex = Math.min(ESCALATION_STEPS.length - 1, Math.max(0, params.targetLevel));
  const step = ESCALATION_STEPS[stepIndex];
  const origin =
    params.originCoords || resolveBangladeshCoordinates({ district: params.originDistrict });
  const notifiedSet = new Set(params.alreadyNotifiedDonorIds);
  const compatible = getCompatibleDonors(params.bloodGroup);

  const candidates = params.allDonors.filter((d) => {
    if (!d.id || d.id === params.excludeUid) return false;
    if (notifiedSet.has(d.id)) return false;

    // Respect donor consent, DND, and alert pause controls
    const status = resolveEffectiveAvailabilityStatus(d);
    if (status !== 'AVAILABLE' || !d.available) return false;
    if (d.alertsPaused === true) return false;
    if (d.emergencyAlertsOptIn === false) return false;

    const recovery = calculateRecoveryCountdown(d.lastDonatedDate, 'WHOLE_BLOOD', 'en');
    if (!recovery.isEligible) return false;

    const groupMatches =
      compatible.includes(d.bloodGroup) || Boolean(params.exchangeAllowed);
    if (!groupMatches) return false;

    const coords = resolveDonorCoordinates(d);
    const distKm = calculateHaversineDistance(origin, coords);
    if (step.level === 0 && doesDistrictMatch(d.district, params.originDistrict) && distKm <= 22) {
      return true;
    }
    return distKm <= step.radiusKm;
  });

  // Rank candidates so closest exact-match confirmed donors are notified first
  const ranked = rankDonorsForSeeker(candidates, {
    bloodGroup: params.bloodGroup,
    compatibleMatchEnabled: true,
    exchangeAllowed: params.exchangeAllowed,
    originCoords: origin,
    includeNearbyDistricts: true,
  });

  return {
    nextLevel: step.level,
    radiusKm: step.radiusKm,
    includeNearbyDistricts: step.includeNearbyDistricts,
    tierLabelEn: step.en,
    tierLabelBn: step.bn,
    eligibleDonorsToNotify: ranked.slice(0, 25).map((r) => r.donor),
  };
}

export function deriveRequestLifecycleState(
  req: BloodRequest,
  nowMs: number = Date.now()
): RequestLifecycleState {
  if (req.status === 'CANCELLED' || req.lifecycleState === 'CANCELLED') return 'CANCELLED';
  if (req.status === 'FULFILLED' || req.lifecycleState === 'FULFILLED') return 'FULFILLED';
  if (
    req.status === 'EXPIRED' ||
    req.lifecycleState === 'EXPIRED' ||
    (req.expiresAtMs && nowMs > req.expiresAtMs)
  ) {
    return 'EXPIRED';
  }
  if (req.confirmedDonorId || req.lifecycleState === 'DONOR_CONFIRMED') {
    return 'DONOR_CONFIRMED';
  }
  if (req.lifecycleState === 'NO_RESPONSE') {
    return 'NO_RESPONSE';
  }
  if ((req.contactAttemptsCount || 0) > 0 || req.lifecycleState === 'CONTACT_ATTEMPTED') {
    return 'CONTACT_ATTEMPTED';
  }
  if (
    (req.responders && req.responders.length > 0) ||
    (req.respondedCount || 0) > 0 ||
    req.lifecycleState === 'RESPONSES_RECEIVED'
  ) {
    return 'RESPONSES_RECEIVED';
  }
  if ((req.notifiedCount || 0) > 0 || req.lifecycleState === 'DONORS_NOTIFIED') {
    return 'DONORS_NOTIFIED';
  }
  return 'SEARCHING';
}
