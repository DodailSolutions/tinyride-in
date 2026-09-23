'use client';

import React, { useState } from 'react';

interface LiveTrip {
  id: string;
  tripNumber: string;
  serviceDate: string;
  state: 'scheduled' | 'ready' | 'in_progress' | 'at_school' | 'completed';
  routeName: string;
  schoolName: string;
  driverName: string;
  driverPhone: string;
  vehicleRegistration: string;
  vehicleModel: string;
  seatingCapacity: number;
  childrenTotal: number;
  childrenCompletedHandovers: number;
  currentSpeedKmh: number;
  nextStopName: string;
  etaMinutes: number;
  isDelayed: boolean;
  hasOpenException: boolean;
  passengers: { childName: string; grade: string; pickupAddress: string; status: string; otpVerified: boolean }[];
}

export default function LiveTripsPage() {
  const [trips] = useState<LiveTrip[]>([
    {
      id: 'trip-1',
      tripNumber: 'TRIP-HYD-001',
      serviceDate: '2026-09-23',
      state: 'in_progress',
      routeName: 'Jubilee Hills Morning Loop 1',
      schoolName: 'Oakridge International School',
      driverName: 'Suresh Kumar',
      driverPhone: '+91 98765 43210',
      vehicleRegistration: 'TS09UB9876',
      vehicleModel: 'Tata Winger (16 Seater)',
      seatingCapacity: 16,
      childrenTotal: 14,
      childrenCompletedHandovers: 11,
      currentSpeedKmh: 34,
      nextStopName: 'Road No. 45, Jubilee Hills Stop #07',
      etaMinutes: 6,
      isDelayed: false,
      hasOpenException: false,
      passengers: [
        { childName: 'Aarav Reddy', grade: 'Grade 5', pickupAddress: 'Plot 42, Rd 36 Jubilee Hills', status: 'Picked Up', otpVerified: true },
        { childName: 'Ananya Rao', grade: 'Grade 3', pickupAddress: 'Apt 4B, Hill Ridge Springs', status: 'Picked Up', otpVerified: true },
        { childName: 'Ishaan Verma', grade: 'Grade 7', pickupAddress: 'Villa 12, Whisper Valley', status: 'Next In Queue', otpVerified: false },
      ],
    },
    {
      id: 'trip-2',
      tripNumber: 'TRIP-HYD-002',
      serviceDate: '2026-09-23',
      state: 'at_school',
      routeName: 'Madhapur Express Route 2',
      schoolName: 'Oakridge International School',
      driverName: 'Venkat Rao',
      driverPhone: '+91 99887 76655',
      vehicleRegistration: 'TS08UA4321',
      vehicleModel: 'Force Traveller (20 Seater)',
      seatingCapacity: 20,
      childrenTotal: 18,
      childrenCompletedHandovers: 18,
      currentSpeedKmh: 0,
      nextStopName: 'Oakridge Gate #02 Arrival Bay',
      etaMinutes: 0,
      isDelayed: false,
      hasOpenException: false,
      passengers: [
        { childName: 'Rohan Gupta', grade: 'Grade 4', pickupAddress: 'Silicon Valley Apts', status: 'Gate Intake Done', otpVerified: true },
        { childName: 'Diya Sharma', grade: 'Grade 6', pickupAddress: 'My Home Bhooja', status: 'Gate Intake Done', otpVerified: true },
      ],
    },
    {
      id: 'trip-3',
      tripNumber: 'TRIP-HYD-003',
      serviceDate: '2026-09-23',
      state: 'in_progress',
      routeName: 'Gachibowli Run 3',
      schoolName: 'Chirec International School',
      driverName: 'Ramesh Reddy',
      driverPhone: '+91 97654 32109',
      vehicleRegistration: 'TS09UB1122',
      vehicleModel: 'Mahindra Cruzio',
      seatingCapacity: 14,
      childrenTotal: 12,
      childrenCompletedHandovers: 8,
      currentSpeedKmh: 22,
      nextStopName: 'Jayabheri Silicon County',
      etaMinutes: 12,
      isDelayed: true,
      hasOpenException: true,
      passengers: [
        { childName: 'Siddharth Nair', grade: 'Grade 8', pickupAddress: 'Jayabheri Silicon', status: 'Awaiting Driver OTP', otpVerified: false },
      ],
    },
  ]);

  const [filterState, setFilterState] = useState<string>('all');
  const [selectedTrip, setSelectedTrip] = useState<LiveTrip>(trips[0]!);

  const filteredTrips = trips.filter((t) => {
    if (filterState === 'all') return true;
    return t.state === filterState;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-[16px]">radar</span>
            Live GPS Telemetry &bull; Hyderabad Metro Zone
          </div>
          <h1 className="font-headline text-3xl font-extrabold text-primary-text tracking-tight">
            Active Trips &amp; Live Tracking
          </h1>
          <p className="text-secondary-text text-sm mt-1">
            Live transit radar, stop-by-stop SafeKey OTP verification checkpoints, vehicle speeds, and school arrivals.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-surface-container-lowest p-1.5 rounded-2xl border border-border/60 shadow-sm text-xs font-bold">
          {['all', 'in_progress', 'at_school'].map((state) => (
            <button
              key={state}
              onClick={() => setFilterState(state)}
              className={`px-3.5 py-1.5 rounded-xl capitalize transition-all ${
                filterState === state
                  ? 'bg-primary-container text-on-primary-container shadow-sm'
                  : 'text-secondary-text hover:bg-surface-container-high'
              }`}
            >
              {state === 'all' ? 'All Active Runs' : state.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Trip Cards + Telemetry Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Live Trip Cards */}
        <div className="lg:col-span-7 space-y-4">
          {filteredTrips.map((trip) => {
            const isSelected = selectedTrip.id === trip.id;
            const progressPercent = Math.round((trip.childrenCompletedHandovers / trip.childrenTotal) * 100);

            return (
              <div
                key={trip.id}
                onClick={() => setSelectedTrip(trip)}
                className={`bg-surface-container-lowest rounded-2xl p-6 shadow-sm border transition-all cursor-pointer space-y-4 ${
                  isSelected
                    ? 'border-primary shadow-md ring-1 ring-primary/30'
                    : 'border-border/60 hover:border-border'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline text-base font-bold text-primary-text">{trip.tripNumber}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          trip.state === 'at_school'
                            ? 'bg-secondary-container text-on-secondary-container'
                            : trip.isDelayed
                            ? 'bg-sun-gold/20 text-sun-gold'
                            : 'bg-primary/15 text-primary'
                        }`}
                      >
                        {trip.state === 'at_school' ? 'At School Gate' : trip.isDelayed ? 'Traffic Delay' : 'In Transit'}
                      </span>
                    </div>
                    <p className="text-xs text-secondary-text mt-0.5">{trip.routeName}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-headline text-sm font-bold text-primary-text">{trip.currentSpeedKmh} km/h</p>
                    <p className="text-[11px] text-secondary-text">GPS Speed</p>
                  </div>
                </div>

                {/* Driver & Vehicle Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-surface-container-low rounded-xl border border-border/40 text-xs">
                  <div>
                    <span className="text-secondary-text block text-[11px]">Assigned Driver</span>
                    <strong className="text-primary-text">{trip.driverName}</strong>
                  </div>
                  <div>
                    <span className="text-secondary-text block text-[11px]">Vehicle Plate</span>
                    <strong className="font-mono text-primary-text">{trip.vehicleRegistration}</strong>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-secondary-text block text-[11px]">Destination</span>
                    <strong className="text-primary-text truncate block">{trip.schoolName}</strong>
                  </div>
                </div>

                {/* Handover Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-secondary-text flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">key</span>
                      SafeKey OTP Handovers
                    </span>
                    <strong className="text-primary-text">
                      {trip.childrenCompletedHandovers} / {trip.childrenTotal} Verified ({progressPercent}%)
                    </strong>
                  </div>
                  <div className="w-full h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Next Stop Telemetry */}
                <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs text-secondary-text">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-sun-gold">near_me</span>
                    Next: <strong className="text-primary-text">{trip.nextStopName}</strong>
                  </span>
                  <span className="font-bold text-primary">ETA: {trip.etaMinutes} mins</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Trip Telemetry & Passenger Manifest */}
        <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-border/60 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="pb-4 border-b border-border/60 flex items-start justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-secondary-text">Live Run Inspection</span>
                <h3 className="font-headline text-xl font-bold text-primary-text">{selectedTrip.tripNumber}</h3>
                <p className="text-xs text-secondary-text">{selectedTrip.schoolName}</p>
              </div>
              <a
                href={`tel:${selectedTrip.driverPhone}`}
                className="p-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl flex items-center gap-1 text-xs font-bold transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">phone</span>
                Call Driver
              </a>
            </div>

            {/* Simulated Live Radar / Map Preview Card */}
            <div className="h-44 w-full bg-surface-container-low rounded-xl border border-border/60 relative overflow-hidden flex flex-col items-center justify-center p-4 text-center">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#0A9C49_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="relative z-10 space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-[28px] animate-pulse">navigation</span>
                </div>
                <p className="font-bold text-xs text-primary-text">{selectedTrip.nextStopName}</p>
                <span className="text-[11px] bg-primary text-on-primary px-3 py-1 rounded-full font-bold">
                  Speed: {selectedTrip.currentSpeedKmh} km/h &bull; Altitude: 542m
                </span>
              </div>
            </div>

            {/* Passenger Manifest Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-secondary-text uppercase tracking-wider">
                Passenger Verification Queue ({selectedTrip.passengers.length})
              </h4>
              <div className="space-y-2">
                {selectedTrip.passengers.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface-container-low rounded-xl border border-border/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-primary-text">{p.childName}</p>
                      <p className="text-[11px] text-secondary-text">{p.pickupAddress}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        p.otpVerified
                          ? 'bg-primary/15 text-primary'
                          : 'bg-sun-gold/20 text-sun-gold'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions Bottom */}
          <div className="pt-4 border-t border-border/60 flex items-center gap-3">
            <button
              onClick={() => alert(`Emergency alert dispatched for ${selectedTrip.tripNumber} to Central Dispatch.`)}
              className="flex-1 py-2.5 rounded-xl border border-error/40 text-error hover:bg-error/10 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">emergency</span>
              SOS Escalation
            </button>
            <button
              onClick={() => alert(`Driver manifest refreshed for ${selectedTrip.tripNumber}.`)}
              className="flex-1 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary-text text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              Sync Telemetry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
