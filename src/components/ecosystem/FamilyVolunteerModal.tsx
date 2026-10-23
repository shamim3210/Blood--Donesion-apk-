import React, { useState } from 'react';
import { BloodGroup, Language } from '../../types';
import { 
  X, 
  Users, 
  HeartHandshake, 
  UserPlus, 
  Phone, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Send,
  Sparkles,
  Droplet
} from 'lucide-react';

interface FamilyVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onOpenSOSWithGroup?: (group: BloodGroup) => void;
}

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  bloodGroup: BloodGroup;
  phone: string;
  emergencyContact: boolean;
}

interface VolunteerItem {
  id: string;
  name: string;
  organization: string;
  zone: string;
  status: 'Ready' | 'On Mission' | 'Resting';
  assignedCase?: string;
  phone: string;
}

export const FamilyVolunteerModal: React.FC<FamilyVolunteerModalProps> = ({
  isOpen,
  onClose,
  lang,
  onOpenSOSWithGroup,
}) => {
  const [activeTab, setActiveTab] = useState<'family' | 'volunteers'>('family');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Mock Family network
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: 'fam-1',
      name: 'আহমেদ রফিক (বাবা / Father)',
      relation: 'Father',
      bloodGroup: 'B+',
      phone: '+8801711998877',
      emergencyContact: true,
    },
    {
      id: 'fam-2',
      name: 'সুলতানা বেগম (মা / Mother)',
      relation: 'Mother',
      bloodGroup: 'O+',
      phone: '+8801819223344',
      emergencyContact: true,
    },
    {
      id: 'fam-3',
      name: 'ফারজানা আক্তার (স্ত্রী / Spouse)',
      relation: 'Spouse',
      bloodGroup: 'A+',
      phone: '+8801912445566',
      emergencyContact: true,
    },
    {
      id: 'fam-4',
      name: 'আরাফ আহমেদ (ছেলে / Son)',
      relation: 'Child',
      bloodGroup: 'O-',
      phone: 'N/A (Minor)',
      emergencyContact: false,
    },
  ]);

  // Volunteers
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>([
    {
      id: 'vol-1',
      name: 'সাকিব আল হাসান (Sakib)',
      organization: 'Badhan (বাঁধন - ঢাবি জোন)',
      zone: 'Shahbagh & DMCH, Dhaka',
      status: 'Ready',
      phone: '+8801722334455',
    },
    {
      id: 'vol-2',
      name: 'ডা. সানজিদা ইসলাম (Dr. Sanjida)',
      organization: 'Bangladesh Red Crescent Society',
      zone: 'Mohakhali & TB Gate',
      status: 'On Mission',
      assignedCase: 'DMCH Delivery Bleeding #INC-0412',
      phone: '+8801833445566',
    },
    {
      id: 'vol-3',
      name: 'নাসিমুল হক (Nasim)',
      organization: 'Sandhani (সন্ধানী - সিএমসিএইচ)',
      zone: 'Panchlaish, Chattogram',
      status: 'Ready',
      phone: '+8801944556677',
    },
  ]);

  // New family form state
  const [isAddingFamily, setIsAddingFamily] = useState(false);
  const [newFamName, setNewFamName] = useState('');
  const [newFamRelation, setNewFamRelation] = useState('Sibling');
  const [newFamGroup, setNewFamGroup] = useState<BloodGroup>('A+');
  const [newFamPhone, setNewFamPhone] = useState('');

  if (!isOpen) return null;

  const handleAddFamilyMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamName.trim()) return;

    const newMember: FamilyMember = {
      id: `fam-${Date.now()}`,
      name: newFamName,
      relation: newFamRelation,
      bloodGroup: newFamGroup,
      phone: newFamPhone || '+88017XXXXXXXX',
      emergencyContact: true,
    };

    setFamilyMembers((prev) => [...prev, newMember]);
    setIsAddingFamily(false);
    setNewFamName('');
    setNewFamPhone('');
    setSuccessNotice(lang === 'bn' ? 'পারিবারিক সদস্য সফলভাবে যুক্ত করা হয়েছে।' : 'Family member linked to emergency network.');
    setTimeout(() => setSuccessNotice(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2.5 sm:p-4 bg-black/80 overflow-y-auto modal-scroll-contain">
      <div className="w-full max-w-xl my-2 sm:my-auto rounded-3xl glass-card-adaptive p-4 sm:p-7 shadow-2xl border border-slate-200/80 dark:border-slate-800/80 transition-all text-left">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'ফ্যামিলি নেটওয়ার্ক ও স্বেচ্ছাসেবী দল' : 'Family Network & Volunteer Dispatch'}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'bn' ? 'পারিবারিক রক্তের গ্রুপ সংরক্ষণ ও ইমার্জেন্সি সাপোর্ট' : 'Emergency Contact Group & Rapid Response Volunteers'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successNotice && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* 2 Segmented Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl my-5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('family')}
            className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'family'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{lang === 'bn' ? 'পারিবারিক নেটওয়ার্ক' : 'Family Network'} ({familyMembers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('volunteers')}
            className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'volunteers'
                ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>{lang === 'bn' ? 'স্বেচ্ছাসেবী কোঅর্ডিনেশন' : 'Volunteers Grid'} ({volunteers.length})</span>
          </button>
        </div>

        {/* Family Tab */}
        {activeTab === 'family' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {lang === 'bn' ? 'সংযুক্ত পরিবারের সদস্যরা' : 'Linked Family Members'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {lang === 'bn'
                    ? 'যেকোনো বিপদে এক ক্লিকে তাদের গ্রুপের রক্ত নিশ্চিত করতে সাহায্য করবে'
                    : 'Instant 1-tap SOS request creation whenever any relative requires blood'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingFamily(!isAddingFamily)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAddingFamily ? 'Cancel' : '+ Add Member'}</span>
              </button>
            </div>

            {isAddingFamily && (
              <form
                onSubmit={handleAddFamilyMember}
                className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-3 animate-in fade-in"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Member Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. কামরুল হাসান"
                      value={newFamName}
                      onChange={(e) => setNewFamName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Relation
                    </label>
                    <select
                      value={newFamRelation}
                      onChange={(e) => setNewFamRelation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Father">Father (বাবা)</option>
                      <option value="Mother">Mother (মা)</option>
                      <option value="Spouse">Spouse (স্ত্রী/স্বামী)</option>
                      <option value="Child">Child (সন্তান)</option>
                      <option value="Sibling">Sibling (ভাই/বোন)</option>
                      <option value="Relative">Other Relative</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Blood Group
                    </label>
                    <select
                      value={newFamGroup}
                      onChange={(e) => setNewFamGroup(e.target.value as BloodGroup)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-rose-600"
                    >
                      {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={newFamPhone}
                      onChange={(e) => setNewFamPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Save Family Member
                </button>
              </form>
            )}

            <div className="space-y-2.5">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-3.5 rounded-2xl glass-card-adaptive flex items-center justify-between gap-3 hover:border-rose-400/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                      {member.bloodGroup}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {member.name}
                        </span>
                        {member.emergencyContact && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold">
                            SOS Contact
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {member.relation} · {member.phone}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenSOSWithGroup) {
                        onOpenSOSWithGroup(member.bloodGroup);
                        onClose();
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap"
                  >
                    1-Tap SOS
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Volunteers Tab */}
        {activeTab === 'volunteers' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Bangladesh Emergency Volunteer Network
                </span>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Connected with Badhan, Red Crescent, Sandhani, and Quantum Foundation for rapid physical donor mobilization.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {volunteers.map((vol) => (
                <div
                  key={vol.id}
                  className="p-3.5 rounded-2xl glass-card-adaptive flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {vol.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          vol.status === 'Ready'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {vol.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {vol.organization} · <span className="text-rose-600 font-medium">{vol.zone}</span>
                    </div>
                    {vol.assignedCase && (
                      <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center gap-1">
                        <Activity className="w-3 h-3 text-amber-500" />
                        <span>Case: {vol.assignedCase}</span>
                      </div>
                    )}
                  </div>

                  <a
                    href={`tel:${vol.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call Coordinator</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
