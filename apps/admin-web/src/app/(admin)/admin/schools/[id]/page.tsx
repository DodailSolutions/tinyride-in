'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
} from 'lucide-react';

export default function AdminSchoolDetailPage() {
  const params = useParams();
  const schoolId = params.id as string;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto text-slate-100 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/admin/schools" className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white">Olive Mount Global School</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Active Partner Campus
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Nalanda Nagar, Upperpally, Hyderabad 500048 · ID: {schoolId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:+914024001234"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Call Transport Office (+91 40 2400 1234)</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Morning Bell</span>
          <p className="text-sm font-extrabold text-white">08:15 AM Arrival</p>
          <p className="text-[11px] text-slate-400">Gate Bay #2 Open</p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Afternoon Dispersal</span>
          <p className="text-sm font-extrabold text-white">03:30 PM Release</p>
          <p className="text-[11px] text-slate-400">SafeKey staff check-in</p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Fleet</span>
          <p className="text-sm font-extrabold text-white">4 Vehicles</p>
          <p className="text-[11px] text-emerald-400 font-semibold">100% GPS online</p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Students Enrolled</span>
          <p className="text-sm font-extrabold text-white">38 Transport Pass</p>
          <p className="text-[11px] text-slate-400">Pre-Primary to Grade 8</p>
        </div>
      </div>

      {/* Routes Assigned to School */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-3">
        <h3 className="font-extrabold text-sm text-white border-b border-slate-800 pb-2">Dedicated Route Network</h3>
        <div className="space-y-2">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white">Route M-01</span>
                <span className="text-slate-400">Jubilee Hills &amp; Attapur Express</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Driver: Ravi Kumar · TS09-TR-102 (Force Traveller) · 16 Students</p>
            </div>
            <Link
              href="/admin/trips"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
            >
              Monitor Run
            </Link>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white">Route M-02</span>
                <span className="text-slate-400">Mehdipatnam &amp; Tolichowki Loop</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Driver: Venkatesh Rao · TS09-TR-105 (Auto) · 6 Students</p>
            </div>
            <Link
              href="/admin/trips"
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold"
            >
              Monitor Run
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
