'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type * as L from 'leaflet';
import Link from 'next/link';
import { Crosshair, ArrowRight, Phone, AlertTriangle, RefreshCw, Settings, ShieldAlert } from 'lucide-react';

export interface AdminMapTrip {
  tripId: string;
  routeCode: string;
  routeName: string;
  schoolName: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleType: 'auto_rickshaw' | 'van' | 'school_bus' | 'force_traveller' | string;
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
  isStale?: boolean;
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
// Vehicle Vector SVGs (Auto-rickshaw, Van, Bus, Force Traveller)
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

function getVehicleIconSvg(vehicleType: string, slaStatus: string, isOnline: boolean, isStale: boolean): string {
  let color = '#006B2F'; // Emerald green
  if (!isOnline) {
    color = '#64748B'; // Offline slate
  } else if (isStale) {
    color = '#D97706'; // Stale amber
  } else if (slaStatus === 'delayed') {
    color = '#EA580C'; // Delayed orange
  } else if (slaStatus === 'attention') {
    color = '#DC2626'; // Alert red
  }

  const v = (vehicleType || '').toLowerCase();
  if (v.includes('auto') || v.includes('rickshaw') || v.includes('three')) {
    return autoRickshawSvg(color);
  }
  if (v.includes('bus')) {
    return busSvg(color);
  }
  return vanSvg(color);
}

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

type MapState = 'connected' | 'config_error' | 'temp_failure';

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
  const [mapState, setMapState] = useState<MapState>('connected');
  const [overrideProvider, setOverrideProvider] = useState<string | null>(null);
  const [activeFlyoutTrip, setActiveFlyoutTrip] = useState<AdminMapTrip | null>(null);
  const consecutiveTileErrorsRef = useRef<number>(0);

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

    // Inject Leaflet CSS if not already loaded
    if (!document.getElementById('leaflet-admin-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-admin-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet')
      .then((leafletModule) => {
        LRef.current = leafletModule.default || leafletModule;
        setLeafletReady(true);
      })
      .catch(() => {
        setMapState('temp_failure');
      });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Determine Tile Layer URL & Attribution based on environment configuration
  const getTileConfig = useCallback((): { url: string; options: L.TileLayerOptions; error?: string } => {
    const provider = (overrideProvider || process.env.NEXT_PUBLIC_MAP_PROVIDER || 'osm').toLowerCase();
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
    const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;

    if (provider === 'mapbox') {
      if (!mapboxToken) {
        return {
          url: '',
          options: {},
          error: 'Mapbox access token is required (NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN).',
        };
      }
      return {
        url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
        options: {
          maxZoom: 19,
          tileSize: 512,
          zoomOffset: -1,
          attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>',
        },
      };
    }

    if (provider === 'maptiler') {
      if (!maptilerKey) {
        return {
          url: '',
          options: {},
          error: 'MapTiler API key is required (NEXT_PUBLIC_MAPTILER_API_KEY).',
        };
      }
      return {
        url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerKey}`,
        options: {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a>',
        },
      };
    }

    if (provider === 'carto') {
      if (!cartoKey) {
        return {
          url: '',
          options: {},
          error: 'Carto API key is required (NEXT_PUBLIC_CARTO_API_KEY).',
        };
      }
      return {
        url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?api_key=${cartoKey}`,
        options: {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        },
      };
    }

    // Default: High-availability standard OpenStreetMap tile layer (reliable, free, zero watermark errors)
    return {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    };
  }, [overrideProvider]);

  // Initialize Map
  const initMap = useCallback(() => {
    if (!leafletReady || !mapContainerRef.current || !LRef.current) return;
    const L = LRef.current;

    // Check configuration
    const tileConfig = getTileConfig();
    if (tileConfig.error) {
      setMapState('config_error');
      return;
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [17.3850, 78.4867], // Hyderabad Municipal Center
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      const tileLayer = L.tileLayer(tileConfig.url, tileConfig.options);

      consecutiveTileErrorsRef.current = 0;
      tileLayer.on('tileerror', () => {
        consecutiveTileErrorsRef.current += 1;
        // If multiple tiles fail continuously, flag temporary failure
        if (consecutiveTileErrorsRef.current > 6) {
          setMapState('temp_failure');
        }
      });

      tileLayer.on('load', () => {
        consecutiveTileErrorsRef.current = 0;
        setMapState('connected');
      });

      tileLayer.addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      mapInstanceRef.current = map;
      setMapState('connected');
    } catch {
      setMapState('temp_failure');
    }
  }, [leafletReady, getTileConfig]);

