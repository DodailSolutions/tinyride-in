'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  X,
  Users,
  MapPin,
  CheckCircle2,
  Bell,
  Activity,
  Layers,
  Building2,
  Route,
  ShieldCheck,
} from 'lucide-react';

// Prefers-reduced-motion hook for accessibility
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(media.matches);
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);
  return reduced;
}

// Fade reveal wrapper
function FadeReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setIsVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-600 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Strictly isolated demo marketing data (separate from production school data)
const DEMO_SCHOOL_DATA = {
  activeRoutes: 12,
  vehiclesOnRoute: 8,
  studentsTransported: 126,
  delayedCount: 2,
  completedTrips: 4,
  routesList: [
    {
      code: 'Route 04',
      school: 'Olive Mount Campus',
      driver: 'Ravi Kumar',
      vehicle: 'Auto Rickshaw (TS09-TR-102)',
      speed: '24 km/h',
      status: 'Live',
      currentStop: 'Rainbow Vistas Gate 2',
      boarded: '4/4',
    },
    {
      code: 'Route 08',
      school: 'Olive Mount Campus',
      driver: 'Srinivas R.',
      vehicle: 'Minibus (TS07-EX-4921)',
      speed: '31 km/h',
      status: 'Live',
      currentStop: 'Madhapur Circle',
      boarded: '12/14',
    },
    {
      code: 'Route 02',
      school: 'Olive Mount Campus',
      driver: 'M. Anand',
      vehicle: 'Van (TS09-UB-8812)',
      speed: '0 km/h (At Stop)',
      status: 'Boarding',
      currentStop: 'Cyber Towers Bus Bay',
      boarded: '6/8',
    },
  ],
};

