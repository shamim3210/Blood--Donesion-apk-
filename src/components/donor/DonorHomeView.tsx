import React, { useState, useEffect, useMemo } from 'react';
import { BloodRequest, BloodGroup, Donor, Language } from '../../types';
import {
  isSeedDonorId,
  isSeedRequestId,
  evictSeedsProgressively,
} from '../../data/mockDonors';
import {
  requestRealDeviceGPS,
  Coordinates,
  DEFAULT_BANGLADESH_COORDS,
} from '../../utils/geolocation';
import {
  calculateRecoveryCountdown,
  getStoredDonationLogs,
  playEmergencySosChime,
  requestSosNotificationPermission,
  canDonorGiveToPatient,
  DonationIntervalType,
} from '../../utils/sosAlertEngine';
import {
  auth,
  onAuthStateChanged,
  signOutReal,
  DEFAULT_AVATAR_DATA_URI,
  recordCompletedDonationInFirestore,
  subscribeBloodStock,
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
  ShieldCheck,
  Award,
  Phone,
  ExternalLink,
  LogOut,
  Building2,
  Flame,
  UserPlus,
  Lock,
  MessageSquare,
  Bell,
  Volume2,
  VolumeX,
  CalendarCheck,
  Clock,
} from 'lucide-react';
import type { CareSuiteTab } from '../ecosystem/EmergencyCareSuiteModal';

interface DonorHomeViewProps {
  donors?: Donor[];
  requests: BloodRequest[];
  lang: Language;
  onOpenSOSWizard: () => void;
  onOpenRegister: (role?: 'USER' | 'ADMIN') => void;
  onOpenAuthModal?: () => void;
  onSelectRequest: (req: BloodRequest) => void;
  onQuickDonate: (req: BloodRequest) => void;
  onNavigateTab: (tab: any) => void;
  onOpenDirectory?: () => void;
  onOpenPoster?: () => void;
  onOpenThalassemia?: () => void;
  onOpenPlayStore?: () => void;
  onOpenCareSuite?: (tab?: CareSuiteTab) => void;
  sosSoundEnabled?: boolean;
  onToggleSosSound?: () => void;
}

interface MiniMapPin {
  id: string;
  name: string;
  group: BloodGroup;
  type: 'DONOR' | 'SOS' | 'HOSPITAL';
  distance: string;
  district: string;
  phone: string;
  x: number;
  y: number;
}

const MINI_MAP_PINS: MiniMapPin[] = [
  {
    id: 'pin-1',
    name: 'ঢাকা মেডিকেল কলেজ হাসপাতাল',
    group: 'O-',
    type: 'SOS',
    distance: '১.২ কিমি',
    district: 'শাহবাগ, ঢাকা',
    phone: '+8801711223344',
    x: 52,
    y: 42,
  },
  {
    id: 'pin-2',
    name: 'কামাল হোসেন (প্রস্তুত রক্তদাতা)',
    group: 'B+',
    type: 'DONOR',
    distance: '১.৮ কিমি',
    district: 'ধানমন্ডি ২৭, ঢাকা',
    phone: '+8801822334455',
    x: 36,
    y: 50,
  },
  {
    id: 'pin-3',
    name: 'ফারজানা আক্তার (প্রস্তুত রক্তদাতা)',
    group: 'O-',
    type: 'DONOR',
    distance: '৩.২ কিমি',
    district: 'উত্তরা সেক্টর ৭, ঢাকা',
    phone: '+8801755667788',
    x: 56,
    y: 22,
  },
  {
    id: 'pin-4',
    name: 'বিএসএমএমইউ (পিজি হাসপাতাল)',
    group: 'A+',
    type: 'HOSPITAL',
    distance: '২.০ কিমি',
    district: 'বাংলামোটর, ঢাকা',
    phone: '+8801933445566',
    x: 64,
    y: 46,
  },
  {
    id: 'pin-5',
    name: 'তানভীর আহমেদ (জরুরি ডোনার)',
    group: 'AB-',
    type: 'DONOR',
    distance: '৪.১ কিমি',
    district: 'মিরপুর ১০, ঢাকা',
    phone: '+8801688990011',
    x: 32,
    y: 28,
  },
];

