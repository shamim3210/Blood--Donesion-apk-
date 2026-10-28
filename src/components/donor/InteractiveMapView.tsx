import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { BloodGroup, Language, Donor, BloodRequest } from '../../types';
import {
  isSeedDonorId,
  isSeedRequestId,
  evictSeedsProgressively,
} from '../../data/mockDonors';
import { DIVISIONS } from '../../data/bangladeshGeo';
import {
  requestRealDeviceGPS,
  requestFreshHighAccuracyGPS,
  calculateHaversineDistance,
  formatDistance,
  resolveBangladeshCoordinates,
  DIVISION_COORDINATES,
  Coordinates,
  DEFAULT_BANGLADESH_COORDS,
} from '../../utils/geolocation';
import {
  MapPin,
  Hospital,
  Navigation,
  Phone,
  ExternalLink,
  Search,
  Compass,
  MessageCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  List,
  Map as MapIcon,
  LocateFixed,
  Layers,
} from 'lucide-react';

interface InteractiveMapViewProps {
  lang: Language;
  donors?: Donor[];
  requests?: BloodRequest[];
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
  phone: string;
  units?: number;
  available: boolean;
  lat: number;
  lng: number;
}

interface ComputedMapLocation extends MapLocation {
  distanceKm: number;
  computedDistance: string;
}

type TileLayerStyle = 'osm' | 'voyager' | 'dark';

const TILE_LAYER_CONFIGS: Record<
  TileLayerStyle,
  { url: string; attribution: string; labelBn: string; labelEn: string }
> = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap',
    labelBn: 'স্ট্রিট ম্যাপ',
    labelEn: 'Street',
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    labelBn: 'ক্লিন লাইট',
    labelEn: 'Clean',
  },
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    labelBn: 'ডার্ক রাডার',
    labelEn: 'Dark',
  },
};

