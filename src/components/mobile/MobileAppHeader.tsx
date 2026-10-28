import React, { useState, useEffect, useRef } from 'react';
import { ActiveTab, Language } from '../../types';
import { BrandLogo } from '../BrandLogo';
import { useBrandConfig } from '../../config/brandConfig';
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
  const [menuOpen, setMenuOpen] = useState(false);

  // Zero-Trust Cloud Admin Visibility State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Hidden 5-Tap Logo Unlock Dialog States
  const logoTapCountRef = useRef(0);
  const logoTapTimerRef = useRef<number | null>(null);
  const [isSecretUnlockModalOpen, setIsSecretUnlockModalOpen] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    const syncAdminVisibility = async () => {
      const u = auth.currentUser;
      if (!u) {
        setIsAdminUnlocked(false);
        return;
      }
      if (isBootstrappedAdminUser(u)) {
        setIsAdminUnlocked(true);
        return;
      }
      try {
        const verified = await checkIsVerifiedAdminInFirestore(u);
        setIsAdminUnlocked(verified);
      } catch {
        setIsAdminUnlocked(false);
      }
    };

    const unsub = onAuthStateChanged(auth, () => {
      syncAdminVisibility();
    });
    window.addEventListener('bloodsearch_user_changed', syncAdminVisibility);
    syncAdminVisibility();

    return () => {
      unsub();
      window.removeEventListener('bloodsearch_user_changed', syncAdminVisibility);
    };
  }, []);

  const handleSecretLogoTap = () => {
    logoTapCountRef.current += 1;
    if (logoTapTimerRef.current) {
      window.clearTimeout(logoTapTimerRef.current);
    }
    if (logoTapCountRef.current >= 5) {
      logoTapCountRef.current = 0;
      if (isAdminUnlocked) {
        setActiveTab('admin');
      } else {
        setUnlockError(null);
        setUnlockCode('');
        setIsSecretUnlockModalOpen(true);
      }
      return;
    }
    logoTapTimerRef.current = window.setTimeout(() => {
      logoTapCountRef.current = 0;
    }, 1800);
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);

    let pendingPopup: Promise<any> | null = null;
    if (!auth.currentUser) {
      pendingPopup = signInWithGoogleReal();
    }

    setIsUnlocking(true);
    try {
      if (pendingPopup) {
        await pendingPopup;
      }
      const u = auth.currentUser;
      if (!u) {
        setUnlockError(lang === 'bn' ? 'প্রথমে লগইন সম্পন্ন করুন।' : 'Please sign in first.');
        setIsUnlocking(false);
        return;
      }

      if (isBootstrappedAdminUser(u)) {
        setIsAdminUnlocked(true);
        setIsSecretUnlockModalOpen(false);
        setActiveTab('admin');
        setIsUnlocking(false);
        return;
      }

      const ok = await grantAdminAccessWithInviteCode(unlockCode);
      if (!ok) {
        setUnlockError(
          lang === 'bn'
            ? 'অনুমোদিত নয়! শুধুমাত্র অ্যাপ ওনার বা তাঁর সক্রিয় ইনভাইট কোডধারী প্রবেশ করতে পারবেন।'
            : 'Unauthorized! Only the App Owner or an active Owner-issued Invite Code can unlock Admin.'
        );
        setIsUnlocking(false);
        return;
      }

      setIsAdminUnlocked(true);
      setIsSecretUnlockModalOpen(false);
      setActiveTab('admin');
    } catch (err: any) {
      setUnlockError(err?.message || 'Verification failed.');
    } finally {
      setIsUnlocking(false);
    }
  };

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
    badge?: number;
  }> = [
    { id: 'home', labelBn: 'হোম', labelEn: 'Home' },
    { id: 'search', labelBn: 'ডোনার খুঁজুন', labelEn: 'Find Donors' },
    {
      id: 'requests',
      labelBn: 'জরুরি আবেদন',
      labelEn: 'Requests',
      badge: unreadSosCount > 0 ? unreadSosCount : undefined,
    },
    { id: 'map', labelBn: 'ম্যাপ', labelEn: 'Live Map' },
    {
      id: 'chat',
      labelBn: 'চ্যাট',
      labelEn: 'Chat',
      badge: unreadChatCount > 0 ? unreadChatCount : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0b1120]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800/90 transition-colors">
      <div className="max-w-6xl mx-auto h-16 px-3.5 sm:px-6 flex items-center justify-between gap-3">
        {/* Left Zone: Brand Logo (Desktop & Home) or Back Button (Mobile Sub-Views) */}
        <div className="flex items-center gap-2.5 min-w-0">
          {showMobileBackButton ? (
            <>
              <button
                type="button"
                onClick={() => {
                  if (isDeckMode) onExitDeckMode();
                  else setActiveTab('home');
                }}
                aria-label="Go Back"
                className="lg:hidden min-h-[42px] min-w-[42px] rounded-xl btn-surface flex items-center justify-center cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="lg:hidden font-bold text-base text-slate-900 dark:text-white truncate">
                {getScreenTitle()}
              </h1>
              <div
                onClick={() => {
                  if (isDeckMode) onExitDeckMode();
                  else setActiveTab('home');
                  handleSecretLogoTap();
                }}
                className="hidden lg:block cursor-pointer select-none"
              >
                <BrandLogo variant="lockup" size="sm" />
              </div>
            </>
          ) : (
            <div
              onClick={handleSecretLogoTap}
              className="cursor-pointer select-none min-w-0"
              title={brand.brandName}
            >
              <BrandLogo variant="lockup" size="sm" />
            </div>
          )}
        </div>

        {/* Center Zone: Clean Desktop Navigation (Single-Line, Zero Clutter) */}
        {!isDeckMode && (
          <nav
            aria-label="Desktop Navigation"
            className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-800"
          >
            {desktopNavItems.map((item) => {
              const isActive =
                activeTab === item.id ||
                (item.id === 'search' && activeTab === 'onboarding');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs border border-slate-200/70 dark:border-slate-700/80'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{lang === 'bn' ? item.labelBn : item.labelEn}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold tabular-nums flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
            {isAdminUnlocked && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'btn-obsidian'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-rose-500" />
                <span>{lang === 'bn' ? 'অ্যাডমিন' : 'Admin'}</span>
              </button>
            )}
          </nav>
        )}

        {/* Right Zone: Clean Primary CTA + Account Button + Menu Drawer Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Primary Emergency SOS CTA (Visible on Tablet/Desktop; Mobile has dedicated bottom SOS button) */}
          <button
            type="button"
            onClick={onOpenSOSModal}
            className="hidden sm:inline-flex min-h-[42px] px-4 py-2 rounded-xl btn-crimson text-xs font-bold items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>{lang === 'bn' ? 'জরুরি রক্ত চাই' : 'Request Blood'}</span>
          </button>

          {/* Account / Donor Sign-In Button */}
          {liveUserLabel ? (
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`min-h-[42px] px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'profile' ? 'btn-soft-rose' : 'btn-surface'
              }`}
              title={liveUserLabel}
            >
              <UserIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="max-w-[92px] sm:max-w-[120px] truncate">{liveUserLabel}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="min-h-[42px] px-3.5 py-2 rounded-xl btn-obsidian text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'bn' ? 'লগইন / ডোনার হোন' : 'Sign In'}</span>
            </button>
          )}

          {/* Clean Menu Button (42x42px Hitbox) */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Open Quick Menu"
            aria-expanded={menuOpen}
            className={`min-h-[42px] min-w-[42px] rounded-xl flex items-center justify-center cursor-pointer shrink-0 ${
              menuOpen ? 'btn-crimson' : 'btn-surface'
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

              {isAdminUnlocked && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin');
                    setMenuOpen(false);
                  }}
                  className="min-h-[46px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl btn-obsidian text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  <Shield className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">
                    {lang === 'bn' ? 'অ্যাডমিন কন্ট্রোল প্যানেল' : 'Admin Control Panel'}
                  </span>
                </button>
              )}

              {isAdminUnlocked && onOpenPlayStoreModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPlayStoreModal();
                    setMenuOpen(false);
                  }}
                  className="min-h-[46px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl btn-surface text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    {lang === 'bn' ? 'ডিপ্লয় ও Android APK গাইড' : 'Deploy & APK Guide'}
                  </span>
                </button>
              )}

              {isAdminUnlocked && onOpenCommercialModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenCommercialModal();
                    setMenuOpen(false);
                  }}
                  className="min-h-[46px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl btn-surface text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  <PackageCheck className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                  <span className="truncate">
                    {lang === 'bn' ? 'হোয়াইট-লেবেল ও বায়ার কিট' : 'White-Label & Buyer Kit'}
                  </span>
                </button>
              )}

              {isAdminUnlocked && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenSlideDeck();
                    setMenuOpen(false);
                  }}
                  className="min-h-[46px] flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl btn-surface text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  <Layers className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="truncate">
                    {lang === 'bn' ? 'প্রজেক্ট ওভারভিউ ও আর্কিটেকচার' : 'Overview & Architecture'}
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

      {/* Secret Owner/Admin Unlock Dialog (Triggered by tapping Logo 5 times) */}
      {isSecretUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 p-5 shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Lock className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'অ্যাডমিন প্যানেল আনলক' : 'Admin Access Verification'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Zero-Trust Cloud Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSecretUnlockModalOpen(false)}
                className="min-h-[36px] min-w-[36px] rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUnlockSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {lang === 'bn'
                    ? 'ওনার ইনভাইট কোড (সুপার ওনারের জন্য খালি রাখলেও চলবে)'
                    : 'Owner Invite Code (Optional for Super Owner)'}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    value={unlockCode}
                    onChange={(e) => setUnlockCode(e.target.value)}
                    placeholder={lang === 'bn' ? 'সিক্রেট কোড লিখুন...' : 'Enter secret code...'}
                    className="w-full h-11 pl-9 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {unlockError && (
                <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-[11px] font-bold text-red-700 dark:text-red-300 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{unlockError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isUnlocking}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isUnlocking
                  ? lang === 'bn'
                    ? 'যাচাই করা হচ্ছে...'
                    : 'Verifying...'
                  : lang === 'bn'
                    ? 'ভেরিফাই করে অ্যাডমিন প্যানেল খুলুন'
                    : 'Verify & Open Admin Panel'}
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
