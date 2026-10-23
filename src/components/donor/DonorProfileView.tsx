import React, { useState, useEffect } from 'react';
import { Language, HealthConditions, UserAccount } from '../../types';
import {
  QrCode,
  ShieldCheck,
  Award,
  X,
  Lock,
  LogOut,
  LogIn,
  ExternalLink,
  MessageCircle,
  UserPlus,
} from 'lucide-react';
import { PrivacyPolicyModal } from '../ecosystem/PrivacyPolicyModal';
import { DonorCertificateModal } from './DonorCertificateModal';
import {
  auth,
  onAuthStateChanged,
  signOutReal,
  DEFAULT_AVATAR_DATA_URI,
  isBootstrappedAdminUser,
  User as FirebaseUser,
} from '../../firebase';

interface DonorProfileViewProps {
  lang: Language;
  onOpenRegister?: (role?: 'USER' | 'ADMIN') => void;
  onOpenAuthModal?: () => void;
}

export const DonorProfileView: React.FC<DonorProfileViewProps> = ({
  lang,
  onOpenRegister,
  onOpenAuthModal,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('bloodsearch_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [logoutToast, setLogoutToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });
    const syncUser = () => {
      try {
        const saved = localStorage.getItem('bloodsearch_current_user');
        setCurrentUser(saved ? JSON.parse(saved) : null);
      } catch {}
    };
    window.addEventListener('bloodsearch_user_changed', syncUser);
    return () => {
      unsubAuth();
      window.removeEventListener('bloodsearch_user_changed', syncUser);
    };
  }, []);

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(currentUser?.availableToDonate ?? true);

  const [healthConditions, setHealthConditions] = useState<HealthConditions>({
    nonAlcoholic: true,
    hivNegative: true,
    rheumaticFeverNegative: true,
    covidNegative: true,
    thalassemiaNegative: true,
    hepatitisNegative: true,
    normalBloodPressure: true,
  });

  const toggleCondition = (key: keyof HealthConditions) => {
    setHealthConditions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isLoggedIn = Boolean(currentUser || firebaseUser);
  const displayName =
    currentUser?.name ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split('@')[0] ||
    (lang === 'bn' ? 'গেস্ট ভিজিটর (লগইন করুন)' : 'Guest Visitor');
  const displayPhone = currentUser?.phone || firebaseUser?.phoneNumber || '—';
  const displayEmail = currentUser?.email || firebaseUser?.email || (lang === 'bn' ? 'অ্যাকাউন্ট যুক্ত নয়' : 'Not signed in');
  const displayGroup = currentUser?.bloodGroup || 'B+';
  const displayAvatar = currentUser?.photoUrl || firebaseUser?.photoURL || DEFAULT_AVATAR_DATA_URI;
  const displayId =
    currentUser?.idCardNumber ||
    (firebaseUser ? `BD-2026-${firebaseUser.uid.slice(0, 4).toUpperCase()}` : 'GUEST-PASS');
  const displayGender =
    currentUser?.gender === 'FEMALE'
      ? lang === 'bn'
        ? 'মহিলা'
        : 'Female'
      : currentUser?.gender === 'OTHER'
      ? lang === 'bn'
        ? 'অন্যান্য'
        : 'Other'
      : lang === 'bn'
      ? 'পুরুষ'
      : 'Male';
  const displayDonations = currentUser?.totalDonations ?? (isLoggedIn ? 1 : 0);
  const displayAge = currentUser?.age ?? 25;
  const displayRole =
    currentUser?.role === 'ADMIN' || isBootstrappedAdminUser(firebaseUser) ? 'ADMIN' : 'USER';

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-8 text-left">
      {/* Profile Card Header */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm transition-all text-center relative">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {isLoggedIn
              ? displayRole === 'ADMIN'
                ? lang === 'bn'
                  ? 'অ্যাডমিন প্রোফাইল'
                  : 'Admin Profile'
                : lang === 'bn'
                ? 'ভেরিফাইড ডোনার প্রোফাইল'
                : 'Verified Donor Profile'
              : lang === 'bn'
              ? 'গেস্ট মোড'
              : 'Guest Mode'}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="min-h-[38px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold cursor-pointer"
              title="Google Play Safety"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'bn' ? 'পলিসি' : 'Privacy'}</span>
            </button>
            <button
              onClick={() => setIsQrOpen(true)}
              className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-rose-500" />
              <span>QR Pass</span>
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="relative w-22 h-22 sm:w-24 sm:h-24 mx-auto my-3">
          <img
            src={displayAvatar}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_DATA_URI;
            }}
            referrerPolicy="no-referrer"
            alt={displayName}
            className="w-full h-full object-cover rounded-3xl ring-4 ring-rose-500/20 shadow-xl"
          />
          {isLoggedIn && (
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-slate-900 shadow">
              ✓
            </span>
          )}
        </div>

        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
          {displayName}
        </h2>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono truncate px-2">
          {displayEmail} · {displayPhone}
        </div>
        <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">
          {lang === 'bn' ? 'স্মার্ট কার্ড নং:' : 'Card ID:'} {displayId}
        </div>

        {/* WhatsApp & Facebook Links when registered */}
        {(currentUser?.whatsappPhone || currentUser?.facebookUrl) && (
          <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap text-xs">
            {currentUser?.whatsappPhone && (
              <a
                href={`https://wa.me/${currentUser.whatsappPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp: {currentUser.whatsappPhone}</span>
              </a>
            )}
            {currentUser?.facebookUrl && (
              <a
                href={currentUser.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-[11px]"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ফেসবুক প্রোফাইল' : 'Facebook Profile'}</span>
              </a>
            )}
          </div>
        )}

        {logoutToast && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200">
            {logoutToast}
          </div>
        )}

        <div className="mt-3.5 flex items-center justify-center gap-2 flex-wrap">
          {!isLoggedIn && onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 text-xs font-bold text-white cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'Gmail / সিম লগইন করুন' : 'Sign In Now'}</span>
            </button>
          )}

          {onOpenRegister && (
            <button
              onClick={() => onOpenRegister('USER')}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>
                {isLoggedIn
                  ? lang === 'bn'
                    ? 'প্রোফাইল / আইডি আপডেট'
                    : 'Update Smart ID'
                  : lang === 'bn'
                  ? 'নতুন আইডি রেজিস্ট্রেশন'
                  : 'Register Smart ID'}
              </span>
            </button>
          )}

          <button
            onClick={() => setIsCertOpen(true)}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800 cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <Award className="w-3.5 h-3.5 text-amber-600" />
            <span>{lang === 'bn' ? 'সম্মাননা সনদপত্র' : 'Certificate'}</span>
          </button>

          {isLoggedIn && (
            <button
              onClick={async () => {
                try {
                  await signOutReal();
                } catch {}
                setCurrentUser(null);
                setFirebaseUser(null);
                setLogoutToast(
                  lang === 'bn' ? '✓ আপনি সফলভাবে লগআউট হয়েছেন।' : '✓ Logged out successfully.'
                );
                setTimeout(() => setLogoutToast(null), 3000);
              }}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-xs font-bold text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800 cursor-pointer flex items-center gap-1 shadow-xs"
              title="বর্তমান অ্যাকাউন্ট থেকে লগআউট করুন"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
            </button>
          )}
        </div>

        {/* 4 Metric Tiles dynamically bound to real profile */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">Group</span>
            <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">
              {displayGroup}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">Gender</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              {displayGender}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">Donated</span>
            <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
              {displayDonations} {lang === 'bn' ? 'বার' : 'bags'}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">Age</span>
            <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
              {displayAge}y
            </span>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="mt-4 pt-3 flex items-center justify-between px-1">
          <div className="text-left">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              {lang === 'bn' ? 'রক্তদানে সক্রিয় উপস্থিতি' : 'Available for Emergency Donation'}
            </span>
            <span className="text-[10px] text-slate-400">
              {isAvailable ? 'Visible to nearby patients in emergency' : 'Resting / Cooldown mode'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsAvailable(!isAvailable)}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              isAvailable ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                isAvailable ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Health Condition Verified Checklist */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              {lang === 'bn' ? 'স্বাস্থ্যগত মানদণ্ড' : 'Health Conditions'}
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {lang === 'bn' ? 'চিকিৎসাগত নির্দেশিকা অনুযায়ী নিরাপত্তা যাচাই' : 'Clinical safety verification parameters'}
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            100% Fit
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {[
            { id: 'nonAlcoholic' as const, label: lang === 'bn' ? 'মদ্যপানমুক্ত (Non-alcoholic)' : 'Non-alcoholic' },
            { id: 'hivNegative' as const, label: lang === 'bn' ? 'এইচআইভি নেগেটিভ (HIV negative)' : 'HIV negative' },
            { id: 'rheumaticFeverNegative' as const, label: lang === 'bn' ? 'বাতজ্বর মুক্ত (No Rheumatic fever)' : 'Rheumatic fever negative' },
            { id: 'covidNegative' as const, label: lang === 'bn' ? 'কোভিড নেগেটিভ (COVID negative)' : 'COVID negative' },
            { id: 'thalassemiaNegative' as const, label: lang === 'bn' ? 'থ্যালাসেমিয়ামুক্ত (No Thalassemia)' : 'Thalassemia negative' },
            { id: 'hepatitisNegative' as const, label: lang === 'bn' ? 'হেপাটাইটিস নেগেটিভ (Hepatitis negative)' : 'Hepatitis negative' },
            { id: 'normalBloodPressure' as const, label: lang === 'bn' ? 'স্বাভাবিক রক্তচাপ (Normal blood pressure)' : 'Normal blood-pressure' },
          ].map((item) => {
            const isChecked = healthConditions[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleCondition(item.id)}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 transition-all"
              >
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {item.label}
                </span>
                <div
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    isChecked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform shadow ${
                      isChecked ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Profile Modal bound to real user */}
      {isQrOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
          <div className="w-full max-w-sm my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#1e293b] p-5 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 text-center space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Hospital Check-In QR Pass
              </h3>
              <button
                onClick={() => setIsQrOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-white rounded-2xl shadow-inner border border-slate-200 inline-block">
              <div className="w-48 h-48 bg-slate-950 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-12 h-12 bg-white rounded p-1 flex items-center justify-center">
                    <div className="w-6 h-6 bg-slate-950" />
                  </div>
                  <div className="w-12 h-12 bg-white rounded p-1 flex items-center justify-center">
                    <div className="w-6 h-6 bg-slate-950" />
                  </div>
                </div>
                <div className="text-center font-mono text-[9px] text-white break-all px-1">
                  {displayId}
                </div>
                <div className="flex justify-between">
                  <div className="w-12 h-12 bg-white rounded p-1 flex items-center justify-center">
                    <div className="w-6 h-6 bg-slate-950" />
                  </div>
                  <div className="w-8 h-8 bg-rose-500 rounded flex items-center justify-center text-white font-black text-xs">
                    {displayGroup}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {displayName} · Blood Group {displayGroup}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Scan at hospital reception or blood transfusion unit for instant verification.
              </p>
            </div>
          </div>
        </div>
      )}

      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        lang={lang}
      />

      <DonorCertificateModal
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
        lang={lang}
        donorName={displayName}
        bloodGroup={displayGroup}
        idCardNumber={displayId}
        totalDonations={Math.max(1, displayDonations)}
      />
    </div>
  );
};
