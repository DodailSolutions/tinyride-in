'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface TinyRideIPhoneProps {
  mode?: 'parent_tracking' | 'driver';
  className?: string;
}

export function TinyRideIPhone({ mode = 'parent_tracking', className = '' }: TinyRideIPhoneProps) {
  // Path references for real-time SVG traversal
  const pathRef = useRef<SVGPathElement>(null);
  const completedPathRef = useRef<SVGPathElement>(null);
  const vehicleGroupRef = useRef<SVGGElement>(null);

  // High-level reactive state for UI labels
  const [trackingState, setTrackingState] = useState({
    stage: 'en_route',
    etaMinutes: 12,
    etaLabel: '8:04 AM',
    statusBadge: 'BOARDED',
    subText: 'En route to school',
    remainingDistance: '4.2 km',
    locationSubtext: 'Road No. 36 • Traffic: Clear',
    speed: 34,
    progressPercent: 35,
  });

  const [atStopHighlight, setAtStopHighlight] = useState(false);
  const [driverStep, setDriverStep] = useState(2); // for driver mode

  // SVG route path coordinates (viewBox 0 0 315 210)
  // depot (25, 45) -> curve to stop (165, 145) -> curve to school (288, 65)
  const ROUTE_PATH = "M 25,45 C 65,45 90,42 120,55 C 138,62 145,85 150,105 C 154,124 158,142 168,145 C 185,148 206,132 222,110 C 238,88 252,65 288,65";

  const STOP_PROGRESS = 0.46; // Parent's stop
  const SCHOOL_PROGRESS = 0.98; // School arrival

  useEffect(() => {
    if (mode !== 'parent_tracking') return;

    const path = pathRef.current;
    const completedPath = completedPathRef.current;
    const vehicle = vehicleGroupRef.current;
    if (!path || !completedPath || !vehicle) return;

    let pathLength = 0;
    try {
      pathLength = path.getTotalLength();
    } catch {
      return;
    }

    completedPath.style.strokeDasharray = `${pathLength}`;
    completedPath.style.strokeDashoffset = `${pathLength}`;

    let animationFrameId: number;
    let lastTimestamp = performance.now();
    let currentProgress = 0.08;
    let currentAngle = 0;
    let pauseRemaining = 0;
    let stageLock: 'none' | 'at_stop' | 'arrived' = 'none';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const distance = STOP_PROGRESS * 0.7 * pathLength;
      const pt = path.getPointAtLength(distance);
      vehicle.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
      completedPath.style.strokeDashoffset = `${pathLength * (1 - STOP_PROGRESS * 0.7)}`;
      return;
    }

    const animate = (now: number) => {
      const deltaTime = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      if (pauseRemaining > 0) {
        pauseRemaining -= deltaTime;
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      let speed = 0.034;
      if (currentProgress > 0.38 && currentProgress < STOP_PROGRESS) {
        speed = 0.022; // slow down approaching stop
      } else if (currentProgress > 0.90 && currentProgress < SCHOOL_PROGRESS) {
        speed = 0.02; // slow down approaching school
      }

      currentProgress += speed * deltaTime;

      // MILESTONE 1: Stop Arrival
      if (currentProgress >= STOP_PROGRESS && stageLock === 'none') {
        stageLock = 'at_stop';
        currentProgress = STOP_PROGRESS;
        pauseRemaining = 3.0; // 3s pause
        setAtStopHighlight(true);

        setTrackingState({
          stage: 'at_stop',
          etaMinutes: 0,
          etaLabel: '8:35 AM',
          statusBadge: 'AT GATE',
          subText: 'Tanvik boarding TR-102',
          remainingDistance: 'Gate 2',
          locationSubtext: 'Rainbow Vistas Gate 2',
          speed: 0,
          progressPercent: 46,
        });

        setTimeout(() => {
          setTrackingState((prev) => ({
            ...prev,
            statusBadge: 'BOARDED',
            subText: 'Child boarded • SafeKey 482-910 verified',
          }));
        }, 1500);
      }

      // MILESTONE 2: Leave stop
      if (currentProgress > STOP_PROGRESS && stageLock === 'at_stop') {
        stageLock = 'none';
        setAtStopHighlight(false);
      }

      // MILESTONE 3: School Arrival
      if (currentProgress >= SCHOOL_PROGRESS && stageLock === 'none') {
        stageLock = 'arrived';
        currentProgress = SCHOOL_PROGRESS;
        pauseRemaining = 3.5;

        setTrackingState({
          stage: 'arrived',
          etaMinutes: 0,
          etaLabel: 'Arrived',
          statusBadge: 'ARRIVED',
          subText: 'Arrived at Oakridge School',
          remainingDistance: 'Bay 3',
          locationSubtext: 'Drop-off Complete • Bay 3',
          speed: 0,
          progressPercent: 100,
        });
      }

      // MILESTONE 4: Reset loop
      if (currentProgress >= 1.0) {
        currentProgress = 0.02;
        stageLock = 'none';
        setTrackingState({
          stage: 'en_route',
          etaMinutes: 12,
          etaLabel: '8:04 AM',
          statusBadge: 'BOARDED',
          subText: 'En route to school',
          remainingDistance: '4.2 km',
          locationSubtext: 'Road No. 36 • Traffic: Clear',
          speed: 34,
          progressPercent: 10,
        });
      }

      // Telemetry update while en route
      if (stageLock === 'none') {
        if (currentProgress < STOP_PROGRESS) {
          const rem = Math.max(1, Math.round((STOP_PROGRESS - currentProgress) * 15));
          setTrackingState((prev) => ({
            ...prev,
            stage: 'en_route',
            etaMinutes: rem,
            etaLabel: '8:35 AM',
            statusBadge: 'APPROACHING',
            subText: `Arriving in ${rem} min at your gate`,
            remainingDistance: `${((STOP_PROGRESS - currentProgress) * 4).toFixed(1)} km`,
            locationSubtext: currentProgress < 0.25 ? 'Approaching Road No. 36' : 'Approaching Rainbow Vistas',
            speed: 32,
            progressPercent: Math.round(currentProgress * 100),
          }));
        } else {
          const rem = Math.max(1, Math.round((1 - currentProgress) * 14));
          setTrackingState((prev) => ({
            ...prev,
            stage: 'to_school',
            etaMinutes: rem,
            etaLabel: '8:04 AM',
            statusBadge: 'BOARDED',
            subText: `En route to school • ${rem} min away`,
            remainingDistance: `${((1 - currentProgress) * 5.2).toFixed(1)} km`,
            locationSubtext: 'Expressway Flyover • Speed: 36 km/h',
            speed: 36,
            progressPercent: Math.round(currentProgress * 100),
          }));
        }
      }

      // Path point & heading calculation
      const distance = Math.max(0, Math.min(currentProgress * pathLength, pathLength));
      const pt = path.getPointAtLength(distance);
      const nextPt = path.getPointAtLength(Math.min(distance + 1.5, pathLength));
      const dx = nextPt.x - pt.x;
      const dy = nextPt.y - pt.y;
      const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      currentAngle = currentAngle + (targetAngle - currentAngle) * 0.25;

      vehicle.setAttribute('transform', `translate(${pt.x}, ${pt.y}) rotate(${currentAngle})`);
      completedPath.style.strokeDashoffset = `${pathLength * (1 - currentProgress)}`;

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [mode]);

  return (
    <div className={`relative inline-block ${className}`}>
      {/* 1. PHYSICAL IPHONE CHASSIS (Titanium Midnight Bezel & Buttons) */}
      <div className="relative w-[310px] sm:w-[335px] h-[660px] sm:h-[690px] rounded-[50px] sm:rounded-[54px] bg-[#121316] p-[10px] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.38),0_10px_25px_-5px_rgba(0,0,0,0.18)] ring-1 ring-white/20 select-none">
        
        {/* Left Physical Buttons (Action button, Volume Up, Volume Down) */}
        <div className="absolute -left-[2.5px] top-[108px] w-[3px] h-[22px] bg-[#2E3138] rounded-l-xs shadow-inner"></div>
        <div className="absolute -left-[2.5px] top-[145px] w-[3px] h-[40px] bg-[#2E3138] rounded-l-xs shadow-inner"></div>
        <div className="absolute -left-[2.5px] top-[198px] w-[3px] h-[40px] bg-[#2E3138] rounded-l-xs shadow-inner"></div>

        {/* Right Physical Button (Side Power key) */}
        <div className="absolute -right-[2.5px] top-[155px] w-[3px] h-[55px] bg-[#2E3138] rounded-r-xs shadow-inner"></div>

        {/* 2. IPHONE OLED SCREEN (9:19.5 Tall Aspect Ratio with 44px inner corners) */}
        <div className="relative w-full h-full rounded-[42px] sm:rounded-[46px] bg-[#FAFAF9] overflow-hidden flex flex-col justify-between text-slate-800 text-xs shadow-inner">
          
          {/* TOP AREA: Dynamic Island & iOS Status Bar */}
          <div className="relative z-30 pt-3 px-6 pb-1 bg-white border-b border-slate-100">
            {/* Dynamic Island Pill */}
            <div className="w-[100px] h-[24px] bg-black rounded-full mx-auto flex items-center justify-between px-3 shadow-md">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-[#0A1A2F]"></div>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#183B25]"></div>
            </div>

            {/* iOS Status Indicators */}
            <div className="flex justify-between items-center text-[10.5px] font-semibold text-slate-800 pt-1 px-1">
              <span>8:28</span>
              <div className="flex items-center gap-1.5 text-slate-600">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z" />
                </svg>
                <span className="font-bold text-[9px]">5G</span>
                <div className="w-5 h-2.5 border border-slate-700 rounded-xs p-0.5 flex items-center">
                  <div className="w-3 h-1.5 bg-slate-800 rounded-2xs"></div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN SCREEN CONTENT: REAL TINYRIDE APPLICATION */}
          {mode === 'parent_tracking' ? (
            <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white">
              
              {/* Parent App Header */}
              <div className="px-4 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-slate-900 text-xs">Tanvik Mathurthi</span>
                  </div>
                  <p className="text-[10px] text-slate-500">Grade 3A • Route 04 (Oakridge)</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200/60">
                  {trackingState.statusBadge}
                </span>
              </div>

              {/* ETA & Status Panel */}
              <div className="px-4 py-3 bg-gradient-to-b from-emerald-50/60 to-white border-b border-slate-100">
                <div className="flex items-baseline justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      ETA {trackingState.etaLabel}
                    </div>
                    <div className="text-xl font-bold text-slate-900 leading-tight">
                      {trackingState.etaMinutes > 0 ? `${trackingState.etaMinutes} min remaining` : 'At your stop'}
                    </div>
                    <p className="text-[10.5px] text-slate-600 font-medium mt-0.5">
                      {trackingState.subText}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-slate-400 uppercase font-semibold">Distance</span>
                    <div className="text-xs font-mono font-bold text-slate-700">
                      {trackingState.remainingDistance}
                    </div>
                    <div className="text-[9.5px] text-slate-500">{trackingState.speed} km/h</div>
                  </div>
                </div>

                {/* Progress Timeline Track */}
                <div className="mt-2.5 relative">
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(10, trackingState.progressPercent))}%` }}
                      className="h-full bg-[#006B2F] rounded-full transition-all duration-300"
                    ></div>
                  </div>
                  <div className="mt-1 flex justify-between text-[8.5px] text-slate-500 font-medium">
                    <span>Depot 7:15</span>
                    <span className={trackingState.progressPercent >= 46 && trackingState.progressPercent < 90 ? 'text-[#006B2F] font-bold' : ''}>
                      Your Stop 8:35
                    </span>
                    <span className={trackingState.progressPercent >= 90 ? 'text-[#006B2F] font-bold' : ''}>
                      School 8:50
                    </span>
                  </div>
                </div>
              </div>

              {/* REAL-TIME VECTOR MAP WITH CURVED PATH TRAVERSAL */}
              <div className="relative flex-1 min-h-[220px] bg-[#F1F5F9] overflow-hidden">
                <svg
                  className="w-full h-full object-cover"
                  viewBox="0 0 315 210"
                  fill="none"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <rect width="315" height="210" fill="#F1F5F9" />

                  {/* Topography: Parks & Water */}
                  <path d="M10 25 Q70 15 95 65 T35 140 Z" fill="#DCFCE7" opacity="0.5" />
                  <path d="M210 130 Q250 150 280 120 L315 210 L190 210 Z" fill="#E0F2FE" opacity="0.6" />

                  {/* City Road Network Grid */}
                  <line x1="0" y1="45" x2="315" y2="45" stroke="#E2E8F0" strokeWidth="6" />
                  <line x1="0" y1="145" x2="315" y2="145" stroke="#E2E8F0" strokeWidth="6" />
                  <line x1="120" y1="0" x2="120" y2="210" stroke="#E2E8F0" strokeWidth="6" />
                  <line x1="220" y1="0" x2="220" y2="210" stroke="#E2E8F0" strokeWidth="6" />

                  {/* Upcoming Route (Muted Slate) */}
                  <path
                    ref={pathRef}
                    d={ROUTE_PATH}
                    stroke="#CBD5E1"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Completed Route (Emerald Trail) */}
                  <path
                    ref={completedPathRef}
                    d={ROUTE_PATH}
                    stroke="#006B2F"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Stop Marker: YOUR STOP (Home • 8:35 AM) */}
                  <g
                    transform="translate(168, 145)"
                    className={`transition-transform duration-300 ${
                      atStopHighlight ? 'scale-110' : 'scale-100'
                    }`}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r="13"
                      stroke="#006B2F"
                      strokeWidth="1.5"
                      fill="none"
                      className={atStopHighlight ? 'animate-ping opacity-60' : 'opacity-25'}
                    />
                    <circle cx="0" cy="0" r="5.5" fill="#006B2F" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x="0" y="16" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#006B2F">
                      YOUR STOP
                    </text>
                    <text x="0" y="24" textAnchor="middle" fontSize="6.5" fontWeight="500" fill="#64748B">
                      8:35 AM
                    </text>
                  </g>

                  {/* Destination: Oakridge Campus Bay */}
                  <g transform="translate(288, 65)">
                    <circle cx="0" cy="0" r="6.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x="0" y="3.5" textAnchor="middle" fontSize="7.5" fill="white">
                      🏫
                    </text>
                    <text x="0" y="-10" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0F172A">
                      Oakridge
                    </text>
                  </g>

                  {/* Physical Moving Vehicle */}
                  <g ref={vehicleGroupRef} style={{ willChange: 'transform' }}>
                    <circle
                      cx="0"
                      cy="0"
                      r="14"
                      stroke="#006B2F"
                      strokeWidth="1.5"
                      fill="none"
                      strokeOpacity="0.4"
                      className="animate-marker-pulse"
                    />
                    <ellipse cx="0" cy="1" rx="9" ry="5.5" fill="#000000" opacity="0.25" />
                    <rect
                      x="-8"
                      y="-4.5"
                      width="16"
                      height="9"
                      rx="2.5"
                      fill="#006B2F"
                      stroke="#FFFFFF"
                      strokeWidth="1"
                    />
                    <rect x="4" y="-3.5" width="2.5" height="7" rx="1" fill="#E2E8F0" />
                    <rect x="-7" y="-3.5" width="1.5" height="7" rx="0.5" fill="#E2E8F0" />
                    <rect x="-3.5" y="-4" width="6" height="1.5" fill="#CBD5E1" />
                    <rect x="-3.5" y="2.5" width="6" height="1.5" fill="#CBD5E1" />
                  </g>
                </svg>

                {/* Live Location Floating HUD */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-xs rounded-xl px-2.5 py-1.5 shadow-sm border border-slate-200/90 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-slate-800">● LIVE LOCATION</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 truncate max-w-[140px] font-medium">
                      {trackingState.locationSubtext}
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                    TS09-TR-102
                  </span>
                </div>
              </div>

              {/* Driver Footer Card */}
              <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                    RK
                  </div>
                  <div>
                    <div className="flex items-center gap-1 font-semibold text-slate-900 text-xs">
                      Ravi Kumar
                      <span className="text-emerald-700 font-bold" title="Verified Driver">✓</span>
                    </div>
                    <p className="text-[10px] text-slate-500">TR-102 • Force Traveller</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block font-medium">Handover Token</span>
                  <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                    482-910
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* DRIVER IN-CAB WORKFLOW MODE */
            <div className="flex-1 flex flex-col justify-between p-4 bg-slate-950 text-white">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    In-Cab Driver View
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                    ROUTE 04
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-400">Next Scheduled Stop</span>
                  <h3 className="text-base font-bold text-white mt-0.5">Stop 4 of 6: Rainbow Vistas</h3>
                  <p className="text-xs text-slate-400">Gate 2 • ETA 8:35 AM (0.4 km)</p>
                </div>

                <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-900/60 border border-emerald-700 flex items-center justify-center font-bold text-emerald-300 text-xs">
                      TM
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">Tanvik Mathurthi</h4>
                      <p className="text-[10.5px] text-slate-400">Grade 3A • Seat 4A</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-400">SafeKey Token:</span>
                    <span className="font-mono font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                      482-910
                    </span>
                  </div>
                </div>

                {/* Workflow Stepper */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Journey Progress</span>
                  <div className="grid grid-cols-4 gap-1 text-[9px] font-bold text-center">
                    <div className="py-1 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700">Depot ✓</div>
                    <div className="py-1 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700">Stop 1–3 ✓</div>
                    <div className="py-1 rounded bg-emerald-600 text-white shadow-xs">Stop 4</div>
                    <div className="py-1 rounded bg-slate-800 text-slate-400">School</div>
                  </div>
                </div>
              </div>

              {/* Large Distraction-Free Driver Action Target */}
              <div className="space-y-2 pt-4">
                <button
                  onClick={() => setDriverStep((prev) => (prev === 2 ? 3 : 2))}
                  className="w-full py-3.5 bg-[#006B2F] hover:bg-[#005525] text-white font-bold text-xs rounded-xl shadow-md transition-colors text-center"
                >
                  {driverStep === 2 ? '✓ Confirm Tanvik Boarded' : '✓ Boarding Verified (Proceed)'}
                </button>
                <p className="text-[9.5px] text-center text-slate-500">
                  Large touch target designed for zero driving distraction
                </p>
              </div>
            </div>
          )}

          {/* BOTTOM AREA: iOS Home Indicator Swipe Bar */}
          <div className="py-2 bg-white flex justify-center border-t border-slate-100">
            <div className="w-32 h-1 bg-slate-900/25 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
