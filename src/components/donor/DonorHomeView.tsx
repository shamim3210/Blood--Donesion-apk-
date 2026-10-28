import React, { useState, useEffect, useMemo } from 'react';
import {
  BloodRequest,
  BloodGroup,
  Donor,
  Language,
} from '../../types';
import { isSeedDonorId, isSeedRequestId } from '../../data/mockDonors';
import { DISTRICTS } from '../../data/bangladeshGeo';
import {
  requestRealDeviceGPS,
  Coordinates,
  DEFAULT_BANGLADESH_COORDS,
} from '../../utils/geolocation';
import {
  calculateRecoveryCountdown,
  getStoredDonationLogs,
  canDonorGiveToPatient,
  DonationIntervalType,
  formatRelativeRequestTime,
  copyTextReliable,
} from '../../utils/sosAlertEngine';
import {
  auth,
  onAuthStateChanged,
  recordCompletedDonationInFirestore,
  User as FirebaseUser,
} from '../../firebase';
import {
  Megaphone,
  ChevronRight,
  CheckCircle2,
  Droplet,
  Hospital,
  Share2,
  MapPin,
  Search,
  Compass,
  Award,
  Phone,
  ExternalLink,
  Building2,
  UserPlus,
  MessageSquare,
  CalendarCheck,
  Clock,
  HeartHandshake,
  Activity,
  Truck,
  Smartphone,
  Utensils,
  FileCheck2,
  Sparkles,
  Stethoscope,
  FlaskConical,
  Copy,
  Check,
} from 'lucide-react';
import type { CareSuiteTab } from '../ecosystem/EmergencyCareSuiteModal';

interface DonorHomeViewProps {
  donors?: Donor[];
  requests: BloodRequest[];
  lang: Language;
  onOpenSOSWizard: (context?: { bloodGroup?: BloodGroup; district?: string }) => void;
  onOpenRegister: (role?: 'USER' | 'ADMIN') => void;
  onSelectRequest: (req: BloodRequest) => void;
  onQuickDonate: (req: BloodRequest) => void;
  onNavigateTab: (tab: any) => void;
  onQuickSearchByGroup?: (group: BloodGroup | 'ALL', district?: string) => void;
  onOpenDirectory?: () => void;
  onOpenPoster?: () => void;
  onOpenThalassemia?: () => void;
  onOpenPlayStore?: () => void;
  onOpenCareSuite?: (tab?: CareSuiteTab) => void;
}

interface MiniMapPin {
  id: string;
  name: string;
  label: string;
  type: 'DONOR' | 'SOS' | 'HOSPITAL';
  distance: string;
  district: string;
  phone?: string;
  canDirectCall: boolean;
  x: number;
  y: number;
}

const VERIFIED_HOSPITAL_MINI_PINS: MiniMapPin[] = [
  {
    id: 'hosp-dmch',
    name: 'ঢাকা মেডিকেল কলেজ ব্লাড ব্যাংক',
    label: 'DMCH',
    type: 'HOSPITAL',
    distance: 'সরকারি কেন্দ্র',
    district: 'শাহবাগ, ঢাকা',
    phone: '02-55165088',
    canDirectCall: true,
    x: 50,
    y: 44,
  },
  {
    id: 'hosp-bsmmu',
    name: 'বিএসএমএমইউ ট্রান্সফিউশন মেডিসিন',
    label: 'BSMMU',
    type: 'HOSPITAL',
    distance: 'সরকারি কেন্দ্র',
    district: 'শাহবাগ, ঢাকা',
    phone: '02-55165760',
    canDirectCall: true,
    x: 66,
    y: 48,
  },
  {
    id: 'hosp-nicvd',
    name: 'জাতীয় হৃদরোগ ইনস্টিটিউট ব্লাড ব্যাংক',
    label: 'NICVD',
    type: 'HOSPITAL',
    distance: 'সরকারি কেন্দ্র',
    district: 'শের-ই-বাংলা নগর, ঢাকা',
    phone: '02-9122560',
    canDirectCall: true,
    x: 34,
    y: 32,
  },
];

const ALL_BLOOD_GROUPS: BloodGroup[] = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];

