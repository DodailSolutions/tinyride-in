'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ActiveTripRow {
  tripId: string;
  routeCode: string;
  schoolName: string;
  driverName: string;
  driverPhone: string;
  vehicleNumber: string;
  vehicleModel: string;
  passengersBoarded: number;
  totalPassengers: number;
  currentPhase: 'dispatch' | 'pickup_run' | 'school_bay' | 'completed';
  slaStatus: 'normal' | 'delayed' | 'attention';
  delayMinutes?: number;
  eta: string;
}

interface PendingKycRow {
  id: string;
  name: string;
  type: 'driver' | 'vehicle';
  documentType: string;
  submittedAt: string;
  status: 'pending_review' | 'approved' | 'rejected';
}

export default function OverviewDashboardPage() {
  const [filterSla, setFilterSla] = useState<'all' | 'delayed' | 'normal'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeTrips] = useState<ActiveTripRow[]>([
    {
      tripId: 'TRIP-HYD-101',
      routeCode: 'M-01',
      schoolName: 'Olive Mount',
      driverName: 'Suresh Kumar',
      driverPhone: '+919876543201',
      vehicleNumber: 'TS09-TR-101',
      vehicleModel: 'Force Traveller (16-seater)',
      passengersBoarded: 16,
      totalPassengers: 16,
      currentPhase: 'school_bay',
      slaStatus: 'normal',
      eta: '07:55 AM (Arrived)',
    },
    {
      tripId: 'TRIP-HYD-102',
      routeCode: 'M-04',
      schoolName: 'Delhi Public School, Khajaguda',
      driverName: 'Ravi Kumar',
      driverPhone: '+919876543210',
      vehicleNumber: 'TS09-TR-102',
      vehicleModel: 'Bajaj RE Electric (6-seater)',
      passengersBoarded: 4,
      totalPassengers: 6,
      currentPhase: 'pickup_run',
      slaStatus: 'normal',
      eta: '08:08 AM',
    },
    {
      tripId: 'TRIP-HYD-103',
      routeCode: 'M-02',
      schoolName: 'Olive Mount',
      driverName: 'Venkatesh Rao',
      driverPhone: '+919876543203',
      vehicleNumber: 'TS09-TR-105',
      vehicleModel: 'Tata Winger (12-seater)',
      passengersBoarded: 9,
      totalPassengers: 12,
      currentPhase: 'pickup_run',
      slaStatus: 'delayed',
      delayMinutes: 8,
      eta: '08:14 AM (+8m)',
    },
    {
      tripId: 'TRIP-HYD-104',
      routeCode: 'M-03',
      schoolName: 'Chirec International, Kondapur',
      driverName: 'Mohammed Azhar',
      driverPhone: '+919876543222',
      vehicleNumber: 'TS09-TR-108',
      vehicleModel: 'Force Urbania (12-seater)',
      passengersBoarded: 12,
      totalPassengers: 12,
      currentPhase: 'school_bay',
      slaStatus: 'normal',
      eta: '07:48 AM (Arrived)',
    },
    {
      tripId: 'TRIP-HYD-105',
      routeCode: 'M-07',
      schoolName: 'Delhi Public School, Nacharam',
      driverName: 'K. Srinivas',
      driverPhone: '+919876543233',
      vehicleNumber: 'TS10-TR-114',
      vehicleModel: 'Force Traveller (16-seater)',
      passengersBoarded: 14,
      totalPassengers: 16,
      currentPhase: 'pickup_run',
      slaStatus: 'normal',
      eta: '08:20 AM',
    },
  ]);

  const [pendingKyc, setPendingKyc] = useState<PendingKycRow[]>([
    {
      id: 'k-1',
      name: 'Anand Varma',
      type: 'driver',
      documentType: 'Police Verification & Commercial Driving License',
      submittedAt: 'Today, 06:30 AM',
      status: 'pending_review',
    },
    {
      id: 'k-2',
      name: 'TS09-TR-120 (Force Traveller)',
      type: 'vehicle',
      documentType: 'Commercial Fitness Certificate & Speed Governor Test',
      submittedAt: 'Yesterday, 04:15 PM',
      status: 'pending_review',
    },
  ]);

  const filteredTrips = activeTrips.filter((t) => {
    if (filterSla === 'delayed' && t.slaStatus !== 'delayed') return false;
    if (filterSla === 'normal' && t.slaStatus !== 'normal') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.tripId.toLowerCase().includes(q) ||
        t.routeCode.toLowerCase().includes(q) ||
        t.driverName.toLowerCase().includes(q) ||
        t.schoolName.toLowerCase().includes(q) ||
        t.vehicleNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApproveKyc = (id: string) => {
    setPendingKyc((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'approved' } : k))
    );
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 pb-12">
      {/* 1. Operational Top Bar (Clean, High Contrast, Calm, No gradients) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse" />
              Central Operations Command • Hyderabad Zone
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Live Fleet Operations &amp; Safety Pulse
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Real-time monitoring of transit routes, child boarding, vehicle GPS telemetry, and KYC approvals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition-colors"
            >
              ← Public Landing Page
            </Link>
            <Link
              href="/trips"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-md text-xs font-semibold transition-colors"
            >
              Full Transit Dispatch →
            </Link>
          </div>
        </div>

        {/* 2. "WHAT IS HAPPENING RIGHT NOW?" Operational Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block">Active Trips</span>
            <span className="text-lg font-bold text-slate-900">18 Runs</span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block">Children in Transit</span>
            <span className="text-lg font-bold text-slate-900">84 Students</span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block">Vehicles Active</span>
            <span className="text-lg font-bold text-slate-900">18 Online</span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block">Drivers Active</span>
            <span className="text-lg font-bold text-slate-900">18 Verified</span>
          </div>

          <div className="p-3 bg-amber-50 rounded border border-amber-200">
            <span className="text-amber-800 font-medium block">Delayed Routes</span>
            <span className="text-lg font-bold text-amber-800">1 Route (+8m)</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
            <span className="text-emerald-800 font-medium block">Safety Alerts</span>
            <span className="text-lg font-bold text-emerald-800">0 Critical</span>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block">Today's Completed</span>
            <span className="text-lg font-bold text-slate-900">42 Runs</span>
          </div>
        </div>
      </div>

      {/* 3. Real-Time Active Transit Operations Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Live Transit Fleet Operations
            </h2>
            <p className="text-xs text-slate-500">
              Current vehicle telemetry, passenger load, and destination SLA tracking.
            </p>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search trip, driver, or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-emerald-700 w-full sm:w-60"
            />
            <div className="flex rounded border border-slate-300 bg-white p-0.5 text-xs">
              <button
                onClick={() => setFilterSla('all')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterSla === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterSla('delayed')}
                className={`px-2.5 py-1 rounded font-medium ${
                  filterSla === 'delayed' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Delayed Only
              </button>
            </div>
          </div>
        </div>

        {/* Operational Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Trip Code</th>
                <th className="py-2.5 px-4">Route &amp; Destination</th>
                <th className="py-2.5 px-4">Driver &amp; Vehicle</th>
                <th className="py-2.5 px-4">Passenger Manifest</th>
                <th className="py-2.5 px-4">Current Phase</th>
                <th className="py-2.5 px-4">SLA Watch</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTrips.map((t) => (
                <tr key={t.tripId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{t.tripId}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">{t.routeCode}</span>
                    <span className="block text-[11px] text-slate-500">{t.schoolName}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-900">{t.driverName}</span>
                    <span className="block text-[11px] text-slate-500 font-mono">{t.vehicleNumber}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{t.passengersBoarded}</span> / {t.totalPassengers} Boarded
                    <div className="w-24 bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-700 h-full rounded-full"
                        style={{ width: `${(t.passengersBoarded / t.totalPassengers) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {t.currentPhase === 'school_bay' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        At School Bay
                      </span>
                    )}
                    {t.currentPhase === 'pickup_run' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
                        Pickup Run (En Route)
                      </span>
                    )}
                    {t.currentPhase === 'dispatch' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        Depot Dispatch
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {t.slaStatus === 'normal' ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        On Time ({t.eta})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Delayed +{t.delayMinutes}m
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={`tel:${t.driverPhone}`}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                    >
                      Call Driver
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Secondary Operational Grid: KYC Queue & Safety Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KYC & Supply Review Queue */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Driver &amp; Vehicle Compliance Queue
              </h3>
              <p className="text-[11px] text-slate-500">
                Mandatory background check &amp; fitness certificate approvals.
              </p>
            </div>
            <Link href="/kyc" className="text-xs font-semibold text-emerald-800 hover:underline">
              View All KYC →
            </Link>
          </div>

          <div className="divide-y divide-slate-200">
            {pendingKyc.map((item) => (
              <div key={item.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{item.name}</span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">{item.documentType}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.submittedAt}</p>
                </div>

                <div>
                  {item.status === 'pending_review' ? (
                    <button
                      onClick={() => handleApproveKyc(item.id)}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium transition-colors"
                    >
                      Approve
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700">✓ Approved</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety Exception & Delay Watch */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Active Route Watch &amp; Exceptions
              </h3>
              <p className="text-[11px] text-slate-500">
                SLA variances and route detour notifications.
              </p>
            </div>
            <Link href="/safety" className="text-xs font-semibold text-emerald-800 hover:underline">
              View Safety Center →
            </Link>
          </div>

          <div className="p-4 space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-amber-900">Route M-02 (TS09-TR-105) Slowdown</span>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">
                  +8 min delay
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1">
                Traffic backlog at Outer Ring Road Gachibowli Junction. Driver reported via in-cab console. Parents and School Gate 2 notified automatically.
              </p>
              <div className="mt-2 text-[11px] text-amber-900 font-medium">
                Driver: Venkatesh Rao • 9 students on board • Expected School Gate ETA: 08:14 AM
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">Student Absence Broadcast</span>
                <span className="text-[10px] text-slate-500">07:22 AM</span>
              </div>
              <p className="mt-1">
                Parent Priya Sharma marked <strong>Zoya Khan</strong> absent for today (Medical appointment). Route M-01 manifest updated to bypass stop.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
