import React, { useState, useEffect } from 'react';
import { BloodGroup, Language, Donor } from '../../types';
import { getTranslation } from '../../utils/translations';
import { 
  requestRealDeviceGPS, 
  calculateHaversineDistance, 
  formatDistance, 
  DISTRICT_COORDINATES,
  Coordinates,
  DEFAULT_BANGLADESH_COORDS 
} from '../../utils/geolocation';
import { 
  MapPin, 
  Hospital, 
  Flame, 
  Navigation, 
  Layers, 
  Phone, 
  UserCheck, 
  ExternalLink,
  ShieldAlert,
  Search,
  CheckCircle2,
  Users,
  Compass,
  MessageCircle,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  List,
  Map as MapIcon
} from 'lucide-react';

interface InteractiveMapViewProps {
  lang: Language;
  onOpenSOSWizard: () => void;
  onStartChatWithDonor?: (donorName: string, bloodGroup: BloodGroup, phone?: string) => void;
}

interface MapLocation {
  id: string;
  name: string;
  type: 'DONOR' | 'SOS' | 'HOSPITAL';
  bloodGroup: BloodGroup;
  donorName?: string;
  division: string;
  district: string;
  distance: string;
  phone: string;
  units?: number;
  available: boolean;
  xPercent: number; // Bangladesh coordinate on map canvas
  yPercent: number;
}

