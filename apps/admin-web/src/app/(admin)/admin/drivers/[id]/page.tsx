'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Phone,
} from 'lucide-react';

export default function AdminDriverDetailPage() {
  const params = useParams();
  const driverId = params.id as string;

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto text-slate-100 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/admin/drivers" className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white">Ravi Kumar</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                Approved Driver
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">Driver ID: {driverId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:+919876500001"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Call Driver (+91 98765 00001)</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Commercial License</span>
          <p className="text-sm font-extrabold text-white font-mono">TS09-DL-2018-00912</p>
          <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 inline" /> Verified Valid
          </p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Assigned Vehicle</span>
          <p className="text-sm font-extrabold text-white font-mono">TS09-TR-102</p>
          <p className="text-[11px] text-slate-400">Force Traveller 18-Seater (Van)</p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Current Operation</span>
          <p className="text-sm font-extrabold text-white">Route M-01 Morning</p>
          <p className="text-[11px] text-slate-400">Olive Mount Global School</p>
        </div>

        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Safety Rating</span>
          <p className="text-sm font-extrabold text-emerald-400 font-mono">100% On-Time</p>
          <p className="text-[11px] text-slate-400">0 Safety Violations</p>
        </div>
      </div>

      {/* History & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-3">
          <h3 className="font-extrabold text-sm text-white border-b border-slate-800 pb-2">Verification Records</h3>
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-200">Police Background Verification</p>
                <p className="text-[11px] text-slate-400">Clear criminal record certificate on file</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Verified</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-200">Commercial Badge &amp; PSV Authorization</p>
                <p className="text-[11px] text-slate-400">Valid badge for school child transport</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Verified</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-3">
          <h3 className="font-extrabold text-sm text-white border-b border-slate-800 pb-2">Recent Run History</h3>
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-200">Route M-01 Morning Pickup</p>
                <p className="text-[11px] text-slate-400">Today · 16 / 16 Students Transported</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Completed</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-200">Route M-01 Afternoon Return</p>
                <p className="text-[11px] text-slate-400">Yesterday · 16 / 16 Students Transported</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
