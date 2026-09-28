'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Phone } from 'lucide-react';

function AdminAlertsContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'all';

  const [alerts] = useState([
    {
      id: 'alt-1',
      type: 'delay',
      title: 'Route M-02 delayed by 8 minutes',
      routeCode: 'M-02',
      driverName: 'Venkatesh Rao',
      driverPhone: '+91 98765 43203',
      vehicleReg: 'TS09-TR-105',
      schoolName: 'Olive Mount Global School',
      expectedArrival: '08:14 AM',
      severity: 'warning',
      time: '6m ago',
    },
    {
      id: 'alt-2',
      type: 'telemetry',
      title: 'Vehicle TS09-TR-114 transponder offline',
      routeCode: 'M-07',
      driverName: 'K. Srinivas',
      driverPhone: '+91 98765 43233',
      vehicleReg: 'TS10-TR-114',
      schoolName: 'Delhi Public School, Nacharam',
      severity: 'info',
      time: '18m ago',
    },
  ]);

  const [typeFilter, setTypeFilter] = useState(initialType);

  const filtered = alerts.filter((a) => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 max-w-[1520px] mx-auto text-slate-100 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-extrabold text-white">Central Operations Alerts</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              {filtered.length} Active Alerts
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Real-time warnings, route SLA breaches, vehicle delays, and school communications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Alert Types</option>
            <option value="delay">Route Delays</option>
            <option value="telemetry">Telemetry Drops</option>
            <option value="boarding">Boarding Mismatches</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0 font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-slate-950 uppercase">
                    {item.type}
                  </span>
                  <span className="font-extrabold text-sm text-white">{item.title}</span>
                </div>
                <p className="text-slate-300 text-[11px] mt-1">
                  Driver: <strong className="text-white">{item.driverName}</strong> ({item.driverPhone})
                  {' · '}
                  Vehicle: <span className="font-mono text-white">{item.vehicleReg}</span>
                  {' · '}
                  School: <span className="text-white">{item.schoolName}</span>
                </p>
                <span className="text-[10px] text-slate-500 mt-1 block">Triggered {item.time}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-2 md:pt-0">
              <a
                href={`tel:${item.driverPhone}`}
                className="flex-1 md:flex-initial px-3 py-2 md:py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg font-semibold flex items-center justify-center gap-1.5 min-h-[42px] md:min-h-0"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call Driver</span>
              </a>
              <Link
                href="/admin/trips"
                className="flex-1 md:flex-initial px-3 py-2 md:py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold flex items-center justify-center min-h-[42px] md:min-h-0"
              >
                Inspect Trip
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAlertsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading operational alerts...</div>}>
      <AdminAlertsContent />
    </Suspense>
  );
}