const DonorHomeViewInner: React.FC<DonorHomeViewProps> = ({
  donors = [],
  requests,
  lang,
  onOpenSOSWizard,
  onOpenRegister,
  onSelectRequest,
  onQuickDonate,
  onNavigateTab,
  onQuickSearchByGroup,
  onOpenDirectory,
  onOpenPoster,
  onOpenThalassemia,
  onOpenPlayStore,
  onOpenCareSuite,
}) => {
  const [rareOnlyFilter, setRareOnlyFilter] = useState(false);
  const [expressGroup, setExpressGroup] = useState<BloodGroup>('B+');
  const [expressDistrict, setExpressDistrict] = useState<string>('ALL');

  const totalReadyDonors = useMemo(
    () => donors.filter((d) => !isSeedDonorId(d.id) && d.available).length,
    [donors]
  );

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('bloodsearch_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [clockTick, setClockTick] = useState(0);
  const [copiedPinPhone, setCopiedPinPhone] = useState(false);
  useEffect(() => {
    const id = window.setInterval(() => setClockTick((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });
    const handleUserUpdate = () => {
      try {
        const saved = localStorage.getItem('bloodsearch_current_user');
        setCurrentUser(saved ? JSON.parse(saved) : null);
      } catch {}
    };
    window.addEventListener('bloodsearch_user_changed', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate);
    return () => {
      unsubAuth();
      window.removeEventListener('bloodsearch_user_changed', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, []);

  const isLoggedIn = Boolean(currentUser || firebaseUser);
  const displayGroup: BloodGroup = currentUser?.bloodGroup || 'B+';

  const activeRequestsAll = useMemo(
    () => requests.filter((r) => !isSeedRequestId(r.id) && r.status === 'ACTIVE'),
    [requests]
  );

  const activeRequests = useMemo(() => {
    const filtered = rareOnlyFilter
      ? activeRequestsAll.filter((r) => r.bloodGroup.endsWith('-'))
      : activeRequestsAll;
    return filtered.slice(0, 4);
  }, [activeRequestsAll, rareOnlyFilter]);

  const [recoveryMode, setRecoveryMode] = useState<DonationIntervalType>(() => {
    const logs = getStoredDonationLogs();
    return currentUser?.lastDonationType || logs[0]?.type || 'WHOLE_BLOOD';
  });
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [logDateInput, setLogDateInput] = useState(() => new Date().toISOString().slice(0, 10));
  const [logHospitalInput, setLogHospitalInput] = useState('');
  const [isSavingDonation, setIsSavingDonation] = useState(false);

  const recovery = useMemo(() => {
    void clockTick;
    const logs = getStoredDonationLogs();
    const lastIso = currentUser?.lastDonationDate || logs[0]?.date || '';
    return calculateRecoveryCountdown(lastIso, recoveryMode, lang);
  }, [currentUser, recoveryMode, lang, clockTick]);

  const [showReadinessCheck, setShowReadinessCheck] = useState(false);
  const [showCrossMatchGuide, setShowCrossMatchGuide] = useState(false);
  const [readinessChecks, setReadinessChecks] = useState({
    slept6Hrs: true,
    ateMeal: true,
    hydrated: true,
    noAntibiotics7d: true,
  });
  const readinessAllGood = Object.values(readinessChecks).every(Boolean);

  const [, setUserCoords] = useState<Coordinates>(DEFAULT_BANGLADESH_COORDS);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    requestRealDeviceGPS().then((coords) => {
      if (mounted) {
        setUserCoords(coords);
        setIsGpsActive(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const liveMiniPins = useMemo<MiniMapPin[]>(() => {
    const slots = [
      { x: 54, y: 38 },
      { x: 36, y: 54 },
      { x: 62, y: 26 },
      { x: 70, y: 58 },
      { x: 28, y: 30 },
      { x: 46, y: 68 },
    ];
    const realItems: MiniMapPin[] = [];
    for (const req of activeRequestsAll) {
      if (realItems.length < slots.length) {
        const slot = slots[realItems.length];
        const cleanPhone = req.contactPhone && !req.contactPhone.includes('*') ? req.contactPhone : undefined;
        realItems.push({
          id: `real-sos-${req.id}`,
          name: req.hospitalName,
          label: req.bloodGroup,
          type: 'SOS',
          distance: lang === 'bn' ? 'সক্রিয় SOS' : 'Active SOS',
          district: req.district,
          phone: cleanPhone,
          canDirectCall: Boolean(cleanPhone),
          x: slot.x,
          y: slot.y,
        });
      }
    }
    for (const d of donors) {
      if (!isSeedDonorId(d.id) && d.available && realItems.length < slots.length) {
        const slot = slots[realItems.length];
        const allowDirect =
          d.shareDirectContact !== false &&
          d.allowCall !== false &&
          Boolean(d.phone) &&
          !d.phone.includes('*');
        realItems.push({
          id: `real-donor-${d.id}`,
          name: d.name,
          label: d.bloodGroup,
          type: 'DONOR',
          distance: lang === 'bn' ? 'প্রস্তুত ডোনার' : 'Ready Donor',
          district: `${d.upazila || ''}${d.upazila ? ', ' : ''}${d.district}`,
          phone: allowDirect ? d.phone : undefined,
          canDirectCall: allowDirect,
          x: slot.x,
          y: slot.y,
        });
      }
    }
    return [...realItems, ...VERIFIED_HOSPITAL_MINI_PINS].slice(0, 8);
  }, [donors, activeRequestsAll, lang]);

  const [selectedPin, setSelectedPin] = useState<MiniMapPin | null>(null);
  const activeSelectedPin = useMemo(
    () =>
      (selectedPin && liveMiniPins.find((p) => p.id === selectedPin.id)) ||
      liveMiniPins[0] ||
      null,
    [selectedPin, liveMiniPins]
  );

  const [homeNotice, setHomeNotice] = useState<string | null>(null);
  const showTempNotice = (msg: string) => {
    setHomeNotice(msg);
    setTimeout(() => setHomeNotice(null), 3800);
  };

  const handleRecordDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingDonation) return;
    setIsSavingDonation(true);
    try {
      const res = await recordCompletedDonationInFirestore({
        donationDate: logDateInput,
        donationType: recoveryMode,
        hospitalName:
          logHospitalInput.trim() ||
          (lang === 'bn' ? 'রক্ত সঞ্চালন কেন্দ্র' : 'Hospital Blood Unit'),
      });
      setShowLogDrawer(false);
      setLogHospitalInput('');
      showTempNotice(
        lang === 'bn'
          ? `রক্তদান লগ সম্পন্ন। মোট রক্তদান: ${res.totalDonations} বার। আপনার ${
              recoveryMode === 'PLATELET' ? '১৪ দিনের প্লাটিলেট' : '৯০ দিনের'
            } রিকভারি টাইমার চালু হয়েছে।`
          : `Donation recorded (${res.totalDonations} total). Recovery timer started.`
      );
    } finally {
      setIsSavingDonation(false);
    }
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto text-left pb-8">
      {homeNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 text-xs font-semibold">
          {homeNotice}
        </div>
      )}

      {/* 1. Primary Hero Command Card */}
      <section className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* Main Emergency Search & SOS Split Body */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 tracking-tight">
                {lang === 'bn'
                  ? 'বাংলাদেশ জরুরি রক্তদাতা সংযোগ নেটওয়ার্ক · ৬৪ জেলা'
                  : 'Bangladesh Direct Blood Donor Network · 64 Districts'}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {lang === 'bn'
                  ? 'জরুরি মুহূর্তে সরাসরি প্রস্তুত রক্তদাতার সাথে যোগাযোগ করুন'
                  : 'Find Verified Blood Donors & Contact Directly in Minutes'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                {lang === 'bn'
                  ? 'রক্তের গ্রুপ ও জেলা নির্বাচন করে ১ ক্লিকেই নিকটস্থ প্রস্তুত রক্তদাতাদের সরাসরি কল বা WhatsApp করুন, অথবা জরুরি SOS ব্রডকাস্ট পাঠান।'
                  : 'Pick blood group & district below to call or WhatsApp available donors in one tap, or broadcast an emergency SOS alert.'}
              </p>
            </div>

            {/* Instant 1-Step Express Blood Group & District Finder */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/90 dark:bg-[#0d1322] border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {ALL_BLOOD_GROUPS.map((grp) => {
                  const selected = expressGroup === grp;
                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setExpressGroup(grp)}
                      className={`min-h-[40px] min-w-[44px] px-2.5 py-1.5 rounded-xl text-xs font-black cursor-pointer whitespace-nowrap shrink-0 ${
                        selected ? 'btn-crimson' : 'btn-surface'
                      }`}
                    >
                      {grp}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <select
                  value={expressDistrict}
                  onChange={(e) => setExpressDistrict(e.target.value)}
                  aria-label="Express District Selector"
                  className="sm:col-span-5 h-11 px-3 text-xs font-semibold rounded-xl bg-white dark:bg-[#111827] text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  <option value="ALL">
                    {lang === 'bn' ? 'সকল জেলা (সমগ্র বাংলাদেশ)' : 'All 64 Districts'}
                  </option>
                  {DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {lang === 'bn' ? d.nameBn : d.nameEn}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    if (onQuickSearchByGroup) {
                      onQuickSearchByGroup(expressGroup, expressDistrict);
                    } else {
                      onNavigateTab('search');
                    }
                  }}
                  className="sm:col-span-4 min-h-[44px] px-4 py-2 rounded-xl btn-crimson font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Search className="w-4 h-4 shrink-0" />
                  <span>
                    {lang === 'bn'
                      ? `${expressGroup} ডোনার খুঁজুন`
                      : `Find ${expressGroup} Donors`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onOpenSOSWizard({
                      bloodGroup: expressGroup,
                      district: expressDistrict !== 'ALL' ? expressDistrict : undefined,
                    })
                  }
                  className="sm:col-span-3 min-h-[44px] px-3 py-2 rounded-xl btn-obsidian font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Megaphone className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{lang === 'bn' ? 'SOS পোস্ট' : 'Post SOS'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Real Metrics & Quick Shortcuts */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-2.5 content-between">
            <button
              type="button"
              onClick={() => {
                if (onQuickSearchByGroup) onQuickSearchByGroup('ALL', 'ALL');
                else onNavigateTab('search');
              }}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-rose-50/60 dark:bg-[#0d1322] dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 text-left transition-colors cursor-pointer"
            >
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? 'প্রস্তুত রক্তদাতা' : 'Ready Donors'}
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
                {totalReadyDonors}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <span>{lang === 'bn' ? 'ডিরেক্টরি দেখুন' : 'Browse directory'}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('requests')}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-rose-50/60 dark:bg-[#0d1322] dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 text-left transition-colors cursor-pointer"
            >
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? 'সক্রিয় জরুরি আবেদন' : 'Active SOS Requests'}
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono tabular-nums mt-0.5">
                {activeRequestsAll.length}
              </div>
              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
                <span>{lang === 'bn' ? 'সকল আবেদন দেখুন' : 'View requests'}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('chat')}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#0d1322] dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {lang === 'bn' ? 'লাইভ চ্যাট ও GPS' : 'Live Chat & GPS'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {lang === 'bn' ? 'স্লিপ ছবি ও লোকেশন' : 'Slip & location'}
                </div>
              </div>
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => onOpenRegister('USER')}
              className="p-3.5 rounded-xl bg-slate-50 hover:bg-emerald-50/70 dark:bg-[#0d1322] dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
            >
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {isLoggedIn
                    ? lang === 'bn'
                      ? 'ডোনার কার্ড আপডেট'
                      : 'Update Donor ID'
                    : lang === 'bn'
                    ? 'ডোনার নিবন্ধন'
                    : 'Join as Donor'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {lang === 'bn' ? 'স্মার্ট আইডি ও সেটিংস' : 'Smart ID & privacy'}
                </div>
              </div>
              <UserPlus className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Active Emergency Blood Requests Near You */}
      <section className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'সক্রিয় জরুরি রক্তের আবেদনসমূহ' : 'Active Emergency Blood Requests'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {lang === 'bn'
                ? 'রিয়েল-টাইম যাচাইকৃত জরুরি রক্তের চাহিদা'
                : 'Real-time verified urgent blood requests'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRareOnlyFilter(!rareOnlyFilter)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors border whitespace-nowrap ${
                rareOnlyFilter
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {lang === 'bn' ? 'নেগেটিভ গ্রুপ' : 'Negative Only'}
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('requests')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer whitespace-nowrap"
            >
              {lang === 'bn' ? 'সব দেখুন →' : 'See All →'}
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {activeRequests.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <Droplet className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {rareOnlyFilter
                    ? lang === 'bn'
                      ? 'এই মুহূর্তে কোনো নেগেটিভ গ্রুপের সক্রিয় আবেদন নেই'
                      : 'No active negative blood group requests right now'
                    : lang === 'bn'
                    ? 'এই মুহূর্তে কোনো সক্রিয় জরুরি রক্তের আবেদন নেই'
                    : 'No active emergency blood requests right now'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {lang === 'bn'
                    ? 'কারো জরুরি রক্তের প্রয়োজন হলে নিচের বাটনে ক্লিক করে আবেদন পোস্ট করুন — নিকটস্থ প্রস্তুত ডোনাররা সাথে সাথে নোটিফিকেশন পাবেন।'
                    : 'Need blood urgently? Post a verified request below to alert matching donors immediately.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1">
                {rareOnlyFilter && (
                  <button
                    type="button"
                    onClick={() => setRareOnlyFilter(false)}
                    className="min-h-[42px] px-4 py-2 rounded-xl btn-surface text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'bn' ? 'সকল গ্রুপ দেখুন' : 'Show All Groups'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenSOSWizard()}
                  className="min-h-[42px] px-4 py-2 rounded-xl btn-crimson text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Megaphone className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {lang === 'bn' ? 'জরুরি রক্তের আবেদন পোস্ট করুন' : 'Post Blood Request'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            activeRequests.map((req) => {
              const isCompatibleForMe = canDonorGiveToPatient(displayGroup, req.bloodGroup);
              const isMyOwnRequest = Boolean(
                (firebaseUser?.uid && req.authorUid === firebaseUser.uid) ||
                  (!req.authorUid && req.id.startsWith('sos_'))
              );
              const liveTime = formatRelativeRequestTime(
                req.createdAtMs,
                req.createdAt,
                lang,
                Date.now() + clockTick * 0
              );
              return (
                <div
                  key={req.id}
                  className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-rose-300 dark:hover:border-rose-800 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-xl btn-crimson flex flex-col items-center justify-center font-black text-base shrink-0">
                      <span>{req.bloodGroup}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                          {req.hospitalName}
                        </h4>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          ·{' '}
                          {req.urgency === 'CRITICAL'
                            ? lang === 'bn'
                              ? 'অতি জরুরি'
                              : 'Critical'
                            : req.urgency === 'URGENT'
                            ? lang === 'bn'
                              ? 'জরুরি'
                              : 'Urgent'
                            : lang === 'bn'
                            ? 'নির্ধারিত'
                            : 'Scheduled'}
                        </span>
                        {isCompatibleForMe && !isMyOwnRequest && (
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            · {lang === 'bn' ? 'আপনার গ্রুপ ম্যাচ করে' : 'Matches You'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1 flex-wrap tabular-nums">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{req.district}</span>
                        </span>
                        <span>·</span>
                        <span>{liveTime}</span>
                        <span>·</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {Math.max(1, req.unitsNeeded - req.unitsCollected)}{' '}
                          {lang === 'bn' ? 'ব্যাগ প্রয়োজন' : 'bag(s) needed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {isMyOwnRequest ? (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('requests')}
                        className="min-h-[42px] px-4 py-2 btn-obsidian font-bold text-xs rounded-xl cursor-pointer whitespace-nowrap"
                      >
                        {lang === 'bn' ? 'আপনার আবেদন দেখুন' : 'Manage Request'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onQuickDonate(req)}
                        className="min-h-[42px] px-4 py-2 btn-crimson font-bold text-xs rounded-xl cursor-pointer whitespace-nowrap"
                      >
                        {lang === 'bn' ? 'আমি রক্ত দেব' : 'Respond to Donate'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectRequest(req)}
                      className="min-h-[42px] w-10 rounded-xl btn-surface flex items-center justify-center cursor-pointer shrink-0"
                      title={lang === 'bn' ? 'শেয়ার করুন' : 'Share'}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 4. Two-Column Live Hospital/Donor Radar + 90d/14d Recovery Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Live Radar Map Card */}
        <section className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {lang === 'bn' ? 'লাইভ হাসপাতাল ও ডোনার ম্যাপ' : 'Live Hospital & Donor Map'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {isGpsActive
                    ? lang === 'bn'
                      ? 'GPS সক্রিয় · সরকারি ব্লাড ব্যাংক ও প্রকৃত ডোনার'
                      : 'GPS Active · Verified centers & real donors'
                    : lang === 'bn'
                    ? 'সরকারি ব্লাড ব্যাংক ও সক্রিয় ডোনার লোকেশন'
                    : 'Verified blood banks & active locations'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('map')}
              className="min-h-[40px] px-3.5 py-1.5 btn-obsidian font-semibold text-xs rounded-xl cursor-pointer whitespace-nowrap shrink-0"
            >
              {lang === 'bn' ? 'পূর্ণ ম্যাপ →' : 'Open Map →'}
            </button>
          </div>

          <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
            <div className="absolute inset-0 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-slate-700/60 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border border-slate-800/70 pointer-events-none" />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
              <span className="w-3 h-3 rounded-full bg-sky-400 ring-4 ring-sky-400/25" />
              <span className="text-[9px] font-bold text-sky-200 bg-slate-900/90 px-1.5 py-0.5 rounded mt-1 font-mono">
                {lang === 'bn' ? 'আপনি' : 'You'}
              </span>
            </div>

            {liveMiniPins.map((pin) => {
              const isSelected = activeSelectedPin?.id === pin.id;
              return (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => setSelectedPin(pin)}
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
                >
                  <span
                    className={`px-2 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] shadow-md transition-transform ${
                      isSelected
                        ? 'bg-rose-600 text-white ring-2 ring-white scale-110 z-30'
                        : pin.type === 'SOS'
                        ? 'bg-red-600 text-white'
                        : pin.type === 'DONOR'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-100 border border-slate-600'
                    }`}
                  >
                    {pin.label}
                  </span>
                </button>
              );
            })}

            <div className="absolute top-2.5 right-2.5 z-10 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-200 text-[10px] font-semibold font-mono tabular-nums">
              {liveMiniPins.length} {lang === 'bn' ? 'লোকেশন' : 'pins'}
            </div>
          </div>

          {activeSelectedPin && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className={`px-2.5 h-9 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                    activeSelectedPin.type === 'DONOR'
                      ? 'bg-emerald-600'
                      : activeSelectedPin.type === 'SOS'
                      ? 'bg-rose-600'
                      : 'bg-slate-800'
                  }`}
                >
                  <span>{activeSelectedPin.label}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight truncate">
                    {activeSelectedPin.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                    <span className="truncate">{activeSelectedPin.district}</span>
                    <span>·</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                      {activeSelectedPin.distance}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {activeSelectedPin.canDirectCall && activeSelectedPin.phone ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        if (activeSelectedPin.phone) {
                          const ok = await copyTextReliable(activeSelectedPin.phone);
                          if (ok) {
                            setCopiedPinPhone(true);
                            window.setTimeout(() => setCopiedPinPhone(false), 2000);
                          }
                        }
                      }}
                      className="min-h-[38px] px-2.5 py-1.5 btn-surface font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      title={activeSelectedPin.phone}
                    >
                      {copiedPinPhone ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="font-mono tabular-nums">{activeSelectedPin.phone}</span>
                    </button>
                    <a
                      href={`tel:${activeSelectedPin.phone}`}
                      className="min-h-[38px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{lang === 'bn' ? 'কল' : 'Call'}</span>
                    </a>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => onNavigateTab('map')}
                  className="min-h-[38px] w-9 bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer"
                  title="Open in Full Map"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 90-Day Whole Blood & 14-Day Platelet Recovery Tracker */}
        <section className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col justify-between space-y-3">
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    recovery.isEligible
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {recovery.isEligible ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                    {recovery.isEligible
                      ? lang === 'bn'
                        ? 'রক্তদানের জন্য প্রস্তুত'
                        : 'Eligible to Donate Today'
                      : lang === 'bn'
                      ? 'রক্তদান পরবর্তী রিকভারি বিশ্রাম'
                      : 'Post-Donation Recovery Active'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {lang === 'bn'
                      ? `সর্বশেষ: ${recovery.lastDonatedLabel} · পরবর্তী: ${recovery.nextEligibleDateLabel}`
                      : `Last: ${recovery.lastDonatedLabel} · Next: ${recovery.nextEligibleDateLabel}`}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-[11px] font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setRecoveryMode('WHOLE_BLOOD')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
                    recoveryMode === 'WHOLE_BLOOD'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {lang === 'bn' ? 'পূর্ণ রক্ত (৯০ দিন)' : 'Whole (90d)'}
                </button>
                <button
                  type="button"
                  onClick={() => setRecoveryMode('PLATELET')}
                  className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors whitespace-nowrap ${
                    recoveryMode === 'PLATELET'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {lang === 'bn' ? 'প্লাটিলেট (১৪ দিন)' : 'Platelet (14d)'}
                </button>
              </div>
            </div>

            {/* Countdown Bar & Digits */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  {lang === 'bn' ? 'রিকভারি অগ্রগতি' : 'Recovery Progress'}
                </span>
                <div className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {String(recovery.remainingDays).padStart(2, '0')}d :{' '}
                  {String(recovery.remainingHours).padStart(2, '0')}h :{' '}
                  {String(recovery.remainingMinutes).padStart(2, '0')}m
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${recovery.progressPercent}%` }}
                  className={`h-full transition-all ${
                    recovery.isEligible ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowLogDrawer(!showLogDrawer);
                  setShowReadinessCheck(false);
                  setShowCrossMatchGuide(false);
                }}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl btn-crimson font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'bn' ? 'রক্তদান লগ করুন' : 'Log Donation'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowReadinessCheck(!showReadinessCheck);
                  setShowLogDrawer(false);
                  setShowCrossMatchGuide(false);
                }}
                className="min-h-[40px] px-3 py-1.5 rounded-xl btn-surface font-semibold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Stethoscope className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{lang === 'bn' ? 'পূর্ব-প্রস্তুতি চেক' : 'Readiness Check'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCrossMatchGuide(!showCrossMatchGuide);
                  setShowLogDrawer(false);
                  setShowReadinessCheck(false);
                }}
                className="min-h-[40px] px-3 py-1.5 rounded-xl btn-surface font-semibold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <FlaskConical className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                <span>{lang === 'bn' ? 'ক্রস-ম্যাচ গাইড' : 'Cross-Match Guide'}</span>
              </button>
            </div>

            {showLogDrawer && (
              <form
                onSubmit={handleRecordDonationSubmit}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                      {lang === 'bn' ? 'রক্তদানের তারিখ' : 'Donation Date'}
                    </label>
                    <input
                      type="date"
                      value={logDateInput}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setLogDateInput(e.target.value)}
                      className="w-full h-10 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                      {lang === 'bn' ? 'হাসপাতাল / ব্লাড ব্যাংক' : 'Hospital / Blood Bank'}
                    </label>
                    <input
                      type="text"
                      value={logHospitalInput}
                      onChange={(e) => setLogHospitalInput(e.target.value)}
                      placeholder={lang === 'bn' ? 'যেমন: ঢাকা মেডিকেল' : 'e.g. DMCH'}
                      className="w-full h-10 px-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLogDrawer(false)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingDonation}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                  >
                    {isSavingDonation
                      ? lang === 'bn'
                        ? 'সেভ হচ্ছে...'
                        : 'Saving...'
                      : lang === 'bn'
                      ? 'ক্লাউডে সেভ করুন'
                      : 'Save & Start Timer'}
                  </button>
                </div>
              </form>
            )}

            {showReadinessCheck && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-900 dark:text-white">
                  {lang === 'bn'
                    ? 'রক্ত দিতে যাওয়ার আগে ৪টি জরুরি মেডিকেল চেক:'
                    : '4 Essential Checks Before Visiting the Blood Bank:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    {
                      k: 'slept6Hrs' as const,
                      label: lang === 'bn' ? 'গত রাতে অন্তত ৬ ঘণ্টা ঘুম হয়েছে' : 'Slept 6+ hours last night',
                    },
                    {
                      k: 'ateMeal' as const,
                      label: lang === 'bn' ? 'খালি পেটে নই (হালকা খাবার খেয়েছি)' : 'Had a meal within 3 hours',
                    },
                    {
                      k: 'hydrated' as const,
                      label: lang === 'bn' ? 'পর্যাপ্ত পানি পান করেছি' : 'Hydrated before donating',
                    },
                    {
                      k: 'noAntibiotics7d' as const,
                      label: lang === 'bn' ? 'গত ৭ দিনে অ্যান্টিবায়োটিক সেবন করিনি' : 'No antibiotics in 7 days',
                    },
                  ].map((item) => (
                    <label
                      key={item.k}
                      className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={readinessChecks[item.k]}
                        onChange={() =>
                          setReadinessChecks((prev) => ({ ...prev, [item.k]: !prev[item.k] }))
                        }
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
                <div
                  className={`text-[11px] font-semibold ${
                    readinessAllGood
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {readinessAllGood
                    ? lang === 'bn'
                      ? 'আপনি নিরাপদে রক্তদানের জন্য প্রস্তুত। রক্তদানের পর ১৫ মিনিট বিশ্রাম ও পানি পান করুন।'
                      : 'You are medically ready. Rest 15 mins & hydrate after donating.'
                    : lang === 'bn'
                    ? 'অনুগ্রহ করে উপরের সবগুলো শর্ত পূরণ করে তবেই রক্তদান করুন।'
                    : 'Please complete all 4 safety steps above before donating.'}
                </div>
              </div>
            )}

            {showCrossMatchGuide && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-rose-600 dark:text-rose-400">
                      Whole Blood / PRBC
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {lang === 'bn'
                        ? 'সার্জারি, রক্তক্ষরণ ও থ্যালাসেমিয়ায় ব্যবহৃত হয়। বিরতি: ৯০ দিন।'
                        : 'Trauma, surgery & thalassemia. Cooldown: 90 days.'}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">
                      SDP / RDP Platelet & 5-Test
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {lang === 'bn'
                        ? 'ডেঙ্গু ও ক্যান্সারে প্লাটিলেট বিরতি ১৪ দিন। HBV, HCV, HIV, Syphilis, Malaria টেস্ট আবশ্যক।'
                        : 'Platelet cooldown: 14 days. Verify mandatory 5-test lab screening.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 5. Essential Services & Care Tools Grid */}
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {lang === 'bn'
              ? 'জরুরি ডিরেক্টরি, থ্যালাসেমিয়া ও রোগী সহায়তা সেবা'
              : 'Emergency Directories & Patient Support Tools'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'ব্লাড ব্যাংক হটলাইন, ফ্রি পোস্টার জেনারেটর এবং ইমার্জেন্সি মেডিকেল টুলস'
              : 'Verified blood bank hotlines, poster generator & medical tools'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            {
              label: lang === 'bn' ? 'ব্লাড ব্যাংক ও ৯৯৯' : 'Blood Banks & 999',
              sub: lang === 'bn' ? '৩৪+ ভেরিফাইড হটলাইন' : '34+ Hotlines',
              icon: Building2,
              onClick: onOpenDirectory,
            },
            {
              label: lang === 'bn' ? 'থ্যালাসেমিয়া পুল' : 'Thalassemia Pool',
              sub: lang === 'bn' ? 'নিয়মিত রক্ত শিডিউল' : 'Recurring Care',
              icon: HeartHandshake,
              onClick: onOpenThalassemia,
            },
            {
              label: lang === 'bn' ? 'পোস্টার তৈরি' : 'SOS Poster',
              sub: lang === 'bn' ? 'FB ও WhatsApp কার্ড' : 'Shareable Card',
              icon: Sparkles,
              onClick: onOpenPoster,
            },
            {
              label: lang === 'bn' ? 'হাসপাতাল ম্যাপ' : 'Hospital Map',
              sub: lang === 'bn' ? 'নিকটস্থ কেন্দ্র' : 'Nearby Centers',
              icon: Hospital,
              onClick: () => onNavigateTab('map'),
            },
            {
              label: lang === 'bn' ? 'সম্মাননা ও সনদ' : 'Badges & Cert',
              sub: lang === 'bn' ? '.PNG সনদ ডাউনলোড' : 'Donor Honor',
              icon: Award,
              onClick: () => onNavigateTab('badges'),
            },
            {
              label: lang === 'bn' ? 'অ্যাপ ও APK গাইড' : 'Install & APK',
              sub: lang === 'bn' ? 'PWA ও Android' : 'Mobile Setup',
              icon: Smartphone,
              onClick: onOpenPlayStore,
            },
          ].map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={tool.onClick}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 hover:border-rose-300 dark:hover:border-rose-700 transition-colors flex flex-col items-start text-left cursor-pointer min-h-[96px] justify-between shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="mt-2 w-full">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">
                    {tool.label}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {tool.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Emergency Care Suite 6-Grid (Clean Icons, Zero Clutter) */}
        {onOpenCareSuite && (
          <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 space-y-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'bn'
                    ? 'ইমার্জেন্সি পেশেন্ট কেয়ার ও মেডিকেল টুলকিট'
                    : 'Emergency Patient Care Toolkit'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lang === 'bn'
                    ? 'মাতৃত্ব স্ট্যান্ডবাই, ডেঙ্গু প্লাটিলেট, অ্যাম্বুলেন্স ভাড়া হিসাব ও লক-স্ক্রিন মেডিকেল কার্ড'
                    : 'Maternity backup, dengue platelet log, ambulance fare & emergency medical ID'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(
                [
                  {
                    tab: 'maternity' as CareSuiteTab,
                    icon: HeartHandshake,
                    titleBn: 'মাতৃত্ব ও ডেলিভারি স্ট্যান্ডবাই',
                    subBn: 'সিজার/ডেলিভারি ব্যাকআপ ডোনার ও Rh- সতর্কতা',
                    titleEn: 'Maternity Standby',
                    subEn: 'Delivery backup donors & Rh- alert',
                  },
                  {
                    tab: 'dengue' as CareSuiteTab,
                    icon: Activity,
                    titleBn: 'ডেঙ্গু প্লাটিলেট ও CBC ট্র্যাকার',
                    subBn: 'প্লাটিলেট কাউন্ট, HCT% ও SDP SOS',
                    titleEn: 'Dengue Platelet Tracker',
                    subEn: 'CBC log, danger alert & SDP SOS',
                  },
                  {
                    tab: 'ambulance' as CareSuiteTab,
                    icon: Truck,
                    titleBn: 'অ্যাম্বুলেন্স ভাড়া ও সরকারি টেস্ট ফি',
                    subBn: 'ন্যায্য ভাড়া হিসাব ও ব্লাড স্ক্রিনিং রেট',
                    titleEn: 'Ambulance & Fee Chart',
                    subEn: 'Fair fare calculator & govt blood rates',
                  },
                  {
                    tab: 'ice_wallpaper' as CareSuiteTab,
                    icon: Smartphone,
                    titleBn: 'লক-স্ক্রিন মেডিকেল কার্ড (.PNG)',
                    subBn: 'জরুরি রক্তের গ্রুপ ও অভিভাবকের নম্বর',
                    titleEn: 'Lock-Screen Medical ID',
                    subEn: 'Download emergency .PNG wallpaper',
                  },
                  {
                    tab: 'diet' as CareSuiteTab,
                    icon: Utensils,
                    titleBn: '৭ দিনের আয়রন ডায়েট ও রমজান গাইড',
                    subBn: 'রক্তদান পরবর্তী দেশি খাবার ও রোজা নির্দেশিকা',
                    titleEn: 'Iron Diet & Ramadan Guide',
                    subEn: '7-day recovery meal & fasting guide',
                  },
                  {
                    tab: 'gratitude' as CareSuiteTab,
                    icon: FileCheck2,
                    titleBn: 'কৃতজ্ঞতা ওয়াল ও স্মার্ট আইডি যাচাই',
                    subBn: 'রোগীর পরিবারের বার্তা ও ডোনার কার্ড চেকার',
                    titleEn: 'Gratitude & ID Verifier',
                    subEn: 'Patient thank-you wall & ID verifier',
                  },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => onOpenCareSuite(item.tab)}
                    className="min-h-[58px] p-3 rounded-xl bg-slate-50/90 dark:bg-[#0d1322] hover:bg-rose-50/70 dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 transition-colors text-left flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug truncate">
                        {lang === 'bn' ? item.titleBn : item.titleEn}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {lang === 'bn' ? item.subBn : item.subEn}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export const DonorHomeView = React.memo(DonorHomeViewInner);
