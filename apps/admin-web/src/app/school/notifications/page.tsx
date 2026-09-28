'use client';

import React from 'react';
import { Bell } from 'lucide-react';

export default function SchoolNotificationsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-50 text-[#006B2F] border border-emerald-200">
          Alert Feed
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
          School Transit Notifications
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time alerts regarding trip activations, gate arrivals, and student boarding exceptions
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center mx-auto mb-3">
          <Bell className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">All Systems Operational</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          No critical transit exceptions or vehicle delays reported. When unexpected route events or student handover issues occur, real-time alerts will trigger here.
        </p>
      </div>
    </div>
  );
}
