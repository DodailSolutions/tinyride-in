'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Navigation,
  KeyRound,
  CheckCircle2,
  Play,
  School,
  RefreshCw,
  MapPin,
  Compass,
} from 'lucide-react';

interface DriverTrip {
  id: string;
  status: string;
  serviceType: string;
  route: {
    id: string;
    name: string;
    schoolName: string;
    stops: Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      stopOrder: number;
    }>;
  };
  vehicle: {
    registrationNumber: string;
    makeModel: string;
  };
  children: Array<{
    tripChildId: string;
    childId: string;
    name: string;
    grade: string;
    state: 'pending' | 'picked_up' | 'at_school' | 'dropped_off' | 'absent';
    pickupStopName?: string;
  }>;
}

// 4 realistic waypoints from Rainbow Vistas Gate 2 to Olive Mount Campus
const SIMULATED_WAYPOINTS = [
  { lat: 17.4720, lng: 78.3970, heading: 175, speed: 24, name: 'Rainbow Vistas Gate 2' },
  { lat: 17.4420, lng: 78.4010, heading: 160, speed: 38, name: 'Hitec City Flyover' },
  { lat: 17.4100, lng: 78.4120, heading: 155, speed: 42, name: 'Jubilee Enroute' },
  { lat: 17.3719, lng: 78.4182, heading: 140, speed: 18, name: 'Olive Mount Campus Bay' },
];

