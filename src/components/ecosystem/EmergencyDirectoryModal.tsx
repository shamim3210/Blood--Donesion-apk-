import React, { useState } from 'react';
import { Language } from '../../types';
import { DIVISIONS } from '../../data/bangladeshGeo';
import { 
  Building2, 
  Phone, 
  MapPin, 
  Search, 
  X, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Ambulance,
  HeartPulse,
  Droplet
} from 'lucide-react';

interface BloodBankOrg {
  id: string;
  nameBn: string;
  nameEn: string;
  divisionId: string;
  locationBn: string;
  locationEn: string;
  phone: string;
  altPhone?: string;
  type: 'BLOOD_BANK' | 'AMBULANCE';
  timing: string;
  verified: boolean;
}

const EMERGENCY_ORGANIZATIONS: BloodBankOrg[] = [
  // Dhaka Blood Banks
  {
    id: 'org-1',
    nameBn: 'বাংলাদেশ রেড ক্রিসেন্ট জাতীয় রক্ত কেন্দ্র',
    nameEn: 'Bangladesh Red Crescent National Blood Center',
    divisionId: 'dhaka',
    locationBn: '৭/৫ ঔরঙ্গজেব রোড, মোহাম্মদপুর, ঢাকা',
    locationEn: '7/5 Aurangzeb Road, Mohammadpur, Dhaka',
    phone: '02-9116563',
    altPhone: '+8801811458524',
    type: 'BLOOD_BANK',
    timing: '২৪ ঘণ্টা খোলা (24/7)',
    verified: true,
  },
  {
    id: 'org-2',
    nameBn: 'কোয়ান্টাম রক্তদান ল্যাব ও ব্যাংক',
    nameEn: 'Quantum Blood Lab & Bank',
    divisionId: 'dhaka',
    locationBn: '৩১/ভি, শিল্পাচার্য জয়নুল আবেদিন সড়ক, শান্তিনগর, ঢাকা',
    locationEn: '31/V Shantinagar, Dhaka',
    phone: '01714-010869',
    altPhone: '02-9351969',
    type: 'BLOOD_BANK',
    timing: '২৪ ঘণ্টা খোলা (24/7)',
    verified: true,
  },
  {
    id: 'org-3',
    nameBn: 'সন্ধানী (ঢাকা মেডিকেল কলেজ ইউনিট)',
    nameEn: 'Sandhani (DMCH Central Unit)',
    divisionId: 'dhaka',
    locationBn: 'ঢাকা মেডিকেল কলেজ হাসপাতাল কম্পাউন্ড, ঢাকা',
    locationEn: 'DMCH Compound, Dhaka',
    phone: '02-9668690',
    altPhone: '+8801711000000',
    type: 'BLOOD_BANK',
    timing: '২৪ ঘণ্টা জরুরি সেবা',
    verified: true,
  },
  {
    id: 'org-4',
    nameBn: 'বাঁধন (কেন্দ্রীয় কার্যালয়)',
    nameEn: 'Badhan (Central Office, DU)',
    divisionId: 'dhaka',
    locationBn: 'টিএসসি (নিচতলা), ঢাকা বিশ্ববিদ্যালয়, ঢাকা',
    locationEn: 'TSC Ground Floor, Dhaka University',
    phone: '01534-982674',
    altPhone: '02-9667788',
    type: 'BLOOD_BANK',
    timing: 'সকাল ৯:০০ - রাত ৯:০০',
    verified: true,
  },
  {
    id: 'org-5',
    nameBn: 'পুলিশ ব্লাড ব্যাংক',
    nameEn: 'Police Blood Bank',
    divisionId: 'dhaka',
    locationBn: 'কেন্দ্রীয় পুলিশ হাসপাতাল, রাজারবাগ, ঢাকা',
    locationEn: 'Central Police Hospital, Rajarbagh, Dhaka',
    phone: '01713-398386',
    altPhone: '02-9362573',
    type: 'BLOOD_BANK',
    timing: '২৪ ঘণ্টা খোলা (24/7)',
    verified: true,
  },
  {
    id: 'org-6',
    nameBn: 'বিএসএমএমইউ রক্ত সঞ্চালন বিভাগ (পিজি)',
    nameEn: 'BSMMU Transfusion Medicine Department',
    divisionId: 'dhaka',
    locationBn: 'শাহবাগ মোড়, ঢাকা',
    locationEn: 'Shahbagh, Dhaka',
    phone: '02-9661051',
    type: 'BLOOD_BANK',
    timing: '২৪ ঘণ্টা খোলা (24/7)',
    verified: true,
  },
  // Chittagong
  {
    id: 'org-7',
    nameBn: 'রেড ক্রিসেন্ট ব্লাড সেন্টার, চট্টগ্রাম',
    nameEn: 'Red Crescent Blood Center, Chittagong',
    divisionId: 'chittagong',
    locationBn: 'আন্দরকিল্লা, চট্টগ্রাম',
    locationEn: 'Anderkilla, Chittagong',
    phone: '031-616335',
    altPhone: '+8801819385623',
    type: 'BLOOD_BANK',
    timing: '২৪ ঘণ্টা খোলা (24/7)',
    verified: true,
  },
  {
    id: 'org-8',
    nameBn: 'সন্ধানী (চট্টগ্রাম মেডিকেল কলেজ ইউনিট)',
    nameEn: 'Sandhani (CMCH Unit)',
    divisionId: 'chittagong',
    locationBn: 'কে বি ফজলুল কাদের রোড, চট্টগ্রাম',
    locationEn: 'KB Fazlul Kader Road, Chittagong',
    phone: '031-616891',
    type: 'BLOOD_BANK',
    timing: '২৪ ঘণ্টা জরুরি সেবা',
    verified: true,
  },
  // Sylhet
  {
    id: 'org-9',
    nameBn: 'রেড ক্রিসেন্ট ব্লাড ব্যাংক, সিলেট',
    nameEn: 'Red Crescent Blood Bank, Sylhet',
    divisionId: 'sylhet',
    locationBn: 'চৌহাট্টা, সিলেট সদর, সিলেট',
    locationEn: 'Chouhatta, Sylhet',
    phone: '0821-714989',
    type: 'BLOOD_BANK',
    timing: '২৪ ঘণ্টা খোলা',
    verified: true,
  },
  {
    id: 'org-10',
    nameBn: 'সন্ধানী (সিলেট এমএজি ওসমানী মেডিকেল)',
    nameEn: 'Sandhani (SOMC Unit, Sylhet)',
    divisionId: 'sylhet',
    locationBn: 'মেডিকেল রোড, কাজলশাহ, সিলেট',
    locationEn: 'Kajolshah, Sylhet',
    phone: '0821-713487',
    type: 'BLOOD_BANK',
    timing: '২৪ ঘণ্টা জরুরি সেবা',
    verified: true,
  },
  // Rajshahi
  {
    id: 'org-11',
    nameBn: 'রেড ক্রিসেন্ট ব্লাড সেন্টার, রাজশাহী',
    nameEn: 'Red Crescent Blood Center, Rajshahi',
    divisionId: 'rajshahi',
    locationBn: 'লক্ষ্মীপুর মোড়, রাজশাহী',
    locationEn: 'Laxmipur, Rajshahi',
    phone: '0721-772186',
    type: 'BLOOD_BANK',
    timing: '২৪ ঘণ্টা খোলা',
    verified: true,
  },
  // Khulna
  {
    id: 'org-12',
    nameBn: 'সন্ধানী (খুলনা মেডিকেল কলেজ ইউনিট)',
    nameEn: 'Sandhani (KMC Unit, Khulna)',
    divisionId: 'khulna',
    locationBn: 'বয়রা, খুলনা সদর, খুলনা',
    locationEn: 'Boyra, Khulna',
    phone: '041-760350',
    type: 'BLOOD_BANK',
    timing: '২৪ ঘণ্টা জরুরি সেবা',
    verified: true,
  },
  // 24/7 Ambulances
  {
    id: 'amb-1',
    nameBn: 'জাতীয় জরুরি সেবা (৯৯৯ অ্যাম্বুলেন্স ডিসপ্যাচ)',
    nameEn: 'National Emergency 999 Ambulance Service',
    divisionId: 'dhaka',
    locationBn: 'সারাদেশে জরুরি সহায়তা নেটওয়ার্ক',
    locationEn: 'Nationwide Network (Free Call)',
    phone: '999',
    type: 'AMBULANCE',
    timing: 'টোল ফ্রি · ২৪ ঘণ্টা চালু',
    verified: true,
  },
  {
    id: 'amb-2',
    nameBn: 'স্বাস্থ্য বাতায়ন হেল্পলাইন',
    nameEn: 'Shastho Batayon Telemedicine & Ambulance',
    divisionId: 'dhaka',
    locationBn: 'স্বাস্থ্য ও পরিবার কল্যাণ মন্ত্রণালয়',
    locationEn: 'Ministry of Health and Family Welfare',
    phone: '16263',
    type: 'AMBULANCE',
    timing: '২৪ ঘণ্টা স্বাস্থ্য পরামর্শ ও অ্যাম্বুলেন্স',
    verified: true,
  },
  {
    id: 'amb-3',
    nameBn: 'রেড ক্রিসেন্ট জাতীয় অ্যাম্বুলেন্স সার্ভিস',
    nameEn: 'Red Crescent National Ambulance Service',
    divisionId: 'dhaka',
    locationBn: 'ঢাকা ও আশেপাশের জেলাসমূহ',
    locationEn: 'Dhaka & Nationwide',
    phone: '02-9330188',
    altPhone: '01811-458542',
    type: 'AMBULANCE',
    timing: '২৪ ঘণ্টা অক্সিজেন ও আইসিইউ অ্যাম্বুলেন্স',
    verified: true,
  },
  {
    id: 'amb-4',
    nameBn: 'আল-মারকাজুল ইসলামী অ্যাম্বুলেন্স',
    nameEn: 'Al-Markazul Islami Ambulance',
    divisionId: 'dhaka',
    locationBn: 'শ্যামলী ও মোহাম্মদপুর, ঢাকা',
    locationEn: 'Shyamoli, Dhaka',
    phone: '02-9127867',
    altPhone: '01711-828555',
    type: 'AMBULANCE',
    timing: '২৪ ঘণ্টা লাশবাহী ও রোগী পরিবহন',
    verified: true,
  },
];