export default function SchoolsLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 font-sans antialiased selection:bg-[#006B2F] selection:text-white flex flex-col">
      {/* ==================================================
          1. PUBLIC SCHOOL HEADER (No Admin Shell)
          ================================================== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between">
          {/* LEFT: TinyRide Logo + FOR SCHOOLS badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/brand/logo-horizontal.png"
                alt="TinyRide — School Transportation, Simplified"
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 text-[#006B2F] border border-emerald-200/80">
              For Schools
            </span>
          </div>

          {/* CENTER: Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-bold text-slate-600">
            <a href="#how-it-works" className="hover:text-[#006B2F] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#006B2F] transition-colors">Features</a>
            <a href="#fleet" className="hover:text-[#006B2F] transition-colors">Fleet</a>
            <a href="#safety" className="hover:text-[#006B2F] transition-colors">Safety</a>
            <a href="#faq" className="hover:text-[#006B2F] transition-colors">FAQ</a>
          </nav>

          {/* RIGHT: School Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/school/login"
              className="text-[13px] font-bold px-4 py-2 text-slate-700 hover:text-slate-900 rounded-xl transition-colors min-h-[44px] flex items-center"
            >
              School Login
            </Link>
            <Link
              href="/school/signup"
              className="text-[13px] font-bold px-4 py-2.5 bg-[#006B2F] hover:bg-[#005525] active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 min-h-[44px]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 sm:hidden">
            <span className="inline-flex sm:hidden text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-[#006B2F] border border-emerald-200">
              Schools
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-5 py-5 flex flex-col gap-3 text-sm font-semibold shadow-lg animate-in slide-in-from-top-2">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700 hover:text-[#006B2F]">How It Works</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700 hover:text-[#006B2F]">Features</a>
            <a href="#fleet" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700 hover:text-[#006B2F]">Fleet Monitoring</a>
            <a href="#safety" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700 hover:text-[#006B2F]">Safety Architecture</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700 hover:text-[#006B2F]">FAQ</a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                href="/school/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors min-h-[44px] flex items-center justify-center"
              >
                School Login
              </Link>
              <Link
                href="/school/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl bg-[#006B2F] hover:bg-[#005525] text-white text-xs font-bold shadow-xs transition-colors min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <span>Get Started for Your School</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ==================================================
          2. SCHOOL HERO SECTION
          ================================================== */}
      <section className="pt-10 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 text-[#006B2F] border border-emerald-200/80 shadow-xs">
              <Building2 className="w-3.5 h-3.5 text-[#006B2F]" />
              School Transport Management Platform
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[62px] font-extrabold text-slate-900 tracking-tight leading-[1.08]">
            School transportation,<br />
            <span className="text-[#006B2F]">finally under control.</span>
          </h1>

          <p className="mt-5 text-[17px] sm:text-[18px] text-slate-600 max-w-[640px] mx-auto leading-[1.55] font-normal">
            Manage routes, vehicles, drivers, student boarding and parent updates from one connected school transportation platform.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 justify-center">
            <Link
              href="/school/signup"
              className="w-full sm:w-auto px-7 py-4 bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all min-h-[48px]"
            >
              <span>Get Started for Your School</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/school/login"
              className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-bold text-sm sm:text-base rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-center transition-all min-h-[48px]"
            >
              School Login
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Live fleet tracking
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" /> SafeKey boarding confirmation
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Multi-tenant school isolation
            </span>
          </div>
        </div>

        {/* HERO PRODUCT VISUAL: Desktop / Tablet School Operations Dashboard Preview */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-slate-950/30 text-white select-none">
            {/* Dashboard Browser Chrome */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                </div>
                <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 hidden sm:block">
                  school.tinyride.in • Olive Mount Campus
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Live Operations
                </span>
              </div>
            </div>

            {/* Metrics Row: 5 Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Routes</span>
                <p className="text-xl sm:text-2xl font-black text-white mt-1">{DEMO_SCHOOL_DATA.activeRoutes}</p>
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicles On Route</span>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{DEMO_SCHOOL_DATA.vehiclesOnRoute}</p>
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Students Transported</span>
                <p className="text-xl sm:text-2xl font-black text-white mt-1">{DEMO_SCHOOL_DATA.studentsTransported}</p>
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delayed Routes</span>
                <p className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{DEMO_SCHOOL_DATA.delayedCount}</p>
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
                <p className="text-xl sm:text-2xl font-black text-slate-300 mt-1">{DEMO_SCHOOL_DATA.completedTrips}</p>
              </div>
            </div>

            {/* Active Routes Table Preview */}
            <div className="bg-slate-950/60 rounded-2xl border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Active School Routes Monitor</span>
                <span className="text-[10px] text-slate-500 font-mono">Synced Real-Time</span>
              </div>
              <div className="divide-y divide-slate-800/60">
                {DEMO_SCHOOL_DATA.routesList.map((route) => (
                  <div key={route.code} className="p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 hover:bg-slate-900/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/40 flex items-center justify-center font-bold text-xs shrink-0">
                        {route.code.slice(-2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{route.code}</span>
                          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/40">
                            {route.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {route.driver} • {route.vehicle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 text-xs">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-500 block uppercase">Current Stop</span>
                        <span className="font-semibold text-slate-200">{route.currentStop}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase">Onboard</span>
                        <span className="font-mono font-bold text-emerald-400">{route.boarded}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[9px] text-slate-500 text-center tracking-tight mt-3">
              Sample school transportation operations preview • Isolated demo data
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          3. SCHOOL VALUE PROPOSITION (Section 8)
          ================================================== */}
      <section id="features" className="py-16 sm:py-24 bg-white border-y border-slate-200/80 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeReveal>
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="text-xs font-bold text-[#006B2F] uppercase tracking-widest block mb-2">
                Platform Capabilities
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Everything your transport team needs in one place.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
                Connect vehicles, drivers, route schedules, and parent communication into a cohesive operational workflow.
              </p>
            </div>
          </FadeReveal>

          {/* 6 Value Prop Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FadeReveal delay={40}>
              <div className="bg-[#FAFAF9] border border-slate-200/80 rounded-3xl p-6 hover:border-[#006B2F]/40 transition-colors h-full flex flex-col gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006B2F]">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Live Fleet Monitoring</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  See active school vehicles and current route status across all morning and afternoon runs in real time.
                </p>
              </div>
            </FadeReveal>

            <FadeReveal delay={80}>
              <div className="bg-[#FAFAF9] border border-slate-200/80 rounded-3xl p-6 hover:border-[#006B2F]/40 transition-colors h-full flex flex-col gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006B2F]">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Driver Management</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Manage assigned drivers and their transportation responsibilities with verified commercial license checks.
                </p>
              </div>
            </FadeReveal>

            <FadeReveal delay={120}>
              <div className="bg-[#FAFAF9] border border-slate-200/80 rounded-3xl p-6 hover:border-[#006B2F]/40 transition-colors h-full flex flex-col gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006B2F]">
                  <Route className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Route Management</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Create and manage school routes, scheduled arrival times, and pickup stops tailored to your student body.
                </p>
              </div>
            </FadeReveal>

            <FadeReveal delay={160}>
              <div className="bg-[#FAFAF9] border border-slate-200/80 rounded-3xl p-6 hover:border-[#006B2F]/40 transition-colors h-full flex flex-col gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006B2F]">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Student Transportation</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Connect students with assigned routes and vehicles, maintaining clear enrollment rosters for each run.
                </p>
              </div>
            </FadeReveal>

            <FadeReveal delay={200}>
              <div className="bg-[#FAFAF9] border border-slate-200/80 rounded-3xl p-6 hover:border-[#006B2F]/40 transition-colors h-full flex flex-col gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006B2F]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Boarding Visibility</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Know exactly when students board and arrive via cryptographic SafeKey tokens logged directly at vehicle doors.
                </p>
              </div>
            </FadeReveal>

            <FadeReveal delay={240}>
              <div className="bg-[#FAFAF9] border border-slate-200/80 rounded-3xl p-6 hover:border-[#006B2F]/40 transition-colors h-full flex flex-col gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006B2F]">
                  <Bell className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Parent Communication</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Keep parents informed about active rides and important updates automatically, dramatically reducing inbound calls.
                </p>
              </div>
            </FadeReveal>
          </div>
        </div>
      </section>

      {/* ==================================================
          4. SCHOOL OPERATIONS FLOW (Section 9)
          8 Connected Steps: 01 to 08
          ================================================== */}
      <section id="how-it-works" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <FadeReveal>
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold text-[#006B2F] uppercase tracking-widest block mb-2">
              Operational Roadmap
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              From onboarding to daily dispatch in 8 clear steps.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              A structured operational workflow that sets up routes, links drivers, and enables real-time monitoring.
            </p>
          </div>
        </FadeReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Create School Account', desc: 'Register your school and designated transport administrator.' },
            { step: '02', title: 'Add Transport Routes', desc: 'Define morning pickup and afternoon drop corridor stops.' },
            { step: '03', title: 'Add Vehicles', desc: 'Record auto-rickshaws, vans, and buses with capacity ratings.' },
            { step: '04', title: 'Add Drivers', desc: 'Invite and verify commercial driver credentials.' },
            { step: '05', title: 'Assign Students', desc: 'Map enrolled children to their designated stops and routes.' },
            { step: '06', title: 'Start Daily Operations', desc: 'Drivers activate routes with one tap from their mobile app.' },
            { step: '07', title: 'Monitor Live Routes', desc: 'Watch real-time telemetry, delays, and boarding events.' },
            { step: '08', title: 'Review Completed Trips', desc: 'Audit daily transit times, attendance records, and logs.' },
          ].map((item, idx) => (
            <FadeReveal key={item.step} delay={idx * 50}>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between h-full hover:border-[#006B2F]/40 transition-colors">
                <div>
                  <span className="text-xs font-mono font-extrabold text-[#006B2F] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 inline-block mb-3">
                    {item.step}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </FadeReveal>
          ))}
        </div>
      </section>

      {/* ==================================================
          5. LIVE FLEET SECTION (Section 10)
          ================================================== */}
      <section id="fleet" className="py-16 sm:py-24 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 flex flex-col gap-4">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
                Real-Time Telemetry
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                See every active school ride at a glance.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                No more guessing where transport vehicles are. TinyRide feeds live GPS coordinates directly from drivers’ mobile devices to your operations console.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-800/40">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Zero Extra Hardware Required</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Operates smoothly over driver mobile browsers without expensive OBD trackers.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-800/40">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Automatic Delay Detection</h4>
                    <p className="text-xs text-slate-400 mt-0.5">System identifies slow or congested routes and computes updated ETAs for parents.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-800/40">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Gate Arrival Coordination</h4>
                    <p className="text-xs text-slate-400 mt-0.5">School staff know in advance when batches of auto-rickshaws and vans are arriving.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Fleet Map Preview Mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Live Route Map View</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    3 Active Trips
                  </span>
                </div>

                {/* Stylized Operations Map Card */}
                <div className="h-64 sm:h-72 bg-slate-950 rounded-2xl border border-slate-800 p-4 relative overflow-hidden flex flex-col justify-between">
                  {/* Faux Route Overlay Lines */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none">
                    <div className="w-full h-full border-b border-r border-slate-700/40" style={{ backgroundImage: 'radial-gradient(#006B2F 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                  </div>

                  {/* Vehicle Marker 1 */}
                  <div className="relative z-10 flex items-center gap-2 bg-slate-900/90 border border-emerald-500/50 p-2 rounded-xl w-fit shadow-md">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <div>
                      <p className="text-[11px] font-bold text-white">Route 04 (Auto Rickshaw)</p>
                      <p className="text-[9px] text-slate-400">Ravi Kumar • 24 km/h</p>
                    </div>
                  </div>

                  {/* Vehicle Marker 2 */}
                  <div className="relative z-10 flex items-center gap-2 bg-slate-900/90 border border-slate-700 p-2 rounded-xl w-fit self-end shadow-md">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div>
                      <p className="text-[11px] font-bold text-white">Route 02 (Van)</p>
                      <p className="text-[9px] text-slate-400">At Stop: Cyber Towers</p>
                    </div>
                  </div>

                  {/* Destination Landmark */}
                  <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <MapPin className="w-3 h-3" /> School Destination: Olive Mount
                    </span>
                    <span>All routes on schedule</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          6. CONNECTED SYSTEM DIAGRAM (Section 17)
          Driver -> School -> Parent
          ================================================== */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <FadeReveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-[#006B2F] uppercase tracking-widest block mb-2">
                Connected Feedback Loop
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                One unified transit network.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
                When an action happens on the road, everyone stays synchronized automatically.
              </p>
            </div>
          </FadeReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="bg-[#FAFAF9] border border-slate-200/80 rounded-2xl p-6 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center font-black text-sm mb-3">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900">Driver</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Starts trip, navigates stops, and logs student boarding via SafeKey on mobile.
              </p>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-6 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-[#006B2F] text-white flex items-center justify-center font-black text-sm mb-3">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900">School Operations</h3>
              <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                Monitors active fleet, verifies manifests, and coordinates campus arrivals in real time.
              </p>
            </div>

            <div className="bg-[#FAFAF9] border border-slate-200/80 rounded-2xl p-6 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#006B2F] flex items-center justify-center font-black text-sm mb-3">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900">Parents</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Receive live GPS tracking, boarding confirmations, and arrival notifications on phone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          7. SCHOOL SAFETY SECTION (Section 32)
          Visibility & Accountability
          ================================================== */}
      <section id="safety" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <FadeReveal>
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold text-[#006B2F] uppercase tracking-widest block mb-2">
              Safety &amp; Compliance
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built around visibility and accountability.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              Clear digital verification at every step of student transit eliminates guesswork.
            </p>
          </div>
        </FadeReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-[#006B2F]">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="text-base font-bold text-slate-900">Driver Assignment</h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Every route has an authorized driver with valid commercial driving credentials recorded in the system.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-[#006B2F]">
              <CheckCircle2 className="w-5 h-5" />
              <h4 className="text-base font-bold text-slate-900">Boarding Handshake</h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              SafeKey verification tokens confirm student boarding at designated pickup points with zero impersonation.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-[#006B2F]">
              <Compass className="w-5 h-5" />
              <h4 className="text-base font-bold text-slate-900">Route Corridor Visibility</h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Trips operate along pre-mapped school route corridors with automated logging of arrival times.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================
          8. FAQ SECTION (Section 35)
          7 Exact Questions Answered Factually
          ================================================== */}
      <section id="faq" className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeReveal>
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-[#006B2F] uppercase tracking-widest block mb-2">
                Frequently Asked Questions
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Questions school administrators ask about TinyRide.
              </h2>
            </div>
          </FadeReveal>

          <div className="flex flex-col gap-3">
            {[
              {
                q: 'What is TinyRide for schools?',
                a: 'TinyRide is a dedicated school transportation platform that enables schools to manage transport routes, assign vehicles and drivers, monitor live fleet movements, and verify student boarding in real time.',
              },
              {
                q: 'How does TinyRide track school vehicles?',
                a: 'TinyRide uses high-precision GPS telemetry transmitted securely from the driver’s mobile device during active trips. No proprietary vehicle hardware or OBD installation is required.',
              },
              {
                q: 'How do schools manage drivers?',
                a: 'Schools register authorized drivers, verify their commercial driving license credentials, and assign them to specific routes, vehicles, and schedules.',
              },
              {
                q: 'Can schools manage routes?',
                a: 'Yes. School transport administrators can define routes, specify sequential pickup stops and landmarks, and set arrival deadlines for morning and afternoon sessions.',
              },
              {
                q: 'How do parents receive updates?',
                a: 'Parents access live tracking through the TinyRide parent portal. They receive instant notifications when the driver starts the trip, when the vehicle is 500m away, when their child boards, and when the vehicle reaches school.',
              },
              {
                q: 'How does boarding work?',
                a: 'At each stop, parents provide a 6-digit SafeKey verification token generated for their child. The driver enters the code to confirm identity and update the school manifest.',
              },
              {
                q: 'Can schools monitor active trips?',
                a: 'Yes. The school dashboard displays all active routes simultaneously on a live operations map, highlighting route speeds, current stops, boarding counts, and delays.',
              },
            ].map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="border border-slate-200/80 rounded-2xl p-4 sm:p-5 transition-colors bg-[#FAFAF9]"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-bold text-sm sm:text-base text-slate-900 gap-3"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-[#006B2F]' : ''}`} />
                  </button>
                  {isOpen && (
                    <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed pt-2.5 border-t border-slate-200/60">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================
          9. BOTTOM CTA (Section 34)
          ================================================== */}
      <section className="py-16 sm:py-24 bg-[#0B1528] text-white text-center px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-5">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Bring your school transportation into one place.
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Empower your transport coordinators with real-time route visibility, verified boarding, and transparent parent communication.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto pt-3">
            <Link
              href="/school/signup"
              className="w-full sm:w-auto px-7 py-4 bg-[#006B2F] hover:bg-[#005525] active:scale-95 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg transition-all min-h-[48px] flex items-center justify-center gap-2"
            >
              <span>Get Started for Your School</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/school/login"
              className="w-full sm:w-auto px-7 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm sm:text-base rounded-2xl border border-slate-800 transition-all min-h-[48px] flex items-center justify-center"
            >
              School Login
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================================
          10. PUBLIC FOOTER (Zero Admin Links)
          ================================================== */}
      <footer className="border-t border-slate-800 bg-[#060D18] text-slate-400 text-xs py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            <div className="flex flex-col gap-2">
              <Link href="/">
                <img
                  src="/brand/logo-horizontal.png"
                  alt="TinyRide — School Transportation, Simplified"
                  className="h-8 w-auto object-contain brightness-110"
                />
              </Link>
              <p className="text-[11px] text-slate-400">
                School transportation, simplified. Little rides, big peace of mind.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-semibold text-slate-300">
              <Link href="/parents" className="hover:text-white transition-colors">For Parents</Link>
              <Link href="/schools" className="text-emerald-400 hover:text-emerald-300 transition-colors">For Schools</Link>
              <Link href="/drivers" className="hover:text-white transition-colors">For Drivers</Link>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <Link href="/safety" className="hover:text-white transition-colors">Safety</Link>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} TinyRide • Dodail Solutions Private Limited. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
              <Link href="/safety" className="hover:text-slate-300 transition-colors">Trust &amp; Safety</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
