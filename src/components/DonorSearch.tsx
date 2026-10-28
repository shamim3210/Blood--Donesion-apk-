import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Donor,
  BloodGroup,
  Language,
  UrgencyLevel,
  RequiredTimeWindow,
} from '../types';
import { DIVISIONS, DISTRICTS } from '../data/bangladeshGeo';
import { ALL_BLOOD_GROUPS, getCompatibleDonors } from '../data/compatibility';
import { getTranslation } from '../utils/translations';
import { auth, fetchUnmaskedDonorContactIfAuthorized } from '../firebase';
import {
  requestRealDeviceGPS,
  requestFreshHighAccuracyGPS,
  DEFAULT_BANGLADESH_COORDS,
  resolveBangladeshCoordinates,
  formatDistance,
  Coordinates,
} from '../utils/geolocation';
import {
  rankDonorsForSeeker,
  canSeekerViewDirectContact,
  buildDirectCallHref,
  buildWhatsAppHref,
  isPhoneMaskedOrInvalid,
} from '../utils/donorMatcher';
import {
  Search,
  MapPin,
  Phone,
  Star,
  CheckCircle2,
  Clock,
  Heart,
  RotateCcw,
  MessageSquare,
  UserPlus,
  Mic,
  MicOff,
  Navigation,
  Moon,
  GraduationCap,
  Lock,
  SkipForward,
  Expand,
  AlertTriangle,
  SlidersHorizontal,
  Bookmark,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface DonorSearchProps {
  donors: Donor[];
  lang: Language;
  presetGroup?: BloodGroup | 'ALL';
  presetDistrict?: string;
  presetNonce?: number;
  onRevealPhone: (donor: Donor) => void;
  onOpenSOSModal: (context?: { bloodGroup?: BloodGroup; district?: string }) => void;
  onStartChatWithDonor?: (donor: Donor) => void;
  onOpenRegister?: () => void;
  unsuccessfulDonorIds?: string[];
  confirmedDonorId?: string | null;
  onRecordContactOutcome?: (donor: Donor, outcome: 'CONFIRMED' | 'NO_ANSWER') => void;
}

const PAGE_CHUNK = 24;

function matchesSelectedUpazila(donor: Donor, selectedDistrict: string, selectedUpazila: string): boolean {
  if (selectedUpazila === 'ALL') return true;
  const distObj = DISTRICTS.find(
    (d) =>
      d.id === selectedDistrict.toLowerCase() ||
      d.nameBn === selectedDistrict.trim() ||
      d.nameEn.toLowerCase() === selectedDistrict.trim().toLowerCase()
  );
  const upzObj = distObj?.upazilas.find((u) => u.id === selectedUpazila);
  const dUpz = (donor.upazila || '').trim().toLowerCase();
  if (dUpz === selectedUpazila.toLowerCase()) return true;
  if (upzObj) {
    return (
      donor.upazila.trim() === upzObj.nameBn ||
      dUpz === upzObj.nameEn.toLowerCase()
    );
  }
  return false;
}

const DonorSearchComponent: React.FC<DonorSearchProps> = ({
  donors,
  lang,
  presetGroup,
  presetDistrict,
  presetNonce,
  onRevealPhone,
  onOpenSOSModal,
  onStartChatWithDonor,
  onOpenRegister,
  unsuccessfulDonorIds: externalUnsuccessfulIds,
  confirmedDonorId,
  onRecordContactOutcome,
}) => {
  const t = getTranslation(lang);

  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'ALL'>(
    presetGroup || 'ALL'
  );
  const [includeCompatible, setIncludeCompatible] = useState<boolean>(true);
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    presetDistrict || 'ALL'
  );
  const [selectedUpazila, setSelectedUpazila] = useState<string>('ALL');
  const [urgency, setUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [requiredTimeWindow, setRequiredTimeWindow] =
    useState<RequiredTimeWindow>('IMMEDIATE_2H');
  const [includeNearbyDistricts, setIncludeNearbyDistricts] = useState<boolean>(false);

  // Progressive-disclosure advanced filters & saved shortlist
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [onlyShortlisted, setOnlyShortlisted] = useState<boolean>(false);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('bloodsearch_shortlisted_donors');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === 'string');
      }
    } catch {}
    return [];
  });
  const [copiedDonorId, setCopiedDonorId] = useState<string | null>(null);

  useEffect(() => {
    if (presetGroup !== undefined) {
      setSelectedGroup(presetGroup);
    }
    if (presetDistrict !== undefined) {
      setSelectedDistrict(presetDistrict);
      setSelectedUpazila('ALL');
    }
  }, [presetGroup, presetDistrict, presetNonce]);

  const toggleShortlistDonor = useCallback((donorId: string) => {
    setShortlistedIds((prev) => {
      const next = prev.includes(donorId)
        ? prev.filter((id) => id !== donorId)
        : [donorId, ...prev];
      try {
        localStorage.setItem('bloodsearch_shortlisted_donors', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const handleCopyDirectPhone = useCallback((donorId: string, rawPhone: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(rawPhone).catch(() => {});
      setCopiedDonorId(donorId);
      window.setTimeout(() => {
        setCopiedDonorId((curr) => (curr === donorId ? null : curr));
      }, 2200);
    }
  }, []);

  // Location Anchor (Live GPS vs Manual District Fallback when GPS is unavailable)
  const [locationMode, setLocationMode] = useState<'GPS' | 'MANUAL'>('GPS');
  const [gpsAvailable, setGpsAvailable] = useState<boolean>(false);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [manualAnchorDistrict, setManualAnchorDistrict] = useState<string>('dhaka');
  const [userCoords, setUserCoords] = useState<Coordinates>(DEFAULT_BANGLADESH_COORDS);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [onlyRareNegative, setOnlyRareNegative] = useState<boolean>(false);
  const [onlyNightReady, setOnlyNightReady] = useState<boolean>(false);
  const [onlyCampusClub, setOnlyCampusClub] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_CHUNK);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Local unsuccessful attempt tracking (merged with parent prop if provided)
  const [localUnsuccessfulIds, setLocalUnsuccessfulIds] = useState<string[]>([]);
  const [outcomeBanner, setOutcomeBanner] = useState<string | null>(null);

  // Cache of authorized unmasked direct contacts for opted-in cloud donors so 1-tap Call/WhatsApp works immediately
  const [resolvedDirectContacts, setResolvedDirectContacts] = useState<
    Record<
      string,
      {
        phone: string;
        whatsappPhone?: string;
        allowCall?: boolean;
        allowWhatsApp?: boolean;
      }
    >
  >({});

  const isVerifiedSeeker = Boolean(
    auth.currentUser && (auth.currentUser.emailVerified || auth.currentUser.phoneNumber)
  );

  // Attempt live GPS on load; fall back cleanly to manual district selection if unavailable
  useEffect(() => {
    let active = true;
    requestRealDeviceGPS()
      .then((coords) => {
        if (!active) return;
        setUserCoords(coords);
        const isDefaultFallback =
          coords.latitude === DEFAULT_BANGLADESH_COORDS.latitude &&
          coords.longitude === DEFAULT_BANGLADESH_COORDS.longitude;
        setGpsAvailable(!isDefaultFallback);
        if (isDefaultFallback) {
          setLocationMode('MANUAL');
        }
      })
      .catch(() => {
        if (active) {
          setGpsAvailable(false);
          setLocationMode('MANUAL');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  // Sync manual anchor when user picks a specific filter district
  useEffect(() => {
    if (selectedDistrict !== 'ALL') {
      setManualAnchorDistrict(selectedDistrict);
    }
  }, [selectedDistrict]);

  const effectiveOriginCoords = useMemo<Coordinates>(() => {
    if (locationMode === 'GPS' && gpsAvailable) {
      return userCoords;
    }
    const anchorDist = selectedDistrict !== 'ALL' ? selectedDistrict : manualAnchorDistrict;
    return resolveBangladeshCoordinates({
      district: anchorDist,
      upazila: selectedUpazila !== 'ALL' ? selectedUpazila : undefined,
    });
  }, [locationMode, gpsAvailable, userCoords, selectedDistrict, manualAnchorDistrict, selectedUpazila]);

  const handleLocateLiveGps = async () => {
    setIsLocatingGps(true);
    try {
      const res = await requestFreshHighAccuracyGPS();
      setUserCoords(res.coords);
      setGpsAvailable(res.isRealGps);
      setLocationMode(res.isRealGps ? 'GPS' : 'MANUAL');
    } finally {
      setIsLocatingGps(false);
    }
  };

  useEffect(() => {
    setVisibleCount(PAGE_CHUNK);
  }, [
    selectedGroup,
    includeCompatible,
    selectedDivision,
    selectedDistrict,
    selectedUpazila,
    urgency,
    requiredTimeWindow,
    includeNearbyDistricts,
    onlyAvailable,
    onlyVerified,
    onlyRareNegative,
    onlyNightReady,
    onlyCampusClub,
    searchQuery,
    locationMode,
    manualAnchorDistrict,
  ]);

  const handleToggleVoice = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceNotice(
        lang === 'bn'
          ? 'আপনার ব্রাউজারে ভয়েস সার্চ সমর্থন করে না। লিখে বা ফিল্টার দিয়ে খুঁজুন।'
          : 'Voice search is not supported in this browser. Please use filters or type your search.'
      );
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'bn' ? 'bn-BD' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSearchQuery(transcript);
          const lower = transcript.toLowerCase();
          if (lower.includes('b+') || lower.includes('বি পজিটিভ')) setSelectedGroup('B+');
          else if (lower.includes('o+') || lower.includes('ও পজিটিভ')) setSelectedGroup('O+');
          else if (lower.includes('a+') || lower.includes('এ পজিটিভ')) setSelectedGroup('A+');
          else if (lower.includes('ab+') || lower.includes('এবি পজিটিভ')) setSelectedGroup('AB+');
          else if (lower.includes('o-') || lower.includes('ও নেগেটিভ')) setSelectedGroup('O-');
          else if (lower.includes('b-') || lower.includes('বি নেগেটিভ')) setSelectedGroup('B-');
          else if (lower.includes('a-') || lower.includes('এ নেগেটিভ')) setSelectedGroup('A-');
          else if (lower.includes('ab-') || lower.includes('এবি নেগেটিভ')) setSelectedGroup('AB-');
        }
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const availableDistricts = useMemo(() => {
    if (selectedDivision === 'ALL') return DISTRICTS;
    return DISTRICTS.filter((d) => d.divisionId === selectedDivision);
  }, [selectedDivision]);

  const availableUpazilas = useMemo(() => {
    if (selectedDistrict === 'ALL') return [];
    const districtObj = DISTRICTS.find((d) => d.id === selectedDistrict);
    return districtObj ? districtObj.upazilas : [];
  }, [selectedDistrict]);

  const handleDivisionChange = (divId: string) => {
    setSelectedDivision(divId);
    setSelectedDistrict('ALL');
    setSelectedUpazila('ALL');
    setIncludeNearbyDistricts(false);
  };

  const handleDistrictChange = (distId: string) => {
    setSelectedDistrict(distId);
    setSelectedUpazila('ALL');
    setIncludeNearbyDistricts(false);
  };

  const handleResetFilters = () => {
    setSelectedGroup('ALL');
    setSelectedDivision('ALL');
    setSelectedDistrict('ALL');
    setSelectedUpazila('ALL');
    setUrgency('CRITICAL');
    setRequiredTimeWindow('IMMEDIATE_2H');
    setIncludeNearbyDistricts(false);
    setSearchQuery('');
    setOnlyAvailable(false);
    setOnlyVerified(false);
    setOnlyRareNegative(false);
    setOnlyNightReady(false);
    setOnlyCampusClub(false);
    setOnlyShortlisted(false);
  };

  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (selectedDivision !== 'ALL') count += 1;
    if (selectedUpazila !== 'ALL') count += 1;
    if (urgency !== 'CRITICAL') count += 1;
    if (requiredTimeWindow !== 'IMMEDIATE_2H') count += 1;
    if (onlyVerified) count += 1;
    if (onlyRareNegative) count += 1;
    if (onlyNightReady) count += 1;
    if (onlyCampusClub) count += 1;
    return count;
  }, [
    selectedDivision,
    selectedUpazila,
    urgency,
    requiredTimeWindow,
    onlyVerified,
    onlyRareNegative,
    onlyNightReady,
    onlyCampusClub,
  ]);

  const combinedUnsuccessfulSet = useMemo(() => {
    const s = new Set<string>(localUnsuccessfulIds);
    (externalUnsuccessfulIds || []).forEach((id) => s.add(id));
    return s;
  }, [localUnsuccessfulIds, externalUnsuccessfulIds]);

  const handleMarkUnsuccessfulAndNext = useCallback(
    (donor: Donor) => {
      setLocalUnsuccessfulIds((prev) => (prev.includes(donor.id) ? prev : [...prev, donor.id]));
      if (onRecordContactOutcome) {
        onRecordContactOutcome(donor, 'NO_ANSWER');
      }
      setOutcomeBanner(
        lang === 'bn'
          ? `${donor.name}-কে 'সাড়া পাওয়া যায়নি' হিসেবে নিচে সরানো হয়েছে — পরবর্তী সেরা রক্তদাতা তালিকায় উপরে আনা হয়েছে।`
          : `Marked ${donor.name} as unreached and promoted the next best matching donor.`
      );
      window.setTimeout(() => setOutcomeBanner(null), 4000);
    },
    [lang, onRecordContactOutcome]
  );

  // Pre-filter secondary toggles, then run multi-factor emergency ranker (`rankDonorsForSeeker`)
  const rankedResults = useMemo(() => {
    const shortlistSet = new Set(shortlistedIds);
    const prefiltered = donors.filter((donor) => {
      if (onlyShortlisted && !shortlistSet.has(donor.id)) return false;
      if (!includeNearbyDistricts && !matchesSelectedUpazila(donor, selectedDistrict, selectedUpazila)) {
        return false;
      }
      if (onlyVerified && !donor.verifiedBadge) return false;
      if (onlyRareNegative && !donor.bloodGroup.endsWith('-')) return false;
      if (onlyNightReady) {
        const bioLower = `${donor.bio || ''} ${donor.hospitalAffiliation || ''}`.toLowerCase();
        const isNightVolunteer =
          donor.available &&
          (donor.verifiedBadge ||
            bioLower.includes('রাত') ||
            bioLower.includes('24') ||
            bioLower.includes('২৪') ||
            bioLower.includes('জরুরি') ||
            bioLower.includes('night') ||
            (donor.reliabilityScore || 0) >= 92);
        if (!isNightVolunteer) return false;
      }
      if (onlyCampusClub) {
        const affil = `${donor.hospitalAffiliation || ''} ${donor.bio || ''}`.toLowerCase();
        const isSquad =
          affil.includes('সন্ধানী') ||
          affil.includes('sandhani') ||
          affil.includes('বাঁধন') ||
          affil.includes('badhan') ||
          affil.includes('রেড ক্রিসেন্ট') ||
          affil.includes('red crescent') ||
          affil.includes('কোয়ান্টাম') ||
          affil.includes('quantum') ||
          affil.includes('মেডিকেল') ||
          affil.includes('medical') ||
          affil.includes('বিশ্ববিদ্যালয়') ||
          affil.includes('university') ||
          affil.includes('ক্লাব') ||
          donor.totalDonations >= 4;
        if (!isSquad) return false;
      }
      return true;
    });

    return rankDonorsForSeeker(prefiltered, {
      bloodGroup: selectedGroup,
      compatibleMatchEnabled: includeCompatible,
      division: selectedDivision,
      district: selectedDistrict,
      areaQuery: searchQuery,
      urgency,
      requiredTimeWindow,
      originCoords: effectiveOriginCoords,
      includeNearbyDistricts,
      onlyConfirmedOrAvailable: onlyAvailable,
      seekerIsVerifiedUser: isVerifiedSeeker,
      unsuccessfulDonorIds: combinedUnsuccessfulSet,
      lang,
    });
  }, [
    donors,
    onlyShortlisted,
    shortlistedIds,
    selectedGroup,
    includeCompatible,
    selectedDivision,
    selectedDistrict,
    selectedUpazila,
    urgency,
    requiredTimeWindow,
    effectiveOriginCoords,
    includeNearbyDistricts,
    onlyAvailable,
    onlyVerified,
    onlyRareNegative,
    onlyNightReady,
    onlyCampusClub,
    searchQuery,
    isVerifiedSeeker,
    combinedUnsuccessfulSet,
    lang,
  ]);

  const visibleRanked = useMemo(
    () => rankedResults.slice(0, visibleCount),
    [rankedResults, visibleCount]
  );

  // Pre-resolve authorized direct contacts for visible opted-in cloud donors so 1-tap Call/WhatsApp works without extra steps
  useEffect(() => {
    let cancelled = false;
    const toResolve = visibleRanked
      .map((r) => r.donor)
      .filter((d) => {
        if (!isPhoneMaskedOrInvalid(d.phone)) return false;
        if (resolvedDirectContacts[d.id]) return false;
        if (/^(d|donor-)\d+$/.test(d.id)) return false;
        return canSeekerViewDirectContact(d, isVerifiedSeeker).allowed;
      })
      .slice(0, 12);

    if (toResolve.length === 0) return;

    Promise.all(
      toResolve.map(async (d) => {
        const contact = await fetchUnmaskedDonorContactIfAuthorized(d.id).catch(() => null);
        return { id: d.id, contact };
      })
    ).then((items) => {
      if (cancelled) return;
      const patch: typeof resolvedDirectContacts = {};
      let added = 0;
      for (const item of items) {
        if (item.contact && !isPhoneMaskedOrInvalid(item.contact.phone)) {
          patch[item.id] = {
            phone: item.contact.phone,
            whatsappPhone: item.contact.whatsappPhone,
            allowCall: item.contact.allowCall,
            allowWhatsApp: item.contact.allowWhatsApp,
          };
          added += 1;
        }
      }
      if (added > 0) {
        setResolvedDirectContacts((prev) => ({ ...prev, ...patch }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [visibleRanked, isVerifiedSeeker, resolvedDirectContacts]);

  const confirmedRecentCount = useMemo(
    () => rankedResults.filter((r) => r.availabilityConfidence === 'CONFIRMED_RECENT').length,
    [rankedResults]
  );

  return (
    <div className="space-y-4 text-left">
      {/* Medical Emergency Service Disclaimer */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/35 border border-amber-300/80 dark:border-amber-800/70 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === 'bn'
            ? 'চিকিৎসা জরুরি বিজ্ঞপ্তি: BloodSearch একটি স্বেচ্ছাসেবী ডোনার যোগাযোগ মাধ্যম—এটি কোনো জরুরি মেডিকেল সার্ভিস নয় এবং রক্তের নিশ্চয়তা প্রদান করে না। জীবন-মরণ পরিস্থিতিতে অবিলম্বে হাসপাতালের ব্লাড ব্যাংক, চিকিৎসক অথবা জাতীয় জরুরি সেবা ৯৯৯ / স্বাস্থ্য বাতায়ন ১৬২৬৩-এ যোগাযোগ করুন।'
            : 'Medical Disclaimer: BloodSearch is a voluntary donor directory, not an emergency medical service, and cannot guarantee blood availability. Always contact your hospital blood bank, attending physician, or emergency helpline 999 / 16263 immediately.'}
        </p>
      </div>

      {outcomeBanner && (
        <div className="p-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold">
          {outcomeBanner}
        </div>
      )}

      {/* Search & Emergency Matching Panel (Clean Progressive Disclosure) */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 transition-colors shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.searchTitle}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'রক্তের গ্রুপ ও জেলা নির্বাচন করলেই সবচেয়ে নিকটস্থ প্রস্তুত ডোনার সবার উপরে দেখাবে'
                : 'Select blood group & district to see closest confirmed donors first'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenRegister && (
              <button
                type="button"
                onClick={onOpenRegister}
                className="min-h-[42px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl btn-emerald cursor-pointer whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>{lang === 'bn' ? '+ ডোনার হোন' : '+ Register Donor'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="min-h-[42px] flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl btn-surface cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                onOpenSOSModal({
                  bloodGroup: selectedGroup !== 'ALL' ? selectedGroup : undefined,
                  district: selectedDistrict !== 'ALL' ? selectedDistrict : undefined,
                })
              }
              className="min-h-[42px] flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl btn-crimson cursor-pointer whitespace-nowrap shrink-0"
            >
              <Heart className="w-3.5 h-3.5 fill-white shrink-0" />
              <span>{lang === 'bn' ? 'জরুরি ব্রডকাস্ট (SOS)' : 'Emergency Broadcast'}</span>
            </button>
          </div>
        </div>

        {/* Step 1: 1-Tap Blood Group Segmented Selector */}
        <div className="pt-3.5 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t.selectBloodGroup}
            </label>
            {selectedGroup !== 'ALL' && (
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCompatible}
                  onChange={(e) => setIncludeCompatible(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span>
                  {t.includeCompatible}
                  {includeCompatible && (
                    <span className="text-rose-600 dark:text-rose-400 ml-1 font-semibold">
                      ({getCompatibleDonors(selectedGroup).join(', ')})
                    </span>
                  )}
                </span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedGroup('ALL')}
              className={`min-h-[44px] px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl cursor-pointer whitespace-nowrap shrink-0 ${
                selectedGroup === 'ALL' ? 'btn-crimson' : 'btn-surface'
              }`}
            >
              {t.allBloodGroups}
            </button>

            {ALL_BLOOD_GROUPS.map((group) => {
              const isSelected = selectedGroup === group;
              return (
                <button
                  type="button"
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`min-h-[44px] min-w-[50px] px-3 py-2 text-xs sm:text-sm font-bold rounded-xl cursor-pointer whitespace-nowrap shrink-0 ${
                    isSelected ? 'btn-crimson' : 'btn-surface'
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Essential Primary Filter Bar (District + Area/Voice + GPS + Advanced Toggle) */}
        <div className="pt-3 grid grid-cols-1 @md:grid-cols-12 gap-2.5 items-end">
          <div className="@md:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {t.selectDistrict}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#0d1322] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="ALL">{t.allDistricts}</option>
              {availableDistricts.map((dist) => (
                <option key={dist.id} value={dist.id}>
                  {lang === 'bn' ? dist.nameBn : dist.nameEn}
                </option>
              ))}
            </select>
          </div>

          <div className="@md:col-span-5">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'এলাকা, হাসপাতাল বা নাম (ভয়েস সহ)' : 'Area, Hospital or Name'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={
                  isListening
                    ? lang === 'bn'
                      ? 'শুনছি... মুখে বলুন'
                      : 'Listening... Speak now'
                    : t.searchPlaceholder
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-11 pl-9 pr-11 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#0d1322] text-slate-900 dark:text-white placeholder:text-slate-400 border transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  isListening
                    ? 'border-rose-500 ring-2 ring-rose-500/30'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`absolute right-1.5 top-1.5 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={lang === 'bn' ? 'ভয়েস সার্চ' : 'Voice Search'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            {voiceNotice && (
              <p className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                {voiceNotice}
              </p>
            )}
          </div>

          <div className="@md:col-span-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleLocateLiveGps}
              disabled={isLocatingGps}
              className={`flex-1 min-h-[44px] px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                locationMode === 'GPS' && gpsAvailable ? 'btn-emerald' : 'btn-surface'
              }`}
              title={lang === 'bn' ? 'লাইভ GPS দূরত্ব গণনা' : 'Calculate live GPS distance'}
            >
              <Navigation className="w-3.5 h-3.5 shrink-0" />
              <span>
                {isLocatingGps
                  ? '...'
                  : locationMode === 'GPS' && gpsAvailable
                  ? lang === 'bn'
                    ? 'GPS সক্রিয়'
                    : 'GPS On'
                  : 'GPS'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters((v) => !v)}
              className={`flex-1 min-h-[44px] px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                showAdvancedFilters || activeAdvancedFilterCount > 0
                  ? 'btn-obsidian'
                  : 'btn-surface'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span>
                {lang === 'bn' ? 'ফিল্টার' : 'Filters'}
                {activeAdvancedFilterCount > 0 ? ` (${activeAdvancedFilterCount})` : ''}
              </span>
              {showAdvancedFilters ? (
                <ChevronUp className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Progressive-Disclosure Collapsible Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-5 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.selectDivision}
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full h-11 px-3 text-xs rounded-xl bg-white dark:bg-[#0d1322] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="ALL">{t.allDivisions}</option>
                  {DIVISIONS.map((div) => (
                    <option key={div.id} value={div.id}>
                      {lang === 'bn' ? div.nameBn : div.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.selectUpazila}
                </label>
                <select
                  value={selectedUpazila}
                  disabled={selectedDistrict === 'ALL' || availableUpazilas.length === 0}
                  onChange={(e) => setSelectedUpazila(e.target.value)}
                  className="w-full h-11 px-3 text-xs rounded-xl bg-white dark:bg-[#0d1322] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 cursor-pointer"
                >
                  <option value="ALL">{t.allUpazilas}</option>
                  {availableUpazilas.map((upz) => (
                    <option key={upz.id} value={upz.id}>
                      {lang === 'bn' ? upz.nameBn : upz.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'জরুরিতার মাত্রা' : 'Urgency Level'}
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                  className="w-full h-11 px-3 text-xs rounded-xl bg-white dark:bg-[#0d1322] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="CRITICAL">
                    {lang === 'bn' ? 'জীবন-মরণ জরুরি (Critical)' : 'Critical (Immediate)'}
                  </option>
                  <option value="URGENT">
                    {lang === 'bn' ? 'জরুরি (Urgent)' : 'Urgent (Today)'}
                  </option>
                  <option value="STANDARD">
                    {lang === 'bn' ? 'সাধারণ / নির্ধারিত' : 'Standard / Scheduled'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'কখন রক্ত প্রয়োজন' : 'Required Time'}
                </label>
                <select
                  value={requiredTimeWindow}
                  onChange={(e) => setRequiredTimeWindow(e.target.value as RequiredTimeWindow)}
                  className="w-full h-11 px-3 text-xs rounded-xl bg-white dark:bg-[#0d1322] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="IMMEDIATE_2H">
                    {lang === 'bn' ? 'এখনই / ২ ঘণ্টার মধ্যে' : 'Immediate (Within 2h)'}
                  </option>
                  <option value="TODAY_6H">
                    {lang === 'bn' ? 'আজ ৬ ঘণ্টার মধ্যে' : 'Today (Within 6h)'}
                  </option>
                  <option value="WITHIN_24H">
                    {lang === 'bn' ? '২৪ ঘণ্টার মধ্যে' : 'Within 24 hours'}
                  </option>
                  <option value="SCHEDULED">
                    {lang === 'bn' ? 'নির্ধারিত তারিখ' : 'Scheduled Later'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {lang === 'bn' ? 'ম্যানুয়াল দূরত্ব কেন্দ্র' : 'Manual Distance Origin'}
                </label>
                <select
                  value={selectedDistrict !== 'ALL' ? selectedDistrict : manualAnchorDistrict}
                  onChange={(e) => {
                    setLocationMode('MANUAL');
                    setManualAnchorDistrict(e.target.value);
                  }}
                  aria-label="Manual Location Anchor District"
                  className="w-full h-11 px-2.5 text-xs rounded-xl bg-white dark:bg-[#0d1322] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {lang === 'bn' ? `কেন্দ্র: ${d.nameBn}` : `Origin: ${d.nameEn}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300 min-h-[38px] px-2.5 rounded-xl bg-slate-50 dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800">
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span>{t.verifiedOnly}</span>
              </label>

              <button
                type="button"
                onClick={() => setOnlyRareNegative((v) => !v)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  onlyRareNegative ? 'btn-crimson' : 'btn-surface'
                }`}
              >
                <span>{lang === 'bn' ? 'নেগেটিভ গ্রুপ' : 'Rare Negative'}</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlyNightReady((v) => !v)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  onlyNightReady ? 'btn-obsidian' : 'btn-surface'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'গভীর রাতে প্রস্তুত' : 'Night Ready'}</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlyCampusClub((v) => !v)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  onlyCampusClub ? 'btn-obsidian' : 'btn-surface'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ক্যাম্পাস ক্লাব' : 'Campus & Clubs'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Essential Quick Status Bar: Available Only + Saved Shortlist + Expand Nearby + Live Count */}
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOnlyAvailable((v) => !v)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                onlyAvailable ? 'btn-emerald' : 'btn-surface'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{t.availableOnly}</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyShortlisted((v) => !v)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                onlyShortlisted ? 'btn-crimson' : 'btn-surface'
              }`}
              title={
                lang === 'bn'
                  ? 'বুকমার্ক করে রাখা ডোনারদের তালিকা'
                  : 'View bookmarked/shortlisted donors'
              }
            >
              <Bookmark
                className={`w-3.5 h-3.5 shrink-0 ${onlyShortlisted ? 'fill-white' : ''}`}
              />
              <span className="tabular-nums">
                {lang === 'bn'
                  ? `সংরক্ষিত (${shortlistedIds.length})`
                  : `Saved (${shortlistedIds.length})`}
              </span>
            </button>

            {selectedDistrict !== 'ALL' && (
              <button
                type="button"
                onClick={() => setIncludeNearbyDistricts((v) => !v)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  includeNearbyDistricts ? 'btn-emerald' : 'btn-surface'
                }`}
              >
                <Expand className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? includeNearbyDistricts
                      ? '✓ পার্শ্ববর্তী জেলা যুক্ত'
                      : '+ পার্শ্ববর্তী জেলা যুক্ত করুন'
                    : includeNearbyDistricts
                    ? '✓ Nearby Districts Included'
                    : '+ Nearby Districts'}
                </span>
              </button>
            )}
          </div>

          {/* Clean Tabular Count Summary */}
          <div className="text-xs text-slate-600 dark:text-slate-300 tabular-nums">
            <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">
              {rankedResults.length}
            </span>{' '}
            {t.donorsFound}
            <span aria-hidden="true"> · </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
              {confirmedRecentCount}{' '}
              {lang === 'bn' ? 'সাম্প্রতিক নিশ্চিতকৃত' : 'recently confirmed'}
            </span>
          </div>
        </div>
      </div>

      {/* Donors Card Grid */}
      {rankedResults.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {donors.length === 0
                ? lang === 'bn'
                  ? 'এখনো কোনো নিবন্ধিত রক্তদাতা যুক্ত হননি'
                  : 'No Registered Donors Yet'
                : t.noDonorsFound}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              {donors.length === 0
                ? lang === 'bn'
                  ? 'সব ফেইক ডাটা মুছে ১০০% রিয়েল-ইউজার মোড চালু আছে। নতুন রক্তদাতা লগইন বা রেজিস্ট্রেশন করলেই অটোমেটিক এখানে সেভ হয়ে দেখাবে।'
                  : '100% real-user mode is active. Every new donor who signs in or registers will automatically save and appear here.'
                : lang === 'bn'
                  ? 'এই ফিল্টারে কোনো রক্তদাতা পাওয়া যায়নি। এক ক্লিকে পার্শ্ববর্তী জেলা যুক্ত করুন অথবা জরুরি ব্রডকাস্ট পাঠান।'
                  : 'No matching donors in this narrow area. Expand your search radius in one click or send an emergency broadcast.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {(selectedDistrict !== 'ALL' || selectedDivision !== 'ALL' || onlyAvailable) && (
              <button
                type="button"
                onClick={() => {
                  if (selectedDistrict !== 'ALL' && !includeNearbyDistricts) {
                    setIncludeNearbyDistricts(true);
                  } else {
                    setSelectedUpazila('ALL');
                    setSelectedDistrict('ALL');
                    setSelectedDivision('ALL');
                    setOnlyAvailable(false);
                  }
                }}
                className="min-h-[44px] px-4 py-2.5 btn-obsidian font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Expand className="w-4 h-4 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'সার্চ পরিধি ও পার্শ্ববর্তী জেলা প্রসারিত করুন'
                    : 'Expand Search Radius & Nearby Districts'}
                </span>
              </button>
            )}
            {onOpenRegister && (
              <button
                type="button"
                onClick={onOpenRegister}
                className="min-h-[44px] px-4 py-2.5 btn-emerald font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>
                  {lang === 'bn' ? '+ ডোনার হিসেবে নাম যুক্ত করুন' : '+ Register as Donor'}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                onOpenSOSModal({
                  bloodGroup: selectedGroup !== 'ALL' ? selectedGroup : undefined,
                  district: selectedDistrict !== 'ALL' ? selectedDistrict : undefined,
                })
              }
              className="min-h-[44px] px-4 py-2.5 btn-crimson font-bold text-xs rounded-xl cursor-pointer inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Heart className="w-4 h-4 fill-white shrink-0" />
              <span>{t.createSosTitle}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 @xl:grid-cols-2 gap-3.5">
            {visibleRanked.map((entry) => {
              const {
                donor,
                bloodMatchType,
                distanceKm,
                availabilityConfidence,
                isMedicallyEligible,
                recoveryDaysLeft,
                freshnessLabel,
                wasAttemptedUnsuccessfully,
              } = entry;

              const districtObj = DISTRICTS.find(
                (d) =>
                  d.id === donor.district.toLowerCase() ||
                  d.nameBn === donor.district.trim() ||
                  d.nameEn.toLowerCase() === donor.district.trim().toLowerCase()
              );
              const districtName = districtObj
                ? lang === 'bn'
                  ? districtObj.nameBn
                  : districtObj.nameEn
                : donor.district;
              const upazilaObj = districtObj?.upazilas.find(
                (u) =>
                  u.id === donor.upazila.toLowerCase() ||
                  u.nameBn === donor.upazila.trim() ||
                  u.nameEn.toLowerCase() === donor.upazila.trim().toLowerCase()
              );
              const upazilaName = upazilaObj
                ? lang === 'bn'
                  ? upazilaObj.nameBn
                  : upazilaObj.nameEn
                : donor.upazila;

              const consentCheck = canSeekerViewDirectContact(donor, isVerifiedSeeker);
              const cachedDirect = resolvedDirectContacts[donor.id];

              const effectiveRawPhone =
                cachedDirect?.phone ||
                (!isPhoneMaskedOrInvalid(donor.phone) && consentCheck.allowed
                  ? donor.phone
                  : null);
              const effectiveWaPhone =
                cachedDirect?.whatsappPhone ||
                (!isPhoneMaskedOrInvalid(donor.whatsappPhone) && consentCheck.allowed
                  ? donor.whatsappPhone
                  : effectiveRawPhone);

              const allowCall = cachedDirect?.allowCall ?? donor.allowCall !== false;
              const allowWhatsApp =
                cachedDirect?.allowWhatsApp ?? donor.allowWhatsApp !== false;

              const directCallHref =
                consentCheck.allowed && allowCall ? buildDirectCallHref(effectiveRawPhone) : null;
              const directWaHref =
                consentCheck.allowed && allowWhatsApp
                  ? buildWhatsAppHref(
                      effectiveWaPhone,
                      lang === 'bn'
                        ? `আসসালামু আলাইকুম ${donor.name}, জরুরি রক্তের (${donor.bloodGroup}) প্রয়োজনে BloodSearch থেকে যোগাযোগ করছি। আপনি কি রক্তদানে প্রস্তুত আছেন?`
                        : `Hello ${donor.name}, reaching out via BloodSearch for an urgent ${donor.bloodGroup} blood need. Are you currently available?`
                    )
                  : null;

              const isConfirmedMatch = confirmedDonorId === donor.id;

              return (
                <div
                  key={donor.id}
                  className={`cv-auto bg-white dark:bg-[#111827] border rounded-2xl p-4 sm:p-5 transition-colors shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col justify-between ${
                    isConfirmedMatch
                      ? 'border-emerald-500 ring-1 ring-emerald-500'
                      : wasAttemptedUnsuccessfully
                      ? 'border-slate-200 dark:border-slate-800 opacity-75'
                      : 'border-slate-200/90 dark:border-slate-800/90 hover:border-rose-400 dark:hover:border-rose-600'
                  }`}
                >
                  <div>
                    {/* Top Row: Blood Group, Name & Clear Availability Confidence */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-2xl btn-crimson flex flex-col items-center justify-center font-black text-lg tracking-tight shrink-0">
                          <span>{donor.bloodGroup}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                              {donor.name}
                            </h3>
                            {donor.verifiedBadge && (
                              <span
                                title={t.verifiedDonor}
                                className="text-blue-500 dark:text-blue-400 shrink-0"
                              >
                                <CheckCircle2 className="w-4 h-4 fill-blue-500 text-white dark:fill-blue-400 dark:text-slate-900" />
                              </span>
                            )}
                          </div>
                          {/* Unboxed metadata line: Blood match type & affiliation */}
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {selectedGroup !== 'ALL' && (
                              <>
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {bloodMatchType === 'EXACT'
                                    ? lang === 'bn'
                                      ? 'সরাসরি গ্রুপ ম্যাচ'
                                      : 'Exact Match'
                                    : lang === 'bn'
                                    ? 'সামঞ্জস্যপূর্ণ ডোনার'
                                    : 'Compatible Match'}
                                </span>
                                {donor.hospitalAffiliation ? <span aria-hidden="true"> · </span> : null}
                              </>
                            )}
                            {donor.hospitalAffiliation && <span>{donor.hospitalAffiliation}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Availability Confidence + Distance + 1-Tap Bookmark */}
                      <div className="shrink-0 flex items-start gap-2">
                        <div className="text-right">
                          {availabilityConfidence === 'CONFIRMED_RECENT' ? (
                            <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                              {lang === 'bn' ? 'প্রস্তুতি নিশ্চিত' : 'Confirmed Available'}
                            </div>
                          ) : availabilityConfidence === 'UNKNOWN_UNCONFIRMED' ? (
                            <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                              {lang === 'bn' ? 'স্ট্যাটাস অজানা' : 'Status Unknown'}
                            </div>
                          ) : availabilityConfidence === 'DND' ? (
                            <div className="text-xs font-bold text-slate-500">
                              {lang === 'bn' ? 'সাময়িক বিরতি' : 'Paused'}
                            </div>
                          ) : (
                            <div className="text-xs font-bold text-slate-500">
                              {lang === 'bn' ? 'সাময়িক অনুপস্থিত' : 'Unavailable'}
                            </div>
                          )}
                          <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                            ~{formatDistance(distanceKm, lang)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleShortlistDonor(donor.id)}
                          aria-label={
                            shortlistedIds.includes(donor.id)
                              ? 'Remove from shortlist'
                              : 'Save donor to shortlist'
                          }
                          title={
                            lang === 'bn'
                              ? shortlistedIds.includes(donor.id)
                                ? 'সংরক্ষিত তালিকা থেকে সরান'
                                : 'ডোনার সংরক্ষণ (শর্টলিস্ট) করুন'
                              : shortlistedIds.includes(donor.id)
                              ? 'Saved in shortlist'
                              : 'Save to shortlist'
                          }
                          className={`min-h-[38px] min-w-[38px] rounded-xl flex items-center justify-center cursor-pointer shrink-0 ${
                            shortlistedIds.includes(donor.id)
                              ? 'btn-soft-rose'
                              : 'btn-surface'
                          }`}
                        >
                          <Bookmark
                            className={`w-4 h-4 ${
                              shortlistedIds.includes(donor.id)
                                ? 'fill-rose-600 text-rose-600 dark:fill-rose-400 dark:text-rose-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Last Availability Update & Location Metadata (Zero-Pill Unboxed Text) */}
                    <div className="py-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200 truncate">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">
                            {upazilaName}, {districtName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          {donor.totalDonations > 0 && (
                            <>
                              <span>
                                {donor.totalDonations} {t.donationsCount}
                              </span>
                              <span aria-hidden="true">·</span>
                            </>
                          )}
                          <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {donor.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{freshnessLabel}</span>
                        </span>
                        <span>
                          {!isMedicallyEligible ? (
                            <span className="text-amber-700 dark:text-amber-400 font-semibold tabular-nums">
                              {lang === 'bn'
                                ? `বিরতি বাকি: ${recoveryDaysLeft} দিন`
                                : `Cooldown: ${recoveryDaysLeft}d left`}
                            </span>
                          ) : donor.lastDonatedDate ? (
                            <span className="tabular-nums">
                              {t.lastDonation}: {donor.lastDonatedDate}
                            </span>
                          ) : (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              {t.notDonatedYet}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {wasAttemptedUnsuccessfully && (
                      <div className="mt-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                        {lang === 'bn'
                          ? 'পূর্বে কল করা হয়েছে (সাড়া মেলেনি)'
                          : 'Previously attempted (no response yet)'}
                      </div>
                    )}
                  </div>

                  {/* Direct Low-Friction Contact Actions */}
                  <div className="pt-3 mt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {consentCheck.allowed ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                          {lang === 'bn'
                            ? 'সরাসরি কল ও WhatsApp করা যাবে'
                            : 'Direct Call & WhatsApp available'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 truncate">
                          <Lock className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {availabilityConfidence === 'DND'
                              ? lang === 'bn'
                                ? 'ডু নট ডিস্টার্ব সক্রিয়'
                                : 'Do Not Disturb active'
                              : lang === 'bn'
                              ? 'অনুমতি সাপেক্ষে নম্বর / চ্যাট'
                              : 'Consent request or In-App Chat'}
                          </span>
                        </span>
                      )}

                      {!wasAttemptedUnsuccessfully && availabilityConfidence !== 'DND' && (
                        <button
                          type="button"
                          onClick={() => handleMarkUnsuccessfulAndNext(donor)}
                          className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                          title={
                            lang === 'bn'
                              ? 'ফোন না ধরলে পরের ডোনারে যান'
                              : 'Record no answer and move to next donor'
                          }
                        >
                          <SkipForward className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'সাড়া নেই? পরের জন' : 'No Answer? Next'}</span>
                        </button>
                      )}
                    </div>

                    {/* Primary Contact Buttons */}
                    {consentCheck.allowed ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          {directCallHref ? (
                            <a
                              href={directCallHref}
                              className="w-full min-h-[44px] px-2.5 py-2 text-xs font-bold rounded-xl btn-crimson flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                              title={lang === 'bn' ? 'ফোন ডায়ালার খুলবে' : 'Opens Phone Dialer'}
                            >
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {lang === 'bn' ? 'কল করুন' : 'Call'}
                              </span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onRevealPhone(donor)}
                              className="w-full min-h-[44px] px-2.5 py-2 text-xs font-bold rounded-xl btn-crimson flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{t.callDonor}</span>
                            </button>
                          )}

                          {directWaHref ? (
                            <a
                              href={directWaHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full min-h-[44px] px-2.5 py-2 text-xs font-bold rounded-xl btn-emerald flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                              title={lang === 'bn' ? 'WhatsApp খুলবে' : 'Opens WhatsApp'}
                            >
                              <span className="truncate">WhatsApp</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onRevealPhone(donor)}
                              className="w-full min-h-[44px] px-2.5 py-2 text-xs font-bold rounded-xl btn-emerald flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <span className="truncate">WhatsApp</span>
                            </button>
                          )}

                          {effectiveRawPhone ? (
                            <button
                              type="button"
                              onClick={() => handleCopyDirectPhone(donor.id, effectiveRawPhone)}
                              className={`w-full min-h-[44px] px-2.5 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                                copiedDonorId === donor.id ? 'btn-soft-emerald' : 'btn-obsidian'
                              }`}
                              title={
                                lang === 'bn'
                                  ? 'অন্য ফোন থেকে কল করতে নম্বর কপি করুন'
                                  : 'Copy phone number'
                              }
                            >
                              {copiedDonorId === donor.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">
                                    {lang === 'bn' ? 'কপি হয়েছে' : 'Copied'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">
                                    {lang === 'bn' ? 'নম্বর কপি' : 'Copy No.'}
                                  </span>
                                </>
                              )}
                            </button>
                          ) : onStartChatWithDonor ? (
                            <button
                              type="button"
                              onClick={() => onStartChatWithDonor(donor)}
                              className="w-full min-h-[44px] px-2.5 py-2 text-xs font-bold rounded-xl btn-obsidian flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {lang === 'bn' ? 'চ্যাট / SMS' : 'Chat'}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onRevealPhone(donor)}
                              className="w-full min-h-[44px] px-2.5 py-2 text-xs font-bold rounded-xl btn-obsidian flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                            >
                              <span className="truncate">
                                {lang === 'bn' ? 'বিস্তারিত' : 'Options'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Non-Opted-In / Request-Only / DND Fallback Actions (Never broken masked links!) */
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => onRevealPhone(donor)}
                          disabled={availabilityConfidence === 'DND'}
                          className="w-full min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl btn-obsidian flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          <Lock className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {availabilityConfidence === 'DND'
                              ? lang === 'bn'
                                ? 'বিরত (DND)'
                                : 'DND Active'
                              : lang === 'bn'
                              ? 'নম্বরের অনুমতি চান'
                              : 'Request Contact'}
                          </span>
                        </button>
                        {onStartChatWithDonor && (
                          <button
                            type="button"
                            onClick={() => onStartChatWithDonor(donor)}
                            className="w-full min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl btn-emerald flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {lang === 'bn' ? 'ইন-অ্যাপ চ্যাট' : 'In-App Chat'}
                            </span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {rankedResults.length > visibleCount && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_CHUNK)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl btn-obsidian font-bold text-xs cursor-pointer"
              >
                {lang === 'bn'
                  ? `আরও রক্তদাতা দেখুন (${rankedResults.length - visibleCount} জন বাকি)`
                  : `Load More Donors (${rankedResults.length - visibleCount} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const DonorSearch = React.memo(DonorSearchComponent);
