'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function SchoolOverviewPage() {
  const [metrics] = useState({
    inboundVansToday: 4,
    totalEnrolledStudents: 16,
    morningArrivedCount: 14,
    afternoonReleasesPending: 16,
    gateAlertsCount: 0,
    activeLoadingBays: 2,
    smsDispatchedCount: 38,
  });

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-deep-blue via-[#022D53] to-primary rounded-2xl p-6 lg:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-sm">security</span>
            <span>Oakridge International Gate Control</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold font-headline tracking-tight text-white">
            School Transit &amp; Gate Command
          </h1>
          <p className="text-white/80 text-sm mt-1.5 leading-relaxed">
            Real-time biometric &amp; SafeKey student intake, verified afternoon bay dismissals, driver background verification check, and instant parent SMS synchronization.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-xs bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20">
          <span className="material-symbols-outlined text-sun-gold text-2xl">schedule</span>
          <div>
            <p className="text-white/70 font-semibold">Active Gate Windows</p>
            <p className="text-white font-bold font-headline">Morning Intake: 07:45 – 08:30 AM</p>
            <p className="text-sun-gold font-bold font-headline">Afternoon Dismissal: 03:00 – 03:45 PM</p>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Inbound Transit Vans */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold font-headline text-secondary-text uppercase tracking-wider">Transit Fleet Active</p>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">directions_bus</span>
            </div>
          </div>
          <p className="text-3xl font-black font-headline text-primary-text">{metrics.inboundVansToday} Vans</p>
          <div className="flex items-center gap-1.5 text-xs text-primary font-bold mt-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>All vehicles GPS &amp; SafeKey sync</span>
          </div>
        </div>

        {/* Morning Intake */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold font-headline text-secondary-text uppercase tracking-wider">Morning Gate Intake</p>
            <div className="w-10 h-10 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">wb_sunny</span>
            </div>
          </div>
          <p className="text-3xl font-black font-headline text-primary">
            {metrics.morningArrivedCount} <span className="text-lg font-bold text-secondary-text">/ {metrics.totalEnrolledStudents}</span>
          </p>
          <div className="flex items-center gap-1.5 text-xs text-primary font-bold mt-2">
            <span className="material-symbols-outlined text-sm">verified</span>
            <span>87.5% arrived safely at campus</span>
          </div>
        </div>

        {/* Afternoon Releases */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold font-headline text-secondary-text uppercase tracking-wider">Afternoon Dismissals</p>
            <div className="w-10 h-10 rounded-xl bg-sun-gold/15 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">clear_day</span>
            </div>
          </div>
          <p className="text-3xl font-black font-headline text-amber-700">{metrics.afternoonReleasesPending} Pending</p>
          <div className="flex items-center gap-1.5 text-xs text-secondary-text font-bold mt-2">
            <span className="material-symbols-outlined text-sm text-sun-gold">pending_actions</span>
            <span>Bays 01, 02 &amp; 03 preparing</span>
          </div>
        </div>

        {/* Gate Alerts */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold font-headline text-secondary-text uppercase tracking-wider">Gate Safety Alerts</p>
            <div className="w-10 h-10 rounded-xl bg-surface-container-low text-secondary-text flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">shield</span>
            </div>
          </div>
          <p className="text-3xl font-black font-headline text-primary-text">{metrics.gateAlertsCount}</p>
          <div className="flex items-center gap-1.5 text-xs text-primary font-bold mt-2">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>Zero open gate discrepancies</span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold font-headline text-primary-text">Gate Duty Command Desks</h2>
          <p className="text-xs text-secondary-text">Select an operational workstation for intake, release, and roster management</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/arrivals"
            className="p-6 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-sm hover:border-primary hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-xl">wb_sunny</span>
              </div>
              <h3 className="font-bold font-headline text-base text-primary-text group-hover:text-primary transition-colors">
                Morning Arrival Intake
              </h3>
              <p className="text-xs text-secondary-text mt-1.5 leading-relaxed">
                One-tap check-in for arriving vans and autos. Instantly dispatches SMS to parents that child is safe inside campus.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-primary mt-6 pt-4 border-t border-surface-container-high/40">
              <span>Open Desk</span>
              <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </Link>

          <Link
            href="/releases"
            className="p-6 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-sm hover:border-primary hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sun-gold/15 text-amber-700 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-xl">clear_day</span>
              </div>
              <h3 className="font-bold font-headline text-base text-primary-text group-hover:text-primary transition-colors">
                Afternoon Dismissal Desk
              </h3>
              <p className="text-xs text-secondary-text mt-1.5 leading-relaxed">
                Full bus bay allocation, driver photo matching, Staff PIN / Guardian OTP terminal, and departure release logging.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-primary mt-6 pt-4 border-t border-surface-container-high/40">
              <span>Manage Dismissals</span>
              <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </Link>

          <Link
            href="/roster"
            className="p-6 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-sm hover:border-primary hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-primary-container/15 text-primary-container flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-xl">groups</span>
              </div>
              <h3 className="font-bold font-headline text-base text-primary-text group-hover:text-primary transition-colors">
                Student Transport Roster
              </h3>
              <p className="text-xs text-secondary-text mt-1.5 leading-relaxed">
                Comprehensive transport registry with emergency contacts, blood group / medical tags, assigned routes, and QR codes.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-primary mt-6 pt-4 border-t border-surface-container-high/40">
              <span>View Roster</span>
              <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </Link>

          <Link
            href="/exceptions"
            className="p-6 bg-surface-container-lowest rounded-2xl border border-surface-container-high/60 shadow-sm hover:border-primary hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-danger-container text-danger-error flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-xl">warning</span>
              </div>
              <h3 className="font-bold font-headline text-base text-primary-text group-hover:text-primary transition-colors">
                Gate Discrepancy Log
              </h3>
              <p className="text-xs text-secondary-text mt-1.5 leading-relaxed">
                Log unauthorized guardian pickups, unverified driver swaps, missing roster check-ins, or security escalations directly to Central Dispatch.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-primary mt-6 pt-4 border-t border-surface-container-high/40">
              <span>Audit Logs</span>
              <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
