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

interface RealTrackingMapProps {
  vehicleLocation: MapLocation | null;
  routeStops: MapStop[];
  pickupStopName?: string;
  schoolName?: string;
  vehicleNumber?: string;
  childName?: string;
  tripState?: string;
}

export default function RealTrackingMap({
  vehicleLocation,
  routeStops,
  schoolName = 'School Campus',
  vehicleNumber = 'TS09-TR-102',
  childName = 'Child',
}: RealTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [userHasPanned, setUserHasPanned] = useState(false);
  const LRef = useRef<typeof L | null>(null);

  // Load Leaflet dynamically on browser
  useEffect(() => {
    let isMounted = true;
    import('leaflet').then((L) => {
      if (!isMounted) return;
      LRef.current = L;
      setLeafletLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;
    const L = LRef.current;
    if (!L) return;

    // Default center to Hyderabad or first stop
    const initialLat = vehicleLocation?.latitude || routeStops[0]?.latitude || 17.472;
    const initialLng = vehicleLocation?.longitude || routeStops[0]?.longitude || 78.397;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    // Add Tile Layer (CartoDB Voyager: crisp, modern, light mobility aesthetic)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Zoom control at top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Track user drag/pan
    map.on('dragstart', () => {
      setUserHasPanned(true);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [leafletLoaded]);

  // Update Route Stops and Corridor Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L || routeStops.length === 0) return;

    // Draw route polyline
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

    // Add Stop Markers
    routeStops.forEach((stop) => {
      const isPickup = stop.isPickupStop;
      const isSchool = stop.isSchoolStop;

      let iconHtml = `
        <div style="
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #006B2F;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
      `;

      if (isPickup) {
        iconHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              background: #2563eb;
              color: white;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 6px;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(37,99,235,0.4);
              margin-bottom: 2px;
            ">${childName}&apos;s Pickup</div>
            <div style="
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #2563eb;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            "></div>
          </div>
        `;
      } else if (isSchool) {
        iconHtml = `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              background: #dc2626;
              color: white;
              font-size: 10px;
              font-weight: 800;
              padding: 2px 6px;
              border-radius: 6px;
              white-space: nowrap;
              box-shadow: 0 2px 6px rgba(220,38,38,0.4);
              margin-bottom: 2px;
            ">Campus Gate</div>
            <div style="
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #dc2626;
              border: 3px solid white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
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

  // Update Vehicle Marker & Follow Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = LRef.current;
    if (!map || !L || !vehicleLocation) return;

    const { latitude, longitude, heading = 0 } = vehicleLocation;
    const latLng: [number, number] = [latitude, longitude];

    // Vehicle custom SVG icon with directional arrow heading
    const vehicleIconHtml = `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
        <!-- Pulsing radial radar ring -->
        <div style="
          position: absolute;
          inset: 0px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.25);
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <!-- Vehicle circle pin -->
        <div style="
          position: relative;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #006B2F;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 12px rgba(0, 107, 47, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${heading || 0}deg);
          transition: transform 0.6s ease;
        ">
          <!-- Directional navigation arrow -->
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1.5">
            <polygon points="12 2 19 21 12 17 5 21 12 2" />
          </svg>
        </div>
      </div>
    `;

    const vehicleIcon = L.divIcon({
      html: vehicleIconHtml,
      className: 'tinyride-vehicle-marker',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.setLatLng(latLng);
      vehicleMarkerRef.current.setIcon(vehicleIcon);
    } else {
      vehicleMarkerRef.current = L.marker(latLng, {
        icon: vehicleIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }

    // Auto-center if user hasn't actively panned away
    if (!userHasPanned) {
      map.panTo(latLng, { animate: true, duration: 1 });
    }
  }, [leafletLoaded, vehicleLocation, userHasPanned]);

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

      {/* Loading Skeleton if Leaflet loading */}
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
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-800">GPS Live Telemetry</span>
            {vehicleLocation.speedKph !== undefined && vehicleLocation.speedKph !== null && (
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

      {/* Recenter Button (shows when user panned or on demand) */}
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
        </div>
      </div>
    </div>
  );
}
