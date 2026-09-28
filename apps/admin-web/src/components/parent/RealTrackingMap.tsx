'use client';

import React, { useEffect, useRef, useState } from 'react';
import type * as L from 'leaflet';
import { Navigation, Compass, AlertCircle } from 'lucide-react';

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

export type VehicleType = 'auto' | 'auto_rickshaw' | 'three_wheeler' | 'van' | 'minibus' | 'bus' | 'school_bus' | 'car';

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

// ─────────────────────────────────────────────
// Heading smoothing: shortest-arc unwrapping
// ─────────────────────────────────────────────
function getShortestRotation(prev: number, next: number): number {
  let diff = (next - prev) % 360;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return prev + diff;
}

// ─────────────────────────────────────────────
// SVG marker HTML generators
// ─────────────────────────────────────────────

/** Indian auto-rickshaw — top-down / 3/4-front navigation silhouette.
 *  Pointing North (up). Green TinyRide badge. White vector on #006B2F.
 */
function autoRickshawSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="40" height="48" fill="none" aria-label="Auto-rickshaw vehicle">
  <!-- Shadow drop -->
  <ellipse cx="20" cy="45" rx="10" ry="2.5" fill="rgba(0,0,0,0.18)"/>
  <!-- Badge circle -->
  <circle cx="20" cy="20" r="19" fill="#006B2F" stroke="white" stroke-width="2.5"/>
  <!-- Auto-rickshaw silhouette (white, pointing up = North) -->
  <!-- Canopy/roof — wide curved top -->
  <path d="M10 20 Q10 10 20 9 Q30 10 30 20" fill="white" opacity="0.95"/>
  <!-- Main cabin body -->
  <rect x="10" y="19" width="20" height="10" rx="2" fill="white" opacity="0.95"/>
  <!-- Windscreen cutout (dark) -->
  <rect x="13" y="13" width="14" height="7" rx="2" fill="#006B2F" opacity="0.85"/>
  <!-- Side windows -->
  <rect x="11" y="20" width="5" height="5" rx="1" fill="#006B2F" opacity="0.65"/>
  <rect x="24" y="20" width="5" height="5" rx="1" fill="#006B2F" opacity="0.65"/>
  <!-- Front wheel cowl (single front wheel centered) -->
  <ellipse cx="20" cy="30" rx="4" ry="2.5" fill="white" opacity="0.9"/>
  <ellipse cx="20" cy="30" rx="2" ry="1.5" fill="#006B2F" opacity="0.7"/>
  <!-- Rear left wheel -->
  <ellipse cx="11" cy="31" rx="3" ry="2" fill="white" opacity="0.9"/>
  <ellipse cx="11" cy="31" rx="1.5" ry="1" fill="#006B2F" opacity="0.7"/>
  <!-- Rear right wheel -->
  <ellipse cx="29" cy="31" rx="3" ry="2" fill="white" opacity="0.9"/>
  <ellipse cx="29" cy="31" rx="1.5" ry="1" fill="#006B2F" opacity="0.7"/>
  <!-- Headlight accent -->
  <circle cx="17" cy="10.5" r="1.2" fill="white" opacity="0.9"/>
  <circle cx="23" cy="10.5" r="1.2" fill="white" opacity="0.9"/>
