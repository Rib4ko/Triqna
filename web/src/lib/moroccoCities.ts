export interface MoroccanCity {
  name: string;
  nameAr?: string;
  lat: number;
  lng: number;
}

export const MOROCCAN_CITIES: MoroccanCity[] = [
  { name: 'Casablanca', nameAr: 'الدار البيضاء', lat: 33.5731, lng: -7.5898 },
  { name: 'Rabat', nameAr: 'الرباط', lat: 34.0209, lng: -6.8416 },
  { name: 'Marrakech', nameAr: 'مراكش', lat: 31.6295, lng: -7.9811 },
  { name: 'Tangier', nameAr: 'طنجة', lat: 35.7595, lng: -5.8340 },
  { name: 'Agadir', nameAr: 'أكادير', lat: 30.4278, lng: -9.5981 },
  { name: 'Fes', nameAr: 'فاس', lat: 34.0181, lng: -5.0078 },
  { name: 'Meknes', nameAr: 'مكناس', lat: 33.8935, lng: -5.5473 },
  { name: 'Oujda', nameAr: 'وجدة', lat: 34.6867, lng: -1.9114 },
  { name: 'Kenitra', nameAr: 'القنيطرة', lat: 34.2610, lng: -6.5802 },
  { name: 'Tetouan', nameAr: 'تطوان', lat: 35.5889, lng: -5.3626 },
  { name: 'El Jadida', nameAr: 'الجديدة', lat: 33.2316, lng: -8.5007 },
  { name: 'Essaouira', nameAr: 'الصويرة', lat: 31.5085, lng: -9.7595 },
  { name: 'Nador', nameAr: 'الناظور', lat: 35.1688, lng: -2.9335 },
  { name: 'Beni Mellal', nameAr: 'بني ملال', lat: 32.3373, lng: -6.3498 },
  { name: 'Safi', nameAr: 'آسفي', lat: 32.2994, lng: -9.2372 },
  { name: 'Mohammedia', nameAr: 'المحمدية', lat: 33.6866, lng: -7.3829 },
  { name: 'Ouarzazate', nameAr: 'ورزازات', lat: 30.9335, lng: -6.9370 },
  { name: 'Dakhla', nameAr: 'الداخلة', lat: 23.7136, lng: -15.9383 },
  { name: 'Laayoune', nameAr: 'العيون', lat: 27.1536, lng: -13.2033 },
];

export const CITY_NAMES = MOROCCAN_CITIES.map(c => c.name);

export function getCityCoordinates(cityName: string): [number, number] | null {
  if (!cityName) return null;
  const match = MOROCCAN_CITIES.find(
    c => c.name.toLowerCase() === cityName.trim().toLowerCase()
  );
  return match ? [match.lat, match.lng] : null;
}

export interface RouteGeometryInfo {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
}

/**
 * Calculates straight line distance (Haversine formula) in km
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Generates an interpolated trajectory path between 2 points (curved slightly for aesthetic realism)
 */
export function generateCurvedTrajectory(
  start: [number, number],
  end: [number, number],
  numPoints: number = 30
): [number, number][] {
  const points: [number, number][] = [];
  const [lat1, lon1] = start;
  const [lat2, lon2] = end;

  // Midpoint with slight natural curve offset
  const midLat = (lat1 + lat2) / 2 + (lon2 - lon1) * 0.08;
  const midLon = (lon1 + lon2) / 2 - (lat2 - lat1) * 0.08;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Quadratic Bezier interpolation
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * midLat + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lon1 + 2 * (1 - t) * t * midLon + t * t * lon2;
    points.push([lat, lng]);
  }
  return points;
}

/**
 * Fetches accurate driving route from Open Source Routing Machine (OSRM)
 */
export async function fetchOSRMRoute(
  originCoords: [number, number],
  destCoords: [number, number]
): Promise<RouteGeometryInfo> {
  const [lat1, lon1] = originCoords;
  const [lat2, lon2] = destCoords;

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM request failed');
    const data = await res.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      // OSRM returns coordinates in [lon, lat], Leaflet needs [lat, lon]
      const coords: [number, number][] = route.geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]]
      );
      return {
        coordinates: coords,
        distanceKm: Math.round(route.distance / 1000),
        durationMinutes: Math.round(route.duration / 60)
      };
    }
  } catch (e) {
    // Fallback if network or rate limit happens
  }

  // Graceful fallback: Haversine distance and curved trajectory
  const dist = calculateDistanceKm(lat1, lon1, lat2, lon2);
  // Average highway speed ~90 km/h in Morocco
  const duration = Math.round((dist / 90) * 60);

  return {
    coordinates: generateCurvedTrajectory(originCoords, destCoords),
    distanceKm: dist,
    durationMinutes: Math.max(15, duration)
  };
}