// Verified Government Medical College Hospitals (All 8 Divisions) + Initial Seed Pins
const BASE_LOCATIONS: MapLocation[] = [
  // Verified Hospitals across all 8 Divisions of Bangladesh
  {
    id: 'hosp-dmch',
    name: 'ঢাকা মেডিকেল কলেজ হাসপাতাল (DMCH ব্লাড ব্যাংক)',
    type: 'HOSPITAL',
    bloodGroup: 'O+',
    units: 6,
    division: 'dhaka',
    district: 'শাহবাগ, ঢাকা',
    phone: '+880255165088',
    available: true,
    lat: 23.7260,
    lng: 90.3976,
  },
  {
    id: 'hosp-bsmmu',
    name: 'বঙ্গবন্ধু শেখ মুজিব মেডিকেল বিশ্ববিদ্যালয় (BSMMU / পিজি)',
    type: 'HOSPITAL',
    bloodGroup: 'A+',
    units: 4,
    division: 'dhaka',
    district: 'শাহবাগ, ঢাকা',
    phone: '+880255165760',
    available: true,
    lat: 23.7389,
    lng: 90.3958,
  },
  {
    id: 'hosp-kurmitola',
    name: 'কুর্মিটোলা জেনারেল হাসপাতাল',
    type: 'HOSPITAL',
    bloodGroup: 'AB+',
    units: 3,
    division: 'dhaka',
    district: 'ক্যান্টনমেন্ট, ঢাকা',
    phone: '+880255062388',
    available: true,
    lat: 23.8191,
    lng: 90.4079,
  },
  {
    id: 'hosp-cmch',
    name: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল (CMCH)',
    type: 'HOSPITAL',
    bloodGroup: 'B+',
    units: 5,
    division: 'chattogram',
    district: 'পাঁচলাইশ, চট্টগ্রাম',
    phone: '+88031619400',
    available: true,
    lat: 22.3593,
    lng: 91.8308,
  },
  {
    id: 'hosp-somch',
    name: 'সিলেট এম এ জি ওসমানী মেডিকেল কলেজ হাসপাতাল',
    type: 'HOSPITAL',
    bloodGroup: 'AB-',
    units: 2,
    division: 'sylhet',
    district: 'কাজলশাহ, সিলেট সদর',
    phone: '+880821713667',
    available: true,
    lat: 24.9006,
    lng: 91.8546,
  },
  {
    id: 'hosp-rmch',
    name: 'রাজশাহী মেডিকেল কলেজ হাসপাতাল (RMCH)',
    type: 'HOSPITAL',
    bloodGroup: 'B+',
    units: 5,
    division: 'rajshahi',
    district: 'লক্ষ্মীপুর, রাজশাহী',
    phone: '+880721776001',
    available: true,
    lat: 24.3720,
    lng: 88.5866,
  },
  {
    id: 'hosp-kmch',
    name: 'খুলনা মেডিকেল কলেজ হাসপাতাল',
    type: 'HOSPITAL',
    bloodGroup: 'O+',
    units: 3,
    division: 'khulna',
    district: 'সোনাডাঙ্গা, খুলনা',
    phone: '+88041760350',
    available: true,
    lat: 22.8286,
    lng: 89.5378,
  },
  {
    id: 'hosp-sbhmch',
    name: 'শের-ই-বাংলা মেডিকেল কলেজ হাসপাতাল (বরিশাল)',
    type: 'HOSPITAL',
    bloodGroup: 'A+',
    units: 4,
    division: 'barishal',
    district: 'বান্দ রোড, বরিশাল সদর',
    phone: '+8804312173547',
    available: true,
    lat: 22.6869,
    lng: 90.3612,
  },
  {
    id: 'hosp-rpmch',
    name: 'রংপুর মেডিকেল কলেজ হাসপাতাল',
    type: 'HOSPITAL',
    bloodGroup: 'O-',
    units: 2,
    division: 'rangpur',
    district: 'ধাপ, রংপুর সদর',
    phone: '+88052162288',
    available: true,
    lat: 25.7647,
    lng: 89.2602,
  },
  {
    id: 'hosp-mmch',
    name: 'ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল (MMCH)',
    type: 'HOSPITAL',
    bloodGroup: 'B-',
    units: 3,
    division: 'mymensingh',
    district: 'চরপাড়া, ময়মনসিংহ সদর',
    phone: '+8809166063',
    available: true,
    lat: 24.7429,
    lng: 90.4094,
  },
];

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createPinDivIcon(loc: ComputedMapLocation, isSelected: boolean): L.DivIcon {
  const safeGroup = escapeHtml(loc.bloodGroup);
  const bgClass = isSelected
    ? 'bg-rose-600 ring-4 ring-white shadow-2xl scale-125'
    : loc.type === 'SOS'
      ? 'bg-red-600 ring-2 ring-red-200 shadow-lg'
      : loc.type === 'DONOR'
        ? 'bg-emerald-600 ring-2 ring-emerald-200 shadow-lg'
        : 'bg-blue-600 ring-2 ring-blue-200 shadow-lg';

  const pulseHtml =
    loc.type === 'SOS' || isSelected
      ? `<span class="absolute -inset-2 rounded-full ${
          loc.type === 'SOS' ? 'bg-red-500/45' : 'bg-rose-500/35'
        } animate-ping pointer-events-none"></span>`
      : '';

  const innerLabel =
    loc.type === 'HOSPITAL'
      ? `<span class="text-[11px] font-black tracking-tight">🏥${safeGroup}</span>`
      : `<span class="text-xs font-black tracking-tight">${safeGroup}</span>`;

  return L.divIcon({
    className: 'bsbd-leaflet-pin',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    html: `
      <div class="relative w-10 h-10 flex items-center justify-center select-none">
        ${pulseHtml}
        <div class="relative z-10 px-2 h-9 min-w-[36px] rounded-2xl text-white flex items-center justify-center transition-transform ${bgClass}">
          ${innerLabel}
        </div>
      </div>
    `,
  });
}

