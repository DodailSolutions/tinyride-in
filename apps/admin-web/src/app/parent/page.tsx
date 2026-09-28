'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Phone,
  ShieldCheck,
  Clock,
  ChevronDown,
  Navigation,
  KeyRound,
  CalendarX,
  Share2,
  AlertTriangle,
  LogOut,
  Check,
  Bell,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { clearParentSession } from '@/lib/parentAuth';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import PWAInstallBanner from '@/components/PWAInstallBanner';

// Dynamically import Leaflet Map to ensure SSR compatibility
const RealTrackingMap = dynamic(() => import('@/components/parent/RealTrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 sm:h-96 rounded-3xl bg-slate-100 animate-pulse flex items-center justify-center">
      <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
        <Navigation className="w-4 h-4 animate-spin text-[#006B2F]" />
        <span>Loading live satellite telemetry...</span>
      </div>
    </div>
  ),
});

interface RouteStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stopOrder: number;
  isPickupStop?: boolean;
  isSchoolStop?: boolean;
}

interface ParentDashboardData {
  parent: {
    id: string;
    userId: string;
    phone: string;
    name: string;
    email?: string;
  };
  children: Array<{
    id: string;
    name: string;
    grade: string;
    medicalNotes?: string;
    schoolName: string;
    pickupLocation: string;
  }>;
  activeChild: {
    id: string;
    name: string;
    grade: string;
    medicalNotes?: string;
    schoolName: string;
    pickupLocation: string;
  };
  trip: {
    id: string;
    status: string;
    date: string;
    scheduledStartTime: string;
    serviceType: string;
  } | null;
  route: {
    id: string;
    name: string;
    schoolName: string;
    schoolLocation?: { lat: number; lng: number } | null;
    stops: RouteStop[];
  } | null;
  driver: {
    id: string;
    name: string;
    phone: string;
    licenseNumber?: string;
    rating?: number;
    policeVerified: boolean;
  } | null;
  vehicle: {
    id: string;
    registrationNumber: string;
    makeModel: string;
    type: string;
    vehicleType?: string;
    capacity?: number;
  } | null;
  tripChild: {
    id: string;
    state: 'pending' | 'picked_up' | 'at_school' | 'dropped_off' | 'absent';
    boardedAt?: string | null;
    safeKey: string;
    pickupStopName?: string;
  } | null;
  latestLocation: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed_kph?: number | null;
    accuracy_meters?: number | null;
    recorded_at?: string | null;
  } | null;
  timeline: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    time: string;
    timestamp: string;
    completed: boolean;
    isCurrent?: boolean;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    created_at: string;
    notification_type: string;
  }>;
}

