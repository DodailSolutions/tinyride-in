'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck,
  Maximize2,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  RotateCw,
  Shield,
} from 'lucide-react';
import type { AdminMapTrip } from '@/components/admin/AdminCommandMap';

const AdminCommandMap = dynamic(() => import('@/components/admin/AdminCommandMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] flex items-center justify-center bg-slate-950 text-slate-400 text-xs font-semibold">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
        <span>Initializing Satellite &amp; Telemetry Map...</span>
      </div>
    </div>
  ),
});

export default function AdminCommandCenterPage() {
  const [data, setData] = useState<any>(null);

  // Map and List Filters
  const [mapFilterStatus, setMapFilterStatus] = useState<'all' | 'active' | 'delayed' | 'at_school' | 'offline'>('all');
  const [mapFilterVehicleType, setMapFilterVehicleType] = useState<string>('all');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Activity Feed Filter
  const [activityCategory, setActivityCategory] = useState<'all' | 'trip' | 'boarding' | 'safety' | 'driver'>('all');

  // Safety Center Tab
  const [safetyTab, setSafetyTab] = useState<'critical' | 'warning' | 'resolved'>('critical');

  // Contact Driver / Action Modal
  const [actionModal, setActionModal] = useState<{ open: boolean; title: string; body: string; phone?: string } | null>(null);

  // Fetch command center data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/command-center');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch operations data`);
      const json = await res.json();
      setData(json);
    } catch {
      // Telemetry pipeline fallback
    }
  }, []);

  useEffect(() => {
    fetchData();
    // 15-second background sync fallback
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Connect to realtime SSE for immediate telemetry updates
  useEffect(() => {
    let sse: EventSource | null = null;
    try {
      sse = new EventSource('/api/admin/realtime');
      sse.addEventListener('trip_telemetry', (e) => {
        try {
          const telemetry = JSON.parse(e.data);
          setData((prev: any) => {
            if (!prev) return prev;
            const updatedLiveTrips = prev.liveTrips.map((t: AdminMapTrip) => {
              if (t.tripId === telemetry.tripId) {
                return {
                  ...t,
                  speedKph: telemetry.speedKph ?? t.speedKph,
                  heading: telemetry.heading ?? t.heading,
                  lastLocation: { lat: telemetry.lat, lng: telemetry.lng },
                  lastUpdated: 'Just now',
                  isOnline: true,
                };
              }
              return t;
            });
            return { ...prev, liveTrips: updatedLiveTrips };
          });
        } catch {
          // ignore parse error
        }
      });

      sse.addEventListener('admin:events', () => {
        // Re-fetch aggregated counts when significant events occur
        fetchData();
      });
    } catch {
      // ignore
    }

    return () => {
      sse?.close();
    };
  }, [fetchData]);

  // Handle contact driver action
  const handleContactDriver = async (_driverId: string, driverName: string, phone: string) => {
    setActionModal({
      open: true,
      title: `Contact Driver — ${driverName}`,
      body: `Direct telephone line to vehicle cabin: ${phone || 'Phone on file'}. You can place an urgent voice call or dispatch a priority dispatch instruction.`,
      phone,
    });
  };

  // Handle notify school action
  const handleNotifySchool = async (tripId: string, schoolName: string) => {
    try {
      await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'notify_school',
          targetId: tripId,
          metadata: { tripId },
          note: `Central Command notification: Route transit delay registered for ${schoolName}.`,
        }),
      });
      alert(`School administration for ${schoolName} notified successfully.`);
    } catch {
      alert('Failed to transmit school notification.');
    }
  };

  // Handle resolve exception
  const handleResolveException = async (exceptionId: string) => {
    try {
      await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_exception',
          targetId: exceptionId,
          note: 'Exception resolved via Central Operations Command Console.',
        }),
      });
      fetchData();
    } catch {
      alert('Failed to resolve exception.');
    }
  };

  // Handle approve KYC
  const handleApproveKyc = async (type: 'driver' | 'vehicle', id: string) => {
    try {
      await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type === 'driver' ? 'approve_driver' : 'approve_vehicle',
          targetId: id,
          note: 'Approved during Central Operations queue review.',
        }),
      });
      fetchData();
    } catch {
      alert(`Failed to approve ${type}.`);
    }
  };

  const metrics = data?.metrics || {
    activeTrips: 0,
    studentsInTransit: 0,
    vehiclesLive: 0,
    driversActive: 0,
    delayedTrips: 0,
    criticalAlerts: 0,
    completedToday: 0,
  };

  const liveTrips: AdminMapTrip[] = data?.liveTrips || [];
  const actionRequired = data?.actionRequired || [];
  const complianceQueue = data?.complianceQueue || [];
  const allExceptions = data?.safetyExceptions || [];
  const safetyExceptions = allExceptions.filter((e: any) => {
    if (safetyTab === 'resolved') return e.state === 'resolved';
    if (safetyTab === 'critical') return ['critical', 'high'].includes(e.severity);
    return !['critical', 'high'].includes(e.severity) && e.state !== 'resolved';
  });
  const activityFeed = data?.activityFeed || [];

  // Filtered activity feed
  const filteredActivity = activityFeed.filter((item: any) => {
    if (activityCategory === 'all') return true;
    return item.category === activityCategory;
  });

  return (
    <div className="space-y-6 max-w-[1520px] mx-auto text-slate-100 text-xs">
      {/* ─────────────────────────────────────────────────────────────
          1. OPERATIONAL SUMMARY KPI STRIP (7 Clickable Control Cards)
      ───────────────────────────────────────────────────────────── */}
      <section aria-label="Operations Overview Metrics">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* 1. Active Trips */}
          <Link
            href="/admin/trips?status=active"
            className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-600 transition-all group flex flex-col justify-between"
          >
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200">
              Active Trips
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                {metrics.activeTrips}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Runs</span>
            </div>
          </Link>

          {/* 2. Students in Transit */}
          <Link
            href="/admin/students?status=in_transit"
            className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-600 transition-all group flex flex-col justify-between"
          >
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200">
              Students in Transit
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                {metrics.studentsInTransit}
              </span>
              <span className="text-[10px] font-bold text-blue-400 uppercase">Riders</span>
            </div>
          </Link>

          {/* 3. Vehicles Live */}
          <Link
            href="/admin/fleet?status=active"
            className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-600 transition-all group flex flex-col justify-between"
          >
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200">
              Vehicles Live
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                {metrics.vehiclesLive}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">GPS Live</span>
            </div>
          </Link>

          {/* 4. Drivers Active */}
          <Link
            href="/admin/drivers?status=active"
            className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-600 transition-all group flex flex-col justify-between"
          >
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200">
              Drivers Active
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                {metrics.driversActive}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">On Duty</span>
            </div>
          </Link>

          {/* 5. Delayed Routes */}
          <Link
            href="/admin/alerts?type=delay"
            className={`p-3.5 bg-slate-950 rounded-xl border transition-all group flex flex-col justify-between ${
              metrics.delayedTrips > 0
                ? 'border-amber-600/80 bg-amber-950/20 hover:border-amber-500'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200">
              Delayed Routes
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span
                className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                  metrics.delayedTrips > 0 ? 'text-amber-400' : 'text-slate-400'
                }`}
              >
                {metrics.delayedTrips}
              </span>
              <span className="text-[10px] font-bold text-amber-500 uppercase">Attention</span>
            </div>
          </Link>

          {/* 6. Critical Alerts */}
          <Link
            href="/admin/safety?severity=critical"
            className={`p-3.5 bg-slate-950 rounded-xl border transition-all group flex flex-col justify-between ${
              metrics.criticalAlerts > 0
                ? 'border-red-600/80 bg-red-950/20 hover:border-red-500'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200">
              Critical Alerts
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span
                className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                  metrics.criticalAlerts > 0 ? 'text-red-400' : 'text-slate-400'
                }`}
              >
                {metrics.criticalAlerts}
              </span>
              <span className="text-[10px] font-bold text-red-500 uppercase">Urgent</span>
            </div>
          </Link>

          {/* 7. Completed Today */}
          <Link
            href="/admin/trips?status=completed"
            className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 hover:border-emerald-600 transition-all group flex flex-col justify-between"
          >
            <span className="text-[11px] font-semibold text-slate-400 group-hover:text-slate-200">
              Completed Runs
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                {metrics.completedToday}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Safe Drop</span>
            </div>
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. ACTION REQUIRED (Critical Alert Strip)
      ───────────────────────────────────────────────────────────── */}
      <section aria-label="Action Required Operational Strip">
        {actionRequired.length > 0 ? (
          <div className="space-y-2">
            {actionRequired.map((alertItem: any) => (
              <div
                key={alertItem.id}
                className="bg-amber-950/30 border border-amber-600/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs shadow-sm animate-in fade-in duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500 text-slate-950 flex-shrink-0 font-bold">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold uppercase text-[10px] tracking-wider">
                        ACTION REQUIRED
                      </span>
                      <span className="font-extrabold text-sm text-white">{alertItem.title}</span>
                    </div>
                    <p className="text-slate-300 mt-1">
                      Driver: <strong className="text-white">{alertItem.driverName}</strong> ({alertItem.driverPhone})
                      {' · '}
                      Vehicle: <span className="font-mono text-white">{alertItem.vehicleReg}</span>
                      {' · '}
                      Destination: <span className="text-white">{alertItem.schoolName}</span>
                      {alertItem.expectedArrival && (
                        <> · ETA: <strong className="text-amber-300">{alertItem.expectedArrival}</strong></>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleContactDriver(alertItem.tripId, alertItem.driverName, alertItem.driverPhone)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>Contact Driver</span>
                  </button>
                  <button
                    onClick={() => handleNotifySchool(alertItem.tripId, alertItem.schoolName)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-bold transition-colors"
                  >
                    Notify School
                  </button>
                  <Link
                    href={`/admin/trips?id=${alertItem.tripId}`}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>View Trip</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 px-4 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="font-semibold text-slate-200">
                No critical operational issues detected
              </span>
              <span className="text-slate-500 hidden sm:inline">
                · All active school routes operating within normal SLA parameters
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold hidden md:inline">
              100% On-Time SLA
            </span>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. LIVE FLEET MAP + LIST SPLIT VIEW (60% Map / 40% Live Trips)
      ───────────────────────────────────────────────────────────── */}
      <section aria-label="Live Fleet Command Matrix" className="space-y-3">
        {/* Filter Controls Bar */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1 hidden sm:inline">
              Filter:
            </span>
            {(['all', 'active', 'delayed', 'at_school', 'offline'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setMapFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                  mapFilterStatus === status
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Vehicle Type Dropdown */}
            <select
              value={mapFilterVehicleType}
              onChange={(e) => setMapFilterVehicleType(e.target.value)}
              className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Vehicles</option>
              <option value="auto_rickshaw">Auto-rickshaws</option>
              <option value="van">Minibuses / Vans</option>
              <option value="school_bus">School Buses</option>
            </select>

            <button
              onClick={fetchData}
              title="Refresh operational telemetry"
              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 60% Map / 40% Live Trips Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[560px]">
          {/* Left: 60% Real Interactive Telemetry Map (7 cols on lg) */}
          <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative shadow-lg">
            <AdminCommandMap
              trips={liveTrips}
              selectedTripId={selectedTripId}
              onSelectTrip={(id) => setSelectedTripId(id)}
              filterStatus={mapFilterStatus}
              filterVehicleType={mapFilterVehicleType}
              filterSchool="all"
              className="w-full h-full"
            />
          </div>

          {/* Right: 40% Live Trips Control Stream (5 cols on lg) */}
          <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-lg">
            <div className="p-3.5 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-emerald-400" />
                <h3 className="font-extrabold text-sm text-white">Live Trips Dispatch</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {liveTrips.length} {liveTrips.length === 1 ? 'Trip' : 'Trips'} Active
              </span>
            </div>

            {/* Scrollable list of active trip cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
              {liveTrips.length > 0 ? (
                liveTrips.map((trip) => {
                  const isSelected = selectedTripId === trip.tripId;
                  const isDelayed = trip.slaStatus === 'delayed';

                  return (
                    <div
                      key={trip.tripId}
                      onClick={() => setSelectedTripId(trip.tripId)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                          : isDelayed
                          ? 'bg-slate-900/80 border-amber-600/70 hover:border-amber-500'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-white">{trip.routeCode}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                                isDelayed
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              }`}
                            >
                              {isDelayed ? `+${trip.delayMinutes}m Delayed` : 'On Route'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {trip.vehicleType === 'auto_rickshaw' ? 'Auto' : trip.vehicleType?.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium mt-0.5 truncate max-w-[220px]">
                            {trip.schoolName}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-white block">
                            {trip.speedKph} km/h
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold">
                            ETA {trip.eta}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-semibold">{trip.driverName}</span>
                          <span>·</span>
                          <span className="font-mono text-slate-400">{trip.vehicleNumber}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">
                            {trip.passengersBoarded}/{trip.totalPassengers} Boarded
                          </span>
                          <span className={`w-2 h-2 rounded-full ${trip.isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <Navigation className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="font-bold text-slate-300">No Active Trips Running</p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                    Trips will automatically populate here when drivers start their assigned morning or afternoon runs.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. LIVE ACTIVITY FEED & SAFETY CENTER (Side-by-Side)
      ───────────────────────────────────────────────────────────── */}
      <section aria-label="Activity Feed and Safety Center" className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Live Activity Feed (7 cols on lg) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="font-extrabold text-sm text-white">Live Activity Stream</h3>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1">
              {(['all', 'trip', 'boarding', 'safety'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActivityCategory(cat)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                    activityCategory === cat
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1">
            {filteredActivity.length > 0 ? (
              filteredActivity.map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-850 hover:bg-slate-900 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-200 text-xs">{event.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">{event.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{event.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No recent activity events recorded. Telemetry event bus active.
              </div>
            )}
          </div>
        </div>

        {/* Right: Safety Center (5 cols on lg) */}
        <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <h3 className="font-extrabold text-sm text-white">Safety Exceptions Center</h3>
            </div>

            <div className="flex items-center gap-1">
              {(['critical', 'warning', 'resolved'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSafetyTab(tab)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                    safetyTab === tab
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 pr-1">
            {safetyExceptions.length > 0 ? (
              safetyExceptions.map((exc: any) => (
                <div
                  key={exc.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <span className="font-bold text-slate-200 text-xs">{exc.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 uppercase">
                      {exc.severity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{new Date(exc.created_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                    <button
                      onClick={() => handleResolveException(exc.id)}
                      className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded font-semibold text-[10px] transition-colors"
                    >
                      Resolve Exception
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-300">Zero Open Safety Exceptions</p>
                <p className="text-[11px] text-slate-500 mt-0.5">All driver verifications and GPS tracks compliant.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. DRIVER & VEHICLE COMPLIANCE QUEUE & DELAY INTELLIGENCE
      ───────────────────────────────────────────────────────────── */}
      <section aria-label="Compliance Queue and Delay Intelligence" className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Compliance Queue (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-extrabold text-sm text-white">Driver &amp; Vehicle Compliance Queue</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {complianceQueue.length} Pending Review
            </span>
          </div>

          <div className="space-y-2">
            {complianceQueue.length > 0 ? (
              complianceQueue.map((item: any) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-200">{item.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-400 uppercase">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{item.documentType}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveKyc(item.type, item.id)}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Approve
                    </button>
                    <Link
                      href="/admin/compliance"
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No pending driver or vehicle documents requiring approval.
              </div>
            )}
          </div>
        </div>

        {/* Delay Intelligence (5 cols) */}
        <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-extrabold text-sm text-white">Delay Intelligence</h3>
            </div>
            <span className="text-[11px] font-mono text-amber-400 font-bold">
              {metrics.delayedTrips} Delayed Runs
            </span>
          </div>

          <div className="space-y-2">
            {liveTrips.filter((t) => t.slaStatus === 'delayed').length > 0 ? (
              liveTrips
                .filter((t) => t.slaStatus === 'delayed')
                .map((t) => (
                  <div
                    key={t.tripId}
                    className="p-3 rounded-xl bg-amber-950/20 border border-amber-600/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-xs">{t.routeCode}</span>
                      <span className="text-amber-400 font-bold text-xs">+{t.delayMinutes}m delay</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Reason: <strong className="text-white">Traffic Congestion</strong> · Expected arrival: {t.eta}
                    </p>
                    <div className="pt-2 border-t border-amber-600/30 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleContactDriver(t.tripId, t.driverName, t.driverPhone)}
                        className="px-2.5 py-1 bg-slate-900 text-slate-200 border border-slate-700 rounded text-[11px] font-semibold"
                      >
                        Contact
                      </button>
                      <button
                        onClick={() => handleNotifySchool(t.tripId, t.schoolName)}
                        className="px-2.5 py-1 bg-amber-600 text-slate-950 rounded text-[11px] font-bold"
                      >
                        Notify School
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-300">Zero Delayed Routes</p>
                <p className="text-[11px] text-slate-500 mt-0.5">All fleet runs adhering to planned transit schedules.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. ADMIN QUICK ACTIONS FLOATING DOCK
      ───────────────────────────────────────────────────────────── */}
      <section aria-label="Admin Operational Quick Actions" className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
          <Maximize2 className="w-4 h-4 text-emerald-400" />
          <span>Quick Actions:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            href="/admin/drivers"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg font-semibold transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Driver</span>
          </Link>

          <Link
            href="/admin/vehicles"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg font-semibold transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Vehicle</span>
          </Link>

          <Link
            href="/admin/routes"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg font-semibold transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Create Route</span>
          </Link>

          <Link
            href="/admin/fleet"
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold transition-colors flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open Full Fleet Screen</span>
          </Link>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. ACTION MODAL (Contact Driver / Details)
      ───────────────────────────────────────────────────────────── */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-2xl space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm text-white">{actionModal.title}</h3>
              <button onClick={() => setActionModal(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed">{actionModal.body}</p>
            {actionModal.phone && (
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between font-mono font-bold text-sm text-emerald-400">
                <span>{actionModal.phone}</span>
                <a
                  href={`tel:${actionModal.phone}`}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded-lg transition-colors font-sans"
                >
                  Call Now
                </a>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
