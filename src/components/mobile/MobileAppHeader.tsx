import React, { useState } from 'react';
import { ActiveTab, Language } from '../../types';
import {
  ChevronLeft,
  Search,
  Menu,
  X,
  Moon,
  Sun,
  ShieldCheck,
  Droplet,
  FileText,
  Lock,
  Download,
  UserPlus,
  LogOut,
  ArrowLeft,
} from 'lucide-react';
import { PrivacyPolicyModal } from '../ecosystem/PrivacyPolicyModal';
import { BrandLogo } from '../BrandLogo';

interface MobileAppHeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenSOSModal: () => void;
  onOpenAuthModal: () => void;
  onOpenRegisterModal: (role?: 'USER' | 'ADMIN') => void;
  onOpenFamilyModal: () => void;
  onOpenArchitectureModal: () => void;
  onOpenSlideDeck: () => void;
  onOpenPlayStoreModal?: () => void;
  isDeckMode?: boolean;
  onExitDeckMode?: () => void;
  liveUserLabel?: string | null;
  onSignOut?: () => void;
  seniorMode?: boolean;
  setSeniorMode?: (val: boolean) => void;
}

export const MobileAppHeader: React.FC<MobileAppHeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  darkMode,
  setDarkMode,
  onOpenAuthModal,
  onOpenRegisterModal,
  onOpenArchitectureModal,
  onOpenSlideDeck,
  onOpenPlayStoreModal,
  isDeckMode = false,
  onExitDeckMode,
  liveUserLabel,
  onSignOut,
  seniorMode = false,
  setSeniorMode,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const getScreenTitle = () => {
    if (isDeckMode) {
      return lang === 'bn' ? 'PDF প্রেজেন্টেশন (৮ স্লাইড)' : '8-Slide Presentation';
    }
    switch (activeTab) {
      case 'onboarding':
        return lang === 'bn' ? 'ব্লাড হেল্প' : 'Blood Help';
      case 'search':
        return lang === 'bn' ? 'রক্তদাতা খুঁজুন' : 'Find Donors';
      case 'requests':
        return lang === 'bn' ? 'জরুরি আবেদন' : 'SOS Requests';
      case 'chat':
        return lang === 'bn' ? 'ইনবক্স ও চ্যাট' : 'Messages';
      case 'badges':
        return lang === 'bn' ? 'আমার ব্যাজ' : 'My Badges';
      case 'profile':
        return lang === 'bn' ? 'ডোনার প্রোফাইল' : 'Donor Profile';
      case 'map':
        return lang === 'bn' ? 'হাসপাতাল ম্যাপ' : 'Nearby Hospitals';
      case 'compatibility':
        return lang === 'bn' ? 'রক্তের গ্রুপ মিল' : 'Compatibility Matrix';
      case 'eligibility':
        return lang === 'bn' ? 'যোগ্যতা যাচাই' : 'Donor Eligibility';
      case 'security':
        return lang === 'bn' ? 'সিকিউরিটি অডিট' : 'Security Engine';
      case 'admin':
        return lang === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel';
      default:
        return 'BloodSearch';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 pt-[env(safe-area-inset-top)] transition-colors select-none">
      {/* Unified Native App Bar (Zero Fake Clock, Zero Fake Battery, Zero Horizontal Overflow) */}
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 px-3 sm:px-5 h-14">
        {/* Left: Brand or Back Button */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isDeckMode && onExitDeckMode ? (
            <button
              type="button"
              onClick={onExitDeckMode}
              className="min-h-[40px] px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'bn' ? 'অ্যাপে ফিরুন' : 'Back to App'}</span>
            </button>
          ) : activeTab === 'home' ? (
            <BrandLogo variant="lockup" size="sm" />
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className="min-h-[40px] px-2 py-1.5 -ml-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer flex items-center gap-0.5 shrink-0"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                <span className="text-xs font-bold">
                  {lang === 'bn' ? 'হোম' : 'Home'}
                </span>
              </button>
              <h2 className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {getScreenTitle()}
              </h2>
            </div>
          )}
        </div>

        {/* Right: Responsive Touch-Friendly Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Desktop / Tablet Extra Quick Actions (Hidden on small phones to prevent overflow) */}
          {onOpenPlayStoreModal && (
            <button
              type="button"
              onClick={onOpenPlayStoreModal}
              className="hidden md:flex min-h-[38px] items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-black text-emerald-400 border border-slate-700 font-bold text-xs cursor-pointer active:scale-95 transition-all whitespace-nowrap"
              title="সহজ ডিপ্লয়, APK ডাউনলোড ও সিকিউরিটি"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ডিপ্লয় ও APK' : 'Deploy & APK'}</span>
            </button>
          )}

          {/* Register ID Button */}
          <button
            type="button"
            onClick={() => onOpenRegisterModal('USER')}
            className="min-h-[38px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            title="নতুন আইডি রেজিস্ট্রেশন (User / Admin)"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'আইডি' : 'ID'}</span>
          </button>

          {/* Admin Panel Button (Visible on >= 400px & Desktop, also inside Menu on tiny phones) */}
          <button
            type="button"
            onClick={() => {
              if (isDeckMode && onExitDeckMode) onExitDeckMode();
              setActiveTab('admin');
            }}
            className={`hidden min-[400px]:flex min-h-[38px] items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === 'admin' && !isDeckMode
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-slate-900 dark:bg-slate-800 text-amber-300 border-slate-700'
            }`}
            title="অ্যাডমিন প্যানেল"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{lang === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin'}</span>
            <span className="sm:hidden">{lang === 'bn' ? 'অ্যাডমিন' : 'Admin'}</span>
          </button>

          {/* Login / Account Button */}
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="min-h-[38px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer whitespace-nowrap max-w-[115px] sm:max-w-[160px]"
            title="রিয়েল লগইন / Gmail / OTP"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {liveUserLabel || (lang === 'bn' ? 'লগইন' : 'Login')}
            </span>
          </button>

          {/* Desktop Language & Theme Quick Buttons */}
          <button
            type="button"
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="hidden lg:flex min-h-[38px] items-center px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            {lang === 'bn' ? 'EN' : 'বাংলা'}
          </button>

          {setSeniorMode && (
            <button
              type="button"
              onClick={() => setSeniorMode(!seniorMode)}
              className={`hidden md:flex min-h-[38px] items-center px-2.5 py-1.5 rounded-xl border font-black text-xs cursor-pointer transition-colors ${
                seniorMode
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-100 dark:bg-[#1e293b] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
              }`}
              title={lang === 'bn' ? 'বড় অক্ষর মোড (প্রবীণদের জন্য)' : 'Senior Large Text Mode'}
            >
              অ+
            </button>
          )}

          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="hidden lg:flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl bg-slate-100 dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
            title="Toggle Light / Dark Mode"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Drawer Menu Button (40x40px touch target) */}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Open menu"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer"
            title="মেনু ও সেটিংস"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Slide-Down Quick Menu Sheet (Scrollable on short screens) */}
      {isMenuOpen && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] shadow-2xl max-h-[calc(100dvh-56px)] overflow-y-auto modal-scroll-contain">
          <div className="max-w-5xl mx-auto p-3.5 sm:p-4 space-y-3">
            {/* Official BloodSearch Brand Showcase Strip inside Menu */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#1e293b]/80 border border-slate-200 dark:border-slate-700/80">
              <BrandLogo variant="lockup" size="md" />
              {onOpenPlayStoreModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPlayStoreModal();
                    setIsMenuOpen(false);
                  }}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'অ্যাপ ও APK' : 'App & APK'}</span>
                </button>
              )}
            </div>

            {/* Quick Language & Theme Toggles */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-1 bg-white dark:bg-[#0f172a] p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setLang('bn')}
                  className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                    lang === 'bn'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                    lang === 'en'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  English
                </button>
              </div>

              <div className="flex items-center gap-2">
                {liveUserLabel && onSignOut && (
                  <button
                    type="button"
                    onClick={() => {
                      onSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="min-h-[36px] flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-xs font-bold text-red-700 dark:text-red-300 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
                  </button>
                )}

                {setSeniorMode && (
                  <button
                    type="button"
                    onClick={() => setSeniorMode(!seniorMode)}
                    className={`min-h-[36px] flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-black cursor-pointer shadow-xs ${
                      seniorMode
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-white dark:bg-[#0f172a] border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span>অ+</span>
                    <span className="hidden min-[380px]:inline">
                      {lang === 'bn' ? 'বড় অক্ষর' : 'Large Text'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDarkMode(!darkMode)}
                  className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer shadow-xs"
                >
                  {darkMode ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-600" />
                      <span>Dark</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Menu Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  onOpenRegisterModal('USER');
                  setIsMenuOpen(false);
                }}
                className="min-h-[44px] p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-left text-slate-900 dark:text-white flex items-center gap-2.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{lang === 'bn' ? 'ইউজার প্যানেল আইডি তৈরি' : 'Create User Panel ID'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenRegisterModal('ADMIN');
                  setIsMenuOpen(false);
                }}
                className="min-h-[44px] p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-400 dark:border-amber-800 text-left text-slate-900 dark:text-white flex items-center gap-2.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{lang === 'bn' ? 'অ্যাডমিন প্যানেল আইডি তৈরি' : 'Create Admin Panel ID'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isDeckMode && onExitDeckMode) onExitDeckMode();
                  setActiveTab('search');
                  setIsMenuOpen(false);
                }}
                className="min-h-[44px] p-3 rounded-xl bg-slate-100 dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-left text-slate-900 dark:text-white flex items-center gap-2.5 cursor-pointer"
              >
                <Search className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{lang === 'bn' ? 'রক্তদাতা ডিরেক্টরি (৬৪ জেলা)' : 'Donor Directory (64 Districts)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenAuthModal();
                  setIsMenuOpen(false);
                }}
                className="min-h-[44px] p-3 rounded-xl bg-slate-100 dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-left text-slate-900 dark:text-white flex items-center gap-2.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{lang === 'bn' ? 'রিয়েল লগইন (Gmail / SIM OTP)' : 'Real Login (Gmail / OTP)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isDeckMode && onExitDeckMode) onExitDeckMode();
                  setActiveTab('admin');
                  setIsMenuOpen(false);
                }}
                className="sm:col-span-2 min-h-[46px] p-3 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white border border-slate-700 text-left flex items-center justify-between cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-black text-xs">
                    {lang === 'bn' ? 'অ্যাডমিন প্যানেল ড্যাশবোর্ড' : 'Admin Panel Dashboard'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-300">OWNER GATE</span>
              </button>

              {onOpenPlayStoreModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPlayStoreModal();
                    setIsMenuOpen(false);
                  }}
                  className="sm:col-span-2 min-h-[46px] p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-left flex items-center justify-between cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Download className="w-4 h-4 text-white shrink-0" />
                    <span className="font-black text-xs truncate">
                      {lang === 'bn'
                        ? 'ফোনে APK ইনস্টল ও অ্যান্টি-হ্যাক প্রোটেকশন গাইড'
                        : 'Install APK & Anti-Hijack Security Hub'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-100 shrink-0 ml-2">
                    APK
                  </span>
                </button>
              )}
            </div>

            {/* Bottom Links */}
            <div className="pt-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isDeckMode && onExitDeckMode) {
                      onExitDeckMode();
                    } else {
                      onOpenSlideDeck();
                    }
                    setIsMenuOpen(false);
                  }}
                  className="flex-1 min-h-[42px] py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isDeckMode
                      ? lang === 'bn'
                        ? 'মূল অ্যাপে ফিরে যান'
                        : 'Return to Main App'
                      : lang === 'bn'
                      ? 'মূল PDF প্রেজেন্টেশন (৮ স্লাইড)'
                      : 'View 8 PDF Slides'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenArchitectureModal();
                    setIsMenuOpen(false);
                  }}
                  className="min-h-[42px] py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer"
                >
                  Specs
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsPrivacyOpen(true);
                  setIsMenuOpen(false);
                }}
                className="w-full min-h-[42px] py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {lang === 'bn'
                    ? 'গুগল প্লে স্টোর ও হেলথ ডাটা প্রাইভেসী পলিসি'
                    : 'Google Play Safety & Privacy Policy'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        lang={lang}
      />
    </header>
  );
};
