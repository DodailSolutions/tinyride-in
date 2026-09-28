'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface BayVehicle {
  bay: string;
  vehicleNumber: string;
  vehicleModel: string;
  driverName: string;
  driverPhone: string;
  routeCode: string;
  routeName: string;
  studentsOnboard: number;
  capacity: number;
  eta: string;
  status: 'en_route' | 'in_bay' | 'cleared' | 'delayed';
  safeKeyVerified: boolean;
}

interface StudentAttendance {
  id: string;
  name: string;
  grade: string;
  vehicleNumber: string;
  routeCode: string;
  status: 'arrived' | 'in_transit' | 'absent_reported';
  arrivalTime?: string;
  guardianName: string;
  safeKeyMatched: boolean;
}

export default function SchoolOverviewPage() {
  const [filterBay, setFilterBay] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [bayVehicles, setBayVehicles] = useState<BayVehicle[]>([
    {
      bay: 'Bay 01',
      vehicleNumber: 'TS09-TR-101',
      vehicleModel: 'Force Traveller (16-seater)',
      driverName: 'Suresh Kumar',
      driverPhone: '+919876543201',
      routeCode: 'M-01',
      routeName: 'Kondapur & Botanical Garden Loop',
      studentsOnboard: 16,
      capacity: 16,
      eta: '07:55 AM (Arrived)',
      status: 'in_bay',
      safeKeyVerified: true,
    },
    {
      bay: 'Bay 02',
      vehicleNumber: 'TS09-TR-102',
      vehicleModel: 'Bajaj RE Electric (6-seater)',
      driverName: 'Ravi Kumar',
      driverPhone: '+919876543210',
      routeCode: 'M-04',
      routeName: 'Jubilee Hills & Rainbow Meadows',
      studentsOnboard: 5,
      capacity: 6,
      eta: '08:08 AM',
      status: 'en_route',
      safeKeyVerified: true,
    },
    {
      bay: 'Bay 03',
      vehicleNumber: 'TS09-TR-105',
      vehicleModel: 'Tata Winger (12-seater)',
      driverName: 'Venkatesh Rao',
      driverPhone: '+919876543203',
      routeCode: 'M-02',
      routeName: 'Madhapur West & Durgam Cheruvu',
      studentsOnboard: 11,
      capacity: 12,
      eta: '08:14 AM (+8m Delay)',
      status: 'delayed',
      safeKeyVerified: false,
    },
    {
      bay: 'Bay 04',
      vehicleNumber: 'TS09-TR-108',
      vehicleModel: 'Force Urbania (12-seater)',
      driverName: 'Mohammed Azhar',
      driverPhone: '+919876543222',
      routeCode: 'M-03',
      routeName: 'Gachibowli Financial District',
      studentsOnboard: 12,
      capacity: 12,
      eta: '07:48 AM (Cleared)',
      status: 'cleared',
      safeKeyVerified: true,
    },
  ]);

  const [studentRoster] = useState<StudentAttendance[]>([
    {
      id: 'st-1',
      name: 'Aarav Sharma',
      grade: 'Grade 3A',
      vehicleNumber: 'TS09-TR-102',
      routeCode: 'M-04',
      status: 'in_transit',
      guardianName: 'Priya Sharma',
      safeKeyMatched: true,
    },
    {
      id: 'st-2',
      name: 'Kavya Reddy',
      grade: 'Grade 3A',
      vehicleNumber: 'TS09-TR-102',
      routeCode: 'M-04',
      status: 'in_transit',
      guardianName: 'Suresh Reddy',
      safeKeyMatched: true,
    },
    {
      id: 'st-3',
      name: 'Aarav Patel',
      grade: 'Grade 4B',
      vehicleNumber: 'TS09-TR-101',
      routeCode: 'M-01',
      status: 'arrived',
      arrivalTime: '07:56 AM',
      guardianName: 'Karan Patel',
      safeKeyMatched: true,
    },
    {
      id: 'st-4',
      name: 'Ananya Sharma',
      grade: 'Grade 1B',
      vehicleNumber: 'TS09-TR-108',
      routeCode: 'M-03',
      status: 'arrived',
      arrivalTime: '07:50 AM',
      guardianName: 'Priya Sharma',
      safeKeyMatched: true,
    },
    {
      id: 'st-5',
      name: 'Rohan Verma',
      grade: 'Grade 2C',
      vehicleNumber: 'TS09-TR-105',
      routeCode: 'M-02',
      status: 'in_transit',
      guardianName: 'Sunita Verma',
      safeKeyMatched: true,
    },
    {
      id: 'st-6',
      name: 'Zoya Khan',
      grade: 'Grade 5A',
      vehicleNumber: 'TS09-TR-101',
      routeCode: 'M-01',
      status: 'absent_reported',
      guardianName: 'Farhan Khan',
      safeKeyMatched: false,
    },
  ]);

  const filteredVehicles = bayVehicles.filter(v => {
    if (filterBay !== 'all' && v.bay.toLowerCase().replace(' ', '') !== filterBay) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return v.vehicleNumber.toLowerCase().includes(q) ||
             v.driverName.toLowerCase().includes(q) ||
             v.routeName.toLowerCase().includes(q);
    }
    return true;
  });

  const handleVerifyGateArrival = (vehicleNum: string) => {
    setBayVehicles(prev =>
      prev.map(v => v.vehicleNumber === vehicleNum ? { ...v, status: 'in_bay', eta: 'Just Arrived' } : v)
    );
  };

  return (
    <div className="space-y-6 font-sans text-slate-900 pb-12">
      {/* 1. Operational Top Bar: Clean, high contrast, non-AI */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              School Gate Console • Gate 2 West Bay
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">
              Olive Mount, Gachibowli
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Live intake monitoring, SafeKey student handover verification, and loading bay control.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-500">Active Intake Window</div>
              <div className="text-sm font-bold text-emerald-800">07:45 – 08:30 AM</div>
            </div>
            <Link
              href="/releases"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 text-white rounded-md text-xs font-semibold hover:bg-emerald-900 transition-colors"
            >
              Afternoon Release Console →
            </Link>
          </div>
        </div>

        {/* 2. Operational Metrics Strip (High Density, NO identical card blobs!) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block">Fleet Active</span>
            <span className="text-lg font-bold text-slate-900">4 Vehicles</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block">Students in Transit</span>
            <span className="text-lg font-bold text-slate-900">18 Students</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
            <span className="text-emerald-800 font-medium block">Safely Arrived</span>
            <span className="text-lg font-bold text-emerald-800">28 On Campus</span>
          </div>
          <div className="p-3 bg-amber-50 rounded border border-amber-200">
            <span className="text-amber-800 font-medium block">Route Delays</span>
            <span className="text-lg font-bold text-amber-800">1 Vehicle (+8m)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 block">Absences Today</span>
            <span className="text-lg font-bold text-slate-900">1 Verified</span>
          </div>
        </div>
      </div>

      {/* 3. Live Bus Bay Queue & Operations (Table-first UX as requested in Section 12) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Active Bus Bay Arrivals &amp; Vehicle Queue
            </h2>
            <p className="text-xs text-slate-500">
              Real-time gate arrivals, GPS proximity, and staff verification status.
            </p>
          </div>

          {/* Bay Filter & Search */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Filter by vehicle or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-emerald-700 w-full sm:w-56"
            />
            <select
              value={filterBay}
              onChange={(e) => setFilterBay(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700"
            >
              <option value="all">All Bays</option>
              <option value="bay01">Bay 01</option>
              <option value="bay02">Bay 02</option>
              <option value="bay03">Bay 03</option>
              <option value="bay04">Bay 04</option>
            </select>
          </div>
        </div>

        {/* Operational Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Bay</th>
                <th className="py-2.5 px-4">Vehicle &amp; Model</th>
                <th className="py-2.5 px-4">Driver &amp; Contact</th>
                <th className="py-2.5 px-4">Route Name</th>
                <th className="py-2.5 px-4">Students</th>
                <th className="py-2.5 px-4">Gate ETA</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredVehicles.map((v) => (
                <tr key={v.vehicleNumber} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{v.bay}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">{v.vehicleNumber}</span>
                    <span className="block text-[11px] text-slate-500">{v.vehicleModel}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-900">{v.driverName}</span>
                    <a href={`tel:${v.driverPhone}`} className="block text-[11px] text-emerald-700 hover:underline">
                      {v.driverPhone}
                    </a>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">{v.routeCode}</span>
                    <span className="block text-[11px] text-slate-500">{v.routeName}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {v.studentsOnboard} / {v.capacity}
                  </td>
                  <td className="py-3 px-4 font-medium">
                    {v.eta}
                  </td>
                  <td className="py-3 px-4">
                    {v.status === 'in_bay' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        In Bay (Disembarking)
                      </span>
                    )}
                    {v.status === 'en_route' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        En Route
                      </span>
                    )}
                    {v.status === 'delayed' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        Delayed (+8m)
                      </span>
                    )}
                    {v.status === 'cleared' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Cleared Bay
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {v.status === 'en_route' || v.status === 'delayed' ? (
                      <button
                        onClick={() => handleVerifyGateArrival(v.vehicleNumber)}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-medium transition-colors"
                      >
                        Confirm Arrival
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Verified</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Student Intake & SafeKey Handover Roster (Section 12) */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Student Attendance &amp; SafeKey Intake Roster
            </h2>
            <p className="text-xs text-slate-500">
              Individual student verification log matching parent app status with campus arrival.
            </p>
          </div>
          <Link href="/roster" className="text-xs font-semibold text-emerald-800 hover:underline">
            View Full Student Directory →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Student</th>
                <th className="py-2.5 px-4">Grade</th>
                <th className="py-2.5 px-4">Vehicle &amp; Route</th>
                <th className="py-2.5 px-4">Primary Guardian</th>
                <th className="py-2.5 px-4">SafeKey Verified</th>
                <th className="py-2.5 px-4">Intake Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {studentRoster.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 text-slate-600">{s.grade}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900">{s.vehicleNumber}</span>
                    <span className="text-slate-500"> ({s.routeCode})</span>
                  </td>
                  <td className="py-3 px-4">{s.guardianName}</td>
                  <td className="py-3 px-4">
                    {s.safeKeyMatched ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        ✓ Verified at Boarding
                      </span>
                    ) : (
                      <span className="text-slate-400">N/A (Absence)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {s.status === 'arrived' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        On Campus ({s.arrivalTime})
                      </span>
                    )}
                    {s.status === 'in_transit' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
                        In Transit
                      </span>
                    )}
                    {s.status === 'absent_reported' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600">
                        Absence Reported
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
