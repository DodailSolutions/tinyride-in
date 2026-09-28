'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Navigation, RefreshCw, RotateCw } from 'lucide-react';
import type { AdminMapTrip } from '@/components/admin/AdminCommandMap';

const AdminCommandMap = dynamic(() => import('@/components/admin/AdminCommandMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-950 text-slate-400 text-xs">
      <RefreshCw className="w-5 h-5 animate-spin text-emerald-500 mr-2" />
      <span>Loading Live Fleet Satellite Stream...</span>
    </div>
  ),
});

export default function AdminLiveFleetPage() {
  const [trips, setTrips] = useState<AdminMapTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'delayed' | 'at_school' | 'offline'>('all');

  const fetchFleet = async () => {
    try {
      const res = await fetch('/api/admin/command-center');
      if (res.ok) {
        const json = await res.json();
        setTrips(json.liveTrips || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchFleet();
    const interval = setInterval(fetchFleet, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredTrips = trips.filter((t) => {
    if (filterType !== 'all' && t.vehicleType !== filterType) return false;
    if (filterStatus === 'active' && !['in_progress', 'ready'].includes(t.currentPhase)) return false;
    if (filterStatus === 'delayed' && t.slaStatus !== 'delayed') return false;
    if (filterStatus === 'at_school' && t.currentPhase !== 'at_school') return false;
    if (filterStatus === 'offline' && t.isOnline) return false;
    return true;
  });

  return (
    <div className="space-y-4 max-w-[1520px] mx-auto text-slate-100 text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-extrabold text-white">Live Fleet Telemetry &amp; GPS Monitor</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
              {filteredTrips.length} Active Transmitters
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Real-time geospatial location, heading, velocity, and stop progression across Hyderabad municipal limits.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All States</option>
            <option value="active">Active Only</option>
            <option value="delayed">Delayed Only</option>
            <option value="at_school">At School Campus</option>
            <option value="offline">Offline Transponders</option>
          </select>

          {/* Vehicle Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Vehicle Types</option>
            <option value="auto_rickshaw">Auto-rickshaws</option>
            <option value="van">Minibuses</option>
            <option value="school_bus">School Buses</option>
          </select>

          <button
            onClick={fetchFleet}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Map + Side Telemetry Grid (Stacked on mobile/tablet, 8:4 on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[640px]">
        {/* Full Interactive Map: 380px on mobile, 480px on tablet, 100% on desktop */}
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative shadow-xl h-[380px] sm:h-[480px] lg:h-full">
          <AdminCommandMap
            trips={trips}
            selectedTripId={selectedTripId}
            onSelectTrip={(id) => setSelectedTripId(id)}
            filterStatus={filterStatus}
            filterVehicleType={filterType}
            className="w-full h-full"
          />
        </div>

        {/* Live Vehicle Telemetry Cards: 400px on mobile/tablet, 100% on desktop */}
        <div className="lg:col-span-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-xl h-[400px] lg:h-full">
          <div className="p-3.5 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <span className="font-bold text-white text-xs">Fleet Transponders</span>
            <span className="text-[11px] font-mono text-slate-400">{filteredTrips.length} Registered</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredTrips.length > 0 ? (
              filteredTrips.map((trip) => {
                const isSelected = selectedTripId === trip.tripId;
                return (
                  <div
                    key={trip.tripId}
                    onClick={() => setSelectedTripId(trip.tripId)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-white">{trip.routeCode}</span>
                          <span className="font-mono text-xs text-slate-300">{trip.vehicleNumber}</span>
                          <span className="text-[10px] text-slate-500 uppercase">
                            {trip.vehicleType === 'auto_rickshaw' ? 'Auto' : trip.vehicleType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{trip.schoolName}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400 block">
                          {trip.speedKph} km/h
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{trip.lastUpdated}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="text-slate-300 font-medium">{trip.driverName}</span>
                      <Link
                        href={`/admin/trips?id=${trip.tripId}`}
                        className="text-emerald-400 hover:text-emerald-300 font-bold"
                      >
                        Inspect Route →
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-slate-500">
                <Navigation className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="font-bold text-slate-400">No Vehicles Match Criteria</p>
                <p className="text-[11px] mt-1">Adjust status or vehicle type filters above.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
