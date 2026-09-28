'use client';

import React, { useEffect, useRef, useState } from 'react';
import type * as L from 'leaflet';
import { Navigation, Compass, AlertCircle } from 'lucide-react';

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

export interface MapStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stopOrder: number;
  isPickupStop?: boolean;
  isSchoolStop?: boolean;
}

export interface MapLocation {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speedKph?: number | null;
  accuracyMeters?: number | null;
  recordedAt?: string | null;
}

export type VehicleType =
  | 'auto'
  | 'auto_rickshaw'
  | 'three_wheeler'
  | 'van'
  | 'minibus'
  | 'bus'
  | 'school_bus'
  | 'car';

interface RealTrackingMapProps {
  vehicleLocation: MapLocation | null;
  routeStops: MapStop[];
  pickupStopName?: string;
  schoolName?: string;
  vehicleNumber?: string;
  childName?: string;
  tripState?: string;
  vehicleType?: VehicleType | string;
}

// ─────────────────────────────────────────────────────────
// Heading: shortest-arc unwrapping (no 360° flip)
// ─────────────────────────────────────────────────────────
function getShortestRotation(prev: number, next: number): number {
  let diff = ((next - prev) % 360 + 360) % 360;
  if (diff > 180) diff -= 360;
  return prev + diff;
}

// ─────────────────────────────────────────────────────────
// SVG ICONS
// All icons live in a 48×48 viewBox.
// Vehicle points UP = North (heading 0°).
// White fills/strokes on green #006B2F badge.
// ─────────────────────────────────────────────────────────

/**
 * INDIAN AUTO-RICKSHAW (three-wheeler) — front 3/4 profile.
 *
 * Anatomical features that make it unmistakeable:
 *   • Wide arched canopy/roof with rounded overhang (no sharp bus box)
 *   • Open-sided cabin (pillars visible, no full doors)
 *   • Narrow front cowl / steering column with fork, pointing forward (up)
 *   • ONE single front wheel centred under the cowl
 *   • TWO rear wheels spread wide — classic 3-wheeler stance
 *   • Passenger bench inside the open cabin
 *   • Two small round headlights flanking the front cowl
 *   • Rear axle bar connecting the two rear wheels
 */
function autoRickshawSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none" role="img" aria-label="Auto-rickshaw">
  <!-- Ground shadow -->
  <ellipse cx="24" cy="46.5" rx="12" ry="2.5" fill="rgba(0,0,0,0.20)"/>
  <!-- Badge -->
  <circle cx="24" cy="22" r="21.5" fill="#006B2F" stroke="white" stroke-width="2.5"/>

  <!-- ── CANOPY / ROOF ── -->
  <!-- Wide arch: narrow at front (top), flares wide at rear (bottom of arch) -->
  <path d="
    M14 24
    C14 13, 18 8, 24 8
    C30 8, 34 13, 34 24
    L34 27
    C34 28.1, 33.1 29, 32 29
    L16 29
    C14.9 29, 14 28.1, 14 27
    Z"
    fill="white" opacity="0.97"/>

  <!-- ── WINDSCREEN (green cutout inside white canopy) ── -->
  <path d="
    M18 22
    C18 16, 20.5 12.5, 24 12.5
    C27.5 12.5, 30 16, 30 22
    L30 25.5
    C30 26.3, 29.3 27, 28.5 27
    L19.5 27
    C18.7 27, 18 26.3, 18 25.5
    Z"
    fill="#006B2F" opacity="0.88"/>

  <!-- ── OPEN CABIN SIDES (pillar stripes, no full door) ── -->
  <!-- Left pillar -->
  <rect x="14" y="23" width="4" height="6" rx="1" fill="#006B2F" opacity="0.45"/>
  <!-- Right pillar -->
  <rect x="30" y="23" width="4" height="6" rx="1" fill="#006B2F" opacity="0.45"/>

  <!-- ── PASSENGER BENCH (horizontal seat visible through open sides) ── -->
  <rect x="18" y="26" width="12" height="2.5" rx="1.2" fill="#006B2F" opacity="0.55"/>

  <!-- ── LOWER BODY SILL ── -->
  <rect x="15" y="29" width="18" height="3.5" rx="1.5" fill="white" opacity="0.9"/>

  <!-- ── FRONT COWL / STEERING COLUMN (narrow nose pointing up) ── -->
  <!-- Column shaft -->
  <rect x="22" y="5" width="4" height="6" rx="2" fill="white" opacity="0.95"/>
  <!-- Handlebar crossbar -->
  <rect x="19.5" y="9.5" width="9" height="1.8" rx="0.9" fill="white" opacity="0.9"/>

  <!-- ── HEADLIGHTS (flanking the front cowl) ── -->
  <!-- Left headlight -->
  <circle cx="19" cy="10.5" r="1.8" fill="white" opacity="0.97"/>
  <circle cx="19" cy="10.5" r="0.85" fill="#006B2F" opacity="0.75"/>
  <!-- Right headlight -->
  <circle cx="29" cy="10.5" r="1.8" fill="white" opacity="0.97"/>
  <circle cx="29" cy="10.5" r="0.85" fill="#006B2F" opacity="0.75"/>

  <!-- ── FRONT FORK ── -->
  <rect x="23" y="11" width="2" height="5" rx="1" fill="white" opacity="0.85"/>

  <!-- ── SINGLE FRONT WHEEL (centred, forward = up direction) ── -->
  <ellipse cx="24" cy="36" rx="3.8" ry="2.4" fill="white" opacity="0.97"/>
  <ellipse cx="24" cy="36" rx="2" ry="1.2" fill="#006B2F" opacity="0.7"/>
  <!-- Tyre bead -->
  <ellipse cx="24" cy="36" rx="3.8" ry="2.4" fill="none" stroke="white" stroke-width="0.5" opacity="0.5"/>

  <!-- ── REAR AXLE BAR ── -->
  <rect x="15" y="34.5" width="18" height="1.8" rx="0.9" fill="white" opacity="0.72"/>

  <!-- ── REAR LEFT WHEEL (wide three-wheeler stance) ── -->
  <ellipse cx="13.5" cy="37" rx="4" ry="2.5" fill="white" opacity="0.97"/>
  <ellipse cx="13.5" cy="37" rx="2.2" ry="1.3" fill="#006B2F" opacity="0.7"/>

  <!-- ── REAR RIGHT WHEEL ── -->
  <ellipse cx="34.5" cy="37" rx="4" ry="2.5" fill="white" opacity="0.97"/>
  <ellipse cx="34.5" cy="37" rx="2.2" ry="1.3" fill="#006B2F" opacity="0.7"/>
</svg>`;
}

/**
 * MINIBUS / FORCE TRAVELLER — side profile facing up (North).
 * Tall boxy body, two axles with double wheels, full windscreen.
 */
function vanSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none" role="img" aria-label="Van/minibus">
  <ellipse cx="24" cy="46.5" rx="12" ry="2.5" fill="rgba(0,0,0,0.20)"/>
  <circle cx="24" cy="22" r="21.5" fill="#006B2F" stroke="white" stroke-width="2.5"/>
  <!-- Main van body -->
  <rect x="11" y="11" width="26" height="21" rx="3" fill="white" opacity="0.96"/>
  <!-- Windscreen (top slant) -->
  <path d="M13 17 L17 11 L31 11 L35 17 Z" fill="#006B2F" opacity="0.82"/>
  <!-- Side windows row -->
  <rect x="12" y="18" width="6" height="5" rx="1" fill="#006B2F" opacity="0.55"/>
  <rect x="20" y="18" width="6" height="5" rx="1" fill="#006B2F" opacity="0.55"/>
  <rect x="28" y="18" width="6" height="5" rx="1" fill="#006B2F" opacity="0.55"/>
  <!-- Undercarriage rail -->
  <rect x="12" y="31" width="24" height="3" rx="1.5" fill="white" opacity="0.85"/>
  <!-- Front headlights -->
  <rect x="12" y="11" width="4" height="2.5" rx="1" fill="white" opacity="0.9"/>
  <rect x="32" y="11" width="4" height="2.5" rx="1" fill="white" opacity="0.9"/>
  <!-- Front wheel -->
  <ellipse cx="16" cy="36" rx="4.2" ry="2.6" fill="white" opacity="0.97"/>
  <ellipse cx="16" cy="36" rx="2.2" ry="1.3" fill="#006B2F" opacity="0.7"/>
  <!-- Rear wheel -->
  <ellipse cx="32" cy="36" rx="4.2" ry="2.6" fill="white" opacity="0.97"/>
  <ellipse cx="32" cy="36" rx="2.2" ry="1.3" fill="#006B2F" opacity="0.7"/>
</svg>`;
}