function createUserGpsIcon(): L.DivIcon {
  return L.divIcon({
    className: 'bsbd-leaflet-pin',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `
      <div class="relative w-7 h-7 flex items-center justify-center">
        <span class="absolute inset-0 rounded-full bg-sky-500/45 animate-ping"></span>
        <span class="relative z-10 w-4 h-4 rounded-full bg-sky-600 border-2 border-white shadow-md"></span>
      </div>
    `,
  });
}

export const InteractiveMapView: React.FC<InteractiveMapViewProps> = ({
  lang,
  donors = [],
  requests = [],
  onOpenSOSWizard,
  onStartChatWithDonor,
}) => {
  const [userCoords, setUserCoords] = useState<Coordinates>(DEFAULT_BANGLADESH_COORDS);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);

  const [selectedLocId, setSelectedLocId] = useState<string>(BASE_LOCATIONS[0].id);
  const [filterType, setFilterType] = useState<'ALL' | 'DONOR' | 'SOS' | 'HOSPITAL'>('ALL');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('ALL');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [tileStyle, setTileStyle] = useState<TileLayerStyle>('osm');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    requestRealDeviceGPS().then((coords) => {
      setUserCoords(coords);
      const isCustom =
        Math.abs(coords.latitude - DEFAULT_BANGLADESH_COORDS.latitude) > 0.0005 ||
        Math.abs(coords.longitude - DEFAULT_BANGLADESH_COORDS.longitude) > 0.0005;
      if (isCustom) {
        setIsGpsActive(true);
      }
    });
  }, []);

  // Build real Donor & SOS pins across all 64 districts + progressively evict seed pins 1-by-1
  const computedLocations = useMemo<ComputedMapLocation[]>(() => {
    const verifiedHospitals = BASE_LOCATIONS.filter((l) => l.type === 'HOSPITAL');
    const seedDonorAndSosPins = BASE_LOCATIONS.filter((l) => l.type !== 'HOSPITAL');

    const realDynamicPins: MapLocation[] = [];

    requests
      .filter((r) => !isSeedRequestId(r.id) && r.status === 'ACTIVE')
      .forEach((r) => {
        const divKey = (r.division || 'dhaka').toLowerCase();
        const coords = resolveBangladeshCoordinates({
          district: r.district,
          upazila: r.upazila,
          division: divKey,
          seedKey: `sos-${r.id}`,
        });
        realDynamicPins.push({
          id: `real-map-sos-${r.id}`,
          name: r.hospitalName,
          type: 'SOS',
          bloodGroup: r.bloodGroup,
          units: Math.max(1, r.unitsNeeded - r.unitsCollected),
          division: divKey,
          district: r.upazila ? `${r.upazila}, ${r.district}` : r.district,
          phone: r.contactPhone || '+8801700000000',
          available: true,
          lat: coords.latitude,
          lng: coords.longitude,
        });
      });

    donors
      .filter((d) => !isSeedDonorId(d.id) && d.available)
      .forEach((d) => {
        const divKey = (d.division || 'dhaka').toLowerCase();
        const coords = resolveBangladeshCoordinates({
          district: d.district,
          upazila: d.upazila,
          division: divKey,
          seedKey: `donor-${d.id}`,
        });
        realDynamicPins.push({
          id: `real-map-donor-${d.id}`,
          name: `${d.name} (${lang === 'bn' ? 'প্রস্তুত রক্তদাতা' : 'Ready Donor'})`,
          donorName: d.name,
          type: 'DONOR',
          bloodGroup: d.bloodGroup,
          division: divKey,
          district: d.upazila ? `${d.upazila}, ${d.district}` : d.district,
          phone: d.phone,
          available: d.available,
          lat: coords.latitude,
          lng: coords.longitude,
        });
      });

    const activePeoplePins = evictSeedsProgressively(realDynamicPins, seedDonorAndSosPins);
    const merged = [...activePeoplePins, ...verifiedHospitals];

    return merged
      .map((loc) => {
        const km = calculateHaversineDistance(userCoords, {
          latitude: loc.lat,
          longitude: loc.lng,
        });
        return {
          ...loc,
          distanceKm: km,
          computedDistance: formatDistance(km, lang),
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userCoords, lang, donors, requests]);

  const filteredLocations = useMemo(() => {
    return computedLocations.filter((l) => {
      if (filterType !== 'ALL' && l.type !== filterType) return false;
      if (selectedBloodGroup !== 'ALL' && l.bloodGroup !== selectedBloodGroup) return false;
      if (selectedDivision !== 'ALL' && l.division !== selectedDivision) return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const match =
          l.name.toLowerCase().includes(q) ||
          l.district.toLowerCase().includes(q) ||
          l.bloodGroup.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [computedLocations, filterType, selectedBloodGroup, selectedDivision, searchQuery]);

  const selectedLoc: ComputedMapLocation | null =
    filteredLocations.find((l) => l.id === selectedLocId) ||
    filteredLocations[0] ||
    computedLocations[0] ||
    null;

  // Initialize real Leaflet Map instance when viewMode === 'map'
  useEffect(() => {
    if (viewMode !== 'map' || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const bangladeshBounds = L.latLngBounds(
      L.latLng(20.35, 87.8),
      L.latLng(26.85, 92.95)
    );

    const map = L.map(mapContainerRef.current, {
      center: [23.75, 90.39],
      zoom: 7,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
      maxBounds: bangladeshBounds.pad(0.25),
      maxBoundsViscosity: 0.7,
    });

    const cfg = TILE_LAYER_CONFIGS[tileStyle];
    const baseTiles = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const userGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = baseTiles;
    markersLayerRef.current = markersGroup;
    userMarkerLayerRef.current = userGroup;

    // Ensure tiles never appear half-blank when switching tabs or resizing mobile screens
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      window.clearTimeout(timer);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      markersLayerRef.current = null;
      userMarkerLayerRef.current = null;
    };
  }, [viewMode]);

  // Swap tile layer seamlessly when user changes Street / Clean / Dark style
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const cfg = TILE_LAYER_CONFIGS[tileStyle];
    tileLayerRef.current = L.tileLayer(cfg.url, {
      attribution: cfg.attribution,
      maxZoom: 19,
    }).addTo(map);
  }, [tileStyle]);

  // Sync user's live GPS marker & accuracy circle on the map
  useEffect(() => {
    const userGroup = userMarkerLayerRef.current;
    if (!userGroup) return;
    userGroup.clearLayers();

    if (isGpsActive) {
      L.circle([userCoords.latitude, userCoords.longitude], {
        radius: 650,
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.14,
        weight: 1.5,
      }).addTo(userGroup);

      const meMarker = L.marker([userCoords.latitude, userCoords.longitude], {
        icon: createUserGpsIcon(),
        zIndexOffset: 900,
      });
      meMarker.bindTooltip(
        lang === 'bn' ? 'আপনার বর্তমান জিপিএস লোকেশন' : 'Your Live GPS Position',
        { direction: 'top', offset: [0, -10] }
      );
      meMarker.addTo(userGroup);
    }
  }, [userCoords, isGpsActive, viewMode, lang]);

  // Render real geographic markers for all filtered donors, SOS requests & hospitals
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    filteredLocations.forEach((loc) => {
      const isSelected = loc.id === selectedLoc?.id;
      const marker = L.marker([loc.lat, loc.lng], {
        icon: createPinDivIcon(loc, isSelected),
        zIndexOffset: isSelected ? 1000 : loc.type === 'SOS' ? 600 : 200,
      });

      marker.bindTooltip(`${loc.name} (${loc.computedDistance})`, {
        direction: 'top',
        offset: [0, -18],
      });

      marker.on('click', () => {
        setSelectedLocId(loc.id);
        map.flyTo([loc.lat, loc.lng], Math.max(map.getZoom(), 12), {
          duration: 0.75,
        });
      });

      marker.addTo(markersGroup);
    });
  }, [filteredLocations, selectedLoc?.id, viewMode]);

  // Fly smoothly when user selects a division from the dropdown
  const handleDivisionChange = (divId: string) => {
    setSelectedDivision(divId);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (divId === 'ALL') {
      map.flyTo([23.75, 90.35], 7, { duration: 0.9 });
    } else {
      const target = DIVISION_COORDINATES[divId];
      if (target) {
        map.flyTo([target.latitude, target.longitude], target.zoom, { duration: 0.9 });
      }
    }
  };

  const handleLocateMe = async () => {
    setIsLocatingGps(true);
    try {
      const res = await requestFreshHighAccuracyGPS();
      setUserCoords(res.coords);
      setIsGpsActive(true);
      if (viewMode !== 'map') {
        setViewMode('map');
      }
      setTimeout(() => {
        mapInstanceRef.current?.flyTo(
          [res.coords.latitude, res.coords.longitude],
          res.isRealGps ? 13 : 11,
          { duration: 1.0 }
        );
      }, 80);
    } finally {
      setIsLocatingGps(false);
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetBangladeshView = () => {
    setSelectedDivision('ALL');
    mapInstanceRef.current?.flyTo([23.75, 90.35], 7, { duration: 0.85 });
  };

  const handleFocusLocationFromList = (loc: ComputedMapLocation) => {
    setSelectedLocId(loc.id);
    setViewMode('map');
    setTimeout(() => {
      mapInstanceRef.current?.flyTo([loc.lat, loc.lng], 14, { duration: 0.9 });
    }, 120);
  };

  const cycleTileStyle = () => {
    setTileStyle((prev) => (prev === 'osm' ? 'voyager' : prev === 'voyager' ? 'dark' : 'osm'));
  };

  return (
    <div className="space-y-3.5 text-left pb-10">
      {/* 1. Header Bar with Search, GPS Locate & 8-Division Filters */}
      <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-3.5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-red-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                {lang === 'bn'
                  ? 'বাংলাদেশ ৬৪ জেলা লাইভ রক্তদাতা ও হাসপাতাল ম্যাপ'
                  : 'Bangladesh 64-District Live Blood & Hospital Map'}
              </h2>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {lang === 'bn'
                  ? 'আসল রাস্তার ম্যাপে জুম/ড্র্যাগ করুন ও ১-ক্লিকে ডিরেকশন নিন'
                  : 'Zoom, pan real streets & open turn-by-turn navigation'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocatingGps}
              className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold cursor-pointer border border-sky-200 dark:border-sky-800 flex items-center gap-1"
              title={lang === 'bn' ? 'আমার বর্তমান জিপিএস লোকেশন খুঁজুন' : 'Find my live GPS location'}
            >
              <LocateFixed className={`w-3.5 h-3.5 ${isLocatingGps ? 'animate-spin' : ''}`} />
              <span>{lang === 'bn' ? 'আমার লোকেশন' : 'My GPS'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer border border-slate-300 dark:border-slate-700 flex items-center gap-1"
              title="ম্যাপ ও লিস্ট ভিউ পরিবর্তন"
            >
              {viewMode === 'map' ? <List className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {viewMode === 'map'
                  ? lang === 'bn'
                    ? 'লিস্ট ভিউ'
                    : 'List View'
                  : lang === 'bn'
                    ? 'ম্যাপ ভিউ'
                    : 'Map View'}
              </span>
            </button>

            <button
              type="button"
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
            placeholder={
              lang === 'bn'
                ? 'হাসপাতাল, জেলা, এলাকা বা রক্তের গ্রুপ দিয়ে ম্যাপে খুঁজুন...'
                : 'Search hospital, district, area or blood group...'
            }
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Blood Group Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {['ALL', 'A+', 'B+', 'O+', 'AB+', 'O-', 'B-', 'A-', 'AB-'].map((grp) => (
            <button
              key={grp}
              type="button"
              onClick={() => setSelectedBloodGroup(grp)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedBloodGroup === grp
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {grp === 'ALL' ? (lang === 'bn' ? 'সকল গ্রুপ' : 'All Groups') : grp}
            </button>
          ))}
        </div>

        {/* Category Filters & Complete 8-Division Selector */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pt-0.5">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'ALL', label: lang === 'bn' ? 'সব পিন' : 'All Pins' },
              { id: 'DONOR', label: lang === 'bn' ? '🩸 রক্তদাতা' : 'Donors' },
              { id: 'SOS', label: lang === 'bn' ? '🚨 জরুরি SOS' : 'SOS' },
              { id: 'HOSPITAL', label: lang === 'bn' ? '🏥 হাসপাতাল' : 'Hospitals' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilterType(item.id as 'ALL' | 'DONOR' | 'SOS' | 'HOSPITAL')}
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

          {/* All 8 Divisions Selector */}
          <select
            value={selectedDivision}
            onChange={(e) => handleDivisionChange(e.target.value)}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
          >
            <option value="ALL">{lang === 'bn' ? 'সব ৮টি বিভাগ' : 'All 8 Divisions'}</option>
            {DIVISIONS.map((div) => (
              <option key={div.id} value={div.id}>
                {lang === 'bn' ? `${div.nameBn} বিভাগ` : div.nameEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. REAL LEAFLET INTERACTIVE MAP OR SORTED DISTANCE LIST */}
      {viewMode === 'map' ? (
        <div className="space-y-3">
          <div className="rounded-2xl overflow-hidden shadow-md border border-slate-300 dark:border-slate-700 relative h-[430px] sm:h-[490px] bg-slate-100 dark:bg-[#0b0f19]">
            {/* Real Interactive Leaflet Map Canvas */}
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Top Floating Map Controls Overlay */}
            <div className="absolute top-3 left-3 right-3 z-[400] flex items-center justify-between gap-2 pointer-events-none">
              <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white flex items-center gap-2 text-xs shadow-md pointer-events-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold">
                  {lang === 'bn'
                    ? `${filteredLocations.length}টি লাইভ লোকেশন`
                    : `${filteredLocations.length} Live Pins`}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pointer-events-auto">
                <button
                  type="button"
                  onClick={cycleTileStyle}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                  title={lang === 'bn' ? 'ম্যাপের স্টাইল পরিবর্তন করুন' : 'Switch Map Layer'}
                >
                  <Layers className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    {lang === 'bn'
                      ? TILE_LAYER_CONFIGS[tileStyle].labelBn
                      : TILE_LAYER_CONFIGS[tileStyle].labelEn}
                  </span>
                </button>

                <div className="flex items-center gap-0.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700 text-white shadow-md">
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetBangladeshView}
                    className="p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
                    title={lang === 'bn' ? 'পুরো বাংলাদেশ দেখুন' : 'Reset Bangladesh View'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Legend Pill Bar at Bottom-Left of Map */}
            <div className="absolute bottom-3 left-3 z-[400] px-2.5 py-1 rounded-xl bg-slate-900/85 border border-slate-700 text-[11px] text-white flex items-center gap-3 pointer-events-none shadow">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                {lang === 'bn' ? 'জরুরি SOS' : 'SOS'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                {lang === 'bn' ? 'রক্তদাতা' : 'Donor'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                {lang === 'bn' ? 'হাসপাতাল' : 'Hospital'}
              </span>
            </div>
          </div>

          {/* 3. Selected Location Interactive Action Card */}
          {selectedLoc ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 space-y-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base text-white shrink-0 shadow-sm ${
                      selectedLoc.type === 'DONOR'
                        ? 'bg-emerald-600'
                        : selectedLoc.type === 'SOS'
                          ? 'bg-red-600'
                          : 'bg-blue-600'
                    }`}
                  >
                    {selectedLoc.type === 'HOSPITAL' ? (
                      <Hospital className="w-5 h-5 text-white" />
                    ) : (
                      selectedLoc.bloodGroup
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {selectedLoc.name}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-white ${
                          selectedLoc.type === 'SOS'
                            ? 'bg-red-600'
                            : selectedLoc.type === 'DONOR'
                              ? 'bg-emerald-600'
                              : 'bg-blue-600'
                        }`}
                      >
                        {selectedLoc.type === 'SOS'
                          ? lang === 'bn'
                            ? 'জরুরি SOS'
                            : 'Emergency SOS'
                          : selectedLoc.type === 'DONOR'
                            ? lang === 'bn'
                              ? 'প্রস্তুত রক্তদাতা'
                              : 'Ready Donor'
                            : lang === 'bn'
                              ? 'ভেরিফাইড হাসপাতাল'
                              : 'Verified Hospital'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-1 flex-wrap">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>{selectedLoc.district}</span>
                      <span>·</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {selectedLoc.computedDistance} {lang === 'bn' ? 'দূরে' : 'away'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-slate-600 dark:text-slate-300 block font-mono">
                    {lang === 'bn' ? 'গ্রুপ:' : 'Group:'}{' '}
                    <strong className="text-rose-600 dark:text-rose-400">
                      {selectedLoc.bloodGroup}
                    </strong>
                  </span>
                  {selectedLoc.units && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block font-mono mt-0.5">
                      {selectedLoc.units} {lang === 'bn' ? 'ব্যাগ' : 'units'}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Direct Call, In-App Chat & Turn-by-Turn Google Maps Route */}
              <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-2">
                <a
                  href={`tel:${selectedLoc.phone}`}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'সরাসরি কল' : 'Call Now'}</span>
                </a>

                {onStartChatWithDonor && (
                  <button
                    type="button"
                    onClick={() =>
                      onStartChatWithDonor(
                        selectedLoc.donorName || selectedLoc.name,
                        selectedLoc.bloodGroup,
                        selectedLoc.phone
                      )
                    }
                    className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'চ্যাট করুন' : 'In-App Chat'}</span>
                  </button>
                )}

                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLoc.lat},${selectedLoc.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="col-span-2 sm:col-span-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all border border-slate-700"
                >
                  <Navigation className="w-3.5 h-3.5 text-sky-400" />
                  <span>{lang === 'bn' ? 'Google Maps ডিরেকশন' : 'Directions'}</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500">
              {lang === 'bn'
                ? 'এই ফিল্টারে কোনো লোকেশন পাওয়া যায়নি। অন্য বিভাগ বা গ্রুপ নির্বাচন করুন।'
                : 'No locations match this filter. Try changing division or blood group.'}
            </div>
          )}
        </div>
      ) : (
        /* SORTED DISTANCE LIST VIEW */
        <div className="bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {lang === 'bn'
                ? 'নিকটবর্তী রক্তদাতা ও হাসপাতালের দূরত্ব তালিকা (কাছেরগুলো আগে)'
                : 'Nearby Blood Donors & Hospitals Sorted by Distance'}
            </h3>
            <span className="text-xs font-mono text-slate-500">
              {filteredLocations.length} {lang === 'bn' ? 'টি লোকেশন' : 'items'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLocations.map((loc) => (
              <div key={loc.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 ${
                      loc.type === 'DONOR'
                        ? 'bg-emerald-600'
                        : loc.type === 'SOS'
                          ? 'bg-red-600'
                          : 'bg-blue-600'
                    }`}
                  >
                    {loc.bloodGroup}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block truncate">
                      {loc.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                      {loc.district} ·{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {loc.computedDistance}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleFocusLocationFromList(loc)}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 cursor-pointer"
                    title={lang === 'bn' ? 'ম্যাপে পিন দেখুন' : 'Focus on Map'}
                  >
                    <MapPin className="w-4 h-4 text-rose-500" />
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 hover:bg-sky-100 cursor-pointer"
                    title={lang === 'bn' ? 'Google Maps রুট' : 'Directions'}
                  >
                    <Navigation className="w-4 h-4" />
                  </a>

                  <a
                    href={`tel:${loc.phone}`}
                    className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 cursor-pointer"
                    title="Call"
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  {onStartChatWithDonor && (
                    <button
                      type="button"
                      onClick={() =>
                        onStartChatWithDonor(loc.donorName || loc.name, loc.bloodGroup, loc.phone)
                      }
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
