import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ActiveTab,
  Language,
  Donor,
  BloodRequest,
  AuditLogEntry,
  BloodGroup,
} from './types';
import { INITIAL_DONORS, INITIAL_REQUESTS } from './data/mockDonors';
import { MobileAppHeader } from './components/mobile/MobileAppHeader';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DonorSearch } from './components/DonorSearch';
import { RequestsFeed } from './components/RequestsFeed';
import { CompatibilityMatrixModal } from './components/CompatibilityMatrixModal';
import { EligibilityChecker } from './components/EligibilityChecker';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { PhoneRevealModal } from './components/PhoneRevealModal';
import { RegisterDonorModal } from './components/RegisterDonorModal';
import { DonorHomeView } from './components/donor/DonorHomeView';
import { BloodHelpOnboardingView } from './components/donor/BloodHelpOnboardingView';
import { DonorProfileView } from './components/donor/DonorProfileView';
import { DonorBadgesView } from './components/donor/DonorBadgesView';
import { DonorChatView } from './components/donor/DonorChatView';
import { InteractiveMapView } from './components/donor/InteractiveMapView';
import { RequestBloodWizard } from './components/donor/RequestBloodWizard';
import { AdminPortal } from './components/portals/AdminPortal';
import { ArchitectureDocModal } from './components/ecosystem/ArchitectureDocModal';
import { AuthModuleModal } from './components/auth/AuthModuleModal';
import { FamilyVolunteerModal } from './components/ecosystem/FamilyVolunteerModal';
import { EmergencyDirectoryModal } from './components/ecosystem/EmergencyDirectoryModal';
import { EmergencyPosterModal } from './components/ecosystem/EmergencyPosterModal';
import { ThalassemiaManagerModal } from './components/ecosystem/ThalassemiaManagerModal';
import { PlayStoreGuideModal } from './components/ecosystem/PlayStoreGuideModal';
import { PwaInstallPrompt } from './components/ecosystem/PwaInstallPrompt';
import { PdfExactShowcase } from './components/showcase/PdfExactShowcase';
import {
  auth,
  onAuthStateChanged,
  completeRealGmailSignInIfPresent,
  fetchUserProfileFromFirestore,
  checkIsVerifiedAdminInFirestore,
  subscribePublicDonors,
  subscribePublicRequests,
  createBloodRequestInFirestore,
  pledgeBloodRequestUnitInFirestore,
  signInWithGoogleReal,
  signOutReal,
  getTokenServiceAlert,
  dismissTokenServiceAlert,
  TokenServiceAlertInfo,
  User as FirebaseUser,
} from './firebase';