/**
 * SCHOOL BUS — long rectangular body, side profile facing up.
 * Distinctly longer body with multiple window rows.
 */
function busSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none" role="img" aria-label="School bus">
  <ellipse cx="24" cy="46.5" rx="12" ry="2.5" fill="rgba(0,0,0,0.20)"/>
  <circle cx="24" cy="22" r="21.5" fill="#006B2F" stroke="white" stroke-width="2.5"/>
  <!-- Long bus body -->
  <rect x="8" y="12" width="32" height="19" rx="2.5" fill="white" opacity="0.96"/>
  <!-- Cab windscreen (front/top quarter) -->
  <rect x="9" y="10" width="12" height="8" rx="1.5" fill="#006B2F" opacity="0.78"/>
  <!-- Window row — upper -->
  <rect x="23" y="13" width="5" height="4" rx="1" fill="#006B2F" opacity="0.55"/>
  <rect x="30" y="13" width="5" height="4" rx="1" fill="#006B2F" opacity="0.55"/>
  <!-- Window row — lower -->
  <rect x="10" y="20" width="5" height="4" rx="1" fill="#006B2F" opacity="0.5"/>
  <rect x="17" y="20" width="5" height="4" rx="1" fill="#006B2F" opacity="0.5"/>
  <rect x="24" y="20" width="5" height="4" rx="1" fill="#006B2F" opacity="0.5"/>
  <rect x="31" y="20" width="5" height="4" rx="1" fill="#006B2F" opacity="0.5"/>
  <!-- Undercarriage -->
  <rect x="9" y="30" width="30" height="3" rx="1.5" fill="white" opacity="0.83"/>
  <!-- Front wheel -->
  <ellipse cx="14" cy="36" rx="4" ry="2.5" fill="white" opacity="0.97"/>
  <ellipse cx="14" cy="36" rx="2.1" ry="1.3" fill="#006B2F" opacity="0.7"/>
  <!-- Rear wheel -->
  <ellipse cx="34" cy="36" rx="4" ry="2.5" fill="white" opacity="0.97"/>
  <ellipse cx="34" cy="36" rx="2.1" ry="1.3" fill="#006B2F" opacity="0.7"/>
</svg>`;
}

/**
 * GENERIC FALLBACK — clean navigation arrow.
 */
function arrowSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none" role="img" aria-label="Vehicle">
  <ellipse cx="24" cy="46.5" rx="12" ry="2.5" fill="rgba(0,0,0,0.20)"/>
  <circle cx="24" cy="22" r="21.5" fill="#006B2F" stroke="white" stroke-width="2.5"/>
  <polygon points="24,5 33,35 24,29 15,35" fill="white"/>
</svg>`;
}

// ─────────────────────────────────────────────────────────
// Icon selector
// ─────────────────────────────────────────────────────────
function getVehicleIconSvg(vehicleType?: string): string {
  const t = (vehicleType ?? '').toLowerCase();
  if (t === 'auto' || t === 'auto_rickshaw' || t === 'three_wheeler') return autoRickshawSvg();
  if (t === 'bus' || t === 'school_bus') return busSvg();
  if (t === 'van' || t === 'minibus') return vanSvg();
  return arrowSvg();
}

// ─────────────────────────────────────────────────────────
// Full marker HTML (icon + pulsing ring wrapper)
// ─────────────────────────────────────────────────────────
function buildVehicleMarkerHtml(
  vehicleType: string | undefined,
  heading: number,
  isStale: boolean,
): string {
  const iconSvg = getVehicleIconSvg(vehicleType);
  const label =
    vehicleType === 'auto' || vehicleType === 'auto_rickshaw'
      ? 'Live location of assigned auto-rickshaw'
      : vehicleType === 'bus' || vehicleType === 'school_bus'
        ? 'Live location of assigned school bus'
        : vehicleType === 'van' || vehicleType === 'minibus'
          ? 'Live location of assigned minibus'
          : 'Live vehicle location';

  const ringAnimation = isStale
    ? ''
    : 'animation:tinyride-ping 2s cubic-bezier(0,0,0.2,1) infinite;';
  const ringOpacity = isStale ? '0' : '0.3';
  const staleFilter = isStale ? 'opacity:0.55;filter:grayscale(55%);' : '';

  // The outer wrapper is NOT rotated — only the SVG icon rotates, keeping
  // the pulsing ring always circular from the map's perspective.
  return `<div style="position:relative;width:52px;height:58px;display:flex;flex-direction:column;align-items:center;" role="img" aria-label="${label}">
  <div style="position:absolute;top:1px;left:2px;width:48px;height:48px;border-radius:50%;background:rgba(16,185,129,${ringOpacity});pointer-events:none;${ringAnimation}"></div>
  <div style="transform:rotate(${heading}deg);transform-origin:24px 22px;transition:transform 0.65s cubic-bezier(0.2,0,0,1);${staleFilter}">
    ${iconSvg}
  </div>
</div>`;
}

