import React, { useState } from 'react';
import { BloodRequest, BloodGroup, UrgencyLevel, Language } from '../types';
import { ALL_BLOOD_GROUPS } from '../data/compatibility';
import { DISTRICTS } from '../data/bangladeshGeo';
import { getTranslation } from '../utils/translations';
import { 
  Flame, 
  MapPin, 
  Phone, 
  Clock, 
  Users, 
  Share2, 
  UserCheck, 
  Plus, 
  CheckCircle, 
  AlertCircle,
  Hospital
} from 'lucide-react';

interface RequestsFeedProps {
  requests: BloodRequest[];
  lang: Language;
  onOpenSOSModal: () => void;
  onRespondToRequest: (requestId: string, responderName: string, responderPhone: string, group: BloodGroup, note?: string) => void;
}

export const RequestsFeed: React.FC<RequestsFeedProps> = ({
  requests,
  lang,
  onOpenSOSModal,
  onRespondToRequest,
}) => {
  const t = getTranslation(lang);

  const [selectedGroup, setSelectedGroup] = useState<BloodGroup | 'ALL'>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel | 'ALL'>('ALL');
  const [respondingToReq, setRespondingToReq] = useState<BloodRequest | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorGroup, setDonorGroup] = useState<BloodGroup>('O-');
  const [arrivalNote, setArrivalNote] = useState('');
  const [shareSuccessId, setShareSuccessId] = useState<string | null>(null);

  const filteredRequests = requests.filter((req) => {
    if (selectedGroup !== 'ALL' && req.bloodGroup !== selectedGroup) return false;
    if (selectedUrgency !== 'ALL' && req.urgency !== selectedUrgency) return false;
    return true;
  });

  const handleStartResponding = (req: BloodRequest) => {
    setRespondingToReq(req);
    setDonorGroup(req.bloodGroup);
  };

  const handleConfirmResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingToReq || !donorName || !donorPhone) return;

    onRespondToRequest(
      respondingToReq.id,
      donorName,
      donorPhone,
      donorGroup,
      arrivalNote || 'আমি রক্ত দিতে প্রস্তুত আছি।'
    );

    setRespondingToReq(null);
    setDonorName('');
    setDonorPhone('');
    setArrivalNote('');
  };

  const handleShare = (req: BloodRequest) => {
    const shareText = `🚨 জরুরি রক্তের আবেদন! ${req.bloodGroup} রক্ত প্রয়োজন ${req.hospitalName} এ। রোগী: ${req.patientName}। যোগাযোগ: ${req.contactPhone}`;
    if (navigator.share) {
      navigator.share({ title: 'BloodSearch SOS', text: shareText, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      setShareSuccessId(req.id);
      setTimeout(() => setShareSuccessId(null), 2000);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Feed Header */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 sm:p-4.5 transition-all shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {t.navRequestsFeed}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              {lang === 'bn'
                ? 'সরাসরি হাসপাতাল ও রোগীর স্বজনদের সক্রিয় রক্তের আবেদন'
                : 'Real-time emergency blood requests directly from hospitals & families'}
            </p>
          </div>

          <button
            onClick={onOpenSOSModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createSosTitle}</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="pt-4 flex flex-wrap items-center gap-3">
          {/* Blood Group Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedGroup('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedGroup === 'ALL'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t.allBloodGroups}
            </button>
            {ALL_BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                onClick={() => setSelectedGroup(bg)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  selectedGroup === bg
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center gap-1.5 ml-auto">
            {(['ALL', 'CRITICAL', 'URGENT'] as (UrgencyLevel | 'ALL')[]).map((urg) => (
              <button
                key={urg}
                onClick={() => setSelectedUrgency(urg)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                  selectedUrgency === urg
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {urg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.map((req) => {
          const districtObj = DISTRICTS.find((d) => d.id === req.district);
          const districtName = districtObj ? (lang === 'bn' ? districtObj.nameBn : districtObj.nameEn) : req.district;
          const upazilaObj = districtObj?.upazilas.find((u) => u.id === req.upazila);
          const upazilaName = upazilaObj ? (lang === 'bn' ? upazilaObj.nameBn : upazilaObj.nameEn) : req.upazila;

          return (
            <div
              key={req.id}
              className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 sm:p-4.5 transition-all hover:border-rose-500 shadow-sm space-y-3.5"
            >
              {/* Card Top: Group, Urgency & Time */}
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 flex flex-col items-center justify-center text-white font-black text-lg shadow-md shadow-rose-600/30 shrink-0">
                    <span>{req.bloodGroup}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {req.patientName}
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        ({req.patientAge} {lang === 'bn' ? 'বছর' : 'y'})
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                          req.urgency === 'CRITICAL'
                            ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/20'
                            : req.urgency === 'URGENT'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {req.urgency}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{req.createdAt}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-rose-600 dark:text-rose-400 truncate">
                        {req.requiredDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Units Needed Indicator */}
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {lang === 'bn' ? 'প্রয়োজন' : 'Needed'}
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {req.unitsCollected}/{req.unitsNeeded}{' '}
                    <span className="text-[10px] font-normal text-slate-500">{lang === 'bn' ? 'ব্যাগ' : 'bags'}</span>
                  </div>
                </div>
              </div>

              {/* Location & Hospital Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/70 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 min-w-0">
                  <Hospital className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="font-medium truncate">{req.hospitalName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 min-w-0">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                  <span className="truncate">{upazilaName}, {districtName}</span>
                </div>
              </div>

              {/* Medical Reason */}
              {req.reason && (
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'কারণ: ' : 'Reason: '}
                  </span>
                  {req.reason}
                </p>
              )}

              {/* Live Responders Section */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      {req.responders.length > 0
                        ? `${req.responders.length} ${t.respondersCount}`
                        : t.noRespondersYet}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {lang === 'bn' ? 'যোগাযোগ:' : 'Contact:'} {req.contactPhone}
                  </span>
                </div>

                {req.responders.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {req.responders.map((resp) => (
                      <div
                        key={resp.id}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-semibold">{resp.name}</span>
                        <span className="text-[10px] text-slate-400">({resp.timestamp})</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Symmetrical 3-Button Grid: Donate, Direct Call, and Share */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    onClick={() => handleStartResponding(req)}
                    className="min-h-[40px] px-2 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.iCanDonate}</span>
                  </button>

                  <a
                    href={`tel:${req.contactPhone}`}
                    className="min-h-[40px] px-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{lang === 'bn' ? 'সরাসরি কল' : 'Call'}</span>
                  </a>

                  <button
                    onClick={() => handleShare(req)}
                    className="min-h-[40px] px-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{shareSuccessId === req.id ? (lang === 'bn' ? 'কপি হয়েছে' : 'Copied!') : (lang === 'bn' ? 'শেয়ার' : 'Share')}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Responder Modal */}
      {respondingToReq && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
          <div className="w-full max-w-md my-2 sm:my-auto rounded-2xl bg-white dark:bg-[#1e293b] p-5 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-all space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {lang === 'bn' ? 'রক্তদানে সাড়া দিন' : 'Step Forward to Donate'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {respondingToReq.patientName} · {respondingToReq.bloodGroup}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRespondingToReq(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmResponse} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'আপনার নাম' : 'Your Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: তানভীর আহমেদ"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'আপনার মোবাইল নম্বর' : 'Your Phone Number'} *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+88017XXXXXXXX"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'আপনার রক্তের গ্রুপ' : 'Your Blood Group'}
                </label>
                <select
                  value={donorGroup}
                  onChange={(e) => setDonorGroup(e.target.value as BloodGroup)}
                  className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {ALL_BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'বার্তা বা পৌঁছানোর আনুমানিক সময়' : 'Arrival / Availability Note'}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ৩০ মিনিটের মধ্যে হাসপাতালে আসছি"
                  value={arrivalNote}
                  onChange={(e) => setArrivalNote(e.target.value)}
                  className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[46px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'নিশ্চিত করুন ও নাম যোগ করুন' : 'Confirm & Volunteer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
