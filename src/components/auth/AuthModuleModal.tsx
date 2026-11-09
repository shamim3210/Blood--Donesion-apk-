import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Language, UserAccount } from '../../types';
import { BrandLogo } from '../BrandLogo';
import { isFakePersonName } from '../../data/mockDonors';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogleReal,
  signInWithGoogleIdToken,
  GOOGLE_OAUTH_CLIENT_ID,
  registerOrLoginRealEmailPassword,
  sendRealPasswordReset,
  signOutReal,
  parseFirebaseAuthError,
  fetchUserProfileFromFirestore,
  checkIsVerifiedAdminInFirestore,
  clearDevOtpSandboxSession,
  AuthProviderErrorDetails,
  User,
} from '../../services/bloodSearchService';
import {
  X,
  Mail,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  UserPlus,
  User as UserIcon,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface AuthModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLogAudit: (action: any, details: string) => void;
  onOpenRegister?: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (cfg: {
            client_id: string;
            callback: (resp: { credential?: string }) => void;
            ux_mode?: 'popup' | 'redirect';
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              width?: number;
              text?: 'signin_with' | 'continue_with';
              shape?: 'rectangular' | 'pill';
            }
          ) => void;
        };
      };
    };
  }
}

export const AuthModuleModal: React.FC<AuthModuleModalProps> = ({
  isOpen,
  onClose,
  lang,
  onLogAudit,
  onOpenRegister,
}) => {
  const gsiButtonRef = useRef<HTMLDivElement | null>(null);
  const [gsiReady, setGsiReady] = useState(false);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [localProfile, setLocalProfile] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('bloodsearch_current_user');
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed && isFakePersonName(parsed.name)) return null;
      if (parsed && (!parsed.phone || parsed.phone === '01700000000')) return null;
      return parsed;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<AuthProviderErrorDetails | null>(null);

  // Clean Email & Password states (Sign In / Create Account / Forgot Password)
  const [authMode, setAuthMode] = useState<'SIGN_IN' | 'SIGN_UP' | 'RESET'>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isOwnerEmail = email.trim().toLowerCase() === 'shamimrakib015@gmail.com';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (u && u.email && !email) {
        setEmail(u.email);
      }
      if (!u) {
        setLocalProfile(null);
      }
    });
    const handleLocalSync = () => {
      try {
        const saved = localStorage.getItem('bloodsearch_current_user');
        const parsed = saved ? JSON.parse(saved) : null;
        if (
          parsed &&
          !isFakePersonName(parsed.name) &&
          parsed.phone &&
          parsed.phone !== '01700000000'
        ) {
          setLocalProfile(parsed);
        } else {
          setLocalProfile(null);
        }
      } catch {}
    };
    window.addEventListener('bloodsearch_user_changed', handleLocalSync);
    return () => {
      unsub();
      window.removeEventListener('bloodsearch_user_changed', handleLocalSync);
    };
  }, [email]);

  const finishUserSignIn = useCallback(
    async (user: User, sourceLabel: string) => {
      await clearDevOtpSandboxSession().catch(() => {});

      let savedProfile: UserAccount | null = null;
      try {
        const fetched = await fetchUserProfileFromFirestore(user.uid);
        if (
          fetched &&
          !isFakePersonName(fetched.name) &&
          fetched.phone &&
          fetched.phone !== '01700000000' &&
          fetched.phone !== '01711000000'
        ) {
          savedProfile = fetched;
        }
      } catch {
        savedProfile = null;
      }

      if (savedProfile) {
        const isAdmin =
          user.email === 'shamimrakib015@gmail.com' || (user as any).role === 'SUPER_ADMIN'
            ? true
            : await checkIsVerifiedAdminInFirestore(user).catch(() => false);
        if (isAdmin) savedProfile.role = 'ADMIN';
        savedProfile.authSource = 'NEON_OIDC';
        localStorage.setItem('bloodsearch_current_user', JSON.stringify(savedProfile));
        setLocalProfile(savedProfile);
        window.dispatchEvent(new Event('bloodsearch_user_changed'));
        onLogAudit('STATUS_CHANGE', `${sourceLabel}: ${user.email || user.uid} (profile loaded)`);
        setAuthSuccess(
          lang === 'bn'
            ? `✓ সফলভাবে সাইন ইন হয়েছে (${savedProfile.name})`
            : `✓ Signed in successfully (${savedProfile.name})`
        );
        window.setTimeout(() => {
          setAuthSuccess(null);
          onClose();
        }, 500);
      } else {
        const isSuperAdmin =
          user.email === 'shamimrakib015@gmail.com' || (user as any).role === 'SUPER_ADMIN';
        const basicAccount: UserAccount = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          phone: '',
          bloodGroup: 'O+',
          division: 'dhaka',
          district: 'dhaka',
          upazila: 'Dhaka',
          age: 25,
          gender: 'MALE',
          weightKg: 60,
          role: isSuperAdmin ? 'ADMIN' : 'USER',
          verifiedStatus: true,
          idCardNumber: `BS-${user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || '1001'}`,
          availableToDonate: false,
          totalDonations: 0,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('bloodsearch_current_user', JSON.stringify(basicAccount));
        setLocalProfile(basicAccount);
        window.dispatchEvent(new Event('bloodsearch_user_changed'));
        onLogAudit(
          'STATUS_CHANGE',
          `${sourceLabel}: ${user.email || user.uid} (signed in - ready to fill donor profile)`
        );
        setAuthSuccess(
          lang === 'bn'
            ? '✓ অ্যাকাউন্ট সফলভাবে প্রস্তুত হয়েছে! এবার প্রোফাইল তথ্য দিন।'
            : '✓ Account ready! Completing profile setup...'
        );
        window.setTimeout(() => {
          setAuthSuccess(null);
          onClose();
          if (onOpenRegister) {
            onOpenRegister();
          }
        }, 500);
      }
    },
    [lang, onClose, onLogAudit, onOpenRegister]
  );

  // Mount embedded Google Identity Services button if available
  useEffect(() => {
    if (!isOpen || !GOOGLE_OAUTH_CLIENT_ID || firebaseUser) return;
    let cancelled = false;

    const mountGsi = () => {
      if (cancelled || !window.google?.accounts?.id || !gsiButtonRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_OAUTH_CLIENT_ID,
          ux_mode: 'popup',
          cancel_on_tap_outside: false,
          callback: async (resp) => {
            if (!resp?.credential) return;
            setProviderError(null);
            setAuthSuccess(null);
            setIsLoading(true);
            try {
              const user = await signInWithGoogleIdToken(resp.credential);
              await finishUserSignIn(user, 'Gmail Sign-In');
            } catch (err: any) {
              setProviderError(parseFirebaseAuthError(err));
            } finally {
              setIsLoading(false);
            }
          },
        });
        gsiButtonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(gsiButtonRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: 320,
        });
        setGsiReady(true);
      } catch {
        setGsiReady(false);
      }
    };

    if (window.google?.accounts?.id) {
      mountGsi();
    } else {
      const existingScript = document.getElementById(
        'google-gsi-client-script'
      ) as HTMLScriptElement | null;
      if (existingScript) {
        existingScript.addEventListener('load', mountGsi);
        return () => {
          cancelled = true;
          existingScript.removeEventListener('load', mountGsi);
        };
      }
      const script = document.createElement('script');
      script.id = 'google-gsi-client-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = mountGsi;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, [isOpen, firebaseUser, finishUserSignIn]);

  if (!isOpen) return null;

  const handleGoogleSignInClick = async () => {
    setProviderError(null);
    setAuthSuccess(null);
    setIsLoading(true);
    const candidateEmail = email.trim();
    try {
      const user = await signInWithGoogleReal(candidateEmail || undefined);
      await finishUserSignIn(user, 'Google Sign-In');
    } catch (err: any) {
      setProviderError(parseFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCreateAccountFromError = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || password.length < 6) return;
    setAuthMode('SIGN_UP');
    setProviderError(null);
    setIsLoading(true);
    try {
      const res = await registerOrLoginRealEmailPassword(cleanEmail, password, true);
      await finishUserSignIn(res.user, 'Email Account Created');
    } catch (err: any) {
      setProviderError(parseFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProviderError(null);
    setAuthSuccess(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setProviderError({
        code: 'auth/invalid-email',
        messageEn: 'Please enter a valid email address.',
        messageBn: 'অনুগ্রহ করে সঠিক ইমেইল ঠিকানা লিখুন।',
        needsConsoleProviderEnable: false,
        consoleUrl: '',
      });
      return;
    }

    if (authMode === 'RESET') {
      setIsLoading(true);
      try {
        await sendRealPasswordReset(cleanEmail);
        setAuthSuccess(
          lang === 'bn'
            ? `✓ পাসওয়ার্ড রিসেট লিংক ${cleanEmail}-এ পাঠানো হয়েছে।`
            : `✓ Password reset link sent to ${cleanEmail}.`
        );
        setAuthMode('SIGN_IN');
      } catch (err: any) {
        setProviderError(parseFirebaseAuthError(err));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const minPassLen = cleanEmail === 'shamimrakib015@gmail.com' ? 4 : 6;
    if (password.length < minPassLen) {
      setProviderError({
        code: 'auth/weak-password',
        messageEn: `Password must be at least ${minPassLen} characters.`,
        messageBn: `পাসওয়ার্ড কমপক্ষে ${minPassLen} অক্ষরের হতে হবে।`,
        needsConsoleProviderEnable: false,
        consoleUrl: '',
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerOrLoginRealEmailPassword(
        cleanEmail,
        password,
        authMode === 'SIGN_UP'
      );
      await finishUserSignIn(
        res.user,
        authMode === 'SIGN_UP' ? 'Email Account Created' : 'Email Sign-In'
      );
    } catch (err: any) {
      setProviderError(parseFirebaseAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOutClick = async () => {
    setIsLoading(true);
    try {
      await clearDevOtpSandboxSession().catch(() => {});
      localStorage.removeItem('bloodsearch_current_user');
      localStorage.removeItem('bloodsearch_pending_profile_draft');
      await signOutReal();
      setLocalProfile(null);
      window.dispatchEvent(new Event('bloodsearch_user_changed'));
      setAuthSuccess(lang === 'bn' ? '✓ সাইন আউট সম্পন্ন হয়েছে।' : '✓ Signed out cleanly.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto modal-scroll-contain animate-in fade-in duration-200">
      <div className="w-full max-w-md my-auto rounded-3xl bg-white dark:bg-[#0c1424] border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-slate-950/30 overflow-hidden text-left transition-all">
        {/* Sleek Modern Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-b from-rose-50/50 dark:from-rose-950/20 to-transparent">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-600/20 shrink-0 ring-4 ring-rose-500/10">
                <BrandLogo variant="mark" size="sm" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {firebaseUser
                    ? lang === 'bn'
                      ? 'আপনার অ্যাকাউন্ট'
                      : 'Your Account'
                    : authMode === 'SIGN_UP'
                      ? lang === 'bn'
                        ? 'নতুন অ্যাকাউন্ট খুলুন'
                        : 'Create an Account'
                      : authMode === 'RESET'
                        ? lang === 'bn'
                          ? 'পাসওয়ার্ড পুনরুদ্ধার'
                          : 'Reset Password'
                        : lang === 'bn'
                          ? 'সহজ সাইন ইন'
                          : 'Sign In'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {lang === 'bn'
                    ? 'Google বা ইমেইল দিয়ে সহজে প্রবেশ করুন'
                    : 'Instant access with Google or Email'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {authSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          {providerError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs font-medium space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {lang === 'bn' ? providerError.messageBn : providerError.messageEn}
                </span>
              </div>
              {providerError.canQuickRegister && email && password.length >= 6 && (
                <div className="pt-2.5 border-t border-rose-200/60 dark:border-rose-800/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-600 dark:text-rose-300">
                    {lang === 'bn'
                      ? 'নতুন অ্যাকাউন্ট খুলতে চান?'
                      : 'Create account with these credentials?'}
                  </span>
                  <button
                    type="button"
                    onClick={handleQuickCreateAccountFromError}
                    disabled={isLoading}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs whitespace-nowrap transition-colors"
                  >
                    {lang === 'bn' ? '✓ অ্যাকাউন্ট তৈরি করুন' : '✓ Create Account'}
                  </button>
                </div>
              )}
            </div>
          )}

          {firebaseUser ? (
            /* Signed-in user view */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  {localProfile?.name ? (
                    localProfile.name.charAt(0).toUpperCase()
                  ) : (
                    <UserIcon className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {localProfile?.name ||
                        (lang === 'bn'
                          ? 'প্রোফাইল এখনো সম্পন্ন হয়নি'
                          : 'Profile not set yet')}
                    </span>
                    {((firebaseUser as any).role === 'SUPER_ADMIN' ||
                      firebaseUser.email === 'shamimrakib015@gmail.com') && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900/60 px-2 py-0.5 rounded-full">
                        <ShieldCheck className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                    {firebaseUser.email}
                  </div>
                  {localProfile?.bloodGroup && (
                    <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 font-bold">
                        {localProfile.bloodGroup}
                      </span>
                      <span>·</span>
                      <span>{localProfile.district}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenRegister) onOpenRegister();
                  }}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.99]"
                >
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span>
                    {localProfile
                      ? lang === 'bn'
                        ? 'প্রোফাইল এডিট করুন'
                        : 'Edit Profile'
                      : lang === 'bn'
                        ? 'প্রোফাইল সাজান'
                        : 'Set Up Profile'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSignOutClick}
                  disabled={isLoading}
                  className="min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/30 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/50 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>{lang === 'bn' ? 'সাইন আউট' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Clean Modern Login Form */
            <div className="space-y-4">
              {/* 1. Authentic Google Sign-In Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGoogleSignInClick}
                  disabled={isLoading}
                  className="w-full min-h-[48px] px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300/80 dark:border-slate-700 shadow-xs hover:shadow font-semibold text-sm flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-[0.99]"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-500 shrink-0" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"
                      />
                    </svg>
                  )}
                  <span>
                    {lang === 'bn'
                      ? 'Google দিয়ে সরাসরি সাইন ইন'
                      : 'Continue with Google'}
                  </span>
                </button>

                <div
                  ref={gsiButtonRef}
                  className={`flex justify-center ${gsiReady ? 'pt-1.5' : 'hidden'}`}
                />
              </div>

              {/* Minimal Elegant Divider */}
              <div className="flex items-center gap-3 pt-1">
                <div className="h-px flex-1 bg-slate-200/80 dark:bg-slate-800" />
                <span className="text-[11px] font-medium tracking-wider uppercase text-slate-400 dark:text-slate-500">
                  {lang === 'bn' ? 'অথবা ইমেইল' : 'or with email'}
                </span>
                <div className="h-px flex-1 bg-slate-200/80 dark:bg-slate-800" />
              </div>

              {/* Refined Segmented Control */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('SIGN_IN');
                    setProviderError(null);
                  }}
                  className={`min-h-[36px] rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    authMode === 'SIGN_IN'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'সাইন ইন' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('SIGN_UP');
                    setProviderError(null);
                  }}
                  className={`min-h-[36px] rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    authMode === 'SIGN_UP'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? 'নতুন অ্যাকাউন্ট' : 'Create Account'}
                </button>
              </div>

              {/* Clean Email & Password Form */}
              <form onSubmit={handleEmailAuthSubmit} className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="auth-modal-email"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {lang === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                    </label>
                    {isOwnerEmail && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Super Admin
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      id="auth-modal-email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      className="w-full h-11 pl-10 pr-3.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {authMode !== 'RESET' && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="auth-modal-password"
                        className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                      >
                        {lang === 'bn'
                          ? `পাসওয়ার্ড (${isOwnerEmail ? '৪+' : '৬+'} অক্ষর)`
                          : `Password (${isOwnerEmail ? 'min 4' : 'min 6'} chars)`}
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('RESET');
                          setProviderError(null);
                        }}
                        className="text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        id="auth-modal-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={isOwnerEmail ? 4 : 6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 pl-10 pr-10 text-sm rounded-xl bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300/80 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 transition-all placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition-colors"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[46px] mt-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-rose-600 via-rose-700 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    {authMode === 'RESET'
                      ? lang === 'bn'
                        ? 'পাসওয়ার্ড রিসেট লিংক পাঠান'
                        : 'Send Password Reset Link'
                      : authMode === 'SIGN_UP'
                        ? lang === 'bn'
                          ? 'অ্যাকাউন্ট তৈরি করুন'
                          : 'Create Account'
                        : lang === 'bn'
                          ? 'সাইন ইন করুন'
                          : 'Sign In Now'}
                  </span>
                </button>

                {authMode === 'RESET' && (
                  <button
                    type="button"
                    onClick={() => setAuthMode('SIGN_IN')}
                    className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white py-1 cursor-pointer transition-colors"
                  >
                    {lang === 'bn' ? '← সাইন ইন পেজে ফিরে যান' : '← Back to Sign In'}
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
