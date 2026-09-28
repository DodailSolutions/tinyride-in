'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import type * as L from 'leaflet';
import { Layers, Crosshair, ArrowRight, Phone, Navigation } from 'lucide-react';

export interface AdminMapTrip {
  tripId: string;
  routeCode: string;
  routeName: string;
  schoolName: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleType: 'auto_rickshaw' | 'van' | 'school_bus' | string;
  passengersBoarded: number;
  totalPassengers: number;
  currentPhase: string;
  slaStatus: 'normal' | 'delayed' | 'attention';
  delayMinutes: number;
  eta: string;
  speedKph: number;
  heading: number;
  lastLocation: { lat: number; lng: number } | null;
  lastUpdated: string;
  isOnline: boolean;
  stops?: Array<{ id: string; name: string; sequence: number; lat: number; lng: number; isPassed?: boolean }>;
}

interface AdminCommandMapProps {
  trips: AdminMapTrip[];
  selectedTripId?: string | null;
  onSelectTrip?: (tripId: string) => void;
  filterStatus?: 'all' | 'active' | 'delayed' | 'at_school' | 'offline';
  filterVehicleType?: string;
  filterSchool?: string;
  className?: string;
}

// ─────────────────────────────────────────────────────────
// Vehicle Vector SVGs (Auto-rickshaw, Van, Bus)
// ─────────────────────────────────────────────────────────

function autoRickshawSvg(color = '#006B2F'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="44" height="44" fill="none">
    <ellipse cx="24" cy="45" rx="11" ry="2.5" fill="rgba(0,0,0,0.25)"/>
    <circle cx="24" cy="22" r="20" fill="${color}" stroke="#FFFFFF" stroke-width="2.5"/>
    <!-- Canopy -->
    <path d="M14 24 C14 13, 18 8, 24 8 C30 8, 34 13, 34 24 L34 27 C34 28.1, 33.1 29, 32 29 L16 29 C14.9 29, 14 28.1, 14 27 Z" fill="#FFFFFF" opacity="0.97"/>
    <!-- Windscreen -->
    <path d="M18 22 C18 16, 20.5 12.5, 24 12.5 C27.5 12.5, 30 16, 30 22 L30 25.5 C30 26.3, 29.3 27, 28.5 27 L19.5 27 C18.7 27, 18 26.3, 18 25.5 Z" fill="${color}" opacity="0.9"/>
    <!-- Seats & details -->
    <rect x="18" y="26" width="12" height="2" rx="1" fill="${color}" opacity="0.7"/>
    <rect x="15" y="29" width="18" height="3" rx="1.5" fill="#FFFFFF" opacity="0.95"/>
    <!-- Handlebars -->
    <rect x="19" y="9.5" width="10" height="1.8" rx="0.9" fill="#FFFFFF"/>
    <!-- Single Front Wheel -->
    <ellipse cx="24" cy="35" rx="3.5" ry="2.2" fill="#FFFFFF"/>
    <ellipse cx="24" cy="35" rx="1.8" ry="1.1" fill="${color}"/>
    <!-- Dual Rear Wheels -->
    <ellipse cx="14" cy="36.5" rx="3.5" ry="2.2" fill="#FFFFFF"/>
    <ellipse cx="34" cy="36.5" rx="3.5" ry="2.2" fill="#FFFFFF"/>
  </svg>`;
}

function vanSvg(color = '#006B2F'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="44" height="44" fill="none">
    <ellipse cx="24" cy="45" rx="11" ry="2.5" fill="rgba(0,0,0,0.25)"/>
    <circle cx="24" cy="22" r="20" fill="${color}" stroke="#FFFFFF" stroke-width="2.5"/>
    <rect x="11" y="11" width="26" height="21" rx="3" fill="#FFFFFF" opacity="0.96"/>
    <path d="M13 17 L17 11 L31 11 L35 17 Z" fill="${color}" opacity="0.85"/>
    <rect x="12" y="18" width="6" height="5" rx="1" fill="${color}" opacity="0.6"/>
    <rect x="20" y="18" width="6" height="5" rx="1" fill="${color}" opacity="0.6"/>
    <rect x="28" y="18" width="6" height="5" rx="1" fill="${color}" opacity="0.6"/>
    <ellipse cx="16" cy="35.5" rx="3.8" ry="2.4" fill="#FFFFFF"/>
    <ellipse cx="32" cy="35.5" rx="3.8" ry="2.4" fill="#FFFFFF"/>
  </svg>`;
}

