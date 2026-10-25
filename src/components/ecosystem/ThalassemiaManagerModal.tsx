import React, { useState, useEffect } from 'react';
import { Language, BloodGroup } from '../../types';
import { ALL_BLOOD_GROUPS } from '../../data/compatibility';
import { evictSeedsProgressively } from '../../data/mockDonors';
import { 
  Heart, 
  Calendar, 
  Activity, 
  Clock, 
  UserPlus, 
  Share2, 
  Phone, 
  Check, 
  X, 
  AlertCircle, 
  Users, 
  Droplet,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { playEmergencyChime } from '../../utils/audioAlert';

interface ThalassemiaPatient {
  id: string;
  name: string;
  age: number;
  bloodGroup: BloodGroup;
  hospital: string;
  guardianName: string;
  contactPhone: string;
  transfusionIntervalDays: number;
  lastTransfusionDate: string; // YYYY-MM-DD
  currentHb: number; // g/dL
  repeatDonors: {
    name: string;
    phone: string;
    monthSlot: string;
    confirmed: boolean;
  }[];
}

const INITIAL_PATIENTS: ThalassemiaPatient[] = [
  {
    id: 'th-1',
    name: 'আরিয়ান রহমান (৮ বছর)',
    age: 8,
    bloodGroup: 'B+',
    hospital: 'বাংলাদেশ থ্যালাসেমিয়া হাসপাতাল, গ্রীন রোড, ঢাকা',
    guardianName: 'মো. রফিকুল ইসলাম (পিতা)',
    contactPhone: '01711-889900',
    transfusionIntervalDays: 21,
    lastTransfusionDate: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
    currentHb: 7.8,
    repeatDonors: [
      { name: 'তানভীর আহমেদ', phone: '01712-334455', monthSlot: 'চলতি মাস (রক্তদান বাকি)', confirmed: true },
      { name: 'কামাল হোসেন', phone: '01819-223344', monthSlot: 'পরবর্তী মাস', confirmed: true },
      { name: 'সাইফুল ইসলাম', phone: '01911-556677', monthSlot: 'তৃতীয় মাস', confirmed: false },
      { name: 'মাহবুব আলম', phone: '01677-889900', monthSlot: 'চতুর্থ মাস', confirmed: true },
    ]
  },
  {
    id: 'th-2',
    name: 'ফারিয়া জান্নাত (১২ বছর)',
    age: 12,
    bloodGroup: 'O-',
    hospital: 'ঢাকা মেডিকেল কলেজ হাসপাতাল (পিডিয়াট্রিক হেমাটোলজি)',
    guardianName: 'সুলতানা পারভীন (মাতা)',
    contactPhone: '01822-445566',
    transfusionIntervalDays: 28,
    lastTransfusionDate: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString().split('T')[0],
    currentHb: 6.9,
    repeatDonors: [
      { name: 'আব্দুল্লাহ আল নোমান', phone: '01755-667788', monthSlot: 'জরুরি প্রয়োজন (এই সপ্তাহে)', confirmed: true },
      { name: 'ডা. সাজিদ করিম', phone: '01922-334455', monthSlot: 'পরবর্তী মাস', confirmed: true },
    ]
  }
];

interface ThalassemiaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

const SEED_THALASSEMIA_IDS = new Set(INITIAL_PATIENTS.map((p) => p.id));

export const ThalassemiaManagerModal: React.FC<ThalassemiaManagerModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [patients, setPatients] = useState<ThalassemiaPatient[]>(() => {
    const saved = localStorage.getItem('bloodsearch_thalassemia_patients');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const realOnly = parsed.filter((p) => p && !SEED_THALASSEMIA_IDS.has(p.id));
          return evictSeedsProgressively(realOnly, INITIAL_PATIENTS);
        }
      } catch {
        return evictSeedsProgressively([], INITIAL_PATIENTS);
      }
    }
    return evictSeedsProgressively([], INITIAL_PATIENTS);
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || 'th-1');
  const [isAddingPatient, setIsAddingPatient] = useState(false);
  const [copiedReminder, setCopiedReminder] = useState(false);

  // New Patient Form
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState(10);
  const [newGroup, setNewGroup] = useState<BloodGroup>('B+');
  const [newHospital, setNewHospital] = useState('বাংলাদেশ থ্যালাসেমিয়া হাসপাতাল, ঢাকা');
  const [newPhone, setNewPhone] = useState('');
  const [newInterval, setNewInterval] = useState(21);
  const [newHb, setNewHb] = useState(8.0);

  useEffect(() => {
    localStorage.setItem('bloodsearch_thalassemia_patients', JSON.stringify(patients));
  }, [patients]);

  if (!isOpen) return null;

  const currentPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  // Calculate days remaining until next transfusion
  const calculateDaysRemaining = (patient: ThalassemiaPatient) => {
    const lastDate = new Date(patient.lastTransfusionDate).getTime();
    const cycleMs = patient.transfusionIntervalDays * 24 * 3600 * 1000;
    const nextDate = lastDate + cycleMs;
    const diffDays = Math.ceil((nextDate - Date.now()) / (1000 * 3600 * 24));
    return diffDays;
  };

  const daysRemaining = currentPatient ? calculateDaysRemaining(currentPatient) : 0;
  const isUrgent = daysRemaining <= 3;

  const handleAddPatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const newPat: ThalassemiaPatient = {
      id: `th-${Date.now()}`,
      name: newName.trim(),
      age: Number(newAge) || 10,
      bloodGroup: newGroup,
      hospital: newHospital,
      guardianName: 'অভিভাবক',
      contactPhone: newPhone.trim(),
      transfusionIntervalDays: Number(newInterval) || 21,
      lastTransfusionDate: new Date().toISOString().split('T')[0],
      currentHb: Number(newHb) || 8.0,
      repeatDonors: [
        { name: 'স্বেচ্ছাসেবী রক্তদাতা ১', phone: '+88017XXXXXXXX', monthSlot: '১ম মাস', confirmed: false },
        { name: 'স্বেচ্ছাসেবী রক্তদাতা ২', phone: '+88018XXXXXXXX', monthSlot: '২য় মাস', confirmed: false },
      ]
    };

    setPatients((prev) => {
      const realOnly = [newPat, ...prev.filter((p) => !SEED_THALASSEMIA_IDS.has(p.id))];
      return evictSeedsProgressively(realOnly, INITIAL_PATIENTS);
    });
    setSelectedPatientId(newPat.id);
    setIsAddingPatient(false);
    playEmergencyChime();
  };

  const buildReminderMessage = (patient: ThalassemiaPatient) =>
    `জরুরি থ্যালাসেমিয়া রিমাইন্ডার:\nরোগীর নাম: ${patient.name}\nব্লাড গ্রুপ: ${patient.bloodGroup}\nহাসপাতাল: ${patient.hospital}\nরক্ত নেওয়ার তারিখ: আগামী ${Math.max(1, daysRemaining)} দিনের মধ্যে\nবর্তমান হিমোগ্লোবিন: ${patient.currentHb} g/dL\nঅভিভাবকের নম্বর: ${patient.contactPhone}\n\nঅনুগ্রহ করে রক্তদানে এগিয়ে আসুন। BloodSearch Network BD.`;

  const handleCopyReminder = (patient: ThalassemiaPatient) => {
    const message = buildReminderMessage(patient);
    navigator.clipboard?.writeText(message).catch(() => {});
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
      <div className="w-full max-w-2xl my-2 sm:my-auto rounded-3xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-all text-left">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'থ্যালাসেমিয়া ও নিয়মিত রক্ত সঞ্চালন ট্র্যাকার' : 'Thalassemia & Routine Blood Tracker'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                  Life Saver
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {lang === 'bn'
                  ? 'থ্যালাসেমিয়া শিশু ও ডায়ালাইসিস রোগীদের নিয়মিত রক্তদান শিডিউল ও ডোনার রোটেশন পুল'
                  : 'Recurring blood transfusion schedule and 4-donor rotating pool'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Selector Strip */}
        <div className="py-3 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 shrink-0">
            {patients.map((p) => {
              const pDays = calculateDaysRemaining(p);
              const pUrgent = pDays <= 3;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setIsAddingPatient(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    selectedPatientId === p.id && !isAddingPatient
                      ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{p.name.split(' ')[0]}</span>
                  <span className="px-1.5 py-0.2 bg-black/20 rounded text-[10px] font-black">{p.bloodGroup}</span>
                  {pUrgent && (
                    <span className="px-1.5 py-0.2 bg-red-500 text-white rounded text-[9px] font-bold animate-pulse">
                      জরুরি
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsAddingPatient(!isAddingPatient)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? '+ নতুন রোগী' : '+ Add Patient'}</span>
          </button>
        </div>

        {/* Content View: Add Patient Form vs Patient Dashboard */}
        {isAddingPatient ? (
          <form onSubmit={handleAddPatient} className="py-4 space-y-3 animate-in fade-in">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              {lang === 'bn' ? 'থ্যালাসেমিয়া রোগীর তথ্য নিবন্ধন' : 'Register Thalassemia Patient'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  রোগীর নাম ও বয়স *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="যেমন: আরিয়ান রহমান (১০ বছর)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ব্লাড গ্রুপ *
                </label>
                <select
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value as BloodGroup)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold focus:ring-2 focus:ring-rose-500"
                >
                  {ALL_BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  হাসপাতাল / রক্ত সঞ্চালন কেন্দ্র *
                </label>
                <input
                  type="text"
                  value={newHospital}
                  onChange={(e) => setNewHospital(e.target.value)}
                  placeholder="হাসপাতালের নাম"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  অভিভাবকের ফোন নম্বর *
                </label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  রক্ত নেওয়ার ব্যবধান (কত দিন পর পর)
                </label>
                <select
                  value={newInterval}
                  onChange={(e) => setNewInterval(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold"
                >
                  <option value={14}>১৪ দিন পর পর (প্রতি ২ সপ্তাহ)</option>
                  <option value={21}>২১ দিন পর পর (প্রতি ৩ সপ্তাহ)</option>
                  <option value={28}>২৮ দিন পর পর (প্রতি ৪ সপ্তাহ)</option>
                  <option value={35}>৩৫ দিন পর পর</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  বর্তমান হিমোগ্লোবিন (Hb g/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={newHb}
                  onChange={(e) => setNewHb(Number(e.target.value))}
                  placeholder="7.5"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                নিবন্ধন সম্পন্ন করুন
              </button>
              <button
                type="button"
                onClick={() => setIsAddingPatient(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                বাতিল
              </button>
            </div>
          </form>
        ) : (
          /* Active Patient View */
          currentPatient && (
            <div className="py-4 space-y-4 animate-in fade-in">
              {/* Emergency Transfusion Countdown Hero Banner */}
              <div className={`p-4 rounded-2xl border text-white shadow-lg relative overflow-hidden ${
                isUrgent
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-rose-700 border-red-400'
                  : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-700'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider">
                        পরবর্তী রক্ত সঞ্চালন
                      </span>
                      {isUrgent && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black">
                          ⚠️ অতি জরুরি
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black">
                      {daysRemaining <= 0 
                        ? 'আজই রক্ত গ্রহণ করতে হবে!' 
                        : `আগামী ${daysRemaining} দিনের মধ্যে রক্ত প্রয়োজন`}
                    </h3>
                    <p className="text-xs text-rose-100/90 mt-0.5">
                      হাসপাতাল: {currentPatient.hospital}
                    </p>
                  </div>

                  {/* Countdown Digital Box */}
                  <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xs p-3 rounded-2xl border border-white/20 shrink-0">
                    <div className="text-center font-mono">
                      <span className="text-2xl font-black text-amber-300">{Math.max(0, daysRemaining)}</span>
                      <span className="text-[10px] text-slate-300 block -mt-1 font-bold">দিন বাকি</span>
                    </div>
                    <span className="text-white/40 font-bold">:</span>
                    <div className="text-center font-mono">
                      <span className="text-2xl font-black text-white">{currentPatient.bloodGroup}</span>
                      <span className="text-[10px] text-slate-300 block -mt-1 font-bold">গ্রুপ</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hemoglobin Meter Strip */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white ${
                    currentPatient.currentHb < 8.0 ? 'bg-red-600' : 'bg-emerald-600'
                  }`}>
                    Hb
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        হিমোগ্লোবিন স্তর: <span className="font-mono text-rose-600 dark:text-rose-400">{currentPatient.currentHb} g/dL</span>
                      </h4>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        currentPatient.currentHb < 8.0 
                          ? 'bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400' 
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {currentPatient.currentHb < 8.0 ? 'স্বল্প মাত্রা (Low)' : 'স্থিতিশীল'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      থ্যালাসেমিয়া নিরাপদ লক্ষ্যমাত্রা: ≥ ৯.৫ g/dL · রক্তদানের ব্যবধান: প্রতি {currentPatient.transfusionIntervalDays} দিন
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <a
                    href={`tel:${currentPatient.contactPhone}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-300 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>কল দিন</span>
                  </a>
                </div>
              </div>

              {/* 4-Donor Rotating Life-Saver Pool */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-rose-600" />
                    <span>৪-রক্তদাতা আবর্তন পুল (Rotating Donor Pool)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    প্রতি ৪ মাসে ১ বার রক্তদান
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentPatient.repeatDonors.map((donor, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
                          #{idx + 1}
                        </div>
                        <div>
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                            {donor.name}
                          </h5>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                            {donor.monthSlot}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${donor.phone}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                          title="কল দিন"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          donor.confirmed
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                        }`}>
                          {donor.confirmed ? 'নিশ্চিত' : 'অপেক্ষমাণ'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons: 1-Tap WhatsApp Reminder & Share */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(buildReminderMessage(currentPatient))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleCopyReminder(currentPatient)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
                >
                  <Share2 className="w-4 h-4" />
                  <span>
                    {copiedReminder 
                      ? '✓ রিমাইন্ডার কপি হয়েছে ও হোয়াটসঅ্যাপ ওপেন হচ্ছে!' 
                      : 'হোয়াটসঅ্যাপে রিমাইন্ডার পাঠান'}
                  </span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};
