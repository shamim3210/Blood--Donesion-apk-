// Geolocation and Haversine Distance Utility

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Default Fallback to Central Dhaka (Shahbagh / DMCH area)
export const DEFAULT_BANGLADESH_COORDS: Coordinates = {
  latitude: 23.7260,
  longitude: 90.3976,
};

// District center coordinates for accurate distance calculation across Bangladesh
export const DISTRICT_COORDINATES: Record<string, Coordinates> = {
  dhaka: { latitude: 23.8103, longitude: 90.4125 },
  chittagong: { latitude: 22.3569, longitude: 91.7832 },
  rajshahi: { latitude: 24.3745, longitude: 88.6042 },
  khulna: { latitude: 22.8456, longitude: 89.5403 },
  barisal: { latitude: 22.7010, longitude: 90.3535 },
  sylhet: { latitude: 24.8949, longitude: 91.8687 },
  rangpur: { latitude: 25.7439, longitude: 89.2752 },
  mymensingh: { latitude: 24.7471, longitude: 90.4203 },
  comilla: { latitude: 23.4682, longitude: 91.1788 },
  gazipur: { latitude: 24.0023, longitude: 90.4264 },
  narayanganj: { latitude: 23.6238, longitude: 90.5000 },
  bogra: { latitude: 24.8465, longitude: 89.3770 },
  jessore: { latitude: 23.1664, longitude: 89.2137 },
  dinajpur: { latitude: 25.6217, longitude: 88.6355 },
  tangail: { latitude: 24.2513, longitude: 89.9167 },
  faridpur: { latitude: 23.6071, longitude: 89.8429 },
  coxsbazar: { latitude: 21.4272, longitude: 92.0058 },
  kushtia: { latitude: 23.9013, longitude: 89.1204 },
  noakhali: { latitude: 22.8696, longitude: 91.0991 },
  feni: { latitude: 23.0159, longitude: 91.3976 },
};

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
          pendingGpsPromise = null;
          resolve(coords);
        },
        () => {
          cachedDeviceCoords = DEFAULT_BANGLADESH_COORDS;
          pendingGpsPromise = null;
          resolve(DEFAULT_BANGLADESH_COORDS);
        },
        { enableHighAccuracy: false, maximumAge: 300000, timeout: 3500 }
      );
    } else {
      cachedDeviceCoords = DEFAULT_BANGLADESH_COORDS;
      pendingGpsPromise = null;
      resolve(DEFAULT_BANGLADESH_COORDS);
    }
  });

  return pendingGpsPromise;
}

