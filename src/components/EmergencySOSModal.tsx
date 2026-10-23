import React, { useState } from 'react';
import { BloodGroup, UrgencyLevel, BloodRequest, Language } from '../types';
import { ALL_BLOOD_GROUPS } from '../data/compatibility';
import { DIVISIONS, DISTRICTS } from '../data/bangladeshGeo';
import { getTranslation } from '../utils/translations';
import { 
  Flame, 
  X, 
  Send, 
  MapPin, 
  Hospital, 
  Phone, 
  AlertCircle, 
  Share2, 
  Check, 
  MessageSquare,
  Clock
} from 'lucide-react';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSubmitSOS: (newRequest: BloodRequest) => void;
  onLogAudit: (action: 'CREATE_SOS', details: string) => void;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSubmitSOS,
  onLogAudit,
}) => {
  const t = getTranslation(lang);

  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>(32);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O-');
  const [unitsNeeded, setUnitsNeeded] = useState<number>(2);
  const [hospitalName, setHospitalName] = useState('');
  const [division, setDivision] = useState('dhaka');
  const [district, setDistrict] = useState('dhaka');
  const [upazila, setUpazila] = useState('shahbagh');
  const [urgency, setUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [requiredDate, setRequiredDate] = useState('আজকের মধ্যে (Urgent)');
  const [reason, setReason] = useState('');
  const [submittedRequest, setSubmittedRequest] = useState<BloodRequest | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen) return null;

  // Filter districts by division
  const currentDistricts = DISTRICTS.filter((d) => d.divisionId === division);
  const selectedDistrictObj = DISTRICTS.find((d) => d.id === district);
  const currentUpazilas = selectedDistrictObj ? selectedDistrictObj.upazilas : [];

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !hospitalName || !contactPhone) return;

    const newReq: BloodRequest = {
      id: `sos-${Date.now()}`,
      patientName,
      patientAge: Number(patientAge) || 30,
      bloodGroup,
      unitsNeeded: Number(unitsNeeded) || 1,
      unitsCollected: 0,
      hospitalName,
      division,
      district,
      upazila,
      urgency,
      contactName: contactName || patientName,
      contactPhone,
      requiredDate,
      reason: reason || 'জরুরি রক্তের আবেদন',
      responders: [],
      createdAt: lang === 'bn' ? 'এইমাত্র' : 'Just now',
      status: 'ACTIVE',
    };

    onSubmitSOS(newReq);
    onLogAudit(
      'CREATE_SOS',
      `Created SOS request for ${bloodGroup} blood at ${hospitalName} (${unitsNeeded} units)`
    );
    setSubmittedRequest(newReq);
  };

  const handleCopyLink = () => {
    if (!submittedRequest) return;
    const shareText = `🚨 *BloodSearch জরুরি রক্তের আবেদন (Emergency Blood Request)* 🚨\n\n🩸 রক্তের গ্রুপ: *${submittedRequest.bloodGroup}*\n🏥 হাসপাতাল: *${submittedRequest.hospitalName}*\n📍 এলাকা: *${submittedRequest.district}*\n📦 পরিমাণ: *${submittedRequest.unitsNeeded} ব্যাগ*\n📞 যোগাযোগ: *${submittedRequest.contactPhone}*\n\nজরুরি সাড়া দিতে অ্যাপ ভিজিট করুন: ${window.location.origin}`;
    navigator.clipboard.writeText(shareText);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleResetAndClose = () => {
    setSubmittedRequest(null);
    setPatientName('');
    setHospitalName('');
    setContactPhone('');
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 overflow-y-auto">
      <div className="w-full max-w-xl my-4 rounded-2xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/30">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.createSosTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.createSosDesc}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedRequest ? (
          /* Success Screen with Deep Link Sharing */
          <div className="py-6 space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'জরুরি আবেদন সফলভাবে সম্প্রচার হয়েছে!' : 'SOS Broadcasted Successfully!'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
                {lang === 'bn'
                  ? `${submittedRequest.district} এলাকার সকল ${submittedRequest.bloodGroup} রক্তদাতাদের নোটিফিকেশন পৌঁছে গেছে। নিচে থেকে সোশ্যাল মিডিয়ায় শেয়ার করুন।`
                  : `Voluntary donors matching ${submittedRequest.bloodGroup} around ${submittedRequest.district} are alerted. Share this request now.`}
              </p>
            </div>

            {/* Quick Share Buttons */}
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-left space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-rose-500" />
                <span>{lang === 'bn' ? 'তাত্ক্ষণিক শেয়ার করুন:' : 'Instant Share Options:'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `🚨 জরুরি রক্তের আবেদন! ${submittedRequest.bloodGroup} রক্ত প্রয়োজন ${submittedRequest.hospitalName}-এ। যোগাযোগ: ${submittedRequest.contactPhone}. BloodSearch এ সরাসরি দেখুন: ${window.location.origin}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-transform active:scale-95 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t.shareWhatsapp}</span>
                </a>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs shadow-sm transition-transform active:scale-95 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{linkCopied ? t.linkCopied : t.shareDeepLink}</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {lang === 'bn' ? 'লাইভ ফিডে যান' : 'Go to Live Requests Feed'}
            </button>
          </div>
        ) : (
          /* SOS Request Form */
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            {/* Blood Group and Units Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.selectBloodGroup} *
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full h-11 px-3 text-sm font-bold rounded-xl bg-white/90 dark:bg-slate-900/90 text-rose-600 dark:text-rose-400 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
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
                  {t.unitsNeeded} *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={unitsNeeded}
                  onChange={(e) => setUnitsNeeded(Number(e.target.value))}
                  required
                  className="w-full h-11 px-3 text-sm font-semibold rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Urgency Level Segmented Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.urgencyLevel} *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['CRITICAL', 'URGENT', 'STANDARD'] as UrgencyLevel[]).map((level) => {
                  const isSelected = urgency === level;
                  return (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setUrgency(level)}
                      className={`min-h-[44px] py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center ${
                        isSelected
                          ? level === 'CRITICAL'
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                            : level === 'URGENT'
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                            : 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Patient Name & Age */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.patientName} *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: মোছাঃ সালমা খাতুন"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                  className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.patientAge}
                </label>
                <input
                  type="number"
                  placeholder="বয়স"
                  value={patientAge}
                  onChange={(e) => setPatientAge(e.target.value ? Number(e.target.value) : '')}
                  className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Hospital Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.hospitalName} *
              </label>
              <input
                type="text"
                placeholder="যেমন: ঢাকা মেডিকেল কলেজ হাসপাতাল (DMCH), নতুন ভবন ৩য় তলা"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                required
                className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Geographic Cascading Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.selectDivision}
                </label>
                <select
                  value={division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full h-11 px-3 text-xs rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {DIVISIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {lang === 'bn' ? d.nameBn : d.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.selectDistrict}
                </label>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full h-11 px-3 text-xs rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {currentDistricts.map((dist) => (
                    <option key={dist.id} value={dist.id}>
                      {lang === 'bn' ? dist.nameBn : dist.nameEn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {t.selectUpazila}
                </label>
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full h-11 px-3 text-xs rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {currentUpazilas.map((u) => (
                    <option key={u.id} value={u.id}>
                      {lang === 'bn' ? u.nameBn : u.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Person & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.contactName}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ফাহিম (ভাই)"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.contactPhone} *
                </label>
                <input
                  type="tel"
                  placeholder="+88017XXXXXXXX"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                  className="w-full h-11 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>
            </div>

            {/* Reason / Clinical Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.caseReason}
              </label>
              <textarea
                rows={2}
                placeholder="যেমন: সড়ক দুর্ঘটনায় রক্তক্ষরণ, আজ বিকেলে জরুরি সার্জারি..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>{t.submitSos}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
