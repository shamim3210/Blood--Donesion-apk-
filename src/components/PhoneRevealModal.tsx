import React, { useState } from 'react';
import { Donor, Language } from '../types';
import { getTranslation } from '../utils/translations';
import {
  fetchUnmaskedDonorContactIfAuthorized,
  submitScamReportInFirestore,
} from '../firebase';
import { buildOfflineEmergencySmsUri } from '../utils/sosAlertEngine';
import {
  ShieldCheck,
  Phone,
  MessageSquare,
  Copy,
  Check,
  X,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Lock,
  ShieldAlert,
  Mail,
} from 'lucide-react';

interface PhoneRevealModalProps {
  donor: Donor | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onLogAudit: (action: 'UNMASK_PHONE', details: string) => void;
}

export const PhoneRevealModal: React.FC<PhoneRevealModalProps> = ({
  donor,
  isOpen,
  onClose,
  lang,
  onLogAudit,
}) => {
  const t = getTranslation(lang);
  const [revealed, setRevealed] = useState(false);
  const [isFetchingContact, setIsFetchingContact] = useState(false);
  const [resolvedContact, setResolvedContact] = useState<{
    phone: string;
    whatsappPhone?: string;
    facebookUrl?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showScamForm, setShowScamForm] = useState(false);
  const [scamReason, setScamReason] = useState(
    'হাসপাতালে আসার আগে বিকাশ/নগদে গাড়িভাড়া বা টাকা দাবি করেছে'
  );
  const [scamFeedback, setScamFeedback] = useState<string | null>(null);
  const [isReportingScam, setIsReportingScam] = useState(false);

  if (!isOpen || !donor) return null;

  const handleReveal = async () => {
    setIsFetchingContact(true);
    try {
      if (donor.phone.includes('*')) {
        const unmasked = await fetchUnmaskedDonorContactIfAuthorized(donor.id);
        setResolvedContact(
          unmasked || {
            phone: donor.phone,
            whatsappPhone: donor.whatsappPhone,
            facebookUrl: donor.facebookUrl,
          }
        );
      } else {
        setResolvedContact({
          phone: donor.phone,
          whatsappPhone: donor.whatsappPhone,
          facebookUrl: donor.facebookUrl,
        });
      }
      setRevealed(true);
      onLogAudit(
        'UNMASK_PHONE',
        `Unmasked phone of donor: ${donor.name} (${donor.bloodGroup}, ID: ${donor.id})`
      );
    } finally {
      setIsFetchingContact(false);
    }
  };

  const activePhone = resolvedContact?.phone || donor.phone;
  const activeWhatsapp = resolvedContact?.whatsappPhone || donor.whatsappPhone || activePhone;
  const activeFacebook = resolvedContact?.facebookUrl || donor.facebookUrl;
  const isStillMasked = activePhone.includes('*');

  const handleCopyPhone = () => {
    if (isStillMasked) return;
    navigator.clipboard.writeText(activePhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setRevealed(false);
    setResolvedContact(null);
    setCopied(false);
    setShowScamForm(false);
    setScamFeedback(null);
    onClose();
  };

  const handleReportScam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReportingScam) return;
    setIsReportingScam(true);
    try {
      await submitScamReportInFirestore({
        suspectPhone: activePhone,
        suspectName: donor.name,
        reason: scamReason,
      });
      setShowScamForm(false);
      setScamFeedback(
        lang === 'bn'
          ? '✓ রিপোর্ট গৃহীত হয়েছে! অ্যাডমিন টিম নম্বরটি যাচাই করে ব্লকলিস্টে যুক্ত করবে।'
          : '✓ Scam report submitted to Admin moderation!'
      );
    } catch (err: any) {
      setScamFeedback(err?.message || 'রিপোর্ট পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setIsReportingScam(false);
    }
  };

  const plainSmsBody =
    lang === 'bn'
      ? `আসসালামু আলাইকুম ${donor.name}, জরুরি রোগীর জন্য ${donor.bloodGroup} রক্ত প্রয়োজন। আপনি কি রক্তদানে প্রস্তুত আছেন? - BloodSearch`
      : `Hello ${donor.name}, we urgently need ${donor.bloodGroup} blood for a patient. Are you available to donate?`;

  const whatsappMessage = encodeURIComponent(plainSmsBody);
  const offlineSmsHref = buildOfflineEmergencySmsUri(activePhone, plainSmsBody);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain transition-all">
      <div className="w-full max-w-md my-2 sm:my-auto rounded-2xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-5 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 text-left">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t.phoneRevealTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {donor.name} · {donor.bloodGroup}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-3.5">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">{donor.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span className="capitalize">
                  {donor.upazila}, {donor.district}
                </span>
              </div>
            </div>
            <div className="px-3 py-1 rounded-lg bg-rose-600 text-white font-extrabold text-sm">
              {donor.bloodGroup}
            </div>
          </div>

          {/* Anti-bKash Scam Protection Shield */}
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/35 border border-red-200 dark:border-red-900/70 text-[11px] text-red-900 dark:text-red-200 leading-relaxed">
            <span className="font-black block mb-0.5">
              🛡️ বিকাশ/নগদ প্রতারণা সতর্কতা:
            </span>
            {lang === 'bn'
              ? 'স্বেচ্ছাসেবী রক্তদান সম্পূর্ণ বিনামূল্যে। রক্তদাতা হাসপাতালে এসে সশরীরে পৌঁছানোর আগে কখনোই বিকাশ/নগদে গাড়িভাড়া বা অগ্রিম টাকা পাঠাবেন না।'
              : 'Voluntary blood donation is 100% free. Never send advance travel fare via bKash/Nagad before the donor arrives in person at the hospital.'}
          </div>

          {!revealed ? (
            <>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{lang === 'bn' ? 'গোপনীয়তা ও নিরাপত্তা নোটিশ' : 'Security Audit Notice'}</span>
                </div>
                <p className="leading-relaxed">{t.phoneRevealNotice}</p>
              </div>

              <button
                onClick={handleReveal}
                disabled={isFetchingContact}
                className="w-full min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <Phone className="w-4 h-4" />
                <span>
                  {isFetchingContact
                    ? lang === 'bn'
                      ? 'নম্বর যাচাই হচ্ছে...'
                      : 'Checking...'
                    : t.confirmReveal}
                </span>
              </button>
            </>
          ) : isStillMasked ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Lock className="w-4 h-4" />
                  <span>
                    {lang === 'bn'
                      ? 'ক্লাউড প্রাইভেসি দ্বারা সুরক্ষিত নম্বর'
                      : 'Cloud Privacy Protected Number'}
                  </span>
                </div>
                <div className="text-xl font-mono font-bold text-slate-900 dark:text-white">
                  {activePhone}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lang === 'bn'
                    ? 'ব্যক্তিগত তথ্যের নিরাপত্তার জন্য ক্লাউড ডোনারদের পূর্ণ নম্বর শুধুমাত্র ভেরিফাইড অ্যাডমিন দেখতে পারেন। আপনি ইন-অ্যাপ চ্যাট অথবা জরুরি SOS আবেদনের মাধ্যমে সরাসরি যোগাযোগ করতে পারবেন।'
                    : 'Full PII phone numbers for cloud donors are restricted to verified Admins. Use In-App Chat or broadcast an Emergency SOS request.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 tracking-wider block">
                  {lang === 'bn' ? 'সরাসরি যোগাযোগের নম্বর' : 'Verified Contact Number'}
                </span>
                <div className="text-2xl font-mono tabular-nums font-bold text-slate-900 dark:text-white tracking-wider flex items-center justify-center gap-2">
                  <span>{activePhone}</span>
                  <button
                    onClick={handleCopyPhone}
                    title="Copy Phone Number"
                    className="p-1.5 rounded-md hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copied && (
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    {lang === 'bn' ? 'নম্বরটি কপি করা হয়েছে!' : 'Copied to clipboard!'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <a
                  href={`tel:${activePhone}`}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all text-center cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.directCall}</span>
                </a>
                <a
                  href={`https://wa.me/${activeWhatsapp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all text-center cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">WhatsApp</span>
                </a>
                <a
                  href={offlineSmsHref}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition-all text-center cursor-pointer"
                  title="ইন্টারনেট ছাড়াই ফোনের সাধারণ SMS পাঠান"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{lang === 'bn' ? 'অফলাইন SMS' : 'SMS'}</span>
                </a>
              </div>

              {activeFacebook && (
                <a
                  href={activeFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full min-h-[40px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ফেসবুক প্রোফাইল দেখুন' : 'View Facebook Profile'}</span>
                </a>
              )}
            </div>
          )}

          {/* 1-Tap Scam Report Drawer */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            {scamFeedback ? (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 text-center">
                {scamFeedback}
              </p>
            ) : !showScamForm ? (
              <button
                type="button"
                onClick={() => setShowScamForm(true)}
                className="w-full py-1.5 text-[11px] font-bold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  {lang === 'bn'
                    ? 'টাকা বা বিকাশ দাবি করলে নম্বরটি রিপোর্ট করুন'
                    : 'Report suspicious number / advance money demand'}
                </span>
              </button>
            ) : (
              <form onSubmit={handleReportScam} className="space-y-2 pt-1 text-xs">
                <input
                  type="text"
                  required
                  value={scamReason}
                  onChange={(e) => setScamReason(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-red-300 dark:border-red-800 text-slate-900 dark:text-white text-xs"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowScamForm(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isReportingScam}
                    className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                  >
                    {isReportingScam
                      ? lang === 'bn'
                        ? 'পাঠানো হচ্ছে...'
                        : 'Sending...'
                      : lang === 'bn'
                      ? 'রিপোর্ট পাঠান'
                      : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
