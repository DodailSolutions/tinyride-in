'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TinyRideIPhone } from '@/components/TinyRideIPhone';
import { TinyRideMobileTrackingApp } from '@/components/TinyRideMobileTrackingApp';
import { isAuthenticatedParent } from '@/lib/parentAuth';
import { DEMO_DATA } from '@/lib/demoData';

// Lightweight, performant Scroll-Reveal Component using native IntersectionObserver
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

export default function TinyRideLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);

  // PWA & Connectivity state
  const [isOnline, setIsOnline] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Parent Auth State
  const [isParentAuth, setIsParentAuth] = useState(false);

  // Journey Stepper state + auto-advance demonstration loop
  const [activeJourneyStep, setActiveJourneyStep] = useState(2); // 0-indexed: 2 = Child boards
  const [userInteractedJourney, setUserInteractedJourney] = useState(false);

  // Parent tab state
  const [activeParentTab, setActiveParentTab] = useState<'status' | 'driver' | 'absence'>('status');

  // Early access form
  const [formData, setFormData] = useState<{
    parentName: string;
    phone: string;
    schoolName: string;
    area: string;
  }>({
    parentName: '',
    phone: '',
    schoolName: DEMO_DATA.schoolName,
    area: 'Gachibowli',
  });

  // Scroll detection for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Connectivity, PWA install prompt listeners, and Parent Auth detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);
    setIsParentAuth(isAuthenticatedParent());
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      try {
        const isDismissed = localStorage.getItem('tinyride_pwa_dismissed');
        if (!isDismissed) {
          setShowInstallBanner(true);
        }
      } catch {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
    } catch {
      // fallback
    }
    setDeferredPrompt(null);
  };

  const handleDismissPWA = () => {
    setShowInstallBanner(false);
    try {
      localStorage.setItem('tinyride_pwa_dismissed', 'true');
    } catch {}
  };

  // Close modal on Escape and prevent body scrolling when modal is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  // Journey auto-advance demonstration loop (pauses if user clicked)
  useEffect(() => {
    if (userInteractedJourney) return;
    const journeyInterval = setInterval(() => {
      setActiveJourneyStep((prev) => (prev + 1) % 5);
    }, 5500);
    return () => clearInterval(journeyInterval);
  }, [userInteractedJourney]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalSuccess(true);
    setTimeout(() => {
      setModalSuccess(false);
      setIsModalOpen(false);
      setFormData({
        parentName: '',
        phone: '',
        schoolName: DEMO_DATA.schoolName,
        area: 'Gachibowli',
      });
    }, 2200);
  };

  const journeySteps = [
    {
      num: '01',
      title: 'Driver starts route',
      time: '07:15 AM',
      description: 'The driver begins the morning run. Route and live vehicle tracking activate automatically.',
      badge: 'Depot Departure',
    },
    {
      num: '02',
      title: 'Approaching your stop',
      time: '07:32 AM',
      description: 'Parents receive an automated alert when the vehicle is 500 meters away — no rushing, no waiting.',
      badge: '5 min away',
    },
    {
      num: '03',
      title: 'Child boards safely',
      time: '07:36 AM',
      description: 'The driver verifies boarding at the stop with SafeKey token 482-910. Instant confirmation on your phone.',
      badge: 'SafeKey Confirmed',
    },
    {
      num: '04',
      title: 'En route to school',
      time: '07:37 – 08:02 AM',
      description: 'Real-time GPS follows the vehicle along its designated path to school with live ETA updates.',
      badge: 'In Transit',
    },
    {
      num: '05',
      title: 'Arrives at campus',
      time: '08:04 AM',
      description: 'Vehicle reaches the campus drop-off bay. Parents and school transport staff receive arrival confirmation.',
      badge: 'School Gate Verified',
    },
  ];

  const currentStep = journeySteps[activeJourneyStep] ?? journeySteps[0]!;
  const parentHref = isParentAuth ? '/parent' : '/parents';

  return (
    <div id="top" className="min-h-screen bg-[#FAFAF9] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden pb-[calc(84px+env(safe-area-inset-bottom,0px))] xl:pb-0">
      
      {/* 1. FIXED MODERN NAVIGATION (ALL DEVICES: DESKTOP + TABLET + MOBILE) */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-xs py-2.5 sm:py-3 border-b border-slate-200/80'
            : 'bg-white/85 backdrop-blur-md py-3 sm:py-3.5 border-b border-slate-200/40'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/brand/logo-horizontal.png"
              alt="TinyRide — School transportation, simplified"
              className="h-8 sm:h-9 md:h-9 lg:h-9.5 w-auto object-contain transition-transform duration-150 group-hover:scale-[1.01]"
            />
          </Link>

          {/* DESKTOP NAV LINKS (>= 1200px, xl:) */}
          <nav className="hidden xl:flex items-center gap-7 text-[13.5px] font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-emerald-800 transition-colors duration-150">
              How It Works
            </a>
            <Link href={parentHref} className="hover:text-emerald-800 transition-colors duration-150">
              For Parents
            </Link>
            <a href="#for-schools" className="hover:text-emerald-800 transition-colors duration-150">
              For Schools
            </a>
            <a href="#for-drivers" className="hover:text-emerald-800 transition-colors duration-150">
              For Drivers
            </a>
            <a href="#trust" className="hover:text-emerald-800 transition-colors duration-150">
              Safety
            </a>
            <a href="#faq" className="hover:text-emerald-800 transition-colors duration-150">
              FAQ
            </a>
          </nav>

          {/* TABLET LANDSCAPE NAV LINKS (1024px – 1199px, lg:flex xl:hidden) */}
          <nav className="hidden lg:flex xl:hidden items-center gap-5 text-[13px] font-medium text-slate-600 whitespace-nowrap">
            <a href="#how-it-works" className="hover:text-emerald-800 transition-colors duration-150">
              How It Works
            </a>
            <Link href={parentHref} className="hover:text-emerald-800 transition-colors duration-150">
              For Parents
            </Link>
            <a href="#for-schools" className="hover:text-emerald-800 transition-colors duration-150">
              For Schools
            </a>
            <a href="#for-drivers" className="hover:text-emerald-800 transition-colors duration-150">
              For Drivers
            </a>
            <a href="#trust" className="hover:text-emerald-800 transition-colors duration-150">
              Safety
            </a>
          </nav>

          {/* RIGHT ACTIONS: TABLET & DESKTOP (>= 1024px) */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <Link
              href={isParentAuth ? '/parent' : '/parent/login'}
              className="cursor-pointer text-xs sm:text-sm font-semibold px-3.5 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors min-h-[44px] flex items-center"
            >
              Log In
            </Link>
            <Link
              href={parentHref}
              className="cursor-pointer text-xs sm:text-sm font-semibold px-5 py-2.5 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] active:scale-[0.98] text-white rounded-xl shadow-xs hover:shadow-md transition-all duration-150 min-h-[44px] inline-flex items-center justify-center btn-micro select-none"
            >
              Get Started
            </Link>
          </div>

          {/* TABLET PORTRAIT (768px – 1023px, md:flex lg:hidden) */}
          <div className="hidden md:flex lg:hidden items-center gap-2.5">
            <Link
              href={isParentAuth ? '/parent' : '/parent/login'}
              className="text-xs font-semibold px-3 py-2 text-slate-700 hover:text-slate-900 rounded-lg min-h-[44px] flex items-center"
            >
              Log In
            </Link>
            <Link
              href={parentHref}
              className="text-xs font-semibold px-4 py-2 bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white rounded-lg shadow-xs min-h-[44px] inline-flex items-center btn-micro"
            >
              Get Started
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* MOBILE CONTROLS (< 768px, md:hidden) */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href={parentHref}
              className="cursor-pointer text-xs font-semibold px-3.5 py-1.5 bg-[#006B2F] text-white rounded-lg shadow-xs active:scale-95 transition-all min-h-[44px] flex items-center"
            >
              Get Started
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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

        {/* DROPDOWN DRAWER (Mobile + Tablet Portrait, < 1024px, lg:hidden) */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-5 pt-3 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-60px)] overflow-y-auto">
            <a
              href="#tracking"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-semibold text-emerald-800 min-h-[44px] flex items-center"
            >
              ● Live Tracking
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-800 min-h-[44px] flex items-center"
            >
              How It Works
            </a>
            <Link
              href={parentHref}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-800 min-h-[44px] flex items-center"
            >
              For Parents
            </Link>
            <a
              href="#for-schools"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-800 min-h-[44px] flex items-center"
            >
              For Schools
            </a>
            <a
              href="#for-drivers"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-800 min-h-[44px] flex items-center"
            >
              For Drivers
            </a>
            <a
              href="#trust"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 text-sm font-medium text-slate-700 hover:text-emerald-800 min-h-[44px] flex items-center"
            >
              Trust & Safety
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
                href={isParentAuth ? '/parent' : '/parent/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="cursor-pointer w-full text-center py-2.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg min-h-[44px] flex items-center justify-center"
              >
                Log In to Parent Portal
              </Link>
              <div className="flex items-center justify-center gap-3 pt-2 text-[11px] text-slate-500">
                <a href="#" className="hover:text-emerald-800">Privacy</a>
                <span>•</span>
                <a href="#" className="hover:text-emerald-800">Terms</a>
                <span>•</span>
                <a href="mailto:support@tinyride.in" className="hover:text-emerald-800">support@tinyride.in</a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* OFFLINE STATUS BANNER */}
      {!isOnline && (
        <div className="fixed top-[52px] sm:top-[60px] left-0 right-0 z-40 bg-amber-500 text-slate-950 px-4 py-2 text-center text-xs font-semibold shadow-md flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-12.728 0m0 0l2.829-2.829m-2.829 2.829L3 21m2.828-5.657a5 5 0 010-7.072m0 0l2.829 2.829" />
          </svg>
          <span>Connection lost • Operating in offline mode. Live vehicle telemetry is paused.</span>
        </div>
      )}

      {/* 2. HERO SECTION — BALANCED TWO-COLUMN RESPONSIVE ARCHITECTURE */}
      <section className="relative pt-24 pb-12 sm:pt-28 sm:pb-16 lg:pt-32 lg:pb-24 overflow-hidden bg-gradient-to-b from-white via-[#FAFAF9] to-[#FAFAF9]">
        {/* Subtle, restrained ambient background road curvature (low opacity to prevent competing with content) */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none">
            <path
              d="M -100 250 C 300 250, 480 650, 900 600 C 1300 550, 1420 300, 1600 350"
              stroke="#CBD5E1"
              strokeWidth="2"
              strokeDasharray="4 6"
            />
            <path
              d="M 100 120 C 500 140, 720 500, 1150 440 C 1350 410, 1520 220, 1680 240"
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-8 lg:gap-12 xl:gap-14 items-center">
            
            {/* LEFT COLUMN (Full width on mobile, 6 cols on md+) */}
            <div className="md:col-span-6 lg:col-span-6 xl:col-span-6 space-y-5 md:space-y-6 text-left">
              {/* Eyebrow: 12-14px, medium/semibold, moderate letter spacing */}
              <div className="animate-staged-2 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-[13px] font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                School transportation, reimagined
              </div>

              {/* EXACTLY ONE H1 ON THE ENTIRE HOMEPAGE */}
              {/* Mobile ~40-48px, line-height 0.95-1.05. Desktop ~64-76px, font-weight 700-800, max-width ~740px */}
              <h1 className="animate-staged-3 text-[2.5rem] sm:text-[2.85rem] md:text-[2.75rem] lg:text-[3.5rem] xl:text-[4.25rem] font-extrabold tracking-tight text-slate-900 leading-[1.02] md:leading-[1.08] max-w-[740px]">
                School rides,<br />
                <span className="text-[#006B2F]">without the worry.</span>
              </h1>

              {/* Supporting Copy: 18-20px desktop, max-width 600-650px, line-height 1.5-1.6 */}
              <p className="animate-staged-4 text-base sm:text-lg lg:text-[19px] text-slate-600 max-w-[620px] font-normal leading-[1.55]">
                See the ride. Know who’s driving. Know when your child boards and arrives at school — all in one simple experience.
              </p>

              {/* CTA Hierarchy: 52-56px height, 150-180px width, clear primary dominance */}
              <div className="animate-staged-5 pt-1 md:pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-3.5">
                <Link
                  href={parentHref}
                  className="inline-flex items-center justify-center gap-2 px-7 h-[54px] min-h-[52px] min-w-[160px] bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] active:scale-[0.98] text-white font-semibold text-sm sm:text-base rounded-xl shadow-xs hover:shadow-md transition-all duration-150 btn-micro group cursor-pointer"
                >
                  <span>Get Started</span>
                  <svg
                    className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-6 h-[54px] min-h-[52px] text-slate-700 bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200/90 text-sm sm:text-base font-semibold rounded-xl transition-all duration-150 btn-micro"
                >
                  See how it works
                </a>
              </div>

              {/* DESKTOP & TABLET TRUST ROW (>= 768px, hidden on mobile) */}
              <div className="animate-staged-7 pt-2 md:pt-3 hidden md:flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-[13px] text-slate-600 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold text-sm">✓</span>
                  Driver information
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold text-sm">✓</span>
                  Live ride updates
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold text-sm">✓</span>
                  Boarding notifications
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN (Product Demonstration) */}
            <div className="md:col-span-6 lg:col-span-6 xl:col-span-6 flex justify-center md:justify-end animate-staged-iphone">
              {/* Mobile Native App View (< 768px, md:hidden) */}
              <div id="tracking" className="w-full block md:hidden pt-2 space-y-4">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold px-1">
                  <span className="text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                    Active Commute Preview
                  </span>
                  <span className="text-emerald-700 flex items-center gap-1 font-bold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Live Telemetry
                  </span>
                </div>
                <TinyRideMobileTrackingApp />

                {/* Mobile Trust Indicators Row (Appears below product on mobile) */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 font-medium text-center">
                  <span className="inline-flex items-center gap-1">
                    <span className="text-emerald-700 font-bold text-sm">✓</span>
                    Driver information
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-emerald-700 font-bold text-sm">✓</span>
                    Live ride updates
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-emerald-700 font-bold text-sm">✓</span>
                    Boarding notifications
                  </span>
                </div>
              </div>

              {/* Tablet & Desktop Authentic iPhone Visual (>= 768px, hidden md:block) */}
              <div className="hidden md:block relative">
                <TinyRideIPhone mode="parent_tracking" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. REFINED TRUST & ECOSYSTEM STRIP */}
      <section className="border-y border-slate-200 bg-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Parents */}
            <ScrollReveal delay={0}>
              <div className="pt-3 md:pt-0 md:px-4 first:pl-0 flex items-center gap-3.5 group">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center text-sm font-bold shrink-0 transition-transform duration-200 group-hover:scale-105">
                  01
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">For Parents</h4>
                  <p className="text-xs text-slate-500">Live visibility, verified driver, and boarding peace of mind</p>
                </div>
              </div>
            </ScrollReveal>

            {/* Schools */}
            <ScrollReveal delay={70}>
              <div className="pt-4 md:pt-0 md:px-4 flex items-center gap-3.5 group">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-sm font-bold shrink-0 transition-transform duration-200 group-hover:scale-105">
                  02
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">For Schools</h4>
                  <p className="text-xs text-slate-500">Complete fleet oversight, gate pacing & bus bay allocation</p>
                </div>
              </div>
            </ScrollReveal>

            {/* Drivers */}
            <ScrollReveal delay={140}>
              <div className="pt-4 md:pt-0 md:px-4 last:pr-0 flex items-center gap-3.5 group">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-sm font-bold shrink-0 transition-transform duration-200 group-hover:scale-105">
                  03
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">For Drivers</h4>
                  <p className="text-xs text-slate-500">Clear stop sequence & zero behind-the-wheel phone calls</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 4. EMOTIONAL PROBLEM SECTION — EDITORIAL STORYTELLING */}
      <section className="py-16 sm:py-24 lg:py-32 bg-[#FAFAF9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 sm:space-y-10">
          <ScrollReveal>
            <div className="space-y-3 sm:space-y-4">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Everyday Uncertainty
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                You shouldn’t have to wonder where the school ride is.
              </h2>
              <p className="text-sm sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Every morning and afternoon, parents experience the same familiar stress. Standing at the gate in the heat, calling uncontactable drivers, and waiting for updates that never come.
              </p>
            </div>
          </ScrollReveal>

          {/* 3 Relatable Questions with Staggered Scroll Reveal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pt-2">
            <ScrollReveal delay={0}>
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 text-left shadow-2xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 h-full">
                <div className="text-emerald-700 text-lg sm:text-xl font-bold mb-2">01</div>
                <p className="text-sm sm:text-base font-semibold text-slate-900 mb-1">
                  “Is the vehicle on the way?”
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Wondering whether the bus is stuck in traffic, running early, or delayed at an earlier stop.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={70}>
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 text-left shadow-2xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 h-full">
                <div className="text-emerald-700 text-lg sm:text-xl font-bold mb-2">02</div>
                <p className="text-sm sm:text-base font-semibold text-slate-900 mb-1">
                  “Has my child boarded?”
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No direct confirmation whether they safely stepped onto the bus or were accidentally missed.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={140}>
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 text-left shadow-2xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 h-full">
                <div className="text-emerald-700 text-lg sm:text-xl font-bold mb-2">03</div>
                <p className="text-sm sm:text-base font-semibold text-slate-900 mb-1">
                  “Did they reach school?”
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Waiting until the evening to know if morning drop-off went smoothly at the campus gate.
                </p>
              </div>
            </ScrollReveal>
          </div>

          {/* Transition */}
          <ScrollReveal delay={180}>
            <div className="pt-4 sm:pt-6 border-t border-slate-200 max-w-xl mx-auto">
              <p className="text-base sm:text-lg font-semibold text-slate-900">
                TinyRide keeps you quietly in the loop.
              </p>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">
                Clear, real-time transportation intelligence that replaces guessing with calm confidence.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. PRODUCT SHOWCASE (DESKTOP IPHONE DISPLAY + MOBILE VALUE CARDS) */}
      <section className="py-16 sm:py-24 lg:py-32 bg-white border-y border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                The TinyRide Parent App
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                Everything you need to know. At a glance.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
                Open the app and see exactly what matters. No guesswork, no phone calls, and no confusing menus.
              </p>
            </div>
          </ScrollReveal>

          {/* DESKTOP SHOWCASE (>= 1200px, xl:grid) */}
          <div className="hidden xl:grid grid-cols-12 gap-10 items-center">
            {/* Left 2 Callouts */}
            <div className="col-span-3 space-y-10">
              <ScrollReveal delay={50}>
                <div className="space-y-2 text-left group">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs transition-transform duration-200 group-hover:scale-105">
                    1
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Live location</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Watch the vehicle move in real time along its verified route with actual traffic-adjusted ETA.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={120}>
                <div className="space-y-2 text-left group">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs transition-transform duration-200 group-hover:scale-105">
                    2
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Child status</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Instant notification the moment your child steps onto the vehicle and SafeKey boarding is confirmed.
                  </p>
                </div>
              </ScrollReveal>
            </div>

            {/* Middle: Authentic iPhone Display */}
            <div className="col-span-6 flex justify-center">
              <ScrollReveal delay={80} yOffset={24}>
                <TinyRideIPhone mode="parent_tracking" />
              </ScrollReveal>
            </div>

            {/* Right 1 Callout + Reassurance */}
            <div className="col-span-3 space-y-10">
              <ScrollReveal delay={160}>
                <div className="space-y-2 text-left group">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs transition-transform duration-200 group-hover:scale-105">
                    3
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Arrival</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Know the exact minute the vehicle passes the campus gates and enters the safe school drop-off bay.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left transition-all duration-200 hover:-translate-y-0.5">
                  <p className="text-xs font-semibold text-slate-800 mb-1">
                    “I no longer have to worry during my morning meetings.”
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Real-time status updates right on your lock screen.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* TABLET PRODUCT SHOWCASE (768px – 1199px, md:grid xl:hidden): TWO-COLUMN BALANCED LAYOUT */}
          <div className="hidden md:grid xl:hidden grid-cols-12 gap-8 items-center">
            {/* Left Column: Product Explanation & 3 Clear Benefits */}
            <div className="col-span-6 space-y-6 text-left">
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 group">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Live vehicle location</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      Watch the vehicle move in real time along its verified route with actual traffic-adjusted ETA.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 group">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">SafeKey boarding handshake</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      Instant notification the moment your child steps onto the vehicle and SafeKey boarding is confirmed.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 group">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Campus gate arrival</h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1">
                      Know the exact minute the vehicle passes the campus gates and enters the safe school drop-off bay.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tablet Reassurance Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
                <p className="text-xs font-semibold text-slate-800">
                  “I no longer have to worry during my morning meetings.”
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real-time status updates right on your tablet and phone lock screen.
                </p>
              </div>
            </div>

            {/* Right Column: Large Authentic iPhone visual */}
            <div className="col-span-6 flex justify-center">
              <TinyRideIPhone mode="parent_tracking" />
            </div>
          </div>

          {/* MOBILE SHOWCASE CARDS (< 768px, md:hidden) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:hidden">
            <div className="bg-[#FAFAF9] p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Live location</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Watch the vehicle move in real time along its verified route with actual traffic-adjusted ETA.
              </p>
            </div>

            <div className="bg-[#FAFAF9] p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Child status</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instant notification the moment your child steps onto the vehicle and SafeKey boarding is confirmed.
              </p>
            </div>

            <div className="bg-[#FAFAF9] p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center justify-center">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Arrival updates</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Know the exact minute the vehicle passes the campus gates and enters the safe school drop-off bay.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. JOURNEY EXPERIENCE — TRANSPORTATION TIMELINE */}
      <section id="how-it-works" className="py-16 sm:py-24 lg:py-32 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Connected Journey
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                From pickup to school, you’re always in the loop.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
                Every milestone is tracked and verified. From the moment the vehicle departs the depot to final school gate handover.
              </p>
            </div>
          </ScrollReveal>

          {/* DESKTOP STEPPER WITH HORIZONTAL LINE (>= 1200px, xl:block) */}
          <div className="hidden xl:block relative mb-10">
            <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-slate-200 -z-0">
              <div
                style={{
                  width: `${(activeJourneyStep / (journeySteps.length - 1)) * 100}%`,
                  transition: 'width 500ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="h-full bg-emerald-600"
              ></div>
            </div>

            <div className="grid grid-cols-5 gap-3 relative z-10">
              {journeySteps.map((step, idx) => (
                <button
                  type="button"
                  key={step.num}
                  onClick={() => {
                    setUserInteractedJourney(true);
                    setActiveJourneyStep(idx);
                  }}
                  className={`text-left p-4 rounded-xl border transition-all duration-300 btn-micro cursor-pointer ${
                    activeJourneyStep === idx
                      ? 'bg-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20 translate-y-[-2px]'
                      : 'bg-white/70 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`font-mono text-xs font-bold transition-colors ${
                        activeJourneyStep === idx ? 'text-emerald-800' : 'text-slate-400'
                      }`}
                    >
                      {step.num}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">{step.time}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{step.title}</h4>
                </button>
              ))}
            </div>
          </div>

          {/* TABLET HORIZONTAL JOURNEY TIMELINE (768px – 1199px, md:block xl:hidden) */}
          <div className="hidden md:block xl:hidden mb-8">
            <div className="overflow-x-auto scrollbar-none pb-2">
              <div className="flex items-center gap-2 min-w-[700px]">
                {journeySteps.map((step, idx) => {
                  const isActive = activeJourneyStep === idx;
                  const isCompleted = activeJourneyStep > idx;
                  return (
                    <React.Fragment key={step.num}>
                      <button
                        type="button"
                        onClick={() => {
                          setUserInteractedJourney(true);
                          setActiveJourneyStep(idx);
                        }}
                        className={`flex-1 text-left p-3.5 rounded-xl border transition-all cursor-pointer min-h-[52px] select-none ${
                          isActive
                            ? 'bg-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                            : isCompleted
                            ? 'bg-white/90 border-emerald-200 text-slate-800'
                            : 'bg-white/60 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-mono text-xs font-bold ${
                              isActive ? 'text-emerald-800' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                          >
                            {step.num}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono font-medium">{step.time}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate">{step.title}</h4>
                        <div className="mt-1 flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-600 animate-pulse' : isCompleted ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          ></span>
                          <span className="text-[10px] text-slate-500 truncate">{step.badge}</span>
                        </div>
                      </button>
                      {idx < journeySteps.length - 1 && (
                        <div className="shrink-0 text-slate-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* MOBILE COMPACT VERTICAL TIMELINE (< 768px, md:hidden) */}
          <div className="block md:hidden mb-6 space-y-2.5">
            {journeySteps.map((step, idx) => (
              <div
                key={step.num}
                onClick={() => setActiveJourneyStep(idx)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  activeJourneyStep === idx
                    ? 'bg-white border-emerald-600 shadow-xs ring-1 ring-emerald-500/30'
                    : 'bg-white/80 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                        activeJourneyStep === idx
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {step.num}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                  </div>
                  <span className="text-xs font-mono font-medium text-slate-500">{step.time}</span>
                </div>
                {activeJourneyStep === idx && (
                  <p className="mt-2 text-xs text-slate-600 pl-8 leading-relaxed animate-in fade-in duration-200">
                    {step.description}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* ACTIVE MILESTONE DEEP-DIVE & NOTIFICATION PREVIEW */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-xs transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
              <div className="md:col-span-7 space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  <span className="font-mono">{currentStep.num}</span>
                  <span>•</span>
                  <span>{currentStep.badge}</span>
                </div>
                <h3 className="text-xl sm:text-3xl font-bold text-slate-900 transition-all duration-200">
                  {currentStep.title}
                </h3>
                <p className="text-xs sm:text-base text-slate-600 leading-relaxed transition-all duration-200">
                  {currentStep.description}
                </p>
                <div className="pt-1 flex items-center gap-3 text-xs font-medium text-slate-500">
                  <span>Timestamp: <strong className="text-slate-800">{currentStep.time}</strong></span>
                  <span>•</span>
                  <span>Status: <strong className="text-emerald-800">Verified by TinyRide</strong></span>
                </div>
              </div>

              <div className="md:col-span-5 bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-200/80 space-y-2.5">
                <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Notification Preview
                </div>
                <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                      <img src="/brand/logo-wordmark.png" alt="" className="h-3 w-auto" />
                      TinyRide
                    </span>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 transition-opacity duration-200">
                    {activeJourneyStep === 0 && `Driver ${DEMO_DATA.driverFirstName} has started morning route ${DEMO_DATA.vehicleShortId}.`}
                    {activeJourneyStep === 1 && `${DEMO_DATA.vehicleShortId} is 500m away. Please proceed to the pickup gate.`}
                    {activeJourneyStep === 2 && `${DEMO_DATA.childFirstName} has safely boarded ${DEMO_DATA.vehicleShortId}. SafeKey token confirmed.`}
                    {activeJourneyStep === 3 && `${DEMO_DATA.vehicleShortId} is on Jubilee Hills Road No. 36. Speed: 34 km/h.`}
                    {activeJourneyStep === 4 && `${DEMO_DATA.vehicleShortId} has arrived at ${DEMO_DATA.schoolName} Bay 3.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PARENT EXPERIENCE — PEACE OF MIND (BALANCED TWO-COLUMN ON TABLET) */}
      <section id="for-parents" className="py-16 sm:py-24 lg:py-32 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="md:col-span-6 space-y-5 sm:space-y-6">
              <ScrollReveal>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                  Parent Simplicity
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight mt-2">
                  For parents, peace of mind in one simple view.
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mt-3">
                  From morning pickup to afternoon drop-off, TinyRide keeps you quietly informed. No clutter, no confusing options, and zero unnecessary calls.
                </p>
              </ScrollReveal>

              {/* 5 Clean Editorial Points */}
              <ul className="space-y-3 pt-1">
                {[
                  'Know when the ride is approaching your home with exact arrival times.',
                  'Know who is driving and verify their credentials, photo, and vehicle plate.',
                  'Watch the vehicle move along the approved school route in real time.',
                  'Receive instant confirmation the minute your child boards safely.',
                  'Get notified the moment the vehicle arrives at the campus drop-off gate.',
                ].map((item, idx) => (
                  <ScrollReveal key={idx} delay={idx * 50}>
                    <li className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  </ScrollReveal>
                ))}
              </ul>

              <div className="pt-2">
                <Link
                  href={parentHref}
                  className="cursor-pointer h-12 min-h-[48px] w-full sm:w-auto px-6 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] active:scale-95 text-white text-sm font-semibold rounded-xl shadow-xs btn-micro inline-flex items-center justify-center gap-2"
                >
                  <span>Explore TinyRide for Parents</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Right: Parent App Feature Tabs Mock */}
            <div className="md:col-span-6 bg-slate-50 rounded-2xl p-5 sm:p-7 md:p-8 border border-slate-200">
              {/* Tab Selector (touch targets >= 44px) */}
              <div className="flex border-b border-slate-200 mb-5 gap-3 md:gap-4 text-xs font-semibold relative overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveParentTab('status')}
                  className={`pb-3 pt-1 px-1 transition-colors shrink-0 cursor-pointer min-h-[44px] flex items-center ${
                    activeParentTab === 'status'
                      ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Live Status
                </button>
                <button
                  type="button"
                  onClick={() => setActiveParentTab('driver')}
                  className={`pb-3 pt-1 px-1 transition-colors shrink-0 cursor-pointer min-h-[44px] flex items-center ${
                    activeParentTab === 'driver'
                      ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Verified Driver
                </button>
                <button
                  type="button"
                  onClick={() => setActiveParentTab('absence')}
                  className={`pb-3 pt-1 px-1 transition-colors shrink-0 cursor-pointer min-h-[44px] flex items-center ${
                    activeParentTab === 'absence'
                      ? 'border-b-2 border-emerald-700 text-emerald-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  One-Tap Absence
                </button>
              </div>

              {/* Tab Content Display */}
              <div className="transition-all duration-300">
                {activeParentTab === 'status' && (
                  <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 space-y-4 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-500">Child Commute</p>
                        <h4 className="font-bold text-slate-900 text-sm">{DEMO_DATA.childFirstName} — Morning School Trip</h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        IN TRANSIT
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Pickup Gate:</span>
                        <strong className="text-slate-900">Gate 2 (Completed 7:36 AM)</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>School Arrival:</span>
                        <strong className="text-slate-900">Estimated 8:04 AM</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Assigned Vehicle:</span>
                        <strong className="text-slate-900">{DEMO_DATA.vehicleShortId} ({DEMO_DATA.vehiclePlate})</strong>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Push notifications are dispatched at every stage automatically.
                    </p>
                  </div>
                )}

                {activeParentTab === 'driver' && (
                  <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-sm">
                        {DEMO_DATA.driverInitials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-sm">{DEMO_DATA.driverName}</h4>
                          <span className="text-emerald-700 font-bold text-xs" title="Verified Driver">✓ Verified</span>
                        </div>
                        <p className="text-xs text-slate-500">Assigned Driver • 6 Years Safe Driving</p>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Vehicle Model:</span>
                        <strong className="text-slate-900">{DEMO_DATA.vehicleModel}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Registration:</span>
                        <strong className="text-slate-900">{DEMO_DATA.vehiclePlate}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>School Route:</span>
                        <strong className="text-slate-900">{DEMO_DATA.routeNumber} ({DEMO_DATA.schoolName})</strong>
                      </div>
                    </div>
                  </div>
                )}

                {activeParentTab === 'absence' && (
                  <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 space-y-4 animate-in fade-in duration-200">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Child Not Attending School Today?</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Inform the driver and school with a single tap. The driver won’t wait outside your gate, keeping the route punctual for all children.
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg flex items-center justify-between text-xs text-amber-900 font-medium">
                      <span>Mark {DEMO_DATA.childFirstName} as absent for today?</span>
                      <button className="cursor-pointer px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] btn-micro">
                        Notify Driver
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SCHOOL EXPERIENCE — OPERATIONAL CONTROL (ALTERNATING DIRECTION ON TABLET) */}
      <section id="for-schools" className="py-16 sm:py-24 lg:py-32 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Operational UI Mock (Left on Tablet & Desktop) */}
            <div className="md:col-span-7 bg-white rounded-2xl p-5 sm:p-7 md:p-8 border border-slate-200 shadow-sm space-y-5 sm:space-y-6 order-2 md:order-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    School Transport Dashboard
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">Olive Mount Campus Bay</h3>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 text-[11px] sm:text-xs font-bold flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  14 / 14 ACTIVE ROUTES
                </span>
              </div>

              {/* Metric Counters Strip */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] sm:text-[11px] text-slate-500">Students in Transit</span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">428</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] sm:text-[11px] text-slate-500">Active Vehicles</span>
                  <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">14</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] sm:text-[11px] text-slate-500">Delayed Routes</span>
                  <div className="text-lg sm:text-xl font-bold text-emerald-700 mt-0.5">0</div>
                </div>
              </div>

              {/* Bus Bay Status Table (Touch-friendly 48px rows) */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto scrollbar-none text-xs">
                <div className="bg-slate-50 px-3.5 sm:px-4 py-2.5 font-bold text-slate-700 border-b border-slate-200 flex justify-between min-w-[340px]">
                  <span>Route & Vehicle</span>
                  <span>Status</span>
                  <span>ETA</span>
                </div>
                {[
                  { route: 'Route 01 — Jubilee Hills', veh: 'TS09-TR-101', driver: 'Mahesh B.', status: 'Arrived Bay 1', eta: '08:02 AM', statusColor: 'text-emerald-700 bg-emerald-50' },
                  { route: 'Route 04 — Madhapur', veh: 'TS09-TR-102', driver: 'Ravi Kumar', status: 'En Route (2 km)', eta: '08:05 AM', statusColor: 'text-blue-700 bg-blue-50' },
                  { route: 'Route 07 — Gachibowli', veh: 'TS09-TR-105', driver: 'Srinivas R.', status: 'En Route (4 km)', eta: '08:09 AM', statusColor: 'text-blue-700 bg-blue-50' },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="px-3.5 sm:px-4 py-3.5 border-b border-slate-100 last:border-0 flex justify-between items-center hover:bg-slate-50/80 active:bg-slate-100 transition-colors min-h-[48px] min-w-[340px]"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 text-xs sm:text-sm">{row.route}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{row.veh} • {row.driver}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 mx-2 ${row.statusColor}`}>
                      {row.status}
                    </span>
                    <div className="font-mono text-slate-700 font-semibold text-xs shrink-0">{row.eta}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Editorial Copy */}
            <div className="md:col-span-5 space-y-4 sm:space-y-6 order-1 md:order-2">
              <ScrollReveal>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                  School Transport Oversight
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight mt-2">
                  For schools, transportation becomes easier to see.
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mt-3">
                  School administrators and transport managers gain immediate, end-to-end visibility of every vehicle, route, and child. Coordinate drop-offs, reduce gate congestion, and communicate instantly with parents.
                </p>
              </ScrollReveal>

              <div className="space-y-2.5 pt-1 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-700 font-bold shrink-0 mt-0.5">✓</span>
                  <span><strong>Complete transport visibility:</strong> Monitor all routes simultaneously from a single central map.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-700 font-bold shrink-0 mt-0.5">✓</span>
                  <span><strong>Gate & bay coordination:</strong> Eliminate morning bottleneck delays with scheduled arrival pacing.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-700 font-bold shrink-0 mt-0.5">✓</span>
                  <span><strong>Fewer front-desk inquiries:</strong> When parents have real-time tracking, repetitive phone calls drop.</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="cursor-pointer h-12 min-h-[48px] w-full sm:w-auto px-6 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-xs btn-micro flex items-center justify-center"
                >
                  Explore TinyRide for Schools
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. DRIVER EXPERIENCE — TABLET & DESKTOP PRESENTATION */}
      <section id="for-drivers" className="py-16 sm:py-24 lg:py-32 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Copy */}
            <div className="md:col-span-6 space-y-4 sm:space-y-6">
              <ScrollReveal>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                  Driver Focused
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight mt-2">
                  For drivers, the job stays simple.
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mt-3">
                  No complex menus. No phone calls while driving. Just clear stops and one-tap boarding. TinyRide is engineered for safety and distraction-free operation.
                </p>
              </ScrollReveal>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors">
                  <h4 className="font-bold text-sm text-slate-900">One-Tap Boarding</h4>
                  <p className="text-xs text-slate-500 mt-1">Confirm boarding instantly with a single large tap.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors">
                  <h4 className="font-bold text-sm text-slate-900">Clear Route Sequence</h4>
                  <p className="text-xs text-slate-500 mt-1">Sequential stops with student names and gate locations.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors">
                  <h4 className="font-bold text-sm text-slate-900">Zero In-Cab Clutter</h4>
                  <p className="text-xs text-slate-500 mt-1">High-contrast night & daylight readability.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors">
                  <h4 className="font-bold text-sm text-slate-900">Automated Parent Alerts</h4>
                  <p className="text-xs text-slate-500 mt-1">Parents alerted 500m before arrival without calls.</p>
                </div>
              </div>
            </div>

            {/* Right: Driver Viewport (Tablet & Desktop iPhone vs Mobile In-Cab Card) */}
            <div className="md:col-span-6 flex justify-center">
              {/* Tablet & Desktop iPhone Mode (>= 768px, md:block) */}
              <div className="hidden md:block">
                <ScrollReveal delay={80}>
                  <TinyRideIPhone mode="driver" />
                </ScrollReveal>
              </div>

              {/* Mobile Native Driver Mode Card (< 768px, md:hidden) */}
              <div className="block md:hidden w-full max-w-sm bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Driver In-Cab Mode</span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-mono text-[10px] font-bold">
                    ROUTE 04
                  </span>
                </div>

                <div className="mt-4 bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Next Scheduled Stop</span>
                  <h4 className="font-bold text-base text-white">Rainbow Vistas Gate 2</h4>
                  <p className="text-xs text-slate-400">Student: {DEMO_DATA.childName} (Grade 3A)</p>
                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-slate-400">SafeKey Token:</span>
                    <strong className="font-mono text-emerald-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                      482-910
                    </strong>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="cursor-pointer w-full h-12 bg-[#006B2F] active:bg-[#00441d] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-xs"
                  >
                    ✓ Confirm SafeKey Boarding
                  </button>
                  <p className="text-[10px] text-center text-slate-500 mt-2">
                    Large touch target for safe, stationary stop confirmation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. TRUST & TRANSPARENCY SECTION — CALM EDITORIAL SEQUENCE */}
      <section id="trust" className="py-16 sm:py-24 lg:py-32 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Information Transparency
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                Built around the journey that matters.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
                Real reassurance comes from verified facts, not inflated promises. A calm, transparent sequence from door to campus.
              </p>
            </div>
          </ScrollReveal>

          {/* Calm Linear Editorial Sequence */}
          <div className="max-w-4xl mx-auto space-y-3.5 sm:space-y-4">
            {[
              {
                step: '01',
                title: 'Verified Driver Identity',
                desc: 'Every driver undergoes strict background checks, commercial license validation, and photo verification. Parents see their driver details in advance.',
                badge: 'Screened & Approved',
              },
              {
                step: '02',
                title: 'Assigned Vehicle Details',
                desc: 'Clear registration plate, vehicle model, fitness certification, and capacity details are assigned to each route before departure.',
                badge: 'Fleet Verified',
              },
              {
                step: '03',
                title: 'Approved Route Geometry',
                desc: 'Vehicles travel exclusively on pre-mapped school transport corridors. Any unexpected deviations are immediately flagged to operations.',
                badge: 'Geo-Monitored',
              },
              {
                step: '04',
                title: 'SafeKey Boarding Confirmation',
                desc: 'A physical student check-in with digital SafeKey validation ensures no child is left behind or boards the wrong vehicle.',
                badge: 'SafeKey Handshake',
              },
              {
                step: '05',
                title: 'Campus Gate Drop-off',
                desc: 'Arrival at the school bus bay is recorded and timestamped. Both parents and school staff receive immediate arrival notifications.',
                badge: 'Campus Bay Verified',
              },
            ].map((item, idx) => (
              <ScrollReveal key={item.step} delay={idx * 60}>
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all duration-200 hover:border-slate-300 hover:shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <span className="font-mono text-emerald-800 font-bold text-sm sm:text-base shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900">{item.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 self-start sm:self-center">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                      {item.badge}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FREQUENTLY ASKED QUESTIONS — ACCESSIBLE & SEO-READY */}
      <section id="faq" className="py-16 sm:py-24 lg:py-32 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Common Questions
              </span>
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                Frequently asked questions.
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Clear answers about how TinyRide connects parents, schools, and drivers for safe daily school rides.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-3 sm:space-y-4">
            {[
              {
                q: 'What is TinyRide?',
                a: 'TinyRide is a dedicated school transportation platform connecting parents, schools, and drivers. It provides live vehicle tracking, verified driver details, SafeKey boarding verification, and automated arrival alerts for safe, predictable daily school commutes.',
              },
              {
                q: 'How does TinyRide track school rides?',
                a: 'TinyRide uses high-precision vehicle GPS telemetry combined with pre-approved school route corridors to calculate real-time, traffic-adjusted arrival times without requiring driver interaction while on the road.',
              },
              {
                q: 'Can parents see where the school vehicle is in real time?',
                a: "Yes. Parents can open the TinyRide parent app at any time during an active trip to see the vehicle's exact position along the route, current speed, and minute-by-minute estimated arrival time.",
              },
              {
                q: 'How do parents know when their child boards the vehicle?',
                a: "At each designated pickup stop, the driver confirms boarding using the student's unique SafeKey verification token. Parents receive an immediate lock-screen confirmation as soon as their child is safely on board.",
              },
              {
                q: 'Can schools manage school transportation with TinyRide?',
                a: 'Yes. Schools use the TinyRide school dashboard to monitor all active routes simultaneously, coordinate bus bay drop-offs to prevent gate congestion, and review student transit safety in real time.',
              },
              {
                q: 'How does TinyRide work for drivers without causing distractions?',
                a: 'The TinyRide driver interface features high-contrast, oversized touch targets with a sequential stop list. Boarding is confirmed with a single tap, automated proximity alerts are dispatched to parents 500 meters in advance, and incoming calls are completely eliminated while driving.',
              },
            ].map((faq, idx) => (
              <ScrollReveal key={idx} delay={idx * 40}>
                <details className="group bg-[#FAFAF9] rounded-2xl border border-slate-200/90 shadow-2xs open:bg-white open:shadow-xs transition-all duration-200 overflow-hidden">
                  <summary className="cursor-pointer p-4 sm:p-5 md:p-6 min-h-[48px] flex items-center justify-between text-sm sm:text-base font-bold text-slate-900 list-none select-none hover:text-emerald-800 transition-colors">
                    <span>{faq.q}</span>
                    <span className="ml-4 w-6 h-6 rounded-full bg-slate-200/70 group-open:bg-emerald-50 text-slate-600 group-open:text-emerald-700 flex items-center justify-center text-xs font-bold transition-transform duration-200 group-open:rotate-180 shrink-0">
                      ▼
                    </span>
                  </summary>
                  <div className="px-4 sm:px-5 md:px-6 pb-5 sm:pb-6 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 mt-1">
                    {faq.a}
                  </div>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 12. FINAL CONVERSION CTA — PREMIUM DARK SECTION */}
      <section id="get-started" className="py-16 sm:py-24 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <ScrollReveal yOffset={20}>
            <div className="bg-slate-950 text-white rounded-3xl p-7 sm:p-14 lg:p-20 text-center relative overflow-hidden shadow-2xl">
              {/* Subtle background route glow line */}
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 1000 400" fill="none">
                  <path
                    d="M-100 200 Q400 100 600 300 T1100 200"
                    stroke="#34D399"
                    strokeWidth="4"
                    strokeDasharray="8 8"
                  />
                </svg>
              </div>

              <div className="relative z-10 max-w-2xl mx-auto space-y-5 sm:space-y-6">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  Start Today
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                  A simpler school ride starts here.
                </h2>
                <p className="text-sm sm:text-lg text-slate-300 leading-relaxed">
                  One connected experience for parents, schools and drivers. Less guessing, better visibility, and complete peace of mind.
                </p>

                <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="cursor-pointer h-12 min-h-[48px] w-full sm:w-auto px-8 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] active:scale-95 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow-md btn-micro flex items-center justify-center"
                  >
                    Get Started
                  </button>
                  <a
                    href="#for-schools"
                    className="h-12 min-h-[48px] w-full sm:w-auto px-7 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 active:scale-95 text-slate-200 border border-slate-700 font-semibold text-sm rounded-xl btn-micro flex items-center justify-center"
                  >
                    Talk to Your School
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 13. FOOTER (DESKTOP ONLY: >= 1200px, hidden on mobile/tablet) */}
      <footer className="hidden xl:block border-t border-slate-200 bg-white py-12 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand column */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <img
                src="/brand/logo-horizontal.png"
                alt="TinyRide — School transportation and live ride tracking"
                className="h-8 w-auto object-contain"
              />
              <p className="text-slate-500 text-xs leading-relaxed">
                Little Rides. Big Peace of Mind.
              </p>
              <p className="text-slate-400 text-[11px]">
                Dodail Solutions Private Limited<br />
                Hyderabad, Telangana, India
              </p>
            </div>

            {/* Product Links */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Product</h5>
              <ul className="space-y-1.5">
                <li><a href="#how-it-works" className="hover:text-emerald-800 transition-colors">How It Works</a></li>
                <li><Link href={parentHref} className="hover:text-emerald-800 transition-colors">For Parents</Link></li>
                <li><a href="#for-schools" className="hover:text-emerald-800 transition-colors">For Schools</a></li>
                <li><a href="#for-drivers" className="hover:text-emerald-800 transition-colors">For Drivers</a></li>
                <li><a href="#trust" className="hover:text-emerald-800 transition-colors">Trust & Safety</a></li>
                <li><a href="#faq" className="hover:text-emerald-800 transition-colors">FAQ</a></li>
              </ul>
            </div>

            {/* Portals */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Portals</h5>
              <ul className="space-y-1.5">
                <li><Link href="/ops" className="hover:text-emerald-800 transition-colors">Operations Portal</Link></li>
                <li><Link href="/trips" className="hover:text-emerald-800 transition-colors">Live Dispatch</Link></li>
                <li><Link href="/kyc" className="hover:text-emerald-800 transition-colors">Driver Verification</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Support</h5>
              <p className="text-slate-500">Available Monday to Saturday for schools & parents.</p>
              <p className="font-semibold text-slate-900">support@tinyride.in</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-400">
            <p>© {new Date().getFullYear()} TinyRide by Dodail Solutions Private Limited. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Hyderabad, IN</a>
            </div>
          </div>
        </div>
      </footer>

      {/* 13B. COMPACT LEGAL STRIP (MOBILE & TABLET ONLY: xl:hidden) */}
      <div className="xl:hidden border-t border-slate-200 bg-white/70 py-6 px-4 text-center text-xs text-slate-500 space-y-2">
        <p>© {new Date().getFullYear()} TinyRide by Dodail Solutions Private Limited. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-600 font-medium">
          <a href="#" className="hover:text-emerald-800 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-emerald-800 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="mailto:support@tinyride.in" className="hover:text-emerald-800 transition-colors">support@tinyride.in</a>
        </div>
      </div>

      {/* 14. FIXED BOTTOM NAVIGATION BAR (MOBILE & TABLET: xl:hidden) */}
      <nav
        aria-label="Mobile and Tablet Bottom Navigation"
        className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-3 sm:px-8 py-2 pb-[calc(10px+env(safe-area-inset-bottom,0px))] flex items-center justify-around sm:justify-center sm:gap-10 shadow-lg"
      >
        <a
          href="#top"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-800 min-h-[44px] justify-center px-2 py-1 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Home</span>
        </a>

        <a
          href="#tracking"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-emerald-800 min-h-[44px] justify-center px-2 py-1 active:scale-95 transition-transform"
        >
          <span className="relative">
            <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </span>
          <span>Live Ride</span>
        </a>

        <a
          href="#how-it-works"
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-800 min-h-[44px] justify-center px-2 py-1 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Journey</span>
        </a>

        <Link
          href={parentHref}
          className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-800 min-h-[44px] justify-center px-2 py-1 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>Parents</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer ml-1 px-4 py-2 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs min-h-[44px] flex items-center gap-1.5 select-none transition-all"
        >
          <span>Join</span>
          <span>→</span>
        </button>
      </nav>

      {/* PWA INSTALL BANNER */}
      {showInstallBanner && deferredPrompt && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700/60 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <img src="/icons/icon-192x192.png" alt="TinyRide" className="w-10 h-10 rounded-xl shadow-xs shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white">Install TinyRide App</h4>
              <p className="text-xs text-slate-300 mt-0.5">Add to home screen for instant school ride tracking and offline updates.</p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleInstallPWA}
                  className="px-3.5 py-1.5 bg-[#006B2F] hover:bg-[#005525] text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 min-h-[36px]"
                >
                  Install Now
                </button>
                <button
                  type="button"
                  onClick={handleDismissPWA}
                  className="px-3 py-1.5 text-slate-400 hover:text-white text-xs font-medium transition-colors min-h-[36px]"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissPWA}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Dismiss install banner"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 15. INTERACTIVE "GET STARTED" MODAL */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="cursor-pointer absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close modal"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {modalSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold mx-auto">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-slate-900">You’re on the list!</h3>
                <p className="text-xs text-slate-600">
                  Thank you, <strong>{formData.parentName || 'Parent'}</strong>. We will notify you as soon as TinyRide is live at {formData.schoolName}.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-5 space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                    Early Access
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Get Started with TinyRide</h3>
                  <p className="text-xs text-slate-500">
                    Register your school route for early access in Hyderabad.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Parent Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Radhika Sharma"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">WhatsApp / Phone Number</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Child’s School</label>
                    <select
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-xs bg-white"
                    >
                      <option value={DEMO_DATA.schoolName}>{DEMO_DATA.schoolName}, Gachibowli</option>
                      <option value="Delhi Public School">Delhi Public School (DPS), Khajaguda</option>
                      <option value="Chirec International School">Chirec International School, Kondapur</option>
                      <option value="Silver Oaks International">Silver Oaks International School, Bachupally</option>
                      <option value="The Hyderabad Public School">The Hyderabad Public School, Begumpet</option>
                      <option value="Other School">Other Hyderabad School</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Residential Area</label>
                    <select
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-xs bg-white"
                    >
                      <option value="Gachibowli">Gachibowli / Financial District</option>
                      <option value="Jubilee Hills">Jubilee Hills / Banjara Hills</option>
                      <option value="Madhapur">Madhapur / Hitec City</option>
                      <option value="Kondapur">Kondapur / Hafeezpet</option>
                      <option value="Manikonda">Manikonda / Narsingi</option>
                      <option value="Kukatpally">Kukatpally / Miyapur</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="cursor-pointer w-full py-3 bg-[#006B2F] hover:bg-[#005525] text-white font-bold text-xs rounded-lg shadow-sm btn-micro mt-2"
                  >
                    Request Early Access
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
