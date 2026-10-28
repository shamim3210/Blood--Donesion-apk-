import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BloodRequest,
  BloodGroup,
  UrgencyLevel,
  Language,
  Donor,
  RequestAlertItem,
  RequestLifecycleState,
} from '../types';
import { ALL_BLOOD_GROUPS } from '../data/compatibility';
import { DISTRICTS } from '../data/bangladeshGeo';
import { getTranslation } from '../utils/translations';
import {
  auth,
  buildWhatsAppChatUrl,
  subscribeAlertsForAuthorRequests,
  escalateBloodRequestInFirestore,
  updateBloodRequestTrackingInFirestore,
} from '../firebase';
import {
  computeEscalationTargets,
  deriveRequestLifecycleState,
  rankDonorsForSeeker,
  canSeekerViewDirectContact,
  buildDirectCallHref,
  buildWhatsAppHref,
} from '../utils/donorMatcher';
import { resolveBangladeshCoordinates } from '../utils/geolocation';
import { buildOfflineEmergencySmsUri } from '../utils/sosAlertEngine';
import {
  MapPin,
  Phone,
  Clock,
  Users,
  Share2,
  UserCheck,
  Plus,
  CheckCircle,
  Hospital,
  ExternalLink,
  Mail,
  RefreshCw,
  Expand,
  XCircle,
  AlertTriangle,
  SkipForward,
  MessageSquare,
} from 'lucide-react';

interface RequestsFeedProps {
  requests: BloodRequest[];
  donors?: Donor[];
  lang: Language;
  onOpenSOSModal: () => void;
  onRespondToRequest: (
    requestId: string,
    responderName: string,
    responderPhone: string,
    group: BloodGroup,
    note?: string
  ) => void;
  onRevealPhone?: (donor: Donor) => void;
  onUpdateRequestLocal?: (reqId: string, patch: Partial<BloodRequest>) => void;
  initialRespondRequest?: BloodRequest | null;
  onClearInitialRespondRequest?: () => void;
}

const LIFECYCLE_LABELS: Record<
  RequestLifecycleState,
  { en: string; bn: string; tone: 'emerald' | 'amber' | 'rose' | 'slate' }
> = {
  SEARCHING: { en: 'Searching', bn: 'রক্তদাতা খোঁজা হচ্ছে', tone: 'amber' },
  DONORS_NOTIFIED: { en: 'Donors Notified', bn: 'ডোনারদের নোটিফাই করা হয়েছে', tone: 'amber' },
  RESPONSES_RECEIVED: { en: 'Responses Received', bn: 'সাড়া পাওয়া গেছে', tone: 'emerald' },
  CONTACT_ATTEMPTED: { en: 'Contact Attempted', bn: 'যোগাযোগের চেষ্টা চলছে', tone: 'amber' },
  DONOR_CONFIRMED: { en: 'Donor Confirmed', bn: 'রক্তদাতা নিশ্চিত', tone: 'emerald' },
  FULFILLED: { en: 'Fulfilled', bn: 'রক্ত সংগৃহীত (সম্পন্ন)', tone: 'emerald' },
  NO_RESPONSE: { en: 'No Response Yet', bn: 'এখনও সাড়া মেলেনি', tone: 'rose' },
  CANCELLED: { en: 'Cancelled', bn: 'বাতিলকৃত', tone: 'slate' },
  EXPIRED: { en: 'Expired', bn: 'মেয়াদ উত্তীর্ণ', tone: 'slate' },
};