const DonorHomeViewInner: React.FC<DonorHomeViewProps> = ({
  donors = [],
  requests,
  lang,
  onOpenSOSWizard,
  onOpenRegister,
  onOpenAuthModal,
  onSelectRequest,
  onQuickDonate,
  onNavigateTab,
  onOpenDirectory,
  onOpenPoster,
  onOpenThalassemia,
  onOpenPlayStore,
  onOpenCareSuite,
  sosSoundEnabled = true,
  onToggleSosSound,
}) => {
  const [rareOnlyFilter, setRareOnlyFilter] = useState(false);
  const [liveBloodStock, setLiveBloodStock] = useState<Record<BloodGroup, number>>({
    'A+': 34,
    'A-': 8,
    'B+': 42,
    'B-': 6,
    'AB+': 18,
    'AB-': 3,
    'O+': 56,
    'O-': 5,
  });

  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      unsub = subscribeBloodStock((updates) => {
        if (Object.keys(updates).length > 0) {
          setLiveBloodStock((prev) => ({ ...prev, ...(updates as Record<BloodGroup, number>) }));
        }
      });
    } catch {}
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const inventoryMetrics = useMemo(() => {
    const countDonors = (groups: BloodGroup[]) =>
      donors.filter((d) => d.available && groups.includes(d.bloodGroup)).length;
    const aPosUnits = (liveBloodStock['A+'] || 0) + countDonors(['A+', 'B+']);
    const rareNegUnits =
      (liveBloodStock['O-'] || 0) +
      (liveBloodStock['B-'] || 0) +
      (liveBloodStock['A-'] || 0) +
      (liveBloodStock['AB-'] || 0) +
      countDonors(['O-', 'B-', 'A-', 'AB-']);
    const oPosUnits = (liveBloodStock['O+'] || 0) + countDonors(['O+']);

    return {
      aPosPct: Math.min(99, Math.max(15, Math.round((aPosUnits / 60) * 100))),
      rareNegPct: Math.min(99, Math.max(8, Math.round((rareNegUnits / 40) * 100))),
      oPosPct: Math.min(99, Math.max(20, Math.round((oPosUnits / 65) * 100))),
      totalReadyDonors: donors.filter((d) => d.available).length,
    };
  }, [liveBloodStock, donors]);

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('bloodsearch_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Live minute ticker for real 90-day / 14-day recovery countdown
  const [clockTick, setClockTick] = useState(0);
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
  const displayName =
    currentUser?.name ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split('@')[0] ||
    (lang === 'bn' ? 'স্বাগতম রক্তযোদ্ধা' : 'Welcome Donor');
  const displayGroup: BloodGroup = currentUser?.bloodGroup || 'B+';
  const displayPhoto = currentUser?.photoUrl || firebaseUser?.photoURL;

  const activeRequests = useMemo(() => {
    const base = requests.filter((r) => r.status === 'ACTIVE');
    const filtered = rareOnlyFilter ? base.filter((r) => r.bloodGroup.endsWith('-')) : base;
    return filtered.slice(0, 4);
  }, [requests, rareOnlyFilter]);

  const compatibleUrgentCount = useMemo(
    () =>
      requests.filter(
        (r) => r.status === 'ACTIVE' && canDonorGiveToPatient(displayGroup, r.bloodGroup)
      ).length,
    [requests, displayGroup]
  );

  // Real 90-Day Whole Blood / 14-Day Platelet Recovery State
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

  // Pre-Donation Hospital Readiness Quick Checklist + Blood Component & Cross-Match Guide
  const [showReadinessCheck, setShowReadinessCheck] = useState(false);
  const [showCrossMatchGuide, setShowCrossMatchGuide] = useState(false);
  const [readinessChecks, setReadinessChecks] = useState({
    slept6Hrs: true,
    ateMeal: true,
    hydrated: true,
    noAntibiotics7d: true,
  });
  const readinessAllGood = Object.values(readinessChecks).every(Boolean);

  // Browser Notification Permission State
  const [notifPerm, setNotifPerm] = useState<string>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'UNSUPPORTED'
  );

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
      { x: 52, y: 42, dist: '১.২ কিমি' },
      { x: 36, y: 50, dist: '১.৮ কিমি' },
      { x: 56, y: 24, dist: '২.৪ কিমি' },
      { x: 64, y: 46, dist: '৩.০ কিমি' },
      { x: 32, y: 28, dist: '৩.৬ কিমি' },
      { x: 46, y: 66, dist: '৪.২ কিমি' },
    ];
    const realItems: MiniMapPin[] = [];
    for (const req of requests) {
      if (!isSeedRequestId(req.id) && req.status === 'ACTIVE' && realItems.length < slots.length) {
        const slot = slots[realItems.length];
        realItems.push({
          id: `real-sos-${req.id}`,
          name: req.hospitalName,
          group: req.bloodGroup,
          type: 'SOS',
          distance: slot.dist,
          district: req.district,
          phone: req.contactPhone || '+8801700000000',
          x: slot.x,
          y: slot.y,
        });
      }
    }
    for (const d of donors) {
      if (!isSeedDonorId(d.id) && d.available && realItems.length < slots.length) {
        const slot = slots[realItems.length];
        realItems.push({
          id: `real-donor-${d.id}`,
          name: d.name,
          group: d.bloodGroup,
          type: 'DONOR',
          distance: slot.dist,
          district: `${d.upazila}, ${d.district}`,
          phone: d.phone,
          x: slot.x,
          y: slot.y,
        });
      }
    }
    return evictSeedsProgressively(realItems, MINI_MAP_PINS);
  }, [donors, requests]);

  const [selectedPin, setSelectedPin] = useState<MiniMapPin | null>(MINI_MAP_PINS[0] || null);
  const activeSelectedPin = useMemo(
    () =>
      (selectedPin && liveMiniPins.find((p) => p.id === selectedPin.id)) ||
      liveMiniPins[0] ||
      null,
    [selectedPin, liveMiniPins]
  );

  const [rsvps, setRsvps] = useState<Record<string, boolean>>({
    'ev-1': false,
    'ev-2': true,
    'ev-3': false,
  });

  const toggleRsvp = (id: string) => {
    setRsvps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [homeNotice, setHomeNotice] = useState<string | null>(null);

  const showTempNotice = (msg: string) => {
    setHomeNotice(msg);
    setTimeout(() => setHomeNotice(null), 3800);
  };

  const handleEnableBrowserNotifications = async () => {
    const res = await requestSosNotificationPermission();
    setNotifPerm(res);
    if (res === 'granted') {
      playEmergencySosChime();
      showTempNotice(
        lang === 'bn'
          ? '✓ জরুরি SOS নোটিফিকেশন ও অ্যালার্ট সাউন্ড সক্রিয় হয়েছে!'
          : '✓ Live SOS browser notifications & chime enabled!'
      );
    } else if (res === 'UNSUPPORTED') {
      playEmergencySosChime();
      showTempNotice(
        lang === 'bn'
          ? '✓ ইন-অ্যাপ জরুরি অ্যালার্ট সাউন্ড সক্রিয় আছে!'
          : '✓ In-app emergency sound radar is active!'
      );
    }
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
          ? `✓ রক্তদান লগ সম্পন্ন! মোট রক্তদান: ${res.totalDonations} বার। আপনার ${
              recoveryMode === 'PLATELET' ? '১৪ দিনের প্লাটিলেট' : '৯০ দিনের'
            } রিকভারি টাইমার চালু হয়েছে।`
          : `✓ Donation recorded (${res.totalDonations} total). Recovery timer started!`
      );
    } finally {
      setIsSavingDonation(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOutReal();
    } catch {}
    setCurrentUser(null);
    setFirebaseUser(null);
    showTempNotice(
      lang === 'bn'
        ? '✓ আপনি সফলভাবে অ্যাকাউন্ট থেকে লগআউট হয়েছেন।'
        : '✓ Successfully signed out.'
    );
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto text-left pb-8">
      {homeNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
          {homeNotice}
        </div>
      )}

      {/* 1. Top User Profile & Quick Login / Logout Bar */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div
          onClick={() => onNavigateTab('profile')}
          className="flex items-center gap-3 cursor-pointer group min-w-0 flex-1"
          title="প্রোফাইল দেখুন"
        >
          <div className="relative shrink-0">
            {displayPhoto ? (
              <img
                src={displayPhoto}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_DATA_URI;
                }}
                referrerPolicy="no-referrer"
                alt={displayName}
                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-rose-500/30 shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                <span>{displayGroup}</span>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-xs text-slate-600 dark:text-slate-400 font-semibold truncate">
              {isLoggedIn
                ? currentUser?.role === 'ADMIN'
                  ? lang === 'bn'
                    ? 'অ্যাডমিন প্যানেল সক্রিয়'
                    : 'Admin Active'
                  : lang === 'bn'
                  ? `${displayGroup} ভেরিফাইড প্রোফাইল · ${compatibleUrgentCount}টি ম্যাচিং আবেদন`
                  : `${displayGroup} Verified · ${compatibleUrgentCount} compatible SOS`
                : lang === 'bn'
                ? 'গেস্ট মোড · লগইন করুন'
                : 'Guest Mode'}
            </div>
            <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight group-hover:text-rose-600 transition-colors truncate">
              {displayName}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="min-h-[38px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
              title="অ্যাকাউন্ট থেকে লগআউট"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
            </button>
          )}

          <button
            onClick={onOpenAuthModal}
            className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs transition-colors cursor-pointer whitespace-nowrap"
            title="লগইন বা অ্যাকাউন্ট পরিচালনা"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>
              {isLoggedIn
                ? lang === 'bn'
                  ? 'অ্যাকাউন্ট'
                  : 'Account'
                : lang === 'bn'
                ? 'লগইন'
                : 'Login'}
            </span>
          </button>
        </div>
      </div>

      {/* 1.2. LIVE SOS PUSH & SOUND RADAR CONTROL STRIP */}
      <div className="rounded-2xl p-3 bg-slate-900 dark:bg-[#162032] text-white border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold leading-snug">
              {lang === 'bn'
                ? `লাইভ SOS ব্লাড রাডার (${displayGroup} ম্যাচিং অ্যালার্ট)`
                : `Live SOS Blood Radar (${displayGroup} Match Alerts)`}
            </div>
            <p className="text-[11px] text-slate-300 truncate">
              {notifPerm === 'granted'
                ? lang === 'bn'
                  ? 'পুশ নোটিফিকেশন সক্রিয় · জরুরি আবেদনে তাৎক্ষণিক অ্যালার্ট পাবেন'
                  : 'Browser push notifications active for matching emergencies'
                : lang === 'bn'
                ? 'জরুরি রক্তের আবেদন আসার সাথে সাথে ফোনে নোটিফিকেশন ও অ্যালার্ট পান'
                : 'Enable instant sound & push alerts when matching blood is needed'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleSosSound && (
            <button
              type="button"
              onClick={onToggleSosSound}
              className={`min-h-[36px] px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer border ${
                sosSoundEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="SOS অ্যালার্ট সাউন্ড অন/অফ"
            >
              {sosSoundEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span>{sosSoundEnabled ? (lang === 'bn' ? 'সাউন্ড অন' : 'Sound On') : 'Muted'}</span>
            </button>
          )}

          {notifPerm !== 'granted' ? (
            <button
              type="button"
              onClick={handleEnableBrowserNotifications}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] cursor-pointer whitespace-nowrap"
            >
              {lang === 'bn' ? 'নোটিফিকেশন অন করুন' : 'Enable Alerts'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playEmergencySosChime();
                showTempNotice(
                  lang === 'bn'
                    ? '🔔 টেস্ট SOS অ্যালার্ট বাজানো হয়েছে — আপনার রাডার সচল আছে!'
                    : '🔔 Test SOS chime played — radar active!'
                );
              }}
              className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] cursor-pointer"
            >
              {lang === 'bn' ? 'টেস্ট সাউন্ড' : 'Test Chime'}
            </button>
          )}
        </div>
      </div>

      {/* 1.5. SMART ID REGISTRATION & ADMIN PANEL HUB */}
      <div className="rounded-2xl p-3.5 bg-white dark:bg-[#1e293b] border-2 border-rose-500/35 dark:border-rose-500/30 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
              {lang === 'bn' ? 'অ্যাকাউন্ট ও প্যানেল হাব' : 'ID & PANEL HUB'}
            </span>
            <h2 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
              {lang === 'bn'
                ? 'স্মার্ট আইডি রেজিস্ট্রেশন ও অ্যাডমিন কন্ট্রোল'
                : 'Smart ID Registration & Admin Panel'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenAuthModal}
            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            {lang === 'bn' ? 'Gmail / সিম লগইন →' : 'Gmail / SIM Login →'}
          </button>
        </div>

        <div className="grid grid-cols-1 @xl:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onOpenRegister('USER')}
            className="w-full p-3 rounded-xl bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/35 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800 text-left flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-black text-xs text-slate-900 dark:text-white block truncate">
                  {lang === 'bn' ? 'ইউজার প্যানেল আইডি' : 'User Panel ID'}
                </span>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 block truncate">
                  {lang === 'bn' ? 'স্মার্ট ডোনার কার্ড তৈরি করুন' : 'Create Smart Donor ID'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-500 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onOpenRegister('ADMIN')}
            className="w-full p-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/35 dark:hover:bg-amber-900/40 border border-amber-300 dark:border-amber-800 text-left flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-black text-xs text-slate-900 dark:text-white block truncate">
                  {lang === 'bn' ? 'অ্যাডমিন প্যানেল আইডি' : 'Admin Panel ID'}
                </span>
                <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold block truncate">
                  {lang === 'bn' ? 'গোপন কোড আবশ্যক' : 'Secret Code Required'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-600 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('admin')}
            className="w-full p-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700 text-left flex items-center justify-between gap-2.5 cursor-pointer transition-colors text-white"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-black text-xs text-white block truncate">
                  {lang === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel'}
                </span>
                <span className="text-[11px] text-slate-300 block truncate">
                  {lang === 'bn' ? 'ডোনার অনুমোদন ও স্টক নিয়ন্ত্রণ' : 'Moderation & Stock Control'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
          </button>
        </div>
      </div>

      {/* 2. Prominent Red Emergency Broadcast Banner + Live WhatsApp Chat Shortcut */}
      <div className="grid grid-cols-1 @xl:grid-cols-2 gap-2.5">
        <div
          onClick={onOpenSOSWizard}
          className="w-full rounded-2xl p-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 text-white shadow-md flex items-center justify-between gap-3 cursor-pointer hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 block">
                {lang === 'bn' ? 'জরুরি রক্তের আবেদন' : 'EMERGENCY REQUEST'}
              </span>
              <h2 className="text-sm font-black tracking-tight leading-snug truncate">
                {lang === 'bn' ? '১-ক্লিকে জরুরি আবেদন পাঠান' : 'Broadcast Blood Need'}
              </h2>
              <p className="text-[11px] text-rose-100 mt-0.5 truncate">
                {lang === 'bn'
                  ? 'নিকটস্থ রক্তদাতারা তৎক্ষণাৎ বার্তা পাবেন'
                  : 'Alert nearby donors within 5 km'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white shrink-0" />
        </div>

        <div
          onClick={() => onNavigateTab('chat')}
          className="w-full rounded-2xl p-3.5 bg-gradient-to-r from-[#075e54] to-[#128c7e] text-white shadow-md flex items-center justify-between gap-3 cursor-pointer hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 block">
                {lang === 'bn' ? 'লাইভ মেসেঞ্জার · GPS ও স্লিপ ছবি' : 'LIVE CHAT · GPS & SLIP PHOTO'}
              </span>
              <h2 className="text-sm font-black tracking-tight leading-snug truncate">
                {lang === 'bn'
                  ? 'ইউজার-টু-ইউজার চ্যাট, লোকেশন ও WhatsApp'
                  : 'Live Donor Chat, GPS Pin & WhatsApp'}
              </h2>
              <p className="text-[11px] text-emerald-100 mt-0.5 truncate">
                {lang === 'bn'
                  ? 'হাসপাতাল স্লিপ, লাইভ GPS পিন ও ভয়েস টাইপিং সাপোর্ট'
                  : 'Share prescription slips, live GPS pins & voice typing'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white shrink-0" />
        </div>
      </div>

      {/* 3. Live Blood Donor & Hospital Radar Map */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-xs @md:text-sm text-slate-900 dark:text-white truncate">
                  {lang === 'bn' ? 'লাইভ রক্তদাতা ও হাসপাতাল ম্যাপ' : 'Live Donor & Hospital Map'}
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  · {lang === 'bn' ? 'সক্রিয় রাডার' : 'Live Radar'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                {lang === 'bn'
                  ? 'আপনার চারপাশে প্রস্তুত রক্তদাতা ও জরুরি কেন্দ্র'
                  : 'Verified donors and emergency hospitals nearby'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('map')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {lang === 'bn' ? 'পূর্ণ ম্যাপ →' : 'Full Map →'}
          </button>
        </div>

        <div className="relative w-full h-48 @md:h-56 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-[#0c121e]">
          <div className="absolute inset-0 bg-[radial-gradient(#e11d48_1.2px,transparent_1.2px)] [background-size:18px_18px] opacity-25" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 rounded-full border border-rose-500/20 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full border border-rose-500/10 pointer-events-none" />

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-blue-500/30" />
            <span className="text-[9px] font-black text-blue-300 bg-slate-900/90 px-1.5 py-0.5 rounded mt-1 font-mono">
              {lang === 'bn' ? 'আপনার অবস্থান' : 'You'}
            </span>
          </div>

          {liveMiniPins.map((pin) => {
            const isSelected = activeSelectedPin?.id === pin.id;
            return (
              <div
                key={pin.id}
                onClick={() => setSelectedPin(pin)}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-md transition-transform ${
                    isSelected
                      ? 'bg-rose-600 text-white ring-4 ring-white dark:ring-slate-900 scale-110 z-30'
                      : pin.type === 'SOS'
                      ? 'bg-red-600 text-white ring-2 ring-red-400'
                      : pin.type === 'DONOR'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                      : 'bg-slate-800 text-white border border-slate-600'
                  }`}
                >
                  {pin.group}
                </div>
              </div>
            );
          })}

          <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-emerald-400 text-[10px] font-bold font-mono">
            {liveMiniPins.length}টি পিন
          </div>
        </div>

        {activeSelectedPin && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs ${
                  activeSelectedPin.type === 'DONOR' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                <span>{activeSelectedPin.group}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight truncate">
                  {activeSelectedPin.name}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate">{activeSelectedPin.district}</span>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                    {activeSelectedPin.distance}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`tel:${activeSelectedPin.phone}`}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'কল' : 'Call'}</span>
              </a>
              <button
                onClick={() => onNavigateTab('map')}
                className="p-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 cursor-pointer"
                title="Open in Map"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. REAL DYNAMIC 90-DAY WHOLE BLOOD & 14-DAY PLATELET RECOVERY TRACKER + PRE-DONATION CHECKLIST */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 shadow-sm rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                recovery.isEligible
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
              }`}
            >
              {recovery.isEligible ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  {recovery.isEligible
                    ? lang === 'bn'
                      ? 'রক্তদানের জন্য শতভাগ প্রস্তুত'
                      : 'Eligible to Donate Today'
                    : lang === 'bn'
                    ? 'রক্তদান পরবর্তী রিকভারি বিশ্রাম চলছে'
                    : 'Post-Donation Recovery Active'}
                </span>
                {/* Segmented Whole Blood (90d) vs Platelet (14d) Switch */}
                <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setRecoveryMode('WHOLE_BLOOD')}
                    className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                      recoveryMode === 'WHOLE_BLOOD'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lang === 'bn' ? 'পূর্ণ রক্ত (৯০ দিন)' : 'Whole (90d)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveryMode('PLATELET')}
                    className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                      recoveryMode === 'PLATELET'
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lang === 'bn' ? 'প্লাটিলেট (১৪ দিন)' : 'Platelet (14d)'}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                {lang === 'bn'
                  ? `সর্বশেষ রক্তদান: ${recovery.lastDonatedLabel} · পরবর্তী তারিখ: ${recovery.nextEligibleDateLabel}`
                  : `Last: ${recovery.lastDonatedLabel} · Next: ${recovery.nextEligibleDateLabel}`}
              </p>
            </div>
          </div>

          {/* Live Dynamic Countdown Box */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#0f172a] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shrink-0 tabular-nums">
            <div className="text-center font-mono">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {String(recovery.remainingDays).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 block font-bold -mt-1">
                {lang === 'bn' ? 'দিন' : 'Day'}
              </span>
            </div>
            <span className="text-slate-500 font-bold">:</span>
            <div className="text-center font-mono">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {String(recovery.remainingHours).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 block font-bold -mt-1">
                {lang === 'bn' ? 'ঘণ্টা' : 'Hrs'}
              </span>
            </div>
            <span className="text-slate-500 font-bold">:</span>
            <div className="text-center font-mono">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {String(recovery.remainingMinutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] text-slate-600 dark:text-slate-400 block font-bold -mt-1">
                {lang === 'bn' ? 'মিনিট' : 'Min'}
              </span>
            </div>
          </div>
        </div>

        {/* Recovery Progress Bar + Action Buttons */}
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${recovery.progressPercent}%` }}
              className={`h-full transition-all ${
                recovery.isEligible ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setShowLogDrawer(!showLogDrawer);
                setShowReadinessCheck(false);
                setShowCrossMatchGuide(false);
              }}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>
                {lang === 'bn' ? '✓ রক্তদান সম্পন্ন লগ করুন' : '✓ Log Completed Donation'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowReadinessCheck(!showReadinessCheck);
                setShowLogDrawer(false);
                setShowCrossMatchGuide(false);
              }}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0f172a] dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs cursor-pointer"
            >
              {lang === 'bn'
                ? '🩺 রক্তদানের পূর্ব-প্রস্তুতি চেক'
                : '🩺 Pre-Donation Check'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowCrossMatchGuide(!showCrossMatchGuide);
                setShowLogDrawer(false);
                setShowReadinessCheck(false);
              }}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 font-bold text-xs cursor-pointer"
            >
              {lang === 'bn'
                ? '🧪 রক্তের ব্যাগ ও ক্রস-ম্যাচ গাইড'
                : '🧪 Blood Bag & Cross-Match Guide'}
            </button>
          </div>
        </div>

        {/* Inline Drawer 1: Log Completed Donation */}
        {showLogDrawer && (
          <form
            onSubmit={handleRecordDonationSubmit}
            className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs"
          >
            <div className="grid grid-cols-1 @md:grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'bn' ? 'রক্তদানের তারিখ' : 'Donation Date'}
                </label>
                <input
                  type="date"
                  value={logDateInput}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setLogDateInput(e.target.value)}
                  className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'bn' ? 'হাসপাতাল / ব্লাড ব্যাংক' : 'Hospital / Blood Bank'}
                </label>
                <input
                  type="text"
                  value={logHospitalInput}
                  onChange={(e) => setLogHospitalInput(e.target.value)}
                  placeholder={lang === 'bn' ? 'যেমন: ঢাকা মেডিকেল / সন্ধানী' : 'e.g. DMCH / Sandhani'}
                  className="w-full h-9 px-2.5 rounded-lg bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogDrawer(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSavingDonation}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
              >
                {isSavingDonation
                  ? lang === 'bn'
                    ? 'সেভ হচ্ছে...'
                    : 'Saving...'
                  : lang === 'bn'
                  ? '✓ ডায়েরি ও ক্লাউডে সেভ করুন'
                  : '✓ Save & Start Timer'}
              </button>
            </div>
          </form>
        )}

        {/* Inline Drawer 2: Hospital Pre-Donation Readiness Checklist */}
        {showReadinessCheck && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-slate-900 dark:text-white">
              {lang === 'bn'
                ? 'রক্ত দিতে যাওয়ার আগে ৪টি জরুরি মেডিকেল চেক:'
                : '4 Essential Checks Before Visiting the Blood Bank:'}
            </div>
            <div className="grid grid-cols-1 @md:grid-cols-2 gap-1.5">
              {[
                {
                  k: 'slept6Hrs' as const,
                  label: lang === 'bn' ? 'গত রাতে অন্তত ৬ ঘণ্টা ঘুম হয়েছে' : 'Slept 6+ hours last night',
                },
                {
                  k: 'ateMeal' as const,
                  label:
                    lang === 'bn'
                      ? 'খালি পেটে নই (হালকা খাবার খেয়েছি)'
                      : 'Had a meal within last 3 hours',
                },
                {
                  k: 'hydrated' as const,
                  label:
                    lang === 'bn'
                      ? 'পর্যাপ্ত পানি / ডাবের পানি পান করেছি'
                      : 'Drank 500ml water before donating',
                },
                {
                  k: 'noAntibiotics7d' as const,
                  label:
                    lang === 'bn'
                      ? 'গত ৭ দিনে অ্যান্টিবায়োটিক সেবন করিনি'
                      : 'No antibiotics in the past 7 days',
                },
              ].map((item) => (
                <label
                  key={item.k}
                  className="p-2 rounded-lg bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 flex items-center gap-2 cursor-pointer"
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
              className={`text-[11px] font-bold ${
                readinessAllGood
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              {readinessAllGood
                ? lang === 'bn'
                  ? '✓ আপনি এখন নিরাপদে রক্তদানের জন্য প্রস্তুত! রক্তদানের পর ১৫ মিনিট বিশ্রাম ও স্যালাইন/পানি পান করুন।'
                  : '✓ You are medically ready! Rest 15 mins & hydrate well after donating.'
                : lang === 'bn'
                ? '⚠ অনুগ্রহ করে উপরের সবগুলো শর্ত পূরণ করে তবেই রক্তদান করুন।'
                : '⚠ Please complete all 4 safety steps above before donating.'}
            </div>
          </div>
        )}

        {/* Inline Drawer 3: Hospital Blood Component & Cross-Match Guide */}
        {showCrossMatchGuide && (
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-[#0f172a] border border-blue-200 dark:border-slate-800 space-y-2.5 text-xs">
            <div className="font-bold text-slate-900 dark:text-white">
              {lang === 'bn'
                ? 'হাসপাতালে ডাক্তারের স্লিপ অনুযায়ী রক্তের উপাদান ও ক্রস-ম্যাচ নিয়মাবলি:'
                : 'Hospital Blood Components & Cross-Matching Guide:'}
            </div>
            <div className="grid grid-cols-1 @md:grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700">
                <div className="font-black text-rose-600 dark:text-rose-400">
                  Whole Blood (CPDA-1 / Single Bag)
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  {lang === 'bn'
                    ? 'তীব্র রক্তক্ষরণ, দুর্ঘটনা বা সার্জারিতে ব্যবহৃত হয়। বিরতি: ৯০ দিন।'
                    : 'Used in acute trauma, surgery & hemorrhage. Cooldown: 90 days.'}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700">
                <div className="font-black text-rose-600 dark:text-rose-400">
                  PRBC / Packed Red Cells
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  {lang === 'bn'
                    ? 'থ্যালাসেমিয়া, কিডনি ডায়ালাইসিস ও রক্তস্বল্পতায় (হিমোগ্লোবিন কম থাকলে) দেওয়া হয়।'
                    : 'Essential for Thalassemia, dialysis & severe anemia patients.'}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700">
                <div className="font-black text-amber-600 dark:text-amber-400">
                  SDP / RDP Platelet (ডেঙ্গু ও ক্যান্সার)
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  {lang === 'bn'
                    ? 'ডেঙ্গু শক সিনড্রোম ও ব্লাড ক্যান্সারে প্লাটিলেট অ্যাফেরেসিস। বিরতি মাত্র ১৪ দিন!'
                    : 'Critical for Dengue & oncology patients. Apheresis cooldown: 14 days!'}
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700">
                <div className="font-black text-emerald-700 dark:text-emerald-400">
                  ৫টি বাধ্যতামূলক স্ক্রিনিং ও ক্রস-ম্যাচ (৪৫-৬০ মিনিট)
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  {lang === 'bn'
                    ? 'রক্ত দেওয়ার আগে ব্লাড ব্যাংকে HBV, HCV, HIV, Syphilis ও Malaria স্ক্রিনিং নিশ্চিত করুন।'
                    : 'Always verify mandatory 5-test screening & cross-matching at licensed labs.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Quick Actions 6-Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {lang === 'bn' ? 'জরুরি ও দ্রুত সেবা' : 'Emergency & Quick Actions'}
          </div>
          {isGpsActive && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
              {lang === 'bn' ? 'GPS সক্রিয়' : 'GPS Ready'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 @lg:grid-cols-3 gap-2.5">
          <button
            onClick={onOpenSOSWizard}
            className="p-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 shadow-xs hover:border-rose-500 transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1.5">
              <Droplet className="w-5 h-5 fill-rose-600" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'রক্তের আবেদন' : 'Request Blood'}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {lang === 'bn' ? 'জরুরি রক্তের চাহিদা' : '1-Click SOS'}
            </span>
          </button>

          <button
            onClick={() => onNavigateTab('search')}
            className="p-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 shadow-xs hover:border-emerald-500 transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'রক্তদাতা খুঁজুন' : 'Find Donors'}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {lang === 'bn' ? '৬৪ জেলা ডিরেক্টরি' : '64 Districts'}
            </span>
          </button>

          <button
            onClick={() => onNavigateTab('map')}
            className="p-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 shadow-xs hover:border-blue-500 transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5">
              <Hospital className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'হাসপাতাল ম্যাপ' : 'Nearby Hospitals'}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {lang === 'bn' ? 'জরুরি চিকিৎসা কেন্দ্র' : 'Emergency Centers'}
            </span>
          </button>

          <button
            onClick={onOpenDirectory}
            className="p-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 shadow-xs hover:border-indigo-500 transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-rose-400 flex items-center justify-center mb-1.5">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? '৮ বিভাগীয় ব্লাড ব্যাংক' : 'Blood Banks & 999'}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {lang === 'bn' ? '৩৪+ হটলাইন ও অ্যাম্বুলেন্স' : '34+ Verified Hotlines'}
            </span>
          </button>

          <button
            onClick={onOpenPoster}
            className="p-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 shadow-xs hover:border-rose-500 transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1.5">
              <Flame className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'পোস্টার / কার্ড তৈরি' : 'Create Poster'}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {lang === 'bn' ? 'FB ও WhatsApp কার্ড' : 'FB & WA Viral Card'}
            </span>
          </button>

          <button
            onClick={() => onNavigateTab('badges')}
            className="p-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 shadow-xs hover:border-amber-500 transition-colors flex flex-col items-center justify-center text-center cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'আমার ব্যাজ ও সনদ' : 'Badges & Honor'}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {lang === 'bn' ? '.PNG সনদ ডাউনলোড' : 'Awards & Level'}
            </span>
          </button>
        </div>

        {/* Pro Ecosystem Action Cards */}
        <div className="grid grid-cols-1 @xl:grid-cols-2 gap-2.5 mt-3">
          <button
            type="button"
            onClick={onOpenThalassemia}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-rose-900 to-red-950 text-white border border-rose-500/30 shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:border-rose-400 transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-rose-600/30 text-rose-200 flex items-center justify-center shrink-0">
                <Droplet className="w-5 h-5 fill-rose-400 text-rose-300" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                  {lang === 'bn' ? 'নিয়মিত রক্ত সঞ্চালন · NEW' : 'LIFE SAVER · NEW'}
                </div>
                <h4 className="font-bold text-xs @md:text-sm text-white leading-snug break-words">
                  {lang === 'bn' ? 'থ্যালাসেমিয়া ও ডায়ালাইসিস ট্র্যাকার' : 'Thalassemia Blood Tracker'}
                </h4>
                <p className="text-[11px] text-rose-100/85 mt-0.5 leading-snug break-words">
                  {lang === 'bn'
                    ? 'শিশুদের রক্ত শিডিউল ও ৪-ডোনার রোটেশন পুল'
                    : 'Recurring transfusion & 4-donor rotating pool'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-300 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onOpenPlayStore}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white border border-emerald-500/30 shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-400 transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-300 flex items-center justify-center font-black shrink-0 text-base">
                📱
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  {lang === 'bn' ? 'অ্যাপ রিলিজ · PRO' : 'APK RELEASE · PRO'}
                </div>
                <h4 className="font-bold text-xs @md:text-sm text-white leading-snug break-words">
                  {lang === 'bn' ? '১-ক্লিক ডিপ্লয় ও APK লঞ্চপ্যাড' : 'Easy Deploy & APK Guide'}
                </h4>
                <p className="text-[11px] text-emerald-100/85 mt-0.5 leading-snug break-words">
                  {lang === 'bn'
                    ? 'ফ্রি লাইভ লিংক, PWABuilder APK ও Play Store রিলিজ'
                    : 'Free live URL, PWABuilder APK & Play Store'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-300 shrink-0" />
          </button>
        </div>

        {/* Bangladesh Emergency Medical Care Suite (6-in-1 Zero-Lag Hub) */}
        {onOpenCareSuite && (
          <div className="mt-3 p-3.5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  {lang === 'bn'
                    ? 'প্রো ইমার্জেন্সি মেডিকেল ও রোগী সহায়তা হাব'
                    : 'Emergency Medical & Patient Care Suite'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lang === 'bn'
                    ? 'মাতৃত্ব স্ট্যান্ডবাই · ডেঙ্গু প্লাটিলেট · অ্যাম্বুলেন্স ভাড়া · লক-স্ক্রিন কার্ড · ডায়েট · কৃতজ্ঞতা ওয়াল'
                    : 'Maternity Standby · Dengue Tracker · Ambulance Fare · ICE Wallpaper · Diet · Gratitude'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 @lg:grid-cols-3 gap-2">
              {(
                [
                  {
                    tab: 'maternity' as CareSuiteTab,
                    titleBn: '🤰 মাতৃত্ব ও ডেলিভারি স্ট্যান্ডবাই',
                    subBn: 'সিজার/ডেলিভারি ব্যাকআপ ডোনার ও Rh-',
                    titleEn: '🤰 Maternity Standby',
                    subEn: 'Delivery backup donors & Rh- alert',
                  },
                  {
                    tab: 'dengue' as CareSuiteTab,
                    titleBn: '🦟 ডেঙ্গু প্লাটিলেট ও CBC ট্র্যাকার',
                    subBn: 'প্লাটিলেট কাউন্ট, HCT% ও SDP SOS',
                    titleEn: '🦟 Dengue Platelet Tracker',
                    subEn: 'CBC log, danger alert & SDP SOS',
                  },
                  {
                    tab: 'ambulance' as CareSuiteTab,
                    titleBn: '🚑 অ্যাম্বুলেন্স ভাড়া ও ব্লাড ফি',
                    subBn: 'ন্যায্য ভাড়া হিসাব ও সরকারি টেস্ট রেট',
                    titleEn: '🚑 Ambulance & Fee Chart',
                    subEn: 'Fair fare calculator & govt blood rates',
                  },
                  {
                    tab: 'ice_wallpaper' as CareSuiteTab,
                    titleBn: '📱 লক-স্ক্রিন মেডিকেল কার্ড',
                    subBn: 'জরুরি রক্তের গ্রুপ ওয়ালপেপার (.PNG)',
                    titleEn: '📱 Lock-Screen Medical ID',
                    subEn: 'Download emergency .PNG wallpaper',
                  },
                  {
                    tab: 'diet' as CareSuiteTab,
                    titleBn: '🍲 ৭ দিনের ডায়েট ও রমজান গাইড',
                    subBn: 'দেশি খাবার ও রোজায় রক্তদানের নিয়ম',
                    titleEn: '🍲 Iron Diet & Ramadan',
                    subEn: '7-day recovery meal & fasting guide',
                  },
                  {
                    tab: 'gratitude' as CareSuiteTab,
                    titleBn: '🤲 কৃতজ্ঞতা ও দোয়া + আইডি যাচাই',
                    subBn: 'রোগীর পরিবারের দোয়া ও ডোনার চেকার',
                    titleEn: '🤲 Gratitude & ID Check',
                    subEn: 'Patient thank-you wall & ID verifier',
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => onOpenCareSuite(item.tab)}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 hover:border-rose-400 transition-colors text-left cursor-pointer"
                >
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {lang === 'bn' ? item.titleBn : item.titleEn}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {lang === 'bn' ? item.subBn : item.subEn}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Blood Type Inventory Progress Rings (100% Live Cloud + Donor Auto-Sync) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {lang === 'bn'
              ? `রক্তের মজুদ ও লাইভ প্রস্তুত ডোনার (${inventoryMetrics.totalReadyDonors} জন)`
              : `Live Inventory & Ready Donors (${inventoryMetrics.totalReadyDonors})`}
          </div>
          <button
            onClick={() => onNavigateTab('search')}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            {lang === 'bn' ? 'সব দেখুন' : 'See all'}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div
            onClick={() => onNavigateTab('search')}
            className="p-3 rounded-2xl bg-gradient-to-b from-red-600 to-rose-700 text-white shadow-sm flex flex-col items-center text-center cursor-pointer"
          >
            <span className="text-base font-black">A+ / B+</span>
            <div className="relative w-11 h-11 my-1 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3.5"
                  strokeDasharray={`${inventoryMetrics.aPosPct}, 100`}
                />
              </svg>
              <span className="absolute font-mono font-bold text-[10px]">
                {inventoryMetrics.aPosPct}%
              </span>
            </div>
            <span className="text-[10px] font-black text-rose-100 uppercase tracking-tight">
              {lang === 'bn' ? 'মজুদ সক্রিয়' : 'Active'}
            </span>
          </div>

          <div
            onClick={() => onNavigateTab('search')}
            className="p-3 rounded-2xl bg-white dark:bg-[#1e293b] border-2 border-red-500 shadow-xs flex flex-col items-center text-center cursor-pointer"
          >
            <span className="text-base font-black text-slate-900 dark:text-white">O- / B-</span>
            <div className="relative w-11 h-11 my-1 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3.5"
                  strokeDasharray={`${inventoryMetrics.rareNegPct}, 100`}
                />
              </svg>
              <span className="absolute font-mono font-bold text-[10px] text-red-600 dark:text-red-400">
                {inventoryMetrics.rareNegPct}%
              </span>
            </div>
            <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-tight">
              {lang === 'bn' ? 'বিরল গ্রুপ ভল্ট' : 'Rare Vault'}
            </span>
          </div>

          <div
            onClick={() => onNavigateTab('search')}
            className="p-3 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 shadow-xs flex flex-col items-center text-center cursor-pointer"
          >
            <span className="text-base font-black text-slate-900 dark:text-white">O+</span>
            <div className="relative w-11 h-11 my-1 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.915"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                  strokeDasharray={`${inventoryMetrics.oPosPct}, 100`}
                />
              </svg>
              <span className="absolute font-mono font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                {inventoryMetrics.oPosPct}%
              </span>
            </div>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
              {lang === 'bn' ? 'পর্যাপ্ত' : 'Sufficient'}
            </span>
          </div>
        </div>
      </div>

      {/* 7. Active Requests Near You + Rare Negative Blood Filter */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {lang === 'bn' ? 'নিকটস্থ জরুরি রক্তের আবেদনসমূহ' : 'Active Requests Near You'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRareOnlyFilter(!rareOnlyFilter)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors border ${
                rareOnlyFilter
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
            >
              {lang === 'bn' ? 'নেগেটিভ (O-/AB-/B-/A-)' : 'Rare Negative'}
            </button>
            <button
              onClick={() => onNavigateTab('requests')}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
            >
              {lang === 'bn' ? 'সকল আবেদন' : 'See all'}
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {activeRequests.length === 0 ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              {lang === 'bn'
                ? 'এই মুহূর্তে কোনো নেগেটিভ গ্রুপের সক্রিয় আবেদন নেই।'
                : 'No active rare negative requests right now.'}
            </div>
          ) : (
            activeRequests.map((req) => {
              const isCompatibleForMe = canDonorGiveToPatient(displayGroup, req.bloodGroup);
              return (
                <div
                  key={req.id}
                  className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 shadow-xs rounded-2xl p-3.5 flex flex-col @lg:flex-row @lg:items-center justify-between gap-3 hover:border-rose-400 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex flex-col items-center justify-center text-white font-black text-base shadow-xs shrink-0">
                      <span>{req.bloodGroup}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-xs @md:text-sm text-slate-900 dark:text-white leading-snug">
                          {req.hospitalName}
                        </h3>
                        <span className="text-[10px] font-black uppercase text-red-600 dark:text-red-400">
                          ·{' '}
                          {req.urgency === 'CRITICAL'
                            ? lang === 'bn'
                              ? 'জীবন-মরণ জরুরি'
                              : 'CRITICAL'
                            : req.urgency}
                        </span>
                        {isCompatibleForMe && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            · {lang === 'bn' ? 'আপনার রক্ত ম্যাচ করে' : 'Matches You'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          <span>{req.district}</span>
                        </span>
                        <span>·</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          {Math.max(1, req.unitsNeeded - req.unitsCollected)}{' '}
                          {lang === 'bn' ? 'ব্যাগ প্রয়োজন' : 'bag(s) needed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end @lg:self-auto shrink-0">
                    <button
                      onClick={() => onQuickDonate(req)}
                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {lang === 'bn' ? 'আমি রক্ত দেব' : 'Donate Now'}
                    </button>
                    <button
                      onClick={() => onSelectRequest(req)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 8. Donor Events & Campaigns */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {lang === 'bn' ? 'রক্তদান ক্যাম্প ও ইভেন্ট' : 'Donor Events'}
          </div>
          <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">
            {lang === 'bn' ? '৩টি আসন্ন ক্যাম্প' : '3 Upcoming'}
          </span>
        </div>

        <div className="space-y-2">
          {[
            {
              id: 'ev-1',
              dateNum: '২৮',
              dateMonth: 'অক্টো',
              title: 'ঢাকা মেডিকেল সিটি রক্তদান ড্রাইভ',
              time: 'সকাল ৯:০০ - বিকাল ৪:০০',
              location: 'কার্জন হল চত্বর, ঢাকা বিশ্ববিদ্যালয়',
            },
            {
              id: 'ev-2',
              dateNum: '২৮',
              dateMonth: 'অক্টো',
              title: 'মেট্রো হেলথ রক্তদান মেলা',
              time: 'সকাল ১০:০০ - বিকাল ৫:০০',
              location: 'চট্টগ্রাম মেডিকেল কলেজ অডিটোরিয়াম',
            },
            {
              id: 'ev-3',
              dateNum: '৩১',
              dateMonth: 'অক্টো',
              title: 'কমিউনিটি ডোনার ডে',
              time: 'সকাল ৯:০০ - দুপুর ৩:০০',
              location: 'ওসমানী মেডিকেল কলেজ কমপ্লেক্স, সিলেট',
            },
          ].map((event) => {
            const isRsvpd = rsvps[event.id];
            return (
              <div
                key={event.id}
                className="p-3 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 shadow-xs flex items-center justify-between gap-3 hover:border-rose-400 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[9px] font-black uppercase">{event.dateMonth}</span>
                    <span className="text-sm font-black font-mono leading-none">{event.dateNum}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs @md:text-sm text-slate-900 dark:text-white truncate">
                      {event.title}
                    </h4>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                      {event.time}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleRsvp(event.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isRsvpd
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {isRsvpd ? (lang === 'bn' ? 'নিশ্চিত ✓' : 'Joined ✓') : 'RSVP'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const DonorHomeView = React.memo(DonorHomeViewInner);
