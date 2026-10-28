import React, { useState, useEffect } from 'react';
import { Donor, BloodRequest, AuditLogEntry, BloodGroup, Language } from '../../types';
import { ALL_BLOOD_GROUPS } from '../../data/compatibility';
import {
  INITIAL_DONORS,
  INITIAL_REQUESTS,
  isSeedDonorId,
  isSeedRequestId,
  evictSeedsProgressively,
} from '../../data/mockDonors';
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
  subscribeActiveAnnouncements,
  adminPublishAnnouncementInFirestore,
  adminDeactivateAnnouncementInFirestore,
  subscribeRemoteAppUpdate,
  adminPublishAppUpdateInFirestore,
  adminDeactivateAppUpdateInFirestore,
  isGlobalRealOnlyModeActive,
  adminSetGlobalRealOnlyModeInFirestore,
  ownerPurgeFakeCloudRecordsOnlyInFirestore,
  subscribeAdminScamReports,
  adminUpdateScamReportStatusInFirestore,
  adminDeleteScamReportInFirestore,
  OwnerAnnouncementItem,
  RemoteAppUpdateRelease,
  ScamReportItem,
  AdminInviteLockItem,
  RegisteredAdminItem,
  BOOTSTRAPPED_SUPER_ADMIN_EMAIL,
  DATABASE_COLLECTION_ARCHITECTURES,
  FIREBASE_DATA_CONSOLE_URL,
  FIREBASE_PROJECT_ID,
  FIRESTORE_DATABASE_ID,
  FIREBASE_SETTINGS_URL,
  FIREBASE_RULES_CONSOLE_URL,
  GCP_API_CREDENTIALS_URL,
  SmartDatabaseHealthReport,
  adminSmartCleanupCompletedRequestsInFirestore,
  runSmartDatabaseHealthAndSecurityAudit,
  User,
} from '../../firebase';
import { getSecurityDiagnostics } from '../../utils/securityShield';
import { CURRENT_APP_VERSION } from '../../utils/appUpdateManager';
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
  Megaphone,
  Download,
  Database,
  RefreshCw,
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

  const [adminTab, setAdminTab] = useState<
    'donors' | 'sos' | 'inventory' | 'megaphone' | 'scam' | 'database' | 'vault' | 'audit'
  >('donors');
  const [searchDonorQuery, setSearchDonorQuery] = useState('');
  const [dbHealth, setDbHealth] = useState<SmartDatabaseHealthReport | null>(null);
  const [isScanningDb, setIsScanningDb] = useState(false);
  const [isCleaningFulfilled, setIsCleaningFulfilled] = useState(false);

  // Owner Megaphone & Anti-Scam Moderation States
  const [announcements, setAnnouncements] = useState<OwnerAnnouncementItem[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastUrgency, setBroadcastUrgency] = useState<'CRITICAL' | 'INFO' | 'CAMPAIGN'>(
    'CRITICAL'
  );
  const [isPublishingBroadcast, setIsPublishingBroadcast] = useState(false);
  const [liveAppRelease, setLiveAppRelease] = useState<RemoteAppUpdateRelease | null>(null);
  const [releaseVersionInput, setReleaseVersionInput] = useState(() => {
    const parts = CURRENT_APP_VERSION.split('.').map((n) => Number.parseInt(n, 10) || 0);
    return `${parts[0] || 2}.${(parts[1] || 5) + 1}.0`;
  });
  const [releaseModeInput, setReleaseModeInput] = useState<'OPTIONAL' | 'REQUIRED'>('OPTIONAL');
  const [releaseNotesInput, setReleaseNotesInput] = useState('');
  const [releaseApkUrlInput, setReleaseApkUrlInput] = useState('');
  const [isPublishingAppUpdate, setIsPublishingAppUpdate] = useState(false);
  const [scamReports, setScamReports] = useState<ScamReportItem[]>([]);
  const [donorIdLookupQuery, setDonorIdLookupQuery] = useState('');
  const [realOnlyMode, setRealOnlyMode] = useState<boolean>(() => isGlobalRealOnlyModeActive());
  const [confirmPurgeCloudTest, setConfirmPurgeCloudTest] = useState(false);
  const [isPurgingCloudTest, setIsPurgingCloudTest] = useState(false);

  // Owner Security Vault states (exclusively for shamimrakib015@gmail.com)
  const [inviteLocks, setInviteLocks] = useState<AdminInviteLockItem[]>([]);
  const [registeredAdmins, setRegisteredAdmins] = useState<RegisteredAdminItem[]>([]);
  const [newInviteCode, setNewInviteCode] = useState('');
  const [newInviteLabel, setNewInviteLabel] = useState('');
  const [isCreatingLock, setIsCreatingLock] = useState(false);

  const [bloodStock, setBloodStock] = useState<Record<BloodGroup, number>>({
    'A+': 0,
    'A-': 0,
    'B+': 0,
    'B-': 0,
    'AB+': 0,
    'AB-': 0,
    'O+': 0,
    'O-': 0,
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

  // Subscribe to Active Announcements, Remote App Update Release & Real-Only Mode Flag
  useEffect(() => {
    let unsubAnn: (() => void) | null = null;
    let unsubAppUpd: (() => void) | null = null;
    try {
      unsubAnn = subscribeActiveAnnouncements(setAnnouncements);
      unsubAppUpd = subscribeRemoteAppUpdate(setLiveAppRelease);
    } catch {}
    const syncRealFlag = () => setRealOnlyMode(isGlobalRealOnlyModeActive());
    window.addEventListener('bloodsearch_real_mode_changed', syncRealFlag);
    return () => {
      if (unsubAnn) unsubAnn();
      if (unsubAppUpd) unsubAppUpd();
      window.removeEventListener('bloodsearch_real_mode_changed', syncRealFlag);
    };
  }, []);

  useEffect(() => {
    if (!isAdminAuthenticated) {
      setScamReports([]);
      return;
    }
    let unsubScam: (() => void) | null = null;
    try {
      unsubScam = subscribeAdminScamReports(setScamReports);
    } catch {}
    return () => {
      if (unsubScam) unsubScam();
    };
  }, [isAdminAuthenticated]);

  const showTempToast = (msg: string) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(null), 2800);
  };

  const realDonorsCount = donors.filter((d) => !isSeedDonorId(d.id)).length;
  const remainingDemoDonorsCount = donors.filter((d) => isSeedDonorId(d.id)).length;
  const evictedDemoDonorsCount = Math.max(0, INITIAL_DONORS.length - remainingDemoDonorsCount);

  const handleToggleRealOnlyMode = async () => {
    const next = !realOnlyMode;
    setRealOnlyMode(next);
    await adminSetGlobalRealOnlyModeInFirestore(next).catch(() => {});
    setDonors((prev) =>
      evictSeedsProgressively(
        prev.filter((d) => !isSeedDonorId(d.id)),
        INITIAL_DONORS,
        next
      )
    );
    setRequests((prev) =>
      evictSeedsProgressively(
        prev.filter((r) => !isSeedRequestId(r.id)),
        INITIAL_REQUESTS,
        next
      )
    );
    onLogAudit(
      'STATUS_CHANGE',
      next
        ? 'Enabled 100% Real-Users-Only Mode (all demo/seed data hidden globally)'
        : 'Enabled Automatic 1-by-1 Demo Eviction Mode'
    );
    showTempToast(
      next
        ? '✓ সব ডেমো/ফেইক ডাটা সরিয়ে ১০০% রিয়েল-ইউজার মোড চালু হয়েছে!'
        : '✓ অটো ১-বাই-১ ডেমো রিমুভাল মোড সক্রিয় হয়েছে!'
    );
  };

  const handleOwnerPurgeCloudTestData = async () => {
    if (!isSuperOwner || isPurgingCloudTest) return;
    setIsPurgingCloudTest(true);
    try {
      const res = await ownerPurgeFakeCloudRecordsOnlyInFirestore();
      await adminSetGlobalRealOnlyModeInFirestore(true);
      setRealOnlyMode(true);
      setConfirmPurgeCloudTest(false);
      onLogAudit(
        'STATUS_CHANGE',
        `Purged fake/test cloud records (${res.deletedDonors} fake donors, ${res.deletedRequests} fake SOS, ${res.deletedMessages} fake chats) while keeping real users intact`
      );
      showTempToast(
        `✓ ডাটাবেস থেকে ${res.deletedDonors}টি ফেইক/টেস্ট ডোনার ও ${res.deletedRequests}টি ফেইক পোস্ট মুছে ফেলা হয়েছে (আসল ইউজার অক্ষত আছে)!`
      );
    } catch {
      showTempToast('ক্লাউড ফেইক ডাটা পরিষ্কার করা যায়নি।');
    } finally {
      setIsPurgingCloudTest(false);
    }
  };

  const handleRunSmartDbDiagnostic = async () => {
    setIsScanningDb(true);
    try {
      const report = await runSmartDatabaseHealthAndSecurityAudit();
      setDbHealth(report);
      onLogAudit('STATUS_CHANGE', `Ran Smart Database Zero-Trust Penetration Audit (${report.latencyMs}ms)`);
    } catch {
      showTempToast(
        lang === 'bn' ? 'ডাটাবেস স্ক্যান সম্পন্ন করা যায়নি।' : 'Database diagnostic scan failed.'
      );
    } finally {
      setIsScanningDb(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated && adminTab === 'database' && !dbHealth && !isScanningDb) {
      handleRunSmartDbDiagnostic();
    }
  }, [isAdminAuthenticated, adminTab]);

  const handleSmartCleanCompletedSos = async () => {
    if (isCleaningFulfilled) return;
    setIsCleaningFulfilled(true);
    try {
      const removed = await adminSmartCleanupCompletedRequestsInFirestore();
      setRequests((prev) => prev.filter((r) => r.status === 'ACTIVE'));
      onLogAudit('STATUS_CHANGE', `Smart DB Hygiene: cleaned ${removed} completed/cancelled SOS records`);
      showTempToast(
        lang === 'bn'
          ? `✓ ডাটাবেস অপ্টিমাইজড! ${removed}টি সম্পন্ন/বাতিল SOS রেকর্ড পরিষ্কার করা হয়েছে`
          : `✓ Database optimized! Cleaned ${removed} completed/cancelled SOS records`
      );
      await handleRunSmartDbDiagnostic();
    } catch {
      showTempToast(
        lang === 'bn' ? 'SOS ক্লিনআপ সম্পন্ন করা যায়নি।' : 'Failed to clean completed SOS requests.'
      );
    } finally {
      setIsCleaningFulfilled(false);
    }
  };

  const handleExportCsvBackup = () => {
    const headers = [
      'ID',
      'Name',
      'BloodGroup',
      'District',
      'Upazila',
      'Available',
      'Verified',
      'TotalDonations',
      'LastDonated',
    ];
    const escapeCsv = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const rows = donors.map((d) =>
      [
        d.id,
        d.name,
        d.bloodGroup,
        d.district,
        d.upazila,
        d.available ? 'YES' : 'NO',
        d.verifiedBadge ? 'VERIFIED' : 'PENDING',
        d.totalDonations,
        d.lastDonatedDate || '',
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BloodSearch-Donors-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onLogAudit('STATUS_CHANGE', `Exported ${donors.length} donors to Excel CSV backup`);
    showTempToast(
      lang === 'bn'
        ? `✓ ${donors.length} জন ডোনারের Excel (.CSV) ব্যাকআপ ডাউনলোড হয়েছে`
        : `✓ Downloaded Excel (.CSV) backup of ${donors.length} donors`
    );
  };

  const handleExportJsonBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      exportedBy: firebaseUser?.email || 'Admin',
      totalDonors: donors.length,
      totalRequests: requests.length,
      bloodStock,
      donors,
      requests,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BloodSearch-FullBackup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onLogAudit('STATUS_CHANGE', 'Exported full system JSON snapshot backup');
    showTempToast(
      lang === 'bn'
        ? '✓ সম্পূর্ণ ডাটাবেস (.JSON) ব্যাকআপ ডাউনলোড সম্পন্ন'
        : '✓ Full database (.JSON) backup downloaded'
    );
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim() || isPublishingBroadcast) return;
    setIsPublishingBroadcast(true);
    try {
      await adminPublishAnnouncementInFirestore({
        title:
          broadcastTitle.trim() ||
          (broadcastUrgency === 'CRITICAL'
            ? '📢 জরুরি রক্তের ডাক'
            : broadcastUrgency === 'CAMPAIGN'
              ? '⛺ রক্তদান ক্যাম্পেইন বিজ্ঞপ্তি'
              : 'ℹ️ অফিশিয়াল ঘোষণা'),
        message: broadcastMsg.trim(),
        urgency: broadcastUrgency,
      });
      setBroadcastTitle('');
      setBroadcastMsg('');
      onLogAudit('STATUS_CHANGE', `Published live megaphone broadcast (${broadcastUrgency})`);
      showTempToast(
        lang === 'bn'
          ? '📢 লাইভ মেগাফোন ঘোষণা পুরো অ্যাপে প্রকাশিত হয়েছে!'
          : '📢 Live Megaphone Broadcast published across the app!'
      );
    } catch {
      showTempToast(
        lang === 'bn'
          ? 'ঘোষণা প্রকাশ করা যায়নি। অ্যাডমিন অনুমতি চেক করুন।'
          : 'Failed to publish announcement.'
      );
    } finally {
      setIsPublishingBroadcast(false);
    }
  };

  const handlePublishAppUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!releaseVersionInput.trim() || !releaseNotesInput.trim() || isPublishingAppUpdate) return;
    setIsPublishingAppUpdate(true);
    try {
      await adminPublishAppUpdateInFirestore({
        version: releaseVersionInput.trim(),
        mode: releaseModeInput,
        changelog: releaseNotesInput.trim(),
        apkUrl: releaseApkUrlInput.trim() || undefined,
      });
      setReleaseNotesInput('');
      onLogAudit(
        'STATUS_CHANGE',
        `Published App/APK Update v${releaseVersionInput.trim()} (${releaseModeInput})`
      );
      showTempToast(
        lang === 'bn'
          ? `✓ অ্যাপ আপডেট v${releaseVersionInput.trim()} সকল ইউজারের ফোনে পুশ করা হয়েছে!`
          : `✓ App Update v${releaseVersionInput.trim()} pushed to all users!`
      );
    } catch {
      showTempToast(
        lang === 'bn'
          ? 'অ্যাপ আপডেট প্রকাশ করা যায়নি।'
          : 'Failed to publish app update.'
      );
    } finally {
      setIsPublishingAppUpdate(false);
    }
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
          <button
            type="button"
            onClick={handleExportCsvBackup}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Excel .CSV ডাউনলোড"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.CSV ব্যাকআপ</span>
          </button>

          <button
            type="button"
            onClick={handleExportJsonBackup}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="Full .JSON ব্যাকআপ"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.JSON</span>
          </button>

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
          {
            id: 'megaphone',
            label: lang === 'bn' ? 'অ্যাপ আপডেট ও মেগাফোন' : 'App Update & Broadcast',
          },
          {
            id: 'scam',
            label:
              lang === 'bn'
                ? `স্ক্যাম ও আইডি যাচাই (${scamReports.filter((r) => r.status === 'OPEN').length})`
                : `Scam & ID (${scamReports.filter((r) => r.status === 'OPEN').length})`,
          },
          { id: 'database', label: lang === 'bn' ? 'স্মার্ট ডাটাবেস ও শিল্ড' : 'Smart Database' },
          { id: 'vault', label: lang === 'bn' ? 'ওনার সিকিউরিটি ভল্ট' : 'Owner Vault' },
          { id: 'audit', label: lang === 'bn' ? 'অডিট লগ' : 'Audit Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id as any)}
            className={`px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              adminTab === tab.id
                ? 'btn-crimson'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DONOR VERIFICATION */}
      {adminTab === 'donors' && (
        <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
          {/* Smart Automatic 1-by-1 Fake Eviction & 100% Real-Only Control Strip */}
          <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <div className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                {lang === 'bn'
                  ? `অটো ফেইক-ডাটা রিমুভার সক্রিয় · ${realDonorsCount} জন রিয়েল ইউজার · ${evictedDemoDonorsCount}টি ডেমো অটো-ডিলিট হয়েছে (${remainingDemoDonorsCount}টি বাকি)`
                  : `Auto Seed Eviction Active · ${realDonorsCount} Real Users · ${evictedDemoDonorsCount} Demos Deleted (${remainingDemoDonorsCount} left)`}
              </div>
              <p className="text-[11px] text-emerald-900/85 dark:text-emerald-300/85">
                {lang === 'bn'
                  ? 'প্রতিটি নতুন রিয়েল মানুষ অ্যাকাউন্ট বা পোস্ট তৈরি করলেই ১টি করে ফেইক/ডেমো কার্ড স্বয়ংক্রিয়ভাবে মুছে যায়।'
                  : 'Each new real user or SOS post automatically deletes 1 demo entry until 0 fake items remain.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleToggleRealOnlyMode}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  realOnlyMode
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900'
                }`}
              >
                {realOnlyMode
                  ? lang === 'bn'
                    ? '✓ ১০০% রিয়েল মোড চালু আছে'
                    : '✓ 100% Real Mode ON'
                  : lang === 'bn'
                    ? '⚡ এখনই বাকি সব ডেমো মুছুন'
                    : '⚡ Hide All Demos Now'}
              </button>

              {isSuperOwner &&
                (confirmPurgeCloudTest ? (
                  <button
                    type="button"
                    disabled={isPurgingCloudTest}
                    onClick={handleOwnerPurgeCloudTestData}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-black cursor-pointer"
                  >
                    {isPurgingCloudTest
                      ? 'মুছে ফেলা হচ্ছে...'
                      : 'নিশ্চিত? পুরনো টেস্ট ডাটা মুছুন'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmPurgeCloudTest(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800 text-[11px] font-bold cursor-pointer"
                  >
                    {lang === 'bn' ? 'ডাটাবেস টেস্ট ইউজার রিসেট' : 'Reset Cloud Test Data'}
                  </button>
                ))}
            </div>
          </div>

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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {donor.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        · {donor.verifiedBadge ? 'VERIFIED' : 'PENDING'}
                      </span>
                      {isSeedDonorId(donor.id) ? (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          · ডেমো (নতুন রিয়েল ইউজার এলে অটো-ডিলিট হবে)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          · ✓ রিয়েল ইউজার
                        </span>
                      )}
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-xs">
                      {req.bloodGroup}
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {req.patientName} ({req.unitsNeeded} ব্যাগ)
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      · {req.status}
                    </span>
                    {isSeedRequestId(req.id) ? (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        · ডেমো SOS (নতুন পোস্ট এলে অটো-ডিলিট হবে)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        · ✓ রিয়েল SOS পোস্ট
                      </span>
                    )}
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

      {/* TAB: LIVE APP / APK UPDATE PUSH & MEGAPHONE BROADCAST */}
      {adminTab === 'megaphone' && (
        <div className="space-y-4">
          {/* 1. Live OTA & APK Update Release Control */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {lang === 'bn'
                      ? 'লাইভ অ্যাপ ও APK আপডেট রিলিজ সেন্টার (OTA Update Push)'
                      : 'Live App & APK Update Release Center (OTA Push)'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? `বর্তমান অ্যাপ বিল্ড: v${CURRENT_APP_VERSION} · ভবিষ্যতে যেকোনো ফিচার অ্যাড বা ডিলিট করে ডিপ্লয় দিলে অটো আপডেট পপআপ যাবে, অথবা এখান থেকে নতুন APK লিংকসহ আপডেট নোটিশ পুশ করতে পারবেন।`
                      : `Current Build: v${CURRENT_APP_VERSION} · Auto-detects new deployments or lets you push optional/required APK update prompts.`}
                  </p>
                </div>
              </div>
            </div>

            {liveAppRelease?.active && (
              <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-black text-emerald-950 dark:text-emerald-200 font-mono tabular-nums">
                    {lang === 'bn'
                      ? `সক্রিয় রিলিজ: v${liveAppRelease.version} (${
                          liveAppRelease.mode === 'REQUIRED' ? 'বাধ্যতামূলক আপডেট' : 'ঐচ্ছিক আপডেট'
                        })`
                      : `Active Release: v${liveAppRelease.version} (${liveAppRelease.mode})`}
                  </div>
                  <p className="text-xs text-emerald-900/90 dark:text-emerald-200/90">
                    {liveAppRelease.changelog}
                  </p>
                  {liveAppRelease.apkUrl && (
                    <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 truncate">
                      APK: {liveAppRelease.apkUrl}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    adminDeactivateAppUpdateInFirestore()
                      .then(() =>
                        showTempToast(
                          lang === 'bn'
                            ? '✓ রিমোট আপডেট পপআপ বন্ধ করা হয়েছে'
                            : '✓ Deactivated remote update prompt'
                        )
                      )
                      .catch(() => {});
                  }}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl btn-soft-rose text-xs font-bold shrink-0 cursor-pointer whitespace-nowrap"
                >
                  {lang === 'bn' ? 'আপডেট নোটিশ বন্ধ করুন' : 'Stop Update Prompt'}
                </button>
              </div>
            )}

            <form onSubmit={handlePublishAppUpdate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'bn' ? 'নতুন ভার্সন নম্বর *' : 'New Version *'}
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={releaseVersionInput}
                    onChange={(e) => setReleaseVersionInput(e.target.value)}
                    placeholder="2.6.0"
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {lang === 'bn' ? 'আপডেট মোড (ঐচ্ছিক নাকি বাধ্যতামূলক)' : 'Update Mode'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setReleaseModeInput('OPTIONAL')}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
                        releaseModeInput === 'OPTIONAL' ? 'btn-emerald' : 'btn-surface'
                      }`}
                    >
                      {lang === 'bn' ? 'ঐচ্ছিক আপডেট কার্ড' : 'Optional Card'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setReleaseModeInput('REQUIRED')}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap ${
                        releaseModeInput === 'REQUIRED' ? 'btn-crimson' : 'btn-surface'
                      }`}
                    >
                      {lang === 'bn' ? 'বাধ্যতামূলক APK আপডেট' : 'Required Force Update'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'bn'
                    ? 'কী কী নতুন যুক্ত বা পরিবর্তন হয়েছে (Changelog) *'
                    : 'Release Notes / Changelog *'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={360}
                  value={releaseNotesInput}
                  onChange={(e) => setReleaseNotesInput(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: নতুন হাসপাতাল লিস্ট, দ্রুত কলিং ও ডিজাইন আপডেট যুক্ত করা হয়েছে।'
                      : 'e.g. Added new features, faster donor search, and bug fixes.'
                  }
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'bn'
                    ? 'সরাসরি নতুন .APK ডাউনলোড লিংক (ঐচ্ছিক — শুধু https:// লিংক)'
                    : 'Direct .APK / Play Store URL (Optional, https://)'}
                </label>
                <input
                  type="url"
                  maxLength={200}
                  value={releaseApkUrlInput}
                  onChange={(e) => setReleaseApkUrlInput(e.target.value)}
                  placeholder="https://example.com/bloodsearch-latest.apk"
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isPublishingAppUpdate || !releaseNotesInput.trim()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl btn-crimson font-bold text-xs inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <Smartphone className="w-4 h-4 shrink-0" />
                <span>
                  {isPublishingAppUpdate
                    ? lang === 'bn'
                      ? 'আপডেট পাঠানো হচ্ছে...'
                      : 'Publishing Update...'
                    : lang === 'bn'
                    ? 'সকল ইউজারের কাছে অ্যাপ/APK আপডেট পুশ করুন'
                    : 'Push App / APK Update to All Users'}
                </span>
              </button>
            </form>
          </div>

          {/* 2. Live Global Megaphone Broadcast */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Megaphone className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {lang === 'bn'
                    ? 'লাইভ মেগাফোন ঘোষণা (সকল ইউজারের স্ক্রিনে তাৎক্ষণিক ব্যানার)'
                    : 'Live Global Megaphone Broadcast'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lang === 'bn'
                    ? 'জাতীয় দুর্যোগ, ডেঙ্গু জরুরি রক্তের ডাক বা রক্তদান ক্যাম্পের নোটিশ ১-ক্লিকে পুরো অ্যাপে পাঠান'
                    : 'Push urgent announcements or blood camp alerts to all connected users in real time'}
                </p>
              </div>
            </div>

            <form onSubmit={handlePublishAnnouncement} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(
                  [
                    { id: 'CRITICAL', label: 'জরুরি রক্তের ডাক (CRITICAL)' },
                    { id: 'CAMPAIGN', label: 'রক্তদান ক্যাম্পেইন (CAMPAIGN)' },
                    { id: 'INFO', label: 'সাধারণ বিজ্ঞপ্তি (INFO)' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setBroadcastUrgency(p.id)}
                    className={`min-h-[42px] py-2 px-3 rounded-xl text-xs font-bold cursor-pointer ${
                      broadcastUrgency === p.id ? 'btn-crimson' : 'btn-surface'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'bn' ? 'শিরোনাম (ঐচ্ছিক)' : 'Title (Optional)'}
                </label>
                <input
                  type="text"
                  maxLength={120}
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="যেমন: জরুরি প্লাটিলেট ও রক্তের ডাক — ঢাকা ও চট্টগ্রাম"
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'bn' ? 'ঘোষণার মূল বার্তা *' : 'Broadcast Message *'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={500}
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  placeholder="যেমন: ডেঙ্গু ওয়ার্ডে জরুরি O- এবং B+ প্লাটিলেট ডোনার প্রয়োজন — আজই যোগাযোগ করুন!"
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isPublishingBroadcast || !broadcastMsg.trim()}
                className="min-h-[44px] px-4 py-2.5 rounded-xl btn-obsidian disabled:opacity-50 font-bold text-xs cursor-pointer"
              >
                {isPublishingBroadcast
                  ? lang === 'bn'
                    ? 'প্রকাশিত হচ্ছে...'
                    : 'Publishing...'
                  : lang === 'bn'
                    ? 'এখনই পুরো অ্যাপে লাইভ ঘোষণা পাঠান'
                    : 'Publish Live Broadcast Now'}
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {lang === 'bn'
                  ? `বর্তমানে সক্রিয় ঘোষণাসমূহ (${announcements.length})`
                  : `Currently Active Broadcasts (${announcements.length})`}
              </div>
              {announcements.length === 0 ? (
                <p className="text-xs text-slate-500">
                  {lang === 'bn'
                    ? 'এই মুহূর্তে কোনো সক্রিয় মেগাফোন ব্যানার চালু নেই।'
                    : 'No active megaphone broadcasts right now.'}
                </p>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                        {ann.urgency} · {ann.title} · {ann.updatedAtLabel}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                        {ann.message}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        adminDeactivateAnnouncementInFirestore(ann.id)
                          .then(() =>
                            showTempToast(
                              lang === 'bn' ? '✓ ঘোষণা বন্ধ করা হয়েছে' : '✓ Broadcast deactivated'
                            )
                          )
                          .catch(() => {});
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl btn-soft-rose text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {lang === 'bn' ? 'বন্ধ করুন' : 'Stop'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: SCAM REPORT MODERATION & SMART DONOR ID VERIFIER */}
      {adminTab === 'scam' && (
        <div className="space-y-4">
          {/* Smart Donor ID Checker */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {lang === 'bn'
                ? '🔍 স্মার্ট ডোনার আইডি ও ভেরিফিকেশন চেকার'
                : '🔍 Smart Donor ID & Verification Checker'}
            </h3>
            <input
              type="text"
              value={donorIdLookupQuery}
              onChange={(e) => setDonorIdLookupQuery(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'ডোনার আইডি, নাম বা ফোন নম্বর লিখে সত্যতা যাচাই করুন...'
                  : 'Enter Donor ID, name, or phone to verify...'
              }
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
            {donorIdLookupQuery.trim() && (
              <div className="space-y-2">
                {donors
                  .filter((d) => {
                    const q = donorIdLookupQuery.trim().toLowerCase();
                    return (
                      d.id.toLowerCase().includes(q) ||
                      d.name.toLowerCase().includes(q) ||
                      d.phone.toLowerCase().includes(q)
                    );
                  })
                  .slice(0, 5)
                  .map((d) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-black text-slate-900 dark:text-white">
                          {d.name} ({d.bloodGroup})
                        </span>
                        <span className="block text-[11px] text-slate-600 dark:text-slate-400">
                          ID: {d.id} · {d.district} · {d.totalDonations} বার রক্তদান
                        </span>
                      </div>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">
                        {d.verifiedBadge ? '✓ Verified Donor' : 'Registered'}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Scam Reports Queue */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {lang === 'bn'
                  ? '🛡️ প্রতারক / অগ্রিম বিকাশ ভাড়া দাবি রিপোর্ট তালিকা'
                  : '🛡️ Anti-Scam & Advance Fare Report Queue'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'রোগীর পরিবারের পাঠানো স্ক্যাম রিপোর্ট যাচাই করে ব্লকলিস্টে রাখুন'
                  : 'Review and block reported scam numbers or suspicious profiles'}
              </p>
            </div>

            {scamReports.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                {lang === 'bn'
                  ? '✓ কোনো অমীমাংসিত প্রতারণার রিপোর্ট নেই।'
                  : '✓ Zero pending scam reports.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {scamReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-black text-slate-900 dark:text-white">
                        {rep.suspectName} · <span className="font-mono">{rep.suspectPhone}</span>{' '}
                        · <span className="text-rose-600">{rep.status}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{rep.reason}</p>
                      <div className="text-[11px] text-slate-500">
                        Reported by: {rep.reporterName} · {rep.createdAtLabel}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          adminUpdateScamReportStatusInFirestore(rep.id, 'BLOCKED')
                            .then(() => showTempToast('✓ প্রতারক ব্লকলিস্টে যুক্ত হয়েছে'))
                            .catch(() => {});
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                      >
                        {lang === 'bn' ? 'ব্লক করুন' : 'Block'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          adminUpdateScamReportStatusInFirestore(rep.id, 'DISMISSED')
                            .then(() => showTempToast('✓ রিপোর্ট নিষ্পত্তি হয়েছে'))
                            .catch(() => {});
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold cursor-pointer"
                      >
                        {lang === 'bn' ? 'বাতিল' : 'Dismiss'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          adminDeleteScamReportInFirestore(rep.id).catch(() => {});
                        }}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: SMART DATABASE EXPLORER, AUTO-HYGIENE & ZERO-TRUST PENETRATION SHIELD */}
      {adminTab === 'database' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    {lang === 'bn'
                      ? 'লাইভ ক্লাউড ডাটাবেস কন্ট্রোল সেন্টার ও স্মার্ট অটোমেশন'
                      : 'Live Cloud Database Control Center & Smart Automation'}
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">
                  Project: {FIREBASE_PROJECT_ID} · DB: {FIRESTORE_DATABASE_ID}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href={FIREBASE_DATA_CONSOLE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'Firebase ডাটাবেস টেবিল খুলুন' : 'Open Firebase Data'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={FIREBASE_RULES_CONSOLE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'bn' ? 'সিকিউরিটি রুলস দেখুন' : 'Inspect Rules'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Live Cloud Counts & Latency */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">
                  {lang === 'bn' ? 'সার্ভার পিং' : 'Latency'}
                </span>
                <span className="text-lg font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {dbHealth ? `${dbHealth.latencyMs} ms` : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">
                  {lang === 'bn' ? 'ক্লাউড ডোনার' : 'Cloud Donors'}
                </span>
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {dbHealth ? dbHealth.counts.publicDonors : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">
                  {lang === 'bn' ? 'মোট SOS কার্ড' : 'Cloud SOS'}
                </span>
                <span className="text-lg font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                  {dbHealth ? dbHealth.counts.publicRequests : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">
                  {lang === 'bn' ? 'সম্পন্ন SOS' : 'Completed SOS'}
                </span>
                <span className="text-lg font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                  {dbHealth ? dbHealth.counts.fulfilledOrCancelledRequests : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">
                  {lang === 'bn' ? 'চ্যাট মেসেজ' : 'Community Msgs'}
                </span>
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {dbHealth ? dbHealth.counts.communityMessages : '—'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block">
                  {lang === 'bn' ? 'কৃতজ্ঞতা নোট' : 'Gratitude'}
                </span>
                <span className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {dbHealth ? dbHealth.counts.gratitudeNotes : '—'}
                </span>
              </div>
            </div>

            {/* Smart Database Operations Bar: Live Penetration Scan + Completed SOS Hygiene + CSV/JSON Backups */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunSmartDbDiagnostic}
                  disabled={isScanningDb}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanningDb ? 'animate-spin' : ''}`} />
                  <span>
                    {isScanningDb
                      ? lang === 'bn'
                        ? 'সিকিউরিটি স্ক্যান চলছে...'
                        : 'Scanning...'
                      : lang === 'bn'
                        ? 'জিরো-ট্রাস্ট পেনিট্রেশন টেস্ট চালান'
                        : 'Run Penetration Test'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSmartCleanCompletedSos}
                  disabled={isCleaningFulfilled}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {isCleaningFulfilled
                      ? lang === 'bn'
                        ? 'পরিষ্কার হচ্ছে...'
                        : 'Cleaning...'
                      : lang === 'bn'
                        ? 'সম্পন্ন SOS অটো-ক্লিন করুন (কোটা সাশ্রয়)'
                        : 'Clean Completed SOS'}
                  </span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsvBackup}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ডোনার ব্যাকআপ (.CSV)' : 'Export .CSV'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJsonBackup}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'সম্পূর্ণ স্ন্যাপশট (.JSON)' : 'Full Backup .JSON'}</span>
                </button>
              </div>
            </div>

            {/* Penetration Probe Verdict Table */}
            {dbHealth && (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="py-2.5 px-3 font-semibold">
                        {lang === 'bn' ? 'সিকিউরিটি শিল্ড টেস্ট' : 'Security Probe'}
                      </th>
                      <th className="py-2.5 px-3 font-semibold font-mono">
                        {lang === 'bn' ? 'অ্যাটাক ভেক্টর' : 'Vector'}
                      </th>
                      <th className="py-2.5 px-3 font-semibold">
                        {lang === 'bn' ? 'লাইভ সার্ভার ফলাফল' : 'Server Verdict'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {dbHealth.probes.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {lang === 'bn' ? p.nameBn : p.nameEn}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {p.attackVector}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          <span
                            className={
                              p.blockedAsExpected
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {p.blockedAsExpected ? '✓ ' : '✕ '}
                            {p.serverVerdict}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Complete 12-Path Firestore Architecture Reference */}
          <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3">
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {lang === 'bn'
                  ? `ডাটাবেস কালেকশন ম্যাপ ও স্মার্ট সুরক্ষা নিয়মাবলি (${DATABASE_COLLECTION_ARCHITECTURES.length}টি পাথ)`
                  : `Cloud Firestore Collection Architecture (${DATABASE_COLLECTION_ARCHITECTURES.length} Paths)`}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? 'প্রতিটি টেবিল/কালেকশন কীভাবে কাজ করে এবং হ্যাকার বা বট থেকে কীভাবে সুরক্ষিত তা নিচে দেখুন'
                  : 'Detailed breakdown of schema fields, access gates, and smart automated rules'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                    <th className="py-2.5 px-3 font-semibold">
                      {lang === 'bn' ? 'কালেকশন পাথ ও ফিল্ড' : 'Collection Path & Fields'}
                    </th>
                    <th className="py-2.5 px-3 font-semibold">
                      {lang === 'bn' ? 'অ্যাক্সেস পলিসি' : 'Access Gate'}
                    </th>
                    <th className="py-2.5 px-3 font-semibold">
                      {lang === 'bn' ? 'স্মার্ট অটোমেশন ও ফায়ারওয়াল' : 'Smart Behavior & Firewall'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {DATABASE_COLLECTION_ARCHITECTURES.map((col) => (
                    <tr key={col.id} className="align-top">
                      <td className="py-3 px-3 min-w-[200px]">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {lang === 'bn' ? col.titleBn : col.titleEn}
                        </div>
                        <div className="font-mono text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                          {col.path}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500 mt-1">
                          {col.fieldsSummary}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                        {lang === 'bn' ? col.tierLabelBn : col.tierLabelEn}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 leading-relaxed min-w-[250px]">
                        {lang === 'bn' ? col.smartBehaviorBn : col.smartBehaviorEn}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
