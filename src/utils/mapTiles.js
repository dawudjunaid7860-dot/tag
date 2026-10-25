// Real-map maths for the Phase 2 map.
//
// The map is drawn from OpenStreetMap tiles (free, no API key — unlike
// Google Maps, which needs a billing-backed key on Android and on the web).
// That is a deliberate choice so the same code works in Expo Go, on a
// native build, AND on the Vercel web version with zero keys.
//
// Web-Mercator: convert lat/lng to world pixels at a zoom level, then
// place tiles and player dots relative to the map centre.

const TILE = 256;

export function latLngToWorld(lat, lng, zoom) {
  const scale = TILE * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
  return { x, y };
}

// Pixels per metre at this latitude/zoom — used to draw the safe zone.
export function metersToPixels(meters, lat, zoom) {
  const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  return meters / metersPerPixel;
}

// The 3x3 tile grid centred on `center`, plus the pixel offset that
// puts the centre in the middle of a view of `width` x `height`.
export function tileGrid(center, zoom, width, height) {
  const world = latLngToWorld(center.lat, center.lng, zoom);
  const tileX = Math.floor(world.x / TILE);
  const tileY = Math.floor(world.y / TILE);
  const tiles = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      tiles.push({ x: tileX + dx, y: tileY + dy, uri: `https://tile.openstreetmap.org/${zoom}/${tileX + dx}/${tileY + dy}.png` });
    }
  }
  // Top-left corner of the tile grid, in view coordinates.
  const originX = width / 2 - (world.x - (tileX - 1) * TILE);
  const originY = height / 2 - (world.y - (tileY - 1) * TILE);
  return { tiles, originX, originY, world };
}

// View coords = centre of the view + (player world pixels - centre world pixels).
export function latLngToViewSimple(lat, lng, zoom, centerWorld, width, height) {
  const world = latLngToWorld(lat, lng, zoom);
  return { x: width / 2 + (world.x - centerWorld.x), y: height / 2 + (world.y - centerWorld.y) };
}
