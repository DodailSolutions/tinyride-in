'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TinyRideIPhone } from '@/components/TinyRideIPhone';

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

  // Journey Stepper state + auto-advance demonstration loop
  const [activeJourneyStep, setActiveJourneyStep] = useState(2); // 0-indexed: 2 = Child boards
  const [userInteractedJourney, setUserInteractedJourney] = useState(false);

  // Parent tab state
  const [activeParentTab, setActiveParentTab] = useState<'status' | 'driver' | 'absence'>('status');

  // Early access form
  const [formData, setFormData] = useState({
    parentName: '',
    phone: '',
    schoolName: 'Oakridge International School',
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
        schoolName: 'Oakridge International School',
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

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* 1. STICKY MODERN NAVIGATION */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-xs py-3 border-b border-slate-200/80'
            : 'bg-white/80 backdrop-blur-xs py-4 border-b border-slate-200/40'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/brand/logo-horizontal.png"
              alt="TinyRide — Little Rides. Big Peace of Mind."
              className="h-9 sm:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-emerald-800 transition-colors duration-150">
              How It Works
            </a>
            <a href="#for-parents" className="hover:text-emerald-800 transition-colors duration-150">
              For Parents
            </a>
            <a href="#for-schools" className="hover:text-emerald-800 transition-colors duration-150">
              For Schools
            </a>
            <a href="#for-drivers" className="hover:text-emerald-800 transition-colors duration-150">
              For Drivers
            </a>
            <a href="#trust" className="hover:text-emerald-800 transition-colors duration-150">
              Trust & Safety
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/ops"
              className="text-xs font-semibold px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors btn-micro"
            >
              Operations Portal
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs sm:text-sm font-semibold px-4.5 py-2.5 bg-[#006B2F] hover:bg-[#005525] text-white rounded-lg shadow-xs hover:shadow-sm btn-micro"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
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

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-5 pt-3 pb-6 space-y-3.5 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-800"
            >
              How It Works
            </a>
            <a
              href="#for-parents"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-800"
            >
              For Parents
            </a>
            <a
              href="#for-schools"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-800"
            >
              For Schools
            </a>
            <a
              href="#for-drivers"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-800"
            >
              For Drivers
            </a>
            <a
              href="#trust"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-800"
            >
              Trust & Safety
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                href="/ops"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg btn-micro"
              >
                Operations Portal
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full py-2.5 text-sm font-semibold bg-[#006B2F] text-white rounded-lg shadow-xs btn-micro"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION — APPLE-STYLE PRODUCT LAUNCH WITH AUTHENTIC IPHONE */}
      <section className="relative pt-12 pb-24 sm:pt-16 sm:pb-32 lg:pt-20 lg:pb-36 overflow-hidden bg-gradient-to-b from-white via-[#FAFAF9] to-[#FAFAF9]">
        {/* Subtle, ambient background road curvature */}
        <div className="absolute inset-0 pointer-events-none opacity-25">
          <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none">
            <path
              d="M -100 250 C 300 250, 480 650, 900 600 C 1300 550, 1420 300, 1600 350"
              stroke="#E2E8F0"
              strokeWidth="2.5"
              strokeDasharray="6 8"
            />
            <path
              d="M 100 120 C 500 140, 720 500, 1150 440 C 1350 410, 1520 220, 1680 240"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left: Editorial Content with Apple-style Clarity & Restraint */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-semibold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                School Transportation, Reimagined
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-bold tracking-tight text-slate-900 leading-[1.08]">
                School rides, <br />
                <span className="text-[#006B2F]">without the worry.</span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                See the ride. Know the driver. Know when your child arrives. One connected, calm experience for parents, schools and drivers.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#006B2F] hover:bg-[#005525] text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md btn-micro group"
                >
                  <span>Get Started</span>
                  <svg
                    className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg btn-micro"
                >
                  See how it works
                </a>
              </div>

              {/* Factual, quiet reassurance */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Verified driver
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  SafeKey boarding
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Live GPS updates
                </span>
              </div>
            </div>

            {/* Right: Authentic iPhone Showcase with Real-Time Smooth Traversal */}
            <div className="lg:col-span-6 flex justify-center lg:justify-end">
              <div className="relative">
                {/* Authentic Modern iPhone Product Component */}
                <TinyRideIPhone mode="parent_tracking" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. REFINED TRUST & ECOSYSTEM STRIP */}
      <section className="border-y border-slate-200 bg-white py-8">
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
      <section className="py-24 lg:py-32 bg-[#FAFAF9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <ScrollReveal>
            <div className="space-y-4">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Everyday Uncertainty
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                You shouldn’t have to wonder where the school ride is.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Every morning and afternoon, parents experience the same familiar stress. Standing at the gate in the heat, calling uncontactable drivers, and waiting for updates that never come.
              </p>
            </div>
          </ScrollReveal>

          {/* 3 Relatable Questions with Staggered Scroll Reveal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4">
            <ScrollReveal delay={0}>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-left shadow-2xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 h-full">
                <div className="text-emerald-700 text-xl font-bold mb-2">01</div>
                <p className="text-base font-semibold text-slate-900 mb-1">
                  “Is the vehicle on the way?”
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Wondering whether the bus is stuck in traffic, running early, or delayed at an earlier stop.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={70}>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-left shadow-2xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 h-full">
                <div className="text-emerald-700 text-xl font-bold mb-2">02</div>
                <p className="text-base font-semibold text-slate-900 mb-1">
                  “Has my child boarded?”
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  No direct confirmation whether they safely stepped onto the bus or were accidentally missed.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={140}>
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-left shadow-2xs hover:shadow-sm transition-all duration-200 hover:-translate-y-0.5 h-full">
                <div className="text-emerald-700 text-xl font-bold mb-2">03</div>
                <p className="text-base font-semibold text-slate-900 mb-1">
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
            <div className="pt-6 border-t border-slate-200 max-w-xl mx-auto">
              <p className="text-lg font-semibold text-slate-900">
                TinyRide keeps you quietly in the loop.
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Clear, real-time transportation intelligence that replaces guessing with calm confidence.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 5. PRODUCT SHOWCASE — THE HERO PRODUCT MOMENT */}
      <section className="py-24 lg:py-32 bg-white border-y border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                The TinyRide Parent App
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                Everything you need to know. At a glance.
              </h2>
              <p className="text-base text-slate-600 max-w-xl mx-auto">
                Open the app and see exactly what matters. No guesswork, no phone calls, and no confusing menus.
              </p>
            </div>
          </ScrollReveal>

          {/* Central Product Showcase with 3 Concise Callouts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left 2 Callouts */}
            <div className="lg:col-span-3 space-y-10 order-2 lg:order-1">
              <ScrollReveal delay={50}>
                <div className="space-y-2 text-center lg:text-left group">
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
                <div className="space-y-2 text-center lg:text-left group">
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
            <div className="lg:col-span-6 flex justify-center order-1 lg:order-2">
              <ScrollReveal delay={80} yOffset={24}>
                <TinyRideIPhone mode="parent_tracking" />
              </ScrollReveal>
            </div>

            {/* Right 1 Callout + Reassurance */}
            <div className="lg:col-span-3 space-y-10 order-3">
              <ScrollReveal delay={160}>
                <div className="space-y-2 text-center lg:text-left group">
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
        </div>
      </section>

      {/* 6. JOURNEY EXPERIENCE — TRANSPORTATION TIMELINE WITH PROGRESS LINE */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Connected Journey
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                From pickup to school, you’re always in the loop.
              </h2>
              <p className="text-base text-slate-600 max-w-xl mx-auto">
                Every milestone is tracked and verified. From the moment the vehicle departs the depot to final school gate handover.
              </p>
            </div>
          </ScrollReveal>

          {/* Stepper Timeline with Interactive Progress Fill Line */}
          <div className="relative mb-10">
            {/* Visual Progress Line Behind Buttons */}
            <div className="hidden lg:block absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-slate-200 -z-0">
              <div
                style={{
                  width: `${(activeJourneyStep / (journeySteps.length - 1)) * 100}%`,
                  transition: 'width 500ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="h-full bg-emerald-600"
              ></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 relative z-10">
              {journeySteps.map((step, idx) => (
                <button
                  key={step.num}
                  onClick={() => {
                    setUserInteractedJourney(true);
                    setActiveJourneyStep(idx);
                  }}
                  className={`text-left p-4 rounded-xl border transition-all duration-300 btn-micro ${
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

          {/* Active Milestone Deep-Dive Box with Smooth Cross-Fade */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs transition-all duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  <span className="font-mono">{currentStep.num}</span>
                  <span>•</span>
                  <span>{currentStep.badge}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 transition-all duration-200">
                  {currentStep.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed transition-all duration-200">
                  {currentStep.description}
                </p>
                <div className="pt-2 flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span>Timestamp: <strong className="text-slate-800">{currentStep.time}</strong></span>
                  <span>•</span>
                  <span>Status: <strong className="text-emerald-800">Verified by TinyRide</strong></span>
                </div>
              </div>

              <div className="lg:col-span-5 bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-3">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                  Notification Preview
                </div>
                <div className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs space-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                      <img src="/brand/logo-wordmark.png" alt="" className="h-3 w-auto" />
                      TinyRide
                    </span>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 transition-opacity duration-200">
                    {activeJourneyStep === 0 && 'Driver Ravi has started the morning route TR-102.'}
                    {activeJourneyStep === 1 && 'TR-102 is 500m away. Please proceed to the pickup gate.'}
                    {activeJourneyStep === 2 && 'Tanvik has safely boarded TR-102. SafeKey token confirmed.'}
                    {activeJourneyStep === 3 && 'TR-102 is on Jubilee Hills Road No. 36. Speed: 34 km/h.'}
                    {activeJourneyStep === 4 && 'TR-102 has arrived at Oakridge International School Bay 3.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PARENT EXPERIENCE — PEACE OF MIND */}
      <section id="for-parents" className="py-24 lg:py-32 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <ScrollReveal>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                  Parent Simplicity
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight mt-2">
                  For parents, peace of mind in one simple view.
                </h2>
                <p className="text-base text-slate-600 leading-relaxed mt-4">
                  From morning pickup to afternoon drop-off, TinyRide keeps you quietly informed. No clutter, no confusing options, and zero unnecessary calls.
                </p>
              </ScrollReveal>

              {/* 5 Clean Editorial Points */}
              <ul className="space-y-3.5 pt-2">
                {[
                  'Know when the ride is approaching your home with exact arrival times.',
                  'Know who is driving and verify their credentials, photo, and vehicle plate.',
                  'Watch the vehicle move along the approved school route in real time.',
                  'Receive instant confirmation the minute your child boards safely.',
                  'Get notified the moment the vehicle arrives at the campus drop-off gate.',
                ].map((item, idx) => (
                  <ScrollReveal key={idx} delay={idx * 50}>
                    <li className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  </ScrollReveal>
                ))}
              </ul>

              <div className="pt-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-[#006B2F] hover:bg-[#005525] text-white text-sm font-semibold rounded-lg shadow-xs btn-micro"
                >
                  Join as a Parent
                </button>
              </div>
            </div>

            {/* Right: Parent App Feature Tabs Mock */}
            <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200">
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 mb-6 gap-4 text-xs font-semibold relative">
                <button
                  onClick={() => setActiveParentTab('status')}
                  className={`pb-3 transition-colors ${
                    activeParentTab === 'status'
                      ? 'border-b-2 border-emerald-700 text-emerald-900'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Live Status
                </button>
                <button
                  onClick={() => setActiveParentTab('driver')}
                  className={`pb-3 transition-colors ${
                    activeParentTab === 'driver'
                      ? 'border-b-2 border-emerald-700 text-emerald-900'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Verified Driver
                </button>
                <button
                  onClick={() => setActiveParentTab('absence')}
                  className={`pb-3 transition-colors ${
                    activeParentTab === 'absence'
                      ? 'border-b-2 border-emerald-700 text-emerald-900'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  One-Tap Absence
                </button>
              </div>

              {/* Tab Content Display */}
              <div className="transition-all duration-300">
                {activeParentTab === 'status' && (
                  <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-500">Child Commute</p>
                        <h4 className="font-bold text-slate-900 text-sm">Tanvik — Morning School Trip</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold flex items-center gap-1.5">
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
                        <strong className="text-slate-900">TR-102 (TS09-TR-102)</strong>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic">
                      Push notifications are dispatched at every stage automatically.
                    </p>
                  </div>
                )}

                {activeParentTab === 'driver' && (
                  <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-base">
                        RK
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-sm">Ravi Kumar</h4>
                          <span className="text-emerald-700 font-bold text-xs" title="Verified Driver">✓ Verified</span>
                        </div>
                        <p className="text-xs text-slate-500">Assigned Driver • 6 Years Safe Driving</p>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Vehicle Model:</span>
                        <strong className="text-slate-900">Force Traveller 3350</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Registration:</span>
                        <strong className="text-slate-900">TS 09 TR 102</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>School Route:</span>
                        <strong className="text-slate-900">Route 04 (Oakridge International)</strong>
                      </div>
                    </div>
                  </div>
                )}

                {activeParentTab === 'absence' && (
                  <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4 animate-in fade-in duration-200">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Child Not Attending School Today?</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Inform the driver and school with a single tap. The driver won’t wait outside your gate, keeping the route punctual for all children.
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg flex items-center justify-between text-xs text-amber-900 font-medium">
                      <span>Mark Tanvik as absent for today?</span>
                      <button className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] btn-micro">
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

      {/* 8. SCHOOL EXPERIENCE — OPERATIONAL CONTROL */}
      <section id="for-schools" className="py-24 lg:py-32 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Operational UI Mock */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 order-2 lg:order-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    School Transport Dashboard
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">Oakridge International Campus Bay</h3>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  14 / 14 ACTIVE ROUTES
                </span>
              </div>

              {/* Metric Counters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
                  <span className="text-[11px] text-slate-500">Children in Transit</span>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">428</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
                  <span className="text-[11px] text-slate-500">Active Vehicles</span>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">14</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors">
                  <span className="text-[11px] text-slate-500">Delayed Routes</span>
                  <div className="text-xl font-bold text-emerald-700 mt-0.5">0</div>
                </div>
              </div>

              {/* Bus Bay Status Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 border-b border-slate-200 flex justify-between">
                  <span>Route & Vehicle</span>
                  <span>Driver</span>
                  <span>Status</span>
                  <span>ETA / Arrival</span>
                </div>
                {[
                  { route: 'Route 01 — Jubilee Hills', veh: 'TS09-TR-101', driver: 'Mahesh B.', status: 'Arrived Bay 1', eta: '08:02 AM', statusColor: 'text-emerald-700 bg-emerald-50' },
                  { route: 'Route 04 — Madhapur', veh: 'TS09-TR-102', driver: 'Ravi Kumar', status: 'En Route (2 km)', eta: '08:05 AM', statusColor: 'text-blue-700 bg-blue-50' },
                  { route: 'Route 07 — Gachibowli', veh: 'TS09-TR-105', driver: 'Srinivas R.', status: 'En Route (4 km)', eta: '08:09 AM', statusColor: 'text-blue-700 bg-blue-50' },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 border-b border-slate-100 last:border-0 flex justify-between items-center hover:bg-slate-50/80 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">{row.route}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{row.veh}</div>
                    </div>
                    <div className="text-slate-600">{row.driver}</div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.statusColor}`}>
                      {row.status}
                    </span>
                    <div className="font-mono text-slate-700 font-semibold">{row.eta}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Editorial Copy */}
            <div className="lg:col-span-5 space-y-6 order-1 lg:order-2">
              <ScrollReveal>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                  School Transport Oversight
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight mt-2">
                  For schools, transportation becomes easier to see.
                </h2>
                <p className="text-base text-slate-600 leading-relaxed mt-4">
                  School administrators and transport managers gain immediate, end-to-end visibility of every vehicle, route, and child. Coordinate drop-offs, reduce gate congestion, and communicate instantly with parents.
                </p>
              </ScrollReveal>

              <div className="space-y-3 pt-2 text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span><strong>Complete transport visibility:</strong> Monitor all routes simultaneously from a single central map.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span><strong>Gate & bay coordination:</strong> Eliminate morning bottleneck delays with scheduled arrival pacing.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span><strong>Fewer front-desk inquiries:</strong> When parents have real-time tracking, repetitive phone calls drop.</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-xs btn-micro"
                >
                  Explore TinyRide for Schools
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. DRIVER EXPERIENCE — AUTHENTIC DRIVER IPHONE DISPLAY */}
      <section id="for-drivers" className="py-24 lg:py-32 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-6">
              <ScrollReveal>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                  Driver Focused
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight mt-2">
                  For drivers, the job stays simple.
                </h2>
                <p className="text-base text-slate-600 leading-relaxed mt-4">
                  No complex menus. No phone calls while driving. Just clear stops and one-tap boarding. TinyRide is engineered for safety and distraction-free operation.
                </p>
              </ScrollReveal>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
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

            {/* Right: Driver Interface on Authentic iPhone */}
            <div className="lg:col-span-6 flex justify-center">
              <ScrollReveal delay={80}>
                <TinyRideIPhone mode="driver" />
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* 10. TRUST & TRANSPARENCY SECTION — CALM EDITORIAL SEQUENCE */}
      <section id="trust" className="py-24 lg:py-32 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Information Transparency
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
                Built around the journey that matters.
              </h2>
              <p className="text-base text-slate-600 max-w-xl mx-auto">
                Real reassurance comes from verified facts, not inflated promises. A calm, transparent sequence from door to campus.
              </p>
            </div>
          </ScrollReveal>

          {/* Calm Linear Editorial Sequence: Driver -> Vehicle -> Route -> Child boards -> School */}
          <div className="max-w-4xl mx-auto space-y-4">
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
                <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 hover:border-slate-300 hover:shadow-xs">
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-emerald-800 font-bold text-base shrink-0 mt-0.5">
                      {item.step}
                    </span>
                    <div>
                      <h4 className="font-bold text-base text-slate-900">{item.title}</h4>
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

      {/* 11. FINAL CONVERSION CTA — PREMIUM DARK SECTION */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal yOffset={20}>
            <div className="bg-slate-950 text-white rounded-3xl p-10 sm:p-14 lg:p-20 text-center relative overflow-hidden shadow-2xl">
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

              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  Start Today
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                  A simpler school ride starts here.
                </h2>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                  One connected experience for parents, schools and drivers. Less guessing, better visibility, and complete peace of mind.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#006B2F] hover:bg-[#005525] text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md btn-micro"
                  >
                    Get Started
                  </button>
                  <a
                    href="#for-schools"
                    className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm rounded-lg btn-micro"
                  >
                    Talk to Your School
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* 12. FOOTER */}
      <footer className="border-t border-slate-200 bg-white py-12 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand column */}
            <div className="space-y-3">
              <img
                src="/brand/logo-horizontal.png"
                alt="TinyRide"
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
                <li><a href="#for-parents" className="hover:text-emerald-800 transition-colors">For Parents</a></li>
                <li><a href="#for-schools" className="hover:text-emerald-800 transition-colors">For Schools</a></li>
                <li><a href="#for-drivers" className="hover:text-emerald-800 transition-colors">For Drivers</a></li>
                <li><a href="#trust" className="hover:text-emerald-800 transition-colors">Trust & Safety</a></li>
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

      {/* 13. INTERACTIVE "GET STARTED" MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
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
                      <option value="Oakridge International School">Oakridge International School, Gachibowli</option>
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
                    className="w-full py-3 bg-[#006B2F] hover:bg-[#005525] text-white font-bold text-xs rounded-lg shadow-sm btn-micro mt-2"
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
