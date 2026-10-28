import React, { useEffect, useState, useCallback } from 'react';
import { Language } from '../../types';
import { subscribeRemoteAppUpdate, RemoteAppUpdateRelease } from '../../firebase';
import {
  CURRENT_APP_VERSION,
  DetectedBuildUpdate,
  subscribeDetectedBuildUpdate,
  checkForDeployedBuildUpdateNow,
  applySeamlessAppUpdateAndReload,
  compareSemver,
} from '../../utils/appUpdateManager';
import { RefreshCw, Download, Smartphone, CheckCircle2, X } from 'lucide-react';

interface AppUpdateBannerModalProps {
  lang: Language;
}

export const AppUpdateBannerModal: React.FC<AppUpdateBannerModalProps> = ({ lang }) => {
  const [buildUpdate, setBuildUpdate] = useState<DetectedBuildUpdate | null>(null);
  const [remoteRelease, setRemoteRelease] = useState<RemoteAppUpdateRelease | null>(null);
  const [dismissedSessionKey, setDismissedSessionKey] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [manualCheckFeedback, setManualCheckFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubBuild = subscribeDetectedBuildUpdate((upd) => {
      setBuildUpdate(upd);
    });
    const unsubRemote = subscribeRemoteAppUpdate((rel) => {
      setRemoteRelease(rel);
    });

    const handleManualCheck = async () => {
      setManualCheckFeedback(
        lang === 'bn' ? 'সার্ভারে নতুন আপডেট খোঁজা হচ্ছে...' : 'Checking server for updates...'
      );
      const result = await checkForDeployedBuildUpdateNow();
      const ackVer = localStorage.getItem('bloodsearch_ack_remote_version') || '';
      const hasUnseenRemote =
        Boolean(remoteRelease?.active) &&
        (compareSemver(remoteRelease!.version, CURRENT_APP_VERSION) > 0 ||
          ackVer !== remoteRelease!.version);

      if (result.updateAvailable || hasUnseenRemote) {
        setDismissedSessionKey(null);
        setManualCheckFeedback(null);
      } else {
        setManualCheckFeedback(
          lang === 'bn'
            ? `আপনার অ্যাপটি সর্বশেষ ভার্সনে (v${CURRENT_APP_VERSION}) আপডেটেড আছে।`
            : `You are running the latest version (v${CURRENT_APP_VERSION}).`
        );
        window.setTimeout(() => {
          setManualCheckFeedback(null);
        }, 3800);
      }
    };

    window.addEventListener('bloodsearch_manual_update_check', handleManualCheck);
    return () => {
      unsubBuild();
      unsubRemote();
      window.removeEventListener('bloodsearch_manual_update_check', handleManualCheck);
    };
  }, [lang, remoteRelease]);

  const ackedRemoteVersion = (() => {
    try {
      return localStorage.getItem('bloodsearch_ack_remote_version') || '';
    } catch {
      return '';
    }
  })();

  const remoteIsNewerVersion =
    Boolean(remoteRelease?.active) &&
    compareSemver(remoteRelease!.version, CURRENT_APP_VERSION) > 0;

  const remoteNeedsPrompt =
    Boolean(remoteRelease?.active) &&
    (remoteIsNewerVersion || ackedRemoteVersion !== remoteRelease!.version);

  const hasAnyUpdate = Boolean(buildUpdate?.available) || remoteNeedsPrompt;
  const isMandatory =
    Boolean(remoteRelease?.active) &&
    remoteRelease?.mode === 'REQUIRED' &&
    remoteNeedsPrompt;

  const displayVersion = remoteNeedsPrompt
    ? remoteRelease!.version
    : buildUpdate?.latestVersion || CURRENT_APP_VERSION;

  const sessionKey = `${displayVersion}-${buildUpdate?.latestBuildId || 'remote'}`;

  const handleApplyUpdate = useCallback(async () => {
    setIsApplying(true);
    await applySeamlessAppUpdateAndReload(remoteRelease?.version || displayVersion);
  }, [remoteRelease?.version, displayVersion]);

  if (manualCheckFeedback && !hasAnyUpdate) {
    return (
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-50 max-w-sm rounded-2xl bg-slate-900 dark:bg-slate-800 text-white border border-slate-700 px-4 py-3 shadow-xl flex items-center gap-2.5 text-xs font-semibold">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>{manualCheckFeedback}</span>
      </div>
    );
  }

  if (!hasAnyUpdate) return null;
  if (!isMandatory && dismissedSessionKey === sessionKey) return null;

  const changelogText = remoteNeedsPrompt
    ? remoteRelease!.changelog
    : lang === 'bn'
    ? 'অ্যাপের নতুন ডিপ্লয়মেন্ট ও সর্বশেষ ফিচার আপডেট পাওয়া গেছে। ১-ট্যাপে আপডেট করে নিন।'
    : 'A newly deployed version with latest updates is ready. Tap Update Now to refresh.';

  // 1. Mandatory Full-Screen APK / System Update Dialog
  if (isMandatory) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl text-left space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                {lang === 'bn'
                  ? `জরুরি অ্যাপ আপডেট · v${displayVersion}`
                  : `Required Update · v${displayVersion}`}
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug mt-0.5">
                {lang === 'bn'
                  ? 'নতুন ভার্সনে আপডেট করা প্রয়োজন'
                  : 'Please Update to Continue'}
              </h3>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <div className="font-bold text-slate-900 dark:text-white mb-1">
              {lang === 'bn' ? 'এই আপডেটে যা থাকছে:' : 'What is new in this release:'}
            </div>
            <p className="whitespace-pre-line">{changelogText}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <button
              type="button"
              disabled={isApplying}
              onClick={handleApplyUpdate}
              className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl btn-crimson font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 shrink-0 ${isApplying ? 'animate-spin' : ''}`} />
              <span>
                {isApplying
                  ? lang === 'bn'
                    ? 'আপডেট হচ্ছে...'
                    : 'Updating...'
                  : lang === 'bn'
                  ? 'এখনই আপডেট করুন'
                  : 'Update App Now'}
              </span>
            </button>

            {remoteRelease?.apkUrl && (
              <a
                href={remoteRelease.apkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[46px] px-4 py-2.5 rounded-xl btn-emerald font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{lang === 'bn' ? 'নতুন .APK ডাউনলোড' : 'Download .APK'}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Non-Blocking APK/Play-Store Style Floating Update Card (Auto Deploy or Optional Push)
  return (
    <div className="fixed bottom-20 lg:bottom-5 left-3 right-3 sm:left-auto sm:right-5 sm:w-[400px] z-50 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/95 dark:border-slate-700/90 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.16)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.55)] text-left space-y-3">
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
              {lang === 'bn'
                ? `নতুন আপডেট প্রস্তুত · v${displayVersion}`
                : `New Update Ready · v${displayVersion}`}
            </div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug mt-0.5">
              {lang === 'bn'
                ? 'অ্যাপের নতুন ভার্সন পাওয়া গেছে'
                : 'A New App Version is Available'}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed line-clamp-3">
              {changelogText}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissedSessionKey(sessionKey)}
          className="min-h-[34px] min-w-[34px] rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer shrink-0"
          aria-label="Later"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          disabled={isApplying}
          onClick={handleApplyUpdate}
          className="flex-1 min-h-[42px] px-3.5 py-2 rounded-xl btn-crimson font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isApplying ? 'animate-spin' : ''}`} />
          <span>
            {isApplying
              ? lang === 'bn'
                ? 'আপডেট হচ্ছে...'
                : 'Updating...'
              : lang === 'bn'
              ? 'এখনই আপডেট করুন'
              : 'Update Now'}
          </span>
        </button>

        {remoteRelease?.apkUrl && (
          <a
            href={remoteRelease.apkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[42px] px-3 py-2 rounded-xl btn-emerald font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>.APK</span>
          </a>
        )}

        <button
          type="button"
          onClick={() => setDismissedSessionKey(sessionKey)}
          className="min-h-[42px] px-3 py-2 rounded-xl btn-surface font-semibold text-xs cursor-pointer whitespace-nowrap shrink-0"
        >
          {lang === 'bn' ? 'পরে' : 'Later'}
        </button>
      </div>
    </div>
  );
};
