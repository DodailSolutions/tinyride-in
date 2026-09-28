'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  MapPin,
  Navigation,
  ChevronDown,
  Bus,
  CheckCircle2,
  KeyRound,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { isAuthenticatedParent } from '@/lib/parentAuth';

// Hook for prefers-reduced-motion
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
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: reducedMotion ? '0ms' : '650ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}ms`,
        transform: isVisible || reducedMotion ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.99)',
        opacity: isVisible || reducedMotion ? 1 : 0,
      }}
      className={`transition-all ${className}`}
    >
      {children}
    </div>
  );
}

// Animated ETA Display with smooth vertical slide
function AnimatedEta({ minutes }: { minutes: number }) {
  const [prevMinutes, setPrevMinutes] = useState(minutes);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (minutes === prevMinutes) return;
    setAnimating(true);
    const timer = setTimeout(() => {
      setPrevMinutes(minutes);
      setAnimating(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [minutes, prevMinutes]);

  return (
    <div className="inline-flex items-baseline gap-1 overflow-hidden h-7">
      <span
        className={`text-2xl font-black tracking-tight text-slate-900 transition-all duration-250 ${
          animating ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        {minutes}
      </span>
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">min</span>
    </div>
  );
}

export default function ParentsLandingPage() {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'morning' | 'afternoon'>('morning');

  // Hero entrance staggered animation states
  const [heroMounted, setHeroMounted] = useState(false);

  // Live Vehicle Animation along route geometry using requestAnimationFrame
  const [progress, setProgress] = useState(38); // 0 to 100%
  const [vehicleRotation, setVehicleRotation] = useState(0); // degrees
  const [currentEta, setCurrentEta] = useState(11);
  const [tripPhase, setTripPhase] = useState<'Driver started' | 'Approaching pickup' | 'Arrived at pickup' | 'Child boarded' | 'En route to school' | 'Arrived at school'>('Approaching pickup');

  // Curve geometry calculation: S-curve from (40, 220) to (540, 100)
  // Waypoint coordinate calculation for realistic vector tracking
  const getRouteCoordinates = (p: number) => {
    const t = Math.max(0, Math.min(1, p / 100));
    // Cubic bezier interpolation: P0(40,210), P1(180,240), P2(320,60), P3(540,110)
    const x =
      Math.pow(1 - t, 3) * 40 +
      3 * Math.pow(1 - t, 2) * t * 180 +
      3 * (1 - t) * Math.pow(t, 2) * 320 +
      Math.pow(t, 3) * 540;
    const y =
      Math.pow(1 - t, 3) * 210 +
      3 * Math.pow(1 - t, 2) * t * 240 +
      3 * (1 - t) * Math.pow(t, 2) * 60 +
      Math.pow(t, 3) * 110;

    // Tangent derivative for rotation
    const dx =
      3 * Math.pow(1 - t, 2) * (180 - 40) +
      6 * (1 - t) * t * (320 - 180) +
      3 * Math.pow(t, 2) * (540 - 320);
    const dy =
      3 * Math.pow(1 - t, 2) * (240 - 210) +
      6 * (1 - t) * t * (60 - 240) +
      3 * Math.pow(t, 2) * (110 - 60);

    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return { x, y, angle };
  };

  useEffect(() => {
    setIsAuth(isAuthenticatedParent());
    setHeroMounted(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Continuous smooth requestAnimationFrame route movement
  useEffect(() => {
    if (reducedMotion) {
      setProgress(46);
      setVehicleRotation(12);
      setCurrentEta(9);
      setTripPhase('Approaching pickup');
      return;
    }

    let animationFrameId: number;
    let lastTimestamp = performance.now();
    let currentP = 20;

    const animate = (now: number) => {
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      // Speed: completes loop in ~28 seconds
      currentP += delta * 3.4;
      if (currentP > 96) {
        currentP = 12; // loop back seamlessly
      }

      setProgress(currentP);

      const { angle } = getRouteCoordinates(currentP);
      setVehicleRotation(angle);

      // Dynamic phase changes
      if (currentP < 24) {
        setTripPhase('Driver started');
        setCurrentEta(14);
      } else if (currentP < 46) {
        setTripPhase('Approaching pickup');
        setCurrentEta(Math.max(4, Math.round(((46 - currentP) / 22) * 12)));
      } else if (currentP < 54) {
        setTripPhase('Arrived at pickup');
        setCurrentEta(0);
      } else if (currentP < 60) {
        setTripPhase('Child boarded');
        setCurrentEta(18);
      } else if (currentP < 90) {
        setTripPhase('En route to school');
        setCurrentEta(Math.max(2, Math.round(((92 - currentP) / 32) * 16)));
      } else {
        setTripPhase('Arrived at school');
        setCurrentEta(0);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [reducedMotion]);

  const handlePrimaryCta = () => {
    if (isAuth) {
      router.push('/parent');
    } else {
      router.push('/parent/signup');
    }
  };

  const coords = getRouteCoordinates(progress);

  // Visible FAQ dataset matching verified features
  const parentFaqs = [
    {
      q: 'What is TinyRide?',
      a: 'TinyRide is a dedicated school transportation platform that connects parents, schools, and drivers to provide live vehicle tracking, SafeKey boarding verification, and automated arrival notifications.',
    },
    {
      q: 'How does TinyRide track school rides?',
      a: 'TinyRide uses high-precision GPS telemetry coupled with pre-approved school route corridors to calculate real-time, traffic-adjusted arrival times without requiring driver interaction while driving.',
    },
    {
      q: 'Can parents see where the school vehicle is?',
      a: 'Yes. Once a trip begins, open the TinyRide parent app to see the vehicle’s live position on the route map, current speed, and minute-by-minute estimated arrival time.',
    },
    {
      q: 'How do parents know when their child boards?',
      a: 'At your designated pickup stop, the attendant or driver scans your student’s unique SafeKey token. You receive an instant lock-screen notification confirming your child is safely on board.',
    },
    {
      q: 'Can parents see the driver and vehicle?',
      a: 'Yes. Your parent app clearly displays your assigned driver’s name, photo, direct phone number, vehicle model, and license plate number.',
    },
    {
      q: 'How do parents know when their child reaches school?',
      a: 'When the vehicle enters the school campus drop-off bay, the system logs the arrival and sends an immediate push notification confirming your child has safely reached school.',
    },
    {
      q: 'How do I get started with TinyRide?',
      a: 'Getting started takes just a few steps: verify your phone number, add your child and school details, confirm your pickup location, and connect with your school’s transport route.',
    },
  ];

  // Schema.org JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://tinyride.in/#organization',
        name: 'TinyRide',
        url: 'https://tinyride.in',
        logo: 'https://tinyride.in/brand/logo-horizontal.png',
        sameAs: ['https://twitter.com/tinyride_in'],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://tinyride.in/#website',
        url: 'https://tinyride.in',
        name: 'TinyRide',
        publisher: { '@id': 'https://tinyride.in/#organization' },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'TinyRide for Parents',
        applicationCategory: 'TransportationApplication',
        operatingSystem: 'Web, iOS, Android',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://tinyride.in',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'For Parents',
            item: 'https://tinyride.in/parents',
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: parentFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* Schema.org JSON-LD Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ========================================================
          1. FIXED PARENT HEADER (ALL SCREENS)
      ======================================================== */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-xs py-2.5 sm:py-3 border-b border-slate-200/80'
            : 'bg-white/90 backdrop-blur-md py-3 sm:py-3.5 border-b border-slate-200/60'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 flex items-center justify-between">
          {/* Logo & Category Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <img
                src="/brand/logo-horizontal.png"
                alt="TinyRide — School transportation and live ride tracking"
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 text-[11px] font-bold border border-emerald-200/80">
              For Parents
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-7 text-[13.5px] font-medium text-slate-600">
            <a href="#overview" className="hover:text-emerald-800 transition-colors duration-150">
              Overview
            </a>
            <a href="#journey" className="hover:text-emerald-800 transition-colors duration-150">
              Journey
            </a>
            <a href="#tracking-app" className="hover:text-emerald-800 transition-colors duration-150">
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
                className="cursor-pointer text-xs sm:text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white rounded-xl shadow-xs transition-all min-h-[44px] inline-flex items-center justify-center gap-1.5"
              >
                <span>Go to Parent App</span>
                <span>&rarr;</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/parent/login"
                  className="cursor-pointer text-xs sm:text-sm font-semibold px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px] flex items-center"
                >
                  Log in
                </Link>
                <Link
                  href="/parent/signup"
                  className="cursor-pointer text-xs sm:text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white rounded-xl shadow-xs transition-all min-h-[44px] inline-flex items-center justify-center"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================
          2. HERO SECTION WITH STAGGERED MOTION & REAL TRACKING UI
      ======================================================== */}
      <section className="relative pt-24 pb-14 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-gradient-to-b from-white via-[#FAFAF9] to-[#FAFAF9]">
        {/* Subtle decorative background corridor */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1440 800" fill="none">
            <path
              d="M -50 180 C 320 180, 520 540, 960 480 C 1320 420, 1420 260, 1600 300"
              stroke="#CBD5E1"
              strokeWidth="2.5"
              strokeDasharray="6 8"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Hero Copy (Staggered Entrance) */}
            <div className="lg:col-span-6 space-y-6 text-left">
              {/* Eyebrow */}
              <div
                style={{
                  transitionDuration: '500ms',
                  transitionDelay: '100ms',
                  opacity: heroMounted ? 1 : 0,
                  transform: heroMounted ? 'translateY(0)' : 'translateY(12px)',
                }}
                className="transition-all inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-bold tracking-wide"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Parent Experience</span>
              </div>

              {/* H1 (Single H1 on page) */}
              <h1
                style={{
                  transitionDuration: '600ms',
                  transitionDelay: '200ms',
                  opacity: heroMounted ? 1 : 0,
                  transform: heroMounted ? 'translateY(0)' : 'translateY(16px)',
                }}
                className="transition-all text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-900 leading-[1.12]"
              >
                School rides,<br />
                <span className="text-[#006B2F]">without the worry.</span>
              </h1>

              {/* Supporting Copy */}
              <p
                style={{
                  transitionDuration: '600ms',
                  transitionDelay: '300ms',
                  opacity: heroMounted ? 1 : 0,
                  transform: heroMounted ? 'translateY(0)' : 'translateY(16px)',
                }}
                className="transition-all text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl"
              >
                See where your child&apos;s school ride is, know who&apos;s driving, and stay updated from pickup to school arrival.
              </p>

              {/* CTAs */}
              <div
                style={{
                  transitionDuration: '600ms',
                  transitionDelay: '400ms',
                  opacity: heroMounted ? 1 : 0,
                  transform: heroMounted ? 'translateY(0)' : 'translateY(16px)',
                }}
                className="transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2"
              >
                <button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="cursor-pointer h-12 min-h-[48px] px-7 bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-950/15 transition-all flex items-center justify-center gap-2"
                >
                  <span>Get Started as a Parent</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                {!isAuth && (
                  <Link
                    href="/parent/login"
                    className="h-12 min-h-[48px] px-5 flex items-center justify-center text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Already have an account? Log in
                  </Link>
                )}
              </div>

              {/* Trust Badges */}
              <div
                style={{
                  transitionDuration: '600ms',
                  transitionDelay: '500ms',
                  opacity: heroMounted ? 1 : 0,
                }}
                className="transition-opacity pt-3 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-500"
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Police-Verified Drivers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>SafeKey Boarding Token</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero App Download Required</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Live Product Demonstration (Staggered Entrance) */}
            <div
              style={{
                transitionDuration: '700ms',
                transitionDelay: '450ms',
                opacity: heroMounted ? 1 : 0,
                transform: heroMounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.98)',
              }}
              className="lg:col-span-6 transition-all"
            >
              {/* Product UI Container: Native app card frame */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl shadow-slate-300/50 border border-slate-200/90 relative">
                {/* Product Header / Active Status Banner */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#006B2F] font-bold text-sm flex items-center justify-center">
                      AS
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900">Aarav Sharma</div>
                      <div className="text-[11px] text-slate-500">Grade 3A • Olive Mount</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#006B2F] border border-emerald-200 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{tripPhase}</span>
                  </div>
                </div>

                {/* Primary Telemetry Strip */}
                <div className="grid grid-cols-3 gap-2 py-3 bg-slate-50/70 rounded-2xl my-3 px-3 text-center border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Arrival ETA
                    </span>
                    <AnimatedEta minutes={currentEta} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Assigned Vehicle
                    </span>
                    <div className="text-sm font-bold text-slate-900 mt-1">TS09-TR-102</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Driver
                    </span>
                    <div className="text-sm font-bold text-slate-900 mt-1">Ravi Kumar</div>
                  </div>
                </div>

                {/* Vector Map Canvas with Live Vehicle Interpolation */}
                <div className="relative h-60 sm:h-64 w-full bg-[#f2f6f2] rounded-2xl overflow-hidden border border-slate-200/80 select-none">
                  {/* Street grid illustration */}
                  <svg className="absolute inset-0 w-full h-full stroke-slate-200/80" strokeWidth="6" fill="none">
                    <line x1="0" y1="60" x2="100%" y2="60" stroke="#e5ede5" strokeWidth="16" />
                    <line x1="0" y1="180" x2="100%" y2="180" stroke="#e5ede5" strokeWidth="14" />
                    <line x1="140" y1="0" x2="140" y2="100%" stroke="#e5ede5" strokeWidth="14" />
                    <line x1="380" y1="0" x2="380" y2="100%" stroke="#e5ede5" strokeWidth="14" />
                  </svg>

                  {/* S-curve route path */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 280" fill="none" preserveAspectRatio="none">
                    {/* Background route corridor */}
                    <path
                      d="M 40 210 C 180 240, 320 60, 540 110"
                      stroke="#cbd5e1"
                      strokeWidth="9"
                      strokeLinecap="round"
                    />
                    {/* Completed traveled route path */}
                    <path
                      d="M 40 210 C 180 240, 320 60, 540 110"
                      stroke="#006B2F"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray="600"
                      strokeDashoffset={`${600 - (progress / 100) * 600}`}
                    />

                    {/* Depot Start Pin */}
                    <circle cx="40" cy="210" r="7" fill="#64748b" stroke="#ffffff" strokeWidth="2.5" />

                    {/* Child's Designated Pickup Point */}
                    <circle cx="280" cy="98" r="9" fill="#2563eb" stroke="#ffffff" strokeWidth="3" />

                    {/* School Campus Gate */}
                    <circle cx="540" cy="110" r="10" fill="#dc2626" stroke="#ffffff" strokeWidth="3" />
                  </svg>

                  {/* Pin Markers Callout */}
                  <div className="absolute left-[44%] top-[12%] -translate-x-1/2 bg-blue-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>Your Pickup Gate</span>
                  </div>

                  <div className="absolute right-[4%] top-[22%] bg-rose-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm flex items-center gap-1">
                    <Bus className="w-3 h-3" />
                    <span>School Campus</span>
                  </div>

                  {/* Moving Vehicle with Directional Rotation & Calm Live Pulse */}
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                    style={{
                      left: `${(coords.x / 600) * 100}%`,
                      top: `${(coords.y / 280) * 100}%`,
                      transform: `translate(-50%, -50%) rotate(${vehicleRotation}deg)`,
                      transition: reducedMotion ? 'none' : 'transform 100ms linear',
                    }}
                  >
                    <div className="relative">
                      {/* Subtle calm pulse ring */}
                      <span className="absolute -inset-2 rounded-xl bg-emerald-400/40 animate-ping pointer-events-none" />

                      {/* Vehicle Body */}
                      <div className="w-9 h-9 rounded-xl bg-[#006B2F] border-2 border-white shadow-xl flex items-center justify-center text-white">
                        <Bus className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  {/* Live Telemetry Badge Bottom */}
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-xs border border-slate-200 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-semibold text-slate-800">● LIVE · Updated just now</span>
                  </div>
                </div>

                {/* Escort and Safety Guarantee footer */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Attendant: Sunita Devi (Certified Female Escort)</span>
                  </div>
                  <span className="font-semibold text-slate-700">SafeKey: 482-910</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. SECTION: VALUE PROPOSITIONS (SCROLL STORYTELLING)
      ======================================================== */}
      <section id="overview" className="py-16 sm:py-20 lg:py-24 bg-white border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold text-[#006B2F] uppercase tracking-wider">
              Total Transparency
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Everything you need to know about your child&apos;s school ride.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Designed from the ground up for parents who want clarity, reliability, and calm mornings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Navigation,
                title: 'Live Location Telemetry',
                desc: 'See the vehicle moving along its approved route with minute-by-minute ETA calculated using traffic data.',
              },
              {
                icon: UserCheck,
                title: 'Driver & Vehicle ID',
                desc: 'View photo, verified driver credentials, female attendant details, and vehicle registration upfront.',
              },
              {
                icon: KeyRound,
                title: 'SafeKey Boarding Scan',
                desc: 'Every student carries a unique digital or physical SafeKey token verified at the vehicle door.',
              },
              {
                icon: ShieldCheck,
                title: 'School Arrival Verified',
                desc: 'Receive immediate campus gate confirmation the moment the vehicle enters the school drop-off bay.',
              },
            ].map((feature, idx) => (
              <ScrollReveal key={idx} delay={idx * 100}>
                <div className="p-6 rounded-3xl bg-slate-50/80 border border-slate-200/80 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all h-full flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-[#006B2F] flex items-center justify-center mb-4 shadow-xs">
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          4. SECTION: JOURNEY TIMELINE STORYTELLING
      ======================================================== */}
      <section id="journey" className="py-16 sm:py-20 lg:py-24 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold text-[#006B2F] uppercase tracking-wider">
              Step-by-Step Clarity
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              From pickup to school, you&apos;re always in the loop.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              No guessing, no frantic phone calls. Every milestone is logged and verified.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                step: '01',
                time: '07:15 AM',
                title: 'Driver Starts',
                desc: 'Vehicle departs depot on pre-approved route corridor.',
              },
              {
                step: '02',
                time: '07:32 AM',
                title: 'Approaching Pickup',
                desc: 'Automated 10-minute warning sent to guardian phone.',
              },
              {
                step: '03',
                time: '07:36 AM',
                title: 'Child Boarded',
                desc: 'SafeKey boarding verified at door with instant confirmation.',
              },
              {
                step: '04',
                time: '07:38 AM',
                title: 'En Route',
                desc: 'Live telemetry tracks vehicle speed and upcoming stops.',
              },
              {
                step: '05',
                time: '08:04 AM',
                title: 'School Arrival',
                desc: 'Campus gate verified with arrival notification.',
              },
            ].map((st, idx) => (
              <ScrollReveal key={idx} delay={idx * 80}>
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs h-full relative">
                  <span className="text-xs font-bold text-[#006B2F]">{st.step}</span>
                  <div className="text-xs font-semibold text-slate-400 mt-1 mb-2">{st.time}</div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">{st.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{st.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          5. SECTION: INTERACTIVE PARENT EXPERIENCE PREVIEW
      ======================================================== */}
      <section id="tracking-app" className="py-16 sm:py-20 lg:py-24 bg-white border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-12">
            <span className="text-xs font-bold text-[#006B2F] uppercase tracking-wider">
              Parent Dashboard
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Your child&apos;s journey. One simple view.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Clean, focused, and free from administrative clutter. See today&apos;s ride at a glance.
            </p>

            {/* Morning vs Afternoon tabs */}
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 mt-2">
              <button
                type="button"
                onClick={() => setActiveTab('morning')}
                className={`py-1.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'morning'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Morning Pickup
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('afternoon')}
                className={`py-1.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'afternoon'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Afternoon Drop
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl shadow-slate-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  TODAY&apos;S RIDE • {activeTab === 'morning' ? 'MORNING PICKUP' : 'AFTERNOON RETURN'}
                </span>
                <div className="text-2xl font-extrabold text-white mt-1">Aarav Sharma</div>
                <div className="text-xs text-slate-400 mt-0.5">Olive Mount • Route 04</div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {activeTab === 'morning' ? '● BOARDED · En Route' : '● SCHEDULED · Departure 03:30 PM'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-b border-slate-800 text-xs">
              <div className="bg-slate-800/60 p-4 rounded-2xl">
                <span className="text-slate-400 text-[11px] block">ETA to School</span>
                <div className="text-xl font-bold text-white mt-1">08:04 AM</div>
                <span className="text-emerald-400 text-[11px]">12 min remaining</span>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-2xl">
                <span className="text-slate-400 text-[11px] block">Driver &amp; Vehicle</span>
                <div className="text-base font-bold text-white mt-1">Ravi Kumar</div>
                <span className="text-slate-400 text-[11px]">TS09-TR-102 (Force 18S)</span>
              </div>
              <div className="bg-slate-800/60 p-4 rounded-2xl">
                <span className="text-slate-400 text-[11px] block">Boarding Pass</span>
                <div className="text-xl font-mono font-bold text-emerald-300 mt-1">482-910</div>
                <span className="text-slate-400 text-[11px]">SafeKey Verified</span>
              </div>
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Encrypted telemetry verified by school transportation admin</span>
              </div>

              <Link
                href="/parent/signup"
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#006B2F] hover:bg-[#005525] text-white text-xs font-bold transition-all text-center"
              >
                Experience Live Parent App &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. SECTION: SAFETY & DRIVER CREDENTIALS
      ======================================================== */}
      <section id="safety" className="py-16 sm:py-20 lg:py-24 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-5">
              <span className="text-xs font-bold text-[#006B2F] uppercase tracking-wider">
                Rigorous Safety Standards
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Know who&apos;s driving and what&apos;s happening.
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                We know that trusting someone with your child&apos;s school commute is significant. That&apos;s why every aspect of the TinyRide network is thoroughly verified.
              </p>

              <div className="space-y-3.5 pt-2">
                {[
                  {
                    title: '100% Police-Verified Drivers',
                    desc: 'Every driver undergoes strict criminal background verification and continuous driving record audits.',
                  },
                  {
                    title: 'Certified Female Attendant Onboard',
                    desc: 'A trained female escort assists children with boarding, seating, seatbelts, and de-boarding at every stop.',
                  },
                  {
                    title: 'Real-Time Speed & Geofence Guard',
                    desc: 'Automated telemetry flags speed anomalies or off-route detours immediately to school operations.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#006B2F] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-lg space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-[#006B2F] font-extrabold text-xl flex items-center justify-center border border-emerald-300">
                    RK
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900">Ravi Kumar</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#006B2F] text-[10px] font-bold border border-emerald-100">
                        Police Verified
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">7+ Years School Transportation Experience</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">VEHICLE</span>
                    <strong className="text-slate-900">TS09-TR-102</strong>
                    <span className="text-slate-500 block text-[11px]">Force Traveller 18S</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">FEMALE ATTENDANT</span>
                    <strong className="text-slate-900">Sunita Devi</strong>
                    <span className="text-slate-500 block text-[11px]">First-Aid Certified</span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified credentials shared directly with your school administration.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. SECTION: SIMPLE ONBOARDING ROADMAP
      ======================================================== */}
      <section id="onboarding" className="py-16 sm:py-20 lg:py-24 bg-white border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
          <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
            <span className="text-xs font-bold text-[#006B2F] uppercase tracking-wider">
              Quick Setup
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Getting started takes just a few steps.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              No complicated paperwork. Connect your family in under 2 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: '1',
                title: 'Mobile Verification',
                desc: 'Enter your 10-digit mobile number and verify with a fast 6-digit OTP.',
              },
              {
                step: '2',
                title: 'Link Child & School',
                desc: 'Tell us your student’s name, grade, and select their enrolled school campus.',
              },
              {
                step: '3',
                title: 'Get SafeKey & Track',
                desc: 'Receive your family’s unique boarding PIN and start viewing live morning rides.',
              },
            ].map((st, idx) => (
              <ScrollReveal key={idx} delay={idx * 100}>
                <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xs h-full flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-[#006B2F] text-white font-extrabold text-sm flex items-center justify-center mb-4">
                      {st.step}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{st.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{st.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="cursor-pointer h-12 min-h-[48px] px-8 bg-[#006B2F] hover:bg-[#005525] active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-950/15 transition-all inline-flex items-center gap-2"
            >
              <span>Get Started as a Parent</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          8. SECTION: ACCESSIBLE FAQ ACCORDION (SEO READY)
      ======================================================== */}
      <section id="faq" className="py-16 sm:py-20 lg:py-24 bg-[#FAFAF9] border-t border-slate-200/70">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-bold text-[#006B2F] uppercase tracking-wider">
              Answers for Parents
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Frequently asked questions.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Clear answers to common questions about school ride tracking, safety, and boarding.
            </p>
          </div>

          <div className="space-y-3" role="region" aria-label="Frequently Asked Questions">
            {parentFaqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden transition-all shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full py-4 px-5 text-left flex items-center justify-between gap-4 cursor-pointer min-h-[48px] focus:outline-none focus:ring-2 focus:ring-[#006B2F]/20"
                  >
                    <span className="text-sm sm:text-base font-bold text-slate-900">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#006B2F]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================
          9. BOTTOM CTA CONVERSION SECTION
      ======================================================== */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-emerald-950 via-[#004B21] to-[#006B2F] text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Give your mornings peace of mind.
          </h2>
          <p className="text-base sm:text-lg text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Join thousands of parents who know exactly when their child&apos;s vehicle arrives.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePrimaryCta}
              className="cursor-pointer h-12 min-h-[48px] px-8 bg-white text-[#006B2F] hover:bg-emerald-50 active:scale-[0.98] text-sm font-bold rounded-xl shadow-lg transition-all"
            >
              Get Started as a Parent &rarr;
            </button>
            {!isAuth && (
              <Link
                href="/parent/login"
                className="h-12 min-h-[48px] px-5 flex items-center justify-center text-xs sm:text-sm font-semibold text-emerald-100 hover:text-white"
              >
                Log in to existing account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================
          10. MINIMAL FOOTER
      ======================================================== */}
      <footer className="py-8 bg-white border-t border-slate-200/80 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/brand/logo-horizontal.png"
              alt="TinyRide"
              className="h-6 w-auto object-contain opacity-80"
            />
            <span>&copy; {new Date().getFullYear()} TinyRide by Dodail Solutions Private Limited.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">
              Terms of Service
            </Link>
            <a href="#safety" className="hover:text-slate-900 transition-colors">
              Trust &amp; Safety
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
