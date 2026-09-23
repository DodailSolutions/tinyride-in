'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SchoolShellProps {
  children: React.ReactNode;
}

export function SchoolShell({ children }: SchoolShellProps) {
  const pathname = usePathname();
  const [staffRole, setStaffRole] = useState<'gate_security' | 'transport_coordinator' | 'principal'>(
    'gate_security',
  );

  const navItems = [
    { label: 'Dashboard', href: '/', icon: 'dashboard' },
    { label: 'Morning Arrivals', href: '/arrivals', icon: 'wb_sunny' },
    { label: 'Afternoon Releases', href: '/releases', icon: 'clear_day' },
    { label: 'Student Roster', href: '/roster', icon: 'groups' },
    { label: 'Gate Exceptions', href: '/exceptions', icon: 'warning' },
  ];

  return (
    <div className="min-h-screen bg-surface font-sans text-primary-text">
      {/* Stitch Fixed Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col pt-6 pb-8 shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-surface-container-high/60">
        {/* Brand Header */}
        <div className="px-6 mb-7 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src="/brand/logo-horizontal.png"
              alt="TinyRide — Little Rides. Big Peace of Mind."
              className="h-10 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>
          <span className="text-[10px] bg-sun-gold/20 text-amber-900 border border-sun-gold/40 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Gate
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'text-secondary-text hover:bg-surface-container-high hover:text-primary-text'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-xl">{item.icon}</span>
                <span className="font-headline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Security & Gate Verification Notice */}
        <div className="px-4 mb-4">
          <div className="p-3.5 bg-surface-container-lowest rounded-xl border border-surface-container-high/60 text-xs space-y-1 shadow-xs">
            <div className="flex items-center gap-1.5 text-primary font-bold font-headline">
              <span className="material-symbols-outlined text-base">verified_user</span>
              <span>Dual-Handover Active</span>
            </div>
            <p className="text-[11px] text-secondary-text leading-relaxed">
              SafeKey PIN & OTP validation required for all bus departures and guardian handoffs.
            </p>
          </div>
        </div>

        {/* Staff Profile Pill */}
        <div className="px-6 pt-4 border-t border-surface-container-high/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <span className="material-symbols-outlined text-base">person</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold font-headline text-primary-text truncate">Oakridge Staff Officer</p>
              <p className="text-[11px] text-secondary-text truncate">Oakridge Gachibowli</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Layout with 72-unit left padding */}
      <div className="pl-72 flex flex-col min-h-screen">
        {/* Stitch Frosted Glass Header */}
        <header className="fixed top-0 left-72 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-8 border-b border-surface-container-high/50">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">school</span>
            </div>
            <span className="text-base lg:text-lg font-bold font-headline text-primary-text">
              Oakridge International School Portal
            </span>
            <span className="bg-sun-gold/15 text-amber-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-sun-gold/30">
              Campus Gate 2
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Operations Pill */}
            <div className="flex items-center gap-2 bg-surface-container-low border border-primary/20 px-3.5 py-1.5 rounded-full shadow-xs">
              <span className="material-symbols-outlined text-primary text-base animate-pulse">schedule</span>
              <span className="text-xs font-bold text-primary font-headline">Live Dismissal Sync</span>
            </div>

            {/* Duty Role Switcher */}
            <div className="flex items-center gap-1.5 bg-surface-container-low border border-surface-container-high px-3 py-1.5 rounded-full text-xs">
              <span className="material-symbols-outlined text-primary text-sm">badge</span>
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as any)}
                aria-label="Staff Duty Role"
                className="bg-transparent text-primary-text font-bold text-xs outline-none cursor-pointer pr-1"
              >
                <option value="gate_security">Gate Security Officer</option>
                <option value="transport_coordinator">Transport Coordinator</option>
                <option value="principal">School Principal / Admin</option>
              </select>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 pt-20 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
