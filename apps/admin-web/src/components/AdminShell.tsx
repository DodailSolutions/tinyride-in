'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState<'admin' | 'operator' | 'kyc_reviewer' | 'finance_admin'>(
    'admin',
  );

  const navItems = [
    { label: 'Overview', href: '/', icon: 'dashboard' },
    { label: 'Driver Verification', href: '/kyc', icon: 'verified_user' },
    { label: 'Live Fleet Monitor', href: '/trips', icon: 'map' },
    { label: 'Safety Exceptions', href: '/safety', icon: 'warning' },
    { label: 'Finance & Payouts', href: '/finance', icon: 'payments' },
    { label: 'Support Desk', href: '/support', icon: 'support_agent' },
  ];

  return (
    <div className="min-h-screen flex bg-surface font-body text-on-surface">
      {/* Stitch Fixed Left Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col pt-6 pb-8 border-r border-border/50">
        {/* Brand Header */}
        <div className="px-6 mb-7 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src="/brand/logo-horizontal.png"
              alt="TinyRide — Little Rides. Big Peace of Mind."
              className="h-10 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>
          <span className="text-[10px] bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Ops
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
                }`}
              >
                <span
                  className="material-symbols-outlined mr-3 text-[20px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Safety & Compliance Card */}
        <div className="mx-4 p-4 bg-surface-container-lowest rounded-2xl border border-border/60 shadow-sm space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs">
            <span className="material-symbols-outlined text-[16px]">shield</span>
            <span>Safety Invariant</span>
          </div>
          <p className="text-xs text-secondary-text leading-relaxed">
            &quot;Little Rides. Big Peace of Mind.&quot;
          </p>
          <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-secondary-text">
            <span>Human In The Loop</span>
            <span className="text-primary font-bold">100% Audited</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area With Top Header */}
      <div className="pl-72 flex-1 flex flex-col min-w-0">
        {/* Stitch Frosted Glass Top Header */}
        <header className="fixed top-0 left-72 right-0 h-16 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-8 border-b border-border/60">
          {/* Search Bar */}
          <div className="flex items-center w-96 bg-surface-container-high px-4 py-2 rounded-xl border border-border/40 focus-within:border-primary/50 transition-all">
            <span className="material-symbols-outlined text-outline mr-2 text-[20px]">search</span>
            <input
              className="bg-transparent border-none outline-none w-full text-sm text-on-surface placeholder:text-outline"
              placeholder="Search drivers, trips, vehicles, parents..."
              type="text"
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {/* Hyderabad Pilot Chip */}
            <div className="hidden sm:flex items-center gap-1.5 bg-accent-surface text-sun-gold px-3 py-1.5 rounded-full text-xs font-bold border border-sun-gold/20">
              <span className="material-symbols-outlined text-[14px]">location_on</span>
              <span>Hyderabad Pilot</span>
            </div>

            {/* Supabase Status Chip */}
            <div className="hidden lg:flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>DB Online (118ms)</span>
            </div>

            {/* Role Switcher */}
            <div className="flex items-center gap-1.5 bg-surface-container-high px-3 py-1.5 rounded-xl border border-border/60 text-xs">
              <span className="material-symbols-outlined text-sun-gold text-[16px]">badge</span>
              <span className="text-secondary-text font-medium">Role:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as any)}
                className="bg-transparent text-primary-text font-bold outline-none cursor-pointer text-xs"
              >
                <option value="admin">Platform Admin</option>
                <option value="operator">Operations Officer</option>
                <option value="kyc_reviewer">KYC Reviewer</option>
                <option value="finance_admin">Finance Admin</option>
              </select>
            </div>

            {/* Notification Bell */}
            <button className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors text-on-surface-variant relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error"></span>
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-3 pl-2 border-l border-border/60">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-xs shadow-sm">
                TR
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-primary-text leading-tight">Admin User</p>
                <p className="text-[11px] text-secondary-text capitalize">{currentRole.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="relative pt-20 p-8 min-h-screen bg-surface">
          {children}
        </main>
      </div>
    </div>
  );
}
