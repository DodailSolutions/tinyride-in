'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Phone,
  ShieldCheck,
  MapPin,
  Clock,
  ChevronDown,
  Navigation,
  KeyRound,
  CalendarX,
  Share2,
  AlertTriangle,
  LogOut,
  Bus,
  Check,
  Bell,
  WifiOff,
} from 'lucide-react';
import {
  getParentSession,
  clearParentSession,
  saveParentSession,
  DEFAULT_DEMO_CHILD,
  type ParentSession,
  type ParentChild,
} from '@/lib/parentAuth';

type TripState =
  | 'Not Started'
  | 'Driver Started'
  | 'Approaching Pickup'
  | 'Arrived at Pickup'
  | 'Child Boarded'
  | 'En Route'
  | 'Arrived at School'
  | 'Delayed'
  | 'Cancelled'
  | 'Completed';

export default function ParentDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<ParentSession | null>(null);
  const [activeChild, setActiveChild] = useState<ParentChild>(DEFAULT_DEMO_CHILD);
  const [selectedNav, setSelectedNav] = useState<'home' | 'trips' | 'notifications' | 'children' | 'profile'>('home');
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Active Trip State
  const [tripState, setTripState] = useState<TripState>('Child Boarded');

  // Modals
  const [showSafeKeyModal, setShowSafeKeyModal] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [absentSuccess, setAbsentSuccess] = useState(false);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Live Vehicle Telemetry State
  const [vehicleProgress, setVehicleProgress] = useState(58); // % along the route
  const [liveSpeed, setLiveSpeed] = useState(28);
  const [currentEtaMinutes, setCurrentEtaMinutes] = useState(12);

  // Morning vs Return phase
  const [isReturnRide, setIsReturnRide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check connectivity
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const curr = getParentSession();

    if (!curr || !curr.token || curr.user?.role !== 'parent') {
      router.replace('/parent/login');
      return;
    }

    if (curr.user?.onboardingStatus === 'incomplete') {
      router.replace('/parent/onboarding');
      return;
    }

    setSession(curr);

    const active =
      curr.children?.find((c) => c.id === curr.activeChildId) ||
      curr.children?.[0] ||
      DEFAULT_DEMO_CHILD;
    setActiveChild(active);

    // Subtle loading skeleton delay
    const loadTimer = setTimeout(() => {
      setIsLoading(false);
    }, 350);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(loadTimer);
    };
  }, [router]);

  // Smooth telemetry movement when in live transit states
  useEffect(() => {
    if (!isOnline || isLoading) return;
    if (tripState !== 'Approaching Pickup' && tripState !== 'Child Boarded' && tripState !== 'En Route') {
      return;
    }

    const interval = setInterval(() => {
      setVehicleProgress((prev) => {
        if (prev >= 92) return 52;
        return prev + 1;
      });
      setLiveSpeed((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.min(38, Math.max(18, prev + change));
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isOnline, isLoading, tripState]);

  // Dynamic ETA calculation
  useEffect(() => {
    if (tripState === 'Approaching Pickup') {
      const remaining = Math.max(2, Math.round(((50 - vehicleProgress) / 50) * 10));
      setCurrentEtaMinutes(remaining);
    } else if (tripState === 'Child Boarded' || tripState === 'En Route') {
      const remaining = Math.max(1, Math.round(((94 - vehicleProgress) / 44) * 16));
      setCurrentEtaMinutes(remaining);
    } else if (tripState === 'Arrived at Pickup' || tripState === 'Arrived at School' || tripState === 'Completed') {
      setCurrentEtaMinutes(0);
    }
  }, [vehicleProgress, tripState]);

  const handleLogout = () => {
    clearParentSession();
    router.replace('/parents');
  };

  const handleSwitchChild = (childId: string) => {
    if (!session) return;
    const target = session.children.find((c) => c.id === childId);
    if (target) {
      setActiveChild(target);
      const updated = { ...session, activeChildId: childId };
      setSession(updated);
      saveParentSession(updated);
    }
    setShowChildPicker(false);
  };

  const handleShareTracking = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Track ${activeChild.name}'s TinyRide live: https://tinyride.in/parent/track?token=${activeChild.safeKey}`
      );
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  };

  const handleConfirmAbsent = () => {
    setAbsentSuccess(true);
    setTimeout(() => {
      setAbsentSuccess(false);
      setShowAbsentModal(false);
      setTripState('Cancelled');
    }, 1800);
  };

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] p-4 sm:p-6 md:p-8 flex flex-col justify-between max-w-6xl mx-auto">
        <div className="space-y-6 animate-pulse">
          {/* Header skeleton */}
          <div className="h-12 bg-slate-200/80 rounded-2xl w-full" />
          {/* Greeting skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-slate-200/70 rounded-md w-36" />
            <div className="h-8 bg-slate-200 rounded-xl w-64" />
          </div>
          {/* Dominant ride card skeleton */}
          <div className="h-64 bg-slate-200 rounded-3xl w-full" />
          {/* Two column skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-slate-200 rounded-3xl" />
            <div className="h-48 bg-slate-200 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 pb-24 md:pb-12 flex flex-col selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      {/* ========================================================
          1. OFFLINE WARNING BANNER (When connectivity drops)
      ======================================================== */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 sticky top-0 z-50 shadow-sm">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You&apos;re offline · Showing last known status from 08:02 AM</span>
        </div>
      )}

      {/* ========================================================
          2. STICKY TOP APP HEADER
      ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Official Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <img
                src="/brand/logo-horizontal.png"
                alt="TinyRide — School transportation and live ride tracking"
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 text-[11px] font-bold border border-emerald-200/80">
              Parent App
            </span>
          </div>

          {/* Right Header: SafeKey Button & Logout */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSafeKeyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#006B2F] border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SafeKey:</span>
              <span className="font-mono">{activeChild.safeKey}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          3. DASHBOARD MAIN CONTENT
      ======================================================== */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-5 md:pt-6 flex-1 space-y-6">
        {/* 1. GREETING & CHILD SELECTOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              {getGreeting()}, {session?.user?.name ? session.user.name.split(' ')[0] : 'Parent'}
            </span>
            <div className="relative inline-block mt-0.5">
              <button
                type="button"
                onClick={() => setShowChildPicker(!showChildPicker)}
                className="flex items-center gap-2 text-xl sm:text-2xl font-black text-slate-900 hover:text-[#006B2F] transition-colors cursor-pointer group"
              >
                <span>{activeChild.name}</span>
                {session && session.children.length > 1 && (
                  <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-[#006B2F] transition-transform" />
                )}
              </button>

              {/* Child Switcher Dropdown */}
              {showChildPicker && session && session.children.length > 1 && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                    Switch Student
                  </div>
                  {session.children.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSwitchChild(c.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        c.id === activeChild.id
                          ? 'bg-emerald-50 text-[#006B2F]'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.grade}</div>
                      </div>
                      {c.id === activeChild.id && <Check className="w-4 h-4 text-[#006B2F]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {activeChild.grade} • {activeChild.schoolName}
            </div>
          </div>

          {/* Quick Trip State Switcher (To test all 10 realistic states easily) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 hidden lg:inline">Trip State:</span>
            <select
              value={tripState}
              onChange={(e) => setTripState(e.target.value as TripState)}
              className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20 cursor-pointer"
            >
              <option value="Not Started">Not Started</option>
              <option value="Driver Started">Driver Started</option>
              <option value="Approaching Pickup">Approaching Pickup</option>
              <option value="Arrived at Pickup">Arrived at Pickup</option>
              <option value="Child Boarded">Child Boarded</option>
              <option value="En Route">En Route</option>
              <option value="Arrived at School">Arrived at School</option>
              <option value="Completed">Completed</option>
              <option value="Delayed">Delayed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* ========================================================
            2. DOMINANT COMPONENT: TODAY'S RIDE STATUS BANNER
        ======================================================== */}
        <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-emerald-950 via-[#004B21] to-[#006B2F] text-white shadow-xl shadow-emerald-950/15">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                  TODAY&apos;S RIDE • {isReturnRide ? 'AFTERNOON RETURN' : 'MORNING COMMUTE'}
                </span>
                <span className="text-emerald-100/60">•</span>
                <span className="text-xs text-emerald-100 font-medium">Route 14A Express</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {tripState === 'Not Started' && 'Scheduled for 07:35 AM'}
                  {tripState === 'Driver Started' && 'Driver Started Route'}
                  {tripState === 'Approaching Pickup' && `Arriving in ~${currentEtaMinutes} mins`}
                  {tripState === 'Arrived at Pickup' && 'Vehicle At Your Stop'}
                  {tripState === 'Child Boarded' && 'Boarded · En route to school'}
                  {tripState === 'En Route' && 'En route to school'}
                  {tripState === 'Arrived at School' && 'Safely Reached Campus'}
                  {tripState === 'Completed' && 'Trip Completed Successfully'}
                  {tripState === 'Delayed' && 'Delayed by 8 mins (Traffic)'}
                  {tripState === 'Cancelled' && 'Marked Absent Today'}
                </h1>

                {/* Status Indicator Pill */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                    tripState === 'Cancelled'
                      ? 'bg-rose-500/20 text-rose-200 border-rose-400/30'
                      : tripState === 'Delayed'
                      ? 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                      : 'bg-emerald-500/25 text-emerald-200 border-emerald-400/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>● {tripState.toUpperCase()}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100/80 pt-1">
                <span>
                  ETA <strong>08:04 AM</strong>
                </span>
                <span>•</span>
                <span>
                  <strong>{currentEtaMinutes} min</strong> remaining
                </span>
                <span>•</span>
                <span>4.2 km to campus</span>
                <span>•</span>
                <span>Speed: {liveSpeed} km/h</span>
              </div>
            </div>

            {/* Quick Actions in Banner */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowSafeKeyModal(true)}
                className="py-2.5 px-4 rounded-xl bg-white text-[#006B2F] hover:bg-emerald-50 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <KeyRound className="w-4 h-4" />
                <span>Show SafeKey</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAbsentModal(true)}
                className="py-2.5 px-4 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 border border-emerald-700/60 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <CalendarX className="w-4 h-4 text-emerald-300" />
                <span>Mark Absent</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================
            3. RESPONSIVE GRID: LIVE MAP + TELEMETRY + TIMELINE
        ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ====================================================
              LEFT COLUMN: LARGE PROMINENT LIVE MAP & DRIVER CARD
          ==================================================== */}
          <div className="lg:col-span-7 space-y-6">
            {/* PROMINENT LIVE MAP */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
              {/* Map Header Strip */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#006B2F]" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Live GPS Telemetry
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-700">Speed: {liveSpeed} km/h</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    GPS 100%
                  </span>
                </div>
              </div>

              {/* Vector Map Canvas */}
              <div className="relative h-80 sm:h-96 w-full bg-[#f4f7f4] overflow-hidden select-none">
                {/* Subtle map road grid */}
                <svg className="absolute inset-0 w-full h-full stroke-slate-200/70" strokeWidth="6" fill="none">
                  <line x1="0" y1="80" x2="100%" y2="80" stroke="#e8ece8" strokeWidth="18" />
                  <line x1="0" y1="240" x2="100%" y2="240" stroke="#e8ece8" strokeWidth="16" />
                  <line x1="140" y1="0" x2="140" y2="100%" stroke="#e8ece8" strokeWidth="14" />
                  <line x1="420" y1="0" x2="420" y2="100%" stroke="#e8ece8" strokeWidth="14" />
                </svg>

                {/* S-curve route path */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 320" fill="none" preserveAspectRatio="none">
                  {/* Remaining route corridor */}
                  <path
                    d="M 40 250 C 160 250, 160 80, 290 80 C 420 80, 420 180, 560 180"
                    stroke="#cbd5e1"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Completed route segment */}
                  <path
                    d="M 40 250 C 160 250, 160 80, 290 80 C 420 80, 420 180, 560 180"
                    stroke="#006B2F"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="600"
                    strokeDashoffset={`${600 - (vehicleProgress / 100) * 600}`}
                    className="transition-all duration-700 ease-out"
                  />

                  {/* Prior Stop 1 */}
                  <circle cx="160" cy="165" r="7" fill="#006B2F" stroke="#ffffff" strokeWidth="3" />

                  {/* Child's Designated Pickup Point */}
                  <circle cx="290" cy="80" r="10" fill="#2563eb" stroke="#ffffff" strokeWidth="3" />

                  {/* School Campus Gate */}
                  <circle cx="560" cy="180" r="11" fill="#dc2626" stroke="#ffffff" strokeWidth="3" />
                </svg>

                {/* Stop Markers Labels */}
                <div className="absolute left-[22%] top-[48%] -translate-x-1/2 bg-white/90 px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-700 shadow-xs border border-slate-200">
                  Stop 1: Aparna (Passed)
                </div>

                <div className="absolute left-[48%] top-[14%] -translate-x-1/2 bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{activeChild.name}&apos;s Stop</span>
                </div>

                <div className="absolute right-[4%] top-[62%] -translate-y-1/2 bg-rose-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md flex items-center gap-1">
                  <Bus className="w-3 h-3" />
                  <span>Olive Mount Campus</span>
                </div>

                {/* Moving Vehicle Avatar Pin with Calm Pulsing Ring */}
                <div
                  className="absolute transition-all duration-700 ease-out -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                  style={{
                    left: `${Math.min(92, Math.max(8, vehicleProgress))}%`,
                    top: `${
                      vehicleProgress < 30
                        ? 78 - vehicleProgress * 1.5
                        : vehicleProgress < 65
                        ? 25 + (vehicleProgress - 30) * 0.8
                        : 55 + (vehicleProgress - 65) * 0.1
                    }%`,
                  }}
                >
                  <div className="relative">
                    <span className="absolute -inset-2 rounded-2xl bg-emerald-400/40 animate-ping" />
                    <div className="w-10 h-10 rounded-2xl bg-[#006B2F] border-2 border-white shadow-xl flex items-center justify-center text-white">
                      <Bus className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Floating Map Status Overlay */}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-sm border border-slate-200/80 text-xs flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold">● LIVE · Updated just now</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="text-slate-600 font-medium">
                    Heading: <strong className="text-slate-900">East to Olive Mount</strong>
                  </div>
                </div>

                {/* Floating Share Link */}
                <button
                  type="button"
                  onClick={handleShareTracking}
                  className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 px-3.5 py-2 rounded-2xl shadow-sm border border-slate-200/80 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{copyFeedback ? 'Link Copied!' : 'Share Live Route'}</span>
                </button>
              </div>

              {/* Map Footer Info */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Encrypted school satellite positioning via TinyRide GPS Gateway</span>
                </div>
                <div className="font-bold text-slate-900">Vehicle: {activeChild.vehicleNumber}</div>
              </div>
            </div>

            {/* DRIVER & VEHICLE DETAILS CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Assigned Driver &amp; Escort
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-[#006B2F] font-black text-lg flex items-center justify-center border border-emerald-300/60 shadow-xs">
                    RK
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{activeChild.driverName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#006B2F] text-[10px] font-bold border border-emerald-100">
                        Police Verified
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {activeChild.vehicleModel} • {activeChild.vehicleNumber}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Escort: Sunita Devi (Certified Female Attendant)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${activeChild.driverPhone}`}
                    className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[#006B2F] hover:bg-[#005525] text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Driver</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================
              RIGHT COLUMN: JOURNEY TIMELINE & RECENT UPDATES
          ==================================================== */}
          <div className="lg:col-span-5 space-y-6">
            {/* JOURNEY TIMELINE CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#006B2F]" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Journey Timeline
                  </span>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#006B2F] border border-emerald-100">
                  Stop 3 of 4
                </span>
              </div>

              {/* Progress Milestones */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Step 1: Trip Started */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-xs flex items-center justify-center text-[9px] text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Trip Started</span>
                      <span className="text-[11px] text-slate-500 font-medium">07:15 AM</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Driver completed onboard safety pre-check
                    </p>
                  </div>
                </div>

                {/* Step 2: Stop 1 */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-xs flex items-center justify-center text-[9px] text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Stop 1: Aparna Sarovar</span>
                      <span className="text-[11px] text-slate-500 font-medium">07:24 AM</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      2 students boarded with SafeKey
                    </p>
                  </div>
                </div>

                {/* Step 3: Your Stop (Active) */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs animate-ping" />
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-950">
                        {activeChild.name} Boarded
                      </span>
                      <span className="text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full shadow-xs">
                        07:36 AM
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800 mt-1 leading-normal">
                      Verified with SafeKey <strong className="font-mono">{activeChild.safeKey}</strong> at Gate 2.
                    </p>
                  </div>
                </div>

                {/* Step 4: School Arrival (Upcoming) */}
                <div className="relative opacity-65">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-slate-300 border-2 border-white shadow-xs" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">School Campus Arrival</span>
                      <span className="text-[11px] text-slate-500">Est. 08:04 AM</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {activeChild.schoolName} main drop bay
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RECENT NOTIFICATIONS CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#006B2F]" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Recent Updates
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNav('notifications')}
                  className="text-[11px] font-bold text-[#006B2F] hover:underline cursor-pointer"
                >
                  View all &rarr;
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">{activeChild.name} safely boarded</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">SafeKey verified at Rainbow Vistas Gate 2</div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">2 min ago</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">Vehicle approaching pickup stop</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">10-minute automated arrival warning</div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold shrink-0">8 min ago</span>
                </div>
              </div>
            </div>

            {/* AFTER SCHOOL / RETURN RIDE STATE CARD */}
            <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Afternoon Return Ride
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  Scheduled
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                School dismissal pickup scheduled for <strong className="font-bold">03:30 PM</strong> from {activeChild.schoolName}.
              </p>
              <button
                type="button"
                onClick={() => setIsReturnRide(!isReturnRide)}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-emerald-100/60 border border-emerald-300/80 text-[#006B2F] text-xs font-bold transition-all shadow-2xs cursor-pointer min-h-[44px]"
              >
                {isReturnRide ? 'View Morning Commute' : 'View Afternoon Return Ride'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================
          4. MOBILE / TABLET APP-LIKE BOTTOM NAVIGATION
      ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => setSelectedNav('home')}
          className={`flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer min-h-[44px] justify-center ${
            selectedNav === 'home' ? 'text-[#006B2F] font-bold' : 'text-slate-500'
          }`}
        >
          <Navigation className="w-5 h-5" />
          <span className="text-[10px]">Today</span>
        </button>

        <button
          type="button"
          onClick={() => setShowSafeKeyModal(true)}
          className="flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer text-slate-500 hover:text-slate-900 min-h-[44px] justify-center"
        >
          <div className="w-9 h-9 -mt-4 rounded-full bg-[#006B2F] text-white flex items-center justify-center shadow-md">
            <KeyRound className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-[#006B2F]">SafeKey</span>
        </button>

        <button
          type="button"
          onClick={() => setShowAbsentModal(true)}
          className="flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer text-slate-500 hover:text-slate-900 min-h-[44px] justify-center"
        >
          <CalendarX className="w-5 h-5" />
          <span className="text-[10px]">Absent</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer text-slate-500 hover:text-slate-900 min-h-[44px] justify-center"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px]">Logout</span>
        </button>
      </nav>

      {/* ========================================================
          MODAL 1: SAFEKEY BOARDING TOKEN
      ======================================================== */}
      {showSafeKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#006B2F]" />
                <h3 className="font-bold text-slate-900 text-base">Boarding SafeKey</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSafeKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white text-center space-y-3">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                Today&apos;s Boarding PIN
              </span>
              <div className="text-4xl font-mono font-bold tracking-widest text-emerald-300">
                {activeChild.safeKey}
              </div>
              <div className="text-xs text-slate-300">
                Show to driver {activeChild.driverName} or attendant at vehicle door
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Student:</span>
                <strong className="text-slate-900">{activeChild.name}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Vehicle:</span>
                <strong className="text-slate-900">{activeChild.vehicleNumber}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>School:</span>
                <strong className="text-slate-900 truncate max-w-[180px]">{activeChild.schoolName}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSafeKeyModal(false)}
              className="w-full py-3 rounded-xl bg-[#006B2F] hover:bg-[#005525] text-white text-xs font-bold transition-all shadow-sm cursor-pointer min-h-[44px]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: REPORT ABSENT TODAY
      ======================================================== */}
      {showAbsentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarX className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">Mark Absent Today</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAbsentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {absentSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-900">Absence Confirmed</div>
                <p className="text-xs text-slate-600">
                  Driver {activeChild.driverName} and {activeChild.schoolName} have been notified. The bus will skip your stop today.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure {activeChild.name} will not take the school ride today? This automatically notifies driver{' '}
                  <strong className="text-slate-900">{activeChild.driverName}</strong> so other students are not delayed.
                </p>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Pickup at <strong>{activeChild.pickupLocation.split(',')[0]}</strong> will be skipped for today.
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAbsentModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAbsent}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer min-h-[44px]"
                  >
                    Confirm Absence
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
