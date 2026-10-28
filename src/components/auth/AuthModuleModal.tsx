import React, { useState, useEffect } from 'react';
import { Language, UserAccount } from '../../types';
import { BrandLogo } from '../BrandLogo';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogleReal,
  registerOrLoginRealEmailPassword,
  sendRealPasswordReset,
  sendRealPhoneSmsOtp,
  clearPhoneRecaptchaVerifier,
  signOutReal,
  parseFirebaseAuthError,
  fetchUserProfileFromFirestore,
  ensureUserAutoSyncedInFirestore,
  checkIsVerifiedAdminInFirestore,
  isBootstrappedAdminUser,
  formatBangladeshE164,
  isValidBangladeshMobile,
  normalizeAsciiDigits,
  DEFAULT_AVATAR_DATA_URI,
  AuthProviderErrorDetails,
  ConfirmationResult,
  User,
} from '../../firebase';
import {
  X,
  Smartphone,
  Mail,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  UserPlus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AuthModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLogAudit: (action: any, details: string) => void;
  onOpenRegister?: () => void;
}

export const AuthModuleModal: React.FC<AuthModuleModalProps> = ({
  isOpen,
  onClose,
  lang,
  onLogAudit,
  onOpenRegister,
}) => {
  const [altMethod, setAltMethod] = useState<'none' | 'phone' | 'email'>('none');

  // Live Firebase User State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [localProfile, setLocalProfile] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('bloodsearch_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Loading & Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<AuthProviderErrorDetails | null>(null);

  // Email + Password / Forgot Password States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);

  // Phone OTP States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [waitingRecaptchaTick, setWaitingRecaptchaTick] = useState(false);
  const [useVisibleRecaptcha, setUseVisibleRecaptcha] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (u && u.email && !email) {
        setEmail(u.email);
      }
    });
    const handleLocalSync = () => {
      try {
        const saved = localStorage.getItem('bloodsearch_current_user');
        setLocalProfile(saved ? JSON.parse(saved) : null);
      } catch {}
    };
    window.addEventListener('bloodsearch_user_changed', handleLocalSync);
    return () => {
      unsub();
      window.removeEventListener('bloodsearch_user_changed', handleLocalSync);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      clearPhoneRecaptchaVerifier('firebase-phone-recaptcha');
      setProviderError(null);
      setAuthSuccess(null);
      setWaitingRecaptchaTick(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const syncAuthenticatedUser = async (user: User) => {
    let profile: UserAccount | null = null;
    try {
      profile = await ensureUserAutoSyncedInFirestore(user);
      if (!profile) {
        profile = await fetchUserProfileFromFirestore(user.uid);
      }
    } catch {
      profile = null;
    }

    const isAdmin = await checkIsVerifiedAdminInFirestore(user);

    const activeAccount: UserAccount = profile || {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'স্বেচ্ছাসেবী রক্তদাতা',
      email: user.email || `${user.uid.slice(0, 8)}@bloodsearch.bd`,
      phone: user.phoneNumber || '',
      bloodGroup: 'O+',
      division: 'dhaka',
      district: 'dhaka',
      upazila: 'dhanmondi',
      photoUrl: user.photoURL || DEFAULT_AVATAR_DATA_URI,
      role: isAdmin ? 'ADMIN' : 'USER',
      verifiedStatus: user.emailVerified || Boolean(user.phoneNumber),
      idCardNumber: isAdmin ? 'ADMIN-BD-2026' : `BS-${user.uid.slice(0, 6).toUpperCase()}`,
      age: 25,
      gender: 'MALE',
      weightKg: 62,
      availableToDonate: true,
      totalDonations: 0,
      createdAt: new Date().toISOString(),
    };

    if (isAdmin) {
      activeAccount.role = 'ADMIN';
    }

    localStorage.setItem('bloodsearch_current_user', JSON.stringify(activeAccount));
    setLocalProfile(activeAccount);
    window.dispatchEvent(new Event('bloodsearch_user_changed'));
    return activeAccount;
  };

  // 1-Click Google Login (Synchronous invocation — ZERO await before popup!)
  const handleRealGoogleSignIn = () => {
    const popupPromise = signInWithGoogleReal(email);
    setProviderError(null);
    setAuthSuccess(null);
    setIsLoading(true);

    popupPromise
      .then(async (user) => {
        const synced = await syncAuthenticatedUser(user);
        onLogAudit(
          'STATUS_CHANGE',
          `Google Sign-In verified: ${user.email} (${synced.role})`
        );
        setAuthSuccess(
          lang === 'bn'
            ? `সফলভাবে লগইন হয়েছে (${user.displayName || user.email})`
            : `Signed in successfully (${user.displayName || user.email})`
        );
        setTimeout(() => {
          setAuthSuccess(null);
          onClose();
        }, 900);
      })
      .catch((err: any) => {
        setProviderError(parseFirebaseAuthError(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Email + Password Login / Sign-Up / Password Reset
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProviderError(null);
    setAuthSuccess(null);

    if (!email.trim() || !email.includes('@')) {
      setProviderError({
        code: 'auth/invalid-email',
        messageBn: 'অনুগ্রহ করে সঠিক ইমেইল ঠিকানা লিখুন।',
        messageEn: 'Please enter a valid email address.',
        needsConsoleProviderEnable: false,
        consoleUrl: '',
      });
      return;
    }

    if (isResetMode) {
      setIsLoading(true);
      try {
        await sendRealPasswordReset(email);
        setAuthSuccess(
          lang === 'bn'
            ? `${email.trim()} ঠিকানায় পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। ইনবক্স চেক করুন।`
            : `Password reset link sent to ${email.trim()}. Please check your inbox.`
        );
        setIsResetMode(false);
      } catch (err: any) {
        setProviderError(parseFirebaseAuthError(err));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (password.length < 6) {
      setProviderError({
        code: 'auth/weak-password',
        messageBn: 'কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।',
        messageEn: 'Please enter a password of at least 6 characters.',
        needsConsoleProviderEnable: false,
        consoleUrl: '',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { user, verificationSent } = await registerOrLoginRealEmailPassword(
        email,
        password,
        isRegisterMode
      );
      await syncAuthenticatedUser(user);
      onLogAudit(
        'STATUS_CHANGE',
        `Email Auth (${isRegisterMode ? 'Register' : 'Login'}): ${user.email}`
      );
      if (verificationSent && !user.emailVerified) {
        setAuthSuccess(
          lang === 'bn'
            ? `অ্যাকাউন্ট তৈরি হয়েছে! আপনার ইমেইলে (${user.email}) ভেরিফিকেশন লিংক পাঠানো হয়েছে।`
            : `Account created! Verification link sent to ${user.email}.`
        );
      } else {
        setAuthSuccess(
          lang === 'bn'
            ? `সফলভাবে লগইন হয়েছে (${user.email})`
            : `Signed in successfully (${user.email})`
        );
        setTimeout(() => {
          setAuthSuccess(null);
          onClose();
        }, 900);
      }
    } catch (err: any) {
      setProviderError(parseFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Phone OTP Login
  const normalizedPhoneE164 = formatBangladeshE164(phoneNumber);
  const phoneLooksValid = isValidBangladeshMobile(phoneNumber);

  const handleSendRealPhoneOtp = async () => {
    setProviderError(null);
    setAuthSuccess(null);
    if (!phoneLooksValid) {
      setProviderError({
        code: 'auth/invalid-phone-number',
        messageBn: 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (যেমন: 01712345678)।',
        messageEn: 'Enter a valid 11-digit mobile number (e.g. 01712345678).',
        needsConsoleProviderEnable: false,
        consoleUrl: '',
      });
      return;
    }

    setIsLoading(true);
    setWaitingRecaptchaTick(false);
    try {
      const result = await sendRealPhoneSmsOtp(phoneNumber, 'firebase-phone-recaptcha', {
        forceVisibleRecaptcha: useVisibleRecaptcha,
        onRecaptchaChallengeShown: () => setWaitingRecaptchaTick(true),
        onRecaptchaSolved: () => setWaitingRecaptchaTick(false),
      });
      setWaitingRecaptchaTick(false);
      setConfirmationResult(result);
      setOtpDigits(['', '', '', '', '', '']);
      onLogAudit('STATUS_CHANGE', `SMS OTP sent to ${normalizedPhoneE164}`);
      setAuthSuccess(
        lang === 'bn'
          ? `${normalizedPhoneE164} নম্বরে ৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে।`
          : `6-digit code sent to ${normalizedPhoneE164}.`
      );

      try {
        if (typeof window !== 'undefined' && 'OTPCredential' in window && navigator.credentials) {
          const ac = new AbortController();
          window.setTimeout(() => ac.abort(), 60000);
          (navigator.credentials as any)
            .get({ otp: { transport: ['sms'] }, signal: ac.signal })
            .then((otpCred: any) => {
              const incoming = String(otpCred?.code || '').replace(/[^0-9]/g, '');
              if (incoming.length === 6) {
                setOtpDigits(incoming.split(''));
              }
            })
            .catch(() => {});
        }
      } catch {}
    } catch (err: any) {
      setWaitingRecaptchaTick(false);
      clearPhoneRecaptchaVerifier('firebase-phone-recaptcha');
      const parsed = parseFirebaseAuthError(err);
      setProviderError(parsed);
      if (parsed.code === 'auth/captcha-check-failed') {
        setUseVisibleRecaptcha(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyRealPhoneOtp = async () => {
    if (!confirmationResult) return;
    const code = normalizeAsciiDigits(otpDigits.join('')).replace(/[^0-9]/g, '');
    if (code.length !== 6) {
      setProviderError({
        code: 'auth/invalid-verification-code',
        messageBn: 'অনুগ্রহ করে সম্পূর্ণ ৬-সংখ্যার কোডটি লিখুন।',
        messageEn: 'Please enter all 6 digits of the code.',
        needsConsoleProviderEnable: false,
        consoleUrl: '',
      });
      return;
    }

    setIsLoading(true);
    setProviderError(null);
    try {
      const cred = await confirmationResult.confirm(code);
      await syncAuthenticatedUser(cred.user);
      onLogAudit('STATUS_CHANGE', `Phone OTP verified: ${cred.user.phoneNumber}`);
      setAuthSuccess(
        lang === 'bn'
          ? `সফলভাবে লগইন হয়েছে (${cred.user.phoneNumber})`
          : `Signed in successfully (${cred.user.phoneNumber})`
      );
      setTimeout(() => {
        setAuthSuccess(null);
        onClose();
      }, 900);
    } catch (err: any) {
      setProviderError(parseFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpDigitChange = (idx: number, val: string) => {
    const ascii = normalizeAsciiDigits(val).replace(/[^0-9]/g, '');
    if (ascii.length > 1) {
      const chars = ascii.slice(0, 6).split('');
      const next = [...otpDigits];
      chars.forEach((ch, offset) => {
        if (idx + offset < 6) next[idx + offset] = ch;
      });
      setOtpDigits(next);
      const focusIdx = Math.min(5, idx + chars.length);
      document.getElementById(`real-otp-digit-${focusIdx}`)?.focus();
      return;
    }

    const clean = ascii.slice(-1);
    const next = [...otpDigits];
    next[idx] = clean;
    setOtpDigits(next);
    if (clean && idx < 5) {
      document.getElementById(`real-otp-digit-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
      document.getElementById(`real-otp-digit-${idx - 1}`)?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerifyRealPhoneOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = normalizeAsciiDigits(e.clipboardData.getData('text')).replace(/[^0-9]/g, '');
    if (pasted.length >= 2) {
      e.preventDefault();
      const next = ['', '', '', '', '', ''];
      pasted
        .slice(0, 6)
        .split('')
        .forEach((c, i) => {
          next[i] = c;
        });
      setOtpDigits(next);
      document.getElementById(`real-otp-digit-${Math.min(5, pasted.length - 1)}`)?.focus();
    }
  };

  const handleRealLogout = async () => {
    setIsLoading(true);
    try {
      await signOutReal();
      setFirebaseUser(null);
      setLocalProfile(null);
      setConfirmationResult(null);
      onLogAudit('STATUS_CHANGE', 'User signed out');
      setAuthSuccess(
        lang === 'bn' ? 'আপনি সফলভাবে লগআউট হয়েছেন।' : 'Signed out successfully.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const activeDisplayName =
    localProfile?.name || firebaseUser?.displayName || firebaseUser?.email || firebaseUser?.phoneNumber;
  const activeRole =
    localProfile?.role === 'ADMIN' || isBootstrappedAdminUser(firebaseUser) ? 'ADMIN' : 'USER';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 overflow-y-auto modal-scroll-contain">
      <div className="w-full max-w-md my-auto rounded-3xl bg-white dark:bg-[#1e293b] p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-700 text-left space-y-4">
        {/* Clean Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <BrandLogo variant="mark" size="md" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {lang === 'bn' ? 'সহজ লগইন ও অ্যাকাউন্ট' : 'Quick Sign In'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'মাত্র ১ ক্লিকে নিরাপদভাবে যুক্ত হোন'
                  : 'Fast and secure 1-click access'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Signed-In User Card */}
        {(firebaseUser || localProfile) && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={localProfile?.photoUrl || firebaseUser?.photoURL || DEFAULT_AVATAR_DATA_URI}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_DATA_URI;
                }}
                alt="User"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-rose-500/30 shrink-0"
              />
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                  {activeDisplayName}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {firebaseUser?.email || firebaseUser?.phoneNumber || localProfile?.phone}
                  {activeRole === 'ADMIN'
                    ? lang === 'bn'
                      ? ' · অ্যাডমিন'
                      : ' · Admin'
                    : ''}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRealLogout}
              disabled={isLoading}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লগআউট' : 'Sign Out'}</span>
            </button>
          </div>
        )}

        {/* Success Feedback */}
        {authSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{authSuccess}</span>
          </div>
        )}

        {/* Clean Human-Friendly Error Message */}
        {providerError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2.5 text-xs">
            <div className="flex items-start gap-2 text-rose-900 dark:text-rose-200 font-semibold leading-relaxed">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{lang === 'bn' ? providerError.messageBn : providerError.messageEn}</span>
            </div>
            {altMethod !== 'none' && (
              <button
                type="button"
                onClick={handleRealGoogleSignIn}
                className="min-h-[38px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 text-white font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                {lang === 'bn' ? 'Google দিয়ে ১-ক্লিকে লগইন করুন' : 'Sign In with Google Instead'}
              </button>
            )}
          </div>
        )}

        {/* PRIMARY HERO CTA: 1-Click Google Login */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleRealGoogleSignIn}
            disabled={isLoading}
            className="w-full min-h-[52px] py-3 px-4 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm flex items-center justify-center gap-3 shadow-md transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60 whitespace-nowrap"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {isLoading && altMethod === 'none'
                ? lang === 'bn'
                  ? 'যুক্ত হচ্ছে...'
                  : 'Signing in...'
                : lang === 'bn'
                ? 'Google দিয়ে ১-ক্লিকে লগইন করুন'
                : 'Continue with Google'}
            </span>
          </button>
          <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'কোনো পাসওয়ার্ড বা কোড লাগবে না — নিজের Gmail বেছে নিলেই সঙ্গে সঙ্গে লগইন হবে'
              : 'No password or SMS wait needed — sign in instantly with your Google account'}
          </p>
        </div>

        {/* Clean Divider */}
        <div className="relative flex items-center py-0.5">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          <span className="shrink-0 px-3 text-[11px] font-semibold text-slate-400">
            {lang === 'bn' ? 'অথবা অন্য মাধ্যম' : 'or use another option'}
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        </div>

        {/* Secondary Options: Mobile OTP or Email Password */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setAltMethod(altMethod === 'phone' ? 'none' : 'phone');
              setProviderError(null);
            }}
            className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
              altMethod === 'phone'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>{lang === 'bn' ? 'মোবাইল ওটিপি' : 'Mobile OTP'}</span>
            {altMethod === 'phone' ? (
              <ChevronUp className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setAltMethod(altMethod === 'email' ? 'none' : 'email');
              setProviderError(null);
            }}
            className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
              altMethod === 'email'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span>{lang === 'bn' ? 'ইমেইল ও পাসওয়ার্ড' : 'Email & Password'}</span>
            {altMethod === 'email' ? (
              <ChevronUp className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            )}
          </button>
        </div>

        {/* Collapsible Mobile OTP Section */}
        {altMethod === 'phone' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
            {!confirmationResult ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {lang === 'bn' ? 'আপনার মোবাইল নম্বর' : 'Mobile Number'}
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="017XXXXXXXX"
                      className="w-full h-11 pl-9 pr-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {waitingRecaptchaTick && (
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {lang === 'bn'
                      ? 'নিচের নিরাপত্তা বক্সে টিক দিন:'
                      : 'Please complete the security check below:'}
                  </p>
                )}

                <div
                  id="firebase-phone-recaptcha"
                  className="flex justify-center overflow-hidden"
                />

                <button
                  type="button"
                  onClick={handleSendRealPhoneOtp}
                  disabled={isLoading}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  {isLoading
                    ? lang === 'bn'
                      ? 'কোড পাঠানো হচ্ছে...'
                      : 'Sending code...'
                    : lang === 'bn'
                    ? 'ওটিপি কোড পাঠান'
                    : 'Send OTP Code'}
                </button>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {lang === 'bn'
                    ? 'নোট: সিমে SMS আসতে দেরি হলে উপরের "Google দিয়ে ১-ক্লিকে লগইন করুন" বাটন চাপুন — কোনো কোড ছাড়াই সঙ্গে সঙ্গে লগইন হবে।'
                    : 'Note: If SIM SMS is delayed, use "Continue with Google" above for instant 1-click sign-in with zero wait.'}
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? '৬-সংখ্যার কোড লিখুন' : 'Enter 6-digit code'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmationResult(null);
                      setOtpDigits(['', '', '', '', '', '']);
                    }}
                    className="text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
                  >
                    {lang === 'bn' ? 'নম্বর পরিবর্তন' : 'Change number'}
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`real-otp-digit-${idx}`}
                      type="text"
                      inputMode="numeric"
                      autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                      maxLength={6}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="h-11 text-center font-mono font-bold text-base rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleVerifyRealPhoneOtp}
                  disabled={isLoading}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  {isLoading
                    ? lang === 'bn'
                      ? 'যাচাই হচ্ছে...'
                      : 'Verifying...'
                    : lang === 'bn'
                    ? 'কোড যাচাই করে লগইন করুন'
                    : 'Verify & Sign In'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Email + Password Section */}
        {altMethod === 'email' && (
          <form
            onSubmit={handleEmailSubmit}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full h-11 pl-9 pr-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {!isResetMode && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setProviderError(null);
                    }}
                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={lang === 'bn' ? 'কমপক্ষে ৬ অক্ষর' : 'At least 6 characters'}
                    className="w-full h-11 pl-9 pr-10 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {isLoading
                ? lang === 'bn'
                  ? 'অপেক্ষা করুন...'
                  : 'Please wait...'
                : isResetMode
                ? lang === 'bn'
                  ? 'পাসওয়ার্ড রিসেট লিংক পাঠান'
                  : 'Send Password Reset Link'
                : isRegisterMode
                ? lang === 'bn'
                  ? 'নতুন অ্যাকাউন্ট তৈরি করুন'
                  : 'Create Account'
                : lang === 'bn'
                ? 'লগইন করুন'
                : 'Sign In'}
            </button>

            <div className="flex items-center justify-center pt-0.5 text-xs">
              {isResetMode ? (
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="font-semibold text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? '← লগইনে ফিরে যান' : '← Back to Sign In'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>
                    {isRegisterMode
                      ? lang === 'bn'
                        ? 'আগেই অ্যাকাউন্ট আছে? লগইন করুন'
                        : 'Already have an account? Sign In'
                      : lang === 'bn'
                      ? 'নতুন ইমেইল অ্যাকাউন্ট খুলুন'
                      : 'Create a new email account'}
                  </span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* Clean Shortcut to Donor Registration */}
        {onOpenRegister && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {lang === 'bn'
                ? 'রক্তদাতা হিসেবে নাম যুক্ত করতে চান?'
                : 'Want to join as a blood donor?'}
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ডোনার নিবন্ধন' : 'Register Donor'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