// ─────────────────────────────────────────────────────────
// Inject @keyframes once
// ─────────────────────────────────────────────────────────
let _keyframesInjected = false;
function injectKeyframes() {
  if (_keyframesInjected || typeof document === 'undefined') return;
  _keyframesInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes tinyride-ping {
      0%   { transform: scale(0.75); opacity: 0.5; }
      70%  { transform: scale(2.0);  opacity: 0;   }
      100% { transform: scale(0.75); opacity: 0;   }
    }
    .tinyride-vehicle-marker { background: transparent !important; border: none !important; }
    .tinyride-stop-marker    { background: transparent !important; border: none !important; }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
export default function RealTrackingMap({
  vehicleLocation,
  routeStops,
  schoolName = 'School Campus',
  vehicleNumber = 'TS09-TR-102',
  childName = 'Child',
  vehicleType,
}: RealTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef  = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef    = useRef<L.Polyline | null>(null);
  const LRef            = useRef<typeof L | null>(null);

  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [userHasPanned, setUserHasPanned] = useState(false);

  // Unwrapped heading accumulator (avoids flip artifacts)
  const smoothedHeadingRef = useRef<number>(0);

  // Staleness: last GPS fix older than 60 s → stale
  const isStale = vehicleLocation?.recordedAt
    ? Date.now() - new Date(vehicleLocation.recordedAt).getTime() > 60_000
    : false;

  // ── Load Leaflet on client ──────────────────────────
  useEffect(() => {
    let alive = true;
    injectKeyframes();
    import('leaflet').then((mod) => {
      if (!alive) return;
      LRef.current = mod;
      setLeafletLoaded(true);
    });
    return () => { alive = false; };
  }, []);

  // ── Initialize map ──────────────────────────────────
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;
    const L = LRef.current!;

    const lat0 = vehicleLocation?.latitude  ?? routeStops[0]?.latitude  ?? 17.472;
    const lng0 = vehicleLocation?.longitude ?? routeStops[0]?.longitude ?? 78.397;

    const map = L.map(mapContainerRef.current, {
      center: [lat0, lng0],
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);
    map.on('dragstart', () => setUserHasPanned(true));

    mapInstanceRef.current = map;
    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [leafletLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Route stops + polyline ──────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L   = LRef.current;
    if (!map || !L || routeStops.length === 0) return;

    const pts: [number, number][] = routeStops.map((s) => [s.latitude, s.longitude]);

    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs(pts);
    } else {
      routeLineRef.current = L.polyline(pts, {
        color: '#006B2F',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '8, 8',
      }).addTo(map);
    }

    routeStops.forEach((stop) => {
      let iconHtml: string;

      if (stop.isPickupStop) {
        iconHtml = `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
          <div style="background:#2563eb;color:white;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 6px rgba(37,99,235,0.4);margin-bottom:2px;">${childName}&apos;s Pickup</div>
          <div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>`;
      } else if (stop.isSchoolStop) {
        iconHtml = `<div style="position:relative;display:flex;flex-direction:column;align-items:center;">
          <div style="background:#dc2626;color:white;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 6px rgba(220,38,38,0.4);margin-bottom:2px;">Campus Gate</div>
          <div style="width:16px;height:16px;border-radius:50%;background:#dc2626;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
        </div>`;
      } else {
        iconHtml = `<div style="width:12px;height:12px;border-radius:50%;background:#fff;border:3px solid #006B2F;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></div>`;
      }

      const isLarge = stop.isPickupStop || stop.isSchoolStop;
      L.marker([stop.latitude, stop.longitude], {
        icon: L.divIcon({
          html: iconHtml,
          className: 'tinyride-stop-marker',
          iconSize:   isLarge ? [80, 36] : [12, 12],
          iconAnchor: isLarge ? [40, 36] : [6,  6],
        }),
      })
        .bindPopup(`<b>${stop.name}</b><br/>Stop #${stop.stopOrder}`)
        .addTo(map);
    });
  }, [leafletLoaded, routeStops, childName]);

  // ── Vehicle marker (update on every location change) ──
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L   = LRef.current;
    if (!map || !L || !vehicleLocation) return;

    const { latitude, longitude, heading } = vehicleLocation;
    const rawHeading = heading ?? 0;

    // Shortest-arc heading unwrap
    const unwrapped = getShortestRotation(smoothedHeadingRef.current, rawHeading);
    smoothedHeadingRef.current = unwrapped;

    const markerHtml = buildVehicleMarkerHtml(vehicleType, unwrapped, isStale);

    const icon = L.divIcon({
      html:       markerHtml,
      className:  'tinyride-vehicle-marker',
      iconSize:   [52, 58],
      iconAnchor: [26, 22], // anchor at centre of badge circle
    });

    if (vehicleMarkerRef.current) {
      // Leaflet smoothly animates setLatLng with the map's pan
      vehicleMarkerRef.current.setLatLng([latitude, longitude]);
      vehicleMarkerRef.current.setIcon(icon);
    } else {
      vehicleMarkerRef.current = L.marker([latitude, longitude], {
        icon,
        zIndexOffset: 1000,
      }).addTo(map);
    }

    if (!userHasPanned) {
      map.panTo([latitude, longitude], { animate: true, duration: 0.8 });
    }
  }, [leafletLoaded, vehicleLocation, vehicleType, isStale, userHasPanned]);

  // ── Recenter ────────────────────────────────────────
  const handleRecenter = () => {
    setUserHasPanned(false);
    const map = mapInstanceRef.current;
    if (!map) return;
    if (vehicleLocation) {
      map.flyTo([vehicleLocation.latitude, vehicleLocation.longitude], 15, { duration: 1.2 });
    } else if (routeStops.length > 0) {
      map.fitBounds(
        routeStops.map((s) => [s.latitude, s.longitude] as [number, number]),
        { padding: [40, 40] },
      );
    }
  };

  // ── Vehicle type label for telemetry strip ──────────
  const vehicleTypeLabel = (() => {
    const t = (vehicleType ?? '').toLowerCase();
    if (t === 'auto' || t === 'auto_rickshaw' || t === 'three_wheeler') return 'Auto';
    if (t === 'bus' || t === 'school_bus') return 'School Bus';
    if (t === 'van' || t === 'minibus') return 'Minibus';
    return null;
  })();

  // ─────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden bg-slate-100 shadow-inner">
      {/* Map canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Skeleton while Leaflet loads */}
      {!leafletLoaded && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
            <Navigation className="w-4 h-4 animate-spin text-[#006B2F]" />
            <span>Loading map…</span>
          </div>
        </div>
      )}

      {/* Top-left status pill */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-slate-200/80 flex items-center gap-2 text-xs">
        {vehicleLocation ? (
          <>
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                isStale ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="font-bold text-slate-800">
              {isStale ? 'GPS Signal Lost' : 'GPS Live Telemetry'}
            </span>
            {!isStale &&
              vehicleLocation.speedKph !== undefined &&
              vehicleLocation.speedKph !== null && (
                <>
                  <span className="text-slate-300">|</span>
                  <span className="font-semibold text-slate-600">
                    {vehicleLocation.speedKph} km/h
                  </span>
                </>
              )}
          </>
        ) : (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-medium text-amber-800">Awaiting driver telemetry</span>
          </>
        )}
      </div>

      {/* Recenter button */}
      {userHasPanned && (
        <button
          type="button"
          onClick={handleRecenter}
          className="absolute top-3 right-14 z-10 bg-white hover:bg-emerald-50 text-[#006B2F] font-bold text-xs px-3 py-1.5 rounded-full shadow-md border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer animate-in fade-in"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Recenter</span>
        </button>
      )}

      {/* Bottom telemetry strip */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex justify-start items-end">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-slate-200/80 text-xs pointer-events-auto flex items-center gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Vehicle</div>
            <div className="font-bold text-slate-800">{vehicleNumber}</div>
          </div>
          {vehicleTypeLabel && (
            <>
              <span className="text-slate-200 select-none">|</span>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Type</div>
                <div className="font-bold text-slate-800">{vehicleTypeLabel}</div>
              </div>
            </>
          )}
          <span className="text-slate-200 select-none">|</span>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Destination</div>
            <div className="font-bold text-slate-800 truncate max-w-[140px]">{schoolName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
