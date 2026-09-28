'use client';

/**
 * useDriverGPS — Real GPS hook for the Driver app.
 *
 * Responsibilities:
 * 1. Request Geolocation permission with a clear human-readable reason
 * 2. Watch device GPS position continuously while mounted
 * 3. Publish to /api/driver/location using a smart strategy:
 *    - Minimum 5 seconds between posts
 *    - OR > 10 metres moved (whichever triggers first)
 * 4. Handle permission denied, GPS unavailable, and poor accuracy
 * 5. Detect staleness: if no update in 30s, mark as stale
 * 6. Queue one update during connectivity loss, flush on reconnect
 *
 * Returns a stable object describing current GPS state.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type GpsPermission = 'unknown' | 'granted' | 'denied' | 'unavailable';

export interface GpsState {
  permission: GpsPermission;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;            // m/s from browser
  speedKph: number | null;
  lastUpdate: Date | null;
  isStale: boolean;                // true if no update in > 30s
  isPublishing: boolean;           // true while a POST is in-flight
  lastPublished: Date | null;
  publishError: string | null;
  requestPermission: () => void;   // call to ask for permission
  stop: () => void;                // call to stop watching
}

// Haversine distance in metres between two lat/lng points
function haversineMetres(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MIN_PUBLISH_INTERVAL_MS = 5_000;   // 5 seconds minimum
const MIN_PUBLISH_DISTANCE_M = 10;       // 10 metres minimum movement
const STALE_THRESHOLD_MS = 30_000;       // 30 seconds before "stale"

export function useDriverGPS(tripId: string | null): GpsState {
  const [permission, setPermission] = useState<GpsPermission>('unknown');
  const [pos, setPos] = useState<{
    lat: number; lng: number; accuracy: number;
    heading: number | null; speed: number | null;
    ts: Date;
  } | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastPublished, setLastPublished] = useState<Date | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const lastPublishRef = useRef<{ lat: number; lng: number; ts: number } | null>(null);
  const pendingRef = useRef<typeof pos | null>(null);  // queued while offline

  // Staleness: recalculate on every render based on pos.ts
  const isStale = pos
    ? Date.now() - pos.ts.getTime() > STALE_THRESHOLD_MS
    : false;

  const publish = useCallback(
    async (
      lat: number, lng: number, accuracy: number,
      heading: number | null, speed: number | null
    ) => {
      if (!tripId) return;

      const now = Date.now();
      const last = lastPublishRef.current;

      // Smart throttle: skip if too recent AND too close
      if (last) {
        const elapsed = now - last.ts;
        const moved = haversineMetres(last.lat, last.lng, lat, lng);
        if (elapsed < MIN_PUBLISH_INTERVAL_MS && moved < MIN_PUBLISH_DISTANCE_M) return;
      }

      if (!navigator.onLine) {
        // Queue the update; we'll flush when back online
        pendingRef.current = { lat, lng, accuracy, heading, speed, ts: new Date() };
        return;
      }

      setIsPublishing(true);
      setPublishError(null);

      try {
        const res = await fetch('/api/driver/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tripId,
            latitude: lat,
            longitude: lng,
            accuracy,
            speed: speed !== null ? Math.round(speed * 3.6 * 10) / 10 : 0, // m/s → km/h
            heading: heading ?? 0,
            timestamp: new Date().toISOString(),
          }),
        });

        if (res.ok) {
          lastPublishRef.current = { lat, lng, ts: now };
          setLastPublished(new Date());
          pendingRef.current = null;
        } else {
          const err = await res.json().catch(() => ({}));
          setPublishError(err?.error || 'Location send failed');
        }
      } catch {
        setPublishError('Connection error — location queued');
        pendingRef.current = { lat, lng, accuracy, heading, speed, ts: new Date() };
      } finally {
        setIsPublishing(false);
      }
    },
    [tripId]
  );

  // Flush queued update when back online
  useEffect(() => {
    const handleOnline = () => {
      const q = pendingRef.current;
      if (q) {
        publish(q.lat, q.lng, q.accuracy, q.heading, q.speed);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [publish]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setPermission('unavailable');
      return;
    }

    if (watchIdRef.current !== null) return; // already watching

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        const ts = new Date();
        setPermission('granted');
        setPos({ lat: latitude, lng: longitude, accuracy, heading, speed, ts });
        // Publish if tripId is active
        if (tripId) {
          publish(latitude, longitude, accuracy, heading, speed);
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setPermission('denied');
        } else {
          setPermission('unavailable');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 0,
      }
    );
  }, [tripId, publish]);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    permission,
    latitude: pos?.lat ?? null,
    longitude: pos?.lng ?? null,
    accuracy: pos?.accuracy ?? null,
    heading: pos?.heading ?? null,
    speed: pos?.speed ?? null,
    speedKph: pos?.speed !== null && pos?.speed !== undefined
      ? Math.round(pos.speed * 3.6 * 10) / 10
      : null,
    lastUpdate: pos?.ts ?? null,
    isStale,
    isPublishing,
    lastPublished,
    publishError,
    requestPermission: startWatching,
    stop,
  };
}
