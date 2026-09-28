'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Compass,
  KeyRound,
  ArrowRight,
  Truck,
  Check,
  ChevronDown,
  Play,
  Menu,
  X,
} from 'lucide-react';
import { getDriverProfile } from '@/lib/driverAuth';

// Prefers-reduced-motion hook
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

// Scroll-reveal wrapper
function ScrollReveal({
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
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// Isolated marketing demo data (clearly separate from production APIs)
const DEMO_MARKETING = {
  driverName: 'Ravi Kumar',
  schoolName: 'Olive Mount',
  routeName: 'Route 04',
  scheduledTime: '7:15 AM',
  vehicleType: 'Auto Rickshaw',
  vehicleNumber: 'TS09-TR-102',
  currentStop: 'Rainbow Vistas Gate 2',
  waitingStudents: 2,
};

export default function DriversLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDriverAuth, setIsDriverAuth] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    const profile = getDriverProfile();
    setIsDriverAuth(profile?.status === 'approved');
  }, []);

  const driverHref = isDriverAuth ? '/driver' : '/driver/login';

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 font-sans antialiased selection:bg-[#006B2F] selection:text-white">
      {/* 1. PUBLIC HEADER / NAV */}
      <header className="sticky top-0 z-40 bg-[#FAFAF9]/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#006B2F] flex items-center justify-center text-white font-black text-xs tracking-tight shadow-xs">
              TR
            </div>
            <div className="flex flex-col">
              <span className="text-base font-extrabold text-slate-900 leading-tight">TinyRide</span>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider -mt-0.5">For Drivers</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
            <a href="#how-it-works" className="hover:text-emerald-800 transition-colors">How It Works</a>
            <a href="#benefits" className="hover:text-emerald-800 transition-colors">Features</a>
            <a href="#safety" className="hover:text-emerald-800 transition-colors">Driver Safety</a>
            <a href="#onboarding" className="hover:text-emerald-800 transition-colors">Onboarding</a>
            <a href="#faq" className="hover:text-emerald-800 transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href={driverHref}
              className="text-xs font-bold px-3.5 py-2 text-slate-700 hover:text-slate-900 rounded-xl transition-colors min-h-[40px] flex items-center"
            >
              Driver Log In
            </Link>
            <Link
              href="/driver/signup"
              className="text-xs font-extrabold px-4 py-2 bg-[#006B2F] hover:bg-[#005525] active:scale-95 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 min-h-[40px]"
            >
              <span>Join as Driver</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 text-slate-700 hover:text-slate-900"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-slate-200 bg-white px-4 py-4 flex flex-col gap-3 text-sm font-semibold animate-in slide-in-from-top-2">
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700">How It Works</a>
            <a href="#benefits" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700">Features</a>
            <a href="#safety" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700">Safety</a>
            <a href="#onboarding" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700">Onboarding</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 text-slate-700">FAQ</a>
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href={driverHref}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold"
              >
                Driver Log In
              </Link>
              <Link
                href="/driver/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-[#006B2F] text-white text-xs font-bold shadow-xs"
              >
                Join as Driver
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-10 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 flex flex-col gap-5 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 w-fit mx-auto lg:mx-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Dedicated School Route Application
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
              Drive smarter.<br />
              <span className="text-[#006B2F]">Keep every school ride on track.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              TinyRide gives drivers a simple way to manage school routes, track assigned trips, verify boarding and keep parents and schools informed.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start pt-2">
              <Link
                href="/driver/signup"
                className="w-full sm:w-auto px-6 py-4 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] active:scale-[0.98] text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all min-h-[48px]"
              >
                <span>Join TinyRide as a Driver</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/driver/login"
                className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-bold text-sm rounded-2xl border border-slate-200 flex items-center justify-center transition-all min-h-[48px]"
              >
                Already a driver? Log in
              </Link>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-5 pt-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" /> Auto-rickshaws, vans &amp; buses
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" /> Zero phone call distractions
              </span>
            </div>
          </div>

          {/* Right Product Visual: iPhone Style Driver App Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-[300px] sm:w-[320px] bg-slate-950 p-3 rounded-[44px] shadow-2xl border-4 border-slate-800 relative select-none">
              {/* Dynamic Island */}
              <div className="w-24 h-5 bg-black rounded-full mx-auto mb-2" />

              {/* Driver Mobile Mockup Screen */}
              <div className="bg-slate-900 rounded-[34px] overflow-hidden text-white p-4 flex flex-col gap-3 text-left border border-slate-800">
                {/* Driver Bar */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#006B2F] flex items-center justify-center font-black text-white text-[10px]">
                      TR
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Good morning</span>
                      <p className="text-xs font-bold text-white">{DEMO_MARKETING.driverName}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/40">
                    Live Ready
                  </span>
                </div>

                {/* Assigned Vehicle */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Vehicle</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-black text-white font-mono">{DEMO_MARKETING.vehicleNumber}</span>
                    <span className="text-[10px] font-semibold text-emerald-400">{DEMO_MARKETING.vehicleType}</span>
                  </div>
                </div>

                {/* Next Ride */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Today&apos;s Trip</span>
                      <p className="text-sm font-black text-white mt-0.5">{DEMO_MARKETING.schoolName}</p>
                      <p className="text-[10px] text-slate-400">{DEMO_MARKETING.routeName}</p>
                    </div>
                    <span className="text-xs font-bold text-white font-mono bg-slate-800 px-2 py-1 rounded-md">
                      {DEMO_MARKETING.scheduledTime}
                    </span>
                  </div>
                </div>

                {/* Current Stop */}
                <div className="border border-emerald-700/50 bg-emerald-950/30 rounded-2xl p-2.5">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider block">First Pickup Stop</span>
                  <p className="text-xs font-bold text-white mt-0.5 truncate">{DEMO_MARKETING.currentStop}</p>
                </div>

                {/* Big Button */}
                <div className="w-full py-3 bg-[#006B2F] rounded-xl text-center font-black text-xs text-white shadow-md flex items-center justify-center gap-1.5 mt-1">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>START TRIP</span>
                </div>

                <p className="text-[8px] text-slate-500 text-center tracking-tight">
                  Sample driver preview screen • TinyRide PWA
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS / DRIVER JOURNEY */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block mb-2">
                Operational Workflow
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Everything you need for your school route.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
                From morning start to campus drop-off, TinyRide guides your entire run with clear, minimal actions.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {[
              { num: '01', title: 'Trip Assignment', desc: 'Receive your assigned school route and student pickup manifest.' },
              { num: '02', title: 'Start Route', desc: 'Confirm your vehicle and start the run with a single tap.' },
              { num: '03', title: 'Share Location', desc: 'Live GPS broadcasts automatically while you focus on driving.' },
              { num: '04', title: 'Verify Boarding', desc: 'Confirm each student with instant SafeKey verification.' },
              { num: '05', title: 'Reach School', desc: 'Arrive at school campus and alert waiting parents and staff.' },
              { num: '06', title: 'Complete Trip', desc: 'Conclude the run and review finished student records.' },
            ].map((step, idx) => (
              <ScrollReveal key={step.num} delay={idx * 80}>
                <div className="bg-[#FAFAF9] border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between h-full hover:border-[#006B2F]/40 transition-colors">
                  <div>
                    <span className="text-xs font-mono font-black text-emerald-800 mb-2 block">{step.num}</span>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">{step.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. DRIVER BENEFITS */}
      <section id="benefits" className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block mb-2">
              Driver Benefits
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Designed for simple, stress-free trips.
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ScrollReveal delay={50}>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Assigned Trips &amp; Schedule</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                See your morning and afternoon school runs, scheduled start times, and vehicle assignment clearly.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Live GPS Location Sharing</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your mobile phone transmits live vehicle telemetry only during active trips so parents see real movement.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">SafeKey Boarding Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quick 6-digit handshake at the stop ensures every child is handed over safely to authorized vehicles.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. SAFETY-FOCUSED SECTION */}
      <section id="safety" className="py-16 sm:py-20 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Driver Safety Priority
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Built for simple, focused driving.
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
                Operating a school vehicle requires total focus on the road. TinyRide is intentionally built to minimize screen interaction while driving.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
                  <h4 className="text-sm font-bold text-white mb-1">Large Touch Targets</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Designed for stationary one-tap actions with large buttons and readable high-contrast status cues.
                  </p>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
                  <h4 className="text-sm font-bold text-white mb-1">Zero Phone Call Distractions</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Parents see live updates automatically, eliminating anxious calls asking &quot;Where are you?&quot;
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic pt-2">
                TinyRide provides operational ride management tools and does not replace safe vehicle operation or traffic laws.
              </p>
            </div>

            {/* Active Trip Preview Visual */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active Trip Preview</span>
                  <span className="text-[10px] font-mono text-slate-400">Route 04</span>
                </div>
                <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Current Pickup Stop</span>
                  <p className="text-xs font-bold text-white mt-0.5">Rainbow Vistas Gate 2</p>
                  <p className="text-[10px] text-amber-400 mt-1 font-semibold">2 students waiting to board</p>
                </div>
                <div className="w-full py-3 bg-emerald-600 rounded-xl text-center text-xs font-bold text-white shadow-xs">
                  ARRIVED AT STOP
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ONBOARDING STEPS */}
      <section id="onboarding" className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block mb-2">
              Getting Started
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Six simple steps to start driving.
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Verify Mobile Number', desc: 'Authenticate your phone number via a secure 6-digit OTP code.' },
            { step: '02', title: 'Driver Profile', desc: 'Provide your legal name and contact details as per government ID.' },
            { step: '03', title: 'Commercial License', desc: 'Submit your valid commercial driver license details.' },
            { step: '04', title: 'Vehicle Information', desc: 'Record your auto-rickshaw, van, or minibus registration number.' },
            { step: '05', title: 'Safety Verification', desc: 'School transportation ops reviews documentation before route approval.' },
            { step: '06', title: 'Receive Assigned Trips', desc: 'Access your driver console and begin operating assigned school runs.' },
          ].map((item, idx) => (
            <ScrollReveal key={item.step} delay={idx * 60}>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3.5">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* 7. DRIVER FAQ */}
      <section id="faq" className="py-16 sm:py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block mb-2">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Questions drivers ask about TinyRide.
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {[
              {
                q: 'What is TinyRide for drivers?',
                a: 'TinyRide is a mobile-first school route management tool. It lets authorized drivers view daily trip schedules, share live vehicle location during active runs, and verify student boarding using a secure SafeKey handshake.',
              },
              {
                q: 'How do I receive school trips?',
                a: 'School transport coordinators and fleet managers assign trips and routes to approved drivers based on service area, school schedules, and vehicle capacity.',
              },
              {
                q: 'How does live location tracking work?',
                a: 'When you tap "Start Trip", the TinyRide mobile app securely publishes your GPS position to parents and schools. Tracking automatically ends when you complete the trip.',
              },
              {
                q: 'How does SafeKey boarding verification work?',
                a: 'At each stop, parents provide a 6-digit SafeKey generated for their child. You type this code into the driver app to verify identity and record pickup.',
              },
              {
                q: 'Do I need to install an app from an app store?',
                a: 'No. TinyRide is a Progressive Web App (PWA). You can open it in mobile Chrome or Safari and tap "Add to Home Screen" for an instant, app-like experience without downloading large files.',
              },
            ].map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="border border-slate-200 rounded-2xl p-4 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900 gap-3"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed pt-2 border-t border-slate-100">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. BOTTOM CTA */}
      <section className="py-16 sm:py-20 bg-slate-950 text-white text-center px-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-5">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to start driving with TinyRide?
          </h2>
          <p className="text-sm text-slate-400 max-w-md leading-relaxed">
            Enroll your vehicle today and start operating organized school routes with real-time route tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto pt-2">
            <Link
              href="/driver/signup"
              className="w-full sm:w-auto px-6 py-4 bg-[#006B2F] hover:bg-[#005525] active:scale-95 text-white font-black text-sm rounded-2xl shadow-lg transition-all min-h-[48px] flex items-center justify-center gap-2"
            >
              <span>Join TinyRide as a Driver</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/driver/login"
              className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm rounded-2xl border border-slate-800 transition-all min-h-[48px] flex items-center justify-center"
            >
              Driver Log In
            </Link>
          </div>
        </div>
      </section>

      {/* 9. PUBLIC FOOTER */}
      <footer className="border-t border-slate-800 bg-black text-slate-400 text-xs py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} TinyRide Mobility Solutions. All rights reserved.</p>
          <div className="flex items-center gap-5 font-semibold text-slate-400">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/safety" className="hover:text-white transition-colors">Safety Standards</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