  useEffect(() => {
    initMap();
  }, [initMap]);

  // Update Markers on Trips change
  useEffect(() => {
    if (mapState !== 'connected' || !mapInstanceRef.current || !LRef.current) return;
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

    // Add or update markers with smooth GPS interpolation
    filteredTrips.forEach((trip) => {
      if (!trip.lastLocation?.lat || !trip.lastLocation?.lng) return;
      const { lat, lng } = trip.lastLocation;
      validCoords.push([lat, lng]);

      const isStale = Boolean(trip.isStale || (trip.lastUpdated && trip.lastUpdated.includes('ago') && parseInt(trip.lastUpdated) >= 2));
      const svgHtml = getVehicleIconSvg(trip.vehicleType, trip.slaStatus, trip.isOnline, isStale);
      const pulseColor = isStale ? 'rgba(217,119,6,0.35)' : trip.slaStatus === 'delayed' ? 'rgba(217,119,6,0.4)' : 'rgba(0,107,47,0.35)';
      const pulseRing = trip.isOnline && !isStale
        ? `<div style="position:absolute;top:1px;left:2px;width:44px;height:44px;border-radius:50%;background:${pulseColor};animation:admin-pulse 2.2s infinite;pointer-events:none;"></div>`
        : '';

      const badgeText = isStale ? 'GPS STALE' : trip.routeCode;
      const badgeBg = isStale ? '#B45309' : trip.slaStatus === 'delayed' ? '#D97706' : '#0F172A';

      const markerHtml = `
        <div style="position:relative;width:48px;height:54px;display:flex;flex-direction:column;align-items:center;cursor:pointer;" title="${trip.routeCode} • ${trip.driverName}">
          ${pulseRing}
          <div style="transform:rotate(${trip.heading || 0}deg);transform-origin:22px 20px;transition:transform 0.5s ease;">
            ${svgHtml}
          </div>
          <div style="position:absolute;bottom:0px;background:${badgeBg};color:#FFFFFF;font-size:9px;font-weight:800;padding:1px 5px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.4);letter-spacing:0.4px;">
            ${badgeText}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: 'admin-vehicle-marker',
        iconSize: [48, 54],
        iconAnchor: [24, 27],
      });

      const existingMarker = currentMarkers.get(trip.tripId);
      if (existingMarker) {
        // Smoothly interpolate position to new GPS coordinate
        existingMarker.setLatLng([lat, lng]);
        existingMarker.setIcon(icon);
      } else {
        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .on('click', () => {
            setActiveFlyoutTrip(trip);
            onSelectTrip?.(trip.tripId);
          });
        currentMarkers.set(trip.tripId, marker);
      }
    });

    // Auto-center if a trip is selected
    if (selectedTripId) {
      const selected = filteredTrips.find((t) => t.tripId === selectedTripId);
      if (selected?.lastLocation?.lat && selected?.lastLocation?.lng) {
        map.setView([selected.lastLocation.lat, selected.lastLocation.lng], 15, { animate: true });
        setActiveFlyoutTrip(selected);
      }
    }
  }, [filteredTrips, selectedTripId, onSelectTrip, mapState]);

  // Recenter Map
  const handleRecenter = () => {
    if (!mapInstanceRef.current || !LRef.current) return;
    const map = mapInstanceRef.current;
    if (filteredTrips.length > 0) {
      const bounds: [number, number][] = filteredTrips
        .filter((t) => t.lastLocation?.lat && t.lastLocation?.lng)
        .map((t) => [t.lastLocation!.lat, t.lastLocation!.lng]);
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        return;
      }
    }
    map.setView([17.3850, 78.4867], 13);
  };

  return (
    <div className={`relative w-full h-full min-h-[460px] bg-slate-950 rounded-2xl overflow-hidden ${className}`}>
      {/* ─────────────────────────────────────────────────────────────
          STATE 1: MAP CONTAINER
      ───────────────────────────────────────────────────────────── */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* ─────────────────────────────────────────────────────────────
          STATE 2: CONFIGURATION ERROR
          (Replaces raw "API KEY REQUIRED" map tiles with clean setup CTA)
      ───────────────────────────────────────────────────────────── */}
      {mapState === 'config_error' && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center shadow-xl">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h4 className="text-base font-extrabold text-white">Live map is not configured</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add the required map provider credentials to your server environment or switch provider in Admin integrations.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href="/admin/settings/integrations"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg flex items-center gap-2"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>View Setup</span>
            </Link>
            <button
              onClick={() => {
                setOverrideProvider('osm');
                setMapState('connected');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-colors"
            >
              Use Standard OpenStreetMap
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STATE 3: TEMPORARY FAILURE
          (Graceful offline/retry state, never leaves a blank broken map)
      ───────────────────────────────────────────────────────────── */}
      {mapState === 'temp_failure' && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-400 flex items-center justify-center shadow-xl">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h4 className="text-base font-extrabold text-white">Live map temporarily unavailable</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Geospatial tile connection timed out. Vehicle telemetry streams continue logging in real-time.
            </p>
          </div>
          <button
            onClick={() => {
              setMapState('connected');
              initMap();
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition-all shadow-lg flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Top Map Status Overlay Strip */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-[11px] font-semibold text-slate-300 shadow-lg">
          <span className={`w-2 h-2 rounded-full ${
            mapState === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
          }`} />
          <span className="font-bold text-white">
            {filteredTrips.length}
          </span>
          <span className="text-slate-400">
            {filteredTrips.length === 1 ? 'Vehicle Live' : 'Vehicles Live'}
          </span>
        </div>

        <button
          onClick={handleRecenter}
          title="Recenter fleet coverage"
          className="p-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors shadow-lg"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Vehicle Detail Flyout Card */}
      {activeFlyoutTrip && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-96 z-20 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 animate-in fade-in duration-150 text-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-mono font-bold text-[11px]">
                  {activeFlyoutTrip.routeCode}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  activeFlyoutTrip.slaStatus === 'delayed'
                    ? 'bg-amber-950 text-amber-400 border border-amber-800/80'
                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}>
                  {activeFlyoutTrip.slaStatus === 'delayed' ? `+${activeFlyoutTrip.delayMinutes}m Delayed` : 'On Schedule'}
                </span>
                {activeFlyoutTrip.isStale && (
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-extrabold uppercase">
                    GPS STALE
                  </span>
                )}
              </div>
              <h4 className="font-extrabold text-white text-sm mt-1">{activeFlyoutTrip.routeName}</h4>
              <p className="text-[11px] text-slate-400">{activeFlyoutTrip.schoolName}</p>
            </div>
            <button
              onClick={() => setActiveFlyoutTrip(null)}
              className="text-slate-500 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-center">
            <div className="p-1.5 bg-slate-900/60 rounded-lg">
              <span className="text-[10px] text-slate-400 font-semibold">Speed</span>
              <p className="font-mono font-extrabold text-white text-xs">{activeFlyoutTrip.speedKph} km/h</p>
            </div>
            <div className="p-1.5 bg-slate-900/60 rounded-lg">
              <span className="text-[10px] text-slate-400 font-semibold">Boarded</span>
              <p className="font-mono font-extrabold text-white text-xs">
                {activeFlyoutTrip.passengersBoarded}/{activeFlyoutTrip.totalPassengers}
              </p>
            </div>
            <div className="p-1.5 bg-slate-900/60 rounded-lg">
              <span className="text-[10px] text-slate-400 font-semibold">Signal</span>
              <p className={`font-extrabold text-xs capitalize ${
                activeFlyoutTrip.isOnline && !activeFlyoutTrip.isStale ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {activeFlyoutTrip.isStale ? 'Stale' : activeFlyoutTrip.isOnline ? 'Live' : 'Offline'}
              </p>
            </div>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>Driver: <strong className="text-white">{activeFlyoutTrip.driverName}</strong></span>
              <span>Vehicle: <strong className="text-white">{activeFlyoutTrip.vehicleNumber}</strong></span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Last update: <strong className="text-slate-300">{activeFlyoutTrip.lastUpdated}</strong></span>
              <span>Type: <strong className="text-slate-300 capitalize">{activeFlyoutTrip.vehicleType.replace('_', ' ')}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {activeFlyoutTrip.driverPhone && (
              <a
                href={`tel:${activeFlyoutTrip.driverPhone}`}
                className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call Cabin</span>
              </a>
            )}
            <Link
              href={`/admin/trips/${activeFlyoutTrip.tripId}`}
              className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md"
            >
              <span>Inspect Run</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCommandMap;
