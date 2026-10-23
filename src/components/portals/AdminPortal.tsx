import React, { useState, useEffect } from 'react';
import { Donor, BloodRequest, AuditLogEntry, BloodGroup, Language } from '../../types';
import { ALL_BLOOD_GROUPS } from '../../data/compatibility';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogleReal,
  signOutReal,
  computeAdminProofHashSync,
  grantAdminAccessWithInviteCode,
  parseFirebaseAuthError,
  checkIsVerifiedAdminInFirestore,
  isBootstrappedAdminUser,
  subscribeBloodStock,
  adminUpdateBloodStockInFirestore,
  adminToggleDonorVerifiedInFirestore,
  adminDeleteDonorInFirestore,
  adminMarkRequestFulfilledInFirestore,
  adminDeleteRequestInFirestore,
  subscribeOwnerAdminInviteLocks,
  ownerCreateAdminInviteLock,
  ownerToggleAdminInviteLock,
  ownerDeleteAdminInviteLock,
  subscribeAllRegisteredAdminsForOwner,
  ownerRevokeAdminAccess,
  AdminInviteLockItem,
  RegisteredAdminItem,
  BOOTSTRAPPED_SUPER_ADMIN_EMAIL,
  FIREBASE_SETTINGS_URL,
  FIREBASE_RULES_CONSOLE_URL,
  GCP_API_CREDENTIALS_URL,
  User,
} from '../../firebase';
import { getSecurityDiagnostics } from '../../utils/securityShield';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  Minus,
  LogOut,
  Search,
  Hospital,
  UserPlus,
  Eye,
  EyeOff,
  ExternalLink,
  Smartphone,
  ShieldAlert,
} from 'lucide-react';