export const RequestsFeed: React.FC<RequestsFeedProps> = ({
  requests,
  donors = [],
  lang,
  onOpenSOSModal,
  onRespondToRequest,
  onRevealPhone,
  onUpdateRequestLocal,
  initialRespondRequest,
  onClearInitialRespondRequest,
}) => {
  const t = getTranslation(lang);

  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'ALL'>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel | 'ALL'>('ALL');
  const [showResolved, setShowResolved] = useState<boolean>(false);
  const [respondingToReq, setRespondingToReq] = useState<BloodRequest | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorGroup, setDonorGroup] = useState<BloodGroup>('O-');
  const [arrivalNote, setArrivalNote] = useState('');
  const [shareSuccessId, setShareSuccessId] = useState<string | null>(null);

  const [myRequestAlerts, setMyRequestAlerts] = useState<RequestAlertItem[]>([]);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [unsuccessfulByReq, setUnsuccessfulByReq] = useState<Record<string, string[]>>({});
  const autoEscalatedStepRef = useRef<Record<string, number>>({});

  const currentUid = auth.currentUser?.uid || null;
  const isVerifiedSeeker = Boolean(
    auth.currentUser && (auth.currentUser.emailVerified || auth.currentUser.phoneNumber)
  );

  // Subscribe to real-time alert delivery & response states for requests owned by signed-in user
  useEffect(() => {
    if (!currentUid) {
      setMyRequestAlerts([]);
      return;
    }
    const unsub = subscribeAlertsForAuthorRequests(currentUid, (alerts) => {
      setMyRequestAlerts(alerts);
    });
    return () => unsub();
  }, [currentUid]);

  const alertsByRequestId = useMemo(() => {
    const map = new Map<string, RequestAlertItem[]>();
    for (const a of myRequestAlerts) {
      const list = map.get(a.requestId) || [];
      list.push(a);
      map.set(a.requestId, list);
    }
    return map;
  }, [myRequestAlerts]);

  const showNotice = useCallback((msg: string) => {
    setActionToast(msg);
    window.setTimeout(() => setActionToast(null), 4000);
  }, []);

  const handleEscalateRequest = useCallback(
    async (req: BloodRequest, isAuto = false) => {
      if (req.status !== 'ACTIVE') return;
      const currentLevel = Number(req.escalationLevel) || 0;
      if (currentLevel >= 4) {
        if (!isAuto) {
          showNotice(
            lang === 'bn'
              ? 'সর্বোচ্চ সারাদেশ পরিধিতে ইতিমধ্যে সম্প্রচারিত হয়েছে।'
              : 'Already expanded to maximum nationwide radius.'
          );
        }
        return;
      }

      setEscalatingId(req.id);
      try {
        const existingAlerts = alertsByRequestId.get(req.id) || [];
        const alreadyNotified = existingAlerts.map((a) => a.donorUid);
        const nextLevel = currentLevel + 1;

        const plan = computeEscalationTargets({
          targetLevel: nextLevel,
          bloodGroup: req.bloodGroup,
          originDistrict: req.district,
          allDonors: donors,
          alreadyNotifiedDonorIds: alreadyNotified,
          excludeUid: currentUid || undefined,
          exchangeAllowed: req.exchangeAllowed,
        });

        const newIds = plan.eligibleDonorsToNotify.map((d) => d.id);
        const res = await escalateBloodRequestInFirestore({
          requestId: req.id,
          nextEscalationLevel: plan.nextLevel,
          nextRadiusKm: plan.radiusKm,
          additionalCloudDonorIds: newIds,
          seekerCallbackPhone: req.contactPhone,
        });

        const totalNotified = (req.notifiedCount || 0) + (res.newlyNotified || newIds.length);
        onUpdateRequestLocal?.(req.id, {
          escalationLevel: plan.nextLevel,
          searchRadiusKm: plan.radiusKm,
          notifiedCount: totalNotified,
          lifecycleState:
            (req.respondedCount || 0) > 0 || req.responders.length > 0
              ? 'RESPONSES_RECEIVED'
              : totalNotified > 0
              ? 'DONORS_NOTIFIED'
              : 'NO_RESPONSE',
        });

        showNotice(
          lang === 'bn'
            ? `সার্চ পরিধি প্রসারিত হয়েছে (${plan.tierLabelBn}) — নতুন ${res.newlyNotified || newIds.length} জন ডোনারকে নোটিফাই করা হয়েছে।`
            : `Expanded search to ${plan.tierLabelEn} — notified ${res.newlyNotified || newIds.length} additional matching donor(s).`
        );
      } finally {
        setEscalatingId(null);
      }
    },
    [alertsByRequestId, donors, currentUid, lang, onUpdateRequestLocal, showNotice]
  );

  // Automatic no-response radius escalation while seeker keeps feed open
  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      for (const req of requests) {
        if (req.status !== 'ACTIVE') continue;
        const isMine =
          (currentUid && req.authorUid === currentUid) ||
          (!req.authorUid && req.id.startsWith('sos_'));
        if (!isMine) continue;

        const alerts = alertsByRequestId.get(req.id) || [];
        const hasAccepted =
          req.responders.length > 0 ||
          (req.respondedCount || 0) > 0 ||
          alerts.some((a) => a.deliveryState === 'RESPONDED_ACCEPT');
        if (hasAccepted || req.confirmedDonorId) continue;

        const intervalMs = (req.escalationIntervalMinutes || 10) * 60 * 1000;
        const createdMs = req.createdAtMs || 0;
        if (!createdMs) continue;

        const elapsed = now - createdMs;
        const expectedLevel = Math.min(4, Math.floor(elapsed / intervalMs));
        const currentLevel = req.escalationLevel || 0;
        const prevAuto = autoEscalatedStepRef.current[req.id] || 0;

        if (expectedLevel > currentLevel && expectedLevel > prevAuto) {
          autoEscalatedStepRef.current[req.id] = expectedLevel;
          handleEscalateRequest(req, true).catch(() => {});
        }
      }
    }, 20000);
    return () => window.clearInterval(interval);
  }, [requests, currentUid, alertsByRequestId, handleEscalateRequest]);

  const handleLifecycleAction = async (
    req: BloodRequest,
    action: 'FULFILLED' | 'CANCELLED' | 'ATTEMPT' | 'CONFIRM_DONOR',
    donor?: Donor
  ) => {
    if (action === 'FULFILLED' || action === 'CANCELLED') {
      await updateBloodRequestTrackingInFirestore({
        requestId: req.id,
        status: action,
        lifecycleState: action,
      }).catch(() => false);
      onUpdateRequestLocal?.(req.id, {
        status: action,
        lifecycleState: action,
        unitsCollected: action === 'FULFILLED' ? req.unitsNeeded : req.unitsCollected,
      });
      showNotice(
        action === 'FULFILLED'
          ? lang === 'bn'
            ? '✓ রিকোয়েস্ট সম্পন্ন হিসেবে চিহ্নিত হয়েছে — পরবর্তী সকল অ্যালার্ট বন্ধ করা হয়েছে।'
            : '✓ Request marked Fulfilled — all future alerts halted.'
          : lang === 'bn'
          ? 'রিকোয়েস্ট বাতিল করা হয়েছে — পরবর্তী সকল অ্যালার্ট বন্ধ করা হয়েছে।'
          : 'Request Cancelled — all future alerts halted.'
      );
      return;
    }

    if (action === 'CONFIRM_DONOR' && donor) {
      await updateBloodRequestTrackingInFirestore({
        requestId: req.id,
        lifecycleState: 'DONOR_CONFIRMED',
        confirmedDonorId: donor.id,
        confirmedDonorName: donor.name,
      }).catch(() => false);
      onUpdateRequestLocal?.(req.id, {
        lifecycleState: 'DONOR_CONFIRMED',
        confirmedDonorId: donor.id,
        confirmedDonorName: donor.name,
      });
      showNotice(
        lang === 'bn'
          ? `✓ ${donor.name}-কে নিশ্চিত রক্তদাতা হিসেবে যুক্ত করা হয়েছে।`
          : `✓ Confirmed ${donor.name} for this request.`
      );
      return;
    }

    if (action === 'ATTEMPT') {
      if (donor) {
        setUnsuccessfulByReq((prev) => ({
          ...prev,
          [req.id]: [...(prev[req.id] || []), donor.id],
        }));
      }
      await updateBloodRequestTrackingInFirestore({
        requestId: req.id,
        lifecycleState: 'CONTACT_ATTEMPTED',
        incrementContactAttempt: true,
      }).catch(() => false);
      onUpdateRequestLocal?.(req.id, {
        lifecycleState: 'CONTACT_ATTEMPTED',
        contactAttemptsCount: (req.contactAttemptsCount || 0) + 1,
      });
      showNotice(
        lang === 'bn'
          ? 'যোগাযোগের চেষ্টা রেকর্ড হয়েছে — পরবর্তী উপলব্ধ ডোনার দেখানো হচ্ছে।'
          : 'Recorded unsuccessful attempt — advancing to next ranked donor.'
      );
    }
  };

  const openRespondSheetWithPrefill = useCallback((req: BloodRequest) => {
    setRespondingToReq(req);
    let savedName = '';
    let savedPhone = '';
    let savedGroup: BloodGroup = req.bloodGroup;
    try {
      const raw = localStorage.getItem('bloodsearch_current_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.name) savedName = parsed.name;
        if (parsed?.phone) savedPhone = parsed.phone;
        if (parsed?.bloodGroup) savedGroup = parsed.bloodGroup;
      }
    } catch {}
    if (savedName) setDonorName(savedName);
    if (savedPhone) setDonorPhone(savedPhone);
    setDonorGroup(savedGroup);
  }, []);

  useEffect(() => {
    if (initialRespondRequest) {
      openRespondSheetWithPrefill(initialRespondRequest);
      if (onClearInitialRespondRequest) {
        onClearInitialRespondRequest();
      }
    }
  }, [initialRespondRequest, openRespondSheetWithPrefill, onClearInitialRespondRequest]);

  const filteredRequests = requests.filter((req) => {
    if (!showResolved && req.status !== 'ACTIVE') return false;
    if (selectedGroup !== 'ALL' && req.bloodGroup !== selectedGroup) return false;
    if (selectedUrgency !== 'ALL' && req.urgency !== selectedUrgency) return false;
    return true;
  });

  const handleConfirmResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingToReq || !donorName.trim() || !donorPhone.trim()) return;

    onRespondToRequest(
      respondingToReq.id,
      donorName.trim(),
      donorPhone.trim(),
      donorGroup,
      arrivalNote.trim() ||
        (lang === 'bn' ? 'আমি রক্ত দিতে প্রস্তুত আছি।' : 'Ready to donate at the hospital.')
    );

    setRespondingToReq(null);
    setArrivalNote('');
  };

  const handleShare = (req: BloodRequest) => {
    const shareText = `Emergency Blood Needed: ${req.bloodGroup} (${Math.max(
      1,
      req.unitsNeeded - req.unitsCollected
    )} bag(s)) — ${req.hospitalName} (${req.district}). Patient: ${req.patientName}. Contact: ${req.contactPhone}`;
    if (navigator.share) {
      navigator
        .share({ title: 'BloodSearch Emergency', text: shareText, url: window.location.href })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
      setShareSuccessId(req.id);
      setTimeout(() => setShareSuccessId(null), 2200);
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Medical Disclaimer */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/35 border border-amber-300/80 dark:border-amber-800/70 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === 'bn'
            ? 'জরুরি চিকিৎসা পরামর্শ: BloodSearch কোনো জরুরি হাসপাতাল বা অ্যাম্বুলেন্স সেবা নয় এবং রক্তের নিশ্চয়তা দেয় না। জরুরি অবস্থায় হাসপাতালের ব্লাড ব্যাংক, চিকিৎসক বা ৯৯৯-এ যোগাযোগ করুন।'
            : 'Medical Disclaimer: BloodSearch is not an emergency medical service and cannot guarantee blood availability. Always coordinate directly with your hospital blood bank, physician, or call 999.'}
        </p>
      </div>

      {actionToast && (
        <div className="p-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold">
          {actionToast}
        </div>
      )}

      {/* Feed Header */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-4 sm:p-6 transition-colors shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.navRequestsFeed}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              {lang === 'bn'
                ? 'সক্রিয় রক্তের আবেদন, রিয়েল-টাইম সাড়া ট্র্যাকিং ও স্বয়ংক্রিয় পরিধি প্রসারণ'
                : 'Live emergency blood requests, honest response tracking, and radius escalation'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer min-h-[44px] px-3 rounded-xl btn-surface">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded border-slate-300 text-rose-600 w-4 h-4"
              />
              <span className="whitespace-nowrap">
                {lang === 'bn' ? 'সম্পন্ন/বাতিল দেখান' : 'Show Resolved'}
              </span>
            </label>
            <button
              type="button"
              onClick={onOpenSOSModal}
              className="min-h-[44px] flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-crimson font-bold text-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>{t.createSosTitle}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedGroup('ALL')}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-bold rounded-xl cursor-pointer whitespace-nowrap ${
                selectedGroup === 'ALL' ? 'btn-crimson' : 'btn-surface'
              }`}
            >
              {t.allBloodGroups}
            </button>
            {ALL_BLOOD_GROUPS.map((bg) => (
              <button
                type="button"
                key={bg}
                onClick={() => setSelectedGroup(bg)}
                className={`min-h-[40px] min-w-[44px] px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer whitespace-nowrap ${
                  selectedGroup === bg ? 'btn-crimson' : 'btn-surface'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {(['ALL', 'CRITICAL', 'URGENT'] as (UrgencyLevel | 'ALL')[]).map((urg) => (
              <button
                type="button"
                key={urg}
                onClick={() => setSelectedUrgency(urg)}
                className={`min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer whitespace-nowrap ${
                  selectedUrgency === urg ? 'btn-obsidian' : 'btn-surface'
                }`}
              >
                {urg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List or Clean Empty State */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600">
            <Hospital className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {lang === 'bn'
                ? 'এই মুহূর্তে কোনো সক্রিয় রক্তের আবেদন নেই'
                : 'No Active Blood Requests Right Now'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
              {lang === 'bn'
                ? 'সকল ফেইক পোস্ট সরানো হয়েছে। কোনো রোগীর জন্য জরুরি রক্তের প্রয়োজন হলে নিচের বাটনে ট্যাপ করে রিয়েল-টাইম ব্রডকাস্ট পোস্ট করুন।'
                : 'All demo posts have been removed. If someone urgently needs blood, post a verified emergency broadcast below.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {(selectedGroup !== 'ALL' || selectedUrgency !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGroup('ALL');
                  setSelectedUrgency('ALL');
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl btn-obsidian font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                {lang === 'bn' ? 'সকল ফিল্টার রিসেট করুন' : 'Reset Filters'}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenSOSModal}
              className="min-h-[44px] px-5 py-2.5 rounded-xl btn-crimson font-bold text-xs inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>{t.createSosTitle}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
          const districtObj = DISTRICTS.find(
            (d) =>
              d.id === req.district.toLowerCase() ||
              d.nameBn === req.district.trim() ||
              d.nameEn.toLowerCase() === req.district.trim().toLowerCase()
          );
          const districtName = districtObj
            ? lang === 'bn'
              ? districtObj.nameBn
              : districtObj.nameEn
            : req.district;
          const upazilaObj = districtObj?.upazilas.find(
            (u) =>
              u.id === req.upazila.toLowerCase() ||
              u.nameBn === req.upazila.trim() ||
              u.nameEn.toLowerCase() === req.upazila.trim().toLowerCase()
          );
          const upazilaName = upazilaObj
            ? lang === 'bn'
              ? upazilaObj.nameBn
              : upazilaObj.nameEn
            : req.upazila;

          const reqAlerts = alertsByRequestId.get(req.id) || [];
          const dispatchedCount = Math.max(req.notifiedCount || 0, reqAlerts.length);
          const viewedCount = Math.max(
            req.viewedCount || 0,
            reqAlerts.filter(
              (a) =>
                a.deliveryState === 'VIEWED' ||
                a.deliveryState === 'RESPONDED_ACCEPT' ||
                a.deliveryState === 'RESPONDED_DECLINE'
            ).length
          );
          const acceptedAlerts = reqAlerts.filter((a) => a.deliveryState === 'RESPONDED_ACCEPT');
          const respondedCount = Math.max(
            req.respondedCount || 0,
            req.responders.length,
            acceptedAlerts.length
          );

          const effectiveLifecycle = deriveRequestLifecycleState({
            ...req,
            notifiedCount: dispatchedCount,
            viewedCount,
            respondedCount,
          });
          const lifecycleMeta = LIFECYCLE_LABELS[effectiveLifecycle];

          const isOwner =
            Boolean(currentUid && req.authorUid === currentUid) ||
            Boolean(!req.authorUid && req.id.startsWith('sos_'));
          const isActive = req.status === 'ACTIVE' && effectiveLifecycle !== 'EXPIRED';

          // Direct call matching opted-in donors for seeker while broadcast runs
          const directCallCandidates = isOwner && isActive
            ? rankDonorsForSeeker(donors, {
                bloodGroup: req.bloodGroup,
                compatibleMatchEnabled: true,
                exchangeAllowed: req.exchangeAllowed,
                district: req.district,
                urgency: req.urgency,
                originCoords: resolveBangladeshCoordinates({ district: req.district }),
                includeNearbyDistricts: (req.escalationLevel || 0) >= 2,
                onlyConfirmedOrAvailable: true,
                seekerIsVerifiedUser: isVerifiedSeeker,
                unsuccessfulDonorIds: unsuccessfulByReq[req.id] || [],
                lang,
              })
                .filter((r) => canSeekerViewDirectContact(r.donor, isVerifiedSeeker).allowed)
                .slice(0, 3)
            : [];

          const dialableDigits = (req.contactPhone || '').replace(/[^0-9+]/g, '');
          const hasDialablePhone = dialableDigits.replace(/\+/g, '').length >= 10;
          const hospitalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${req.hospitalName} ${districtName} Bangladesh`
          )}`;
          const smsShareText = `Emergency Blood Request: ${req.bloodGroup} (${Math.max(
            1,
            req.unitsNeeded - req.unitsCollected
          )} bag(s)) at ${req.hospitalName}, ${districtName}. Patient: ${req.patientName}.`;
          const waSosShareUrl = buildWhatsAppChatUrl('', smsShareText);
          const offlineSmsUrl = buildOfflineEmergencySmsUri(
            hasDialablePhone ? dialableDigits : '',
            hasDialablePhone
              ? `Hello, I am willing to donate ${req.bloodGroup} blood at ${req.hospitalName} for ${req.patientName}.`
              : smsShareText
          );

          const isExchangeOk =
            Boolean(req.exchangeAllowed) ||
            (req.reason || '').includes('এক্সচেঞ্জ') ||
            (req.reason || '').toLowerCase().includes('exchange');

          return (
            <div
              key={req.id}
              className={`cv-auto bg-white dark:bg-[#111827] border rounded-2xl p-4 sm:p-5 transition-colors shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-3.5 ${
                !isActive
                  ? 'border-slate-200 dark:border-slate-800 opacity-80'
                  : 'border-slate-200/90 dark:border-slate-800/90 hover:border-rose-400 dark:hover:border-rose-600'
              }`}
            >
              {/* Top Row: Group, Patient, Lifecycle State & Units */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl btn-crimson flex flex-col items-center justify-center font-black text-lg shrink-0">
                    <span>{req.bloodGroup}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {req.patientName}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        ({req.patientAge} {lang === 'bn' ? 'বছর' : 'y'})
                      </span>
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          req.urgency === 'CRITICAL'
                            ? 'text-red-600 dark:text-red-400'
                            : req.urgency === 'URGENT'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {req.urgency}
                      </span>
                      {isExchangeOk && (
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                          · <RefreshCw className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'এক্সচেঞ্জ' : 'Exchange OK'}</span>
                        </span>
                      )}
                    </div>

                    {/* Clean Unboxed Lifecycle & Time Metadata */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span
                        className={`font-bold ${
                          lifecycleMeta.tone === 'emerald'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : lifecycleMeta.tone === 'rose'
                            ? 'text-rose-600 dark:text-rose-400'
                            : lifecycleMeta.tone === 'amber'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {lang === 'bn' ? lifecycleMeta.bn : lifecycleMeta.en}
                      </span>
                      <span aria-hidden="true">·</span>
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{req.createdAt}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-rose-600 dark:text-rose-400">
                        {req.requiredDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {lang === 'bn' ? 'সংগ্রহ/প্রয়োজন' : 'Units'}
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {req.unitsCollected}/{req.unitsNeeded}
                  </div>
                </div>
              </div>

              {/* Hospital & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center justify-between gap-2 text-slate-700 dark:text-slate-200 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Hospital className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-medium truncate">{req.hospitalName}</span>
                  </div>
                  <a
                    href={hospitalMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 shrink-0"
                  >
                    <span>{lang === 'bn' ? 'ম্যাপ' : 'Map'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 min-w-0">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">
                    {upazilaName}, {districtName}
                  </span>
                </div>
              </div>

              {req.confirmedDonorName && (
                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {lang === 'bn'
                    ? `✓ নিশ্চিতকৃত রক্তদাতা: ${req.confirmedDonorName}`
                    : `✓ Confirmed Donor: ${req.confirmedDonorName}`}
                </div>
              )}

              {/* Seeker Owner Panel: Honest Delivery Counts, Escalation, Parallel Direct Call & Lifecycle Controls */}
              {isOwner && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {lang === 'bn'
                        ? 'আপনার ব্রডকাস্ট ও যোগাযোগ ট্র্যাকার'
                        : 'Your Request Delivery & Contact Tracker'}
                    </div>
                    <div className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {lang === 'bn' ? 'পরিধি:' : 'Radius:'} {req.searchRadiusKm || 10} km (L
                      {req.escalationLevel || 0})
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs py-1.5 border-y border-slate-200/70 dark:border-slate-800">
                    <div>
                      <div className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-white">
                        {dispatchedCount}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {lang === 'bn' ? 'প্রেরিত' : 'Dispatched'}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-white">
                        {viewedCount}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {lang === 'bn' ? 'দেখেছেন' : 'Viewed'}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono tabular-nums font-bold text-sm text-emerald-700 dark:text-emerald-400">
                        {respondedCount}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {lang === 'bn' ? 'সাড়া দিয়েছেন' : 'Responded'}
                      </div>
                    </div>
                    <div>
                      <div className="font-mono tabular-nums font-bold text-sm text-amber-700 dark:text-amber-400">
                        {req.contactAttemptsCount || 0}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {lang === 'bn' ? 'কল চেষ্টা' : 'Attempts'}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'প্রেরিত অ্যালার্ট মানে ডোনার সেটি পড়েছেন তা নিশ্চিত নয়। অপেক্ষা না করে নিচের উপলব্ধ রক্তদাতাদের সরাসরি কল করুন।'
                      : 'Dispatched alerts do not prove a donor has read them. Call available opted-in donors directly below while waiting.'}
                  </p>

                  {/* Accepted Donor Callbacks from Concurrent Alerts */}
                  {acceptedAlerts.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {lang === 'bn'
                          ? 'সাড়া দেওয়া রক্তদাতার কলব্যাক নম্বর:'
                          : 'Responded Donor Callback Numbers:'}
                      </div>
                      {acceptedAlerts.map((al) => {
                        const callUrl = buildDirectCallHref(al.responderPhone);
                        return (
                          <div
                            key={al.id}
                            className="flex items-center justify-between gap-2 text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60"
                          >
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                              {al.responderName || 'Voluntary Donor'} ·{' '}
                              <span className="font-mono tabular-nums">{al.responderPhone}</span>
                            </span>
                            {callUrl && (
                              <a
                                href={callUrl}
                                className="min-h-[34px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shrink-0"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{lang === 'bn' ? 'কল' : 'Call'}</span>
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Parallel Direct Contact Candidates While Alerts Run */}
                  {isActive && directCallCandidates.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {lang === 'bn'
                          ? 'অ্যালার্ট চলাকালীন সরাসরি উপলব্ধ ডোনার:'
                          : 'Available Opted-In Donors to Contact Now:'}
                      </div>
                      {directCallCandidates.map(({ donor, freshnessLabel }) => {
                        const cHref = buildDirectCallHref(donor.phone);
                        const wHref = buildWhatsAppHref(
                          donor.whatsappPhone || donor.phone,
                          `Urgent ${req.bloodGroup} blood needed at ${req.hospitalName}`
                        );
                        return (
                          <div
                            key={donor.id}
                            className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {donor.name} ({donor.bloodGroup})
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {donor.upazila}, {donor.district} · {freshnessLabel}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {cHref ? (
                                <a
                                  href={cHref}
                                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1 whitespace-nowrap"
                                  title="Opens Phone Dialer"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{lang === 'bn' ? 'কল' : 'Call'}</span>
                                </a>
                              ) : onRevealPhone ? (
                                <button
                                  type="button"
                                  onClick={() => onRevealPhone(donor)}
                                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{lang === 'bn' ? 'কল' : 'Call'}</span>
                                </button>
                              ) : null}

                              {wHref && (
                                <a
                                  href={wHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="min-h-[34px] px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 whitespace-nowrap"
                                  title="Opens WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WA</span>
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => handleLifecycleAction(req, 'CONFIRM_DONOR', donor)}
                                className="min-h-[34px] px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] cursor-pointer whitespace-nowrap"
                              >
                                {lang === 'bn' ? '✓ নিশ্চিত' : '✓ Confirm'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleLifecycleAction(req, 'ATTEMPT', donor)}
                                className="min-h-[34px] px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              >
                                <SkipForward className="w-3 h-3" />
                                <span>{lang === 'bn' ? 'পরের জন' : 'Next'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Seeker Escalation & Terminal Controls */}
                  {isActive && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={escalatingId === req.id || (req.escalationLevel || 0) >= 4}
                        onClick={() => handleEscalateRequest(req, false)}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:text-slate-900 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                      >
                        <Expand className="w-3.5 h-3.5" />
                        <span>
                          {escalatingId === req.id
                            ? lang === 'bn'
                              ? 'পরিধি বাড়ানো হচ্ছে...'
                              : 'Expanding...'
                            : lang === 'bn'
                            ? 'পরিধি ও পার্শ্ববর্তী জেলা বাড়ান'
                            : 'Expand Radius / Nearby Districts'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLifecycleAction(req, 'FULFILLED')}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'রক্ত মিলেছে (Fulfilled)' : 'Mark Fulfilled'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleLifecycleAction(req, 'CANCELLED')}
                        className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'বাতিল করুন' : 'Cancel Request'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Medical Reason */}
              {req.reason && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'কারণ: ' : 'Reason: '}
                  </span>
                  {req.reason}
                </p>
              )}

              {/* Public Responders & Volunteer Action Bar */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="tabular-nums">
                      {respondedCount > 0
                        ? `${respondedCount} ${t.respondersCount}`
                        : t.noRespondersYet}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {lang === 'bn' ? 'যোগাযোগ:' : 'Contact:'} {req.contactPhone}
                  </span>
                </div>

                {req.responders.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                    {req.responders.map((resp) => (
                      <span key={resp.id} className="inline-flex items-center gap-1 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{resp.name}</span>
                        <span className="text-slate-400">({resp.timestamp})</span>
                      </span>
                    ))}
                  </div>
                )}

                {isActive && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => openRespondSheetWithPrefill(req)}
                      className="col-span-2 sm:col-span-1 min-h-[42px] px-2.5 py-2 rounded-xl btn-crimson font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{t.iCanDonate}</span>
                    </button>

                    {hasDialablePhone ? (
                      <a
                        href={`tel:${dialableDigits}`}
                        className="min-h-[42px] px-2.5 py-2 rounded-xl btn-surface font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        title="Opens Phone Dialer"
                      >
                        <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{lang === 'bn' ? 'কল' : 'Call'}</span>
                      </a>
                    ) : (
                      <a
                        href={hospitalMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[42px] px-2.5 py-2 rounded-xl btn-surface font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{lang === 'bn' ? 'রুট ম্যাপ' : 'Map'}</span>
                      </a>
                    )}

                    <a
                      href={waSosShareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[42px] px-2.5 py-2 rounded-xl btn-emerald font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      title="Opens WhatsApp"
                    >
                      <span className="truncate">WhatsApp</span>
                    </a>

                    <a
                      href={offlineSmsUrl}
                      className="min-h-[42px] px-2.5 py-2 rounded-xl btn-obsidian font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      title="Opens SMS App"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">SMS</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleShare(req)}
                      className="min-h-[42px] px-2.5 py-2 rounded-xl btn-surface font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Share2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {shareSuccessId === req.id
                          ? lang === 'bn'
                            ? 'কপি ✓'
                            : 'Copied ✓'
                          : lang === 'bn'
                          ? 'শেয়ার'
                          : 'Share'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
          })}
        </div>
      )}

      {/* Responder Modal */}
      {respondingToReq && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
          <div className="w-full max-w-md my-2 sm:my-auto rounded-2xl bg-white dark:bg-[#1e293b] p-5 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-colors space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'রক্তদানে সাড়া দিন' : 'Step Forward to Donate'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {respondingToReq.patientName} · {respondingToReq.bloodGroup} ·{' '}
                    {respondingToReq.hospitalName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRespondingToReq(null)}
                className="min-h-[36px] min-w-[36px] rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
              {lang === 'bn'
                ? 'নিরাপত্তা নোট: রক্তদান সম্পূর্ণ মানবিক ও বিনামূল্যে। হাসপাতালে সরাসরি রোগীর স্বজন ও ডাক্তারের স্লিপ যাচাই করে রক্ত দিন।'
                : 'Safety Note: Voluntary blood donation is strictly free. Always verify the hospital requisition slip on arrival.'}
            </div>

            <form onSubmit={handleConfirmResponse} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'আপনার নাম' : 'Your Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'bn' ? 'আপনার নাম' : 'Full Name'}
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'আপনার মোবাইল নম্বর' : 'Your Callback Phone'} *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+88017XXXXXXXX"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'আপনার রক্তের গ্রুপ' : 'Your Blood Group'}
                </label>
                <select
                  value={donorGroup}
                  onChange={(e) => setDonorGroup(e.target.value as BloodGroup)}
                  className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {ALL_BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn'
                    ? 'পৌঁছানোর আনুমানিক সময়'
                    : 'Arrival / Availability Note'}
                </label>
                <input
                  type="text"
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: ৩০ মিনিটের মধ্যে হাসপাতালে পৌঁছাতে পারব'
                      : 'e.g. Can reach the hospital in 30 minutes'
                  }
                  value={arrivalNote}
                  onChange={(e) => setArrivalNote(e.target.value)}
                  className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {lang === 'bn' ? 'নিশ্চিত করুন ও নাম যোগ করুন' : 'Confirm & Volunteer'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
