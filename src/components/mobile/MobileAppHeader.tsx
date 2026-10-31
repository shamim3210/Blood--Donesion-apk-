import React, { useState, useEffect, useRef } from 'react';
import { ActiveTab, Language } from '../../types';
import { BrandLogo } from '../BrandLogo';
import { useBrandConfig } from '../../config/brandConfig';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  auth,
  onAuthStateChanged,
  checkIsVerifiedAdminInFirestore,
  isBootstrappedAdminUser,
  grantAdminAccessWithInviteCode,
  signInWithGoogleReal,
} from '../../firebase';
import {
  ArrowLeft,
  Home,
  Search,
  Droplet,
  MapPin,
  MessageSquare,
  Sun,
  Moon,
  Shield,
  Users,
  CheckCircle2,
  Menu,
  X,
  LogIn,
  LogOut,
  UserPlus,
  Layers,
  Lock,
  KeyRound,
  AlertCircle,
  Download,
  Type,
  PackageCheck,
  PlusCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  User as UserIcon,
} from 'lucide-react';

interface MobileAppHeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onOpenSOSModal: () => void;
  onOpenAuthModal: () => void;
  onOpenRegisterModal: (role?: 'USER' | 'ADMIN') => void;
  onOpenFamilyModal: () => void;
  onOpenArchitectureModal: () => void;
  onOpenSlideDeck: () => void;
  onOpenPlayStoreModal?: () => void;
  onOpenCommercialModal?: () => void;
  isDeckMode: boolean;
  onExitDeckMode: () => void;
  liveUserLabel?: string | null;
  onSignOut?: () => void;
  seniorMode?: boolean;
  setSeniorMode?: (enabled: boolean) => void;
  unreadSosCount?: number;
  unreadChatCount?: number;
  sosSoundEnabled?: boolean;
  onToggleSosSound?: () => void;
}

