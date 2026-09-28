'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Route,
  Users,
  Truck,
  GraduationCap,
  CalendarCheck,
  Bell,
  LayoutDashboard,
  LogOut,
  Building2,
  Menu,
  X,
} from 'lucide-react';
import { getSchoolProfile, clearSchoolProfile } from '@/lib/schoolAuth';

interface SchoolLayoutProps {
  children: React.ReactNode;
}

export default function SchoolDashboardLayout({ children }: SchoolLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    // Check if on login, signup or onboarding pages
    if (
      pathname?.startsWith('/school/login') ||
      pathname?.startsWith('/school/signup') ||
      pathname?.startsWith('/school/onboarding')
    ) {
      return;
    }

    const currentProfile = getSchoolProfile();
    setProfile(currentProfile);

    // If no profile or not verified, check session
    if (!currentProfile) {
      fetch('/api/school/session')
        .then((res) => {
          if (!res.ok) throw new Error('Unauthenticated');
          return res.json();
        })
        .then((data) => {
          if (data.authenticated && data.school) {
            setProfile({
              schoolName: data.school.name,
              adminName: data.user?.name,
              staffRole: data.user?.staffRole,
              verificationStatus: data.school.verificationStatus,
            });
            if (data.school.verificationStatus !== 'verified') {
              router.push(`/school/onboarding?status=${data.school.verificationStatus}`);
            }
          } else {
            router.push('/school/login');
          }
        })
        .catch(() => {
          router.push('/school/login');
        });
    } else if (currentProfile.verificationStatus !== 'verified') {
      router.push(`/school/onboarding?status=${currentProfile.verificationStatus}`);
    }
  }, [pathname, router]);

  // Auth/Onboarding bypass
  if (
    pathname?.startsWith('/school/login') ||
    pathname?.startsWith('/school/signup') ||
    pathname?.startsWith('/school/onboarding')
  ) {
    return <>{children}</>;
  }

  const navItems = [
    { label: 'Overview', href: '/school', icon: LayoutDashboard },
    { label: 'Live Fleet', href: '/school/fleet', icon: Activity },
    { label: 'Routes', href: '/school/routes', icon: Route },
    { label: 'Drivers', href: '/school/drivers', icon: Users },
    { label: 'Vehicles', href: '/school/vehicles', icon: Truck },
    { label: 'Students', href: '/school/students', icon: GraduationCap },
    { label: 'Trips', href: '/school/trips', icon: CalendarCheck },
    { label: 'Notifications', href: '/school/notifications', icon: Bell },
  ];

  const handleSignOut = () => {
    clearSchoolProfile();
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      window.location.href = '/school/login';
    });
  };

  return (
    <div className="min-h-screen flex bg-[#FAFAF9] font-sans text-slate-900 selection:bg-[#006B2F] selection:text-white">
      {/* 1. DESKTOP SIDEBAR (Distinct School Shell, NOT AdminShell) */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white z-40 flex-col border-r border-slate-200/80">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <Link href="/school" className="flex items-center gap-2">
            <img
              src="/brand/logo-horizontal.png"
              alt="TinyRide"
              className="h-7 w-auto object-contain"
            />
          </Link>
          <span className="text-[10px] bg-emerald-50 text-[#006B2F] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
            School
          </span>
        </div>

        {/* School Identity Card */}
        <div className="mx-3.5 my-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#006B2F] flex items-center justify-center shrink-0 font-black text-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">
              {profile?.schoolName || 'Partner School'}
            </p>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              Verified Campus
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#006B2F] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile & Sign Out */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
          {/* Mobile hamburger + Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <img src="/brand/logo-horizontal.png" alt="TinyRide" className="h-6 w-auto object-contain" />
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900">
              {profile?.schoolName || 'School Transportation Operations'}
            </h2>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Live Console</span>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-slate-900">{profile?.adminName || 'Coordinator'}</p>
              <p className="text-[10px] text-slate-500 capitalize">{profile?.staffRole || 'Transport Admin'}</p>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
            <div className="w-64 bg-white h-full flex flex-col p-4 shadow-2xl animate-in slide-in-from-left">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <img src="/brand/logo-horizontal.png" alt="TinyRide" className="h-7 w-auto object-contain" />
                <button onClick={() => setMobileNavOpen(false)} className="p-1 text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#006B2F] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 p-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileNavOpen(false)} />
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
