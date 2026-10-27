import React, { useState, useEffect, useMemo } from 'react';
import {
  BloodGroup,
  UrgencyLevel,
  BloodRequest,
  Language,
  Donor,
  RequiredTimeWindow,
} from '../../types';
import { ALL_BLOOD_GROUPS, getCompatibleDonors } from '../../data/compatibility';
import { DISTRICTS } from '../../data/bangladeshGeo';
import { getTranslation } from '../../utils/translations';
import {
  auth,
  checkActionCooldownGuard,
  checkFcmAndServerCapabilities,
  dispatchEmergencyBroadcastClient,
  EmergencyBroadcastDispatchResult,
} from '../../firebase';
import {
  computeEscalationTargets,
  rankDonorsForSeeker,
  canSeekerViewDirectContact,
  buildDirectCallHref,
  buildWhatsAppHref,
} from '../../utils/donorMatcher';
import { resolveBangladeshCoordinates } from '../../utils/geolocation';
import { buildOfflineEmergencySmsUri } from '../../utils/sosAlertEngine';
import {
  X,
  ArrowLeft,
  Check,
  MapPin,
  CheckCircle2,
  Mail,
  RefreshCw,
  Phone,
  MessageSquare,
  AlertTriangle,
  Radio,
} from 'lucide-react';

interface RequestBloodWizardProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  donors?: Donor[];
  onSubmitSOS: (
    newRequest: BloodRequest,
    opts?: { alreadySyncedToCloud?: boolean }
  ) => void;
  onLogAudit: (action: 'CREATE_SOS', details: string) => void;
  onRevealPhone?: (donor: Donor) => void;
}

