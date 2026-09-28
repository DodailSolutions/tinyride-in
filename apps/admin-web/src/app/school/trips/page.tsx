'use client';

import React, { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';

export default function SchoolTripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/school/data')
      .then((res) => res.json())
      .then((data) => setTrips(data?.trips || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-[#006B2F] border border-emerald-200">
          Trip Logs
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
          Daily Trips &amp; History
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Audit records of all morning pickups and afternoon school drop runs
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading trip logs...</div>
      ) : trips.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center mx-auto mb-3">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Trips Logged Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Trip logs, start timestamps, arrival durations, and student boarding tallies will appear here as drivers run routes.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Driver</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Boarded</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {trip.routes?.code || 'Route'} • {trip.routes?.name}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {trip.drivers?.profiles?.full_name || 'Driver'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {trip.vehicles?.registration_number || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {trip.students_boarded_count ?? 0}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          trip.state === 'completed'
                            ? 'bg-slate-100 text-slate-700'
                            : trip.state === 'in_progress'
                            ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {trip.state}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(trip.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
