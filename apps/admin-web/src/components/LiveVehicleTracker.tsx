'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface TrackingState {
  stage: 'en_route' | 'approaching' | 'at_stop' | 'boarded' | 'to_school' | 'arrived';
  etaLabel: string;
  statusText: string;
  locationSubtext: string;
  speed: number;
  progressPercent: number; // 0 to 100
}

export function LiveVehicleTracker() {
  const pathRef = useRef<SVGPathElement>(null);
  const completedPathRef = useRef<SVGPathElement>(null);
  const vehicleGroupRef = useRef<SVGGElement>(null);
  const liveIndicatorRef = useRef<HTMLDivElement>(null);

  // High-level reactive state for UI labels (updates only on milestone transitions)
  const [trackingState, setTrackingState] = useState<TrackingState>({
    stage: 'en_route',
    etaLabel: '7 min away',
    statusText: 'On the way to your stop',
    locationSubtext: 'Road No. 36 • Traffic: Clear',
    speed: 34,
    progressPercent: 20,
  });

  const [atStopHighlight, setAtStopHighlight] = useState(false);
  const [boardedConfirmation, setBoardedConfirmation] = useState(false);

  // SVG route path coordinates
  const ROUTE_PATH = "M 25,40 C 65,40 90,40 120,52 C 140,60 148,78 152,98 C 156,116 160,126 172,130 C 188,135 208,124 224,102 C 240,80 255,55 288,55";

  // Stop positions on route (percentage 0 to 1)
  const STOP_PROGRESS = 0.46; // Parent's stop
  const SCHOOL_PROGRESS = 0.98; // School arrival

  useEffect(() => {
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

    // Set initial dasharray for progressive completed trail
    completedPath.style.strokeDasharray = `${pathLength}`;
    completedPath.style.strokeDashoffset = `${pathLength}`;

    let animationFrameId: number;
    let lastTimestamp = performance.now();
    let currentProgress = 0.05;
    let currentAngle = 0;
    let pauseRemaining = 0;
    let stageLock: 'none' | 'at_stop' | 'arrived' = 'none';

    // Respect user's reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Set to representative mid-journey frame
      const distance = STOP_PROGRESS * 0.7 * pathLength;
      const pt = path.getPointAtLength(distance);
      vehicle.setAttribute('transform', `translate(${pt.x}, ${pt.y})`);
      completedPath.style.strokeDashoffset = `${pathLength * (1 - STOP_PROGRESS * 0.7)}`;
      return;
    }

    const animate = (now: number) => {
      const deltaTime = Math.min((now - lastTimestamp) / 1000, 0.1); // clamp for tab switching
      lastTimestamp = now;

      // Handle dwell pauses at Stop and School
      if (pauseRemaining > 0) {
        pauseRemaining -= deltaTime;
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      // Realistic speed progression
      // Slow down slightly when approaching stop or school
      let speed = 0.038; // complete loop in ~26 seconds
      if (currentProgress > 0.38 && currentProgress < STOP_PROGRESS) {
        speed = 0.024; // deceleration approaching stop
      } else if (currentProgress > 0.90 && currentProgress < SCHOOL_PROGRESS) {
        speed = 0.022; // deceleration approaching school
      }

      currentProgress += speed * deltaTime;

      // MILESTONE 1: Reaching Parent's Stop
      if (currentProgress >= STOP_PROGRESS && stageLock === 'none') {
        stageLock = 'at_stop';
        currentProgress = STOP_PROGRESS;
        pauseRemaining = 3.2; // 3.2s dwell at stop
        setAtStopHighlight(true);
        setBoardedConfirmation(true);

        setTrackingState({
          stage: 'at_stop',
          etaLabel: 'At your gate',
          statusText: 'Aarav boarding TR-102',
          locationSubtext: 'Rainbow Vistas Gate 2',
          speed: 0,
          progressPercent: 46,
        });

        setTimeout(() => {
          setTrackingState((prev) => ({
            ...prev,
            stage: 'boarded',
            statusText: 'Child safely boarded',
            locationSubtext: 'SafeKey: 482-910 verified',
          }));
        }, 1500);
      }

      // MILESTONE 2: Resuming from Stop toward School
      if (currentProgress > STOP_PROGRESS && stageLock === 'at_stop') {
        stageLock = 'none';
        setAtStopHighlight(false);
        setBoardedConfirmation(false);
      }

      // MILESTONE 3: Reaching School Campus
      if (currentProgress >= SCHOOL_PROGRESS && stageLock === 'none') {
        stageLock = 'arrived';
        currentProgress = SCHOOL_PROGRESS;
        pauseRemaining = 3.5; // 3.5s dwell at school

        setTrackingState({
          stage: 'arrived',
          etaLabel: 'Arrived',
          statusText: 'Arrived at Olive Mount School',
          locationSubtext: 'Drop-off Complete • Bay 3',
          speed: 0,
          progressPercent: 100,
        });
      }

      // MILESTONE 4: Loop Reset
      if (currentProgress >= 1.0) {
        currentProgress = 0.02;
        stageLock = 'none';
        setTrackingState({
          stage: 'en_route',
          etaLabel: '7 min away',
          statusText: 'On the way to your stop',
          locationSubtext: 'Road No. 36 • Traffic: Clear',
          speed: 34,
          progressPercent: 15,
        });
      }

      // Dynamic reactive status when in motion
      if (stageLock === 'none') {
        if (currentProgress < 0.25) {
          setTrackingState((prev) => ({
            ...prev,
            stage: 'en_route',
            etaLabel: '7 min away',
            statusText: 'On the way to your stop',
            locationSubtext: 'Approaching Road No. 36',
            speed: 34,
            progressPercent: Math.round(currentProgress * 100),
          }));
        } else if (currentProgress < 0.38) {
          setTrackingState((prev) => ({
            ...prev,
            stage: 'en_route',
            etaLabel: '5 min away',
            statusText: 'Approaching your stop',
            locationSubtext: '500m to Rainbow Vistas Gate 2',
            speed: 32,
            progressPercent: Math.round(currentProgress * 100),
          }));
        } else if (currentProgress < STOP_PROGRESS) {
          setTrackingState((prev) => ({
            ...prev,
            stage: 'approaching',
            etaLabel: '2 min away',
            statusText: 'Arriving at your gate',
            locationSubtext: 'Vehicle in sight',
            speed: 18,
            progressPercent: Math.round(currentProgress * 100),
          }));
        } else if (currentProgress > STOP_PROGRESS && currentProgress < 0.8) {
          setTrackingState((prev) => ({
            ...prev,
            stage: 'to_school',
            etaLabel: '12 min to school',
            statusText: 'En route to Olive Mount',
            locationSubtext: 'Expressway Flyover • 36 km/h',
            speed: 36,
            progressPercent: Math.round(currentProgress * 100),
          }));
        } else if (currentProgress >= 0.8 && currentProgress < SCHOOL_PROGRESS) {
          setTrackingState((prev) => ({
            ...prev,
            stage: 'to_school',
            etaLabel: '4 min to school',
            statusText: 'Entering school zone',
            locationSubtext: 'Campus Bay Access Road',
            speed: 22,
            progressPercent: Math.round(currentProgress * 100),
          }));
        }
      }

      // Calculate exact position on SVG curve
      const distance = Math.max(0, Math.min(currentProgress * pathLength, pathLength));
      const pt = path.getPointAtLength(distance);

      // Calculate tangent angle for realistic vehicle heading orientation
      const lookAhead = Math.min(distance + 1.5, pathLength);
      const nextPt = path.getPointAtLength(lookAhead);
      const dx = nextPt.x - pt.x;
      const dy = nextPt.y - pt.y;
      const targetAngle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Smooth heading lerp
      currentAngle = currentAngle + (targetAngle - currentAngle) * 0.25;

      // Update vehicle transform direct in DOM for 60fps performance
      vehicle.setAttribute('transform', `translate(${pt.x}, ${pt.y}) rotate(${currentAngle})`);

      // Update completed route trail (strokeDashoffset smoothly reveals green route behind vehicle)
      completedPath.style.strokeDashoffset = `${pathLength * (1 - currentProgress)}`;

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="w-full text-slate-800 text-xs">
      {/* 1. SYNCHRONIZED TRIP PROGRESS BAR */}
      <div className="p-3.5 bg-gradient-to-b from-emerald-50/70 to-white border-b border-slate-100">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xl font-bold text-slate-900 transition-all duration-300">
              {trackingState.etaLabel}
            </div>
            <p className="text-[11px] text-slate-600 font-medium transition-all duration-200">
              {trackingState.statusText}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Speed</span>
            <div className="text-xs font-mono font-bold text-slate-700">
              {trackingState.speed} km/h
            </div>
          </div>
        </div>

        {/* Progress Track: Depot -> Your Stop -> School */}
        <div className="mt-3.5 relative">
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, Math.max(8, trackingState.progressPercent))}%` }}
              className="h-full bg-[#006B2F] rounded-full transition-all duration-300"
            ></div>
          </div>

          <div className="mt-1.5 flex justify-between text-[9px] text-slate-500 font-medium">
            <span className={trackingState.progressPercent < 40 ? 'text-[#006B2F] font-bold' : ''}>
              Depot 7:15
            </span>
            <span
              className={`transition-colors ${
                trackingState.progressPercent >= 40 && trackingState.progressPercent < 90
                  ? 'text-[#006B2F] font-bold'
                  : ''
              }`}
            >
              Your Stop (8:35)
            </span>
            <span className={trackingState.progressPercent >= 90 ? 'text-[#006B2F] font-bold' : ''}>
              School (8:50)
            </span>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME VEHICLE TRACKING SVG MAP */}
      <div className="relative h-48 bg-[#F4F6F9] overflow-hidden select-none">
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 315 175"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background Map Geography */}
          <rect width="315" height="175" fill="#F1F5F9" />

          {/* Park green zone */}
          <path d="M5 25 Q70 15 95 65 T35 130 Z" fill="#DCFCE7" opacity="0.5" />
          {/* Water lake */}
          <path d="M210 110 Q250 130 280 100 L315 175 L190 175 Z" fill="#E0F2FE" opacity="0.6" />

          {/* Secondary road network grid */}
          <line x1="0" y1="40" x2="315" y2="40" stroke="#E2E8F0" strokeWidth="5" />
          <line x1="0" y1="130" x2="315" y2="130" stroke="#E2E8F0" strokeWidth="5" />
          <line x1="120" y1="0" x2="120" y2="175" stroke="#E2E8F0" strokeWidth="5" />
          <line x1="220" y1="0" x2="220" y2="175" stroke="#E2E8F0" strokeWidth="5" />

          {/* UPCOMING ROUTE (Base Path in Muted Neutral Grey) */}
          <path
            ref={pathRef}
            d={ROUTE_PATH}
            stroke="#CBD5E1"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* COMPLETED ROUTE (Emerald Brand Path behind moving vehicle) */}
          <path
            ref={completedPathRef}
            d={ROUTE_PATH}
            stroke="#006B2F"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* DEPOT START POINT (0%) */}
          <g transform="translate(25, 40)">
            <circle cx="0" cy="0" r="4.5" fill="#64748B" />
            <text x="0" y="-8" textAnchor="middle" fontSize="7" fontWeight="600" fill="#64748B">
              Depot
            </text>
          </g>

          {/* STOP: PARENT'S STOP (YOUR STOP • 46%) */}
          <g
            transform="translate(172, 130)"
            className={`transition-transform duration-300 ${
              atStopHighlight ? 'scale-110' : 'scale-100'
            }`}
          >
            {/* Approaching pulse ring */}
            <circle
              cx="0"
              cy="0"
              r="12"
              stroke="#006B2F"
              strokeWidth="1.5"
              fill="none"
              className={atStopHighlight ? 'animate-ping opacity-60' : 'opacity-25'}
            />
            {/* Stop base pin */}
            <circle cx="0" cy="0" r="5.5" fill="#006B2F" stroke="#FFFFFF" strokeWidth="1.5" />
            <text x="0" y="16" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#006B2F">
              YOUR STOP
            </text>
            <text x="0" y="24" textAnchor="middle" fontSize="6.5" fontWeight="500" fill="#64748B">
              8:35 AM
            </text>
          </g>

          {/* DESTINATION: SCHOOL CAMPUS (98%) */}
          <g transform="translate(288, 55)">
            <circle cx="0" cy="0" r="6" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
            <text x="0" y="3" textAnchor="middle" fontSize="7" fill="white">
              🏫
            </text>
            <text x="0" y="-10" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0F172A">
              Olive Mount
            </text>
            <text x="0" y="16" textAnchor="middle" fontSize="6.5" fontWeight="500" fill="#64748B">
              Bay 3
            </text>
          </g>

          {/* THE PHYSICAL MOVING VEHICLE MARKER */}
          <g ref={vehicleGroupRef} style={{ willChange: 'transform' }}>
            {/* Live expanding location pulse ring */}
            <circle
              cx="0"
              cy="0"
              r="13"
              stroke="#006B2F"
              strokeWidth="1.5"
              fill="none"
              strokeOpacity="0.4"
              className="animate-marker-pulse"
            />

            {/* Vehicle Shadow */}
            <ellipse cx="0" cy="1" rx="9" ry="5.5" fill="#000000" opacity="0.25" />

            {/* Vehicle Body: Force Traveller / Mini Bus Silhouette */}
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
            {/* Windshield */}
            <rect x="4" y="-3.5" width="2.5" height="7" rx="1" fill="#E2E8F0" />
            {/* Rear window */}
            <rect x="-7" y="-3.5" width="1.5" height="7" rx="0.5" fill="#E2E8F0" />
            {/* Side windows */}
            <rect x="-3.5" y="-4" width="6" height="1.5" fill="#CBD5E1" />
            <rect x="-3.5" y="2.5" width="6" height="1.5" fill="#CBD5E1" />
            {/* Headlights */}
            <circle cx="8" cy="-2.5" r="0.8" fill="#FDE047" />
            <circle cx="8" cy="2.5" r="0.8" fill="#FDE047" />
          </g>
        </svg>

        {/* Live Location HUD Pill */}
        <div
          ref={liveIndicatorRef}
          className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-xs rounded-lg px-2.5 py-1.5 shadow-sm border border-slate-200/90 flex items-center justify-between text-[10px]"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-800 tracking-tight">● LIVE LOCATION</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 truncate max-w-[150px] font-medium">
              {trackingState.locationSubtext}
            </span>
          </div>
          <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
            TS09-TR-102
          </span>
        </div>
      </div>

      {/* 3. VERIFIED DRIVER FOOTER WITH SECONDARY SAFEKAY TOKEN */}
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

        {/* Quiet Secondary SafeKey Handover Token */}
        <div className="text-right">
          <span className="text-[9px] text-slate-400 block font-medium">Handover Token</span>
          <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
            {boardedConfirmation ? '✓ 482-910' : '482-910'}
          </span>
        </div>
      </div>
    </div>
  );
}
