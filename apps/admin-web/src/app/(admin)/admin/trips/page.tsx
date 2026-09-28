'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Navigation,
  RotateCw,
  Search,
} from 'lucide-react';

interface TripRow {
  tripId: string;
  routeCode: string;
  routeName: string;
  schoolName: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleType: string;
  passengersBoarded: number;
  totalPassengers: number;
  currentPhase: string;
  slaStatus: string;
  delayMinutes: number;
  eta: string;
  speedKph: number;
  lastUpdated: string;
  isOnline: boolean;
}

function AdminTripsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [trips, setTrips] = useState<TripRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTrips = async () => {
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
    fetchTrips();
  }, []);

  const filteredTrips = trips.filter((t) => {
    if (filterStatus === 'active' && !['in_progress', 'ready'].includes(t.currentPhase)) return false;
    if (filterStatus === 'delayed' && t.slaStatus !== 'delayed') return false;
    if (filterStatus === 'completed' && t.currentPhase !== 'completed') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.routeCode.toLowerCase().includes(q) ||
        t.driverName.toLowerCase().includes(q) ||
        t.vehicleNumber.toLowerCase().includes(q) ||
        t.schoolName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 max-w-[1520px] mx-auto text-slate-100 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-extrabold text-white">Transportation Trips &amp; Route Runs</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {filteredTrips.length} Filtered Runs
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Comprehensive manifest of morning pickups and afternoon return trips across all affiliated schools.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status selector */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Trips</option>
            <option value="active">Active Only</option>
            <option value="delayed">Delayed Only</option>
            <option value="completed">Completed Only</option>
          </select>

          <button
            onClick={fetchTrips}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by route code, driver, vehicle reg, or school..."
          className="bg-transparent text-xs text-white placeholder:text-slate-500 w-full focus:outline-none"
        />
      </div>

      {/* Trips Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Route &amp; Trip ID</th>
                <th className="py-3 px-4">School Campus</th>
                <th className="py-3 px-4">Driver &amp; Vehicle</th>
                <th className="py-3 px-4">Students</th>
                <th className="py-3 px-4">Speed &amp; ETA</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Telemetry</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium">
              {filteredTrips.length > 0 ? (
                filteredTrips.map((trip) => {
                  const isDelayed = trip.slaStatus === 'delayed';

                  return (
                    <tr key={trip.tripId} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-white text-xs block">{trip.routeCode}</span>
                        <span className="text-[10px] font-mono text-slate-500">{trip.tripId.slice(0, 8)}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-semibold">{trip.schoolName}</td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-semibold">{trip.driverName}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {trip.vehicleNumber} ({trip.vehicleType === 'auto_rickshaw' ? 'Auto' : trip.vehicleType})
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white">
                          {trip.passengersBoarded} / {trip.totalPassengers}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Boarded</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-emerald-400 font-bold block">{trip.speedKph} km/h</span>
                        <span className="text-[10px] text-slate-400">ETA {trip.eta}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider inline-block ${
                            isDelayed
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : trip.currentPhase === 'completed'
                              ? 'bg-slate-800 text-slate-300 border border-slate-700'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isDelayed ? `Delayed (+${trip.delayMinutes}m)` : trip.currentPhase.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{trip.lastUpdated}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/admin/trips/${trip.tripId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <Navigation className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <p className="font-bold text-slate-300">No Trips Matching Criteria</p>
                    <p className="text-[11px] mt-1">Adjust filters or search parameters above.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdminTripsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading trips dispatch table...</div>}>
      <AdminTripsContent />
    </Suspense>
  );
}
