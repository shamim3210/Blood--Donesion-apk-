import React, { useState, useMemo, useEffect } from 'react';
import { Donor, BloodGroup, Language } from '../types';
import { DIVISIONS, DISTRICTS } from '../data/bangladeshGeo';
import { ALL_BLOOD_GROUPS, getCompatibleDonors } from '../data/compatibility';
import { getTranslation } from '../utils/translations';
import { buildWhatsAppChatUrl } from '../firebase';
import {
  requestRealDeviceGPS,
  DISTRICT_COORDINATES,
  DEFAULT_BANGLADESH_COORDS,
  calculateHaversineDistance,
  formatDistance,
  Coordinates,
} from '../utils/geolocation';
import {
  Search,
  MapPin,
  Phone,
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Heart,
  RotateCcw,
  MessageSquare,
  UserPlus,
  Mic,
  MicOff,
  Navigation,
  Moon,
  GraduationCap,
} from 'lucide-react';

interface DonorSearchProps {
  donors: Donor[];
  lang: Language;
  onRevealPhone: (donor: Donor) => void;
  onOpenSOSModal: () => void;
  onStartChatWithDonor?: (donor: Donor) => void;
  onOpenRegister?: () => void;
}

const PAGE_CHUNK = 24;

function resolveDonorCoordinates(donor: Donor): Coordinates | null {
  const rawDist = (donor.district || '').trim().toLowerCase();
  if (DISTRICT_COORDINATES[rawDist]) {
    return DISTRICT_COORDINATES[rawDist];
  }
  const matchedDist = DISTRICTS.find(
    (d) =>
      d.id.toLowerCase() === rawDist ||
      d.nameBn === donor.district.trim() ||
      d.nameEn.toLowerCase() === rawDist
  );
  if (matchedDist && DISTRICT_COORDINATES[matchedDist.id]) {
    return DISTRICT_COORDINATES[matchedDist.id];
  }
  if (donor.division && DISTRICT_COORDINATES[donor.division.toLowerCase()]) {
    return DISTRICT_COORDINATES[donor.division.toLowerCase()];
  }
  return null;
}