function busSvg(color = '#006B2F'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="44" height="44" fill="none">
    <ellipse cx="24" cy="45" rx="12" ry="2.5" fill="rgba(0,0,0,0.25)"/>
    <circle cx="24" cy="22" r="20" fill="${color}" stroke="#FFFFFF" stroke-width="2.5"/>
    <rect x="8" y="12" width="32" height="19" rx="2.5" fill="#FFFFFF" opacity="0.96"/>
    <rect x="9" y="10" width="12" height="8" rx="1.5" fill="${color}" opacity="0.8"/>
    <rect x="23" y="13" width="5" height="4" rx="1" fill="${color}" opacity="0.6"/>
    <rect x="30" y="13" width="5" height="4" rx="1" fill="${color}" opacity="0.6"/>
    <rect x="10" y="20" width="5" height="4" rx="1" fill="${color}" opacity="0.55"/>
    <rect x="17" y="20" width="5" height="4" rx="1" fill="${color}" opacity="0.55"/>
    <rect x="24" y="20" width="5" height="4" rx="1" fill="${color}" opacity="0.55"/>
    <rect x="31" y="20" width="5" height="4" rx="1" fill="${color}" opacity="0.55"/>
    <ellipse cx="14" cy="35.5" rx="3.6" ry="2.3" fill="#FFFFFF"/>
    <ellipse cx="34" cy="35.5" rx="3.6" ry="2.3" fill="#FFFFFF"/>
  </svg>`;
}

function getVehicleIconSvg(vehicleType: string, slaStatus: string, isOnline: boolean): string {
  let color = '#006B2F'; // Emerald green
  if (!isOnline) {
    color = '#64748B'; // Muted slate
  } else if (slaStatus === 'delayed') {
    color = '#D97706'; // Amber
  } else if (slaStatus === 'attention') {
    color = '#DC2626'; // Red
  }

  const t = (vehicleType || '').toLowerCase();
  if (t === 'auto' || t === 'auto_rickshaw' || t === 'three_wheeler') return autoRickshawSvg(color);
  if (t === 'bus' || t === 'school_bus') return busSvg(color);
  return vanSvg(color);
}

// ─────────────────────────────────────────────────────────
// Inject Map CSS Once
// ─────────────────────────────────────────────────────────
let _adminMapCssInjected = false;
function injectMapStyles() {
  if (_adminMapCssInjected || typeof document === 'undefined') return;
  _adminMapCssInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes admin-pulse {
      0% { transform: scale(0.85); opacity: 0.7; }
      70% { transform: scale(2.2); opacity: 0; }
      100% { transform: scale(0.85); opacity: 0; }
    }
    .admin-vehicle-marker { background: transparent !important; border: none !important; }
    .admin-school-marker { background: transparent !important; border: none !important; }
    .admin-stop-marker { background: transparent !important; border: none !important; }
  `;
  document.head.appendChild(style);
}

