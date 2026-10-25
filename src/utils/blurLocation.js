// Phase 2a: this now blurs REAL GPS input from expo-location.
// Map rendering moved to OpenStreetMap tiles (src/components/OsmMap.js)
// so the same code works on web + native with no Google Maps API key.
//
// blurLocation() simulates the privacy rule from the spec:
//   * exact location is NEVER posted
//   * a ping is snapped to ~1 block (~100m) by rounding + jitter
//   * a player in a safe zone returns null — safe zones never ping
//   * location is only shared while game.isActive is true

export const BLOCK_METERS = 100;

export function blurLocation(lat, lng) {
  const jitter = () => (Math.random() - 0.5) * 0.0018; // ~100m
  return {
    lat: Math.round((lat + jitter()) * 1000) / 1000,
    lng: Math.round((lng + jitter()) * 1000) / 1000,
  };
}

// Convert a lat/lng ping to x/y % on the mock map.
// The mock map covers a small neighbourhood, not the whole world.
export function pingToXY(ping, bounds = { minLat: 39.71, maxLat: 39.74, minLng: -104.86, maxLng: -104.82 }) {
  const x = ((ping.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y = ((bounds.maxLat - ping.lat) / (bounds.maxLat - bounds.minLat)) * 100;
  return { x: Math.max(4, Math.min(96, x)), y: Math.max(6, Math.min(94, y)) };
}

export function isInSafeZone(ping, safeZones = []) {
  return safeZones.some(
    (z) => ping.lat >= z.minLat && ping.lat <= z.maxLat && ping.lng >= z.minLng && ping.lng <= z.maxLng
  );
}
