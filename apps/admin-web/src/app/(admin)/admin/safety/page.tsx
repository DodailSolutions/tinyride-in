'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

interface SafetyIncident {
  id: string;
  reference: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  category: string;
  schoolName: string;
  routeCode: string;
  vehicleNumber: string;
  driverName: string;
  status: 'open' | 'investigating' | 'resolved';
  occurredAt: string;
}

export default function AdminSafetyPage() {
  const [incidents, setIncidents] = useState<SafetyIncident[]>([
    {
      id: 'inc-1',
      reference: 'EXC-HYD-001',
      severity: 'medium',
      title: 'GPS Signal Gap Warning',
      category: 'telemetry',
      schoolName: 'Olive Mount Global School',
      routeCode: 'M-02',
      vehicleNumber: 'TS09-TR-105',
      driverName: 'Venkatesh Rao',
      status: 'open',
      occurredAt: '12m ago',
    },
    {
      id: 'inc-2',
      reference: 'EXC-HYD-002',
      severity: 'low',
      title: 'Boarding Window Exceeded (Minor Stop Delay)',
      category: 'schedule',
      schoolName: 'Olive Mount Global School',
      routeCode: 'M-01',
      vehicleNumber: 'TS09-TR-102',
      driverName: 'Ravi Kumar',
      status: 'resolved',
      occurredAt: '45m ago',
    },
  ]);

  const [severityFilter, setSeverityFilter] = useState('all');

  const filtered = incidents.filter((inc) => {
    if (severityFilter !== 'all' && inc.severity !== severityFilter) return false;
    return true;
  });

  const handleResolve = (id: string) => {
    setIncidents((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'resolved' } : item))
    );
  };

  return (
    <div className="space-y-4 max-w-[1520px] mx-auto text-slate-100 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-extrabold text-white">Safety Exceptions &amp; Incident Console</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {filtered.length} Recorded Items
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Audited safety events, route deviations, telemetry drops, and SafeKey mismatch investigations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
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
              <div
                className={`p-2 rounded-xl flex-shrink-0 font-bold ${
                  item.severity === 'critical'
                    ? 'bg-red-500/20 text-red-400'
                    : item.severity === 'high'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 text-[10px]">{item.reference}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                      item.severity === 'critical' ? 'text-red-400 bg-red-950' : 'text-amber-400 bg-amber-950'
                    }`}
                  >
                    {item.severity}
                  </span>
                  <span className="font-extrabold text-sm text-white">{item.title}</span>
                </div>
                <p className="text-slate-400 text-[11px] mt-1">
                  School: <strong className="text-slate-200">{item.schoolName}</strong> · Route: <span className="text-emerald-400">{item.routeCode}</span> · Vehicle: <span className="font-mono text-slate-300">{item.vehicleNumber}</span> · Driver: {item.driverName}
                </p>
                <span className="text-[10px] text-slate-500 mt-1 block">Occurred {item.occurredAt}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              {item.status !== 'resolved' ? (
                <button
                  onClick={() => handleResolve(item.id)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs transition-colors"
                >
                  Resolve Exception
                </button>
              ) : (
                <span className="px-3 py-1 bg-slate-900 text-slate-500 rounded-lg text-xs font-bold border border-slate-800">
                  Resolved
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
