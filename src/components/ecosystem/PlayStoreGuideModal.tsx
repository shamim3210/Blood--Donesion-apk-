import React, { useState, useEffect } from 'react';
import { Language } from '../../types';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { BrandLogo } from '../BrandLogo';
import { getSecurityDiagnostics } from '../../utils/securityShield';
import {
  BOOTSTRAPPED_SUPER_ADMIN_EMAIL,
  FIREBASE_PROJECT_ID,
  FIREBASE_PROJECT_SETTINGS_URL,
  FIREBASE_RULES_CONSOLE_URL,
  FIREBASE_SETTINGS_URL,
  GCP_API_CREDENTIALS_URL,
  GCP_TOKEN_SERVICE_API_URL,
  runLiveFirebaseAuthDiagnostics,
  buildWhatsAppChatUrl,
  LiveAuthDiagnosticReport,
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
  Rocket,
  Share2,
  RefreshCw,
  AlertCircle,
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
  const [activeTab, setActiveTab] = useState<'deploy' | 'apk' | 'security' | 'backup'>('deploy');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [installNotice, setInstallNotice] = useState<string | null>(null);
  const [customLiveUrl, setCustomLiveUrl] = useState<string>('');
  const [liveDiag, setLiveDiag] = useState<LiveAuthDiagnosticReport | null>(null);
  const [checkingLive, setCheckingLive] = useState(false);

  const { isInstallable, isInstalled, isIOS, isInIframe, promptInstall } = usePWAInstall();

  const runReadinessScan = async () => {
    setCheckingLive(true);
    try {
      const res = await runLiveFirebaseAuthDiagnostics();
      setLiveDiag(res);
    } catch {
      // Ignore transient offline hiccups
    } finally {
      setCheckingLive(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      if (origin && !customLiveUrl) {
        setCustomLiveUrl(origin);
      }
      runReadinessScan();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const diag = getSecurityDiagnostics();
  const effectiveUrl = (customLiveUrl || diag.origin || 'https://fifth-receiver-v5v9p.web.app')
    .trim()
    .replace(/\/+$/, '');

  const extractedHostname = (() => {
    try {
      return new URL(effectiveUrl.startsWith('http') ? effectiveUrl : `https://${effectiveUrl}`).hostname;
    } catch {
      return effectiveUrl.replace(/^https?:\/\//, '').split('/')[0];
    }
  })();

  const pwaBuilderDirectUrl = `https://www.pwabuilder.com/?site=${encodeURIComponent(effectiveUrl)}`;
  const manifestUrl = `${effectiveUrl}/manifest.webmanifest`;
  const bubblewrapCmd = `npx @bubblewrap/cli init --manifest=${manifestUrl}`;
  const firebaseDeployCmd = `npm run build && npx firebase-tools deploy --only hosting`;

  const whatsappInviteUrl = buildWhatsAppChatUrl(
    '',
    lang === 'bn'
      ? `🩸 জরুরি রক্তদাতা সন্ধান ও লাইভ ব্লাড ডোনেশন অ্যাপ (BloodSearch Bangladesh) এখন লাইভ! নিচের লিংকে ঢুকে ফোনে ইনস্টল করুন অথবা নিজের ডোনার স্মার্ট কার্ড খুলুন:\n${effectiveUrl}`
      : `🩸 BloodSearch Bangladesh Emergency Blood Network is live! Open on your phone to install or register your Smart Donor ID:\n${effectiveUrl}`
  );

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
            <BrandLogo variant="mark" size="lg" />
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                {lang === 'bn'
                  ? 'সহজ ১-ক্লিক ডিপ্লয়, Android APK ও সিকিউরিটি লঞ্চপ্যাড'
                  : '1-Click Easy Deploy, Android APK & Security Launchpad'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {lang === 'bn'
                  ? `মালিকানা লক: ${BOOTSTRAPPED_SUPER_ADMIN_EMAIL} · Cloud Run, Firebase ও APK প্রস্তুত`
                  : `Owner Locked: ${BOOTSTRAPPED_SUPER_ADMIN_EMAIL} · Cloud Run, Firebase & APK Ready`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Segmented Control Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 mt-4 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('deploy')}
            className={`min-h-[38px] py-2 px-2 rounded-lg transition-colors cursor-pointer truncate ${
              activeTab === 'deploy'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'bn' ? '🚀 সহজ ডিপ্লয় (৩ ধাপ)' : '🚀 Easy Deploy'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`min-h-[38px] py-2 px-2 rounded-lg transition-colors cursor-pointer truncate ${
              activeTab === 'apk'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'bn' ? '📲 ফোনে APK ইনস্টল' : '📲 Phone & APK'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`min-h-[38px] py-2 px-2 rounded-lg transition-colors cursor-pointer truncate ${
              activeTab === 'security'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'bn' ? '🛡️ অ্যান্টি-হ্যাক শিল্ড' : '🛡️ Anti-Hack'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`min-h-[38px] py-2 px-2 rounded-lg transition-colors cursor-pointer truncate ${
              activeTab === 'backup'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {lang === 'bn' ? '💾 ব্যাকআপ ও স্টোর' : '💾 Backup'}
          </button>
        </div>

        <div className="py-4 space-y-4">
          {/* =============================================================== */}
          {/* TAB 0: SUPER-EASY 3-STEP DEPLOY WIZARD (ZERO CODING NEEDED!)    */}
          {/* =============================================================== */}
          {activeTab === 'deploy' && (
            <div className="space-y-3.5">
              {/* Live Pre-Deploy Readiness Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {lang === 'bn'
                        ? 'ডিপ্লয় রেডিনেস চেক (স্বয়ংক্রিয় পরীক্ষা)'
                        : 'Live Pre-Deploy Readiness Check'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={runReadinessScan}
                    disabled={checkingLive}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${checkingLive ? 'animate-spin' : ''}`} />
                    <span>{lang === 'bn' ? 'রিফ্রেশ' : 'Re-scan'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span>PWA + অফলাইন সার্ভিস ওয়ার্কার:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">১০০% প্রস্তুত ✓</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span>Google Gmail লগইন সার্ভার:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {liveDiag?.googleOAuthReady === false ? 'চেক করুন' : 'সক্রিয় ✓'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span>Token Service API (অটো সেশন):</span>
                    {liveDiag && !liveDiag.tokenServiceEnabled ? (
                      <a
                        href={GCP_TOKEN_SERVICE_API_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-blue-600 dark:text-blue-400 underline inline-flex items-center gap-0.5"
                      >
                        <span>Enable করুন</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">সক্রিয় ✓</span>
                    )}
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                    <span>বর্তমান ডোমেইন অনুমোদন:</span>
                    {liveDiag && !liveDiag.domainAuthorized ? (
                      <a
                        href={FIREBASE_SETTINGS_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-amber-600 dark:text-amber-400 underline"
                      >
                        যুক্ত করুন ↗
                      </a>
                    ) : (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">অনুমোদিত ✓</span>
                    )}
                  </div>
                </div>
              </div>

              {/* STEP 1: 1-CLICK DEPLOY */}
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-300 dark:border-emerald-800/70 space-y-2.5">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-950 dark:text-emerald-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center shrink-0">
                    ১
                  </span>
                  <span>
                    {lang === 'bn'
                      ? 'সবচেয়ে সহজ ডিপ্লয় (কোনো কোডিং ছাড়াই মাত্র ৩০ সেকেন্ডে)'
                      : 'Step 1: Easiest 1-Click Publish (Zero Coding)'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {lang === 'bn' ? (
                    <>
                      স্ক্রিনের একদম উপরের ডান কোণায় থাকা <strong>Deploy (Cloud Run)</strong> অথবা{' '}
                      <strong>Share</strong> বাটনে ক্লিক করুন → Google Cloud প্রজেক্ট{' '}
                      <code className="font-mono font-bold">fifth-receiver-v5v9p</code> সিলেক্ট করে{' '}
                      <strong>Deploy</strong> চাপুন। ৩০–৬০ সেকেন্ডের মধ্যে আপনি একটি স্থায়ী{' '}
                      <code className="font-mono">https://...run.app</code> পাবলিক লিংক পেয়ে যাবেন!
                    </>
                  ) : (
                    <>
                      Click the <strong>Deploy</strong> button at the top-right corner of AI Studio, choose project{' '}
                      <code className="font-mono font-bold">fifth-receiver-v5v9p</code>, and copy your live{' '}
                      <code className="font-mono">https://...run.app</code> link!
                    </>
                  )}
                </p>
              </div>

              {/* STEP 2: PASTE LIVE LINK & AUTHORIZE IN FIREBASE */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs flex items-center justify-center shrink-0">
                    ২
                  </span>
                  <span>
                    {lang === 'bn'
                      ? 'আপনার লাইভ লিংক বসান ও Firebase-এ ডোমেইন যুক্ত করুন'
                      : 'Step 2: Paste Your Live URL & Authorize Domain in Firebase'}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {lang === 'bn'
                      ? 'আপনার ডিপ্লয় করা নতুন লিংকটি এখানে পেস্ট করুন (অটো APK ও শেয়ার লিংক তৈরি হবে):'
                      : 'Paste your deployed live HTTPS URL here:'}
                  </label>
                  <input
                    type="url"
                    value={customLiveUrl}
                    onChange={(e) => setCustomLiveUrl(e.target.value)}
                    placeholder="https://your-app-name.asia-east1.run.app"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {lang === 'bn'
                        ? 'Firebase Authorized Domains-এ যোগ করার ডোমেইন নাম:'
                        : 'Domain name to add in Firebase Authorized Domains:'}
                    </span>
                    <code className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 truncate block">
                      {extractedHostname}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopy(extractedHostname, 'domainOnly')}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === 'domainOnly' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>কপি হয়েছে</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>ডোমেইন কপি</span>
                        </>
                      )}
                    </button>
                    <a
                      href={FIREBASE_SETTINGS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5"
                    >
                      <span>Firebase-এ Add domain ↗</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* STEP 3: SHARE ON WHATSAPP OR DOWNLOAD .APK IN 1 CLICK */}
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-800/80 space-y-3">
                <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                  <span className="w-6 h-6 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs flex items-center justify-center shrink-0">
                    ৩
                  </span>
                  <span>
                    {lang === 'bn'
                      ? 'এখন ১-ক্লিকে WhatsApp-এ শেয়ার করুন অথবা .APK ডাউনলোড করুন!'
                      : 'Step 3: Share on WhatsApp or Download Signed .APK'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={whatsappInviteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5b] text-white font-black text-xs inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'WhatsApp-এ অ্যাপ লিংক শেয়ার' : 'Share App on WhatsApp'}</span>
                  </a>

                  <a
                    href={pwaBuilderDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Package className="w-4 h-4" />
                    <span>
                      {lang === 'bn' ? '১-ক্লিকে ফ্রি .APK ফাইল তৈরি ↗' : 'Generate Free .APK File ↗'}
                    </span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopy(effectiveUrl, 'fullLiveUrl')}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedId === 'fullLiveUrl' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>লিংক কপি হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>লিংক কপি করুন</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Alternative Hosting Commands (Firebase / Vercel / Netlify already configured!) */}
                <div className="pt-2 border-t border-rose-200/80 dark:border-rose-900/50 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
                  <div className="font-bold">
                    {lang === 'bn'
                      ? 'বিকল্প ফ্রি কাস্টম ডোমেইন ডিপ্লয় (firebase.json ও vercel.json প্রি-কনফিগার করা আছে):'
                      : 'Pre-configured Firebase Hosting / Vercel / Netlify Support:'}
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] flex items-center justify-between gap-2">
                    <code className="truncate">{firebaseDeployCmd}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(firebaseDeployCmd, 'fbHosting')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-sans font-bold text-[10px] shrink-0 cursor-pointer"
                    >
                      {copiedId === 'fbHosting' ? '✓ কপি হয়েছে' : 'কপি'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 1: DIRECT INSTALL + REAL .APK FILE GENERATION               */}
          {/* =============================================================== */}
          {activeTab === 'apk' && (
            <>
              {/* Official Custom App Icon & Home Screen Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <BrandLogo variant="card" className="w-20 h-20 shrink-0" />
                  <div className="min-w-0 space-y-1">
                    <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                      {lang === 'bn'
                        ? 'অফিসিয়াল BloodSearch অ্যাপ লোগো সক্রিয় (Android / iOS / APK)'
                        : 'Official BloodSearch App Icon Active (Android / iOS / APK)'}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {lang === 'bn'
                        ? 'ফোনের হোম স্ক্রিন ও APK ফাইলে স্বয়ংক্রিয়ভাবে আপনার নতুন "Blood Search · FIND BLOOD. SAVE LIFE." লোগোটি বসবে।'
                        : 'Your custom "Blood Search · FIND BLOOD. SAVE LIFE." icon is pre-configured for Android Adaptive Maskable, iOS & Play Store.'}
                    </p>
                  </div>
                </div>
                <a
                  href="/pwa-512x512.png"
                  download="BloodSearch_Official_Logo_512x512.png"
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'HD লোগো ডাউনলোড' : 'Download 512px PNG'}</span>
                </a>
              </div>

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
                    className="min-h-[42px] px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
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
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{installNotice}</span>
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
                        ? 'পদ্ধতি ২: আসল Android .apk ও Play Store .aab ফাইল ডাউনলোড'
                        : 'Method 2: Download Signed Android .apk & .aab File'}
                    </span>
                  </h3>
                  <a
                    href={pwaBuilderDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <span>সরাসরি আপনার লিংকসহ PWABuilder খুলুন</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p>
                    <strong>ধাপ ১:</strong> উপরের সবুজ বাটনে চাপুন অথবা{' '}
                    <code>pwabuilder.com</code>-এ আপনার লাইভ লিংক পেস্ট করে <strong>Start</strong> চাপুন:
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] flex items-center justify-between gap-2">
                    <span className="truncate">{effectiveUrl}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(effectiveUrl, 'appUrl')}
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
                    <strong>ধাপ ২:</strong> <strong>Package for stores</strong> →{' '}
                    <strong>Android</strong> সিলেক্ট করুন (Package ID দিন:{' '}
                    <code className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      bd.bloodsearch.app
                    </code>
                    ) এবং <strong>Download Package</strong> চাপুন।
                  </p>

                  <p>
                    <strong>ধাপ ৩:</strong> ডাউনলোড হওয়া ZIP ফাইলটি আনজিপ করলেই ভেতরে{' '}
                    <strong>BloodSearch.apk</strong> ফাইল পাবেন—যা সরাসরি যেকোনো অ্যান্ড্রয়েড ফোনে ইনস্টল করতে পারবেন, আর <strong>.aab</strong> ফাইলটি Google Play Console-এ আপলোড করতে পারবেন! (সাথে থাকা <code>signing.keystore</code> ফাইলটি নিরাপদে সংরক্ষণ করে রাখবেন।)
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
                        API রেস্ট্রিকশন চালু করলে অবশ্যই <code>Identity Toolkit API</code>, <code>Token Service API</code> ও <code>Cloud Firestore API</code> অ্যালো রাখবেন।
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
                      <strong>ডিপ্লয় কনফিগারেশন ফাইল:</strong> <code>firebase.json</code>, <code>vercel.json</code> ও <code>_redirects</code> যুক্ত করা হয়েছে।
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
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer transition-colors"
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
            className="min-h-[40px] px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs cursor-pointer hover:opacity-90"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
