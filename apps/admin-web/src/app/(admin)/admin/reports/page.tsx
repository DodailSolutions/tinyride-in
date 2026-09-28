'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';

export default function AdminReportsPage() {
  const [reports] = useState([
    {
      title: 'Daily Transportation Execution Summary',
      period: 'Today (Live)',
      metrics: '18 Trips · 84 Students Transported · 98.4% SLA Adherence',
      type: 'Operational',
    },
    {
      title: 'Route SLA & Delay Breakdown',
      period: 'Last 7 Days',
      metrics: '126 Runs Completed · Average delay on M-02: 6.2 mins (Peak traffic)',
      type: 'SLA Analytics',
    },
    {
      title: 'Driver Telemetry & SafeKey Compliance',
      period: 'This Month',
      metrics: '100% Verified Boardings · Zero Unverified Handover Exceptions',
      type: 'Safety Audit',
    },
    {
      title: 'Vehicle Fleet Utilization & Kilometers',
      period: 'September 2026',
      metrics: '1,420 km Traveled · 88% Average Passenger Seat Utilization',
      type: 'Fleet',
    },
  ]);

  return (
    <div className="space-y-4 max-w-[1520px] mx-auto text-slate-100 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-extrabold text-white">Operations Reporting &amp; Audit Logs</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              4 Core Datasets
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Auditable transportation metrics, on-time performance (OTP), boarding audit trails, and vehicle utilization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((rep, idx) => (
          <div
            key={idx}
            className="p-5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                  {rep.type}
                </span>
                <span className="text-[11px] font-mono text-slate-500">{rep.period}</span>
              </div>
              <h3 className="font-extrabold text-sm text-white mt-2">{rep.title}</h3>
              <p className="text-slate-400 text-xs mt-1">{rep.metrics}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">JSON/CSV Export Ready</span>
              <button
                onClick={() => alert(`Exporting ${rep.title}...`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