</svg>`;
}

/** Minibus / Force Traveller style marker */
function vanSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="40" height="48" fill="none" aria-label="Van vehicle">
  <ellipse cx="20" cy="45" rx="10" ry="2.5" fill="rgba(0,0,0,0.18)"/>
  <circle cx="20" cy="20" r="19" fill="#006B2F" stroke="white" stroke-width="2.5"/>
  <!-- Van body — tall rectangular -->
  <rect x="9" y="14" width="22" height="14" rx="3" fill="white" opacity="0.95"/>
  <!-- Windscreen -->
  <rect x="12" y="12" width="16" height="7" rx="2" fill="#006B2F" opacity="0.8"/>
  <!-- Side windows row -->
  <rect x="10" y="16" width="5" height="5" rx="1" fill="#006B2F" opacity="0.6"/>
  <rect x="17" y="16" width="5" height="5" rx="1" fill="#006B2F" opacity="0.6"/>
  <rect x="25" y="16" width="4" height="5" rx="1" fill="#006B2F" opacity="0.6"/>
  <!-- Chassis undercarriage -->
  <rect x="10" y="27" width="20" height="4" rx="2" fill="white" opacity="0.8"/>
  <!-- Left wheel -->
  <ellipse cx="14" cy="31" rx="3.5" ry="2.5" fill="white" opacity="0.9"/>
  <ellipse cx="14" cy="31" rx="1.8" ry="1.3" fill="#006B2F" opacity="0.7"/>
  <!-- Right wheel -->
  <ellipse cx="26" cy="31" rx="3.5" ry="2.5" fill="white" opacity="0.9"/>
  <ellipse cx="26" cy="31" rx="1.8" ry="1.3" fill="#006B2F" opacity="0.7"/>
  <!-- Headlights -->
  <rect x="11" y="12" width="3" height="2" rx="0.5" fill="white" opacity="0.9"/>
  <rect x="26" y="12" width="3" height="2" rx="0.5" fill="white" opacity="0.9"/>
</svg>`;
}

/** School bus marker */
function busSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="40" height="48" fill="none" aria-label="School bus vehicle">
  <ellipse cx="20" cy="45" rx="10" ry="2.5" fill="rgba(0,0,0,0.18)"/>
  <circle cx="20" cy="20" r="19" fill="#006B2F" stroke="white" stroke-width="2.5"/>
  <!-- Long bus body -->
  <rect x="8" y="13" width="24" height="16" rx="2.5" fill="white" opacity="0.95"/>
  <!-- Windscreen -->
  <rect x="9" y="11" width="10" height="7" rx="1.5" fill="#006B2F" opacity="0.75"/>
  <!-- Windows row 1 -->
  <rect x="21" y="14" width="5" height="4" rx="1" fill="#006B2F" opacity="0.6"/>
  <rect x="27" y="14" width="4" height="4" rx="1" fill="#006B2F" opacity="0.6"/>
  <!-- Windows row 2 -->
  <rect x="10" y="20" width="4" height="4" rx="1" fill="#006B2F" opacity="0.55"/>
  <rect x="16" y="20" width="4" height="4" rx="1" fill="#006B2F" opacity="0.55"/>
  <rect x="22" y="20" width="4" height="4" rx="1" fill="#006B2F" opacity="0.55"/>
  <!-- Front wheel -->
  <ellipse cx="12" cy="31" rx="3.5" ry="2.5" fill="white" opacity="0.9"/>
  <ellipse cx="12" cy="31" rx="1.8" ry="1.3" fill="#006B2F" opacity="0.7"/>
  <!-- Rear wheel -->
  <ellipse cx="28" cy="31" rx="3.5" ry="2.5" fill="white" opacity="0.9"/>
  <ellipse cx="28" cy="31" rx="1.8" ry="1.3" fill="#006B2F" opacity="0.7"/>
</svg>`;
}

/** Generic fallback — navigation arrow */
function arrowSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 48" width="40" height="48" fill="none" aria-label="Vehicle">
  <ellipse cx="20" cy="45" rx="10" ry="2.5" fill="rgba(0,0,0,0.18)"/>
  <circle cx="20" cy="20" r="19" fill="#006B2F" stroke="white" stroke-width="2.5"/>
  <polygon points="20,6 28,32 20,27 12,32" fill="white"/>
</svg>`;
}

function getVehicleIconSvg(vehicleType?: string): string {
  const t = (vehicleType || '').toLowerCase();
  if (t === 'auto' || t === 'auto_rickshaw' || t === 'three_wheeler') return autoRickshawSvg();
  if (t === 'bus' || t === 'school_bus') return busSvg();
  if (t === 'van' || t === 'minibus') return vanSvg();
  return arrowSvg();
}