interface AdminPortalProps {
  lang: Language;
  donors: Donor[];
  setDonors: React.Dispatch<React.SetStateAction<Donor[]>>;
  requests: BloodRequest[];
  setRequests: React.Dispatch<React.SetStateAction<BloodRequest[]>>;
  auditLogs: AuditLogEntry[];
  onLogAudit: (action: any, details: string) => void;
  onExitAdmin: () => void;
  onOpenRegisterWithRole?: (role: 'USER' | 'ADMIN') => void;
  onOpenApkGuide?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  lang,
  donors,
  setDonors,
  requests,
  setRequests,
  auditLogs,
  onLogAudit,
  onExitAdmin,
  onOpenRegisterWithRole,
  onOpenApkGuide,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isPanelLockedBySession, setIsPanelLockedBySession] = useState<boolean>(false);

  const [adminPinInput, setAdminPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isUnlockingCode, setIsUnlockingCode] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  const [confirmDeleteDonorId, setConfirmDeleteDonorId] = useState<string | null>(null);
  const [confirmDeleteReqId, setConfirmDeleteReqId] = useState<string | null>(null);
  const [confirmRevokeAdminUid, setConfirmRevokeAdminUid] = useState<string | null>(null);

  const [adminTab, setAdminTab] = useState<'donors' | 'sos' | 'inventory' | 'vault' | 'audit'>(
    'donors'
  );
  const [searchDonorQuery, setSearchDonorQuery] = useState('');

  // Owner Security Vault states (exclusively for shamimrakib015@gmail.com)
  const [inviteLocks, setInviteLocks] = useState<AdminInviteLockItem[]>([]);
  const [registeredAdmins, setRegisteredAdmins] = useState<RegisteredAdminItem[]>([]);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [newInviteLabel, setNewInviteLabel] = useState('');
  const [isCreatingLock, setIsCreatingLock] = useState(false);

  const [bloodStock, setBloodStock] = useState<Record<BloodGroup, number>>({
    'A+': 34,
    'A-': 8,
    'B+': 42,
    'B-': 6,
    'AB+': 18,
    'AB-': 3,
    'O+': 56,
    'O-': 5,
  });

  const isSuperOwner = isBootstrappedAdminUser(firebaseUser);
  const secDiag = getSecurityDiagnostics();

  // Zero-Trust Cloud Verification: NEVER trust sessionStorage or local flags
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        const verifiedAdmin = await checkIsVerifiedAdminInFirestore(u);
        setIsAdminAuthenticated(verifiedAdmin && !isPanelLockedBySession);
      } else {
        setIsAdminAuthenticated(false);
      }
      setIsCheckingAuth(false);
    });
    return () => unsub();
  }, [isPanelLockedBySession]);

  // Subscribe to real-time Blood Stock from Cloud Firestore
  useEffect(() => {
    let unsub: (() => void) | null = null;
    try {
      unsub = subscribeBloodStock((updates) => {
        if (Object.keys(updates).length > 0) {
          setBloodStock((prev) => ({ ...prev, ...(updates as Record<BloodGroup, number>) }));
        }
      });
    } catch {}
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Subscribe to Owner-Exclusive Invite Vault & Admin Roster when signed in as Super Owner
  useEffect(() => {
    if (!firebaseUser || !isBootstrappedAdminUser(firebaseUser)) {
      setInviteLocks([]);
      setRegisteredAdmins([]);
      return;
    }
    let unsubLocks: (() => void) | null = null;
    let unsubAdmins: (() => void) | null = null;
    try {
      unsubLocks = subscribeOwnerAdminInviteLocks(setInviteLocks);
      unsubAdmins = subscribeAllRegisteredAdminsForOwner(setRegisteredAdmins);
    } catch {}
    return () => {
      if (unsubLocks) unsubLocks();
      if (unsubAdmins) unsubAdmins();
    };
  }, [firebaseUser]);

  const showTempToast = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 2800);
  };

  const handleAdminGoogleSignIn = () => {
    const popupPromise = signInWithGoogleReal();
    setPinError(null);
    setIsPanelLockedBySession(false);
    popupPromise
      .then(async (u) => {
        setFirebaseUser(u);
        const verifiedAdmin = await checkIsVerifiedAdminInFirestore(u);
        if (verifiedAdmin) {
          setIsAdminAuthenticated(true);
          onLogAudit('STATUS_CHANGE', `Verified Admin signed in via Google: ${u.email}`);
        } else {
          setPinError(
            lang === 'bn'
              ? `আপনার Gmail (${u.email}) অ্যাডমিন তালিকায় নেই। শুধুমাত্র সুপার ওনার (${BOOTSTRAPPED_SUPER_ADMIN_EMAIL}) সরাসরি প্রবেশ করতে পারবেন, অথবা ওনারের দেওয়া সক্রিয় ইনভাইট কোড নিচে দিন।`
              : `Your Gmail (${u.email}) is not authorized as Admin. Only the Super Owner or holders of an active Owner Invite Code may enter.`
          );
        }
      })
      .catch((err: any) => {
        const parsed = parseFirebaseAuthError(err);
        setPinError(lang === 'bn' ? parsed.messageBn : parsed.messageEn);
      });
  };

  const handleAdminSecretUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setIsPanelLockedBySession(false);

    // Synchronous format check before any popup
    const syncCheck = computeAdminProofHashSync(adminPinInput);
    if (!syncCheck.wellFormed && !isBootstrappedAdminUser(auth.currentUser)) {
      setPinError(
        lang === 'bn'
          ? 'ভুল কোড! শুধুমাত্র অ্যাপ ওনারের তৈরি করা কমপক্ষে ৬ অক্ষরের সক্রিয় ইনভাইট কোড কাজ করবে।'
          : 'Invalid Code! Only an active Owner-issued Invite Code (min 6 chars) is accepted.'
      );
      return;
    }

    // Start Google popup synchronously if not signed in yet
    let pendingAuth: Promise<User> | null = null;
    if (!auth.currentUser) {
      pendingAuth = signInWithGoogleReal();
    }

    setIsUnlockingCode(true);
    try {
      let activeUser = auth.currentUser;
      if (pendingAuth) {
        activeUser = await pendingAuth;
        setFirebaseUser(activeUser);
      }
      if (!activeUser) {
        setIsUnlockingCode(false);
        return;
      }

      const granted = await grantAdminAccessWithInviteCode(adminPinInput);
      if (granted) {
        setIsAdminAuthenticated(true);
        setAdminPinInput('');
        onLogAudit('STATUS_CHANGE', `Admin Panel unlocked via verified Cloud Invite Lock (${activeUser.email || activeUser.uid})`);
      } else {
        setPinError(
          lang === 'bn'
            ? 'প্রবেশ প্রত্যাখ্যাত! এই কোডটি বৈধ নয় বা ওনার লক করে রেখেছেন। অ্যাডমিন প্যানেল সম্পূর্ণ ওনার-সুরক্ষিত।'
            : 'Access Denied! This code is invalid or locked by the App Owner.'
        );
      }
    } catch (err: any) {
      const parsed = parseFirebaseAuthError(err);
      setPinError(lang === 'bn' ? parsed.messageBn : parsed.messageEn);
    } finally {
      setIsUnlockingCode(false);
    }
  };

  const handleAdminLock = () => {
    setIsPanelLockedBySession(true);
    setIsAdminAuthenticated(false);
    setAdminPinInput('');
    onLogAudit('STATUS_CHANGE', 'Admin Panel locked');
  };

  const handleCreateInviteLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperOwner) return;
    setIsCreatingLock(true);
    try {
      await ownerCreateAdminInviteLock(
        newInviteCode,
        newInviteLabel.trim() || 'জেলা কো-অর্ডিনেটর ইনভাইট'
      );
      setNewInviteCode('');
      setNewInviteLabel('');
      showTempToast(
        lang === 'bn'
          ? '✓ নতুন গোপন অ্যাডমিন ইনভাইট কোড ক্লাউড ভল্টে সংরক্ষিত হয়েছে!'
          : '✓ New Admin Invite Code saved to Cloud Vault!'
      );
    } catch (err: any) {
      showTempToast(err?.message || 'কোড তৈরিতে সমস্যা হয়েছে');
    } finally {
      setIsCreatingLock(false);
    }
  };

  const handleRevokeAdmin = async (targetUid: string, targetName: string) => {
    if (!isSuperOwner) return;
    try {
      await ownerRevokeAdminAccess(targetUid);
      setConfirmRevokeAdminUid(null);
      onLogAudit('STATUS_CHANGE', `Super Owner revoked admin access for ${targetName} (${targetUid})`);
      showTempToast(
        lang === 'bn'
          ? `✓ ${targetName}-এর অ্যাডমিন ক্ষমতা তাৎক্ষণিকভাবে বাতিল করা হয়েছে`
          : `✓ Revoked admin access for ${targetName}`
      );
    } catch {
      showTempToast(lang === 'bn' ? 'বাতিল করতে সমস্যা হয়েছে' : 'Failed to revoke admin');
    }
  };

  const handleToggleVerify = async (donorId: string) => {
    setDonors((prev) =>
      prev.map((d) => {
        if (d.id === donorId) {
          const updated = !d.verifiedBadge;
          onLogAudit(
            'STATUS_CHANGE',
            `Admin ${updated ? 'verified' : 'unverified'} donor: ${d.name} (${d.bloodGroup})`
          );
          return { ...d, verifiedBadge: updated };
        }
        return d;
      })
    );
    try {
      await adminToggleDonorVerifiedInFirestore(donorId);
    } catch {}
    showTempToast(lang === 'bn' ? '✓ ডোনার স্ট্যাটাস আপডেট হয়েছে' : '✓ Donor status updated');
  };

  const handleConfirmDeleteDonor = async (donorId: string, donorName: string) => {
    setDonors((prev) => prev.filter((d) => d.id !== donorId));
    setConfirmDeleteDonorId(null);
    onLogAudit('STATUS_CHANGE', `Admin removed donor: ${donorName} (ID: ${donorId})`);
    try {
      await adminDeleteDonorInFirestore(donorId);
    } catch {}
    showTempToast(lang === 'bn' ? `🗑️ ${donorName}-কে তালিকা থেকে মুছে ফেলা হয়েছে` : `Removed ${donorName}`);
  };

  const handleConfirmDeleteRequest = async (reqId: string, patientName: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
    setConfirmDeleteReqId(null);
    onLogAudit('STATUS_CHANGE', `Admin deleted blood request for ${patientName}`);
    try {
      await adminDeleteRequestInFirestore(reqId);
    } catch {}
    showTempToast(lang === 'bn' ? '🗑️ রক্তের আবেদন মুছে ফেলা হয়েছে' : 'Request deleted');
  };

  const handleMarkFulfilled = async (reqId: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, status: 'FULFILLED', unitsCollected: r.unitsNeeded } : r
      )
    );
    onLogAudit('STATUS_CHANGE', `Admin marked request ${reqId} as FULFILLED`);
    try {
      await adminMarkRequestFulfilledInFirestore(reqId);
    } catch {}
    showTempToast(lang === 'bn' ? '✓ আবেদনটি সম্পন্ন (Fulfilled) চিহ্নিত হয়েছে' : 'Marked as Fulfilled');
  };

  const handleStockChange = async (grp: BloodGroup, delta: number) => {
    const nextVal = Math.max(0, (bloodStock[grp] || 0) + delta);
    setBloodStock((prev) => ({
      ...prev,
      [grp]: nextVal,
    }));
    onLogAudit(
      'STOCK_UPDATE',
      `Admin modified ${grp} stock by ${delta > 0 ? `+${delta}` : delta} units (Now: ${nextVal})`
    );
    try {
      await adminUpdateBloodStockInFirestore(grp, nextVal);
    } catch {}
  };

  const filteredDonors = donors.filter((d) => {
    if (!searchDonorQuery.trim()) return true;
    const q = searchDonorQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      d.bloodGroup.toLowerCase().includes(q) ||
      d.district.toLowerCase().includes(q)
    );
  });

  // =========================================================================
  // 1. ZERO-TRUST OWNER-LOCKED ADMIN SECURITY GATEWAY
  // =========================================================================
  if (!isAdminAuthenticated) {
    return (
      <div className="py-4 px-2 max-w-md mx-auto text-left">
        <div className="rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 text-white flex items-center justify-center shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {lang === 'bn'
                ? 'ওনার-লকড অ্যাডমিন সিকিউরিটি গেটওয়ে'
                : 'Owner-Locked Admin Security Gateway'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? 'জিরো-ট্রাস্ট অ্যান্টি-হ্যাক সুরক্ষা সক্রিয়: শুধুমাত্র অ্যাপের ভেরিফাইড সুপার ওনার Gmail অথবা ওনারের ক্লাউড ভল্ট থেকে অনুমোদিত গোপন কোড দিয়ে প্রবেশ করা যাবে।'
                : 'Zero-Trust Anti-Hijack Protection Active: Only the verified Super Owner Gmail or an active Cloud Vault Invite Code can unlock this panel.'}
            </p>
          </div>

          {isCheckingAuth && (
            <div className="text-center text-xs text-slate-500 py-1">
              {lang === 'bn' ? 'ক্লাউড সিকিউরিটি যাচাই হচ্ছে...' : 'Verifying Cloud Credentials...'}
            </div>
          )}

          {/* 1-Click Verified Super Owner / Admin Gmail Login */}
          <button
            type="button"
            onClick={handleAdminGoogleSignIn}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-black text-xs flex items-center justify-center gap-2.5 cursor-pointer shadow-md"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>
              {lang === 'bn'
                ? 'সুপার ওনার / ভেরিফাইড Google দিয়ে প্রবেশ করুন'
                : 'Unlock with Verified Owner / Admin Google'}
            </span>
          </button>

          {firebaseUser && (
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate font-mono text-slate-600 dark:text-slate-300">
                {firebaseUser.email || firebaseUser.phoneNumber}
              </span>
              <button
                type="button"
                onClick={() => signOutReal().catch(() => {})}
                className="text-rose-600 dark:text-rose-400 font-bold hover:underline shrink-0 cursor-pointer"
              >
                {lang === 'bn' ? 'অ্যাকাউন্ট বদলান' : 'Switch'}
              </button>
            </div>
          )}

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
            <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase">
              {lang === 'bn' ? 'অথবা ওনার ইনভাইট কোড' : 'Or Owner Invite Code'}
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
          </div>

          {/* Cloud-Verified Invite Code Form (Zero leaked codes or hints!) */}
          <form onSubmit={handleAdminSecretUnlock} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'bn'
                    ? 'ক্লাউড ভল্ট ইনভাইট কোড (শুধুমাত্র ওনার কর্তৃক প্রদত্ত)'
                    : 'Cloud Vault Invite Code (Issued by Owner)'}
                </label>
              </div>

              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder={lang === 'bn' ? 'গোপন ইনভাইট কোড লিখুন...' : 'Enter private invite code...'}
                  className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{pinError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isUnlockingCode}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isUnlockingCode
                  ? lang === 'bn'
                    ? 'ক্লাউডে যাচাই হচ্ছে...'
                    : 'Verifying in Cloud...'
                  : lang === 'bn'
                  ? 'ক্লাউড ভেরিফিকেশনসহ প্যানেল খুলুন'
                  : 'Verify & Unlock Admin Panel'}
              </span>
            </button>
          </form>

          {onOpenRegisterWithRole && (
            <button
              type="button"
              onClick={() => onOpenRegisterWithRole('ADMIN')}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:bg-amber-100"
            >
              <UserPlus className="w-4 h-4 text-amber-600" />
              <span>
                {lang === 'bn'
                  ? 'অ্যাডমিন স্মার্ট আইডি রেজিস্টার করুন'
                  : 'Register Admin Smart ID'}
              </span>
            </button>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-center">
            <button
              type="button"
              onClick={onExitAdmin}
              className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline cursor-pointer"
            >
              ← {lang === 'bn' ? 'ইউজার প্যানেল হোমে ফিরে যান' : 'Back to User Panel'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. UNLOCKED CLOUD-VERIFIED SUPER ADMIN CONTROL DASHBOARD
  // =========================================================================
  return (
    <div className="space-y-4 text-left pb-10">
      {/* Top Admin Status Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white p-4 shadow-lg border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                {lang === 'bn' ? 'সুপার অ্যাডমিন কন্ট্রোল সেন্টার' : 'Super Admin Control Center'}
              </h2>
              <span className="text-[10px] font-bold text-emerald-400">
                · {isSuperOwner ? '👑 EXCLUSIVE APP OWNER' : '✓ VERIFIED CO-ADMIN'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[260px]">
              {firebaseUser?.email || firebaseUser?.uid}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
          {onOpenApkGuide && (
            <button
              onClick={onOpenApkGuide}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'APK ও ডিপ্লয় গাইড' : 'APK & Deploy'}</span>
            </button>
          )}

          <button
            onClick={onExitAdmin}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
          >
            {lang === 'bn' ? '👤 ইউজার প্যানেল' : 'User Panel'}
          </button>

          <button
            onClick={handleAdminLock}
            className="px-3 py-1.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'লক' : 'Lock'}</span>
          </button>
        </div>
      </div>

      {adminToast && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
          {adminToast}
        </div>
      )}

      {/* 4 Quick Stat Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
            মোট রক্তদাতা
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {donors.length}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            ✓ {donors.filter((d) => d.verifiedBadge).length} ভেরিফাইড
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
            সক্রিয় SOS আবেদন
          </span>
          <span className="text-xl font-black text-rose-600 font-mono">
            {requests.filter((r) => r.status === 'ACTIVE').length}
          </span>
          <span className="text-[10px] text-red-500 font-semibold block mt-0.5">
            জরুরি মডারেশন
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
            স্টক রক্ত ইউনিট
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
            {Object.values(bloodStock).reduce((a: number, b: number) => a + b, 0)}
          </span>
          <span className="text-[10px] text-blue-500 font-semibold block mt-0.5">
            ক্লাউড সিঙ্কড
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase block">
            ওনার সিকিউরিটি শিল্ড
          </span>
          <span className="text-xl font-black text-emerald-600 font-mono">
            100%
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
            Zero-Trust Locked
          </span>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-x-auto text-xs font-bold">
        {[
          { id: 'donors', label: lang === 'bn' ? '🩸 ডোনার ভেরিফিকেশন' : 'Donors' },
          { id: 'sos', label: lang === 'bn' ? '🚨 SOS মডারেশন' : 'SOS Requests' },
          { id: 'inventory', label: lang === 'bn' ? '🏥 ব্লাড স্টক' : 'Blood Stock' },
          { id: 'vault', label: lang === 'bn' ? '👑 ওনার সিকিউরিটি ভল্ট' : 'Owner Vault' },
          { id: 'audit', label: lang === 'bn' ? '🔒 অডিট লগ' : 'Audit Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id as any)}
            className={`px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              adminTab === tab.id
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DONOR VERIFICATION */}
      {adminTab === 'donors' && (
        <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {lang === 'bn' ? 'রক্তদাতা অনুমোদন ও নিয়ন্ত্রণ' : 'Donor Verification Directory'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'নিবন্ধিত ডোনারদের ভেরিফাইড ব্যাজ প্রদান বা বাতিল করুন'
                  : 'Approve or revoke verified status for registered donors'}
              </p>
            </div>

            <div className="w-full sm:w-64 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchDonorQuery}
                onChange={(e) => setSearchDonorQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'নাম, গ্রুপ বা জেলা...' : 'Search donors...'}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[480px] overflow-y-auto">
            {filteredDonors.map((donor) => (
              <div key={donor.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {donor.bloodGroup}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {donor.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        · {donor.verifiedBadge ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {donor.phone} · <span className="capitalize">{donor.upazila}, {donor.district}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleVerify(donor.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 ${
                      donor.verifiedBadge
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {donor.verifiedBadge
                        ? lang === 'bn'
                          ? 'ভেরিফাইড'
                          : 'Verified'
                        : lang === 'bn'
                        ? 'অনুমোদন দিন'
                        : 'Approve'}
                    </span>
                  </button>

                  {confirmDeleteDonorId === donor.id ? (
                    <button
                      onClick={() => handleConfirmDeleteDonor(donor.id, donor.name)}
                      className="px-2 py-1.5 rounded-lg bg-red-600 text-white text-[10px] font-black cursor-pointer"
                    >
                      {lang === 'bn' ? 'নিশ্চিত মুছুন' : 'Confirm'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteDonorId(donor.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      title="রিমুভ করুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SOS REQUESTS MODERATION */}
      {adminTab === 'sos' && (
        <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[480px] overflow-y-auto">
            {requests.map((req) => (
              <div
                key={req.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-xs">
                      {req.bloodGroup}
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {req.patientName} ({req.unitsNeeded} ব্যাগ)
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      · {req.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Hospital className="w-3.5 h-3.5 text-rose-500" />
                    <span>{req.hospitalName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {req.status !== 'FULFILLED' && (
                    <button
                      onClick={() => handleMarkFulfilled(req.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                    >
                      ✓ {lang === 'bn' ? 'রক্ত পাওয়া গেছে' : 'Fulfilled'}
                    </button>
                  )}

                  {confirmDeleteReqId === req.id ? (
                    <button
                      onClick={() => handleConfirmDeleteRequest(req.id, req.patientName)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-black cursor-pointer"
                    >
                      {lang === 'bn' ? 'নিশ্চিত মুছুন' : 'Confirm'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteReqId(req.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 text-xs font-bold cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'মুছুন' : 'Delete'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BLOOD BANK INVENTORY */}
      {adminTab === 'inventory' && (
        <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ALL_BLOOD_GROUPS.map((grp) => {
              const count = bloodStock[grp];
              const isLow = count < 10;
              return (
                <div
                  key={grp}
                  className={`p-3.5 rounded-2xl border text-center space-y-2 ${
                    isLow
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-900'
                      : 'bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-lg text-rose-600">{grp}</span>
                    {isLow && (
                      <span className="text-[10px] font-bold text-red-600">LOW</span>
                    )}
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {count} <span className="text-xs font-normal text-slate-400">ব্যাগ</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleStockChange(grp, -1)}
                      className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white flex items-center justify-center font-bold cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStockChange(grp, 1)}
                      className="w-8 h-8 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center font-bold cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: OWNER ANTI-HIJACK SECURITY VAULT */}
      {adminTab === 'vault' && (
        <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-200 dark:border-slate-700 space-y-1">
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>
                {lang === 'bn'
                  ? 'ওনার অ্যান্টি-হ্যাক ও মালিকানা সুরক্ষা ভল্ট'
                  : 'Owner Anti-Hijack & Ownership Vault'}
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? `এই অ্যাপ ও ডাটাবেজের স্থায়ী সুপার ওনার শুধুমাত্র ${BOOTSTRAPPED_SUPER_ADMIN_EMAIL}। সোর্স কোডে কোনো পাসওয়ার্ড বা হ্যাশ রাখা হয়নি—তাই APK ডিকম্পাইল করলেও কেউ অ্যাডমিন প্যানেল বা ডাটাবেজ দখল করতে পারবে না।`
                : `Permanent Super Owner is strictly locked to ${BOOTSTRAPPED_SUPER_ADMIN_EMAIL}. Zero static codes exist in client code.`}
            </p>
          </div>

          {!isSuperOwner ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
              {lang === 'bn'
                ? `শুধুমাত্র মূল মালিক (${BOOTSTRAPPED_SUPER_ADMIN_EMAIL}) নতুন ইনভাইট কোড তৈরি বা অন্য অ্যাডমিন বাতিল করতে পারবেন।`
                : `Only the primary App Owner (${BOOTSTRAPPED_SUPER_ADMIN_EMAIL}) can manage Cloud Invite Locks or revoke admins.`}
            </div>
          ) : (
            <>
              {/* Create Dynamic Cloud Invite Code */}
              <form
                onSubmit={handleCreateInviteLock}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  {lang === 'bn'
                    ? '১. নতুন গোপন কো-অ্যাডমিন ইনভাইট কোড তৈরি করুন (ঐচ্ছিক)'
                    : '1. Create Private Co-Admin Invite Code (Optional)'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lang === 'bn'
                    ? 'আপনি কাউকে কোড না দিলে পৃথিবীর আর কেউ অ্যাডমিন হতে পারবে না। কাউকে কো-অ্যাডমিন বানাতে চাইলে নিচে গোপন কোড তৈরি করুন (ডাটাবেজে শুধু SHA-256 হ্যাশ সেভ হবে):'
                    : 'Unless you create an active code here, nobody else can ever register as Admin.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newInviteCode}
                    onChange={(e) => setNewInviteCode(e.target.value)}
                    placeholder={lang === 'bn' ? 'গোপন কোড (কমপক্ষে ৬ অক্ষর)' : 'Secret code (min 6 chars)'}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newInviteLabel}
                    onChange={(e) => setNewInviteLabel(e.target.value)}
                    placeholder={lang === 'bn' ? 'লেবেল (যেমন: ঢাকা টিম)' : 'Label (e.g. Dhaka Team)'}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreatingLock}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer"
                >
                  {isCreatingLock
                    ? lang === 'bn'
                      ? 'সংরক্ষণ হচ্ছে...'
                      : 'Saving...'
                    : lang === 'bn'
                    ? '+ ক্লাউড ভল্টে কোড যুক্ত করুন'
                    : '+ Save Invite Code to Vault'}
                </button>

                {inviteLocks.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                    {inviteLocks.map((lock) => (
                      <div
                        key={lock.proofHash}
                        className="py-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {lock.label}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block truncate">
                            SHA256: {lock.proofHash.slice(0, 14)}... ·{' '}
                            {lock.active ? 'সক্রিয় (Active)' : 'বন্ধ (Paused)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              ownerToggleAdminInviteLock(lock.proofHash, !lock.active, lock.label)
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-[11px] cursor-pointer"
                          >
                            {lock.active
                              ? lang === 'bn'
                                ? 'পজ করুন'
                                : 'Pause'
                              : lang === 'bn'
                              ? 'চালু করুন'
                              : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => ownerDeleteAdminInviteLock(lock.proofHash)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </form>

              {/* Active Secondary Admins Roster + Instant Revoke */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  {lang === 'bn'
                    ? `২. নিবন্ধিত কো-অ্যাডমিন তালিকা (${registeredAdmins.length}) — ১-ক্লিকে বাতিল করার ক্ষমতা`
                    : `2. Registered Co-Admins (${registeredAdmins.length}) — Instant Revoke`}
                </div>
                {registeredAdmins.length === 0 ? (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                    {lang === 'bn'
                      ? '✓ বর্তমানে আপনি ছাড়া আর কোনো কো-অ্যাডমিন নেই। ১০০% একক নিয়ন্ত্রণ আপনার হাতে।'
                      : '✓ Zero external co-admins registered. 100% exclusive control is yours.'}
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {registeredAdmins.map((adm) => (
                      <div
                        key={adm.uid}
                        className="py-2.5 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {adm.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono block truncate">
                            {adm.idCardNumber} · UID: {adm.uid.slice(0, 10)}...
                          </span>
                        </div>
                        {adm.uid === firebaseUser?.uid ? (
                          <span className="text-[11px] font-bold text-emerald-600">আপনি (Owner)</span>
                        ) : confirmRevokeAdminUid === adm.uid ? (
                          <button
                            type="button"
                            onClick={() => handleRevokeAdmin(adm.uid, adm.name)}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-[11px] cursor-pointer"
                          >
                            {lang === 'bn' ? 'নিশ্চিত বাতিল' : 'Confirm Revoke'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmRevokeAdminUid(adm.uid)}
                            className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-[11px] cursor-pointer"
                          >
                            {lang === 'bn' ? 'অ্যাডমিন বাতিল করুন' : 'Revoke Access'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Cloud Domain & API Key Anti-Cloning Links */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="text-xs font-black text-slate-900 dark:text-white">
              {lang === 'bn'
                ? '৩. ডিপ্লয়মেন্ট ডোমেইন ও API Key লক (ক্লোন প্রতিরোধ)'
                : '3. Deployment Domain & API Key Lock'}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'bn'
                ? `বর্তমান অরিজিন: ${secDiag.origin} · অ্যাপ ডিপ্লয় করার পর নিচের লিংক থেকে আপনার ডোমেইন ছাড়া অন্য সব অপরিচিত ডোমেইন ব্লক করে রাখতে পারবেন:`
                : `Current Origin: ${secDiag.origin} · Restrict your Firebase Auth domains and API key referrers:`}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href={FIREBASE_SETTINGS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 hover:border-rose-500"
              >
                <span>Authorized Domains</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={GCP_API_CREDENTIALS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 hover:border-rose-500"
              >
                <span>API Key Restriction</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={FIREBASE_RULES_CONSOLE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 hover:border-rose-500"
              >
                <span>Firestore Rules</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {adminTab === 'audit' && (
        <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[480px] overflow-y-auto font-mono text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-rose-600 dark:text-rose-400">{log.action}</span>
                  <span className="text-slate-400">{log.timestamp}</span>
                </div>
                <div className="text-slate-800 dark:text-slate-200 text-xs">{log.targetDetails}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
