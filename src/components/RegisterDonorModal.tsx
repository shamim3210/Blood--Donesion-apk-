import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Donor,
  BloodGroup,
  Language,
  UserAccount,
  ContactVisibility,
  DonorAvailabilityStatus,
} from '../types';
import { BrandLogo } from './BrandLogo';
import { ALL_BLOOD_GROUPS } from '../data/compatibility';
import { DISTRICTS } from '../data/bangladeshGeo';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogleReal,
  computeAdminProofHashSync,
  verifyAdminInviteCodeInCloud,
  isBootstrappedAdminUser,
  registerSmartAccountInFirestore,
  isUserVerifiedForWrites,
  parseFirebaseAuthError,
  compressAvatarIfNeeded,
  DEFAULT_AVATAR_DATA_URI,
  User,
} from '../firebase';
import {
  isValidBangladeshMobilePhone,
  normalizeValidBangladeshMobileE164,
} from '../utils/donorMatcher';
import {
  requestFreshHighAccuracyGPS,
  reverseGeocodeBangladeshCoords,
  getInstantLocalPlaceSuggestions,
} from '../utils/geolocation';
import {
  X,
  Check,
  Camera,
  CheckCircle2,
  Phone,
  MapPin,
  AlertCircle,
  LocateFixed,
  KeyRound,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RegisterDonorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  initialRole?: 'USER' | 'ADMIN';
  onRegisterDonor: (newDonor: Donor, newAccount?: UserAccount) => void;
  onLogAudit: (action: any, details: string) => void;
  onNavigateTab?: (tab: any) => void;
}

const DHAKA_POPULAR_AREAS = [
  { bn: 'নিকেতন, গুলশান-১', en: 'Niketon, Gulshan-1' },
  { bn: 'গুলশান-২', en: 'Gulshan-2' },
  { bn: 'বনানী', en: 'Banani' },
  { bn: 'ধানমন্ডি', en: 'Dhanmondi' },
  { bn: 'মিরপুর', en: 'Mirpur' },
  { bn: 'উত্তরা', en: 'Uttara' },
  { bn: 'বনশ্রী', en: 'Banasree' },
  { bn: 'বসুন্ধরা', en: 'Bashundhara' },
  { bn: 'মোহাম্মদপুর', en: 'Mohammadpur' },
  { bn: 'মহাখালী', en: 'Mohakhali' },
];

const QUICK_DISTRICTS = [
  { id: 'dhaka', bn: 'ঢাকা', en: 'Dhaka' },
  { id: 'chattogram', bn: 'চট্টগ্রাম', en: 'Chattogram' },
  { id: 'sylhet', bn: 'সিলেট', en: 'Sylhet' },
  { id: 'rajshahi', bn: 'রাজশাহী', en: 'Rajshahi' },
  { id: 'khulna', bn: 'খুলনা', en: 'Khulna' },
  { id: 'barishal', bn: 'বরিশাল', en: 'Barishal' },
  { id: 'rangpur', bn: 'রংপুর', en: 'Rangpur' },
  { id: 'mymensingh', bn: 'ময়মনসিংহ', en: 'Mymensingh' },
];