function buildVehicleMarkerHtml(
  vehicleType: string | undefined,
  heading: number,
  isStale: boolean
): string {
  const iconSvg = getVehicleIconSvg(vehicleType);
  const pulseStyle = isStale
    ? ''
    : `animation: tinyride-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;`;
  const pulseOpacity = isStale ? '0' : '0.35';

  return `
    <div style="position:relative;width:48px;height:56px;display:flex;flex-direction:column;align-items:center;" aria-label="Live location of assigned ${vehicleType || 'vehicle'}">
      <!-- Pulsing radar ring (hidden when stale) -->
      <div style="
        position:absolute;
        top:0;left:0;
        width:40px;height:40px;
        border-radius:50%;
        background:rgba(16,185,129,${pulseOpacity});
        pointer-events:none;
        ${pulseStyle}
      "></div>
      <!-- Rotated vehicle icon -->
      <div style="
        transform:rotate(${heading}deg);
        transform-origin:20px 20px;
        transition:transform 0.6s cubic-bezier(0.2,0,0,1);
        ${isStale ? 'opacity:0.55;filter:grayscale(60%);' : ''}
      ">
        ${iconSvg}
      </div>
    </div>
  `;
}

// ─────────────────────────────────────────────
// Inject keyframe animation once into the page
// ─────────────────────────────────────────────
let keyframesInjected = false;
function injectKeyframes() {
  if (keyframesInjected || typeof document === 'undefined') return;
  keyframesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes tinyride-ping {
      0% { transform: scale(0.8); opacity: 0.4; }
      70% { transform: scale(1.8); opacity: 0; }
      100% { transform: scale(0.8); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function RealTrackingMap({
  vehicleLocation,
  routeStops,
  schoolName = 'School Campus',
  vehicleNumber = 'TS09-TR-102',
  childName = 'Child',
  vehicleType,
}: RealTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [userHasPanned, setUserHasPanned] = useState(false);
  const LRef = useRef<typeof L | null>(null);

  // Track smoothed heading across renders (unwrapped angle)
  const smoothedHeadingRef = useRef<number>(0);

  // Staleness: GPS data older than 60s is considered stale
  const isStale = vehicleLocation?.recordedAt
    ? Date.now() - new Date(vehicleLocation.recordedAt).getTime() > 60_000
    : false;

  // Load Leaflet dynamically on client
  useEffect(() => {
    let isMounted = true;
    injectKeyframes();
    import('leaflet').then((L) => {
      if (!isMounted) return;
      LRef.current = L;
      setLeafletLoaded(true);
    });
    return () => { isMounted = false; };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;
    const L = LRef.current;
    if (!L) return;

    const initialLat = vehicleLocation?.latitude || routeStops[0]?.latitude || 17.472;
    const initialLng = vehicleLocation?.longitude || routeStops[0]?.longitude || 78.397;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
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

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leafletLoaded]);

  // Draw route stops & polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L || routeStops.length === 0) return;

    const points: [number, number][] = routeStops.map((s) => [s.latitude, s.longitude]);

    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs(points);
    } else {
      routeLineRef.current = L.polyline(points, {
        color: '#006B2F',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
        dashArray: '8, 8',
      }).addTo(map);
    }

    routeStops.forEach((stop) => {
      const isPickup = stop.isPickupStop;
      const isSchool = stop.isSchoolStop;

      let iconHtml = `
        <div style="
          width:14px;height:14px;border-radius:50%;
          background:#ffffff;border:3px solid #006B2F;
          box-shadow:0 2px 4px rgba(0,0,0,0.2);
        "></div>
      `;

      if (isPickup) {
        iconHtml = `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
            <div style="
              background:#2563eb;color:white;font-size:10px;font-weight:800;
              padding:2px 6px;border-radius:6px;white-space:nowrap;
              box-shadow:0 2px 6px rgba(37,99,235,0.4);margin-bottom:2px;
            ">${childName}&apos;s Pickup</div>
            <div style="
              width:16px;height:16px;border-radius:50%;
              background:#2563eb;border:3px solid white;
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
            "></div>
          </div>
        `;
      } else if (isSchool) {
        iconHtml = `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
            <div style="
              background:#dc2626;color:white;font-size:10px;font-weight:800;
              padding:2px 6px;border-radius:6px;white-space:nowrap;
              box-shadow:0 2px 6px rgba(220,38,38,0.4);margin-bottom:2px;
            ">Campus Gate</div>
            <div style="
              width:16px;height:16px;border-radius:50%;
              background:#dc2626;border:3px solid white;
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
            "></div>
          </div>
        `;
      }

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'tinyride-stop-marker',
        iconSize: [24, 24],
        iconAnchor: isPickup || isSchool ? [12, 28] : [7, 7],
      });

      L.marker([stop.latitude, stop.longitude], { icon: customIcon })
        .bindPopup(`<b>${stop.name}</b><br/>Stop #${stop.stopOrder}`)
        .addTo(map);
    });
  }, [leafletLoaded, routeStops, childName]);

  // Update Vehicle Marker with smooth heading & follow mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L || !vehicleLocation) return;

    const { latitude, longitude, heading } = vehicleLocation;
    const latLng: [number, number] = [latitude, longitude];

    // Unwrap heading for shortest-path rotation
    const rawHeading = heading ?? 0;
    const smoothedHeading = getShortestRotation(smoothedHeadingRef.current, rawHeading);
    smoothedHeadingRef.current = smoothedHeading;

    const markerHtml = buildVehicleMarkerHtml(vehicleType, smoothedHeading, isStale);

    const vehicleIcon = L.divIcon({
      html: markerHtml,
      className: 'tinyride-vehicle-marker',
      iconSize: [48, 56],
      iconAnchor: [24, 20],
    });

    if (vehicleMarkerRef.current) {
      // Smooth position update (Leaflet animates the pan; CSS transition handles rotation)
      vehicleMarkerRef.current.setLatLng(latLng);
      vehicleMarkerRef.current.setIcon(vehicleIcon);
    } else {
      vehicleMarkerRef.current = L.marker(latLng, {
        icon: vehicleIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }

    if (!userHasPanned) {
      map.panTo(latLng, { animate: true, duration: 1 });
    }
  }, [leafletLoaded, vehicleLocation, vehicleType, isStale, userHasPanned]);

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setUserHasPanned(false);
    if (vehicleLocation) {
      map.flyTo([vehicleLocation.latitude, vehicleLocation.longitude], 15, { duration: 1.2 });
    } else if (routeStops.length > 0) {
      const bounds = routeStops.map((s) => [s.latitude, s.longitude] as [number, number]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  return (
    <div className="relative w-full h-80 sm:h-96 rounded-3xl overflow-hidden bg-slate-100 shadow-inner">
      {/* Real Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Loading Skeleton */}
      {!leafletLoaded && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
            <Navigation className="w-4 h-4 animate-spin text-[#006B2F]" />
            <span>Loading satellite map...</span>
          </div>
        </div>
      )}

      {/* Floating Status Badge */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-slate-200/80 flex items-center gap-2 text-xs">
        {vehicleLocation ? (
          <>
            <span className={`w-2.5 h-2.5 rounded-full ${isStale ? 'bg-amber-400' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="font-bold text-slate-800">
              {isStale ? 'GPS Signal Lost' : 'GPS Live Telemetry'}
            </span>
            {!isStale && vehicleLocation.speedKph !== undefined && vehicleLocation.speedKph !== null && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-slate-600 font-semibold">{vehicleLocation.speedKph} km/h</span>
              </>
            )}
          </>
        ) : (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-amber-800 font-medium">Awaiting driver telemetry</span>
          </>
        )}
      </div>

      {/* Recenter Button */}
      {userHasPanned && (
        <button
          type="button"
          onClick={handleRecenter}
          className="absolute top-3 right-14 z-10 bg-white hover:bg-emerald-50 text-[#006B2F] font-bold text-xs px-3 py-1.5 rounded-full shadow-md border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer animate-in fade-in"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Recenter Vehicle</span>
        </button>
      )}

      {/* Bottom Telemetry Strip */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex justify-between items-end">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-slate-200/80 text-xs pointer-events-auto flex items-center gap-3">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Vehicle</div>
            <div className="font-bold text-slate-800">{vehicleNumber}</div>
          </div>
          <span className="text-slate-200">|</span>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Destination</div>
            <div className="font-bold text-slate-800 truncate max-w-[150px]">{schoolName}</div>
          </div>
          {vehicleType && (
            <>
              <span className="text-slate-200">|</span>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Type</div>
                <div className="font-bold text-slate-800 capitalize">
                  {vehicleType === 'auto' || vehicleType === 'auto_rickshaw' ? 'Auto' :
                   vehicleType === 'minibus' ? 'Minibus' :
                   vehicleType === 'bus' || vehicleType === 'school_bus' ? 'Bus' :
                   vehicleType}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