export default function App() {
  // Theme state: Normal solid light or normal solid dark
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('bloodsearch_dark_mode');
    return saved !== null ? saved === 'true' : false;
  });

  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('bloodsearch_lang') as Language;
    return saved === 'en' || saved === 'bn' ? saved : 'bn';
  });

  // View Mode: 'app' (Native responsive web/APK view) or 'deck' (8-Slide PDF Presentation)
  const [viewMode, setViewMode] = useState<'app' | 'deck'>('app');

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Scroll naturally to top when changing tabs on mobile/desktop
  const handleSelectTab = useCallback((tab: ActiveTab) => {
    setActiveTab(tab);
    setViewMode('app');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, []);

  // Application Data States
  const [donors, setDonors] = useState<Donor[]>(() => {
    const saved = localStorage.getItem('bloodsearch_donors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_DONORS;
      }
    }
    return INITIAL_DONORS;
  });

  const [requests, setRequests] = useState<BloodRequest[]>(() => {
    const saved = localStorage.getItem('bloodsearch_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_REQUESTS;
      }
    }
    return INITIAL_REQUESTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('bloodsearch_audit_logs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      {
        id: 'audit-1',
        action: 'STATUS_CHANGE',
        actorName: 'System Security Engine',
        targetDetails: 'Initial verification checks passed for 10 voluntary donors',
        timestamp: 'আজ সকাল ৮:৩০',
        securityHash: 'sha256:7f83b165...9c1a',
      },
      {
        id: 'audit-2',
        action: 'CREATE_SOS',
        actorName: 'কামাল হোসেন',
        targetDetails: 'Broadcasted O- request at DMCH (2 units)',
        timestamp: 'আজ সকাল ৯:১৫',
        securityHash: 'sha256:c4ca4238...d01b',
      },
      {
        id: 'audit-3',
        action: 'DISPATCH_INCIDENT',
        actorName: 'Emergency Command Center',
        targetDetails: 'Rapid response unit assigned to DMCH emergency Bleeding Case #INC-0412',
        timestamp: 'আজ সকাল ১০:০৫',
        securityHash: 'sha256:8b1a992...e4fa',
      },
    ];
  });

  // Modals state
  const [selectedDonorForPhone, setSelectedDonorForPhone] = useState<Donor | null>(null);
  const [activeDonorForChat, setActiveDonorForChat] = useState<Donor | null>(null);
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
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);

  const openRegisterWithRole = useCallback((role: 'USER' | 'ADMIN' = 'USER') => {
    setRegisterInitialRole(role);
    setIsRegisterModalOpen(true);
  }, []);

  const [liveFirebaseUser, setLiveFirebaseUser] = useState<FirebaseUser | null>(null);
  const [tokenServiceAlert, setTokenServiceAlert] = useState<TokenServiceAlertInfo | null>(() =>
    getTokenServiceAlert()
  );

  // Real Firebase Auth & Cloud Firestore Live Listeners
  useEffect(() => {
    const syncTokenAlert = () => {
      setTokenServiceAlert(getTokenServiceAlert());
    };
    window.addEventListener('bloodsearch_token_service_alert', syncTokenAlert);

    completeRealGmailSignInIfPresent().catch(() => {});

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      setLiveFirebaseUser(u);
      if (u) {
        try {
          const profile = await fetchUserProfileFromFirestore(u.uid);
          const isAdmin = await checkIsVerifiedAdminInFirestore(u);
          if (profile) {
            if (isAdmin) {
              profile.role = 'ADMIN';
            }
            localStorage.setItem('bloodsearch_current_user', JSON.stringify(profile));
            window.dispatchEvent(new Event('bloodsearch_user_changed'));
          }
        } catch {}
      }
    });

    let unsubDonors: (() => void) | null = null;
    let unsubRequests: (() => void) | null = null;
    try {
      unsubDonors = subscribePublicDonors((cloudDonors) => {
        if (cloudDonors.length > 0) {
          setDonors((prev) => {
            const cloudIds = new Set(cloudDonors.map((d) => d.id));
            const remaining = prev.filter((p) => !cloudIds.has(p.id));
            return [...cloudDonors, ...remaining];
          });
        }
      });
      unsubRequests = subscribePublicRequests((cloudReqs) => {
        if (cloudReqs.length > 0) {
          setRequests((prev) => {
            const cloudIds = new Set(cloudReqs.map((r) => r.id));
            const remaining = prev.filter((p) => !cloudIds.has(p.id));
            return [...cloudReqs, ...remaining];
          });
        }
      });
    } catch {}

    return () => {
      window.removeEventListener('bloodsearch_token_service_alert', syncTokenAlert);
      unsubAuth();
      if (unsubDonors) unsubDonors();
      if (unsubRequests) unsubRequests();
    };
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

  // Sync language to local storage
  useEffect(() => {
    localStorage.setItem('bloodsearch_lang', lang);
  }, [lang]);

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

  // Audit Logger helper
  const addAuditLog = useCallback((action: any, targetDetails: string) => {
    const newLog: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      action,
      actorName: 'Current Operator',
      targetDetails,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      securityHash: `sha256:${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  }, []);

  // Phone Reveal Action
  const handleRevealPhone = useCallback((donor: Donor) => {
    setSelectedDonorForPhone(donor);
    setIsPhoneModalOpen(true);
  }, []);

  // SOS Creation Action
  const handleSubmitSOS = (newRequest: BloodRequest) => {
    setRequests((prev) => [newRequest, ...prev]);
    createBloodRequestInFirestore(newRequest).catch(() => {});
    handleSelectTab('requests');
  };

  // Volunteer Response to SOS
  const handleRespondToRequest = (
    requestId: string,
    responderName: string,
    responderPhone: string,
    group: BloodGroup,
    note?: string
  ) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const newResponder = {
            id: `resp-${Date.now()}`,
            name: responderName,
            phone: responderPhone,
            bloodGroup: group,
            timestamp: lang === 'bn' ? 'এইমাত্র' : 'Just now',
            notes: note,
          };
          return {
            ...r,
            unitsCollected: Math.min(r.unitsNeeded, r.unitsCollected + 1),
            status: r.unitsCollected + 1 >= r.unitsNeeded ? 'FULFILLED' : r.status,
            responders: [newResponder, ...r.responders],
          };
        }
        return r;
      })
    );

    pledgeBloodRequestUnitInFirestore(requestId).catch(() => {});
    addAuditLog('RESPOND_SOS', `Volunteer ${responderName} (${group}) responded to request ${requestId}`);
  };

  // New Donor Registration
  const handleRegisterDonor = useCallback((newDonor: Donor) => {
    setDonors((prev) => {
      const filtered = prev.filter((d) => d.id !== newDonor.id);
      return [newDonor, ...filtered];
    });
  }, []);

  // Urgent active requests count
  const urgentRequests = useMemo(
    () => requests.filter((r) => r.status === 'ACTIVE' && r.urgency === 'CRITICAL'),
    [requests]
  );

  const liveUserLabel = liveFirebaseUser
    ? liveFirebaseUser.email?.split('@')[0] ||
      liveFirebaseUser.phoneNumber ||
      (lang === 'bn' ? 'অ্যাকাউন্ট' : 'Account')
    : null;

  return (
    <div
      className={`min-h-dvh w-full max-w-[100vw] overflow-x-clip flex flex-col transition-colors duration-200 ${
        darkMode ? 'dark bg-[#0b0f19] text-[#f8fafc]' : 'bg-[#f8fafc] text-[#0f172a]'
      }`}
    >
      {/* 1. Unified Responsive Native Header (Zero Fake Clock, Zero Fake Battery, Zero Bezel) */}
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
        isDeckMode={viewMode === 'deck'}
        onExitDeckMode={() => setViewMode('app')}
        liveUserLabel={liveUserLabel}
        onSignOut={() => {
          signOutReal().catch(() => {});
        }}
      />

      {/* 2. Native Window-Scrolling App Body (Smooth 60fps/120fps Touch Scroll on Real Phones) */}
      {viewMode === 'deck' ? (
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-16">
          <PdfExactShowcase
            lang={lang}
            darkMode={darkMode}
            onOpenSOSModal={() => setIsSOSWizardOpen(true)}
          />
        </main>
      ) : (
        <main
          className={`@container flex-1 w-full max-w-5xl mx-auto px-3 sm:px-5 ${
            activeTab === 'chat' ? 'pt-2.5 pb-20' : 'pt-3.5 pb-24'
          }`}
        >
          {/* Actionable Session Renew / GCP Token Service API Enable Card (Shown ONLY if an expired token hit disabled securetoken.googleapis.com) */}
          {tokenServiceAlert?.active && (
            <div className="mb-3.5 p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 shadow-xs text-left">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200">
                    {lang === 'bn'
                      ? 'লগইন সেশন নবায়ন ও Google Cloud Token Service API নোটিশ'
                      : 'Session Renewal & Google Cloud Token Service API Notice'}
                  </div>
                  <p className="text-[11px] sm:text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
                    {lang === 'bn'
                      ? `আপনার পূর্ববর্তী লগইন সেশনের (${
                          tokenServiceAlert.expiredEmail || 'Google Account'
                        }) মেয়াদ শেষ হয়েছে। স্থায়ী অটো-লগইন চালু রাখতে নিচের নীল বাটনে ট্যাপ করে Google Cloud-এ "Token Service API" Enable করুন, অথবা এখনই ১-ক্লিকে পুনরায় লগইন করুন।`
                      : `Your previous session (${
                          tokenServiceAlert.expiredEmail || 'Google Account'
                        }) expired because Token Service API (securetoken.googleapis.com) is disabled in your GCP project. Click Enable once for automatic token refresh, or re-login below.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissTokenServiceAlert()}
                  className="min-h-[32px] min-w-[32px] rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-200/60 dark:hover:bg-amber-900/50 text-xs font-bold cursor-pointer shrink-0"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    signInWithGoogleReal(tokenServiceAlert.expiredEmail)
                      .then(async (u) => {
                        setLiveFirebaseUser(u);
                        try {
                          const profile = await fetchUserProfileFromFirestore(u.uid);
                          const isAdmin = await checkIsVerifiedAdminInFirestore(u);
                          if (profile) {
                            if (isAdmin) profile.role = 'ADMIN';
                            localStorage.setItem('bloodsearch_current_user', JSON.stringify(profile));
                            window.dispatchEvent(new Event('bloodsearch_user_changed'));
                          }
                        } catch {}
                      })
                      .catch(() => {
                        setIsAuthModalOpen(true);
                      });
                  }}
                  className="min-h-[38px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs cursor-pointer"
                >
                  {lang === 'bn' ? '✓ ১-ক্লিকে পুনরায় Google লগইন' : '✓ 1-Click Google Re-Login'}
                </button>
                <a
                  href={tokenServiceAlert.enableApiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[38px] inline-flex items-center px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  {lang === 'bn'
                    ? 'Google Cloud → Token Service API অন করুন ↗'
                    : 'Enable Token Service API in GCP ↗'}
                </a>
              </div>
            </div>
          )}

          {/* Tab: Home Dashboard */}
          {activeTab === 'home' && (
            <DonorHomeView
              requests={requests}
              lang={lang}
              onOpenSOSWizard={() => setIsSOSWizardOpen(true)}
              onOpenRegister={(role) => openRegisterWithRole(role || 'USER')}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onSelectRequest={() => handleSelectTab('requests')}
              onQuickDonate={() => handleSelectTab('requests')}
              onNavigateTab={(tab) => handleSelectTab(tab)}
              onOpenDirectory={() => setIsDirectoryModalOpen(true)}
              onOpenPoster={() => setIsPosterModalOpen(true)}
              onOpenThalassemia={() => setIsThalassemiaModalOpen(true)}
              onOpenPlayStore={() => setIsPlayStoreModalOpen(true)}
            />
          )}

          {/* Tab: Blood Help Onboarding */}
          {activeTab === 'onboarding' && (
            <BloodHelpOnboardingView
              lang={lang}
              onSelectGroup={() => handleSelectTab('search')}
              onOpenSOSModal={() => setIsSOSWizardOpen(true)}
            />
          )}

          {/* Tab: Search Donors */}
          {activeTab === 'search' && (
            <DonorSearch
              donors={donors}
              lang={lang}
              onRevealPhone={handleRevealPhone}
              onOpenSOSModal={() => setIsSOSWizardOpen(true)}
              onStartChatWithDonor={(donor) => {
                setActiveDonorForChat(donor);
                handleSelectTab('chat');
              }}
              onOpenRegister={() => setIsRegisterModalOpen(true)}
            />
          )}

          {/* Tab: Live SOS Requests Feed */}
          {activeTab === 'requests' && (
            <RequestsFeed
              requests={requests}
              lang={lang}
              onOpenSOSModal={() => setIsSOSWizardOpen(true)}
              onRespondToRequest={handleRespondToRequest}
            />
          )}

          {/* Tab: Messages / Inbox & Real-Time WhatsApp-Style User-to-User Chat */}
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

          {/* Tab: My Badges */}
          {activeTab === 'badges' && <DonorBadgesView lang={lang} />}

          {/* Tab: Profile & Hospital QR Pass */}
          {activeTab === 'profile' && (
            <DonorProfileView
              lang={lang}
              onOpenRegister={(role) => openRegisterWithRole(role || 'USER')}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
            />
          )}

          {/* Tab: Interactive Map */}
          {activeTab === 'map' && (
            <InteractiveMapView
              lang={lang}
              onOpenSOSWizard={() => setIsSOSWizardOpen(true)}
              onStartChatWithDonor={(donorName, bloodGroup, phone) => {
                const matched = donors.find((d) => d.name === donorName) || {
                  id: `d-${Date.now()}`,
                  name: donorName,
                  bloodGroup,
                  division: 'dhaka',
                  district: 'ঢাকা',
                  upazila: 'সদর',
                  phone: phone || '+88017XXXXXXXX',
                  available: true,
                  lastDonatedDate: '',
                  totalDonations: 1,
                  verifiedBadge: true,
                  rating: 5,
                  reviewsCount: 1,
                  age: 26,
                  gender: 'MALE' as const,
                  weightKg: 65,
                };
                setActiveDonorForChat(matched);
                handleSelectTab('chat');
              }}
            />
          )}

          {/* Tab: Dedicated Protected Admin Portal */}
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

          {/* Tab: Compatibility Matrix */}
          {activeTab === 'compatibility' && <CompatibilityMatrixModal lang={lang} />}

          {/* Tab: Donor Eligibility */}
          {activeTab === 'eligibility' && <EligibilityChecker lang={lang} />}

          {/* Tab: Security Audit */}
          {activeTab === 'security' && <SecurityAuditModal logs={auditLogs} lang={lang} />}
        </main>
      )}

      {/* 3. Fixed Native Bottom Touch Navigation Bar */}
      {viewMode === 'app' && (
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          lang={lang}
          unreadSosCount={urgentRequests.length}
          unreadChatCount={1}
          onOpenSOSModal={() => setIsSOSWizardOpen(true)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODALS & BOTTOM SHEETS                                                    */}
      {/* ========================================================================= */}
      <PhoneRevealModal
        donor={selectedDonorForPhone}
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        lang={lang}
        onLogAudit={addAuditLog}
      />

      <RequestBloodWizard
        isOpen={isSOSWizardOpen}
        onClose={() => setIsSOSWizardOpen(false)}
        lang={lang}
        onSubmitSOS={handleSubmitSOS}
        onLogAudit={addAuditLog}
      />

      <RegisterDonorModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        lang={lang}
        initialRole={registerInitialRole}
        onRegisterDonor={handleRegisterDonor}
        onLogAudit={addAuditLog}
        onNavigateTab={(tab) => handleSelectTab(tab)}
      />

      <AuthModuleModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        lang={lang}
        onLogAudit={addAuditLog}
        onOpenRegister={() => openRegisterWithRole('USER')}
      />

      <FamilyVolunteerModal
        isOpen={isFamilyModalOpen}
        onClose={() => setIsFamilyModalOpen(false)}
        lang={lang}
        onOpenSOSWithGroup={() => {
          setIsSOSWizardOpen(true);
        }}
      />

      <EmergencyDirectoryModal
        isOpen={isDirectoryModalOpen}
        onClose={() => setIsDirectoryModalOpen(false)}
        lang={lang}
      />

      <EmergencyPosterModal
        isOpen={isPosterModalOpen}
        onClose={() => setIsPosterModalOpen(false)}
        lang={lang}
      />

      <ThalassemiaManagerModal
        isOpen={isThalassemiaModalOpen}
        onClose={() => setIsThalassemiaModalOpen(false)}
        lang={lang}
      />

      <PlayStoreGuideModal
        isOpen={isPlayStoreModalOpen}
        onClose={() => setIsPlayStoreModalOpen(false)}
        lang={lang}
      />

      <PwaInstallPrompt
        lang={lang}
        onOpenApkGuide={() => setIsPlayStoreModalOpen(true)}
      />

      {isArchitectureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
          <div className="w-full max-w-4xl my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#1e293b] p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-all text-left">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                BloodSearch Enterprise Architecture & Specifications
              </h2>
              <button
                type="button"
                onClick={() => setIsArchitectureModalOpen(false)}
                className="min-h-[38px] px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>
            <ArchitectureDocModal />
          </div>
        </div>
      )}
    </div>
  );
}
