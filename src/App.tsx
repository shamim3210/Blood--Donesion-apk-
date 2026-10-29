import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import {
  ActiveTab,
  Language,
  Donor,
  BloodRequest,
  AuditLogEntry,
  BloodGroup,
  RequestAlertItem,
  LiveDonorTrip,
  LiveDonorTripStatus,
} from './types';
import {
  INITIAL_DONORS,
  INITIAL_REQUESTS,
  INITIAL_AUDIT_LOGS,
  isSeedDonorId,
  isSeedRequestId,
  isSeedAuditId,
  evictSeedsProgressively,
  scrubFakeLocalStorageOnBoot,
} from './data/mockDonors';
import { MobileAppHeader } from './components/mobile/MobileAppHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DonorHomeView } from './components/donor/DonorHomeView';
import { DonorSearch } from './components/DonorSearch';
import { RequestsFeed } from './components/RequestsFeed';
import { PhoneRevealModal } from './components/PhoneRevealModal';
import { RegisterDonorModal } from './components/RegisterDonorModal';
import { RequestBloodWizard } from './components/donor/RequestBloodWizard';
import { AuthModuleModal } from './components/auth/AuthModuleModal';
import { PwaInstallPrompt } from './components/ecosystem/PwaInstallPrompt';
import { AppUpdateBannerModal } from './components/ecosystem/AppUpdateBannerModal';
import {
  canDonorGiveToPatient,
  playEmergencySosChime,
  dispatchBrowserSosNotification,
  shareOrCopyEmergencyText,
} from './utils/sosAlertEngine';
import { isPhoneMaskedOrInvalid } from './utils/donorMatcher';
import {
  auth,
  onAuthStateChanged,
  completeRealGmailSignInIfPresent,
  fetchUserProfileFromFirestore,
  ensureUserAutoSyncedInFirestore,
  subscribeMyUserProfile,
  checkIsVerifiedAdminInFirestore,
  subscribePublicDonors,
  subscribePublicRequests,
  subscribeCommunityMessages,
  createBloodRequestInFirestore,
  submitVolunteerResponseInFirestore,
  adminDeleteRequestInFirestore,
  subscribeIncomingAlertsForDonor,
  respondToRequestAlertInFirestore,
  updateBloodRequestTrackingInFirestore,
  signOutReal,
  subscribeActiveAnnouncements,
  isBootstrappedAdminUser,
  ownerPurgeFakeCloudRecordsOnlyInFirestore,
  seedVerifiedStarterNetworkInFirestore,
  upsertLiveDonorTripInFirestore,
  updateLiveDonorTripStatusInFirestore,
  subscribeLiveTripsForSeeker,
  subscribeLiveTripsForDonor,
  maskPhoneNumber,
  DEFAULT_AVATAR_DATA_URI,
  OwnerAnnouncementItem,
  User as FirebaseUser,
} from './firebase';
import {
  resolveBangladeshCoordinates,
  watchRealDeviceGPS,
  requestRealDeviceGPSWithStatus,
  fetchUberStyleRoute,
  reverseGeocodeBangladeshCoords,
  calculateHaversineDistance,
  Coordinates,
} from './utils/geolocation';
import { useBrandConfig } from './config/brandConfig';
import type { CareSuiteTab } from './components/ecosystem/EmergencyCareSuiteModal';

// Lazy-loaded secondary views & modals for instant first-paint & zero mobile bundle lag
const BloodHelpOnboardingView = lazy(() =>
  import('./components/donor/BloodHelpOnboardingView').then((m) => ({
    default: m.BloodHelpOnboardingView,
  }))
);
const DonorProfileView = lazy(() =>
  import('./components/donor/DonorProfileView').then((m) => ({ default: m.DonorProfileView }))
);
const DonorBadgesView = lazy(() =>
  import('./components/donor/DonorBadgesView').then((m) => ({ default: m.DonorBadgesView }))
);
const DonorChatView = lazy(() =>
  import('./components/donor/DonorChatView').then((m) => ({ default: m.DonorChatView }))
);
const InteractiveMapView = lazy(() =>
  import('./components/donor/InteractiveMapView').then((m) => ({ default: m.InteractiveMapView }))
);
const AdminPortal = lazy(() =>
  import('./components/portals/AdminPortal').then((m) => ({ default: m.AdminPortal }))
);
const CompatibilityMatrixModal = lazy(() =>
  import('./components/CompatibilityMatrixModal').then((m) => ({
    default: m.CompatibilityMatrixModal,
  }))
);
const EligibilityChecker = lazy(() =>
  import('./components/EligibilityChecker').then((m) => ({ default: m.EligibilityChecker }))
);
const SecurityAuditModal = lazy(() =>
  import('./components/SecurityAuditModal').then((m) => ({ default: m.SecurityAuditModal }))
);
const ArchitectureDocModal = lazy(() =>
  import('./components/ecosystem/ArchitectureDocModal').then((m) => ({
    default: m.ArchitectureDocModal,
  }))
);
const FamilyVolunteerModal = lazy(() =>
  import('./components/ecosystem/FamilyVolunteerModal').then((m) => ({
    default: m.FamilyVolunteerModal,
  }))
);
const EmergencyDirectoryModal = lazy(() =>
  import('./components/ecosystem/EmergencyDirectoryModal').then((m) => ({
    default: m.EmergencyDirectoryModal,
  }))
);
const EmergencyPosterModal = lazy(() =>
  import('./components/ecosystem/EmergencyPosterModal').then((m) => ({
    default: m.EmergencyPosterModal,
  }))
);
const ThalassemiaManagerModal = lazy(() =>
  import('./components/ecosystem/ThalassemiaManagerModal').then((m) => ({
    default: m.ThalassemiaManagerModal,
  }))
);
const PlayStoreGuideModal = lazy(() =>
  import('./components/ecosystem/PlayStoreGuideModal').then((m) => ({
    default: m.PlayStoreGuideModal,
  }))
);
const CommercialHandoverModal = lazy(() =>
  import('./components/ecosystem/CommercialHandoverModal').then((m) => ({
    default: m.CommercialHandoverModal,
  }))
);
const EmergencyCareSuiteModal = lazy(() =>
  import('./components/ecosystem/EmergencyCareSuiteModal').then((m) => ({
    default: m.EmergencyCareSuiteModal,
  }))
);
const PdfExactShowcase = lazy(() =>
  import('./components/showcase/PdfExactShowcase').then((m) => ({ default: m.PdfExactShowcase }))
);

