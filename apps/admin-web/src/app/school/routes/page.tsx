'use client';

import React, { useEffect, useState } from 'react';
import { Route, MapPin, CheckCircle2 } from 'lucide-react';

export default function SchoolRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/school/data')
      .then((res) => res.json())
      .then((data) => setRoutes(data?.routes || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-[#006B2F] border border-emerald-200">
            Corridors &amp; Schedules
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
            School Transport Routes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-approved school bus and auto-rickshaw pickup corridors
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">Loading route corridors...</div>
      ) : routes.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center mx-auto mb-3">
            <Route className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Routes Registered Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            School transport corridors allow drivers to navigate designated stops and broadcast arrival estimates to waiting parents.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((route) => (
            <div
              key={route.id}
              className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-mono font-extrabold text-[#006B2F] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    {route.code}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                    {route.direction || 'Inbound'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 mt-3">{route.name}</h4>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{route.stops_count || 0} scheduled pickup stops</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Active Corridor</span>
                </span>
                <span className="text-slate-400">Synced</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