export const RequestBloodWizard: React.FC<RequestBloodWizardProps> = ({
  isOpen,
  onClose,
  lang,
  donors = [],
  onSubmitSOS,
  onLogAudit,
  onRevealPhone,
}) => {
  const t = getTranslation(lang);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [urgency, setUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [requiredTimeWindow, setRequiredTimeWindow] =
    useState<RequiredTimeWindow>('IMMEDIATE_2H');
  const [escalationIntervalMinutes, setEscalationIntervalMinutes] = useState<number>(10);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number>(30);
  const [unitsNeeded, setUnitsNeeded] = useState<number>(1);
  const [hospitalName, setHospitalName] = useState('');
  const [district, setDistrict] = useState('dhaka');
  const [contactPhone, setContactPhone] = useState('');
  const [reason, setReason] = useState('');
  const [exchangeAllowed, setExchangeAllowed] = useState(false);

  const [isDispatching, setIsDispatching] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] =
    useState<EmergencyBroadcastDispatchResult | null>(null);
  const [capabilities, setCapabilities] = useState<{
    fcmServerConfigured: boolean;
    smsProviderConfigured: boolean;
    smsProvider: string;
    browserNotificationPermission: string;
  } | null>(null);

  const isVerifiedSeeker = Boolean(
    auth.currentUser && (auth.currentUser.emailVerified || auth.currentUser.phoneNumber)
  );

  // Prefill seeker phone & district from real logged-in profile if available
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem('bloodsearch_current_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.phone && !contactPhone) setContactPhone(parsed.phone);
        if (parsed?.district) {
          const matched = DISTRICTS.find(
            (d) =>
              d.id === String(parsed.district).toLowerCase() ||
              d.nameBn === parsed.district ||
              d.nameEn.toLowerCase() === String(parsed.district).toLowerCase()
          );
          if (matched) setDistrict(matched.id);
        }
      }
    } catch {}

    checkFcmAndServerCapabilities()
      .then((cap) => setCapabilities(cap))
      .catch(() => {});
  }, [isOpen]);

  // Compute concurrent matching opted-in donors for this request
  const initialEscalationPlan = useMemo(() => {
    return computeEscalationTargets({
      targetLevel: 0,
      bloodGroup,
      originDistrict: district,
      allDonors: donors,
      alreadyNotifiedDonorIds: [],
      excludeUid: auth.currentUser?.uid,
      exchangeAllowed,
    });
  }, [bloodGroup, district, donors, exchangeAllowed]);

  // Top opted-in donors seeker can call immediately in parallel while alerts run
  const immediateDirectDonors = useMemo(() => {
    const origin = resolveBangladeshCoordinates({ district });
    const ranked = rankDonorsForSeeker(donors, {
      bloodGroup,
      compatibleMatchEnabled: true,
      exchangeAllowed,
      district,
      urgency,
      requiredTimeWindow,
      originCoords: origin,
      includeNearbyDistricts: true,
      onlyConfirmedOrAvailable: true,
      seekerIsVerifiedUser: isVerifiedSeeker,
      lang,
    });
    return ranked
      .filter((r) => canSeekerViewDirectContact(r.donor, isVerifiedSeeker).allowed)
      .slice(0, 4);
  }, [
    donors,
    bloodGroup,
    exchangeAllowed,
    district,
    urgency,
    requiredTimeWindow,
    isVerifiedSeeker,
    lang,
  ]);

  if (!isOpen) return null;

  const requiredTimeLabel =
    requiredTimeWindow === 'IMMEDIATE_2H'
      ? lang === 'bn'
        ? 'জরুরি ২ ঘণ্টার মধ্যে'
        : 'Immediate (Within 2h)'
      : requiredTimeWindow === 'TODAY_6H'
      ? lang === 'bn'
        ? 'আজ ৬ ঘণ্টার মধ্যে'
        : 'Today (Within 6h)'
      : requiredTimeWindow === 'WITHIN_24H'
      ? lang === 'bn'
        ? '২৪ ঘণ্টার মধ্যে'
        : 'Within 24 hours'
      : lang === 'bn'
      ? 'নির্ধারিত সময়'
      : 'Scheduled';

  const handleNextStep = async () => {
    setValidationError(null);
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
      return;
    }

    if (step === 3) {
      const cleanHospital = hospitalName.trim();
      const cleanPhone = contactPhone.trim();
      const digitsOnly = cleanPhone.replace(/\D/g, '');

      if (cleanHospital.length < 3) {
        setValidationError(
          lang === 'bn'
            ? 'অনুগ্রহ করে হাসপাতালের সঠিক নাম লিখুন।'
            : 'Please enter a valid hospital name.'
        );
        return;
      }
      if (digitsOnly.length < 10) {
        setValidationError(
          lang === 'bn'
            ? 'অনুগ্রহ করে সচল যোগাযোগ নম্বর (কমপক্ষে ১০ ডিজিট) লিখুন।'
            : 'Please enter a valid callback phone number (at least 10 digits).'
        );
        return;
      }

      const guard = checkActionCooldownGuard('CREATE_SOS', 6000);
      if (!guard.allowed) {
        setValidationError(
          lang === 'bn'
            ? `অনুগ্রহ করে ${guard.waitSeconds} সেকেন্ড অপেক্ষা করে পরবর্তী আবেদন পাঠান।`
            : `Please wait ${guard.waitSeconds}s before sending another emergency request.`
        );
        return;
      }

      setIsDispatching(true);
      try {
        const distObj = DISTRICTS.find((d) => d.id === district);
        const cleanPatient =
          patientName.trim() || (lang === 'bn' ? 'জরুরি রোগী' : 'Emergency Patient');
        const baseReason =
          reason.trim() || (lang === 'bn' ? 'জরুরি রক্ত সঞ্চালন' : 'Emergency transfusion');
        const finalReason = exchangeAllowed
          ? `${baseReason} [Exchange Allowed]`
          : baseReason;

        const nowMs = Date.now();
        const expiryHours =
          requiredTimeWindow === 'IMMEDIATE_2H'
            ? 6
            : requiredTimeWindow === 'TODAY_6H'
            ? 12
            : 24;

        const candidateIds = initialEscalationPlan.eligibleDonorsToNotify.map((d) => d.id);
        const reqId = `sos_${nowMs}`;

        const newReq: BloodRequest = {
          id: reqId,
          authorUid: auth.currentUser?.uid,
          patientName: cleanPatient,
          patientAge: Number(patientAge) || 30,
          bloodGroup,
          unitsNeeded: Number(unitsNeeded) || 1,
          unitsCollected: 0,
          hospitalName: cleanHospital,
          division: distObj?.divisionId || 'dhaka',
          district,
          upazila: distObj?.upazilas?.[0]?.id || 'sadar',
          urgency,
          requiredTimeWindow,
          contactName: cleanPatient,
          contactPhone: cleanPhone,
          requiredDate: requiredTimeLabel,
          reason: finalReason,
          exchangeAllowed,
          responders: [],
          createdAt: lang === 'bn' ? 'এইমাত্র' : 'Just now',
          createdAtMs: nowMs,
          expiresAtMs: nowMs + expiryHours * 60 * 60 * 1000,
          status: 'ACTIVE',
          lifecycleState: candidateIds.length > 0 ? 'DONORS_NOTIFIED' : 'SEARCHING',
          notifiedCount: candidateIds.length,
          viewedCount: 0,
          respondedCount: 0,
          contactAttemptsCount: 0,
          escalationLevel: 0,
          searchRadiusKm: initialEscalationPlan.radiusKm,
          escalationIntervalMinutes,
        };

        const broadcastRes = await dispatchEmergencyBroadcastClient({
          request: newReq,
          seekerCallbackPhone: cleanPhone,
          candidateCloudDonorIds: candidateIds,
        });

        const syncedReq: BloodRequest = {
          ...newReq,
          id: broadcastRes.requestId || reqId,
          notifiedCount: broadcastRes.alertsWritten,
          lifecycleState:
            broadcastRes.alertsWritten > 0 ? 'DONORS_NOTIFIED' : 'SEARCHING',
        };

        setDispatchResult(broadcastRes);
        onSubmitSOS(syncedReq, { alreadySyncedToCloud: broadcastRes.syncedToCloud });
        onLogAudit(
          'CREATE_SOS',
          `Dispatched ${bloodGroup} emergency request (${unitsNeeded} unit(s), notified=${broadcastRes.alertsWritten})`
        );
        setStep(4);
      } catch (err: any) {
        setValidationError(
          err?.message ||
            (lang === 'bn'
              ? 'আবেদন পাঠাতে সমস্যা হয়েছে। ডুপ্লিকেট বা রেট-লিমিট চেক করুন।'
              : 'Could not dispatch broadcast. Check duplicate or rate-limit rules.')
        );
      } finally {
        setIsDispatching(false);
      }
    }
  };

  const handleFinish = () => {
    setStep(1);
    setDispatchResult(null);
    setValidationError(null);
    onClose();
  };

  const progressWidthClass =
    step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
      <div className="w-full max-w-lg my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-colors flex flex-col justify-between text-left">
        <div>
          {/* Top Stepper Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            {step > 1 && step < 4 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-8" />
            )}

            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {step < 4
                ? lang === 'bn'
                  ? `জরুরি রক্তের রিকোয়েস্ট · ধাপ ${step}/৩`
                  : `Emergency Blood Request · Step ${step} of 3`
                : lang === 'bn'
                ? 'ব্রডকাস্ট স্ট্যাটাস ও সরাসরি কল'
                : 'Broadcast Status & Direct Contact'}
            </span>

            <button
              type="button"
              onClick={handleFinish}
              className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar (No Inline Styles) */}
          {step < 4 && (
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full my-3 overflow-hidden">
              <div
                className={`h-full bg-rose-600 transition-all duration-200 ${progressWidthClass}`}
              />
            </div>
          )}

          {/* STEP 1: URGENCY, REQUIRED TIME & AUTO-ESCALATION */}
          {step === 1 && (
            <div className="py-2 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {lang === 'bn'
                    ? 'জরুরিতা ও সময়সীমা নির্ধারণ করুন'
                    : 'Set Urgency & Required Time'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'একাধিক উপযুক্ত ও সম্মতিপ্রাপ্ত রক্তদাতাকে একইসাথে নোটিফাই করা হবে এবং সাড়া না পেলে পরিধি বাড়ানো হবে।'
                    : 'Notifies multiple matching opted-in donors concurrently and expands radius if no one responds.'}
                </p>
              </div>

              <div className="space-y-2.5">
                {(
                  [
                    {
                      id: 'CRITICAL' as UrgencyLevel,
                      titleBn: 'Critical (জীবন-মরণ জরুরি)',
                      titleEn: 'Critical (Immediate Emergency)',
                      descBn: 'তাৎক্ষণিক রক্ত প্রয়োজন — ১০ কিমি পরিধিতে অগ্রাধিকার ব্রডকাস্ট।',
                      descEn: 'Life-threatening need — priority concurrent alert to nearby donors.',
                      radius: '10 km start',
                    },
                    {
                      id: 'URGENT' as UrgencyLevel,
                      titleBn: 'Urgent (আজকের মধ্যে প্রয়োজন)',
                      titleEn: 'Urgent (Needed Today)',
                      descBn: 'ডায়ালাইসিস, ডেলিভারি বা চলমান চিকিৎসার জন্য কয়েক ঘণ্টার মধ্যে।',
                      descEn: 'Needed within hours for ongoing hospital care or procedure.',
                      radius: '25 km start',
                    },
                    {
                      id: 'STANDARD' as UrgencyLevel,
                      titleBn: 'Standard (নির্ধারিত অপারেশন)',
                      titleEn: 'Standard (Scheduled Procedure)',
                      descBn: 'পরিকল্পিত সার্জারি বা আগামীকালের জন্য রক্ত সংগ্রহ।',
                      descEn: 'Planned surgical reserve or next-day transfusion.',
                      radius: '50 km start',
                    },
                  ] as const
                ).map((item) => {
                  const active = urgency === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setUrgency(item.id);
                        if (item.id === 'CRITICAL') setRequiredTimeWindow('IMMEDIATE_2H');
                        else if (item.id === 'URGENT') setRequiredTimeWindow('TODAY_6H');
                        else setRequiredTimeWindow('WITHIN_24H');
                      }}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-colors cursor-pointer ${
                        active
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-1 ring-rose-500'
                          : 'bg-white dark:bg-[#1e293b] border-slate-300 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {lang === 'bn' ? item.titleBn : item.titleEn}
                        </span>
                        <span className="text-xs font-mono tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                          {item.radius}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {lang === 'bn' ? item.descBn : item.descEn}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'কখন প্রয়োজন' : 'Required Time Window'}
                  </label>
                  <select
                    value={requiredTimeWindow}
                    onChange={(e) =>
                      setRequiredTimeWindow(e.target.value as RequiredTimeWindow)
                    }
                    className="w-full h-10 px-3 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700"
                  >
                    <option value="IMMEDIATE_2H">
                      {lang === 'bn' ? '২ ঘণ্টার মধ্যে' : 'Within 2 hours'}
                    </option>
                    <option value="TODAY_6H">
                      {lang === 'bn' ? '৬ ঘণ্টার মধ্যে' : 'Within 6 hours'}
                    </option>
                    <option value="WITHIN_24H">
                      {lang === 'bn' ? '২৪ ঘণ্টার মধ্যে' : 'Within 24 hours'}
                    </option>
                    <option value="SCHEDULED">
                      {lang === 'bn' ? 'নির্ধারিত তারিখ' : 'Scheduled'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'bn'
                      ? 'সাড়া না পেলে পরিধি বৃদ্ধির বিরতি'
                      : 'No-Response Escalation Interval'}
                  </label>
                  <select
                    value={escalationIntervalMinutes}
                    onChange={(e) => setEscalationIntervalMinutes(Number(e.target.value))}
                    className="w-full h-10 px-3 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 tabular-nums"
                  >
                    <option value={5}>
                      {lang === 'bn' ? 'প্রতি ৫ মিনিট পর' : 'Every 5 minutes'}
                    </option>
                    <option value={10}>
                      {lang === 'bn' ? 'প্রতি ১০ মিনিট পর' : 'Every 10 minutes'}
                    </option>
                    <option value={15}>
                      {lang === 'bn' ? 'প্রতি ১৫ মিনিট পর' : 'Every 15 minutes'}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BLOOD GROUP SELECTOR */}
          {step === 2 && (
            <div className="py-2 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'রক্তের গ্রুপ নির্বাচন করুন' : 'Select Required Blood Group'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'রোগীর প্রয়োজনীয় রক্তের গ্রুপ নির্বাচন করুন'
                    : 'Select the patient’s required blood group'}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2.5 pt-1">
                {ALL_BLOOD_GROUPS.map((group) => {
                  const isSelected = bloodGroup === group;
                  return (
                    <button
                      type="button"
                      key={group}
                      onClick={() => setBloodGroup(group)}
                      className={`h-16 rounded-2xl font-black text-lg transition-colors cursor-pointer flex flex-col items-center justify-center relative ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:border-rose-400'
                      }`}
                    >
                      <span>{group}</span>
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-rose-600 text-[10px] font-bold flex items-center justify-center">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    {bloodGroup}{' '}
                    {lang === 'bn' ? 'গ্রুপ নির্বাচিত' : 'Selected'}
                  </span>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-300 mt-0.5">
                    {lang === 'bn' ? 'সামঞ্জস্যপূর্ণ ডোনার গ্রুপ:' : 'Compatible donor groups:'}{' '}
                    {getCompatibleDonors(bloodGroup).join(', ')}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              </div>
            </div>
          )}

          {/* STEP 3: MINIMUM ESSENTIAL HOSPITAL & CONTACT DETAILS */}
          {step === 3 && (
            <div className="py-2 space-y-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {lang === 'bn'
                    ? 'ন্যূনতম জরুরি তথ্য দিন'
                    : 'Minimum Essential Emergency Details'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'হাসপাতাল, জেলা ও আপনার সচল নম্বর দিলেই তাৎক্ষণিক ব্রডকাস্ট পাঠানো যাবে।'
                    : 'Only hospital, district, and active callback phone are required to dispatch.'}
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>{t.unitsNeeded}</span>
                    <span className="font-mono tabular-nums text-rose-600 dark:text-rose-400 font-black text-sm">
                      {unitsNeeded} {lang === 'bn' ? 'ব্যাগ' : 'Unit(s)'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={unitsNeeded}
                    onChange={(e) => setUnitsNeeded(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.hospitalName} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      lang === 'bn'
                        ? 'যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল (ওয়ার্ড/কেবিন)'
                        : 'e.g. Dhaka Medical College Hospital (Ward/Bed)'
                    }
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'bn' ? 'জেলা' : 'District'} *
                    </label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      {DISTRICTS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {lang === 'bn' ? d.nameBn : d.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t.contactPhone} *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+88017XXXXXXXX"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {t.patientName} ({lang === 'bn' ? 'ঐচ্ছিক' : 'Optional'})
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'bn' ? 'রোগীর নাম' : 'Patient Name'}
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      {lang === 'bn' ? 'বয়স' : 'Age'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={patientAge}
                      onChange={(e) => setPatientAge(Number(e.target.value))}
                      className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 font-mono tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'সংক্ষিপ্ত কারণ (ঐচ্ছিক)' : 'Medical Reason (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      lang === 'bn'
                        ? 'যেমন: জরুরি সার্জারি / ডেঙ্গু / থ্যালাসেমিয়া'
                        : 'e.g. Emergency surgery / trauma / thalassemia'
                    }
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <label className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={exchangeAllowed}
                    onChange={(e) => setExchangeAllowed(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-emerald-600 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'bn'
                          ? 'ব্লাড ব্যাংক এক্সচেঞ্জ অনুমোদিত (যেকোনো গ্রুপ)'
                          : 'Blood Bank Exchange Allowed (Any Blood Group)'}
                      </span>
                    </span>
                  </div>
                </label>

                {/* Honest Preview of Notification Channels */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-rose-500" />
                    <span>
                      {lang === 'bn'
                        ? `সম্মতিপ্রাপ্ত ম্যাচিং ডোনার প্রস্তুত: ${initialEscalationPlan.eligibleDonorsToNotify.length} জন (${initialEscalationPlan.tierLabelBn})`
                        : `Eligible opted-in donors in initial tier: ${initialEscalationPlan.eligibleDonorsToNotify.length} (${initialEscalationPlan.tierLabelEn})`}
                    </span>
                  </div>
                  <p>
                    {capabilities?.smsProviderConfigured
                      ? lang === 'bn'
                        ? `সার্ভার SMS ফ্যালব্যাক সক্রিয় (${capabilities.smsProvider})।`
                        : `Server SMS fallback configured (${capabilities.smsProvider}).`
                      : lang === 'bn'
                      ? 'সার্ভার SMS গেটওয়ে কনফিগার করা নেই — ইন-অ্যাপ রিয়েল-টাইম অ্যালার্ট ও সরাসরি কল/WhatsApp ব্যবহৃত হবে।'
                      : 'Server SMS gateway not configured — dispatching concurrent real-time in-app alerts + direct Call/WhatsApp.'}
                  </p>
                </div>

                {validationError && (
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">
                    {validationError}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: HONEST DELIVERY STATUS + PARALLEL DIRECT CALL TO MATCHING DONORS */}
          {step === 4 && (
            <div className="py-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {dispatchResult?.syncedToCloud
                      ? lang === 'bn'
                        ? 'জরুরি ব্রডকাস্ট সক্রিয় হয়েছে'
                        : 'Emergency Broadcast Active'
                      : lang === 'bn'
                      ? 'রিকোয়েস্ট সংরক্ষিত হয়েছে (সরাসরি কল করুন)'
                      : 'Request Saved Locally (Call Donors Directly)'}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {dispatchResult?.honestNotice}
                  </p>
                </div>
              </div>

              {/* Honest Channel Delivery Matrix */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    {lang === 'bn' ? 'ইন-অ্যাপ ডোনার অ্যালার্ট প্রেরিত:' : 'Concurrent In-App Alerts Dispatched:'}
                  </span>
                  <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {dispatchResult?.alertsWritten ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    {lang === 'bn' ? 'ব্যাকগ্রাউন্ড পুশ (FCM):' : 'Background Push (FCM):'}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {dispatchResult?.pushChannelState === 'CONFIGURED'
                      ? lang === 'bn'
                        ? 'সক্রিয়'
                        : 'Configured'
                      : lang === 'bn'
                      ? 'ব্রাউজার/ইন-অ্যাপ রিয়েল-টাইম'
                      : 'Browser/In-App Realtime'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">
                    {lang === 'bn' ? 'সার্ভার SMS ফ্যালব্যাক:' : 'Server SMS Fallback:'}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                    {dispatchResult?.smsChannelState === 'SENT'
                      ? `Sent (${dispatchResult.smsSentCount})`
                      : lang === 'bn'
                      ? 'কনফিগার করা নেই (নিচের SMS বাটন ব্যবহার করুন)'
                      : 'Not configured (use device SMS or Call)'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 pt-1 border-t border-slate-200 dark:border-slate-800">
                  {lang === 'bn'
                    ? 'সতর্কতা: নোটিফিকেশন ডেলিভারি হওয়া মানেই ডোনার সেটি দেখেছেন তা নিশ্চিত নয়। সময় বাঁচাতে নিচের উপলব্ধ রক্তদাতাদের এখনই সরাসরি কল করুন।'
                    : 'Honest Delivery Note: A dispatched notification does not prove a donor has read it. Call opted-in available donors directly below while alerts run.'}
                </p>
              </div>

              {/* Direct Call Strip While Alerts Are Running */}
              {immediateDirectDonors.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'bn'
                      ? 'অ্যালার্ট চলাকালীন এখনই সরাসরি কল করুন:'
                      : 'Call Available Opted-In Donors Right Now:'}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {immediateDirectDonors.map(({ donor, freshnessLabel }) => {
                      const callHref = buildDirectCallHref(donor.phone);
                      const waHref = buildWhatsAppHref(
                        donor.whatsappPhone || donor.phone,
                        `Emergency ${bloodGroup} blood needed at ${hospitalName}. Callback: ${contactPhone}`
                      );
                      return (
                        <div
                          key={donor.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {donor.name} · {donor.bloodGroup}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {donor.upazila}, {donor.district} · {freshnessLabel}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {callHref ? (
                              <a
                                href={callHref}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1 whitespace-nowrap"
                                title="Opens Phone Dialer"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{lang === 'bn' ? 'কল' : 'Call'}</span>
                              </a>
                            ) : onRevealPhone ? (
                              <button
                                type="button"
                                onClick={() => onRevealPhone(donor)}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              >
                                <Phone className="w-3 h-3" />
                                <span>{lang === 'bn' ? 'কল' : 'Call'}</span>
                              </button>
                            ) : null}

                            {waHref && (
                              <a
                                href={waHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 whitespace-nowrap"
                                title="Opens WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>WA</span>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Device Native SMS Fallback */}
              <a
                href={buildOfflineEmergencySmsUri(
                  '',
                  `Emergency: ${bloodGroup} blood needed (${unitsNeeded} unit(s)) at ${hospitalName} (${district}). Callback: ${contactPhone}`
                )}
                className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                <span>
                  {lang === 'bn'
                    ? 'ফোনের SMS অ্যাপ খুলে পরিচিতদের বার্তা পাঠান'
                    : 'Open Phone SMS App for Offline Fallback'}
                </span>
              </a>

              {/* Medical Emergency Disclaimer */}
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-300/70 dark:border-amber-800/70 flex items-start gap-2 text-[11px] text-amber-950 dark:text-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  {lang === 'bn'
                    ? 'BloodSearch কোনো জরুরি হাসপাতাল সার্ভিস নয়। তীব্র সংকটে হাসপাতালের ব্লাড ব্যাংক ও চিকিৎসকের পরামর্শ নিন বা ৯৯৯-এ কল করুন।'
                    : 'BloodSearch is not an emergency medical service and cannot guarantee donor availability. Contact your hospital blood bank or call 999 in critical emergencies.'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Primary CTA */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
          {step < 4 ? (
            <button
              type="button"
              disabled={isDispatching}
              onClick={handleNextStep}
              className="w-full min-h-[48px] rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
            >
              <span>
                {isDispatching
                  ? lang === 'bn'
                    ? 'ডোনারদের কাছে পাঠানো হচ্ছে...'
                    : 'Dispatching Concurrent Alerts...'
                  : step === 3
                  ? lang === 'bn'
                    ? 'জরুরি ব্রডকাস্ট পাঠান'
                    : 'Broadcast Emergency Request'
                  : lang === 'bn'
                  ? 'পরবর্তী ধাপ →'
                  : 'Continue →'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="w-full min-h-[48px] rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm transition-colors cursor-pointer"
            >
              <span>
                {lang === 'bn'
                  ? 'রিকোয়েস্ট ট্র্যাকিং ফিডে যান'
                  : 'View Live Request Tracking'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
