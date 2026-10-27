// Geolocation, 64-District Bangladesh Coordinate Resolver & Haversine Distance Utility
import { DISTRICTS } from '../data/bangladeshGeo';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Default Fallback to Central Dhaka (Shahbagh / DMCH / BSMMU Medical Hub)
export const DEFAULT_BANGLADESH_COORDS: Coordinates = {
  latitude: 23.7389,
  longitude: 90.3958,
};

// Division center coordinates + default zoom levels
export const DIVISION_COORDINATES: Record<string, Coordinates & { zoom: number }> = {
  dhaka: { latitude: 23.8103, longitude: 90.4125, zoom: 9 },
  chattogram: { latitude: 22.3569, longitude: 91.7832, zoom: 9 },
  rajshahi: { latitude: 24.3745, longitude: 88.6042, zoom: 9 },
  khulna: { latitude: 22.8456, longitude: 89.5403, zoom: 9 },
  barishal: { latitude: 22.7010, longitude: 90.3535, zoom: 9 },
  sylhet: { latitude: 24.8949, longitude: 91.8687, zoom: 9 },
  rangpur: { latitude: 25.7439, longitude: 89.2752, zoom: 9 },
  mymensingh: { latitude: 24.7471, longitude: 90.4203, zoom: 9 },
};

