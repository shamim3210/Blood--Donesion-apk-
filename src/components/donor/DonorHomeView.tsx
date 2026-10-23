import React, { useState, useEffect, useMemo } from 'react';
import { BloodRequest, BloodGroup, Language } from '../../types';
import {
  requestRealDeviceGPS,
  Coordinates,
  DEFAULT_BANGLADESH_COORDS,
} from '../../utils/geolocation';
import {
  auth,
  onAuthStateChanged,
  signOutReal,
  DEFAULT_AVATAR_DATA_URI,
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
} from 'lucide-react';

interface DonorHomeViewProps {
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
}) => {
  const activeRequests = useMemo(
    () => requests.filter((r) => r.status === 'ACTIVE').slice(0, 3),
    [requests]
  );

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('bloodsearch_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

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
  const displayGroup = currentUser?.bloodGroup || 'B+';
  const displayPhoto = currentUser?.photoUrl || firebaseUser?.photoURL;

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

  const [selectedPin, setSelectedPin] = useState<MiniMapPin>(MINI_MAP_PINS[0]);

  const [rsvps, setRsvps] = useState<Record<string, boolean>>({
    'ev-1': false,
    'ev-2': true,
    'ev-3': false,
  });

  const toggleRsvp = (id: string) => {
    setRsvps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await signOutReal();
    } catch {}
    setCurrentUser(null);
    setFirebaseUser(null);
    setLogoutNotice(
      lang === 'bn'
        ? '✓ আপনি সফলভাবে অ্যাকাউন্ট থেকে লগআউট হয়েছেন।'
        : '✓ Successfully signed out.'
    );
    setTimeout(() => setLogoutNotice(null), 3000);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto text-left pb-8">
      {logoutNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
          {logoutNotice}
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
                  ? `${displayGroup} ভেরিফাইড প্রোফাইল`
                  : `${displayGroup} Verified`
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

      {/* 1.5. SMART ID REGISTRATION & ADMIN PANEL HUB (FIXED SCREENSHOT 1 OVERFLOWS!) */}
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

        {/* Container-Responsive Grid: Single clean stack in mobile/APK (< 576px), 3-col only on wide desktop */}
        <div className="grid grid-cols-1 @xl:grid-cols-3 gap-2">
          {/* Card A: User Panel ID Create */}
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

          {/* Card B: Admin Panel ID Create (Secret Code Protected) */}
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

          {/* Card C: Direct Admin Control Panel */}
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

        {/* Direct WhatsApp-Style Live User-to-User Chat Banner */}
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
                {lang === 'bn' ? 'লাইভ মেসেঞ্জার · WHATSAPP SYNC' : 'LIVE USER-TO-USER CHAT'}
              </span>
              <h2 className="text-sm font-black tracking-tight leading-snug truncate">
                {lang === 'bn' ? 'সরাসরি ইউজার-টু-ইউজার ও WhatsApp চ্যাট' : 'Live Donor Chat & WhatsApp'}
              </h2>
              <p className="text-[11px] text-emerald-100 mt-0.5 truncate">
                {lang === 'bn'
                  ? 'আনলিমিটেড লাইভ চ্যাট ও ১-ক্লিকে WhatsApp সংযোগ'
                  : 'Unlimited real-time chat & 1-tap WhatsApp sync'}
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

        {/* Interactive Mini-Map Canvas */}
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

          {MINI_MAP_PINS.map((pin) => {
            const isSelected = selectedPin.id === pin.id;
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
            {MINI_MAP_PINS.length}টি পিন
          </div>
        </div>

        {/* Selected Pin Mini Info Card */}
        {selectedPin && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-xs ${
                  selectedPin.type === 'DONOR' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                <span>{selectedPin.group}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight truncate">
                  {selectedPin.name}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate">{selectedPin.district}</span>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                    {selectedPin.distance}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={`tel:${selectedPin.phone}`}
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

      {/* 4. Eligibility & Next Donation Cooldown Strip */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 shadow-sm rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
              <span>{lang === 'bn' ? 'রক্তদানের জন্য প্রস্তুত' : 'Eligible to Donate'}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 truncate">
              {lang === 'bn'
                ? 'সর্বশেষ রক্তদান: ৩ মাস পূর্বে · স্বাস্থ্য পরীক্ষায় উত্তীর্ণ'
                : 'Last donation: 3 months ago · Cleared'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#0f172a] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 shrink-0">
          <div className="text-center font-mono">
            <span className="text-sm font-black text-slate-900 dark:text-white">12</span>
            <span className="text-[9px] text-slate-600 dark:text-slate-400 block font-bold -mt-1">
              {lang === 'bn' ? 'দিন' : 'Day'}
            </span>
          </div>
          <span className="text-slate-500 font-bold">:</span>
          <div className="text-center font-mono">
            <span className="text-sm font-black text-slate-900 dark:text-white">09</span>
            <span className="text-[9px] text-slate-600 dark:text-slate-400 block font-bold -mt-1">
              {lang === 'bn' ? 'ঘণ্টা' : 'Hrs'}
            </span>
          </div>
          <span className="text-slate-500 font-bold">:</span>
          <div className="text-center font-mono">
            <span className="text-sm font-black text-slate-900 dark:text-white">25</span>
            <span className="text-[9px] text-slate-600 dark:text-slate-400 block font-bold -mt-1">
              {lang === 'bn' ? 'মিনিট' : 'Min'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Quick Actions 6-Grid */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {lang === 'bn' ? 'জরুরি ও দ্রুত সেবা' : 'Emergency & Quick Actions'}
          </div>
          {isGpsActive && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{lang === 'bn' ? 'GPS সক্রিয়' : 'GPS Ready'}</span>
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
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-1.5">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {lang === 'bn' ? 'ব্লাড ব্যাংক হটলাইন' : 'Blood Banks'}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {lang === 'bn' ? 'রেড ক্রিসেন্ট ও কোয়ান্টাম' : 'Verified Hotlines'}
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
              {lang === 'bn' ? 'আমার ব্যাজ' : 'My Badges'}
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
              {lang === 'bn' ? 'রক্তদান সম্মাননা' : 'Awards & Level'}
            </span>
          </button>
        </div>

        {/* Pro Ecosystem Action Cards (FIXED SCREENSHOT 2 OVERFLOW!) */}
        <div className="grid grid-cols-1 @xl:grid-cols-2 gap-2.5 mt-3">
          {/* Card 1: Thalassemia Routine Transfusion Tracker */}
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

          {/* Card 2: Google Play Store Release & Monetization */}
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
                  {lang === 'bn' ? 'প্লে স্টোর রিলিজ ও বাণিজ্যিক গাইড' : 'Play Store & Monetization'}
                </h4>
                <p className="text-[11px] text-emerald-100/85 mt-0.5 leading-snug break-words">
                  {lang === 'bn'
                    ? 'APK/AAB তৈরি, AdMob বিজ্ঞাপন ও ডাটা ব্যাকআপ'
                    : 'Publish APK/AAB, AdMob setup & DB backup'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-300 shrink-0" />
          </button>
        </div>
      </div>

      {/* 6. Blood Type Inventory Progress Rings */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {lang === 'bn' ? 'রক্তের গ্রুপ ও মজুদের অবস্থা' : 'Blood Type Inventory'}
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
            <span className="text-base font-black">A+</span>
            <div className="relative w-11 h-11 my-1 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeDasharray="85, 100" />
              </svg>
              <span className="absolute font-mono font-bold text-[10px]">85%</span>
            </div>
            <span className="text-[10px] font-black text-rose-100 uppercase tracking-tight">
              {lang === 'bn' ? 'মজুদ বেশি' : 'High'}
            </span>
          </div>

          <div
            onClick={() => onNavigateTab('search')}
            className="p-3 rounded-2xl bg-white dark:bg-[#1e293b] border-2 border-red-500 shadow-xs flex flex-col items-center text-center cursor-pointer"
          >
            <span className="text-base font-black text-slate-900 dark:text-white">B-</span>
            <div className="relative w-11 h-11 my-1 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeDasharray="12, 100" />
              </svg>
              <span className="absolute font-mono font-bold text-[10px] text-red-600 dark:text-red-400">12%</span>
            </div>
            <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-tight">
              {lang === 'bn' ? 'জরুরি সংকট' : 'Critical'}
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
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="#10b981" strokeWidth="3.5" strokeDasharray="95, 100" />
              </svg>
              <span className="absolute font-mono font-bold text-[10px] text-emerald-600 dark:text-emerald-400">95%</span>
            </div>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
              {lang === 'bn' ? 'পর্যাপ্ত' : 'Sufficient'}
            </span>
          </div>
        </div>
      </div>

      {/* 7. Active Requests Near You */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {lang === 'bn' ? 'নিকটস্থ জরুরি রক্তের আবেদনসমূহ' : 'Active Requests Near You'}
          </div>
          <button
            onClick={() => onNavigateTab('requests')}
            className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            {lang === 'bn' ? 'সকল আবেদন' : 'See all'}
          </button>
        </div>

        <div className="space-y-2.5">
          {activeRequests.map((req) => (
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
                      · {req.urgency === 'CRITICAL' ? (lang === 'bn' ? 'জীবন-মরণ জরুরি' : 'CRITICAL') : req.urgency}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      <span>{req.district}</span>
                    </span>
                    <span>·</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {Math.max(1, req.unitsNeeded - req.unitsCollected)} ব্যাগ প্রয়োজন
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
          ))}
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
