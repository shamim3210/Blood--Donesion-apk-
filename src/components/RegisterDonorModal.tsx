import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Donor, BloodGroup, Language, UserAccount } from '../types';
import { BrandLogo } from './BrandLogo';
import { ALL_BLOOD_GROUPS } from '../data/compatibility';
import { DIVISIONS, DISTRICTS } from '../data/bangladeshGeo';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogleReal,
  computeAdminProofHashSync,
  verifyAdminInviteCodeInCloud,
  isBootstrappedAdminUser,
  registerSmartAccountInFirestore,
  isUserVerifiedForWrites,
  normalizeAsciiDigits,
  parseFirebaseAuthError,
  compressAvatarIfNeeded,
  DEFAULT_AVATAR_DATA_URI,
  User,
} from '../firebase';
import {
  X,
  Check,
  UserPlus,
  Camera,
  Upload,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MapPin,
  AlertCircle,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Copy,
  Minus,
  Plus,
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

const makeAvatarSvg = (bgHex: string, accentHex: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="${bgHex}"/><circle cx="60" cy="45" r="21" fill="${accentHex}"/><path d="M25 104c5-20 18-31 35-31s30 11 35 31" fill="${accentHex}"/></svg>`
  )}`;

const PRESET_AVATARS = [
  DEFAULT_AVATAR_DATA_URI,
  makeAvatarSvg('#0f172a', '#f8fafc'),
  makeAvatarSvg('#059669', '#ecfdf5'),
  makeAvatarSvg('#1d4ed8', '#eff6ff'),
  makeAvatarSvg('#b45309', '#fffbeb'),
];

const QUICK_CITIES = [
  { div: 'dhaka', dist: 'dhaka', labelBn: 'ঢাকা', labelEn: 'Dhaka' },
  { div: 'chattogram', dist: 'chattogram', labelBn: 'চট্টগ্রাম', labelEn: 'Chattogram' },
  { div: 'sylhet', dist: 'sylhet', labelBn: 'সিলেট', labelEn: 'Sylhet' },
  { div: 'rajshahi', dist: 'rajshahi', labelBn: 'রাজশাহী', labelEn: 'Rajshahi' },
  { div: 'khulna', dist: 'khulna', labelBn: 'খুলনা', labelEn: 'Khulna' },
  { div: 'barishal', dist: 'barishal', labelBn: 'বরিশাল', labelEn: 'Barishal' },
  { div: 'rangpur', dist: 'rangpur', labelBn: 'রংপুর', labelEn: 'Rangpur' },
  { div: 'mymensingh', dist: 'mymensingh', labelBn: 'ময়মনসিংহ', labelEn: 'Mymensingh' },
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

  // Interactive 3-Step Studio State (1, 2, or 3)
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Panel Choice: 'USER' (User Panel) vs 'ADMIN' (Admin Panel — Owner-Locked)
  const [accountRole, setAccountRole] = useState<'USER' | 'ADMIN'>(initialRole);
  const [adminSecretCode, setAdminSecretCode] = useState('');
  const [showAdminCodeInput, setShowAdminCodeInput] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Live Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [email, setEmail] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('B+');
  const [division, setDivision] = useState('dhaka');
  const [district, setDistrict] = useState('dhaka');
  const [upazila, setUpazila] = useState('dhanmondi');
  const [age, setAge] = useState(24);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [weightKg, setWeightKg] = useState(62);
  const [available, setAvailable] = useState(true);
  const [lastDonatedDate, setLastDonatedDate] = useState('');

  // Photo Upload State
  const [photoUrl, setPhotoUrl] = useState<string>(PRESET_AVATARS[0]);
  const [photoFileName, setPhotoFileName] = useState<string>('');

  // Generated ID Card Screen
  const [createdAccount, setCreatedAccount] = useState<UserAccount | null>(null);
  const [isCopiedId, setIsCopiedId] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setAccountRole(initialRole);
    if (isOpen) {
      setStep(1);
      setFormError(null);
      setAdminError('');
    }
  }, [initialRole, isOpen]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      if (u) {
        setName((prev) => prev || u.displayName || '');
        if (u.email) setEmail(u.email);
        if (u.phoneNumber) {
          setPhone((prev) => prev || u.phoneNumber || '');
          setWhatsappPhone((prev) => prev || u.phoneNumber || '');
        }
        if (u.photoURL) {
          setPhotoUrl((prev) => (prev === PRESET_AVATARS[0] ? u.photoURL! : prev));
        }
      }
    });
    return () => unsub();
  }, []);

  const currentDistricts = useMemo(
    () => DISTRICTS.filter((d) => d.divisionId === division),
    [division]
  );
  const selectedDistrictObj = useMemo(
    () => DISTRICTS.find((d) => d.id === district),
    [district]
  );
  const currentUpazilas = selectedDistrictObj ? selectedDistrictObj.upazilas : [];

  // Live Completion Progress Percentage for Engaging Studio Feel
  const completionPercent = useMemo(() => {
    let score = 25; // Role + BloodGroup selected by default
    if (firebaseUser && isUserVerifiedForWrites(firebaseUser)) score += 20;
    if (name.trim().length >= 2) score += 15;
    if (normalizeAsciiDigits(phone).trim().length >= 6) score += 15;
    if (normalizeAsciiDigits(whatsappPhone || phone).trim().length >= 6) score += 10;
    if (facebookUrl.trim().length >= 5) score += 15;
    return Math.min(100, score);
  }, [firebaseUser, name, phone, whatsappPhone, facebookUrl]);

  if (!isOpen) return null;

  const handleDivisionChange = (newDiv: string) => {
    setDivision(newDiv);
    const firstDist = DISTRICTS.find((d) => d.divisionId === newDiv);
    if (firstDist) {
      setDistrict(firstDist.id);
      setUpazila(firstDist.upazilas[0]?.id || '');
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const dObj = DISTRICTS.find((d) => d.id === newDist);
    setUpazila(dObj?.upazilas[0]?.id || '');
  };

  const handleQuickCitySelect = (divId: string, distId: string) => {
    setDivision(divId);
    const dObj = DISTRICTS.find((d) => d.id === distId);
    if (dObj) {
      setDistrict(dObj.id);
      setUpazila(dObj.upazilas[0]?.id || '');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFileName(file.name);
    setIsCompressingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        // Compress immediately so state updates never lag the UI!
        const fastThumb = await compressAvatarIfNeeded(reader.result);
        setPhotoUrl(fastThumb);
      }
      setIsCompressingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleConnectRealGmail = () => {
    // Invoke signInWithGoogleReal synchronously inside click handler to prevent popup blocking
    const popupPromise = signInWithGoogleReal(email);
    setFormError(null);
    popupPromise
      .then((u) => {
        setFirebaseUser(u);
        if (u.displayName && !name) setName(u.displayName);
        if (u.email) setEmail(u.email);
        if (u.photoURL && photoUrl === PRESET_AVATARS[0]) setPhotoUrl(u.photoURL);
      })
      .catch((err: any) => {
        const parsed = parseFirebaseAuthError(err);
        setFormError(lang === 'bn' ? parsed.messageBn : parsed.messageEn);
      });
  };

  const validateAndGoStep = (targetStep: 1 | 2 | 3) => {
    setFormError(null);
    setAdminError('');

    if (targetStep > 1 && accountRole === 'ADMIN') {
      const isSuperOwner = isBootstrappedAdminUser(firebaseUser);
      if (!isSuperOwner) {
        const check = computeAdminProofHashSync(adminSecretCode);
        if (!check.wellFormed) {
          setStep(1);
          setAdminError(
            lang === 'bn'
              ? 'অ্যাপ ওনারের প্রদানকৃত কমপক্ষে ৬ অক্ষরের অ্যাডমিন ইনভাইট কোড দিন অথবা ইউজার প্যানেল বেছে নিন।'
              : 'Enter the Owner-issued Admin Invite Code (min 6 chars) or choose User Panel.'
          );
          return;
        }
      }
    }

    if (targetStep === 3) {
      const cleanPhone = normalizeAsciiDigits(phone).trim();
      const cleanWa = normalizeAsciiDigits(whatsappPhone || phone).trim();
      const fb = facebookUrl.trim();

      if (name.trim().length < 2 || cleanPhone.length < 6) {
        setStep(2);
        setFormError(
          lang === 'bn'
            ? 'অনুগ্রহ করে আপনার পূর্ণ নাম এবং সঠিক মোবাইল নম্বর লিখুন।'
            : 'Please enter your full name and valid mobile number.'
        );
        return;
      }
      if (cleanWa.length < 6) {
        setStep(2);
        setFormError(
          lang === 'bn'
            ? 'হোয়াটসঅ্যাপ নম্বর দেওয়া বাধ্যতামূলক।'
            : 'WhatsApp number is mandatory.'
        );
        return;
      }
      if (fb.length < 5) {
        setStep(2);
        setFormError(
          lang === 'bn'
            ? 'ফেসবুক প্রোফাইল লিংক দেওয়া বাধ্যতামূলক (নিচের বাটনে ট্যাপ করে বসাতে পারেন)।'
            : 'Facebook profile link is mandatory.'
        );
        return;
      }
    }

    setStep(targetStep);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setAdminError('');

    const cleanPhone = normalizeAsciiDigits(phone).trim();
    const cleanWa = normalizeAsciiDigits(whatsappPhone || phone).trim();
    const fb = facebookUrl.trim();

    // SYNCHRONOUS FORMAT CHECK (Zero `await` before signInWithGoogleReal so popup is NEVER blocked!)
    if (accountRole === 'ADMIN' && !isBootstrappedAdminUser(auth.currentUser)) {
      const check = computeAdminProofHashSync(adminSecretCode);
      if (!check.wellFormed && adminSecretCode.trim().length > 0) {
        setStep(1);
        setAdminError(
          lang === 'bn'
            ? 'ভুল গোপন কোড! শুধুমাত্র অ্যাপ ওনারের অনুমোদিত গোপন কোড দিলেই অ্যাডমিন প্যানেল আইডি তৈরি করা যাবে।'
            : 'Invalid Secret Code! Only Owner-issued invite codes can create an Admin Panel ID.'
        );
        return;
      }
    }

    if (name.trim().length < 2 || cleanPhone.length < 6) {
      setStep(2);
      setFormError(
        lang === 'bn'
          ? 'অনুগ্রহ করে আপনার পূর্ণ নাম এবং সঠিক মোবাইল নম্বর প্রদান করুন।'
          : 'Please provide your full name and valid mobile phone number.'
      );
      return;
    }

    if (cleanWa.length < 6) {
      setStep(2);
      setFormError(
        lang === 'bn'
          ? 'হোয়াটসঅ্যাপ নম্বর দেওয়া বাধ্যতামূলক।'
          : 'WhatsApp number is mandatory for emergency coordination.'
      );
      return;
    }

    if (fb.length < 5) {
      setStep(2);
      setFormError(
        lang === 'bn'
          ? 'ফেসবুক প্রোফাইল লিংক (FB ID Link) দেওয়া বাধ্যতামূলক।'
          : 'Facebook Profile URL is mandatory for identity verification.'
      );
      return;
    }

    // Start Google OAuth popup SYNCHRONOUSLY if user isn't signed in yet
    let pendingAuthPromise: Promise<User> | null = null;
    if (!auth.currentUser || !isUserVerifiedForWrites(auth.currentUser)) {
      pendingAuthPromise = signInWithGoogleReal(email);
    }

    setIsSubmitting(true);
    try {
      let activeFirebaseUser = auth.currentUser;
      if (pendingAuthPromise) {
        try {
          activeFirebaseUser = await pendingAuthPromise;
          setFirebaseUser(activeFirebaseUser);
        } catch (authErr: any) {
          const parsed = parseFirebaseAuthError(authErr);
          setFormError(lang === 'bn' ? parsed.messageBn : parsed.messageEn);
          setIsSubmitting(false);
          return;
        }
      }

      if (!activeFirebaseUser) {
        setIsSubmitting(false);
        return;
      }

      // Server-Side Cloud Vault Verification for ADMIN role (Super Owner passes automatically!)
      let verifiedProofHash = '';
      if (accountRole === 'ADMIN') {
        const cloudCheck = await verifyAdminInviteCodeInCloud(adminSecretCode, activeFirebaseUser);
        if (!cloudCheck.valid || !cloudCheck.proofHash) {
          setStep(1);
          setAdminError(
            lang === 'bn'
              ? 'অ্যাডমিন প্যানেল ওনার লক দ্বারা সুরক্ষিত! শুধুমাত্র অ্যাপ ওনার (shamimrakib015@gmail.com) অথবা তাঁর দেওয়া সক্রিয় ইনভাইট কোড দিয়েই অ্যাডমিন আইডি খোলা যাবে।'
              : 'Admin Panel is Owner-Locked! Only the verified App Owner or an active Owner-issued Invite Code can register an Admin ID.'
          );
          setIsSubmitting(false);
          return;
        }
        verifiedProofHash = cloudCheck.proofHash;
      }

      const randomSerial = Math.floor(1000 + Math.random() * 9000);
      const generatedId =
        accountRole === 'ADMIN'
          ? `ADMIN-BD-${new Date().getFullYear()}-${randomSerial}`
          : `USER-BD-${new Date().getFullYear()}-${randomSerial}`;

      const normalizedFb = fb.startsWith('http') ? fb : `https://${fb}`;

      const newAccount: UserAccount = {
        id: activeFirebaseUser.uid,
        name: name.trim(),
        email:
          activeFirebaseUser.email ||
          email.trim() ||
          `${activeFirebaseUser.uid.slice(0, 8)}@bloodsearch.bd`,
        phone: cleanPhone,
        whatsappPhone: cleanWa,
        facebookUrl: normalizedFb,
        bloodGroup,
        division,
        district,
        upazila,
        photoUrl,
        role: accountRole,
        verifiedStatus: true,
        idCardNumber: generatedId,
        age: Number(age) || 24,
        gender,
        weightKg: Number(weightKg) || 62,
        availableToDonate: available,
        lastDonationDate: lastDonatedDate || undefined,
        totalDonations: lastDonatedDate ? 1 : 0,
        createdAt: new Date().toISOString(),
      };

      const newDonor: Donor = {
        id: activeFirebaseUser.uid,
        name: name.trim(),
        bloodGroup,
        division,
        district,
        upazila,
        phone: cleanPhone,
        whatsappPhone: cleanWa,
        facebookUrl: normalizedFb,
        available,
        lastDonatedDate: lastDonatedDate || '',
        totalDonations: lastDonatedDate ? 1 : 0,
        verifiedBadge: accountRole === 'ADMIN',
        rating: 5.0,
        reviewsCount: 1,
        age: Number(age) || 24,
        gender,
        weightKg: Number(weightKg) || 62,
        hospitalAffiliation:
          accountRole === 'ADMIN' ? 'জেলা রক্ত সমন্বয়ক ও অ্যাডমিন' : 'স্বেচ্ছাসেবী রক্তদাতা',
        bio: 'জরুরি প্রয়োজনে রক্তদানে প্রস্তুত আছি।',
        avatar: photoUrl,
        reliabilityScore: 99,
      };

      await registerSmartAccountInFirestore({
        firebaseUser: activeFirebaseUser,
        account: newAccount,
        donor: newDonor,
        adminProofHash: accountRole === 'ADMIN' ? verifiedProofHash : undefined,
      });

      localStorage.setItem('bloodsearch_current_user', JSON.stringify(newAccount));
      window.dispatchEvent(new Event('bloodsearch_user_changed'));

      onRegisterDonor(newDonor, newAccount);
      onLogAudit(
        accountRole === 'ADMIN' ? 'STATUS_CHANGE' : 'DONOR_REGISTERED',
        `${accountRole === 'ADMIN' ? 'ADMIN PANEL ID' : 'USER PANEL ID'} Registered in Firestore: ${newAccount.name} (${generatedId})`
      );
      setCreatedAccount(newAccount);
    } catch (err: any) {
      setFormError(
        lang === 'bn'
          ? `ডাটাবেজে সংরক্ষণ করতে সমস্যা হয়েছে: ${err?.message || 'আবার চেষ্টা করুন'}`
          : `Failed to save Smart ID to Firestore: ${err?.message || 'Please retry'}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCardId = () => {
    if (createdAccount) {
      navigator.clipboard.writeText(createdAccount.idCardNumber);
      setIsCopiedId(true);
      setTimeout(() => setIsCopiedId(false), 2000);
    }
  };

  const handleClose = () => {
    setCreatedAccount(null);
    onClose();
  };

  const previewDistrictName = selectedDistrictObj
    ? lang === 'bn'
      ? selectedDistrictObj.nameBn
      : selectedDistrictObj.nameEn
    : district;
  const previewUpazilaObj = currentUpazilas.find((u) => u.id === upazila);
  const previewUpazilaName = previewUpazilaObj
    ? lang === 'bn'
      ? previewUpazilaObj.nameBn
      : previewUpazilaObj.nameEn
    : upazila;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
      <div className="w-full max-w-xl my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 text-left">
        {/* Top Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 min-w-0">
            <BrandLogo variant="mark" size="md" />
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                {createdAccount
                  ? lang === 'bn'
                    ? 'অফিসিয়াল ডিজিটাল স্মার্ট আইডি কার্ড'
                    : 'Official Digital Smart ID Card'
                  : lang === 'bn'
                  ? 'স্মার্ট আইডি স্টুডিও (৩টি সহজ ধাপ)'
                  : 'Smart ID Studio (3 Quick Steps)'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {lang === 'bn'
                  ? 'লাইভ কার্ড প্রিভিউসহ ৩০ সেকেন্ডে আপনার ভেরিফাইড আইডি তৈরি করুন'
                  : 'Build your verified Smart ID with live preview in 30 seconds'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================================================================= */}
        {/* 1. GENERATED SMART ID CARD VIEW (SUCCESS SCREEN)                  */}
        {/* ================================================================= */}
        {createdAccount ? (
          <div className="py-4 space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
              <div className="text-xs min-w-0">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-200">
                  {createdAccount.role === 'ADMIN'
                    ? lang === 'bn'
                      ? 'অ্যাডমিন প্যানেল স্মার্ট আইডি সফলভাবে তৈরি হয়েছে!'
                      : 'Admin Panel Smart ID Created & Saved!'
                    : lang === 'bn'
                    ? 'ইউজার প্যানেল স্মার্ট আইডি সফলভাবে তৈরি হয়েছে!'
                    : 'User Panel Smart ID Created & Saved!'}
                </h4>
                <p className="text-emerald-700 dark:text-emerald-300 text-[11px] mt-0.5 truncate">
                  {createdAccount.email} · WhatsApp ও লাইভ চ্যাট চালু হয়েছে
                </p>
              </div>
            </div>

            {/* Digital Smart Card */}
            <div
              className={`w-full rounded-3xl text-white p-5 shadow-xl relative overflow-hidden ${
                createdAccount.role === 'ADMIN'
                  ? 'bg-[#1c1917] border-2 border-amber-500/70'
                  : 'bg-[#0f172a] border-2 border-rose-500/60'
              }`}
            >
              <div className="absolute top-2 right-2 p-2 opacity-10 pointer-events-none text-white">
                <QrCode className="w-24 h-24" />
              </div>

              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-700/80 relative z-10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <BrandLogo variant="mark" size="xs" />
                  <div className="min-w-0">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider block ${
                        createdAccount.role === 'ADMIN' ? 'text-amber-400' : 'text-rose-400'
                      }`}
                    >
                      {createdAccount.role === 'ADMIN'
                        ? 'BLOODSEARCH BANGLADESH · ADMIN'
                        : 'BLOODSEARCH BANGLADESH · MEMBER'}
                    </span>
                    <span className="text-xs font-bold text-slate-200 block truncate">
                      {createdAccount.role === 'ADMIN'
                        ? 'অফিসিয়াল অ্যাডমিন প্যানেল ও সমন্বয়ক কার্ড'
                        : 'জাতীয় ডিজিটাল রক্তদাতা ও ইউজার স্মার্ট কার্ড'}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-black text-emerald-400 shrink-0">
                  ✓ VERIFIED
                </span>
              </div>

              <div className="py-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 relative z-10">
                <div
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-2 shrink-0 bg-slate-800 ${
                    createdAccount.role === 'ADMIN' ? 'ring-amber-400' : 'ring-rose-500'
                  }`}
                >
                  <img
                    src={createdAccount.photoUrl}
                    alt={createdAccount.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <h3 className="text-lg font-black text-white truncate">{createdAccount.name}</h3>
                    <span
                      className={`inline-flex self-center sm:self-auto items-center px-3 py-1 rounded-xl text-white font-black text-sm ${
                        createdAccount.role === 'ADMIN' ? 'bg-amber-600' : 'bg-rose-600'
                      }`}
                    >
                      {createdAccount.bloodGroup}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-mono flex items-center justify-center sm:justify-start gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{createdAccount.phone}</span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="capitalize truncate">
                      {createdAccount.upazila}, {createdAccount.district}
                    </span>
                  </div>

                  <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 flex-wrap text-[11px] text-slate-300">
                    {createdAccount.whatsappPhone && (
                      <a
                        href={`https://wa.me/${createdAccount.whatsappPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:underline font-bold"
                      >
                        WhatsApp: {createdAccount.whatsappPhone}
                      </a>
                    )}
                    {createdAccount.facebookUrl && (
                      <>
                        <span aria-hidden="true">·</span>
                        <a
                          href={createdAccount.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:underline font-bold"
                        >
                          Facebook Profile ↗
                        </a>
                      </>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-800">
                    <span>
                      ID:{' '}
                      <strong
                        className={createdAccount.role === 'ADMIN' ? 'text-amber-300' : 'text-white'}
                      >
                        {createdAccount.idCardNumber}
                      </strong>
                    </span>
                    <span className="text-emerald-400 font-bold">LIVE SYNC</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons After Creation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyCardId}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                {isCopiedId ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-500" />
                )}
                <span>{isCopiedId ? 'কপি হয়েছে!' : 'আইডি কপি'}</span>
              </button>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onNavigateTab('chat');
                  }}
                  className="py-3 px-4 rounded-xl bg-[#075e54] hover:bg-[#064e46] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'লাইভ চ্যাটে যান' : 'Open Live Chat'}</span>
                </button>
              )}

              {createdAccount.role === 'ADMIN' && onNavigateTab ? (
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onNavigateTab('admin');
                  }}
                  className="py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'অ্যাডমিন প্যানেল →' : 'Admin Panel →'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClose}
                  className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>{lang === 'bn' ? 'হোমে ফিরে যান' : 'Done'}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ================================================================= */
          /* 2. INTERACTIVE 3-STEP SMART ID STUDIO                             */
          /* ================================================================= */
          <form onSubmit={handleSubmit} className="pt-3.5 space-y-3.5">
            {/* LIVE REAL-TIME MINI SMART ID PREVIEW */}
            <div
              className={`rounded-2xl p-3.5 text-white transition-colors border ${
                accountRole === 'ADMIN'
                  ? 'bg-[#1c1917] border-amber-500/60'
                  : 'bg-[#0f172a] border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[11px] pb-2 mb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2 min-w-0">
                  <BrandLogo variant="mark" size="xs" />
                  <span className="font-bold text-slate-200 truncate">
                    {accountRole === 'ADMIN'
                      ? lang === 'bn'
                        ? 'লাইভ প্রিভিউ · অ্যাডমিন স্মার্ট কার্ড'
                        : 'Live Preview · Admin Smart Card'
                      : lang === 'bn'
                      ? 'লাইভ প্রিভিউ · ইউজার স্মার্ট কার্ড'
                      : 'Live Preview · User Smart Card'}
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-400 shrink-0">
                  {completionPercent}% {lang === 'bn' ? 'সম্পন্ন' : 'Ready'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-800 ring-2 ring-white/20 shrink-0">
                  <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="ছবি পরিবর্তন করুন"
                    className="absolute inset-0 bg-black/35 hover:bg-black/55 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-black text-sm text-white truncate">
                      {name.trim() || (lang === 'bn' ? 'আপনার নাম এখানে দেখাবে' : 'Your Full Name')}
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg font-black text-xs text-white shrink-0 ${
                        accountRole === 'ADMIN' ? 'bg-amber-600' : 'bg-rose-600'
                      }`}
                    >
                      {bloodGroup}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-2 truncate">
                    <span className="font-mono">
                      {phone.trim() || '01XXXXXXXXX'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">
                      {previewUpazilaName}, {previewDistrictName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Smooth Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-3">
                <div
                  className={`h-full transition-all duration-300 ${
                    accountRole === 'ADMIN' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            {/* INTERACTIVE 3-STEP SEGMENTED TABS */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer truncate ${
                  step === 1
                    ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang === 'bn' ? '১. প্যানেল ও রক্ত' : '1. Role & Group'}
              </button>
              <button
                type="button"
                onClick={() => validateAndGoStep(2)}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer truncate ${
                  step === 2
                    ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang === 'bn' ? '২. নাম ও WhatsApp' : '2. Contact & WA'}
              </button>
              <button
                type="button"
                onClick={() => validateAndGoStep(3)}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer truncate ${
                  step === 3
                    ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {lang === 'bn' ? '৩. ঠিকানা ও সম্পন্ন' : '3. Area & Finish'}
              </button>
            </div>

            {/* Hidden File Input (Shared across steps & preview) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* =============================================================== */}
            {/* STEP 1: PANEL CHOICE, GOOGLE FAST-FILL, BLOOD GROUP & PHOTO     */}
            {/* =============================================================== */}
            {step === 1 && (
              <div className="space-y-3.5 max-h-[52vh] overflow-y-auto pr-0.5 app-scroll-smooth">
                {/* 1A: User Panel vs Admin Panel */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setAccountRole('USER');
                      setAdminError('');
                    }}
                    className={`p-3 rounded-2xl border-2 text-left transition-colors cursor-pointer ${
                      accountRole === 'USER'
                        ? 'bg-rose-50 dark:bg-rose-950/35 border-rose-600'
                        : 'bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                        {lang === 'bn' ? '👤 ইউজার প্যানেল' : '👤 User Panel'}
                      </span>
                      {accountRole === 'USER' && (
                        <CheckCircle2 className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                      {lang === 'bn'
                        ? 'সাধারণ ইউজার, রক্তদাতা ও মেসেজিং (কোড লাগবে না)'
                        : 'Standard Donor & Chat ID (No code needed)'}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountRole('ADMIN')}
                    className={`p-3 rounded-2xl border-2 text-left transition-colors cursor-pointer ${
                      accountRole === 'ADMIN'
                        ? 'bg-amber-50 dark:bg-amber-950/35 border-amber-500'
                        : 'bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                        {lang === 'bn' ? '🛡️ অ্যাডমিন প্যানেল' : '🛡️ Admin Panel'}
                      </span>
                      {accountRole === 'ADMIN' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                      {lang === 'bn'
                        ? 'শুধুমাত্র গোপন মাস্টার কোড দিয়ে অ্যাডমিন আইডি'
                        : 'Authorized Admin ID (Requires secret code)'}
                    </p>
                  </button>
                </div>

                {/* Admin Owner-Locked Gate Box */}
                {accountRole === 'ADMIN' && (
                  <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-400 dark:border-amber-700 space-y-2">
                    {isBootstrappedAdminUser(firebaseUser) ? (
                      <div className="flex items-center gap-2 text-xs font-black text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          {lang === 'bn'
                            ? '👑 সুপার ওনার ভেরিফাইড (shamimrakib015@gmail.com) — কোনো কোড ছাড়াই সরাসরি অ্যাডমিন আইডি তৈরি হবে।'
                            : '👑 Super Owner Verified — Direct Admin ID creation unlocked without code.'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              {lang === 'bn'
                                ? 'ওনার অনুমোদিত গোপন ইনভাইট কোড *'
                                : 'Owner-Issued Admin Invite Code *'}
                            </span>
                          </label>
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                            {lang === 'bn' ? 'Owner-Locked 🔒' : 'Owner-Locked 🔒'}
                          </span>
                        </div>

                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-amber-600 absolute left-3 top-2.5" />
                          <input
                            type={showAdminCodeInput ? 'text' : 'password'}
                            value={adminSecretCode}
                            onChange={(e) => {
                              setAdminSecretCode(e.target.value);
                              setAdminError('');
                            }}
                            placeholder={
                              lang === 'bn'
                                ? 'ওনারের দেওয়া গোপন কোড লিখুন (অথবা ওনার Gmail সংযুক্ত করুন)...'
                                : 'Enter Owner-issued secret code...'
                            }
                            className="w-full pl-9 pr-10 py-2 rounded-xl border border-amber-400 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAdminCodeInput(!showAdminCodeInput)}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            {showAdminCodeInput ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                          {lang === 'bn'
                            ? 'অ্যান্টি-হ্যাক সুরক্ষা: অ্যাপ ওনার ছাড়া অন্য কেউ অনুমান করে অ্যাডমিন হতে পারবে না। আপনি ওনার হলে নিচে Google সংযুক্ত করুন।'
                            : 'Anti-Hijack Protection: Only the App Owner or holders of an active Cloud Vault code can create an Admin ID.'}
                        </p>
                      </>
                    )}

                    {adminError && (
                      <p className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{adminError}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* 1B: 1-Click Google Auto-Fill (Saves typing!) */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    {firebaseUser && isUserVerifiedForWrites(firebaseUser) ? (
                      <>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 block">
                          ✓ আসল Gmail সংযুক্ত হয়েছে
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block truncate">
                          {firebaseUser.email || firebaseUser.phoneNumber}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          ⚡ ১-ক্লিকে নাম ও ছবি অটো-ফিল করুন
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          আপনার আসল Gmail দিয়ে ভেরিফাই ও দ্রুত ফর্ম পূরণ
                        </span>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectRealGmail}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold text-xs cursor-pointer shrink-0"
                  >
                    {firebaseUser
                      ? lang === 'bn'
                        ? 'অন্য Gmail'
                        : 'Switch'
                      : lang === 'bn'
                      ? 'Gmail যুক্ত করুন'
                      : 'Connect Gmail'}
                  </button>
                </div>

                {/* 1C: Blood Group Interactive Grid */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    {lang === 'bn' ? 'আপনার রক্তের গ্রুপ ট্যাপ করুন *' : 'Tap Your Blood Group *'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {ALL_BLOOD_GROUPS.map((grp) => (
                      <button
                        key={grp}
                        type="button"
                        onClick={() => setBloodGroup(grp)}
                        className={`py-2.5 rounded-xl text-center font-black text-sm transition-colors cursor-pointer ${
                          bloodGroup === grp
                            ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {grp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1D: Fast Avatar Picker & Upload */}
                <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPhotoUrl(url);
                          setPhotoFileName('');
                        }}
                        className={`w-8 h-8 rounded-xl overflow-hidden cursor-pointer transition-transform ${
                          photoUrl === url ? 'ring-2 ring-rose-600 scale-105' : 'opacity-65 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {isCompressingPhoto
                        ? 'অপ্টিমাইজ হচ্ছে...'
                        : photoFileName
                        ? 'ছবি বদলান'
                        : lang === 'bn'
                        ? 'নিজের ছবি দিন'
                        : 'Upload Photo'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* STEP 2: IDENTITY, WHATSAPP CONNECT & FACEBOOK PROFILE           */}
            {/* =============================================================== */}
            {step === 2 && (
              <div className="space-y-3.5 max-h-[52vh] overflow-y-auto pr-0.5 app-scroll-smooth">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {lang === 'bn' ? 'পূর্ণ নাম *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={lang === 'bn' ? 'যেমন: তানভীর আহমেদ' : 'Full Name'}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      {lang === 'bn' ? 'মোবাইল নম্বর *' : 'Mobile Number *'}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPhone(val);
                        if (!whatsappPhone || whatsappPhone === phone) {
                          setWhatsappPhone(val);
                        }
                      }}
                      placeholder="017XXXXXXXX"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-rose-500 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Mandatory WhatsApp Box with 1-Tap Copy Helper */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-300 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-black text-emerald-950 dark:text-emerald-200">
                      {lang === 'bn'
                        ? '💬 WhatsApp নম্বর (সরাসরি চ্যাট সংযোগের জন্য বাধ্যতামূলক) *'
                        : '💬 WhatsApp Number (Mandatory for Direct Chat) *'}
                    </label>
                    {phone.trim().length >= 5 && whatsappPhone !== phone && (
                      <button
                        type="button"
                        onClick={() => setWhatsappPhone(phone)}
                        className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 underline cursor-pointer shrink-0"
                      >
                        মোবাইল নম্বরই দিন
                      </button>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#0f172a] border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Mandatory Facebook Link Box with 1-Tap Prefix Helper */}
                <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/25 border border-sky-300 dark:border-sky-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-black text-sky-950 dark:text-sky-200">
                      {lang === 'bn'
                        ? '🌐 ফেসবুক প্রোফাইল লিংক বা ইউজারনেম (বাধ্যতামূলক) *'
                        : '🌐 Facebook Profile Link (Mandatory) *'}
                    </label>
                    {!facebookUrl.includes('facebook.com/') && (
                      <button
                        type="button"
                        onClick={() =>
                          setFacebookUrl((prev) =>
                            prev.trim()
                              ? `https://facebook.com/${prev.replace(/^https?:\/\/(www\.)?facebook\.com\//i, '')}`
                              : 'https://facebook.com/'
                          )
                        }
                        className="px-2 py-0.5 rounded-lg bg-sky-600 text-white text-[10px] font-bold cursor-pointer shrink-0"
                      >
                        + facebook.com/ বসান
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/your.username"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#0f172a] border border-sky-300 dark:border-sky-700 text-slate-900 dark:text-white focus:outline-none focus:border-sky-600"
                  />
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* STEP 3: QUICK CITY CHIPS, STEPPERS & INSTANT CLOUD CREATE       */}
            {/* =============================================================== */}
            {step === 3 && (
              <div className="space-y-3.5 max-h-[52vh] overflow-y-auto pr-0.5 app-scroll-smooth">
                {/* 1-Tap Popular Cities so users don't get bored scrolling dropdowns */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    {lang === 'bn' ? '⚡ ১-ট্যাপে দ্রুত শহর নির্বাচন করুন' : '⚡ Quick Select City'}
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {QUICK_CITIES.map((c) => {
                      const active = district === c.dist;
                      return (
                        <button
                          key={c.dist}
                          type="button"
                          onClick={() => handleQuickCitySelect(c.div, c.dist)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                            active
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {lang === 'bn' ? c.labelBn : c.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Detailed Division, District, Upazila */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {lang === 'bn' ? 'বিভাগ' : 'Division'}
                    </label>
                    <select
                      value={division}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      className="w-full h-10 px-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      {DIVISIONS.map((div) => (
                        <option key={div.id} value={div.id}>
                          {lang === 'bn' ? div.nameBn : div.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {lang === 'bn' ? 'জেলা' : 'District'}
                    </label>
                    <select
                      value={district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full h-10 px-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      {currentDistricts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {lang === 'bn' ? d.nameBn : d.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {lang === 'bn' ? 'উপজেলা / থানা' : 'Area / Upazila'}
                    </label>
                    <select
                      value={upazila}
                      onChange={(e) => setUpazila(e.target.value)}
                      className="w-full h-10 px-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      {currentUpazilas.map((u) => (
                        <option key={u.id} value={u.id}>
                          {lang === 'bn' ? u.nameBn : u.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Interactive Age & Weight Touch Steppers + Gender */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {lang === 'bn' ? 'বয়স (বছর)' : 'Age (Years)'}
                    </span>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setAge((a) => Math.max(18, a - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-black text-sm">{age}</span>
                      <button
                        type="button"
                        onClick={() => setAge((a) => Math.min(65, a + 1))}
                        className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {lang === 'bn' ? 'ওজন (কেজি)' : 'Weight (kg)'}
                    </span>
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setWeightKg((w) => Math.max(45, w - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-black text-sm">{weightKg}</span>
                      <button
                        type="button"
                        onClick={() => setWeightKg((w) => Math.min(150, w + 1))}
                        className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {lang === 'bn' ? 'লিঙ্গ' : 'Gender'}
                    </span>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full h-7 px-2 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="MALE">পুরুষ (Male)</option>
                      <option value="FEMALE">মহিলা (Female)</option>
                      <option value="OTHER">অন্যান্য</option>
                    </select>
                  </div>
                </div>

                {/* Availability & Optional Last Donation Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800">
                  <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={available}
                      onChange={(e) => setAvailable(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>
                      {lang === 'bn'
                        ? 'আমি বর্তমানে জরুরি রক্তদানের জন্য প্রস্তুত'
                        : 'Available for emergency blood donation'}
                    </span>
                  </label>

                  <input
                    type="date"
                    value={lastDonatedDate}
                    onChange={(e) => setLastDonatedDate(e.target.value)}
                    title="সর্বশেষ রক্তদানের তারিখ (ঐচ্ছিক)"
                    className="px-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>
            )}

            {/* BOTTOM STEP NAVIGATION BAR */}
            <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
                  className="min-h-[46px] px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'পেছনে' : 'Back'}</span>
                </button>
              ) : (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {lang === 'bn' ? 'ধাপ ১ / ৩' : 'Step 1 of 3'}
                </div>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => validateAndGoStep(step === 1 ? 2 : 3)}
                  className="min-h-[46px] px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ml-auto"
                >
                  <span>
                    {step === 1
                      ? lang === 'bn'
                        ? 'পরবর্তী ধাপ: নাম ও WhatsApp'
                        : 'Next: Contact & WhatsApp'
                      : lang === 'bn'
                      ? 'পরবর্তী ধাপ: ঠিকানা ও কার্ড তৈরি'
                      : 'Next: Location & Create'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 min-h-[46px] px-5 rounded-xl text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 ${
                    accountRole === 'ADMIN'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    {isSubmitting
                      ? lang === 'bn'
                        ? 'ক্লাউডে স্মার্ট কার্ড তৈরি হচ্ছে...'
                        : 'Saving Smart ID...'
                      : accountRole === 'ADMIN'
                      ? lang === 'bn'
                        ? 'অ্যাডমিন স্মার্ট আইডি সম্পন্ন করুন'
                        : 'Create Admin Smart ID'
                      : lang === 'bn'
                      ? 'ইউজার স্মার্ট আইডি সম্পন্ন করুন'
                      : 'Create User Smart ID'}
                  </span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
