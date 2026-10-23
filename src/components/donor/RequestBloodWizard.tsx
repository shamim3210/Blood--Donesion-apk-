import React, { useState } from 'react';
import { BloodGroup, UrgencyLevel, BloodRequest, Language } from '../../types';
import { ALL_BLOOD_GROUPS, getCompatibleDonors } from '../../data/compatibility';
import { DIVISIONS, DISTRICTS } from '../../data/bangladeshGeo';
import { getTranslation } from '../../utils/translations';
import { 
  X, 
  ArrowLeft, 
  Check, 
  MapPin, 
  Hospital, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  Calendar, 
  FileText,
  ShieldCheck
} from 'lucide-react';

interface RequestBloodWizardProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSubmitSOS: (newRequest: BloodRequest) => void;
  onLogAudit: (action: 'CREATE_SOS', details: string) => void;
}

export const RequestBloodWizard: React.FC<RequestBloodWizardProps> = ({
  isOpen,
  onClose,
  lang,
  onSubmitSOS,
  onLogAudit,
}) => {
  const t = getTranslation(lang);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [urgency, setUrgency] = useState<UrgencyLevel>('CRITICAL');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('B+');
  const [patientName, setPatientName] = useState('নাসরিন সুলতানা');
  const [patientAge, setPatientAge] = useState<number>(32);
  const [unitsNeeded, setUnitsNeeded] = useState<number>(2);
  const [hospitalName, setHospitalName] = useState('ঢাকা মেডিকেল কলেজ হাসপাতাল (DMCH)');
  const [district, setDistrict] = useState('dhaka');
  const [contactPhone, setContactPhone] = useState('+880174333969');
  const [reason, setReason] = useState('ইমার্জেন্সি ডেলিভারি ও রক্তক্ষরণ');
  const [doctorSlipUploaded, setDoctorSlipUploaded] = useState(true);

  if (!isOpen) return null;

  const handleNextStep = () => {
    if (step < 3) {
      setStep((step + 1) as any);
    } else if (step === 3) {
      // Create request and move to step 4 celebration
      const newReq: BloodRequest = {
        id: `sos-${Date.now()}`,
        patientName,
        patientAge: Number(patientAge) || 30,
        bloodGroup,
        unitsNeeded: Number(unitsNeeded) || 1,
        unitsCollected: 0,
        hospitalName,
        division: 'dhaka',
        district,
        upazila: 'shahbagh',
        urgency,
        contactName: 'পরিবারের স্বজন',
        contactPhone,
        requiredDate: urgency === 'CRITICAL' ? 'জরুরি ২ ঘণ্টার মধ্যে' : 'আজকের মধ্যে',
        reason,
        responders: [],
        createdAt: lang === 'bn' ? 'এইমাত্র' : 'Just now',
        status: 'ACTIVE',
      };

      onSubmitSOS(newReq);
      onLogAudit('CREATE_SOS', `Created multi-step SOS for ${bloodGroup} at ${hospitalName} (${unitsNeeded} units)`);
      setStep(4);
    }
  };

  const handleFinish = () => {
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
      <div className="w-full max-w-md my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-all flex flex-col justify-between sm:min-h-[540px]">
        {/* Top Stepper Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            {step > 1 && step < 4 ? (
              <button
                onClick={() => setStep((step - 1) as any)}
                className="p-1.5 rounded-lg text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-5" />
            )}

            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {step < 4 ? `Request Blood · Step ${step} of 3` : 'Confirmation'}
            </span>

            <button
              onClick={handleFinish}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          {step < 4 && (
            <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full my-3 overflow-hidden">
              <div
                className="h-full bg-rose-600 transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          )}

          {/* STEP 1: URGENCY LEVEL (Matching Image 9) */}
          {step === 1 && (
            <div className="py-2 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'জরুরিতা নির্ধারণ করুন' : 'Set Urgency Level'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'আপনার প্রয়োজন অনুযায়ী স্বয়ংক্রিয়ভাবে রক্তদাতাদের অনুসন্ধান রেডিয়াস ঠিক করা হবে।'
                    : 'Defines how rapidly nearby compatible donors receive critical push alerts.'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {/* Critical */}
                <div
                  onClick={() => setUrgency('CRITICAL')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    urgency === 'CRITICAL'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 shadow-sm ring-1 ring-rose-500'
                      : 'bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                      <span>Critical (জীবন-মরণ জরুরি)</span>
                    </span>
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-full">
                      5 km radius
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Life-threatening / needs blood immediately within 2 hours. Triggers instant priority broadcast to all active local donors.
                  </p>
                </div>

                {/* Urgent */}
                <div
                  onClick={() => setUrgency('URGENT')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    urgency === 'URGENT'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm ring-1 ring-amber-500'
                      : 'bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>Urgent (আজকের মধ্যে প্রয়োজন)</span>
                    </span>
                    <span className="text-[11px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                      15 km radius
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Needed within a few hours for ongoing treatment, dialysis, or day-surgery.
                  </p>
                </div>

                {/* Standard */}
                <div
                  onClick={() => setUrgency('STANDARD')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    urgency === 'STANDARD'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500'
                      : 'bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span>Standard (পরিকল্পিত সার্জারি)</span>
                    </span>
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                      30 km radius
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Scheduled surgical reserve or next-day requirement with widest donor matching pool.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BLOOD GROUP SELECTOR (Matching Image 9) */}
          {step === 2 && (
            <div className="py-2 space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'রক্তের গ্রুপ নির্বাচন করুন' : 'Choose Blood Group'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'bn' ? 'রোগীর প্রয়োজনীয় রক্তের গ্রুপ সিলেক্ট করুন' : 'Select the exact blood group required for the patient'}
                </p>
              </div>

              {/* 8 Big Square Tiles */}
              <div className="grid grid-cols-4 gap-2.5 pt-2">
                {ALL_BLOOD_GROUPS.map((group) => {
                  const isSelected = bloodGroup === group;
                  return (
                    <button
                      key={group}
                      onClick={() => setBloodGroup(group)}
                      className={`h-16 rounded-2xl font-black text-lg transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105'
                          : 'bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white hover:border-rose-400'
                      }`}
                    >
                      <span>{group}</span>
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white text-rose-600 text-[10px] font-bold flex items-center justify-center">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selection Summary Pill */}
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
                    {bloodGroup} {lang === 'bn' ? 'গ্রুপ নির্বাচিত হয়েছে' : 'Blood group selected'}
                  </span>
                  <p className="text-[11px] text-rose-600/80 dark:text-rose-400 mt-0.5">
                    {lang === 'bn' ? 'ম্যাচিং ডোনার:' : 'Compatible Donors:'} {getCompatibleDonors(bloodGroup).join(', ')}
                  </p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              </div>

              {/* Doctor Medical Advice Note (from Image 9) */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  💡 {lang === 'bn' ? 'সন্দেহ থাকলে ডক্টরের প্রেসক্রিপশন দেখুন' : 'Not sure? Consult your physician'}
                </span>
                {lang === 'bn'
                  ? 'হাসপাতালের ব্লাড ব্যাংক রিসিট বা ডক্টরের রিকুইজিশন স্লিপ অনুযায়ী গ্রুপ সিলেক্ট করুন। O- হলো ইউনিভার্সাল ডোনার।'
                  : 'Ask your doctor or check hospital requisition slip. O- is the universal donor and can be used in most critical emergencies.'}
              </div>
            </div>
          )}

          {/* STEP 3: PATIENT & HOSPITAL DETAILS (Matching Image 16) */}
          {step === 3 && (
            <div className="py-2 space-y-3.5">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'রোগী ও হাসপাতালের তথ্য' : 'Patient & Hospital Details'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'bn' ? 'সঠিক তথ্য দিলে ডোনাররা দ্রুত পৌঁছাতে পারবেন' : 'Accurate hospital room and contact details speed up donor arrival'}
                </p>
              </div>

              <div className="space-y-3 pt-1">
                {/* Units slider matching Image 16 */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>{t.unitsNeeded}</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-black text-sm">
                      {unitsNeeded} {lang === 'bn' ? 'ব্যাগ' : 'Units'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={unitsNeeded}
                    onChange={(e) => setUnitsNeeded(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>১ ব্যাগ</span>
                    <span>৩ ব্যাগ</span>
                    <span>৬ ব্যাগ</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.patientName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.hospitalName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {t.contactPhone} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full h-10 px-3 text-xs sm:text-sm rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>

                {/* Doctor Slip / Requisition receipt simulation (matching Image 1 & 16) */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {lang === 'bn' ? 'প্রেসক্রিপশন / রিকুইজিশন স্লিপ' : 'Doctor Slip & Requisition'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {doctorSlipUploaded ? 'hospital_receipt_slip.pdf (Verified)' : 'Upload verification slip'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDoctorSlipUploaded(!doctorSlipUploaded)}
                    className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    {doctorSlipUploaded ? 'Change' : 'Attach'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: CELEBRATION & SENT CONFIRMATION (Matching Image 9) */}
          {step === 4 && (
            <div className="py-6 space-y-5 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/10 animate-bounce">
                <Check className="w-10 h-10 stroke-[3]" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'আবেদন সম্প্রচারিত হয়েছে!' : 'Request Sent'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  {lang === 'bn'
                    ? 'আপনার জরুরি রক্তের আবেদন আশপাশের ৫ কিমির নিবন্ধিত ডোনারদের ফোনে পাঠানো হয়েছে।'
                    : 'Your emergency broadcast has been dispatched to all eligible donors within the emergency radius.'}
                </p>
              </div>

              {/* Request Summary Card matching Image 9 */}
              <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 text-left space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{hospitalName}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Group</span>
                    <span className="text-base font-black text-rose-600">{bloodGroup}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Urgency</span>
                    <span className="text-xs font-bold text-red-600">{urgency}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Radius</span>
                    <span className="text-xs font-bold text-emerald-600">5 km</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Button */}
        <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
          {step < 4 ? (
            <button
              onClick={handleNextStep}
              className="w-full min-h-[48px] rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <span>{step === 3 ? (lang === 'bn' ? 'জরুরি আবেদন সম্প্রচার করুন' : 'Broadcast Request Now') : 'Continue →'}</span>
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="w-full min-h-[48px] rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm shadow-md transition-all cursor-pointer active:scale-98"
            >
              <span>{lang === 'bn' ? 'হোমে ফিরে যান (Back to Home)' : 'Back to Home'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
