'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Navigation,
  KeyRound,
  CheckCircle2,
  School,
  RefreshCw,
  MapPin,
  AlertTriangle,
  ChevronLeft,
  ShieldCheck,
  UserX,
  Radio,
  Check,
  X,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useDriverGPS } from '@/hooks/useDriverGPS';
import type { MapLocation, MapStop } from '@/components/parent/RealTrackingMap';

// Dynamically import Leaflet Map to ensure SSR compatibility
const RealTrackingMap = dynamic(() => import('@/components/parent/RealTrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <Navigation className="w-4 h-4 animate-spin text-emerald-500" />
        <span>Loading map telemetry...</span>
      </div>
    </div>
  ),
});

interface RouteStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  stopType?: string;
  address?: string;
}

interface StudentManifest {
  tripChildId: string;
  childId: string;
  name: string;
  grade: string;
  stopName: string;
  state: 'pending' | 'picked_up' | 'at_school' | 'dropped_off' | 'absent';
}

interface ActiveTripData {
  id: string;
  state: string;
  direction: string;
  routeName: string;
  schoolName: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  vehicleType?: string;
  routeStops: RouteStop[];
  students: StudentManifest[];
}

export default function DriverActiveTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const router = useRouter();
  const { tripId } = use(params);

  const [trip, setTrip] = useState<ActiveTripData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // SafeKey verification modal state
  const [activeChildForSafekey, setActiveChildForSafekey] = useState<StudentManifest | null>(null);
  const [safekeyInput, setSafekeyInput] = useState('');
  const [isVerifyingSafekey, setIsVerifyingSafekey] = useState(false);
  const [safekeyError, setSafekeyError] = useState<string | null>(null);
  const [safekeySuccess, setSafekeySuccess] = useState(false);

  // Mark absent modal state
  const [childForAbsent, setChildForAbsent] = useState<StudentManifest | null>(null);
  const [isMarkingAbsent, setIsMarkingAbsent] = useState(false);

  // School arrival / Complete modal state
  const [showSchoolArriveModal, setShowSchoolArriveModal] = useState(false);
  const [isSubmittingArrive, setIsSubmittingArrive] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isCompletingTrip, setIsCompletingTrip] = useState(false);

  // Real GPS tracking hook
  const gps = useDriverGPS(tripId);

  // Fetch full trip data
  const loadTripData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/driver/trips', { credentials: 'include' });
      if (res.status === 401) {
        router.replace('/driver/login');
        return;
      }
      if (!res.ok) throw new Error('Failed to load trip');
      const data = await res.json();
      if (!data.hasTrip || !data.trip) {
        throw new Error('Trip not found or not active');
      }

      setTrip(data.trip);

      // If trip already completed, return to home
      if (data.trip.state === 'completed') {
        router.replace('/driver');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error loading trip details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTripData();
    // Auto-request GPS permission on mount
    gps.requestPermission();
    return () => {
      gps.stop();
    };
  }, [tripId]);

  // Handle SafeKey submission
  const handleVerifySafekey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChildForSafekey || safekeyInput.length !== 6) return;

    setIsVerifyingSafekey(true);
    setSafekeyError(null);

    try {
      const res = await fetch('/api/driver/safekey/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tripChildId: activeChildForSafekey.tripChildId,
          code: safekeyInput,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Invalid SafeKey code');
      }

      setSafekeySuccess(true);
      setTimeout(() => {
        setSafekeySuccess(false);
        setActiveChildForSafekey(null);
        setSafekeyInput('');
        loadTripData(true);
      }, 1200);
    } catch (err: unknown) {
      setSafekeyError(err instanceof Error ? err.message : 'SafeKey verification failed');
    } finally {
      setIsVerifyingSafekey(false);
    }
  };

  // Handle marking absent
  const handleConfirmAbsent = async () => {
    if (!childForAbsent) return;
    setIsMarkingAbsent(true);

    try {
      const res = await fetch('/api/driver/trip/absent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tripChildId: childForAbsent.tripChildId,
          reason: 'Marked absent by driver at stop',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to record absence');
      }

      setChildForAbsent(null);
      loadTripData(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating status');
    } finally {
      setIsMarkingAbsent(false);
    }
  };

  // Handle School Arrival
  const handleArriveSchool = async () => {
    setIsSubmittingArrive(true);
    try {
      const res = await fetch('/api/driver/trip/arrive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tripId }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to notify school arrival');
      }
      setShowSchoolArriveModal(false);
      loadTripData(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error reporting school arrival');
    } finally {
      setIsSubmittingArrive(false);
    }
  };

  // Handle Complete Trip
  const handleCompleteTrip = async () => {
    setIsCompletingTrip(true);
    try {
      const res = await fetch('/api/driver/trip/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tripId }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to complete trip');
      }
      router.replace('/driver');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error completing trip');
      setIsCompletingTrip(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Connecting to live trip telemetry...</p>
      </div>
    );
  }

  const students = trip?.students || [];
  const waitingCount = students.filter((s) => s.state === 'pending').length;
  const boardedCount = students.filter((s) => s.state === 'picked_up' || s.state === 'at_school').length;
  const absentCount = students.filter((s) => s.state === 'absent').length;

  // Format Map props
  const mapLocation: MapLocation | null = gps.latitude && gps.longitude ? {
    latitude: gps.latitude,
    longitude: gps.longitude,
    heading: gps.heading || 0,
    speedKph: gps.speedKph || 0,
    accuracyMeters: gps.accuracy || 5,
    recordedAt: gps.lastUpdate ? gps.lastUpdate.toISOString() : null,
  } : null;

  const mapStops: MapStop[] = (trip?.routeStops || []).map((s, idx) => ({
    id: s.id,
    name: s.name,
    latitude: s.lat,
    longitude: s.lng,
    stopOrder: idx + 1,
    isSchoolStop: idx === (trip?.routeStops.length || 0) - 1,
  }));

  return (
    <div className="min-h-dvh bg-slate-950 text-white flex flex-col font-sans pb-16 select-none">
      {/* Top Telemetry & Safety Status Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <Link
          href="/driver"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>

        {/* Live GPS Health Indicator */}
        <div className="flex items-center gap-2">
          {gps.permission === 'granted' ? (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
              gps.isStale
                ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${gps.isStale ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span>{gps.isStale ? 'Stale GPS' : 'GPS Active'}</span>
              {gps.speedKph !== null && (
                <span className="font-mono text-white/90 ml-0.5">{gps.speedKph} km/h</span>
              )}
            </div>
          ) : gps.permission === 'denied' ? (
            <button
              onClick={gps.requestPermission}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Enable GPS</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
              <Radio className="w-3 h-3 text-slate-500 animate-pulse" />
              <span>Acquiring...</span>
            </div>
          )}

          <button
            onClick={() => loadTripData(true)}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            title="Refresh Manifest"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Operating Screen */}
      <main className="flex-1 px-4 pt-3 max-w-lg mx-auto w-full flex flex-col gap-3.5">
        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-2xl flex items-center gap-2.5 text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <p className="flex-1">{errorMsg}</p>
          </div>
        )}

        {/* Real Dynamic Map */}
        <section className="overflow-hidden rounded-3xl border border-slate-800 shadow-md">
          <RealTrackingMap
            vehicleLocation={mapLocation}
            routeStops={mapStops}
            schoolName={trip?.schoolName}
            vehicleNumber={trip?.vehicleNumber}
            vehicleType={trip?.vehicleType}
          />
        </section>

        {/* Trip Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Active Route</span>
            <h2 className="text-sm font-black text-white">{trip?.routeName || 'School Express'}</h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Destination</span>
            <p className="text-xs font-bold text-emerald-400">{trip?.schoolName || 'Campus'}</p>
          </div>
        </div>

        {/* Boarding Counter Bar */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Waiting</span>
            <span className="text-xl font-black text-amber-400">{waitingCount}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Boarded</span>
            <span className="text-xl font-black text-emerald-400">{boardedCount}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Absent</span>
            <span className="text-xl font-black text-slate-500">{absentCount}</span>
          </div>
        </div>

        {/* Student Manifest: Simple Large-Touch Cards */}
        <section className="flex flex-col gap-2.5 mt-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Student Manifest ({students.length})
          </h3>

          {students.map((student) => {
            const isBoarded = student.state === 'picked_up' || student.state === 'at_school';
            const isAbsent = student.state === 'absent';
            const isPending = student.state === 'pending';

            return (
              <div
                key={student.tripChildId}
                className={`border rounded-2xl p-3.5 flex items-center justify-between transition-all ${
                  isBoarded
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
                    : isAbsent
                    ? 'bg-slate-900/40 border-slate-800/40 opacity-50 text-slate-400'
                    : 'bg-slate-900 border-slate-800 text-white shadow-sm'
                }`}
              >
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-extrabold tracking-tight truncate">{student.name}</h4>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                      {student.grade || 'Primary'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{student.stopName}</span>
                  </p>
                </div>

                {/* State action */}
                <div className="flex items-center gap-2 shrink-0">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => setChildForAbsent(student)}
                        className="p-2.5 text-slate-400 hover:text-rose-400 bg-slate-800 active:scale-95 rounded-xl text-xs font-bold transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Mark Absent"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChildForSafekey(student);
                          setSafekeyInput('');
                          setSafekeyError(null);
                        }}
                        className="px-3.5 py-2.5 bg-[#006B2F] hover:bg-[#005525] active:scale-95 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all min-h-[44px]"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>SafeKey</span>
                      </button>
                    </>
                  )}

                  {isBoarded && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-extrabold">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>BOARDED</span>
                    </div>
                  )}

                  {isAbsent && (
                    <span className="text-xs font-bold text-slate-500 px-3 py-2">ABSENT</span>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        {/* Bottom Primary Actions */}
        <section className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setShowSchoolArriveModal(true)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[52px]"
          >
            <School className="w-5 h-5" />
            <span>ARRIVED AT SCHOOL</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCompleteModal(true)}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-300 hover:text-white font-bold text-xs rounded-2xl transition-all min-h-[46px]"
          >
            End Trip for Today
          </button>
        </section>
      </main>

      {/* SafeKey Verification Modal */}
      {activeChildForSafekey && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">SafeKey Verification</span>
                <h3 className="text-lg font-black text-white mt-0.5">{activeChildForSafekey.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveChildForSafekey(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Ask parent for the 6-digit SafeKey shown on their mobile dashboard.
            </p>

            {safekeySuccess ? (
              <div className="py-8 flex flex-col items-center justify-center text-center gap-2 animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                  <CheckCheck className="w-8 h-8" />
                </div>
                <h4 className="text-base font-extrabold text-white">Handshake Verified!</h4>
                <p className="text-xs text-emerald-400 font-bold">Child successfully boarded</p>
              </div>
            ) : (
              <form onSubmit={handleVerifySafekey} className="flex flex-col gap-4">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={safekeyInput}
                  onChange={(e) => setSafekeyInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full border-2 border-slate-700 focus:border-emerald-500 bg-slate-950 rounded-2xl py-3.5 text-center text-3xl font-mono font-black text-white tracking-[0.4em] outline-none transition-colors"
                  autoFocus
                />

                {safekeyError && (
                  <p className="text-xs text-rose-400 font-bold text-center">{safekeyError}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveChildForSafekey(null)}
                    disabled={isVerifyingSafekey}
                    className="flex-1 py-3 text-slate-400 hover:text-white font-bold text-xs rounded-xl bg-slate-800 active:scale-95 transition-all min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingSafekey || safekeyInput.length !== 6}
                    className="flex-2 py-3 bg-[#006B2F] hover:bg-[#005525] disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all min-h-[44px]"
                  >
                    {isVerifyingSafekey ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify &amp; Board</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Mark Absent Modal */}
      {childForAbsent && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Mark Absent?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm that <span className="font-bold text-white">{childForAbsent.name}</span> will not be boarding this vehicle today.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setChildForAbsent(null)}
                disabled={isMarkingAbsent}
                className="flex-1 py-3 text-slate-400 hover:text-white font-bold text-xs rounded-xl bg-slate-800 active:scale-95 transition-all min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAbsent}
                disabled={isMarkingAbsent}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all min-h-[44px]"
              >
                {isMarkingAbsent ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Confirm Absent</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* School Arrival Confirmation Modal */}
      {showSchoolArriveModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Arrived at School?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This alerts all parents that the vehicle has safely entered {trip?.schoolName || 'campus'}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSchoolArriveModal(false)}
                disabled={isSubmittingArrive}
                className="flex-1 py-3 text-slate-400 hover:text-white font-bold text-xs rounded-xl bg-slate-800 active:scale-95 transition-all min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArriveSchool}
                disabled={isSubmittingArrive}
                className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all min-h-[44px]"
              >
                {isSubmittingArrive ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Confirm Campus Arrival</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">End This Trip?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete this route and cease live location broadcasting.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                disabled={isCompletingTrip}
                className="flex-1 py-3 text-slate-400 hover:text-white font-bold text-xs rounded-xl bg-slate-800 active:scale-95 transition-all min-h-[44px]"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleCompleteTrip}
                disabled={isCompletingTrip}
                className="flex-2 py-3 bg-[#006B2F] hover:bg-[#005525] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all min-h-[44px]"
              >
                {isCompletingTrip ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Finish &amp; Complete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
