'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Compass,
  KeyRound,
  ArrowRight,
  Check,
  ChevronDown,
  Play,
  Menu,
  X,
  CalendarCheck,
  MapPin,
  CheckCircle2,
  Sliders,
  Smartphone,
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

// Staggered reveal wrapper
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

// Strictly isolated demo marketing data (separate from production driver data)
const DEMO_PREVIEW = {
  driverName: 'Ravi Kumar',
  vehicleType: 'Auto Rickshaw',
  vehicleNumber: 'TS09-TR-102',
  schoolName: 'Olive Mount',
  routeName: 'Route 04',
  scheduledTime: '7:15 AM',
  currentStop: 'Rainbow Vistas Gate 2',
  waitingStudents: 2,
};

export default function DriversLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [previewMode, setPreviewMode] = useState<'ready' | 'in_progress'>('ready');

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 font-sans antialiased selection:bg-[#006B2F] selection:text-white flex flex-col">
      {/* ==================================================
          1. PUBLIC DRIVER HEADER (No Admin Shell)
          ================================================== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px] flex items-center justify-between">
          {/* LEFT: TinyRide Logo + FOR DRIVERS badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/brand/logo-horizontal.png"
                alt="TinyRide — School Transportation, Simplified"
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 text-[#006B2F] border border-emerald-200/80">
              For Drivers
            </span>
          </div>

          {/* CENTER: Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-bold text-slate-600">
            <a href="#how-it-works" className="hover:text-[#006B2F] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#006B2F] transition-colors">Features</a>
            <a href="#safety" className="hover:text-[#006B2F] transition-colors">Driver Safety</a>
            <a href="#onboarding" className="hover:text-[#006B2F] transition-colors">Onboarding</a>
            <a href="#faq" className="hover:text-[#006B2F] transition-colors">FAQ</a>
          </nav>

          {/* RIGHT: Driver Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/driver/login"
              className="text-[13px] font-bold px-4 py-2 text-slate-700 hover:text-slate-900 rounded-xl transition-colors min-h-[44px] flex items-center"
            >
              Driver Log In
            </Link>
            <Link
              href="/driver/signup"
              className="text-[13px] font-bold px-4 py-2.5 bg-[#006B2F] hover:bg-[#005525] active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 min-h-[44px]"
            >
              <span>Join as a Driver</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center gap-2 sm:hidden">
            <span className="inline-flex sm:hidden text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-[#006B2F] border border-emerald-200">
              Drivers
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
            <a href="#safety" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700 hover:text-[#006B2F]">Driver Safety</a>
            <a href="#onboarding" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700 hover:text-[#006B2F]">Onboarding</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700 hover:text-[#006B2F]">FAQ</a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                href="/driver/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors min-h-[44px] flex items-center justify-center"
              >
                Driver Log In
              </Link>
              <Link
                href="/driver/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl bg-[#006B2F] hover:bg-[#005525] text-white text-xs font-bold shadow-xs transition-colors min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <span>Join as a Driver</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ==================================================
          2. DRIVER HERO SECTION
          ================================================== */}
      <section className="pt-10 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 flex flex-col text-center lg:text-left">
            {/* Eyebrow */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 text-[#006B2F] border border-emerald-200/80 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                Dedicated Driver Application
              </span>
            </div>

            {/* Desktop H1 (Intentional line breaks, 64-72px, 700-800 weight, max-width ~680px) */}
            <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-extrabold text-slate-900 tracking-tight leading-[1.08] max-w-[680px] mx-auto lg:mx-0">
              Drive smarter.<br />
              Keep every school<br />
              <span className="text-[#006B2F]">ride on track.</span>
            </h1>

            {/* Supporting Copy (17-19px, 1.5-1.6 line height, max-width 560-620px) */}
            <p className="mt-5 text-[17px] sm:text-[18px] text-slate-600 max-w-[600px] mx-auto lg:mx-0 leading-[1.55] font-normal">
              TinyRide gives school transportation drivers a simple way to manage assigned routes, track active trips, verify boarding and keep parents informed.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start">
              <Link
                href="/driver/signup"
                className="w-full sm:w-auto px-7 py-4 bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all min-h-[48px]"
              >
                <span>Join TinyRide as a Driver</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/driver/login"
                className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-bold text-sm sm:text-base rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-center transition-all min-h-[48px]"
              >
                Already a driver? Log in
              </Link>
            </div>

            {/* Factual Trust Row (Only existing capabilities) */}
            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Assigned route visibility
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Live trip updates
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Simple boarding workflow
              </span>
            </div>
          </div>

          {/* Right Hero Column: Realistic iPhone Device Visual */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            {/* Interactive Preview Switcher (Ready vs Active Trip) */}
            <div className="inline-flex items-center p-1 bg-slate-200/80 rounded-xl mb-3 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setPreviewMode('ready')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  previewMode === 'ready'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pre-Trip Preview
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('in_progress')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  previewMode === 'in_progress'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Trip Preview
              </button>
            </div>

            {/* iPhone Device Container */}
            <div className="w-[290px] sm:w-[316px] bg-slate-950 p-3 rounded-[48px] shadow-2xl shadow-slate-900/40 border-[5px] border-slate-800/90 relative select-none transition-transform hover:-translate-y-1 duration-300">
              {/* Dynamic Island */}
              <div className="w-24 h-5 bg-black rounded-full mx-auto mb-2.5 flex items-center justify-end pr-2.5">
                <span className="w-2 h-2 rounded-full bg-slate-800" />
              </div>

              {/* Mobile Screen Mockup */}
              <div className="bg-slate-900 rounded-[36px] overflow-hidden text-white p-4 flex flex-col gap-3 text-left border border-slate-800">
                {previewMode === 'ready' ? (
                  <>
                    {/* Driver Greeting Bar */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#006B2F] flex items-center justify-center font-extrabold text-white text-[11px] shadow-xs">
                          TR
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Good Morning</span>
                          <p className="text-xs font-bold text-white">{DEMO_PREVIEW.driverName}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                        Ready
                      </span>
                    </div>

                    {/* Assigned Vehicle */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Vehicle</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold text-white font-mono">{DEMO_PREVIEW.vehicleNumber}</span>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-800/40">
                          {DEMO_PREVIEW.vehicleType}
                        </span>
                      </div>
                    </div>

                    {/* Today's Trip */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Today&apos;s Trip</span>
                          <p className="text-sm font-bold text-white mt-0.5">{DEMO_PREVIEW.schoolName}</p>
                          <p className="text-[10px] text-slate-400">{DEMO_PREVIEW.routeName}</p>
                        </div>
                        <span className="text-xs font-bold text-white font-mono bg-slate-800/90 px-2 py-1 rounded-md">
                          {DEMO_PREVIEW.scheduledTime}
                        </span>
                      </div>
                    </div>

                    {/* Current Stop */}
                    <div className="border border-emerald-700/50 bg-emerald-950/30 rounded-2xl p-2.5">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">Current Stop</span>
                      <p className="text-xs font-bold text-white mt-0.5 truncate">{DEMO_PREVIEW.currentStop}</p>
                    </div>

                    {/* Action Button: [ START TRIP ] */}
                    <div className="w-full py-3 bg-[#006B2F] hover:bg-[#005525] rounded-xl text-center font-extrabold text-xs text-white shadow-md flex items-center justify-center gap-1.5 mt-1 cursor-default">
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>START TRIP</span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Active Trip Header */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div>
                          <span className="text-[9px] font-bold text-emerald-400 block uppercase tracking-wider">Trip in Progress</span>
                          <p className="text-xs font-bold text-white">{DEMO_PREVIEW.schoolName}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {DEMO_PREVIEW.routeName}
                      </span>
                    </div>

                    {/* Current Stop Card */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Current Stop</span>
                      <p className="text-xs font-bold text-white mt-1">{DEMO_PREVIEW.currentStop}</p>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400 font-semibold bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded-lg">
                        <span>●</span>
                        <span>{DEMO_PREVIEW.waitingStudents} students waiting</span>
                      </div>
                    </div>

                    {/* SafeKey Verification Prompt */}
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-2.5 text-center">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">SafeKey Ready</span>
                      <p className="text-[11px] text-slate-300 mt-0.5">Parent verifies student at door</p>
                    </div>

                    {/* Action Button: [ ARRIVED ] */}
                    <div className="w-full py-3 bg-emerald-600 rounded-xl text-center font-extrabold text-xs text-white shadow-md flex items-center justify-center gap-1.5 mt-1 cursor-default">
                      <Check className="w-3.5 h-3.5" />
                      <span>ARRIVED</span>
                    </div>
                  </>
                )}

                {/* Subtle caption */}
                <p className="text-[8px] text-slate-500 text-center tracking-tight">
                  Sample driver preview screen • Isolated demo data
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          3. OPERATIONAL WORKFLOW (Section 13)
          Connected journey: 01 to 06
          ================================================== */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeReveal>
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="text-xs font-bold text-[#006B2F] uppercase tracking-widest block mb-2">
                Operational Workflow
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Everything you need for your school route.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
                A simple, connected 6-step journey designed for fast, stationary actions before and between stops.
              </p>
            </div>
          </FadeReveal>

          {/* Connected Steps Grid / Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 relative">
            {[
              { num: '01', title: 'Trip Assignment', desc: 'View assigned school run, student count, and vehicle details.' },
              { num: '02', title: 'Start Route', desc: 'Confirm trip start with one tap before moving your vehicle.' },
              { num: '03', title: 'Share Location', desc: 'Secure telemetry updates parents and school automatically.' },
              { num: '04', title: 'Verify Boarding', desc: 'Confirm each student boarding at designated pickup points.' },
              { num: '05', title: 'Reach School', desc: 'Arrive at the school gate or designated drop-off bus bay.' },
              { num: '06', title: 'Complete Trip', desc: 'Conclude the trip and verify all students are safely dropped.' },
            ].map((step, idx) => (
              <FadeReveal key={step.num} delay={idx * 60}>
                <div className="bg-[#FAFAF9] border border-slate-200/80 hover:border-[#006B2F]/50 rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full transition-all group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-extrabold text-[#006B2F] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        {step.num}
                      </span>
                      {idx < 5 && (
                        <span className="hidden lg:inline text-slate-300 group-hover:text-emerald-500 transition-colors">
                          →
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1.5">{step.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </FadeReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          4. DRIVER BENEFITS (Section 14)
          ================================================== */}
      <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <FadeReveal>
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold text-[#006B2F] uppercase tracking-widest block mb-2">
              Driver Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Designed for simple, stress-free trips.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              Straightforward tools engineered to make daily school transportation reliable and clear.
            </p>
          </div>
        </FadeReveal>

        {/* 5 Distinct Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FadeReveal delay={40}>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3 h-full hover:border-[#006B2F]/40 transition-colors">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006B2F]">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Assigned Trips &amp; Schedule</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                See your morning and afternoon school runs, scheduled pickup times, and vehicle assignment clearly in advance.
              </p>
            </div>
          </FadeReveal>

          <FadeReveal delay={80}>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3 h-full hover:border-[#006B2F]/40 transition-colors">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006B2F]">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Live Location Sharing</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                GPS telemetry is broadcast only during an active trip, automatically updating parents and school transport managers.
              </p>
            </div>
          </FadeReveal>

          <FadeReveal delay={120}>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3 h-full hover:border-[#006B2F]/40 transition-colors">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006B2F]">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Boarding Verification</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Verify each student at the stop with a quick SafeKey verification token so records are synchronized in real time.
              </p>
            </div>
          </FadeReveal>

          <FadeReveal delay={160}>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3 h-full hover:border-[#006B2F]/40 transition-colors">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006B2F]">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Route &amp; Stop Guidance</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Review sequential stops, student names, and designated landmarks on an easy-to-read, clutter-free display.
              </p>
            </div>
          </FadeReveal>

          <FadeReveal delay={200}>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3 h-full hover:border-[#006B2F]/40 transition-colors">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-[#006B2F]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Trip Completion</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                End the run upon arrival at the school campus or return destination with instant trip summaries and attendance logs.
              </p>
            </div>
          </FadeReveal>
        </div>
      </section>

      {/* ==================================================
          5. SAFETY SECTION (Section 16)
          Driver Workflow Focus
          ================================================== */}
      <section id="safety" className="py-16 sm:py-24 bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest">
                Driver Safety Architecture
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Built for simple, focused driving.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                TinyRide keeps the information you need visible without turning every stop into a complicated workflow.
              </p>

              {/* 4 Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-400">
                    <Smartphone className="w-4 h-4" />
                    <h4 className="text-sm font-bold text-white">Large Touch Targets</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Designed for stationary one-tap actions with large buttons and readable high-contrast status cues.
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-400">
                    <MapPin className="w-4 h-4" />
                    <h4 className="text-sm font-bold text-white">Clear Next Stop</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Instantly view the upcoming pickup landmark, student count, and next arrival point without hunting through menus.
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-400">
                    <Sliders className="w-4 h-4" />
                    <h4 className="text-sm font-bold text-white">Minimal Interaction</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Zero unnecessary taps while stationary. Continuous automatic telemetry transmits location without touching the screen.
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5 text-emerald-400">
                    <Play className="w-4 h-4" />
                    <h4 className="text-sm font-bold text-white">Simple Trip Controls</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Clear Start, Arrive, and Complete transitions with zero ambiguity during morning and afternoon school runs.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic pt-2">
                TinyRide provides operational ride management tools and does not replace safe vehicle operation or traffic laws.
              </p>
            </div>

            {/* Right: Realistic Active Trip Screen Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Trip in Progress</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Route 04
                  </span>
                </div>

                <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Current Stop</span>
                  <p className="text-sm font-bold text-white mt-0.5">Rainbow Vistas Gate 2</p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold bg-amber-950/40 border border-amber-800/40 px-2 py-1 rounded-lg">
                    <span>●</span>
                    <span>2 students waiting</span>
                  </div>
                </div>

                <div className="w-full py-3.5 bg-emerald-600 rounded-xl text-center text-xs font-bold text-white shadow-md flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>ARRIVED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          6. DRIVER ONBOARDING (Section 18)
          Six Steps: 01 to 06
          ================================================== */}
      <section id="onboarding" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <FadeReveal>
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-bold text-[#006B2F] uppercase tracking-widest block mb-2">
              Registration Journey
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Six simple steps to start driving.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              Transparent onboarding workflow to get verified and linked with school routes.
            </p>
          </div>
        </FadeReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Verify Mobile Number', desc: 'Authenticate your phone number via a secure 6-digit OTP code.' },
            { step: '02', title: 'Create Driver Profile', desc: 'Provide legal name, city, and primary contact details.' },
            { step: '03', title: 'Provide Required Details', desc: 'Submit valid commercial driving license number.' },
            { step: '04', title: 'Add Vehicle Information', desc: 'Record auto-rickshaw, van, or minibus registration details.' },
            { step: '05', title: 'Complete Required Verification', desc: 'Ops team verifies license and vehicle fitness before activation.' },
            { step: '06', title: 'Receive Assigned Trips', desc: 'Access your driver console and begin operating assigned school runs.' },
          ].map((item, idx) => (
            <FadeReveal key={item.step} delay={idx * 50}>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 h-full hover:border-[#006B2F]/40 transition-colors">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-[#006B2F] font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200/60">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </FadeReveal>
          ))}
        </div>
      </section>

      {/* ==================================================
          7. FAQ SECTION (Section 19)
          ================================================== */}
      <section id="faq" className="py-16 sm:py-24 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeReveal>
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-[#006B2F] uppercase tracking-widest block mb-2">
                Frequently Asked Questions
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Questions drivers ask about TinyRide.
              </h2>
            </div>
          </FadeReveal>

          <div className="flex flex-col gap-3">
            {[
              {
                q: 'What is TinyRide for drivers?',
                a: 'TinyRide is a mobile-first school route management tool. It lets authorized drivers view daily trip schedules, share live vehicle location during active runs, and verify student boarding using a secure SafeKey handshake.',
              },
              {
                q: 'How do I join TinyRide?',
                a: 'You can register online by providing your phone number, legal name, commercial driving license number, and vehicle registration. Once verified by operations, your account is approved to receive school trips.',
              },
              {
                q: 'How do I receive school trips?',
                a: 'School transport coordinators and fleet managers assign trips and routes to approved drivers based on service area, school schedules, and vehicle capacity.',
              },
              {
                q: 'How does live location work?',
                a: 'When you tap "Start Trip", the TinyRide mobile app securely publishes your GPS position to parents and schools. Tracking automatically ends when you complete the trip.',
              },
              {
                q: 'How does boarding verification work?',
                a: 'At each stop, parents provide a 6-digit SafeKey generated for their child. You type this code into the driver app to verify identity and record pickup.',
              },
              {
                q: 'Do I need an app?',
                a: 'No app store download is required. TinyRide is a Progressive Web App (PWA) that runs directly in mobile Chrome or Safari. You can tap "Add to Home Screen" for instant, one-tap access.',
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
          8. CTA SECTION (Section 20)
          ================================================== */}
      <section className="py-16 sm:py-24 bg-[#0B1528] text-white text-center px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-5">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to start driving with TinyRide?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Enroll your vehicle today and start operating organized school routes with real-time route tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto pt-3">
            <Link
              href="/driver/signup"
              className="w-full sm:w-auto px-7 py-4 bg-[#006B2F] hover:bg-[#005525] active:scale-95 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg transition-all min-h-[48px] flex items-center justify-center gap-2"
            >
              <span>Join TinyRide as a Driver</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/driver/login"
              className="w-full sm:w-auto px-7 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm sm:text-base rounded-2xl border border-slate-800 transition-all min-h-[48px] flex items-center justify-center"
            >
              Driver Login
            </Link>
          </div>
        </div>
      </section>

      {/* ==================================================
          9. PUBLIC FOOTER (Section 21)
          Zero admin links!
          ================================================== */}
      <footer className="border-t border-slate-800 bg-[#060D18] text-slate-400 text-xs py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            {/* Logo */}
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

            {/* Navigation Links */}
            <div className="flex flex-wrap items-center gap-6 font-semibold text-slate-300">
              <Link href="/parents" className="hover:text-white transition-colors">For Parents</Link>
              <Link href="/#for-schools" className="hover:text-white transition-colors">For Schools</Link>
              <Link href="/drivers" className="text-emerald-400 hover:text-emerald-300 transition-colors">For Drivers</Link>
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
