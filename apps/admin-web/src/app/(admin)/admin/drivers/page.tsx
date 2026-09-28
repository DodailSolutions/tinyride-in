'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Search } from 'lucide-react';

interface DriverItem {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  state: 'approved' | 'pending' | 'suspended';
  assignedVehicle: string;
  currentTrip?: string;
  gpsStatus: 'active' | 'idle' | 'offline';
  joinedDate: string;
}

export default function AdminDriversPage() {
  const [drivers] = useState<DriverItem[]>([
    {
      id: 'a534e5bf-cd4c-456f-9e15-dc5701a010a0',
      name: 'Ravi Kumar',
      phone: '+91 98765 00001',
      licenseNumber: 'TS09-DL-2018-00912',
      state: 'approved',
      assignedVehicle: 'TS09-TR-102 (Force Traveller)',
      currentTrip: 'Route M-01 (Olive Mount)',
      gpsStatus: 'active',
      joinedDate: '28 Sep 2026',
    },
    {
      id: 'd-2',
      name: 'Venkatesh Rao',
      phone: '+91 98765 43203',
      licenseNumber: 'TS09-DL-2019-01124',
      state: 'approved',
      assignedVehicle: 'TS09-TR-105 (Bajaj RE Auto)',
      currentTrip: 'Route M-02 (Olive Mount)',
      gpsStatus: 'active',
      joinedDate: '15 Sep 2026',
    },
    {
      id: 'd-3',
      name: 'Anand Varma',
      phone: '+91 98765 43204',
      licenseNumber: 'TS10-DL-2021-04581',
      state: 'pending',
      assignedVehicle: 'Unassigned',
      gpsStatus: 'offline',
      joinedDate: 'Today',
    },
  ]);

  const [filterState, setFilterState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = drivers.filter((d) => {
    if (filterState !== 'all' && d.state !== filterState) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4 max-w-[1520px] mx-auto text-slate-100 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-extrabold text-white">Driver Operations Roster</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {filtered.length} Registered Drivers
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            KYC background verification, commercial license validity, vehicle pairing, and live telemetry tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved &amp; Active</option>
            <option value="pending">Pending Verification</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by driver name, commercial license, or mobile phone..."
          className="bg-transparent text-xs text-white placeholder:text-slate-500 w-full focus:outline-none"
        />
      </div>

      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Driver Name</th>
                <th className="py-3 px-4">Contact Phone</th>
                <th className="py-3 px-4">Commercial License</th>
                <th className="py-3 px-4">Assigned Vehicle</th>
                <th className="py-3 px-4">Current Run</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-white text-xs block">{d.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">ID: {d.id.slice(0, 8)}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{d.phone}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{d.licenseNumber}</td>
                  <td className="py-3.5 px-4 text-slate-300 font-semibold">{d.assignedVehicle}</td>
                  <td className="py-3.5 px-4">
                    {d.currentTrip ? (
                      <span className="text-emerald-400 font-semibold">{d.currentTrip}</span>
                    ) : (
                      <span className="text-slate-500">Off duty</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        d.state === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : d.state === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {d.state}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/admin/drivers/${d.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs font-semibold"
                    >
                      <span>Profile</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>
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