const DonorSearchComponent: React.FC<DonorSearchProps> = ({
  donors,
  lang,
  onRevealPhone,
  onOpenSOSModal,
  onStartChatWithDonor,
  onOpenRegister,
}) => {
  const t = getTranslation(lang);

  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'ALL'>('ALL');
  const [includeCompatible, setIncludeCompatible] = useState<boolean>(true);
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [onlyVerified, setOnlyVerified] = useState<boolean>(false);
  const [onlyRareNegative, setOnlyRareNegative] = useState<boolean>(false);
  const [onlyNightReady, setOnlyNightReady] = useState<boolean>(false);
  const [onlyCampusClub, setOnlyCampusClub] = useState<boolean>(false);
  const [sortByNearest, setSortByNearest] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<Coordinates>(DEFAULT_BANGLADESH_COORDS);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_CHUNK);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    requestRealDeviceGPS()
      .then((coords) => {
        if (active) setUserCoords(coords);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Reset pagination whenever filters change so search feels instantaneous
  useEffect(() => {
    setVisibleCount(PAGE_CHUNK);
  }, [
    selectedGroup,
    includeCompatible,
    selectedDivision,
    selectedDistrict,
    selectedUpazila,
    onlyAvailable,
    onlyVerified,
    onlyRareNegative,
    onlyNightReady,
    onlyCampusClub,
    searchQuery,
    sortByNearest,
  ]);

  const handleToggleVoice = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceNotice(
        lang === 'bn'
          ? 'আপনার ব্রাউজারে ভয়েস সার্চ সমর্থন করে না। গুগল ক্রোম ব্যবহার করুন অথবা লিখে সার্চ করুন।'
          : 'Voice search is not supported in this browser. Please type your search or use Chrome.'
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

      recognition.onstart = () => {
        setIsListening(true);
      };

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

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

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
  };

  const handleDistrictChange = (distId: string) => {
    setSelectedDistrict(distId);
    setSelectedUpazila('ALL');
  };

  const handleResetFilters = () => {
    setSelectedGroup('ALL');
    setSelectedDivision('ALL');
    setSelectedDistrict('ALL');
    setSelectedUpazila('ALL');
    setSearchQuery('');
    setOnlyAvailable(false);
    setOnlyVerified(false);
    setOnlyRareNegative(false);
    setOnlyNightReady(false);
    setOnlyCampusClub(false);
    setSortByNearest(false);
  };

  const handleToggleNearestSort = () => {
    const next = !sortByNearest;
    setSortByNearest(next);
    if (next) {
      requestRealDeviceGPS()
        .then((coords) => setUserCoords(coords))
        .catch(() => {});
    }
  };

  // Bilingual ID + Name resilient filter & optional GPS distance sort
  const filteredDonors = useMemo(() => {
    const selectedDivObj =
      selectedDivision !== 'ALL' ? DIVISIONS.find((d) => d.id === selectedDivision) : null;
    const selectedDistObj =
      selectedDistrict !== 'ALL' ? DISTRICTS.find((d) => d.id === selectedDistrict) : null;
    const selectedUpzObj =
      selectedUpazila !== 'ALL' && selectedDistObj
        ? selectedDistObj.upazilas.find((u) => u.id === selectedUpazila)
        : null;

    const matched = donors.filter((donor) => {
      // 1. Blood group matching
      if (selectedGroup !== 'ALL') {
        if (includeCompatible) {
          const compatibleGroups = getCompatibleDonors(selectedGroup);
          if (!compatibleGroups.includes(donor.bloodGroup)) {
            return false;
          }
        } else if (donor.bloodGroup !== selectedGroup) {
          return false;
        }
      }

      // 2. Division filter (matches ID, Bangla name, English name, or inferred from district)
      if (selectedDivision !== 'ALL') {
        const dDiv = (donor.division || '').trim().toLowerCase();
        const directDivMatch =
          dDiv === selectedDivision.toLowerCase() ||
          (selectedDivObj &&
            (donor.division.trim() === selectedDivObj.nameBn ||
              dDiv === selectedDivObj.nameEn.toLowerCase()));

        if (!directDivMatch) {
          const donorDistObj = DISTRICTS.find(
            (dist) =>
              dist.id === donor.district.toLowerCase() ||
              dist.nameBn === donor.district.trim() ||
              dist.nameEn.toLowerCase() === donor.district.trim().toLowerCase()
          );
          if (!donorDistObj || donorDistObj.divisionId !== selectedDivision) {
            return false;
          }
        }
      }

      // 3. District filter (matches ID, Bangla name, or English name)
      if (selectedDistrict !== 'ALL') {
        const dDist = (donor.district || '').trim().toLowerCase();
        const distMatch =
          dDist === selectedDistrict.toLowerCase() ||
          (selectedDistObj &&
            (donor.district.trim() === selectedDistObj.nameBn ||
              dDist === selectedDistObj.nameEn.toLowerCase()));
        if (!distMatch) {
          return false;
        }
      }

      // 4. Upazila filter (matches ID, Bangla name, or English name)
      if (selectedUpazila !== 'ALL') {
        const dUpz = (donor.upazila || '').trim().toLowerCase();
        const upzMatch =
          dUpz === selectedUpazila.toLowerCase() ||
          (selectedUpzObj &&
            (donor.upazila.trim() === selectedUpzObj.nameBn ||
              dUpz === selectedUpzObj.nameEn.toLowerCase()));
        if (!upzMatch) {
          return false;
        }
      }

      // 5. Availability filter
      if (onlyAvailable && !donor.available) {
        return false;
      }

      // 6. Verified filter
      if (onlyVerified && !donor.verifiedBadge) {
        return false;
      }

      // 6B. Rare Negative Vault filter (O-, AB-, B-, A-)
      if (onlyRareNegative && !donor.bloodGroup.endsWith('-')) {
        return false;
      }

      // 6C. Night-Shift 12AM-6AM Emergency Ready filter
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

      // 6D. Campus & Voluntary Blood Club Squad filter (Sandhani, Badhan, Red Crescent, Medical, University)
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

      // 7. Search query (Banglish, Bangla, Name, Hospital, District)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchName = donor.name.toLowerCase().includes(q);
        const matchHospital = donor.hospitalAffiliation?.toLowerCase().includes(q);
        const matchUpazila = donor.upazila.toLowerCase().includes(q);
        const matchDistrict = donor.district.toLowerCase().includes(q);
        const matchBio = donor.bio?.toLowerCase().includes(q);
        const matchGroup = donor.bloodGroup.toLowerCase() === q;
        if (
          !matchName &&
          !matchHospital &&
          !matchUpazila &&
          !matchDistrict &&
          !matchBio &&
          !matchGroup
        ) {
          return false;
        }
      }

      return true;
    });

    if (!sortByNearest) {
      return matched;
    }

    return [...matched].sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      const coordA = resolveDonorCoordinates(a);
      const coordB = resolveDonorCoordinates(b);
      const distA = coordA ? calculateHaversineDistance(userCoords, coordA) : 9999;
      const distB = coordB ? calculateHaversineDistance(userCoords, coordB) : 9999;
      return distA - distB;
    });
  }, [
    donors,
    selectedGroup,
    includeCompatible,
    selectedDivision,
    selectedDistrict,
    selectedUpazila,
    onlyAvailable,
    onlyVerified,
    onlyRareNegative,
    onlyNightReady,
    onlyCampusClub,
    searchQuery,
    sortByNearest,
    userCoords,
  ]);

  const visibleDonors = useMemo(
    () => filteredDonors.slice(0, visibleCount),
    [filteredDonors, visibleCount]
  );

  return (
    <div className="space-y-5 text-left">
      {/* Search Header Banner & Quick Controls */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 sm:p-6 transition-colors shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200/60 dark:border-slate-800/60">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.searchTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              {t.searchSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenRegister && (
              <button
                type="button"
                onClick={onOpenRegister}
                className="min-h-[38px] flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? '+ ডোনার আইডি তৈরি' : '+ Register ID'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="min-h-[38px] flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenSOSModal}
              className="min-h-[38px] flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-colors cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span>{lang === 'bn' ? 'জরুরি রক্তের রিকোয়েস্ট' : 'Request Blood'}</span>
            </button>
          </div>
        </div>

        {/* Blood Group Segmented Selector */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
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
              className={`min-h-[44px] px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                selectedGroup === 'ALL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
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
                  className={`min-h-[44px] min-w-[50px] px-3 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-rose-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>

        {/* Geographic & Filter Row */}
        <div className="pt-3 grid grid-cols-1 @md:grid-cols-2 gap-2.5">
          {/* Division Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {t.selectDivision}
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="ALL">{t.allDivisions}</option>
              {DIVISIONS.map((div) => (
                <option key={div.id} value={div.id}>
                  {lang === 'bn' ? div.nameBn : div.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* District Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {t.selectDistrict}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="ALL">{t.allDistricts}</option>
              {availableDistricts.map((dist) => (
                <option key={dist.id} value={dist.id}>
                  {lang === 'bn' ? dist.nameBn : dist.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Upazila Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {t.selectUpazila}
            </label>
            <select
              value={selectedUpazila}
              disabled={selectedDistrict === 'ALL' || availableUpazilas.length === 0}
              onChange={(e) => setSelectedUpazila(e.target.value)}
              className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 cursor-pointer"
            >
              <option value="ALL">{t.allUpazilas}</option>
              {availableUpazilas.map((upz) => (
                <option key={upz.id} value={upz.id}>
                  {lang === 'bn' ? upz.nameBn : upz.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input (Banglish / Bangla) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {lang === 'bn' ? 'নাম বা হাসপাতাল দিয়ে খোঁজ' : 'Keyword Search'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={
                  isListening
                    ? lang === 'bn'
                      ? '🎙️ শুনছি... মুখে বলুন (যেমন: বি পজিটিভ ঢাকা)'
                      : '🎙️ Listening... Speak now'
                    : t.searchPlaceholder
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-11 pl-9 pr-11 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 border transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  isListening
                    ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`absolute right-2 top-2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={lang === 'bn' ? 'ভয়েস সার্চ (মুখে বলুন)' : 'Voice Search (Speech to Text)'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            {voiceNotice && (
              <p className="mt-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                {voiceNotice}
              </p>
            )}
          </div>
        </div>

        {/* Quick Toggles Row + 1-Tap GPS Nearest Sort */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3.5">
            <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={onlyAvailable}
                onChange={(e) => setOnlyAvailable(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <span>{t.availableOnly}</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
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
              onClick={handleToggleNearestSort}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1.5 border cursor-pointer transition-colors ${
                sortByNearest
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-emerald-500'
              }`}
              title="GPS দূরত্ব অনুযায়ী নিকটস্থ রক্তদাতা আগে দেখুন"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'নিকটস্থ ডোনার আগে' : 'Nearest First'}</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyRareNegative((v) => !v)}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1.5 border cursor-pointer transition-colors ${
                onlyRareNegative
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-rose-500'
              }`}
            >
              <span>{lang === 'bn' ? 'নেগেটিভ ভল্ট (O-/AB-/B-/A-)' : 'Rare Negative'}</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyNightReady((v) => !v)}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1.5 border cursor-pointer transition-colors ${
                onlyNightReady
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-500'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'গভীর রাতে প্রস্তুত' : 'Night Ready'}</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyCampusClub((v) => !v)}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1.5 border cursor-pointer transition-colors ${
                onlyCampusClub
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-amber-500'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ক্যাম্পাস ও ক্লাব স্কোয়াড' : 'Campus & Clubs'}</span>
            </button>
          </div>

          {/* Donor Count */}
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">
              {filteredDonors.length}
            </span>{' '}
            {t.donorsFound}
          </div>
        </div>
      </div>

      {/* Donors Card Grid */}
      {filteredDonors.length === 0 ? (
        <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {t.noDonorsFound}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-1">
              {t.noDonorsHint}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSOSModal}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>{t.createSosTitle}</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 @xl:grid-cols-2 gap-3.5">
            {visibleDonors.map((donor) => {
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

              const donorCoords = resolveDonorCoordinates(donor);
              const distanceKm = donorCoords
                ? calculateHaversineDistance(userCoords, donorCoords)
                : null;

              return (
                <div
                  key={donor.id}
                  className="cv-auto bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 sm:p-4 hover:border-rose-500 transition-colors shadow-sm flex flex-col justify-between"
                >
                  <div>
                    {/* Top Bar: Blood Group Badge, Name & Availability */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-600 flex flex-col items-center justify-center text-white font-black text-lg tracking-tight shadow-xs shrink-0">
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
                          {donor.hospitalAffiliation && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                              {donor.hospitalAffiliation}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Clean unpulsed availability status */}
                      <div className="shrink-0 text-right">
                        {donor.available ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>{t.availableBadge}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            <span>{t.restingBadge}</span>
                          </span>
                        )}
                        {distanceKm !== null && (
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                            ~{formatDistance(distanceKm, lang)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Clean unboxed metadata */}
                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300 py-2.5 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 truncate">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">
                          {upazilaName}, {districtName}
                        </span>
                      </div>
                      <div className="flex items-center justify-center font-mono font-medium text-slate-700 dark:text-slate-300">
                        {donor.totalDonations} {t.donationsCount}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-amber-600 dark:text-amber-400 font-bold font-mono">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        <span>{donor.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Last Donation / Cooldown status */}
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        {donor.lastDonatedDate ? (
                          <>
                            {t.lastDonation}:{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {donor.lastDonatedDate}
                            </span>
                          </>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {t.notDonatedYet}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Bio / note */}
                    {donor.bio && (
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                        &ldquo;{donor.bio}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Bottom Call & Chat Actions */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs px-0.5">
                      <span className="font-mono text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        {donor.phone.slice(0, 6)} •••• {donor.phone.slice(-2)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        🔒 {lang === 'bn' ? 'এনক্রিপ্টেড ও সুরক্ষিত' : 'Encrypted'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {onStartChatWithDonor && (
                        <button
                          type="button"
                          onClick={() => onStartChatWithDonor(donor)}
                          className="w-full min-h-[42px] px-2.5 py-2 text-xs font-bold rounded-xl bg-[#075e54] hover:bg-[#064e46] text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          title="অ্যাপে লাইভ চ্যাট করুন"
                        >
                          <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {lang === 'bn' ? 'লাইভ চ্যাট' : 'Live Chat'}
                          </span>
                        </button>
                      )}
                      <a
                        href={buildWhatsAppChatUrl(
                          donor.whatsappPhone || donor.phone,
                          `আসসালামু আলাইকুম ${donor.name}, জরুরি রক্তের (${donor.bloodGroup}) প্রয়োজনে BloodSearch থেকে নক দিচ্ছি।`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-[42px] px-2.5 py-2 text-xs font-bold rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                        title="সরাসরি WhatsApp-এ চ্যাট"
                      >
                        <span className="truncate">WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => onRevealPhone(donor)}
                        className="w-full min-h-[42px] px-2.5 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t.callDonor}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDonors.length > visibleCount && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_CHUNK)}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                {lang === 'bn'
                  ? `আরও রক্তদাতা দেখুন (${filteredDonors.length - visibleCount} জন বাকি)`
                  : `Load More Donors (${filteredDonors.length - visibleCount} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const DonorSearch = React.memo(DonorSearchComponent);
