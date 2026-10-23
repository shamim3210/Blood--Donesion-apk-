import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, WifiOff } from 'lucide-react';
import { Language } from '../../types';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PwaInstallPromptProps {
  lang: Language;
  onOpenApkGuide?: () => void;
}

export const PwaInstallPrompt: React.FC<PwaInstallPromptProps> = ({ lang, onOpenApkGuide }) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, isOnline, promptInstall } =
    usePWAInstall();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('bloodsearch_pwa_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [installHint, setInstallHint] = useState<string | null>(null);

  useEffect(() => {
    if (isInstalled) {
      setInstallHint(null);
    }
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        setDismissed(true);
      }
      return;
    }

    if (isIOS) {
      setInstallHint(
        lang === 'bn'
          ? 'আইফোনে ইনস্টল করতে Safari ব্রাউজারের Share (↑) বাটনে ট্যাপ করে "Add to Home Screen" বেছে নিন।'
          : 'On iPhone/iPad: Tap the Safari Share button and select "Add to Home Screen".'
      );
      return;
    }

    if (isInIframe && onOpenApkGuide) {
      onOpenApkGuide();
      return;
    }

    setInstallHint(
      lang === 'bn'
        ? 'ফোনে ইনস্টল করতে ব্রাউজারের মেন্যু (⋮) থেকে "Install App" বা "Add to Home Screen" চাপুন।'
        : 'Open browser menu (⋮) and tap "Install App" or "Add to Home Screen".'
    );
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('bloodsearch_pwa_dismissed', 'true');
    } catch {}
  };

  const shouldShowBanner = !isInstalled && !dismissed && (isInstallable || isIOS);

  return (
    <>
      {/* Offline Connectivity Indicator */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 inset-x-0 z-50 bg-amber-600 text-white py-1.5 px-3 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-md"
        >
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>
            {lang === 'bn'
              ? 'ইন্টারনেট সংযোগ নেই · অফলাইন মোডে সংরক্ষিত ডোনার ও জরুরি তথ্য চালু আছে'
              : 'You are offline · Cached donor directory remains accessible'}
          </span>
        </div>
      )}

      {/* 1-Tap Native Install Banner */}
      {shouldShowBanner && (
        <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-4 z-40 sm:max-w-sm bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-700 shadow-2xl space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center shrink-0 shadow-md">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-white leading-tight">
                  {lang === 'bn' ? 'BloodSearch অ্যাপ ফোনে ইনস্টল করুন' : 'Install BloodSearch App'}
                </h4>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {lang === 'bn'
                    ? 'হোম স্ক্রিন থেকে ১-ট্যাপে ফুলস্ক্রিন APK স্টাইলে ব্যবহার করুন'
                    : 'Fast fullscreen access on your phone home screen'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                <span>{lang === 'bn' ? 'ইনস্টল' : 'Install'}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close install banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {installHint && (
            <p className="text-[11px] text-amber-300 font-medium border-t border-slate-800 pt-1.5">
              {installHint}
            </p>
          )}
        </div>
      )}
    </>
  );
};
