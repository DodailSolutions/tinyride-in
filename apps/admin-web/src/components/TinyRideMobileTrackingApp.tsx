'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DEMO_DATA } from '@/lib/demoData';

export function TinyRideMobileTrackingApp({ className = '' }: { className?: string }) {
  // Path references for real-time SVG traversal
  const pathRef = useRef<SVGPathElement>(null);
  const completedPathRef = useRef<SVGPathElement>(null);
  const vehicleGroupRef = useRef<SVGGElement>(null);

  // High-level reactive state for UI labels
  const [trackingState, setTrackingState] = useState({
    stage: 'to_school',
    etaMinutes: 7,
    etaLabel: '8:35 AM',
    statusBadge: '● BOARDED',
    subText: `En route to ${DEMO_DATA.school.name}`,
    remainingDistance: '2.4 km',
    locationSubtext: 'Jubilee Hills Rd No. 36 • Speed: 34 km/h',
    speed: 34,
    progressPercent: 55,
  });

  const [atStopHighlight, setAtStopHighlight] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // SVG route path coordinates (viewBox 0 0 315 210)
  const ROUTE_PATH = "M 25,45 C 65,45 90,42 120,55 C 138,62 145,85 150,105 C 154,124 158,142 168,145 C 185,148 206,132 222,110 C 238,88 252,65 288,65";

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

    completedPath.style.strokeDasharray = `${pathLength}`;
    completedPath.style.strokeDashoffset = `${pathLength}`;

    let animationFrameId: number;
    let lastTimestamp = performance.now();
    let currentProgress = 0.12;
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
          subText: 'Aarav boarding TR-102',
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
          subText: 'Arrived at Olive Mount School',
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
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${DEMO_DATA.child.firstName}'s School Ride Live Status`,
        text: `Tracking ${DEMO_DATA.child.firstName} on TinyRide ${DEMO_DATA.transport.routeName}. SafeKey: ${DEMO_DATA.security.safeKey}.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden text-slate-800 ${className}`}>
      {/* 1. APP HEADER BAR */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="font-bold text-slate-900 text-sm">{DEMO_DATA.child.name}</h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{DEMO_DATA.child.fullGrade} • {DEMO_DATA.transport.routeName}</p>
        </div>
        {isOnline ? (
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200/80">
            ● {trackingState.statusBadge}
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-900 font-bold text-xs border border-amber-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            OFFLINE
          </span>
        )}
      </div>

      {/* OFFLINE NOTICE */}
      {!isOnline && (
        <div className="px-3.5 py-1.5 bg-amber-500/10 border-b border-amber-200 text-amber-950 text-[11px] font-medium flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0"></span>
          <span>Connection lost • Offline mode. Showing cached route. Live telemetry paused.</span>
        </div>
      )}

      {/* 2. ETA & TELEMETRY PANEL */}
      <div className="px-4 py-3.5 bg-gradient-to-b from-emerald-50/50 to-white border-b border-slate-100">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              ETA {trackingState.etaLabel}
            </span>
            <div className="text-2xl font-bold text-slate-900 leading-tight flex items-baseline gap-1 mt-0.5">
              {trackingState.etaMinutes > 0 ? (
                <>
                  <span
                    key={trackingState.etaMinutes}
                    className="inline-block transition-all duration-300 animate-in fade-in slide-in-from-top-1"
                  >
                    {trackingState.etaMinutes}
                  </span>
                  <span className="text-base font-semibold text-slate-600">min remaining</span>
                </>
              ) : (
                <span className="text-emerald-700">At your stop</span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              {trackingState.subText}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Remaining</span>
            <div className="text-sm font-mono font-bold text-slate-800 mt-0.5">
              {trackingState.remainingDistance}
            </div>
            <div className="text-xs text-emerald-700 font-semibold">{trackingState.speed} km/h</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, Math.max(10, trackingState.progressPercent))}%` }}
              className="h-full bg-[#006B2F] rounded-full transition-all duration-300"
            ></div>
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-slate-500 font-medium">
            <span>Depot 7:15</span>
            <span className={trackingState.progressPercent >= 46 && trackingState.progressPercent < 90 ? 'text-[#006B2F] font-bold' : ''}>
              Your Stop 8:35
            </span>
            <span className={trackingState.progressPercent >= 90 ? 'text-[#006B2F] font-bold' : ''}>
              School Bay 8:50
            </span>
          </div>
        </div>
      </div>

      {/* 3. MOBILE VECTOR MAP (35-45% of card height, full-width canvas) */}
      <div className="relative h-64 sm:h-72 bg-[#F1F5F9] overflow-hidden">
        <svg
          className="w-full h-full object-cover"
          viewBox="0 0 315 210"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="315" height="210" fill="#F1F5F9" />

          {/* Topography */}
          <path d="M10 25 Q70 15 95 65 T35 140 Z" fill="#DCFCE7" opacity="0.5" />
          <path d="M210 130 Q250 150 280 120 L315 210 L190 210 Z" fill="#E0F2FE" opacity="0.6" />

          {/* Road Grid */}
          <line x1="0" y1="45" x2="315" y2="45" stroke="#E2E8F0" strokeWidth="6" />
          <line x1="0" y1="145" x2="315" y2="145" stroke="#E2E8F0" strokeWidth="6" />
          <line x1="120" y1="0" x2="120" y2="210" stroke="#E2E8F0" strokeWidth="6" />
          <line x1="220" y1="0" x2="220" y2="210" stroke="#E2E8F0" strokeWidth="6" />

          {/* Upcoming Path */}
          <path
            ref={pathRef}
            d={ROUTE_PATH}
            stroke="#CBD5E1"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Completed Path */}
          <path
            ref={completedPathRef}
            d={ROUTE_PATH}
            stroke="#006B2F"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Parent's Stop Marker */}
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

          {/* School Bay Marker */}
          <g transform="translate(288, 65)">
            <circle cx="0" cy="0" r="6.5" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1.5" />
            <text x="0" y="3.5" textAnchor="middle" fontSize="7.5" fill="white">
              🏫
            </text>
            <text x="0" y="-10" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#0F172A">
              Olive Mount
            </text>
          </g>

          {/* Moving Vehicle */}
          <g ref={vehicleGroupRef} style={{ willChange: 'transform' }}>
            <circle
              cx="0"
              cy="0"
              r="14"
              stroke="#006B2F"
              strokeWidth="1.5"
              fill="none"
              strokeOpacity="0.45"
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

        {/* Floating Telemetry Badge */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-xs rounded-xl px-3 py-2 shadow-sm border border-slate-200/90 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-bold text-slate-800">LIVE LOCATION</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 truncate max-w-[150px] font-medium">
              {trackingState.locationSubtext}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
            {DEMO_DATA.transport.vehicleNumber}
          </span>
        </div>
      </div>

      {/* 4. DRIVER & VEHICLE DETAILS */}
      <div className="p-4 bg-white border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
              RK
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                {DEMO_DATA.transport.driver}
                <span className="text-emerald-700 font-bold text-xs" title="Verified Driver">✓ Verified</span>
              </div>
              <p className="text-xs text-slate-500">{DEMO_DATA.transport.vehicle} • {DEMO_DATA.transport.vehicleNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9.5px] uppercase font-bold text-slate-400">SafeKey</span>
            <div className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              {DEMO_DATA.security.safeKey}
            </div>
          </div>
        </div>

        {/* 5. LARGE TOUCH ACTIONS (48px+ touch target) */}
        <div className="pt-2 flex gap-3">
          <a
            href={`tel:${DEMO_DATA.transport.driverPhone}`}
            className="cursor-pointer flex-1 h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors btn-micro"
          >
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>Call Driver</span>
          </a>
          <button
            type="button"
            onClick={handleShare}
            className="cursor-pointer flex-1 h-12 bg-[#006B2F] hover:bg-[#005525] active:bg-[#00441d] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs btn-micro"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>{copiedShare ? 'Link Copied!' : 'Share Status'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
