'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function OverviewDashboardPage() {
  const [metrics] = useState({
    activeParents: 1420,
    activeChildren: 2150,
    approvedDrivers: 142,
    approvedVehicles: 138,
    activeTrips: 124,
    openExceptions: 1,
    activeIncidents: 0,
    todayRevenuePaise: 1250000,
  });

  const liveTrips = [
    {
      id: 'TRIP-HYD-001',
      route: 'Gachibowli Loop A -> Oakridge International',
      driver: 'Ramesh Babu',
      vehicle: 'TS09UB4521 (Tata Winger)',
      phase: 'In Transit',
      phaseColor: 'bg-primary/15 text-primary',
      handovers: '14 / 16 Picked Up',
      eta: '08:15 AM',
      slaStatus: 'Normal (On-time)',
    },
    {
      id: 'TRIP-HYD-002',
      route: 'Kondapur Express -> Chirec International',
      driver: 'Suresh Kumar',
      vehicle: 'TS07UA8910 (Force Traveller)',
      phase: 'At School Gate',
      phaseColor: 'bg-secondary-container text-on-secondary-container',
      handovers: '20 / 20 Arrived',
      eta: '08:22 AM',
      slaStatus: 'Gate Verification in Progress',
    },
    {
      id: 'TRIP-HYD-003',
      route: 'Madhapur West -> Delhi Public School',
      driver: 'Mohammed Arif',
      vehicle: 'TS10UC3342 (Mahindra Cruzio)',
      phase: 'In Transit',
      phaseColor: 'bg-primary/15 text-primary',
      handovers: '11 / 14 Picked Up',
      eta: '08:35 AM',
      slaStatus: 'Normal (On-time)',
    },
    {
      id: 'TRIP-HYD-004',
      route: 'Jubilee Hills Link -> Oakridge International',
      driver: 'Venkatesh Rao',
      vehicle: 'TS08UE7789 (Tata Winger)',
      phase: 'Delayed (+8m)',
      phaseColor: 'bg-sun-gold/20 text-sun-gold',
      handovers: '9 / 12 Picked Up',
      eta: '08:42 AM',
      slaStatus: 'SLA Watch (Minor Traffic)',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Brand Hero Banner */}
      <div className="bg-gradient-to-r from-deep-blue via-[#022D53] to-primary rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-primary-container font-bold text-xs uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-[16px]">speed</span>
            Central Fleet Telemetry &bull; Hyderabad Zone
          </div>
          <h1 className="font-headline text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Executive Operations Dashboard
          </h1>
          <p className="text-white/80 text-xs sm:text-sm mt-1 leading-relaxed">
            Real-time status of school transit runs, child safety handovers, driver compliance, and double-entry ledger audits.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex w-20 h-20 bg-white rounded-2xl p-1 shadow-md items-center justify-center">
            <img
              src="/brand/logo-stacked.png"
              alt="TinyRide — Little Rides. Big Peace of Mind."
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href="/trips"
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border border-white/20 transition-all backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-[16px]">map</span>
              Live GPS Radar
            </Link>
            <Link
              href="/kyc"
              className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
              Review KYC ({metrics.approvedDrivers})
            </Link>
          </div>
        </div>
      </div>

      {/* Stitch 4-Card Key Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Active Parents & Children */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-border/60 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span
              className="p-3 bg-primary/10 text-primary rounded-xl material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              family_restroom
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
              +18% this month
            </span>
          </div>
          <div>
            <p className="text-secondary-text text-xs font-semibold mb-1">Active Parents &amp; Children</p>
            <h3 className="font-headline text-2xl text-primary-text font-bold">
              {metrics.activeParents.toLocaleString()}{' '}
              <span className="text-sm font-normal text-secondary-text">Parents</span> /{' '}
              {metrics.activeChildren.toLocaleString()}{' '}
              <span className="text-sm font-normal text-secondary-text">Kids</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 text-xs text-secondary-text flex justify-between">
            <span>Verified Guardians</span>
            <span className="text-primary font-bold">100% Biometric OTP</span>
          </div>
        </div>

        {/* Card 2: Approved Drivers & Vehicles */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-border/60 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span
              className="p-3 bg-secondary-container text-on-secondary-container rounded-xl material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              directions_car
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-bold">
              98.2% compliance
            </span>
          </div>
          <div>
            <p className="text-secondary-text text-xs font-semibold mb-1">Approved Drivers &amp; Vehicles</p>
            <h3 className="font-headline text-2xl text-primary-text font-bold">
              {metrics.approvedDrivers}{' '}
              <span className="text-sm font-normal text-secondary-text">Drivers</span> / {metrics.approvedVehicles}{' '}
              <span className="text-sm font-normal text-secondary-text">Vans</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 text-xs text-secondary-text flex justify-between">
            <span>Police Cleared</span>
            <span className="text-secondary font-bold">Zero Violations</span>
          </div>
        </div>

        {/* Card 3: Active Trips & GPS Telemetry */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-border/60 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span
              className="p-3 bg-primary-fixed text-on-primary-fixed-variant rounded-xl material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              map
            </span>
            <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> Live GPS
            </span>
          </div>
          <div>
            <p className="text-secondary-text text-xs font-semibold mb-1">Active Trips &amp; Routes</p>
            <h3 className="font-headline text-2xl text-primary-text font-bold">
              {metrics.activeTrips}{' '}
              <span className="text-sm font-normal text-secondary-text">Runs Today</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 text-xs text-secondary-text flex justify-between">
            <span>Morning &amp; Afternoon</span>
            <span className="text-primary font-bold">On-time 96.8%</span>
          </div>
        </div>

        {/* Card 4: Safety Exceptions & Incident Triage */}
        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-border/60 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span
              className="p-3 bg-sun-gold/15 text-sun-gold rounded-xl material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              warning
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent-surface text-sun-gold font-bold">
              SLA Active
            </span>
          </div>
          <div>
            <p className="text-secondary-text text-xs font-semibold mb-1">Safety Exceptions &amp; SLA</p>
            <h3 className="font-headline text-2xl text-primary-text font-bold">
              {metrics.openExceptions}{' '}
              <span className="text-sm font-normal text-secondary-text">Pending Triage</span> /{' '}
              {metrics.activeIncidents}{' '}
              <span className="text-sm font-normal text-secondary-text">Incidents</span>
            </h3>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 text-xs text-secondary-text flex justify-between">
            <span>Critical SLA</span>
            <span className="text-primary font-bold">&lt; 15 min avg response</span>
          </div>
        </div>
      </section>

      {/* Live Fleet Transit Activity Table */}
      <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-border/60 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-headline text-lg font-bold text-primary-text">Live Fleet Transit Activity</h3>
            <p className="text-xs text-secondary-text">
              Real-time telemetry, stop-by-stop SafeKey OTP handover verification, and gate arrivals.
            </p>
          </div>
          <Link
            href="/trips"
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All Live Trips</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-xs font-bold text-secondary-text uppercase tracking-wider">
                <th className="pb-3">Trip ID / Route</th>
                <th className="pb-3">Driver &amp; Vehicle</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Handover Progress</th>
                <th className="pb-3">ETA</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-sm">
              {liveTrips.map((trip) => (
                <tr key={trip.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-4">
                    <p className="font-bold text-primary-text">{trip.id}</p>
                    <p className="text-xs text-secondary-text">{trip.route}</p>
                  </td>
                  <td className="py-4">
                    <p className="font-semibold text-primary-text">{trip.driver}</p>
                    <p className="text-xs text-secondary-text font-mono">{trip.vehicle}</p>
                  </td>
                  <td className="py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${trip.phaseColor}`}>
                      {trip.phase}
                    </span>
                  </td>
                  <td className="py-4 font-medium text-primary-text">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">key</span>
                      <span>{trip.handovers}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <p className="font-semibold text-primary-text">{trip.eta}</p>
                    <p className="text-[11px] text-secondary-text">{trip.slaStatus}</p>
                  </td>
                  <td className="py-4 text-right">
                    <Link
                      href="/trips"
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline bg-surface-container-high px-3 py-1.5 rounded-lg border border-border/50"
                    >
                      <span>Track</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quick Action Operations Desks */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Desk 1: KYC Verification */}
        <div className="bg-surface-container-low rounded-2xl p-6 border border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="p-2.5 bg-surface-container-lowest text-primary rounded-xl material-symbols-outlined text-[20px]">
              badge
            </span>
            <span className="text-xs bg-sun-gold/20 text-sun-gold font-bold px-2 py-0.5 rounded-full">
              3 Pending
            </span>
          </div>
          <h4 className="font-headline text-base font-bold text-primary-text">Driver &amp; Van KYC Desk</h4>
          <p className="text-xs text-secondary-text leading-relaxed">
            Side-by-side verification of Commercial DL, Police Clearance Certificates, and Vehicle RC docs.
          </p>
          <Link
            href="/kyc"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-2"
          >
            <span>Open KYC Verification Desk</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        {/* Desk 2: Safety Exceptions & Triage */}
        <div className="bg-surface-container-low rounded-2xl p-6 border border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="p-2.5 bg-surface-container-lowest text-error rounded-xl material-symbols-outlined text-[20px]">
              warning
            </span>
            <span className="text-xs bg-error-container text-on-error-container font-bold px-2 py-0.5 rounded-full">
              1 Open SLA
            </span>
          </div>
          <h4 className="font-headline text-base font-bold text-primary-text">Safety &amp; Exception Triage</h4>
          <p className="text-xs text-secondary-text leading-relaxed">
            SLA timers for failed OTPs, gate delays, and unverified handovers with Central Dispatch escalation.
          </p>
          <Link
            href="/safety"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-2"
          >
            <span>Open Safety Exceptions Desk</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        {/* Desk 3: Finance & Double-Entry Ledger */}
        <div className="bg-surface-container-low rounded-2xl p-6 border border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="p-2.5 bg-surface-container-lowest text-secondary rounded-xl material-symbols-outlined text-[20px]">
              receipt_long
            </span>
            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
              0 Discrepancy
            </span>
          </div>
          <h4 className="font-headline text-base font-bold text-primary-text">Finance &amp; Ledger Audit</h4>
          <p className="text-xs text-secondary-text leading-relaxed">
            Double-entry balanced ledger verification, 15% platform commission vs 85% operator payable.
          </p>
          <Link
            href="/finance"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline pt-2"
          >
            <span>Open Finance &amp; Payouts Desk</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
