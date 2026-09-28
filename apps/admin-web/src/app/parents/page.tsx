'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAuthenticatedParent } from '@/lib/parentAuth';
import { TinyRideIPhone } from '@/components/TinyRideIPhone';
import { TinyRideMobileTrackingApp } from '@/components/TinyRideMobileTrackingApp';

// Lightweight, performant Scroll-Reveal Component
function ScrollReveal({
  children,
  className = '',
  delay = 0,
  yOffset = 16,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: '700ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}ms`,
        transform: isVisible ? 'translateY(0) scale(1)' : `translateY(${yOffset}px) scale(0.99)`,
        opacity: isVisible ? 1 : 0,
      }}
      className={`transition-all ${className}`}
    >
      {children}
    </div>
  );
}

export default function ParentsLandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'morning' | 'afternoon'>('morning');

  useEffect(() => {
    setIsAuth(isAuthenticatedParent());
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrimaryCta = () => {
    if (isAuth) {
      router.push('/parent');
    } else {
      router.push('/parent/signup');
    }
  };

  const parentSteps = [
    {
      num: '01',
      title: 'Your ride starts',
      time: '07:15 AM',
      description: 'The driver departs the depot on the approved school route. Live vehicle tracking begins automatically.',
      badge: 'Route Activated',
    },
    {
      num: '02',
      title: 'Your vehicle approaches',
      time: '07:32 AM',
      description: 'Receive an automated notification when the vehicle is 500 meters away so your morning is relaxed.',
      badge: '5 min away',
    },
    {
      num: '03',
      title: 'Your child boards',
      time: '07:36 AM',
      description: 'Boarding is verified with your child’s unique SafeKey token. Instant confirmation on your phone.',
      badge: 'SafeKey Confirmed',
    },
    {
      num: '04',
      title: 'The ride continues',
      time: '07:37 – 08:02 AM',
      description: 'Watch the vehicle move along its designated path with real-time ETA adjusted for morning traffic.',
      badge: 'In Transit',
    },
    {
      num: '05',
      title: 'Your child arrives at school',
      time: '08:04 AM',
      description: 'Vehicle reaches the campus drop-off bay. Receive gate arrival confirmation with zero guesswork.',
      badge: 'School Gate Verified',
    },
  ];

  const parentFaqs = [
    {
      q: 'What is TinyRide?',
      a: 'TinyRide is a dedicated school transportation platform that connects parents, schools, and drivers to provide live vehicle tracking, SafeKey boarding verification, and automated arrival notifications.',
    },
    {
      q: 'How does TinyRide track school rides?',
      a: 'TinyRide uses high-precision GPS telemetry coupled with pre-approved school route corridors to calculate real-time, traffic-adjusted arrival times without requiring driver interaction while on the road.',
    },
    {
      q: 'Can I see where my child’s vehicle is?',
      a: 'Yes. Once a trip begins, open the TinyRide parent app to see the vehicle’s live position on the map, current speed, and minute-by-minute estimated arrival time.',
    },
    {
      q: 'How will I know when my child boards?',
      a: 'At your designated pickup stop, the driver verifies boarding using your student’s unique SafeKey token. You receive an instant lock-screen confirmation as soon as your child is safely on board.',
    },
    {
      q: 'Can I see the driver and vehicle?',
      a: 'Yes. Your parent app clearly displays your assigned driver’s name, photo, direct contact number, vehicle make/model, and license plate number.',
    },
    {
      q: 'How will I know when my child reaches school?',
      a: 'When the vehicle enters the school campus drop-off bay, the system logs the arrival and sends an immediate push notification confirming your child has safely reached school.',
    },
    {
      q: 'How do I set up my child’s transportation?',
      a: 'Getting started takes just a few steps: create your parent account, add your child and school details, select your pickup location, and connect with your school’s transport route.',
    },
  ];

  return (
    <div id="top" className="min-h-screen bg-[#FAFAF9] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden pb-[calc(84px+env(safe-area-inset-bottom,0px))] xl:pb-0">
      
      {/* 1. FIXED PARENT HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-xs py-2.5 sm:py-3 border-b border-slate-200/80'
            : 'bg-white/90 backdrop-blur-md py-3 sm:py-3.5 lg:py-4 border-b border-slate-200/50'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 flex items-center justify-between">
          {/* Logo & Category Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <img
                src="/brand/logo-horizontal.png"
                alt="TinyRide — School transportation and live ride tracking"
                className="h-8 sm:h-9 md:h-9 lg:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-900 text-[11px] font-bold tracking-wide">
              For Parents
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-7 text-[13.5px] font-medium text-slate-600">
            <a href="#value" className="hover:text-emerald-800 transition-colors duration-150">
              Overview
            </a>
            <a href="#how-it-works" className="hover:text-emerald-800 transition-colors duration-150">
              How It Works
            </a>
            <a href="#app-demo" className="hover:text-emerald-800 transition-colors duration-150">
              Parent App
            </a>
            <a href="#safety" className="hover:text-emerald-800 transition-colors duration-150">
              Safety
            </a>
            <a href="#onboarding" className="hover:text-emerald-800 transition-colors duration-150">
              Get Started
            </a>
            <a href="#faq" className="hover:text-emerald-800 transition-colors duration-150">
              FAQ
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAuth ? (
              <Link
                href="/parent"
                className="cursor-pointer text-xs sm:text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 bg-[#006B2F] hover:bg-[#005525] active:scale-95 text-white rounded-lg shadow-xs transition-all min-h-[44px] inline-flex items-center justify-center"
              >
                Go to Parent App →
              </Link>
            ) : (
              <>
                <Link
                  href="/parent/login"
                  className="cursor-pointer text-xs font-semibold px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px] flex items-center"
                >
                  Log in
                </Link>
                <Link
                  href="/parent/signup"
                  className="cursor-pointer text-xs sm:text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 bg-[#006B2F] hover:bg-[#005525] active:scale-95 text-white rounded-lg shadow-xs transition-all min-h-[44px] inline-flex items-center justify-center select-none"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white border-b border-slate-200 px-5 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-60px)] overflow-y-auto">
            <a
              href="#value"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-800 min-h-[44px] flex items-center"
            >
              Overview
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-800 min-h-[44px] flex items-center"
            >
              How It Works
            </a>
            <a
              href="#app-demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-800 min-h-[44px] flex items-center"
            >
              Parent App
            </a>
            <a
              href="#safety"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-800 min-h-[44px] flex items-center"
            >
              Safety
            </a>
            <a
              href="#onboarding"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-800 min-h-[44px] flex items-center"
            >
              Get Started
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-800 min-h-[44px] flex items-center"
            >
              FAQ
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                href="/"
                className="block text-center py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                ← Back to Main TinyRide Website
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. PARENT HERO SECTION */}
      <section className="relative pt-20 pb-12 sm:pt-24 sm:pb-16 lg:pt-32 lg:pb-28 overflow-hidden bg-gradient-to-b from-white via-[#FAFAF9] to-[#FAFAF9]">
        {/* Subtle background route path */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none">
            <path
              d="M -50 200 C 350 200, 520 600, 950 550 C 1300 500, 1420 300, 1600 350"
              stroke="#CBD5E1"
              strokeWidth="2.5"
              strokeDasharray="6 8"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 relative">
          
          {/* MOBILE HERO (< 768px): App-like full width, NO nested iPhone mockup */}
          <div className="block md:hidden space-y-5">
            <div className="space-y-3 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-semibold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Parent Experience</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                School rides,<br />without the worry.
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                See where the ride is, know who’s driving, and get updates from pickup to school.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={handlePrimaryCta}
                className="cursor-pointer w-full py-3.5 bg-[#006B2F] active:bg-[#00441d] text-white font-bold text-sm rounded-xl shadow-sm text-center flex items-center justify-center gap-2"
              >
                <span>Get Started as a Parent</span>
                <span>→</span>
              </button>
              {!isAuth && (
                <Link
                  href="/parent/login"
                  className="w-full py-2.5 text-center text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  I already have an account
                </Link>
              )}
            </div>

            {/* Full-width interactive mobile app UI */}
            <div className="pt-2">
              <TinyRideMobileTrackingApp />
            </div>
          </div>

          {/* TABLET HERO (768px – 1199px): Two-column hybrid layout */}
          <div className="hidden md:grid xl:hidden grid-cols-12 gap-8 items-center">
            <div className="col-span-6 space-y-5 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Dedicated Parent Portal</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                School rides,<br />without the worry.
              </h1>
              <p className="text-base text-slate-600 leading-relaxed">
                See where the ride is, know who’s driving, and get updates from pickup to school.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="cursor-pointer px-6 py-3.5 bg-[#006B2F] hover:bg-[#005525] active:scale-95 text-white font-bold text-sm rounded-xl shadow-xs inline-flex items-center justify-center gap-2"
                >
                  <span>Get Started as a Parent</span>
                  <span>→</span>
                </button>
                {!isAuth && (
                  <Link
                    href="/parent/login"
                    className="px-5 py-3.5 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl inline-flex items-center justify-center transition-colors"
                  >
                    I already have an account
                  </Link>
                )}
              </div>
            </div>
            <div className="col-span-6 flex justify-center">
              <TinyRideIPhone mode="parent_tracking" />
            </div>
          </div>

          {/* DESKTOP HERO (>= 1200px): Premium Apple-Style presentation */}
          <div className="hidden xl:grid grid-cols-12 gap-12 items-center">
            <div className="col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Dedicated Parent Platform</span>
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                School rides,<br />without the worry.
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                See where the ride is, know who’s driving, and get updates from pickup to school.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="cursor-pointer px-7 py-4 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] active:scale-95 text-white font-bold text-base rounded-xl shadow-sm hover:shadow-md transition-all inline-flex items-center justify-center gap-2"
                >
                  <span>Get Started as a Parent</span>
                  <span>→</span>
                </button>
                {!isAuth && (
                  <Link
                    href="/parent/login"
                    className="px-6 py-4 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl inline-flex items-center justify-center transition-colors"
                  >
                    I already have an account
                  </Link>
                )}
              </div>
              <div className="pt-4 flex items-center gap-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Live GPS telemetry</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>SafeKey boarding handshake</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>Zero unnecessary calls</span>
                </div>
              </div>
            </div>

            <div className="col-span-6 flex justify-center">
              <TinyRideIPhone mode="parent_tracking" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. PARENT VALUE PROPOSITION — 4 SIMPLE CONCEPTS */}
      <section id="value" className="py-16 sm:py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Parent Peace of Mind
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Everything you need to know about your child’s school ride.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
                No cluttered dashboards or complicated menus. Just four essential pieces of reassurance when you need them.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Live Location */}
            <ScrollReveal delay={0}>
              <div className="bg-[#FAFAF9] p-6 sm:p-7 rounded-2xl border border-slate-200/90 hover:border-emerald-300 transition-all space-y-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-sm flex items-center justify-center">
                  📍
                </div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Live Location
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  See where the school vehicle is.
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time GPS updates show your child’s ride moving along its pre-approved school corridor with traffic-adjusted arrival times.
                </p>
              </div>
            </ScrollReveal>

            {/* 2. Driver */}
            <ScrollReveal delay={100}>
              <div className="bg-[#FAFAF9] p-6 sm:p-7 rounded-2xl border border-slate-200/90 hover:border-emerald-300 transition-all space-y-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-sm flex items-center justify-center">
                  👤
                </div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Driver
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Know who is driving.
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Always see your verified driver’s profile photo, direct phone number, vehicle model, and registration plate.
                </p>
              </div>
            </ScrollReveal>

            {/* 3. Boarding */}
            <ScrollReveal delay={200}>
              <div className="bg-[#FAFAF9] p-6 sm:p-7 rounded-2xl border border-slate-200/90 hover:border-emerald-300 transition-all space-y-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-sm flex items-center justify-center">
                  🔑
                </div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Boarding
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Know when your child boards.
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  SafeKey digital verification ensures you receive an instant alert the exact second your child is safely seated.
                </p>
              </div>
            </ScrollReveal>

            {/* 4. Arrival */}
            <ScrollReveal delay={300}>
              <div className="bg-[#FAFAF9] p-6 sm:p-7 rounded-2xl border border-slate-200/90 hover:border-emerald-300 transition-all space-y-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-sm flex items-center justify-center">
                  🏫
                </div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Arrival
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Know when your child reaches school.
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Immediate confirmation the moment the vehicle enters the school gate bay so you can carry on with your workday.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS — VISUAL PARENT JOURNEY */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Journey Experience
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
                From pickup to school, you’re always in the loop.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
                Follow every milestone from departure to arrival with simple, clear visual progress.
              </p>
            </div>
          </ScrollReveal>

          {/* Stepper Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {parentSteps.map((step, idx) => (
              <ScrollReveal key={step.num} delay={idx * 60}>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-left h-full flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center">
                        {step.num}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {step.time}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10.5px] font-semibold text-emerald-700">
                      ● {step.badge}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PARENT APP DEMONSTRATION SECTION */}
      <section id="app-demo" className="py-16 sm:py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                App In Action
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                Your child’s journey. One simple view.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
                Everything that matters is organized into a calm, intuitive interface you can check in three seconds.
              </p>
            </div>
          </ScrollReveal>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Highlights */}
            <div className="lg:col-span-4 space-y-6 text-left">
              <div className="p-5 rounded-2xl bg-[#FAFAF9] border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-emerald-800 uppercase">Live Location & ETA</div>
                <h4 className="text-base font-bold text-slate-900">Minute-by-minute accuracy</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time telemetry continuously calculates traffic on your child’s morning commute.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAFAF9] border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-emerald-800 uppercase">Driver & Vehicle</div>
                <h4 className="text-base font-bold text-slate-900">Know exactly who is driving</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Direct call button, driver rating, vehicle model (Force Traveller 18-Seater), and license number.
                </p>
              </div>
            </div>

            {/* Center Product Showcase */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="w-full max-w-sm">
                <TinyRideMobileTrackingApp />
              </div>
            </div>

            {/* Right Highlights */}
            <div className="lg:col-span-4 space-y-6 text-left">
              <div className="p-5 rounded-2xl bg-[#FAFAF9] border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-emerald-800 uppercase">SafeKey Boarding Status</div>
                <h4 className="text-base font-bold text-slate-900">Verified at the curb</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instant confirmation badge turns green the moment your child steps aboard.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAFAF9] border border-slate-200 space-y-1.5">
                <div className="text-xs font-bold text-emerald-800 uppercase">Campus Arrival</div>
                <h4 className="text-base font-bold text-slate-900">School gate notification</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Automatic drop-off verification as soon as the vehicle reaches school campus Bay 3.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MORNING & AFTERNOON EXPERIENCE TIMELINE */}
      <section className="py-16 sm:py-24 bg-[#FAFAF9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <ScrollReveal>
            <div className="text-center mb-10 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Daily Routine
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
                A calm, predictable morning & afternoon routine.
              </h2>
              <p className="text-sm text-slate-600">
                Here is what a typical day looks like with TinyRide.
              </p>
            </div>
          </ScrollReveal>

          {/* Tab Selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('morning')}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'morning'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Morning Commute
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('afternoon')}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'afternoon'
                    ? 'bg-white text-emerald-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Afternoon Return
              </button>
            </div>
          </div>

          {/* Timeline Cards */}
          <div className="space-y-4">
            {activeTab === 'morning' ? (
              <>
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-4">
                    <span className="w-12 text-sm font-mono font-bold text-emerald-800">7:25 AM</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Your ride is on the way</h4>
                      <p className="text-xs text-slate-500">Route 04 departs depot • Tracking active</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Depot Cleared
                  </span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-4">
                    <span className="w-12 text-sm font-mono font-bold text-emerald-800">7:32 AM</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Vehicle approaching your stop</h4>
                      <p className="text-xs text-slate-500">500m proximity alert sent to your phone</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    5 Min Alert
                  </span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-4">
                    <span className="w-12 text-sm font-mono font-bold text-emerald-800">7:36 AM</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Tanvik boarded safely</h4>
                      <p className="text-xs text-slate-500">Verified at Gate 2 with SafeKey 482-910</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Boarded
                  </span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-4">
                    <span className="w-12 text-sm font-mono font-bold text-emerald-800">8:04 AM</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Arrived at school</h4>
                      <p className="text-xs text-slate-500">Campus drop-off verified • Bay 3</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    School Arrival
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-4">
                    <span className="w-12 text-sm font-mono font-bold text-emerald-800">2:45 PM</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">School departure</h4>
                      <p className="text-xs text-slate-500">Boarding verified at school bay • Bus departs</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Departed Campus
                  </span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-4">
                    <span className="w-12 text-sm font-mono font-bold text-emerald-800">3:10 PM</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Vehicle en route</h4>
                      <p className="text-xs text-slate-500">Live GPS tracking towards home drop-off</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    In Transit
                  </span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-4">
                    <span className="w-12 text-sm font-mono font-bold text-emerald-800">3:22 PM</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Approaching home</h4>
                      <p className="text-xs text-slate-500">Approaching your gate in 3 minutes</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Near Home
                  </span>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-4">
                    <span className="w-12 text-sm font-mono font-bold text-emerald-800">3:26 PM</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Child arrives safely</h4>
                      <p className="text-xs text-slate-500">Handover completed at your gate</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                    Delivered Home
                  </span>
                </div>
              </>
            )}
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-4">
            Demonstration timeline based on pre-cleared Hyderabad school route timings.
          </p>
        </div>
      </section>

      {/* 7. TRUST & SAFETY SECTION */}
      <section id="safety" className="py-16 sm:py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Safety First
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Designed around the moments parents care about most.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
                Real, verifiable safety features engineered to protect children and eliminate transit stress.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-slate-200 space-y-2.5">
              <h3 className="text-base font-bold text-slate-900">Verified Driver & Vehicle Identification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Parents always know exactly who is behind the wheel. See driver contact details, photo identification, and vehicle license numbers before every trip.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-slate-200 space-y-2.5">
              <h3 className="text-base font-bold text-slate-900">Route Corridor Visibility</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Vehicles operate on pre-approved, geofenced school corridors. Any abnormal deviation or prolonged delay is automatically flagged to school operations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-slate-200 space-y-2.5">
              <h3 className="text-base font-bold text-slate-900">SafeKey Boarding Handshake</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Boarding is authenticated using digital verification tokens, ensuring that the right child boards the right vehicle at the correct scheduled stop.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-slate-200 space-y-2.5">
              <h3 className="text-base font-bold text-slate-900">School Arrival Gate Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Get notified the exact moment the school vehicle clears campus gates, so you know your child has safely transitioned into the care of school staff.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-slate-200 space-y-2.5">
              <h3 className="text-base font-bold text-slate-900">Secure Family Account Access</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Role-based access protects your child’s identity and location. Only authorized guardians linked to the student profile can track active rides.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAFAF9] border border-slate-200 space-y-2.5">
              <h3 className="text-base font-bold text-slate-900">One-Tap Absence Notification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Notify the driver and school with a single tap if your child is unwell. Saves time for the entire route and prevents unnecessary morning calls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PARENT ONBOARDING EXPLANATION */}
      <section id="onboarding" className="py-16 sm:py-24 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Simple Setup
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Getting started takes just a few steps.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
                Setting up your child’s transportation is simple and straightforward.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-left">
            {[
              { num: '1', title: 'Create account', desc: 'Sign up with your mobile number and name.' },
              { num: '2', title: 'Add your child', desc: 'Enter student name, grade, and medical notes.' },
              { num: '3', title: 'Select school', desc: 'Choose your child’s school campus.' },
              { num: '4', title: 'Confirm pickup', desc: 'Set your home stop address & timing.' },
              { num: '5', title: 'Connect route', desc: 'Link to your approved transportation route.' },
              { num: '6', title: 'Start tracking', desc: 'Open the app and track today’s ride live.' },
            ].map((step) => (
              <div key={step.num} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-sm flex items-center justify-center">
                  {step.num}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            Exact setup steps may vary depending on whether your route is school-operated or private operator managed.
          </p>
        </div>
      </section>

      {/* 9. FINAL GET STARTED CONVERSION CTA */}
      <section className="py-16 sm:py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <ScrollReveal yOffset={20}>
            <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-14 lg:p-16 text-center relative overflow-hidden shadow-2xl">
              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  Parent Access
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                  Ready to make school rides simpler?
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Create your TinyRide parent account and get your child’s transportation set up.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={handlePrimaryCta}
                    className="cursor-pointer h-12 min-h-[48px] w-full sm:w-auto px-8 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] active:scale-95 text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <span>Get Started as a Parent</span>
                    <span>→</span>
                  </button>
                  {!isAuth && (
                    <Link
                      href="/parent/login"
                      className="h-12 min-h-[48px] w-full sm:w-auto px-6 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm rounded-xl flex items-center justify-center transition-colors"
                    >
                      Already have an account? Log in
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 10. PARENT FAQ SECTION */}
      <section id="faq" className="py-16 sm:py-24 bg-[#FAFAF9] border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-12 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Help & Answers
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Frequently asked questions.
              </h2>
              <p className="text-sm text-slate-600">
                Common questions parents ask about ride tracking and boarding safety.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {parentFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base min-h-[48px] cursor-pointer hover:bg-slate-50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span
                      className={`text-slate-400 font-normal transition-transform duration-200 text-xl ${
                        isOpen ? 'rotate-45 text-emerald-800' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-150">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div>
              <img
                src="/brand/logo-horizontal.png"
                alt="TinyRide"
                className="h-8 w-auto object-contain mx-auto sm:mx-0"
              />
              <p className="text-slate-500 text-xs mt-2">
                TinyRide for Parents • Little Rides. Big Peace of Mind.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600 font-medium">
              <Link href="/" className="hover:text-emerald-800 transition-colors">
                Main Website
              </Link>
              <Link href="/parent/signup" className="hover:text-emerald-800 transition-colors">
                Parent Sign Up
              </Link>
              <Link href="/parent/login" className="hover:text-emerald-800 transition-colors">
                Parent Login
              </Link>
              <a href="mailto:support@tinyride.in" className="hover:text-emerald-800 transition-colors">
                support@tinyride.in
              </a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} TinyRide by Dodail Solutions Private Limited. All rights reserved.</p>
            <p>Hyderabad, Telangana, India</p>
          </div>
        </div>
      </footer>

      {/* FIXED BOTTOM NAVIGATION BAR FOR MOBILE & TABLET (xl:hidden) */}
      <nav
        aria-label="Parent Page Bottom Navigation"
        className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 sm:px-8 py-2 pb-[calc(10px+env(safe-area-inset-bottom,0px))] flex items-center justify-around sm:justify-center sm:gap-10 shadow-lg"
      >
        <a
          href="#top"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-800 min-h-[44px] justify-center px-2 py-1 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Top</span>
        </a>

        <a
          href="#how-it-works"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-800 min-h-[44px] justify-center px-2 py-1 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Steps</span>
        </a>

        <a
          href="#app-demo"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-emerald-800 min-h-[44px] justify-center px-2 py-1 active:scale-95 transition-transform"
        >
          <span className="relative">
            <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </span>
          <span>Live App</span>
        </a>

        <a
          href="#safety"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-800 min-h-[44px] justify-center px-2 py-1 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Safety</span>
        </a>

        <button
          type="button"
          onClick={handlePrimaryCta}
          className="cursor-pointer ml-1 px-4 py-2 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs min-h-[44px] flex items-center gap-1.5 select-none transition-all"
        >
          <span>{isAuth ? 'App' : 'Sign Up'}</span>
          <span>→</span>
        </button>
      </nav>
    </div>
  );
}