const LOCATIONS: MapLocation[] = [
  // Dhaka Division
  {
    id: 'loc-1',
    name: 'ঢাকা মেডিকেল কলেজ হাসপাতাল (DMCH)',
    type: 'SOS',
    bloodGroup: 'O-',
    units: 2,
    division: 'dhaka',
    district: 'শাহবাগ, ঢাকা',
    distance: '১.২ কিমি',
    phone: '+8801711223344',
    available: true,
    xPercent: 50,
    yPercent: 48,
  },
  {
    id: 'loc-2',
    name: 'কামাল হোসেন (স্বেচ্ছাসেবী রক্তদাতা)',
    type: 'DONOR',
    donorName: 'কামাল হোসেন',
    bloodGroup: 'B+',
    division: 'dhaka',
    district: 'ধানমন্ডি ২৭, ঢাকা',
    distance: '১.৮ কিমি',
    phone: '+8801822334455',
    available: true,
    xPercent: 47,
    yPercent: 46,
  },
  {
    id: 'loc-3',
    name: 'বঙ্গবন্ধু শেখ মুজিব মেডিকেল বিশ্ববিদ্যালয় (BSMMU)',
    type: 'HOSPITAL',
    bloodGroup: 'A+',
    units: 4,
    division: 'dhaka',
    district: 'শাহবাগ, ঢাকা',
    distance: '২.০ কিমি',
    phone: '+8801933445566',
    available: true,
    xPercent: 52,
    yPercent: 45,
  },
  {
    id: 'loc-4',
    name: 'তানভীর আহমেদ (জরুরি প্রস্তুত রক্তদাতা)',
    type: 'DONOR',
    donorName: 'তানভীর আহমেদ',
    bloodGroup: 'O+',
    division: 'dhaka',
    district: 'মিরপুর ১০, ঢাকা',
    distance: '৩.৫ কিমি',
    phone: '+8801712345678',
    available: true,
    xPercent: 46,
    yPercent: 40,
  },
  {
    id: 'loc-5',
    name: 'কুর্মিটোলা জেনারেল হাসপাতাল',
    type: 'HOSPITAL',
    bloodGroup: 'AB+',
    units: 3,
    division: 'dhaka',
    district: 'ক্যান্টনমেন্ট, ঢাকা',
    distance: '৫.১ কিমি',
    phone: '+8801769010200',
    available: true,
    xPercent: 51,
    yPercent: 37,
  },
  {
    id: 'loc-6',
    name: 'ডা. ফারহানা আক্তার (প্রস্তুত রক্তদাতা)',
    type: 'DONOR',
    donorName: 'ডা. ফারহানা আক্তার',
    bloodGroup: 'A+',
    division: 'dhaka',
    district: 'উত্তরা সেক্টর ৭, ঢাকা',
    distance: '৬.৪ কিমি',
    phone: '+8801755667788',
    available: true,
    xPercent: 51,
    yPercent: 32,
  },

  // Chattogram Division
  {
    id: 'loc-7',
    name: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল (CMCH)',
    type: 'SOS',
    bloodGroup: 'B-',
    units: 3,
    division: 'chattogram',
    district: 'পাঁচলাইশ, চট্টগ্রাম',
    distance: '২৪ কিমি',
    phone: '+8801822334455',
    available: true,
    xPercent: 78,
    yPercent: 68,
  },
  {
    id: 'loc-8',
    name: 'শাকিল চৌধুরী (স্বেচ্ছাসেবী রক্তদাতা)',
    type: 'DONOR',
    donorName: 'শাকিল চৌধুরী',
    bloodGroup: 'O-',
    division: 'chattogram',
    district: 'আগ্রাবাদ, চট্টগ্রাম',
    distance: '২৭ কিমি',
    phone: '+8801819998877',
    available: true,
    xPercent: 75,
    yPercent: 71,
  },

  // Sylhet Division
  {
    id: 'loc-9',
    name: 'সিলেট এম এ জি ওসমানী মেডিকেল কলেজ',
    type: 'HOSPITAL',
    bloodGroup: 'AB-',
    units: 2,
    division: 'sylhet',
    district: 'সিলেট সদর',
    distance: '১৯০ কিমি',
    phone: '+8801744556677',
    available: true,
    xPercent: 78,
    yPercent: 28,
  },
  {
    id: 'loc-10',
    name: 'মাহিমা তাসনিম (প্রস্তুত ডোনার)',
    type: 'DONOR',
    donorName: 'মাহিমা তাসনিম',
    bloodGroup: 'A-',
    division: 'sylhet',
    district: 'জিন্দাবাজার, সিলেট',
    distance: '১৯২ কিমি',
    phone: '+8801711002233',
    available: true,
    xPercent: 81,
    yPercent: 26,
  },

  // Rajshahi Division
  {
    id: 'loc-11',
    name: 'রাজশাহী মেডিকেল কলেজ হাসপাতাল (RMCH)',
    type: 'HOSPITAL',
    bloodGroup: 'B+',
    units: 5,
    division: 'rajshahi',
    district: 'বোয়ালিয়া, রাজশাহী',
    distance: '২২০ কিমি',
    phone: '+8801552345678',
    available: true,
    xPercent: 26,
    yPercent: 36,
  },

  // Khulna Division
  {
    id: 'loc-12',
    name: 'খুলনা মেডিকেল কলেজ হাসপাতাল',
    type: 'SOS',
    bloodGroup: 'O+',
    units: 2,
    division: 'khulna',
    district: 'খুলনা সদর',
    distance: '১৮০ কিমি',
    phone: '+8801715667788',
    available: true,
    xPercent: 35,
    yPercent: 66,
  },
];

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  lang,
  onOpenSOSWizard,
  onStartChatWithDonor,
}) => {
  const [userCoords, setUserCoords] = useState<Coordinates>(DEFAULT_BANGLADESH_COORDS);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);

  useEffect(() => {
    requestRealDeviceGPS().then((coords) => {
      setUserCoords(coords);
      setIsGpsActive(true);
    });
  }, []);

  const [selectedLoc, setSelectedLoc] = useState<MapLocation>(LOCATIONS[0]);
  const [filterType, setFilterType] = useState<'ALL' | 'DONOR' | 'SOS' | 'HOSPITAL'>('ALL');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Compute live distances from user's actual GPS coordinates
  const computedLocations = React.useMemo(() => {
    return LOCATIONS.map((loc) => {
      const targetCoord = DISTRICT_COORDINATES[loc.division] || DEFAULT_BANGLADESH_COORDS;
      const km = calculateHaversineDistance(userCoords, targetCoord);
      return {
        ...loc,
        computedDistance: km > 0 ? formatDistance(km, lang) : loc.distance,
      };
    });
  }, [userCoords, lang]);

  const filteredLocations = computedLocations.filter((l) => {
    if (filterType === 'SOS' && l.type !== 'SOS') return false;
    if (filterType === 'HOSPITAL' && l.type !== 'HOSPITAL') return false;
    if (filterType === 'DONOR' && l.type !== 'DONOR') return false;
    
    // Blood group filter
    if (selectedBloodGroup !== 'ALL' && l.bloodGroup !== selectedBloodGroup) {
      return false;
    }

    // Division filter
    if (selectedDivision !== 'ALL' && l.division !== selectedDivision) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match = l.name.toLowerCase().includes(q) || l.district.toLowerCase().includes(q) || l.bloodGroup.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(2.2, Math.max(0.8, prev + delta)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div className="space-y-3.5 text-left pb-10">
      {/* 1. Header Bar with Search & Filters */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                {lang === 'bn' ? 'বাংলাদেশ রক্তদাতা ও হাসপাতাল লাইভ ম্যাপ' : 'Interactive Blood Network Map'}
              </h2>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {lang === 'bn' ? 'আশপাশের রক্তের কেন্দ্র ও প্রস্তুত ডোনার' : 'Live GPS positions of nearby donors & hospitals'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer border border-slate-300 dark:border-slate-700 flex items-center gap-1"
              title="ম্যাপ ও লিস্ট ভিউ পরিবর্তন"
            >
              {viewMode === 'map' ? <List className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
              <span className="hidden sm:inline">{viewMode === 'map' ? 'লিস্ট ভিউ' : 'ম্যাপ ভিউ'}</span>
            </button>

            <button
              onClick={onOpenSOSWizard}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow cursor-pointer whitespace-nowrap"
            >
              + SOS আবেদন
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'হাসপাতাল, এলাকা বা রক্তের গ্রুপ দিয়ে খুঁজুন...' : 'Search hospital, area or blood group...'}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Blood Group Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {['ALL', 'A+', 'B+', 'O+', 'AB+', 'O-', 'B-', 'A-', 'AB-'].map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedBloodGroup(grp)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedBloodGroup === grp
                  ? 'bg-rose-600 text-white shadow-xs scale-102'
                  : 'bg-slate-100 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {grp === 'ALL' ? (lang === 'bn' ? 'সকল গ্রুপ' : 'All') : grp}
            </button>
          ))}
        </div>

        {/* Category Filters & Division Filter */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pt-0.5">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: lang === 'bn' ? 'সব পিন' : 'All' },
              { id: 'DONOR', label: lang === 'bn' ? '🩸 রক্তদাতা' : 'Donors' },
              { id: 'SOS', label: lang === 'bn' ? '🚨 জরুরি রিকোয়েস্ট' : 'SOS' },
              { id: 'HOSPITAL', label: lang === 'bn' ? '🏥 হাসপাতাল' : 'Hospitals' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilterType(item.id as any)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  filterType === item.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Division Selector */}
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            className="px-2 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">{lang === 'bn' ? 'সব বিভাগ' : 'All Divisions'}</option>
            <option value="dhaka">ঢাকা</option>
            <option value="chattogram">চট্টগ্রাম</option>
            <option value="sylhet">সিলেট</option>
            <option value="rajshahi">রাজশাহী</option>
            <option value="khulna">খুলনা</option>
          </select>
        </div>
      </div>

      {/* 2. MAP VIEWPORT CANVAS OR LIST VIEW */}
      {viewMode === 'map' ? (
        <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-300 dark:border-slate-700 relative h-[440px] bg-[#080d1a] flex flex-col justify-between select-none">
          {/* Ambient Map Grid & Radar Scanner Wave */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e11d48_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />

          {/* Bangladesh Geographical Silhouette SVG Backdrop */}
          <svg
            className="absolute inset-0 w-full h-full opacity-15 text-rose-500 pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M 25 20 Q 40 10 60 15 Q 75 12 85 22 Q 90 35 80 45 Q 85 60 80 75 Q 70 85 55 90 Q 40 92 30 75 Q 20 60 25 45 Z"
              fill="currentColor"
            />
          </svg>

          {/* Top Info Bar & Zoom Controls */}
          <div className="relative z-10 p-3 flex items-center justify-between text-xs">
            <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-white flex items-center gap-2 font-mono shadow">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold">{filteredLocations.length}টি লাইভ পয়েন্ট</span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700 text-white shadow">
              <button
                onClick={() => handleZoom(0.2)}
                className="p-1 hover:bg-slate-800 rounded cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom(-0.2)}
                className="p-1 hover:bg-slate-800 rounded cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 hover:bg-slate-800 rounded cursor-pointer"
                title="Reset zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Scalable Map Pins Canvas */}
          <div 
            className="relative flex-1 w-full h-full transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            {filteredLocations.map((loc) => {
              const isSelected = loc.id === selectedLoc.id;
              return (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLoc(loc)}
                  style={{ left: `${loc.xPercent}%`, top: `${loc.yPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
                >
                  {/* Pulsing beacon ring for SOS & Emergency cases */}
                  {loc.type === 'SOS' && (
                    <span className="absolute -inset-3 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
                  )}

                  {/* Pin Droplet */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shadow-2xl transition-all group-hover:scale-125 ${
                      isSelected
                        ? 'bg-rose-600 text-white ring-4 ring-white dark:ring-slate-900 scale-120 z-30'
                        : loc.type === 'SOS'
                        ? 'bg-red-600 text-white ring-2 ring-red-300'
                        : loc.type === 'DONOR'
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                        : 'bg-blue-600 text-white ring-2 ring-blue-300'
                    }`}
                  >
                    {loc.type === 'HOSPITAL' ? (
                      <Hospital className="w-4 h-4 text-white" />
                    ) : (
                      <span>{loc.bloodGroup}</span>
                    )}
                  </div>

                  {/* Pin Tooltip */}
                  <div className="absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-white bg-slate-900/90 px-2 py-0.5 rounded shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-40">
                    {loc.name.split(' ')[0]} ({(loc as any).computedDistance || loc.distance})
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Bottom Selected Location Interactive Action Card */}
          {selectedLoc && (
            <div className="relative z-30 p-3.5 m-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-white space-y-2.5 shadow-2xl animate-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base text-white shrink-0 shadow-md ${
                    selectedLoc.type === 'DONOR' 
                      ? 'bg-emerald-600' 
                      : selectedLoc.type === 'SOS' 
                      ? 'bg-red-600' 
                      : 'bg-blue-600'
                  }`}>
                    {selectedLoc.type === 'HOSPITAL' ? (
                      <Hospital className="w-5 h-5 text-white" />
                    ) : (
                      selectedLoc.bloodGroup
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-white truncate max-w-[210px]">
                        {selectedLoc.name}
                      </h4>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        selectedLoc.type === 'SOS'
                          ? 'bg-red-600 text-white'
                          : selectedLoc.type === 'DONOR'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 text-white'
                      }`}>
                        {selectedLoc.type === 'SOS' ? 'জরুরি SOS' : selectedLoc.type === 'DONOR' ? 'রক্তদাতা' : 'হাসপাতাল'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">{selectedLoc.district}</span>
                      <span>·</span>
                      <strong className="text-emerald-400 font-mono">{(selectedLoc as any).computedDistance || selectedLoc.distance} দূরে</strong>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-mono">
                    গ্রুপ: <strong className="text-rose-400">{selectedLoc.bloodGroup}</strong>
                  </span>
                  {selectedLoc.units && (
                    <span className="text-[10px] text-emerald-400 block font-mono">
                      {selectedLoc.units} ব্যাগ প্রয়োজন
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Direct Call & Direct Chat */}
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <a
                  href={`tel:${selectedLoc.phone}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all active:scale-98"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'সরাসরি কল দিন' : 'Call Now'}</span>
                </a>

                {onStartChatWithDonor && (
                  <button
                    type="button"
                    onClick={() => onStartChatWithDonor(
                      selectedLoc.donorName || selectedLoc.name,
                      selectedLoc.bloodGroup,
                      selectedLoc.phone
                    )}
                    className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow cursor-pointer transition-all active:scale-98"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'চ্যাট করুন' : 'Chat'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* LIST VIEW ALTERNATIVE */
        <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white pb-2 border-b border-slate-200 dark:border-slate-700">
            {lang === 'bn' ? 'নিকটবর্তী রক্তদাতা ও হাসপাতালের দূরত্ব তালিকা' : 'Nearby Blood Donors & Centers by Distance'}
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLocations.map((loc) => (
              <div key={loc.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${
                    loc.type === 'DONOR' ? 'bg-emerald-600' : loc.type === 'SOS' ? 'bg-red-600' : 'bg-blue-600'
                  }`}>
                    {loc.bloodGroup}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block truncate">
                      {loc.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                      {loc.district} · <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{loc.distance}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`tel:${loc.phone}`}
                    className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 cursor-pointer"
                    title="Call"
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  {onStartChatWithDonor && (
                    <button
                      onClick={() => onStartChatWithDonor(loc.donorName || loc.name, loc.bloodGroup, loc.phone)}
                      className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
                      title="Chat"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