// Accurate center coordinates for all 64 Districts of Bangladesh + common spelling aliases
export const DISTRICT_COORDINATES: Record<string, Coordinates> = {
  // Dhaka Division (13)
  dhaka: { latitude: 23.7806, longitude: 90.4070 },
  gazipur: { latitude: 24.0023, longitude: 90.4264 },
  narayanganj: { latitude: 23.6238, longitude: 90.5000 },
  tangail: { latitude: 24.2513, longitude: 89.9167 },
  faridpur: { latitude: 23.6071, longitude: 89.8429 },
  kishoreganj: { latitude: 24.4449, longitude: 90.7766 },
  manikganj: { latitude: 23.8644, longitude: 90.0047 },
  munshiganj: { latitude: 23.5422, longitude: 90.5305 },
  narsingdi: { latitude: 23.9322, longitude: 90.7154 },
  gopalganj: { latitude: 23.0051, longitude: 89.8266 },
  madaripur: { latitude: 23.1641, longitude: 90.1897 },
  rajbari: { latitude: 23.7574, longitude: 89.6445 },
  shariatpur: { latitude: 23.2423, longitude: 90.4348 },

  // Chattogram Division (11)
  chattogram: { latitude: 22.3569, longitude: 91.7832 },
  chittagong: { latitude: 22.3569, longitude: 91.7832 },
  coxs_bazar: { latitude: 21.4272, longitude: 92.0058 },
  coxsbazar: { latitude: 21.4272, longitude: 92.0058 },
  cumilla: { latitude: 23.4607, longitude: 91.1809 },
  comilla: { latitude: 23.4607, longitude: 91.1809 },
  feni: { latitude: 23.0159, longitude: 91.3976 },
  brahmanbaria: { latitude: 23.9571, longitude: 91.1119 },
  chandpur: { latitude: 23.2333, longitude: 90.6713 },
  noakhali: { latitude: 22.8696, longitude: 91.0991 },
  lakshmipur: { latitude: 22.9447, longitude: 90.8282 },
  khagrachhari: { latitude: 23.1193, longitude: 91.9847 },
  rangamati: { latitude: 22.6533, longitude: 92.1789 },
  bandarban: { latitude: 22.1953, longitude: 92.2184 },

  // Rajshahi Division (8)
  rajshahi: { latitude: 24.3745, longitude: 88.6042 },
  bogura: { latitude: 24.8465, longitude: 89.3770 },
  bogra: { latitude: 24.8465, longitude: 89.3770 },
  pabna: { latitude: 24.0064, longitude: 89.2372 },
  sirajganj: { latitude: 24.4534, longitude: 89.7007 },
  natore: { latitude: 24.4206, longitude: 89.0003 },
  naogaon: { latitude: 24.7936, longitude: 88.9318 },
  chapainawabganj: { latitude: 24.5965, longitude: 88.2775 },
  joypurhat: { latitude: 25.0968, longitude: 89.0227 },

  // Sylhet Division (4)
  sylhet: { latitude: 24.8949, longitude: 91.8687 },
  moulvibazar: { latitude: 24.4829, longitude: 91.7774 },
  habiganj: { latitude: 24.3749, longitude: 91.4155 },
  sunamganj: { latitude: 25.0658, longitude: 91.3950 },

  // Khulna Division (10)
  khulna: { latitude: 22.8456, longitude: 89.5403 },
  jashore: { latitude: 23.1664, longitude: 89.2137 },
  jessore: { latitude: 23.1664, longitude: 89.2137 },
  satkhira: { latitude: 22.7185, longitude: 89.0705 },
  kushtia: { latitude: 23.9013, longitude: 89.1204 },
  jhenaidah: { latitude: 23.5450, longitude: 89.1726 },
  chuadanga: { latitude: 23.6402, longitude: 88.8418 },
  magura: { latitude: 23.4873, longitude: 89.4199 },
  meherpur: { latitude: 23.7622, longitude: 88.6318 },
  narail: { latitude: 23.1725, longitude: 89.5127 },
  bagerhat: { latitude: 22.6516, longitude: 89.7859 },

  // Barishal Division (6)
  barishal: { latitude: 22.7010, longitude: 90.3535 },
  barisal: { latitude: 22.7010, longitude: 90.3535 },
  patuakhali: { latitude: 22.3596, longitude: 90.3299 },
  bhola: { latitude: 22.6859, longitude: 90.6482 },
  pirojpur: { latitude: 22.5841, longitude: 89.9720 },
  barguna: { latitude: 22.1592, longitude: 90.1256 },
  jhalokati: { latitude: 22.6406, longitude: 90.1987 },

  // Rangpur Division (8)
  rangpur: { latitude: 25.7439, longitude: 89.2752 },
  dinajpur: { latitude: 25.6217, longitude: 88.6355 },
  kurigram: { latitude: 25.8054, longitude: 89.6362 },
  gaibandha: { latitude: 25.3288, longitude: 89.5281 },
  nilphamari: { latitude: 25.9318, longitude: 88.8560 },
  thakurgaon: { latitude: 26.0337, longitude: 88.4617 },
  panchagarh: { latitude: 26.3411, longitude: 88.5542 },
  lalmonirhat: { latitude: 25.9923, longitude: 89.2847 },

  // Mymensingh Division (4)
  mymensingh: { latitude: 24.7471, longitude: 90.4203 },
  jamalpur: { latitude: 24.9375, longitude: 89.9378 },
  netrokona: { latitude: 24.8710, longitude: 90.7279 },
  sherpur: { latitude: 25.0205, longitude: 90.0153 },
};

