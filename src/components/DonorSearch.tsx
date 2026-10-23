import React, { useState, useMemo } from 'react';
import { Donor, BloodGroup, Language } from '../types';
import { DIVISIONS, DISTRICTS } from '../data/bangladeshGeo';
import { ALL_BLOOD_GROUPS, getCompatibleDonors } from '../data/compatibility';
import { getTranslation } from '../utils/translations';
import { buildWhatsAppChatUrl } from '../firebase';
import { 
  Search, 
  MapPin, 
  Phone, 
  Award, 
  Star, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Heart, 
  Filter, 
  RotateCcw,
  UserCheck,
  MessageSquare,
  UserPlus,
  Mic,
  MicOff
} from 'lucide-react';

interface DonorSearchProps {
  donors: Donor[];
  lang: Language;
  onRevealPhone: (donor: Donor) => void;
  onOpenSOSModal: () => void;
  onStartChatWithDonor?: (donor: Donor) => void;
  onOpenRegister?: () => void;
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
  const [isListening, setIsListening] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const handleToggleVoice = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
    } catch (e) {
      setIsListening(false);
    }
  };

  // Available districts filtered by selected division
  const availableDistricts = useMemo(() => {
    if (selectedDivision === 'ALL') return DISTRICTS;
    return DISTRICTS.filter((d) => d.divisionId === selectedDivision);
  }, [selectedDivision]);

  // Available upazilas filtered by selected district
  const availableUpazilas = useMemo(() => {
    if (selectedDistrict === 'ALL') return [];
    const districtObj = DISTRICTS.find((d) => d.id === selectedDistrict);
    return districtObj ? districtObj.upazilas : [];
  }, [selectedDistrict]);

  // Reset district/upazila when division changes
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
  };

  // Filter logic
  const filteredDonors = useMemo(() => {
    return donors.filter((donor) => {
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

      // 2. Division filter
      if (selectedDivision !== 'ALL' && donor.division !== selectedDivision) {
        return false;
      }

      // 3. District filter
      if (selectedDistrict !== 'ALL' && donor.district !== selectedDistrict) {
        return false;
      }

      // 4. Upazila filter
      if (selectedUpazila !== 'ALL' && donor.upazila !== selectedUpazila) {
        return false;
      }

      // 5. Availability filter
      if (onlyAvailable && !donor.available) {
        return false;
      }

      // 6. Verified filter
      if (onlyVerified && !donor.verifiedBadge) {
        return false;
      }

      // 7. Search query (Banglish, Bangla, Name, Hospital)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchName = donor.name.toLowerCase().includes(q);
        const matchHospital = donor.hospitalAffiliation?.toLowerCase().includes(q);
        const matchUpazila = donor.upazila.toLowerCase().includes(q);
        const matchDistrict = donor.district.toLowerCase().includes(q);
        const matchBio = donor.bio?.toLowerCase().includes(q);
        if (!matchName && !matchHospital && !matchUpazila && !matchDistrict && !matchBio) {
          return false;
        }
      }

      return true;
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
    searchQuery,
  ]);

  return (
    <div className="space-y-6 text-left">
      {/* Search Header Banner & Quick Controls */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 sm:p-6 transition-all shadow-sm">
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
                onClick={onOpenRegister}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? '+ ডোনার আইডি তৈরি' : '+ Register ID'}</span>
              </button>
            )}
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
            </button>
            <button
              onClick={onOpenSOSModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 transition-all cursor-pointer"
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
              onClick={() => setSelectedGroup('ALL')}
              className={`min-h-[44px] px-3.5 sm:px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedGroup === 'ALL'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80'
              }`}
            >
              {t.allBloodGroups}
            </button>

            {ALL_BLOOD_GROUPS.map((group) => {
              const isSelected = selectedGroup === group;
              return (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  className={`min-h-[44px] min-w-[50px] px-3 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-105'
                      : 'bg-white/70 dark:bg-slate-800/70 text-slate-800 dark:text-slate-100 hover:bg-rose-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80'
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
              className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
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
              className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
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
              className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50 cursor-pointer"
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
                placeholder={isListening ? (lang === 'bn' ? '🎙️ শুনছি... মুখে বলুন (যেমন: বি পজিটিভ ঢাকা)' : '🎙️ Listening... Speak now') : t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-11 pl-9 pr-11 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white placeholder:text-slate-400 border transition-all focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                  isListening ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`absolute right-2 top-2 p-1.5 rounded-lg transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/40'
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

        {/* Quick Toggles Row */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
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
            onClick={onOpenSOSModal}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>{t.createSosTitle}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 @xl:grid-cols-2 gap-3.5">
          {filteredDonors.map((donor) => {
            const districtObj = DISTRICTS.find((d) => d.id === donor.district);
            const districtName = districtObj ? (lang === 'bn' ? districtObj.nameBn : districtObj.nameEn) : donor.district;
            const upazilaObj = districtObj?.upazilas.find((u) => u.id === donor.upazila);
            const upazilaName = upazilaObj ? (lang === 'bn' ? upazilaObj.nameBn : upazilaObj.nameEn) : donor.upazila;

            return (
              <div
                key={donor.id}
                className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 sm:p-4 hover:border-rose-500 transition-all shadow-sm flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Blood Group Badge, Name & Availability */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Blood Group Badge */}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-red-600 flex flex-col items-center justify-center text-white font-black text-lg tracking-tight shadow-md shadow-rose-600/30 group-hover:scale-105 transition-transform shrink-0">
                        <span>{donor.bloodGroup}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-tight">
                            {donor.name}
                          </h3>
                          {donor.verifiedBadge && (
                            <span title={t.verifiedDonor} className="text-blue-500 dark:text-blue-400 shrink-0">
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

                    {/* Availability Indicator */}
                    <div className="shrink-0 text-right">
                      {donor.available ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{t.availableBadge}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span>{t.restingBadge}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clean unboxed metadata with bullet separators */}
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-300 py-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{upazilaName}, {districtName}</span>
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
                          {t.lastDonation}: <span className="font-semibold text-slate-700 dark:text-slate-300">{donor.lastDonatedDate}</span>
                        </>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t.notDonatedYet}</span>
                      )}
                    </span>
                  </div>

                  {/* Bio / note */}
                  {donor.bio && (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 italic line-clamp-2 bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                      "{donor.bio}"
                    </p>
                  )}
                </div>

                {/* Bottom Call & Chat Actions (Symmetrical 2-column grid - no side wrapping) */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs px-0.5">
                    <span className="font-mono text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      {donor.phone.slice(0, 6)} •••• {donor.phone.slice(-2)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">🔒 {lang === 'bn' ? 'এনক্রিপ্টেড ও সুরক্ষিত' : 'Encrypted'}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {onStartChatWithDonor && (
                      <button
                        onClick={() => onStartChatWithDonor(donor)}
                        className="w-full min-h-[42px] px-2.5 py-2 text-xs font-bold rounded-xl bg-[#075e54] hover:bg-[#064e46] text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        title="অ্যাপে লাইভ চ্যাট করুন"
                      >
                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{lang === 'bn' ? 'লাইভ চ্যাট' : 'Live Chat'}</span>
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
      )}
    </div>
  );
};

export const DonorSearch = React.memo(DonorSearchComponent);

