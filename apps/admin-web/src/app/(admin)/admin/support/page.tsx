'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, LifeBuoy } from 'lucide-react';

export default function AdminSupportPage() {
  const [tickets] = useState([
    {
      id: 'TKT-20260928-A01',
      requester: 'Priya Sharma (Parent)',
      subject: 'Pickup stop relocation request for next term',
      category: 'Route Modification',
      status: 'open',
      priority: 'normal',
      time: '1h ago',
    },
    {
      id: 'TKT-20260928-B04',
      requester: 'Olive Mount Admin (School)',
      subject: 'Early dispersal on Friday due to sports meet',
      category: 'Schedule Update',
      status: 'in_progress',
      priority: 'high',
      time: '3h ago',
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
            <h1 className="text-base font-extrabold text-white">Operations Support Desk</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {tickets.length} Active Inquiries
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Parent inquiries, school schedule exceptions, and driver support ticket routing.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 font-bold flex-shrink-0">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 text-[10px]">{t.id}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                    {t.category}
                  </span>
                  <span className="font-extrabold text-sm text-white">{t.subject}</span>
                </div>
                <p className="text-slate-300 text-[11px] mt-1">Requester: <strong>{t.requester}</strong></p>
                <span className="text-[10px] text-slate-500 mt-1 block">Opened {t.time}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                onClick={() => alert(`Opening ticket ${t.id}`)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
              >
                Respond
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
