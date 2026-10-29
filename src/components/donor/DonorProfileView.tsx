import React, { useState, useEffect } from 'react';
import {
  Language,
  BloodGroup,
  Donor,
  HealthConditions,
  UserAccount,
  DonorAvailabilityStatus,
  ContactVisibility,
  ContactConsentRequestItem,
} from '../../types';
import { ALL_BLOOD_GROUPS } from '../../data/compatibility';
import { DISTRICTS } from '../../data/bangladeshGeo';
import {
  QrCode,
  Award,
  X,
  Lock,
  LogOut,
  LogIn,
  ExternalLink,
  MessageCircle,
  UserPlus,
  Download,
  CalendarCheck,
  Droplet,
  CheckCircle2,
  BellOff,
  ShieldCheck,
  Phone,
  MapPin,
  LocateFixed,
  Pencil,
  Check,
} from 'lucide-react';
import { PrivacyPolicyModal } from '../ecosystem/PrivacyPolicyModal';
import { DonorCertificateModal } from './DonorCertificateModal';
import {
  downloadSmartDonorIdCardPng,
  getStoredDonationLogs,
  DonationLogRecord,
  calculateRecoveryCountdown,
} from '../../utils/sosAlertEngine';
import {
  isValidBangladeshMobilePhone,
  normalizeValidBangladeshMobileE164,
} from '../../utils/donorMatcher';
import {
  requestFreshHighAccuracyGPS,
  reverseGeocodeBangladeshCoords,
} from '../../utils/geolocation';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogleReal,
  signOutReal,
  DEFAULT_AVATAR_DATA_URI,
  isBootstrappedAdminUser,
  isUserVerifiedForWrites,
  registerSmartAccountInFirestore,
  updateDonorAvailabilityAndConsentInFirestore,
  recordCompletedDonationInFirestore,
  subscribeIncomingContactRequestsForDonor,
  respondToContactRequestInFirestore,
  parseFirebaseAuthError,
  User as FirebaseUser,
} from '../../firebase';

interface DonorProfileViewProps {
  lang: Language;
  onOpenRegister?: (role?: 'USER' | 'ADMIN') => void;
  onOpenAuthModal?: () => void;
}

