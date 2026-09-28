'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Search } from 'lucide-react';

interface StudentItem {
  id: string;
  name: string;
  grade: string;
  school: string;
  route: string;
  pickupStop: string;
  guardianContact: string;
  status: 'boarded' | 'in_transit' | 'at_school' | 'scheduled' | 'absent';
}

export default function AdminStudentsPage() {
  const [students] = useState<StudentItem[]>([
    {
      id: '8c898a16-57f9-4cb1-92f7-dbc87d5adb7c',
      name: 'Aarav Sharma',
      grade: 'Grade 3A',
      school: 'Olive Mount Global School',
      route: 'Route M-01',
      pickupStop: 'Rainbow Vistas Stop #1',
      guardianContact: '+91 98765 43210 (Guardian)',
      status: 'at_school',
    },
    {
      id: 'st-2',
      name: 'Diya Reddy',
      grade: 'Grade 4B',
      school: 'Olive Mount Global School',
      route: 'Route M-01',
      pickupStop: 'My Home Bhooja Gate #2',
      guardianContact: '+91 98765 43211 (Guardian)',
      status: 'at_school',
    },
    {
      id: 'st-3',
      name: 'Reyansh Varma',
      grade: 'Grade 2',
      school: 'Olive Mount Global School',
      route: 'Route M-02',
      pickupStop: 'Aparna Sarovar Entrance',
      guardianContact: '+91 98765 43212 (Guardian)',
      status: 'scheduled',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const filtered = students.filter((st) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        st.name.toLowerCase().includes(q) ||
        st.school.toLowerCase().includes(q) ||
        st.route.toLowerCase().includes(q) ||
        st.pickupStop.toLowerCase().includes(q)
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
            <h1 className="text-base font-extrabold text-white">Student Transportation Directory</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
              {filtered.length} Registered Students
            </span>
          </div>
          <p className="text-slate-400 text-[11px] mt-0.5 pl-7">
            Role-scoped child manifest, authorized guardian pickup contacts, SafeKey boarding verification status.
          </p>
        </div>
      </div>

      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by student name, school, route, or pickup stop..."
          className="bg-transparent text-xs text-white placeholder:text-slate-500 w-full focus:outline-none"
        />
      </div>

      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Grade</th>
                <th className="py-3 px-4">School Campus</th>
                <th className="py-3 px-4">Assigned Route</th>
                <th className="py-3 px-4">Pickup Geofence</th>
                <th className="py-3 px-4">SafeKey Contact</th>
                <th className="py-3 px-4">Transit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium">
              {filtered.map((st) => (
                <tr key={st.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-white">{st.name}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">{st.grade}</td>
                  <td className="py-3.5 px-4 text-slate-200 font-semibold">{st.school}</td>
                  <td className="py-3.5 px-4 text-emerald-400 font-bold">{st.route}</td>
                  <td className="py-3.5 px-4 text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                    <span>{st.pickupStop}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{st.guardianContact}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        st.status === 'at_school'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : st.status === 'boarded'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {st.status.replace('_', ' ')}
                    </span>
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