function ViewFallback({ lang }: { lang: Language }) {
  return (
    <div className="py-12 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
      {lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
    </div>
  );
}

export default function App() {
  const brand = useBrandConfig();
  // Theme state: Normal solid light or normal solid dark
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('bloodsearch_dark_mode');
    return saved !== null ? saved === 'true' : false;
  });

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('bloodsearch_lang') as Language;
    return saved === 'en' || saved === 'bn' ? saved : 'bn';
  });

  // Senior Clear-Read Accessibility Mode (112.5% root font scaling)
  const [seniorMode, setSeniorMode] = useState<boolean>(() => {
    return localStorage.getItem('bloodsearch_senior_mode') === 'true';
  });

  // View Mode: 'app' (Native responsive web/APK view) or 'deck' (8-Slide PDF Presentation)
  const [viewMode, setViewMode] = useState<'app' | 'deck'>('app');

  // Active navigation tab & dynamic unread chat badge
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const activeTabRef = React.useRef<ActiveTab>('home');
  activeTabRef.current = activeTab;
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [appShareToast, setAppShareToast] = useState<string | null>(null);

  // Track active Cloud Firestore IDs so additions, edits, AND deletions sync automatically
  const cloudDonorIdsRef = React.useRef<Set<string>>(new Set());
  const cloudRequestIdsRef = React.useRef<Set<string>>(new Set());
  const seenChatMsgIdsRef = React.useRef<Set<string> | null>(null);

  // Scroll naturally to top when changing tabs on mobile/desktop
  const handleSelectTab = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setViewMode('app');
    if (tab === 'chat') {
      setUnreadChatCount(0);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, []);

  // Scrub any legacy fake/seed records from localStorage immediately on boot
  useMemo(() => {
    scrubFakeLocalStorageOnBoot();
  }, []);

  // Application Data States (100% Real Registered Users & Real SOS Requests)
  const [donors, setDonors] = useState<Donor[]>(() => {
    const saved = localStorage.getItem('bloodsearch_donors');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const realSaved = parsed.filter((d) => d && !isSeedDonorId(d.id));
          return evictSeedsProgressively(realSaved, INITIAL_DONORS);
        }
      } catch {
        return evictSeedsProgressively([], INITIAL_DONORS);
      }
    }
    return evictSeedsProgressively([], INITIAL_DONORS);
  });

  const [requests, setRequests] = useState<BloodRequest[]>(() => {
    const saved = localStorage.getItem('bloodsearch_requests');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const realSaved = parsed.filter((r) => r && !isSeedRequestId(r.id));
          return evictSeedsProgressively(realSaved, INITIAL_REQUESTS);
        }
      } catch {
        return evictSeedsProgressively([], INITIAL_REQUESTS);
      }
    }
    return evictSeedsProgressively([], INITIAL_REQUESTS);
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('bloodsearch_audit_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const realSaved = parsed.filter((a) => a && !isSeedAuditId(a.id));
          return evictSeedsProgressively(realSaved, INITIAL_AUDIT_LOGS);
        }
      } catch {
        return evictSeedsProgressively([], INITIAL_AUDIT_LOGS);
      }
    }
    return evictSeedsProgressively([], INITIAL_AUDIT_LOGS);
  });

  // Modals & Deep-Action Target States
  const [selectedDonorForPhone, setSelectedDonorForPhone] = useState<Donor | null>(null);
  const [activeDonorForChat, setActiveDonorForChat] = useState<Donor | null>(null);
  const [pendingRespondRequest, setPendingRespondRequest] = useState<BloodRequest | null>(null);
  const [focusedMapLocationId, setFocusedMapLocationId] = useState<string | null>(null);
  const [focusedLiveTripId, setFocusedLiveTripId] = useState<string | null>(null);
  const [localLiveTrips, setLocalLiveTrips] = useState<LiveDonorTrip[]>(() => {
    try {
      const saved = localStorage.getItem('bloodsearch_live_donor_trips');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [cloudSeekerTrips, setCloudSeekerTrips] = useState<LiveDonorTrip[]>([]);
  const [cloudDonorTrips, setCloudDonorTrips] = useState<LiveDonorTrip[]>([]);

  const liveDonorTrips = useMemo<LiveDonorTrip[]>(() => {
    const byId = new Map<string, LiveDonorTrip>();
    for (const t of localLiveTrips) {
      if (t && t.id) byId.set(t.id, t);
    }
    for (const t of cloudDonorTrips) {
      if (t && t.id) byId.set(t.id, t);
    }
    for (const t of cloudSeekerTrips) {
      if (t && t.id) byId.set(t.id, t);
    }
    return Array.from(byId.values()).sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  }, [localLiveTrips, cloudDonorTrips, cloudSeekerTrips]);
  const [searchPreset, setSearchPreset] = useState<{
    bloodGroup: BloodGroup | 'ALL';
    district: string;
    nonce: number;
  }>({ bloodGroup: 'ALL', district: 'ALL', nonce: 0 });
  const [sosPreset, setSosPreset] = useState<{
    bloodGroup?: BloodGroup;
    district?: string;
    hospitalName?: string;
  }>({});
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState<boolean>(false);
  const [isSOSWizardOpen, setIsSOSWizardOpen] = useState<boolean>(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [registerInitialRole, setRegisterInitialRole] = useState<'USER' | 'ADMIN'>('USER');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState<boolean>(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState<boolean>(false);
  const [isPosterModalOpen, setIsPosterModalOpen] = useState<boolean>(false);
  const [isThalassemiaModalOpen, setIsThalassemiaModalOpen] = useState<boolean>(false);
  const [isPlayStoreModalOpen, setIsPlayStoreModalOpen] = useState<boolean>(false);
  const [isCommercialModalOpen, setIsCommercialModalOpen] = useState<boolean>(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);
  const [careSuiteTab, setCareSuiteTab] = useState<CareSuiteTab | null>(null);
  const [activeAnnouncements, setActiveAnnouncements] = useState<OwnerAnnouncementItem[]>([]);
  const [dismissedAnnouncementIds, setDismissedAnnouncementIds] = useState<string[]>([]);

  const openSOSWithContext = useCallback(
    (ctx?: { bloodGroup?: BloodGroup; district?: string; hospitalName?: string }) => {
      setSosPreset(ctx || {});
      setIsSOSWizardOpen(true);
    },
    []
  );

  const handleQuickSearchByGroup = useCallback(
    (group: BloodGroup | 'ALL', district: string = 'ALL') => {
      setSearchPreset((prev) => ({
        bloodGroup: group,
        district: district || 'ALL',
        nonce: prev.nonce + 1,
      }));
      handleSelectTab('search');
    },
    [handleSelectTab]
  );

  const handleFocusMapLocation = useCallback(
    (locationId?: string) => {
      setFocusedMapLocationId(locationId || null);
      handleSelectTab('map');
    },
    [handleSelectTab]
  );

  const openRegisterWithRole = useCallback((role: 'USER' | 'ADMIN' = 'USER') => {
    setRegisterInitialRole(role);
    setIsRegisterModalOpen(true);
  }, []);

  const [liveFirebaseUser, setLiveFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentSavedUser, setCurrentSavedUser] = useState<Record<string, any> | null>(() => {
    try {
      const raw = localStorage.getItem('bloodsearch_current_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [incomingDonorAlerts, setIncomingDonorAlerts] = useState<RequestAlertItem[]>([]);
  const [unsuccessfulDonorIds, setUnsuccessfulDonorIds] = useState<string[]>([]);
  const [confirmedDonorId, setConfirmedDonorId] = useState<string | null>(null);
  const markedViewedAlertIdsRef = React.useRef<Set<string>>(new Set());

  // Sync local profile edits (Name, Blood Group, Custom Area/Neighborhood, Photo) across Header & Donor Cards immediately
  useEffect(() => {
    const syncSavedUser = () => {
      try {
        const raw = localStorage.getItem('bloodsearch_current_user');
        const parsed = raw ? JSON.parse(raw) : null;
        setCurrentSavedUser(parsed);
        if (parsed && parsed.id && parsed.name && parsed.bloodGroup) {
          setDonors((prev) => {
            const existing = prev.find((d) => d.id === parsed.id);
            const updatedCard: Donor = {
              ...(existing || {
                rating: 5.0,
                reviewsCount: 0,
                isCloudRecord: true,
              }),
              id: parsed.id,
              name: parsed.name,
              bloodGroup: parsed.bloodGroup,
              division: parsed.division || existing?.division || 'dhaka',
              district: parsed.district || existing?.district || 'dhaka',
              upazila: parsed.upazila || existing?.upazila || 'Dhaka',
              phone: parsed.shareDirectContact
                ? parsed.phone
                : maskPhoneNumber(parsed.phone || ''),
              whatsappPhone: parsed.shareDirectContact
                ? parsed.whatsappPhone || parsed.phone
                : undefined,
              available: parsed.availableToDonate !== false,
              availabilityStatus: parsed.availabilityStatus || 'AVAILABLE',
              availabilityConfirmedAtMs:
                parsed.availabilityConfirmedAtMs || existing?.availabilityConfirmedAtMs || Date.now(),
              shareDirectContact: Boolean(parsed.shareDirectContact),
              contactVisibility: parsed.contactVisibility || 'REQUEST_ONLY',
              allowCall: parsed.allowCall !== false,
              allowWhatsApp: parsed.allowWhatsApp !== false,
              allowSms: parsed.allowSms !== false,
              emergencyAlertsOptIn: parsed.emergencyAlertsOptIn !== false,
              alertsPaused: parsed.alertsPaused === true,
              lastDonatedDate: parsed.lastDonationDate || existing?.lastDonatedDate || '',
              totalDonations: parsed.totalDonations ?? existing?.totalDonations ?? 0,
              verifiedBadge: parsed.role === 'ADMIN' || Boolean(existing?.verifiedBadge),
              age: parsed.age || existing?.age || 25,
              gender: parsed.gender || existing?.gender || 'MALE',
              weightKg: parsed.weightKg || existing?.weightKg || 62,
              hospitalAffiliation:
                parsed.role === 'ADMIN'
                  ? 'অ্যাডমিন ও রক্ত সমন্বয়ক'
                  : existing?.hospitalAffiliation || 'স্বেচ্ছাসেবী রক্তদাতা',
              avatar: parsed.photoUrl || existing?.avatar || DEFAULT_AVATAR_DATA_URI,
            };
            const others = prev.filter((d) => !isSeedDonorId(d.id) && d.id !== parsed.id);
            return evictSeedsProgressively([updatedCard, ...others], INITIAL_DONORS);
          });
        }
      } catch {}
    };
    window.addEventListener('bloodsearch_user_changed', syncSavedUser);
    window.addEventListener('storage', syncSavedUser);
    return () => {
      window.removeEventListener('bloodsearch_user_changed', syncSavedUser);
      window.removeEventListener('storage', syncSavedUser);
    };
  }, []);

  // Live SOS Sound & Real-Time Matching Radar
  const [sosSoundEnabled, setSosSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('bloodsearch_sos_sound');
    return saved !== null ? saved === 'true' : true;
  });
  const [liveSosBannerReq, setLiveSosBannerReq] = useState<BloodRequest | null>(null);
  const seenRequestIdsRef = React.useRef<Set<string> | null>(null);

  const toggleSosSound = useCallback(() => {
    setSosSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('bloodsearch_sos_sound', String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const activeIds = requests.filter((r) => r.status === 'ACTIVE').map((r) => r.id);
    if (seenRequestIdsRef.current === null) {
      seenRequestIdsRef.current = new Set(activeIds);
      return;
    }

    let myGroup: BloodGroup = 'O-';
    let alertsPausedOrDnd = false;
    try {
      const raw = localStorage.getItem('bloodsearch_current_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.bloodGroup) myGroup = parsed.bloodGroup;
        if (
          parsed?.alertsPaused === true ||
          parsed?.availabilityStatus === 'DND' ||
          parsed?.emergencyAlertsOptIn === false
        ) {
          alertsPausedOrDnd = true;
        }
      }
    } catch {}

    if (alertsPausedOrDnd) return;

    for (const req of requests) {
      if (req.status === 'ACTIVE' && !seenRequestIdsRef.current.has(req.id)) {
        seenRequestIdsRef.current.add(req.id);
        if (canDonorGiveToPatient(myGroup, req.bloodGroup)) {
          setLiveSosBannerReq(req);
          if (sosSoundEnabled) {
            playEmergencySosChime();
          }
          dispatchBrowserSosNotification(req, lang);
        }
      }
    }
  }, [requests, sosSoundEnabled, lang]);

  // Real Firebase Auth & Cloud Firestore Live Listeners
  useEffect(() => {
    completeRealGmailSignInIfPresent().catch(() => {});

    let unsubProfile: (() => void) | null = null;
    let unsubDonorAlerts: (() => void) | null = null;
    let unsubSeekerTrips: (() => void) | null = null;
    let unsubDonorTrips: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setLiveFirebaseUser(u);
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }
      if (unsubDonorAlerts) {
        unsubDonorAlerts();
        unsubDonorAlerts = null;
      }
      if (unsubSeekerTrips) {
        unsubSeekerTrips();
        unsubSeekerTrips = null;
      }
      if (unsubDonorTrips) {
        unsubDonorTrips();
        unsubDonorTrips = null;
      }
      if (u) {
        try {
          const syncedProfile = await ensureUserAutoSyncedInFirestore(u);
          if (syncedProfile) {
            localStorage.setItem('bloodsearch_current_user', JSON.stringify(syncedProfile));
            window.dispatchEvent(new Event('bloodsearch_user_changed'));

            // Immediately upsert signed-in real user in local donors state while Cloud snapshot syncs
            setDonors((prev) => {
              const existing = prev.find((d) => d.id === syncedProfile.id);
              const autoDonorCard: Donor = {
                ...(existing || {}),
                id: syncedProfile.id,
                name: syncedProfile.name,
                bloodGroup: syncedProfile.bloodGroup,
                division: syncedProfile.division || 'dhaka',
                district: syncedProfile.district || 'dhaka',
                upazila: syncedProfile.upazila || 'dhanmondi',
                phone: syncedProfile.shareDirectContact
                  ? syncedProfile.phone
                  : maskPhoneNumber(syncedProfile.phone),
                whatsappPhone: syncedProfile.shareDirectContact
                  ? syncedProfile.whatsappPhone || syncedProfile.phone
                  : undefined,
                available: syncedProfile.availableToDonate !== false,
                availabilityStatus: syncedProfile.availabilityStatus || 'AVAILABLE',
                availabilityConfirmedAtMs: syncedProfile.availabilityConfirmedAtMs || Date.now(),
                shareDirectContact: Boolean(syncedProfile.shareDirectContact),
                contactVisibility: syncedProfile.contactVisibility || 'REQUEST_ONLY',
                allowCall: syncedProfile.allowCall !== false,
                allowWhatsApp: syncedProfile.allowWhatsApp !== false,
                allowSms: syncedProfile.allowSms !== false,
                emergencyAlertsOptIn: syncedProfile.emergencyAlertsOptIn !== false,
                alertsPaused: syncedProfile.alertsPaused === true,
                isCloudRecord: true,
                lastDonatedDate: syncedProfile.lastDonationDate || '',
                totalDonations: syncedProfile.totalDonations || 0,
                verifiedBadge: syncedProfile.role === 'ADMIN' || Boolean(existing?.verifiedBadge),
                rating: existing?.rating ?? 5.0,
                reviewsCount: existing?.reviewsCount ?? 0,
                age: syncedProfile.age || 25,
                gender: syncedProfile.gender || 'MALE',
                weightKg: syncedProfile.weightKg || 62,
                hospitalAffiliation:
                  syncedProfile.role === 'ADMIN'
                    ? 'অ্যাডমিন ও রক্ত সমন্বয়ক'
                    : 'স্বেচ্ছাসেবী রক্তদাতা',
                avatar: syncedProfile.photoUrl || DEFAULT_AVATAR_DATA_URI,
              };
              const others = prev.filter((d) => d.id !== syncedProfile.id);
              return [autoDonorCard, ...others];
            });
          }

          // One-time cleanup of legacy fake IDs + live Cloud Firestore sync of 7 verified starter donors & 2 active requests
          if (isBootstrappedAdminUser(u)) {
            const seedKey = 'bloodsearch_verified_cloud_seeded_v4';
            if (localStorage.getItem(seedKey) !== 'done') {
              ownerPurgeFakeCloudRecordsOnlyInFirestore()
                .catch(() => 0)
                .then(() =>
                  seedVerifiedStarterNetworkInFirestore(INITIAL_DONORS, INITIAL_REQUESTS)
                )
                .then(() => {
                  localStorage.setItem(seedKey, 'done');
                })
                .catch(() => {});
            }
          }

          unsubProfile = subscribeMyUserProfile(u.uid, async (liveProfile) => {
            if (!liveProfile) return;
            const isAdmin = await checkIsVerifiedAdminInFirestore(u);
            if (isAdmin) liveProfile.role = 'ADMIN';
            localStorage.setItem('bloodsearch_current_user', JSON.stringify(liveProfile));
            window.dispatchEvent(new Event('bloodsearch_user_changed'));
          });
          unsubDonorAlerts = subscribeIncomingAlertsForDonor(u.uid, (alerts) => {
            const activePending = alerts.filter(
              (a) => a.deliveryState === 'DISPATCHED' || a.deliveryState === 'VIEWED'
            );
            setIncomingDonorAlerts(activePending);
            // Acknowledge VIEWED state once when displayed so seeker gets honest viewed count
            for (const al of activePending.slice(0, 3)) {
              if (
                al.deliveryState === 'DISPATCHED' &&
                !markedViewedAlertIdsRef.current.has(al.id)
              ) {
                markedViewedAlertIdsRef.current.add(al.id);
                respondToRequestAlertInFirestore({
                  alertId: al.id,
                  action: 'VIEWED',
                }).catch(() => {});
              }
            }
          });
          unsubSeekerTrips = subscribeLiveTripsForSeeker(u.uid, setCloudSeekerTrips);
          unsubDonorTrips = subscribeLiveTripsForDonor(u.uid, setCloudDonorTrips);
        } catch {}
      } else {
        setIncomingDonorAlerts([]);
        setCloudSeekerTrips([]);
        setCloudDonorTrips([]);
      }
    });

    let unsubDonors: (() => void) | null = null;
    let unsubRequests: (() => void) | null = null;
    let unsubAnnouncements: (() => void) | null = null;
    let unsubChatBadge: (() => void) | null = null;
    try {
      unsubDonors = subscribePublicDonors((cloudDonors) => {
        const nextCloudIds = new Set(cloudDonors.map((d) => d.id));
        const prevCloudIds = cloudDonorIdsRef.current;
        cloudDonorIdsRef.current = nextCloudIds;
        setDonors((prev) => {
          const realLocalOnly = prev.filter(
            (p) => !isSeedDonorId(p.id) && !nextCloudIds.has(p.id) && !prevCloudIds.has(p.id)
          );
          return evictSeedsProgressively([...cloudDonors, ...realLocalOnly], INITIAL_DONORS);
        });
      });
      unsubRequests = subscribePublicRequests((cloudReqs) => {
        const nextCloudIds = new Set(cloudReqs.map((r) => r.id));
        const prevCloudIds = cloudRequestIdsRef.current;
        cloudRequestIdsRef.current = nextCloudIds;
        setRequests((prev) => {
          const prevById = new Map(prev.map((p) => [p.id, p]));
          const mergedCloud = cloudReqs.map((cr) => {
            const existing = prevById.get(cr.id);
            const hasCloudValidPhone = !isPhoneMaskedOrInvalid(cr.contactPhone);
            const hasExistingValidPhone =
              existing && !isPhoneMaskedOrInvalid(existing.contactPhone);
            return {
              ...cr,
              contactPhone: hasCloudValidPhone
                ? cr.contactPhone
                : hasExistingValidPhone
                  ? existing.contactPhone
                  : cr.contactPhone,
              contactName:
                cr.contactName && cr.contactName !== cr.patientName
                  ? cr.contactName
                  : existing?.contactName || cr.contactName,
              responders:
                cr.responders.length > 0 ? cr.responders : existing?.responders || [],
            };
          });
          const realLocalOnly = prev.filter(
            (p) => !isSeedRequestId(p.id) && !nextCloudIds.has(p.id) && !prevCloudIds.has(p.id)
          );
          return evictSeedsProgressively([...mergedCloud, ...realLocalOnly], INITIAL_REQUESTS);
        });
      });
      unsubAnnouncements = subscribeActiveAnnouncements(setActiveAnnouncements);
      unsubChatBadge = subscribeCommunityMessages((msgs) => {
        const currentIds = msgs.map((m) => m.id);
        if (seenChatMsgIdsRef.current === null) {
          seenChatMsgIdsRef.current = new Set(currentIds);
          return;
        }
        let freshIncoming = 0;
        const myUid = auth.currentUser?.uid;
        for (const msg of msgs) {
          if (!seenChatMsgIdsRef.current.has(msg.id)) {
            seenChatMsgIdsRef.current.add(msg.id);
            if (!myUid || msg.senderUid !== myUid) {
              freshIncoming += 1;
            }
          }
        }
        if (freshIncoming > 0 && activeTabRef.current !== 'chat') {
          setUnreadChatCount((prev) => prev + freshIncoming);
        }
      });
    } catch {}

    const syncRealOnlyMode = () => {
      setDonors((prev) =>
        evictSeedsProgressively(
          prev.filter((d) => !isSeedDonorId(d.id)),
          INITIAL_DONORS
        )
      );
      setRequests((prev) =>
        evictSeedsProgressively(
          prev.filter((r) => !isSeedRequestId(r.id)),
          INITIAL_REQUESTS
        )
      );
      setAuditLogs((prev) =>
        evictSeedsProgressively(
          prev.filter((a) => !isSeedAuditId(a.id)),
          INITIAL_AUDIT_LOGS
        )
      );
    };
    window.addEventListener('bloodsearch_real_mode_changed', syncRealOnlyMode);

    return () => {
      window.removeEventListener('bloodsearch_real_mode_changed', syncRealOnlyMode);
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubDonorAlerts) unsubDonorAlerts();
      if (unsubSeekerTrips) unsubSeekerTrips();
      if (unsubDonorTrips) unsubDonorTrips();
      if (unsubDonors) unsubDonors();
      if (unsubRequests) unsubRequests();
      if (unsubAnnouncements) unsubAnnouncements();
      if (unsubChatBadge) unsubChatBadge();
    };
  }, []);

  // PWA / APK Home-Screen Shortcut & Shared Deep-Link Handler (?action=sos|search|chat|care&group=O-)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const groupParam = params.get('group') as BloodGroup | null;
      const districtParam = params.get('district');
      const validGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

      if (action || (groupParam && validGroups.includes(groupParam))) {
        if (groupParam && validGroups.includes(groupParam)) {
          setSearchPreset((prev) => ({
            bloodGroup: groupParam,
            district: districtParam || 'ALL',
            nonce: prev.nonce + 1,
          }));
          setActiveTab('search');
        }
        if (action === 'sos') {
          setSosPreset({
            bloodGroup: groupParam && validGroups.includes(groupParam) ? groupParam : undefined,
            district: districtParam || undefined,
          });
          setIsSOSWizardOpen(true);
        } else if (action === 'search') {
          setActiveTab('search');
        } else if (action === 'chat') {
          setActiveTab('chat');
        } else if (action === 'care') {
          setCareSuiteTab('maternity');
        }
        params.delete('action');
        params.delete('group');
        params.delete('district');
        const nextQuery = params.toString();
        const cleanUrl = window.location.pathname + (nextQuery ? `?${nextQuery}` : '');
        window.history.replaceState({}, '', cleanUrl);
      }
    } catch {}
  }, []);

  // Apply dark mode class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('bloodsearch_dark_mode', String(darkMode));
  }, [darkMode]);

  // Apply Senior Clear-Read Mode (112.5% font scaling) to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('senior-text', seniorMode);
    localStorage.setItem('bloodsearch_senior_mode', String(seniorMode));
  }, [seniorMode]);

  // Sync language to local storage
  useEffect(() => {
    localStorage.setItem('bloodsearch_lang', lang);
  }, [lang]);

  // Sync browser tab title with white-label brand config
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = `${brand.brandName} - ${brand.organizationName}`;
    }
  }, [brand.brandName, brand.organizationName]);

  // Debounced persistence to localStorage so large arrays/avatars NEVER block UI frames
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem('bloodsearch_donors', JSON.stringify(donors));
      } catch {}
    }, 450);
    return () => window.clearTimeout(timer);
  }, [donors]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem('bloodsearch_requests', JSON.stringify(requests));
      } catch {}
    }, 450);
    return () => window.clearTimeout(timer);
  }, [requests]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem('bloodsearch_audit_logs', JSON.stringify(auditLogs));
      } catch {}
    }, 450);
    return () => window.clearTimeout(timer);
  }, [auditLogs]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem('bloodsearch_live_donor_trips', JSON.stringify(localLiveTrips));
      } catch {}
    }, 450);
    return () => window.clearTimeout(timer);
  }, [localLiveTrips]);

  // Audit Logger helper
  const addAuditLog = useCallback((action: any, targetDetails: string) => {
    const newLog: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      action,
      actorName: 'Current Operator',
      targetDetails,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      securityHash: `sha256:${Math.random().toString(36).substring(2, 10)}...${Math.random()
        .toString(36)
        .substring(2, 6)}`,
    };
    setAuditLogs((prev) => {
      const realLogs = [newLog, ...prev.filter((a) => !isSeedAuditId(a.id))];
      return evictSeedsProgressively(realLogs, INITIAL_AUDIT_LOGS);
    });
  }, []);

  // Phone Reveal Action
  const handleRevealPhone = useCallback((donor: Donor) => {
    setSelectedDonorForPhone(donor);
    setIsPhoneModalOpen(true);
  }, []);

  // SOS Creation Action (Evicts 1 fake request automatically & avoids double-write if already dispatched)
  const handleSubmitSOS = useCallback(
    (newRequest: BloodRequest, opts?: { alreadySyncedToCloud?: boolean }) => {
      setRequests((prev) => {
        const realReqs = [
          newRequest,
          ...prev.filter((r) => !isSeedRequestId(r.id) && r.id !== newRequest.id),
        ];
        return evictSeedsProgressively(realReqs, INITIAL_REQUESTS);
      });
      if (!opts?.alreadySyncedToCloud) {
        createBloodRequestInFirestore(newRequest).catch(() => {});
      }
      handleSelectTab('requests');
    },
    [handleSelectTab]
  );

  const handleUpdateRequestLocal = useCallback(
    (reqId: string, patch: Partial<BloodRequest>) => {
      setRequests((prev) =>
        prev.map((r) => (r.id === reqId ? { ...r, ...patch } : r))
      );
    },
    []
  );

  const handleRecordContactOutcome = useCallback(
    (donor: Donor, outcome: 'CONFIRMED' | 'NO_ANSWER') => {
      if (outcome === 'NO_ANSWER') {
        setUnsuccessfulDonorIds((prev) =>
          prev.includes(donor.id) ? prev : [...prev, donor.id]
        );
      } else {
        setConfirmedDonorId(donor.id);
      }

      // Also sync contact tracking to the seeker's newest active blood request if present
      const myUid = auth.currentUser?.uid;
      const myActiveReq = requests.find(
        (r) =>
          r.status === 'ACTIVE' &&
          ((myUid && r.authorUid === myUid) || (!r.authorUid && r.id.startsWith('sos_')))
      );
      if (myActiveReq) {
        if (outcome === 'CONFIRMED') {
          handleUpdateRequestLocal(myActiveReq.id, {
            lifecycleState: 'DONOR_CONFIRMED',
            confirmedDonorId: donor.id,
            confirmedDonorName: donor.name,
          });
          updateBloodRequestTrackingInFirestore({
            requestId: myActiveReq.id,
            lifecycleState: 'DONOR_CONFIRMED',
            confirmedDonorId: donor.id,
            confirmedDonorName: donor.name,
          }).catch(() => {});
        } else {
          handleUpdateRequestLocal(myActiveReq.id, {
            lifecycleState: 'CONTACT_ATTEMPTED',
            contactAttemptsCount: (myActiveReq.contactAttemptsCount || 0) + 1,
          });
          updateBloodRequestTrackingInFirestore({
            requestId: myActiveReq.id,
            lifecycleState: 'CONTACT_ATTEMPTED',
            incrementContactAttempt: true,
          }).catch(() => {});
        }
      }
    },
    [requests, handleUpdateRequestLocal]
  );

  // Volunteer Response to SOS
  const handleRespondToRequest = useCallback(
    async (
      requestId: string,
      responderName: string,
      responderPhone: string,
      group: BloodGroup,
      note?: string
    ): Promise<{
      ok: boolean;
      reason?: string;
      seekerContactName?: string;
      seekerContactPhone?: string;
      authorUid?: string;
    }> => {
      const res = await submitVolunteerResponseInFirestore({
        requestId,
        responderName,
        responderPhone,
        bloodGroup: group,
        note,
      });

      if (!res.ok && res.reason !== 'LOCAL_ONLY_REQUEST') {
        return res;
      }

      let localSeekerName = res.seekerContactName;
      let localSeekerPhone = res.seekerContactPhone;

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id === requestId) {
            if (!localSeekerPhone && !isPhoneMaskedOrInvalid(r.contactPhone)) {
              localSeekerPhone = r.contactPhone;
            }
            if (!localSeekerName && r.contactName) {
              localSeekerName = r.contactName;
            }
            const uid = auth.currentUser?.uid;
            if (uid && r.responders.some((resp) => resp.responderUid === uid)) {
              return r;
            }
            const newResponder = {
              id: uid ? `${requestId}__${uid}` : `resp-${Date.now()}`,
              responderUid: uid,
              name: responderName,
              phone: responderPhone,
              bloodGroup: group,
              timestamp: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              notes: note,
            };
            const nextUnits = Math.min(r.unitsNeeded, r.unitsCollected + 1);
            return {
              ...r,
              unitsCollected: nextUnits,
              respondedCount: Math.max((r.respondedCount || 0) + 1, r.responders.length + 1),
              status: nextUnits >= r.unitsNeeded ? 'FULFILLED' : r.status,
              responders: [...r.responders, newResponder],
            };
          }
          return r;
        })
      );

      addAuditLog(
        'RESPOND_SOS',
        `Volunteer ${responderName} (${group}) responded to request ${requestId}`
      );
      return {
        ok: true,
        seekerContactName: localSeekerName,
        seekerContactPhone: localSeekerPhone,
        authorUid: res.authorUid,
      };
    },
    [addAuditLog, requests]
  );

  const handleDeleteRequest = useCallback(async (reqId: string): Promise<boolean> => {
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
    setLocalLiveTrips((prev) => prev.filter((t) => t.requestId !== reqId));
    try {
      await adminDeleteRequestInFirestore(reqId);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleStartLiveDonorTrip = useCallback(
    async (
      req: BloodRequest,
      responderName: string,
      responderPhone: string,
      group: BloodGroup
    ): Promise<LiveDonorTrip> => {
      const safeReqId = req.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
      const myUid = auth.currentUser?.uid || currentSavedUser?.id || 'local_donor';
      const tripId = `${safeReqId}__${myUid}`;

      const hospitalCoords = resolveBangladeshCoordinates({
        district: req.district,
        upazila: req.upazila,
        division: req.division || 'dhaka',
        hospital: req.hospitalName,
      });

      const savedDistrict = String(currentSavedUser?.district || req.district || 'dhaka');
      const savedUpazila = String(currentSavedUser?.upazila || '');
      const savedDivision = String(currentSavedUser?.division || req.division || 'dhaka');

      const gpsRes = await requestRealDeviceGPSWithStatus();
      const inBd =
        gpsRes.isRealGps &&
        gpsRes.coords.latitude >= 20.0 &&
        gpsRes.coords.latitude <= 27.0 &&
        gpsRes.coords.longitude >= 87.5 &&
        gpsRes.coords.longitude <= 93.0;

      let donorCoords: Coordinates = inBd
        ? gpsRes.coords
        : resolveBangladeshCoordinates({
            district: savedDistrict,
            upazila: savedUpazila,
            division: savedDivision,
          });

      if (!inBd && calculateHaversineDistance(donorCoords, hospitalCoords) < 0.12) {
        donorCoords = {
          latitude: Math.min(26.9, donorCoords.latitude + 0.0085),
          longitude: Math.min(92.9, donorCoords.longitude + 0.0065),
        };
      }

      const [route, geo] = await Promise.all([
        fetchUberStyleRoute(donorCoords, hospitalCoords),
        reverseGeocodeBangladeshCoords(donorCoords, lang),
      ]);

      const nowMs = Date.now();
      const localTrip: LiveDonorTrip = {
        id: tripId,
        requestId: safeReqId,
        seekerUid: req.authorUid || 'local_seeker',
        donorUid: myUid,
        donorName: responderName.trim() || 'Voluntary Donor',
        bloodGroup: group,
        responderPhone: responderPhone.trim(),
        hospitalName: req.hospitalName,
        district: req.district,
        lat: Number(donorCoords.latitude.toFixed(5)),
        lng: Number(donorCoords.longitude.toFixed(5)),
        hospitalLat: Number(hospitalCoords.latitude.toFixed(5)),
        hospitalLng: Number(hospitalCoords.longitude.toFixed(5)),
        distanceKm: Number(Math.max(0.2, route.roadDistanceKm).toFixed(1)),
        etaMinutes: Math.max(2, Math.round(route.etaMinutes)),
        areaLabel: geo.areaText || savedUpazila || req.district,
        tripStatus: 'ON_THE_WAY',
        createdAtMs: nowMs,
        updatedAtMs: nowMs,
      };

      setLocalLiveTrips((prev) => [
        localTrip,
        ...prev.filter((t) => t.id !== tripId),
      ]);

      upsertLiveDonorTripInFirestore({
        requestId: safeReqId,
        donorName: localTrip.donorName,
        bloodGroup: localTrip.bloodGroup,
        responderPhone: localTrip.responderPhone,
        hospitalName: localTrip.hospitalName,
        district: localTrip.district,
        lat: localTrip.lat,
        lng: localTrip.lng,
        hospitalLat: localTrip.hospitalLat,
        hospitalLng: localTrip.hospitalLng,
        distanceKm: localTrip.distanceKm,
        etaMinutes: localTrip.etaMinutes,
        areaLabel: localTrip.areaLabel,
        tripStatus: 'ON_THE_WAY',
      }).catch(() => {});

      return localTrip;
    },
    [currentSavedUser, lang]
  );

  const handleUpdateLiveDonorTripStatus = useCallback(
    async (tripId: string, nextStatus: LiveDonorTripStatus) => {
      const nowMs = Date.now();
      setLocalLiveTrips((prev) =>
        prev.map((t) =>
          t.id === tripId
            ? {
                ...t,
                tripStatus: nextStatus,
                distanceKm: nextStatus === 'ARRIVED' ? 0.1 : t.distanceKm,
                etaMinutes: nextStatus === 'ARRIVED' ? 1 : t.etaMinutes,
                updatedAtMs: nowMs,
              }
            : t
        )
      );
      await updateLiveDonorTripStatusInFirestore(tripId, nextStatus).catch(() => false);
    },
    []
  );

  const handleTrackLiveTripOnMap = useCallback(
    (tripId: string) => {
      setFocusedLiveTripId(tripId);
      handleSelectTab('map');
    },
    [handleSelectTab]
  );

  // Continuous Uber/Pathao Live GPS Streaming while current user is ON_THE_WAY to donate
  const myActiveOutgoingTrip = useMemo(() => {
    const myUid = liveFirebaseUser?.uid || currentSavedUser?.id || 'local_donor';
    return (
      liveDonorTrips.find(
        (t) => t.donorUid === myUid && t.tripStatus === 'ON_THE_WAY'
      ) || null
    );
  }, [liveDonorTrips, liveFirebaseUser?.uid, currentSavedUser?.id]);

  const lastTripSyncRef = React.useRef<{ ts: number; lat: number; lng: number }>({
    ts: 0,
    lat: 0,
    lng: 0,
  });

  useEffect(() => {
    if (!myActiveOutgoingTrip) return;

    const stopWatch = watchRealDeviceGPS((coords) => {
      if (
        coords.latitude < 20.0 ||
        coords.latitude > 27.0 ||
        coords.longitude < 87.5 ||
        coords.longitude > 93.0
      ) {
        return;
      }

      const now = Date.now();
      const prev = lastTripSyncRef.current;
      const movedKm =
        prev.ts > 0
          ? calculateHaversineDistance(
              { latitude: prev.lat, longitude: prev.lng },
              coords
            )
          : 999;

      if (now - prev.ts < 8000 || movedKm < 0.03) return;
      lastTripSyncRef.current = {
        ts: now,
        lat: coords.latitude,
        lng: coords.longitude,
      };

      const hospCoords: Coordinates = {
        latitude: myActiveOutgoingTrip.hospitalLat,
        longitude: myActiveOutgoingTrip.hospitalLng,
      };

      Promise.all([
        fetchUberStyleRoute(coords, hospCoords),
        reverseGeocodeBangladeshCoords(coords, lang),
      ])
        .then(([route, geo]) => {
          const nextLat = Number(coords.latitude.toFixed(5));
          const nextLng = Number(coords.longitude.toFixed(5));
          const nextDist = Number(Math.max(0.1, route.roadDistanceKm).toFixed(1));
          const nextEta = Math.max(1, Math.round(route.etaMinutes));
          const nextArea = geo.areaText || myActiveOutgoingTrip.areaLabel;

          setLocalLiveTrips((list) =>
            list.map((item) =>
              item.id === myActiveOutgoingTrip.id && item.tripStatus === 'ON_THE_WAY'
                ? {
                    ...item,
                    lat: nextLat,
                    lng: nextLng,
                    distanceKm: nextDist,
                    etaMinutes: nextEta,
                    areaLabel: nextArea,
                    updatedAtMs: Date.now(),
                  }
                : item
            )
          );

          upsertLiveDonorTripInFirestore({
            requestId: myActiveOutgoingTrip.requestId,
            donorName: myActiveOutgoingTrip.donorName,
            bloodGroup: myActiveOutgoingTrip.bloodGroup,
            responderPhone: myActiveOutgoingTrip.responderPhone,
            hospitalName: myActiveOutgoingTrip.hospitalName,
            district: myActiveOutgoingTrip.district,
            lat: nextLat,
            lng: nextLng,
            hospitalLat: myActiveOutgoingTrip.hospitalLat,
            hospitalLng: myActiveOutgoingTrip.hospitalLng,
            distanceKm: nextDist,
            etaMinutes: nextEta,
            areaLabel: nextArea,
            tripStatus: 'ON_THE_WAY',
          }).catch(() => {});
        })
        .catch(() => {});
    });

    return () => stopWatch();
  }, [myActiveOutgoingTrip?.id, myActiveOutgoingTrip?.tripStatus, lang]);

  const handleStartChatWithRequester = useCallback(
    (req: BloodRequest) => {
      if (!req.authorUid) {
        handleSelectTab('chat');
        return;
      }
      const peerObj: Donor = {
        id: req.authorUid,
        name: req.contactName || req.patientName,
        bloodGroup: req.bloodGroup,
        division: req.division || 'dhaka',
        district: req.district || 'dhaka',
        upazila: req.upazila || 'dhanmondi',
        phone: !isPhoneMaskedOrInvalid(req.contactPhone) ? req.contactPhone : '017****00',
        whatsappPhone: !isPhoneMaskedOrInvalid(req.contactPhone) ? req.contactPhone : undefined,
        available: true,
        lastDonatedDate: '',
        totalDonations: 0,
        verifiedBadge: true,
        rating: 5,
        reviewsCount: 0,
        age: req.patientAge || 28,
        gender: 'MALE',
        weightKg: 60,
        hospitalAffiliation: req.hospitalName,
      };
      setActiveDonorForChat(peerObj);
      handleSelectTab('chat');
    },
    [handleSelectTab]
  );

  // Direct Quick-Share from Home Request Cards (Iframe-Safe)
  const handleQuickShareRequest = useCallback(
    async (req: BloodRequest) => {
      const contactStr = !isPhoneMaskedOrInvalid(req.contactPhone)
        ? req.contactPhone
        : req.hospitalName;
      const shareText =
        lang === 'bn'
          ? `জরুরি রক্তের আবেদন (${req.bloodGroup}) — ${Math.max(
              1,
              req.unitsNeeded - req.unitsCollected
            )} ব্যাগ প্রয়োজন।\nহাসপাতাল: ${req.hospitalName}, ${req.district}\nরোগী: ${req.patientName}\nযোগাযোগ: ${contactStr}`
          : `Urgent ${req.bloodGroup} Blood Needed (${Math.max(
              1,
              req.unitsNeeded - req.unitsCollected
            )} bag(s))\nHospital: ${req.hospitalName}, ${req.district}\nPatient: ${req.patientName}\nContact: ${contactStr}`;
      const outcome = await shareOrCopyEmergencyText({
        title: `${brand.brandName} SOS`,
        text: shareText,
        url: window.location.origin,
      });
      setAppShareToast(
        outcome === 'SHARED'
          ? lang === 'bn'
            ? `✓ ${req.bloodGroup} জরুরি আবেদন শেয়ার করা হয়েছে!`
            : `✓ ${req.bloodGroup} emergency request shared!`
          : lang === 'bn'
            ? `✓ ${req.bloodGroup} জরুরি আবেদনের সম্পূর্ণ তথ্য কপি হয়েছে — এখন WhatsApp/Facebook-এ পেস্ট করুন!`
            : `✓ ${req.bloodGroup} emergency details copied to clipboard!`
      );
      window.setTimeout(() => setAppShareToast(null), 3200);
    },
    [brand.brandName, lang]
  );

  // Direct Quick-Donate from Home Request Cards -> Opens that exact patient's Respond Modal
  const handleQuickDonateFromHome = useCallback(
    (req: BloodRequest) => {
      setPendingRespondRequest(req);
      handleSelectTab('requests');
    },
    [handleSelectTab]
  );

  // New Donor Registration (Evicts 1 fake donor automatically!)
  const handleRegisterDonor = useCallback((newDonor: Donor) => {
    setDonors((prev) => {
      const realDonors = [
        newDonor,
        ...prev.filter((d) => !isSeedDonorId(d.id) && d.id !== newDonor.id),
      ];
      return evictSeedsProgressively(realDonors, INITIAL_DONORS);
    });
  }, []);

  // Urgent active requests count
  const urgentRequests = useMemo(
    () => requests.filter((r) => r.status === 'ACTIVE' && r.urgency === 'CRITICAL'),
    [requests]
  );

  const liveUserLabel = liveFirebaseUser
    ? (currentSavedUser?.id === liveFirebaseUser.uid && currentSavedUser?.name
        ? String(currentSavedUser.name).trim()
        : '') ||
      liveFirebaseUser.displayName?.trim() ||
      liveFirebaseUser.email?.split('@')[0] ||
      liveFirebaseUser.phoneNumber ||
      (lang === 'bn' ? 'অ্যাকাউন্ট' : 'Account')
    : currentSavedUser?.name
      ? String(currentSavedUser.name).trim()
      : null;

  return (
    <div
      className={`min-h-dvh w-full max-w-[100vw] overflow-x-clip flex flex-col transition-colors duration-200 bg-app-canvas ${
        darkMode ? 'dark text-[#f8fafc]' : 'text-[#0f172a]'
      }`}
    >
      {/* 1. Unified Responsive Native Header */}
      <MobileAppHeader
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        lang={lang}
        setLang={setLang}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenSOSModal={() => setIsSOSWizardOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenRegisterModal={(role) => openRegisterWithRole(role || 'USER')}
        onOpenFamilyModal={() => setIsFamilyModalOpen(true)}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
        onOpenSlideDeck={() => {
          setViewMode('deck');
          window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        }}
        onOpenPlayStoreModal={() => setIsPlayStoreModalOpen(true)}
        onOpenCommercialModal={() => setIsCommercialModalOpen(true)}
        isDeckMode={viewMode === 'deck'}
        onExitDeckMode={() => setViewMode('app')}
        liveUserLabel={liveUserLabel}
        onSignOut={() => {
          signOutReal().catch(() => {});
        }}
        seniorMode={seniorMode}
        setSeniorMode={setSeniorMode}
        unreadSosCount={urgentRequests.length}
        unreadChatCount={unreadChatCount}
        sosSoundEnabled={sosSoundEnabled}
        onToggleSosSound={toggleSosSound}
      />

      {/* 2. Native Window-Scrolling App Body */}
      {viewMode === 'deck' ? (
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-16">
          <Suspense fallback={<ViewFallback lang={lang} />}>
            <PdfExactShowcase
              lang={lang}
              darkMode={darkMode}
              onOpenSOSModal={() => setIsSOSWizardOpen(true)}
            />
          </Suspense>
        </main>
      ) : (
        <main
          className={`@container flex-1 w-full max-w-6xl mx-auto px-3.5 sm:px-6 ${
            activeTab === 'chat' ? 'pt-3 pb-24 lg:pb-10' : 'pt-4 sm:pt-5 pb-24 lg:pb-12'
          }`}
        >
          {/* Quick Share Toast */}
          {appShareToast && (
            <div className="mb-3 p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm text-left">
              {appShareToast}
            </div>
          )}

          {/* Actionable Concurrent Donor Emergency Alert Inbox Banner */}
          {incomingDonorAlerts.slice(0, 1).map((alertItem) => (
            <div
              key={alertItem.id}
              className="mb-3.5 p-3.5 rounded-2xl bg-rose-700 text-white shadow-sm flex flex-wrap items-center justify-between gap-2.5 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-rose-100">
                  {lang === 'bn'
                    ? `জরুরি রক্তের আহ্বান (${alertItem.bloodGroup}) · ${alertItem.district}`
                    : `Direct Donor Alert (${alertItem.bloodGroup}) · ${alertItem.district}`}
                </div>
                <div className="text-xs sm:text-sm font-bold truncate mt-0.5">
                  {alertItem.hospitalName}
                  {alertItem.seekerCallbackPhone
                    ? ` · ${alertItem.seekerCallbackPhone}`
                    : ''}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    let myName = liveUserLabel || 'Donor';
                    let myPhone = '';
                    let myGroup: BloodGroup = alertItem.bloodGroup;
                    try {
                      const raw = localStorage.getItem('bloodsearch_current_user');
                      if (raw) {
                        const p = JSON.parse(raw);
                        if (p?.name) myName = p.name;
                        if (p?.phone) myPhone = p.phone;
                        if (p?.bloodGroup) myGroup = p.bloodGroup;
                      }
                    } catch {}
                    await respondToRequestAlertInFirestore({
                      alertId: alertItem.id,
                      action: 'RESPONDED_ACCEPT',
                      responderName: myName,
                      responderPhone: myPhone,
                      responseNote: 'Available to donate',
                    });
                    const matchedReq = requests.find((r) => r.id === alertItem.requestId);
                    if (matchedReq) {
                      handleStartLiveDonorTrip(matchedReq, myName, myPhone, myGroup).catch(
                        () => {}
                      );
                    }
                    setIncomingDonorAlerts((prev) =>
                      prev.filter((x) => x.id !== alertItem.id)
                    );
                    setAppShareToast(
                      lang === 'bn'
                        ? '✓ আপনার সাড়া ও লাইভ রুট ট্র্যাকিং রোগীর স্বজনের কাছে চালু হয়েছে।'
                        : '✓ Your response and live on-the-way tracking have been shared with the seeker.'
                    );
                    window.setTimeout(() => setAppShareToast(null), 3500);
                  }}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white text-rose-700 font-bold text-xs cursor-pointer whitespace-nowrap"
                >
                  {lang === 'bn' ? 'আমি রক্ত দিতে আসছি' : 'I Can Donate'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await respondToRequestAlertInFirestore({
                      alertId: alertItem.id,
                      action: 'RESPONDED_DECLINE',
                    });
                    setIncomingDonorAlerts((prev) =>
                      prev.filter((x) => x.id !== alertItem.id)
                    );
                  }}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-black/25 hover:bg-black/35 text-white font-semibold text-xs cursor-pointer whitespace-nowrap"
                >
                  {lang === 'bn' ? 'এখন সম্ভব নয়' : 'Unavailable'}
                </button>
              </div>
            </div>
          ))}

          {/* Live Incoming Compatible SOS Radar Banner */}
          {liveSosBannerReq && (
            <div className="mb-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md flex flex-wrap items-center justify-between gap-2.5 text-left">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-200">
                  {lang === 'bn'
                    ? `🚨 লাইভ জরুরি SOS অ্যালার্ট · ${liveSosBannerReq.bloodGroup} রক্ত প্রয়োজন`
                    : `🚨 LIVE EMERGENCY SOS · ${liveSosBannerReq.bloodGroup} NEEDED`}
                </div>
                <div className="text-xs sm:text-sm font-bold truncate mt-0.5">
                  {liveSosBannerReq.hospitalName} ({liveSosBannerReq.district}) —{' '}
                  {Math.max(1, liveSosBannerReq.unitsNeeded - liveSosBannerReq.unitsCollected)}{' '}
                  {lang === 'bn' ? 'ব্যাগ' : 'bag(s)'}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const targetReq = liveSosBannerReq;
                    setLiveSosBannerReq(null);
                    setPendingRespondRequest(targetReq);
                    handleSelectTab('requests');
                  }}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white text-rose-700 font-black text-xs cursor-pointer"
                >
                  {lang === 'bn' ? 'এখনই সাড়া দিন →' : 'Respond Now →'}
                </button>
                <button
                  type="button"
                  onClick={() => setLiveSosBannerReq(null)}
                  className="min-h-[36px] min-w-[36px] rounded-xl bg-black/20 hover:bg-black/30 text-white font-bold text-xs cursor-pointer"
                  aria-label="Close SOS Banner"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Live Owner Megaphone Global Broadcast Banner */}
          {activeAnnouncements
            .filter((a) => !dismissedAnnouncementIds.includes(a.id))
            .slice(0, 1)
            .map((ann) => (
              <div
                key={ann.id}
                className={`mb-3.5 p-3.5 rounded-2xl border shadow-xs flex items-start justify-between gap-2.5 text-left ${
                  ann.urgency === 'CRITICAL'
                    ? 'bg-rose-950 text-white border-rose-500/50'
                    : ann.urgency === 'CAMPAIGN'
                      ? 'bg-emerald-950 text-white border-emerald-500/50'
                      : 'bg-slate-900 text-white border-slate-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                    {ann.title ||
                      (ann.urgency === 'CRITICAL'
                        ? lang === 'bn'
                          ? '📢 অ্যাডমিন জরুরি মেগাফোন ঘোষণা'
                          : '📢 URGENT ADMIN BROADCAST'
                        : ann.urgency === 'CAMPAIGN'
                          ? lang === 'bn'
                            ? '⛺ রক্তদান ক্যাম্পেইন বিজ্ঞপ্তি'
                            : '⛺ BLOOD CAMP ANNOUNCEMENT'
                          : lang === 'bn'
                            ? '📢 অফিশিয়াল ঘোষণা'
                            : '📢 OFFICIAL NOTICE')}
                  </div>
                  <p className="text-xs sm:text-sm font-bold leading-snug mt-0.5 break-words">
                    {ann.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedAnnouncementIds((prev) => [...prev, ann.id])}
                  className="min-h-[32px] min-w-[32px] rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer shrink-0"
                  aria-label="Dismiss announcement"
                >
                  ✕
                </button>
              </div>
            ))}

          {/* Tab: Home Dashboard */}
          {activeTab === 'home' && (
            <DonorHomeView
              donors={donors}
              requests={requests}
              lang={lang}
              onOpenSOSWizard={(ctx) => openSOSWithContext(ctx)}
              onOpenRegister={(role) => openRegisterWithRole(role || 'USER')}
              onSelectRequest={handleQuickShareRequest}
              onQuickDonate={handleQuickDonateFromHome}
              onNavigateTab={handleSelectTab}
              onFocusMapLocation={handleFocusMapLocation}
              onQuickSearchByGroup={handleQuickSearchByGroup}
              onOpenDirectory={() => setIsDirectoryModalOpen(true)}
              onOpenPoster={() => setIsPosterModalOpen(true)}
              onOpenThalassemia={() => setIsThalassemiaModalOpen(true)}
              onOpenPlayStore={() => setIsPlayStoreModalOpen(true)}
              onOpenCareSuite={(tab) => setCareSuiteTab(tab || 'maternity')}
            />
          )}

          {/* Tab: Search Donors */}
          {activeTab === 'search' && (
            <DonorSearch
              donors={donors}
              lang={lang}
              presetGroup={searchPreset.bloodGroup}
              presetDistrict={searchPreset.district}
              presetNonce={searchPreset.nonce}
              onRevealPhone={handleRevealPhone}
              onOpenSOSModal={(ctx) => openSOSWithContext(ctx)}
              onStartChatWithDonor={(donor) => {
                setActiveDonorForChat(donor);
                handleSelectTab('chat');
              }}
              onOpenRegister={() => setIsRegisterModalOpen(true)}
              unsuccessfulDonorIds={unsuccessfulDonorIds}
              confirmedDonorId={confirmedDonorId}
              onRecordContactOutcome={handleRecordContactOutcome}
            />
          )}

          {/* Tab: Live SOS Requests Feed */}
          {activeTab === 'requests' && (
            <RequestsFeed
              requests={requests}
              donors={donors}
              liveTrips={liveDonorTrips}
              lang={lang}
              onOpenSOSModal={() => openSOSWithContext()}
              onRespondToRequest={handleRespondToRequest}
              onStartLiveTrip={handleStartLiveDonorTrip}
              onUpdateLiveTripStatus={handleUpdateLiveDonorTripStatus}
              onTrackTripOnMap={handleTrackLiveTripOnMap}
              onDeleteRequest={handleDeleteRequest}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onStartChatWithRequester={handleStartChatWithRequester}
              onRevealPhone={handleRevealPhone}
              onUpdateRequestLocal={handleUpdateRequestLocal}
              initialRespondRequest={pendingRespondRequest}
              onClearInitialRespondRequest={() => setPendingRespondRequest(null)}
            />
          )}

          {/* Lazy-Loaded Secondary Views */}
          {activeTab !== 'home' && activeTab !== 'search' && activeTab !== 'requests' && (
            <Suspense fallback={<ViewFallback lang={lang} />}>
              {activeTab === 'onboarding' && (
                <BloodHelpOnboardingView
                  lang={lang}
                  onSelectGroup={(grp) => handleQuickSearchByGroup(grp, 'ALL')}
                  onOpenSOSModal={() => openSOSWithContext()}
                />
              )}

              {activeTab === 'chat' && (
                <DonorChatView
                  lang={lang}
                  donors={donors}
                  initialDonor={activeDonorForChat}
                  onClearInitialDonor={() => setActiveDonorForChat(null)}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                  onOpenRegister={() => openRegisterWithRole('USER')}
                />
              )}

              {activeTab === 'badges' && <DonorBadgesView lang={lang} />}

              {activeTab === 'profile' && (
                <DonorProfileView
                  lang={lang}
                  onOpenRegister={(role) => openRegisterWithRole(role || 'USER')}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                />
              )}

              {activeTab === 'map' && (
                <InteractiveMapView
                  lang={lang}
                  donors={donors}
                  requests={requests}
                  liveTrips={liveDonorTrips}
                  focusedTripId={focusedLiveTripId}
                  onClearFocusedTrip={() => setFocusedLiveTripId(null)}
                  onUpdateLiveTripStatus={handleUpdateLiveDonorTripStatus}
                  initialFocusId={focusedMapLocationId}
                  onClearInitialFocus={() => setFocusedMapLocationId(null)}
                  onRevealPhone={handleRevealPhone}
                  onOpenSOSWizard={(ctx) => openSOSWithContext(ctx)}
                  onStartChatWithDonor={(donorName, bloodGroup, phone) => {
                    const matched = donors.find((d) => d.name === donorName) || {
                      id: `d-${Date.now()}`,
                      name: donorName,
                      bloodGroup,
                      division: 'dhaka',
                      district: 'dhaka',
                      upazila: 'dhanmondi',
                      phone: phone && !isPhoneMaskedOrInvalid(phone) ? phone : '017****00',
                      available: true,
                      lastDonatedDate: '',
                      totalDonations: 0,
                      verifiedBadge: false,
                      rating: 5,
                      reviewsCount: 0,
                      age: 26,
                      gender: 'MALE' as const,
                      weightKg: 65,
                    };
                    setActiveDonorForChat(matched);
                    handleSelectTab('chat');
                  }}
                />
              )}

              {activeTab === 'admin' && (
                <AdminPortal
                  lang={lang}
                  donors={donors}
                  setDonors={setDonors}
                  requests={requests}
                  setRequests={setRequests}
                  auditLogs={auditLogs}
                  onLogAudit={addAuditLog}
                  onExitAdmin={() => handleSelectTab('home')}
                  onOpenRegisterWithRole={(role) => openRegisterWithRole(role)}
                  onOpenApkGuide={() => setIsPlayStoreModalOpen(true)}
                />
              )}

              {activeTab === 'compatibility' && <CompatibilityMatrixModal lang={lang} />}

              {activeTab === 'eligibility' && <EligibilityChecker lang={lang} />}

              {activeTab === 'security' && <SecurityAuditModal logs={auditLogs} lang={lang} />}
            </Suspense>
          )}
        </main>
      )}

      {/* 3. Fixed Native Bottom Touch Navigation Bar */}
      {viewMode === 'app' && (
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          lang={lang}
          unreadSosCount={urgentRequests.length}
          unreadChatCount={unreadChatCount}
          onOpenSOSModal={() => setIsSOSWizardOpen(true)}
        />
      )}

      {/* ========================================================================= */}
      {/* ON-DEMAND MOUNTED MODALS (Zero Background Hook Overhead When Closed)      */}
      {/* ========================================================================= */}
      {isPhoneModalOpen && (
        <PhoneRevealModal
          donor={selectedDonorForPhone}
          isOpen={isPhoneModalOpen}
          onClose={() => setIsPhoneModalOpen(false)}
          lang={lang}
          onLogAudit={addAuditLog}
          onStartChatWithDonor={(donor) => {
            setActiveDonorForChat(donor);
            handleSelectTab('chat');
          }}
          onRecordContactOutcome={handleRecordContactOutcome}
        />
      )}

      {isSOSWizardOpen && (
        <RequestBloodWizard
          isOpen={isSOSWizardOpen}
          onClose={() => setIsSOSWizardOpen(false)}
          lang={lang}
          donors={donors}
          initialBloodGroup={sosPreset.bloodGroup}
          initialDistrict={sosPreset.district}
          initialHospitalName={sosPreset.hospitalName}
          onSubmitSOS={handleSubmitSOS}
          onLogAudit={addAuditLog}
          onRevealPhone={handleRevealPhone}
        />
      )}

      {isRegisterModalOpen && (
        <RegisterDonorModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          lang={lang}
          initialRole={registerInitialRole}
          onRegisterDonor={handleRegisterDonor}
          onLogAudit={addAuditLog}
          onNavigateTab={(tab) => handleSelectTab(tab)}
        />
      )}

      {isAuthModalOpen && (
        <AuthModuleModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          lang={lang}
          onLogAudit={addAuditLog}
          onOpenRegister={() => openRegisterWithRole('USER')}
        />
      )}

      {isFamilyModalOpen && (
        <Suspense fallback={null}>
          <FamilyVolunteerModal
            isOpen={isFamilyModalOpen}
            onClose={() => setIsFamilyModalOpen(false)}
            lang={lang}
            onOpenSOSWithGroup={() => {
              setIsSOSWizardOpen(true);
            }}
          />
        </Suspense>
      )}

      {isDirectoryModalOpen && (
        <Suspense fallback={null}>
          <EmergencyDirectoryModal
            isOpen={isDirectoryModalOpen}
            onClose={() => setIsDirectoryModalOpen(false)}
            lang={lang}
          />
        </Suspense>
      )}

      {isPosterModalOpen && (
        <Suspense fallback={null}>
          <EmergencyPosterModal
            isOpen={isPosterModalOpen}
            onClose={() => setIsPosterModalOpen(false)}
            lang={lang}
          />
        </Suspense>
      )}

      {isThalassemiaModalOpen && (
        <Suspense fallback={null}>
          <ThalassemiaManagerModal
            isOpen={isThalassemiaModalOpen}
            onClose={() => setIsThalassemiaModalOpen(false)}
            lang={lang}
          />
        </Suspense>
      )}

      {isPlayStoreModalOpen && (
        <Suspense fallback={null}>
          <PlayStoreGuideModal
            isOpen={isPlayStoreModalOpen}
            onClose={() => setIsPlayStoreModalOpen(false)}
            lang={lang}
          />
        </Suspense>
      )}

      {isCommercialModalOpen && (
        <Suspense fallback={null}>
          <CommercialHandoverModal
            isOpen={isCommercialModalOpen}
            onClose={() => setIsCommercialModalOpen(false)}
            lang={lang}
          />
        </Suspense>
      )}

      {careSuiteTab !== null && (
        <Suspense fallback={null}>
          <EmergencyCareSuiteModal
            isOpen={careSuiteTab !== null}
            onClose={() => setCareSuiteTab(null)}
            lang={lang}
            initialTab={careSuiteTab}
            donors={donors}
            onOpenSOSWizard={() => {
              setCareSuiteTab(null);
              setIsSOSWizardOpen(true);
            }}
          />
        </Suspense>
      )}

      <AppUpdateBannerModal lang={lang} />

      <PwaInstallPrompt
        lang={lang}
        onOpenApkGuide={() => setIsPlayStoreModalOpen(true)}
        onOpenDirectory={() => setIsDirectoryModalOpen(true)}
      />

      {isArchitectureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
          <div className="w-full max-w-4xl my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#111827] p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors text-left">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                BloodSearch Enterprise Architecture &amp; Specifications
              </h2>
              <button
                type="button"
                onClick={() => setIsArchitectureModalOpen(false)}
                className="min-h-[38px] px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>
            <Suspense fallback={<ViewFallback lang={lang} />}>
              <ArchitectureDocModal />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