export function AdminCommandMap({
  trips,
  selectedTripId,
  onSelectTrip,
  filterStatus = 'all',
  filterVehicleType = 'all',
  filterSchool = 'all',
  className = '',
}: AdminCommandMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const LRef = useRef<typeof L | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [activeFlyoutTrip, setActiveFlyoutTrip] = useState<AdminMapTrip | null>(null);

  // Filter trips
  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      if (filterStatus === 'active' && !['in_progress', 'ready'].includes(t.currentPhase)) return false;
      if (filterStatus === 'delayed' && t.slaStatus !== 'delayed') return false;
      if (filterStatus === 'at_school' && t.currentPhase !== 'at_school') return false;
      if (filterStatus === 'offline' && t.isOnline) return false;

      if (filterVehicleType !== 'all' && t.vehicleType !== filterVehicleType) return false;
      if (filterSchool !== 'all' && t.schoolName !== filterSchool) return false;

      return true;
    });
  }, [trips, filterStatus, filterVehicleType, filterSchool]);

  // Load Leaflet dynamically on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    injectMapStyles();

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-admin-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-admin-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((leafletModule) => {
      LRef.current = leafletModule.default || leafletModule;
      setLeafletReady(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || mapInstanceRef.current || !LRef.current) return;

    const L = LRef.current;
    // Default to Hyderabad central coordinates
    const map = L.map(mapContainerRef.current, {
      center: [17.3850, 78.4867],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Clean, high-performance base tile layer (CartoDB Positron / OSM)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;
  }, [leafletReady]);

  // Update Markers on Trips change
  useEffect(() => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapInstanceRef.current;
    const currentMarkers = markersRef.current;
    const validCoords: [number, number][] = [];

    // Track active trip ids
    const activeIds = new Set(filteredTrips.map((t) => t.tripId));

    // Remove old markers
    for (const [id, marker] of currentMarkers.entries()) {
      if (!activeIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }

    // Add or update markers
    filteredTrips.forEach((trip) => {
      if (!trip.lastLocation?.lat || !trip.lastLocation?.lng) return;
      const { lat, lng } = trip.lastLocation;
      validCoords.push([lat, lng]);

      const svgHtml = getVehicleIconSvg(trip.vehicleType, trip.slaStatus, trip.isOnline);
      const pulseColor = trip.slaStatus === 'delayed' ? 'rgba(217,119,6,0.4)' : 'rgba(0,107,47,0.35)';
      const pulseRing = trip.isOnline
        ? `<div style="position:absolute;top:1px;left:2px;width:44px;height:44px;border-radius:50%;background:${pulseColor};animation:admin-pulse 2.2s infinite;pointer-events:none;"></div>`
        : '';

      const markerHtml = `
        <div style="position:relative;width:48px;height:54px;display:flex;flex-direction:column;align-items:center;cursor:pointer;" title="${trip.routeCode} • ${trip.driverName}">
          ${pulseRing}
          <div style="transform:rotate(${trip.heading || 0}deg);transform-origin:22px 20px;transition:transform 0.4s ease;">
            ${svgHtml}
          </div>
          <div style="position:absolute;bottom:0px;background:${trip.slaStatus === 'delayed' ? '#D97706' : '#0F172A'};color:#FFFFFF;font-size:10px;font-weight:700;padding:1px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);letter-spacing:0.5px;">
            ${trip.routeCode}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'admin-vehicle-marker',
        iconSize: [48, 54],
        iconAnchor: [24, 27],
      });

      let marker = currentMarkers.get(trip.tripId);
      if (marker) {
        marker.setLatLng([lat, lng]);
        marker.setIcon(icon);
      } else {
        marker = L.marker([lat, lng], { icon }).addTo(map);
        marker.on('click', () => {
          setActiveFlyoutTrip(trip);
          onSelectTrip?.(trip.tripId);
        });
        currentMarkers.set(trip.tripId, marker);
      }
    });

    // Auto-fit bounds if we have valid coordinates and not manually zoomed
    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [filteredTrips, onSelectTrip]);

  // Handle selectedTripId zoom
  useEffect(() => {
    if (!selectedTripId || !mapInstanceRef.current) return;
    const trip = trips.find((t) => t.tripId === selectedTripId);
    if (trip?.lastLocation?.lat && trip?.lastLocation?.lng) {
      mapInstanceRef.current.flyTo([trip.lastLocation.lat, trip.lastLocation.lng], 16, {
        duration: 0.8,
      });
      setActiveFlyoutTrip(trip);
    }
  }, [selectedTripId, trips]);

  const handleCenterAll = () => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const coords: [number, number][] = trips
      .filter((t) => t.lastLocation?.lat && t.lastLocation?.lng)
      .map((t) => [t.lastLocation!.lat, t.lastLocation!.lng]);

    if (coords.length > 0) {
      mapInstanceRef.current.fitBounds(LRef.current.latLngBounds(coords), { padding: [50, 50] });
    }
  };

  return (
    <div className={`relative w-full h-full bg-slate-100 overflow-hidden ${className}`}>
      {/* Map canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs">
        <span className="font-bold text-slate-800 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-emerald-700" />
          <span>Fleet Layer:</span>
        </span>
        <span className="text-slate-600 font-semibold">
          {filteredTrips.length} {filteredTrips.length === 1 ? 'vehicle' : 'vehicles'} visible
        </span>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={handleCenterAll}
          title="Center map on all active vehicles"
          className="p-2 bg-white/95 backdrop-blur-md hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 shadow-sm transition-all flex items-center gap-1 text-xs font-semibold"
        >
          <Crosshair className="w-4 h-4 text-emerald-700" />
          <span className="hidden sm:inline">Fit Fleet</span>
        </button>
      </div>

      {/* Empty State Overlay */}
      {filteredTrips.length === 0 && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/10 backdrop-blur-[2px] pointer-events-none p-6 text-center">
          <div className="bg-white/95 p-5 rounded-xl border border-slate-200 shadow-md max-w-sm pointer-events-auto">
            <Navigation className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No Active Vehicles in View</h4>
            <p className="text-xs text-slate-600 mt-1">
              Vehicles will appear here as soon as drivers initiate morning or afternoon trips with active GPS telemetry.
            </p>
          </div>
        </div>
      )}

      {/* Floating Selected Vehicle Command Card */}
      {activeFlyoutTrip && (
        <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-96 z-20 bg-white/98 backdrop-blur-lg rounded-xl border border-slate-200 shadow-xl p-4 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">{activeFlyoutTrip.routeCode}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  activeFlyoutTrip.slaStatus === 'delayed'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {activeFlyoutTrip.slaStatus === 'delayed' ? `+${activeFlyoutTrip.delayMinutes}m Delayed` : 'On Schedule'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {activeFlyoutTrip.vehicleType === 'auto_rickshaw' ? 'Auto-rickshaw' : activeFlyoutTrip.vehicleType?.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{activeFlyoutTrip.schoolName}</p>
            </div>
            <button
              onClick={() => setActiveFlyoutTrip(null)}
              className="text-slate-400 hover:text-slate-700 p-1 text-base font-bold"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 py-3 border-b border-slate-100 text-center">
            <div className="bg-slate-50 p-2 rounded border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Speed</span>
              <span className="font-bold text-slate-900 text-sm">{activeFlyoutTrip.speedKph} km/h</span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Students</span>
              <span className="font-bold text-slate-900 text-sm">{activeFlyoutTrip.passengersBoarded} / {activeFlyoutTrip.totalPassengers}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Telemetry</span>
              <span className="font-bold text-slate-900 text-sm">{activeFlyoutTrip.lastUpdated}</span>
            </div>
          </div>

          <div className="pt-3 space-y-1.5 text-slate-600 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Driver:</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                {activeFlyoutTrip.driverName}
                {activeFlyoutTrip.driverPhone && (
                  <a href={`tel:${activeFlyoutTrip.driverPhone}`} className="text-emerald-700 hover:text-emerald-900 ml-1">
                    <Phone className="w-3 h-3 inline" />
                  </a>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Vehicle:</span>
              <span className="font-semibold text-slate-800 font-mono">{activeFlyoutTrip.vehicleNumber} ({activeFlyoutTrip.vehicleModel})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Arrival ETA:</span>
              <span className="font-bold text-emerald-800">{activeFlyoutTrip.eta}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <a
              href={`/admin/trips?id=${activeFlyoutTrip.tripId}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-[11px] font-semibold transition-colors"
            >
              <span>Full Trip Timeline</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCommandMap;
