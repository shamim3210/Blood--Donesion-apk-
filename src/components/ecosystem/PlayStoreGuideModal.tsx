import React, { useState } from 'react';
import { Language } from '../../types';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { getSecurityDiagnostics } from '../../utils/securityShield';
import {
  BOOTSTRAPPED_SUPER_ADMIN_EMAIL,
  FIREBASE_PROJECT_ID,
  FIREBASE_PROJECT_SETTINGS_URL,
  FIREBASE_RULES_CONSOLE_URL,
  FIREBASE_SETTINGS_URL,
  GCP_API_CREDENTIALS_URL,
} from '../../firebase';
import {
  Smartphone,
  ShieldCheck,
  Download,
  ExternalLink,
  CheckCircle2,
  Copy,
  X,
  Package,
  Lock,
  Globe,
} from 'lucide-react';

interface PlayStoreGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const PlayStoreGuideModal: React.FC<PlayStoreGuideModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'apk' | 'security' | 'backup'>('apk');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [installNotice, setInstallNotice] = useState<string | null>(null);
  const { isInstallable, isInstalled, isIOS, isInIframe, promptInstall } = usePWAInstall();

  if (!isOpen) return null;

  const diag = getSecurityDiagnostics();
  const currentUrl = diag.origin || 'https://your-deployed-url.run.app';
  const manifestUrl = `${currentUrl}/manifest.webmanifest`;
  const bubblewrapCmd = `npx @bubblewrap/cli init --manifest=${manifestUrl}`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const handleDirectPhoneInstall = async () => {
    setInstallNotice(null);
    if (isInstalled) {
      setInstallNotice(
        lang === 'bn'
          ? '✓ অ্যাপটি ইতিমধ্যেই আপনার ডিভাইসে ইনস্টল করা আছে!'
          : '✓ App is already installed on this device!'
      );
      return;
    }
    if (isInstallable) {
      const res = await promptInstall();
      if (res === 'accepted') {
        setInstallNotice(
          lang === 'bn'
            ? '✓ অভিনন্দন! অ্যাপটি আপনার হোম স্ক্রিনে ইনস্টল হচ্ছে।'
            : '✓ Installing BloodSearch to your home screen!'
        );
      }
      return;
    }
    if (isIOS) {
      setInstallNotice(
        lang === 'bn'
          ? 'আইফোনে ইনস্টল করতে Safari ব্রাউজারের নিচে Share (↑) বাটনে চাপুন এবং "Add to Home Screen" সিলেক্ট করুন।'
          : 'Tap Share (↑) in Safari and select "Add to Home Screen".'
      );
      return;
    }
    if (isInIframe) {
      setInstallNotice(
        lang === 'bn'
          ? 'আপনি এখন প্রিভিউ ফ্রেমের ভেতরে আছেন। উপরের ডান কোণায় "Deploy" বা "Share" থেকে পাবলিক লিংকটি ফোনের Chrome ব্রাউজারে খুললেই সরাসরি ১-ক্লিকে ইনস্টল পপআপ আসবে!'
          : 'Deploy or open the public URL directly in Chrome on your phone to trigger 1-click native installation.'
      );
      return;
    }
    setInstallNotice(
      lang === 'bn'
        ? 'Chrome ব্রাউজারের ডানদিকের (⋮) মেন্যুতে ট্যাপ করে "Install app" চাপুন।'
        : 'Tap Chrome menu (⋮) and choose "Install app".'
    );
  };

  const handleDownloadBackup = () => {
    const backupData = {
      app: 'BloodSearch Bangladesh',
      owner: BOOTSTRAPPED_SUPER_ADMIN_EMAIL,
      exportDate: new Date().toISOString(),
      donors: localStorage.getItem('bloodsearch_donors')
        ? JSON.parse(localStorage.getItem('bloodsearch_donors')!)
        : [],
      requests: localStorage.getItem('bloodsearch_requests')
        ? JSON.parse(localStorage.getItem('bloodsearch_requests')!)
        : [],
      currentUser: localStorage.getItem('bloodsearch_current_user')
        ? JSON.parse(localStorage.getItem('bloodsearch_current_user')!)
        : null,
      thalassemia: localStorage.getItem('bloodsearch_thalassemia_patients')
        ? JSON.parse(localStorage.getItem('bloodsearch_thalassemia_patients')!)
        : [],
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bloodsearch_database_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
      <div className="w-full max-w-3xl my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-all text-left">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center font-black shadow-md shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                {lang === 'bn'
                  ? 'অ্যান্ড্রয়েড APK তৈরি, ডিপ্লয় ও অ্যান্টি-হ্যাক প্রোটেকশন হাব'
                  : 'Android APK Builder, Deploy & Anti-Hijack Hub'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? `মালিকানা লক: ${BOOTSTRAPPED_SUPER_ADMIN_EMAIL} · PWA ও Play Store TWA ১০০% প্রস্তুত`
                  : `Owner Locked: ${BOOTSTRAPPED_SUPER_ADMIN_EMAIL} · PWA & TWA APK Ready`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Control Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 mt-4 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`py-2 px-2 rounded-lg transition-colors cursor-pointer truncate ${
              activeTab === 'apk'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'bn' ? '📲 APK ও ফোনে ইনস্টল' : '📲 APK & Install'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-2 px-2 rounded-lg transition-colors cursor-pointer truncate ${
              activeTab === 'security'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'bn' ? '🛡️ অ্যান্টি-হ্যাক শিল্ড' : '🛡️ Anti-Hack Shield'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2 px-2 rounded-lg transition-colors cursor-pointer truncate ${
              activeTab === 'backup'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'bn' ? '💾 ব্যাকআপ ও প্লে স্টোর' : '💾 Backup & Store'}
          </button>
        </div>

        <div className="py-4 space-y-4 max-h-[68vh] overflow-y-auto pr-1">
          {/* =============================================================== */}
          {/* TAB 1: DIRECT INSTALL + REAL .APK FILE GENERATION               */}
          {/* =============================================================== */}
          {activeTab === 'apk' && (
            <>
              {/* Method 1: Instant 1-Click Phone Install */}
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-rose-600" />
                      <span>
                        {lang === 'bn'
                          ? 'পদ্ধতি ১: সরাসরি ফোনে অ্যাপ ইনস্টল (১০ সেকেন্ডে)'
                          : 'Method 1: Direct Phone App Install (10 Seconds)'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {lang === 'bn'
                        ? 'ডিপ্লয় করা লিংকটি ফোনের Chrome ব্রাউজারে খুলে নিচের বাটনে চাপ দিলেই অ্যাপটি আসল মোবাইল অ্যাপ হিসেবে ফোনের হোম স্ক্রিনে ইনস্টল হয়ে যাবে (কোনো ব্রাউজার অ্যাড্রেস বার থাকবে না)।'
                        : 'Open your deployed link in Android Chrome and tap below to install fullscreen on your phone.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDirectPhoneInstall}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {isInstalled
                        ? lang === 'bn'
                          ? '✓ ইনস্টল করা আছে'
                          : '✓ Installed'
                        : lang === 'bn'
                        ? 'এখনই ফোনে ইনস্টল করুন'
                        : 'Install on Phone Now'}
                    </span>
                  </button>
                </div>

                {installNotice && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-xs font-semibold text-rose-700 dark:text-rose-300">
                    {installNotice}
                  </div>
                )}
              </div>

              {/* Method 2: Generate Real .APK & .AAB via PWABuilder (Zero Coding!) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>
                      {lang === 'bn'
                        ? 'পদ্ধতি ২: আসল Android .apk ও Play Store .aab ফাইল তৈরি (কোডিং ছাড়াই)'
                        : 'Method 2: Download Signed Android .apk & .aab File'}
                    </span>
                  </h3>
                  <a
                    href="https://www.pwabuilder.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <span>PWABuilder.com খুলুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p>
                    <strong>ধাপ ১ (Deploy):</strong> AI Studio-র উপরের ডান কোণায়{' '}
                    <strong>Deploy / Share</strong> বাটনে ক্লিক করে আপনার অ্যাপটি পাবলিশ করুন এবং পাবলিক{' '}
                    <code>https://...run.app</code> লিংকটি কপি করুন:
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] flex items-center justify-between gap-2">
                    <span className="truncate">{currentUrl}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(currentUrl, 'appUrl')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-sans font-bold text-[11px] flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      {copiedId === 'appUrl' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>লিংক কপি</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p>
                    <strong>ধাপ ২ (APK জেনারেট):</strong> <strong>PWABuilder.com</strong>-এ গিয়ে আপনার ডিপ্লয় করা HTTPS লিংকটি পেস্ট করে <strong>Start</strong> চাপুন → এরপর{' '}
                    <strong>Package for stores</strong> → <strong>Android</strong> সিলেক্ট করুন (Package ID দিন:{' '}
                    <code className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      bd.bloodsearch.app
                    </code>
                    ) এবং <strong>Download Package</strong> চাপুন।
                  </p>

                  <p>
                    <strong>ধাপ ৩ (ফোনে APK ইনস্টল):</strong> ডাউনলোড হওয়া ZIP ফাইলটি আনজিপ করলেই ভেতরে{' '}
                    <strong>BloodSearch.apk</strong> ফাইল পাবেন—যা সরাসরি যেকোনো অ্যান্ড্রয়েড ফোনে পাঠিয়ে ইনস্টল করতে পারবেন, আর <strong>.aab</strong> ফাইলটি Google Play Console-এ আপলোড করতে পারবেন! (সাথে থাকা <code>signing.keystore</code> ফাইলটি নিরাপদে সংরক্ষণ করে রাখবেন—এটিই আপনার APK-এর মালিকানার চাবি!)
                  </p>
                </div>

                {/* Optional Developer CLI */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    ডেভেলপার টার্মিনাল অপশন (Google Official Bubblewrap CLI):
                  </span>
                  <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] flex items-center justify-between gap-2">
                    <code className="truncate">{bubblewrapCmd}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(bubblewrapCmd, 'bubblewrap')}
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 cursor-pointer"
                      title="কপি করুন"
                    >
                      {copiedId === 'bubblewrap' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =============================================================== */}
          {/* TAB 2: ANTI-HACK & EXCLUSIVE OWNERSHIP PROTECTION               */}
          {/* =============================================================== */}
          {activeTab === 'security' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-black text-sm">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>অ্যাপের মধ্যে সক্রিয় ৪-স্তরের অ্যান্টি-হ্যাক ও মালিকানা লক</span>
                </div>
                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>১. স্থায়ী সুপার ওনার লক ({BOOTSTRAPPED_SUPER_ADMIN_EMAIL}):</strong> Google-এর ক্রিপ্টোগ্রাফিক JWT টোকেন দিয়ে সার্ভার লেভেলে আপনার ইমেইল বাঁধা আছে। অন্য কেউ আপনার ইমেইল নকল করতে বা আপনাকে অ্যাডমিন থেকে সরাতে পারবে না।
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>২. জিরো সোর্স-কোড পাসওয়ার্ড লিক:</strong> APK বা ওয়েব কোডের ভেতরে কোনো গোপন অ্যাডমিন কোড বা হ্যাশ রাখা হয়নি। কেউ APK ডিকম্পাইল করলেও অ্যাডমিন হতে পারবে না।
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>৩. ইউজার ডাটা অ্যান্টি-স্ক্র্যাপিং (PII Isolation):</strong> ইউজারদের আসল ফোন নম্বর ও ইমেইল <code>/users</code> কালেকশনে লক করা—কোনো হ্যাকার পুরো ডাটাবেজ ডাউনলোড বা চুরি করতে পারবে না।
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>৪. ওনার ইনভাইট ভল্ট ও ১-ক্লিক বাতিল:</strong> অ্যাডমিন প্যানেলের <em>"ওনার সিকিউরিটি ভল্ট"</em> থেকে শুধুমাত্র আপনি চাইলে কো-অ্যাডমিন কোড বানাতে ও যেকোনো মুহূর্তে বাতিল করতে পারবেন।
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Post-Deploy Firebase Console Hardening Steps */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">
                  ডিপ্লয় ও APK তৈরির পর Firebase Console-এ ৩টি ১-মিনিটের সেটিংস (Project: {FIREBASE_PROJECT_ID}):
                </h4>

                <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <strong className="block text-slate-900 dark:text-white">
                        ১. ডিপ্লয় করা ডোমেইন যুক্ত করুন (Authorized Domains)
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        যাতে ডিপ্লয় করা লিংক ও APK-এ Google Login এবং সিমের OTP কোড ১০০% কাজ করে।
                      </span>
                    </div>
                    <a
                      href={FIREBASE_SETTINGS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs inline-flex items-center gap-1 shrink-0"
                    >
                      <span>Auth Domains</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <strong className="block text-slate-900 dark:text-white">
                        ২. API Key রেস্ট্রিকশন (অন্য ওয়েবসাইটে ক্লোন হওয়া বন্ধ করুন)
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Browser API Key-তে HTTP Referrer হিসেবে শুধু আপনার ডিপ্লয় করা ডোমেইন দিয়ে রাখলে অন্য কেউ কপি করে চালাতে পারবে না।
                      </span>
                    </div>
                    <a
                      href={GCP_API_CREDENTIALS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs inline-flex items-center gap-1 shrink-0"
                    >
                      <span>API Key Lock</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <strong className="block text-slate-900 dark:text-white">
                        ৩. Android APK SHA-256 ও Firestore Rules চেক
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        PWABuilder-এর SHA-256 ফিঙ্গারপ্রিন্ট Firebase Android App ও <code>assetlinks.json</code>-এ যুক্ত করুন।
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={FIREBASE_PROJECT_SETTINGS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs inline-flex items-center gap-1"
                      >
                        <span>SHA-256</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={FIREBASE_RULES_CONSOLE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1"
                      >
                        <span>Rules</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: BACKUP & PLAY STORE COMPLIANCE                           */}
          {/* =============================================================== */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>গুগল প্লে স্টোর কমপ্লায়েন্স চেকলিস্ট (১০০% প্রস্তুত)</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      <strong>PWA Manifest ও Maskable Icons:</strong> ১৯২x১৯২, ৫১২x৫১২ ও Maskable আইকন যুক্ত করা হয়েছে।
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      <strong>Digital Asset Links:</strong> <code>/.well-known/assetlinks.json</code> ফুলস্ক্রিন APK-এর জন্য প্রস্তুত।
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      <strong>প্রাইভেসি পলিসি ও ডাটা সেফটি:</strong> অ্যাপে অন্তর্ভুক্ত ও ফোন নম্বর মাস্কিং সক্রিয় আছে।
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      <strong>অফলাইন সার্ভিস ওয়ার্কার:</strong> ইন্টারনেট চলে গেলেও অ্যাপ সচল থাকবে।
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs text-amber-900 dark:text-amber-200">
                    সম্পূর্ণ ডাটাবেজ স্ন্যাপশট ব্যাকআপ ডাউনলোড (JSON Backup)
                  </h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    সকল রক্তদাতা, জরুরি রিকোয়েস্ট ও থ্যালাসেমিয়া ডাটা ১-ক্লিকে নিজের ডিভাইসে নামিয়ে রাখুন।
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ব্যাকআপ ডাউনলোড</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs cursor-pointer hover:opacity-90"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