// Popular sub-district / metro area coordinates for street-level accuracy
const UPAZILA_OR_AREA_COORDINATES: Record<string, Coordinates> = {
  shahbagh: { latitude: 23.7389, longitude: 90.3958 },
  'শাহবাগ': { latitude: 23.7389, longitude: 90.3958 },
  dhanmondi: { latitude: 23.7465, longitude: 90.3760 },
  'ধানমন্ডি': { latitude: 23.7465, longitude: 90.3760 },
  mirpur: { latitude: 23.8071, longitude: 90.3686 },
  'মিরপুর': { latitude: 23.8071, longitude: 90.3686 },
  uttara: { latitude: 23.8759, longitude: 90.3795 },
  'উত্তরা': { latitude: 23.8759, longitude: 90.3795 },
  gulshan: { latitude: 23.7925, longitude: 90.4078 },
  'গুলশান': { latitude: 23.7925, longitude: 90.4078 },
  mohammadpur: { latitude: 23.7662, longitude: 90.3589 },
  'মোহাম্মদপুর': { latitude: 23.7662, longitude: 90.3589 },
  motijheel: { latitude: 23.7330, longitude: 90.4172 },
  'মতিঝিল': { latitude: 23.7330, longitude: 90.4172 },
  savar: { latitude: 23.8583, longitude: 90.2667 },
  'সাভার': { latitude: 23.8583, longitude: 90.2667 },
  keraniganj: { latitude: 23.7112, longitude: 90.3519 },
  'কেরানীগঞ্জ': { latitude: 23.7112, longitude: 90.3519 },
  tongie: { latitude: 23.8915, longitude: 90.4023 },
  'টঙ্গী': { latitude: 23.8915, longitude: 90.4023 },
  panchlaish: { latitude: 22.3614, longitude: 91.8316 },
  'পাঁচলাইশ': { latitude: 22.3614, longitude: 91.8316 },
  agrabad: { latitude: 22.3266, longitude: 91.8117 },
  'আগ্রাবাদ': { latitude: 22.3266, longitude: 91.8117 },
  halishahar: { latitude: 22.3372, longitude: 91.7785 },
  'হালিশহর': { latitude: 22.3372, longitude: 91.7785 },
  subidbazar: { latitude: 24.9096, longitude: 91.8532 },
  'সুবিদবাজার': { latitude: 24.9096, longitude: 91.8532 },
  'জিন্দাবাজার': { latitude: 24.8955, longitude: 91.8692 },
  boalia: { latitude: 24.3712, longitude: 88.6011 },
  'বোয়ালিয়া': { latitude: 24.3712, longitude: 88.6011 },
  sonadanga: { latitude: 22.8172, longitude: 89.5446 },
  'সোনাডাঙ্গা': { latitude: 22.8172, longitude: 89.5446 },
  dhap: { latitude: 25.7634, longitude: 89.2610 },
  'ধাপ': { latitude: 25.7634, longitude: 89.2610 },
  charpara: { latitude: 24.7429, longitude: 90.4094 },
  'চরপাড়া': { latitude: 24.7429, longitude: 90.4094 },
};

// Prebuild Bengali & English lookup map from DISTRICTS
const NORMALIZED_GEO_LOOKUP: Map<string, Coordinates> = (() => {
  const map = new Map<string, Coordinates>();
  Object.entries(DISTRICT_COORDINATES).forEach(([k, v]) => {
    map.set(k.toLowerCase(), v);
  });
  DISTRICTS.forEach((d) => {
    const coord = DISTRICT_COORDINATES[d.id] || DISTRICT_COORDINATES[d.divisionId];
    if (coord) {
      map.set(d.id.toLowerCase(), coord);
      map.set(d.nameEn.toLowerCase(), coord);
      map.set(d.nameBn.trim(), coord);
    }
  });
  return map;
})();

function hashSeedOffset(seed: string): { dLat: number; dLng: number } {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const angle = ((h >>> 0) % 360) * (Math.PI / 180);
  const radius = 0.004 + (((h >>> 8) % 90) / 10000); // ~450m to ~1.4km spread so pins don't overlap
  return {
    dLat: Number((Math.sin(angle) * radius).toFixed(5)),
    dLng: Number((Math.cos(angle) * radius).toFixed(5)),
  };
}

/**
 * Resolves any English ID, English name, or বাংলা district/upazila string to real Bangladesh GPS coordinates.
 */
