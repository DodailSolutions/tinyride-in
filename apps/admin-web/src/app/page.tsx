'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function TinyRideLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [formData, setFormData] = useState({
    parentName: '',
    phone: '',
    schoolName: 'Delhi Public School',
    area: 'Jubilee Hills',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalSuccess(true);
    setTimeout(() => {
      setModalSuccess(false);
      setIsModalOpen(false);
      setFormData({ parentName: '', phone: '', schoolName: 'Delhi Public School', area: 'Jubilee Hills' });
    }, 2400);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Header / Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-none border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/brand/logo-horizontal.png"
              alt="TinyRide — Little Rides. Big Peace of Mind."
              className="h-10 sm:h-11 w-auto object-contain"
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#how-it-works" className="hover:text-emerald-800 transition-colors">
              How It Works
            </a>
            <a href="#for-parents" className="hover:text-emerald-800 transition-colors">
              For Parents
            </a>
            <a href="#safety" className="hover:text-emerald-800 transition-colors">
              Safety
            </a>
            <a href="#for-schools" className="hover:text-emerald-800 transition-colors">
              For Schools
            </a>
            <a href="#contact" className="hover:text-emerald-800 transition-colors">
              Contact
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/ops"
              className="text-xs font-semibold px-3 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Operations Portal
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm font-bold px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md shadow-xs transition-colors"
            >
              Get Started
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 rounded-md hover:bg-slate-100"
            aria-label="Toggle navigation menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-emerald-800"
            >
              How It Works
            </a>
            <a
              href="#for-parents"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-emerald-800"
            >
              For Parents
            </a>
            <a
              href="#safety"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-emerald-800"
            >
              Safety
            </a>
            <a
              href="#for-schools"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-emerald-800"
            >
              For Schools
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/ops"
                className="w-full text-center py-2.5 text-xs font-semibold bg-slate-100 text-slate-800 rounded-md"
              >
                Operations Portal
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsModalOpen(true);
                }}
                className="w-full py-3 text-sm font-bold bg-emerald-800 text-white rounded-md"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section */}
      <section className="pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Core Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse" />
                School Transportation Platform
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
                School rides, <br className="hidden sm:inline" />
                without the worry.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Know when your child's ride is arriving, who is driving, and when they reach school — all from one simple app.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-7 py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-base rounded-md shadow-xs transition-colors text-center"
                >
                  Get Started
                </button>
                <a
                  href="#how-it-works"
                  className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-base rounded-md border border-slate-200 transition-colors text-center"
                >
                  See How It Works
                </a>
              </div>

              {/* Micro-Trust Signals */}
              <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">✓</span> Verified Drivers &amp; Vehicles
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">✓</span> SafeKey Handover Verification
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">✓</span> Direct School Gate Sync
                </div>
              </div>
            </div>

            {/* Right Column: Realistic Product UI Mockup (NOT AI stock image!) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-[360px] sm:max-w-[380px] bg-white rounded-2xl border-4 border-slate-900 shadow-xl overflow-hidden relative">
                {/* Phone Speaker & Camera Notch */}
                <div className="bg-slate-900 h-6 flex items-center justify-center">
                  <div className="w-14 h-3.5 bg-slate-800 rounded-full" />
                </div>

                {/* Parent App Screen UI */}
                <div className="p-4 bg-slate-50 space-y-3 font-sans">
                  {/* Status Header */}
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                    <div>
                      <div className="text-[11px] text-slate-500 font-semibold uppercase">Good morning</div>
                      <div className="text-sm font-bold text-slate-900">Priya Sharma</div>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded text-[11px] font-bold text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                      Live Ride
                    </div>
                  </div>

                  {/* Child Selector Tabs */}
                  <div className="flex gap-2 bg-slate-200 p-1 rounded-md text-xs font-semibold">
                    <div className="flex-1 text-center py-1.5 bg-white text-slate-900 rounded shadow-xs">
                      Tanvik (Grade 3A)
                    </div>
                    <div className="flex-1 text-center py-1.5 text-slate-600">
                      Ananya (Grade 1B)
                    </div>
                  </div>

                  {/* Trip Card with SafeKey */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-base font-extrabold text-slate-900">Tanvik's ride is 7 min away</div>
                        <div className="text-xs text-slate-500">ETA: 8:35 AM • Delhi Public School</div>
                      </div>
                      <div className="p-1.5 bg-emerald-50 border border-dashed border-emerald-700 rounded text-center">
                        <div className="text-[9px] font-bold text-emerald-800 uppercase">SafeKey</div>
                        <div className="text-xs font-extrabold text-slate-900 font-mono tracking-wider">482-910</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex justify-between items-center">
                      <span>Vehicle: <strong>TS09-TR-102</strong></span>
                      <span className="text-emerald-800 font-semibold">Stop 3 of 6</span>
                    </div>
                  </div>

                  {/* Vector Map Preview */}
                  <div className="bg-[#EBF3EB] rounded-lg border border-slate-200 p-3 h-32 relative overflow-hidden flex flex-col justify-between">
                    <div className="text-[10px] font-bold text-slate-600 uppercase">Route M-04 • Road No. 36</div>
                    <div className="relative flex items-center justify-between">
                      <div className="text-center">
                        <div className="w-3 h-3 rounded-full bg-slate-900 mx-auto" />
                        <span className="text-[9px] font-semibold text-slate-800">Home</span>
                      </div>
                      <div className="flex-1 h-1 bg-emerald-600 mx-2 relative">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-900 text-white text-[8px] font-bold rounded">
                          TR-102
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-700 mx-auto" />
                        <span className="text-[9px] font-semibold text-emerald-800">School</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-600 flex justify-between">
                      <span>Speed: 24 km/h</span>
                      <span className="font-semibold text-slate-900">Approaching Gate</span>
                    </div>
                  </div>

                  {/* Driver Card */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        RK
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Ravi Kumar ★ 4.92</div>
                        <div className="text-[11px] text-slate-500">Bajaj RE Electric (6-seater)</div>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      📞
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Trust Strip (Product Capabilities, No Fake Claims) */}
      <section className="bg-slate-50 border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-3">
              <div className="text-emerald-800 font-bold text-base sm:text-lg">Real-Time GPS</div>
              <div className="text-xs text-slate-600 mt-1">Live location &amp; dynamic ETA updates</div>
            </div>
            <div className="p-3">
              <div className="text-emerald-800 font-bold text-base sm:text-lg">Verified Identity</div>
              <div className="text-xs text-slate-600 mt-1">Driver &amp; vehicle paired before each run</div>
            </div>
            <div className="p-3">
              <div className="text-emerald-800 font-bold text-base sm:text-lg">SafeKey Token</div>
              <div className="text-xs text-slate-600 mt-1">Two-way verification at boarding</div>
            </div>
            <div className="p-3">
              <div className="text-emerald-800 font-bold text-base sm:text-lg">Gate Handover</div>
              <div className="text-xs text-slate-600 mt-1">Confirmed arrival with school staff</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Problem Section: Everyday Concerns */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Everyday Challenges
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Because school pickup shouldn't be a guessing game.
          </h2>
          <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Every morning and afternoon, parents navigate uncertainty with informal rides, uncoordinated delays, and zero visibility.
          </p>
        </div>

        {/* Concerns vs Clarity Grid */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Everyday Parent Concerns */}
          <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
              Without TinyRide: Daily Uncertainty
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold">✕</span>
                <span>Calling the driver repeatedly while standing on the curb in the rain.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold">✕</span>
                <span>Unannounced substitute drivers and unfamiliar vehicles.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold">✕</span>
                <span>No confirmation whether your child actually boarded or was left behind.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold">✕</span>
                <span>Waiting nervously until school hours end to know if they arrived safely.</span>
              </li>
            </ul>
          </div>

          {/* With TinyRide */}
          <div className="p-6 bg-emerald-50 rounded-lg border border-emerald-200 space-y-4">
            <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              With TinyRide: Complete Peace of Mind
            </h3>
            <ul className="space-y-3 text-sm text-emerald-950 font-medium">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-700 font-bold">✓</span>
                <span>Live map and proactive notification 5 minutes before the vehicle arrives.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-700 font-bold">✓</span>
                <span>Driver photo, background clearance, vehicle registration number verified.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-700 font-bold">✓</span>
                <span>SafeKey 6-digit OTP code verified at boarding before vehicle departs.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-700 font-bold">✓</span>
                <span>Instant arrival notification the second school gate staff logs intake.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Solution Section: 4 Core Capabilities */}
      <section id="for-parents" className="py-16 sm:py-24 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Core Capabilities
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Everything you need to stay informed.
            </h2>
            <p className="text-base text-slate-600">
              Four deliberate tools designed to give parents certainty from departure to classroom door.
            </p>
          </div>

          {/* Feature 1: Live Trip Tracking */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-xs">
            <div className="lg:col-span-6 space-y-4">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">01 • Real-Time Movement</div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Live vehicle tracking on a clear, uncluttered map.
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                See where the vehicle is right now, which stops precede yours, and an accurate arrival time calculated with live road conditions in Hyderabad.
              </p>
              <div className="text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
                ⚡ Automatically factors in Hyderabad Outer Ring Road &amp; Junction slowdowns.
              </div>
            </div>
            <div className="lg:col-span-6 bg-[#EBF3EB] rounded-lg p-5 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">Live GPS Stream</span>
                <span className="text-emerald-800 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">ETA 8:35 AM</span>
              </div>
              <div className="bg-white p-3 rounded border border-slate-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">Route M-04: Jubilee Hills Loop</div>
                <div className="text-slate-500">Currently at Road No. 36 • Vehicle TS09-TR-102 (Bajaj RE Electric)</div>
              </div>
            </div>
          </div>

          {/* Feature 2: Child Status & Boarding */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-xs">
            <div className="lg:col-span-6 order-2 lg:order-1 bg-slate-50 rounded-lg p-5 border border-slate-200 space-y-3">
              <div className="p-3 bg-white rounded border border-slate-200 text-xs flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">Tanvik Sharma</div>
                  <div className="text-slate-500">Grade 3A • Delhi Public School</div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[11px]">
                  Boarded ✓
                </span>
              </div>
              <div className="text-[11px] text-slate-500 text-center font-mono">
                SafeKey Verified: 07:36 AM at Villa 14, Rainbow Meadows
              </div>
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">02 • Boarding Assurance</div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Know the exact minute your child boards and arrives.
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                The driver verifies your child’s SafeKey code before taking off. When they reach the school gate, campus staff records their arrival into the roster.
              </p>
            </div>
          </div>

          {/* Feature 3: Driver & Vehicle Identity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-xs">
            <div className="lg:col-span-6 space-y-4">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">03 • Verified Credentials</div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Know who is driving and the exact vehicle.
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                No surprises. Driver name, photo, phone number, vehicle registration number, and make are shown directly on your home screen with a single tap to call.
              </p>
            </div>
            <div className="lg:col-span-6 bg-slate-50 rounded-lg p-5 border border-slate-200">
              <div className="bg-white p-4 rounded border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center">
                    RK
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900">Ravi Kumar (Verified Driver)</div>
                    <div className="text-xs text-slate-500">TS09-TR-102 • Bajaj RE Electric (6-seater)</div>
                  </div>
                </div>
                <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                  ★ 4.92 Rating
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Thoughtful Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-xs">
            <div className="lg:col-span-6 order-2 lg:order-1 bg-slate-50 rounded-lg p-5 border border-slate-200 space-y-2">
              <div className="p-3 bg-white rounded border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">"Your vehicle is 5 minutes away"</div>
                <div className="text-slate-500">7:30 AM • Rainbow Meadows Pickup Gate</div>
              </div>
              <div className="p-3 bg-white rounded border border-slate-200 text-xs">
                <div className="font-bold text-slate-900">"Tanvik reached Delhi Public School safely"</div>
                <div className="text-slate-500">8:04 AM • Verified at Gate 2 by School Staff</div>
              </div>
            </div>
            <div className="lg:col-span-6 order-1 lg:order-2 space-y-4">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">04 • Calm Communication</div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                Actionable updates without app-checking anxiety.
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Receive clear notifications only when it matters: when the vehicle approaches your gate, when your child boards, and when they arrive at school.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. How It Works (Connected Flow, NOT 3 Generic Cards) */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Simple 3-Step Process
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How TinyRide Works
            </h2>
            <p className="text-base text-slate-600">
              From onboarding to daily rides in under 5 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 relative">
              <div className="w-10 h-10 rounded bg-slate-900 text-white font-bold text-sm flex items-center justify-center mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Add your child
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Select your child’s school, grade, and set your regular home pickup and drop-off point.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 relative">
              <div className="w-10 h-10 rounded bg-emerald-800 text-white font-bold text-sm flex items-center justify-center mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Track their school ride
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Follow the live vehicle route in the morning and share the 6-digit SafeKey token with your driver.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 relative">
              <div className="w-10 h-10 rounded bg-slate-900 text-white font-bold text-sm flex items-center justify-center mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                Get notified when they arrive
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive an immediate notification as soon as school gate security confirms your child is on campus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Product Experience: Editorial Split Showcase */}
      <section className="py-16 sm:py-24 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Editorial message */}
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Product Experience
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Know what's happening, without making a call.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Designed to answer every safety question in seconds. Switch effortlessly between multiple children, log a student absence with one tap, or view today's complete milestone timeline.
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-sm text-slate-900">Multi-Child Switcher</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Manage siblings across different schools without cluttered duplicate dashboards.
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-sm text-slate-900">One-Tap Absence Reporting</div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Mark doctor visits or sick days so the driver doesn't wait at your gate and the school roster is updated.
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Timeline UI Demonstration */}
            <div className="lg:col-span-6 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-3">
                Live Journey Timeline Example
              </div>

              <div className="space-y-4 text-xs font-sans">
                <div className="flex items-start gap-4">
                  <span className="font-bold text-slate-900 w-12 text-right">07:15</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1" />
                  <div>
                    <div className="font-bold text-slate-900">Driver started route</div>
                    <div className="text-slate-500">Route M-04 dispatched from Banjara Hills Depot</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="font-bold text-slate-900 w-12 text-right">07:32</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1" />
                  <div>
                    <div className="font-bold text-slate-900">Vehicle approaching pickup</div>
                    <div className="text-slate-500">Stop 3: Villa 14, Rainbow Meadows</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="font-bold text-slate-900 w-12 text-right">07:36</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1" />
                  <div>
                    <div className="font-bold text-slate-900">Tanvik boarded</div>
                    <div className="text-slate-500">SafeKey OTP verified by Driver Ravi Kumar</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="font-bold text-emerald-800 w-12 text-right">08:04</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-800 mt-1 ring-4 ring-emerald-100" />
                  <div>
                    <div className="font-bold text-emerald-800">Arrived at Delhi Public School</div>
                    <div className="text-slate-500">Safely checked in at Gate 2 West Bay</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Safety Section: Fact-Based */}
      <section id="safety" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Safety Architecture
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Built around what matters most.
            </h2>
            <p className="text-base text-slate-600 max-w-2xl mx-auto">
              Every safety control is engineered into daily routines without friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <h3 className="text-base font-bold text-slate-900">SafeKey Handover OTP</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A daily dynamic 6-digit code shared between parent and driver. The vehicle software prevents departures until the valid code is confirmed.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <h3 className="text-base font-bold text-slate-900">Driver &amp; Vehicle Compliance</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Commercial driver licensing, police verification, and vehicle fitness certificates are verified by central operations before any route assignment.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <h3 className="text-base font-bold text-slate-900">School Gate Verification</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Campus security staff confirms each vehicle arrival and verifies child disembarkation against the school roster before bays are cleared.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <h3 className="text-base font-bold text-slate-900">Emergency &amp; Delay Watch</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Active route telemetry monitors speed and deviation. Dedicated 24/7 safety dispatchers immediately contact parents if traffic delays exceed 8 minutes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. For Schools */}
      <section id="for-schools" className="py-16 sm:py-20 bg-[#F8FAFC] border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 sm:p-12 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-3 max-w-xl">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">For Educational Institutions</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Better visibility for schools, too.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                School transport teams get live bus bay arrival boards, student attendance rosters, driver verification logs, and parent communication tools.
              </p>
            </div>

            <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto">
              <a
                href="http://localhost:3002"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-md text-center transition-colors"
              >
                Open School Gate Portal ↗
              </a>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm rounded-md text-center border border-slate-200 transition-colors"
              >
                Talk to TinyRide
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Driver Workflow Section */}
      <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Operator Simplicity
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Simple for drivers. Clear for parents.
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            A distraction-free in-cab interface designed for quick touches while safely stopped:
          </p>

          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-xs font-bold text-slate-800 pt-4">
            <span className="px-3.5 py-2 bg-slate-100 rounded border border-slate-200">Start Route</span>
            <span className="text-slate-400">→</span>
            <span className="px-3.5 py-2 bg-slate-100 rounded border border-slate-200">Arrive at Stop</span>
            <span className="text-slate-400">→</span>
            <span className="px-3.5 py-2 bg-emerald-100 text-emerald-900 rounded border border-emerald-300">Verify SafeKey</span>
            <span className="text-slate-400">→</span>
            <span className="px-3.5 py-2 bg-slate-100 rounded border border-slate-200">Arrive at School</span>
            <span className="text-slate-400">→</span>
            <span className="px-3.5 py-2 bg-slate-900 text-white rounded">Handover Complete</span>
          </div>
        </div>
      </section>

      {/* 11. Final Conversion Section */}
      <section className="py-20 sm:py-28 bg-[#0F172A] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready for simpler school rides?
          </h2>
          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
            Give parents the visibility they need, without adding complexity to the daily routine.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-base rounded-md shadow-md transition-colors"
            >
              Get Started with TinyRide
            </button>
            <a
              href="#contact"
              className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base rounded-md border border-slate-700 transition-colors"
            >
              Contact School Operations
            </a>
          </div>
        </div>
      </section>

      {/* 12. Footer */}
      <footer id="contact" className="bg-white border-t border-slate-200 py-12 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Column 1: Brand */}
            <div className="space-y-3">
              <img
                src="/brand/logo-horizontal.png"
                alt="TinyRide by Dodail Solutions"
                className="h-9 w-auto object-contain"
              />
              <p className="text-xs text-slate-500 leading-relaxed">
                Little Rides. Big Peace of Mind.
              </p>
              <div className="text-[11px] text-slate-400">
                Dodail Solutions Private Limited <br />
                Hyderabad, Telangana, India
              </div>
            </div>

            {/* Column 2: Product */}
            <div className="space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Product</div>
              <div><a href="#how-it-works" className="hover:text-emerald-800">How It Works</a></div>
              <div><a href="#for-parents" className="hover:text-emerald-800">For Parents</a></div>
              <div><a href="#safety" className="hover:text-emerald-800">Safety &amp; Compliance</a></div>
              <div><a href="#for-schools" className="hover:text-emerald-800">For Schools</a></div>
            </div>

            {/* Column 3: Platform Portals */}
            <div className="space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Portals</div>
              <div><Link href="/ops" className="hover:text-emerald-800">Central Operations Console</Link></div>
              <div><a href="http://localhost:3002" className="hover:text-emerald-800">School Gate Console</a></div>
              <div><a href="http://localhost:3000/api/docs" className="hover:text-emerald-800">Developer API Docs</a></div>
            </div>

            {/* Column 4: Contact & Support */}
            <div className="space-y-2">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Contact</div>
              <div>support@tinyride.in</div>
              <div>Toll-free Safety Desk: 1800-055-5999</div>
              <div className="text-[11px] text-slate-400 pt-2">
                Hours: Mon – Sat, 6:00 AM – 7:00 PM IST
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Dodail Solutions Private Limited. All rights reserved.
            </div>
            <div className="flex gap-6">
              <span className="hover:text-slate-800 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-800 cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 13. Interactive Early Access / Onboarding Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-none flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
              aria-label="Close dialog"
            >
              ✕
            </button>

            {modalSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center font-bold text-xl">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-slate-900">Thank you, {formData.parentName || 'Parent'}!</h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Our Hyderabad transport coordinator will contact you at <strong>{formData.phone}</strong> regarding route availability for {formData.schoolName}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Join TinyRide</div>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">Get Started with TinyRide</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Check route availability and driver pairing for your child's school.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded focus:outline-none focus:border-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone (WhatsApp)</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded focus:outline-none focus:border-emerald-700 font-mono text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">School</label>
                    <select
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="Delhi Public School">DPS Khajaguda</option>
                      <option value="Oakridge International">Oakridge Gachibowli</option>
                      <option value="Chirec International">Chirec Kondapur</option>
                      <option value="Silver Oaks">Silver Oaks Bachupally</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Locality</label>
                    <select
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 border border-slate-300 rounded bg-white"
                    >
                      <option value="Jubilee Hills">Jubilee Hills</option>
                      <option value="Banjara Hills">Banjara Hills</option>
                      <option value="Madhapur">Madhapur</option>
                      <option value="Gachibowli">Gachibowli</option>
                      <option value="Kondapur">Kondapur</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded shadow-xs transition-colors mt-2"
                >
                  Submit &amp; Check Availability
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