export default function DriverConsolePage() {
  const [trip, setTrip] = useState<DriverTrip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [safeKeyCode, setSafeKeyCode] = useState('');
  const [selectedTripChildId, setSelectedTripChildId] = useState<string>('');
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);
  const [currentWaypointIdx, setCurrentWaypointIdx] = useState(0);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [isUsingDeviceGps, setIsUsingDeviceGps] = useState(false);
  const simTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const loadDriverData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/driver/trips');
      if (res.ok) {
        const data = await res.json();
        setTrip(data.trip || null);
        if (data.trip?.children?.length > 0) {
          setSelectedTripChildId(data.trip.children[0].tripChildId);
        }
      }
    } catch (err) {
      console.error('Failed to load driver trip:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDriverData();
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const sendGpsTelemetry = async (lat: number, lng: number, heading = 0, speed = 25) => {
    if (!trip) return;
    try {
      const res = await fetch('/api/driver/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          latitude: lat,
          longitude: lng,
          heading,
          speedKph: speed,
          accuracyMeters: 4.5,
        }),
      });
      if (res.ok) {
        setStatusMessage(`GPS broadcasted: [${lat.toFixed(4)}, ${lng.toFixed(4)}] @ ${speed} km/h`);
      }
    } catch (e) {
      console.warn('GPS telemetry send failed:', e);
    }
  };

  const handleStartTrip = async () => {
    if (!trip) return;
    try {
      const res = await fetch('/api/driver/trip/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: trip.id }),
      });
      if (res.ok) {
        setStatusMessage('Trip started! Route is live.');
        loadDriverData();
      }
    } catch {
      setStatusMessage('Error starting trip');
    }
  };

  const handleNextWaypoint = () => {
    const nextIdx = (currentWaypointIdx + 1) % SIMULATED_WAYPOINTS.length;
    setCurrentWaypointIdx(nextIdx);
    const pt = SIMULATED_WAYPOINTS[nextIdx]!;
    sendGpsTelemetry(pt.lat, pt.lng, pt.heading, pt.speed);
  };

  const toggleAutoSim = () => {
    if (isAutoSimulating) {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
      setIsAutoSimulating(false);
      setStatusMessage('Auto GPS transmission paused.');
    } else {
      setIsAutoSimulating(true);
      setStatusMessage('Auto GPS active: broadcasting vehicle telemetry every 3s.');
      let idx = currentWaypointIdx;
      simTimerRef.current = setInterval(() => {
        idx = (idx + 1) % SIMULATED_WAYPOINTS.length;
        setCurrentWaypointIdx(idx);
        const pt = SIMULATED_WAYPOINTS[idx]!;
        sendGpsTelemetry(pt.lat, pt.lng, pt.heading, pt.speed);
      }, 3000);
    }
  };

  const toggleDeviceGps = () => {
    if (isUsingDeviceGps) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      setIsUsingDeviceGps(false);
      setStatusMessage('Phone GPS disconnected.');
    } else {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }
      setIsUsingDeviceGps(true);
      setStatusMessage('Listening to real device GPS...');
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          sendGpsTelemetry(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.heading || 0,
            pos.coords.speed ? pos.coords.speed * 3.6 : 30
          );
        },
        (err) => {
          setStatusMessage(`GPS error: ${err.message}`);
          setIsUsingDeviceGps(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
      );
    }
  };

  const handleVerifySafeKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTripChildId || !safeKeyCode.trim()) {
      setStatusMessage('Please enter student SafeKey code.');
      return;
    }
    setIsVerifyingKey(true);
    try {
      const res = await fetch('/api/driver/safekey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripChildId: selectedTripChildId,
          code: safeKeyCode.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(`SafeKey Verified! Student marked boarded.`);
        setSafeKeyCode('');
        loadDriverData();
      } else {
        setStatusMessage(data.error || 'Invalid SafeKey code');
      }
    } catch {
      setStatusMessage('Verification request failed');
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleArriveSchool = async () => {
    if (!trip) return;
    try {
      const res = await fetch('/api/driver/trip/arrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripId: trip.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage('Campus arrival logged! All parents notified.');
        loadDriverData();
      } else {
        setStatusMessage(data.error || 'Campus arrival failed');
      }
    } catch {
      setStatusMessage('Network error recording arrival');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Driver Cockpit Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-xs">
              TR
            </div>
            <div>
              <h1 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Driver Cockpit</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {trip?.vehicle?.registrationNumber || 'TS09-TR-102'}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                {trip?.route?.name || 'Route 04 Express'} • Ravi Kumar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/parent"
              target="_blank"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Open Parent App ↗
            </Link>
          </div>
        </div>
      </header>

      {/* Main Console Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-4">
        {/* Status Toast Notification Bar */}
        {statusMessage && (
          <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 text-xs text-emerald-200 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage('')}
              className="text-emerald-400 font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Trip Controls Card */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Trip Status</div>
              <div className="text-lg font-black text-white capitalize">{trip?.status || 'Scheduled'}</div>
            </div>
            <button
              type="button"
              onClick={handleStartTrip}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Start Trip</span>
            </button>
          </div>

          {/* GPS Broadcast Controls */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Real-Time GPS Broadcast</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleNextWaypoint}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex flex-col items-center justify-center text-center gap-1 active:scale-95 transition-all"
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Next Waypoint</span>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {SIMULATED_WAYPOINTS[currentWaypointIdx]?.name || 'Waypoint'}
                </span>
              </button>

              <button
                type="button"
                onClick={toggleAutoSim}
                className={`p-3 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center text-center gap-1 active:scale-95 transition-all ${
                  isAutoSimulating
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-900/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                <Navigation className={`w-4 h-4 ${isAutoSimulating ? 'animate-spin' : 'text-emerald-400'}`} />
                <span>{isAutoSimulating ? 'Pause Auto Sim' : 'Auto Drive Sim'}</span>
                <span className="text-[10px] opacity-75">Every 3s broadcast</span>
              </button>

              <button
                type="button"
                onClick={toggleDeviceGps}
                className={`p-3 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center text-center gap-1 active:scale-95 transition-all col-span-2 sm:col-span-1 ${
                  isUsingDeviceGps
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                }`}
              >
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>{isUsingDeviceGps ? 'Stop Phone GPS' : 'Use Phone GPS'}</span>
                <span className="text-[10px] opacity-75">Native Geolocation</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. SafeKey Handshake / Student Manifest Card */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-sm text-white">SafeKey Boarding Handshake</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {trip?.children?.filter((c) => c.state === 'picked_up').length || 0} /{' '}
              {trip?.children?.length || 0} Boarded
            </span>
          </div>

          {/* Student Picker */}
          {trip?.children && trip.children.length > 0 ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">Select Student to Verify:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {trip.children.map((c) => (
                    <button
                      key={c.tripChildId}
                      type="button"
                      onClick={() => setSelectedTripChildId(c.tripChildId)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        selectedTripChildId === c.tripChildId
                          ? 'bg-emerald-950/60 border-emerald-500 text-white'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.grade} • {c.pickupStopName}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.state === 'picked_up'
                            ? 'bg-emerald-900 text-emerald-300'
                            : c.state === 'at_school'
                            ? 'bg-blue-900 text-blue-300'
                            : c.state === 'absent'
                            ? 'bg-rose-900 text-rose-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {c.state.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SafeKey Form */}
              <form onSubmit={handleVerifySafeKey} className="flex gap-2 pt-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit SafeKey"
                  value={safeKeyCode}
                  onChange={(e) => setSafeKeyCode(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isVerifyingKey}
                  className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  {isVerifyingKey ? 'Verifying...' : 'Verify SafeKey'}
                </button>
              </form>

              {/* Quick One-Click Fill for Aarav Sharma */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                <span>Quick Test Code:</span>
                <button
                  type="button"
                  onClick={() => setSafeKeyCode('482910')}
                  className="text-emerald-400 font-mono font-bold hover:underline"
                >
                  482910
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 py-3">No students assigned to trip.</div>
          )}
        </div>

        {/* 3. Campus Arrival Card */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <School className="w-4 h-4 text-blue-400" />
              <span>Campus Drop-Off</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Arrive at {trip?.route?.schoolName || 'Olive Mount Global School'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleArriveSchool}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white shadow-md active:scale-95 transition-all"
          >
            Log Arrival
          </button>
        </div>
      </main>
    </div>
  );
}