export const RegisterDonorModal: React.FC<RegisterDonorModalProps> = ({
  isOpen,
  onClose,
  lang,
  initialRole = 'USER',
  onRegisterDonor,
  onLogAudit,
  onNavigateTab,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsStatusNote, setGpsStatusNote] = useState<string | null>(null);

  // Simple 1-screen core fields
  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('dhaka');
  const [areaAddress, setAreaAddress] = useState('');
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);
  const [available, setAvailable] = useState(true);
  const [shareDirectContact, setShareDirectContact] = useState(true);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [photoUrl, setPhotoUrl] = useState<string>(DEFAULT_AVATAR_DATA_URI);

  // Optional Admin Invite Mode (hidden by default unless initialRole === 'ADMIN')
  const [showAdminInviteBox, setShowAdminInviteBox] = useState(initialRole === 'ADMIN');
  const [accountRole, setAccountRole] = useState<'USER' | 'ADMIN'>(initialRole);
  const [adminSecretCode, setAdminSecretCode] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [savedAccount, setSavedAccount] = useState<UserAccount | null>(null);

  useEffect(() => {
    setAccountRole(initialRole);
    setShowAdminInviteBox(initialRole === 'ADMIN');
    if (isOpen) {
      setSavedAccount(null);
      setFormError(null);
      setGpsStatusNote(null);
      try {
        const raw = localStorage.getItem('bloodsearch_current_user');
        if (raw) {
          const saved = JSON.parse(raw) as Partial<UserAccount>;
          if (saved.name) setName(saved.name);
          if (saved.bloodGroup) setBloodGroup(saved.bloodGroup);
          if (saved.phone && saved.phone !== '01700000000') setPhone(saved.phone);
          if (saved.district) {
            const matched = DISTRICTS.find(
              (d) =>
                d.id === String(saved.district).toLowerCase() ||
                d.nameBn === saved.district ||
                d.nameEn.toLowerCase() === String(saved.district).toLowerCase()
            );
            if (matched) setDistrict(matched.id);
          }
          if (saved.upazila && saved.upazila !== 'sadar' && saved.upazila !== 'সদর') {
            setAreaAddress(saved.upazila);
          }
          if (typeof saved.availableToDonate === 'boolean') {
            setAvailable(saved.availableToDonate);
          }
          if (typeof saved.shareDirectContact === 'boolean') {
            setShareDirectContact(saved.shareDirectContact);
          } else if (saved.contactVisibility) {
            setShareDirectContact(saved.contactVisibility !== 'REQUEST_ONLY');
          }
          if (saved.gender) setGender(saved.gender);
          if (saved.photoUrl) setPhotoUrl(saved.photoUrl);
        }
      } catch {}
    }
  }, [initialRole, isOpen]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (u) {
        setName((prev) => prev || u.displayName || '');
        if (u.phoneNumber) {
          setPhone((prev) => prev || u.phoneNumber || '');
        }
        if (u.photoURL) {
          setPhotoUrl((prev) => (prev === DEFAULT_AVATAR_DATA_URI ? u.photoURL! : prev));
        }
      }
    });
    return () => unsub();
  }, []);

  const selectedDistrictObj = useMemo(
    () => DISTRICTS.find((d) => d.id === district) || DISTRICTS[0],
    [district]
  );

  // Quick selectable chips: Dhaka gets Niketon + popular neighborhoods; other districts get their real Upazilas
  const quickAreaChips = useMemo(() => {
    if (district === 'dhaka') {
      return DHAKA_POPULAR_AREAS.map((a) => (lang === 'bn' ? a.bn : a.en));
    }
    return (selectedDistrictObj?.upazilas || []).map((u) =>
      lang === 'bn' ? u.nameBn : u.nameEn
    );
  }, [district, selectedDistrictObj, lang]);

  // Instant autocomplete while typing custom neighborhood
  const typedAreaSuggestions = useMemo(() => {
    const q = areaAddress.trim();
    if (q.length < 2) return [];
    return getInstantLocalPlaceSuggestions(q, lang).slice(0, 5);
  }, [areaAddress, lang]);

  if (!isOpen) return null;

  const handleUseMyGps = async () => {
    setIsLocatingGps(true);
    setFormError(null);
    setGpsStatusNote(null);
    try {
      const res = await requestFreshHighAccuracyGPS();
      if (res.isRealGps) {
        const rev = await reverseGeocodeBangladeshCoords(res.coords, lang);
        setDistrict(rev.districtId);
        setAreaAddress(rev.areaText);
        setGpsStatusNote(
          lang === 'bn'
            ? `GPS থেকে পাওয়া ঠিকানা: ${rev.areaText}, ${rev.districtName} (চাইলে নিচে লিখে পরিবর্তন করতে পারবেন)`
            : `GPS detected: ${rev.areaText}, ${rev.districtName} (you can edit it below)`
        );
      } else {
        setFormError(
          lang === 'bn'
            ? 'ব্রাউজারে GPS অনুমতি বন্ধ আছে। কোনো সমস্যা নেই — নিচে আপনার এলাকার নাম (যেমন: নিকেতন) সরাসরি লিখে দিন।'
            : 'Browser GPS permission is off. Simply type your area name (e.g. Niketon) in the box below.'
        );
      }
    } finally {
      setIsLocatingGps(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        const compressed = await compressAvatarIfNeeded(reader.result);
        setPhotoUrl(compressed);
      }
      setIsCompressingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleConnectGoogle = () => {
    const popupPromise = signInWithGoogleReal();
    setFormError(null);
    popupPromise
      .then((u) => {
        setFirebaseUser(u);
        if (u.displayName && !name.trim()) setName(u.displayName);
        if (u.photoURL && photoUrl === DEFAULT_AVATAR_DATA_URI) setPhotoUrl(u.photoURL);
      })
      .catch((err: any) => {
        const parsed = parseFirebaseAuthError(err);
        setFormError(lang === 'bn' ? parsed.messageBn : parsed.messageEn);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    if (cleanName.length < 2) {
      setFormError(
        lang === 'bn'
          ? 'অনুগ্রহ করে আপনার নাম লিখুন।'
          : 'Please enter your name.'
      );
      return;
    }

    const cleanPhone = normalizeValidBangladeshMobileE164(phone);
    if (!cleanPhone || !isValidBangladeshMobilePhone(phone)) {
      setFormError(
        lang === 'bn'
          ? 'সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন (যেমন: 01712345678)।'
          : 'Please enter a valid 11-digit Bangladesh mobile number (e.g. 01712345678).'
      );
      return;
    }

    if (accountRole === 'ADMIN' && !isBootstrappedAdminUser(auth.currentUser)) {
      const check = computeAdminProofHashSync(adminSecretCode);
      if (!check.wellFormed) {
        setFormError(
          lang === 'bn'
            ? 'সঠিক অ্যাডমিন ইনভাইট কোড দিন অথবা সাধারণ ডোনার হিসেবে সেভ করুন।'
            : 'Enter a valid Admin Invite Code or switch back to Regular Donor.'
        );
        return;
      }
    }

    // Start Google popup synchronously BEFORE any await if user is not signed in yet
    let pendingAuthPromise: Promise<User> | null = null;
    if (!auth.currentUser || !isUserVerifiedForWrites(auth.currentUser)) {
      pendingAuthPromise = signInWithGoogleReal();
    }

    setIsSubmitting(true);
    try {
      let activeUser = auth.currentUser;
      if (pendingAuthPromise) {
        try {
          activeUser = await pendingAuthPromise;
          setFirebaseUser(activeUser);
        } catch (authErr: any) {
          const parsed = parseFirebaseAuthError(authErr);
          setFormError(lang === 'bn' ? parsed.messageBn : parsed.messageEn);
          setIsSubmitting(false);
          return;
        }
      }

      if (!activeUser) {
        setIsSubmitting(false);
        return;
      }

      let verifiedProofHash = '';
      if (accountRole === 'ADMIN') {
        const cloudCheck = await verifyAdminInviteCodeInCloud(adminSecretCode, activeUser);
        if (!cloudCheck.valid || !cloudCheck.proofHash) {
          setFormError(
            lang === 'bn'
              ? 'অ্যাডমিন কোডটি সঠিক নয়। সাধারণ ডোনার হিসেবে প্রোফাইল সেভ করতে অ্যাডমিন অপশন বন্ধ করুন।'
              : 'Invalid Admin Code. Turn off Admin mode to save your regular donor profile.'
          );
          setIsSubmitting(false);
          return;
        }
        verifiedProofHash = cloudCheck.proofHash;
      }

      let existingSaved: Partial<UserAccount> | null = null;
      try {
        const raw = localStorage.getItem('bloodsearch_current_user');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (!parsed.id || parsed.id === activeUser.uid)) {
            existingSaved = parsed;
          }
        }
      } catch {}

      const isSuperOwner = isBootstrappedAdminUser(activeUser);
      const effectiveRole: 'USER' | 'ADMIN' =
        accountRole === 'ADMIN' || existingSaved?.role === 'ADMIN' || isSuperOwner
          ? 'ADMIN'
          : 'USER';

      const uidShort =
        activeUser.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || '1001';
      const defaultCardId =
        effectiveRole === 'ADMIN' ? `ADMIN-BD-${uidShort}` : `BS-${uidShort}`;
      const cleanExistingCardId =
        existingSaved?.idCardNumber &&
        /^[a-zA-Z0-9+-]{5,40}$/.test(existingSaved.idCardNumber)
          ? existingSaved.idCardNumber
          : defaultCardId;

      const resolvedDivision = selectedDistrictObj?.divisionId || 'dhaka';
      const resolvedArea = (
        areaAddress.trim() ||
        (lang === 'bn' ? selectedDistrictObj.nameBn : selectedDistrictObj.nameEn) ||
        'Dhaka'
      ).slice(0, 50);

      const resolvedStatus: DonorAvailabilityStatus = available
        ? 'AVAILABLE'
        : 'TEMPORARILY_UNAVAILABLE';
      const resolvedVisibility: ContactVisibility = shareDirectContact
        ? 'PUBLIC_OPT_IN'
        : 'REQUEST_ONLY';
      const nowMs = Date.now();

      const accountRecord: UserAccount = {
        id: activeUser.uid,
        name: cleanName,
        email:
          activeUser.email ||
          existingSaved?.email ||
          `${activeUser.uid.slice(0, 8)}@bloodsearch.bd`,
        phone: cleanPhone,
        whatsappPhone: cleanPhone,
        facebookUrl: existingSaved?.facebookUrl || 'https://facebook.com/bloodsearch.bd',
        bloodGroup,
        division: resolvedDivision,
        district,
        upazila: resolvedArea,
        photoUrl: photoUrl || DEFAULT_AVATAR_DATA_URI,
        role: effectiveRole,
        verifiedStatus: true,
        idCardNumber: cleanExistingCardId,
        age: existingSaved?.age || 25,
        gender,
        weightKg: existingSaved?.weightKg || 62,
        availableToDonate: available,
        availabilityStatus: resolvedStatus,
        availabilityConfirmedAtMs: nowMs,
        shareDirectContact,
        contactVisibility: resolvedVisibility,
        allowCall: true,
        allowWhatsApp: true,
        allowSms: true,
        emergencyAlertsOptIn: existingSaved?.emergencyAlertsOptIn !== false,
        alertsPaused: existingSaved?.alertsPaused === true,
        lastDonationDate: existingSaved?.lastDonationDate || '',
        totalDonations: existingSaved?.totalDonations || 0,
        createdAt: existingSaved?.createdAt || new Date().toISOString(),
      };

      const donorRecord: Donor = {
        id: activeUser.uid,
        name: cleanName,
        bloodGroup,
        division: resolvedDivision,
        district,
        upazila: resolvedArea,
        phone: cleanPhone,
        whatsappPhone: cleanPhone,
        available,
        availabilityStatus: resolvedStatus,
        availabilityConfirmedAtMs: nowMs,
        shareDirectContact,
        contactVisibility: resolvedVisibility,
        allowCall: true,
        allowWhatsApp: true,
        allowSms: true,
        emergencyAlertsOptIn: accountRecord.emergencyAlertsOptIn,
        alertsPaused: accountRecord.alertsPaused,
        isCloudRecord: true,
        lastDonatedDate: accountRecord.lastDonationDate || '',
        totalDonations: accountRecord.totalDonations || 0,
        verifiedBadge: effectiveRole === 'ADMIN',
        rating: 5.0,
        reviewsCount: 0,
        age: accountRecord.age || 25,
        gender,
        weightKg: accountRecord.weightKg || 62,
        hospitalAffiliation:
          effectiveRole === 'ADMIN'
            ? 'অ্যাডমিন ও রক্ত সমন্বয়ক'
            : 'স্বেচ্ছাসেবী রক্তদাতা',
        avatar: accountRecord.photoUrl,
      };

      await registerSmartAccountInFirestore({
        firebaseUser: activeUser,
        account: accountRecord,
        donor: donorRecord,
        adminProofHash: verifiedProofHash || undefined,
      });

      localStorage.setItem('bloodsearch_current_user', JSON.stringify(accountRecord));
      window.dispatchEvent(new Event('bloodsearch_user_changed'));

      onRegisterDonor(donorRecord, accountRecord);
      onLogAudit(
        'REGISTER_DONOR',
        `Saved profile for ${cleanName} (${bloodGroup}, ${resolvedArea}, ${district})`
      );
      setSavedAccount(accountRecord);
    } catch (err: any) {
      console.error('Profile save error:', err);
      setFormError(
        lang === 'bn'
          ? 'প্রোফাইল সেভ করতে সমস্যা হয়েছে। ইন্টারনেট সংযোগ চেক করে আবার "প্রোফাইল সেভ করুন" চাপুন।'
          : 'Could not save profile right now. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain"
      onClick={() => showAreaSuggestions && setShowAreaSuggestions(false)}
    >
      <div className="w-full max-w-lg my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#111827] text-slate-900 dark:text-white p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-left">
        {/* Clean Header */}
        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <BrandLogo size="sm" />
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                {lang === 'bn'
                  ? 'ডোনার প্রোফাইল ও ঠিকানা সেটআপ'
                  : 'Donor Profile & Address Setup'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {lang === 'bn'
                  ? 'সহজ ১-ধাপে নাম, গ্রুপ ও আপনার এলাকার ঠিকানা সেভ করুন'
                  : 'Save your name, blood group & exact neighborhood in one simple step'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedAccount ? (
          /* Clean Success Confirmation Screen */
          <div className="pt-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {lang === 'bn'
                  ? 'আপনার প্রোফাইল সফলভাবে সেভ হয়েছে!'
                  : 'Your Profile Has Been Saved!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn'
                  ? 'আপনার নতুন নাম, রক্তের গ্রুপ এবং ঠিকানা সাথে সাথে আপডেট হয়ে গেছে।'
                  : 'Your updated name, blood group, and address are now live.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 text-left">
              <img
                src={savedAccount.photoUrl || DEFAULT_AVATAR_DATA_URI}
                alt={savedAccount.name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_DATA_URI;
                }}
                className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                    {savedAccount.name}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white font-black text-xs shrink-0">
                    {savedAccount.bloodGroup}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">
                    {savedAccount.upazila},{' '}
                    {lang === 'bn'
                      ? selectedDistrictObj.nameBn
                      : selectedDistrictObj.nameEn}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                  {savedAccount.phone}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateTab?.('profile');
                }}
                className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl btn-crimson font-bold text-xs sm:text-sm cursor-pointer whitespace-nowrap"
              >
                {lang === 'bn' ? 'প্রোফাইল দেখুন' : 'View Profile'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[46px] px-4 py-2.5 rounded-xl btn-surface font-bold text-xs sm:text-sm cursor-pointer whitespace-nowrap"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Done'}
              </button>
            </div>
          </div>
        ) : (
          /* Single Easy 1-Screen Form */
          <form onSubmit={handleSubmit} className="pt-4 space-y-4">
            {/* Google Sign-In Status Bar (Only prominent if not signed in yet) */}
            {!firebaseUser ? (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
                <div className="text-xs text-slate-700 dark:text-slate-300">
                  {lang === 'bn'
                    ? 'প্রোফাইল স্থায়ীভাবে সেভ করতে Google দিয়ে যুক্ত হোন:'
                    : 'Connect Google once to save your profile across devices:'}
                </div>
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl btn-obsidian text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                >
                  {lang === 'bn' ? 'Google লগইন' : 'Google Sign-In'}
                </button>
              </div>
            ) : null}

            {formError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 flex items-start gap-2.5 text-xs font-semibold text-rose-800 dark:text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* 1. Photo + Name Row */}
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={photoUrl || DEFAULT_AVATAR_DATA_URI}
                  alt={name || 'Avatar'}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_AVATAR_DATA_URI;
                  }}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-300 dark:border-slate-700"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressingPhoto}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow cursor-pointer"
                  title={lang === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change Photo'}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {lang === 'bn' ? '১. আপনার নাম *' : '1. Your Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={lang === 'bn' ? 'আপনার নাম লিখুন (যেমন: শামীম রাকিব)' : 'Enter your name'}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* 2. Blood Group 8-Button Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                {lang === 'bn' ? '২. রক্তের গ্রুপ নির্বাচন করুন *' : '2. Select Blood Group *'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ALL_BLOOD_GROUPS.map((grp) => {
                  const selected = bloodGroup === grp;
                  return (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setBloodGroup(grp)}
                      className={`min-h-[44px] rounded-xl font-black text-sm transition-colors cursor-pointer flex items-center justify-center ${
                        selected
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:border-rose-400'
                      }`}
                    >
                      {grp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Mobile Number + Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-8">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {lang === 'bn'
                    ? '৩. সচল মোবাইল নম্বর (Call ও WhatsApp) *'
                    : '3. Active Mobile Number (Call & WhatsApp) *'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700 text-sm font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  {lang === 'bn' ? 'লিঙ্গ' : 'Gender'}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="MALE">{lang === 'bn' ? 'পুরুষ (Male)' : 'Male'}</option>
                  <option value="FEMALE">{lang === 'bn' ? 'মহিলা (Female)' : 'Female'}</option>
                  <option value="OTHER">{lang === 'bn' ? 'অন্যান্য' : 'Other'}</option>
                </select>
              </div>
            </div>

            {/* 4. Hybrid Address: GPS + Select District + Custom Area Text Input + Chips */}
            <div
              className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  {lang === 'bn'
                    ? '৪. আপনার বর্তমান ঠিকানা (সিলেক্ট করুন বা নিজে লিখুন) *'
                    : '4. Your Current Address (Select, GPS, or Type) *'}
                </label>

                <button
                  type="button"
                  onClick={handleUseMyGps}
                  disabled={isLocatingGps}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <LocateFixed className={`w-3.5 h-3.5 shrink-0 ${isLocatingGps ? 'animate-spin' : ''}`} />
                  <span>
                    {isLocatingGps
                      ? lang === 'bn'
                        ? 'GPS নেওয়া হচ্ছে...'
                        : 'Detecting GPS...'
                      : lang === 'bn'
                        ? 'আমার GPS লোকেশন নিন'
                        : 'Use My Live GPS'}
                  </span>
                </button>
              </div>

              {gpsStatusNote && (
                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                  ✓ {gpsStatusNote}
                </div>
              )}

              {/* Quick Popular Districts */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                {QUICK_DISTRICTS.map((qd) => {
                  const active = district === qd.id;
                  return (
                    <button
                      key={qd.id}
                      type="button"
                      onClick={() => setDistrict(qd.id)}
                      className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {lang === 'bn' ? qd.bn : qd.en}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* 64 District Select */}
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'bn' ? 'জেলা নির্বাচন করুন' : 'Select District'}
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white"
                  >
                    {DISTRICTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {lang === 'bn' ? `${d.nameBn} (${d.nameEn})` : d.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Free-Text Editable Area / Neighborhood Input */}
                <div className="sm:col-span-7 relative">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {lang === 'bn'
                      ? 'এলাকা / মহল্লা / রোড (নিজে লিখুন অথবা নিচে চাপুন)'
                      : 'Area / Neighborhood (Type freely or tap below)'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-rose-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      maxLength={50}
                      value={areaAddress}
                      onFocus={() => setShowAreaSuggestions(true)}
                      onChange={(e) => {
                        setAreaAddress(e.target.value);
                        setShowAreaSuggestions(true);
                      }}
                      placeholder={
                        lang === 'bn'
                          ? 'যেমন: নিকেতন, রোড ৪ / Niketon / ধানমন্ডি...'
                          : 'e.g. Niketon, Road 4 / Banani / Dhanmondi...'
                      }
                      className="w-full h-11 pl-9 pr-3 rounded-xl bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {showAreaSuggestions && typedAreaSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-[68px] z-30 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 shadow-xl max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {typedAreaSuggestions.map((sug) => (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => {
                            setAreaAddress(sug.title.slice(0, 50));
                            setDistrict(sug.districtId);
                            setShowAreaSuggestions(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-rose-50/70 dark:hover:bg-slate-800 flex items-center justify-between gap-2 text-xs cursor-pointer"
                        >
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {sug.title}
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {sug.subtitle}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 1-Tap Popular Area Chips (Users can tap OR edit freely!) */}
              {quickAreaChips.length > 0 && (
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {lang === 'bn'
                      ? 'দ্রুত নির্বাচন (ট্যাপ করার পরেও উপরে নিজের মতো লিখে নিতে পারবেন):'
                      : 'Quick select (you can still edit or add road/block above):'}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {quickAreaChips.slice(0, 10).map((chip) => {
                      const isPicked = areaAddress.trim().toLowerCase() === chip.toLowerCase();
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setAreaAddress(chip);
                            setShowAreaSuggestions(false);
                          }}
                          className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                            isPicked
                              ? 'bg-rose-600 text-white'
                              : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                          }`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Simple Everyday Toggle Checkboxes (Zero unlabeled dropdowns!) */}
            <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded shrink-0"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'bn'
                    ? 'আমি জরুরি রক্তদানের জন্য প্রস্তুত আছি'
                    : 'I am available for emergency blood donation'}
                </span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer min-h-[36px]">
                <input
                  type="checkbox"
                  checked={shareDirectContact}
                  onChange={(e) => setShareDirectContact(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded shrink-0"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {lang === 'bn'
                    ? 'জরুরি রোগীর পরিবার আমাকে সরাসরি কল বা WhatsApp করতে পারবেন'
                    : 'Allow emergency patients to Call or WhatsApp me directly'}
                </span>
              </label>
            </div>

            {/* Optional Admin Invite Toggle (Quiet & collapsed for normal users) */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  const next = !showAdminInviteBox;
                  setShowAdminInviteBox(next);
                  setAccountRole(next ? 'ADMIN' : 'USER');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <KeyRound className="w-3 h-3" />
                <span>
                  {lang === 'bn'
                    ? 'সমন্বয়ক / অ্যাডমিন ইনভাইট কোড আছে? (ঐচ্ছিক)'
                    : 'Have an Admin Coordinator Invite Code? (Optional)'}
                </span>
                {showAdminInviteBox ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {showAdminInviteBox && !isBootstrappedAdminUser(firebaseUser) && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-[#0d1322] border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <input
                    type="password"
                    value={adminSecretCode}
                    onChange={(e) => setAdminSecretCode(e.target.value)}
                    placeholder={
                      lang === 'bn'
                        ? 'ওনার প্রদত্ত অ্যাডমিন কোড লিখুন'
                        : 'Enter Owner-issued Admin Invite Code'
                    }
                    className="w-full h-10 px-3 rounded-lg bg-white dark:bg-[#111827] border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Single Clear Primary Save Button */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] px-4 py-2.5 rounded-xl btn-surface font-bold text-xs sm:text-sm cursor-pointer whitespace-nowrap"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isCompressingPhoto}
                className="flex-1 min-h-[48px] px-5 py-2.5 rounded-xl btn-crimson font-black text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-60"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>
                  {isSubmitting
                    ? lang === 'bn'
                      ? 'সেভ হচ্ছে...'
                      : 'Saving...'
                    : lang === 'bn'
                      ? 'প্রোফাইল সেভ করুন'
                      : 'Save Profile'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
