'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, MapPin, Phone, School, Search } from 'lucide-react';

interface SchoolItem {
  id: string;
  name: string;
  address: string;
  phone: string;
  activeRoutes: number;
  assignedVehicles: number;
  activeDrivers: number;
  studentsCount: number;
  activeTrips: number;
  status: string;
}

export default function AdminSchoolsPage() {
  const [schools] = useState<SchoolItem[]>([
    {
      id: '1a9820c6-2ea0-45ce-bb2a-dcb71205aab5',
      name: 'Olive Mount Global School',
      address: 'Nalanda Nagar, Upperpally, Hyderabad, Telangana 500048',
      phone: '+91 40 2400 1234',
      activeRoutes: 4,
      assignedVehicles: 4,
      activeDrivers: 4,
      studentsCount: 38,
      activeTrips: 2,
      status: 'verified',
    },
    {
      id: 'sch-2',
      name: 'Delhi Public School, Khajaguda',
      address: 'Survey No 74, Khajaguda Village, Hyderabad 500008',
      phone: '+91 40 2980 6765',
      activeRoutes: 6,
      assignedVehicles: 6,
      activeDrivers: 6,
      studentsCount: 72,
      activeTrips: 1,
      status: 'verified',
    },
    {
      id: 'sch-3',
      name: 'Chirec International School',
      address: '1-55/12, CHIREC Avenue, Kondapur, Hyderabad 500084',
      phone: '+91 40 4476 0999',
      activeRoutes: 5,
      assignedVehicles: 5,
      activeDrivers: 5,
      studentsCount: 65,
      activeTrips: 0,
      status: 'verified',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const filtered = schools.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q);
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
            <h1 className="text-base font-extrabold text-white">Partner School Campuses</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {filtered.length} Campuses Active
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Campus dispatch bays, bell times, gate arrivals, and dedicated school route allocations.
          </p>
        </div>
      </div>

      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by school name or location address..."
          className="bg-transparent text-xs text-white placeholder:text-slate-500 w-full focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="p-5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4 flex flex-col justify-between shadow-lg"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center font-bold flex-shrink-0">
                  <School className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                  {s.status}
                </span>
              </div>
              <h3 className="font-extrabold text-sm text-white mt-3">{s.name}</h3>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                <span className="truncate">{s.address}</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Routes</span>
                <span className="font-bold text-white text-sm">{s.activeRoutes}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Vehicles</span>
                <span className="font-bold text-white text-sm">{s.assignedVehicles}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Students</span>
                <span className="font-bold text-emerald-400 text-sm">{s.studentsCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>{s.phone}</span>
              </span>
              <Link
                href={`/admin/schools/${s.id}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                <span>Console</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
