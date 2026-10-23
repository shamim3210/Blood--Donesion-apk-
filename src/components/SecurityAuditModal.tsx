import React from 'react';
import { AuditLogEntry, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { ShieldCheck, Lock, Key, Terminal, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SecurityAuditModalProps {
  logs: AuditLogEntry[];
  lang: Language;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({ logs, lang }) => {
  const t = getTranslation(lang);

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-5 sm:p-6 transition-all shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t.auditLogTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              {t.auditLogDesc}
            </p>
          </div>
        </div>

        {/* Security Controls Overview Grid */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>{lang === 'bn' ? 'ফোন নম্বর মাস্কিং' : 'Phone Masking'}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'অনাকাঙ্ক্ষিত স্প্যাম ও হয়রানি রোধে রক্তদাতার নম্বর গোপন রাখা হয়।'
                : 'Direct scrapers prevented; contacts revealed only upon explicit audit consent.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <Key className="w-4 h-4 text-blue-500" />
              <span>{lang === 'bn' ? 'অডিট ট্রেইল লগিং' : 'Cryptographic Audit Trail'}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'প্রতিটি নম্বর দেখার রেকর্ড নিরাপত্তা হ্যাশ ও টাইমস্ট্যাম্পসহ সংরক্ষিত।'
                : 'Each reveal is cryptographically tagged to detect abnormal bulk querying.'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>{lang === 'bn' ? 'স্প্যাম ও ডস প্রটেকশন' : 'Rate Limiting & Spam Shield'}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
              {lang === 'bn'
                ? 'জরুরি রিকোয়েস্টে ফেক কল ও বট আক্রমণ প্রতিহত করার ফিল্টার।'
                : 'Enforces rate limits and client integrity verification on SOS broadcasts.'}
            </p>
          </div>
        </div>
      </div>

      {/* Live Audit Log Stream */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-rose-500" />
            <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              {lang === 'bn' ? 'সাম্প্রতিক নিরাপত্তা ও অ্যাকশন লগ' : 'Real-Time Security & Action Log'}
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {logs.length} {lang === 'bn' ? 'টি এন্ট্রি' : 'entries recorded'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'বিস্তারিত' : 'Details'}</th>
                <th className="py-2.5 px-3 font-semibold">{lang === 'bn' ? 'সময়' : 'Timestamp'}</th>
                <th className="py-2.5 px-3 font-semibold font-mono">{lang === 'bn' ? 'সিকিউরিটি হ্যাশ' : 'Integrity Hash'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'UNMASK_PHONE'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          : log.action === 'CREATE_SOS'
                          ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-800 dark:text-slate-200">
                    {log.targetDetails}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 text-[11px]">
                    {log.securityHash}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