export const MobileAppHeader: React.FC<MobileAppHeaderProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  darkMode,
  setDarkMode,
  onOpenSOSModal,
  onOpenAuthModal,
  onOpenRegisterModal,
  onOpenFamilyModal,
  onOpenArchitectureModal,
  onOpenSlideDeck,
  onOpenPlayStoreModal,
  onOpenCommercialModal,
  isDeckMode,
  onExitDeckMode,
  liveUserLabel,
  onSignOut,
  seniorMode = false,
  setSeniorMode,
  unreadSosCount = 0,
  unreadChatCount = 0,
  sosSoundEnabled = true,
  onToggleSosSound,
}) => {
  const brand = useBrandConfig();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [menuOpen, setMenuOpen] = useState(false);



  const getScreenTitle = () => {
    if (isDeckMode) return lang === 'bn' ? 'প্রেজেন্টেশন ওভারভিউ' : 'Presentation Deck';
    switch (activeTab) {
      case 'onboarding':
      case 'search':
        return lang === 'bn' ? 'রক্তদাতা খুঁজুন' : 'Find Donors';
      case 'requests':
        return lang === 'bn' ? 'জরুরি রক্তের আবেদন' : 'Emergency Requests';
      case 'chat':
        return lang === 'bn' ? 'লাইভ মেসেজিং' : 'Live Chat';
      case 'badges':
        return lang === 'bn' ? 'ডোনার সম্মাননা' : 'Achievements';
      case 'profile':
        return lang === 'bn' ? 'আমার প্রোফাইল ও আইডি' : 'My Profile & ID';
      case 'map':
        return lang === 'bn' ? 'লাইভ জিপিএস ম্যাপ' : 'Live GPS Map';
      case 'admin':
        return lang === 'bn' ? 'অ্যাডমিন কন্ট্রোল প্যানেল' : 'Admin Control Panel';
      case 'compatibility':
        return lang === 'bn' ? 'রক্তের গ্রুপ সামঞ্জস্যতা' : 'Compatibility';
      case 'eligibility':
        return lang === 'bn' ? 'রক্তদানের যোগ্যতা যাচাই' : 'Eligibility Check';
      case 'security':
        return lang === 'bn' ? 'নিরাপত্তা লগ' : 'Security Audit';
      default:
        return brand.brandName;
    }
  };

  const showMobileBackButton = isDeckMode || activeTab !== 'home';

  const desktopNavItems: Array<{
    id: ActiveTab;
    labelBn: string;
    labelEn: string;
    icon: React.ComponentType<{ className?: string }>;
    activeClass: string;
    hoverClass: string;
    iconTint: string;
    badge?: number;
  }> = [
    {
      id: 'home',
      labelBn: 'হোম',
      labelEn: 'Home',
      icon: Home,
      activeClass:
        'bg-[#dc2626] border-[#b91c1c] text-white shadow-[0_6px_16px_-3px_rgba(220,38,38,0.45)]',
      hoverClass:
        'hover:bg-[#dc2626] hover:border-[#b91c1c] hover:text-white hover:shadow-[0_6px_16px_-3px_rgba(220,38,38,0.4)] hover:-translate-y-0.5',
      iconTint: 'text-rose-600 dark:text-rose-400 group-hover:text-white',
    },
    {
      id: 'search',
      labelBn: 'ডোনার খুঁজুন',
      labelEn: 'Find Donors',
      icon: Search,
      activeClass:
        'bg-[#0284c7] border-[#0369a1] text-white shadow-[0_6px_16px_-3px_rgba(2,132,199,0.45)]',
      hoverClass:
        'hover:bg-[#0284c7] hover:border-[#0369a1] hover:text-white hover:shadow-[0_6px_16px_-3px_rgba(2,132,199,0.4)] hover:-translate-y-0.5',
      iconTint: 'text-sky-600 dark:text-sky-400 group-hover:text-white',
    },
    {
      id: 'requests',
      labelBn: 'জরুরি আবেদন',
      labelEn: 'Requests',
      icon: Droplet,
      activeClass:
        'bg-[#be123c] border-[#9f1239] text-white shadow-[0_6px_16px_-3px_rgba(190,18,60,0.45)]',
      hoverClass:
        'hover:bg-[#be123c] hover:border-[#9f1239] hover:text-white hover:shadow-[0_6px_16px_-3px_rgba(190,18,60,0.4)] hover:-translate-y-0.5',
      iconTint: 'text-rose-600 dark:text-rose-400 group-hover:text-white',
      badge: unreadSosCount > 0 ? unreadSosCount : undefined,
    },
    {
      id: 'map',
      labelBn: 'ম্যাপ',
      labelEn: 'Live Map',
      icon: MapPin,
      activeClass:
        'bg-[#0d9488] border-[#0f766e] text-white shadow-[0_6px_16px_-3px_rgba(13,148,136,0.45)]',
      hoverClass:
        'hover:bg-[#0d9488] hover:border-[#0f766e] hover:text-white hover:shadow-[0_6px_16px_-3px_rgba(13,148,136,0.4)] hover:-translate-y-0.5',
      iconTint: 'text-teal-600 dark:text-teal-400 group-hover:text-white',
    },
    {
      id: 'chat',
      labelBn: 'চ্যাট',
      labelEn: 'Chat',
      icon: MessageSquare,
      activeClass:
        'bg-[#059669] border-[#047857] text-white shadow-[0_6px_16px_-3px_rgba(5,150,105,0.45)]',
      hoverClass:
        'hover:bg-[#059669] hover:border-[#047857] hover:text-white hover:shadow-[0_6px_16px_-3px_rgba(5,150,105,0.4)] hover:-translate-y-0.5',
      iconTint: 'text-emerald-600 dark:text-emerald-400 group-hover:text-white',
      badge: unreadChatCount > 0 ? unreadChatCount : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#091120]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 shadow-[0_4px_18px_-4px_rgba(11,34,57,0.08)] transition-colors">
      <div className="h-[3px] w-full bg-gradient-to-r from-[#dc2626] via-[#0284c7] to-[#059669]" />
      <div className="max-w-6xl mx-auto h-16 px-3.5 sm:px-6 flex items-center justify-between gap-3 lg:gap-4">
        {/* Zone 1: Clean 1-Line Brand Wordmark (Desktop & Home) or Back Button (Mobile Sub-Views) */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          {showMobileBackButton ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (isDeckMode) onExitDeckMode();
                  else setActiveTab('home');
                }}
                aria-label="Go Back"
                className="lg:hidden min-h-[44px] min-w-[44px] rounded-xl btn-surface flex items-center justify-center cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="lg:hidden font-bold text-base text-[#0b2239] dark:text-white truncate">
                {getScreenTitle()}
              </h1>
              <div
                onClick={() => {
                  if (isDeckMode) onExitDeckMode();
                  else setActiveTab('home');
                }}
                className="hidden lg:block cursor-pointer select-none"
              >
                <BrandLogo variant="lockup" size="sm" hideSubtitle />
              </div>
            </>
          ) : (
            <div
              onClick={() => setActiveTab('home')}
              className="cursor-pointer select-none min-w-0"
              title={brand.brandName}
            >
              <BrandLogo variant="lockup" size="sm" hideSubtitle />
            </div>
          )}
        </div>

        {/* Zone 2: Individual Square-Shaped Menu Tiles with Vivid Hover Color Change */}
        {!isDeckMode && (
          <nav
            aria-label="Desktop Navigation"
            className="hidden lg:flex items-center gap-2"
          >
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'search' && activeTab === 'onboarding');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`group relative min-h-[42px] px-3.5 py-2 rounded-lg border text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-all duration-200 ${
                    isActive
                      ? item.activeClass
                      : `bg-slate-50/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 ${item.hoverClass}`
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-white' : item.iconTint
                    }`}
                  />
                  <span>{lang === 'bn' ? item.labelBn : item.labelEn}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[11px] font-mono font-black tabular-nums transition-colors ${
                        isActive
                          ? 'text-amber-200'
                          : 'text-[#dc2626] dark:text-rose-400 group-hover:text-amber-200'
                      }`}
                    >
                      ({item.badge > 9 ? '9+' : item.badge})
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Zone: Square-Edged Primary CTA + Account Tile + Square Menu Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSOSModal}
            className="hidden sm:inline-flex min-h-[42px] px-3.5 py-2 rounded-lg bg-[#dc2626] hover:bg-[#991b1b] border border-[#b91c1c] text-white text-xs font-extrabold items-center gap-1.5 shadow-sm hover:shadow-[0_6px_16px_-3px_rgba(220,38,38,0.45)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>{lang === 'bn' ? 'জরুরি রক্ত চাই' : 'Request Blood'}</span>
          </button>

          {liveUserLabel ? (
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`group min-h-[42px] px-3 sm:px-3.5 py-2 rounded-lg border text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-[#4f46e5] border-[#4338ca] text-white shadow-[0_6px_16px_-3px_rgba(79,70,229,0.45)]'
                  : 'bg-slate-50/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-[#4f46e5] hover:border-[#4338ca] hover:text-white hover:shadow-[0_6px_16px_-3px_rgba(79,70,229,0.4)] hover:-translate-y-0.5'
              }`}
              title={liveUserLabel}
            >
              <UserIcon
                className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                  activeTab === 'profile'
                    ? 'text-white'
                    : 'text-emerald-600 dark:text-emerald-400 group-hover:text-white'
                }`}
              />
              <span className="max-w-[92px] sm:max-w-[120px] truncate">{liveUserLabel}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="min-h-[42px] px-3.5 py-2 rounded-lg bg-[#0b2239] hover:bg-[#059669] border border-[#0b2239] hover:border-[#047857] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm hover:shadow-[0_6px_16px_-3px_rgba(5,150,105,0.45)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'bn' ? 'সাইন ইন' : 'Sign In'}</span>
            </button>
          )}

          {/* Crisp 42x42 Square Menu Button with Visible Hover Color Change */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Open Quick Menu"
            aria-expanded={menuOpen}
            className={`min-h-[42px] min-w-[42px] rounded-lg border flex items-center justify-center cursor-pointer shrink-0 transition-all duration-200 ${
              menuOpen
                ? 'bg-[#dc2626] border-[#b91c1c] text-white shadow-md'
                : 'bg-slate-50/95 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#0b2239] hover:border-[#0b2239] hover:text-white hover:-translate-y-0.5'
            }`}
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Clean, Well-Spaced Quick Settings & Tools Drawer */}
      {menuOpen && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1120] shadow-xl">
          <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 space-y-3">
            {/* Quick Preferences Bar (Language, Theme, Large Text, Update Check) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {lang === 'bn' ? 'দ্রুত সেটিংস' : 'Quick Settings'}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new Event('bloodsearch_manual_update_check'));
                    setMenuOpen(false);
                  }}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl btn-soft-emerald text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'bn' ? 'অ্যাপ আপডেট চেক' : 'Check Updates'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl btn-surface text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  {lang === 'bn' ? 'Language: English' : 'ভাষা: বাংলা'}
                </button>

                <button
                  type="button"
                  onClick={() => setDarkMode(!darkMode)}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl btn-surface text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {darkMode ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'bn' ? 'লাইট থিম' : 'Light Mode'}</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-slate-600" />
                      <span>{lang === 'bn' ? 'ডার্ক থিম' : 'Dark Mode'}</span>
                    </>
                  )}
                </button>

                {setSeniorMode && (
                  <button
                    type="button"
                    onClick={() => setSeniorMode(!seniorMode)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      seniorMode ? 'btn-emerald' : 'btn-surface'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'বড় অক্ষর (অ+)' : 'Large Text'}</span>
                  </button>
                )}

                {onToggleSosSound && (
                  <button
                    type="button"
                    onClick={onToggleSosSound}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      sosSoundEnabled ? 'btn-soft-emerald' : 'btn-surface'
                    }`}
                  >
                    {sosSoundEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>
                      {sosSoundEnabled
                        ? lang === 'bn'
                          ? 'সাউন্ড অন'
                          : 'Sound On'
                        : lang === 'bn'
                        ? 'সাউন্ড মিউট'
                        : 'Sound Muted'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  onOpenRegisterModal('USER');
                  setMenuOpen(false);
                }}
                className="min-h-[46px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl btn-crimson text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {liveUserLabel
                    ? lang === 'bn'
                      ? 'ডোনার প্রোফাইল ও আইডি আপডেট'
                      : 'Update Donor Smart ID'
                    : lang === 'bn'
                      ? 'নতুন রক্তদাতা রেজিস্ট্রেশন'
                      : 'Register as Blood Donor'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('eligibility');
                  setMenuOpen(false);
                }}
                className="min-h-[46px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl btn-surface text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">
                  {lang === 'bn' ? 'রক্তদানের যোগ্যতা যাচাই' : 'Eligibility Check'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('compatibility');
                  setMenuOpen(false);
                }}
                className="min-h-[46px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl btn-surface text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Layers className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="truncate">
                  {lang === 'bn' ? 'রক্তের গ্রুপ সামঞ্জস্যতা চার্ট' : 'Compatibility Matrix'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenFamilyModal();
                  setMenuOpen(false);
                }}
                className="min-h-[46px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl btn-surface text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                <Users className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="truncate">
                  {lang === 'bn' ? 'ফ্যামিলি রক্ত সুরক্ষা সার্কেল' : 'Family Safety Circle'}
                </span>
              </button>

              {!isInstalled && (
                <button
                  type="button"
                  onClick={async () => {
                    if (isInstallable) {
                      await promptInstall();
                      setMenuOpen(false);
                      return;
                    }
                    if (onOpenPlayStoreModal) {
                      onOpenPlayStoreModal();
                    }
                    setMenuOpen(false);
                  }}
                  className="min-h-[46px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl btn-obsidian text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    {lang === 'bn' ? 'ফোনে অ্যাপ / APK ইনস্টল' : 'Install App / APK'}
                  </span>
                </button>
              )}

              {liveUserLabel && onSignOut && (
                <button
                  type="button"
                  onClick={() => {
                    onSignOut();
                    setMenuOpen(false);
                  }}
                  className="min-h-[46px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl btn-soft-rose text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {lang === 'bn' ? 'অ্যাকাউন্ট লগআউট করুন' : 'Sign Out'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
