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
  Compass,
  Bus,
  Check,
} from 'lucide-react';
import {
  getParentSession,
  clearParentSession,
  saveParentSession,
  DEFAULT_DEMO_CHILD,
  type ParentSession,
  type ParentChild,
} from '@/lib/parentAuth';

export default function ParentDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<ParentSession | null>(null);
  const [activeChild, setActiveChild] = useState<ParentChild>(DEFAULT_DEMO_CHILD);
  const [selectedTab, setSelectedTab] = useState<'home' | 'tracking' | 'timeline' | 'profile'>('home');
  const [isClient, setIsClient] = useState(false);

  // Modals
  const [showSafeKeyModal, setShowSafeKeyModal] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [absentSuccess, setAbsentSuccess] = useState(false);
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Live Vehicle Animation State
  const [vehicleProgress, setVehicleProgress] = useState(48); // % along the route
  const [liveSpeed, setLiveSpeed] = useState(26);
  const [currentEtaMinutes, setCurrentEtaMinutes] = useState(6);
  const [ridePhase, setRidePhase] = useState<'morning' | 'afternoon'>('morning');

  useEffect(() => {
    setIsClient(true);
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

    const active = curr.children?.find((c) => c.id === curr.activeChildId) || curr.children?.[0] || DEFAULT_DEMO_CHILD;
    setActiveChild(active);
  }, [router]);

  // Smooth telemetry simulation
  useEffect(() => {
    if (!isClient) return;
    const interval = setInterval(() => {
      setVehicleProgress((prev) => {
        if (prev >= 94) return 20;
        return prev + 1;
      });
      setLiveSpeed((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.min(38, Math.max(18, prev + change));
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isClient]);

  // Calculate dynamic ETA
  useEffect(() => {
    // 50% is roughly child's stop
    if (vehicleProgress < 50) {
      const remaining = Math.max(1, Math.round(((50 - vehicleProgress) / 50) * 12));
      setCurrentEtaMinutes(remaining);
    } else {
      const schoolRemaining = Math.max(1, Math.round(((95 - vehicleProgress) / 45) * 16));
      setCurrentEtaMinutes(schoolRemaining);
    }
  }, [vehicleProgress]);

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
    }, 2000);
  };

  if (!isClient || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-[#006B2F] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-600">Loading your child&apos;s ride...</span>
        </div>
      </div>
    );
  }

  const isBeforePickup = vehicleProgress < 50;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-8 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* ========================================================
          STICKY TOP APP HEADER
      ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Parent Identity */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <img
                src="/brand/logo-horizontal.png"
                alt="TinyRide — School transportation and live ride tracking"
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>

            <span className="h-5 w-px bg-slate-200 hidden sm:block" />

            {/* Child Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowChildPicker(!showChildPicker)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 transition-colors text-left cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#006B2F] text-white text-xs font-bold flex items-center justify-center">
                  {activeChild.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-900 leading-tight max-w-[120px] sm:max-w-none truncate">
                    {activeChild.name}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-none">{activeChild.grade}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {/* Child Switcher Dropdown */}
              {showChildPicker && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                    Select Student
                  </div>
                  {session.children.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSwitchChild(c.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        c.id === activeChild.id ? 'bg-emerald-50 text-[#006B2F]' : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold">{c.name}</div>
                          <div className="text-[11px] text-slate-500">{c.schoolName}</div>
                        </div>
                      </div>
                      {c.id === activeChild.id && <Check className="w-4 h-4 text-[#006B2F]" />}
                    </button>
                  ))}
                  <div className="pt-2 mt-2 border-t border-slate-100 px-1">
                    <Link
                      href="/parent/onboarding"
                      className="w-full text-center block py-1.5 text-xs font-semibold text-[#006B2F] hover:bg-emerald-50 rounded-lg transition-colors"
                      onClick={() => setShowChildPicker(false)}
                    >
                      + Add Another Child
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Header: SafeKey Button & User Profile Menu */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSafeKeyModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#006B2F] border border-emerald-200/80 text-xs font-semibold transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">SafeKey:</span>
              <span className="font-mono font-bold">{activeChild.safeKey}</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Log out of Parent Portal"
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          PAGE BODY: RESPONSIVE DASHBOARD
      ======================================================== */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-5 md:pt-7 flex-1">
        {/* Ride Phase Toggle (Morning Pickup vs Afternoon Drop) */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setRidePhase('morning')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                ridePhase === 'morning'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Morning Pickup
            </button>
            <button
              type="button"
              onClick={() => setRidePhase('afternoon')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                ridePhase === 'afternoon'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Afternoon Drop
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Live Telemetry Active</span>
            <span className="text-slate-300">•</span>
            <span>Refreshed just now</span>
          </div>
        </div>

        {/* PRIMARY STATUS BANNER */}
        <div className="mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950 via-[#004B21] to-[#006B2F] text-white shadow-xl shadow-emerald-950/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                {isBeforePickup ? 'En Route to Your Stop' : 'Boarded — On Way to School'}
              </span>
              <span className="text-xs text-emerald-100/70">
                Route 14A • {activeChild.vehicleNumber}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {isBeforePickup
                ? `Arriving at ${activeChild.pickupLocation.split(',')[0]} in ~${currentEtaMinutes} mins`
                : `${activeChild.name} is on board • School ETA: ~${currentEtaMinutes} mins`}
            </h1>
            <p className="text-xs text-emerald-100/80">
              {activeChild.schoolName} ({activeChild.schoolBranch})
            </p>
          </div>

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
              className="py-2.5 px-4 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 border border-emerald-700/60 text-xs font-semibold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <CalendarX className="w-4 h-4 text-emerald-300" />
              <span>Mark Absent</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            GRID LAYOUT: MAP + TELEMETRY (SPLIT / STACKED)
        ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: LIVE MAP & REAL-TIME TRACKING (7 Cols on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            {/* LIVE MAP CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden">
              {/* Map Title Bar */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#006B2F]" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Live GPS Telemetry
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-semibold text-slate-700">Speed: {liveSpeed} km/h</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-emerald-700 font-semibold">GPS Lock: 100%</span>
                </div>
              </div>

              {/* Interactive Vector Map Canvas */}
              <div className="relative h-72 sm:h-80 w-full bg-[#f4f7f4] overflow-hidden select-none">
                {/* Subtle map grid roads */}
                <svg className="absolute inset-0 w-full h-full stroke-slate-200/70" strokeWidth="6" fill="none">
                  <line x1="0" y1="80" x2="100%" y2="80" stroke="#e8ece8" strokeWidth="18" />
                  <line x1="0" y1="210" x2="100%" y2="210" stroke="#e8ece8" strokeWidth="16" />
                  <line x1="120" y1="0" x2="120" y2="100%" stroke="#e8ece8" strokeWidth="14" />
                  <line x1="380" y1="0" x2="380" y2="100%" stroke="#e8ece8" strokeWidth="14" />
                </svg>

                {/* Primary Route Path (S-curve) */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 320" fill="none" preserveAspectRatio="none">
                  {/* Route shadow */}
                  <path
                    d="M 40 250 C 160 250, 160 80, 290 80 C 420 80, 420 180, 560 180"
                    stroke="#cbd5e1"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Completed segment */}
                  <path
                    d="M 40 250 C 160 250, 160 80, 290 80 C 420 80, 420 180, 560 180"
                    stroke="#006B2F"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="600"
                    strokeDashoffset={`${600 - (vehicleProgress / 100) * 600}`}
                    className="transition-all duration-700 ease-out"
                  />

                  {/* Stop 1: Aparna */}
                  <circle cx="160" cy="165" r="7" fill="#006B2F" stroke="#ffffff" strokeWidth="3" />

                  {/* Stop 2: Child's Stop (Rainbow Vistas) */}
                  <circle cx="290" cy="80" r="10" fill="#2563eb" stroke="#ffffff" strokeWidth="3" />

                  {/* Stop 3: Oakridge School */}
                  <circle cx="560" cy="180" r="11" fill="#dc2626" stroke="#ffffff" strokeWidth="3" />
                </svg>

                {/* Markers Labels */}
                <div className="absolute left-[20%] top-[46%] -translate-x-1/2 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-700 shadow-xs border border-slate-200">
                  Aparna Sarovar (Passed)
                </div>

                <div className="absolute left-[48%] top-[14%] -translate-x-1/2 bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-md flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{activeChild.name}&apos;s Stop</span>
                </div>

                <div className="absolute right-[4%] top-[62%] -translate-y-1/2 bg-rose-600 text-white px-2 py-1 rounded-lg text-[11px] font-bold shadow-md flex items-center gap-1">
                  <Bus className="w-3 h-3" />
                  <span>Oakridge Campus</span>
                </div>

                {/* Moving Vehicle Avatar Pin */}
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
                    <div className="w-10 h-10 rounded-2xl bg-[#006B2F] border-2 border-white shadow-xl flex items-center justify-center text-white">
                      <Bus className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
                  </div>
                </div>

                {/* Map telemetry overlay badge */}
                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-md border border-slate-200/80 text-xs flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Compass className="w-4 h-4 text-[#006B2F]" />
                    <span className="font-bold">Heading: East</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="text-slate-600">
                    Next Stop: <strong className="text-slate-900">Rainbow Vistas</strong>
                  </div>
                </div>

                {/* Action Floating: Share live location */}
                <button
                  type="button"
                  onClick={handleShareTracking}
                  className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md hover:bg-white text-slate-700 px-3 py-2 rounded-2xl shadow-md border border-slate-200/80 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
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
                <div className="font-semibold text-slate-900">Vehicle: {activeChild.vehicleNumber}</div>
              </div>
            </div>

            {/* DRIVER & VEHICLE DETAILS CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Assigned Driver &amp; Escort
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-[#006B2F] font-bold text-lg flex items-center justify-center border border-emerald-300/60 shadow-xs">
                    RK
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{activeChild.driverName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#006B2F] text-[10px] font-semibold border border-emerald-100">
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
                    className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[#006B2F] hover:bg-[#005525] text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Driver</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: RIDE TIMELINE & QUICK ACTIONS (5 Cols on desktop) */}
          <div className="lg:col-span-5 space-y-6">
            {/* TODAY'S TIMELINE CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#006B2F]" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Today&apos;s Stop Progress
                  </span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#006B2F]">
                  Stop 3 of 4
                </span>
              </div>

              {/* Timeline Steps */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-xs flex items-center justify-center text-[9px] text-white font-bold">
                    ✓
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Trip Commenced</span>
                      <span className="text-[11px] text-slate-500 font-medium">07:15 AM</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Driver completed onboard safety pre-check
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
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

                {/* Step 3: Your Stop */}
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs animate-ping" />
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                  <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-950">
                        Your Stop: {activeChild.pickupLocation.split(',')[0]}
                      </span>
                      <span className="text-xs font-bold text-blue-700 bg-white px-2 py-0.5 rounded-full shadow-xs">
                        ~{currentEtaMinutes} mins
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-800 mt-1">
                      Scheduled: <strong>{activeChild.pickupTime}</strong>. Please bring your SafeKey: <strong className="font-mono">{activeChild.safeKey}</strong>.
                    </p>
                  </div>
                </div>

                {/* Step 4: School Arrival */}
                <div className="relative opacity-60">
                  <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-slate-300 border-2 border-white shadow-xs" />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">School Arrival</span>
                      <span className="text-[11px] text-slate-500">Est. 07:55 AM</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {activeChild.schoolName} main bus bay
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* STUDENT & SAFETY PROTOCOL SUMMARY */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#006B2F]" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Safety &amp; Health Note
                  </span>
                </div>
                <Link
                  href="/parent/onboarding"
                  className="text-xs font-semibold text-[#006B2F] hover:underline"
                >
                  Edit
                </Link>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-bold text-slate-900">{activeChild.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grade &amp; Section:</span>
                  <span className="font-bold text-slate-900">{activeChild.grade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Designated Stop:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">
                    {activeChild.pickupLocation}
                  </span>
                </div>
                {activeChild.medicalNotes && (
                  <div className="pt-2 border-t border-slate-200 text-slate-700">
                    <span className="font-semibold text-slate-900 block mb-0.5">Medical Note:</span>
                    {activeChild.medicalNotes}
                  </div>
                )}
              </div>
            </div>

            {/* QUICK ACTIONS ROW */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleShareTracking}
                className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Share2 className="w-4 h-4 text-emerald-700 mb-1.5" />
                <div className="text-xs font-bold text-slate-900">Share Telemetry</div>
                <div className="text-[10px] text-slate-500">Send live link to family</div>
              </button>

              <button
                type="button"
                onClick={() => setShowAbsentModal(true)}
                className="p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-left transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <CalendarX className="w-4 h-4 text-rose-600 mb-1.5" />
                <div className="text-xs font-bold text-slate-900">Mark Absence</div>
                <div className="text-[10px] text-slate-500">Notify bus coordinator</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================
          MOBILE BOTTOM APP BAR (App-like touch bar)
      ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => setSelectedTab('home')}
          className={`flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer ${
            selectedTab === 'home' ? 'text-[#006B2F] font-bold' : 'text-slate-500'
          }`}
        >
          <Navigation className="w-5 h-5" />
          <span className="text-[10px]">Today</span>
        </button>

        <button
          type="button"
          onClick={() => setShowSafeKeyModal(true)}
          className="flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer text-slate-500 hover:text-slate-900"
        >
          <div className="w-9 h-9 -mt-4 rounded-full bg-[#006B2F] text-white flex items-center justify-center shadow-md">
            <KeyRound className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-[#006B2F]">SafeKey</span>
        </button>

        <button
          type="button"
          onClick={() => setShowAbsentModal(true)}
          className={`flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer text-slate-500 hover:text-slate-900`}
        >
          <CalendarX className="w-5 h-5" />
          <span className="text-[10px]">Absent</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer text-slate-500 hover:text-slate-900"
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
                Show to driver {activeChild.driverName} or bus escort at vehicle door
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
              className="w-full py-3 rounded-xl bg-[#006B2F] hover:bg-[#005525] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
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
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAbsent}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
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