export const DonorProfileView: React.FC<DonorProfileViewProps> = ({
  lang,
  onOpenRegister,
  onOpenAuthModal,
}) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('bloodsearch_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [donationLogs, setDonationLogs] = useState<DonationLogRecord[]>(() =>
    getStoredDonationLogs()
  );
  const [statusToast, setStatusToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });
    const syncUser = () => {
      try {
        const saved = localStorage.getItem('bloodsearch_current_user');
        const parsed = saved ? JSON.parse(saved) : null;
        setCurrentUser(parsed);
        if (parsed && typeof parsed.availableToDonate === 'boolean') {
          setIsAvailable(parsed.availableToDonate);
        }
        setDonationLogs(getStoredDonationLogs());
      } catch {}
    };
    window.addEventListener('bloodsearch_user_changed', syncUser);
    return () => {
      unsubAuth();
      window.removeEventListener('bloodsearch_user_changed', syncUser);
    };
  }, []);

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean>(currentUser?.availableToDonate ?? true);
  const [availabilityStatus, setAvailabilityStatus] = useState<DonorAvailabilityStatus>(
    currentUser?.availabilityStatus ||
      (currentUser?.availableToDonate === false ? 'TEMPORARILY_UNAVAILABLE' : 'AVAILABLE')
  );
  const [confirmedAtMs, setConfirmedAtMs] = useState<number | undefined>(
    currentUser?.availabilityConfirmedAtMs
  );
  const [contactVisibility, setContactVisibility] = useState<ContactVisibility>(
    currentUser?.contactVisibility ||
      (currentUser?.shareDirectContact === false ? 'REQUEST_ONLY' : 'PUBLIC_OPT_IN')
  );
  const [allowCall, setAllowCall] = useState<boolean>(currentUser?.allowCall !== false);
  const [allowWhatsApp, setAllowWhatsApp] = useState<boolean>(currentUser?.allowWhatsApp !== false);
  const [allowSms, setAllowSms] = useState<boolean>(currentUser?.allowSms !== false);
  const [emergencyAlertsOptIn, setEmergencyAlertsOptIn] = useState<boolean>(
    currentUser?.emergencyAlertsOptIn !== false
  );
  const [alertsPaused, setAlertsPaused] = useState<boolean>(currentUser?.alertsPaused === true);
  const [isSavingConsent, setIsSavingConsent] = useState(false);
  const [incomingContactRequests, setIncomingContactRequests] = useState<
    ContactConsentRequestItem[]
  >([]);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setIncomingContactRequests([]);
      return;
    }
    const unsub = subscribeIncomingContactRequestsForDonor(firebaseUser.uid, (items) => {
      setIncomingContactRequests(items);
    });
    return () => unsub();
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (!currentUser) return;
    const status: DonorAvailabilityStatus =
      currentUser.availabilityStatus ||
      (currentUser.availableToDonate === false ? 'TEMPORARILY_UNAVAILABLE' : 'AVAILABLE');
    setAvailabilityStatus(status);
    setIsAvailable(status === 'AVAILABLE');
    if (currentUser.availabilityConfirmedAtMs) {
      setConfirmedAtMs(currentUser.availabilityConfirmedAtMs);
    }
    if (currentUser.contactVisibility) {
      setContactVisibility(currentUser.contactVisibility);
    }
    setAllowCall(currentUser.allowCall !== false);
    setAllowWhatsApp(currentUser.allowWhatsApp !== false);
    setAllowSms(currentUser.allowSms !== false);
    setEmergencyAlertsOptIn(currentUser.emergencyAlertsOptIn !== false);
    setAlertsPaused(currentUser.alertsPaused === true);
  }, [currentUser]);

  // Quick Inline Profile Edit State (Name, Blood Group, Mobile, District, Custom Area + GPS)
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState<BloodGroup>('O+');
  const [editPhone, setEditPhone] = useState('');
  const [editDistrict, setEditDistrict] = useState('dhaka');
  const [editArea, setEditArea] = useState('');
  const [isSavingQuickEdit, setIsSavingQuickEdit] = useState(false);
  const [isLocatingQuickGps, setIsLocatingQuickGps] = useState(false);
  const [quickEditError, setQuickEditError] = useState<string | null>(null);

  const openInlineQuickEdit = () => {
    setQuickEditError(null);
    setEditName(
      currentUser?.name ||
        firebaseUser?.displayName ||
        firebaseUser?.email?.split('@')[0] ||
        ''
    );
    setEditGroup(currentUser?.bloodGroup || 'O+');
    setEditPhone(
      currentUser?.phone && currentUser.phone !== '01700000000'
        ? currentUser.phone
        : firebaseUser?.phoneNumber || ''
    );
    const matchedDist = DISTRICTS.find(
      (d) =>
        d.id === String(currentUser?.district || '').toLowerCase() ||
        d.nameBn === currentUser?.district ||
        d.nameEn.toLowerCase() === String(currentUser?.district || '').toLowerCase()
    );
    setEditDistrict(matchedDist?.id || 'dhaka');
    setEditArea(
      currentUser?.upazila &&
        currentUser.upazila !== 'sadar' &&
        currentUser.upazila !== 'সদর'
        ? currentUser.upazila
        : ''
    );
    setIsQuickEditOpen(true);
  };

  const handleQuickEditGps = async () => {
    setIsLocatingQuickGps(true);
    setQuickEditError(null);
    try {
      const res = await requestFreshHighAccuracyGPS();
      if (res.isRealGps) {
        const rev = await reverseGeocodeBangladeshCoords(res.coords, lang);
        setEditDistrict(rev.districtId);
        setEditArea(rev.areaText);
      } else {
        setQuickEditError(
          lang === 'bn'
            ? 'ব্রাউজারে GPS বন্ধ আছে — নিচে আপনার এলাকার নাম (যেমন: নিকেতন) লিখে দিন।'
            : 'Browser GPS is off — simply type your area name (e.g. Niketon) below.'
        );
      }
    } finally {
      setIsLocatingQuickGps(false);
    }
  };

  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickEditError(null);

    const cleanName = editName.trim();
    if (cleanName.length < 2) {
      setQuickEditError(
        lang === 'bn' ? 'অনুগ্রহ করে আপনার নাম লিখুন।' : 'Please enter your name.'
      );
      return;
    }

    const cleanPhone = normalizeValidBangladeshMobileE164(editPhone);
    if (!cleanPhone || !isValidBangladeshMobilePhone(editPhone)) {
      setQuickEditError(
        lang === 'bn'
          ? 'সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন (যেমন: 01712345678)।'
          : 'Please enter a valid 11-digit mobile number (e.g. 01712345678).'
      );
      return;
    }

    let pendingAuth: Promise<FirebaseUser> | null = null;
    if (!auth.currentUser || !isUserVerifiedForWrites(auth.currentUser)) {
      pendingAuth = signInWithGoogleReal();
    }

    setIsSavingQuickEdit(true);
    try {
      let activeUser = auth.currentUser;
      if (pendingAuth) {
        try {
          activeUser = await pendingAuth;
          setFirebaseUser(activeUser);
        } catch (authErr: any) {
          const parsed = parseFirebaseAuthError(authErr);
          setQuickEditError(lang === 'bn' ? parsed.messageBn : parsed.messageEn);
          setIsSavingQuickEdit(false);
          return;
        }
      }

      if (!activeUser) {
        setIsSavingQuickEdit(false);
        return;
      }

      const distObj = DISTRICTS.find((d) => d.id === editDistrict) || DISTRICTS[0];
      const finalArea = (
        editArea.trim() ||
        (lang === 'bn' ? distObj.nameBn : distObj.nameEn) ||
        'Dhaka'
      ).slice(0, 50);

      const isSuperOwner = isBootstrappedAdminUser(activeUser);
      const effectiveRole: 'USER' | 'ADMIN' =
        currentUser?.role === 'ADMIN' || isSuperOwner ? 'ADMIN' : 'USER';

      const uidShort =
        activeUser.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || '1001';
      const defaultCardId =
        effectiveRole === 'ADMIN' ? `ADMIN-BD-${uidShort}` : `BS-${uidShort}`;
      const cleanCardId =
        currentUser?.idCardNumber &&
        /^[a-zA-Z0-9+-]{5,40}$/.test(currentUser.idCardNumber)
          ? currentUser.idCardNumber
          : defaultCardId;

      // If previously auto-synced with placeholder phone '01700000000', promote visibility to PUBLIC_OPT_IN when user saves their real phone!
      const hadPlaceholderPhone =
        !currentUser?.phone || currentUser.phone === '01700000000';
      const effectiveVisibility =
        hadPlaceholderPhone && contactVisibility === 'REQUEST_ONLY'
          ? 'PUBLIC_OPT_IN'
          : contactVisibility;
      const effectiveShareDirect = effectiveVisibility !== 'REQUEST_ONLY';

      const updatedAccount: UserAccount = {
        id: activeUser.uid,
        name: cleanName,
        email:
          activeUser.email ||
          currentUser?.email ||
          `${activeUser.uid.slice(0, 8)}@bloodsearch.bd`,
        phone: cleanPhone,
        whatsappPhone: cleanPhone,
        facebookUrl: currentUser?.facebookUrl || 'https://facebook.com/bloodsearch.bd',
        bloodGroup: editGroup,
        division: distObj.divisionId || 'dhaka',
        district: distObj.id,
        upazila: finalArea,
        photoUrl: currentUser?.photoUrl || activeUser.photoURL || DEFAULT_AVATAR_DATA_URI,
        role: effectiveRole,
        verifiedStatus: true,
        idCardNumber: cleanCardId,
        age: currentUser?.age || 25,
        gender: currentUser?.gender || 'MALE',
        weightKg: currentUser?.weightKg || 62,
        availableToDonate: availabilityStatus === 'AVAILABLE',
        availabilityStatus,
        availabilityConfirmedAtMs: Date.now(),
        shareDirectContact: effectiveShareDirect,
        contactVisibility: effectiveVisibility,
        allowCall,
        allowWhatsApp,
        allowSms,
        emergencyAlertsOptIn,
        alertsPaused,
        lastDonationDate: currentUser?.lastDonationDate || '',
        totalDonations: currentUser?.totalDonations || 0,
        createdAt: currentUser?.createdAt || new Date().toISOString(),
      };

      const updatedDonor: Donor = {
        id: activeUser.uid,
        name: cleanName,
        bloodGroup: editGroup,
        division: distObj.divisionId || 'dhaka',
        district: distObj.id,
        upazila: finalArea,
        phone: cleanPhone,
        whatsappPhone: cleanPhone,
        available: availabilityStatus === 'AVAILABLE',
        availabilityStatus,
        availabilityConfirmedAtMs: Date.now(),
        shareDirectContact: effectiveShareDirect,
        contactVisibility: effectiveVisibility,
        allowCall,
        allowWhatsApp,
        allowSms,
        emergencyAlertsOptIn,
        alertsPaused,
        isCloudRecord: true,
        lastDonatedDate: updatedAccount.lastDonationDate || '',
        totalDonations: updatedAccount.totalDonations || 0,
        verifiedBadge: effectiveRole === 'ADMIN',
        rating: 5.0,
        reviewsCount: 0,
        age: updatedAccount.age || 25,
        gender: updatedAccount.gender || 'MALE',
        weightKg: updatedAccount.weightKg || 62,
        hospitalAffiliation:
          effectiveRole === 'ADMIN'
            ? 'অ্যাডমিন ও রক্ত সমন্বয়ক'
            : 'স্বেচ্ছাসেবী রক্তদাতা',
        avatar: updatedAccount.photoUrl,
      };

      await registerSmartAccountInFirestore({
        firebaseUser: activeUser,
        account: updatedAccount,
        donor: updatedDonor,
      });

      if (effectiveVisibility !== contactVisibility) {
        setContactVisibility(effectiveVisibility);
      }
      localStorage.setItem('bloodsearch_current_user', JSON.stringify(updatedAccount));
      setCurrentUser(updatedAccount);
      window.dispatchEvent(new Event('bloodsearch_user_changed'));
      setIsQuickEditOpen(false);
      showToast(
        lang === 'bn'
          ? '✓ আপনার নাম, মোবাইল নম্বর ও ঠিকানা সফলভাবে পরিবর্তন হয়েছে!'
          : '✓ Your name, phone, and address have been updated!'
      );
    } catch (err) {
      console.error('Quick profile update failed:', err);
      setQuickEditError(
        lang === 'bn'
          ? 'তথ্য সেভ করা যায়নি। ইন্টারনেট সংযোগ চেক করে আবার চেষ্টা করুন।'
          : 'Could not save details. Please check your connection and try again.'
      );
    } finally {
      setIsSavingQuickEdit(false);
    }
  };

  // Quick Log Completed Donation inside Profile
  const [showLogForm, setShowLogForm] = useState(false);
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logType, setLogType] = useState<'WHOLE_BLOOD' | 'PLATELET'>('WHOLE_BLOOD');
  const [logHospital, setLogHospital] = useState('');
  const [isLoggingDonation, setIsLoggingDonation] = useState(false);

  const [healthConditions, setHealthConditions] = useState<HealthConditions>({
    nonAlcoholic: true,
    hivNegative: true,
    rheumaticFeverNegative: true,
    covidNegative: true,
    thalassemiaNegative: true,
    hepatitisNegative: true,
    normalBloodPressure: true,
  });

  const toggleCondition = (key: keyof HealthConditions) => {
    setHealthConditions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  const applyConsentAndAvailabilityUpdate = async (
    overrides: Partial<{
      availabilityStatus: DonorAvailabilityStatus;
      confirmNow: boolean;
      contactVisibility: ContactVisibility;
      allowCall: boolean;
      allowWhatsApp: boolean;
      allowSms: boolean;
      emergencyAlertsOptIn: boolean;
      alertsPaused: boolean;
    }>
  ) => {
    const nextStatus = overrides.availabilityStatus ?? availabilityStatus;
    const nextVis = overrides.contactVisibility ?? contactVisibility;
    const nextCall = overrides.allowCall ?? allowCall;
    const nextWa = overrides.allowWhatsApp ?? allowWhatsApp;
    const nextSms = overrides.allowSms ?? allowSms;
    const nextEmerg = overrides.emergencyAlertsOptIn ?? emergencyAlertsOptIn;
    const nextPaused = overrides.alertsPaused ?? alertsPaused;
    const confirmNow = overrides.confirmNow ?? (nextStatus === 'AVAILABLE');

    setAvailabilityStatus(nextStatus);
    setIsAvailable(nextStatus === 'AVAILABLE');
    setContactVisibility(nextVis);
    setAllowCall(nextCall);
    setAllowWhatsApp(nextWa);
    setAllowSms(nextSms);
    setEmergencyAlertsOptIn(nextEmerg);
    setAlertsPaused(nextPaused);
    if (confirmNow) {
      setConfirmedAtMs(Date.now());
    }

    setIsSavingConsent(true);
    try {
      const synced = await updateDonorAvailabilityAndConsentInFirestore({
        availabilityStatus: nextStatus,
        confirmNow,
        shareDirectContact: nextVis !== 'REQUEST_ONLY',
        contactVisibility: nextVis,
        allowCall: nextCall,
        allowWhatsApp: nextWa,
        allowSms: nextSms,
        emergencyAlertsOptIn: nextEmerg,
        alertsPaused: nextPaused,
      });
      showToast(
        lang === 'bn'
          ? `✓ প্রস্তুতি ও গোপনীয়তা সেটিংস সংরক্ষিত হয়েছে (${synced ? 'ক্লাউড সিঙ্কড' : 'লোকাল সেভড'})।`
          : `✓ Availability & contact privacy updated (${synced ? 'Cloud Synced' : 'Saved Locally'}).`
      );
    } finally {
      setIsSavingConsent(false);
    }
  };

  const handleRespondContactReq = async (reqId: string, approve: boolean) => {
    const validDonorPhone = isValidBangladeshMobilePhone(currentUser?.phone)
      ? currentUser?.phone
      : isValidBangladeshMobilePhone(firebaseUser?.phoneNumber)
      ? firebaseUser?.phoneNumber || undefined
      : undefined;
    const validDonorWa = isValidBangladeshMobilePhone(currentUser?.whatsappPhone)
      ? currentUser?.whatsappPhone
      : validDonorPhone;

    if (approve && !validDonorPhone) {
      showToast(
        lang === 'bn'
          ? 'নম্বর শেয়ার করার আগে "প্রোফাইল / আইডি আপডেট" বাটনে গিয়ে আপনার সচল মোবাইল নম্বর যুক্ত করুন।'
          : 'Please add your active mobile number via "Update Smart ID" before approving contact sharing.'
      );
      onOpenRegister?.('USER');
      return;
    }

    const ok = await respondToContactRequestInFirestore({
      contactReqId: reqId,
      approve,
      donorPhone: validDonorPhone,
      donorWhatsApp: validDonorWa,
    });
    if (ok) {
      showToast(
        approve
          ? lang === 'bn'
            ? '✓ রক্তপ্রার্থীর জন্য আপনার নম্বর অনুমোদিত হয়েছে।'
            : '✓ Approved! This seeker can now call/WhatsApp you directly.'
          : lang === 'bn'
          ? 'অনুরোধটি প্রত্যাখ্যান করা হয়েছে।'
          : 'Contact request declined.'
      );
    }
  };

  const handleSaveDonationLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingDonation) return;
    setIsLoggingDonation(true);
    try {
      const res = await recordCompletedDonationInFirestore({
        donationDate: logDate,
        donationType: logType,
        hospitalName: logHospital.trim() || (lang === 'bn' ? 'রক্ত সঞ্চালন কেন্দ্র' : 'Blood Center'),
      });
      setIsAvailable(false);
      setShowLogForm(false);
      setLogHospital('');
      setDonationLogs(getStoredDonationLogs());
      showToast(
        lang === 'bn'
          ? `✓ অভিনন্দন! রক্তদান রেকর্ড যুক্ত হয়েছে (মোট ${res.totalDonations} বার) এবং রিকভারি টাইমার চালু হয়েছে।`
          : `✓ Donation logged (${res.totalDonations} total) & recovery countdown started!`
      );
    } finally {
      setIsLoggingDonation(false);
    }
  };

  const isLoggedIn = Boolean(currentUser || firebaseUser);
  const displayName =
    currentUser?.name ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split('@')[0] ||
    (lang === 'bn' ? 'গেস্ট ভিজিটর (লগইন করুন)' : 'Guest Visitor');
  const verifiedProfilePhone = isValidBangladeshMobilePhone(currentUser?.phone)
    ? currentUser!.phone
    : isValidBangladeshMobilePhone(firebaseUser?.phoneNumber)
    ? firebaseUser!.phoneNumber!
    : '';
  const verifiedWhatsappPhone = isValidBangladeshMobilePhone(currentUser?.whatsappPhone)
    ? currentUser!.whatsappPhone!
    : '';
  const displayPhone =
    verifiedProfilePhone ||
    (isLoggedIn
      ? lang === 'bn'
        ? 'নম্বর যুক্ত হয়নি'
        : 'Phone not added'
      : '—');
  const displayEmail =
    currentUser?.email ||
    firebaseUser?.email ||
    (lang === 'bn' ? 'অ্যাকাউন্ট যুক্ত নয়' : 'Not signed in');
  const displayGroup = currentUser?.bloodGroup || 'B+';
  const displayAvatar = currentUser?.photoUrl || firebaseUser?.photoURL || DEFAULT_AVATAR_DATA_URI;
  const displayId =
    currentUser?.idCardNumber ||
    (firebaseUser
      ? `BS-${firebaseUser.uid.slice(0, 6).toUpperCase()}`
      : lang === 'bn'
      ? 'লগইন করলে যুক্ত হবে'
      : 'Sign in to generate');
  const rawDistrict = currentUser?.district || 'dhaka';
  const matchedProfileDist = DISTRICTS.find(
    (d) =>
      d.id === rawDistrict.toLowerCase() ||
      d.nameBn === rawDistrict ||
      d.nameEn.toLowerCase() === rawDistrict.toLowerCase()
  );
  const displayDistrict = matchedProfileDist
    ? lang === 'bn'
      ? matchedProfileDist.nameBn
      : matchedProfileDist.nameEn
    : rawDistrict;
  const displayArea =
    currentUser?.upazila &&
    currentUser.upazila !== 'sadar' &&
    currentUser.upazila !== 'সদর'
      ? currentUser.upazila
      : '';
  const displayFullAddress = displayArea
    ? `${displayArea}, ${displayDistrict}`
    : displayDistrict;
  const displayGender =
    currentUser?.gender === 'FEMALE'
      ? lang === 'bn'
        ? 'মহিলা'
        : 'Female'
      : currentUser?.gender === 'OTHER'
      ? lang === 'bn'
        ? 'অন্যান্য'
        : 'Other'
      : lang === 'bn'
      ? 'পুরুষ'
      : 'Male';
  const displayDonations = currentUser?.totalDonations ?? 0;
  const displayAge = currentUser?.age ?? 25;
  const displayRole =
    currentUser?.role === 'ADMIN' || isBootstrappedAdminUser(firebaseUser) ? 'ADMIN' : 'USER';

  const lastDate =
    (currentUser as any)?.lastDonationDate || (donationLogs[0] ? donationLogs[0].date : '');
  const lastType =
    (currentUser as any)?.lastDonationType || (donationLogs[0] ? donationLogs[0].type : 'WHOLE_BLOOD');
  const recovery = calculateRecoveryCountdown(lastDate, lastType, lang);

  const handleDownloadSmartIdPng = () => {
    downloadSmartDonorIdCardPng({
      donorName: displayName,
      bloodGroup: displayGroup,
      idCardNumber: displayId,
      phone: verifiedProfilePhone,
      district: displayDistrict,
      totalDonations: displayDonations,
      isAvailable,
    });
    showToast(
      lang === 'bn'
        ? '✓ স্মার্ট ডোনার আইডি কার্ড (.PNG) আপনার গ্যালারিতে ডাউনলোড হয়েছে!'
        : '✓ Smart Donor ID Card (.PNG) downloaded!'
    );
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-8 text-left">
      {/* Profile Card Header */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all text-center relative">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {isLoggedIn
              ? displayRole === 'ADMIN'
                ? lang === 'bn'
                  ? 'অ্যাডমিন প্রোফাইল'
                  : 'Admin Profile'
                : lang === 'bn'
                ? 'ভেরিফাইড ডোনার প্রোফাইল'
                : 'Verified Donor Profile'
              : lang === 'bn'
              ? 'গেস্ট মোড'
              : 'Guest Mode'}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPrivacyOpen(true)}
              className="min-h-[38px] flex items-center gap-1 px-2.5 py-1.5 rounded-xl btn-soft-emerald text-xs font-semibold cursor-pointer"
              title="Google Play Safety"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'bn' ? 'পলিসি' : 'Privacy'}</span>
            </button>
            <button
              onClick={() => setIsQrOpen(true)}
              className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-surface text-xs font-semibold cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-rose-500" />
              <span>QR Pass</span>
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="relative w-22 h-22 sm:w-24 sm:h-24 mx-auto my-3">
          <img
            src={displayAvatar}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_DATA_URI;
            }}
            referrerPolicy="no-referrer"
            alt={displayName}
            className="w-full h-full object-cover rounded-3xl ring-4 ring-rose-500/20 shadow-xl"
          />
          {isLoggedIn && (
            <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-slate-900 shadow">
              ✓
            </span>
          )}
        </div>

        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
          {displayName}
        </h2>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono truncate px-2">
          {displayEmail} · {displayPhone}
        </div>
        <div className="mt-1 inline-flex items-center justify-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>{displayFullAddress}</span>
        </div>
        <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5">
          {lang === 'bn' ? 'স্মার্ট কার্ড নং:' : 'Card ID:'} {displayId}
        </div>

        {/* WhatsApp & Facebook Links when registered */}
        {(verifiedWhatsappPhone || currentUser?.facebookUrl) && (
          <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap text-xs">
            {verifiedWhatsappPhone && (
              <a
                href={`https://wa.me/${verifiedWhatsappPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp: {verifiedWhatsappPhone}</span>
              </a>
            )}
          </div>
        )}

        {statusToast && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200">
            {statusToast}
          </div>
        )}

        {/* Primary Profile Actions including 1-Tap Inline Quick Edit */}
        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
          {!isLoggedIn && onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="min-h-[44px] px-4 py-2 rounded-xl btn-obsidian text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'bn' ? 'Google লগইন করুন' : 'Sign In Now'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={openInlineQuickEdit}
            className="min-h-[44px] px-4 py-2 rounded-xl btn-crimson text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Pencil className="w-3.5 h-3.5 shrink-0" />
            <span>
              {lang === 'bn'
                ? 'নাম ও ঠিকানা পরিবর্তন করুন'
                : 'Edit Name & Address'}
            </span>
          </button>

          {onOpenRegister && (
            <button
              type="button"
              onClick={() => onOpenRegister('USER')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl btn-surface text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>
                {lang === 'bn' ? 'ছবি ও পূর্ণ সেটআপ' : 'Photo & Full Setup'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadSmartIdPng}
            className="min-h-[44px] px-3.5 py-2 rounded-xl btn-obsidian text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{lang === 'bn' ? 'আইডি কার্ড (.PNG)' : 'Download ID (.PNG)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCertOpen(true)}
            className="min-h-[44px] px-3.5 py-2 rounded-xl btn-surface text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{lang === 'bn' ? 'সম্মাননা সনদপত্র' : 'Certificate'}</span>
          </button>

          {isLoggedIn && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await signOutReal();
                } catch {}
                setCurrentUser(null);
                setFirebaseUser(null);
                showToast(
                  lang === 'bn' ? 'আপনি সফলভাবে লগআউট হয়েছেন।' : 'Logged out successfully.'
                );
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-xl btn-soft-rose text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              title="বর্তমান অ্যাকাউন্ট থেকে লগআউট করুন"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
            </button>
          )}
        </div>

        {/* Inline 1-Click Quick Profile Editor (Name, Group, Phone, GPS + Custom Area) */}
        {isQuickEditOpen && (
          <form
            onSubmit={handleSaveQuickEdit}
            className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 text-left space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                {lang === 'bn'
                  ? 'নাম, মোবাইল নম্বর ও ঠিকানা পরিবর্তন করুন'
                  : 'Edit Name, Phone & Address'}
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickEditOpen(false)}
                className="min-h-[32px] min-w-[32px] rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {quickEditError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-200">
                {quickEditError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'আপনার নাম *' : 'Your Name *'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={lang === 'bn' ? 'আপনার নাম লিখুন' : 'Your full name'}
                  className="w-full h-11 px-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'মোবাইল নম্বর *' : 'Mobile Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full h-11 px-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-mono font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {ALL_BLOOD_GROUPS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setEditGroup(g)}
                    className={`min-h-[38px] rounded-xl font-black text-xs cursor-pointer ${
                      editGroup === g
                        ? 'bg-rose-600 text-white'
                        : 'bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'bn'
                    ? 'জেলা ও এলাকার ঠিকানা (GPS অথবা নিজে লিখুন)'
                    : 'District & Area Address (GPS or Type Freely)'}
                </label>
                <button
                  type="button"
                  onClick={handleQuickEditGps}
                  disabled={isLocatingQuickGps}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <LocateFixed className={`w-3 h-3 ${isLocatingQuickGps ? 'animate-spin' : ''}`} />
                  <span>
                    {isLocatingQuickGps
                      ? lang === 'bn'
                        ? 'GPS নেওয়া হচ্ছে...'
                        : 'Locating...'
                      : lang === 'bn'
                        ? 'আমার GPS নিন'
                        : 'Use My GPS'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <select
                  value={editDistrict}
                  onChange={(e) => setEditDistrict(e.target.value)}
                  className="sm:col-span-5 h-11 px-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {lang === 'bn' ? d.nameBn : d.nameEn}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  maxLength={50}
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: নিকেতন, রোড ৪ / Niketon / ধানমন্ডি...'
                      : 'e.g. Niketon, Road 4 / Gulshan-1...'
                  }
                  className="sm:col-span-7 h-11 px-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                />
              </div>

              {editDistrict === 'dhaka' && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    lang === 'bn' ? 'নিকেতন, গুলশান-১' : 'Niketon, Gulshan-1',
                    lang === 'bn' ? 'বনানী' : 'Banani',
                    lang === 'bn' ? 'ধানমন্ডি' : 'Dhanmondi',
                    lang === 'bn' ? 'মিরপুর' : 'Mirpur',
                    lang === 'bn' ? 'উত্তরা' : 'Uttara',
                    lang === 'bn' ? 'বনশ্রী' : 'Banasree',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setEditArea(chip)}
                      className="min-h-[30px] px-2 py-0.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-rose-400 cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsQuickEditOpen(false)}
                className="min-h-[42px] px-3.5 py-2 rounded-xl btn-surface text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSavingQuickEdit}
                className="min-h-[42px] px-4 py-2 rounded-xl btn-crimson text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {isSavingQuickEdit
                    ? lang === 'bn'
                      ? 'সেভ হচ্ছে...'
                      : 'Saving...'
                    : lang === 'bn'
                      ? 'পরিবর্তন সেভ করুন'
                      : 'Save Changes'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* Metric Tiles dynamically bound to real profile (Never shows "0 bags") */}
        <div
          className={`grid ${
            displayDonations > 0 ? 'grid-cols-4' : 'grid-cols-3'
          } gap-2 mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60`}
        >
          <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">
              {lang === 'bn' ? 'রক্তের গ্রুপ' : 'Group'}
            </span>
            <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">
              {displayGroup}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">
              {lang === 'bn' ? 'লিঙ্গ' : 'Gender'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              {displayGender}
            </span>
          </div>

          {displayDonations > 0 && (
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60 flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold">
                {lang === 'bn' ? 'রক্তদান' : 'Donated'}
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {displayDonations} {lang === 'bn' ? 'বার' : 'times'}
              </span>
            </div>
          )}

          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold">
              {lang === 'bn' ? 'বয়স' : 'Age'}
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
              {displayAge}
              {lang === 'bn' ? ' বছর' : 'y'}
            </span>
          </div>
        </div>

        {/* 3-State Availability, DND & Last Confirmation Control */}
        <div className="mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-800 text-left space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {lang === 'bn' ? 'রক্তদান প্রস্তুতি স্ট্যাটাস' : 'Donation Availability'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {confirmedAtMs
                  ? lang === 'bn'
                    ? `সর্বশেষ নিশ্চিতকরণ: ${new Date(confirmedAtMs).toLocaleString('bn-BD')}`
                    : `Last confirmed: ${new Date(confirmedAtMs).toLocaleString()}`
                  : lang === 'bn'
                  ? 'এখনো আজকের প্রস্তুতি নিশ্চিত করা হয়নি'
                  : 'Availability not confirmed recently'}
              </span>
            </div>

            <button
              type="button"
              disabled={isSavingConsent}
              onClick={() =>
                applyConsentAndAvailabilityUpdate({
                  availabilityStatus: 'AVAILABLE',
                  confirmNow: true,
                })
              }
              className="min-h-[40px] px-3 py-1.5 rounded-xl btn-emerald text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-60"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'এখন প্রস্তুত নিশ্চিত করুন' : 'Confirm Available Now'}</span>
            </button>
          </div>

          {/* 3-State Segmented Control */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950">
            {(
              [
                {
                  id: 'AVAILABLE' as const,
                  bn: 'রক্তদানে প্রস্তুত',
                  en: 'Available',
                },
                {
                  id: 'TEMPORARILY_UNAVAILABLE' as const,
                  bn: 'সাময়িক অনুপস্থিত',
                  en: 'Temporarily Away',
                },
                {
                  id: 'DND' as const,
                  bn: 'বিরতি মোড',
                  en: 'Do Not Disturb',
                },
              ] as const
            ).map((opt) => {
              const active = availabilityStatus === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    applyConsentAndAvailabilityUpdate({
                      availabilityStatus: opt.id,
                      confirmNow: opt.id === 'AVAILABLE',
                    })
                  }
                  className={`min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap truncate ${
                    active
                      ? opt.id === 'AVAILABLE'
                        ? 'btn-emerald'
                        : opt.id === 'DND'
                        ? 'btn-crimson'
                        : 'btn-obsidian'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang === 'bn' ? opt.bn : opt.en}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contact Consent, Privacy Visibility & Emergency Alert Controls */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-4">
        <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {lang === 'bn'
                  ? 'যোগাযোগের গোপনীয়তা ও জরুরি অ্যালার্ট নিয়ন্ত্রণ'
                  : 'Contact Privacy & Emergency Alert Preferences'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
              {lang === 'bn'
                ? 'আপনার সম্মতি ছাড়া গোপন নম্বর কখনোই প্রকাশ করা হয় না। যেকোনো সময় সরাসরি কল বা অ্যালার্ট বিরত রাখতে পারবেন।'
                : 'Your phone number is never shared without consent. Pause alerts or change who can contact you anytime.'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              {lang === 'bn' ? 'কে আপনাকে সরাসরি কল বা WhatsApp করতে পারবেন?' : 'Who can view & contact you directly?'}
            </label>
            <select
              value={contactVisibility}
              onChange={(e) =>
                applyConsentAndAvailabilityUpdate({
                  contactVisibility: e.target.value as ContactVisibility,
                })
              }
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="PUBLIC_OPT_IN">
                {lang === 'bn'
                  ? 'সকল জরুরি রক্তপ্রার্থী — সরাসরি Call ও WhatsApp (দ্রুততম)'
                  : 'All Emergency Seekers — Direct Call & WhatsApp (Fastest)'}
              </option>
              <option value="VERIFIED_SEEKERS">
                {lang === 'bn'
                  ? 'শুধু ভেরিফাইড লগইনকৃত রক্তপ্রার্থী'
                  : 'Verified Signed-In Blood Seekers Only'}
              </option>
              <option value="REQUEST_ONLY">
                {lang === 'bn'
                  ? 'নম্বর গোপন — ইন-অ্যাপ চ্যাট বা অনুমতি সাপেক্ষে'
                  : 'Private — In-App Chat or Consent Request Only'}
              </option>
            </select>
          </div>

          {contactVisibility !== 'REQUEST_ONLY' && availabilityStatus !== 'DND' && (
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <label className="inline-flex items-center gap-2 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  checked={allowCall}
                  onChange={(e) =>
                    applyConsentAndAvailabilityUpdate({ allowCall: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span>{lang === 'bn' ? 'ফোন কল অনুমোদিত' : 'Allow Phone Call'}</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  checked={allowWhatsApp}
                  onChange={(e) =>
                    applyConsentAndAvailabilityUpdate({ allowWhatsApp: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span>{lang === 'bn' ? 'WhatsApp অনুমোদিত' : 'Allow WhatsApp'}</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  checked={allowSms}
                  onChange={(e) =>
                    applyConsentAndAvailabilityUpdate({ allowSms: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span>{lang === 'bn' ? 'SMS অনুমোদিত' : 'Allow SMS'}</span>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() =>
                applyConsentAndAvailabilityUpdate({
                  emergencyAlertsOptIn: !emergencyAlertsOptIn,
                })
              }
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <span>
                {lang === 'bn' ? 'জরুরি রক্তের নোটিফিকেশন' : 'Emergency Blood Alerts'}
              </span>
              <span
                className={`font-bold ${
                  emergencyAlertsOptIn ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                {emergencyAlertsOptIn
                  ? lang === 'bn'
                    ? 'চালু'
                    : 'On'
                  : lang === 'bn'
                  ? 'বন্ধ'
                  : 'Off'}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                applyConsentAndAvailabilityUpdate({
                  alertsPaused: !alertsPaused,
                })
              }
              className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <BellOff className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === 'bn' ? 'নোটিফিকেশন সাময়িক বিরতি' : 'Pause Notifications'}</span>
              </span>
              <span
                className={`font-bold ${
                  alertsPaused ? 'text-amber-600' : 'text-slate-400'
                }`}
              >
                {alertsPaused
                  ? lang === 'bn'
                    ? 'বিরত'
                    : 'Paused'
                  : lang === 'bn'
                  ? 'সচল'
                  : 'Active'}
              </span>
            </button>
          </div>
        </div>

        {/* Incoming Consent Contact Requests Inbox */}
        {incomingContactRequests.length > 0 && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              {lang === 'bn'
                ? `নম্বর দেখার অনুমতি অনুরোধ (${incomingContactRequests.length})`
                : `Consent Contact Requests (${incomingContactRequests.length})`}
            </h4>
            <div className="space-y-2">
              {incomingContactRequests.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {item.seekerName} · {item.bloodGroupNeeded} ({item.urgency})
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {item.hospitalName} · Callback: {item.seekerPhone}
                    </div>
                  </div>
                  {item.status === 'PENDING' ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRespondContactReq(item.id, true)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'নম্বর শেয়ার করুন' : 'Approve & Share'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespondContactReq(item.id, false)}
                        className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer whitespace-nowrap"
                      >
                        {lang === 'bn' ? 'বাতিল' : 'Decline'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0">
                      {item.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Donation Recovery & History Log Card */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              {lang === 'bn' ? 'রক্তদান ডায়েরি ও রিকভারি রেকর্ড' : 'Donation Log & Recovery History'}
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {lang === 'bn'
                ? `সর্বশেষ রক্তদান: ${recovery.lastDonatedLabel} · স্ট্যাটাস: ${recovery.nextEligibleDateLabel}`
                : `Last donation: ${recovery.lastDonatedLabel} · Status: ${recovery.nextEligibleDateLabel}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowLogForm(!showLogForm)}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? '+ রক্তদান লগ করুন' : '+ Log Donation'}</span>
          </button>
        </div>

        {showLogForm && (
          <form
            onSubmit={handleSaveDonationLog}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'bn' ? 'রক্তদানের তারিখ' : 'Donation Date'}
                </label>
                <input
                  type="date"
                  value={logDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {lang === 'bn' ? 'রক্তদানের ধরন' : 'Donation Type'}
                </label>
                <select
                  value={logType}
                  onChange={(e) => setLogType(e.target.value as 'WHOLE_BLOOD' | 'PLATELET')}
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="WHOLE_BLOOD">
                    {lang === 'bn' ? 'পূর্ণ রক্ত / Whole Blood (৯০ দিন বিরতি)' : 'Whole Blood (90d recovery)'}
                  </option>
                  <option value="PLATELET">
                    {lang === 'bn' ? 'প্লাটিলেট / Platelet Apheresis (১৪ দিন বিরতি)' : 'Platelet Apheresis (14d recovery)'}
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'bn' ? 'হাসপাতাল বা ব্লাড ব্যাংকের নাম' : 'Hospital or Blood Center'}
              </label>
              <input
                type="text"
                value={logHospital}
                onChange={(e) => setLogHospital(e.target.value)}
                placeholder={
                  lang === 'bn'
                    ? 'যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল / রেড ক্রিসেন্ট'
                    : 'e.g. Dhaka Medical College Hospital'
                }
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isLoggingDonation}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                {isLoggingDonation
                  ? lang === 'bn'
                    ? 'সংরক্ষণ হচ্ছে...'
                    : 'Saving...'
                  : lang === 'bn'
                  ? '✓ রেকর্ড সংরক্ষণ করুন'
                  : '✓ Save Record'}
              </button>
            </div>
          </form>
        )}

        {donationLogs.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bn'
              ? 'এখনো কোনো রক্তদানের তারিখ ডায়েরিতে যুক্ত করা হয়নি। রক্তদান সম্পন্ন করলে উপরের বাটনে ক্লিক করে সংরক্ষণ করুন।'
              : 'No completed donations logged yet. Tap "+ Log Donation" above to start tracking your 90-day recovery.'}
          </p>
        ) : (
          <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
            {donationLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Droplet className="w-4 h-4 text-rose-600 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {log.hospital}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {log.type === 'PLATELET'
                        ? lang === 'bn'
                          ? 'প্লাটিলেট অ্যাফেরেসিস (১৪ দিন বিরতি)'
                          : 'Platelet Apheresis'
                        : lang === 'bn'
                        ? 'পূর্ণ রক্তদান (৯০ দিন বিরতি)'
                        : 'Whole Blood'}
                    </div>
                  </div>
                </div>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  {log.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health Condition Verified Checklist */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              {lang === 'bn' ? 'স্বাস্থ্যগত মানদণ্ড' : 'Health Conditions'}
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              {lang === 'bn'
                ? 'চিকিৎসাগত নির্দেশিকা অনুযায়ী নিরাপত্তা যাচাই'
                : 'Clinical safety verification parameters'}
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            {lang === 'bn' ? 'সুস্থ ও উপযুক্ত' : 'Healthy'}
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {[
            { id: 'nonAlcoholic' as const, label: lang === 'bn' ? 'ধূমপান ও মাদকমুক্ত' : 'Non-alcoholic' },
            { id: 'hivNegative' as const, label: lang === 'bn' ? 'এইচআইভি নেগেটিভ' : 'HIV negative' },
            { id: 'rheumaticFeverNegative' as const, label: lang === 'bn' ? 'বাতজ্বর মুক্ত' : 'No rheumatic fever' },
            { id: 'covidNegative' as const, label: lang === 'bn' ? 'সংক্রামক জ্বরমুক্ত' : 'No active infection' },
            { id: 'thalassemiaNegative' as const, label: lang === 'bn' ? 'থ্যালাসেমিয়ামুক্ত' : 'No thalassemia' },
            { id: 'hepatitisNegative' as const, label: lang === 'bn' ? 'হেপাটাইটিস ও জন্ডিসমুক্ত' : 'Hepatitis negative' },
            { id: 'normalBloodPressure' as const, label: lang === 'bn' ? 'স্বাভাবিক রক্তচাপ' : 'Normal blood pressure' },
          ].map((item) => {
            const isChecked = healthConditions[item.id];
            return (
              <div
                key={item.id}
                onClick={() => toggleCondition(item.id)}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 transition-all"
              >
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {item.label}
                </span>
                <div
                  className={`w-9 h-5 rounded-full transition-colors relative ${
                    isChecked ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform shadow ${
                      isChecked ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live OTA App Update & Backward-Compatible APK Manager Card */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm space-y-3 text-left">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              App Update & Live OTA Sync
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Installed APKs receive web updates automatically without reinstalling. Older APK versions keep working smoothly when you tap &ldquo;Maybe Later&rdquo;.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
            OTA Ready
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event('bloodsearch_manual_update_check'));
            }}
            className="min-h-[42px] px-4 py-2 rounded-xl btn-crimson text-xs font-bold cursor-pointer"
          >
            Check for App Update
          </button>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event('bloodsearch_preview_update_modal'));
            }}
            className="min-h-[42px] px-4 py-2 rounded-xl btn-surface text-xs font-bold cursor-pointer"
          >
            Preview Update Screen
          </button>
        </div>
      </div>

      {/* QR Profile Modal bound to real user */}
      {isQrOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
          <div className="w-full max-w-sm my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#1e293b] p-5 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 text-center space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Hospital Check-In QR Pass
              </h3>
              <button
                onClick={() => setIsQrOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-white rounded-2xl shadow-inner border border-slate-200 inline-block">
              <div className="w-48 h-48 bg-slate-950 rounded-xl p-3 flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-12 h-12 bg-white rounded p-1 flex items-center justify-center">
                    <div className="w-6 h-6 bg-slate-950" />
                  </div>
                  <div className="w-12 h-12 bg-white rounded p-1 flex items-center justify-center">
                    <div className="w-6 h-6 bg-slate-950" />
                  </div>
                </div>
                <div className="text-center font-mono text-[9px] text-white break-all px-1">
                  {displayId}
                </div>
                <div className="flex justify-between">
                  <div className="w-12 h-12 bg-white rounded p-1 flex items-center justify-center">
                    <div className="w-6 h-6 bg-slate-950" />
                  </div>
                  <div className="w-8 h-8 bg-rose-500 rounded flex items-center justify-center text-white font-black text-xs">
                    {displayGroup}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {displayName} · Blood Group {displayGroup}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Scan at hospital reception or blood transfusion unit for instant verification.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadSmartIdPng}
              className="w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{lang === 'bn' ? 'স্মার্ট আইডি কার্ড (.PNG) ডাউনলোড' : 'Download Smart ID (.PNG)'}</span>
            </button>
          </div>
        </div>
      )}

      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        lang={lang}
      />

      <DonorCertificateModal
        isOpen={isCertOpen}
        onClose={() => setIsCertOpen(false)}
        lang={lang}
        donorName={displayName}
        bloodGroup={displayGroup}
        idCardNumber={displayId}
        totalDonations={Math.max(1, displayDonations)}
      />
    </div>
  );
};
