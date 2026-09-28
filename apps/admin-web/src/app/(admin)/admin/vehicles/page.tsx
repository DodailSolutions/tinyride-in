'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Search } from 'lucide-react';

interface VehicleItem {
  id: string;
  registrationNumber: string;
  type: string;
  makeModel: string;
  seatingCapacity: number;
  assignedDriver: string;
  school: string;
  state: string;
  gpsActive: boolean;
}

export default function AdminVehiclesPage() {
  const [vehicles] = useState<VehicleItem[]>([
    {
      id: 'ffd76fbe-b13a-4726-ae7f-ea6e27e23975',
      registrationNumber: 'TS09-TR-102',
      type: 'van',
      makeModel: 'Force Traveller 18-Seater',
      seatingCapacity: 18,
      assignedDriver: 'Ravi Kumar',
      school: 'Olive Mount Global School',
      state: 'approved',
      gpsActive: true,
    },
    {
      id: 'v-2',
      registrationNumber: 'TS09-TR-105',
      type: 'auto_rickshaw',
      makeModel: 'Bajaj RE Electric 6-Seater',
      seatingCapacity: 6,
      assignedDriver: 'Venkatesh Rao',
      school: 'Olive Mount Global School',
      state: 'approved',
      gpsActive: true,
    },
    {
      id: 'v-3',
      registrationNumber: 'TS10-TR-114',
      type: 'school_bus',
      makeModel: 'Ashok Leyland Sunshine (32-seater)',
      seatingCapacity: 32,
      assignedDriver: 'K. Srinivas',
      school: 'Delhi Public School, Nacharam',
      state: 'approved',
      gpsActive: false,
    },
  ]);

  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = vehicles.filter((v) => {
    if (filterType !== 'all' && v.type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.registrationNumber.toLowerCase().includes(q) ||
        v.makeModel.toLowerCase().includes(q) ||
        v.assignedDriver.toLowerCase().includes(q)
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
            <h1 className="text-base font-extrabold text-white">Registered Transportation Fleet</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {filtered.length} Vehicles
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            School bus compliance, speed governor certification, fitness validity, and GPS tracking hardware.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 text-slate-300 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
          >
            <option value="all">All Vehicle Types</option>
            <option value="auto_rickshaw">Auto-rickshaws</option>
            <option value="van">Minibuses / Vans</option>
            <option value="school_bus">School Buses</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by registration plate, vehicle model, or driver..."
          className="bg-transparent text-xs text-white placeholder:text-slate-500 w-full focus:outline-none"
        />
      </div>

      {/* Vehicles Content: Mobile Cards (< md) + Desktop Table (>= md) */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {/* Mobile View: Operational Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-850 p-3 space-y-3">
          {filtered.length > 0 ? (
            filtered.map((v) => (
              <div
                key={v.id}
                className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-black text-sm text-white font-mono block">{v.registrationNumber}</span>
                    <span className="text-[11px] text-slate-300 font-medium">{v.makeModel}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                      v.gpsActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${v.gpsActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                    {v.gpsActive ? 'GPS Online' : 'Offline'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950/60 rounded-lg border border-slate-850 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Driver &amp; School</span>
                    <span className="font-semibold text-slate-200 block truncate">{v.assignedDriver}</span>
                    <span className="text-slate-400 text-[10px] block truncate">{v.school}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Type &amp; Capacity</span>
                    <span className="font-bold text-white capitalize">{v.type === 'auto_rickshaw' ? 'Auto' : v.type}</span>
                    <span className="text-slate-400 font-mono text-[10px] block">{v.seatingCapacity} Seats</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Compliant
                  </span>
                  <Link
                    href={`/admin/vehicles/${v.id}`}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 min-h-[40px]"
                  >
                    <span>View Vehicle</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-500">
              <p className="font-bold text-slate-300">No Vehicles Match Filter</p>
              <p className="text-[11px] mt-1">Adjust search or type parameters.</p>
            </div>
          )}
        </div>

        {/* Desktop View: Full Data Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Registration</th>
                <th className="py-3 px-4">Type &amp; Model</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Assigned Driver</th>
                <th className="py-3 px-4">School</th>
                <th className="py-3 px-4">GPS Hardware</th>
                <th className="py-3 px-4">Compliance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-extrabold text-white">{v.registrationNumber}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-200 block">{v.makeModel}</span>
                    <span className="text-[10px] text-slate-500 uppercase">
                      {v.type === 'auto_rickshaw' ? 'Auto' : v.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{v.seatingCapacity} seats</td>
                  <td className="py-3.5 px-4 text-slate-200 font-semibold">{v.assignedDriver}</td>
                  <td className="py-3.5 px-4 text-slate-300">{v.school}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                        v.gpsActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${v.gpsActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                      {v.gpsActive ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Approved
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href={`/admin/vehicles/${v.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs font-semibold"
                    >
                      <span>Details</span>
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
