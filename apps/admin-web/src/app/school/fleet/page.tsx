'use client';

import React, { useEffect, useState } from 'react';
import { Compass, MapPin, Users, Truck, RefreshCw } from 'lucide-react';

export default function SchoolFleetPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetch('/api/school/data')
      .then((res) => res.json())
      .then((resData) => setData(resData))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const trips = data?.trips || [];
  const activeTrips = trips.filter((t: any) => t.state === 'in_progress');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-[#006B2F] border border-emerald-200">
            Live Telemetry
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
            Live Fleet Monitor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time GPS positions, active speeds, and student boarding counts
          </p>
        </div>
        <button
          onClick={loadData}
          className="self-start sm:self-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {activeTrips.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center mx-auto mb-3">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Vehicles Currently on Route</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            When drivers begin morning or afternoon school runs, their live telemetry, speed, and sequential stops will appear on this operations console automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTrips.map((trip: any) => (
            <div
              key={trip.id}
              className="bg-white border border-emerald-500/30 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold text-slate-900">
                      {trip.routes?.code || 'Route'} • {trip.routes?.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Active Run
                  </span>
                </div>

                <div className="py-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Vehicle</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {trip.vehicles?.registration_number || 'Unassigned'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Driver</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {trip.drivers?.profiles?.full_name || 'Driver'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Boarded</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700">
                      {trip.students_boarded_count ?? 0} students
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
