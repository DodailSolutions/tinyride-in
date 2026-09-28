'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TinyRideLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [activeJourneyStep, setActiveJourneyStep] = useState(2); // 0-indexed: 2 = Child boards
  const [activeParentTab, setActiveParentTab] = useState<'status' | 'driver' | 'absence'>('status');

  const [formData, setFormData] = useState({
    parentName: '',
    phone: '',
    schoolName: 'Oakridge International School',
    area: 'Gachibowli',
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      title: 'Vehicle approaches pickup',
      time: '07:32 AM',
      description: 'Parents receive an automated alert when the vehicle is 500 meters away — no rushing, no waiting.',
      badge: '5 min away',
    },
    {
      num: '03',
      title: 'Child boards',
      time: '07:36 AM',
      description: 'The driver verifies boarding at the stop. Parents get an instant boarding confirmation on their phone.',
      badge: 'SafeKey Confirmed',
    },
    {
      num: '04',
      title: 'Child is on the way',
      time: '07:37 – 08:02 AM',
      description: 'Real-time GPS follows the vehicle along its designated path to school with live ETA updates.',
      badge: 'In Transit',
    },
    {
      num: '05',
      title: 'Arrives at school',
      time: '08:04 AM',
      description: 'Vehicle reaches the campus drop-off bay. Parents and school transport staff receive arrival confirmation.',
      badge: 'School Gate Verified',
    },
  ];

  const currentStep = journeySteps[activeJourneyStep] ?? journeySteps[0]!;

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. STICKY MODERN NAVIGATION */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
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
              className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-[13.5px] font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-emerald-800 transition-colors">
              How It Works
            </a>
            <a href="#for-parents" className="hover:text-emerald-800 transition-colors">
              For Parents
            </a>
            <a href="#for-schools" className="hover:text-emerald-800 transition-colors">
              For Schools
            </a>
            <a href="#for-drivers" className="hover:text-emerald-800 transition-colors">
              For Drivers
            </a>
            <a href="#safety" className="hover:text-emerald-800 transition-colors">
              Safety
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/ops"
              className="text-xs font-semibold px-3 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Operations Portal
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-xs sm:text-sm font-semibold px-4.5 py-2.5 bg-[#006B2F] hover:bg-[#005525] text-white rounded-lg shadow-xs hover:shadow-sm transition-all"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 rounded-lg hover:bg-slate-100"
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
          <div className="md:hidden bg-white border-b border-slate-200 px-5 pt-3 pb-6 space-y-3.5 shadow-lg">
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
              href="#safety"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-emerald-800"
            >
              Safety
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <Link
                href="/ops"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
              >
                Operations Portal
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full py-2.5 text-sm font-semibold bg-[#006B2F] text-white rounded-lg shadow-xs"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION — STRONG EDITORIAL & PRODUCT COMPOSITION */}
      <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-white via-[#FAFAF9] to-[#FAFAF9]">
        {/* Subtle decorative background road geometry */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <svg className="w-full h-full" viewBox="0 0 1440 800" fill="none">
            <path
              d="M-100 200 C300 200, 450 600, 850 550 C1250 500, 1400 300, 1600 350"
              stroke="#E2E8F0"
              strokeWidth="2.5"
              strokeDasharray="6 8"
            />
            <path
              d="M100 100 C500 120, 700 450, 1100 400 C1300 380, 1500 200, 1650 220"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left: Editorial Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-semibold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                School Transportation, Reimagined
              </div>

              {/* Large Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-slate-900 leading-[1.08]">
                School rides, <br />
                <span className="text-[#006B2F]">without the worry.</span>
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                One simple experience for parents, schools and drivers — from morning pickup to safe arrival at the campus gate.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#006B2F] hover:bg-[#005525] text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all group"
                >
                  <span>Get Started</span>
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <a
                  href="#how-it-works"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3.5 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 text-sm font-semibold rounded-lg transition-colors"
                >
                  See How TinyRide Works
                </a>
              </div>

              {/* Understated Trust Note */}
              <div className="pt-3 flex items-center justify-center lg:justify-start gap-4 text-xs text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Track the ride
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Know the status
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Stay informed
                </span>
              </div>
            </div>

            {/* Right: Premium Phone Composition with Layered Map & Depth */}
            <div className="lg:col-span-6 relative flex justify-center lg:justify-end">
              {/* Contextual Status Card behind/beside phone */}
              <div className="hidden sm:block absolute -top-4 -left-6 z-20 bg-white/95 border border-slate-200/90 rounded-xl p-3.5 shadow-md shadow-slate-200/60 max-w-[210px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    Live Route 04
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-slate-800">Madhapur to Oakridge</p>
                <p className="text-[11px] text-slate-500">Stop 4 of 6 • On schedule</p>
              </div>

              {/* Contextual Boarding Token Card at bottom right */}
              <div className="hidden sm:block absolute -bottom-4 -right-4 z-20 bg-white/95 border border-slate-200/90 rounded-xl p-3 shadow-md shadow-slate-200/60 max-w-[190px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500">Handover Token</span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    VERIFIED
                  </span>
                </div>
                <div className="mt-1 font-mono text-sm font-bold text-slate-900 tracking-wider">
                  482 - 910
                </div>
                <p className="text-[10px] text-slate-500">Parent-to-driver check</p>
              </div>

              {/* The Smartphone Mockup Frame */}
              <div className="relative w-[310px] sm:w-[330px] rounded-[44px] bg-slate-900 p-3 shadow-2xl shadow-slate-900/15 ring-1 ring-slate-800/10">
                {/* Speaker slit & Dynamic Island */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
                </div>

                {/* Inner Screen */}
                <div className="relative rounded-[36px] bg-white overflow-hidden text-slate-800 text-xs">
                  {/* Status Bar */}
                  <div className="pt-3 px-6 pb-2 flex justify-between items-center text-[10px] font-semibold text-slate-600 bg-slate-50 border-b border-slate-100">
                    <span>8:28 AM</span>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z" />
                      </svg>
                      <span>5G</span>
                      <div className="w-4 h-2 border border-slate-500 rounded-xs p-0.5 flex items-center">
                        <div className="w-2.5 h-1 bg-slate-600 rounded-2xs"></div>
                      </div>
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-bold text-slate-900 text-xs">Tanvik’s Morning Ride</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Grade 3A • Route 04 (Oakridge)</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[10px] border border-emerald-200/50">
                      On the way
                    </span>
                  </div>

                  {/* Primary Hero Status Card */}
                  <div className="p-3.5 bg-gradient-to-b from-emerald-50/60 to-white border-b border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-xl font-bold text-slate-900">7 min away</div>
                        <p className="text-[11px] text-slate-600">Arriving at your gate at 8:35 AM</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-medium">Speed</span>
                        <div className="text-xs font-semibold text-slate-700">32 km/h</div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 relative">
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 rounded-full w-3/5"></div>
                      </div>
                      <div className="mt-1 flex justify-between text-[9px] text-slate-500 font-medium">
                        <span>Depot 7:15</span>
                        <span className="text-emerald-700 font-bold">Your Stop 8:35</span>
                        <span>School 8:50</span>
                      </div>
                    </div>
                  </div>

                  {/* Realistic Map Canvas */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {/* SVG Map Visual */}
                    <svg className="w-full h-full object-cover" viewBox="0 0 300 170" fill="none">
                      {/* Grid / Roads */}
                      <rect width="300" height="170" fill="#F1F5F9" />
                      {/* Green park zone */}
                      <path d="M10 20 Q80 10 100 60 T40 130 Z" fill="#DCFCE7" opacity="0.6" />
                      {/* Water/lake */}
                      <path d="M220 100 Q260 120 290 90 L300 170 L200 170 Z" fill="#E0F2FE" opacity="0.7" />
                      
                      {/* Major roads */}
                      <line x1="0" y1="70" x2="300" y2="70" stroke="#CBD5E1" strokeWidth="6" />
                      <line x1="140" y1="0" x2="140" y2="170" stroke="#CBD5E1" strokeWidth="6" />
                      <path d="M30 150 C90 140 110 90 200 85 C240 82 270 40 290 20" stroke="#E2E8F0" strokeWidth="4" />
                      
                      {/* Active Route Path */}
                      <path
                        d="M 40 70 L 140 70 L 140 120 L 220 120 L 260 50"
                        stroke="#006B2F"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Home Pin */}
                      <circle cx="140" cy="120" r="6" fill="#006B2F" />
                      <circle cx="140" cy="120" r="11" stroke="#006B2F" strokeWidth="1.5" strokeOpacity="0.4" />
                      <text x="140" y="140" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#006B2F">
                        Home (8:35 AM)
                      </text>

                      {/* Moving Vehicle */}
                      <g transform="translate(100, 70)">
                        <circle cx="0" cy="0" r="9" fill="#006B2F" />
                        <circle cx="0" cy="0" r="14" stroke="#006B2F" strokeWidth="1.5" strokeDasharray="2 2" />
                        <text x="0" y="3" textAnchor="middle" fontSize="8" fill="white">🚐</text>
                      </g>

                      {/* School Pin */}
                      <g transform="translate(260, 50)">
                        <circle cx="0" cy="0" r="7" fill="#0F172A" />
                        <text x="0" y="3" textAnchor="middle" fontSize="7" fill="white">🏫</text>
                        <text x="0" y="-10" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#0F172A">
                          Oakridge
                        </text>
                      </g>
                    </svg>

                    {/* Floating HUD Pill on Map */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 rounded-lg px-2.5 py-1.5 shadow-sm border border-slate-200/80 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="font-semibold text-slate-800">Approaching Road No. 36</span>
                      </div>
                      <span className="text-slate-500">Traffic: Clear</span>
                    </div>
                  </div>

                  {/* Driver & Vehicle Details Footer */}
                  <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs">
                        RK
                      </div>
                      <div>
                        <div className="flex items-center gap-1 font-semibold text-slate-900 text-xs">
                          Ravi Kumar
                          <span className="text-emerald-700" title="Verified">✓</span>
                        </div>
                        <p className="text-[10px] text-slate-500">TR-102 • Force Traveller</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-medium">
                        TS09-TR-102
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. REFINED TRUST & ECOSYSTEM STRIP */}
      <section className="border-y border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Parents */}
            <div className="pt-3 md:pt-0 md:px-4 first:pl-0 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center text-sm font-bold shrink-0">
                01
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">For Parents</h4>
                <p className="text-xs text-slate-500">Real-time visibility & boarding peace of mind</p>
              </div>
            </div>

            {/* Schools */}
            <div className="pt-4 md:pt-0 md:px-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-sm font-bold shrink-0">
                02
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">For Schools</h4>
                <p className="text-xs text-slate-500">Transport coordination & bus bay oversight</p>
              </div>
            </div>

            {/* Drivers */}
            <div className="pt-4 md:pt-0 md:px-4 last:pr-0 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center text-sm font-bold shrink-0">
                03
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">For Drivers</h4>
                <p className="text-xs text-slate-500">Simple daily workflow & zero behind-the-wheel calls</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EMOTIONAL PROBLEM SECTION — EDITORIAL STORYTELLING */}
      <section className="py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <div className="space-y-4">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
              Everyday Uncertainty
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
              You shouldn’t have to wonder where the school ride is.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Every morning and afternoon, parents experience the same familiar stress. Standing at the gate in the sun, calling uncontactable drivers, and waiting for updates that never come.
            </p>
          </div>

          {/* 3 Relatable Questions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-left shadow-2xs">
              <div className="text-emerald-700 text-xl font-bold mb-2">01</div>
              <p className="text-base font-semibold text-slate-900 mb-1">
                “Is the vehicle on the way?”
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Wondering whether the bus is stuck in traffic or running early.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-left shadow-2xs">
              <div className="text-emerald-700 text-xl font-bold mb-2">02</div>
              <p className="text-base font-semibold text-slate-900 mb-1">
                “Has my child boarded?”
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                No confirmation whether they safely got into the vehicle or were missed.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-left shadow-2xs">
              <div className="text-emerald-700 text-xl font-bold mb-2">03</div>
              <p className="text-base font-semibold text-slate-900 mb-1">
                “Did they reach school?”
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Waiting until evening to know if morning drop-off went smoothly.
              </p>
            </div>
          </div>

          {/* Transition */}
          <div className="pt-6 border-t border-slate-200 max-w-xl mx-auto">
            <p className="text-lg font-semibold text-slate-900">
              TinyRide keeps you in the loop.
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Clear, real-time transportation intelligence that replaces guessing with calm confidence.
            </p>
          </div>
        </div>
      </section>

      {/* 5. PRODUCT SHOWCASE — THE HERO PRODUCT MOMENT */}
      <section className="py-20 lg:py-28 bg-white border-y border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
              The TinyRide Parent App
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
              Everything you need to know. At a glance.
            </h2>
            <p className="text-base text-slate-600 max-w-xl mx-auto">
              No complicated menus or cluttered settings. Open the app and instantly see your child’s ride status, verified driver, and precise arrival time.
            </p>
          </div>

          {/* Central Product Showcase with 3 Concise Callouts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left 2 Callouts */}
            <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">
              <div className="space-y-2 text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-sm">
                  1
                </div>
                <h3 className="text-lg font-bold text-slate-900">Live location</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Watch the vehicle move in real time along its verified route with actual traffic-adjusted ETA.
                </p>
              </div>

              <div className="space-y-2 text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-sm">
                  2
                </div>
                <h3 className="text-lg font-bold text-slate-900">Child status</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instant notification the moment your child steps onto the vehicle and boarding is confirmed.
                </p>
              </div>
            </div>

            {/* Middle: Prominent Mobile App UI */}
            <div className="lg:col-span-6 flex justify-center order-1 lg:order-2">
              <div className="w-[320px] sm:w-[350px] rounded-[48px] bg-slate-900 p-3.5 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-800">
                {/* Dynamic island */}
                <div className="w-24 h-4 bg-slate-950 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                </div>

                <div className="bg-[#F8FAFC] rounded-[38px] overflow-hidden text-slate-800 text-xs">
                  {/* Top Bar */}
                  <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                        Live Tracking
                      </span>
                      <div className="font-bold text-sm text-slate-900">Tanvik Mathurthi</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      BOARDED
                    </span>
                  </div>

                  {/* Interactive Map UI */}
                  <div className="relative h-60 bg-slate-100">
                    <svg className="w-full h-full object-cover" viewBox="0 0 320 220" fill="none">
                      <rect width="320" height="220" fill="#F1F5F9" />
                      {/* Roads */}
                      <path d="M0 60 L320 60" stroke="#E2E8F0" strokeWidth="8" />
                      <path d="M160 0 L160 220" stroke="#E2E8F0" strokeWidth="8" />
                      <path d="M40 180 C120 160 140 100 240 90 L300 70" stroke="#CBD5E1" strokeWidth="6" />
                      
                      {/* Active Route */}
                      <path
                        d="M 50 180 L 160 180 L 160 90 L 260 90"
                        stroke="#006B2F"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />

                      {/* Pickup Point - Completed */}
                      <circle cx="50" cy="180" r="5" fill="#006B2F" />
                      <text x="50" y="200" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#006B2F">
                        Home • Boarded 7:36 AM
                      </text>

                      {/* Vehicle Current Location */}
                      <g transform="translate(190, 90)">
                        <circle cx="0" cy="0" r="10" fill="#006B2F" />
                        <circle cx="0" cy="0" r="16" stroke="#006B2F" strokeWidth="1.5" strokeDasharray="3 3" />
                        <text x="0" y="3.5" textAnchor="middle" fontSize="9" fill="white">🚐</text>
                      </g>

                      {/* Destination School */}
                      <g transform="translate(260, 90)">
                        <circle cx="0" cy="0" r="8" fill="#0F172A" />
                        <text x="0" y="3" textAnchor="middle" fontSize="8" fill="white">🏫</text>
                        <text x="0" y="-12" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0F172A">
                          School Bay 3
                        </text>
                      </g>
                    </svg>

                    {/* Floating Status Banner */}
                    <div className="absolute top-3 left-3 right-3 bg-white/95 backdrop-blur-xs rounded-xl p-2.5 border border-slate-200 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <div>
                          <p className="text-[11px] font-bold text-slate-900">En Route to School</p>
                          <p className="text-[9px] text-slate-500">12 min remaining • 4.2 km</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        ETA 8:04 AM
                      </span>
                    </div>
                  </div>

                  {/* Trip Details Card */}
                  <div className="p-4 bg-white space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Driver</span>
                      <span className="font-semibold text-slate-900">Ravi Kumar (TS09-TR-102)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Vehicle</span>
                      <span className="font-semibold text-slate-900">Force Traveller 18-Seater</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">SafeKey Token</span>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        482-910
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <button className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] text-center transition-colors">
                        Call Driver
                      </button>
                      <button className="flex-1 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-[11px] text-center transition-colors">
                        Share Status
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Callout + Reassurance */}
            <div className="lg:col-span-3 space-y-8 order-3">
              <div className="space-y-2 text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-sm">
                  3
                </div>
                <h3 className="text-lg font-bold text-slate-900">Arrival updates</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Know the exact minute the vehicle passes the school gates and enters the safe drop-off zone.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left">
                <p className="text-xs font-semibold text-slate-800 mb-1">
                  “I no longer have to worry during my morning meetings.”
                </p>
                <p className="text-[11px] text-slate-500">
                  Real-time status updates right on your lock screen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. JOURNEY EXPERIENCE — TRANSPORTATION TIMELINE */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Stepper Timeline Navigation */}
          <div className="hidden lg:grid grid-cols-5 gap-3 mb-10">
            {journeySteps.map((step, idx) => (
              <button
                key={step.num}
                onClick={() => setActiveJourneyStep(idx)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  activeJourneyStep === idx
                    ? 'bg-white border-emerald-600 shadow-sm ring-1 ring-emerald-500/20'
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-mono text-xs font-bold ${
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

          {/* Active Milestone Deep-Dive Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  <span className="font-mono">{currentStep.num}</span>
                  <span>•</span>
                  <span>{currentStep.badge}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {currentStep.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
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
                <div className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                      <img src="/brand/logo-wordmark.png" alt="" className="h-3 w-auto" />
                      TinyRide
                    </span>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    {activeJourneyStep === 0 && 'Driver Ravi has started the morning route TR-102.'}
                    {activeJourneyStep === 1 && 'TR-102 is 500m away. Please proceed to the pickup gate.'}
                    {activeJourneyStep === 2 && 'Tanvik has safely boarded TR-102. SafeKey token confirmed.'}
                    {activeJourneyStep === 3 && 'TR-102 is on Jubilee Hills Road No. 36. Speed: 32 km/h.'}
                    {activeJourneyStep === 4 && 'TR-102 has arrived at Oakridge International School Bay 3.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PARENT EXPERIENCE — PEACE OF MIND */}
      <section id="for-parents" className="py-20 lg:py-28 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Parent Simplicity
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                For parents, it’s peace of mind in one simple view.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Everything you need to know about your child’s commute is presented cleanly. No clutter, no confusing options, and zero unnecessary calls.
              </p>

              {/* 5 Bullet Points */}
              <ul className="space-y-3.5 pt-2">
                {[
                  'Know when the ride is coming with exact, traffic-adjusted arrival times.',
                  'Know who is driving — full driver photo, verified identity, and vehicle number.',
                  'See trip progress along the assigned school route in real time.',
                  'Get important updates directly to your phone without checking WhatsApp groups.',
                  'Know the exact minute your child arrives safely at the campus drop-off gate.',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 bg-[#006B2F] hover:bg-[#005525] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Join as a Parent
                </button>
              </div>
            </div>

            {/* Right: Parent App Feature Tabs Mock */}
            <div className="lg:col-span-6 bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-200">
              {/* Tab Selector */}
              <div className="flex border-b border-slate-200 mb-6 gap-4 text-xs font-semibold">
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
              {activeParentTab === 'status' && (
                <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-slate-500">Child Commute</p>
                      <h4 className="font-bold text-slate-900 text-sm">Tanvik — Morning School Trip</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
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
                <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
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
                <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Child Not Attending School Today?</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Inform the driver and school with a single tap. The driver won’t wait outside your gate, keeping the route punctual for all children.
                    </p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg flex items-center justify-between text-xs text-amber-900 font-medium">
                    <span>Mark Tanvik as absent for today?</span>
                    <button className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] transition-colors">
                      Notify Driver
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 8. SCHOOL EXPERIENCE — OPERATIONAL CONTROL */}
      <section id="for-schools" className="py-20 lg:py-28 bg-[#FAFAF9]">
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
                <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 text-xs font-bold">
                  14 / 14 ACTIVE ROUTES
                </span>
              </div>

              {/* Metric Counters */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500">Children in Transit</span>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">428</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500">Active Vehicles</span>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">14</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
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
                  <div key={i} className="px-4 py-3 border-b border-slate-100 last:border-0 flex justify-between items-center">
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
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                School Transport Oversight
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                For schools, transportation becomes easier to see.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                School administrators and transport managers gain immediate, end-to-end visibility of every vehicle, route, and child. Coordinate drop-offs, reduce gate congestion, and communicate instantly with parents.
              </p>

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
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Explore TinyRide for Schools
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. DRIVER EXPERIENCE — DISTRACTION-FREE SIMPLICITY */}
      <section id="for-drivers" className="py-20 lg:py-28 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
                Driver Focused
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                For drivers, the job stays simple.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Drivers need to focus on the road, not fight with complicated software. TinyRide provides large buttons, clear sequential stops, and zero distractions while driving.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900">Fewer Taps</h4>
                  <p className="text-xs text-slate-500 mt-1">One tap to confirm boarding at each gate stop.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900">Clear Route Sequence</h4>
                  <p className="text-xs text-slate-500 mt-1">Next student address and photo shown in order.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900">No In-Cab Clutter</h4>
                  <p className="text-xs text-slate-500 mt-1">Zero chats or pop-up alerts while the vehicle is moving.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-sm text-slate-900">Automated Parent Alerts</h4>
                  <p className="text-xs text-slate-500 mt-1">Parents are notified 500m before arrival without the driver calling.</p>
                </div>
              </div>
            </div>

            {/* Right: Driver Interface Mockup */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-[300px] sm:w-[320px] rounded-3xl bg-slate-950 p-4 shadow-xl border-4 border-slate-800 text-white">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Driver In-Cab Mode
                </div>
                <div className="mt-1 flex justify-between items-baseline">
                  <h4 className="font-bold text-base text-white">Next: Stop 4 of 6</h4>
                  <span className="text-xs font-mono font-bold text-emerald-400">0.3 km</span>
                </div>

                {/* Stop Card */}
                <div className="mt-4 bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center justify-center font-bold text-sm">
                      TM
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">Tanvik Mathurthi</div>
                      <p className="text-xs text-slate-400">Gate 2 • Rainbow Vistas</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-xs">
                    <span className="text-slate-400">SafeKey Token:</span>
                    <span className="font-mono font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                      482-910
                    </span>
                  </div>
                </div>

                {/* Large Action Button for Stop */}
                <div className="mt-4 space-y-2">
                  <button className="w-full py-3.5 bg-[#006B2F] hover:bg-[#005525] text-white font-bold text-sm rounded-xl text-center shadow-sm transition-colors">
                    ✓ Confirm Boarding
                  </button>
                  <p className="text-[10px] text-center text-slate-500">
                    Auto-advances to Stop 5 once confirmed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. LARGE MAP SECTION — RICH VISUALIZATION */}
      <section className="py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
              Live Fleet Routing
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
              Clear routes. Verified at every turn.
            </h2>
            <p className="text-base text-slate-600 max-w-xl mx-auto">
              Real-time route geometry connecting home, neighborhood pickup stops, and the school campus.
            </p>
          </div>

          {/* Interactive Map Visual with Floating HUD Panel */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-lg bg-slate-900 h-[380px] sm:h-[460px]">
            {/* Vector Map Canvas */}
            <svg className="w-full h-full object-cover" viewBox="0 0 1000 500" fill="none">
              {/* Dark mode transportation grid */}
              <rect width="1000" height="500" fill="#0B1329" />
              
              {/* Secondary roads */}
              <line x1="0" y1="120" x2="1000" y2="120" stroke="#1E293B" strokeWidth="2" />
              <line x1="0" y1="260" x2="1000" y2="260" stroke="#1E293B" strokeWidth="2" />
              <line x1="0" y1="380" x2="1000" y2="380" stroke="#1E293B" strokeWidth="2" />
              <line x1="250" y1="0" x2="250" y2="500" stroke="#1E293B" strokeWidth="2" />
              <line x1="500" y1="0" x2="500" y2="500" stroke="#1E293B" strokeWidth="2" />
              <line x1="750" y1="0" x2="750" y2="500" stroke="#1E293B" strokeWidth="2" />

              {/* Major Highway Artery */}
              <path
                d="M 50 450 C 200 400, 300 200, 500 260 C 700 320, 800 100, 950 80"
                stroke="#1E293B"
                strokeWidth="16"
                strokeLinecap="round"
              />

              {/* Active TinyRide School Route Path */}
              <path
                d="M 120 400 L 280 400 L 380 260 L 620 260 L 720 140 L 880 140"
                stroke="#006B2F"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Stop 1 (Depot) */}
              <circle cx="120" cy="400" r="8" fill="#006B2F" />
              <text x="120" y="425" textAnchor="middle" fontSize="11" fill="#94A3B8" fontWeight="bold">
                Depot (07:15)
              </text>

              {/* Stop 2 (Pickup A) */}
              <circle cx="280" cy="400" r="7" fill="#006B2F" />
              <text x="280" y="425" textAnchor="middle" fontSize="11" fill="#94A3B8">
                Stop 1
              </text>

              {/* Stop 3 (Pickup B — Tanvik) */}
              <circle cx="380" cy="260" r="9" fill="#006B2F" />
              <circle cx="380" cy="260" r="16" stroke="#006B2F" strokeWidth="2" strokeOpacity="0.4" />
              <text x="380" y="295" textAnchor="middle" fontSize="12" fill="#34D399" fontWeight="bold">
                Home (Stop 4)
              </text>

              {/* Moving Vehicle */}
              <g transform="translate(520, 260)">
                <circle cx="0" cy="0" r="14" fill="#006B2F" />
                <circle cx="0" cy="0" r="22" stroke="#34D399" strokeWidth="2" strokeDasharray="4 4" />
                <text x="0" y="5" textAnchor="middle" fontSize="12" fill="white">🚐</text>
              </g>

              {/* Stop 5 (Pickup C) */}
              <circle cx="720" cy="140" r="7" fill="#006B2F" />
              <text x="720" y="120" textAnchor="middle" fontSize="11" fill="#94A3B8">
                Stop 5
              </text>

              {/* Final Destination (School Campus) */}
              <g transform="translate(880, 140)">
                <circle cx="0" cy="0" r="12" fill="#FFFFFF" />
                <text x="0" y="4" textAnchor="middle" fontSize="12">🏫</text>
                <text x="0" y="-18" textAnchor="middle" fontSize="13" fill="#FFFFFF" fontWeight="bold">
                  Oakridge Campus Bay
                </text>
              </g>
            </svg>

            {/* Floating Information Panel on Map */}
            <div className="absolute bottom-6 left-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-5 border border-slate-200/90 shadow-xl max-w-xs text-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Live Telemetry
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  ON SCHEDULE
                </span>
              </div>
              <h4 className="mt-1 font-bold text-base text-slate-900">Tanvik’s Ride • Route 04</h4>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Current ETA:</span>
                  <strong className="text-slate-900">7 min away (8:35 AM)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Driver:</span>
                  <strong className="text-slate-900">Ravi Kumar (TS09-TR-102)</strong>
                </div>
                <div className="flex justify-between">
                  <span>Next Stop:</span>
                  <strong className="text-slate-900">Rainbow Colony Gate 2</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. ECOSYSTEM SECTION — CONNECTED TRANSPORTATION */}
      <section className="py-20 lg:py-28 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
              The Connected Ecosystem
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
              One connected transportation experience.
            </h2>
            <p className="text-base text-slate-600 max-w-xl mx-auto">
              TinyRide bridges parents, children, drivers, and schools into one coordinated loop — eliminating miscommunication.
            </p>
          </div>

          {/* Elegant Circular / Network Hub Representation */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#FAFAF9] p-6 rounded-2xl border border-slate-200/90 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 font-bold text-lg mx-auto flex items-center justify-center">
                👨‍👩‍👧
              </div>
              <h3 className="font-bold text-base text-slate-900">Parents</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Live location, boarding alerts, and verified driver details in one calm view.
              </p>
            </div>

            <div className="bg-[#FAFAF9] p-6 rounded-2xl border border-slate-200/90 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 font-bold text-lg mx-auto flex items-center justify-center">
                🎒
              </div>
              <h3 className="font-bold text-base text-slate-900">Children</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                SafeKey token verification at pickup and designated gate drop-off at school.
              </p>
            </div>

            <div className="bg-[#FAFAF9] p-6 rounded-2xl border border-slate-200/90 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 font-bold text-lg mx-auto flex items-center justify-center">
                🚐
              </div>
              <h3 className="font-bold text-base text-slate-900">Drivers</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clear stop sequence, one-tap check-in, and zero behind-the-wheel phone calls.
              </p>
            </div>

            <div className="bg-[#FAFAF9] p-6 rounded-2xl border border-slate-200/90 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-800 font-bold text-lg mx-auto flex items-center justify-center">
                🏫
              </div>
              <h3 className="font-bold text-base text-slate-900">Schools</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Live fleet oversight, bus bay arrival pacing, and fewer front-desk queries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 12. SAFETY / TRUST SECTION — GROUNDED & FACTUAL */}
      <section id="safety" className="py-20 lg:py-28 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
              Information Transparency
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
              Built around the journey that matters.
            </h2>
            <p className="text-base text-slate-600 max-w-xl mx-auto">
              Real reassurance comes from verified facts, not inflated promises. Here is exactly what parents and schools can see at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="text-emerald-700 font-bold text-sm">01. Verified Driver Identity</div>
              <h4 className="font-bold text-base text-slate-900">Know Who Is Driving</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Assigned driver profile, photo, driving record, and direct phone link available inside the app.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="text-emerald-700 font-bold text-sm">02. Assigned Vehicle Details</div>
              <h4 className="font-bold text-base text-slate-900">Specific Vehicle Number</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Exact registration plate, vehicle model, and seating capacity confirmed before pickup begins.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="text-emerald-700 font-bold text-sm">03. Route Geometry</div>
              <h4 className="font-bold text-base text-slate-900">Designated School Path</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The vehicle follows pre-approved school transport paths, with deviation awareness.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="text-emerald-700 font-bold text-sm">04. Boarding Confirmation</div>
              <h4 className="font-bold text-base text-slate-900">SafeKey Token Verification</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                A verified digital handshake confirms the student is physically in the vehicle before departure.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="text-emerald-700 font-bold text-sm">05. Campus Gate Drop-Off</div>
              <h4 className="font-bold text-base text-slate-900">Campus Entry Timestamp</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Recorded entry into the designated school bay gives instant confirmation that morning arrival is complete.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
              <div className="text-emerald-700 font-bold text-sm">06. Absence Coordination</div>
              <h4 className="font-bold text-base text-slate-900">One-Tap Absence Alerts</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Instantly notify the driver if your child is sick so the bus does not idle outside your home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 13. FINAL CONVERSION CTA — PREMIUM DARK SECTION */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-950 text-white rounded-3xl p-10 sm:p-14 lg:p-18 text-center relative overflow-hidden shadow-2xl">
            {/* Background subtle road glow */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <svg className="w-full h-full" viewBox="0 0 1000 400" fill="none">
                <path d="M-100 200 Q400 100 600 300 T1100 200" stroke="#34D399" strokeWidth="4" />
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
                Less guessing. Better visibility. A smoother everyday journey for parents, drivers, and schools.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#006B2F] hover:bg-[#005525] text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  Get Started
                </button>
                <a
                  href="#for-schools"
                  className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm rounded-lg transition-colors"
                >
                  Talk to Your School
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 14. FOOTER */}
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
                <li><a href="#safety" className="hover:text-emerald-800 transition-colors">Safety</a></li>
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

      {/* 15. INTERACTIVE "GET STARTED" MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
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
                    className="w-full py-3 bg-[#006B2F] hover:bg-[#005525] text-white font-bold text-xs rounded-lg shadow-sm transition-colors mt-2"
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