export function resolveBangladeshCoordinates(params: {
  district?: string;
  upazila?: string;
  division?: string;
  seedKey?: string;
}): Coordinates {
  const combinedText = `${params.upazila || ''} ${params.district || ''}`.trim().toLowerCase();

  // 1. Check neighborhood/upazila match first for city-level precision
  for (const [areaKey, coords] of Object.entries(UPAZILA_OR_AREA_COORDINATES)) {
    if (combinedText.includes(areaKey.toLowerCase())) {
      if (params.seedKey) {
        const { dLat, dLng } = hashSeedOffset(params.seedKey);
        return { latitude: coords.latitude + dLat, longitude: coords.longitude + dLng };
      }
      return coords;
    }
  }

  // 2. Check exact or substring district match (supports বাংলা & English)
  const rawDist = (params.district || '').trim();
  const direct =
    NORMALIZED_GEO_LOOKUP.get(rawDist.toLowerCase()) ||
    NORMALIZED_GEO_LOOKUP.get(rawDist);
  if (direct) {
    if (params.seedKey) {
      const { dLat, dLng } = hashSeedOffset(params.seedKey);
      return { latitude: direct.latitude + dLat, longitude: direct.longitude + dLng };
    }
    return direct;
  }

  for (const d of DISTRICTS) {
    if (
      combinedText.includes(d.id.toLowerCase()) ||
      combinedText.includes(d.nameEn.toLowerCase()) ||
      combinedText.includes(d.nameBn)
    ) {
      const c = DISTRICT_COORDINATES[d.id];
      if (c) {
        if (params.seedKey) {
          const { dLat, dLng } = hashSeedOffset(params.seedKey);
          return { latitude: c.latitude + dLat, longitude: c.longitude + dLng };
        }
        return c;
      }
    }
  }

  // 3. Fallback to division center or central Dhaka
  const divKey = (params.division || 'dhaka').trim().toLowerCase();
  const base =
    DISTRICT_COORDINATES[divKey] ||
    DIVISION_COORDINATES[divKey] ||
    DEFAULT_BANGLADESH_COORDS;

  if (params.seedKey) {
    const { dLat, dLng } = hashSeedOffset(params.seedKey);
    return { latitude: base.latitude + dLat, longitude: base.longitude + dLng };
  }
  return { latitude: base.latitude, longitude: base.longitude };
}

/**
 * Calculate accurate distance in kilometers using the Haversine formula
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Number(distance.toFixed(1));
}

/**
 * Format distance in Bengali or English
 */
export function formatDistance(distanceKm: number, lang: 'bn' | 'en'): string {
  if (lang === 'bn') {
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const formatted = distanceKm
      .toFixed(1)
      .split('')
      .map((char) => (char >= '0' && char <= '9' ? bnDigits[Number(char)] : char))
      .join('');
    return `${formatted} কিমি`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

let cachedDeviceCoords: Coordinates | null = null;
let cachedIsRealGps = false;
let pendingGpsPromise: Promise<Coordinates> | null = null;

/**
 * Request real-time GPS coordinates from device with instant memory cache
 */
export function requestRealDeviceGPS(): Promise<Coordinates> {
  if (cachedDeviceCoords) {
    return Promise.resolve(cachedDeviceCoords);
  }
  if (pendingGpsPromise) {
    return pendingGpsPromise;
  }

  pendingGpsPromise = new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          cachedDeviceCoords = coords;
          cachedIsRealGps = true;
          pendingGpsPromise = null;
          resolve(coords);
        },
        () => {
          cachedDeviceCoords = DEFAULT_BANGLADESH_COORDS;
          cachedIsRealGps = false;
          pendingGpsPromise = null;
          resolve(DEFAULT_BANGLADESH_COORDS);
        },
        { enableHighAccuracy: false, maximumAge: 300000, timeout: 4000 }
      );
    } else {
      cachedDeviceCoords = DEFAULT_BANGLADESH_COORDS;
      cachedIsRealGps = false;
      pendingGpsPromise = null;
      resolve(DEFAULT_BANGLADESH_COORDS);
    }
  });

  return pendingGpsPromise;
}

/**
 * Actively requests high-accuracy live GPS when the user taps "Locate Me" on the map
 */
export function requestFreshHighAccuracyGPS(): Promise<{
  coords: Coordinates;
  isRealGps: boolean;
}> {
  return new Promise((resolve) => {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          cachedDeviceCoords = coords;
          cachedIsRealGps = true;
          resolve({ coords, isRealGps: true });
        },
        () => {
          resolve({
            coords: cachedDeviceCoords || DEFAULT_BANGLADESH_COORDS,
            isRealGps: cachedIsRealGps,
          });
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
      );
    } else {
      resolve({
        coords: DEFAULT_BANGLADESH_COORDS,
        isRealGps: false,
      });
    }
  });
}
