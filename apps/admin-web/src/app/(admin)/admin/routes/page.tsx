'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';

export default function AdminRoutesPage() {
  const [routes] = useState([
    {
      id: '0401f23d-95e0-48f9-9b1f-04a9ad902f7a',
      code: 'M-01',
      name: 'Upperpally & Attapur Morning Loop',
      school: 'Olive Mount Global School',
      stopsCount: 8,
      distanceKm: '14.2 km',
      durationMin: '38 min',
      assignedDriver: 'Ravi Kumar',
      assignedVehicle: 'TS09-TR-102 (Force Traveller)',
      status: 'active',
    },
    {
      id: 'r-2',
      code: 'M-02',
      name: 'Tolichowki & Mehdipatnam Feeder',
      school: 'Olive Mount Global School',
      stopsCount: 5,
      distanceKm: '9.6 km',
      durationMin: '25 min',
      assignedDriver: 'Venkatesh Rao',
      assignedVehicle: 'TS09-TR-105 (Bajaj RE Auto)',
      status: 'active',
    },
    {
      id: 'r-3',
      code: 'M-04',
      name: 'Khajaguda Express Circuit',
      school: 'Delhi Public School, Khajaguda',
      stopsCount: 11,
      distanceKm: '18.5 km',
      durationMin: '45 min',
      assignedDriver: 'Mohammed Azhar',
      assignedVehicle: 'TS09-TR-108 (Force Urbania)',
      status: 'active',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const filtered = routes.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.school.toLowerCase().includes(q);
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
            <h1 className="text-base font-extrabold text-white">Transit Routes &amp; Stop Sequences</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {filtered.length} Active Corridors
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Pre-computed geofenced route corridors, stop coordinates, and turn-by-turn safe paths.
          </p>
        </div>
      </div>

      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search routes by code, name, or school..."
          className="bg-transparent text-xs text-white placeholder:text-slate-500 w-full focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="p-5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-sm font-mono border border-emerald-500/30">
                  {r.code}
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-400">{r.status}</span>
              </div>
              <h3 className="font-extrabold text-sm text-white mt-3">{r.name}</h3>
              <p className="text-[11px] text-slate-400 mt-1">{r.school}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Stops</span>
                <span className="font-bold text-white text-sm">{r.stopsCount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Distance</span>
                <span className="font-bold text-white text-sm">{r.distanceKm}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Est. Time</span>
                <span className="font-bold text-emerald-400 text-sm">{r.durationMin}</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <div>Driver: <strong className="text-slate-200">{r.assignedDriver}</strong></div>
              <div>Vehicle: <span className="font-mono text-slate-300">{r.assignedVehicle}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