export default function ParentDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [showChildPicker, setShowChildPicker] = useState(false);

  // Modals
  const [showSafeKeyModal, setShowSafeKeyModal] = useState(false);
  const [showAbsentModal, setShowAbsentModal] = useState(false);
  const [isSubmittingAbsent, setIsSubmittingAbsent] = useState(false);
  const [absentSuccess, setAbsentSuccess] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // PWA install prompt
  const { canInstall, showBanner: showInstallBanner, install: handleInstallPWA, dismiss: handleDismissPWA } = usePWAInstall();

  // EventSource ref for SSE cleanup
  const sseRef = useRef<EventSource | null>(null);

  // Fetch Parent Data from real backend
  const loadParentData = useCallback(async (childId?: string, silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const url = childId ? `/api/parent/data?childId=${childId}` : '/api/parent/data';
      const res = await fetch(url, { cache: 'no-store' });

      if (res.status === 401) {
        clearParentSession();
        router.replace('/parent/login');
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        console.error('Failed to load parent data:', err);
        return;
      }

      const resData = (await res.json()) as ParentDashboardData;
      setData(resData);
      if (!selectedChildId && resData.activeChild?.id) {
        setSelectedChildId(resData.activeChild.id);
      }
    } catch (err) {
      console.error('Parent data fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [router, selectedChildId]);

  // Online / offline listeners & Initial Data Load
  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      loadParentData(selectedChildId || undefined, true);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadParentData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadParentData]);

  // Connect to Realtime SSE Stream when Trip is Active
  useEffect(() => {
    if (!data?.trip?.id) return;
    const tripId = data.trip.id;

    if (sseRef.current) {
      sseRef.current.close();
    }

    const eventSource = new EventSource(`/api/realtime/trip?tripId=${tripId}`);
    sseRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'location_update') {
          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              latestLocation: {
                latitude: payload.latitude,
                longitude: payload.longitude,
                heading: payload.heading,
                speed_kph: payload.speed_kph,
                accuracy_meters: payload.accuracy_meters,
                recorded_at: payload.recorded_at,
              },
            };
          });
        } else if (payload.type === 'child_boarded') {
          // If this is the active child, update state to picked_up
          setData((prev) => {
            if (!prev) return prev;
            if (prev.tripChild && prev.tripChild.id === payload.tripChildId) {
              return {
                ...prev,
                tripChild: {
                  ...prev.tripChild,
                  state: 'picked_up',
                  boardedAt: payload.occurredAt,
                },
              };
            }
            return prev;
          });
          // Refresh data quietly to pull new timeline and notifications
          loadParentData(selectedChildId || undefined, true);
        } else if (payload.type === 'school_arrival') {
          setData((prev) => {
            if (!prev) return prev;
            if (prev.tripChild) {
              return {
                ...prev,
                tripChild: {
                  ...prev.tripChild,
                  state: 'at_school',
                },
              };
            }
            return prev;
          });
          loadParentData(selectedChildId || undefined, true);
        }
      } catch (e) {
        console.warn('Error parsing SSE event:', e);
      }
    };

    eventSource.onerror = () => {
      // EventSource will auto-reconnect
    };

    return () => {
      eventSource.close();
      sseRef.current = null;
    };
  }, [data?.trip?.id, loadParentData, selectedChildId]);

  const handleSwitchChild = (childId: string) => {
    setSelectedChildId(childId);
    setShowChildPicker(false);
    loadParentData(childId);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    clearParentSession();
    router.replace('/parents');
  };

  const handleShareTracking = () => {
    if (!data?.tripChild?.safeKey) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `Track ${data.activeChild.name}'s TinyRide live: ${window.location.origin}/parent?child=${data.activeChild.id}`
      );
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  };

  const handleConfirmAbsent = async () => {
    if (!data?.tripChild?.id) return;
    setIsSubmittingAbsent(true);

    try {
      const res = await fetch('/api/parent/absent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripChildId: data.tripChild.id,
          reason: 'Parent marked absent from app',
        }),
      });

      if (res.ok) {
        setAbsentSuccess(true);
        setTimeout(() => {
          setAbsentSuccess(false);
          setShowAbsentModal(false);
          loadParentData(selectedChildId || undefined, true);
        }, 1500);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to report absence');
      }
    } catch {
      alert('Network error reporting absence. Please try again.');
    } finally {
      setIsSubmittingAbsent(false);
    }
  };

  const formatSafeKey = (code: string) => {
    if (!code) return '--- ---';
    const clean = code.replace(/\D/g, '');
    if (clean.length === 6) {
      return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
    return code;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Humanized relative time formatter
  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins === 1) return '1 min ago';
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours === 1) return '1 hr ago';
      return `${diffHours} hrs ago`;
    } catch {
      return '';
    }
  };

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] p-4 sm:p-6 md:p-8 flex flex-col justify-between max-w-6xl mx-auto">
        <div className="space-y-6 animate-pulse">
          <div className="h-12 bg-slate-200/80 rounded-2xl w-full" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-200/70 rounded-md w-36" />
            <div className="h-8 bg-slate-200 rounded-xl w-64" />
          </div>
          <div className="h-64 bg-slate-200 rounded-3xl w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-slate-200 rounded-3xl" />
            <div className="h-48 bg-slate-200 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  const activeChild = data?.activeChild;
  const trip = data?.trip;
  const route = data?.route;
  const driver = data?.driver;
  const vehicle = data?.vehicle;
  const tripChild = data?.tripChild;
  const latestLocation = data?.latestLocation;
  const timeline = data?.timeline || [];
  const notifications = data?.notifications || [];

  // Child State Status Text
  const childState = tripChild?.state || 'pending';
  const isAbsent = childState === 'absent';
  const isBoarded = childState === 'picked_up';
  const isAtSchool = childState === 'at_school';
  const isCompleted = trip?.status === 'completed' || childState === 'dropped_off';

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-slate-900 pb-24 md:pb-12 flex flex-col selection:bg-emerald-100 selection:text-emerald-900 font-sans">
      {/* 1. OFFLINE WARNING BANNER */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 sticky top-0 z-50 shadow-sm">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You&apos;re offline · Showing last verified GPS status from server</span>
        </div>
      )}

      {/* 2. STICKY TOP APP HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <img
                src="/brand/logo-horizontal.png"
                alt="TinyRide — School transportation and live ride tracking"
                className="h-8 sm:h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 text-[11px] font-bold border border-emerald-200/80">
              Parent App
            </span>
          </div>

          <div className="flex items-center gap-2">
            {tripChild?.safeKey && (
              <button
                type="button"
                onClick={() => setShowSafeKeyModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-[#006B2F] border border-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SafeKey:</span>
                <span className="font-mono">{formatSafeKey(tripChild.safeKey)}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => loadParentData(selectedChildId || undefined, true)}
              title="Refresh status"
              disabled={isRefreshing}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#006B2F]' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. DASHBOARD MAIN CONTENT */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-5 md:pt-6 flex-1 space-y-6">
        {/* GREETING & CHILD SELECTOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              {getGreeting()}, {data?.parent?.name ? data.parent.name.split(' ')[0] : 'Parent'}
            </span>
            <div className="relative inline-block mt-0.5">
              <button
                type="button"
                onClick={() => setShowChildPicker(!showChildPicker)}
                className="flex items-center gap-2 text-xl sm:text-2xl font-black text-slate-900 hover:text-[#006B2F] transition-colors cursor-pointer group"
              >
                <span>{activeChild?.name || 'Your Student'}</span>
                {data?.children && data.children.length > 1 && (
                  <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-[#006B2F] transition-transform" />
                )}
              </button>

              {/* Child Switcher Dropdown */}
              {showChildPicker && data?.children && data.children.length > 1 && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                    Switch Student
                  </div>
                  {data.children.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSwitchChild(c.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        c.id === activeChild?.id
                          ? 'bg-emerald-50 text-[#006B2F]'
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{c.name}</div>
                        <div className="text-[11px] text-slate-500">{c.grade}</div>
                      </div>
                      {c.id === activeChild?.id && <Check className="w-4 h-4 text-[#006B2F]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {activeChild?.grade} • {activeChild?.schoolName}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Telemetry Active</span>
            </span>
          </div>
        </div>

        {/* DOMINANT COMPONENT: TODAY'S RIDE STATUS BANNER */}
        <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-r from-emerald-950 via-[#004B21] to-[#006B2F] text-white shadow-xl shadow-emerald-950/15">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
                  TODAY&apos;S RIDE • {trip?.serviceType === 'morning_commute' ? 'MORNING COMMUTE' : 'AFTERNOON RETURN'}
                </span>
                <span className="text-emerald-100/60">•</span>
                <span className="text-xs text-emerald-100 font-medium">
                  {route?.name || 'Assigned School Route'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {isAbsent && 'Student Marked Absent Today'}
                  {!isAbsent && isAtSchool && 'Safely Reached Campus'}
                  {!isAbsent && isCompleted && 'Trip Completed Successfully'}
                  {!isAbsent && isBoarded && 'Student Boarded · In Transit'}
                  {!isAbsent && !isBoarded && trip?.status === 'in_transit' && 'Vehicle Approaching Your Stop'}
                  {!isAbsent && !isBoarded && trip?.status === 'scheduled' && 'Scheduled for Today'}
                </h1>

                {/* Status Indicator Pill */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                    isAbsent
                      ? 'bg-rose-500/20 text-rose-200 border-rose-400/30'
                      : isAtSchool
                      ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400/40'
                      : isBoarded
                      ? 'bg-blue-500/30 text-blue-100 border-blue-400/40'
                      : 'bg-emerald-500/25 text-emerald-200 border-emerald-400/30'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    ● {isAbsent ? 'ABSENT' : isAtSchool ? 'AT SCHOOL' : isBoarded ? 'BOARDED' : 'EN ROUTE'}
                  </span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100/80 pt-1">
                <span>
                  Scheduled:{' '}
                  <strong>{trip?.scheduledStartTime ? trip.scheduledStartTime.slice(0, 5) : '07:35 AM'}</strong>
                </span>
                <span>•</span>
                <span>
                  Pickup Stop: <strong>{tripChild?.pickupStopName || activeChild?.pickupLocation || 'Designated Gate'}</strong>
                </span>
                {latestLocation && latestLocation.speed_kph !== undefined && latestLocation.speed_kph !== null && (
                  <>
                    <span>•</span>
                    <span>Speed: {Math.round(latestLocation.speed_kph)} km/h</span>
                  </>
                )}
                {latestLocation?.recorded_at && (
                  <>
                    <span>•</span>
                    <span>Last GPS: {formatRelativeTime(latestLocation.recorded_at)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions in Banner */}
            <div className="flex items-center gap-2 shrink-0">
              {tripChild?.safeKey && !isAbsent && !isAtSchool && (
                <button
                  type="button"
                  onClick={() => setShowSafeKeyModal(true)}
                  className="py-2.5 px-4 rounded-xl bg-white text-[#006B2F] hover:bg-emerald-50 text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Show SafeKey</span>
                </button>
              )}

              {!isAbsent && !isBoarded && !isAtSchool && (
                <button
                  type="button"
                  onClick={() => setShowAbsentModal(true)}
                  className="py-2.5 px-4 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-100 border border-emerald-700/60 text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <CalendarX className="w-4 h-4 text-emerald-300" />
                  <span>Mark Absent</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RESPONSIVE GRID: LIVE MAP + TELEMETRY + TIMELINE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: LARGE PROMINENT LIVE MAP & DRIVER CARD */}
          <div className="lg:col-span-7 space-y-6">
            {/* REAL MAP COMPONENT */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#006B2F]" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Live GPS Telemetry
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {latestLocation?.speed_kph !== undefined && latestLocation?.speed_kph !== null && (
                    <span className="font-semibold text-slate-700">
                      Speed: {Math.round(latestLocation.speed_kph)} km/h
                    </span>
                  )}
                  <span className="text-slate-300">|</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Encrypted Telemetry
                  </span>
                </div>
              </div>

              {/* Real Leaflet Map */}
              <div className="relative">
                <RealTrackingMap
                  vehicleLocation={
                    latestLocation
                      ? {
                          latitude: latestLocation.latitude,
                          longitude: latestLocation.longitude,
                          heading: latestLocation.heading,
                          speedKph: latestLocation.speed_kph ? Math.round(latestLocation.speed_kph) : null,
                          accuracyMeters: latestLocation.accuracy_meters,
                          recordedAt: latestLocation.recorded_at,
                        }
                      : null
                  }
                  routeStops={route?.stops || []}
                  pickupStopName={tripChild?.pickupStopName || activeChild?.pickupLocation}
                  schoolName={route?.schoolName || activeChild?.schoolName}
                  vehicleNumber={vehicle?.registrationNumber || 'TS09-TR-102'}
                  childName={activeChild?.name || 'Student'}
                  tripState={childState}
                  vehicleType={vehicle?.vehicleType}
                />
              </div>

              {/* Map Footer Info */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Encrypted school satellite positioning via TinyRide GPS Gateway</span>
                </div>
                <button
                  type="button"
                  onClick={handleShareTracking}
                  className="font-bold text-[#006B2F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copyFeedback ? 'Link Copied!' : 'Share Live Tracking'}</span>
                </button>
              </div>
            </div>

            {/* DRIVER & VEHICLE DETAILS CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Assigned Driver &amp; Escort
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-[#006B2F] font-black text-lg flex items-center justify-center border border-emerald-300/60 shadow-xs">
                    {driver?.name
                      ? driver.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                      : 'TR'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">
                        {driver?.name || 'Assigned Driver'}
                      </span>
                      {driver?.policeVerified && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#006B2F] text-[10px] font-bold border border-emerald-100">
                          Police Verified
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {vehicle?.makeModel || 'Force Traveller'} • {vehicle?.registrationNumber || 'TS09-TR-102'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Escort: Sunita Devi (Certified Female Attendant)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {driver?.phone && (
                    <a
                      href={`tel:${driver.phone}`}
                      className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-[#006B2F] hover:bg-[#005525] text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Driver</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: JOURNEY TIMELINE & RECENT UPDATES */}
          <div className="lg:col-span-5 space-y-6">
            {/* JOURNEY TIMELINE CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#006B2F]" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Journey Timeline
                  </span>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#006B2F] border border-emerald-100">
                  {isAtSchool ? 'Campus Reached' : isBoarded ? 'In Transit' : 'Route Active'}
                </span>
              </div>

              {/* Timeline Milestones */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timeline.length > 0 ? (
                  timeline.map((item, index) => (
                    <div key={item.id || index} className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-[9px] font-bold ${
                          item.completed
                            ? 'bg-emerald-600 text-white'
                            : item.isCurrent
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                            : 'bg-slate-300 text-transparent'
                        }`}
                      >
                        {item.completed ? '✓' : ''}
                      </div>
                      <div className={item.isCurrent ? 'p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80' : ''}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${item.isCurrent ? 'text-blue-950' : 'text-slate-900'}`}>
                            {item.title}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">{item.time}</span>
                        </div>
                        <p className={`text-[11px] mt-0.5 ${item.isCurrent ? 'text-blue-800' : 'text-slate-500'}`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 py-3">Awaiting departure events...</div>
                )}
              </div>
            </div>

            {/* RECENT NOTIFICATIONS CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#006B2F]" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Recent Updates
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {notifications.length > 0 ? (
                  notifications.slice(0, 3).map((n) => (
                    <div
                      key={n.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{n.title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{n.body}</div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 py-2">No alerts yet today</div>
                )}
              </div>
            </div>

            {/* AFTER SCHOOL / RETURN RIDE STATE CARD */}
            <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Afternoon Return Ride
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  Scheduled
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                School dismissal pickup scheduled for <strong className="font-bold">03:30 PM</strong> from{' '}
                {activeChild?.schoolName || 'Campus'}. Same vehicle and verified escort.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* MOBILE / TABLET BOTTOM NAVIGATION */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          type="button"
          onClick={() => loadParentData(selectedChildId || undefined, true)}
          className="flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer text-[#006B2F] font-bold min-h-[44px] justify-center"
        >
          <Navigation className="w-5 h-5" />
          <span className="text-[10px]">Today</span>
        </button>

        {tripChild?.safeKey && (
          <button
            type="button"
            onClick={() => setShowSafeKeyModal(true)}
            className="flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer text-slate-500 hover:text-slate-900 min-h-[44px] justify-center"
          >
            <div className="w-9 h-9 -mt-4 rounded-full bg-[#006B2F] text-white flex items-center justify-center shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-[#006B2F]">SafeKey</span>
          </button>
        )}

        {!isAbsent && !isBoarded && (
          <button
            type="button"
            onClick={() => setShowAbsentModal(true)}
            className="flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer text-slate-500 hover:text-slate-900 min-h-[44px] justify-center"
          >
            <CalendarX className="w-5 h-5" />
            <span className="text-[10px]">Absent</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 py-1 text-xs cursor-pointer text-slate-500 hover:text-slate-900 min-h-[44px] justify-center"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px]">Logout</span>
        </button>
      </nav>

      {/* MODAL 1: SAFEKEY BOARDING TOKEN */}
      {showSafeKeyModal && tripChild && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#006B2F]" />
                <h3 className="font-bold text-slate-900 text-base">Boarding SafeKey</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSafeKeyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white text-center space-y-3">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                Today&apos;s Boarding PIN
              </span>
              <div className="text-4xl font-mono font-bold tracking-widest text-emerald-300">
                {formatSafeKey(tripChild.safeKey)}
              </div>
              <div className="text-xs text-slate-300">
                Show to driver {driver?.name || 'Driver'} or attendant at vehicle door
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Student:</span>
                <strong className="text-slate-900">{activeChild?.name}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span>Vehicle:</span>
                <strong className="text-slate-900">{vehicle?.registrationNumber || 'TS09-TR-102'}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span>School:</span>
                <strong className="text-slate-900 truncate max-w-[180px]">{activeChild?.schoolName}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSafeKeyModal(false)}
              className="w-full py-3 rounded-xl bg-[#006B2F] hover:bg-[#005525] text-white text-xs font-bold transition-all shadow-sm cursor-pointer min-h-[44px]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: REPORT ABSENT TODAY */}
      {showAbsentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarX className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">Mark Absent Today</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAbsentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {absentSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-900">Absence Confirmed</div>
                <p className="text-xs text-slate-600">
                  Driver {driver?.name || 'Driver'} and {activeChild?.schoolName} have been notified. The bus will skip your stop today.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure {activeChild?.name} will not take the school ride today? This automatically notifies driver{' '}
                  <strong className="text-slate-900">{driver?.name || 'Driver'}</strong> so other students are not delayed.
                </p>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Pickup stop <strong>{tripChild?.pickupStopName || activeChild?.pickupLocation}</strong> will be skipped for today.
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAbsentModal(false)}
                    disabled={isSubmittingAbsent}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAbsent}
                    disabled={isSubmittingAbsent}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingAbsent ? 'Submitting...' : 'Confirm Absence'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallBanner && canInstall && (
        <PWAInstallBanner onInstall={handleInstallPWA} onDismiss={handleDismissPWA} />
      )}
    </div>
  );
}
