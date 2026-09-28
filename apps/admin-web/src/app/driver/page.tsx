'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Play,
  RefreshCw,
  Compass,
  AlertTriangle,
  LogOut,
  Truck,
} from 'lucide-react';
import { logoutDriver } from '@/lib/driverAuth';

interface RouteStop {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  stopType?: string;
}

interface StudentManifest {
  tripChildId: string;
  childId: string;
  name: string;
  grade: string;
  stopName: string;
  state: 'pending' | 'picked_up' | 'at_school' | 'dropped_off' | 'absent';
}

interface DriverTripSummary {
  id: string;
  state: string;
  direction: string;
  scheduled_start?: string;
  actual_start?: string;
  actual_end?: string;
  route_id: string;
}

interface ActiveTripDetail extends DriverTripSummary {
  routeName: string;
  schoolName: string;
  routeStops: RouteStop[];
  students: StudentManifest[];
}

interface DriverDataResponse {
  driver: {
    id: string;
    name: string | null;
    phone: string;
    status: string;
  };
  vehicle: {
    id: string;
    registrationNumber: string;
    makeModel: string;
    vehicleType: string;
  } | null;
  todayTrips: DriverTripSummary[];
  activeTrip: ActiveTripDetail | null;
}

export default function DriverDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DriverDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [confirmStartTripId, setConfirmStartTripId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/driver/data', { credentials: 'include' });
      if (res.status === 401) {
        router.replace('/driver/login');
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load driver dashboard data');
      }
      const json: DriverDataResponse = await res.json();
      setData(json);

      // If there's an active trip in progress, auto-redirect or prompt to view
      if (json.activeTrip && json.activeTrip.state === 'in_progress') {
        router.push(`/driver/trip/${json.activeTrip.id}`);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartTrip = async (tripId: string) => {
    setIsStartingTrip(true);
    setErrorMsg(null);
    try {
      // Optional: try getting current coordinate to send with start
      let lat: number | undefined;
      let lng: number | undefined;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {}
      }

      const res = await fetch('/api/driver/trip/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tripId, lat, lng }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to start trip');
      }

      // Success -> navigate to active trip console
      router.push(`/driver/trip/${tripId}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error starting trip');
      setIsStartingTrip(false);
    }
  };

  const handleLogout = async () => {
    await logoutDriver();
    router.replace('/driver/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-slate-900 text-white flex flex-col items-center justify-center p-6">
        <RefreshCw className="w-8 h-8 text-[#006B2F] animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Loading driver console...</p>
      </div>
    );
  }

  const driver = data?.driver;
  const vehicle = data?.vehicle;
  const todayTrips = data?.todayTrips || [];
  const scheduledTrip = todayTrips.find((t) => t.state === 'scheduled' || t.state === 'ready');
  const completedTrips = todayTrips.filter((t) => t.state === 'completed');

  return (
    <div className="min-h-dvh bg-slate-950 text-white flex flex-col font-sans pb-12 select-none">
      {/* Top Mobile App Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#006B2F] flex items-center justify-center font-black text-white text-xs shadow-inner">
            TR
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">TinyRide Driver</h1>
            <p className="text-sm font-bold text-white tracking-tight mt-0.5">{driver?.name || 'Driver Console'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white active:scale-95 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-rose-400 active:scale-95 transition-all"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 pt-5 max-w-lg mx-auto w-full flex flex-col gap-4">
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800/60 rounded-2xl flex items-center gap-3 text-rose-200 text-xs animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <p className="flex-1 leading-snug">{errorMsg}</p>
          </div>
        )}

        {/* Assigned Vehicle Card */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Vehicle</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ready
            </span>
          </div>

          {vehicle ? (
            <div className="flex items-center gap-3.5 mt-1">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 text-emerald-400">
                <Truck className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold text-white tracking-wide truncate">
                  {vehicle.registrationNumber}
                </h3>
                <p className="text-xs text-slate-400 font-medium capitalize truncate">
                  {vehicle.makeModel} • {vehicle.vehicleType.replace('_', ' ')}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-2 text-slate-500 text-xs font-medium">
              No vehicle actively assigned today. Contact your fleet supervisor.
            </div>
          )}
        </section>

        {/* Action Priority / Next Ride */}
        <section className="flex-1 flex flex-col gap-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Today&apos;s Schedule
          </h2>

          {scheduledTrip ? (
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border-2 border-emerald-600/40 rounded-3xl p-5 shadow-xl flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-[#006B2F]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1.5">
                    {scheduledTrip.direction === 'inbound' ? 'Morning School Run' : 'Afternoon Dropoff'}
                  </span>
                  <h3 className="text-xl font-black text-white tracking-tight">Scheduled Route</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Scheduled</span>
                  <span className="text-sm font-black text-white font-mono">
                    {scheduledTrip.scheduled_start
                      ? new Date(scheduledTrip.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '07:15 AM'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>GPS Telemetry &amp; Parent Sync</span>
                </div>
                <span className="font-bold text-emerald-400">Live Ready</span>
              </div>

              {/* Start Trip CTA */}
              <button
                type="button"
                onClick={() => setConfirmStartTripId(scheduledTrip.id)}
                disabled={isStartingTrip}
                className="w-full py-4 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] active:scale-[0.98] text-white font-black text-base rounded-2xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[56px]"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>START TRIP NOW</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center flex flex-col items-center justify-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-1" />
              <h3 className="text-base font-bold text-white">No active trips scheduled</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                {completedTrips.length > 0
                  ? "You've successfully completed all scheduled rides for today. Safe driving!"
                  : 'You have no trips assigned for today. Check back later or contact school transport ops.'}
              </p>
            </div>
          )}

          {/* Past / Completed Rides list */}
          {completedTrips.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1">
                Completed Today ({completedTrips.length})
              </span>
              {completedTrips.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-200 capitalize">
                        {t.direction === 'inbound' ? 'Morning Pickup' : 'Afternoon Return'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Finished {t.actual_end ? new Date(t.actual_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded-md">
                    Complete
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Modal: Start Trip */}
      {confirmStartTripId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Play className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Start School Ride?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  This will notify parents and initiate live GPS satellite tracking for your vehicle.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 rounded-2xl p-3 flex flex-col gap-2 text-xs border border-slate-800/80">
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-bold text-slate-200">{vehicle?.registrationNumber || 'Assigned Bus'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Telemetry:</span>
                <span className="font-bold text-emerald-400">High-precision GPS</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmStartTripId(null)}
                disabled={isStartingTrip}
                className="flex-1 py-3 text-slate-400 hover:text-white font-bold text-xs rounded-xl bg-slate-800 active:scale-95 transition-all min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStartTrip(confirmStartTripId)}
                disabled={isStartingTrip}
                className="flex-2 py-3 bg-[#006B2F] hover:bg-[#005525] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all min-h-[44px]"
              >
                {isStartingTrip ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Initiating...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Confirm &amp; Start</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
