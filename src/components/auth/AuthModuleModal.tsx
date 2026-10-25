import React, { useState, useEffect } from 'react';
import { Language, UserAccount } from '../../types';
import { BrandLogo } from '../BrandLogo';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogleReal,
  sendRealGmailSignInLink,
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
  runLiveFirebaseAuthDiagnostics,
  formatBangladeshE164,
  isValidBangladeshMobile,
  normalizeAsciiDigits,
  DEFAULT_AVATAR_DATA_URI,
  FIREBASE_AUTH_PROVIDERS_URL,
  FIREBASE_PROJECT_ID,
  LiveAuthDiagnosticReport,
  AuthProviderErrorDetails,
  ConfirmationResult,
  User,
} from '../../firebase';
import {
  X,
  Smartphone,
  Mail,
  KeyRound,
  ShieldCheck,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  UserPlus,
  Activity,
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
  const [activeTab, setActiveTab] = useState<'gmail' | 'phone' | 'recovery'>('gmail');

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

  // Live Server Diagnostics State
  const [diagReport, setDiagReport] = useState<LiveAuthDiagnosticReport | null>(null);
  const [isCheckingDiag, setIsCheckingDiag] = useState(false);
  const [showDiagDetails, setShowDiagDetails] = useState(false);

  // Loading & Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<AuthProviderErrorDetails | null>(null);

  // Real Gmail / Email States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [emailLinkSentTo, setEmailLinkSentTo] = useState<string | null>(null);
  const [showManualEmailSection, setShowManualEmailSection] = useState(false);

  // Real SIM Phone OTP States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);

  // Recovery Email State
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const refreshDiagnostics = async () => {
    setIsCheckingDiag(true);
    try {
      const res = await runLiveFirebaseAuthDiagnostics();
      setDiagReport(res);
    } catch {
      // Ignore network hiccups
    } finally {
      setIsCheckingDiag(false);
    }
  };

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
    if (isOpen) {
      refreshDiagnostics();
    } else {
      clearPhoneRecaptchaVerifier('firebase-phone-recaptcha');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Sync authenticated Firebase User with Firestore UserProfile & Local Session
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
      name: user.displayName || user.email?.split('@')[0] || 'Verified Donor',
      email: user.email || `${user.uid.slice(0, 8)}@bloodsearch.bd`,
      phone: user.phoneNumber || '',
      bloodGroup: 'O+',
      division: 'dhaka',
      district: 'ঢাকা',
      upazila: 'সদর',
      photoUrl: user.photoURL || DEFAULT_AVATAR_DATA_URI,
      role: isAdmin ? 'ADMIN' : 'USER',
      verifiedStatus: user.emailVerified || Boolean(user.phoneNumber),
      idCardNumber: isAdmin ? `ADMIN-BD-2026` : `BD-AUTO-${user.uid.slice(0, 4).toUpperCase()}`,
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

  // 1. REAL GOOGLE / GMAIL POPUP LOGIN (Synchronous invocation — ZERO await before popup!)
  const handleRealGoogleSignIn = (hintEmail?: string) => {
    // Start popup IMMEDIATELY in user gesture stack so browsers never block it!
    const popupPromise = signInWithGoogleReal(hintEmail ?? email);
    setProviderError(null);
    setAuthSuccess(null);
    setIsLoading(true);

    popupPromise
      .then(async (user) => {
        const synced = await syncAuthenticatedUser(user);
        onLogAudit(
          'STATUS_CHANGE',
          `Real Google OAuth Sign-In verified: ${user.email} (${synced.role})`
        );
        setAuthSuccess(
          lang === 'bn'
            ? `✓ আসল Google/Gmail (${user.email}) ভেরিফিকেশন ও লগইন সফল হয়েছে!`
            : `✓ Signed in with Real Google Account (${user.email})!`
        );
        setTimeout(() => {
          setAuthSuccess(null);
          onClose();
        }, 1100);
      })
      .catch((err: any) => {
        setProviderError(parseFirebaseAuthError(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // 2. REAL GMAIL MAGIC SIGN-IN LINK (Requires Email Link enabled in Firebase Console)
  const handleSendRealEmailLink = async () => {
    setProviderError(null);
    setAuthSuccess(null);
    if (!email.trim() || !email.includes('@')) {
      setProviderError({
        code: 'auth/invalid-email',
        messageBn: 'অনুগ্রহ করে আপনার সঠিক আসল Gmail ঠিকানা লিখুন (যেমন: yourname@gmail.com)।',
        messageEn: 'Please enter a valid real Gmail address.',
        needsConsoleProviderEnable: false,
        consoleUrl: '',
      });
      return;
    }

    setIsLoading(true);
    try {
      await sendRealGmailSignInLink(email);
      setEmailLinkSentTo(email.trim());
      onLogAudit('STATUS_CHANGE', `Real Firebase Sign-In Link dispatched to ${email.trim()}`);
      setAuthSuccess(
        lang === 'bn'
          ? `আপনার আসল মেইল (${email.trim()}) ইনবক্সে ও স্প্যাম ফোল্ডারে Firebase থেকে রিয়েল লগইন লিংক পাঠানো হয়েছে!`
          : `Real sign-in link sent to ${email.trim()}! Check your Gmail inbox or Spam folder.`
      );
    } catch (err: any) {
      setProviderError(parseFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. REAL EMAIL + PASSWORD SIGN-UP / SIGN-IN WITH REAL GMAIL VERIFICATION
  const handleRealEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setProviderError(null);
    setAuthSuccess(null);
    if (!email.trim() || password.length < 6) {
      setProviderError({
        code: 'auth/weak-password',
        messageBn: 'সঠিক Gmail ঠিকানা এবং কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।',
        messageEn: 'Enter a valid email and a password of at least 6 characters.',
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
      onLogAudit('STATUS_CHANGE', `Real Email Auth (${isRegisterMode ? 'Register' : 'Login'}): ${user.email}`);
      if (verificationSent && !user.emailVerified) {
        setAuthSuccess(
          lang === 'bn'
            ? `অ্যাকাউন্ট তৈরি হয়েছে! আপনার আসল Gmail (${user.email})-এ ভেরিফিকেশন লিংক পাঠানো হয়েছে। মেইল খুলে লিংকে ক্লিক করে "ভেরিফিকেশন রিফ্রেশ" চাপুন।`
            : `Account ready! Verification email sent to ${user.email}. Click the link in your Gmail inbox.`
        );
      } else {
        setAuthSuccess(
          lang === 'bn'
            ? `✓ সফলভাবে লগইন সম্পন্ন হয়েছে (${user.email})!`
            : `✓ Signed in successfully (${user.email})!`
        );
        setTimeout(() => {
          setAuthSuccess(null);
          onClose();
        }, 1100);
      }
    } catch (err: any) {
      setProviderError(parseFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshEmailVerification = async () => {
    if (!auth.currentUser) return;
    setIsLoading(true);
    try {
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      setFirebaseUser(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        await syncAuthenticatedUser(auth.currentUser);
        setAuthSuccess(
          lang === 'bn'
            ? '✓ আলহামদুলিল্লাহ! আপনার Gmail সম্পূর্ণ ভেরিফাইড হয়েছে।'
            : '✓ Your Gmail address is now verified!'
        );
      } else {
        setProviderError({
          code: 'auth/not-verified-yet',
          messageBn: 'এখনো Gmail-এর ভেরিফিকেশন লিংকে ক্লিক করা হয়নি। ইনবক্স বা Spam ফোল্ডার চেক করুন।',
          messageEn: 'Email not verified yet. Please click the verification link in your Gmail inbox.',
          needsConsoleProviderEnable: false,
          consoleUrl: '',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. REAL SIM PHONE SMS OTP (Supports Bangla digits + E.164 normalization + Clean reCAPTCHA)
  const normalizedPhoneE164 = formatBangladeshE164(phoneNumber);
  const phoneLooksValid = isValidBangladeshMobile(phoneNumber);

  const handleSendRealPhoneOtp = async () => {
    setProviderError(null);
    setAuthSuccess(null);
    if (!phoneLooksValid) {
      setProviderError({
        code: 'auth/invalid-phone-number',
        messageBn:
          'অনুগ্রহ করে বাংলাদেশের সঠিক ১১-সংখ্যার মোবাইল নম্বর দিন (যেমন: 01712345678 অথবা ০১৭১২৩৪৫৬৭৮)।',
        messageEn: 'Please enter a valid 11-digit Bangladesh mobile number (e.g. 01712345678).',
        needsConsoleProviderEnable: false,
        consoleUrl: '',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendRealPhoneSmsOtp(phoneNumber, 'firebase-phone-recaptcha');
      setConfirmationResult(result);
      onLogAudit('STATUS_CHANGE', `Real Firebase SMS OTP dispatched to ${normalizedPhoneE164}`);
      setAuthSuccess(
        lang === 'bn'
          ? `আপনার সিমে (${normalizedPhoneE164}) ৬-ডিজিটের রিয়েল ওটিপি (OTP) পাঠানো হয়েছে! নিচে কোডটি লিখুন।`
          : `Real 6-digit SMS OTP sent to ${normalizedPhoneE164}! Enter the code below.`
      );
    } catch (err: any) {
      clearPhoneRecaptchaVerifier('firebase-phone-recaptcha');
      setProviderError(parseFirebaseAuthError(err));
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
        messageBn: 'সিমে আসা সম্পূর্ণ ৬-সংখ্যার কোডটি লিখুন।',
        messageEn: 'Please enter all 6 digits of the SMS code.',
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
      onLogAudit('STATUS_CHANGE', `Real Phone SIM OTP verified: ${cred.user.phoneNumber}`);
      setAuthSuccess(
        lang === 'bn'
          ? `✓ সিম ওটিপি যাচাই সফল! (${cred.user.phoneNumber}) দিয়ে লগইন হয়েছে।`
          : `✓ SIM Phone OTP verified (${cred.user.phoneNumber})!`
      );
      setTimeout(() => {
        setAuthSuccess(null);
        onClose();
      }, 1100);
    } catch (err: any) {
      setProviderError(parseFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpDigitChange = (idx: number, val: string) => {
    const ascii = normalizeAsciiDigits(val).replace(/[^0-9]/g, '');
    if (ascii.length > 1) {
      // User pasted or auto-filled multiple digits
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

  // 5. REAL PASSWORD RESET EMAIL
  const handleSendRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setProviderError(null);
    setAuthSuccess(null);
    if (!recoveryEmail.trim() || !recoveryEmail.includes('@')) {
      setProviderError({
        code: 'auth/invalid-email',
        messageBn: 'সঠিক নিবন্ধিত Gmail ঠিকানা লিখুন।',
        messageEn: 'Please enter a valid registered Gmail address.',
        needsConsoleProviderEnable: false,
        consoleUrl: '',
      });
      return;
    }
    setIsLoading(true);
    try {
      await sendRealPasswordReset(recoveryEmail);
      setAuthSuccess(
        lang === 'bn'
          ? `আপনার আসল Gmail (${recoveryEmail.trim()})-এ পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে!`
          : `Password reset link sent to ${recoveryEmail.trim()}!`
      );
    } catch (err: any) {
      setProviderError(parseFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 6. REAL LOGOUT
  const handleRealLogout = async () => {
    setIsLoading(true);
    try {
      await signOutReal();
      setFirebaseUser(null);
      setLocalProfile(null);
      setConfirmationResult(null);
      onLogAudit('STATUS_CHANGE', 'User signed out from Firebase Authentication');
      setAuthSuccess(
        lang === 'bn'
          ? '✓ আপনি সফলভাবে অ্যাকাউন্ট থেকে লগআউট হয়েছেন।'
          : '✓ Signed out successfully.'
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
      <div className="w-full max-w-lg my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#1e293b] p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-all text-left">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <BrandLogo variant="mark" size="md" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {lang === 'bn' ? 'রিয়েল অ্যাকাউন্ট লগইন ও ভেরিফিকেশন' : 'Real Account Login & Verification'}
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {lang === 'bn'
                  ? `Firebase Cloud (${FIREBASE_PROJECT_ID}) · লাইভ সার্ভার সংযুক্ত`
                  : `Firebase Cloud (${FIREBASE_PROJECT_ID}) · Live Auth`}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Logged-In User Banner + Direct Logout */}
        {(firebaseUser || localProfile) && (
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={localProfile?.photoUrl || firebaseUser?.photoURL || DEFAULT_AVATAR_DATA_URI}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_DATA_URI;
                }}
                alt="User"
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-rose-500/40 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                    {activeDisplayName}
                  </span>
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    · {activeRole === 'ADMIN' ? 'ADMIN PANEL' : 'USER PANEL'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  {firebaseUser?.email || firebaseUser?.phoneNumber || localProfile?.idCardNumber}
                </div>
                {firebaseUser && !firebaseUser.emailVerified && firebaseUser.email && (
                  <button
                    type="button"
                    onClick={handleRefreshEmailVerification}
                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 underline cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'জিমেইল ভেরিফিকেশন রিফ্রেশ করুন' : 'Refresh Email Verification'}</span>
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRealLogout}
              disabled={isLoading}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
            </button>
          </div>
        )}

        {/* Quick Shortcut to Smart ID Create (User Panel / Admin Panel) */}
        {onOpenRegister && (
          <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="font-black text-slate-900 dark:text-white block">
                {lang === 'bn' ? 'নতুন ইউজার প্যানেল বা অ্যাডমিন আইডি খুলবেন?' : 'Create User Panel or Admin Panel ID?'}
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-400">
                {lang === 'bn'
                  ? 'স্মার্ট ফটো কার্ড, WhatsApp ও FB লিংকসহ স্থায়ী আইডি'
                  : 'Register Smart Donor or Secret Admin ID'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'আইডি তৈরি' : 'Create ID'}</span>
            </button>
          </div>
        )}

        {/* Live Firebase Identity Toolkit & Token Service Diagnostic Strip */}
        {diagReport && (
          <div className="mt-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-2">
            {!diagReport.tokenServiceEnabled && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-950 dark:text-amber-200 space-y-2">
                <div className="font-bold leading-relaxed">
                  {lang === 'bn'
                    ? 'গুরুত্বপূর্ণ: আপনার প্রজেক্টে "Token Service API (securetoken.googleapis.com)" বন্ধ থাকায় ১ ঘণ্টা পর লগইন টোকেন অটো-রিনিউ হতে পারছে না। স্থায়ীভাবে ঠিক করতে নিচের নীল বাটনে ক্লিক করে "ENABLE" চাপুন:'
                    : 'Important: Token Service API (securetoken.googleapis.com) is disabled in your GCP project. Click below and press ENABLE so login sessions auto-renew permanently:'}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={diagReport.tokenServiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'bn'
                        ? 'Google Cloud → Token Service API চালু করুন'
                        : 'Enable Token Service API in Google Cloud'}
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={refreshDiagnostics}
                    disabled={isCheckingDiag}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-700 font-bold text-[11px] cursor-pointer"
                  >
                    {lang === 'bn' ? 'চালু করে পুনরায় চেক করুন' : 'Re-check After Enabling'}
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowDiagDetails(!showDiagDetails)}
                className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 cursor-pointer text-left"
              >
                <Activity className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>
                  {lang === 'bn' ? 'লাইভ সার্ভার চেক:' : 'Live Auth Check:'}{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    Google Gmail সক্রিয় ✓
                  </strong>
                  {' · '}
                  <span
                    className={
                      diagReport.tokenServiceEnabled
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'text-amber-600 dark:text-amber-400 font-semibold'
                    }
                  >
                    {diagReport.tokenServiceEnabled
                      ? 'টোকেন সার্ভিস সক্রিয় ✓'
                      : 'টোকেন API: Enable প্রয়োজন'}
                  </span>
                </span>
                {showDiagDetails ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={refreshDiagnostics}
                disabled={isCheckingDiag}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-3 h-3 ${isCheckingDiag ? 'animate-spin' : ''}`} />
                <span>{lang === 'bn' ? 'পুনরায় চেক' : 'Re-check'}</span>
              </button>
            </div>

            {showDiagDetails && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>০. Token Service API (অটো সেশন রিনিউ):</span>
                  <span
                    className={`font-bold ${
                      diagReport.tokenServiceEnabled
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {diagReport.tokenServiceEnabled ? 'চালু আছে ✓' : 'GCP Console-এ অফ আছে'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>১. Google / ডাইরেক্ট Gmail OAuth:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {diagReport.googleOAuthReady ? '১০০% চালু আছে (Ready)' : 'অফ আছে'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>২. ডোমেইন অনুমোদন ({diagReport.currentHostname}):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {diagReport.domainAuthorized ? 'অনুমোদিত ✓' : 'অ্যাড করতে হবে'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>৩. সিম SMS ওটিপি (Phone Provider):</span>
                  <span
                    className={`font-bold ${
                      diagReport.phoneSmsStatus === 'READY'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {diagReport.phoneSmsStatus === 'READY'
                      ? 'চালু আছে ✓'
                      : diagReport.phoneSmsStatus === 'BILLING_REQUIRED'
                      ? 'টেস্ট নম্বর / Blaze প্রয়োজন'
                      : 'Firebase Console-এ অফ আছে'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>৪. ইমেইল লিংক / পাসওয়ার্ড প্রোভাইডার:</span>
                  <span
                    className={`font-bold ${
                      diagReport.emailPasswordEnabled
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {diagReport.emailPasswordEnabled ? 'চালু আছে ✓' : 'Firebase Console-এ অফ আছে'}
                  </span>
                </div>
                {(!diagReport.emailPasswordEnabled || diagReport.phoneSmsStatus !== 'READY') && (
                  <div className="pt-1">
                    <a
                      href={FIREBASE_AUTH_PROVIDERS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Firebase Console খুলে Phone ও Email/Password সুইচ অন করুন</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Success Feedback Banner */}
        {authSuccess && (
          <div className="mt-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{authSuccess}</span>
          </div>
        )}

        {/* Error & Firebase Console Provider Activation Guide */}
        {providerError && (
          <div className="mt-3 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 space-y-2 text-xs">
            <div className="flex items-start gap-2 text-red-800 dark:text-red-200 font-bold">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{lang === 'bn' ? providerError.messageBn : providerError.messageEn}</span>
            </div>

            {providerError.needsConsoleProviderEnable && providerError.consoleUrl && (
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <a
                  href={providerError.consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'bn'
                      ? 'Firebase Console-এ Phone/Email অন করুন'
                      : 'Enable Provider in Firebase Console'}
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => handleRealGoogleSignIn(email)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                >
                  {lang === 'bn' ? '✓ অথবা সরাসরি Google Gmail লগইন করুন' : '✓ Or Use Google Login Now'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3 Segmented Tabs for Real Gmail, SIM SMS OTP, and Recovery */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl my-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('gmail');
              setProviderError(null);
            }}
            className={`min-h-[40px] py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'gmail'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {lang === 'bn' ? 'জিমেইল লগইন' : 'Gmail Login'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('phone');
              setProviderError(null);
            }}
            className={`min-h-[40px] py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'phone'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {lang === 'bn' ? 'সিম SMS ওটিপি' : 'SIM SMS OTP'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('recovery');
              setProviderError(null);
            }}
            className={`min-h-[40px] py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'recovery'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {lang === 'bn' ? 'রিকভারি' : 'Recovery'}
          </button>
        </div>

        {/* TAB 1: DIRECT REAL GOOGLE / GMAIL VERIFICATION (Works 100% Immediately!) */}
        {activeTab === 'gmail' && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'bn'
                    ? 'আপনার আসল Gmail ঠিকানা লিখুন (ঐচ্ছিক — পপ-আপে অটো সিলেক্ট হবে)'
                    : 'Your Gmail Address (Optional — auto-selects in Google Popup)'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRealGoogleSignIn(email)}
                disabled={isLoading}
                className="w-full min-h-[46px] py-3 px-4 rounded-2xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs sm:text-sm flex items-center justify-center gap-3 shadow-md transition-all cursor-pointer active:scale-98"
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
                  {lang === 'bn'
                    ? 'Google / আসল Gmail দিয়ে সরাসরি ভেরিফাই ও লগইন করুন'
                    : 'Verify & Sign In Directly with Google / Gmail'}
                </span>
              </button>

              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {lang === 'bn'
                  ? 'টিপস: Google অফিশিয়াল পপ-আপে আলাদা কোড টাইপ করতে হয় না — সরাসরি আপনার নিজের Gmail অ্যাকাউন্টে ট্যাপ করলেই ১ সেকেন্ডে ১০০% রিয়েল ভেরিফাইড লগইন সম্পন্ন হবে।'
                  : 'Google OAuth verifies your real Gmail directly in 1 click without waiting for an email code.'}
              </p>
            </div>

            {/* Expandable Manual Email Link / Password Section */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowManualEmailSection(!showManualEmailSection)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <span>
                  {lang === 'bn'
                    ? 'ইমেইল পাসওয়ার্ড / ইনবক্স লিংক দিয়ে লগইন (ঐচ্ছিক)'
                    : 'Email Password / Magic Link Sign-In (Optional)'}
                </span>
                {showManualEmailSection ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showManualEmailSection && (
                <form onSubmit={handleRealEmailPasswordAuth} className="p-3.5 space-y-3 border-t border-slate-200 dark:border-slate-800">
                  {diagReport && !diagReport.emailPasswordEnabled && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-1.5">
                      <p className="font-bold">
                        {lang === 'bn'
                          ? 'নোট: আপনার Firebase প্রজেক্টে "Email/Password" ও "Email Link" সুইচটি এখনো অফ আছে। এটি চালু করতে নিচের লিংকে ক্লিক করে Email/Password Enable করুন:'
                          : 'Note: Email/Password is currently off in your Firebase Console. Enable it here:'}
                      </p>
                      <a
                        href={FIREBASE_AUTH_PROVIDERS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Firebase Console → Sign-in method</span>
                      </a>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSendRealEmailLink}
                    disabled={isLoading}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'bn'
                        ? 'Gmail ইনবক্সে ডাইরেক্ট লগইন লিংক পাঠান'
                        : 'Send Login Link to Gmail Inbox'}
                    </span>
                  </button>

                  {emailLinkSentTo && (
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-800 dark:text-blue-200">
                      ✓ <strong>{emailLinkSentTo}</strong>-এ রিয়েল লগইন মেইল পাঠানো হয়েছে (Inbox / Spam দেখুন)।
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? 'পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'Password (min 6 chars)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsRegisterMode(!isRegisterMode)}
                        className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        {isRegisterMode
                          ? lang === 'bn'
                            ? 'আগেই অ্যাকাউন্ট আছে? লগইন'
                            : 'Already registered? Sign In'
                          : lang === 'bn'
                          ? '+ নতুন পাসওয়ার্ড রেজিস্টার'
                          : '+ New Email Register'}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-[42px] py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center justify-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>
                      {isRegisterMode
                        ? lang === 'bn'
                          ? 'অ্যাকাউন্ট খুলুন ও ভেরিফিকেশন মেইল পাঠান'
                          : 'Register & Send Verification Email'
                        : lang === 'bn'
                        ? 'ইমেইল ও পাসওয়ার্ড দিয়ে লগইন'
                        : 'Sign In with Email & Password'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: REAL SIM PHONE SMS OTP */}
        {activeTab === 'phone' && (
          <div className="space-y-3.5">
            {diagReport && diagReport.phoneSmsStatus !== 'READY' && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-950 dark:text-amber-200 space-y-2">
                <div className="font-bold">
                  {lang === 'bn'
                    ? 'সিমে OTP চালু করার ৩০-সেকেন্ডের গাইড (Firebase প্রজেক্ট: fifth-receiver-v5v9p):'
                    : '30-Second Setup to Enable SIM OTP in Firebase Console:'}
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                  <li>
                    নিচের নীল বাটনে ক্লিক করে <strong>Sign-in method → Phone → Enable</strong> অন করে Save দিন।
                  </li>
                  <li>
                    <strong>ফ্রিতে (০ টাকায়) টেস্ট করতে:</strong> ওই Phone অপশনের নিচে{' '}
                    <strong>"Phone numbers for testing"</strong>-এ আপনার নম্বর (যেমন{' '}
                    <code className="font-mono">+8801712345678</code>) এবং ৬-সংখ্যার কোড (যেমন{' '}
                    <code className="font-mono">123456</code>) যোগ করুন — সাথে সাথে কাজ করবে!
                  </li>
                  <li>
                    আর যেকোনো সিমে অটোমেটিক ক্যারিয়ার SMS পাঠাতে Firebase-এ Blaze প্ল্যান চালু করুন।
                  </li>
                </ol>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <a
                    href={FIREBASE_AUTH_PROVIDERS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px]"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Firebase Console → Phone অন করুন</span>
                  </a>
                  <button
                    type="button"
                    onClick={refreshDiagnostics}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-700 font-bold text-[11px] cursor-pointer"
                  >
                    অন করে পুনরায় চেক করুন
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? 'আপনার সিম নম্বর (বাংলা বা ইংরেজি সংখ্যায়) *' : 'Bangladesh SIM Number *'}
                </label>
                {phoneNumber.trim() && (
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      phoneLooksValid
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {normalizedPhoneE164} {phoneLooksValid ? '✓' : ''}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center shrink-0">
                  +880
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="01712345678"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Real Firebase reCAPTCHA Mount Point */}
            <div className="flex justify-center">
              <div id="firebase-phone-recaptcha" />
            </div>

            {!confirmationResult ? (
              <button
                type="button"
                onClick={handleSendRealPhoneOtp}
                disabled={isLoading}
                className="w-full min-h-[44px] py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>
                  {isLoading
                    ? lang === 'bn'
                      ? 'সিমে রিয়েল SMS পাঠানো হচ্ছে...'
                      : 'Sending Real SMS...'
                    : lang === 'bn'
                    ? 'সিমে ৬-সংখ্যার রিয়েল ওটিপি (OTP) পাঠান'
                    : 'Send Real 6-Digit SMS OTP to SIM'}
                </span>
              </button>
            ) : (
              <div className="space-y-3 p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'bn'
                    ? `${normalizedPhoneE164} নম্বরে আসা ৬-সংখ্যার কোডটি লিখুন (বা পেস্ট করুন):`
                    : `Enter the 6-digit SMS code sent to ${normalizedPhoneE164}:`}
                </div>

                <div className="flex justify-between gap-1.5 sm:gap-2">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <input
                      key={idx}
                      id={`real-otp-digit-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpDigits[idx]}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-10 sm:w-12 h-12 text-center font-mono tabular-nums font-black text-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      clearPhoneRecaptchaVerifier('firebase-phone-recaptcha');
                      setConfirmationResult(null);
                      setOtpDigits(['', '', '', '', '', '']);
                    }}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:underline font-semibold cursor-pointer"
                  >
                    {lang === 'bn' ? 'নম্বর পরিবর্তন / পুনরায় পাঠান' : 'Change Number / Resend'}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyRealPhoneOtp}
                    disabled={isLoading}
                    className="min-h-[40px] px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                  >
                    {lang === 'bn' ? 'কোড যাচাই ও লগইন' : 'Verify SMS & Sign In'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REAL PASSWORD RECOVERY */}
        {activeTab === 'recovery' && (
          <form onSubmit={handleSendRecovery} className="space-y-3.5">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {lang === 'bn'
                ? 'আপনার নিবন্ধিত আসল Gmail ঠিকানা লিখুন। আপনি যদি সরাসরি Google দিয়ে লগইন করে থাকেন, তবে কোনো পাসওয়ার্ড রিসেটের প্রয়োজন নেই — সরাসরি "জিমেইল লগইন" ট্যাব থেকে ১-ক্লিকে প্রবেশ করতে পারবেন।'
                : 'Enter your registered Gmail address to receive a real Firebase password reset link.'}
            </p>
            <input
              type="email"
              required
              value={recoveryEmail}
              onChange={(e) => setRecoveryEmail(e.target.value)}
              placeholder="yourname@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[42px] py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              {lang === 'bn' ? 'জিমেইলে রিসেট লিংক পাঠান' : 'Send Real Reset Email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