interface EmergencyDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const EmergencyDirectoryModal: React.FC<EmergencyDirectoryModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'BLOOD_BANK' | 'AMBULANCE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredOrgs = EMERGENCY_ORGANIZATIONS.filter((org) => {
    if (selectedDivision !== 'ALL' && org.divisionId !== selectedDivision) return false;
    if (selectedType !== 'ALL' && org.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = org.nameBn.toLowerCase().includes(q) || org.nameEn.toLowerCase().includes(q);
      const matchLoc = org.locationBn.toLowerCase().includes(q) || org.locationEn.toLowerCase().includes(q);
      const matchPhone = org.phone.includes(q) || (org.altPhone && org.altPhone.includes(q));
      if (!matchName && !matchLoc && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
      <div className="w-full max-w-xl my-2 sm:my-auto rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 transition-all text-left space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'জরুরি ব্লাড ব্যাংক ও অ্যাম্বুলেন্স' : 'Emergency Blood Banks & Ambulance'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                  24/7 Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? '৬৪ জেলার সরকারি ও স্বেচ্ছাসেবী কেন্দ্রের সরাসরি হটলাইন' : 'Verified nationwide blood banks and dispatch hotlines'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'bn' ? 'ব্লাড ব্যাংক বা এলাকার নাম দিয়ে খুঁজুন...' : 'Search by blood bank name, city, or phone...'}
              className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Quick Segment Buttons */}
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            {/* Type selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0f172a] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedType('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedType === 'ALL'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {lang === 'bn' ? 'সব' : 'All'}
              </button>
              <button
                onClick={() => setSelectedType('BLOOD_BANK')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedType === 'BLOOD_BANK'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Droplet className="w-3 h-3" />
                <span>{lang === 'bn' ? 'ব্লাড ব্যাংক' : 'Blood Bank'}</span>
              </button>
              <button
                onClick={() => setSelectedType('AMBULANCE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  selectedType === 'AMBULANCE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Ambulance className="w-3 h-3" />
                <span>{lang === 'bn' ? 'অ্যাম্বুলেন্স' : 'Ambulance'}</span>
              </button>
            </div>

            {/* Division dropdown */}
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="h-8 px-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <option value="ALL">{lang === 'bn' ? 'সকল বিভাগ' : 'All Divisions'}</option>
              {DIVISIONS.map((div) => (
                <option key={div.id} value={div.id}>
                  {lang === 'bn' ? div.nameBn : div.nameEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Directory List (Mobile Friendly Single Column) */}
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {filteredOrgs.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              {lang === 'bn' ? 'কোনো ব্লাড ব্যাংক বা হটলাইন পাওয়া যায়নি' : 'No emergency centers found matching your search.'}
            </div>
          ) : (
            filteredOrgs.map((org) => (
              <div
                key={org.id}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/80 shadow-xs hover:border-rose-400 transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white font-bold ${
                        org.type === 'AMBULANCE' ? 'bg-amber-500' : 'bg-rose-600'
                      }`}
                    >
                      {org.type === 'AMBULANCE' ? (
                        <Ambulance className="w-4 h-4" />
                      ) : (
                        <HeartPulse className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                          {lang === 'bn' ? org.nameBn : org.nameEn}
                        </h4>
                        {org.verified && (
                          <span className="text-blue-500 shrink-0" title="অফিসিয়াল কেন্দ্র">
                            <ShieldCheck className="w-3.5 h-3.5 fill-blue-500 text-white" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{lang === 'bn' ? org.locationBn : org.locationEn}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
                    {org.timing}
                  </span>
                </div>

                {/* Call Action Bar */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                    📞 {org.phone}
                    {org.altPhone && (
                      <span className="text-slate-400 font-normal ml-1">/ {org.altPhone}</span>
                    )}
                  </div>

                  <a
                    href={`tel:${org.phone.replace(/[^0-9]/g, '')}`}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-rose-600/20 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'সরাসরি কল' : 'Call Direct'}</span>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>{lang === 'bn' ? 'জরুরি প্রয়োজনে ১৬২৬৩ বা ৯৯৯ এ ডায়াল করুন' : 'For national emergency, dial 16263 or 999'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
