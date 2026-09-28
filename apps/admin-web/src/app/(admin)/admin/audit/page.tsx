'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs] = useState([
    {
      id: 'aud-1',
      adminUser: 'Central Controller (Platform Admin)',
      action: 'DRIVER_APPROVED',
      target: 'Driver: Ravi Kumar (ID: a534e5bf)',
      note: 'KYC verified & approved for commercial operations.',
      time: 'Today, 07:05 AM',
    },
    {
      id: 'aud-2',
      adminUser: 'Central Controller (Platform Admin)',
      action: 'VEHICLE_ASSIGNED',
      target: 'TS09-TR-102 assigned to Route M-01',
      note: 'RTA fitness validation passed.',
      time: 'Today, 07:10 AM',
    },
    {
      id: 'aud-3',
      adminUser: 'Operations Officer',
      action: 'SAFETY_ALERT_RESOLVED',
      target: 'Exception EXC-HYD-002',
      note: 'Stop delay resolved following traffic clearance.',
      time: 'Today, 07:50 AM',
    },
    {
      id: 'aud-4',
      adminUser: 'Central Controller (Platform Admin)',
      action: 'SCHOOL_NOTIFIED',
      target: 'Olive Mount Global School',
      note: 'Dispatched delay warning to campus front office.',
      time: 'Today, 08:02 AM',
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
            <h1 className="text-base font-extrabold text-white">Administrative Action Audit Log</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              Immutable System Spine
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Append-only audit trail recording driver approvals, vehicle assignments, exception closures, and role modifications.
          </p>
        </div>
      </div>

      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Operator</th>
              <th className="py-3 px-4">Action Code</th>
              <th className="py-3 px-4">Affected Entity</th>
              <th className="py-3 px-4">Justification Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-medium">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{log.time}</td>
                <td className="py-3.5 px-4 font-semibold text-slate-200">{log.adminUser}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase bg-slate-800 text-emerald-400 border border-slate-700">
                    {log.action}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-semibold text-white">{log.target}</td>
                <td className="py-3.5 px-4 text-slate-300">{log.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
