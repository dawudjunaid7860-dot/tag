import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { latLngToViewSimple, latLngToWorld, metersToPixels, tileGrid } from '../utils/mapTiles';

// A real street map, rendered from OpenStreetMap tiles.
// No API key, works on web + native, and keeps the Phase 1 visuals:
// pulsing dots, faded trails, ghost markers, and a safe-zone circle.
//
// Props:
//   center   {lat, lng}  — what the map is centred on
//   zoom     number      — 15–18, 16 ≈ a few blocks
//   players  [{id, name, color, ping, trail, ghost}] — ping may be null
//            (safe-zone players post no ping and are not drawn)
//   safeZone {lat, lng, radiusMeters, label} | null
//   sonarKey number — changes on each ping, to flash the sonar ring
export default function OsmMap({ center, zoom, players, safeZone, sonarKey }) {
  const [size, setSize] = useState({ width: 360, height: 420 });
  const grid = tileGrid(center, zoom, size.width, size.height);
  const centerWorld = latLngToWorld(center.lat, center.lng, zoom);

  const toXY = (ping) => latLngToViewSimple(ping.lat, ping.lng, zoom, centerWorld, size.width, size.height);

  return (
    <View
      style={styles.map}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) setSize({ width, height });
      }}
    >
      {/* Street tiles */}
      {grid.tiles.map((t) => (
        <Image
          key={`${t.x}-${t.y}`}
          source={{ uri: t.uri }}
          style={[styles.tile, { left: grid.originX + (t.x - (Math.floor(centerWorld.x / 256) - 1)) * 256, top: grid.originY + (t.y - (Math.floor(centerWorld.y / 256) - 1)) * 256 }]}
        />
      ))}

      {/* Safe zone — a circle on the real map, never a ping */}
      {safeZone && (() => {
        const p = toXY(safeZone);
        const r = metersToPixels(safeZone.radiusMeters, center.lat, zoom);
        return (
          <View style={[styles.safeZone, { left: p.x - r, top: p.y - r, width: r * 2, height: r * 2, borderRadius: r }]}>
            <Text style={styles.safeText}>{safeZone.label}</Text>
          </View>
        );
      })()}

      {sonarKey > 0 && <View key={sonarKey} style={[styles.sonar, { left: size.width / 2 - 60, top: size.height / 2 - 60 }]} />}

      {/* Trails, then live pings */}
      {players.map((pl) =>
        (pl.trail || []).map((t, i) => {
          const p = toXY(t);
          if (p.x < -20 || p.x > size.width + 20 || p.y < -20 || p.y > size.height + 20) return null;
          return <View key={`${pl.id}-t${i}`} style={[styles.trailDot, { left: p.x - 5, top: p.y - 5, backgroundColor: pl.color, opacity: 0.25 + i * 0.15 }]} />;
        })
      )}
      {players.map((pl) => {
        if (!pl.ping) return null;
        const p = toXY(pl.ping);
        if (p.x < -30 || p.x > size.width + 30 || p.y < -30 || p.y > size.height + 30) return null;
        return (
          <View key={pl.id} style={[styles.marker, { left: p.x - 14, top: p.y - 14 }]}>
            {pl.ghost ? (
              <Text style={styles.ghost}>👻</Text>
            ) : (
              <View style={styles.dotWrap}>
                <View style={[styles.core, { backgroundColor: pl.color }]} />
              </View>
            )}
            <Text style={[styles.markerLabel, pl.ghost && styles.ghostLabel]}>{pl.name}</Text>
          </View>
        );
      })}

      <Text style={styles.attribution}>© OpenStreetMap contributors</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: 420, marginHorizontal: 20, borderRadius: 18, overflow: 'hidden', position: 'relative', backgroundColor: '#DDE8D5' },
  tile: { position: 'absolute', width: 256, height: 256 },
  safeZone: { position: 'absolute', backgroundColor: 'rgba(34,197,94,0.20)', borderWidth: 2, borderColor: '#22C55E', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  safeText: { color: '#14532D', fontWeight: '700', fontSize: 11, textAlign: 'center', paddingHorizontal: 6 },
  sonar: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#22C55E', opacity: 0.5 },
  trailDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  marker: { position: 'absolute', alignItems: 'center', width: 28 },
  dotWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  core: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#fff' },
  ghost: { fontSize: 26 },
  markerLabel: { color: '#fff', fontWeight: '700', fontSize: 12, marginTop: 2, textShadowColor: '#000', textShadowRadius: 4, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 4, paddingHorizontal: 3 },
  ghostLabel: { opacity: 0.7 },
  attribution: { position: 'absolute', right: 6, bottom: 4, fontSize: 10, color: '#333', backgroundColor: 'rgba(255,255,255,0.7)', paddingHorizontal: 4, borderRadius: 3 },
});
